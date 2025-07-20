#!/bin/bash

# Production startup script for Render
echo "Starting WhatIsMyIP Backend..."

# Set environment
export ENVIRONMENT=production

# Start the FastAPI application
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT 