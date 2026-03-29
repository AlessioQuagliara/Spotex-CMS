import React from 'react';

const PreviewCatalogContext = React.createContext({
    categories: [],
    products: [],
});

export function PreviewCatalogProvider({ value, children }) {
    return <PreviewCatalogContext.Provider value={value ?? { categories: [], products: [] }}>{children}</PreviewCatalogContext.Provider>;
}

export function usePreviewCatalog() {
    return React.useContext(PreviewCatalogContext);
}
