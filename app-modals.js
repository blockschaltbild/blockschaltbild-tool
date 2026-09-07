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

    showSignalCheckModal(result) {
        document.getElementById('signalCheckModal').classList.add('active');
        this.renderSignalCheckList(result);
    },

    hideSignalCheckModal() {
        document.getElementById('signalCheckModal').classList.remove('active');
    },

    renderSignalCheckList(result) {
        const list = document.getElementById('signalCheckList');
        const hint = document.getElementById('signalCheckHint');
        list.innerHTML = '';

        const errors = result.issues.filter(i => i.kind === 'error').length;
        const warnings = result.issues.filter(i => i.kind === 'warning').length;
        const parts = [`${result.checked} Verbindung(en) geprüft`];
        if (result.skipped) parts.push(`${result.skipped} mit Platzhalter übersprungen`);
        if (errors) parts.push(`${errors} Fehler`);
        if (warnings) parts.push(`${warnings} Warnung(en)`);
        if (result.inserted) parts.push(`${result.inserted} Konverter eingefügt`);
        if (result.removed) parts.push(`${result.removed} überflüssige(r) Konverter entfernt`);
        hint.textContent = parts.join(' · ') + '.';

        if (result.issues.length === 0) {
            const ok = document.createElement('div');
            ok.className = 'manage-item signal-check-item signal-check-ok';
            ok.textContent = 'Alle geprüften Verbindungen sind signaltechnisch korrekt.';
            list.appendChild(ok);
            return;
        }

        const order = { error: 0, warning: 1, info: 2 };
        const labels = { error: 'Fehler', warning: 'Warnung', info: 'Info' };
        [...result.issues].sort((a, b) => order[a.kind] - order[b.kind]).forEach(issue => {
            const d = issue.desc || this.describeConnection(issue.conn);
            const div = document.createElement('div');
            div.className = `manage-item signal-check-item signal-check-${issue.kind}`;
            div.innerHTML = `
                <div class="missing-length-route">
                    <span class="signal-check-badge">${labels[issue.kind]}</span>
                    <div class="missing-length-endpoint">
                        <span class="missing-length-device">${d.fromDevice}</span>
                        <span class="missing-length-port">${d.fromPort}</span>
                    </div>
                    <span class="missing-length-arrow">⟶</span>
                    <div class="missing-length-endpoint">
                        <span class="missing-length-device">${d.toDevice}</span>
                        <span class="missing-length-port">${d.toPort}</span>
                    </div>
                    <span class="signal-check-title">${issue.title}</span>
                    <span class="signal-check-detail">${issue.detail}${d.name ? ` (${d.name})` : ''}</span>
                </div>
                <div class="missing-length-controls">
                    <button type="button" class="btn-jump-connection"${issue.conn ? '' : ' disabled'}>Anzeigen</button>
                </div>
            `;
            if (issue.conn) {
                div.querySelector('.btn-jump-connection').addEventListener('click', () => {
                    this.hideSignalCheckModal();
                    this.jumpToConnection(issue.conn);
                });
            }
            list.appendChild(div);
        });
    },

    jumpToConnection(conn) {
        const live = this.connections.find(c => c.id === conn.id);
        if (!live) return;
        this.selectElement(live, 'connection');
        const path = document.getElementById(live.id)?.querySelector('.connection');
        const wrapper = document.querySelector('.canvas-wrapper');
        if (!path || !wrapper) return;
        const box = path.getBBox();
        const cx = (box.x + box.width / 2) * this.zoom;
        const cy = (box.y + box.height / 2) * this.zoom;
        wrapper.scrollTo({
            left: Math.max(0, cx - wrapper.clientWidth / 2),
            top: Math.max(0, cy - wrapper.clientHeight / 2),
            behavior: 'smooth'
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

    showImportChoiceModal() {
        document.getElementById('importUrlForm').style.display = 'none';
        document.getElementById('importChoiceCancelRow').style.display = '';
        document.getElementById('importChoiceModal').classList.add('active');
    },

    hideImportChoiceModal() {
        document.getElementById('importChoiceModal').classList.remove('active');
    },

    showImportUrlForm() {
        document.getElementById('importUrlForm').style.display = 'block';
        document.getElementById('importChoiceCancelRow').style.display = 'none';
        const input = document.getElementById('importUrlInput');
        input.focus();
        input.select();
    },

    // Produktseite über den Vermittler (Cloudflare Worker, Endpoint /fetch) auslesen und als Gerät vorschlagen
    async importWebsiteDevice(url) {
        if (!url) return;
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        const endpoint = (typeof BUG_REPORT_CONFIG !== 'undefined' && BUG_REPORT_CONFIG.endpoint) || '';
        if (!endpoint) {
            alert('Kein Vermittler konfiguriert (bugreport-config.js). Website-Import ist nicht möglich.');
            return;
        }
        this.hideImportChoiceModal();
        document.getElementById('pdfImportTitle').textContent = 'Gerät aus Website importieren';
        document.getElementById('pdfImportModal').classList.add('active');
        document.getElementById('pdfAnalysisStatus').style.display = 'block';
        document.getElementById('pdfAnalysisStatus').querySelector('p').textContent = 'Lese Produktseite...';
        document.getElementById('pdfDeviceForm').style.display = 'none';

        try {
            const res = await fetch(`${endpoint.replace(/\/$/, '')}/fetch?url=${encodeURIComponent(url)}`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) throw new Error(data.error || `Vermittler antwortet mit ${res.status}`);
            const deviceInfo = this.analyzeWebsiteText(data.text || '', data.title || '', data.url || url)
                || this.analyzeGenericDatasheet(data.text || '', (data.title || url) + '.pdf');
            if (!deviceInfo.name) deviceInfo.name = data.title || '';
            deviceInfo.article = '';
            this.showPdfDeviceForm(deviceInfo);
        } catch (err) {
            console.error('Website-Import Fehler:', err);
            alert('Website konnte nicht ausgelesen werden: ' + err.message);
            this.hidePdfImportModal();
        }
    },

    async importPdfDatasheet(file) {
        document.getElementById('pdfImportTitle').textContent = 'Gerät aus Datenblatt importieren';
        document.getElementById('pdfAnalysisStatus').querySelector('p').textContent = 'Analysiere Datenblatt...';
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
        const ict = this.analyzeIctDatasheet(text);
        if (ict) return ict;
        const manufacturer = this.analyzeManufacturerDatasheet(text, filename);
        if (manufacturer) return manufacturer;
        return this.analyzeGenericDatasheet(text, filename);
    },

    // Datenblätter im ICT-Format (Kopfzeile "ICT AG | ...", Abschnitte "Signaleingänge"/"Signalausgänge", "Artikelnummer")
    analyzeIctDatasheet(text) {
        const hasHeader = /ICT AG\s*\|/i.test(text);
        const hasSignals = /signaleing[äa]nge|signalausg[äa]nge/i.test(text);
        if (!hasHeader && !hasSignals) return null;

        // Gerätename: Zeile nach der ICT-Kopfzeile bzw. erste Zeile, vor "SYSTEMEIGENSCHAFTEN"/"KEY FEATURES"
        let name = '';
        const flat = text.replace(/\s+/g, ' ').trim();
        const nameMatch = flat.match(/ICT AG\s*\|.*?ict\.de\s+(.+?)\s+(?:SYSTEMEIGENSCHAFTEN|KEY FEATURES)/i)
            || flat.match(/^(.+?)\s+(?:SYSTEMEIGENSCHAFTEN|KEY FEATURES)/i);
        if (nameMatch) name = nameMatch[1];
        else name = text.split(/\r?\n/).map(l => l.trim()).find(l => l && !/^ICT AG\s*\|/i.test(l)) || '';
        name = name.replace(/\s+/g, ' ').trim();
        name = name.split(' ').map(w => /^[A-Z]{2,}$/.test(w) ? w.charAt(0) + w.slice(1).toLowerCase() : w).join(' ');

        let article = '';
        const artMatch = flat.match(/artikelnummer[\s:]{1,40}?\b(\d{5,})\b/i) || flat.match(/artikelnummer\s+artikelnummer\s+([A-Z0-9][A-Z0-9\-\.\/]*)/i);
        if (artMatch) article = artMatch[1].trim();

        // Abschnittswert bis zum nächsten bekannten Label (funktioniert auch ohne Zeilenumbrüche, wie bei pdf.js)
        const stopLabels = 'Bedienung\\/Konfiguration|Signalausg[äa]nge|Signaleing[äa]nge|Integrierte Lautsprecher|Audio\\s+(?:Integrierte|Artikelnummer)|Artikelnummer|Netzwerk|Steuerung|KEY FEATURES';
        const sectionValue = (label) => {
            const re = new RegExp(label + '\\s+([\\s\\S]*?)\\s*(?=' + stopLabels + '|$)', 'i');
            const m = flat.match(re);
            return m ? m[1].trim() : '';
        };
        const inputsRaw = sectionValue('Signaleing[äa]nge');
        const outputsRaw = sectionValue('Signalausg[äa]nge');

        const controlRaw = sectionValue('Bedienung\\/Konfiguration');

        const inputs = [], outputs = [], inputCables = [], outputCables = [];
        const parsed = this.parseIctConnectorList(inputsRaw, 'IN');
        parsed.forEach(p => { inputs.push(p.name); inputCables.push(p.cable); });
        this.parseIctConnectorList(outputsRaw, 'OUT').forEach(p => { outputs.push(p.name); outputCables.push(p.cable); });
        // RJ45/LAN-Schnittstelle ist immer relevant (Steuerung/Netzwerk) – auch bei Tippfehlern wie "RJ52"
        if (/rj\s*-?\d{2}|ethernet|\blan\b|netzwerk/i.test(controlRaw)) {
            inputs.push('LAN');
            inputCables.push(this.matchCableType('Cat5/6'));
        }

        let type = 'Gerät';
        let group = 'video';
        const tl = text.toLowerCase();
        const isDisplay = /bildschirmdiagonale|native bildaufl[öo]sung|display\s*\n/i.test(text);
        if (isDisplay && /touch/i.test(text)) type = 'Touchdisplay';
        else if (isDisplay) type = 'Monitor';
        else if (tl.includes('projektor') || tl.includes('projector') || tl.includes('lichtstrom')) type = 'Projector';
        else if (tl.includes('kamera') || tl.includes('camera')) type = 'Camera';
        else if (tl.includes('lautsprecher') && !/integrierte lautsprecher\s+-/i.test(text)) { type = 'Speaker'; group = 'audio'; }
        else if (tl.includes('verstärker') || tl.includes('endstufe')) { type = 'Amplifier'; group = 'audio'; }
        else if (tl.includes('mikrofon')) { type = 'Microphone'; group = 'audio'; }
        else if (tl.includes('switch') || tl.includes('matrix')) type = 'Switch';
        else if (tl.includes('konverter') || tl.includes('converter')) type = 'Converter';

        const groupInfo = this.groups.find(g => g.id === group);
        const color = groupInfo?.color || '#4d49bc';
        return { name, article, type, group, color, inputs, outputs, inputCables, outputCables };
    },

    // Liefert den im System angelegten Kabeltyp, der zum erkannten Anschluss passt (z. B. 'DP' für DisplayPort/mini-DP)
    matchCableType(preferred) {
        const list = this.cableTypes || [];
        if (list.includes(preferred)) return preferred;
        const norm = typeof this.normalizeSignal === 'function' ? this.normalizeSignal.bind(this) : (s) => String(s).toUpperCase();
        const target = norm(preferred);
        const hit = target ? list.find(t => norm(t) === target) : null;
        return hit || preferred;
    },

    // "2x DP(1x mini-DP), 2x HDMI, Hub (3x USB A 3.0)" -> [{name:'DP IN 1', cable:'DP'}, ...]
    // Regeln: Klammerzusätze (mini-DP, MST, 3,5mm) werden ignoriert, USB/Hub/Netzwerk/Steuerung zählen nicht als Signalanschluss.
    parseIctConnectorList(raw, dir) {
        if (!raw || raw === '-') return [];
        const cleaned = raw.replace(/\([^)]*\)/g, ' ');
        const parts = cleaned.split(/[,;]/).map(p => p.trim()).filter(Boolean);
        const map = this.connectorMap();
        const result = [];
        for (const part of parts) {
            if (/usb|hub|rs-?232|ir\b|steuer/i.test(part)) continue;
            const entry = map.find(m => m.re.test(part));
            if (!entry) continue;
            const countMatch = part.match(/(\d+)\s*x/i);
            const count = countMatch ? Math.min(parseInt(countMatch[1]), 16) : 1;
            for (let i = 1; i <= count; i++) {
                result.push({ name: count > 1 ? `${entry.label} ${dir} ${i}` : `${entry.label} ${dir}`, cable: this.matchCableType(entry.cable) });
            }
        }
        return result;
    },

    // Zuordnung Anschlussbezeichnung im Datenblatt -> Port-Label und Kabeltyp (Reihenfolge = Priorität)
    connectorMap() {
        return [
            { re: /mini[\s-]*dp|displayport|\bdp\b/i, label: 'DP', cable: 'DP' },
            { re: /hdmi/i, label: 'HDMI', cable: 'HDMI' },
            { re: /\bsdi\b/i, label: 'SDI', cable: 'SDI' },
            { re: /dvi/i, label: 'DVI', cable: 'DVI' },
            { re: /vga/i, label: 'VGA', cable: 'VGA' },
            { re: /\bxlr\b/i, label: 'XLR', cable: 'XLR' },
            { re: /dante/i, label: 'Dante', cable: 'Cat5/6' },
            { re: /aes/i, label: 'AES', cable: 'AES/EBU' },
            { re: /s\/?pdif|toslink/i, label: 'SPDIF', cable: 'SPDIF' },
            { re: /cinch|rca/i, label: 'Cinch', cable: 'Cinch' },
            { re: /\btrs\b|analog\s*audio|klinke|3,5\s*mm|6,3\s*mm|line/i, label: 'Audio', cable: 'Klinke' },
            { re: /glasfaser|fiber|lc\/lc/i, label: 'LC/LC', cable: 'Glasfaser LC/LC' },
            { re: /rj45|ethernet|lan|hdbaset|cat\s*\d/i, label: 'LAN', cable: 'Cat5/6' },
            { re: /\bdmx\b/i, label: 'DMX', cable: 'DMX' },
            { re: /speakon|\bnl[248]\b/i, label: 'SP', cable: 'Speakon' }
        ];
    },

    // Hersteller-Datenblätter (englisch, z. B. Yamaha "Technical Data Sheet"):
    // Titel = Modell, Untertitel = Gerätetyp, Ports aus Mustern wie "16 Mic/Line (12 XLR + ...) inputs, and 8 (XLR) outputs".
    // Regeln: alle Kanäle einzeln anlegen, generische Namen (XLR IN 1 …), Dante Primary/Secondary beidseitig (Cat5/6),
    // RJ45/Ethernet immer als LAN-Port, USB/Phones/Kopfhörer ignorieren.
    analyzeManufacturerDatasheet(text, filename) {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (!lines.length) return null;
        const flat = text.replace(/\s+/g, ' ');

        const inCount = flat.match(/(\d{1,2})\s*(?:mic\/line|mic|line|analog)?[^,.;()]*?\(([^)]*)\)\s*inputs?\b/i)
            || flat.match(/analog\s+inputs?\s+(\d{1,2})\s*[^()]*?\(([^)]*)\)/i)
            || flat.match(/(\d{1,2})\s*x?\s*(xlr|trs|combo)[^,.;]*?inputs?/i);
        const outCount = flat.match(/(\d{1,2})\s*\(([^)]*)\)\s*outputs?\b/i)
            || flat.match(/analog\s+outputs?\s+(\d{1,2})\s*\(([^)]*)\)/i)
            || flat.match(/(\d{1,2})\s*x?\s*(xlr|trs|combo)[^,.;]*?outputs?/i);
        const hasDante = /\bdante\b/i.test(flat);
        if (!inCount && !outCount && !hasDante) return null;

        const manufacturers = ['Yamaha', 'Allen & Heath', 'Behringer', 'Midas', 'Soundcraft', 'DiGiCo', 'QSC', 'Shure', 'Sennheiser', 'Bose', 'JBL', 'd&b', 'L-Acoustics', 'Crestron', 'Extron', 'Kramer', 'Barco', 'Christie', 'Epson', 'Panasonic', 'Sony', 'Blackmagic', 'Roland', 'Biamp', 'BSS', 'Lightware', 'Atlona', 'Dell', 'iiyama', 'Samsung', 'LG', 'NEC', 'Sharp'];
        const base = filename.replace(/\.pdf$/i, '').replace(/^DB[_-]/i, '').replace(/[_-](de|en|fr|it)$/i, '');
        const manufacturer = manufacturers.find(m => new RegExp('\\b' + m.replace(/[&\-]/g, '.') + '\\b', 'i').test(flat + ' ' + base)) || '';
        const model = lines[0].replace(/\s+/g, ' ').trim();
        const name = manufacturer && !new RegExp('^' + manufacturer, 'i').test(model) ? `${manufacturer} ${model}` : model;
        const article = model.split(' ')[0];

        const subtitle = (lines[1] || '').toLowerCase();
        let type = 'Gerät';
        let group = 'other';
        const typeMap = [
            { re: /digital.*(mixing console|mixer)/, type: 'Digital Mixer', group: 'audio' },
            { re: /mixing console|mixer|mischpult/, type: 'Mixer', group: 'audio' },
            { re: /power amplifier|amplifier|endstufe/, type: 'Amplifier', group: 'audio' },
            { re: /loudspeaker|speaker|lautsprecher/, type: 'Speaker', group: 'audio' },
            { re: /microphone|mikrofon/, type: 'Microphone', group: 'audio' },
            { re: /dsp|signal processor|audio processor/, type: 'DSP', group: 'audio' },
            { re: /projector|projektor/, type: 'Projector', group: 'video' },
            { re: /camera|kamera/, type: 'Camera', group: 'video' },
            { re: /touch/, type: 'Touchdisplay', group: 'video' },
            { re: /display|monitor/, type: 'Monitor', group: 'video' },
            { re: /matrix|switcher|switch/, type: 'Switch', group: 'video' },
            { re: /control processor|controller|control system/, type: 'Control Processor', group: 'control' }
        ];
        const hit = typeMap.find(t => t.re.test(subtitle)) || typeMap.find(t => t.re.test(flat.toLowerCase()));
        if (hit) { type = hit.type; group = hit.group; }

        const map = this.connectorMap();
        const connectorFor = (desc) => map.find(m => m.re.test(desc || '')) || map.find(m => m.label === 'XLR');
        const inputs = [], outputs = [], inputCables = [], outputCables = [];
        if (inCount) {
            const entry = connectorFor(inCount[2]);
            const n = Math.min(parseInt(inCount[1]), 64);
            for (let i = 1; i <= n; i++) { inputs.push(`${entry.label} IN ${i}`); inputCables.push(this.matchCableType(entry.cable)); }
        }
        if (outCount) {
            const entry = connectorFor(outCount[2]);
            const n = Math.min(parseInt(outCount[1]), 64);
            for (let i = 1; i <= n; i++) { outputs.push(`${entry.label} OUT ${i}`); outputCables.push(this.matchCableType(entry.cable)); }
        }
        if (hasDante) {
            const cat = this.matchCableType('Cat5/6');
            const secondary = /primary\s*\/\s*secondary|secondary/i.test(flat);
            ['Dante Primary', ...(secondary ? ['Dante Secondary'] : [])].forEach(p => {
                inputs.push(p); inputCables.push(cat);
                outputs.push(p); outputCables.push(cat);
            });
        }
        if (/ethernet\s+yes|rj-?45|\bethernet\b|\bnetwork\s+port\b/i.test(flat)) {
            inputs.push('LAN'); inputCables.push(this.matchCableType('Cat5/6'));
        }

        const groupInfo = this.groups.find(g => g.id === group);
        const color = groupInfo?.color || '#4d49bc';
        return { name, article, type, group, color, inputs, outputs, inputCables, outputCables };
    },

    // Produktseiten von Händlern/Herstellern (z. B. rockshop.de): Text kommt vom Vermittler (/fetch).
    // Regeln: Name aus Seitentitel, Typ aus Kurzbeschreibung, Ports aus "Analoge E/A: 32 Eingänge / 16 Ausgänge",
    // "AES/EBU: 2 Eingänge / 2 Ausgänge", "Dante: …" -> Dante Primary/Secondary beidseitig (Cat5/6).
    // Analoge Anschlüsse ohne Steckerangabe -> XLR. LAN immer. USB, Phones, Steckplätze ignorieren. Keine Artikelnummer.
    analyzeWebsiteText(text, pageTitle, url) {
        // Zubehör-/Empfehlungsblöcke am Seitenende ausblenden (enthalten Daten anderer Geräte)
        const cut = text.search(/\n\s*(Zubehör|Passendes Zubehör|Ähnliche Artikel|Kunden kauften auch|Das könnte Sie auch interessieren)\s*\n/i);
        if (cut > 0 && cut > text.length * 0.4) text = text.slice(0, cut);
        const flat = text.replace(/\s+/g, ' ');
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

        let name = (pageTitle || lines[0] || '').split(/\s[|–-]\s/)[0].trim();
        name = name.replace(/\b(kaufen|online|günstig|bestellen|shop|preisvergleich|test)\b.*$/i, '').trim();
        if (!name && url) name = url.replace(/^https?:\/\/[^/]+\//, '').replace(/[-_/]+/g, ' ').trim();
        name = name.replace(/\b(digital(?:es|er)?\s*(?:mischpult|mixer|mixing console)?|mixing console|mischpult|monitor|display|lautsprecher|verstärker|endstufe|projektor|beamer|kamera|konverter|converter|up-?\/?down)\b.*$/i, '').replace(/[\s\/|,-]+$/, '').trim();

        const pairs = (label) => {
            const m = flat.match(new RegExp(label + '\\s*:?\\s*(\\d{1,3})\\s*(?:Eing[äa]nge?|inputs?|in)\\b\\s*(?:\\/|,|und|and|\\+)\\s*(\\d{1,3})\\s*(?:Ausg[äa]nge?|outputs?|out)\\b', 'i'));
            return m ? { inputs: parseInt(m[1]), outputs: parseInt(m[2]) } : null;
        };
        const analog = pairs('Analoge?\\s*(?:E\\/A|I\\/O|Ein-?\\s*(?:\\/|und)\\s*Ausg[äa]nge)?')
            || pairs('Lokale?\\s*(?:E\\/A|I\\/O)')
            || pairs('Local\\s*I\\/O');
        const aes = pairs('AES\\/EBU');
        // Dante nur, wenn eingebaut – nicht bei optionaler Karte ("Audio Networking Card Dante oder Waves", "Dante-Optionskarte")
        const danteMentions = flat.match(/[^.;\n]{0,80}\bdante\b[^.;\n]{0,80}/gi) || [];
        const hasDante = danteMentions.some(m => !/karte|card|optional|oder waves|erweiterung|option|kompatib|bereit|ready/i.test(m) && /dante\s*[:(]|\d+\s*x\s*\d+|eingebaut|integriert|built-?in|onboard|mit dante ausgestattet|dante\s*(primary|secondary|port|anschl)/i.test(m));
        const micIns = flat.match(/(?:Mikrofoneing[äa]nge|Mic(?:rophone)?\s*inputs?)\s*:?\s*(\d{1,3})\b/i)
            || flat.match(/(\d{1,3})\s*(?:eingebaute\s+)?(?:Mic|Mikrofon)[\s-]*Preamps?/i);
        const lineOuts = flat.match(/(?:Line\s*Outs?|Analoge?\s*Ausg[äa]nge|Analog\s*outputs?)\s*:?\s*(\d{1,3})\b/i)
            || flat.match(/(\d{1,3})\s*x?\s*XLR\s*(?:Line\s*)?(?:Outputs?|Ausg[äa]nge)/i);
        const aesOutOnly = !aes && /AES(?:\/EBU)?[\s-]*(?:Ausgang|Output|Out)\b/i.test(flat);

        // Video-Konverter/-Geräte: Blöcke "INPUTS | 1x HDMI / 1x (12G…)-SDI", "OUTPUTS | 1 x HDMI Type A / 2 x SDI" oder "Inputs: HDMI, SDI"
        const videoBlock = (label) => {
            const m = text.match(new RegExp('(?:^|\\n)\\s*' + label + '\\s*[:|]\\s*([^\\n]*(?:\\n(?!\\s*(?:INPUTS?|OUTPUTS?|Eing[äa]nge|Ausg[äa]nge|Anschlu|MENU|Power|Standards|LCD)\\b)[^\\n]*){0,4})', 'i'));
            return m ? m[1] : '';
        };
        const vIn = videoBlock('(?:INPUTS?|Eing[äa]nge)'), vOut = videoBlock('(?:OUTPUTS?|Ausg[äa]nge)');
        const isVideo = /\b(sdi|hdmi|displayport|dvi|vga)\b/i.test(vIn + ' ' + vOut);
        if (!analog && !aes && !hasDante && !micIns && !isVideo) return null;

        const cat = this.matchCableType('Cat5/6');
        const xlr = this.matchCableType('XLR');
        const aesCable = this.matchCableType('AES/EBU');
        const inputs = [], outputs = [], inputCables = [], outputCables = [];
        if (isVideo) {
            const parseVideo = (block, dir) => {
                const items = block.split(/\n|,|\//).map(s => s.replace(/\([^)]*\)/g, '').trim()).filter(Boolean);
                const res = [];
                for (const it of items) {
                    if (/genlock|ref|loop|audio|usb|lcd|button|power|dc\b/i.test(it) && !/sdi|hdmi/i.test(it)) continue;
                    const entry = this.connectorMap().find(m => m.re.test(it));
                    if (!entry) continue;
                    const cnt = it.match(/(\d+)\s*x/i);
                    res.push({ entry, count: cnt ? Math.min(parseInt(cnt[1]), 16) : 1 });
                }
                const totals = {};
                res.forEach(r => totals[r.entry.label] = (totals[r.entry.label] || 0) + r.count);
                const counters = {};
                res.forEach(r => {
                    for (let i = 0; i < r.count; i++) {
                        counters[r.entry.label] = (counters[r.entry.label] || 0) + 1;
                        const nm = totals[r.entry.label] > 1 ? `${r.entry.label} ${dir} ${counters[r.entry.label]}` : `${r.entry.label} ${dir}`;
                        if (dir === 'IN') { inputs.push(nm); inputCables.push(this.matchCableType(r.entry.cable)); }
                        else { outputs.push(nm); outputCables.push(this.matchCableType(r.entry.cable)); }
                    }
                });
            };
            parseVideo(vIn, 'IN');
            parseVideo(vOut, 'OUT');
        }
        const inN = Math.min(analog ? analog.inputs : (micIns ? parseInt(micIns[1]) : 0), 64);
        const outN = Math.min(analog ? analog.outputs : (lineOuts ? parseInt(lineOuts[1]) : 0), 64);
        for (let i = 1; i <= inN; i++) { inputs.push(`XLR IN ${i}`); inputCables.push(xlr); }
        for (let i = 1; i <= outN; i++) { outputs.push(`XLR OUT ${i}`); outputCables.push(xlr); }
        if (aes) {
            for (let i = 1; i <= Math.min(aes.inputs, 16); i++) { inputs.push(aes.inputs > 1 ? `AES IN ${i}` : 'AES IN'); inputCables.push(aesCable); }
            for (let i = 1; i <= Math.min(aes.outputs, 16); i++) { outputs.push(aes.outputs > 1 ? `AES OUT ${i}` : 'AES OUT'); outputCables.push(aesCable); }
        } else if (aesOutOnly) {
            outputs.push('AES OUT'); outputCables.push(aesCable);
        }
        if (hasDante) {
            ['Dante Primary', 'Dante Secondary'].forEach(p => {
                inputs.push(p); inputCables.push(cat);
                outputs.push(p); outputCables.push(cat);
            });
        }
        inputs.push('LAN'); inputCables.push(cat);

        const tl = flat.toLowerCase();
        let type = 'Gerät', group = isVideo ? 'video' : 'audio';
        if (isVideo && /konverter|converter|cross/.test(tl)) type = 'Converter';
        else if (isVideo && /kreuzschiene|matrix|switcher|umschalter/.test(tl)) type = 'Switch';
        else if (isVideo) type = 'Video';
        else if (/digital(?:es|er)?\s*(?:mischpult|mixer|mixing console)/.test(tl)) type = 'Digital Mixer';
        else if (/mischpult|mixer|mixing console/.test(tl)) type = 'Mixer';
        else if (/endstufe|verstärker|amplifier/.test(tl)) type = 'Amplifier';
        else if (/lautsprecher|loudspeaker|speaker/.test(tl)) type = 'Speaker';
        else if (/\bdsp\b|signalprozessor|audio processor/.test(tl)) type = 'DSP';
        else if (/mikrofon|microphone/.test(tl)) type = 'Microphone';

        const groupInfo = this.groups.find(g => g.id === group);
        const color = groupInfo?.color || '#4d49bc';
        return { name, article: '', type, group, color, inputs, outputs, inputCables, outputCables };
    },

    analyzeGenericDatasheet(text, filename) {
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
        
        deviceInfo.inputs.forEach((name, i) => this.addIOField('input', 'pdfInputsList', name, deviceInfo.inputCables?.[i] || ''));
        deviceInfo.outputs.forEach((name, i) => this.addIOField('output', 'pdfOutputsList', name, deviceInfo.outputCables?.[i] || ''));
        
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
