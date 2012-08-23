/*! Melville - v0.1.0 - 2012-08-23
* http://scottboyle.co.uk/
* Copyright (c) 2012 Monospaced; Licensed MIT */

//
// Initialization
//

var version = {
  major: 2,
  minor: 0,
  revision: 0,
  date: new Date('July 30, 2007'),
  extensions: {}
};

// passage storage, story history, Macros
var tale,
    state,
    macros = {};

//
// Section: General-purpose functions
//

//
// Function: $
// Returns the DOM element with the id passed.
//
// Parameters:
// id - the id to look up
//
// Returns:
// A DOM element, or null if none with the id exist.
//

function $(id){
  'use strict';
  if (typeof id === 'string') {
    return document.getElementById(id);
  } else {
    return id;
  }
}

//
// Function: clone
// Performs a shallow copy of an object.
//
// Parameters:
// original - the object to copy
//
// Returns:
// The copied object.
//

function clone(original){
  'use strict';
  var copy = {};
  for (var property in original) {
    if (original.hasOwnProperty(property)) {
      copy[property] = original[property];
    }
  }
  return copy;
}

//
// Function: insertText
// Places text in a DOM element.
//
// Parameters:
// place - the element to add text to
// text - text to insert
//
// Returns:
// The newly created DOM text node.
//

function insertText(place, text){
  'use strict';
  return place.appendChild(document.createTextNode(text));
}

//
// Function: insertElement
// A shortcut function for creating a DOM element. All parameters are
// optional.
//
// Parameters:
// place - the parent element
// type - the type of element to create -- e.g. 'div' or 'span'
// id - the id to give the element
// className - the CSS class to give the element
// text - text to place inside the element. This is *not* interpreted
//        as HTML.
//
// Returns:
// The newly created element.
//

function insertElement(place, type, id, className, text){
  'use strict';
  var el = document.createElement(type);
  if (id) {
    el.id = id;
  }
  if (className) {
    el.className = className;
  }
  if (text) {
    insertText(el, text);
  }
  if (place) {
    place.appendChild(el);
  }
  return el;
}

//
// Function: removeChildren
// Removes all child elements from a DOM element.
//
// Parameters:
// el - the element to strip
//
// Returns:
// nothing
//

function removeChildren(el){
  'use strict';
  while (el.hasChildNodes()) {
    el.removeChild(el.firstChild);
  }
}

//
// Function: addStyle
// Adds CSS styles to the document.
//
// Parameters:
// source - the CSS styles to add
//
// Returns:
// nothing
//

function addStyle(source){
  'use strict';
  var el;
  if (document.createStyleSheet) {
    document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeEnd', '&nbsp;<style>' + source + '</style>');
  } else {
    el = document.createElement('style');
    el.type = 'text/css';
    el.appendChild(document.createTextNode(source));
    document.getElementsByTagName('head')[0].appendChild(el);
  }
}

//
// Function: Math.easeInOut
// Eases a decimal number from 0 to 1.
//
// Parameters:
// i - the number to ease. Must be between 0 and 1.
//
// Returns:
// The eased value.
//

Math.easeInOut = function(i){
  'use strict';
  return(1 - ((Math.cos(i * Math.PI) + 1) / 2));
};

//
// Function: String.readMacroParams
// Parses a list of macro parameters.
//
// Parameters:
// none
//
// Returns:
// An array of parameters.
//

String.prototype.readMacroParams = function(){
  'use strict';
  var regexpMacroParam = new RegExp("(?:\\s*)(?:(?:\"([^\"]*)\")|(?:'([^']*)')|(?:\\[\\[([^\\]]*)\\]\\])|([^\"'\\s]\\S*))","mg"),
      params = [],
      match;
  do {
    match = regexpMacroParam.exec(this);
    if (match) {
      if (match[1]) {
        // Double quoted
        params.push(match[1]);
      } else if (match[2]) {
        // Single quoted
        params.push(match[2]);
      } else if (match[3]) {
        // Double-square-bracket quoted
        params.push(match[3]);
      } else if (match[4]) {
        // Unquoted
        params.push(match[4]);
      }
    }
  } while(match);
  return params;
};

//
// Function: String.readBracketedList
// Parses a list of bracketed links -- e.g. *[[my link]]*.
//
// Parameters:
// none
//
// Returns:
// an array of link titles.
//

String.prototype.readBracketedList = function(){
  'use strict';
  var bracketedPattern = '\\[\\[([^\\]]+)\\]\\]',
      unbracketedPattern = '[^\\s$]+',
      pattern = '(?:' + bracketedPattern + ')|(' + unbracketedPattern + ')',
      re = new RegExp(pattern, 'mg'),
      tiddlerNames = [],
      match;
  do {
    match = re.exec(this);
    if (match) {
      if (match[1]) {
        // Bracketed
        tiddlerNames.push(match[1]);
      } else if(match[2]) {
        // Unbracketed
        tiddlerNames.push(match[2]);
      }
    }
  } while(match);
  return(tiddlerNames);
};

//
// Function: String.trim
// Removes whitespace from the beginning and end of a string.
//
// Parameters:
// none
//
// Returns:
// The trimmed string.
//

