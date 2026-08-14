import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDocsManifest } from "../lib/docs";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const manifest = await getDocsManifest();
  return {
    title: { default: manifest.title, template: `%s | ${manifest.title}` },
    description: manifest.description,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const manifest = await getDocsManifest();
  return <html lang={manifest.language}><body>{children}</body></html>;
}
