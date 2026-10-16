import json
from datetime import date

from django.conf import settings
from django.db.models import Q
from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Task

TITLE_MAX = 200


def serialize(task):
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "deadline": task.deadline.isoformat() if task.deadline else None,
        "is_overdue": task.is_overdue,
        "created_at": timezone.localtime(task.created_at).date().isoformat(),
    }


def parse_body(request):
    try:
        data = json.loads(request.body or b"{}")
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def validate(data, partial=False):
    """Return (cleaned, errors). With partial=True only supplied fields are checked."""
    cleaned, errors = {}, {}

    if "title" in data or not partial:
        title = str(data.get("title") or "").strip()
        if not title:
            errors["title"] = "Task title is required."
        elif len(title) > TITLE_MAX:
            errors["title"] = f"Title must be {TITLE_MAX} characters or fewer."
        else:
            cleaned["title"] = title

    if "description" in data:
        cleaned["description"] = str(data.get("description") or "").strip()

    if "priority" in data:
        if data["priority"] not in Task.Priority.values:
            errors["priority"] = "Priority must be Low, Medium or High."
        else:
            cleaned["priority"] = data["priority"]

    if "status" in data:
        if data["status"] not in Task.Status.values:
            errors["status"] = "Status must be Pending or Completed."
        else:
            cleaned["status"] = data["status"]

    if "deadline" in data:
        raw = data["deadline"]
        if raw in (None, ""):
            cleaned["deadline"] = None
        else:
            try:
                cleaned["deadline"] = date.fromisoformat(str(raw))
            except ValueError:
                errors["deadline"] = "Deadline must be a valid date (YYYY-MM-DD)."

    return cleaned, errors


@csrf_exempt
@require_http_methods(["GET", "POST"])
def task_list(request):
    if request.method == "GET":
        qs = Task.objects.all()
        status = request.GET.get("status")
        priority = request.GET.get("priority")
        search = (request.GET.get("search") or "").strip()
        deadline = request.GET.get("deadline")
        overdue = request.GET.get("overdue")

        if status in Task.Status.values:
            qs = qs.filter(status=status)
        if priority in Task.Priority.values:
            qs = qs.filter(priority=priority)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        if deadline:
            try:
                qs = qs.filter(deadline=date.fromisoformat(deadline))
            except ValueError:
                return JsonResponse({"errors": {"deadline": "Invalid date."}}, status=400)
        if overdue in ("1", "true"):
            qs = qs.filter(status=Task.Status.PENDING, deadline__lt=timezone.localdate())

        results = [serialize(t) for t in qs]
        return JsonResponse({"results": results, "count": len(results)})

    data = parse_body(request)
    if data is None:
        return JsonResponse({"errors": {"non_field": "Invalid JSON body."}}, status=400)
    cleaned, errors = validate(data)
    if errors:
        return JsonResponse({"errors": errors}, status=400)
    task = Task.objects.create(**cleaned)
    return JsonResponse(serialize(task), status=201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def task_detail(request, pk):
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return JsonResponse({"errors": {"non_field": "Task not found."}}, status=404)

    if request.method == "GET":
        return JsonResponse(serialize(task))

    if request.method == "DELETE":
        task.delete()
        return HttpResponse(status=204)

    data = parse_body(request)
    if data is None:
        return JsonResponse({"errors": {"non_field": "Invalid JSON body."}}, status=400)
    cleaned, errors = validate(data, partial=(request.method == "PATCH"))
    if errors:
        return JsonResponse({"errors": errors}, status=400)
    for field, value in cleaned.items():
        setattr(task, field, value)
    task.save()
    return JsonResponse(serialize(task))


def serve_frontend(request):
    """Serve the built React app (single-page app) for any non-API route."""
    index = settings.FRONTEND_DIST / "index.html"
    if not index.exists():
        raise Http404("Frontend not built. Run `npm run build` inside /frontend.")
    return FileResponse(open(index, "rb"), content_type="text/html")
