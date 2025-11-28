@echo off
echo Killing any existing server on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /PID %%a /F >nul 2>&1

echo Starting Backend Server...
echo Server will show live user data when forms are submitted
echo Press Ctrl+C to stop
echo.
node server.js