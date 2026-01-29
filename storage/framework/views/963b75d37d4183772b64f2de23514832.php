<?php $__env->startSection('seo_title', $page->title . ' - SPOTEX'); ?>
<?php $__env->startSection('seo_description', $page->description ?? ''); ?>
<?php $__env->startSection('seo_keywords', $page->keywords ?? ''); ?>

<?php $__env->startSection('content'); ?>
<!-- Contenuto del builder full-width -->
<?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($page->html_content): ?>
    <?php echo $page->html_content; ?>

<?php else: ?>
    <div class="container mx-auto px-4 py-12 text-center text-gray-500">
        <p>Questa pagina non ha ancora contenuti.</p>
    </div>
<?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

<!-- CSS personalizzato della pagina -->
<?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($page->css_content): ?>
    <style>
        <?php echo $page->css_content; ?>

    </style>
<?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

<!-- JavaScript personalizzato della pagina -->
<?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($page->js_content): ?>
    <script>
        <?php echo $page->js_content; ?>

    </script>
<?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/pages/show.blade.php ENDPATH**/ ?>