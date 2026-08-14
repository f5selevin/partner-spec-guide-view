import { redirect } from "next/navigation";
import { flattenDocs, getDocTree } from "../lib/docs";

export const dynamic = "force-dynamic";

export default async function Home() {
  const first = flattenDocs(await getDocTree())[0];
  if (first) redirect(`/docs/${first.slug.map(encodeURIComponent).join("/")}`);
  return <main className="empty">No RST documentation was found.</main>;
}
