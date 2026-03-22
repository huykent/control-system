@echo off
echo ==========================================
echo Starting LAN Control System
echo ==========================================

echo Starting Backend on port 3000...
start "Backend Server" cmd /k "npm run dev"

echo Starting Frontend on port 5173...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Both services have been started in new windows!
echo Close those windows to stop the servers.
pause
