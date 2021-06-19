/**
 * Merge multiple orders for the same symbol into one order; makes sure that there is only one
 * order per symbol.
 */
export default (orders) => {
    const mergedOrders = orders.reduce((prev, order) => {
        if (prev.has(order.symbol)) prev.get(order.symbol).size += order.size;
        else prev.set(order.symbol, { ...order });
        return prev;
    }, new Map());
    return [...mergedOrders.values()];
};
