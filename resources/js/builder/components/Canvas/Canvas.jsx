import React from 'react';
import { useBuilderStore } from '../../store/builderStore';
import CanvasFrame from './CanvasFrame';
import ComponentRenderer from '../Editor/ComponentRenderer';

export default function Canvas() {
    const { elements, zoom, selectedId, deselectElement } = useBuilderStore();

    // ✅ Click on empty canvas to deselect
    const handleCanvasClick = () => {
        deselectElement();
    };

    return (
        <main className="flex-1 bg-gray-100 overflow-auto p-4">
            <div className="flex justify-center items-start min-h-full">
                <div 
                    style={{
                        width: '1920px',
                        height: '2000px',
                        background: 'white',
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        position: 'relative',
                    }}
                    className="rounded-lg"
                    onClick={handleCanvasClick}
                >
                    <CanvasFrame>
                        <div className="w-full h-full p-4 relative">
                            {elements.length === 0 ? (
                                <div className="text-gray-400 text-center py-20">
                                    Nessun elemento. Aggiungi uno dalla sidebar →
                                </div>
                            ) : (
                                <div className="relative w-full h-full">
                                    {elements.map(element => (
                                        <ComponentRenderer
                                            key={element.id}
                                            element={element}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </CanvasFrame>
                </div>
            </div>
        </main>
    );
}
