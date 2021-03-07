import test from 'ava';
import complementBar from './complementBar.mjs';

test('complements data', (t) => {
    const complemented = complementBar({
        // Optional (default will be overridden)
        openExchangeRate: 5,
        // Other field will be kept (if user likes to pass e.g. high/low)
        otherField: 2,
        // Required field will be used
        open: 4,
    });
    t.deepEqual(complemented, {
        openExchangeRate: 5,
        otherField: 2,
        open: 4,
        pointValue: 1,
        margin: 4,
        settleDifference: false,
        closeExchangeRate: 1,
    });
});

