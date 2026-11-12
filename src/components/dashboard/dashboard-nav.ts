export type DashboardIcon =
  | "overview"
  | "orders"
  | "history"
  | "wishlist"
  | "cart"
  | "addresses"
  | "reviews"
  | "notifications"
  | "profile"
  | "settings"
  | "help"
  | "analytics"
  | "products"
  | "categories"
  | "customers"
  | "inventory"
  | "coupons"
  | "promotions"
  | "store";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: DashboardIcon;
  /** Match only the exact path (used for the overview entries). */
  exact?: boolean;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export type DashboardVariant = "customer" | "admin";

export const customerNavGroups: DashboardNavGroup[] = [
  {
    label: "Account",
    items: [
      { href: "/account", label: "Overview", icon: "overview", exact: true },
      { href: "/account/orders", label: "My Orders", icon: "orders" },
      { href: "/account/history", label: "Order History", icon: "history" },
    ],
  },
  {
    label: "Shopping",
    items: [
      { href: "/account/wishlist", label: "Wishlist", icon: "wishlist" },
      { href: "/account/cart", label: "Shopping Cart", icon: "cart" },
      { href: "/account/addresses", label: "Saved Addresses", icon: "addresses" },
      { href: "/account/reviews", label: "My Reviews", icon: "reviews" },
    ],
  },
  {
    label: "Preferences",
    items: [
      {
        href: "/account/notifications",
        label: "Notifications",
        icon: "notifications",
      },
      { href: "/account/profile", label: "My Profile", icon: "profile" },
      { href: "/account/settings", label: "Settings", icon: "settings" },
      { href: "/account/help", label: "Help & Support", icon: "help" },
    ],
  },
];

export const adminNavGroups: DashboardNavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { href: "/admin", label: "Overview", icon: "overview", exact: true },
      { href: "/admin/analytics", label: "Analytics & Reports", icon: "analytics" },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/products", label: "Products", icon: "products" },
      { href: "/admin/categories", label: "Categories", icon: "categories" },
      { href: "/admin/orders", label: "Orders", icon: "orders" },
      { href: "/admin/customers", label: "Customers", icon: "customers" },
      { href: "/admin/inventory", label: "Inventory & Stock", icon: "inventory" },
      { href: "/admin/coupons", label: "Coupons", icon: "coupons" },
    ],
  },
  {
    label: "Store",
    items: [
      { href: "/admin/reviews", label: "Reviews & Ratings", icon: "reviews" },
      { href: "/admin/promotions", label: "Promotions", icon: "promotions" },
      {
        href: "/admin/notifications",
        label: "Notifications",
        icon: "notifications",
      },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/profile", label: "Admin Profile", icon: "profile" },
      { href: "/admin/settings", label: "Settings", icon: "settings" },
      { href: "/admin/help", label: "Help & Support", icon: "help" },
    ],
  },
];

export function isNavItemActive(pathname: string, item: DashboardNavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const ID_SEGMENT = /^[0-9a-f]{24}$/i;

/** Breadcrumb trail for a dashboard path, using nav labels where known. */
export function buildBreadcrumbs(
  pathname: string,
  groups: DashboardNavGroup[],
  rootLabel: string,
  rootHref: string,
): { href: string; label: string }[] {
  const labels = new Map<string, string>();

  for (const group of groups) {
    for (const item of group.items) {
      labels.set(item.href, item.label);
    }
  }

  const crumbs = [{ href: rootHref, label: rootLabel }];
  const segments = pathname.split("/").filter(Boolean);
  let current = "";

  segments.forEach((segment, index) => {
    current += `/${segment}`;

    // The first segment is the dashboard root itself.
    if (index === 0) {
      return;
    }

    const known = labels.get(current);
    const label =
      known ??
      (ID_SEGMENT.test(segment)
        ? "Details"
        : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "));

    // "Overview" is the root crumb, so skip a duplicate for exact roots.
    if (current === rootHref) {
      return;
    }

    crumbs.push({ href: current, label });
  });

  return crumbs;
}
