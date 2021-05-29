/**
 * Calculates amout of trades
 * @param {array}       An array with one entry per date; consists of trade ids for that date
 * @return {number}     Number of trades
 */
export default (data) => {
    if (!Array.isArray(data)) {
        throw new Error(`Expected data to be an array, is ${JSON.stringify(data)} instead.`);
    }
    const allIds = data.flat();
    const uniqueIds = new Set(allIds);
    return uniqueIds.size;
};
