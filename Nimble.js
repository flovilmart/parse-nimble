//  Underscore.string
//  (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
//  Underscore.string is freely distributable under the terms of the MIT license.
//  Documentation: https://github.com/epeli/underscore.string
//  Some code is borrowed from MooTools and Alexandru Marasteanu.
//  Version '2.3.3'

!function(root, String){
  'use strict';

  // Defining helper functions.

  var nativeTrim = String.prototype.trim;
  var nativeTrimRight = String.prototype.trimRight;
  var nativeTrimLeft = String.prototype.trimLeft;

  var parseNumber = function(source) { return source * 1 || 0; };

  var strRepeat = function(str, qty){
    if (qty < 1) return '';
    var result = '';
    while (qty > 0) {
      if (qty & 1) result += str;
      qty >>= 1, str += str;
    }
    return result;
  };

  var slice = [].slice;

  var defaultToWhiteSpace = function(characters) {
    if (characters == null)
      return '\\s';
    else if (characters.source)
      return characters.source;
    else
      return '[' + _s.escapeRegExp(characters) + ']';
  };

  // Helper for toBoolean
  function boolMatch(s, matchers) {
    var i, matcher, down = s.toLowerCase();
    matchers = [].concat(matchers);
    for (i = 0; i < matchers.length; i += 1) {
      matcher = matchers[i];
      if (!matcher) continue;
      if (matcher.test && matcher.test(s)) return true;
      if (matcher.toLowerCase() === down) return true;
    }
  }

  var escapeChars = {
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: "'"
  };

  var reversedEscapeChars = {};
  for(var key in escapeChars) reversedEscapeChars[escapeChars[key]] = key;
  reversedEscapeChars["'"] = '#39';

  // sprintf() for JavaScript 0.7-beta1
  // http://www.diveintojavascript.com/projects/javascript-sprintf
  //
  // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
  // All rights reserved.

  var sprintf = (function() {
    function get_type(variable) {
      return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }

    var str_repeat = strRepeat;

    var str_format = function() {
      if (!str_format.cache.hasOwnProperty(arguments[0])) {
        str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
      }
      return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
      for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i]);
        if (node_type === 'string') {
          output.push(parse_tree[i]);
        }
        else if (node_type === 'array') {
          match = parse_tree[i]; // convenience purposes only
          if (match[2]) { // keyword argument
            arg = argv[cursor];
            for (k = 0; k < match[2].length; k++) {
              if (!arg.hasOwnProperty(match[2][k])) {
                throw new Error(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
              }
              arg = arg[match[2][k]];
            }
          } else if (match[1]) { // positional argument (explicit)
            arg = argv[match[1]];
          }
          else { // positional argument (implicit)
            arg = argv[cursor++];
          }

          if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
            throw new Error(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
          }
          switch (match[8]) {
            case 'b': arg = arg.toString(2); break;
            case 'c': arg = String.fromCharCode(arg); break;
            case 'd': arg = parseInt(arg, 10); break;
            case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
            case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
            case 'o': arg = arg.toString(8); break;
            case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
            case 'u': arg = Math.abs(arg); break;
            case 'x': arg = arg.toString(16); break;
            case 'X': arg = arg.toString(16).toUpperCase(); break;
          }
          arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
          pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
          pad_length = match[6] - String(arg).length;
          pad = match[6] ? str_repeat(pad_character, pad_length) : '';
          output.push(match[5] ? arg + pad : pad + arg);
        }
      }
      return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
      var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        }
        else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
          parse_tree.push('%');
        }
        else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else {
                  throw new Error('[_.sprintf] huh?');
                }
              }
            }
            else {
              throw new Error('[_.sprintf] huh?');
            }
            match[2] = field_list;
          }
          else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw new Error('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
          }
          parse_tree.push(match);
        }
        else {
          throw new Error('[_.sprintf] huh?');
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return parse_tree;
    };

    return str_format;
  })();



  // Defining underscore.string

  var _s = {

    VERSION: '2.3.0',

    isBlank: function(str){
      if (str == null) str = '';
      return (/^\s*$/).test(str);
    },

    stripTags: function(str){
      if (str == null) return '';
      return String(str).replace(/<\/?[^>]+>/g, '');
    },

    capitalize : function(str){
      str = str == null ? '' : String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    chop: function(str, step){
      if (str == null) return [];
      str = String(str);
      step = ~~step;
      return step > 0 ? str.match(new RegExp('.{1,' + step + '}', 'g')) : [str];
    },

    clean: function(str){
      return _s.strip(str).replace(/\s+/g, ' ');
    },

    count: function(str, substr){
      if (str == null || substr == null) return 0;

      str = String(str);
      substr = String(substr);

      var count = 0,
        pos = 0,
        length = substr.length;

      while (true) {
        pos = str.indexOf(substr, pos);
        if (pos === -1) break;
        count++;
        pos += length;
      }

      return count;
    },

    chars: function(str) {
      if (str == null) return [];
      return String(str).split('');
    },

    swapCase: function(str) {
      if (str == null) return '';
      return String(str).replace(/\S/g, function(c){
        return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      });
    },

    escapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, function(m){ return '&' + reversedEscapeChars[m] + ';'; });
    },

    unescapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/\&([^;]+);/g, function(entity, entityCode){
        var match;

        if (entityCode in escapeChars) {
          return escapeChars[entityCode];
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
          return String.fromCharCode(parseInt(match[1], 16));
        } else if (match = entityCode.match(/^#(\d+)$/)) {
          return String.fromCharCode(~~match[1]);
        } else {
          return entity;
        }
      });
    },

    escapeRegExp: function(str){
      if (str == null) return '';
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    },

    splice: function(str, i, howmany, substr){
      var arr = _s.chars(str);
      arr.splice(~~i, ~~howmany, substr);
      return arr.join('');
    },

    insert: function(str, i, substr){
      return _s.splice(str, i, 0, substr);
    },

    include: function(str, needle){
      if (needle === '') return true;
      if (str == null) return false;
      return String(str).indexOf(needle) !== -1;
    },

    join: function() {
      var args = slice.call(arguments),
        separator = args.shift();

      if (separator == null) separator = '';

      return args.join(separator);
    },

    lines: function(str) {
      if (str == null) return [];
      return String(str).split("\n");
    },

    reverse: function(str){
      return _s.chars(str).reverse().join('');
    },

    startsWith: function(str, starts){
      if (starts === '') return true;
      if (str == null || starts == null) return false;
      str = String(str); starts = String(starts);
      return str.length >= starts.length && str.slice(0, starts.length) === starts;
    },

    endsWith: function(str, ends){
      if (ends === '') return true;
      if (str == null || ends == null) return false;
      str = String(str); ends = String(ends);
      return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
    },

    succ: function(str){
      if (str == null) return '';
      str = String(str);
      return str.slice(0, -1) + String.fromCharCode(str.charCodeAt(str.length-1) + 1);
    },

    titleize: function(str){
      if (str == null) return '';
      str  = String(str).toLowerCase();
      return str.replace(/(?:^|\s|-)\S/g, function(c){ return c.toUpperCase(); });
    },

    camelize: function(str){
      return _s.trim(str).replace(/[-_\s]+(.)?/g, function(match, c){ return c ? c.toUpperCase() : ""; });
    },

    underscored: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return _s.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },

    classify: function(str){
      return _s.titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '');
    },

    humanize: function(str){
      return _s.capitalize(_s.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
    },

    trim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrim) return nativeTrim.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('^' + characters + '+|' + characters + '+$', 'g'), '');
    },

    ltrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimLeft) return nativeTrimLeft.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('^' + characters + '+'), '');
    },

    rtrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimRight) return nativeTrimRight.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp(characters + '+$'), '');
    },

    truncate: function(str, length, truncateStr){
      if (str == null) return '';
      str = String(str); truncateStr = truncateStr || '...';
      length = ~~length;
      return str.length > length ? str.slice(0, length) + truncateStr : str;
    },

    /**
     * _s.prune: a more elegant version of truncate
     * prune extra chars, never leaving a half-chopped word.
     * @author github.com/rwz
     */
    prune: function(str, length, pruneStr){
      if (str == null) return '';

      str = String(str); length = ~~length;
      pruneStr = pruneStr != null ? String(pruneStr) : '...';

      if (str.length <= length) return str;

      var tmpl = function(c){ return c.toUpperCase() !== c.toLowerCase() ? 'A' : ' '; },
        template = str.slice(0, length+1).replace(/.(?=\W*\w*$)/g, tmpl); // 'Hello, world' -> 'HellAA AAAAA'

      if (template.slice(template.length-2).match(/\w\w/))
        template = template.replace(/\s*\S+$/, '');
      else
        template = _s.rtrim(template.slice(0, template.length-1));

      return (template+pruneStr).length > str.length ? str : str.slice(0, template.length)+pruneStr;
    },

    words: function(str, delimiter) {
      if (_s.isBlank(str)) return [];
      return _s.trim(str, delimiter).split(delimiter || /\s+/);
    },

    pad: function(str, length, padStr, type) {
      str = str == null ? '' : String(str);
      length = ~~length;

      var padlen  = 0;

      if (!padStr)
        padStr = ' ';
      else if (padStr.length > 1)
        padStr = padStr.charAt(0);

      switch(type) {
        case 'right':
          padlen = length - str.length;
          return str + strRepeat(padStr, padlen);
        case 'both':
          padlen = length - str.length;
          return strRepeat(padStr, Math.ceil(padlen/2)) + str
                  + strRepeat(padStr, Math.floor(padlen/2));
        default: // 'left'
          padlen = length - str.length;
          return strRepeat(padStr, padlen) + str;
        }
    },

    lpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'both');
    },

    sprintf: sprintf,

    vsprintf: function(fmt, argv){
      argv.unshift(fmt);
      return sprintf.apply(null, argv);
    },

    toNumber: function(str, decimals) {
      if (!str) return 0;
      str = _s.trim(str);
      if (!str.match(/^-?\d+(?:\.\d+)?$/)) return NaN;
      return parseNumber(parseNumber(str).toFixed(~~decimals));
    },

    numberFormat : function(number, dec, dsep, tsep) {
      if (isNaN(number) || number == null) return '';

      number = number.toFixed(~~dec);
      tsep = typeof tsep == 'string' ? tsep : ',';

      var parts = number.split('.'), fnums = parts[0],
        decimals = parts[1] ? (dsep || '.') + parts[1] : '';

      return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
    },

    strRight: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strRightBack: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.lastIndexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strLeft: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    strLeftBack: function(str, sep){
      if (str == null) return '';
      str += ''; sep = sep != null ? ''+sep : sep;
      var pos = str.lastIndexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    toSentence: function(array, separator, lastSeparator, serial) {
      separator = separator || ', ';
      lastSeparator = lastSeparator || ' and ';
      var a = array.slice(), lastMember = a.pop();

      if (array.length > 2 && serial) lastSeparator = _s.rtrim(separator) + lastSeparator;

      return a.length ? a.join(separator) + lastSeparator + lastMember : lastMember;
    },

    toSentenceSerial: function() {
      var args = slice.call(arguments);
      args[3] = true;
      return _s.toSentence.apply(_s, args);
    },

    slugify: function(str) {
      if (str == null) return '';

      var from  = "ąàáäâãåæăćęèéëêìíïîłńòóöôõøśșțùúüûñçżź",
          to    = "aaaaaaaaaceeeeeiiiilnoooooosstuuuunczz",
          regex = new RegExp(defaultToWhiteSpace(from), 'g');

      str = String(str).toLowerCase().replace(regex, function(c){
        var index = from.indexOf(c);
        return to.charAt(index) || '-';
      });

      return _s.dasherize(str.replace(/[^\w\s-]/g, ''));
    },

    surround: function(str, wrapper) {
      return [wrapper, str, wrapper].join('');
    },

    quote: function(str, quoteChar) {
      return _s.surround(str, quoteChar || '"');
    },

    unquote: function(str, quoteChar) {
      quoteChar = quoteChar || '"';
      if (str[0] === quoteChar && str[str.length-1] === quoteChar)
        return str.slice(1,str.length-1);
      else return str;
    },

    exports: function() {
      var result = {};

      for (var prop in this) {
        if (!this.hasOwnProperty(prop) || prop.match(/^(?:include|contains|reverse)$/)) continue;
        result[prop] = this[prop];
      }

      return result;
    },

    repeat: function(str, qty, separator){
      if (str == null) return '';

      qty = ~~qty;

      // using faster implementation if separator is not needed;
      if (separator == null) return strRepeat(String(str), qty);

      // this one is about 300x slower in Google Chrome
      for (var repeat = []; qty > 0; repeat[--qty] = str) {}
      return repeat.join(separator);
    },

    naturalCmp: function(str1, str2){
      if (str1 == str2) return 0;
      if (!str1) return -1;
      if (!str2) return 1;

      var cmpRegex = /(\.\d+)|(\d+)|(\D+)/g,
        tokens1 = String(str1).toLowerCase().match(cmpRegex),
        tokens2 = String(str2).toLowerCase().match(cmpRegex),
        count = Math.min(tokens1.length, tokens2.length);

      for(var i = 0; i < count; i++) {
        var a = tokens1[i], b = tokens2[i];

        if (a !== b){
          var num1 = parseInt(a, 10);
          if (!isNaN(num1)){
            var num2 = parseInt(b, 10);
            if (!isNaN(num2) && num1 - num2)
              return num1 - num2;
          }
          return a < b ? -1 : 1;
        }
      }

      if (tokens1.length === tokens2.length)
        return tokens1.length - tokens2.length;

      return str1 < str2 ? -1 : 1;
    },

    levenshtein: function(str1, str2) {
      if (str1 == null && str2 == null) return 0;
      if (str1 == null) return String(str2).length;
      if (str2 == null) return String(str1).length;

      str1 = String(str1); str2 = String(str2);

      var current = [], prev, value;

      for (var i = 0; i <= str2.length; i++)
        for (var j = 0; j <= str1.length; j++) {
          if (i && j)
            if (str1.charAt(j - 1) === str2.charAt(i - 1))
              value = prev;
            else
              value = Math.min(current[j], current[j - 1], prev) + 1;
          else
            value = i + j;

          prev = current[j];
          current[j] = value;
        }

      return current.pop();
    },

    toBoolean: function(str, trueValues, falseValues) {
      if (typeof str === "number") str = "" + str;
      if (typeof str !== "string") return !!str;
      str = _s.trim(str);
      if (boolMatch(str, trueValues || ["true", "1"])) return true;
      if (boolMatch(str, falseValues || ["false", "0"])) return false;
    }
  };

  // Aliases

  _s.strip    = _s.trim;
  _s.lstrip   = _s.ltrim;
  _s.rstrip   = _s.rtrim;
  _s.center   = _s.lrpad;
  _s.rjust    = _s.lpad;
  _s.ljust    = _s.rpad;
  _s.contains = _s.include;
  _s.q        = _s.quote;
  _s.toBool   = _s.toBoolean;

  // Exporting

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      module.exports = _s;

    exports._s = _s;
  }

  // Register as a named module with AMD.
  if (typeof define === 'function' && define.amd)
    define('underscore.string', [], function(){ return _s; });


  // Integrate with Underscore.js if defined
  // or create our own underscore object.
  root._ = root._ || {};
  root._.string = root._.str = _s;
  console.log("INIT!");

}(this, String);

