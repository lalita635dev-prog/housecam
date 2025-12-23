// Script para manejar la instalación de la PWA
let deferredPrompt;
let installButton;

// Detectar si ya está instalada
function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Inicializar PWA
window.addEventListener('DOMContentLoaded', () => {
  // Registrar Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Verificar actualizaciones cada hora
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error('❌ Error al registrar Service Worker:', error);
      });
  }

  // Crear botón de instalación si no está instalada
  if (!isAppInstalled()) {
    createInstallButton();
  } else {
    console.log('✅ PWA ya instalada');
  }
});

// Capturar evento beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 Evento beforeinstallprompt capturado');
  e.preventDefault();
  deferredPrompt = e;
  
  // Mostrar botón de instalación
  if (installButton) {
    installButton.style.display = 'block';
  }
});

// Crear botón de instalación
function createInstallButton() {
  // Verificar si ya existe
  if (document.getElementById('pwa-install-button')) {
    return;
  }

  installButton = document.createElement('button');
  installButton.id = 'pwa-install-button';
  installButton.innerHTML = '📱 Instalar App';
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: #38bdf8;
    color: #0f172a;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4);
    z-index: 9999;
    display: none;
    transition: transform 0.2s, box-shadow 0.2s;
  `;

  installButton.addEventListener('mouseover', () => {
    installButton.style.transform = 'scale(1.05)';
    installButton.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.6)';
  });

  installButton.addEventListener('mouseout', () => {
    installButton.style.transform = 'scale(1)';
    installButton.style.boxShadow = '0 4px 15px rgba(56, 189, 248, 0.4)';
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      console.log('❌ No hay prompt disponible');
      return;
    }

    // Mostrar prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`👤 Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
    
    if (outcome === 'accepted') {
      installButton.style.display = 'none';
    }
    
    deferredPrompt = null;
  });

  document.body.appendChild(installButton);
}

// Detectar cuando la app es instalada
window.addEventListener('appinstalled', () => {
  console.log('🎉 PWA instalada exitosamente');
  if (installButton) {
    installButton.style.display = 'none';
  }
  deferredPrompt = null;
});

// Detectar modo standalone
if (isAppInstalled()) {
  console.log('🚀 Ejecutando en modo standalone (PWA instalada)');
  document.body.classList.add('standalone-mode');
}

// Manejar cambios en el modo de visualización
window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
  if (e.matches) {
    console.log('🚀 Cambiado a modo standalone');
    document.body.classList.add('standalone-mode');
  } else {
    console.log('🌐 Cambiado a modo navegador');
    document.body.classList.remove('standalone-mode');
  }
});