import test from 'ava';
import trade from './trade.mjs';
import createTestData from '../testData/createTestData.mjs';
import resolveData from '../testData/resolveData.mjs';


/**
 * Returns a function that returns test data for the next date on every call or undefined if it
 * is done.
 */
const createDataGenerator = () => {
    let index = 0;
    const data = createTestData().map(resolveData);
    // Group data by date
    const groupedAsMap = data.reduce((prev, row) => {
        const date = row.date.getTime();
        if (prev.has(date)) prev.get(date).push(row);
        else prev.set(date, [row]);
        return prev;
    }, new Map());
    const groupedAsArray = Array.from(groupedAsMap.values());
    return () => {
        const currentData = groupedAsArray[index];
        index++;
        return currentData;
    };

};


/**
 * Creates a data structure that looks like a position
 */
const createPosition = ({
    currentData,
    originalData,
    barsHeld,
    type,
    originalSize,
    currentSize,
    currentValue,
    originalValue,
}) => ({
    barsHeld,
    date: currentData.date,
    initialPosition: {
        barsHeld: 0,
        date: originalData.date,
        exchangeRate: originalData.openExchangeRate,
        margin: originalData.margin,
        pointValue: originalData.pointValue,
        price: originalData.open,
        settleDifference: originalData.settleDifference,
        size: originalSize,
        symbol: originalData.symbol,
        type: 'open',
        value: originalValue,
    },
    price: currentData[type],
    size: currentSize,
    symbol: currentData.symbol,
    type,
    exchangeRate: currentData[`${type}ExchangeRate`],
    value: currentValue,
});



test('fails with bad arguments', async(t) => {
    // getData not a function
    await t.throwsAsync(() => trade(), {
        message: /getData to be a function, you passed undefined/,
    });
    // createOrders not a function
    await t.throwsAsync(() => trade({ getData: () => {} }), {
        message: /createOrders to be a function, you passed undefined/,
    });
    // Cash not a number
    await t.throwsAsync(() => trade({ getData: () => {}, createOrders: () => {} }), {
        message: /cash to be a number, you passed undefined/,
    });
});


test('fails with invalid data from getData function', async(t) => {
    // Invalid data (not array) returned by getData
    await t.throwsAsync(() => trade({
        getData: () => 7,
        cash: 1000,
        createOrders: () => [],
    }), {
        message: /return an array, got 7 instead/,
    });
    // Invalid data (array that does not contain objects) returned by getData
    await t.throwsAsync(() => trade({
        getData: () => [false],
        cash: 1000,
        createOrders: () => [],
    }), {
        message: /return an object, got false instead/,
    });
    // Invalid data (array that does contains invalid objects) returned by getData
    await t.throwsAsync(() => trade({
        getData: () => [{}],
        cash: 1000,
        createOrders: () => [],
    }), {
        message: /property symbol .* got undefined/,
    });
});



test('calls createPositions with expected arguments', async(t) => {

    const args = [];
    const getData = createDataGenerator();

    const createOrders = (params) => {
        args.push(params);
        // On 1st, buy 2 AAPL
        if (params.data[0][0].date.getDate() === 1 && params.data[0][0].symbol === 'AAPL') {
            return [{ symbol: 'AAPL', size: 2 }];
        }
        return [];
    }

    const cash = 1000;

    await trade({
        getData,
        createOrders,
        cash,
    });

    const getExpectedData = createDataGenerator();
    const firstData = [getExpectedData()];
    const secondData = [getExpectedData(), firstData[0]];

    // There is data for 3 dates
    t.is(args.length, 3);
    t.deepEqual(args[0], {
        data: firstData,
        cash: 1000,
        positions: [],
    });


    t.deepEqual(args[1], {
        data: secondData,
        cash: 838.8,
        positions: [createPosition({
            barsHeld: 0,
            type: 'close',
            // Position is opened on OPEN of second day
            originalData: secondData[0].find(item => item.symbol === 'AAPL'),
            // Current data is CLOSE on second day (orders are always created on close)
            currentData: secondData[0].find(item => item.symbol === 'AAPL'),
            originalSize: 2,
            currentSize: 2,
            originalValue: 161.20000000000002,
            currentValue: 161.20000000000002,
        })],
    });

});


