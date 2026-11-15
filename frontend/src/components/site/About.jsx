import { motion } from "framer-motion";
import { CheckCircle } from "@phosphor-icons/react";

const PILLARS = [
  {
    t: "Senior producer on every event",
    d: "Never a junior, never outsourced. The person in your first call leads the day-of show.",
  },
  {
    t: "Hand-picked vendor partners",
    d: "We collaborate with a thoughtfully chosen network — catering, florals, AV, photography. Transparent quotes, no hidden markups.",
  },
  {
    t: "Calm in the chaos",
    d: "Multi-day runbooks, contingency plans, and a war-room mindset — so you can be the guest.",
  },
];

export default function About() {
  return (
    <section
      id="about"
      data-testid="about-section"
      className="relative bg-stone-50 py-24 md:py-36"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="md:col-span-6 lg:col-span-5"
        >
          <div className="relative overflow-hidden rounded-sm border border-stone-200">
            <img
              src="https://images.unsplash.com/photo-1775163560631-6ff15eb2fa1f?auto=format&fit=crop&w=1200&q=80"
              alt="Sambhrama team at work"
              className="w-full h-[520px] object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-900/70 to-transparent p-6 text-white">
              <div className="overline text-amber-300">Bengaluru, India</div>
              <div className="font-serif text-2xl mt-2">
                Built by event obsessives.
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="md:col-span-6 lg:col-span-6 md:col-start-7 lg:col-start-7"
        >
          <span className="overline">About Sambhrama</span>
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight text-stone-900 mt-3 leading-[1.05]">
            We don't <em className="italic text-amber-700">plan</em> events.
            <br />
            We <em className="italic text-rose-700">choreograph</em> them.
          </h2>
          <p className="text-stone-600 mt-6 text-lg leading-relaxed">
            Sambhrama is a Bengaluru-based event studio for celebrations that
            matter. We're a small team of producers, designers, and logistics
            nerds — fluent in tradition, obsessed with modernity, allergic to
            "it'll-be-fine".
          </p>

          <ul className="mt-10 space-y-5">
            {PILLARS.map((p) => (
              <li
                key={p.t}
                data-testid={`about-pillar-${p.t.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex gap-4"
              >
                <CheckCircle
                  size={26}
                  weight="duotone"
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <div>
                  <div className="font-serif text-xl text-stone-900">{p.t}</div>
                  <div className="text-stone-600 text-sm mt-1 leading-relaxed">
                    {p.d}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
