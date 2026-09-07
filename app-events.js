const EventsMixin = {
    initEventListeners() {
        document.getElementById('projectName').addEventListener('input', (e) => {
            this.projectName = e.target.value || 'Neues Projekt';
            this.updateProjectDisplay();
        });
        document.getElementById('projectNumber').addEventListener('input', (e) => {
            this.projectNumber = e.target.value;
            this.updateProjectDisplay();
        });
        
        document.getElementById('btnProjectSettings').addEventListener('click', () => this.showProjectModal());
        document.getElementById('btnCancelProject').addEventListener('click', () => this.hideProjectModal());
        document.getElementById('projectForm').addEventListener('submit', (e) => this.saveProjectData(e));
        
        document.getElementById('btnNew').addEventListener('click', () => this.newDiagram());
        document.getElementById('btnUndo').addEventListener('click', () => this.undo());
        document.getElementById('btnRedo').addEventListener('click', () => this.redo());
        document.getElementById('btnSave').addEventListener('click', () => this.saveDiagram());
        document.getElementById('btnLoad').addEventListener('click', () => document.getElementById('fileLoad').click());
        document.getElementById('fileLoad').addEventListener('change', (e) => this.loadDiagram(e));
        document.getElementById('chkAutosave').addEventListener('change', (e) => {
            this.setAutosave(e.target.checked, document.getElementById('autosaveMinutes').value);
        });
        document.getElementById('autosaveMinutes').addEventListener('change', (e) => {
            let m = parseInt(e.target.value);
            if (isNaN(m) || m < 1) m = 1;
            if (m > 120) m = 120;
            e.target.value = m;
            this.setAutosave(document.getElementById('chkAutosave').checked, m);
        });
        document.getElementById('btnRestoreAutosave').addEventListener('click', () => this.restoreAutosave());
        
        document.getElementById('btnImportDevices').addEventListener('click', () => this.showImportChoiceModal());
        document.getElementById('btnImportChoiceFile').addEventListener('click', () => {
            this.hideImportChoiceModal();
            document.getElementById('fileImportDevices').click();
        });
        document.getElementById('btnImportChoiceUrl').addEventListener('click', () => this.showImportUrlForm());
        document.getElementById('importUrlForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.importWebsiteDevice(document.getElementById('importUrlInput').value.trim());
        });
        document.getElementById('btnCancelImportChoice').addEventListener('click', () => this.hideImportChoiceModal());
        document.getElementById('btnCloseImportChoice').addEventListener('click', () => this.hideImportChoiceModal());
        document.getElementById('fileImportDevices').addEventListener('change', (e) => this.importDevices(e));
        document.getElementById('btnAddDevice').addEventListener('click', () => this.showDeviceModal());
        document.getElementById('btnAddPlaceholder').addEventListener('click', () => this.addPlaceholderDevice());
        document.getElementById('btnAddTextbox').addEventListener('click', () => this.addTextbox());
        document.getElementById('btnExcelTemplate').addEventListener('click', () => this.downloadExcelTemplate());
        document.getElementById('deviceGroup').addEventListener('change', (e) => {
            document.getElementById('deviceColor').value = this.groupColor(e.target.value);
        });
        document.getElementById('pdfDeviceGroup').addEventListener('change', (e) => {
            document.getElementById('pdfDeviceColor').value = this.groupColor(e.target.value);
        });
        document.getElementById('btnManageGroups').addEventListener('click', () => this.showGroupModal());
        document.getElementById('btnManageDevices').addEventListener('click', () => this.showDeviceManageModal());
        document.getElementById('btnManageCables').addEventListener('click', () => this.showCableModal());
        document.getElementById('btnExportLibrary').addEventListener('click', () => this.exportLibrary());
        document.getElementById('btnImportLibrary').addEventListener('click', () => document.getElementById('fileImportLibrary').click());
        document.getElementById('fileImportLibrary').addEventListener('change', (e) => this.importLibrary(e));
        document.getElementById('btnResetLibrary').addEventListener('click', () => {
            if (confirm('Die zentrale Gerätebibliothek wirklich auf die Standardgeräte zurücksetzen? Eigene Geräte, Gruppen und Kabeltypen gehen dabei verloren.')) {
                this.resetLibrary();
                this.renderManageDevicesList();
                alert('Bibliothek wurde zurückgesetzt.');
            }
        });
        
        document.getElementById('btnAutoConnect').addEventListener('click', () => this.autoConnect());
        document.getElementById('btnCancelAutoConnect').addEventListener('click', () => this.hideAutoConnectModal());
        document.getElementById('btnStartAutoConnect').addEventListener('click', () => this.startAutoConnectFromModal());
        ['autoConnectFrom', 'autoConnectTo', 'chkAutoConnectGeneric', 'chkAutoConnectFiber'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateAutoConnectPreview());
        });
        document.getElementById('btnCheckSignals').addEventListener('click', () => this.validateConnections());
        document.getElementById('btnCloseSignalCheck').addEventListener('click', () => this.hideSignalCheckModal());
        document.getElementById('chkAutoConverter').addEventListener('change', (e) => {
            this.autoConverter = e.target.checked;
        });
        document.getElementById('btnClearConnections').addEventListener('click', () => this.clearConnections());
        document.getElementById('btnCheckLengths').addEventListener('click', () => this.checkConnectionLengths());
        document.getElementById('btnCloseMissingLengths').addEventListener('click', () => this.hideMissingLengthsModal());
        document.getElementById('btnSaveMissingLengths').addEventListener('click', () => this.saveMissingLengths());
        
        document.getElementById('btnExportPDF').addEventListener('click', () => this.showPdfExportModal());
        document.getElementById('btnCancelPdfExport').addEventListener('click', () => this.hidePdfExportModal());
        document.getElementById('btnStartPdfExport').addEventListener('click', () => this.startPdfExportFromModal());
        document.getElementById('btnPdfSheetsAll').addEventListener('click', () => this.setPdfExportSheetsChecked(true));
        document.getElementById('btnPdfSheetsNone').addEventListener('click', () => this.setPdfExportSheetsChecked(false));
        document.getElementById('btnExportLists').addEventListener('click', () => this.showPdfExportModal('lists'));
        document.getElementById('btnExportDevices').addEventListener('click', () => this.showExportModal());
        document.getElementById('btnCloseExport').addEventListener('click', () => this.hideExportModal());
        document.getElementById('btnExportAllDevices').addEventListener('click', () => {
            this.exportDevicesExcel(this.deviceTemplates, `${this.projectName}_Geraete`);
        });
        document.getElementById('btnExportGroupSheets').addEventListener('click', () => this.exportDevicesByGroups());
        
        document.getElementById('chkGridVisible').addEventListener('change', (e) => {
            this.gridVisible = e.target.checked;
            this.updateGrid();
        });
        document.getElementById('chkSnapGrid').addEventListener('change', (e) => {
            this.snapToGrid = e.target.checked;
        });
        document.getElementById('selLineStyle').addEventListener('change', (e) => {
            this.lineStyle = e.target.value;
            this.channels = null;
            this.updateConnections();
        });
        document.getElementById('gridSizeInput').addEventListener('change', (e) => {
            const size = parseInt(e.target.value);
            if (!size || size < 5) {
                e.target.value = this.gridSize;
                return;
            }
            this.gridSize = size;
            this.updateGrid();
        });
        document.getElementById('btnPrint').addEventListener('click', () => window.print());
        
        document.getElementById('btnZoomIn').addEventListener('click', () => this.setZoom(this.zoom + 0.1));
        document.getElementById('btnZoomOut').addEventListener('click', () => this.setZoom(this.zoom - 0.1));
        document.getElementById('btnFitView').addEventListener('click', () => this.fitView());
        
        document.getElementById('groupFilter').addEventListener('change', () => this.renderDeviceLibrary());
        const deviceSearch = document.getElementById('deviceSearch');
        const clearDeviceSearch = document.getElementById('btnClearDeviceSearch');
        const updateClearButton = () => { clearDeviceSearch.hidden = deviceSearch.value === ''; };
        deviceSearch.addEventListener('input', () => {
            updateClearButton();
            this.renderDeviceLibrary();
        });
        deviceSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && deviceSearch.value !== '') {
                e.stopPropagation();
                clearDeviceSearch.click();
            }
        });
        clearDeviceSearch.addEventListener('click', () => {
            deviceSearch.value = '';
            updateClearButton();
            this.renderDeviceLibrary();
            deviceSearch.focus();
        });
        updateClearButton();
        
        document.getElementById('deviceForm').addEventListener('submit', (e) => this.createDeviceFromForm(e));
        document.getElementById('btnCancelDevice').addEventListener('click', () => this.hideDeviceModal());
        document.getElementById('btnDeviceNext').addEventListener('click', () => this.deviceModalNext());
        document.getElementById('btnDeviceBack').addEventListener('click', () => this.deviceModalBack());
        
        document.getElementById('btnToggleSidebar').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('btnAddSheet').addEventListener('click', () => this.addSheet());
        this.initSidebarResize();
        
        document.getElementById('btnAddGroup').addEventListener('click', () => this.addGroup());
        document.getElementById('btnCloseGroups').addEventListener('click', () => this.hideGroupModal());
        
        document.getElementById('btnCloseManageDevices').addEventListener('click', () => this.hideDeviceManageModal());
        document.getElementById('btnManageAddDevice').addEventListener('click', () => {
            this.hideDeviceManageModal();
            this.showDeviceModal();
        });
        document.getElementById('manageDeviceSearch').addEventListener('input', () => this.renderManageDevicesList());
        document.getElementById('groupSearch').addEventListener('input', () => this.renderGroupsList());
        document.getElementById('cableSearch').addEventListener('input', () => this.renderCablesList());
        document.getElementById('newGroupName').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addGroup();
            }
        });
        
        document.getElementById('btnAddCable').addEventListener('click', () => this.addCable());
        document.getElementById('btnCloseCables').addEventListener('click', () => this.hideCableModal());
        document.getElementById('newCableName').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addCable();
            }
        });
        
        document.getElementById('pdfDeviceForm').addEventListener('submit', (e) => this.createDeviceFromPdfForm(e));
        document.getElementById('btnCancelPdfImport').addEventListener('click', () => this.hidePdfImportModal());
        document.getElementById('btnPdfAddInput').addEventListener('click', () => this.addIOField('input', 'pdfInputsList'));
        document.getElementById('btnPdfAddOutput').addEventListener('click', () => this.addIOField('output', 'pdfOutputsList'));
        
        this.svg.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.svg.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.svg.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.svg.addEventListener('click', (e) => this.onClick(e));
        
        this.svg.addEventListener('contextmenu', (e) => {
            const deviceBlock = e.target.closest('.device-block');
            if (!deviceBlock) return;
            e.preventDefault();
            const device = this.devices.find(d => d.id === deviceBlock.dataset.deviceId);
            if (!device) return;
            this.draggedDevice = null;
            this.connectionStart = null;
            this.showDeviceContextMenu(device, e.clientX, e.clientY);
        });
        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('#deviceContextMenu')) this.hideDeviceContextMenu();
        });
        window.addEventListener('resize', () => this.hideDeviceContextMenu());
        document.querySelector('.canvas-wrapper')?.addEventListener('scroll', () => this.hideDeviceContextMenu());
        
        document.addEventListener('keydown', (e) => {
            const tag = (e.target.tagName || '').toLowerCase();
            const inField = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
            if (!inField && this.handleShortcutKey(e)) return;
            if (e.key === 'Delete' && this.selectedElement) {
                this.deleteSelected();
            }
            if (e.key === 'Escape') {
                this.hideDeviceContextMenu();
                this.cancelConnection();
                this.hideDeviceModal();
                this.hideGroupModal();
                this.hidePdfImportModal();
                this.hideDeviceManageModal();
                this.hideCableModal();
                this.hideProjectModal();
                this.hideShortcutsModal();
                this.hidePdfExportModal();
                this.hideAutoConnectModal();
                this.hideMissingLengthsModal();
            }
        });
        
        document.getElementById('btnShowShortcuts').addEventListener('click', () => this.showShortcutsModal());
        document.getElementById('btnCloseShortcuts').addEventListener('click', () => this.hideShortcutsModal());
        this.initShortcutHints();
    }
};
