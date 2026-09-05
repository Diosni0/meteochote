# MeteoIA España 🌤️🤖

Aplicación web interactiva en tiempo real para visualizar y comparar el tiempo en España utilizando **únicamente modelos meteorológicos basados en Inteligencia Artificial**:
* 🤖 **Google DeepMind WeatherNext 3** (Lanzado en septiembre de 2026, optimizado para observación satelital en directo y alta resolución horaria)
* 🧠 **ECMWF AIFS** (Artificial Intelligence Integrated Forecasting System del Centro Europeo)
* 🌐 **Google DeepMind GraphCast** (Redes neuronales sobre grafos a 10 días)
* ⚡ **Huawei Pangu-Weather** (Modelo de aprendizaje profundo 3D para dinámica troposférica)
* 📊 **Consenso Multi-IA** (Media probabilística ponderada entre las diferentes redes)

*(Se descartan completamente los modelos físicos numéricos tradicionales como GFS o ICON, priorizando exclusivamente arquitecturas de IA).*

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

## 🔑 Configurar Google Maps Platform (WeatherNext 3)

La aplicación viene configurada con un **modo autónomo de alta fidelidad** que funciona inmediatamente sin necesidad de claves externas.

Si dispones de una clave de Google Cloud con la **Google Maps Platform Weather API** habilitada:
1. Pulsa el botón **"API WeatherNext"** en la esquina superior derecha de la aplicación.
2. Introduce tu API Key y pulsa **Validar y Activar**.
3. El indicador cambiará a verde: *"WeatherNext 3 en Directo"*.

---

## ✨ Características Principales

1. **Buscador de Municipios Españoles**: Búsqueda reactiva con autocompletado en tiempo real de cualquier pueblo, municipio o ciudad de España (Península, Baleares y Canarias).
2. **Mapa Interactivo (Leaflet)**: Haz clic sobre cualquier punto del territorio español para fijar las coordenadas exactas y consultar los modelos de IA.
3. **Pestaña 1: Comparador de Modelos de IA**:
   * Alterna entre WeatherNext 3, AIFS, GraphCast, Pangu y Consenso.
   * Gráficas interactivas con curvas temporales para **Temperatura (°C)**, **Precipitación (mm)** y **Viento (km/h)**.
   * Modo "Superponer Todos los Modelos IA" para analizar el grado de acuerdo y dispersión entre redes neuronales.
4. **Pestaña 2: Previsión a 7 Días**:
   * Tarjetas con rangos térmicos visuales, probabilidad de lluvia y viento máximo.
   * Desglose horario expandible de 24 horas para cada día.
