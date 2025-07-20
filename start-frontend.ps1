#!/usr/bin/env pwsh

# Start WhatIsMyIP Frontend
Write-Host "Starting WhatIsMyIP Frontend..." -ForegroundColor Green

# Change to frontend directory
Set-Location -Path "frontend"

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Make sure you're in the correct directory." -ForegroundColor Red
    exit 1
}

# Clean build cache if it exists and is corrupted
if (Test-Path ".next") {
    Write-Host "Cleaning build cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

Write-Host "Installing/updating Node.js dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting Next.js development server on http://localhost:3000" -ForegroundColor Green
Write-Host "Make sure the backend is running on http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run dev 