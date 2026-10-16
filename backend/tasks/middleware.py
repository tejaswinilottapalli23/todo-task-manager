from django.conf import settings
from django.http import HttpResponse


class SimpleCorsMiddleware:
    """Tiny CORS handler so the Vite dev server (port 5173) can call the API."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin")
        if request.method == "OPTIONS" and origin:
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)
        if origin and origin in settings.CORS_ALLOWED_ORIGINS:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type"
            response["Vary"] = "Origin"
        return response
