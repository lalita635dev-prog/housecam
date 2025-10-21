// Servidor de señalización WebRTC para sistema de cámaras
// Instalar dependencias: npm install express ws uuid

const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static('public'));

// Endpoint de health check para mantener el servidor activo
app.get('/ping', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cameras: cameras.size,
    viewers: viewers.size
  });
});

// Iniciar servidor HTTP
const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

// Almacenar conexiones
const cameras = new Map(); // id -> {ws, name, viewers: Set}
const viewers = new Map(); // id -> {ws, watchingCamera}

wss.on('connection', (ws) => {
  const connectionId = uuidv4();
  console.log(`Nueva conexión: ${connectionId}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch(data.type) {
        case 'register-camera':
          // Registrar nueva cámara
          cameras.set(connectionId, {
            ws,
            name: data.name || `Cámara ${cameras.size + 1}`,
            viewers: new Set()
          });
          ws.send(JSON.stringify({
            type: 'registered',
            id: connectionId,
            role: 'camera'
          }));
          // Notificar a todos los viewers sobre nueva cámara
          broadcastCameraList();
          console.log(`Cámara registrada: ${data.name}`);
          break;

        case 'register-viewer':
          // Registrar nuevo viewer
          viewers.set(connectionId, {
            ws,
            watchingCamera: null
          });
          ws.send(JSON.stringify({
            type: 'registered',
            id: connectionId,
            role: 'viewer'
          }));
          // Enviar lista de cámaras disponibles
          sendCameraList(ws);
          console.log(`Viewer registrado: ${connectionId}`);
          break;

        case 'request-camera':
          // Viewer solicita conectarse a una cámara
          const camera = cameras.get(data.cameraId);
          if (camera) {
            const viewer = viewers.get(connectionId);
            if (viewer) {
              viewer.watchingCamera = data.cameraId;
              camera.viewers.add(connectionId);
              
              // Notificar a la cámara que hay un nuevo viewer
              camera.ws.send(JSON.stringify({
                type: 'viewer-joined',
                viewerId: connectionId
              }));
            }
          }
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
    // Limpiar al desconectar
    if (cameras.has(connectionId)) {
      const camera = cameras.get(connectionId);
      // Notificar a viewers que la cámara se desconectó
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
      console.log(`Cámara desconectada: ${connectionId}`);
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
      console.log(`Viewer desconectado: ${connectionId}`);
    }
  });
});

function sendCameraList(ws) {
  const cameraList = Array.from(cameras.entries()).map(([id, camera]) => ({
    id,
    name: camera.name,
    viewers: camera.viewers.size
  }));
  
  ws.send(JSON.stringify({
    type: 'camera-list',
    cameras: cameraList
  }));
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