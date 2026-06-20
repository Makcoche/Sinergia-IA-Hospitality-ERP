import React, { useState } from 'react';
import { Room, Reservation, Guest, PricingPlan } from '../types';
import { 
  Building2, Globe, Sliders, CheckSquare, Laptop, 
  CreditCard, ShieldCheck, CheckCircle2, Ticket, Users, 
  Calendar, Layers, Sparkles, Star, AlertCircle,
  Code, RefreshCw, Send, Check, Copy, Settings,
  Link, HelpCircle, ArrowRight, Eye, Play, Server, Database
} from 'lucide-react';

interface BookingWebBuilderProps {
  rooms: Room[];
  reservations: Reservation[];
  guests: Guest[];
  activePlan: PricingPlan;
  currentHotelId: string;
  onAddReservation: (res: any) => void;
  onAddGuest: (guest: Guest) => void;
  onAddRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  bookingThemeColor: 'indigo' | 'emerald' | 'violet' | 'amber' | 'slate';
  setBookingThemeColor: (color: any) => void;
  bookingTitle: string;
  setBookingTitle: (title: string) => void;
  bookingIntro: string;
  setBookingIntro: (intro: string) => void;
  bookingEnablePayments: boolean;
  setBookingEnablePayments: (val: boolean) => void;
}

