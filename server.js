// Servidor de señalización WebRTC con autenticación mejorada
// Instalar dependencias: npm install express ws uuid bcryptjs

const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Base de datos en memoria
const users = new Map();
const sessions = new Map();
const cameraConfigs = new Map(); // Configuraciones de cámaras registradas

// Clave secreta para activar cámaras (cámbiala en producción)
const CAMERA_SECRET = process.env.CAMERA_SECRET || 'camara2024secret';

// Crear usuario admin por defecto
const adminPassword = bcrypt.hashSync('admin123', 10);
users.set('admin', {
  username: 'admin',
  password: adminPassword,
  role: 'admin',
  allowedCameras: [],
  createdAt: new Date().toISOString()
});

console.log('🔐 Usuario admin creado');
console.log('   Usuario: admin');
console.log('   Contraseña: admin123');
console.log('🎥 Clave de cámara: ' + CAMERA_SECRET);

// Almacenar conexiones activas
const cameras = new Map(); // id -> {ws, name, configId, viewers: Set}
const viewers = new Map(); // id -> {ws, watchingCamera, userId}

// ==================== AUTENTICACIÓN ====================

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

app.post('/api/logout', (req, res) => {
  const { token } = req.body;
  sessions.delete(token);
  res.json({ success: true });
});

// Verificar clave de cámara
app.post('/api/verify-camera-key', (req, res) => {
  const { key } = req.body;
  
  if (key === CAMERA_SECRET) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Clave de cámara incorrecta' });
  }
});

// ==================== MIDDLEWARE ====================

const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = sessions.get(token);
  
  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  
  req.session = session;
  next();
};

// ==================== GESTIÓN DE USUARIOS ====================

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const userList = Array.from(users.values()).map(u => ({
    username: u.username,
    role: u.role,
    allowedCameras: u.allowedCameras,
    createdAt: u.createdAt
  }));
  res.json({ users: userList });
});

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

app.delete('/api/admin/users/:username', requireAdmin, (req, res) => {
  const { username } = req.params;

  if (username === 'admin') {
    return res.status(400).json({ error: 'No se puede eliminar el admin' });
  }

  if (!users.has(username)) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  users.delete(username);
  
  for (const [token, session] of sessions.entries()) {
    if (session.username === username) {
      sessions.delete(token);
    }
  }

  res.json({ success: true, message: 'Usuario eliminado' });
});

// ==================== GESTIÓN DE CÁMARAS ====================

app.get('/api/admin/camera-configs', requireAdmin, (req, res) => {
  const configs = Array.from(cameraConfigs.values()).map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    location: c.location,
    isActive: cameras.has(c.id),
    createdAt: c.createdAt
  }));
  res.json({ cameras: configs });
});

app.post('/api/admin/camera-configs', requireAdmin, (req, res) => {
  const { name, description, location } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  const id = uuidv4();
  cameraConfigs.set(id, {
    id,
    name,
    description: description || '',
    location: location || '',
    createdAt: new Date().toISOString()
  });

  res.json({ 
    success: true, 
    message: 'Cámara registrada',
    camera: {
      id,
      name,
      description,
      location
    }
  });
});

app.put('/api/admin/camera-configs/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, location } = req.body;

  const config = cameraConfigs.get(id);
  if (!config) {
    return res.status(404).json({ error: 'Cámara no encontrada' });
  }

  if (name) config.name = name;
  if (description !== undefined) config.description = description;
  if (location !== undefined) config.location = location;

  cameraConfigs.set(id, config);
  
  // Actualizar nombre en conexión activa si existe
  if (cameras.has(id)) {
    const camera = cameras.get(id);
    camera.name = name;
    cameras.set(id, camera);
    broadcastCameraList();
  }

  res.json({ success: true, message: 'Cámara actualizada' });
});

