"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Image as ImageIcon,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  Plus,
  ShoppingBag,
  UsersRound,
  BellRing,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Manage",
    items: [
      { href: "/admin/clients", label: "Clients", icon: Users },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/galleries", label: "Galleries", icon: ImageIcon },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/media", label: "Media Library", icon: ImageIcon },
      { href: "/admin/notifications", label: "Notifications", icon: BellRing },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/team", label: "Team", icon: UsersRound },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const quickActions = [
  { label: "New Client", href: "/admin/clients?new=true" },
  { label: "New Project", href: "/admin/projects?new=true" },
  { label: "Upload Media", href: "/admin/media?upload=true" },
];

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  for (let i = 0; i < segments.length; i++) {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const seg = segments[i]!;
    let label = seg.charAt(0).toUpperCase() + seg.slice(1);
    if (label.length > 20) label = label.slice(0, 12) + "...";
    crumbs.push({ label, href });
  }

  return crumbs;
}

function SidebarContent({
  pathname,
  user,
  onLogout,
  onNavClick,
}: {
  pathname: string;
  user: any;
  onLogout: () => void;
  onNavClick?: () => void;
}) {
  const firstInitial = user?.fullName?.charAt(0).toUpperCase() || "A";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 18px 14px",
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
        <div>
          <span
            className="ogp-serif"
            style={{ fontSize: 14, color: "var(--fg)", display: "block", lineHeight: 1.2 }}
          >
            Studio
          </span>
          <span
            className="ogp-mono"
            style={{
              fontSize: 9,
              color: "var(--accent)",
              letterSpacing: "0.12em",
              display: "block",
            }}
          >
            ADMIN MODE
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 10px 10px",
        }}
      >
        {navGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: 18 }}>
            <p
              className="label-mono"
              style={{
                fontSize: 9,
                color: "var(--fg-3)",
                letterSpacing: "0.15em",
                padding: "0 10px",
                marginBottom: 4,
              }}
            >
              {group.title}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {group.items.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavClick}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      borderRadius: 6,
                      fontSize: 13,
                      color: isActive ? "var(--fg)" : "var(--fg-2)",
                      background: isActive ? "var(--bg-3)" : "transparent",
                      textDecoration: "none",
                      transition: "background 0.15s, color 0.15s",
                      position: "relative",
                    }}
                  >
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 2,
                          height: 16,
                          borderRadius: "0 2px 2px 0",
                          background: "var(--accent)",
                        }}
                      />
                    )}
                    <item.icon size={14} strokeWidth={1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div
        style={{
          borderTop: "1px solid var(--line-soft)",
          padding: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 8,
            background: "var(--bg-2)",
            border: "1px solid var(--line-soft)",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "#000",
              flexShrink: 0,
            }}
          >
            {firstInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
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
              {user?.fullName || "Admin"}
            </p>
            <p
              className="label-mono"
              style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.08em" }}
            >
              {user?.role || "ADMIN"}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-3)",
              padding: 4,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s",
            }}
          >
            <LogOut size={13} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Close quick actions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(e.target as Node)
      ) {
        setQuickActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    void logout();
  };

  if (status === "loading" || status === "idle" || status === "unauthenticated") {
    return null;
  }

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: "var(--bg)",
          borderRight: "1px solid var(--line-soft)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          display: "none",
        }}
        className="lg-sidebar"
      >
        <style>{`
          @media (min-width: 1024px) {
            .lg-sidebar { display: block !important; }
          }
        `}</style>
        <SidebarContent
          pathname={pathname}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
              }}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                zIndex: 51,
                height: "100%",
                width: 240,
                background: "var(--bg)",
                borderRight: "1px solid var(--line-soft)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 14,
                  zIndex: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fg-3)",
                  padding: 4,
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={15} strokeWidth={1.5} />
              </button>
              <SidebarContent
                pathname={pathname}
                user={user}
                onLogout={handleLogout}
                onNavClick={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div style={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0 }}>
        {/* Top header bar */}
        <header
          style={{
            height: 48,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--line-soft)",
            background: "var(--bg-2)",
            padding: "0 20px",
          }}
        >
          {/* Left: mobile menu + breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Mobile menu button — hidden on desktop via inline style + media query trick */}
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg-3)",
                padding: 4,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
              }}
              className="mobile-menu-btn"
            >
              <style>{`
                @media (min-width: 1024px) {
                  .mobile-menu-btn { display: none !important; }
                }
              `}</style>
              <Menu size={16} strokeWidth={1.5} />
            </button>

            {/* Breadcrumbs */}
            <nav
              style={{ display: "flex", alignItems: "center", gap: 4 }}
              className="breadcrumb-nav"
            >
              <style>{`
                @media (max-width: 639px) {
                  .breadcrumb-nav { display: none !important; }
                }
              `}</style>
              {breadcrumbs.map((crumb, i) => (
                <span
                  key={crumb.href}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  {i > 0 && (
                    <ChevronRight
                      size={11}
                      style={{ color: "var(--fg-3)", opacity: 0.4 }}
                    />
                  )}
                  {i === breadcrumbs.length - 1 ? (
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      style={{
                        fontSize: 13,
                        color: "var(--fg-2)",
                        textDecoration: "none",
                      }}
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            {/* Mobile title */}
            <span
              style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}
              className="mobile-title"
            >
              <style>{`
                @media (min-width: 640px) {
                  .mobile-title { display: none !important; }
                }
              `}</style>
              {breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard"}
            </span>
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              title="Search"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg-3)",
                padding: 8,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <Search size={15} strokeWidth={1.5} />
            </button>

            <button
              title="Notifications"
              style={{
                position: "relative",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--fg-3)",
                padding: 8,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <Bell size={15} strokeWidth={1.5} />
              <span
                style={{
                  position: "absolute",
                  right: 6,
                  top: 6,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
            </button>

            {/* Quick Actions */}
            <div style={{ position: "relative", marginLeft: 4 }} ref={quickActionsRef}>
              <button
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--bg-3)",
                  border: "1px solid var(--line-soft)",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 12,
                  color: "var(--fg)",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <Plus size={13} strokeWidth={1.5} />
                <span className="quick-actions-label">
                  <style>{`
                    @media (max-width: 639px) {
                      .quick-actions-label { display: none !important; }
                    }
                  `}</style>
                  Quick Actions
                </span>
              </button>

              <AnimatePresence>
                {quickActionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "100%",
                      marginTop: 6,
                      width: 176,
                      zIndex: 50,
                      background: "var(--bg-2)",
                      border: "1px solid var(--line-soft)",
                      borderRadius: 8,
                      overflow: "hidden",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}
                  >
                    {quickActions.map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        onClick={() => setQuickActionsOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "9px 12px",
                          fontSize: 13,
                          color: "var(--fg-2)",
                          textDecoration: "none",
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        <Plus size={12} style={{ color: "var(--accent)" }} />
                        {action.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          <div
            style={{
              maxWidth: 1400,
              margin: "0 auto",
              padding: "28px 20px",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
