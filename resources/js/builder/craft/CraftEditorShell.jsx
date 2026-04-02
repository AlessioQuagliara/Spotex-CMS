import React from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { craftResolver, toolboxComponents } from './resolver';
import { CraftRoot } from './components/CraftRoot';
import { PreviewCatalogProvider } from './context/PreviewCatalogContext';
import { createDefaultDocument, deserializePage } from './utils/defaultDocument';
import { craftDocumentToHtml, craftDocumentToLegacyElements, serializePage } from './utils/serializeCraftDocument';
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
    initialData,
    saveEndpoint,
    autoSaveDelay,
    buildSavePayload,
}) {
    const document = React.useMemo(() => createDefaultDocument(), []);

    const resolvedInitialData = React.useMemo(() => {
        if (initialData && typeof initialData === 'object') {
            return initialData;
        }

        if (initialDocument && typeof initialDocument === 'object') {
            return initialDocument;
        }

        if (Array.isArray(initialElements) && initialElements.length > 0) {
            return { elements: initialElements };
        }

        return null;
    }, [initialData, initialDocument, initialElements]);

    return (
        <PreviewCatalogProvider value={initialPreviewCatalog}>
            <Editor resolver={craftResolver} enabled onRender={RenderNode}>
                <DocumentLoader initialData={resolvedInitialData} initialElements={initialElements} />
                <KeyboardShortcuts />
                <div className="flex h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.15),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] text-slate-900">
                    <Header
                        pageTitle={pageTitle}
                        pageSlug={pageSlug}
                        schemaVersion={schemaVersion}
                        initialModules={initialModules}
                        initialMeta={initialMeta}
                        saveEndpoint={saveEndpoint}
                        autoSaveDelay={autoSaveDelay}
                        buildSavePayload={buildSavePayload}
                    />
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

function Header({ pageTitle, pageSlug, schemaVersion, initialModules, initialMeta, saveEndpoint, autoSaveDelay = 900, buildSavePayload }) {
    const { actions, query, selectedId, canDuplicate, canDelete, nodesSnapshot } = useEditor((state, queryApi) => {
        const currentSelectedId = state.events.selected.values().next().value;
        const selectedNode = currentSelectedId ? state.nodes[currentSelectedId] : null;
        const parentNode = selectedNode?.data?.parent ? state.nodes[selectedNode.data.parent] : null;
        const isRoot = !currentSelectedId || currentSelectedId === 'ROOT';

        return {
            selectedId: currentSelectedId,
            canDelete: Boolean(currentSelectedId && !isRoot),
            nodesSnapshot: state.nodes,
            canDuplicate: Boolean(
                currentSelectedId
                && !isRoot
                && selectedNode
                && parentNode
                && Array.isArray(parentNode.data?.nodes)
                && queryApi.node(currentSelectedId).isDraggable()
            ),
        };
    });
    const [isSaving, setIsSaving] = React.useState(false);
    const isHydratedRef = React.useRef(false);

    const saveRef = React.useRef(async () => {});
    const debouncedTimeoutRef = React.useRef(null);

    const persistDocument = React.useCallback(async () => {
        try {
            setIsSaving(true);
            const serializedDocument = query.serialize();
            const normalizedDocument = typeof serializedDocument === 'string' ? JSON.parse(serializedDocument) : serializedDocument;
            const elements = craftDocumentToLegacyElements(normalizedDocument);
            const pageTree = serializePage(normalizedDocument);
            const html = craftDocumentToHtml(normalizedDocument);
            const css = generateCSS({});
            const csrfToken = window.document.querySelector('meta[name="csrf-token"]')?.content || '';
            const endpoint = saveEndpoint || `/api/pages/${pageSlug}/builder/craft/save`;
            const defaultPayload = {
                schema_version: schemaVersion || 'craft-v1',
                document: normalizedDocument,
                page_tree: pageTree,
                elements,
                modules: initialModules || [],
                meta: initialMeta || {},
                html,
                css,
            };
            const payload = typeof buildSavePayload === 'function'
                ? buildSavePayload({
                    defaultPayload,
                    document: normalizedDocument,
                    pageTree,
                    elements,
                    html,
                    css,
                })
                : defaultPayload;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Salvataggio builder fallito');
            }
        } catch (error) {
            console.error(error);
            window.alert(error.message || 'Errore durante il salvataggio del builder.');
        } finally {
            setIsSaving(false);
        }
    }, [initialMeta, initialModules, pageSlug, query, schemaVersion]);

    React.useEffect(() => {
        saveRef.current = persistDocument;
    }, [persistDocument]);

    React.useEffect(() => () => {
        if (debouncedTimeoutRef.current) {
            window.clearTimeout(debouncedTimeoutRef.current);
        }
    }, []);

    const handleAutoSave = React.useCallback(() => {
        if (debouncedTimeoutRef.current) {
            window.clearTimeout(debouncedTimeoutRef.current);
        }

        debouncedTimeoutRef.current = window.setTimeout(() => {
            saveRef.current();
        }, autoSaveDelay);
    }, [autoSaveDelay]);

    const handleSave = React.useCallback(async () => {
        if (debouncedTimeoutRef.current) {
            window.clearTimeout(debouncedTimeoutRef.current);
            debouncedTimeoutRef.current = null;
        }

        await persistDocument();
        window.alert('Pagina salvata con Craft.js');
    }, [persistDocument]);

    const handleDuplicate = React.useCallback(() => {
        if (!selectedId || selectedId === 'ROOT') {
            return;
        }

        const selectedNode = query.getNode(selectedId);
        const parentId = selectedNode?.data?.parent;

        if (!parentId) {
            return;
        }

        const parentNode = query.getNode(parentId);
        const siblingIds = parentNode?.data?.nodes || [];
        const selectedIndex = siblingIds.indexOf(selectedId);
        const insertionIndex = selectedIndex >= 0 ? selectedIndex + 1 : siblingIds.length;
        const nodeTree = query.node(selectedId).toNodeTree();

        actions.addNodeTree(nodeTree, parentId, insertionIndex);
    }, [actions, query, selectedId]);

    React.useEffect(() => {
        if (!isHydratedRef.current) {
            isHydratedRef.current = true;
            return;
        }

        handleAutoSave();
    }, [handleAutoSave, nodesSnapshot]);

    return (
        <header className="flex h-20 items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 backdrop-blur">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">{pageTitle}</h1>
                <p className="text-sm text-slate-500">/{pageSlug} · {schemaVersion}</p>
            </div>
            <div className="flex items-center gap-3">
                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium" onClick={() => actions.history.undo()}>Undo</button>
                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium" onClick={() => actions.history.redo()}>Redo</button>
                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40" onClick={handleDuplicate} disabled={!canDuplicate}>Duplica</button>
                <button className="rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 disabled:opacity-40" onClick={() => canDelete && actions.delete(selectedId)} disabled={!canDelete}>Elimina</button>
                <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvataggio...' : 'Salva'}</button>
            </div>
        </header>
    );
}

function Toolbox() {
    const { connectors, actions, query, selectedContainerId } = useEditor((state) => {
        const selectedId = state.events.selected.values().next().value;
        const selectedNode = selectedId ? state.nodes[selectedId] : null;
        const selectedIsCanvas = selectedNode?.data?.isCanvas;
        const selectedContainer = selectedIsCanvas ? selectedId : selectedNode?.data?.parent || 'ROOT';

        return {
            selectedContainerId: selectedContainer || 'ROOT',
        };
    });

    const addComponent = React.useCallback((component) => {
        const Component = craftResolver[component.type];

        if (!Component) {
            return;
        }

        const tree = query.parseReactElement(<Component {...component.props} />).toNodeTree();
        actions.addNodeTree(tree, selectedContainerId || 'ROOT');
    }, [actions, query, selectedContainerId]);

    return (
        <aside className="overflow-auto rounded-[28px] border border-white/70 bg-white/80 p-5 backdrop-blur">
            <div className="mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Toolbox</h2>
                <p className="mt-1 text-sm text-slate-600">Trascina i blocchi nel canvas oppure clicca per inserirli.</p>
            </div>
            <div className="space-y-3">
                {toolboxComponents.map((component) => (
                    <ToolboxItem
                        key={component.type}
                        component={component}
                        addComponent={addComponent}
                        create={connectors.create}
                    />
                ))}
            </div>
        </aside>
    );
}

function ToolboxItem({ component, create, addComponent }) {
    const Component = craftResolver[component.type];
    const ref = React.useRef(null);

    React.useEffect(() => {
        if (!Component || !ref.current || typeof create !== 'function') {
            return;
        }

        create(ref.current, <Component {...component.props} />);
    }, [Component, component.props, create]);

    return (
        <button
            ref={ref}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left hover:border-slate-900"
            onClick={() => addComponent(component)}
        >
            <span className="font-medium">{component.label}</span>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Drag</span>
        </button>
    );
}

function Inspector() {
    const { selected, actions, query } = useEditor((state, queryApi) => {
        const currentNodeId = state.events.selected.values().next().value;

        return {
            selected: currentNodeId ? state.nodes[currentNodeId] : null,
            query: queryApi,
        };
    });

    const handleDuplicate = React.useCallback(() => {
        if (!selected || selected.id === 'ROOT') {
            return;
        }

        const selectedNode = query.getNode(selected.id);
        const parentId = selectedNode?.data?.parent;

        if (!parentId) {
            return;
        }

        const parentNode = query.getNode(parentId);
        const siblingIds = parentNode?.data?.nodes || [];
        const selectedIndex = siblingIds.indexOf(selected.id);
        const insertionIndex = selectedIndex >= 0 ? selectedIndex + 1 : siblingIds.length;
        const nodeTree = query.node(selected.id).toNodeTree();

        actions.addNodeTree(nodeTree, parentId, insertionIndex);
    }, [actions, query, selected]);

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
                <div className="flex items-center gap-2">
                    {selected.id !== 'ROOT' ? (
                        <button className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold" onClick={handleDuplicate}>
                            Duplica
                        </button>
                    ) : null}
                    {selected.id !== 'ROOT' ? (
                        <button className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-600" onClick={() => actions.delete(selected.id)}>
                            Elimina
                        </button>
                    ) : null}
                </div>
            </div>
            <div className="mt-4">
                {Settings ? <Settings /> : <p className="text-sm text-slate-600">Nessuna impostazione disponibile.</p>}
            </div>
        </aside>
    );
}

