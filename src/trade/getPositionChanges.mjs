/**
 * Returns size of exiting positions that should be closed and size of new positions that should be
 * opened
 * @param {number} currentSize
 * @param {number} orderSize
 * @returns {object}                Object with properties
 *                                  - sizeToClose: Current position size that should be closed;
 *                                    has the same sign (direction) as current position
 *                                  - sizeToOpen: Size of new position to open (in the direction of
 *                                    the new position)
 */
export default ({ currentSize, orderSize }) => {
    const sameDirection = Math.sign(orderSize) === Math.sign(currentSize);
    // Positions will change from positive to negative (or inverse) if current position's sign
    // does not equal future position's sign
    const willSwitch = Math.sign(currentSize + orderSize) !== Math.sign(currentSize);
    let sizeToOpen = 0;
    if (sameDirection) sizeToOpen = orderSize;
    else if (willSwitch) sizeToOpen = currentSize + orderSize;
    let sizeToClose = 0;
    if (willSwitch) sizeToClose = currentSize;
    else if (!sameDirection) sizeToClose = orderSize * -1;
    return { sizeToClose, sizeToOpen };
};
