@echo off
echo ==========================================
echo  LPG Inventory System - Build Script
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (echo FAILED: npm install & exit /b 1)

echo.
echo [2/5] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (echo FAILED: prisma generate & exit /b 1)

echo.
echo [3/5] Pushing schema to database...
call npx prisma db push
if %errorlevel% neq 0 (echo FAILED: prisma db push & exit /b 1)

echo.
echo [4/5] Seeding database...
call npx prisma db seed
if %errorlevel% neq 0 (
  echo WARNING: Seed failed - database may already be seeded. Continuing...
)

echo.
echo [5/5] Building Next.js app...
call npx next build
if %errorlevel% neq 0 (echo FAILED: next build & exit /b 1)

echo.
echo ==========================================
echo  Build complete! Run 'npm run dev' or 'npm start'
echo ==========================================
