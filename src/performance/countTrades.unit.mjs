import test from 'ava';
import countTrades from './countTrades.mjs';

test('returns amount of trades', (t) => {
    const positionIds = [[1, 2], [2, 4], [3]];
    t.is(countTrades(positionIds), 4);
});

test('returns 0 for empty trades', (t) => {
    const positionIds = [[], []];
    t.is(countTrades(positionIds), 0);
});
