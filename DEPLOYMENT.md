# Fact Checker AI Deployment Guide

Fact Checker AI is a scalable Artificial Intelligence + Human Intelligence Election Verification and Information Intelligence Platform designed to run standalone using SQLite and FastAPI BackgroundTasks for simple, reliable, and high-performance server footprint.

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **OpenAI API Key** (for advanced transcription and claim validation analysis)
- **Serper API Key** (for OSINT web intelligence scraping)
- **Reality Defender API Key** (for advanced media forensics deepfake detection)

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
   DATABASE_URL=sqlite:///./factchecker.db
   SECRET_KEY=your-secret-key-here
   OPENAI_API_KEY=your-openai-key
   SERPER_API_KEY=your-serper-key
   REALITY_DEFENDER_API_KEY=your-reality-defender-key
   ```

5. Run the backend:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The first run will automatically create the database and a default admin user:
   - **Email:** `admin@factchecker.com`
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
Create `/etc/systemd/system/factchecker-backend.service`:
```ini
[Unit]
Description=Fact Checker AI Backend
After=network.target

[Service]
User=your-user
WorkingDirectory=/path/to/factchecker-lite/backend
ExecStart=/path/to/factchecker-lite/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
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
    server_name factchecker.yourdomain.com;

    location / {
        root /path/to/factchecker-lite/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
