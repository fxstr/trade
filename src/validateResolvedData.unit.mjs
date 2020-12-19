import test from 'ava';
import validateResolvedData from './validateResolvedData.mjs';
import createTestData from '../testData/createTestData.mjs';
import resolveData from '../testData/resolveData.mjs';

test('throws as expected', (t) => {
    t.throws(() => validateResolvedData(null), {
        message: /got null instead/,
    });
    t.throws(() => validateResolvedData({}), {
        message: /Expected property symbol .* be string, got undefined instead in {}/,
    });
    // Check optional arguments
    t.throws(() => validateResolvedData({
        symbol: 'AAPL',
        date: new Date(),
        price: 1,
        exchangeRate: 'notANumber'
    }), {
        message: /Expected property exchangeRate .* be undefined or number, got notANumber instead/,
    });
});

test('passes with valid data', (t) => {
    t.notThrows(() => validateResolvedData(resolveData(createTestData()[0], 'open')));
});

test('returns original data', (t) => {
    const resolved = resolveData(createTestData()[0], 'open');
    t.is(validateResolvedData(resolved), resolved);
});