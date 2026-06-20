import React, { useState, useEffect, useRef } from 'react';
import { 
  Hotel, Room, Reservation, Guest, MaintenanceTicket, 
  OTAChannel, PricingPlan, ChatMessage, AgentConfig, AgentRole, RoomStatus,
  HousekeepingLog, MaintenanceLog, StaffShift
} from './types';
import { 
  INITIAL_HOTELS, INITIAL_ROOMS, INITIAL_RESERVATIONS, 
  INITIAL_GUESTS, INITIAL_TICKETS, INITIAL_CHANNELS, INITIAL_PRICING_PLANS 
} from './initialData';
import MetricCards from './components/MetricCards';
import PMSGrid from './components/PMSGrid';
import BookingWebBuilder from './components/BookingWebBuilder';
import BIRevenuePro from './components/BIRevenuePro';
import SinergiaBlueprintHub from './components/SinergiaBlueprintHub';
import HotelConfigPanel from './components/HotelConfigPanel';
import SinergiaSaaSPanel from './components/SinergiaSaaSPanel';
import SinergiaCommunityPanel from './components/SinergiaCommunityPanel';
import { SinergiaLogo, SinergiaIcon } from './components/SinergiaIcon';
import { 
  seedCollectionIfEmpty, 
  saveCollectionBulk, 
  clearCollection 
} from './firebase';
import { 
  Building2, Sparkles, Wrench, Shield, CheckCircle, AlertOctagon, 
  DollarSign, Users, Globe, Home, Plane, Calendar, TrendingUp, 
  Send, RefreshCw, Sliders, MessageSquare, ChevronRight, Menu, Plus, Play, Info,
  LogOut, Key, Lock, Unlock, User, UserPlus, LogIn, Check, Settings
} from 'lucide-react';

const AGENT_PROFILES: Record<AgentRole, AgentConfig> = {
  receptionist: {
    role: 'receptionist',
    name: 'Sofía',
    avatar: '✨',
    title: 'Recepcionista Virtual',
    description: 'Atención premium a huéspedes, reservas y servicios internos de hospitalidad.',
    personality: 'Cálida, atenta y orientada a brindar la mejor hospitalidad.',
    color: 'bg-indigo-600',
    accentColor: 'indigo'
  },
  sales: {
    role: 'sales',
    name: 'Mateo',
    avatar: '🔥',
    title: 'Especialista en Upselling & Revenue',
    description: 'Estrategias para incrementar RevPAR, proponer cenas románticas, cabalgatas y pases de Spa.',
    personality: 'Carismático, persuasivo y enfocado en maximizar los márgenes del negocio.',
    color: 'bg-emerald-600',
    accentColor: 'emerald'
  },
  admin: {
    role: 'admin',
    name: 'Camila',
    avatar: '📊',
    title: 'Directora de Operaciones & Reportes',
    description: 'Análisis de tasas de ocupación, salud fiscal, cálculo de KPIs y optimización ejecutiva.',
    personality: 'Analítica, precisa y estructurada.',
    color: 'bg-amber-600',
    accentColor: 'amber'
  },
  housekeeping: {
    role: 'housekeeping',
    name: 'Lucas',
    avatar: '🔧',
    title: 'Supervisor de Operaciones y Aseo',
    description: 'Coordinación del personal de limpieza, inventario básico y resolución ágil de incidencias técnicas.',
    personality: 'Directo, operativo y resolutivo.',
    color: 'bg-rose-600',
    accentColor: 'rose'
  }
};

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'owner' | 'receptionist' | 'housekeeper';
  roleLabel: string;
  membershipPlan: string;
  membershipBadge: string;
  badgeBg: string;
  badgeTextColor: string;
  allowedTabs: string[];
  description: string;
  pin: string;
  pinHint: string;
  contractedHotelId?: string;
}

const USER_PROFILES: UserProfile[] = [
  {
    id: 'user-admin',
    name: 'Jose Gregorio Urdaneta Guadama',
    email: 'josegregoriourdanetaguadama@gmail.com',
    avatar: '👨‍💻',
    role: 'admin',
    roleLabel: 'Administrador Global SaaS / Desarrollador Root',
    membershipPlan: 'SaaS Global Enterprise Dev',
    membershipBadge: 'ROOT DEVELOPER',
    badgeBg: 'bg-indigo-950 border-indigo-700 text-amber-300',
    badgeTextColor: 'text-amber-300 border border-amber-400/30',
    allowedTabs: ['pms', 'channels', 'pricing', 'crm', 'booking', 'bi', 'blueprint'],
    description: 'Acceso total de super-administrador global: PMS, Canales, CRM y Base de datos en la nube síncrona.',
    pin: '9999',
    pinHint: 'PIN de Desarrollador / SysAdmin (por defecto 9999)',
    contractedHotelId: 'hotel-1'
  }
];

