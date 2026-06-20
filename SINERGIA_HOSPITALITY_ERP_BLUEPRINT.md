# ARCHITECTURAL & DEPLOYMENT BLUEPRINT: SINERGIA IA HOSPITALITY ERP
## EQUIPO DE ARQUITECTURA, INGENIERÍA DE SOFTWARE & LIDERAZGO DE PRODUCTO
**Estado:** Listo para Desarrollo y Despliegue de Producción (Production-Ready)
**Versión del Sandbox:** 1.0.0-PROD
**Fecha de Emisión:** 2026-06-18

---

## 1. ARQUITECTURA EMPRESARIAL COMPLETA (SaaS ENTERPRISE MULTI-TENANT)

El sistema **Sinergia IA Hospitality ERP** implementa una arquitectura SaaS Multitenant con aislamiento riguroso a nivel lógico (Logical Tenant Isolation) y esquemas unificados de base de datos distribuidas con Row-Level Security (RLS) en Postgres.

```
+-----------------------------------------------------------------------------------+
|                            CLIENTE WEB AUTOMÁTICO                                 |
|         (React 19, Next.js 15, TailwindCSS, Apollo Client, Recharts, Lucide)      |
+-----------------------------------------------------------------------------------+
                                         |  HTTPS / WSS (WebSocket Secure)
                                         v
+-----------------------------------------------------------------------------------+
|                        APIGATEWAY / CLOUD CDN / NGINX PROXY                       |
|          Soporte HTTPS, Autenticación MFA, Filtro DDoS, Caché Estáticos           |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                     NESTJS MICROSERVICES & CORE BACKEND                           |
|        Auth Guard (JWT / OAuth2), Central Routing, GraphQL Engine, REST API       |
+-----------------------------------------------------------------------------------+
       | (Redis PubSub)                  | (gRPC Core Links)              |
       v                                 v                                v
+----------------------+     +-----------------------+       +----------------------+
|    REDIS CACHE &     |     |   GEMINI AI AGENTS    |       |   VERTEX AI VECTOR    |
|   SESSION ENGINE     |     |  (Function Calling)   |       |   DB (RAG ENGINE)    |
+----------------------+     +-----------------------+       +----------------------+
                                         | (Prisma Client pool)
                                         v
+-----------------------------------------------------------------------------------+
|                          CLOUD SQL DATABASE (POSTGRESQL)                          |
|         Soporte Tenant-Aislado, Clustering Read-Replicas, Row-Level Security       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                      STORAGE SERVER (GOOGLE CLOUD STORAGE)                        |
|             Ubicación Segura de Evidencias Housekeeping y Fotos de Cuartos         |
+-----------------------------------------------------------------------------------+
```

### Protocolo de Seguridad en Aislamiento Multi-Tenant:
1. **Tenant Filtering Middleware:** Cada solicitud de API o conexión WebSocket valida un token JWT que incluye la propiedad `tenantId`. Un middleware inyecta este identificador en el contexto local de Prisma.
2. **Dynamic Connection Pooling o Global tenantId Filter:** El ORM ejecuta de manera transparente filtros automáticos (`WHERE tenant_id = tenantId`) en todas las consultas de selección, actualización y borrado.
3. **Database Schema:** Uso de un único esquema Postgres particionado lógicamente a través de índices compuestos para optimizar rendimiento por inquilino.

---

## 2. CONFIGURACIÓN PRISMA ORM & ESQUEMA POSTGRESQL COMPLETO

Esquema de base de datos de producción con soporte de relaciones íntegras, índices de alto rendimiento en llaves foráneas y filtrado de inquilinos.

