/**
 * Function resolveData is expected to return an object with all relevant properties for an
 * instrument and the current bar. Check if returned value matches that expectation.
 * @param {object} resolvedData
 * @throws
 */
export default (resolvedData) => {

    if (typeof resolvedData !== 'object' || resolvedData === null) {
        throw new Error(`validateResolvedData: Expected resolveData to return an object, got ${JSON.stringify(resolvedData)} instead.`);
    }
    
    const properties = [
        ['symbol', symbol => typeof symbol === 'string', 'string'],
        ['date', date => date instanceof Date, 'date'],
        ['price', price => typeof price === 'number', 'number'],
        ['exchangeRate', rate => rate === undefined || typeof rate === 'number', 'undefined or number'],
        ['pointValue', value => value === undefined || typeof value === 'number',  'undefined or number'],
        ['margin', margin => margin === undefined || typeof margin === 'number',  'undefined or number'],
        ['settleDifference', settle => settle === undefined || typeof settle === 'boolean',  'undefined or boolean'],
    ];

    for (const [key, validate, type] of properties) {
        if (!validate(resolvedData[key])) {
            throw new Error(`validateResolvedData: Expected property ${key} of resolvedData to be ${type}, got ${resolvedData[key]} instead in ${JSON.stringify(resolvedData)}.`)
        }
    }

    // Return original data so that function can be used as an argument in e.g. array.map and
    // chained
    return resolvedData;
    
};
