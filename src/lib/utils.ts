import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' أوقية';
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
