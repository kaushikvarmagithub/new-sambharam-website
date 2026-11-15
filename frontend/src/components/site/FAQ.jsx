import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How early should I book Sambhrama for a wedding?",
    a: "For weddings 6–9 months ahead is ideal. We sometimes take on shorter timelines — call us and we'll be honest about feasibility.",
  },
  {
    q: "Do you work outside Bengaluru?",
    a: "Yes — we've produced events across Karnataka, Goa, Rajasthan, and a few destinations in Sri Lanka and the UAE.",
  },
  {
    q: "How does pricing work?",
    a: "We offer a flat planning fee plus pass-through vendor costs (transparent, with our negotiated rates). No hidden markups.",
  },
  {
    q: "Can you handle just one part of the event?",
    a: "Absolutely — décor only, AV only, day-of coordination only. We scope to fit.",
  },
  {
    q: "What is your refund / cancellation policy?",
    a: "Detailed in our contract. The planning fee is non-refundable, but we always work to redirect vendor deposits.",
  },
];

export default function FAQ() {
  return (
    <section
      data-testid="faq-section"
      id="faq"
      className="bg-white py-24 md:py-36 border-y border-stone-200"
    >
      <div className="max-w-4xl mx-auto px-6 md:px-10">
        <div className="text-center mb-12">
          <span className="overline">FAQ</span>
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight text-stone-900 mt-3">
            The questions we hear most.
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              data-testid={`faq-item-${i}`}
              className="border-b border-stone-200"
            >
              <AccordionTrigger className="font-serif text-lg md:text-xl text-left text-stone-900 py-5 hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-stone-600 text-base leading-relaxed pb-6">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
