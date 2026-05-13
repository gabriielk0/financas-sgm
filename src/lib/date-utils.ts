import { format } from 'date-fns';

export function formatDateUTC(dateVal: Date | string): string {
  if (!dateVal) return '';
  const date = typeof dateVal === 'string' ? new Date(dateVal) : new Date(dateVal);
  if (isNaN(date.getTime())) return '';
  const fixedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return format(fixedDate, 'dd/MM/yyyy');
}
