# PolFact Lite Deployment Guide

PolFact Lite is a standalone version of the PolFact application that does not require Docker, Redis, or PostgreSQL. It uses SQLite and FastAPI BackgroundTasks for simplicity.

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **OpenAI API Key** (for transcription and analysis)
- **Serper API Key** (for web scraping)

## Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create a `.env` file in the `backend` directory (based on `.env.example`):
   ```env
   DATABASE_URL=sqlite:///./polfact.db
   SECRET_KEY=your-secret-key-here
   OPENAI_API_KEY=your-openai-key
   SERPER_API_KEY=your-serper-key
   ```

5. Run the backend:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The first run will automatically create the database and a default admin user:
   - **Email:** `admin@polfact.com`
   - **Password:** `admin123`

## Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:8000/api/v1
   ```

4. Run the frontend:
   ```bash
   npm run dev
   ```

## Production Deployment (Linux VPS)

### 1. Backend Service (systemd)
Create `/etc/systemd/system/polfact-backend.service`:
```ini
[Unit]
Description=PolFact Lite Backend
After=network.target

[Service]
User=your-user
WorkingDirectory=/path/to/polfact-lite/backend
ExecStart=/path/to/polfact-lite/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### 2. Frontend Serve
Build the frontend:
```bash
npm run build
```
You can serve the `dist` folder using Nginx or any static file server.

Example Nginx config:
```nginx
server {
    listen 80;
    server_name polfact.yourdomain.com;

    location / {
        root /path/to/polfact-lite/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
