// Servidor de señalización WebRTC con autenticación
// Instalar dependencias: npm install express ws uuid bcryptjs

const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());
app.use(express.static('public'));

// Base de datos en memoria (en producción usar MongoDB, PostgreSQL, etc.)
const users = new Map();
const sessions = new Map();

// Crear usuario admin por defecto
const adminPassword = bcrypt.hashSync('admin123', 10);
users.set('admin', {
  username: 'admin',
  password: adminPassword,
  role: 'admin',
  allowedCameras: [], // Admin puede ver todas
  createdAt: new Date().toISOString()
});

console.log('🔐 Usuario admin creado - Usuario: admin, Contraseña: admin123');

// Almacenar conexiones
const cameras = new Map(); // id -> {ws, name, viewers: Set, ownerId}
const viewers = new Map(); // id -> {ws, watchingCamera, userId}

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.get(username);
  if (!user) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  const sessionToken = uuidv4();
  sessions.set(sessionToken, {
    username: user.username,
    role: user.role,
    allowedCameras: user.allowedCameras,
    createdAt: new Date()
  });

  res.json({
    success: true,
    token: sessionToken,
    user: {
      username: user.username,
      role: user.role,
      allowedCameras: user.allowedCameras
    }
  });
});

// Verificar sesión
app.post('/api/verify', (req, res) => {
  const { token } = req.body;
  const session = sessions.get(token);
  
  if (!session) {
    return res.status(401).json({ error: 'Sesión inválida' });
  }

  const user = users.get(session.username);
  res.json({
    success: true,
    user: {
      username: user.username,
      role: user.role,
      allowedCameras: user.allowedCameras
    }
  });
});

// Logout
app.post('/api/logout', (req, res) => {
  const { token } = req.body;
  sessions.delete(token);
  res.json({ success: true });
});

// ==================== RUTAS DE ADMINISTRACIÓN ====================

// Middleware para verificar admin
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = sessions.get(token);
  
  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  
  req.session = session;
  next();
};

// Obtener todos los usuarios
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const userList = Array.from(users.values()).map(u => ({
    username: u.username,
    role: u.role,
    allowedCameras: u.allowedCameras,
    createdAt: u.createdAt
  }));
  res.json({ users: userList });
});

// Crear usuario
app.post('/api/admin/users', requireAdmin, (req, res) => {
  const { username, password, allowedCameras } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  if (users.has(username)) {
    return res.status(400).json({ error: 'El usuario ya existe' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users.set(username, {
    username,
    password: hashedPassword,
    role: 'user',
    allowedCameras: allowedCameras || [],
    createdAt: new Date().toISOString()
  });

  res.json({ 
    success: true, 
    message: 'Usuario creado exitosamente',
    user: {
      username,
      role: 'user',
      allowedCameras: allowedCameras || []
    }
  });
});

// Actualizar usuario
app.put('/api/admin/users/:username', requireAdmin, (req, res) => {
  const { username } = req.params;
  const { password, allowedCameras } = req.body;

  const user = users.get(username);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  if (username === 'admin' && req.body.role) {
    return res.status(400).json({ error: 'No se puede cambiar el rol del admin' });
  }

  if (password) {
    user.password = bcrypt.hashSync(password, 10);
  }

  if (allowedCameras !== undefined) {
    user.allowedCameras = allowedCameras;
  }

  users.set(username, user);
  res.json({ success: true, message: 'Usuario actualizado' });
});

// Eliminar usuario
app.delete('/api/admin/users/:username', requireAdmin, (req, res) => {
  const { username } = req.params;

  if (username === 'admin') {
    return res.status(400).json({ error: 'No se puede eliminar el admin' });
  }

  if (!users.has(username)) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  users.delete(username);
  
  // Cerrar sesiones activas del usuario
  for (const [token, session] of sessions.entries()) {
    if (session.username === username) {
      sessions.delete(token);
    }
  }

  res.json({ success: true, message: 'Usuario eliminado' });
});

// Obtener lista de cámaras disponibles
app.get('/api/cameras', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = sessions.get(token);
  
  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const cameraList = Array.from(cameras.entries()).map(([id, camera]) => ({
    id,
    name: camera.name,
    viewers: camera.viewers.size
  }));

  // Filtrar cámaras según permisos
  let filteredCameras = cameraList;
  if (session.role !== 'admin') {
    filteredCameras = cameraList.filter(cam => 
      session.allowedCameras.includes(cam.id)
    );
  }

  res.json({ cameras: filteredCameras });
});

// ==================== HEALTH CHECK ====================

app.get('/ping', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cameras: cameras.size,
    viewers: viewers.size,
    users: users.size,
    sessions: sessions.size
  });
});

