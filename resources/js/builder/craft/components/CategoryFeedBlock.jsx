import React from 'react';
import { useNode } from '@craftjs/core';
import { usePreviewCatalog } from '../context/PreviewCatalogContext';

export function CategoryFeedBlock({ heading, parentCategoryId, limit, emptyText }) {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((node) => ({
        selected: node.events.selected,
    }));
    const { categories } = usePreviewCatalog();

    const visibleCategories = React.useMemo(() => {
        const normalizedLimit = Math.max(1, Number(limit) || 6);
        const normalizedParentId = parentCategoryId ? Number(parentCategoryId) : null;

        return categories
            .filter((category) => (normalizedParentId ? Number(category.parent_id) === normalizedParentId : true))
            .slice(0, normalizedLimit);
    }, [categories, limit, parentCategoryId]);

    return (
        <section ref={(ref) => connect(drag(ref))} className={`grid gap-4 rounded-[28px] border bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 ${selected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200'}`}>
            <div>
                <h3 className="text-2xl font-semibold text-slate-900">{heading}</h3>
                <p className="text-sm text-slate-500">Anteprima dati reali dalle categorie pubbliche.</p>
            </div>
            {visibleCategories.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {visibleCategories.map((category) => (
                        <article key={category.id} className="rounded-3xl border border-sky-100 bg-white/80 p-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-sky-600">{category.products_count} prodotti</div>
                            <div className="mt-2 text-lg font-semibold text-slate-900">{category.name}</div>
                            <p className="mt-2 text-sm text-slate-600">{category.description || 'Vai alla categoria.'}</p>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">{emptyText}</div>
            )}
        </section>
    );
}

function CategoryFeedSettings() {
    const { categories } = usePreviewCatalog();
    const { actions: { setProp }, heading, parentCategoryId, limit, emptyText } = useNode((node) => ({
        heading: node.data.props.heading,
        parentCategoryId: node.data.props.parentCategoryId,
        limit: node.data.props.limit,
        emptyText: node.data.props.emptyText,
    }));

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                Titolo
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={heading} onChange={(event) => setProp((props) => { props.heading = event.target.value; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Categoria padre
                <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={parentCategoryId || ''} onChange={(event) => setProp((props) => { props.parentCategoryId = event.target.value ? Number(event.target.value) : null; })}>
                    <option value="">Qualsiasi livello</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Numero categorie
                <input type="number" min="1" max="24" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={limit} onChange={(event) => setProp((props) => { props.limit = Number(event.target.value) || 6; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Testo fallback
                <textarea className="mt-1 min-h-[90px] w-full rounded border border-slate-300 px-3 py-2" value={emptyText} onChange={(event) => setProp((props) => { props.emptyText = event.target.value; })} />
            </label>
        </div>
    );
}

CategoryFeedBlock.craft = {
    displayName: 'CategoryFeedBlock',
    props: {
        heading: 'Categorie in evidenza',
        parentCategoryId: null,
        limit: 6,
        emptyText: 'Nessuna categoria disponibile.',
    },
    related: {
        settings: CategoryFeedSettings,
    },
};
