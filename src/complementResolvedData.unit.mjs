import test from 'ava';
import complementResolvedData from './complementResolvedData.mjs';

test('complements data', (t) => {
    const complemented = complementResolvedData({
        exchangeRate: 5,
        otherField: 2,
        price: 4,
    });
    t.deepEqual(complemented, {
        exchangeRate: 5,
        otherField: 2,
        price: 4,
        pointValue: 1,
        margin: 4,
        settleDifference: false,
    });
});

