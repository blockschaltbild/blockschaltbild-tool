const ExportMixin = {
    downloadExcelTemplate() {
        if (typeof XLSX === 'undefined') {
            alert('Excel-Bibliothek nicht geladen. Bitte Internetverbindung prüfen.');
            return;
        }
        const header = ['Name', 'Artikelnummer', 'Typ', 'Gruppe', 'Farbe', 'Eingänge', 'Ausgänge'];
        const rows = [
            header,
            ['Yamaha CL5', 'CL5', 'Digital Mixer', 'Ton', '', 'IN 1:XLR, IN 2:XLR, IN 3:XLR', 'MAIN L:XLR, MAIN R:XLR'],
            ['Barco E2', 'E2', 'Video Processor', 'Video', '', 'SDI 1:SDI, HDMI 1:HDMI', 'SDI OUT 1:SDI'],
            ['', '', '', '', '', '', '']
        ];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 45 }, { wch: 45 }];
        
        const info = XLSX.utils.aoa_to_sheet([
            ['Hinweise zur Vorlage'],
            [''],
            ['Name', 'Pflichtfeld – Gerätebezeichnung'],
            ['Artikelnummer', 'Optional'],
            ['Typ', 'Optional, z. B. Digital Mixer'],
            ['Gruppe', 'Gruppenname oder Gruppen-ID: ' + this.groups.map(g => `${g.name} (${g.id})`).join(', ')],
            ['Farbe', 'Optional als Hex-Wert (#3498db). Leer = Farbe der Gruppe wird übernommen.'],
            ['Eingänge', 'Kommagetrennt, Kabeltyp optional nach Doppelpunkt: IN 1:XLR, IN 2:XLR'],
            ['Ausgänge', 'Kommagetrennt, Kabeltyp optional nach Doppelpunkt: MAIN L:XLR'],
            [''],
            ['Kabeltypen', this.cableTypes.join(', ')],
            [''],
            ['Import', 'Über "Geräte importieren" die ausgefüllte Datei auswählen.']
        ]);
        info['!cols'] = [{ wch: 18 }, { wch: 90 }];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Geräte');
        XLSX.utils.book_append_sheet(wb, info, 'Hinweise');
        XLSX.writeFile(wb, 'Geraete_Vorlage.xlsx');
    },

    showExportModal() {
        document.getElementById('exportModal').classList.add('active');
        this.renderExportGroupsList();
    },

    hideExportModal() {
        document.getElementById('exportModal').classList.remove('active');
    },

    renderExportGroupsList() {
        const list = document.getElementById('exportGroupsList');
        list.innerHTML = '';
        this.groups.forEach(group => {
            const templates = this.deviceTemplates.filter(t => t.group === group.id);
            const div = document.createElement('div');
            div.className = 'manage-item';
            div.innerHTML = `
                <div class="manage-color" style="background:${group.color}"></div>
                <div class="manage-main">
                    <div class="manage-name">${group.name}</div>
                    <div class="manage-meta">${templates.length} Geräte</div>
                </div>
                <button type="button" class="btn-add-canvas">Exportieren</button>
            `;
            const btn = div.querySelector('.btn-add-canvas');
            if (templates.length === 0) btn.disabled = true;
            btn.addEventListener('click', () => {
                this.exportDevicesExcel(templates, `Geraete_${group.name}`);
            });
            list.appendChild(div);
        });
    },

    deviceExportRow(t) {
        const group = this.groups.find(g => g.id === t.group);
        const ports = (names, cables) => (names || [])
            .map((n, i) => (cables && cables[i] ? `${n}:${cables[i]}` : n))
            .join(', ');
        return [
            t.name,
            t.article || '',
            t.type || '',
            group ? group.name : 'Sonstiges',
            t.color || (group ? group.color : ''),
            ports(t.inputs, t.inputCables),
            ports(t.outputs, t.outputCables)
        ];
    },

    deviceExportSheet(templates) {
        const header = ['Name', 'Artikelnummer', 'Typ', 'Gruppe', 'Farbe', 'Eingänge', 'Ausgänge'];
        const ws = XLSX.utils.aoa_to_sheet([header, ...templates.map(t => this.deviceExportRow(t))]);
        ws['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 45 }, { wch: 45 }];
        return ws;
    },

    sanitizeFileName(name) {
        return String(name).replace(/[^\wäöüÄÖÜß\- ]/g, '').trim().replace(/\s+/g, '_') || 'Export';
    },

    exportDevicesExcel(templates, fileName) {
        if (typeof XLSX === 'undefined') {
            alert('Excel-Bibliothek nicht geladen. Bitte Internetverbindung prüfen.');
            return;
        }
        if (!templates || templates.length === 0) {
            alert('Keine Geräte zum Exportieren vorhanden.');
            return;
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, this.deviceExportSheet(templates), 'Geräte');
        XLSX.writeFile(wb, `${this.sanitizeFileName(fileName)}.xlsx`);
    },

    exportDevicesByGroups() {
        if (typeof XLSX === 'undefined') {
            alert('Excel-Bibliothek nicht geladen. Bitte Internetverbindung prüfen.');
            return;
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, this.deviceExportSheet(this.deviceTemplates), 'Alle Geräte');
        let added = 0;
        this.groups.forEach(group => {
            const templates = this.deviceTemplates.filter(t => t.group === group.id);
            if (templates.length === 0) return;
            const sheetName = this.sanitizeFileName(group.name).slice(0, 31);
            XLSX.utils.book_append_sheet(wb, this.deviceExportSheet(templates), sheetName);
            added++;
        });
        if (added === 0) {
            alert('Keine Geräte zum Exportieren vorhanden.');
            return;
        }
        XLSX.writeFile(wb, `${this.sanitizeFileName(this.projectName)}_Geraete_Gruppen.xlsx`);
    },

    importExcelDevices(file) {
        if (typeof XLSX === 'undefined') {
            alert('Excel-Bibliothek nicht geladen. Bitte Internetverbindung prüfen.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const wb = XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
                const sheetName = wb.SheetNames.find(n => n.toLowerCase().startsWith('gerät') || n.toLowerCase().startsWith('geraet')) || wb.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
                let count = 0;
                rows.forEach(row => {
                    const get = (...keys) => {
                        for (const key of keys) {
                            const found = Object.keys(row).find(k => k.toLowerCase().trim() === key);
                            if (found && String(row[found]).trim()) return String(row[found]).trim();
                        }
                        return '';
                    };
                    const name = get('name', 'gerät', 'geraet');
                    if (!name) return;
                    const groupValue = get('gruppe', 'group');
                    const group = this.groups.find(g => g.id.toLowerCase() === groupValue.toLowerCase() || g.name.toLowerCase() === groupValue.toLowerCase());
                    const inputs = this.parsePortList(get('eingänge', 'eingaenge', 'inputs'));
                    const outputs = this.parsePortList(get('ausgänge', 'ausgaenge', 'outputs'));
                    this.addDeviceTemplate({
                        name: name,
                        article: get('artikelnummer', 'artikelnr', 'article'),
                        type: get('typ', 'type'),
                        group: group ? group.id : 'other',
                        color: get('farbe', 'color'),
                        inputs: inputs.names,
                        outputs: outputs.names,
                        inputCables: inputs.cables,
                        outputCables: outputs.cables
                    });
                    count++;
                });
                alert(count > 0 ? `${count} Gerät(e) importiert.` : 'Keine Geräte gefunden. Bitte Spalte "Name" prüfen.');
            } catch (err) {
                alert('Fehler beim Excel-Import: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    },

    saveDiagram() {
        this.storeActiveSheet();
        const data = {
            sheets: this.sheets.map(s => ({ id: s.id, name: s.name, devices: s.devices, connections: s.connections, textboxes: s.textboxes || [] })),
            activeSheet: this.activeSheet,
            lineStyle: this.lineStyle,
            gridSize: this.gridSize,
            gridVisible: this.gridVisible,
            snapToGrid: this.snapToGrid,
            projectName: this.projectName,
            projectNumber: this.projectNumber,
            eventFrom: this.eventFrom,
            eventTo: this.eventTo,
            eventLocation: this.eventLocation,
            projectAuthor: this.projectAuthor,
            devices: this.devices,
            connections: this.connections,
            templates: this.deviceTemplates,
            groups: this.groups,
            cableTypes: this.cableTypes
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.projectName.replace(/\s+/g, '_')}_blockschaltbild.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    loadDiagram(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                this.devices = [];
                this.connections = [];
                this.devicesLayer.innerHTML = '';
                this.connectionsLayer.innerHTML = '';
                
                if (data.projectName) {
                    this.projectName = data.projectName;
                    document.getElementById('projectName').value = data.projectName;
                }
                if (data.projectNumber) {
                    this.projectNumber = data.projectNumber;
                    document.getElementById('projectNumber').value = data.projectNumber;
                }
                this.eventFrom = data.eventFrom || '';
                this.eventTo = data.eventTo || '';
                this.eventLocation = data.eventLocation || '';
                this.projectAuthor = data.projectAuthor || '';
                this.updateProjectDisplay();
                
                const merged = this.mergeIntoLibrary(data);
                
                if (data.lineStyle) {
                    this.lineStyle = data.lineStyle;
                    document.getElementById('selLineStyle').value = data.lineStyle;
                }
                if (data.gridSize) {
                    this.gridSize = data.gridSize;
                    document.getElementById('gridSizeInput').value = data.gridSize;
                }
                if (typeof data.gridVisible === 'boolean') {
                    this.gridVisible = data.gridVisible;
                    document.getElementById('chkGridVisible').checked = data.gridVisible;
                }
                if (typeof data.snapToGrid === 'boolean') {
                    this.snapToGrid = data.snapToGrid;
                    document.getElementById('chkSnapGrid').checked = data.snapToGrid;
                }
                this.updateGrid();
                
                if (data.sheets && data.sheets.length > 0) {
                    this.sheets = data.sheets.map((s, i) => ({
                        id: s.id || (i + 1),
                        name: s.name || `Blatt ${i + 1}`,
                        devices: s.devices || [],
                        connections: s.connections || [],
                        textboxes: s.textboxes || []
                    }));
                } else {
                    this.sheets = [{ id: 1, name: 'Blatt 1', devices: data.devices || [], connections: data.connections || [], textboxes: data.textboxes || [] }];
                }
                this.nextSheetId = Math.max(0, ...this.sheets.map(s => parseInt(s.id) || 0)) + 1;
                
                const allDevices = this.sheets.reduce((a, s) => a.concat(s.devices), []);
                const allConnections = this.sheets.reduce((a, s) => a.concat(s.connections), []);
                const allTextboxes = this.sheets.reduce((a, s) => a.concat(s.textboxes), []);
                this.nextDeviceId = Math.max(0, ...allDevices.map(d => parseInt(String(d.id).split('-')[1]) || 0)) + 1;
                this.nextConnectionId = Math.max(0, ...allConnections.map(c => parseInt(String(c.id).split('-')[1]) || 0)) + 1;
                this.nextTextboxId = Math.max(0, ...allTextboxes.map(t => parseInt(String(t.id).split('-')[1]) || 0)) + 1;
                
                let active = typeof data.activeSheet === 'number' ? data.activeSheet : 0;
                if (active < 0 || active >= this.sheets.length) active = 0;
                this.activateSheet(active);
                const messages = [];
                if (merged && (merged.templates || merged.groups || merged.cables)) {
                    const mParts = [];
                    if (merged.templates) mParts.push(`${merged.templates} Gerät(e)`);
                    if (merged.groups) mParts.push(`${merged.groups} Gruppe(n)`);
                    if (merged.cables) mParts.push(`${merged.cables} Kabeltyp(en)`);
                    messages.push('Neu in die zentrale Bibliothek übernommen:\n' + mParts.join(', '));
                }
                if (this.autoConverter) {
                    const res = this.validateConnections(true);
                    if (res.inserted || res.removed || res.blocked) {
                        const parts = [];
                        if (res.inserted) parts.push(`${res.inserted} fehlende(r) Konverter eingefügt`);
                        if (res.removed) parts.push(`${res.removed} überflüssige(r) Konverter entfernt`);
                        if (res.blocked) parts.push(`${res.blocked} Verbindung(en) ohne passenden Konverter`);
                        messages.push('Signalprüfung nach dem Laden:\n' + parts.join('\n'));
                    }
                }
                if (messages.length) alert(messages.join('\n\n'));
            } catch (err) {
                alert('Fehler beim Laden: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    },

    inlineComputedStyles(liveRoot, cloneRoot) {
        const props = [
            'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity',
            'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity',
            'font-family', 'font-size', 'font-weight', 'font-style',
            'text-anchor', 'dominant-baseline', 'letter-spacing',
            'marker-start', 'marker-mid', 'marker-end', 'rx', 'ry', 'display', 'visibility'
        ];
        const liveNodes = [liveRoot].concat(Array.from(liveRoot.querySelectorAll('*')));
        const cloneNodes = [cloneRoot].concat(Array.from(cloneRoot.querySelectorAll('*')));
        if (liveNodes.length !== cloneNodes.length) return;

        for (let i = 0; i < liveNodes.length; i++) {
            const computed = getComputedStyle(liveNodes[i]);
            let declarations = '';
            props.forEach(prop => {
                const value = computed.getPropertyValue(prop);
                if (value) declarations += prop + ':' + value + ';';
            });
            cloneNodes[i].setAttribute('style', declarations);
        }
    },

    applyMonochromeDevices(cloneRoot) {
        cloneRoot.querySelectorAll('.device-block rect.body').forEach(rect => {
            rect.style.fill = '#ffffff';
            rect.style.stroke = '#000000';
            rect.style.strokeWidth = '1.5';
        });
        cloneRoot.querySelectorAll('.device-block text').forEach(text => {
            text.style.fill = '#000000';
            text.style.fillOpacity = '1';
        });
        cloneRoot.querySelectorAll('.port circle').forEach(circle => {
            circle.style.fill = '#ffffff';
            circle.style.stroke = '#000000';
        });
        cloneRoot.querySelectorAll('.port text').forEach(text => {
            text.style.fill = '#000000';
            text.style.fillOpacity = '1';
        });
        cloneRoot.querySelectorAll('.device-block.placeholder rect.body').forEach(rect => {
            rect.style.strokeWidth = '3';
            rect.style.strokeDasharray = '8 5';
        });
        cloneRoot.querySelectorAll('.device-block.placeholder text.placeholder-badge').forEach(text => {
            text.style.fill = '#000000';
            text.style.fillOpacity = '1';
        });
    },

    matchArrowheadsToLines(clone) {
        const template = clone.querySelector('#arrowhead');
        const defs = clone.querySelector('defs');
        if (!template || !defs) return;
        const livePaths = this.svg.querySelectorAll('path.connection');
        const markers = {};
        clone.querySelectorAll('path.connection').forEach((path, i) => {
            const live = livePaths[i];
            const color = live ? getComputedStyle(live).stroke : path.style.stroke;
            if (!color) return;
            if (!markers[color]) {
                const id = 'arrowhead-export-' + Object.keys(markers).length;
                const marker = template.cloneNode(true);
                marker.setAttribute('id', id);
                const poly = marker.querySelector('polygon');
                if (poly) poly.setAttribute('fill', color);
                defs.appendChild(marker);
                markers[color] = id;
            }
            path.style.markerEnd = `url(#${markers[color]})`;
        });
    },

    isMonochromeExport() {
        const chk = document.getElementById('chkExportMono');
        return !!(chk && chk.checked);
    },

    async renderDiagramPNG(view, targetPixelWidth = 4000, options = {}) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const selected = Array.from(this.svg.querySelectorAll('.selected'));
        selected.forEach(el => el.classList.remove('selected'));

        const clone = this.svg.cloneNode(true);
        this.inlineComputedStyles(this.svg, clone);

        selected.forEach(el => el.classList.add('selected'));

        ['handles-layer', 'preview-layer', 'grid-rect'].forEach(id => {
            const el = clone.querySelector('#' + id);
            if (el) el.remove();
        });
        clone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        if (options.monochrome) {
            this.matchArrowheadsToLines(clone);
            this.applyMonochromeDevices(clone);
        }

        clone.setAttribute('xmlns', svgNS);
        clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        clone.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);
        clone.setAttribute('width', view.width);
        clone.setAttribute('height', view.height);
        clone.removeAttribute('style');
        clone.removeAttribute('class');

        const style = document.createElementNS(svgNS, 'style');
        style.textContent = 'svg{font-family:Arial,Helvetica,sans-serif;}';
        clone.insertBefore(style, clone.firstChild);

        const bg = document.createElementNS(svgNS, 'rect');
        bg.setAttribute('x', view.x);
        bg.setAttribute('y', view.y);
        bg.setAttribute('width', view.width);
        bg.setAttribute('height', view.height);
        bg.setAttribute('fill', '#ffffff');
        clone.insertBefore(bg, style.nextSibling);

        const svgText = new XMLSerializer().serializeToString(clone);
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
        const img = await new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => reject(new Error('SVG konnte nicht gerendert werden'));
            im.src = url;
        });

        const maxPixels = 30000000;
        let ppu = targetPixelWidth / view.width;
        if (view.width * view.height * ppu * ppu > maxPixels) {
            ppu = Math.sqrt(maxPixels / (view.width * view.height));
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(view.width * ppu));
        canvas.height = Math.max(1, Math.round(view.height * ppu));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    },

    async renderLogoPNG(targetPixelWidth = 1200) {
        if (typeof ICT_LOGO_DATA_URL === 'undefined') return null;
        try {
            const img = await new Promise((resolve, reject) => {
                const im = new Image();
                im.onload = () => resolve(im);
                im.onerror = () => reject(new Error('Logo konnte nicht geladen werden'));
                im.src = ICT_LOGO_DATA_URL;
            });
            const aspect = typeof ICT_LOGO_ASPECT !== 'undefined' ? ICT_LOGO_ASPECT : img.height / img.width;
            const canvas = document.createElement('canvas');
            canvas.width = targetPixelWidth;
            canvas.height = Math.round(targetPixelWidth * aspect);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/png');
        } catch (err) {
            return null;
        }
    },

    showPdfExportModal() {
        this.storeActiveSheet();
        const list = document.getElementById('pdfExportSheetList');
        list.innerHTML = '';
        this.sheets.forEach((sheet, idx) => {
            const label = document.createElement('label');
            label.className = 'manage-item pdf-sheet-item';
            const count = (sheet.devices || []).length;
            label.innerHTML = `
                <input type="checkbox" class="pdf-sheet-check" data-index="${idx}" checked>
                <div class="manage-name">${sheet.name}${idx === this.activeSheet ? ' (aktuell)' : ''}</div>
                <div class="manage-meta">${count} Gerät${count === 1 ? '' : 'e'}</div>
            `;
            list.appendChild(label);
        });
        document.getElementById('pdfExportModal').classList.add('active');
    },

    hidePdfExportModal() {
        document.getElementById('pdfExportModal').classList.remove('active');
    },

    setPdfExportSheetsChecked(checked) {
        document.querySelectorAll('#pdfExportSheetList .pdf-sheet-check').forEach(chk => { chk.checked = checked; });
    },

    startPdfExportFromModal() {
        const indices = Array.from(document.querySelectorAll('#pdfExportSheetList .pdf-sheet-check:checked'))
            .map(chk => parseInt(chk.dataset.index, 10))
            .filter(i => !isNaN(i) && i >= 0 && i < this.sheets.length);
        if (!indices.length) {
            alert('Bitte mindestens einen Arbeitsbereich auswählen.');
            return;
        }
        this.hidePdfExportModal();
        this.exportPDF(indices);
    },

    async exportPDF(sheetIndices) {
        const { jsPDF } = window.jspdf;
        
        const A1_WIDTH_MM = 841;
        const A1_HEIGHT_MM = 594;
        
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [A1_HEIGHT_MM, A1_WIDTH_MM]
        });
        
        const indices = Array.isArray(sheetIndices) && sheetIndices.length ? sheetIndices : [this.activeSheet];
        const originalSheet = this.activeSheet;
        const monochrome = this.isMonochromeExport();
        const logoPNG = await this.renderLogoPNG(1200);
        const multiPage = indices.length > 1;
        
        this.deselectAll();
        this.storeActiveSheet();
        try {
            for (let p = 0; p < indices.length; p++) {
                const idx = indices[p];
                if (idx !== this.activeSheet) this.activateSheet(idx);
                if (p > 0) pdf.addPage([A1_HEIGHT_MM, A1_WIDTH_MM], 'landscape');
                await this.drawPlanPage(pdf, {
                    widthMM: A1_WIDTH_MM,
                    heightMM: A1_HEIGHT_MM,
                    logoPNG,
                    monochrome,
                    sheetName: this.sheets[idx].name,
                    pageNo: p + 1,
                    pageCount: indices.length,
                    multiPage
                });
            }
        } catch (err) {
            console.error('Diagramm-Rendering fehlgeschlagen:', err);
            alert('Das Diagramm konnte nicht gerendert werden: ' + err.message);
            return;
        } finally {
            if (this.activeSheet !== originalSheet) this.activateSheet(originalSheet);
        }
        
        pdf.save(`${this.projectName.replace(/\s+/g, '_')}_A1.pdf`);
    },

    async drawPlanPage(pdf, opts) {
        const A1_WIDTH_MM = opts.widthMM;
        const A1_HEIGHT_MM = opts.heightMM;
        const MARGIN = 25;
        const COL_WIDTH = 150;
        const ROW_HEIGHT = 28;
        const ROWS = 4;
        const logoPNG = opts.logoPNG;
        
        const frameX = MARGIN;
        const frameY = MARGIN;
        const frameW = A1_WIDTH_MM - 2 * MARGIN;
        const frameH = A1_HEIGHT_MM - 2 * MARGIN;
        const colX = frameX + frameW - COL_WIDTH;
        
        pdf.setDrawColor(120);
        pdf.setLineWidth(0.4);
        pdf.rect(frameX, frameY, frameW, frameH);
        pdf.line(colX, frameY, colX, frameY + frameH);
        
        const blockTop = frameY + frameH - ROWS * ROW_HEIGHT;
        for (let i = 0; i <= ROWS; i++) {
            const ly = blockTop + i * ROW_HEIGHT;
            pdf.line(colX, ly, frameX + frameW, ly);
        }
        
        const logoWidth = 100;
        const logoAspect = typeof ICT_LOGO_ASPECT !== 'undefined' ? ICT_LOGO_ASPECT : 327 / 800;
        const logoHeight = logoWidth * logoAspect;
        const logoX = colX + (COL_WIDTH - logoWidth) / 2;
        const logoY = frameY + 14;
        if (logoPNG) {
            pdf.addImage(logoPNG, 'PNG', logoX, logoY, logoWidth, logoHeight);
        } else {
            pdf.setFillColor(62, 13, 129);
            pdf.rect(logoX, logoY, logoHeight, logoHeight, 'F');
            pdf.setTextColor(33, 29, 42);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(58);
            pdf.text('ICT', logoX + logoHeight + 6, logoY + logoHeight - 1);
        }
        
        const now = new Date();
        const printDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
        
        const rowLabels = [
            this.projectName || 'Projektname',
            this.getEventPeriodText() || '-',
            this.eventLocation || '-',
            `${this.projectAuthor || '-'} / ${printDate}`
        ];
        const rowCaptions = ['Name', 'Veranstaltung', 'Veranstaltungsort', 'Ersteller'];
        rowCaptions.forEach((caption, i) => {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(120, 120, 120);
            pdf.text(caption, colX + 5, blockTop + i * ROW_HEIGHT + 7);
            pdf.setFontSize(11);
            pdf.setTextColor(20, 20, 20);
            pdf.text(rowLabels[i], colX + 5, blockTop + i * ROW_HEIGHT + 17);
        });
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(24);
        pdf.setTextColor(0);
        pdf.text(this.projectName || 'Projektname', frameX + 18, frameY + 20);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        pdf.text(this.projectNumber ? `Projekt-Nr. ${this.projectNumber}` : '', frameX + 18, frameY + 32);
        
        if (opts.multiPage) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            pdf.setTextColor(60, 60, 60);
            pdf.text(`${opts.sheetName}  ·  Blatt ${opts.pageNo} / ${opts.pageCount}`, colX - 12, frameY + 20, { align: 'right' });
        }
        
        const bounds = this.getBounds();
        const pad = 40;
        const viewX = bounds.minX - pad;
        const viewY = bounds.minY - pad;
        const diagramWidth = Math.max(bounds.maxX - bounds.minX + 2 * pad, 200);
        const diagramHeight = Math.max(bounds.maxY - bounds.minY + 2 * pad, 200);

        const drawX = frameX + 12;
        const drawY = frameY + 40;
        const availableWidth = colX - drawX - 12;
        const availableHeight = frameY + frameH - drawY - 12;

        const fit = Math.min(availableWidth / diagramWidth, availableHeight / diagramHeight);
        const imgW = diagramWidth * fit;
        const imgH = diagramHeight * fit;
        const imgX = drawX + (availableWidth - imgW) / 2;
        const imgY = drawY + (availableHeight - imgH) / 2;

        const png = await this.renderDiagramPNG({
            x: viewX, y: viewY, width: diagramWidth, height: diagramHeight
        }, Math.round(imgW * 200 / 25.4), { monochrome: opts.monochrome });
        pdf.addImage(png, 'PNG', imgX, imgY, imgW, imgH, undefined, 'FAST');
    },

    exportListsPDF() {
        const { jsPDF } = window.jspdf;
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const pageWidth = 210;
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text(this.projectName, margin, 20);
        
        if (this.projectNumber) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            pdf.text(`Projekt-Nr.: ${this.projectNumber}`, margin, 28);
        }
        
        pdf.setFontSize(10);
        pdf.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, pageWidth - margin, 20, { align: 'right' });
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('Geräteliste', margin, 45);
        
        const deviceCounts = {};
        this.devices.forEach(device => {
            const article = device.article || (device.placeholder ? 'Platzhalter' : '-');
            const key = `${device.name}|||${article}`;
            if (!deviceCounts[key]) {
                deviceCounts[key] = { name: device.placeholder ? `${device.name} (Platzhalter)` : device.name, article, count: 0 };
            }
            deviceCounts[key].count++;
        });
        
        const deviceList = Object.values(deviceCounts).sort((a, b) => a.name.localeCompare(b.name));
        
        let y = 55;
        const colWidths = [20, contentWidth - 60, 40];
        const rowHeight = 8;
        
        pdf.setFillColor(77, 73, 188);
        pdf.rect(margin, y - 5, contentWidth, rowHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Anzahl', margin + 2, y);
        pdf.text('Gerätename', margin + colWidths[0] + 2, y);
        pdf.text('Artikelnummer', margin + colWidths[0] + colWidths[1] + 2, y);
        
        y += rowHeight;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        deviceList.forEach((item, idx) => {
            if (y > 270) {
                pdf.addPage();
                y = 20;
            }
            
            if (idx % 2 === 0) {
                pdf.setFillColor(245, 245, 245);
                pdf.rect(margin, y - 5, contentWidth, rowHeight, 'F');
            }
            
            pdf.text(String(item.count), margin + 2, y);
            pdf.text(item.name.substring(0, 50), margin + colWidths[0] + 2, y);
            pdf.text(item.article.substring(0, 25), margin + colWidths[0] + colWidths[1] + 2, y);
            y += rowHeight;
        });
        
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, y, margin + contentWidth, y);
        y += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Gesamt: ${this.devices.length} Geräte`, margin + 2, y);
        
        pdf.addPage();
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text(this.projectName, margin, 20);
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('Kabelliste', margin, 45);
        
        const cableCounts = {};
        this.connections.forEach(conn => {
            if (conn.cableType || conn.length) {
                const cableType = conn.cableType || 'Unbekannt';
                const length = conn.length || '?';
                const key = `${cableType}|||${length}`;
                if (!cableCounts[key]) {
                    cableCounts[key] = { type: cableType, length: length, count: 0 };
                }
                cableCounts[key].count++;
            }
        });
        
        const cableList = Object.values(cableCounts).sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return parseFloat(a.length) - parseFloat(b.length);
        });
        
        y = 55;
        const cableColWidths = [20, contentWidth - 80, 40, 20];
        
        pdf.setFillColor(77, 73, 188);
        pdf.rect(margin, y - 5, contentWidth, rowHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Anz.', margin + 2, y);
        pdf.text('Kabeltyp', margin + cableColWidths[0] + 2, y);
        pdf.text('Länge (m)', margin + cableColWidths[0] + cableColWidths[1] + 2, y);
        
        y += rowHeight;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        if (cableList.length === 0) {
            pdf.setFont('helvetica', 'italic');
            pdf.text('Keine Kabelinformationen vorhanden.', margin + 2, y);
            pdf.text('Bitte Verbindungen auswählen und Kabeltyp/Länge eingeben.', margin + 2, y + 6);
        } else {
            let totalLength = 0;
            cableList.forEach((item, idx) => {
                if (y > 270) {
                    pdf.addPage();
                    y = 20;
                }
                
                if (idx % 2 === 0) {
                    pdf.setFillColor(245, 245, 245);
                    pdf.rect(margin, y - 5, contentWidth, rowHeight, 'F');
                }
                
                pdf.text(String(item.count), margin + 2, y);
                pdf.text(item.type, margin + cableColWidths[0] + 2, y);
                pdf.text(String(item.length), margin + cableColWidths[0] + cableColWidths[1] + 2, y);
                
                const len = parseFloat(item.length);
                if (!isNaN(len)) {
                    totalLength += len * item.count;
                }
                
                y += rowHeight;
            });
            
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, y, margin + contentWidth, y);
            y += 5;
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Gesamt: ${this.connections.filter(c => c.cableType || c.length).length} Kabel`, margin + 2, y);
            if (totalLength > 0) {
                pdf.text(`Gesamtlänge: ${totalLength.toFixed(1)} m`, margin + 80, y);
            }
        }
        
        pdf.save(`${this.projectName.replace(/\s+/g, '_')}_Listen.pdf`);
    }
};
