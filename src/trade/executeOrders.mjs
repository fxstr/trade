import createPosition from './createPosition.mjs';
import mergeOrders from './mergeOrders.mjs';
import getPositionChanges from './getPositionChanges.mjs';

/**
 * Takes current positions and updates them according to orders. Either
 * - reduces size of an existing position (if it does, part of the position will be returned as 
 *   closedPositions, part as currentPositions)
 * - adds a new position (never enlarges an existing one)
 * - creates a new position (when no position in the given direction existed)
 * Data for current bar is needed as orders can only be created if current bar contains data for
 * the given instrument.
 * Does **NOT** update data of unaffected positions as this is done externally before or after!
 * @param {object} options
 * @param {Order[]} options.orders               Array of orders for current bar
 * @param {Position[]} options.positions         Currently existing positions
 * @param {object[]} options.resolvedData        Resolved data for current bar
 * @param {function} options.createId            A function that returns a new ID on every call
 */
export default ({
    orders,
    positions,
    resolvedData,
    createId,
} = {}) => {

    const mergedOrders = mergeOrders(orders);

    // Simplify orders by merging multiple orders of the same instrument. This allows us to have
    // easy size adjustments as we can close all positions and create new ones in one single
    // order array.
    return mergedOrders.reduce((prev, order) => {


        // Get data for current symbol; return early if it does not exist
        const dataForCurrentSymbol = resolvedData.find(({ symbol }) => symbol === order.symbol);
        if (!dataForCurrentSymbol || order.size === 0) {
            return {
                ...prev,
                currentPositions: [
                    ...prev.currentPositions,
                    ...positions.filter(({ symbol }) => symbol === order.symbol)
                ],
                ordersNotExecuted: [...prev.ordersNotExecuted, order],
            };
        }


        // Get all positions for the current order's symbol
        const existingPositions = positions
            .filter(position => position.symbol === order.symbol);

        // Current positions can only go in one direction as they are always closed when an order
        // goes in the opposite direction.
        const existingTotalSize = existingPositions.reduce((sum, { size }) => sum + size, 0);

        const { sizeToOpen, sizeToClose } = getPositionChanges({
            currentSize: existingTotalSize,
            orderSize: order.size,
        });

        // Create clone that will be returned
        // As there *is* data for the current bar, order will always be executed
        const returnValue = {
            ...prev,
            ordersExecuted: [...prev.ordersExecuted, order],
        };


        // Close oldest positions first: Sort by amount of bars held
        const sortedCurrentPositions = [...existingPositions]
            .sort((a, b) => b.barsHeld - a.barsHeld);


        // Go through current positions; close until sizeToClose is reached, keep the rest
        let toClose = Math.abs(sizeToClose);
        for (const position of sortedCurrentPositions) {

            // Get size of the current position that should be removed/closed
            const currentPositionSizeToClose = Math.min(
                Math.abs(position.size),
                toClose,
            );
            // Make sure we keep whatever's left, but not less thatn 0 (if
            // currentPositionSizeToClose is larger than position.size)
            const currentPositionSizeToKeep = Math.max(
                Math.abs(position.size) - Math.abs(currentPositionSizeToClose),
                0,
            );

            // Positions that are kept (partially or completely)
            if (currentPositionSizeToKeep > 0) {
                returnValue.currentPositions = [
                    ...returnValue.currentPositions,
                    createPosition({
                        size: currentPositionSizeToKeep * Math.sign(position.size),
                        resolvedData: dataForCurrentSymbol,
                        // Orders are always executed on open
                        type: 'open',
                        initialPosition: position.initialPosition,
                        barsHeld: position.barsHeld,
                    }),
                ];
            }

            // Positions that are closed (partially or completely)
            if (currentPositionSizeToClose > 0) {
                returnValue.closedPositions = [
                    ...returnValue.closedPositions,
                    createPosition({
                        size: currentPositionSizeToClose * Math.sign(position.size),
                        resolvedData: dataForCurrentSymbol,
                        // Orders are always executed on open
                        type: 'open',
                        initialPosition: position.initialPosition,
                        barsHeld: position.barsHeld,
                    }),
                ];
            }

            toClose -= currentPositionSizeToClose;

        }

        // Create new position
        if (sizeToOpen) {
            returnValue.currentPositions = [
                ...returnValue.currentPositions,
                createPosition({
                    size: sizeToOpen,
                    resolvedData: dataForCurrentSymbol,
                    // Orders are always executed on open
                    type: 'open',
                    id: createId(),
                }),
            ];
        }

        return returnValue;

    }, {
        // Start with all existing positions that are not affected by current orders; do not
        // update date on them as their data is still based on the previous (not the current) data
        currentPositions: positions
            .filter(position => (
                !mergedOrders.map(({ symbol }) => symbol).includes(position.symbol)
            )),
        closedPositions: [],
        ordersExecuted: [],
        ordersNotExecuted: [],
    });

};
