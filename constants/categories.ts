// Values match docs/05_Data_Model.md's "enum-like" category field exactly.
// Kept as free text in the DB (no CHECK constraint) so Settings' category
// management (rename/add custom categories) has room to work later.
export const CATEGORIES = [
  { value: 'streaming', label: 'Streaming' },
  { value: 'saas', label: 'SaaS / Yazılım' },
  { value: 'fitness', label: 'Spor / Sağlık' },
  { value: 'finance', label: 'Finans' },
  { value: 'education', label: 'Eğitim' },
  { value: 'other', label: 'Diğer' },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]['value'];
