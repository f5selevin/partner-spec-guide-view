"use client";

import { useEffect, useState } from "react";

type Props = { options: Record<string, string>; body: string };

export function Clock({ options }: Props) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const update = () => setValue(new Date().toLocaleString());
    update();
    const timer = window.setInterval(update, Number(options.interval) || 1000);
    return () => window.clearInterval(timer);
  }, [options.interval]);

  return <span className="widget-value">{value}</span>;
}

export function LocalStorageValue({ options }: Props) {
  const [value, setValue] = useState(options.fallback ?? "");

  useEffect(() => {
    setValue(localStorage.getItem(options.name ?? "") ?? options.fallback ?? "");
  }, [options]);

  return <span className="widget-value">{value}</span>;
}