console.log("NIMBLE LOADED!");
_s = _.string;

/*
This file and the _utils.js are taken directly from the node-oauth package https://github.com/ciaranj/node-oauth
We decided to directly include these files here, since Nimble API needs PUT and DELETE request
to receive a body in the request, and the node-oauth has some pull-requests fixing this issues still open https://github.com/ciaranj/node-oauth/pull/98

We could have forked the repo and pointed the package.json to our git repo, but have decided to directly include this file in the package and
as soon as the node-oauth fixes this issues for the oauth2 file, we will remove them and add the package.json dependency.
 */

var Buffer = require("buffer").Buffer;
var OAuthUtils={};
OAuthUtils.isAnEarlyCloseHost = function( hostName ) {
  return hostName && hostName.match(".*google(apis)?.com$")
}

var querystring= require('querystring'),
    crypto= require('crypto'),
    URL= require('url');

var OAuth2= function(clientId, clientSecret, baseSite, authorizePath, accessTokenPath, customHeaders) {
  this._clientId= clientId;
  this._clientSecret= clientSecret;
  this._baseSite= baseSite;
  this._authorizeUrl= authorizePath || "/oauth/authorize";
  this._accessTokenUrl= accessTokenPath || "/oauth/access_token";
  this._accessTokenName= "access_token";
  this._authMethod= "Bearer";
  this._customHeaders = customHeaders || {};
}

