/**
 * Formats data for use in trade.js (and most other functions)
 */
export default (row, type) => {

    const data = {
        date: row.date,
        symbol: row.symbol,
        settleDifference: row.settleDiff,
    };

    if (type === 'open') {
        data.price = row.open;
        data.exchangeRate = row.openER;
        data.margin = row.openMargin;
        data.pointValue = row.openPV;
    } else if (type === 'close') {
        data.price = row.close;
        data.exchangeRate = row.closeER;
        // Margin and pointValue are basically only needed on open (positions are never created
        // on close)
        data.margin = row.openMargin;
        data.pointValue = row.openPV;
    } else {
        throw `resolveData: type ${type} unknown.`;
    }

    return data;

};