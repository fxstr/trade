/**
 * Validates an existing position. Only test fields that are not covered by validateResolvedData
 */
export default (position) => {

    const properties = [
        ['type', value => ['open', 'close'].includes(value), 'string with value \'open\' or \'close\''],
        ['size', value => typeof value === 'number', 'number'],
        ['barsHeld', value => typeof value === 'number', 'number'],
    ]

    for (const [key, validate, type] of properties) {
        if (!validate(position[key])) {
            throw new Error(`validatePosition: Expected property ${key} of position to be ${type}, got ${position[key]} instead in ${JSON.stringify(position)}.`)
        }
    }

}
