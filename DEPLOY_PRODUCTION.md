# 🚀 Manual de Producción: Sinergia IA Hospitality ERP
Este manual te guiará paso a paso para pasar este sistema modular de la simulación local del entorno de desarrollo a un **entorno real y en producción 100% gratuito** utilizando **Vercel** para el Front-end y **Render** para el servidor de Inteligencia Artificial (Express + Gemini API).

---

## 1. Obtención de tu API Key Gratuita de Google Gemini
La inteligencia artificial multi-agente está programada usando la biblioteca oficial `@google/genai`. Para conectarte al modelo real sin costos:

1. Ve a [Google AI Studio](https://aistudio.google.com/).
2. Inicia sesión con tu cuenta de Google.
3. Haz clic en **"Get API Key"** (Obtener clave de API).
4. Crea una clave en un proyecto nuevo o existente.
5. Copia esa clave de API (será un string largo que empieza por `AIzaSy...`).
6. En producción, configurarás esta clave como una Variable de Entorno con el nombre: **`GEMINI_API_KEY`**.

---

## 2. Arquitectura de Producción Recomendada (100% Gratis)

Para lograr un sistema en vivo y con escalabilidad sin gastar un centavo, separamos la aplicación en dos capas:

### Capa A: El Servidor API (Express) en **Render** (Gratis)
[Render](https://render.com/) ofrece un plan gratuito para alojar servicios web Node.js. 

#### Pasos para desplegar la API en Render:
1. Crea una cuenta gratuita en **Render.com** (puedes ingresar con GitHub).
2. Haz clic en **"New"** > **"Web Service"**.
3. Conecta el repositorio de tu proyecto (o súbelo a tu cuenta personal de GitHub).
4. Configura los siguientes parámetros en el panel de Render:
   - **Environment**: `Node`
   - **Build Command**: `npm install && vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
   - **Start Command**: `node dist/server.cjs`
5. Expande la sección **"Environment Variables"** y añade:
   - `GEMINI_API_KEY` = *Tus credenciales de Google Gemini*
   - `NODE_ENV` = `production`
6. Render te dará una URL pública (ejemplo: `https://sinergia-backend.onrender.com`). Cópiala.

---

### Capa B: La Interfaz de Usuario (React + Vite) en **Vercel** (Gratis)
[Vercel](https://vercel.com/) es la plataforma predilecta para alojar interfaces de React rápidas y con CDN global gratuita.

#### Pasos para desplegar el Frontend en Vercel:
1. Crea una cuenta en **Vercel.com** y vincula tu cuenta de GitHub.
2. Selecciona **"Add New"** > **"Project"** e importa el repositorio de Sinergia IA.
3. Vercel detectará automáticamente que es un proyecto de **Vite**:
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
4. Añade una variable de entorno en Vercel:
   - `VITE_API_URL` = *La URL de Render que copiaste en el paso anterior* (por ejemplo: `https://sinergia-backend.onrender.com`).
5. Haz clic en **"Deploy"**. En 1 minuto tendrás tu dominio real seguro con certificado SSL (ejemplo: `https://sinergia-hospitality-erp.vercel.app`).

---

## 3. Adaptación del Código para URLs Dinámicas en Producción

Para que el cliente React sepa si debe consultar la dirección local `http://localhost:3000` (desarrollo) o el backend de Render en producción, en tu código de llamadas de red (`fetch`):

```typescript
// En lugar de llamar directamente a '/api/chat', utiliza la URL del entorno:
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const response = await fetch(`${API_BASE_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... })
});
```

---

## 4. Base de Datos Crítica para Resguardar Datos Reales
Actualmente, el sistema utiliza **LocalStorage** para guardar estados de reservas y huéspedes de forma inmediata al recargar la pestaña. Para que sea un software multi-usuario real:

- **Estrategia sin código (Firebase)**: Puedes activar la base de datos **Cloud FireStore** (de Google Firebase), cuyo plan gratuito te permite hasta 50,000 lecturas y 20,000 escrituras al día de forma gratuita.
- **Estrategia Relacional (Supabase)**: Te otorga una base de datos **PostgreSQL** real gratis, ideal si requieres conectividad SQL tradicional.

---

### 💡 Resumen Operativo una vez Configurado:
- Tu **Administrador, Recepcionista, Especialista de Ventas y Supervisor de Aseo** conversarán contigo utilizando la API de Google Gemini en vivo, fundamentando cada respuesta en el estado real de tu inventario.
- Los huéspedes que registres manualmente se guardarán permanentemente.
- Podrás monitorear de forma remota tus indicadores de hotel, hostal, apartamento, glamping o finca vacacional desde cualquier smartphone o computadora del mundo.
