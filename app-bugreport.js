const BugReportMixin = {
    initBugReport() {
        this.bugReportFiles = [];
        this.bugReportSending = false;

        const btn = document.getElementById('btnBugReport');
        const modal = document.getElementById('bugReportModal');
        const form = document.getElementById('bugReportForm');
        const cancel = document.getElementById('btnCancelBugReport');
        const fileInput = document.getElementById('bugReportFiles');
        if (!btn || !modal || !form) return;

        btn.addEventListener('click', () => this.openBugReport());
        cancel.addEventListener('click', () => this.closeBugReport());
        modal.addEventListener('click', (e) => {
            if (e.target === modal && !this.bugReportSending) this.closeBugReport();
        });
        fileInput.addEventListener('change', () => {
            for (const f of Array.from(fileInput.files || [])) {
                if (!this.bugReportFiles.some(x => x.name === f.name && x.size === f.size)) this.bugReportFiles.push(f);
            }
            fileInput.value = '';
            this.renderBugReportFiles();
        });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendBugReport();
        });
    },

    openBugReport() {
        const modal = document.getElementById('bugReportModal');
        this.bugReportFiles = [];
        document.getElementById('bugReportText').value = '';
        document.getElementById('bugReportTitle').value = '';
        document.getElementById('bugReportType').value = 'bug';
        document.getElementById('bugReportIncludeProject').checked = true;
        document.getElementById('btnSendBugReport').disabled = false;
        this.bugReportSending = false;
        this.setBugReportStatus('', '');
        this.renderBugReportFiles();
        const meta = this.collectBugReportMeta();
        document.getElementById('bugReportMeta').textContent =
            `Automatisch mitgesendet: Version ${meta.version}, ${meta.browser}, Bildschirm ${meta.screen}, Projekt „${meta.projectName}“ (${meta.deviceCount} Geräte, ${meta.connectionCount} Verbindungen, ${meta.sheetCount} Arbeitsbereiche).`;
        modal.classList.add('active');
        setTimeout(() => document.getElementById('bugReportTitle').focus(), 50);
    },

    closeBugReport() {
        document.getElementById('bugReportModal').classList.remove('active');
    },

    renderBugReportFiles() {
        const list = document.getElementById('bugReportFileList');
        list.innerHTML = '';
        if (!this.bugReportFiles.length) return;
        this.bugReportFiles.forEach((f, idx) => {
            const row = document.createElement('div');
            row.className = 'bug-report-file';
            const name = document.createElement('span');
            name.textContent = `${f.name} (${this.formatBytes(f.size)})`;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = '✕';
            remove.title = 'Anhang entfernen';
            remove.addEventListener('click', () => {
                this.bugReportFiles.splice(idx, 1);
                this.renderBugReportFiles();
            });
            row.appendChild(name);
            row.appendChild(remove);
            list.appendChild(row);
        });
    },

    formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },

    setBugReportStatus(text, kind) {
        const el = document.getElementById('bugReportStatus');
        el.textContent = text;
        el.className = 'bug-report-status' + (kind ? ` ${kind}` : '');
    },

    collectBugReportMeta() {
        const sheets = this.sheets || [];
        return {
            version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?',
            browser: navigator.userAgent,
            platform: navigator.platform || '',
            language: navigator.language || '',
            screen: `${window.screen.width}×${window.screen.height}`,
            viewport: `${window.innerWidth}×${window.innerHeight}`,
            url: location.href.split('#')[0],
            standalone: !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches),
            projectName: this.projectName || 'Neues Projekt',
            projectNumber: this.projectNumber || '',
            deviceCount: sheets.reduce((n, s) => n + (s.devices ? s.devices.length : 0), 0),
            connectionCount: sheets.reduce((n, s) => n + (s.connections ? s.connections.length : 0), 0),
            sheetCount: sheets.length,
            templateCount: (this.deviceTemplates || []).length,
            dirty: !!this.isDirty,
            lastSave: this.lastSaveInfo || '',
            timestamp: new Date().toISOString()
        };
    },

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
            reader.onerror = () => reject(reader.error || new Error('Datei konnte nicht gelesen werden'));
            reader.readAsDataURL(file);
        });
    },

    async buildBugReportPayload() {
        const type = document.getElementById('bugReportType').value;
        const title = document.getElementById('bugReportTitle').value.trim();
        const text = document.getElementById('bugReportText').value.trim();
        const email = document.getElementById('bugReportEmail').value.trim();
        const includeProject = document.getElementById('bugReportIncludeProject').checked;

        const attachments = [];
        let total = 0;
        for (const f of this.bugReportFiles) {
            total += f.size;
            attachments.push({ name: f.name, type: f.type || 'application/octet-stream', size: f.size, data: await this.readFileAsBase64(f) });
        }
        if (includeProject) {
            const json = JSON.stringify(this.serializeDiagram(), null, 2);
            const bytes = new TextEncoder().encode(json);
            total += bytes.length;
            let b64 = '';
            for (let i = 0; i < bytes.length; i += 0x8000) b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
            attachments.push({ name: this.buildFileName('ict'), type: 'application/json', size: bytes.length, data: btoa(b64) });
        }
        const limit = (typeof BUG_REPORT_CONFIG !== 'undefined' && BUG_REPORT_CONFIG.maxTotalBytes) || 5 * 1024 * 1024;
        if (total > limit) throw new Error(`Anhänge sind zu groß (${this.formatBytes(total)}, erlaubt ${this.formatBytes(limit)}). Bitte Anhänge entfernen oder den Projektstand abwählen.`);

        return { type, title, text, email, meta: this.collectBugReportMeta(), attachments };
    },

    async sendBugReport() {
        if (this.bugReportSending) return;
        const title = document.getElementById('bugReportTitle').value.trim();
        const text = document.getElementById('bugReportText').value.trim();
        if (!title && !text) {
            this.setBugReportStatus('Bitte einen Betreff oder eine Beschreibung eingeben.', 'error');
            return;
        }
        if (text.length < 10 && !title) {
            this.setBugReportStatus('Bitte beschreiben Sie das Problem etwas genauer.', 'error');
            return;
        }

        const btn = document.getElementById('btnSendBugReport');
        this.bugReportSending = true;
        btn.disabled = true;
        this.setBugReportStatus('Meldung wird vorbereitet ...', '');

        try {
            const payload = await this.buildBugReportPayload();
            const endpoint = (typeof BUG_REPORT_CONFIG !== 'undefined' && BUG_REPORT_CONFIG.endpoint || '').trim();
            if (!endpoint) {
                this.fallbackBugReport(payload);
                return;
            }
            this.setBugReportStatus('Meldung wird gesendet ...', '');
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            let result = {};
            try { result = await res.json(); } catch (e) { /* keine JSON-Antwort */ }
            if (!res.ok || result.ok === false) {
                throw new Error(result.error || `Server antwortete mit Status ${res.status}`);
            }
            const ref = result.id ? ` Referenz: ${result.id}.` : '';
            this.setBugReportStatus(`Vielen Dank! Ihre Meldung wurde übermittelt.${ref}`, 'success');
            btn.disabled = true;
            setTimeout(() => this.closeBugReport(), 2500);
        } catch (err) {
            console.error('Bug-Report fehlgeschlagen:', err);
            this.setBugReportStatus(`Senden fehlgeschlagen: ${err.message || err}. Sie können die Meldung alternativ als Datei speichern.`, 'error');
            this.offerBugReportDownload();
        } finally {
            this.bugReportSending = false;
            if (!document.getElementById('bugReportStatus').classList.contains('success')) btn.disabled = false;
        }
    },

    offerBugReportDownload() {
        const status = document.getElementById('bugReportStatus');
        if (status.querySelector('button')) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'bug-report-inline-btn';
        b.textContent = 'Meldung als Datei speichern';
        b.addEventListener('click', async () => {
            try {
                const payload = await this.buildBugReportPayload();
                this.fallbackBugReport(payload);
            } catch (err) {
                this.setBugReportStatus(`Speichern fehlgeschlagen: ${err.message || err}`, 'error');
            }
        });
        status.appendChild(document.createTextNode(' '));
        status.appendChild(b);
    },

    fallbackBugReport(payload) {
        const stamp = payload.meta.timestamp.replace(/[:.]/g, '-').slice(0, 19);
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bugreport_${stamp}.json`;
        a.click();
        URL.revokeObjectURL(url);

        const to = (typeof BUG_REPORT_CONFIG !== 'undefined' && BUG_REPORT_CONFIG.fallbackEmail) || '';
        const typeLabel = { bug: 'Fehler', improvement: 'Verbesserung', question: 'Frage' }[payload.type] || payload.type;
        const subject = encodeURIComponent(`[Blockschaltbild ${payload.meta.version}] ${typeLabel}: ${payload.title || payload.text.slice(0, 60)}`);
        const body = encodeURIComponent(
            `${payload.text}\n\n— Bitte die soeben heruntergeladene Datei bugreport_${stamp}.json anhängen —\n\n` +
            `Version: ${payload.meta.version}\nBrowser: ${payload.meta.browser}\nProjekt: ${payload.meta.projectName}`
        );
        if (to) window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self');
        this.setBugReportStatus('Kein Sende-Dienst konfiguriert: Die Meldung wurde als Datei gespeichert und ein E-Mail-Entwurf geöffnet. Bitte die Datei an die E-Mail anhängen.', 'success');
        document.getElementById('btnSendBugReport').disabled = true;
    }
};
