import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";
import { FiBriefcase, FiChevronLeft, FiChevronRight, FiHome } from "react-icons/fi";
import { canAccess } from "../../utils/custom";

/** Multi-level: any item may have `children` (any depth). Leaf needs `to`. */
const MENU = [
  {
    header: "Admin",
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: FiHome, permission: "dashboard.view" },
      { label: "Organizations", to: "/admin/organizations", icon: FiBriefcase, permission: "organization.view" },
    ],
  },
];

const filterItems = (items, user) =>
  items.reduce((acc, item) => {
    if (item.children) {
      const children = filterItems(item.children, user);
      if (children.length) acc.push({ ...item, children });
    } else if (!item.permission || canAccess(user, item.permission)) {
      acc.push(item);
    }
    return acc;
  }, []);

const isItemActive = (item, pathname) =>
  item.children
    ? item.children.some((c) => isItemActive(c, pathname))
    : pathname === item.to || pathname.startsWith(`${item.to}/`);

function MenuIcon({ icon: Icon }) {
  return <span className="menu-icon">{Icon ? <Icon /> : <span className="menu-bullet" />}</span>;
}

function MenuItem({ item, pathname, onNavigate }) {
  const [manualOpen, setManualOpen] = useState(null);

  if (!item.children) {
    return (
      <li className="menu-item">
        <NavLink
          to={item.to}
          end
          className={({ isActive }) => `menu-link${isActive ? " active" : ""}`}
          title={item.label}
          onClick={onNavigate}
        >
          <MenuIcon icon={item.icon} />
          <span className="menu-link-text">{item.label}</span>
        </NavLink>
      </li>
    );
  }

  const active = isItemActive(item, pathname);
  const open = manualOpen ?? active;

  return (
    <li className={`menu-item${open ? " open" : ""}`}>
      <button
        type="button"
        className={`menu-link menu-toggle${active ? " active-parent" : ""}`}
        aria-expanded={open}
        onClick={() => setManualOpen(!open)}
      >
        <MenuIcon icon={item.icon} />
        <span className="menu-link-text">{item.label}</span>
        <FiChevronRight className="menu-arrow" />
      </button>
      {open ? (
        <MenuList items={item.children} pathname={pathname} onNavigate={onNavigate} className="menu-sub" />
      ) : null}
    </li>
  );
}

function MenuList({ items, pathname, onNavigate, className = "" }) {
  return (
    <ul className={`list-unstyled mb-0 ${className}`}>
      {items.map((item) => (
        <MenuItem key={item.label} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </ul>
  );
}

export default function AdminSidebar({ user, collapsed, mobileOpen, onToggleCollapsed, onCloseMobile }) {
  const { pathname } = useLocation();
  const [flyout, setFlyout] = useState(null);
  const flyoutRef = useRef(null);
  const rail = collapsed && !mobileOpen;
  const groups = MENU.map((g) => ({ ...g, items: filterItems(g.items, user) })).filter((g) => g.items.length);
  const activeFlyout = rail && flyout?.pathname === pathname ? flyout : null;

  useEffect(() => {
    if (!activeFlyout) return undefined;
    const onDown = (e) => {
      if (flyoutRef.current?.contains(e.target) || e.target.closest?.("[data-rail-trigger]")) return;
      setFlyout(null);
    };
    const onKey = (e) => e.key === "Escape" && setFlyout(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [activeFlyout]);

  const toggleFlyout = (item, e) => {
    const { top } = e.currentTarget.getBoundingClientRect();
    setFlyout(activeFlyout?.item.label === item.label ? null : { item, top, pathname });
  };

  const renderRailItem = (item) => {
    if (!item.children) return <MenuItem key={item.label} item={item} pathname={pathname} />;
    const Icon = item.icon;
    const isOpen = activeFlyout?.item.label === item.label;
    return (
      <li className="menu-item" key={item.label}>
        <button
          type="button"
          data-rail-trigger
          className={`menu-link menu-toggle${isItemActive(item, pathname) ? " active-parent" : ""}${isOpen ? " flyout-open" : ""}`}
          title={item.label}
          aria-expanded={isOpen}
          onClick={(e) => toggleFlyout(item, e)}
        >
          <span className="menu-icon"><Icon /></span>
        </button>
      </li>
    );
  };

  return (
    <aside className={`layout-menu${rail ? " collapsed" : ""}${mobileOpen ? " open" : ""}`}>
      <div className="app-brand">
        <span className="app-brand-logo">L</span>
        <span className="app-brand-text">LineSe</span>
        <button
          type="button"
          className="layout-menu-toggle d-none d-lg-inline-flex"
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>
      </div>

      <ul className="menu-inner">
        {groups.map((group) => (
          <li key={group.header}>
            <div className="menu-header">{group.header}</div>
            {rail ? (
              <ul className="list-unstyled mb-0">{group.items.map(renderRailItem)}</ul>
            ) : (
              <MenuList items={group.items} pathname={pathname} onNavigate={onCloseMobile} />
            )}
          </li>
        ))}
      </ul>

      {activeFlyout
        ? createPortal(
            <div ref={flyoutRef} className="menu-flyout" style={{ top: activeFlyout.top }}>
              <div className="menu-flyout-title">{activeFlyout.item.label}</div>
              <MenuList items={activeFlyout.item.children} pathname={pathname} onNavigate={() => setFlyout(null)} />
            </div>,
            document.body
          )
        : null}
    </aside>
  );
}
