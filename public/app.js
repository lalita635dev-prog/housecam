// ==================== VARIABLES GLOBALES ====================
let ws = null;
let localStream = null;
let peerConnections = new Map();
let previewPeerConnections = new Map();
let myId = null;
let authToken = null;
let currentUser = null;
let wakeLock = null;
let keepAliveInterval = null;
// NUEVAS VARIABLES PARA WAKE LOCK MEJORADO
let keepAliveAudio = null;
let screenLockWorkaround = null;

// Variables para detección de movimiento
let motionDetectionEnabled = false;
let motionDetectionInterval = null;
let previousFrame = null;
let motionCanvas = null;
let motionContext = null;
let lastMotionAlert = 0;
const MOTION_THRESHOLD = 30;
const MOTION_PIXEL_THRESHOLD = 0.02;
const ALERT_COOLDOWN = 5000;

const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// ==================== INICIALIZACIÓN ====================
window.addEventListener('DOMContentLoaded', () => {
    setupCameraControls();
    checkWakeLockSupport();
    requestNotificationPermissionOnLoad();

    document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });

    const toggleBtn = document.getElementById('toggle-advanced');
    const advancedConfig = document.getElementById('advanced-config');
    if (toggleBtn && advancedConfig) {
        toggleBtn.addEventListener('click', () => {
            advancedConfig.classList.toggle('hidden');
            toggleBtn.textContent = advancedConfig.classList.contains('hidden') ?
                '⚙️ Mostrar Configuración Avanzada' : '⚙️ Ocultar Configuración';
        });
    }
});

window.addEventListener('beforeunload', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (ws) ws.close();
    releaseWakeLock();
    if (keepAliveInterval) clearInterval(keepAliveInterval);
});

// NUEVO EVENT LISTENER MEJORADO PARA VISIBILIDAD
document.addEventListener('visibilitychange', async () => {
    const video = document.getElementById('camera-preview');
    const keepAwakeCheckbox = document.getElementById('keep-awake');

    if (document.hidden) {
        console.log('📱 Página oculta - manteniendo transmisión activa');

        // Asegurar que el audio siga sonando
        if (keepAliveAudio && keepAliveAudio.audioContext.state === 'suspended') {
            keepAliveAudio.audioContext.resume();
        }

        // Asegurar que el video siga activo
        if (video && video.srcObject && !video.paused) {
            console.log('✅ Video activo en segundo plano');
        }
    } else {
        console.log('📱 Página visible');

        // Reactivar video si está pausado
        if (video && video.srcObject && video.paused) {
            video.play().catch(e => console.log('Reactivando video:', e));
        }

        // Reactivar wake lock si estaba activo
        if (localStream && keepAwakeCheckbox?.checked) {
            await requestWakeLock();
        }
    }
});

// ==================== WAKE LOCK MEJORADO PARA MÓVILES ====================
function checkWakeLockSupport() {
    if ('wakeLock' in navigator) {
        console.log('✅ Wake Lock API disponible');
        return true;
    } else {
        console.warn('⚠️ Wake Lock API no disponible');
        return false;
    }
}

async function requestWakeLock() {
    const keepAwakeCheckbox = document.getElementById('keep-awake');
    if (!keepAwakeCheckbox?.checked) {
        showWakeLockStatus('ℹ️ Mantener pantalla activa está desactivado', 'info');
        stopScreenLockWorkaround();
        return false;
    }

    // Intentar Wake Lock API primero
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('🔒 Wake Lock activado');
            showWakeLockStatus('🔋 Pantalla permanecerá activa', 'success');

            wakeLock.addEventListener('release', async () => {
                console.log('🔓 Wake Lock liberado, reactivando...');
                if (localStream && keepAwakeCheckbox?.checked) {
                    setTimeout(() => requestWakeLock(), 1000);
                }
            });
        } catch (err) {
            console.error('❌ Error Wake Lock:', err);
        }
    }

    // Activar workarounds para móviles (funciona con o sin Wake Lock)
    startScreenLockWorkaround();
    showWakeLockStatus('🔋 Sistema anti-suspensión activo', 'success');
    return true;
}

