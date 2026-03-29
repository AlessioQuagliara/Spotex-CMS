import React from 'react';
import { useNode } from '@craftjs/core';

export function CraftRoot({ background, padding, width, children }) {
    const {
        connectors: { connect },
    } = useNode();

    return (
        <main
            ref={connect}
            className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-5xl flex-col gap-6 rounded-[32px] border border-slate-200 bg-white shadow-[0_32px_80px_-36px_rgba(15,23,42,0.35)]"
            style={{
                background,
                padding: `${padding}px`,
                width,
            }}
        >
            {children}
        </main>
    );
}

function RootSettings() {
    const { actions: { setProp }, background, padding, width } = useNode((node) => ({
        background: node.data.props.background,
        padding: node.data.props.padding,
        width: node.data.props.width,
    }));

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                Background
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={background} onChange={(event) => setProp((props) => { props.background = event.target.value; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Padding
                <input type="number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={padding} onChange={(event) => setProp((props) => { props.padding = Number(event.target.value) || 0; })} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Width
                <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={width} onChange={(event) => setProp((props) => { props.width = event.target.value; })} />
            </label>
        </div>
    );
}

CraftRoot.craft = {
    displayName: 'CraftRoot',
    props: {
        background: '#ffffff',
        padding: 24,
        width: '100%',
    },
    related: {
        settings: RootSettings,
    },
};
