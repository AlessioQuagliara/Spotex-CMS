import { ButtonBlock } from './components/ButtonBlock';
import { Button } from './components/Button';
import { CategoryFeedBlock } from './components/CategoryFeedBlock';
import { Container } from './components/Container';
import { CraftRoot } from './components/CraftRoot';
import { HtmlBlock } from './components/HtmlBlock';
import { Image } from './components/Image';
import { ImageBlock } from './components/ImageBlock';
import { ProductGridBlock } from './components/ProductGridBlock';
import { SectionBlock } from './components/SectionBlock';
import { Text } from './components/Text';
import { TextBlock } from './components/TextBlock';

export const craftResolver = {
    CraftRoot,
    SectionBlock,
    Container,
    TextBlock,
    Text,
    HtmlBlock,
    ButtonBlock,
    Button,
    ImageBlock,
    Image,
    ProductGridBlock,
    CategoryFeedBlock,
};

export const toolboxComponents = [
    {
        label: 'Container',
        type: 'Container',
        props: {
            background: '#ffffff',
            padding: 24,
            radius: 16,
        },
    },
    {
        label: 'Text',
        type: 'Text',
        props: {
            text: 'Nuovo testo',
            color: '#111827',
            fontSize: 18,
        },
    },
    {
        label: 'HTML',
        type: 'HtmlBlock',
        props: {
            html: '<div>Nuovo blocco HTML</div>',
            background: 'transparent',
            padding: 0,
            radius: 0,
        },
    },
    {
        label: 'Button',
        type: 'Button',
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
        type: 'Image',
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
