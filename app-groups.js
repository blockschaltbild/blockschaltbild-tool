const GroupsMixin = {
    findGroupForDevice(deviceId) {
        return this.deviceGroups.find(g => g.deviceIds.includes(deviceId)) || null;
    },

    removeDeviceFromGroups(deviceId) {
        this.deviceGroups.forEach(g => {
            const idx = g.deviceIds.indexOf(deviceId);
            if (idx !== -1) g.deviceIds.splice(idx, 1);
        });
        this.deviceGroups = this.deviceGroups.filter(g => g.deviceIds.length >= 2);
    },

    toggleMultiSelect(device) {
        const idx = this.selectedDevices.indexOf(device.id);
        if (idx !== -1) {
            this.selectedDevices.splice(idx, 1);
        } else {
            this.selectedDevices.push(device.id);
        }
        this.renderMultiSelectHighlight();
        this.showSelectionPanel();
    },

    clearMultiSelect() {
        if (!this.selectedDevices) this.selectedDevices = [];
        if (this.selectedDevices.length === 0) return;
        this.selectedDevices = [];
        this.renderMultiSelectHighlight();
    },

    renderMultiSelectHighlight() {
        document.querySelectorAll('.device-block.multi-selected').forEach(el => el.classList.remove('multi-selected'));
        this.selectedDevices.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('multi-selected');
        });
    },

    showSelectionPanel() {
        const panel = document.getElementById('propertiesPanel');
        if (!panel) return;
        const count = this.selectedDevices.length;
        if (count === 0) {
            panel.innerHTML = '<p class="hint">Wählen Sie ein Element aus</p>';
            return;
        }
        if (count === 1) {
            panel.innerHTML = '<h3>1 Gerät ausgewählt</h3><p class="hint">Umschalt-Klick fügt weitere Geräte zur Auswahl hinzu.</p>';
            return;
        }
        const alreadyGrouped = this.selectedDevices.some(id => this.findGroupForDevice(id));
        panel.innerHTML = `
            <h3>${count} Geräte ausgewählt</h3>
            <p class="hint">Umschalt-Klick fügt weitere Geräte zur Auswahl hinzu oder entfernt sie.</p>
            ${alreadyGrouped ? '<p class="hint">Ein Teil der Auswahl gehört bereits zu einer Gruppierung.</p>' : ''}
            <button type="button" id="btnGroupSelection" ${alreadyGrouped ? 'disabled' : ''}>🔗 Auswahl gruppieren</button>
        `;
        const btn = document.getElementById('btnGroupSelection');
        if (btn) btn.addEventListener('click', () => this.groupSelectedDevices());
    },

    getActiveGroupForShortcut() {
        if (this.selectedGroupId) {
            const g = this.deviceGroups.find(x => x.id === this.selectedGroupId);
            if (g) return g;
        }
        if (this.selectedElement && this.selectedElement.type === 'device') {
            const g = this.findGroupForDevice(this.selectedElement.element.id);
            if (g) return g;
        }
        for (const id of this.selectedDevices) {
            const g = this.findGroupForDevice(id);
            if (g) return g;
        }
        return null;
    },

    groupSelectedDevicesShortcut() {
        if (this.readOnly) { this.notifyReadOnly(); return; }
        if (this.selectedDevices.length < 2) {
            alert('Bitte mindestens zwei Geräte mit Umschalt-Klick auswählen, um sie zu gruppieren.');
            return;
        }
        this.groupSelectedDevices();
    },

    ungroupShortcut() {
        if (this.readOnly) { this.notifyReadOnly(); return; }
        const group = this.getActiveGroupForShortcut();
        if (!group) {
            alert('Bitte zuerst ein gruppiertes Gerät oder eine eingeklappte Gruppe auswählen.');
            return;
        }
        this.ungroupGroupById(group.id);
    },

    toggleCollapseShortcut() {
        if (this.readOnly) { this.notifyReadOnly(); return; }
        const group = this.getActiveGroupForShortcut();
        if (!group) {
            alert('Bitte zuerst ein gruppiertes Gerät oder eine eingeklappte Gruppe auswählen.');
            return;
        }
        this.toggleGroupCollapsed(group.id);
    },

    groupSelectedDevices() {
        if (this.readOnly) { this.notifyReadOnly(); return; }
        if (this.activeGroupWorkspace) { alert('Bitte zuerst die Gruppen-Zeichenfläche schließen.'); return; }
        if (this.selectedDevices.length < 2) return;
        const alreadyGrouped = this.selectedDevices.filter(id => this.findGroupForDevice(id));
        if (alreadyGrouped.length) {
            alert('Ein Teil der ausgewählten Geräte gehört bereits zu einer Gruppierung. Bitte diese zuerst auflösen.');
            return;
        }
        this.recordHistory();
        const num = this.nextDeviceGroupId++;
        this.deviceGroups.push({ id: `devgroup-${num}`, name: `Gruppe ${num}`, deviceIds: [...this.selectedDevices] });
        this.clearMultiSelect();
        this.renderGroupOutlines();
        this.deselectAll();
    },

    renameGroup(groupId, name) {
        if (this.readOnly) { this.notifyReadOnly(); return; }
        const group = this.deviceGroups.find(g => g.id === groupId);
        if (!group) return;
        const trimmed = (name || '').trim();
        if (!trimmed || trimmed === group.name) return;
        this.recordHistory();
        group.name = trimmed;
        this.renderGroupOutlines();
        this.renderSheetTabs();
    },

    promptRenameGroup(groupId) {
        if (this.readOnly) { this.notifyReadOnly(); return; }
        const group = this.deviceGroups.find(g => g.id === groupId);
        if (!group) return;
        const name = prompt('Name der Gruppe:', group.name);
        if (name === null) return;
        this.renameGroup(groupId, name);
    },

    ungroupGroupById(groupId) {
        if (this.readOnly) { this.notifyReadOnly(); return; }
        if (this.activeGroupWorkspace) { alert('Bitte zuerst die Gruppen-Zeichenfläche schließen.'); return; }
        this.recordHistory();
        const group = this.deviceGroups.find(g => g.id === groupId);
        this.deviceGroups = this.deviceGroups.filter(g => g.id !== groupId);
        if (group && group.collapsed) {
            group.deviceIds.forEach(id => {
                const d = this.devices.find(x => x.id === id);
                if (d) this.renderDevice(d);
            });
            this.updateConnections();
        }
        this.renderGroupOutlines();
    },

    toggleGroupCollapsed(groupId) {
        if (this.readOnly) { this.notifyReadOnly(); return; }
        const group = this.deviceGroups.find(g => g.id === groupId);
        if (!group) return;
        if (this.activeGroupWorkspace) {
            if (this.activeGroupWorkspace.groupId === groupId) {
                this.exitGroupWorkspace(true);
            } else {
                alert('Bitte zuerst die Gruppen-Zeichenfläche schließen.');
            }
            return;
        }
        this.recordHistory();
        group.collapsed = !group.collapsed;
        group.deviceIds.forEach(id => {
            const d = this.devices.find(x => x.id === id);
            if (!d) return;
            if (group.collapsed) {
                const el = document.getElementById(d.id);
                if (el) el.remove();
            } else {
                this.renderDevice(d);
            }
        });
        this.updateConnections();
        this.renderGroupOutlines();
        this.renderSheetTabs();
    },

    enterGroupWorkspace(groupId) {
        if (this.readOnly) { this.notifyReadOnly(); return; }
        if (this.activeGroupWorkspace) return;
        const group = this.deviceGroups.find(g => g.id === groupId);
        if (!group || !group.collapsed) return;
        this.hideDeviceContextMenu();
        this.deselectAll();
        this.clearMultiSelect();

        const memberDevices = this.devices.filter(d => group.deviceIds.includes(d.id));
        const memberIds = new Set(memberDevices.map(d => d.id));
        const internalConns = this.connections.filter(c => memberIds.has(c.fromDevice) && memberIds.has(c.toDevice));
        const externalConns = this.connections.filter(c => memberIds.has(c.fromDevice) !== memberIds.has(c.toDevice));
        const anchorBounds = this.getGroupBounds(group);

        this.activeGroupWorkspace = {
            groupId: group.id,
            originalDeviceIds: new Set(memberIds),
            originalConnectionIds: new Set(internalConns.map(c => c.id)),
            externalConnections: externalConns,
            originalAnchor: anchorBounds ? { x: anchorBounds.minX, y: anchorBounds.minY } : { x: 0, y: 0 },
            savedDevices: this.devices,
            savedConnections: this.connections,
            savedTextboxes: this.textboxes,
            savedDeviceGroups: this.deviceGroups,
            savedSelectedGroupId: this.selectedGroupId
        };

        this.devices = memberDevices;
        this.connections = internalConns;
        this.textboxes = [];
        this.deviceGroups = [];
        this.selectedGroupId = null;

        this.devicesLayer.innerHTML = '';
        this.connectionsLayer.innerHTML = '';
        this.textboxesLayer.innerHTML = '';
        if (this.groupsLayer) this.groupsLayer.innerHTML = '';
        this.devices.forEach(d => this.renderDevice(d));
        this.bulkRender = true;
        this.connections.forEach(c => this.renderConnection(c));
        this.bulkRender = false;
        this.drawCrossingBridges();
        this.renderGroupOutlines();
        this.drawGroupWorkspaceExternalConnections();
        this.renderSheetTabs();
    },

    drawGroupWorkspaceExternalConnections() {
        const ws = this.activeGroupWorkspace;
        if (!ws || !this.groupsLayer) return;
        this.groupsLayer.innerHTML = '';
        const svgNS = 'http://www.w3.org/2000/svg';
        const stubLen = 90;
        ws.externalConnections.forEach(c => {
            const memberIsFrom = ws.originalDeviceIds.has(c.fromDevice);
            const memberDevice = this.devices.find(d => d.id === (memberIsFrom ? c.fromDevice : c.toDevice));
            const otherDevice = ws.savedDevices.find(d => d.id === (memberIsFrom ? c.toDevice : c.fromDevice));
            if (!memberDevice || !otherDevice) return;

            let x1, y1, x2, y2, otherPortName, labelAnchor, labelX;
            if (memberIsFrom) {
                const fromPort = memberDevice.outputs.find(p => p.id === c.fromPort);
                const toPort = otherDevice.inputs.find(p => p.id === c.toPort);
                if (!fromPort) return;
                x1 = memberDevice.x + memberDevice.width;
                y1 = memberDevice.y + fromPort.cy;
                x2 = x1 + stubLen;
                y2 = y1;
                otherPortName = toPort ? toPort.name : '';
                labelAnchor = 'start';
                labelX = x2 + 8;
            } else {
                const toPort = memberDevice.inputs.find(p => p.id === c.toPort);
                const fromPort = otherDevice.outputs.find(p => p.id === c.fromPort);
                if (!toPort) return;
                x2 = memberDevice.x;
                y2 = memberDevice.y + toPort.cy;
                x1 = x2 - stubLen;
                y1 = y2;
                otherPortName = fromPort ? fromPort.name : '';
                labelAnchor = 'end';
                labelX = x1 - 8;
            }

            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('class', 'group-ws-ext-stub');
            line.setAttribute('marker-end', 'url(#arrowhead)');
            line.setAttribute('pointer-events', 'none');
            this.groupsLayer.appendChild(line);

            const label = memberIsFrom
                ? `→ ${otherDevice.name}${otherPortName ? ' (' + otherPortName + ')' : ''}`
                : `${otherDevice.name}${otherPortName ? ' (' + otherPortName + ')' : ''} →`;
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', labelX);
            text.setAttribute('y', (memberIsFrom ? y1 : y2) - 6);
            text.setAttribute('text-anchor', labelAnchor);
            text.setAttribute('class', 'group-ws-ext-label');
            text.setAttribute('pointer-events', 'none');
            text.textContent = label;
            this.groupsLayer.appendChild(text);
        });
    },

    exitGroupWorkspace(expand) {
        const ws = this.activeGroupWorkspace;
        if (!ws) return;
        this.hideDeviceContextMenu();
        this.deselectAll();

        const group = ws.savedDeviceGroups.find(g => g.id === ws.groupId);
        const currentDevices = this.devices;
        const currentConnections = this.connections;
        const newMemberIds = new Set(currentDevices.map(d => d.id));

        let curMinX = Infinity, curMinY = Infinity;
        currentDevices.forEach(d => {
            curMinX = Math.min(curMinX, d.x);
            curMinY = Math.min(curMinY, d.y);
        });
        if (curMinX !== Infinity) {
            const dx = ws.originalAnchor.x - curMinX;
            const dy = ws.originalAnchor.y - curMinY;
            if (dx !== 0 || dy !== 0) {
                currentDevices.forEach(d => { d.x += dx; d.y += dy; });
                currentConnections.forEach(c => {
                    if (Array.isArray(c.waypoints)) {
                        c.waypoints.forEach(wp => { if (wp) { wp.x += dx; wp.y += dy; } });
                    }
                });
            }
        }

        const parentDevices = ws.savedDevices;
        for (let i = parentDevices.length - 1; i >= 0; i--) {
            const id = parentDevices[i].id;
            if (ws.originalDeviceIds.has(id) && !newMemberIds.has(id)) parentDevices.splice(i, 1);
        }
        currentDevices.forEach(d => {
            if (!ws.originalDeviceIds.has(d.id)) parentDevices.push(d);
        });

        const parentConnections = ws.savedConnections;
        const newConnIds = new Set(currentConnections.map(c => c.id));
        for (let i = parentConnections.length - 1; i >= 0; i--) {
            const id = parentConnections[i].id;
            if (ws.originalConnectionIds.has(id) && !newConnIds.has(id)) parentConnections.splice(i, 1);
        }
        currentConnections.forEach(c => {
            if (!ws.originalConnectionIds.has(c.id)) parentConnections.push(c);
        });
        const parentDeviceIds = new Set(parentDevices.map(d => d.id));
        for (let i = parentConnections.length - 1; i >= 0; i--) {
            const c = parentConnections[i];
            if (!parentDeviceIds.has(c.fromDevice) || !parentDeviceIds.has(c.toDevice)) parentConnections.splice(i, 1);
        }

        if (group) group.deviceIds = [...newMemberIds];
        ws.savedTextboxes.push(...this.textboxes);

        this.devices = ws.savedDevices;
        this.connections = ws.savedConnections;
        this.textboxes = ws.savedTextboxes;
        this.deviceGroups = ws.savedDeviceGroups;
        this.selectedGroupId = ws.savedSelectedGroupId;
        this.activeGroupWorkspace = null;

        if (expand && group) group.collapsed = false;

        this.devicesLayer.innerHTML = '';
        this.connectionsLayer.innerHTML = '';
        this.textboxesLayer.innerHTML = '';
        if (this.groupsLayer) this.groupsLayer.innerHTML = '';
        this.devices.forEach(d => this.renderDevice(d));
        this.bulkRender = true;
        this.connections.forEach(c => this.renderConnection(c));
        this.bulkRender = false;
        this.textboxes.forEach(t => this.renderTextbox(t));
        this.drawCrossingBridges();
        this.renderGroupOutlines();
        this.renderSheetTabs();
    },

    renderGroupWorkspaceBar() {
        const bar = document.getElementById('groupWorkspaceBar');
        const sheetTabs = document.getElementById('sheetTabs');
        if (!bar) return;
        const ws = this.activeGroupWorkspace;
        if (!ws) {
            bar.style.display = 'none';
            bar.innerHTML = '';
            if (sheetTabs) sheetTabs.style.display = '';
            return;
        }
        if (sheetTabs) sheetTabs.style.display = 'none';
        const group = ws.savedDeviceGroups.find(g => g.id === ws.groupId);
        bar.style.display = 'flex';
        bar.innerHTML = `
            <button type="button" id="btnGroupWorkspaceBack" class="group-workspace-back">← Zurück zum Blatt</button>
            <span class="group-workspace-title">📦 Gruppen-Zeichenfläche: ${this.escapeHtml(group ? group.name : '')}</span>
            <button type="button" id="btnGroupWorkspaceExpand" class="group-workspace-expand">📂 Gruppe ausklappen &amp; schließen</button>
        `;
        document.getElementById('btnGroupWorkspaceBack').addEventListener('click', () => this.exitGroupWorkspace(false));
        document.getElementById('btnGroupWorkspaceExpand').addEventListener('click', () => this.exitGroupWorkspace(true));
    },

    removeDeviceFromGroup(deviceId) {
        if (this.readOnly) { this.notifyReadOnly(); return; }
        const group = this.findGroupForDevice(deviceId);
        if (!group) return;
        this.recordHistory();
        this.removeDeviceFromGroups(deviceId);
        this.renderGroupOutlines();
    },

    getGroupBounds(group) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        group.deviceIds.forEach(id => {
            const d = this.devices.find(x => x.id === id);
            if (!d) return;
            minX = Math.min(minX, d.x);
            minY = Math.min(minY, d.y);
            maxX = Math.max(maxX, d.x + d.width);
            maxY = Math.max(maxY, d.y + d.height);
        });
        if (minX === Infinity) return null;
        return { minX, minY, maxX, maxY };
    },

    getGroupConnectionSplit(group) {
        const internal = [], incoming = [], outgoing = [];
        this.connections.forEach(c => {
            const fromIn = group.deviceIds.includes(c.fromDevice);
            const toIn = group.deviceIds.includes(c.toDevice);
            if (fromIn && toIn) internal.push(c);
            else if (toIn) incoming.push(c);
            else if (fromIn) outgoing.push(c);
        });
        return { internal, incoming, outgoing };
    },

    renderCollapsedGroup(group) {
        const bounds = this.getGroupBounds(group);
        if (!bounds) return;

        const { internal, incoming, outgoing } = this.getGroupConnectionSplit(group);
        [...internal, ...incoming, ...outgoing].forEach(c => {
            const el = document.getElementById(c.id);
            if (el) el.remove();
        });

        const headerH = 26;
        const lineH = 16;
        const width = this.defaultDeviceWidth || 160;
        const height = headerH + 10 + group.deviceIds.length * lineH + 10;
        const x = bounds.minX;
        const y = bounds.minY;

        const drawMerged = (conns, anchorX, anchorY) => {
            if (!conns.length) return;
            const ref = conns[0];
            const otherId = anchorX === x ? ref.fromDevice : ref.toDevice;
            const other = this.devices.find(d => d.id === otherId);
            if (!other) return;
            const isIncoming = anchorX === x;
            const ox = isIncoming ? other.x + other.width : other.x;
            const oy = other.y + other.height / 2;
            const dx = Math.abs(anchorX - ox) * 0.5;
            const d = `M ${ox} ${oy} C ${ox + (isIncoming ? dx : -dx)} ${oy}, ${anchorX - (isIncoming ? dx : -dx)} ${anchorY}, ${anchorX} ${anchorY}`;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('class', 'group-merged-connection');
            path.setAttribute('marker-end', isIncoming ? 'url(#arrowhead)' : '');
            path.setAttribute('pointer-events', 'none');
            this.groupsLayer.appendChild(path);
            if (conns.length > 1) {
                const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                badge.setAttribute('x', (ox + anchorX) / 2);
                badge.setAttribute('y', (oy + anchorY) / 2 - 6);
                badge.setAttribute('class', 'group-merged-badge');
                badge.setAttribute('pointer-events', 'none');
                badge.textContent = `×${conns.length}`;
                this.groupsLayer.appendChild(badge);
            }
        };
        drawMerged(incoming, x, y + height / 2);
        drawMerged(outgoing, x + width, y + height / 2);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'group-collapsed-block');
        g.setAttribute('data-group-id', group.id);
        g.setAttribute('transform', `translate(${x}, ${y})`);
        g.style.cursor = 'move';
        g.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.enterGroupWorkspace(group.id);
        });

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('rx', '8');
        rect.setAttribute('class', 'group-collapsed-body');
        g.appendChild(rect);

        const clipId = `group-collapsed-clip-${group.id}`;
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', clipId);
        const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        clipRect.setAttribute('x', '4');
        clipRect.setAttribute('width', Math.max(0, width - 8));
        clipRect.setAttribute('y', '0');
        clipRect.setAttribute('height', height);
        clipPath.appendChild(clipRect);
        g.appendChild(clipPath);

        const header = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        header.setAttribute('x', width / 2);
        header.setAttribute('y', 18);
        header.setAttribute('text-anchor', 'middle');
        header.setAttribute('clip-path', `url(#${clipId})`);
        header.setAttribute('class', 'group-collapsed-title');
        header.textContent = group.name || '';
        header.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.promptRenameGroup(group.id);
        });
        g.appendChild(header);

        const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        divider.setAttribute('x1', 8);
        divider.setAttribute('x2', width - 8);
        divider.setAttribute('y1', headerH);
        divider.setAttribute('y2', headerH);
        divider.setAttribute('class', 'group-collapsed-divider');
        g.appendChild(divider);

        group.deviceIds.forEach((id, i) => {
            const d = this.devices.find(x => x.id === id);
            const item = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            item.setAttribute('x', 10);
            item.setAttribute('y', headerH + 10 + (i + 1) * lineH - 4);
            item.setAttribute('clip-path', `url(#${clipId})`);
            item.setAttribute('class', 'group-collapsed-item');
            item.textContent = d ? d.name : id;
            g.appendChild(item);
        });

        this.groupsLayer.appendChild(g);
    },

    renderGroupOutlines() {
        if (!this.groupsLayer) return;
        this.groupsLayer.innerHTML = '';
        const pad = 14;
        this.deviceGroups.forEach(group => {
            if (group.collapsed) {
                this.renderCollapsedGroup(group);
                return;
            }
            const bounds = this.getGroupBounds(group);
            if (!bounds) return;
            const x = bounds.minX - pad;
            const y = bounds.minY - pad;
            const width = (bounds.maxX - bounds.minX) + pad * 2;

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', width);
            rect.setAttribute('height', (bounds.maxY - bounds.minY) + pad * 2);
            rect.setAttribute('class', 'group-outline');
            rect.setAttribute('data-group-id', group.id);
            rect.setAttribute('rx', '10');
            rect.setAttribute('pointer-events', 'none');
            this.groupsLayer.appendChild(rect);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x + 10);
            label.setAttribute('y', y - 6);
            label.setAttribute('class', 'group-label');
            label.setAttribute('data-group-id', group.id);
            label.setAttribute('pointer-events', 'auto');
            label.style.cursor = 'text';
            label.textContent = group.name || '';
            label.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.promptRenameGroup(group.id);
            });
            this.groupsLayer.appendChild(label);
        });
    }
};
