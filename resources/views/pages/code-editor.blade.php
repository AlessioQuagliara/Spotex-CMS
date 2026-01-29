<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Editor - {{ $page->title }}</title>

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <script src="https://cdn.tailwindcss.com"></script>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/dracula.min.css">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

    <style>
        body { background-color: #1a1a1a; color: #e5e5e5; }
        .CodeMirror { height: 100%; font-family: 'Fira Code', monospace; font-size: 14px; }
        .cm-s-dracula.CodeMirror { background-color: #282a36; }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #1a1a1a; }
        ::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }

        .editor-container { height: calc(100vh - 160px); }
        .preview-frame { background: white; width: 100%; height: 100%; border: none; }
    </style>
</head>
<body class="flex flex-col h-screen overflow-hidden">

    <header class="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 text-gray-900">
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-code text-indigo-600 text-xl"></i>
                <i class="fa-solid fa-pen-to-square text-emerald-600 text-xl"></i>
            </div>
            <h1 class="font-bold text-lg tracking-wide">code-<span class="text-indigo-600">builder</span></h1>
        </div>

        <div class="flex items-center gap-4">
            <input type="text" id="snippetTitle" placeholder="Nome del progetto..." class="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 w-64 transition">

            <button onclick="saveSnippet()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition">
                <i class="fa-solid fa-save"></i> Salva (DB)
            </button>

            <a href="{{ route('pages.builder', $page) }}" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition">
                <i class="fa-solid fa-layer-group"></i> Apri Builder
            </a>
        </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
        <main class="flex-1 flex flex-col min-w-0">
            <div class="bg-gray-900 border-b border-gray-700 p-2 flex justify-between items-center shrink-0">
                <div class="flex space-x-1 bg-gray-800 p-1 rounded">
                    <button onclick="switchTab('html')" id="btn-html" class="tab-btn px-4 py-1.5 rounded text-sm font-medium bg-gray-700 text-white">HTML</button>
                    <button onclick="switchTab('css')" id="btn-css" class="tab-btn px-4 py-1.5 rounded text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700">CSS</button>
                    <button onclick="switchTab('js')" id="btn-js" class="tab-btn px-4 py-1.5 rounded text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700">JS</button>
                </div>
                <div class="flex items-center gap-3">
                     <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input type="checkbox" id="autoPreview" class="rounded bg-gray-700 border-gray-600" checked>
                        Auto-Run
                    </label>
                    <button onclick="updatePreview()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs uppercase font-bold tracking-wide">
                        <i class="fa-solid fa-play mr-1"></i> Run
                    </button>
                </div>
            </div>

            <div class="flex-1 flex overflow-hidden">
                <div class="w-1/2 flex flex-col border-r border-gray-700 relative">
                    <div id="editor-html" class="editor-wrapper h-full w-full absolute inset-0 z-10"></div>
                    <div id="editor-css" class="editor-wrapper h-full w-full absolute inset-0 opacity-0 z-0 pointer-events-none"></div>
                    <div id="editor-js" class="editor-wrapper h-full w-full absolute inset-0 opacity-0 z-0 pointer-events-none"></div>
                </div>

                <div class="w-1/2 bg-white relative">
                    <div class="absolute top-0 left-0 bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-br z-10 font-mono">BROWSER PREVIEW</div>
                    <iframe id="previewFrame" class="preview-frame"></iframe>
                </div>
            </div>
        </main>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/xml/xml.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/css/css.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/htmlmixed/htmlmixed.min.js"></script>

    <script>
        const PAGE_SLUG = @json($page->slug);
        const API_LIST_URL = @json(route('pages.code.list'));
        const API_SHOW_URL = @json(route('pages.code.show', $page));
        const API_SAVE_URL = @json(route('pages.code.save', $page));

        let currentSlug = PAGE_SLUG;
        let editors = {};

        window.onload = function() {
            initEditors();
            loadSnippetList();
        };

        function initEditors() {
            const commonConfig = {
                theme: 'dracula',
                lineNumbers: true,
                lineWrapping: true,
                autoCloseTags: true,
                autoCloseBrackets: true
            };

            editors.html = CodeMirror(document.getElementById('editor-html'), {
                ...commonConfig, mode: 'htmlmixed', value: ''
            });

            editors.css = CodeMirror(document.getElementById('editor-css'), {
                ...commonConfig, mode: 'css', value: ''
            });

            editors.js = CodeMirror(document.getElementById('editor-js'), {
                ...commonConfig, mode: 'javascript', value: ''
            });

            Object.values(editors).forEach(editor => {
                editor.on('change', () => {
                    if(document.getElementById('autoPreview').checked) {
                        updatePreview();
                    }
                });
            });

            loadSnippet(PAGE_SLUG);
        }

        function switchTab(type) {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('bg-gray-700', 'text-white');
                btn.classList.add('text-gray-400');
            });
            const activeBtn = document.getElementById(`btn-${type}`);
            activeBtn.classList.add('bg-gray-700', 'text-white');
            activeBtn.classList.remove('text-gray-400');

            const types = ['html', 'css', 'js'];
            types.forEach(t => {
                const el = document.getElementById(`editor-${t}`);
                if (t === type) {
                    el.style.opacity = '1';
                    el.style.zIndex = '10';
                    el.style.pointerEvents = 'auto';
                    editors[t].refresh();
                    editors[t].focus();
                } else {
                    el.style.opacity = '0';
                    el.style.zIndex = '0';
                    el.style.pointerEvents = 'none';
                }
            });
        }

        function updatePreview() {
            const html = editors.html.getValue();
            const css = `<style>${editors.css.getValue()}</style>`;
            const js = `<script>${editors.js.getValue()}<\/script>`;

            const frame = document.getElementById('previewFrame');
            const doc = frame.contentDocument || frame.contentWindow.document;

            doc.open();
            doc.write(html + css + js);
            doc.close();
        }

        async function loadSnippetList() {
            const listEl = document.getElementById('savedList');
            listEl.innerHTML = '<div class="text-center text-xs text-gray-500 mt-2">Aggiornamento...</div>';

            try {
                const res = await fetch(API_LIST_URL, { headers: { 'Accept': 'application/json' } });
                const pages = await res.json();
                renderList(pages);
            } catch (e) {
                console.error(e);
                listEl.innerHTML = '<div class="text-red-500 text-xs text-center">Errore connessione API</div>';
            }
        }

        function renderList(pages) {
            const listEl = document.getElementById('savedList');
            listEl.innerHTML = '';

            if (pages.length === 0) {
                listEl.innerHTML = '<div class="text-center text-xs text-gray-500 mt-4 italic">Nessuna pagina</div>';
                return;
            }

            pages.forEach(p => {
                const item = document.createElement('div');
                item.className = 'group flex justify-between items-center p-2 rounded hover:bg-gray-700 cursor-pointer text-sm mb-1 transition';
                item.onclick = () => loadSnippet(p.slug);

                const activeClass = (currentSlug === p.slug) ? 'bg-gray-700 border-l-2 border-blue-500' : '';

                item.innerHTML = `
                    <div class="truncate w-40 text-gray-300 group-hover:text-white ${activeClass}">${p.title}</div>
                    <a href="/admin/pages/${p.slug}/code" class="text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition px-2">
                        <i class="fa-solid fa-pen"></i>
                    </a>
                `;
                listEl.appendChild(item);
            });
        }

        async function loadSnippet(slug) {
            try {
            const res = await fetch(`/admin/pages/${slug}/code/show`, { headers: { 'Accept': 'application/json' } });
                const data = await res.json();

            currentSlug = slug;
                document.getElementById('snippetTitle').value = data.title || '';
                editors.html.setValue(data.html || '');
                editors.css.setValue(data.css || '');
                editors.js.setValue(data.js || '');
                updatePreview();

                loadSnippetList();
            } catch (e) {
                alert("Errore caricamento pagina");
            }
        }

        async function saveSnippet() {
            const title = document.getElementById('snippetTitle').value || 'Senza Titolo';
            const payload = {
                title: title,
                html: editors.html.getValue(),
                css: editors.css.getValue(),
                js: editors.js.getValue()
            };

            const btn = document.querySelector('button[onclick="saveSnippet()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvataggio...';

            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                const res = await fetch(`/admin/pages/${currentSlug}/code/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error('Errore salvataggio');
                await res.json();

                loadSnippetList();
                showToast("Pagina salvata con successo!");

            } catch (e) {
                console.error(e);
                alert("Errore durante il salvataggio");
            } finally {
                btn.innerHTML = originalText;
            }
        }

        function showToast(msg) {
            const div = document.createElement('div');
            div.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg text-sm transition transform translate-y-10 opacity-0';
            div.innerText = msg;
            document.body.appendChild(div);

            setTimeout(() => div.classList.remove('translate-y-10', 'opacity-0'), 100);
            setTimeout(() => {
                div.classList.add('translate-y-10', 'opacity-0');
                setTimeout(() => div.remove(), 300);
            }, 3000);
        }
    </script>
</body>
</html>