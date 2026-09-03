import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  LayoutDashboard, Building2, FileText, Menu, X, ChevronRight,
  SlidersHorizontal, ChevronDown, Activity, Package, ShieldAlert, ShieldCheck,
  BookOpen, BarChart2, LayoutGrid, TrendingUp, Target, FileBarChart, Globe,
  Briefcase, ScrollText, Users,
} from 'lucide-react';

type NavItem = { path: string; label: string; icon: React.ElementType; exact?: boolean };
type NavGroup = { groupLabel: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: 'Executive',
    items: [
      { path: '/executive/posture',  label: 'Risk Posture',     icon: TrendingUp   },
      { path: '/executive/appetite', label: 'Appetite Monitor', icon: Target       },
      { path: '/executive/kris',     label: 'KRI Dashboard',    icon: Activity     },
      { path: '/executive/report',   label: 'Board Report',     icon: FileBarChart },
    ],
  },
  {
    groupLabel: 'Vendor & Contracts',
    items: [
      { path: '/',          label: 'Dashboard',      icon: LayoutDashboard, exact: true },
      { path: '/vendors',   label: 'Vendors',        icon: Building2 },
      { path: '/contracts', label: 'Contracts',      icon: FileText },
      { path: '/tprm',      label: 'TPRM Dashboard', icon: Globe },
    ],
  },
  {
    groupLabel: 'Operations',
    items: [
      { path: '/products',  label: 'Products', icon: Package },
      { path: '/processes', label: 'Processes', icon: Activity },
    ],
  },
  {
    groupLabel: 'Risk & Controls',
    items: [
      { path: '/risk-dashboard', label: 'Risk Register',        icon: ShieldAlert },
      { path: '/controls',       label: 'Control Register',     icon: ShieldCheck },
      { path: '/compliance',     label: 'Framework',            icon: BookOpen },
      { path: '/regulations',    label: 'Regulations',          icon: FileText },
      { path: '/bills',          label: 'Bills & Legislation',  icon: ScrollText },
      { path: '/regulatory-compliance-dashboard', label: 'Regulatory Dashboard', icon: BarChart2 },
    ],
  },
  {
    groupLabel: 'Third-Party',
    items: [
      { path: '/entities', label: 'Entity Register',  icon: Briefcase },
      { path: '/personas', label: 'Persona Register', icon: Users },
    ],
  },
];

