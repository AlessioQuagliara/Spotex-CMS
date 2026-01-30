<!DOCTYPE html>
<html lang="it" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title><?php echo e($page->title); ?> - Spotex Page Builder v2</title>
    
    
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
    
    <div id="builder-root" 
         data-page-id="<?php echo e($page->id); ?>" 
         data-page-title="<?php echo e($page->title); ?>"
         data-page-slug="<?php echo e($page->slug); ?>"
         data-initial-elements="<?php echo e(json_encode($page->builder_data ?? [])); ?>"
         data-initial-traits="<?php echo e(json_encode($page->builder_traits ?? [])); ?>"
         data-initial-classes="<?php echo e(json_encode($page->builder_classes ?? [])); ?>"
    ></div>

    
    <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/js/builder/main.jsx']); ?>
</body>
</html>
<?php /**PATH /Users/alessio/Progetti/Spotex-SRL/Spotex-CMS/resources/views/builder-v2.blade.php ENDPATH**/ ?>