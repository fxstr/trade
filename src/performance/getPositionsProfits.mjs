/**
 * Returns profit of position when it was closed; result is negative for loss
 * @param {Position[][]}  Positions in an array for a data, in an array for all dates
 */
export default (positionsByDate) => {
    // Store last position with given id in positionsById; it contains all data we need to
    // calculate P/L
    if (!Array.isArray(positionsByDate)) {
        throw new Error(`getPositionsProfit: Expected argument to be an array, got ${JSON.stringify(positionsByDate)} instead.`);
    }
    const positionsById = new Map();
    const allPositions = positionsByDate.flat();
    for (const position of allPositions) {
        positionsById.set(position.id, position.profit);
    }
    return [...positionsById.values()];

};
