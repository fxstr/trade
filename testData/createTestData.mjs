import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export default () => {
    const basePath = dirname(fileURLToPath(new URL(import.meta.url)));
    const data = readFileSync(join(basePath, 'testData.tsv'), 'utf8');
    // Remove comments
    const cleanData = data.split('\n').filter(row => !row.startsWith('//')).join('\n');
    const [firstRow, ...rows] = cleanData.split('\n');
    const firstRowSplit = firstRow.split(/\s+/);
    const mapped = rows.map((row) => {
        const cols = row.split(/\s+/);
        return cols.reduce((prev, col, index) => {
            const colName = firstRowSplit[index];
            let value;
            if (colName === 'date') value = new Date(col);
            else if (colName === 'symbol') value = col;
            else if (colName === 'settleDiff') value = !!parseInt(col, 10);
            else value = parseFloat(col);
            return {
                ...prev,
                [colName]: value,
            };
        }, {});
    });

    return mapped;
};