function startScreenLockWorkaround() {
    console.log('🔧 Iniciando workarounds para móviles...');

    // 1. Crear audio silencioso en loop (más efectivo que ping)
    createKeepAliveAudio();

    // 2. Ping periódico al servidor
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    keepAliveInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        }
    }, 20000); // Cada 20 segundos

    // 3. Forzar que el video se mantenga reproduciendo
    const video = document.getElementById('camera-preview');
    if (video && video.srcObject) {
        video.play().catch(e => console.log('Video play:', e));

        // Vigilar que el video siga activo
        if (screenLockWorkaround) clearInterval(screenLockWorkaround);
        screenLockWorkaround = setInterval(() => {
            if (video.paused && video.srcObject) {
                console.log('🔄 Reactivando video...');
                video.play().catch(e => { });
            }
        }, 5000);
    }
}

function createKeepAliveAudio() {
    try {
        // Si ya existe, no crear otro
        if (keepAliveAudio) return;

        // Crear AudioContext
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();

        // Crear un buffer de audio silencioso de 1 segundo
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * 1, sampleRate);
        const channelData = buffer.getChannelData(0);

        // Llenar con silencio (valores muy bajos)
        for (let i = 0; i < buffer.length; i++) {
            channelData[i] = Math.random() * 0.0001 - 0.00005;
        }

        // Crear source y loop
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Crear gain para controlar volumen (casi inaudible)
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.001;

        // Conectar
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Iniciar
        source.start(0);

        keepAliveAudio = { audioContext, source, gainNode };
        console.log('🔊 Audio keep-alive iniciado');

        // Reanudar el contexto si se suspende
        setInterval(() => {
            if (audioContext.state === 'suspended') {
                console.log('🔄 Reanudando audio context...');
                audioContext.resume();
            }
        }, 10000);

    } catch (e) {
        console.error('Error creando keep-alive audio:', e);
    }
}

function stopScreenLockWorkaround() {
    console.log('🛑 Deteniendo workarounds...');

    // Detener audio
    if (keepAliveAudio) {
        try {
            keepAliveAudio.source.stop();
            keepAliveAudio.audioContext.close();
            keepAliveAudio = null;
            console.log('🔇 Audio keep-alive detenido');
        } catch (e) {
            console.error('Error deteniendo audio:', e);
        }
    }

    // Detener pings
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }

    // Detener vigilancia de video
    if (screenLockWorkaround) {
        clearInterval(screenLockWorkaround);
        screenLockWorkaround = null;
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release()
            .then(() => {
                wakeLock = null;
                console.log('🔓 Wake Lock liberado');
                hideWakeLockStatus();
            })
            .catch(err => console.error('Error:', err));
    }

    stopScreenLockWorkaround();
}

function showWakeLockStatus(message, type) {
    const statusEl = document.getElementById('wake-lock-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.classList.remove('hidden');

    if (type === 'success') {
        statusEl.style.background = '#064e3b';
        statusEl.style.color = '#6ee7b7';
    } else if (type === 'error' || type === 'warning') {
        statusEl.style.background = '#7f1d1d';
        statusEl.style.color = '#fca5a5';
    } else {
        statusEl.style.background = '#1e3a8a';
        statusEl.style.color = '#93c5fd';
    }
}

function hideWakeLockStatus() {
    const statusEl = document.getElementById('wake-lock-status');
    if (statusEl) {
        statusEl.classList.add('hidden');
    }
}

// ==================== LOGIN ====================
async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('login-role').value;

    if (!username || !password) {
        showStatus('login-status', 'Por favor completa todos los campos', 'error');
        return;
    }

    try {
        showStatus('login-status', 'Autenticando...', 'info');

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            authToken = data.token;
            currentUser = { username: data.userId, role: data.role };
            localStorage.setItem('authToken', authToken);

            if (data.role === 'camera') {
                showCameraInterface();
            } else {
                showViewerInterface();
            }
        } else {
            showStatus('login-status', data.error || 'Credenciales inválidas', 'error');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showStatus('login-status', 'Error de conexión', 'error');
    }
}

function showCameraInterface() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').classList.add('active');
    document.getElementById('current-user').textContent = currentUser.username;
    document.getElementById('current-role').textContent = '📹 Cámara';
    document.getElementById('camera-mode-btn').classList.remove('hidden');
    document.getElementById('viewer-mode-btn').classList.add('hidden');
    selectMode('camera');
}

function showViewerInterface() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').classList.add('active');
    document.getElementById('current-user').textContent = currentUser.username;
    document.getElementById('current-role').textContent = '👁️ Viewer';
    document.getElementById('camera-mode-btn').classList.add('hidden');
    document.getElementById('viewer-mode-btn').classList.remove('hidden');
    selectMode('viewer');
    connectViewer();
}

