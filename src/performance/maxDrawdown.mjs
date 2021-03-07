/**
 * Returns max drawdown
 * @param {number[]} data       Array of values
 * @param {bool} relative       True to return relative drawdown; false will return absolute
 *                              drawdown
 * @return {number}             Max drawdown (e.g. 0.4 for 40% if relative)
 */
export default (data, relative) => {
    if (!Array.isArray(data)) {
        throw new Error(`Expected data to be an array, is ${JSON.stringify(data)} instead.`);
    }
    return data.reduce((prev, item) => {
        const high = Math.max(prev.high, item);
        const drawdown = Math.max(prev.drawdown, relative ? 1 - (item / high) : high - item);
        return { high, drawdown };
    }, { high: -Infinity, drawdown: 0 }).drawdown;

};
