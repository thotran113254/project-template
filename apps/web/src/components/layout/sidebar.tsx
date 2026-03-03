import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Users, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/resources", label: "Resources", icon: Package },
  { to: "/users", label: "Users", icon: Users, adminOnly: true },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

/** Sidebar navigation with role-based link visibility. */
export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--card)]">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center border-b border-[var(--border)] px-6">
        <Package className="mr-2 h-5 w-5 text-[var(--primary)]" />
        <span className="text-lg font-semibold text-[var(--foreground)]">
          App Manager
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info footer */}
      {user && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="truncate text-sm font-medium text-[var(--foreground)]">
            {user.name}
          </p>
          <p className="truncate text-xs text-[var(--muted-foreground)]">
            {user.email}
          </p>
        </div>
      )}
    </aside>
  );
}
