export type HotelType = string;

export interface Hotel {
  id: string;
  name: string;
  type: HotelType;
  address: string;
  description: string;
  rating: number;
}

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

export interface Room {
  id: string;
  hotelId: string;
  number: string;
  name: string;
  type: string;
  capacity: number;
  ratePerNight: number;
  status: RoomStatus;
  amenities: string[];
}

export type ReservationStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface Reservation {
  id: string;
  hotelId: string;
  roomId: string;
  guestName: string;
  guestEmail: string;
  checkIn: string; // ISO date YYYY-MM-DD
  checkOut: string; // ISO date YYYY-MM-DD
  status: ReservationStatus;
  guestsCount: number;
  totalAmount: number;
  outstandingBalance: number;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  reservationsCount: number;
  preferences: string[];
  loyaltyTier: 'Classic' | 'Silver' | 'Gold' | 'Platinum';
}

export interface POSCharge {
  id: string;
  reservationId: string;
  item: string;
  amount: number;
  timestamp: string;
}

export interface MaintenanceTicket {
  id: string;
  hotelId: string;
  roomId: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'resolved';
  reportedDate: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  isActive: boolean;
}

export interface OTAChannel {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'syncing' | 'disconnected';
  lastSync: string;
  rateSyncMultiplier: number;
  apiKey?: string;
  propertyId?: string;
  apiUrl?: string;
  webhookUrl?: string;
}

export type AgentRole = 'receptionist' | 'sales' | 'admin' | 'housekeeping';

export interface AgentConfig {
  role: AgentRole;
  name: string;
  avatar: string;
  title: string;
  personality: string;
  description: string;
  color: string;
  accentColor: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  agentRole: AgentRole;
  content: string;
  timestamp: string;
}

export interface HotelState {
  currentHotelId: string;
  hotels: Hotel[];
  rooms: Room[];
  reservations: Reservation[];
  guests: Guest[];
  charges: POSCharge[];
  tickets: MaintenanceTicket[];
  channels: OTAChannel[];
  pricingPlans: PricingPlan[];
  messages: ChatMessage[];
}

export interface HousekeepingLog {
  id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  assignedStaff: string;
  completedAt: string;
  checklistCompleted: string[];
}

export interface MaintenanceLog {
  id: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  resolvedAt: string;
  assignedStaff: string;
  repairCost: number;
}

export interface StaffShift {
  id: string;
  hotelId: string;
  staffName: string;
  role: 'housekeeping' | 'maintenance';
  date: string; // YYYY-MM-DD format
  shiftType: 'Mañana (06:00 - 14:00)' | 'Tarde (14:00 - 22:00)' | 'Noche (22:00 - 06:00)';
  assignedNotes: string;
}

export interface CommunityPost {
  id: string;
  hotelId: string;
  hotelName: string;
  hotelType: string;
  category: 'announcement' | 'event' | 'help' | 'alliance' | 'general';
  title: string;
  content: string;
  likes: string[]; // List of hotelIds who liked this post
  commentsCount: number;
  createdAt: string; // ISO string
  authorName: string;
  authorRole: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  hotelId: string;
  hotelName: string;
  hotelType: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string; // ISO string
}


