import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
        dts({
            entryRoot: './src'
        })
    ],
    build: {
        minify: true,
        sourcemap: true,
        lib: {
            formats: ['es', 'umd'],
            entry: './src/index.ts',
            name: 'TronWalletConnect',
            fileName: (format: string) => `index.${format}.js`
        }
    }
})
