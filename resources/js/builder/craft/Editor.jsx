import React from 'react';
import CraftEditorShell from './CraftEditorShell';

export default function Editor({
    pageId,
    pageTitle,
    pageSlug,
    schemaVersion = 'craft-v1',
    initialData,
    initialDocument,
    initialElements,
    initialModules,
    initialMeta,
    initialPreviewCatalog,
}) {
    return (
        <CraftEditorShell
            pageId={pageId}
            pageTitle={pageTitle}
            pageSlug={pageSlug}
            schemaVersion={schemaVersion}
            initialData={initialData}
            initialDocument={initialDocument}
            initialElements={initialElements}
            initialModules={initialModules}
            initialMeta={initialMeta}
            initialPreviewCatalog={initialPreviewCatalog}
        />
    );
}
