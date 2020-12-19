/**
 * Returns current value of position. 
 * exchangeRate: > 1 if foreign currency has a higher value than base currency.
 * Ignore size and pointValue changes since open – only the current size is relevant.
 * @param {Position} position              See createPosition()
 * @param {Position} originalPosition      See createPosition()
 * @return {number}
 */
export default (position, originalPosition) => {

    // Calculation is quite simple:
    // - Original full price paid (i.e. margin, if available; adjusted for exhcange rate and point
    //   value)
    // - Adjusted for 
    //   1. Change in exchange rate (for the whole amount [not only margin] if settleDifference
    //      is false; or only for the margin if settleDifference is true, as only the margin is
    //      exposed to the exchange rate risk)
    //   2. Change in price (adjusted for exchangeRate)
    //   3. Ignore changes in point value; is only relevant when opening a new position (and
    //      should basically never happen)
    // The margin that has been paid when the position was opened is bound to the position and will
    // not be converted to cash.

    const pricePaid = originalPosition.margin * originalPosition.pointValue *
        originalPosition.exchangeRate * Math.abs(position.size);
    
    const originalValue = originalPosition.price * originalPosition.pointValue *
        originalPosition.exchangeRate * Math.abs(position.size);

    // Relative change in exchange rate between original and current position
    const exchangeRateFactor = (position.exchangeRate / originalPosition.exchangeRate);
    // Exchange rate is applied to margin if settleDifference is true, else to the whole position
    const absoluteExchangeRateChange = originalPosition.settleDifference ?
        (pricePaid * exchangeRateFactor) - pricePaid :
        (originalValue * exchangeRateFactor) - originalValue;

    // Change in price between original and current date
    const priceChange = (position.price - originalPosition.price) * originalPosition.pointValue *
        position.exchangeRate * position.size;

    return pricePaid + absoluteExchangeRateChange + priceChange; 

}