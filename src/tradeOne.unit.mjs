/*import test from 'ava';
import tradeOne from './tradeOne.mjs';

const setup = () => {
    const data = [
        { open: 1.1, close: 1.2 },
        { open: 1.2, close: 1.3 },
        { open: 1.2, close: 1.2 },
        { open: 1.2, close: 1.5 },
        { open: 1.4, close: 1.1 },
        { open: 1.2, close: 1.4 },
    ]
    const getFields = (row) => [row.open, row.close];
    const getDirection = (row) => row.close - row.open;
    return { data, getFields, getDirection };
}

test('throws on invalid arguments', (t) => {
    t.throws(() => tradeOne({ data: 'notAnArray' }), {
        message: /array, is notAnArray instead/,
    });
    t.throws(() => tradeOne({ data: [], getFields: 'notAFunction' }), {
        message: /function, is notAFunction instead/,
    });
    t.throws(() => tradeOne({ data: [], getFields: () => {}, getDirection: 'notAFunction' }), {
        message: /function, is notAFunction instead/,
    });
});

test('throws on invalid getField return values', (t) => {
    const { data, getDirection } = setup();
    t.throws(() => tradeOne({ data, getDirection, getFields: () => 'notAnArray' }), {
        message: /array, got notAnArray instead/,
    });
    t.throws(() => tradeOne({ data, getDirection, getFields: () => ['nan', 2] }), {
        message: /numbers, they are nan and 2 instead/,
    });
    t.throws(() => tradeOne({ data, getDirection, getFields: () => [2, 'nan'] }), {
        message: /numbers, they are 2 and nan instead/,
    });
});

test('throws on invalid getDirection return value', (t) => {
    const { data, getFields } = setup();
    t.throws(() => tradeOne({ data, getFields, getDirection: () => 'notANumber' }), {
        message: /number, is notANumber instead/,
    });
});

test('calls getFields with expected paramters', (t) => {
    const { data, getDirection } = setup();
    const parameters = [];
    const getFields = (...params) => {
        parameters.push(params);
        return [params[0].open, params[0].close]
    };
    tradeOne({ data, getFields, getDirection });
    t.deepEqual(parameters.flat(), data);
});

test('calls getDirection with expected paramters', (t) => {
    const { data, getFields } = setup();
    const parameters = [];
    const getDirection = (...params) => {
        parameters.push(params);
        return -1;
    };
    tradeOne({ data, getFields, getDirection });
    t.is(parameters.length, data.length);
    t.deepEqual(parameters.map(item => item[0]), data);
    t.deepEqual(parameters[0][1], []);
    t.deepEqual(parameters[2][1], data.slice(0, 2).reverse());
});

test('returns expected result', (t) => {
    const { data, getFields, getDirection } = setup();
    const result = tradeOne({ data, getFields, getDirection });
    const expectation = [
        // First day: No order on previous close, therefore no trade. First traded value will be
        // 1.2 (open of 2nd bar, which is the first one traded).
        1.2,
        // 2nd bar: Go long on; open on 1.2, gain 0.1 by close
        1.3,
        // 3rd bar: Still long, lost -0.1 over night, gain 0 by close
        1.2,
        // 4th bar: Close position at 1.2 (same as before)
        1.2,
        // 5th bar: Go long again; open at 1.4, lose 0.3 by evening; 1.2 - 0.3 = 0.9
        0.9000000000000001,
        // 6th bar: Go short; close position @ 1.2 (gain 0.1) and lose 0.2 by the evening
        0.8,
    ];
    t.deepEqual(expectation, result);
});

test('works without trades', (t) => {
    const { data, getFields } = setup();
    const getDirection = () => 0;
    const result = tradeOne({ data, getFields, getDirection });
    t.deepEqual(result, Array.from({ length: 6 }).fill(0));
});
*/