test.only('returns expected results', async(t) => {

    const getData = createDataGenerator();

    const createOrders = (params) => {
        const date = params.data[0][0].date.getDate();
        // On 1st, buy 2 AAPL
        if (date === 1) {
            return [{ symbol: 'AAPL', size: 2 }];
        }
        // On 2nd, short 10 AMZN
        if (date === 2) {
            return [{ symbol: 'AAPL', size: -2 }, { symbol: 'AMZN', size: -10 }];
        }
        return [];
    };

    const cash = 1000;

    const result = await trade({
        getData,
        createOrders,
        cash,
    });

    t.is(result.length, 3);

    const getExpectedData = createDataGenerator();
    const first = getExpectedData();
    const second = getExpectedData();
    const third = getExpectedData();

    // 1st
    t.deepEqual(result[0], {
        date: first[0].date,
        orders: [{ symbol: 'AAPL', size: 2 }],
        cash: 1000,
        cost: 0,
        positionsOnOpen: [],
        positionsAfterTrade: [],
        positionsOnClose: [],
        closedPositions: [],
    });

    // 2nd
    t.deepEqual(result[1], {
        date: second[0].date,
        orders: [{ symbol: 'AAPL', size: -2 }, { symbol: 'AMZN', size: -10 }],
        cash: 838.8,
        // Price 12.4, exchange rate 1.3, size 2, pv 10, margin 6.2
        // 6.2 * 1.3 * 2 * 10 = 161.2
        cost: 161.20000000000002,
        positionsOnOpen: [],
        positionsAfterTrade: [createPosition({
            barsHeld: 0,
            type: 'open',
            // Position is opened on OPEN of second day
            originalData: second.find(item => item.symbol === 'AAPL'),
            currentData: second.find(item => item.symbol === 'AAPL'),
            originalSize: 2,
            currentSize: 2,
            originalValue: 161.20000000000002,
            currentValue: 161.20000000000002,
        })],
        positionsOnClose: [createPosition({
            barsHeld: 0,
            type: 'close',
            // Position is opened on OPEN of second day
            originalData: second.find(item => item.symbol === 'AAPL'),
            currentData: second.find(item => item.symbol === 'AAPL'),
            originalSize: 2,
            currentSize: 2,
            originalValue: 161.20000000000002,
            currentValue: 161.20000000000002,
        })],
        closedPositions: [],
    });

    // 3rd
    t.deepEqual(result[2], {
        date: third[0].date,
        orders: [],
        // AMZN cost 4662, AAPL sold at 134
        cost: 4662 - 134,
        // Previous cash - cost
        cash: (838.8 - 4662) + 134,
        // 2 AAPL at current open prices
        positionsOnOpen: [createPosition({
            barsHeld: 1,
            type: 'open',
            // Position is opened on OPEN of second day
            originalData: second.find(item => item.symbol === 'AAPL'),
            currentData: third.find(item => item.symbol === 'AAPL'),
            originalSize: 2,
            currentSize: 2,
            originalValue: 161.20000000000002,
            // Now price is 12.3 (-0.1), exchange rate 1.2 (-0.1).
            // Old total value: 1.3 * 12.4 * 2 * 10 = 322.4
            // Value adjusted for ER: (1.2 / 1.3) * 1.3 * 12.4 * 2 * 10 = 297.6
            // Loss: 0.1 * 1.2 * 2 * 10 = 2.4
            // Total loss is 24.8 + 2.4 = 27.2
            currentValue: 161.2 - 27.2,
        })],
        // Close AAPL, open AMZN
        positionsAfterTrade: [createPosition({
            barsHeld: 0,
            type: 'open',
            // Position is opened on OPEN of second day
            originalData: third.find(item => item.symbol === 'AMZN'),
            currentData: third.find(item => item.symbol === 'AMZN'),
            originalSize: -10,
            currentSize: -10,
            // -10 * 11.1 * 2.1 * 20
            originalValue: 4662,
            currentValue: 4662,
        })],
        positionsOnClose: [createPosition({
            barsHeld: 0,
            type: 'close',
            // Position is opened on OPEN of second day
            originalData: third.find(item => item.symbol === 'AMZN'),
            currentData: third.find(item => item.symbol === 'AMZN'),
            originalSize: -10,
            currentSize: -10,
            // -10 * 11.1 * 2.1 * 20
            originalValue: 4662,
            // Opened at 22.1, closed at 22.1 – gain 0.1/contract
            // Exchange rate was 2.1, is now 2.2 – gain only on margin (settleDifference is true)
            // = (2.2/2.1 * 4662) - 4662 = 222
            // Price change = 0.1 * 20 * 2.2 * 10 = 44
            currentValue: 4927.999999999999,
        })],
        // Same as positionsOnOpen
        closedPositions: [createPosition({
            barsHeld: 1,
            type: 'open',
            originalData: second.find(item => item.symbol === 'AAPL'),
            currentData: third.find(item => item.symbol === 'AAPL'),
            originalSize: 2,
            currentSize: 2,
            originalValue: 161.20000000000002,
            currentValue: 134,
        })],
    });

});