// This 'hack' method is required for sites that don't use
// 'access_token' as the name of the access token (for requests).
// ( http://tools.ietf.org/html/draft-ietf-oauth-v2-16#section-7 )
// it isn't clear what the correct value should be atm, so allowing
// for specific (temporary?) override for now.
OAuth2.prototype.setAccessTokenName= function ( name ) {
  this._accessTokenName= name;
}

// Sets the authorization method for Authorization header.
// e.g. Authorization: Bearer <token>  # "Bearer" is the authorization method.
OAuth2.prototype.setAuthMethod = function ( authMethod ) {
  this._authMethod = authMethod;
};

OAuth2.prototype._getAccessTokenUrl= function() {
  return this._baseSite + this._accessTokenUrl; /* + "?" + querystring.stringify(params); */
}

// Build the authorization header. In particular, build the part after the colon.
// e.g. Authorization: Bearer <token>  # Build "Bearer <token>"
OAuth2.prototype._buildAuthHeader= function(token) {
  return this._authMethod + ' ' + token;
};

OAuth2.prototype._request= function(method, url, headers, post_body, access_token) {

  var parsedUrl= URL.parse( url, true );
  console.log("-------");
  console.log(method);
  console.log(url);
  console.log(headers);
  console.log(post_body);
  console.log(access_token);
  console.log("-------");
  if( parsedUrl.protocol == "https:" && !parsedUrl.port ) {
    parsedUrl.port= 443;
  }
  console.log(parsedUrl);
  var realHeaders= this._customHeaders;
  if( headers ) {
    for(var key in headers) {
      realHeaders[key] = headers[key];
    }
  }
  realHeaders['Host']= parsedUrl.host;

  realHeaders['Content-Length']= post_body ? Buffer.byteLength(post_body) : 0;
  if( access_token ) {
    if( ! parsedUrl.query ) parsedUrl.query= {};
    parsedUrl.query[this._accessTokenName]= access_token;
  }

  var result= "";
  var queryStr= querystring.stringify(parsedUrl.query);
  if( queryStr ) queryStr=  "?" + queryStr;
  var options = {
    url: "https://"+parsedUrl.hostname+":"+parsedUrl.port+parsedUrl.pathname+queryStr,
    /*host:parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + queryStr,*/
    method: method,
    headers: realHeaders
  };
  console.log(options);
  // Some hosts *cough* google appear to close the connection early / send no content-length header
  // allow this behaviour.
  var allowEarlyClose= OAuthUtils.isAnEarlyCloseHost(options.host);
  var callbackCalled= false;
  /*function passBackControl( response, result ) {
    if(!callbackCalled) {
      callbackCalled=true;
      if( response.statusCode != 200 && (response.statusCode != 301) && (response.statusCode != 302) && (response.statusCode != 201)) {
        callback({ statusCode: response.statusCode, data: result });
      } else {
        callback(null, result, response);
      }
    }
  }*/
  if( ( method === 'POST' || method === 'PUT' || method === 'DELETE' ) && post_body ) {
    options.body = post_body;
  }

  return Parse.Cloud.httpRequest(options).then(function(httpResponse){
    console.log(httpResponse.data);
    return Parse.Promise.as(httpResponse.data);
  }, function(httpResponse){
    return Parse.Promise.error(httpResponse);
  })
  /*var request = http_library.request(options, function (response) {
    response.on("data", function (chunk) {
      result+= chunk
    });
    response.on("close", function (err) {
      if( allowEarlyClose ) {
        passBackControl( response, result );
      }
    });
    response.addListener("end", function () {
      passBackControl( response, result );
    });
  });
  request.on('error', function(e) {
    callbackCalled= true;
    callback(e);
  });

  
  request.end();*/
}


