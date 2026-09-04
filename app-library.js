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
            { name: 'QSC PLD4.5', type: 'Amplifier', article: 'PLD4.5', group: 'audio', color: '#e74c3c', inputs: ['CH 1', 'CH 2', 'CH 3', 'CH 4'], outputs: ['SP 1', 'SP 2', 'SP 3', 'SP 4'], inputCables: ['XLR', 'XLR', 'XLR', 'XLR'], outputCables: ['Speakon', 'Speakon', 'Speakon', 'Speakon'] },
            { name: 'JBL VRX932LA', type: 'Line Array', article: 'VRX932LA', group: 'audio', color: '#2ecc71', inputs: ['IN'], outputs: [], inputCables: ['Speakon'], outputCables: [] },
            { name: 'Shure SM58', type: 'Microphone', article: 'SM58-LC', group: 'audio', color: '#9b59b6', inputs: [], outputs: ['XLR'], inputCables: [], outputCables: ['XLR'] },
            { name: 'BSS BLU-100', type: 'DSP', article: 'BLU-100', group: 'audio', color: '#f39c12', inputs: ['IN 1', 'IN 2', 'IN 3', 'IN 4'], outputs: ['OUT 1', 'OUT 2', 'OUT 3', 'OUT 4'], inputCables: ['XLR', 'XLR', 'XLR', 'XLR'], outputCables: ['XLR', 'XLR', 'XLR', 'XLR'] },
            { name: 'Barco E2', type: 'Video Processor', article: 'E2', group: 'video', color: '#9b59b6', inputs: ['SDI 1', 'SDI 2', 'HDMI 1', 'HDMI 2'], outputs: ['SDI OUT 1', 'SDI OUT 2', 'HDMI OUT'], inputCables: ['SDI', 'SDI', 'HDMI', 'HDMI'], outputCables: ['SDI', 'SDI', 'HDMI'] },
            { name: 'Sony PXW-Z280', type: 'Camera', article: 'PXW-Z280', group: 'video', color: '#1abc9c', inputs: [], outputs: ['SDI', 'HDMI'], inputCables: [], outputCables: ['SDI', 'HDMI'] },
            { name: 'BiDi 12G', type: 'Microconverter', article: '1028664', group: 'video', color: '#9b59b6', inputs: ['HDMI IN 1', 'SDI IN 2'], outputs: ['HDMI OUT 1', 'SDI OUT 2'], inputCables: ['HDMI', 'SDI'], outputCables: ['HDMI', 'SDI'] },
            { name: 'DP-HDMI Adapter', type: 'Adapter', article: 'DP-HDMI', group: 'video', color: '#9b59b6', inputs: ['DP IN'], outputs: ['HDMI OUT'], inputCables: ['DisplayPort'], outputCables: ['HDMI'] },
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
                div.addEventListener('dblclick', () => {
                    this.addDeviceToCanvas(t, 100, 100);
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

    addDeviceToCanvas(template, x = 100, y = 100) {
        const extra = template.placeholder ? 16 : 0;
        const height = Math.max(90, 50 + Math.max(template.inputs.length, template.outputs.length) * 20) + extra;
        const pos = this.findFreePosition(x, y, 160, height);
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
