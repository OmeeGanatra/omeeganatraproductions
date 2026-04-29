"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

const STATUS_FILTERS = [
  { key: "all", label: "all" },
  { key: "shoot", label: "shoot" },
  { key: "edit", label: "edit" },
  { key: "color", label: "color" },
  { key: "delivered", label: "delivered" },
];

const NAV_ITEMS = [
  { href: "/portal", label: "Projects", badge: null },
  { href: "/portal/vault", label: "Vault", badge: "2.4 TB" },
  { href: "/portal/activity", label: "Activity", badge: null },
  { href: "/portal/invoices", label: "Invoices", badge: "1" },
  { href: "/portal/messages", label: "Messages", badge: "3" },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?next=" + encodeURIComponent(pathname));
    }
  }, [status, router, pathname]);

  const handleLogout = () => {
    void logout();
  };

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal";
    return pathname.startsWith(href);
  };

  const firstInitial =
    user?.fullName?.charAt(0).toUpperCase() || "G";

  if (status === "loading" || status === "idle" || status === "unauthenticated") {
    return null;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: "var(--bg)",
          borderRight: "1px solid var(--line-soft)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--line-soft)",
          }}
        >
          <Image
            src="/og-logo-white.png"
            alt="OGP"
            width={28}
            height={28}
            style={{ objectFit: "contain" }}
          />
          <span
            className="ogp-serif"
            style={{ fontSize: 14, color: "var(--fg)", letterSpacing: "0.01em" }}
          >
            Omee Ganatra
          </span>
        </div>

        {/* WORKSPACE nav */}
        <div style={{ padding: "20px 12px 8px" }}>
          <p
            className="label-mono"
            style={{
              fontSize: 9,
              color: "var(--fg-3)",
              letterSpacing: "0.15em",
              marginBottom: 6,
              paddingLeft: 8,
            }}
          >
            WORKSPACE
          </p>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    borderRadius: 6,
                    fontSize: 13,
                    color: active ? "var(--fg)" : "var(--fg-2)",
                    background: active ? "var(--bg-3)" : "transparent",
                    textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className="ogp-chip"
                      style={{
                        fontSize: 10,
                        color: "var(--fg-3)",
                        background: "var(--bg-2)",
                        padding: "1px 6px",
                        borderRadius: 99,
                        border: "1px solid var(--line-soft)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* STATUS filters */}
        <div style={{ padding: "16px 12px 8px" }}>
          <p
            className="label-mono"
            style={{
              fontSize: 9,
              color: "var(--fg-3)",
              letterSpacing: "0.15em",
              marginBottom: 6,
              paddingLeft: 8,
            }}
          >
            STATUS
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "var(--fg-2)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  className="ogp-chip-dot"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      f.key === "delivered"
                        ? "var(--ok)"
                        : f.key === "color"
                          ? "var(--accent)"
                          : f.key === "edit"
                            ? "oklch(0.65 0.15 240)"
                            : f.key === "shoot"
                              ? "var(--fg-3)"
                              : "var(--line)",
                    flexShrink: 0,
                  }}
                />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User card */}
        <div
          style={{
            margin: 12,
            padding: 12,
            border: "1px solid var(--line-soft)",
            borderRadius: 10,
            background: "var(--bg-2)",
          }}
        >
          {/* Avatar + name row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                color: "#000",
                flexShrink: 0,
              }}
            >
              {firstInitial}
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--fg)",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.fullName || "Guest"}
              </p>
              <p
                className="label-mono"
                style={{ fontSize: 9, color: "var(--accent)", letterSpacing: "0.1em" }}
              >
                SIGNATURE CLIENT
              </p>
            </div>
          </div>

          {/* Action row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/admin"
              style={{
                fontSize: 11,
                color: "var(--fg-2)",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              Admin →
            </Link>
            <div style={{ flex: 1 }} />
            <button
              onClick={handleLogout}
              style={{
                fontSize: 11,
                color: "var(--fg-3)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  );
}
