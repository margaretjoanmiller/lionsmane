import { isMatch, parse, parseISO } from 'date-fns';

export class DateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DateError';
  }
}

export function parseDate(dateString: string): Date {
  try {
    return parseISO(dateString);
  } catch {
    if (isMatch(dateString, 'EEE, dd MMM yyyy HH:mm:ss xx'))
      return parse(dateString, 'EEE, dd MMM yyyy HH:mm:ss xx', new Date());
    else throw new DateError('Invalid date format');
  }
}