String.prototype.trim = function(){
  'use strict';
  return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

//
// Class: Wikifier
//
// Used to display text on the page. This is taken more or less verbatim
// from the TiddlyWiki core code, though not all formatters are available
// (notably the WikiWord link).
//


//
// Constructor: Wikifier
// Wikifies source text into a DOM element. Any pre-existing contents are
// appended to. This should be used in place of TiddlyWiki's wikify()
// function.
//
// Parameters:
// place - the DOM element to render into
// source - the source text to render
//
// Returns:
// nothing
//

function Wikifier(place, source){
  'use strict';
  this.source = source;
  this.output = place;
  this.nextMatch = 0;
  this.assembleFormatterMatches(Wikifier.formatters);
  this.subWikify(this.output);
}

//
// Function: throwError
// Displays an error message on the page.
//
// Parameters:
// place - the place to show the error message
// message - the message to display
//
// Returns:
// nothing
//

function throwError(place, message){
  'use strict';
  new Wikifier(place, "'' @@ " + message + " @@ ''");
}

Wikifier.prototype.assembleFormatterMatches = function(formatters){
  'use strict';
  var pattern = [];
  this.formatters = [];
  for(var n = 0; n < formatters.length; n++) {
    pattern.push('('+formatters[n].match+')');
    this.formatters.push(formatters[n]);
  }
  this.formatterRegExp = new RegExp(pattern.join('|'),'mg');
};

Wikifier.prototype.subWikify = function(output, terminator){
  'use strict';
  var oldOutput,
      terminatorRegExp,
      formatterMatch,
      terminatorMatch,
      matchingFormatter;
  // Temporarily replace the output pointer
  oldOutput = this.output;
  this.output = output;
  // Prepare the terminator RegExp
  terminatorRegExp = terminator ? new RegExp('(' + terminator + ')', 'mg') : null;
  do {
    // Prepare the RegExp match positions
    this.formatterRegExp.lastIndex = this.nextMatch;
    if (terminatorRegExp) {
      terminatorRegExp.lastIndex = this.nextMatch;
    }
    // Get the first matches
    formatterMatch = this.formatterRegExp.exec(this.source);
    terminatorMatch = terminatorRegExp ? terminatorRegExp.exec(this.source) : null;
    // Check for a terminator match
    if (terminatorMatch && (!formatterMatch || terminatorMatch.index <= formatterMatch.index)) {
      // Output any text before the match
      if(terminatorMatch.index > this.nextMatch) {
        this.outputText(this.output,this.nextMatch,terminatorMatch.index);
      }
      // Set the match parameters
      this.matchStart = terminatorMatch.index;
      this.matchLength = terminatorMatch[1].length;
      this.matchText = terminatorMatch[1];
      this.nextMatch = terminatorMatch.index + terminatorMatch[1].length;
      // Restore the output pointer and exit
      this.output = oldOutput;
      return;
      // Check for a formatter match
    } else if (formatterMatch) {
      // Output any text before the match
      if (formatterMatch.index > this.nextMatch) {
        this.outputText(this.output,this.nextMatch,formatterMatch.index);
      }
      // Set the match parameters
      this.matchStart = formatterMatch.index;
      this.matchLength = formatterMatch[0].length;
      this.matchText = formatterMatch[0];
      this.nextMatch = this.formatterRegExp.lastIndex;
      // Figure out which formatter matched
      matchingFormatter = -1;
      for (var t = 1; t < formatterMatch.length; t++) {
        if (formatterMatch[t]) {
          matchingFormatter = t-1;
        }
      }
      // Call the formatter
      if (matchingFormatter !== -1) {
        this.formatters[matchingFormatter].handler(this);
      }
    }
  } while (terminatorMatch || formatterMatch);
  // Output any text after the last match
  if (this.nextMatch < this.source.length) {
    this.outputText(this.output,this.nextMatch,this.source.length);
    this.nextMatch = this.source.length;
  }
  // Restore the output pointer
  this.output = oldOutput;
};

Wikifier.prototype.outputText = function(place, startPos, endPos){
  'use strict';
  insertText(place, this.source.substring(startPos, endPos));
};

//
// Method: fullArgs
// Meant to be called by macros, this returns the text
// passed to the currently executing macro. Unlike TiddlyWiki's
// default mechanism, this does not attempt to split up the arguments
// into an array, thought it does do some magic with certain Twee operators
// (like gt, eq, and $variable).
//
// Parameters:
// none
//
// Returns:
// a parsed string of arguments
//

Wikifier.prototype.fullArgs = function(){
  'use strict';
  var startPos = this.source.indexOf(' ', this.matchStart),
      endPos = this.source.indexOf('>>', this.matchStart);
  return Wikifier.parse(this.source.slice(startPos, endPos));
};

Wikifier.parse = function(expression){
  'use strict';
  var result = expression.replace(/\$/g, 'state.history[0].variables.');
  result = result.replace(/\beq\b/gi, ' == ');
  result = result.replace(/\bneq\b/gi, ' != ');
  result = result.replace(/\bgt\b/gi, ' > ');
  result = result.replace(/\beq\b/gi, ' == ');
  result = result.replace(/\bneq\b/gi, ' != ');
  result = result.replace(/\bgt\b/gi, ' > ');
  result = result.replace(/\bgte\b/gi, ' >= ');
  result = result.replace(/\blt\b/gi, ' < ');
  result = result.replace(/\blte\b/gi, ' <= ');
  result = result.replace(/\band\b/gi, ' && ');
  result = result.replace(/\bor\b/gi, ' || ');
  result = result.replace(/\bnot\b/gi, ' ! ');
  return result;
};

Wikifier.formatHelpers = {
  charFormatHelper: function(w){
    'use strict';
    var e = insertElement(w.output, this.element);
    w.subWikify(e, this.terminator);
  },
  inlineCssHelper: function(w){
    'use strict';
    var styles = [],
        lookahead = '(?:('+Wikifier.textPrimitives.anyLetter+'+)\\(([^\\)\\|\\n]+)(?:\\):))|(?:('+Wikifier.textPrimitives.anyLetter+'+):([^;\\|\\n]+);)',
        lookaheadRegExp = new RegExp(lookahead, 'mg'),
        hadStyle = false,
        lookaheadMatch,
        gotMatch;
    do {
      lookaheadRegExp.lastIndex = w.nextMatch;
      lookaheadMatch = lookaheadRegExp.exec(w.source);
      gotMatch = lookaheadMatch && lookaheadMatch.index === w.nextMatch;
      if (gotMatch) {
        var s,
            v;
        hadStyle = true;
        if (lookaheadMatch[1]) {
          s = lookaheadMatch[1].unDash();
          v = lookaheadMatch[2];
        } else {
          s = lookaheadMatch[3].unDash();
          v = lookaheadMatch[4];
        }
        if (s === 'bgcolor') {
          s = "backgroundColor";
        }
        styles.push({
          style: s,
          value: v
        });
        w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
      }
    } while(gotMatch);
    return styles;
  },
  monospacedByLineHelper: function(w){
    'use strict';
    var lookaheadRegExp = new RegExp(this.lookahead, 'mg'),
        lookaheadMatch,
        text;
    lookaheadRegExp.lastIndex = w.matchStart;
    lookaheadMatch = lookaheadRegExp.exec(w.source);
    if (lookaheadMatch && lookaheadMatch.index === w.matchStart) {
      text = lookaheadMatch[1];
      // IE specific hack
      if (navigator.userAgent.indexOf('msie') !== -1 && navigator.userAgent.indexOf('opera') === -1) {
        text = text.replace(/\n/g, '\r');
      }
      insertElement(w.output, 'pre', null, null, text);
      w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
    }
  }
};

Wikifier.formatters = [{
  name: 'table',
  match: '^\\|(?:[^\\n]*)\\|(?:[fhc]?)$',
  lookahead: '^\\|([^\\n]*)\\|([fhc]?)$',
  rowTerminator: '\\|(?:[fhc]?)$\\n?',
  cellPattern: '(?:\\|([^\\n\\|]*)\\|)|(\\|[fhc]?$\\n?)',
  cellTerminator: '(?:\\x20*)\\|',
  rowTypes: {
    'c': 'caption',
    'h': 'thead',
    '': 'tbody',
    'f': 'tfoot'
  },
  handler: function(w){
    'use strict';
    var table = insertElement(w.output, 'table'),
        lookaheadRegExp = new RegExp(this.lookahead, 'mg'),
        currRowType = null,
        nextRowType,
        rowContainer,
        rowElement,
        prevColumns = [],
        rowCount = 0,
        lookaheadMatch,
        matched;
    w.nextMatch = w.matchStart;
    do {
      lookaheadRegExp.lastIndex = w.nextMatch;
      lookaheadMatch = lookaheadRegExp.exec(w.source);
      matched = lookaheadMatch && lookaheadMatch.index === w.nextMatch;
      if (matched) {
        nextRowType = lookaheadMatch[2];
        if (nextRowType !== currRowType) {
          rowContainer = insertElement(table, this.rowTypes[nextRowType]);
        }
        currRowType = nextRowType;
        if(currRowType === 'c') {
          if (rowCount === 0) {
            rowContainer.setAttribute('align', 'top');
          } else {
            rowContainer.setAttribute('align', 'bottom');
          }
          w.nextMatch = w.nextMatch + 1;
          w.subWikify(rowContainer, this.rowTerminator);
        } else {
          rowElement = insertElement(rowContainer, 'tr');
          this.rowHandler(w, rowElement, prevColumns);
        }
        rowCount++;
      }
    } while(matched);
  },
  rowHandler: function(w, e, prevColumns){
    'use strict';
    var col = 0,
        currColCount = 1,
        cellRegExp = new RegExp(this.cellPattern, 'mg'),
        cellMatch,
        matched,
        last,
        spaceLeft,
        spaceRight,
        styles,
        cell,
        lastColCount,
        lastColElement;
    do {
      cellRegExp.lastIndex = w.nextMatch;
      cellMatch = cellRegExp.exec(w.source);
      matched = cellMatch && cellMatch.index === w.nextMatch;
      if (matched) {
        if (cellMatch[1] === '~') {
          last = prevColumns[col];
          if (last) {
            last.rowCount++;
            last.element.setAttribute('rowSpan', last.rowCount);
            last.element.setAttribute('rowspan', last.rowCount);
            last.element.valign = 'center';
          }
          w.nextMatch = cellMatch.index + cellMatch[0].length-1;
        } else if (cellMatch[1] === '>') {
          currColCount++;
          w.nextMatch = cellMatch.index + cellMatch[0].length-1;
        } else if (cellMatch[2]) {
          w.nextMatch = cellMatch.index + cellMatch[0].length;
          break;
        } else {
          spaceLeft = false;
          spaceRight = false;
          w.nextMatch++;
          styles = Wikifier.formatHelpers.inlineCssHelper(w);
          while (w.source.substr(w.nextMatch, 1) === ' ') {
            spaceLeft = true;
            w.nextMatch++;
          }
          if (w.source.substr(w.nextMatch, 1) === '!') {
            cell = insertElement(e, 'th');
            w.nextMatch++;
          } else {
            cell = insertElement(e, 'td');
          }
          prevColumns[col] = {
            rowCount: 1,
            element: cell
          };
          lastColCount = 1;
          lastColElement = cell;
          if (currColCount > 1) {
            cell.setAttribute('colSpan', currColCount);
            cell.setAttribute('colspan', currColCount);
            currColCount = 1;
          }
          for (var t = 0; t<styles.length; t++) {
            cell.style[styles[t].style] = styles[t].value;
          }
          w.subWikify(cell, this.cellTerminator);
          if(w.matchText.substr(w.matchText.length-2,1) === ' ') {
            spaceRight = true;
          }
          if (spaceLeft && spaceRight) {
            cell.align = 'center';
          } else if (spaceLeft) {
            cell.align = 'right';
          } else if (spaceRight) {
            cell.align = 'left';
          }
          w.nextMatch = w.nextMatch-1;
        }
        col++;
      }
    } while(matched);
  }
}, {
  name: 'rule',
  match: '^----$\\n?',
  handler: function(w){
    'use strict';
    insertElement(w.output, 'hr');
  }
}, {
  name: 'emdash',
  match: '--',
  handler: function(w){
    'use strict';
    var e = insertElement(w.output, 'span');
    e.innerHTML = '&mdash;';
  }
}, {
  name: 'heading',
  match: '^!{1,5}',
  terminator: '\\n',
  handler: function(w){
    'use strict';
    var e = insertElement(w.output, 'h' + w.matchLength);
    w.subWikify(e, this.terminator);
  }
}, {
  name: 'monospacedByLine',
  match: '^\\{\\{\\{\\n',
  lookahead: '^\\{\\{\\{\\n((?:^[^\\n]*\\n)+?)(^\\}\\}\\}$\\n?)',
  handler: Wikifier.formatHelpers.monospacedByLineHelper
}, {
  name: 'monospacedByLineForPlugin',
  match: '^//\\{\\{\\{\\n',
  lookahead: '^//\\{\\{\\{\\n\\n*((?:^[^\\n]*\\n)+?)(\\n*^//\\}\\}\\}$\\n?)',
  handler: Wikifier.formatHelpers.monospacedByLineHelper
}, {
  name: 'wikifyCommentForPlugin',
  match: '^/\\*\\*\\*\\n',
  terminator: '^\\*\\*\\*/\\n',
  handler: function(w){
    'use strict';
    w.subWikify(w.output, this.terminator);
  }
}, {
  name: 'quoteByBlock',
  match: '^<<<\\n',
  terminator: '^<<<\\n',
  handler: function(w){
    'use strict';
    var e = insertElement(w.output, 'blockquote');
    w.subWikify(e,this.terminator);
  }
}, {
  name: 'quoteByLine',
  match: '^>+',
  terminator: '\\n',
  element: 'blockquote',
  handler: function(w){
    'use strict';
    var lookaheadRegExp = new RegExp(this.match, 'mg'),
        placeStack = [w.output],
        currLevel = 0,
        newLevel = w.matchLength,
        t,
        lookaheadMatch,
        matched;
    do {
      if (newLevel > currLevel) {
        for (t = currLevel; t < newLevel; t++) {
          placeStack.push(insertElement(placeStack[placeStack.length-1], this.element));
        }
      } else if (newLevel < currLevel) {
        for(t = currLevel; t > newLevel; t--) {
          placeStack.pop();
        }
      }
      currLevel = newLevel;
      w.subWikify(placeStack[placeStack.length-1], this.terminator);
      insertElement(placeStack[placeStack.length-1], 'br');
      lookaheadRegExp.lastIndex = w.nextMatch;
      lookaheadMatch = lookaheadRegExp.exec(w.source);
      matched = lookaheadMatch && lookaheadMatch.index === w.nextMatch;
      if (matched) {
        newLevel = lookaheadMatch[0].length;
        w.nextMatch += lookaheadMatch[0].length;
      }
    } while(matched);
  }
}, {
  name: 'list',
  match: '^(?:(?:\\*+)|(?:#+))',
  lookahead: '^(?:(\\*+)|(#+))',
  terminator: '\\n',
  outerElement: 'ul',
  itemElement: 'li',
  handler: function(w){
    'use strict';
    var lookaheadRegExp = new RegExp(this.lookahead, 'mg'),
        currType = null,
        currLevel = 0,
        newType,
        newLevel,
        t,
        placeStack,
        lookaheadMatch,
        matched,
        e;
    w.nextMatch = w.matchStart;
    placeStack = [w.output];
    do {
      lookaheadRegExp.lastIndex = w.nextMatch;
      lookaheadMatch = lookaheadRegExp.exec(w.source);
      matched = lookaheadMatch && lookaheadMatch.index === w.nextMatch;
      if (matched) {
        if (lookaheadMatch[1]) {
          newType = 'ul';
        }
        if (lookaheadMatch[2]) {
          newType = 'ol';
        }
        newLevel = lookaheadMatch[0].length;
        w.nextMatch += lookaheadMatch[0].length;
        if (newLevel > currLevel) {
          for(t = currLevel; t < newLevel; t++) {
            placeStack.push(insertElement(placeStack[placeStack.length-1], newType));
          }
        } else if (newLevel < currLevel) {
          for(t = currLevel; t > newLevel; t--) {
            placeStack.pop();
          }
        } else if (newLevel === currLevel && newType !== currType) {
          placeStack.pop();
          placeStack.push(insertElement(placeStack[placeStack.length-1], newType));
        }
        currLevel = newLevel;
        currType = newType;
        e = insertElement(placeStack[placeStack.length-1], 'li');
        w.subWikify(e, this.terminator);
      }
    } while(matched);
  }
}, {
  name: 'prettyLink',
  match: '\\[\\[',
  lookahead: '\\[\\[([^\\|\\]]*?)(?:(\\]\\])|(\\|(.*?)\\]\\]))',
  terminator: '\\|',
  handler: function(w){
    'use strict';
    var lookaheadRegExp = new RegExp(this.lookahead, 'mg'),
        lookaheadMatch,
        link,
        e;
    lookaheadRegExp.lastIndex = w.matchStart;
    lookaheadMatch = lookaheadRegExp.exec(w.source);
    if (lookaheadMatch && lookaheadMatch.index === w.matchStart && lookaheadMatch[2]) {
      // Simple bracketted link
      link = Wikifier.createInternalLink(w.output, lookaheadMatch[1]);
      w.outputText(link,w.nextMatch,w.nextMatch + lookaheadMatch[1].length);
      w.nextMatch += lookaheadMatch[1].length + 2;
    } else if(lookaheadMatch && lookaheadMatch.index === w.matchStart && lookaheadMatch[3]) {
      // Pretty bracketted link
      if (tale.has(lookaheadMatch[4])) {
        e = Wikifier.createInternalLink(w.output, lookaheadMatch[4]);
      } else {
        e = Wikifier.createExternalLink(w.output, lookaheadMatch[4]);
      }
      w.outputText(e, w.nextMatch,w.nextMatch + lookaheadMatch[1].length);
      w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
    }
  }
}, {
  name: 'urlLink',
  match: '(?:http|https|mailto|ftp):[^\\s\'"]+(?:/|\\b)',
  handler: function(w){
    'use strict';
    var e = Wikifier.createExternalLink(w.output, w.matchText);
    w.outputText(e,w.matchStart, w.nextMatch);
  }
}, {
  name: 'image',
  match: '\\[(?:[<]{0,1})(?:[>]{0,1})[Ii][Mm][Gg]\\[',
  lookahead: '\\[([<]{0,1})([>]{0,1})[Ii][Mm][Gg]\\[(?:([^\\|\\]]+)\\|)?([^\\[\\]\\|]+)\\](?:\\[([^\\]]*)\\]?)?(\\])',
  handler: function(w){
    'use strict';
    var lookaheadRegExp = new RegExp(this.lookahead, 'mg'),
        lookaheadMatch,
        e,
        img;
    lookaheadRegExp.lastIndex = w.matchStart;
    lookaheadMatch = lookaheadRegExp.exec(w.source);
    if (lookaheadMatch && lookaheadMatch.index === w.matchStart) {
      // Simple bracketted link
      e = w.output;
      if (lookaheadMatch[5]) {
        if (tale.has(lookaheadMatch[5])) {
          e = Wikifier.createInternalLink(w.output, lookaheadMatch[5]);
        } else {
          e = Wikifier.createExternalLink(w.output, lookaheadMatch[5]);
        }
      }
      img = insertElement(e, 'img');
      if (lookaheadMatch[1]) {
        img.align = 'left';
      } else if (lookaheadMatch[2]) {
        img.align = 'right';
      }
      if (lookaheadMatch[3]) {
        img.title = lookaheadMatch[3];
      }
      img.src = lookaheadMatch[4];
      w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
    }
  }
}, {
  name: 'macro',
  match: '<<',
  lookahead: '<<([^>\\s]+)(?:\\s*)([^>]*)>>',
  handler: function(w){
    'use strict';
    var lookaheadRegExp = new RegExp(this.lookahead, 'mg'),
        lookaheadMatch,
        params,
        macro;
    lookaheadRegExp.lastIndex = w.matchStart;
    lookaheadMatch = lookaheadRegExp.exec(w.source);
    if (lookaheadMatch && lookaheadMatch.index === w.matchStart && lookaheadMatch[1]) {
      params = lookaheadMatch[2].readMacroParams();
      w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
      try {
        macro = macros[lookaheadMatch[1]];
        if (macro && macro.handler) {
          macro.handler(w.output, lookaheadMatch[1], params, w);
        } else {
          insertElement(w.output, 'span', null ,'marked', 'macro not found: ' + lookaheadMatch[1]);
        }
      } catch(e) {
        throwError(w.output, 'Error executing macro ' + lookaheadMatch[1] + ': ' + e.toString());
      }
    }
  }
}, {
  name: 'html',
  match: '<[Hh][Tt][Mm][Ll]>',
  lookahead: '<[Hh][Tt][Mm][Ll]>((?:.|\\n)*?)</[Hh][Tt][Mm][Ll]>',
  handler: function(w){
    'use strict';
    var lookaheadRegExp = new RegExp(this.lookahead, 'mg'),
        lookaheadMatch,
        e;
    lookaheadRegExp.lastIndex = w.matchStart;
    lookaheadMatch = lookaheadRegExp.exec(w.source);
    if (lookaheadMatch && lookaheadMatch.index === w.matchStart) {
      e = insertElement(w.output, 'span');
      e.innerHTML = lookaheadMatch[1];
      w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
    }
  }
}, {
  name: 'commentByBlock',
  match: '/%',
  lookahead: '/%((?:.|\\n)*?)%/',
  handler: function(w){
    'use strict';
    var lookaheadRegExp = new RegExp(this.lookahead, 'mg'),
        lookaheadMatch;
    lookaheadRegExp.lastIndex = w.matchStart;
    lookaheadMatch = lookaheadRegExp.exec(w.source);
    if (lookaheadMatch && lookaheadMatch.index === w.matchStart) {
      w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
    }
  }
}, {
  name: 'boldByChar',
  match: "''",
  terminator: "''",
  element: 'strong',
  handler: Wikifier.formatHelpers.charFormatHelper
}, {
  name: 'strikeByChar',
  match: '==',
  terminator: '==',
  element: 'strike',
  handler: Wikifier.formatHelpers.charFormatHelper
}, {
  name: 'underlineByChar',
  match: '__',
  terminator: '__',
  element: 'u',
  handler: Wikifier.formatHelpers.charFormatHelper
}, {
  name: 'italicByChar',
  match: '//',
  terminator: '//',
  element: 'em',
  handler: Wikifier.formatHelpers.charFormatHelper
}, {
  name: 'subscriptByChar',
  match: '~~',
  terminator: '~~',
  element: 'sub',
  handler: Wikifier.formatHelpers.charFormatHelper
}, {
  name: 'superscriptByChar',
  match: '\\^\\^',
  terminator: '\\^\\^',
  element: 'sup',
  handler: Wikifier.formatHelpers.charFormatHelper
}, {
  name: 'monospacedByChar',
  match: '\\{\\{\\{',
  lookahead: '\\{\\{\\{((?:.|\\n)*?)\\}\\}\\}',
  handler: function(w){
    'use strict';
    var lookaheadRegExp = new RegExp(this.lookahead, 'mg'),
        lookaheadMatch,
        e;
    lookaheadRegExp.lastIndex = w.matchStart;
    lookaheadMatch = lookaheadRegExp.exec(w.source);
    if (lookaheadMatch && lookaheadMatch.index === w.matchStart) {
      e = insertElement(w.output, 'code', null, null, lookaheadMatch[1]);
      w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
    }
  }
}, {
  name: 'styleByChar',
  match: '@@',
  terminator: '@@',
  lookahead: '(?:([^\\(@]+)\\(([^\\)]+)(?:\\):))|(?:([^:@]+):([^;]+);)',
  handler:  function(w){
    'use strict';
    var e = insertElement(w.output, 'span', null, null, null),
        styles = Wikifier.formatHelpers.inlineCssHelper(w);
    if (styles.length === 0) {
      e.className = 'marked';
    } else {
      for(var t = 0; t < styles.length; t++) {
        e.style[styles[t].style] = styles[t].value;
      }
    }
    w.subWikify(e, this.terminator);
  }
}, {
  name: 'lineBreak',
  match: '\\n',
  handler: function(w){
    'use strict';
    insertElement(w.output, 'br');
  }
}];

Wikifier.textPrimitives = {
  anyDigit: '[0-9]',
  anyNumberChar: '[0-9\\.E]',
  urlPattern: '(?:http|https|mailto|ftp):[^\\s\'"]+(?:/|\\b)'
};

//
// Method: createInternalLink
// Creates a link to a passage. It automatically classes it so that
// broken links appear broken.
//
// Parameters:
// place - the DOM element to render into
// title - the title of the passage to link to
//
// Returns:
// the newly created link as a DOM element
//

Wikifier.createInternalLink = function(place, title){
  'use strict';
  var el = insertElement(place, 'a', title);
  el.href = '#_';
  if (tale.has(title)) {
    el.className = 'internalLink';
  } else {
    el.className = 'brokenLink';
  }
  el.onclick = function(){
    state.display(title, el);
    return false;
  };
  if (place) {
    place.appendChild(el);
  }
  return el;
};

//
// Method: createExternalLink
// Creates a link to an external URL.
//
// Parameters:
// place - the DOM element to render into
// url - the URL to link to
//
// Returns:
// the newly created link as a DOM element
//

Wikifier.createExternalLink = function(place, url){
  'use strict';
  var el = insertElement(place, 'a');
  el.href = url;
  el.className = 'externalLink';
  el.target = '_blank';
  if (place) {
    place.appendChild(el);
  }
  return el;
};

// certain versions of Safari do not handle Unicode properly

if(!((new RegExp('[\u0150\u0170]','g')).test('\u0150'))){
  Wikifier.textPrimitives.upperLetter = '[A-Z\u00c0-\u00de]';
  Wikifier.textPrimitives.lowerLetter = '[a-z\u00df-\u00ff_0-9\\-]';
  Wikifier.textPrimitives.anyLetter = '[A-Za-z\u00c0-\u00de\u00df-\u00ff_0-9\\-]';
} else {
  Wikifier.textPrimitives.upperLetter = '[A-Z\u00c0-\u00de\u0150\u0170]';
  Wikifier.textPrimitives.lowerLetter = '[a-z\u00df-\u00ff_0-9\\-\u0151\u0171]';
  Wikifier.textPrimitives.anyLetter = '[A-Za-z\u00c0-\u00de\u00df-\u00ff_0-9\\-\u0150\u0170\u0151\u0171]';
}

//
// Section: Effects
//

//
// Function: fade
// Fades a DOM element in or out.
//
// Parameters:
// el - the element to fade
// options - an object of options to use. This object must have a *fade*
//           property, which should be either the string 'in' or 'out',
//           corresponding to the direction of the fade. The second
//           property used here, *onComplete*, is a function that is called
//           once the fade is complete. This is optional.
//
// Returns:
// nothing
//

function fade(el, options){
  'use strict';
  var current,
      proxy = el.cloneNode(true),
      direction = (options.fade === 'in') ? 1 : -1,
      interval;
  el.parentNode.replaceChild(proxy, el);
  if (options.fade === 'in') {
    current = 0;
    proxy.style.visibility = 'visible';
  } else {
    current = 1;
  }
  function tick(){
    current += 0.05 * direction;
    setOpacity(proxy, Math.easeInOut(current));
    if ((direction === 1 && current >= 1) || (direction === -1 && current <= 0)) {
      console.log('swapping fader proxy out');
      el.style.visibility = (options.fade === 'in') ? 'visible' : 'hidden';
      proxy.parentNode.replaceChild(el, proxy);
      //delete proxy;
      window.clearInterval(interval);
      if (options.onComplete) {
        options.onComplete();
      }
    }
  }
  function setOpacity (el, opacity){
    var percent = Math.floor(opacity * 100);
    // IE
    el.style.zoom = 1;
    el.style.filter = 'alpha(opacity=' + percent + ')';
    // CSS 3
    el.style.opacity = opacity;
  }
  setOpacity(proxy, current);
  interval = window.setInterval(tick, 25);
}

//
// Function: scrollWindowTo
// This scrolls the browser window to ensure that a DOM element is
// in view. Make sure that the element has been added to the page
// before calling this function.
//
// Parameters:
// el - the element to scroll to.
//
// Returns:
// nothing
//

function scrollWindowTo(el){
  'use strict';
  var start = window.scrollY ? window.scrollY : document.body.scrollTop,
      progress = 0,
      end,
      distance,
      direction,
      interval;
  function tick(){
    progress += 0.1;
    window.scrollTo(0, start + direction * (distance * Math.easeInOut(progress)));
    if (progress >= 1) {
      window.clearInterval(interval);
    }
  }
  function ensureVisible(el){
    var posTop = findPosY(el),
        posBottom = posTop + el.offsetHeight,
        winTop = window.scrollY ? window.scrollY : document.body.scrollTop,
        winHeight = window.innerHeight ? window.innerHeight : document.body.clientHeight,
        winBottom = winTop + winHeight;
    if (posTop < winTop) {
      return posTop;
    } else if (posBottom > winBottom) {
      if (el.offsetHeight < winHeight) {
        return (posTop - (winHeight - el.offsetHeight) + 20);
      } else {
        return posTop;
      }
    } else {
      return posTop;
    }
  }
  function findPosY(el){
    var curtop = 0;
    while (el.offsetParent) {
      curtop += el.offsetTop;
      el = el.offsetParent;
    }
    return curtop;
  }
  end = ensureVisible(el);
  distance = Math.abs(start - end);
  direction = (start > end) ? -1 : 1;
  interval = window.setInterval(tick, 25);
}

//
// Class: History
//
// A class used to manage the state of the story -- displaying new passages
// and rewinding to the past.
//
// Property: History
// An array representing the state of the story. history[0] is the current
// state, history[1] is the state just before the present, and so on.
// Each entry in the history is an object with two properties: *passage*,
// which corresponds to the <Passage> just displayed, and *variables*.
// Variables is in itself an object. Each property is a variable set
// by the story via the <<set>> macro.
//

//
// Constructor: History
// Initializes a History object.
//
// Parameters:
// none
//

function History(){
  'use strict';
  this.history = [{
    passage: null,
    variables: {}
  }];
}

//
// Method: init
// This first attempts to restore the state of the story via the <restore>
// method. If that fails, it then either displays the passages linked in the
// *StartPassages* passage, or gives up and tries to display a passage
// named *Start*.
//
// Parameters:
// none
//
// Returns:
// nothing
//

History.prototype.init = function(){
  'use strict';
  var initials;
  if (!this.restore()) {
    if (tale.has('StartPassages')) {
      console.log('showing StartPassages', tale.get('StartPassages').text.readBracketedList());
      initials = tale.get('StartPassages').text.readBracketedList();
      for (var i = 0; i < initials.length; i++) {
        this.display(initials[i], null, 'quietly');
      }
    } else {
      console.log('no StartPassages, showing Start');
      this.display('Start', null, 'quietly');
    }
  }
};

//
// Method: close
// This removes a passage from display onscreen. This does not animate
// its disappearance.
//
// Parameters:
// passage - the <Passage> to remove
//
// Returns:
// nothing
//

History.prototype.close = function(passage){
  'use strict';
  // we hide the passage immediately, without animation
  var el = $('passage' + passage.title);
  console.log('closing "' + passage.title + '"');
  if (el) {
    el.parentNode.removeChild(el);
  }
};

//
// Method: display
// Displays a passage on the page. If a passage has previously been
// displayed, the browser window is scrolled so it is in view.
//
// Parameters:
// title - the title of the passage to display.
// link - the DOM element corresponding to the link that was clicked to
// view the passage. The new passage is displayed immediately below the passage
// enclosed by the link. This parameter is optional. If it is omitted,
// the passage is displayed at the bottom of the page.
// render - may be either "quietly" or "offscreen". If a "quietly" value
// is passed, the passage's appearance is not animated. "offscreen"
// asks that the passage be rendered, but not displayed at all. This
// parameter is optional. If it is omitted, then the passage's appearance
// is animated.
//
// Returns:
// The DOM element containing the passage on the page.
//

History.prototype.display = function(title, link, render){
  'use strict';
  console.log('displaying "' + title + '" ' + (render || '') + ' from ', link);
  // find enclosing passage of the link
  var sourcePassage = link,
      el = $('passage' + title),
      passage,
      div,
      img,
      show;
  while (sourcePassage && (sourcePassage.className.indexOf('passage') === -1)) {
    if (sourcePassage.parentNode.className) {
      sourcePassage = sourcePassage.parentNode;
    } else {
      break;
    }
  }
  // check if passage is already displayed
  if (el) {
    scrollWindowTo(el);
    return;
  }
  // create a fresh entry in the history
  passage = tale.get(title);
  this.history.unshift({
    passage: passage,
    variables: clone(this.history[0].variables)
  });
  // add it to the page
  div = passage.render();
  // ensure images have loaded before scrollWindow
  show = function(){
    if (render !== 'offscreen') {
      if (sourcePassage) {
        $('passages').insertBefore(div, sourcePassage.nextSibling);
      } else {
        $('passages').appendChild(div);
      }
      // animate its appearance
      if (render !== 'quietly') {
        scrollWindowTo(div);
        fade(div, {
          fade: 'in'
        });
      }
    }
    if ((render === 'quietly') || (render === 'offscreen')) {
      div.style.visibility = 'visible';
    }
  };
  img = div.getElementsByTagName('img')[0];
  if (img) {
    img.onload = function(){
      show();
    };
  } else {
    show();
  }
  return div;
};

//
// Method: restart
// Restarts the story from the beginning. This actually forces the
// browser to refresh the page.
//
// Parameters:
// none
//
// Returns:
// none
//

History.prototype.restart = function(){
  'use strict';
  // clear any bookmark
  // this has the side effect of forcing a page reload
  window.location.hash = '';
};

//
// Method: save
// Returns a hash to append to the page's URL that will be later
// read by the <restore> method. How this is generated is not
// guaranteed to remain constant in future releases -- but it
// is guaranteed to be understood by <restore>.
//
// Parameters:
// passage - a <Passage> whose point in the history to save.
//           This parameter is optional -- if omitted, then the
//           entire story's history is saved.
//
// Returns:
// A hash to append to the page's URL.
//

History.prototype.save = function(passage){
  'use strict';
  var order = '';
  // encode our history
  for (var i = 0; i < this.history.length; i++) {
    if (this.history[i].passage && this.history[i].passage.id) {
      order += this.history[i].passage.id.toString(36) + '.';
      if (this.history[i].passage.id === passage.id) {
        break;
      }
    }
  }
  // strip the trailing period
  return '#' + order.substr(0, order.length - 1);
};

//
// Method: restore
// Attempts to restore the state of the story as saved by <save>.
//
// Parameters:
// none
//
// Returns:
// Whether this method actually restored anything.
//

History.prototype.restore = function (){
  'use strict';
  var order,
      passages,
      id;
  try {
    if (window.location.hash === '') {
      return false;
    }
    order = window.location.hash.replace('#', '').split('.');
    passages = [];
    // render the passages offscreen in the order the reader clicked them
    // we can't show them, because contents along the way may be
    // incorrect (e.g. <<choice>>)
    for (var i = order.length - 1; i >= 0; i--) {
      id = parseInt(order[i], 36);
      if (!tale.has(id)) {
        return false;
      }
      console.log('restoring id ' + id);
      passages.unshift(this.display(id, null, 'offscreen'));
    }
    // our state is now correct
    // we now display the last passage
    $('passages').appendChild(passages[0]);
    return true;
  }
  catch(e){
    console.log('restore failed', e);
    return false;
  }
};

//
// Method: rewindTo
// Rewinds the state of the story to a particular <Passage>.
//
// Parameters:
// passage - a <Passage> to rewind to.
//
// Returns:
// nothing
//

History.prototype.rewindTo = function(passage){
  'use strict';
  // fade out the story while we work
  console.log('rewinding to "' + passage.title + '"');
  var self = this;
  function work(){
    var els;
    // delete passages after the one we are rewinding to
    while (self.history[0].passage.title !== passage.title) {
      self.close(self.history.shift().passage);
    }
    // i is now the index of the passage we are rewinding to
    // we restore it to its original state
    self.history[0].variables = clone(self.history[1].variables);
    passage.reset();
    els = $('passage' + passage.title).childNodes;
    for (var i = 0; i < els.length; i++) {
      if (els[i].className === 'body') {
        removeChildren(els[i]);
        new Wikifier(els[i], passage.text);
      }
    }
    fade($('passages'), {
      fade: 'in'
    });
  }
  fade($('passages'), {
    fade: 'out',
    onComplete: work
  });
};

//
// Jonah macros
//
// These provide various facilities to stories.
//

// <<choice>>

version.extensions.choiceMacro = {
  major: 1,
  minor: 2,
  revision: 0
};

macros.choice = {
  handler: function(place, macroName, params){
    'use strict';
    var link = document.createElement('a');
    link.href = '#_';
    link.className = 'internalLink choice';
    if (params[1]) {
      link.innerHTML = params[1];
    } else {
      link.innerHTML = params[0];
    }
    link.onclick = function(){
      macros.choice.activate(link, params[0]);
      return false;
    };
    place.appendChild(link);
  },
  activate: function(el, destination){
    'use strict';
    // find the enclosing passage
    var parentDiv = el.parentNode,
        trashed = [],
        title,
        links,
        span;
    while (parentDiv.className.indexOf('body') === -1) {
      parentDiv = parentDiv.parentNode;
    }
    title = parentDiv.parentNode.id.substr(7);
    links = parentDiv.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
      if (links[i] !== el && links[i].className.indexOf('choice') !== -1) {
        span = document.createElement('span');
        span.innerHTML = links[i].innerHTML;
        span.className = 'disabled';
        links[i].parentNode.insertBefore(span, links[i].nextSibling);
        trashed.push(links[i]);
      }
    }
    for (var n = 0; n < trashed.length; n++) {
      trashed[n].parentNode.removeChild(trashed[n]);
    }
    tale.get(title).text = '<html>'+parentDiv.childNodes[0].innerHTML+'</html>';
    state.display(destination, el);
  }
};

