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

    // Vom Nutzer angegebene Gerätebezeichnung (Hersteller + Modell) aus dem Import-Fenster – steuert Suche und Zuordnung
    importDeviceHint() {
        const el = document.getElementById('importDeviceHint');
        return el ? el.value.replace(/\s+/g, ' ').trim() : '';
    },

    // Modellkennungen aus der Bezeichnung (Wörter mit Ziffern, sonst letztes Wort), normalisiert auf a-z0-9
    importHintTokens(hint) {
        const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const words = (hint || '').split(' ').filter(Boolean);
        let toks = words.filter(w => /\d/.test(w)).map(norm).filter(t => t.length >= 2);
        if (!toks.length && words.length) toks = [norm(words[words.length - 1])].filter(t => t.length >= 3);
        return toks;
    },

    // Prüft, ob ein Text (Seite, PDF, Suchtreffer) die angegebene Modellkennung enthält
    textMatchesHint(text, hint) {
        const toks = this.importHintTokens(hint);
        if (!toks.length) return true;
        const t = (text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return toks.some(tok => t.includes(tok));
    },

    showImportChoiceModal() {
        document.getElementById('importUrlForm').style.display = 'none';
        document.getElementById('importPasteBlock').style.display = 'none';
        document.getElementById('importPasteText').value = '';
        document.getElementById('importDeviceHint').value = '';
        this._importHint = '';
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
        const pasted = (document.getElementById('importPasteText').value || '').trim();
        const deviceHint = this.importDeviceHint();
        this._importHint = deviceHint;
        const showForm = (text, title) => {
            this.hideImportChoiceModal();
            document.getElementById('pdfImportTitle').textContent = 'Gerät aus Website importieren';
            document.getElementById('pdfImportModal').classList.add('active');
            document.getElementById('pdfAnalysisStatus').style.display = 'none';
            const deviceInfo = this.analyzeWebsiteText(text || '', title || '', url)
                || this.analyzeGenericDatasheet(text || '', (title || url) + '.pdf');
            if (deviceHint) deviceInfo.name = deviceHint;
            if (!deviceInfo.name) deviceInfo.name = title || '';
            deviceInfo.article = '';
            this.showPdfDeviceForm(deviceInfo);
        };

        if (pasted) {
            showForm(pasted, pasted.split('\n').map(l => l.trim()).find(l => l.length > 3) || '');
            return;
        }

        // Warteanzeige wie beim Datenblatt-Import: Spinner mit Statustext im Import-Fenster
        const hint = document.getElementById('importPasteHint');
        const statusEl = document.getElementById('pdfAnalysisStatus').querySelector('p');
        const progress = (pct, msg) => { statusEl.textContent = msg; };
        hint.style.color = '';
        hint.textContent = '';
        document.getElementById('importPasteBlock').style.display = 'none';
        document.getElementById('importUrlSubmit').disabled = true;
        this.hideImportChoiceModal();
        document.getElementById('pdfImportTitle').textContent = 'Gerät aus Website importieren';
        document.getElementById('pdfImportModal').classList.add('active');
        document.getElementById('pdfAnalysisStatus').style.display = 'block';
        document.getElementById('pdfDeviceForm').style.display = 'none';

        const errors = [];
        const srcHost = new URL(url).host.replace(/^www\./, '');

        try {
            // Gleicher Ablauf wie beim Datenblatt-Import: Seite (oder PDF) mit der Parserkette auswerten,
            // dann per Websuche "<Gerät> technisches Datenblatt" mindestens 10 weitere Quellen prüfen und zusammenführen.
            progress(5, 'Schritt 1/3: Lese Produktseite...');
            let primary = null;
            try {
                const data = await this.fetchImportPage(url, endpoint);
                primary = this.analyzeImportPage(data.text, data.title, url, !!data.pdf, { hint: deviceHint, isPrimary: true });
            } catch (err) { errors.push(`${srcHost}: ${err.message}`); }

            // Ausgangspunkt: Angaben der angegebenen Seite (Vorrang wie beim Datenblatt). Reine Schlüsselwort-Schätzungen
            // liefern nur Name/Typ – Anschlüsse kommen dann aus den Web-Quellen.
            const fallbackName = url.replace(/^https?:\/\/[^/]+\//, '');
            let base = primary ? { ...primary } : { name: '', article: '', type: 'Gerät', group: 'other', color: this.groupColor('other'), inputs: [], outputs: [], inputCables: [], outputCables: [] };
            if (primary && primary._weak) { base.inputs = []; base.outputs = []; base.inputCables = []; base.outputCables = []; }
            if (deviceHint) base.name = deviceHint;
            delete base._weak; delete base._score;

            progress(30, 'Schritt 2/3: Suche technische Datenblätter im Web...');
            const { info, sources, checked, candidates } = await this.enrichDeviceInfoFromWeb(base, fallbackName, statusEl,
                { excludeHosts: [srcHost], statusPrefix: 'Schritt 3/3: ', errors, hint: deviceHint });
            progress(100, 'Auswertung abgeschlossen.');

            const hasData = (d) => d && ((d.inputs || []).length || (d.outputs || []).length);
            if (!primary && !candidates.length) throw new Error(errors.join(' | ') || 'Keine auswertbaren Daten gefunden');
            const best = { ...info };
            if (!hasData(best) && primary && primary._weak) {
                // Keine belastbare Quelle gefunden: Schätzung der Produktseite als Vorschlag anzeigen
                best.inputs = primary.inputs; best.outputs = primary.outputs;
                best.inputCables = primary.inputCables; best.outputCables = primary.outputCables;
            }
            if (primary && primary.name) best.name = primary.name;
            if (deviceHint) best.name = deviceHint;
            if (best.type === 'Gerät' && primary && primary.type && primary.type !== 'Gerät') best.type = primary.type;
            const allSources = [...new Set([...(primary ? [srcHost] : []), ...sources])];
            best._sources = allSources;
            delete best._source; delete best._score; delete best._weak;
            let subtitle = 'Quellen: ' + allSources.join(', ');
            const onlyChecked = (checked || []).filter(h => !allSources.includes(h));
            if (onlyChecked.length) subtitle += '; geprüft: ' + onlyChecked.join(', ');
            document.getElementById('pdfImportTitle').textContent = 'Gerät aus Website importieren (' + subtitle + ')';
            document.getElementById('pdfAnalysisStatus').style.display = 'none';
            this.showPdfDeviceForm(best);
        } catch (err) {
            console.error('Website-Import Fehler:', err);
            // Zurück zum Adress-Formular mit Fehlerhinweis und Einfügefeld
            document.getElementById('pdfImportModal').classList.remove('active');
            document.getElementById('importChoiceModal').classList.add('active');
            document.getElementById('importUrlForm').style.display = 'block';
            document.getElementById('importChoiceCancelRow').style.display = 'none';
            document.getElementById('importPasteBlock').style.display = 'block';
            hint.style.color = '#c0392b';
            hint.textContent = 'Keine Quelle konnte ausgelesen werden (' + err.message + '). '
                + 'Alternative: Seitentext unten einfügen und erneut auf „Seite auslesen" klicken.';
            document.getElementById('importPasteText').style.display = 'block';
            document.getElementById('importPasteText').focus();
        } finally {
            document.getElementById('importUrlSubmit').disabled = false;
        }
    },

    // Suchbegriff für die Websuche: Gerätename (Hersteller + Modell) bzw. Artikelnummer oder Dateiname/URL-Teil, max. 6 Wörter
    buildDeviceQuery(deviceInfo, fallback, hint) {
        let q = (hint || (deviceInfo && (deviceInfo.name || deviceInfo.article)) || '').trim();
        if (!q) q = (fallback || '').replace(/\.pdf$/i, '').replace(/[-_./]+/g, ' ').replace(/\b(htm|html|php|products?|de|en)\b/g, ' ');
        return q.replace(/\s+/g, ' ').trim().split(' ').slice(0, 6).join(' ');
    },

    // Websuche nach Quellen zu einem Gerät: immer zuerst "<Gerät> technisches Datenblatt", danach weitere Varianten,
    // bis mindestens `minResults` (Standard 10) verschiedene, passende Treffer vorliegen.
    // Filter: keine Shops/Social Media, Modellkennung muss in Titel/URL vorkommen, Herstellerseiten und PDF-Datenblätter zuerst.
    async searchDeviceSources(query, endpoint, errors, opts = {}) {
        const minResults = opts.minResults || 10;
        const maxResults = opts.maxResults || minResults;
        const excludeHosts = (opts.excludeHosts || []).map(h => h.replace(/^www\./, ''));
        const variants = [query + ' technisches Datenblatt', query + ' technische Daten', query + ' datasheet specifications'];
        const brand = (query.split(' ')[0] || '').toLowerCase();
        const skip = /youtube|facebook|instagram|ebay|amazon|idealo|geizhals|wikipedia|reddit|pinterest|twitter|x\.com|linkedin|kleinanzeigen|willhaben/i;
        // Modellkennung: aus der angegebenen Gerätebezeichnung (Pflicht-Treffer), sonst aus dem Suchbegriff
        const modelTokens = opts.hint ? this.importHintTokens(opts.hint)
            : query.split(' ').filter(t => /\d/.test(t) && t.length >= 3).map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const matchesModel = r => !modelTokens.length || modelTokens.some(t => (r.title + ' ' + r.url).toLowerCase().replace(/[^a-z0-9]/g, '').includes(t));
        const hostOf = u => { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return ''; } };
        const seen = new Set();
        const found = [];
        for (const v of variants) {
            if (found.length >= minResults) break;
            const results = await this.searchWeb(v, endpoint, errors);
            for (const r of results) {
                const key = r.url.replace(/^https?:\/\/(www\.)?/, '').replace(/[#?].*$/, '').replace(/\/$/, '').toLowerCase();
                if (seen.has(key)) continue;
                seen.add(key);
                const host = hostOf(r.url);
                if (!host || skip.test(r.url) || !matchesModel(r) || excludeHosts.includes(host)) continue;
                found.push({ ...r, _host: host, _pdf: /\.pdf(\?|$)/i.test(r.url) });
            }
        }
        const rank = r => (r._host.includes(brand) ? 2 : 0) + (r._pdf ? 1 : 0);
        return found.sort((a, b) => rank(b) - rank(a)).slice(0, maxResults);
    },

    // Mehrere Quellen parallel (max. `limit` gleichzeitig) laden und auswerten
    async mapLimit(items, limit, fn) {
        const out = new Array(items.length);
        let next = 0;
        const worker = async () => {
            while (next < items.length) {
                const i = next++;
                out[i] = await fn(items[i], i);
            }
        };
        await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
        return out;
    },

    // Websuche: zuerst Vermittler (/search), sonst DuckDuckGo-Ergebnisseite über den Reader-Dienst aus dem Browser
    async searchWeb(query, endpoint, errors) {
        try {
            const sr = await fetch(`${endpoint.replace(/\/$/, '')}/search?q=${encodeURIComponent(query)}`);
            const sd = await sr.json().catch(() => ({}));
            if (sr.ok && sd.ok && (sd.results || []).length) return sd.results;
        } catch (err) { /* Fallback folgt */ }
        try {
            const rr = await fetch('https://r.jina.ai/https://html.duckduckgo.com/html/?kl=de-de&q=' + encodeURIComponent(query), { headers: { 'X-Return-Format': 'text' } });
            if (!rr.ok) throw new Error('Reader ' + rr.status);
            const lines = (await rr.text()).split('\n');
            const results = [];
            // Reader-Format: Titelzeile, Leerzeilen, dann "  host/pfad    Snippet" – URL steht am Zeilenanfang, Titel ist die letzte nicht-leere Zeile davor
            for (let i = 1; i < lines.length && results.length < 20; i++) {
                const m = lines[i].trim().match(/^((?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?)(?:\s{2,}|$)/i);
                if (!m) continue;
                let j = i - 1;
                while (j >= 0 && !lines[j].trim()) j--;
                const title = j >= 0 ? lines[j].trim().replace(/^PDF\s+/, '') : '';
                if (title && !/^(All Regions|Any Time)/.test(title)) results.push({ url: 'https://' + m[1], title });
            }
            if (!results.length) throw new Error('keine Treffer');
            return results;
        } catch (err) {
            errors.push('Websuche: ' + err.message);
            return [];
        }
    },

    // PDF-Text mit Zeilenumbrüchen auslesen (pdf.js hasEOL/Y-Position), damit Tabellenzeilen erkennbar bleiben – wie beim Datenblatt-Import
    async extractPdfText(arrayBuffer, maxPages = 5) {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            let pageText = '';
            let lastY = null, prevEol = false;
            for (const item of textContent.items) {
                const y = Array.isArray(item.transform) ? Math.round(item.transform[5]) : null;
                const newLine = prevEol || (lastY !== null && y !== null && Math.abs(y - lastY) > 2);
                if (pageText) pageText += newLine ? '\n' : ' ';
                pageText += item.str;
                prevEol = !!item.hasEOL;
                if (y !== null) lastY = y;
            }
            fullText += pageText + '\n';
        }
        return fullText;
    },

    // PDF-Datenblatt aus dem Web: direkt laden und mit pdf.js auslesen; bei CORS-Sperre Text über den Reader-Dienst holen
    async fetchImportPdf(u) {
        const title = decodeURIComponent(u.split('/').pop().replace(/\.pdf(\?.*)?$/i, '')).replace(/[-_]+/g, ' ');
        try {
            if (typeof pdfjsLib !== 'undefined') {
                const res = await fetch(u);
                if (res.ok) {
                    const text = await this.extractPdfText(await res.arrayBuffer());
                    if (text.trim()) return { text, title, pdf: true };
                }
            }
        } catch (err) { /* Reader-Fallback folgt */ }
        const rr = await fetch('https://r.jina.ai/' + u, { headers: { 'X-Return-Format': 'text' } });
        if (!rr.ok) throw new Error(`PDF nicht lesbar (Reader ${rr.status})`);
        const text = (await rr.text()).replace(/^(Title|URL Source|Markdown Content):.*$/gm, '');
        if (!text.trim()) throw new Error('PDF ohne lesbaren Text');
        return { text, title, pdf: true };
    },

    async fetchImportPage(u, endpoint) {
        if (/\.pdf(\?|$)/i.test(u)) return this.fetchImportPdf(u);
        let res = null, data = {};
        try {
            res = await fetch(`${endpoint.replace(/\/$/, '')}/fetch?url=${encodeURIComponent(u)}`);
            data = await res.json().catch(() => ({}));
            if (res.ok && data.ok) return data;
        } catch (err) { data = { error: 'Vermittler nicht erreichbar' }; }
        // Seite blockiert den Vermittler (z. B. thomann.de) oder Vermittler nicht erreichbar: Reader-Dienst direkt aus dem Browser nutzen
        const rr = await fetch('https://r.jina.ai/' + u, { headers: { 'X-Return-Format': 'markdown' } });
        if (!rr.ok) throw new Error(data.error || `Vermittler antwortet mit ${res ? res.status : '-'}`);
        let text = await rr.text();
        const t = text.match(/^Title:\s*(.+)$/m);
        text = text.replace(/^(Title|URL Source|Markdown Content):.*$/gm, '')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/^[#>*\-]+\s*/gm, '');
        return { text, title: t ? t[1].trim() : '' };
    },

    // Webseite/Web-PDF auswerten – gleiche Parserkette wie beim Datenblatt-Import (ICT > Display > Hersteller-Datenblatt),
    // davor der Produktseiten-Parser; Schlüsselwort-Schätzung nur als schwacher Fallback (_weak).
    // opts.hint: vom Nutzer angegebene Gerätebezeichnung – Quellen ohne diese Modellkennung werden verworfen
    // (bei der angegebenen Seite/Datei nur als schwach markiert), der Name wird auf die Bezeichnung gesetzt.
    analyzeImportPage(text, title, srcUrl, isPdf, opts = {}) {
        text = text || '';
        const pseudoFile = (title || srcUrl) + '.pdf';
        const hint = opts.hint || '';
        const hintOk = !hint || this.textMatchesHint((title || '') + ' ' + srcUrl + ' ' + text, hint);
        if (!hintOk && !opts.isPrimary) return null;
        let d = null;
        if (isPdf) {
            d = this.analyzeDatasheet(text, pseudoFile);
            if (d && d._ict) { delete d._ict; }
            else if (d && !(d.inputs || []).length && !(d.outputs || []).length) d._weak = true;
        } else {
            d = this.analyzeWebsiteText(text, title || '', srcUrl)
                || this.analyzeDisplayDatasheet(text, pseudoFile)
                || this.analyzeIoTableDatasheet(text, pseudoFile)
                || this.analyzeManufacturerDatasheet(text, pseudoFile);
            if (!d) {
                // Nur Schätzung aus Schlüsselwörtern (Standard-Portanzahl) – beim Zusammenführen mit Datenblättern nicht verwenden
                d = this.analyzeGenericDatasheet(text, pseudoFile);
                if (d) d._weak = true;
            }
        }
        if (!d) return null;
        if (!d.name) d.name = title || '';
        // Hersteller ergänzen, falls in Titel/Kopfzeilen oder "Hersteller: X" erkennbar und noch nicht im Namen (wie beim Datenblatt-Import).
        // Bewusst ohne Häufigkeitszählung – Shop-Seiten nennen in der Navigation viele Marken.
        const reFor = m => new RegExp('(^|[^a-z0-9])' + m.replace(/[&\-]/g, '.').replace(/\s+/g, '\\s*') + '(?![a-z])', 'i');
        const head = (title || '') + ' ' + text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 8).join(' ');
        const decl = text.match(/(?:Hersteller|Manufacturer|Marke|Brand)\s*:?\s+([A-Z][\w&.-]{1,30})/);
        const manufacturer = this.knownManufacturers().find(m => reFor(m).test(head))
            || (decl && (this.knownManufacturers().find(m => reFor(m).test(decl[1])) || decl[1])) || '';
        if (manufacturer && d.name && !reFor(manufacturer).test(d.name)) d.name = `${manufacturer} ${d.name}`;
        if (hint) { d.name = hint; if (!hintOk) d._weak = true; }
        if (!isPdf) d.article = '';
        d._source = srcUrl;
        d._score = (d.inputs || []).length + (d.outputs || []).length + (d.type && d.type !== 'Gerät' ? 2 : 0) + (isPdf ? 1 : 0);
        return d;
    },

    mergeDeviceInfo(primary, addition) {
        if (!addition) return primary;
        const merged = { ...primary };
        if (!(merged.name || '').trim() && addition.name) merged.name = addition.name;
        if (!(merged.article || '').trim() && addition.article) merged.article = addition.article;
        if ((!(merged.type || '').trim() || merged.type === 'Gerät') && addition.type) merged.type = addition.type;
        if ((!merged.group || merged.group === 'other') && addition.group) {
            merged.group = addition.group;
            merged.color = this.groupColor(addition.group);
        }
        if (!(merged.inputs || []).length && (addition.inputs || []).length) {
            merged.inputs = addition.inputs;
            merged.inputCables = addition.inputCables;
        }
        if (!(merged.outputs || []).length && (addition.outputs || []).length) {
            merged.outputs = addition.outputs;
            merged.outputCables = addition.outputCables;
        }
        return merged;
    },

    // Prüft jedes Datenblatt-Ergebnis (außer ICT-Datenblätter) per Websuche und führt alle relevanten Treffer zusammen
    // (gleiches Prinzip wie beim Website-Import: Suche "<Gerät> technisches Datenblatt", mindestens 10 weitere Treffer,
    // Web-PDFs mit der Datenblatt-Parserkette auslesen, Datenblatt-Angaben haben Vorrang)
    // opts: { excludeHosts: [...], statusPrefix: 'Schritt 3/3: ', errors: [] }
    async enrichDeviceInfoFromWeb(deviceInfo, filename, statusEl, opts = {}) {
        const endpoint = (typeof BUG_REPORT_CONFIG !== 'undefined' && BUG_REPORT_CONFIG.endpoint) || '';
        if (!endpoint || !deviceInfo || deviceInfo._ict) return { info: deviceInfo, sources: [], checked: [], candidates: [] };
        const prefix = opts.statusPrefix || '';
        try {
            if (statusEl) statusEl.textContent = prefix + 'Suche technische Datenblätter im Web...';
            const errors = opts.errors || [];
            const query = this.buildDeviceQuery(deviceInfo, filename, opts.hint);
            if (!query) return { info: deviceInfo, sources: [], checked: [], candidates: [] };
            const top = await this.searchDeviceSources(query, endpoint, errors, { minResults: 10, maxResults: 10, excludeHosts: opts.excludeHosts || [], hint: opts.hint });
            const candidates = [], checked = [];
            let done = 0;
            if (statusEl && top.length) statusEl.textContent = `${prefix}Lese ${top.length} Quellen (0/${top.length})...`;
            await this.mapLimit(top, 3, async (r) => {
                const host = r._host;
                try {
                    const data = await this.fetchImportPage(r.url, endpoint);
                    const d = this.analyzeImportPage(data.text, data.title || r.title, r.url, !!data.pdf || r._pdf, { hint: opts.hint });
                    if (d) { checked.push(host); if (!d._weak) candidates.push(d); }
                } catch (err) { errors.push(`${host}: ${err.message}`); }
                done++;
                if (statusEl) statusEl.textContent = `${prefix}Lese ${top.length} Quellen (${done}/${top.length}, zuletzt ${host})...`;
            });
            if (!candidates.length) return { info: deviceInfo, sources: [], checked: [...new Set(checked)], candidates: [] };
            // Alle Treffer zusammenführen: Datenblatt zuerst, dann die Quellen nach Vollständigkeit (PDF-Datenblätter bevorzugt)
            candidates.sort((a, b) => b._score - a._score);
            let merged = deviceInfo;
            const sources = [];
            for (const c of candidates) {
                const next = this.mergeDeviceInfo(merged, c);
                if (JSON.stringify(next) !== JSON.stringify(merged)) sources.push(new URL(c._source).host.replace(/^www\./, ''));
                merged = next;
            }
            return { info: merged, sources: [...new Set(sources)], checked: [...new Set(checked)], candidates };
        } catch (err) {
            console.error('Web-Ergänzung Fehler:', err);
            return { info: deviceInfo, sources: [], checked: [], candidates: [] };
        }
    },

    async importPdfDatasheet(file) {
        document.getElementById('pdfImportTitle').textContent = 'Gerät aus Datenblatt importieren';
        document.getElementById('pdfAnalysisStatus').querySelector('p').textContent = 'Analysiere Datenblatt...';
        document.getElementById('pdfImportModal').classList.add('active');
        document.getElementById('pdfAnalysisStatus').style.display = 'block';
        document.getElementById('pdfDeviceForm').style.display = 'none';
        
        try {
            const fullText = await this.extractPdfText(await file.arrayBuffer());
            
            const hint = this._importHint || '';
            this._importHint = '';
            const deviceInfo = this.analyzeDatasheet(fullText, file.name);
            const statusEl = document.getElementById('pdfAnalysisStatus').querySelector('p');
            let hintWarning = '';
            if (hint) {
                // Angegebene Bezeichnung hat Vorrang; Websuche gezielt nach diesem Gerät. Datenblatt ohne die Modellkennung -> Hinweis.
                deviceInfo.name = hint;
                if (!this.textMatchesHint(fullText + ' ' + file.name, hint)) hintWarning = ' – Achtung: „' + hint + '" kommt im Datenblatt nicht vor';
            }
            const { info: enrichedInfo, sources, checked } = await this.enrichDeviceInfoFromWeb(deviceInfo, file.name, statusEl, { hint });
            if (sources.length) {
                document.getElementById('pdfImportTitle').textContent = 'Gerät aus Datenblatt importieren (ergänzt aus Web: ' + sources.join(', ') + ')';
            } else if ((checked || []).length) {
                document.getElementById('pdfImportTitle').textContent = 'Gerät aus Datenblatt importieren (per Websuche geprüft: ' + checked.join(', ') + ')';
            }
            if (hintWarning) document.getElementById('pdfImportTitle').textContent += hintWarning;
            delete enrichedInfo._ict;
            this.showPdfDeviceForm(enrichedInfo);
            
        } catch (err) {
            console.error('PDF Analyse Fehler:', err);
            alert('Fehler beim Analysieren des PDFs: ' + err.message);
            this.hidePdfImportModal();
        }
    },

    analyzeDatasheet(text, filename) {
        const ict = this.analyzeIctDatasheet(text);
        if (ict) return { ...ict, _ict: true };
        const display = this.analyzeDisplayDatasheet(text, filename);
        if (display) return display;
        const ioTable = this.analyzeIoTableDatasheet(text, filename);
        if (ioTable) return ioTable;
        const manufacturer = this.analyzeManufacturerDatasheet(text, filename);
        if (manufacturer) return manufacturer;
        return this.analyzeGenericDatasheet(text, filename);
    },

    knownManufacturers() {
        return ['Yamaha', 'Allen & Heath', 'Behringer', 'Midas', 'Soundcraft', 'DiGiCo', 'QSC', 'Shure', 'Sennheiser', 'Bose', 'JBL', 'd&b', 'L-Acoustics',
            'Crestron', 'Extron', 'Kramer', 'Barco', 'Christie', 'Epson', 'Panasonic', 'Sony', 'Blackmagic', 'Roland', 'Biamp', 'BSS', 'Lightware', 'Atlona',
            'Dell', 'iiyama', 'Samsung', 'LG', 'NEC', 'Sharp', 'Philips', 'BenQ', 'Optoma', 'ViewSonic', 'Logitech', 'Poly', 'Cisco', 'Audio-Technica', 'RCF',
            'Electro-Voice', 'Dynacord', 'Genelec', 'Neumann', 'AKG', 'Denon', 'Tascam', 'Apart', 'Bosch', 'Netgear', 'Lumens', 'AVer', 'Huddly', 'Vivitek', 'Canon'];
    },

    // Hersteller erkennen: Kopfzeilen > Dateiname > "Hersteller/Lieferant: X" > häufigster Treffer > Firmierung "X ... GmbH/Inc."
    detectManufacturer(text, filename) {
        const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const head = lines.slice(0, 8).join(' ');
        const base = (filename || '').replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
        const list = this.knownManufacturers();
        const reFor = (m, flags) => new RegExp('(^|[^a-z0-9])' + m.replace(/[&\-]/g, '.').replace(/\s+/g, '\\s*') + '(?![a-z])', flags || 'i');
        let hit = list.find(m => reFor(m).test(head)) || list.find(m => reFor(m).test(base));
        if (hit) return hit;
        const decl = (text || '').match(/(?:Hersteller|Lieferant|Manufacturer|Marke|Brand)\s*:?\s+([A-Z][\w&.-]{1,30})/);
        if (decl) return list.find(m => reFor(m).test(decl[1])) || decl[1];
        const counts = list.map(m => ({ m, n: ((text || '').match(reFor(m, 'gi')) || []).length })).filter(c => c.n).sort((a, b) => b.n - a.n);
        if (counts.length) return counts[0].m;
        const corp = (text || '').match(/\b([A-Z][A-Za-z]{2,})\s+(?:Electronics|Deutschland|Europe|Professional)?\s*(?:GmbH|AG|Inc\.?|Ltd\.?|Corporation|Co\.,?\s*Ltd)\b/);
        return corp ? corp[1] : '';
    },

    // Modellbezeichnung: "Artikelname/Modell: QM85N" > Dateiname (z. B. Datenblatt_QM85N) > kurze Kopfzeile mit Buchstaben+Ziffern
    extractModelName(text, filename) {
        const t = text || '';
        const labeled = t.match(/(?:Artikelname|Artikelbezeichnung|Modellname|Modellbezeichnung|Modellnummer|Modell|Model(?:\s*(?:name|no\.?|number))?|Produktname|Product\s*name|Typenbezeichnung)[\s:*]+([A-Z][A-Za-z0-9./+-]{1,24}\d[A-Za-z0-9./+-]*)\b/i);
        if (labeled) return labeled[1].trim();
        const base = (filename || '').replace(/\.pdf$/i, '').replace(/\(\d+\)/g, ' ').replace(/[_]+/g, ' ');
        const isModelTok = tok => /^[A-Z]{1,6}-?\d{1,5}[A-Z0-9+/-]*$/i.test(tok) && !/^(db|v\d+)$/i.test(tok);
        const fileTok = base.split(/\s+/).find(isModelTok) || base.split(/[\s-]+/).find(isModelTok);
        if (fileTok) return fileTok;
        const lines = t.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 12);
        const headTok = lines.find(l => l.length <= 20 && /^[A-Z]{1,6}[-\s]?\d{1,5}[A-Z0-9+/-]*$/i.test(l));
        if (headTok) return headTok;
        return '';
    },

    extractArticleNumber(text) {
        const m = (text || '').match(/(?:Artikelnummer|Artikel-?\s*Nr\.?|Art\.?\s*(?:Nr\.?|Nummer|#)|Bestellnummer|Order\s*(?:code|number|no\.?)|Part\s*(?:number|no\.?)|P\/N|SKU|Model\s*code)\s*:?\s*([A-Z0-9][A-Z0-9./-]{2,})/i);
        return m ? m[1].trim() : '';
    },

    // Display-/Signage-Datenblätter (z. B. Samsung): Tabellenzeilen "Eingang RGB DVI-D, Display Port 1.2",
    // "Eingang Video 2x HDMI (HDCP 2.2)", "Eingang Audio 3,5 mm Klinke", "Ausgang RGB HDMI", "Ausgang Audio 3,5 mm Klinke", "LAN Ja".
    // Regeln: USB/RS232/IR zählen nicht als Signalanschluss, Audio-Zeilen liefern nur Audio-Stecker, LAN immer als Eingang.
    analyzeDisplayDatasheet(text, filename) {
        const flat = (text || '').replace(/\s+/g, ' ');
        const rowRe = /\b(Eingang|Eingänge|Ausgang|Ausgänge|Input|Inputs|Output|Outputs)\s+(RGB|Video|Audio|USB|Digital|Analog|PC|AV|HDMI|Signal)\b\s*:?\s*(.+?)(?=\s(?:Eingang|Eingänge|Ausgang|Ausgänge|Inputs?|Outputs?|Externe|External|WiFi|WLAN|LAN|Konnektivit|Connectivity|Screenmirroring|HDBaseT|Media Player|Samsung|Bluetooth)\b|$)/gi;
        const rows = [...flat.matchAll(rowRe)];
        if (rows.length < 2) return null;

        const map = this.connectorMap();
        const inputs = [], outputs = [], inputCables = [], outputCables = [];
        const totals = { IN: {}, OUT: {} }, counters = { IN: {}, OUT: {} };
        const items = [];
        for (const r of rows) {
            const dir = /^(Eing|Input)/i.test(r[1]) ? 'IN' : 'OUT';
            const kind = r[2].toLowerCase();
            if (kind === 'usb') continue;
            const value = r[3].replace(/\([^)]*\)/g, ' ');
            if (/^\s*(N\/A|Nein|No|-)\s*$/i.test(value)) continue;
            for (const part of value.split(/[,;/](?!\d)/).map(p => p.trim()).filter(Boolean)) {
                if (/usb|rs-?232|\bir\b|steuer|control/i.test(part)) continue;
                const entry = kind === 'audio'
                    ? map.find(m => /Audio|XLR|Cinch|SPDIF|AES/.test(m.label) && m.re.test(part))
                    : map.find(m => m.re.test(part) && m.label !== 'LAN');
                if (!entry) continue;
                const cnt = part.match(/(\d+)\s*x/i);
                const count = cnt ? Math.min(parseInt(cnt[1]), 16) : 1;
                items.push({ dir, entry, count });
                totals[dir][entry.label] = (totals[dir][entry.label] || 0) + count;
            }
        }
        for (const it of items) {
            for (let i = 0; i < it.count; i++) {
                counters[it.dir][it.entry.label] = (counters[it.dir][it.entry.label] || 0) + 1;
                const nm = totals[it.dir][it.entry.label] > 1 ? `${it.entry.label} ${it.dir} ${counters[it.dir][it.entry.label]}` : `${it.entry.label} ${it.dir}`;
                if (it.dir === 'IN') { inputs.push(nm); inputCables.push(this.matchCableType(it.entry.cable)); }
                else { outputs.push(nm); outputCables.push(this.matchCableType(it.entry.cable)); }
            }
        }
        if (!inputs.length && !outputs.length) return null;
        if (/\bLAN\s*(?::\s*)?(Ja|Yes)\b|RJ-?45|Ethernet/i.test(flat)) { inputs.push('LAN'); inputCables.push(this.matchCableType('Cat5/6')); }

        const manufacturer = this.detectManufacturer(text, filename);
        const model = this.extractModelName(text, filename);
        const name = [manufacturer, model].filter(Boolean).join(' ').trim() || (filename || '').replace(/\.pdf$/i, '');
        const article = this.extractArticleNumber(text);

        const tl = flat.toLowerCase();
        const touch = /touch(?:f[äa]higkeit|[\s-]*technolog\w*|[\s-]*screen)?\s*:?\s*(?:ja|yes|\d+[\s-]*(?:punkt|point))/i.test(flat) || /\btouch\s*display|touchscreen\b/i.test(tl) && !/touch\w*\s*(?:n\/a|nein|no)\b/i.test(tl);
        let type = 'Display', group = 'video';
        if (touch) type = 'Touchdisplay';
        else if (/projektor|projector|lichtstrom|ansi[\s-]*lumen/i.test(tl)) type = 'Projector';
        else if (/monitor/i.test(tl) && !/signage/i.test(tl)) type = 'Monitor';

        const groupInfo = this.groups.find(g => g.id === group);
        const color = groupInfo?.color || '#4d49bc';
        return { name, article, type, group, color, inputs, outputs, inputCables, outputCables };
    },

    // Datenblätter mit Ein-/Ausgangs-Tabelle (z. B. PureLink): eigene Zeilen "Eingänge 1x HDBT (RJ45)", "Ausgänge 1x USB 3.2 Gen1 (USB-C)",
    // "Inputs 2x HDMI, 1x DP". Regeln: Zähler "Nx" gilt pro Eintrag, Steckertyp aus Klammer (USB-C) hat Vorrang vor der Beschreibung,
    // USB-C zählt als Video-/Datenanschluss, USB-A/RS232/IR nicht. Name = Produktbeschreibung unter der Modellkennung, Artikel = Modellkennung.
    analyzeIoTableDatasheet(text, filename) {
        const lines = (text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const rowRe = /^(Eingänge|Eingang|Ausgänge|Ausgang|Inputs?|Outputs?)\s*:?\s+(\d+\s*x\s*.+|[A-Za-z].*)$/i;
        // Plural-Zeilen ("Eingänge ...") immer; Singular ("Eingang ...") nur mit Zähler "Nx", damit Fließtext nicht greift
        const rows = lines.map(l => l.match(rowRe)).filter(m => m && (/^(Eingänge|Ausgänge|Inputs|Outputs)$/i.test(m[1]) || /\d\s*x/i.test(m[2])));
        if (!rows.length) return null;

        const map = this.connectorMap();
        const items = [];
        for (const r of rows) {
            const dir = /^(Eing|Input)/i.test(r[1]) ? 'IN' : 'OUT';
            if (/^\s*(N\/A|Nein|No|Keine|None|-)\s*$/i.test(r[2])) continue;
            for (const part of r[2].split(/[,;](?!\d)|\s+\+\s+/).map(p => p.trim()).filter(Boolean)) {
                const paren = (part.match(/\(([^)]*)\)/) || [])[1] || '';
                const body = part.replace(/\([^)]*\)/g, ' ');
                if (/rs-?232|\bir\b|infrarot|steuer|control|usb[\s-]*a\b|usb[\s-]*b\b/i.test(body + ' ' + paren) && !/usb[\s-]*c|type[\s-]*c/i.test(body + ' ' + paren)) continue;
                // Beschreibung zuerst ("HDBT (RJ45)" -> HDBaseT, nicht LAN); Klammer nur, wenn die Beschreibung keinen Stecker nennt ("USB 3.2 Gen1 (USB-C)")
                const entry = map.find(m => m.re.test(body)) || map.find(m => m.re.test(paren));
                if (!entry) continue;
                const cnt = part.match(/(\d+)\s*x/i);
                items.push({ dir, entry, count: cnt ? Math.min(parseInt(cnt[1]), 32) : 1 });
            }
        }
        if (!items.length) return null;

        const inputs = [], outputs = [], inputCables = [], outputCables = [];
        const totals = { IN: {}, OUT: {} }, counters = { IN: {}, OUT: {} };
        items.forEach(it => { totals[it.dir][it.entry.label] = (totals[it.dir][it.entry.label] || 0) + it.count; });
        for (const it of items) {
            for (let i = 0; i < it.count; i++) {
                counters[it.dir][it.entry.label] = (counters[it.dir][it.entry.label] || 0) + 1;
                const nm = totals[it.dir][it.entry.label] > 1 ? `${it.entry.label} ${it.dir} ${counters[it.dir][it.entry.label]}` : `${it.entry.label} ${it.dir}`;
                if (it.dir === 'IN') { inputs.push(nm); inputCables.push(this.matchCableType(it.entry.cable)); }
                else { outputs.push(nm); outputCables.push(this.matchCableType(it.entry.cable)); }
            }
        }

        // Modellkennung: eigenständige Zeile wie "PT-HDBT-1020C-RX" (auch vor "DATENBLATT"), sonst Dateiname
        const modelRe = /^([A-Z][A-Z0-9]{0,7}(?:-[A-Z0-9]{1,8}){1,5})(?:\s+(?:DATENBLATT|DATA\s*SHEET|DATASHEET))?$/i;
        const modelLines = lines.map(l => (l.match(modelRe) || [])[1]).filter(m => m && /\d/.test(m));
        let model = modelLines.find(m => modelLines.filter(x => x.toUpperCase() === m.toUpperCase()).length > 1) || modelLines[0] || '';
        if (!model) { const f = (filename || '').replace(/\.pdf$/i, '').split(/[_\s]+/).find(t => /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+){1,5}$/i.test(t) && /\d/.test(t)); if (f) model = f; }
        // Produktbeschreibung: nächste aussagekräftige Zeile nach der Modellkennung (nicht "DATENBLATT", nicht www./Kopfzeile)
        let description = '';
        const idx = lines.findIndex(l => model && l.toUpperCase() === model.toUpperCase());
        if (idx >= 0) description = lines.slice(idx + 1, idx + 4).find(l => l.length >= 8 && /[a-z]/.test(l) && !/^(datenblatt|data\s*sheet|www\.|technische daten|features)/i.test(l) && !modelRe.test(l)) || '';
        const manufacturer = this.detectManufacturer(text, filename);
        let name = description || [manufacturer, model].filter(Boolean).join(' ').trim() || (filename || '').replace(/\.pdf$/i, '');
        const article = model || this.extractArticleNumber(text);

        const head = ((description || '') + ' ' + lines.slice(0, 12).join(' ')).toLowerCase();
        let type = 'Gerät';
        if (/receiver|empf[äa]nger|\brx\b/.test(head)) type = 'Receiver';
        else if (/transmitter|sender\b|\btx\b/.test(head)) type = 'Transmitter';
        else if (/extender/.test(head)) type = 'Extender';
        else if (/switch|umschalter|matrix/.test(head)) type = 'Switch';
        else if (/scaler|converter|konverter|wandler/.test(head)) type = 'Converter';
        else if (/splitter|verteiler/.test(head)) type = 'Splitter';
        const labels = items.map(i => i.entry.label);
        let group = 'video';
        if (labels.every(l => /^(XLR|Audio|Dante|AES|SPDIF|Cinch)$/.test(l))) group = 'audio';
        else if (labels.some(l => l === 'DMX')) group = 'light';
        const groupInfo = this.groups.find(g => g.id === group);
        return { name, article, type, group, color: groupInfo?.color || '#4d49bc', inputs, outputs, inputCables, outputCables };
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
            { re: /mini[\s-]*dp|display\s*port|\bdp\b/i, label: 'DP', cable: 'DP' },
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
            { re: /hdbase-?t|\bhdbt\b/i, label: 'HDBaseT', cable: 'Cat5/6' },
            { re: /usb[\s-]*(?:c\b|type[\s-]*c)|type[\s-]*c\b/i, label: 'USB-C', cable: 'USB' },
            { re: /rj45|ethernet|lan|cat\s*\d/i, label: 'LAN', cable: 'Cat5/6' },
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

        const base = filename.replace(/\.pdf$/i, '').replace(/^DB[_-]/i, '').replace(/[_-](de|en|fr|it)$/i, '');
        const manufacturer = this.detectManufacturer(text, base);
        // Titelzeile: generische Überschriften ("Technical Data Sheet", "Datenblatt", "1 / 5") überspringen,
        // aus "Digital Mixing Console DM3" nur die Modellkennung (DM3) übernehmen
        const skipLine = /^(technical\s+)?data\s*sheet|^datenblatt|^technische\s+daten|^\d+\s*\/\s*\d+$|^overview|^spec(ification)?s?$|^produktinformation/i;
        const titleLine = (lines.find(l => !skipLine.test(l) && l.length <= 60) || lines[0]).replace(/\s+/g, ' ').trim();
        const tokenInTitle = (titleLine.match(/(?:^|\s)([A-Z]{1,6}-?\d{1,5}[A-Z0-9+/-]*)(?=\s|$)/) || [])[1];
        const model = this.extractModelName(text, filename) || tokenInTitle || (titleLine.length <= 40 ? titleLine : titleLine.split(' ').slice(0, 3).join(' '));
        const name = manufacturer && !new RegExp('^' + manufacturer.replace(/[&\-]/g, '.'), 'i').test(model) ? `${manufacturer} ${model}` : model;
        const article = this.extractArticleNumber(text) || model.split(' ')[0];

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

        // Funkempfänger (z. B. Shure SLXD4Q+): "4 XLR- und 4 1/4"-Ausgänge und 2 lokale Ethernet-Anschlüsse",
        // Antennen A/B als Eingang + Kaskaden-/Loop-Ausgang (Coax)
        const isReceiver = /(drahtlos|funk|wireless)[\s-]*(empfänger|receiver)|\d+[\s-]*kanal[\s-]*empfänger|channel\s*receiver/i.test(flat);
        if (isReceiver && !isVideo) {
            const cat = this.matchCableType('Cat5/6');
            const xlr = this.matchCableType('XLR');
            const klinke = this.matchCableType('Klinke');
            const coax = this.matchCableType('Coax');
            const inputs = [], outputs = [], inputCables = [], outputCables = [];
            const outM = flat.match(/(\d{1,2})\s*x?\s*XLR-?\s*(?:und|and|\/|\+)\s*(\d{1,2})?\s*x?\s*(?:1\/4["”]|6,3\s*mm|Klinke|TRS)/i)
                || flat.match(/(\d{1,2})\s*x?\s*XLR\s*(?:und|and|\/)\s*(?:6,3\s*mm\s*)?(?:Klinke|TRS|1\/4["”])/i);
            const chM = flat.match(/(\d{1,2})[\s-]*(?:kanal|channel)/i);
            const nOut = Math.min(outM ? parseInt(outM[1]) : (chM ? parseInt(chM[1]) : 1), 16);
            const nTrs = outM ? (outM[2] ? parseInt(outM[2]) : nOut) : nOut;
            for (let i = 1; i <= nOut; i++) { outputs.push(nOut > 1 ? `XLR OUT ${i}` : 'XLR OUT'); outputCables.push(xlr); }
            for (let i = 1; i <= Math.min(nTrs, 16); i++) { outputs.push(nTrs > 1 ? `Klinke OUT ${i}` : 'Klinke OUT'); outputCables.push(klinke); }
            const ethM = flat.match(/(\d)\s*(?:lokale\s*)?(?:Ethernet|RJ45|Netzwerk)[\s-]*(?:Anschl|Ports?|Buchsen)/i);
            const nEth = ethM ? parseInt(ethM[1]) : 1;
            for (let i = 1; i <= nEth; i++) { inputs.push(nEth > 1 ? `LAN ${i}` : 'LAN'); inputCables.push(cat); }
            ['A', 'B'].forEach(a => {
                inputs.push(`Antenne ${a} IN`); inputCables.push(coax);
                outputs.push(`Antenne ${a} OUT`); outputCables.push(coax);
            });
            const groupInfo = this.groups.find(g => g.id === 'audio');
            return { name, article: '', type: 'Funkempfänger', group: 'audio', color: groupInfo?.color || '#4d49bc', inputs, outputs, inputCables, outputCables };
        }

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
        
        const manufacturer = this.detectManufacturer(text, filename);
        let model = this.extractModelName(text, filename);
        if (!model) {
            const modelPatterns = [
                /model[:\s]+([A-Z0-9][\w\-\.]+)/i,
                /product[:\s]+([A-Z0-9][\w\-\.]+)/i,
                /([A-Z]{2,}[\-\s]?[A-Z0-9]{2,}[\-\s]?[A-Z0-9]*)/,
            ];
            for (const pattern of modelPatterns) {
                const match = text.match(pattern);
                if (match) { model = match[1].trim(); break; }
            }
        }
        if (!model) model = filename.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
        const name = manufacturer && !new RegExp('^' + manufacturer.replace(/[&\-]/g, '.'), 'i').test(model) ? `${manufacturer} ${model}` : model;

        const article = this.extractArticleNumber(text);
        
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
        // Kopfzeilen (Titel/Untertitel) haben Vorrang vor Erwähnungen im Fließtext ("eingebauter Lautsprecher" macht kein Display zum Speaker)
        const headLower = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 6).join(' ').toLowerCase();
        for (const [keyword, typeValue] of Object.entries(typeKeywords)) {
            if (headLower.includes(keyword)) { type = typeValue; break; }
        }
        if (!type) {
            for (const [keyword, typeValue] of Object.entries(typeKeywords)) {
                if (textLower.includes(keyword)) {
                    type = typeValue;
                    break;
                }
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
