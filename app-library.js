const LibraryMixin = {
    updateGroupFilter() {
        const filter = document.getElementById('groupFilter');
        filter.innerHTML = '<option value="all">Alle Gruppen</option>';
        this.groups.forEach(g => {
            filter.innerHTML += `<option value="${g.id}">${g.name}</option>`;
        });
    },

    defaultTemplates() {
        return [
            { name: 'Yamaha CL5', type: 'Digital Mixer', article: 'CL5', group: 'audio', color: '#3498db', inputs: ['IN 1', 'IN 2', 'IN 3', 'IN 4', 'IN 5', 'IN 6', 'IN 7', 'IN 8'], outputs: ['MAIN L', 'MAIN R', 'AUX 1', 'AUX 2'], inputCables: ['XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR'], outputCables: ['XLR', 'XLR', 'XLR', 'XLR'] },
            { name: 'Yamaha DM3', type: 'Digital Mixer', article: 'DM3', group: 'audio', color: '#3498db', inputs: ['XLR IN 1', 'XLR IN 2', 'XLR IN 3', 'XLR IN 4', 'XLR IN 5', 'XLR IN 6', 'XLR IN 7', 'XLR IN 8', 'XLR IN 9', 'XLR IN 10', 'XLR IN 11', 'XLR IN 12', 'XLR IN 13', 'XLR IN 14', 'XLR IN 15', 'XLR IN 16', 'Dante Primary', 'Dante Secondary', 'LAN'], outputs: ['XLR OUT 1', 'XLR OUT 2', 'XLR OUT 3', 'XLR OUT 4', 'XLR OUT 5', 'XLR OUT 6', 'XLR OUT 7', 'XLR OUT 8', 'Dante Primary', 'Dante Secondary'], inputCables: ['XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'Cat5/6', 'Cat5/6', 'Cat5/6'], outputCables: ['XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'Cat5/6', 'Cat5/6'] },
            { name: 'Yamaha DM7', type: 'Digital Mixer', article: '', group: 'audio', color: '#3498db', inputs: ['XLR IN 1', 'XLR IN 2', 'XLR IN 3', 'XLR IN 4', 'XLR IN 5', 'XLR IN 6', 'XLR IN 7', 'XLR IN 8', 'XLR IN 9', 'XLR IN 10', 'XLR IN 11', 'XLR IN 12', 'XLR IN 13', 'XLR IN 14', 'XLR IN 15', 'XLR IN 16', 'XLR IN 17', 'XLR IN 18', 'XLR IN 19', 'XLR IN 20', 'XLR IN 21', 'XLR IN 22', 'XLR IN 23', 'XLR IN 24', 'XLR IN 25', 'XLR IN 26', 'XLR IN 27', 'XLR IN 28', 'XLR IN 29', 'XLR IN 30', 'XLR IN 31', 'XLR IN 32', 'AES IN 1', 'AES IN 2', 'Dante Primary', 'Dante Secondary', 'LAN'], outputs: ['XLR OUT 1', 'XLR OUT 2', 'XLR OUT 3', 'XLR OUT 4', 'XLR OUT 5', 'XLR OUT 6', 'XLR OUT 7', 'XLR OUT 8', 'XLR OUT 9', 'XLR OUT 10', 'XLR OUT 11', 'XLR OUT 12', 'XLR OUT 13', 'XLR OUT 14', 'XLR OUT 15', 'XLR OUT 16', 'AES OUT 1', 'AES OUT 2', 'Dante Primary', 'Dante Secondary'], inputCables: ['XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'AES/EBU', 'AES/EBU', 'Cat5/6', 'Cat5/6', 'Cat5/6'], outputCables: ['XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'XLR', 'AES/EBU', 'AES/EBU', 'Cat5/6', 'Cat5/6'] },
            { name: 'QSC PLD4.5', type: 'Amplifier', article: 'PLD4.5', group: 'audio', color: '#e74c3c', inputs: ['CH 1', 'CH 2', 'CH 3', 'CH 4'], outputs: ['SP 1', 'SP 2', 'SP 3', 'SP 4'], inputCables: ['XLR', 'XLR', 'XLR', 'XLR'], outputCables: ['Speakon', 'Speakon', 'Speakon', 'Speakon'] },
            { name: 'JBL VRX932LA', type: 'Line Array', article: 'VRX932LA', group: 'audio', color: '#2ecc71', inputs: ['IN'], outputs: [], inputCables: ['Speakon'], outputCables: [] },
            { name: 'Shure SM58', type: 'Microphone', article: 'SM58-LC', group: 'audio', color: '#9b59b6', inputs: [], outputs: ['XLR'], inputCables: [], outputCables: ['XLR'] },
            { name: 'BSS BLU-100', type: 'DSP', article: 'BLU-100', group: 'audio', color: '#f39c12', inputs: ['IN 1', 'IN 2', 'IN 3', 'IN 4'], outputs: ['OUT 1', 'OUT 2', 'OUT 3', 'OUT 4'], inputCables: ['XLR', 'XLR', 'XLR', 'XLR'], outputCables: ['XLR', 'XLR', 'XLR', 'XLR'] },
            { name: 'Barco E2', type: 'Video Processor', article: 'E2', group: 'video', color: '#9b59b6', inputs: ['SDI 1', 'SDI 2', 'HDMI 1', 'HDMI 2'], outputs: ['SDI OUT 1', 'SDI OUT 2', 'HDMI OUT'], inputCables: ['SDI', 'SDI', 'HDMI', 'HDMI'], outputCables: ['SDI', 'SDI', 'HDMI'] },
            { name: 'Sony PXW-Z280', type: 'Camera', article: 'PXW-Z280', group: 'video', color: '#1abc9c', inputs: [], outputs: ['SDI', 'HDMI'], inputCables: [], outputCables: ['SDI', 'HDMI'] },
            { name: 'BiDi 12G', type: 'Microconverter', article: '1028664', group: 'video', color: '#9b59b6', inputs: ['HDMI IN 1', 'SDI IN 2'], outputs: ['HDMI OUT 1', 'SDI OUT 2'], inputCables: ['HDMI', 'SDI'], outputCables: ['HDMI', 'SDI'] },
            { name: 'Dell U2414H', type: 'Monitor', article: '1012229', group: 'video', color: '#9b59b6', inputs: ['DP IN 1', 'DP IN 2', 'HDMI IN 1', 'HDMI IN 2'], outputs: ['DP OUT', 'Audio OUT'], inputCables: ['DP', 'DP', 'HDMI', 'HDMI'], outputCables: ['DP', 'Klinke'] },
            { name: 'iiyama ProLite TE8668MIS-B1AG', type: 'Touchdisplay', article: '1017366', group: 'video', color: '#9b59b6', inputs: ['DP IN', 'HDMI IN 1', 'HDMI IN 2', 'HDMI IN 3', 'VGA IN', 'Audio IN', 'LAN'], outputs: ['HDMI OUT', 'Audio OUT', 'SPDIF OUT'], inputCables: ['DP', 'HDMI', 'HDMI', 'HDMI', 'VGA', 'Klinke', 'Cat5/6'], outputCables: ['HDMI', 'Klinke', 'SPDIF'] },
            { name: 'DP-HDMI Adapter', type: 'Adapter', article: 'DP-HDMI', group: 'video', color: '#9b59b6', inputs: ['DP IN'], outputs: ['HDMI OUT'], inputCables: ['DP'], outputCables: ['HDMI'] },
            { name: 'CVT-10', type: 'Signalkonverter', article: '1022136', group: 'control', color: '#e67e22', inputs: ['LC/LC IN', 'Cat5/6 IN'], outputs: ['Cat5/6 OUT 1', 'Cat5/6 OUT 2', 'Cat5/6 OUT 3', 'Cat5/6 OUT 4', 'Cat5/6 OUT 5', 'Cat5/6 OUT 6', 'Cat5/6 OUT 7', 'Cat5/6 OUT 8', 'LC/LC OUT'], inputCables: ['Glasfaser LC/LC', 'Cat5/6'], outputCables: ['Cat5/6', 'Cat5/6', 'Cat5/6', 'Cat5/6', 'Cat5/6', 'Cat5/6', 'Cat5/6', 'Cat5/6', 'Glasfaser LC/LC'] },
            { name: 'MA Lighting grandMA3', type: 'Lighting Console', article: 'grandMA3', group: 'light', color: '#f1c40f', inputs: ['DMX IN'], outputs: ['DMX 1', 'DMX 2', 'DMX 3', 'DMX 4'], inputCables: ['DMX'], outputCables: ['DMX', 'DMX', 'DMX', 'DMX'] },
            { name: 'Crestron CP4', type: 'Control Processor', article: 'CP4', group: 'control', color: '#e67e22', inputs: ['COM 1', 'COM 2', 'IR 1', 'IR 2'], outputs: ['RELAY 1', 'RELAY 2'], inputCables: ['Cat5/6', 'Cat5/6', '', ''], outputCables: ['', ''] }
        ];
    },

    libraryData() {
        return {
            version: 1,
            savedAt: new Date().toISOString(),
            templates: this.deviceTemplates,
            groups: this.groups,
            cableTypes: this.cableTypes
        };
    },

    saveLibrary() {
        try {
            localStorage.setItem(this.libraryKey, JSON.stringify(this.libraryData()));
            return true;
        } catch (err) {
            console.warn('Bibliothek konnte nicht gespeichert werden:', err);
            return false;
        }
    },

    loadLibrary() {
        let stored = null;
        try {
            const raw = localStorage.getItem(this.libraryKey);
            if (raw) stored = JSON.parse(raw);
        } catch (err) {
            console.warn('Bibliothek konnte nicht gelesen werden:', err);
        }
        
        if (stored && Array.isArray(stored.templates)) {
            this.deviceTemplates = stored.templates;
            if (Array.isArray(stored.groups) && stored.groups.length) this.groups = stored.groups;
            if (Array.isArray(stored.cableTypes) && stored.cableTypes.length) this.cableTypes = stored.cableTypes;
            this.addMissingDefaults();
        } else {
            this.deviceTemplates = this.defaultTemplates();
            this.saveLibrary();
        }
        
        this.renderDeviceLibrary();
        this.watchCentralLibrary();
    },

    // Zentrale, online gepflegte Geraetebibliothek: sobald die Cloud-Anmeldung bereit ist,
    // wird der aktuelle Stand geladen, sodass alle Nutzer dieselbe Geraeteliste sehen.
    // Verwaltet wird sie im separaten Admin-Tool "geraete-admin.html".
    watchCentralLibrary() {
        if (this._centralLibraryWatching) return;
        this._centralLibraryWatching = true;
        const sync = () => this.syncLibraryFromCloud();
        window.addEventListener('cloud-auth-ready', sync);
        if (window.cloudSync && window.cloudSync.isReady && window.cloudSync.isReady()) sync();
    },

    async syncLibraryFromCloud() {
        if (!window.cloudSync || typeof window.cloudSync.fetchDeviceLibrary !== 'function') return;
        try {
            const row = await window.cloudSync.fetchDeviceLibrary();
            const statusEl = document.getElementById('libraryCloudStatus');
            const btnPublish = document.getElementById('btnPublishLibrary');
            if (btnPublish) btnPublish.style.display = (window.cloudSync.isAdmin && window.cloudSync.isAdmin()) ? 'inline-block' : 'none';
            if (row && row.data && (Array.isArray(row.data.templates) || Array.isArray(row.data.groups))) {
                if (Array.isArray(row.data.templates)) this.deviceTemplates = row.data.templates;
                if (Array.isArray(row.data.groups) && row.data.groups.length) this.groups = row.data.groups;
                if (Array.isArray(row.data.cableTypes) && row.data.cableTypes.length) this.cableTypes = row.data.cableTypes;
                this.saveLibrary();
                this.updateGroupFilter();
                this.renderDeviceLibrary();
                if (typeof this.renderManageDevicesList === 'function') this.renderManageDevicesList();
                if (statusEl) {
                    const when = row.updated_at ? new Date(row.updated_at).toLocaleString('de-DE') : '';
                    statusEl.textContent = `☁ Zentrale Bibliothek – zuletzt aktualisiert${row.updated_by_email ? ' von ' + row.updated_by_email : ''}${when ? ' am ' + when : ''}. Verwaltet im Admin-Tool "Geräteverwaltung".`;
                }
            } else if (statusEl) {
                statusEl.textContent = 'ℹ Es wurde noch keine zentrale Bibliothek veröffentlicht (siehe Admin-Tool "Geräteverwaltung").';
            }
        } catch (err) {
            console.warn('Zentrale Gerätebibliothek konnte nicht synchronisiert werden:', err);
        }
    },

    async publishLibraryToCloud() {
        if (!window.cloudSync || typeof window.cloudSync.publishDeviceLibrary !== 'function') return;
        const btn = document.getElementById('btnPublishLibrary');
        if (btn) btn.disabled = true;
        const result = await window.cloudSync.publishDeviceLibrary(this.libraryData());
        if (btn) btn.disabled = false;
        if (result && result.error) {
            alert('Fehler beim Veröffentlichen: ' + result.error);
        } else {
            alert('Die aktuelle Bibliothek wurde als zentrale Gerätebibliothek veröffentlicht. Alle Nutzer erhalten sie automatisch beim nächsten Öffnen des Tools.');
            this.syncLibraryFromCloud();
        }
    },

    addMissingDefaults() {
        let changed = false;
        const known = new Set(this.deviceTemplates.map(t => this.templateKey(t)));
        this.defaultTemplates().forEach(t => {
            if (known.has(this.templateKey(t))) return;
            this.deviceTemplates.push(t);
            changed = true;
        });
        this.defaultCableTypes().forEach(c => {
            if (this.cableTypes.includes(c)) return;
            this.cableTypes.push(c);
            changed = true;
        });
        if (changed) this.saveLibrary();
    },

    resetLibrary() {
        this.deviceTemplates = this.defaultTemplates();
        this.groups = this.defaultGroups();
        this.cableTypes = this.defaultCableTypes();
        this.saveLibrary();
        this.updateGroupFilter();
        this.renderDeviceLibrary();
    },

    templateKey(template) {
        return `${(template.name || '').trim().toLowerCase()}|${(template.article || '').trim().toLowerCase()}`;
    },

    exportLibrary() {
        const blob = new Blob([JSON.stringify(this.libraryData(), null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'geraetebibliothek.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    importLibrary(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                const merged = this.mergeIntoLibrary(data);
                this.renderManageDevicesList();
                if (merged.templates || merged.groups || merged.cables) {
                    const parts = [];
                    if (merged.templates) parts.push(`${merged.templates} Gerät(e)`);
                    if (merged.groups) parts.push(`${merged.groups} Gruppe(n)`);
                    if (merged.cables) parts.push(`${merged.cables} Kabeltyp(en)`);
                    alert('In die zentrale Bibliothek übernommen:\n' + parts.join(', '));
                } else {
                    alert('Keine neuen Einträge gefunden – die Bibliothek ist bereits aktuell.');
                }
            } catch (err) {
                alert('Fehler beim Import der Bibliothek: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    },

    mergeIntoLibrary(data) {
        let templates = 0, groups = 0, cables = 0;
        
        if (Array.isArray(data.groups)) {
            data.groups.forEach(g => {
                if (!g || !g.id || this.groups.some(existing => existing.id === g.id)) return;
                this.groups.push(g);
                groups++;
            });
        }
        
        if (Array.isArray(data.cableTypes)) {
            data.cableTypes.forEach(c => {
                if (!c || this.cableTypes.includes(c)) return;
                this.cableTypes.push(c);
                cables++;
            });
        }
        
        if (Array.isArray(data.templates)) {
            const known = new Set(this.deviceTemplates.map(t => this.templateKey(t)));
            data.templates.forEach(t => {
                if (!t || !t.name || t.placeholder) return;
                const key = this.templateKey(t);
                if (known.has(key)) return;
                known.add(key);
                this.deviceTemplates.push(t);
                templates++;
                this.contributeDeviceToCloud(t);
            });
        }
        
        if (templates || groups || cables) {
            this.saveLibrary();
            this.updateGroupFilter();
            this.renderDeviceLibrary();
        }
        
        return { templates, groups, cables };
    },

    groupColor(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        return (group && group.color) || '#95a5a6';
    },

    addDeviceTemplate(template) {
        if (!template.color) template.color = this.groupColor(template.group);
        this.deviceTemplates.push(template);
        this.saveLibrary();
        this.renderDeviceLibrary();
        this.contributeDeviceToCloud(template);
    },

    // Traegt ein neu angelegtes (oder per PDF/Websuche importiertes) Geraet
    // automatisch im Hintergrund zur zentralen, online gepflegten Bibliothek
    // bei, damit der Geraetepool stetig waechst und allen Nutzern zur
    // Verfuegung steht. Rein additiv (siehe supabase/setup.sql), scheitert
    // still, falls Cloud/Anmeldung nicht verfuegbar ist.
    contributeDeviceToCloud(template) {
        if (!window.cloudSync || typeof window.cloudSync.submitDeviceToLibrary !== 'function') return;
        if (!template || template.placeholder) return;
        const group = this.groups.find(g => g.id === (template.group || 'other')) || null;
        const usedCables = [...(template.inputCables || []), ...(template.outputCables || [])].filter(Boolean);
        window.cloudSync.submitDeviceToLibrary(template, group, usedCables)
            .then((res) => { if (res && res.error) console.warn('Beitrag zur zentralen Bibliothek fehlgeschlagen:', res.error); })
            .catch((err) => console.warn('Beitrag zur zentralen Bibliothek fehlgeschlagen:', err));
    },

    renderDeviceLibrary() {
        const library = document.getElementById('deviceLibrary');
        const filterValue = document.getElementById('groupFilter').value;
        const searchValue = document.getElementById('deviceSearch').value.toLowerCase().trim();
        library.innerHTML = '';
        
        const groupedTemplates = {};
        this.groups.forEach(g => groupedTemplates[g.id] = []);
        
        this.deviceTemplates.forEach((t, idx) => {
            if (searchValue) {
                const searchFields = [t.name, t.type, t.article, ...t.inputs, ...t.outputs].join(' ').toLowerCase();
                if (!searchFields.includes(searchValue)) return;
            }
            
            const groupId = t.group || 'other';
            if (!groupedTemplates[groupId]) groupedTemplates[groupId] = [];
            groupedTemplates[groupId].push({ template: t, index: idx });
        });
        
        this.groups.forEach(group => {
            if (filterValue !== 'all' && filterValue !== group.id) return;
            
            const templates = groupedTemplates[group.id];
            if (templates.length === 0) return;
            
            const isCollapsed = this.collapsedGroups && this.collapsedGroups.has(group.id);
            
            const section = document.createElement('div');
            section.className = 'group-section' + (isCollapsed ? ' collapsed' : '');
            section.dataset.groupId = group.id;
            
            const header = document.createElement('div');
            header.className = 'group-header';
            header.innerHTML = `
                <span class="group-toggle">▼</span>
                <div class="group-color" style="background:${group.color}"></div>
                <span class="group-name">${group.name} (${templates.length})</span>
            `;
            header.addEventListener('click', () => this.toggleGroup(group.id));
            section.appendChild(header);
            
            const devicesContainer = document.createElement('div');
            devicesContainer.className = 'group-devices';
            
            templates.forEach(({ template: t, index: idx }) => {
                const div = document.createElement('div');
                div.className = 'device-template';
                div.style.setProperty('--device-color', t.color || group.color);
                div.innerHTML = `
                    <div class="name">${t.name}</div>
                    ${t.article ? `<div class="article">${t.article}</div>` : ''}
                    <div class="io-info">Eingänge: ${t.inputs.length} | Ausgänge: ${t.outputs.length}</div>
                `;
                div.draggable = true;
                div.addEventListener('dragstart', (e) => {
                    this.dragTemplateIndex = idx;
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('template-index', String(idx));
                    e.dataTransfer.setData('text/plain', String(idx));
                });
                div.addEventListener('dragend', () => {
                    this.dragTemplateIndex = null;
                });
                div.addEventListener('click', () => {
                    const pos = this.visibleCanvasCenter();
                    const device = this.addDeviceToCanvas(t, pos.x, pos.y);
                    this.selectElement(device, 'device');
                });
                devicesContainer.appendChild(div);
            });
            
            section.appendChild(devicesContainer);
            library.appendChild(section);
        });
    },

    toggleGroup(groupId) {
        if (!this.collapsedGroups) this.collapsedGroups = new Set();
        
        if (this.collapsedGroups.has(groupId)) {
            this.collapsedGroups.delete(groupId);
        } else {
            this.collapsedGroups.add(groupId);
        }
        
        const section = document.querySelector(`.group-section[data-group-id="${groupId}"]`);
        if (section) {
            section.classList.toggle('collapsed');
        }
    },

    findFreePosition(x, y, width, height) {
        const step = 30;
        let px = x;
        let py = y;
        
        for (let i = 0; i < 200; i++) {
            const overlap = this.devices.some(d =>
                Math.abs(d.x - px) < width * 0.5 && Math.abs(d.y - py) < height * 0.5
            );
            if (!overlap) break;
            px += step;
            py += step;
            if (px > 2400) {
                px = x;
                py += height + step;
            }
        }
        
        return { x: px, y: py };
    },

    visibleCanvasCenter() {
        const wrapper = document.getElementById('canvasWrapper');
        if (!wrapper) return { x: 100, y: 100 };
        const zoom = this.zoom || 1;
        const x = (wrapper.scrollLeft + wrapper.clientWidth / 2) / zoom - 80;
        const y = (wrapper.scrollTop + wrapper.clientHeight / 2) / zoom - 60;
        return { x: Math.max(20, x), y: Math.max(20, y) };
    },

    addDeviceToCanvas(template, x = 100, y = 100) {
        const extra = template.placeholder ? 16 : 0;
        const height = Math.max(90, 50 + Math.max(template.inputs.length, template.outputs.length) * 20) + extra;
        const pos = this.findFreePosition(x, y, 160, height);
        this.recordHistory();
        x = this.snap(pos.x);
        y = this.snap(pos.y);
        
        const device = {
            id: `device-${this.nextDeviceId++}`,
            name: template.name,
            type: template.type,
            article: template.article || '',
            group: template.group || 'other',
            color: template.color,
            x: x,
            y: y,
            width: 160,
            height: height,
            placeholder: !!template.placeholder,
            origin: { name: template.name, type: template.type, article: template.article || '', group: template.group || 'other', color: template.color },
            inputs: template.inputs.map((name, i) => ({ id: `in-${i}`, name, cable: template.inputCables?.[i] || '', connected: false })),
            outputs: template.outputs.map((name, i) => ({ id: `out-${i}`, name, cable: template.outputCables?.[i] || '', connected: false }))
        };
        
        this.devices.push(device);
        this.renderDevice(device);
        return device;
    },

    addPlaceholderDevice() {
        const name = (prompt('Bezeichnung des Platzhalters:', 'Gerät offen') || '').trim();
        if (!name) return;
        
        const count = (label, fallback) => {
            const raw = prompt(`Anzahl ${label}:`, String(fallback));
            if (raw === null) return null;
            const value = parseInt(raw, 10);
            return Number.isFinite(value) && value >= 0 ? Math.min(value, 64) : fallback;
        };
        
        const inputCount = count('Eingänge', 2);
        if (inputCount === null) return;
        const outputCount = count('Ausgänge', 2);
        if (outputCount === null) return;
        
        const template = {
            name,
            article: '',
            type: 'Platzhalter',
            group: 'other',
            color: '#6b7280',
            placeholder: true,
            inputs: Array.from({ length: inputCount }, (_, i) => `IN ${i + 1}`),
            outputs: Array.from({ length: outputCount }, (_, i) => `OUT ${i + 1}`),
            inputCables: Array.from({ length: inputCount }, () => ''),
            outputCables: Array.from({ length: outputCount }, () => '')
        };
        
        const device = this.addDeviceToCanvas(template, 150, 100);
        this.selectElement(device, 'device');
    },

    addTextbox() {
        const text = (prompt('Text:', '') || '').trim();
        if (!text) return;
        
        this.recordHistory();
        const box = {
            id: `textbox-${this.nextTextboxId++}`,
            text: text,
            x: this.snap(150),
            y: this.snap(60),
            fontSize: 14,
            textColor: '#000000',
            borderColor: '#4d49bc'
        };
        
        this.textboxes.push(box);
        this.renderTextbox(box);
        this.selectElement(box, 'textbox');
    },

    textboxLines(box) {
        return String(box.text || '').split('\n');
    },

    textboxSize(box) {
        const fontSize = box.fontSize || 14;
        const lines = this.textboxLines(box);
        const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
        return {
            width: Math.max(60, Math.round(longest * fontSize * 0.58) + 20),
            height: lines.length * Math.round(fontSize * 1.35) + 14
        };
    }
};
