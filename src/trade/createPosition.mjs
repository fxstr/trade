import calculatePositionValue from './calculatePositionValue.mjs';
import validatePosition from './validatePosition.mjs';

/**
 * Creates a correctly formatted position from the parameters provided and calculates current.
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

    const {
        date,
        symbol,
        price,
        exchangeRate,
        pointValue,
        margin,
        settleDifference,
    } = resolvedData;

    if (id && initialPosition) {
        throw new Error(`createPosition: Unexpected parameter id ${id} as initialPosition is set to ${initialPosition}.`);
    }

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
        // no initial position is provided) and/or not supposed to change afterwards.
        margin,
        settleDifference,
        pointValue,
    };

    const value = calculatePositionValue(basePosition, adjustedInitialPosition);

    // If no initialPosition was passed, set value on it; it corresponds to the current value
    // of the position, as it equals initialPosition
    if (!initialPosition) adjustedInitialPosition.value = value;

    // Calculate value depending on initial position if passed, else assume that the current
    // position is the initial position
    const position = {
        ...basePosition,
        value,
        // If position is created (there was no initialPosition passed), use current position
        // as initial position. Adding initialPosition from the beginning reduces special cases.
        initialPosition: adjustedInitialPosition,
    };

    validatePosition(position);

    return position;

};