export default function BookingWebBuilder({
  rooms,
  reservations,
  guests,
  activePlan,
  currentHotelId,
  onAddReservation,
  onAddGuest,
  onAddRoom,
  onDeleteRoom,
  bookingThemeColor,
  setBookingThemeColor,
  bookingTitle,
  setBookingTitle,
  bookingIntro,
  setBookingIntro,
  bookingEnablePayments,
  setBookingEnablePayments
}: BookingWebBuilderProps) {

  // Booking flow states
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>('2026-06-20');
  const [nights, setNights] = useState<number>(3);
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('09/29');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [guestPaymentOption, setGuestPaymentOption] = useState<'card' | 'transfer' | 'paypal' | 'crypto' | 'reception'>('card');
  
  // Real Enterprise Booking States updated according to major platforms (Promo codes, Upgrades/Addons, Multi-currency)
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromoDiscount, setAppliedPromoDiscount] = useState<number>(0);
  const [appliedPromoLabel, setAppliedPromoLabel] = useState<string>('');
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'COP' | 'MXN'>('USD');

  const [addons, setAddons] = useState<{ id: string; name: string; desc: string; pricePerDay: number; mode: string }[]>(() => {
    const saved = localStorage.getItem('sinergia_addons');
    return saved ? JSON.parse(saved) : [
      { id: 'breakfast', name: '🍳 Desayuno Criollo de Campo', desc: 'Ingredientes orgánicos de fincas asociadas', pricePerDay: 12, mode: 'per_day' },
      { id: 'shuttle', name: '🚗 Shuttle Privado (Aeropuerto)', desc: 'Servicio puerta a puerta en SUV privado', pricePerDay: 45, mode: 'fixed' },
      { id: 'jacuzzi', name: '🌌 Kit Jacuzzi Nocturno Romántico', desc: 'Decoración con pétalos, sales minerales y vino premium', pricePerDay: 35, mode: 'fixed' },
      { id: 'late_checkout', name: '⏳ Late Check-Out (Hasta 4:00 PM)', desc: 'Extiende tu salida garantizada', pricePerDay: 25, mode: 'fixed' }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('sinergia_addons', JSON.stringify(addons));
  }, [addons]);

  const CURRENCY_RATES = {
    USD: 1,
    EUR: 0.92,
    COP: 4100,
    MXN: 17.5
  };

  const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    COP: 'COP$',
    MXN: 'MXN$'
  };

  const formatPrice = (amountInUSD: number) => {
    const converted = Math.round(amountInUSD * CURRENCY_RATES[selectedCurrency]);
    if (selectedCurrency === 'COP') {
      return `${CURRENCY_SYMBOLS.COP} ${converted.toLocaleString('es-CO')}`;
    }
    if (selectedCurrency === 'MXN') {
      return `${CURRENCY_SYMBOLS.MXN} ${converted.toLocaleString('es-MX')}`;
    }
    if (selectedCurrency === 'EUR') {
      return `${converted.toLocaleString('de-DE')}${CURRENCY_SYMBOLS.EUR}`;
    }
    return `${CURRENCY_SYMBOLS.USD}${converted} USD`;
  };

  const handleApplyPromoCode = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'SINERGIA15' || code === 'WELCOME15') {
      setAppliedPromoDiscount(15);
      setAppliedPromoLabel(code);
      setErrorMessage(null);
    } else if (code === 'GLOBAL10' || code === 'VERANO10') {
      setAppliedPromoDiscount(10);
      setAppliedPromoLabel(code);
      setErrorMessage(null);
    } else if (code === 'CORP20' || code === 'DESCUENTO20') {
      setAppliedPromoDiscount(20);
      setAppliedPromoLabel(code);
      setErrorMessage(null);
    } else {
      setAppliedPromoDiscount(0);
      setAppliedPromoLabel('');
      setErrorMessage("⚠️ Código de descuento inválido o expirado. Prueba con 'SINERGIA15', 'GLOBAL10' o 'CORP20'.");
    }
  };

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  // Helper to compute total in USD
  const getSubtotalUSD = () => {
    if (!selectedRoomDetails) return 0;
    const finalRate = Math.round(selectedRoomDetails.ratePerNight * activePlan.multiplier);
    return finalRate * nights;
  };

  const getAddonsTotalUSD = () => {
    let sum = 0;
    selectedAddonIds.forEach(id => {
      const addon = addons.find(a => a.id === id);
      if (addon) {
        if (addon.mode === 'per_day') {
          sum += addon.pricePerDay * nights;
        } else {
          sum += addon.pricePerDay;
        }
      }
    });
    return sum;
  };

  const getDiscountAmountUSD = () => {
    const subtotal = getSubtotalUSD();
    return Math.round((subtotal * appliedPromoDiscount) / 100);
  };

  const getTotalAmountUSD = () => {
    const subtotal = getSubtotalUSD();
    const addons = getAddonsTotalUSD();
    const discount = getDiscountAmountUSD();
    return Math.max(0, subtotal + addons - discount);
  };
  
  // Custom configurable checkout fields in autonomous mode
  const [customFields, setCustomFields] = useState({
    askWhatsapp: true,
    askDietPref: false,
    askArrivalHour: true
  });
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('15:00');
  const [dietary, setDietary] = useState<string>('');

  // Dynamic Configuration Forms for Rooms & Addons in Live Preview
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomType, setNewRoomType] = useState('Standard');
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(2);
  const [newRoomRate, setNewRoomRate] = useState<number>(120);

  const [showAddAddonForm, setShowAddAddonForm] = useState(false);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonDesc, setNewAddonDesc] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState<number>(20);
  const [newAddonMode, setNewAddonMode] = useState<'per_day' | 'fixed'>('fixed');

  const handleAddNewRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;
    
    const freshRoom: Room = {
      id: `room-${Date.now()}`,
      hotelId: currentHotelId,
      number: newRoomNumber.trim(),
      name: `Habitación ${newRoomNumber.trim()}`,
      type: newRoomType,
      capacity: newRoomCapacity,
      ratePerNight: newRoomRate,
      status: 'available',
      amenities: ['WiFi Premium', 'Aire Acondicionado', 'Jacuzzi Exterior']
    };

    onAddRoom(freshRoom);
    setNewRoomNumber('');
    setShowAddRoomForm(false);
  };

  const handleAddNewAddonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddonName.trim()) return;

    const freshAddon = {
      id: `addon-${Date.now()}`,
      name: newAddonName.trim(),
      desc: newAddonDesc.trim() || 'Servicio complementario premium.',
      pricePerDay: newAddonPrice,
      mode: newAddonMode
    };

    setAddons(prev => [...prev, freshAddon]);
    setNewAddonName('');
    setNewAddonDesc('');
    setNewAddonPrice(20);
    setShowAddAddonForm(false);
  };
  const [successRedirectUrl, setSuccessRedirectUrl] = useState<string>('https://mi-portal.com/reserva-confirmada');

  // Interactive UI states for checkouts
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'verifying' | 'charging' | 'finished'>('idle');
  const [lastCreatedResId, setLastCreatedResId] = useState<string | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

  const checkLuhn = (num: string) => {
    let sum = 0;
    let double = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let d = parseInt(num.charAt(i));
      if (isNaN(d)) continue;
      if (double) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      double = !double;
    }
    return sum > 0 && sum % 10 === 0;
  };

  const getCardType = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    if (cleanNum.startsWith('4')) return 'visa';
    if (cleanNum.startsWith('5')) return 'mastercard';
    if (cleanNum.startsWith('34') || cleanNum.startsWith('37')) return 'amex';
    return 'generic';
  };

  const formatCardNumber = (num: string) => {
    const clean = num.replace(/\D/g, '');
    const segments = [];
    for (let i = 0; i < clean.length; i += 4) {
      segments.push(clean.substring(i, i + 4));
    }
    while (segments.length < 4) {
      segments.push('••••');
    }
    return segments.map((seg, idx) => {
      const padded = seg.padEnd(4, '•');
      return padded;
    }).join(' ');
  };

  const playCheckoutChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain2.gain.setValueAtTime(0.12, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn("Chime playback skipped:", e);
    }
  };

  // Widget settings
  const [widgetLanguage, setWidgetLanguage] = useState<'es' | 'en'>('es');
  const [widgetIncludeTitle, setWidgetIncludeTitle] = useState<boolean>(true);
  const [copiedText, setCopiedText] = useState<'widget' | 'iframe' | 'webhook' | 'api' | 'token' | null>(null);

  // Webhook integration state
  const [webhookUrl, setWebhookUrl] = useState<string>('https://api.sistema-externo.com/v1/recibir-reserva-sinergia');
  const [webhookEvents, setWebhookEvents] = useState({
    onBookingCreated: true,
    onBookingCancelled: false,
    onManualRefund: true,
  });
  const [webhookLogs, setWebhookLogs] = useState<Array<{ id: string; timestamp: string; event: string; status: number; payload: any }>>([
    {
      id: 'log-direct-101',
      timestamp: '11:15:32 AM',
      event: 'booking.created',
      status: 200,
      payload: {
        event: "booking.created",
        hotelId: currentHotelId,
        bookingId: "res-direct-4530",
        amount: 380,
        currency: "USD",
        guestName: "Roberto Gómez (Demo)",
        guestEmail: "roberto@ejemplo.com",
        checkIn: "2026-06-25",
        nights: 2,
        metadata: {
          integration: "Sinergia Webhook Direct V1",
          custom_whatsapp: "+57 322 984 1234",
          dietary_needs: "Vegetariano"
        }
      }
    }
  ]);
  const [selectedLogId, setSelectedLogId] = useState<string>('log-direct-101');
  const [testWebhookStatus, setTestWebhookStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  // API credentials
  const [apiBearerToken, setApiBearerToken] = useState<string>(`sk_sinergia_live_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);

  // Filter only rooms for active hotel
  const hotelRooms = rooms.filter(r => r.hotelId === currentHotelId);
  const availableRooms = hotelRooms.filter(r => r.status === 'cleaning' || r.status === 'available'); 
  const selectedRoomDetails = rooms.find(r => r.id === selectedRoomId);

  // Compute colors based on selected theme
  const getThemeClasses = () => {
    switch(bookingThemeColor) {
      case 'emerald':
        return {
          primary: 'bg-emerald-650 hover:bg-emerald-700 bg-emerald-600',
          ring: 'focus:ring-emerald-500',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          bgLight: 'bg-emerald-50',
          bgMedium: 'bg-emerald-600/10'
        };
      case 'violet':
        return {
          primary: 'bg-violet-650 hover:bg-violet-700 bg-violet-600',
          ring: 'focus:ring-violet-500',
          text: 'text-violet-700',
          border: 'border-violet-200',
          bgLight: 'bg-violet-50',
          bgMedium: 'bg-violet-600/10'
        };
      case 'amber':
        return {
          primary: 'bg-amber-650 hover:bg-amber-700 bg-amber-650',
          ring: 'focus:ring-amber-500',
          text: 'text-amber-700',
          border: 'border-amber-200',
          bgLight: 'bg-amber-50',
          bgMedium: 'bg-amber-600/10'
        };
      case 'slate':
        return {
          primary: 'bg-slate-750 hover:bg-slate-800 bg-slate-700',
          ring: 'focus:ring-slate-500',
          text: 'text-slate-800',
          border: 'border-slate-300',
          bgLight: 'bg-slate-100',
          bgMedium: 'bg-slate-205'
        };
      default:
        return {
          primary: 'bg-indigo-650 hover:bg-indigo-700 bg-indigo-600',
          ring: 'focus:ring-indigo-500',
          text: 'text-indigo-700',
          border: 'border-indigo-200',
          bgLight: 'bg-indigo-50',
          bgMedium: 'bg-indigo-600/10'
        };
    }
  };

  const themeCls = getThemeClasses();

  // Copy text helper
  const triggerCopyNotification = (text: string, type: 'widget' | 'iframe' | 'webhook' | 'api' | 'token') => {
    try {
      navigator.clipboard.writeText(text);
    } catch (e) {
      // Fallback
    }
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Webhook tester simulation
  const handleTriggerTestWebhook = () => {
    setTestWebhookStatus('sending');
    setTimeout(() => {
      setTestWebhookStatus('success');
      const testId = `log-test-${Math.floor(100 + Math.random() * 900)}`;
      const freshLog = {
        id: testId,
        timestamp: new Date().toLocaleTimeString(),
        event: 'booking.test_event',
        status: 200,
        payload: {
          event: "booking.test_event",
          ping: "ok",
          triggeredAt: new Date().toISOString(),
          webhookUrl: webhookUrl,
          hotelName: hotelsMap[currentHotelId] || "Sinergia Luxury",
          samplePayload: {
            authMessage: "Integridad validada con firma Sinergia-Auth-V1",
            latencyMs: 120
          }
        }
      };
      setWebhookLogs(prev => [freshLog, ...prev]);
      setSelectedLogId(testId);
      setTimeout(() => setTestWebhookStatus('idle'), 2500);
    }, 1200);
  };

  // Hotel naming fallback map
  const hotelsMap: Record<string, string> = {
    'hotel-1': 'Sinergia Luxury Glamping',
    'hotel-2': 'Sinergia Suite Hoteles',
    'hotel-3': 'Finca Sinergia Cafetera'
  };

  // Handle direct booking submit
  const handlePerformDirectBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      setErrorMessage("Por favor, selecciona una habitación disponible para tu estadía.");
      return;
    }
    if (!guestName || !guestEmail) {
      setErrorMessage("Los datos de contacto del huésped son obligatorios.");
      return;
    }
    if (bookingEnablePayments && guestPaymentOption === 'card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (!cleanCard || cleanCard.length < 13) {
        setErrorMessage("Debes introducir un número de tarjeta de crédito válido de 13 a 16 dígitos.");
        return;
      }
      if (!checkLuhn(cleanCard)) {
        setErrorMessage("🔒 ¡Error de Seguridad en Pasarela Stripe Sandbox! El número de tarjeta ingresado no supera la prueba checksum Luhn de autenticidad bancaria. Por favor usa una tarjeta de prueba autorizada (ej. 4242 4242 4242 4242).");
        return;
      }
      if (cvvLength() < 3) {
        setErrorMessage("El código CVV de verificación trasera es obligatorio (3 o 4 dígitos).");
        return;
      }
    }

    setErrorMessage(null);
    setBookingStatus('verifying');

    // Simulate multi-step checkout processing (Verification -> Stripe Card Routing -> Realtime Injection)
    setTimeout(() => {
      setBookingStatus('charging');
      
      setTimeout(() => {
        const totalAmount = getTotalAmountUSD();
        const resId = `res-direct-${Date.now().toString().slice(-4)}`;
        
        const isAlreadyPaid = guestPaymentOption === 'card' || guestPaymentOption === 'paypal' || guestPaymentOption === 'crypto';

        // Push reservation to localized engine state
        const newReservation = {
          id: resId,
          hotelId: currentHotelId,
          roomId: selectedRoomId,
          guestName: guestName,
          guestEmail: guestEmail,
          checkIn: checkInDate,
          checkOut: new Date(new Date(checkInDate).getTime() + nights * 86400000).toISOString().split('T')[0],
          status: 'confirmed' as const,
          guestsCount: 1,
          totalAmount: totalAmount,
          outstandingBalance: isAlreadyPaid ? 0 : totalAmount
        };

        onAddReservation(newReservation);

        // Auto-register Guest within the central CRM
        const exists = guests.some(g => g.email.toLowerCase() === guestEmail.toLowerCase());
        const getPaymentLabel = () => {
          switch(guestPaymentOption) {
            case 'card': return 'Pago Online (Tarjeta Stripe)';
            case 'paypal': return 'Pago Online (PayPal)';
            case 'crypto': return 'Pago Online (Cripto USDT/BTC)';
            case 'transfer': return 'Pago vía Transferencia Bancaria Directa';
            case 'reception': return 'Pago en recepción (Check-In)';
            default: return 'Por pagar en hotel';
          }
        };

        const preferencesList = [
          'Reserva directa desde Motor Autónomo',
          getPaymentLabel(),
          appliedPromoLabel ? `Código Promocional Aplicado: ${appliedPromoLabel}` : '',
          ...selectedAddonIds.map(id => `Addon: ${addons.find(a => a.id === id)?.name}`)
        ].filter(Boolean);

        if (!exists) {
          const freshGuest: Guest = {
            id: `guest-${Date.now()}`,
            name: guestName,
            email: guestEmail,
            phone: whatsapp || '+57 311 000 1234',
            loyaltyTier: totalAmount > 500 ? 'Gold' : 'Silver',
            totalSpent: totalAmount,
            reservationsCount: 1,
            preferences: preferencesList
          };
          onAddGuest(freshGuest);
        }

        // DISPATCH AUTONOMOUS WEBHOOK ASYNCHRONOUSLY
        if (webhookEvents.onBookingCreated) {
          const webhookLogId = `log-direct-${Math.floor(100 + Math.random() * 900)}`;
          const freshWebhookPayload = {
            id: webhookLogId,
            timestamp: new Date().toLocaleTimeString(),
            event: 'booking.created',
            status: 200,
            payload: {
              event: "booking.created",
              hotelId: currentHotelId,
              hotelName: hotelsMap[currentHotelId] || "Sinergia Glamping",
              bookingId: resId,
              amount: totalAmount,
              currency: selectedCurrency,
              guest: {
                name: guestName,
                email: guestEmail,
                whatsapp: whatsapp || "No especificado"
              },
              details: {
                roomId: selectedRoomId,
                roomNumber: selectedRoomDetails?.number || "N/A",
                roomType: selectedRoomDetails?.type || "N/A",
                checkIn: checkInDate,
                nights: nights,
                arrivalHour: customsPassed().arrival ? arrivalTime : "Por defecto",
                appliedPromo: appliedPromoLabel || "Ninguno",
                addonsSelected: selectedAddonIds.map(id => addons.find(a => a.id === id)?.name)
              },
              integrations: {
                syncToken: apiBearerToken,
                sourceUrl: successRedirectUrl || "https://widget.sinergia-ia/motor"
              }
            }
          };
          setWebhookLogs(prev => [freshWebhookPayload, ...prev]);
          setSelectedLogId(webhookLogId);
        }

        setLastCreatedResId(resId);
        setInvoiceAmount(totalAmount);
        setBookingStatus('finished');
        playCheckoutChime();
      }, 1500);
    }, 1200);
  };

  const cvvLength = () => {
    return cardCvv.trim().length;
  };

  const resetWebForm = () => {
    setSelectedRoomId('');
    setGuestName('');
    setGuestEmail('');
    setCardNumber('');
    setCardCvv('');
    setWhatsapp('');
    setDietary('');
    setPromoCodeInput('');
    setAppliedPromoDiscount(0);
    setAppliedPromoLabel('');
    setSelectedAddonIds([]);
    setBookingStatus('idle');
    setLastCreatedResId(null);
  };

  const customsPassed = () => {
    return {
      whatsapp: customFields.askWhatsapp,
      diet: customFields.askDietPref,
      arrival: customFields.askArrivalHour
    };
  };

  // Generate codes automatically for embedding
  const getJSWidgetSnippet = () => {
    return `<!-- Sinergia IA: Motor de Reservas Directas Autónomo -->
<div id="sinergia-booking-root"></div>
<script 
  src="https://cdn.sinergia-ia.network/dist/booking-widget.js" 
  data-hotel-id="${currentHotelId}" 
  data-theme="${bookingThemeColor}" 
  data-lang="${widgetLanguage}" 
  data-title="${widgetIncludeTitle ? 'true' : 'false'}"
  data-pay-online="${bookingEnablePayments ? 'true' : 'false'}"
  async>
</script>`;
  };

  const getIframeSnippet = () => {
    return `<iframe 
  src="https://hub.sinergia-ia.network/book/embed/${currentHotelId}?theme=${bookingThemeColor}&lang=${widgetLanguage}&pay=${bookingEnablePayments ? '1' : '0'}" 
  width="100%" 
  height="650px" 
  style="border: 1px solid #e2e8f0; border-radius: 16px; min-height: 600px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);" 
  allow="payment">
</iframe>`;
  };

  // Generate live REST data of available spaces for distribution
  const getAPIDistributionJSON = () => {
    return JSON.stringify({
      status: "success",
      query_timestamp: new Date().toISOString(),
      hotel_distributed: {
        id: currentHotelId,
        name: hotelsMap[currentHotelId] || "Sinergia Pro Inmuebles",
        currency: "USD",
        api_rate_multiplier: activePlan.multiplier
      },
      inventory: availableRooms.map(r => ({
        room_id: r.id,
        room_number: r.number,
        type: r.type,
        max_capacity: r.capacity,
        base_rate_usd: r.ratePerNight,
        final_rate_multiplier_usd: Math.round(r.ratePerNight * activePlan.multiplier),
        pms_status: r.status,
        distribution_channel: "api_autonoma_directa_v1"
      }))
    }, null, 2);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="booking-engine-root-container" className="space-y-8 pb-16">
      
      {/* Dynamic Header Badge & Jargon-free description */}
      <div id="booking-engine-banner" className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div id="booking-badge-html5" className="absolute right-0 bottom-0 opacity-10 flex text-9xl font-black select-none pointer-events-none pr-4">AUTO</div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-5">
          <div className="space-y-1 max-w-2xl">
            <span id="booking-badge-tag" className="text-[10px] bg-indigo-500/30 text-indigo-205 border border-indigo-400/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Consola Unificada del Distribuidor de Reservas Directas
            </span>
            <h2 id="booking-banner-title" className="text-xl font-bold font-sans">Motor de Reserva Propio e Integraciones (Multipantalla)</h2>
            <p id="booking-banner-desc" className="text-xs text-slate-300 leading-relaxed font-sans">
              Todo en una sola página para simplificar tu configuración. Personaliza tu portal nativo, extrae el código del widget interactivo para Wix o WordPress, configura endpoints post-webhook en tiempo real y gestiona la API Rest para terceros.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 font-mono text-[10px] font-bold flex items-center gap-1.5 shrink-0 text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              100% AUTÓNOMO Y DIVERSO
            </span>
          </div>
        </div>
      </div>

      {/* QUICK ANCHOR BAR TO IMPROVE USER NAVIGATION */}
      <div id="booking-engine-anchors" className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-2 shadow-2xs">
        <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400 px-2">Acceso Rápido:</span>
        <button
          type="button"
          onClick={() => scrollToSection('sec-portal-directo')}
          className="bg-white hover:bg-slate-100/90 text-slate-700 border border-slate-205 text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span>1. Portal Directo Previsualización</span>
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('sec-widget-embed')}
          className="bg-white hover:bg-slate-100/90 text-slate-700 border border-slate-205 text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Laptop className="w-3.5 h-3.5 text-emerald-600" />
          <span>2. Generador del Widget</span>
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('sec-webhook-sync')}
          className="bg-white hover:bg-slate-100/90 text-slate-700 border border-slate-205 text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
          <span>3. Webhooks API</span>
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('sec-api-distribution')}
          className="bg-white hover:bg-slate-100/90 text-slate-700 border border-slate-205 text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-violet-600" />
          <span>4. Distribuidor API Rest</span>
        </button>
      </div>

      {/* CONTINUOUS SECTIONS STREAM */}
      <div id="booking-engine-continuous-sections" className="space-y-12">

        {/* SECTION 1: SYSTEM PORTAL & BUILDER (DIRECT RES) */}
        <section id="sec-portal-directo" className="bg-slate-50/50 border border-slate-200 p-4 sm:p-6 rounded-3xl space-y-5 shadow-2xs scroll-mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-4 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-indigo-100 text-indigo-700 font-black rounded-lg flex items-center justify-center text-xs font-mono">1</span>
              <div>
                <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider">PREVISUALIZACIÓN Y CONFIGURACIÓN DEL PORTAL DIRECTO</h3>
                <p className="text-[11px] text-slate-500 font-medium">Modifica los parámetros visuales y efectúa reservas inmediatas inyectándose de manera segura al centralizador.</p>
              </div>
            </div>
            <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider shrink-0">
              Marca Comercial Propia
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Console settings */}
            <div className="lg:col-span-4 xl:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-150 pb-2.5">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">Diseño & Checkout</h4>
              </div>

              <div className="space-y-4 text-xs">
                {/* Theme Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase font-mono tracking-wider block">Estilo Color Principal</label>
                  <div className="flex gap-2">
                    {(['indigo', 'emerald', 'violet', 'amber', 'slate'] as const).map(color => {
                      let colorBg = 'bg-indigo-600';
                      if (color === 'emerald') colorBg = 'bg-emerald-600';
                      if (color === 'violet') colorBg = 'bg-violet-600';
                      if (color === 'amber') colorBg = 'bg-amber-500';
                      if (color === 'slate') colorBg = 'bg-slate-700';

                      return (
                        <button
                          key={color}
                          id={`unified-color-${color}`}
                          type="button"
                          onClick={() => setBookingThemeColor(color)}
                          className={`w-7 h-7 rounded-lg cursor-pointer flex items-center justify-center border-2 transition-all hover:scale-105 ${
                            bookingThemeColor === color ? 'border-indigo-650 ring-2 ring-indigo-200' : 'border-transparent'
                          } ${colorBg}`}
                          title={`Color ${color}`}
                        >
                          {bookingThemeColor === color && (
                            <span className="text-[10px] text-white">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase font-mono block">Título en el portal de reserva</label>
                  <input 
                    type="text" 
                    value={bookingTitle} 
                    onChange={(e) => setBookingTitle(e.target.value)}
                    placeholder="Ej. Portal Habitado"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden tracking-normal"
                  />
                </div>

                {/* Welcome Message */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase font-mono block">Mensaje / Introducción al cliente</label>
                  <textarea 
                    rows={2}
                    value={bookingIntro} 
                    onChange={(e) => setBookingIntro(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden tracking-normal resize-none leading-normal"
                  />
                </div>

                {/* Additional Checkout inputs */}
                <div className="border border-slate-200/80 bg-slate-50 rounded-xl p-3 space-y-2">
                  <span className="text-[10.5px] font-mono text-slate-500 font-extrabold uppercase tracking-wide block">Campos a medida del formulario</span>
                  <div className="space-y-1.5 font-sans">
                    <label className="flex items-center gap-2 text-xs text-slate-655 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={customFields.askWhatsapp}
                        onChange={(e) => setCustomFields(prev => ({ ...prev, askWhatsapp: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-350 cursor-pointer"
                      />
                      <span>Inclusión de WhatsApp (+57 / +34 etc)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-655 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={customFields.askArrivalHour}
                        onChange={(e) => setCustomFields(prev => ({ ...prev, askArrivalHour: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-350 cursor-pointer"
                      />
                      <span>Hora de llegada aproximada (CheckIn)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-655 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={customFields.askDietPref}
                        onChange={(e) => setCustomFields(prev => ({ ...prev, askDietPref: e.target.checked }))}
                        className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-350 cursor-pointer"
                      />
                      <span>Alergias o condiciones alimentarias</span>
                    </label>
                  </div>
                </div>

                {/* Success redirection URL */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase font-mono block">URI Redirección de Éxito Externo</label>
                  <input 
                    type="url" 
                    value={successRedirectUrl} 
                    onChange={(e) => setSuccessRedirectUrl(e.target.value)}
                    placeholder="https://mi-portal.com/gracias"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] focus:bg-white"
                  />
                </div>

                {/* Payments */}
                <div className="p-3 border border-indigo-100 bg-indigo-50/50 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-650" />
                      Garantía Tarjeta Requerida
                    </span>
                    <input 
                      type="checkbox"
                      checked={bookingEnablePayments}
                      onChange={(e) => setBookingEnablePayments(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-snug">Simula cargo virtual automático de tarjetas de crédito con logs de pago.</p>
                </div>
              </div>
            </div>

            {/* Right Live Preview Frame */}
            <div className="lg:col-span-8 xl:col-span-9 bg-slate-200/60 border border-slate-200 rounded-2xl p-3 sm:p-5 md:p-6 shadow-xs space-y-4">
              {/* Browser Header */}
              <div className="bg-white border border-slate-200 rounded-t-xl px-4 py-2.5 flex items-center justify-between shadow-3xs">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 bg-rose-450 rounded-full block"></span>
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-full block"></span>
                    <span className="w-2.5 h-2.5 bg-emerald-550 rounded-full block"></span>
                  </div>
                  <div className="bg-slate-100 px-3 py-1 rounded border border-slate-200/40 text-[9.5px] font-mono text-slate-500 flex items-center gap-1 w-full max-w-[380px] truncate">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>https://reserva-directa-sinergia.com/hotel/{currentHotelId}</span>
                  </div>
                </div>
                <span className="text-[9.5px] font-mono bg-indigo-50 text-indigo-700 px-2 border border-indigo-200 rounded font-bold tracking-tight">
                  PREVISUALIZACIÓN ONLINE DE MARCA
                </span>
              </div>

              {/* Web content */}
              <div className="bg-white border-x border-b border-slate-200 rounded-b-xl overflow-hidden p-0 relative min-h-[420px] transition-all">
                
                {/* Selected Color Header */}
                <div className={`p-5 sm:p-6 text-white ${themeCls.primary} transition-colors duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                  <div className="space-y-1">
                    <span className="text-[8.5px] uppercase font-mono tracking-widest text-white/80 font-bold block">Reserva Directa Sin Cargos</span>
                    <h4 className="text-base sm:text-lg font-black tracking-tight">{bookingTitle}</h4>
                    <p className="text-[11px] text-white/90 leading-tight font-medium">{bookingIntro}</p>
                  </div>
                  <div className="bg-white/10 border border-white/20 px-2.5 py-1.5 rounded text-[10.5px] tracking-wide font-mono shrink-0">
                    Tarifa Base x{activePlan.multiplier}
                  </div>
                </div>

                {errorMessage && (
                  <div className="m-4 p-3 bg-rose-50 border border-rose-150 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {bookingStatus === 'finished' ? (
                  <div className="p-8 text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-300 animate-bounce">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">¡Sincronización Directa Completa!</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-snug">
                        La reserva fue inyectada en el PMS de Sinergia bajo confirmación <strong className="font-mono text-indigo-650 bg-indigo-50 px-1">{lastCreatedResId}</strong>. Cobro de <strong>{formatPrice(invoiceAmount)}</strong> procesado con éxito.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs font-mono max-w-xs mx-auto space-y-1 text-slate-700">
                      <p className="font-bold border-b border-slate-200 pb-1 text-center text-slate-400 text-[9px] uppercase tracking-wide">Folio PMS Directo</p>
                      <div className="flex justify-between pt-1"><span>Huésped:</span><span className="font-bold">{guestName}</span></div>
                      <div className="flex justify-between"><span>Check-In:</span><span className="font-bold">{checkInDate}</span></div>
                      <div className="flex justify-between"><span>Habitación:</span><span className="font-bold">{selectedRoomDetails?.number || 'N/A'}</span></div>
                      {appliedPromoLabel && <div className="flex justify-between text-emerald-650"><span>Cupón:</span><span className="font-bold">{appliedPromoLabel}</span></div>}
                      {selectedAddonIds.length > 0 && <div className="flex justify-between text-indigo-650"><span>Extras:</span><span className="font-bold">+{selectedAddonIds.length}</span></div>}
                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-1 font-bold text-slate-900"><span>Cobrado:</span><span>{formatPrice(invoiceAmount)}</span></div>
                    </div>

                    <button 
                      type="button" 
                      onClick={resetWebForm} 
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-mono text-white font-bold cursor-pointer ${themeCls.primary}`}
                    >
                      Hacer un Nuevo Checkout de Prueba
                    </button>
                  </div>
                ) : bookingStatus === 'verifying' || bookingStatus === 'charging' ? (
                  <div className="p-16 text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-650 rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-mono font-bold tracking-wider text-slate-600 uppercase">
                      {bookingStatus === 'verifying' ? 'Verificando ocupación en PMS...' : 'Procesando cargo seguro virtual...'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePerformDirectBooking} className="p-4 sm:p-5 space-y-5">
                    {/* Date select & Currency selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-450 uppercase font-bold font-mono">Fecha Check-In</span>
                        <input type="date" required value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} className="bg-white border rounded p-1 text-xs" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-450 uppercase font-bold font-mono">Número Noches</span>
                        <input type="number" required min={1} max={30} value={nights} onChange={(e) => setNights(parseInt(e.target.value) || 1)} className="bg-white border rounded p-1 text-xs" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-slate-450 uppercase font-bold font-mono">Moneda de Pago</span>
                        <select 
                          value={selectedCurrency} 
                          onChange={(e) => setSelectedCurrency(e.target.value as any)}
                          className="bg-white border rounded p-1 text-xs font-bold font-mono text-slate-805 cursor-pointer outline-hidden focus:border-indigo-500"
                        >
                          <option value="USD">💵 USD (Dólares)</option>
                          <option value="EUR">💶 EUR (Euros)</option>
                          <option value="COP">🇨🇴 COP (Pesos Col)</option>
                          <option value="MXN">🇲🇽 MXN (Pesos Mex)</option>
                        </select>
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] text-slate-400 uppercase font-bold font-mono block">Plan Canal PMS</span>
                        <span className="text-[11px] font-bold text-indigo-700 tracking-wide font-mono mt-0.5">Directo x{activePlan.multiplier}</span>
                      </div>
                    </div>

                    {/* Room list selector & Addon Services */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6">
                      
                      <div className="xl:col-span-7 space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center bg-slate-100/50 p-1.5 rounded-lg border border-slate-200/60">
                            <span className="text-[10px] font-mono font-extrabold uppercase text-slate-600">Paso 1: Habitaciones Libres ({availableRooms.length})</span>
                            <button
                              type="button"
                              onClick={() => setShowAddRoomForm(!showAddRoomForm)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded transition-all cursor-pointer shadow-3xs"
                            >
                              {showAddRoomForm ? '✕ Cerrar' : '⚡ + Configurar Habitación'}
                            </button>
                          </div>

                          {showAddRoomForm && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs space-y-2 mt-1 mb-2 animate-in fade-in slide-in-from-top-1">
                              <div className="flex justify-between items-center pb-1 border-b border-indigo-150">
                                <span className="font-bold text-slate-850 text-[10.5px] uppercase font-mono">🛏️ Cargar Nueva Habitación al Inventario</span>
                                <button type="button" onClick={() => setShowAddRoomForm(false)} className="text-slate-400 hover:text-rose-600 font-extrabold text-[11px]">✕</button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                                <div className="space-y-0.5">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Nº Habitación</label>
                                  <input 
                                    type="text" 
                                    placeholder="Ej: 104, 302, D-2" 
                                    value={newRoomNumber} 
                                    onChange={(e) => setNewRoomNumber(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[11px]"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Tipo / Categoría</label>
                                  <input 
                                    type="text"
                                    list="room-types-list"
                                    value={newRoomType} 
                                    onChange={(e) => setNewRoomType(e.target.value)}
                                    placeholder="Ej: Suite Deluxe..."
                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[11px]"
                                  />
                                  <datalist id="room-types-list">
                                    <option value="Domo Glamping" />
                                    <option value="Domo Estándar" />
                                    <option value="Master Deluxe Romántico" />
                                    <option value="Treehouse Nest" />
                                    <option value="Suite Familiar" />
                                    <option value="Habitación Estándar" />
                                    <option value="Loft Sencillo" />
                                  </datalist>
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Capacidad</label>
                                  <input 
                                    type="number" 
                                    min={1} 
                                    max={10} 
                                    value={newRoomCapacity} 
                                    onChange={(e) => setNewRoomCapacity(parseInt(e.target.value) || 2)}
                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[11px]"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Tarifa x Noche (USD)</label>
                                  <input 
                                    type="number" 
                                    min={10} 
                                    value={newRoomRate} 
                                    onChange={(e) => setNewRoomRate(parseInt(e.target.value) || 120)}
                                    className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-[11px]"
                                  />
                                </div>
                              </div>
                              <button 
                                type="button" 
                                onClick={handleAddNewRoomSubmit}
                                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-mono font-bold py-1.5 rounded text-[10px] uppercase shadow-3xs transition-all cursor-pointer"
                              >
                                ✓ Guardar e Inyectar en PMS
                              </button>
                            </div>
                          )}

                          <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                            {availableRooms.map(r => {
                              const modRate = Math.round(r.ratePerNight * activePlan.multiplier);
                              const active = selectedRoomId === r.id;
                              
                              return (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => setSelectedRoomId(r.id)}
                                  className={`w-full p-2.5 border rounded-xl text-left cursor-pointer transition-all flex justify-between items-center ${
                                    active ? `${themeCls.border} ${themeCls.bgLight} border-2` : 'border-slate-150 bg-slate-50/50'
                                  }`}
                                >
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-mono font-bold text-slate-800">HAB {r.number} ({r.type})</span>
                                    <p className="text-[9.5px] text-slate-450 block">Capacidad: {r.capacity} personas.</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <span className="text-[9px] text-slate-350 line-through block">{formatPrice(r.ratePerNight)}</span>
                                      <span className={`text-[11px] font-mono font-bold ${themeCls.text}`}>{formatPrice(modRate)} / noche</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteRoom(r.id);
                                        if (selectedRoomId === r.id) setSelectedRoomId('');
                                      }}
                                      className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-650 hover:text-rose-700 transition-colors text-[9px] font-bold border border-rose-200 shrink-0"
                                      title="Eliminar Habitación"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Paso 1.5: Servicios adicionales (Estilo plataforma cinco estrellas) */}
                        <div className="space-y-2 pt-1 border-t border-slate-100 font-sans">
                          <div className="flex justify-between items-center bg-slate-100/50 p-1.5 rounded-lg border border-slate-200/60">
                            <span className="text-[10px] font-mono font-extrabold uppercase text-slate-600">Paso 1.5: Experiencias & Upselling</span>
                            <button
                              type="button"
                              onClick={() => setShowAddAddonForm(!showAddAddonForm)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded transition-all cursor-pointer shadow-3xs hover:scale-[1.02]"
                            >
                              {showAddAddonForm ? '✕ Cerrar' : '⚡ + Añadir Servicio'}
                            </button>
                          </div>

                          {showAddAddonForm && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-2 mt-1 mb-2 animate-in fade-in slide-in-from-top-1 text-left">
                              <div className="flex justify-between items-center pb-1 border-b border-emerald-150">
                                <span className="font-bold text-slate-850 text-[10.5px] uppercase font-mono">🌟 Habilitar Nuevo Servicio Adicional</span>
                                <button type="button" onClick={() => setShowAddAddonForm(false)} className="text-slate-400 hover:text-rose-600 font-extrabold text-[11px]">✕</button>
                              </div>
                              <div className="space-y-1.5 text-[10.5px]">
                                <div className="space-y-0.5">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Nombre del Servicio (con emoji!)</label>
                                  <input 
                                    type="text" 
                                    placeholder="Ej: 🍕 Cena Italiana de Campo, 🧴 Masaje Spa" 
                                    value={newAddonName} 
                                    onChange={(e) => setNewAddonName(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[11.5px]"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Descripción Corta</label>
                                  <input 
                                    type="text" 
                                    placeholder="Ej: Copa de vino premium de cortesía" 
                                    value={newAddonDesc} 
                                    onChange={(e) => setNewAddonDesc(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[11.5px]"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Precio Base (USD)</label>
                                    <input 
                                      type="number" 
                                      min={1} 
                                      value={newAddonPrice} 
                                      onChange={(e) => setNewAddonPrice(parseInt(e.target.value) || 20)}
                                      className="w-full bg-white border border-slate-200 rounded p-1 font-mono text-[11.5px]"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block">Cobro</label>
                                    <select 
                                      value={newAddonMode} 
                                      onChange={(e) => setNewAddonMode(e.target.value as 'per_day' | 'fixed')}
                                      className="w-full bg-white border border-slate-200 rounded p-1 text-[11.5px]"
                                    >
                                      <option value="fixed">Gasto Único Flat</option>
                                      <option value="per_day">Por noche de estancia</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                              <button 
                                type="button" 
                                onClick={handleAddNewAddonSubmit}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold py-1.5 rounded text-[10px] uppercase shadow-3xs transition-all cursor-pointer"
                              >
                                ✓ Guardar y Registrar
                              </button>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-1">
                            {addons.map(addon => {
                              const selected = selectedAddonIds.includes(addon.id);
                              const priceDisplay = addon.mode === 'per_day' 
                                ? `${formatPrice(addon.pricePerDay)}/noche` 
                                : `${formatPrice(addon.pricePerDay)}`;
                              
                              return (
                                <div
                                  key={addon.id}
                                  onClick={() => handleToggleAddon(addon.id)}
                                  className={`p-2 rounded-lg border text-left flex justify-between items-start transition-all cursor-pointer relative group ${
                                    selected 
                                      ? 'bg-indigo-50 border-indigo-400 shadow-3xs' 
                                      : 'bg-white border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="space-y-0.5 pr-1 max-w-[70%]">
                                    <div className="flex items-center gap-1">
                                      <input type="checkbox" readOnly checked={selected} className="w-3 h-3 text-indigo-600 rounded shrink-0 pointer-events-none" />
                                      <span className="text-[10.5px] font-bold text-slate-800 leading-none truncate">{addon.name}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 leading-tight">{addon.desc}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                                    <span className="text-[10px] font-mono font-bold text-indigo-700">{priceDisplay}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddons(prev => prev.filter(a => a.id !== addon.id));
                                        setSelectedAddonIds(prev => prev.filter(id => id !== addon.id));
                                      }}
                                      className="p-0.5 px-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors text-[8px] font-bold border border-slate-200"
                                      title="Quitar"
                                    >
                                      Quitar
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Guest info inputs */}
                      <div className="xl:col-span-5 space-y-2">
                        <span className="text-[10px] font-mono font-extrabold uppercase text-slate-450">Paso 2: Datos del Huésped & Descuentos</span>
                        <div className="space-y-2 bg-slate-50/30 p-2 border border-slate-200/60 rounded-xl text-xs space-y-2">
                          <input type="text" required placeholder="Nombre Huésped" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-indigo-500" />
                          <input type="email" required placeholder="E-mail de Contacto" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-indigo-500" />
                          
                          {customsPassed().whatsapp && (
                            <input type="tel" required placeholder="Número WhatsApp de Contacto" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono focus:ring-1" />
                          )}

                          {customsPassed().arrival && (
                            <div className="flex items-center justify-between text-slate-500 py-0.5">
                              <span className="text-[9.5px] font-mono font-bold text-slate-400">Hora de Llegada:</span>
                              <select value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="bg-white border rounded text-[10.5px]">
                                <option value="12:00">12:00 PM</option>
                                <option value="15:00">15:00 PM</option>
                                <option value="18:00">18:00 PM</option>
                              </select>
                            </div>
                          )}

                          {customsPassed().diet && (
                            <input type="text" placeholder="Condiciones de comida/alergias" value={dietary} onChange={(e) => setDietary(e.target.value)} className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs focus:ring-1" />
                          )}

                          {/* Promo code engine inside actual booking container */}
                          <div className="border-t border-slate-200 pt-2 mt-1 space-y-1">
                            <span className="text-[9px] font-mono font-extrabold uppercase text-slate-400 block">¿Código de Descuento / Cupón?</span>
                            <div className="flex gap-1">
                              <input 
                                type="text" 
                                placeholder="Ej: SINERGIA15" 
                                value={promoCodeInput}
                                onChange={(e) => setPromoCodeInput(e.target.value)}
                                className="flex-1 bg-white border border-slate-250 rounded p-1 font-mono uppercase text-xs focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={handleApplyPromoCode}
                                className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-mono font-bold px-2.5 rounded cursor-pointer"
                              >
                                Aplicar
                              </button>
                            </div>
                            {appliedPromoLabel && (
                              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-250 text-emerald-800 rounded px-1.5 py-0.5 mt-1 text-[9.5px] font-bold">
                                <span>🎉 Cupón {appliedPromoLabel} (-{appliedPromoDiscount}%)</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAppliedPromoDiscount(0);
                                    setAppliedPromoLabel('');
                                    setPromoCodeInput('');
                                  }}
                                  className="text-rose-600 hover:text-rose-800 font-extrabold"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Selector / Activador de Pasarela de Pago Directo en Formulario */}
                          <div className="border-t border-slate-200 pt-3 mt-2.5 pb-1 space-y-1.5">
                            <div className="flex items-center justify-between bg-slate-100/60 p-2 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span className="text-lg">💳</span>
                                <div className="flex flex-col text-left">
                                  <span className="text-[10px] font-mono font-extrabold uppercase text-slate-700 block">PASARELA DE PAGO EN LÍNEA</span>
                                  <span className="text-[9px] text-slate-500 leading-tight">Prueba o simula cargos con Stripe</span>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={bookingEnablePayments} 
                                  onChange={(e) => setBookingEnablePayments(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                          </div>

                          {/* Cards fields simulated if enabled payments */}
                          {bookingEnablePayments ? (
                            <div className="space-y-3 mt-2.5">
                              {/* Selector / tabs of different payment options */}
                              <div className="space-y-1">
                                <span className="text-[9.5px] font-mono font-bold uppercase text-slate-450 block text-left">Método de Pago Seleccionado</span>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => setGuestPaymentOption('card')}
                                    className={`py-1.5 px-1 rounded-md text-center flex flex-col items-center justify-center gap-0.5 transition-all text-[9.5px] font-bold ${
                                      guestPaymentOption === 'card' 
                                        ? 'bg-white text-slate-850 shadow-2xs' 
                                        : 'text-slate-500 hover:text-slate-850'
                                    }`}
                                  >
                                    <span className="text-sm select-none">💳</span>
                                    <span>Tarjeta</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGuestPaymentOption('transfer')}
                                    className={`py-1.5 px-1 rounded-md text-center flex flex-col items-center justify-center gap-0.5 transition-all text-[9.5px] font-bold ${
                                      guestPaymentOption === 'transfer' 
                                        ? 'bg-white text-slate-850 shadow-2xs' 
                                        : 'text-slate-500 hover:text-slate-850'
                                    }`}
                                  >
                                    <span className="text-sm select-none">🏦</span>
                                    <span>Transf. SPEI</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGuestPaymentOption('paypal')}
                                    className={`py-1.5 px-1 rounded-md text-center flex flex-col items-center justify-center gap-0.5 transition-all text-[9.5px] font-bold ${
                                      guestPaymentOption === 'paypal' 
                                        ? 'bg-white text-slate-850 shadow-2xs' 
                                        : 'text-slate-500 hover:text-slate-850'
                                    }`}
                                  >
                                    <span className="text-sm select-none">🎯</span>
                                    <span>PayPal</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGuestPaymentOption('crypto')}
                                    className={`py-1.5 px-1 rounded-md text-center flex flex-col items-center justify-center gap-0.5 transition-all text-[9.5px] font-bold ${
                                      guestPaymentOption === 'crypto' 
                                        ? 'bg-white text-slate-850 shadow-2xs' 
                                        : 'text-slate-500 hover:text-slate-850'
                                    }`}
                                  >
                                    <span className="text-sm select-none">⚡</span>
                                    <span>Cripto</span>
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setGuestPaymentOption('reception')}
                                  className={`w-full mt-1.5 py-1 text-center flex items-center justify-center gap-1 transition-all text-[9.5px] font-bold rounded-lg border ${
                                    guestPaymentOption === 'reception'
                                      ? 'bg-white border-amber-300 text-amber-800 shadow-3xs'
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'
                                  }`}
                                >
                                  <span className="text-xs">🛎️</span>
                                  <span>Pago Directo en Recepción (Check-In)</span>
                                </button>
                              </div>

                              {/* CONDITIONAL DETAILED PANELS */}
                              {guestPaymentOption === 'card' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                                  {/* Physical Card Visualizer */}
                                  <div className="relative w-full h-[155px] font-mono select-none" style={{ perspective: '1000px' }}>
                                    <div 
                                      className="relative w-full h-full transition-transform duration-500 rounded-2xl"
                                      style={{ 
                                        transformStyle: 'preserve-3d',
                                        transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                      }}
                                    >
                                      {/* FRONT SIDE */}
                                      <div 
                                        className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 p-4 text-white flex flex-col justify-between shadow-lg border border-slate-700/65"
                                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                                      >
                                        <div className="flex justify-between items-start">
                                          {/* Golden Chip & Contactless logo */}
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-6 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 rounded-md border border-amber-300 relative overflow-hidden shadow-2xs">
                                              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40">
                                                <div className="border-b border-r border-amber-900"></div>
                                                <div className="border-b border-r border-amber-900"></div>
                                                <div className="border-b border-amber-900"></div>
                                                <div className="border-b border-r border-amber-900"></div>
                                                <div className="border-b border-r border-amber-900"></div>
                                                <div className="border-b border-amber-900"></div>
                                                <div className="border-r border-amber-900"></div>
                                                <div className="border-r border-amber-900"></div>
                                                <div></div>
                                              </div>
                                            </div>
                                            <svg className="w-4 h-4 text-white/50 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                          </div>
                                          
                                          {/* Dynamic Brand Logo */}
                                          <div className="font-sans font-black tracking-tighter text-xs italic opacity-95">
                                            {getCardType(cardNumber) === 'visa' && <span className="text-sky-400 font-extrabold text-sm drop-shadow-sm">VISA</span>}
                                            {getCardType(cardNumber) === 'mastercard' && <span className="text-amber-500 font-extrabold text-sm drop-shadow-sm">MasterCard</span>}
                                            {getCardType(cardNumber) === 'amex' && <span className="text-emerald-400 font-extrabold text-xs drop-shadow-sm">AMEX</span>}
                                            {getCardType(cardNumber) === 'generic' && <span className="text-white/60 text-[9px] uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-mono">SECURE</span>}
                                          </div>
                                        </div>

                                        {/* Number formatted with spaces */}
                                        <div className="text-sm sm:text-base text-center tracking-[0.18em] font-bold my-1.5 text-white font-mono filter drop-shadow-sm">
                                          {formatCardNumber(cardNumber)}
                                        </div>

                                        {/* Footer Name / Expiry */}
                                        <div className="flex justify-between items-end text-[10px] font-mono">
                                          <div className="max-w-[75%]">
                                            <span className="text-[7px] uppercase block text-slate-400 tracking-wider">Titular</span>
                                            <span className="font-bold truncate block text-slate-100 uppercase text-[9.5px]">
                                              {guestName.trim() || 'HUÉSPED TITULAR'}
                                            </span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-[7px] uppercase block text-slate-400 tracking-wider">Vence</span>
                                            <span className="font-bold block tracking-widest text-slate-100">{cardExpiry || 'MM/AA'}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* BACK SIDE */}
                                      <div 
                                        className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 p-4 text-white flex flex-col justify-between shadow-lg border border-slate-750"
                                        style={{ 
                                          backfaceVisibility: 'hidden', 
                                          WebkitBackfaceVisibility: 'hidden',
                                          transform: 'rotateY(180deg)' 
                                        }}
                                      >
                                        <div className="w-full h-7 bg-slate-950 -mx-4 mt-1"></div>
                                        <div className="flex justify-between items-center mt-3">
                                          <div className="w-3/4 h-6.5 bg-slate-100 text-slate-400 font-mono text-[9px] px-2 flex items-center italic select-none rounded border border-slate-350">
                                            •••• •••• •••• ••••
                                          </div>
                                          <div className="w-12 h-6.5 bg-slate-200 text-slate-900 text-[11px] font-bold font-mono px-1 flex items-center justify-center rounded border border-white shadow-inner">
                                            {cardCvv || 'CVV'}
                                          </div>
                                        </div>
                                        <div className="text-[8px] text-slate-450 text-right font-mono mt-1 pr-1 tracking-wider uppercase">
                                          Stripe Sandbox Auth Level 3 PCI-DSS
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Realistic Card Entry Fields */}
                                  <div className="bg-white p-3 border border-slate-150 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-1.5 w-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-[8.5px] font-mono text-slate-500 uppercase font-black tracking-wider">Pasarela Stripe Secure SSL Activa</span>
                                      </div>
                                      
                                      {cardNumber.length >= 13 && (
                                        <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-black uppercase tracking-wider ${
                                          checkLuhn(cardNumber) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                          {checkLuhn(cardNumber) ? '✓ Válida' : '⚠ Inválida (Luhn)'}
                                        </span>
                                      )}
                                    </div>

                                    <input 
                                      type="text" 
                                      required={bookingEnablePayments && guestPaymentOption === 'card'}
                                      maxLength={19}
                                      placeholder="Num Tarjeta (Prueba: 4242 4242 4242 4242)" 
                                      value={cardNumber.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim()} 
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 16) setCardNumber(value);
                                      }}
                                      onFocus={() => setIsCardFlipped(false)}
                                      className="w-full bg-slate-50 border border-slate-205 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded p-1.5 tracking-wider text-[11px] font-mono outline-hidden" 
                                    />

                                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                                      <input 
                                        type="text" 
                                        required={bookingEnablePayments && guestPaymentOption === 'card'} 
                                        maxLength={5}
                                        placeholder="MM/AA" 
                                        value={cardExpiry} 
                                        onChange={(e) => {
                                          let val = e.target.value.replace(/[^0-9/]/g, '');
                                          if (val.length === 2 && !val.includes('/')) {
                                            val = val + '/';
                                          }
                                          if (val.length <= 5) setCardExpiry(val);
                                        }} 
                                        onFocus={() => setIsCardFlipped(false)}
                                        className="bg-slate-50 border border-slate-205 focus:bg-white focus:border-indigo-500 focus:ring-0.5 focus:ring-indigo-500 rounded p-1.5 text-center font-mono outline-hidden" 
                                      />
                                      <input 
                                        type="password" 
                                        required={bookingEnablePayments && guestPaymentOption === 'card'} 
                                        maxLength={4} 
                                        placeholder="CVV" 
                                        value={cardCvv} 
                                        onChange={(e) => {
                                          const clean = e.target.value.replace(/\D/g, '');
                                          if (clean.length <= 4) setCardCvv(clean);
                                        }} 
                                        onFocus={() => setIsCardFlipped(true)}
                                        onBlur={() => setIsCardFlipped(false)}
                                        className="bg-slate-50 border border-slate-205 focus:bg-white focus:border-indigo-500 focus:ring-0.5 focus:ring-indigo-500 rounded p-1.5 text-center font-mono outline-hidden" 
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {guestPaymentOption === 'transfer' && (
                                <div className="p-3 bg-slate-50 border border-slate-200/85 rounded-xl space-y-2 text-left animate-in fade-in slide-in-from-top-1">
                                  <div className="flex items-center gap-1.5 select-none">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-wider">Transferencia Bancaria Directa SPEI</span>
                                  </div>
                                  <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-150 font-mono text-[9.5px] text-slate-700">
                                    <div>🏦 <span className="font-bold text-slate-900">Banco:</span> Banco Sinergia S.A.</div>
                                    <div>🔢 <span className="font-bold text-slate-900">Cta CLABE:</span> 0123 4567 8901 2345 67</div>
                                    <div>📋 <span className="font-bold text-slate-900">Referencia:</span> SIN-{Date.now().toString().slice(-6)}</div>
                                    <div>💵 <span className="font-bold text-slate-900">Total a transferir:</span> <span className="text-indigo-700 font-extrabold">{formatPrice(getTotalAmountUSD())}</span></div>
                                  </div>
                                  <p className="text-[9px] text-slate-500 leading-normal">
                                    💡 Tras culminar el pago, comparte el capture/comprobante vía WhatsApp al hotel para bloquear tu check-in de inmediato en el Property Management System.
                                  </p>
                                </div>
                              )}

                              {guestPaymentOption === 'paypal' && (
                                <div className="p-3 bg-slate-50 border border-slate-201 rounded-xl space-y-2 text-center animate-in fade-in slide-in-from-top-1">
                                  <div className="flex justify-between items-center select-none">
                                    <div className="flex items-center gap-1.5">
                                      <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                                      </span>
                                      <span className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-wider">PayPal Gateway Live Sandbox</span>
                                    </div>
                                    <span className="bg-blue-50 border border-blue-250 text-blue-850 font-bold px-1 rounded text-[8px] font-mono">ACTIVE</span>
                                  </div>
                                  <div className="py-2 px-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg text-slate-900 font-black text-[10px] uppercase tracking-wider shadow-3xs cursor-pointer flex items-center justify-center gap-1 hover:brightness-95 transition-all select-none">
                                    <span className="italic">Pay<span className="text-blue-900 font-extrabold">Pal</span></span>
                                    <span>• Checkout Simulado</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 leading-normal">
                                    Se debitarán <span className="font-bold text-slate-700">{formatPrice(getTotalAmountUSD())}</span> procedentes de tu monedero o tarjetas guardadas en tu portal de PayPal.
                                  </p>
                                </div>
                              )}

                              {guestPaymentOption === 'crypto' && (
                                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-left text-white animate-in fade-in slide-in-from-top-1 relative">
                                  <div className="flex items-center gap-1.5 select-none">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-wider">Pago en Criptomonedas (USDT/BTC)</span>
                                  </div>
                                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-850">
                                    <div className="w-12 h-12 bg-white p-1 rounded shrink-0 border border-slate-700 flex flex-col justify-between">
                                      <div className="grid grid-cols-5 gap-0.5 h-full w-full">
                                        <div className="bg-slate-950"></div><div className="bg-slate-950"></div><div className="bg-white"></div><div className="bg-slate-950"></div><div className="bg-slate-950"></div>
                                        <div className="bg-slate-950"></div><div className="bg-white"></div><div className="bg-slate-950"></div><div className="bg-white"></div><div className="bg-slate-950"></div>
                                        <div className="bg-white"></div><div className="bg-slate-950"></div><div className="bg-white"></div><div className="bg-slate-950"></div><div className="bg-white"></div>
                                        <div className="bg-slate-950"></div><div className="bg-white"></div><div className="bg-slate-950"></div><div className="bg-white"></div><div className="bg-slate-950"></div>
                                        <div className="bg-slate-950"></div><div className="bg-slate-950"></div><div className="bg-white"></div><div className="bg-slate-950"></div><div className="bg-slate-900"></div>
                                      </div>
                                    </div>
                                    <div className="space-y-0.5 font-mono text-[8px] text-slate-300 flex-1 min-w-0">
                                      <div className="truncate"><span className="text-emerald-400 font-bold">USDT-TRC20:</span> TX7yR6p9uX89ZbCqr9h0LmNj8hV2</div>
                                      <div className="truncate"><span className="text-amber-500 font-bold">BTC:</span> bc1q5x03p52b8v9sh27f4g28kmw92l9o</div>
                                      <div className="text-slate-450 text-[7px] uppercase">Ref Checkpoint: SIN-{Date.now().toString().slice(-6)}</div>
                                    </div>
                                  </div>
                                  <p className="text-[8.5px] text-slate-450">
                                    Calculado a tasa spot estable. La confirmación en el libro contable de Sinergia-PMS demora aprox. 3 minutos.
                                  </p>
                                </div>
                              )}

                              {guestPaymentOption === 'reception' && (
                                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-left text-slate-900 animate-in fade-in slide-in-from-top-1">
                                  <div className="flex items-center gap-1.5 font-bold text-[10.5px]">
                                    <span className="text-sm">🛎️</span>
                                    <span className="font-extrabold uppercase tracking-wider text-slate-700">Pago Directo en Lobby</span>
                                  </div>
                                  <p className="text-[9.5px] leading-relaxed text-slate-650">
                                    Sin cargos hoy. Totalidad de <span className="font-bold text-slate-800">{formatPrice(getTotalAmountUSD())}</span> por liquidar cara a cara al hacer check-in.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-amber-50/75 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs space-y-1.5 mt-2.5 shadow-3xs">
                              <div className="flex items-center gap-1.5 font-bold text-[10.5px]">
                                <span className="text-sm">🛎️</span>
                                <span className="font-extrabold uppercase tracking-wider text-slate-700">Pago en Recepción del Hotel</span>
                              </div>
                              <p className="text-[10.5px] leading-relaxed text-slate-600 font-sans">
                                Garantía de tarjeta opcional. El huésped liquidará su saldo total al momento del check-in.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setBookingEnablePayments(true);
                                  setGuestPaymentOption('card');
                                }}
                                className="w-full bg-white hover:bg-slate-50 text-indigo-700 font-black border border-indigo-200 rounded-lg py-1.5 text-[9.5px] mt-1 transition-all cursor-pointer font-mono uppercase tracking-wider shadow-3xs"
                              >
                                ⚡ Activar Pasarela y Diferentes Opciones de Pago Online
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Breakdown prices with fully functional calculations in multi-currencies */}
                    {selectedRoomId && (
                      <div className="bg-slate-100/80 border border-slate-200/60 p-4 rounded-xl font-mono text-[11px] space-y-2 transition-all">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal ({nights} noches):</span>
                          <span className="font-bold">{formatPrice(getSubtotalUSD())}</span>
                        </div>
                        
                        {selectedAddonIds.length > 0 && (
                          <div className="flex justify-between text-indigo-700">
                            <span>Servicios Adicionales Seleccionados ({selectedAddonIds.length}):</span>
                            <span className="font-extrabold">+{formatPrice(getAddonsTotalUSD())}</span>
                          </div>
                        )}

                        {appliedPromoDiscount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-bold">
                            <span>Descuento Código ({appliedPromoLabel} -{appliedPromoDiscount}%):</span>
                            <span className="font-extrabold">-{formatPrice(getDiscountAmountUSD())}</span>
                          </div>
                        )}

                        <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center text-xs">
                          <span className="font-black text-slate-800 uppercase tracking-wider">Total Estructurado Final:</span>
                          <div className="text-right">
                            {selectedCurrency !== 'USD' && (
                              <span className="text-[9.5px] text-slate-500 block font-sans mr-0.5 mt-[-2px] mb-0.5">Equivale a aprox. ${getTotalAmountUSD()} USD</span>
                            )}
                            <span className="text-sm font-black text-slate-900 border-b-2 border-indigo-500 pb-0.5">{formatPrice(getTotalAmountUSD())}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!selectedRoomId}
                      className={`w-full font-mono text-[11px] py-3 text-white font-extrabold rounded-xl transition-all cursor-pointer text-center tracking-wider ${
                        selectedRoomId ? `${themeCls.primary} hover:opacity-95 shadow-md` : 'bg-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {bookingEnablePayments ? 'INJECTAR TRANSACCIÓN DIRECTA SEGURA (WIDGET SYNC)' : 'EFECTUAR RESERVA CON PAGO EN HOTEL'}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </section>


        {/* SECTION 2: EMBEDDABLE WIDGET GENERATOR */}
        <section id="sec-widget-embed" className="bg-slate-50/50 border border-slate-200 p-4 sm:p-6 rounded-3xl space-y-5 shadow-2xs scroll-mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-4 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-emerald-100 text-emerald-700 font-black rounded-lg flex items-center justify-center text-xs font-mono">2</span>
              <div>
                <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider">GENERADOR DE GRABBER WIDGET INDEPENDIENTE</h3>
                <p className="text-[11px] text-slate-500 font-medium">Inserta el motor de búsqueda y checkout directo de Sinergia IA en cualquier creador web (Wix, Webflow, WordPress).</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider shrink-0">
              Integración Autónoma
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Widget config properties */}
            <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-[11px] text-slate-550 block font-normal leading-relaxed">
                El widget se ejecuta de forma aislada sin dependencias externas. Genera un script no intrusivo y colócalo en tu sitio habitual para mantener tu inventario unificado.
              </span>

              <div className="space-y-4 text-xs">
                {/* Language choice */}
                <div className="space-y-1 flex flex-col">
                  <label className="text-[10px] text-slate-555 font-extrabold uppercase font-mono tracking-wider mb-1">Idioma del Widget</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWidgetLanguage('es')}
                      className={`py-1.5 px-3 border rounded-xl font-bold font-mono text-[10.5px] cursor-pointer transition-all ${
                        widgetLanguage === 'es' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white text-slate-600 hover:bg-slate-55'
                      }`}
                    >
                      🇪🇸 Español (Original)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWidgetLanguage('en')}
                      className={`py-1.5 px-3 border rounded-xl font-bold font-mono text-[10.5px] cursor-pointer transition-all ${
                        widgetLanguage === 'en' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white text-slate-600 hover:bg-slate-55'
                      }`}
                    >
                      🇺🇸 English (Global)
                    </button>
                  </div>
                </div>

                <div className="border border-slate-150 p-3 rounded-xl space-y-2">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-extrabold">Opciones de Script</span>
                  <label className="flex items-center justify-between text-xs select-none cursor-pointer">
                    <span className="text-slate-600">Heredar Titulación Directa</span>
                    <input type="checkbox" checked={widgetIncludeTitle} onChange={(e) => setWidgetIncludeTitle(e.target.checked)} className="w-3.5 h-3.5 text-emerald-600 rounded" />
                  </label>
                  <label className="flex items-center justify-between text-xs select-none cursor-pointer">
                    <span className="text-slate-600">Filtro de tarifas ERP x{activePlan.multiplier}</span>
                    <span className="text-[10px] text-emerald-605 font-mono font-bold">Autónomo Activo</span>
                  </label>
                </div>

                {/* Copies Snippets */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-mono text-slate-500 font-extrabold uppercase">Opción 1: Fragmento JS Script (Asíncrono)</span>
                    <button
                      type="button"
                      onClick={() => triggerCopyNotification(getJSWidgetSnippet(), 'widget')}
                      className="text-[10px] text-indigo-650 hover:text-indigo-850 font-bold font-mono tracking-tight flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'widget' ? <span className="text-emerald-500">¡Copiado!</span> : 'Copiar Código'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={getJSWidgetSnippet()}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    className="w-full bg-slate-900 border-0 p-2.5 h-24 rounded-lg text-[10px] font-mono text-slate-300 resize-none outline-hidden"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-mono text-slate-500 font-extrabold uppercase">Opción 2: Iframe Clásico HTML Embed</span>
                    <button
                      type="button"
                      onClick={() => triggerCopyNotification(getIframeSnippet(), 'iframe')}
                      className="text-[10px] text-indigo-650 hover:text-indigo-850 font-bold font-mono tracking-tight flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText === 'iframe' ? <span className="text-emerald-500">¡Copiado!</span> : 'Copiar Código'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={getIframeSnippet()}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    className="w-full bg-slate-900 border-0 p-2.5 h-24 rounded-lg text-[10px] font-mono text-slate-305 resize-none outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Live widget browser template render */}
            <div className="xl:col-span-7 space-y-3">
              <div className="bg-slate-800 rounded-lg p-2 flex justify-between items-center text-slate-350 text-[10px] font-mono">
                <span>🖥️ Simulación de Entrada en Sitio Externo (Ejemplo Wix Landing)</span>
                <span className="w-2.5 h-2.5 bg-emerald-550 rounded-full"></span>
              </div>

              <div className="bg-slate-200 border border-slate-300 rounded-xl p-3 sm:p-4 space-y-4">
                {/* Header Wix style */}
                <div className="bg-slate-950 p-3 rounded-lg flex justify-between items-center text-white text-[10.5px]">
                  <span className="font-extrabold tracking-wider font-mono">🌴 GLAMPING EXPLORER INC</span>
                  <div className="flex gap-3 text-slate-305">
                    <span>Home</span>
                    <span className="text-emerald-450 font-bold border-b border-emerald-400">Book Direct</span>
                  </div>
                </div>

                {/* Simulated embedded widget block */}
                <div className="bg-white rounded-xl p-4 border border-slate-300 space-y-4">
                  <div className="text-center space-y-0.5">
                    <span className="text-[8.5px] bg-slate-100 text-slate-500 font-mono font-black rounded px-1 px-1.5 py-0.2">GRABBER SCRIPT ACTIVO</span>
                    <h5 className="text-sm font-bold text-slate-800">Reserva con el Mejor Precio Garantizado</h5>
                  </div>

                  <div className="border border-dashed border-emerald-300 bg-slate-50/50 p-3 rounded-xl relative">
                    <span className="absolute -top-2.5 left-3 bg-emerald-500 text-white font-mono text-[7.5px] font-bold px-1 rounded">VISTA PREVIA DEL WIDGET EXTRACCIÓN</span>
                    
                    <div className="bg-white border rounded-lg p-3 space-y-3 shadow-2xs text-xs">
                      <div className={`p-2.5 rounded text-white ${themeCls.primary} text-[11px] flex justify-between items-center`}>
                        <span className="font-bold">{widgetIncludeTitle ? bookingTitle : 'Official Secure Booking Engine'}</span>
                        <span className="font-mono text-[9px] uppercase">{widgetLanguage === 'es' ? 'ESPAÑOL' : 'ENGLISH'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-400 font-bold text-[8.5px] uppercase font-mono block">Ingreso</span>
                          <span className="font-mono">{checkInDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[8.5px] uppercase font-mono block">Noches de estadía</span>
                          <span className="font-mono">{nights} noches</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* SECTION 3: AUTOMATION WEBHOOKS SYNC */}
        <section id="sec-webhook-sync" className="bg-slate-50/50 border border-slate-200 p-4 sm:p-6 rounded-3xl space-y-5 shadow-2xs scroll-mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200/80 pb-4 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-amber-100 text-amber-700 font-black rounded-lg flex items-center justify-center text-xs font-mono">3</span>
              <div>
                <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider">NOTIFICACIONES WEBHOOKS DE AUTOMATIZACIÓN EN TRÁNSITO</h3>
                <p className="text-[11px] text-slate-500 font-medium">Sincroniza tus reservas mandando una llamada http POST JSON a sistemas independientes en tiempo real.</p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider shrink-0">
              Integraciones API POST
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Webhook parameters */}
            <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-[11px] text-slate-550 leading-relaxed block font-medium">
                Sincroniza instantáneamente cada checkout directo con Zapier, Make o cualquier CRM independiente. Sinergia IA despacha payloads estructurados cuando ocurren cambios.
              </span>

              <div className="space-y-4 text-xs">
                {/* Destination */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-550 font-bold uppercase font-mono block">URI Destinatario del Servidor Webhook (HTTP POST)</label>
                  <input 
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] focus:bg-white"
                    placeholder="https://servidor-externo.com/api"
                  />
                </div>

                {/* Subscribed Events */}
                <div className="border border-slate-150 rounded-xl p-3 space-y-2">
                  <span className="text-[9.5px] font-mono uppercase text-slate-400 font-bold block">Eventos Activos</span>
                  <div className="space-y-1.5 font-sans">
                    <label className="flex items-center gap-2 text-xs text-slate-655 cursor-pointer select-none">
                      <input type="checkbox" checked={webhookEvents.onBookingCreated} onChange={(e) => setWebhookEvents(p => ({ ...p, onBookingCreated: e.target.checked }))} className="w-3.5 h-3.5 text-amber-600 rounded" />
                      <span>booking.created (Firma al crear reserva directa)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-655 cursor-pointer select-none">
                      <input type="checkbox" checked={webhookEvents.onBookingCancelled} onChange={(e) => setWebhookEvents(p => ({ ...p, onBookingCancelled: e.target.checked }))} className="w-3.5 h-3.5 text-amber-600 rounded" />
                      <span>booking.cancelled (Sincronizar cancelaciones/salida)</span>
                    </label>
                  </div>
                </div>

                {/* Simulate click test */}
                <button
                  type="button"
                  id="unified-btn-trigger-webhook-test"
                  onClick={handleTriggerTestWebhook}
                  disabled={testWebhookStatus === 'sending'}
                  className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700`}
                >
                  {testWebhookStatus === 'sending' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitiendo payload local...</span>
                    </>
                  ) : testWebhookStatus === 'success' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>¡Respuesta del Receptor: 200 OK!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Mandar Petición de Prueba (POST JSON)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Webhook inspector terminal logs box */}
            <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[350px]">
              
              <div className="bg-slate-950 p-2.5 border-b border-slate-800 flex justify-between items-center text-slate-300 font-mono text-[10px]">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-500" />
                  <span className="font-bold">Consola Webhook Dispatcher de Sinergia (Tránsito Raw JSON)</span>
                </div>
                <span className="text-emerald-400 font-bold leading-none animate-pulse">● ESCUCHANDO TRÁNSITO</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 flex-1">
                {/* List raw logs on the left column */}
                <div className="md:col-span-4 border-r border-slate-800/85 max-h-[140px] md:max-h-none overflow-y-auto">
                  {webhookLogs.length === 0 ? (
                    <span className="text-slate-500 font-mono text-[10.5px] p-4 block text-center">Sin logs de tránsitos</span>
                  ) : (
                    webhookLogs.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedLogId(g.id)}
                        className={`w-full p-2.5 text-left border-b border-slate-800/40 font-mono text-[10px] transition-all cursor-pointer block ${
                          selectedLogId === g.id ? 'bg-slate-800 text-white' : 'text-slate-450 hover:bg-slate-850/30'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-amber-400 font-bold uppercase">{g.event.replace('booking.', '')}</span>
                          <span className="text-emerald-400 font-bold">200 OK</span>
                        </div>
                        <div className="flex justify-between items-center text-[8.5px] text-slate-600 mt-1">
                          <span>{g.id}</span>
                          <span>{g.timestamp}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Show JSON parsed format on the right column */}
                <div className="md:col-span-8 bg-slate-950 p-3 overflow-y-auto max-h-[285px] md:max-h-[320px] scrollbar-thin">
                  {(() => {
                    const currentLog = webhookLogs.find(v => v.id === selectedLogId);
                    if (!currentLog) {
                      return <span className="text-slate-550 font-mono text-[11px] block text-center p-8">Selecciona un registro para ver el JSON</span>;
                    }
                    const stringified = JSON.stringify(currentLog.payload, null, 2);

                    return (
                      <div className="space-y-3 text-[10.5px] font-mono leading-relaxed">
                        <div className="flex justify-between items-center text-slate-400 text-[10.1px] border-b border-slate-900 pb-1.5">
                          <span>Payload Evento: <strong className="text-emerald-405">{currentLog.event}</strong></span>
                          <button
                            type="button"
                            onClick={() => triggerCopyNotification(stringified, 'webhook')}
                            className="text-indigo-400 font-bold flex items-center gap-1 hover:text-white"
                          >
                            {copiedText === 'webhook' ? 'Copiado ✓' : 'Copiar JSON'}
                          </button>
                        </div>
                        <pre className="text-emerald-400 overflow-x-auto text-[10.5px] whitespace-pre-wrap font-bold leading-normal">
                          {stringified}
                        </pre>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* SECTION 4: API REST LIVE DISTRIBUTION ENDPOINT */}
        <section id="sec-api-distribution" className="bg-slate-50/50 border border-slate-200 p-4 sm:p-6 rounded-3xl space-y-5 shadow-2xs scroll-mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-205 pb-4 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-violet-100 text-violet-700 font-black rounded-lg flex items-center justify-center text-xs font-mono">4</span>
              <div>
                <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider">CANAL DE DISTRIBUCIÓN INVENTARIO API REST DIRECTA</h3>
                <p className="text-[11px] text-slate-500 font-medium">Expone un endpoint GET JSON autenticado para distribuidores o desarrolladores externos de forma directa.</p>
              </div>
            </div>
            <span className="text-[10px] bg-violet-50 border border-violet-200 text-violet-750 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider shrink-0">
              Distribuidor Rest API
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* REST Details Card */}
            <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-[11px] text-slate-550 block leading-relaxed font-sans font-medium">
                Permite a asociados de software independientes consultar la disponibilidad de este inmueble en tiempo real sin colapsar tu servidor. Las tarifas ya heredan las reglas de precios del PMS.
              </span>

              <div className="space-y-4 text-xs font-mono">
                {/* Bearer credentials */}
                <div className="space-y-1.5 text-sans font-sans">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-450 uppercase font-bold font-mono">Bear Token de Autenticación</span>
                    <button
                      type="button"
                      onClick={() => setApiBearerToken(`sk_sinergia_live_${Math.random().toString(36).substring(2, 10).toUpperCase()}`)}
                      className="text-[9px] text-indigo-600 hover:text-indigo-850 font-bold flex items-center gap-0.5 font-mono"
                    >
                      Regenerar Clave
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={apiBearerToken} 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono text-[10px] text-slate-600 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => triggerCopyNotification(apiBearerToken, 'token')}
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-mono font-bold p-1.5 rounded-lg text-xs"
                    >
                      {copiedText === 'token' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {/* HTTP curl snippet */}
                <div className="space-y-2 text-sans font-sans font-medium">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                    <span>Llamada de Endpoint (cURL)</span>
                    <button
                      type="button"
                      onClick={() => triggerCopyNotification(`curl -X GET "https://api.sinergia-ia.network/v1/availability?hotelId=${currentHotelId}" \\
  -H "Authorization: Bearer ${apiBearerToken}"`, 'api')}
                      className="text-indigo-650 font-bold"
                    >
                      {copiedText === 'api' ? 'Copiado ✓' : 'Copiar cURL'}
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[10px] font-mono leading-normal select-all">
                    {`curl -X GET "https://api.sinergia-ia.network/v1/availability?hotelId=${currentHotelId}" \\
  -H "Authorization: Bearer ${apiBearerToken}"`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Simulated REST response JSON syntax box */}
            <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[300px]">
              <div className="bg-slate-950 p-2.5 border-b border-slate-800 flex justify-between items-center font-mono text-slate-400 text-[10px]">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-violet-550" />
                  <span>Respuesta HTTP GET JSON disponible (Live PMS)</span>
                </div>
                <span className="text-violet-400 font-bold">200 OK</span>
              </div>

              <div className="p-3 bg-slate-950/60 overflow-y-auto max-h-[320px]">
                <pre className="text-[10px] font-mono text-violet-300 leading-normal scrollbar-thin">
                  {getAPIDistributionJSON()}
                </pre>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