async function logout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: authToken })
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }

    if (ws) ws.close();
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    peerConnections.forEach(pc => pc.close());
    peerConnections.clear();
    previewPeerConnections.forEach(pc => pc.close());
    previewPeerConnections.clear();
    releaseWakeLock();

    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');

    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    showStatus('login-status', '', 'info');
}

// ==================== NAVEGACIÓN ====================
function selectMode(mode) {
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    if (mode === 'camera') {
        document.getElementById('camera-mode-btn')?.classList.add('active');
        document.getElementById('camera-section').classList.add('active');
        document.getElementById('viewer-section').classList.remove('active');
    } else {
        document.getElementById('viewer-mode-btn')?.classList.add('active');
        document.getElementById('viewer-section').classList.add('active');
        document.getElementById('camera-section').classList.remove('active');
    }
}

// ==================== CONTROLES CÁMARA ====================
function setupCameraControls() {
    document.getElementById('brightness')?.addEventListener('input', (e) => {
        document.getElementById('brightness-value').textContent = e.target.value;
        applyVideoFilters();
    });

    document.getElementById('contrast')?.addEventListener('input', (e) => {
        document.getElementById('contrast-value').textContent = e.target.value;
        applyVideoFilters();
    });

    document.getElementById('zoom')?.addEventListener('input', (e) => {
        document.getElementById('zoom-value').textContent = parseFloat(e.target.value).toFixed(1);
        applyVideoZoom();
    });

    document.getElementById('night-mode')?.addEventListener('change', (e) => {
        const video = document.getElementById('camera-preview');
        if (e.target.checked) {
            video.classList.add('night-mode');
            document.getElementById('brightness').value = 150;
            document.getElementById('brightness-value').textContent = '150';
            document.getElementById('contrast').value = 120;
            document.getElementById('contrast-value').textContent = '120';
        } else {
            video.classList.remove('night-mode');
            document.getElementById('brightness').value = 100;
            document.getElementById('brightness-value').textContent = '100';
            document.getElementById('contrast').value = 100;
            document.getElementById('contrast-value').textContent = '100';
        }
        applyVideoFilters();
    });
}

function applyVideoFilters() {
    const video = document.getElementById('camera-preview');
    const brightness = document.getElementById('brightness').value;
    const contrast = document.getElementById('contrast').value;
    const nightMode = document.getElementById('night-mode')?.checked;

    if (!nightMode) {
        video.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    }
}

function applyVideoZoom() {
    const video = document.getElementById('camera-preview');
    const zoom = document.getElementById('zoom').value;
    video.style.transform = `scale(${zoom})`;
    video.style.transformOrigin = 'center center';
}

// ==================== DETECCIÓN MOVIMIENTO ====================
function initMotionDetection() {
    motionCanvas = document.createElement('canvas');
    motionContext = motionCanvas.getContext('2d', { willReadFrequently: true });
}

function detectMotion() {
    const video = document.getElementById('camera-preview');

    if (!video.videoWidth || !video.videoHeight) return;

    if (motionCanvas.width !== video.videoWidth || motionCanvas.height !== video.videoHeight) {
        motionCanvas.width = video.videoWidth;
        motionCanvas.height = video.videoHeight;
    }

    motionContext.drawImage(video, 0, 0, motionCanvas.width, motionCanvas.height);
    const currentFrame = motionContext.getImageData(0, 0, motionCanvas.width, motionCanvas.height);

    if (!previousFrame) {
        previousFrame = currentFrame;
        return;
    }

    let motionPixels = 0;
    const totalPixels = currentFrame.data.length / 4;

    for (let i = 0; i < currentFrame.data.length; i += 4) {
        const diff = Math.abs(currentFrame.data[i] - previousFrame.data[i]) +
            Math.abs(currentFrame.data[i + 1] - previousFrame.data[i + 1]) +
            Math.abs(currentFrame.data[i + 2] - previousFrame.data[i + 2]);

        if (diff > MOTION_THRESHOLD) {
            motionPixels++;
        }
    }

    const motionPercentage = motionPixels / totalPixels;

    if (motionPercentage > MOTION_PIXEL_THRESHOLD) {
        const now = Date.now();
        if (now - lastMotionAlert > ALERT_COOLDOWN) {
            console.log(`🚨 Movimiento: ${(motionPercentage * 100).toFixed(2)}%`);
            sendMotionAlert();
            lastMotionAlert = now;
            showMotionIndicator();
        }
    }

    previousFrame = currentFrame;
}

