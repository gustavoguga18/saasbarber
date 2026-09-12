"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/admin",
      icon: "▦",
      label: "Dashboard",
    },
    {
      href: "/admin/agenda",
      icon: "◷",
      label: "Agenda",
    },
    {
      href: "/admin/clientes",
      icon: "♙",
      label: "Clientes",
    },
    {
      href: "/admin/servicos",
      icon: "✂",
      label: "Serviços",
    },
    {
      href: "/admin/horarios",
      icon: "◴",
      label: "Horários",
    },
    {
      href: "/admin/financeiro",
      icon: "◆",
      label: "Financeiro",
    },
  ];

  return (
    <>
      <button
        type="button"
        className="admin-menu-toggle"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${
          open ? "admin-sidebar-open" : ""
        }`}
      >
        <div className="admin-sidebar-header">
          <div>
            <span className="admin-sidebar-label">
              PAINEL
            </span>

            <strong>YAGO BARBERSHOP</strong>
          </div>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-link ${
                pathname === item.href
                  ? "admin-sidebar-link-active"
                  : ""
              }`}
            >
              <span className="admin-sidebar-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-line" />

          <span>
            Área administrativa
          </span>
        </div>
      </aside>
    </>
  );
}
