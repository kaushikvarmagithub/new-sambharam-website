import { useState } from "react";
import { toast } from "sonner";
import { InstagramLogo } from "@phosphor-icons/react";
import api, { formatApiError } from "@/lib/api";
import { Link } from "react-router-dom";

const INSTAGRAM_URL = "https://www.instagram.com/sambhrama_04/?hl=en";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await api.post("/newsletter", { email });
      toast.success("Subscribed — see you in your inbox.");
      setEmail("");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not subscribe.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer data-testid="footer" className="bg-stone-950 text-stone-300">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <div className="flex items-center gap-4">
            <img
              src="/sambhrama-logo.jpg"
              alt="Sambhrama Event Management"
              className="h-16 w-16 rounded-full object-cover ring-1 ring-stone-800"
            />
            <div className="font-serif text-4xl text-white tracking-tight">
              Sambhrama
            </div>
          </div>
          <p className="mt-5 text-stone-400 max-w-sm leading-relaxed">
            A Bengaluru-based event studio crafting weddings, corporate
            celebrations, festivals and conferences.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <SocialLink href={INSTAGRAM_URL} icon={InstagramLogo} label="Instagram" />
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="overline text-stone-400 mb-4">Studio</div>
          <ul className="space-y-2 text-stone-400">
            <li><a href="#services" className="hover:text-white">Services</a></li>
            <li><a href="#portfolio" className="hover:text-white">Portfolio</a></li>
            <li><a href="#about" className="hover:text-white">About</a></li>
            <li>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                data-testid="footer-instagram-link"
                className="hover:text-white"
              >
                Instagram
              </a>
            </li>
            <li>
              <Link
                to="/admin/login"
                data-testid="footer-admin-link"
                className="hover:text-white"
              >
                Admin
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <div className="overline text-stone-400 mb-4">Newsletter</div>
          <p className="text-stone-400 text-sm mb-4">
            Quarterly notes on event craft, never spam.
          </p>
          <form
            data-testid="newsletter-form"
            onSubmit={subscribe}
            className="flex gap-2"
          >
            <input
              data-testid="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 h-11 px-4 bg-stone-900 border border-stone-800 rounded-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
            <button
              data-testid="newsletter-submit"
              disabled={busy}
              className="h-11 px-5 rounded-sm bg-amber-500 text-stone-900 text-sm font-medium hover:bg-amber-400 disabled:opacity-60"
            >
              {busy ? "…" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between text-stone-500 text-sm gap-3">
          <div>© {new Date().getFullYear()} Sambhrama Events</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-stone-300">Privacy</a>
            <a href="#" className="hover:text-stone-300">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      data-testid={`social-${label.toLowerCase()}`}
      className="w-11 h-11 rounded-full border border-stone-800 grid place-items-center text-stone-300 hover:text-white hover:border-amber-500 hover:bg-stone-900 transition-colors"
    >
      <Icon size={20} weight="duotone" />
    </a>
  );
}
