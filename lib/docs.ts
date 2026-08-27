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
const metadataUrl =
  process.env.METADATA_URL || "http://localhost:5123/metadata";
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function assertInsideDocs(candidate: string) {
  const relative = path.relative(DOCS_ROOT, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error("Invalid documentation path");
}

export function cleanDocTitle(title: string) {
  return title.replace(/^(?:class|lab)\s+\d+\s*[-–—:]\s*/i, "").trim();
}

export function titleFromRst(source: string, fallback: string) {
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const title = lines[index].trim();
    const underline = lines[index + 1].trim();
    if (title && /^([=\-`:'"~^_*+#<>])\1{2,}$/.test(underline))
      return cleanDocTitle(title);
  }
  return cleanDocTitle(
    fallback
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
  );
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

type LabMetadata = {
  dep_id?: string;
  email?: string;
  lab_id?: string;
  petname?: string;
};

async function getNamespace() {
  const response = await fetch(metadataUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(`Unable to load lab metadata: ${response.status}`);
  }

  const body = (await response.json()) as LabMetadata;
  const namespace = body.petname?.trim();
  if (!namespace) {
    throw new Error("Lab metadata does not contain petname");
  }
  return namespace;
}

async function findDoc(slug: string[]) {
  const tree = await getDocTree();
  return flattenDocs(tree).find(
    (item) => item.slug.join("/") === slug.join("/"),
  );
}

export async function getDocTitle(slug: string[]) {
  return (await findDoc(slug))?.title;
}

export async function getDoc(slug: string[]) {
  const node = await findDoc(slug);
  if (!node) return null;

  let source = await fs.readFile(node.sourcePath, "utf8");
  if (source.includes("$$namespace$$")) {
    try {
      const namespace = await getNamespace();
      source = source.replaceAll("$$namespace$$", namespace);
    } catch (error) {
      console.error(
        `Unable to substitute the lab namespace from ${metadataUrl}; rendering the document without substitution.`,
        error,
      );
    }
  }

  return { ...node, source };
}

export async function getAsset(relativePath: string) {
  const candidate = path.resolve(DOCS_ROOT, relativePath);
  assertInsideDocs(candidate);
  return fs.readFile(candidate);
}

export function docsRoot() {
  return DOCS_ROOT;
}
