# Trade


## Introduction

Executes (backtests) trades …

Supports:
- Reading data from CSV files
- Sorting, filtering and grouping
- Addding new rows and columns
- Merging multiple DataSeries
- Batch-renaming columns and batch-updating values
- Adding derived data based on segments of data


## Documentation

See the [API documentation](./src/DataSeries/DataSeries.md).


## Install

- Install through npm: `npm i -S dataseries`
- Requires Node 12 (for private class fields)


## Example

```javascript
// Read data from a CSV file; dataFolder is the current execution path (which is needed if
// you are using ES6 modules)
const dataFolder = dirname(fileURLToPath(new URL(import.meta.url)));

// Calculates arithmetic mean of an arbitrary amount of numbers
const mean = (...numbers) => numbers.reduce((sum, nr) => sum + nr, 0) / numbers.length;

const dataSeries = DataSeries
    // Create dataSeries from a CSV file
    .fromCSV(`${dataFolder}/testData/AAPL.csv`)
    // Convert every column's data into the correct format (is a string by default)
    .updateValues((key, value) => {
        // Convert data of column 'date' to a JS date
        if (key === 'date') return new Date(value);
        // Convert all other columns to a number
        return parseFloat(value);
    })
    // Add a new column 'mean' that contains the arithmetic mean of the column 'close' for 5
    // rows
    .addColumnsFromSegments(['close'], 5, closeData => (
        new Map([['arithmeticMeanOfClose', mean(...closeData)]])
    ));

// Print the first five rows
console.log(dataSeries.head(5).getData());
```


## Contribute

1. Run tests: `npm test`
2. Update docs when publishing: `npm run docs`