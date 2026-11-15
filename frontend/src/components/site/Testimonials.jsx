import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Quotes, Star } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export default function Testimonials() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api
      .get("/testimonials")
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  return (
    <section
      id="testimonials"
      data-testid="testimonials-section"
      className="relative bg-white py-24 md:py-36 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        <div className="text-center mb-16">
          <span className="overline">Words from clients</span>
          <h2 className="font-serif text-4xl md:text-6xl tracking-tight text-stone-900 mt-3">
            Trusted by the <em className="italic text-rose-700">tellers</em>
            <br className="hidden md:block" /> of stories worth living.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {items.map((t, idx) => (
            <motion.figure
              key={t.id}
              data-testid={`testimonial-${t.id}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`relative bg-stone-50 border border-stone-200 rounded-sm p-8 md:p-10 ${
                idx % 3 === 0 ? "md:col-span-2" : ""
              }`}
            >
              <Quotes
                size={32}
                weight="fill"
                className="text-amber-500/40 absolute top-6 right-6"
              />
              <div className="flex items-center gap-1 text-amber-500 mb-4">
                {Array.from({ length: t.rating || 5 }).map((_, i) => (
                  <Star key={i} size={16} weight="fill" />
                ))}
              </div>
              <blockquote className="font-serif italic text-xl md:text-2xl text-stone-800 leading-snug">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-stone-200">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-rose-500 flex items-center justify-center text-white font-serif">
                  {t.author?.[0] || "S"}
                </div>
                <div>
                  <div className="font-medium text-stone-900">{t.author}</div>
                  <div className="text-stone-500 text-sm">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>

      {/* Smooth fade into BookingWizard (stone-900) — eliminates the hard section edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 md:h-40 bg-gradient-to-b from-transparent to-stone-900 z-[1]" />
    </section>
  );
}