OAuth2.prototype.getAuthorizeUrl= function( params ) {
  var params= params || {};
  params['client_id'] = this._clientId;
  params['type'] = 'web_server';
  return this._baseSite + this._authorizeUrl + "?" + querystring.stringify(params);
}

OAuth2.prototype.getOAuthAccessToken= function(code, params, callback) {
  var params= params || {};
  params['client_id'] = this._clientId;
  params['client_secret'] = this._clientSecret;
  params['type']= 'web_server';
  var codeParam = (params.grant_type === 'refresh_token') ? 'refresh_token' : 'code';
  params[codeParam]= code;

  var post_data= querystring.stringify( params );
  var post_headers= {
       'Content-Type': 'application/x-www-form-urlencoded'
   };
  return this._request("POST", this._getAccessTokenUrl(), post_headers, post_data, null);
}

// Deprecated
OAuth2.prototype.getProtectedResource= function(url, access_token, callback) {
  this._request("GET", url, {}, "", access_token, callback );
}

OAuth2.prototype.get= function(url, access_token, callback) {
  var headers= {
    'Authorization': this._buildAuthHeader(access_token)
  };
  this._request("GET", url, headers, "", access_token, callback );
}






var VERSION = '0.0.6', 
    qs = require('querystring'),
    SEARCH_FIELDS = ["email", "skype id", "twitter", "linkedin", "facebook", "phone", "last name", "street", "city", "state", "zip",  "country", "company name", "title", "name", "first name", "lead source", "lead type", "lead status", "rating",  "address", "tag",  "custom_fields", "record type", "description", "saved_search"];
    //"company last contacted", "created", "updated",

