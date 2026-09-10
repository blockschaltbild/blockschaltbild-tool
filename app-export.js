const ExportMixin = {
    downloadExcelTemplate() {
        if (typeof XLSX === 'undefined') {
            alert('Excel-Bibliothek nicht geladen. Bitte Internetverbindung prüfen.');
            return;
        }
        const header = ['Name', 'Artikelnummer', 'Typ', 'Gruppe', 'Farbe', 'Eingänge', 'Ausgänge'];
        const rows = [
            header,
            ['Yamaha CL5', 'CL5', 'Digital Mixer', 'Ton', '', 'IN 1:XLR, IN 2:XLR, IN 3:XLR', 'MAIN L:XLR, MAIN R:XLR'],
            ['Barco E2', 'E2', 'Video Processor', 'Video', '', 'SDI 1:SDI, HDMI 1:HDMI', 'SDI OUT 1:SDI'],
            ['', '', '', '', '', '', '']
        ];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 45 }, { wch: 45 }];
        
        const info = XLSX.utils.aoa_to_sheet([
            ['Hinweise zur Vorlage'],
            [''],
            ['Name', 'Pflichtfeld – Gerätebezeichnung'],
            ['Artikelnummer', 'Optional'],
            ['Typ', 'Optional, z. B. Digital Mixer'],
            ['Gruppe', 'Gruppenname oder Gruppen-ID: ' + this.groups.map(g => `${g.name} (${g.id})`).join(', ')],
            ['Farbe', 'Optional als Hex-Wert (#3498db). Leer = Farbe der Gruppe wird übernommen.'],
            ['Eingänge', 'Kommagetrennt, Kabeltyp optional nach Doppelpunkt: IN 1:XLR, IN 2:XLR'],
            ['Ausgänge', 'Kommagetrennt, Kabeltyp optional nach Doppelpunkt: MAIN L:XLR'],
            [''],
            ['Kabeltypen', this.cableTypes.join(', ')],
            [''],
            ['Import', 'Über "Geräte importieren" die ausgefüllte Datei auswählen.']
        ]);
        info['!cols'] = [{ wch: 18 }, { wch: 90 }];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Geräte');
        XLSX.utils.book_append_sheet(wb, info, 'Hinweise');
        XLSX.writeFile(wb, 'Geraete_Vorlage.xlsx');
    },

    showExportModal() {
        document.getElementById('exportModal').classList.add('active');
        this.renderExportGroupsList();
    },

    hideExportModal() {
        document.getElementById('exportModal').classList.remove('active');
    },

    renderExportGroupsList() {
        const list = document.getElementById('exportGroupsList');
        list.innerHTML = '';
        this.groups.forEach(group => {
            const templates = this.deviceTemplates.filter(t => t.group === group.id);
            const div = document.createElement('div');
            div.className = 'manage-item';
            div.innerHTML = `
                <div class="manage-color" style="background:${group.color}"></div>
                <div class="manage-main">
                    <div class="manage-name">${group.name}</div>
                    <div class="manage-meta">${templates.length} Geräte</div>
                </div>
                <button type="button" class="btn-add-canvas">Exportieren</button>
            `;
            const btn = div.querySelector('.btn-add-canvas');
            if (templates.length === 0) btn.disabled = true;
            btn.addEventListener('click', () => {
                this.exportDevicesExcel(templates, `Geraete_${group.name}`);
            });
            list.appendChild(div);
        });
    },

    deviceExportRow(t) {
        const group = this.groups.find(g => g.id === t.group);
        const ports = (names, cables) => (names || [])
            .map((n, i) => (cables && cables[i] ? `${n}:${cables[i]}` : n))
            .join(', ');
        return [
            t.name,
            t.article || '',
            t.type || '',
            group ? group.name : 'Sonstiges',
            t.color || (group ? group.color : ''),
            ports(t.inputs, t.inputCables),
            ports(t.outputs, t.outputCables)
        ];
    },

    deviceExportSheet(templates) {
        const header = ['Name', 'Artikelnummer', 'Typ', 'Gruppe', 'Farbe', 'Eingänge', 'Ausgänge'];
        const ws = XLSX.utils.aoa_to_sheet([header, ...templates.map(t => this.deviceExportRow(t))]);
        ws['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 45 }, { wch: 45 }];
        return ws;
    },

    sanitizeFileName(name) {
        return String(name).replace(/[^\wäöüÄÖÜß\- ]/g, '').trim().replace(/\s+/g, '_') || 'Export';
    },

    exportDevicesExcel(templates, fileName) {
        if (typeof XLSX === 'undefined') {
            alert('Excel-Bibliothek nicht geladen. Bitte Internetverbindung prüfen.');
            return;
        }
        if (!templates || templates.length === 0) {
            alert('Keine Geräte zum Exportieren vorhanden.');
            return;
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, this.deviceExportSheet(templates), 'Geräte');
        XLSX.writeFile(wb, `${this.sanitizeFileName(fileName)}.xlsx`);
    },

    exportDevicesByGroups() {
        if (typeof XLSX === 'undefined') {
            alert('Excel-Bibliothek nicht geladen. Bitte Internetverbindung prüfen.');
            return;
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, this.deviceExportSheet(this.deviceTemplates), 'Alle Geräte');
        let added = 0;
        this.groups.forEach(group => {
            const templates = this.deviceTemplates.filter(t => t.group === group.id);
            if (templates.length === 0) return;
            const sheetName = this.sanitizeFileName(group.name).slice(0, 31);
            XLSX.utils.book_append_sheet(wb, this.deviceExportSheet(templates), sheetName);
            added++;
        });
        if (added === 0) {
            alert('Keine Geräte zum Exportieren vorhanden.');
            return;
        }
        XLSX.writeFile(wb, `${this.sanitizeFileName(this.projectName)}_Geraete_Gruppen.xlsx`);
    },

    importExcelDevices(file) {
        if (typeof XLSX === 'undefined') {
            alert('Excel-Bibliothek nicht geladen. Bitte Internetverbindung prüfen.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const wb = XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
                const sheetName = wb.SheetNames.find(n => n.toLowerCase().startsWith('gerät') || n.toLowerCase().startsWith('geraet')) || wb.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
                let count = 0;
                rows.forEach(row => {
                    const get = (...keys) => {
                        for (const key of keys) {
                            const found = Object.keys(row).find(k => k.toLowerCase().trim() === key);
                            if (found && String(row[found]).trim()) return String(row[found]).trim();
                        }
                        return '';
                    };
                    const name = get('name', 'gerät', 'geraet');
                    if (!name) return;
                    const groupValue = get('gruppe', 'group');
                    const group = this.groups.find(g => g.id.toLowerCase() === groupValue.toLowerCase() || g.name.toLowerCase() === groupValue.toLowerCase());
                    const inputs = this.parsePortList(get('eingänge', 'eingaenge', 'inputs'));
                    const outputs = this.parsePortList(get('ausgänge', 'ausgaenge', 'outputs'));
                    this.addDeviceTemplate({
                        name: name,
                        article: get('artikelnummer', 'artikelnr', 'article'),
                        type: get('typ', 'type'),
                        group: group ? group.id : 'other',
                        color: get('farbe', 'color'),
                        inputs: inputs.names,
                        outputs: outputs.names,
                        inputCables: inputs.cables,
                        outputCables: outputs.cables
                    });
                    count++;
                });
                alert(count > 0 ? `${count} Gerät(e) importiert.` : 'Keine Geräte gefunden. Bitte Spalte "Name" prüfen.');
            } catch (err) {
                alert('Fehler beim Excel-Import: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    },

    serializeDiagram() {
        this.storeActiveSheet();
        return {
            sheets: this.sheets.map(s => ({ id: s.id, name: s.name, devices: s.devices, connections: s.connections, textboxes: s.textboxes || [] })),
            activeSheet: this.activeSheet,
            lineStyle: this.lineStyle,
            gridSize: this.gridSize,
            gridVisible: this.gridVisible,
            snapToGrid: this.snapToGrid,
            projectName: this.projectName,
            projectNumber: this.projectNumber,
            eventFrom: this.eventFrom,
            eventTo: this.eventTo,
            eventLocation: this.eventLocation,
            projectAuthor: this.projectAuthor,
            devices: this.devices,
            connections: this.connections,
            templates: this.deviceTemplates,
            groups: this.groups,
            cableTypes: this.cableTypes
        };
    },

    saveDiagram() {
        const data = this.serializeDiagram();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.buildFileName('ict');
        a.click();
        URL.revokeObjectURL(url);
        this.markSaved(`Datei ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`);
        if (window.cloudSync && typeof window.cloudSync.onLocalSave === 'function') window.cloudSync.onLocalSave();
    },

    buildFileName(ext, suffix = '') {
        const now = new Date();
        const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
        const baseName = (this.projectNumber || '').trim() || this.projectName;
        const safeName = baseName.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '_');
        return `${safeName}_${dateStr}${suffix ? '_' + suffix : ''}.${ext}`;
    },

    projectSnapshot() {
        const data = this.serializeDiagram();
        delete data.templates;
        delete data.groups;
        delete data.cableTypes;
        return JSON.stringify(data);
    },

    initSaveStatus() {
        this.savedSnapshot = this.projectSnapshot();
        this.lastSaveInfo = '';
        this.isDirty = false;
        this.updateSaveStatus();
        if (this.dirtyCheckTimer) clearInterval(this.dirtyCheckTimer);
        this.dirtyCheckTimer = setInterval(() => this.checkDirty(), 1500);
        window.addEventListener('beforeunload', (e) => {
            this.checkDirty();
            if (this.isDirty) { e.preventDefault(); e.returnValue = ''; }
        });
    },

    markSaved(info) {
        this.savedSnapshot = this.projectSnapshot();
        this.lastSaveInfo = info || '';
        this.isDirty = false;
        this.updateSaveStatus();
    },

    checkDirty() {
        if (this.savedSnapshot === undefined) return;
        try {
            const dirty = this.projectSnapshot() !== this.savedSnapshot;
            if (dirty !== this.isDirty) {
                this.isDirty = dirty;
                this.updateSaveStatus();
            }
        } catch (err) {
            console.warn('Änderungsprüfung fehlgeschlagen:', err);
        }
    },

    updateSaveStatus() {
        const el = document.getElementById('saveStatus');
        if (!el) return;
        if (this.isDirty) {
            el.textContent = '● Ungespeicherte Änderungen';
            el.title = 'Es gibt Änderungen, die noch nicht gespeichert wurden (Datei → Speichern oder Autosave)';
            el.classList.add('dirty');
        } else {
            el.textContent = this.lastSaveInfo ? `Gespeichert (${this.lastSaveInfo})` : 'Keine ungespeicherten Änderungen';
            el.title = 'Alle Änderungen sind gespeichert';
            el.classList.remove('dirty');
        }
    },

    loadAutosaveSettings() {
        this.autosaveEnabled = true;
        this.autosaveMinutes = 5;
        try {
            const raw = localStorage.getItem(this.autosaveSettingsKey);
            if (raw) {
                const s = JSON.parse(raw);
                if (typeof s.enabled === 'boolean') this.autosaveEnabled = s.enabled;
                const m = parseInt(s.minutes);
                if (m >= 1 && m <= 120) this.autosaveMinutes = m;
            }
        } catch (err) {
            console.warn('Autosave-Einstellungen konnten nicht gelesen werden:', err);
        }
        const chk = document.getElementById('chkAutosave');
        const inp = document.getElementById('autosaveMinutes');
        if (chk) chk.checked = this.autosaveEnabled;
        if (inp) inp.value = this.autosaveMinutes;
        this.restartAutosaveTimer();
        this.updateAutosaveStatus();
    },

    setAutosave(enabled, minutes) {
        this.autosaveEnabled = !!enabled;
        const m = parseInt(minutes);
        if (m >= 1 && m <= 120) this.autosaveMinutes = m;
        try {
            localStorage.setItem(this.autosaveSettingsKey, JSON.stringify({ enabled: this.autosaveEnabled, minutes: this.autosaveMinutes }));
        } catch (err) {
            console.warn('Autosave-Einstellungen konnten nicht gespeichert werden:', err);
        }
        this.restartAutosaveTimer();
        this.updateAutosaveStatus();
    },

    restartAutosaveTimer() {
        if (this.autosaveTimer) clearInterval(this.autosaveTimer);
        this.autosaveTimer = null;
        if (!this.autosaveEnabled) return;
        this.autosaveTimer = setInterval(() => this.runAutosave(), this.autosaveMinutes * 60 * 1000);
    },

    runAutosave() {
        if (!this.autosaveEnabled) return;
        try {
            const data = this.serializeDiagram();
            data.autosavedAt = new Date().toISOString();
            localStorage.setItem(this.autosaveDataKey, JSON.stringify(data));
            this.lastAutosaveAt = new Date();
            this.updateAutosaveStatus();
            this.markSaved(`Autosave ${this.lastAutosaveAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`);
        } catch (err) {
            console.warn('Autosave fehlgeschlagen:', err);
        }
    },

    updateAutosaveStatus() {
        const el = document.getElementById('autosaveStatus');
        if (!el) return;
        if (!this.autosaveEnabled) {
            el.textContent = 'Autosave ist deaktiviert';
        } else if (this.lastAutosaveAt) {
            const t = this.lastAutosaveAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            el.textContent = `Zuletzt automatisch gesichert: ${t}`;
        } else {
            el.textContent = `Autosave alle ${this.autosaveMinutes} Min. (lokal im Browser)`;
        }
    },

    async restoreAutosave() {
        let data = null;
        try {
            const raw = localStorage.getItem(this.autosaveDataKey);
            if (raw) data = JSON.parse(raw);
        } catch (err) {
            console.warn('Autosave konnte nicht gelesen werden:', err);
        }
        if (!data) {
            alert('Keine automatische Sicherung vorhanden.');
            return;
        }
        const when = data.autosavedAt ? new Date(data.autosavedAt).toLocaleString('de-DE') : 'unbekannt';
        const name = data.projectName || 'Unbenannt';
        if (!confirm(`Automatische Sicherung wiederherstellen?\n\nProjekt: ${name}\nGesichert: ${when}\n\nDas aktuelle Diagramm wird ersetzt.`)) return;
        this.showLoading('Sicherung wird wiederhergestellt ...', 5, `Projekt „${name}"`);
        this.recordHistory();
        try {
            await this.nextFrame();
            await this.applyDiagramData(data);
        } catch (err) {
            this.hideLoading();
            alert('Fehler beim Wiederherstellen: ' + err.message);
        }
    },

    loadDiagram(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const sizeKb = Math.round(file.size / 1024);
        this.showLoading('Projekt wird geladen …', 2, `Datei „${file.name}“ (${sizeKb} KB) wird gelesen`);
        const reader = new FileReader();
        reader.onerror = () => {
            this.hideLoading();
            alert('Fehler beim Laden: Datei konnte nicht gelesen werden.');
        };
        reader.onload = async (event) => {
            try {
                this.updateLoading('Projekt wird geladen ...', 8, 'Projektdaten werden analysiert');
                await this.nextFrame();
                const data = JSON.parse(event.target.result);
                if (this.readOnly) this.setReadOnly(false);
                this.recordHistory();
                await this.applyDiagramData(data);
                if (window.cloudSync && typeof window.cloudSync.markNewProject === 'function') window.cloudSync.markNewProject();
            } catch (err) {
                this.hideLoading();
                alert('Fehler beim Laden: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    },

    async applyDiagramData(data) {
        this.historySuspended = true;
        try {
            await this.applyDiagramDataInner(data);
        } finally {
            this.historySuspended = false;
        }
    },

    async applyDiagramDataInner(data) {
        this.devices = [];
        this.connections = [];
        this.devicesLayer.innerHTML = '';
        this.connectionsLayer.innerHTML = '';
        
        if (data.projectName) {
            this.projectName = data.projectName;
            document.getElementById('projectName').value = data.projectName;
        }
        if (data.projectNumber) {
            this.projectNumber = data.projectNumber;
            document.getElementById('projectNumber').value = data.projectNumber;
        }
        this.eventFrom = data.eventFrom || '';
        this.eventTo = data.eventTo || '';
        this.eventLocation = data.eventLocation || '';
        this.projectAuthor = data.projectAuthor || '';
        this.updateProjectDisplay();
        
        this.updateLoading('Projekt wird geladen …', 12, 'Bibliothek wird abgeglichen');
        await this.nextFrame();
        const merged = this.mergeIntoLibrary(data);
        
        if (data.lineStyle) {
            this.lineStyle = data.lineStyle;
            document.getElementById('selLineStyle').value = data.lineStyle;
        }
        if (data.gridSize) {
            this.gridSize = data.gridSize;
            document.getElementById('gridSizeInput').value = data.gridSize;
        }
        if (typeof data.gridVisible === 'boolean') {
            this.gridVisible = data.gridVisible;
            document.getElementById('chkGridVisible').checked = data.gridVisible;
        }
        if (typeof data.snapToGrid === 'boolean') {
            this.snapToGrid = data.snapToGrid;
            document.getElementById('chkSnapGrid').checked = data.snapToGrid;
        }
        this.updateGrid();
        
        if (data.sheets && data.sheets.length > 0) {
            this.sheets = data.sheets.map((s, i) => ({
                id: s.id || (i + 1),
                name: s.name || `Blatt ${i + 1}`,
                devices: s.devices || [],
                connections: s.connections || [],
                textboxes: s.textboxes || []
            }));
        } else {
            this.sheets = [{ id: 1, name: 'Blatt 1', devices: data.devices || [], connections: data.connections || [], textboxes: data.textboxes || [] }];
        }
        this.nextSheetId = Math.max(0, ...this.sheets.map(s => parseInt(s.id) || 0)) + 1;
        
        const allDevices = this.sheets.reduce((a, s) => a.concat(s.devices), []);
        const allConnections = this.sheets.reduce((a, s) => a.concat(s.connections), []);
        const allTextboxes = this.sheets.reduce((a, s) => a.concat(s.textboxes), []);
        this.nextDeviceId = Math.max(0, ...allDevices.map(d => parseInt(String(d.id).split('-')[1]) || 0)) + 1;
        this.nextConnectionId = Math.max(0, ...allConnections.map(c => parseInt(String(c.id).split('-')[1]) || 0)) + 1;
        this.nextTextboxId = Math.max(0, ...allTextboxes.map(t => parseInt(String(t.id).split('-')[1]) || 0)) + 1;
        
        let active = typeof data.activeSheet === 'number' ? data.activeSheet : 0;
        if (active < 0 || active >= this.sheets.length) active = 0;
        const sheetName = this.sheets[active].name;
        await this.activateSheetAsync(active, (done, total, label) => {
            const pct = 15 + (done / Math.max(1, total)) * 75;
            this.updateLoading(`Blatt „${sheetName}“ wird aufgebaut …`, pct, label);
        });
        const messages = [];
        if (merged && (merged.templates || merged.groups || merged.cables)) {
            const mParts = [];
            if (merged.templates) mParts.push(`${merged.templates} Gerät(e)`);
            if (merged.groups) mParts.push(`${merged.groups} Gruppe(n)`);
            if (merged.cables) mParts.push(`${merged.cables} Kabeltyp(en)`);
            messages.push('Neu in die zentrale Bibliothek übernommen:\n' + mParts.join(', '));
        }
        if (this.autoConverter) {
            this.updateLoading('Projekt wird geladen …', 92, 'Signalprüfung läuft');
            await this.nextFrame();
            const res = this.validateConnections(true);
            if (res.inserted || res.removed || res.blocked) {
                const parts = [];
                if (res.inserted) parts.push(`${res.inserted} fehlende(r) Konverter eingefügt`);
                if (res.removed) parts.push(`${res.removed} überflüssige(r) Konverter entfernt`);
                if (res.blocked) parts.push(`${res.blocked} Verbindung(en) ohne passenden Konverter`);
                messages.push('Signalprüfung nach dem Laden:\n' + parts.join('\n'));
            }
        }
        this.updateLoading('Projekt geladen', 100, `${this.devices.length} Geräte, ${this.connections.length} Verbindungen`);
        await this.nextFrame();
        this.hideLoading();
        this.markSaved(`geladen ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`);
        if (messages.length) alert(messages.join('\n\n'));
    },

    inlineComputedStyles(liveRoot, cloneRoot) {
        const props = [
            'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity',
            'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity',
            'font-family', 'font-size', 'font-weight', 'font-style',
            'text-anchor', 'dominant-baseline', 'letter-spacing',
            'marker-start', 'marker-mid', 'marker-end', 'rx', 'ry', 'display', 'visibility'
        ];
        const liveNodes = [liveRoot].concat(Array.from(liveRoot.querySelectorAll('*')));
        const cloneNodes = [cloneRoot].concat(Array.from(cloneRoot.querySelectorAll('*')));
        if (liveNodes.length !== cloneNodes.length) return;

        for (let i = 0; i < liveNodes.length; i++) {
            const computed = getComputedStyle(liveNodes[i]);
            let declarations = '';
            props.forEach(prop => {
                const value = computed.getPropertyValue(prop);
                if (value) declarations += prop + ':' + value + ';';
            });
            cloneNodes[i].setAttribute('style', declarations);
        }
    },

    applyMonochromeDevices(cloneRoot) {
        cloneRoot.querySelectorAll('.device-block rect.body').forEach(rect => {
            rect.style.fill = '#ffffff';
            rect.style.stroke = '#000000';
            rect.style.strokeWidth = '1.5';
        });
        cloneRoot.querySelectorAll('.device-block text').forEach(text => {
            text.style.fill = '#000000';
            text.style.fillOpacity = '1';
        });
        cloneRoot.querySelectorAll('.port circle').forEach(circle => {
            circle.style.fill = '#ffffff';
            circle.style.stroke = '#000000';
        });
        cloneRoot.querySelectorAll('.port text').forEach(text => {
            text.style.fill = '#000000';
            text.style.fillOpacity = '1';
        });
        cloneRoot.querySelectorAll('.device-block.placeholder rect.body').forEach(rect => {
            rect.style.strokeWidth = '3';
            rect.style.strokeDasharray = '8 5';
        });
        cloneRoot.querySelectorAll('.device-block.placeholder text.placeholder-badge').forEach(text => {
            text.style.fill = '#000000';
            text.style.fillOpacity = '1';
        });
    },

    matchArrowheadsToLines(clone) {
        const template = clone.querySelector('#arrowhead');
        const defs = clone.querySelector('defs');
        if (!template || !defs) return;
        const livePaths = this.svg.querySelectorAll('path.connection');
        const markers = {};
        clone.querySelectorAll('path.connection').forEach((path, i) => {
            const live = livePaths[i];
            const color = live ? getComputedStyle(live).stroke : path.style.stroke;
            if (!color) return;
            if (!markers[color]) {
                const id = 'arrowhead-export-' + Object.keys(markers).length;
                const marker = template.cloneNode(true);
                marker.setAttribute('id', id);
                const poly = marker.querySelector('polygon');
                if (poly) poly.setAttribute('fill', color);
                defs.appendChild(marker);
                markers[color] = id;
            }
            path.style.markerEnd = `url(#${markers[color]})`;
        });
    },

    isMonochromeExport() {
        const chk = document.getElementById('chkExportMono');
        return !!(chk && chk.checked);
    },

    async renderDiagramPNG(view, targetPixelWidth = 4000, options = {}) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const selected = Array.from(this.svg.querySelectorAll('.selected'));
        selected.forEach(el => el.classList.remove('selected'));

        const clone = this.svg.cloneNode(true);
        this.inlineComputedStyles(this.svg, clone);

        selected.forEach(el => el.classList.add('selected'));

        ['handles-layer', 'preview-layer', 'grid-rect'].forEach(id => {
            const el = clone.querySelector('#' + id);
            if (el) el.remove();
        });
        clone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        if (options.monochrome) {
            this.matchArrowheadsToLines(clone);
            this.applyMonochromeDevices(clone);
        }

        clone.setAttribute('xmlns', svgNS);
        clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        clone.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);
        clone.setAttribute('width', view.width);
        clone.setAttribute('height', view.height);
        clone.removeAttribute('style');
        clone.removeAttribute('class');

        const style = document.createElementNS(svgNS, 'style');
        style.textContent = 'svg{font-family:Arial,Helvetica,sans-serif;}';
        clone.insertBefore(style, clone.firstChild);

        const bg = document.createElementNS(svgNS, 'rect');
        bg.setAttribute('x', view.x);
        bg.setAttribute('y', view.y);
        bg.setAttribute('width', view.width);
        bg.setAttribute('height', view.height);
        bg.setAttribute('fill', '#ffffff');
        clone.insertBefore(bg, style.nextSibling);

        const svgText = new XMLSerializer().serializeToString(clone);
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
        const img = await new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => reject(new Error('SVG konnte nicht gerendert werden'));
            im.src = url;
        });

        const maxPixels = 30000000;
        let ppu = targetPixelWidth / view.width;
        if (view.width * view.height * ppu * ppu > maxPixels) {
            ppu = Math.sqrt(maxPixels / (view.width * view.height));
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(view.width * ppu));
        canvas.height = Math.max(1, Math.round(view.height * ppu));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    },

    async renderLogoPNG(targetPixelWidth = 1200) {
        if (typeof ICT_LOGO_DATA_URL === 'undefined') return null;
        try {
            const img = await new Promise((resolve, reject) => {
                const im = new Image();
                im.onload = () => resolve(im);
                im.onerror = () => reject(new Error('Logo konnte nicht geladen werden'));
                im.src = ICT_LOGO_DATA_URL;
            });
            const aspect = typeof ICT_LOGO_ASPECT !== 'undefined' ? ICT_LOGO_ASPECT : img.height / img.width;
            const canvas = document.createElement('canvas');
            canvas.width = targetPixelWidth;
            canvas.height = Math.round(targetPixelWidth * aspect);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/png');
        } catch (err) {
            return null;
        }
    },

    showPdfExportModal(mode = 'plan') {
        this.storeActiveSheet();
        this.pdfExportMode = mode;
        const isLists = mode === 'lists';
        document.getElementById('pdfExportTitle').textContent = isLists ? 'Listen als PDF exportieren' : 'Plan als PDF exportieren';
        document.getElementById('pdfExportHint').textContent = isLists
            ? 'Wählen Sie die Arbeitsbereiche, für die je eine Geräte- und Kabelliste erstellt werden soll.'
            : 'Wählen Sie die Arbeitsbereiche, die als Seiten in das PDF (A1 Querformat) aufgenommen werden sollen.';
        document.getElementById('pdfExportMonoRow').style.display = isLists ? 'none' : '';
        document.getElementById('pdfExportSummaryRow').style.display = isLists ? '' : 'none';
        const list = document.getElementById('pdfExportSheetList');
        list.innerHTML = '';
        this.sheets.forEach((sheet, idx) => {
            const label = document.createElement('label');
            label.className = 'manage-item pdf-sheet-item';
            const count = (sheet.devices || []).length;
            label.innerHTML = `
                <input type="checkbox" class="pdf-sheet-check" data-index="${idx}" checked>
                <div class="manage-name">${sheet.name}${idx === this.activeSheet ? ' (aktuell)' : ''}</div>
                <div class="manage-meta">${count} Gerät${count === 1 ? '' : 'e'}</div>
            `;
            list.appendChild(label);
        });
        document.getElementById('pdfExportModal').classList.add('active');
    },

    hidePdfExportModal() {
        document.getElementById('pdfExportModal').classList.remove('active');
    },

    setPdfExportSheetsChecked(checked) {
        document.querySelectorAll('#pdfExportSheetList .pdf-sheet-check').forEach(chk => { chk.checked = checked; });
    },

    startPdfExportFromModal() {
        const indices = Array.from(document.querySelectorAll('#pdfExportSheetList .pdf-sheet-check:checked'))
            .map(chk => parseInt(chk.dataset.index, 10))
            .filter(i => !isNaN(i) && i >= 0 && i < this.sheets.length);
        if (!indices.length) {
            alert('Bitte mindestens einen Arbeitsbereich auswählen.');
            return;
        }
        this.hidePdfExportModal();
        if (this.pdfExportMode === 'lists') {
            this.exportListsPDF(indices, document.getElementById('chkListsSummary').checked);
        } else {
            this.exportPDF(indices);
        }
    },

    async exportPDF(sheetIndices) {
        const { jsPDF } = window.jspdf;
        
        const A1_WIDTH_MM = 841;
        const A1_HEIGHT_MM = 594;
        
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [A1_HEIGHT_MM, A1_WIDTH_MM]
        });
        
        const indices = Array.isArray(sheetIndices) && sheetIndices.length ? sheetIndices : [this.activeSheet];
        const originalSheet = this.activeSheet;
        const monochrome = this.isMonochromeExport();
        const logoPNG = await this.renderLogoPNG(1200);
        const multiPage = indices.length > 1;
        
        this.deselectAll();
        this.storeActiveSheet();
        try {
            for (let p = 0; p < indices.length; p++) {
                const idx = indices[p];
                if (idx !== this.activeSheet) this.activateSheet(idx);
                if (p > 0) pdf.addPage([A1_HEIGHT_MM, A1_WIDTH_MM], 'landscape');
                await this.drawPlanPage(pdf, {
                    widthMM: A1_WIDTH_MM,
                    heightMM: A1_HEIGHT_MM,
                    logoPNG,
                    monochrome,
                    sheetName: this.sheets[idx].name,
                    pageNo: p + 1,
                    pageCount: indices.length,
                    multiPage
                });
            }
        } catch (err) {
            console.error('Diagramm-Rendering fehlgeschlagen:', err);
            alert('Das Diagramm konnte nicht gerendert werden: ' + err.message);
            return;
        } finally {
            if (this.activeSheet !== originalSheet) this.activateSheet(originalSheet);
        }
        
        pdf.save(this.buildFileName('pdf', 'A1'));
    },

    async drawPlanPage(pdf, opts) {
        const A1_WIDTH_MM = opts.widthMM;
        const A1_HEIGHT_MM = opts.heightMM;
        const MARGIN = 25;
        const COL_WIDTH = 150;
        const ROW_HEIGHT = 28;
        const ROWS = 4;
        const logoPNG = opts.logoPNG;
        
        const frameX = MARGIN;
        const frameY = MARGIN;
        const frameW = A1_WIDTH_MM - 2 * MARGIN;
        const frameH = A1_HEIGHT_MM - 2 * MARGIN;
        const colX = frameX + frameW - COL_WIDTH;
        
        pdf.setDrawColor(120);
        pdf.setLineWidth(0.4);
        pdf.rect(frameX, frameY, frameW, frameH);
        pdf.line(colX, frameY, colX, frameY + frameH);
        
        const blockTop = frameY + frameH - ROWS * ROW_HEIGHT;
        for (let i = 0; i <= ROWS; i++) {
            const ly = blockTop + i * ROW_HEIGHT;
            pdf.line(colX, ly, frameX + frameW, ly);
        }
        
        const logoWidth = 100;
        const logoAspect = typeof ICT_LOGO_ASPECT !== 'undefined' ? ICT_LOGO_ASPECT : 327 / 800;
        const logoHeight = logoWidth * logoAspect;
        const logoX = colX + (COL_WIDTH - logoWidth) / 2;
        const logoY = frameY + 14;
        if (logoPNG) {
            pdf.addImage(logoPNG, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } else {
            pdf.setFillColor(62, 13, 129);
            pdf.rect(logoX, logoY, logoHeight, logoHeight, 'F');
            pdf.setTextColor(33, 29, 42);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(58);
            pdf.text('ICT', logoX + logoHeight + 6, logoY + logoHeight - 1);
        }
        
        const now = new Date();
        const printDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
        
        const rowLabels = [
            this.projectName || 'Projektname',
            this.getEventPeriodText() || '-',
            this.eventLocation || '-',
            `${this.projectAuthor || '-'} / ${printDate}`
        ];
        const rowCaptions = ['Name', 'Veranstaltung', 'Veranstaltungsort', 'Ersteller'];
        rowCaptions.forEach((caption, i) => {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(120, 120, 120);
            pdf.text(caption, colX + 5, blockTop + i * ROW_HEIGHT + 7);
            pdf.setFontSize(11);
            pdf.setTextColor(20, 20, 20);
            pdf.text(rowLabels[i], colX + 5, blockTop + i * ROW_HEIGHT + 17);
        });
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(24);
        pdf.setTextColor(0);
        pdf.text(this.projectName || 'Projektname', frameX + 18, frameY + 20);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        pdf.text(this.projectNumber ? `Projekt-Nr. ${this.projectNumber}` : '', frameX + 18, frameY + 32);
        
        if (opts.multiPage) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            pdf.setTextColor(60, 60, 60);
            pdf.text(`${opts.sheetName}  ·  Blatt ${opts.pageNo} / ${opts.pageCount}`, colX - 12, frameY + 20, { align: 'right' });
        }
        
        const bounds = this.getBounds();
        const pad = 40;
        const viewX = bounds.minX - pad;
        const viewY = bounds.minY - pad;
        const diagramWidth = Math.max(bounds.maxX - bounds.minX + 2 * pad, 200);
        const diagramHeight = Math.max(bounds.maxY - bounds.minY + 2 * pad, 200);

        const drawX = frameX + 12;
        const drawY = frameY + 40;
        const availableWidth = colX - drawX - 12;
        const availableHeight = frameY + frameH - drawY - 12;

        const fit = Math.min(availableWidth / diagramWidth, availableHeight / diagramHeight);
        const imgW = diagramWidth * fit;
        const imgH = diagramHeight * fit;
        const imgX = drawX + (availableWidth - imgW) / 2;
        const imgY = drawY + (availableHeight - imgH) / 2;

        const png = await this.renderDiagramPNG({
            x: viewX, y: viewY, width: diagramWidth, height: diagramHeight
        }, Math.round(imgW * 200 / 25.4), { monochrome: opts.monochrome });
        pdf.addImage(png, 'PNG', imgX, imgY, imgW, imgH, undefined, 'FAST');
    },

    collectDeviceList(devices) {
        const counts = {};
        devices.forEach(device => {
            const article = device.article || (device.placeholder ? 'Platzhalter' : '-');
            const key = `${device.name}|||${article}`;
            if (!counts[key]) {
                counts[key] = { name: device.placeholder ? `${device.name} (Platzhalter)` : device.name, article, count: 0 };
            }
            counts[key].count++;
        });
        return Object.values(counts).sort((a, b) => a.name.localeCompare(b.name));
    },

    collectCableList(connections) {
        const counts = {};
        connections.forEach(conn => {
            if (!(conn.cableType || conn.length)) return;
            const cableType = conn.cableType || 'Unbekannt';
            const length = conn.length || '?';
            const key = `${cableType}|||${length}`;
            if (!counts[key]) counts[key] = { type: cableType, length, count: 0 };
            counts[key].count++;
        });
        return Object.values(counts).sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return parseFloat(a.length) - parseFloat(b.length);
        });
    },

    exportListsPDF(sheetIndices, includeSummary = true) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        this.storeActiveSheet();
        const indices = Array.isArray(sheetIndices) && sheetIndices.length ? sheetIndices : [this.activeSheet];
        const sections = indices.map(idx => ({
            title: this.sheets[idx].name,
            devices: this.sheets[idx].devices || [],
            connections: this.sheets[idx].connections || []
        }));
        const multi = sections.length > 1;
        
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;
        const rowHeight = 8;
        const bottomLimit = pageHeight - 22;
        const createdAt = new Date().toLocaleDateString('de-DE');
        
        let y = 0;
        let currentSection = '';
        
        const pageHeader = (sectionTitle) => {
            currentSection = sectionTitle;
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.text(this.projectName, margin, 20);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.text(`Erstellt: ${createdAt}`, pageWidth - margin, 20, { align: 'right' });
            let headY = 28;
            if (this.projectNumber) {
                pdf.setFontSize(12);
                pdf.text(`Projekt-Nr.: ${this.projectNumber}`, margin, headY);
                headY += 8;
            }
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            pdf.setTextColor(77, 73, 188);
            pdf.text(sectionTitle, margin, headY);
            pdf.setTextColor(0, 0, 0);
            pdf.setDrawColor(77, 73, 188);
            pdf.setLineWidth(0.5);
            pdf.line(margin, headY + 3, margin + contentWidth, headY + 3);
            pdf.setLineWidth(0.2);
            y = headY + 15;
        };
        const newPage = (sectionTitle) => {
            pdf.addPage();
            pageHeader(sectionTitle);
        };
        const ensureSpace = (needed) => {
            if (y + needed > bottomLimit) newPage(currentSection);
        };
        
        const tableHeader = (cols) => {
            ensureSpace(rowHeight + 4);
            pdf.setFillColor(77, 73, 188);
            pdf.rect(margin, y - 5, contentWidth, rowHeight, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            let x = margin;
            cols.forEach(col => {
                pdf.text(col.label, x + 2, y);
                x += col.width;
            });
            y += rowHeight;
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'normal');
        };
        const tableRow = (cols, values, idx) => {
            if (y + rowHeight > bottomLimit) {
                newPage(currentSection);
                tableHeader(cols);
            }
            if (idx % 2 === 0) {
                pdf.setFillColor(245, 245, 245);
                pdf.rect(margin, y - 5, contentWidth, rowHeight, 'F');
            }
            let x = margin;
            cols.forEach((col, i) => {
                pdf.text(String(values[i] ?? ''), x + 2, y);
                x += col.width;
            });
            y += rowHeight;
        };
        const sectionTitle = (text) => {
            ensureSpace(rowHeight * 3);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(14);
            pdf.text(text, margin, y);
            y += 10;
        };
        const totalsLine = (texts) => {
            ensureSpace(rowHeight + 5);
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, y, margin + contentWidth, y);
            y += 5;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            texts.forEach((t, i) => pdf.text(t, margin + 2 + i * 80, y));
            pdf.setFont('helvetica', 'normal');
            y += 14;
        };
        
        const deviceCols = [
            { label: 'Anzahl', width: 20 },
            { label: 'Gerätename', width: contentWidth - 60 },
            { label: 'Artikelnummer', width: 40 }
        ];
        const cableCols = [
            { label: 'Anz.', width: 20 },
            { label: 'Kabeltyp', width: contentWidth - 60 },
            { label: 'Länge (m)', width: 40 }
        ];
        
        const drawLists = (devices, connections, opts = {}) => {
            sectionTitle('Geräteliste');
            const deviceList = this.collectDeviceList(devices);
            tableHeader(deviceCols);
            if (!deviceList.length) {
                pdf.setFont('helvetica', 'italic');
                pdf.text('Keine Geräte vorhanden.', margin + 2, y);
                pdf.setFont('helvetica', 'normal');
                y += rowHeight;
            }
            deviceList.forEach((item, idx) => tableRow(deviceCols, [item.count, item.name.substring(0, 50), item.article.substring(0, 25)], idx));
            totalsLine([`Gesamt: ${devices.length} Geräte`]);
            
            sectionTitle('Kabelliste');
            const cableList = this.collectCableList(connections);
            tableHeader(cableCols);
            if (!cableList.length) {
                pdf.setFont('helvetica', 'italic');
                pdf.text('Keine Kabelinformationen vorhanden.', margin + 2, y);
                pdf.text('Bitte Verbindungen auswählen und Kabeltyp/Länge eingeben.', margin + 2, y + 6);
                pdf.setFont('helvetica', 'normal');
                y += rowHeight * 2;
                return;
            }
            let totalLength = 0;
            cableList.forEach((item, idx) => {
                tableRow(cableCols, [item.count, item.type, item.length], idx);
                const len = parseFloat(item.length);
                if (!isNaN(len)) totalLength += len * item.count;
            });
            const totals = [`Gesamt: ${connections.filter(c => c.cableType || c.length).length} Kabel`];
            if (totalLength > 0) totals.push(`Gesamtlänge: ${totalLength.toFixed(1)} m`);
            totalsLine(totals);
        };
        
        const drawSheetOverview = (allDevices, allConnections) => {
            sectionTitle('Übersicht Arbeitsbereiche');
            const cols = [
                { label: 'Arbeitsbereich', width: contentWidth - 80 },
                { label: 'Geräte', width: 40 },
                { label: 'Kabel', width: 40 }
            ];
            tableHeader(cols);
            sections.forEach((sec, idx) => tableRow(cols, [
                sec.title,
                sec.devices.length,
                sec.connections.filter(c => c.cableType || c.length).length
            ], idx));
            totalsLine([
                `Gesamt: ${allDevices.length} Geräte`,
                `${allConnections.filter(c => c.cableType || c.length).length} Kabel`
            ]);
        };
        
        sections.forEach((sec, i) => {
            const title = multi ? `Arbeitsbereich: ${sec.title}` : sec.title;
            if (i === 0) pageHeader(title); else newPage(title);
            drawLists(sec.devices, sec.connections);
        });
        
        if (includeSummary && multi) {
            const allDevices = sections.flatMap(s => s.devices);
            const allConnections = sections.flatMap(s => s.connections);
            newPage('Zusammenfassung Gesamtprojekt');
            drawSheetOverview(allDevices, allConnections);
            drawLists(allDevices, allConnections);
        }
        
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.setTextColor(120, 120, 120);
            pdf.text(`${this.projectName}  ·  Seite ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }
        
        pdf.save(this.buildFileName('pdf', 'Listen'));
    }
};
