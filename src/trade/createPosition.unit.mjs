import test from 'ava';
import createTestData from '../../testData/createTestData.mjs';
import resolveData from '../../testData/resolveData.mjs';
import createPosition from './createPosition.mjs';
import calculatePositionValue from './calculatePositionValue.mjs';

const reformatResolvedData = (data, type) => ({
    ...data,
    price: data[type],
    exchangeRate: data[`${type}ExchangeRate`],
});

test('throws if id and initialPosition are passed or missing', (t) => {
    t.throws(() => createPosition({ id: 5, initialPosition: {} }), {
        message: /parameter id 5/,
    });
    t.throws(() => createPosition({ id: null, initialPosition: null }), {
        message: /parameter id \(is null\) or initialPosition \(is null\)/,
    });
});

test('throws on invalid parameters', (t) => {
    const valid = {
        resolvedData: {
            date: new Date(),
            symbol: 'AAPL',
            price: 1,
            exchangeRate: 1,
            pointValue: 1,
            margin: 1,
            settleDifference: true,
        },
        size: 5,
        type: 'open',
        barsHeld: 3,
        id: 3,
    };

    // resolvedData
    t.throws(() => createPosition({ ...valid, resolvedData: null }), {
        message: /resolvedData.*be an object.*is null/,
    });
    // size
    t.throws(() => createPosition({ ...valid, size: null }), {
        message: /size.*be a number.*is null/,
    });
    // type
    t.throws(() => createPosition({ ...valid, type: 'else' }), {
        message: /type.*be "open" or "close".*is else/,
    });
    t.throws(() => createPosition({ ...valid, barsHeld: 'yes' }), {
        message: /barsHeld.*be a number.*is yes/,
    });
    t.throws(() => createPosition({ ...valid, resolvedData: { ...valid.resolvedData, date: null } }), {
        message: /date.*be a Date.*is null/,
    });
    t.throws(() => createPosition({ ...valid, resolvedData: { ...valid.resolvedData, symbol: null } }), {
        message: /symbol.*be provided.*is null/,
    });
    t.throws(() => createPosition({ ...valid, resolvedData: { ...valid.resolvedData, price: 'a' } }), {
        message: /price.*be a number.*is a/,
    });
    t.throws(() => createPosition({ ...valid, resolvedData: { ...valid.resolvedData, exchangeRate: 'a' } }), {
        message: /exchangeRate.*be a number.*is a/,
    });
    t.throws(() => createPosition({ ...valid, resolvedData: { ...valid.resolvedData, pointValue: 'a' } }), {
        message: /pointValue.*be a number.*is a/,
    });
    t.throws(() => createPosition({ ...valid, resolvedData: { ...valid.resolvedData, margin: 'a' } }), {
        message: /margin.*be a number.*is a/,
    });
    t.throws(() => createPosition({ ...valid, resolvedData: { ...valid.resolvedData, settleDifference: null } }), {
        message: /settleDifference.*be a boolean.*is null/,
    });
});


test('uses values passed', (t) => {

    const data = createTestData();
    const firstRow = resolveData(data[0], 'open');
    const size = 3;
    const barsHeld = 2;
    const type = 'open';

    const resolvedData = reformatResolvedData(firstRow, 'open');

    const position = createPosition({
        resolvedData,
        size,
        barsHeld,
        type,
        id: 3,
    });
    const expectation = {
        size,
        // From data
        date: resolvedData.date,
        symbol: resolvedData.symbol,
        exchangeRate: resolvedData.exchangeRate,
        price: resolvedData.price,
        barsHeld,
        type,
        value: size * resolvedData.margin * resolvedData.pointValue * resolvedData.exchangeRate,
        id: 3,
        profit: 0,
    };
    t.deepEqual(position, {
        ...expectation,
        initialPosition: {
            ...expectation,
            pointValue: firstRow.pointValue,
            margin: firstRow.margin,
            settleDifference: false,
            profit: 0,
        },
    });
});



test('uses initialPosition if present', (t) => {

    const data = createTestData();
    const firstRow = resolveData(data[0], 'open');
    const secondRow = resolveData(data[1], 'open');
    const size = 3;

    const firstResolvedData = reformatResolvedData(firstRow, 'open');
    const secondResolvedData = reformatResolvedData(secondRow, 'open');

    const firstPosition = createPosition({
        resolvedData: firstResolvedData,
        size,
        type: 'open',
        id: 2,
    });
    const position = createPosition({
        resolvedData: secondResolvedData,
        type: 'open',
        initialPosition: firstPosition.initialPosition,
        size,
    });


    // Value:
    // Original: margin of 6.25 * pointValue 10 * size 3 * exchangeRate 1.2 
    // = 225
    // exchangeRate changes to 1.3 while we lose 0.1 per contract
    // Exhcange rate gain: (13 / 1.2) * full price of 225 * 2 (margin is 50%)
    // *Loss* is positionSize of 3 * pointValue of 10 * 0.1 * exchangeRate of 1.3 = 3
    // = -3.9
    const value = (225 + (((1.3 / 1.2) - 1) * 450)) - 3.9;

    t.deepEqual(position, {
        initialPosition: firstPosition.initialPosition,
        date: secondResolvedData.date,
        symbol: secondResolvedData.symbol,
        type: 'open',
        price: secondResolvedData.price,
        exchangeRate: secondResolvedData.exchangeRate,
        size,
        id: 2,
        barsHeld: 0,
        value,
        profit: value - 225,
    });

});


test.todo('calculates correct profit per position if its size changes');