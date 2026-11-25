<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="light dark">
        <meta name="theme-color" content="#f8f8f6" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#16171a" media="(prefers-color-scheme: dark)">

        {{-- Runs before first paint: resolves Light / Dark / System so the page never flashes the wrong theme. --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';
                const root = document.documentElement;
                const dark = appearance === 'dark'
                    || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

                root.classList.toggle('dark', dark);
                root.style.colorScheme = dark ? 'dark' : 'light';
            })();
        </script>

        {{-- Inline style so the page background is correct before app.css loads. Keep in sync with --background in app.css. --}}
        <style>
            html {
                background-color: oklch(0.978 0.004 95);
            }

            html.dark {
                background-color: oklch(0.16 0.005 260);
            }
        </style>

        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <meta name="description" content="A campus task marketplace that helps the CMU community review task details before agreeing.">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'TaskMate') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
