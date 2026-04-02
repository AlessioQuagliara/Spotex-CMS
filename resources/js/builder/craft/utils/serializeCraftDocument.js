function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function craftDocumentToLegacyElements(document) {
    if (!document || typeof document !== 'object' || !document.ROOT) {
        return [];
    }

    return (document.ROOT.nodes || [])
        .map((nodeId, index) => mapNodeToLegacyElement(document, nodeId, index))
        .filter(Boolean);
}

export function craftDocumentToHtml(document) {
    if (!document || typeof document !== 'object' || !document.ROOT) {
        return '';
    }

    return (document.ROOT.nodes || [])
        .map((nodeId) => renderNode(document, nodeId))
        .join('\n');
}

function mapNodeToLegacyElement(document, nodeId, index) {
    const node = document[nodeId];

    if (!node) {
        return null;
    }

    const type = node.type?.resolvedName || 'TextBlock';
    const props = node.props || {};

    return {
        id: nodeId,
        type: mapCraftTypeToLegacyType(type),
        content: {
            text: props.text,
            label: props.label,
            href: props.href,
            src: props.src,
            alt: props.alt,
            html: props.html,
        },
        styles: {
            backgroundColor: props.background,
            color: props.color,
            borderRadius: props.radius ? `${props.radius}px` : undefined,
            padding: props.padding ? `${props.padding}px` : undefined,
        },
        x: 0,
        y: index * 120,
        width: null,
        height: null,
        children: (node.nodes || []).map((childId, childIndex) => mapNodeToLegacyElement(document, childId, childIndex)).filter(Boolean),
    };
}

function renderNode(document, nodeId) {
    const node = document[nodeId];

    if (!node) {
        return '';
    }

    const type = node.type?.resolvedName || 'TextBlock';
    const props = node.props || {};
    const children = (node.nodes || []).map((childId) => renderNode(document, childId)).join('');

    switch (type) {
        case 'SectionBlock':
            return `<section style="background:${escapeHtml(props.background || '#ffffff')};padding:${Number(props.padding || 24)}px;border-radius:${Number(props.radius || 16)}px;">${children}</section>`;
        case 'ButtonBlock':
            return `<a href="${escapeHtml(props.href || '#')}" style="display:inline-flex;background:${escapeHtml(props.background || '#0f172a')};color:${escapeHtml(props.color || '#ffffff')};border-radius:${Number(props.radius || 999)}px;padding:12px 20px;text-decoration:none;font-weight:600;">${escapeHtml(props.label || 'Button')}</a>`;
        case 'ImageBlock':
            return `<img src="${escapeHtml(props.src || '')}" alt="${escapeHtml(props.alt || '')}" style="width:100%;border-radius:${Number(props.radius || 24)}px;" />`;
        case 'ProductGridBlock':
            return `<section data-module="product-grid"><h2>${escapeHtml(props.heading || 'Griglia prodotti')}</h2><div>${escapeHtml(props.emptyText || 'Nessun prodotto disponibile.')}</div></section>`;
        case 'CategoryFeedBlock':
            return `<section data-module="category-feed"><h2>${escapeHtml(props.heading || 'Categorie in evidenza')}</h2><div>${escapeHtml(props.emptyText || 'Nessuna categoria disponibile.')}</div></section>`;
        case 'CraftRoot':
            return children;
        case 'HtmlBlock':
            return props.html || '';
        case 'TextBlock':
        default:
            return `<div style="color:${escapeHtml(props.color || '#111827')};font-size:${Number(props.fontSize || 18)}px;">${escapeHtml(props.text || '')}</div>`;
    }
}

function mapCraftTypeToLegacyType(type) {
    switch (type) {
        case 'ButtonBlock':
            return 'button';
        case 'ImageBlock':
            return 'image';
        case 'SectionBlock':
            return 'container';
        case 'ProductGridBlock':
            return 'product-grid';
        case 'CategoryFeedBlock':
            return 'category-feed';
        case 'HtmlBlock':
            return 'html-block';
        case 'TextBlock':
        case 'CraftRoot':
        default:
            return 'text';
    }
}
