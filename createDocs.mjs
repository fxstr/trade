import jsdoc from 'jsdoc-to-markdown';
import { copyFileSync, writeFileSync, unlinkSync } from 'fs';

const source = './src/trade/trade.mjs';
// Temp file because jsdoc-to-markdown needs a .js file, not .mjs
const target = './src/trade/trade-temp.js.js';
const doc = './src/trade/trade.md';

const jsdocOptions = {
    files: target,
};

const createDocs = async() => {
    // Clone DataSeries.mjs to DataSeries.js, as jsdoc2md can only read .js files (🤔)
    copyFileSync(source, target);
    await jsdoc.clear();
    const result = await jsdoc.render(jsdocOptions);
    writeFileSync(doc, result);
    unlinkSync(target);
};

(async() => {
    await createDocs();
})();
