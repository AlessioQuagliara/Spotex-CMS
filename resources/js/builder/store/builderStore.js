import { create } from 'zustand';
import { produce } from 'immer';
import { appendHistory } from './helpers/history';
import { generateElementId } from './helpers/id';
import {
    duplicateElementById,
    findElementById,
    removeElementById,
} from './helpers/treeOperations';

const HISTORY_TRIGGER_KEYS = ['x', 'y', 'width', 'height'];

const createElement = (type) => ({
    id: generateElementId(),
    type,
    content: {},
    styles: {},
    children: [],
    x: 0,
    y: 0,
    width: 200,
    height: 100,
});

const hasHistoryTriggerUpdate = (updates) =>
    HISTORY_TRIGGER_KEYS.some((key) => Object.prototype.hasOwnProperty.call(updates, key));

export const useBuilderStore = create((set, get) => ({
    elements: [],
    selectedId: null,
    editingElementId: null,
    history: [],
    historyIndex: -1,
    zoom: 50,
    viewMode: 'desktop',
    darkMode: false,
    isSaving: false,
    traitValues: {},
    customClasses: {},
    schemaVersion: 'craft-v1',
    builderDocument: {},
    builderModules: [],
    builderMeta: {},

    initialize: (elements, traitValues = {}, customClasses = {}, builderPayload = {}) => {
        set({
            elements,
            traitValues,
            customClasses,
            schemaVersion: builderPayload.schemaVersion || 'craft-v1',
            builderDocument: builderPayload.document || {},
            builderModules: builderPayload.modules || [],
            builderMeta: builderPayload.meta || {},
            history: [elements],
            historyIndex: 0,
        });
    },

    addElement: (type, parentId = null) => {
        const newElement = createElement(type);

        set((state) => {
            const newElements = produce(state.elements, (draft) => {
                if (!parentId) {
                    draft.push(newElement);
                } else {
                    const parent = findElementById(draft, parentId);
                    if (parent) {
                        parent.children = parent.children || [];
                        parent.children.push(newElement);
                    }
                }
            });

            return {
                elements: newElements,
                ...appendHistory(state.history, state.historyIndex, newElements),
                selectedId: newElement.id,
            };
        });
    },

    selectElement: (id) => set({ selectedId: id }),
    deselectElement: () => set({ selectedId: null, editingElementId: null }),
    startEditingElement: (id) => set({ editingElementId: id }),
    stopEditingElement: () => set({ editingElementId: null }),

    updateElement: (id, updates) => {
        set((state) => {
            const newElements = produce(state.elements, (draft) => {
                const el = findElementById(draft, id);
                if (el) {
                    Object.assign(el, updates);
                }
            });

            if (hasHistoryTriggerUpdate(updates)) {
                return {
                    elements: newElements,
                    ...appendHistory(state.history, state.historyIndex, newElements),
                };
            }

            return { elements: newElements };
        });
    },

    updateElementContent: (id, content) => {
        set(produce((state) => {
            const el = findElementById(state.elements, id);
            if (el) {
                el.content = { ...el.content, ...content };
            }
        }));
    },

    deleteElement: (id) => {
        set((state) => {
            const newElements = removeElementById(state.elements, id);

            return {
                elements: newElements,
                ...appendHistory(state.history, state.historyIndex, newElements),
                selectedId: null,
            };
        });
    },

    duplicateElement: (id, parentId = null) => {
        set((state) => {
            const newElements = duplicateElementById(state.elements, id, parentId);

            return {
                elements: newElements,
                ...appendHistory(state.history, state.historyIndex, newElements),
            };
        });
    },

    undo: () => {
        set((state) => {
            if (state.historyIndex > 0) {
                const newIndex = state.historyIndex - 1;
                return {
                    elements: state.history[newIndex],
                    historyIndex: newIndex,
                    selectedId: null,
                };
            }
            return state;
        });
    },

    redo: () => {
        set((state) => {
            if (state.historyIndex < state.history.length - 1) {
                const newIndex = state.historyIndex + 1;
                return {
                    elements: state.history[newIndex],
                    historyIndex: newIndex,
                    selectedId: null,
                };
            }
            return state;
        });
    },

    setTraitValue: (elementId, traitName, value) => {
        set(produce((state) => {
            if (!state.traitValues[elementId]) {
                state.traitValues[elementId] = {};
            }
            state.traitValues[elementId][traitName] = value;
        }));
    },

    setCustomClass: (className, classData) => {
        set(produce((state) => {
            state.customClasses[className] = classData;
        }));
    },

    deleteCustomClass: (className) => {
        set(produce((state) => {
            delete state.customClasses[className];
        }));
    },

    setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(200, zoom)) }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setDarkMode: (dark) => set({ darkMode: dark }),
    setIsSaving: (saving) => set({ isSaving: saving }),

    canUndo: () => {
        const state = get();
        return state.historyIndex > 0;
    },

    canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
    },
}));