function sendMotionAlert() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'motion-detected' }));
    }
}

function showMotionIndicator() {
    const indicator = document.getElementById('motion-indicator');
    if (indicator) {
        indicator.style.display = 'block';
        setTimeout(() => indicator.style.display = 'none', 2000);
    }
}

function toggleMotionDetection() {
    motionDetectionEnabled = !motionDetectionEnabled;
    const btn = document.getElementById('motion-detection-toggle');
    const status = document.getElementById('motion-status');

    if (motionDetectionEnabled) {
        initMotionDetection();
        motionDetectionInterval = setInterval(detectMotion, 500);
        btn.textContent = '⏸️ Pausar Detección';
        btn.classList.add('active');
        status.textContent = '🟢 Activa';
        status.style.color = '#6ee7b7';
        showStatus('camera-status', '✅ Detección activada', 'success');

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    } else {
        if (motionDetectionInterval) {
            clearInterval(motionDetectionInterval);
            motionDetectionInterval = null;
        }
        btn.textContent = '▶️ Iniciar Detección';
        btn.classList.remove('active');
        status.textContent = '⚫ Inactiva';
        status.style.color = '#64748b';
        previousFrame = null;
    }
}

// ==================== NOTIFICACIONES MEJORADAS ====================
function requestNotificationPermissionOnLoad() {
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            if (document.visibilityState === 'visible') {
                Notification.requestPermission().then(permission => {
                    console.log('🔔 Permiso de notificaciones:', permission);
                });
            }
        }, 2000);
    }
}

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Este navegador no soporta notificaciones');
        return;
    }

    if (Notification.permission === 'granted') {
        showStatus('viewer-status', '✅ Notificaciones activas', 'success');
        testNotification();
        setTimeout(() => showStatus('viewer-status', '✅ Conectado', 'success'), 3000);
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            showStatus('viewer-status', '✅ Notificaciones activadas', 'success');
            testNotification();
            setTimeout(() => showStatus('viewer-status', '✅ Conectado', 'success'), 3000);
        } else {
            showStatus('viewer-status', '⚠️ Notificaciones bloqueadas', 'error');
            setTimeout(() => showStatus('viewer-status', '✅ Conectado', 'success'), 3000);
        }
    });
}

function testNotification() {
    try {
        new Notification('🏠 HouseCam App', {
            body: 'Notificaciones activadas correctamente',
            icon: '/icons/icon-192x192.png',
            tag: 'test',
            requireInteraction: false,
            vibrate: [200, 100, 200]
        });
    } catch (e) {
        console.error('Error al mostrar notificación:', e);
    }
}

function handleMotionAlert(data) {
    console.log('🚨 Alerta:', data.cameraName);

    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            const n = new Notification('🚨 Movimiento Detectado', {
                body: `Cámara: ${data.cameraName}\n${new Date(data.timestamp).toLocaleTimeString()}`,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: data.cameraId,
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200],
                silent: false
            });
            n.onclick = () => {
                window.focus();
                n.close();
            };
        } catch (error) {
            console.error('Error notificación:', error);
            sendNotificationToServiceWorker(data);
        }
    } else {
        sendNotificationToServiceWorker(data);
    }

    const alertsContainer = document.getElementById('motion-alerts-list');
    if (alertsContainer) {
        const noAlertsMsg = alertsContainer.querySelector('p');
        if (noAlertsMsg) noAlertsMsg.remove();

        const alertEl = document.createElement('div');
        alertEl.className = 'motion-alert-item';
        alertEl.innerHTML = `
            <span class="alert-icon">🚨</span>
            <div class="alert-content">
                <strong>${data.cameraName}</strong>
                <small>${new Date(data.timestamp).toLocaleTimeString()}</small>
            </div>
        `;
        alertsContainer.insertBefore(alertEl, alertsContainer.firstChild);

        while (alertsContainer.children.length > 10) {
            alertsContainer.removeChild(alertsContainer.lastChild);
        }

        setTimeout(() => {
            if (alertEl.parentNode) alertEl.remove();
            if (alertsContainer.children.length === 0) {
                alertsContainer.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">No hay alertas recientes</p>';
            }
        }, 30000);
    }

    showStatus('viewer-status', `🚨 Movimiento en ${data.cameraName}`, 'error');
    setTimeout(() => showStatus('viewer-status', '✅ Conectado', 'success'), 3000);

    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
}

