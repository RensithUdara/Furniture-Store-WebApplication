import { guardAdminPage } from "@/lib/auth";
import { getSettings } from "@/services/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { ZoneEditor } from "@/components/admin/zone-editor";
import { getZones } from "@/services/shopping";
export const metadata = { title: "Store settings" };
export default async function Settings() {
  if (!(await guardAdminPage("settings"))) return null;
  const [settings, zones] = await Promise.all([getSettings(), getZones(true)]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Configuration</span>
          <h1>Settings</h1>
          <p>Store-wide values that used to live in code.</p>
        </div>
      </div>
      {settings ? (
        <>
          <SettingsForm settings={settings} />
          {zones.length > 0 && <ZoneEditor zones={zones} />}
        </>
      ) : (
        <div className="info-message">
          The settings table does not exist yet. Run{" "}
          <code>supabase/migrations/003_settings.sql</code> in the Supabase SQL editor, then reload
          this page.
        </div>
      )}
    </>
  );
}
