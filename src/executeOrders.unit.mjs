import test from 'ava';
import executeOrders from './executeOrders.mjs';
import createPosition from './createPosition.mjs';
import createTestData from '../testData/createTestData.mjs';
import resolveData from '../testData/resolveData.mjs';

const setup = () => {

    // Create test data from first 3 rows of testData
    const data = createTestData();
    const type = 'open';

    const positions = [
        createPosition({ resolvedData: resolveData(data[0], type), size: 2, type }),
        createPosition({ resolvedData: resolveData(data[1], type), size: 3, type }),
        createPosition({ resolvedData: resolveData(data[2], type), size: -4, type }),
    ];

    const resolvedData = [
        resolveData(data[3], type),
        resolveData(data[4], type),
    ];

    return { positions, resolvedData };

}


test('does not create orders if data is missing', (t) => {
    const orders = [{
        symbol: 'AAPL',
        size: 3
    }];
    const positions = [];
    const result = executeOrders({ orders, positions: [], resolvedData: [] });
    t.deepEqual(result, {
        closedPositions: [],
        currentPositions: [],
    });
});


test('creates new long positions', (t) => {

    const { resolvedData } = setup();

    const result = executeOrders({
        orders: [{ symbol: 'AAPL', size: 3 }, { symbol: 'AMZN', size: -2 }],
        positions: [],
        resolvedData,
    });
    t.deepEqual(result, {
        closedPositions: [],
        currentPositions: [
            // AAPL
            createPosition({
                size: 3,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
            }),
            // AMZN
            createPosition({
                size: -2,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
            }),
        ]
    });
});




test('keeps existing unmodified positions', (t) => {

    const { resolvedData, positions } = setup();

    const result = executeOrders({
        orders: [],
        positions,
        resolvedData,
    });
    t.deepEqual(result, {
        closedPositions: [],
        currentPositions: positions,
    });
});



test('enlarges existing position', (t) => {
    const { resolvedData, positions } = setup();

    const result = executeOrders({
        orders: [{ symbol: 'AAPL', size: 3 }, { symbol: 'AMZN', size: -2 }],
        positions,
        resolvedData,
    });
    t.deepEqual(result, {
        closedPositions: [],
        currentPositions: [
            // AAPL
            ...positions.filter(pos => pos.symbol === 'AAPL'),
            createPosition({
                size: 3,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
            }),
            // AMZN
            ...positions.filter(pos => pos.symbol === 'AMZN'),
            createPosition({
                size: -2,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
            }),
        ]
    });
});


test('reduces position', (t) => {
    const { resolvedData, positions } = setup();

    const result = executeOrders({
        // AAPL postions' size is 2 and 3, AMZN -4. Use both positions on AAPL.
        orders: [{ symbol: 'AAPL', size: -4 }, { symbol: 'AMZN', size: 2 }],
        positions,
        resolvedData,
    });
    t.deepEqual(result, {
        closedPositions: [
            positions[0],
            createPosition({
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
                size: 2,
                type: 'open',
                initialPosition: positions[1],
            }),
            createPosition({
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
                size: -2,
                type: 'open',
                initialPosition: positions[2],
            })
        ],
        currentPositions: [
            // AAPL
            createPosition({
                size: 1,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
                // Older (first) position was removed completely; younger (second) position
                // was reduced and stays on as initialPosition
                initialPosition: positions[1],
            }),
            // AMZN
            createPosition({
                size: -2,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
                initialPosition: positions[2],
            }),
        ]
    });
});


test('turns positions', (t) => {
    const { resolvedData, positions } = setup();

    const result = executeOrders({
        // AAPL postions' size is 2 and 3, AMZN -4. Use both positions on AAPL.
        orders: [{ symbol: 'AAPL', size: -8 }, { symbol: 'AMZN', size: 5 }],
        positions,
        resolvedData,
    });
    t.deepEqual(result, {
        closedPositions: [
            positions[0],
            positions[1],
            positions[2],
        ],
        currentPositions: [
            // AAPL
            createPosition({
                size: -3,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
            }),
            // AMZN
            createPosition({
                size: 1,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
            }),
        ]
    });
});

