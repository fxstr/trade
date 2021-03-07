export default (orders) => {
    if (!Array.isArray(orders)) {
        throw new Error(`validateOrders: orders must be an array, is ${orders} instead.`);
    }
    for (const order of orders) {
        if (typeof order.symbol !== 'string' || !order.symbol) {
            throw new Error(`validateOrders: order must contain a property symbol which is a string; order ${JSON.stringify(order)} is not valid.`);
        }
        if (typeof order.size !== 'number') {
            throw new Error(`validateOrders: order must contain a property size which is a number; order ${JSON.stringify(order)} is not valid.`);
        }
        if (!Number.isFinite(order.size)) {
            throw new Error(`validateOrders: order's size must be finite, is ${order.size} instead.`);
        }
    }
};
