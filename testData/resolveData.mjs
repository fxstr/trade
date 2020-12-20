/**
 * Formats data for use in trade.js (and most other functions)
 */
export default (row) => ({

    date: row.date,
    symbol: row.symbol,
    settleDifference: row.settleDiff,
    open: row.open,
    close: row.close,
    openExchangeRate: row.openER,
    margin: row.openMargin,
    pointValue: row.openPV,
    close: row.close,
    closeExchangeRate: row.closeER,

});