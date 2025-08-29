@echo off
echo Fixing database schema...
cd backend
node fix-database.js
pause