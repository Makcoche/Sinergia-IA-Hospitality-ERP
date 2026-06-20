import { Hotel, Room, Reservation, Guest, MaintenanceTicket, OTAChannel, PricingPlan } from './types';

export const INITIAL_HOTELS: Hotel[] = [
  {
    id: 'hotel-1',
    name: 'Sinergia Luxury Glamping',
    type: 'glamping',
    address: 'Camino del Valle, Km 12, Villa de Leyva',
    description: 'Domos de lujo y tiendas safari con vistas panorámicas a la cordillera y servicio premium de spa privado.',
    rating: 4.9
  },
  {
    id: 'hotel-2',
    name: 'Sinergia Suite Apartments',
    type: 'apartment',
    address: 'Cl. 93 # 12-45, Chicó Norte, Bogotá',
    description: 'Lofts ejecutivos completamente automatizados y equipados para estadías corporativas y nómadas digitales.',
    rating: 4.7
  },
  {
    id: 'hotel-3',
    name: 'Sinergia Resort & Finca',
    type: 'finca',
    address: 'Vereda El Totumo, San Jerónimo, Antioquia',
    description: 'Casa campestrecolonial con piscina desbordante, árboles frutales y zona de barbacoa de uso exclusivo.',
    rating: 4.8
  },
  {
    id: 'hotel-4',
    name: 'Hostal La Ceiba Sinergia',
    type: 'hostel',
    address: 'Medellín, Poblado, Cra 43B # 8-12',
    description: 'Ambiente alternativo y vibrante enfocado en mochileros con espacios de co-working, bar social y hamacas.',
    rating: 4.5
  }
];

