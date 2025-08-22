export type Asset = {
  id: string;
  name: string;
  description: string;
  category: string;
  registrationNumber: string;
  createdAt: Date;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  address: string;
  relativeName: string;
  alternatePhone: string;
  note: string;
  idCard1: {
    type: "License" | "Aadhar" | "Passport" | "Other";
    front: { url: string; name: string } | null;
    back: { url: string; name: string } | null;
  };
  idCard2: {
    type: "License" | "Aadhar" | "Passport" | "Other";
    front: { url: string; name: string } | null;
    back: { url: string; name: string } | null;
  };
  createdAt: Date;
};

export type PaymentStatus = "paid" | "pending";

export type RateType = "daily" | "monthly";

export type Payment = {
  id: string;
  amount: number;
  date: Date;
  status: PaymentStatus;
  notes?: string;
};

export type Expense = {
  id: string;
  amount: number;
  date: Date;
  description: string;
};

export type Due = {
  id: string;
  amount: number;
  date: Date;
  description: string;
};

export type BadgeColor =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "orange"
  | "teal"
  | "pink"
  | "black"
  | "grey"
  | "maroon"
  | "lightyellow"
  | "darkgreen";

export type Rental = {
  id: string;
  assetId: string;
  contactId: string;
  rate: number;
  rateType: RateType;
  startDate: Date;
  nextPaymentDate: Date;
  badgeColor: BadgeColor;
  badgeCharacter: string;
  status: "active" | "ended";
  payments: Payment[];
  expenses: Expense[];
  dues: Due[];
  createdAt: Date;
};

export type User = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
};
