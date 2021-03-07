import test from 'ava';
import validateOrders from './validateOrders.mjs';

test('throws on invalid orders', (t) => {
    t.throws(() => validateOrders(), {
        message: /must be an array, is undefined instead/,
    });
    t.throws(() => validateOrders([{ symbol: false }]), {
        message: /is a string; order {"symbol":false} is not valid/,
    });
    t.throws(() => validateOrders([{ symbol: 'valid', size: false }]), {
        message: /is a number; order {"symbol":"valid","size":false} is not valid/,
    });
    t.throws(() => validateOrders([{ symbol: 'valid', size: -Infinity }]), {
        message: /size must be finite, is -Infinity/,
    });
});
