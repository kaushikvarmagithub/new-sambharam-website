import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle, EnvelopeSimple, Phone, MapPin } from "@phosphor-icons/react";
import api, { formatApiError } from "@/lib/api";

const EVENT_TYPES = [
  "Wedding",
  "Sangeet",
  "Haldi",
  "Mehendi",
  "Birthday",
  "Corporate Event",
  "Festival",
  "Conference",
  "Pooja",
  "Other",
];
const BUDGET_RANGES = [
  "Under ₹5 Lakh",
  "₹5 — ₹15 Lakh",
  "₹15 — ₹50 Lakh",
  "₹50 Lakh — ₹1 Cr",
  "₹1 Cr +",
];

const STEPS = [
  { id: 0, label: "Event" },
  { id: 1, label: "Details" },
  { id: 2, label: "You" },
];

const blank = {
  event_type: "Wedding",
  event_date: "",
  location: "",
  guest_count: "",
  budget: "",
  name: "",
  email: "",
  phone: "",
  message: "",
};

export default function BookingWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(blank);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const validStep = () => {
    if (step === 0) return !!data.event_type;
    if (step === 1) return true;
    if (step === 2) return data.name.trim() && data.email.trim() && data.phone.trim();
    return false;
  };

  const next = () => {
    if (!validStep()) {
      toast.error("Please complete the required fields.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!validStep()) {
      toast.error("Please complete the required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        guest_count: data.guest_count ? parseInt(data.guest_count, 10) : null,
      };
      await api.post("/bookings", payload);
      setSubmitted(true);
      toast.success("Inquiry sent — we'll be in touch within 24 hours.");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      data-testid="contact-section"
      className="relative bg-stone-900 text-stone-50 py-24 md:py-36 overflow-hidden"
    >
      {/* Smooth fade IN from whatever light section sits above (Testimonials/About) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 md:h-40 bg-gradient-to-b from-stone-50 to-transparent z-[1]" />
      <div className="absolute inset-0 hero-grain opacity-50" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <span className="overline text-amber-300">Let's celebrate</span>
          <h2 className="font-serif text-4xl md:text-6xl tracking-tight mt-3 leading-[1.05]">
            Tell us about your <em className="italic text-amber-300">moment</em>.
          </h2>
          <p className="text-stone-300 mt-6 text-lg leading-relaxed max-w-md">
            Three quick steps. We respond within 24 hours with availability,
            initial ideas, and a tailored plan — no obligations.
          </p>

          <ul className="mt-10 space-y-4 text-stone-300">
            <li className="flex items-center gap-3" data-testid="contact-email">
              <EnvelopeSimple size={20} className="text-amber-300" />
              <a
                href="mailto:contact@sambhrama.co"
                className="hover:text-amber-300 transition-colors"
              >
                contact@sambhrama.co
              </a>
            </li>
            <li className="flex items-start gap-3" data-testid="contact-phone">
              <Phone size={20} className="text-amber-300 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <a
                  href="tel:+918792036012"
                  className="hover:text-amber-300 transition-colors"
                >
                  +91 87920 36012
                </a>
                <a
                  href="tel:+919341646148"
                  className="hover:text-amber-300 transition-colors"
                >
                  +91 93416 46148
                </a>
              </div>
            </li>
            <li className="flex items-center gap-3" data-testid="contact-address">
              <MapPin size={20} className="text-amber-300" />
              Bengaluru, India
            </li>
          </ul>
        </div>

        <div className="lg:col-span-7">
          <div
            data-testid="booking-form-card"
            className="relative bg-stone-50 text-stone-900 rounded-sm border border-stone-200 p-6 md:p-10"
          >
            {submitted ? (
              <SuccessView
                onReset={() => {
                  setSubmitted(false);
                  setData(blank);
                  setStep(0);
                }}
              />
            ) : (
              <>
                <Stepper step={step} />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.25 }}
                    className="mt-8"
                  >
                    {step === 0 && <StepEvent data={data} update={update} />}
                    {step === 1 && <StepDetails data={data} update={update} />}
                    {step === 2 && <StepYou data={data} update={update} />}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between gap-3">
                  <button
                    data-testid="booking-back-button"
                    onClick={back}
                    disabled={step === 0}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-stone-300 text-stone-700 text-sm disabled:opacity-40"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  {step < STEPS.length - 1 ? (
                    <button
                      data-testid="booking-next-button"
                      onClick={next}
                      className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-stone-900 text-stone-50 text-sm hover:bg-stone-800"
                    >
                      Continue <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      data-testid="booking-submit-button"
                      onClick={submit}
                      disabled={submitting}
                      className="inline-flex items-center gap-2 h-11 px-7 rounded-full bg-amber-500 text-stone-900 text-sm font-medium hover:bg-amber-400 disabled:opacity-60"
                    >
                      {submitting ? "Sending…" : "Send Inquiry"}
                      <ArrowRight size={16} weight="bold" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stepper({ step }) {
  const activeLabel = STEPS[step]?.label;
  return (
    <div data-testid="booking-stepper">
      <ol className="flex items-center gap-2 sm:gap-3 w-full">
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 last:flex-none"
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full grid place-items-center text-xs border ${
                step >= i
                  ? "bg-amber-500 text-stone-900 border-amber-500"
                  : "border-stone-300 text-stone-400"
              }`}
            >
              {step > i ? "✓" : i + 1}
            </div>
            <div
              className={`hidden sm:block text-xs uppercase tracking-widest whitespace-nowrap ${
                step >= i ? "text-stone-900" : "text-stone-400"
              }`}
            >
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 min-w-[12px] h-px bg-stone-200 sm:ml-1" />
            )}
          </li>
        ))}
      </ol>
      {/* Mobile-only current-step caption */}
      <div className="mt-3 text-[11px] uppercase tracking-widest text-stone-600 sm:hidden">
        Step {step + 1} of {STEPS.length} — {activeLabel}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="overline text-stone-600 block mb-2">{children}</label>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", testid }) {
  return (
    <input
      data-testid={testid}
      type={type}
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-12 px-4 bg-white border border-stone-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition text-stone-900"
    />
  );
}

function StepEvent({ data, update }) {
  const subtitle = (t) => {
    switch (t) {
      case "Wedding":
        return "Multi-day · all rituals";
      case "Sangeet":
        return "Music · dance · family";
      case "Haldi":
        return "Turmeric & marigolds";
      case "Mehendi":
        return "Henna afternoon";
      case "Corporate Event":
        return "Launch · gala · offsite";
      case "Festival":
        return "Outdoor production";
      case "Conference":
        return "Summit · symposium";
      case "Pooja":
        return "Auspicious ritual";
      default:
        return "Something custom";
    }
  };
  return (
    <div>
      <FieldLabel>What kind of event?</FieldLabel>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3" data-testid="event-type-grid">
        {EVENT_TYPES.map((t) => (
          <button
            key={t}
            data-testid={`event-type-${t.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => update("event_type", t)}
            className={`h-20 rounded-sm border text-left p-4 transition-all ${
              data.event_type === t
                ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                : "border-stone-300 hover:border-stone-500"
            }`}
          >
            <div className="font-serif text-lg text-stone-900">{t}</div>
            <div className="text-xs text-stone-500">{subtitle(t)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepDetails({ data, update }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <FieldLabel>Event date (approx.)</FieldLabel>
        <TextInput
          testid="booking-event-date"
          value={data.event_date}
          onChange={(v) => update("event_date", v)}
          type="date"
        />
      </div>
      <div>
        <FieldLabel>Guest count</FieldLabel>
        <TextInput
          testid="booking-guest-count"
          value={data.guest_count}
          onChange={(v) => update("guest_count", v.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 250"
        />
      </div>
      <div className="md:col-span-2">
        <FieldLabel>Location</FieldLabel>
        <TextInput
          testid="booking-location"
          value={data.location}
          onChange={(v) => update("location", v)}
          placeholder="City or venue"
        />
      </div>
      <div className="md:col-span-2">
        <FieldLabel>Budget range</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {BUDGET_RANGES.map((b) => (
            <button
              key={b}
              data-testid={`booking-budget-${b}`}
              onClick={() => update("budget", b)}
              className={`px-4 h-10 rounded-full text-sm border transition-colors ${
                data.budget === b
                  ? "border-amber-500 bg-amber-50 text-stone-900"
                  : "border-stone-300 text-stone-700 hover:border-stone-500"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepYou({ data, update }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <FieldLabel>Your name *</FieldLabel>
        <TextInput
          testid="booking-name"
          value={data.name}
          onChange={(v) => update("name", v)}
          placeholder="Full name"
        />
      </div>
      <div>
        <FieldLabel>Email *</FieldLabel>
        <TextInput
          testid="booking-email"
          value={data.email}
          onChange={(v) => update("email", v)}
          placeholder="you@example.com"
          type="email"
        />
      </div>
      <div className="md:col-span-2">
        <FieldLabel>Phone *</FieldLabel>
        <TextInput
          testid="booking-phone"
          value={data.phone}
          onChange={(v) => update("phone", v)}
          placeholder="+91 XXXXX XXXXX"
        />
      </div>
      <div className="md:col-span-2">
        <FieldLabel>Anything else?</FieldLabel>
        <textarea
          data-testid="booking-message"
          value={data.message || ""}
          onChange={(e) => update("message", e.target.value)}
          placeholder="A short note about your vision, must-haves, deal-breakers…"
          rows={4}
          className="w-full p-4 bg-white border border-stone-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition text-stone-900"
        />
      </div>
    </div>
  );
}

function SuccessView({ onReset }) {
  return (
    <div data-testid="booking-success" className="py-10 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 grid place-items-center">
        <CheckCircle size={36} weight="duotone" />
      </div>
      <h3 className="font-serif text-3xl text-stone-900 mt-6">Inquiry received.</h3>
      <p className="text-stone-600 mt-3 max-w-md mx-auto">
        Thank you — a senior producer will reach out within 24 hours with
        availability and initial ideas.
      </p>
      <button
        data-testid="booking-reset"
        onClick={onReset}
        className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-full border border-stone-300 text-stone-700 text-sm hover:bg-stone-100"
      >
        Submit another inquiry
      </button>
    </div>
  );
}
