import test from 'ava';
import createTestData from '../testData/createTestData.mjs';
import resolveData from '../testData/resolveData.mjs';
import createPosition from './createPosition.mjs';
import calculatePositionValue from './calculatePositionValue.mjs';

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
    });
    const expectation = {
        size,
        // From data
        date: firstRow.date,
        symbol: firstRow.symbol,
        exchangeRate: firstRow.exchangeRate,
        pointValue: firstRow.pointValue,
        margin: firstRow.margin,
        settleDifference: false,
        price: firstRow.price,
        barsHeld,
        type,
        initialPosition: null,
        value: size * firstRow.margin * firstRow.pointValue * firstRow.exchangeRate,
    }
    t.deepEqual(position, {
        ...expectation,
        initialPosition: expectation,
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
    });
    const position = createPosition({
        resolvedData: secondRow,
        type: 'open',
        initialPosition,
        size,
    });

    t.is(position.initialPosition, initialPosition);
    t.is(position.value, calculatePositionValue(position, initialPosition));

});
