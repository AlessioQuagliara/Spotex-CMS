import { generateElementId } from './id';

export const findElementById = (elements, id) => {
    for (const element of elements) {
        if (element.id === id) {
            return element;
        }

        if (element.children?.length) {
            const found = findElementById(element.children, id);
            if (found) {
                return found;
            }
        }
    }

    return null;
};

export const removeElementById = (elements, id) =>
    elements
        .filter((element) => element.id !== id)
        .map((element) => ({
            ...element,
            children: element.children ? removeElementById(element.children, id) : [],
        }));

export const cloneElementWithNewIds = (element) => ({
    ...element,
    id: generateElementId(),
    children: (element.children ?? []).map(cloneElementWithNewIds),
});

export const duplicateElementById = (elements, id, parentId = null) => {
    const elementToClone = findElementById(elements, id);
    if (!elementToClone) {
        return elements;
    }

    const cloned = cloneElementWithNewIds(elementToClone);

    if (!parentId) {
        return [...elements, cloned];
    }

    return elements.map((element) => {
        if (element.id === parentId) {
            return {
                ...element,
                children: [...(element.children || []), cloned],
            };
        }

        return {
            ...element,
            children: element.children ? duplicateElementById(element.children, id, parentId) : [],
        };
    });
};
