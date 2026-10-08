import { notFound } from "next/navigation";
import { getCategories } from "@/services/catalog";
import { CatalogView, catalogMetadata, type CatalogParams } from "@/components/catalog-view";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogParams> };
export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  // Checked here as well as in the page: this runs before anything is sent, so an address
  // for a category that does not exist answers with a real 404 status.
  if (!(await getCategories()).some((c) => c.slug === slug)) notFound();
  return catalogMetadata(await searchParams, slug);
}
// One page per category, at an address that says what it is: /category/sofas.
export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  // An address for a category that does not exist is a real "not found".
  if (!(await getCategories()).some((c) => c.slug === slug)) notFound();
  return <CatalogView params={await searchParams} slug={slug} />;
}
