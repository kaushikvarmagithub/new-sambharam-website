import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarBlank, MapPin, Users, CheckCircle, Quotes } from "@phosphor-icons/react";
import api from "@/lib/api";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";

export default function CaseStudy() {
  const { id } = useParams();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get(`/portfolio/${id}`)
      .then((r) => {
        setItem(r.data);
        return api.get(`/portfolio`);
      })
      .then((r) => {
        const all = (r.data || []).filter((x) => x.id !== id);
        // Prefer same category, then fall back to any other items
        const sameCategory = all.filter((x) => x.category === (item?.category));
        // We don't have `item` populated yet here on the first run, so just shuffle all
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        setRelated(shuffled.slice(0, 3));
      })
      .catch(() => setError("Case study not found."))
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-stone-50 text-stone-500">
        Loading…
      </div>
    );
  }

  if (error || !item) {
    return (
      <div data-testid="case-study-not-found" className="min-h-screen grid place-items-center bg-stone-50 text-center px-6">
        <div>
          <div className="font-serif text-5xl text-stone-900">Case study not found</div>
          <p className="text-stone-500 mt-3">It may have been removed or the link is wrong.</p>
          <Link
            to="/"
            data-testid="back-home"
            className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-stone-900 text-stone-50 text-sm"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  const highlights = item.highlights || [];
  const gallery = item.gallery && item.gallery.length > 0 ? item.gallery : [item.image_url];

  return (
    <div data-testid="case-study-page" className="bg-stone-50">
      <Nav />

      {/* Hero */}
      <section className="relative min-h-[78vh] bg-stone-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${item.image_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/60 via-stone-900/45 to-stone-900/95" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-32 md:pt-44 pb-24">
          <button
            data-testid="case-study-back"
            onClick={() => nav(-1)}
            className="inline-flex items-center gap-2 text-stone-200 hover:text-amber-300 text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-6"
          >
            <span className="overline text-amber-300">{item.category}</span>
            <h1
              data-testid="case-study-title"
              className="font-serif text-5xl md:text-7xl text-white tracking-tight mt-3 leading-[1.05] max-w-4xl"
            >
              {item.title}
            </h1>
            <p className="text-stone-200/85 mt-6 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
              {item.description}
            </p>

            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-stone-100">
              {item.date && (
                <Meta icon={CalendarBlank} label="Date" value={formatDate(item.date)} />
              )}
              {item.location && <Meta icon={MapPin} label="Location" value={item.location} />}
              {item.guest_count != null && item.guest_count !== "" && (
                <Meta icon={Users} label="Guests" value={item.guest_count?.toLocaleString?.() || item.guest_count} />
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-7">
          <span className="overline">The story</span>
          <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mt-3 leading-tight">
            What we built, and why it worked.
          </h2>
          <div data-testid="case-study-long-description" className="prose prose-stone max-w-none mt-6 text-stone-700 text-lg leading-relaxed whitespace-pre-line">
            {item.long_description || item.description}
          </div>
        </div>

        {highlights.length > 0 && (
          <aside data-testid="case-study-highlights" className="md:col-span-5 md:pl-8 md:border-l border-stone-200">
            <span className="overline">Highlights</span>
            <ul className="mt-6 space-y-5">
              {highlights.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <CheckCircle
                    size={22}
                    weight="duotone"
                    className="text-amber-600 shrink-0 mt-0.5"
                  />
                  <span className="text-stone-800">{h}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>

      {/* Gallery */}
      {gallery.length > 1 && (
        <section className="bg-stone-100 py-20">
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <span className="overline">Gallery</span>
            <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mt-3 mb-8">
              From the day.
            </h2>
            <div
              data-testid="case-study-gallery"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {gallery.map((g, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="aspect-[4/3] overflow-hidden rounded-sm bg-stone-200"
                >
                  <img
                    src={g}
                    alt={`${item.title} — frame ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pull-quote */}
      <section className="bg-stone-900 text-stone-50 py-20 hero-grain">
        <div className="max-w-3xl mx-auto px-6 md:px-10 text-center">
          <Quotes size={36} weight="fill" className="mx-auto text-amber-400/60" />
          <p className="font-serif italic text-3xl md:text-4xl mt-6 leading-snug">
            "They didn't just plan our event. They handed us our memory of it,
            already framed."
          </p>
          <p className="overline text-amber-300 mt-6">A Sambhrama client</p>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-stone-50 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="overline">Explore more</span>
                <h2 className="font-serif text-3xl md:text-5xl text-stone-900 mt-3 leading-tight">
                  More celebrations.
                </h2>
              </div>
              <Link
                to="/"
                state={{ scrollTo: "portfolio" }}
                data-testid="view-all-portfolio"
                className="text-stone-700 text-sm hover:text-stone-900 inline-flex items-center gap-1"
              >
                View all <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/portfolio/${r.id}`}
                  data-testid={`related-case-${r.id}`}
                  className="group block overflow-hidden border border-stone-200 rounded-sm bg-white card-hover"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={r.image_url}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <div className="overline text-amber-700">{r.category}</div>
                    <div className="font-serif text-xl text-stone-900 mt-1">{r.title}</div>
                    <div className="text-stone-500 text-sm mt-1 line-clamp-2">{r.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-amber-500/15 border-y border-amber-200/60">
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-16 text-center">
          <h3 className="font-serif text-3xl md:text-5xl text-stone-900 tracking-tight">
            Planning something{" "}
            <em className="italic text-rose-700">just as memorable</em>?
          </h3>
          <Link
            to="/"
            state={{ scrollTo: "contact" }}
            data-testid="case-study-cta"
            className="mt-8 inline-flex items-center gap-2 h-12 px-7 rounded-full bg-stone-900 text-stone-50 hover:bg-stone-800 transition-colors"
          >
            Start a conversation <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={20} weight="duotone" className="text-amber-300 mt-0.5" />
      <div>
        <div className="overline text-stone-400">{label}</div>
        <div className="font-serif text-xl text-white mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
}
