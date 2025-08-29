@echo off
echo Testing Loan CRM System...
echo.

echo 1. Testing Backend Server...
cd backend
start "Backend Server" cmd /k "npm start"
timeout /t 3

echo.
echo 2. Testing Frontend Server...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo 3. System should be running on:
echo    - Backend: http://localhost:4000
echo    - Frontend: http://localhost:3000
echo.
echo Press any key to continue...
pause