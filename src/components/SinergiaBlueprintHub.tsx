import React, { useState } from 'react';
import { 
  ShieldAlert, Settings, FileText, Database, Code, 
  Terminal, BarChart, Server, Layers, Cpu, Play, CheckCircle2, 
  Copy, Info, HelpCircle, Activity, Layout, GitFork, BookOpen, Clock
} from 'lucide-react';

export default function SinergiaBlueprintHub() {
  const [activeSubTab, setActiveSubTab] = useState<'saas' | 'database' | 'apis' | 'ai' | 'uxui' | 'devops' | 'roadmap'>('saas');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [simQuery, setSimQuery] = useState<string>('GET /api/v1/pms/rooms/availability');
  const [simResponse, setSimResponse] = useState<any>(null);
  const [simloading, setSimloading] = useState<boolean>(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const runMockApiQuery = () => {
    setSimloading(true);
    setSimResponse(null);
    setTimeout(() => {
      setSimloading(false);
      if (simQuery.includes('availability')) {
        setSimResponse([
          { roomId: "room-uuid-4455", number: "104", type: "standard_matrimonial", baseRate: 150.00, multiplier: 1.15, finalRate: 172.50 }
        ]);
      } else if (simQuery.includes('direct-checkout')) {
        setSimResponse({
          success: true, reservationId: "res-direct-9025", hotelId: "hotel-uuid-1122", roomId: "room-uuid-4455", guestId: "guest-uuid-9900", outstandingBalance: 0.00, totalCharged: 450.00, status: "confirmed"
        });
      } else {
        setSimResponse({ status: "healthy", version: "1.0.0-PROD", tenantActive: true });
      }
    }, 1000);
  };

  const schemaCode = `// datasource config
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Company {
  id               String             @id @default(uuid())
  name             String             @unique
  legalIdentifier  String             @db.VarChar(50) // NIT
  representative   String
  email            String             @unique
  isActive         Boolean            @default(true)
  createdAt        DateTime           @default(now())
  
  subscription     Subscription?
  hotels           Hotel[]
  employees        Employee[]
  guests           Guest[]
}

model Subscription {
  id               String             @id @default(uuid())
  companyId        String             @unique
  company          Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  planId           String
  status           SubscriptionStatus @default(TRIAL)
  startDate        DateTime           @default(now())
  endDate          DateTime
}`;

  return (
    <div className="space-y-6">
      
      {/* Dynamic Gold Badge Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-6 shadow-md border border-indigo-500/25 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl font-mono select-none pointer-events-none">ERP</div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="space-y-1.5">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider">
              ✦ PLANOS DE PRODUCCIÓN EMPRESARIAL REAL ✦
            </span>
            <h2 className="text-xl font-bold tracking-tight">Sinergia IA Hospitality Blueprint Inspector</h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Consola interactiva de ingeniería de sistemas. Explora de forma directa el esquema relacional PostgreSQL, el pipeline de inyección inteligente RAG, APIs y la infraestructura multi-contenedor configurada para escalar.
            </p>
          </div>
          <a
            href="#blueprint-docs"
            onClick={() => handleCopy(schemaCode, 'prisma')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[10px] font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedText === 'prisma' ? '¡COPIADO!' : 'COPIAR CORE PRISMA'}
          </a>
        </div>

        {/* Blueprint subnavigator */}
        <div className="flex flex-wrap gap-2.5 mt-6 border-t border-slate-800 pt-4 text-xs font-mono">
          {(['saas', 'database', 'apis', 'ai', 'uxui', 'devops', 'roadmap'] as const).map(tab => {
            const labels = {
              saas: 'SaaS Architecture',
              database: 'Postgres Scheme',
              apis: 'API Standards',
              ai: 'Gemini Multi-Agent',
              uxui: 'UI/UX Wireframes',
              devops: 'DevOps CI/CD',
              roadmap: 'Roadmap & Manuals'
            };
            const isActive = activeSubTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'bg-slate-800/40 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER DYNAMIC ARCHITECTURE DETAILS BASED ON SELECTION */}
      
      {/* 1. SAAS ARCHITECTURE */}
      {activeSubTab === 'saas' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase font-mono text-slate-700 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              SaaS Multi-tenant Control
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              El esquema garantiza total aislamiento lógico a través de identificadores de inquilino (`tenantId`/`companyId`) forzados de manera transparente mediante middlewares dinámicos en Prisma ORM.
            </p>
            
            <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 p-2.5 font-bold font-mono border-b border-slate-150">Aislamiento de Recursos</div>
              <div className="p-3 space-y-2 leading-relaxed text-slate-655 font-mono text-[10.5px]">
                <div className="flex justify-between">
                  <span>Isolación de Config:</span>
                  <span className="font-bold text-indigo-605">TenantSettings</span>
                </div>
                <div className="flex justify-between">
                  <span>Factura Electrónica:</span>
                  <span className="font-bold text-indigo-650">Aislado por Prefijo</span>
                </div>
                <div className="flex justify-between">
                  <span>Límites de Cuartos:</span>
                  <span className="font-bold text-amber-600">SaaSPlan Limits</span>
                </div>
                <div className="flex justify-between">
                  <span>Filtro Row-level:</span>
                  <span className="font-bold text-emerald-600">Postgres Custom RLS</span>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl text-[11px] leading-relaxed text-indigo-900">
              <span className="font-bold block mb-1">Nota del Administrador Root:</span>
              Como usuario ROOT global, la plataforma le autoriza vigilar las métricas de todas las empresas afiliadas, desactivar suscripciones vencidas y auditar eventos transaccionales desde un único portal consolidador.
            </div>
          </div>

          <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-800">Mapa de Capas Multi-Inquilino (Active Schema Visualizer)</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="border border-indigo-200 bg-indigo-50/20 rounded-xl p-4 space-y-2">
                <span className="font-extrabold text-indigo-900 block text-[11px]">CAPA 1: SaaS Root Global</span>
                <p className="text-[10px] text-slate-500 leading-normal">Asigna límites de suscripción y administra servidores centrales en GCP.</p>
                <div className="text-[10px] bg-indigo-600 text-white rounded p-1 text-center font-bold">PROVISIÓN AUTOMÁTICA</div>
              </div>

              <div className="border border-indigo-250 bg-indigo-50/40 rounded-xl p-4 space-y-2">
                <span className="font-extrabold text-indigo-950 block text-[11px]">CAPA 2: Empresas Tenants</span>
                <p className="text-[10px] text-slate-500 leading-normal">Empresas con NIT único, empleados aislados, y catálogo local.</p>
                <div className="text-[10px] bg-slate-800 text-white rounded p-1 text-center font-bold">隔离 CAPA COMPLETA</div>
              </div>

              <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 space-y-2">
                <span className="font-extrabold text-emerald-900 block text-[11px]">CAPA 3: Hoteles & Sedes</span>
                <p className="text-[10px] text-slate-500 leading-normal">Sedes físicas de alojamientos, glampings o fincas independientes.</p>
                <div className="text-[10px] bg-emerald-600 text-white rounded p-1 text-center font-bold">HOTEL_LIMIT_CHECKED</div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[10.5px] leading-relaxed text-slate-655 space-y-2">
              <p className="font-bold">Estructura Detallada de Relaciones (Tenant Engine Mapping):</p>
              <pre className="text-[9.5px] overflow-x-auto text-indigo-900">
{`* SaaSPlan (1) ----> (*) Subscription (*) ----> (1) Company
* Company (1) ----> (*) TenantSettings (Aislamiento de variables de marca)
* Company (1) ----> (*) Hotel (Multi-sitio) ----> (*) Rooms ----> Housekeeping
* Company (1) ----> (*) Guest (CRM Corporativo Único)`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 2. POSTGRES SCHEME */}
      {activeSubTab === 'database' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase font-mono text-slate-700 tracking-wider">Esquema Prisma & PostgreSQL de Producción</h3>
              </div>
              <button 
                onClick={() => handleCopy(schemaCode, 'full-prisma')}
                className="text-[11px] font-mono hover:text-indigo-600 bg-slate-100 px-2.5 py-1 rounded transition-all font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedText === 'full-prisma' ? '¡COPIADO!' : 'COPIAR ARCHIVO COMPLETO'}
              </button>
            </div>
            
            <p className="text-xs text-slate-500 max-w-4xl leading-relaxed">
              Define todas las entidades obligatorias descritas para el ecosistema ERP: `hotels`, `branches`, `rooms`, `reservations`, `guests`, `housekeeping_tasks`, `maintenance_tickets`, `inventory`, `employees`, y `invoices` para facturación electrónica reglamentada.
            </p>

            <div className="relative bg-slate-900 text-slate-100 rounded-xl overflow-hidden">
              <div className="flex bg-slate-950 px-4 py-2 justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-800">
                <span>prisma/schema.prisma</span>
                <span>Production Standard</span>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto max-h-[385px] text-slate-300 leading-relaxed leading-normal">
{`// ==========================================
// CENTRAL POSTGRESQL SCHEMAS FOR SINERGIA IA
// ==========================================

model Room {
  id               String             @id @default(uuid())
  hotelId          String
  hotel            Hotel              @relation(fields: [hotelId], references: [id])
  number           String             @db.VarChar(20)
  type             String             @db.VarChar(50) // Suite, Double, single, etc.
  capacity         Int                @default(2)
  ratePerNight     Decimal            @db.Decimal(10, 2)
  status           RoomStatus         @default(AVAILABLE)
  createdAt        DateTime           @default(now())

  reservations     Reservation[]
  housekeepingTasks HousekeepingTask[]
}

model Reservation {
  id               String             @id @default(uuid())
  roomId           String
  room             Room               @relation(fields: [roomId], references: [id])
  guestId          String
  guest            Guest              @relation(fields: [guestId], references: [id])
  checkIn          DateTime
  checkOut         DateTime
  status           ReservationStatus  @default(CONFIRMED)
  totalAmount      Decimal            @db.Decimal(10, 2)
  outstandingBalance Decimal          @db.Decimal(10, 2) @default(0.0)
}

model HousekeepingTask {
  id               String             @id @default(uuid())
  roomId           String
  room             Room               @relation(fields: [roomId], references: [id])
  priority         String             @default("medium") // high, medium, low
  status           String             @default("pending") // pending, verifying, completed
  checklist        String[]           // Ej: ["Cambiar sábanas", "Desinfectar baño"]
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 3. API STANDARDS */}
      {activeSubTab === 'apis' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase font-mono text-slate-700 tracking-wider flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-600" />
              API Playground & Specs
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Selecciona un endpoint para simular la solicitud mediante el cliente HTTP integrado. El backend validará la disponibilidad del PMS o el cargo seguro PSE/Stripe.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold">Endpoint a Consumir</label>
                <select
                  value={simQuery}
                  onChange={(e) => setSimQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono cursor-pointer"
                >
                  <option value="GET /api/v1/pms/rooms/availability">GET /api/v1/pms/rooms/availability</option>
                  <option value="POST /api/v1/pms/reservations/direct-checkout">POST /api/v1/pms/reservations/direct-checkout</option>
                  <option value="GET /api/v1/pms/health">GET /api/v1/pms/health</option>
                </select>
              </div>

              <button
                type="button"
                onClick={runMockApiQuery}
                disabled={simloading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-2.5 rounded-lg text-xs tracking-tight flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                {simloading ? 'CONSULTANDO API...' : 'EJECUTAR LLAMADA RPC'}
              </button>
            </div>

            {/* Simulated Live API Sandbox output */}
            <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 p-2 border-b border-slate-150 font-bold font-mono text-[10px] text-slate-500 flex justify-between">
                <span>CONSOLA HTTP CLIENT</span>
                <span className="text-emerald-600 font-mono">STATUS: 200 OK</span>
              </div>
              <div className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] overflow-auto h-[180px]">
                {simloading ? (
                  <div className="flex items-center gap-2 h-full justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                    Enviando request headers y validando tenant...
                  </div>
                ) : simResponse ? (
                  <pre>{JSON.stringify(simResponse, null, 2)}</pre>
                ) : (
                  <span className="text-slate-500">Haz click en "Ejecutar llamada RPC" para procesar la transacción segura mediante la API del Siteminder PMS.</span>
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-800">Esquema de Consultas GraphQL (Audit & Analytics Queries)</h4>
            
            <div className="relative bg-slate-900 text-slate-100 rounded-xl overflow-hidden leading-relaxed">
              <div className="flex bg-slate-950 px-4 py-2 justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-800">
                <span>graphql/schema.gql</span>
                <span>Type Definitions</span>
              </div>
              <pre className="p-4 text-[10.5px] font-mono overflow-x-auto max-h-[300px] text-slate-300 leading-normal">
{`type RevenueKPI {
  averageDailyRate: Float!
  revenuePerAvailableRoom: Float!
  occupancyPercentage: Float!
  projectedMonthlyRevenue: Float!
  otaCommissionsSavedUSD: Float!
}

type Query {
  calculateLiveRevenueKPIs(
    hotelId: ID!, 
    targetOccupancy: Int!, 
    pricingPlanId: ID!, 
    elasticModifierPct: Int!
  ): RevenueKPI!
  
  getAuditLogByHotel(hotelId: ID!, limit: Int): [HotelAuditLog!]!
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 4. GEMINI MULTI-AGENT */}
      {activeSubTab === 'ai' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase font-mono text-slate-700 tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Sinergia IA Multi-Agent Orchestrator
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              El motor asincrónico encadena agentes expertos en cada módulo. Cuando hables con la barra del chat lateral, tu llamada se encamina mediante embeddings hacia el agente adecuado.
            </p>

            <div className="space-y-3 text-xs leading-relaxed font-mono">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10.5px]">
                  <strong className="text-indigo-705">1. Agente Recepcionista</strong>
                  <span className="text-[9.5px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.2 rounded font-mono font-bold uppercase">Ready</span>
                </div>
                <p className="text-[10px] text-slate-500">Consulta estatus de cuartas y registra reservas inmediatas llamando funciones nativas.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10.5px]">
                  <strong className="text-amber-705">2. Agente Housekeeping</strong>
                  <span className="text-[9.5px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.2 rounded font-mono font-bold uppercase">Ready</span>
                </div>
                <p className="text-[10px] text-slate-500">Asignación estructurada y secuenciada ante cancelaciones y check-ins prioritarios.</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[10.5px]">
                  <strong className="text-rose-705">3. Agente Financiero</strong>
                  <span className="text-[9.5px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.2 rounded font-mono font-bold uppercase">Active</span>
                </div>
                <p className="text-[10px] text-slate-500">Calculador analítico del RevPAR y modelador dinámico de tarifas en canales.</p>
              </div>
            </div>
          </div>

          <div className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-800">Pipeline RAG & Vector Embeddings Data-Flow</h4>
            
            <div className="relative bg-slate-900 border border-slate-850 rounded-xl p-4 font-mono text-[10.5px] leading-relaxed text-slate-350 space-y-3">
              <span className="font-bold text-white block text-xs underline">Esquema Técnico de Bloques RAG (Knowledge Retrieval)</span>
              <p>
                Cada manual operativo cargado al sistema se indexa en fragmentos que permiten resolver dudas locales sobre procesos fiscales o de limpieza en segundos.
              </p>
              <pre className="text-[9.5px] text-emerald-450 bg-slate-950 p-3 rounded overflow-x-auto leading-normal">
{`1. RAW FILES (.pdf, .docx, manuales_hoteleros)
   └─ Split chunk sizes: 512 tokens (Solapamiento de 50 tokens)
2. GENERAR VECTORES
   └─ API: Vertex AI Multimodal Embeddings (768 dimensiones)
3. VECTOR SEARCH INSTRUMENTATION
   └─ Vector Database: Vertex AI Vector Search o Cosine Similarity Postgres
4. PIPELINE INYECTOR
   └─ Prompt System Context + Chunks recuperados + Entrada de Usuario`}
              </pre>
              <p className="text-[9.5px] text-slate-400">
                La base de conocimiento de la empresa provee respuestas seguras sin inventar procesos, validada por el control de agentes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. UI/UX WIREFRAMES */}
      {activeSubTab === 'uxui' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
          <h3 className="text-xs font-bold uppercase font-mono text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Layout className="w-4 h-4 text-indigo-600" />
            Matriz de Diseño UX/UI & Navegación de los 6 Módulos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="font-extrabold text-slate-800">1. Dashboard SaaS Admin</span>
              <ul className="space-y-1 text-[10px] text-slate-500 list-disc list-inside">
                <li>Bento-grids de Consumo CPU/RAM</li>
                <li>Habilitador/Inhibidor de Tenants</li>
                <li>Monitoreo de ingresos MRR globales</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="font-extrabold text-slate-800">2. Dashboard Empresa Nit</span>
              <ul className="space-y-1 text-[10px] text-slate-500 list-disc list-inside">
                <li>Administrador de Facturación Fiscal</li>
                <li>Control de suscripciones</li>
                <li>Gestor centralizado de empleados</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="font-extrabold text-slate-800">3. Dashboard Sede Hotel</span>
              <ul className="space-y-1 text-[10px] text-slate-500 list-disc list-inside">
                <li>Visualizador 3D de Cuartos</li>
                <li>Buscador de alertas de stock SKU</li>
                <li>Controlador de tarifas estacionales</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="font-extrabold text-slate-800">4. Recepción PMS Core</span>
              <ul className="space-y-1 text-[10px] text-slate-500 list-disc list-inside">
                <li>Calendario Gantt de Arrastrar</li>
                <li>Caja de Checkout directo rápido</li>
                <li>Carga inmediata al CRM integrado</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="font-extrabold text-slate-800">5. Housekeeping Mobile</span>
              <ul className="space-y-1 text-[10px] text-slate-500 list-disc list-inside">
                <li>Botones táctiles de checklists</li>
                <li>Iniciador del cronograma del día</li>
                <li>Cámara para subir evidencia fotográfica</li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="font-extrabold text-slate-800">6. Mantenimiento Técnico</span>
              <ul className="space-y-1 text-[10px] text-slate-500 list-disc list-inside">
                <li>Tablero Kanban de Tickets</li>
                <li>Calculador de vida de activos fijos</li>
                <li>Bitácora de compras urgentes</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 6. DEVOPS CI/CD */}
      {activeSubTab === 'devops' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase font-mono text-slate-700 tracking-wider flex items-center gap-1.5">
              <Server className="w-5 h-5 text-indigo-500" />
              Contenedor Universal Dockerfile
            </h3>

            <div className="relative bg-slate-900 text-slate-100 rounded-xl overflow-hidden leading-relaxed">
              <div className="flex bg-slate-950 px-4 py-2 justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-800">
                <span>Dockerfile</span>
                <span>Alpine Multi-Stage</span>
              </div>
              <pre className="p-4 text-[10px] font-mono overflow-x-auto max-h-[300px] text-slate-350 leading-normal">
{`FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]`}
              </pre>
            </div>
          </div>

          <div className="xl:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase font-mono text-slate-700 tracking-wider flex items-center gap-1.5">
              <GitFork className="w-5 h-5 text-indigo-500" />
              Github Actions Workflow
            </h3>

            <div className="relative bg-slate-900 text-slate-100 rounded-xl overflow-hidden leading-relaxed">
              <div className="flex bg-slate-950 px-4 py-2 justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-800">
                <span>.github/workflows/deploy.yml</span>
                <span>Automatic GCP Deployment</span>
              </div>
              <pre className="p-4 text-[10px] font-mono overflow-x-auto max-h-[300px] text-slate-355 leading-normal">
{`name: Deploy To Google Cloud Run
on:
  push:
    branches: [ "main" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: google-github-actions/auth@v2
    - name: Build and Push Container
      run: |
        docker build -t us-east1-docker.pkg.dev/sinergia/prod-app .
        docker push us-east1-docker.pkg.dev/sinergia/prod-app
    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy sinergia-erp --image us-east1-docker...`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 7. ROADMAP & MANUALS */}
      {activeSubTab === 'roadmap' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase font-mono text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Sprints de Desarrollo (Gantt Plan)
            </h3>
            
            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-start gap-3">
                <span className="p-1 px-2 rounded bg-indigo-100 text-indigo-700 font-bold text-[10.5px]">Sprint 1-2</span>
                <div className="space-y-0.5">
                  <strong className="text-slate-800">Fundación SaaS & Multi-Tenant Isolation</strong>
                  <p className="text-[10.5px] text-slate-500">Aislamiento lógico mediante Prisma & control de suscripciones por empresas Nit.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="p-1 px-2 rounded bg-indigo-100 text-indigo-700 font-bold text-[10.5px]">Sprint 3-4</span>
                <div className="space-y-0.5">
                  <strong className="text-slate-800">PMS Front-Desk Gantt & Operaciones</strong>
                  <p className="text-[10.5px] text-slate-500">Calendario interactivo, cuadrícula de limpieza y control de mantenimiento físico.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="p-1 px-2 rounded bg-indigo-100 text-indigo-700 font-bold text-[10.5px]">Sprint 5-6</span>
                <div className="space-y-0.5">
                  <strong className="text-slate-800">Integración de Agentes Gemini IA & RAG</strong>
                  <p className="text-[10.5px] text-slate-500">Ejecución automática de comandos y entrenamiento conceptual del manual hotelero.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="p-1 px-2 rounded bg-indigo-100 text-indigo-700 font-bold text-[10.5px]">Sprint 7-8</span>
                <div className="space-y-0.5">
                  <strong className="text-slate-800">Sincronización OTA Channels & GCP Deploy</strong>
                  <p className="text-[10.5px] text-slate-500">Integración bidireccional Booking/Airbnb y empaquetado del workflow de Cloud Run.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase font-mono text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Manual de Operación de Escala
            </h3>

            <p className="text-xs text-slate-555 leading-relaxed leading-normal">
              Directrices de administración del ecosistema ERP, garantizando resiliencia y disponibilidad en producción corporativa bajo alta densidad de check-ins inmediatos.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 font-mono text-[10.5px] leading-relaxed text-slate-655">
              <div className="space-y-1">
                <strong>💡 Protocolo Ante Pérdida de Sincronía OTA:</strong>
                <p className="text-[10px] text-slate-500">El sistema limpia automáticamente las llaves de cache en Redis y re-inyecta la disponibilidad PMS prioritariamente.</p>
              </div>

              <div className="space-y-1">
                <strong>⚡ Reparto de Consultas de Lectura (Read Replicas):</strong>
                <p className="text-[10px] text-slate-500">Las visualizaciones densas de RevPAR del modulo BI cargan desde replicas de lectura de base de datos para no estresar el maestro.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