var oauth2 = OAuth2;
//require('date-utils');


function Nimble(options) {
  if(!(this instanceof Nimble)) return new Nimble(options);

  this.oauth = new oauth2(options.appId,
                          options.appSecret,
                          'https://api.nimble.com',
                          '/oauth/authorize',
                          '/oauth/token');
  
  this.apiVersion = options.apiVersion || 'v1';
  this.baseApi = 'https://api.nimble.com/api/' + this.apiVersion;
  this.accessToken = options.accessToken;
  this.refreshToken = options.refreshToken;
  this.expiresIn = options.expiresIn;
  this.redirect_uri = options.redirect_uri;
}

/**
 * Generates the authorization url for authentication process STEP B
 * http://nimble.readthedocs.org/en/latest/obtaining_key/#authorization-process-overview
 * 
 * @param  {Object} params should contain redirect_uri
 */
Nimble.prototype.getAuthorizationUrl = function(params) {
  params = params || {};

  if(!params.redirect_uri) return new Error('redirect_uri param is required');  
  this.redirect_uri = params.redirect_uri;
  params['response_type'] = 'code';

  return this.oauth.getAuthorizeUrl(params);
}

/**
 * Performs authentication token request as a POST using the code sent
 * to the redirect_uri. (STEP E)
 * http://nimble.readthedocs.org/en/latest/obtaining_key/#authorization-process-overview
 *
 * We need to have available the same redirect_uri that is provided in step B for this step.
 * This can be provided:
 * A) In the constructor
 * B) Using the same Nimble object for getAuthorizationUrl and requestToken, as the getAuthorizationUrl function
 * assigns this value
 * 
 * @param  {String}   code     Authorization Grant Code received at the redirect_uri
 * @param  {Function} callback 
 */
