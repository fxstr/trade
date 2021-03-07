/**
 * Returns true if two arrays of primitives are considered the same
 * @param {number[]}    Array of primitives that can be compared with ===
 * @param {number[]}    Array of primitives that can be compared with ===
 */
const isDeepEqual = (a, b) => (
    a.length === b.length && a.every((item, index) => b[index] === item)
);

/**
 * Generates a set of parameters to optimize a backtest.
 * @param {function} params     Any number of functions; they are expected to return an array
 *                              and will get the previous functions' returned values as parameters
 *                              (one parameter per previous argument function)
 *                              Automatically removes duplicates (deep equal) in the result set.
 * @example
 * generateParameters(() => [1, 2], prev => [prev])
 * // Returns [[1, 1], [2, 2]]
 */
export default (...params) => {
    const notAFunction = [...params].find(param => typeof param !== 'function')
    if (notAFunction) {
        throw new Error(`generateParameters: Expects all function arguments to be functions, you passed ${JSON.stringify(notAFunction)} instead.`);
    }
    return params.reduce((prev, generateParams) => {
        const newParams = prev
            .map((previous) => {
                const generatedParams = generateParams(...previous)
                if (!Array.isArray(generatedParams)) {
                    throw new Error(`generateParameters: Expected return value of function parameter to be an array, returned ${JSON.stringify(generatedParams)} instead.`);
                }
                return generatedParams.map(newParam => [...previous, newParam]);
            });
        // Test for array
        return newParams
            .flat()
            .filter((item, index, array) => (
                // An item is considered unique if there's no duplicate at another index than the
                // current index
                array.findIndex(duplicate => isDeepEqual(duplicate, item)) === index
            ));
    }, [[]]);
};