test('example in code comment works', (t) => {

    const result = trade({
        data: [
            [
                { date: '2020-01-01', open: 20.5, close: 20.9, symbol: 'AAPL' },
                { date: '2020-01-01', open: 10.2, close: 10.1, symbol: 'AMZN' },
            ], [
                { date: '2020-01-02', open: 20.4, close: 20.7, symbol: 'AAPL' },
                { date: '2020-01-02', open: 10.3, close: 10.6, symbol: 'AMZN' },
            ], [
                { date: '2020-01-03', open: 20.3, close: 20.6, symbol: 'AAPL' },
                { date: '2020-01-03', open: 10.4, close: 10.5, symbol: 'AMZN' },
            ]
        ],
        // Function that gets an entry of data and is expected to return in a default format
        // (an object with the mandatory fields symbol (number), price (number) and date (Date))
        resolveData: (row, type) => {
            return {
                symbol: row.symbol,
                price: row[type],
                date: new Date(row.date),
                // You also might return margin (number), exchangeRate (number),
                // settleDifference (bool) or pointValue (number) here
            }
        },
        // Buy when open is > close, sell when close < open. Use equal position size for all
        // instruments.
        createOrders: ({ data, positions, cash }) => {
            // Get newest data (index 0 is current bar's data, index 1 is previous bar's data)
            const [current, previous] = data;
            // If there is no previous data (because we're on the first data) don't trade anything
            if (!previous) return [];
            // Store
            const expectedPositions = [];
            // Go through all current data and get data for the same instrument on previous bar
            for (const instrumentData of current) {
                const { symbol } = instrumentData;
                const previousInstrumentData = previous.find(item => item.symbol === symbol);
                if (previousInstrumentData && previousInstrumentData.close < instrumentData.close) {
                    expectedPositions.push({ data: instrumentData, type: 'long' });
                }
                else if (previousInstrumentData && previousInstrumentData.close > instrumentData.close) {
                    expectedPositions.push({ data: instrumentData, type: 'short' });
                }
            }
            // Get amount of money available (cash plus all positions)
            const available = cash + positions.reduce((prev, pos) => prev + pos.value, 0);
            const moneyPerPosition = available / expectedPositions.length;
            for (const position of expectedPositions) {
                const direction = position.type === 'short' ? -1 : 1;
                position.size = Math.floor(moneyPerPosition / position.data.close) * direction;
            }
            return expectedPositions.map(pos => ({ symbol: pos.data.symbol, size: pos.size }));
        },
        // Trade with an initial amount of 10'000
        cash: 10 ** 4,
    });


    t.is(result.length, 3);
    t.deepEqual(result[1].orders, [
        { symbol: 'AAPL', size: -241 },
        { symbol: 'AMZN', size: 471 },
    ]);
    t.deepEqual(result[2].positionsOnClose.find(item => item.symbol === 'AAPL').value, 4820);
    t.deepEqual(result[2].positionsOnClose.find(item => item.symbol === 'AMZN').value, 4945.5);
    t.deepEqual(result[2].cash, 209.29999999999927);
    // Money available is 9974.8, makes 4987.4 per position
    t.deepEqual(result[2].orders, [
        { symbol: 'AAPL', size: -242 },
        { symbol: 'AMZN', size: -474 },
    ]);
 
});
