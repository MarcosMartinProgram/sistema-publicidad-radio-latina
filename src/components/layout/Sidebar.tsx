import { NavLink } from "react-router-dom";

export type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

const iconCls = "h-5 w-5";

const items: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: (
      <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/clientes",
    label: "Clientes",
    icon: (
      <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="7" r="4" />
        <path d="M17 11a3 3 0 1 0 0-6" />
        <path d="M3 21v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" />
        <path d="M21 21v-1a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
  {
    to: "/pautas",
    label: "Pautas",
    icon: (
      <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 15h6M9 11h2" />
      </svg>
    ),
  },
  {
    to: "/cobros",
    label: "Cobros",
    icon: (
      <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </svg>
    ),
  },
];

export function Sidebar() {
  return (
    <>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col bg-navy">
        <SidebarInner />
      </aside>

      <nav className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around bg-navy py-2 lg:hidden">
        {items.map((it) => (
          <MobileItem key={it.to} item={it} />
        ))}
      </nav>
    </>
  );
}

function SidebarInner() {
  return (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container font-bold text-on-primary">
          RL
        </span>
        <div>
          <p className="text-body-md font-semibold leading-tight text-surface">Radio Latina Du Graty 102.3 Mhz</p>
          <p className="text-label-md text-inverse-on-surface/60">102.3 Mhz · Gestión</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-body-md transition ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "text-inverse-on-surface/80 hover:bg-surface-container-low hover:text-surface"
              }`
            }
          >
            {it.icon}
            {it.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5">
        <p className="text-label-md text-inverse-on-surface/40">102.3 FM · Argentina</p>
      </div>
    </>
  );
}

function MobileItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1 text-body-sm transition ${
          isActive ? "text-primary" : "text-inverse-on-surface/70"
        }`
      }
    >
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
  );
}
