"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, LogOut, Settings, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/portal", label: "Gallery" },
  { href: "/portal/films", label: "Films" },
  { href: "/portal/favorites", label: "Favorites" },
  { href: "/portal/downloads", label: "Downloads" },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Track scroll for nav background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Lock body on mobile menu
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    void logout();
  };

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal";
    return pathname.startsWith(href);
  };

  const firstName = user?.fullName?.split(" ")[0] || "Guest";
  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "G";

  if (status === "loading" || status === "idle" || status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* --- Top Navigation Bar (visible immediately) --- */}
      <nav
        className={`fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between transition-all duration-500 ${
          scrolled
            ? "nav-blur"
            : "bg-transparent"
        }`}
      >
        {/* Left: Logo */}
        <div className="flex items-center pl-6 md:pl-10">
          <Link
            href="/portal"
            className="text-[11px] font-medium uppercase tracking-[0.3em] text-ivory transition-colors duration-300 hover:text-gold"
          >
            Omee Ganatra
          </Link>
        </div>

        {/* Center: Nav Links (Desktop) */}
        <div className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative py-1"
            >
              <span
                className={`text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                  isActive(link.href)
                    ? "text-ivory"
                    : "text-ivory-muted hover:text-ivory"
                }`}
              >
                {link.label}
              </span>
              {isActive(link.href) && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-px bg-gold"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right: Bell, Avatar, Dropdown */}
        <div className="flex items-center gap-4 pr-6 md:pr-10">
          <Link
            href="/portal/notifications"
            className="hidden text-ivory-muted transition-colors duration-300 hover:text-ivory md:block"
          >
            <Bell className="h-[15px] w-[15px]" strokeWidth={1.5} />
          </Link>

          {/* User Dropdown (Desktop) */}
          <div ref={dropdownRef} className="relative hidden md:block">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <span className="text-[11px] tracking-wide text-ivory-muted">
                {firstName}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-light text-[10px] font-medium tracking-wider text-ivory-muted ring-1 ring-border">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            </button>

            <AnimatePresence>
              {userDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-3 w-48 overflow-hidden border border-border bg-surface py-1"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-[11px] font-medium text-ivory">
                      {user?.fullName}
                    </p>
                    <p className="mt-0.5 text-[10px] text-ivory-muted">
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    href="/portal/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[11px] text-ivory-muted transition-colors hover:bg-surface-light hover:text-ivory"
                  >
                    <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[11px] text-ivory-muted transition-colors hover:bg-surface-light hover:text-ivory"
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-ivory-muted transition-colors hover:text-ivory md:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* --- Mobile Fullscreen Menu --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
          >
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-6 top-5 text-ivory-muted transition-colors hover:text-ivory"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>

            {/* Logo */}
            <div className="absolute left-6 top-5">
              <span className="text-[11px] uppercase tracking-[0.3em] text-ivory-muted">
                Omee Ganatra
              </span>
            </div>

            {/* Nav Links (visible immediately when menu opens) */}
            <nav className="flex flex-col items-center gap-10">
              {navLinks.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`font-serif text-3xl font-light tracking-wide transition-colors ${
                      isActive(link.href) ? "text-gold" : "text-ivory"
                    }`}
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Bottom: User + Sign Out */}
            <div className="absolute bottom-10 flex flex-col items-center gap-4">
              <p className="text-[11px] tracking-wide text-ivory-muted">
                {user?.fullName}
              </p>
              <div className="flex items-center gap-6">
                <Link
                  href="/portal/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[10px] uppercase tracking-[0.2em] text-ivory-muted transition-colors hover:text-gold"
                >
                  Notifications
                </Link>
                <Link
                  href="/portal/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[10px] uppercase tracking-[0.2em] text-ivory-muted transition-colors hover:text-gold"
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-[10px] uppercase tracking-[0.2em] text-ivory-muted transition-colors hover:text-gold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Main Content --- */}
      <main className="min-h-screen pt-16">{children}</main>
    </div>
  );
}
