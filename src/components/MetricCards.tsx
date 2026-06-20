import { Room, Reservation, MaintenanceTicket } from '../types';
import { BedDouble, Users, DollarSign, Wrench, Percent } from 'lucide-react';

interface MetricCardsProps {
  rooms: Room[];
  reservations: Reservation[];
  tickets: MaintenanceTicket[];
}

export default function MetricCards({ rooms, reservations, tickets }: MetricCardsProps) {
  // Total Rooms
  const totalRoomsCount = rooms.length;
  
  // Occupied Rooms count
  const occupiedRoomsCount = rooms.filter(r => r.status === 'occupied').length;
  
  // Occupancy rate %
  const occupancyRate = totalRoomsCount > 0 
    ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) 
    : 0;
    
  // Dynamic calculation of today's Revenue (Checked in reservations total mount)
  const activeReservations = reservations.filter(res => res.status === 'checked_in');
  const todayRevenue = activeReservations.reduce((sum, res) => sum + res.totalAmount, 0);

  // Pending balance (to be collected at checkout)
  const pendingCollection = activeReservations.reduce((sum, res) => sum + res.outstandingBalance, 0);

  // Active incidents (maintenance tickets pending)
  const activeIncidents = tickets.filter(t => t.status !== 'resolved').length;

  return (
    <div id="metric-cards-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* CARD 1: Ocupación */}
      <div id="card-occupancy" className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Ocupación</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-2">{occupancyRate}%</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 font-mono">
          {occupiedRoomsCount} de {totalRoomsCount} habs ocupadas
        </p>
      </div>

      {/* CARD 2: Ingreso de Estadías */}
      <div id="card-revenue" className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Ingresos</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-2">${todayRevenue.toLocaleString()} USD</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 font-mono">
          Por {activeReservations.length} huéspedes activos
        </p>
      </div>

      {/* CARD 3: Cuentas por Cobrar */}
      <div id="card-outstanding" className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-2">${pendingCollection.toLocaleString()} USD</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 font-mono">
          Por consumos o saldos pendientes
        </p>
      </div>

      {/* CARD 4: Mantenimiento */}
      <div id="card-maint" className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Incidentes</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-2">{activeIncidents}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 font-mono">
          Tickets de reparación abiertos
        </p>
      </div>

      {/* CARD 5: Habitaciones Libres */}
      <div id="card-available" className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Habs. Libres</p>
            <h3 className="text-2xl font-semibold text-slate-800 mt-2">{rooms.filter(r => r.status === 'available').length}</h3>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
            <BedDouble className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 font-mono">
          Listas para check-in inmediato
        </p>
      </div>
    </div>
  );
}
