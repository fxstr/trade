import cagr from './cagr.mjs';
import maxDrawdown from './maxDrawdown.mjs';
import countTrades from './countTrades.mjs';
import getPositionsProfits from './getPositionsProfits.mjs';

/**
 * Adds all performance indicators to the result of a trade (see trade)
 * @param {object[]} result     Result as returned by trade function
 */
export default (result) => {

    const adjustedData = result.map((item) => {
        // Value of all current positions
        const positionsValue = item.positionsOnClose.reduce((prev, { value }) => prev + value, 0);
        return {
            cash: item.cash,
            total: item.cash + positionsValue,
            date: item.date,
            positionIds: item.positionsOnClose.map(({ id }) => id),
        };
    });

    const cagrValue = cagr(adjustedData.map(item => [item.date, item.total]));
    const maxAbsoluteDrawdown = maxDrawdown(adjustedData.map(({ total }) => total));
    const maxRelativeDrawdown = maxDrawdown(adjustedData.map(({ total }) => total), true);
    // TODO: Also count reduction in size (position and its id stay unmodified when a position's
    // size is reduced)
    const tradeCount = countTrades(adjustedData.map(({ positionIds }) => positionIds));
    // Final value of a position is just before it is closed (right after the open of a
    // bar); therefore use positionsOnOpen (value of the position on the open of a bar)
    const tradeProfits = getPositionsProfits(result
        .map(({ positionsOnOpen }) => positionsOnOpen));
    const numberOfProfitableTrades = tradeProfits.filter(profit => profit > 0).length;
    const numberOfLosingTrades = tradeProfits.filter(profit => profit < 0).length;
    const percentProfitable = numberOfProfitableTrades / tradeProfits.length;
    const sum = (prev, item) => prev + item;
    const averageProfit = tradeProfits.reduce(sum) / tradeProfits.length;

    return {
        cagr: cagrValue,
        maxAbsoluteDrawdown,
        maxRelativeDrawdown,
        cagrTimesInvertedRelativeDrawdown: cagrValue * (1 - maxRelativeDrawdown),
        tradeCount,
        numberOfProfitableTrades,
        numberOfLosingTrades,
        percentProfitable,
        averageProfit,
    };
};
