"use client";

import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-css";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-yaml";

type Props = {
  children: string;
  language?: string;
};

const languageAliases: Record<string, string> = {
  console: "bash",
  html: "markup",
  js: "javascript",
  none: "plain",
  shell: "bash",
  sh: "bash",
  text: "plain",
  ts: "typescript",
  yml: "yaml",
};

export function CodeBlock({ children, language = "plain" }: Props) {
  const requestedLanguage = language.toLowerCase();
  const highlightedLanguage = languageAliases[requestedLanguage] ?? requestedLanguage;
  const grammar = Prism.languages[highlightedLanguage];
  const highlightedCode = grammar
    ? Prism.highlight(children, grammar, highlightedLanguage)
    : Prism.util.encode(children);
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  async function copyCode() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(children);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = children;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copiedToClipboard = document.execCommand("copy");
        textarea.remove();
        if (!copiedToClipboard) throw new Error("Unable to copy code");
      }

      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <pre className={`code-block language-${highlightedLanguage}`} data-language={requestedLanguage}>
      <button className="code-copy-button" type="button" onClick={copyCode} aria-label="Copy code to clipboard">
        {copied ? "Copied" : "Copy"}
      </button>
      <code className={`language-${highlightedLanguage}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </pre>
  );
}
