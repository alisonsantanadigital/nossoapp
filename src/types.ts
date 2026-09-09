export type Role = "admin" | "member" | "viewer";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  photoURL?: string;
  currentOrganizationId?: string;
  preferences?: Record<string, any>;
  status?: "active" | "inactive";
  appRole?: "admin" | "user";
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  members: Record<string, Role>;
  currency?: string;
}

export interface Account {
  id: string;
  orgId: string;
  name: string;
  type: "bank" | "wallet" | "credit_card" | "savings" | "investment";
  balance: number;
  limit?: number; // for credit cards
  color?: string;
}

export interface Category {
  id: string;
  orgId: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  budget?: number;
}

export interface Transaction {
  id: string;
  orgId: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  description: string;
  categoryId?: string;
  accountId: string;
  date: Date;
  status: "completed" | "pending";
  notes?: string;
  tags?: string[];
  emoji?: string;
  imageUrl?: string;
  isFixed?: boolean;
  installmentInfo?: string;
}

export interface Bill {
  id: string;
  orgId: string;
  name: string;
  amount: number;
  dueDate: Date;
  categoryId?: string;
  accountId?: string;
  status: "paid" | "pending" | "overdue";
  recurrence?: "monthly" | "yearly" | "none";
}

export interface Goal {
  id: string;
  orgId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  image?: string;
  status: "active" | "completed";
}

export interface WishlistItem {
  id: string;
  orgId: string;
  name: string;
  price: number;
  priority: "high" | "medium" | "low";
  dateDesired?: Date;
  link?: string;
  status: "planned" | "purchased";
  image?: string;
}