Nimble.prototype.requestToken = function(code, callback) {
  var params = 
    {
      'grant_type': 'authorization_code',
      'redirect_uri': this.redirect_uri
    }, 
    self = this;

  return self.oauth.getOAuthAccessToken(code, params).then(function(response){
    console.log("REQ TOKEN OK!");
    console.log(response);
    self.accessToken = response.accessToken;
    self.refreshToken = response.refreshToken;
    self.expiresIn = response['expires_in'];
    return Parse.Promise.as(response);
  }, function(httpResponse){
    return Parse.Promise.error(httpResponse);
  });
  /*, function(err, accessToken, refreshToken, results) {
    if(err) return callback(err);
    
    
    return callback(null, accessToken, refreshToken, results);
  });*/
}

/**
 * Refreshes the authorization token in case it has expired.
 * You can provide the refreshToken received from Nimble or let the wrapper
 * use the refreshToken provided to the constructor.
 * 
 * @param  {String}   refreshToken   Refresh Token provided by Nimble
 * @param  {Function} callback 
 */
Nimble.prototype.doRefreshToken = function(refreshToken, callback) {
  
  if(typeof refreshToken === 'function') {
    callback = refreshToken;
    refreshToken = null;
  }

  var params = {'grant_type': 'refresh_token'},
      self = this,
      _refreshToken = refreshToken || self.refreshToken;

  if(!_refreshToken) return new Error('Impossible refreshing access token, as no refreshToken has been provided / is stored');

  return self.oauth.getOAuthAccessToken(_refreshToken, params, function(err, accessToken, refreshToken, results) {
    if(err) return callback(err);
    
    self.accessToken = accessToken;
    self.refreshToken = refreshToken;
    self.expiresIn = results['expires_in'];
    return callback(null, accessToken, refreshToken, results);
  });
}

/**
 * Wrapper to perform a GET request handling automatically any possible 
 * error due to token expiration. The wrapper will automatically perform
 * a refreshToken request in case we receive an expired token error.
 * 
 * @param  {String}   url      Url to perform the GET request
 * @param  {Function} callback
 */
Nimble.prototype._get = function(url, callback) {
  var self = this,
      resumeRequest = function() {
        return self._get(url, callback);
      };

  return self.oauth.get(url, this.accessToken, function(err, result, response) {
    if(err) {
      if(err.statusCode === 401 && self.refreshToken) {
        self.doRefreshToken(self.refreshToken, function(err, accessToken, refreshToken, results) {
          if(err) return callback(err);
          return resumeRequest();
        });
      } else {
        return callback(err);
      }
    } else {
      return callback(null, result, response);
    }
  });
}
/**
 * Wrapper to perform a POST request handling automatically any possible 
 * error due to token expiration. The wrapper will automatically perform
 * a refreshToken request in case we receive an expired token error.
 * 
 * @param  {String}   url      Url to perform the POST request
 * @param  {Object}   params   Object containing the params to be sent as body
 * @param  {Function} callback
 */
Nimble.prototype._post = function(url, params, callback) {
  var self = this,
      resumeRequest = function() {
        return self._post(url, params, callback);
      },
      post_data = JSON.stringify(params),
      post_headers = {
       'Content-Type': 'application/json'
      };
  return self.oauth._request("POST", url, post_headers, post_data, self.accessToken, function(err, result, response) {
    if(err) {
      if(err.statusCode === 401 && self.refreshToken) {
        self.doRefreshToken(self.refreshToken, function(err, accessToken, refreshToken, results) {
          if(err) return callback(err);
          return resumeRequest();
        });
      } else {
        return callback(err);
      }
    } else {
      return callback(null, result, response);
    }
  });
}

/**
 * Wrapper to perform a PUT request handling automatically any possible 
 * error due to token expiration. The wrapper will automatically perform
 * a refreshToken request in case we receive an expired token error.
 * 
 * @param  {String}   url      Url to perform the PUT request
 * @param  {Object}   params   Object containing the params to be sent as body
 * @param  {Function} callback
 */
Nimble.prototype._put = function(url, params, callback) {
  var self = this,
      resumeRequest = function() {
        return self._put(url, params, callback);
      },
      put_data = JSON.stringify(params),
      put_headers = {
       'Content-Type': 'application/json'
      };

  return self.oauth._request("PUT", url, put_headers, put_data, self.accessToken, function(err, result, response) {
    if(err) {
      if(err.statusCode === 401 && self.refreshToken) {
        self.doRefreshToken(self.refreshToken, function(err, accessToken, refreshToken, results) {
          if(err) return callback(err);
          return resumeRequest();
        });
      } else {
        return callback(err);
      }
    } else {
      return callback(null, result, response);
    }
  });
}

