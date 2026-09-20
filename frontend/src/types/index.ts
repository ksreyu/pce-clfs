export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  phone?: string;
  department?: string;
  year?: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface Item {
  id: string;
  itemCode: string;
  type: string;
  name: string;
  category: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  color?: string;
  brand?: string;
  model?: string;
  identifyingFeatures?: string;
  imageUrl?: string;
  status: string;
  reportedById: string;
  reportedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  score: number;
  reason: string;
  status: string;
  lostItem?: Item;
  foundItem?: Item;
  createdAt: string;
}

export interface Claim {
  id: string;
  itemId: string;
  claimantId: string;
  explanation: string;
  lostDate?: string;
  lostLocation?: string;
  identifyingDetails: string;
  proofUrl?: string;
  status: string;
  reviewedById?: string;
  reviewComment?: string;
  item?: Item;
  claimant?: User;
  reviewedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedItemId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items?: T[];
  matches?: T[];
  claims?: T[];
  users?: T[];
  notifications?: T[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount?: number;
}
