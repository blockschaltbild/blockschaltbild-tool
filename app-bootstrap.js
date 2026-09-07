Object.assign(
    BlockDiagramEditor.prototype,
    LibraryMixin,
    CanvasMixin,
    ConnectionsMixin,
    ModalsMixin,
    ExportMixin,
    HistoryMixin,
    ShortcutsMixin,
    EventsMixin,
    BugReportMixin
);

document.addEventListener('DOMContentLoaded', () => {
    window.editor = new BlockDiagramEditor();
    
    const versionEl = document.getElementById('appVersion');
    if (versionEl && typeof APP_VERSION !== 'undefined') versionEl.textContent = APP_VERSION;
    
    document.querySelector('.canvas-wrapper').addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    
    document.querySelector('.canvas-wrapper').addEventListener('drop', (e) => {
        e.preventDefault();
        
        let templateIdx = '';
        if (e.dataTransfer) {
            templateIdx = e.dataTransfer.getData('template-index') || e.dataTransfer.getData('text/plain') || '';
        }
        if (templateIdx === '' && window.editor.dragTemplateIndex !== null && window.editor.dragTemplateIndex !== undefined) {
            templateIdx = String(window.editor.dragTemplateIndex);
        }
        if (templateIdx === '') return;
        
        const template = window.editor.deviceTemplates[parseInt(templateIdx)];
        if (!template) return;
        
        const rect = window.editor.svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / window.editor.zoom;
        const y = (e.clientY - rect.top) / window.editor.zoom;
        window.editor.addDeviceToCanvas(template, x, y);
        window.editor.dragTemplateIndex = null;
    });
});
