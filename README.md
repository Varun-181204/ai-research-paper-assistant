# AI Research Paper Assistant

A production-quality AI-powered research paper analysis and RAG platform.

## Architecture Overview

```
                      +-----------------------------+
                      |   React + Vite Frontend     |
                      |   (Tailwind CSS, Router)    |
                      +--------------+--------------+
                                     |
                                REST API
                                     |
                                     v
                      +-----------------------------+
                      |       FastAPI Backend       |
                      | (Pydantic, SQLAlchemy 2.0)  |
                      +------+---------------+------+
                             |               |
              +--------------+               +---------------+
              |                                              |
              v                                              v
+-----------------------------+               +-----------------------------+
|    PostgreSQL Database      |               |     Vector DB (ChromaDB)    |
| (Papers, Chunks, Notes, DB) |               |  (Page Embeddings, Chunks)  |
+-----------------------------+               +--------------+--------------+
                                                             ^
                                                             |
                                              +--------------+--------------+
                                              |      Google Gemini API      |
                                              | (Embeddings & Generation)   |
                                              +-----------------------------+
```

## Core Pipeline

1. **PDF Processing**: Text extraction with page-level preservation via PyMuPDF (`fitz`).
2. **Page-Aware Chunking**: Semantic boundaries with page metadata.
3. **Embeddings & Vector Store**: Dense vectors generated via Google Embedding models and indexed in ChromaDB.
4. **Semantic Retrieval & Grounded RAG**: Context-grounded synthesis with explicit page-level citations.
5. **Research Synthesis**: Multi-paper comparison, structured paper analysis, and literature review.

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Psycopg3.
- **Frontend**: React 18, Vite, Tailwind CSS, React Router, Axios, Lucide Icons.
- **AI / RAG**: Google Gemini API (`gemini-2.5-flash`, `text-embedding-004`), ChromaDB.
- **Database**: PostgreSQL (with SQLite zero-setup dev fallback).
- **Deployment**: Docker & Docker Compose.

## Project Structure

```
ai-research-paper-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint
│   │   ├── config.py            # Pydantic BaseSettings & environment configs
│   │   ├── database.py          # SQLAlchemy engine, session, & DB lifecycles
│   │   ├── models/              # Relational models (Paper, Chunk, Note, Conversation)
│   │   ├── schemas/             # Pydantic request & response schemas
│   │   ├── routers/             # API route endpoints (Health, Papers, Chat, etc.)
│   │   └── services/            # Core business & RAG services (PDF, embeddings, LLM)
│   ├── tests/                   # Pytest test suite
│   ├── requirements.txt         # Backend Python dependencies
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Application page views
│   │   ├── layouts/             # Master app shell & navigation layout
│   │   ├── services/            # Axios API clients
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
py -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend development server
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`.
- Health Check: `http://localhost:8000/api/health`
- Interactive Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run frontend development server
npm run dev
```

The frontend application will be available at `http://localhost:5173`.

### 3. Docker Compose (Full Stack)

```bash
docker-compose up --build
```
