import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Plus, X, ArrowRight } from "@phosphor-icons/react";

const CATEGORIES = [
  "All",
  "Wedding",
  "Sangeet",
  "Haldi",
  "Mehendi",
  "Birthday",
  "Corporate Event",
  "Festival",
  "Conference",
  "Pooja",
];

export default function Portfolio() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/portfolio")
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === "All" ? items : items.filter((i) => i.category === filter)),
    [items, filter]
  );

  return (
    <section
      id="portfolio"
      data-testid="portfolio-section"
      className="relative bg-stone-900 text-stone-50 py-24 md:py-36 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          <div className="md:col-span-6">
            <span className="overline text-amber-300">Recent work</span>
            <h2 className="font-serif text-4xl md:text-6xl tracking-tight mt-3 leading-[1.05]">
              A portfolio of <em className="italic text-amber-300">moments</em>.
            </h2>
          </div>
          <div className="md:col-span-5 md:col-start-8 self-end">
            <p className="text-stone-300 text-base md:text-lg leading-relaxed">
              Filter by type — every image is from a real Sambhrama production.
            </p>
          </div>
        </div>

        <div
          data-testid="portfolio-filters"
          className="flex flex-wrap gap-2 mb-10"
        >
          {CATEGORIES.map((c) => (
            <button
              key={c}
              data-testid={`portfolio-filter-${c.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setFilter(c)}
              className={`px-4 h-9 rounded-full text-sm border transition-colors ${
                filter === c
                  ? "bg-amber-400 text-stone-900 border-amber-400"
                  : "border-stone-700 text-stone-300 hover:bg-stone-800"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-stone-400">Loading portfolio…</div>
        ) : filtered.length === 0 ? (
          <div className="text-stone-400">No items yet for this category.</div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
            data-testid="portfolio-grid"
          >
            <AnimatePresence>
              {filtered.map((item, idx) => (
                <motion.button
                  layout
                  key={item.id}
                  data-testid={`portfolio-item-${item.id}`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.5, delay: (idx % 8) * 0.04 }}
                  onClick={() => setActive(item)}
                  className={`group relative overflow-hidden border border-stone-800 rounded-sm bg-stone-800 ${
                    idx % 5 === 0 ? "md:col-span-2 md:row-span-2 aspect-square" : "aspect-[4/5]"
                  }`}
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-left">
                    <div className="overline text-amber-300">{item.category}</div>
                    <div className="font-serif text-lg md:text-2xl text-white mt-1 leading-tight">
                      {item.title}
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={16} weight="bold" />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4"
            data-testid="portfolio-lightbox"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative max-w-4xl w-full bg-stone-900 border border-stone-700 rounded-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={active.image_url}
                alt={active.title}
                className="w-full max-h-[70vh] object-cover"
              />
              <button
                data-testid="portfolio-lightbox-close"
                onClick={() => setActive(null)}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-stone-900/80 text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
              <div className="p-6 md:p-8">
                <div className="overline text-amber-300">{active.category}</div>
                <h3 className="font-serif text-3xl md:text-4xl text-white mt-2">
                  {active.title}
                </h3>
                <p className="text-stone-300 mt-3">{active.description}</p>
                {active.date && (
                  <p className="text-stone-500 text-sm mt-3">{active.date}</p>
                )}
                <Link
                  to={`/portfolio/${active.id}`}
                  data-testid="lightbox-case-study-link"
                  className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-amber-500 text-stone-900 text-sm font-medium hover:bg-amber-400"
                >
                  Read the full case study <ArrowRight size={16} weight="bold" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
