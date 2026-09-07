(function () {
    let deferredPrompt = null;

    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    function updateInstallButton() {
        const btn = document.getElementById('btnInstallApp');
        if (!btn) return;
        if (isStandalone()) {
            btn.textContent = 'Als App installiert';
            btn.disabled = true;
            btn.title = 'Der Blockschaltbild Editor läuft bereits als installierte App.';
            return;
        }
        btn.disabled = false;
        btn.textContent = 'Als App installieren...';
    }

    function browserHint() {
        const ua = navigator.userAgent;
        const isMac = /Mac/.test(navigator.platform);
        if (/Edg\//.test(ua)) {
            return 'Microsoft Edge: Klicken Sie in der Adressleiste auf das App-Symbol (rechts) oder öffnen Sie das Menü „…" → „Apps" → „Diese Seite als App installieren".';
        }
        if (/Chrome\//.test(ua) && !/OPR\//.test(ua)) {
            return (navigator.brave ? 'Brave' : 'Google Chrome') + ': Klicken Sie in der Adressleiste rechts auf das Symbol „Installieren" (Monitor mit Pfeil) oder öffnen Sie das Menü „⋮" → „Speichern und teilen" bzw. „Apps" → „Blockschaltbild Editor installieren".';
        }
        if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) {
            return isMac
                ? 'Safari: Menü „Ablage" → „Zum Dock hinzufügen…".'
                : 'Safari (iOS/iPadOS): Teilen-Symbol → „Zum Home-Bildschirm".';
        }
        if (/Firefox\//.test(ua)) {
            return 'Firefox unterstützt die App-Installation auf dem Desktop nicht. Bitte verwenden Sie Google Chrome, Brave oder Microsoft Edge.';
        }
        return 'Bitte verwenden Sie Google Chrome, Brave oder Microsoft Edge und wählen Sie dort „App installieren".';
    }

    function showManualHint() {
        const secure = window.isSecureContext;
        const lines = [];
        if (!secure) {
            lines.push('Die Installation als App ist nur über HTTPS (oder localhost) möglich.');
            lines.push('Bitte öffnen Sie die Online-Version des Tools.');
        } else {
            lines.push('Der Browser hat noch keine Installations-Aufforderung bereitgestellt.');
            lines.push('');
            lines.push(browserHint());
            lines.push('');
            lines.push('Hinweis: Wurde die App bereits installiert, wird die Option nicht erneut angeboten. Wurde sie kürzlich abgelehnt, blendet der Browser sie für einige Zeit aus.');
        }
        alert(lines.join('\n'));
    }

    async function requestInstall() {
        if (isStandalone()) return;
        if (!deferredPrompt) {
            showManualHint();
            return;
        }
        const promptEvent = deferredPrompt;
        deferredPrompt = null;
        try {
            promptEvent.prompt();
            await promptEvent.userChoice;
        } catch (err) {
            console.warn('Installations-Dialog konnte nicht angezeigt werden:', err);
        }
        updateInstallButton();
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        updateInstallButton();
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        updateInstallButton();
    });

    window.matchMedia('(display-mode: standalone)').addEventListener('change', updateInstallButton);

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.warn('Service Worker konnte nicht registriert werden:', err);
            });
        });
    }

    function handleLaunchFiles() {
        if (!('launchQueue' in window)) return;
        window.launchQueue.setConsumer(async (launchParams) => {
            if (!launchParams.files || !launchParams.files.length) return;
            const handle = launchParams.files[0];
            try {
                const file = await handle.getFile();
                const editor = window.editor;
                if (editor && typeof editor.loadDiagram === 'function') {
                    editor.loadDiagram({ target: { files: [file], value: '' } });
                }
            } catch (err) {
                console.warn('Datei konnte nicht geöffnet werden:', err);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('btnInstallApp');
        if (btn) btn.addEventListener('click', requestInstall);
        updateInstallButton();
        handleLaunchFiles();
    });

    registerServiceWorker();
})();
