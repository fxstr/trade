/**
 * Takes bar data and returns normalized data for open or close
 */
export default ({ data, type } = {}) => {

    if (typeof data !== 'object' || data === null) {
        throw new Error(`normalizeData: Argument data must be an object, is ${data} instead.`);
    }

    if (!['open', 'close'].includes(type)) {
        throw new Error(`normalizeData: Argument type must either be 'open' or 'close', is ${type} instead.`);
    }

    return {
        price: data[type],
        exchangeRate: data[`${type}ExchangeRate`],
        pointValue: data.pointValue,
        margin: data.margin,
        date: data.date,
        settleDifference: data.settleDifference,
        symbol: data.symbol,
    };
    
};