// ==================== WEBSOCKET ====================

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  const connectionId = uuidv4();
  console.log(`Nueva conexión WebSocket: ${connectionId}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch(data.type) {
        case 'register-camera':
          // Registrar nueva cámara con token de autenticación
          const cameraSession = sessions.get(data.token);
          if (!cameraSession) {
            ws.send(JSON.stringify({ type: 'error', message: 'No autenticado' }));
            ws.close();
            return;
          }

          cameras.set(connectionId, {
            ws,
            name: data.name || `Cámara ${cameras.size + 1}`,
            viewers: new Set(),
            ownerId: cameraSession.username
          });
          
          ws.send(JSON.stringify({
            type: 'registered',
            id: connectionId,
            role: 'camera'
          }));
          
          broadcastCameraList();
          console.log(`📹 Cámara registrada: ${data.name} (ID: ${connectionId})`);
          break;

        case 'register-viewer':
          // Registrar viewer con autenticación
          const viewerSession = sessions.get(data.token);
          if (!viewerSession) {
            ws.send(JSON.stringify({ type: 'error', message: 'No autenticado' }));
            ws.close();
            return;
          }

          viewers.set(connectionId, {
            ws,
            watchingCamera: null,
            userId: viewerSession.username,
            allowedCameras: viewerSession.allowedCameras,
            role: viewerSession.role
          });
          
          ws.send(JSON.stringify({
            type: 'registered',
            id: connectionId,
            role: 'viewer'
          }));
          
          sendCameraList(ws, viewerSession);
          console.log(`👁️ Viewer registrado: ${viewerSession.username}`);
          break;

        case 'request-camera':
          // Verificar permisos antes de conectar
          const viewer = viewers.get(connectionId);
          const camera = cameras.get(data.cameraId);
          
          if (!viewer || !camera) {
            ws.send(JSON.stringify({ type: 'error', message: 'Cámara no disponible' }));
            return;
          }

          // Verificar permisos
          if (viewer.role !== 'admin' && !viewer.allowedCameras.includes(data.cameraId)) {
            ws.send(JSON.stringify({ type: 'error', message: 'No tienes permiso para ver esta cámara' }));
            return;
          }

          viewer.watchingCamera = data.cameraId;
          camera.viewers.add(connectionId);
          
          camera.ws.send(JSON.stringify({
            type: 'viewer-joined',
            viewerId: connectionId
          }));
          break;

        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Reenviar mensajes de señalización WebRTC
          const targetId = data.target;
          const targetCamera = cameras.get(targetId);
          const targetViewer = viewers.get(targetId);
          
          if (targetCamera) {
            targetCamera.ws.send(JSON.stringify({
              ...data,
              from: connectionId
            }));
          } else if (targetViewer) {
            targetViewer.ws.send(JSON.stringify({
              ...data,
              from: connectionId
            }));
          }
          break;
      }
    } catch (error) {
      console.error('Error procesando mensaje:', error);
    }
  });

  ws.on('close', () => {
    if (cameras.has(connectionId)) {
      const camera = cameras.get(connectionId);
      camera.viewers.forEach(viewerId => {
        const viewer = viewers.get(viewerId);
        if (viewer) {
          viewer.ws.send(JSON.stringify({
            type: 'camera-disconnected',
            cameraId: connectionId
          }));
        }
      });
      cameras.delete(connectionId);
      broadcastCameraList();
      console.log(`📹 Cámara desconectada: ${connectionId}`);
    }
    
    if (viewers.has(connectionId)) {
      const viewer = viewers.get(connectionId);
      if (viewer.watchingCamera) {
        const camera = cameras.get(viewer.watchingCamera);
        if (camera) {
          camera.viewers.delete(connectionId);
        }
      }
      viewers.delete(connectionId);
      console.log(`👁️ Viewer desconectado: ${connectionId}`);
    }
  });
});

function sendCameraList(ws, session) {
  const cameraList = Array.from(cameras.entries()).map(([id, camera]) => ({
    id,
    name: camera.name,
    viewers: camera.viewers.size
  }));
  
  // Filtrar según permisos
  let filteredCameras = cameraList;
  if (session.role !== 'admin') {
    filteredCameras = cameraList.filter(cam => 
      session.allowedCameras.includes(cam.id)
    );
  }
  
  ws.send(JSON.stringify({
    type: 'camera-list',
    cameras: filteredCameras
  }));
}

function broadcastCameraList() {
  viewers.forEach(viewer => {
    const session = sessions.get(viewer.userId);
    if (session) {
      sendCameraList(viewer.ws, session);
    }
  });
}

// Limpiar sesiones antiguas cada hora
setInterval(() => {
  const now = new Date();
  for (const [token, session] of sessions.entries()) {
    const sessionAge = now - new Date(session.createdAt);
    // Eliminar sesiones mayores a 24 horas
    if (sessionAge > 24 * 60 * 60 * 1000) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000);