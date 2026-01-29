<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $page->title }} - Page Builder</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/lucide@latest"></script>
    <style>
        [data-lucide] { width: 24px; height: 24px; }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useRef, useEffect } = React;

        // Icone da lucide (implementazione semplificata)
        const Icons = {
            Type: () => <span>T</span>,
            Square: () => <span>□</span>,
            Circle: () => <span>○</span>,
            Image: () => <span>🖼</span>,
            Trash2: () => <span>🗑</span>,
            Move: () => <span>⇄</span>,
            Layers: () => <span>≡</span>,
            Download: () => <span>⬇</span>,
            MousePointer2: () => <span>↖</span>,
            XCircle: () => <span>✕</span>,
            Maximize: () => <span>⛶</span>,
            Monitor: () => <span>🖥</span>,
            Tablet: () => <span>📱</span>,
            Smartphone: () => <span>📲</span>,
            LayoutTemplate: () => <span>▦</span>,
            Plus: () => <span>+</span>,
        };

        const BLOCK_TEMPLATES = [
            {
                name: 'Hero Section',
                height: 250,
                width: 800,
                html: `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background: linear-gradient(to right, #4f46e5, #ec4899); color:white; padding: 20px; text-align:center; border-radius: 8px;">
                    <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">Titolo Hero</h1>
                    <p style="font-size: 16px; opacity: 0.9;">Sottotitolo accattivante per la tua sezione.</p>
                    <button style="margin-top: 20px; padding: 10px 20px; background: white; color: #4f46e5; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">Azione</button>
                </div>`
            },
            {
                name: 'Pricing Card',
                height: 300,
                width: 250,
                html: `<div style="width:100%; height:100%; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; display:flex; flex-direction:column; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <h3 style="font-size: 18px; color: #374151; font-weight: 600;">Pro Plan</h3>
                    <div style="font-size: 36px; font-weight: bold; color: #111827; margin: 16px 0;">€29<span style="font-size: 14px; color: #6b7280; font-weight: normal;">/mese</span></div>
                    <ul style="flex:1; list-style: none; padding: 0; margin: 0; color: #4b5563; font-size: 14px; line-height: 2;">
                        <li>✓ Utenti illimitati</li>
                        <li>✓ 50GB Spazio</li>
                        <li>✓ Supporto 24/7</li>
                    </ul>
                    <button style="width:100%; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 500; margin-top: auto;">Scegli</button>
                </div>`
            },
            {
                name: 'Feature Row',
                height: 120,
                width: 600,
                html: `<div style="width:100%; height:100%; display:flex; align-items:center; background: #f9fafb; border-radius: 8px; padding: 20px; gap: 20px;">
                    <div style="width: 60px; height: 60px; background: #dbeafe; border-radius: 50%; display:flex; align-items:center; justify-content:center; color: #2563eb; font-weight:bold; font-size: 24px;">★</div>
                    <div>
                        <h4 style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0 0 5px 0;">Caratteristica Top</h4>
                        <p style="font-size: 14px; color: #6b7280; margin: 0;">Descrivi qui il vantaggio principale del tuo prodotto in poche righe.</p>
                    </div>
                </div>`
            }
        ];

        const INITIAL_ELEMENTS = {{ json_encode($builderData) }} || [
            {
                id: '1',
                type: 'text',
                content: 'Ciao! Sono modificabile.',
                x: 40,
                y: 40,
                width: 240,
                height: 60,
                styles: {
                    backgroundColor: 'transparent',
                    color: '#1f2937',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    borderRadius: '0px',
                }
            }
        ];

        function PageBuilder() {
            const [elements, setElements] = useState(INITIAL_ELEMENTS);
            const [selectedId, setSelectedId] = useState(null);
            const [dragInfo, setDragInfo] = useState({ isDragging: false, startX: 0, startY: 0, initialElemX: 0, initialElemY: 0 });
            const [viewMode, setViewMode] = useState('desktop');
            const [activeTab, setActiveTab] = useState('tools');
            const [isSaving, setIsSaving] = useState(false);

            const addElement = (type, template = null) => {
                const id = Date.now().toString();
                const defaultStyles = {
                    backgroundColor: type === 'text' ? 'transparent' : '#e5e7eb',
                    color: '#000000',
                    borderWidth: '0px',
                    borderColor: '#000000',
                };

                let newElement = { id, type, x: 50, y: 50, styles: defaultStyles };

                if (type === 'text') {
                    newElement = { ...newElement, content: 'Doppio click...', width: 200, height: 50, styles: { ...defaultStyles, fontSize: '18px' } };
                } else if (type === 'box') {
                    newElement = { ...newElement, width: 100, height: 100, styles: { ...defaultStyles, backgroundColor: '#60a5fa', borderRadius: '0px' } };
                } else if (type === 'circle') {
                    newElement = { ...newElement, width: 100, height: 100, styles: { ...defaultStyles, backgroundColor: '#f472b6', borderRadius: '50%' } };
                } else if (type === 'image') {
                    newElement = { ...newElement, content: 'https://via.placeholder.com/150', width: 150, height: 150, styles: { ...defaultStyles, objectFit: 'cover' } };
                } else if (type === 'html-block' && template) {
                    newElement = { ...newElement, content: template.html, width: template.width, height: template.height, styles: { ...defaultStyles, backgroundColor: 'transparent' } };
                }

                setElements([...elements, newElement]);
                setSelectedId(id);
            };

            const handleMouseDown = (e, id) => {
                e.stopPropagation();
                setSelectedId(id);
                const element = elements.find(el => el.id === id);
                if (!element) return;
                setDragInfo({ isDragging: true, startX: e.clientX, startY: e.clientY, initialElemX: element.x, initialElemY: element.y });
            };

            const handleMouseMove = (e) => {
                if (!dragInfo.isDragging || !selectedId) return;
                const dx = e.clientX - dragInfo.startX;
                const dy = e.clientY - dragInfo.startY;
                setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x: dragInfo.initialElemX + dx, y: dragInfo.initialElemY + dy } : el));
            };

            const handleMouseUp = () => {
                setDragInfo({ ...dragInfo, isDragging: false });
            };

            const updateElementStyle = (key, value) => {
                setElements(prev => prev.map(el => el.id === selectedId ? { ...el, styles: { ...el.styles, [key]: value } } : el));
            };

            const updateElementProp = (key, value) => {
                setElements(prev => prev.map(el => el.id === selectedId ? { ...el, [key]: value } : el));
            };

            const deleteElement = () => {
                setElements(prev => prev.filter(el => el.id !== selectedId));
                setSelectedId(null);
            };

            const saveBuilder = async () => {
                setIsSaving(true);
                try {
                    const response = await fetch(`/api/pages/{{ $page->id }}/builder/save`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '',
                        },
                        body: JSON.stringify({
                            elements: elements,
                            html: generateHTML(),
                            css: generateCSS(),
                            js: generateJS(),
                        }),
                    });
                    const data = await response.json();
                    if (data.success) {
                        alert('Pagina salvata con successo!');
                    }
                } catch (error) {
                    console.error('Errore:', error);
                    alert('Errore nel salvataggio');
                } finally {
                    setIsSaving(false);
                }
            };

            const generateHTML = () => {
                return elements.map(el => {
                    if (el.type === 'html-block') return el.content;
                    if (el.type === 'text') return `<div style="position:absolute; left:${el.x}px; top:${el.y}px; width:${el.width}px;">${el.content}</div>`;
                    if (el.type === 'image') return `<img src="${el.content}" style="position:absolute; left:${el.x}px; top:${el.y}px; width:${el.width}px; height:${el.height}px;">`;
                    return '';
                }).join('\n');
            };

            const generateCSS = () => {
                return `
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; }
                    .builder-canvas { position: relative; width: 100%; min-height: 100vh; }
                `;
            };

            const generateJS = () => {
                return '// Custom JavaScript will be added here';
            };

            const getViewDimensions = () => {
                switch(viewMode) {
                    case 'mobile': return { width: '375px', height: '667px', label: 'iPhone SE' };
                    case 'tablet': return { width: '768px', height: '1024px', label: 'iPad Mini' };
                    default: return { width: '100%', height: '100%', label: 'Desktop' };
                }
            };

            const viewDims = getViewDimensions();
            const selectedElement = elements.find(el => el.id === selectedId);

            const renderElement = (el) => {
                const isSelected = selectedId === el.id;
                const commonStyle = {
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    cursor: 'grab',
                    boxShadow: isSelected ? '0 0 0 2px #2563eb, 0 0 0 6px rgba(37, 99, 235, 0.1)' : 'none',
                    zIndex: isSelected ? 100 : 1,
                    ...el.styles
                };

                if (el.type === 'html-block') {
                    return <div key={el.id} style={{...commonStyle, overflow: 'hidden'}} onMouseDown={(e) => handleMouseDown(e, el.id)}><div dangerouslySetInnerHTML={{ __html: el.content }} style={{width: '100%', height: '100%'}} /></div>;
                }
                if (el.type === 'text') {
                    return <div key={el.id} style={{...commonStyle, display: 'flex', alignItems: 'center'}} onMouseDown={(e) => handleMouseDown(e, el.id)}>{el.content}</div>;
                }
                if (el.type === 'image') {
                    return <div key={el.id} style={{...commonStyle, padding: 0, overflow: 'hidden', backgroundColor: 'transparent'}} onMouseDown={(e) => handleMouseDown(e, el.id)}><img src={el.content} alt="user-content" style={{width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none'}} onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Errore+Img'} /></div>;
                }
                return <div key={el.id} style={commonStyle} onMouseDown={(e) => handleMouseDown(e, el.id)} />;
            };

            return (
                <div className="flex flex-col h-screen bg-gray-100 text-slate-800 font-sans overflow-hidden" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                                <Icons.Move />
                            </div>
                            <h1 className="font-bold text-lg text-slate-700">{{ $page->title }} - Builder</h1>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={saveBuilder} disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                                {isSaving ? 'Salvataggio...' : '💾 Salva'}
                            </button>
                        </div>
                    </header>

                    <div className="flex flex-1 overflow-hidden">
                        <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 shadow-sm z-20 flex-shrink-0">
                            <button onClick={() => { setActiveTab('tools'); setSelectedId(null); }} className={`p-2 rounded-lg ${activeTab === 'tools' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}>
                                <Icons.Square />
                            </button>
                        </aside>

                        <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 flex-shrink-0">
                            <div className="p-4 border-b border-gray-100">
                                <h2 className="font-semibold text-slate-700">Elementi Base</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                <button onClick={() => addElement('text')} className="w-full p-2 border border-gray-200 rounded hover:bg-indigo-50">+ Testo</button>
                                <button onClick={() => addElement('box')} className="w-full p-2 border border-gray-200 rounded hover:bg-indigo-50">+ Riquadro</button>
                                <button onClick={() => addElement('circle')} className="w-full p-2 border border-gray-200 rounded hover:bg-indigo-50">+ Cerchio</button>
                                <button onClick={() => addElement('image')} className="w-full p-2 border border-gray-200 rounded hover:bg-indigo-50">+ Immagine</button>
                                {BLOCK_TEMPLATES.map((tpl, idx) => (
                                    <button key={idx} onClick={() => addElement('html-block', tpl)} className="w-full p-2 border border-gray-200 rounded hover:bg-indigo-50 text-sm">{tpl.name}</button>
                                ))}
                            </div>
                        </div>

                        <main className="flex-1 bg-slate-100 relative overflow-auto flex justify-center p-8">
                            <div className="transition-all duration-500 relative flex-shrink-0 shadow-2xl bg-white" style={{width: viewDims.width, height: viewMode === 'desktop' ? '100%' : viewDims.height}}>
                                <div ref={el => window.canvasRef = el} className="w-full h-full relative overflow-hidden bg-white" style={{backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px'}} onMouseDown={() => setSelectedId(null)}>
                                    {elements.map(renderElement)}
                                </div>
                            </div>
                        </main>

                        {selectedElement && (
                            <aside className="w-72 bg-white border-l border-gray-200 flex flex-col shadow-lg z-20 flex-shrink-0">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="font-semibold text-slate-700">Proprietà</h2>
                                    <button onClick={() => setSelectedId(null)} className="text-slate-400">✕</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {selectedElement.type === 'text' && (
                                        <input type="text" value={selectedElement.content} onChange={(e) => updateElementProp('content', e.target.value)} className="w-full p-2 border border-gray-200 rounded" />
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" placeholder="X" value={Math.round(selectedElement.x)} onChange={(e) => updateElementProp('x', Number(e.target.value))} className="p-2 border border-gray-200 rounded text-sm" />
                                        <input type="number" placeholder="Y" value={Math.round(selectedElement.y)} onChange={(e) => updateElementProp('y', Number(e.target.value))} className="p-2 border border-gray-200 rounded text-sm" />
                                        <input type="number" placeholder="W" value={selectedElement.width} onChange={(e) => updateElementProp('width', Number(e.target.value))} className="p-2 border border-gray-200 rounded text-sm" />
                                        <input type="number" placeholder="H" value={selectedElement.height} onChange={(e) => updateElementProp('height', Number(e.target.value))} className="p-2 border border-gray-200 rounded text-sm" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Colore Sfondo</span>
                                        <input type="color" value={selectedElement.styles.backgroundColor === 'transparent' ? '#ffffff' : selectedElement.styles.backgroundColor} onChange={(e) => updateElementStyle('backgroundColor', e.target.value)} className="h-8 w-8 cursor-pointer" />
                                    </div>
                                    <button onClick={deleteElement} className="w-full p-2 bg-red-50 text-red-600 rounded hover:bg-red-100">🗑 Elimina</button>
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            );
        }

        ReactDOM.createRoot(document.getElementById('root')).render(<PageBuilder />);
    </script>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</body>
</html>