export const INITIAL_ROOMS: Room[] = [
  // --- Hotel 1: Glamping
  {
    id: 'h1-r1',
    hotelId: 'hotel-1',
    number: 'Domo 101',
    name: 'Domo Geodésico Celestial',
    type: 'Luxury Dome',
    capacity: 2,
    ratePerNight: 180,
    status: 'occupied',
    amenities: ['Jacuzzi Privado', 'Cama King', 'Telescopio', 'Fogata', 'Desayuno Gourmet', 'Mini-bar']
  },
  {
    id: 'h1-r2',
    hotelId: 'hotel-1',
    number: 'Domo 102',
    name: 'Domo Nebula Astral',
    type: 'Double Dome',
    capacity: 4,
    ratePerNight: 240,
    status: 'available',
    amenities: ['Jacuzzi Privado', '2 Cama Queen', 'Telescopio', 'Malla de catamarán', 'Cata de Vinos']
  },
  {
    id: 'h1-r3',
    hotelId: 'hotel-1',
    number: 'Safari 201',
    name: 'Glamping Safari Forestal',
    type: 'Safari Tent',
    capacity: 2,
    ratePerNight: 150,
    status: 'cleaning',
    amenities: ['Ducha Exterior templada', 'Cama King', 'Deck Privado', 'Cafetera Premium']
  },
  {
    id: 'h1-r4',
    hotelId: 'hotel-1',
    number: 'Safari 202',
    name: 'Glamping Safari Explorer',
    type: 'Safari Tent',
    capacity: 2,
    ratePerNight: 150,
    status: 'maintenance',
    amenities: ['Ducha Exterior', 'Cama King', 'Fogón de Leña', 'Cine Bajo Estrellas']
  },
  {
    id: 'h1-r5',
    hotelId: 'hotel-1',
    number: 'Domo 103',
    name: 'Domo Aurora de la Montaña',
    type: 'Luxury Dome',
    capacity: 2,
    ratePerNight: 195,
    status: 'available',
    amenities: ['Jacuzzi Privado', 'Baño de Lujo', 'Cama King', 'Mini-bar', 'Telescopio']
  },

  // --- Hotel 2: Apartment
  {
    id: 'h2-r1',
    hotelId: 'hotel-2',
    number: 'Apt 301',
    name: 'Studio Penthouse Smart',
    type: 'Executive Loft',
    capacity: 2,
    ratePerNight: 110,
    status: 'occupied',
    amenities: ['Domótica Integrada', 'Wi-Fi 500Mbps', 'Escritorio Ergonómico', 'Cocina Abierta', 'Smart TV 65"']
  },
  {
    id: 'h2-r2',
    hotelId: 'hotel-2',
    number: 'Apt 302',
    name: 'Apartamento Premium Business',
    type: 'Double Suite Loft',
    capacity: 4,
    ratePerNight: 160,
    status: 'available',
    amenities: ['Cama King', 'Cama Doble', '2 Baños', 'Wi-Fi 500Mbps', 'Terraza Balcón']
  },
  {
    id: 'h2-r3',
    hotelId: 'hotel-2',
    number: 'Apt 401',
    name: 'Smart Urban Escape Studio',
    type: 'Executive Loft',
    capacity: 2,
    ratePerNight: 105,
    status: 'cleaning',
    amenities: ['Domótica', 'Wi-Fi Ultra', 'Cocina de Inducción', 'Cama Queen']
  },
  {
    id: 'h2-r4',
    hotelId: 'hotel-2',
    number: 'Apt 402',
    name: 'Suite Presidencial Automatizada',
    type: 'Presidential Suite',
    capacity: 4,
    ratePerNight: 280,
    status: 'available',
    amenities: ['Domótica', 'Cama King', 'Sala de Reuniones', 'Bar Privado', 'Sonido Sonos']
  },

  // --- Hotel 3: Finca
  {
    id: 'h3-r1',
    hotelId: 'hotel-3',
    number: 'Villa Principal',
    name: 'La Casona de San Jerónimo',
    type: 'Luxury Finca Villa',
    capacity: 12,
    ratePerNight: 550,
    status: 'occupied',
    amenities: ['Piscina Privada', 'Kiosko BBQ', 'Mesa de Billar', 'Cocina de Leña', 'Cancha de Fútbol', 'Aire Acondicionado']
  },
  {
    id: 'h3-r2',
    hotelId: 'hotel-3',
    number: 'Cabaña 1',
    name: 'Cabaña de Cocoteros',
    type: 'Sub-villa Cabin',
    capacity: 4,
    ratePerNight: 180,
    status: 'available',
    amenities: ['Deck con Hamacas', 'Baño Privado', 'Aire Acondicionado', 'Minibar']
  },
  {
    id: 'h3-r3',
    hotelId: 'hotel-3',
    number: 'Cabaña 2',
    name: 'Cabaña Jacarandá',
    type: 'Sub-villa Cabin',
    capacity: 6,
    ratePerNight: 220,
    status: 'cleaning',
    amenities: [' Deck con Hamacas', 'Vista al río', 'Baño Privado', 'Cocina Semi-equipada']
  },

  // --- Hotel 4: Hostel
  {
    id: 'h4-r1',
    hotelId: 'hotel-4',
    number: 'Hab 101',
    name: 'Dormitorio Compartido Tribal',
    type: 'Dormitory (8 Beds)',
    capacity: 8,
    ratePerNight: 22,
    status: 'occupied',
    amenities: ['Casilleros Privados', 'Luz de Lectura', 'Cortina de Privacidad', 'Enchufes USB', 'Baño Compartido']
  },
  {
    id: 'h4-r2',
    hotelId: 'hotel-4',
    number: 'Hab 102',
    name: 'Dormitorio Compartido Botánico',
    type: 'Dormitory (6 Beds)',
    capacity: 6,
    ratePerNight: 25,
    status: 'available',
    amenities: ['Casilleros Privados', 'Cortina', 'Luces de Lectura', 'Aire Acondicionado', 'Baño Compartido']
  },
  {
    id: 'h4-r3',
    hotelId: 'hotel-4',
    number: 'Hab 201',
    name: 'Habitación Privada Nómada',
    type: 'Private Standard',
    capacity: 2,
    ratePerNight: 55,
    status: 'occupied',
    amenities: ['Cama Doble', 'Escritorio Pequeño', 'Baño Privado', 'Hamaca en ventana']
  },
  {
    id: 'h4-r4',
    hotelId: 'hotel-4',
    number: 'Hab 202',
    name: 'Habitación Matrimonial Ceiba',
    type: 'Private Deluxe',
    capacity: 2,
    ratePerNight: 70,
    status: 'cleaning',
    amenities: ['Cama Queen', 'Baño Privado', 'Balcón a la Calle', 'Cafetera Express']
  }
];

