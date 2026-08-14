import Link from "next/link";
import type { ReactNode } from "react";
import type { DocNode, DocsManifest } from "../lib/docs";
import { Navigation } from "./navigation";

type Props = {
  manifest: DocsManifest;
  tree: DocNode[];
  active?: string;
  children: ReactNode;
};

export function Shell({ manifest, tree, active, children }: Props) {
  return (
    <div className="site-shell">
      <header><Link href="/" className="brand"><span className="brand-mark">F5</span><span>{manifest.title}</span></Link></header>
      <aside className="sidebar"><div className="sidebar-title">Contents</div><Navigation tree={tree} active={active} /></aside>
      <main>{children}</main>
    </div>
  );
}
