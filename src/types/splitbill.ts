export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[]; // person IDs
}

export interface Person {
  id: string;
  name: string;
  color: string;
}

export interface SplitBill {
  id: string;
  name: string;
  items: ReceiptItem[];
  people: Person[];
  tax: number;
  taxPercent?: number; // Optional: tax as percentage instead of fixed amount
  tip: number;
  createdAt: string;
}

export interface PersonTotal {
  personId: string;
  personName: string;
  items: { name: string; price: number; quantity: number; shared: boolean }[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}
