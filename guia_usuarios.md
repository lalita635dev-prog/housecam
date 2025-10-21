# 📖 Guía de Usuario - Sistema de Vigilancia

## 🔐 Sistema de Autenticación

### Credenciales Iniciales
```
Usuario: admin
Contraseña: admin123
```

⚠️ **MUY IMPORTANTE**: Cambia esta contraseña inmediatamente después de la primera instalación.

---

## 👑 Guía para Administradores

### 1. Primer Acceso

1. Abre tu navegador y ve a: `https://tu-app.onrender.com`
2. Inicia sesión con las credenciales de admin
3. Verás el panel principal con 3 pestañas:
   - **📹 Cámaras**: Para activar cámaras
   - **👁️ Visualizar**: Para ver cámaras
   - **⚙️ Administración**: Para gestionar usuarios

### 2. Crear Usuarios

**Pasos:**
1. Ve a la pestaña **"⚙️ Administración"**
2. Click en **"+ Crear Usuario"**
3. Completa el formulario:
   - **Usuario**: Nombre único (sin espacios)
   - **Contraseña**: Contraseña segura
   - **Cámaras Permitidas**: Marca las cámaras que puede ver

4. Click en **"Guardar Usuario"**

**Ejemplo de usuarios:**
```
Usuario: juan_seguridad
Contraseña: Juan2024!
Cámaras: ✅ Entrada, ✅ Patio

Usuario: maria_recepcion
Contraseña: Maria2024!
Cámaras: ✅ Entrada
```

### 3. Flujo de Trabajo Recomendado

**Orden correcto:**

1️⃣ **Activar cámaras primero**
   - Ve a "📹 Cámaras"
   - Configura cada cámara (Entrada, Patio, Garaje, etc.)
   - Déjalas transmitiendo

2️⃣ **Crear usuarios**
   - Ve a "⚙️ Administración"
   - Crea cada usuario

3️⃣ **Asignar permisos**
   - Edita cada usuario
   - Ahora verás las cámaras activas
   - Marca las cámaras correspondientes
   - Guarda

4️⃣ **Entregar credenciales**
   - Comparte usuario y contraseña con cada persona
   - Enséñales a usar la app

### 4. Gestionar Usuarios Existentes

**Editar permisos:**
1. En la tabla de usuarios, click en **"Editar"**
2. Modifica las cámaras permitidas
3. Cambia la contraseña (opcional)
4. Guardar

**Eliminar usuario:**
1. Click en **"Eliminar"** junto al usuario
2. Confirmar la acción
3. El usuario perderá acceso inmediatamente

### 5. Cambiar Contraseña del Admin

1. Ve a "⚙️ Administración"
2. Click en "Editar" junto a tu usuario "admin"
3. Ingresa una nueva contraseña segura
4. Guardar

**Contraseña recomendada:**
- Mínimo 8 caracteres
- Letras mayúsculas y minúsculas
- Números y símbolos
- Ejemplo: `Admin2024$Seguro!`

---

## 👤 Guía para Usuarios

### 1. Iniciar Sesión

1. Abre el navegador en tu celular
2. Ve a: `https://tu-app.onrender.com`
3. Ingresa tu usuario y contraseña (te los dará el admin)
4. Click en **"Iniciar Sesión"**

### 2. Ver Cámaras

1. Una vez dentro, verás 2 pestañas:
   - **📹 Cámaras**: Para activar una cámara (si es tu caso)
   - **👁️ Visualizar**: Para ver las cámaras asignadas

2. Ve a **"👁️ Visualizar"**
3. Verás tarjetas con las cámaras disponibles
4. Toca una cámara para ver el video en vivo
5. Puedes activar pantalla completa tocando el video

### 3. Si Eres Responsable de una Cámara

**Configuración inicial:**
1. Ve a la pestaña **"📹 Cámaras"**
2. Dale un nombre descriptivo: "Entrada Principal", "Patio Trasero", etc.
3. Selecciona calidad:
   - **Alta**: Solo si tienes WiFi muy bueno
   - **Media**: Recomendada ⭐
   - **Baja**: Para WiFi débil

4. Ajustes opcionales:
   - **🌙 Modo Nocturno**: Activar en lugares oscuros
   - **☀️ Brillo**: Ajustar si la imagen está oscura/clara
   - **🎨 Contraste**: Para mejorar definición
   - **🔍 Zoom**: Para acercar una zona

5. Click en **"Iniciar Cámara"**
6. Acepta permisos cuando te lo pida el navegador
7. **Deja el celular transmitiendo** (enchufado a corriente)

**Importante:**
- Mantén el celular enchufado
- Configura que la pantalla no se apague
- Usa WiFi, no datos móviles

---

## 🎯 Casos de Uso Comunes

### Caso 1: Vigilancia de Hogar
```
Admin: Dueño de casa
Usuarios:
  - Usuario: niñera → Cámaras: Sala, Habitación niños
  - Usuario: seguridad → Cámaras: Entrada, Garaje
```

### Caso 2: Negocio Pequeño
```
Admin: Dueño del negocio
Usuarios:
  - Usuario: cajero1 → Cámaras: Caja, Entrada
  - Usuario: almacen → Cámaras: Almacén, Puerta trasera
  - Usuario: gerente → Cámaras: Todas
```

### Caso 3: Edificio de Departamentos
```
Admin: Administrador del edificio
Usuarios:
  - Usuario: portero → Cámaras: Entrada, Lobby, Estacionamiento
  - Usuario: mantenimiento → Cámaras: Sótano, Azotea
  - Usuario: residente301 → Cámaras: Solo Entrada
```

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo cambiar mis permisos de cámaras?**
R: No, solo el administrador puede modificar permisos.

**P: ¿Cuántos usuarios puedo crear?**
R: No hay límite técnico, pero recuerda que el servidor gratuito tiene recursos limitados.

**P: ¿Puedo usar mi cuenta en varios dispositivos?**
R: Sí, puedes iniciar sesión desde cualquier dispositivo.

**P: ¿La contraseña se puede recuperar?**
R: Por ahora no. Si olvidas tu contraseña, contacta al admin para que la resetee.

**P: ¿Puedo activar varias cámaras desde un mismo usuario?**
R: Sí, pero solo desde dispositivos diferentes (un celular = una cámara).

**P: ¿Cómo cierro sesión?**
R: Click en "Cerrar Sesión" en la esquina superior derecha.

**P: ¿Cuánto tiempo dura mi sesión?**
R: 24 horas. Después deberás iniciar sesión nuevamente.

---

## 🔒 Seguridad y Privacidad

### Para Administradores:
- ✅ Usa contraseñas seguras y únicas
- ✅ Revisa periódicamente los usuarios activos
- ✅ Elimina usuarios que ya no necesitan acceso
- ✅ No compartas las credenciales de admin
- ✅ Cambia contraseñas si sospechas compromiso

### Para Usuarios:
- ✅ No compartas tu usuario y contraseña
- ✅ Cierra sesión si usas dispositivos compartidos
- ✅ Reporta cualquier actividad sospechosa al admin

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa la sección de "Solución de Problemas"** en el README
2. **Verifica tu conexión a internet**
3. **Intenta cerrar sesión y volver a entrar**
4. **Contacta al administrador del sistema**

---

## 📝 Notas Técnicas

- El sistema usa WebRTC para conexión directa entre cámaras y visualizadores
- Las contraseñas están encriptadas con bcrypt
- Las sesiones expiran automáticamente después de 24 horas
- El servidor gratuito puede "dormir" después de 15 minutos sin actividad

---

**Versión del documento: 1.0**  
**Última actualización: Octubre 2025**