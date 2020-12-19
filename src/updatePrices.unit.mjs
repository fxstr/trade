import test from 'ava';
import updatePrices from './updatePrices.mjs';
import createTestData from '../testData/createTestData.mjs';
import resolveData from '../testData/resolveData.mjs';
import createPosition from './createPosition.mjs';


test('updates positions for close by default', (t) => {

    const data = createTestData();
    const type = 'close';
    const aapl = data.filter(item => item.symbol === 'AAPL');
    const amzn = data.filter(item => item.symbol === 'AMZN');

    const aaplPos = createPosition({
        resolvedData: resolveData(aapl[0], type),
        size: 4,
        type: type,
    });
    const amznPos = createPosition({
        resolvedData: resolveData(amzn[0], type),
        size: 3,
        type: type,
    });

    const result = updatePrices({
        positions: [aaplPos, amznPos],
        // Amzn will not be updated
        resolvedData: [resolveData(aapl[1], type)],
    });

    t.deepEqual(result, [
        createPosition({
            resolvedData: resolveData(aapl[1], type),
            size: 4,
            type,
            initialPosition: aaplPos.initialPosition,
        }),
        amznPos,
    ])

});



test('adds bar if type is open', (t) => {

    const data = createTestData();
    const type = 'open';
    const aapl = data.filter(item => item.symbol === 'AAPL');

    const aaplPos = createPosition({
        resolvedData: resolveData(aapl[0], type),
        size: 4,
        type: type,
    });

    const result = updatePrices({
        positions: [aaplPos],
        resolvedData: [resolveData(aapl[1], type)],
        newBar: true,
    });

    t.deepEqual(result, [
        createPosition({
            resolvedData: resolveData(aapl[1], type),
            size: 4,
            type,
            initialPosition: aaplPos.initialPosition,
            barsHeld: 1,
        }),
    ])

});