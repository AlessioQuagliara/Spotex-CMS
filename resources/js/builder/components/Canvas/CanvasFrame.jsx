import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * CanvasFrame: Wrapper per iframe che isola il canvas dal resto dell'UI
 * Usa React.createPortal per mountare componenti React dentro l'iframe
 */
const CanvasFrame = ({ children, title = 'Canvas' }) => {
    const [mountNode, setMountNode] = useState(null);
    const iframeRef = React.useRef(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            const doc = iframe.contentDocument;
            const win = iframe.contentWindow;

            // ✅ Script per evitare che scroll esterno influenzi l'iframe
            win.addEventListener('scroll', (e) => {
                if (e.target !== doc) return;
            });

            // ✅ Prendi il nodo radice dove montare i componenti React
            const root = doc.getElementById('canvas-root');
            if (root) {
                setMountNode(root);
            }
        };

        // ✅ Carica il contenuto HTML iniziale dell'iframe
        const doc = iframe.contentDocument;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {
                        box-sizing: border-box;
                    }
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: white;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                    }
                    body {
                        padding: 20px;
                    }
                    #canvas-root {
                        position: relative;
                        min-height: 100vh;
                    }
                    /* Stili visuali per selezione */
                    .selected-ring {
                        outline: 2px solid #3b82f6 !important;
                        outline-offset: -2px !important;
                    }
                    .hover-ring {
                        outline: 1px dashed #60a5fa !important;
                        outline-offset: -1px !important;
                    }
                </style>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body>
                <div id="canvas-root"></div>
            </body>
            </html>
        `);
        doc.close();

        // Aspetta che il DOM sia pronto
        if (doc.readyState === 'loading') {
            doc.addEventListener('DOMContentLoaded', handleLoad);
        } else {
            handleLoad();
        }

        return () => {
            doc.removeEventListener('DOMContentLoaded', handleLoad);
        };
    }, []);

    return (
        <iframe
            ref={iframeRef}
            title={title}
            className="w-full h-full border-0 bg-white"
            style={{ display: 'block' }}
        >
            {mountNode && createPortal(children, mountNode)}
        </iframe>
    );
};

export default CanvasFrame;
