import test from 'ava';
import { trade, toColumns, generateParameters } from './index.mjs';

test('exports expected exports', (t) => {
    t.is(typeof trade, 'function');
    t.is(typeof toColumns, 'function');
    t.is(typeof generateParameters, 'function');
});
