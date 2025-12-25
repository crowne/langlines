import { defineConfig } from 'vite'

export default defineConfig({
    base: './', // GameSnacks requires relative paths
    build: {
        assetsDir: 'assets',
        outDir: 'dist',
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name]-[hash][extname]',
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
            },
        },
    },
})
