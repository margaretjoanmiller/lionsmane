import { isMatch, parse, parseISO } from 'date-fns';

export class DateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DateError';
  }
}

export function parseDate(dateString: string): Date {
  const iso = parseISO(dateString);
  if (!isNaN(iso.getTime())) return iso;
  else if (isMatch(dateString, 'EEE, dd MMM yyyy HH:mm:ss xx'))
    return parse(dateString, 'EEE, dd MMM yyyy HH:mm:ss xx', new Date());
  else return new Date(dateString); // fall back on native date parsing
}
