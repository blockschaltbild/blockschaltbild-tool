const ShortcutsMixin = {
    isMacPlatform() {
        return /Mac|iPhone|iPad/.test(navigator.platform || '') || /Mac OS/.test(navigator.userAgent || '');
    },

    shortcutDefinitions() {
        return [
            { section: 'Bearbeiten', items: [
                { label: 'Rückgängig', combos: [{ mod: true, keys: ['z'] }], run: () => this.undo() },
                { label: 'Wiederherstellen', combos: [{ mod: true, keys: ['y'] }, { mod: true, shift: true, keys: ['z'] }], run: () => this.redo() },
                { label: 'Markierte Geräte/Gruppe kopieren', combos: [{ mod: true, keys: ['c'] }], run: () => this.copySelectedDevice() },
                { label: 'Geräte einfügen (auch auf anderem Blatt)', combos: [{ mod: true, keys: ['v'] }], run: () => this.pasteDevice() },
                { label: 'Markiertes Element löschen', combos: [{ keys: ['Delete'] }, { keys: ['Backspace'] }], info: true },
                { label: 'Dialog schließen / Verbindung abbrechen', combos: [{ keys: ['Escape'] }], info: true }
            ]},
            { section: 'Geräte', items: [
                { label: 'Neues Gerät einfügen (Gerätesuche öffnen)', combos: [{ mod: true, keys: ['f'] }], run: () => this.focusDeviceSearch() },
                { label: 'Markiertes Gerät bearbeiten (Geräteverwaltung)', combos: [{ mod: true, keys: ['e'] }], run: () => this.editSelectedDevice() }
            ]},
            { section: 'Datei', items: [
                { label: 'Speichern', combos: [{ mod: true, keys: ['s'] }], buttonId: 'btnSave', run: () => this.saveDiagram() },
                { label: 'Speichern unter ...', combos: [{ mod: true, shift: true, keys: ['s'] }], buttonId: 'btnSaveAs', run: () => this.saveDiagramAs() },
                { label: 'Drucken: Plan als PDF (A1)', combos: [{ mod: true, keys: ['p'] }], buttonId: 'btnExportPDF', run: () => this.showPdfExportModal() },
                { label: 'Drucken: Listen PDF', combos: [{ mod: true, shift: true, keys: ['p'] }], buttonId: 'btnExportLists', run: () => this.showPdfExportModal('lists') },
                { label: 'Projekteigenschaften öffnen', combos: [{ mod: true, keys: ['i'] }], buttonId: 'btnProjectSettings', run: () => this.showProjectModal() }
            ]},
            { section: 'Gruppierung', items: [
                { label: 'Auswahl gruppieren', combos: [{ mod: true, keys: ['j'] }], run: () => this.groupSelectedDevicesShortcut() },
                { label: 'Gruppierung aufheben', combos: [{ mod: true, shift: true, keys: ['j'] }], run: () => this.ungroupShortcut() },
                { label: 'Gruppe ein-/ausklappen', combos: [{ mod: true, keys: ['k'] }], run: () => this.toggleCollapseShortcut() }
            ]},
            { section: 'Verbindungen', items: [
                { label: 'Auto-Verbinden', combos: [{ mod: true, keys: ['b'] }], buttonId: 'btnAutoConnect', run: () => this.autoConnect() },
                { label: 'Verbindungen als Kurve darstellen', combos: [{ mod: true, shift: true, keys: ['k'] }], run: () => this.setLineStyleFromShortcut('curve') },
                { label: 'Verbindungen mit 90° Ecken darstellen', combos: [{ mod: true, shift: true, keys: ['e'] }], run: () => this.setLineStyleFromShortcut('orthogonal') }
            ]},
            { section: 'Ansicht', items: [
                { label: 'Verschiebe-Modus an/aus (danach mit gedrückter Maustaste ziehen)', combos: [{ keys: ['x'] }], info: true },
                { label: 'Vergrößern', combos: [{ mod: true, shift: null, keys: ['+', '='], codes: ['NumpadAdd'] }], buttonId: 'btnZoomIn', run: () => this.setZoom(this.zoom + 0.1) },
                { label: 'Verkleinern', combos: [{ mod: true, shift: null, keys: ['-'], codes: ['NumpadSubtract'] }], buttonId: 'btnZoomOut', run: () => this.setZoom(this.zoom - 0.1) },
                { label: 'Zoom zurücksetzen (100 %)', combos: [{ mod: true, keys: ['0'], codes: ['Numpad0'] }], run: () => this.setZoom(1) },
                { label: 'Raster an/aus', combos: [{ mod: true, keys: ['g'] }], run: () => this.toggleCheckboxFromShortcut('chkGridVisible') },
                { label: 'Einrasten an/aus', combos: [{ mod: true, shift: true, keys: ['g'] }], run: () => this.toggleCheckboxFromShortcut('chkSnapGrid') },
                { label: 'Tastenkürzel anzeigen', combos: [{ mod: true, shift: null, keys: ['/'] }], buttonId: 'btnShowShortcuts', run: () => this.toggleShortcutsModal() }
            ]}
        ];
    },

    comboMatches(combo, e) {
        if (!!combo.mod !== (e.ctrlKey || e.metaKey)) return false;
        if (e.altKey) return false;
        if (combo.shift !== null && !!combo.shift !== e.shiftKey) return false;
        if (combo.codes && combo.codes.includes(e.code)) return true;
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        return combo.keys.includes(key);
    },

    handleShortcutKey(e) {
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return false;
        const modalOpen = !!document.querySelector('.modal.active');
        for (const section of this.shortcutDefinitions()) {
            for (const item of section.items) {
                if (item.info || !item.run) continue;
                if (!item.combos.some(c => this.comboMatches(c, e))) continue;
                if (modalOpen && item.buttonId !== 'btnShowShortcuts') return false;
                if (this.readOnly && section.section !== 'Ansicht') {
                    e.preventDefault();
                    this.notifyReadOnly();
                    return true;
                }
                e.preventDefault();
                item.run();
                return true;
            }
        }
        return false;
    },

    comboLabel(combo) {
        const mac = this.isMacPlatform();
        const names = { Delete: 'Entf', Backspace: 'Rücktaste', Escape: 'Esc', '+': '+', '-': '−', '/': '/' };
        const parts = [];
        if (combo.mod) parts.push(mac ? '⌘' : 'Strg');
        if (combo.shift) parts.push(mac ? '⇧' : 'Umschalt');
        const key = combo.keys[0];
        parts.push(names[key] || key.toUpperCase());
        return parts;
    },

    initShortcutHints() {
        this.shortcutDefinitions().forEach(section => {
            section.items.forEach(item => {
                if (!item.buttonId) return;
                const btn = document.getElementById(item.buttonId);
                if (!btn) return;
                const hint = this.comboLabel(item.combos[0]).join('+');
                btn.title = `${btn.title || item.label} (${hint})`;
            });
        });
    },

    getCopySourceDeviceIds() {
        if (this.selectedGroupId) {
            const group = this.deviceGroups.find(g => g.id === this.selectedGroupId);
            if (group && group.deviceIds.length) return { ids: [...group.deviceIds], isGroup: true, groupName: group.name };
        }
        if (this.selectedDevices && this.selectedDevices.length) {
            return { ids: [...this.selectedDevices], isGroup: false, groupName: null };
        }
        if (this.selectedElement && this.selectedElement.type === 'device') {
            return { ids: [this.selectedElement.element.id], isGroup: false, groupName: null };
        }
        return null;
    },

    copySelectedDevice() {
        const source = this.getCopySourceDeviceIds();
        if (!source) return;
        const devices = this.devices.filter(d => source.ids.includes(d.id)).map(d => JSON.parse(JSON.stringify(d)));
        if (!devices.length) return;
        const idSet = new Set(devices.map(d => d.id));
        const connections = this.connections
            .filter(c => idSet.has(c.fromDevice) && idSet.has(c.toDevice))
            .map(c => JSON.parse(JSON.stringify(c)));
        this.clipboardSelection = { devices, connections, isGroup: source.isGroup, groupName: source.groupName };
    },

    pasteDevice() {
        const clip = this.clipboardSelection;
        if (!clip || !clip.devices.length) return;
        this.recordHistory();
        const offset = this.gridSize || 20;
        const idMap = {};
        const newDevices = [];
        clip.devices.forEach(src => {
            const device = {
                id: `device-${this.nextDeviceId++}`,
                name: src.name,
                type: src.type,
                article: src.article || '',
                group: src.group || 'other',
                color: src.color,
                x: this.snap(src.x + offset),
                y: this.snap(src.y + offset),
                width: src.width,
                height: src.height,
                placeholder: !!src.placeholder,
                origin: src.origin ? { ...src.origin } : undefined,
                inputs: (src.inputs || []).map(p => ({ ...p, connected: false })),
                outputs: (src.outputs || []).map(p => ({ ...p, connected: false }))
            };
            idMap[src.id] = device.id;
            this.devices.push(device);
            newDevices.push(device);
        });
        newDevices.forEach(d => this.renderDevice(d));
        this.updateCanvasSize();

        clip.connections.forEach(c => {
            const fromId = idMap[c.fromDevice];
            const toId = idMap[c.toDevice];
            if (!fromId || !toId) return;
            const connection = { ...c, id: `conn-${this.nextConnectionId++}`, fromDevice: fromId, toDevice: toId };
            const fromDevice = newDevices.find(d => d.id === fromId);
            const toDevice = newDevices.find(d => d.id === toId);
            const fromPort = fromDevice?.outputs.find(p => p.id === connection.fromPort);
            const toPort = toDevice?.inputs.find(p => p.id === connection.toPort);
            if (fromPort) fromPort.connected = true;
            if (toPort) toPort.connected = true;
            this.connections.push(connection);
            this.renderConnection(connection);
        });

        if (clip.isGroup && newDevices.length >= 2) {
            const num = this.nextDeviceGroupId++;
            this.deviceGroups.push({ id: `devgroup-${num}`, name: clip.groupName ? `${clip.groupName} (Kopie)` : `Gruppe ${num}`, deviceIds: newDevices.map(d => d.id) });
        }
        this.renderGroupOutlines();
        this.drawCrossingBridges();

        clip.devices.forEach((src, i) => { src.x = newDevices[i].x; src.y = newDevices[i].y; });

        this.deselectAll();
        if (newDevices.length === 1) {
            this.selectElement(newDevices[0], 'device');
        } else {
            this.selectedDevices = newDevices.map(d => d.id);
            this.renderMultiSelectHighlight();
            this.showSelectionPanel();
        }
    },

    focusDeviceSearch() {
        document.getElementById('sidebar')?.classList.remove('collapsed');
        const input = document.getElementById('deviceSearch');
        if (!input) return;
        input.focus();
        input.select();
    },

    editSelectedDevice() {
        const sel = this.selectedElement;
        if (!sel || sel.type !== 'device') return;
        this.openDeviceTemplateEditor(sel.element);
    },

    setLineStyleFromShortcut(style) {
        const sel = document.getElementById('selLineStyle');
        if (!sel || sel.value === style) return;
        sel.value = style;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
    },

    toggleCheckboxFromShortcut(id) {
        const chk = document.getElementById(id);
        if (!chk) return;
        chk.checked = !chk.checked;
        chk.dispatchEvent(new Event('change', { bubbles: true }));
    },

    renderShortcutsList() {
        const list = document.getElementById('shortcutsList');
        if (!list) return;
        const kbd = (combo) => this.comboLabel(combo).map(p => `<kbd>${this.escapeHtml(p)}</kbd>`).join('<span class="shortcut-plus">+</span>');
        list.innerHTML = this.shortcutDefinitions().map(section => `
            <h3>${this.escapeHtml(section.section)}</h3>
            <table class="shortcuts-table">
                ${section.items.map(item => `
                    <tr>
                        <td>${this.escapeHtml(item.label)}</td>
                        <td class="shortcut-keys">${item.combos.map(kbd).join('<span class="shortcut-or">oder</span>')}</td>
                    </tr>
                `).join('')}
            </table>
        `).join('');
    },

    showShortcutsModal() {
        this.renderShortcutsList();
        document.getElementById('shortcutsModal').classList.add('active');
    },

    hideShortcutsModal() {
        document.getElementById('shortcutsModal').classList.remove('active');
    },

    toggleShortcutsModal() {
        const modal = document.getElementById('shortcutsModal');
        if (modal.classList.contains('active')) this.hideShortcutsModal();
        else this.showShortcutsModal();
    }
};
