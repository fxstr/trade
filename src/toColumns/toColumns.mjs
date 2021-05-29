/**
 * Turns a row-based dataset (where each row represents a date) into a column-based dataset
 * (where each column represents an instrument). Only returns columns with values in the first row
 * of dataset.
 * @param {object[][]} data     dataset where every entry consists of data for the same date
 * @param {number} min          minimum length of data that must exist for an instrument to be
 *                              included in the returned dataset
 * @param {number} maxLength    Length after which the dataset for every instrument will be cut
 * @param {*} columnField       Field of rows by which columns should be grouped
 * @returns {object[][]}        Array with one entry for every instrument; consists of an array
 *                              (one item per bar) of objects which correspond to the data provided
 *                              (with open, close etc.). Oldest bar comes first (data order is
 *                              chronological).
 */
export default ({
    data,
    minLength = 0,
    maxLength = Infinity,
    columnField = 'symbol'
}) => {

    const columns = new Map();
    const [firstRow] = data;

    // Create an entry in columns for columnField of the first row
    firstRow
        .map(item => item[columnField])
        .forEach(name => columns.set(name, []));

    for (const row of data) {
        for (const item of row) {
            const key = item[columnField];
            const column = columns.get(key);
            if (!column || column.length >= maxLength) continue;
            // Modify existing array to improve speed/memory consumption
            column.push(item);
        }
    }

    return Array.from(columns.values())
        .filter(column => column.length >= minLength)
        .map(column => column.reverse());

};
