import type { CategoryValue } from '@/constants/categories';

export interface QuickAddService {
  key: string;
  name: string;
  category: CategoryValue;
  // Placeholder badge color until real logo assets exist in assets/logos/
  // (docs/07_Project_Structure.md) — icon_key still gets stored on the
  // subscription row so real logos can be swapped in later without a
  // migration.
  color: string;
}

export const QUICK_ADD_SERVICES: QuickAddService[] = [
  { key: 'netflix', name: 'Netflix', category: 'streaming', color: '#E50914' },
  { key: 'spotify', name: 'Spotify', category: 'streaming', color: '#1DB954' },
  { key: 'youtube-premium', name: 'YouTube Premium', category: 'streaming', color: '#FF0000' },
  { key: 'disney-plus', name: 'Disney+', category: 'streaming', color: '#113CCF' },
  { key: 'amazon-prime', name: 'Amazon Prime', category: 'streaming', color: '#00A8E1' },
  { key: 'icloud-plus', name: 'iCloud+', category: 'saas', color: '#3693F3' },
  { key: 'chatgpt-plus', name: 'ChatGPT Plus', category: 'saas', color: '#10A37F' },
  { key: 'gym', name: 'Spor Salonu', category: 'fitness', color: '#F97316' },
];
