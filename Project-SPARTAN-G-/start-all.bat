@echo off
REM SPARTAN-G Startup Script
REM Opens all 4 services in separate Command Prompt windows

echo Starting SPARTAN-G System...
echo.
echo Step 1: Please make sure XAMPP MySQL is running!
echo Opening XAMPP Control Panel...
start "" "C:\xampp\xampp-control.exe"
echo.
echo Waiting for backend health endpoint to become available...
for /L %%i in (1,1,12) do (
	powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:3001/api/health | Out-Null; exit 0 } catch { exit 1 }"
	if not errorlevel 1 goto backend_ready
	timeout /t 5 /nobreak >nul
)
echo.
echo Backend is not ready yet.
echo Start MySQL in XAMPP, then run this script again.
echo.
pause
exit /b 1

:backend_ready
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
