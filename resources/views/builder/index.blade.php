<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $page->title }} - Advanced Page Builder</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .grid-dots {
            background-image: 
                radial-gradient(circle, #e5e7eb 1px, transparent 1px),
                radial-gradient(circle, #e5e7eb 1px, transparent 1px);
            background-size: 20px 20px;
            background-position: 0 0, 10px 10px;
        }
        .resize-handle {
            position: absolute;
            width: 8px;
            height: 8px;
            background: #2563eb;
            border: 1px solid white;
            border-radius: 50%;
            z-index: 1000;
        }
        .canvas-container {
            transition: all 0.3s ease;
        }
        .layer-item {
            transition: background-color 0.2s;
        }
        .layer-item:hover {
            background-color: #f3f4f6;
        }
        .snap-guide {
            position: absolute;
            background: #2563eb;
            opacity: 0.5;
            z-index: 999;
        }
        .property-section {
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
        }
        .drag-preview {
            opacity: 0.7;
            transform: rotate(3deg);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .undo-redo-disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div id="root"></div>

    <script type="text/babel">
@verbatim
const { useState, useRef, useEffect, useCallback } = React;

// Enhanced Icon Component with more icons
const Icon = ({ type, size = 20, className = "" }) => {
    const icons = {
        Move: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>,
        Type: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
        Square: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>,
        Circle: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>,
        Image: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
        Download: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
        MousePointer2: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>,
        LayoutTemplate: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>,
        Plus: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
        Trash2: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>,
        Layers: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
        XCircle: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
        Monitor: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
        Tablet: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
        Smartphone: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
        Maximize: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
        Grid: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
        Copy: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
        Scissors: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88"/><path d="M14.47 14.48L20 20"/><path d="M8.12 8.12L12 12"/></svg>,
        Undo: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
        Redo: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 0 9-9 9 9 0 0 0 6 2.3L21 13"/></svg>,
        Save: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
        Code: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
        AlignLeft: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>,
        AlignCenter: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>,
        AlignRight: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>,
        Bold: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
        Italic: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
        Underline: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>,
        Eye: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
        EyeOff: () => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    };
    const IconComponent = icons[type];
    return IconComponent ? <div className={className}><IconComponent /></div> : null;
};

// Enhanced BLOCK_TEMPLATES with more variety
const BLOCK_TEMPLATES = [
  {
    name: 'Hero Section',
    category: 'Hero',
    height: 250,
    width: 800,
    html: `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding: 40px; text-align:center; border-radius: 12px;"><h1 style="font-size: 48px; font-weight: 800; margin-bottom: 16px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Titolo Hero</h1><p style="font-size: 20px; opacity: 0.95; max-width: 600px; margin-bottom: 32px;">Sottotitolo accattivante per la tua sezione hero con call to action.</p><div style="display:flex; gap: 16px;"><button style="padding: 14px 32px; background: white; color: #667eea; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s;">Azione Primaria</button><button style="padding: 14px 32px; background: transparent; color: white; border: 2px solid white; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px;">Azione Secondaria</button></div></div>`
  },
  {
    name: 'Pricing Card Pro',
    category: 'Pricing',
    height: 400,
    width: 300,
    html: `<div style="width:100%; height:100%; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 20px; padding: 32px; display:flex; flex-direction:column; box-shadow: 0 20px 40px rgba(0,0,0,0.1); color: white; position: relative; overflow: hidden;"><div style="position: absolute; top: 0; right: 0; background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 0 20px 0 20px; font-size: 12px; font-weight: 600;">POPOLARE</div><h3 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Pro Plan</h3><p style="font-size: 14px; opacity: 0.9; margin-bottom: 24px;">Per team che hanno bisogno di funzionalità avanzate</p><div style="font-size: 56px; font-weight: 800; margin: 16px 0;">€29<span style="font-size: 16px; font-weight: 400; opacity: 0.9;">/mese</span></div><ul style="flex:1; list-style: none; padding: 0; margin: 0 0 32px 0; color: white; font-size: 14px; line-height: 2;"><li>✓ Utenti illimitati</li><li>✓ 50GB Spazio cloud</li><li>✓ Supporto priority 24/7</li><li>✓ Analitiche avanzate</li><li>✓ API access</li></ul><button style="width:100%; padding: 16px; background: white; color: #f5576c; border: none; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">Scegli Pro</button></div>`
  },
  {
    name: 'Feature Row',
    category: 'Features',
    height: 150,
    width: 700,
    html: `<div style="width:100%; height:100%; display:flex; align-items:center; background: white; border-radius: 16px; padding: 32px; gap: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #f1f1f1;"><div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; display:flex; align-items:center; justify-content:center; color: white; font-weight:bold; font-size: 32px; flex-shrink:0;">★</div><div style="flex:1;"><h4 style="font-size: 20px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">Caratteristica Top</h4><p style="font-size: 16px; color: #6b7280; margin: 0; line-height: 1.5;">Descrivi qui il vantaggio principale del tuo prodotto in poche righe. Mostra il valore unico che offri.</p></div><button style="padding: 12px 24px; background: transparent; border: 2px solid #667eea; color: #667eea; border-radius: 8px; font-weight: 600; cursor: pointer; flex-shrink:0;">Scopri di più</button></div>`
  },
  {
    name: 'Testimonial Card',
    category: 'Testimonials',
    height: 250,
    width: 350,
    html: `<div style="width:100%; height:100%; background: white; border-radius: 20px; padding: 32px; display:flex; flex-direction:column; box-shadow: 0 15px 35px rgba(0,0,0,0.05);"><div style="display:flex; align-items:center; margin-bottom: 24px;"><div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 50%; margin-right: 16px;"></div><div><h5 style="font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 4px 0;">Mario Rossi</h5><p style="font-size: 14px; color: #6b7280; margin: 0;">CEO, Azienda S.p.A.</p></div></div><p style="flex:1; font-size: 16px; color: #4b5563; line-height: 1.6; font-style: italic; margin: 0 0 24px 0;">"Questo prodotto ha rivoluzionato il modo in cui lavoriamo. L'efficienza è aumentata del 200% in soli tre mesi."</p><div style="color: #f59e0b; font-size: 20px;">★★★★★</div></div>`
  },
  {
    name: 'CTA Section',
    category: 'CTA',
    height: 200,
    width: 900,
    html: `<div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color:white; padding: 40px; text-align:center; border-radius: 16px;"><h2 style="font-size: 36px; font-weight: 700; margin-bottom: 16px;">Pronto a iniziare?</h2><p style="font-size: 18px; opacity: 0.9; max-width: 600px; margin-bottom: 32px;">Unisciti a migliaia di clienti soddisfatti che hanno già scelto la nostra soluzione.</p><div style="display:flex; gap: 16px;"><button style="padding: 16px 40px; background: white; color: #4f46e5; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 16px; transition: transform 0.2s;">Inizia gratis</button><button style="padding: 16px 40px; background: transparent; color: white; border: 2px solid white; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 16px;">Parla con un esperto</button></div></div>`
  }
];

@endverbatim

@php
    use App\Services\ThemeService;
    $themeBlocks = ThemeService::getBlocksByTheme();
@endphp

@verbatim

const CUSTOM_BLOCKS = @endverbatim @json($themeBlocks) @verbatim;
const ALL_BLOCKS = [...BLOCK_TEMPLATES, ...CUSTOM_BLOCKS.map(block => ({
  name: block.name,
  html: block.html,
  height: 200,
  width: 400,
  icon: block.icon,
  category: block.category || 'Custom'
}))];

// Group blocks by category
const BLOCKS_BY_CATEGORY = ALL_BLOCKS.reduce((acc, block) => {
  const category = block.category || 'Custom';
  if (!acc[category]) acc[category] = [];
  acc[category].push(block);
  return acc;
}, {});

@endverbatim

const INITIAL_ELEMENTS = @json($builderData);
const PAGE_SLUG = @json($page->slug);
const PAGE_TITLE = @json($page->title);
const PAGE_ID = @json($page->id);

@verbatim

// History management for undo/redo
const createHistoryState = (elements) => ({
  elements: JSON.parse(JSON.stringify(elements)),
  timestamp: Date.now()
});

function PageBuilder() {
  const [elements, setElements] = useState(INITIAL_ELEMENTS.length > 0 ? INITIAL_ELEMENTS : [{
    id: 'starter-' + Date.now(),
    type: 'text',
    content: 'Ciao! Sono modificabile. Doppio click per editare.',
    x: 40,
    y: 40,
    width: 300,
    height: 80,
    styles: {
      backgroundColor: 'transparent',
      color: '#1f2937',
      fontSize: '28px',
      fontWeight: '700',
      textAlign: 'center',
      borderRadius: '0px',
      fontFamily: 'Inter, sans-serif',
      lineHeight: '1.2'
    }
  }]);
  
  const [selectedId, setSelectedId] = useState(null);
  const [dragInfo, setDragInfo] = useState({ 
    isDragging: false, 
    startX: 0, 
    startY: 0, 
    initialElemX: 0, 
    initialElemY: 0,
    type: 'move' // 'move' or 'resize'
  });
  const [viewMode, setViewMode] = useState('desktop');
  const [activeTab, setActiveTab] = useState('tools');
  const [isSaving, setIsSaving] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [history, setHistory] = useState([createHistoryState(elements)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showLayers, setShowLayers] = useState(true);
  const [blockCategories, setBlockCategories] = useState(Object.keys(BLOCKS_BY_CATEGORY));
  const [activeBlockCategory, setActiveBlockCategory] = useState('All');
  const [dragPreview, setDragPreview] = useState(null);
  
  const canvasRef = useRef(null);
  const elementCountRef = useRef(elements.length);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo) redo();
      }
      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedId) deleteElement();
      }
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
      // Ctrl/Cmd + C to copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        if (selectedId) copyElement();
      }
      // Ctrl/Cmd + V to paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteElement();
      }
      // Ctrl/Cmd + D to duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedId) duplicateElement();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, history, historyIndex]);

  // Save history on elements change
  useEffect(() => {
    if (elements.length !== elementCountRef.current) {
      addToHistory(elements);
      elementCountRef.current = elements.length;
    }
  }, [elements]);

  const addToHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(createHistoryState(newElements));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(JSON.parse(JSON.stringify(history[newIndex].elements)));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(JSON.parse(JSON.stringify(history[newIndex].elements)));
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addElement = (type, template = null, x = 50, y = 50) => {
    const id = Date.now().toString();
    const defaultStyles = {
      backgroundColor: type === 'text' ? 'transparent' : '#e5e7eb',
      color: '#000000',
      borderWidth: '0px',
      borderColor: '#000000',
      fontFamily: 'Inter, sans-serif'
    };

    let newElement = { 
      id, 
      type, 
      x: snapToGrid ? Math.round(x / 10) * 10 : x, 
      y: snapToGrid ? Math.round(y / 10) * 10 : y, 
      styles: defaultStyles 
    };

    if (type === 'text') {
      newElement = { 
        ...newElement, 
        content: 'Doppio click per editare...', 
        width: 200, 
        height: 50, 
        styles: { 
          ...defaultStyles, 
          fontSize: '18px',
          lineHeight: '1.5'
        } 
      };
    } else if (type === 'box') {
      newElement = { 
        ...newElement, 
        width: 100, 
        height: 100, 
        styles: { 
          ...defaultStyles, 
          backgroundColor: '#60a5fa', 
          borderRadius: '8px' 
        } 
      };
    } else if (type === 'circle') {
      newElement = { 
        ...newElement, 
        width: 100, 
        height: 100, 
        styles: { 
          ...defaultStyles, 
          backgroundColor: '#f472b6', 
          borderRadius: '50%' 
        } 
      };
    } else if (type === 'image') {
      newElement = { 
        ...newElement, 
        content: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 
        width: 200, 
        height: 200, 
        styles: { 
          ...defaultStyles, 
          objectFit: 'cover',
          borderRadius: '8px'
        } 
      };
    } else if (type === 'html-block' && template) {
      newElement = { 
        ...newElement, 
        content: template.html, 
        width: template.width, 
        height: template.height, 
        styles: { 
          ...defaultStyles, 
          backgroundColor: 'transparent' 
        },
        name: template.name
      };
    }

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    setSelectedId(id);
    return newElement;
  };

  const handleMouseDown = (e, id, type = 'move', resizeHandle = null) => {
    e.stopPropagation();
    setSelectedId(id);
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    if (type === 'move') {
      setDragInfo({ 
        isDragging: true, 
        startX: e.clientX, 
        startY: e.clientY, 
        initialElemX: element.x, 
        initialElemY: element.y,
        type: 'move'
      });
    } else if (type === 'resize' && resizeHandle) {
      setDragInfo({ 
        isDragging: true, 
        startX: e.clientX, 
        startY: e.clientY, 
        initialElemX: element.x, 
        initialElemY: element.y,
        initialWidth: element.width,
        initialHeight: element.height,
        type: 'resize',
        resizeHandle
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!dragInfo.isDragging || !selectedId) return;
    
    const element = elements.find(el => el.id === selectedId);
    if (!element) return;
    
    const dx = e.clientX - dragInfo.startX;
    const dy = e.clientY - dragInfo.startY;
    
    if (dragInfo.type === 'move') {
      let newX = dragInfo.initialElemX + dx;
      let newY = dragInfo.initialElemY + dy;
      
      if (snapToGrid) {
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
      }
      
      setElements(prev => prev.map(el => 
        el.id === selectedId ? { ...el, x: newX, y: newY } : el
      ));
    } else if (dragInfo.type === 'resize') {
      const handle = dragInfo.resizeHandle;
      const newElement = { ...element };
      
      switch(handle) {
        case 'nw':
          newElement.x = dragInfo.initialElemX + dx;
          newElement.y = dragInfo.initialElemY + dy;
          newElement.width = Math.max(20, dragInfo.initialWidth - dx);
          newElement.height = Math.max(20, dragInfo.initialHeight - dy);
          break;
        case 'ne':
          newElement.y = dragInfo.initialElemY + dy;
          newElement.width = Math.max(20, dragInfo.initialWidth + dx);
          newElement.height = Math.max(20, dragInfo.initialHeight - dy);
          break;
        case 'sw':
          newElement.x = dragInfo.initialElemX + dx;
          newElement.width = Math.max(20, dragInfo.initialWidth - dx);
          newElement.height = Math.max(20, dragInfo.initialHeight + dy);
          break;
        case 'se':
          newElement.width = Math.max(20, dragInfo.initialWidth + dx);
          newElement.height = Math.max(20, dragInfo.initialHeight + dy);
          break;
        case 'n':
          newElement.y = dragInfo.initialElemY + dy;
          newElement.height = Math.max(20, dragInfo.initialHeight - dy);
          break;
        case 's':
          newElement.height = Math.max(20, dragInfo.initialHeight + dy);
          break;
        case 'e':
          newElement.width = Math.max(20, dragInfo.initialWidth + dx);
          break;
        case 'w':
          newElement.x = dragInfo.initialElemX + dx;
          newElement.width = Math.max(20, dragInfo.initialWidth - dx);
          break;
      }
      
      if (snapToGrid) {
        newElement.x = Math.round(newElement.x / 10) * 10;
        newElement.y = Math.round(newElement.y / 10) * 10;
        newElement.width = Math.round(newElement.width / 10) * 10;
        newElement.height = Math.round(newElement.height / 10) * 10;
      }
      
      setElements(prev => prev.map(el => 
        el.id === selectedId ? newElement : el
      ));
    }
  };

  const handleMouseUp = () => {
    if (dragInfo.isDragging) {
      addToHistory(elements);
      setDragInfo({ ...dragInfo, isDragging: false });
    }
  };

  const updateElementStyle = (key, value) => {
    setElements(prev => prev.map(el => 
      el.id === selectedId ? { ...el, styles: { ...el.styles, [key]: value } } : el
    ));
  };

  const updateElementProp = (key, value) => {
    setElements(prev => prev.map(el => 
      el.id === selectedId ? { ...el, [key]: value } : el
    ));
  };

  const deleteElement = () => {
    addToHistory(elements);
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const duplicateElement = () => {
    const element = elements.find(el => el.id === selectedId);
    if (!element) return;
    
    const newElement = {
      ...JSON.parse(JSON.stringify(element)),
      id: Date.now().toString(),
      x: element.x + 20,
      y: element.y + 20
    };
    
    addToHistory(elements);
    setElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
  };

  const copyElement = () => {
    const element = elements.find(el => el.id === selectedId);
    if (element) {
      localStorage.setItem('builder-copied-element', JSON.stringify(element));
    }
  };

  const pasteElement = () => {
    const copied = localStorage.getItem('builder-copied-element');
    if (copied) {
      const element = JSON.parse(copied);
      const newElement = {
        ...element,
        id: Date.now().toString(),
        x: element.x + 20,
        y: element.y + 20
      };
      
      addToHistory(elements);
      setElements(prev => [...prev, newElement]);
      setSelectedId(newElement.id);
    }
  };

  const bringToFront = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    const others = elements.filter(el => el.id !== selectedId);
    
    addToHistory(elements);
    setElements([...others, element]);
  };

  const sendToBack = () => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    const others = elements.filter(el => el.id !== selectedId);
    
    addToHistory(elements);
    setElements([element, ...others]);
  };

  const getViewDimensions = () => {
    switch(viewMode) {
      case 'mobile': return { width: '375px', height: '667px', label: 'iPhone SE' };
      case 'tablet': return { width: '768px', height: '1024px', label: 'iPad Mini' };
      default: return { width: '100%', height: '100%', label: 'Desktop' };
    }
  };

  const saveBuilder = async () => {
    setIsSaving(true);
    try {
      const generateHTML = () => {
        return elements.map(el => {
          if (el.type === 'html-block') return el.content;
          if (el.type === 'text') {
            const styleString = Object.entries(el.styles)
              .map(([k,v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
              .join('; ');
            return `<div style="position:absolute; left:${el.x}px; top:${el.y}px; width:${el.width}px; height:${el.height}px; ${styleString}">${el.content}</div>`;
          }
          if (el.type === 'image') {
            const styleString = Object.entries(el.styles)
              .map(([k,v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
              .join('; ');
            return `<img src="${el.content}" style="position:absolute; left:${el.x}px; top:${el.y}px; width:${el.width}px; height:${el.height}px; ${styleString}">`;
          }
          const styleString = Object.entries(el.styles)
            .map(([k,v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
            .join('; ');
          return `<div style="position:absolute; left:${el.x}px; top:${el.y}px; width:${el.width}px; height:${el.height}px; ${styleString}"></div>`;
        }).join('\n');
      };

      const response = await fetch(`/api/pages/${PAGE_SLUG}/builder/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({
          elements: elements,
          html: generateHTML(),
          css: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; }',
          js: '// Custom JavaScript',
        }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error('HTTP Error:', response.status, text);
        alert(`Errore HTTP ${response.status}: ${text}`);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        alert('✓ Pagina salvata con successo!');
      } else {
        alert('Errore nel salvataggio: ' + (data.message || 'Sconosciuto'));
      }
    } catch (error) {
      console.error('Errore dettagliato:', error);
      alert('Errore nel salvataggio: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const exportJSON = () => {
    const data = {
      elements,
      metadata: {
        exportedAt: new Date().toISOString(),
        pageTitle: PAGE_TITLE,
        pageSlug: PAGE_SLUG
      }
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${PAGE_SLUG}-design-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.elements && Array.isArray(data.elements)) {
          addToHistory(elements);
          setElements(data.elements);
          alert('Design importato con successo!');
        } else {
          alert('Formato JSON non valido');
        }
      } catch (error) {
        alert('Errore nella lettura del file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleDragStart = (e, template) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(template));
    setDragPreview({
      html: template.html,
      width: template.width,
      height: template.height
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      const template = JSON.parse(data);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addElement('html-block', template, x, y);
    }
    setDragPreview(null);
  };

  const filteredBlocks = activeBlockCategory === 'All' 
    ? ALL_BLOCKS 
    : ALL_BLOCKS.filter(block => block.category === activeBlockCategory);

  const viewDims = getViewDimensions();
  const selectedElement = elements.find(el => el.id === selectedId);

  const renderResizeHandles = (el) => {
    if (selectedId !== el.id) return null;
    
    const handles = [
      { id: 'nw', x: -4, y: -4, cursor: 'nw-resize' },
      { id: 'ne', x: el.width - 4, y: -4, cursor: 'ne-resize' },
      { id: 'sw', x: -4, y: el.height - 4, cursor: 'sw-resize' },
      { id: 'se', x: el.width - 4, y: el.height - 4, cursor: 'se-resize' },
      { id: 'n', x: el.width/2 - 4, y: -4, cursor: 'n-resize' },
      { id: 's', x: el.width/2 - 4, y: el.height - 4, cursor: 's-resize' },
      { id: 'e', x: el.width - 4, y: el.height/2 - 4, cursor: 'e-resize' },
      { id: 'w', x: -4, y: el.height/2 - 4, cursor: 'w-resize' }
    ];

    return handles.map(handle => (
      <div
        key={handle.id}
        className="resize-handle"
        style={{
          left: handle.x,
          top: handle.y,
          cursor: handle.cursor
        }}
        onMouseDown={(e) => handleMouseDown(e, el.id, 'resize', handle.id)}
      />
    ));
  };

  const renderElement = (el) => {
    const isSelected = selectedId === el.id;
    const commonStyle = {
      position: 'absolute',
      left: `${el.x}px`,
      top: `${el.y}px`,
      width: `${el.width}px`,
      height: `${el.height}px`,
      cursor: dragInfo.isDragging && isSelected ? 'grabbing' : 'grab',
      boxShadow: isSelected ? '0 0 0 2px #2563eb, 0 0 0 6px rgba(37, 99, 235, 0.1)' : 'none',
      borderStyle: 'solid',
      transition: dragInfo.isDragging ? 'none' : 'box-shadow 0.2s, transform 0.1s',
      zIndex: isSelected ? 100 : 1,
      ...el.styles
    };

    if (el.type === 'html-block') {
      return (
        <div 
          key={el.id} 
          style={{...commonStyle, overflow: 'hidden'}} 
          onMouseDown={(e) => handleMouseDown(e, el.id)}
        >
          <div className="absolute inset-0 z-10" style={{ pointerEvents: 'none' }} />
          <div 
            dangerouslySetInnerHTML={{ __html: el.content }} 
            style={{
              width: '100%', 
              height: '100%', 
              pointerEvents: 'none',
              userSelect: 'none'
            }} 
          />
          {renderResizeHandles(el)}
        </div>
      );
    }

    if (el.type === 'text') {
      return (
        <div
          key={el.id}
          style={{
            ...commonStyle,
            display: 'flex',
            alignItems: el.styles.textAlign === 'center' ? 'center' : 'flex-start',
            justifyContent: el.styles.textAlign === 'center' ? 'center' : 
                          el.styles.textAlign === 'right' ? 'flex-end' : 'flex-start',
            padding: '8px',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
          onMouseDown={(e) => handleMouseDown(e, el.id)}
          onDoubleClick={() => {
            const newContent = prompt('Modifica testo:', el.content);
            if (newContent !== null) {
              updateElementProp('content', newContent);
            }
          }}
        >
          {el.content}
          {renderResizeHandles(el)}
        </div>
      );
    }
    
    if (el.type === 'image') {
      return (
        <div 
          key={el.id} 
          style={{
            ...commonStyle, 
            padding: 0, 
            overflow: 'hidden', 
            backgroundColor: 'transparent'
          }} 
          onMouseDown={(e) => handleMouseDown(e, el.id)}
        >
          <img 
            src={el.content} 
            alt="content" 
            style={{
              width: '100%', 
              height: '100%', 
              objectFit: el.styles.objectFit || 'cover',
              pointerEvents: 'none'
            }} 
            onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Errore+Immagine'} 
          />
          {renderResizeHandles(el)}
        </div>
      );
    }

    // For box and circle
    return (
      <div 
        key={el.id} 
        style={commonStyle} 
        onMouseDown={(e) => handleMouseDown(e, el.id)}
      >
        {renderResizeHandles(el)}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden" 
         onMouseMove={handleMouseMove} 
         onMouseUp={handleMouseUp}
         onDragOver={handleDragOver}
         onDrop={handleDrop}>
      
      {/* Enhanced Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-40">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg text-white">
            <Icon type="Move" size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800">{PAGE_TITLE} - Advanced Builder</h1>
            <p className="text-xs text-slate-500">{elements.length} elementi</p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('desktop')} 
              className={`p-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Desktop View"
            >
              <Icon type="Monitor" size={18} /> 
              <span className="text-xs font-medium hidden md:inline">Desktop</span>
            </button>
            <button 
              onClick={() => setViewMode('tablet')} 
              className={`p-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'tablet' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Tablet View"
            >
              <Icon type="Tablet" size={18} /> 
              <span className="text-xs font-medium hidden md:inline">Tablet</span>
            </button>
            <button 
              onClick={() => setViewMode('mobile')} 
              className={`p-2 rounded-md transition-all flex items-center gap-2 ${viewMode === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Mobile View"
            >
              <Icon type="Smartphone" size={18} /> 
              <span className="text-xs font-medium hidden md:inline">Mobile</span>
            </button>
          </div>

          {/* Grid Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowGrid(!showGrid)} 
              className={`p-2 rounded ${showGrid ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
              title="Mostra/Nascondi Griglia"
            >
              <Icon type="Grid" size={18} />
            </button>
            <button 
              onClick={() => setSnapToGrid(!snapToGrid)} 
              className={`p-2 rounded ${snapToGrid ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
              title="Snap to Grid"
            >
              <Icon type="Maximize" size={18} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={undo} 
              disabled={!canUndo}
              className={`p-2 rounded ${canUndo ? 'hover:bg-white' : 'undo-redo-disabled'}`}
              title="Undo (Ctrl+Z)"
            >
              <Icon type="Undo" size={16} />
            </button>
            <button 
              onClick={redo} 
              disabled={!canRedo}
              className={`p-2 rounded ${canRedo ? 'hover:bg-white' : 'undo-redo-disabled'}`}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Icon type="Redo" size={16} />
            </button>
          </div>

          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <Icon type="Download" size={16} /> 
            <span className="hidden sm:inline">Importa</span>
            <input type="file" accept=".json" onChange={importJSON} className="hidden" />
          </label>
          
          <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <Icon type="Download" size={16} /> 
            <span className="hidden sm:inline">Esporta</span>
          </button>
          
          <button onClick={saveBuilder} disabled={isSaving} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium flex items-center gap-2">
            <Icon type="Save" size={16} />
            {isSaving ? 'Salvataggio...' : 'Salva Design'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 shadow-sm z-30 flex-shrink-0">
          <ToolButton 
            icon={<Icon type="MousePointer2" size={22} />} 
            label="Seleziona" 
            active={activeTab === 'tools' && selectedId === null} 
            onClick={() => { setActiveTab('tools'); setSelectedId(null); }} 
          />
          
          <div className="w-10 h-px bg-gray-200 my-1"></div>
          
          <ToolButton 
            icon={<Icon type="Square" size={22} />} 
            label="Elementi" 
            active={activeTab === 'tools'} 
            onClick={() => setActiveTab('tools')} 
          />
          <ToolButton 
            icon={<Icon type="LayoutTemplate" size={22} />} 
            label="Blocchi" 
            active={activeTab === 'blocks'} 
            onClick={() => setActiveTab('blocks')} 
          />
          <ToolButton 
            icon={<Icon type="Layers" size={22} />} 
            label="Layer" 
            active={activeTab === 'layers'} 
            onClick={() => setActiveTab('layers')} 
          />
          
          <div className="w-10 h-px bg-gray-200 my-1"></div>
          
          <ToolButton 
            icon={<Icon type="Code" size={22} />} 
            label="Codice" 
            active={activeTab === 'code'} 
            onClick={() => setActiveTab('code')} 
          />
        </aside>

        {/* Extended Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col z-20 flex-shrink-0 transition-all duration-300 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-slate-800 text-lg">
              {activeTab === 'tools' ? 'Elementi Base' : 
               activeTab === 'blocks' ? 'Libreria Blocchi' :
               activeTab === 'layers' ? 'Gestione Layer' :
               'Editor Codice'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'tools' ? 'Trascina elementi nel canvas' : 
               activeTab === 'blocks' ? 'Sezioni HTML pronte all\'uso' :
               activeTab === 'layers' ? 'Gestisci l\'ordine degli elementi' :
               'Modifica HTML/CSS/JS direttamente'}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'tools' ? (
              <div className="space-y-3">
                <SidebarItem 
                  icon={<Icon type="Type" size={18} />} 
                  label="Testo" 
                  description="Aggiungi testo modificabile"
                  onClick={() => addElement('text')} 
                />
                <SidebarItem 
                  icon={<Icon type="Square" size={18} />} 
                  label="Riquadro" 
                  description="Contenitore rettangolare"
                  onClick={() => addElement('box')} 
                />
                <SidebarItem 
                  icon={<Icon type="Circle" size={18} />} 
                  label="Cerchio" 
                  description="Contenitore circolare"
                  onClick={() => addElement('circle')} 
                />
                <SidebarItem 
                  icon={<Icon type="Image" size={18} />} 
                  label="Immagine" 
                  description="Inserisci immagine da URL"
                  onClick={() => addElement('image')} 
                />
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-slate-600 mb-3">Tasti di scelta rapida</h3>
                  <div className="space-y-2 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Ctrl+C / Ctrl+V</span>
                      <span className="font-medium">Copia/Incolla</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+D</span>
                      <span className="font-medium">Duplica</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delete</span>
                      <span className="font-medium">Elimina</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+Z / Ctrl+Shift+Z</span>
                      <span className="font-medium">Undo/Redo</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'blocks' ? (
              <div className="space-y-4">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-1 mb-4">
                  <button
                    onClick={() => setActiveBlockCategory('All')}
                    className={`px-3 py-1 text-xs rounded-full ${activeBlockCategory === 'All' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Tutti
                  </button>
                  {blockCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveBlockCategory(category)}
                      className={`px-3 py-1 text-xs rounded-full ${activeBlockCategory === category ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Blocks Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {filteredBlocks.map((tpl, idx) => (
                    <div 
                      key={idx} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, tpl)}
                      onClick={() => addElement('html-block', tpl, 100, 100)}
                      className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-indigo-500 hover:shadow-lg transition-all group bg-white"
                    >
                      <div className="h-24 bg-gray-100 rounded mb-3 overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                          {tpl.icon || 'Preview'}
                        </div>
                        <div 
                          className="absolute inset-0 opacity-30"
                          dangerouslySetInnerHTML={{ __html: tpl.html }} 
                          style={{ 
                            transform: 'scale(0.15)', 
                            transformOrigin: 'top left', 
                            width: '666%', 
                            height: '666%'
                          }} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-slate-800">{tpl.name}</span>
                          <div className="text-xs text-slate-500 mt-1">{tpl.category} • {tpl.width}×{tpl.height}</div>
                        </div>
                        <Icon type="Plus" size={14} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'layers' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-slate-700">Elementi ({elements.length})</h3>
                  <button 
                    onClick={() => setShowLayers(!showLayers)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    {showLayers ? 'Nascondi' : 'Mostra'}
                  </button>
                </div>
                {showLayers && elements.map((el, index) => (
                  <div 
                    key={el.id}
                    className={`layer-item p-3 rounded-lg border ${selectedId === el.id ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100'}`}
                    onClick={() => setSelectedId(el.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${el.type === 'text' ? 'bg-blue-500' : el.type === 'image' ? 'bg-green-500' : el.type === 'html-block' ? 'bg-purple-500' : 'bg-gray-500'}`}></div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            {el.name || `${el.type.charAt(0).toUpperCase() + el.type.slice(1)} ${index + 1}`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {Math.round(el.x)}×{Math.round(el.y)} • {el.width}×{el.height}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(el.id);
                          deleteElement();
                        }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Icon type="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'code' ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-600">
                  <p>Modifica il codice HTML/CSS/JS generato.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">HTML</label>
                  <textarea 
                    className="w-full h-32 p-2 border border-gray-200 rounded text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                    defaultValue={elements.map(el => {
                      if (el.type === 'html-block') return el.content;
                      return `<div id="${el.id}" style="position:absolute; left:${el.x}px; top:${el.y}px; width:${el.width}px; height:${el.height}px;">${el.type === 'text' ? el.content : ''}</div>`;
                    }).join('\n')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700">CSS Globale</label>
                  <textarea 
                    className="w-full h-24 p-2 border border-gray-200 rounded text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                    defaultValue="/* CSS globale */"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Main Canvas Area */}
        <main className="flex-1 bg-slate-50 relative overflow-auto flex justify-center items-start p-8 transition-colors">
          <div 
            className="canvas-container transition-all duration-500 ease-in-out relative flex-shrink-0 shadow-2xl bg-white rounded-xl overflow-hidden" 
            style={{ 
              width: viewDims.width, 
              height: viewMode === 'desktop' ? 'calc(100vh - 180px)' : viewDims.height,
              minHeight: viewMode === 'desktop' ? 'calc(100vh - 180px)' : 'auto',
              marginTop: viewMode === 'desktop' ? 0 : '20px',
              marginBottom: '20px'
            }}
          >
            {viewMode !== 'desktop' && (
              <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-t-lg flex items-center justify-center text-xs text-white font-medium">
                {viewDims.label} • {viewMode.toUpperCase()}
              </div>
            )}
            
            <div 
              ref={canvasRef}
              className="w-full h-full relative overflow-auto bg-white"
              style={{ 
                backgroundImage: showGrid ? 'radial-gradient(#e2e8f0 1px, transparent 1px)' : 'none',
                backgroundSize: '20px 20px'
              }}
              onMouseDown={() => setSelectedId(null)}
            >
              {elements.map(renderElement)}
              
              {/* Drag Preview */}
              {dragPreview && (
                <div 
                  className="absolute drag-preview pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: `${dragPreview.width}px`,
                    height: `${dragPreview.height}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  dangerouslySetInnerHTML={{ __html: dragPreview.html }}
                />
              )}
              
              {elements.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                  <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-8 rounded-2xl mb-6">
                    <Icon type="Maximize" size={64} className="text-indigo-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-600 mb-2">Canvas Vuoto</h3>
                  <p className="text-slate-500 max-w-md text-center">
                    Trascina elementi dalla sidebar o scegli un blocco predefinito per iniziare.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <button 
                      onClick={() => addElement('text')}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Aggiungi Testo
                    </button>
                    <button 
                      onClick={() => setActiveTab('blocks')}
                      className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Scegli Blocco
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Properties Panel */}
        {selectedElement && (
          <aside className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl z-20 flex-shrink-0">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="font-semibold text-slate-800">Proprietà</h2>
                <p className="text-xs text-slate-500">
                  {selectedElement.name || selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedId(null)} 
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <Icon type="XCircle" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Content Section */}
              <div className="property-section">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Contenuto</label>
                {selectedElement.type === 'text' && (
                  <textarea 
                    value={selectedElement.content} 
                    onChange={(e) => updateElementProp('content', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-24 resize-y"
                    placeholder="Inserisci il testo..."
                  />
                )}
                {selectedElement.type === 'image' && (
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="URL Immagine (https://...)" 
                      value={selectedElement.content} 
                      onChange={(e) => updateElementProp('content', e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="text-xs text-slate-500">
                      Suggerimento: Usa <a href="https://unsplash.com" target="_blank" className="text-indigo-600 hover:underline">Unsplash</a> per immagini gratuite
                    </div>
                  </div>
                )}
                {selectedElement.type === 'html-block' && (
                  <div className="space-y-3">
                    <textarea 
                      value={selectedElement.content} 
                      onChange={(e) => updateElementProp('content', e.target.value)}
                      className="w-full h-48 p-3 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                      placeholder="Codice HTML..."
                    />
                    <div className="text-xs text-slate-500 bg-blue-50 p-2 rounded">
                      <p className="font-medium mb-1">Blocco HTML</p>
                      <p>Puoi modificare direttamente il codice HTML. Usa CSS inline per lo styling.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Position & Size Section */}
              <div className="property-section">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Posizione & Dimensioni</label>
                <div className="grid grid-cols-2 gap-3">
                  <InputNumber 
                    label="X" 
                    val={Math.round(selectedElement.x)} 
                    onChange={(v) => updateElementProp('x', Number(v))} 
                    min={0}
                  />
                  <InputNumber 
                    label="Y" 
                    val={Math.round(selectedElement.y)} 
                    onChange={(v) => updateElementProp('y', Number(v))} 
                    min={0}
                  />
                  <InputNumber 
                    label="Larghezza" 
                    val={selectedElement.width} 
                    onChange={(v) => updateElementProp('width', Number(v))} 
                    min={20}
                  />
                  <InputNumber 
                    label="Altezza" 
                    val={selectedElement.height} 
                    onChange={(v) => updateElementProp('height', Number(v))} 
                    min={20}
                  />
                </div>
              </div>

              {/* Style Section */}
              <div className="property-section">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Stile</label>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">Colore Sfondo</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={selectedElement.styles.backgroundColor === 'transparent' ? '#ffffff' : selectedElement.styles.backgroundColor} 
                        onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                        className="h-8 w-8 cursor-pointer border-0 p-0 rounded overflow-hidden shadow-sm"
                      />
                      <button 
                        onClick={() => updateElementStyle('backgroundColor', 'transparent')}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Trasparente
                      </button>
                    </div>
                  </div>

                  {selectedElement.type === 'text' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700">Colore Testo</span>
                        <input 
                          type="color" 
                          value={selectedElement.styles.color} 
                          onChange={(e) => updateElementStyle('color', e.target.value)}
                          className="h-8 w-8 cursor-pointer border-0 p-0 rounded overflow-hidden shadow-sm"
                        />
                      </div>
                      
                      <div>
                        <span className="text-sm text-slate-700 mb-2 block">Dimensione Font</span>
                        <select 
                          value={selectedElement.styles.fontSize} 
                          onChange={(e) => updateElementStyle('fontSize', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72].map(s => (
                            <option key={s} value={`${s}px`}>{s}px</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <span className="text-sm text-slate-700 mb-2 block">Allineamento</span>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                          {[
                            { value: 'left', icon: <Icon type="AlignLeft" size={16} /> },
                            { value: 'center', icon: <Icon type="AlignCenter" size={16} /> },
                            { value: 'right', icon: <Icon type="AlignRight" size={16} /> }
                          ].map(align => (
                            <button 
                              key={align.value}
                              onClick={() => updateElementStyle('textAlign', align.value)}
                              className={`flex-1 py-2 flex items-center justify-center rounded ${selectedElement.styles.textAlign === align.value ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              {align.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm text-slate-700 mb-2 block">Stile Testo</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateElementStyle('fontWeight', selectedElement.styles.fontWeight === 'bold' ? 'normal' : 'bold')}
                            className={`px-3 py-1 rounded ${selectedElement.styles.fontWeight === 'bold' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-slate-700'}`}
                          >
                            <Icon type="Bold" size={14} />
                          </button>
                          <button 
                            onClick={() => updateElementStyle('fontStyle', selectedElement.styles.fontStyle === 'italic' ? 'normal' : 'italic')}
                            className={`px-3 py-1 rounded ${selectedElement.styles.fontStyle === 'italic' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-slate-700'}`}
                          >
                            <Icon type="Italic" size={14} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedElement.type === 'image' && (
                    <div>
                      <span className="text-sm text-slate-700 mb-2 block">Adattamento Immagine</span>
                      <select 
                        value={selectedElement.styles.objectFit || 'cover'} 
                        onChange={(e) => updateElementStyle('objectFit', e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="cover">Cover (riempie)</option>
                        <option value="contain">Contain (adatta)</option>
                        <option value="fill">Fill (stira)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <span className="text-sm text-slate-700 mb-2 block">Border Radius</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={parseInt(selectedElement.styles.borderRadius) || 0} 
                      onChange={(e) => updateElementStyle('borderRadius', `${e.target.value}px`)}
                      className="w-full accent-indigo-600"
                    />
                    <div className="text-xs text-slate-500 mt-1 flex justify-between">
                      <span>0px</span>
                      <span>{parseInt(selectedElement.styles.borderRadius) || 0}px</span>
                      <span>50px</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="property-section">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Azioni</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={bringToFront}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Icon type="Layers" size={14} /> Porta in Primo Piano
                  </button>
                  <button 
                    onClick={sendToBack}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Icon type="Layers" size={14} /> Manda Sotto
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button 
                    onClick={duplicateElement}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Icon type="Copy" size={14} /> Duplica (Ctrl+D)
                  </button>
                  <button 
                    onClick={deleteElement}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Icon type="Trash2" size={14} /> Elimina
                  </button>
                </div>
              </div>

              {/* Export/Import Element */}
              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs text-slate-500 mb-2">
                  ID: <code className="bg-gray-100 px-1 rounded">{selectedElement.id}</code>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedElement, null, 2));
                      alert('Elemento copiato negli appunti!');
                    }}
                    className="flex-1 text-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-slate-700"
                  >
                    Copia Elemento
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-white border-t border-gray-200 flex items-center justify-between px-4 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>Elementi: {elements.length}</span>
          <span>Selezionato: {selectedElement ? selectedElement.type : 'Nessuno'}</span>
          {selectedElement && (
            <span>Posizione: {Math.round(selectedElement.x)}×{Math.round(selectedElement.y)}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
          <span>Griglia: {showGrid ? 'ON' : 'OFF'}</span>
          <span>Storia: {historyIndex + 1}/{history.length}</span>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ToolButton({ icon, label, onClick, active }) {
  return (
    <button 
      onClick={onClick} 
      className={`group flex flex-col items-center gap-1 p-2 rounded-xl transition-all hover:bg-indigo-50 w-16 ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
    >
      <div className={`p-2 rounded-lg transition-all ${active ? 'bg-white shadow-sm ring-1 ring-indigo-100' : 'group-hover:bg-white group-hover:shadow-sm'}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function SidebarItem({ icon, label, description, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-slate-600 hover:text-indigo-700 group text-left"
    >
      <div className="text-slate-400 group-hover:text-indigo-500 mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
    </button>
  );
}

function InputNumber({ label, val, onChange, min, max }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
        <input 
          type="number" 
          value={val} 
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="w-full text-sm outline-none text-slate-700 bg-transparent"
        />
        <span className="text-xs text-slate-400 ml-2">px</span>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PageBuilder />);
@endverbatim
    </script>
</body>
</html>