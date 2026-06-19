import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import moment from 'moment';
import 'moment/dist/locale/pl';

moment.locale('pl');

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, format = 'YYYY-MM-DD') {
  return moment(date).format(format);
}

export function formatDateDisplay(date) {
  return moment(date).format('DD.MM.YYYY');
}

export function formatDuration(minutes) {
  if (!minutes) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} ${pluralHours(h)}`;
  return `${h} ${pluralHours(h)} ${m} min`;
}

function pluralHours(n) {
  if (n === 1) return 'godz';
  if ([2, 3, 4].includes(n)) return 'godz';
  return 'godz';
}

export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    'Wystąpił błąd'
  );
}

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Client-side sort by a string field. Returns a new array (does not mutate).
// Polish locale + numeric for natural ordering of alphanumeric codes (P1, P2, P10).
export function sortByField(arr, field, order = 'asc') {
  const dir = order === 'desc' ? -1 : 1;
  return [...arr].sort((a, b) => {
    const av = String(a?.[field] ?? '');
    const bv = String(b?.[field] ?? '');
    return (
      av.localeCompare(bv, 'pl', { numeric: true, sensitivity: 'base' }) * dir
    );
  });
}
