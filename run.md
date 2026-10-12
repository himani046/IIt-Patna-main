---
description: Start the Healthcare Scanner app
---
To run the Healthcare Scanner app, we simply need to start the FastAPI backend server, which will also serve the frontend static files.

1. Navigate to the backend directory and start Uvicorn
// turbo
`cd C:\Users\gauta\.gemini\antigravity\scratch\healthcare-scanner\backend && uvicorn main:app --host 127.0.0.1 --port 8000`

2. Open your browser and navigate to http://127.0.0.1:8000
