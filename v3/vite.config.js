import { defineConfig } from 'vite'
import pkg from './package.json'

export default defineConfig({
    // Set base path for production builds
    // Use './' for relative paths (works in any subdirectory)
    base: './',

    // Stellt die Versionsnummer im Frontend bereit, ohne die ganze Datei zu laden
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
        'import.meta.env.VITE_APP_NAME': JSON.stringify(pkg.productName || pkg.name),
    },

    build: {
        // Sorgt dafür, dass der Build-Ordner leer ist, bevor Vite neu baut
        emptyOutDir: true,
        // Verhindert Unschärfe bei manchen Assets durch Inlining-Limit
        assetsInlineLimit: 0,
        chunkSizeWarningLimit: 1000,
    }
})