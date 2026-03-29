import React from 'react';
import { useNode } from '@craftjs/core';

export function ButtonBlock({ label, href, background, color, radius }) {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((node) => ({
        selected: node.events.selected,
    }));

    return (
        <div ref={(ref) => connect(drag(ref))} className={selected ? 'ring-2 ring-blue-500 rounded-2xl inline-flex' : 'inline-flex'}>
            <a
                href={href}
                className="inline-flex items-center justify-center px-5 py-3 font-semibold transition"
                style={{
                    background,
                    color,
                    borderRadius: `${radius}px`,
                }}
            >
                {label}
            </a>
        </div>
    );
}

function ButtonSettings() {
    const { actions: { setProp }, label, href, background, color, radius } = useNode((node) => ({
        label: node.data.props.label,
        href: node.data.props.href,
        background: node.data.props.background,
        color: node.data.props.color,
        radius: node.data.props.radius,
    }));

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                Etichetta
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={label} onChange={(event) => setProp((props) => { props.label = event.target.value; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                URL
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={href} onChange={(event) => setProp((props) => { props.href = event.target.value; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Background
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={background} onChange={(event) => setProp((props) => { props.background = event.target.value; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Text color
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={color} onChange={(event) => setProp((props) => { props.color = event.target.value; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Radius
                <input type="number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={radius} onChange={(event) => setProp((props) => { props.radius = Number(event.target.value) || 0; })} />
            </label>
        </div>
    );
}

ButtonBlock.craft = {
    displayName: 'ButtonBlock',
    props: {
        label: 'Scopri di piu',
        href: '#',
        background: '#0f172a',
        color: '#ffffff',
        radius: 999,
    },
    related: {
        settings: ButtonSettings,
    },
};
