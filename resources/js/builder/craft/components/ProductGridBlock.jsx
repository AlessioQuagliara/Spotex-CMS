import React from 'react';
import { useNode } from '@craftjs/core';
import { usePreviewCatalog } from '../context/PreviewCatalogContext';

export function ProductGridBlock({ heading, categoryId, limit, columns, sortBy, emptyText }) {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((node) => ({
        selected: node.events.selected,
    }));
    const { products } = usePreviewCatalog();

    const visibleProducts = React.useMemo(() => {
        const normalizedLimit = Math.max(1, Number(limit) || 6);
        const normalizedCategoryId = categoryId ? Number(categoryId) : null;

        const sorted = [...products]
            .filter((product) => (normalizedCategoryId ? Number(product.category_id) === normalizedCategoryId : true))
            .sort((left, right) => {
                if (sortBy === 'price_asc') {
                    return Number(left.price) - Number(right.price);
                }
                if (sortBy === 'price_desc') {
                    return Number(right.price) - Number(left.price);
                }
                if (sortBy === 'name') {
                    return left.name.localeCompare(right.name);
                }

                return Number(right.id) - Number(left.id);
            });

        return sorted.slice(0, normalizedLimit);
    }, [categoryId, limit, products, sortBy]);

    return (
        <section ref={(ref) => connect(drag(ref))} className={`grid gap-4 rounded-[28px] border bg-white p-5 ${selected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200'}`}>
            <div>
                <h3 className="text-2xl font-semibold text-slate-900">{heading}</h3>
                <p className="text-sm text-slate-500">Anteprima dati reali dal catalogo prodotti.</p>
            </div>
            {visibleProducts.length > 0 ? (
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(4, Number(columns) || 3))}, minmax(0, 1fr))` }}>
                    {visibleProducts.map((product) => (
                        <article key={product.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 p-4">
                            {product.image ? <img src={product.image} alt={product.name} className="aspect-[4/3] w-full rounded-2xl object-cover" /> : null}
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{product.category_name || 'Catalogo'}</div>
                            <div className="text-lg font-semibold text-slate-900">{product.name}</div>
                            <p className="text-sm text-slate-600">{product.description || 'Nessuna descrizione disponibile.'}</p>
                            <div className="text-sm font-semibold text-slate-900">EUR {Number(product.price).toFixed(2)}</div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">{emptyText}</div>
            )}
        </section>
    );
}

function ProductGridSettings() {
    const { categories } = usePreviewCatalog();
    const { actions: { setProp }, heading, categoryId, limit, columns, sortBy, emptyText } = useNode((node) => ({
        heading: node.data.props.heading,
        categoryId: node.data.props.categoryId,
        limit: node.data.props.limit,
        columns: node.data.props.columns,
        sortBy: node.data.props.sortBy,
        emptyText: node.data.props.emptyText,
    }));

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                Titolo
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={heading} onChange={(event) => setProp((props) => { props.heading = event.target.value; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Categoria
                <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={categoryId || ''} onChange={(event) => setProp((props) => { props.categoryId = event.target.value ? Number(event.target.value) : null; })}>
                    <option value="">Tutte le categorie</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Ordinamento
                <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={sortBy} onChange={(event) => setProp((props) => { props.sortBy = event.target.value; })}>
                    <option value="latest">Ultimi arrivi</option>
                    <option value="name">Nome</option>
                    <option value="price_asc">Prezzo crescente</option>
                    <option value="price_desc">Prezzo decrescente</option>
                </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Numero prodotti
                <input type="number" min="1" max="24" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={limit} onChange={(event) => setProp((props) => { props.limit = Number(event.target.value) || 6; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Colonne
                <input type="number" min="1" max="4" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={columns} onChange={(event) => setProp((props) => { props.columns = Number(event.target.value) || 3; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Testo fallback
                <textarea className="mt-1 min-h-[90px] w-full rounded border border-slate-300 px-3 py-2" value={emptyText} onChange={(event) => setProp((props) => { props.emptyText = event.target.value; })} />
            </label>
        </div>
    );
}

ProductGridBlock.craft = {
    displayName: 'ProductGridBlock',
    props: {
        heading: 'Griglia prodotti',
        categoryId: null,
        limit: 6,
        columns: 3,
        sortBy: 'latest',
        emptyText: 'Nessun prodotto disponibile.',
    },
    related: {
        settings: ProductGridSettings,
    },
    rules: {
        canDrop: () => false,
    },
};
