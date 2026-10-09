import { daysUntil } from "../lib/format";
import { Badge } from "./ui";

export function MembershipBadge({ activeUntil }: { activeUntil: string | null }) {
  if (!activeUntil) return <Badge tone="slate">No active plan</Badge>;
  const days = daysUntil(activeUntil);
  if (days <= 7) return <Badge tone="amber">Ends in {days} day{days === 1 ? "" : "s"}</Badge>;
  return <Badge tone="green">Active</Badge>;
}
