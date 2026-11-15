import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { Lock, ArrowLeft } from "@phosphor-icons/react";

export default function AdminLogin() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user && user.role === "admin") {
      nav("/admin", { replace: true });
    }
  }, [user, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back.");
      nav("/admin", { replace: true });
    } catch (e2) {
      const msg = formatApiError(e2.response?.data?.detail) || "Login failed";
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="admin-login-page"
      className="min-h-screen bg-stone-950 text-stone-100 grid place-items-center px-4 hero-grain"
    >
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          data-testid="back-to-site"
          className="flex items-center gap-3"
        >
          <img
            src="/sambhrama-logo.jpg"
            alt="Sambhrama"
            className="h-11 w-11 rounded-full object-cover ring-1 ring-stone-800"
          />
          <span className="font-serif text-2xl tracking-tight text-white">
            Sambhrama
          </span>
        </Link>
      </div>
      <form
        data-testid="admin-login-form"
        onSubmit={submit}
        className="relative bg-stone-900 border border-stone-800 rounded-sm p-8 md:p-10 w-full max-w-md"
      >
        {/* Explicit go-back button — visible on every viewport */}
        <Link
          to="/"
          data-testid="admin-login-back-button"
          className="group inline-flex items-center gap-2 h-9 px-3 mb-6 -ml-1 rounded-full border border-stone-700 hover:border-amber-500/60 hover:bg-stone-950 text-stone-300 hover:text-amber-300 text-xs uppercase tracking-widest transition-colors"
        >
          <ArrowLeft
            size={14}
            weight="bold"
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back to site
        </Link>

        <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 grid place-items-center mb-6">
          <Lock size={20} weight="duotone" />
        </div>
        <h1 className="font-serif text-3xl tracking-tight">Admin sign-in</h1>
        <p className="text-stone-400 text-sm mt-2">
          Manage bookings, vendors, portfolio and testimonials.
        </p>

        <label className="overline mt-8 block text-stone-400">Username</label>
        <input
          data-testid="admin-email-input"
          type="text"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-11 px-4 mt-2 bg-stone-950 border border-stone-800 rounded-sm focus:outline-none focus:border-amber-500"
        />

        <label className="overline mt-5 block text-stone-400">Password</label>
        <input
          data-testid="admin-password-input"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-11 px-4 mt-2 bg-stone-950 border border-stone-800 rounded-sm focus:outline-none focus:border-amber-500"
        />

        {err && (
          <div
            data-testid="admin-login-error"
            className="mt-4 text-sm text-rose-400"
          >
            {err}
          </div>
        )}

        <button
          data-testid="admin-login-submit"
          type="submit"
          disabled={busy}
          className="mt-8 w-full h-12 rounded-sm bg-amber-500 text-stone-900 font-medium hover:bg-amber-400 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
