"use client";
import { AdminList } from "@/components/admin/admin-list";
import { CategoryForm } from "@/components/admin/category-form";
import { CouponForm } from "@/components/admin/coupon-form";
import { SlideForm } from "@/components/admin/slide-form";
import { RoleForm } from "@/components/admin/role-form";
import { AREAS } from "@/lib/permissions";
import { dateOnly, money } from "@/lib/format";
import type { Category, Coupon, PromoSlide, StaffMember, StaffRole } from "@/types";
// Each admin list below is the same pattern: a table of what exists, and a popup form.
const Visible = ({
  on,
  yes = "Visible",
  no = "Hidden",
}: {
  on: boolean;
  yes?: string;
  no?: string;
}) => <span className={`status ${on ? "status-paid" : ""}`}>{on ? yes : no}</span>;
const Thumb = ({ src }: { src: string }) =>
  src ? <img className="row-thumb" src={src} alt="" /> : <span className="row-thumb" />;

export function CategoryManager({ categories }: { categories: Category[] }) {
  // parent_id exists once migration 004 has run; before that every category is top-level.
  const migrated = categories.some((c) => c.parent_id !== undefined);
  const parents = migrated ? categories.filter((c) => !c.parent_id) : [];
  const parentOf = (c: Category) => categories.find((p) => p.id === c.parent_id);
  const children = (id: string) => categories.filter((c) => c.parent_id === id);
  // Parents first, each followed by its sub-categories.
  const ordered = categories.filter((c) => !parentOf(c)).flatMap((c) => [c, ...children(c.id)]);
  return (
    <AdminList
      items={ordered}
      noun="category"
      plural="categories"
      rowKey={(c) => c.id}
      rowLabel={(c) => c.name}
      searchText={(c) => `${c.name} ${c.slug} ${parentOf(c)?.name || ""}`}
      columns={[
        {
          header: "Category",
          cell: (c) => (
            <div className={`table-product${c.parent_id ? " is-child" : ""}`}>
              <Thumb src={c.image_url} />
              <span>
                <strong>{c.name}</strong>
                <small>/{c.slug}</small>
              </span>
            </div>
          ),
        },
        { header: "Parent", cell: (c) => parentOf(c)?.name || "—" },
        { header: "Sub-categories", cell: (c) => (c.parent_id ? "—" : children(c.id).length) },
        { header: "Status", cell: (c) => <Visible on={c.is_active} /> },
      ]}
    >
      {(c, close) => (
        <CategoryForm
          category={c}
          // Two levels only: a category that already has sub-categories cannot itself become one.
          parents={c && children(c.id).length ? [] : parents}
          onDone={close}
        />
      )}
    </AdminList>
  );
}

const couponWindow = (c: Coupon) => {
  const now = Date.now();
  if (c.ends_at && Date.parse(c.ends_at) < now) return "Expired";
  if (c.starts_at && Date.parse(c.starts_at) > now) return `Starts ${dateOnly(c.starts_at)}`;
  return c.ends_at ? `Until ${dateOnly(c.ends_at)}` : "No end date";
};
export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  return (
    <AdminList
      items={coupons}
      noun="coupon"
      plural="coupons"
      size="lg"
      rowKey={(c) => c.id}
      rowLabel={(c) => c.code}
      searchText={(c) => `${c.code} ${c.description}`}
      columns={[
        {
          header: "Code",
          cell: (c) => (
            <>
              <strong className="coupon-code">{c.code}</strong>
              {c.description && <small>{c.description}</small>}
            </>
          ),
        },
        {
          header: "Discount",
          cell: (c) =>
            c.discount_type === "PERCENT"
              ? `${Number(c.discount_value)}% off`
              : `${money(c.discount_value)} off`,
        },
        {
          header: "Minimum spend",
          cell: (c) => (Number(c.min_subtotal) ? money(c.min_subtotal) : "None"),
        },
        { header: "Valid", cell: couponWindow },
        {
          header: "Used",
          cell: (c) => `${c.used_count}${c.usage_limit ? ` of ${c.usage_limit}` : ""}`,
        },
        { header: "Status", cell: (c) => <Visible on={c.is_active} yes="Active" no="Off" /> },
      ]}
    >
      {(c, close) => <CouponForm coupon={c} onDone={close} />}
    </AdminList>
  );
}

export function SlideManager({ slides }: { slides: PromoSlide[] }) {
  return (
    <AdminList
      items={slides}
      noun="slide"
      plural="slides"
      size="lg"
      rowKey={(s) => s.id}
      rowLabel={(s) => s.title || "Untitled slide"}
      searchText={(s) => `${s.title} ${s.subtitle} ${s.link_url}`}
      columns={[
        {
          header: "Slide",
          cell: (s) => (
            <div className="table-product">
              <img className="row-thumb wide" src={s.image_url} alt="" />
              <span>
                <strong>{s.title || "Untitled slide"}</strong>
                <small>{s.subtitle}</small>
              </span>
            </div>
          ),
        },
        { header: "Button", cell: (s) => s.button_label || "—" },
        { header: "Links to", cell: (s) => s.link_url },
        { header: "Position", cell: (s) => s.sort_order },
        { header: "Status", cell: (s) => <Visible on={s.is_active} yes="Showing" /> },
      ]}
    >
      {(s, close) => <SlideForm slide={s} onDone={close} />}
    </AdminList>
  );
}

export function RoleManager({ roles, staff }: { roles: StaffRole[]; staff: StaffMember[] }) {
  const members = (id: string) => staff.filter((m) => m.staff_role_id === id).length;
  return (
    <AdminList
      items={roles}
      noun="role"
      plural="roles"
      rowKey={(r) => r.id}
      rowLabel={(r) => r.name}
      searchText={(r) => `${r.name} ${r.description}`}
      columns={[
        {
          header: "Role",
          cell: (r) => (
            <>
              <strong>{r.name}</strong>
              {r.description && <small className="wrap">{r.description}</small>}
            </>
          ),
        },
        {
          header: "Can use",
          cell: (r) => (
            <div className="chip-list">
              {AREAS.filter((a) => r.permissions.includes(a.key)).map((a) => (
                <span key={a.key}>{a.name}</span>
              ))}
              {!r.permissions.length && "Nothing yet"}
            </div>
          ),
        },
        { header: "People", cell: (r) => members(r.id) },
      ]}
    >
      {(r, close) => <RoleForm role={r} members={r ? members(r.id) : 0} onDone={close} />}
    </AdminList>
  );
}
