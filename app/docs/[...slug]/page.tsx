import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnThisPage } from "../../../components/on-this-page";
import { PageNavigation } from "../../../components/page-navigation";
import { getPageHeadings, Rst } from "../../../components/rst";
import { Shell } from "../../../components/shell";
import { flattenDocs, getDoc, getDocsManifest, getDocTree } from "../../../lib/docs";

type Props = { params: Promise<{ slug: string[] }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await getDoc((await params).slug);
  return { title: doc?.title ?? "Not found" };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const [doc, tree, manifest] = await Promise.all([
    getDoc(slug),
    getDocTree(),
    getDocsManifest(),
  ]);
  if (!doc) notFound();
  const pages = flattenDocs(tree);
  const currentIndex = pages.findIndex((page) => page.slug.join("/") === slug.join("/"));
  const headings = getPageHeadings(doc.source);
  return (
    <Shell manifest={manifest} tree={tree} active={slug.join("/")}>
      <div className="document-layout">
        <article className="document">
          <Rst source={doc.source} slug={slug} tree={tree} />
          <PageNavigation previous={pages[currentIndex - 1]} next={pages[currentIndex + 1]} />
        </article>
        <OnThisPage headings={headings} />
      </div>
    </Shell>
  );
}
