/** 
 * Adds defaults to resolvedData
 * @param {ResolvedData} data
 */
export default (data) => {
    const defaults = {
        exchangeRate: 1,
        pointValue: 1,
        margin: data.price,
        settleDifference: false,
    };
    return { ...defaults, ...data };
};
