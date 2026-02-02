export type UserRole = 'OWNER' | 'STYLIST';

export interface Stylist {
  id: string;
  name: string;
  email: string;
  specialty: string;
  avatar: string;
  password?: string; // For authentication
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  lastVisit?: string;
  notes?: string;
  formulas?: string;
  parentId?: string; // ID of the parent account if linked
}

export interface Appointment {
  id: string;
  stylistId: string;
  clientName: string;
  clientId?: string;
  service: string;
  startTime: string; // "HH:mm AM/PM" format
  durationMinutes: number;
  price: number;
  date: string; // YYYY-MM-DD
  status: 'confirmed' | 'pending' | 'completed' | 'blocked' | 'cancelled';
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number; // MSRP/Retail Price
  cost?: number; // Wholesale/Acquisition Cost
  stock: number;
  stylistId: string; // The stylist/owner who carries this product
  imageUrl?: string;
}

export interface SoldProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  stylistId: string;
  amount: number; // Service amount
  tip: number;
  products?: SoldProduct[]; // Products sold in this transaction
  date: string;
  method: 'Square' | 'PayPal' | 'Venmo' | 'Cash';
  description: string;
  clientName: string;
}

export type ExpenseCategory = 'Salon products' | 'Supply store' | 'Tools' | 'Rent' | 'Miscellaneous';

export interface Expense {
  id: string;
  stylistId: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  vendor: string;
  receiptUrl?: string;
}

export interface StateTaxInfo {
  name: string;
  rate: number; // percentage
}

export interface AppState {
  currentUser: Stylist | 'OWNER' | null; // Null if not logged in
  appointments: Appointment[];
  transactions: Transaction[];
  clients: Client[];
  expenses: Expense[];
  inventory: Product[];
  stylists: Stylist[];
}