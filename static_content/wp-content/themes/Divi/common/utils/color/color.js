// External Dependencies
import findKey from 'lodash/findKey';
import forEach from 'lodash/forEach';
import includes from 'lodash/includes';
import isNull from 'lodash/isNull';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import { v4 as uuidv4 } from 'uuid';


const regexps = {
  hex: /^#[a-f0-9]{3}([a-f0-9]{3})?$/i,
  rgb: /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d\.]+)?\s*\)$/,
  hsl: /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*[\d\.]+)?\s*\)$/,
};

const conversionMaths = {
  common: [
    { // 1
      h: 15,
      s: 20,
      l: 20,
    },
    { // Base
      h: 0,
      s: 0,
      l: 0,
    },
    { // 3
      h: - 15,
      s: 0,
      l: 0,
    },
    { // 4
      h: - 15,
      s: 0,
      l: - 30,
    },
    { // 5
      h: 165,
      s: 0,
      l: - 20,
    },
    { // 6
      h: 165,
      s: 0,
      l: 0,
    },
    { // 7
      h: 180,
      s: 0,
      l: 0,
    },
    { // 8
      h: 195,
      s: - 20,
      l: 20,
    },
  ],
  black: [
    { // 1
      h: 0,
      s: 0,
      l: 100,
    },
    { // Base
      h: 0,
      s: 0,
      l: 0,
    },
    { // 3
      h: 0,
      s: 0,
      l: 14,
    },
    { // 4
      h: 0,
      s: 0,
      l: 28,
    },
    { // 5
      h: 0,
      s: 0,
      l: 42,
    },
    { // 6
      h: 0,
      s: 0,
      l: 56,
    },
    { // 7
      h: 0,
      s: 0,
      l: 70,
    },
    { // 8
      h: 0,
      s: 0,
      l: 84,
    },
  ],
  white: [
    { // 1
      h: 0,
      s: 0,
      l: - 100,
    },
    { // Base
      h: 0,
      s: 0,
      l: 0,
    },
    { // 3
      h: 0,
      s: 0,
      l: - 16,
    },
    { // 4
      h: 0,
      s: 0,
      l: - 30,
    },
    { // 5
      h: 0,
      s: 0,
      l: - 44,
    },
    { // 6
      h: 0,
      s: 0,
      l: - 58,
    },
    { // 7
      h: 0,
      s: 0,
      l: - 72,
    },
    { // 8
      h: 0,
      s: 0,
      l: - 86,
    },
  ],
};

/**
 * Class for color conversion between RGB, HEX, and HSL color models
 * Also contains helper function for detecting color model type etc.
 */
class ETBuilderUtilsColor {
  static isColorValid(colorString) {
    return ! isUndefined(this.getColorType(colorString));
  }
}

export default ETBuilderUtilsColor;
