@echo off
echo Setting up GitHub repository...

echo.
echo Step 1: Add your GitHub repository URL
echo Replace YOUR_GITHUB_URL with your actual repository URL
echo.

git remote add origin YOUR_GITHUB_URL
git branch -M main
git push -u origin main

echo.
echo GitHub setup complete!
echo Now go to Railway and Vercel to deploy.
pause