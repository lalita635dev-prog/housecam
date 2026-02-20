// Servidor de señalización WebRTC con autenticación y sesión única
const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ============ CONFIGURACIÓN AUTENTICACIÓN ============
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}



// Tokens de sesión activos
const activeSessions = new Map(); // token -> {userId, role, expiresAt, connectionId}

// Rastrear conexiones activas por usuario
const activeConnections = new Map(); // userId -> connectionId

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function verifyToken(token) {
  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  return session;
}

// ============ ENDPOINTS AUTENTICACIÓN ============
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const passwordHash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  try {
    // 1️⃣ Buscar en viewers
    const viewerResult = await pool.query(
      "SELECT * FROM viewers WHERE username = $1",
      [username]
    );

    if (viewerResult.rows.length > 0) {
      const viewer = viewerResult.rows[0];

      if (viewer.password_hash !== passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(username, "viewer");
      connectedUsers.set(username, { role: "viewer", token });

      return res.json({ token, role: "viewer" });
    }

    // 2️⃣ Buscar en cameras
    const cameraResult = await pool.query(
      "SELECT * FROM cameras WHERE name = $1",
      [username]
    );

    if (cameraResult.rows.length > 0) {
      const camera = cameraResult.rows[0];

      if (camera.password_hash !== passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // bloquear si ya está conectada
      if (cameras.has(username)) {
        return res.status(403).json({ error: "Camera already connected" });
      }

      const token = generateToken(username, "camera");
      connectedUsers.set(username, { role: "camera", token });

      return res.json({ token, role: "camera" });
    }

    return res.status(401).json({ error: "User not found" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/logout', (req, res) => {
  const { token } = req.body;
  if (token) {
    const session = activeSessions.get(token);
    if (session) {
      activeConnections.delete(session.userId);
      activeSessions.delete(token);
    }
  }
  res.json({ success: true });
});

app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cameras: cameras.size,
    viewers: viewers.size,
    sessions: activeSessions.size,
    activeUsers: activeConnections.size,
    version: '5.3.0'
  });
});

// ============ SERVIDOR WEBSOCKET ============
server.listen(PORT, () => {
  console.log(`🚀 Servidor v5.3 en puerto ${PORT}`);
  console.log("📊 Sistema iniciado con base de datos PostgreSQL");
});

const wss = new WebSocket.Server({ server });

const cameras = new Map();
const viewers = new Map();

