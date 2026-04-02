function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function serializePage(document) {
    if (!document || typeof document !== 'object' || !document.ROOT) {
        return {
            root: {
                type: 'Container',
                props: {
                    background: '#ffffff',
                    padding: 24,
                    width: '100%',
                },
                nodes: [],
            },
        };
    }

    const root = document.ROOT;

    return {
        root: {
            type: 'Container',
            props: {
                background: root.props?.background || '#ffffff',
                padding: Number(root.props?.padding || 24),
                width: root.props?.width || '100%',
            },
            nodes: (root.nodes || [])
                .map((nodeId) => mapNodeToCleanTree(document, nodeId))
                .filter(Boolean),
        },
    };
}

export function craftDocumentToLegacyElements(document) {
    if (!document || typeof document !== 'object' || !document.ROOT) {
        return [];
    }

    return (document.ROOT.nodes || [])
        .map((nodeId, index) => mapNodeToLegacyElement(document, nodeId, index))
        .filter(Boolean);
}

function mapNodeToCleanTree(document, nodeId) {
    const node = document[nodeId];

    if (!node) {
        return null;
    }

    const type = mapCraftTypeToCleanType(node.type?.resolvedName || 'TextBlock');
    const props = sanitizeNodeProps(node.type?.resolvedName || 'TextBlock', node.props || {});

    return {
        type,
        props,
        nodes: (node.nodes || []).map((childId) => mapNodeToCleanTree(document, childId)).filter(Boolean),
    };
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
    const legacyType = mapCraftTypeToLegacyType(type);
    const isHtmlBlock = legacyType === 'html-block';

    return {
        id: nodeId,
        type: legacyType,
        content: isHtmlBlock
            ? resolveHtmlProp(props)
            : {
                text: props.text,
                label: props.label,
                href: props.href,
                src: props.src,
                alt: props.alt,
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
        case 'HtmlBlock':
            return resolveHtmlProp(props);
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

function mapCraftTypeToCleanType(type) {
    switch (type) {
        case 'SectionBlock':
        case 'Container':
            return 'Container';
        case 'TextBlock':
        case 'Text':
            return 'Text';
        case 'ImageBlock':
        case 'Image':
            return 'Image';
        case 'ButtonBlock':
        case 'Button':
            return 'Button';
        case 'HtmlBlock':
            return 'HtmlBlock';
        case 'ProductGridBlock':
            return 'ProductGridBlock';
        case 'CategoryFeedBlock':
            return 'CategoryFeedBlock';
        default:
            return 'Text';
    }
}

function sanitizeNodeProps(type, props) {
    if (type === 'SectionBlock' || type === 'Container') {
        return {
            background: props.background || '#ffffff',
            padding: Number(props.padding || 24),
            radius: Number(props.radius || 16),
            border: props.border || '1px solid #e2e8f0',
        };
    }

    if (type === 'TextBlock' || type === 'Text') {
        return {
            text: props.text || '',
            color: props.color || '#111827',
            fontSize: Number(props.fontSize || 18),
        };
    }

    if (type === 'ImageBlock' || type === 'Image') {
        return {
            src: props.src || '',
            alt: props.alt || '',
            radius: Number(props.radius || 24),
            width: props.width || '100%',
            height: props.height || 'auto',
        };
    }

    if (type === 'ButtonBlock' || type === 'Button') {
        return {
            label: props.label || 'Pulsante',
            href: props.href || '#',
            background: props.background || '#0f172a',
            color: props.color || '#ffffff',
            radius: Number(props.radius || 999),
            variant: props.variant || 'solid',
        };
    }

    if (type === 'HtmlBlock') {
        return {
            html: resolveHtmlProp(props),
            background: props.background || 'transparent',
            padding: Number(props.padding || 0),
            radius: Number(props.radius || 0),
        };
    }

    if (type === 'ProductGridBlock') {
        return {
            heading: props.heading || 'Griglia prodotti',
            categoryId: props.categoryId || null,
            limit: Number(props.limit || 6),
            columns: Number(props.columns || 3),
            sortBy: props.sortBy || 'latest',
            emptyText: props.emptyText || 'Nessun prodotto disponibile.',
        };
    }

    if (type === 'CategoryFeedBlock') {
        return {
            heading: props.heading || 'Categorie in evidenza',
            parentCategoryId: props.parentCategoryId || null,
            limit: Number(props.limit || 6),
            emptyText: props.emptyText || 'Nessuna categoria disponibile.',
        };
    }

    return { ...props };
}

function resolveHtmlProp(props = {}) {
    if (typeof props.html === 'string') {
        return props.html;
    }

    if (typeof props.content === 'string') {
        return props.content;
    }

    if (props.content && typeof props.content === 'object') {
        return props.content.html || props.content.text || '';
    }

    return '';
}
