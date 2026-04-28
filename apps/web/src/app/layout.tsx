import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Omee Ganatra Productions | Luxury Wedding Photography & Cinematic Films",
  description:
    "Premium luxury wedding photography and cinematic films. Timeless moments captured with artistic precision. Access your private client gallery.",
  keywords: [
    "luxury wedding photography",
    "cinematic wedding films",
    "premium photography",
    "wedding cinematography",
    "client gallery",
    "Omee Ganatra Productions",
    "drone cinematography",
    "pre-wedding shoots",
  ],
  openGraph: {
    title: "Omee Ganatra Productions",
    description: "Luxury Wedding Photography & Cinematic Films",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased" style={{ background: "#050505", color: "#F5F0EB" }}>
        {/* Film Grain Overlay */}
        <div className="film-grain" aria-hidden="true" />

        {/* Page Content - visible immediately */}
        <div className="page-enter" style={{ opacity: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
