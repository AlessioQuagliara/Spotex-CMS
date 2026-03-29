import React from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { craftResolver, toolboxComponents } from './resolver';
import { CraftRoot } from './components/CraftRoot';
import { PreviewCatalogProvider } from './context/PreviewCatalogContext';
import { createDefaultDocument, legacyElementsToCraftDocument } from './utils/defaultDocument';
import { craftDocumentToHtml, craftDocumentToLegacyElements } from './utils/serializeCraftDocument';
import { generateCSS } from '../utils/serializer';

export default function CraftEditorShell({
    pageId,
    pageTitle,
    pageSlug,
    schemaVersion,
    initialDocument,
    initialElements,
    initialModules,
    initialMeta,
    initialPreviewCatalog,
}) {
    const document = React.useMemo(() => {
        if (initialDocument && Object.keys(initialDocument).length > 0) {
            return initialDocument;
        }

        if (initialElements?.length) {
            return legacyElementsToCraftDocument(initialElements);
        }

        return createDefaultDocument();
    }, [initialDocument, initialElements]);

    return (
        <PreviewCatalogProvider value={initialPreviewCatalog}>
            <Editor resolver={craftResolver} enabled onRender={RenderNode}>
                <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.15),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] text-slate-900">
                    <Header pageTitle={pageTitle} pageSlug={pageSlug} schemaVersion={schemaVersion} initialModules={initialModules} initialMeta={initialMeta} initialElements={initialElements} />
                    <div className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_320px] gap-4 overflow-hidden p-4">
                        <Toolbox />
                        <div className="overflow-auto rounded-[28px] border border-white/70 bg-white/60 p-6 backdrop-blur">
                            <Frame data={document}>
                                <Element is={CraftRoot} canvas />
                            </Frame>
                        </div>
                        <Inspector />
                    </div>
                </div>
            </Editor>
        </PreviewCatalogProvider>
    );
}

function Header({ pageTitle, pageSlug, schemaVersion, initialModules, initialMeta, initialElements }) {
    const { actions, query } = useEditor();
    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const serializedDocument = query.serialize();
            const normalizedDocument = typeof serializedDocument === 'string' ? JSON.parse(serializedDocument) : serializedDocument;
            const elements = craftDocumentToLegacyElements(normalizedDocument);
            const html = craftDocumentToHtml(normalizedDocument);
            const css = generateCSS({});
            const csrfToken = window.document.querySelector('meta[name="csrf-token"]')?.content || '';

            const response = await fetch(`/api/pages/${pageSlug}/builder/craft/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    schema_version: schemaVersion || 'craft-v1',
                    document: normalizedDocument,
                    elements,
                    modules: initialModules || [],
                    meta: initialMeta || {},
                    html,
                    css,
                }),
            });

            if (!response.ok) {
                throw new Error('Salvataggio builder fallito');
            }

            window.alert('Pagina salvata con Craft.js');
        } catch (error) {
            console.error(error);
            window.alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <header className="flex h-20 items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 backdrop-blur">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">{pageTitle}</h1>
                <p className="text-sm text-slate-500">/{pageSlug} · {schemaVersion}</p>
            </div>
            <div className="flex items-center gap-3">
                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium" onClick={() => actions.history.undo()}>Undo</button>
                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium" onClick={() => actions.history.redo()}>Redo</button>
                <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvataggio...' : 'Salva'}</button>
            </div>
        </header>
    );
}

function Toolbox() {
    const { query, actions } = useEditor();

    const addComponent = (component) => {
        const Component = craftResolver[component.type];
        const tree = query.parseReactElement(<Component {...component.props} />).toNodeTree();
        actions.addNodeTree(tree, 'ROOT');
    };

    return (
        <aside className="overflow-auto rounded-[28px] border border-white/70 bg-white/80 p-5 backdrop-blur">
            <div className="mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Toolbox</h2>
                <p className="mt-1 text-sm text-slate-600">Moduli base riutilizzabili e rimpiazzabili.</p>
            </div>
            <div className="space-y-3">
                {toolboxComponents.map((component) => (
                    <button
                        key={component.type}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left hover:border-slate-900"
                        onClick={() => addComponent(component)}
                    >
                        <span className="font-medium">{component.label}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Add</span>
                    </button>
                ))}
            </div>
        </aside>
    );
}

function Inspector() {
    const { selected, actions } = useEditor((state) => {
        const currentNodeId = state.events.selected.values().next().value;
        return {
            selected: currentNodeId ? state.nodes[currentNodeId] : null,
        };
    });

    if (!selected) {
        return (
            <aside className="overflow-auto rounded-[28px] border border-white/70 bg-white/80 p-5 backdrop-blur">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Inspector</h2>
                <p className="mt-3 text-sm text-slate-600">Seleziona un modulo nel canvas per modificarne le props.</p>
            </aside>
        );
    }

    const Settings = selected.data.related?.settings;

    return (
        <aside className="overflow-auto rounded-[28px] border border-white/70 bg-white/80 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Inspector</h2>
                    <p className="mt-1 text-sm text-slate-800">{selected.data.displayName || selected.data.name}</p>
                </div>
                {selected.id !== 'ROOT' ? (
                    <button className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-600" onClick={() => actions.delete(selected.id)}>
                        Delete
                    </button>
                ) : null}
            </div>
            <div className="mt-4">
                {Settings ? <Settings /> : <p className="text-sm text-slate-600">Nessuna impostazione disponibile.</p>}
            </div>
        </aside>
    );
}

function RenderNode({ render }) {
    return render;
}
