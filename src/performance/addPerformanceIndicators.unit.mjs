import test from 'ava';
import addPerformanceIndicators from './addPerformanceIndicators.mjs';

const createData = () => [{
    // total 140
    date: new Date('2020-01-01'),
    cash: 80,
    positionsOnClose: [{ value: 60, id: 0 }],
    positionsOnOpen: [
        // Profitable
        {
            id: 0,
            value: 8,
            initialPosition: {
                value: 4,
            },
        },
    ],
}, {
    // Total 130
    date: new Date('2020-01-02'),
    cash: 40,
    positionsOnClose: [{ value: 60, id: 0 }, { value: 30, id: 1 }],
    positionsOnOpen: [
        // Losing
        {
            id: 1,
            value: 3,
            initialPosition: {
                value: 7,
            },
        },
        // Losing
        {
            id: 2,
            value: 4,
            initialPosition: {
                value: 6,
            },
        },
    ],
}, {
    // Total 135
    date: new Date('2020-01-03'),
    cash: 40,
    positionsOnClose: [{ value: 50, id: 0 }, { value: 45, id: 1 }],
    positionsOnOpen: [
        // Not losing nor profitable
        {
            id: 3,
            value: 4,
            initialPosition: {
                value: 4,
            },
        },
    ],
}];

test('adds indicators', (t) => {
    const result = addPerformanceIndicators(createData());
    t.deepEqual(result.cagr.toFixed(2), '-1.00');
    t.deepEqual(result.maxAbsoluteDrawdown, 10);
    t.deepEqual(result.maxRelativeDrawdown.toFixed(4), '0.0714');
    t.deepEqual(result.tradeCount, 2);
    t.deepEqual(result.numberOfProfitableTrades, 1);
    t.deepEqual(result.numberOfLosingTrades, 2);
    t.deepEqual(result.percentProfitable, 0.25);
    // -4, 4, -2, 0; total -2 divided by 4 trades
    t.deepEqual(result.averageProfit, -0.5);
});
