import React, { useState } from 'react';
import { Room, Reservation, Guest, MaintenanceTicket, RoomStatus } from '../types';
import { Sparkles, Wrench, Shield, CheckCircle, AlertOctagon, UserPlus, LogOut, Plus, X, DollarSign } from 'lucide-react';

interface PMSGridProps {
  rooms: Room[];
  reservations: Reservation[];
  tickets: MaintenanceTicket[];
  guests: Guest[];
  onUpdateRoomStatus: (roomId: string, status: RoomStatus) => void;
  onAddReservation: (res: Reservation) => void;
  onUpdateReservationStatus: (resId: string, status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled') => void;
  onAddTicket: (ticket: MaintenanceTicket) => void;
  onResolveTicket: (ticketId: string) => void;
  onAddGuest: (guest: Guest) => void;
  currentHotelId: string;
}

export default function PMSGrid({
  rooms,
  reservations,
  tickets,
  guests,
  onUpdateRoomStatus,
  onAddReservation,
  onUpdateReservationStatus,
  onAddTicket,
  onResolveTicket,
  onAddGuest,
  currentHotelId
}: PMSGridProps) {
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Modals inside component
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Form State: Check-in
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [stayNights, setStayNights] = useState(2);

  // Form State: Maintenance
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const hotelRooms = rooms.filter(r => r.hotelId === currentHotelId);
  const filteredRooms = statusFilter === 'all' 
    ? hotelRooms 
    : hotelRooms.filter(r => r.status === statusFilter);

  // Helper: Find reservation details of occupied room
  const getActiveReservation = (roomId: string) => {
    return reservations.find(res => res.roomId === roomId && (res.status === 'checked_in' || res.status === 'confirmed'));
  };

  // Helper: Find maintenance tickets of room
  const getActiveTicket = (roomId: string) => {
    return tickets.find(t => t.roomId === roomId && t.status !== 'resolved');
  };

  // Handle Action: Register Guest & Active Check-In
  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !guestName || !guestEmail) return;

    // Check if guest exists in CRM or add them
    const existingGuest = guests.find(g => g.email.toLowerCase() === guestEmail.toLowerCase());
    if (!existingGuest) {
      const newGuestObj: Guest = {
        id: `guest-${Date.now()}`,
        name: guestName,
        email: guestEmail,
        phone: '+57 320 000 0000',
        totalSpent: selectedRoom.ratePerNight * stayNights,
        reservationsCount: 1,
        preferences: ['Llegada manual'],
        loyaltyTier: 'Classic'
      };
      onAddGuest(newGuestObj);
    }

    // Create reservation
    const todayStr = new Date().toISOString().split('T')[0];
    const checkoutDate = new Date();
    checkoutDate.setDate(checkoutDate.getDate() + stayNights);
    const checkoutStr = checkoutDate.toISOString().split('T')[0];

