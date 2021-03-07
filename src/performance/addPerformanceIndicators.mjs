import cagr from './cagr.mjs';
import maxDrawdown from './maxDrawdown.mjs';

/**
 * Adds all performance indicators to the result of a trade (see trade)
 * @param {object[]} result     Result as returned by trade function
 */
export default (result) => {
    const adjustedData = result.map((item) => {
        const positions = item.positionsOnClose.reduce((prev, { value }) => prev + value, 0);
        return {
            cash: item.cash,
            positions,
            total: item.cash + positions,
            date: item.date,
        };
    });

    return {
        cagr: cagr(adjustedData.map(item => [item.date, item.total])),
        maxAbsoluteDrawdown: maxDrawdown(adjustedData.map(({ total }) => total)),
        maxRelativeDrawdown: maxDrawdown(adjustedData.map(({ total }) => total), true),
    };
};
