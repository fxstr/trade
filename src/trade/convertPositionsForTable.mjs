/**
 * Converts position in order to be used in a table (generated through the table npm plugin)
 */
export default (positions) => {
    const positionsForTable = positions
        .map(position => [
            position.symbol,
            position.size,
            position.value.toFixed(2),
            position.price,
            position.margin,
            position.exchangeRate,
            position.pointValue,
            position.barsHeld,
            position.initialPosition.margin,
            position.initialPosition.price,
        ]);
    positionsForTable.unshift([
        'Symbol',
        'Size',
        'Value',
        'Price',
        'Margin',
        'ER', // Exchange Rate
        'PV', // Point value
        'Bars',
        '0Margin', // Initial Margin
        '0Price', // Initial Price
    ]);
    if (!positions.length) {
        const emptyRow = Array
            .from({ length: positionsForTable[0].length })
            .map(() => '–');
        positionsForTable.push(emptyRow);
    }
    return positionsForTable;
}