app.delete('/api/admin/camera-configs/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  if (!cameraConfigs.has(id)) {
    return res.status(404).json({ error: 'Cámara no encontrada' });
  }

  // Desconectar cámara si está activa
  if (cameras.has(id)) {
    const camera = cameras.get(id);
    camera.ws.close();
    cameras.delete(id);
  }

  cameraConfigs.delete(id);

  // Remover de permisos de usuarios
  for (const [username, user] of users.entries()) {
    if (user.allowedCameras.includes(id)) {
      user.allowedCameras = user.allowedCameras.filter(cid => cid !== id);
      users.set(username, user);
    }
  }

  res.json({ success: true, message: 'Cámara eliminada' });
});

// Obtener cámaras para dispositivos con clave de cámara
app.get('/api/camera-configs', (req, res) => {
  const key = req.headers.authorization?.replace('Bearer ', '');
  
  if (key !== CAMERA_SECRET) {
    return res.status(401).json({ error: 'Clave de cámara incorrecta' });
  }

  const configs = Array.from(cameraConfigs.values()).map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    location: c.location
  }));
  
  res.json({ cameras: configs });
});

// Obtener cámaras para usuario
app.get('/api/cameras', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = sessions.get(token);
  
  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const cameraList = Array.from(cameras.entries()).map(([id, camera]) => ({
    id,
    name: camera.name,
    viewers: camera.viewers.size,
    description: cameraConfigs.get(id)?.description || '',
    location: cameraConfigs.get(id)?.location || ''
  }));

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
    cameraConfigs: cameraConfigs.size,
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
          // Verificar clave de cámara
          if (data.key !== CAMERA_SECRET) {
            ws.send(JSON.stringify({ type: 'error', message: 'Clave de cámara incorrecta' }));
            ws.close();
            return;
          }

          // Verificar que la cámara esté registrada
          if (!cameraConfigs.has(data.cameraId)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Cámara no registrada en el sistema' }));
            ws.close();
            return;
          }

          const config = cameraConfigs.get(data.cameraId);
          
          cameras.set(data.cameraId, {
            ws,
            name: config.name,
            configId: data.cameraId,
            viewers: new Set()
          });
          
          ws.send(JSON.stringify({
            type: 'registered',
            id: data.cameraId,
            role: 'camera',
            name: config.name
          }));
          
          broadcastCameraList();
          console.log(`📹 Cámara conectada: ${config.name} (ID: ${data.cameraId})`);
          break;

        case 'register-viewer':
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
          console.log(`👁️ Viewer conectado: ${viewerSession.username}`);
          break;

        case 'request-camera':
          const viewer = viewers.get(connectionId);
          const camera = cameras.get(data.cameraId);
          
          if (!viewer || !camera) {
            ws.send(JSON.stringify({ type: 'error', message: 'Cámara no disponible' }));
            return;
          }

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
    // Buscar cámara por connectionId en los valores
    for (const [cameraId, camera] of cameras.entries()) {
      if (camera.ws === ws) {
        camera.viewers.forEach(viewerId => {
          const viewer = viewers.get(viewerId);
          if (viewer) {
            viewer.ws.send(JSON.stringify({
              type: 'camera-disconnected',
              cameraId: cameraId
            }));
          }
        });
        cameras.delete(cameraId);
        broadcastCameraList();
        console.log(`📹 Cámara desconectada: ${cameraId}`);
        break;
      }
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
    viewers: camera.viewers.size,
    description: cameraConfigs.get(id)?.description || '',
    location: cameraConfigs.get(id)?.location || ''
  }));
  
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
    const user = users.get(viewer.userId);
    if (user) {
      const session = {
        role: user.role,
        allowedCameras: user.allowedCameras
      };
      sendCameraList(viewer.ws, session);
    }
  });
}

// Limpiar sesiones antiguas cada hora
setInterval(() => {
  const now = new Date();
  for (const [token, session] of sessions.entries()) {
    const sessionAge = now - new Date(session.createdAt);
    if (sessionAge > 24 * 60 * 60 * 1000) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000);