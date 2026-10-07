import { guardAdminPage } from "@/lib/auth";
import { getSlides } from "@/services/slides";
import { getSettings } from "@/services/settings";
import { SlideForm } from "@/components/admin/slide-form";
export const metadata = { title: "Promo slides" };
export default async function Promos() {
  if (!(await guardAdminPage())) return null;
  const [slides, settings] = await Promise.all([getSlides(true), getSettings()]);
  // The slides table arrives with the same migration as the pickup settings.
  const migrated = settings?.pickup_open_hour != null;
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Home page</span>
          <h1>Promo slides</h1>
          <p>Images and messages shown in the home page carousel, in position order.</p>
        </div>
      </div>
      {migrated ? (
        <div className="category-edit-grid">
          <SlideForm />
          {slides.map((s) => (
            <SlideForm key={s.id} slide={s} />
          ))}
        </div>
      ) : (
        <div className="info-message">
          Promo slides need the latest database update. Run{" "}
          <code>supabase/migrations/003_settings.sql</code> and then{" "}
          <code>supabase/migrations/004_storefront.sql</code> in the Supabase SQL editor.
        </div>
      )}
    </>
  );
}
