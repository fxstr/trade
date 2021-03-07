import test from 'ava';
import generateId from './generateId.mjs';

test('returns new id', (t) => {
    const createId = generateId();
    t.is(typeof createId, 'function');
    t.is(createId(), 0);
    t.is(createId(), 1);
    t.is(createId(), 2);
});
