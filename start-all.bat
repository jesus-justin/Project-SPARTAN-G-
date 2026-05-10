@echo off
REM SPARTAN-G Startup Script
REM Opens all 4 services in separate Command Prompt windows

echo Starting SPARTAN-G System...
echo.
echo Step 1: Please make sure XAMPP MySQL is running!
echo Opening XAMPP Control Panel...
start "" "C:\xampp\xampp-control.exe"
echo.
echo Waiting 5 seconds for MySQL to start...
timeout /t 5 /nobreak
echo.
echo Starting Backend...
start "SPARTAN-G Backend" cmd /k "cd /d C:\xampp\htdocs\Project-SPARTAN-G-\backend && node src/server.js"
timeout /t 3 /nobreak
echo.
echo Starting Student Portal...
start "SPARTAN-G Student Portal" cmd /k "cd /d C:\xampp\htdocs\Project-SPARTAN-G-\student-portal && npm run dev"
timeout /t 2 /nobreak
echo.
echo Starting OGC Dashboard...
start "SPARTAN-G OGC Dashboard" cmd /k "cd /d C:\xampp\htdocs\Project-SPARTAN-G-\ogc-dashboard && npm run dev"
timeout /t 2 /nobreak
echo.
echo Starting Flutter Mobile...
start "SPARTAN-G Flutter" cmd /k "cd /d C:\xampp\htdocs\Project-SPARTAN-G-\mobile && flutter run -d chrome"
echo.
echo All services started!
echo.
echo Student Portal:  http://localhost:5173
echo OGC Dashboard:   http://localhost:5174
echo Backend API:     http://localhost:3001/api/health
echo.
pause
