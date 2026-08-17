import "server-only";

import { cache } from "react";
import { Clock, LocalStorageValue } from "./rst-client-widgets";

type Props = { options: Record<string, string>; body: string };
type Widget = (props: Props) => React.ReactNode | Promise<React.ReactNode>;
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

const getDeployment = cache(async () => {
  const response = await fetch(deploymentUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`metadata service returned ${response.status}`);
  return response.json() as Promise<DeploymentResponse>;
});

function methodUrl(method: AccessMethod & { protocol: string }) {
  return `${method.protocol}://${method.host}${method.port === 443 || method.port === 80 ? "" : `:${method.port}`}`;
}

async function findAccessMethod(deployment: string, label: string) {
  const data = await getDeployment();
  const component = data.deployment?.components?.find(({ name }) => name === deployment);
  return Object.entries(component?.accessMethods ?? {}).flatMap(
    ([protocol, methods]) => methods.map((item) => ({ ...item, protocol })),
  ).find((item) => item.label === label);
}

export async function DeploymentAccessMethodLink({ deployment, label }: { deployment: string; label: string }) {
  try {
    const method = await findAccessMethod(deployment, label);
    return method
      ? <a href={methodUrl(method)} target="_blank" rel="noreferrer">{label}</a>
      : <>{label}</>;
  } catch {
    return <>{label}</>;
  }
}

export async function DeploymentAccessMethodUrl({ deployment, label }: { deployment: string; label: string }) {
  try {
    const method = await findAccessMethod(deployment, label);
    return <>{method?.host ?? label}</>;
  } catch {
    return <>{label}</>;
  }
}

async function DeploymentAccessMethods({ options, body }: Props) {
  const deploymentName = options.deployment?.trim();
  const requestedMethods = (options["access-methods"] || body)
    .split(/[,\n]/)
    .map((method) => method.trim())
    .filter(Boolean);
  if (!deploymentName || requestedMethods.length === 0) {
    return <aside className="admonition warning">DeploymentAccessMethods requires deployment and access-methods.</aside>;
  }

  let component: DeploymentComponent | undefined;
  try {
    const data = await getDeployment();
    component = data.deployment?.components?.find(({ name }) => name === deploymentName);
    if (!component) throw new Error(`component "${deploymentName}" was not found`);
  } catch (reason: unknown) {
    console.error("Unable to display deployment access methods", {
      deploymentUrl,
      deploymentName,
      requestedMethods,
      nodeEnv: process.env.NODE_ENV,
      error: reason,
      cause: reason instanceof Error ? reason.cause : undefined,
    });
    const error = reason instanceof Error ? reason.message : "unable to load deployment metadata";
    return <aside className="admonition warning">Unable to display access methods: {error}.</aside>;
  }

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
            const href = method ? methodUrl(method) : undefined;
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
  Clock,
  LocalStorageValue,
  Details: ({ options, body }) => (
    <details className="widget-details"><summary>{options.summary ?? "Details"}</summary><p>{body}</p></details>
  ),
};

export function RstWidget({ name, ...props }: Props & { name: string }) {
  const Widget = widgets[name];
  return Widget ? <Widget {...props} /> : <aside className="admonition warning">Unknown component: {name}</aside>;
}
