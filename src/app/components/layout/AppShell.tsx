import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  LayoutDashboard, Building2, FileText, Menu, X, ChevronRight,
  SlidersHorizontal, ChevronDown, Activity, Package, ShieldAlert, ShieldCheck,
  BookOpen, BarChart2, LayoutGrid, TrendingUp, Target, FileBarChart, Globe,
  Briefcase, ScrollText,
} from 'lucide-react';

type NavItem = { path: string; label: string; icon: React.ElementType; exact?: boolean };
type NavGroup = { groupLabel: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: 'Executive Governance',
    items: [
      { path: '/executive/posture',  label: 'Risk Posture',     icon: TrendingUp   },
      { path: '/executive/appetite', label: 'Appetite Monitor', icon: Target       },
      { path: '/executive/kris',     label: 'KRI Dashboard',    icon: Activity     },
      { path: '/executive/report',   label: 'Board Report',     icon: FileBarChart },
    ],
  },
  {
    groupLabel: 'Vendor and Contract Mgmt.',
    items: [
      { path: '/',          label: 'Dashboard',       icon: LayoutDashboard, exact: true },
      { path: '/vendors',   label: 'Vendors',         icon: Building2 },
      { path: '/contracts', label: 'Contracts',       icon: FileText },
      { path: '/tprm',      label: 'TPRM Dashboard',  icon: Globe },
    ],
  },
  {
    groupLabel: 'Operations',
    items: [
      { path: '/products',  label: 'Benefits or Services Register', icon: Package },
      { path: '/processes', label: 'Process Register', icon: Activity },
    ],
  },
  {
    groupLabel: 'Risk & Controls',
    items: [
      { path: '/risk-dashboard', label: 'Risk Register', icon: ShieldAlert },
      { path: '/controls', label: 'Control Register', icon: ShieldCheck },
      { path: '/compliance', label: 'Framework', icon: BookOpen },
      { path: '/regulations', label: 'Regulations', icon: FileText },
      { path: '/bills', label: 'Bills & Legislation', icon: ScrollText },
      { path: '/regulatory-compliance-dashboard', label: 'Regulatory Dashboard', icon: BarChart2 },
    ],
  },
  {
    groupLabel: 'Third-Party',
    items: [
      { path: '/employers', label: 'Employer Register', icon: Briefcase },
    ],
  },
];

const SYSTEM_ITEMS: NavItem[] = [
  { path: '/configuration', label: 'Configuration',  icon: SlidersHorizontal },
];

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; path: string }[] = [{ label: 'Home', path: '/' }];
  if (pathname === '/my-dashboard') {
    crumbs.push({ label: 'My Dashboard', path: '/my-dashboard' });
  } else if (pathname.startsWith('/executive')) {
    crumbs.push({ label: 'Executive Governance', path: '/executive/posture' });
    if (pathname === '/executive/posture')  crumbs.push({ label: 'Risk Posture',     path: pathname });
    if (pathname === '/executive/appetite') crumbs.push({ label: 'Appetite Monitor', path: pathname });
    if (pathname === '/executive/kris')     crumbs.push({ label: 'KRI Dashboard',    path: pathname });
    if (pathname === '/executive/report')   crumbs.push({ label: 'Board Report',     path: pathname });
  } else if (pathname === '/tprm') {
    crumbs.push({ label: 'Vendor & Contract Mgmt.', path: '/vendors' });
    crumbs.push({ label: 'TPRM Dashboard', path: '/tprm' });
  } else if (pathname.startsWith('/vendors')) {
    crumbs.push({ label: 'Vendors', path: '/vendors' });
    if (pathname !== '/vendors') crumbs.push({ label: 'Vendor Detail', path: pathname });
  } else if (pathname.startsWith('/contracts')) {
    crumbs.push({ label: 'Contracts', path: '/contracts' });
    if (pathname !== '/contracts') crumbs.push({ label: 'Contract Detail', path: pathname });
  } else if (pathname.startsWith('/processes')) {
    crumbs.push({ label: 'Process Register', path: '/processes' });
    if (pathname !== '/processes') crumbs.push({ label: 'Process Detail', path: pathname });
  } else if (pathname.startsWith('/products')) {
    crumbs.push({ label: 'Benefits or Services Register', path: '/products' });
    if (pathname !== '/products') crumbs.push({ label: 'Benefit or Service Detail', path: pathname });
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
  } else if (pathname.startsWith('/employers')) {
    crumbs.push({ label: 'Employer Management', path: '/employers' });
    if (pathname !== '/employers') crumbs.push({ label: 'Employer Detail', path: pathname });
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
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        background: 'var(--background)',
        overflow: 'hidden',
      }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 40,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        className="hidden md:flex"
      >
        <SidebarContent onNavClick={() => setSidebarOpen(false)} />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <aside
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '240px',
            background: 'var(--sidebar)',
            borderRight: '1px solid var(--sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 41,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              height: '56px',
              borderBottom: '1px solid var(--sidebar-border)',
              flexShrink: 0,
            }}
          >
            <AppLogo onDark />
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--sidebar-foreground)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
          <SidebarContent onNavClick={() => setSidebarOpen(false)} hideLogo />
        </aside>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top Bar */}
        <header
          style={{
            height: '56px',
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: '12px',
            flexShrink: 0,
            boxShadow: 'var(--elevation-sm)',
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--foreground)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
            className="flex md:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Mobile logo */}
          <div className="flex md:hidden">
            <AppLogo />
          </div>

          {/* Breadcrumbs — no Fragment, use inline-flex spans */}
          <nav
            style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}
            className="hidden md:flex"
          >
            {crumbs.map((crumb, idx) => (
              <span
                key={idx}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {idx > 0 && (
                  <ChevronRight
                    size={12}
                    style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}
                  />
                )}
                <NavLink
                  to={crumb.path}
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight:
                      idx === crumbs.length - 1
                        ? 'var(--font-weight-semibold)'
                        : 'var(--font-weight-regular)',
                    color:
                      idx === crumbs.length - 1
                        ? 'var(--foreground)'
                        : 'var(--muted-foreground)',
                    textDecoration: 'none',
                  }}
                >
                  {crumb.label}
                </NavLink>
              </span>
            ))}
          </nav>

          {/* Right side — user avatar */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-bold)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              EC
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          style={{ flex: 1, overflowY: 'auto', padding: '32px', background: 'var(--muted)' }}
          className="p-4 md:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AppLogo({ onDark = false }: { onDark?: boolean }) {
  return (
    <NavLink
      to="/"
      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          background: onDark ? 'rgba(255,255,255,0.15)' : 'var(--primary)',
          borderRadius: 'var(--radius-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: onDark ? '1px solid rgba(255,255,255,0.2)' : 'none',
        }}
      >
        <FileText size={14} color={onDark ? 'rgba(255,255,255,0.9)' : 'white'} />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '14px',
          fontWeight: 'var(--font-weight-bold)',
          color: onDark ? 'var(--sidebar-primary)' : 'var(--foreground)',
          letterSpacing: '-0.01em',
        }}
      >
        Enterprise Risk Management
      </span>
    </NavLink>
  );
}

