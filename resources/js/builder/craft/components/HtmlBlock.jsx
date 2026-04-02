import React from 'react';
import { useNode } from '@craftjs/core';

export function HtmlBlock({ html }) {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((node) => ({
        selected: node.events.selected,
    }));

    return (
        <div
            ref={(ref) => connect(drag(ref))}
            className={`rounded-2xl border bg-white p-4 ${selected ? 'ring-2 ring-blue-500 border-blue-200' : 'border-slate-200'}`}
        >
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">HTML Block</div>
            <div className="prose prose-slate mt-3 max-w-none" dangerouslySetInnerHTML={{ __html: html || '' }} />
        </div>
    );
}

function HtmlSettings() {
    const { actions: { setProp }, html } = useNode((node) => ({
        html: node.data.props.html,
    }));

    return (
        <label className="block text-sm font-medium text-slate-700">
            HTML
            <textarea
                className="mt-1 min-h-[220px] w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs"
                value={html || ''}
                onChange={(event) => setProp((props) => { props.html = event.target.value; })}
            />
        </label>
    );
}

HtmlBlock.craft = {
    displayName: 'HtmlBlock',
    props: {
        html: '<p>Nuovo blocco HTML</p>',
    },
    related: {
        settings: HtmlSettings,
    },
};
