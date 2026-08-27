import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(projectRoot, '.single-html-tmp');
const outputDir = path.join(projectRoot, 'exports');
const sourceHtmlPath = path.join(buildDir, 'index.html');
const outputHtmlPath = path.join(outputDir, 'product-center-prototype.html');

const isLocalAsset = (url) => !/^(?:[a-z]+:|\/\/|#)/i.test(url);

const resolveAssetPath = (url) => {
  const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  const relativePath = pathname.replace(/^\.?\//, '').replace(/^\/+/, '');
  const assetPath = path.resolve(buildDir, relativePath);
  const relativeToBuild = path.relative(buildDir, assetPath);

  if (relativeToBuild.startsWith('..') || path.isAbsolute(relativeToBuild)) {
    throw new Error(`Refusing to inline an asset outside the build directory: ${url}`);
  }

  return assetPath;
};

const replaceAsync = async (input, pattern, replacer) => {
  const matches = [...input.matchAll(pattern)];
  let result = input;

  for (const match of matches.reverse()) {
    const replacement = await replacer(match);
    result = `${result.slice(0, match.index)}${replacement}${result.slice(match.index + match[0].length)}`;
  }

  return result;
};

let html = await readFile(sourceHtmlPath, 'utf8');

html = await replaceAsync(
  html,
  /<link\b[^>]*\brel=(['"])stylesheet\1[^>]*>/gi,
  async ([tag]) => {
    const href = tag.match(/\bhref=(['"])(.*?)\1/i)?.[2];
    if (!href || !isLocalAsset(href)) return tag;

    const css = await readFile(resolveAssetPath(href), 'utf8');
    return `<style>\n${css.replace(/<\/style/gi, '<\\/style')}\n</style>`;
  },
);

html = await replaceAsync(
  html,
  /<script\b[^>]*\bsrc=(['"])(.*?)\1[^>]*><\/script>/gi,
  async ([tag, , src]) => {
    if (!isLocalAsset(src)) return tag;

    const javascript = await readFile(resolveAssetPath(src), 'utf8');
    const openingTag = tag.match(/^<script\b[^>]*>/i)?.[0] ?? '<script>';
    const attributes = openingTag
      .replace(/^<script\b/i, '')
      .replace(/>$/, '')
      .replace(/\s+src=(['"])(.*?)\1/i, '')
      .replace(/\s+crossorigin(?:=(['"])(.*?)\1)?/i, '');

    return `<script${attributes}>\n${javascript.replace(/<\/script/gi, '<\\/script')}\n</script>`;
  },
);

if (/\b(?:src|href)=(['"])\/?assets\//i.test(html)) {
  throw new Error('The generated HTML still contains external build assets.');
}

await mkdir(outputDir, { recursive: true });
await writeFile(outputHtmlPath, html, 'utf8');
await rm(buildDir, { recursive: true, force: true });

const sizeInMb = Buffer.byteLength(html) / 1024 / 1024;
console.log(`Single-file prototype generated: ${path.relative(projectRoot, outputHtmlPath)}`);
console.log(`File size: ${sizeInMb.toFixed(2)} MB`);
