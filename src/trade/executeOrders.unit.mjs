import test from 'ava';
import executeOrders from './executeOrders.mjs';
import createPosition from './createPosition.mjs';
import createTestData from '../../testData/createTestData.mjs';
import resolveRawData from '../../testData/resolveData.mjs';

const resolveData = (data, type) => {
    const resolved = resolveRawData(data);
    const final = {
        ...resolved,
        price: resolved[type],
        exchangeRate: resolved[`${type}ExchangeRate`],
    };
    return final;
};

const setup = () => {

    // Create test data from first 3 rows of testData
    const data = createTestData();
    const type = 'open';

    const positions = [
        // AAPL 2020-01-01
        createPosition({
            resolvedData: resolveData(data[0], type),
            size: 2,
            type,
            id: 0,
        }),
        // AAPL 2020-01-02
        createPosition({
            resolvedData: resolveData(data[1], type),
            size: 3,
            type,
            id: 1,
        }),
        // AMZN 2020-01-01
        createPosition({
            resolvedData: resolveData(data[2], type),
            size: -4,
            type,
            id: 2,
        }),
    ];

    const resolvedData = [
        resolveData(data[3], type),
        resolveData(data[4], type),
    ];

    const generateId = () => {
        let id = 0;
        return () => id++;
    };

    return { positions, resolvedData, generateId };

};


test('works without orders', (t) => {
    const { generateId, positions, resolvedData } = setup();
    const result = executeOrders({
        orders: [],
        positions,
        resolvedData,
        createId: generateId(),
    });
    t.deepEqual(result, {
        closedPositions: [],
        // No orders: Positions stay as they were. Date etc. is updated outside of executeOrders
        currentPositions: positions,
        ordersExecuted: [],
        ordersNotExecuted: [],
    });
});


test('works without resolved data', (t) => {
    // If there is no data for an instrument, leave date at where it is because the position's
    // data depends on that data.
    const { positions, generateId } = setup();
    const result = executeOrders({
        orders: [],
        positions,
        resolvedData: [],
        createId: generateId(),
    });
    t.deepEqual(result, {
        closedPositions: [],
        currentPositions: positions,
        ordersExecuted: [],
        ordersNotExecuted: [],
    });
});



test('does not create positions if data is missing', (t) => {
    const orders = [{ symbol: 'AAPL', size: 3 }];
    const { generateId, positions } = setup();
    const result = executeOrders({
        orders,
        positions,
        resolvedData: [],
        createId: generateId(),
    });
    t.deepEqual(result, {
        closedPositions: [],
        currentPositions: [
            // AMZN first because symbols without orders are added to currentPositions first
            ...positions.filter(({ symbol }) => symbol === 'AMZN'),
            ...positions.filter(({ symbol }) => symbol === 'AAPL'),
        ],
        ordersExecuted: [],
        ordersNotExecuted: orders,
    });
});



test('closes positions to 0', (t) => {

    const { resolvedData, generateId, positions } = setup();
    const orders = [{ symbol: 'AAPL', size: -5 }, { symbol: 'AMZN', size: 4 }];

    const result = executeOrders({
        orders,
        positions,
        resolvedData,
        createId: generateId(),
    });

    t.deepEqual(result, {
        closedPositions: [
            // AAPL with size 2
            createPosition({
                initialPosition: positions[0].initialPosition,
                resolvedData: resolvedData.find(({ symbol }) => symbol === 'AAPL'),
                type: 'open',
                size: 2,
            }),
            // AAPL with size 3
            createPosition({
                // AAPL with size 2
                initialPosition: positions[1].initialPosition,
                resolvedData: resolvedData.find(({ symbol }) => symbol === 'AAPL'),
                type: 'open',
                size: 3,
            }),
            createPosition({
                // AMZN with size -4
                initialPosition: positions[2].initialPosition,
                resolvedData: resolvedData.find(({ symbol }) => symbol === 'AMZN'),
                type: 'open',
                size: -4,
            }),
        ],
        currentPositions: [],
        ordersNotExecuted: [],
        ordersExecuted: orders,
    });
});



test('creates new long/short positions', (t) => {

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
            // AAPL: 2 existing, 1 new
            createPosition({
                size: 2,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
                initialPosition: positions[0].initialPosition,
            }),
            createPosition({
                size: 3,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
                initialPosition: positions[1].initialPosition,
            }),
            createPosition({
                size: 3,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
                id: 0,
            }),
            // AMZN: 1 existing, 1 new
            createPosition({
                size: -4,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
                initialPosition: positions[2].initialPosition,
            }),
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
            createPosition({
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
                size: 2,
                type: 'open',
                initialPosition: positions[0].initialPosition,
            }),
            createPosition({
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
                size: 2,
                type: 'open',
                initialPosition: positions[1].initialPosition,
            }),
            createPosition({
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
                size: -2,
                type: 'open',
                initialPosition: positions[2].initialPosition,
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
                initialPosition: positions[1].initialPosition,
            }),
            // AMZN
            createPosition({
                size: -2,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AMZN'),
                initialPosition: positions[2].initialPosition,
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
        closedPositions: positions.map(pos => (
            createPosition({
                initialPosition: pos.initialPosition,
                resolvedData: resolvedData.find(({ symbol }) => symbol === pos.symbol),
                size: pos.size,
                type: 'open',
            })
        )),
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



test('merges/handles multiple orders of the same instrument', (t) => {
    const { resolvedData, positions, generateId } = setup();
    const orders = [{ symbol: 'AAPL', size: -4 }, { symbol: 'AAPL', size: -3 }];

    const result = executeOrders({
        orders,
        positions,
        resolvedData,
        createId: generateId(),
    });
    t.deepEqual(result, {
        closedPositions: positions
            .filter(({ symbol }) => symbol === 'AAPL')
            .map(pos => (
                createPosition({
                    initialPosition: pos.initialPosition,
                    resolvedData: resolvedData.find(({ symbol }) => symbol === pos.symbol),
                    size: pos.size,
                    type: 'open',
                })
            )),
        currentPositions: [
            // AMZN (first because they're added to currentPositions first); date is not updated,
            // as this happens outside of executeOrders
            positions[2],
            // AAPL
            createPosition({
                size: -2,
                type: 'open',
                resolvedData: resolvedData.find(item => item.symbol === 'AAPL'),
                id: 0,
            }),
        ],
        ordersNotExecuted: [],
        ordersExecuted: [{
            symbol: 'AAPL',
            size: -7,
        }],
    });

});


test('does not modify barsHeld', (t) => {
    const { resolvedData, positions, generateId } = setup();
    const orders = [{ symbol: 'AAPL', size: -1 }, { symbol: 'AMZN', size: 2 }];
    const positionsWithBars = positions.map(pos => ({ ...pos, barsHeld: 5 }));

    const result = executeOrders({
        orders,
        positions: positionsWithBars,
        resolvedData,
        createId: generateId(),
    });
    const all5 = [...result.closedPositions, ...result.currentPositions]
        .every(pos => pos.barsHeld === 5);
    t.is(all5, true);

});

