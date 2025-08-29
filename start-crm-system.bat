@echo off
echo ========================================
echo    LOAN CRM SYSTEM STARTUP
echo ========================================
echo.

echo Step 1: Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2: Initializing Database...
node init-database.js
if %errorlevel% neq 0 (
    echo Error initializing database!
    pause
    exit /b 1
)

echo.
echo Step 3: Installing Frontend Dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies!
    pause
    exit /b 1
)

echo.
echo Step 4: Starting Backend Server...
cd ..\backend
start "Loan CRM Backend" cmd /k "npm start"
timeout /t 5

echo.
echo Step 5: Starting Frontend Server...
cd ..\frontend
start "Loan CRM Frontend" cmd /k "npm start"

echo.
echo ========================================
echo    SYSTEM STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend Server: http://localhost:4000
echo Frontend App:   http://localhost:3000
echo.
echo Default Admin Login:
echo Username: admin
echo Password: admin123
echo.
echo Press any key to exit...
pause