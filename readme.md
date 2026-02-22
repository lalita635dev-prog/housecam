
# House Cam v6

House Cam es un sistema de monitoreo en tiempo real con autenticación avanzada, detección de movimiento y gestión completa de usuarios y cámaras.
Optimizado para mayor rendimiento, seguridad y escalabilidad.

## 🆕 Novedades en la Versión 6

🆕 **Base de Datos Integrada** 
    ✅ Persistencia real de usuarios y cámaras
    ✅ Almacenamiento estructurado y seguro
    ✅ Preparado para crecimiento y escalabilidad

⚡ **Mejora de Rendimiento**
    ✅ Optimización en el manejo de conexiones WebRTC
    ✅ Mejor gestión de sesiones activas
    ✅ Reducción de consumo de recursos

👥 **Nuevo Sistema de Gestión de Usuarios**
    ✅ Administración avanzada de usuarios
    ✅ Mejor control de autenticación
    ✅ Manejo más eficiente de sesiones

🔐 **Permisos Personalizados por Usuario**
    ✅ Asignación individual de permisos
    ✅ Control granular de acceso
    ✅ Separación clara entre roles y capacidades

📹 **Nuevas Opciones de Creación**
    ✅ Creación dinámica de cámaras
    ✅ Alta y configuración de nuevos usuarios
    ✅ Administración centralizada

## 🎯 Funcionalidades Principales

📡 **Streaming en Tiempo Real**
    - WebRTC peer-to-peer
    - Baja latencia
    - Comunicación directa entre dispositivos

🧠 **Detección de Movimiento**
    - Análisis de video en tiempo real (Canvas API)
    - Comparación inteligente entre frames
    - Alertas automáticas configurables
    - Historial de movimientos detectados

🔔 **Notificaciones**
    - Alertas push del navegador
    - Avisos instantáneos ante actividad sospechosa

🔐 **Seguridad**
    - Autenticación con contraseña
    - Tokens de sesión (24 horas)
    - Control de acceso por roles
    - Permisos personalizados por usuario
    - Timeout de autenticación (10 segundos)
    - Limpieza automática de sesiones expiradas
    - Gestión avanzada mediante base de datos


## 📝 Estructura del Proyecto

```
HouseCam/
├── server.js
├── package.json
├── README.md
└── public/
    ├── index.html
    ├── app.js
    ├── manifest.json
    ├── service-worker.js
    ├── pwa-install.js
    ├── offline.html
    └── icons/
```

## 🛠️ Tecnologías

- **Backend:** Node.js, Express, WebSocket
- **Base de Datos:** Sistema persistente integrado
- **Frontend:** Vanilla JavaScript
- **Streaming:** WebRTC
- **Detección:** Canvas API
- **PWA:** Service Worker + Manifest
- **Notificaciones:** Notification API


## 🔒 Permisos Necesarios

- **Cámara:** Acceso a la cámara del dispositivo
- **Notificaciones:** Permiso para notificaciones push del navegador

El sistema solicitará estos permisos automáticamente.

## 📞 Soporte

Para problemas o preguntas, contacta al desarrollador.

## 📄 Licencia

MIT License — Uso libre para proyectos personales y comerciales.

---

