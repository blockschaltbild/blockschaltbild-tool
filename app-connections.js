const ConnectionsMixin = {
    reconnectAnchor(state) {
        const conn = state.conn;
        if (state.end === 'to') {
            const device = this.devices.find(d => d.id === conn.fromDevice);
            const port = device?.outputs.find(p => p.id === conn.fromPort);
            if (!device || !port) return null;
            return { x: device.x + device.width, y: device.y + port.cy };
        }
        const device = this.devices.find(d => d.id === conn.toDevice);
        const port = device?.inputs.find(p => p.id === conn.toPort);
        if (!device || !port) return null;
        return { x: device.x, y: device.y + port.cy };
    },

    isPortUsed(deviceId, portId, ignoreConn) {
        return this.connections.some(c => c !== ignoreConn && (
            (c.fromDevice === deviceId && c.fromPort === portId) ||
            (c.toDevice === deviceId && c.toPort === portId)
        ));
    },

    findPort(deviceId, portId, portType) {
        const device = this.devices.find(d => d.id === deviceId);
        if (!device) return null;
        const port = (portType === 'output' ? device.outputs : device.inputs).find(p => p.id === portId);
        return port ? { device, port } : null;
    },

    finishReconnect(targetPortEl) {
        const state = this.reconnect;
        this.reconnect = null;
        this.previewLayer.innerHTML = '';
        if (!state) return;
        
        const conn = state.conn;
        const neededType = state.end === 'from' ? 'output' : 'input';
        
        if (!targetPortEl || targetPortEl.dataset.portType !== neededType) {
            this.renderConnection(conn);
            return;
        }
        
        const newDeviceId = targetPortEl.dataset.deviceId;
        const newPortId = targetPortEl.dataset.portId;
        const target = this.findPort(newDeviceId, newPortId, neededType);
        
        if (!target || this.isPortUsed(newDeviceId, newPortId, conn)) {
            this.renderConnection(conn);
            return;
        }
        
        let needsConverter = false;
        const otherEnd = state.end === 'from'
            ? this.findPort(conn.toDevice, conn.toPort, 'input')
            : this.findPort(conn.fromDevice, conn.fromPort, 'output');
        if (otherEnd) {
            const outType = state.end === 'from' ? this.signalType(target.port) : this.signalType(otherEnd.port);
            const inType = state.end === 'from' ? this.signalType(otherEnd.port) : this.signalType(target.port);
            const rule = this.converterRuleFor(outType, inType);
            if (rule && !this.retuneConverterEnd(conn, state, otherEnd, this.signalType(target.port))) {
                if (!this.autoConverter || !this.findConverterTemplate(rule)) {
                    alert(`${outType} kann nicht direkt auf ${inType} verbunden werden.\n` +
                          `Dafür wird ein Konverter (z.B. "${rule.template}") benötigt.`);
                    this.renderConnection(conn);
                    return;
                }
                needsConverter = true;
            }
        }
        
        const oldDeviceId = state.end === 'from' ? conn.fromDevice : conn.toDevice;
        const oldPortId = state.end === 'from' ? conn.fromPort : conn.toPort;
        const old = this.findPort(oldDeviceId, oldPortId, neededType);
        
        if (state.end === 'from') {
            if (newDeviceId === conn.toDevice) {
                this.renderConnection(conn);
                return;
            }
            conn.fromDevice = newDeviceId;
            conn.fromPort = newPortId;
        } else {
            if (newDeviceId === conn.fromDevice) {
                this.renderConnection(conn);
                return;
            }
            conn.toDevice = newDeviceId;
            conn.toPort = newPortId;
        }
        
        if (old && !this.isPortUsed(oldDeviceId, oldPortId, null)) {
            old.port.connected = false;
        }
        target.port.connected = true;
        const newFrom = this.findPort(conn.fromDevice, conn.fromPort, 'output');
        const newTo = this.findPort(conn.toDevice, conn.toPort, 'input');
        const newCable = target.port.cable || newFrom?.port.cable || newTo?.port.cable || '';
        if (newCable) conn.cableType = newCable;
        
        if (old) this.renderDevice(old.device);
        this.renderDevice(target.device);
        this.renderConnection(conn);
        if (needsConverter) this.validateConnections(true);
        else this.cleanupConverters();
    },

    signalType(port) {
        if (!port) return '';
        const raw = (port.cable || '').trim();
        if (raw) return this.normalizeSignal(raw);
        return this.normalizeSignal(port.name || '');
    },

    normalizeSignal(text) {
        const t = String(text).toUpperCase();
        if (/\bHDMI\b/.test(t) || t.startsWith('HDMI')) return 'HDMI';
        if (/\bSDI\b/.test(t) || /\bSDI/.test(t) || /(3G|6G|12G)[- ]?SDI/.test(t)) return 'SDI';
        if (/DISPLAYPORT/.test(t) || /\bDP\b/.test(t) || /\bMINI[- ]?DP\b/.test(t)) return 'DP';
        if (/\bLC\s*\/\s*LC\b/.test(t) || /\bLC\b/.test(t) || /GLASFASER/.test(t) || /\bLWL\b/.test(t) || /\bFIBER\b/.test(t) || /\bFIBRE\b/.test(t)) return 'LC';
        if (/\bCAT\s*[5-8]/.test(t) || /\bRJ\s*45\b/.test(t) || /\bETHERNET\b/.test(t) || /\bLAN\b/.test(t)) return 'CAT';
        return '';
    },

    converterRuleFor(fromType, toType) {
        if (!fromType || !toType || fromType === toType) return null;
        return this.converterRules.find(r => r.from === fromType && r.to === toType) || null;
    },

    findConverterTemplate(rule) {
        const matches = (template) => {
            const inTypes = template.inputs.map((n, i) => this.normalizeSignal(template.inputCables?.[i] || n));
            const outTypes = template.outputs.map((n, i) => this.normalizeSignal(template.outputCables?.[i] || n));
            return inTypes.includes(rule.from) && outTypes.includes(rule.to);
        };
        const named = this.deviceTemplates.find(t => t.name === rule.template && matches(t));
        return named || this.deviceTemplates.find(matches) || null;
    },

    findPortBySignal(ports, type) {
        return ports.find(p => !p.connected && this.signalType(p) === type) || null;
    },

    retuneConverterEnd(conn, state, otherEnd, wantedType) {
        if (!otherEnd?.device.autoConverter || !wantedType) return false;
        const isOutput = state.end === 'to';
        const ports = isOutput ? otherEnd.device.outputs : otherEnd.device.inputs;
        const match = ports.find(p => p.id !== otherEnd.port.id &&
            this.signalType(p) === wantedType &&
            !this.isPortUsed(otherEnd.device.id, p.id, conn));
        if (!match) return false;
        
        otherEnd.port.connected = false;
        match.connected = true;
        if (isOutput) conn.fromPort = match.id; else conn.toPort = match.id;
        this.renderDevice(otherEnd.device);
        return true;
    },

    removeConnection(conn) {
        const from = this.findPort(conn.fromDevice, conn.fromPort, 'output');
        const to = this.findPort(conn.toDevice, conn.toPort, 'input');
        this.connections = this.connections.filter(c => c.id !== conn.id);
        document.getElementById(conn.id)?.remove();
        if (from && !this.isPortUsed(conn.fromDevice, conn.fromPort, null)) {
            from.port.connected = false;
            this.renderDevice(from.device);
        }
        if (to && !this.isPortUsed(conn.toDevice, conn.toPort, null)) {
            to.port.connected = false;
            this.renderDevice(to.device);
        }
    },

    removeDevice(device) {
        this.connections.filter(c => c.fromDevice === device.id || c.toDevice === device.id)
            .forEach(c => this.removeConnection(c));
        this.devices = this.devices.filter(d => d.id !== device.id);
        document.getElementById(device.id)?.remove();
    },

    cleanupConverters() {
        let removed = 0;
        this.devices.filter(d => d.autoConverter).forEach(conv => {
            const incoming = this.connections.filter(c => c.toDevice === conv.id);
            const outgoing = this.connections.filter(c => c.fromDevice === conv.id);
            
            if (incoming.length === 0 && outgoing.length === 0) {
                this.removeDevice(conv);
                removed++;
                return;
            }
            if (incoming.length !== 1 || outgoing.length !== 1) return;
            
            const src = this.findPort(incoming[0].fromDevice, incoming[0].fromPort, 'output');
            const dst = this.findPort(outgoing[0].toDevice, outgoing[0].toPort, 'input');
            if (!src || !dst) return;
            
            const srcType = this.signalType(src.port);
            const dstType = this.signalType(dst.port);
            if (!srcType || srcType !== dstType) return;
            
            const inLabel = this.connectionLabel(incoming[0]);
            const outLabel = this.connectionLabel(outgoing[0]);
            const label = {
                name: inLabel.name || outLabel.name,
                length: inLabel.length || outLabel.length,
                labelColor: inLabel.name ? inLabel.labelColor : (outLabel.name ? outLabel.labelColor : inLabel.labelColor)
            };
            
            this.removeDevice(conv);
            this.createConnection(src.device.id, src.port.id, dst.device.id, dst.port.id, label);
            removed++;
        });
        if (removed) this.updateConnections();
        return removed;
    },

    validateConnections(silent = false) {
        let inserted = 0;
        let blocked = 0;
        
        [...this.connections].forEach(conn => {
            const from = this.findPort(conn.fromDevice, conn.fromPort, 'output');
            const to = this.findPort(conn.toDevice, conn.toPort, 'input');
            if (!from || !to) return;
            
            const rule = this.converterRuleFor(this.signalType(from.port), this.signalType(to.port));
            if (!rule) return;
            
            if (!this.findConverterTemplate(rule)) {
                blocked++;
                return;
            }
            const label = this.connectionLabel(conn);
            this.removeConnection(conn);
            if (this.insertConverter(from.device, from.port, to.device, to.port, rule, label)) inserted++;
            else blocked++;
        });
        
        const removed = this.cleanupConverters();
        this.updateConnections();
        
        if (!silent) {
            const parts = [];
            if (inserted) parts.push(`${inserted} Konverter eingefügt`);
            if (removed) parts.push(`${removed} überflüssige(r) Konverter entfernt`);
            if (blocked) parts.push(`${blocked} Verbindung(en) ohne passenden Konverter`);
            alert(parts.length ? parts.join('\n') : 'Alle Verbindungen sind signaltechnisch korrekt.');
        }
        return { inserted, removed, blocked };
    },

    insertConverter(fromDevice, fromPort, toDevice, toPort, rule, label) {
        const template = this.findConverterTemplate(rule);
        if (!template) {
            alert(`Direkte Verbindung ${rule.from} → ${rule.to} ist nicht möglich.\n` +
                  `Dafür wird ein Konverter benötigt, aber kein passendes Gerät ("${rule.template}") ist in der Bibliothek vorhanden.`);
            return false;
        }
        
        const midX = (fromDevice.x + fromDevice.width + toDevice.x) / 2 - 80;
        const midY = (fromDevice.y + (fromPort.cy || 45) + toDevice.y + (toPort.cy || 45)) / 2 - 45;
        const converter = this.addDeviceToCanvas(template, Math.max(0, midX), Math.max(0, midY));
        converter.autoConverter = true;
        
        const convIn = this.findPortBySignal(converter.inputs, rule.from);
        const convOut = this.findPortBySignal(converter.outputs, rule.to);
        
        if (!convIn || !convOut) {
            this.removeDevice(converter);
            alert(`Der Konverter "${template.name}" hat keine freien ${rule.from}-Eingänge bzw. ${rule.to}-Ausgänge.`);
            return false;
        }
        
        this.createConnection(fromDevice.id, fromPort.id, converter.id, convIn.id, label);
        this.createConnection(converter.id, convOut.id, toDevice.id, toPort.id, label);
        return true;
    },

    connectionLabel(conn) {
        return {
            name: conn?.name || '',
            length: conn?.length || '',
            labelColor: conn?.labelColor || this.labelColors[0].value
        };
    },

    createConnection(fromDeviceId, fromPortId, toDeviceId, toPortId, label) {
        const existing = this.connections.find(c => 
            (c.fromDevice === fromDeviceId && c.fromPort === fromPortId) ||
            (c.toDevice === toDeviceId && c.toPort === toPortId)
        );
        if (existing) return;
        
        const fromDevice = this.devices.find(d => d.id === fromDeviceId);
        const toDevice = this.devices.find(d => d.id === toDeviceId);
        const fromPort = fromDevice.outputs.find(p => p.id === fromPortId);
        const toPort = toDevice.inputs.find(p => p.id === toPortId);
        
        const fromType = this.signalType(fromPort);
        const toType = this.signalType(toPort);
        const rule = this.converterRuleFor(fromType, toType);
        if (rule) {
            this.cancelConnection();
            if (this.autoConverter) {
                this.insertConverter(fromDevice, fromPort, toDevice, toPort, rule, label);
            } else {
                alert(`${fromType} kann nicht direkt auf ${toType} verbunden werden.\n` +
                      `Dafür wird ein Konverter (z.B. "${rule.template}") benötigt.`);
            }
            return;
        }
        
        const connection = {
            id: `conn-${this.nextConnectionId++}`,
            fromDevice: fromDeviceId,
            fromPort: fromPortId,
            toDevice: toDeviceId,
            toPort: toPortId,
            name: label?.name || '',
            cableType: fromPort?.cable || toPort?.cable || '',
            length: label?.length || '',
            labelColor: label?.labelColor || this.labelColors[0].value
        };
        
        if (fromPort) fromPort.connected = true;
        if (toPort) toPort.connected = true;
        
        this.connections.push(connection);
        this.renderConnection(connection);
        this.renderDevice(fromDevice);
        this.renderDevice(toDevice);
        this.cancelConnection();
        return connection;
    },

    createConnectionPath(x1, y1, x2, y2, waypoints) {
        const wps = this.activeWaypoints(waypoints);
        if (this.lineStyle === 'orthogonal') {
            const lanes = this.currentLanes;
            const routed = lanes
                ? wps.map((w, i) => ({ x: typeof lanes[i] === 'number' ? lanes[i] : w.x, y: w.y }))
                : wps;
            const pts = this.orthogonalPoints(x1, y1, x2, y2, routed, this.channelOffset,
                null, this.currentTargetRect, this.currentBack);
            this.lastNodes = pts;
            return `M ${pts.map(p => `${p.x} ${p.y}`).join(' L ')}`;
        }
        if (wps.length > 0) {
            const stub = 20;
            return this.roundedPolyline([
                { x: x1, y: y1 },
                { x: x1 + stub, y: y1 },
                ...wps,
                { x: x2 - stub, y: y2 },
                { x: x2, y: y2 }
            ], 10);
        }
        const dx = Math.abs(x2 - x1) * 0.5;
        return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    },

    orthogonalPoints(x1, y1, x2, y2, wps, offset, stubSize, target, back) {
        const stub = stubSize || this.exitStub;
        const shift = offset || 0;
        const ax = x1 + stub;
        const bx = x2 - stub;
        const nodes = [{ x: x1, y: y1 }, { x: ax, y: y1 }];
        
        if (bx <= ax) {
            const lane = back && typeof back.laneY === 'number'
                ? back.laneY
                : (target
                    ? (y1 < target.y + target.h / 2 ? target.y - stub : target.y + target.h + stub)
                    : (y1 < y2 ? y1 - stub : y1 + stub));
            const outX = back && typeof back.exitX === 'number' ? Math.max(ax, back.exitX) : ax;
            const inX = back && typeof back.entryX === 'number' ? Math.min(bx, back.entryX) : bx;
            nodes[1] = { x: outX, y: y1 };
            nodes.push({ x: outX, y: lane });
            nodes.push({ x: inX, y: lane });
            nodes.push({ x: inX, y: y2 });
            nodes.push({ x: x2, y: y2 });
            return this.dedupeNodes(this.clampToCanvas(nodes, true));
        }
        
        if (wps.length > 0) {
            wps.forEach(w => {
                const last = nodes[nodes.length - 1];
                const wx = Math.min(bx, Math.max(ax, w.x));
                nodes.push({ x: wx, y: last.y });
                nodes.push({ x: wx, y: w.y });
            });
            const endLane = shift ? Math.min(bx, Math.max(ax, shift)) : bx;
            nodes.push({ x: endLane, y: nodes[nodes.length - 1].y });
            nodes.push({ x: endLane, y: y2 });
        } else {
            let trunk = shift || (ax + bx) / 2;
            trunk = Math.min(bx, Math.max(ax, trunk));
            nodes.push({ x: trunk, y: y1 });
            nodes.push({ x: trunk, y: y2 });
        }
        
        nodes.push({ x: bx, y: y2 });
        nodes.push({ x: x2, y: y2 });
        return this.dedupeNodes(this.clampToCanvas(nodes, true));
    },

    clampToCanvas(nodes, keepEnds) {
        const pad = this.canvasPadding;
        const maxX = this.canvasWidth - pad;
        const maxY = this.canvasHeight - pad;
        const out = nodes.map((p, i) => {
            if (keepEnds && (i === 0 || i === nodes.length - 1)) return p;
            return {
                x: Math.min(maxX, Math.max(pad, p.x)),
                y: Math.min(maxY, Math.max(pad, p.y))
            };
        });
        if (keepEnds && out.length > 3) {
            out[1] = { x: out[1].x, y: out[0].y };
            out[out.length - 2] = { x: out[out.length - 2].x, y: out[out.length - 1].y };
        }
        return out;
    },

    dedupeNodes(nodes) {
        let out = nodes.filter((p, i) => i === 0 || Math.abs(p.x - nodes[i - 1].x) > 0.5 || Math.abs(p.y - nodes[i - 1].y) > 0.5);
        for (let i = 1; i < out.length - 1; i++) {
            const a = out[i - 1];
            const b = out[i];
            const c = out[i + 1];
            if ((Math.abs(a.x - b.x) < 0.5 && Math.abs(b.x - c.x) < 0.5) ||
                (Math.abs(a.y - b.y) < 0.5 && Math.abs(b.y - c.y) < 0.5)) {
                out.splice(i, 1);
                i--;
            }
        }
        return out;
    },

    targetRect(conn) {
        const d = this.devices.find(dev => dev.id === conn.toDevice);
        if (!d) return null;
        const el = document.querySelector(`[data-device-id="${d.id}"] rect`);
        const h = el ? parseFloat(el.getAttribute('height')) : 80;
        return { x: d.x, y: d.y, w: d.width, h: h || 80 };
    },

    connectionEndpoints(conn) {
        const fromDevice = this.devices.find(d => d.id === conn.fromDevice);
        const toDevice = this.devices.find(d => d.id === conn.toDevice);
        if (!fromDevice || !toDevice) return null;
        const fromPort = fromDevice.outputs.find(p => p.id === conn.fromPort);
        const toPort = toDevice.inputs.find(p => p.id === conn.toPort);
        if (!fromPort || !toPort) return null;
        return {
            x1: fromDevice.x + fromDevice.width,
            y1: fromDevice.y + fromPort.cy,
            x2: toDevice.x,
            y2: toDevice.y + toPort.cy
        };
    },

    assignChannels() {
        this.channels = {};
        this.wpChannels = {};
        if (this.lineStyle !== 'orthogonal') return;
        const spacing = Math.max(10, this.gridSize || 20);
        const used = [];
        const pad = this.canvasPadding;
        const claim = (wish, lo, hi) => {
            const min = Math.max(lo, pad);
            const max = Math.min(hi, this.canvasWidth - pad);
            let x = Math.min(max, Math.max(min, wish));
            if (!used.some(u => Math.abs(u - x) < spacing)) {
                used.push(x);
                return x;
            }
            for (let i = 1; i <= 200; i++) {
                const down = x - i * spacing;
                if (down >= min && !used.some(u => Math.abs(u - down) < spacing)) {
                    used.push(down);
                    return down;
                }
                const up = x + i * spacing;
                if (up <= max && !used.some(u => Math.abs(u - up) < spacing)) {
                    used.push(up);
                    return up;
                }
            }
            used.push(x);
            return x;
        };
        
        const usedY = [];
        const blocked = (y, xa, xb) => usedY.some(u => Math.abs(u.y - y) < spacing
            && Math.min(u.b, xb) - Math.max(u.a, xa) > 1);
        const claimY = (wish, lo, hi, xa, xb) => {
            const min = Math.max(lo, pad);
            const max = Math.min(hi, this.canvasHeight - pad);
            const start = Math.min(max, Math.max(min, wish));
            for (let i = 0; i <= 400; i++) {
                const cand = i === 0 ? [start] : [start - i * spacing, start + i * spacing];
                for (const y of cand) {
                    if (y < min || y > max) continue;
                    if (!blocked(y, xa, xb)) {
                        usedY.push({ y: y, a: xa, b: xb });
                        return y;
                    }
                }
            }
            usedY.push({ y: start, a: xa, b: xb });
            return start;
        };
        
        const manual = [];
        const auto = [];
        const back = [];
        this.backLanes = {};
        this.connections.forEach(conn => {
            const e = this.connectionEndpoints(conn);
            if (!e) return;
            const ax = e.x1 + this.exitStub;
            const bx = e.x2 - this.exitStub;
            if (bx <= ax) {
                back.push({ id: conn.id, conn: conn, ax: ax, bx: bx,
                    x1: e.x1, x2: e.x2, y1: e.y1, y2: e.y2 });
                return;
            }
            const wps = this.activeWaypoints(conn.waypoints);
            const entry = { id: conn.id, ax: ax, bx: bx, mid: (ax + bx) / 2, wps: wps,
                x1: e.x1, x2: e.x2, y1: e.y1, y2: e.y2 };
            if (wps.length > 0) manual.push(entry);
            else auto.push(entry);
        });
        
        manual.forEach(it => {
            this.wpChannels[it.id] = it.wps.map(w => claim(w.x, it.ax, it.bx));
            this.channels[it.id] = claim(it.bx, it.ax, it.bx);
        });
        
        auto.sort((p, q) => p.mid - q.mid);
        auto.forEach(it => {
            this.channels[it.id] = claim(it.mid, it.ax, it.bx);
        });
        
        manual.concat(auto).forEach(it => {
            const trunk = this.channels[it.id] || it.mid;
            usedY.push({ y: it.y1, a: it.x1, b: Math.max(it.x1, trunk) });
            usedY.push({ y: it.y2, a: Math.min(it.x2, trunk), b: it.x2 });
        });
        back.forEach(it => {
            it.exitX = claim(it.ax, it.ax, this.canvasWidth - pad);
            it.entryX = claim(it.bx, pad, it.bx);
        });
        back.forEach(it => {
            usedY.push({ y: it.y1, a: Math.min(it.x1, it.exitX), b: Math.max(it.x1, it.exitX) });
            usedY.push({ y: it.y2, a: Math.min(it.entryX, it.x2), b: Math.max(it.entryX, it.x2) });
        });
        
        back.forEach(it => {
            const tr = this.targetRect(it.conn);
            const wishY = tr
                ? (it.y1 < tr.y + tr.h / 2 ? tr.y - this.exitStub : tr.y + tr.h + this.exitStub)
                : (it.y1 < it.y2 ? it.y1 - this.exitStub : it.y1 + this.exitStub);
            this.backLanes[it.id] = {
                exitX: it.exitX,
                entryX: it.entryX,
                laneY: claimY(wishY,
                    tr && wishY > tr.y ? tr.y + tr.h + this.exitStub : pad,
                    tr && wishY < tr.y ? tr.y - this.exitStub : this.canvasHeight - pad,
                    Math.min(it.entryX, it.exitX), Math.max(it.entryX, it.exitX))
            };
        });
    },

    activeWaypoints(waypoints) {
        if (!waypoints) return [];
        return [0, 1, 2].map(i => waypoints[i]).filter(p => p && typeof p.x === 'number');
    },

    roundedPolyline(pts, radius) {
        const clean = pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 0.5);
        if (clean.length < 3) return `M ${clean.map(p => `${p.x} ${p.y}`).join(' L ')}`;
        let d = `M ${clean[0].x} ${clean[0].y}`;
        for (let i = 1; i < clean.length - 1; i++) {
            const prev = clean[i - 1];
            const cur = clean[i];
            const next = clean[i + 1];
            const l1 = Math.hypot(cur.x - prev.x, cur.y - prev.y);
            const l2 = Math.hypot(next.x - cur.x, next.y - cur.y);
            const r = Math.min(radius, l1 / 2, l2 / 2);
            const a = { x: cur.x - (cur.x - prev.x) / l1 * r, y: cur.y - (cur.y - prev.y) / l1 * r };
            const b = { x: cur.x + (next.x - cur.x) / l2 * r, y: cur.y + (next.y - cur.y) / l2 * r };
            d += ` L ${a.x} ${a.y} Q ${cur.x} ${cur.y}, ${b.x} ${b.y}`;
        }
        const last = clean[clean.length - 1];
        d += ` L ${last.x} ${last.y}`;
        return d;
    },

    samplePath(pathEl) {
        const len = pathEl.getTotalLength();
        if (!len) return [];
        const step = 5;
        const pts = [];
        for (let l = 0; l <= len; l += step) {
            const p = pathEl.getPointAtLength(l);
            pts.push({ x: p.x, y: p.y });
        }
        const last = pathEl.getPointAtLength(len);
        pts.push({ x: last.x, y: last.y });
        return pts;
    },

    segmentIntersection(a, b, c, d) {
        const r = { x: b.x - a.x, y: b.y - a.y };
        const s = { x: d.x - c.x, y: d.y - c.y };
        const den = r.x * s.y - r.y * s.x;
        if (Math.abs(den) < 1e-9) return null;
        const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
        const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
        if (t < 0 || t > 1 || u < 0 || u > 1) return null;
        return { x: a.x + t * r.x, y: a.y + t * r.y, dx: r.x, dy: r.y };
    },

    pointsBBox(pts) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of pts) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        return { minX, minY, maxX, maxY };
    },

    drawCrossingBridges() {
        const items = [];
        if (!this._sampleCache) this._sampleCache = new Map();
        const cache = this._sampleCache;
        const seen = new Set();
        this.connections.forEach(conn => {
            const group = document.getElementById(conn.id);
            const pathEl = group && group.querySelector('.connection');
            if (!pathEl) return;
            const baseD = pathEl.dataset.baseD || pathEl.getAttribute('d');
            if (pathEl.dataset.baseD && pathEl.getAttribute('d') !== baseD) pathEl.setAttribute('d', baseD);
            const nodes = this.lineStyle === 'orthogonal' ? conn._nodes : null;
            let points = nodes;
            if (!points) {
                seen.add(baseD);
                points = cache.get(baseD);
                if (!points) {
                    points = this.samplePath(pathEl);
                    cache.set(baseD, points);
                }
            }
            items.push({ conn: conn, path: pathEl, nodes: nodes, points: points,
                bbox: this.pointsBBox(points) });
        });
        for (const key of cache.keys()) if (!seen.has(key)) cache.delete(key);
        
        const radius = 6;
        for (let i = 0; i < items.length; i++) {
            const hops = [];
            const bi = items[i].bbox;
            for (let j = 0; j < i; j++) {
                const bj = items[j].bbox;
                if (bi.minX > bj.maxX || bi.maxX < bj.minX || bi.minY > bj.maxY || bi.maxY < bj.minY) continue;
                const a = items[i].points;
                const b = items[j].points;
                for (let p = 0; p < a.length - 1; p++) {
                    const a0 = a[p], a1 = a[p + 1];
                    const sMinX = Math.min(a0.x, a1.x), sMaxX = Math.max(a0.x, a1.x);
                    const sMinY = Math.min(a0.y, a1.y), sMaxY = Math.max(a0.y, a1.y);
                    if (sMinX > bj.maxX || sMaxX < bj.minX || sMinY > bj.maxY || sMaxY < bj.minY) continue;
                    for (let q = 0; q < b.length - 1; q++) {
                        const b0 = b[q], b1 = b[q + 1];
                        if (sMinX > Math.max(b0.x, b1.x) || sMaxX < Math.min(b0.x, b1.x) ||
                            sMinY > Math.max(b0.y, b1.y) || sMaxY < Math.min(b0.y, b1.y)) continue;
                        const hit = this.segmentIntersection(a0, a1, b0, b1);
                        if (!hit) continue;
                        if (hops.some(h => Math.hypot(h.x - hit.x, h.y - hit.y) < radius * 3)) continue;
                        hops.push(hit);
                    }
                }
            }
            if (hops.length > 0) {
                const d = items[i].nodes
                    ? this.buildHoppedNodePath(items[i].nodes, hops, radius)
                    : this.buildHoppedPath(items[i].points, hops, radius);
                items[i].path.setAttribute('d', d);
            }
        }
    },

    buildHoppedNodePath(nodes, hops, radius) {
        let d = `M ${nodes[0].x} ${nodes[0].y}`;
        for (let i = 0; i < nodes.length - 1; i++) {
            const a = nodes[i];
            const b = nodes[i + 1];
            const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const ux = (b.x - a.x) / len;
            const uy = (b.y - a.y) / len;
            const onSeg = hops.map(h => {
                const t = (h.x - a.x) * ux + (h.y - a.y) * uy;
                const px = a.x + ux * t;
                const py = a.y + uy * t;
                if (Math.hypot(h.x - px, h.y - py) > 1.5) return null;
                if (t < radius || t > len - radius) return null;
                return t;
            }).filter(t => t !== null).sort((p, q) => p - q);
            onSeg.forEach(t => {
                d += ` L ${a.x + ux * (t - radius)} ${a.y + uy * (t - radius)}`;
                d += ` A ${radius} ${radius} 0 0 1 ${a.x + ux * (t + radius)} ${a.y + uy * (t + radius)}`;
            });
            d += ` L ${b.x} ${b.y}`;
        }
        return d;
    },

    buildHoppedPath(points, hops, radius) {
        let d = `M ${points[0].x} ${points[0].y}`;
        let i = 1;
        while (i < points.length) {
            const p = points[i];
            const hop = hops.find(h => Math.hypot(p.x - h.x, p.y - h.y) < radius);
            if (hop) {
                let j = i;
                while (j < points.length && Math.hypot(points[j].x - hop.x, points[j].y - hop.y) < radius) j++;
                const end = points[Math.min(j, points.length - 1)];
                d += ` A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
                i = j + 1;
            } else {
                d += ` L ${p.x} ${p.y}`;
                i++;
            }
        }
        return d;
    },

    bezierPoint(x1, y1, x2, y2, t) {
        const dx = Math.abs(x2 - x1) * 0.5;
        const c = (a, b, cc, d) => {
            const u = 1 - t;
            return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * cc + t * t * t * d;
        };
        return {
            x: c(x1, x1 + dx, x2 - dx, x2),
            y: c(y1, y1, y2, y2)
        };
    },

    renderConnection(conn) {
        const existing = document.getElementById(conn.id);
        if (existing) existing.remove();
        
        const fromDevice = this.devices.find(d => d.id === conn.fromDevice);
        const toDevice = this.devices.find(d => d.id === conn.toDevice);
        const fromPort = fromDevice.outputs.find(p => p.id === conn.fromPort);
        const toPort = toDevice.inputs.find(p => p.id === conn.toPort);
        
        const x1 = fromDevice.x + fromDevice.width;
        const y1 = fromDevice.y + fromPort.cy;
        const x2 = toDevice.x;
        const y2 = toDevice.y + toPort.cy;
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('id', conn.id);
        const isSelected = this.selectedElement && this.selectedElement.type === 'connection'
            && this.selectedElement.element.id === conn.id;
        if (this.handlesLayer) {
            this.handlesLayer.querySelectorAll(`[data-connection-id="${conn.id}"]`)
                .forEach(el => el.remove());
        }
        g.setAttribute('class', isSelected ? 'connection-group selected' : 'connection-group');
        g.dataset.connectionId = conn.id;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'connection');
        if (!this.channels) this.assignChannels();
        this.channelOffset = this.channels[conn.id] || 0;
        this.currentLanes = this.wpChannels ? this.wpChannels[conn.id] : null;
        this.currentBack = this.backLanes ? this.backLanes[conn.id] : null;
        this.lastNodes = null;
        this.currentTargetRect = this.lineStyle === 'orthogonal' ? this.targetRect(conn) : null;
        const baseD = this.createConnectionPath(x1, y1, x2, y2, conn.waypoints);
        path.setAttribute('d', baseD);
        path.dataset.baseD = baseD;
        conn._nodes = this.lastNodes;
        path.setAttribute('marker-end', 'url(#arrowhead)');
        if (conn.lineColor) path.style.stroke = conn.lineColor;
        g.appendChild(path);
        
        [{ end: 'from', hx: x1 + 14, hy: y1 }, { end: 'to', hx: x2 - 14, hy: y2 }].forEach(h => {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            handle.setAttribute('class', 'conn-handle');
            handle.setAttribute('cx', h.hx);
            handle.setAttribute('cy', h.hy);
            handle.setAttribute('r', '5');
            handle.dataset.connectionId = conn.id;
            handle.dataset.end = h.end;
            if (isSelected && this.handlesLayer) this.handlesLayer.appendChild(handle);
        });
        
        const labelLines = this.getConnectionLabelLines(conn);
        if (labelLines.length > 0) {
            const lineHeight = 12;
            const boxHeight = labelLines.length * lineHeight + 4;
            const textWidth = Math.max(...labelLines.map(l => l.length)) * 6 + 10;
            const wps = this.activeWaypoints(conn.waypoints);
            const anchor = wps.length > 0 ? wps[Math.floor((wps.length - 1) / 2)] : null;
            const midY = anchor ? anchor.y : (y1 + y2) / 2;
            const baseX = anchor ? anchor.x : (x1 + x2) / 2;
            const midX = this.findFreeLabelX(conn.id, baseX, midY, textWidth, boxHeight);
            conn.labelBox = { x: midX, y: midY, w: textWidth, h: boxHeight };
            
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bg.setAttribute('class', 'connection-label-bg');
            bg.setAttribute('x', midX - textWidth / 2);
            bg.setAttribute('y', midY - boxHeight / 2);
            bg.setAttribute('width', textWidth);
            bg.setAttribute('height', boxHeight);
            bg.setAttribute('rx', '3');
            g.appendChild(bg);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'connection-label');
            text.setAttribute('x', midX);
            text.setAttribute('y', midY - boxHeight / 2 + lineHeight);
            text.style.fill = conn.labelColor || '#ffffff';
            labelLines.forEach((line, i) => {
                const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                tspan.setAttribute('x', midX);
                if (i > 0) tspan.setAttribute('dy', lineHeight);
                tspan.textContent = line;
                text.appendChild(tspan);
            });
            g.appendChild(text);
        } else {
            delete conn.labelBox;
        }
        
        this.connectionsLayer.appendChild(g);
        
        if (isSelected && this.handlesLayer) {
            const total = path.getTotalLength();
            [0.25, 0.5, 0.75].forEach((t, idx) => {
                const pos = path.getPointAtLength(total * t);
                const wp = conn.waypoints && conn.waypoints[idx];
                const bend = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                bend.setAttribute('class', wp ? 'conn-bend active' : 'conn-bend');
                bend.setAttribute('cx', pos.x);
                bend.setAttribute('cy', pos.y);
                bend.setAttribute('r', '6');
                bend.dataset.connectionId = conn.id;
                bend.dataset.bendIndex = idx;
                this.handlesLayer.appendChild(bend);
            });
        }
        
        if (!this.bulkRender) this.drawCrossingBridges();
    }
    ,

    findFreeLabelX(connId, x, y, w, h) {
        const boxes = this.connections
            .filter(c => c.id !== connId && c.labelBox)
            .map(c => c.labelBox);
        let cx = x;
        for (let i = 0; i < 40; i++) {
            const hit = boxes.find(b =>
                Math.abs(b.x - cx) < (b.w + w) / 2 + 6 &&
                Math.abs(b.y - y) < (b.h + h) / 2 + 2);
            if (!hit) return cx;
            cx = hit.x + hit.w / 2 + w / 2 + 8;
        }
        return cx;
    }
    ,

    getConnectionLabelLines(conn) {
        const lines = [];
        if (conn.name) lines.push(conn.name);
        const details = [];
        if (conn.cableType) details.push(conn.cableType);
        if (conn.length) details.push(`${conn.length}m`);
        if (details.length > 0) lines.push(details.join(' / '));
        return lines;
    },

    getConnectionLabel(conn) {
        return this.getConnectionLabelLines(conn).join(' / ');
    },

    updateConnections() {
        this.connections.forEach(conn => delete conn.labelBox);
        this.assignChannels();
        this.bulkRender = true;
        this.connections.forEach(conn => this.renderConnection(conn));
        this.bulkRender = false;
        this.drawCrossingBridges();
    },

    cancelConnection() {
        this.connectionStart = null;
        this.previewLayer.innerHTML = '';
    },

    showAutoConnectModal() {
        if (this.devices.length < 2) {
            alert('Für Auto-Verbinden werden mindestens zwei Geräte im Plan benötigt.');
            return;
        }
        const fromSel = document.getElementById('autoConnectFrom');
        const toSel = document.getElementById('autoConnectTo');
        const sorted = [...this.devices].sort((a, b) => a.x - b.x || a.y - b.y);
        const optionsHtml = sorted.map(d => {
            const meta = [d.outputs.length ? `${d.outputs.length} Out` : '', d.inputs.length ? `${d.inputs.length} In` : ''].filter(Boolean).join(' / ');
            return `<option value="${d.id}">${this.escapeHtml(d.name)}${meta ? ` (${meta})` : ''}</option>`;
        }).join('');
        fromSel.innerHTML = optionsHtml;
        toSel.innerHTML = optionsHtml;
        
        const selected = Array.from(document.querySelectorAll('.device-block.selected'))
            .map(el => this.devices.find(d => d.id === el.id))
            .filter(Boolean)
            .sort((a, b) => a.x - b.x);
        const defaultFrom = selected.find(d => d.outputs.length) || sorted.find(d => d.outputs.length) || sorted[0];
        const defaultTo = selected.find(d => d !== defaultFrom && d.inputs.length)
            || sorted.find(d => d !== defaultFrom && d.inputs.length && d.x >= defaultFrom.x)
            || sorted.find(d => d !== defaultFrom) || sorted[0];
        fromSel.value = defaultFrom.id;
        toSel.value = defaultTo.id;
        
        this.updateAutoConnectPreview();
        document.getElementById('autoConnectModal').classList.add('active');
    },

    hideAutoConnectModal() {
        document.getElementById('autoConnectModal').classList.remove('active');
        this.autoConnectPlan = null;
    },

    portSignalKey(port) {
        const type = this.signalType(port);
        if (type) return type;
        const cable = (port.cable || '').trim().toUpperCase();
        return cable ? `CABLE:${cable}` : '';
    },

    portNameKey(port) {
        return String(port.name || '').toUpperCase().replace(/\b(IN|OUT|INPUT|OUTPUT|EINGANG|AUSGANG)\b/g, '').replace(/[^A-Z0-9]+/g, ' ').trim();
    },

    planAutoConnections(fromDevice, toDevice, allowGeneric, preferFiber) {
        const plan = [];
        if (!fromDevice || !toDevice || fromDevice.id === toDevice.id) return plan;
        
        const outputs = fromDevice.outputs.filter(p => !this.isPortUsed(fromDevice.id, p.id, null));
        const inputs = toDevice.inputs.filter(p => !this.isPortUsed(toDevice.id, p.id, null));
        const usedIn = new Set();
        
        const take = (out, inp, reason, rule) => {
            usedIn.add(inp.id);
            plan.push({ out, inp, reason, rule: rule || null });
        };
        const pass = (predicate, reason) => {
            outputs.forEach(out => {
                if (plan.some(p => p.out.id === out.id)) return;
                const inp = inputs.find(i => !usedIn.has(i.id) && predicate(out, i));
                if (inp) take(out, inp, reason);
            });
        };
        
        if (preferFiber && this.autoConverter) {
            const rule = this.converterRuleFor('LC', 'CAT');
            if (rule && this.findConverterTemplate(rule)) {
                outputs.filter(o => this.signalType(o) === 'LC').forEach(out => {
                    const inp = inputs.find(i => !usedIn.has(i.id) && this.signalType(i) === 'CAT');
                    if (inp) take(out, inp, `Glasfaser über ${rule.template}`, rule);
                });
            }
        }
        
        pass((o, i) => {
            const oc = (o.cable || '').trim().toUpperCase();
            return oc && oc === (i.cable || '').trim().toUpperCase();
        }, 'gleicher Kabeltyp');
        pass((o, i) => {
            const k = this.portSignalKey(o);
            return k && k === this.portSignalKey(i);
        }, 'gleicher Signaltyp');
        pass((o, i) => {
            const k = this.portNameKey(o);
            return k && !this.signalType(o) && !this.signalType(i) && k === this.portNameKey(i);
        }, 'gleicher Anschlussname');
        
        if (this.autoConverter) {
            outputs.forEach(out => {
                if (plan.some(p => p.out.id === out.id)) return;
                const oType = this.signalType(out);
                if (!oType) return;
                for (const inp of inputs) {
                    if (usedIn.has(inp.id)) continue;
                    const rule = this.converterRuleFor(oType, this.signalType(inp));
                    if (rule && this.findConverterTemplate(rule)) {
                        take(out, inp, `Konverter ${rule.from} → ${rule.to}`, rule);
                        break;
                    }
                }
            });
        }
        
        if (allowGeneric) {
            pass((o, i) => !this.signalType(o) && !this.signalType(i), 'freie Zuordnung');
        }
        
        return plan;
    },

    updateAutoConnectPreview() {
        const fromDevice = this.devices.find(d => d.id === document.getElementById('autoConnectFrom').value);
        const toDevice = this.devices.find(d => d.id === document.getElementById('autoConnectTo').value);
        const allowGeneric = document.getElementById('chkAutoConnectGeneric').checked;
        const preferFiber = document.getElementById('chkAutoConnectFiber').checked;
        const list = document.getElementById('autoConnectPreview');
        const btn = document.getElementById('btnStartAutoConnect');
        
        this.autoConnectPlan = this.planAutoConnections(fromDevice, toDevice, allowGeneric, preferFiber);
        
        if (fromDevice && toDevice && fromDevice.id === toDevice.id) {
            list.innerHTML = '<p class="hint">Start- und Endgerät müssen unterschiedlich sein.</p>';
            btn.disabled = true;
            return;
        }
        if (!this.autoConnectPlan.length) {
            list.innerHTML = '<p class="hint">Keine passenden freien Anschlüsse zwischen den gewählten Geräten gefunden.</p>';
            btn.disabled = true;
            return;
        }
        btn.disabled = false;
        list.innerHTML = this.autoConnectPlan.map((p, idx) => `
            <label class="manage-item pdf-sheet-item">
                <input type="checkbox" class="auto-connect-check" data-index="${idx}" checked>
                <div class="manage-main">
                    <div class="manage-name">${this.escapeHtml(p.out.name)} → ${this.escapeHtml(p.inp.name)}</div>
                    <div class="manage-meta">${this.escapeHtml(p.reason)}${p.out.cable ? ` · ${this.escapeHtml(p.out.cable)}` : ''}</div>
                </div>
            </label>
        `).join('');
    },

    startAutoConnectFromModal() {
        const fromDevice = this.devices.find(d => d.id === document.getElementById('autoConnectFrom').value);
        const toDevice = this.devices.find(d => d.id === document.getElementById('autoConnectTo').value);
        const plan = this.autoConnectPlan || [];
        const chosen = Array.from(document.querySelectorAll('#autoConnectPreview .auto-connect-check:checked'))
            .map(chk => plan[parseInt(chk.dataset.index, 10)])
            .filter(Boolean);
        if (!fromDevice || !toDevice || !chosen.length) {
            alert('Bitte mindestens eine Verbindung auswählen.');
            return;
        }
        
        this.hideAutoConnectModal();
        let created = 0;
        const before = this.connections.length;
        chosen.forEach(p => {
            this.createConnection(fromDevice.id, p.out.id, toDevice.id, p.inp.id);
        });
        created = this.connections.length - before;
        this.updateConnections();
        if (created === 0) alert('Es konnten keine Verbindungen erstellt werden.');
    },

    autoConnect() {
        this.showAutoConnectModal();
    },

    clearConnections() {
        this.connections.forEach(conn => {
            document.getElementById(conn.id)?.remove();
            const fromDevice = this.devices.find(d => d.id === conn.fromDevice);
            const toDevice = this.devices.find(d => d.id === conn.toDevice);
            if (fromDevice) {
                const port = fromDevice.outputs.find(p => p.id === conn.fromPort);
                if (port) port.connected = false;
            }
            if (toDevice) {
                const port = toDevice.inputs.find(p => p.id === conn.toPort);
                if (port) port.connected = false;
            }
        });
        this.connections = [];
        this.devices.forEach(d => this.renderDevice(d));
    }
};
