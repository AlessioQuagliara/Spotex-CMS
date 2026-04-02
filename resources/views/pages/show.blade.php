@extends('layouts.app')
@section('tailwind_runtime', '1')

@section('seo_title', $page->title . ' - SPOTEX')
@section('seo_description', $page->description ?? '')
@section('seo_keywords', $page->keywords ?? '')

@section('content')
<!-- Contenuto del builder full-width -->
@if(!empty($renderedPage['html']))
    {!! $renderedPage['html'] !!}
@else
    <div class="container mx-auto px-4 py-12 text-center text-gray-500">
        <p>Questa pagina non ha ancora contenuti.</p>
    </div>
@endif

<!-- CSS personalizzato della pagina -->
@if(!empty($renderedPage['css']))
    <style>
        {!! $renderedPage['css'] !!}
    </style>
@endif

<!-- JavaScript personalizzato della pagina -->
@if(!empty($renderedPage['js']))
    <script>
        {!! $renderedPage['js'] !!}
    </script>
@endif
@endsection
