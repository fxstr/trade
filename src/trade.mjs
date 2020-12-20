import debug from 'debug';
import table from 'table';
import convertPositionsForTable from './convertPositionsForTable.mjs';
import complementBar from './complementBar.mjs';
import validateBar from './validateBar.mjs';
import updatePrices from './updatePrices.mjs';
import executeOrders from './executeOrders.mjs';
import normalizeData from './normalizeData.mjs';
import validateOrders from './validateOrders.mjs';

const log = debug('WalkForward');
const createTable = table.table;


/*
 * @typedef {object} Order
 * @property {number} size
 * @property {string} symbol
 * 
 * @typedef {object} ResolvedData
 * @property {string} symbol
 * @property {Date} date
 * @property {number} open
 * @property {number} close
 * @property {number} pointValue
 * @property {number} openExchangeRate
 * @property {number} closeExchangeRate
 * @property {number} margin     Margin on open
 * @property {boolean} settleDifference
 * 
 * @typedef {object} Position
 * @property {string} symbol
 * @property {Date} date
 * @property {string} type                      Either 'open' or 'close'
 * @property {number} size
 * @property {number} barsHeld
 * @property {Position} initialPosition
 * @property {number} price
 * @property {number} pointValue
 * @property {number} exchangeRate
 * @property {number} margin
 * @property {boolean} settleDifference
 * @property {number} value
*/


/** 
 * Trades (backtests) a system.
 * @example
 * const result = trade({
 *     data: [
 *         [
 *             { date: '2020-01-01', open: 20.5, close: 20.9, symbol: 'AAPL' },
 *             { date: '2020-01-01', open: 10.2, close: 10.1, symbol: 'AMZN' },
 *         ], [
 *             { date: '2020-01-02', open: 20.4, close: 20.7, symbol: 'AAPL' },
 *             { date: '2020-01-02', open: 10.3, close: 10.6, symbol: 'AMZN' },
 *         ], [
 *             { date: '2020-01-03', open: 20.3, close: 20.6, symbol: 'AAPL' },
 *             { date: '2020-01-03', open: 10.4, close: 10.5, symbol: 'AMZN' },
 *         ]
 *     ],
 *     // Function that gets an entry of data and is expected to return in a default format
 *     // (an object with the mandatory fields symbol (number), price (number) and date (Date))
 *     resolveData: (row, type) => {
 *         return {
 *             symbol: row.symbol,
 *             price: row[type],
 *             date: new Date(row.date),
 *             // You also might return margin (number), exchangeRate (number),
 *             // settleDifference (bool) or pointValue (number) here
 *         }
 *     },
 *     // Buy when open is > close, sell when close < open. Use equal position size for all
 *     // instruments.
 *     createOrders: ({ data, positions, cash }) => {
 *         // Get newest data (index 0 is current bar's data, index 1 is previous bar's data)
 *         const [current, previous] = data;
 *         // If there is no previous data (because we're on the first data) don't trade anything
 *         if (!previous) return [];
 *         // Store
 *         const expectedPositions = [];
 *         // Go through all current data and get data for the same instrument on previous bar
 *         for (const instrumentData of current) {
 *             const { symbol } = instrumentData;
 *             const previousInstrumentData = previous.find(item => item.symbol === symbol);
 *             if (previousInstrumentData && previousInstrumentData.close < instrumentData.close) {
 *                 expectedPositions.push({ data: instrumentData, type: 'long' });
 *             }
 *             else if (previousInstrumentData && previousInstrumentData.close > instrumentData.close) {
 *                 expectedPositions.push({ data: instrumentData, type: 'short' });
 *             }
 *         }
 *         // Get amount of money available (cash plus all positions)
 *         const available = cash + positions.reduce((prev, pos) => prev + pos.value, 0);
 *         const moneyPerPosition = available / expectedPositions.length;
 *         for (const position of expectedPositions) {
 *             const direction = position.type === 'short' ? -1 : 1;
 *             position.size = Math.floor(moneyPerPosition / position.data.close) * direction;
 *         }
 *         return expectedPositions.map(pos => ({ symbol: pos.data.symbol, size: pos.size }));
 *     },
 *     // Trade with an initial amount of 10'000
 *     cash: 10 ** 4,
 * });
 *
 * The function uses the [debug](https://www.npmjs.com/package/debug) library for logs. Set
 * environment variable `DEBUG` to `WalkForward:*` to see what's happening behind the scenes:
 * `export DEBUG=WalkForward:*`
 * 
 * @param {function} getData            Returns [open, close] or falsy
 *                                      TBD!!! Takes arguments: data for a bar and 'open' or 'close'.
 *                                      Must be a function (and not a data structure) as data 
 *                                      argument is the original data based on which orders
 *                                      are created.
 *                                      Is expected to return an object with properties:
 *                                      - price (number, mandatory)
 *                                      - date (Date, mandatory)
 *                                      - symbol (string, mandatory)
 *                                      - margin (number, optional; defaults to price)
 *                                      - pointValue (number, optional; defaults to 1)
 *                                      - exchangeRate (number, optional; defaults to 1)
 *                                      - settleDifference (boolean, optiona; defaults to false;
 *                                        needed for futures trading)
 * @param {function} createOrders       Takes the following arguments as an object: cash, positions
 *                                      and data. Data is original data (from the data parameter)
 *                                      where the newest entry is first (index 0) and corresponds
 *                                      to the current bar.
 *                                      Is expected to return an array of objects, each with
 *                                      properties symbol and size.
 * @param {number} cash                 Initial cash
 * 
 * @returns {object[]}                  Array with one entry per bar (same length as param data
 *                                      had). Every entry is an object with
 *                                      - date (Date)
 *                                      - orders (object[])
 *                                      - cash (number)
 *                                      - cost (number)
 *                                      - positionsOnOpen (object[])
 *                                      - positionsAfterTrade (object[])
 *                                      - positionsOnClose (object[])
 *                                      - closedPositions (object[])
 */
