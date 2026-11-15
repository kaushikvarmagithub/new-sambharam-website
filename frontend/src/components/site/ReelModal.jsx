import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowUp,
  ArrowDown,
  SpeakerHigh,
  SpeakerSlash,
  Play,
  InstagramLogo,
} from "@phosphor-icons/react";
import MarigoldSVG, { PetalSVG } from "./MarigoldSVG";

const INSTAGRAM_URL = "https://www.instagram.com/sambhrama_04/?hl=en";

export default function ReelModal({ reels, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const containerRef = useRef(null);
  const videoRefs = useRef({});

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown")
        setIndex((i) => Math.min(i + 1, reels.length - 1));
      else if (e.key === "ArrowUp") setIndex((i) => Math.max(i - 1, 0));
      else if (e.key === " " || e.key === "m") {
        e.preventDefault();
        setMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reels.length, onClose]);

  // Scroll selected reel into view in container
  useEffect(() => {
    const el = videoRefs.current[reels[index]?.id];
    if (el?.parentElement) {
      el.parentElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [index, reels]);

  // Pause non-active videos, play active
  useEffect(() => {
    reels.forEach((r, i) => {
      const v = videoRefs.current[r.id];
      if (!v) return;
      if (i === index) {
        v.muted = muted;
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [index, muted, reels]);

  // IntersectionObserver — when user scrolls in container, update index
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const slides = container.querySelectorAll("[data-reel-slide]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const i = parseInt(entry.target.getAttribute("data-reel-slide"), 10);
            if (!isNaN(i)) setIndex(i);
          }
        });
      },
      { root: container, threshold: [0.6] }
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [reels]);

  if (!reels.length) return null;

  return (
    <motion.div
      data-testid="reel-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top, #6b21a8 0%, #2e1065 60%, #0a0314 100%)",
      }}
    >
      {/* Vibrant glow accents */}
      <div className="absolute -top-32 -left-32 w-[24rem] md:w-[40rem] h-[24rem] md:h-[40rem] rounded-full bg-pink-400/25 blur-[80px] md:blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[24rem] md:w-[40rem] h-[24rem] md:h-[40rem] rounded-full bg-purple-500/25 blur-[80px] md:blur-[120px] pointer-events-none" />

      {/* Decorative marigolds in modal corners — kept compact and off-frame so they never crowd the video */}
      <MarigoldSVG className="absolute -top-6 -left-6 sm:-top-8 sm:-left-8 md:-top-10 md:-left-10 lg:-top-12 lg:-left-12 w-16 sm:w-20 md:w-28 lg:w-36 text-fuchsia-400/85 rotate-12 drop-shadow-[0_0_20px_rgba(217,70,239,0.6)] z-20 pointer-events-none [animation:spin_50s_linear_infinite]" />
      <MarigoldSVG className="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 md:-top-10 md:-right-10 lg:-top-12 lg:-right-12 w-16 sm:w-20 md:w-28 lg:w-36 text-pink-400/85 -rotate-12 drop-shadow-[0_0_20px_rgba(236,72,153,0.6)] z-20 pointer-events-none [animation:spin_60s_linear_infinite_reverse]" />
      <MarigoldSVG className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8 md:-bottom-10 md:-left-10 lg:-bottom-12 lg:-left-12 w-16 sm:w-20 md:w-28 lg:w-36 text-purple-400/85 rotate-45 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)] z-20 pointer-events-none" />
      <MarigoldSVG className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 md:-bottom-10 md:-right-10 lg:-bottom-12 lg:-right-12 w-16 sm:w-20 md:w-28 lg:w-36 text-violet-400/80 -rotate-45 drop-shadow-[0_0_20px_rgba(139,92,246,0.55)] z-20 pointer-events-none" />

      {/* Side marigold accents (laptop only) */}
      <MarigoldSVG className="hidden lg:block absolute top-1/2 -left-10 -translate-y-1/2 w-24 text-pink-300/70 z-20 pointer-events-none" />
      <MarigoldSVG className="hidden lg:block absolute top-1/2 -right-10 -translate-y-1/2 w-24 text-purple-300/70 z-20 pointer-events-none" />

      {/* Floating petals (fewer on mobile) */}
      {[0, 1, 2].map((i) => (
        <FloatingPetal
          key={i}
          delay={i * 1.4}
          left={`${15 + i * 30}%`}
          colorIdx={i % 4}
        />
      ))}
      <div className="hidden md:contents">
        {[3, 4, 5].map((i) => (
          <FloatingPetal
            key={i}
            delay={i * 1.2}
            left={`${10 + i * 18}%`}
            colorIdx={i % 4}
          />
        ))}
      </div>

      {/* Progress dots — top, above everything */}
      <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-40 flex gap-1 max-w-[50vw] flex-wrap justify-center px-3">
        {reels.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "bg-gradient-to-r from-pink-400 to-purple-500 w-6 sm:w-8 shadow-[0_0_10px_rgba(217,70,239,0.7)]"
                : "bg-white/30 w-3 sm:w-4"
            }`}
          />
        ))}
      </div>

      {/* Close */}
      <button
        data-testid="reel-modal-close"
        onClick={onClose}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-pink-400/45 to-purple-500/45 hover:from-pink-400/65 hover:to-purple-500/65 backdrop-blur grid place-items-center text-white border border-pink-300/50 shadow-lg"
        aria-label="Close"
      >
        <X size={18} className="sm:hidden" />
        <X size={20} className="hidden sm:block" />
      </button>

      {/* Vertical navigation arrows (tablet + desktop only) */}
      <button
        data-testid="reel-prev"
        onClick={() => setIndex((i) => Math.max(i - 1, 0))}
        disabled={index === 0}
        className="hidden md:grid absolute right-4 lg:right-6 top-1/2 -translate-y-[60px] z-40 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-pink-500/25 hover:bg-pink-500/45 backdrop-blur place-items-center text-white border border-pink-300/45 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
        aria-label="Previous reel"
      >
        <ArrowUp size={18} weight="bold" />
      </button>
      <button
        data-testid="reel-next"
        onClick={() => setIndex((i) => Math.min(i + 1, reels.length - 1))}
        disabled={index === reels.length - 1}
        className="hidden md:grid absolute right-4 lg:right-6 top-1/2 translate-y-[8px] z-40 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-purple-500/25 hover:bg-purple-500/45 backdrop-blur place-items-center text-white border border-purple-300/45 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
        aria-label="Next reel"
      >
        <ArrowDown size={18} weight="bold" />
      </button>

      {/* Follow on Instagram floating CTA — respects iPhone safe area */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noreferrer"
        data-testid="reel-instagram-cta"
        className="absolute left-1/2 -translate-x-1/2 z-40 inline-flex items-center gap-2 h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-purple-500/50 hover:shadow-fuchsia-500/60 transition-shadow border border-pink-200/70 whitespace-nowrap"
        style={{ bottom: "max(1.25rem, env(safe-area-inset-bottom, 1rem))" }}
      >
        <InstagramLogo size={16} weight="duotone" className="sm:hidden" />
        <InstagramLogo size={18} weight="duotone" className="hidden sm:block" />
        Follow @sambhrama_04
      </a>

      {/* Snap-scroll feed */}
      <div
        ref={containerRef}
        className="relative z-10 h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        data-testid="reel-feed"
      >
        {reels.map((reel, i) => (
          <ReelSlide
            key={reel.id}
            reel={reel}
            i={i}
            current={i === index}
            muted={muted}
            onUnmute={() => setMuted(false)}
            onMuteToggle={() => setMuted((m) => !m)}
            registerRef={(el) => {
              if (el) videoRefs.current[reel.id] = el;
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ReelSlide({
  reel,
  i,
  current,
  muted,
  onUnmute,
  onMuteToggle,
  registerRef,
}) {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    registerRef(videoRef.current);
  }, [registerRef]);

  return (
    <div
      data-reel-slide={i}
      className="h-[100dvh] w-full snap-start grid place-items-center relative px-2 sm:px-4 md:px-0"
    >
      <div className="relative w-full h-full md:w-auto md:h-auto flex items-center justify-center">
        {/* Decorative marigolds framing the video (tablet+ only) */}
        <MarigoldSVG className="hidden md:block absolute -top-4 -left-4 lg:-top-5 lg:-left-5 w-12 lg:w-14 text-fuchsia-400 z-20 drop-shadow-[0_0_10px_rgba(217,70,239,0.75)] pointer-events-none" />
        <MarigoldSVG className="hidden md:block absolute -top-4 -right-4 lg:-top-5 lg:-right-5 w-12 lg:w-14 text-pink-400 z-20 drop-shadow-[0_0_10px_rgba(236,72,153,0.75)] pointer-events-none" />
        <MarigoldSVG className="hidden md:block absolute -bottom-4 -left-4 lg:-bottom-5 lg:-left-5 w-12 lg:w-14 text-purple-400 z-20 drop-shadow-[0_0_10px_rgba(168,85,247,0.75)] pointer-events-none" />
        <MarigoldSVG className="hidden md:block absolute -bottom-4 -right-4 lg:-bottom-5 lg:-right-5 w-12 lg:w-14 text-violet-400 z-20 drop-shadow-[0_0_10px_rgba(139,92,246,0.7)] pointer-events-none" />

        <div className="relative w-full h-full sm:w-auto sm:h-[88dvh] md:h-[90dvh] lg:h-[92dvh] aspect-auto sm:aspect-[9/16] bg-stone-950 overflow-hidden rounded-none sm:rounded-2xl shadow-2xl shadow-purple-900/50 border-0 sm:border-2 sm:border-pink-300/40">
          {!loaded && (
            <div className="absolute inset-0 grid place-items-center text-stone-500">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-fuchsia-400/40 border-t-fuchsia-400 rounded-full"
              />
            </div>
          )}
          <video
            ref={videoRef}
            src={reel.video_url}
            playsInline
            loop
            muted={muted}
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            onClick={() => {
              if (muted) onUnmute();
              else onMuteToggle();
            }}
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* Sound indicator — lowered below the close button on mobile */}
          <button
            data-testid={`reel-mute-${reel.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onMuteToggle();
            }}
            className="absolute top-14 sm:top-16 right-3 sm:right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-pink-500/55 to-purple-600/55 backdrop-blur text-white grid place-items-center border border-pink-300/45 shadow"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <SpeakerSlash size={16} /> : <SpeakerHigh size={16} />}
          </button>

          {/* Tap-to-unmute hint */}
          <AnimatePresence>
            {current && muted && loaded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 grid place-items-center pointer-events-none"
              >
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-pink-400/95 to-purple-500/95 backdrop-blur text-white text-[11px] sm:text-xs flex items-center gap-1.5 sm:gap-2 font-medium shadow-lg">
                  <Play size={12} weight="fill" /> Tap to unmute
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Caption overlay */}
          {(reel.caption || reel.posted_date) && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-purple-950/40 to-transparent px-4 sm:px-5 pt-10 pb-24 sm:pb-20 md:pb-6 text-white">
              <div className="text-[10px] sm:text-xs uppercase tracking-widest text-pink-200 mb-1 flex items-center gap-1 flex-wrap">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-300 shadow-[0_0_6px_rgba(236,72,153,0.85)]" />
                @sambhrama_04
                {reel.posted_date && (
                  <span className="ml-1 sm:ml-2 text-white/60 normal-case tracking-normal">
                    · {reel.posted_date}
                  </span>
                )}
              </div>
              {reel.caption && (
                <p className="text-xs sm:text-sm md:text-base leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-md">
                  {reel.caption}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FloatingPetal({ delay, left, colorIdx = 0 }) {
  const colors = [
    "text-pink-400/65",
    "text-fuchsia-400/65",
    "text-purple-400/60",
    "text-violet-400/55",
  ];
  return (
    <motion.div
      className={`absolute top-0 pointer-events-none z-10 ${colors[colorIdx]}`}
      style={{ left }}
      initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
      animate={{
        y: ["-40px", "110vh"],
        x: ["0px", "30px", "-20px", "10px"],
        opacity: [0, 0.7, 0.5, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 16,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <PetalSVG className="w-5 h-5 sm:w-6 sm:h-6" />
    </motion.div>
  );
}
