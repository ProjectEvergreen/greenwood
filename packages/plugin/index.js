/*
*  Base class for all Greenwood plugins
*
*/

class GreenwoodPlugin {

  constructor() {

  }

  scaffoldMultiHook(result, replacements) {
    replacements.forEach(({ regex, replace }) => {
      result = this.scaffoldHook(result, regex, replace);
    });
    return result;
  }

  scaffoldHook(result, regex, replace) {
    return result.replace(regex, replace);
  }

}

module.exports = GreenwoodPlugin;