import { build, context } from 'esbuild';
import { compile } from 'svelte/compiler';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import ts from 'typescript';

async function main() {
  try {
    // Ambil argumen dari command line
    const args = process.argv.slice(2);
    const watchMode = args.includes('--watch');
    
    // Ambil entry point dan output file dari argumen atau gunakan default
    const entryPoint = args.find(arg => !arg.startsWith('--')) || 'src/content-scripts/inject/index.ts';
    const outputFile = args.find((arg, index) => args[index - 1] === '--outfile') || 'dist/src/content-scripts/inject/dist/inject.js';
    
    console.log(`Processing Svelte components... ${watchMode ? '(watch mode)' : ''}`);
    console.log(`Entry: ${entryPoint}, Output: ${outputFile}`);
    
    const baseOptions = {
      entryPoints: [entryPoint],
      bundle: true,
      minify: true,
      sourcemap: true,
      outfile: outputFile,
      format: 'iife', // Gunakan format iife karena ini untuk content script
      define: {
        'import.meta.env.VITE_DEBUG_MODE': JSON.stringify(process.env.VITE_DEBUG_MODE || 'false')
      },
      plugins: [{
        name: 'svelte-loader',
        setup(build) {
          // Tangani file Svelte
          build.onLoad({ filter: /\.svelte$/ }, async (args) => {
            const source = readFileSync(args.path, 'utf8');
            
            try {
              // Tambahkan logging untuk melihat bagian mana yang bermasalah
              console.log(`Processing Svelte file: ${args.path}`);
              
              // Pra-proses source untuk menghapus anotasi tipe TypeScript
              let processedSource = source;
              
              // Hapus anotasi tipe dari deklarasi variabel (misalnya: export let containerId: string)
              processedSource = processedSource.replace(/(export let \w+): \w+/g, '$1');
              
              // Hapus anotasi tipe dari parameter fungsi
              processedSource = processedSource.replace(/(\w+): (\w+)(?=,|\))/g, '$1');
              
              // Hapus anotasi tipe dari deklarasi variabel lokal
              processedSource = processedSource.replace(/(let|const|var) (\w+): \w+/g, '$1 $2');
              
              // Hapus import type
              processedSource = processedSource.replace(/import type {[^}]*} from/g, 'import');
              
              // Compile Svelte ke JavaScript
              const compiled = compile(processedSource, {
                filename: args.path,
                generate: 'dom',
                dev: false,
                css: 'external', // Ganti ke 'external' untuk menghasilkan CSS
                sveltePath: 'svelte',
                enableSourcemap: false,
                immutable: false,
                hydratable: false,
                legacy: false
              });
              
              // Gabungkan kode JavaScript dan CSS jika ada
              let jsCode = compiled.js.code;
              
              // Jika ada CSS yang dihasilkan, tambahkan ke kode JavaScript
              if (compiled.css && compiled.css.code) {
                jsCode += `\n;(() => {\n  const style = document.createElement('style');\n  style.textContent = ${JSON.stringify(compiled.css.code)};\n  document.head.appendChild(style);\n})();`;
              }
              
              return {
                contents: jsCode,
                loader: 'js'
              };
            } catch (error) {
              console.error(`Error compiling Svelte file: ${args.path}`, error.message);
              console.error(`Error details:`, error);
              throw error;
            }
          });
        }
      }]
    };
    
    if (watchMode) {
      // Gunakan context API untuk watch mode
      const ctx = await context(baseOptions);
      
      await ctx.watch();
      console.log('Watch mode started. Press Ctrl+C to stop.');
    } else {
      // Jalankan build satu kali
      await build(baseOptions);
      console.log('Build completed successfully!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

main();