import calculatePositionValue from './calculatePositionValue.mjs';
import validateResolvedData from './validateResolvedData.mjs';
import validatePosition from './validatePosition.mjs';

/** 
 * Creates a correctly formatted position from the parameters provided and calculates current.
 * @param {object} options          Options object
 * @returns {object}
 */
export default ({
    resolvedData,
    size,
    initialPosition = null,
    barsHeld = 0,
    type,
} = {}) => {

    validateResolvedData(resolvedData);

    const {
        date,
        symbol,
        price,
        exchangeRate,
        pointValue,
        margin,
        settleDifference,
    } = resolvedData;

    // Create base position to calculate value from
    const basePosition = {
        date,
        symbol,
        price,
        exchangeRate,
        pointValue,
        margin,
        settleDifference,
        size,
        barsHeld,
        initialPosition,
        type,
    };

    const value = calculatePositionValue(basePosition, initialPosition || basePosition);

    // Calculate value depending on initial position if passed, else assume that the current
    // position is the initial position
    const position = {
        ...basePosition,
        value,
        // If position is created (there was no initialPosition passed), use current position
        // as initial position. Adding initialPosition from the beginning reduces special cases.
        initialPosition: basePosition.initialPosition || {
            ...basePosition,
            value,
        },
    };

    validatePosition(position);

    return position;

};
