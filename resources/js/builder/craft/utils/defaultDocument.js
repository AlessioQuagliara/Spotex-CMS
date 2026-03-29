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

export function legacyElementsToCraftDocument(elements = []) {
    const document = createDefaultDocument();

    elements.forEach((element, index) => {
        const id = String(element?.id || `legacy-${index + 1}`);
        const type = resolveLegacyType(element?.type);

        document[id] = {
            type: { resolvedName: type },
            isCanvas: type === 'SectionBlock',
            props: mapLegacyProps(element),
            displayName: type,
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {},
        };

        document.ROOT.nodes.push(id);
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
        case 'text':
        case 'html-block':
        default:
            return 'TextBlock';
    }
}

function mapLegacyProps(element = {}) {
    const styles = element.styles || {};
    const content = element.content || {};
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
