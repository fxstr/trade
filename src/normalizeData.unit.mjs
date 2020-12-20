import test from 'ava';
import normalizeData from './normalizeData.mjs';
import createTestData from '../testData/createTestData.mjs';
import resolveData from '../testData/resolveData.mjs';

test('throws with invalid arguments', (t) => {
    t.throws(() => normalizeData(), {
        message: /data must be an object, is undefined instead/,
    });
    t.throws(() => normalizeData({ data: {} }), {
        message: /type must either be.* is undefined instead/,
    });
});

test('returns expected data', (t) => {
    const data = resolveData(createTestData());
    const types = ['open', 'close'];
    for (const type of types) {
        const normalized = normalizeData({ data, type });
        t.deepEqual(normalized, {
            price: data[type],
            exchangeRate: data[`${type}ExchangeRate`],
            pointValue: data.pointValue,
            margin: data.margin,
            date: data.date,
            settleDifference: data.settleDifference,
            symbol: data.symbol,
        });    
    }
});