export const INITIAL_GUESTS: Guest[] = [
  {
    id: 'guest-1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '+57 312 456 7890',
    totalSpent: 1240,
    reservationsCount: 6,
    preferences: ['Domo Celestial', 'Café extra fuerte', 'Check-in temprano'],
    loyaltyTier: 'Gold'
  },
  {
    id: 'guest-2',
    name: 'Maria Helena Gomez',
    email: 'maria.gomez@corp.com',
    phone: '+57 300 987 6543',
    totalSpent: 850,
    reservationsCount: 4,
    preferences: ['Piso alto', 'Silla ergonómica', 'Frutas de bienvenida'],
    loyaltyTier: 'Silver'
  },
  {
    id: 'guest-3',
    name: 'John Smith',
    email: 'john.smith@traveler.org',
    phone: '+1 415 555 2673',
    totalSpent: 320,
    reservationsCount: 1,
    preferences: ['Dormitorio silencioso', 'Pago dividido', 'Recomendación de tours'],
    loyaltyTier: 'Classic'
  },
  {
    id: 'guest-4',
    name: 'Laura Restrepo',
    email: 'laura.rest@gmail.com',
    phone: '+57 311 222 3344',
    totalSpent: 2650,
    reservationsCount: 12,
    preferences: ['Jacuzzi limpio', 'Decoración floral', 'Yoga mat en habitación'],
    loyaltyTier: 'Platinum'
  },
  {
    id: 'guest-5',
    name: 'Santiago Ortiz',
    email: 'santi.ortiz@outlook.com',
    phone: '+57 315 888 9900',
    totalSpent: 750,
    reservationsCount: 3,
    preferences: ['BBQ listo', 'Llegada tarde con claves automáticas'],
    loyaltyTier: 'Silver'
  }
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  // Hotel 1 (Glamping) active guest on Domo 101
  {
    id: 'res-1',
    hotelId: 'hotel-1',
    roomId: 'h1-r1',
    guestName: 'Laura Restrepo',
    guestEmail: 'laura.rest@gmail.com',
    checkIn: '2026-06-16',
    checkOut: '2026-06-19',
    status: 'checked_in',
    guestsCount: 2,
    totalAmount: 540,
    outstandingBalance: 120 // some minibar / spa charges pending
  },
  // Hotel 2 (Apartment) active guest on Apt 301
  {
    id: 'res-2',
    hotelId: 'hotel-2',
    roomId: 'h2-r1',
    guestName: 'Carlos Mendoza',
    guestEmail: 'carlos.mendoza@email.com',
    checkIn: '2026-06-15',
    checkOut: '2026-06-20',
    status: 'checked_in',
    guestsCount: 1,
    totalAmount: 550,
    outstandingBalance: 0
  },
  // Hotel 3 (Finca) active guest on Villa Principal
  {
    id: 'res-3',
    hotelId: 'hotel-3',
    roomId: 'h3-r1',
    guestName: 'Santiago Ortiz',
    guestEmail: 'santi.ortiz@outlook.com',
    checkIn: '2026-06-18',
    checkOut: '2026-06-22',
    status: 'checked_in',
    guestsCount: 8,
    totalAmount: 2200,
    outstandingBalance: 350
  },
  // Hotel 4 (Hostel) active guest on Hab 101
  {
    id: 'res-4',
    hotelId: 'hotel-4',
    roomId: 'h4-r1',
    guestName: 'John Smith',
    guestEmail: 'john.smith@traveler.org',
    checkIn: '2026-06-17',
    checkOut: '2026-06-21',
    status: 'checked_in',
    guestsCount: 1,
    totalAmount: 88,
    outstandingBalance: 15
  },
  // Future booking for Hotel 1 Nebular
  {
    id: 'res-5',
    hotelId: 'hotel-1',
    roomId: 'h1-r2',
    guestName: 'Maria Helena Gomez',
    guestEmail: 'maria.gomez@corp.com',
    checkIn: '2026-06-20',
    checkOut: '2026-06-23',
    status: 'confirmed',
    guestsCount: 3,
    totalAmount: 720,
    outstandingBalance: 720
  },
  // Future booking for Hotel 2 Apt 302
  {
    id: 'res-6',
    hotelId: 'hotel-2',
    roomId: 'h2-r2',
    guestName: 'John Smith',
    guestEmail: 'john.smith@traveler.org',
    checkIn: '2026-06-22',
    checkOut: '2026-06-25',
    status: 'confirmed',
    guestsCount: 2,
    totalAmount: 480,
    outstandingBalance: 480
  }
];

