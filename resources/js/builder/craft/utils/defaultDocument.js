export function createDefaultDocument() {
    return {
        ROOT: {
            type: { resolvedName: 'CraftRoot' },
            isCanvas: true,
            props: {
                background: '#f8fafc',
                padding: 24,
                width: '100%',
            },
            displayName: 'Root',
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {},
        },
    };
}

export function deserializePage(data) {
    if (!data || typeof data !== 'object') {
        return createDefaultDocument();
    }

    if (data.ROOT && typeof data.ROOT === 'object') {
        return data;
    }

    if (data.document && data.document.ROOT) {
        return data.document;
    }

    if (Array.isArray(data.elements)) {
        return legacyElementsToCraftDocument(data.elements);
    }

    if (Array.isArray(data)) {
        return legacyElementsToCraftDocument(data);
    }

    if (!data.root || typeof data.root !== 'object') {
        return createDefaultDocument();
    }

    const document = createDefaultDocument();
    document.ROOT.props = {
        ...document.ROOT.props,
        ...extractRootProps(data.root.props),
    };

    const rootChildren = normalizeNodes(data.root.nodes);

    rootChildren.forEach((child, index) => {
        const childId = appendNodeToDocument(document, child, 'ROOT', index);

        if (childId) {
            document.ROOT.nodes.push(childId);
        }
    });

    return document;
}

export function legacyElementsToCraftDocument(elements = []) {
    const document = createDefaultDocument();

    elements.forEach((element, index) => {
        const type = resolveLegacyType(element?.type);
        const nodeId = appendNodeToDocument(
            document,
            {
                id: element?.id,
                type,
                props: mapLegacyProps(element, type),
                nodes: element?.children || [],
            },
            'ROOT',
            index,
        );

        if (nodeId) {
            document.ROOT.nodes.push(nodeId);
        }
    });

    return document;
}

function resolveLegacyType(type) {
    switch (type) {
        case 'button':
            return 'ButtonBlock';
        case 'image':
            return 'ImageBlock';
        case 'container':
            return 'SectionBlock';
        case 'product-grid':
            return 'ProductGridBlock';
        case 'category-feed':
            return 'CategoryFeedBlock';
        case 'html-block':
        case 'html':
            return 'HtmlBlock';
        case 'text':
        default:
            return 'TextBlock';
    }
}

function resolveDbType(type) {
    switch (type) {
        case 'Container':
        case 'SectionBlock':
        case 'container':
            return 'SectionBlock';
        case 'Text':
        case 'TextBlock':
        case 'text':
            return 'TextBlock';
        case 'Image':
        case 'ImageBlock':
        case 'image':
            return 'ImageBlock';
        case 'Button':
        case 'ButtonBlock':
        case 'button':
            return 'ButtonBlock';
        case 'HtmlBlock':
        case 'html':
        case 'html-block':
            return 'HtmlBlock';
        case 'ProductGridBlock':
        case 'product-grid':
            return 'ProductGridBlock';
        case 'CategoryFeedBlock':
        case 'category-feed':
            return 'CategoryFeedBlock';
        default:
            return 'TextBlock';
    }
}

function appendNodeToDocument(document, nodeInput, parentId, index) {
    if (!nodeInput || typeof nodeInput !== 'object') {
        return null;
    }

    const resolvedType = resolveDbType(nodeInput.type || nodeInput?.type?.resolvedName);
    const generatedId = String(nodeInput.id || `${resolvedType.toLowerCase()}-${parentId}-${index + 1}`);
    const uniqueId = ensureUniqueId(document, generatedId);
    const rawProps = nodeInput.props || nodeInput.content || {};
    const normalizedProps = normalizeNodeProps(rawProps, resolvedType);

    document[uniqueId] = {
        type: { resolvedName: resolvedType },
        isCanvas: resolvedType === 'SectionBlock',
        props: normalizedProps,
        displayName: resolvedType,
        custom: {},
        hidden: false,
        parent: parentId,
        nodes: [],
        linkedNodes: {},
    };

    const childNodes = normalizeNodes(nodeInput.nodes || nodeInput.children);

    childNodes.forEach((child, childIndex) => {
        const childId = appendNodeToDocument(document, child, uniqueId, childIndex);

        if (childId) {
            document[uniqueId].nodes.push(childId);
        }
    });

    return uniqueId;
}

function ensureUniqueId(document, preferredId) {
    if (!document[preferredId]) {
        return preferredId;
    }

    let suffix = 1;
    let nextId = `${preferredId}-${suffix}`;

    while (document[nextId]) {
        suffix += 1;
        nextId = `${preferredId}-${suffix}`;
    }

    return nextId;
}

function normalizeNodes(nodes) {
    if (!Array.isArray(nodes)) {
        return [];
    }

    return nodes
        .filter(Boolean)
        .map((node) => {
            if (typeof node === 'string') {
                return {
                    type: 'Text',
                    props: {
                        text: node,
                    },
                };
            }

            return node;
        });
}

function extractRootProps(props = {}) {
    return {
        background: props.background || props.backgroundColor || '#ffffff',
        padding: Number(props.padding) || 24,
        width: props.width || '100%',
    };
}

function normalizeNodeProps(rawProps = {}, type) {
    const props = rawProps && typeof rawProps === 'object' ? rawProps : {};

    if (type === 'SectionBlock') {
        return {
            background: props.background || props.backgroundColor || '#ffffff',
            padding: Number(props.padding) || 24,
            radius: Number(props.radius || props.borderRadius) || 16,
            border: props.border || '1px solid #e2e8f0',
        };
    }

    if (type === 'TextBlock') {
        return {
            text: props.text || props.content || 'Nuovo testo',
            color: props.color || '#111827',
            fontSize: Number(props.fontSize) || 18,
        };
    }

    if (type === 'ImageBlock') {
        return {
            src: props.src || 'https://placehold.co/960x480?text=Spotex',
            alt: props.alt || 'Immagine modulo',
            radius: Number(props.radius || props.borderRadius) || 24,
            width: props.width || '100%',
            height: props.height || 'auto',
        };
    }

    if (type === 'ButtonBlock') {
        return {
            label: props.label || props.text || 'Pulsante',
            href: props.href || '#',
            background: props.background || '#0f172a',
            color: props.color || '#ffffff',
            radius: Number(props.radius) || 999,
            variant: props.variant || 'solid',
        };
    }

    if (type === 'HtmlBlock') {
        return {
            html: props.html || props.content || '<div>Nuovo blocco HTML</div>',
            background: props.background || 'transparent',
            padding: Number(props.padding) || 0,
            radius: Number(props.radius) || 0,
        };
    }

    return {
        ...props,
    };
}

function mapLegacyProps(element = {}, type) {
    const styles = element.styles || {};
    const content = element.content || {};

    if (type === 'HtmlBlock') {
        const html = typeof content === 'string'
            ? content
            : content.html || content.text || '';

        return {
            html,
            background: styles.backgroundColor || 'transparent',
            padding: parseInt(styles.padding, 10) || 0,
            radius: parseInt(styles.borderRadius, 10) || 0,
        };
    }

    const text = typeof content === 'string'
        ? content
        : content.text || content.html || 'Nuovo contenuto';

    return {
        text,
        label: content.label || 'Call to action',
        href: content.href || '#',
        src: content.src || 'https://placehold.co/800x400?text=Spotex',
        alt: content.alt || 'Immagine modulo',
        background: styles.backgroundColor || '#ffffff',
        color: styles.color || '#111827',
        padding: parseInt(styles.padding, 10) || 24,
        radius: parseInt(styles.borderRadius, 10) || 16,
    };
}
