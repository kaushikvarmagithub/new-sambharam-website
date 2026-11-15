import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, InstagramLogo, ArrowRight } from "@phosphor-icons/react";
import api from "@/lib/api";
import MarigoldSVG, { PetalSVG } from "./MarigoldSVG";
import ReelModal from "./ReelModal";

const INSTAGRAM_URL = "https://www.instagram.com/sambhrama_04/?hl=en";

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    api
      .get("/reels")
      .then((r) => setReels(r.data || []))
      .catch(() => setReels([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && reels.length === 0) return null; // hide entirely if no reels

  return (
    <section
      id="reels"
      data-testid="reels-section"
      className="relative text-white py-20 sm:py-24 md:py-28 lg:py-32 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 18% 25%, rgba(168, 85, 247, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 82% 70%, rgba(217, 70, 239, 0.30) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.20) 0%, transparent 60%), linear-gradient(180deg, #3b0764 0%, #4c1d95 35%, #581c87 65%, #3b0764 100%)",
      }}
    >
      {/* Smooth fade IN from Portfolio (stone-900) at the top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 md:h-40 bg-gradient-to-b from-stone-900 to-transparent z-[1]" />
      {/* Smooth fade OUT into About (stone-50) at the bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 md:h-40 bg-gradient-to-b from-transparent to-stone-50 z-[1]" />

      {/* Vibrant glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-[20rem] sm:w-[30rem] md:w-[40rem] h-[20rem] sm:h-[30rem] md:h-[40rem] rounded-full bg-fuchsia-500/25 blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[20rem] sm:w-[30rem] md:w-[40rem] h-[20rem] sm:h-[30rem] md:h-[40rem] rounded-full bg-violet-500/25 blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-purple-500/20 blur-[100px] pointer-events-none" />

      {/* Decorative pattern - subtle paisley dots */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #e9d5ff 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* TOP MARIGOLD GARLAND — slight offset so it tucks below the fixed nav cleanly */}
      <Garland className="absolute top-2 sm:top-3 md:top-4 left-0 right-0 z-10" position="top" />
      {/* BOTTOM MARIGOLD GARLAND */}
      <Garland
        className="absolute bottom-0 left-0 right-0 z-10"
        position="bottom"
      />

      {/* Corner marigolds — positioned outside the safe content area so they never crowd headings */}
      <MarigoldSVG className="absolute -top-10 -left-10 sm:-top-14 sm:-left-14 md:-top-16 md:-left-16 lg:-top-20 lg:-left-20 w-24 sm:w-32 md:w-44 lg:w-56 text-fuchsia-500 drop-shadow-[0_0_25px_rgba(217,70,239,0.55)] rotate-12 opacity-80 md:opacity-95 [animation:spin_60s_linear_infinite]" />
      <MarigoldSVG className="absolute -top-8 -right-10 sm:-top-12 sm:-right-14 md:-top-14 md:-right-16 lg:-top-16 lg:-right-20 w-20 sm:w-28 md:w-40 lg:w-52 text-pink-500 drop-shadow-[0_0_25px_rgba(236,72,153,0.55)] -rotate-12 opacity-80 md:opacity-95 [animation:spin_70s_linear_infinite_reverse]" />
      <MarigoldSVG className="absolute -bottom-10 -right-10 sm:-bottom-14 sm:-right-14 md:-bottom-16 md:-right-16 lg:-bottom-20 lg:-right-20 w-28 sm:w-36 md:w-48 lg:w-60 text-purple-500 drop-shadow-[0_0_30px_rgba(168,85,247,0.55)] -rotate-12 opacity-80 md:opacity-95 [animation:spin_70s_linear_infinite_reverse]" />
      <MarigoldSVG className="absolute -bottom-8 -left-10 sm:-bottom-12 sm:-left-14 md:-bottom-14 md:-left-16 lg:-bottom-16 lg:-left-20 w-20 sm:w-28 md:w-40 lg:w-52 text-violet-500 drop-shadow-[0_0_25px_rgba(139,92,246,0.5)] rotate-12 opacity-80 md:opacity-95 [animation:spin_80s_linear_infinite]" />
      {/* Side mid-height accents — only desktop, kept well clear of cards */}
      <MarigoldSVG className="hidden lg:block absolute top-1/2 -translate-y-1/2 -left-10 xl:-left-12 w-20 xl:w-24 text-pink-400/80 rotate-45" />
      <MarigoldSVG className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-10 xl:-right-12 w-20 xl:w-24 text-purple-400/80 -rotate-12" />

      {/* Floating petals — fewer on mobile for performance + cleaner look */}
      {[0, 1, 2, 3].map((i) => (
        <FloatingPetal
          key={i}
          delay={i * 1.6}
          left={`${10 + i * 25}%`}
          colorIdx={i % 4}
        />
      ))}
      {/* extra petals only on larger screens */}
      <div className="hidden md:contents">
        {[4, 5, 6, 7].map((i) => (
          <FloatingPetal
            key={i}
            delay={i * 1.4}
            left={`${5 + i * 12}%`}
            colorIdx={i % 4}
          />
        ))}
      </div>

      {/* Diya / spark twinkles — density scales with viewport */}
      {[...Array(8)].map((_, i) => (
        <Twinkle key={i} idx={i} />
      ))}
      <div className="hidden md:contents">
        {[...Array(8)].map((_, i) => (
          <Twinkle key={`md-${i}`} idx={i + 8} />
        ))}
      </div>

      {/* Section header */}
      <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-6 md:px-10 mb-10 sm:mb-12 md:mb-16 lg:mb-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-end">
          <div className="md:col-span-7">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-fuchsia-300/40 shadow-[0_0_20px_rgba(217,70,239,0.20)]">
              <MarigoldSVG className="w-5 h-5 sm:w-6 sm:h-6 text-fuchsia-300 shrink-0" />
              <span className="overline text-fuchsia-100 tracking-[0.25em] sm:tracking-[0.3em] text-[10px] sm:text-xs whitespace-nowrap font-semibold">
                FROM THE CELEBRATION
              </span>
              <MarigoldSVG className="w-5 h-5 sm:w-6 sm:h-6 text-pink-300 shrink-0" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 via-pink-200 to-violet-200 drop-shadow-[0_2px_12px_rgba(217,70,239,0.30)]">
              Reels from <em className="italic">our</em>{" "}
              <em className="italic">moments</em>.
            </h2>
          </div>
          <div className="md:col-span-5">
            <p className="text-purple-50/90 text-sm sm:text-base md:text-lg leading-relaxed">
              Tap into the energy of our celebration. Vertical scroll, just like
              Instagram. Click any reel to watch full-screen, unmute, and swipe
              through more.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              data-testid="reels-instagram-link"
              className="mt-3 sm:mt-4 inline-flex items-center gap-2 text-fuchsia-200 hover:text-fuchsia-100 text-sm group font-medium"
            >
              <InstagramLogo size={16} weight="duotone" />
              @sambhrama_04
              <ArrowRight
                size={14}
                weight="bold"
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Horizontal scroll of reel preview cards */}
      <div
        data-testid="reels-strip"
        className="relative z-20 max-w-7xl mx-auto"
      >
        {loading ? (
          <div className="px-5 sm:px-6 md:px-10 text-fuchsia-200/80">
            Loading reels…
          </div>
        ) : (
          <div
            className="flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto pb-8 pt-3 no-scrollbar snap-x snap-mandatory scroll-pl-5 sm:scroll-pl-6 md:scroll-pl-10 px-5 sm:px-6 md:px-10"
          >
            {reels.map((reel, i) => (
              <ReelCard
                key={reel.id}
                reel={reel}
                onOpen={() => setOpenIndex(i)}
                idx={i}
              />
            ))}
            {/* Trailing Instagram CTA card */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              data-testid="reels-follow-card"
              className="relative shrink-0 w-[70vw] xs:w-[60vw] sm:w-[220px] md:w-[240px] lg:w-[260px] aspect-[9/16] snap-start rounded-2xl border-2 border-purple-400/50 bg-gradient-to-br from-pink-300/40 via-fuchsia-300/30 to-purple-300/40 backdrop-blur hover:from-pink-300/60 hover:to-purple-300/60 transition-all grid place-items-center text-center p-5 sm:p-6 overflow-hidden"
            >
              {/* Corner marigolds */}
              <MarigoldSVG className="absolute -top-3 -left-3 w-12 sm:w-14 text-fuchsia-500" />
              <MarigoldSVG className="absolute -bottom-3 -right-3 w-12 sm:w-14 text-pink-500" />
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-purple-500 grid place-items-center text-white shadow-lg shadow-purple-500/40">
                  <InstagramLogo size={24} weight="duotone" />
                </div>
                <div className="font-serif text-lg sm:text-xl mt-4 sm:mt-5 text-purple-900">
                  More on Instagram
                </div>
                <div className="text-purple-700/80 text-xs sm:text-sm mt-1.5 sm:mt-2">
                  @sambhrama_04
                </div>
                <div className="mt-4 sm:mt-5 inline-flex items-center gap-1 text-fuchsia-700 text-xs sm:text-sm font-medium">
                  Follow <ArrowRight size={14} weight="bold" />
                </div>
              </div>
            </a>
          </div>
        )}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <ReelModal
            reels={reels}
            startIndex={openIndex}
            onClose={() => setOpenIndex(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function ReelCard({ reel, onOpen, idx }) {
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Lazy-load: only attach src when card scrolls into view
  useEffect(() => {
    if (!wrapRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, []);

  // Auto-play preview muted on hover (desktop) and when visible (mobile)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (visible && loaded) {
      v.muted = true;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [visible, loaded]);

  // Alternate marigold colors per card
  const topColor = idx % 2 === 0 ? "text-fuchsia-500" : "text-pink-500";
  const bottomColor = idx % 2 === 0 ? "text-purple-500" : "text-violet-500";

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: idx * 0.06 }}
      className="relative shrink-0 w-[70vw] xs:w-[60vw] sm:w-[220px] md:w-[240px] lg:w-[260px]"
    >
      {/* Decorative marigolds at corners — outside the card */}
      <MarigoldSVG
        className={`absolute -top-3 sm:-top-4 -left-3 sm:-left-4 w-10 sm:w-12 z-10 ${topColor} drop-shadow-[0_0_8px_rgba(217,70,239,0.6)] pointer-events-none`}
      />
      <MarigoldSVG
        className={`absolute -bottom-3 sm:-bottom-4 -right-3 sm:-right-4 w-10 sm:w-12 z-10 ${bottomColor} drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] pointer-events-none`}
      />

      <button
        onClick={onOpen}
        data-testid={`reel-card-${reel.id}`}
        className="group relative w-full aspect-[9/16] snap-start rounded-2xl overflow-hidden bg-stone-900 shadow-xl shadow-purple-700/30 hover:shadow-fuchsia-500/40 transition-all border-2 border-purple-400/40 hover:border-fuchsia-400/80 active:scale-[0.98] touch-manipulation"
      >
        {/* Loading shimmer */}
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-fuchsia-400/40 border-t-fuchsia-400 rounded-full"
            />
          </div>
        )}

        {visible && (
          <video
            ref={videoRef}
            src={reel.video_url}
            playsInline
            loop
            muted
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Gradient overlay with cool tones */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-stone-950/10 to-fuchsia-900/20" />

        {/* Centre play icon — always faintly visible on mobile, fully on hover (desktop) */}
        <div className="absolute inset-0 grid place-items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 backdrop-blur grid place-items-center text-white border-2 border-white/40 shadow-lg shadow-fuchsia-500/50">
            <Play size={20} weight="fill" />
          </div>
        </div>

        {/* Caption */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-left z-10">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-pink-200 mb-1 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-pink-300" />
            @sambhrama_04
          </div>
          {reel.caption && (
            <div className="text-white text-xs sm:text-sm leading-snug line-clamp-2">
              {reel.caption}
            </div>
          )}
        </div>

        {/* Top-left INSTAGRAM-style ribbon */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/85 to-purple-500/85 backdrop-blur text-[9px] sm:text-[10px] uppercase tracking-widest text-white border border-white/20 shadow">
          <InstagramLogo size={10} weight="duotone" /> Reel
        </div>
      </button>
    </motion.div>
  );
}

function FloatingPetal({ delay, left, colorIdx = 0 }) {
  const colors = [
    "text-pink-500/80",
    "text-fuchsia-500/80",
    "text-purple-500/75",
    "text-violet-400/75",
  ];
  return (
    <motion.div
      className={`absolute top-0 pointer-events-none ${colors[colorIdx]}`}
      style={{ left }}
      initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
      animate={{
        y: ["-40px", "110vh"],
        x: ["0px", "30px", "-20px", "10px"],
        opacity: [0, 0.85, 0.65, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 14,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <PetalSVG className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
    </motion.div>
  );
}

function Twinkle({ idx }) {
  const left = (idx * 73) % 100;
  const top = (idx * 37) % 100;
  const delay = (idx * 0.4) % 3;
  return (
    <motion.span
      className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-fuchsia-300 pointer-events-none"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        boxShadow:
          "0 0 12px rgba(232,121,249,0.9), 0 0 20px rgba(168,85,247,0.5)",
      }}
      animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.3, 0.6] }}
      transition={{ duration: 2.4, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/**
 * Decorative marigold garland strung across full width.
 * Responsive: fewer blooms on mobile, more on desktop.
 * `position`: "top" sags downward, "bottom" sags upward.
 */
function Garland({ className = "", position = "top" }) {
  const isBottom = position === "bottom";
  return (
    <div
      className={`pointer-events-none ${className} ${
        isBottom ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      {/* mobile garland (fewer blooms) */}
      <div className="block sm:hidden">
        <GarlandSVG blooms={8} flipped={isBottom} heightClass="h-10" />
      </div>
      {/* tablet garland */}
      <div className="hidden sm:block md:hidden">
        <GarlandSVG blooms={12} flipped={isBottom} heightClass="h-12" />
      </div>
      {/* desktop garland */}
      <div className="hidden md:block">
        <GarlandSVG blooms={18} flipped={isBottom} heightClass="h-16" />
      </div>
    </div>
  );
}

function GarlandSVG({ blooms, flipped, heightClass }) {
  return (
    <>
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        className={`w-full ${heightClass}`}
      >
        <path
          d="M0 10 Q 300 80 600 50 T 1200 10"
          stroke="rgba(107, 33, 168, 0.6)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M0 10 Q 300 80 600 50 T 1200 10"
          stroke="rgba(232, 121, 249, 0.45)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="4 6"
        />
      </svg>
      <div className={`relative -mt-10 sm:-mt-12 md:-mt-16 ${heightClass}`}>
        {Array.from({ length: blooms }).map((_, i) => {
          const pct = (i / (blooms - 1)) * 100;
          const t = pct / 100;
          const sag = 10 + 40 * (4 * t * (1 - t));
          const color =
            i % 3 === 0
              ? "text-fuchsia-500"
              : i % 3 === 1
              ? "text-pink-500"
              : "text-purple-500";
          const size =
            i % 2 === 0
              ? "w-6 sm:w-8 md:w-10"
              : "w-5 sm:w-7 md:w-9";
          return (
            <motion.div
              key={i}
              className={`absolute -translate-x-1/2 ${color} drop-shadow-[0_2px_6px_rgba(217,70,239,0.5)]`}
              style={{
                left: `${pct}%`,
                top: `${sag - 8}px`,
              }}
              animate={{ rotate: flipped ? [2, -2, 2] : [-2, 2, -2] }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            >
              <MarigoldSVG className={size} />
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