```prisma
// datasource config
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==========================================
// 1. ARQUITECTURA MULTITENANT & CONTROL SAAS
// ==========================================

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  SUSPENDED
  CANCELLED
}

model Company {
  id               String             @id @default(uuid())
  name             String             @unique
  legalIdentifier  String             @db.VarChar(50) // NIT / RUT / RFC
  representative   String
  email            String             @unique
  phone            String?
  isActive         Boolean            @default(true)
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  
  // Relations
  subscription     Subscription?
  hotels           Hotel[]
  employees        Employee[]
  guests           Guest[]
  tenantSettings   TenantSettings[]
  crmContacts      CrmContact[]
}

model Subscription {
  id               String             @id @default(uuid())
  companyId        String             @unique
  company          Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  planId           String
  plan             SaaSPlan           @relation(fields: [planId], references: [id])
  status           SubscriptionStatus @default(TRIAL)
  startDate        DateTime           @default(now())
  endDate          DateTime
  billingCycle     String             @default("monthly") // monthly, yearly
  isActive         Boolean            @default(true)
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
}

model SaaSPlan {
  id               String             @id @default(uuid())
  name             String             @unique
  description      String
  maxHotels        Int                @default(1)
  maxRooms         Int                @default(15)
  maxEmployees     Int                @default(5)
  priceMonth       Decimal            @db.Decimal(10, 2)
  priceYear        Decimal            @db.Decimal(10, 2)
  features         String[]           // Array de features soportadas (ej: ["GEMINI_CHAT", "BI_REVENUE", "CHANNELS_SYNC"])
  subscriptions    Subscription[]
  createdAt        DateTime           @default(now())
}

model TenantSettings {
  id               String             @id @default(uuid())
  companyId        String
  company          Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  key              String             @db.VarChar(100)
  value            String             @db.Text
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  @@unique([companyId, key])
}

// ==========================================
// 2. MÓDULO HOTELES & INFRAESTRUCTURA HÁBITAT
// ==========================================

enum HotelType {
  HOTEL
  HOSTEL
  APARTMENT
  GLAMPING
  FINCAVACACIONAL
}

model Hotel {
  id               String             @id @default(uuid())
  companyId        String
  company          Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  name             String
  type             HotelType          @default(HOTEL)
  address          String
  city             String
  rating           Float              @default(5.0)
  phone            String?
  isActive         Boolean            @default(true)
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  // sub-estructura física
  branches         Branch[]
  rooms            Room[]
  maintenanceTickets MaintenanceTicket[]
}

model Branch {
  id               String             @id @default(uuid())
  hotelId          String
  hotel            Hotel              @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  name             String
  address          String
  floors           Floor[]
}

model Floor {
  id               String             @id @default(uuid())
  branchId         String
  branch           Branch             @relation(fields: [branchId], references: [id], onDelete: Cascade)
  number           String
  name             String?
  rooms            Room[]
}

// ==========================================
// 3. MÓDULO HABITACIONES & TARIFAS
// ==========================================

enum RoomStatus {
  AVAILABLE
  OCCUPIED
  RESERVED
  CLEANING
  MAINTENANCE
  BLOCKED
}

model Room {
  id               String             @id @default(uuid())
  hotelId          String
  hotel            Hotel              @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  floorId          String?
  floor            Floor?             @relation(fields: [floorId], references: [id])
  number           String             @db.VarChar(20)
  type             String             @db.VarChar(50) // Suite, Double, Single, GlampingDome, etc.
  capacity         Int                @default(2)
  ratePerNight     Decimal            @db.Decimal(10, 2)
  status           RoomStatus         @default(AVAILABLE)
  amenities        String[]
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  // Relations
  reservations     Reservation[]
  housekeepingTasks HousekeepingTask[]
}

// ==========================================
// 4. MÓDULO RESERVAS & TRANSACCIONES (CORE PMS)
// ==========================================

enum ReservationStatus {
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
}

model Reservation {
  id               String             @id @default(uuid())
  hotelId          String
  roomId           String
  room             Room               @relation(fields: [roomId], references: [id], onDelete: Restrict)
  guestId          String
  guest            Guest              @relation(fields: [guestId], references: [id])
  checkIn          DateTimeRow        // Fecha de ingreso
  checkOut         DateTimeRow        // Fecha de salida
  status           ReservationStatus  @default(CONFIRMED)
  ratePaidPerNight Decimal            @db.Decimal(10, 2)
  totalAmount      Decimal            @db.Decimal(10, 2)
  outstandingBalance Decimal          @db.Decimal(10, 2) @default(0.0)
  paymentMethod    String             @default("pago_recepcion") // PSE, Nequi, Credit Card, etc.
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  // Relations
  invoices         Invoice[]
  posCharges       POSCharge[]
  logs             ReservationLog[]
}

model ReservationLog {
  id               String             @id @default(uuid())
  reservationId    String
  reservation      Reservation        @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  action           String             // Ej: "CHECK_IN_PERFORMED", "OUTSTANDING_BALANCE_PAID"
  notes            String?
  performedBy      String             // ID de empleado o "SYSTEM_AI"
  createdAt        DateTime           @default(now())
}

// ==========================================
// 5. CRM & CONTROL DE HUÉSPEDES
// ==========================================

enum LoyaltyTier {
  CLASSIC
  SILVER
  GOLD
  PLATINUM
}

model Guest {
  id               String             @id @default(uuid())
  companyId        String
  company          Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  name             String
  email            String             @unique
  phone            String
  documentNumber   String             @db.VarChar(50)
  documentType     String             @default("CC") // CC, Pasaporte, CE
  loyaltyTier      LoyaltyTier        @default(CLASSIC)
  totalSpent       Decimal            @db.Decimal(12, 2) @default(0.00)
  reservationsCount Int               @default(0)
  preferences      String[]
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  reservations     Reservation[]
}

// ==========================================
// 6. HOUSEKEEPING (LIMPIEZA) & MANTENIMIENTO
// ==========================================

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  VERIFYING
  COMPLETED
}

model HousekeepingTask {
  id               String             @id @default(uuid())
  roomId           String
  room             Room               @relation(fields: [roomId], references: [id], onDelete: Cascade)
  assignedEmployeeId String?
  assignedEmployee Employee?          @relation(fields: [assignedEmployeeId], references: [id])
  priority         TaskPriority       @default(MEDIUM)
  status           TaskStatus         @default(PENDING)
  checklist        String[]           // Ej: ["Cambiar sábanas", "Desinfectar baño", "Reponer Minibar"]
  notes            String?
  evidenceUrl      String?            // GCS photo integration url
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
}

model MaintenanceTicket {
  id               String             @id @default(uuid())
  hotelId          String
  hotel            Hotel              @relation(fields: [hotelId], references: [id], onDelete: Cascade)
  roomId           String?
  description      String
  priority         TaskPriority       @default(MEDIUM)
  status           String             @default("pending") // pending, in_progress, resolved
  cost             Decimal            @db.Decimal(10, 2) @default(0.00)
  reportedDate     DateTime           @default(now())
  resolvedDate     DateTime?
}

// ==========================================
// 7. INVENTARIOS & ALMACENAJE
// ==========================================

model InventoryItem {
  id               String             @id @default(uuid())
  hotelId          String
  sku              String             @unique
  name             String
  quantity         Int                @default(0)
  minStockAlert    Int                @default(5)
  category         String             @default("Suministros") // Amenity, Sábanas, Limpieza
  costPrice        Decimal            @db.Decimal(10, 2)
  supplier         String?
}

// ==========================================
// 8. RECURSOS HUMANOS (EMPLEADOS & ROLES)
// ==========================================

model Employee {
  id               String             @id @default(uuid())
  companyId        String
  company          Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  name             String
  email            String             @unique
  role             String             @default("receptionist") // administrator, receptionist, housekeeper, maintenance
  isActive         Boolean            @default(true)
  createdAt        DateTime           @default(now())
  
  // Relations
  housekeepingTasks HousekeepingTask[]
}

// ==========================================
// 9. CRM COMERCIAL SEGMENTACIÓN
// ==========================================

model CrmContact {
  id               String             @id @default(uuid())
  companyId        String
  company          Company            @relation(fields: [companyId], references: [id], onDelete: Cascade)
  firstName        String
  lastName         String
  email            String             @unique
  score            Int                @default(1) // 1 to 5 lead value score
  status           String             @default("lead") // lead, opportunity, qualified_guest
  createdAt        DateTime           @default(now())
}

// ==========================================
// 10. FACTURACIÓN ELECTRÓNICA & CAJA POS
// ==========================================

model Invoice {
  id               String             @id @default(uuid())
  reservationId    String
  reservation      Reservation        @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  invoiceNumber    String             @unique // Prefijo DIAN / Fiscal Electrónico
  issuedAt         DateTime           @default(now())
  subtotal         Decimal            @db.Decimal(10, 2)
  taxPercentage    Decimal            @db.Decimal(5, 2) @default(19.00) // 19% IVA Colombia
  taxAmount        Decimal            @db.Decimal(10, 2)
  total            Decimal            @db.Decimal(10, 2)
  isPaid           Boolean            @default(false)
}

model POSCharge {
  id               String             @id @default(uuid())
  reservationId    String
  reservation      Reservation        @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  item             String
  amount           Decimal            @db.Decimal(10, 2)
  timestamp        DateTime           @default(now())
}
```

