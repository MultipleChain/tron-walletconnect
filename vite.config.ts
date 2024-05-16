import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
    plugins: [
        nodePolyfills(),
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
