import createPosition from './createPosition.mjs';

/**
 * Takes current positions and updates them according to orders. Either
 * - reduces size of an existing position
 * - adds a new position (never enlarges an existing one)
 * - creates a new position (when no position in the given direction existed)
 * Data for current bar is needed as orders can only be created if current bar contains data for
 * the given instrument.
 * @param {object} options 
 * @param {Order[]} options.orders               Array of orders for current bar
 * @param {Position[]} options.positions         Currently existing positions
 * @param {object[]} options.resolvedData        Resolved data for current bar
 */
export default ({ orders, positions, resolvedData }) => (

    orders.reduce((prev, order) => {

        // Get existing position for order's symbol, clone them
        const existingPositions = positions
            .filter(pos => pos.symbol === order.symbol)
            .map(pos => ({ ...pos }));

        // Get data for current symbol. There should be only one entry in resolvedData for any
        // symbol
        const dataForCurrentSymbol = resolvedData.find(data => data.symbol === order.symbol);


        // If there's no data for the current bar or no order size, no position can be created
        if (!dataForCurrentSymbol || order.size === 0) {
            // Clone existing positions, if they exist
            return {
                closedPositions: prev.closedPositions,
                currentPositions: [...prev.currentPositions, ...(existingPositions || [])],
            };
        }

        const currentSize = existingPositions.reduce((sum, pos) => sum + pos.size, 0);
        const enlarge = currentSize === 0 || Math.sign(currentSize) === Math.sign(order.size);


        // To enlarge, we always create a new position. If we didn't, we'd have to update the
        // initial position's open value etc. in relation to the initial and the current price.
        if (enlarge) {
            const newPosition = createPosition({
                size: order.size,
                resolvedData: dataForCurrentSymbol,
                // Orders are always executed on open
                type: 'open',
            });
            return {
                closedPositions: prev.closedPositions,
                currentPositions: [
                    ...prev.currentPositions,
                    ...(existingPositions || []),
                    newPosition,
                ],
            };
        }


        // Position is reduced (order.size has the opposite direction of position.size, because
        // there can never be multiple positions that go in different directions)
        else {

            // Close old positions first; sort sorts in place
            const sortedPositions = [...existingPositions].sort((a, b) => b.barsHeld - a.barsHeld)

            // Go through all positions for symbol; reduce, close or keep where necessary,
            // starting with oldest position first
            const { closed, current, reducedBy } = sortedPositions.reduce((adjusted, position) => {

                // Close position as previous position's and its size are smaller than the order's
                // size
                if (adjusted.reducedBy + Math.abs(position.size) <= Math.abs(order.size)) {
                    return {
                        current: adjusted.current,
                        // Position is not updated before closing as this should have happened
                        // right on open
                        closed: [...adjusted.closed, position],
                        reducedBy: adjusted.reducedBy + Math.abs(position.size),
                    }
                }

                // Reduce position as previously closed plus current position are larger than
                // order's size
                else if (adjusted.reducedBy + Math.abs(position.size) > Math.abs(order.size)) {
                    // New position size will be the size of the whole order minus the size of
                    // the previously closed positions. The position's sign will be the opposite 
                    // of order's sign (as the position is reduced).
                    const closedPositionSize = (Math.abs(order.size) - adjusted.reducedBy) *
                        Math.sign(order.size) * -1;
                    return {
                        // Update current position that continues to exist
                        current: [
                            ...adjusted.current,
                            createPosition({
                                size: position.size - closedPositionSize,
                                resolvedData: dataForCurrentSymbol,
                                // Orders are always executed on open
                                type: 'open',
                                initialPosition: position,
                            }),
                        ],
                        // Create a clone for the closed part of the position
                        closed: [
                            ...adjusted.closed,
                            createPosition({
                                size: closedPositionSize,
                                resolvedData: dataForCurrentSymbol,
                                // Orders are always executed on open
                                type: 'open',
                                initialPosition: position,
                            }),
                        ],
                        reducedBy: adjusted.reducedBy + Math.abs(order.size),
                    }
                }

                // Position can stay as it is
                else {
                    return {
                        current: [...adjusted.current, position],
                        closed: adjusted.closed,
                        reducedBy: adjusted.reducedBy,
                    }
                }
            }, { reducedBy: 0, closed: [], current: [] });

            // If after closing all positions, order's size was still not reached by closed
            // positions, create a new position that goes in the opposite direction
            const newPositions = [];
            if (reducedBy < Math.abs(order.size)) {
                newPositions.push(createPosition({
                    resolvedData: dataForCurrentSymbol,
                    type: 'open',
                    size: (Math.abs(order.size) - reducedBy) * Math.sign(order.size),
                }));
            }

            return {
                currentPositions: [...prev.currentPositions, ...current, ...newPositions],
                closedPositions: [...prev.closedPositions, ...closed],
            }

        }

    }, {
        // Start with all existing positions that are not affected by current orders
        currentPositions: positions
            .filter(position => !orders.map(({ symbol }) => symbol).includes(position.symbol)),
        closedPositions: [],
    })

);
