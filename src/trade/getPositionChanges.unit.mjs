import test from 'ava';
import getPositionChanges from './getPositionChanges.mjs';

test('closes correctly', (t) => {
    t.deepEqual(
        getPositionChanges({ currentSize: 8, orderSize: -8 }),
        { sizeToOpen: 0, sizeToClose: 8 },
    );
    t.deepEqual(
        getPositionChanges({ currentSize: -8, orderSize: 8 }),
        { sizeToOpen: 0, sizeToClose: -8 },
    );
    t.deepEqual(
        getPositionChanges({ currentSize: 0, orderSize: 0 }),
        { sizeToOpen: 0, sizeToClose: 0 },
    );
});

test('changes from non-existing position', (t) => {
    t.deepEqual(
        getPositionChanges({ currentSize: 0, orderSize: -8 }),
        { sizeToOpen: -8, sizeToClose: 0 },
    );
    t.deepEqual(
        getPositionChanges({ currentSize: 0, orderSize: 8 }),
        { sizeToOpen: 8, sizeToClose: 0 },
    );
});

test('enlarges into the same direction', (t) => {
    // Do not use 8 twice to make sure the right values are used to calculate
    t.deepEqual(
        getPositionChanges({ currentSize: -8, orderSize: -6 }),
        { sizeToOpen: -6, sizeToClose: 0 },
    );
    t.deepEqual(
        getPositionChanges({ currentSize: 8, orderSize: 6 }),
        { sizeToOpen: 6, sizeToClose: 0 },
    );
});

test('reduces (but not to 0)', (t) => {
    // Do not use 8 twice to make sure the right values are used to calculate
    t.deepEqual(
        getPositionChanges({ currentSize: -8, orderSize: 6 }),
        { sizeToOpen: 0, sizeToClose: -6 },
    );
    t.deepEqual(
        getPositionChanges({ currentSize: 8, orderSize: -6 }),
        { sizeToOpen: 0, sizeToClose: 6 },
    );
});
