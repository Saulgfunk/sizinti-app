import type { Category, Subscription } from '@/lib/database.types';

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Flow G: "Export data (CSV export of all subscriptions)."
export function buildSubscriptionsCsv(subscriptions: Subscription[], categories: Category[]): string {
  const headers = [
    'İsim',
    'Kategori',
    'Tutar',
    'Para Birimi',
    'Ödeme Sıklığı',
    'Başlangıç',
    'Sonraki Yenileme',
    'Durum',
    'Toplam Harcama',
  ];

  const rows = subscriptions.map((s) => {
    const categoryLabel = categories.find((c) => c.value === s.category)?.label ?? s.category;
    return [
      s.name,
      categoryLabel,
      String(s.price),
      s.currency,
      s.billing_cycle,
      s.start_date,
      s.next_renewal_date,
      s.status === 'active' ? 'Aktif' : 'İptal edildi',
      String(s.lifetime_spent),
    ]
      .map(escapeCsvField)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