export default function App() {
  // Custom & Default Profiles State
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('sinergia_custom_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Guarantee email and contractedHotelId exist on all loaded profiles, override system admin with Jose
          return parsed.map((p: any) => {
            if (p.id === 'user-admin') {
              return {
                ...p,
                name: 'Jose Gregorio Urdaneta Guadama',
                email: 'josegregoriourdanetaguadama@gmail.com',
                pin: '9999',
                roleLabel: 'Administrador Global SaaS / Desarrollador Root',
                membershipPlan: 'SaaS Global Enterprise Dev',
                membershipBadge: 'ROOT DEVELOPER',
                allowedTabs: ['pms', 'channels', 'pricing', 'crm', 'booking', 'bi', 'blueprint']
              };
            }
            return {
              ...p,
              email: p.email || (
                p.role === 'admin' ? 'admin@sinergia.com' :
                p.role === 'owner' ? 'owner@sinergia.com' :
                p.role === 'receptionist' ? 'receptionist@sinergia.com' :
                'housekeeper@sinergia.com'
              ),
              contractedHotelId: p.contractedHotelId || (
                p.role === 'receptionist' ? 'hotel-2' :
                p.role === 'housekeeper' ? 'hotel-3' :
                'hotel-1'
              )
            };
          });
        }
      } catch (e) {
        // Fallback below
      }
    }
    return USER_PROFILES;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(true);

  // General ERP Database state with LocalStorage persistence to survive soft reloads
  const [hotels, setHotels] = useState<Hotel[]>(() => {
    const saved = localStorage.getItem('sinergia_hotels_data');
    return saved ? JSON.parse(saved) : INITIAL_HOTELS;
  });

  useEffect(() => {
    async function initFirestore() {
      try {
        const loadedHotels = await seedCollectionIfEmpty('hotels', INITIAL_HOTELS);
        setHotels(loadedHotels);

        const loadedRooms = await seedCollectionIfEmpty('rooms', INITIAL_ROOMS);
        setRooms(loadedRooms);

        let loadedReservations = await seedCollectionIfEmpty('reservations', INITIAL_RESERVATIONS);
        let loadedGuests = await seedCollectionIfEmpty('guests', INITIAL_GUESTS);
        let loadedTickets = await seedCollectionIfEmpty('tickets', INITIAL_TICKETS);
        
        const loadedChannels = await seedCollectionIfEmpty('channels', INITIAL_CHANNELS);
        setChannels(loadedChannels);

        const loadedPricingPlans = await seedCollectionIfEmpty('pricingPlans', INITIAL_PRICING_PLANS);
        setPricingPlans(loadedPricingPlans);

        let loadedHousekeeping = await seedCollectionIfEmpty('housekeepingLogs', housekeepingLogs);
        let loadedMaintenance = await seedCollectionIfEmpty('maintenanceLogs', maintenanceLogs);
        let loadedShifts = await seedCollectionIfEmpty('staffShifts', staffShifts);

        // Detect old legacy default simulation data and purge them completely to honor user's directive!
        const hasLegacyData = loadedReservations.some(r => ['res-1', 'res-2', 'res-3', 'res-4', 'res-5', 'res-6'].includes(r.id)) ||
                             loadedGuests.some(g => ['guest-1', 'guest-2', 'guest-3', 'guest-4', 'guest-5'].includes(g.id)) ||
                             loadedHousekeeping.some(h => ['hk-1', 'hk-2'].includes(h.id)) ||
                             loadedMaintenance.some(m => ['mtl-1', 'mtl-2'].includes(m.id));

        if (hasLegacyData) {
          console.log("Legacy simulation data detected! Purging to leave a clean production database.");
          const resIds = loadedReservations.map(r => r.id);
          const guestIds = loadedGuests.map(g => g.id);
          const ticketIds = loadedTickets.map(t => t.id);
          const hkIds = loadedHousekeeping.map(h => h.id);
          const mtIds = loadedMaintenance.map(m => m.id);
          const shiftIds = loadedShifts.map(s => s.id);

          await clearCollection('reservations', resIds);
          await clearCollection('guests', guestIds);
          await clearCollection('tickets', ticketIds);
          await clearCollection('housekeepingLogs', hkIds);
          await clearCollection('maintenanceLogs', mtIds);
          await clearCollection('staffShifts', shiftIds);

          loadedReservations = [];
          loadedGuests = [];
          loadedTickets = [];
          loadedHousekeeping = [];
          loadedMaintenance = [];
          loadedShifts = [];

          localStorage.setItem('sinergia_reservations', JSON.stringify([]));
          localStorage.setItem('sinergia_guests', JSON.stringify([]));
          localStorage.setItem('sinergia_tickets', JSON.stringify([]));
          localStorage.setItem('sinergia_housekeeping_logs', JSON.stringify([]));
          localStorage.setItem('sinergia_maintenance_logs', JSON.stringify([]));
          localStorage.setItem('sinergia_staff_shifts', JSON.stringify([]));
        }

        setReservations(loadedReservations);
        setGuests(loadedGuests);
        setTickets(loadedTickets);
        setHousekeepingLogs(loadedHousekeeping);
        setMaintenanceLogs(loadedMaintenance);
        setStaffShifts(loadedShifts);
      } catch (err) {
        console.error("Error setting up and loading secure Firestore database layers:", err);
      } finally {
        setIsFirebaseLoading(false);
      }
    }
    initFirestore();
  }, []);

  useEffect(() => {
    localStorage.setItem('sinergia_hotels_data', JSON.stringify(hotels));
    if (!isFirebaseLoading) {
      saveCollectionBulk('hotels', hotels);
    }
  }, [hotels, isFirebaseLoading]);
  const [activeUserProfile, setActiveUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('sinergia_user_profile');
    if (saved) {
      const savedProfiles = localStorage.getItem('sinergia_custom_profiles');
      try {
        const currentList = savedProfiles ? JSON.parse(savedProfiles) : USER_PROFILES;
        const parsed = currentList.find((u: any) => u.id === saved);
        if (parsed) {
          if (parsed.id === 'user-admin') {
            return {
              ...parsed,
              name: 'Jose Gregorio Urdaneta Guadama',
              email: 'josegregoriourdanetaguadama@gmail.com',
              pin: '9999',
              roleLabel: 'Administrador Global SaaS / Desarrollador Root',
              membershipPlan: 'SaaS Global Enterprise Dev',
              membershipBadge: 'ROOT DEVELOPER',
              allowedTabs: ['pms', 'channels', 'pricing', 'crm', 'booking', 'bi', 'blueprint']
            };
          }
          return {
            ...parsed,
            email: parsed.email || (
              parsed.role === 'admin' ? 'admin@sinergia.com' :
              parsed.role === 'owner' ? 'owner@sinergia.com' :
              parsed.role === 'receptionist' ? 'receptionist@sinergia.com' :
              'housekeeper@sinergia.com'
            ),
            contractedHotelId: parsed.contractedHotelId || (
              parsed.role === 'receptionist' ? 'hotel-2' :
              parsed.role === 'housekeeper' ? 'hotel-3' :
              'hotel-1'
            )
          };
        }
      } catch (e) {
        // Fallback
      }
    }
    return USER_PROFILES[0]; // Default to Jose Urdaneta for full access!
  });

  // Keep state synchronized with LocalStorage
  useEffect(() => {
    localStorage.setItem('sinergia_custom_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('sinergia_is_logged_in', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeUserProfile) {
      localStorage.setItem('sinergia_user_profile', activeUserProfile.id);
    }
  }, [activeUserProfile]);

  // Auth & Registration Gateway States
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  // Login states
  const [loginEmail, setLoginEmail] = useState<string>('josegregoriourdanetaguadama@gmail.com');
  const [loginPin, setLoginPin] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration states
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupRole, setSignupRole] = useState<'admin' | 'owner' | 'receptionist' | 'housekeeper'>('owner');
  const [signupPin, setSignupPin] = useState<string>('');
  const [signupAvatar, setSignupAvatar] = useState<string>('🕴️');
  const [signupSuccess, setSignupSuccess] = useState<boolean>(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupHotelId, setSignupHotelId] = useState<string>('hotel-1');

  const [currentHotelId, setCurrentHotelId] = useState<string>(() => {
    const saved = localStorage.getItem('sinergia_hotel_id');
    return saved && INITIAL_HOTELS.some(h => h.id === saved) ? saved : 'hotel-1';
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('sinergia_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('sinergia_reservations');
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    const saved = localStorage.getItem('sinergia_guests');
    return saved ? JSON.parse(saved) : INITIAL_GUESTS;
  });

  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => {
    const saved = localStorage.getItem('sinergia_tickets');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [channels, setChannels] = useState<OTAChannel[]>(() => {
    const saved = localStorage.getItem('sinergia_channels');
    return saved ? JSON.parse(saved) : INITIAL_CHANNELS;
  });

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(() => {
    const saved = localStorage.getItem('sinergia_pricing_plans');
    return saved ? JSON.parse(saved) : INITIAL_PRICING_PLANS;
  });

  const [housekeepingLogs, setHousekeepingLogs] = useState<HousekeepingLog[]>(() => {
    const saved = localStorage.getItem('sinergia_housekeeping_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem('sinergia_maintenance_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [staffShifts, setStaffShifts] = useState<StaffShift[]>(() => {
    const saved = localStorage.getItem('sinergia_staff_shifts');
    return saved ? JSON.parse(saved) : [];
  });

  const [newShiftStaffName, setNewShiftStaffName] = useState('Yolanda García');
  const [newShiftRole, setNewShiftRole] = useState<'housekeeping' | 'maintenance'>('housekeeping');
  const [newShiftDate, setNewShiftDate] = useState('2026-06-19');
  const [newShiftType, setNewShiftType] = useState<'Mañana (06:00 - 14:00)' | 'Tarde (14:00 - 22:00)' | 'Noche (22:00 - 06:00)'>('Mañana (06:00 - 14:00)');
  const [newShiftNotes, setNewShiftNotes] = useState('');
  const [selectedCalendarDateFilter, setSelectedCalendarDateFilter] = useState('2026-06-19');

  // UI state
  const [activeTab, setActiveTab] = useState<'pms' | 'channels' | 'pricing' | 'crm' | 'booking' | 'bi' | 'blueprint' | 'config' | 'saas' | 'community'>('pms');
  const [activeAgent, setActiveAgent] = useState<AgentRole>('receptionist');
  const [chatInput, setChatInput] = useState('');
  
  // Custom Dynamic Booking & Web Builder States
  const [bookingThemeColor, setBookingThemeColor] = useState<'indigo' | 'emerald' | 'violet' | 'amber' | 'slate'>('indigo');
  const [bookingTitle, setBookingTitle] = useState('Portal Oficial de Reservas Directas');
  const [bookingIntro, setBookingIntro] = useState('Garantía de mejor tarifa disponible online. Sin cargos de intermediación ni comisiones de agencias externas.');
  const [bookingEnablePayments, setBookingEnablePayments] = useState(true);
  const [guestBookRoomId, setGuestBookRoomId] = useState('');
  const [guestBookName, setGuestBookName] = useState('');
  const [guestBookEmail, setGuestBookEmail] = useState('');
  const [guestBookNights, setGuestBookNights] = useState(2);
  const [guestBookCheckin, setGuestBookCheckin] = useState('2026-06-20');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // BI & Revenue Pro Simulator States
  const [biOccupancyTarget, setBiOccupancyTarget] = useState(75);
  const [biRoomRateModifier, setBiRoomRateModifier] = useState(100);
  const [biSimulateResults, setBiSimulateResults] = useState<{
    totalRevenue: number;
    revPar: number;
    adr: number;
    isHealthy: boolean;
    suggestion: string;
  } | null>(null);
  // Interactive Operational States (Housekeeping and Maintenance check-offs)
  const [selectedConfigChannelId, setSelectedConfigChannelId] = useState<string | null>(null);
  const [channelApiKeyInput, setChannelApiKeyInput] = useState('');
  const [channelPropertyIdInput, setChannelPropertyIdInput] = useState('');
  const [channelApiUrlInput, setChannelApiUrlInput] = useState('');
  const [channelWebhookUrlInput, setChannelWebhookUrlInput] = useState('');
  const [isTestingChannelApi, setIsTestingChannelApi] = useState(false);
  const [channelApiLogs, setChannelApiLogs] = useState<string[]>([]);

  const [selectedCleaningRoom, setSelectedCleaningRoom] = useState<Room | null>(null);
  const [cleaningStaffSelected, setCleaningStaffSelected] = useState<string>('Yolanda García');
  const [cleaningChecklist, setCleaningChecklist] = useState<Record<string, boolean>>({
    'Baño desinfectado': false,
    'Sábanas cambiadas': false,
    'Amenities repuestos': false,
    'Minibar verificado': false,
    'Aspirado completado': false
  });

  const [selectedResolveTicket, setSelectedResolveTicket] = useState<MaintenanceTicket | null>(null);
  const [maintenanceStaffSelected, setMaintenanceStaffSelected] = useState<string>('Carlos Gómez (Soporte Interno)');
  const [maintenanceRepairCost, setMaintenanceRepairCost] = useState<number>(35);

  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('sinergia_chat');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'msg-welcome',
        sender: 'agent',
        agentRole: 'receptionist',
        content: '¡Hola! Le saluda Sofía de Recepción Sinergia IA. He cargado exitosamente los datos de su propiedad en el ERP. Estoy lista para asistirle con reservas, consultar disponibilidad o asesorarle con el check-in.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Security Verification states
  const [profileToVerify, setProfileToVerify] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showDemoPins, setShowDemoPins] = useState(false);

  // CRM Additional Interactive States
  const [crmSearch, setCrmSearch] = useState('');
  const [crmTierFilter, setCrmTierFilter] = useState<'all' | 'Platinum' | 'Gold' | 'Silver' | 'Classic'>('all');
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [newCRMName, setNewCRMName] = useState('');
  const [newCRMEmail, setNewCRMEmail] = useState('');
  const [newCRMPhone, setNewCRMPhone] = useState('');
  const [newCRMTier, setNewCRMTier] = useState<'Platinum' | 'Gold' | 'Silver' | 'Classic'>('Classic');
  const [newCRMPreference, setNewCRMPreference] = useState('');
  const [newCRMPreferencesList, setNewCRMPreferencesList] = useState<string[]>([]);
  
  // Pricing Strategy Interactive States
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanMultiplier, setNewPlanMultiplier] = useState(1.10);
  const [newPlanDescription, setNewPlanDescription] = useState('');

  // OTA Channel Interactive States
  const [isOTASyncing, setIsOTASyncing] = useState(false);

  // Sync state to local storage and Firestore database
  useEffect(() => {
    localStorage.setItem('sinergia_hotel_id', currentHotelId);
  }, [currentHotelId]);

  useEffect(() => {
    localStorage.setItem('sinergia_rooms', JSON.stringify(rooms));
    if (!isFirebaseLoading) {
      saveCollectionBulk('rooms', rooms);
    }
  }, [rooms, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sinergia_reservations', JSON.stringify(reservations));
    if (!isFirebaseLoading) {
      saveCollectionBulk('reservations', reservations);
    }
  }, [reservations, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sinergia_guests', JSON.stringify(guests));
    if (!isFirebaseLoading) {
      saveCollectionBulk('guests', guests);
    }
  }, [guests, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sinergia_tickets', JSON.stringify(tickets));
    if (!isFirebaseLoading) {
      saveCollectionBulk('tickets', tickets);
    }
  }, [tickets, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sinergia_channels', JSON.stringify(channels));
    if (!isFirebaseLoading) {
      saveCollectionBulk('channels', channels);
    }
  }, [channels, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sinergia_pricing_plans', JSON.stringify(pricingPlans));
    if (!isFirebaseLoading) {
      saveCollectionBulk('pricingPlans', pricingPlans);
    }
  }, [pricingPlans, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sinergia_housekeeping_logs', JSON.stringify(housekeepingLogs));
    if (!isFirebaseLoading) {
      saveCollectionBulk('housekeepingLogs', housekeepingLogs);
    }
  }, [housekeepingLogs, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sinergia_maintenance_logs', JSON.stringify(maintenanceLogs));
    if (!isFirebaseLoading) {
      saveCollectionBulk('maintenanceLogs', maintenanceLogs);
    }
  }, [maintenanceLogs, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sinergia_staff_shifts', JSON.stringify(staffShifts));
    if (!isFirebaseLoading) {
      saveCollectionBulk('staffShifts', staffShifts);
    }
  }, [staffShifts, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sinergia_chat', JSON.stringify(chatHistory));
    if (!isFirebaseLoading) {
      saveCollectionBulk('messages', chatHistory);
    }
  }, [chatHistory, isFirebaseLoading]);

  useEffect(() => {
    localStorage.setItem('sinergia_user_profile', activeUserProfile.id);
    if (!isFirebaseLoading) {
      saveCollectionBulk('profiles', [activeUserProfile]);
    }
    if (activeUserProfile && activeUserProfile.contractedHotelId) {
      setCurrentHotelId(activeUserProfile.contractedHotelId);
    }
  }, [activeUserProfile, isFirebaseLoading]);


  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  // Helper: Get active hotel object
  const activeHotel = hotels.find(h => h.id === currentHotelId) || hotels[0];

  // Helper: Active rate plan multiplier
  const activePlan = pricingPlans.find(p => p.isActive) || pricingPlans[0];

  // Event Handlers for child actions
  const handleUpdateRoomStatus = (roomId: string, status: RoomStatus) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
  };

  const handleAddReservation = (res: Reservation) => {
    setReservations(prev => [res, ...prev]);
    // Sincronizar el estado de la habitación correspondiente a ocupada ('occupied')
    setRooms(prev => prev.map(r => r.id === res.roomId ? { ...r, status: 'occupied' as const } : r));
  };

  const handleUpdateReservationStatus = (resId: string, status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled') => {
    setReservations(prev => prev.map(res => {
      if (res.id === resId) {
        return {
          ...res,
          status,
          // Clear balance on checked out to simulate instant invoice settlement
          outstandingBalance: status === 'checked_out' ? 0 : res.outstandingBalance
        };
      }
      return res;
    }));
  };

  const handleAddTicket = (ticket: MaintenanceTicket) => {
    setTickets(prev => [ticket, ...prev]);
  };

  const handleResolveTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
  };

  const handleCompleteHousekeeping = () => {
    if (!selectedCleaningRoom) return;
    const completedItems = Object.keys(cleaningChecklist).filter(k => cleaningChecklist[k]);
    const newLog: HousekeepingLog = {
      id: 'hk-' + Date.now(),
      hotelId: currentHotelId,
      roomId: selectedCleaningRoom.id,
      roomNumber: selectedCleaningRoom.number,
      assignedStaff: cleaningStaffSelected,
      completedAt: new Date().toISOString(),
      checklistCompleted: completedItems
    };
    setHousekeepingLogs(prev => [newLog, ...prev]);
    handleUpdateRoomStatus(selectedCleaningRoom.id, 'available');
    setSelectedCleaningRoom(null);
    setCleaningChecklist({
      'Baño desinfectado': false,
      'Sábanas cambiadas': false,
      'Amenities repuestos': false,
      'Minibar verificado': false,
      'Aspirado completado': false
    });
  };

  const handleResolveMaintenanceWithAudit = () => {
    if (!selectedResolveTicket) return;
    const associatedRoom = rooms.find(r => r.id === selectedResolveTicket.roomId);
    const newLog: MaintenanceLog = {
      id: 'mtl-' + Date.now(),
      hotelId: currentHotelId,
      roomId: selectedResolveTicket.roomId,
      roomNumber: associatedRoom?.number || 'N/A',
      description: selectedResolveTicket.description,
      priority: selectedResolveTicket.priority,
      resolvedAt: new Date().toISOString(),
      assignedStaff: maintenanceStaffSelected,
      repairCost: maintenanceRepairCost
    };
    setMaintenanceLogs(prev => [newLog, ...prev]);
    handleResolveTicket(selectedResolveTicket.id);
    handleUpdateRoomStatus(selectedResolveTicket.roomId, 'cleaning');
    setSelectedResolveTicket(null);
    setMaintenanceRepairCost(35);
  };

  const handleAddStaffShift = (e: React.FormEvent) => {
    e.preventDefault();
    const newShift: StaffShift = {
      id: `sh-${Date.now()}`,
      hotelId: currentHotelId,
      staffName: newShiftStaffName,
      role: newShiftRole,
      date: newShiftDate,
      shiftType: newShiftType,
      assignedNotes: newShiftNotes.trim() || 'Alineación de labores ordinarias'
    };
    setStaffShifts(prev => [newShift, ...prev]);
    setNewShiftNotes('');
  };

  const handleDeleteStaffShift = (shiftId: string) => {
    setStaffShifts(prev => prev.filter(s => s.id !== shiftId));
  };

  const handleAddRoom = (room: Room) => {
    setRooms(prev => [...prev, room]);
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const handleAddGuest = (guest: Guest) => {
    setGuests(prev => [guest, ...prev]);
  };

  // Channel Manager Helpers
  const handleToggleChannelStatus = (channelId: string) => {
    setChannels(prev => prev.map(c => {
      if (c.id === channelId) {
        const nextStatus = c.status === 'connected' ? 'disconnected' as const : 'connected' as const;
        return {
          ...c,
          status: nextStatus,
          lastSync: nextStatus === 'connected' ? 'Sincronizado ahora' : 'Desconectado'
        };
      }
      return c;
    }));
  };

  const handleUpdateChannelMultiplier = (channelId: string, val: number) => {
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, rateSyncMultiplier: Number(val.toFixed(2)) } : c));
  };

  const handleOpenChannelConfig = (chan: OTAChannel) => {
    setSelectedConfigChannelId(chan.id);
    setChannelApiKeyInput(chan.apiKey || '');
    setChannelPropertyIdInput(chan.propertyId || '');
    setChannelApiUrlInput(chan.apiUrl || '');
    setChannelWebhookUrlInput(chan.webhookUrl || `https://sync.sinergia.com/webhooks/${chan.id}`);
    setChannelApiLogs([]);
    setIsTestingChannelApi(false);
  };

  const handleSaveChannelConfig = (channelId: string) => {
    setChannels(prev => prev.map(c => {
      if (c.id === channelId) {
        return {
          ...c,
          apiKey: channelApiKeyInput,
          propertyId: channelPropertyIdInput,
          apiUrl: channelApiUrlInput,
          webhookUrl: channelWebhookUrlInput,
          status: 'connected' as const,
          lastSync: 'Configurado y guardado ahora'
        };
      }
      return c;
    }));
    setSelectedConfigChannelId(null);
  };

  const handleTestChannelConnection = (channelId: string) => {
    if (!channelApiKeyInput || !channelPropertyIdInput || !channelApiUrlInput) {
      setChannelApiLogs(["[ERROR] Todos los campos de credenciales de API son obligatorios para establecer conexión real."]);
      return;
    }
    setIsTestingChannelApi(true);
    setChannelApiLogs(["[HANDSHAKE] Iniciando Handshake seguro con el Endpoint del respectivo Canal..."]);
    
    setTimeout(() => {
      setChannelApiLogs(prev => [
        ...prev,
        `[HTTPS] GET Request lanzado a: ${channelApiUrlInput}`,
        `[HEADERS] Authorization: Bearer ${channelApiKeyInput.slice(0, 5)}***...`,
        `[HEADERS] Client-Property-ID: ${channelPropertyIdInput}`
      ]);
    }, 400);

    setTimeout(() => {
      setChannelApiLogs(prev => [
        ...prev,
        `[STATUS] Conectándose a los servidores DNS del canal...`,
        `[STATUS] Conexión SSL/TLS de 256 bits negociada con éxito.`
      ]);
    }, 850);

    setTimeout(() => {
      setChannelApiLogs(prev => [
        ...prev,
        `[OK] HTTP/1.1 200 OK - Autorización aprobada por el servidor de la OTA.`,
        `[SYNC] Sincronización de tarifas Sinergia Sync establecida. Multiplicador activo aplicado.`,
        `[WEBHOOK] Webhook registrado en el canal externo: Envío de payloads a ${channelWebhookUrlInput}`,
        `[SUCCESS] ¡CANAL TOTALMENTE VINCULADO, OPERACIONAL Y FUNCIONANDO EN PRODUCCIÓN SEGURO!`
      ]);
      setChannels(prev => {
        const next = prev.map(c => {
          if (c.id === channelId) {
            return {
              ...c,
              status: 'connected' as const,
              lastSync: 'Sincronizado vía API hoy',
              apiKey: channelApiKeyInput,
              propertyId: channelPropertyIdInput,
              apiUrl: channelApiUrlInput,
              webhookUrl: channelWebhookUrlInput
            };
          }
          return c;
        });
        localStorage.setItem('sinergia_channels', JSON.stringify(next));
        return next;
      });
      setIsTestingChannelApi(false);
    }, 1500);
  };

  // Pricing plans helpers
  const handleClearDemoData = async () => {
    // Purge active ledgers & simulated data
    const resIds = reservations.map(r => r.id);
    const guestIds = guests.map(g => g.id);
    const ticketIds = tickets.map(t => t.id);
    const hkIds = housekeepingLogs.map(h => h.id);
    const mtIds = maintenanceLogs.map(m => m.id);
    const shiftIds = staffShifts.map(s => s.id);
    const chatIds = chatHistory.map(m => m.id);

    setReservations([]);
    setGuests([]);
    setTickets([]);
    setHousekeepingLogs([]);
    setMaintenanceLogs([]);
    setStaffShifts([]);
    
    // Clear chat simulation except for Sofia's welcome
    const freshChat: ChatMessage[] = [
      {
        id: 'msg-welcome',
        sender: 'agent',
        agentRole: 'receptionist',
        content: '¡Hola! Le saluda Sofía de Recepción Sinergia IA. He purgado exitosamente todos los datos de demostración anteriores. El sistema ERP está limpio y listo en un 100% para recibir sus primeras reservas directas y registros reales.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setChatHistory(freshChat);

    // Save empty states directly to localStorage
    localStorage.setItem('sinergia_reservations', JSON.stringify([]));
    localStorage.setItem('sinergia_guests', JSON.stringify([]));
    localStorage.setItem('sinergia_tickets', JSON.stringify([]));
    localStorage.setItem('sinergia_housekeeping_logs', JSON.stringify([]));
    localStorage.setItem('sinergia_maintenance_logs', JSON.stringify([]));
    localStorage.setItem('sinergia_staff_shifts', JSON.stringify([]));
    localStorage.setItem('sinergia_chat', JSON.stringify(freshChat));

    // Async clear on FireStore database
    try {
      await clearCollection('reservations', resIds);
      await clearCollection('guests', guestIds);
      await clearCollection('tickets', ticketIds);
      await clearCollection('housekeepingLogs', hkIds);
      await clearCollection('maintenanceLogs', mtIds);
      await clearCollection('staffShifts', shiftIds);
      await clearCollection('messages', chatIds);
      // Re-seed chat with the empty/welcome message
      await saveCollectionBulk('messages', freshChat);
    } catch (e) {
      console.error("Error purging cloud collections:", e);
    }

    alert('¡Limpieza completada! Se han eliminado todos los datos de demostración de manera segura. El PMS, CRM y Mantenimiento ahora están listos para producción.');
  };

  const handleSelectPricingPlan = (planId: string) => {
    setPricingPlans(prev => prev.map(p => ({
      ...p,
      isActive: p.id === planId
    })));
  };

  // Custom interactive triggers
  const handleAddNewPricingPlan = (name: string, multiplier: number, description: string) => {
    const newPlan: PricingPlan = {
      id: `plan-${Date.now()}`,
      name,
      multiplier: Number(multiplier),
      description,
      isActive: false
    };
    setPricingPlans(prev => [...prev, newPlan]);
  };

  const handleAddNewCRMGuest = (name: string, email: string, phone: string, loyaltyTier: 'Platinum' | 'Gold' | 'Silver' | 'Classic', preferences: string[]) => {
    const newG: Guest = {
      id: `guest-${Date.now()}`,
      name,
      email,
      phone,
      loyaltyTier,
      totalSpent: 0,
      reservationsCount: 0,
      preferences: preferences.length > 0 ? preferences : ['Registro manual CRM']
    };
    setGuests(prev => [newG, ...prev]);
  };

  const handleForceOTASync = () => {
    setIsOTASyncing(true);
    setChannels(prev => prev.map(c => c.status === 'connected' ? { ...c, status: 'syncing' } : c));
    
    setTimeout(() => {
      setChannels(prev => prev.map(c => {
        if (c.status === 'syncing') {
          return {
            ...c,
            status: 'connected',
            lastSync: 'Sincronizado hace un instante'
          };
        }
        return c;
      }));
      setIsOTASyncing(false);
    }, 1500);
  };

  // Chat message sending to multi-agent API
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessageText = chatInput;
    setChatInput('');

    const userMsg: ChatMessage = {
      id: `m-usr-${Date.now()}`,
      sender: 'user',
      agentRole: activeAgent,
      content: userMessageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const activeHotelRooms = rooms.filter(r => r.hotelId === currentHotelId);
      const activeHotelReservations = reservations.filter(res => res.hotelId === currentHotelId);
      
      const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessageText,
          agent: activeAgent,
          hotelStateContext: {
            activeHotel,
            rooms: activeHotelRooms,
            reservations: activeHotelReservations,
            guests,
            tickets: tickets.filter(t => t.hotelId === currentHotelId),
            channels,
            activePlan
          },
          history: chatHistory.length > 0 ? chatHistory : []
        })
      });

      if (!response.ok) {
        throw new Error('La respuesta del servidor no fue exitosa.');
      }

      const data = await response.json();
      
      const agentMsg: ChatMessage = {
        id: `m-agt-${Date.now()}`,
        sender: 'agent',
        agentRole: activeAgent,
        content: data.text || 'Entendido. He procesado la solicitud.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, agentMsg]);
    } catch (error) {
      console.error('Error al consultar agente:', error);
      const errorMsg: ChatMessage = {
        id: `m-err-${Date.now()}`,
        sender: 'agent',
        agentRole: activeAgent,
        content: 'Disculpe, en el momento experimento una latencia en la pasarela inteligente de Google Gemini. Verifique si dispone de su API Key en la sección de Secrets o repitamos la consulta operativa.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Switch agent and post welcome text
  const handleAgentChange = (role: AgentRole) => {
    setActiveAgent(role);
    const profile = AGENT_PROFILES[role];
    let welcomeTxt = '';
    
    if (role === 'receptionist') {
      welcomeTxt = 'Hola, le habla Sofía. ¿En qué puedo apoyarle hoy con los check-ins, estado de habitaciones disponibles o servicios adicionales de hospitalidad?';
    } else if (role === 'sales') {
      welcomeTxt = '¡Saludos de negocios! Soy Mateo, del área comercial. Me encargo de potenciar el RevPAR, programar tarifas promocionales y diseñar paquetes de upselling premium para los turistas.';
    } else if (role === 'admin') {
      welcomeTxt = 'Estimado gerente, le saluda Camila de Administración. Estoy lista para proveer reportes analíticos consolidados de ocupación, salud fiscal ordinaria e impacto de tarifas en tiempo real.';
    } else if (role === 'housekeeping') {
      welcomeTxt = 'Lucas reportándose desde operaciones. ¿Asignamos turnos de aseo exprés para las habitaciones sucias o coordinamos reparaciones urgentes con plomería y herrajes?';
    }

    const switchMsg: ChatMessage = {
      id: `m-sw-${Date.now()}`,
      sender: 'agent',
      agentRole: role,
      content: welcomeTxt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, switchMsg]);
  };

  // Clear chat logs
  const handleClearChat = () => {
    const profile = AGENT_PROFILES[activeAgent];
    setChatHistory([
      {
        id: `m-init-${Date.now()}`,
        sender: 'agent',
        agentRole: activeAgent,
        content: `Historial reiniciado. Hola, le escribe ${profile.name}, su asesora de IA especializada en rol: ${profile.title}. ¿Con qué indicador operativo o tarea iniciamos hoy?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Formatted room rate calculation based on active pricing plan multiplier
  const getModifiedRate = (baseRate: number) => {
    return Math.round(baseRate * activePlan.multiplier);
  };

  // Apply pricing plan multiplier to list of rooms dynamically for rendering
  const modifiedRooms = rooms.map(room => ({
    ...room,
    ratePerNight: getModifiedRate(room.ratePerNight)
  }));

  // Calculate generic property metrics
  const activeHotelRooms = rooms.filter(r => r.hotelId === currentHotelId);
  const totalOccupied = activeHotelRooms.filter(r => r.status === 'occupied').length;
  const occupancyPercentage = activeHotelRooms.length > 0 
    ? Math.round((totalOccupied / activeHotelRooms.length) * 100) 
    : 0;

  // Sign In / Registration Handles
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    const targetProfile = profiles.find(p => p.email.toLowerCase() === cleanEmail);
    if (!targetProfile) {
      setLoginError('No se encontró ningún usuario registrado con este correo electrónico.');
      return;
    }
    if (loginPin === targetProfile.pin) {
      setActiveUserProfile(targetProfile);
      // Auto switch active tab if not allowed
      if (!targetProfile.allowedTabs.includes(activeTab)) {
        setActiveTab(targetProfile.allowedTabs[0] as any);
      }
      setIsLoggedIn(true);
      setLoginPin('');
      setLoginError(null);
    } else {
      setLoginError('Código PIN inválido de acceso.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) {
      setSignupError('Por favor, introduzca su nombre completo.');
      return;
    }
    const cleanEmail = signupEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setSignupError('Por favor, introduzca un correo electrónico válido (debe contener @).');
      return;
    }
    if (profiles.some(p => p.email.toLowerCase() === cleanEmail)) {
      setSignupError('Esta dirección de correo electrónico ya está registrada.');
      return;
    }
    if (signupPin.length !== 4 || !/^\d+$/.test(signupPin)) {
      setSignupError('El código PIN debe ser exactamente de 4 dígitos numéricos.');
      return;
    }

    const newId = `user-custom-${Date.now()}`;
    
    // Choose dynamic variables based on selected role
    let roleLabel = '';
    let membershipPlan = '';
    let membershipBadge = '';
    let badgeBg = '';
    let badgeTextColor = '';
    let allowedTabs: string[] = [];
    let description = '';

    if (signupRole === 'admin') {
      roleLabel = 'Desarrollador SaaS Root / SysAdmin';
      membershipPlan = 'SaaS Global Enterprise Dev';
      membershipBadge = 'ROOT DEVELOPER';
      badgeBg = 'bg-slate-900 border-indigo-700 text-amber-300';
      badgeTextColor = 'text-amber-300 border-amber-400/30';
      allowedTabs = ['pms', 'channels', 'pricing', 'crm', 'booking', 'bi', 'blueprint'];
      description = 'Acceso total a logs de servidores, esquema Postgres y telemetría global.';
    } else if (signupRole === 'owner') {
      roleLabel = 'Dueño de Franquicia Hoteles / CEO';
      membershipPlan = 'Sinergia Enterprise Unlimited';
      membershipBadge = 'MEMBRESÍA PLATINUM';
      badgeBg = 'bg-amber-100 border-amber-300 text-amber-850';
      badgeTextColor = 'text-amber-800 border-amber-400';
      allowedTabs = ['pms', 'channels', 'pricing', 'crm', 'booking', 'bi', 'blueprint'];
      description = 'Acceso analítico profundo de ingresos, análisis BI de Revenue, configuración de canales y control total.';
    } else if (signupRole === 'receptionist') {
      roleLabel = 'Recepcionista Jefe';
      membershipPlan = 'Sinergia Standard PMS';
      membershipBadge = 'MEMBRESÍA GOLD';
      badgeBg = 'bg-slate-100 border-slate-300 text-slate-700';
      badgeTextColor = 'text-slate-700 border-slate-300';
      allowedTabs = ['pms', 'crm', 'booking'];
      description = 'Acceso optimizado para control de huéspedes, calendario PMS Gantt y check-in/out directo.';
    } else {
      roleLabel = 'Supervisor de Operaciones & Aseo';
      membershipPlan = 'Sinergia Essential Ops';
      membershipBadge = 'MEMBRESÍA BRONZE';
      badgeBg = 'bg-orange-50 border-orange-205 text-orange-850';
      badgeTextColor = 'text-orange-850 border-orange-200';
      allowedTabs = ['pms'];
      description = 'Acceso directo a listas de tareas de limpieza, checklists táctiles y reportes de mantenimiento.';
    }

    const newProfile: UserProfile = {
      id: newId,
      name: `${signupName.trim()} (${signupRole === 'admin' ? 'Root' : signupRole === 'owner' ? 'Socio' : signupRole === 'receptionist' ? 'Recepción' : 'Operaciones'})`,
      email: cleanEmail,
      avatar: signupAvatar,
      role: signupRole,
      roleLabel,
      membershipPlan,
      membershipBadge,
      badgeBg,
      badgeTextColor,
      allowedTabs,
      description,
      pin: signupPin,
      pinHint: `PIN de ${signupName.trim()}`,
      contractedHotelId: signupHotelId
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    setActiveUserProfile(newProfile);
    setIsLoggedIn(true);

    // Swap tab to their allowed primary dashboard tab!
    setActiveTab(allowedTabs[0] as any);

    // Seed welcoming agent chat msg!
    setChatHistory([
      {
        id: `msg-welcome-reg-${Date.now()}`,
        sender: 'agent',
        agentRole: 'ops',
        content: `¡Bienvenido a Sinergia IA, ${signupName.trim()}! He validado su Membresía: ${membershipBadge} (${membershipPlan}) de manera exitosa con el correo electrónico **${cleanEmail}**. He activado su cuenta y le he redirigido directamente a su tablero correspondiente: **${allowedTabs[0].toUpperCase()}**. ¿En qué puedo asistirle el día de hoy?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Reset signup inputs
    setSignupName('');
    setSignupEmail('');
    setSignupPin('');
    setSignupError(null);
  };

  if (isFirebaseLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans antialiased text-slate-300 p-4 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none animate-pulse"></div>
        <div className="space-y-6 text-center z-10 flex flex-col items-center">
          <SinergiaLogo isDark={true} showSubtitle={true} className="flex items-center gap-2.5 text-2xl font-black text-white tracking-tight" />
          
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="w-9 h-9 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase mt-4">Sinergia Cloud Storage Sync</p>
            <p className="text-[10px] text-slate-400 max-w-sm mt-1 leading-relaxed text-center">
              Cargando registros PMS síncronos, canales OTA, calibraciones de tarifa dinámica y bitácoras operativas desde la base de datos real en la nube...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    const activeSelectedProfile = profiles.find(p => p.email.toLowerCase() === loginEmail.trim().toLowerCase()) || profiles.find(p => p.role === 'owner') || profiles[0];;

    const logoMark = (
      <div className="mb-6">
        <SinergiaLogo isDark={true} />
        <span className="text-[8px] text-slate-400 font-mono tracking-widest uppercase block mt-1">PORTAL SAAS DE HOSPITALIDAD</span>
      </div>
    );

    return (
      <div id="sinergia-auth-gateway" className="min-h-screen bg-slate-950 flex items-center justify-center font-sans antialiased selection:bg-indigo-600 selection:text-white p-4 md:p-8 relative overflow-hidden text-slate-300">
        {/* Ambient Glowing Background */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-rose-900/10 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>

        <div className="max-w-5xl w-full bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md grid grid-cols-1 md:grid-cols-12 min-h-[620px] relative z-10">
          {/* Left Panel: Information & Value proposition (Visible on layout) */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 p-6 md:p-10 border-r border-slate-800 flex flex-col justify-between text-left relative">
            <div>
              {logoMark}
              <h2 className="text-2xl font-black text-white tracking-tight leading-snug mt-6">
                Gestión Inteligente de Propiedades
              </h2>
              <p className="text-slate-300 text-xs mt-3 leading-relaxed">
                Una suite ERP hospitality impulsada por agentes de inteligencia artificial y control analítico de múltiples sedes.
              </p>

              <div className="space-y-4 shadow-none mt-8">
                {/* 1 */}
                <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-800/80">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    ✨
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Multi-Agentes de IA Activos</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Simulación inteligente de roles operativos, marketing, BI y finanzas en tiempo real.</p>
                  </div>
                </div>

                {/* 2 */}
                <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-800/80">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    🏢
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Gantt PMS & Tarifas</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Control de tarifas dinámicas automáticas según ocupación y planes tarifarios.</p>
                  </div>
                </div>

                {/* 3 */}
                <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-2xl border border-slate-800/80">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    👥
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Membresías Basadas en Rol</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Acceda exclusivamente de manera automática al tablero operativo que requiera su suscripción.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-6 md:mt-0 flex items-center justify-between">
              <span className="text-[10px] font-mono text-indigo-400 font-bold tracking-widest uppercase">
                ⚙️ CONEXIÓN SECUENCIA ERP
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
            </div>
          </div>

          {/* Right Panel: Interactive Form */}
          <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-between text-left">
            <div>
              {/* Tabs selector */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-8 max-w-sm">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login');
                    setLoginError(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authTab === 'login'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🚪 Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('register');
                    setSignupError(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authTab === 'register'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📝 Crear Cuenta
                </button>
              </div>

              {/* VIEW: LOGIN TAB */}
              {authTab === 'login' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">Regresar al Espacio de Trabajo</h3>
                    <p className="text-slate-400 text-xs mt-1">Ingrese su correo electrónico registrado y su PIN de seguridad de 4 dígitos.</p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-2">
                      <span>⚠️</span> {loginError}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    {/* Email Input */}
                    <div className="space-y-2">
                      <label htmlFor="login-email-gateway" className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 block">
                        Correo Electrónico de Usuario
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          ✉️
                        </span>
                        <input
                          id="login-email-gateway"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => {
                            setLoginEmail(e.target.value);
                            setLoginError(null);
                          }}
                          placeholder="ejemplo@sinergia.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-650"
                          required
                        />
                      </div>
                    </div>

                    {/* PIN Entry Area */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="login-pin-gateway" className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                          PIN de Seguridad de 4 Dígitos
                        </label>
                        <span className="text-[9px] text-slate-500 font-mono">
                          PIN del Correo: <span className="font-bold text-slate-300">{activeSelectedProfile?.pin}</span>
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          🔑
                        </span>
                        <input
                          id="login-pin-gateway"
                          type="password"
                          maxLength={4}
                          value={loginPin}
                          onChange={(e) => {
                            setLoginPin(e.target.value.replace(/\D/g, ''));
                            setLoginError(null);
                          }}
                          placeholder="Digite su PIN (ej. 1234)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-white tracking-widest focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-650"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-extrabold uppercase py-3.5 rounded-xl hover:shadow-lg hover:shadow-indigo-650/15 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
                    >
                      🔓 AUTORIZAR E INGRESAR AL ERP
                    </button>

                    {/* QUICK DIRECT BYPASS CONTROLS (DAME ACCESO) */}
                    <div className="bg-slate-950/80 border border-indigo-500/20 rounded-2xl p-3.5 space-y-2.5 text-center shadow-inner mt-4">
                      <span className="text-[10px] font-mono font-extrabold uppercase text-indigo-400 tracking-wider block">
                        ⚡ Entrada Directa de Un Solo Clic (Desarrollador)
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const rootProfile = profiles.find(p => p.role === 'admin') || profiles[0];
                            setActiveUserProfile(rootProfile);
                            if (!rootProfile.allowedTabs.includes(activeTab)) {
                              setActiveTab(rootProfile.allowedTabs[0] as any);
                            }
                            setIsLoggedIn(true);
                          }}
                          className="bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-sans text-[11px] font-black py-2.5 px-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          👨‍💻 SaaS Root Dev (Full Options)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const ownerProfile = profiles.find(p => p.role === 'owner') || profiles[1];
                            setActiveUserProfile(ownerProfile);
                            if (!ownerProfile.allowedTabs.includes(activeTab)) {
                              setActiveTab(ownerProfile.allowedTabs[0] as any);
                            }
                            setIsLoggedIn(true);
                          }}
                          className="bg-linear-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-sans text-[11px] font-black py-2.5 px-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          🕴️ Gerente CEO (Platinum)
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono leading-relaxed">
                        Accede de forma automática con privilegios totales con un solo clic.
                      </p>
                    </div>

                    {/* Collapsible Demo Accounts Guide */}
                    <details className="text-left bg-slate-950/60 border border-slate-800 rounded-xl p-3 mt-4 group transition-all">
                      <summary className="text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer select-none flex items-center gap-1.5 focus:outline-hidden">
                        <span>💡</span> Ver correos y PINs de prueba (Demos)
                      </summary>
                      <div className="mt-2.5 space-y-2 border-t border-slate-800/60 pt-2 text-[10px] text-slate-400 font-mono">
                        {profiles.map(p => (
                          <div key={p.id} className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/40">
                            <div>
                              <span className="text-white font-bold">{p.avatar} {p.name.split(' (')[0]}</span>
                              <span className="block text-[9px] text-slate-500">{p.email}</span>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setLoginEmail(p.email);
                                  setLoginError(null);
                                }}
                                className="px-2 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white font-bold text-[9px] transition-all cursor-pointer"
                              >
                                Usar correo
                              </button>
                              <span className="text-[9px] text-slate-500">PIN: <strong className="text-amber-400 font-black">{p.pin}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </form>
                </div>
              )}

              {/* VIEW: REGISTER TAB */}
              {authTab === 'register' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-extrabold text-white tracking-tight">Nueva Membrecía Sinergia ERP</h3>
                    <p className="text-slate-400 text-xs mt-1">Cree un perfil personalizado asignándole una membresía para simular su flujo.</p>
                  </div>

                  {signupError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-2">
                      <span>⚠️</span> {signupError}
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {/* Name block & Avatar Picker */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-8 space-y-1 text-left">
                        <label htmlFor="reg-name" className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                          Nombre Completo
                        </label>
                        <input
                          id="reg-name"
                          type="text"
                          value={signupName}
                          onChange={(e) => {
                            setSignupName(e.target.value);
                            setSignupError(null);
                          }}
                          placeholder="Ej. José Urdaneta"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-650"
                          maxLength={32}
                          required
                        />
                      </div>
                      
                      <div className="sm:col-span-4 space-y-1 text-left">
                        <label className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                          Avatar ({signupAvatar})
                        </label>
                        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 justify-between items-center h-10">
                          {['🕴️', '👩‍💼', '🧹', '👨‍💻', '🏨'].map(e => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => setSignupAvatar(e)}
                              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                                signupAvatar === e ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900 text-slate-300'
                              }`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Email Input Block */}
                    <div className="space-y-1 text-left">
                      <label htmlFor="reg-email" className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                        Correo Electrónico de Acceso
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          ✉️
                        </span>
                        <input
                          id="reg-email"
                          type="email"
                          value={signupEmail}
                          onChange={(e) => {
                            setSignupEmail(e.target.value);
                            setSignupError(null);
                          }}
                          placeholder="ej. jose.urdaneta@sinergia.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-650/40"
                          required
                        />
                      </div>
                    </div>

                    {/* Hotel to Contract Selector */}
                    <div className="space-y-1 text-left">
                      <label htmlFor="reg-hotel" className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                        Sede / Hotel a Contratar
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                          🏢
                        </span>
                        <select
                          id="reg-hotel"
                          value={signupHotelId}
                          onChange={(e) => setSignupHotelId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-650/40 cursor-pointer"
                        >
                          {hotels.map(h => (
                            <option key={h.id} value={h.id} className="bg-slate-950 text-white">
                              {h.name} ({h.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Role & Membrecia Plan Selection Grid */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400 block">
                        Seleccione Nivel de Suscripción / Rol de Membrecía
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                        {/* 1. Platinum CEO */}
                        <button
                          type="button"
                          onClick={() => {
                            setSignupRole('owner');
                            setSignupError(null);
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                            signupRole === 'owner'
                              ? 'bg-indigo-950/30 border-indigo-500 shadow-md ring-1 ring-indigo-500/25'
                              : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-850'
                          }`}
                        >
                          <span className="text-xl mt-1">🕴️</span>
                          <div>
                            <span className="text-[8.5px] font-bold text-amber-400 uppercase font-mono tracking-wider block">Membresía Platinum</span>
                            <span className="text-[11px] font-bold text-white block mt-0.5">Dueño de Hoteles / CEO</span>
                            <span className="text-[9px] text-slate-400">Acceso total a Inteligencia, Canales, BI y PMS.</span>
                          </div>
                        </button>

                        {/* 2. Gold Front Desk */}
                        <button
                          type="button"
                          onClick={() => {
                            setSignupRole('receptionist');
                            setSignupError(null);
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                            signupRole === 'receptionist'
                              ? 'bg-indigo-950/30 border-indigo-500 shadow-md ring-1 ring-indigo-500/25'
                              : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-850'
                          }`}
                        >
                          <span className="text-xl mt-1">👩‍💼</span>
                          <div>
                            <span className="text-[8.5px] font-bold text-emerald-400 uppercase font-mono tracking-wider block">Membresía Gold</span>
                            <span className="text-[11px] font-bold text-white block mt-0.5">Recepcionista Jefe</span>
                            <span className="text-[9px] text-slate-400">Acceso optimizado a PMS, Reservas y CRM.</span>
                          </div>
                        </button>

                        {/* 3. Bronze Operations */}
                        <button
                          type="button"
                          onClick={() => {
                            setSignupRole('housekeeper');
                            setSignupError(null);
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                            signupRole === 'housekeeper'
                              ? 'bg-indigo-950/30 border-indigo-500 shadow-md ring-1 ring-indigo-500/25'
                              : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-850'
                          }`}
                        >
                          <span className="text-xl mt-1">🧹</span>
                          <div>
                            <span className="text-[8.5px] font-bold text-orange-400 uppercase font-mono tracking-wider block">Membresía Bronze</span>
                            <span className="text-[11px] font-bold text-white block mt-0.5">Operaciones & Aseo</span>
                            <span className="text-[9px] text-slate-400">Acceso básico exclusivo al PMS de Limpieza.</span>
                          </div>
                        </button>

                        {/* 4. Root Dev Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setSignupRole('admin');
                            setSignupError(null);
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all ${
                            signupRole === 'admin'
                              ? 'bg-indigo-950/30 border-indigo-500 shadow-md ring-1 ring-indigo-500/25'
                              : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-850'
                          }`}
                        >
                          <span className="text-xl mt-1">👨‍💻</span>
                          <div>
                            <span className="text-[8.5px] font-bold text-indigo-400 uppercase font-mono tracking-wider block">SaaS Dev Root</span>
                            <span className="text-[11px] font-bold text-white block mt-0.5">Administrador / SysAdmin</span>
                            <span className="text-[9px] text-slate-400">Full Access a Consola, Postgres y Blueprints.</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* PIN password setup */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center">
                        <label htmlFor="reg-pin" className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">
                          Defina PIN de Seguridad (4 Dígitos Numéricos)
                        </label>
                        <span className="text-[9px] text-slate-500">Obligatorio para iniciar sesión</span>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          🔑
                        </span>
                        <input
                          id="reg-pin"
                          type="password"
                          maxLength={4}
                          value={signupPin}
                          onChange={(e) => {
                            setSignupPin(e.target.value.replace(/\D/g, ''));
                            setSignupError(null);
                          }}
                          placeholder="Cree un código numérico (ej. 4567)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white tracking-widest focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-650"
                          required
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-extrabold uppercase py-3.5 rounded-xl hover:shadow-lg hover:shadow-indigo-650/15 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      🚀 REGISTRAR PERFIL Y ACTIVAR ACCESO
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Bottom Credits */}
            <div className="text-center md:text-left mt-8 pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
              Sinergia IA Hospitality • Control Total Multi-Sede © {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="erp-app-workspace" className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans text-slate-800 antialiased selection:bg-indigo-150">
      <header id="primary-header" className="bg-white border-b border-slate-200/80 sticky top-0 z-40 transition-all shadow-xs shrink-0 select-none">
        {/* Top Tier: Branding & Simulation Tools */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Left Block: Logo + Brand Switcher */}
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <SinergiaLogo className="flex items-center gap-2" showSubtitle={true} />
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Premium Selector of active building (Slack/Vercel style workspace switcher) */}
            <div className="relative flex items-center bg-slate-50 border border-slate-250/50 rounded-xl px-3 py-1.5 transition-all group shrink-0">
              <Building2 className={`w-3.5 h-3.5 text-slate-500 mr-2 shrink-0 ${activeUserProfile.role === 'admin' ? 'animate-pulse text-indigo-650' : ''}`} />
              <div className="flex flex-col text-left">
                <span className="text-[8px] font-mono text-slate-400 uppercase leading-none font-extrabold tracking-wider">
                  {activeUserProfile.role === 'admin' ? 'Área Global SysAdmin' : 'Sede Contratada'}
                </span>
                {activeUserProfile.role === 'admin' ? (
                  <select
                    value={currentHotelId}
                    onChange={(e) => setCurrentHotelId(e.target.value)}
                    className="text-xs font-bold text-slate-750 bg-transparent border-0 outline-hidden focus:ring-0 cursor-pointer p-0 mt-0.5 pr-4 shrink-0 focus:outline-hidden"
                  >
                    {hotels.map(h => (
                      <option key={h.id} value={h.id} className="text-slate-800">
                        🏨 {h.name.replace('Hotel ', '')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs font-extrabold text-slate-800 mt-0.5 flex items-center gap-1.5 leading-none py-0.5 select-none hover:opacity-90">
                    <span>🏨 {hotels.find(h => h.id === (activeUserProfile.contractedHotelId || 'hotel-1'))?.name || 'Sinergia Luxury Glamping'}</span>
                    <span className="text-[8px] font-mono bg-indigo-50 text-indigo-700 px-1 border border-indigo-200/50 rounded-xs font-extrabold tracking-wide py-0.5 align-middle leading-none shrink-0 scale-95 origin-left">
                      ACTIVA ✓
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Block: Live Indicator + Role Switcher + Logout */}
          <div className="flex items-center gap-3">
            
            {/* Dynamic Rate Indicator */}
            <div className="hidden lg:flex items-center gap-2.5 bg-indigo-50/70 border border-indigo-100/60 text-indigo-700 py-1.5 px-3 rounded-xl font-medium text-[10.5px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-650"></span>
              </span>
              <span className="font-mono font-bold tracking-wide">
                TARIFA DE HOY: <strong className="font-black text-indigo-950">{activePlan.name.toUpperCase()} (x{activePlan.multiplier})</strong>
              </span>
            </div>

            {/* Seamless Simulating Profile Badge Switcher */}
            <div className="flex items-center bg-slate-50 border border-slate-250/50 hover:border-slate-350/70 hover:bg-slate-100/30 rounded-xl p-1 relative transition-all shrink-0">
              <div className="flex items-center gap-2 pl-2 pr-1 py-0.5">
                <div className="p-1 bg-indigo-500/10 border border-indigo-550/10 rounded-lg text-indigo-650 mr-0.5 shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-base select-none leading-none shrink-0" role="img" aria-label="avatar">{activeUserProfile.avatar}</span>
                  <div className="flex flex-col text-left max-w-[100px] md:max-w-[125px] leading-tight shrink-0">
                    <span className="text-[10px] font-black text-slate-800 truncate leading-none">
                      {activeUserProfile.name.split(' (')[0]}
                    </span>
                    <span className={`text-[8px] font-mono leading-none tracking-wide mt-0.5 w-fit uppercase font-semibold ${
                      activeUserProfile.role === 'admin' ? 'text-indigo-600' :
                      activeUserProfile.role === 'owner' ? 'text-amber-600' :
                      activeUserProfile.role === 'receptionist' ? 'text-emerald-600' : 
                      'text-orange-600'
                    }`}>
                      {activeUserProfile.membershipBadge.split(' ')[1] || 'Socio'}
                    </span>
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-250/70 mx-1.5"></div>

                <div className="flex flex-col text-left shrink-0">
                  <span className="text-[8px] font-mono text-slate-400 uppercase leading-none font-bold tracking-wider">Simular Rol</span>
                  <select
                    value={activeUserProfile.id}
                    onChange={(e) => {
                      const found = profiles.find(u => u.id === e.target.value);
                      if (found) {
                        if (found.id === activeUserProfile.id) return;
                        setProfileToVerify(found);
                        setPinInput('');
                        setPinError(null);
                        setShowDemoPins(false);
                      }
                    }}
                    className="text-[11px] font-black text-slate-700 bg-transparent border-0 outline-hidden focus:ring-0 cursor-pointer w-24 py-0 pl-0 pr-4 mt-0.5 font-sans"
                    id="user-profile-switcher-select"
                  >
                    {profiles.map(up => (
                      <option key={up.id} value={up.id}>
                        👤 {up.roleLabel.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <span className="absolute -top-1.5 -right-1 bg-amber-500 text-slate-950 font-mono text-[7px] font-black px-1 rounded-sm uppercase tracking-wider border border-amber-300">
                SIM
              </span>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={() => setIsLoggedIn(false)}
              className="flex items-center justify-center p-2.5 bg-slate-50 border border-slate-250/50 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-xl transition-all cursor-pointer shadow-3xs"
              id="header-logout-button"
              title="Cerrar sesión actual"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Tier: Fluid Horizontal Tab Navigation */}
        <div className="border-t border-slate-200 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex gap-2 overflow-x-auto no-scrollbar py-2 text-xs font-bold text-slate-500 select-none">
              <button
                type="button"
                onClick={() => setActiveTab('pms')}
                className={`px-3.5 py-1.5 rounded-lg transition-all outline-hidden cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'pms' 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                    : 'hover:bg-slate-150/60 hover:text-slate-800'
                }`}
              >
                🏨 Tablero PMS
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('channels')}
                className={`px-3.5 py-1.5 rounded-lg transition-all outline-hidden cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'channels' 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                    : 'hover:bg-slate-150/60 hover:text-slate-800'
                }`}
              >
                📡 Channel Manager
                {!activeUserProfile.allowedTabs.includes('channels') && (
                  <span className="text-[8px] text-amber-600 bg-amber-50 border border-amber-205/65 rounded px-1 font-mono font-bold leading-none py-0.5">🔒 BASE</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pricing')}
                className={`px-3.5 py-1.5 rounded-lg transition-all outline-hidden cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'pricing' 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                    : 'hover:bg-slate-150/60 hover:text-slate-800'
                }`}
              >
                🏷️ Planes Tarifarios
                {!activeUserProfile.allowedTabs.includes('pricing') && (
                  <span className="text-[8px] text-amber-600 bg-amber-50 border border-amber-205/65 rounded px-1 font-mono font-bold leading-none py-0.5">🔒 PRO</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('booking')}
                className={`px-3.5 py-1.5 rounded-lg transition-all outline-hidden cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'booking' 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                    : 'hover:bg-slate-150/60 hover:text-slate-800'
                }`}
              >
                🌐 Motor Reservas
                {!activeUserProfile.allowedTabs.includes('booking') && (
                  <span className="text-[8px] text-amber-600 bg-amber-50 border border-amber-205/65 rounded px-1 font-mono font-bold leading-none py-0.5">🔒 STD</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bi')}
                className={`px-3.5 py-1.5 rounded-lg transition-all outline-hidden cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'bi' 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                    : 'hover:bg-slate-150/60 hover:text-slate-800'
                }`}
              >
                📊 BI & Ingresos
                {!activeUserProfile.allowedTabs.includes('bi') && (
                  <span className="text-[8px] text-amber-600 bg-amber-50 border border-amber-205/65 rounded px-1 font-mono font-bold leading-none py-0.5">🔒 ENT</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('crm')}
                className={`px-3.5 py-1.5 rounded-lg transition-all outline-hidden cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'crm' 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                    : 'hover:bg-slate-150/60 hover:text-slate-800'
                }`}
              >
                👥 Huéspedes CRM
                {!activeUserProfile.allowedTabs.includes('crm') && (
                  <span className="text-[8px] text-amber-600 bg-amber-50 border border-amber-205/65 rounded px-1 font-mono font-bold leading-none py-0.5">🔒 STD</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('blueprint')}
                className={`px-3.5 py-1.5 rounded-lg transition-all outline-hidden cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'blueprint' 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                    : 'hover:bg-slate-150/60 hover:text-slate-800'
                }`}
              >
                💎 Planos & SysAdmin
                {!activeUserProfile.allowedTabs.includes('blueprint') && (
                  <span className="text-[8px] text-amber-600 bg-amber-50 border border-amber-205/65 rounded px-1 font-mono font-bold leading-none py-0.5">🔒 ROOT</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`px-3.5 py-1.5 rounded-lg transition-all outline-hidden cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'config' 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                    : 'hover:bg-slate-150/60 hover:text-slate-800'
                }`}
              >
                ⚙️ Config Hotel
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('community')}
                className={`px-3.5 py-1.5 rounded-lg transition-all outline-hidden cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'community' 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10' 
                    : 'hover:bg-slate-150/60 hover:text-slate-800'
                }`}
              >
                👥 Red de Comunidad
                <span className="text-[8px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-1 font-mono font-bold leading-none py-0.5 animate-pulse">VIVO</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('saas')}
                className={`px-3.5 py-1.5 rounded-lg transition-all outline-hidden cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'saas' 
                    ? 'bg-[#0B523A] text-white shadow-sm shadow-[#0B523A]/10' 
                    : 'hover:bg-slate-150/60 hover:text-slate-850 font-sans'
                }`}
              >
                💳 Plan SaaS & Facturación
                <span className="text-[8px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 font-mono font-bold leading-none py-0.5 animate-pulse">SAAS PRO</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Workspace containing layout grid */}
      <main className="flex-1 flex flex-col xl:flex-row overflow-hidden p-4 sm:p-6 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Left Side: Modular Dashboards */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* Active Hotel Details Showcase Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest font-mono bg-indigo-50 text-indigo-700 rounded px-2 py-0.5 uppercase border border-indigo-100">
                  {activeHotel.type} premium
                </span>
                <span className="text-xs text-amber-500 font-bold font-mono">★ {activeHotel.rating}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-800 mt-1">{activeHotel.name}</h1>
              <p className="text-xs text-slate-500 mt-1">{activeHotel.address}</p>
            </div>
            
            <div className="flex flex-wrap gap-3 font-mono text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 w-full sm:w-auto">
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Ocupación Propia</p>
                <p className="font-bold text-slate-700 text-sm mt-0.5">{occupancyPercentage}%</p>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <p className="text-slate-400 text-[10px] uppercase">Mantenimientos</p>
                <p className="font-bold text-rose-600 text-sm mt-0.5">
                  {tickets.filter(t => t.hotelId === currentHotelId && t.status !== 'resolved').length} Activos
                </p>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <p className="text-slate-400 text-[10px] uppercase">Plan Seleccionado</p>
                <p className="font-bold text-emerald-600 text-sm mt-0.5">x{activePlan.multiplier}</p>
              </div>
            </div>
          </div>

          {/* Active tab content switcher */}
          {(!activeUserProfile.allowedTabs.includes(activeTab) && activeTab !== 'config' && activeTab !== 'saas') ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs text-center space-y-6">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-2xl mx-auto animate-bounce mt-4">
                  🔒
                </div>
                <h2 className="text-xl font-bold text-slate-800">Módulo Restringido por Nivel de Membrecía</h2>
                <p className="text-sm text-slate-500">
                  La pestaña <strong className="text-indigo-600 font-mono">"{activeTab.toUpperCase()}"</strong> no está disponible con su perfil y membrecía actual. El usuario activo <strong className="text-slate-800">{activeUserProfile.name}</strong> opera bajo la licencia de uso <strong className="text-indigo-650 font-semibold">{activeUserProfile.membershipPlan}</strong>.
                </p>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left space-y-1">
                  <p className="font-bold text-slate-705">ℹ️ Acerca del perfil activo:</p>
                  <p>{activeUserProfile.description}</p>
                </div>
              </div>

              {/* COMPARISON MATRIX CARD GRID */}
              <div className="border-t border-slate-100 pt-6 mt-6">
                <h3 className="text-xs font-bold uppercase text-slate-450 font-mono tracking-wider mb-5">Matriz de Membrecías y Permisos Sinergia IA</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                  {profiles.map(up => {
                    const isSelected = up.id === activeUserProfile.id;
                    return (
                      <div 
                        key={up.id} 
                        className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50/25 shadow-xs ring-1 ring-indigo-500' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xl">{up.avatar}</span>
                            <span className={`text-[8.5px] font-mono font-extrabold px-1.5 py-0.5 rounded ${up.badgeBg}`}>
                              {up.membershipBadge.split(' ')[1] || 'Socio'}
                            </span>
                          </div>
                          
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">{up.name.split(' (')[0]}</h4>
                          <p className="text-[10px] text-zinc-500 font-medium font-mono mt-0.5">{up.roleLabel}</p>
                          <p className="text-[10.5px] text-slate-550 mt-2.5 leading-relaxed bg-slate-50/60 p-2 rounded border border-slate-100 text-slate-600 min-h-[56px] italic">
                            "{up.description.slice(0, 70)}..."
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-dashed border-slate-150">
                          <p className="text-[10px] font-bold text-slate-600 mb-2 uppercase font-mono">Módulos Permitidos:</p>
                          <div className="flex flex-wrap gap-1 mb-4">
                            {up.allowedTabs.map(t => (
                              <span key={t} className="text-[9px] bg-slate-100 text-slate-605 border border-slate-205 rounded px-1.5 py-0.5 font-mono font-semibold">
                                {t.toUpperCase()}
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isSelected) return;
                              setProfileToVerify(up);
                              setPinInput('');
                              setPinError(null);
                              setShowDemoPins(false);
                            }}
                            className={`w-full font-mono text-[10.5px] py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-3xs cursor-default'
                                : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? '✓ Sesión Activa' : 'Simular Iniciar Sesión'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* QUICK PROMOTION BANNER */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center text-left gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-amber-900 flex items-center gap-1.5">
                    ✨ ¿Desea ascender de categoría corporativa hoy mismo?
                  </h4>
                  <p className="text-xs text-amber-800">
                    Cambie de sesión utilizando el selector superior o los botones interactivos de la matriz para experimentar todas las características de Sinergia Enterprise.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const owner = USER_PROFILES.find(u => u.id === 'user-owner');
                    if (owner) {
                      setProfileToVerify(owner);
                      setPinInput('');
                      setPinError(null);
                      setShowDemoPins(false);
                    }
                  }}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  ⚡ Desbloquear Todo como Don Juan
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'pms' && (
                <div className="space-y-6">
              {/* Metric indicators */}
              <MetricCards 
                rooms={activeHotelRooms} 
                reservations={reservations.filter(res => res.hotelId === currentHotelId)} 
                tickets={tickets.filter(t => t.hotelId === currentHotelId)} 
              />
              
              {/* Hotel Grid Canvas */}
              <PMSGrid 
                rooms={modifiedRooms}
                reservations={reservations}
                tickets={tickets}
                guests={guests}
                onUpdateRoomStatus={handleUpdateRoomStatus}
                onAddReservation={handleAddReservation}
                onUpdateReservationStatus={handleUpdateReservationStatus}
                onAddTicket={handleAddTicket}
                onResolveTicket={handleResolveTicket}
                onAddGuest={handleAddGuest}
                currentHotelId={currentHotelId}
              />

              {/* Módulo de Operaciones y Mantenimiento centralizado (Housekeeping & Lucas Hub) */}
              <div id="central-operations-module" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-2 text-[9px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded sm:uppercase">Consola Operativa Real</span>
                      <h3 className="text-base font-bold text-slate-800">Panel Técnico, Daños & Control de Limpieza</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Gestión operativa real en tiempo real. Configura asignaciones físicas, listas de chequeo estrictas y reportes de averías técnicas con valuación de costos.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Sistema de Operaciones Activo
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  {/* Columna A: Habitaciones Requiriendo Limpieza */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150 shadow-2xs">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 🧼 Habitaciones Esperando Limpieza (reales)
                      </span>
                      <span className="text-xs font-bold text-slate-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        {activeHotelRooms.filter(r => r.status === 'cleaning').length} u
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                      {activeHotelRooms.filter(r => r.status === 'cleaning').length === 0 ? (
                        <div className="border border-dashed border-slate-200 p-6 rounded-xl text-center text-xs text-slate-400 bg-slate-50/20">
                          🎉 ¡Toda la propiedad está impecable! No hay tareas acumuladas de aseo.
                        </div>
                      ) : (
                        activeHotelRooms.filter(r => r.status === 'cleaning').map(room => (
                          <div key={room.id} className="border border-slate-150 rounded-xl p-3 flex items-center justify-between text-xs bg-white hover:bg-slate-50 transition-colors shadow-2xs">
                            <div className="flex-1 mr-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                                  {room.number}
                                </span>
                                <span className="font-bold text-slate-800">{room.name}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">Higiene Necesaria • {room.type}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedCleaningRoom(room);
                                setCleaningStaffSelected('Yolanda García');
                                setCleaningChecklist({
                                  'Baño desinfectado': false,
                                  'Sábanas cambiadas': false,
                                  'Amenities repuestos': false,
                                  'Minibar verificado': false,
                                  'Aspirado completado': false
                                });
                              }}
                              className="font-mono text-[10px] px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> INICIAR CONTROL
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Columna B: Incidencias o Averías Técnicas */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150 shadow-2xs">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-rose-500" /> 🛠️ Tickets de Daño Activos (reales)
                      </span>
                      <span className="text-xs font-bold text-rose-600 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        {tickets.filter(t => t.hotelId === currentHotelId && t.status !== 'resolved').length} t
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                      {tickets.filter(t => t.hotelId === currentHotelId && t.status !== 'resolved').length === 0 ? (
                        <div className="border border-dashed border-slate-200 p-6 rounded-xl text-center text-xs text-slate-400 bg-slate-50/20">
                          ✨ Sin reportes de daños o incidentes activos. Todo funciona perfectamente.
                        </div>
                      ) : (
                        tickets.filter(t => t.hotelId === currentHotelId && t.status !== 'resolved').map(t => {
                          const associatedRoom = activeHotelRooms.find(r => r.id === t.roomId);
                          let prioColor = 'bg-slate-100 text-slate-600 border-slate-200';
                          if (t.priority === 'high') prioColor = 'bg-rose-50 text-rose-700 border-rose-200';
                          if (t.priority === 'medium') prioColor = 'bg-amber-50 text-amber-700 border-amber-200';

                          return (
                            <div key={t.id} className="border border-slate-150 rounded-xl p-3 text-xs bg-white hover:bg-slate-50 transition-colors flex flex-col justify-between gap-2.5 shadow-2xs">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-rose-50 border border-rose-150 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                                      {associatedRoom?.number || 'N/A'}
                                    </span>
                                    <span className="font-bold text-slate-800">{associatedRoom?.name || 'Habitación de Servicio'}</span>
                                  </div>
                                  <p className="text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{t.description}</p>
                                </div>
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${prioColor}`}>
                                  {t.priority.toUpperCase()}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedResolveTicket(t);
                                  setMaintenanceStaffSelected('Carlos Gómez (Soporte Interno)');
                                  setMaintenanceRepairCost(35);
                                }}
                                className="w-full font-mono text-[10px] py-1.5 bg-indigo-50 text-indigo-750 border border-indigo-150 rounded-lg hover:bg-indigo-100 font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Wrench className="w-3 h-3" /> AUDITAR FÍSICAMENTE Y REPARAR
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN INTERACTIVA DE GESTIÓN DE TURNOS & STAFF Y CALENDARIO */}
                <div className="pt-5 border-t border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-500" /> 🕒 Gestión de Turnos, Staff & Calendario de Labores
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Asigna personal de Housekeeping y Mantenimiento a turnos específicos mediante selector de fecha y consulta coberturas en tiempo real.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-150/70 p-1.5 rounded-lg border border-slate-200">
                      <span className="text-[9px] font-mono font-bold text-slate-500 px-1 uppercase tracking-wider">Fecha Calendario:</span>
                      <input 
                        type="date" 
                        value={selectedCalendarDateFilter}
                        onChange={(e) => setSelectedCalendarDateFilter(e.target.value)}
                        className="text-[10px] font-mono font-bold bg-white text-slate-855 border border-slate-300 rounded px-1.5 py-0.5 outline-hidden focus:border-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Formulario para registrar nuevo turno */}
                    <form onSubmit={handleAddStaffShift} className="lg:col-span-5 bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3.5 shadow-3xs text-xs">
                      <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider font-mono">📝 Registrar Asignación</span>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">1. Especialidad / Rol de Trabajo *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNewShiftRole('housekeeping');
                              setNewShiftStaffName('Yolanda García');
                            }}
                            className={`py-2 rounded-lg font-bold border transition-all text-center text-[11px] cursor-pointer ${
                              newShiftRole === 'housekeeping' 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-750 font-black shadow-3xs' 
                                : 'bg-white border-slate-200 text-slate-550 hover:bg-slate-100'
                            }`}
                          >
                            🧼 Housekeeping
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewShiftRole('maintenance');
                              setNewShiftStaffName('Carlos Gómez (Soporte Interno)');
                            }}
                            className={`py-2 rounded-lg font-bold border transition-all text-center text-[11px] cursor-pointer ${
                              newShiftRole === 'maintenance' 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-750 font-black shadow-3xs' 
                                : 'bg-white border-slate-200 text-slate-550 hover:bg-slate-100'
                            }`}
                          >
                            🔧 Mantenimiento
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">2. Seleccionar Empleado *</label>
                          <select
                            value={newShiftStaffName}
                            onChange={(e) => setNewShiftStaffName(e.target.value)}
                            className="w-full text-xs font-semibold border border-slate-250 rounded-lg p-2 bg-white text-slate-800 outline-hidden focus:border-slate-350 cursor-pointer"
                          >
                            {newShiftRole === 'housekeeping' ? (
                              <>
                                <option value="Yolanda García">Yolanda García (Sup.)</option>
                                <option value="Diana Ortiz">Diana Ortiz (Ama Llaves)</option>
                                <option value="María Inés">María Inés (Camarera)</option>
                                <option value="John Arley">John Arley (Glampings)</option>
                                <option value="Carlos Andrés">Carlos Andrés (Aux.)</option>
                              </>
                            ) : (
                              <>
                                <option value="Carlos Gómez (Soporte Interno)">Carlos Gómez (Soporte)</option>
                                <option value="Ramiro López (Electricista)">Ramiro López (Electricidad)</option>
                                <option value="Andrés Henao (Plomero Externo)">Andrés Henao (Fontanería)</option>
                                <option value="Soporte Domótico IoT">Soporte IoT (Domótica)</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block">3. Fecha del Turno *</label>
                          <input 
                            type="date"
                            value={newShiftDate}
                            onChange={(e) => setNewShiftDate(e.target.value)}
                            className="w-full text-xs border border-slate-250 rounded-lg p-2 bg-white text-slate-800 outline-hidden font-mono font-medium cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">4. Tipo de Turno / Horario *</label>
                        <select
                          value={newShiftType}
                          onChange={(e) => setNewShiftType(e.target.value as any)}
                          className="w-full text-xs font-semibold border border-slate-250 rounded-lg p-2 bg-white text-slate-800 outline-hidden cursor-pointer"
                        >
                          <option value="Mañana (06:00 - 14:00)">Mañana (06:00 - 14:00)</option>
                          <option value="Tarde (14:00 - 22:00)">Tarde (14:00 - 22:00)</option>
                          <option value="Noche (22:00 - 06:00)">Noche (22:00 - 06:00)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">5. Notas / Instrucciones Particulares *</label>
                        <textarea
                          placeholder="Revisisión profunda, lavado de alfombras, reportar averías al pms, etc..."
                          value={newShiftNotes}
                          onChange={(e) => setNewShiftNotes(e.target.value)}
                          rows={2}
                          className="w-full text-[11px] border border-slate-250 rounded-lg p-2 bg-white text-slate-850 outline-hidden focus:border-indigo-400 font-sans leading-normal resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-lg transition-colors shadow-2xs mt-1 text-[11px] cursor-pointer"
                      >
                        ✓ Programar Turno de Personal
                      </button>
                    </form>

                    {/* Calendario / Lista de turnos asignados */}
                    <div className="lg:col-span-7 bg-white border border-slate-200 p-4 rounded-xl space-y-3.5 shadow-3xs">
                      <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                        <span className="text-[10px] font-bold text-slate-700 font-mono flex items-center gap-1 uppercase tracking-wide">
                          🗓️ Cobertura Activa para el {selectedCalendarDateFilter}
                        </span>
                        <span className="text-[9.5px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-120 px-2 py-0.5 rounded">
                          {staffShifts.filter(s => s.hotelId === currentHotelId && s.date === selectedCalendarDateFilter).length} Asignados
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {staffShifts.filter(s => s.hotelId === currentHotelId && s.date === selectedCalendarDateFilter).length === 0 ? (
                          <div className="border border-dashed border-slate-200 py-14 px-4 rounded-xl text-center text-xs text-slate-400 bg-slate-50/20 flex flex-col items-center justify-center">
                            <Calendar className="w-8 h-8 text-slate-300 mb-2.5 opacity-60" />
                            <span>Ninguno programado para esta fecha ({selectedCalendarDateFilter}).</span>
                            <span className="text-[10px] text-slate-400 block mt-1.5 font-semibold">Crea un registro a la izquierda para cubrir la fecha.</span>
                          </div>
                        ) : (
                          staffShifts.filter(s => s.hotelId === currentHotelId && s.date === selectedCalendarDateFilter).map(shift => {
                            const isHousekeeping = shift.role === 'housekeeping';
                            return (
                              <div key={shift.id} className="border border-slate-150 rounded-xl p-3 flex items-start justify-between text-xs bg-white hover:bg-slate-50 transition-colors shadow-2xs">
                                <div className="space-y-1 flex-1 min-w-0 mr-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                                      isHousekeeping 
                                        ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                        : 'bg-rose-50 text-rose-700 border-rose-100'
                                    }`}>
                                      {isHousekeeping ? '🧼 ASEO' : '🔧 MANTENIMIENTO'}
                                    </span>
                                    <span className="font-bold text-slate-800 truncate text-[11px]">{shift.staffName}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></span> {shift.shiftType}
                                  </div>
                                  <div className="text-[10.5px] text-slate-650 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1.5 italic leading-relaxed break-words">
                                    "{shift.assignedNotes}"
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaffShift(shift.id)}
                                  className="text-[10px] text-rose-600 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-lg py-1 px-2.5 transition-all cursor-pointer shrink-0 font-bold font-mono"
                                >
                                  ✕ Borrar
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                      
                      {/* Accesos Rápidos para cambiar la fecha visualizada */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        <span className="shrink-0">Fechas Rápidas:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCalendarDateFilter('2026-06-19');
                          }}
                          className={`px-2 py-1 rounded border transition-all hover:bg-slate-100 cursor-pointer ${
                            selectedCalendarDateFilter === '2026-06-19' ? 'bg-indigo-50 border-indigo-250 text-indigo-750 font-black' : 'bg-white border-slate-200'
                          }`}
                        >
                          Hoy (19 Jun)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCalendarDateFilter('2026-06-20');
                          }}
                          className={`px-2 py-1 rounded border transition-all hover:bg-slate-100 cursor-pointer ${
                            selectedCalendarDateFilter === '2026-06-20' ? 'bg-indigo-50 border-indigo-250 text-indigo-750 font-black' : 'bg-white border-slate-200'
                          }`}
                        >
                          Mañana (20 Jun)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCalendarDateFilter('2026-06-21');
                          }}
                          className={`px-2 py-1 rounded border transition-all hover:bg-slate-100 cursor-pointer ${
                            selectedCalendarDateFilter === '2026-06-21' ? 'bg-indigo-50 border-indigo-250 text-indigo-750 font-black' : 'bg-white border-slate-200'
                          }`}
                        >
                          Dom (21 Jun)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HISTORIAL OPERACIONAL REAL */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">Bitácora Oficial de Labores Realizadas (Firma y Logs Auditados)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Historial de Aseo */}
                    <div className="bg-slate-50/50 border border-slate-150 p-3 rounded-xl space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        📋 Registro de Limpiezas Completadas ({housekeepingLogs.filter(l => l.hotelId === currentHotelId).length})
                      </span>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto">
                        {housekeepingLogs.filter(l => l.hotelId === currentHotelId).length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">No hay registros de aseo en esta sesión.</p>
                        ) : (
                          housekeepingLogs.filter(l => l.hotelId === currentHotelId).map(log => (
                            <div key={log.id} className="bg-white p-2 border border-slate-100 rounded-lg text-[10px] space-y-1 shadow-2xs">
                              <div className="flex justify-between items-center text-slate-700">
                                <strong>Hab. {log.roomNumber} - Completado</strong>
                                <span className="font-mono text-slate-400">{new Date(log.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <p className="text-slate-50s overflow-hidden text-ellipsis">Aseador(a): <span className="text-slate-800 font-semibold">{log.assignedStaff}</span></p>
                              <div className="flex flex-wrap gap-1 mt-1 text-[8px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-1">
                                {log.checklistCompleted.length === 0 ? 'Higiene básica' : log.checklistCompleted.join(' • ')}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Historial de Mantenimiento */}
                    <div className="bg-slate-50/50 border border-slate-150 p-3 rounded-xl space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        🔧 Resoluciones de Averías & Costos de Reparación ({maintenanceLogs.filter(l => l.hotelId === currentHotelId).length})
                      </span>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto">
                        {maintenanceLogs.filter(l => l.hotelId === currentHotelId).length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">No hay registros de mantenimiento en esta sesión.</p>
                        ) : (
                          maintenanceLogs.filter(l => l.hotelId === currentHotelId).map(log => (
                            <div key={log.id} className="bg-white p-2 border border-slate-100 rounded-lg text-[10px] space-y-1 shadow-2xs">
                              <div className="flex justify-between items-center text-slate-700">
                                <span className="font-bold text-rose-700">Hab. {log.roomNumber} - Reparado</span>
                                <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100">${log.repairCost} USD</span>
                              </div>
                              <p className="text-slate-500 overflow-hidden text-ellipsis italic">"{log.description}"</p>
                              <p className="text-slate-600">Técnico: <strong className="text-slate-800">{log.assignedStaff}</strong></p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MODAL CHECKLIST LIMPIEZA INTERACTIVO */}
                {selectedCleaningRoom && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
                      <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-black text-slate-800">Checklist Operativo - Habitación {selectedCleaningRoom.number}</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">Define los ítems obligatorios antes de dar el "Alta de Disponible" en el PMS</p>
                        </div>
                        <button 
                          onClick={() => setSelectedCleaningRoom(null)}
                          className="p-1 px-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition-all font-bold text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="px-6 py-5 space-y-4">
                        {/* Selector de Staff */}
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-bold text-slate-600 block">Personal de Housekeeping Asignado *</label>
                          <select
                            value={cleaningStaffSelected}
                            onChange={(e) => setCleaningStaffSelected(e.target.value)}
                            className="w-full text-xs border border-slate-250 rounded-lg p-2.5 bg-white text-slate-850 outline-hidden focus:border-slate-400 font-medium"
                          >
                            <option value="Yolanda García">Yolanda García (Supervisora de Pisos)</option>
                            <option value="Diana Ortiz">Diana Ortiz (Ama de Llaves Sr.)</option>
                            <option value="María Inés">María Inés (Camarera Princ.)</option>
                            <option value="John Arley">John Arley (Encargado Glampings)</option>
                            <option value="Carlos Andrés">Carlos Andrés (Auxiliar Pisos)</option>
                          </select>
                        </div>

                        {/* Checklist */}
                        <div className="space-y-2">
                          <label className="text-[10.5px] font-bold text-slate-600 block">Inspección de Puntos Críticos (Debe marcarse todo)</label>
                          
                          <div className="space-y-2">
                            {Object.keys(cleaningChecklist).map(item => (
                              <label key={item} className="flex items-start gap-2.5 p-2 border border-slate-100 rounded-lg bg-slate-50/40 hover:bg-slate-50 transition-colors cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                                  checked={cleaningChecklist[item]}
                                  onChange={(e) => {
                                    setCleaningChecklist(prev => ({
                                      ...prev,
                                      [item]: e.target.checked
                                    }));
                                  }}
                                  className="mt-0.5 w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300"
                                />
                                <span className={cleaningChecklist[item] ? 'text-slate-800 font-semibold' : 'text-slate-500'}>
                                  {item}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Botón Guardar */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setSelectedCleaningRoom(null)}
                            className="flex-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleCompleteHousekeeping}
                            className="flex-1 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
                          >
                            ✓ Registrar Aseo y Liberar Habitación
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL CONTROL MANTENIMIENTO INTERACTIVO */}
                {selectedResolveTicket && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
                      <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-black text-rose-800">Cierre de Avería & Valuación Técnica</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">Ingresa los datos del cierre físico del ticket de mantenimiento</p>
                        </div>
                        <button 
                          onClick={() => setSelectedResolveTicket(null)}
                          className="p-1 px-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition-all font-bold text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="px-6 py-5 space-y-4">
                        {/* Nota de Daño */}
                        <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-xs space-y-1">
                          <strong className="text-rose-800 block">Reporte Inicial:</strong>
                          <p className="text-slate-700 italic">"{selectedResolveTicket.description}"</p>
                          <span className="text-[9px] font-mono text-slate-400 block mt-1.5">Severidad: <strong className="text-rose-600">{selectedResolveTicket.priority.toUpperCase()}</strong></span>
                        </div>

                        {/* Técnico Responsable */}
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-bold text-slate-600 block">Técnico Operador Asignado *</label>
                          <select
                            value={maintenanceStaffSelected}
                            onChange={(e) => setMaintenanceStaffSelected(e.target.value)}
                            className="w-full text-xs border border-slate-250 rounded-lg p-2.5 bg-white text-slate-850 outline-hidden focus:border-slate-400 font-medium"
                          >
                            <option value="Carlos Gómez (Soporte Interno)">Carlos Gómez (Fijo - Mantenimiento General)</option>
                            <option value="Ramiro López (Electricista)">Ramiro López (Electricista Homologado)</option>
                            <option value="Andrés Henao (Plomero Externo)">Andrés Henao (Plomería y Calderas)</option>
                            <option value="Soporte Domótico IoT">Soporte Domótico IoT (Proveedor Tecnológico)</option>
                          </select>
                        </div>

                        {/* Costo Reparación */}
                        <div className="space-y-1.5">
                          <label className="text-[10.5px] font-bold text-slate-600 block flex justify-between">
                            <span>Costo de Reparación (USD) *</span>
                            <span className="text-[10px] font-mono text-slate-400">Calculado en libro de caja</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
                            <input
                              type="number"
                              min="0"
                              value={maintenanceRepairCost}
                              onChange={(e) => setMaintenanceRepairCost(parseFloat(e.target.value) || 0)}
                              className="w-full text-xs border border-slate-250 rounded-lg p-2.5 pl-7 bg-white text-slate-850 outline-hidden focus:border-slate-400 font-semibold"
                            />
                          </div>
                        </div>

                        {/* Botón Guardar */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setSelectedResolveTicket(null)}
                            className="flex-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleResolveMaintenanceWithAudit}
                            className="flex-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
                          >
                            ✓ Registrar Solución y Pasar a Limpieza
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Channel Manager Multicanal Sinergia Sync</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sincroniza tarifas, restricciones e inventario del hospedaje seleccionado con canales de terceros vía API. Los recargos te ayudan a cubrir comisiones de agencias de viaje de manera directa.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isOTASyncing}
                  onClick={handleForceOTASync}
                  className="font-mono text-xs px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isOTASyncing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      SINCRONIZANDO OTAs...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      FORZAR REFRESH API SYNC
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {channels.map(chan => {
                  let badgeColor = 'bg-slate-100 text-slate-600';
                  if (chan.status === 'connected') badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                  if (chan.status === 'syncing') badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';

                  return (
                    <div key={chan.id} className="border border-slate-150 p-4 rounded-xl flex flex-col justify-between hover:border-indigo-200 transition-all bg-white shadow-3xs">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-700">
                            {chan.icon === 'Home' && <Home className="w-5 h-5 text-red-500" />}
                            {chan.icon === 'Building2' && <Building2 className="w-5 h-5 text-blue-500" />}
                            {chan.icon === 'Plane' && <Plane className="w-5 h-5 text-amber-500" />}
                            {chan.icon === 'Globe' && <Globe className="w-5 h-5 text-emerald-500" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800">{chan.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">Última sincronización: {chan.lastSync}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                          {chan.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Display configured API credentials metadata */}
                      <div className="mt-3">
                        {chan.apiKey ? (
                          <div className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 text-[10px] text-slate-500 font-mono space-y-1 shadow-3xs">
                            <div className="flex justify-between gap-2 overflow-hidden">
                              <span className="text-slate-400 shrink-0">API Endpoint:</span>
                              <span className="truncate text-slate-700 text-right font-medium" title={chan.apiUrl}>{chan.apiUrl}</span>
                            </div>
                            <div className="flex justify-between gap-1">
                              <span className="text-slate-400 shrink-0">Property ID:</span>
                              <span className="text-slate-700 font-bold">{chan.propertyId}</span>
                            </div>
                            <div className="flex justify-between gap-1">
                              <span className="text-slate-400 shrink-0">API Token:</span>
                              <span className="text-slate-700 font-mono">Bearer {chan.apiKey.slice(0, 6)}***{chan.apiKey.slice(-3)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-semibold rounded-lg p-2.5 text-center flex items-center justify-center gap-1">
                            <AlertOctagon className="w-3 h-3 text-rose-500" />
                            Requiere llaves de API válidas para sincronizar
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-mono">Recargo de Margen:</span>
                          <span className="font-bold text-slate-700 font-mono">+{(Math.round((chan.rateSyncMultiplier - 1) * 100))}%</span>
                        </div>
                        
                        {/* Slider to adjust the sync multiplier markup */}
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            min="1.00"
                            max="1.50"
                            step="0.01"
                            value={chan.rateSyncMultiplier}
                            disabled={chan.status !== 'connected'}
                            onChange={(e) => handleUpdateChannelMultiplier(chan.id, parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-40"
                          />
                          <span className="text-[10px] font-mono font-bold text-slate-500 px-2 py-0.5 bg-slate-50 border border-slate-150 rounded min-w-[50px] text-center">
                            x{chan.rateSyncMultiplier}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <button
                            onClick={() => handleOpenChannelConfig(chan)}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Settings className="w-3 h-3 text-slate-500" /> Configurar API
                          </button>

                          <button
                            onClick={() => handleToggleChannelStatus(chan.id)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                              chan.status === 'connected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100'
                            }`}
                          >
                            {chan.status === 'connected' ? 'Desconectar Canal' : 'Conectar API Sync'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Notification on synchronization */}
              <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-4 flex gap-3 text-xs text-slate-600 leading-normal">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Sincronización en tiempo real desatendida active:</span> Cualquier ajuste a los planes de tarifas base abajo modificará instantáneamente los valores reflejados en OTAs incrementados por el coeficiente de comisión asociado.
                </div>
              </div>

              {/* MODAL CONFIGURACION API INTEGRADO */}
              {selectedConfigChannelId && (() => {
                const chan = channels.find(c => c.id === selectedConfigChannelId);
                if (!chan) return null;
                return (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-fade-in text-left">
                      <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-1 text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded uppercase">Canal Sincronizado</span>
                            <h3 className="text-sm font-black text-slate-800">{chan.name}</h3>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Configura parámetros de producción reales para el flujo XML API Sinergia Sync</p>
                        </div>
                        <button 
                          onClick={() => setSelectedConfigChannelId(null)}
                          className="p-1 px-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-150 transition-all font-bold text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="px-6 py-5 space-y-4">
                        {/* URL Endpoint */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider font-mono">Endpoint del Servidor API (OTA) *</label>
                          <input
                            type="text"
                            value={channelApiUrlInput}
                            onChange={(e) => setChannelApiUrlInput(e.target.value)}
                            placeholder="https://api.canal.com/v2/listings"
                            className="w-full text-xs font-mono border border-slate-250 rounded-lg p-2.5 bg-white text-slate-850 outline-hidden focus:border-indigo-500 font-medium"
                          />
                        </div>

                        {/* Property ID & API Key Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider font-mono">ID de Propiedad (UUID / PMS) *</label>
                            <input
                              type="text"
                              value={channelPropertyIdInput}
                              onChange={(e) => setChannelPropertyIdInput(e.target.value)}
                              placeholder="prop_bkg_8819"
                              className="w-full text-xs font-mono border border-slate-250 rounded-lg p-2.5 bg-white text-slate-850 outline-hidden focus:border-indigo-500 font-medium"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider font-mono">API Key / Authorization Token *</label>
                            <div className="relative">
                              <span className="absolute left-3 top-3 text-slate-400"><Key className="w-3.5 h-3.5" /></span>
                              <input
                                type="password"
                                value={channelApiKeyInput}
                                onChange={(e) => setChannelApiKeyInput(e.target.value)}
                                placeholder="ota_key_live_..."
                                className="w-full text-xs font-mono border border-slate-250 rounded-lg p-2.5 pl-8.5 bg-white text-slate-850 outline-hidden focus:border-indigo-500 font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Webhook Payload URL */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider font-mono">Webhook URL Callback (PMS Receiver)</label>
                            <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1 border border-indigo-120 rounded uppercase font-mono">En tiempo real</span>
                          </div>
                          <input
                            type="text"
                            value={channelWebhookUrlInput}
                            onChange={(e) => setChannelWebhookUrlInput(e.target.value)}
                            className="w-full text-xs font-mono border border-slate-250 rounded-lg p-2.5 bg-slate-50 text-slate-500 outline-hidden focus:border-slate-350"
                          />
                        </div>

                        {/* TEST LOGS TERMINAL DETALLADA */}
                        {channelApiLogs.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-slate-700 font-mono block">Consola de Diagnóstico de Transmisión:</span>
                            <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 text-[10px] font-mono text-slate-300 space-y-1 max-h-[140px] overflow-y-auto shadow-inner select-all">
                              {channelApiLogs.map((log, index) => {
                                let textColor = 'text-slate-300';
                                if (log.includes('[ERROR]')) textColor = 'text-rose-400 font-bold';
                                if (log.includes('[OK]')) textColor = 'text-emerald-400';
                                if (log.includes('[SUCCESS]')) textColor = 'text-emerald-300 font-extrabold';
                                if (log.includes('[HEADERS]')) textColor = 'text-indigo-300';
                                if (log.includes('[HTTPS]')) textColor = 'text-blue-300';

                                return (
                                  <div key={index} className={`${textColor} break-all hover:bg-slate-800/50 p-0.5 rounded transition-all`}>
                                    {log}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => handleTestChannelConnection(chan.id)}
                            disabled={isTestingChannelApi}
                            className="flex-1 text-xs font-bold font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 border border-indigo-150 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isTestingChannelApi ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin"></span>
                                PROBANDO CONEXIÓN...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3" /> PROBAR & AUTENTICAR API
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveChannelConfig(chan.id)}
                            className="flex-1 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                          >
                            ✓ Aplicar & Guardar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Estrategias Inteligentes de Pricing Dinámico</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Establece coeficientes automáticos que incrementen o disminuyan los precios de las habitaciones en el tablero PMS según fluctuaciones estacionales, puentes feriados u ocupación.
                  </p>
                </div>
              </div>

              {/* Botón y Formulario interactivo expandible para agregar un Plan */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowPricingModal(!showPricingModal)}>
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    ¿Deseas agregar una campaña o estrategia tarifaria propia?
                  </span>
                  <button className="text-xs font-bold text-indigo-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-all cursor-pointer">
                    {showPricingModal ? 'Ocultar Formulario' : '+ Crear Nueva Estrategia'}
                  </button>
                </div>

                {showPricingModal && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newPlanName || !newPlanMultiplier) return;
                    handleAddNewPricingPlan(newPlanName, newPlanMultiplier, newPlanDescription || 'Campaña personalizada de pricing dinámico.');
                    setNewPlanName('');
                    setNewPlanMultiplier(1.10);
                    setNewPlanDescription('');
                    setShowPricingModal(false);
                  }} className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">Nombre de la Estrategia *</label>
                      <input 
                        type="text" 
                        required 
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        placeholder="Ej. Promoción de Invierno"
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">Multiplicador Tarifario *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0.50" 
                        max="2.50" 
                        required 
                        value={newPlanMultiplier}
                        onChange={(e) => setNewPlanMultiplier(parseFloat(e.target.value))}
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">Breve Descripción</label>
                      <input 
                        type="text" 
                        value={newPlanDescription}
                        onChange={(e) => setNewPlanDescription(e.target.value)}
                        placeholder="Escribe brevemente el impacto comercial..."
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                    <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowPricingModal(false);
                          setNewPlanName('');
                        }}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer text-[11px]"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 cursor-pointer text-[11px] shadow-3xs"
                      >
                        ✓ Guardar Plan de Tarifas
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pricingPlans.map(plan => (
                  <div 
                    key={plan.id}
                    onClick={() => handleSelectPricingPlan(plan.id)}
                    className={`border rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between ${
                      plan.isActive 
                        ? 'border-indigo-500 bg-indigo-50/20 shadow-xs' 
                        : 'border-slate-150 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-slate-800">{plan.name}</h4>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          plan.isActive 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          RECARGO: {(plan.multiplier >= 1) ? `+${Math.round((plan.multiplier - 1) * 100)}%` : `-${Math.round((1 - plan.multiplier) * 100)}%`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Multiplicador Tarifario:</span>
                      <strong className={`text-sm ${plan.isActive ? 'text-indigo-600' : 'text-slate-700'}`}>
                        x{plan.multiplier}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 text-xs text-emerald-800">
                <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">Efecto del Optimizador de Precios:</span> Al activar un plan de tarifas diferente, las tarifas del tablero principal del PMS se multiplican al instante para mantener un RevPAR automatizado. Pruebe seleccionando el Plan "Fin de Semana Especial" para elevar un 25% las tarifas base.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Base de Datos de Clientes & CRM de Lealtad</h2>
                  <p className="text-xs text-slate-500 mt-1">Estudia los consumos históricos totales, categorías de lealtad y preferencias declaradas por los huéspedes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCRMModal(!showCRMModal)}
                  className="font-mono text-xs px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all cursor-pointer font-bold shrink-0 shadow-3xs"
                >
                  {showCRMModal ? 'Ocultar Formulario' : '+ Registrar Huésped'}
                </button>
              </div>

              {/* Formulario de registro de cliente directo en CRM */}
              {showCRMModal && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide font-mono">Ficha de Registro Completa</h4>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCRMName || !newCRMEmail) return;
                    handleAddNewCRMGuest(
                      newCRMName, 
                      newCRMEmail, 
                      newCRMPhone || '+57 320 123 4567', 
                      newCRMTier, 
                      newCRMPreferencesList.length > 0 ? newCRMPreferencesList : ['Canal Premium']
                    );
                    // Reset
                    setNewCRMName('');
                    setNewCRMEmail('');
                    setNewCRMPhone('');
                    setNewCRMTier('Classic');
                    setNewCRMPreferencesList([]);
                    setShowCRMModal(false);
                  }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">Nombre Completo *</label>
                      <input 
                        type="text" 
                        required 
                        value={newCRMName} 
                        onChange={(e) => setNewCRMName(e.target.value)}
                        placeholder="Ej. Juan de Dios" 
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">Correo Electrónico *</label>
                      <input 
                        type="email" 
                        required 
                        value={newCRMEmail} 
                        onChange={(e) => setNewCRMEmail(e.target.value)}
                        placeholder="ejemplo@correo.com" 
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">Teléfono de Contacto</label>
                      <input 
                        type="text" 
                        value={newCRMPhone} 
                        onChange={(e) => setNewCRMPhone(e.target.value)}
                        placeholder="+57 301 987 6543" 
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase font-mono">Categoría de Membresía</label>
                      <select 
                        value={newCRMTier} 
                        onChange={(e) => setNewCRMTier(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden cursor-pointer"
                      >
                        <option value="Classic">Classic Partner</option>
                        <option value="Silver">Silver VIP</option>
                        <option value="Gold">Gold VIP</option>
                        <option value="Platinum">Platinum Executive</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 md:col-span-4 flex flex-col gap-1">
                      <label className="text-[10px] text-slate-550 font-bold uppercase font-mono">Preferencias y Atenciones Especiales</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newCRMPreference} 
                          onChange={(e) => setNewCRMPreference(e.target.value)}
                          placeholder="Ej. Alérgico al gluten / Prefiere cama extra" 
                          className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            if (newCRMPreference.trim()) {
                              setNewCRMPreferencesList(prev => [...prev, newCRMPreference.trim()]);
                              setNewCRMPreference('');
                            }
                          }}
                          className="px-3 bg-slate-200 border border-slate-300 rounded-lg hover:bg-slate-300 font-bold transition-all text-slate-700 cursor-pointer"
                        >
                          + Agregar
                        </button>
                      </div>
                      
                      {newCRMPreferencesList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {newCRMPreferencesList.map((p, idx) => (
                            <span key={idx} className="flex items-center gap-1.5 bg-slate-100 text-slate-650 px-2 py-0.5 rounded-full text-[10.5px] border border-slate-200">
                              {p}
                              <button 
                                type="button" 
                                onClick={() => setNewCRMPreferencesList(prev => prev.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2 md:col-span-4 justify-end flex gap-2 pt-2 border-t border-slate-200">
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowCRMModal(false);
                          setNewCRMPreferencesList([]);
                        }}
                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-650 font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold shadow-3xs cursor-pointer"
                      >
                        ✓ Confirmar Ficha Cliente
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Filtros de búsqueda CRM en vivo */}
              <div className="flex flex-col md:flex-row gap-3 bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-3xs">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500 font-bold font-mono uppercase block mb-1">Buscar huésped en base de datos</label>
                  <input 
                    type="text" 
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    placeholder="Filtrar por nombre, correo electrónico o teléfono celular..." 
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden shadow-2xs"
                  />
                </div>
                <div className="w-full md:w-[220px]">
                  <label className="text-[10px] text-slate-500 font-bold font-mono uppercase block mb-1">Nivel de Lealtad</label>
                  <select 
                    value={crmTierFilter}
                    onChange={(e) => setCrmTierFilter(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden shadow-2xs cursor-pointer"
                  >
                    <option value="all">Socio de Lealtad (Todos)</option>
                    <option value="Platinum">VIP Platinum Executive</option>
                    <option value="Gold">VIP Gold Member</option>
                    <option value="Silver">VIP Silver Member</option>
                    <option value="Classic">Classic Partner</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white shadow-3xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 font-mono text-slate-500 text-[10px] uppercase tracking-wider">
                      <th className="p-4">Nombre / Contacto</th>
                      <th className="p-4">Correo</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4 text-right">Reservas</th>
                      <th className="p-4 text-right">Gasto Acumulado</th>
                      <th className="p-4">Preferencias Especiales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const query = crmSearch.toLowerCase();
                      const filteredGuests = guests.filter(g => {
                        const matchesSearch = g.name.toLowerCase().includes(query) ||
                          g.email.toLowerCase().includes(query) ||
                          g.phone.toLowerCase().includes(query);
                        const matchesTier = crmTierFilter === 'all' || g.loyaltyTier === crmTierFilter;
                        return matchesSearch && matchesTier;
                      });

                      if (filteredGuests.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">
                              🔍 No se encontraron registros de huéspedes con los criterios indicados. Escribe un valor diferente o presiona "+ Registrar Huésped" para incorporar uno nuevo.
                            </td>
                          </tr>
                        );
                      }

                      return filteredGuests.map(g => {
                        let tagColor = 'bg-slate-100 text-slate-650';
                        if (g.loyaltyTier === 'Platinum') tagColor = 'bg-purple-105 text-purple-700 border border-purple-200';
                        if (g.loyaltyTier === 'Gold') tagColor = 'bg-amber-105 text-amber-700 border border-amber-200';
                        if (g.loyaltyTier === 'Silver') tagColor = 'bg-slate-200 text-slate-800 border border-slate-300';
                        if (g.loyaltyTier === 'Classic') tagColor = 'bg-slate-100 text-slate-600 border border-slate-200';

                        return (
                          <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-850">{g.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{g.phone}</div>
                            </td>
                            <td className="p-4 text-slate-600 font-mono">{g.email}</td>
                            <td className="p-4">
                              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide ${tagColor}`}>
                                {g.loyaltyTier}
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono text-slate-600">{g.reservationsCount}</td>
                            <td className="p-4 text-right font-bold font-mono text-slate-800">${g.totalSpent.toLocaleString()} USD</td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {g.preferences.map(pref => (
                                  <span key={pref} className="text-[10.3px] bg-slate-50 text-slate-500 border border-slate-100 px-1.5 py-0.2 rounded font-mono">
                                    {pref}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'booking' && (
            <BookingWebBuilder 
              rooms={rooms}
              reservations={reservations}
              guests={guests}
              activePlan={activePlan}
              currentHotelId={currentHotelId}
              onAddReservation={handleAddReservation}
              onAddGuest={handleAddGuest}
              onAddRoom={handleAddRoom}
              onDeleteRoom={handleDeleteRoom}
              bookingThemeColor={bookingThemeColor}
              setBookingThemeColor={setBookingThemeColor}
              bookingTitle={bookingTitle}
              setBookingTitle={setBookingTitle}
              bookingIntro={bookingIntro}
              setBookingIntro={setBookingIntro}
              bookingEnablePayments={bookingEnablePayments}
              setBookingEnablePayments={setBookingEnablePayments}
            />
          )}

          {activeTab === 'bi' && (
            <BIRevenuePro 
              rooms={rooms}
              reservations={reservations}
              pricingPlans={pricingPlans}
              activePlan={activePlan}
              currentHotelId={currentHotelId}
              onSelectPricingPlan={handleSelectPricingPlan}
            />
          )}

          {activeTab === 'blueprint' && (
            <SinergiaBlueprintHub />
          )}

          {activeTab === 'config' && (
            <HotelConfigPanel 
              hotels={hotels}
              setHotels={setHotels}
              currentHotelId={currentHotelId}
              setCurrentHotelId={setCurrentHotelId}
              rooms={rooms}
              setRooms={setRooms}
              activeUserProfile={activeUserProfile}
              onClearDemoData={handleClearDemoData}
            />
          )}

          {activeTab === 'saas' && (
            <SinergiaSaaSPanel 
              activeUserProfile={activeUserProfile}
              setActiveUserProfile={setActiveUserProfile}
              profiles={profiles}
              setProfiles={setProfiles}
              rooms={rooms}
              reservations={reservations}
            />
          )}

          {activeTab === 'community' && (
            <SinergiaCommunityPanel 
              currentHotelId={currentHotelId}
              hotels={hotels}
              activeUserProfile={activeUserProfile}
            />
          )}
            </>
          )}
        </div>

        {/* Right Side: Sinergia IA Command Center (Exactly styled like the Active Document workspace of the theme) */}
        {activeTab === 'pms' && (
          <div className="w-full xl:w-[390px] shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden h-[630px] shadow-sm">
            
            {/* Command Center Agent Header Selector */}
            <div className="p-4 border-b border-slate-150 flex flex-col bg-slate-50/80 shrink-0">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Central Multia-Agente Gemini IA</h2>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 rounded px-1.5 py-0.2 animate-pulse uppercase">Google Gemini Activo</span>
                </div>
              </div>

              {/* Selector Buttons for the 4 agents */}
              <div className="grid grid-cols-4 gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                {(['receptionist', 'sales', 'admin', 'housekeeping'] as AgentRole[]).map(role => {
                  const prof = AGENT_PROFILES[role];
                  const isActive = activeAgent === role;
                  return (
                    <button
                      key={role}
                      title={prof.title}
                      onClick={() => handleAgentChange(role)}
                      className={`py-1.5 px-1 text-center rounded-md transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                        isActive 
                          ? `${prof.color} text-white shadow-xs` 
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="text-base">{prof.avatar}</span>
                      <span className="text-[10px] font-bold mt-0.5 truncate max-w-full">{prof.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Agent Brief Card */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-150 text-[11px] leading-snug text-slate-500 shrink-0 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animation-pulse shrink-0"></div>
              <div>
                <strong className="text-slate-700">Asistente {AGENT_PROFILES[activeAgent].name}:</strong>{' '}
                <span className="italic">{AGENT_PROFILES[activeAgent].description}</span>
              </div>
            </div>

            {/* Dialogue Box */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/30 flex flex-col">
              {chatHistory.map((msg) => {
                const isUser = msg.sender === 'user';
                const currentProfile = AGENT_PROFILES[msg.agentRole];
                
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {!isUser && (
                        <span className="text-xs">{currentProfile.avatar}</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isUser ? 'Tú (Gerente)' : `${currentProfile.name} (${currentProfile.title})`} • {msg.timestamp}
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[88%] border ${
                      isUser 
                        ? 'bg-indigo-600 text-white border-indigo-600 rounded-tr-none' 
                        : 'bg-white text-slate-850 border-slate-150 rounded-tl-none shadow-3xs'
                    }`}>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                );
              })}

              {/* Waiting Indicator */}
              {isChatLoading && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs">{AGENT_PROFILES[activeAgent].avatar}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Generando reporte mediante Gemini...</span>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-150 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-3xs">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions Shortcuts prompt */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-150 flex items-center justify-between shrink-0 gap-1.5 overflow-x-auto text-[10px] font-semibold text-slate-500">
              <span className="text-slate-400 font-mono uppercase text-[9px] whitespace-nowrap">Accesos Rápidos:</span>
              <button 
                onClick={() => setChatInput('¿Cuál es la ocupación del hotel y habitaciones libres?')}
                className="bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer text-slate-600 transition-all font-medium whitespace-nowrap"
              >
                📊 KPIs Ocupación
              </button>
              <button 
                onClick={() => setChatInput('¿Hay algún daño o mantenimiento urgente?')}
                className="bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer text-slate-600 transition-all font-medium whitespace-nowrap"
              >
                🔧 Averías u Operación
              </button>
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClearChat}
                title="Limpiar Conversación"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Pregunta a ${AGENT_PROFILES[activeAgent].name} o ingresa comando...`}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
              
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        )}
      </main>

      {/* Dynamic Dashboard Footer */}
      <footer className="bg-slate-900 border-t border-slate-850 p-6 mt-12 text-slate-400 font-sans text-xs shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <SinergiaLogo isDark={true} className="flex items-center gap-1.5" showSubtitle={false} />
            <span className="text-[10px] text-slate-500 font-mono">Hospitality ERP v1.D.S-SaaS</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 text-center md:text-right">
            Propiedad de José Urdaneta • Sinergia Agencia Creativa • Hospedado en Google Cloud Run y Cloud SQL
          </div>
        </div>
      </footer>

      {/* SECURE PIN VERIFICATION GATEWAY MODAL */}
      {profileToVerify && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 relative text-left">
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={() => setProfileToVerify(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold mb-1">Seguridad Sinergia IA</p>
              <h3 className="text-base font-bold">Verificación de Credenciales</h3>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-150 p-3 rounded-2xl text-left">
                <span className="text-3xl">{profileToVerify.avatar}</span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-800 text-xs truncate leading-tight">{profileToVerify.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{profileToVerify.roleLabel}</p>
                  <span className={`inline-block text-[8px] font-mono font-black px-1.5 py-0.5 rounded mt-1.5 leading-none ${profileToVerify.badgeBg}`}>
                    {profileToVerify.membershipBadge}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Introduzca PIN de Autorización (4 Dígitos):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, ''));
                    setPinError(null);
                  }}
                  placeholder="••••"
                  className="w-full text-center tracking-widest text-lg font-bold font-mono border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 rounded-xl py-2.5 bg-slate-50/50"
                  id="security-pin-input"
                  autoFocus
                />
                
                {pinError && (
                  <p className="text-[11px] font-bold text-rose-600 text-center flex items-center justify-center gap-1 mt-1">
                    ⚠️ {pinError}
                  </p>
                )}
              </div>

              {/* Demo PIN code disclosure */}
              <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-3 text-left">
                <button
                  type="button"
                  onClick={() => setShowDemoPins(!showDemoPins)}
                  className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center justify-between w-full transition-all cursor-pointer font-mono outline-hidden"
                >
                  <span>{showDemoPins ? '🔑 Ocultar PINs de demostración' : '🔍 Revelar PINs de demostración'}</span>
                  <span>{showDemoPins ? '▲' : '▼'}</span>
                </button>
                
                {showDemoPins && (
                  <div className="mt-2 text-[10px] text-indigo-900 font-mono space-y-1 bg-white p-2.5 rounded-lg border border-indigo-50">
                    <p className="font-bold text-slate-500 text-[8px] uppercase tracking-wider mb-1.5">Claves autorizadas para la simulación:</p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1.5 border-t border-indigo-50/60">
                      {USER_PROFILES.map(up => (
                        <div key={up.id} className="flex justify-between items-center text-[9px]">
                          <span className="text-slate-550 mr-1 truncate max-w-[80px]">{up.roleLabel.split(' ')[0]}</span>
                          <span className="font-bold bg-indigo-50 border border-indigo-150 rounded px-1 text-indigo-700">{up.pin}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-slate-50 border-t border-slate-150 p-4 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setProfileToVerify(null);
                  setPinInput('');
                  setPinError(null);
                }}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pinInput === profileToVerify.pin) {
                    setActiveUserProfile(profileToVerify);
                    // Redirect tab if not allowed
                    if (!profileToVerify.allowedTabs.includes(activeTab)) {
                      setActiveTab(profileToVerify.allowedTabs[0] as any);
                    }
                    setProfileToVerify(null);
                    setPinInput('');
                    setPinError(null);
                  } else {
                    setPinError('Código PIN de seguridad inválido.');
                    setPinInput('');
                  }
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
