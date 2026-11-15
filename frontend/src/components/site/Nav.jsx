import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "@phosphor-icons/react";

const NAV_LINKS = [
  { id: "services", label: "Services" },
  { id: "portfolio", label: "Portfolio" },
  { id: "reels", label: "Reels" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <header
      data-testid="site-nav"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <a
          href="#top"
          data-testid="brand-logo"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-3"
        >
          <img
            src="/sambhrama-logo.jpg"
            alt="Sambhrama Event Management"
            className="h-11 md:h-12 w-11 md:w-12 rounded-full object-cover ring-1 ring-stone-200 shadow-sm"
          />
          <span className="font-serif text-2xl md:text-[26px] tracking-tight text-stone-900 hidden sm:inline">
            Sambhrama
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <li key={l.id}>
              <button
                data-testid={`nav-${l.id}`}
                onClick={() => scrollTo(l.id)}
                className="text-sm text-stone-700 hover:text-stone-900 transition-colors relative group"
              >
                {l.label}
                <span className="absolute left-0 -bottom-1 h-px w-0 bg-amber-600 transition-all group-hover:w-full" />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            data-testid="nav-cta-plan"
            onClick={() => scrollTo("contact")}
            className="hidden md:inline-flex items-center px-5 h-10 rounded-full bg-stone-900 text-stone-50 text-sm hover:bg-stone-800 transition-colors"
          >
            Plan Your Event
          </button>
          <button
            data-testid="nav-mobile-toggle"
            className="md:hidden p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden glass-nav border-t border-stone-200/50"
            data-testid="mobile-menu"
          >
            <ul className="px-6 py-6 flex flex-col gap-4">
              {NAV_LINKS.map((l) => (
                <li key={l.id}>
                  <button
                    data-testid={`mobile-nav-${l.id}`}
                    onClick={() => scrollTo(l.id)}
                    className="text-base text-stone-800"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  data-testid="mobile-nav-cta"
                  onClick={() => scrollTo("contact")}
                  className="mt-2 inline-flex items-center px-5 h-11 rounded-full bg-stone-900 text-stone-50 text-sm"
                >
                  Plan Your Event
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
