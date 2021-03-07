import debug from 'debug';
import table from 'table';
import convertPositionsForTable from './convertPositionsForTable.mjs';
import complementBar from './complementBar.mjs';
import validateBar from './validateBar.mjs';
import updatePrices from './updatePrices.mjs';
import executeOrders from './executeOrders.mjs';
import normalizeData from './normalizeData.mjs';
import validateOrders from './validateOrders.mjs';
import generateId from './generateId.mjs';

const log = debug('WalkForward');
const createTable = table.table;


/**
 * A single order object that may be returned by the createOrder parameter in {@link trade}.
 * @typedef {object} Order
 * @property {number} size                  Position size; positive for a long and negative for
 *                                          a short position
 * @property {string} symbol                Symbol, e.g. 'AAPL'; must correspond to bar data's
 *                                          symbol
 */

/**
 * A BarData object as it may be returned as an array by the getData parameter of {@link trade}.
 * @typedef {object} BarData
 * @property {string} symbol                Name of the symbol, e.g. 'AAPL'
 * @property {Date} date                    Date of the bar
 * @property {number} open                  Open value
 * @property {number} close                 Close value
 * @property {number} openExchangeRate      Exchange rate to base currency on open
 * @property {number} closeExchangeRate     Exchange rate to base currency on close
 * @property {number} pointValue            Equivialent of a point change in base currency,
 *                                          especially relevant for futures. CBOT corn future e.g.
 *                                          are 5000 bushels/contract, a tick  is 1/4 cent per
 *                                          bushel. Point value is therefore $12.50 (one point in
 *                                          the position's direction equals 5000 bushels * $0.0025)
 * @property {number} margin                Rleative margin of the current symbol (e.g. 0.3 for a
 *                                          30% margin)
 * @property {boolean} settleDifference     True if exchange rate should only be applied to the
 *                                          margin, not the whole position. This is especially the
 *                                          case for futures.
 */


/**
 * A single position as they are created by {@link trade}.
 * @typedef {object} Position
 * @property {string} symbol
 * @property {Date} date
 * @property {number} id                    Position's id; needed to track a position over multiple
 *                                          bars
 * @property {string} type                  Either 'open' or 'close'
 * @property {number} size                  Position size; positive for a long and negative for a
 *                                          short position
 * @property {number} barsHeld              Amount of bars the position was held; starts with 0.
 * @property {Position} initialPosition     Initial position (clone of the position when barsHeld
 *                                          was 0 and type 'open'; needed to calculate value of
 *                                          the position over time)
 * @property {number} price                 Current price (open or close, depending on type) of the
 *                                          underlying symbol (see {@link BarData})
 * @property {number} value                 Positions current value (compare to initialPosition's
 *                                          value to get current gain/loss)
 * @property {number} pointValue            Current point value of the underlying symbol (see
 *                                          {@link BarData})
 * @property {number} exchangeRate          Current exchange rate of the underlying symbol (see
 *                                          {@link BarData})
 * @property {number} margin                Current margin of the underlying symbol (see
 *                                          {@link BarData})
 * @property {boolean} settleDifference     Current settle difference value of the underlying
 *                                          symbol (see {@link BarData})
 */




/**
 * Trades orders on the data provided, thereby creates a backtest and returns the resulting
 * positions. Those can be used to generate trading reports.
 *
 * The function uses the [debug](https://www.npmjs.com/package/debug) library for logs. Set
 * environment variable `DEBUG` to `WalkForward:*` to see what's happening behind the scenes:
 * `export DEBUG=WalkForward:*`
 *
 * @param {function} getData            Async or synchronous generator function that returns an
 *                                      array with any amount of BarData entries.
 *
 * @param {function} createOrders       Callback function that will be called for every bar
 *                                      returned by getData.
 *                                      Takes the following arguments as an object: cash, positions
 *                                      and data.
 *                                      cash is the current cash (number)
 *                                      positions are the currently held position an array of
 *                                      ({@link Position})
 *                                      data is an array of arrays that contain {@link BarData} as
 *                                      yielded by the getData parameter. Every entry corresponds
 *                                      to a bar, when the first entry (0) is the youngest bar. If
 *                                      `historyLength` is set, the length of the parameter will be
 *                                      limited to `historyLenght`.
 *                                      The craeteOrders function is expected to return an array
 *                                      of ({@link Order}).
 *
 * @param {number} cash                 Initial cash
 *
 * @param {number} historyLength        Length of data history that should be passed when calling
 *                                      createOrders. Can be limited to prevent memory overflows
 *                                      (as all data history is kept in memory, if not
 *                                      explicitly reduced through historyLength; this parameter
 *                                      is especially useful for long data series and/or high
 *                                      resolution data).
 *
 * @returns {object[]}                  Array with one entry per bar (same length as param data
 *                                      had). Every entry is an object with
 *                                      - date (Date)
 *                                      - orders ({@link Order}[])
 *                                      - cash (number)
 *                                      - cost (number)
 *                                      - positionsOnOpen ({@link Object}[]); positions from the
 *                                        previous bar, as no trades were yet made (price is the
 *                                        open price)
 *                                      - positionsAfterTrade ({@link Object}[]); positions as they
 *                                        existed right after the trade (price is the open price)
 *                                      - positionsOnClose ({@link Object}[]); positions when the
 *                                        bar closes (price is the close price)
 *                                      - closedPositions ({@link Object}[]); positions that were
 *                                        closed on the current bar and will not exist any more on
 *                                        next bar
 */
async function trade({
    getData,
    createOrders,
    cash,
    historyLength = Infinity,
} = {}) {


    if (typeof getData !== 'function') {
        throw new Error(`trade: Expected argument getData to be a function, you passed ${getData} instead.`);
    }
    if (typeof createOrders !== 'function') {
        throw new Error(`trade: Expected argument createOrders to be a function, you passed ${createOrders} instead.`);
    }
    if (typeof cash !== 'number') {
        throw new Error(`trade: Expected argument cash to be a number, you passed ${cash} instead.`);
    }
    if (historyLength !== Infinity && !Number.isInteger(historyLength)) {
        throw new Error(`trade: Expected argument historyLength to be Infinity or an integer, you passed ${historyLength} instead.`);
    }


    // @type {Array.{date: Date, positions:object[], orders:object[], cash:number}}
    const result = [];

    // Use generateId to create IDs; this allows us to delegate logic to a simple function and
    // saves us from having too much implementation detail in the trade main function
    const createId = generateId();


    // Collects all bars; will be passed to createOrders function. Youngest bar comes first.
    // @type array[]
    let allBars = [];


    for await (const bars of getData()) {

        // If getData() returns null, the loop is done.
        // if (bars === null) break;

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
            createId,
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

        // Add current bars (unmodified originals) to all bars; slice if user passed the
        // corresponding option
        allBars = [bars, ...allBars].slice(0, historyLength);

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

// Function name and export below are needed for a somewhat usable JSDoc output
export default trade;