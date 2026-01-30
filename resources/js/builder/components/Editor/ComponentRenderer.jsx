import React, { useState } from 'react';
import { useBuilderStore } from '../../store/builderStore';

/**
 * ComponentRenderer: Renderizza ricorsivamente gli elementi del canvas
 * Gestisce selezione, hover, e delega il rendering ai componenti specifici
 */
const ComponentRenderer = ({ element, level = 0 }) => {
    const {
        selectedId,
        editingElementId,
        selectElement,
        startEditingElement,
        stopEditingElement,
        updateElementContent,
        deleteElement,
    } = useBuilderStore();

    const [isHovering, setIsHovering] = useState(false);

    const isSelected = selectedId === element.id;
    const isEditing = editingElementId === element.id;

    // ✅ Click per selezionare
    const handleClick = (e) => {
        e.stopPropagation();
        selectElement(element.id);
    };

    // ✅ Doppio click per editare testo
    const handleDoubleClick = (e) => {
        e.stopPropagation();
        if (element.type === 'text' || element.type === 'button') {
            startEditingElement(element.id);
        }
    };

    // ✅ Classe dinamica per visual feedback
    const wrapperClassName = `
        relative group
        ${isSelected ? 'selected-ring' : ''}
        ${isHovering && !isSelected ? 'hover-ring' : ''}
        ${level > 0 ? 'p-2' : ''}
        transition-all duration-200
    `;

    // ✅ Rendering condizionale per tipo di elemento
    let content;

    switch (element.type) {
        case 'container':
            content = (
                <div
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={handleClick}
                    className={`${wrapperClassName} min-h-[100px] bg-gray-50 border-2 border-dashed border-gray-300`}
                >
                    {/* Figli ricorsivi */}
                    <div className="space-y-2">
                        {element.children?.map(child => (
                            <ComponentRenderer
                                key={child.id}
                                element={child}
                                level={level + 1}
                            />
                        ))}
                    </div>

                    {/* Badge per selezione */}
                    {isSelected && (
                        <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Container
                        </div>
                    )}
                </div>
            );
            break;

        case 'text':
            content = isEditing ? (
                <textarea
                    autoFocus
                    value={element.content?.text || ''}
                    onChange={(e) => updateElementContent(element.id, { text: e.target.value })}
                    onBlur={stopEditingElement}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            stopEditingElement();
                        }
                    }}
                    className="w-full p-2 border border-blue-500 rounded focus:outline-none resize-none"
                    rows={3}
                />
            ) : (
                <p
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={handleClick}
                    onDoubleClick={handleDoubleClick}
                    className={`${wrapperClassName} p-2 text-gray-800 cursor-text min-h-[40px]`}
                    style={element.styles?.custom || {}}
                >
                    {element.content?.text || 'Doppio click per modificare...'}
                </p>
            );
            break;

        case 'button':
            content = isEditing ? (
                <input
                    autoFocus
                    type="text"
                    value={element.content?.text || ''}
                    onChange={(e) => updateElementContent(element.id, { text: e.target.value })}
                    onBlur={stopEditingElement}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            stopEditingElement();
                        }
                    }}
                    className="px-4 py-2 border border-blue-500 rounded focus:outline-none"
                />
            ) : (
                <button
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={handleClick}
                    onDoubleClick={handleDoubleClick}
                    className={`${wrapperClassName} px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors`}
                    style={element.styles?.custom || {}}
                >
                    {element.content?.text || 'Click me'}
                </button>
            );
            break;

        case 'image':
            content = (
                <img
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={handleClick}
                    src={element.content?.src || 'https://via.placeholder.com/200x150?text=Image'}
                    alt="Image element"
                    className={`${wrapperClassName} max-w-full h-auto rounded`}
                    style={{
                        width: element.styles?.width || 'auto',
                        height: element.styles?.height || 'auto',
                        ...element.styles?.custom,
                    }}
                />
            );
            break;

        case 'heading':
            content = isEditing ? (
                <input
                    autoFocus
                    type="text"
                    value={element.content?.text || ''}
                    onChange={(e) => updateElementContent(element.id, { text: e.target.value })}
                    onBlur={stopEditingElement}
                    className="w-full p-2 border border-blue-500 rounded focus:outline-none text-2xl font-bold"
                />
            ) : (
                <h2
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={handleClick}
                    onDoubleClick={handleDoubleClick}
                    className={`${wrapperClassName} text-2xl font-bold text-gray-900 cursor-text`}
                    style={element.styles?.custom || {}}
                >
                    {element.content?.text || 'Heading...'}
                </h2>
            );
            break;

        case 'html-block':
            content = (
                <div
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={handleClick}
                    className={`${wrapperClassName} p-2 bg-yellow-50 border border-yellow-300 rounded text-yellow-700 text-sm`}
                    style={element.styles?.custom || {}}
                    dangerouslySetInnerHTML={{ __html: element.content || '<p>Empty HTML Block</p>' }}
                />
            );
            break;

        default:
            content = (
                <div
                    onClick={handleClick}
                    className={`${wrapperClassName} p-2 bg-red-50 border border-red-300 rounded text-red-600 text-sm`}
                >
                    Unknown type: <code>{element.type}</code>
                </div>
            );
    }

    // ✅ Wrapper con gestione delete via keyboard
    const handleKeyDown = (e) => {
        if (isSelected && e.key === 'Delete') {
            e.preventDefault();
            deleteElement(element.id);
        }
    };

    React.useEffect(() => {
        if (isSelected) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isSelected]);

    return (
        <div
            className="relative"
            style={{
                position: level === 0 ? 'absolute' : 'relative',
                left: level === 0 ? `${element.x || 0}px` : undefined,
                top: level === 0 ? `${element.y || 0}px` : undefined,
                width: element.width ? `${element.width}px` : undefined,
                height: element.height ? `${element.height}px` : undefined,
            }}
        >
            {content}
        </div>
    );
};

export default ComponentRenderer;
