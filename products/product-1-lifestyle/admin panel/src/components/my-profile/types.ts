export type UserRole = "Admin" | "Super Admin" | "Manager";

export type ProfileUser = {
  id: number;
  email: string;

  firstName: string;
  lastName: string;
  phone: string;
  address: string;

  role: UserRole;
  status: "active" | "inactive";

  avatarUrl?: string | null;

  createdAt?: string | null;
  lastLoginAt?: string | null;
  lastVisitAt?: string; // UI formatted
};

export type NotificationCount = {
  notifications: number;
  messages: number;
};

export type ProfileContact = {
  email: string;
  address: string;
  phonePrimary: string;
  phoneSecondary?: string;
  profileFileLabel?: string;
};
