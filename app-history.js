const HistoryMixin = {
    initHistory() {
        this.historyLimit = 20;
        this.undoStack = [];
        this.redoStack = [];
        this.historyPending = false;
        this.historyLastMergeKey = null;
        this.dragHistoryRecorded = false;
        this.updateHistoryButtons();
    },

    captureHistoryState() {
        this.storeActiveSheet();
        const state = {
            sheets: this.sheets.map(s => ({ id: s.id, name: s.name, devices: s.devices, connections: s.connections, textboxes: s.textboxes || [], deviceGroups: s.deviceGroups || [] })),
            activeSheet: this.activeSheet,
            nextDeviceId: this.nextDeviceId,
            nextConnectionId: this.nextConnectionId,
            nextTextboxId: this.nextTextboxId,
            nextSheetId: this.nextSheetId,
            nextDeviceGroupId: this.nextDeviceGroupId
        };
        return JSON.stringify(state);
    },

    recordHistory(options = {}) {
        if (this.historyRestoring || this.historySuspended) return false;
        if (this.historyPending) return false;
        const mergeKey = options.merge || null;
        if (mergeKey && this.historyLastMergeKey === mergeKey && this.undoStack.length) return false;
        
        const snapshot = this.captureHistoryState();
        if (this.undoStack.length && this.undoStack[this.undoStack.length - 1] === snapshot) {
            this.historyLastMergeKey = mergeKey;
            this.redoStack = [];
            this.updateHistoryButtons();
            return false;
        }
        this.undoStack.push(snapshot);
        if (this.undoStack.length > this.historyLimit) this.undoStack.shift();
        this.redoStack = [];
        this.historyLastMergeKey = mergeKey;
        
        if (!mergeKey) {
            this.historyPending = true;
            setTimeout(() => { this.historyPending = false; }, 0);
        }
        this.updateHistoryButtons();
        return true;
    },

    beginDragHistory() {
        if (this.dragHistoryRecorded) return;
        this.dragHistoryRecorded = true;
        this.dragHistoryPushed = this.recordHistory();
    },

    endDragHistory() {
        if (!this.dragHistoryRecorded) return;
        this.dragHistoryRecorded = false;
        if (!this.dragHistoryPushed) return;
        this.dragHistoryPushed = false;
        if (this.undoStack.length && this.undoStack[this.undoStack.length - 1] === this.captureHistoryState()) {
            this.undoStack.pop();
            this.updateHistoryButtons();
        }
    },

    restoreHistoryState(snapshot) {
        const data = JSON.parse(snapshot);
        this.historyRestoring = true;
        try {
            this.activeGroupWorkspace = null;
            this.hideDeviceContextMenu();
            this.connectionStart = null;
            this.reconnect = null;
            this.bendDrag = null;
            this.draggedDevice = null;
            this.draggedTextbox = null;
            this.draggedGroup = null;
            this.groupDragStart = null;
            this.draggedGroupBlock = null;
            this.groupBlockStartBounds = null;
            this.groupBlockDragOffset = null;
            if (this.previewLayer) this.previewLayer.innerHTML = '';
            this.deselectAll();
            
            this.sheets = data.sheets.map((s, i) => ({
                id: s.id || (i + 1),
                name: s.name || `Blatt ${i + 1}`,
                devices: s.devices || [],
                connections: s.connections || [],
                textboxes: s.textboxes || [],
                deviceGroups: s.deviceGroups || []
            }));
            this.nextDeviceId = data.nextDeviceId || 1;
            this.nextConnectionId = data.nextConnectionId || 1;
            this.nextTextboxId = data.nextTextboxId || 1;
            this.nextSheetId = data.nextSheetId || (this.sheets.length + 1);
            this.nextDeviceGroupId = data.nextDeviceGroupId || 1;
            
            let active = typeof data.activeSheet === 'number' ? data.activeSheet : 0;
            if (active < 0 || active >= this.sheets.length) active = 0;
            this.activateSheet(active);
        } finally {
            this.historyRestoring = false;
        }
    },

    undo() {
        if (!this.undoStack.length) return;
        const current = this.captureHistoryState();
        const snapshot = this.undoStack.pop();
        this.redoStack.push(current);
        if (this.redoStack.length > this.historyLimit) this.redoStack.shift();
        this.historyLastMergeKey = null;
        this.restoreHistoryState(snapshot);
        this.updateHistoryButtons();
    },

    redo() {
        if (!this.redoStack.length) return;
        const current = this.captureHistoryState();
        const snapshot = this.redoStack.pop();
        this.undoStack.push(current);
        if (this.undoStack.length > this.historyLimit) this.undoStack.shift();
        this.historyLastMergeKey = null;
        this.restoreHistoryState(snapshot);
        this.updateHistoryButtons();
    },

    updateHistoryButtons() {
        const btnUndo = document.getElementById('btnUndo');
        const btnRedo = document.getElementById('btnRedo');
        if (btnUndo) {
            btnUndo.disabled = !this.undoStack || this.undoStack.length === 0;
            btnUndo.title = `Rückgängig (Strg+Z)${this.undoStack?.length ? ` – ${this.undoStack.length} Schritt(e)` : ''}`;
        }
        if (btnRedo) {
            btnRedo.disabled = !this.redoStack || this.redoStack.length === 0;
            btnRedo.title = `Wiederherstellen (Strg+Y)${this.redoStack?.length ? ` – ${this.redoStack.length} Schritt(e)` : ''}`;
        }
    }
};