wss.on('connection', (ws) => {
  const connectionId = uuidv4();
  let authenticated = false;
  let userSession = null;

  console.log(`Nueva conexión: ${connectionId}`);

  // Timeout de autenticación (10 segundos)
  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Timeout de autenticación'
      }));
      ws.close();
    }
  }, 10000);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Primer mensaje debe ser autenticación
      if (!authenticated && data.type !== 'authenticate') {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Debe autenticarse primero'
        }));
        return;
      }

      switch (data.type) {
        case 'authenticate':
          clearTimeout(authTimeout);
          const session = verifyToken(data.token);

          if (!session) {
            ws.send(JSON.stringify({
              type: 'auth-failed',
              message: 'Token inválido o expirado'
            }));
            ws.close();
            return;
          }

          // Verificar si el usuario ya está conectado
          if (activeConnections.has(session.userId)) {
            const existingId = activeConnections.get(session.userId);
            if (existingId !== connectionId && (cameras.has(existingId) || viewers.has(existingId))) {
              ws.send(JSON.stringify({
                type: 'session-taken',
                message: 'Usuario ya conectado en otro dispositivo'
              }));
              ws.close();
              return;
            }
          }

          authenticated = true;
          userSession = session;
          session.connectionId = connectionId;
          activeConnections.set(session.userId, connectionId);

          ws.send(JSON.stringify({
            type: 'authenticated',
            userId: session.userId,
            role: session.role
          }));

          console.log(`Autenticado: ${session.userId} (${session.role})`);
          break;

        case 'ping':
          // Responder al ping para mantener la conexión activa
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'register-camera':
          if (userSession.role !== 'camera') {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'No autorizado para transmitir'
            }));
            return;
          }

          cameras.set(connectionId, {
            ws,
            name: data.name || `Cámara ${cameras.size + 1}`,
            userId: userSession.userId,
            viewers: new Set(),
            previewViewers: new Set()
          });

          ws.send(JSON.stringify({
            type: 'registered',
            id: connectionId,
            role: 'camera'
          }));

          broadcastCameraList();
          console.log(`Cámara registrada: ${data.name} (${userSession.userId})`);
          break;

        case 'register-viewer':
          if (userSession.role !== 'viewer') {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'No autorizado para ver'
            }));
            return;
          }

          viewers.set(connectionId, {
            ws,
            userId: userSession.userId,
            watchingCamera: null
          });

          ws.send(JSON.stringify({
            type: 'registered',
            id: connectionId,
            role: 'viewer'
          }));

          sendCameraList(ws);
          console.log(`Viewer registrado: ${userSession.userId}`);
          break;

        case 'request-preview':
          const previewCamera = cameras.get(data.cameraId);
          if (previewCamera) {
            const viewer = viewers.get(connectionId);
            if (viewer) {
              previewCamera.previewViewers.add(connectionId);

              previewCamera.ws.send(JSON.stringify({
                type: 'preview-request',
                viewerId: connectionId
              }));
            }
          }
          break;

        case 'request-camera':
          const camera = cameras.get(data.cameraId);
          if (camera) {
            const viewer = viewers.get(connectionId);
            if (viewer) {
              viewer.watchingCamera = data.cameraId;
              camera.viewers.add(connectionId);

              camera.ws.send(JSON.stringify({
                type: 'viewer-joined',
                viewerId: connectionId
              }));
            }
          }
          break;

        case 'motion-detected':
          if (userSession.role !== 'camera') {
            return;
          }

          const motionCamera = cameras.get(connectionId);
          if (motionCamera) {
            console.log(`🚨 Movimiento en: ${motionCamera.name}`);

            // Enviar a todos los viewers
            viewers.forEach(viewer => {
              viewer.ws.send(JSON.stringify({
                type: 'motion-alert',
                cameraId: connectionId,
                cameraName: motionCamera.name,
                timestamp: new Date().toISOString()
              }));
            });
          }
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
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error procesando solicitud'
      }));
    }
  });

  ws.on('close', () => {
    clearTimeout(authTimeout);

    if (cameras.has(connectionId)) {
      const camera = cameras.get(connectionId);

      // Notificar a viewers
      camera.viewers.forEach(viewerId => {
        const viewer = viewers.get(viewerId);
        if (viewer) {
          viewer.ws.send(JSON.stringify({
            type: 'camera-disconnected',
            cameraId: connectionId
          }));
        }
      });

      if (userSession) {
        activeConnections.delete(userSession.userId);
      }

      cameras.delete(connectionId);
      broadcastCameraList();
      console.log(`Cámara desconectada: ${connectionId}`);
    }

    if (viewers.has(connectionId)) {
      const viewer = viewers.get(connectionId);

      if (viewer.watchingCamera) {
        const camera = cameras.get(viewer.watchingCamera);
        if (camera) {
          camera.viewers.delete(connectionId);
          camera.previewViewers.delete(connectionId);
        }
      }

      if (userSession) {
        activeConnections.delete(userSession.userId);
      }

      viewers.delete(connectionId);
      console.log(`Viewer desconectado: ${connectionId}`);
    }
  });
});

async function sendCameraList(ws) {
  if (!ws.username) return;

  try {
    // obtener id del viewer
    const viewerResult = await pool.query(
      "SELECT id FROM viewers WHERE username = $1",
      [ws.username]
    );

    if (viewerResult.rows.length === 0) return;

    const viewerId = viewerResult.rows[0].id;

    // obtener cámaras permitidas
    const permissions = await pool.query(
      `
      SELECT c.name
      FROM cameras c
      JOIN viewer_camera_permissions vcp
        ON c.id = vcp.camera_id
      WHERE vcp.viewer_id = $1
      `,
      [viewerId]
    );

    const allowedCameraNames = permissions.rows.map(r => r.name);

    // filtrar solo las conectadas
    const visibleCameras = Array.from(cameras.keys())
      .filter(camName => allowedCameraNames.includes(camName));

    ws.send(JSON.stringify({
      type: "camera-list",
      cameras: visibleCameras
    }));

  } catch (err) {
    console.error("Error sending camera list:", err);
  }
}

function broadcastCameraList() {
  const cameraList = Array.from(cameras.entries()).map(([id, camera]) => ({
    id,
    name: camera.name,
    viewers: camera.viewers.size
  }));

  const message = JSON.stringify({
    type: 'camera-list',
    cameras: cameraList
  });

  viewers.forEach(viewer => {
    viewer.ws.send(message);
  });
}

// Limpiar sesiones expiradas cada hora
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      if (session.userId) {
        activeConnections.delete(session.userId);
      }
      activeSessions.delete(token);
    }
  }
}, 60 * 60 * 1000);