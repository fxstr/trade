import debug from 'debug';
import table from 'table';
import convertPositionsForTable from './convertPositionsForTable.mjs';
import validateResolvedData from './validateResolvedData.mjs';
import complementResolvedData from './complementResolvedData.mjs';
import updatePrices from './updatePrices.mjs';
import executeOrders from './executeOrders.mjs';

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
 * @property {number} price
 * @property {number} pointValue
 * @property {number} exchangeRate
 * @property {number} margin
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
 * @param {array[]} data                Array with one entry per bar which consists of an array
 *                                      with one data structure per instrument. Data structure
 *                                      will be resolved (converted to trade data) via resolveData
 *                                      function.
 * @param {function} resolveData        Takes arguments: data for a bar and 'open' or 'close'.
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
export default ({ data, resolveData, createOrders, cash } = {}) => {


    if (!Array.isArray(data)) {
        throw new Error(`trade: Expected argument data to be an array, you passed ${data} instead.`);
    }
    if (typeof resolveData !== 'function') {
        throw new Error(`trade: Expected argument resolveData to be a function, you passed ${resolveData} instead.`);
    }
    if (typeof createOrders !== 'function') {
        throw new Error(`trade: Expected argument createOrders to be a function, you passed ${createOrders} instead.`);
    }
    if (typeof cash !== 'number') {
        throw new Error(`trade: Expected argument cash to be a number, you passed ${cash} instead.`);
    }


    // @type {Array.{date: Date, positions:object[], orders:object[], cash:number}}
    const result = [];

    // Go through data; use for-of-loop for async executeOrders (if user uses async function)
    for (const bar of data) {

        log('🔽 '.repeat(32));

        // Get date from first symbol's entry in bar
        const currentDate = resolveData(bar[0], 'open').date;
        log('📅 %s', currentDate);
        console.log(currentDate);

        // Resolve all data for current bar
        const resolvedOpenData = bar
            .map(data => resolveData(data, 'open'))
            // Validate before and after complementResolvedData to get best error messages possible
            .map(validateResolvedData)
            .map(complementResolvedData)
            .map(validateResolvedData);

        const resolvedCloseData = bar
            .map(data => resolveData(data, 'close'))
            // Validate before and after complementResolvedData to get best error messages possible
            .map(validateResolvedData)
            .map(complementResolvedData)
            .map(validateResolvedData);

        // Previous is either the last row of result (if existing) or an (empty) default
        const previous = result.slice(-1).pop() || {
            orders: [],
            cash,
            positionsOnClose: [],
        }


        // Open
        // 1. Update prices
        const positionsOnOpen = updatePrices({
            positions: previous.positionsOnClose,
            resolvedData: resolvedOpenData,
            newBar: true,
        });

        log('📈 Positions on open: \n%s', createTable(convertPositionsForTable(positionsOnOpen)));

        // 2. Execute orders
        const { currentPositions, closedPositions } = executeOrders({
            orders: previous.orders,
            resolvedData: resolvedOpenData,
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
            resolvedData: resolvedCloseData,
        });

        log('📈 Positions on close: \n%s', createTable(convertPositionsForTable(positionsOnClose)));

        // 2. Generate orders
        const orders = createOrders({
            data: data
                .filter((dataForDate) => {
                    if (!dataForDate.length) return false;
                    const date = resolveData(dataForDate[0], 'close').date;
                    return date.getTime() <= currentDate.getTime()
                })
                // Return data for youngest bar first
                .reverse(),
            cash: currentCash,
            positions: positionsOnClose,
        });

        // TODO: Validate orders here

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
