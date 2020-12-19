/*
const ds = new DataSeries();
const byDate = ds.groupBy(row => row.get('date'));


const orders = [];
const positions = [];
const cash = [];
for (const bar of byDate) {
    // Trade on open
    const prices = bar.map(row => ({
        symbol: row.get('instrument'),
        open: row.get('open'),
        pointValue: row.get('pointValue'),
    }));
    // Margin …
    const { openPositions, cash } = trade(orders, prices);
    // Create positions on close
    const closePositions = updatePositions();
    const currentOrders = calculateOrders(
        cash.slice(-1).pop(),
        positions.slice(-1).pop(),
        bar,
    );
    orders.push(currentOrders);
    positions.push(openPositions);
    positions.push(closePositions);
}

// Positions
[{
    date: '2020-01-01',
    type: 'open',
    symbol: 'AAPL',
    size: 5,
    exchangeRate: 1.27,
    margin: 2,
    pointValue: 1000,
    price: 4,
    value: 25400,
    barsHeld: 7,
    opened: {}
}]

const { positions, cash, orders } = trade(
    data, // Iterable by date; contains iterable with instrument data
    row => ({ // «Getters»
        date: row.get('date'),
        symbol: row.get('symbol'),
        open: row.get('open'),
        close: row.get('close'),
        margin: row.get('margin'),
        exchangeRate: calculateRateFor(row.get('date'), row.get('instrument')),
        pointValue: row.get('pv'),
        settleDifference: false,
    }),
    // Calculate orders – or positions?
    ({ data, cash, positions }) => {
        // currentPositions are merged positions
        // Positions as object with:
        // - getByName()
        // - getLatest()
        // - getMerged()
        // Return orders as object with target/size, GTC …?
        const allPosValue = currentPositions.reduce((prev, pos) => prev + pos.value, 0);
        return [{
            instrument: 'AAPL',
            size: 5,
        }];
    },
);

createPosition(symbol, size, price, { exchangeRate = 1, margin = price, pointValue = 1, type = 'open' } = {});
updatePosition(originalPosition, price, { size, exchangeRate, margin, pointValue, type } = {});
calculateValue(position);
mergePositions(...positions);



getPositionValue = (position) => {
    // Only expose margin to exchange rate fluctuations
}

// Orders
[{
    createdDate: '2020-01-01',
    executedDate: '2020-01-02',
    symbol: 'AAPL',
    size: 2,
}]
*/