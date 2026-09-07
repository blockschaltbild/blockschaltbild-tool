class BlockDiagramEditor {
    constructor() {
        this.svg = document.getElementById('diagramCanvas');
        this.devices = [];
        this.connections = [];
        this.textboxes = [];
        this.deviceTemplates = [];
        this.selectedElement = null;
        this.draggedDevice = null;
        this.draggedTextbox = null;
        this.dragOffset = { x: 0, y: 0 };
        this.connectionStart = null;
        this.zoom = 1;
        this.nextDeviceId = 1;
        this.nextConnectionId = 1;
        this.nextTextboxId = 1;
        this.sheets = [{ id: 1, name: 'Blatt 1', devices: this.devices, connections: this.connections, textboxes: this.textboxes }];
        this.activeSheet = 0;
        this.nextSheetId = 2;
        this.projectName = 'Neues Projekt';
        this.projectNumber = '';
        this.eventFrom = '';
        this.eventTo = '';
        this.eventLocation = '';
        this.projectAuthor = '';
        
        this.groups = this.defaultGroups();
        
        this.lineStyle = 'curve';
        this.exitStub = 30;
        this.canvasWidth = 3000;
        this.canvasHeight = 2000;
        this.canvasPadding = 20;
        this.gridSize = 20;
        this.gridVisible = true;
        this.snapToGrid = true;
        
        this.labelColors = [
            { name: 'Weiss', value: '#ffffff' },
            { name: 'Lachs', value: '#ff997f' },
            { name: 'Gelb', value: '#f9d057' },
            { name: 'Grün', value: '#2ecc71' },
            { name: 'Cyan', value: '#99e5e8' },
            { name: 'Violett', value: '#3e0d81' },
            { name: 'Orange', value: '#e67e22' },
            { name: 'Schwarz', value: '#000000' }
        ];
        
        this.lineColors = [
            { name: 'Standard', value: '#4d49bc' },
            { name: 'Violett', value: '#3e0d81' },
            { name: 'Gelb', value: '#f9d057' },
            { name: 'Grün', value: '#2ecc71' },
            { name: 'Cyan', value: '#99e5e8' },
            { name: 'Lachs', value: '#ff997f' },
            { name: 'Orange', value: '#e67e22' },
            { name: 'Grau', value: '#888888' }
        ];
        
        this.cableTypes = this.defaultCableTypes();
        
        this.autoConverter = true;
        this.converterRules = [
            { from: 'HDMI', to: 'SDI', template: 'BiDi 12G' },
            { from: 'SDI', to: 'HDMI', template: 'BiDi 12G' },
            { from: 'DP', to: 'HDMI', template: 'DP-HDMI Adapter' },
            { from: 'LC', to: 'CAT', template: 'CVT-10' },
            { from: 'CAT', to: 'LC', template: 'CVT-10' }
        ];
        
        this.libraryKey = 'blockschaltbild.library.v1';
        
        this.initSVG();
        this.initEventListeners();
        this.loadLibrary();
        this.updateGroupFilter();
        this.updateProjectDisplay();
        this.renderSheetTabs();
    }


    initSVG() {
        this.svg.setAttribute('width', '3000');
        this.svg.setAttribute('height', '2000');
        
        this.defsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svg.appendChild(this.defsElement);
        
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrowPath.setAttribute('points', '0 0, 10 3.5, 0 7');
        arrowPath.setAttribute('fill', '#4d49bc');
        marker.appendChild(arrowPath);
        this.defsElement.appendChild(marker);
        
        const markerSelected = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        markerSelected.setAttribute('id', 'arrowhead-selected');
        markerSelected.setAttribute('markerWidth', '10');
        markerSelected.setAttribute('markerHeight', '7');
        markerSelected.setAttribute('refX', '9');
        markerSelected.setAttribute('refY', '3.5');
        markerSelected.setAttribute('orient', 'auto');
        const arrowPathSelected = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrowPathSelected.setAttribute('points', '0 0, 10 3.5, 0 7');
        arrowPathSelected.setAttribute('fill', '#f9d057');
        markerSelected.appendChild(arrowPathSelected);
        this.defsElement.appendChild(markerSelected);
        
        this.gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.gridRect.setAttribute('id', 'grid-rect');
        this.gridRect.setAttribute('x', '0');
        this.gridRect.setAttribute('y', '0');
        this.gridRect.setAttribute('width', '3000');
        this.gridRect.setAttribute('height', '2000');
        this.gridRect.setAttribute('fill', 'url(#gridPattern)');
        this.gridRect.setAttribute('pointer-events', 'none');
        this.svg.appendChild(this.gridRect);
        this.updateGrid();
        
        this.connectionsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.connectionsLayer.setAttribute('id', 'connections-layer');
        this.svg.appendChild(this.connectionsLayer);
        
        this.devicesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.devicesLayer.setAttribute('id', 'devices-layer');
        this.svg.appendChild(this.devicesLayer);
        
        this.textboxesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.textboxesLayer.setAttribute('id', 'textboxes-layer');
        this.svg.appendChild(this.textboxesLayer);
        
        this.handlesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.handlesLayer.setAttribute('id', 'handles-layer');
        this.svg.appendChild(this.handlesLayer);
        
        this.previewLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.previewLayer.setAttribute('id', 'preview-layer');
        this.svg.appendChild(this.previewLayer);
    }


    updateProjectDisplay() {
        document.getElementById('displayProjectName').textContent = this.projectName;
        document.getElementById('displayProjectNumber').textContent = this.projectNumber ? `Projekt-Nr. ${this.projectNumber}` : '';
        document.getElementById('displayProjectMeta').textContent = this.getProjectMetaText();
    }


    formatDate(value) {
        if (!value) return '';
        const d = new Date(value);
        if (isNaN(d)) return value;
        return d.toLocaleDateString('de-DE');
    }


    getEventPeriodText() {
        const from = this.formatDate(this.eventFrom);
        const to = this.formatDate(this.eventTo);
        if (from && to) return `${from} – ${to}`;
        return from || to || '';
    }


    getProjectMetaText() {
        const parts = [];
        const period = this.getEventPeriodText();
        if (period) parts.push(period);
        if (this.eventLocation) parts.push(this.eventLocation);
        if (this.projectAuthor) parts.push(this.projectAuthor);
        return parts.join(' · ');
    }


    showProjectModal() {
        document.getElementById('projName').value = this.projectName === 'Neues Projekt' ? '' : this.projectName;
        document.getElementById('projNumber').value = this.projectNumber;
        document.getElementById('projEventFrom').value = this.eventFrom;
        document.getElementById('projEventTo').value = this.eventTo;
        document.getElementById('projLocation').value = this.eventLocation;
        document.getElementById('projAuthor').value = this.projectAuthor;
        document.getElementById('projectModal').classList.add('active');
    }


    hideProjectModal() {
        document.getElementById('projectModal').classList.remove('active');
    }


    saveProjectData(e) {
        e.preventDefault();
        
        this.projectName = document.getElementById('projName').value.trim() || 'Neues Projekt';
        this.projectNumber = document.getElementById('projNumber').value.trim();
        this.eventFrom = document.getElementById('projEventFrom').value;
        this.eventTo = document.getElementById('projEventTo').value;
        this.eventLocation = document.getElementById('projLocation').value.trim();
        this.projectAuthor = document.getElementById('projAuthor').value.trim();
        
        document.getElementById('projectName').value = this.projectName === 'Neues Projekt' ? '' : this.projectName;
        document.getElementById('projectNumber').value = this.projectNumber;
        
        this.updateProjectDisplay();
        this.hideProjectModal();
    }


    renderSheetTabs() {
        const list = document.getElementById('sheetTabList');
        if (!list) return;
        list.innerHTML = '';
        this.sheets.forEach((sheet, idx) => {
            const tab = document.createElement('div');
            tab.className = 'sheet-tab' + (idx === this.activeSheet ? ' active' : '');
            const label = document.createElement('span');
            label.textContent = sheet.name;
            tab.appendChild(label);
            if (this.sheets.length > 1) {
                const close = document.createElement('span');
                close.className = 'sheet-close';
                close.textContent = '×';
                close.title = 'Arbeitsbereich löschen';
                close.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteSheet(idx);
                });
                tab.appendChild(close);
            }
            tab.addEventListener('click', () => {
                if (idx !== this.activeSheet) this.switchSheet(idx);
            });
            tab.addEventListener('dblclick', () => this.startSheetRename(tab, idx));
            list.appendChild(tab);
        });
    }


    startSheetRename(tab, idx) {
        const input = document.createElement('input');
        input.className = 'sheet-rename';
        input.value = this.sheets[idx].name;
        tab.innerHTML = '';
        tab.appendChild(input);
        input.focus();
        input.select();
        let done = false;
        const commit = () => {
            if (done) return;
            done = true;
            const name = input.value.trim();
            if (name) this.sheets[idx].name = name;
            this.renderSheetTabs();
        };
        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape') { done = true; this.renderSheetTabs(); }
        });
        input.addEventListener('blur', commit);
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('dblclick', (e) => e.stopPropagation());
    }


    storeActiveSheet() {
        const sheet = this.sheets[this.activeSheet];
        if (!sheet) return;
        sheet.devices = this.devices;
        sheet.connections = this.connections;
        sheet.textboxes = this.textboxes;
    }


    showLoading(text, percent, detail) {
        const overlay = document.getElementById('loadingOverlay');
        if (!overlay) return;
        overlay.classList.add('active');
        this.updateLoading(text, percent, detail);
    }

    updateLoading(text, percent, detail) {
        const textEl = document.getElementById('loadingText');
        const fill = document.getElementById('loadingBarFill');
        const detailEl = document.getElementById('loadingDetail');
        if (textEl && text !== undefined) textEl.textContent = text;
        if (fill && percent !== undefined) fill.style.width = Math.max(0, Math.min(100, Math.round(percent))) + '%';
        if (detailEl) detailEl.textContent = detail || '';
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    nextFrame() {
        return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
    }

    prepareSheet(idx) {
        this.activeSheet = idx;
        const sheet = this.sheets[idx];
        this.devices = sheet.devices;
        this.connections = sheet.connections;
        if (!sheet.textboxes) sheet.textboxes = [];
        this.textboxes = sheet.textboxes;
        this.devicesLayer.innerHTML = '';
        this.connectionsLayer.innerHTML = '';
        this.textboxesLayer.innerHTML = '';
    }

    async activateSheetAsync(idx, onProgress) {
        this.prepareSheet(idx);
        const total = this.devices.length + this.connections.length + this.textboxes.length + 1;
        let done = 0;
        const chunk = 20;
        const report = async (label) => {
            if (onProgress) onProgress(done, total, label);
            await this.nextFrame();
        };
        for (let i = 0; i < this.devices.length; i++) {
            this.renderDevice(this.devices[i]);
            done++;
            if (done % chunk === 0) await report(`Geräte werden gezeichnet (${i + 1}/${this.devices.length})`);
        }
        await report(`Geräte gezeichnet (${this.devices.length})`);
        this.bulkRender = true;
        try {
            for (let i = 0; i < this.connections.length; i++) {
                this.renderConnection(this.connections[i]);
                done++;
                if (done % chunk === 0) await report(`Verbindungen werden gezeichnet (${i + 1}/${this.connections.length})`);
            }
        } finally {
            this.bulkRender = false;
        }
        this.textboxes.forEach(t => this.renderTextbox(t));
        done += this.textboxes.length;
        await report('Kreuzungen werden berechnet …');
        this.drawCrossingBridges();
        done++;
        this.renderSheetTabs();
        if (onProgress) onProgress(done, total, 'Fertig');
    }

    activateSheet(idx) {
        this.prepareSheet(idx);
        this.devices.forEach(d => this.renderDevice(d));
        this.bulkRender = true;
        this.connections.forEach(c => this.renderConnection(c));
        this.bulkRender = false;
        this.textboxes.forEach(t => this.renderTextbox(t));
        this.drawCrossingBridges();
        this.renderSheetTabs();
    }


    switchSheet(idx) {
        this.deselectAll();
        this.storeActiveSheet();
        this.activateSheet(idx);
    }


    addSheet() {
        this.deselectAll();
        this.storeActiveSheet();
        const id = this.nextSheetId++;
        this.sheets.push({ id: id, name: `Blatt ${this.sheets.length + 1}`, devices: [], connections: [], textboxes: [] });
        this.activateSheet(this.sheets.length - 1);
    }


    deleteSheet(idx) {
        if (this.sheets.length <= 1) {
            alert('Der letzte Arbeitsbereich kann nicht gelöscht werden.');
            return;
        }
        if (!confirm(`Arbeitsbereich "${this.sheets[idx].name}" löschen?`)) return;
        this.deselectAll();
        this.storeActiveSheet();
        this.sheets.splice(idx, 1);
        let target = this.activeSheet;
        if (idx < target) target--;
        else if (idx === target && target >= this.sheets.length) target = this.sheets.length - 1;
        this.activateSheet(target);
    }


    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    }


    initSidebarResize() {
        const sidebar = document.getElementById('sidebar');
        const resizeHandle = document.getElementById('sidebarResize');
        let isResizing = false;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeHandle.classList.add('active');
            document.body.style.cursor = 'ew-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth >= 200 && newWidth <= 500) {
                sidebar.style.width = newWidth + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizeHandle.classList.remove('active');
                document.body.style.cursor = '';
            }
        });
    }


    defaultGroups() {
        return [
            { id: 'audio', name: 'Ton', color: '#3498db' },
            { id: 'video', name: 'Video', color: '#9b59b6' },
            { id: 'light', name: 'Licht', color: '#f1c40f' },
            { id: 'control', name: 'Steuerung', color: '#e67e22' },
            { id: 'other', name: 'Sonstiges', color: '#95a5a6' }
        ];
    }


    defaultCableTypes() {
        return ['XLR', 'Klinke', 'Cinch', 'HDMI', 'SDI', 'DisplayPort', 'Cat5/6', 'Speakon', 'Powercon', 'DMX', 'Dante', 'AES/EBU', 'SPDIF', 'USB', 'Coax', 'Glasfaser', 'Glasfaser LC/LC'];
    }


    selectElement(element, type) {
        this.deselectAll();
        this.selectedElement = { element, type };
        
        if (type === 'device') {
            const el = document.getElementById(element.id);
            if (el) el.classList.add('selected');
            this.showDeviceProperties(element);
        } else if (type === 'connection') {
            this.renderConnection(element);
            const el = document.getElementById(element.id);
            if (el) {
                el.classList.add('selected');
                const path = el.querySelector('.connection');
                if (path) path.setAttribute('marker-end', 'url(#arrowhead-selected)');
            }
            this.showConnectionProperties(element);
        } else if (type === 'textbox') {
            const el = document.getElementById(element.id);
            if (el) el.classList.add('selected');
            this.showTextboxProperties(element);
        }
    }
    

    deselectConnections() {
        document.querySelectorAll('.connection-group.selected').forEach(el => {
            el.classList.remove('selected');
            const path = el.querySelector('.connection');
            if (path) path.setAttribute('marker-end', 'url(#arrowhead)');
        });
    }


    deselectAll() {
        document.querySelectorAll('.device-block.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.textbox-block.selected').forEach(el => el.classList.remove('selected'));
        if (this.handlesLayer) this.handlesLayer.innerHTML = '';
        this.deselectConnections();
        this.selectedElement = null;
        document.getElementById('propertiesPanel').innerHTML = '<p class="hint">Wählen Sie ein Element aus</p>';
    }


    escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[ch]);
    }


    deleteSelected() {
        if (!this.selectedElement) return;
        
        if (this.selectedElement.type === 'device') {
            const device = this.selectedElement.element;
            this.connections = this.connections.filter(c => {
                if (c.fromDevice === device.id || c.toDevice === device.id) {
                    document.getElementById(c.id)?.remove();
                    return false;
                }
                return true;
            });
            this.devices = this.devices.filter(d => d.id !== device.id);
            document.getElementById(device.id)?.remove();
        } else if (this.selectedElement.type === 'connection') {
            const conn = this.selectedElement.element;
            const fromDevice = this.devices.find(d => d.id === conn.fromDevice);
            const toDevice = this.devices.find(d => d.id === conn.toDevice);
            if (fromDevice) {
                const port = fromDevice.outputs.find(p => p.id === conn.fromPort);
                if (port) port.connected = false;
                this.renderDevice(fromDevice);
            }
            if (toDevice) {
                const port = toDevice.inputs.find(p => p.id === conn.toPort);
                if (port) port.connected = false;
                this.renderDevice(toDevice);
            }
            this.connections = this.connections.filter(c => c.id !== conn.id);
            document.getElementById(conn.id)?.remove();
        } else if (this.selectedElement.type === 'textbox') {
            const box = this.selectedElement.element;
            this.textboxes = this.textboxes.filter(t => t.id !== box.id);
            this.storeActiveSheet();
            document.getElementById(box.id)?.remove();
        }
        
        this.deselectAll();
        this.cleanupConverters();
    }


    newDiagram() {
        const hasContent = this.sheets.some(s => (s === this.sheets[this.activeSheet] ? this.devices : s.devices).length > 0);
        if (hasContent && !confirm('Aktuelles Diagramm verwerfen?')) return;
        
        this.devices = [];
        this.connections = [];
        this.textboxes = [];
        this.sheets = [{ id: 1, name: 'Blatt 1', devices: this.devices, connections: this.connections, textboxes: this.textboxes }];
        this.activeSheet = 0;
        this.nextSheetId = 2;
        this.nextTextboxId = 1;
        this.renderSheetTabs();
        this.devicesLayer.innerHTML = '';
        this.connectionsLayer.innerHTML = '';
        this.textboxesLayer.innerHTML = '';
        this.projectName = 'Neues Projekt';
        this.projectNumber = '';
        this.eventFrom = '';
        this.eventTo = '';
        this.eventLocation = '';
        this.projectAuthor = '';
        document.getElementById('projectName').value = '';
        document.getElementById('projectNumber').value = '';
        this.updateProjectDisplay();
        this.deselectAll();
    }


}