const SYSTEM_ITEMS: NavItem[] = [
  { path: '/configuration', label: 'Configuration', icon: SlidersHorizontal },
];

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; path: string }[] = [{ label: 'Home', path: '/' }];
  if (pathname === '/my-dashboard') {
    crumbs.push({ label: 'My Dashboard', path: '/my-dashboard' });
  } else if (pathname.startsWith('/executive')) {
    crumbs.push({ label: 'Executive', path: '/executive/posture' });
    if (pathname === '/executive/posture')  crumbs.push({ label: 'Risk Posture',     path: pathname });
    if (pathname === '/executive/appetite') crumbs.push({ label: 'Appetite Monitor', path: pathname });
    if (pathname === '/executive/kris')     crumbs.push({ label: 'KRI Dashboard',    path: pathname });
    if (pathname === '/executive/report')   crumbs.push({ label: 'Board Report',     path: pathname });
  } else if (pathname === '/tprm') {
    crumbs.push({ label: 'Vendor & Contracts', path: '/vendors' });
    crumbs.push({ label: 'TPRM Dashboard', path: '/tprm' });
  } else if (pathname.startsWith('/vendors')) {
    crumbs.push({ label: 'Vendors', path: '/vendors' });
    if (pathname !== '/vendors') crumbs.push({ label: 'Vendor Detail', path: pathname });
  } else if (pathname.startsWith('/contracts')) {
    crumbs.push({ label: 'Contracts', path: '/contracts' });
    if (pathname !== '/contracts') crumbs.push({ label: 'Contract Detail', path: pathname });
  } else if (pathname.startsWith('/processes')) {
    crumbs.push({ label: 'Processes', path: '/processes' });
    if (pathname !== '/processes') crumbs.push({ label: 'Process Detail', path: pathname });
  } else if (pathname.startsWith('/products')) {
    crumbs.push({ label: 'Products', path: '/products' });
    if (pathname !== '/products') crumbs.push({ label: 'Product Detail', path: pathname });
  } else if (pathname.startsWith('/plans')) {
    crumbs.push({ label: 'Products', path: '/products' });
    crumbs.push({ label: 'Plan Detail', path: pathname });
  } else if (pathname.startsWith('/configuration')) {
    crumbs.push({ label: 'Configuration', path: '/configuration' });
  } else if (pathname.startsWith('/risk-dashboard')) {
    crumbs.push({ label: 'Risk Register', path: '/risk-dashboard' });
  } else if (pathname.startsWith('/risks')) {
    crumbs.push({ label: 'Risk Register', path: '/risk-dashboard' });
    crumbs.push({ label: 'Risk Detail', path: pathname });
  } else if (pathname.startsWith('/controls')) {
    crumbs.push({ label: 'Control Register', path: '/controls' });
    if (pathname !== '/controls') crumbs.push({ label: 'Control Detail', path: pathname });
  } else if (pathname.startsWith('/compliance')) {
    crumbs.push({ label: 'Framework', path: '/compliance' });
    if (pathname !== '/compliance') crumbs.push({ label: 'Framework Detail', path: pathname });
  } else if (pathname.startsWith('/enterprise-risk-dashboard')) {
    crumbs.push({ label: 'Risk Dashboard', path: '/enterprise-risk-dashboard' });
  } else if (pathname.startsWith('/entities')) {
    crumbs.push({ label: 'Entity Register', path: '/entities' });
    if (pathname !== '/entities') crumbs.push({ label: 'Entity Detail', path: pathname });
  } else if (pathname.startsWith('/personas')) {
    crumbs.push({ label: 'Persona Register', path: '/personas' });
    if (pathname !== '/personas') crumbs.push({ label: 'Persona Detail', path: pathname });
  } else if (pathname.startsWith('/regulations')) {
    crumbs.push({ label: 'Regulations', path: '/regulations' });
    if (pathname !== '/regulations') crumbs.push({ label: 'Regulation Detail', path: pathname });
  } else if (pathname.startsWith('/bills')) {
    crumbs.push({ label: 'Bills & Legislation', path: '/bills' });
    if (pathname !== '/bills') crumbs.push({ label: 'Bill Detail', path: pathname });
  } else if (pathname.startsWith('/regulatory-compliance-dashboard')) {
    crumbs.push({ label: 'Regulatory Dashboard', path: '/regulatory-compliance-dashboard' });
  }
  return crumbs;
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const crumbs = getBreadcrumbs(location.pathname);

  return (
    <div style={{ display: 'flex', height: '100dvh', background: 'var(--background)', overflow: 'hidden' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside
        style={{
          width: '220px', flexShrink: 0,
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        className="hidden md:flex"
      >
        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </aside>

      {/* Sidebar — mobile */}
      {sidebarOpen && (
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: '220px',
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex', flexDirection: 'column',
          zIndex: 41, overflow: 'hidden',
        }}>
          <div style={{
            height: '52px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 14px',
            borderBottom: '1px solid var(--sidebar-border)', flexShrink: 0,
          }}>
            <AppLogo />
            <button onClick={() => setSidebarOpen(false)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--sidebar-foreground)', display: 'flex',
              alignItems: 'center', padding: '4px', borderRadius: '4px',
            }}>
              <X size={16} />
            </button>
          </div>
          <SidebarContent onNavClick={() => setSidebarOpen(false)} hideLogo />
        </aside>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          height: '52px',
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: '12px', flexShrink: 0,
        }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center', padding: '4px' }}
            className="flex md:hidden"
          >
            <Menu size={18} />
          </button>

          {/* Mobile logo */}
          <div className="flex md:hidden">
            <AppLogo dark={false} />
          </div>

          {/* Breadcrumbs */}
          <nav
            style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}
            className="hidden md:flex"
          >
            {crumbs.map((crumb, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                {idx > 0 && (
                  <ChevronRight size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0, margin: '0 2px' }} />
                )}
                <NavLink
                  to={crumb.path}
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: idx === crumbs.length - 1 ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                    color: idx === crumbs.length - 1 ? 'var(--foreground)' : 'var(--muted-foreground)',
                    textDecoration: 'none',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {crumb.label}
                </NavLink>
              </span>
            ))}
          </nav>

          {/* User avatar */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--primary)', color: 'var(--primary-foreground)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '11px', fontWeight: 'var(--font-weight-bold)',
              cursor: 'pointer', flexShrink: 0, letterSpacing: '0.02em',
            }}>
              EC
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          style={{ flex: 1, overflowY: 'auto', padding: '28px', background: 'var(--background)' }}
          className="p-4 md:p-7"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AppLogo({ dark = true }: { dark?: boolean }) {
  return (
    <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '22px', height: '22px',
        background: dark ? 'rgba(94,106,210,0.9)' : 'var(--primary)',
        borderRadius: '6px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <ShieldCheck size={12} color="white" />
      </div>
      <span style={{
        fontFamily: 'var(--font-family-primary)',
        fontSize: '13px',
        fontWeight: 'var(--font-weight-semibold)',
        color: dark ? 'var(--sidebar-primary)' : 'var(--foreground)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        ERM Platform
      </span>
    </NavLink>
  );
}

function SidebarContent({ onNavClick, hideLogo }: { onNavClick: () => void; hideLogo?: boolean }) {
  return (
    <div style={{ display: 'contents' }}>
      {!hideLogo && (
        <div style={{
          height: '52px', display: 'flex', alignItems: 'center',
          padding: '0 14px', borderBottom: '1px solid var(--sidebar-border)', flexShrink: 0,
        }}>
          <AppLogo />
        </div>
      )}

      <nav style={{
        flex: 1, padding: '8px 6px',
        display: 'flex', flexDirection: 'column', gap: '1px',
        overflowY: 'auto',
      }}>
        {/* Overview — single top item */}
        <SidebarLabel label="Overview" />
        <SidebarNavLink
          item={{ path: '/my-dashboard', label: 'My Dashboard', icon: LayoutGrid }}
          onNavClick={onNavClick}
        />

        {NAV_GROUPS.map(group => (
          <SidebarNavGroup key={group.groupLabel} group={group} onNavClick={onNavClick} />
        ))}

        <div style={{ marginTop: '4px' }}>
          <SidebarLabel label="System" />
          {SYSTEM_ITEMS.map(item => (
            <SidebarNavLink key={item.path} item={item} onNavClick={onNavClick} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function SidebarLabel({ label }: { label: string }) {
  return (
    <div style={{
      padding: '10px 8px 3px',
      fontFamily: 'var(--font-family-primary)',
      fontSize: '10px',
      fontWeight: '600',
      color: 'rgba(255,255,255,0.28)',
      textTransform: 'uppercase',
      letterSpacing: '0.09em',
    }}>
      {label}
    </div>
  );
}

function SidebarNavLink({
  item,
  onNavClick,
}: {
  item: NavItem;
  onNavClick: () => void;
}) {
  return (
    <NavLink
      to={item.path}
      end={item.exact}
      onClick={onNavClick}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '5px 8px', borderRadius: '5px',
        textDecoration: 'none',
        background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
        color: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.50)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '13px',
        fontWeight: isActive ? '500' : '400',
        letterSpacing: '-0.01em',
        transition: 'background 0.1s, color 0.1s',
      })}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        if (!el.style.background.includes('0.09')) {
          el.style.background = 'rgba(255,255,255,0.05)';
          el.style.color = 'rgba(255,255,255,0.72)';
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        if (!el.style.background.includes('0.09')) {
          el.style.background = 'transparent';
          el.style.color = 'rgba(255,255,255,0.50)';
        }
      }}
    >
      <item.icon size={14} style={{ flexShrink: 0 }} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function SidebarNavGroup({
  group,
  onNavClick,
}: {
  group: NavGroup;
  onNavClick: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginTop: '2px' }}>
      {/* Clean minimal group header — no box, just label + chevron */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 8px 3px',
          background: 'transparent', border: 'none', cursor: 'pointer', gap: '4px',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '10px', fontWeight: '600',
          color: 'rgba(255,255,255,0.28)',
          textTransform: 'uppercase', letterSpacing: '0.09em',
          textAlign: 'left', flex: 1,
        }}>
          {group.groupLabel}
        </span>
        <ChevronDown
          size={10}
          style={{
            color: 'rgba(255,255,255,0.22)',
            flexShrink: 0,
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {group.items.map(item => (
            <SidebarNavLink key={item.path} item={item} onNavClick={onNavClick} />
          ))}
        </div>
      )}
    </div>
  );
}