    const totalAmount = selectedRoom.ratePerNight * stayNights;

    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      hotelId: currentHotelId,
      roomId: selectedRoom.id,
      guestName,
      guestEmail,
      checkIn: todayStr,
      checkOut: checkoutStr,
      status: 'checked_in',
      guestsCount,
      totalAmount,
      outstandingBalance: 0
    };

    onAddReservation(newRes);
    onUpdateRoomStatus(selectedRoom.id, 'occupied');
    
    // Reset Form
    setGuestName('');
    setGuestEmail('');
    setGuestsCount(1);
    setStayNights(2);
    setShowCheckInModal(false);
    setSelectedRoom(null);
  };

  // Handle Action: Create Maintenance Ticket
  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !ticketDescription) return;

    const newTicket: MaintenanceTicket = {
      id: `t-${Date.now()}`,
      hotelId: currentHotelId,
      roomId: selectedRoom.id,
      description: ticketDescription,
      priority: ticketPriority,
      status: 'pending',
      reportedDate: new Date().toISOString()
    };

    onAddTicket(newTicket);
    onUpdateRoomStatus(selectedRoom.id, 'maintenance');

    setTicketDescription('');
    setTicketPriority('medium');
    setShowMaintenanceModal(false);
    setSelectedRoom(null);
  };

  // Handle Action: Check-out Guest
  const handleCheckOut = (resId: string, roomId: string) => {
    onUpdateReservationStatus(resId, 'checked_out');
    onUpdateRoomStatus(roomId, 'cleaning');
    setSelectedRoom(null);
  };

  // Status Badge mappings
  const STATUS_DETAILS: Record<RoomStatus, { bg: string, text: string, label: string, icon: any }> = {
    available: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700 hover:bg-emerald-100', label: 'Disponible', icon: CheckCircle },
    occupied: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700 hover:bg-indigo-100', label: 'Ocupado', icon: Shield },
    cleaning: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700 hover:bg-amber-100', label: 'Limpieza', icon: Sparkles },
    maintenance: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700 hover:bg-rose-100', label: 'Mantenimiento', icon: Wrench }
  };

  return (
    <div id="pms-grid-container" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
      {/* Header and Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-5 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">PMS Hotelero - Tablero de Habitaciones</h2>
          <p className="text-xs text-slate-400 mt-1">Supervisa en tiempo real el catálogo de cuartos, gestiona check-ins, registros y limpiezas cotidianas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
              statusFilter === 'all' 
                ? 'bg-slate-800 text-white shadow-xs' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({hotelRooms.length})
          </button>
          {(['available', 'occupied', 'cleaning', 'maintenance'] as RoomStatus[]).map(status => {
            const count = hotelRooms.filter(r => r.status === status).length;
            const details = STATUS_DETAILS[status];
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all border ${
                  statusFilter === status 
                    ? 'bg-slate-800 text-white shadow-xs border-slate-800' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-transparent'
                }`}
              >
                {details.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of rooms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm font-mono border border-dashed border-slate-200 rounded-xl">
            No se encontraron habitaciones en esta condición.
          </div>
        ) : (
          filteredRooms.map(room => {
            const details = STATUS_DETAILS[room.status];
            const StatusIcon = details.icon;
            const activeRes = room.status === 'occupied' ? getActiveReservation(room.id) : null;
            const activeTicket = room.status === 'maintenance' ? getActiveTicket(room.id) : null;

            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`relative border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xs flex flex-col justify-between ${details.bg} h-[135px]`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-500 bg-white/60 px-1.5 py-0.5 rounded-sm">
                      {room.number}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${details.text} bg-white/80 border border-slate-100`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {details.label}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 mt-2.5 truncate">{room.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{room.type}</p>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2 bg-transparent">
                  <span className="text-slate-500 font-mono font-medium">${room.ratePerNight} USD / noche</span>
                  {activeRes && (
                    <span className="text-[10px] text-slate-500 truncate max-w-[90px] font-medium" title={activeRes.guestName}>
                      👤 {activeRes.guestName.split(' ')[0]}
                    </span>
                  )}
                  {activeTicket && (
                    <span className="text-[10px] text-rose-500 font-mono" title={activeTicket.description}>
                      ⚠️ Alerta
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail panel of selected room */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="bg-slate-800 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-indigo-300 uppercase tracking-widest">Habitación {selectedRoom.number}</span>
                <h3 className="text-lg font-semibold mt-1">{selectedRoom.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedRoom(null)} 
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-slate-100 pb-4">
                <div>
                  <p className="text-slate-400 uppercase tracking-wider text-[10px]">Estructura</p>
                  <p className="text-slate-700 mt-1 font-medium text-sm">{selectedRoom.type}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wider text-[10px]">Capacidad máxima</p>
                  <p className="text-slate-700 mt-1 font-medium text-sm">{selectedRoom.capacity} Huéspedes</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wider text-[10px]">Tarifa Base</p>
                  <p className="text-slate-700 mt-1 font-medium text-sm">${selectedRoom.ratePerNight} USD / noche</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wider text-[10px]">Estado Actual</p>
                  <p className="text-slate-700 mt-1 font-medium text-sm capitalize">{selectedRoom.status}</p>
                </div>
              </div>

              {/* Status Specific Info */}
              {selectedRoom.status === 'occupied' && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-500 font-semibold font-mono">DATOS DEL HUÉSPED ACTIVO</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.2 font-mono uppercase">Check-In Activo</span>
                  </div>
                  {(() => {
                    const res = getActiveReservation(selectedRoom.id);
                    if (!res) return <p className="text-xs text-slate-400">Ningún huésped reportado.</p>;
                    return (
                      <div className="space-y-1.5 text-xs">
                        <p className="font-semibold text-slate-800 text-sm">👤 {res.guestName}</p>
                        <p className="text-slate-500">📧 {res.guestEmail}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 font-mono text-slate-600">
                          <p>📅 Entrada: <strong>{res.checkIn}</strong></p>
                          <p>📅 Salida: <strong>{res.checkOut}</strong></p>
                          <p>💰 Total Estadía: <strong>${res.totalAmount} USD</strong></p>
                          <p>💵 Saldo Pendiente: <strong className="text-amber-600">${res.outstandingBalance} USD</strong></p>
                        </div>
                        
                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
                          <button
                            onClick={() => handleCheckOut(res.id, selectedRoom.id)}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <LogOut className="w-4 h-4" />
                            Registrar Check-out
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {selectedRoom.status === 'available' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Esta habitación se encuentra desocupada e higienizada. Puedes registrar un check-in inmediato de manera manual.</p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowCheckInModal(true)}
                      className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      Ingresar Check-in Manual
                    </button>
                    <button
                      onClick={() => setShowMaintenanceModal(true)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Wrench className="w-4 h-4" />
                      Reparación
                    </button>
                  </div>
                </div>
              )}

              {selectedRoom.status === 'cleaning' && (
                <div className="space-y-3 bg-amber-50/50 border border-amber-200 p-4 rounded-xl">
                  <p className="text-xs text-amber-800">🧹 <strong>En proceso de limpieza:</strong> La habitación se encuentra de alta prioridad para rotar en el sistema. El staff debe confirmar el aseo absoluto.</p>
                  <button
                    onClick={() => {
                      onUpdateRoomStatus(selectedRoom.id, 'available');
                      setSelectedRoom(null);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar Habitación Limpia y Disponible
                  </button>
                </div>
              )}

              {selectedRoom.status === 'maintenance' && (
                <div className="bg-rose-50/40 border border-rose-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs font-mono">
                    <AlertOctagon className="w-4 h-4" /> TICKET DE INCIDENTE ACTIVO
                  </div>
                  {(() => {
                    const ticket = getActiveTicket(selectedRoom.id);
                    if (!ticket) return <p className="text-xs text-slate-400">No se encontraron tickets registrados.</p>;
                    return (
                      <div className="text-xs space-y-2">
                        <p className="text-slate-700 italic bg-white p-2.5 rounded border border-rose-100">"{ticket.description}"</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500">
                          <p>Gravedad: <strong className="text-rose-600 uppercase">{ticket.priority}</strong></p>
                          <p>Fecha Reg: <strong>{new Date(ticket.reportedDate).toLocaleDateString()}</strong></p>
                        </div>
                        <button
                          onClick={() => {
                            onResolveTicket(ticket.id);
                            onUpdateRoomStatus(selectedRoom.id, 'available');
                            setSelectedRoom(null);
                          }}
                          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar Solucionado y Liberar Habitación
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-500 font-mono">AMENIDADES & SERVICIOS</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedRoom.amenities.map(item => (
                    <span key={item} className="text-[10px] bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded font-mono">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini check-in form Modal */}
      {showCheckInModal && selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-semibold text-slate-800">Check-in Manual para {selectedRoom.number}</h3>
              <button onClick={() => setShowCheckInModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 font-mono">Nombre Completo del Huésped</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 font-mono">Correo Electrónico (Para CRM)</label>
                <input
                  type="email"
                  required
                  placeholder="Ej. juan.perez@email.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 font-mono">Noches de Estadía</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={stayNights}
                    onChange={(e) => setStayNights(parseInt(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 font-mono">Cant. Personas</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedRoom.capacity}
                    required
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs text-slate-600 flex justify-between">
                <span>Total Estimado ({stayNights} noches):</span>
                <strong className="text-slate-800">${(selectedRoom.ratePerNight * stayNights).toLocaleString()} USD</strong>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="flex-1 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 py-2 rounded-lg shadow-sm"
                >
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Form Modal */}
      {showMaintenanceModal && selectedRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-semibold text-slate-800">Reportar Incidente en {selectedRoom.number}</h3>
              <button onClick={() => setShowMaintenanceModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 font-mono">Descripción del Daño</label>
                <textarea
                  required
                  placeholder="Detalla de la manera más limpia la avería encontrada de plomería, domótica, o pintura..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 font-mono">Severidad / Prioridad</label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as any)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-hidden"
                >
                  <option value="low">Baja (Mobiliario menor / decoración)</option>
                  <option value="medium">Media (Servicios que no impiden descanso)</option>
                  <option value="high">Alta (Fuga de agua / Chapa bloqueada / Falla de luz)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="flex-1 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 py-2 rounded-lg shadow-sm"
                >
                  Reportar Daño
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