version.extensions.displayMacro = {
  major: 1,
  minor: 0,
  revision: 0
};

// <<display>>

macros.display = {
  handler: function(place, name, params){
    'use strict';
    console.log('<<display>>ing "'+params[0]+'"');
    new Wikifier(place, tale.get(params[0]).text);
    console.log('<<display>> of "'+params[0]+'" complete');
  }
};

// <<actions>>

version.extensions.actionsMacro = {
  major: 1,
  minor: 2,
  revision: 0
};

macros.actions = {
  handler: function(place, macroName, params){
    'use strict';
    var list = insertElement(place, 'ul'),
        item,
        link,
        action;
    if (!state.history[0].variables['actions clicked']) {
      state.history[0].variables['actions clicked'] = {};
    }
    action = function(){
      this.onclick = function(){
        state.history[0].variables['actions clicked'][this.id] = true;
        state.display(this.id, this);
      };
    };
    for (var i = 0; i < params.length; i++) {
      if (state.history[0].variables['actions clicked'][params[i]]) {
        continue;
      }
      item = insertElement(list, 'li');
      link = Wikifier.createInternalLink(item, params[i]);
      insertText(link, params[i]);
      // rewrite the function in the link
      action.call(link);
    }
  }
};

// <<print>>

version.extensions.printMacro = {
  major: 1,
  minor: 1,
  revision: 0
};

