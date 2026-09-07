const ShortcutsMixin = {
    isMacPlatform() {
        return /Mac|iPhone|iPad/.test(navigator.platform || '') || /Mac OS/.test(navigator.userAgent || '');
    },

    shortcutDefinitions() {
        return [
            { section: 'Bearbeiten', items: [
                { label: 'Rückgängig', combos: [{ mod: true, keys: ['z'] }], run: () => this.undo() },
                { label: 'Wiederherstellen', combos: [{ mod: true, keys: ['y'] }, { mod: true, shift: true, keys: ['z'] }], run: () => this.redo() },
                { label: 'Markiertes Gerät kopieren', combos: [{ mod: true, keys: ['c'] }], run: () => this.copySelectedDevice() },
                { label: 'Gerät einfügen', combos: [{ mod: true, keys: ['v'] }], run: () => this.pasteDevice() },
                { label: 'Markiertes Element löschen', combos: [{ keys: ['Delete'] }], info: true },
                { label: 'Dialog schließen / Verbindung abbrechen', combos: [{ keys: ['Escape'] }], info: true }
            ]},
            { section: 'Geräte', items: [
                { label: 'Neues Gerät einfügen (Gerätesuche öffnen)', combos: [{ mod: true, keys: ['f'] }], run: () => this.focusDeviceSearch() },
                { label: 'Markiertes Gerät bearbeiten (Geräteverwaltung)', combos: [{ mod: true, keys: ['e'] }], run: () => this.editSelectedDevice() }
            ]},
            { section: 'Datei', items: [
                { label: 'Speichern', combos: [{ mod: true, keys: ['s'] }], buttonId: 'btnSave', run: () => this.saveDiagram() },
                { label: 'Drucken: Plan als PDF (A1)', combos: [{ mod: true, keys: ['p'] }], buttonId: 'btnExportPDF', run: () => this.showPdfExportModal() },
                { label: 'Drucken: Listen PDF', combos: [{ mod: true, shift: true, keys: ['p'] }], buttonId: 'btnExportLists', run: () => this.showPdfExportModal('lists') },
                { label: 'Projekteigenschaften öffnen', combos: [{ mod: true, keys: ['i'] }], buttonId: 'btnProjectSettings', run: () => this.showProjectModal() }
            ]},
            { section: 'Verbindungen', items: [
                { label: 'Auto-Verbinden', combos: [{ mod: true, keys: ['b'] }], buttonId: 'btnAutoConnect', run: () => this.autoConnect() },
                { label: 'Verbindungen als Kurve darstellen', combos: [{ mod: true, shift: true, keys: ['k'] }], run: () => this.setLineStyleFromShortcut('curve') },
                { label: 'Verbindungen mit 90° Ecken darstellen', combos: [{ mod: true, shift: true, keys: ['e'] }], run: () => this.setLineStyleFromShortcut('orthogonal') }
            ]},
            { section: 'Ansicht', items: [
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
                e.preventDefault();
                item.run();
                return true;
            }
        }
        return false;
    },

    comboLabel(combo) {
        const mac = this.isMacPlatform();
        const names = { Delete: 'Entf', Escape: 'Esc', '+': '+', '-': '−', '/': '/' };
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

    copySelectedDevice() {
        const sel = this.selectedElement;
        if (!sel || sel.type !== 'device') return;
        this.clipboardDevice = JSON.parse(JSON.stringify(sel.element));
    },

    pasteDevice() {
        const src = this.clipboardDevice;
        if (!src) return;
        const template = {
            name: src.name,
            type: src.type,
            article: src.article || '',
            group: src.group || 'other',
            color: src.color,
            placeholder: !!src.placeholder,
            inputs: (src.inputs || []).map(p => p.name),
            outputs: (src.outputs || []).map(p => p.name),
            inputCables: (src.inputs || []).map(p => p.cable || ''),
            outputCables: (src.outputs || []).map(p => p.cable || '')
        };
        const offset = this.gridSize || 20;
        const device = this.addDeviceToCanvas(template, src.x + offset, src.y + offset);
        if (src.origin) device.origin = { ...src.origin };
        if (src.width && src.height && (src.width !== device.width || src.height !== device.height)) {
            device.width = src.width;
            device.height = src.height;
            this.renderDevice(device);
        }
        this.clipboardDevice = { ...src, x: device.x, y: device.y };
        this.selectElement(device, 'device');
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