---

## 3. DISEÑO DE INTERFACES API CORPORATIVAS RE-ESTRUCTURADAS (REST & GRAPHQL)

### A. ESPECIFICACIÓN REST API (MÓDULO DE RESERVAS & PAGOS PASARELA BANCARIA)

La plataforma dispone de endpoints tipados de forma estricta para la transacción directa y de canales.

#### 1. Iniciar Reserva Directa (Post)
* **Endpoint:** `POST /api/v1/pms/reservations/direct-checkout`
* **Cabeceras:**
  ```http
  Authorization: Bearer <JWT-Token>
  Content-Type: application/json
  x-tenant-id: <Company-UUID>
  ```
* **Estructura del Request Body (DTO):**
  ```json
  {
    "hotelId": "hotel-uuid-1122",
    "roomId": "room-uuid-4455",
    "guestName": "María Josefa Urdaneta",
    "guestEmail": "ma.josefa@correo.com",
    "checkIn": "2026-06-20",
    "nights": 3,
    "paymentMethod": "card_stripe_api",
    "paymentDetails": {
      "cardNumber": "4111222233334444",
      "expiry": "09/29",
      "cvv": "123"
    }
  }
  ```
* **Respuesta Exitosa (201 Created):**
  ```json
  {
    "success": true,
    "reservationId": "res-direct-9025",
    "hotelId": "hotel-uuid-1122",
    "roomId": "room-uuid-4455",
    "guestId": "guest-uuid-9900",
    "outstandingBalance": 0.00,
    "totalCharged": 450.00,
    "invoiceIssued": "INV-2026-00412",
    "status": "confirmed"
  }
  ```

