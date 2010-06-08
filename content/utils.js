ahUtils = {
  startsWith: function(str, prefix) {
    return str.lastIndexOf(prefix, 0) == 0;
  },

  endsWith: function(str, suffix) {
    var l = str.length - suffix.length;
    return l >= 0 && str.indexOf(suffix, l) == l;
  },

  makePostData: function(data) {
    let a = [];
    for (let name in data) {
      a.push(encodeURI(name + '=' + data[name]));
    }
    return a.join('&');
  },

  makeUUID: function() {
    // ref. http://lab.liosk.net/uuid/uuid.js
    function rand(max) {
      var B32 = 4294967296; // 2^32
      if (max <= B32) {
        return Math.floor(Math.random() * max);
      } else {
        var d0 = Math.floor(Math.random() * B32);
        var d1 = Math.floor(Math.random() * Math.floor(max / B32));
        return d0 + d1 * B32;
      }
    }
    function hex(n, length) {
      var hex = n.toString(16);
      while (hex.length < length) {
        hex = '0' + hex;
      }
      return hex;
    }

    return [
      hex(rand(4294967296), 8),                   // 4294967296      = 2^32
      hex(rand(65536), 4),                        // 65536           = 2^16
      '4' + hex(rand(4096), 3),                   // version 4; 4096 = 2^12
      hex(8 | rand(4), 1) + hex(rand(4096), 3),   // variant
      hex(rand(281474976710656), 12)              // 281474976710656 = 2^48
    ].join('-');
  },

  _nsIIOService: null,
  asUri: function(uri) {
    if (!this._nsIIOService) {
      this._nsIIOService =
        Components.classes['@mozilla.org/network/io-service;1']
        .getService(Components.interfaces.nsIIOService);
    }
    let baseURI = this._nsIIOService.newURI(ahUtils.getPrefValue(ahConst.prefs.SERVER_URL, ''), null, null);
    return this._nsIIOService.newURI(uri, null, baseURI);
  },

  reduceNodes: function(el, p, val) {
    var rval = val;
    if (el) {
      for (let i = 0, child; child = el.childNodes[i]; i++) {
        rval = p(child, rval);
        rval = this.reduceNodes(child, p, rval);
      }
    }
    return rval;
  },

  isTextNode: function(el) {
    return el.nodeType == 3;
  },

  // ref. http://code.google.com/p/closure-library/source/browse/trunk/closure/goog/base.js
  bind: function(fn, selfObj, var_args) {
    var context = selfObj || goog.global;

    if (arguments.length > 2) {
      var boundArgs = Array.prototype.slice.call(arguments, 2);
      return function() {
        // Prepend the bound arguments to the current arguments.
        var newArgs = Array.prototype.slice.call(arguments);
        Array.prototype.unshift.apply(newArgs, boundArgs);
        return fn.apply(context, newArgs);
      };

    } else {
      return function() {
        return fn.apply(context, arguments);
      };
    }
  },

  _makePrefKey: function(key) {
    return 'extensions.' + ahConst.DOMAIN + '.' + key;
  },

  setPrefValue: function(key, value) {
    Application.prefs.setValue(this._makePrefKey(key), value);
  },

  getPrefValue: function(key, def) {
    return Application.prefs.getValue(this._makePrefKey(key), def);
  },

  hasClassName: function(el, className) {
    let names = el.className;
    return names ? names.split(/\s+/).indexOf(className) >= 0 : false;
  },

  concatTextNode: function(el) {
    return ahUtils.reduceNodes(el, function(el, text) {
      if (ahUtils.isTextNode(el)) {
        text += el.nodeValue;
      }
      return text;
    }, '');
  }
};