macros.print = {
  handler: function(place, macroName, params, parser){
    'use strict';
    var output;
    try {
      output = eval(parser.fullArgs());
      if (output) {
        new Wikifier(place, output.toString());
      }
    } catch(e) {
      throwError(place, 'bad expression: ' + e.message);
    }
  }
};

// <<set>>

version.extensions.setMacro = {
  major: 1,
  minor: 1,
  revision: 0
};

macros.set = {
  handler: function(place, macroName, params, parser){
    'use strict';
    macros.set.run(parser.fullArgs());
  },
  run: function(expression){
    'use strict';
    // you may call this directly from a script passage
    try {
      return eval(Wikifier.parse(expression));
    } catch(e) {
      //throwError(place, 'bad expression: ' + e.message);
      console.log('bad expression: ' + e.message);
    }
  }
};

// <<if>>, <<else>>, and <<endif>>

version.extensions.ifMacros = {
  major: 1,
  minor: 0,
  revision: 0
};

macros['if'] = {
  handler: function(place, macroName, params, parser){
    'use strict';
    var condition = parser.fullArgs(),
        srcOffset = parser.source.indexOf('>>', parser.matchStart) + 2,
        src = parser.source.slice(srcOffset),
        endPos = -1,
        trueClause = '',
        falseClause = '';
    for (var i = 0, nesting = 1, currentClause = true; i < src.length; i++) {
      if (src.substr(i, 9) === '<<endif>>') {
        nesting--;
        if (nesting === 0) {
          endPos = srcOffset + i + 9; // length of <<endif>>
          break;
        }
      }
      if (src.substr(i, 8) === '<<else>>' && nesting === 1) {
        currentClause = 'false';
        i += 8;
      }
      if (src.substr(i, 5) === '<<if ') {
        nesting++;
      }
      if (currentClause === true) {
        trueClause += src.charAt(i);
      } else {
        falseClause += src.charAt(i);
      }
    }
    // display the correct clause
    try {
      if (eval(condition)) {
        new Wikifier(place, trueClause.trim());
      } else {
        new Wikifier(place, falseClause.trim());
      }
      // push the parser past the entire expression
      if (endPos !== -1) {
        parser.nextMatch = endPos;
      } else {
        throwError(place, 'can\'t find matching endif');
      }
    } catch(e) {
      throwError(place, 'bad condition: ' + e.message);
    }
  }
};

