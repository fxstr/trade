import test from 'ava';
import createTestData from '../../testData/createTestData.mjs';
import resolveData from '../../testData/resolveData.mjs';
import createPosition from './createPosition.mjs';
import calculatePositionValue from './calculatePositionValue.mjs';

test('throws if id and initialPosition are passed', (t) => {
    t.throws(() => createPosition({ id: 5, initialPosition: {}, resolvedData: {} }), {
        message: /parameter id 5/,
    });
});


test('uses default values', (t) => {

    const data = createTestData();
    const firstRow = resolveData(data[0], 'open');
    const size = 3;
    const barsHeld = 2;
    const type = 'open';

    const position = createPosition({
        resolvedData: firstRow,
        size,
        barsHeld,
        type,
        id: 3,
    });
    const expectation = {
        size,
        // From data
        date: firstRow.date,
        symbol: firstRow.symbol,
        exchangeRate: firstRow.exchangeRate,
        price: firstRow.price,
        barsHeld,
        type,
        value: size * firstRow.margin * firstRow.pointValue * firstRow.exchangeRate,
        id: 3,
    };
    t.deepEqual(position, {
        ...expectation,
        initialPosition: {
            ...expectation,
            pointValue: firstRow.pointValue,
            margin: firstRow.margin,
            settleDifference: false,
        },
    });
});




test('uses initialPosition if present', (t) => {

    const data = createTestData();
    const firstRow = resolveData(data[0], 'open');
    const secondRow = resolveData(data[1], 'open');
    const size = 3;

    const initialPosition = createPosition({
        resolvedData: firstRow,
        size,
        type: 'open',
        id: 2,
    });
    const position = createPosition({
        resolvedData: secondRow,
        type: 'open',
        initialPosition,
        size,
    });

    t.deepEqual(position, {
        initialPosition,
        value: calculatePositionValue(position, initialPosition),
        date: secondRow.date,
        symbol: secondRow.symbol,
        type: 'open',
        price: secondRow.price,
        exchangeRate: secondRow.exchangeRate,
        size,
        id: 2,
        barsHeld: 0,
    });

});
