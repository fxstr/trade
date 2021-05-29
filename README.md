# Trade


## Introduction

trade is a JavaScript library that executes orders on data, thereby creates a backtest and returns
the resulting positions. Those can be used to generate trading reports.


## Features

- 💾 Use any data source you like – CSV files, a database or a web service
- 🪙 Use almost any instruments you'd like to backtest – stocks, futures, crypto currencies
- ⏱ Use almost any interval on data you like – weekly, daily or even second by second
- 🔌 Simple to use interface – library consists of one main function
- 🧪 Tested library with with high test coverage (>95%)
- 📈 Returns results as a JSON structure for easy reportings and analysis


## Documentation

See the [API documentation](src/trade/trade.md).


## Install

- Install through npm: `npm i -S trade`
- Requires Node.js >= 12


## Example

```javascript

    import { trade } from 'trade';

    /**
     * Get your data from any source you like – a web service, a CSV file, a database. The structure
     * does not matter: if needed, you can transform it in the getData function.
     */
    const data = [
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
    ];

    /**
     * The trade function expects an (async) generator as argument. Every bar (e.g. day for daily
     * data) should yield and contain one object per instrument.
     */
    function* getData() {
        for (const barData of data) {
            // The trade function expects all dates to be JavaScript dates; convert strings to
            // dates
            const parsedData = barData.map(item => ({ ...item, date: new Date(item.date) }));
            yield parsedData;
        }
    }


    /**
     * Create orders is a callback function that will be called by the trade function. Return
     * your orders for the current bar.
     * In this case, we
     * - buy when open is > close, sell when close < open
     * - use equal position size for all instruments
     */
    const createOrders = ({ data, positions, cash }) => {
        // Get newest data (index 0 is current bar's data, index 1 is previous bar's data)
        const [current, previous] = data;

        // If there is no previous data (because we're on the first data) don't trade anything:
        // return empty orders.
        if (!previous) return [];

        // Store the instruments that we want to have long or short positions of
        const expectedPositions = [];

        // Go through all current data and get data for the same instrument on previous bar
        for (const instrumentData of current) {
            const { symbol } = instrumentData;
            // Get previous bar's data for the current symbol
            const previousInstrumentData = previous.find(item => item.symbol === symbol);
            // If there is no data for the previous bar, we don't take or hold a position
            if (!previousInstrumentData) continue;
            // Direction is -1 for short and 1 for long
            const direction = instrumentData.close > previousInstrumentData.close ? 1 : -1;
            expectedPositions.push({ data: instrumentData, direction });
        }

        // Get amount of money available (cash plus value of all all open positions)
        const available = cash + positions.reduce((prev, pos) => prev + pos.value, 0);
        // Divide money equally by all positions we are expected to hold
        const moneyPerPosition = available / expectedPositions.length;
        // Calculate position size for every symbol we hold
        const orders = expectedPositions.map((position) => {
            const currentPosition = positions.find(({ symbol }) => symbol === position.symbol);
            const currentSize = (currentPosition && currentPosition.size) || 0;
            const newSize = Math.floor(moneyPerPosition / position.data.close) * position.direction;
            const orderSize = newSize - currentSize;
            return {
                symbol: position.data.symbol,
                size: orderSize,
            };
        });
        return orders;
    };


    // Start with cash of 10.000
    const cash = 10 ** 4;


    const result = await trade({
        getData,
        createOrders,
        cash,
    });

```

The result will be:

```javascript
[
  {
    "date": "2020-01-01T00:00:00.000Z",
    "orders": [],
    "cash": 10000,
    "cost": 0,
    "positionsOnOpen": [],
    "positionsAfterTrade": [],
    "positionsOnClose": [],
    "closedPositions": []
  },
  {
    "date": "2020-01-02T00:00:00.000Z",
    "orders": [
      {
        "symbol": "AAPL",
        "size": -241
      },
      {
        "symbol": "AMZN",
        "size": 471
      }
    ],
    "cash": 10000,
    "cost": 0,
    "positionsOnOpen": [],
    "positionsAfterTrade": [],
    "positionsOnClose": [],
    "closedPositions": []
  },
  {
    "date": "2020-01-03T00:00:00.000Z",
    "orders": [
      {
        "symbol": "AAPL",
        "size": -242
      },
      {
        "symbol": "AMZN",
        "size": -474
      }
    ],
    "cash": 209.29999999999927,
    "cost": 9790.7,
    "positionsOnOpen": [],
    "positionsAfterTrade": [
      {
        "date": "2020-01-03T00:00:00.000Z",
        "symbol": "AAPL",
        "type": "open",
        "price": 20.3,
        "exchangeRate": 1,
        "size": -241,
        "barsHeld": 0,
        "id": 0,
        "value": 4892.3,
        "initialPosition": {
          "date": "2020-01-03T00:00:00.000Z",
          "symbol": "AAPL",
          "type": "open",
          "price": 20.3,
          "exchangeRate": 1,
          "size": -241,
          "barsHeld": 0,
          "id": 0,
          "margin": 20.3,
          "settleDifference": false,
          "pointValue": 1,
          "value": 4892.3
        }
      },
      {
        "date": "2020-01-03T00:00:00.000Z",
        "symbol": "AMZN",
        "type": "open",
        "price": 10.4,
        "exchangeRate": 1,
        "size": 471,
        "barsHeld": 0,
        "id": 1,
        "value": 4898.400000000001,
        "initialPosition": {
          "date": "2020-01-03T00:00:00.000Z",
          "symbol": "AMZN",
          "type": "open",
          "price": 10.4,
          "exchangeRate": 1,
          "size": 471,
          "barsHeld": 0,
          "id": 1,
          "margin": 10.4,
          "settleDifference": false,
          "pointValue": 1,
          "value": 4898.400000000001
        }
      }
    ],
    "positionsOnClose": [
      {
        "date": "2020-01-03T00:00:00.000Z",
        "symbol": "AAPL",
        "type": "close",
        "price": 20.6,
        "exchangeRate": 1,
        "size": -241,
        "barsHeld": 0,
        "id": 0,
        "value": 4820,
        "initialPosition": {
          "date": "2020-01-03T00:00:00.000Z",
          "symbol": "AAPL",
          "type": "open",
          "price": 20.3,
          "exchangeRate": 1,
          "size": -241,
          "barsHeld": 0,
          "id": 0,
          "margin": 20.3,
          "settleDifference": false,
          "pointValue": 1,
          "value": 4892.3
        }
      },
      {
        "date": "2020-01-03T00:00:00.000Z",
        "symbol": "AMZN",
        "type": "close",
        "price": 10.5,
        "exchangeRate": 1,
        "size": 471,
        "barsHeld": 0,
        "id": 1,
        "value": 4945.5,
        "initialPosition": {
          "date": "2020-01-03T00:00:00.000Z",
          "symbol": "AMZN",
          "type": "open",
          "price": 10.4,
          "exchangeRate": 1,
          "size": 471,
          "barsHeld": 0,
          "id": 1,
          "margin": 10.4,
          "settleDifference": false,
          "pointValue": 1,
          "value": 4898.400000000001
        }
      }
    ],
    "closedPositions": []
  }
]
```


## Contribute

1. Run tests: `npm test`
1. Get test coverage: `npm run coverage`
2. Update docs before publishing: `npm run docs`