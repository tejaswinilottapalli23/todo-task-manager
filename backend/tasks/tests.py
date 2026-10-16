import json
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from .models import Task


class TaskApiTests(TestCase):
    def post(self, payload):
        return self.client.post("/api/tasks/", json.dumps(payload), content_type="application/json")

    def test_create_task(self):
        r = self.post({"title": "Write report", "priority": "High", "deadline": "2030-01-01"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["status"], "Pending")
        self.assertEqual(Task.objects.count(), 1)

    def test_empty_title_rejected(self):
        r = self.post({"title": "   "})
        self.assertEqual(r.status_code, 400)
        self.assertIn("title", r.json()["errors"])

    def test_invalid_priority_rejected(self):
        self.assertEqual(self.post({"title": "x", "priority": "Urgent"}).status_code, 400)

    def test_list_and_filter_by_status(self):
        Task.objects.create(title="A")
        Task.objects.create(title="B", status="Completed")
        self.assertEqual(self.client.get("/api/tasks/").json()["count"], 2)
        self.assertEqual(self.client.get("/api/tasks/?status=Completed").json()["count"], 1)
        self.assertEqual(self.client.get("/api/tasks/?status=Pending").json()["count"], 1)

    def test_search(self):
        Task.objects.create(title="Buy milk")
        Task.objects.create(title="Study Django", description="models and views")
        self.assertEqual(self.client.get("/api/tasks/?search=django").json()["count"], 1)
        self.assertEqual(self.client.get("/api/tasks/?search=views").json()["count"], 1)

    def test_put_updates_task(self):
        t = Task.objects.create(title="Old")
        r = self.client.put(
            f"/api/tasks/{t.id}/", json.dumps({"title": "New", "priority": "Low"}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        t.refresh_from_db()
        self.assertEqual((t.title, t.priority), ("New", "Low"))

    def test_put_with_empty_title_rejected(self):
        t = Task.objects.create(title="Keep")
        r = self.client.put(f"/api/tasks/{t.id}/", json.dumps({"title": ""}), content_type="application/json")
        self.assertEqual(r.status_code, 400)

    def test_patch_status(self):
        t = Task.objects.create(title="Do it")
        r = self.client.patch(
            f"/api/tasks/{t.id}/", json.dumps({"status": "Completed"}), content_type="application/json"
        )
        self.assertEqual(r.json()["status"], "Completed")

    def test_delete(self):
        t = Task.objects.create(title="Gone")
        self.assertEqual(self.client.delete(f"/api/tasks/{t.id}/").status_code, 204)
        self.assertEqual(self.client.get(f"/api/tasks/{t.id}/").status_code, 404)

    def test_overdue(self):
        yesterday = timezone.localdate() - timedelta(days=1)
        Task.objects.create(title="Late", deadline=yesterday)
        Task.objects.create(title="Late but done", deadline=yesterday, status="Completed")
        Task.objects.create(title="Future", deadline=timezone.localdate() + timedelta(days=3))
        data = self.client.get("/api/tasks/?overdue=1").json()
        self.assertEqual(data["count"], 1)
        self.assertTrue(data["results"][0]["is_overdue"])
