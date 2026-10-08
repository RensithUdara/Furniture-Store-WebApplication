import { permanentRedirect } from "next/navigation";
import { CatalogView, catalogMetadata, type CatalogParams } from "@/components/catalog-view";
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<CatalogParams> };
export async function generateMetadata({ searchParams }: Props) {
  return catalogMetadata(await searchParams);
}
export default async function Products({ searchParams }: Props) {
  const params = await searchParams;
  // Categories live at /category/[slug]. Old links with ?category= are sent there for good,
  // keeping any other filters they carried.
  if (typeof params.category === "string" && /^[a-z0-9-]+$/.test(params.category)) {
    const rest = new URLSearchParams(
      Object.entries(params).flatMap(([k, v]) =>
        k !== "category" && typeof v === "string" ? [[k, v]] : [],
      ),
    ).toString();
    permanentRedirect(`/category/${params.category}${rest ? `?${rest}` : ""}`);
  }
  return <CatalogView params={params} />;
}
