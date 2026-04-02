<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $page->title }} - Spotex GrapesJS Builder</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
            background: #f1f5f9;
            color: #0f172a;
        }

        * {
            box-sizing: border-box;
        }

        .builder-shell {
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .builder-header {
            height: 68px;
            border-bottom: 1px solid #cbd5e1;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            gap: 12px;
        }

        .builder-title {
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        .builder-title h1 {
            margin: 0;
            font-size: 18px;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .builder-title p {
            margin: 4px 0 0;
            font-size: 12px;
            color: #475569;
        }

        .builder-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .builder-btn {
            border: 1px solid #cbd5e1;
            background: #fff;
            color: #0f172a;
            border-radius: 999px;
            padding: 8px 14px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }

        .builder-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .builder-btn-primary {
            border-color: #0f172a;
            background: #0f172a;
            color: #fff;
        }

        .builder-layout {
            flex: 1;
            min-height: 0;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 340px;
            gap: 12px;
            padding: 12px;
        }

        .builder-canvas {
            min-height: 0;
            border: 1px solid #cbd5e1;
            border-radius: 14px;
            overflow: hidden;
            background: #fff;
        }

        .builder-side {
            min-height: 0;
            border: 1px solid #cbd5e1;
            border-radius: 14px;
            overflow: hidden;
            background: #fff;
            display: flex;
            flex-direction: column;
        }

        .builder-side-header {
            padding: 12px 14px;
            border-bottom: 1px solid #e2e8f0;
        }

        .builder-side-header h2 {
            margin: 0;
            font-size: 14px;
        }

        .builder-side-header p {
            margin: 6px 0 0;
            font-size: 12px;
            color: #475569;
        }

        .builder-side-body {
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-height: 0;
            flex: 1;
        }

        #grapes-page-js {
            width: 100%;
            min-height: 220px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px;
            resize: vertical;
            font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            color: #0f172a;
        }

        .builder-status {
            font-size: 12px;
            color: #334155;
            min-height: 20px;
        }

        .builder-link {
            font-size: 13px;
            color: #0f172a;
            font-weight: 600;
            text-decoration: none;
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            padding: 8px 12px;
            width: fit-content;
        }

        @media (max-width: 1080px) {
            .builder-layout {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="builder-shell">
        <header class="builder-header">
            <div class="builder-title">
                <h1>{{ $page->title }}</h1>
                <p>/{{ $page->slug }} · {{ $grapesPayload['schemaVersion'] ?? 'grapesjs-v1' }}</p>
            </div>
            <div class="builder-actions">
                <button id="grapes-undo" class="builder-btn" type="button">Undo</button>
                <button id="grapes-redo" class="builder-btn" type="button">Redo</button>
                <button id="grapes-save" class="builder-btn builder-btn-primary" type="button">Salva</button>
            </div>
        </header>

        <main class="builder-layout">
            <section class="builder-canvas">
                <div id="gjs" style="height:100%;"></div>
            </section>

            <aside class="builder-side">
                <div class="builder-side-header">
                    <h2>Custom JavaScript</h2>
                    <p>Questo script verrà salvato in `js_content` della pagina.</p>
                </div>
                <div class="builder-side-body">
                    <textarea id="grapes-page-js" spellcheck="false" placeholder="// JS custom per la pagina"></textarea>
                    <div id="grapes-status" class="builder-status"></div>
                    <a class="builder-link" href="{{ route('pages.code', $page) }}">Apri Code Editor</a>
                </div>
            </aside>
        </main>
    </div>

    <script id="grapes-builder-payload" type="application/json">@json($grapesPayload)</script>
    @vite(['resources/js/builder/grapes/main.js'])
</body>
</html>
