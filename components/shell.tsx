"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { DocNode, DocsManifest } from "../lib/docs";
import { Navigation } from "./navigation";

type Props = {
  manifest: DocsManifest;
  tree: DocNode[];
  active?: string;
  children: ReactNode;
};

export function Shell({ manifest, tree, active, children }: Props) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="site-shell">
      <header>
        <Link href="/" className="brand">
          <svg
            className="brand-logo"
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            fill="none"
            viewBox="0 0 40 40"
            role="img"
            aria-label="F5"
          >
            <path fill="var(--color-brand, #e4002b)" d="M20 40c11.046 0 20-8.954 20-20S31.046 0 20 0 0 8.954 0 20s8.954 20 20 20Z" />
            <path fill="#fff" d="M19.54 21.973c9.82.81 13.604 3.514 13.424 7.207-.18 1.982-2.072 3.874-4.505 4.054-2.883.18-4.234-.99-5.045-2.252-.72-1.171-1.531-2.342-2.342-3.604-.18-.36-.54-.09-.81.09-.631.541-1.172 1.172-1.713 1.712-.36.36-.27.63-.18.901.54 1.261 1.081 2.523 1.622 3.694.9.54 4.955 1.261 7.928.99 2.072-.18 4.594-.99 6.757-2.522 2.072-1.621 3.603-3.784 3.873-7.297.09-2.162-.27-4.415-2.162-6.487s-5.135-3.783-11.711-4.234c.36-1.08.63-2.072.99-3.063 3.965.18 7.478.45 10.451.811.27-1.171.36-2.252.63-3.333l-.81-.991c-1.532-.18-2.973-.54-4.595-.721a71.941 71.941 0 0 0-6.576-.54c-1.532 4.324-3.334 9.82-5.225 15.585ZM16.928 5.126c-.72 0-1.712.18-3.334.54-3.513.992-7.837 3.424-8.288 7.478-.09.63-.09 1.352-.18 1.982-.99.09-1.892.18-2.793.27-.09.811-.09 1.532-.18 2.343.901-.09 1.802-.09 2.793-.18-.18 4.234 0 8.468.36 12.432.09.63.09 1.171.09 1.532-.09.36-.72.54-1.621.54l1.17 1.441c3.424.631 7.749 1.082 12.343 1.172v-1.352c-2.703-.18-3.964-.54-4.144-1.08-.18-.451-.18-1.082-.27-1.712-.18-4.145-.27-8.65-.18-13.244 1.531 0 3.063 0 4.594-.09.811-.36 1.532-.72 2.253-1.08v-1.532c-2.343 0-4.595.09-6.847.09.09-1.892.18-3.694.27-5.406.09-1.17.9-1.982 1.621-1.982 1.262-.09 2.433.45 3.604.991.63.27 1.261.63 1.892.901.27.09.63.18.9-.09.361-.45.722-.9 1.082-1.261.18-.27.09-.45 0-.54-.81-.631-1.532-1.172-2.342-1.803-.45-.36-1.262-.36-1.982-.36-.27-.09-.54 0-.811 0Z" />
          </svg>
          <span>{manifest.title}</span>
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-label="Toggle contents menu"
          aria-controls="contents-navigation"
          aria-expanded={navigationOpen}
          onClick={() => setNavigationOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>
      <aside
        id="contents-navigation"
        className={`sidebar${navigationOpen ? " sidebar-open" : ""}`}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setNavigationOpen(false);
        }}
      >
        <div className="sidebar-title">Contents</div>
        <Navigation tree={tree} active={active} />
      </aside>
      {navigationOpen && (
        <button
          type="button"
          className="menu-backdrop"
          aria-label="Close contents menu"
          onClick={() => setNavigationOpen(false)}
        />
      )}
      <main>{children}</main>
    </div>
  );
}
