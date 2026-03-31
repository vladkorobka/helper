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
