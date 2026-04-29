"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const PORTFOLIO = [
  { title: "Monsoon Tide",       category: "Wedding",    year: "2026", tone: "1" },
  { title: "Atlas — Spring '26", category: "Campaign",   year: "2026", tone: "2" },
  { title: "House of Vrindavan", category: "Documentary",year: "2026", tone: "3" },
  { title: "Fjord Chronograph",  category: "Product",    year: "2026", tone: "5" },
  { title: "Wildflower",         category: "Wedding",    year: "2025", tone: "4" },
  { title: "Sailcloth & Salt",   category: "Documentary",year: "2025", tone: "6" },
];

const STATS = [
  ["12",   "Years behind the lens"],
  ["186",  "Films delivered"],
  ["97%",  "Repeat & referral"],
  ["1:1",  "Director-led, always"],
];

const MARQUEE_CLIENTS = [
  "ATLAS APPAREL","VRINDAVAN","FJORD","KESTREL LIVE",
  "TAJ HOTELS","RAW MANGO","NICOBAR","BOMBAY SHIRT CO.",
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [now, setNow]           = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const time = now
    ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    : "--:--:--";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 80 }}>
      {/* ═══════ TOP NAV ═══════ */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 40px",
          background: scrolled ? "oklch(0.14 0.005 270 / 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid var(--line-soft)" : "1px solid transparent",
          transition: "all 300ms ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--serif)", fontSize: 18 }}>
          <Image src="/og-logo-white.png" alt="OGP" width={28} height={28} style={{ objectFit: "contain" }} />
          <span style={{ color: "var(--fg)" }}>Omee Ganatra</span>
        </div>
        <nav style={{ display: "flex", gap: 32 }}>
          {["Work","Studio","Process","Journal","Contact"].map(x => (
            <a key={x} href="#" style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-2)", textDecoration: "none" }}>{x}</a>
          ))}
        </nav>
        <Link href="/login" className="ogp-btn" style={{ textDecoration: "none" }}>
          Client Portal <span style={{ opacity: 0.6 }}>→</span>
        </Link>
      </header>

      {/* ═══════ HERO ═══════ */}
      <section className="ogp-view-in" style={{ padding: "80px 40px 60px" }}>
        <div className="label-mono" style={{ marginBottom: 32 }}>
          MMXXVI · MUMBAI · INDEPENDENT FILMMAKER
        </div>
        <h1 className="ogp-serif" style={{
          fontSize: "clamp(64px, 11vw, 160px)",
          lineHeight: 0.95, letterSpacing: "-0.03em", fontWeight: 400,
          color: "var(--fg)",
        }}>
          Films for the<br />
          <em style={{ color: "var(--accent)", fontStyle: "italic" }}>quiet, important</em><br />
          moments.
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 80, marginTop: 80, alignItems: "end" }}>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--fg-2)", maxWidth: 560 }}>
            A small studio building cinematic portraits of weddings, brands, and lives in motion.
            Every frame considered. Every cut earned. Delivered through a private vault you control.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "var(--mono)", fontSize: 11, color: "var(--fg-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--fg-3)" }}>STATUS</span>
              <span>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: "var(--ok)", marginRight: 8, verticalAlign: "middle" }} />
                Booking 2026 — limited
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--fg-3)" }}>LOCAL TIME</span>
              <span>{time} IST</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--fg-3)" }}>BASED</span>
              <span>19.0760° N · 72.8777° E</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ REEL ═══════ */}
      <section style={{ padding: "40px 40px 80px" }}>
        <div style={{
          position: "relative", aspectRatio: "21 / 9", borderRadius: 18,
          overflow: "hidden", border: "1px solid var(--line-soft)", background: "var(--bg-2)",
        }}>
          <video autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}>
            <source src="/og-logo.mp4" type="video/mp4" />
          </video>
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at center, transparent 30%, oklch(0 0 0 / 0.55) 100%)",
            pointerEvents: "none",
          }} />
          <div className="ogp-mono" style={{
            position: "absolute", top: 20, left: 20,
            fontSize: 11, color: "oklch(1 0 0 / 0.7)", letterSpacing: "0.14em",
            display: "flex", gap: 16, alignItems: "center",
          }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "var(--danger)" }} />
            REC · 00:01:24:08
          </div>
          <div className="ogp-mono" style={{
            position: "absolute", top: 20, right: 20,
            fontSize: 11, color: "oklch(1 0 0 / 0.7)", letterSpacing: "0.14em",
          }}>REEL 2026 · ARRI · 4K</div>
          <div style={{
            position: "absolute", bottom: 24, left: 24, right: 24,
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          }}>
            <div>
              <div className="label-mono" style={{ marginBottom: 8, color: "oklch(1 0 0 / 0.6)" }}>NOW PLAYING</div>
              <div className="ogp-serif" style={{ fontSize: 36, color: "white" }}>The 2026 Reel</div>
            </div>
            <button className="ogp-btn ogp-btn-primary">▶ Watch Full Reel</button>
          </div>
        </div>
      </section>

      {/* ═══════ MARQUEE ═══════ */}
      <section style={{
        padding: "40px 0",
        borderTop: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)",
        overflow: "hidden", whiteSpace: "nowrap",
      }}>
        <div style={{ display: "inline-flex", gap: 64, animation: "ogp-marquee 40s linear infinite" }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: "inline-flex", gap: 64 }}>
              {MARQUEE_CLIENTS.map(c => (
                <span key={c} className="ogp-serif" style={{ fontSize: 28, color: "var(--fg-3)" }}>{c}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ SELECTED WORK ═══════ */}
      <section style={{ padding: "100px 40px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 48 }}>
          <div>
            <div className="label-mono" style={{ marginBottom: 16 }}>§ 01 — SELECTED WORK</div>
            <h2 className="ogp-serif" style={{ fontSize: 56, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--fg)" }}>
              Six films. <em style={{ color: "var(--fg-3)" }}>One year.</em>
            </h2>
          </div>
          <a href="#" className="ogp-mono" style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--fg-2)", borderBottom: "1px solid var(--line)", paddingBottom: 4,
          }}>View archive (47) →</a>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1,
          background: "var(--line-soft)", border: "1px solid var(--line-soft)",
          borderRadius: 12, overflow: "hidden",
        }}>
          {PORTFOLIO.map((p, i) => (
            <div
              key={p.title}
              className="ogp-ph"
              data-tone={p.tone}
              style={{
                gridColumn: i === 0 ? "span 4" : i === 1 ? "span 2" : "span 3",
                aspectRatio: i === 0 ? "16 / 9" : "4 / 3",
                position: "relative", cursor: "pointer",
              }}
            >
              <div style={{
                position: "absolute", inset: 0, padding: 24,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                background: "linear-gradient(180deg, transparent 50%, oklch(0 0 0 / 0.6) 100%)",
              }}>
                <div className="ogp-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "oklch(1 0 0 / 0.7)" }}>
                  {String(i + 1).padStart(2, "0")} / {p.category} / {p.year}
                </div>
                <div className="ogp-serif" style={{ fontSize: i === 0 ? 48 : 26, color: "white", lineHeight: 1.1 }}>
                  {p.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section style={{
        padding: "100px 40px",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
        borderTop: "1px solid var(--line-soft)", marginTop: 80,
      }}>
        {STATS.map(([n, l], i) => (
          <div key={i} style={{ padding: "8px 24px", borderLeft: i ? "1px solid var(--line-soft)" : "none" }}>
            <div className="ogp-serif" style={{ fontSize: 96, lineHeight: 1, color: "var(--fg)", fontWeight: 400 }}>{n}</div>
            <div style={{ marginTop: 16, color: "var(--fg-3)", fontSize: 13 }}>{l}</div>
          </div>
        ))}
      </section>

      {/* ═══════ CTA ═══════ */}
      <section style={{ padding: "120px 40px", textAlign: "center" }}>
        <div className="label-mono" style={{ marginBottom: 24 }}>§ — ENQUIRE</div>
        <h2 className="ogp-serif" style={{
          fontSize: "clamp(48px, 8vw, 120px)", fontWeight: 400,
          letterSpacing: "-0.02em", lineHeight: 1, color: "var(--fg)",
        }}>
          Tell us about<br />
          <em style={{ color: "var(--accent)" }}>the moment.</em>
        </h2>
        <button className="ogp-btn ogp-btn-primary" style={{ marginTop: 48, padding: "16px 32px", fontSize: 13 }}>
          Begin a conversation →
        </button>
        <div style={{ marginTop: 32, color: "var(--fg-3)", fontSize: 13 }}>
          studio@omeeganatra.com · +91 98 2024 1985
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer style={{ padding: "40px", borderTop: "1px solid var(--line-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="ogp-mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--fg-3)" }}>
          © OMEE GANATRA PRODUCTIONS · MMXXVI · ALL FRAMES RESERVED
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {["Instagram","Vimeo","Behance"].map(s => (
            <a key={s} href="#" className="ogp-mono" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--fg-3)", textDecoration: "none" }}>{s}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
