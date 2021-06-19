import calculatePositionValue from './calculatePositionValue.mjs';
import validatePosition from './validatePosition.mjs';

/**
 * Creates a correctly formatted position from the parameters provided and calculates current
 * value.
 * Initial position's size stays unmodified; size of original position may therefore be different
 * from current position (if position size is reduced).
 * @param {object} options          Options object
 * @returns {object}
 */
export default ({
    resolvedData,
    size,
    type,
    initialPosition = null,
    barsHeld = 0,
    id,
} = {}) => {

    const validate = (parameterName, value, test, message) => {
        if (!test(value)) throw new Error(`createPosition: Parameter ${parameterName} did not pass test: ${message}, is ${value} instead.`);
    }

    const isValidId = id !== undefined && id !== null;
    if (isValidId && initialPosition) {
        throw new Error(`createPosition: Unexpected parameter id ${id} as initialPosition is set to ${initialPosition}.`);
    }
    if (!isValidId && !initialPosition) {
        throw new Error(`createPosition: Either pass parameter id (is ${id}) or initialPosition (is ${initialPosition}).`);
    }
    validate('resolvedData', resolvedData, data => data !== null && typeof data === 'object', 'must be an object');
    validate('size', size, nr => typeof nr === 'number', 'must be a number');
    validate('type', type, type => ['open', 'close'].includes(type), 'must be "open" or "close"');
    validate('barsHeld', barsHeld, barsHeld => typeof barsHeld === 'number', 'must be a number');

    const {
        date,
        symbol,
        price,
        exchangeRate,
        pointValue,
        margin,
        settleDifference,
    } = resolvedData;
    validate('resolvedData.date', date, date => date instanceof Date, 'must be a Date object');
    validate('resolvedData.symbol', symbol, symbol => !!symbol, 'must be provided');
    validate('resolvedData.price', price, value => typeof value === 'number', 'must be a number');
    validate('resolvedData.exchangeRate', exchangeRate, value => typeof value === 'number', 'must be a number');
    validate('resolvedData.pointValue', pointValue, value => typeof value === 'number', 'must be a number');
    validate('resolvedData.margin', margin, value => typeof value === 'number', 'must be a number');
    validate('resolvedData.settleDifference', settleDifference, value => typeof value === 'boolean', 'must be a boolean');

    const positionId = id ?? initialPosition.id;

    // Create base position to calculate value from
    const basePosition = {
        date,
        symbol,
        type,
        price,
        exchangeRate,
        size,
        barsHeld,
        id: positionId,
    };

    const adjustedInitialPosition = initialPosition || {
        ...basePosition,
        // Margin, settleDifference and pointValue are only relevant on inital position (i.e. if
        // no initial position is provided) because they are not supposed to change afterwards.
        margin,
        settleDifference,
        pointValue,
    };

    const value = calculatePositionValue(basePosition, adjustedInitialPosition);

    // Original position, adjusted for current position's size; needed to calculate current profit
    // which corresponds to current value - original value (at the same size)
    const originalPositionAdjustedForSize = { ...adjustedInitialPosition, size };
    const originalValueAdjustedForSize = calculatePositionValue(originalPositionAdjustedForSize,
        originalPositionAdjustedForSize);
    const profit = value - originalValueAdjustedForSize;

    // If no initialPosition was passed, set value on it; it corresponds to the current value
    // of the position, as it equals initialPosition
    if (!initialPosition) {
        adjustedInitialPosition.value = value;
        adjustedInitialPosition.profit = 0;
    }

    // Calculate value depending on initial position if passed, else assume that the current
    // position is the initial position
    const position = {
        ...basePosition,
        value,
        // If position is created (there was no initialPosition passed), use current position
        // as initial position. Adding initialPosition from the beginning reduces special cases.
        initialPosition: adjustedInitialPosition,
        profit,
    };

    validatePosition(position);

    return position;

};
