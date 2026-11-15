import { motion } from "framer-motion";
import {
  Heart,
  Buildings,
  Confetti,
  Flower,
  ArrowUpRight,
} from "@phosphor-icons/react";

const SERVICES = [
  {
    icon: Heart,
    title: "Weddings",
    desc: "Multi-day, multi-tradition celebrations — mandap to mehendi, sangeet to send-off.",
    img: "https://images.unsplash.com/photo-1762708547916-ac8d2f3af1fc?auto=format&fit=crop&w=1200&q=80",
    span: "md:col-span-7 md:row-span-2",
  },
  {
    icon: Buildings,
    title: "Corporate Events",
    desc: "Product launches, town halls, leadership offsites and award nights.",
    img: "https://images.unsplash.com/photo-1762968269894-1d7e1ce8894e?auto=format&fit=crop&w=900&q=80",
    span: "md:col-span-5",
  },
  {
    icon: Confetti,
    title: "Birthdays",
    desc: "Milestone parties, kids' soirées and intimate gatherings — themed, photographed, unforgettable.",
    img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80",
    span: "md:col-span-5",
  },
  {
    icon: Flower,
    title: "Traditional Festivals",
    desc: "Marigold mandapams, diya-lit courtyards and rituals honoured to the smallest mantra.",
    img: "https://images.unsplash.com/photo-1763630055331-f9042cfa43f3?auto=format&fit=crop&w=1200&q=80",
    span: "md:col-span-12",
  },
];

export default function Services() {
  return (
    <section
      id="services"
      data-testid="services-section"
      className="relative bg-stone-50 py-24 md:py-36 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-14">
          <div className="md:col-span-5">
            <span className="overline">What we do</span>
            <h2 className="font-serif text-4xl md:text-6xl tracking-tight text-stone-900 mt-3 leading-[1.05]">
              Four crafts.
              <br />
              <em className="italic text-amber-700">One obsession.</em>
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 self-end">
            <p className="text-stone-600 text-lg leading-relaxed">
              We don't outsource the magic. Every event is led by a senior
              producer, supported by our in-house network of vetted vendors and
              an unreasonable attention to detail.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:auto-rows-[260px]">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.title} {...s} idx={i} />
          ))}
        </div>
      </div>

      {/* Smooth fade into Portfolio (stone-900) — eliminates the hard section edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 md:h-40 bg-gradient-to-b from-transparent to-stone-900 z-[1]" />
    </section>
  );
}

function ServiceCard({ icon: Icon, title, desc, img, span, idx }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: idx * 0.05 }}
      data-testid={`service-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className={`relative ${span} overflow-hidden rounded-sm border border-stone-200 bg-white group card-hover`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.4s] ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${img})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/85 via-stone-900/30 to-transparent" />
      <div className="relative h-full flex flex-col justify-between p-6 md:p-8 min-h-[260px]">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-amber-200 border border-white/25">
            <Icon size={22} weight="duotone" />
          </div>
          <ArrowUpRight
            size={20}
            className="text-white/70 group-hover:text-amber-300 transition-colors"
          />
        </div>
        <div className="text-white">
          <h3 className="font-serif text-3xl md:text-4xl tracking-tight">
            {title}
          </h3>
          <p className="text-stone-200/90 text-sm md:text-base mt-2 max-w-md leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
