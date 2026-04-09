@echo off
title 하나투어 대시보드
echo.
echo  ================================
echo   하나투어 영업 대시보드 시작 중...
echo  ================================
echo.
cd /d "%~dp0"
start http://localhost:3000
npm run dev
pause
