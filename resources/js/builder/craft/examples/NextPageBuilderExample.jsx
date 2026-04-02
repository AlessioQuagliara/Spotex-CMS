import React from 'react';
import Editor from '../Editor';
import { createDefaultDocument, deserializePage } from '../utils/defaultDocument';

export default function NextPageBuilderExample() {
    const [loading, setLoading] = React.useState(true);
    const [initialData, setInitialData] = React.useState(null);

    React.useEffect(() => {
        let active = true;

        async function loadPage() {
            try {
                const response = await fetch('/api/page');

                if (!response.ok) {
                    throw new Error('Impossibile caricare la pagina');
                }

                const payload = await response.json();

                if (!active) {
                    return;
                }

                const dbData = payload?.data?.page_tree || payload?.data?.document || payload?.data || null;
                setInitialData(dbData ? deserializePage(dbData) : createDefaultDocument());
            } catch (error) {
                console.error(error);
                if (active) {
                    setInitialData(createDefaultDocument());
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadPage();

        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return <div className="p-6">Caricamento editor...</div>;
    }

    return (
        <div className="h-screen">
            <Editor
                pageId={1}
                pageTitle="Pagina demo"
                pageSlug="demo"
                initialData={initialData}
                initialPreviewCatalog={{ products: [], categories: [] }}
            />
        </div>
    );
}
