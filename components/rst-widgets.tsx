"use client";

import { useEffect, useState } from "react";

type Props = { options: Record<string, string>; body: string };
type Widget = (props: Props) => React.ReactNode;

const widgets: Record<string, Widget> = {
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
