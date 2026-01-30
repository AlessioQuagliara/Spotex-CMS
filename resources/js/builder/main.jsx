import React from 'react';
import ReactDOM from 'react-dom/client';
import BuilderApp from './BuilderApp';
import './styles/globals.css'; // Creeremo questo file

const rootElement = document.getElementById('builder-root');

if (rootElement) {
    const pageId = rootElement.getAttribute('data-page-id');
    const pageTitle = rootElement.getAttribute('data-page-title');
    const pageSlug = rootElement.getAttribute('data-page-slug');
    
    let initialElements = [];
    let initialTraitValues = {};
    let initialCustomClasses = {};
    
    try {
        const elementsData = rootElement.getAttribute('data-initial-elements');
        const traitsData = rootElement.getAttribute('data-initial-traits');
        const classesData = rootElement.getAttribute('data-initial-classes');
        
        initialElements = elementsData ? JSON.parse(elementsData) : [];
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
                initialElements={initialElements}
                initialTraitValues={initialTraitValues}
                initialCustomClasses={initialCustomClasses}
            />
        </React.StrictMode>
    );
}
