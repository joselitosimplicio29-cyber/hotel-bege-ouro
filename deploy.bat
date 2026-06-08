@echo off
cd /d "%~dp0"
echo.
echo ================================
echo   Deploy - Hotel Bege Ouro
echo   Subindo para o Vercel...
echo ================================
echo.
npx vercel --prod
echo.
pause
