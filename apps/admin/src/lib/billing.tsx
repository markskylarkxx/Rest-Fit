import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

export interface BillingStatus {
  // TRIAL / ACTIVE: full access. GRACE: access ended, a few days left to pay.
  // LOCKED: only the Billing page works.
  state: "TRIAL" | "ACTIVE" | "GRACE" | "LOCKED";
  plan: string;
  trialEndsAt: string;
  paidUntil: string | null;
  accessEndsAt: string;
  graceEndsAt: string;
  daysLeft: number;
  onlinePayments: boolean;
  plans: { key: "MONTHLY" | "ANNUAL"; label: string; amountKobo: number; months: number }[];
  payments: {
    id: string;
    plan: string;
    amountKobo: number;
    method: string;
    status: string;
    periodStart: string | null;
    periodEnd: string | null;
    paidAt: string | null;
    createdAt: string;
  }[];
}

// RestFit's own WhatsApp, for gyms paying by bank transfer.
export const RESTFIT_WHATSAPP = "2347033627804";

const BillingContext = createContext<{ billing: BillingStatus | null; reload: () => Promise<void> } | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const [billing, setBilling] = useState<BillingStatus | null>(null);

  const reload = useCallback(async () => {
    try {
      setBilling((await api.get<BillingStatus>("/billing")).data);
    } catch {
      // Leave the last known status; pages show their own errors.
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return <BillingContext.Provider value={{ billing, reload }}>{children}</BillingContext.Provider>;
}

export const useBilling = () => {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling must be used inside BillingProvider");
  return ctx;
};
