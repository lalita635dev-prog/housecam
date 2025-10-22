# 🎥 Sistema de Vigilancia con WebRTC y Autenticación Mejorada

Sistema completo de vigilancia usando celulares Android como cámaras, con transmisión en tiempo real, **sistema de usuarios con permisos**, **gestión centralizada de cámaras** y panel de administración.

## ✨ Características

- 🔐 **Sistema de autenticación** con roles separados
- 🎥 **Cámaras independientes**: Activar con clave única (no requiere usuario)
- 👑 **Panel de administración** completo para gestionar usuarios y cámaras
- 🎯 **Permisos granulares**: Cada usuario ve solo sus cámaras asignadas
- 📹 **Múltiples cámaras** simultáneas
- 🌐 **Acceso remoto** desde cualquier lugar
- 🎨 **Controles avanzados**: Brillo, Contraste, Zoom
- 🌙 **Modo nocturno** para mejor visibilidad
- 🎯 **Calidad ajustable**: Alta (1080p), Media (720p), Baja (480p)
- 🔒 **WebRTC** para baja latencia y conexión P2P
- 💯 **100% Gratis** usando tier gratuito de Render.com

## 🔐 Sistema Mejorado

### **Separación de Roles**

#### **👑 Administrador**
- Acceso completo a todas las cámaras
- Registra cámaras en el sistema
- Crea usuarios y asigna permisos
- Gestiona configuraciones

#### **👤 Usuario** 
- Solo visualiza cámaras asignadas
- No puede activar cámaras
- Acceso limitado según permisos

#### **📹 Dispositivo Cámara**
- Usa clave de cámara única
- Se conecta a una cámara registrada
- No requiere usuario individual

### **Credenciales por Defecto**

**Admin:**
```
Usuario: admin
Contraseña: admin123
```

**Clave de Cámara:**
```
Clave: camara2024secret
```

⚠️ **IMPORTANTE**: Cambia estas credenciales después de la instalación

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

## 📱 Flujo de Trabajo Completo

### **Paso 1: Configuración Inicial (Admin)**

1. Accede como admin: `admin / admin123`
2. Ve a **⚙️ Administración** → **📹 Cámaras**
3. Registra todas tus cámaras:
   - Click **"+ Registrar Cámara"**
   - Nombre: `Entrada Principal`
   - Ubicación: `Planta Baja`
   - Descripción: `Vista frontal de entrada`
   - Guardar y repetir para cada ubicación

4. Ve a **👥 Usuarios**
5. Crea usuarios para cada persona:
   - Click **"+ Crear Usuario"**
   - Usuario: `juan_seguridad`
   - Contraseña: `Juan2024!`
   - Marca las cámaras que puede ver: ✅ Entrada, ✅ Patio
   - Guardar

### **Paso 2: Activar Cámaras (Dispositivos)**

**En cada celular que será cámara:**

1. Abre el navegador y ve a tu URL
2. En el login, selecciona la pestaña **"📹 Cámara"**
3. Ingresa la clave: `camara2024secret`
4. Selecciona del menú: `Entrada Principal` (o la que corresponda)
5. Configura calidad (Media recomendada)
6. Ajusta brillo/contraste si es necesario
7. Click **"Iniciar Transmisión"**
8. Deja el celular enchufado y transmitiendo

### **Paso 3: Visualizar (Usuarios)**

**En el celular personal del usuario:**

1. Abre el navegador y ve a tu URL
2. En el login, pestaña **"👤 Usuario"**
3. Ingresa credenciales: `juan_seguridad / Juan2024!`
4. Verás solo las cámaras asignadas
5. Toca una cámara para ver el video en vivo

## 👥 Gestión (Admin)

### **Gestionar Cámaras**

**Registrar nueva cámara:**
1. Admin → 📹 Cámaras → + Registrar Cámara
2. Completar datos y guardar

**Editar cámara:**
1. Click "Editar" junto a la cámara
2. Modificar nombre, ubicación o descripción
3. Guardar (actualiza en usuarios automáticamente)

**Eliminar cámara:**
1. Click "Eliminar"
2. Confirmar (se quita de todos los permisos)

**Ver estado:**
- 🟢 Activa: Transmitiendo ahora
- ⚫ Inactiva: Registrada pero no transmitiendo

### **Gestionar Usuarios**

**Crear usuario:**
1. Admin → 👥 Usuarios → + Crear Usuario
2. Completar datos
3. Seleccionar cámaras permitidas
4. Guardar

**Editar permisos:**
1. Click "Editar" junto al usuario
2. Modificar cámaras permitidas
3. Cambiar contraseña (opcional)
4. Guardar

**Eliminar usuario:**
1. Click "Eliminar"
2. Confirmar (sesiones activas se cierran automáticamente)

### **Cambiar Clave de Cámara**

Por seguridad, la clave de cámara puede cambiarse:

**Opción 1: Variable de entorno (Recomendada)**
- En Render → Settings → Environment Variables
- Agregar: `CAMERA_SECRET=tu_nueva_clave_segura`
- Redeploy

**Opción 2: Código**
- Modificar en `server.js`: `const CAMERA_SECRET = 'tu_nueva_clave';`
- Commit y push

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