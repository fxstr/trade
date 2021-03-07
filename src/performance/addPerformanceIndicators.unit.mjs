import test from 'ava';
import addPerformanceIndicators from './addPerformanceIndicators.mjs';

const createData = () => [{
    // total 140
    date: new Date('2020-01-01'),
    cash: 80,
    positionsOnClose: [{ value: 60 }],
}, {
    // Total 130
    date: new Date('2020-01-02'),
    cash: 40,
    positionsOnClose: [{ value: 60 }, { value: 30 }],
}, {
    // Total 135
    date: new Date('2020-01-03'),
    cash: 40,
    positionsOnClose: [{ value: 50 }, { value: 45 }],
}];

test('adds indicators', (t) => {
    const result = addPerformanceIndicators(createData());
    t.deepEqual(result.cagr.toFixed(2), '-1.00');
    t.deepEqual(result.maxAbsoluteDrawdown, 10);
    t.deepEqual(result.maxRelativeDrawdown.toFixed(4), '0.0714');
});
