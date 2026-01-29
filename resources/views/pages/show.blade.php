@extends('layouts.app')

@section('seo_title', $page->title . ' - SPOTEX')
@section('seo_description', $page->description ?? '')
@section('seo_keywords', $page->keywords ?? '')

@section('content')
<!-- Contenuto del builder full-width -->
@if($page->html_content)
    {!! $page->html_content !!}
@else
    <div class="container mx-auto px-4 py-12 text-center text-gray-500">
        <p>Questa pagina non ha ancora contenuti.</p>
    </div>
@endif

<!-- CSS personalizzato della pagina -->
@if($page->css_content)
    <style>
        {!! $page->css_content !!}
    </style>
@endif

<!-- JavaScript personalizzato della pagina -->
@if($page->js_content)
    <script>
        {!! $page->js_content !!}
    </script>
@endif
@endsection
