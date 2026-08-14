import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

export type DocNode = {
  slug: string[];
  title: string;
  sourcePath: string;
  children: DocNode[];
};

export type DocsManifest = {
  title: string;
  description: string;
  language: string;
};

const DOCS_ROOT = path.resolve(process.cwd(), "../docs");
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function assertInsideDocs(candidate: string) {
  const relative = path.relative(DOCS_ROOT, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error("Invalid documentation path");
}

export function titleFromRst(source: string, fallback: string) {
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const title = lines[index].trim();
    const underline = lines[index + 1].trim();
    if (title && /^([=\-`:'"~^_*+#<>])\1{2,}$/.test(underline)) return title;
  }
  return fallback
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function walk(directory: string, segments: string[]): Promise<DocNode[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".rst"),
  );
  const folders = entries.filter(
    (entry) => entry.isDirectory() && !entry.name.startsWith("."),
  );
  const nodes: DocNode[] = [];

  for (const file of files) {
    const basename = path.basename(file.name, ".rst");
    const sourcePath = path.join(directory, file.name);
    const source = await fs.readFile(sourcePath, "utf8");
    nodes.push({
      slug: [...segments, basename],
      title: titleFromRst(source, basename),
      sourcePath,
      children: [],
    });
  }
  for (const folder of folders) {
    const childSegments = [...segments, folder.name];
    const descendants = await walk(
      path.join(directory, folder.name),
      childSegments,
    );
    const index = descendants.find((node) => node.slug.at(-1) === folder.name);
    if (index) {
      index.children = descendants.filter((node) => node !== index);
      nodes.push(index);
    } else {
      nodes.push(...descendants);
    }
  }

  return nodes.sort((a, b) => {
    const aIntro = a.slug[0].toLowerCase() === "intro";
    const bIntro = b.slug[0].toLowerCase() === "intro";
    return aIntro === bIntro
      ? collator.compare(a.slug.join("/"), b.slug.join("/"))
      : aIntro
        ? -1
        : 1;
  });
}

export async function getDocTree() {
  return walk(DOCS_ROOT, []);
}

export async function getDocsManifest(): Promise<DocsManifest> {
  const source = await fs.readFile(
    path.join(DOCS_ROOT, "manifest.json"),
    "utf8",
  );
  return JSON.parse(source) as DocsManifest;
}

export function flattenDocs(nodes: DocNode[]): DocNode[] {
  return nodes
    .flatMap((node) => [node, ...flattenDocs(node.children)])
    .filter((node) => node.sourcePath);
}

export async function getDoc(slug: string[]) {
  const tree = await getDocTree();
  const node = flattenDocs(tree).find(
    (item) => item.slug.join("/") === slug.join("/"),
  );
  if (!node) return null;
  return { ...node, source: await fs.readFile(node.sourcePath, "utf8") };
}

export async function getAsset(relativePath: string) {
  const candidate = path.resolve(DOCS_ROOT, relativePath);
  assertInsideDocs(candidate);
  return fs.readFile(candidate);
}

export function docsRoot() {
  return DOCS_ROOT;
}
