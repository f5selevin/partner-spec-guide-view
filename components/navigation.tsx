import Link from "next/link";
import type { DocNode } from "../lib/docs";

function Branch({ node, active }: { node: DocNode; active: string }) {
  const href = `/docs/${node.slug.map(encodeURIComponent).join("/")}`;
  const selected = node.slug.join("/") === active;
  return (
    <li>
      {node.sourcePath ? <Link href={href} aria-current={selected ? "page" : undefined}>{node.title}</Link> : <span>{node.title}</span>}
      {node.children.length > 0 && <ul>{node.children.map((child) => <Branch key={child.slug.join("/")} node={child} active={active} />)}</ul>}
    </li>
  );
}

export function Navigation({ tree, active = "" }: { tree: DocNode[]; active?: string }) {
  return <nav aria-label="Documentation"><ul className="nav-tree">{tree.map((node) => <Branch key={node.slug.join("/")} node={node} active={active} />)}</ul></nav>;
}
