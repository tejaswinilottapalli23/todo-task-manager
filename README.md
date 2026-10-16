# To-Do Task Manager (React + Django)

Full-stack task manager. **React (Vite)** frontend, **Django** REST-style backend, **SQLite** database.

## Features
Add, view, update and delete tasks · mark Pending / Completed · filter by status, priority and due date ·
title validation (client and server) · search · priority (Low / Medium / High) · overdue tasks (tab, badge, bell count) ·
responsive layout · data persisted in SQLite.

## REST API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/tasks/?status=&priority=&search=&deadline=&overdue=1` | List / filter / search |
| POST | `/api/tasks/` | Create (title required) |
| GET | `/api/tasks/<id>/` | Single task |
| PUT | `/api/tasks/<id>/` | Full update |
| PATCH | `/api/tasks/<id>/` | Partial update (e.g. `{"status":"Completed"}`) |
| DELETE | `/api/tasks/<id>/` | Delete |

Validation errors return `400` with `{"errors": {"title": "Task title is required."}}`.

## Run locally
```bash
# 1. Backend  (http://127.0.0.1:8000)
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 2. Frontend (http://localhost:5173) - in a second terminal
cd frontend
npm install
npm run dev
```

## API testing
```bash
cd backend && python manage.py test      # automated tests (10 cases)
./api-tests.sh                           # curl smoke test against a running server
```

## Deploy (Render, free tier)
1. Push this folder to a GitHub repo.
2. On Render choose **New → Blueprint** and select the repo (it reads `render.yaml`).
3. The service name is already **`tejaswini-lottapalli-todo-manager`**, so the live URL is
   `https://tejaswini-lottapalli-todo-manager.onrender.com` and contains the full name.
   If Render says the name is taken, add a suffix but keep the full name in it.

In production, `npm run build` creates `frontend/dist`, and Django serves it together with the API from one URL.
Note: on Render's free tier the SQLite file resets on redeploy; attach a persistent disk or switch to Postgres for permanent data.

## Structure
```
backend/   Django project (config/) + tasks app (models, views, urls, tests)
frontend/  React app (src/App.jsx, components/, api.js, styles.css)
build.sh · render.yaml · api-tests.sh
```
