// web/lib/api.js
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("mynavw_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

// AUTH
export async function apiRegister(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal register");
  return data;
}

export async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal login");
  return data;
}

// TODOS
export async function apiGetTodos() {
  const res = await fetch(`${API_BASE_URL}/todos`, {
    headers: { ...getAuthHeaders() }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal mengambil todo");
  return data;
}

export async function apiCreateTodo(text) {
  const res = await fetch(`${API_BASE_URL}/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ text })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal membuat todo");
  return data;
}

export async function apiToggleTodo(id) {
  const res = await fetch(`${API_BASE_URL}/todos/${id}/toggle`, {
    method: "PATCH",
    headers: { ...getAuthHeaders() }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal update todo");
  return data;
}

export async function apiUpdateTodo(id, text) {
  const res = await fetch(`${API_BASE_URL}/todos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ text })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal mengedit todo");
  return data;
}

export async function apiDeleteTodo(id) {
  const res = await fetch(`${API_BASE_URL}/todos/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal hapus todo");
  return data;
}

// STATS
export async function apiGetStats() {
  const res = await fetch(`${API_BASE_URL}/stats/todos`, {
    headers: { ...getAuthHeaders() }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal mengambil stats");
  return data;
}
