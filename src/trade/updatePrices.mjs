import createPosition from './createPosition.mjs';

/**
 * Updates all existing positions with value calculated from current price. Returns updated
 * positions without altering arguments.
 * @param {object} options
 * @param {Position[]} options.positions            Current positions to update
 * @param {ResolvedData[]} options.resolvedData     Data for current bar (one entry per symbol)
 * @param {boolean} newBar                          True if bar is opening; will count up barsHeld
 *                                                  on positions
 */
export default ({ positions, resolvedData, newBar = false } = {}) => (

    positions.map((position) => {

        const { symbol } = position;
        const currentDataForPosition = resolvedData.find(data => data.symbol === symbol);

        // There's no data for symbol on the current bar: Return unchanged position. barsHeld can
        // not be counted up as it's not a bar for the *given* symbol.
        if (!currentDataForPosition) return position;

        return createPosition({
            resolvedData: currentDataForPosition,
            size: position.size,
            initialPosition: position.initialPosition,
            type: newBar ? 'open' : 'close',
            barsHeld: newBar ? position.barsHeld + 1 : position.barsHeld,
        });

    })

);
