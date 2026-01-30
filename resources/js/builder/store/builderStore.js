import { create } from 'zustand';
import { produce } from 'immer';

const MAX_HISTORY = 20;

// Helper per generare ID univoci
const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Funzione ricorsiva per trovare elementi per ID (nel futuro userebbe flatMap o simile)
const findElementById = (elements, id) => {
    for (const el of elements) {
        if (el.id === id) return el;
        if (el.children?.length) {
            const found = findElementById(el.children, id);
            if (found) return found;
        }
    }
    return null;
};

// Funzione ricorsiva per eliminare elemento
const removeElementById = (elements, id) => {
    return elements
        .filter(el => el.id !== id)
        .map(el => ({
            ...el,
            children: el.children ? removeElementById(el.children, id) : []
        }));
};

// Funzione ricorsiva per duplicare elemento
const duplicateElementById = (elements, id, parentId = null) => {
    const elementToClone = findElementById(elements, id);
    if (!elementToClone) return elements;

    const cloned = {
        ...elementToClone,
        id: generateId(),
        children: elementToClone.children?.map(child => ({
            ...child,
            id: generateId()
        })) || []
    };

    if (!parentId) {
        // Root level
        return [...elements, cloned];
    } else {
        // Find parent and add as child
        return elements.map(el => {
            if (el.id === parentId) {
                return { ...el, children: [...(el.children || []), cloned] };
            }
            return {
                ...el,
                children: el.children ? duplicateElementById(el.children, id, parentId) : []
            };
        });
    }
};

export const useBuilderStore = create((set, get) => ({
    // ==================== STATE ====================
    elements: [],
    selectedId: null,
    editingElementId: null,
    
    // History management
    history: [],
    historyIndex: -1,
    
    // UI State
    zoom: 50,
    viewMode: 'desktop',
    darkMode: false,
    isSaving: false,
    
    // Trait & Style data
    traitValues: {},
    customClasses: {},

    // ==================== ACTIONS ====================

    /**
     * Carica dati iniziali
     */
    initialize: (elements, traitValues = {}, customClasses = {}) => {
        set({
            elements,
            traitValues,
            customClasses,
            history: [elements],
            historyIndex: 0,
        });
    },

    /**
     * Aggiunge un elemento al canvas
     */
    addElement: (type, parentId = null) => {
        const newElement = {
            id: generateId(),
            type,
            content: {},
            styles: {},
            children: [],
            x: 0,
            y: 0,
            width: 200,
            height: 100,
        };

        set((state) => {
            const newElements = produce(state.elements, draft => {
                if (!parentId) {
                    // Aggiungi a root
                    draft.push(newElement);
                } else {
                    // Aggiungi come child
                    const parent = findElementById(draft, parentId);
                    if (parent) {
                        parent.children = parent.children || [];
                        parent.children.push(newElement);
                    }
                }
            });

            // Salva in history
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(newElements);
            if (newHistory.length > MAX_HISTORY) newHistory.shift();

            return {
                elements: newElements,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                selectedId: newElement.id,
            };
        });
    },

    /**
     * Seleziona un elemento
     */
    selectElement: (id) => set({ selectedId: id }),

    /**
     * Deseleziona
     */
    deselectElement: () => set({ selectedId: null, editingElementId: null }),

    /**
     * Inizia a modificare un elemento
     */
    startEditingElement: (id) => set({ editingElementId: id }),

    /**
     * Finisce di modificare
     */
    stopEditingElement: () => set({ editingElementId: null }),

    /**
     * Aggiorna un elemento (positione, stili, contenuto, ecc)
     */
    updateElement: (id, updates) => {
        set((state) => {
            const newElements = produce(state.elements, draft => {
                const el = findElementById(draft, id);
                if (el) {
                    Object.assign(el, updates);
                }
            });

            // Salva in history SOLO se è una modifica significativa (drag, resize, ecc)
            // Per velocità, NON salviamo ogni keystroke
            const shouldSaveHistory = updates.x || updates.y || updates.width || updates.height;
            
            if (shouldSaveHistory) {
                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push(newElements);
                if (newHistory.length > MAX_HISTORY) newHistory.shift();

                return {
                    elements: newElements,
                    history: newHistory,
                    historyIndex: newHistory.length - 1,
                };
            }

            return { elements: newElements };
        });
    },

    /**
     * Aggiorna il contenuto di un elemento (testo, ecc)
     */
    updateElementContent: (id, content) => {
        set(produce((state) => {
            const el = findElementById(state.elements, id);
            if (el) {
                el.content = { ...el.content, ...content };
            }
        }));
    },

    /**
     * Elimina un elemento
     */
    deleteElement: (id) => {
        set((state) => {
            const newElements = removeElementById(state.elements, id);
            
            // Salva in history
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(newElements);
            if (newHistory.length > MAX_HISTORY) newHistory.shift();

            return {
                elements: newElements,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                selectedId: null,
            };
        });
    },

    /**
     * Duplica un elemento
     */
    duplicateElement: (id, parentId = null) => {
        set((state) => {
            const newElements = duplicateElementById(state.elements, id, parentId);
            
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(newElements);
            if (newHistory.length > MAX_HISTORY) newHistory.shift();

            return {
                elements: newElements,
                history: newHistory,
                historyIndex: newHistory.length - 1,
            };
        });
    },

    /**
     * Undo
     */
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

    /**
     * Redo
     */
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

    /**
     * Aggiorna un valore di trait per un elemento
     */
    setTraitValue: (elementId, traitName, value) => {
        set(produce((state) => {
            if (!state.traitValues[elementId]) {
                state.traitValues[elementId] = {};
            }
            state.traitValues[elementId][traitName] = value;
        }));
    },

    /**
     * Aggiorna una classe CSS
     */
    setCustomClass: (className, classData) => {
        set(produce((state) => {
            state.customClasses[className] = classData;
        }));
    },

    /**
     * Elimina una classe CSS
     */
    deleteCustomClass: (className) => {
        set(produce((state) => {
            delete state.customClasses[className];
        }));
    },

    // UI Setters
    setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(200, zoom)) }),
    setViewMode: (mode) => set({ viewMode: mode }),
    setDarkMode: (dark) => set({ darkMode: dark }),
    setIsSaving: (saving) => set({ isSaving: saving }),

    // Getter per history checks
    canUndo: () => {
        const state = get();
        return state.historyIndex > 0;
    },

    canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
    },
}));
