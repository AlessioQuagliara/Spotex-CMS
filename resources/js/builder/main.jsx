import React from 'react';
import ReactDOM from 'react-dom/client';
import BuilderApp from './BuilderApp';
import './styles/globals.css'; // Creeremo questo file

const rootElement = document.getElementById('builder-root');

if (rootElement) {
    const pageId = rootElement.getAttribute('data-page-id');
    const pageTitle = rootElement.getAttribute('data-page-title');
    const pageSlug = rootElement.getAttribute('data-page-slug');
    const schemaVersion = rootElement.getAttribute('data-schema-version') || 'craft-v1';
    
    let initialDocument = {};
    let initialElements = [];
    let initialModules = [];
    let initialMeta = {};
    let initialPreviewCatalog = { categories: [], products: [] };
    let initialTraitValues = {};
    let initialCustomClasses = {};
    
    try {
        const documentData = rootElement.getAttribute('data-initial-document');
        const elementsData = rootElement.getAttribute('data-initial-elements');
        const modulesData = rootElement.getAttribute('data-initial-modules');
        const metaData = rootElement.getAttribute('data-initial-meta');
        const previewCatalogData = rootElement.getAttribute('data-preview-catalog');
        const traitsData = rootElement.getAttribute('data-initial-traits');
        const classesData = rootElement.getAttribute('data-initial-classes');
        
        initialDocument = documentData ? JSON.parse(documentData) : {};
        initialElements = elementsData ? JSON.parse(elementsData) : [];
        initialModules = modulesData ? JSON.parse(modulesData) : [];
        initialMeta = metaData ? JSON.parse(metaData) : {};
        initialPreviewCatalog = previewCatalogData ? JSON.parse(previewCatalogData) : { categories: [], products: [] };
        initialTraitValues = traitsData ? JSON.parse(traitsData) : {};
        initialCustomClasses = classesData ? JSON.parse(classesData) : {};
    } catch (e) {
        console.error("Errore nel parsing dei dati iniziali:", e);
    }

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <BuilderApp 
                pageId={pageId}
                pageTitle={pageTitle}
                pageSlug={pageSlug}
                schemaVersion={schemaVersion}
                initialDocument={initialDocument}
                initialElements={initialElements}
                initialModules={initialModules}
                initialMeta={initialMeta}
                initialPreviewCatalog={initialPreviewCatalog}
                initialTraitValues={initialTraitValues}
                initialCustomClasses={initialCustomClasses}
            />
        </React.StrictMode>
    );
}