#### 2. Consultar Disponibilidad Sincronizada PMS (Get)
* **Endpoint:** `GET /api/v1/pms/rooms/availability?hotelId=hotel-uuid-1122&checkIn=2026-06-20&nights=3`
* **Response (200 OK):**
  ```json
  [
    {
      "roomId": "room-uuid-4455",
      "number": "104",
      "type": "standard_matrimonial",
      "baseRate": 150.00,
      "multiplier": 1.15,
      "finalRate": 172.50
    }
  ]
  ```

---

### B. ESPECIFICACIÓN GRAPHQL SCHEMAS (AUDITORÍA & SINCRO BI REVENUE)

Para reportes rápidos y analíticas densas de Revenue Management, BI y auditoría.

```graphql
type Company {
  id: ID!
  name: String!
  legalIdentifier: String!
  representative: String!
  email: String!
}

type RevenueKPI {
  averageDailyRate: Float!
  revenuePerAvailableRoom: Float!
  occupancyPercentage: Float!
  projectedMonthlyRevenue: Float!
  otaCommissionsSavedUSD: Float!
}

type HotelAuditLog {
  id: ID!
  hotelId: ID!
  performedBy: String!
  action: String!
  notes: String
  createdAt: String!
}

type Query {
  getCompanySaaSPlan(companyId: ID!): Company!
  calculateLiveRevenueKPIs(hotelId: ID!, targetOccupancy: Int!, pricingPlanId: ID!, elasticModifierPct: Int!): RevenueKPI!
  getAuditLogByHotel(hotelId: ID!, limit: Int): [HotelAuditLog!]!
}

type Mutation {
  forceSynchronizeAllChannelsOTA(hotelId: ID!): Boolean!
  overrideRoomRateDynamic(roomId: ID!, newRate: Float!): Boolean!
}
```

---

## 4. SISTEMA DE AGENTES IA GEMINI & PIPELINE RAG AVANZADO

