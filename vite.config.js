// https://stackoverflow.com/questions/69417788/vite-https-on-localhost

// npm i vite-plugin-mkcert -D


import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig({

    root: './root',

    build: {
        sourcemap: 'inline',
        emptyOutDir: true,
        outDir: "../build",
        minify: false,
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].[hash].js`,
                chunkFileNames: `assets/[name].[hash].js`,
                assetFileNames: `assets/[name].[hash].[ext]`,

                manualChunks(id) {

                    if (id.includes('src2/stepHook')) {

                        return 'stepHook';
                    }

                    if (id.includes('src/index')) {

                        return 'guide';
                    }
                }
            },
        },
    },

    server: {

        port: 1296,
        strictPort: true,
        https: true
    },

    plugins: [
        {
            name: 'jekyll-front-matter',

            generateBundle(_, bundle) {

                for (const [fileName, asset] of Object.entries(bundle)) {

                    if (fileName.endsWith('.css') 
                        && asset.type === 'asset'
                    ) {
                        const source = typeof asset.source === 'string'
                            ? asset.source
                            : asset.source.toString();

                        asset.source = '---\n\n---\n\n\n' + source;
                    }
                }
            }
        },
        mkcert()
    ],

    css: {
        preprocessorOptions: {
            scss: {
                charset: false,
            }
        }
    }
});