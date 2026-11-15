import { motion } from "framer-motion";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1771992226340-2054435618e4?auto=format&fit=crop&w=1920&q=80";

export default function Hero() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative min-h-[92vh] w-full overflow-hidden bg-stone-900"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/55 via-stone-900/40 to-stone-900/85" />
      <div className="absolute inset-0 hero-grain mix-blend-overlay opacity-70" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pt-32 md:pt-48 pb-24 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-9 lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-300/30 text-amber-100 text-xs tracking-widest uppercase"
          >
            <Sparkle size={14} weight="fill" />
            Bengaluru, India
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-white text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[1.02] tracking-tight mt-6"
          >
            Crafting <em className="italic text-amber-300">unforgettable</em>
            <br className="hidden sm:block" /> celebrations, end to end.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="text-stone-200/85 text-lg md:text-xl mt-7 max-w-2xl font-light leading-relaxed"
          >
            From intimate weddings and corporate galas to festivals and
            conferences — Sambhrama brings your vision to life with{" "}
            <span className="text-stone-50">precision, warmth, and joy</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row gap-3"
          >
            <button
              data-testid="hero-cta-plan"
              onClick={() => scrollTo("contact")}
              className="group inline-flex items-center justify-center gap-2 h-13 px-7 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-900 text-sm font-medium tracking-wide transition-colors"
            >
              Plan Your Event
              <ArrowRight
                size={18}
                weight="bold"
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
            <button
              data-testid="hero-cta-portfolio"
              onClick={() => scrollTo("portfolio")}
              className="inline-flex items-center justify-center gap-2 h-13 px-7 py-4 rounded-full border border-white/30 text-white text-sm font-medium tracking-wide hover:bg-white/10 transition-colors"
            >
              See Our Work
            </button>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/60 text-xs tracking-widest uppercase">
        <span className="diamond-divider">scroll</span>
      </div>

      {/* Smooth fade into Services (stone-50) — eliminates the hard section edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 md:h-40 bg-gradient-to-b from-transparent to-stone-50 z-[1]" />
    </section>
  );
}
