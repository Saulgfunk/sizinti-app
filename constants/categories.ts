// Values match docs/05_Data_Model.md's "enum-like" category field exactly.
// Kept as free text in the DB (no CHECK constraint) so Settings' category
// management (rename/add custom categories) has room to work later.
export const CATEGORIES = [
  { value: 'streaming', label: 'Streaming', color: '#3c87f7' },
  { value: 'saas', label: 'SaaS / Yazılım', color: '#10A37F' },
  { value: 'fitness', label: 'Spor / Sağlık', color: '#F97316' },
  { value: 'finance', label: 'Finans', color: '#8B5CF6' },
  { value: 'education', label: 'Eğitim', color: '#EAB308' },
  { value: 'other', label: 'Diğer', color: '#9CA3AF' },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]['value'];
