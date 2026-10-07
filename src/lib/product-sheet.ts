// The columns of the product spreadsheet, one row per finish. The same list is used to write
// the export and to read an import, so a downloaded file can be edited and uploaded again.
export const PRODUCT_COLUMNS = [
  "slug",
  "name",
  "category",
  "brand",
  "description",
  "material",
  "dimensions",
  "visible",
  "featured",
  "images",
  "sku",
  "colour",
  "colour_hex",
  "finish_material",
  "price",
  "was_price",
  "stock",
  "reorder_level",
  "finish_active",
] as const;
export type ProductRow = Partial<Record<(typeof PRODUCT_COLUMNS)[number], string>>;
export const MAX_IMPORT_ROWS = 1000;
export type ImportResult = {
  slug: string;
  name: string;
  status: "created" | "updated" | "error";
  message: string;
};
