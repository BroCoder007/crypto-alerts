# Start Backend
Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m uvicorn backend.api:app --reload --port 8000"

# Start Data Collector (Telegram Bot + Price Tracker)
Write-Host "Starting Data Collector..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "main_script.py"

# Wait a moment
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Cyan
Set-Location frontend
npm run dev
