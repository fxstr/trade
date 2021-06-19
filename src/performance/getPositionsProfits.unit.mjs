import test from 'ava';
import getPositionsProfits from './getPositionsProfits.mjs';

test('throws on invalid arguments', (t) => {
    t.throws(() => getPositionsProfits('notAnArray'), {
        message: /be an array, got "notAnArray"/,
    });
});

test('returns p/l', (t) => {

    const positions = [[
        // This position should be ignored, id 3 also exists later
        {
            id: 3,
            profit: 1,
        },
        // This position should count
        {
            id: 2,
            profit: 4,
        },
    ], [
        {
            id: 3,
            profit: 0,
        }, {
            id: 4,
            profit: -2,
        },
    ]];
    // Order by id: 3, 2, 4
    t.deepEqual(getPositionsProfits(positions), [0, 4, -2]);
});

