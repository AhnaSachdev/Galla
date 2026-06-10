"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Home, LogOut, Menu, Moon, Sun, WalletCards, X } from "lucide-react";

const mainLinks = [
  { href: "/", label: "Home" },
  { href: "/budget", label: "Budget" },
  { href: "/insights", label: "Insights" },
];

export function AppNavigation() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const nextTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  }

  return (
    <>
      <header className="top-nav">
        <nav className="nav-inner" aria-label="Primary navigation">
          <button
            className="icon-button"
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={19} />
          </button>
          <div className="nav-links">
            {mainLinks.map((link) => (
              <Link className="nav-link" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
          <button className="icon-button" type="button" aria-label="Toggle theme" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </header>

      {drawerOpen ? (
        <div className="drawer-backdrop">
          <aside className="side-drawer">
            <button
              className="icon-button drawer-close"
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
            >
              <X size={18} />
            </button>
            {[
              ["Dashboard", "/dashboard"],
              ["Profile", "/profile"],
              ["Transactions", "/transactions"],
              ["Savings", "/savings"],
              ["Budget", "/budget"],
              ["Insights", "/insights"],
            ].map(([label, href]) => (
              <Link className="drawer-link" href={href} key={href} onClick={() => setDrawerOpen(false)}>
                {label}
              </Link>
            ))}
            <button
              className="drawer-link drawer-button"
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                window.location.href = "/";
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </aside>
        </div>
      ) : null}

      <nav className="bottom-nav" aria-label="Mobile navigation">
        <Link href="/" aria-label="Home">
          <Home size={20} />
        </Link>
        <Link href="/transactions" aria-label="Transactions">
          <WalletCards size={20} />
        </Link>
        <Link href="/notifications" aria-label="Notifications">
          <Bell size={20} />
        </Link>
      </nav>
    </>
  );
}
