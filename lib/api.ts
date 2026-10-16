// Cliente HTTP del backend. Compatible con `output: export` (todo corre en el browser).
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("apiBase");
    if (saved && saved.trim()) return saved.trim().replace(/\/$/, "");
  }
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env && env.trim()) return env.trim().replace(/\/$/, "");
  return "http://localhost:3000";
}

export function setApiBase(url: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("apiBase", url.trim());
  }
}

export type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  createdAt?: string;
};

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  root: (base: string) =>
    fetch(`${base}/`).then(async (r) => ({ status: r.status, text: await r.text() })),
  health: (base: string) =>
    fetch(`${base}/health`).then(handle<{ status: string; uptime: number }>),
  listar: (base: string) =>
    fetch(`${base}/api/productos`).then(handle<Producto[]>),
  obtener: (base: string, id: number) =>
    fetch(`${base}/api/productos/${id}`).then(handle<Producto>),
  crear: (base: string, p: { nombre: string; precio: number; stock: number }) =>
    fetch(`${base}/api/productos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).then(handle<Producto>),
  actualizar: (
    base: string,
    id: number,
    p: Partial<{ nombre: string; precio: number; stock: number }>
  ) =>
    fetch(`${base}/api/productos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }).then(handle<Producto>),
  eliminar: (base: string, id: number) =>
    fetch(`${base}/api/productos/${id}`, { method: "DELETE" }).then(
      async (r) => {
        if (!r.ok) {
          const t = await r.text();
          throw new Error(t || `HTTP ${r.status}`);
        }
      }
    ),
};
