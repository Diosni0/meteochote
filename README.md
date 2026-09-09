# Meteochote 🌤️🤖

Aplicación web interactiva en tiempo real para visualizar y comparar el tiempo en España utilizando **modelos meteorológicos de IA reales** servidos por [Open-Meteo](https://open-meteo.com) (gratuito, sin clave API para uso no comercial):

* 🧠 **ECMWF AIFS 0.25°** — Artificial Intelligence Forecasting System del Centro Europeo de Predicción a Medio Plazo (`ecmwf_aifs025_single`)
* 🌐 **NOAA AIGFS 0.25°** — AI Global Forecast System de NOAA, basado en la arquitectura GraphCast de Google DeepMind (`ncep_aigfs025`)

Todas las previsiones mostradas son datos reales de estos modelos; no hay valores sintéticos ni simulados. La previsión base de la pestaña de 7 días y las condiciones actuales proceden del *best match* de Open-Meteo.

---

## 🚀 Cómo ejecutar en local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Compilar y arrancar la aplicación**:
   ```bash
   npm run build
   npm start
   ```
   Abre tu navegador en: **`http://localhost:3001`**

3. **O ejecutar en modo desarrollo (con Hot-Reloading de Vite)**:
   ```bash
   # Terminal 1 (Servidor Backend):
   npm run server

   # Terminal 2 (Frontend Vite):
   npm run dev
   ```
   Abre: `http://localhost:5173`

---

## ✨ Características Principales

### Capas sobre el mapa (Estilo Windy)

* **Gradientes de temperatura, lluvia y viento**: Los botones **Temperatura**, **Lluvia** y **Viento** sobreimprimen un campo continuo georreferenciado con escalado bilineal suave, actualizado con la hora y el modelo IA seleccionado.
* **Corrientes de viento animadas (Wind Streamlines)**: Animación por Canvas de partículas que fluyen siguiendo los vectores reales de velocidad y dirección del viento del modelo activo.
* **Radar de lluvia (observación)**: Capa con tiles reales de radar observado en toda España vía **RainViewer** (gratis, sin clave API, actualizada cada ~5 min). Muestra lo que está cayendo ahora, a diferencia de la capa de Lluvia IA que es previsión.
* **Control de Capas**: En el menú **Capas** puedes activar/desactivar el viento animado, el radar, las estaciones y ajustar la opacidad del gradiente ráster.
* **Cobertura Completa**: 39 puntos de referencia en la Península Ibérica, Islas Baleares e Islas Canarias.

**Limitación conocida:** los gradientes son una interpolación de esos 39 puntos (radio 300 km), no una malla de alta resolución como Windy.com. La lluvia mostrada es previsión horaria del modelo, no observación; para la observación en tiempo real usa la capa **Radar (RainViewer)** — atribución requerida: [rainviewer.com](https://www.rainviewer.com/).

Pruebas de interpolación y vectores de viento: `npm test` (Node.js 22.6 o posterior).

### Otras funciones

1. **Buscador de Municipios Españoles**: Búsqueda reactiva con autocompletado en tiempo real de cualquier pueblo, municipio o ciudad de España (Península, Baleares y Canarias).
2. **Mapa Interactivo (Leaflet)**: Haz clic sobre cualquier punto del territorio español para fijar las coordenadas exactas y consultar los modelos de IA.
3. **Comparativa IA**: Valores reales de AIFS y AIGFS para las próximas 24 horas lado a lado; cuando divergen, hay incertidumbre atmosférica.
4. **Previsión a 7 Días**: Tarjetas con rangos térmicos visuales, probabilidad de lluvia y viento máximo, con desglose horario expandible de 24 horas para cada día.

### Despliegue

* **Vercel**: `vercel.json` con rewrites y función serverless en `api/index.js`.
* **Render/local**: servidor Express en `server/index.js` que también sirve el frontend compilado (`dist/`).
* En cualquiera de los dos modos, si el backend no está disponible el cliente cae automáticamente a Open-Meteo (`weatherApi.ts`).
