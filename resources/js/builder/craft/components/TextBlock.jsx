import React from 'react';
import { useNode } from '@craftjs/core';

export function TextBlock({ text, color, fontSize }) {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((node) => ({
        selected: node.events.selected,
    }));

    return (
        <div
            ref={(ref) => connect(drag(ref))}
            className={`rounded-xl px-4 py-3 ${selected ? 'ring-2 ring-blue-500' : 'ring-1 ring-transparent'}`}
            style={{ color, fontSize: `${fontSize}px` }}
        >
            {text}
        </div>
    );
}

function TextSettings() {
    const { actions: { setProp }, text, color, fontSize } = useNode((node) => ({
        text: node.data.props.text,
        color: node.data.props.color,
        fontSize: node.data.props.fontSize,
    }));

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                Testo
                <textarea
                    className="mt-1 min-h-[120px] w-full rounded border border-slate-300 px-3 py-2"
                    value={text}
                    onChange={(event) => setProp((props) => { props.text = event.target.value; })}
                />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Colore
                <input
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                    value={color}
                    onChange={(event) => setProp((props) => { props.color = event.target.value; })}
                />
            </label>
            <label className="block text-sm font-medium text-slate-700">
                Font size
                <input
                    type="number"
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                    value={fontSize}
                    onChange={(event) => setProp((props) => { props.fontSize = Number(event.target.value) || 16; })}
                />
            </label>
        </div>
    );
}

TextBlock.craft = {
    displayName: 'TextBlock',
    props: {
        text: 'Testo del modulo',
        color: '#111827',
        fontSize: 18,
    },
    related: {
        settings: TextSettings,
    },
};
