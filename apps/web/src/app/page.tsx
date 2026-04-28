"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import Link from "next/link";

/* --- Data --- */
const services = [
  {
    num: "01",
    title: "Luxury Wedding Photography",
    desc: "Timeless moments captured with artistic precision and editorial elegance",
  },
  {
    num: "02",
    title: "Cinematic Wedding Films",
    desc: "Your love story told through cinema-quality visuals and emotive storytelling",
  },
  {
    num: "03",
    title: "Pre-Wedding Shoots",
    desc: "Stunning narratives in breathtaking locations across the world",
  },
  {
    num: "04",
    title: "Drone Cinematography",
    desc: "Aerial perspectives that elevate every celebration to new heights",
  },
  {
    num: "05",
    title: "Fashion & Commercial Photography",
    desc: "Bold, editorial photography for brands, portfolios, and publications",
  },
];

/* --- Scroll Reveal Hook --- */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* --- Reveal Wrapper (starts visible, enhances with animation) --- */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 1,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `transform 0.8s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ===============================================
   HOME PAGE
   =============================================== */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* --- Navigation (visible immediately) --- */}
      <nav
        className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-5 transition-all duration-500 md:px-12 lg:px-20 ${
          scrolled ? "nav-blur py-4" : ""
        }`}
      >
        <div>
          <Link href="/" className="group block">
            <span
              className="block font-serif text-base font-normal tracking-[0.3em] text-ivory"
              style={{ letterSpacing: "0.3em" }}
            >
              OMEE GANATRA
            </span>
            <span className="block text-[9px] font-light tracking-[0.4em] text-ivory-muted">
              PRODUCTIONS
            </span>
          </Link>
        </div>

        <div>
          <Link
            href="/login"
            className="link-underline text-[11px] font-light tracking-[0.2em] text-ivory-muted transition-colors duration-300 hover:text-gold"
          >
            CLIENT PORTAL
          </Link>
        </div>
      </nav>

      {/* --- Hero with real wedding photo background --- */}
      <section ref={heroRef} className="relative flex h-screen items-center justify-center overflow-hidden">
        {/* Background photo */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80"
            alt="Wedding couple"
            loading="eager"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center 30%" }}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/60" />
          {/* Golden light leak - upper right */}
          <div
            className="absolute -right-32 -top-32 h-[700px] w-[700px] rounded-full opacity-15"
            style={{
              background:
                "radial-gradient(circle, rgba(201,169,110,0.4) 0%, rgba(201,169,110,0.1) 40%, transparent 70%)",
            }}
          />
        </motion.div>

        {/* Hero content (visible immediately) */}
        <motion.div
          className="relative z-10 flex flex-col items-center px-6 text-center"
          style={{ opacity: heroOpacity }}
        >
          <h2 className="max-w-5xl font-serif text-5xl font-normal italic leading-[1.1] text-ivory md:text-7xl lg:text-[7rem]">
            Capturing Timeless Moments
          </h2>

          {/* Thin line divider */}
          <div className="my-8 h-px w-24 bg-gold md:my-10 md:w-32" />

          <p className="text-[10px] font-light tracking-[0.35em] text-ivory-muted md:text-xs md:tracking-[0.4em]">
            LUXURY WEDDING PHOTOGRAPHY & CINEMATIC FILMS
          </p>

          <div className="mt-12 md:mt-16">
            <Link
              href="/login"
              className="link-underline text-[11px] font-light tracking-[0.2em] text-gold transition-colors duration-300 hover:text-gold-light"
            >
              View Your Gallery&ensp;&rarr;
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-10 w-[1px] bg-gradient-to-b from-transparent via-ivory-muted/40 to-transparent"
          />
        </div>
      </section>

      {/* --- Cinematic Reel Section with real photo background --- */}
      <section className="relative overflow-hidden px-6 py-32 md:py-44">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="aspect-cinematic relative flex items-center justify-center overflow-hidden rounded-sm">
              {/* Background image */}
              <img
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1920&q=80"
                alt="Wedding ceremony"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/60" />
              {/* Subtle golden vignette */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(201,169,110,0.08) 0%, transparent 70%)",
                }}
              />
              <div className="relative z-10 px-8 text-center">
                <p className="font-serif text-2xl italic leading-relaxed text-ivory/90 md:text-4xl lg:text-5xl">
                  Every love story deserves
                  <br />
                  to be told beautifully
                </p>
              </div>
              {/* Border overlay */}
              <div className="absolute inset-0 rounded-sm border border-border-light/50" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- Services --- */}
      <section className="relative px-6 py-24 md:px-12 md:py-32 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="mb-20 text-center">
              <span className="text-[10px] font-light tracking-[0.4em] text-ivory-muted">
                WHAT WE OFFER
              </span>
              <h3 className="mt-4 font-serif text-3xl font-normal text-ivory md:text-4xl">
                Our Expertise
              </h3>
              <div className="mx-auto mt-6 h-px w-16 bg-gold" />
            </div>
          </Reveal>

          {/* Service rows */}
          <div>
            {services.map((s, i) => (
              <Reveal key={s.num} delay={i * 80}>
                <div className="service-row group flex items-baseline gap-6 border-t border-border-light/40 py-8 md:gap-10 md:py-10">
                  <span className="service-number shrink-0 font-serif text-lg text-ivory-muted/40 transition-colors duration-400 md:text-xl">
                    {s.num}
                  </span>
                  <div className="flex-1">
                    <h4 className="service-title font-serif text-xl text-ivory transition-colors duration-400 md:text-2xl lg:text-3xl">
                      {s.title}
                    </h4>
                    <p className="mt-2 text-sm font-light text-ivory-muted/70">
                      {s.desc}
                    </p>
                  </div>
                  <span className="hidden text-sm text-ivory-muted/0 transition-all duration-400 group-hover:text-ivory-muted/50 md:block">
                    &rarr;
                  </span>
                </div>
              </Reveal>
            ))}
            {/* Final border */}
            <div className="border-t border-border-light/40" />
          </div>
        </div>
      </section>

      {/* --- Testimonial --- */}
      <section className="relative overflow-hidden px-6 py-32 md:py-44">
        <Reveal>
          <div className="mx-auto max-w-4xl text-center">
            {/* Ornament */}
            <div className="ornament mb-12">
              <span className="text-gold" style={{ fontSize: "8px" }}>&#9670;</span>
            </div>

            <blockquote className="font-serif text-2xl italic leading-relaxed text-ivory/90 md:text-3xl lg:text-4xl">
              &ldquo;The photographs were beyond anything we imagined.
              <br className="hidden md:block" />
              Every single frame is a work of art.&rdquo;
            </blockquote>

            <div className="mt-10">
              <div className="mx-auto mb-4 h-px w-10 bg-gold/40" />
              <p className="text-[11px] font-light tracking-[0.3em] text-ivory-muted">
                A CHERISHED CLIENT
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* --- Client Portal CTA --- */}
      <section className="relative px-6 py-32 md:py-44">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="font-serif text-3xl font-normal text-ivory md:text-5xl lg:text-6xl">
              Your Gallery Awaits
            </h3>
            <p className="mt-6 text-sm font-light leading-relaxed text-ivory-muted">
              Log in to access your private collection of memories,
              <br className="hidden md:block" />
              carefully curated and delivered in stunning resolution.
            </p>
            <div className="mt-10">
              <Link
                href="/login"
                className="link-underline text-[11px] font-light tracking-[0.2em] text-gold transition-colors duration-300 hover:text-gold-light"
              >
                Enter Portal&ensp;&rarr;
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* --- Footer --- */}
      <footer className="relative px-6 pb-12 pt-20">
        <div className="hr-gold mx-auto max-w-5xl" />

        <div className="mx-auto mt-12 max-w-5xl text-center">
          <span
            className="font-serif text-sm font-normal tracking-[0.3em] text-ivory-muted/60"
          >
            OMEE GANATRA PRODUCTIONS
          </span>

          <p className="mt-4 text-[10px] tracking-[0.2em] text-ivory-muted/30">
            &copy; {new Date().getFullYear()}
          </p>

          <p className="mt-8 text-[10px] font-light tracking-[0.15em] text-ivory-muted/25">
            Crafted with love in India
          </p>
        </div>
      </footer>
    </div>
  );
}
