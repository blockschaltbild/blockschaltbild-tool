const CanvasMixin = {
    updateGrid() {
        const existing = this.defsElement.querySelector('#gridPattern');
        if (existing) existing.remove();
        
        const size = this.gridSize;
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', 'gridPattern');
        pattern.setAttribute('width', size);
        pattern.setAttribute('height', size);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('d', `M ${size} 0 L 0 0 0 ${size}`);
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', '#e6e5f0');
        line.setAttribute('stroke-width', '1');
        pattern.appendChild(line);
        this.defsElement.appendChild(pattern);
        
        this.gridRect.setAttribute('fill', this.gridVisible ? 'url(#gridPattern)' : 'none');
    },

    snap(value) {
        if (!this.snapToGrid || !this.gridSize) return value;
        return Math.round(value / this.gridSize) * this.gridSize;
    },

    hexToRgb(hex) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex).trim());
        if (!m) return { r: 0, g: 0, b: 0 };
        return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
    },

    renderTextbox(box) {
        const existing = document.getElementById(box.id);
        if (existing) existing.remove();
        
        const svgNS = 'http://www.w3.org/2000/svg';
        const fontSize = box.fontSize || 14;
        const size = this.textboxSize(box);
        box.width = size.width;
        box.height = size.height;
        
        const g = document.createElementNS(svgNS, 'g');
        g.setAttribute('id', box.id);
        g.setAttribute('class', 'textbox-block');
        g.setAttribute('data-textbox-id', box.id);
        g.setAttribute('transform', `translate(${box.x}, ${box.y})`);
        
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('class', 'textbox-frame');
        rect.setAttribute('width', size.width);
        rect.setAttribute('height', size.height);
        rect.setAttribute('rx', '4');
        rect.setAttribute('fill', '#ffffff');
        rect.setAttribute('stroke', box.borderColor || '#4d49bc');
        g.appendChild(rect);
        
        const lineHeight = Math.round(fontSize * 1.35);
        this.textboxLines(box).forEach((line, i) => {
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('class', 'textbox-text');
            text.setAttribute('x', 10);
            text.setAttribute('y', 10 + (i + 1) * lineHeight - Math.round(fontSize * 0.3));
            text.setAttribute('font-size', fontSize);
            text.setAttribute('fill', box.textColor || '#000000');
            text.textContent = line;
            g.appendChild(text);
        });
        
        this.textboxesLayer.appendChild(g);
    },

    renderDevice(device) {
        const existing = document.getElementById(device.id);
        if (existing) existing.remove();
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('id', device.id);
        g.setAttribute('class', 'device-block' + (device.placeholder ? ' placeholder' : ''));
        g.setAttribute('transform', `translate(${device.x}, ${device.y})`);
        g.dataset.deviceId = device.id;
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'body');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', '0');
        rect.setAttribute('width', device.width);
        rect.setAttribute('height', device.height);
        rect.setAttribute('rx', '6');
        rect.setAttribute('fill', device.color);
        g.appendChild(rect);
        
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('class', 'label');
        nameText.setAttribute('x', device.width / 2);
        nameText.setAttribute('y', '18');
        nameText.setAttribute('text-anchor', 'middle');
        nameText.textContent = device.name;
        g.appendChild(nameText);
        
        if (device.type) {
            const typeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            typeText.setAttribute('class', 'type-label');
            typeText.setAttribute('x', device.width / 2);
            typeText.setAttribute('y', '32');
            typeText.setAttribute('text-anchor', 'middle');
            typeText.textContent = device.type;
            g.appendChild(typeText);
        }
        
        if (device.article) {
            const articleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            articleText.setAttribute('class', 'article-label');
            articleText.setAttribute('x', device.width / 2);
            articleText.setAttribute('y', '44');
            articleText.setAttribute('text-anchor', 'middle');
            articleText.textContent = `[${device.article}]`;
            g.appendChild(articleText);
        }
        
        if (device.placeholder) {
            const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            badge.setAttribute('class', 'placeholder-badge');
            badge.setAttribute('x', device.width - 4);
            badge.setAttribute('y', device.height - 5);
            badge.setAttribute('text-anchor', 'end');
            badge.textContent = 'Platzhalter';
            g.appendChild(badge);
        }
        
        const portStartY = device.article ? 58 : 50;
        
        device.inputs.forEach((input, i) => {
            const portG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            portG.setAttribute('class', 'port input-port');
            portG.dataset.portId = input.id;
            portG.dataset.portType = 'input';
            portG.dataset.deviceId = device.id;
            
            const cy = portStartY + i * 20;
            input.cy = cy;
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '0');
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', input.connected ? '#27ae60' : '#3498db');
            portG.appendChild(circle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '10');
            text.setAttribute('y', cy + 4);
            text.setAttribute('text-anchor', 'start');
            text.textContent = input.name;
            portG.appendChild(text);
            
            g.appendChild(portG);
        });
        
        device.outputs.forEach((output, i) => {
            const portG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            portG.setAttribute('class', 'port output-port');
            portG.dataset.portId = output.id;
            portG.dataset.portType = 'output';
            portG.dataset.deviceId = device.id;
            
            const cy = portStartY + i * 20;
            output.cy = cy;
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', device.width);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', '6');
            circle.setAttribute('fill', output.connected ? '#27ae60' : '#e74c3c');
            portG.appendChild(circle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', device.width - 10);
            text.setAttribute('y', cy + 4);
            text.setAttribute('text-anchor', 'end');
            text.textContent = output.name;
            portG.appendChild(text);
            
            g.appendChild(portG);
        });
        
        this.devicesLayer.appendChild(g);
    },

    onMouseDown(e) {
        if (this.readOnly) { this.readOnlyMouseDown(e); return; }
        const target = e.target;
        const deviceBlock = target.closest('.device-block');
        const port = target.closest('.port');
        
        const textboxBlock = target.closest('.textbox-block');
        if (textboxBlock) {
            const box = this.textboxes.find(t => t.id === textboxBlock.dataset.textboxId);
            if (box) {
                const rect = this.svg.getBoundingClientRect();
                this.draggedTextbox = box;
                this.dragOffset = {
                    x: (e.clientX - rect.left) / this.zoom - box.x,
                    y: (e.clientY - rect.top) / this.zoom - box.y
                };
                this.connectionStart = null;
                this.selectElement(box, 'textbox');
                e.preventDefault();
            }
            return;
        }
        
        const bend = target.closest('.conn-bend');
        if (bend) {
            const conn = this.connections.find(c => c.id === bend.dataset.connectionId);
            if (conn) {
                this.bendDrag = { conn: conn, index: parseInt(bend.dataset.bendIndex, 10) || 0 };
                this.connectionStart = null;
                this.selectElement(conn, 'connection');
                e.preventDefault();
            }
            return;
        }
        
        const handle = target.closest('.conn-handle');
        if (handle) {
            const conn = this.connections.find(c => c.id === handle.dataset.connectionId);
            if (conn) {
                this.reconnect = { conn: conn, end: handle.dataset.end };
                this.connectionStart = null;
                e.preventDefault();
            }
            return;
        }
        
        if (port) {
            const deviceId = port.dataset.deviceId;
            const portId = port.dataset.portId;
            const portType = port.dataset.portType;
            
            if (portType === 'output') {
                this.connectionStart = { deviceId, portId, portType };
            } else if (portType === 'input' && this.connectionStart) {
                this.createConnection(
                    this.connectionStart.deviceId, this.connectionStart.portId,
                    deviceId, portId
                );
                this.connectionStart = null;
            }
            return;
        }
        
        if (deviceBlock) {
            const rect = this.svg.getBoundingClientRect();
            const device = this.devices.find(d => d.id === deviceBlock.dataset.deviceId);
            if (device) {
                this.draggedDevice = device;
                this.dragOffset = {
                    x: (e.clientX - rect.left) / this.zoom - device.x,
                    y: (e.clientY - rect.top) / this.zoom - device.y
                };
                this.selectElement(device, 'device');
            }
        }
    },

    onMouseMove(e) {
        const rect = this.svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;
        
        if (this.draggedDevice) {
            this.beginDragHistory();
            this.draggedDevice.x = Math.max(0, this.snap(x - this.dragOffset.x));
            this.draggedDevice.y = Math.max(0, this.snap(y - this.dragOffset.y));
            this.renderDevice(this.draggedDevice);
            this.updateConnections();
        }
        
        if (this.draggedTextbox) {
            this.beginDragHistory();
            this.draggedTextbox.x = Math.max(0, this.snap(x - this.dragOffset.x));
            this.draggedTextbox.y = Math.max(0, this.snap(y - this.dragOffset.y));
            this.renderTextbox(this.draggedTextbox);
            document.getElementById(this.draggedTextbox.id).classList.add('selected');
        }
        
        if (this.bendDrag) {
            this.beginDragHistory();
            const conn = this.bendDrag.conn;
            if (!conn.waypoints) conn.waypoints = [];
            const pad = this.canvasPadding;
            conn.waypoints[this.bendDrag.index] = {
                x: Math.min(this.canvasWidth - pad, Math.max(pad, this.snap(x))),
                y: Math.min(this.canvasHeight - pad, Math.max(pad, this.snap(y)))
            };
            this.updateConnections();
            return;
        }
        
        if (this.reconnect) {
            this.previewLayer.innerHTML = '';
            const anchor = this.reconnectAnchor(this.reconnect);
            if (anchor) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const d = this.reconnect.end === 'to'
                    ? this.createConnectionPath(anchor.x, anchor.y, x, y)
                    : this.createConnectionPath(x, y, anchor.x, anchor.y);
                path.setAttribute('d', d);
                path.setAttribute('class', 'connection-preview');
                this.previewLayer.appendChild(path);
            }
        }
        
        if (this.connectionStart) {
            this.previewLayer.innerHTML = '';
            const fromDevice = this.devices.find(d => d.id === this.connectionStart.deviceId);
            const fromPort = fromDevice.outputs.find(p => p.id === this.connectionStart.portId);
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const startX = fromDevice.x + fromDevice.width;
            const startY = fromDevice.y + fromPort.cy;
            const d = this.createConnectionPath(startX, startY, x, y);
            path.setAttribute('d', d);
            path.setAttribute('class', 'connection-preview');
            this.previewLayer.appendChild(path);
        }
    },

    onMouseUp(e) {
        if (this.readOnly) return;
        this.draggedDevice = null;
        this.endDragHistory();
        
        if (this.draggedTextbox) {
            this.draggedTextbox = null;
            return;
        }
        
        if (this.bendDrag) {
            this.bendDrag = null;
            return;
        }
        
        if (this.reconnect) {
            const targetPort = e.target.closest('.port');
            this.finishReconnect(targetPort);
            return;
        }
        
        const port = e.target.closest('.port');
        if (this.connectionStart && port) {
            const portType = port.dataset.portType;
            if (portType === 'input') {
                this.createConnection(
                    this.connectionStart.deviceId, this.connectionStart.portId,
                    port.dataset.deviceId, port.dataset.portId
                );
            }
        }
        
        if (!e.target.closest('.port')) {
            this.cancelConnection();
        }
    },

    onClick(e) {
        const connectionGroup = e.target.closest('.connection-group');
        if (connectionGroup) {
            const connId = connectionGroup.dataset.connectionId;
            const conn = this.connections.find(c => c.id === connId);
            if (conn) {
                this.selectElement(conn, 'connection');
            }
            return;
        }
        
        if (!e.target.closest('.device-block') && !e.target.closest('.port') && !e.target.closest('.textbox-block')) {
            this.deselectAll();
        }
    },

    setZoom(level) {
        this.zoom = Math.max(0.25, Math.min(2, level));
        document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
        this.svg.style.transform = `scale(${this.zoom})`;
        this.svg.style.transformOrigin = 'top left';
    },

    fitView() {
        if (this.devices.length === 0) {
            this.setZoom(1);
            return;
        }
        
        const bounds = this.getBounds();
        const container = document.querySelector('.canvas-wrapper');
        const scaleX = container.clientWidth / (bounds.maxX + 50);
        const scaleY = container.clientHeight / (bounds.maxY + 50);
        this.setZoom(Math.min(scaleX, scaleY, 1));
    },

    getBounds() {
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        this.devices.forEach(d => {
            minX = Math.min(minX, d.x);
            minY = Math.min(minY, d.y);
            maxX = Math.max(maxX, d.x + d.width);
            maxY = Math.max(maxY, d.y + d.height);
        });
        this.textboxes.forEach(t => {
            const size = this.textboxSize(t);
            minX = Math.min(minX, t.x);
            minY = Math.min(minY, t.y);
            maxX = Math.max(maxX, t.x + size.width);
            maxY = Math.max(maxY, t.y + size.height);
        });
        return { minX: minX === Infinity ? 0 : minX, minY: minY === Infinity ? 0 : minY, maxX, maxY };
    }
};
