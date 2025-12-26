import { defineConfig } from 'vite'

export default defineConfig({
    base: '/langlines/', // GameSnacks requires relative paths
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
    server: {
        allowedHosts: ['langlines.local', 'localhost', '127.0.0.1', '0.0.0.0'],
    },
})
