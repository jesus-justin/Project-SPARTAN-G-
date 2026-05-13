@echo off
REM SPARTAN-G Shutdown Script
REM Terminates all running SPARTAN-G services

echo Stopping all SPARTAN-G services...
echo.

REM Kill Node.js processes (backend, student-portal, ogc-dashboard)
echo Stopping Node.js services...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo No Node.js processes found.
) else (
    echo Node.js services stopped.
)

echo.

REM Kill Flutter/Chrome processes
echo Stopping Flutter service...
taskkill /F /IM chrome.exe 2>nul
if errorlevel 1 (
    echo No Chrome processes found.
) else (
    echo Flutter Chrome service stopped.
)

echo.
echo All SPARTAN-G services have been terminated.
pause