/**
 * Wrapper to perform a DELETE request handling automatically any possible 
 * error due to token expiration. The wrapper will automatically perform
 * a refreshToken request in case we receive an expired token error.
 * 
 * @param  {String}   url      Url to perform the DELETE request
 * @param  {Object}   params   Object containing the params to be sent as body
 * @param  {Function} callback
 */
Nimble.prototype._delete = function(url, params, callback) {
  var self = this,
      resumeRequest = function() {
        return self._delete(url, params, callback);
      },
      delete_data = JSON.stringify(params),
      delete_headers = {
       'Content-Type': 'application/json'
      };

  return self.oauth._request("DELETE", url, delete_headers, delete_data, self.accessToken, function(err, result, response) {
    if(err) {
      if(err.statusCode === 401 && self.refreshToken) {
        self.doRefreshToken(self.refreshToken, function(err, accessToken, refreshToken, results) {
          if(err) return callback(err);
          return resumeRequest();
        });
      } else {
        return callback(err);
      }
    } else {
      return callback(null, result, response);
    }
  });

}

/********** REST API **********/


/** CONTACTS **/

/**
 * Performs contacts listing.
 * http://nimble.readthedocs.org/en/latest/contacts/basic/list.html
 * @param  {Object}   params   params for the contacts listing
 * @param  {Function} callback
 */
Nimble.prototype.findContacts = function(params, callback) {
  params = params || {};

  if(params.query) params.query = JSON.stringify(params.query);

  var url = this.baseApi + '/contacts?' + qs.stringify(params);
  return this._get(url, function(err, result, response) {
    if(err) return callback(err);
    return callback(err, JSON.parse(result), response);
  });
}
/*
  For each one of the available search fields, we define a shortcut method findByFIELD.
  These methods receive an exactly parameter that tells if the search is to be made with the
  "is" operator, or, when available, the "contain" operator.

  http://nimble.readthedocs.org/en/latest/contacts/basic/search.html#available-search-fields

  TODO: Allow search fields "company last contacted", "created" and "updated".
 */
SEARCH_FIELDS.forEach(function(field) {
  
  Nimble.prototype['findBy' + _s.classify(field)] = function(value, exactly, callback) {
    var query = {};

    query[field] = {};
    
    switch(field) {
      //These ones can't find with contain so no doubt about what operator to use
      case "lead source":
      case "lead type":
      case "lead status":
      case "rating":
      case "tag":
      case "record type":
      case "saved search":
        query[field]["is"] = value;
      break;
      //The rest can either find exact match or just containing the value
      default:
        if(exactly) {
          query[field]["is"] = value;
        } else {
          query[field]["contain"] = value;
        }
      break;

    }

    return this.findContacts({query: query}, callback);
  }

});

/**
 * Performs contacts listing using the /ids endpoint, where only
 * ids will be returned.
 *
 * http://nimble.readthedocs.org/en/latest/contacts/basic/list.html
 * @param  {Object}   params   params for the contacts listing
 * @param  {Function} callback
 */
Nimble.prototype.findContactIds = function(params, callback) {
  params = params || {};

  if(params.query) params.query = JSON.stringify(params.query);

  var url = this.baseApi + '/contacts/ids?' + qs.stringify(params);
  return this._get(url, function(err, result, response) {
    if(err) return callback(err);
    return callback(err, JSON.parse(result), response);
  });
}

/**
 * Gets contacts by their id.
 * May receive a comma separated list of ids, a single id, or an array of ids
 *
 * http://nimble.readthedocs.org/en/latest/contacts/basic/details.html
 * @param  {String}   ids      string id, comma separated list of ids, or ids array
 * @param  {Function} callback
 */
Nimble.prototype.findContactsById = function(ids, callback) {
  if(!ids) return callback(new Error('Contact ids required'));

  var _ids = (ids instanceof Array) ? ids.join(',') : ids,
      url = this.baseApi + '/contact/' + _ids;

  return this._get(url, function(err, results, response) {
    if(err) return callback(err);
    return callback(err, JSON.parse(results), response);
  });
}

/**
 * Creates contacts
 *
 * http://nimble.readthedocs.org/en/latest/contacts/basic/create.html
 * @param  {Object}   params   fields for the contact
 * @param  {Function} callback
 */
Nimble.prototype.createContact = function(params, callback) {
  var params = params || {},
      url = this.baseApi + '/contact/';
  return this._post(url, params, function(err, result, response) {
    if(err) return callback(err);
    return callback(null, JSON.parse(result), response);
  });
}

/**
 * Updates contacts
 *
 * http://nimble.readthedocs.org/en/latest/contacts/basic/update.html
 * @param  {String}   id       id of the contact to update
 * @param  {Object}   params   params to update
 * @param  {Function} callback
 */
