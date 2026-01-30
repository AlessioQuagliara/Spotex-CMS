@php
    $editorId = $editorId ?? 'quill-editor-' . 
        (function_exists('str') ? str()->uuid()->toString() : uniqid());
@endphp

<link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">

<div class="space-y-2">
    @if(!empty($label))
        <label class="text-sm font-medium text-gray-700">{{ $label }}</label>
    @endif

    <div wire:ignore>
        <div id="{{ $editorId }}" class="bg-white" style="min-height: 240px;"></div>
    </div>
</div>

<script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
<script>
    document.addEventListener('livewire:init', () => {
        const editorEl = document.getElementById('{{ $editorId }}');
        if (!editorEl || editorEl.dataset.initialized) {
            return;
        }

        editorEl.dataset.initialized = 'true';

        const quill = new Quill(editorEl, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'image', 'video'],
                    ['clean']
                ]
            }
        });

        const hiddenInput = document.querySelector(@json($targetSelector ?? "[wire\\:model\\.defer=\"{$statePath}\"]"));
        if (hiddenInput && hiddenInput.value) {
            quill.root.innerHTML = hiddenInput.value;
        }

        quill.on('text-change', function () {
            const html = quill.root.innerHTML;
            if (hiddenInput) {
                hiddenInput.value = html;
                hiddenInput.dispatchEvent(new Event('input'));
            }
        });
    });
</script>
