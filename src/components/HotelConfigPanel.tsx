import React, { useState, useEffect } from 'react';
import { Hotel, Room, HotelType } from '../types';
import { 
  Building2, Save, Plus, Trash2, Check, Landmark, ShieldCheck, 
  MapPin, Phone, Mail, Award, DollarSign, Clock, HelpCircle, AlertCircle
} from 'lucide-react';

interface HotelConfigPanelProps {
  hotels: Hotel[];
  setHotels: React.Dispatch<React.SetStateAction<Hotel[]>>;
  currentHotelId: string;
  setCurrentHotelId: (id: string) => void;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  activeUserProfile?: any;
  onClearDemoData?: () => void;
}

export default function HotelConfigPanel({
  hotels,
  setHotels,
  currentHotelId,
  setCurrentHotelId,
  rooms,
  setRooms,
  activeUserProfile,
  onClearDemoData
}: HotelConfigPanelProps) {
  const activeHotel = hotels.find(h => h.id === currentHotelId) || hotels[0];

  // Forms for editing current hotel details
  const [name, setName] = useState(activeHotel.name);
  const [type, setType] = useState<HotelType>(activeHotel.type);
  const [address, setAddress] = useState(activeHotel.address);
  const [description, setDescription] = useState(activeHotel.description);
  const [rating, setRating] = useState(activeHotel.rating);

  // Corporate metadata states (with default Fallbacks saved locally)
  const [phone, setPhone] = useState(() => {
    return localStorage.getItem(`hotel_phone_${activeHotel.id}`) || '+52 55 1234 5678';
  });
  const [email, setEmail] = useState(() => {
    return localStorage.getItem(`hotel_email_${activeHotel.id}`) || 'reservas@sinergiaspa.com';
  });
  const [vatId, setVatId] = useState(() => {
    return localStorage.getItem(`hotel_vat_${activeHotel.id}`) || 'NIT-900.231.455-1';
  });
  const [checkInTime, setCheckInTime] = useState(() => {
    return localStorage.getItem(`hotel_checkin_t_${activeHotel.id}`) || '15:00';
  });
  const [checkOutTime, setCheckOutTime] = useState(() => {
    return localStorage.getItem(`hotel_checkout_t_${activeHotel.id}`) || '11:00';
  });
  const [commissionPct, setCommissionPct] = useState<number>(() => {
    return parseFloat(localStorage.getItem(`hotel_commission_${activeHotel.id}`) || '0');
  });

  // Safe tracking of multi-amenities for the current hotel
  const [amenities, setAmenities] = useState<string[]>(() => {
    const saved = localStorage.getItem(`hotel_amenities_${activeHotel.id}`);
    return saved ? JSON.parse(saved) : ['WiFi Premium', 'Spa Privado', 'Restaurante Fusión', 'Aparcamiento Gratuito', 'Pet Friendly'];
  });

  const [newAmenity, setNewAmenity] = useState('');

  // Sinergia New Property Creator panel
  const [showNewPropertyForm, setShowNewPropertyForm] = useState(false);
  const [newPropName, setNewPropName] = useState('');
  const [newPropType, setNewPropType] = useState<HotelType>('glamping');
  const [newPropAddress, setNewPropAddress] = useState('');
  const [newPropDescription, setNewPropDescription] = useState('');
  const [newPropRating, setNewPropRating] = useState<number>(4.8);

  // Status logs
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [roomRegisterNum, setRoomRegisterNum] = useState('');
  const [roomRegisterType, setRoomRegisterType] = useState('');
  const [roomRegisterPrice, setRoomRegisterPrice] = useState('');
  const [roomRegisterCap, setRoomRegisterCap] = useState('');

  const getRoomTypesByMembership = () => {
    const plan = activeUserProfile?.membershipPlan || '';
    if (plan.includes('Essential') || plan.includes('Bronze')) {
      return [
        { value: 'Eco Single', label: '⛺ Eco Single / Glamping Lite (Essential)' },
        { value: 'Eco Cabin', label: '🏡 Eco Cabin / Cabaña Básica (Essential)' },
        { value: 'Habitación Estándar', label: '🏨 Habitación Estándar (Essential)' }
      ];
    } else if (plan.includes('Standard') || plan.includes('Gold')) {
      return [
        { value: 'Habitación Estándar', label: '🏨 Habitación Estándar (Essential)' },
        { value: 'Double Suite', label: '🏨 Double Suite Familiar (Standard)' },
        { value: 'Glamping Safari Suite', label: '⛺ Glamping Safari Suite (Standard)' },
        { value: 'Loft Standard', label: '🏢 Loft Standard (Standard)' }
      ];
    } else if (plan.includes('Pro') || plan.includes('Platinum')) {
      return [
        { value: 'Domo Geodésico Celestial', label: '⛺ Domo Celestial (Pro/Platinum)' },
        { value: 'Glamping Safari Explorer', label: '⛺ Safari Explorer (Pro/Platinum)' },
        { value: 'Executive Loft', label: '🏢 Executive Loft (Pro/Platinum)' },
        { value: 'Suite Presidencial Premium', label: '🏨 Suite Presidencial (Pro/Platinum)' },
        { value: 'Habitación Estándar', label: '🏨 Habitación Estándar' }
      ];
    } else {
      // Enterprise, root, or any other unlimited tier
      return [
        { value: 'Domo Geodésico Celestial', label: '⛺ Domo Celestial (Carbono-14)' },
        { value: 'Glamping Safari Explorer', label: '⛺ Safari Explorer (Safari-VIP)' },
        { value: 'Executive Loft', label: '🏢 Executive Loft Domótico' },
        { value: 'Suite Presidencial Premium', label: '🏨 Suite Presidencial Premium' },
        { value: 'Smart Studio Penthouse', label: '🏢 Smart Studio Penthouse' },
        { value: 'Villa de Lujo Infinite', label: '🏡 Villa de Lujo Infinite' }
      ];
    }
  };

  const roomTypes = getRoomTypesByMembership();

  useEffect(() => {
    if (roomTypes.length > 0) {
      setRoomRegisterType(roomTypes[0].value);
    }
  }, [activeUserProfile]);

  // Update form inputs when selected hotel shifts
  useEffect(() => {
    setName(activeHotel.name);
    setType(activeHotel.type);
    setAddress(activeHotel.address);
    setDescription(activeHotel.description);
    setRating(activeHotel.rating);

    setPhone(localStorage.getItem(`hotel_phone_${activeHotel.id}`) || '+52 55 1234 5678');
    setEmail(localStorage.getItem(`hotel_email_${activeHotel.id}`) || 'reservas@sinergiaspa.com');
    setVatId(localStorage.getItem(`hotel_vat_${activeHotel.id}`) || 'NIT-900.231.455-1');
    setCheckInTime(localStorage.getItem(`hotel_checkin_t_${activeHotel.id}`) || '15:00');
    setCheckOutTime(localStorage.getItem(`hotel_checkout_t_${activeHotel.id}`) || '11:00');
    
    setCommissionPct(parseFloat(localStorage.getItem(`hotel_commission_${activeHotel.id}`) || '0'));
    
    const savedAmenities = localStorage.getItem(`hotel_amenities_${activeHotel.id}`);
    setAmenities(savedAmenities ? JSON.parse(savedAmenities) : ['WiFi Premium', 'Spa Privado', 'Restaurante Fusión', 'Aparcamiento Gratuito', 'Pet Friendly']);
  }, [currentHotelId, activeHotel]);

  // Persists local metadata settings when modified or saved
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();

    // Map through properties list and update the targeted hotel details
    setHotels(prev => prev.map(h => {
      if (h.id === activeHotel.id) {
        return {
          ...h,
          name,
          type,
          address,
          description,
          rating
        };
      }
      return h;
    }));

    // Save metadata back to localStorage
    localStorage.setItem(`hotel_phone_${activeHotel.id}`, phone);
    localStorage.setItem(`hotel_email_${activeHotel.id}`, email);
    localStorage.setItem(`hotel_vat_${activeHotel.id}`, vatId);
    localStorage.setItem(`hotel_checkin_t_${activeHotel.id}`, checkInTime);
    localStorage.setItem(`hotel_checkout_t_${activeHotel.id}`, checkOutTime);
    localStorage.setItem(`hotel_commission_${activeHotel.id}`, commissionPct.toString());
    localStorage.setItem(`hotel_amenities_${activeHotel.id}`, JSON.stringify(amenities));

    setStatusMsg('🚀 ¡Configuración de empresa guardada con éxito en el sistema central!');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleCreateNewProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;

    const freshHotelId = `hotel-${Date.now()}`;
    const freshHotel: Hotel = {
      id: freshHotelId,
      name: newPropName.trim(),
      type: newPropType,
      address: newPropAddress.trim() || 'Dirección por registrar',
      description: newPropDescription.trim() || 'Nueva sede integrada al ecosistema Sinergia Hospitality.',
      rating: newPropRating
    };

    // Save standard defaults for the new property in localStorage
    localStorage.setItem(`hotel_phone_${freshHotelId}`, '+52 55 0000 0000');
    localStorage.setItem(`hotel_email_${freshHotelId}`, `contacto@${newPropName.toLowerCase().replace(/\s+/g, '')}.com`);
    localStorage.setItem(`hotel_vat_${freshHotelId}`, `TAX-${Date.now().toString().slice(-8)}`);
    localStorage.setItem(`hotel_amenities_${freshHotelId}`, JSON.stringify(['WiFi Premium', 'Parking', 'Soporte 24/7']));

    // Append to Hotels array
    setHotels(prev => [...prev, freshHotel]);
    setCurrentHotelId(freshHotelId); // Auto-navigate to the new property

    setNewPropName('');
    setNewPropAddress('');
    setNewPropDescription('');
    setShowNewPropertyForm(false);

    setStatusMsg(`🎉 Nueva sede "${freshHotel.name}" registrada con éxito.`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleAddAmenity = () => {
    if (!newAmenity.trim()) return;
    if (amenities.includes(newAmenity.trim())) return;
    const updated = [...amenities, newAmenity.trim()];
    setAmenities(updated);
    setNewAmenity('');
  };

  const handleRemoveAmenity = (index: number) => {
    const updated = amenities.filter((_, i) => i !== index);
    setAmenities(updated);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs text-slate-800 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 border border-indigo-150 p-1.5 rounded-lg text-indigo-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-905">Configuración de Empresa & Sedes</h1>
              <p className="text-xs text-slate-500">Maneja la información legal, operativa, y de marca para tus hoteles en Sinergia-PMS.</p>
            </div>
          </div>
        </div>
        

      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold font-mono tracking-wide animate-in fade-in slide-in-from-top-1 text-left flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600 bg-emerald-100 p-0.5 rounded-full" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Left Side fields: Core Config Form */}
        <div className="lg:col-span-8 space-y-5">
          <form onSubmit={handleSaveConfig} className="space-y-5">
            
            {/* Section 1: Marca & Categoría */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-3">
              <h3 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                🏢 1. Identidad de la Marca / Establecimiento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Nombre de Empresa o Hotel</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-505 rounded-lg p-2 text-xs" 
                    required 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Categoría de Propiedad</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value as HotelType)}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-505 rounded-lg p-2 text-xs"
                  >
                    <option value="glamping">⛺ Glamping / Domo de Lujo</option>
                    <option value="hotel">🏨 Hotel Tradicional / Boutique</option>
                    <option value="apartment">🏢 Lofts Ejecutivos / Apartamentos</option>
                    <option value="finca">🏡 Finca de Turismo / Casa de Campo</option>
                    <option value="hostel">🎒 Hostal Urbano / Social</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Slogan o Breve Introducción Comercial</label>
                <textarea 
                  rows={2}
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-505 rounded-lg p-2 text-xs resize-none"
                  placeholder="Detalles de hospitalidad..."
                />
              </div>
            </div>

            {/* Section 2: Contacto & Datos Legales */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-3">
              <h3 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                🗺️ 2. Canales de Comunicación & Datos Tributarios
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Dirección Satelital / Ubicación</label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-8 text-xs" 
                      placeholder="Km o sector rural..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">WhatsApp Directo Clientes</label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-450" />
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-8 text-xs font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Email Corporativo Oficial</label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-450" />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-8 text-xs" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">NIT / RFC / ID Impuesto Legal</label>
                  <div className="relative">
                    <Landmark className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-450" />
                    <input 
                      type="text" 
                      value={vatId} 
                      onChange={(e) => setVatId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-8 text-xs font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Retención Fiscal de Agente (%)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-450 font-bold">%</span>
                    <input 
                      type="number" 
                      min={0}
                      max={50}
                      step={0.5}
                      value={commissionPct} 
                      onChange={(e) => setCommissionPct(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-7 text-xs font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Calificación de Reputación Social</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-amber-500">★</span>
                    <input 
                      type="number" 
                      min={1} 
                      max={5} 
                      step={0.1}
                      value={rating} 
                      onChange={(e) => setRating(parseFloat(e.target.value) || 4.8)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-7 text-xs font-mono" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Reglas de Entrada, Salida y Amenidades */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-3">
              <h3 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                🌟 3. Operatividad Interna & Amenidades
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Horario Estándar de Check-In (Llegada)</label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      value={checkInTime} 
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-8 text-xs font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Horario Estándar de Check-Out (Salida)</label>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      value={checkOutTime} 
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-8 text-xs font-mono" 
                    />
                  </div>
                </div>
              </div>

              {/* Amenity tagging pool */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Gestionar Amenidades Oficiales de la Marca</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    placeholder="Ej: Spa Privado, Bodega de Vinos, Jacuzzi Exterior..."
                    className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-0.5 focus:ring-indigo-500 outline-hidden"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddAmenity}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-[10px] uppercase p-1.5 px-3 rounded-lg transition-all cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 md:gap-1.5 mt-2">
                  {amenities.map((amenity, idx) => (
                    <span 
                      key={idx} 
                      className="bg-white border border-slate-200 text-slate-700 text-[10px] font-medium p-1 px-2.5 rounded-full flex items-center gap-1.5 shadow-3xs"
                    >
                      <span>✨ {amenity}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAmenity(idx)} 
                        className="text-slate-400 hover:text-rose-600 font-bold text-[9px] leading-none"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 4: Configuración de Tarifas y Precios (Colocar Precios) */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-500">
                  💸 4. Configurar Precios & Tarifas por Habitación
                </h3>
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-md font-mono font-bold">
                  {rooms.filter(r => r.hotelId === activeHotel.id).length} Unidades
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Ajusta los precios base por noche ($ USD / equivalente) y la capacidad máxima de tus habitaciones de esta sede. Estos cambios actualizan directamente el Motor de Reservas y el PMS central en tiempo real.
              </p>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {rooms.filter(r => r.hotelId === activeHotel.id).map(room => (
                  <div key={room.id} className="bg-white border border-slate-150 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs hover:border-slate-300 transition-all">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          🛏️ Unidad / Núm: {room.number}
                        </span>
                        <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold px-1.5 py-0.2 rounded uppercase">
                          {room.type}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono italic block">Nombre: {room.name || 'Sin nombre'}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Price per night */}
                      <div className="space-y-0.5">
                        <label className="text-[8px] text-slate-400 font-extrabold uppercase font-mono block">Precio / Noche ($)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">$</span>
                          <input 
                            type="number" 
                            min={1} 
                            value={room.ratePerNight} 
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setRooms(prev => prev.map(r => r.id === room.id ? { ...r, ratePerNight: val } : r));
                            }}
                            className="bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg p-1.5 pl-6.5 w-24 text-xs font-mono font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Capacity */}
                      <div className="space-y-0.5">
                        <label className="text-[8px] text-slate-400 font-extrabold uppercase font-mono block">Pax Max</label>
                        <input 
                          type="number" 
                          min={1} 
                          max={16}
                          value={room.capacity} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setRooms(prev => prev.map(r => r.id === room.id ? { ...r, capacity: val } : r));
                          }}
                          className="bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg p-1.5 w-16 text-xs font-mono font-bold text-center text-slate-800 focus:ring-1 focus:ring-indigo-505"
                        />
                      </div>

                      {/* Delete room unit */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Estás seguro de que deseas eliminar la unidad ${room.number} y todas sus tarifas vigentes?`)) {
                            setRooms(prev => prev.filter(r => r.id !== room.id));
                          }
                        }}
                        className="bg-rose-50 hover:bg-rose-100 border border-slate-200 p-1.5 rounded-lg text-rose-600 self-end transition-all cursor-pointer hover:border-rose-200"
                        title="Eliminar Habitación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {rooms.filter(r => r.hotelId === activeHotel.id).length === 0 && (
                  <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-1">
                    <AlertCircle className="w-5 h-5 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Esta sede aún no cuenta con habitaciones en su inventario.</p>
                  </div>
                )}
              </div>

              {/* Add room directly on this config panel */}
              <div className="bg-white border border-slate-150 rounded-xl p-3 space-y-3">
                <h4 className="text-[10px] font-mono font-extrabold uppercase text-indigo-700">
                  🔌 Registrar Nueva Habitación con Tarifa Configurada
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold font-mono uppercase block">Nº de Unidad</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Suite 5" 
                      id="input-new-room-num"
                      value={roomRegisterNum}
                      onChange={(e) => setRoomRegisterNum(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold font-mono uppercase block">Estilo / Tipo Adquirido</label>
                    <select 
                      id="input-new-room-type"
                      value={roomRegisterType}
                      onChange={(e) => setRoomRegisterType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 cursor-pointer font-sans"
                    >
                      {roomTypes.map(rt => (
                        <option key={rt.value} value={rt.value}>
                          {rt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold font-mono uppercase block">Precio x Noche ($)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 150" 
                      id="input-new-room-price"
                      value={roomRegisterPrice}
                      onChange={(e) => setRoomRegisterPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold font-mono uppercase block">Capacidad Pax</label>
                    <input 
                      type="number" 
                      placeholder="2" 
                      id="input-new-room-cap"
                      value={roomRegisterCap}
                      onChange={(e) => setRoomRegisterCap(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => {
                    if (!roomRegisterNum || !roomRegisterPrice) {
                      alert('Por favor ingresa al menos el número de habitación y la tarifa de precio por noche.');
                      return;
                    }

                    const newObj: Room = {
                      id: `room-${Date.now()}`,
                      hotelId: activeHotel.id,
                      number: roomRegisterNum,
                      name: `${roomRegisterType} ${roomRegisterNum}`,
                      type: roomRegisterType || 'Estándar',
                      capacity: parseInt(roomRegisterCap) || 2,
                      ratePerNight: parseFloat(roomRegisterPrice) || 120,
                      status: 'available',
                      amenities: []
                    };

                    setRooms(prev => [...prev, newObj]);
                    
                    // Clean fields
                    setRoomRegisterNum('');
                    setRoomRegisterPrice('');
                    setRoomRegisterCap('');
                  }}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-850 font-mono font-bold text-[9px] uppercase tracking-wider py-2 rounded-lg border border-indigo-200 border-dashed transition-all cursor-pointer"
                >
                  ✓ Registrar Unidad con Precio Configurado
                </button>
              </div>
            </div>

            {/* Purga de Datos de Demostración Card */}
            {onClearDemoData && (
              <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-xl space-y-2.5 mt-2">
                <div className="flex gap-2">
                  <span className="p-1.5 bg-rose-500/10 border border-rose-250/15 text-rose-700 rounded-lg h-fit">
                    <Trash2 className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                      🧹 Base de Datos del Sistema: Purga de Datos Demo
                    </h4>
                    <p className="text-[10.5px] text-rose-700 mt-1 leading-relaxed">
                      ¿Deseas iniciar tu operación de forma limpia? Esto eliminará de forma irreversible todas las reservas ficticias de prueba, incidentes simulados de soporte, chats virtuales, historiales de limpieza sábanas y turnos simulados para que inicies con la operación 100% real de tu negocio.
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres borrar todos los datos de demostración? Esta acción purgará todo el libro de reservaciones, clientes y bitácoras simuladas.')) {
                      onClearDemoData();
                    }
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg cursor-pointer transition-colors shadow-2xs"
                >
                  ✓ Confirmar y Borrar todos los Datos de Demostración
                </button>
              </div>
            )}

            {/* Action Save Button */}
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-sm hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios de Propiedad en Servidor Sinergia Central
            </button>
          </form>
          
          {/* Section: Add a brand new hotel venue */}
          <div className="border-t border-slate-100 pt-5 mt-6 text-left">
            {!showNewPropertyForm ? (
              <button
                type="button"
                onClick={() => setShowNewPropertyForm(true)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-250 border-dashed rounded-xl p-4 w-full text-center text-xs font-bold font-mono transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                ⚡ Agregar y Registrar una Nueva Sede / Hotel al Portafolio
              </button>
            ) : (
              <div className="bg-emerald-50/55 border border-emerald-200 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-1">
                <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                  <h3 className="font-mono font-black text-xs text-emerald-900 uppercase">🏢 Alta de Nueva Propiedad / Franquicia</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowNewPropertyForm(false)} 
                    className="text-slate-400 hover:text-rose-600 font-bold text-xs"
                  >
                    ✕ Cancelar
                  </button>
                </div>
                
                <form onSubmit={handleCreateNewProperty} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9.5px] text-emerald-800 font-bold uppercase font-mono block">Nombre de la Sede</label>
                      <input 
                        type="text" 
                        required 
                        value={newPropName}
                        onChange={(e) => setNewPropName(e.target.value)}
                        placeholder="Ej: Sinergia Mountain Cabin"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9.5px] text-emerald-800 font-bold uppercase font-mono block">Estilo Operativo</label>
                      <select 
                        value={newPropType}
                        onChange={(e) => setNewPropType(e.target.value as HotelType)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                      >
                        <option value="glamping">⛺ Glamping / Domos</option>
                        <option value="hotel">🏨 Hotel Tradicional</option>
                        <option value="apartment">🏢 Lofts / Airbnb</option>
                        <option value="finca">🏡 Finca / Recreacional</option>
                        <option value="hostel">🎒 Hostal / Albergue</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] text-emerald-800 font-bold uppercase font-mono block">Dirección / Localización Satelital</label>
                    <input 
                      type="text" 
                      value={newPropAddress}
                      onChange={(e) => setNewPropAddress(e.target.value)}
                      placeholder="Ej: Vía los Nevados, Km 3, Manizales"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] text-emerald-800 font-bold uppercase font-mono block">Descripción del Lugar (Marketing)</label>
                    <textarea 
                      rows={2}
                      value={newPropDescription}
                      onChange={(e) => setNewPropDescription(e.target.value)}
                      placeholder="Breve reseña turística..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold py-2.5 rounded-lg text-xs uppercase shadow-3xs transition-all cursor-pointer"
                  >
                    ✓ Dar de Alta e Inyectar en Base de Datos de Sinergia
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Side visual panels: Brand showcase & Sinergia Quality Seal */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Selected Brand Visualizer Card */}
          <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-md border border-slate-800 text-left select-none relative">
            <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-xs border border-white/10 px-2 py-0.5 rounded font-mono text-[8px] tracking-wider font-extrabold uppercase">
              VISTA PREVIA DE MARCA
            </div>
            
            {/* Ambient pattern header */}
            <div className="h-20 bg-gradient-to-br from-indigo-850 via-slate-900 to-indigo-950 p-4 flex flex-col justify-end">
              <span className="text-[8px] font-black uppercase tracking-wider font-mono bg-white/20 text-white px-1.5 py-0.2 rounded w-fit mb-1">
                {type}
              </span>
              <h4 className="text-sm font-black font-sans leading-none truncate">{name || 'Sin Nombre'}</h4>
            </div>

            <div className="p-4 space-y-3.5 text-xs text-slate-300">
              <p className="text-[10px] text-slate-400 italic leading-snug line-clamp-3">
                "{description || 'Añade una descripción comercial para inspirar a tus huéspedes directos...'}"
              </p>
              
              <div className="space-y-1.5 text-[10px] border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase font-mono font-bold tracking-wider">Ubicación:</span>
                  <span className="text-slate-200 font-medium text-right truncate max-w-[70%]">{address || 'No especificada'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase font-mono font-bold tracking-wider">Línea de Reserva:</span>
                  <span className="text-indigo-400 font-mono font-bold">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase font-mono font-bold tracking-wider">Soporte Email:</span>
                  <span className="text-slate-200 font-mono">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase font-mono font-bold tracking-wider">Registro Fiscal:</span>
                  <span className="text-slate-200 font-mono font-bold">{vatId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase font-mono font-bold tracking-wider">Check-In / Out:</span>
                  <span className="text-slate-200 font-semibold">{checkInTime} / {checkOutTime}</span>
                </div>
              </div>

              {/* Status metrics footer */}
              <div className="bg-slate-950 rounded-xl p-2.5 flex justify-between items-center text-center">
                <div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase block leading-none mb-0.5">Inventario</span>
                  <span className="text-xs font-mono font-extrabold text-white">
                    {rooms.filter(r => r.hotelId === activeHotel.id).length} habs
                  </span>
                </div>
                <div className="h-5 w-[1px] bg-slate-800"></div>
                <div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase block leading-none mb-0.5">Retención</span>
                  <span className="text-xs font-mono font-extrabold text-emerald-450">{commissionPct}%</span>
                </div>
                <div className="h-5 w-[1px] bg-slate-800"></div>
                <div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase block leading-none mb-0.5">Puntaje</span>
                  <span className="text-xs font-mono font-extrabold text-amber-500">★ {rating}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sinergia Plaque credentials */}
          <div className="bg-gradient-to-tr from-indigo-50/55 to-slate-50 border border-indigo-150 rounded-2xl p-5 text-left space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-700 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-700 font-mono tracking-wider">Garantía Sinergia Verified</h4>
                <p className="text-[10px] text-slate-450 block leading-none mt-0.5">Verificación de Establecimiento Autorizado</p>
              </div>
            </div>
            
            <p className="text-[10.5px] text-slate-600 leading-normal">
              Esta empresa está enlazada de forma segura al libro de contabilidad descentralizado de <strong className="text-indigo-650">Sinergia Real-Time Engine</strong>. Todas las reservas generadas desde el **Motor Web Autónomo** se bloquean con encriptación SSL y se guardan directamente en el PMS.
            </p>

            <div className="p-3 bg-white border border-indigo-100 rounded-xl flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-indigo-700 bg-indigo-50 p-1.5 rounded-full shrink-0" />
              <div className="text-[9.5px] font-mono text-slate-500 leading-tight">
                <div>Empresa: <span className="font-bold text-slate-850 truncate inline-block max-w-[120px] align-bottom">{name}</span></div>
                <div>Estado: <span className="text-emerald-600 font-black">✓ CONECTADA Y ACTIVA</span></div>
                <div>Ref Licencia: <span className="text-indigo-750 font-bold">SIN-{activeHotel.id.toUpperCase()}</span></div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
