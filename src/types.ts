export type CategoryKey =
  | 'groceries'
  | 'salaries'
  | 'maintenance'
  | 'rent'
  | 'utilities'
  | 'miscellaneous';

export type PaymentType = 'monthly' | 'installment' | 'part_payment' | 'one_time';

export const PAYMENT_TYPE_CONFIG: Record<PaymentType, { label: string; color: string; bgColor: string; borderClass: string }> = {
  monthly: { label: 'Monthly', color: '#1A5FB4', bgColor: '#DBEAFE', borderClass: 'border-blue-200' },
  installment: { label: 'Installment', color: '#7C3AED', bgColor: '#EDE9FE', borderClass: 'border-purple-200' },
  part_payment: { label: 'Part Payment', color: '#D97706', bgColor: '#FEF3C7', borderClass: 'border-amber-200' },
  one_time: { label: 'One-time', color: '#0891B2', bgColor: '#CFFAFE', borderClass: 'border-cyan-200' },
};

export type RentCategory = 'monthly' | 'yearly' | 'part_payment';

export const RENT_CATEGORY_CONFIG: Record<RentCategory, { label: string; description: string; color: string; bgColor: string; textClass: string; bgClass: string }> = {
  monthly: {
    label: 'Monthly Rent',
    description: 'Fixed amount paid every month',
    color: '#1A5FB4',
    bgColor: '#DBEAFE',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
  },
  yearly: {
    label: 'Yearly Rent',
    description: 'Total amount paid once a year',
    color: '#0891B2',
    bgColor: '#CFFAFE',
    textClass: 'text-cyan-700',
    bgClass: 'bg-cyan-50',
  },
  part_payment: {
    label: 'Part Payments',
    description: 'Split into multiple installments',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    textClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
  },
};

export interface Resident {
  id: string;
  name: string;
  roomNumber: string;
  rentCategory: RentCategory;
  monthlyRent: number; // equivalent rent / month
  yearlyRent?: number;
  partPaymentAmount?: number;
  partPaymentCount?: number;
  phone?: string;
  active: boolean;
  joinDate: string;
  rentDueDay?: number;
  reminderEnabled?: boolean;
}

export interface Payment {
  id: string;
  type: 'resident' | 'other';
  paymentType?: PaymentType;
  residentId?: string;
  description: string;
  amount: number;
  date: string;
}

export interface Expense {
  id: string;
  category: CategoryKey;
  subCategory: string;
  amount: number;
  date: string;
  notes?: string;
}

export const CATEGORY_CONFIG: Record<
  CategoryKey,
  { label: string; color: string; bgColor: string; textClass: string; bgClass: string; borderClass: string; suggestions: string[] }
> = {
  groceries: {
    label: 'Groceries',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    suggestions: [
      'Vegetables', 'Milk', 'Rice', 'Dal', 'Oil', 'Fruits',
      'Eggs', 'Bread', 'Spices', 'Sugar', 'Tea/Coffee',
    ],
  },
  salaries: {
    label: 'Salaries',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    textClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    suggestions: ['Cook', 'Cleaner', 'Watchman', 'Manager', 'Helper'],
  },
  maintenance: {
    label: 'Maintenance',
    color: '#D97706',
    bgColor: '#FEF3C7',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    suggestions: [
      'Plumber', 'Electrician', 'Carpenter', 'Painter',
      'AC Repair', 'Fan Repair', 'General Repair',
    ],
  },
  rent: {
    label: 'Rent',
    color: '#0369A1',
    bgColor: '#E0F2FE',
    textClass: 'text-sky-700',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    suggestions: ['Monthly Rent', 'Advance', 'Security Deposit'],
  },
  utilities: {
    label: 'Utilities',
    color: '#0891B2',
    bgColor: '#CFFAFE',
    textClass: 'text-cyan-700',
    bgClass: 'bg-cyan-50',
    borderClass: 'border-cyan-200',
    suggestions: ['Electricity', 'Water', 'Gas', 'Internet', 'Cable TV', 'Phone'],
  },
  miscellaneous: {
    label: 'Miscellaneous',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    textClass: 'text-gray-700',
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    suggestions: ['Stationery', 'Cleaning Supplies', 'Kitchen Utensils', 'Decoration', 'Other'],
  },
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export interface Registration {
  uid: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}