export const INITIAL_TICKETS: MaintenanceTicket[] = [
  {
    id: 't-1',
    hotelId: 'hotel-1',
    roomId: 'h1-r4',
    description: 'Calentador a gas de la ducha exterior no enciende, emite chispa pero no genera llama caliente.',
    priority: 'high',
    status: 'pending',
    reportedDate: '2026-06-17T11:30:00Z'
  },
  {
    id: 't-2',
    hotelId: 'hotel-2',
    roomId: 'h2-r3',
    description: 'Chapa electrónica inteligente no reconoce la huella digital del personal de limpieza, requiere reseteo de bluetooth.',
    priority: 'medium',
    status: 'in_progress',
    reportedDate: '2026-06-18T08:15:00Z'
  }
];

export const INITIAL_CHANNELS: OTAChannel[] = [
  {
    id: 'c-1',
    name: 'Airbnb Sinergia Sync',
    icon: 'Home',
    status: 'connected',
    lastSync: 'Hace 5 minutos',
    rateSyncMultiplier: 1.15, // 15% increase pushed to channel for OTA commissions
    apiKey: 'ab_live_9a4fe89c2cbd49a1d82f76aa01e',
    propertyId: 'prop_airbnb_901124',
    apiUrl: 'https://api.airbnb.com/v2/listings/sync',
    webhookUrl: 'https://sync.sinergia.com/webhooks/airbnb'
  },
  {
    id: 'c-2',
    name: 'Booking.com API',
    icon: 'Building2',
    status: 'connected',
    lastSync: 'Hace 3 minutos',
    rateSyncMultiplier: 1.18,
    apiKey: 'bkg_auth_01ff8933cc4892c2dd8fe90',
    propertyId: 'hotel_bkg_4081192',
    apiUrl: 'https://ota.booking.com/xml/rate_update',
    webhookUrl: 'https://sync.sinergia.com/webhooks/booking'
  },
  {
    id: 'c-3',
    name: 'Expedia Partner Connection',
    icon: 'Plane',
    status: 'connected',
    lastSync: 'Hace 10 minutos',
    rateSyncMultiplier: 1.20,
    apiKey: 'exp_partner_88298dc124b89ff02e3b12a',
    propertyId: 'exp_pms_776102',
    apiUrl: 'https://services.expediapartnercentral.com/v2/inventory',
    webhookUrl: 'https://sync.sinergia.com/webhooks/expedia'
  },
  {
    id: 'c-4',
    name: 'Sinergia Direct Booking Engine',
    icon: 'Globe',
    status: 'connected',
    lastSync: 'En tiempo real',
    rateSyncMultiplier: 1.00, // no commission surcharge
    apiKey: 'sinergia_direct_internal_99812df934c',
    propertyId: 'sinergia_prop_102',
    apiUrl: 'https://api.sinergiahospitality.com/v1/engine/sync',
    webhookUrl: 'https://sync.sinergia.com/webhooks/direct-engine'
  }
];

export const INITIAL_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'p-1',
    name: 'Tarifa Estándar Base',
    description: 'Tarifa regular calculada automáticamente según el inventario diario.',
    multiplier: 1.0,
    isActive: true
  },
  {
    id: 'p-2',
    name: 'Fin de Semana Especial',
    description: 'Incremento automático del 25% aplicable para noches de Viernes y Sábado.',
    multiplier: 1.25,
    isActive: false
  },
  {
    id: 'p-3',
    name: 'Temporada Alta San Pedro y San Pablo',
    description: 'Suplemento festivo del 45% aplicable durante puentes nacionales.',
    multiplier: 1.45,
    isActive: false
  },
  {
    id: 'p-4',
    name: 'Descuento Larga Estadía Promo',
    description: 'Bono del 15% de reducción para reservas de más de 5 noches continuas.',
    multiplier: 0.85,
    isActive: false
  }
];
