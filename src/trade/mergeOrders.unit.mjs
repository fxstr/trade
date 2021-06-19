import test from 'ava';
import mergeOrders from './mergeOrders.mjs';

const createOrders = shortOrders => shortOrders.map(([symbol, size]) => ({
    symbol,
    size,
}));

test('merges orders', (t) => {
    const orders = createOrders([
        ['aapl', 5],
        ['amzn', -3],
        ['aapl', -5],
        ['amzn', 0],
    ]);
    t.deepEqual(mergeOrders(orders), createOrders([['aapl', 0], ['amzn', -3]]));
});

