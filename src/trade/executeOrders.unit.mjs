import test from 'ava';
import executeOrders from './executeOrders.mjs';
import createPosition from './createPosition.mjs';
import createTestData from '../../testData/createTestData.mjs';
import resolveData from '../../testData/resolveData.mjs';

const setup = () => {

    // Create test data from first 3 rows of testData
    const data = createTestData();
    const type = 'open';

    const positions = [
        createPosition({ resolvedData: resolveData(data[0], type), size: 2, type, id: 0 }),
        createPosition({ resolvedData: resolveData(data[1], type), size: 3, type, id: 1 }),
        createPosition({ resolvedData: resolveData(data[2], type), size: -4, type, id: 2 }),
    ];

    const resolvedData = [
        resolveData(data[3], type),
        resolveData(data[4], type),
    ];

    const generateId = () => {
        let id = 0;
        return () => id++;
    }

    return { positions, resolvedData, generateId };

};


test('does not create orders if data is missing', (t) => {
    const orders = [{ symbol: 'AAPL', size: 3 }];
    const { generateId } = setup();
    const result = executeOrders({
        orders,
        positions: [],
        resolvedData: [],
        createId: generateId(),
    });
    t.deepEqual(result, {
        closedPositions: [],
        currentPositions: [],
        ordersExecuted: [],
        ordersNotExecuted: orders,
    });
});


test('creates new long positions', (t) => {

    const { resolvedData, generateId } = setup();
    const orders = [{ symbol: 'AAPL', size: 3 }, { symbol: 'AMZN', size: -2 }];

    const result = executeOrders({
        orders,
        positions: [],
        resolvedData,
        createId: generateId(),
    });
    t.deepEqual(result, {
        closedPositions: [],
        currentPositions: [
            // AAPL
            createPosition({
                size: 3,
                id: 0,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
            }),
            // AMZN
            createPosition({
                size: -2,
                id: 1,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
            }),
        ],
        ordersNotExecuted: [],
        ordersExecuted: orders,
    });
});




test('keeps existing unmodified positions', (t) => {

    const { resolvedData, positions, generateId } = setup();

    const result = executeOrders({
        orders: [],
        positions,
        resolvedData,
        createId: generateId(),
    });
    t.deepEqual(result, {
        closedPositions: [],
        currentPositions: positions,
        ordersExecuted: [],
        ordersNotExecuted: [],
    });
});



test('enlarges existing position', (t) => {
    const { resolvedData, positions, generateId } = setup();
    const orders = [{ symbol: 'AAPL', size: 3 }, { symbol: 'AMZN', size: -2 }];

    const result = executeOrders({
        orders,
        positions,
        resolvedData,
        createId: generateId(),
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
                id: 0,
            }),
            // AMZN
            ...positions.filter(pos => pos.symbol === 'AMZN'),
            createPosition({
                size: -2,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
                id: 1,
            }),
        ],
        ordersNotExecuted: [],
        ordersExecuted: orders,
    });
});


test('reduces position', (t) => {
    const { resolvedData, positions, generateId } = setup();
    const orders = [{ symbol: 'AAPL', size: -4 }, { symbol: 'AMZN', size: 2 }];

    const result = executeOrders({
        // AAPL postions' size is 2 and 3, AMZN -4. Use both positions on AAPL.
        orders,
        positions,
        resolvedData,
        createId: generateId,
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
            }),
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
        ],
        ordersNotExecuted: [],
        ordersExecuted: orders,
    });
});


test('turns positions', (t) => {
    const { resolvedData, positions, generateId } = setup();
    const orders = [{ symbol: 'AAPL', size: -8 }, { symbol: 'AMZN', size: 5 }];

    const result = executeOrders({
        // AAPL postions' size is 2 and 3, AMZN -4. Use both positions on AAPL.
        orders,
        positions,
        resolvedData,
        // Will restart at 0, as it has not been used in setup()
        createId: generateId(),
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
                id: 0,
            }),
            // AMZN
            createPosition({
                size: 1,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
                id: 1,
            }),
        ],
        ordersNotExecuted: [],
        ordersExecuted: orders,
    });
});

