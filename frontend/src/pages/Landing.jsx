import Nav from "@/components/site/Nav";
import Hero from "@/components/site/Hero";
import Services from "@/components/site/Services";
import Portfolio from "@/components/site/Portfolio";
import About from "@/components/site/About";
import Testimonials from "@/components/site/Testimonials";
import Reels from "@/components/site/Reels";
import BookingWizard from "@/components/site/BookingWizard";
import Footer from "@/components/site/Footer";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    const target = location.state && location.state.scrollTo;
    if (target) {
      setTimeout(() => {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [location.state]);

  return (
    <div data-testid="landing-page" className="bg-stone-50">
      <Nav />
      <main>
        <Hero />
        <Services />
        <Portfolio />
        <Reels />
        <About />
        <Testimonials />
        <BookingWizard />
      </main>
      <Footer />
    </div>
  );
}
