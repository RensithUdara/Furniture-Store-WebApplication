import Link from "next/link";
import { Gift, ShoppingBag, Sparkles } from "lucide-react";
import { accountUser } from "@/lib/account";
import { getLedger } from "@/services/rewards";
import { getSettings } from "@/services/settings";
import { dateOnly, money } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Reward points" };
const reasons: Record<string, string> = {
  EARNED: "Earned from an order",
  REDEEMED: "Used at checkout",
  REFUNDED: "Returned from a cancelled order",
  ADJUSTED: "Adjusted by the store",
};
export default async function AccountRewards() {
  const user = await accountUser("/account/rewards");
  const [ledger, settings] = await Promise.all([getLedger(), getSettings()]);
  const balance = Number(user.profile?.loyalty_points || 0);
  const rate = settings?.points_per_100,
    value = settings?.point_value;
  return (
    <>
      <div className="account-heading">
        <span className="eyebrow">My account</span>
        <h1>Reward points</h1>
        <p>Earn points on every delivered order and spend them at checkout.</p>
      </div>
      {ledger === null || rate == null || value == null ? (
        <div className="info-message">Reward points are not available at the moment.</div>
      ) : (
        <>
          <div className="points-hero">
            <div>
              <span>Your balance</span>
              <strong>{balance.toLocaleString("en-LK")} points</strong>
              <small>Worth {money(balance * value)} off your next order</small>
            </div>
            <Link className="button button-light" href="/products">
              <ShoppingBag size={17} /> Shop now
            </Link>
          </div>
          <div className="account-links points-how">
            <div>
              <Sparkles size={22} />
              <strong>Earn</strong>
              <span>
                {rate} {rate === 1 ? "point" : "points"} for every Rs. 100 you pay for furniture.
              </span>
            </div>
            <div>
              <Gift size={22} />
              <strong>Spend</strong>
              <span>Each point takes {money(value)} off at checkout.</span>
            </div>
            <div>
              <ShoppingBag size={22} />
              <strong>When</strong>
              <span>Points are added when your order is delivered or collected.</span>
            </div>
          </div>
          <div className="admin-section-title">
            <h2>Points history</h2>
          </div>
          {ledger.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Activity</th>
                    <th>Order</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((entry) => (
                    <tr key={entry.id}>
                      <td>{dateOnly(entry.created_at)}</td>
                      <td>{reasons[entry.reason] || entry.reason}</td>
                      <td>
                        {entry.order_id && entry.orders ? (
                          <Link className="text-link" href={`/orders/${entry.order_id}`}>
                            {entry.orders.order_number}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <strong className={entry.points > 0 ? "points-plus" : "points-minus"}>
                          {entry.points > 0 ? "+" : ""}
                          {entry.points.toLocaleString("en-LK")}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="info-message">
              No points activity yet. Your first delivered order will start your balance.
            </p>
          )}
        </>
      )}
    </>
  );
}
