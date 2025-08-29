@echo off
echo Starting Loan CRM Application...

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm start"

timeout /t 3

echo Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && npm start"

echo Both servers are starting...
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
pause