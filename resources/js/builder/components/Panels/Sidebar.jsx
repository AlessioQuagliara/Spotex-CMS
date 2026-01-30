import React from 'react';
import {
    LayoutTemplate,
    Type,
    SquareArrowRight,
    Image,
    Heading,
    Square,
} from 'lucide-react';
import { useBuilderStore } from '../../store/builderStore';

/**
 * Sidebar: Libreria di componenti per aggiungere elementi al canvas
 */
const Sidebar = () => {
    const { addElement, elements } = useBuilderStore();

    const components = [
        {
            id: 'container',
            name: 'Container',
            description: 'Contenitore flessibile',
            icon: Square,
            type: 'container',
        },
        {
            id: 'heading',
            name: 'Heading',
            description: 'Titolo grande',
            icon: Heading,
            type: 'heading',
        },
        {
            id: 'text',
            name: 'Testo',
            description: 'Paragrafo di testo',
            icon: Type,
            type: 'text',
        },
        {
            id: 'button',
            name: 'Button',
            description: 'Bottone interattivo',
            icon: SquareArrowRight,
            type: 'button',
        },
        {
            id: 'image',
            name: 'Immagine',
            description: 'Elemento immagine',
            icon: Image,
            type: 'image',
        },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
            {/* Intestazione */}
            <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <LayoutTemplate size={20} />
                    Componenti
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    Trascina o clicca per aggiungere
                </p>
            </div>

            {/* Griglia componenti */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                    {components.map(component => {
                        const Icon = component.icon;
                        return (
                            <button
                                key={component.id}
                                onClick={() => addElement(component.type)}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.effectAllowed = 'copy';
                                    e.dataTransfer.setData(
                                        'application/json',
                                        JSON.stringify({
                                            type: component.type,
                                            componentId: component.id,
                                        })
                                    );
                                }}
                                className="w-full p-3 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all cursor-grab active:cursor-grabbing group"
                            >
                                <div className="flex items-start gap-3">
                                    <Icon
                                        size={20}
                                        className="text-blue-600 flex-shrink-0 mt-0.5"
                                    />
                                    <div className="text-left flex-1">
                                        <div className="font-medium text-gray-900 text-sm">
                                            {component.name}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            {component.description}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer con statistiche */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-600">
                    <p className="font-medium">
                        Elementi: <span className="text-blue-600">{elements.length}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
