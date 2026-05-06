@echo off
REM SPARTAN-G Startup Script
REM Opens all 4 services in separate Command Prompt windows

echo Starting all SPARTAN-G services...
echo.

REM Start Backend
start "SPARTAN-G Backend" cmd /k "cd /d C:\xampp\htdocs\Project-SPARTAN-G-\backend && npm run dev"
timeout /t 2 /nobreak

REM Start Student Portal
start "SPARTAN-G Student Portal" cmd /k "cd /d C:\xampp\htdocs\Project-SPARTAN-G-\student-portal && npm run dev"
timeout /t 2 /nobreak

REM Start OGC Dashboard
start "SPARTAN-G OGC Dashboard" cmd /k "cd /d C:\xampp\htdocs\Project-SPARTAN-G-\ogc-dashboard && npm run dev"
timeout /t 2 /nobreak

REM Start Flutter Mobile
start "SPARTAN-G Flutter" cmd /k "cd /d C:\xampp\htdocs\Project-SPARTAN-G-\mobile && flutter run -d chrome"

echo.
echo All services started in separate windows.
echo Backend: http://localhost:3001
echo Student Portal: http://localhost:5173
echo OGC Dashboard: http://localhost:5174
echo Flutter Web: Chrome device
echo.
echo Run stop-all.bat to terminate all services.
pause