macros['else'] = macros.endif = {
  handler: function(){
    'use strict';
  }
};

// <<remember>>

version.extensions.rememberMacro = {
  major: 1,
  minor: 1,
  revision: 0
};

macros.remember = {
  handler: function(place, macroName, params, parser){
    'use strict';
    var statement = parser.fullArgs(),
        expire = new Date(),
        variable,
        value,
        variableSigil;
    // evaluate the statement if any
    macros.set.run(statement);
    // find the variable to save
    variableSigil = Wikifier.parse('$');
    variableSigil = variableSigil.replace('[', '\\[');
    variableSigil = variableSigil.replace(']', '\\]');
    variable = statement.match(new RegExp(variableSigil + '(\\w+)', 'i'))[1];
    value = eval(Wikifier.parse('$' + variable));
    // simple JSON-like encoding
    switch (typeof value) {
    case 'string':
      value = '"' + value.replace(/"/g, '\\"') + '"';
      break;
    case 'number':
      break;
    case 'boolean':
      break;
    default:
      throwError(place, 'can\'t remember $'+variable+' ('+(typeof value)+')');
      return;
    }
    // save the variable as a cookie
    expire.setYear(expire.getFullYear() + 1);
    document.cookie = macros.remember.prefix+variable+'='+value+'; expires='+expire.toGMTString();
  },
  
  init: function() {
    'use strict';
    // figure out our cookie prefix
    var cookies,
        bits,
        statement;
    if (tale.has('StoryTitle')) {
      macros.remember.prefix = tale.get('StoryTitle').text + '_';
    } else {
      macros.remember.prefix = '__melville_';
    }
    // restore all cookie'd values to local variables
    cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      bits = cookies[i].split('=');
      if (bits[0].trim().indexOf(this.prefix) === 0) {
        // replace our cookie prefix with $ and evaluate the statement
        statement = cookies[i].replace(this.prefix, '$');
        eval(Wikifier.parse(statement));
      }
    }
  }
};

