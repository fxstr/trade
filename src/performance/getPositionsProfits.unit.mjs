import test from 'ava';
import getPositionsProfits from './getPositionsProfits.mjs';

test('throws on invalid arguments', (t) => {
    t.throws(() => getPositionsProfits('notAnArray'), {
        message: /be an array, got "notAnArray"/,
    });
    const invalidPositions = [[{
        id: 1,
        size: 3,
        initialPosition: {
            size: 4,
        },
    }]];
    t.throws(() => getPositionsProfits(invalidPositions), {
        message: /size \(3\) must be .* size \(4\)/,
    });
});

test('returns p/l', (t) => {

    const positions = [[
        // This position should be ignored, id 3 also exists later
        {
            id: 3,
            value: 3,
            initialPosition: {
                value: 4,
            },
        },
        // This position should count
        {
            id: 2,
            value: 3,
            initialPosition: {
                value: 7,
            },
        },
    ], [
        {
            id: 3,
            value: 4,
            initialPosition: {
                value: 4,
            },
        }, {
            id: 4,
            value: 5,
            initialPosition: {
                value: 3,
            },
        },
    ]];
    // Order by id: 3, 2, 4
    t.deepEqual(getPositionsProfits(positions), [0, -4, 2]);
});

