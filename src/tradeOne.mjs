/*import debug from 'debug';

const log = debug('tradeOne');

/**
 * Trades one single instrument with size 1 long/short. Returns close value for every bar.
 * @param {array} data
 * @param {function} getFields     Function that is called with every row and returns [open, close]
 *                                 for the given row
 * @param {function} getDirection  Function that is called with every row; returns 0 if no position
 *                                 is taken, > 0 for long and < 0 for short
 */
/*export default ({
    data,
    getFields,
    // Don't trade by default
    getDirection = () => 0,
} = {}) => {
    if (!Array.isArray(data)) {
        throw new Error(`tradeOne: Named argument data must be an array, is ${data} instead.`);
    }
    if (typeof getFields !== 'function') {
        throw new Error(`tradeOne: Named argument getFields must be a function, is ${getFields} instead.`);
    }
    if (typeof getDirection !== 'function') {
        throw new Error(`tradeOne: Named argument getDirection must be a function, is ${getDirection} instead.`);
    }

    const traded = data
        .reduce((allPrevious, item, index) => {
            const fields = getFields(item);
            if (!Array.isArray(fields)) {
                throw new Error(`tradeOne: Expects function getFields to return an array, got ${fields} instead.`);
            }
            const [open, close] = fields;
            if (typeof open !== 'number' || typeof close !== 'number' || Number.isNaN(open) || Number.isNaN(close)) {
                throw new Error(`tradeOne: Expected first and second entry of getFields return value to be numbers, they are ${open} and ${close} instead.`);
            }
            const previousBar = allPrevious.slice(-1).pop();
            // Position is held until current open; get (open - previous close) for previous
            // direction and (close - open) for current direction.
            const openToPreviousClose = previousBar.close === undefined ? 0 :
                previousBar.positionSize * (open - previousBar.close);
            const closeToOpen = previousBar.orderSize * (close - open);
            // Call getDirection with (current row, all previous rows with newest first); use
            // Math.max() to not have negative indexes (which will slice from the end)
            const direction = getDirection(item, data.slice(0, Math.max(index, 0)).reverse());
            if (typeof direction !== 'number' || Number.isNaN(direction)) {
                throw new Error(`tradeOne: Expected return value of getDirection to be a number, is ${direction} instead.`);
            }
            // Convert direction to -1, 0 or 1
            const orderSize = direction === 0 ? 0 : direction / Math.abs(direction);
            const value = previousBar.value + openToPreviousClose + closeToOpen;
            log(
                'Bar %d\nPrev close %d, open %d, close %d\nSize until open %d, after open %d\nOvernight gain %d, daylight gain %d\nValue %d\nOrder size for next bar %d\n\n',
                index + 1,
                previousBar.close,
                open,
                close,
                previousBar.positionSize,
                previousBar.orderSize,
                openToPreviousClose,
                closeToOpen,
                value,
                orderSize,
            );
            return [...allPrevious, {
                orderSize,
                positionSize: previousBar.orderSize,
                close,
                value,
            }];
        },
        // Create order on close, trade on open; to do so, we have to 
        // Value starts with 0; add open price of first trade later
        [{ orderSize: 0, positionSize: 0, close: undefined, value: 0 }]);

    // Get first result with a value != 0; add its open value to all items (to move our starting
    // point from 0 to the value of the first trade).
    const firstValue = traded.find(({ value }) => value !== 0);
    const offset = firstValue ? (firstValue.close - firstValue.value) : 0;

    const result = traded
        .map(({ value }) => value + offset)
        // Remove initial value from reduce function
        .slice(1);

    return result;

};
*/
