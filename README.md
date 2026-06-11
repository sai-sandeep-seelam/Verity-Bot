# Verity AI 🚀

## Overview

Verity AI is a full-stack AI text detection platform built to identify whether content is likely human-written or AI-generated. The project combines a polished React frontend with a FastAPI backend that runs a locally hosted transformer model for inference.

The application supports both pasted text and uploaded documents, making it useful for academic integrity checks, content verification, and recruiter-ready portfolio demonstrations.

## Features ✨

- Modern landing page with animated 3D-style hero visuals
- Route-based navigation between landing and analyzer pages
- Paste text directly into the analyzer
- Upload `.txt`, `.pdf`, and `.docx` files for text extraction
- Sentence-level AI vs human probability scoring
- Overall confidence summary and verdict output
- Local analysis history stored in the browser
- HTML report generation and download support
- Responsive glassmorphism-inspired UI

## Tech Stack 🛠️

### Frontend
- **React 18** - Component-driven UI
- **React Router DOM** - Client-side navigation and route handling
- **Vite** - Fast development server and production build tool
- **CSS3** - Custom styling, layout, gradients, and animations

### Backend
- **Python** - Backend runtime and application logic
- **FastAPI** - REST API framework
- **Uvicorn** - ASGI server for running the API
- **Pydantic** - Request validation and data modeling
- **PyTorch** - Model inference runtime
- **Transformers** - Local tokenizer and sequence classification model loading
- **NLTK** - Sentence tokenization
- **NumPy** - Probability aggregation and scoring utilities

### File Processing
- **python-multipart** - File upload handling
- **python-docx** - DOCX parsing
- **pypdf** - PDF text extraction

## Project Structure 📁

```bash
/
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main router and page layout
│   │   ├── main.jsx                # React entry point
│   │   ├── index.css               # Global styles and design tokens
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Navigation header component
│   │   │   └── Navbar.css          # Navigation styling
│   │   ├── pages/
│   │   │   ├── Landing.jsx         # Hero page with 3D animations
│   │   │   ├── Landing.css         # Landing page styles
│   │   │   ├── Analyzer.jsx        # Text analysis interface
│   │   │   └── Analyzer.css        # Analyzer page styles
│   │   └── utils/
│   │       └── report.js           # Report generation and download
│   ├── package.json
│   ├── vite.config.js              # Vite build configuration
│   └── index.html
├── backend/
│   ├── app.py                      # FastAPI main application
│   ├── requirements.txt            # Python dependencies
│   ├── ai_text_detector_model/     # Local transformer model artifacts
│   │   ├── config.json             # Model configuration
│   │   ├── tokenizer.json          # Tokenizer weights
│   │   ├── tokenizer_config.json
│   │   ├── label_mapping.json      # AI/Human labels
│   │   └── model.safetensors       # Model weights
│   └── VerityBot/                  # Secondary backend instance (Docker-ready)
│       ├── app.py
│       ├── Dockerfile
│       ├── requirements.txt
│       └── ai_text_detector_model/
└── .gitignore
```

### Frontend
- **Landing page** – Hero section with 3D-style animations, feature cards, and process overview
- **Analyzer page** – Text input/file upload interface with real-time analysis and results display
- **Navbar** – Fixed navigation with route links and CTA buttons
- **Shared styling** – Design system with CSS variables, gradients, animations, and responsive layouts

### Backend
- **FastAPI application** – REST endpoints for text analysis and file extraction
- **Model inference** – Local transformer model loading and sentence-level classification
- **File processing** – Support for `.txt`, `.pdf`, and `.docx` extraction
- **CORS middleware** – Configured to allow cross-origin requests from the frontend


## Future Improvements 🔮

- Add user authentication and persistent user accounts
- Save analysis history to a database instead of local storage
- Add more export formats for reports
- Improve model explainability and visual insights
- Expand support for additional file formats
- Add automated frontend and backend test coverage
- Deploy with CI/CD and production hosting configuration

## Contributing 🤝

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your updates
5. Submit a pull request

Please keep contributions clear, well documented, and aligned with the existing code style.

## License 📄

This project is licensed under the **MIT License**. Replace this with your preferred license if needed.

---
