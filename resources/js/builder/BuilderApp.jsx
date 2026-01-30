import React, { useEffect } from 'react';
import { useBuilderStore } from './store/builderStore';
import { validateElements } from './utils/serializer';
import TopBar from './components/TopBar';
import Sidebar from './components/Panels/Sidebar';
import Canvas from './components/Canvas/Canvas';
import CanvasFrame from './components/Canvas/CanvasFrame';
import ComponentRenderer from './components/Editor/ComponentRenderer';
import SettingsPanel from './components/Panels/SettingsPanel';
import './styles/builder.css';

export default function BuilderApp({
    pageId,
    pageTitle,
    pageSlug,
    initialElements = [],
    initialTraitValues = {},
    initialCustomClasses = {}
}) {
    const { initialize } = useBuilderStore();

    // Carica dati iniziali
    useEffect(() => {
        const validatedElements = validateElements(initialElements);
        initialize(validatedElements, initialTraitValues, initialCustomClasses);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Bar con Save, Undo/Redo, Zoom */}
            <TopBar pageTitle={pageTitle} pageId={pageId} pageSlug={pageSlug} />

            {/* Main Layout: Sidebar | Canvas | Settings */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Componenti & Layers */}
                <Sidebar />

                {/* Centro - Canvas */}
                <Canvas />

                {/* Right Sidebar - Properties & Traits */}
                <SettingsPanel />
            </div>

            {/* Status Bar */}
            <StatusBar />
        </div>
    );
}

function StatusBar() {
    const elements = useBuilderStore(state => state.elements);
    const zoom = useBuilderStore(state => state.zoom);
    const viewMode = useBuilderStore(state => state.viewMode);

    const viewModes = {
        desktop: 'Desktop (1920x2000)',
        tablet: 'Tablet (768x1024)',
        mobile: 'Mobile (375x667)'
    };

    return (
        <footer className="h-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 text-xs">
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                <span>Elementi: <span className="font-medium">{elements.length}</span></span>
            </div>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                <span>Vista: <span className="font-medium">{viewModes[viewMode]}</span></span>
                <span>Zoom: <span className="font-medium">{zoom}%</span></span>
            </div>
        </footer>
    );
}
