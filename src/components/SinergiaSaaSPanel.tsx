import React, { useState } from 'react';
import { 
  CreditCard, Check, Shield, Zap, Receipt, Compass, 
  HelpCircle, RefreshCw, Cpu, Award, Globe, HelpCircle as HelpIcon, 
  ChevronRight, Sparkles, Building, Briefcase, FileText, Download 
} from 'lucide-react';
import { SinergiaLogo, SinergiaIcon } from './SinergiaIcon';
import { Room, Reservation } from '../types';

interface SinergiaSaaSPanelProps {
  activeUserProfile: any;
  setActiveUserProfile: (profile: any) => void;
  profiles: any[];
  setProfiles: (profiles: any[]) => void;
  rooms: Room[];
  reservations: Reservation[];
}

export default function SinergiaSaaSPanel({
  activeUserProfile,
  setActiveUserProfile,
  profiles,
  setProfiles,
  rooms,
  reservations
}: SinergiaSaaSPanelProps) {
  // Billing local state
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'COP'>('USD');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annually'>('monthly');
  const [ccName, setCcName] = useState('José Urdaneta');
  const [ccNumber, setCcNumber] = useState('•••• •••• •••• 8294');
  const [ccExp, setCcExp] = useState('09/29');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);

  // Simulated metrics
  const activeRoomsCount = rooms.length;
  const bookingsCount = reservations.length;
  const aiQueriesCount = 1420; // Simulated active Gemini token pulls

  // Price conversion helper
  const formatSaaSPrice = (amountUsd: number) => {
    if (currency === 'EUR') {
      return `€${Math.round(amountUsd * 0.92)}`;
    }
    if (currency === 'COP') {
      return `$${(amountUsd * 4100).toLocaleString()} COP`;
    }
    return `$${amountUsd} USD`;
  };

  // SaaS subscription plans array
  const SAAS_PLANS = [
    {
      id: 'essential',
      name: 'Sinergia Essential Ops',
      badge: 'MEMBRESÍA BRONZE',
      price: 49,
      allowedTabs: ['pms'],
      desc: 'Ideal para glampings independientes o posadas que solo necesitan control de aseo e inventario básico local.',
      features: [
        'Tablero PMS Inteligente (Gantt)',
        'Hasta 5 unidades activas',
        'Checklists de Limpieza',
        'Soporte estándar comunitario'
      ],
      color: 'border-orange-200 text-orange-850',
      badgeColor: 'bg-orange-50 border-orange-200 text-orange-700'
    },
    {
      id: 'standard',
      name: 'Sinergia Standard PMS',
      badge: 'MEMBRESÍA GOLD',
      price: 99,
      allowedTabs: ['pms', 'crm', 'booking'],
      desc: 'Excelente para hoteles medianos y apartamentos vacacionales que buscan recibir reservas directas.',
      features: [
        'Tablero PMS Completo',
        'Huéspedes CRM Integrado',
        'Motor de Reserva Sinergia Directo',
        'Hasta 25 unidades de inventario',
        'Soporte prioritario por email'
      ],
      color: 'border-slate-200 text-slate-800',
      badgeColor: 'bg-slate-100 border-slate-300 text-slate-800'
    },
    {
      id: 'pro',
      name: 'Sinergia Pro Suite',
      badge: 'MEMBRESÍA PLATINUM',
      price: 199,
      allowedTabs: ['pms', 'channels', 'pricing', 'crm', 'booking', 'bi'],
      desc: 'La suite completa de hospitalidad con integraciones de canales y control analítico de tarifa dinámica.',
      features: [
        'PMS Multi-Propiedades',
        'Sinergia Directo sin comisión',
        'Channel Manager Sinergia Sync',
        'Planes Tarifarios Dinámicos',
        'Consola Analítica Revenue Pro',
        'Acceso Co-Piloto IA de Recepción'
      ],
      isPopular: true,
      color: 'border-emerald-300 text-emerald-900',
      badgeColor: 'bg-emerald-50 border-emerald-300 text-emerald-800'
    },
    {
      id: 'enterprise',
      name: 'Sinergia Enterprise Unlimited',
      badge: 'MEMBRESÍA PLATINUM +',
      price: 399,
      allowedTabs: ['pms', 'channels', 'pricing', 'crm', 'booking', 'bi', 'blueprint'],
      desc: 'Soberanía tecnológica total construida para agencias creativas, franquicias, y grandes cadenas hoteleras.',
      features: [
        'Ecosistema global sin límites',
        'SysAdmin Central Integrado',
        'Drizzle PostgreSQL Schemas',
        'Integración API Webhook Raw',
        'Control Total Orquestador Multi-propiedad',
        'Soporte 24/7 de Agencia Creativa Sinergia'
      ],
      color: 'border-indigo-305 text-indigo-950',
      badgeColor: 'bg-indigo-50 border-indigo-200 text-indigo-750'
    }
  ];

  // Past simulated invoices
  const PAST_INVOICES = [
    { id: 'FAC-2026-004', date: '21 Jun 2026', plan: activeUserProfile.membershipPlan, amount: activeUserProfile.role === 'admin' ? 399 : activeUserProfile.role === 'owner' ? 399 : activeUserProfile.role === 'receptionist' ? 99 : 49, status: 'Pagado' },
    { id: 'FAC-2026-003', date: '21 May 2026', plan: activeUserProfile.membershipPlan, amount: activeUserProfile.role === 'admin' ? 399 : activeUserProfile.role === 'owner' ? 399 : activeUserProfile.role === 'receptionist' ? 99 : 49, status: 'Pagado' },
    { id: 'FAC-2026-002', date: '21 Abr 2026', plan: activeUserProfile.membershipPlan, amount: activeUserProfile.role === 'admin' ? 399 : activeUserProfile.role === 'owner' ? 399 : activeUserProfile.role === 'receptionist' ? 99 : 49, status: 'Pagado' },
    { id: 'FAC-2026-001', date: '21 Mar 2026', plan: 'Sinergia Standard PMS', amount: 99, status: 'Pagado' },
  ];

  // Upgrade / Downgrade user membership in real-time
  const performTierUpgrade = (plan: any) => {
    // 1. Map the plan selected back to user's profile configurations
    const updatedProfile = {
      ...activeUserProfile,
      membershipPlan: plan.name,
      membershipBadge: plan.badge,
      allowedTabs: plan.allowedTabs,
      badgeBg: plan.id === 'essential' ? 'bg-orange-50 border-orange-250 text-orange-850' : 
               plan.id === 'standard' ? 'bg-slate-100 border-slate-300 text-slate-700' :
               plan.id === 'pro' ? 'bg-emerald-50 border-emerald-305 text-emerald-800' :
               'bg-amber-100 border-amber-300 text-amber-800',
      badgeTextColor: plan.id === 'essential' ? 'text-orange-850 border-orange-200' : 
                      plan.id === 'standard' ? 'text-slate-750 border-slate-300' :
                      plan.id === 'pro' ? 'text-emerald-850 border-emerald-400' :
                      'text-amber-805 border-amber-400',
      description: `Ecosistema SaaS actualizado a la membresía ${plan.name} para control de hospitalidad central.`
    };

    // 2. Update active profile
    setActiveUserProfile(updatedProfile);

    // 3. Update profiles list
    setProfiles(profiles.map(p => p.id === activeUserProfile.id ? updatedProfile : p));

    setNotifyMsg(`¡Suscripción actualizada de manera exitosa a la licencia: ${plan.name}! Las pestañas correspondientes se han desbloqueado al instante.`);
    setTimeout(() => setNotifyMsg(null), 5000);
  };

  return (
    <div id="sinergia-saas-dashboard" className="space-y-6 text-slate-800 font-sans">
      
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-[#0B523A] to-[#123E2F] text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-[-30%] right-[-10%] w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-3 z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-900/40 border border-emerald-500/30 px-3 py-1 rounded-full text-xs text-amber-300 font-mono">
            <span>✨</span> Portal de Licencias y Facturación SaaS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
            Central de Control de Membresías
          </h1>
          <p className="text-xs text-emerald-100/90 max-w-xl leading-relaxed">
            Consola centralizada para clientes e inquilinos corporativos de <strong className="text-white hover:underline">Sinergia Agencia Creativa</strong>. Configura las capacidades contratadas, consulta el consumo de tokens y revisa el libro contable de tu cuenta de forma autónoma.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-4 shrink-0 min-w-[240px] text-left z-10 space-y-2">
          <span className="text-[9px] uppercase font-mono tracking-wider text-amber-300 font-extrabold block">Inquilino Corporativo Activo</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeUserProfile.avatar}</span>
            <div>
              <h4 className="text-xs font-bold font-sans text-white leading-tight">{activeUserProfile.name.split(' (')[0]}</h4>
              <span className="text-[10px] text-emerald-200 mt-0.5 block">{activeUserProfile.email}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] font-mono">
            <span className="text-emerald-350 font-semibold uppercase">Membresía actual:</span>
            <span className="text-amber-300 font-bold uppercase">{activeUserProfile.membershipBadge.split(' ')[1] || 'Socio Pro'}</span>
          </div>
        </div>
      </div>

      {notifyMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-850 rounded-2xl text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notifyMsg}</span>
        </div>
      )}

      {/* Grid: Overview telemetry & Payment Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Telemetry and metrics (Left side) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SaaS Telemetry telemetry charts or stats */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-5">
            <h3 className="text-xs font-mono font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              🚀 Consumo Recurrente & Telemetría SaaS de la Cuenta
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">HABITACIONES ACTIVAS</span>
                  <Building className="w-4 h-4 text-[#0B523A]" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1.5">
                  <span className="text-2xl font-black text-slate-900">{activeRoomsCount}</span>
                  <span className="text-[10px] text-slate-400 font-mono">unidades</span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium">De un inventario total disponible.</div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">RESERVAS DIRECTAS</span>
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1.5">
                  <span className="text-2xl font-black text-slate-900">{bookingsCount}</span>
                  <span className="text-[10px] text-slate-400 font-mono">emitidas</span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium">Cero comisiones, procesadas 100% directas.</div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">LLAMADOS GEMINI AI</span>
                  <Cpu className="w-4 h-4 text-[#D1A12A]" />
                </div>
                <div className="flex items-baseline gap-1.5 pt-1.5">
                  <span className="text-2xl font-black text-slate-900">{aiQueriesCount}</span>
                  <span className="text-[10px] text-slate-400 font-mono">tokens</span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium">Consumo de co-piloto y recepción virtual Inteligente.</div>
              </div>

            </div>

            <div className="space-y-3.5 pt-2">
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono font-semibold uppercase mb-1">
                  <span>Plataforma Cloud Run Server Computing</span>
                  <span>94.2% Eficiente</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#0B523A] h-full rounded-full" style={{ width: '94.2%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono font-semibold uppercase mb-1">
                  <span>API Sinergia-Sync Channel Syncing (Frecuencia 3min)</span>
                  <span>14,194 / 15,000 Peticiones</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#D1A12A] h-full rounded-full" style={{ width: '88.5%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Plans Selection Matrix */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="text-xs font-mono font-extrabold uppercase text-slate-500 tracking-wider">
                  🛎️ Conmutador de Membresías Globales
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Presiona sobre registrar para alterar tus privilegios y habilitar tableros en tiempo real.</span>
              </div>

              {/* Interval / Currency selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={currency}
                  onChange={(e: any) => setCurrency(e.target.value)}
                  className="bg-slate-50 border border-slate-250 text-[10px] font-bold text-slate-700 p-1.5 rounded-lg focus:outline-hidden"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="COP">COP ($)</option>
                </select>

                <div className="bg-slate-100 border border-slate-200 p-0.5 rounded-lg flex">
                  <button
                    type="button"
                    onClick={() => setBillingInterval('monthly')}
                    className={`text-[9px] font-bold p-1 px-2.5 rounded-md transition-all ${billingInterval === 'monthly' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-505'}`}
                  >
                    Mensual
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval('annually')}
                    className={`text-[9px] font-bold p-1 px-2.5 rounded-md transition-all ${billingInterval === 'annually' ? 'bg-[#0B523A] text-white shadow-3xs' : 'text-slate-505'}`}
                  >
                    Anual (-20%)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAAS_PLANS.map((plan) => {
                const isActive = activeUserProfile.membershipPlan.toLowerCase().includes(plan.id) || 
                                 (plan.id === 'pro' && activeUserProfile.membershipPlan.toLowerCase() === 'sinergia pro suite') ||
                                 (plan.id === 'enterprise' && activeUserProfile.membershipPlan.toLowerCase().includes('enterprise'));
                
                const discountedPrice = billingInterval === 'annually' ? Math.round(plan.price * 0.8) : plan.price;

                return (
                  <div 
                    key={plan.id}
                    className={`border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all relative ${
                      isActive 
                        ? 'border-[#0B523A] bg-emerald-50/20 ring-2 ring-[#0B523A]/10' 
                        : 'border-slate-150 hover:border-slate-300'
                    }`}
                  >
                    {plan.isPopular && (
                      <span className="absolute top-3 right-3 text-[8px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Recomendado Suite
                      </span>
                    )}

                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 font-sans">{plan.name}</span>
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 scale-95 ${plan.color}`}>
                          {plan.id.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 leading-relaxed font-sans">{plan.desc}</p>
                      
                      {/* Price tag */}
                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="text-xl font-mono font-extrabold text-slate-800">{formatSaaSPrice(discountedPrice)}</span>
                        <span className="text-[8px] text-slate-400 font-mono"> / {billingInterval === 'monthly' ? 'mes' : 'año'}</span>
                      </div>

                      {/* Bullet features */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-left">
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[9.5px] text-slate-650">
                            <span className="text-[#0B523A] text-[9px]">✔</span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => performTierUpgrade(plan)}
                      disabled={isActive}
                      className={`w-full font-mono font-bold text-[9px] py-1.5 rounded-xl uppercase tracking-wider border transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#0B523A] text-white border-[#0B523A] font-sans' 
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isActive ? '✓ Licencia Activa Siguiente renovación' : '⚙️ Migrar Suscripción e Inyectar Permisos'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Payment and past bills list (Right side) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Credit Card & billing settings panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-mono font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              💳 Tarjeta Débito / Crédito Simulada
            </h3>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Define la tarjeta bancaria de simulación registrada para los cobros automáticos de hosting de Sinergia.
            </p>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-2xl text-white font-mono space-y-5 relative overflow-hidden shadow-md">
              <div className="absolute right-[-10%] bottom-[-15%] w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <SinergiaIcon className="w-6 h-6" />
                  <span className="text-[9px] font-black tracking-widest text-[#D1A12A]">SINERGIA CARD</span>
                </div>
                <div className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded uppercase font-bold text-slate-300">SaaS VIP</div>
              </div>

              <div className="space-y-1">
                <input 
                  type="text" 
                  value={ccNumber} 
                  onChange={(e) => setCcNumber(e.target.value)}
                  className="bg-transparent border-b border-slate-800 focus:border-indigo-400 w-full text-sm tracking-widest text-slate-100 placeholder-slate-700 py-1 focus:ring-0 focus:outline-hidden"
                  placeholder="Número de Tarjeta"
                />
                <span className="text-[7px] text-slate-500 uppercase font-mono block">Número de Cuenta de Facturación</span>
              </div>

              <div className="flex justify-between gap-2.5 text-[9px] uppercase font-mono">
                <div className="grow">
                  <input 
                    type="text" 
                    value={ccName} 
                    onChange={(e) => setCcName(e.target.value)}
                    className="bg-transparent border-b border-slate-800 focus:border-indigo-400 w-full text-slate-100 placeholder-slate-700 py-0.5 focus:ring-0 focus:outline-hidden"
                    placeholder="TITULAR CARD"
                  />
                  <span className="text-[7.5px] text-slate-500 block mt-0.5">Titular</span>
                </div>
                <div className="w-16">
                  <input 
                    type="text" 
                    value={ccExp} 
                    onChange={(e) => setCcExp(e.target.value)}
                    className="bg-transparent border-b border-slate-800 focus:border-indigo-400 w-full text-slate-100 placeholder-slate-700 py-0.5 text-center focus:ring-0 focus:outline-hidden"
                    placeholder="MM/AA"
                  />
                  <span className="text-[7.5px] text-slate-500 block text-center mt-0.5">Exp</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setNotifyMsg('Los parámetros de la tarjeta corporativa de cobros en Sinergia se han guardado.');
                setTimeout(() => setNotifyMsg(null), 3500);
              }}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-805 font-mono font-bold text-[9px] uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer"
            >
              ✓ Actualizar Cuenta Bancaria Corporativa
            </button>
          </div>

          {/* Past Invoice Receipts List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-mono font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              🧾 Facturación Histórica Contable
            </h3>

            <div className="space-y-2">
              {PAST_INVOICES.map((inv) => (
                <div 
                  key={inv.id} 
                  className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl p-3 flex justify-between items-center gap-2 text-xs transition-all hover:border-slate-300"
                >
                  <div className="space-y-0.5 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800">{inv.id}</span>
                      <span className="text-[8px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.1 rounded uppercase font-bold font-mono">
                        {inv.status}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 block">{inv.date}</span>
                    <span className="text-[8px] text-slate-500 block leading-tight font-sans truncate max-w-[150px]">{inv.plan}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-bold text-slate-800">{formatSaaSPrice(inv.amount)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="bg-white hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg text-slate-600 transition-all cursor-pointer hover:border-slate-350"
                      title="Ver Factura en PDF"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Invoice Detail Printable Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full shadow-2xl p-6 sm:p-8 space-y-6 text-slate-800 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 text-left relative">
            
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 border border-slate-150 p-1 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
            >
              ✕
            </button>

            {/* Sinergia Brand Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-slate-200 pb-5">
              <SinergiaLogo className="flex items-center gap-2" showSubtitle={true} />
              
              <div className="text-right space-y-1">
                <h4 className="text-sm font-mono font-extrabold uppercase text-[#0B523A]">FACTURA COMERCIAL SAAS</h4>
                <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                  <div><span className="font-bold">Número:</span> {selectedInvoice.id}</div>
                  <div><span className="font-bold">Fecha de Emisión:</span> {selectedInvoice.date}</div>
                  <div><span className="font-bold">Ciclo:</span> Facturación Mensual Automática</div>
                  <div><span className="font-bold">Socio ID:</span> {activeUserProfile.id}</div>
                </div>
              </div>
            </div>

            {/* Billing Entities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 bg-slate-50 border border-slate-150 p-3 rounded-xl">
                <span className="text-[8px] text-slate-400 font-extrabold uppercase font-mono block">EMISOR / OPERADOR COBRADOR</span>
                <p className="font-bold text-[#0B523A]">SINERGIA AGENCIA CREATIVA S.A.</p>
                <p className="text-[10px] text-indigo-950/80 font-mono">ID de Impuestos: SEC-CO-827495-A</p>
                <p className="text-[10px] text-slate-500 leading-normal">Edificio Creativo Sinergia, Piso 4, Medellín, Colombia.</p>
              </div>

              <div className="space-y-1 bg-slate-50 border border-slate-150 p-3 rounded-xl">
                <span className="text-[8px] text-slate-400 font-extrabold uppercase font-mono block">CLIENTE SUSCRIPTOR FACTURADO</span>
                <p className="font-bold text-slate-800">{activeUserProfile.name}</p>
                <p className="text-[10px] text-[#0B523A] font-mono leading-none">Email: {activeUserProfile.email}</p>
                <p className="text-[10px] text-slate-500 leading-normal">ID de Contrato SaaS: CONTRATO-SINE-09148</p>
              </div>
            </div>

            {/* Table Details */}
            <div className="border border-slate-205 rounded-xl overflow-hidden mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase font-mono text-[9px] font-bold">
                    <th className="p-3">DESCRIPCIÓN DE SERVICIO</th>
                    <th className="p-3 text-center">NOTAS / PARCULS</th>
                    <th className="p-3 text-right">UNIDADES</th>
                    <th className="p-3 text-right">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{selectedInvoice.plan}</div>
                      <span className="text-[9px] text-slate-405 font-mono block">Licencia de software ERP para hotelería con tableros PMS inteligentes</span>
                    </td>
                    <td className="p-3 text-center text-[10px] text-slate-500 font-mono">Plan Vigente</td>
                    <td className="p-3 text-right text-slate-600">1 Suscripción</td>
                    <td className="p-3 text-right font-mono text-slate-800">{formatSaaSPrice(selectedInvoice.amount)}</td>
                  </tr>
                  
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-800">Uso de Agentes AI de Orquestador Gemini</div>
                      <span className="text-[9px] text-slate-405 font-mono block">Prompt tokens ilimitados para la conserje Sofía y el de Revenue Mateo</span>
                    </td>
                    <td className="p-3 text-center text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 rounded">Bonificación 100%</td>
                    <td className="p-3 text-right text-slate-600">Incluido</td>
                    <td className="p-3 text-right font-mono text-slate-800">{formatSaaSPrice(0)}</td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-800">Sinergia Sync Channel Manager API (Tránsito XML)</div>
                      <span className="text-[9px] text-slate-405 font-mono block">Enrutamiento bidireccional seguro hacia Airbnb, Booking, y OTA extranjeras</span>
                    </td>
                    <td className="p-3 text-center text-[10px] text-slate-400 font-mono">Bilateral Link</td>
                    <td className="p-3 text-right text-slate-600">Canales Ilimitados</td>
                    <td className="p-3 text-right font-mono text-slate-800">{formatSaaSPrice(0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Balance block */}
            <div className="flex flex-col items-end gap-1 text-xs border-t border-slate-100 pt-4">
              <div className="flex justify-between w-48 text-slate-500">
                <span>Subtotal Neto:</span>
                <span className="font-mono">{formatSaaSPrice(selectedInvoice.amount)}</span>
              </div>
              <div className="flex justify-between w-48 text-slate-500">
                <span>IVA / Impuestos (0%):</span>
                <span className="font-mono">{formatSaaSPrice(0)}</span>
              </div>
              <div className="h-px bg-slate-200 w-48 my-1"></div>
              <div className="flex justify-between w-48 text-sm font-black text-[#0B523A]">
                <span>Total Facturado:</span>
                <span className="font-mono">{formatSaaSPrice(selectedInvoice.amount)}</span>
              </div>
            </div>

            {/* Guarantee Plaque / Seal Footer */}
            <div className="p-3 bg-emerald-50/40 border border-[#0B523A]/10 rounded-2xl flex items-start gap-2.5 text-[10.5px] text-slate-600">
              <Shield className="w-4.5 h-4.5 text-[#0B523A] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 font-bold block">Garantía Sinergia Verified & Paid</strong>
                Esta factura se liquidó automáticamente utilizando la tarjeta autorizada del suscriptor. Este comprobante tiene plena validez fiscal dentro de los términos y condiciones de software como servicio de <span className="font-semibold text-[#0B523A]">Sinergia Agencia Creativa</span>.
              </div>
            </div>

            {/* Action controls inside dialog */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[9px] uppercase tracking-wider py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Descargar PDF / Imprimir Folio
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="bg-slate-100 hover:bg-slate-150 text-slate-700 font-mono font-bold text-[9px] uppercase tracking-wider py-2 px-4 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
