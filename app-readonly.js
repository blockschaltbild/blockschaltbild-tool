const ReadOnlyMixin = {
    readOnlyDisabledIds: [
        'projectName', 'projectNumber', 'btnProjectSettings', 'btnUndo', 'btnRedo',
        'btnSave', 'btnSaveAs', 'btnCloudSave', 'btnCloudSaveAs', 'btnCloudShare', 'chkAutosave', 'autosaveMinutes', 'btnRestoreAutosave',
        'btnExportPDF', 'btnExportLists', 'btnExportDevices',
        'btnImportDevices', 'btnAddDevice', 'btnAddPlaceholder', 'btnAddTextbox',
        'btnManageDevices', 'btnManageCables',
        'btnAutoConnect', 'btnClearConnections', 'btnCheckSignals', 'chkAutoConverter', 'btnCheckLengths',
        'chkSnapGrid', 'selLineStyle', 'gridSizeInput', 'btnAddSheet'
    ],

    readOnlyGuardedMethods: [
        'saveDiagram', 'saveDiagramAs', 'runAutosave', 'restoreAutosave',
        'addDeviceToCanvas', 'addPlaceholderDevice', 'addTextbox', 'pasteDevice',
        'createConnection', 'finishReconnect', 'deleteSelected', 'undo', 'redo',
        'addSheet', 'deleteSheet', 'startSheetRename',
        'autoConnect', 'clearConnections', 'validateConnections', 'checkConnectionLengths', 'saveMissingLengths',
        'showPdfExportModal', 'startPdfExportFromModal', 'showExportModal', 'exportDevicesExcel', 'exportDevicesByGroups',
        'showDeviceModal', 'showImportChoiceModal', 'importDevices', 'importWebsiteDevice',
        'showGroupModal', 'showDeviceManageModal', 'showCableModal', 'showProjectModal',
        'showDeviceContextMenu', 'openDeviceTemplateEditor', 'editSelectedDevice',
        'importLibrary', 'resetLibrary', 'exportLibrary'
    ],

    installReadOnlyGuards() {
        const proto = Object.getPrototypeOf(this);
        this.readOnlyGuardedMethods.forEach(name => {
            const original = proto[name];
            if (typeof original !== 'function' || original.__readOnlyGuarded) return;
            const guarded = function (...args) {
                if (this.readOnly) { this.notifyReadOnly(); return undefined; }
                return original.apply(this, args);
            };
            guarded.__readOnlyGuarded = true;
            proto[name] = guarded;
        });
    },

    setReadOnly(on, info) {
        const wasReadOnly = !!this.readOnly;
        this.readOnly = !!on;
        this.readOnlyInfo = on ? (info || {}) : null;
        document.body.classList.toggle('read-only', this.readOnly);

        if (this.readOnly) {
            this.hideDeviceContextMenu();
            this.cancelConnection();
            this.draggedDevice = null;
            this.draggedTextbox = null;
            this.bendDrag = null;
            this.reconnect = null;
            this.deselectAll();
            if (this.autosaveTimer) { clearInterval(this.autosaveTimer); this.autosaveTimer = null; }
            this.undoStack = [];
            this.redoStack = [];
        } else if (wasReadOnly) {
            this.restartAutosaveTimer();
        }

        this.readOnlyDisabledIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (this.readOnly) {
                if (el.dataset.roWasDisabled === undefined) el.dataset.roWasDisabled = el.disabled ? '1' : '0';
                el.disabled = true;
            } else if (el.dataset.roWasDisabled !== undefined) {
                el.disabled = el.dataset.roWasDisabled === '1';
                delete el.dataset.roWasDisabled;
            }
        });
        if (!this.readOnly) this.updateHistoryButtons();

        this.renderSheetTabs();
        this.renderReadOnlyBanner();
        this.updateAutosaveStatus();
        this.updateSaveStatus();
    },

    renderReadOnlyBanner() {
        let banner = document.getElementById('readOnlyBanner');
        if (!this.readOnly) {
            if (banner) banner.remove();
            return;
        }
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'readOnlyBanner';
            banner.className = 'read-only-banner';
            const main = document.querySelector('.canvas-container');
            const tabs = document.getElementById('sheetTabs');
            if (main && tabs) main.insertBefore(banner, tabs);
            else document.body.appendChild(banner);
        }
        const owner = this.readOnlyInfo && this.readOnlyInfo.ownerEmail ? ` – freigegeben von ${this.escapeHtml(this.readOnlyInfo.ownerEmail)}` : '';
        banner.innerHTML = `<span class="ro-lock">🔒</span> <b>Nur Lesen</b>${owner}. Du kannst dieses Projekt ansehen und zoomen, aber nichts ändern, speichern oder drucken.`;
    },

    notifyReadOnly() {
        const banner = document.getElementById('readOnlyBanner');
        if (!banner) return;
        banner.classList.remove('flash');
        void banner.offsetWidth;
        banner.classList.add('flash');
    },

    readOnlyMouseDown(e) {
        const target = e.target;
        const textboxBlock = target.closest('.textbox-block');
        if (textboxBlock) {
            const box = this.textboxes.find(t => t.id === textboxBlock.dataset.textboxId);
            if (box) this.selectElement(box, 'textbox');
            return;
        }
        const connEl = target.closest('.connection-group') || target.closest('.conn-bend') || target.closest('.conn-handle');
        if (connEl) {
            const conn = this.connections.find(c => c.id === connEl.dataset.connectionId);
            if (conn) this.selectElement(conn, 'connection');
            return;
        }
        const deviceBlock = target.closest('.device-block');
        if (deviceBlock) {
            const device = this.devices.find(d => d.id === deviceBlock.dataset.deviceId);
            if (device) this.selectElement(device, 'device');
        }
    }
};