// <<silently>>

version.extensions.SilentlyMacro = {
  major: 1,
  minor: 0,
  revision: 0
};

macros.silently = {
  handler: function(place, macroName, params, parser){
    'use strict';
    var buffer = insertElement(null, 'div'),
        srcOffset = parser.source.indexOf('>>', parser.matchStart) + 2,
        src = parser.source.slice(srcOffset),
        endPos = -1,
        silentText = '';
    for (var i = 0; i < src.length; i++) {
      if (src.substr(i, 15) === '<<endsilently>>') {
        endPos = srcOffset + i + 15;
      } else {
        silentText += src.charAt(i);
      }
    }
    if (endPos !== -1) {
      new Wikifier(buffer, silentText);
      parser.nextMatch = endPos;
    } else {
      throwError(place, 'can\'t find matching endsilently');
    }
    //delete buffer;
  }
};

macros.endsilently = {
  handler: function() {
    'use strict';
  }
};

//
// Class: Passage
//
// This class represents an individual passage.
// This is analogous to the Tiddler class in the core TiddlyWiki code.
//
// Property: title
// The title of the passage, displayed at its top.
//
// Property: id
// An internal id of the passage. This is never seen by the reader,
// but it is used by the <History> class.
//
// Property: initialText
// The initial text of the passage. This is used by the reset method.
//
// Property: text
// The current text of the passage. This is usually the same as
// the <initialText> property, though macros such as <<choice>>
// may alter it.
//
// Property: tags
// An array of strings, each corresponding to a tag the passage belongs to.
//

