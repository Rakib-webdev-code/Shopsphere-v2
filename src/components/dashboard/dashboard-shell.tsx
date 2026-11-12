"use client";

import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  History,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tags,
  TicketPercent,
  UserRound,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { UserAvatar } from "@/components/avatar";
import {
  buildBreadcrumbs,
  isNavItemActive,
  type DashboardIcon,
  type DashboardNavGroup,
  type DashboardVariant,
} from "@/components/dashboard/dashboard-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/auth-client";

const ICONS: Record<DashboardIcon, LucideIcon> = {
  overview: LayoutDashboard,
  orders: Package,
  history: History,
  wishlist: Heart,
  cart: ShoppingCart,
  addresses: MapPin,
  reviews: Star,
  notifications: Bell,
  profile: UserRound,
  settings: Settings,
  help: LifeBuoy,
  analytics: BarChart3,
  products: ShoppingBag,
  categories: Tags,
  customers: Users,
  inventory: Warehouse,
  coupons: TicketPercent,
  promotions: Megaphone,
  store: Boxes,
};

/* ----------------------------- external stores ---------------------------- */

const COLLAPSE_KEY = "shopsphere:sidebar-collapsed";
const collapseListeners = new Set<() => void>();

function subscribeCollapsed(callback: () => void) {
  collapseListeners.add(callback);
  window.addEventListener("storage", callback);

  return () => {
    collapseListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

let memoryCollapsed: boolean | null = null;

function readCollapsed() {
  if (memoryCollapsed !== null) {
    return memoryCollapsed;
  }

  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    // Storage can be unavailable (private mode); the toggle still works for
    // this page view because listeners are notified below.
    memoryCollapsed = value;
  }

  collapseListeners.forEach((listener) => listener());
}

function useSidebarCollapsed() {
  return useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
}

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(callback: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
}

/* --------------------------------- shell ---------------------------------- */

export type DashboardShellUser = {
  name: string;
  email: string;
  image: string | null;
  role: "customer" | "admin";
};

export type DashboardShellProps = {
  variant: DashboardVariant;
  groups: DashboardNavGroup[];
  user: DashboardShellUser;
  notificationCount: number;
  notificationsHref: string;
  profileHref: string;
  settingsHref: string;
  search: { action: string; name: string; placeholder: string; label: string };
  children: ReactNode;
};

export function DashboardShell({
  variant,
  groups,
  user,
  notificationCount,
  notificationsHref,
  profileHref,
  settingsHref,
  search,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useSidebarCollapsed();
  const isDesktop = useIsDesktop();
  // The drawer is open only for the path it was opened on, so navigating
  // closes it without an effect.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const rootLabel = variant === "admin" ? "Admin" : "Account";
  const rootHref = variant === "admin" ? "/admin" : "/account";
  const crumbs = buildBreadcrumbs(pathname, groups, rootLabel, rootHref);
  const pageTitle = crumbs[crumbs.length - 1]?.label ?? rootLabel;
  const hideLabel = collapsed ? "lg:hidden" : "";

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerPath(null);
      }
    }

    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onPointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
      router.push("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  const sidebarHidden = !isDesktop && !drawerOpen;

  return (
    <div className="dash-backdrop min-h-screen text-foreground">
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-accent-solid focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setDrawerPath(null)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar */}
      <aside
        id="dashboard-sidebar"
        aria-label={`${rootLabel} sidebar`}
        inert={sidebarHidden}
        className={`glass-strong fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col border-y-0 border-l-0 transition-[transform,width] duration-300 ease-out ${
          collapsed ? "lg:w-[4.75rem]" : "lg:w-[17.5rem]"
        } ${drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div
          className={`flex h-16 shrink-0 items-center gap-2 px-4 ${
            collapsed ? "lg:justify-center lg:px-0" : "justify-between"
          }`}
        >
          <Link
            href={rootHref}
            className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-solid text-sm font-bold text-white shadow-sm">
              S
            </span>
            <span className={`min-w-0 ${hideLabel}`}>
              <span className="block truncate text-base font-bold leading-tight tracking-tight">
                Shop<span className="text-accent-bright">Sphere</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-soft">
                {variant === "admin" ? "Admin console" : "My account"}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerPath(null)}
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-strong transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label={`${rootLabel} navigation`}
          className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-2"
        >
          {groups.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex === 0 ? "" : "mt-5"}>
              <p
                className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-soft ${hideLabel}`}
              >
                {group.label}
              </p>
              {collapsed && groupIndex > 0 ? (
                <div
                  aria-hidden="true"
                  className="mx-3 mb-2 hidden border-t border-border lg:block"
                />
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isNavItemActive(pathname, item);
                  const Icon = ICONS[item.icon];
                  const showBadge =
                    item.icon === "notifications" && notificationCount > 0;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={item.label}
                        aria-current={active ? "page" : undefined}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          collapsed ? "lg:justify-center lg:px-0" : ""
                        } ${
                          active
                            ? "bg-accent-soft font-semibold text-accent-strong ring-1 ring-accent-border"
                            : "font-medium text-muted-strong hover:translate-x-0.5 hover:bg-surface-subtle/70 hover:text-foreground"
                        }`}
                      >
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-accent-bright"
                          />
                        ) : null}
                        <Icon
                          aria-hidden="true"
                          className={`h-[1.15rem] w-[1.15rem] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                            active ? "text-accent" : ""
                          }`}
                        />
                        <span className={`min-w-0 flex-1 truncate ${hideLabel}`}>
                          {item.label}
                        </span>
                        {showBadge ? (
                          <span
                            className={`inline-flex min-w-5 items-center justify-center rounded-full bg-accent-solid px-1.5 text-[11px] font-semibold leading-5 text-white ${
                              collapsed ? "lg:absolute lg:right-2 lg:top-1.5 lg:h-2.5 lg:min-w-0 lg:w-2.5 lg:px-0 lg:text-[0px]" : ""
                            }`}
                          >
                            {notificationCount > 99 ? "99+" : notificationCount}
                            <span className="sr-only"> unread</span>
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-border p-3">
          <div
            className={`flex items-center gap-3 rounded-xl bg-surface-subtle/50 p-2.5 ${
              collapsed ? "lg:justify-center lg:p-1.5" : ""
            }`}
          >
            <UserAvatar name={user.name} image={user.image} />
            <div className={`min-w-0 ${hideLabel}`}>
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted-soft">
                {user.role === "admin" ? "Administrator" : "Customer"} · {user.email}
              </p>
            </div>
          </div>

          <Link
            href="/"
            title="Back to store"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-strong transition-colors hover:bg-surface-subtle/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <Store aria-hidden="true" className="h-[1.15rem] w-[1.15rem] shrink-0" />
            <span className={hideLabel}>Back to store</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            title="Log out"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-60 ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <LogOut aria-hidden="true" className="h-[1.15rem] w-[1.15rem] shrink-0" />
            <span className={hideLabel}>
              {isSigningOut ? "Logging out..." : "Logout"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => writeCollapsed(!collapsed)}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-soft transition-colors hover:bg-surface-subtle/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:flex"
          >
            {collapsed ? (
              <ChevronsRight aria-hidden="true" className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft aria-hidden="true" className="h-4 w-4" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 ease-out ${
          collapsed ? "lg:pl-[4.75rem]" : "lg:pl-[17.5rem]"
        }`}
      >
        <header className="glass sticky top-0 z-30 border-x-0 border-t-0">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawerPath(pathname)}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="dashboard-sidebar"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted-strong transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-xs text-muted-soft">
                  {crumbs.map((crumb, index) => {
                    const last = index === crumbs.length - 1;

                    return (
                      <li
                        key={crumb.href}
                        className={`flex items-center gap-1.5 ${
                          last ? "min-w-0" : "hidden sm:flex"
                        }`}
                      >
                        {index > 0 ? (
                          <span aria-hidden="true" className="hidden sm:inline">
                            /
                          </span>
                        ) : null}
                        {last ? (
                          <span
                            aria-current="page"
                            className="truncate font-medium text-muted-strong"
                          >
                            {crumb.label}
                          </span>
                        ) : (
                          <Link
                            href={crumb.href}
                            className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            {crumb.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
              <p className="truncate text-base font-semibold leading-tight tracking-tight">
                {pageTitle}
              </p>
            </div>

            <form
              action={search.action}
              role="search"
              className="relative hidden w-56 md:block xl:w-72"
            >
              <label htmlFor="dashboard-search" className="sr-only">
                {search.label}
              </label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft"
              />
              <input
                id="dashboard-search"
                type="search"
                name={search.name}
                placeholder={search.placeholder}
                maxLength={100}
                className="w-full rounded-full border border-border bg-surface/70 py-2 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-soft focus:border-accent-bright focus:ring-2 focus:ring-accent-bright/20"
              />
            </form>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              <Link
                href={notificationsHref}
                aria-label={
                  notificationCount > 0
                    ? `Notifications, ${notificationCount} unread`
                    : "Notifications"
                }
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted-strong transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Bell aria-hidden="true" className="h-5 w-5" />
                {notificationCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-accent-solid px-1 text-[10px] font-semibold leading-[1.1rem] text-white ring-2 ring-background"
                  >
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                ) : null}
              </Link>

              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2.5 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <UserAvatar name={user.name} image={user.image} className="h-8 w-8 text-xs" />
                  <span className="hidden max-w-28 truncate text-sm font-medium sm:block">
                    {user.name.split(" ")[0] || "Account"}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-4 w-4 text-muted-soft transition-transform ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="glass-strong animate-rise absolute right-0 top-12 z-50 w-60 rounded-2xl p-2"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-muted-soft">{user.email}</p>
                    </div>
                    <div className="my-1 border-t border-border" />
                    <MenuLink href={profileHref} onNavigate={() => setMenuOpen(false)}>
                      <UserRound aria-hidden="true" className="h-4 w-4" />
                      Profile
                    </MenuLink>
                    <MenuLink href={settingsHref} onNavigate={() => setMenuOpen(false)}>
                      <Settings aria-hidden="true" className="h-4 w-4" />
                      Settings
                    </MenuLink>
                    {variant === "customer" && user.role === "admin" ? (
                      <MenuLink href="/admin" onNavigate={() => setMenuOpen(false)}>
                        <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                        Admin dashboard
                      </MenuLink>
                    ) : null}
                    {variant === "admin" ? (
                      <MenuLink href="/account" onNavigate={() => setMenuOpen(false)}>
                        <UserRound aria-hidden="true" className="h-4 w-4" />
                        My customer account
                      </MenuLink>
                    ) : null}
                    <MenuLink href="/" onNavigate={() => setMenuOpen(false)}>
                      <Store aria-hidden="true" className="h-4 w-4" />
                      View store
                    </MenuLink>
                    <div className="my-1 border-t border-border" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-60"
                    >
                      <LogOut aria-hidden="true" className="h-4 w-4" />
                      {isSigningOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <form
            action={search.action}
            role="search"
            className="relative px-4 pb-3 md:hidden"
          >
            <label htmlFor="dashboard-search-mobile" className="sr-only">
              {search.label}
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-7 top-[1.3rem] h-4 w-4 -translate-y-1/2 text-muted-soft"
            />
            <input
              id="dashboard-search-mobile"
              type="search"
              name={search.name}
              placeholder={search.placeholder}
              maxLength={100}
              className="w-full rounded-full border border-border bg-surface/70 py-2 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-soft focus:border-accent-bright focus:ring-2 focus:ring-accent-bright/20"
            />
          </form>
        </header>

        <main
          id="dashboard-content"
          className="mx-auto w-full max-w-[88rem] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function MenuLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-strong transition-colors hover:bg-surface-subtle/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </Link>
  );
}