Se implementa una central multi-agente que opera asincronamente. Los agentes analizan registros y llaman a esquemas de base de datos de forma inteligente vía **Function Calling** nativo en el SDK de `@google/genai`.

### A. ORQUESTACIÓN MULTI-AGENTE SIFÓNICA

```
                   +------------------------------+
                   |   Sinergia IA Orchestrator   | (Enrutador de Consultas)
                   +------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                         |                         |
         v                         v                         v
+------------------+      +------------------+      +------------------+
| Agente Recepción |      | Agente Financiero|      | Agente Mantenim. |
|  - Check-in/out  |      |   - ADR & RevPAR |      |   - Incidencias  |
|  - Reservaciones |      |   - Tendencias   |      |   - Correctivos  |
+------------------+      +------------------+      +------------------+
```

1. **Agente Recepción:** Responde a requerimientos de check-in, check-out, y disponibilidad basándose en la llamada automática al resolver el estado de la cama/cuarto.
2. **Agente Housekeeping:** Organiza de manera autónoma los cuadrantes de empleadas de limpieza. Prioriza bajo criterio inteligente de "Hora de ingreso del huésped".
3. **Agente de Mantenimiento:** Diagnostica desgaste predictivo de activos de hotel, calculando la vida útil restante de aires acondicionados, saunas y jacuzzis.
4. **Agente de BI & Finanzas:** Lee históricos en la tabla `POSCharge` y `Reservation` para determinar si el hotel está subestimando sus tarifas basadas en fin de semana.
5. **Agente Gerencial CEO GPT:** Entrega diagnósticos listos para descargar o reportar en asambleas directivas de las empresas turísticas.

### B. ARQUITECTURA PIPELINE RAG (Sinergia Knowledge Base)

```
[Documentos: Manuales, PDF de DIAN, Contratos de Canales] 
                     |
                     v
             [Slicing / Chunking] (Tamaño de bloque: 512 tokens, 10% solapamiento)
                     |
                     v
       [Vertex AI Multimodal Embeddings v1]
                     |
                     v (Inyección persistente)
           [Vertex AI Vector Search]
                     |
                     +---------------------------+
                                                 | (Recuperación por similitud coseno)
                                                 v
  [Prompt de Entrada del Recepcionista] ---> [Generador Gemini-2.5-Flash] ---> [Respuesta Contextualizada]
```

* **Pipeline de Ingesta:** Escaneo nativo subido a Google Cloud Storage, transformación de bloques de PDF a texto plano, vectorización matemática con representaciones de 768 características complejas.

---

## 5. DISEÑO DE FLUJOS & COMPONENTES UX/UI PARA LOS 6 TABLEROS SENCKE

### A. PANEL ROOT GLOBAL SAAS (Sinergia Global Root Admin)
* **Visual Grid Blueprint:** Layout de 12 columnas. Top KPIs en 4 bento-grids (Empresas Activas, Ingreso SaaS MRR, Recursos CPU de contenedores, Alertas Críticas base de datos).
* **Navegación:** Menú lateral flotante de baja densidad cromática (Slate-950). Sección central para "SaaS Control Room" para apagar/prender tenants inmediatamente.

### B. PANEL DE EMPRESAS SECCIONADAS (Tenant Manager)
* **Visual Grid Blueprint:** Buscador robusto que lista todos los Tenants/Empresas. Indicador de salud de pago (Verde para Activo, Rojo para Mora).
* **Navegación:** Tablas agrupadas con paginación optimizada que permiten ver la fecha de corte DIAN del NIT configurado.

### C. PANEL ADMINISTRATIVO DEL HOTEL (Sede Central Suite)
* **Visual Grid Blueprint:** Dashboard multifuncional de la sede. Permite crear bloques y pisos en una grilla interactiva en 3D del diseño del edificio del alojamiento.
* **Componentes:** Selector de sedes dinámico cargado en el header que reactiva instantáneamente los datos de habitaciones de Sinergia.

### D. PANEL RECEPCIÓN & FRONT-DESK (PMS Front desk Core)
* **Visual Grid Blueprint:** Calendario Gantt de reservas interactivas de arrastrar y soltar (drag and drop). Listado de cuartos coloreados bajo código internacional de hotelería (Disponible = Verde brillante, Ocupado = Azul rey, Limpieza = Amarillo ámbar, Mantenimiento = Rojo carmín).

