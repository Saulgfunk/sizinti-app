import type { Currency, FxRate } from '@/lib/database.types';

// fx_rates stores pairs like 'USD_TRY' (rate = units of the second currency
// one unit of the first buys), appended to over time rather than upserted —
// useFxRates orders by fetched_at desc, so the first match here is always
// the most recent rate for that pair. Returns null (not a fallback number)
// when no rate is available, so callers can render "no data yet" instead of
// a silently wrong amount — expected today since fetch-fx-rates isn't
// deployed and fx_rates is empty; should self-resolve once it is.
export function fxConvert(amount: number, from: Currency, to: Currency, rates: FxRate[]): number | null {
  if (from === to) return amount;

  const direct = rates.find((r) => r.currency_pair === `${from}_${to}`);
  if (direct) return Math.round(amount * direct.rate * 100) / 100;

  const inverse = rates.find((r) => r.currency_pair === `${to}_${from}`);
  if (inverse) return Math.round((amount / inverse.rate) * 100) / 100;

  return null;
}
