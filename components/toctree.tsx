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
  let expression = "";

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*") {
      if (pattern[index + 1] === "*") {
        expression += ".*";
        index += 1;
      } else {
        expression += "[^/]*";
      }
      continue;
    }
    if (character === "?") {
      expression += "[^/]";
      continue;
    }
    if (character === "[") {
      const closingBracket = pattern.indexOf("]", index + 1);
      if (closingBracket !== -1) {
        const characterClass = pattern.slice(index + 1, closingBracket);
        const negated = characterClass.startsWith("!");
        const contents = (negated ? characterClass.slice(1) : characterClass)
          .replaceAll("\\", "\\\\")
          .replaceAll("^", "\\^");
        expression += `[${negated ? "^" : ""}${contents}]`;
        index = closingBracket;
        continue;
      }
    }
    expression += character.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }

  return new RegExp(`^${expression}$`);
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
