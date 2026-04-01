from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from pathlib import Path
from io import BytesIO
import os
import numpy as np
import torch
import nltk
from nltk.tokenize import sent_tokenize
from docx import Document
from pypdf import PdfReader

app = FastAPI(title="AI Text Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str


INVALID_FILE_MESSAGE = (
    "Invalid file: encrypted, protected, unreadable, or unsupported. "
    "Please upload an accessible TXT, PDF, or DOCX file."
)
ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx"}


def ensure_punkt():
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt", quiet=True)
    try:
        nltk.data.find("tokenizers/punkt_tab")
    except LookupError:
        nltk.download("punkt_tab", quiet=True)


ensure_punkt()

DEFAULT_MODEL_DIR = Path(__file__).resolve().parent / "ai_text_detector_model"
MODEL_DIR = Path(os.environ.get("MODEL_DIR", DEFAULT_MODEL_DIR))

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()


def resolve_label_ids():
    id2label = getattr(model.config, "id2label", {}) or {}
    id2label = {int(k): v for k, v in id2label.items()}
    ai_id = None
    human_id = None
    for idx, label in id2label.items():
        label_lower = str(label).lower()
        if "ai" in label_lower:
            ai_id = idx
        if "human" in label_lower:
            human_id = idx
    if ai_id is None or human_id is None:
        if model.config.num_labels >= 2:
            human_id = 0
            ai_id = 1
        else:
            human_id = 0
            ai_id = 0
    return ai_id, human_id


AI_ID, HUMAN_ID = resolve_label_ids()


def extract_text_from_txt(contents: bytes) -> str:
    return contents.decode("utf-8", errors="replace").strip()


def extract_text_from_pdf(contents: bytes) -> str:
    reader = PdfReader(BytesIO(contents))
    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as exc:
            raise ValueError("encrypted") from exc
        if reader.is_encrypted:
            raise ValueError("encrypted")
    pages = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        pages.append(page_text)
    return "\n".join(pages).strip()


def extract_text_from_docx(contents: bytes) -> str:
    doc = Document(BytesIO(contents))
    text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return text.strip()


def predict_texts(texts):
    encoded = tokenizer(
        texts,
        truncation=True,
        padding=True,
        return_tensors="pt",
    )
    encoded = {k: v.to(device) for k, v in encoded.items()}
    with torch.no_grad():
        logits = model(**encoded).logits
    probs = np.asarray(torch.softmax(logits, dim=-1).cpu().numpy())
    results = []
    for text, row in zip(texts, probs):
        ai_prob = float(row[AI_ID]) if AI_ID < len(row) else 0.0
        human_prob = float(row[HUMAN_ID]) if HUMAN_ID < len(row) else 0.0
        label = "AI" if ai_prob >= human_prob else "Human"
        confidence = float(max(ai_prob, human_prob))
        results.append(
            {
                "text": text,
                "label": label,
                "ai_probability": ai_prob,
                "human_probability": human_prob,
                "confidence": confidence,
            }
        )
    return results


@app.get("/")
def health_check():
    return {"message": "AI Text Detector API is running"}


@app.post("/analyze-text")
def analyze_text(payload: AnalyzeRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    sentences = [s.strip() for s in sent_tokenize(text) if s.strip()]
    if not sentences:
        sentences = [text]
    sentence_results = predict_texts(sentences)
    ai_sentence_count = sum(1 for sentence in sentence_results if sentence["label"] == "AI")
    total_sentences = len(sentence_results)
    ai_sentence_percentage = (ai_sentence_count / total_sentences) if total_sentences else 0.0
    ai_avg = float(np.mean([s["ai_probability"] for s in sentence_results])) if sentence_results else 0.0
    human_avg = float(
        np.mean([s["human_probability"] for s in sentence_results])
    ) if sentence_results else 0.0
    overall_label = "AI" if ai_sentence_percentage >= 0.5 else "Human"
    confidence = float(max(ai_avg, human_avg))
    return {
        "overall": {
            "label": overall_label,
            "ai_probability": ai_avg,
            "human_probability": human_avg,
            "confidence": confidence,
            "ai_sentence_percentage": ai_sentence_percentage,
            "ai_sentence_count": ai_sentence_count,
            "total_sentences": total_sentences,
        },
        "sentences": sentence_results,
    }


@app.post("/extract-file-text")
async def extract_file_text(file: UploadFile = File(...)):
    if not file or not file.filename:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": INVALID_FILE_MESSAGE},
        )

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": INVALID_FILE_MESSAGE},
        )

    try:
        contents = await file.read()
        if not contents:
            raise ValueError("empty")
        if extension == ".txt":
            extracted_text = extract_text_from_txt(contents)
        elif extension == ".pdf":
            extracted_text = extract_text_from_pdf(contents)
        else:
            extracted_text = extract_text_from_docx(contents)

        if not extracted_text:
            raise ValueError("empty")
    except Exception:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": INVALID_FILE_MESSAGE},
        )

    return {
        "success": True,
        "filename": file.filename,
        "text": extracted_text,
    }
