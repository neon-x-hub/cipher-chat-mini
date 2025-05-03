const ColorHash = require('color-hash').default;
const colorHash = new ColorHash({
    lightness: [0.4, 0.5, 0.6],
    saturation: 0.7
});
/**
 * Returns a color in hex format, given a string.
 * The color is consistent for a given string, so
 * it's suitable for generating colors for user names
 * or similar.
 * @param {string} str - The string to generate a color for.
 * @returns {string} - A color in hex format.
 */
function string2color(str) {
    return colorHash.hex(str);
}

module.exports = string2color;
