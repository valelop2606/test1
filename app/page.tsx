"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getApiBase, setApiBase, type Producto } from "../lib/api";

const DEFAULT_FORM = { nombre: "", precio: "0", stock: "0" };

export default function Home() {
  const [apiBase, setApiBaseState] = useState("http://localhost:3000");
  const [rootStatus, setRootStatus] = useState<string>("—");
  const [health, setHealth] = useState<string>("—");
  const [checking, setChecking] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editing, setEditing] = useState<Producto | null>(null);

  useEffect(() => {
    setApiBaseState(getApiBase());
  }, []);

  const checkBackend = useCallback(async (base: string) => {
    setChecking(true);
    setError(null);
    try {
      const root = await api.root(base);
      setRootStatus(`${root.status} · ${root.text.slice(0, 80)}`);
    } catch (e) {
      setRootStatus(`❌ ${e instanceof Error ? e.message : "sin conexión"}`);
    }
    try {
      const h = await api.health(base);
      setHealth(`✅ ${h.status} · uptime ${Math.round(h.uptime)}s`);
    } catch (e) {
      setHealth(`❌ ${e instanceof Error ? e.message : "sin conexión"}`);
    }
    setChecking(false);
  }, []);

  const cargarProductos = useCallback(async (base: string) => {
    setLoadingList(true);
    setError(null);
    try {
      const list = await api.listar(base);
      setProductos(list);
    } catch (e) {
      setError(
        `No se pudo listar /api/productos: ${e instanceof Error ? e.message : e}. Revisa que el backend esté deployado y que la URL sea correcta.`
      );
      setProductos([]);
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    if (!apiBase) return;
    checkBackend(apiBase);
    cargarProductos(apiBase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardarBase = () => {
    const clean = apiBase.trim().replace(/\/$/, "");
    setApiBaseState(clean);
    setApiBase(clean);
    checkBackend(clean);
    cargarProductos(clean);
    setOk(`Backend apuntando a ${clean}`);
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    try {
      await api.crear(apiBase, {
        nombre: form.nombre.trim(),
        precio: Number(form.precio),
        stock: Number(form.stock),
      });
      setForm(DEFAULT_FORM);
      setOk("Producto creado ✅");
      await cargarProductos(apiBase);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear");
    }
  };

  const guardarEdicion = async () => {
    if (!editing) return;
    setError(null);
    try {
      await api.actualizar(apiBase, editing.id, {
        nombre: editing.nombre,
        precio: Number(editing.precio),
        stock: Number(editing.stock),
      });
      setEditing(null);
      setOk("Producto actualizado ✅");
      await cargarProductos(apiBase);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm(`¿Eliminar producto #${id}?`)) return;
    try {
      await api.eliminar(apiBase, id);
      setOk(`Producto #${id} eliminado ✅`);
      await cargarProductos(apiBase);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  const curlBase = apiBase || "https://TU-BACKEND.onrender.com";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      {/* HEADER */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
              UPB · CERTI2 · Demo fullstack
            </p>
            <h1 className="text-2xl font-bold">
              BackendUpb <span className="text-zinc-400">×</span> test1
            </h1>
            <p className="text-sm text-zinc-500">
              Landing de demostración: Next.js (Firebase Hosting) + Express (Render) + Postgres (Render)
            </p>
          </div>
          <div className="flex gap-2 text-xs font-medium">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">API: Express</span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800 dark:bg-sky-900 dark:text-sky-200">Front: Next.js</span>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800 dark:bg-violet-900 dark:text-violet-200">DB: Postgres</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        {/* CONEXIÓN */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">1 · Conexión al backend</h2>
          <p className="mt-1 text-sm text-zinc-500">
            En local usa <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">http://localhost:3000</code>.
            Cuando deployes en Render, pega aquí tu URL <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">https://…onrender.com</code> y pulsa Conectar.
            Se guarda en el navegador (localStorage) y también puedes fijarla con <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">NEXT_PUBLIC_API_URL</code>.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={apiBase}
              onChange={(e) => setApiBaseState(e.target.value)}
              placeholder="https://backendupbtest.onrender.com"
              className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 font-mono text-sm dark:border-zinc-700"
            />
            <button
              onClick={guardarBase}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Conectar
            </button>
            <button
              onClick={() => { checkBackend(apiBase); cargarProductos(apiBase); }}
              disabled={checking}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              {checking ? "Verificando…" : "Reintentar"}
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">GET /</p>
              <p className="mt-1 font-mono text-sm">{rootStatus}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">GET /health (Render healthcheck)</p>
              <p className="mt-1 font-mono text-sm">{health}</p>
            </div>
          </div>
        </section>

        {/* DEMO CRUD */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">2 · Demo en vivo: productos</h2>
            <button
              onClick={() => cargarProductos(apiBase)}
              disabled={loadingList}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              {loadingList ? "Cargando…" : "↻ Recargar lista"}
            </button>
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">⚠️ {error}</p>}
          {ok && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{ok}</p>}

          {/* Crear */}
          <form onSubmit={crear} className="mt-4 grid gap-2 sm:grid-cols-[1fr_140px_140px_auto]">
            <input
              required
              maxLength={100}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre del producto"
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
              placeholder="Precio"
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            />
            <input
              type="number"
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="Stock"
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            />
            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900">
              + Crear
            </button>
          </form>

          {/* Tabla */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Precio</th>
                  <th className="py-2 pr-3">Stock</th>
                  <th className="py-2 pr-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2 pr-3 font-mono">#{p.id}</td>
                    <td className="py-2 pr-3 font-medium">{p.nombre}</td>
                    <td className="py-2 pr-3 font-mono">${Number(p.precio).toFixed(2)}</td>
                    <td className="py-2 pr-3 font-mono">{p.stock}</td>
                    <td className="flex justify-end gap-2 py-2">
                      <button onClick={() => setEditing({ ...p })} className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
                        Editar
                      </button>
                      <button onClick={() => eliminar(p.id)} className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {productos.length === 0 && !loadingList && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-zinc-500">
                      Sin productos todavía. Crea el primero con el formulario de arriba 👆
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal edición simple */}
          {editing && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <p className="text-sm font-semibold">Editando #{editing.id}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_140px_140px_auto_auto]">
                <input value={editing.nombre} onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
                <input type="number" min={0} step="0.01" value={editing.precio} onChange={(e) => setEditing({ ...editing, precio: Number(e.target.value) })} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
                <input type="number" min={0} step={1} value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
                <button onClick={guardarEdicion} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Guardar</button>
                <button onClick={() => setEditing(null)} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">Cancelar</button>
              </div>
            </div>
          )}
        </section>

        {/* ENDPOINTS */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold">3 · Endpoints del backend</h2>
          <p className="mt-1 text-sm text-zinc-500">Copia y pega en tu terminal para probar la API deployada:</p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs leading-6 text-emerald-300">
{`# Salud
curl ${curlBase}/health

# Listar
curl ${curlBase}/api/productos

# Crear
curl -X POST ${curlBase}/api/productos \\
  -H "Content-Type: application/json" \\
  -d '{"nombre":"Teclado","precio":199.99,"stock":10}'

# Obtener uno
curl ${curlBase}/api/productos/1

# Actualizar (parcial)
curl -X PUT ${curlBase}/api/productos/1 \\
  -H "Content-Type: application/json" \\
  -d '{"stock":25}'

# Eliminar
curl -X DELETE ${curlBase}/api/productos/1 -i`}
          </pre>
        </section>

        <footer className="pb-6 text-center text-xs text-zinc-400">
          Repos: <span className="font-mono">backendUpbtest</span> (Render + Postgres) · <span className="font-mono">test1</span> (Firebase Hosting) · Hecho para la demo CERTI2
        </footer>
      </main>
    </div>
  );
}