function sendNotificationToServiceWorker(data) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('🚨 Movimiento Detectado', {
                body: `Cámara: ${data.cameraName}\n${new Date(data.timestamp).toLocaleTimeString()}`,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                tag: data.cameraId,
                requireInteraction: true,
                vibrate: [200, 100, 200, 100, 200],
                data: data
            });
        });
    }
}

// ==================== CÁMARA ====================
async function startCamera() {
    const cameraName = document.getElementById('camera-name').value.trim();
    const quality = document.getElementById('video-quality').value;

    try {
        showStatus('camera-status', 'Solicitando cámara...', 'info');

        let videoConfig = {};
        switch (quality) {
            case 'high':
                videoConfig = { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } };
                break;
            case 'low':
                videoConfig = { facingMode: 'environment', width: { ideal: 854 }, height: { ideal: 480 }, frameRate: { ideal: 20 } };
                break;
            default:
                videoConfig = { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 25 } };
        }

        localStream = await navigator.mediaDevices.getUserMedia({ video: videoConfig, audio: false });
        const video = document.getElementById('camera-preview');
        video.srcObject = localStream;

        // CONFIGURACIÓN MEJORADA DEL VIDEO PARA NO PAUSARSE
        video.playsInline = true;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');

        // Forzar reproducción continua
        video.addEventListener('pause', () => {
            if (video.srcObject && document.getElementById('keep-awake')?.checked) {
                console.log('⚠️ Video pausado, reactivando...');
                video.play().catch(e => { });
            }
        });

        applyVideoFilters();
        applyVideoZoom();
        await requestWakeLock();
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}`);

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'authenticate', token: authToken }));
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'authenticated':
                    ws.send(JSON.stringify({ type: 'register-camera', name: cameraName }));
                    break;

                case 'registered':
                    myId = data.id;
                    console.log('✅ Cámara registrada:', myId);
                    showStatus('camera-status', '✅ Transmitiendo', 'success');
                    document.getElementById('camera-info').classList.remove('hidden');
                    document.getElementById('camera-info').textContent = `📡 ${cameraName}`;
                    document.getElementById('start-camera-btn').classList.add('hidden');
                    document.getElementById('stop-camera-btn').classList.remove('hidden');
                    document.getElementById('motion-controls').classList.remove('hidden');
                    break;

                case 'viewer-joined':
                    console.log('👁️ Viewer conectado:', data.viewerId);
                    await createPeerConnection(data.viewerId, false);
                    break;

                case 'preview-request':
                    console.log('🔍 Solicitud de preview:', data.viewerId);
                    await createPeerConnection(data.viewerId, true);
                    break;

                case 'answer':
                    const pc = peerConnections.get(data.from) || previewPeerConnections.get(data.from);
                    if (pc) {
                        console.log('📥 Respuesta de viewer:', data.from);
                        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    }
                    break;

                case 'ice-candidate':
                    const conn = peerConnections.get(data.from) || previewPeerConnections.get(data.from);
                    if (conn && data.candidate) {
                        console.log('🧊 ICE candidate:', data.from);
                        await conn.addIceCandidate(new RTCIceCandidate(data.candidate));
                    }
                    break;

                case 'pong':
                    break;

                case 'session-taken':
                    showStatus('camera-status', '❌ Cámara en uso en otro dispositivo', 'error');
                    setTimeout(() => {
                        stopCamera();
                        logout();
                    }, 3000);
                    break;

                case 'auth-failed':
                    showStatus('camera-status', '❌ Sesión expirada', 'error');
                    setTimeout(logout, 2000);
                    break;

                case 'error':
                    showStatus('camera-status', `❌ ${data.message}`, 'error');
                    break;
            }
        };

        ws.onerror = () => showStatus('camera-status', '❌ Error de conexión', 'error');
        ws.onclose = () => {
            console.log('🔌 WebSocket cerrado');
            releaseWakeLock();
        };

    } catch (error) {
        showStatus('camera-status', `❌ Error: ${error.message}`, 'error');
        releaseWakeLock();
    }
}

async function createPeerConnection(viewerId, isPreview) {
    console.log(`🔗 Creando ${isPreview ? 'preview' : 'conexión'} para:`, viewerId);

    const pc = new RTCPeerConnection(iceServers);

    if (isPreview) {
        previewPeerConnections.set(viewerId, pc);
    } else {
        peerConnections.set(viewerId, pc);
    }

    const quality = document.getElementById('video-quality').value;
    let maxBitrate = quality === 'high' ? 2500000 : quality === 'low' ? 800000 : 1500000;
    let maxFramerate = quality === 'high' ? 30 : quality === 'low' ? 20 : 25;

    if (isPreview) {
        maxBitrate = 500000;
        maxFramerate = 15;
    }

    localStream.getTracks().forEach(track => {
        const sender = pc.addTrack(track, localStream);

        if (track.kind === 'video') {
            const params = sender.getParameters();
            if (!params.encodings) params.encodings = [{}];
            params.encodings[0].maxBitrate = maxBitrate;
            params.encodings[0].maxFramerate = maxFramerate;
            sender.setParameters(params).catch(e => console.log('Error params:', e));
        }
    });

    pc.onicecandidate = (event) => {
        if (event.candidate && ws) {
            ws.send(JSON.stringify({
                type: 'ice-candidate',
                candidate: event.candidate,
                target: viewerId,
                from: myId,
                isPreview: isPreview
            }));
        }
    };

    pc.onconnectionstatechange = () => {
        console.log(`🔗 Estado ${isPreview ? 'preview' : 'conexión'}:`, pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            if (isPreview) {
                previewPeerConnections.delete(viewerId);
            } else {
                peerConnections.delete(viewerId);
            }
        }
    };

    const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: false });
    await pc.setLocalDescription(offer);

    ws.send(JSON.stringify({
        type: 'offer',
        offer: offer,
        target: viewerId,
        from: myId,
        isPreview: isPreview
    }));

    if (!isPreview) {
        document.getElementById('camera-info').textContent = `📡 ${peerConnections.size} espectador(es)`;
    }
}

function stopCamera() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (ws) ws.close();
    peerConnections.forEach(pc => pc.close());
    peerConnections.clear();
    previewPeerConnections.forEach(pc => pc.close());
    previewPeerConnections.clear();
    releaseWakeLock();

    if (motionDetectionInterval) {
        clearInterval(motionDetectionInterval);
        motionDetectionInterval = null;
    }
    motionDetectionEnabled = false;
    previousFrame = null;
    document.getElementById('motion-controls').classList.add('hidden');

    document.getElementById('camera-preview').srcObject = null;
    document.getElementById('camera-info').classList.add('hidden');
    document.getElementById('start-camera-btn').classList.remove('hidden');
    document.getElementById('stop-camera-btn').classList.add('hidden');
    showStatus('camera-status', '', 'info');
    hideWakeLockStatus();
}

// ==================== VIEWER ====================
function connectViewer() {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    showStatus('viewer-status', 'Conectando...', 'info');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'authenticate', token: authToken }));
    };

    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case 'authenticated':
                ws.send(JSON.stringify({ type: 'register-viewer' }));
                showStatus('viewer-status', '✅ Conectado', 'success');
                break;

            case 'registered':
                myId = data.id;
                console.log('✅ Viewer registrado:', myId);
                document.getElementById('motion-alerts-panel').classList.remove('hidden');
                requestNotificationPermission();
                break;

            case 'camera-list':
                displayCamerasWithPreviews(data.cameras);
                break;

            case 'offer':
                await handleOffer(data.offer, data.from, data.isPreview);
                break;

            case 'ice-candidate':
                const pc = peerConnections.get(data.from) || previewPeerConnections.get(data.from);
                if (pc && data.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
                break;

            case 'camera-disconnected':
                showStatus('viewer-status', '❌ Cámara desconectada', 'error');
                backToCameraList();
                break;

            case 'motion-alert':
                handleMotionAlert(data);
                break;

            case 'session-taken':
                showStatus('viewer-status', '❌ Usuario conectado en otro dispositivo', 'error');
                setTimeout(() => {
                    disconnectViewer();
                    logout();
                }, 3000);
                break;

            case 'auth-failed':
                showStatus('viewer-status', '❌ Sesión expirada', 'error');
                setTimeout(logout, 2000);
                break;

            case 'error':
                showStatus('viewer-status', `❌ ${data.message}`, 'error');
                break;
        }
    };

    ws.onerror = () => showStatus('viewer-status', '❌ Error de conexión', 'error');
}

function displayCamerasWithPreviews(cameras) {
    const listEl = document.getElementById('cameras-list');
    listEl.classList.remove('hidden');

    console.log('📹 Cámaras disponibles:', cameras);

    if (cameras.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: #94a3b8;">No hay cámaras disponibles</p>';
        return;
    }

    listEl.innerHTML = cameras.map(cam => `
        <div class="camera-card" onclick="watchCamera('${cam.id}', '${cam.name}')">
            <h3>📹 ${cam.name}</h3>
            <p>👁️ ${cam.viewers} espectador(es)</p>
            <p style="margin-top: 5px; color: #6ee7b7;">🟢 En línea</p>
            <div class="camera-preview-container" id="preview-${cam.id}">
                <video id="preview-video-${cam.id}" class="camera-preview-video" autoplay muted playsinline></video>
                <div class="camera-preview-loading">Cargando vista previa...</div>
            </div>
        </div>
    `).join('');

    cameras.forEach(cam => requestCameraPreview(cam.id));
}

function requestCameraPreview(cameraId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
        type: 'request-preview',
        cameraId: cameraId
    }));
}

function watchCamera(cameraId, cameraName) {
    console.log('🎥 Ver cámara:', cameraId, cameraName);

    document.getElementById('cameras-list').classList.add('hidden');
    document.getElementById('viewer-video-container').classList.remove('hidden');
    document.getElementById('viewer-info').textContent = `📹 ${cameraName}`;

    ws.send(JSON.stringify({
        type: 'request-camera',
        cameraId: cameraId
    }));
}

async function handleOffer(offer, cameraId, isPreview) {
    console.log(`📥 Oferta de cámara ${isPreview ? '(preview)' : ''}:`, cameraId);

    const pc = new RTCPeerConnection(iceServers);

    if (isPreview) {
        previewPeerConnections.set(cameraId, pc);
    } else {
        peerConnections.set(cameraId, pc);
    }

    pc.ontrack = (event) => {
        console.log(`✅ Stream recibido ${isPreview ? '(preview)' : ''}:`, cameraId);

        if (isPreview) {
            const previewVideo = document.getElementById(`preview-video-${cameraId}`);
            if (previewVideo) {
                previewVideo.srcObject = event.streams[0];
                previewVideo.onloadedmetadata = () => {
                    previewVideo.play().catch(e => console.log('Error play preview:', e));
                    const loading = document.querySelector(`#preview-${cameraId} .camera-preview-loading`);
                    if (loading) loading.style.display = 'none';
                };
            }
        } else {
            const video = document.getElementById('viewer-video');
            video.srcObject = event.streams[0];
            video.onloadedmetadata = () => {
                video.play().catch(e => console.log('Error playing:', e));
            };
        }
    };

    pc.onicecandidate = (event) => {
        if (event.candidate && ws) {
            ws.send(JSON.stringify({
                type: 'ice-candidate',
                candidate: event.candidate,
                target: cameraId,
                from: myId,
                isPreview: isPreview
            }));
        }
    };

    pc.onconnectionstatechange = () => {
        console.log(`🔗 Estado ${isPreview ? 'preview' : 'conexión'}:`, pc.connectionState);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer({ offerToReceiveVideo: true, offerToReceiveAudio: false });
    await pc.setLocalDescription(answer);

    ws.send(JSON.stringify({
        type: 'answer',
        answer: answer,
        target: cameraId,
        from: myId,
        isPreview: isPreview
    }));
}

function backToCameraList() {
    peerConnections.forEach(pc => pc.close());
    peerConnections.clear();
    document.getElementById('viewer-video').srcObject = null;
    document.getElementById('viewer-video-container').classList.add('hidden');
    document.getElementById('cameras-list').classList.remove('hidden');
}

function disconnectViewer() {
    if (ws) ws.close();
    peerConnections.forEach(pc => pc.close());
    peerConnections.clear();
    previewPeerConnections.forEach(pc => pc.close());
    previewPeerConnections.clear();

    document.getElementById('viewer-video').srcObject = null;
    document.getElementById('cameras-list').classList.add('hidden');
    document.getElementById('viewer-video-container').classList.add('hidden');
    showStatus('viewer-status', '', 'info');
}

// ==================== UTILIDADES ====================
function showStatus(elementId, message, type) {
    const statusEl = document.getElementById(elementId);
    if (!statusEl) return;

    statusEl.className = `status ${type}`;
    statusEl.textContent = message;
    statusEl.style.display = message ? 'block' : 'none';
}