function DocumentLoader({ initialData, initialElements }) {
    const { actions } = useEditor();
    const lastLoadSignatureRef = React.useRef('');

    React.useEffect(() => {
        const dataToLoad = initialData || (initialElements?.length ? { elements: initialElements } : null);
        const fallback = createDefaultDocument();
        const parsedDocument = dataToLoad ? deserializePage(dataToLoad) : fallback;
        const signature = JSON.stringify(parsedDocument);

        if (signature === lastLoadSignatureRef.current) {
            return;
        }

        lastLoadSignatureRef.current = signature;
        actions.deserialize(signature);
    }, [actions, initialData, initialElements]);

    return null;
}

function KeyboardShortcuts() {
    const { actions, query, selectedId } = useEditor((state) => ({
        selectedId: state.events.selected.values().next().value,
    }));

    React.useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key !== 'Delete' && event.key !== 'Backspace') {
                return;
            }

            const target = event.target;

            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

            if (!selectedId || selectedId === 'ROOT') {
                return;
            }

            const selectedNode = query.getNode(selectedId);

            if (!selectedNode?.data?.parent) {
                return;
            }

            event.preventDefault();
            actions.delete(selectedId);
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [actions, query, selectedId]);

    return null;
}

function RenderNode({ render }) {
    return render;
}
