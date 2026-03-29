import { ButtonBlock } from './components/ButtonBlock';
import { CategoryFeedBlock } from './components/CategoryFeedBlock';
import { CraftRoot } from './components/CraftRoot';
import { ImageBlock } from './components/ImageBlock';
import { ProductGridBlock } from './components/ProductGridBlock';
import { SectionBlock } from './components/SectionBlock';
import { TextBlock } from './components/TextBlock';

export const craftResolver = {
    CraftRoot,
    SectionBlock,
    TextBlock,
    ButtonBlock,
    ImageBlock,
    ProductGridBlock,
    CategoryFeedBlock,
};

export const toolboxComponents = [
    {
        label: 'Section',
        type: 'SectionBlock',
        props: {
            background: '#ffffff',
            padding: 24,
            radius: 16,
        },
    },
    {
        label: 'Text',
        type: 'TextBlock',
        props: {
            text: 'Nuovo testo',
            color: '#111827',
            fontSize: 18,
        },
    },
    {
        label: 'Button',
        type: 'ButtonBlock',
        props: {
            label: 'Acquista ora',
            href: '#',
            background: '#0f172a',
            color: '#ffffff',
            radius: 999,
        },
    },
    {
        label: 'Image',
        type: 'ImageBlock',
        props: {
            src: 'https://placehold.co/960x480?text=Spotex',
            alt: 'Immagine',
            radius: 24,
        },
    },
    {
        label: 'Product Grid',
        type: 'ProductGridBlock',
        props: {
            heading: 'Griglia prodotti',
            categoryId: null,
            limit: 6,
            columns: 3,
            sortBy: 'latest',
            emptyText: 'Nessun prodotto disponibile.',
        },
    },
    {
        label: 'Category Feed',
        type: 'CategoryFeedBlock',
        props: {
            heading: 'Categorie in evidenza',
            parentCategoryId: null,
            limit: 6,
            emptyText: 'Nessuna categoria disponibile.',
        },
    },
];
