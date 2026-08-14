import Link from "next/link";
import type { DocNode } from "../lib/docs";

type Props = {
  previous?: DocNode;
  next?: DocNode;
};

function PageLink({ node, direction }: { node: DocNode; direction: "Previous" | "Next" }) {
  const previous = direction === "Previous";
  return (
    <Link className={`page-navigation-link ${direction.toLowerCase()}`} href={`/docs/${node.slug.map(encodeURIComponent).join("/")}`}>
      <span className="page-navigation-arrow" aria-hidden="true">{previous ? "←" : "→"}</span>
      <span className="page-navigation-label">{direction}</span>
      <strong>{node.title}</strong>
    </Link>
  );
}

export function PageNavigation({ previous, next }: Props) {
  if (!previous && !next) return null;
  return (
    <nav className="page-navigation" aria-label="Page navigation">
      {previous ? <PageLink node={previous} direction="Previous" /> : <span />}
      {next ? <PageLink node={next} direction="Next" /> : <span />}
    </nav>
  );
}
