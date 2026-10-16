#!/usr/bin/env bash
# Manual API smoke test. Start the backend first:  cd backend && python manage.py runserver
BASE=${1:-http://127.0.0.1:8000/api/tasks/}
H='Content-Type: application/json'
echo "--- POST (valid)";            curl -s -X POST $BASE -H "$H" -d '{"title":"Test task","description":"demo","priority":"High","deadline":"2030-01-01"}'; echo
echo "--- POST (empty title -> 400)"; curl -s -o /dev/null -w "%{http_code}\n" -X POST $BASE -H "$H" -d '{"title":"  "}'
echo "--- GET all";                 curl -s $BASE; echo
echo "--- GET pending";             curl -s "$BASE?status=Pending"; echo
echo "--- GET search";              curl -s "$BASE?search=test"; echo
echo "--- PUT task 1";              curl -s -X PUT ${BASE}1/ -H "$H" -d '{"title":"Updated title","priority":"Low"}'; echo
echo "--- PATCH status";            curl -s -X PATCH ${BASE}1/ -H "$H" -d '{"status":"Completed"}'; echo
echo "--- DELETE task 1 (204)";     curl -s -o /dev/null -w "%{http_code}\n" -X DELETE ${BASE}1/
