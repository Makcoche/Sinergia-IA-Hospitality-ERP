import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route to chat with different AI Agents of Sinergia IA Hospitality
app.post('/api/chat', async (req, res) => {
  const { message, agent, hotelStateContext, history = [] } = req.body;

  if (!message || !agent) {
    return res.status(400).json({ error: 'Faltan parámetros message o agent.' });
  }

  // Active hotel context
  const { activeHotel, rooms, reservations, guests, tickets, channels, activePlan } = hotelStateContext || {};

  // Construct context string to ground the Gemini Model
  const hotelContextString = activeHotel 
    ? `
=== ESTADO EN TIEMPO REAL ERPSINERGIA - HOTEL ACTIVO: ${activeHotel.name} ===
Tipo de Propiedad: ${activeHotel.type}
Dirección: ${activeHotel.address}
Descripción: ${activeHotel.description}
Calificación: ${activeHotel.rating}/5 estrellas

-- HABITACIONES --
${(rooms || []).map((r: any) => `- Habitación ${r.number}: ${r.name} (${r.type}) | Capacidad: ${r.capacity} pax | Tarifa Base Noche: $${r.ratePerNight} USD | Estado actual: ${r.status.toUpperCase()} | Servicios: ${r.amenities.join(', ')}`).join('\n')}

-- RESERVAS ACTIVAS / EN CURSO --
${(reservations || []).map((resv: any) => {
  const room = (rooms || []).find((r: any) => r.id === resv.roomId);
  return `- Reserva ${resv.id}: ${resv.guestName} (${resv.guestEmail}) | Hab: ${room ? room.number : 'N/A'} | CheckIn: ${resv.checkIn} | CheckOut: ${resv.checkOut} | Estado: ${resv.status.toUpperCase()} | Monto Total: $${resv.totalAmount} USD | Saldo Pendiente: $${resv.outstandingBalance} USD | Huéspedes: ${resv.guestsCount}`;
}).join('\n')}

-- CLIENTES EN BASE DE DATOS (CRM) --
${(guests || []).map((g: any) => `- ID ${g.id}: ${g.name} | Email: ${g.email} | Categoría de Lealtad: ${g.loyaltyTier} | Consumo Total Acumulado: $${g.totalSpent} USD | Preferencias: ${g.preferences.join(', ')}`).join('\n')}

-- TICKETS DE MANTENIMIENTO REPORTADOS --
${(tickets || []).map((t: any) => {
  const room = (rooms || []).find((r: any) => r.id === t.roomId);
  return `- Ticket ${t.id}: Habitación ${room ? room.number : 'N/A'} | Problema: "${t.description}" | Prioridad: ${t.priority.toUpperCase()} | Estado del Arreglo: ${t.status.toUpperCase()}`;
}).join('\n')}

-- CANALES DE RESERVAS SINCRONIZADOS (OTAS) --
${(channels || []).map((c: any) => `- OTA: ${c.name} | Conexión: ${c.status.toUpperCase()} | Multiplicador de Sincronización Tarifaria: x${c.rateSyncMultiplier} | Última Sinc: ${c.lastSync}`).join('\n')}

-- PLAN DE TARIFAS ACTUALMENTE SELECCIONADO --
Plan Activo: ${activePlan ? activePlan.name : 'Tarifa Estándar Base'} (Multiplicador de Costo: x${activePlan ? activePlan.multiplier : 1.0})
==================================================
`
    : 'No hay datos cargados del hotel en el contexto actual.';

  // Build specialized developer agent system prompts
  const PROMPTS: Record<string, { system: string, salutation: string }> = {
    receptionist: {
      system: `Eres Sofía, la Recepcionista Virtual Inteligente de ${activeHotel?.name || 'Sinergia Hospitality'}. 
Tu meta es brindar atención premium y resolver dudas de huéspedes acerca de las habitaciones, estado de reserva o amenidades. 
Habla con tono cálido, profesional, empático y servicial.
Usa los datos en vivo provistos para fundamentar tus respuestas científicamente sin inventar reservas o números de domo que no existan en el sistema. 
Si el usuario pregunta por disponibilidad, revisa cuáles habitaciones tienen el estado "AVAILABLE" y recomiéndalas elegantemente.
Si preguntan por el saldo a pagar de una reserva en curso, dales el detalle con amabilidad y ofréceles pagar en el counter.`,
      salutation: "Hola, soy Sofía de Recepción. ¿En qué le puedo asistir con su estadía hoy?"
    },
    sales: {
      system: `Eres Mateo, el Especialista Comercial y de Upselling de ${activeHotel?.name || 'Sinergia Hospitality'}.
Tu objetivo es sugerir estrategias para maximizar ingresos (RevPAR), proponer decoraciones románticas para parejas (con recargo de $50 USD), pases de Spa exclusivos, o tours ecológicos locales guiados ($80 USD por persona). 
Sé persuasivo, carismático, elegante y orientado a ofrecer valor agregado.
Utiliza la base de datos de huéspedes en vivo para analizar el comportamiento del cliente activo y proponer ofertas personalizadas según sus preferencias registradas en el CRM.
Apóyate en el plan tarifario activo para estructurar ofertas especiales de fin de semana o feriados.`,
      salutation: "¡Saludos comerciales! Soy Mateo. Diseñemos la mejor estrategia de ingresos y experiencias premium."
    },
    admin: {
      system: `Eres Camila, la Directora Administrativa y de Analítica de Ingresos de ${activeHotel?.name || 'Sinergia Hospitality'}.
Tu personalidad es racional, numérica, asertiva y ejecutiva. Te encantan los KPI hoteleros.
Cuando te pregunten sobre la salud del hotel, analiza de inmediato la tasa de ocupación (habitaciones ocupadas / total habitaciones * 100), el ingreso total acumulado de las reservas activas, el saldo pendiente de cobros y calcula métricas clave como:
- Ocupación actual (%)
- Ingresos de reservas en curso (Suma de montos de reservas checked_in)
- Saldo por recuperar (Suma de outstandingBalance de reservas checked_in)
- Tasa de incidentes (cantidad de tickets pendientes)
Presenta reportes limpios en formato estructurado, con viñetas o pequeñas tablas de texto. Ofrece recomendaciones astutas para ajustar tarifas si la ocupación es baja o alta.`,
      salutation: "Hola, le habla Camila del departamento de Administración. Revisemos los números de rendimiento ejecutivo."
    },
    housekeeping: {
      system: `Eres Lucas, el Supervisor General de Limpieza y Mantenimiento de ${activeHotel?.name || 'Sinergia Hospitality'}.
Eres directo, operativo, pragmático y muy organizado.
Tu labor es coordinar las prioridades de limpieza y reportes de averías.
Analiza la lista de habitaciones en vivo:
- Enfócate en las que están catalogadas como "CLEANING" para asignarlas al personal.
- Organiza los tickets de "MAINTENANCE" pendientes. Prioriza los de impacto alto (HIGH).
- Si el usuario te pide crear un reporte, descríbe qué pasos tomaste para reportarlo, y recuérdales cambiar el estado físico en el tablero del PMS.
Habla de manera clara, proactiva y detallada sobre la operatividad del hotel.`,
      salutation: "Buenos días, soy Lucas de Operaciones y Mantenimiento. Listos para activar los protocolos de aseo."
    }
  };

  const selectedAgent = PROMPTS[agent] || PROMPTS.receptionist;

  try {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey || geminiKey === 'MY_GEMINI_API_KEY' || geminiKey === '') {
      // Return beautiful, smart simulated response since the user requested to begin building
      // and we want it to work offline before they configure secrets.
      console.log('Utilizando simulación inteligente ya que no hay una API Key real de Gemini configurada.');
      const simulatedText = simulateAIResponse(message, agent, selectedAgent.system, hotelContextString);
      return res.json({ text: simulatedText });
    }

    // Modern SDK lazy initialization with server headers
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // We can pass the context ground in the system instruction
    const systemPromptCombined = `${selectedAgent.system}\n\n${hotelContextString}\n\nAsiste al usuario de acuerdo al diálogo. Habla siempre en ESPAÑOL.`;

    const chatContents: any[] = [];
    
    // Add history in Gemini format
    if (history && history.length > 0) {
      history.slice(-8).forEach((msg: any) => {
        chatContents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }
    
    // Add current user message
    chatContents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: chatContents,
      config: {
        systemInstruction: systemPromptCombined,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "No se pudo generar una respuesta por el modelo.";
    return res.json({ text: replyText });

  } catch (error: any) {
    console.error('Error llamando Gemini API:', error);
    res.status(500).json({ 
      error: 'Hubo un error del canal de inteligencia artificial.',
      details: error.message || error
    });
  }
});

// Mock AI Logic to make the ERP incredibly responsive on local deployments
function simulateAIResponse(msg: string, agent: string, system: string, context: string): string {
  const norm = msg.toLowerCase();
  
  if (agent === 'admin') {
    let totals = 0;
    let occCount = 0;
    let cleaningCount = 0;
    let pendingTickets = 0;

    if (context.includes('STATUS: OCCUPIED')) occCount = (context.match(/status: occupied/gi) || []).length;
    if (context.includes('STATUS: CLEANING')) cleaningCount = (context.match(/status: cleaning/gi) || []).length;
    if (context.includes('ESTADO DEL ARREGLO: PENDING')) pendingTickets = (context.match(/estado del arreglo: pending/gi) || []).length;

    const totalRooms = 5; // average rooms per hotel in mockup
    const occPercent = Math.round((occCount / totalRooms) * 100) || 40;

    if (norm.includes('número') || norm.includes('números') || norm.includes('resumen') || norm.includes('kpi') || norm.includes('reporte') || norm.includes('ingresos') || norm.includes('ocupación')) {
      return `📊 **Reporte Analítico Ejecutivo de Sinergia IA**\n
Hola, soy **Camila**, Directora de Operaciones. Basándome en el estado actual de la propiedad, aquí tienes nuestro diagnóstico financiero y operativo:

- **Tasa de Ocupación actual**: **${occPercent}%** (con ${occCount} habitaciones ocupadas activas).
- **Consumos Extra Facturados**: $450 USD registrados en facturación.
- **Eficiencia del Staff**: El grupo de Housekeeping reporta ${cleaningCount} habitaciones en preparación.
- **Incidentes Críticos**: ${pendingTickets} ordenes de mantenimiento pendientes de resolución.

*Recomendación de Ingresos*: Dado el estado de ocupación, le sugiero activar el **Plan de Fin de Semana** para capturar un 25% de recargo tarifario en habitaciones premium libres, o bien incentivar descuentos de larga estadía en canales asociados como Airbnb.`;
    }
    return `Hola, le habla Camila de Administración. He recibido su instrucción. Estudiando las habitaciones y tarifas actuales, detecto que tenemos un potencial de venta no explotado. ¿Desea que calculemos una proyección fiscal detallada o revisemos algún indicador clave?`;
  }

  if (agent === 'receptionist') {
    if (norm.includes('disponible') || norm.includes('libres') || norm.includes('habitaciones') || norm.includes('reservar')) {
      return `¡Hola! Soy **Sofía**, Recepcionista Virtual. 

He revisado el tablero del hotel y con gusto le informo que disponemos de habitaciones de primera categoría completamente preparadas para reservas inmediatas. 

Le recomiendo especialmente los **Domos de Lujo** o las **Suites Ejecutivas**, las cuales cuentan con servicios premium como Jacuzzis privados y Wi-Fi de alta velocidad. ¿A nombre de quién le gustaría iniciar la simulación del check-in hoy?`;
    }
    if (norm.includes('jacuzzi') || norm.includes('spa') || norm.includes('amenidades') || norm.includes('wifi')) {
      return `¡Por supuesto! Le atiende Sofía. Nuestras habitaciones cuentan con equipamiento de nivel internacional. Contamos con Jacuzzis privados al aire libre en nuestras unidades de Glamping, Wi-Fi de fibra óptica (500 Megas) en los apartamentos urbanos, y desayunos gourmet incluidos de origen orgánico local. ¿Desea que agende una hora de spa para complementar?`;
    }
    return `Estimado huésped, soy **Sofía**. Es una enorme alegría para mí recibirle hoy. ¿En qué puedo colaborar con su reserva, tarifas o comodidades del hotel?`;
  }

  if (agent === 'sales') {
    if (norm.includes('promociones') || norm.includes('paquetes') || norm.includes('vender') || norm.includes('promos') || norm.includes('estrategia')) {
      return `🔥 **Propuesta Comercial Express de Mateo**\n
¡Hola! Soy **Mateo**, tu consultor de ventas de Inteligencia Artificial. He diseñado un combo de upselling perfecto:

1. **Paquete "Sinergia Romántica"**: Ofrezcámoslo a las habitaciones ocupadas por parejas. Incluye decoración floral, champaña y fresas con chocolate por solo **$50 USD** adicionales.
2. **Eco-Tour Privado**: Una cabalgata o senderismo guiado por expertos por **$80 USD** por persona.
3. **Escapes Ejecutivos corporativos**: Agrega un pase diario extra de coworking en el hostel para viajeros remotos.

¿Quiere que sincronicemos automáticamente este aumento del 15% en Airbnb y Booking para canalizar la tarifa de manera directa y optimizar el margen?`;
    }
    return `¡Saludos! Soy **Mateo**, del área comercial. Mi misión es elevar la rentabilidad del hotel y crear reservas inolvidables. ¿Deseas que preparemos un bosquejo para una campaña promocional o un programa de fidelidad de clientes?`;
  }

  if (agent === 'housekeeping') {
    if (norm.includes('limpieza') || norm.includes('limpiar') || norm.includes('aseo') || norm.includes('sucias') || norm.includes('mantenimiento') || norm.includes('dañase') || norm.includes('daño')) {
      return `🔧 **Agenda de Operaciones de Lucas**\n
¡Entendido! Soy **Lucas**, Supervisor de Mantenimiento. He tomado nota de la situación.

Aquí tienes el plan de contingencia operativo:
1. **Asignación de Personal**: He enviado al equipo de camareras a las habitaciones reportadas con estado "CLEANING" para dejarlas disponibles en menos de 20 minutos.
2. **Mesa de Ayuda**: Tenemos un ticket de mantenimiento pendiente debido a fallas técnicas en los calentadores de agua. Me coordinaré de inmediato con cerrajeros y plomeros.

Por favor, no olvide actualizar los estados directamente en la cuadrícula visual de arriba en el ERP para que los recepcionistas se enteren en tiempo real.`;
    }
    return `¡Qué tal! Lucas reportándose desde el área de Housekeeping y Servicios Generales de Sinergia. Todo el personal de aseo está en movimiento y listo para rotar habitaciones. ¿Prefiere que asigne prioridades de aseo o revise los materiales de plomería faltantes?`;
  }

  return `Hola, le atiende el Asistente Inteligente de Sinergia. Estoy listo para optimizar su hotel con el poder de la IA. Por favor, indíqueme en qué puedo ayudarle hoy. (Nota: Para conectar la API de Gemini real, configure su variable de entorno GEMINI_API_KEY en la sección Secrets).`;
}

// Vite middleware development setup or Express static folder build configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite dev middleware mounted successfully.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static build serving from:', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sinergia IA - Hospitality ERP server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
