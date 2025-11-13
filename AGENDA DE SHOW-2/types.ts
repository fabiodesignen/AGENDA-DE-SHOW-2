
export interface Show {
  id: number;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  fee: number;
  advance: number;
  status: 'Agendado' | 'Confirmado' | 'Cancelado';
  notes: string;
}

export interface ArtistInfo {
  name: string;
  contact: string;
  instagram: string;
  logo: string; // base64 string
}

export interface Location {
  id: number;
  name: string;
}

export interface UserSubscription {
  startDate: string; // ISO date string including time
  endDate: string; // ISO date string including time (startDate + 30 days)
  monthlyValue: number; // Value of the subscription
  paymentStatus: 'Pago' | 'Pendente' | 'Atrasado'; // New field
}

export interface User {
  id?: number; // Added for unique identification, especially for admin management
  name: string; // New: User's full name
  cpf: string;
  yearOfBirth: string; // New: User's year of birth for display purposes
  hashedYearOfBirth: string; // Hashed combination of CPF and yearOfBirth
  isBlocked?: boolean; // New property to indicate if the user is blocked
  subscription?: UserSubscription | null; // New: Subscription details
}

export type UserType = 'admin' | 'regular';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  type: UserType | null;
}

export type Tab = 'addShow' | 'showList' | 'calendar' | 'share';