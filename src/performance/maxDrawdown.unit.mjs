import test from 'ava';
import maxDrawdown from './maxDrawdown.mjs';

test('returns drawdown', (t) => {

    t.is(maxDrawdown([]), 0);
    t.is(maxDrawdown([1]), 0);
    t.is(maxDrawdown([1, 2]), 0);
    t.is(maxDrawdown([2, 1]), 1);
    t.is(maxDrawdown([2, 1, 3, 2, 5, 1]), 4);

});


test('returns relative drawdown', (t) => {
    t.is(maxDrawdown([], true), 0);
    t.is(maxDrawdown([1], true), 0);
    t.is(maxDrawdown([2, 1, 3, 2, 5, 1], true), 0.8);
});
