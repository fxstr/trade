/**
 * Calculates CAGR
 * @param {array}       An array with one entry per date; every date entry consists of [date, value]
 *                      where date is a Date object and value a number.
 * @return {number}     CAGR in parts (percent / 100)
 */
export default (data) => {
    if (!Array.isArray(data)) {
        throw new Error(`Expected data to be an array, is ${JSON.stringify(data)} instead.`);
    }
    const first = data[0];
    const last = data[data.length - 1];
    const msDifference = last[0].getTime() - first[0].getTime();
    const yearDifference = msDifference / 1000 / 60 / 60 / 24 / 365.2425;
    // https://www.investopedia.com/terms/c/cagr.asp
    return ((last[1] / first[1]) ** (1 / yearDifference)) - 1;
};
