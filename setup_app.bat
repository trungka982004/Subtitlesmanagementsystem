@echo off
echo ==========================================
echo   Subtitles Management System Setup
echo ==========================================
echo.

echo [1/5] Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/5] Setting up environment...
if not exist .env (
    echo No .env file found. Copying .env.example to .env...
    copy .env.example .env
    echo PLEASE UPDATE YOUR .env FILE WITH CORRECT DATABASE_URL!
)

echo.
echo [3/5] Initializing Database (Prisma)...
call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (
    echo Database initialization failed. Ensure PostgreSQL is running.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/5] Seeding Database...
call npm run seed

echo.
echo [5/5] Installing Python dependencies...
python -m pip install -r server/python_service/requirements.txt
if %errorlevel% neq 0 (
    echo Python dependencies installation failed.
)

echo.
echo ==========================================
echo   Setup Complete!
echo   Run 'start_all.bat' to start the system.
echo ==========================================
pause
