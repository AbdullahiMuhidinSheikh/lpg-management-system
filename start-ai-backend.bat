@echo off
REM AI Backend Quick Start Script for Windows

echo ========================================
echo   LPG AI Backend Setup & Start
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org
    pause
    exit /b 1
)

echo [1/4] Python version:
python --version
echo.

REM Create virtual environment if it doesn't exist
if not exist "ai-backend\venv" (
    echo [2/4] Creating virtual environment...
    cd ai-backend
    python -m venv venv
    cd ..
) else (
    echo [2/4] Virtual environment already exists
)
echo.

REM Activate virtual environment and install dependencies
echo [3/4] Installing dependencies...
call ai-backend\venv\Scripts\activate.bat
pip install -r ai-backend\requirements.txt
echo.

REM Start the Flask app
echo [4/4] Starting AI Backend on http://localhost:5000...
echo.
cd ai-backend
python app.py
