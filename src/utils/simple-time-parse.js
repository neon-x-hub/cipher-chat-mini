/**
 * Parses a time input and returns a corresponding Date object.
 *
 * @param {string|Date} input - The time input to parse. It can be:
 *                         - A Date object (returned as is).
 *                         - 'now' to return the current date and time.
 *                         - A string in the format '[number][d|h|m]' for relative times,
 *                           where 'd' stands for days, 'h' for hours, and 'm' for minutes.
 *                         - A standard date string that can be parsed to a valid Date.
 * @returns {Date} - A Date object representing the parsed time.
 * @throws {Error} - If the input cannot be parsed into a valid date.
 */
const SimpleTimeParse = (input) => {
    if (input instanceof Date) {
        if (isNaN(input.getTime())) {
            throw new Error(`Invalid Date object provided: ${input}`);
        }
        return input;
    }

    if (input === 'now') return new Date();

    if (typeof input === 'string' && /^\d+[dhm]$/.test(input)) {
        const value = parseInt(input);
        if (input.endsWith('d')) return new Date(Date.now() - value * 86400000);
        if (input.endsWith('h')) return new Date(Date.now() - value * 3600000);
        if (input.endsWith('m')) return new Date(Date.now() - value * 60000);
    }

    const date = new Date(input);

    if (isNaN(date.getTime())) {
        throw new Error(`Invalid time input: "${input}"`);
    }

    return date;
};

module.exports = SimpleTimeParse;
