import React from 'react';
import { useNode } from '@craftjs/core';

export function ImageBlock({ src, alt, radius, width, height }) {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((node) => ({
        selected: node.events.selected,
    }));

    return (
        <div ref={(ref) => connect(drag(ref))} className={`overflow-hidden ${selected ? 'ring-2 ring-blue-500' : 'ring-1 ring-slate-200'}`} style={{ borderRadius: `${radius}px`, width }}>
            <img src={src} alt={alt} className="w-full object-cover" style={{ height }} />
        </div>
    );
}

function ImageSettings() {
    const { actions: { setProp }, src, alt, radius, width, height } = useNode((node) => ({
        src: node.data.props.src,
        alt: node.data.props.alt,
        radius: node.data.props.radius,
        width: node.data.props.width,
        height: node.data.props.height,
    }));

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                Image URL
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={src} onChange={(event) => setProp((props) => { props.src = event.target.value; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Alt text
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={alt} onChange={(event) => setProp((props) => { props.alt = event.target.value; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Radius
                <input type="number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={radius} onChange={(event) => setProp((props) => { props.radius = Number(event.target.value) || 0; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Width
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={width} onChange={(event) => setProp((props) => { props.width = event.target.value; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Height
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={height} onChange={(event) => setProp((props) => { props.height = event.target.value; })} />
            </label>
        </div>
    );
}

ImageBlock.craft = {
    displayName: 'Image',
    props: {
        src: 'https://placehold.co/800x400?text=Spotex',
        alt: 'Immagine modulo',
        radius: 24,
        width: '100%',
        height: 'auto',
    },
    related: {
        settings: ImageSettings,
    },
    rules: {
        canDrop: () => false,
    },
};
