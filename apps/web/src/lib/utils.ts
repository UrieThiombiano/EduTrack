import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Merge Tailwind classes */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formater une date en français */
export function formatDate(date: string | Date, fmt = 'dd MMMM yyyy') {
  return format(new Date(date), fmt, { locale: fr });
}

/** Formater un montant FCFA */
export function formatMontant(montant: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(montant) + ' FCFA';
}

/** Formater une note sur 20 */
export function formatNote(note: number | null, max = 20) {
  if (note === null) return '—';
  return `${note.toFixed(2)}/${max}`;
}
