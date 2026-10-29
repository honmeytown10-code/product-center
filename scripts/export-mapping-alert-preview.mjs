import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'exports/product-center-prototype.html');
const output = path.join(root, 'exports/mapping-alert-app-preview.html');
let html = await readFile(input, 'utf8');
if (!html.includes('</head>')) throw new Error('Expected a complete single-file prototype');
// Preserve the existing application and bundle; only select its App viewport.
const bootstrap = '<script>try{var mappingPreviewUrl=new URL(location.href);mappingPreviewUrl.searchParams.set("view","mobile");history.replaceState(null,"",mappingPreviewUrl.href)}catch(mappingPreviewError){}</script>';
html = html.replace('</head>', bootstrap + '</head>');
await writeFile(output, html, 'utf8');
console.log('App single-file preview: ' + output);
