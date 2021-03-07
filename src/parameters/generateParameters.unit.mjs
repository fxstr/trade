import test from 'ava';
import generateParameters from './generateParameters.mjs';

test('throws on invalid parameter', (t) => {
    t.throws(() => generateParameters([]), {
        message: /functions, you passed \[\] instead/,
    });
});

test('throws on invalid return value of parameter function', (t) => {
    t.throws(() => generateParameters(() => false), {
        message: /array, returned false instead/,
    });
});

test('returns empty array by default', (t) => {
    t.deepEqual(generateParameters(), [[]]);
});

test('generates data', (t) => {
    const result = generateParameters(
        () => [0, 1],
        () => [0, 1],
    );
    t.deepEqual(result, [[0, 0], [0, 1], [1, 0], [1, 1]]);
});

test('passes data to subsequent params', (t) => {
    const result = generateParameters(
        () => [1, 2],
        // Length of second array is based on first array
        prev => Array.from({ length: prev }).map((item, index) => index),
    );
    t.deepEqual(result, [[1, 0], [2, 0], [2, 1]]);
});

test('removes params that return an empty array', (t) => {
    const result = generateParameters(
        () => [0, 1],
        // 0 will return []; [] cannot be iteratred and will therefore be removed including
        // its previous parameters
        prev => Array.from({ length: prev }).map((item, index) => index),
    );
    t.deepEqual(result, [[1, 0]]);
});

test('removes duplicates', (t) => {
    const result = generateParameters(
        () => [1, 1],
        () => [1, 2],
    );
    t.deepEqual(result, [[1, 1], [1, 2]]);
});
