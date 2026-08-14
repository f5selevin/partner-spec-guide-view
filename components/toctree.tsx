import Link from "next/link";
import type { DocNode } from "../lib/docs";

type Props = {
  lines: string[];
  pageSlug: string[];
  tree: DocNode[];
};

function flatten(nodes: DocNode[]): DocNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

function resolvePattern(pageSlug: string[], pattern: string) {
  const segments = [...pageSlug.slice(0, -1)];
  for (const part of pattern.replace(/\.rst$/, "").split("/")) {
    if (part === "..") segments.pop();
    else if (part && part !== ".") segments.push(part);
  }
  return segments.join("/");
}

function globRegex(pattern: string) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replaceAll("**", "§§").replaceAll("*", "[^/]*").replaceAll("§§", ".*")}$`);
}

export function TocTree({ lines, pageSlug, tree }: Props) {
  const entries = lines.map((line) => line.trim()).filter((line) => line && !line.startsWith(":"));
  const patterns = entries.map((entry) => {
    const explicit = entry.match(/^.*?<([^>]+)>$/)?.[1] ?? entry;
    return globRegex(resolvePattern(pageSlug, explicit));
  });
  const nodes = flatten(tree).filter((node) => patterns.some((pattern) => pattern.test(node.slug.join("/"))));

  if (!nodes.length) return null;
  return (
    <ul className="document-toctree">
      {nodes.map((node) => (
        <li key={node.slug.join("/")}>
          <Link href={`/docs/${node.slug.map(encodeURIComponent).join("/")}`}>{node.title}</Link>
        </li>
      ))}
    </ul>
  );
}
