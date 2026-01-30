<!DOCTYPE html>
<html lang="it" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $page->title }} - Spotex Code Editor</title>
    
    <!-- Filament-style CSS -->
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&amp;display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
                    },
                    colors: {
                        primary: {
                            50: '#f8fafc',
                            100: '#f1f5f9',
                            200: '#e2e8f0',
                            300: '#cbd5e1',
                            400: '#94a3b8',
                            500: '#64748b',
                            600: '#475569',
                            700: '#334155',
                            800: '#1e293b',
                            900: '#0f172a',
                        },
                        danger: {
                            400: '#f87171',
                            500: '#ef4444',
                            600: '#dc2626',
                        },
                        success: {
                            400: '#34d399',
                            500: '#10b981',
                            600: '#059669',
                        }
                    }
                }
            }
        }
    </script>
    
    <!-- CodeMirror -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/dracula.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/material-darker.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/eclipse.min.css">
    
    <style>
        body, html {
            height: 100%;
            overflow: hidden;
        }
        
        .fi-scrollbars {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }
        
        .fi-scrollbars::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        .fi-scrollbars::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .fi-scrollbars::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.3);
            border-radius: 4px;
        }
        
        .fi-scrollbars::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.5);
        }
        
        .CodeMirror {
            height: 100% !important;
            font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .cm-s-dracula.CodeMirror {
            background: #1e1e2e;
        }
        
        .cm-s-material-darker.CodeMirror {
            background: #212121;
        }
        
        .cm-s-eclipse.CodeMirror {
            background: #ffffff;
        }
        
        .transition-all-200 {
            transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .editor-tab {
            border-bottom: 2px solid transparent;
            transition: all 200ms ease;
        }
        
        .editor-tab.active {
            border-bottom-color: #475569;
            color: #1e293b;
        }
        
        .dark .editor-tab.active {
            border-bottom-color: #94a3b8;
            color: #f1f5f9;
        }
        
        .viewport-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            z-index: 10;
            backdrop-filter: blur(4px);
        }
        
        .preview-frame {
            transform-origin: top left;
            transition: transform 200ms ease;
        }
        
        .editor-container {
            flex: 1;
            overflow: hidden;
            position: relative;
        }
        
        .CodeMirror-scroll {
            min-height: 100%;
            overflow-x: auto;
            overflow-y: auto;
        }
    </style>
</head>
<body class="font-sans antialiased bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 h-screen flex flex-col">
    <!-- Top Navigation -->
    <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
                <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m2 16l4-16M6 9h.01M6 15h.01"></path>
                    </svg>
                </div>
                <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Spotex Code Editor</p>
                </div>
            </div>
            
            <div class="flex items-center gap-2 ml-6">
                <button 
                    onclick="handleUndo()"
                    id="undoBtn"
                    class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                    title="Undo (Ctrl+Z)"
                    disabled
                >
                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                    </svg>
                </button>
                <button 
                    onclick="handleRedo()"
                    id="redoBtn"
                    class="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                    title="Redo (Ctrl+Shift+Z)"
                    disabled
                >
                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l7-7m0 0l-7 7m7-7v18a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        <div class="flex items-center gap-4">
            <!-- Project Title -->
            <input 
                type="text" 
                id="projectTitle"
                value="{{ $page->title }}"
                placeholder="Nome progetto..."
                class="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 transition-colors"
            >
            
            <!-- View Controls -->
            <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button 
                    onclick="setViewport('desktop')"
                    id="viewportDesktop"
                    class="px-3 py-1 rounded text-sm font-medium flex items-center gap-2 transition-colors bg-white dark:bg-gray-800 shadow"
                    title="Desktop (1200px)"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <span class="text-xs">Desktop</span>
                </button>
                <button 
                    onclick="setViewport('tablet')"
                    id="viewportTablet"
                    class="px-3 py-1 rounded text-sm font-medium flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    title="Tablet (768px)"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <span class="text-xs">Tablet</span>
                </button>
                <button 
                    onclick="setViewport('mobile')"
                    id="viewportMobile"
                    class="px-3 py-1 rounded text-sm font-medium flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    title="Mobile (375px)"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <span class="text-xs">Mobile</span>
                </button>
            </div>
            
            <!-- Theme Selector -->
            <select 
                id="editorTheme"
                class="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            >
                <option value="dracula">Dracula</option>
                <option value="material-darker">Material Darker</option>
                <option value="eclipse">Eclipse</option>
            </select>
        </div>
    </header>
    
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Editor Tabs & Controls -->
        <div class="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
            <div class="flex space-x-6">
                <button 
                    onclick="switchTab('html')"
                    id="tab-html"
                    class="editor-tab px-2 py-3 font-medium text-sm flex items-center gap-2 active"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h.01M6 15h.01"></path>
                    </svg>
                    HTML
                </button>
                <button 
                    onclick="switchTab('css')"
                    id="tab-css"
                    class="editor-tab px-2 py-3 font-medium text-sm flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h.01M6 15h.01"></path>
                    </svg>
                    CSS
                </button>
                <button 
                    onclick="switchTab('js')"
                    id="tab-js"
                    class="editor-tab px-2 py-3 font-medium text-sm flex items-center gap-2 text-gray-600 dark:text-gray-400"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"></path>
                    </svg>
                    JavaScript
                </button>
            </div>
            
            <div class="flex items-center gap-3">
                <!-- Auto-Run Toggle -->
                <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input type="checkbox" id="autoRun" class="rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700" checked>
                    Auto-Run
                </label>
                
                <!-- Save Button -->
                <button
                    onclick="saveProject()"
                    id="saveBtn"
                    class="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                    </svg>
                    Salva
                </button>
                
                <!-- Builder Link -->
                <a 
                    href="{{ route('pages.builder', $page) }}"
                    class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
                    </svg>
                    Builder
                </a>
                
                <!-- Run Button -->
                <button 
                    onclick="runCode()"
                    id="runBtn"
                    class="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Esegui
                </button>
            </div>
        </div>
        
        <!-- Split Panels -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Editor Panel -->
            <div class="w-1/2 flex flex-col border-r border-gray-200 dark:border-gray-700 relative overflow-hidden">
                <div id="editor-html" class="flex-1 overflow-hidden"></div>
                <div id="editor-css" class="flex-1 overflow-hidden hidden"></div>
                <div id="editor-js" class="flex-1 overflow-hidden hidden"></div>
                
                <div class="absolute bottom-4 right-4 flex items-center gap-2 bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2">
                    <span class="text-xs text-gray-300" id="lineInfo">Ln 1, Col 1</span>
                    <span class="text-gray-500">|</span>
                    <span class="text-xs text-gray-300" id="fileSize">0 bytes</span>
                </div>
            </div>
            
            <!-- Preview Panel -->
            <div class="w-1/2 bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                <div class="absolute top-0 left-0 bg-gray-800 text-white text-xs px-3 py-1 rounded-br-md z-10 font-mono">
                    LIVE PREVIEW
                </div>
                
                <div class="viewport-badge hidden">1200×800</div>
                
                <div class="absolute top-2 right-2 flex items-center gap-2 z-20">
                    <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button 
                            onclick="changeZoom(0.5)"
                            class="px-2 py-1 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"></path>
                            </svg>
                        </button>
                        <span class="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300" id="zoomLevel">100%</span>
                        <button 
                            onclick="changeZoom(2)"
                            class="px-2 py-1 rounded hover:bg-white dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="w-full h-full overflow-auto p-4">
                    <iframe 
                        id="previewFrame" 
                        class="preview-frame bg-white rounded-lg shadow-lg"
                        style="width: 1200px; height: 800px; min-width: 1200px; min-height: 800px;"
                    ></iframe>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Status Bar -->
    <footer class="h-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 text-xs flex-shrink-0">
        <div class="flex items-center gap-4">
            <span class="text-gray-600 dark:text-gray-400">
                Tab: <span class="font-medium" id="currentTab">HTML</span>
            </span>
            <span class="text-gray-600 dark:text-gray-400">
                Tema: <span class="font-medium" id="currentTheme">Dracula</span>
            </span>
            <span class="text-gray-600 dark:text-gray-400">
                Viewport: <span class="font-medium" id="currentViewport">Desktop</span>
            </span>
        </div>
        <div class="flex items-center gap-4">
            <span class="text-gray-600 dark:text-gray-400">
                Auto-Run: <span class="font-medium" id="autoRunStatus">ON</span>
            </span>
        </div>
    </footer>

    <!-- CodeMirror -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/xml/xml.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/css/css.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/htmlmixed/htmlmixed.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/edit/closetag.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/edit/matchbrackets.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/selection/active-line.min.js"></script>

    <script>
        const PAGE_ID = @json($page->id);
        const PAGE_SLUG = @json($page->slug);
        const API_SAVE_URL = @json(route('pages.code.save', $page));
        const API_SHOW_URL = @json(route('pages.code.show', $page));
        
        let editors = {};
        let historyStack = { html: [], css: [], js: [] };
        let historyIndex = { html: -1, css: -1, js: -1 };
        let currentZoom = 1;
        let currentViewport = 'desktop';
        let isDarkMode = document.documentElement.classList.contains('dark');
        let lastSaveTime = null;
        let autoRunTimeout = null;
        
        const viewportSizes = {
            desktop: { width: 1200, height: 800, label: 'Desktop' },
            tablet: { width: 768, height: 1024, label: 'Tablet' },
            mobile: { width: 375, height: 667, label: 'Mobile' }
        };
        
        // Initialize on load
        document.addEventListener('DOMContentLoaded', function() {
            initEditors();
            loadCurrentFile();
            setupEventListeners();
            updateStatusBar();
        });
        
        function initEditors() {
            const commonConfig = {
                lineNumbers: true,
                lineWrapping: false,
                autoCloseTags: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                styleActiveLine: true,
                theme: isDarkMode ? 'dracula' : 'eclipse',
                extraKeys: {
                    'Ctrl-S': function() { saveProject(); return false; },
                    'Ctrl-Z': function() { handleUndo(); return false; },
                    'Ctrl-Y': function() { handleRedo(); return false; },
                    'Ctrl-Shift-Z': function() { handleRedo(); return false; },
                    'F5': function() { runCode(); return false; },
                    'F11': function() { toggleFullscreen(); return false; }
                }
            };
            
            editors.html = CodeMirror(document.getElementById('editor-html'), {
                ...commonConfig,
                mode: 'htmlmixed',
                value: '',
                placeholder: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>Document</title>\n  </head>\n  <body>\n    <!-- Inizia a scrivere qui -->\n  </body>\n</html>'
            });
            
            editors.css = CodeMirror(document.getElementById('editor-css'), {
                ...commonConfig,
                mode: 'css',
                value: '',
                placeholder: '/* Stili CSS qui */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 0;\n}'
            });
            
            editors.js = CodeMirror(document.getElementById('editor-js'), {
                ...commonConfig,
                mode: 'javascript',
                value: '',
                placeholder: '// Codice JavaScript qui\nconsole.log(\'Hello World!\');\n\ndocument.addEventListener(\'DOMContentLoaded\', function() {\n  // Il tuo codice qui\n});'
            });
            
            // Track changes for undo/redo
            Object.keys(editors).forEach(type => {
                editors[type].on('change', function(instance, change) {
                    saveToHistory(type, instance.getValue());
                    
                    // Update file size
                    updateFileSize();
                    
                    // Auto-run with debounce
                    if (document.getElementById('autoRun').checked) {
                        clearTimeout(autoRunTimeout);
                        autoRunTimeout = setTimeout(runCode, 500);
                    }
                });
                
                editors[type].on('cursorActivity', function(instance) {
                    const cursor = instance.getCursor();
                    document.getElementById('lineInfo').textContent = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
                });
            });
            
            // Set initial theme
            document.getElementById('editorTheme').value = isDarkMode ? 'dracula' : 'eclipse';
            document.getElementById('currentTheme').textContent = isDarkMode ? 'Dracula' : 'Eclipse';
        }
        
        function setupEventListeners() {
            // Auto-run toggle
            document.getElementById('autoRun').addEventListener('change', function(e) {
                const status = e.target.checked ? 'ON' : 'OFF';
                document.getElementById('autoRunStatus').textContent = status;
                if (e.target.checked) {
                    runCode();
                }
            });
            
            // Theme selector
            document.getElementById('editorTheme').addEventListener('change', function(e) {
                const theme = e.target.value;
                Object.values(editors).forEach(editor => {
                    editor.setOption('theme', theme);
                });
                document.getElementById('currentTheme').textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
            });
            
            // Project title
            document.getElementById('projectTitle').addEventListener('change', function(e) {
                document.title = `${e.target.value} - Spotex Code Editor`;
            });
        }
        
        function saveToHistory(type, content) {
            if (historyIndex[type] < historyStack[type].length - 1) {
                historyStack[type] = historyStack[type].slice(0, historyIndex[type] + 1);
            }
            historyStack[type].push(content);
            historyIndex[type] = historyStack[type].length - 1;
            
            updateUndoRedoButtons();
        }
        
        function handleUndo() {
            const currentType = getCurrentTab();
            if (historyIndex[currentType] > 0) {
                historyIndex[currentType]--;
                editors[currentType].setValue(historyStack[currentType][historyIndex[currentType]]);
                updateUndoRedoButtons();
                runCode();
            }
        }
        
        function handleRedo() {
            const currentType = getCurrentTab();
            if (historyIndex[currentType] < historyStack[currentType].length - 1) {
                historyIndex[currentType]++;
                editors[currentType].setValue(historyStack[currentType][historyIndex[currentType]]);
                updateUndoRedoButtons();
                runCode();
            }
        }
        
        function updateUndoRedoButtons() {
            const type = getCurrentTab();
            const undoBtn = document.getElementById('undoBtn');
            const redoBtn = document.getElementById('redoBtn');
            
            undoBtn.disabled = historyIndex[type] <= 0;
            redoBtn.disabled = historyIndex[type] >= historyStack[type].length - 1;
        }
        
        function switchTab(tab) {
            // Update tabs UI
            ['html', 'css', 'js'].forEach(t => {
                const tabBtn = document.getElementById(`tab-${t}`);
                const editor = document.getElementById(`editor-${t}`);
                
                if (t === tab) {
                    tabBtn.classList.add('active');
                    tabBtn.classList.remove('text-gray-600', 'dark:text-gray-400');
                    editor.classList.remove('hidden');
                    editors[t].refresh();
                    editors[t].focus();
                } else {
                    tabBtn.classList.remove('active');
                    tabBtn.classList.add('text-gray-600', 'dark:text-gray-400');
                    editor.classList.add('hidden');
                }
            });
            
            document.getElementById('currentTab').textContent = tab.toUpperCase();
            updateUndoRedoButtons();
        }
        
        function getCurrentTab() {
            return Array.from(document.querySelectorAll('[id^="tab-"]')).find(tab => 
                tab.classList.contains('active')
            )?.id.replace('tab-', '') || 'html';
        }
        
        function runCode() {
            const html = editors.html.getValue();
            const tailwind = `<script src="https://cdn.tailwindcss.com"><\/script>`;
            const css = `<style>${editors.css.getValue()}</style>`;
            const js = `<script>${editors.js.getValue()}<\/script>`;
            
            const frame = document.getElementById('previewFrame');
            const doc = frame.contentDocument || frame.contentWindow.document;
            
            try {
                doc.open();
                doc.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        ${tailwind}
                        ${css}
                    </head>
                    <body class="bg-gray-50">
                        ${html}
                        ${js}
                    </body>
                    </html>
                `);
                doc.close();
                
                // Add viewport meta for mobile/tablet
                if (currentViewport !== 'desktop') {
                    const viewportMeta = doc.createElement('meta');
                    viewportMeta.name = 'viewport';
                    viewportMeta.content = 'width=device-width, initial-scale=1.0';
                    if (doc.head) {
                        doc.head.appendChild(viewportMeta);
                    }
                }
                
                // Update last save time
                lastSaveTime = new Date();
                updateStatusBar();
                
            } catch (error) {
                console.error('Errore esecuzione codice:', error);
            }
        }
        
        function setViewport(mode) {
            currentViewport = mode;
            const size = viewportSizes[mode];
            
            // Update UI
            ['desktop', 'tablet', 'mobile'].forEach(v => {
                const btn = document.getElementById(`viewport${v.charAt(0).toUpperCase() + v.slice(1)}`);
                if (v === mode) {
                    btn.classList.add('bg-white', 'dark:bg-gray-800', 'shadow');
                    btn.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:text-gray-900', 'dark:hover:text-white');
                } else {
                    btn.classList.remove('bg-white', 'dark:bg-gray-800', 'shadow');
                    btn.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:text-gray-900', 'dark:hover:text-white');
                }
            });
            
            // Update iframe size
            const frame = document.getElementById('previewFrame');
            frame.style.width = `${size.width}px`;
            frame.style.height = `${size.height}px`;
            frame.style.minWidth = `${size.width}px`;
            frame.style.minHeight = `${size.height}px`;
            
            // Update badge
            const badge = document.querySelector('.viewport-badge');
            if (badge) {
                badge.textContent = `${size.width}×${size.height}`;
                badge.classList.remove('hidden');
            }
            
            document.getElementById('currentViewport').textContent = size.label;
            
            // Re-run code with new viewport
            runCode();
        }
        
        function changeZoom(factor) {
            if (factor < 1) {
                currentZoom = Math.max(0.25, currentZoom * 0.8);
            } else {
                currentZoom = Math.min(2, currentZoom * 1.25);
            }
            
            const frame = document.getElementById('previewFrame');
            frame.style.transform = `scale(${currentZoom})`;
            
            document.getElementById('zoomLevel').textContent = `${Math.round(currentZoom * 100)}%`;
        }
        
        async function loadCurrentFile() {
            try {
                const response = await fetch(API_SHOW_URL, {
                    headers: { 
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (!response.ok) throw new Error('File non trovato');
                
                const data = await response.json();
                
                // Load into editors
                editors.html.setValue(data.html || '');
                editors.css.setValue(data.css || '');
                editors.js.setValue(data.js || '');
                
                // Update title
                if (data.title && data.title !== document.getElementById('projectTitle').value) {
                    document.getElementById('projectTitle').value = data.title;
                }
                
                // Reset history
                Object.keys(historyStack).forEach(type => {
                    historyStack[type] = [editors[type].getValue()];
                    historyIndex[type] = 0;
                });
                
                updateUndoRedoButtons();
                updateFileSize();
                runCode();
                
            } catch (error) {
                console.error('Errore caricamento file:', error);
                // Show default content
                editors.html.setValue('<!DOCTYPE html>\n<html>\n<head>\n    <title>Nuovo Documento</title>\n</head>\n<body>\n    <h1>Ciao Mondo!</h1>\n    <p>Inizia a scrivere il tuo codice qui.</p>\n</body>\n</html>');
                runCode();
            }
        }
        
        async function saveProject() {
            const title = document.getElementById('projectTitle').value || 'Senza Titolo';
            const payload = {
                title: title,
                html: editors.html.getValue(),
                css: editors.css.getValue(),
                js: editors.js.getValue()
            };
            
            const saveBtn = document.getElementById('saveBtn');
            const originalText = saveBtn.innerHTML;
            
            saveBtn.innerHTML = `
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Salvataggio...
            `;
            saveBtn.disabled = true;
            
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                const response = await fetch(API_SAVE_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Errore salvataggio');
                }
                
                const data = await response.json();
                lastSaveTime = new Date();
                
                // Show success message
                showMessage('success', 'Progetto salvato con successo!');
                
            } catch (error) {
                console.error('Errore salvataggio:', error);
                showMessage('error', `Errore: ${error.message}`);
            } finally {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        }
        
        function updateFileSize() {
            const totalSize = Object.values(editors).reduce((sum, editor) => 
                sum + new Blob([editor.getValue()]).size, 0
            );
            
            let sizeText;
            if (totalSize < 1024) {
                sizeText = `${totalSize} bytes`;
            } else if (totalSize < 1024 * 1024) {
                sizeText = `${(totalSize / 1024).toFixed(1)} KB`;
            } else {
                sizeText = `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
            }
            
            document.getElementById('fileSize').textContent = sizeText;
        }
        
        function updateStatusBar() {
            if (lastSaveTime) {
                const now = new Date();
                const diff = Math.floor((now - lastSaveTime) / 1000);
                
                let timeText;
                if (diff < 60) {
                    timeText = 'Ora';
                } else if (diff < 3600) {
                    timeText = `${Math.floor(diff / 60)} min fa`;
                } else {
                    timeText = lastSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
            }
        }
        
        function showMessage(type, message) {
            // Remove any existing message
            const existing = document.querySelector('.message-toast');
            if (existing) existing.remove();
            
            const colors = {
                success: 'bg-green-600',
                error: 'bg-red-600',
                info: 'bg-blue-600'
            };
            
            const toast = document.createElement('div');
            toast.className = `message-toast fixed top-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-y-0 opacity-100`;
            toast.innerHTML = `
                <div class="flex items-center gap-2">
                    ${type === 'success' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
                    ${type === 'error' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>' : ''}
                    <span class="text-sm font-medium">${message}</span>
                </div>
            `;
            
            document.body.appendChild(toast);
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
        
        function toggleFullscreen() {
            const iframe = document.getElementById('previewFrame');
            if (!document.fullscreenElement) {
                iframe.requestFullscreen().catch(err => {
                    console.error(`Errore fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }
        
        // Initialize viewport
        setViewport('desktop');
        
        // Set up keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveProject();
            }
        });
    </script>
</body>
</html>