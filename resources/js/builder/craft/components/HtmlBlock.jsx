import React from 'react';
import { useNode } from '@craftjs/core';

function resolveHtml(html, content) {
    if (typeof html === 'string') {
        return html;
    }

    if (typeof content === 'string') {
        return content;
    }

    if (content && typeof content === 'object') {
        return content.html || content.text || '';
    }

    return '';
}

export function HtmlBlock({ html, content, background, padding, radius }) {
    const {
        connectors: { connect, drag },
        selected,
    } = useNode((node) => ({
        selected: node.events.selected,
    }));

    const renderedHtml = resolveHtml(html, content);

    return (
        <div
            ref={(ref) => connect(drag(ref))}
            className={`relative overflow-hidden ${selected ? 'ring-2 ring-blue-500' : 'ring-1 ring-slate-200'}`}
            style={{
                background,
                padding: `${padding}px`,
                borderRadius: `${radius}px`,
            }}
        >
            {renderedHtml ? (
                <div
                    className="pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
            ) : (
                <p className="text-sm text-slate-400">Blocco HTML vuoto</p>
            )}
        </div>
    );
}

function HtmlSettings() {
    const {
        actions: { setProp },
        html,
        content,
        background,
        padding,
        radius,
    } = useNode((node) => ({
        html: node.data.props.html,
        content: node.data.props.content,
        background: node.data.props.background,
        padding: node.data.props.padding,
        radius: node.data.props.radius,
    }));

    const value = resolveHtml(html, content);

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">
                HTML
                <textarea
                    className="mt-1 min-h-[180px] w-full rounded border border-slate-300 px-3 py-2 font-mono text-xs"
                    value={value}
                    onChange={(event) => setProp((props) => {
                        props.html = event.target.value;
                    })}
                />
            </label>
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

HtmlBlock.craft = {
    displayName: 'HtmlBlock',
    props: {
        html: '<div>Nuovo blocco HTML</div>',
        background: 'transparent',
        padding: 0,
        radius: 0,
    },
    related: {
        settings: HtmlSettings,
    },
    rules: {
        canDrop: () => false,
    },
};
