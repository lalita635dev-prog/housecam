# 🎥 Sistema de Vigilancia con WebRTC

Sistema completo de vigilancia usando celulares Android como cámaras, con transmisión en tiempo real.

## ✨ Características

- 📹 **Múltiples cámaras** simultáneas
- 🌐 **Acceso remoto** desde cualquier lugar
- 🎨 **Controles avanzados**: Brillo, Contraste, Zoom
- 🌙 **Modo nocturno** para mejor visibilidad
- 🎯 **Calidad ajustable**: Alta (1080p), Media (720p), Baja (480p)
- 🔒 **WebRTC** para baja latencia y conexión P2P
- 💯 **100% Gratis** usando tier gratuito de Render.com

## 📦 Estructura del Proyecto

```
sistema-vigilancia/
├── server.js           # Servidor de señalización WebRTC
├── package.json        # Dependencias de Node.js
├── README.md          # Este archivo
└── public/
    └── index.html     # Aplicación web cliente
```

## 🚀 Despliegue en Render.com

### 1. Preparar el Repositorio

1. Crea un repositorio en GitHub
2. Descarga todos los archivos del proyecto
3. Sube los archivos manteniendo la estructura de carpetas
4. Asegúrate que `package.json` y `server.js` estén en la raíz

### 2. Configurar Render

1. Ve a [render.com](https://render.com) y crea una cuenta
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name:** `mi-sistema-vigilancia` (o el que prefieras)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** `Free`
5. Click en **"Create Web Service"**
6. Espera 2-3 minutos a que se despliegue

### 3. Configurar Cron-Job (Mantener activo 24/7)

1. Ve a [cron-job.org](https://cron-job.org) y crea cuenta
2. Click en **"Create cronjob"**
3. Configura:
   - **Title:** `Mantener Render Activo`
   - **URL:** `https://tu-app.onrender.com/ping`
   - **Schedule:** Every 10 minutes (`*/10 * * * *`)
4. Guarda y activa

## 📱 Uso

### Como Cámara (Celulares en tu casa)

1. Abre Chrome en el celular
2. Ve a: `https://tu-app.onrender.com`
3. Selecciona **"📹 Modo Cámara"**
4. Configura:
   - **Nombre:** Ej. "Entrada Principal"
   - **Calidad:** Media (recomendada)
   - **Modo Nocturno:** Activar si es de noche
   - **Ajustes:** Brillo, Contraste, Zoom (opcional)
5. Click **"Iniciar Cámara"**
6. Acepta permisos de cámara
7. ¡Listo! Déjalo transmitiendo

### Como Visualizador (Tu celular personal)

1. Abre el navegador en tu celular
2. Ve a la misma URL
3. Selecciona **"👁️ Modo Visualización"**
4. Click **"Conectar"**
5. Verás todas las cámaras disponibles
6. Toca una cámara para ver el video en vivo

## ⚙️ Controles de Cámara

### 🎨 Ajustes Visuales
- **Brillo:** 50% - 200% (por defecto: 100%)
- **Contraste:** 50% - 200% (por defecto: 100%)
- **Zoom:** 1.0x - 3.0x (por defecto: 1.0x)

### 🌙 Modo Nocturno
Activa esta opción para:
- Aumentar automáticamente brillo a 150%
- Aumentar contraste a 120%
- Mejor visibilidad en lugares oscuros

### 📊 Calidad de Video

| Calidad | Resolución | FPS | Bitrate | Uso Recomendado |
|---------|-----------|-----|---------|-----------------|
| **Alta** | 1080p | 30 | 2.5 Mbps | WiFi excelente (5+ Mbps) |
| **Media** ⭐ | 720p | 25 | 1.5 Mbps | WiFi bueno (2-5 Mbps) |
| **Baja** | 480p | 20 | 800 Kbps | WiFi débil / Datos móviles |

## 💡 Consejos Importantes

### 🔋 Batería
- Mantén los celulares **enchufados** constantemente
- La transmisión de video consume mucha batería
- Desactiva el "ahorro de energía"

### 📶 Conexión
- Usa **WiFi** en lugar de datos móviles
- WiFi de 2.4GHz tiene mejor alcance
- WiFi de 5GHz tiene mejor velocidad

### 📱 Configuración del Celular
1. **Evitar suspensión:**
   - Ve a Ajustes → Opciones de Desarrollo
   - Activa "Permanecer activo" (pantalla encendida mientras carga)
2. **Desactivar rotación automática**
3. **Desactivar notificaciones** para evitar interrupciones

### 💡 Iluminación
- Coloca las cámaras en lugares **bien iluminados**
- Usa modo nocturno solo cuando sea necesario
- Evita apuntar directamente a luces brillantes

## 🔧 Solución de Problemas

### ❌ "No puedo ver la cámara"
- Verifica que ambos dispositivos estén conectados al servidor
- Revisa que la cámara tenga permisos de cámara
- Asegúrate que la URL sea correcta (wss://)

### ❌ "Video de mala calidad"
- Reduce la calidad a "Media" o "Baja"
- Verifica tu conexión WiFi
- Ajusta brillo y contraste manualmente

### ❌ "La cámara se desconecta"
- Verifica que el celular no entre en modo ahorro de batería
- Asegúrate que la pantalla permanezca encendida
- Revisa la estabilidad de tu WiFi

### ❌ "Servidor no responde"
- El tier gratuito de Render duerme después de 15 min
- Verifica que el Cron Job esté activo
- Primera conexión puede tardar 30-50 segundos

## 🔒 Seguridad

### Recomendaciones:
- Cambia la URL del servidor por una personalizada
- No compartas la URL públicamente
- Considera agregar autenticación (próxima mejora)

## 🎯 Próximas Mejoras

Ideas para expandir el sistema:

- [ ] 🔐 Sistema de autenticación con contraseña
- [ ] 📹 Grabación de video
- [ ] 🚨 Detección de movimiento con alertas
- [ ] 📊 Estadísticas de uso
- [ ] 🔊 Soporte de audio bidireccional
- [ ] 📱 Notificaciones push
- [ ] 🎥 Captura de screenshots
- [ ] ☁️ Almacenamiento en nube

## 📄 Licencia

Este proyecto es de código abierto y gratuito para uso personal.

## 🤝 Contribuciones

¿Tienes ideas para mejorar? ¡Abre un issue o pull request!

## 📞 Soporte

Si tienes problemas:
1. Revisa la sección "Solución de Problemas"
2. Verifica los logs en Render.com
3. Asegúrate que todos los archivos estén correctamente subidos

---

**Creado con ❤️ para vigilancia casera sin costos**