Nimble.prototype.updateContact = function(id, params, callback) {
  if(!id) return callback(new Error('Contact id is required'));

  var params = params || {},
      url = this.baseApi + '/contact/' + id;

  return this._put(url, params, function(err, result, response) {
    if(err) return callback(err);
    return callback(null, JSON.parse(result), response);
  });
}

/**
 * Deletes contacts
 * May receive a comma separated list of ids, a single id, or an array of ids
 *
 * http://nimble.readthedocs.org/en/latest/contacts/basic/delete.html
 * @param  {String}   ids      string id, comma separated list of ids, or ids array
 * @param  {Function} callback
 */
Nimble.prototype.deleteContact = function(ids, callback) {
  if(!ids) return callback(new Error('Contact ids required'));
  
  var _ids = (ids instanceof Array) ? ids.join(',') : ids,
      url = this.baseApi + '/contact/' + _ids;

  return this._delete(url, {}, function(err, results, response) {
    if(err) return callback(err);
    return callback(err, JSON.parse(results), response);
  });
}

/** NOTES **/

/**
 * Gets notes by their id.
 *
 * http://nimble.readthedocs.org/en/latest/contacts/notes/show.html 
 * @param  {String}   id      string note id
 * @param  {Function} callback
 */
Nimble.prototype.showNote = function(id, callback) {
  if(!id) return callback(new Error('Note id is required'));

  var url = this.baseApi + '/contacts/notes/' + id;

  return this._get(url, function(err, results, response) {
    if(err) return callback(err);
    return callback(err, JSON.parse(results), response);
  });
}

/**
 * List contact notes.
 *
 * http://nimble.readthedocs.org/en/latest/contacts/notes/show.html 
 * @param  {String}   id      string note id
 * @param  {Function} callback
 */
Nimble.prototype.listContactNotes = function(id, callback) {
  if(!id) return callback(new Error('Contact id is required'));

  var url = this.baseApi + '/contacts/' + id + '/notes';

  return this._get(url, function(err, results, response) {
    if(err) return callback(err);
    return callback(err, JSON.parse(results), response);
  });
}

/**
 * Creates a note for the contacts contained in params.contacts_ids
 *
 * http://nimble.readthedocs.org/en/latest/contacts/notes/create.html
 * @param  {Object}   params containing the required params for notes creation: contacts_ids, note, and note_preview
 * @param  {Function} callback
 */
Nimble.prototype.createNote = function(params, callback) {
  var params = params || {};

  if(!params.contact_ids) return callback(new Error('Contacts ids required'));
  if(!params.note) return callback(new Error('Note required'));
  if(!params.note_preview) return callback(new Error('Note preview required'));

  var url = this.baseApi + '/contacts/notes/';
  return this._post(url, params, function(err, results, response) {
    if(err) return callback(err);
    return callback(err, JSON.parse(results), response);
  });
}

/**
 * Updates a note
 *
 * http://nimble.readthedocs.org/en/latest/contacts/notes/update.html
 * @param  {String}   id       Note id 
 * @param  {Object}   params   params containing the required params for notes update: contacts_ids, note, and note_preview
 * @param  {Function} callback [description]
 */
Nimble.prototype.updateNote = function(id, params, callback) {
  if(!id) return callback(new Error('Note id is required'));

  var params = params || {},
      url = this.baseApi + '/contacts/notes/' + id;

  return this._put(url, params, function(err, result, response) {
    if(err) return callback(err);
    return callback(null, JSON.parse(result), response);
  });
}

/**
 * Deletes a note
 *
 * http://nimble.readthedocs.org/en/latest/contacts/notes/delete.html
 * @param  {String}   id       Note id
 * @param  {Function} callback
 */
Nimble.prototype.deleteNote = function(id, callback) {
  if(!id) return callback(new Error('Note id is required'));

  var url = this.baseApi + '/contacts/notes/' + id;

  return this._delete(url, {}, function(err, result, response) {
    if(err) return callback(err);
    return callback(null, JSON.parse(result), response);
  });
}

/**
 * Creates a new task
 * As the due_date must have the format 'YYYY-MM-DD HOURS:MINUTES' we try to
 * perform a conversion in case the string provided does not match the required format.
 * 
 * https://nimble.readthedocs.org/en/latest/activities/tasks/create.html
 * @param  {[Object]}   params   params containing the required param for task creation: subject
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Nimble.prototype.createTask = function(params, callback) {
  var params = params || {};

  if(!params.subject) return callback(new Error('Subject required'));
  if(params.due_date) {
    try {
      var auxDate = new Date(params.due_date);
      params.due_date = auxDate.toFormat('YYYY-MM-DD HH24:MI');
    }catch(e) {
      return callback(e);
    }    
  }
  var url = this.baseApi + '/activities/task/';
  return this._post(url, params, function(err, results, response) {
    if(err) return callback(err);
    return callback(err, JSON.parse(results), response);
  });
}

module.exports = Nimble;


