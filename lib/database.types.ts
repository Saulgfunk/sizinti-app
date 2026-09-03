// Hand-written to match docs/05_Data_Model.md exactly. Replace with
// `supabase gen types typescript` once the project is CLI-linked.

export type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP';
export type BillingCycle = 'weekly' | 'monthly' | 'yearly' | 'custom';
export type SubscriptionStatus = 'active' | 'cancelled';
export type CheckinResponse = 'still_using' | 'not_sure_or_no';

export interface Profile {
  id: string;
  base_currency: string;
  checkin_interval_days: number;
  default_reminder_lead_days: number;
  onboarding_completed_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  category: string;
  icon_key: string | null;
  price: number;
  currency: Currency;
  billing_cycle: BillingCycle;
  custom_cycle_days: number | null;
  start_date: string;
  next_renewal_date: string;
  reminder_lead_days: number | null;
  status: SubscriptionStatus;
  cancelled_at: string | null;
  lifetime_spent: number;
  last_checkin_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckinEvent {
  id: string;
  subscription_id: string;
  user_id: string;
  response: CheckinResponse;
  resulted_in_cancellation: boolean;
  created_at: string;
}

export interface FxRate {
  id: string;
  currency_pair: string;
  rate: number;
  fetched_at: string;
}