### E. PANEL DE LIMPIEZA & HOUSEKEEPING MOBILE (Tablet App)
* **Visual Grid Blueprint:** Vista móvil simplificada para las mucamas. Tarjetas táctiles grandes que muestran prioridad y lista de requerimientos (sábanas, desinfectante).
* **Componentes:** Entrada para subir fotografía del cuarto terminado, alojada en vivo en GCS para visibilidad del administrador en tiempo real.

### F. PANEL DE SOPORTE & MANTENIMIENTO TÉCNICO (Mantenimiento Pro)
* **Visual Grid Blueprint:** Tablero Kanban (Pendiente, En Reparación, Solucionado).
* **Componentes:** Integración de disparadores de compra rápida de repuestos y calculador de depreciación de activos fijos del hotel.

---

## 6. ARQUITECTURA DE INFRAESTRUCTURA DEVOPS, DEPLOYMENT & CI/CD EN GCP

Todo el código está empaquetado para correr de forma automatizada en contenedores sin estado con auto-escalabilidad óptima.

### A. ARQUITECTURA MULTI-CONTAINER DOCKERFILE DE SELECCIÓN DE PRODUCCIÓN

Contenedor universal ligero basado en Alpine para el Backend NestJS y empaquetamiento del Frontend.

```dockerfile
# MULTI-STAGE BASE BUILD FOR ENTIRE SINERGIA ERP PACK
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Instala todas las dependencias
RUN npm ci

# Copia código fuente completo
COPY . .

# Genera cliente Prisma de forma estricta y compila los bundles
RUN npx prisma generate
RUN npm run build

# ESTADO DE PRODUCCIÓN FINAL LIGERO
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Exponer PUERTO standard del reverse proxy
EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### B. PIPELINE INTEGRAL GITHUB ACTIONS CI/CD TO CLOUD RUN (`deploy-gcp.yml`)

Automatización de despliegue libre de fallas humanas.

```yaml
name: SINERGIA ERP - PRODUCTION INTEGRATION

on:
  push:
    branches: [ "main" ]

env:
  PROJECT_ID: sinergia-hospitality-41220
  SERVICE_NAME: sinergia-erp-core
  REGION: us-east1

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout Source Code
      uses: actions/checkout@v4

    - name: Set up GCP Credentials
      uses: google-github-actions/auth@v2
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}

    - name: Configure GCLOUD SDK
      uses: google-github-actions/setup-gcloud@v2

    - name: Authenticate Docker to Artifact Registry
      run: |
        gcloud auth configure-docker us-east1-docker.pkg.dev

    - name: Build and Push Monolith Image
      run: |
        docker build -t us-east1-docker.pkg.dev/${{ env.PROJECT_ID }}/sinergia-repo/${{ env.SERVICE_NAME }}:${{ github.sha }} .
        docker push us-east1-docker.pkg.dev/${{ env.PROJECT_ID }}/sinergia-repo/${{ env.SERVICE_NAME }}:${{ github.sha }}

    - name: Deploy Container to Google Cloud Run
      run: |
        gcloud run deploy ${{ env.SERVICE_NAME }} \
          --image us-east1-docker.pkg.dev/${{ env.PROJECT_ID }}/sinergia-repo/${{ env.SERVICE_NAME }}:${{ github.sha }} \
          --platform managed \
          --region ${{ env.REGION }} \
          --allow-unauthenticated \
          --add-cloudsql-instances ${{ env.PROJECT_ID }}:${{ env.REGION }}:sinergia-db \
          --set-env-vars "DATABASE_URL=${{ secrets.DATABASE_PROD_URL }},NODE_ENV=production,REDIS_HOST=${{ secrets.REDIS_HOST }}"
