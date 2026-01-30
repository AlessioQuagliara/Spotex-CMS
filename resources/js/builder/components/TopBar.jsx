import React from 'react';
import { useBuilderStore } from '../store/builderStore';
import { generateHTMLFromElements, generateCSS } from '../utils/serializer';
import { Save, RotateCcw, RotateCw, ZoomIn, ZoomOut, Monitor, Tablet, Smartphone } from 'lucide-react';

export default function TopBar({ pageTitle, pageId, pageSlug }) {
    const { 
        elements, 
        traitValues, 
        customClasses,
        zoom, 
        setZoom, 
        viewMode, 
        setViewMode,
        undo, 
        redo,
        historyIndex,
        history,
        isSaving,
        setIsSaving
    } = useBuilderStore();

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < (history.length - 1);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // ✅ Genera HTML pulito (NO editor classes)
            const htmlContent = generateHTMLFromElements(elements);
            
            // ✅ Genera CSS dalle classi custom
            const cssContent = generateCSS(customClasses);

            // ✅ Payload completo per il backend
            const payload = {
                elements,           // JSON per riaprire il builder
                html: htmlContent,   // HTML pulito per il frontend pubblico
                css: cssContent,     // CSS custom
            };
            
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

            const response = await fetch(`/api/pages/${pageSlug}/builder/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.success) {
                alert('✅ Pagina salvata con successo!');
            } else {
                throw new Error(data.message || 'Errore nel salvataggio');
            }
        } catch (error) {
            console.error('Errore:', error);
            alert(`❌ Errore: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
                    <div>
                        <div className="text-sm font-semibold">{pageTitle}</div>
                        <div className="text-xs text-gray-500">{pageSlug}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-6 border-l border-gray-200 dark:border-gray-700 pl-6">
                    <button 
                        onClick={undo}
                        disabled={!canUndo}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                        title="Undo"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button 
                        onClick={redo}
                        disabled={!canRedo}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                        title="Redo"
                    >
                        <RotateCw size={18} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* View Mode Controls */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button 
                        onClick={() => setViewMode('desktop')}
                        className={`px-3 py-1 rounded flex items-center gap-1 ${viewMode === 'desktop' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
                    >
                        <Monitor size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('tablet')}
                        className={`px-3 py-1 rounded flex items-center gap-1 ${viewMode === 'tablet' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
                    >
                        <Tablet size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('mobile')}
                        className={`px-3 py-1 rounded flex items-center gap-1 ${viewMode === 'mobile' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
                    >
                        <Smartphone size={16} />
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setZoom(zoom - 10)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                    <button 
                        onClick={() => setZoom(zoom + 10)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={18} />
                    {isSaving ? 'Salvataggio...' : 'Salva'}
                </button>
            </div>
        </header>
    );
}
