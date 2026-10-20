import type { PaymentMethod, PaymentStatus, StaffRole, SubscriptionStatus } from "@restfit/shared";

export interface Gym {
  id: string;
  name: string;
  joinCode: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  gym: Gym;
  isPlatformAdmin: boolean; 
}

export interface Plan {
  id: string;
  name: string;
  priceKobo: number;
  durationDays: number;
  active: boolean;
}

export interface MemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  checkInCode: string;
  activeUntil: string | null;
  planName: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  plan: Plan;
}

export interface Payment {
  id: string;
  amountKobo: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentLink: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
  member?: { id: string; firstName: string; lastName: string };
  subscription?: { plan: { name: string } } | null;
  recordedBy?: { name: string } | null;
}

export interface CheckIn {
  id: string;
  allowed: boolean;
  reason: string | null;
  createdAt: string;
  member: { id: string; firstName: string; lastName: string };
}

export interface MemberDetail extends Omit<MemberSummary, "planName"> {
  gender: "MALE" | "FEMALE" | null;
  emergencyContact: string | null;
  notes: string | null;
  subscriptions: Subscription[];
  payments: Payment[];
  checkIns: Omit<CheckIn, "member">[];
}

export interface Dashboard {
  gym: { name: string; joinCode: string; status: string } | null;
  activeMembers: number;
  revenueThisMonthKobo: number;
  revenueChangePct: number | null;
  endingThisWeek: number;
  checkInsToday: number;
  pendingPayments: number;
  recentCheckIns: {
    id: string;
    at: string;
    allowed: boolean;
    memberName: string;
  }[];
}

export interface CheckInResult {
  allowed: boolean;
  reason: string | null;
  member: { id: string; firstName: string; lastName: string; phone: string };
  plan: string | null;
  activeUntil: string | null;
  daysLeft: number | null;
}