```

---

## 7. PLAN DE ESCALABILIDAD EN PRODUCCIÓN BAJO ALTOS VOLÚMENES

Para soportar miles de inquilinos concurrentes con millones de registros diarios, se establece la siguiente configuración robusta de escalabilidad horizontal:

1. **Read-Write Splitting (Prisma Interceptor):**
   * Redireccionar consultas de lectura (`GET` listados, visualizaciones, reportes) a una Read-Replica dedicada de Cloud SQL Postgres.
   * Reservar la Master Instance para las transacciones que modifican el estado (`POST`, `PUT`, `DELETE` en reservas y facturas).
2. **Caché Distribuido con Redis (Sidecar o GCP Memorystore):**
   * El listado de habitaciones y disponibilidad web directa se almacena en memoria caché con tiempos de invalidación dinámica (TTL = 10 segundos).
   * Al registrarse un cambio por recepción, un webhook o un evento WebSocket limpia la llave del caché inmediatamente para prevenir sobreventas accidentales.
3. **Optimización de Consultas Relacionales (Prisma Indexes):**
   * Creación de un índice compuesto único: `@@index([hotelId, checkIn, status])` para optimizar el Gantt de recepción.
   * Creación de índice compuesto multi-tenant: `@@index([companyId, email])` para busquedas rápidas del CRM de huéspedes.

---

## 8. ROADMAP DE DESARROLLO CORPORATIVO & HITOS OPERATIVOS

Un total de 8 sprints de entrega secuencial, garantizando la cobertura total requerida para un ERP de clase mundial:

```
[M1: Core Multi-Tenant] ----> [M2: Front Desk PMS] ----> [M3: Channel Sync] ----> [M4: Gemini AI] 
       (Sprint 1-2)                  (Sprint 3-4)               (Sprint 5)            (Sprint 6)
                                                                                          |
[M7: CI/CD & Security] <----- [M6: Web Booking Engine] < [M5: BI Revenue Pro] <-----------+
       (Sprint 8)                    (Sprint 7)                 (Sprint 7)
```

* **Sprint 1 & 2: Fundación SaaS y Aislamiento de Base de Datos**
  * Despliegue de migraciones Prisma con multi-tenant aislado.
  * Autenticación con MFA y sistema RBAC para roles operativos.
* **Sprint 3 & 4: Control Desk PMS y Módulos de Operación**
  * Gantt interactivo de recepción con check-in/out en un click.
  * Lanzamiento de control inteligente de camarieras y supervisoras.
* **Sprint 5: Channel Manager & APIs Corporativas**
  * Sincronización bidireccional estable a través de Webhooks nativos con Booking.com y Airbnb.
* **Sprint 6: Integración del Central de Agentes Gemini**
  * Function calling de Gemini Flash para ejecutar acciones directas en la base de datos a petición de comandos en lenguaje natural.
* **Sprint 7: Motor de Reservas Directas & BI Revenue Pro**
  * Simulador analítico financiero del RevPAR. Generador dinámico de micro-sitio responsive del hotel.
* **Sprint 8: Aseguramiento de Calidad (QA), Auditorías de Cifrado y Despliegue Google Cloud Run**
  * Cifrado AES-256 de identificadores y tarjetas bancarias, tests de estrés con 50,000 conexiones websocket concurrentes. Despliegue formal de producción.

---
## 9. MANUAL TÉCNICO & FUNCIONAL DE OPERACIONES ENTERPRISE

### Manual de Operaciones Técnicas (SysOps y DBA):
* **Monitoreo de Salud:** Usar Cloud Monitoring para alarmas de consumo de disco en la instancia Cloud SQL `sinergia-db`. Umbral crítico establecido en 85%.
* **Procedimiento ante Incidentes de Overbooking (Sobrevendido):** En caso de des-sincronización extrema de OTAs, disparar script de emergencia `/scripts/emergency-ota-reset.js` el cual forza que la Master Database limpie tokens de cache y re-escriba disponibilidad en Booking.com priorizando la tarifa PMS local.

### Manual Operativo Funcional (Para la Gerencia del Hotel):
* **Proceso de Bienvenida Sinergia Web:** El hotelero configura colores y descripción de bienvenida en el constructor. Esta URL responsive se provee a huéspedes en el correo de pre-reserva.
* **Estrategia Tarifaria Dinámica:** Use el simulador de **BI & Ingresos Pro** cada mañana. El sistema calcula si la ocupación es menor al 50%. De ser así, arrastre el comando "Temporada Baja o Promocional" para reactivar las reservas en segundos.
