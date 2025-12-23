
# 🎥 Sistema de Vigilancia con WebRTC - V5

Sistema de vigilancia en tiempo real con autenticación y **detección de movimiento**, usando WebRTC para streaming de video peer-to-peer.

## 🆕 Nueva Funcionalidad - Detección de Movimiento

✅ **Análisis de video en tiempo real** - Detecta cambios entre frames  
✅ **Notificaciones instantáneas** - Alertas push del navegador  
✅ **Lista de alertas en vivo** - Historial de movimientos detectados  
✅ **Configurable** - Ajusta sensibilidad y tiempo entre alertas  


## 🔐 Características de Seguridad

- ✅ **Autenticación con contraseña** - Login obligatorio para acceder
- ✅ **Tokens de sesión** - Sesiones válidas por 24 horas
- ✅ **Control de acceso basado en roles** - Cámaras vs Viewers
- ✅ **Timeout de autenticación** - 10 segundos para autenticarse
- ✅ **Limpieza automática de sesiones** - Sesiones expiradas se eliminan

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
        ├── icon-72x72.png
        ├── icon-96x96.png
        ├── icon-128x128.png
        ├── icon-144x144.png
        ├── icon-152x152.png
        ├── icon-192x192.png
        ├── icon-384x384.png
        └── icon-512x512.png
```

## 🛠️ Tecnologías

- **Backend:** Node.js, Express, WebSocket
- **Frontend:** Vanilla JavaScript, WebRTC
- **Detección:** Canvas API para análisis de frames
- **Notificaciones:** Notification API del navegador


## 🔒 Permisos Necesarios

- **Cámara:** Acceso a la cámara del dispositivo
- **Notificaciones:** Permiso para notificaciones push del navegador

El sistema solicitará estos permisos automáticamente.

## 📞 Soporte

Para problemas o preguntas, contacta al desarrollador.

## 📄 Licencia

MIT License - Úsalo libremente para tus proyectos.

---

