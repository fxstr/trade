import test from 'ava';
import validateBar from './validateBar.mjs';
import createTestData from '../../testData/createTestData.mjs';
import resolveData from '../../testData/resolveData.mjs';

test('throws as expected', (t) => {
    t.throws(() => validateBar(null), {
        message: /got null instead/,
    });
    t.throws(() => validateBar({}), {
        message: /Expected property symbol .* be string, got undefined instead in {}/,
    });
    // Check optional arguments
    t.throws(() => validateBar({
        symbol: 'AAPL',
        date: new Date(),
        open: 1,
        close: 1,
        openExchangeRate: 'notANumber'
    }), {
        message: /Expected property openExchangeRate .* be undefined or number, got notANumber instead/,
    });
});

test('passes with valid data', (t) => {
    t.notThrows(() => validateBar(resolveData(createTestData()[0], 'open')));
});

test('returns original data', (t) => {
    const resolved = resolveData(createTestData()[0], 'open');
    t.is(validateBar(resolved), resolved);
});