//
// Constructor: Passage
//
// Initializes a new Passage object. You may either call this with
// a DOM element, which creates the passage from the text stored in the
// element, or you may pass only a title,
//
// Parameters:
// title - the title of the passage to create. This parameter is required.
// el - the DOM element storing the content of the passage.
// This parameter is optional. If it is omitted, "this passage does not
// exist" is used as the passage's content.
// order - the order in which this passage was retrieved from the
// document's *storeArea* div. This is used to generate the passage's id.
// This parameter is optional, but should be included if el is specified.
//

function Passage(title, el, order){
  'use strict';
  this.title = title;
  if (el){
    this.id = order;
    this.initialText = this.text = Passage.unescapeLineBreaks(el.firstChild ? el.firstChild.nodeValue : "");
    this.tags = el.getAttribute('tags');
    if (typeof this.tags === 'string') {
      this.tags = this.tags.readBracketedList();
    } else {
      this.tags = [];
    }
  } else {
    this.initialText = this.text = '@@This passage does not exist.@@';
    this.tags = [];
  }
}

//
// Method: render
//
// Renders the passage to a DOM element, including its title, toolbar,
// and content. It's up to the caller to add this to the DOM tree appropriately
// and animate its appearance.
//
// Parameters:
// none
//
// Returns:
// nothing
//

Passage.prototype.render = function(){
  'use strict';
  // construct passage
  var passage = insertElement(null, 'div', 'passage' + this.title, 'passage'),
      title,
      toolbar,
      link,
      body;
  passage.style.visibility = 'hidden';
  title = insertElement(passage, 'div', '', 'title', this.title);
  toolbar = insertElement(title, 'span', '', 'toolbar');
  for (var i = 0; i < Passage.toolbarItems.length; i++) {
    link = insertElement(toolbar, 'a');
    insertText(link, Passage.toolbarItems[i].label(passage));
    link.passage = this;
    if (Passage.toolbarItems[i].href) {
      link.href = Passage.toolbarItems[i].href(passage);
    } else {
      link.href = '#_';
    }
    link.title = Passage.toolbarItems[i].tooltip(passage);
    link.onclick = Passage.toolbarItems[i].activate;
  }
  body = insertElement(passage, 'div', '', 'body');
  new Wikifier(body, this.text);
  // event handlers
  passage.onmouseover = function(){
    passage.className += ' selected';
  };
  passage.onmouseout = function(){
    passage.className = passage.className.replace(' selected', '');
  };
  return passage;
};

