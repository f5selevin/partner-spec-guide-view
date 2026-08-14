"use client";

import { useEffect, useState } from "react";

type Props = { options: Record<string, string>; body: string };
type Widget = (props: Props) => React.ReactNode;
type AccessMethod = {
  host: string;
  port: number;
  label: string;
};
type DeploymentComponent = {
  name: string;
  accessMethods?: Record<string, AccessMethod[]>;
};
type DeploymentResponse = {
  deployment?: { components?: DeploymentComponent[] };
};

const deploymentUrl = process.env.NODE_ENV === "development"
  ? "http://localhost:5123/deployment"
  : "http://metadata.udf/deployment";

export function DeploymentAccessMethodLink({ deployment, label }: { deployment: string; label: string }) {
  const [href, setHref] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setHref("");

    fetch(deploymentUrl, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`metadata service returned ${response.status}`);
        return response.json() as Promise<DeploymentResponse>;
      })
      .then((data) => {
        const component = data.deployment?.components?.find(({ name }) => name === deployment);
        const method = Object.entries(component?.accessMethods ?? {}).flatMap(
          ([protocol, methods]) => methods.map((item) => ({ ...item, protocol })),
        ).find((item) => item.label === label);
        if (method) {
          setHref(`${method.protocol}://${method.host}${method.port === 443 || method.port === 80 ? "" : `:${method.port}`}`);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [deployment, label]);

  return href
    ? <a href={href} target="_blank" rel="noreferrer">{label}</a>
    : <>{label}</>;
}

function DeploymentAccessMethods({ options, body }: Props) {
  const deploymentName = options.deployment?.trim();
  const requestedMethods = (options["access-methods"] || body)
    .split(/[,\n]/)
    .map((method) => method.trim())
    .filter(Boolean);
  const [component, setComponent] = useState<DeploymentComponent>();
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setComponent(undefined);
    setError("");

    fetch(deploymentUrl, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`metadata service returned ${response.status}`);
        return response.json() as Promise<DeploymentResponse>;
      })
      .then((data) => {
        const match = data.deployment?.components?.find(({ name }) => name === deploymentName);
        if (!match) throw new Error(`component "${deploymentName}" was not found`);
        setComponent(match);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "unable to load deployment metadata");
        }
      });

    return () => controller.abort();
  }, [deploymentName]);

  if (!deploymentName || requestedMethods.length === 0) {
    return <aside className="admonition warning">DeploymentAccessMethods requires deployment and access-methods.</aside>;
  }
  if (error) return <aside className="admonition warning">Unable to display access methods: {error}.</aside>;
  if (!component) return <p>Loading access methods…</p>;

  const availableMethods = Object.entries(component.accessMethods ?? {}).flatMap(
    ([protocol, methods]) => methods.map((method) => ({ ...method, protocol })),
  );

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Component</th><th>Access method</th><th>Link</th></tr></thead>
        <tbody>
          {requestedMethods.map((label, index) => {
            const method = availableMethods.find((candidate) => candidate.label === label);
            const href = method
              ? `${method.protocol}://${method.host}${method.port === 443 || method.port === 80 ? "" : `:${method.port}`}`
              : undefined;
            return (
              <tr key={label}>
                {index === 0 && <td rowSpan={requestedMethods.length}><strong>{component.name}</strong></td>}
                <td>{label}</td>
                <td>{href ? <a href={href} target="_blank" rel="noreferrer">{href}</a> : "Not found"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const widgets: Record<string, Widget> = {
  DeploymentAccessMethods,
  DeploymentAccessMethodLink: ({ options, body }) => (
    <DeploymentAccessMethodLink
      deployment={options.deployment?.trim() ?? ""}
      label={(options["access-method"] || body).trim()}
    />
  ),
  Clock: ({ options }) => {
    const [value, setValue] = useState("");
    useEffect(() => {
      const update = () => setValue(new Date().toLocaleString());
      update();
      const timer = window.setInterval(update, Number(options.interval) || 1000);
      return () => window.clearInterval(timer);
    }, [options.interval]);
    return <span className="widget-value">{value}</span>;
  },
  LocalStorageValue: ({ options }) => {
    const [value, setValue] = useState(options.fallback ?? "");
    useEffect(() => setValue(localStorage.getItem(options.name ?? "") ?? options.fallback ?? ""), [options]);
    return <span className="widget-value">{value}</span>;
  },
  Details: ({ options, body }) => (
    <details className="widget-details"><summary>{options.summary ?? "Details"}</summary><p>{body}</p></details>
  ),
};

export function RstWidget({ name, ...props }: Props & { name: string }) {
  const Widget = widgets[name];
  return Widget ? <Widget {...props} /> : <aside className="admonition warning">Unknown component: {name}</aside>;
}
