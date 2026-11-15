import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import {
  CalendarBlank,
  Users,
  Storefront,
  ImageSquare,
  ChartLine,
  SignOut,
  Trash,
  Plus,
  Quotes,
  PencilSimple,
  X,
  FloppyDisk,
  VideoCamera,
  UploadSimple,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react";

const TABS = [
  { id: "overview", label: "Overview", icon: ChartLine },
  { id: "bookings", label: "Bookings", icon: CalendarBlank },
  { id: "portfolio", label: "Portfolio", icon: ImageSquare },
  { id: "reels", label: "Reels", icon: VideoCamera },
  { id: "testimonials", label: "Testimonials", icon: Quotes },
  { id: "vendors", label: "Vendors", icon: Storefront },
];

const STATUS_OPTIONS = ["new", "contacted", "confirmed", "completed", "cancelled"];

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      nav("/admin/login", { replace: true });
    }
  }, [user, loading, nav]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen grid place-items-center bg-stone-50 text-stone-500">
        Loading…
      </div>
    );
  }

  return (
    <div
      data-testid="admin-dashboard"
      className="min-h-screen flex bg-stone-100 text-stone-900"
    >
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-stone-950 text-stone-300 border-r border-stone-900">
        <div className="px-6 py-6 border-b border-stone-900">
          <Link
            to="/"
            data-testid="admin-brand"
            className="font-serif text-2xl text-white tracking-tight"
          >
            Sambhrama
          </Link>
          <div className="overline text-amber-300 mt-1">Admin</div>
        </div>
        <div className="px-4 pt-4">
          <Link
            to="/"
            data-testid="admin-back-to-site"
            className="group inline-flex items-center gap-2 h-9 px-3 rounded-sm border border-stone-800 hover:border-amber-500/50 hover:bg-stone-900 text-stone-300 hover:text-amber-300 text-sm transition-colors"
          >
            <ArrowLeft
              size={14}
              weight="bold"
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back to site
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              data-testid={`admin-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 h-10 rounded-sm text-sm transition-colors ${
                tab === t.id
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                  : "hover:bg-stone-900 text-stone-400"
              }`}
            >
              <t.icon size={18} weight="duotone" />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-stone-900">
          <div className="text-stone-500 text-xs">{user.email}</div>
          <button
            data-testid="admin-logout"
            onClick={async () => {
              await logout();
              nav("/admin/login", { replace: true });
            }}
            className="mt-3 inline-flex items-center gap-2 text-sm text-stone-300 hover:text-amber-300"
          >
            <SignOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-stone-950 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              data-testid="admin-back-to-site-mobile"
              aria-label="Back to site"
              className="inline-flex items-center justify-center w-9 h-9 -ml-1 rounded-sm border border-stone-800 hover:border-amber-500/50 hover:text-amber-300 text-stone-300 transition-colors shrink-0"
            >
              <ArrowLeft size={16} weight="bold" />
            </Link>
            <div className="font-serif text-lg truncate">Sambhrama / Admin</div>
          </div>
          <select
            data-testid="admin-mobile-tab"
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="bg-stone-900 text-white px-2 h-8 rounded-sm border border-stone-800"
          >
            {TABS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-6xl w-full">
          {tab === "overview" && <Overview />}
          {tab === "bookings" && <Bookings />}
          {tab === "portfolio" && <PortfolioAdmin />}
          {tab === "reels" && <ReelsAdmin />}
          {tab === "testimonials" && <TestimonialsAdmin />}
          {tab === "vendors" && <VendorsAdmin />}
        </main>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight text-stone-900">
          {title}
        </h2>
        {subtitle && (
          <p className="text-stone-500 text-sm mt-1">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Card({ children, testid }) {
  return (
    <div
      data-testid={testid}
      className="bg-white border border-stone-200 rounded-sm p-5"
    >
      {children}
    </div>
  );
}

/**
 * Two-click delete confirmation.
 * 1st click: button turns red and reads "Confirm?"
 * 2nd click within 4s: triggers onConfirm()
 * Auto-resets after 4s if no second click.
 *
 * Avoids browser-blocked window.confirm() dialogs.
 */
function ConfirmDeleteButton({ onConfirm, testid, ariaLabel = "Delete" }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      data-testid={testid}
      onClick={(e) => {
        e.stopPropagation();
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      aria-label={armed ? "Click again to confirm delete" : ariaLabel}
      className={
        armed
          ? "h-8 px-3 grid place-items-center text-xs font-medium bg-rose-600 text-white rounded-sm hover:bg-rose-700 transition-colors"
          : "w-8 h-8 grid place-items-center text-stone-500 hover:text-rose-700 hover:bg-rose-50 rounded-sm transition-colors"
      }
    >
      {armed ? "Confirm?" : <Trash size={16} />}
    </button>
  );
}

function Overview() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);
  if (!stats) return <div className="text-stone-500">Loading stats…</div>;
  const items = [
    { k: "total_bookings", l: "Total Bookings", v: stats.total_bookings, color: "text-amber-700" },
    { k: "new_bookings", l: "New / Pending", v: stats.new_bookings, color: "text-rose-700" },
    { k: "confirmed_bookings", l: "Confirmed", v: stats.confirmed_bookings, color: "text-emerald-700" },
    { k: "portfolio", l: "Portfolio items", v: stats.portfolio, color: "text-stone-900" },
    { k: "vendors", l: "Vendors", v: stats.vendors, color: "text-stone-900" },
    { k: "subscribers", l: "Newsletter subs", v: stats.subscribers, color: "text-stone-900" },
  ];
  return (
    <>
      <SectionHeader title="Overview" subtitle="A quick read on the studio." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((i) => (
          <Card key={i.k} testid={`stat-${i.k}`}>
            <div className="overline text-stone-500">{i.l}</div>
            <div className={`font-serif text-5xl mt-3 ${i.color}`}>{i.v}</div>
          </Card>
        ))}
      </div>
    </>
  );
}

function Bookings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/admin/bookings")
      .then((r) => setItems(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    try {
      await api.put(`/admin/bookings/${id}`, { status });
      toast.success("Updated");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Failed to update");
    }
  };

  return (
    <>
      <SectionHeader title="Bookings" subtitle="Inquiries from the public site." />
      {loading ? (
        <div className="text-stone-500">Loading…</div>
      ) : items.length === 0 ? (
        <Card>
          <div className="text-stone-500">No inquiries yet.</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <Card key={b.id} testid={`booking-row-${b.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="font-serif text-2xl text-stone-900">
                      {b.name}
                    </div>
                    <span className="px-2.5 h-6 inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-xs">
                      {b.event_type}
                    </span>
                  </div>
                  <div className="text-stone-500 text-sm mt-1">
                    {b.email} · {b.phone}
                  </div>
                  <div className="text-stone-600 text-sm mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1">
                    <span><b>Date:</b> {b.event_date || "—"}</span>
                    <span><b>Guests:</b> {b.guest_count || "—"}</span>
                    <span><b>Budget:</b> {b.budget || "—"}</span>
                    <span><b>Location:</b> {b.location || "—"}</span>
                  </div>
                  {b.message && (
                    <p className="mt-3 text-stone-700 text-sm border-l-2 border-amber-400 pl-3">
                      {b.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    data-testid={`booking-status-${b.id}`}
                    value={b.status}
                    onChange={(e) => setStatus(b.id, e.target.value)}
                    className="h-9 px-3 border border-stone-300 rounded-sm text-sm bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function PortfolioAdmin() {
  const [items, setItems] = useState([]);
  const blankForm = {
    title: "",
    category: "Wedding",
    image_url: "",
    description: "",
    date: "",
    location: "",
    guest_count: "",
    long_description: "",
    highlights_text: "",
    gallery_text: "",
  };
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    api.get("/portfolio").then((r) => setItems(r.data || []));

  useEffect(() => {
    load();
  }, []);

  const buildPayload = () => ({
    title: form.title,
    category: form.category,
    image_url: form.image_url,
    description: form.description,
    date: form.date || null,
    location: form.location,
    long_description: form.long_description,
    guest_count: form.guest_count
      ? parseInt(form.guest_count, 10)
      : null,
    highlights: form.highlights_text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    gallery: form.gallery_text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  });

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      category: item.category || "Wedding",
      image_url: item.image_url || "",
      description: item.description || "",
      date: item.date || "",
      location: item.location || "",
      guest_count: item.guest_count != null ? String(item.guest_count) : "",
      long_description: item.long_description || "",
      highlights_text: (item.highlights || []).join("\n"),
      gallery_text: (item.gallery || []).join("\n"),
    });
    document
      .getElementById("portfolio-create-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blankForm);
  };

  const submit = async () => {
    if (!form.title || !form.image_url) {
      toast.error("Title and image URL are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await api.put(`/admin/portfolio/${editingId}`, payload);
        toast.success("Case study updated.");
      } else {
        await api.post("/admin/portfolio", payload);
        toast.success("Added to portfolio.");
      }
      cancelEdit();
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/portfolio/${id}`);
      if (editingId === id) cancelEdit();
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const move = async (id, direction) => {
    // direction: -1 = up, +1 = down
    const idx = items.findIndex((x) => x.id === id);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= items.length) return;
    // Optimistic UI swap so the move feels instant
    const next = [...items];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    setItems(next);
    try {
      await api.post("/admin/portfolio/reorder", {
        order: next.map((x) => x.id),
      });
    } catch (e) {
      toast.error("Failed to reorder");
      load(); // revert by re-fetching
    }
  };

  return (
    <>
      <SectionHeader
        title="Portfolio"
        subtitle="What the public sees in the gallery. Use the ↑ / ↓ buttons on each card to reorder — #1 appears first on the site."
      />
      <div id="portfolio-create-form">
        <Card testid="portfolio-create-form">
          <div className="flex items-center justify-between mb-3">
            <div className="overline">
              {editingId ? `Editing: ${form.title || "case study"}` : "Add new case study"}
            </div>
            {editingId && (
              <button
                data-testid="portfolio-form-cancel"
                onClick={cancelEdit}
                className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 text-sm"
              >
                <X size={14} /> Cancel edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              data-testid="portfolio-form-title"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <select
              data-testid="portfolio-form-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm bg-white"
            >
              {[
                "Wedding",
                "Sangeet",
                "Haldi",
                "Mehendi",
                "Birthday",
                "Corporate Event",
                "Festival",
                "Conference",
                "Pooja",
              ].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              data-testid="portfolio-form-image"
              placeholder="Hero image URL"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm md:col-span-2"
            />
            <input
              data-testid="portfolio-form-description"
              placeholder="Short description (1 line)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm md:col-span-2"
            />
            <input
              data-testid="portfolio-form-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <input
              data-testid="portfolio-form-location"
              placeholder="Location (city)"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <input
              data-testid="portfolio-form-guests"
              placeholder="Guest count"
              value={form.guest_count}
              onChange={(e) =>
                setForm({ ...form, guest_count: e.target.value.replace(/[^0-9]/g, "") })
              }
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <textarea
              data-testid="portfolio-form-long-description"
              placeholder="Full case-study narrative (shown on /portfolio/:id)"
              value={form.long_description}
              onChange={(e) => setForm({ ...form, long_description: e.target.value })}
              rows={4}
              className="p-3 border border-stone-300 rounded-sm md:col-span-2"
            />
            <textarea
              data-testid="portfolio-form-highlights"
              placeholder="Highlights — one per line"
              value={form.highlights_text}
              onChange={(e) => setForm({ ...form, highlights_text: e.target.value })}
              rows={4}
              className="p-3 border border-stone-300 rounded-sm"
            />
            <textarea
              data-testid="portfolio-form-gallery"
              placeholder="Gallery image URLs — one per line"
              value={form.gallery_text}
              onChange={(e) => setForm({ ...form, gallery_text: e.target.value })}
              rows={4}
              className="p-3 border border-stone-300 rounded-sm"
            />
            <button
              data-testid="portfolio-form-submit"
              onClick={submit}
              disabled={submitting}
              className="h-10 px-5 rounded-sm bg-stone-900 text-white inline-flex items-center justify-center gap-2 md:col-span-2 disabled:opacity-60"
            >
              {editingId ? <FloppyDisk size={16} /> : <Plus size={16} />}{" "}
              {submitting ? "Saving…" : editingId ? "Save changes" : "Add case study"}
            </button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {items.map((i, idx) => (
          <Card key={i.id} testid={`portfolio-admin-${i.id}`}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-stone-100 mb-3">
              <img src={i.image_url} alt={i.title} className="w-full h-full object-cover" />
              {/* Position badge — top-left */}
              <div className="absolute top-2 left-2 bg-stone-900/90 text-amber-300 text-xs font-semibold px-2 py-1 rounded-sm uppercase tracking-widest backdrop-blur">
                #{idx + 1}
              </div>
              {/* Reorder buttons — top-right, stacked */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                <button
                  data-testid={`portfolio-move-up-${i.id}`}
                  onClick={() => move(i.id, -1)}
                  disabled={idx === 0}
                  className="w-8 h-8 grid place-items-center rounded-sm bg-stone-900/90 text-white hover:bg-amber-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors backdrop-blur"
                  aria-label="Move up"
                  title="Move up"
                >
                  <ArrowUp size={14} weight="bold" />
                </button>
                <button
                  data-testid={`portfolio-move-down-${i.id}`}
                  onClick={() => move(i.id, +1)}
                  disabled={idx === items.length - 1}
                  className="w-8 h-8 grid place-items-center rounded-sm bg-stone-900/90 text-white hover:bg-amber-600 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors backdrop-blur"
                  aria-label="Move down"
                  title="Move down"
                >
                  <ArrowDown size={14} weight="bold" />
                </button>
              </div>
            </div>
            <div className="overline text-amber-700">{i.category}</div>
            <div className="font-serif text-xl text-stone-900 mt-1">{i.title}</div>
            <div className="text-stone-500 text-sm mt-1 line-clamp-2">{i.description}</div>
            <div className="mt-3 flex justify-between items-center">
              <a
                href={`/portfolio/${i.id}`}
                target="_blank"
                rel="noreferrer"
                data-testid={`portfolio-view-${i.id}`}
                className="text-stone-600 text-xs hover:text-stone-900 underline-offset-2 underline"
              >
                View case study →
              </a>
              <div className="flex items-center gap-1">
                <button
                  data-testid={`portfolio-edit-${i.id}`}
                  onClick={() => startEdit(i)}
                  className="w-8 h-8 grid place-items-center text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-sm"
                  aria-label="Edit"
                >
                  <PencilSimple size={16} />
                </button>
                <ConfirmDeleteButton
                  testid={`portfolio-delete-${i.id}`}
                  onConfirm={() => remove(i.id)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function TestimonialsAdmin() {
  const [items, setItems] = useState([]);
  const blank = { quote: "", author: "", role: "", rating: 5 };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    api.get("/testimonials").then((r) => setItems(r.data || []));

  useEffect(() => {
    load();
  }, []);

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      quote: item.quote || "",
      author: item.author || "",
      role: item.role || "",
      rating: item.rating || 5,
    });
    document
      .getElementById("testimonial-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blank);
  };

  const submit = async () => {
    if (!form.quote || !form.author) {
      toast.error("Quote and author are required.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/admin/testimonials/${editingId}`, form);
        toast.success("Testimonial updated.");
      } else {
        await api.post("/admin/testimonials", form);
        toast.success("Added testimonial.");
      }
      cancelEdit();
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/testimonials/${id}`);
      if (editingId === id) cancelEdit();
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <>
      <SectionHeader title="Testimonials" />
      <div id="testimonial-form">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="overline">
              {editingId ? `Editing: ${form.author || "testimonial"}` : "Add new"}
            </div>
            {editingId && (
              <button
                data-testid="testimonial-form-cancel"
                onClick={cancelEdit}
                className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 text-sm"
              >
                <X size={14} /> Cancel edit
              </button>
            )}
          </div>
          <textarea
            data-testid="testimonial-form-quote"
            placeholder="Quote"
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            className="w-full p-3 border border-stone-300 rounded-sm"
            rows={3}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <input
              data-testid="testimonial-form-author"
              placeholder="Author"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <input
              data-testid="testimonial-form-role"
              placeholder="Role / context"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <select
              data-testid="testimonial-form-rating"
              value={form.rating}
              onChange={(e) =>
                setForm({ ...form, rating: parseInt(e.target.value, 10) })
              }
              className="h-10 px-3 border border-stone-300 rounded-sm bg-white"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} stars</option>
              ))}
            </select>
          </div>
          <button
            data-testid="testimonial-form-submit"
            onClick={submit}
            disabled={submitting}
            className="mt-4 h-10 px-5 rounded-sm bg-stone-900 text-white inline-flex items-center gap-2 disabled:opacity-60"
          >
            {editingId ? <FloppyDisk size={16} /> : <Plus size={16} />}{" "}
            {submitting ? "Saving…" : editingId ? "Save changes" : "Add testimonial"}
          </button>
        </Card>
      </div>

      {items.length === 0 ? (
        <p className="text-stone-500 mt-6">
          No testimonials yet. Add your first one above — once added, it appears
          on the public landing page automatically.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {items.map((t) => (
            <Card key={t.id} testid={`testimonial-admin-${t.id}`}>
              <p className="font-serif italic text-lg text-stone-800">"{t.quote}"</p>
              <div className="mt-3 flex justify-between">
                <div>
                  <div className="font-medium text-stone-900">{t.author}</div>
                  <div className="text-stone-500 text-sm">{t.role}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    data-testid={`testimonial-edit-${t.id}`}
                    onClick={() => startEdit(t)}
                    className="w-8 h-8 grid place-items-center text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-sm"
                    aria-label="Edit"
                  >
                    <PencilSimple size={16} />
                  </button>
                  <ConfirmDeleteButton
                    testid={`testimonial-delete-${t.id}`}
                    onConfirm={() => remove(t.id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function VendorsAdmin() {
  const [items, setItems] = useState([]);
  const blank = {
    name: "",
    category: "",
    contact_email: "",
    contact_phone: "",
    service_description: "",
  };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    api.get("/vendors").then((r) => setItems(r.data || []));

  useEffect(() => {
    load();
  }, []);

  const startEdit = (vendor) => {
    setEditingId(vendor.id);
    setForm({
      name: vendor.name || "",
      category: vendor.category || "",
      contact_email: vendor.contact_email || "",
      contact_phone: vendor.contact_phone || "",
      service_description: vendor.service_description || "",
    });
    document
      .getElementById("vendor-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blank);
  };

  const submit = async () => {
    if (!form.name || !form.category) {
      toast.error("Name and category required.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/admin/vendors/${editingId}`, form);
        toast.success("Vendor updated.");
      } else {
        await api.post("/admin/vendors", form);
        toast.success("Vendor added.");
      }
      cancelEdit();
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/vendors/${id}`);
      if (editingId === id) cancelEdit();
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <>
      <SectionHeader title="Vendors" subtitle="Your trusted network." />
      <div id="vendor-form">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="overline">
              {editingId ? `Editing: ${form.name || "vendor"}` : "Add vendor"}
            </div>
            {editingId && (
              <button
                data-testid="vendor-form-cancel"
                onClick={cancelEdit}
                className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 text-sm"
              >
                <X size={14} /> Cancel edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              data-testid="vendor-form-name"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <input
              data-testid="vendor-form-category"
              placeholder="Category (Catering, AV…)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <input
              data-testid="vendor-form-email"
              placeholder="Email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <input
              data-testid="vendor-form-phone"
              placeholder="Phone"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <input
              data-testid="vendor-form-description"
              placeholder="Service description"
              value={form.service_description}
              onChange={(e) =>
                setForm({ ...form, service_description: e.target.value })
              }
              className="h-10 px-3 border border-stone-300 rounded-sm md:col-span-2"
            />
            <button
              data-testid="vendor-form-submit"
              onClick={submit}
              disabled={submitting}
              className="h-10 px-5 rounded-sm bg-stone-900 text-white inline-flex items-center gap-2 disabled:opacity-60"
            >
              {editingId ? <FloppyDisk size={16} /> : <Plus size={16} />}{" "}
              {submitting ? "Saving…" : editingId ? "Save changes" : "Add vendor"}
            </button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {items.map((v) => (
          <Card key={v.id} testid={`vendor-admin-${v.id}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="overline text-amber-700">{v.category}</div>
                <div className="font-serif text-2xl text-stone-900 mt-1">{v.name}</div>
                <div className="text-stone-500 text-sm mt-2">
                  {v.contact_email} · {v.contact_phone}
                </div>
                <p className="text-stone-700 text-sm mt-2">{v.service_description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  data-testid={`vendor-edit-${v.id}`}
                  onClick={() => startEdit(v)}
                  className="w-8 h-8 grid place-items-center text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-sm"
                  aria-label="Edit"
                >
                  <PencilSimple size={16} />
                </button>
                <ConfirmDeleteButton
                  testid={`vendor-delete-${v.id}`}
                  onConfirm={() => remove(v.id)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}


function ReelsAdmin() {
  const [items, setItems] = useState([]);
  const blank = { caption: "", posted_date: "", order_index: "0", video_url: "" };
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const load = () =>
    api.get("/reels").then((r) => setItems(r.data || []));

  useEffect(() => {
    load();
  }, []);

  const startEdit = (item) => {
    setEditingId(item.id);
    setFile(null);
    setForm({
      caption: item.caption || "",
      posted_date: item.posted_date || "",
      order_index: String(item.order_index || 0),
      video_url: item.video_url || "",
    });
    document
      .getElementById("reel-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFile(null);
    setForm(blank);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      if (editingId) {
        // Editing — only updates metadata; to replace video, delete + re-add
        const payload = {
          caption: form.caption,
          posted_date: form.posted_date || null,
          order_index: parseInt(form.order_index || "0", 10),
        };
        if (form.video_url && form.video_url !== items.find((i) => i.id === editingId)?.video_url) {
          payload.video_url = form.video_url;
        }
        await api.put(`/admin/reels/${editingId}`, payload);
        toast.success("Reel updated.");
      } else {
        if (!file && !form.video_url) {
          toast.error("Drop a video file or paste a video URL.");
          setSubmitting(false);
          return;
        }
        const fd = new FormData();
        fd.append("caption", form.caption || "");
        if (form.posted_date) fd.append("posted_date", form.posted_date);
        fd.append("order_index", String(parseInt(form.order_index || "0", 10)));
        if (file) fd.append("file", file);
        else if (form.video_url) fd.append("video_url", form.video_url);
        await api.post("/admin/reels", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Reel added.");
      }
      cancelEdit();
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/reels/${id}`);
      if (editingId === id) cancelEdit();
      toast.success("Reel deleted");
      load();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      toast.error("Please drop a video file.");
      return;
    }
    setFile(f);
  };

  return (
    <>
      <SectionHeader
        title="Reels"
        subtitle="Short vertical videos shown on the public landing page."
      />
      <div id="reel-form">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="overline">
              {editingId
                ? `Editing: ${form.caption?.slice(0, 40) || "reel"}`
                : "Add new reel"}
            </div>
            {editingId && (
              <button
                data-testid="reel-form-cancel"
                onClick={cancelEdit}
                className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 text-sm"
              >
                <X size={14} /> Cancel edit
              </button>
            )}
          </div>

          {!editingId && (
            <div
              data-testid="reel-dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-amber-500 bg-amber-50"
                  : "border-stone-300 hover:border-stone-500"
              }`}
            >
              <UploadSimple size={28} className="mx-auto text-stone-500" />
              <div className="mt-3 font-medium text-stone-900">
                {file ? file.name : "Drop a video here or click to select"}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                .mp4 / .mov / .webm · up to 60 MB · vertical 9:16 looks best
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                data-testid="reel-file-input"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <input
              data-testid="reel-form-url"
              placeholder={editingId ? "Video URL" : "…or paste a video URL"}
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm md:col-span-3"
            />
            <textarea
              data-testid="reel-form-caption"
              placeholder="Caption"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              rows={2}
              className="p-3 border border-stone-300 rounded-sm md:col-span-3"
            />
            <input
              data-testid="reel-form-date"
              type="date"
              placeholder="Posted date (optional)"
              value={form.posted_date}
              onChange={(e) => setForm({ ...form, posted_date: e.target.value })}
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <input
              data-testid="reel-form-order"
              type="number"
              placeholder="Order (0 = first)"
              value={form.order_index}
              onChange={(e) =>
                setForm({ ...form, order_index: e.target.value.replace(/[^0-9]/g, "") })
              }
              className="h-10 px-3 border border-stone-300 rounded-sm"
            />
            <button
              data-testid="reel-form-submit"
              onClick={submit}
              disabled={submitting}
              className="h-10 px-5 rounded-sm bg-stone-900 text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {editingId ? <FloppyDisk size={16} /> : <Plus size={16} />}
              {submitting
                ? "Saving…"
                : editingId
                ? "Save changes"
                : "Add reel"}
            </button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {items.map((r) => (
          <Card key={r.id} testid={`reel-admin-${r.id}`}>
            <div className="aspect-[9/16] overflow-hidden rounded-sm bg-stone-900 mb-3 relative">
              <video
                src={r.video_url}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-stone-500 text-xs mb-1">
              Order: {r.order_index} {r.posted_date && `· ${r.posted_date}`}
            </div>
            <p className="text-stone-800 text-sm line-clamp-3">{r.caption}</p>
            <div className="mt-3 flex justify-end items-center gap-1">
              <button
                data-testid={`reel-edit-${r.id}`}
                onClick={() => startEdit(r)}
                className="w-8 h-8 grid place-items-center text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-sm"
                aria-label="Edit"
              >
                <PencilSimple size={16} />
              </button>
              <ConfirmDeleteButton
                testid={`reel-delete-${r.id}`}
                onConfirm={() => remove(r.id)}
              />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
