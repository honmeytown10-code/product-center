import { pinyin } from 'pinyin-pro';

/** Chinese initials with Latin letters and digits retained, without punctuation. */
export const productMnemonic = (name: string) => pinyin(name.trim(), {
    pattern: 'first', toneType: 'none', type: 'array', nonZh: 'consecutive',
}).join('').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 70);
