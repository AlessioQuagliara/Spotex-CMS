import React from 'react';
import { useNode } from '@craftjs/core';

export function SectionBlock({ background, padding, radius, children }) {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((node) => ({
        selected: node.events.selected,
    }));

    return (
        <section
            ref={(ref) => connect(drag(ref))}
            className={`relative grid min-h-[160px] gap-4 transition-shadow ${selected ? 'ring-2 ring-blue-500' : 'ring-1 ring-slate-200'}`}
            style={{
                background,
                padding: `${padding}px`,
                borderRadius: `${radius}px`,
            }}
        >
            {children}
        </section>
    );
}

function SectionSettings() {
    const { actions: { setProp }, background, padding, radius } = useNode((node) => ({
        background: node.data.props.background,
        padding: node.data.props.padding,
        radius: node.data.props.radius,
    }));

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                Background
                <input
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                    value={background}
                    onChange={(event) => setProp((props) => { props.background = event.target.value; })}
                />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Padding
                <input
                    type="number"
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                    value={padding}
                    onChange={(event) => setProp((props) => { props.padding = Number(event.target.value) || 0; })}
                />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Radius
                <input
                    type="number"
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                    value={radius}
                    onChange={(event) => setProp((props) => { props.radius = Number(event.target.value) || 0; })}
                />
            </label>
        </div>
    );
}

SectionBlock.craft = {
    displayName: 'SectionBlock',
    props: {
        background: '#ffffff',
        padding: 24,
        radius: 16,
    },
    isCanvas: true,
    related: {
        settings: SectionSettings,
    },
};
