import test from 'ava';
import cagr from './cagr.mjs';

test('returns cagr', (t) => {

    t.is(cagr([
        [new Date('2000-01-01'), 100],
        [new Date('2000-12-31'), 200],
    ]).toFixed(2), '1.00');

    // https://www.investopedia.com/terms/c/cagr.asp
    t.is(cagr([
        [new Date('2000-01-01'), 10],
        [new Date('2002-12-31'), 19],
    ]).toFixed(4), '0.2387');

    // https://www.investopedia.com/terms/c/cagr.asp
    t.is(cagr([
        [new Date('2013-06-01'), 10000],
        [new Date('2018-09-09'), 16897.14],
    ]).toFixed(4), '0.1046');

});
