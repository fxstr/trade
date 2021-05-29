/**
 * Adds defaults to a bar
 * @param {object}   data
 */
export default (data) => {
    const defaults = {
        openExchangeRate: 1,
        closeExchangeRate: 1,
        pointValue: 1,
        margin: data.open,
        settleDifference: false,
    };
    return { ...defaults, ...data };
};
