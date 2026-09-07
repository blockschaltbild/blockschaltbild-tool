const ModalsMixin = {
    showTextboxProperties(box) {
        const panel = document.getElementById('propertiesPanel');
        panel.innerHTML = `
            <label>Text:<textarea id="propTextboxText" rows="4">${this.escapeHtml(box.text || '')}</textarea></label>
            <label>Textgröße: <input type="number" id="propTextboxSize" min="6" max="96" step="1" value="${box.fontSize || 14}"></label>
            <label>Textfarbe: <input type="color" id="propTextboxTextColor" value="${box.textColor || '#000000'}"></label>
            <label>Rahmenfarbe: <input type="color" id="propTextboxBorderColor" value="${box.borderColor || '#4d49bc'}"></label>
            <button id="btnDeleteTextbox" class="danger">Textfeld löschen</button>
        `;
        
        panel.querySelector('#propTextboxText').addEventListener('input', (e) => {
            this.recordHistory({ merge: `textbox-text-${box.id}` });
            box.text = e.target.value;
            this.renderTextbox(box);
            document.getElementById(box.id).classList.add('selected');
        });
        panel.querySelector('#propTextboxSize').addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            if (!Number.isFinite(value) || value < 6) return;
            this.recordHistory({ merge: `textbox-size-${box.id}` });
            box.fontSize = Math.min(value, 96);
            this.renderTextbox(box);
            document.getElementById(box.id).classList.add('selected');
        });
        panel.querySelector('#propTextboxTextColor').addEventListener('input', (e) => {
            this.recordHistory({ merge: `textbox-color-${box.id}` });
            box.textColor = e.target.value;
            this.renderTextbox(box);
            document.getElementById(box.id).classList.add('selected');
        });
        panel.querySelector('#propTextboxBorderColor').addEventListener('input', (e) => {
            this.recordHistory({ merge: `textbox-border-${box.id}` });
            box.borderColor = e.target.value;
            this.renderTextbox(box);
            document.getElementById(box.id).classList.add('selected');
        });
        panel.querySelector('#btnDeleteTextbox').addEventListener('click', () => this.deleteSelected());
    },

    showDeviceProperties(device) {
        const group = this.groups.find(g => g.id === device.group) || { name: 'Sonstiges' };
        const panel = document.getElementById('propertiesPanel');
        panel.innerHTML = `
            <label>Name: <input type="text" id="propName" value="${device.name}"></label>
            <label>Artikelnummer: <input type="text" id="propArticle" value="${device.article || ''}"></label>
            <label>Typ: <input type="text" id="propType" value="${device.type || ''}"></label>
            <label>Gruppe: <select id="propGroup">${this.groups.map(g => `<option value="${g.id}" ${g.id === device.group ? 'selected' : ''}>${g.name}</option>`).join('')}</select></label>
            <label>Farbe: <input type="color" id="propColor" value="${device.color}"></label>
            <label class="checkbox-row" title="Platzhalter bleiben nur in diesem Projekt und werden nicht in der Bibliothek gespeichert"><input type="checkbox" id="propPlaceholder" ${device.placeholder ? 'checked' : ''}> Platzhalter (nicht in Bibliothek)</label>
            <button id="btnDeleteDevice" class="btn-danger">Löschen</button>
        `;
        
        panel.querySelector('#propName').addEventListener('change', (e) => {
            this.applyDeviceChange(device, { name: e.target.value });
        });
        panel.querySelector('#propArticle').addEventListener('change', (e) => {
            this.applyDeviceChange(device, { article: e.target.value });
        });
        panel.querySelector('#propType').addEventListener('change', (e) => {
            this.applyDeviceChange(device, { type: e.target.value });
        });
        panel.querySelector('#propGroup').addEventListener('change', (e) => {
            this.applyDeviceChange(device, { group: e.target.value });
        });
        panel.querySelector('#propColor').addEventListener('change', (e) => {
            this.applyDeviceChange(device, { color: e.target.value });
        });
        panel.querySelector('#propPlaceholder').addEventListener('change', (e) => {
            this.recordHistory();
            device.placeholder = e.target.checked;
            this.renderDevice(device);
            this.markSelectedDevice(device);
        });
        panel.querySelector('#btnDeleteDevice').addEventListener('click', () => this.deleteSelected());
    },

    focusPropertiesPanel() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar?.classList.contains('collapsed')) sidebar.classList.remove('collapsed');
        const panel = document.getElementById('propertiesPanel');
        if (!panel) return;
        requestAnimationFrame(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            panel.classList.add('highlight');
            setTimeout(() => panel.classList.remove('highlight'), 1200);
            panel.querySelector('input, select, textarea')?.focus({ preventScroll: true });
        });
    },

    markSelectedDevice(device) {
        if (this.selectedElement?.type === 'device' && this.selectedElement.element === device) {
            document.getElementById(device.id)?.classList.add('selected');
        }
    },

    allDevices() {
        const list = [];
        this.sheets.forEach((sheet, idx) => {
            const devices = idx === this.activeSheet ? this.devices : sheet.devices;
            (devices || []).forEach(d => list.push(d));
        });
        return list;
    },

    sameDeviceKey(device) {
        return `${device.name || ''}\u0000${device.article || ''}`;
    },

    applyDeviceChange(device, changes, options = {}) {
        const props = ['name', 'type', 'article', 'group', 'color'];
        if ('group' in changes && !('color' in changes)) {
            const gc = this.groupColor(changes.group);
            if (gc) changes = { ...changes, color: gc };
        }
        const assign = (target) => props.forEach(p => { if (p in changes) target[p] = changes[p]; });
        this.recordHistory(options.merge ? { merge: options.merge } : {});
        
        if (device.placeholder || options.local) {
            assign(device);
            this.renderDevice(device);
            this.markSelectedDevice(device);
            if (this.selectedElement?.type === 'device' && this.selectedElement.element === device) {
                this.showDeviceProperties(device);
            }
            return;
        }
        
        const key = this.sameDeviceKey(device);
        const targets = this.allDevices().filter(d => !d.placeholder && this.sameDeviceKey(d) === key);
        if (!targets.includes(device)) targets.push(device);
        targets.forEach(d => {
            assign(d);
            if (this.devices.includes(d)) this.renderDevice(d);
        });
        
        const template = this.deviceTemplates.find(t => !t.placeholder && this.sameDeviceKey(t) === key);
        if (template) {
            assign(template);
            this.saveLibrary();
        }
        
        this.markSelectedDevice(device);
        if (this.selectedElement?.type === 'device' && this.selectedElement.element === device) {
            this.showDeviceProperties(device);
        }
    },

    findTemplateIndexForDevice(device) {
        const key = this.sameDeviceKey(device);
        let idx = this.deviceTemplates.findIndex(t => !t.placeholder && this.sameDeviceKey(t) === key);
        if (idx < 0 && device.origin) {
            const okey = this.sameDeviceKey(device.origin);
            idx = this.deviceTemplates.findIndex(t => !t.placeholder && this.sameDeviceKey(t) === okey);
        }
        if (idx < 0) idx = this.deviceTemplates.findIndex(t => !t.placeholder && t.name === device.name);
        return idx;
    },

    openDeviceTemplateEditor(device) {
        this.selectElement(device, 'device');
        const idx = device.placeholder ? -1 : this.findTemplateIndexForDevice(device);
        if (idx < 0) {
            this.focusPropertiesPanel();
            return;
        }
        const template = this.deviceTemplates[idx];
        const search = document.getElementById('manageDeviceSearch');
        if (search) search.value = template.name;
        this.renderManageDevicesList();
        this.editingTemplateBefore = { name: template.name, type: template.type, article: template.article || '', group: template.group || 'other', color: template.color };
        this.showDeviceModal(template, idx);
    },

    propagateTemplateChange(before, template) {
        if (!before) return;
        this.recordHistory();
        const key = this.sameDeviceKey(before);
        const changes = { name: template.name, type: template.type, article: template.article || '', group: template.group || 'other', color: template.color };
        this.allDevices().forEach(d => {
            if (d.placeholder || this.sameDeviceKey(d) !== key) return;
            Object.assign(d, changes);
            d.origin = { ...changes };
            if (this.devices.includes(d)) this.renderDevice(d);
        });
        if (this.selectedElement?.type === 'device') {
            this.markSelectedDevice(this.selectedElement.element);
            this.showDeviceProperties(this.selectedElement.element);
        }
    },

    resetDevice(device) {
        let origin = device.origin;
        if (!origin) {
            const template = this.deviceTemplates.find(t => this.sameDeviceKey(t) === this.sameDeviceKey(device));
            if (template) origin = { name: template.name, type: template.type, article: template.article || '', group: template.group || 'other', color: template.color };
        }
        if (!origin) {
            alert('Für dieses Gerät sind keine Ursprungswerte bekannt.');
            return;
        }
        this.applyDeviceChange(device, { ...origin }, { local: true });
    },

    hideDeviceContextMenu() {
        document.getElementById('deviceContextMenu')?.remove();
    },

    showDeviceContextMenu(device, clientX, clientY) {
        this.hideDeviceContextMenu();
        
        const menu = document.createElement('div');
        menu.id = 'deviceContextMenu';
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-menu-title">${this.escapeHtml(device.name)}${device.placeholder ? ' <span class="context-menu-tag">Platzhalter</span>' : ''}</div>
            <button type="button" data-action="properties">Geräteeigenschaften öffnen</button>
            <div class="menu-separator"></div>
            <div class="context-menu-sub">
                <button type="button" class="context-menu-sub-trigger">Gruppe <span class="context-menu-arrow">▸</span></button>
                <div class="context-menu-sub-panel">
                    ${this.groups.map(g => `<button type="button" data-action="group" data-group="${this.escapeHtml(g.id)}" class="${g.id === device.group ? 'active' : ''}"><span class="context-menu-swatch" style="background:${this.escapeHtml(g.color || '#95a5a6')}"></span>${this.escapeHtml(g.name)}</button>`).join('')}
                </div>
            </div>
            <label class="context-menu-color">Farbe <input type="color" id="ctxDeviceColor" value="${this.escapeHtml(device.color || '#3498db')}"></label>
            <div class="menu-separator"></div>
            <button type="button" data-action="reset">Zurücksetzen</button>
            <button type="button" data-action="delete" class="danger">Löschen</button>
        `;
        document.body.appendChild(menu);
        
        const pad = 8;
        const rect = menu.getBoundingClientRect();
        const left = Math.min(clientX, window.innerWidth - rect.width - pad);
        const top = Math.min(clientY, window.innerHeight - rect.height - pad);
        menu.style.left = `${Math.max(pad, left)}px`;
        menu.style.top = `${Math.max(pad, top)}px`;
        
        menu.addEventListener('contextmenu', (e) => e.preventDefault());
        menu.addEventListener('mousedown', (e) => e.stopPropagation());
        
        menu.querySelector('#ctxDeviceColor').addEventListener('input', (e) => {
            this.applyDeviceChange(device, { color: e.target.value }, { local: true, merge: `device-color-${device.id}` });
        });
        
        menu.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'properties') {
                    this.openDeviceTemplateEditor(device);
                } else if (action === 'group') {
                    this.applyDeviceChange(device, { group: btn.dataset.group }, { local: true });
                } else if (action === 'reset') {
                    this.resetDevice(device);
                } else if (action === 'delete') {
                    this.selectElement(device, 'device');
                    this.deleteSelected();
                }
                this.hideDeviceContextMenu();
            });
        });
    },

    showConnectionProperties(conn) {
        const fromDevice = this.devices.find(d => d.id === conn.fromDevice);
        const toDevice = this.devices.find(d => d.id === conn.toDevice);
        const fromPort = fromDevice.outputs.find(p => p.id === conn.fromPort);
        const toPort = toDevice.inputs.find(p => p.id === conn.toPort);
        
        const panel = document.getElementById('propertiesPanel');
        panel.innerHTML = `
            <p><strong>Von:</strong> ${fromDevice.name} → ${fromPort.name}${fromPort.cable ? ` (${fromPort.cable})` : ''}</p>
            <p><strong>Nach:</strong> ${toDevice.name} → ${toPort.name}${toPort.cable ? ` (${toPort.cable})` : ''}</p>
            <hr>
            <label>Bezeichnung: <input type="text" id="propConnName" value="${conn.name || ''}" placeholder="z.B. Mic Sänger"></label>
            <label>Kabeltyp:
                <select id="propCableType">
                    ${this.cableOptionsHtml(conn.cableType)}
                </select>
            </label>
            <label>Kabellänge (m): <input type="number" id="propCableLength" value="${conn.length || ''}" min="0" step="0.5" placeholder="z.B. 5"></label>
            <label>Textfarbe:</label>
            <div class="color-swatches" id="propLabelColor">
                ${this.labelColors.map(c => `<button type="button" class="color-swatch${(conn.labelColor || this.labelColors[0].value) === c.value ? ' active' : ''}" data-color="${c.value}" style="background:${c.value}" title="${c.name}"></button>`).join('')}
            </div>
            <label>Linienfarbe:</label>
            <div class="color-swatches" id="propLineColor">
                ${this.lineColors.map(c => `<button type="button" class="color-swatch${(conn.lineColor || this.lineColors[0].value) === c.value ? ' active' : ''}" data-color="${c.value}" style="background:${c.value}" title="${c.name}"></button>`).join('')}
            </div>
            <button id="btnResetCurve" class="btn-secondary">Kurve zurücksetzen</button>
            <button id="btnDeleteConnection" class="btn-danger">Verbindung löschen</button>
        `;
        
        panel.querySelector('#propConnName').addEventListener('input', (e) => {
            this.recordHistory({ merge: `conn-name-${conn.id}` });
            conn.name = e.target.value;
            this.renderConnection(conn);
        });
        panel.querySelectorAll('#propLabelColor .color-swatch').forEach(btn => {
            btn.addEventListener('click', () => {
                this.recordHistory();
                conn.labelColor = btn.dataset.color;
                panel.querySelectorAll('#propLabelColor .color-swatch').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderConnection(conn);
            });
        });
        panel.querySelectorAll('#propLineColor .color-swatch').forEach(btn => {
            btn.addEventListener('click', () => {
                this.recordHistory();
                conn.lineColor = btn.dataset.color;
                panel.querySelectorAll('#propLineColor .color-swatch').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderConnection(conn);
            });
        });
        panel.querySelector('#propCableType').addEventListener('change', (e) => {
            this.recordHistory();
            conn.cableType = e.target.value;
            this.renderConnection(conn);
        });
        panel.querySelector('#propCableLength').addEventListener('change', (e) => {
            this.recordHistory();
            conn.length = e.target.value;
            this.renderConnection(conn);
        });
        panel.querySelector('#btnResetCurve').addEventListener('click', () => {
            if (!conn.waypoints) return;
            this.recordHistory();
            delete conn.waypoints;
            this.renderConnection(conn);
        });
        panel.querySelector('#btnDeleteConnection').addEventListener('click', () => this.deleteSelected());
    },

    showDeviceModal(prefill = null, editIndex = null) {
        this.editingTemplateIndex = editIndex;
        this.updateDeviceGroupSelect();
        document.getElementById('deviceModal').classList.add('active');
        document.getElementById('deviceModalTitle').textContent = prefill ? 'Gerät bearbeiten' : 'Neues Gerät erstellen';
        document.getElementById('btnSubmitDevice').textContent = prefill ? 'Speichern' : 'Erstellen';
        
        document.getElementById('deviceStep1').style.display = 'block';
        document.getElementById('deviceForm').style.display = 'none';
        
        document.getElementById('deviceName').value = prefill?.name || '';
        document.getElementById('deviceArticle').value = prefill?.article || '';
        document.getElementById('deviceType').value = prefill?.type || '';
        const groupSelect = document.getElementById('deviceGroup');
        groupSelect.value = prefill?.group || this.groups[0].id;
        document.getElementById('deviceColor').value = prefill?.color || this.groupColor(groupSelect.value);
        document.getElementById('deviceInputCount').value = prefill?.inputs?.length || 2;
        document.getElementById('deviceOutputCount').value = prefill?.outputs?.length || 2;
        
        const placeholderRow = document.getElementById('devicePlaceholderRow');
        const placeholderCheck = document.getElementById('chkDevicePlaceholder');
        const isEditing = editIndex !== null && editIndex !== undefined;
        placeholderRow.style.display = isEditing ? 'none' : '';
        placeholderCheck.checked = !isEditing && !!prefill?.placeholder;
        
        this.devicePrefill = prefill;
    },

    deviceModalNext() {
        const name = document.getElementById('deviceName').value.trim();
        if (!name) {
            alert('Bitte geben Sie einen Gerätenamen ein.');
            return;
        }
        
        const inputCount = parseInt(document.getElementById('deviceInputCount').value) || 0;
        const outputCount = parseInt(document.getElementById('deviceOutputCount').value) || 0;
        
        document.getElementById('deviceStep1').style.display = 'none';
        document.getElementById('deviceForm').style.display = 'block';
        
        document.getElementById('deviceStep2Info').innerHTML = `
            <strong>${name}</strong> — ${inputCount} Eingänge, ${outputCount} Ausgänge
        `;
        
        const inputsList = document.getElementById('inputsList');
        const outputsList = document.getElementById('outputsList');
        inputsList.innerHTML = '';
        outputsList.innerHTML = '';
        
        for (let i = 0; i < inputCount; i++) {
            const defaultName = this.devicePrefill?.inputs?.[i] || `IN ${i + 1}`;
            this.addIONameField('inputsList', i + 1, defaultName, this.devicePrefill?.inputCables?.[i] || '');
        }
        
        for (let i = 0; i < outputCount; i++) {
            const defaultName = this.devicePrefill?.outputs?.[i] || `OUT ${i + 1}`;
            this.addIONameField('outputsList', i + 1, defaultName, this.devicePrefill?.outputCables?.[i] || '');
        }
    },

    deviceModalBack() {
        document.getElementById('deviceStep1').style.display = 'block';
        document.getElementById('deviceForm').style.display = 'none';
    },

    addIONameField(containerId, number, value = '', cable = '') {
        const container = document.getElementById(containerId);
        const div = document.createElement('div');
        div.className = 'io-name-field';
        div.innerHTML = `
            <span class="io-number">${number}.</span>
            <input type="text" class="io-name" value="${value}" placeholder="${containerId === 'inputsList' ? 'Eingang' : 'Ausgang'} ${number}">
            <select class="io-cable" title="Kabeltyp für diesen Anschluss">${this.cableOptionsHtml(cable)}</select>
        `;
        container.appendChild(div);
    },

    cableOptionsHtml(selected = '') {
        return ['', ...this.cableTypes]
            .map(t => `<option value="${t}" ${t === selected ? 'selected' : ''}>${t || '-- Kabel --'}</option>`)
            .join('');
    },

    hideDeviceModal() {
        document.getElementById('deviceModal').classList.remove('active');
        this.devicePrefill = null;
        this.editingTemplateIndex = null;
        this.editingTemplateBefore = null;
    },

    updateDeviceGroupSelect() {
        const select = document.getElementById('deviceGroup');
        const current = select.value;
        select.innerHTML = this.groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
        if (this.groups.some(g => g.id === current)) select.value = current;
    },

    showDeviceManageModal() {
        document.getElementById('deviceManageModal').classList.add('active');
        this.renderManageDevicesList();
    },

    hideDeviceManageModal() {
        document.getElementById('deviceManageModal').classList.remove('active');
    },

    renderManageDevicesList() {
        const list = document.getElementById('manageDevicesList');
        const search = document.getElementById('manageDeviceSearch').value.toLowerCase().trim();
        list.innerHTML = '';
        
        const entries = this.deviceTemplates
            .map((t, idx) => ({ t, idx }))
            .filter(({ t }) => {
                if (!search) return true;
                return [t.name, t.type, t.article].join(' ').toLowerCase().includes(search);
            });
        
        if (entries.length === 0) {
            list.innerHTML = '<p class="hint">Keine Geräte gefunden.</p>';
            return;
        }
        
        entries.forEach(({ t, idx }) => {
            const group = this.groups.find(g => g.id === t.group);
            const div = document.createElement('div');
            div.className = 'manage-item';
            div.innerHTML = `
                <div class="manage-color" style="background:${t.color || (group && group.color) || '#95a5a6'}"></div>
                <div class="manage-main">
                    <div class="manage-name">${t.name}</div>
                    <div class="manage-meta">${[t.type, t.article, group ? group.name : 'Sonstiges'].filter(v => v).join(' · ')} — ${t.inputs.length} In / ${t.outputs.length} Out</div>
                </div>
                <button type="button" class="btn-add-canvas">In Plan</button>
                <button type="button" class="btn-export">Export</button>
                <button type="button" class="btn-edit">Bearbeiten</button>
                <button type="button" class="btn-delete">Löschen</button>
            `;
            div.querySelector('.btn-export').addEventListener('click', () => {
                this.exportDevicesExcel([t], `Gerät_${t.name}`);
            });
            div.querySelector('.btn-add-canvas').addEventListener('click', () => {
                this.addDeviceToCanvas(t, 150, 100);
                this.hideDeviceManageModal();
            });
            div.querySelector('.btn-edit').addEventListener('click', () => {
                this.hideDeviceManageModal();
                this.editingTemplateBefore = { name: t.name, type: t.type, article: t.article || '', group: t.group || 'other', color: t.color };
                this.showDeviceModal(t, idx);
            });
            div.querySelector('.btn-delete').addEventListener('click', () => {
                if (!confirm(`Gerät "${t.name}" aus der Bibliothek löschen?`)) return;
                this.deviceTemplates.splice(idx, 1);
                this.saveLibrary();
                this.renderDeviceLibrary();
                this.renderManageDevicesList();
            });
            list.appendChild(div);
        });
    },

    showCableModal() {
        document.getElementById('cableModal').classList.add('active');
        this.renderCablesList();
    },

    hideCableModal() {
        document.getElementById('cableModal').classList.remove('active');
    },

    checkConnectionLengths() {
        const missing = this.connections.filter(c => !c.length || parseFloat(c.length) <= 0);
        if (missing.length === 0) {
            alert('Alle Verbindungen haben eine Kabellänge.');
            return;
        }
        this.showMissingLengthsModal(missing);
    },

    showMissingLengthsModal(missing) {
        document.getElementById('missingLengthsModal').classList.add('active');
        this.renderMissingLengthsList(missing);
    },

    hideMissingLengthsModal() {
        document.getElementById('missingLengthsModal').classList.remove('active');
    },

    renderMissingLengthsList(missing) {
        const list = document.getElementById('missingLengthsList');
        list.innerHTML = '';
        const hint = document.getElementById('missingLengthsHint');
        hint.textContent = `${missing.length} Verbindung(en) ohne Kabellänge. Länge eintragen und speichern.`;

        missing.forEach(conn => {
            const fromDevice = this.devices.find(d => d.id === conn.fromDevice);
            const toDevice = this.devices.find(d => d.id === conn.toDevice);
            const fromPort = fromDevice?.outputs.find(p => p.id === conn.fromPort);
            const toPort = toDevice?.inputs.find(p => p.id === conn.toPort);
            const div = document.createElement('div');
            div.className = 'manage-item missing-length-item';
            div.innerHTML = `
                <div class="missing-length-route">
                    <div class="missing-length-endpoint">
                        <span class="missing-length-device">${fromDevice?.name || '?'}</span>
                        <span class="missing-length-port">${fromPort?.name || '?'}</span>
                    </div>
                    <span class="missing-length-arrow">⟶</span>
                    <div class="missing-length-endpoint">
                        <span class="missing-length-device">${toDevice?.name || '?'}</span>
                        <span class="missing-length-port">${toPort?.name || '?'}</span>
                    </div>
                    ${conn.name ? `<span class="missing-length-name">${conn.name}</span>` : ''}
                </div>
                <div class="missing-length-controls">
                    <label class="missing-length-field">
                        <input type="number" class="manage-input missing-length-input" min="0" step="0.5" placeholder="Länge">
                        <span class="missing-length-unit">m</span>
                    </label>
                    <button type="button" class="btn-jump-connection">Anzeigen</button>
                </div>
            `;
            const input = div.querySelector('.missing-length-input');
            input.dataset.connId = conn.id;
            input.addEventListener('keydown', e => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                const all = Array.from(list.querySelectorAll('.missing-length-input'));
                const next = all[all.indexOf(input) + 1];
                if (next) next.focus(); else this.saveMissingLengths();
            });
            div.querySelector('.btn-jump-connection').addEventListener('click', () => {
                this.hideMissingLengthsModal();
                this.selectElement(conn, 'connection');
            });
            list.appendChild(div);
        });
    },

    saveMissingLengths() {
        const inputs = document.querySelectorAll('#missingLengthsList .missing-length-input');
        let saved = 0;
        this.recordHistory();
        inputs.forEach(input => {
            const value = input.value.trim();
            if (!value) return;
            const conn = this.connections.find(c => c.id === input.dataset.connId);
            if (!conn) return;
            conn.length = value;
            this.renderConnection(conn);
            saved++;
        });
        if (saved === 0) {
            alert('Bitte mindestens eine Kabellänge eintragen.');
            return;
        }
        const stillMissing = this.connections.filter(c => !c.length || parseFloat(c.length) <= 0);
        if (stillMissing.length === 0) {
            this.hideMissingLengthsModal();
            alert('Alle Kabellängen wurden gespeichert.');
        } else {
            this.renderMissingLengthsList(stillMissing);
        }
    },

    renderCablesList() {
        const list = document.getElementById('cablesList');
        list.innerHTML = '';
        
        const search = (document.getElementById('cableSearch')?.value || '').toLowerCase().trim();
        const entries = this.cableTypes
            .map((cable, idx) => ({ cable, idx }))
            .filter(({ cable }) => !search || cable.toLowerCase().includes(search));
        
        if (entries.length === 0) {
            list.innerHTML = '<p class="hint">Keine Kabel gefunden.</p>';
            return;
        }
        
        entries.forEach(({ cable, idx }) => {
            const usage = this.connections.filter(c => c.cableType === cable).length;
            const div = document.createElement('div');
            div.className = 'manage-item';
            div.innerHTML = `
                <input type="text" class="manage-input" value="${cable}">
                <span class="manage-meta">${usage}× verwendet</span>
                <button type="button" class="btn-delete">Löschen</button>
            `;
            const input = div.querySelector('.manage-input');
            input.addEventListener('change', () => {
                const newName = input.value.trim();
                if (!newName) {
                    input.value = cable;
                    return;
                }
                this.renameCable(cable, newName);
            });
            div.querySelector('.btn-delete').addEventListener('click', () => {
                if (usage > 0 && !confirm(`"${cable}" wird ${usage}× verwendet. Trotzdem löschen? Die Zuordnung wird entfernt.`)) return;
                this.cableTypes.splice(idx, 1);
                this.connections.forEach(c => {
                    if (c.cableType === cable) {
                        c.cableType = '';
                        this.renderConnection(c);
                    }
                });
                this.clearPortCable(cable);
                this.saveLibrary();
                this.renderCablesList();
            });
            list.appendChild(div);
        });
    },

    renameCable(oldName, newName) {
        const idx = this.cableTypes.indexOf(oldName);
        if (idx === -1) return;
        this.cableTypes[idx] = newName;
        
        this.connections.forEach(c => {
            if (c.cableType === oldName) {
                c.cableType = newName;
                this.renderConnection(c);
            }
        });
        
        this.devices.forEach(d => {
            [...d.inputs, ...d.outputs].forEach(p => {
                if (p.cable === oldName) p.cable = newName;
            });
        });
        
        this.deviceTemplates.forEach(t => {
            ['inputCables', 'outputCables'].forEach(key => {
                if (!t[key]) return;
                t[key] = t[key].map(c => (c === oldName ? newName : c));
            });
        });
        
        this.saveLibrary();
        this.renderCablesList();
    },

    clearPortCable(cable) {
        this.devices.forEach(d => {
            [...d.inputs, ...d.outputs].forEach(p => {
                if (p.cable === cable) p.cable = '';
            });
        });
        this.deviceTemplates.forEach(t => {
            ['inputCables', 'outputCables'].forEach(key => {
                if (!t[key]) return;
                t[key] = t[key].map(c => (c === cable ? '' : c));
            });
        });
    },

    addCable() {
        const input = document.getElementById('newCableName');
        const name = input.value.trim();
        if (!name) return;
        if (this.cableTypes.includes(name)) {
            alert('Dieser Kabeltyp existiert bereits.');
            return;
        }
        this.cableTypes.push(name);
        input.value = '';
        this.saveLibrary();
        this.renderCablesList();
    },

    parsePortList(value) {
        const names = [];
        const cables = [];
        value.split(',').map(s => s.trim()).filter(s => s).forEach(entry => {
            const parts = entry.split(':');
            const portName = parts[0].trim();
            const cable = (parts[1] || '').trim();
            if (!portName) return;
            names.push(portName);
            cables.push(cable);
            if (cable && !this.cableTypes.includes(cable)) this.cableTypes.push(cable);
        });
        return { names, cables };
    },

    showGroupModal() {
        document.getElementById('groupModal').classList.add('active');
        this.renderGroupsList();
    },

    hideGroupModal() {
        document.getElementById('groupModal').classList.remove('active');
    },

    renderGroupsList() {
        const list = document.getElementById('groupsList');
        list.innerHTML = '';
        
        const search = (document.getElementById('groupSearch')?.value || '').toLowerCase().trim();
        const entries = this.groups
            .map((group, idx) => ({ group, idx }))
            .filter(({ group }) => !search || group.name.toLowerCase().includes(search));
        
        if (entries.length === 0) {
            list.innerHTML = '<p class="hint">Keine Gruppen gefunden.</p>';
            return;
        }
        
        entries.forEach(({ group, idx }) => {
            const count = this.deviceTemplates.filter(t => t.group === group.id).length;
            const div = document.createElement('div');
            div.className = 'manage-item';
            div.innerHTML = `
                <input type="color" class="group-color-input" value="${group.color}" title="Farbe">
                <input type="text" class="manage-input" value="${group.name}">
                <span class="manage-meta">${count} Geräte</span>
                <button type="button" class="btn-delete">Löschen</button>
            `;
            
            const colorInput = div.querySelector('.group-color-input');
            colorInput.addEventListener('change', () => {
                group.color = colorInput.value;
                this.saveLibrary();
                this.updateGroupFilter();
                this.renderDeviceLibrary();
            });
            
            const nameInput = div.querySelector('.manage-input');
            nameInput.addEventListener('change', () => {
                const newName = nameInput.value.trim();
                if (!newName) {
                    nameInput.value = group.name;
                    return;
                }
                group.name = newName;
                this.saveLibrary();
                this.updateGroupFilter();
                this.updateDeviceGroupSelect();
                this.renderDeviceLibrary();
                this.renderGroupsList();
            });
            
            div.querySelector('.btn-delete').addEventListener('click', () => {
                if (this.groups.length <= 1) {
                    alert('Die letzte Gruppe kann nicht gelöscht werden.');
                    return;
                }
                if (!confirm(`Gruppe "${group.name}" löschen?${count > 0 ? ` ${count} Geräte werden nach "Sonstiges" verschoben.` : ''}`)) return;
                
                const fallback = this.groups.find(g => g.id !== group.id);
                this.deviceTemplates.forEach(t => {
                    if (t.group === group.id) t.group = fallback.id;
                });
                this.groups.splice(idx, 1);
                this.saveLibrary();
                
                this.updateGroupFilter();
                this.updateDeviceGroupSelect();
                this.renderGroupsList();
                this.renderDeviceLibrary();
            });
            
            list.appendChild(div);
        });
    },

    addGroup() {
        const nameInput = document.getElementById('newGroupName');
        const colorInput = document.getElementById('newGroupColor');
        const name = nameInput.value.trim();
        if (!name) return;
        
        const id = name.toLowerCase().replace(/\s+/g, '_');
        if (this.groups.some(g => g.id === id)) {
            alert('Diese Gruppe existiert bereits.');
            return;
        }
        
        this.groups.push({ id, name, color: colorInput.value });
        this.saveLibrary();
        this.updateGroupFilter();
        this.updateDeviceGroupSelect();
        this.renderDeviceLibrary();
        
        nameInput.value = '';
        const searchInput = document.getElementById('groupSearch');
        if (searchInput) searchInput.value = '';
        this.renderGroupsList();
    },

    addIOField(type, containerId, value = '', cable = '') {
        const container = document.getElementById(containerId);
        const div = document.createElement('div');
        div.className = 'io-item';
        div.innerHTML = `
            <input type="text" placeholder="${type === 'input' ? 'Eingang' : 'Ausgang'} Name" class="io-name" value="${value}">
            <select class="io-cable" title="Kabeltyp für diesen Anschluss">${this.cableOptionsHtml(cable)}</select>
            <button type="button" class="remove-io">×</button>
        `;
        div.querySelector('.remove-io').addEventListener('click', () => div.remove());
        container.appendChild(div);
    },

    createDeviceFromForm(e) {
        e.preventDefault();
        
        const name = document.getElementById('deviceName').value;
        const article = document.getElementById('deviceArticle').value;
        const type = document.getElementById('deviceType').value;
        const group = document.getElementById('deviceGroup').value;
        const color = document.getElementById('deviceColor').value;
        
        const collect = (containerId) => {
            const names = [];
            const cables = [];
            document.querySelectorAll(`#${containerId} .io-name-field`).forEach(row => {
                const portName = row.querySelector('.io-name').value.trim();
                if (!portName) return;
                names.push(portName);
                cables.push(row.querySelector('.io-cable')?.value || '');
            });
            return { names, cables };
        };
        
        const inputData = collect('inputsList');
        const outputData = collect('outputsList');
        
        const template = {
            name, article, type, group, color,
            inputs: inputData.names,
            outputs: outputData.names,
            inputCables: inputData.cables,
            outputCables: outputData.cables
        };
        
        if (this.editingTemplateIndex !== null && this.editingTemplateIndex !== undefined) {
            this.deviceTemplates[this.editingTemplateIndex] = template;
            this.editingTemplateIndex = null;
            this.propagateTemplateChange(this.editingTemplateBefore, template);
            this.editingTemplateBefore = null;
            this.saveLibrary();
            this.renderDeviceLibrary();
            this.hideDeviceModal();
            this.showDeviceManageModal();
            return;
        }
        
        if (document.getElementById('chkDevicePlaceholder').checked) {
            template.placeholder = true;
            if (!template.color) template.color = this.groupColor(template.group);
            this.addDeviceToCanvas(template, 150, 100);
            this.hideDeviceModal();
            return;
        }
        
        this.addDeviceTemplate(template);
        this.addDeviceToCanvas(template, 150, 100);
        this.hideDeviceModal();
    },

    importDevices(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.pdf')) {
            this.importPdfDatasheet(file);
        } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
            this.importExcelDevices(file);
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                this.parseDeviceFile(text);
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    },

    async importPdfDatasheet(file) {
        document.getElementById('pdfImportModal').classList.add('active');
        document.getElementById('pdfAnalysisStatus').style.display = 'block';
        document.getElementById('pdfDeviceForm').style.display = 'none';
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            const deviceInfo = this.analyzeDatasheet(fullText, file.name);
            this.showPdfDeviceForm(deviceInfo);
            
        } catch (err) {
            console.error('PDF Analyse Fehler:', err);
            alert('Fehler beim Analysieren des PDFs: ' + err.message);
            this.hidePdfImportModal();
        }
    },

    analyzeDatasheet(text, filename) {
        const textLower = text.toLowerCase();
        
        let name = '';
        const modelPatterns = [
            /model[:\s]+([A-Z0-9][\w\-\.]+)/i,
            /product[:\s]+([A-Z0-9][\w\-\.]+)/i,
            /([A-Z]{2,}[\-\s]?[A-Z0-9]{2,}[\-\s]?[A-Z0-9]*)/,
        ];
        for (const pattern of modelPatterns) {
            const match = text.match(pattern);
            if (match) {
                name = match[1].trim();
                break;
            }
        }
        if (!name) {
            name = filename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
        }
        
        let article = '';
        const articlePatterns = [
            /art\.?\s*(?:nr\.?|nummer|#)[:\s]*([A-Z0-9\-]+)/i,
            /order\s*(?:code|number)[:\s]*([A-Z0-9\-]+)/i,
            /sku[:\s]*([A-Z0-9\-]+)/i,
            /p\/n[:\s]*([A-Z0-9\-]+)/i
        ];
        for (const pattern of articlePatterns) {
            const match = text.match(pattern);
            if (match) {
                article = match[1].trim();
                break;
            }
        }
        
        let type = '';
        const typeKeywords = {
            'mixer': 'Mixer',
            'mischpult': 'Mixer',
            'console': 'Console',
            'amplifier': 'Amplifier',
            'verstärker': 'Amplifier',
            'endstufe': 'Amplifier',
            'speaker': 'Speaker',
            'lautsprecher': 'Speaker',
            'microphone': 'Microphone',
            'mikrofon': 'Microphone',
            'processor': 'Processor',
            'dsp': 'DSP',
            'camera': 'Camera',
            'kamera': 'Camera',
            'projector': 'Projector',
            'projektor': 'Projector',
            'display': 'Display',
            'monitor': 'Monitor',
            'receiver': 'Receiver',
            'transmitter': 'Transmitter',
            'interface': 'Interface',
            'converter': 'Converter',
            'switch': 'Switch',
            'router': 'Router',
            'dimmer': 'Dimmer',
            'moving head': 'Moving Head',
            'led': 'LED Fixture'
        };
        for (const [keyword, typeValue] of Object.entries(typeKeywords)) {
            if (textLower.includes(keyword)) {
                type = typeValue;
                break;
            }
        }
        
        let group = 'other';
        const audioKeywords = ['audio', 'sound', 'speaker', 'microphone', 'mixer', 'amplifier', 'xlr', 'mic', 'lautsprecher'];
        const videoKeywords = ['video', 'camera', 'display', 'projector', 'hdmi', 'sdi', '4k', 'monitor', 'screen'];
        const lightKeywords = ['light', 'lighting', 'dmx', 'led', 'fixture', 'dimmer', 'spot', 'wash', 'moving'];
        const controlKeywords = ['control', 'automation', 'processor', 'crestron', 'amx', 'extron'];
        
        if (audioKeywords.some(k => textLower.includes(k))) group = 'audio';
        else if (videoKeywords.some(k => textLower.includes(k))) group = 'video';
        else if (lightKeywords.some(k => textLower.includes(k))) group = 'light';
        else if (controlKeywords.some(k => textLower.includes(k))) group = 'control';
        
        const inputs = [];
        const outputs = [];
        
        const inputPatterns = [
            /(\d+)\s*(?:x\s*)?(?:xlr|line|mic|analog|digital|aes|sdi|hdmi)?\s*input/gi,
            /input[s]?[:\s]*(\d+)/gi,
            /(\d+)\s*(?:eingäng|eingang)/gi
        ];
        const outputPatterns = [
            /(\d+)\s*(?:x\s*)?(?:xlr|line|analog|digital|aes|sdi|hdmi)?\s*output/gi,
            /output[s]?[:\s]*(\d+)/gi,
            /(\d+)\s*(?:ausgäng|ausgang)/gi
        ];
        
        const connectorTypes = [];
        const connectorPatterns = [
            { pattern: /xlr/gi, name: 'XLR' },
            { pattern: /hdmi/gi, name: 'HDMI' },
            { pattern: /sdi/gi, name: 'SDI' },
            { pattern: /usb/gi, name: 'USB' },
            { pattern: /ethernet|rj45/gi, name: 'Ethernet' },
            { pattern: /dmx/gi, name: 'DMX' },
            { pattern: /aes/gi, name: 'AES' },
            { pattern: /dante/gi, name: 'Dante' }
        ];
        
        for (const { pattern, name } of connectorPatterns) {
            if (pattern.test(text)) {
                connectorTypes.push(name);
            }
        }
        
        let inputCount = 2, outputCount = 2;
        for (const pattern of inputPatterns) {
            const match = text.match(pattern);
            if (match) {
                const num = parseInt(match[1]);
                if (num > 0 && num <= 64) inputCount = num;
                break;
            }
        }
        for (const pattern of outputPatterns) {
            const match = text.match(pattern);
            if (match) {
                const num = parseInt(match[1]);
                if (num > 0 && num <= 64) outputCount = num;
                break;
            }
        }
        
        const connType = connectorTypes[0] || 'CH';
        for (let i = 1; i <= Math.min(inputCount, 8); i++) {
            inputs.push(`${connType} IN ${i}`);
        }
        for (let i = 1; i <= Math.min(outputCount, 8); i++) {
            outputs.push(`${connType} OUT ${i}`);
        }
        
        const groupInfo = this.groups.find(g => g.id === group);
        const color = groupInfo?.color || '#4d49bc';
        
        return { name, article, type, group, color, inputs, outputs };
    },

    showPdfDeviceForm(deviceInfo) {
        document.getElementById('pdfAnalysisStatus').style.display = 'none';
        document.getElementById('pdfDeviceForm').style.display = 'block';
        
        document.getElementById('pdfDeviceName').value = deviceInfo.name;
        document.getElementById('pdfDeviceArticle').value = deviceInfo.article;
        document.getElementById('pdfDeviceType').value = deviceInfo.type;
        document.getElementById('pdfDeviceGroup').value = deviceInfo.group;
        document.getElementById('pdfDeviceColor').value = this.groupColor(deviceInfo.group);
        
        document.getElementById('pdfInputsList').innerHTML = '';
        document.getElementById('pdfOutputsList').innerHTML = '';
        
        deviceInfo.inputs.forEach(name => this.addIOField('input', 'pdfInputsList', name));
        deviceInfo.outputs.forEach(name => this.addIOField('output', 'pdfOutputsList', name));
        
        if (deviceInfo.inputs.length === 0) this.addIOField('input', 'pdfInputsList');
        if (deviceInfo.outputs.length === 0) this.addIOField('output', 'pdfOutputsList');
    },

    createDeviceFromPdfForm(e) {
        e.preventDefault();
        
        const name = document.getElementById('pdfDeviceName').value;
        const article = document.getElementById('pdfDeviceArticle').value;
        const type = document.getElementById('pdfDeviceType').value;
        const group = document.getElementById('pdfDeviceGroup').value;
        const color = document.getElementById('pdfDeviceColor').value;
        
        const collect = (containerId) => {
            const names = [];
            const cables = [];
            document.querySelectorAll(`#${containerId} .io-item`).forEach(row => {
                const portName = row.querySelector('.io-name').value.trim();
                if (!portName) return;
                names.push(portName);
                cables.push(row.querySelector('.io-cable')?.value || '');
            });
            return { names, cables };
        };
        
        const inputData = collect('pdfInputsList');
        const outputData = collect('pdfOutputsList');
        
        const template = {
            name, article, type, group, color,
            inputs: inputData.names,
            outputs: outputData.names,
            inputCables: inputData.cables,
            outputCables: outputData.cables
        };
        this.addDeviceTemplate(template);
        this.hidePdfImportModal();
    },

    hidePdfImportModal() {
        document.getElementById('pdfImportModal').classList.remove('active');
    },

    parseDeviceFile(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        let currentDevice = null;
        
        for (const line of lines) {
            if (line.startsWith('[') && line.endsWith(']')) {
                if (currentDevice) {
                    this.addDeviceTemplate(currentDevice);
                }
                currentDevice = {
                    name: line.slice(1, -1),
                    type: '',
                    article: '',
                    group: 'other',
                    color: '',
                    inputs: [],
                    outputs: []
                };
            } else if (currentDevice) {
                const [key, ...valueParts] = line.split('=');
                const value = valueParts.join('=').trim();
                const keyLower = key.trim().toLowerCase();
                
                if (keyLower === 'type' || keyLower === 'typ') {
                    currentDevice.type = value;
                } else if (keyLower === 'article' || keyLower === 'artikelnummer' || keyLower === 'artikelnr') {
                    currentDevice.article = value;
                } else if (keyLower === 'group' || keyLower === 'gruppe') {
                    currentDevice.group = value;
                } else if (keyLower === 'color' || keyLower === 'farbe') {
                    currentDevice.color = value;
                } else if (keyLower === 'inputs' || keyLower === 'eingänge' || keyLower === 'eingaenge') {
                    const parsed = this.parsePortList(value);
                    currentDevice.inputs = parsed.names;
                    currentDevice.inputCables = parsed.cables;
                } else if (keyLower === 'outputs' || keyLower === 'ausgänge' || keyLower === 'ausgaenge') {
                    const parsed = this.parsePortList(value);
                    currentDevice.outputs = parsed.names;
                    currentDevice.outputCables = parsed.cables;
                }
            }
        }
        
        if (currentDevice) {
            this.addDeviceTemplate(currentDevice);
        }
    }
};