function SidebarContent({
  onNavClick,
  hideLogo,
}: {
  onNavClick: () => void;
  hideLogo?: boolean;
}) {
  return (
    <div style={{ display: 'contents' }}>
      {/* Logo */}
      {!hideLogo && (
        <div
          style={{
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '1px solid var(--sidebar-border)',
            flexShrink: 0,
          }}
        >
          <AppLogo onDark />
        </div>
      )}

      {/* Nav items */}
      <nav
        style={{
          flex: 1,
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
        }}
      >
        {/* My Dashboard — flat item above all groups */}
        <NavSectionLabel label="Overview" />
        <SidebarNavLink
          item={{ path: '/my-dashboard', label: 'My Dashboard', icon: LayoutGrid }}
          onNavClick={onNavClick}
        />

        {NAV_GROUPS.map(group => (
          <SidebarNavGroup key={group.groupLabel} group={group} onNavClick={onNavClick} />
        ))}

        <NavSectionLabel label="System" style={{ marginTop: '12px' }} />
        {SYSTEM_ITEMS.map(item => (
          <SidebarNavLink key={item.path} item={item} onNavClick={onNavClick} />
        ))}
      </nav>
    </div>
  );
}

function NavSectionLabel({ label, style: extStyle }: { label: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: '8px 8px 4px',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '11px',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'rgba(100, 140, 180, 0.7)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        ...extStyle,
      }}
    >
      {label}
    </div>
  );
}

function SidebarNavLink({
  item,
  onNavClick,
}: {
  item: { path: string; label: string; icon: React.ElementType; exact?: boolean };
  onNavClick: () => void;
}) {
  return (
    <NavLink
      to={item.path}
      end={item.exact}
      onClick={onNavClick}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: 'var(--radius-card)',
        textDecoration: 'none',
        background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
        color: isActive ? 'var(--sidebar-primary)' : 'var(--sidebar-foreground)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: 'var(--text-base)',
        fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
        transition: 'background 0.12s, color 0.12s',
        borderLeft: isActive ? '2px solid var(--sidebar-accent)' : '2px solid transparent',
      })}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        if (!el.style.background.includes('0.12')) {
          el.style.background = 'rgba(255,255,255,0.07)';
          el.style.color = 'var(--sidebar-primary)';
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        if (!el.style.background.includes('0.12')) {
          el.style.background = 'transparent';
          el.style.color = 'var(--sidebar-foreground)';
        }
      }}
    >
      <item.icon size={16} style={{ flexShrink: 0 }} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function SidebarNavGroup({
  group,
  onNavClick,
}: {
  group: { groupLabel: string; items: NavItem[] };
  onNavClick: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ marginBottom: '2px' }}>
      {/* Group header — Appian collapsibleSectionLayout style */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 'var(--radius-card)',
          cursor: 'pointer',
          gap: '6px',
          marginBottom: open ? '2px' : '0',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--sidebar-foreground, rgba(255, 255, 255, 0.85))',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            textAlign: 'left',
            flex: 1,
            opacity: 0.85,
          }}
        >
          {group.groupLabel}
        </span>
        <ChevronDown
          size={12}
          style={{
            color: 'var(--sidebar-foreground, rgba(255, 255, 255, 0.6))',
            flexShrink: 0,
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.18s ease',
            opacity: 0.6,
          }}
        />
      </button>

      {/* Collapsible items */}
      {open && (
        <div style={{ paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.08)', marginLeft: '8px' }}>
          {group.items.map(item => (
            <SidebarNavLink key={item.path} item={item} onNavClick={onNavClick} />
          ))}
        </div>
      )}
    </div>
  );
}