"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: string;
};

export function CodeBlock({ children }: Props) {
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
    <pre className="code-block">
      <button className="code-copy-button" type="button" onClick={copyCode} aria-label="Copy code to clipboard">
        {copied ? "Copied" : "Copy"}
      </button>
      <code>{children}</code>
    </pre>
  );
}
