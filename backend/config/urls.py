from django.urls import include, path, re_path

from tasks.views import serve_frontend

urlpatterns = [
    path("api/", include("tasks.urls")),
    re_path(r"^(?!api/|static/).*$", serve_frontend),
]
