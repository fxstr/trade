import test from 'ava';
import calculatePositionValue from './calculatePositionValue.mjs';

const createPositionData = () => ({
    size: 5,
    date: new Date(),
    symbol: 'AAPL',
    price: 7,
    // defaults
    pointValue: 1,
    margin: 7,
    exchangeRate: 1,
});

test('calculates long non-settle-difference position value', (t) => {
    const originalPosition = createPositionData();
    const position = { ...createPositionData(), price: 8 };
    const value = calculatePositionValue(position, originalPosition);
    // 5 * 7 + 5 * 1
    t.is(value, 35 + 5);
});

test('calculates short non-settle-difference position value', (t) => {
    const originalPosition = createPositionData();
    const position = { ...createPositionData(), price: 8, size: -5 };
    const value = calculatePositionValue(position, originalPosition);
    t.is(value, 35 - 5);
});

test('calculates long non-settle-difference margin/pointSize position value', (t) => {
    const originalPosition = {
        ...createPositionData(),
        pointValue: 1000,
        margin: 3.5,
        exchangeRate: 1.2,
    };
    const position = { ...originalPosition, price: 8, exchangeRate: 1.4, margin: 3 };
    const value = calculatePositionValue(position, originalPosition);
    // (3.5 * 1000 * 5 * 1.4) + (3.5 * 1000 * 5 * (1.4 - 1.2)) + (1 * 1000 * 5 * 1.4)
    t.is(value, 24500 + 3500 + 7000);
});

test('calculates short non-settle-difference margin/pointSize position value', (t) => {
    const originalPosition = {
        ...createPositionData(),
        pointValue: 1000,
        margin: 3.5,
        size: -5,
        exchangeRate: 1.2,
    };
    const position = { ...originalPosition, price: 8, exchangeRate: 1.4, margin: 3 };
    const value = calculatePositionValue(position, originalPosition);
    // (3.5 * 1000 * 5 * 1.4) + (3.5 * 1000 * 5 * (1.4 - 1.2)) - (1 * 1000 * 5 * 1.4)
    t.is(value, 24500 + 3500 - 7000);
});


test('calculates long settle-difference margin/pointSize position value', (t) => {
    const originalPosition = {
        ...createPositionData(),
        pointValue: 1000,
        margin: 1.5,
        settleDifference: true,
        exchangeRate: 1.2,
    };
    const position = { ...originalPosition, price: 8, exchangeRate: 1.4, margin: 1 };
    const value = calculatePositionValue(position, originalPosition);
    // (1.5 * 1000 * 5 * 1.4) + (1 * 1000 * 5 * 1.4)
    t.is(value, 10500 + 7000);
});

test('calculates short settle-difference margin/pointSize position value', (t) => {
    const originalPosition = {
        ...createPositionData(),
        pointValue: 1000,
        margin: 1.5,
        size: -5,
        settleDifference: true,
        exchangeRate: 1.2,
    };
    const position = { ...originalPosition, price: 8, exchangeRate: 1.4, margin: 1 };
    const value = calculatePositionValue(position, originalPosition);
    // (1.5 * 1000 * 5 * 1.4) - (1 * 1000 * 5 * 1.4)
    t.is(value, 10500 - 7000);
});
