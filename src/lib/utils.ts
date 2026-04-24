import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currencyString: string = 'أوقية') => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ' + currencyString;
};

export const parseDescriptionWithStaff = (description: string) => {
  const staffMatch = description.match(/ \| @staff:(.+)$/);
  if (staffMatch) {
    return {
      text: description.replace(staffMatch[0], ''),
      staffName: staffMatch[1]
    };
  }
  return {
    text: description,
    staffName: null
  };
};
