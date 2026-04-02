import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import presetWebpage from 'grapesjs-preset-webpage';
import basicBlocks from 'grapesjs-blocks-basic';
import formsPlugin from 'grapesjs-plugin-forms';
import exportPlugin from 'grapesjs-plugin-export';

const payloadEl = document.getElementById('grapes-builder-payload');

if (payloadEl) {
    let payload = {};

    try {
        payload = JSON.parse(payloadEl.textContent || '{}');
    } catch (error) {
        console.error('Impossibile leggere payload GrapesJS', error);
    }

    const statusEl = document.getElementById('grapes-status');
    const saveBtn = document.getElementById('grapes-save');
    const undoBtn = document.getElementById('grapes-undo');
    const redoBtn = document.getElementById('grapes-redo');
    const jsTextarea = document.getElementById('grapes-page-js');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    const setStatus = (message, isError = false) => {
        if (!statusEl) {
            return;
        }

        statusEl.textContent = message;
        statusEl.style.color = isError ? '#b91c1c' : '#334155';
    };

    const defaultHtml = '<main style="padding:24px;"><h1>Nuova pagina</h1><p>Inizia a costruire con GrapesJS.</p></main>';
    const initialProjectData = payload?.projectData && typeof payload.projectData === 'object' ? payload.projectData : {};

    const editor = grapesjs.init({
        container: '#gjs',
        fromElement: false,
        height: '100%',
        width: 'auto',
        storageManager: false,
        selectorManager: { componentFirst: true },
        canvas: {
            scripts: ['https://cdn.tailwindcss.com'],
        },
        plugins: [presetWebpage, basicBlocks, formsPlugin, exportPlugin],
        pluginsOpts: {
            [presetWebpage]: {
                blocksBasicOpts: { flexGrid: true },
                modalImportTitle: 'Importa Template',
                modalExportTitle: 'Esporta Template',
                customStyleManager: true,
            },
            [basicBlocks]: {
                flexGrid: true,
            },
        },
    });

    const hasProjectData = Object.keys(initialProjectData).length > 0;

    if (hasProjectData) {
        editor.loadProjectData(initialProjectData);
    } else {
        editor.setComponents(typeof payload.html === 'string' && payload.html !== '' ? payload.html : defaultHtml);
        editor.setStyle(typeof payload.css === 'string' ? payload.css : '');
    }

    if (jsTextarea) {
        jsTextarea.value = typeof payload.js === 'string' ? payload.js : '';
    }

    if (undoBtn) {
        undoBtn.addEventListener('click', () => editor.UndoManager.undo());
    }

    if (redoBtn) {
        redoBtn.addEventListener('click', () => editor.UndoManager.redo());
    }

    const savePage = async () => {
        if (!payload.saveUrl) {
            setStatus('URL di salvataggio non configurato.', true);
            return;
        }

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvataggio...';
        }

        try {
            const response = await fetch(payload.saveUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    schema_version: 'grapesjs-v1',
                    document: {
                        type: 'grapesjs',
                        projectData: editor.getProjectData(),
                    },
                    meta: {
                        editor: 'grapesjs',
                    },
                    html: editor.getHtml(),
                    css: editor.getCss(),
                    js: jsTextarea?.value || '',
                }),
            });

            if (!response.ok) {
                let serverMessage = 'Salvataggio builder fallito';

                try {
                    const data = await response.json();
                    serverMessage = data?.message || serverMessage;
                } catch {
                    // no-op
                }

                throw new Error(serverMessage);
            }

            const now = new Date();
            setStatus(`Salvato alle ${now.toLocaleTimeString('it-IT')}`);
        } catch (error) {
            console.error(error);
            setStatus(error?.message || 'Errore di salvataggio', true);
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Salva';
            }
        }
    };

    if (saveBtn) {
        saveBtn.addEventListener('click', savePage);
    }

    window.addEventListener('keydown', (event) => {
        const isSaveShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's';

        if (!isSaveShortcut) {
            return;
        }

        event.preventDefault();
        savePage();
    });

    let dirtyTimer = null;
    editor.on('update', () => {
        if (dirtyTimer) {
            window.clearTimeout(dirtyTimer);
        }

        dirtyTimer = window.setTimeout(() => {
            setStatus('Modifiche non salvate');
        }, 180);
    });

    if (jsTextarea) {
        jsTextarea.addEventListener('input', () => setStatus('Modifiche non salvate'));
    }

    setStatus('Editor pronto');
}
