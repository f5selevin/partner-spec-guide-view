"use client";

import { useMemo, useState } from "react";
import { CodeBlock } from "./code-block";

export type CodeGeneratorParameter = {
  name: string;
  title: string;
  default?: string;
  placeholder?: string;
  type?: "text" | "password" | "number";
  required?: boolean;
  readonly?: boolean;
};

type Props = {
  parameters: CodeGeneratorParameter[];
  template: string;
  language?: string;
  defaults?: Record<string, string>;
};

export function CodeGenerator({ parameters, template, language = "console", defaults = {} }: Props) {
  const initialValues = useMemo(
    () => Object.fromEntries(parameters.map(({ name, default: value = "" }) => [name, defaults[name] ?? value])),
    [defaults, parameters],
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const editableParameters = parameters.filter(({ readonly }) => !readonly);
  const [generatedCode, setGeneratedCode] = useState("");
  const [error, setError] = useState("");

  function generate() {
    const missing = parameters.filter(
      ({ name, required = true }) => required && !values[name]?.trim(),
    );
    if (missing.length) {
      setError(`Enter ${missing.map(({ title }) => title).join(", ")}.`);
      setGeneratedCode("");
      return;
    }

    const replacements = { ...defaults, ...values };
    const result = template.replace(/\$\$([A-Za-z][\w-]*)\$\$/g, (placeholder, name: string) => (
      Object.hasOwn(replacements, name) ? replacements[name] : placeholder
    ));
    const unresolved = [...new Set(result.match(/\$\$[A-Za-z][\w-]*\$\$/g) ?? [])];
    if (unresolved.length) {
      setError(`No value was provided for ${unresolved.join(", ")}.`);
      setGeneratedCode("");
      return;
    }

    setError("");
    setGeneratedCode(result);
  }

  return (
    <section className="code-generator">
      {editableParameters.length > 0 && (
        <div className="code-generator-fields">
          {editableParameters.map((parameter) => (
            <label key={parameter.name}>
              <span>{parameter.title}</span>
              <input
                type={parameter.type ?? "text"}
                value={values[parameter.name] ?? ""}
                placeholder={parameter.placeholder}
                required={parameter.required ?? true}
                autoComplete={parameter.type === "password" ? "off" : undefined}
                onChange={(event) => setValues((current) => ({
                  ...current,
                  [parameter.name]: event.target.value,
                }))}
              />
            </label>
          ))}
        </div>
      )}
      <button className="code-generator-button" type="button" onClick={generate}>Generate</button>
      {error && <p className="code-generator-error" role="alert">{error}</p>}
      {generatedCode && <CodeBlock language={language}>{generatedCode}</CodeBlock>}
    </section>
  );
}
