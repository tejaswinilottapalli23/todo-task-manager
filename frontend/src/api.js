// All communication with the Django backend goes through these REST calls.
const BASE = (import.meta.env.VITE_API_URL || "") + "/api/tasks/";

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error("Request failed");
    err.errors = data.errors || { non_field: "Something went wrong. Try again." };
    throw err;
  }
  return data;
}

export const api = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    return request(`${BASE}?${params}`); // GET
  },
  create: (task) => request(BASE, { method: "POST", body: JSON.stringify(task) }),
  update: (id, task) => request(`${BASE}${id}/`, { method: "PUT", body: JSON.stringify(task) }),
  setStatus: (id, status) => request(`${BASE}${id}/`, { method: "PATCH", body: JSON.stringify({ status }) }),
  remove: (id) => request(`${BASE}${id}/`, { method: "DELETE" }),
};
