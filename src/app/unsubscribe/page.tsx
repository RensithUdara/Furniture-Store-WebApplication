import Link from "next/link";
import { z } from "zod";
import { supabase } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Email preferences", robots: { index: false } };
// Where the links at the bottom of the store's emails lead. The token in the link is the
// proof of who is asking, so no sign-in is needed.
export default async function Unsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; cart?: string }>;
}) {
  const { token, cart } = await searchParams;
  const kind = cart ? "cart" : "newsletter";
  const value = z.uuid().safeParse(cart || token);
  let done = false;
  if (value.success) {
    const db = await supabase();
    const { data } = await db.rpc(
      kind === "cart" ? "stop_cart_reminders" : "unsubscribe_newsletter",
      {
        p_token: value.data,
      },
    );
    done = data === true;
  }
  return (
    <div className="container empty-state page-space">
      <h1>{done ? "You are unsubscribed." : "This link did not work."}</h1>
      <p>
        {done
          ? kind === "cart"
            ? "We will not send you any more reminders about your bag. Order updates are not affected."
            : "You will not receive our newsletter any more. You can subscribe again from the bottom of any page."
          : "The link may be incomplete. Try opening it again from the email, or contact us and we will sort it out."}
      </p>
      <Link className="button" href="/">
        Back to the store
      </Link>
    </div>
  );
}
