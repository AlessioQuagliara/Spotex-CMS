<!DOCTYPE html>
<html lang="it" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $page->title }} - Spotex Page Builder v2</title>
    
    {{-- Tailwind CSS --}}
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                    },
                }
            }
        }
    </script>
</head>
<body class="font-sans antialiased bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
    {{-- Container React --}}
    <div id="builder-root" 
         data-page-id="{{ $page->id }}" 
         data-page-title="{{ $page->title }}"
         data-page-slug="{{ $page->slug }}"
         data-initial-elements="{{ json_encode($page->builder_data ?? []) }}"
         data-initial-traits="{{ json_encode($page->builder_traits ?? []) }}"
         data-initial-classes="{{ json_encode($page->builder_classes ?? []) }}"
    ></div>

    {{-- Vite React App --}}
    @viteReactRefresh
    @vite(['resources/js/builder/main.jsx'])
</body>
</html>
