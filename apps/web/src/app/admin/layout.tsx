"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  LayoutDashboard,
  Users,
  FolderKanban,
  Image,
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
  ImageIcon,
  BellRing,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
      { href: "/admin/media", label: "Media Library", icon: Image },
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
    // Clean up IDs (UUIDs or long strings)
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
  return (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gold/10">
          <Camera className="h-4 w-4 text-gold" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold tracking-wide text-gold">OGP</span>
          <span className="text-xs font-light text-ivory-muted">Studio</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-1">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-ivory-muted/50">
              {group.title}
            </p>
            <div className="space-y-0.5">
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
                    className={`group relative flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] transition-all duration-150 ${
                      isActive
                        ? "bg-surface-light font-medium text-gold"
                        : "text-ivory-muted hover:bg-surface-light hover:text-ivory"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-gold" />
                    )}
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[10px] font-bold text-gold">
            {user?.fullName?.charAt(0) || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-ivory">
              {user?.fullName || "Admin"}
            </p>
            <p className="truncate text-[10px] text-ivory-muted">
              {user?.role || "admin"}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="shrink-0 rounded-md p-1.5 text-ivory-muted transition-colors hover:bg-surface-light hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
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
    <div className="flex min-h-screen bg-bg">
      {/* Desktop Sidebar (visible immediately) */}
      <aside
        className="hidden w-60 flex-col lg:flex"
        style={{
          background: "linear-gradient(180deg, #0A0A0A 0%, #050505 100%)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        <SidebarContent
          pathname={pathname}
          user={user}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 flex h-full w-60 flex-col lg:hidden"
              style={{
                background: "linear-gradient(180deg, #0A0A0A 0%, #050505 100%)",
                borderRight: "1px solid var(--color-border)",
              }}
            >
              <div className="absolute right-3 top-4 z-10">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-md p-1.5 text-ivory-muted transition-colors hover:bg-surface-light hover:text-ivory"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
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
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (visible immediately) */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg-elevated/80 px-4 backdrop-blur-md lg:px-6">
          {/* Left: mobile menu + breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-ivory-muted transition-colors hover:bg-surface-light hover:text-ivory lg:hidden"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <nav className="hidden items-center gap-1 text-[13px] sm:flex">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 text-ivory-muted/40" />
                  )}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-ivory">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-ivory-muted transition-colors hover:text-ivory"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
            {/* Mobile title */}
            <span className="text-sm font-medium text-ivory sm:hidden">
              {breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard"}
            </span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1">
            <button
              className="rounded-md p-2 text-ivory-muted transition-colors hover:bg-surface-light hover:text-ivory"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <button
              className="relative rounded-md p-2 text-ivory-muted transition-colors hover:bg-surface-light hover:text-ivory"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
            </button>

            {/* Quick Actions */}
            <div className="relative" ref={quickActionsRef}>
              <button
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                className="ml-1 flex items-center gap-1.5 rounded-md bg-surface-light px-3 py-1.5 text-xs font-medium text-ivory transition-colors hover:bg-border-light"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Quick Actions</span>
              </button>
              <AnimatePresence>
                {quickActionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
                  >
                    {quickActions.map((action) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        onClick={() => setQuickActionsOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-ivory-muted transition-colors hover:bg-surface-light hover:text-ivory"
                      >
                        <Plus className="h-3 w-3 text-gold" />
                        {action.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