export default async({ getData, createOrders, cash } = {}) => {


    if (typeof getData !== 'function') {
        throw new Error(`trade: Expected argument getData to be a function, you passed ${getData} instead.`);
    }
    if (typeof createOrders !== 'function') {
        throw new Error(`trade: Expected argument createOrders to be a function, you passed ${createOrders} instead.`);
    }
    if (typeof cash !== 'number') {
        throw new Error(`trade: Expected argument cash to be a number, you passed ${cash} instead.`);
    }


    // @type {Array.{date: Date, positions:object[], orders:object[], cash:number}}
    const result = [];

    // Current bar
    // @type object[]
    let bars;

    // Collects all bars; will be passed to createOrders function. Youngest bar comes first.
    // @type array[]
    const allBars = [];

    while ((bars = await getData())) {

        // If getData() returns null, the loop is done.
        if (bars === null) break;

        if (!Array.isArray(bars)) {
            throw new Error(`trade: Expected getData to return an array, got ${JSON.stringify(bars)} instead.`)
        }

        log('🔽 '.repeat(32));

        const validatedBars = bars
            .map(validateBar)
            .map(complementBar);

        // Get date from first symbol's entry in bars
        const currentDate = validatedBars[0].date;
        log('📅 %s', currentDate);


        // Previous is either the last row of result (if existing) or an (empty) default
        const previous = result.slice(-1).pop() || {
            orders: [],
            cash,
            positionsOnClose: [],
        };


        // Open
        // 1. Update prices
        const positionsOnOpen = updatePrices({
            positions: previous.positionsOnClose,
            resolvedData: validatedBars.map(bar => normalizeData({ data: bar, type: 'open' })),
            newBar: true,
        });

        log('📈 Positions on open: \n%s', createTable(convertPositionsForTable(positionsOnOpen)));

        // 2. Execute orders
        const { currentPositions, closedPositions } = executeOrders({
            orders: previous.orders,
            resolvedData: validatedBars.map(bar => normalizeData({ data: bar, type: 'open' })),
            positions: positionsOnOpen,
        });

        log(
            '📈 Positions after execution: \n%s',
            createTable(convertPositionsForTable(currentPositions)),
        );
        log(
            '📈 Closed positions: \n%s',
            createTable(convertPositionsForTable(closedPositions)),
        );

        // 3. Get money that was used to execute orders
        const currentValue = currentPositions.reduce((prev, { value }) => prev + value, 0);
        const previousValue = positionsOnOpen.reduce((prev, { value }) => prev + value, 0);
        const cost = currentValue - previousValue;
        const currentCash = previous.cash - cost;

        log(
            '💸 Cost: %s. Value before order execution: %d. Value after order execution: %d',
            cost.toFixed(4),
            previousValue.toFixed(4),
            currentValue.toFixed(4),
        );

        // Close
        // 1. Update prices
        const positionsOnClose = updatePrices({
            positions: currentPositions,
            resolvedData: validatedBars.map(bar => normalizeData({ data: bar, type: 'close' })),
        });

        log(
            '📈 Positions on close: \n%s',
            createTable(convertPositionsForTable(positionsOnClose)),
        );

        // Add current bars (unmodified originals) to all bars
        allBars.unshift(bars);

        // 2. Generate orders
        const orders = createOrders({
            // Clone allBars so that original cannot be modified (at lest not on first level)
            data: [...allBars],
            cash: currentCash,
            positions: positionsOnClose,
        });

        validateOrders(orders);

        const ordersForTable = orders.map(row => [row.symbol, row.size]);
        log('📤 Orders: %s', orders.length ? `\n${createTable(ordersForTable)}` : 'None');


        result.push({
            date: currentDate,
            orders,
            cash: currentCash,
            cost,
            positionsOnOpen,
            positionsAfterTrade: currentPositions,
            positionsOnClose,
            closedPositions,
        });

    }

    return result;

};
