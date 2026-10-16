#!/usr/bin/env bash
# Build script for deployment (Render, Railway, etc.)
set -o errexit
cd frontend && npm install && npm run build && cd ..
cd backend && pip install -r requirements.txt && python manage.py migrate --no-input
