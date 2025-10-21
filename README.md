# 🎥 Sistema de Vigilancia con WebRTC y Autenticación

Sistema completo de vigilancia usando celulares Android como cámaras, con transmisión en tiempo real, **sistema de usuarios con permisos** y panel de administración.

## ✨ Características

- 🔐 **Sistema de autenticación** con login seguro
- 👑 **Panel de administración** para gestionar usuarios
- 🎯 **Permisos por cámara** (cada usuario ve solo sus cámaras asignadas)
- 📹 **Múltiples cámaras** simultáneas
- 🌐 **Acceso remoto** desde cualquier lugar
- 🎨 **Controles avanzados**: Brillo, Contraste, Zoom
- 🌙 **Modo nocturno** para mejor visibilidad
- 🎯 **Calidad ajustable**: Alta (1080p), Media (720p), Baja (480p)
- 🔒 **WebRTC** para baja latencia y conexión P2P
- 💯 **100% Gratis** usando tier gratuito de Render.com

## 🔐 Sistema de Usuarios

### Roles
- **Administrador**: Acceso completo a todas las cámaras y gestión de usuarios
- **Usuario**: Solo puede ver las cámaras que le fueron asignadas

### Credenciales por Defecto
```
Usuario: admin
Contraseña: admin123
```
⚠️ **IMPORTANTE**: Cambia la contraseña del admin después de la primera instalación

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

### 1️⃣ Primer Login (Administrador)

1. Abre el navegador y ve a: `https://tu-app.onrender.com`
2. Inicia sesión con:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`
3. Serás redirigido al panel principal

### 2️⃣ Crear Usuarios (Solo Admin)

1. Ve a la pestaña **"⚙️ Administración"**
2. Click en **"+ Crear Usuario"**
3. Completa el formulario:
   - **Usuario:** nombre_usuario
   - **Contraseña:** contraseña_segura
   - **Cámaras Permitidas:** Marca las cámaras que el usuario podrá ver
4. Click en **"Guardar Usuario"**

**Nota:** Para asignar cámaras, primero debes tener cámaras activas

### 3️⃣ Configurar Cámaras

**En cada celular que será cámara:**

1. Inicia sesión con el usuario admin (o cualquier usuario si quieres)
2. Ve a la pestaña **"📹 Cámaras"**
3. Configura:
   - **Nombre:** Ej. "Entrada Principal", "Patio", "Garaje"
   - **Calidad:** Media (recomendada)
   - **Modo Nocturno:** Activar si es de noche
   - **Ajustes visuales:** Brillo, Contraste, Zoom
4. Click **"Iniciar Cámara"**
5. Acepta permisos de cámara
6. Déjalo transmitiendo

### 4️⃣ Asignar Permisos

**Después de activar las cámaras:**

1. Vuelve al panel de admin
2. Edita los usuarios que creaste
3. Ahora aparecerán las cámaras activas para seleccionar
4. Marca las cámaras que cada usuario podrá ver
5. Guarda los cambios

### 5️⃣ Visualizar (Usuarios)

**En el celular de cada usuario:**

1. Inicia sesión con sus credenciales
2. Ve a la pestaña **"👁️ Visualizar"**
3. Verás solo las cámaras que te fueron asignadas
4. Toca una cámara para ver el video en vivo

## 👥 Gestión de Usuarios (Admin)

### Crear Usuario
1. Panel Admin → **"+ Crear Usuario"**
2. Define usuario y contraseña
3. Selecciona cámaras permitidas
4. Guardar

### Editar Permisos
1. Panel Admin → **"Editar"** junto al usuario
2. Modifica cámaras permitidas
3. Cambia contraseña (opcional)
4. Guardar

### Eliminar Usuario
1. Panel Admin → **"Eliminar"** junto al usuario
2. Confirmar eliminación
3. El usuario perderá acceso inmediatamente

### Consideraciones
- El usuario **admin** no puede ser eliminado ni degradado
- Los usuarios solo ven cámaras que estén activas Y asignadas
- Al eliminar un usuario, sus sesiones activas se cierran automáticamente
- Las sesiones expiran después de 24 horas de inactividad

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

### ❌ "Usuario o contraseña incorrectos"
- Verifica que estés usando las credenciales correctas
- El admin por defecto es: `admin / admin123`
- Las contraseñas son case-sensitive

### ❌ "No autenticado" al iniciar cámara
- Asegúrate de haber iniciado sesión correctamente
- Cierra sesión y vuelve a iniciar
- Limpia caché del navegador

### ❌ "No tienes permiso para ver esta cámara"
- Contacta al administrador para que te asigne permisos
- Verifica que la cámara esté en tu lista de permitidas

### ❌ "No puedo ver la cámara"
- Verifica que ambos dispositivos estén conectados
- Asegúrate que la cámara tenga permisos de cámara del navegador
- Revisa que el usuario tenga permisos para esa cámara

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

### Recomendaciones Importantes:

1. **Cambia la contraseña del admin inmediatamente** después de la instalación
2. Usa contraseñas seguras para todos los usuarios
3. No compartas la URL públicamente
4. Revisa periódicamente los usuarios registrados
5. Elimina usuarios que ya no necesitan acceso
6. Las sesiones expiran automáticamente después de 24 horas

### Limitaciones de Seguridad Actuales:

⚠️ **Este sistema usa almacenamiento en memoria**, lo que significa:
- Los usuarios se pierden al reiniciar el servidor
- Para producción, considera implementar una base de datos (MongoDB, PostgreSQL)
- Las contraseñas están hasheadas con bcrypt (seguras)

### Próxima Implementación Recomendada:
- Base de datos persistente
- Autenticación de dos factores (2FA)
- Logs de auditoría
- Rate limiting para prevenir ataques de fuerza bruta

## 🎯 Próximas Mejoras

Ideas para expandir el sistema:

- [ ] 💾 **Base de datos persistente** (MongoDB/PostgreSQL)
- [ ] 🔐 **Autenticación de dos factores (2FA)**
- [ ] 📹 **Grabación de video**
- [ ] 🚨 **Detección de movimiento con alertas**
- [ ] 📊 **Dashboard con estadísticas**
- [ ] 📱 **Notificaciones push**
- [ ] 🎥 **Captura de screenshots**
- [ ] ☁️ **Almacenamiento en nube**
- [ ] 🔊 **Soporte de audio bidireccional**
- [ ] 📈 **Logs de actividad de usuarios**
- [ ] 🌍 **Traducción a múltiples idiomas**
- [ ] 📧 **Recuperación de contraseña por email**

## 📊 Arquitectura del Sistema

```
┌─────────────────┐
│  Cliente Web    │ (Login, Cámaras, Admin)
│  (HTML/JS)      │
└────────┬────────┘
         │ HTTPS/WSS
         ↓
┌─────────────────┐
│  Servidor Node  │ (Autenticación, WebRTC Signaling)
│  (Express/WS)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌─────────┐
│ Cámaras│ │ Viewers │ (Conexión P2P WebRTC)
└────────┘ └─────────┘
```

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