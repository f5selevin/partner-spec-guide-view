import React from "react";
import { cleanDocTitle, type DocNode } from "../lib/docs";
import { CodeBlock } from "./code-block";
import { ImagePreview } from "./image-preview";
import type { PageHeading } from "./on-this-page";
import { DeploymentAccessMethodLink, DeploymentAccessMethodUrl, RstWidget } from "./rst-widgets";
import { TocTree } from "./toctree";

type Props = { source: string; slug: string[]; tree: DocNode[] };
const adornments = new Set(["=", "-", "`", ":", "'", '"', "~", "^", "_", "*", "+", "#", "<", ">"]);

function inline(text: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|``[^`]+``|:[\w-]+:`[^`]+`|`[^`]+`_)/g;
  return text.split(pattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("``")) return <code key={index}>{part.slice(2, -2)}</code>;
    const accessMethodUrl = part.match(/^:deployment-access-method-url:`([^|`]+)\|([^`]+)`$/);
    if (accessMethodUrl) {
      return <DeploymentAccessMethodUrl key={index} deployment={accessMethodUrl[1].trim()} label={accessMethodUrl[2].trim()} />;
    }
    const accessMethod = part.match(/^:deployment-access-method:`([^|`]+)\|([^`]+)`$/);
    if (accessMethod) {
      return <DeploymentAccessMethodLink key={index} deployment={accessMethod[1].trim()} label={accessMethod[2].trim()} />;
    }
    const role = part.match(/^:[\w-]+:`(.+)`$/)?.[1];
    const link = role ?? part.match(/^`(.+)`_$/)?.[1];
    if (link) {
      const match = link.match(/^(.*?)\s*<([^>]+)>$/);
      const href = match?.[2] ?? link;
      return <a key={index} href={href}>{match?.[1] || href}</a>;
    }
    return part;
  });
}

function headingId(label: string, used: Map<string, number>) {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function headingLevel(adornment: string) {
  if (adornment === "#") return 1;
  if (adornment === "-") return 3;
  return 2;
}

export function getPageHeadings(source: string): PageHeading[] {
  const lines = source.replace(/\r/g, "").split("\n");
  const headings: PageHeading[] = [];
  const used = new Map<string, number>();

  for (let index = 0; index < lines.length - 1; index += 1) {
    const label = cleanDocTitle(lines[index].trim());
    const underline = lines[index + 1].trim();
    if (label && underline.length >= label.length && underline[0] !== "#" && adornments.has(underline[0]) && [...underline].every((character) => character === underline[0])) {
      headings.push({ id: headingId(label, used), label, level: headingLevel(underline[0]) });
    }
  }
  return headings;
}

function indent(line: string) { return line.match(/^ */)?.[0].length ?? 0; }
function table(block: string[]) {
  const rows = block.map((line) => line.trim()).filter((line) => line && !line.startsWith(":"));
  const separators = rows.map((line, index) => (/^[=\-]+(?:\s{2,}[=\-]+)+$/.test(line) ? index : -1)).filter((index) => index >= 0);
  const content = rows.filter((_, index) => !separators.includes(index)).map((row) => row.split(/\s{2,}/));
  if (!content.length) return null;
  const [head, ...body] = content;
  return <div className="table-wrap"><table><thead><tr>{head.map((cell) => <th key={cell}>{inline(cell)}</th>)}</tr></thead><tbody>{body.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>;
}
function assetPath(slug: string[], value: string) {
  const base = slug.slice(0, -1);
  const parts = value.replace(/^\.\//, "").split("/");
  for (const part of parts) part === ".." ? base.pop() : part !== "." && base.push(part);
  return `/api/assets/${base.map(encodeURIComponent).join("/")}`;
}

export function Rst({ source, slug, tree }: Props) {
  const lines = source.replace(/\r/g, "").split("\n");
  const output: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const usedHeadingIds = new Map<string, number>();

  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1]?.trim() ?? "";
    if (!line.trim()) { i += 1; continue; }
    if (line.trim() && next.length >= line.trim().length && adornments.has(next[0]) && [...next].every((c) => c === next[0])) {
      const level = headingLevel(next[0]);
      const label = cleanDocTitle(line.trim());
      const id = level > 1 ? headingId(label, usedHeadingIds) : undefined;
      output.push(
        React.createElement(
          `h${level}`,
          { id, key: key++ },
          inline(label),
        ),
      );
      i += 2; continue;
    }
    const directive = line.match(/^\s*\.\.\s+([\w-]+)::\s*(.*)$/);
    if (directive) {
      const [, name, argument] = directive;
      const directiveIndent = indent(line);
      const block: string[] = [];
      i += 1;
      while (i < lines.length && (!lines[i].trim() || indent(lines[i]) > directiveIndent)) { block.push(lines[i]); i += 1; }
      if (name === "toctree") {
        output.push(<TocTree key={key++} lines={block} pageSlug={slug} tree={tree} />);
        continue;
      }
      if (name === "raw") continue;
      if (name === "table") {
        const rendered = table(block);
        if (rendered) output.push(React.cloneElement(rendered, { key: key++ }));
        continue;
      }
      if (name === "image" || name === "figure") {
        const options = Object.fromEntries(block.map((item) => item.trim().match(/^:([^:]+):\s*(.*)$/)).filter((item): item is RegExpMatchArray => Boolean(item)).map((item) => [item[1], item[2]]));
        output.push(<ImagePreview key={key++} src={assetPath(slug, argument.trim())} alt={options.alt || options.name || "Documentation image"} />); continue;
      }
      if (["note", "warning", "tip", "important", "attention", "caution", "danger"].includes(name)) {
        output.push(<aside key={key++} className={`admonition ${name}`}><strong>{name}</strong><p>{inline([argument, ...block].join(" ").trim())}</p></aside>); continue;
      }
      if (name === "react") {
        const options: Record<string, string> = {};
        let bodyStart = 0;
        while (bodyStart < block.length && !block[bodyStart].trim()) bodyStart += 1;
        while (bodyStart < block.length) {
          const option = block[bodyStart].trim().match(/^:([^:]+):\s*(.*)$/);
          if (!option) break;
          options[option[1]] = option[2];
          bodyStart += 1;
        }
        while (bodyStart < block.length && !block[bodyStart].trim()) bodyStart += 1;
        const bodyLines = block.slice(bodyStart);
        while (bodyLines.length && !bodyLines.at(-1)?.trim()) bodyLines.pop();
        const contentLines = bodyLines.filter((item) => item.trim());
        const padding = contentLines.length ? Math.min(...contentLines.map(indent)) : 0;
        const body = bodyLines.map((item) => item.slice(padding)).join("\n");
        output.push(<RstWidget key={key++} name={argument.trim()} options={options} body={body} />); continue;
      }
      if (name === "code-block" || name === "code") {
        const code = block.filter((item) => !item.trim().startsWith(":"));
        const padding = Math.min(...code.filter((item) => item.trim()).map(indent));
        output.push(<CodeBlock key={key++} language={argument.trim()}>{code.map((item) => item.slice(padding)).join("\n")}</CodeBlock>); continue;
      }
      continue;
    }
    const list = line.match(/^\s*(?:[-*+] |(\d+)[.)] )(.*)$/);
    if (list) {
      const ordered = Boolean(list[1]);
      const items: string[] = [];
      while (i < lines.length) {
        const itemLine = lines[i];
        const item = itemLine.match(/^\s*(?:[-*+] |(?:\d+)[.)] )(.*)$/);
        if (!item) break;
        const itemIndent = indent(itemLine);
        const itemText = [item[1]];
        i += 1;
        while (i < lines.length && lines[i].trim() && indent(lines[i]) > itemIndent && !lines[i].match(/^\s*(?:[-*+] |\d+[.)] )/)) {
          itemText.push(lines[i].trim());
          i += 1;
        }
        items.push(itemText.join(" "));
      }
      const List = ordered ? "ol" : "ul";
      const listProps = ordered && list[1] ? { start: Number(list[1]) } : {};
      output.push(<List key={key++} {...listProps}>{items.map((item) => <li key={item}>{inline(item)}</li>)}</List>); continue;
    }
    const paragraph = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim() && !lines[i].match(/^\s*\.\.\s+/) && !lines[i].match(/^\s*(?:[-*+] |\d+[.)] )/)) {
      if (lines[i + 1] && adornments.has(lines[i + 1].trim()[0]) && /^([=\-`:'"~^_*+#<>])\1+$/.test(lines[i + 1].trim())) break;
      paragraph.push(lines[i].trim()); i += 1;
    }
    output.push(<p key={key++}>{inline(paragraph.join(" "))}</p>);
  }
  return <>{output}</>;
}
