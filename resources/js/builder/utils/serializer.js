/**
 * Utility per salvare/caricare dati del builder
 */

/**
 * Valida e sanitizza gli elementi al caricamento
 */
export const validateElements = (data) => {
    if (!Array.isArray(data)) return [];
    return data
        .filter(el => el && typeof el === 'object')
        .map(el => ({
            ...el,
            id: el.id || `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: el.type || 'text',
            x: el.x || 0,
            y: el.y || 0,
            width: el.width || 200,
            height: el.height || 100,
            styles: el.styles || {},
            classes: el.classes || [],
            content: el.content || ''
        }));
};

/**
 * Interpola HTML con i valori dei traits
 */
export const interpolateHTML = (htmlTemplate, traitValues = {}) => {
    if (!htmlTemplate) return '';
    
    let result = htmlTemplate;
    Object.entries(traitValues).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        result = result.replace(regex, String(value));
    });
    return result;
};

/**
 * Esporta elemento pulito (con traits interpolati)
 */
export const exportElement = (element, traitValues = {}) => {
    const elementTraits = traitValues[element.id] || {};
    
    if (element.type === 'html-block') {
        return interpolateHTML(element.content, elementTraits);
    }
    return element.content;
};

/**
 * Prepara dati per il salvataggio backend
 */
export const prepareForSave = (elements, traitValues, customClasses) => {
    return {
        elements: elements.map(el => ({
            id: el.id,
            type: el.type,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            content: el.content,
            styles: el.styles,
            classes: el.classes,
            templateName: el.templateName
        })),
        traitValues,
        customClasses
    };
};

/**
 * Genera CSS dalle classi custom
 */
export const generateCSS = (customClasses = {}) => {
    let css = '';
    
    Object.entries(customClasses).forEach(([className, classData]) => {
        if (classData.base && Object.keys(classData.base).length > 0) {
            css += `.${className} {\n`;
            Object.entries(classData.base).forEach(([prop, value]) => {
                const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                css += `  ${cssProp}: ${value};\n`;
            });
            css += '}\n\n';
        }
        
        if (classData.hover && Object.keys(classData.hover).length > 0) {
            css += `.${className}:hover {\n`;
            Object.entries(classData.hover).forEach(([prop, value]) => {
                const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                css += `  ${cssProp}: ${value};\n`;
            });
            css += '}\n\n';
        }
    });
    
    return css;
};

/**
 * Converte ricorsivamente un elemento JSON in stringa HTML pulita.
 * Ignora proprietà specifiche dell'editor (selected-ring, hover-ring).
 * Genera HTML "di produzione" senza tracce dell'interfaccia editor.
 */
export const elementToHTML = (element, depth = 0) => {
    if (!element) return '';

    // Estrazione stili puliti (no classi editor)
    const className = element.styles?.className || '';
    
    // Genera style attribute da elemento.styles.custom se presente
    let styleAttr = '';
    if (element.styles?.custom && Object.keys(element.styles.custom).length > 0) {
        const styleStr = Object.entries(element.styles.custom)
            .map(([k, v]) => {
                // Converti camelCase a kebab-case (backgroundColor → background-color)
                const cssProp = k.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${cssProp}: ${v}`;
            })
            .join('; ');
        styleAttr = `style="${styleStr}"`;
    }

    // Costruisci attributi comuni (NO data-* di editor, solo id per referenza)
    const commonAttrs = [
        `id="${element.id}"`,
        className ? `class="${className}"` : '',
        styleAttr
    ]
        .filter(Boolean)
        .join(' ');

    const indent = '  '.repeat(depth);

    // Switch per tipo di elemento
    switch (element.type) {
        case 'container': {
            const childrenHTML = element.children
                ?.map(child => elementToHTML(child, depth + 1))
                .join('\n') || '';
            
            if (childrenHTML) {
                return `${indent}<div ${commonAttrs}>\n${childrenHTML}\n${indent}</div>`;
            } else {
                return `${indent}<div ${commonAttrs}></div>`;
            }
        }

        case 'heading': {
            const text = element.content?.text || '';
            const tag = element.content?.tag || 'h2';
            return `${indent}<${tag} ${commonAttrs}>${text}</${tag}>`;
        }

        case 'text': {
            const text = element.content?.text || '';
            return `${indent}<p ${commonAttrs}>${text}</p>`;
        }

        case 'button': {
            const text = element.content?.text || 'Click me';
            return `${indent}<button ${commonAttrs}>${text}</button>`;
        }

        case 'image': {
            const src = element.content?.src || '';
            const alt = element.content?.alt || 'image';
            return `${indent}<img ${commonAttrs} src="${src}" alt="${alt}" loading="lazy" />`;
        }

        case 'html-block': {
            // Legacy support per elementi html-block della v1
            // Contengono HTML grezzo nel campo content
            const html = element.content || '';
            return `${indent}<div ${commonAttrs}>${html}</div>`;
        }

        default: {
            console.warn(`[elementToHTML] Unknown type: ${element.type}`);
            // Fallback: wrappa il content in un div generico
            const fallbackContent = element.content?.text || element.content || '';
            return `${indent}<div ${commonAttrs} data-type="${element.type}">${fallbackContent}</div>`;
        }
    }
};

/**
 * Genera HTML statico completo da un array di elementi root
 * Pulito, senza classi di editor, pronto per il frontend pubblico
 */
export const generateHTMLFromElements = (elements = []) => {
    if (!Array.isArray(elements) || elements.length === 0) {
        return '<!-- No elements -->';
    }

    return elements
        .map(el => elementToHTML(el, 0))
        .join('\n\n');
};