//
// Method: reset
//
// Resets the passage's <text> property to its <initialText> property.
// This does not directly affect anything displayed on the page.
//
// Parameters:
// none
//
// Returns:
// nothing
//

Passage.prototype.reset = function(){
  'use strict';
  console.log('resetting "' + this.title + '"');
  this.text = this.initialText;
};

Passage.toolbarItems = [
  {
    label: function(){
      'use strict';
      return 'bookmark';
    },
    tooltip: function(){
      'use strict';
      return 'Bookmark this point in the story';
    },
    href: function(passage){
      'use strict';
      return(state.save(passage));
    },
    activate: function(){
      'use strict';
    }
  }, {
    label: function(){
      'use strict';
      return 'rewind to here';
    },
    tooltip: function(){
      'use strict';
      return 'Rewind the story to here';
    },
    activate: function(){
      'use strict';
      state.rewindTo(this.passage);
    }
  }
];

//
// Method: unescapeLineBreaks
//
// A static function used by the constructor to convert string literals
// used by TiddlyWiki to indicate newlines into actual newlines.
//
// Parameters:
// text - a string to unescape
//
// Returns:
// a converted string
//

Passage.unescapeLineBreaks = function(text){
  'use strict';
  if (text && text !== '') {
    return text.replace(/\\n/mg,'\n').replace(/\\/mg,'\\').replace(/\r/mg,'');
  } else {
    return '';
  }
};

//
// Class: Tale
//
// Used to provide access to passages. This is analogous to the
// TiddlyWiki class in the core TiddlyWiki code.
//
// Property: passages
// An associative array of <Passage> objects in the story.
// The key for this array is the title of the passage.
//

//
// Constructor: Tale
//
// Initializes a new Tale object with the contents of the
// DOM element with the id *storeArea*, constructing new <Passage>s
// as it traverses the tree.
//
// Parameters:
// none
//

function Tale(){
  'use strict';
  var store,
      title,
      el;
  this.passages = {};
  if (document.normalize) {
    document.normalize();
  }
  store = $('storeArea').childNodes;
  for (var i = 0; i < store.length; i++) {
    el = store[i];
    if (el.getAttribute) {
      title = el.getAttribute('tiddler');
    }
    if (title) {
      this.passages[title] = new Passage(title, el, i);
    }
  }
}

//
// Method: has
//
// Checks whether the tale has a passage with either the title
// passed (if the key parameter is a string) or an id (if
// a number is passed instead).
//
// Parameters:
// key - the title or id of the passage to search for
//
// Returns:
// boolean
//

Tale.prototype.has = function(key){
  'use strict';
  // returns whether a passage exists
  if (typeof key === 'string') {
    return (this.passages[key] !== null && typeof this.passages[key] !== 'undefined');
  } else {
    for (var i in this.passages) {
      if (this.passages[i].id === key) {
        return true;
      }
    }
    return false;
  }
};

//
// Method: get
//
// A getter function that returns a certain <Passage> object belonging
// to the tale. You may either retrieve a passage by its title or id.
//
// Parameters:
// key - the title or id of the passage to retrieve
//
// Returns:
// A <Passage> object. If no passage exists matching the passed key,
// a null value is returned.
//
// See also:
// <Tale.lookup>
//

Tale.prototype.get = function(key){
  'use strict';
  // returns a passage either by title or its id
  if (typeof key === 'string') {
    return this.passages[key] || new Passage(key);
  } else {
    for (var i in this.passages) {
      if (this.passages[i].id === key) {
        return this.passages[i];
      }
    }
  }
};

//
// Method: lookup
//
// Searches the Tale for all passages matching a certain criteria.
// You may optionally specify a secondary field to sort the results on.
//
// Parameters:
// field - the name of the <Passage> property to search on
// value - the value to match
// sortField - the name of the <Passage> property to sort matches on.
// This always sorts in descending order. If you need ascending order,
// use the Array class's reverse() method.
//
// Returns:
// An array of <Passage>s. If no passages met the search criteria,
// an empty array is returned.
//
// See also:
// <Tale.get>
//

Tale.prototype.lookup = function(field, value, sortField){
  'use strict';
  var results = [];
  for (var t in this.passages) {
    if (this.passages.hasOwnProperty(t)) {
      var passage = this.passages[t];
      for (var i = 0; i < passage[field].length; i++) {
        if (passage[field][i] === value) {
          results.push(passage);
        }
      }
    }
  }
  if (!sortField) {
    sortField = 'title';
  }
  results.sort(function(a,b){
    if (a[sortField] === b[sortField]) {
      return(0);
    } else {
      return (a[sortField] < b[sortField]) ? -1 : +1;
    }
  });
  return results;
};

//
// Method: reset
//
// Calls the <Passage.reset> method on all <Passage>s in the tale, restoring
// the story to its initial state.
//
// Parameters:
// none
//
// Returns:
// nothing
//

Tale.prototype.reset = function(){
  'use strict';
  console.log('resetting all passages');
  for (var i in this.passages) {
    if (this.passages.hasOwnProperty(i)) {
      this.passages[i].reset();
    }
  }
};

//
// Function: setPageElement
// Wikifies a passage into a DOM element.
//
// Parameters:
// id - the id of the element
// title - the title of the passage
// defaultText - text to use if the passage doesn't exist
//
// Returns:
// a DOM element, or null if none with the id exist.
//
// See also:
// <Wikifier>
//

function setPageElement(id, title, defaultText){
  'use strict';
  var place = $(id);
  if (place) {
    removeChildren(place);
    if (tale.has(title)) {
      new Wikifier(place, tale.get(title).text);
    } else {
      new Wikifier(place, defaultText);
    }
  }
}

//
// Function: main
//
// Loads the story from the storage div, initializes macros and
// custom stylesheets, and displays the first passages of the story.
//
// Returns:
// nothing
//

window.onload = function(){
  'use strict';
  var styles,
      scripts;
  tale = new Tale();
  // process title, subtitle, author passages
  setPageElement('storyMenu', 'StoryMenu', '');
  setPageElement('storyTitle', 'StoryTitle', 'Untitled Story');
  setPageElement('storySubtitle', 'StorySubtitle', '');
  setPageElement('storyAuthor', 'StoryAuthor', '');
  if (tale.has('StoryTitle')) {
    document.title = tale.get('StoryTitle').text;
    if (tale.has('StorySubtitle')) {
      document.title += ': ' + tale.get('StorySubtitle').text;
    }
  }
  // initialize macros
  for (var macro in macros) {
    if (typeof macro.init === 'function') {
      macro.init();
    }
  }
  // process passages tagged 'stylesheet'
  styles = tale.lookup('tags', 'stylesheet');
  for (var i = 0; i < styles.length; i++) {
    addStyle(styles[i].text);
  }
  // process passages tagged 'script'
  scripts = tale.lookup('tags', 'script');
  for (var n = 0; n < scripts.length; n++) {
    try {
      eval(scripts[n].text);
    } catch(e) {
      window.alert('There is a technical problem with this story ('+scripts[n].title +': '+e.message+'). You may be able '+'to continue reading, but all parts of the story may not '+'work properly.');
    }
  }
  // initialize history and display initial passages
  state = new History();
  state.init();
  
  // initalize restart story link
  $('restartStory').onclick = function(){
    state.restart();
    return false;
  };
  
  console.log('init complete', tale, state);
};
