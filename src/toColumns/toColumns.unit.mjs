import test from 'ava';
import toColumns from './toColumns.mjs';

const createData = (symbolField = 'symbol') => [[
    { [symbolField]: 'aapl', close: 2 },
    { [symbolField]: 'amzn', close: 1 },
], [
    { [symbolField]: 'amzn', close: 3 },
    { [symbolField]: 'msft', close: 4 },
], [
    { [symbolField]: 'aapl', close: 3 },
], [
    { [symbolField]: 'amzn', close: 6 },
]];

// Converts data to col-based format
const getColForInstrument = (data, instrument, fieldName = 'symbol') => (
    data.flat().reverse().filter(row => row[fieldName] === instrument)
);


test('converts to columns', (t) => {
    const data = createData();
    const columns = toColumns({ data });
    // Only values from the first row, reversed
    t.deepEqual(columns, [
        getColForInstrument(data, 'aapl'),
        getColForInstrument(data, 'amzn'),
    ]);
});

test('respects minLength', (t) => {
    const data = createData();
    const columns = toColumns({ data, minLength: 3 });
    t.deepEqual(columns, [getColForInstrument(data, 'amzn')]);
});

test('cuts after maxLength', (t) => {
    const data = createData();
    const columns = toColumns({ data, maxLength: 2 });
    t.deepEqual(columns, [
        getColForInstrument(data, 'aapl'),
        getColForInstrument(data, 'amzn').slice(1),
    ]);
});

test('respects columnField', (t) => {
    const data = createData('newField');
    const columns = toColumns({ data, columnField: 'newField' });
    // Only values from the first row, reversed
    t.deepEqual(columns, [
        getColForInstrument(data, 'aapl', 'newField'),
        getColForInstrument(data, 'amzn', 'newField'),
    ]);
});
