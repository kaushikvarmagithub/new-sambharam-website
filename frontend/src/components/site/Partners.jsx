import Marquee from "react-fast-marquee";

/*
 * Press / partner logos rendered as inline SVGs.
 * Brand wordmarks are stylised tribute marks (not actual brand assets),
 * intended for an "as featured in" press strip on a marketing site.
 * Easy to swap for real client logos via admin later.
 */

const PRESS = [
  { name: "Vogue India", svg: VogueIndia },
  { name: "The Knot", svg: TheKnot },
  { name: "Forbes India", svg: ForbesIndia },
  { name: "Condé Nast", svg: CondeNast },
  { name: "WeddingSutra", svg: WeddingSutra },
  { name: "BrideToday", svg: BrideToday },
  { name: "BW Businessworld", svg: BWBusinessworld },
  { name: "YourStory", svg: YourStory },
];

export default function Partners() {
  return (
    <section
      data-testid="partners-section"
      id="partners"
      className="bg-stone-50 py-16 border-y border-stone-200"
    >
      <div className="text-center mb-10">
        <span className="overline">As featured in</span>
      </div>
      <div className="marquee-fade">
        <Marquee gradient={false} speed={32} pauseOnHover>
          {PRESS.concat(PRESS).map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              data-testid={`partner-logo-${i}`}
              title={p.name}
              className="mx-12 text-stone-400 hover:text-stone-900 transition-colors duration-500"
            >
              <p.svg className="h-7 md:h-8 w-auto fill-current" />
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ------ Inline SVG wordmarks ------ */

function VogueIndia({ className = "" }) {
  return (
    <svg
      viewBox="0 0 220 40"
      className={className}
      role="img"
      aria-label="Vogue India"
    >
      <text
        x="0"
        y="28"
        fontFamily="Cormorant Garamond, serif"
        fontWeight="700"
        fontSize="32"
        letterSpacing="6"
      >
        VOGUE
      </text>
      <text
        x="148"
        y="26"
        fontFamily="Manrope, sans-serif"
        fontWeight="300"
        fontSize="11"
        letterSpacing="4"
      >
        INDIA
      </text>
    </svg>
  );
}

function TheKnot({ className = "" }) {
  return (
    <svg
      viewBox="0 0 200 40"
      className={className}
      role="img"
      aria-label="The Knot"
    >
      <text
        x="0"
        y="28"
        fontFamily="Cormorant Garamond, serif"
        fontStyle="italic"
        fontWeight="400"
        fontSize="30"
      >
        the
      </text>
      <text
        x="56"
        y="28"
        fontFamily="Cormorant Garamond, serif"
        fontWeight="700"
        fontSize="30"
        letterSpacing="2"
      >
        KNOT
      </text>
      <circle cx="160" cy="20" r="3" />
    </svg>
  );
}

function ForbesIndia({ className = "" }) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      role="img"
      aria-label="Forbes India"
    >
      <text
        x="0"
        y="28"
        fontFamily="Cormorant Garamond, serif"
        fontWeight="700"
        fontSize="28"
        letterSpacing="1"
      >
        Forbes
      </text>
      <rect x="116" y="10" width="1.5" height="20" />
      <text
        x="126"
        y="26"
        fontFamily="Manrope, sans-serif"
        fontWeight="400"
        fontSize="13"
        letterSpacing="6"
      >
        INDIA
      </text>
    </svg>
  );
}

function CondeNast({ className = "" }) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      role="img"
      aria-label="Condé Nast"
    >
      <text
        x="0"
        y="27"
        fontFamily="Cormorant Garamond, serif"
        fontWeight="600"
        fontSize="22"
        letterSpacing="10"
      >
        CONDÉ NAST
      </text>
      <line x1="0" y1="33" x2="232" y2="33" strokeWidth="1" stroke="currentColor" />
    </svg>
  );
}

function WeddingSutra({ className = "" }) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      role="img"
      aria-label="WeddingSutra"
    >
      <text
        x="0"
        y="28"
        fontFamily="Cormorant Garamond, serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="26"
      >
        Wedding
      </text>
      <text
        x="118"
        y="28"
        fontFamily="Cormorant Garamond, serif"
        fontWeight="400"
        fontSize="26"
        letterSpacing="2"
      >
        Sutra
      </text>
    </svg>
  );
}

function BrideToday({ className = "" }) {
  return (
    <svg
      viewBox="0 0 240 40"
      className={className}
      role="img"
      aria-label="Bride Today"
    >
      <text
        x="0"
        y="22"
        fontFamily="Manrope, sans-serif"
        fontWeight="600"
        fontSize="18"
        letterSpacing="6"
      >
        BRIDE
      </text>
      <text
        x="0"
        y="38"
        fontFamily="Cormorant Garamond, serif"
        fontStyle="italic"
        fontWeight="400"
        fontSize="16"
        letterSpacing="2"
      >
        today
      </text>
    </svg>
  );
}

function BWBusinessworld({ className = "" }) {
  return (
    <svg
      viewBox="0 0 280 40"
      className={className}
      role="img"
      aria-label="BW Businessworld"
    >
      <rect x="0" y="6" width="32" height="28" rx="2" fill="currentColor" />
      <text
        x="6"
        y="27"
        fontFamily="Manrope, sans-serif"
        fontWeight="800"
        fontSize="18"
        fill="#fafaf9"
      >
        BW
      </text>
      <text
        x="44"
        y="27"
        fontFamily="Manrope, sans-serif"
        fontWeight="700"
        fontSize="18"
        letterSpacing="1"
      >
        BUSINESSWORLD
      </text>
    </svg>
  );
}

function YourStory({ className = "" }) {
  return (
    <svg
      viewBox="0 0 220 40"
      className={className}
      role="img"
      aria-label="YourStory"
    >
      <text
        x="0"
        y="28"
        fontFamily="Manrope, sans-serif"
        fontWeight="700"
        fontSize="24"
      >
        Your
      </text>
      <text
        x="60"
        y="28"
        fontFamily="Manrope, sans-serif"
        fontWeight="300"
        fontSize="24"
      >
        Story
      </text>
      <circle cx="138" cy="14" r="3" />
    </svg>
  );
}
