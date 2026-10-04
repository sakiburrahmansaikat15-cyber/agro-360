"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Agro-Trust 360 Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in with your admin account to continue.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-slate-600">
          <div className="flex items-center justify-between font-semibold text-emerald-800">
            <span>Demo Admin Credentials</span>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@agro360.com");
                setPassword("admin123");
              }}
              className="text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900"
            >
              Auto Fill
            </button>
          </div>
          <div className="mt-1.5 space-y-0.5 font-mono text-[11px] text-slate-700">
            <p><span className="text-slate-500">ID (Email):</span> admin@agro360.com</p>
            <p><span className="text-slate-500">Password:</span> admin123</p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Admin accounts are provisioned with <code>scripts/create-admin.ts</code>
        </p>
      </div>
    </div>
  );
}
