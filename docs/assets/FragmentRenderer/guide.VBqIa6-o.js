var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var RECYCLED_NODE = 1;
var LAZY_NODE = 2;
var TEXT_NODE = 3;
var EMPTY_OBJ = {};
var EMPTY_ARR = [];
var map = EMPTY_ARR.map;
var isArray = Array.isArray;
var defer = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : setTimeout;
var createClass = function(obj) {
  var out = "";
  if (typeof obj === "string") return obj;
  if (isArray(obj) && obj.length > 0) {
    for (var k = 0, tmp; k < obj.length; k++) {
      if ((tmp = createClass(obj[k])) !== "") {
        out += (out && " ") + tmp;
      }
    }
  } else {
    for (var k in obj) {
      if (obj[k]) {
        out += (out && " ") + k;
      }
    }
  }
  return out;
};
var merge = function(a, b) {
  var out = {};
  for (var k in a) out[k] = a[k];
  for (var k in b) out[k] = b[k];
  return out;
};
var batch = function(list) {
  return list.reduce(function(out, item) {
    return out.concat(
      !item || item === true ? 0 : typeof item[0] === "function" ? [item] : batch(item)
    );
  }, EMPTY_ARR);
};
var isSameAction = function(a, b) {
  return isArray(a) && isArray(b) && a[0] === b[0] && typeof a[0] === "function";
};
var shouldRestart = function(a, b) {
  if (a !== b) {
    for (var k in merge(a, b)) {
      if (a[k] !== b[k] && !isSameAction(a[k], b[k])) return true;
      b[k] = a[k];
    }
  }
};
var patchSubs = function(oldSubs, newSubs, dispatch) {
  for (var i = 0, oldSub, newSub, subs = []; i < oldSubs.length || i < newSubs.length; i++) {
    oldSub = oldSubs[i];
    newSub = newSubs[i];
    subs.push(
      newSub ? !oldSub || newSub[0] !== oldSub[0] || shouldRestart(newSub[1], oldSub[1]) ? [
        newSub[0],
        newSub[1],
        newSub[0](dispatch, newSub[1]),
        oldSub && oldSub[2]()
      ] : oldSub : oldSub && oldSub[2]()
    );
  }
  return subs;
};
var patchProperty = function(node, key, oldValue, newValue, listener, isSvg) {
  if (key === "key") ;
  else if (key === "style") {
    for (var k in merge(oldValue, newValue)) {
      oldValue = newValue == null || newValue[k] == null ? "" : newValue[k];
      if (k[0] === "-") {
        node[key].setProperty(k, oldValue);
      } else {
        node[key][k] = oldValue;
      }
    }
  } else if (key[0] === "o" && key[1] === "n") {
    if (!((node.actions || (node.actions = {}))[key = key.slice(2).toLowerCase()] = newValue)) {
      node.removeEventListener(key, listener);
    } else if (!oldValue) {
      node.addEventListener(key, listener);
    }
  } else if (!isSvg && key !== "list" && key in node) {
    node[key] = newValue == null || newValue == "undefined" ? "" : newValue;
  } else if (newValue == null || newValue === false || key === "class" && !(newValue = createClass(newValue))) {
    node.removeAttribute(key);
  } else {
    node.setAttribute(key, newValue);
  }
};
var createNode = function(vdom, listener, isSvg) {
  var ns = "http://www.w3.org/2000/svg";
  var props = vdom.props;
  var node = vdom.type === TEXT_NODE ? document.createTextNode(vdom.name) : (isSvg = isSvg || vdom.name === "svg") ? document.createElementNS(ns, vdom.name, { is: props.is }) : document.createElement(vdom.name, { is: props.is });
  for (var k in props) {
    patchProperty(node, k, null, props[k], listener, isSvg);
  }
  for (var i = 0, len = vdom.children.length; i < len; i++) {
    node.appendChild(
      createNode(
        vdom.children[i] = getVNode(vdom.children[i]),
        listener,
        isSvg
      )
    );
  }
  return vdom.node = node;
};
var getKey = function(vdom) {
  return vdom == null ? null : vdom.key;
};
var patch = function(parent, node, oldVNode, newVNode, listener, isSvg) {
  if (oldVNode === newVNode) ;
  else if (oldVNode != null && oldVNode.type === TEXT_NODE && newVNode.type === TEXT_NODE) {
    if (oldVNode.name !== newVNode.name) node.nodeValue = newVNode.name;
  } else if (oldVNode == null || oldVNode.name !== newVNode.name) {
    node = parent.insertBefore(
      createNode(newVNode = getVNode(newVNode), listener, isSvg),
      node
    );
    if (oldVNode != null) {
      parent.removeChild(oldVNode.node);
    }
  } else {
    var tmpVKid;
    var oldVKid;
    var oldKey;
    var newKey;
    var oldVProps = oldVNode.props;
    var newVProps = newVNode.props;
    var oldVKids = oldVNode.children;
    var newVKids = newVNode.children;
    var oldHead = 0;
    var newHead = 0;
    var oldTail = oldVKids.length - 1;
    var newTail = newVKids.length - 1;
    isSvg = isSvg || newVNode.name === "svg";
    for (var i in merge(oldVProps, newVProps)) {
      if ((i === "value" || i === "selected" || i === "checked" ? node[i] : oldVProps[i]) !== newVProps[i]) {
        patchProperty(node, i, oldVProps[i], newVProps[i], listener, isSvg);
      }
    }
    while (newHead <= newTail && oldHead <= oldTail) {
      if ((oldKey = getKey(oldVKids[oldHead])) == null || oldKey !== getKey(newVKids[newHead])) {
        break;
      }
      patch(
        node,
        oldVKids[oldHead].node,
        oldVKids[oldHead],
        newVKids[newHead] = getVNode(
          newVKids[newHead++],
          oldVKids[oldHead++]
        ),
        listener,
        isSvg
      );
    }
    while (newHead <= newTail && oldHead <= oldTail) {
      if ((oldKey = getKey(oldVKids[oldTail])) == null || oldKey !== getKey(newVKids[newTail])) {
        break;
      }
      patch(
        node,
        oldVKids[oldTail].node,
        oldVKids[oldTail],
        newVKids[newTail] = getVNode(
          newVKids[newTail--],
          oldVKids[oldTail--]
        ),
        listener,
        isSvg
      );
    }
    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        node.insertBefore(
          createNode(
            newVKids[newHead] = getVNode(newVKids[newHead++]),
            listener,
            isSvg
          ),
          (oldVKid = oldVKids[oldHead]) && oldVKid.node
        );
      }
    } else if (newHead > newTail) {
      while (oldHead <= oldTail) {
        node.removeChild(oldVKids[oldHead++].node);
      }
    } else {
      for (var i = oldHead, keyed = {}, newKeyed = {}; i <= oldTail; i++) {
        if ((oldKey = oldVKids[i].key) != null) {
          keyed[oldKey] = oldVKids[i];
        }
      }
      while (newHead <= newTail) {
        oldKey = getKey(oldVKid = oldVKids[oldHead]);
        newKey = getKey(
          newVKids[newHead] = getVNode(newVKids[newHead], oldVKid)
        );
        if (newKeyed[oldKey] || newKey != null && newKey === getKey(oldVKids[oldHead + 1])) {
          if (oldKey == null) {
            node.removeChild(oldVKid.node);
          }
          oldHead++;
          continue;
        }
        if (newKey == null || oldVNode.type === RECYCLED_NODE) {
          if (oldKey == null) {
            patch(
              node,
              oldVKid && oldVKid.node,
              oldVKid,
              newVKids[newHead],
              listener,
              isSvg
            );
            newHead++;
          }
          oldHead++;
        } else {
          if (oldKey === newKey) {
            patch(
              node,
              oldVKid.node,
              oldVKid,
              newVKids[newHead],
              listener,
              isSvg
            );
            newKeyed[newKey] = true;
            oldHead++;
          } else {
            if ((tmpVKid = keyed[newKey]) != null) {
              patch(
                node,
                node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node),
                tmpVKid,
                newVKids[newHead],
                listener,
                isSvg
              );
              newKeyed[newKey] = true;
            } else {
              patch(
                node,
                oldVKid && oldVKid.node,
                null,
                newVKids[newHead],
                listener,
                isSvg
              );
            }
          }
          newHead++;
        }
      }
      while (oldHead <= oldTail) {
        if (getKey(oldVKid = oldVKids[oldHead++]) == null) {
          node.removeChild(oldVKid.node);
        }
      }
      for (var i in keyed) {
        if (newKeyed[i] == null) {
          node.removeChild(keyed[i].node);
        }
      }
    }
  }
  return newVNode.node = node;
};
var propsChanged = function(a, b) {
  for (var k in a) if (a[k] !== b[k]) return true;
  for (var k in b) if (a[k] !== b[k]) return true;
};
var getTextVNode = function(node) {
  return typeof node === "object" ? node : createTextVNode(node);
};
var getVNode = function(newVNode, oldVNode) {
  return newVNode.type === LAZY_NODE ? ((!oldVNode || !oldVNode.lazy || propsChanged(oldVNode.lazy, newVNode.lazy)) && ((oldVNode = getTextVNode(newVNode.lazy.view(newVNode.lazy))).lazy = newVNode.lazy), oldVNode) : newVNode;
};
var createVNode = function(name, props, children, node, key, type) {
  return {
    name,
    props,
    children,
    node,
    type,
    key
  };
};
var createTextVNode = function(value, node) {
  return createVNode(value, EMPTY_OBJ, EMPTY_ARR, node, void 0, TEXT_NODE);
};
var recycleNode = function(node) {
  return node.nodeType === TEXT_NODE ? createTextVNode(node.nodeValue, node) : createVNode(
    node.nodeName.toLowerCase(),
    EMPTY_OBJ,
    map.call(node.childNodes, recycleNode),
    node,
    void 0,
    RECYCLED_NODE
  );
};
var h = function(name, props) {
  for (var vdom, rest = [], children = [], i = arguments.length; i-- > 2; ) {
    rest.push(arguments[i]);
  }
  while (rest.length > 0) {
    if (isArray(vdom = rest.pop())) {
      for (var i = vdom.length; i-- > 0; ) {
        rest.push(vdom[i]);
      }
    } else if (vdom === false || vdom === true || vdom == null) ;
    else {
      children.push(getTextVNode(vdom));
    }
  }
  props = props || EMPTY_OBJ;
  return typeof name === "function" ? name(props, children) : createVNode(name, props, children, void 0, props.key);
};
var app = function(props) {
  var state = {};
  var lock = false;
  var view = props.view;
  var node = props.node;
  var vdom = node && recycleNode(node);
  var subscriptions = props.subscriptions;
  var subs = [];
  var onEnd = props.onEnd;
  var listener = function(event) {
    dispatch(this.actions[event.type], event);
  };
  var setState = function(newState) {
    if (state !== newState) {
      state = newState;
      if (subscriptions) {
        subs = patchSubs(subs, batch([subscriptions(state)]), dispatch);
      }
      if (view && !lock) defer(render, lock = true);
    }
    return state;
  };
  var dispatch = (props.middleware || function(obj) {
    return obj;
  })(function(action, props2) {
    return typeof action === "function" ? dispatch(action(state, props2)) : isArray(action) ? typeof action[0] === "function" || isArray(action[0]) ? dispatch(
      action[0],
      typeof action[1] === "function" ? action[1](props2) : action[1]
    ) : (batch(action.slice(1)).map(function(fx) {
      fx && fx[0](dispatch, fx[1]);
    }, setState(action[0])), state) : setState(action);
  });
  var render = function() {
    lock = false;
    node = patch(
      node.parentNode,
      node,
      vdom,
      vdom = getTextVNode(view(state)),
      listener
    );
    onEnd();
  };
  dispatch(props.init);
};
var timeFx = function(fx) {
  return function(action, props) {
    return [
      fx,
      {
        action,
        delay: props.delay
      }
    ];
  };
};
var interval = timeFx(
  function(dispatch, props) {
    var id = setInterval(
      function() {
        dispatch(
          props.action,
          Date.now()
        );
      },
      props.delay
    );
    return function() {
      clearInterval(id);
    };
  }
);
const httpEffect = (dispatch, props) => {
  if (!props) {
    return;
  }
  const output = {
    ok: false,
    url: props.url,
    authenticationFail: false,
    parseType: props.parseType ?? "json"
  };
  http(
    dispatch,
    props,
    output
  );
};
const http = (dispatch, props, output, nextDelegate = null) => {
  fetch(
    props.url,
    props.options
  ).then(function(response) {
    if (response) {
      output.ok = response.ok === true;
      output.status = response.status;
      output.type = response.type;
      output.redirected = response.redirected;
      if (response.headers) {
        output.callID = response.headers.get("CallID");
        output.contentType = response.headers.get("content-type");
        if (output.contentType && output.contentType.indexOf("application/json") !== -1) {
          output.parseType = "json";
        }
      }
      if (response.status === 401) {
        output.authenticationFail = true;
        dispatch(
          props.onAuthenticationFailAction,
          output
        );
        return;
      }
    } else {
      output.responseNull = true;
    }
    return response;
  }).then(function(response) {
    try {
      return response.text();
    } catch (error) {
      output.error += `Error thrown with response.text()
`;
    }
  }).then(function(result) {
    output.textData = result;
    if (result && output.parseType === "json") {
      try {
        output.jsonData = JSON.parse(result);
      } catch (err) {
        output.error += `Error thrown parsing response.text() as json
`;
      }
    }
    if (!output.ok) {
      throw result;
    }
    dispatch(
      props.action,
      output
    );
  }).then(function() {
    if (nextDelegate) {
      return nextDelegate.delegate(
        nextDelegate.dispatch,
        nextDelegate.block,
        nextDelegate.nextHttpCall,
        nextDelegate.index
      );
    }
  }).catch(function(error) {
    output.error += error;
    dispatch(
      props.error,
      output
    );
  });
};
const gHttp = (props) => {
  return [
    httpEffect,
    props
  ];
};
const Keys = {
  startUrl: "startUrl"
};
class HttpEffect {
  constructor(name, url, parseType, actionDelegate) {
    __publicField(this, "name");
    __publicField(this, "url");
    __publicField(this, "parseType");
    __publicField(this, "actionDelegate");
    this.name = name;
    this.url = url;
    this.parseType = parseType;
    this.actionDelegate = actionDelegate;
  }
}
const gUtilities = {
  roundUpToNearestTen: (value) => {
    const floor = Math.floor(value / 10);
    return (floor + 1) * 10;
  },
  roundDownToNearestTen: (value) => {
    const floor = Math.floor(value / 10);
    return floor * 10;
  },
  convertMmToFeetInches: (mm) => {
    const inches = mm * 0.03937;
    return gUtilities.convertInchesToFeetInches(inches);
  },
  indexOfAny: (input, chars, startIndex = 0) => {
    for (let i = startIndex; i < input.length; i++) {
      if (chars.includes(input[i]) === true) {
        return i;
      }
    }
    return -1;
  },
  getDirectory: (filePath) => {
    var matches = filePath.match(/(.*)[\/\\]/);
    if (matches && matches.length > 0) {
      return matches[1];
    }
    return "";
  },
  countCharacter: (input, character) => {
    let length = input.length;
    let count2 = 0;
    for (let i = 0; i < length; i++) {
      if (input[i] === character) {
        count2++;
      }
    }
    return count2;
  },
  convertInchesToFeetInches: (inches) => {
    const feet = Math.floor(inches / 12);
    const inchesReamining = inches % 12;
    const inchesReaminingRounded = Math.round(inchesReamining * 10) / 10;
    let result = "";
    if (feet > 0) {
      result = `${feet}' `;
    }
    if (inchesReaminingRounded > 0) {
      result = `${result}${inchesReaminingRounded}"`;
    }
    return result;
  },
  isNullOrWhiteSpace: (input) => {
    if (input === null || input === void 0) {
      return true;
    }
    input = `${input}`;
    return input.match(/^\s*$/) !== null;
  },
  checkArraysEqual: (a, b) => {
    if (a === b) {
      return true;
    }
    if (a === null || b === null) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    const x = [...a];
    const y = [...b];
    x.sort();
    y.sort();
    for (let i = 0; i < x.length; i++) {
      if (x[i] !== y[i]) {
        return false;
      }
    }
    return true;
  },
  shuffle(array) {
    let currentIndex = array.length;
    let temporaryValue;
    let randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  },
  isNumeric: (input) => {
    if (gUtilities.isNullOrWhiteSpace(input) === true) {
      return false;
    }
    return !isNaN(input);
  },
  isNegativeNumeric: (input) => {
    if (!gUtilities.isNumeric(input)) {
      return false;
    }
    return +input < 0;
  },
  hasDuplicates: (input) => {
    if (new Set(input).size !== input.length) {
      return true;
    }
    return false;
  },
  extend: (array1, array2) => {
    array2.forEach((item) => {
      array1.push(item);
    });
  },
  prettyPrintJsonFromString: (input) => {
    if (!input) {
      return "";
    }
    return gUtilities.prettyPrintJsonFromObject(JSON.parse(input));
  },
  prettyPrintJsonFromObject: (input) => {
    if (!input) {
      return "";
    }
    return JSON.stringify(
      input,
      null,
      4
      // indented 4 spaces
    );
  },
  isPositiveNumeric: (input) => {
    if (!gUtilities.isNumeric(input)) {
      return false;
    }
    return Number(input) >= 0;
  },
  getTime: () => {
    const now = new Date(Date.now());
    const time = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}::${now.getMilliseconds().toString().padStart(3, "0")}:`;
    return time;
  },
  splitByNewLine: (input) => {
    if (gUtilities.isNullOrWhiteSpace(input) === true) {
      return [];
    }
    const results = input.split(/[\r\n]+/);
    const cleaned = [];
    results.forEach((value) => {
      if (!gUtilities.isNullOrWhiteSpace(value)) {
        cleaned.push(value.trim());
      }
    });
    return cleaned;
  },
  splitByPipe: (input) => {
    if (gUtilities.isNullOrWhiteSpace(input) === true) {
      return [];
    }
    const results = input.split("|");
    const cleaned = [];
    results.forEach((value) => {
      if (!gUtilities.isNullOrWhiteSpace(value)) {
        cleaned.push(value.trim());
      }
    });
    return cleaned;
  },
  splitByNewLineAndOrder: (input) => {
    return gUtilities.splitByNewLine(input).sort();
  },
  joinByNewLine: (input) => {
    if (!input || input.length === 0) {
      return "";
    }
    return input.join("\n");
  },
  removeAllChildren: (parent) => {
    if (parent !== null) {
      while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
      }
    }
  },
  isOdd: (x) => {
    return x % 2 === 1;
  },
  shortPrintText: (input, maxLength = 100) => {
    if (gUtilities.isNullOrWhiteSpace(input) === true) {
      return "";
    }
    const firstNewLineIndex = gUtilities.getFirstNewLineIndex(input);
    if (firstNewLineIndex > 0 && firstNewLineIndex <= maxLength) {
      const output2 = input.substr(0, firstNewLineIndex - 1);
      return gUtilities.trimAndAddEllipsis(output2);
    }
    if (input.length <= maxLength) {
      return input;
    }
    const output = input.substr(0, maxLength);
    return gUtilities.trimAndAddEllipsis(output);
  },
  trimAndAddEllipsis: (input) => {
    let output = input.trim();
    let punctuationRegex = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
    let spaceRegex = /\W+/g;
    let lastCharacter = output[output.length - 1];
    let lastCharacterIsPunctuation = punctuationRegex.test(lastCharacter) || spaceRegex.test(lastCharacter);
    while (lastCharacterIsPunctuation === true) {
      output = output.substr(0, output.length - 1);
      lastCharacter = output[output.length - 1];
      lastCharacterIsPunctuation = punctuationRegex.test(lastCharacter) || spaceRegex.test(lastCharacter);
    }
    return `${output}...`;
  },
  getFirstNewLineIndex: (input) => {
    let character;
    for (let i = 0; i < input.length; i++) {
      character = input[i];
      if (character === "\n" || character === "\r") {
        return i;
      }
    }
    return -1;
  },
  upperCaseFirstLetter: (input) => {
    return input.charAt(0).toUpperCase() + input.slice(1);
  },
  generateGuid: (useHypens = false) => {
    let d = (/* @__PURE__ */ new Date()).getTime();
    let d2 = performance && performance.now && performance.now() * 1e3 || 0;
    let pattern = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    if (!useHypens) {
      pattern = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx";
    }
    const guid = pattern.replace(
      /[xy]/g,
      function(c) {
        let r = Math.random() * 16;
        if (d > 0) {
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
        } else {
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
        }
        return (c === "x" ? r : r & 3 | 8).toString(16);
      }
    );
    return guid;
  },
  checkIfChrome: () => {
    let tsWindow = window;
    let isChromium = tsWindow.chrome;
    let winNav = window.navigator;
    let vendorName = winNav.vendor;
    let isOpera = typeof tsWindow.opr !== "undefined";
    let isIEedge = winNav.userAgent.indexOf("Edge") > -1;
    let isIOSChrome = winNav.userAgent.match("CriOS");
    if (isIOSChrome) {
      return true;
    } else if (isChromium !== null && typeof isChromium !== "undefined" && vendorName === "Google Inc." && isOpera === false && isIEedge === false) {
      return true;
    }
    return false;
  }
};
class HistoryUrl {
  constructor(url) {
    __publicField(this, "url");
    this.url = url;
  }
}
class RenderSnapShot {
  constructor(url) {
    __publicField(this, "url");
    __publicField(this, "guid", null);
    __publicField(this, "created", null);
    __publicField(this, "modified", null);
    __publicField(this, "expandedOptionIDs", []);
    __publicField(this, "expandedAncillaryIDs", []);
    this.url = url;
  }
}
const buildUrlFromRoot = (root) => {
  const urlAssembler = {
    url: `${location.origin}${location.pathname}?`
  };
  if (!root.selected) {
    return urlAssembler.url;
  }
  printSegmentEnd(
    urlAssembler,
    root
  );
  return urlAssembler.url;
};
const printSegmentEnd = (urlAssembler, fragment) => {
  var _a;
  if (!fragment) {
    return;
  }
  if ((_a = fragment.link) == null ? void 0 : _a.root) {
    let url = urlAssembler.url;
    url = `${url}~${fragment.id}`;
    urlAssembler.url = url;
    printSegmentEnd(
      urlAssembler,
      fragment.link.root
    );
  } else if (!gUtilities.isNullOrWhiteSpace(fragment.exitKey)) {
    let url = urlAssembler.url;
    url = `${url}_${fragment.id}`;
    urlAssembler.url = url;
  } else if (!fragment.link && !fragment.selected) {
    let url = urlAssembler.url;
    url = `${url}-${fragment.id}`;
    urlAssembler.url = url;
  }
  printSegmentEnd(
    urlAssembler,
    fragment.selected
  );
};
const gHistoryCode = {
  resetRaw: () => {
    window.TreeSolve.screen.autofocus = true;
    window.TreeSolve.screen.isAutofocusFirstRun = true;
  },
  pushBrowserHistoryState: (state) => {
    var _a, _b;
    if (state.renderState.isChainLoad === true) {
      return;
    }
    state.renderState.refreshUrl = false;
    if (!((_a = state.renderState.currentSection) == null ? void 0 : _a.current) || !((_b = state.renderState.displayGuide) == null ? void 0 : _b.root)) {
      return;
    }
    gHistoryCode.resetRaw();
    const location2 = window.location;
    let lastUrl;
    if (window.history.state) {
      lastUrl = window.history.state.url;
    } else {
      lastUrl = `${location2.origin}${location2.pathname}${location2.search}`;
    }
    const url = buildUrlFromRoot(state.renderState.displayGuide.root);
    if (lastUrl && url === lastUrl) {
      return;
    }
    history.pushState(
      new RenderSnapShot(url),
      "",
      url
    );
    state.stepHistory.historyChain.push(new HistoryUrl(url));
  }
};
let count = 0;
const gStateCode = {
  setDirty: (state) => {
    state.renderState.ui.raw = false;
    state.renderState.isChainLoad = false;
  },
  getFreshKeyInt: (state) => {
    const nextKey = ++state.nextKey;
    return nextKey;
  },
  getFreshKey: (state) => {
    return `${gStateCode.getFreshKeyInt(state)}`;
  },
  getGuidKey: () => {
    return gUtilities.generateGuid();
  },
  cloneState: (state) => {
    if (state.renderState.refreshUrl === true) {
      gHistoryCode.pushBrowserHistoryState(state);
    }
    let newState = { ...state };
    return newState;
  },
  AddReLoadDataEffectImmediate: (state, name, parseType, url, actionDelegate) => {
    console.log(name);
    console.log(url);
    if (count > 0) {
      return;
    }
    if (url.endsWith("imyo6C08H.html")) {
      count++;
    }
    const effect = state.repeatEffects.reLoadGetHttpImmediate.find((effect2) => {
      return effect2.name === name && effect2.url === url;
    });
    if (effect) {
      return;
    }
    const httpEffect2 = new HttpEffect(
      name,
      url,
      parseType,
      actionDelegate
    );
    state.repeatEffects.reLoadGetHttpImmediate.push(httpEffect2);
  },
  AddRunActionImmediate: (state, actionDelegate) => {
    state.repeatEffects.runActionImmediate.push(actionDelegate);
  },
  getCached_outlineNode: (state, linkID, fragmentID) => {
    if (gUtilities.isNullOrWhiteSpace(fragmentID)) {
      return null;
    }
    const key = gStateCode.getCacheKey(
      linkID,
      fragmentID
    );
    const outlineNode = state.renderState.index_outlineNodes_id[key] ?? null;
    if (!outlineNode) {
      console.log("OutlineNode was null");
    }
    return outlineNode;
  },
  cache_outlineNode: (state, linkID, outlineNode) => {
    if (!outlineNode) {
      return;
    }
    const key = gStateCode.getCacheKey(
      linkID,
      outlineNode.i
    );
    if (state.renderState.index_outlineNodes_id[key]) {
      return;
    }
    state.renderState.index_outlineNodes_id[key] = outlineNode;
  },
  getCached_chainFragment: (state, linkID, fragmentID) => {
    if (gUtilities.isNullOrWhiteSpace(fragmentID) === true) {
      return null;
    }
    const key = gStateCode.getCacheKey(
      linkID,
      fragmentID
    );
    return state.renderState.index_chainFragments_id[key] ?? null;
  },
  cache_chainFragment: (state, renderFragment) => {
    if (!renderFragment) {
      return;
    }
    const key = gStateCode.getCacheKeyFromFragment(renderFragment);
    if (gUtilities.isNullOrWhiteSpace(key) === true) {
      return;
    }
    if (state.renderState.index_chainFragments_id[key]) {
      return;
    }
    state.renderState.index_chainFragments_id[key] = renderFragment;
  },
  getCacheKeyFromFragment: (renderFragment) => {
    return gStateCode.getCacheKey(
      renderFragment.section.linkID,
      renderFragment.id
    );
  },
  getCacheKey: (linkID, fragmentID) => {
    return `${linkID}_${fragmentID}`;
  }
};
const gAuthenticationCode = {
  clearAuthentication: (state) => {
    state.user.authorised = false;
    state.user.name = "";
    state.user.sub = "";
    state.user.logoutUrl = "";
  }
};
var ActionType = /* @__PURE__ */ ((ActionType2) => {
  ActionType2["None"] = "none";
  ActionType2["FilterTopics"] = "filterTopics";
  ActionType2["GetTopic"] = "getTopic";
  ActionType2["GetTopicAndRoot"] = "getTopicAndRoot";
  ActionType2["SaveArticleScene"] = "saveArticleScene";
  ActionType2["GetRoot"] = "getRoot";
  ActionType2["GetStep"] = "getStep";
  ActionType2["GetPage"] = "getPage";
  ActionType2["GetChain"] = "getChain";
  ActionType2["GetOutline"] = "getOutline";
  ActionType2["GetFragment"] = "getFragment";
  ActionType2["GetChainFragment"] = "getChainFragment";
  return ActionType2;
})(ActionType || {});
const gAjaxHeaderCode = {
  buildHeaders: (state, callID, action) => {
    let headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("X-CSRF", "1");
    headers.append("SubscriptionID", state.settings.subscriptionID);
    headers.append("CallID", callID);
    headers.append("Action", action);
    headers.append("withCredentials", "true");
    return headers;
  }
};
const gAuthenticationEffects = {
  checkUserAuthenticated: (state) => {
    if (!state) {
      return;
    }
    const callID = gUtilities.generateGuid();
    let headers = gAjaxHeaderCode.buildHeaders(
      state,
      callID,
      ActionType.None
    );
    const url = `${state.settings.bffUrl}/${state.settings.userPath}?slide=false`;
    return gAuthenticatedHttp({
      url,
      options: {
        method: "GET",
        headers
      },
      response: "json",
      action: gAuthenticationActions.loadSuccessfulAuthentication,
      error: (state2, errorDetails) => {
        console.log(`{
                    "message": "Error trying to authenticate with the server",
                    "url": ${url},
                    "error Details": ${JSON.stringify(errorDetails)},
                    "stack": ${JSON.stringify(errorDetails.stack)},
                    "method": ${gAuthenticationEffects.checkUserAuthenticated.name},
                    "callID: ${callID}
                }`);
        alert(`{
                    "message": "Error trying to authenticate with the server",
                    "url": ${url},
                    "error Details": ${JSON.stringify(errorDetails)},
                    "stack": ${JSON.stringify(errorDetails.stack)},
                    "method": gAuthenticationEffects.checkUserAuthenticated.name,
                    "callID: ${callID},
                    "state": ${JSON.stringify(state2)}
                }`);
        return gStateCode.cloneState(state2);
      }
    });
  }
};
const gAuthenticationActions = {
  loadSuccessfulAuthentication: (state, response) => {
    if (!state || !response || response.parseType !== "json" || !response.jsonData) {
      return state;
    }
    const claims = response.jsonData;
    const name = claims.find(
      (claim) => claim.type === "name"
    );
    const sub = claims.find(
      (claim) => claim.type === "sub"
    );
    if (!name && !sub) {
      return state;
    }
    const logoutUrlClaim = claims.find(
      (claim) => claim.type === "bff:logout_url"
    );
    if (!logoutUrlClaim || !logoutUrlClaim.value) {
      return state;
    }
    state.user.authorised = true;
    state.user.name = name.value;
    state.user.sub = sub.value;
    state.user.logoutUrl = logoutUrlClaim.value;
    return gStateCode.cloneState(state);
  },
  checkUserLoggedIn: (state) => {
    const props = gAuthenticationActions.checkUserLoggedInProps(state);
    if (!props) {
      return state;
    }
    return [
      state,
      props
    ];
  },
  checkUserLoggedInProps: (state) => {
    state.user.raw = false;
    return gAuthenticationEffects.checkUserAuthenticated(state);
  },
  login: (state) => {
    const currentUrl = window.location.href;
    sessionStorage.setItem(
      Keys.startUrl,
      currentUrl
    );
    const url = `${state.settings.bffUrl}/${state.settings.defaultLoginPath}?returnUrl=/`;
    window.location.assign(url);
    return state;
  },
  clearAuthentication: (state) => {
    gAuthenticationCode.clearAuthentication(state);
    return gStateCode.cloneState(state);
  },
  clearAuthenticationAndShowLogin: (state) => {
    gAuthenticationCode.clearAuthentication(state);
    return gAuthenticationActions.login(state);
  },
  logout: (state) => {
    window.location.assign(state.user.logoutUrl);
    return state;
  }
};
function gAuthenticatedHttp(props) {
  const httpAuthenticatedProperties = props;
  httpAuthenticatedProperties.onAuthenticationFailAction = gAuthenticationActions.clearAuthenticationAndShowLogin;
  return gHttp(httpAuthenticatedProperties);
}
const runActionInner = (dispatch, props) => {
  dispatch(
    props.action
  );
};
const runAction = (state, queuedEffects) => {
  const effects = [];
  queuedEffects.forEach((action) => {
    const props = {
      action,
      error: (_state, errorDetails) => {
        console.log(`{
                    "message": "Error running action in repeatActions",
                    "error Details": ${JSON.stringify(errorDetails)},
                    "stack": ${JSON.stringify(errorDetails.stack)},
                    "method": ${runAction},
                }`);
        alert("Error running action in repeatActions");
      }
    };
    effects.push([
      runActionInner,
      props
    ]);
  });
  return [
    gStateCode.cloneState(state),
    ...effects
  ];
};
const sendRequest = (state, queuedEffects) => {
  const effects = [];
  queuedEffects.forEach((httpEffect2) => {
    getEffect(
      state,
      httpEffect2,
      effects
    );
  });
  return [
    gStateCode.cloneState(state),
    ...effects
  ];
};
const getEffect = (_state, httpEffect2, effects) => {
  const url = httpEffect2.url;
  const callID = gUtilities.generateGuid();
  let headers = new Headers();
  headers.append("Accept", "*/*");
  const options = {
    method: "GET",
    headers
  };
  const effect = gAuthenticatedHttp({
    url,
    parseType: httpEffect2.parseType,
    options,
    response: "json",
    action: httpEffect2.actionDelegate,
    error: (_state2, errorDetails) => {
      console.log(`{
                    "message": "Error posting gRepeatActions data to the server",
                    "url": ${url},
                    "error Details": ${JSON.stringify(errorDetails)},
                    "stack": ${JSON.stringify(errorDetails.stack)},
                    "method": ${getEffect.name},
                    "callID: ${callID}
                }`);
      alert("Error posting gRepeatActions data to the server");
    }
  });
  effects.push(effect);
};
const gRepeatActions = {
  httpSilentReLoadImmediate: (state) => {
    if (!state) {
      return state;
    }
    if (state.repeatEffects.reLoadGetHttpImmediate.length === 0) {
      return state;
    }
    const reLoadHttpEffectsImmediate = state.repeatEffects.reLoadGetHttpImmediate;
    state.repeatEffects.reLoadGetHttpImmediate = [];
    return sendRequest(
      state,
      reLoadHttpEffectsImmediate
    );
  },
  silentRunActionImmediate: (state) => {
    if (!state) {
      return state;
    }
    if (state.repeatEffects.runActionImmediate.length === 0) {
      return state;
    }
    const runActionImmediate = state.repeatEffects.runActionImmediate;
    state.repeatEffects.runActionImmediate = [];
    return runAction(
      state,
      runActionImmediate
    );
  }
};
const repeatSubscriptions = {
  buildRepeatSubscriptions: (state) => {
    const buildReLoadDataImmediate = () => {
      if (state.repeatEffects.reLoadGetHttpImmediate.length > 0) {
        return interval(
          gRepeatActions.httpSilentReLoadImmediate,
          { delay: 10 }
        );
      }
    };
    const buildRunActionsImmediate = () => {
      if (state.repeatEffects.runActionImmediate.length > 0) {
        return interval(
          gRepeatActions.silentRunActionImmediate,
          { delay: 10 }
        );
      }
    };
    const repeatSubscription = [
      buildReLoadDataImmediate(),
      buildRunActionsImmediate()
    ];
    return repeatSubscription;
  }
};
const initSubscriptions = (state) => {
  if (!state) {
    return;
  }
  const subscriptions = [
    ...repeatSubscriptions.buildRepeatSubscriptions(state)
  ];
  return subscriptions;
};
/*! @vimeo/player v2.30.3 | (c) 2026 Vimeo | MIT License | https://github.com/vimeo/player.js */
const isNode = typeof global !== "undefined" && {}.toString.call(global) === "[object global]";
const isBun = typeof Bun !== "undefined";
const isDeno = typeof Deno !== "undefined";
const isCloudflareWorker = typeof WebSocketPair === "function" && typeof (caches == null ? void 0 : caches.default) !== "undefined";
const isServerRuntime = isNode || isBun || isDeno || isCloudflareWorker;
function getMethodName(prop, type) {
  if (prop.indexOf(type.toLowerCase()) === 0) {
    return prop;
  }
  return `${type.toLowerCase()}${prop.substr(0, 1).toUpperCase()}${prop.substr(1)}`;
}
function isDomElement(element) {
  return Boolean(element && element.nodeType === 1 && "nodeName" in element && element.ownerDocument && element.ownerDocument.defaultView);
}
function isInteger(value) {
  return !isNaN(parseFloat(value)) && isFinite(value) && Math.floor(value) == value;
}
function isVimeoUrl(url) {
  return /^(https?:)?\/\/((((player|www)\.)?vimeo\.com)|((player\.)?[a-zA-Z0-9-]+\.(videoji\.(hk|cn)|vimeo\.work)))(?=$|\/)/.test(url);
}
function isVimeoEmbed(url) {
  const expr = /^https:\/\/player\.((vimeo\.com)|([a-zA-Z0-9-]+\.(videoji\.(hk|cn)|vimeo\.work)))\/video\/\d+/;
  return expr.test(url);
}
function getOembedDomain(url) {
  const match = (url || "").match(/^(?:https?:)?(?:\/\/)?([^/?]+)/);
  const domain = (match && match[1] || "").replace("player.", "");
  const customDomains = [".videoji.hk", ".vimeo.work", ".videoji.cn"];
  for (const customDomain of customDomains) {
    if (domain.endsWith(customDomain)) {
      return domain;
    }
  }
  return "vimeo.com";
}
function getVimeoUrl() {
  let oEmbedParameters2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const id = oEmbedParameters2.id;
  const url = oEmbedParameters2.url;
  const idOrUrl = id || url;
  if (!idOrUrl) {
    throw new Error("An id or url must be passed, either in an options object or as a data-vimeo-id or data-vimeo-url attribute.");
  }
  if (isInteger(idOrUrl)) {
    return `https://vimeo.com/${idOrUrl}`;
  }
  if (isVimeoUrl(idOrUrl)) {
    return idOrUrl.replace("http:", "https:");
  }
  if (id) {
    throw new TypeError(`“${id}” is not a valid video id.`);
  }
  throw new TypeError(`“${idOrUrl}” is not a vimeo.com url.`);
}
const subscribe = function(target, eventName, callback) {
  let onName = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "addEventListener";
  let offName = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : "removeEventListener";
  const eventNames = typeof eventName === "string" ? [eventName] : eventName;
  eventNames.forEach((evName) => {
    target[onName](evName, callback);
  });
  return {
    cancel: () => eventNames.forEach((evName) => target[offName](evName, callback))
  };
};
function findIframeBySourceWindow(sourceWindow) {
  let doc = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : document;
  if (!sourceWindow || !doc || typeof doc.querySelectorAll !== "function") {
    return null;
  }
  const iframes = doc.querySelectorAll("iframe");
  for (let i = 0; i < iframes.length; i++) {
    if (iframes[i] && iframes[i].contentWindow === sourceWindow) {
      return iframes[i];
    }
  }
  return null;
}
const arrayIndexOfSupport = typeof Array.prototype.indexOf !== "undefined";
const postMessageSupport = typeof window !== "undefined" && typeof window.postMessage !== "undefined";
if (!isServerRuntime && (!arrayIndexOfSupport || !postMessageSupport)) {
  throw new Error("Sorry, the Vimeo Player API is not available in this browser.");
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function createCommonjsModule(fn, module) {
  return module = { exports: {} }, fn(module, module.exports), module.exports;
}
/*!
 * weakmap-polyfill v2.0.4 - ECMAScript6 WeakMap polyfill
 * https://github.com/polygonplanet/weakmap-polyfill
 * Copyright (c) 2015-2021 polygonplanet <polygon.planet.aqua@gmail.com>
 * @license MIT
 */
(function(self2) {
  if (self2.WeakMap) {
    return;
  }
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasDefine = Object.defineProperty && (function() {
    try {
      return Object.defineProperty({}, "x", {
        value: 1
      }).x === 1;
    } catch (e) {
    }
  })();
  var defineProperty = function(object, name, value) {
    if (hasDefine) {
      Object.defineProperty(object, name, {
        configurable: true,
        writable: true,
        value
      });
    } else {
      object[name] = value;
    }
  };
  self2.WeakMap = (function() {
    function WeakMap2() {
      if (this === void 0) {
        throw new TypeError("Constructor WeakMap requires 'new'");
      }
      defineProperty(this, "_id", genId("_WeakMap"));
      if (arguments.length > 0) {
        throw new TypeError("WeakMap iterable is not supported");
      }
    }
    defineProperty(WeakMap2.prototype, "delete", function(key) {
      checkInstance(this, "delete");
      if (!isObject(key)) {
        return false;
      }
      var entry = key[this._id];
      if (entry && entry[0] === key) {
        delete key[this._id];
        return true;
      }
      return false;
    });
    defineProperty(WeakMap2.prototype, "get", function(key) {
      checkInstance(this, "get");
      if (!isObject(key)) {
        return void 0;
      }
      var entry = key[this._id];
      if (entry && entry[0] === key) {
        return entry[1];
      }
      return void 0;
    });
    defineProperty(WeakMap2.prototype, "has", function(key) {
      checkInstance(this, "has");
      if (!isObject(key)) {
        return false;
      }
      var entry = key[this._id];
      if (entry && entry[0] === key) {
        return true;
      }
      return false;
    });
    defineProperty(WeakMap2.prototype, "set", function(key, value) {
      checkInstance(this, "set");
      if (!isObject(key)) {
        throw new TypeError("Invalid value used as weak map key");
      }
      var entry = key[this._id];
      if (entry && entry[0] === key) {
        entry[1] = value;
        return this;
      }
      defineProperty(key, this._id, [key, value]);
      return this;
    });
    function checkInstance(x, methodName) {
      if (!isObject(x) || !hasOwnProperty.call(x, "_id")) {
        throw new TypeError(methodName + " method called on incompatible receiver " + typeof x);
      }
    }
    function genId(prefix) {
      return prefix + "_" + rand() + "." + rand();
    }
    function rand() {
      return Math.random().toString().substring(2);
    }
    defineProperty(WeakMap2, "_polyfill", true);
    return WeakMap2;
  })();
  function isObject(x) {
    return Object(x) === x;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof commonjsGlobal !== "undefined" ? commonjsGlobal : commonjsGlobal);
var npo_src = createCommonjsModule(function(module) {
  /*! Native Promise Only
      v0.8.1 (c) Kyle Simpson
      MIT License: http://getify.mit-license.org
  */
  (function UMD(name, context, definition) {
    context[name] = context[name] || definition();
    if (module.exports) {
      module.exports = context[name];
    }
  })("Promise", typeof commonjsGlobal != "undefined" ? commonjsGlobal : commonjsGlobal, function DEF() {
    var builtInProp, cycle, scheduling_queue, ToString = Object.prototype.toString, timer = typeof setImmediate != "undefined" ? function timer2(fn) {
      return setImmediate(fn);
    } : setTimeout;
    try {
      Object.defineProperty({}, "x", {});
      builtInProp = function builtInProp2(obj, name, val, config) {
        return Object.defineProperty(obj, name, {
          value: val,
          writable: true,
          configurable: config !== false
        });
      };
    } catch (err) {
      builtInProp = function builtInProp2(obj, name, val) {
        obj[name] = val;
        return obj;
      };
    }
    scheduling_queue = /* @__PURE__ */ (function Queue() {
      var first, last, item;
      function Item(fn, self2) {
        this.fn = fn;
        this.self = self2;
        this.next = void 0;
      }
      return {
        add: function add(fn, self2) {
          item = new Item(fn, self2);
          if (last) {
            last.next = item;
          } else {
            first = item;
          }
          last = item;
          item = void 0;
        },
        drain: function drain() {
          var f = first;
          first = last = cycle = void 0;
          while (f) {
            f.fn.call(f.self);
            f = f.next;
          }
        }
      };
    })();
    function schedule(fn, self2) {
      scheduling_queue.add(fn, self2);
      if (!cycle) {
        cycle = timer(scheduling_queue.drain);
      }
    }
    function isThenable(o) {
      var _then, o_type = typeof o;
      if (o != null && (o_type == "object" || o_type == "function")) {
        _then = o.then;
      }
      return typeof _then == "function" ? _then : false;
    }
    function notify() {
      for (var i = 0; i < this.chain.length; i++) {
        notifyIsolated(this, this.state === 1 ? this.chain[i].success : this.chain[i].failure, this.chain[i]);
      }
      this.chain.length = 0;
    }
    function notifyIsolated(self2, cb, chain) {
      var ret, _then;
      try {
        if (cb === false) {
          chain.reject(self2.msg);
        } else {
          if (cb === true) {
            ret = self2.msg;
          } else {
            ret = cb.call(void 0, self2.msg);
          }
          if (ret === chain.promise) {
            chain.reject(TypeError("Promise-chain cycle"));
          } else if (_then = isThenable(ret)) {
            _then.call(ret, chain.resolve, chain.reject);
          } else {
            chain.resolve(ret);
          }
        }
      } catch (err) {
        chain.reject(err);
      }
    }
    function resolve(msg) {
      var _then, self2 = this;
      if (self2.triggered) {
        return;
      }
      self2.triggered = true;
      if (self2.def) {
        self2 = self2.def;
      }
      try {
        if (_then = isThenable(msg)) {
          schedule(function() {
            var def_wrapper = new MakeDefWrapper(self2);
            try {
              _then.call(msg, function $resolve$() {
                resolve.apply(def_wrapper, arguments);
              }, function $reject$() {
                reject.apply(def_wrapper, arguments);
              });
            } catch (err) {
              reject.call(def_wrapper, err);
            }
          });
        } else {
          self2.msg = msg;
          self2.state = 1;
          if (self2.chain.length > 0) {
            schedule(notify, self2);
          }
        }
      } catch (err) {
        reject.call(new MakeDefWrapper(self2), err);
      }
    }
    function reject(msg) {
      var self2 = this;
      if (self2.triggered) {
        return;
      }
      self2.triggered = true;
      if (self2.def) {
        self2 = self2.def;
      }
      self2.msg = msg;
      self2.state = 2;
      if (self2.chain.length > 0) {
        schedule(notify, self2);
      }
    }
    function iteratePromises(Constructor, arr, resolver, rejecter) {
      for (var idx = 0; idx < arr.length; idx++) {
        (function IIFE(idx2) {
          Constructor.resolve(arr[idx2]).then(function $resolver$(msg) {
            resolver(idx2, msg);
          }, rejecter);
        })(idx);
      }
    }
    function MakeDefWrapper(self2) {
      this.def = self2;
      this.triggered = false;
    }
    function MakeDef(self2) {
      this.promise = self2;
      this.state = 0;
      this.triggered = false;
      this.chain = [];
      this.msg = void 0;
    }
    function Promise2(executor) {
      if (typeof executor != "function") {
        throw TypeError("Not a function");
      }
      if (this.__NPO__ !== 0) {
        throw TypeError("Not a promise");
      }
      this.__NPO__ = 1;
      var def = new MakeDef(this);
      this["then"] = function then(success, failure) {
        var o = {
          success: typeof success == "function" ? success : true,
          failure: typeof failure == "function" ? failure : false
        };
        o.promise = new this.constructor(function extractChain(resolve2, reject2) {
          if (typeof resolve2 != "function" || typeof reject2 != "function") {
            throw TypeError("Not a function");
          }
          o.resolve = resolve2;
          o.reject = reject2;
        });
        def.chain.push(o);
        if (def.state !== 0) {
          schedule(notify, def);
        }
        return o.promise;
      };
      this["catch"] = function $catch$(failure) {
        return this.then(void 0, failure);
      };
      try {
        executor.call(void 0, function publicResolve(msg) {
          resolve.call(def, msg);
        }, function publicReject(msg) {
          reject.call(def, msg);
        });
      } catch (err) {
        reject.call(def, err);
      }
    }
    var PromisePrototype = builtInProp(
      {},
      "constructor",
      Promise2,
      /*configurable=*/
      false
    );
    Promise2.prototype = PromisePrototype;
    builtInProp(
      PromisePrototype,
      "__NPO__",
      0,
      /*configurable=*/
      false
    );
    builtInProp(Promise2, "resolve", function Promise$resolve(msg) {
      var Constructor = this;
      if (msg && typeof msg == "object" && msg.__NPO__ === 1) {
        return msg;
      }
      return new Constructor(function executor(resolve2, reject2) {
        if (typeof resolve2 != "function" || typeof reject2 != "function") {
          throw TypeError("Not a function");
        }
        resolve2(msg);
      });
    });
    builtInProp(Promise2, "reject", function Promise$reject(msg) {
      return new this(function executor(resolve2, reject2) {
        if (typeof resolve2 != "function" || typeof reject2 != "function") {
          throw TypeError("Not a function");
        }
        reject2(msg);
      });
    });
    builtInProp(Promise2, "all", function Promise$all(arr) {
      var Constructor = this;
      if (ToString.call(arr) != "[object Array]") {
        return Constructor.reject(TypeError("Not an array"));
      }
      if (arr.length === 0) {
        return Constructor.resolve([]);
      }
      return new Constructor(function executor(resolve2, reject2) {
        if (typeof resolve2 != "function" || typeof reject2 != "function") {
          throw TypeError("Not a function");
        }
        var len = arr.length, msgs = Array(len), count2 = 0;
        iteratePromises(Constructor, arr, function resolver(idx, msg) {
          msgs[idx] = msg;
          if (++count2 === len) {
            resolve2(msgs);
          }
        }, reject2);
      });
    });
    builtInProp(Promise2, "race", function Promise$race(arr) {
      var Constructor = this;
      if (ToString.call(arr) != "[object Array]") {
        return Constructor.reject(TypeError("Not an array"));
      }
      return new Constructor(function executor(resolve2, reject2) {
        if (typeof resolve2 != "function" || typeof reject2 != "function") {
          throw TypeError("Not a function");
        }
        iteratePromises(Constructor, arr, function resolver(idx, msg) {
          resolve2(msg);
        }, reject2);
      });
    });
    return Promise2;
  });
});
const callbackMap = /* @__PURE__ */ new WeakMap();
function storeCallback(player, name, callback) {
  const playerCallbacks = callbackMap.get(player.element) || {};
  if (!(name in playerCallbacks)) {
    playerCallbacks[name] = [];
  }
  playerCallbacks[name].push(callback);
  callbackMap.set(player.element, playerCallbacks);
}
function getCallbacks(player, name) {
  const playerCallbacks = callbackMap.get(player.element) || {};
  return playerCallbacks[name] || [];
}
function removeCallback(player, name, callback) {
  const playerCallbacks = callbackMap.get(player.element) || {};
  if (!playerCallbacks[name]) {
    return true;
  }
  if (!callback) {
    playerCallbacks[name] = [];
    callbackMap.set(player.element, playerCallbacks);
    return true;
  }
  const index = playerCallbacks[name].indexOf(callback);
  if (index !== -1) {
    playerCallbacks[name].splice(index, 1);
  }
  callbackMap.set(player.element, playerCallbacks);
  return playerCallbacks[name] && playerCallbacks[name].length === 0;
}
function shiftCallbacks(player, name) {
  const playerCallbacks = getCallbacks(player, name);
  if (playerCallbacks.length < 1) {
    return false;
  }
  const callback = playerCallbacks.shift();
  removeCallback(player, name, callback);
  return callback;
}
function swapCallbacks(oldElement, newElement) {
  const playerCallbacks = callbackMap.get(oldElement);
  callbackMap.set(newElement, playerCallbacks);
  callbackMap.delete(oldElement);
}
function parseMessageData(data) {
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.warn(error);
      return {};
    }
  }
  return data;
}
function postMessage(player, method, params) {
  if (!player.element.contentWindow || !player.element.contentWindow.postMessage) {
    return;
  }
  let message = {
    method
  };
  if (params !== void 0) {
    message.value = params;
  }
  const ieVersion = parseFloat(navigator.userAgent.toLowerCase().replace(/^.*msie (\d+).*$/, "$1"));
  if (ieVersion >= 8 && ieVersion < 10) {
    message = JSON.stringify(message);
  }
  player.element.contentWindow.postMessage(message, player.origin);
}
function processData(player, data) {
  data = parseMessageData(data);
  let callbacks = [];
  let param;
  if (data.event) {
    if (data.event === "error") {
      const promises = getCallbacks(player, data.data.method);
      promises.forEach((promise) => {
        const error = new Error(data.data.message);
        error.name = data.data.name;
        promise.reject(error);
        removeCallback(player, data.data.method, promise);
      });
    }
    callbacks = getCallbacks(player, `event:${data.event}`);
    param = data.data;
  } else if (data.method) {
    const callback = shiftCallbacks(player, data.method);
    if (callback) {
      callbacks.push(callback);
      param = data.value;
    }
  }
  callbacks.forEach((callback) => {
    try {
      if (typeof callback === "function") {
        callback.call(player, param);
        return;
      }
      callback.resolve(param);
    } catch (e) {
    }
  });
}
const oEmbedParameters = ["airplay", "audio_tracks", "audiotrack", "autopause", "autoplay", "background", "byline", "cc", "chapter_id", "chapters", "chromecast", "color", "colors", "controls", "dnt", "end_time", "fullscreen", "height", "id", "initial_quality", "interactive_params", "keyboard", "loop", "maxheight", "max_quality", "maxwidth", "min_quality", "muted", "play_button_position", "playsinline", "portrait", "preload", "progress_bar", "quality", "quality_selector", "responsive", "skipping_forward", "speed", "start_time", "texttrack", "thumbnail_id", "title", "transcript", "transparent", "unmute_button", "url", "vimeo_logo", "volume", "watch_full_video", "width"];
function getOEmbedParameters(element) {
  let defaults = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  return oEmbedParameters.reduce((params, param) => {
    const value = element.getAttribute(`data-vimeo-${param}`);
    if (value || value === "") {
      params[param] = value === "" ? 1 : value;
    }
    return params;
  }, defaults);
}
function createEmbed(_ref, element) {
  let {
    html
  } = _ref;
  if (!element) {
    throw new TypeError("An element must be provided");
  }
  if (element.getAttribute("data-vimeo-initialized") !== null) {
    return element.querySelector("iframe");
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  element.appendChild(div.firstChild);
  element.setAttribute("data-vimeo-initialized", "true");
  return element.querySelector("iframe");
}
function getOEmbedData(videoUrl) {
  let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  let element = arguments.length > 2 ? arguments[2] : void 0;
  return new Promise((resolve, reject) => {
    if (!isVimeoUrl(videoUrl)) {
      throw new TypeError(`“${videoUrl}” is not a vimeo.com url.`);
    }
    const domain = getOembedDomain(videoUrl);
    let url = `https://${domain}/api/oembed.json?url=${encodeURIComponent(videoUrl)}`;
    for (const param in params) {
      if (params.hasOwnProperty(param)) {
        url += `&${param}=${encodeURIComponent(params[param])}`;
      }
    }
    const xhr = "XDomainRequest" in window ? new XDomainRequest() : new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
      if (xhr.status === 404) {
        reject(new Error(`“${videoUrl}” was not found.`));
        return;
      }
      if (xhr.status === 403) {
        reject(new Error(`“${videoUrl}” is not embeddable.`));
        return;
      }
      try {
        const json = JSON.parse(xhr.responseText);
        if (json.domain_status_code === 403) {
          createEmbed(json, element);
          reject(new Error(`“${videoUrl}” is not embeddable.`));
          return;
        }
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = function() {
      const status = xhr.status ? ` (${xhr.status})` : "";
      reject(new Error(`There was an error fetching the embed code from Vimeo${status}.`));
    };
    xhr.send();
  });
}
function initializeEmbeds() {
  let parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
  const elements = [].slice.call(parent.querySelectorAll("[data-vimeo-id], [data-vimeo-url]"));
  const handleError = (error) => {
    if ("console" in window && console.error) {
      console.error(`There was an error creating an embed: ${error}`);
    }
  };
  elements.forEach((element) => {
    try {
      if (element.getAttribute("data-vimeo-defer") !== null) {
        return;
      }
      const params = getOEmbedParameters(element);
      const url = getVimeoUrl(params);
      getOEmbedData(url, params, element).then((data) => {
        return createEmbed(data, element);
      }).catch(handleError);
    } catch (error) {
      handleError(error);
    }
  });
}
function resizeEmbeds() {
  let parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
  if (window.VimeoPlayerResizeEmbeds_) {
    return;
  }
  window.VimeoPlayerResizeEmbeds_ = true;
  const onMessage = (event) => {
    if (!isVimeoUrl(event.origin)) {
      return;
    }
    if (!event.data || event.data.event !== "spacechange") {
      return;
    }
    const senderIFrame = event.source ? findIframeBySourceWindow(event.source, parent) : null;
    if (senderIFrame) {
      const space = senderIFrame.parentElement;
      space.style.paddingBottom = `${event.data.data[0].bottom}px`;
    }
  };
  window.addEventListener("message", onMessage);
}
function initAppendVideoMetadata() {
  let parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
  if (window.VimeoSeoMetadataAppended) {
    return;
  }
  window.VimeoSeoMetadataAppended = true;
  const onMessage = (event) => {
    if (!isVimeoUrl(event.origin)) {
      return;
    }
    const data = parseMessageData(event.data);
    if (!data || data.event !== "ready") {
      return;
    }
    const senderIFrame = event.source ? findIframeBySourceWindow(event.source, parent) : null;
    if (senderIFrame && isVimeoEmbed(senderIFrame.src)) {
      const player = new Player(senderIFrame);
      player.callMethod("appendVideoMetadata", window.location.href);
    }
  };
  window.addEventListener("message", onMessage);
}
function checkUrlTimeParam() {
  let parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
  if (window.VimeoCheckedUrlTimeParam) {
    return;
  }
  window.VimeoCheckedUrlTimeParam = true;
  const handleError = (error) => {
    if ("console" in window && console.error) {
      console.error(`There was an error getting video Id: ${error}`);
    }
  };
  const onMessage = (event) => {
    if (!isVimeoUrl(event.origin)) {
      return;
    }
    const data = parseMessageData(event.data);
    if (!data || data.event !== "ready") {
      return;
    }
    const senderIFrame = event.source ? findIframeBySourceWindow(event.source, parent) : null;
    if (senderIFrame && isVimeoEmbed(senderIFrame.src)) {
      const player = new Player(senderIFrame);
      player.getVideoId().then((videoId) => {
        const matches = new RegExp(`[?&]vimeo_t_${videoId}=([^&#]*)`).exec(window.location.href);
        if (matches && matches[1]) {
          const sec = decodeURI(matches[1]);
          player.setCurrentTime(sec);
        }
        return;
      }).catch(handleError);
    }
  };
  window.addEventListener("message", onMessage);
}
function updateDRMEmbeds() {
  if (window.VimeoDRMEmbedsUpdated) {
    return;
  }
  window.VimeoDRMEmbedsUpdated = true;
  const onMessage = (event) => {
    if (!isVimeoUrl(event.origin)) {
      return;
    }
    const data = parseMessageData(event.data);
    if (!data || data.event !== "drminitfailed") {
      return;
    }
    const senderIFrame = event.source ? findIframeBySourceWindow(event.source) : null;
    if (!senderIFrame) {
      return;
    }
    const currentAllow = senderIFrame.getAttribute("allow") || "";
    const allowSupportsDRM = currentAllow.includes("encrypted-media");
    if (!allowSupportsDRM) {
      senderIFrame.setAttribute("allow", `${currentAllow}; encrypted-media`);
      const currentUrl = new URL(senderIFrame.getAttribute("src"));
      currentUrl.searchParams.set("forcereload", "drm");
      senderIFrame.setAttribute("src", currentUrl.toString());
      return;
    }
  };
  window.addEventListener("message", onMessage);
}
function initializeScreenfull() {
  const fn = (function() {
    let val;
    const fnMap = [
      ["requestFullscreen", "exitFullscreen", "fullscreenElement", "fullscreenEnabled", "fullscreenchange", "fullscreenerror"],
      // New WebKit
      ["webkitRequestFullscreen", "webkitExitFullscreen", "webkitFullscreenElement", "webkitFullscreenEnabled", "webkitfullscreenchange", "webkitfullscreenerror"],
      // Old WebKit
      ["webkitRequestFullScreen", "webkitCancelFullScreen", "webkitCurrentFullScreenElement", "webkitCancelFullScreen", "webkitfullscreenchange", "webkitfullscreenerror"],
      ["mozRequestFullScreen", "mozCancelFullScreen", "mozFullScreenElement", "mozFullScreenEnabled", "mozfullscreenchange", "mozfullscreenerror"],
      ["msRequestFullscreen", "msExitFullscreen", "msFullscreenElement", "msFullscreenEnabled", "MSFullscreenChange", "MSFullscreenError"]
    ];
    let i = 0;
    const l = fnMap.length;
    const ret = {};
    for (; i < l; i++) {
      val = fnMap[i];
      if (val && val[1] in document) {
        for (i = 0; i < val.length; i++) {
          ret[fnMap[0][i]] = val[i];
        }
        return ret;
      }
    }
    return false;
  })();
  const eventNameMap = {
    fullscreenchange: fn.fullscreenchange,
    fullscreenerror: fn.fullscreenerror
  };
  const screenfull2 = {
    request(element) {
      return new Promise((resolve, reject) => {
        const onFullScreenEntered = function() {
          screenfull2.off("fullscreenchange", onFullScreenEntered);
          resolve();
        };
        screenfull2.on("fullscreenchange", onFullScreenEntered);
        element = element || document.documentElement;
        const returnPromise = element[fn.requestFullscreen]();
        if (returnPromise instanceof Promise) {
          returnPromise.then(onFullScreenEntered).catch(reject);
        }
      });
    },
    exit() {
      return new Promise((resolve, reject) => {
        if (!screenfull2.isFullscreen) {
          resolve();
          return;
        }
        const onFullScreenExit = function() {
          screenfull2.off("fullscreenchange", onFullScreenExit);
          resolve();
        };
        screenfull2.on("fullscreenchange", onFullScreenExit);
        const returnPromise = document[fn.exitFullscreen]();
        if (returnPromise instanceof Promise) {
          returnPromise.then(onFullScreenExit).catch(reject);
        }
      });
    },
    on(event, callback) {
      const eventName = eventNameMap[event];
      if (eventName) {
        document.addEventListener(eventName, callback);
      }
    },
    off(event, callback) {
      const eventName = eventNameMap[event];
      if (eventName) {
        document.removeEventListener(eventName, callback);
      }
    }
  };
  Object.defineProperties(screenfull2, {
    isFullscreen: {
      get() {
        return Boolean(document[fn.fullscreenElement]);
      }
    },
    element: {
      enumerable: true,
      get() {
        return document[fn.fullscreenElement];
      }
    },
    isEnabled: {
      enumerable: true,
      get() {
        return Boolean(document[fn.fullscreenEnabled]);
      }
    }
  });
  return screenfull2;
}
const defaultOptions = {
  role: "viewer",
  autoPlayMuted: true,
  allowedDrift: 0.3,
  maxAllowedDrift: 1,
  minCheckInterval: 0.1,
  maxRateAdjustment: 0.2,
  maxTimeToCatchUp: 1
};
class TimingSrcConnector extends EventTarget {
  /**
   * @param {PlayerControls} player
   * @param {TimingObject} timingObject
   * @param {TimingSrcConnectorOptions} options
   * @param {Logger} logger
   */
  constructor(player, timingObject) {
    let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    let logger = arguments.length > 3 ? arguments[3] : void 0;
    super();
    __publicField(this, "logger");
    __publicField(this, "speedAdjustment", 0);
    /**
     * @param {PlayerControls} player
     * @param {number} newAdjustment
     * @return {Promise<void>}
     */
    __publicField(this, "adjustSpeed", async (player, newAdjustment) => {
      if (this.speedAdjustment === newAdjustment) {
        return;
      }
      const newPlaybackRate = await player.getPlaybackRate() - this.speedAdjustment + newAdjustment;
      this.log(`New playbackRate:  ${newPlaybackRate}`);
      await player.setPlaybackRate(newPlaybackRate);
      this.speedAdjustment = newAdjustment;
    });
    this.logger = logger;
    this.init(timingObject, player, {
      ...defaultOptions,
      ...options
    });
  }
  disconnect() {
    this.dispatchEvent(new Event("disconnect"));
  }
  /**
   * @param {TimingObject} timingObject
   * @param {PlayerControls} player
   * @param {TimingSrcConnectorOptions} options
   * @return {Promise<void>}
   */
  async init(timingObject, player, options) {
    await this.waitForTOReadyState(timingObject, "open");
    if (options.role === "viewer") {
      await this.updatePlayer(timingObject, player, options);
      const playerUpdater = subscribe(timingObject, "change", () => this.updatePlayer(timingObject, player, options));
      const positionSync = this.maintainPlaybackPosition(timingObject, player, options);
      this.addEventListener("disconnect", () => {
        positionSync.cancel();
        playerUpdater.cancel();
      });
    } else {
      await this.updateTimingObject(timingObject, player);
      const timingObjectUpdater = subscribe(player, ["seeked", "play", "pause", "ratechange"], () => this.updateTimingObject(timingObject, player), "on", "off");
      this.addEventListener("disconnect", () => timingObjectUpdater.cancel());
    }
  }
  /**
   * Sets the TimingObject's state to reflect that of the player
   *
   * @param {TimingObject} timingObject
   * @param {PlayerControls} player
   * @return {Promise<void>}
   */
  async updateTimingObject(timingObject, player) {
    const [position, isPaused, playbackRate] = await Promise.all([player.getCurrentTime(), player.getPaused(), player.getPlaybackRate()]);
    timingObject.update({
      position,
      velocity: isPaused ? 0 : playbackRate
    });
  }
  /**
   * Sets the player's timing state to reflect that of the TimingObject
   *
   * @param {TimingObject} timingObject
   * @param {PlayerControls} player
   * @param {TimingSrcConnectorOptions} options
   * @return {Promise<void>}
   */
  async updatePlayer(timingObject, player, options) {
    const {
      position,
      velocity
    } = timingObject.query();
    if (typeof position === "number") {
      player.setCurrentTime(position);
    }
    if (typeof velocity === "number") {
      if (velocity === 0) {
        if (await player.getPaused() === false) {
          player.pause();
        }
      } else if (velocity > 0) {
        if (await player.getPaused() === true) {
          await player.play().catch(async (err) => {
            if (err.name === "NotAllowedError" && options.autoPlayMuted) {
              await player.setMuted(true);
              await player.play().catch((err2) => console.error("Couldn't play the video from TimingSrcConnector. Error:", err2));
            }
          });
          this.updatePlayer(timingObject, player, options);
        }
        if (await player.getPlaybackRate() !== velocity) {
          player.setPlaybackRate(velocity);
        }
      }
    }
  }
  /**
   * Since video players do not play with 100% time precision, we need to closely monitor
   * our player to be sure it remains in sync with the TimingObject.
   *
   * If out of sync, we use the current conditions and the options provided to determine
   * whether to re-sync via setting currentTime or adjusting the playbackRate
   *
   * @param {TimingObject} timingObject
   * @param {PlayerControls} player
   * @param {TimingSrcConnectorOptions} options
   * @return {{cancel: (function(): void)}}
   */
  maintainPlaybackPosition(timingObject, player, options) {
    const {
      allowedDrift,
      maxAllowedDrift,
      minCheckInterval,
      maxRateAdjustment,
      maxTimeToCatchUp
    } = options;
    const syncInterval = Math.min(maxTimeToCatchUp, Math.max(minCheckInterval, maxAllowedDrift)) * 1e3;
    const check = async () => {
      if (timingObject.query().velocity === 0 || await player.getPaused() === true) {
        return;
      }
      const diff = timingObject.query().position - await player.getCurrentTime();
      const diffAbs = Math.abs(diff);
      this.log(`Drift: ${diff}`);
      if (diffAbs > maxAllowedDrift) {
        await this.adjustSpeed(player, 0);
        player.setCurrentTime(timingObject.query().position);
        this.log("Resync by currentTime");
      } else if (diffAbs > allowedDrift) {
        const min = diffAbs / maxTimeToCatchUp;
        const max = maxRateAdjustment;
        const adjustment = min < max ? (max - min) / 2 : max;
        await this.adjustSpeed(player, adjustment * Math.sign(diff));
        this.log("Resync by playbackRate");
      }
    };
    const interval2 = setInterval(() => check(), syncInterval);
    return {
      cancel: () => clearInterval(interval2)
    };
  }
  /**
   * @param {string} msg
   */
  log(msg) {
    var _a;
    (_a = this.logger) == null ? void 0 : _a.call(this, `TimingSrcConnector: ${msg}`);
  }
  /**
   * @param {TimingObject} timingObject
   * @param {TConnectionState} state
   * @return {Promise<void>}
   */
  waitForTOReadyState(timingObject, state) {
    return new Promise((resolve) => {
      const check = () => {
        if (timingObject.readyState === state) {
          resolve();
        } else {
          timingObject.addEventListener("readystatechange", check, {
            once: true
          });
        }
      };
      check();
    });
  }
}
const playerMap = /* @__PURE__ */ new WeakMap();
const readyMap = /* @__PURE__ */ new WeakMap();
let screenfull = {};
class Player {
  /**
   * Create a Player.
   *
   * @param {(HTMLIFrameElement|HTMLElement|string|jQuery)} element A reference to the Vimeo
   *        player iframe, and id, or a jQuery object.
   * @param {object} [options] oEmbed parameters to use when creating an embed in the element.
   * @return {Player}
   */
  constructor(element) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    if (window.jQuery && element instanceof jQuery) {
      if (element.length > 1 && window.console && console.warn) {
        console.warn("A jQuery object with multiple elements was passed, using the first element.");
      }
      element = element[0];
    }
    if (typeof document !== "undefined" && typeof element === "string") {
      element = document.getElementById(element);
    }
    if (!isDomElement(element)) {
      throw new TypeError("You must pass either a valid element or a valid id.");
    }
    if (element.nodeName !== "IFRAME") {
      const iframe = element.querySelector("iframe");
      if (iframe) {
        element = iframe;
      }
    }
    if (element.nodeName === "IFRAME" && !isVimeoUrl(element.getAttribute("src") || "")) {
      throw new Error("The player element passed isn’t a Vimeo embed.");
    }
    if (playerMap.has(element)) {
      return playerMap.get(element);
    }
    this._window = element.ownerDocument.defaultView;
    this.element = element;
    this.origin = "*";
    const readyPromise = new npo_src((resolve, reject) => {
      this._onMessage = (event) => {
        if (!isVimeoUrl(event.origin) || this.element.contentWindow !== event.source) {
          return;
        }
        if (this.origin === "*") {
          this.origin = event.origin;
        }
        const data = parseMessageData(event.data);
        const isError = data && data.event === "error";
        const isReadyError = isError && data.data && data.data.method === "ready";
        if (isReadyError) {
          const error = new Error(data.data.message);
          error.name = data.data.name;
          reject(error);
          return;
        }
        const isReadyEvent = data && data.event === "ready";
        const isPingResponse = data && data.method === "ping";
        if (isReadyEvent || isPingResponse) {
          this.element.setAttribute("data-ready", "true");
          resolve();
          return;
        }
        processData(this, data);
      };
      this._window.addEventListener("message", this._onMessage);
      if (this.element.nodeName !== "IFRAME") {
        const params = getOEmbedParameters(element, options);
        const url = getVimeoUrl(params);
        getOEmbedData(url, params, element).then((data) => {
          const iframe = createEmbed(data, element);
          this.element = iframe;
          this._originalElement = element;
          swapCallbacks(element, iframe);
          playerMap.set(this.element, this);
          return data;
        }).catch(reject);
      }
    });
    readyMap.set(this, readyPromise);
    playerMap.set(this.element, this);
    if (this.element.nodeName === "IFRAME") {
      postMessage(this, "ping");
    }
    if (screenfull.isEnabled) {
      const exitFullscreen = () => screenfull.exit();
      this.fullscreenchangeHandler = () => {
        if (screenfull.isFullscreen) {
          storeCallback(this, "event:exitFullscreen", exitFullscreen);
        } else {
          removeCallback(this, "event:exitFullscreen", exitFullscreen);
        }
        this.ready().then(() => {
          postMessage(this, "fullscreenchange", screenfull.isFullscreen);
        });
      };
      screenfull.on("fullscreenchange", this.fullscreenchangeHandler);
    }
    return this;
  }
  /**
   * Check to see if the URL is a Vimeo URL.
   *
   * @param {string} url The URL string.
   * @return {boolean}
   */
  static isVimeoUrl(url) {
    return isVimeoUrl(url);
  }
  /**
   * Get a promise for a method.
   *
   * @param {string} name The API method to call.
   * @param {...(string|number|object|Array)} args Arguments to send via postMessage.
   * @return {Promise}
   */
  callMethod(name) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    if (name === void 0 || name === null) {
      throw new TypeError("You must pass a method name.");
    }
    return new npo_src((resolve, reject) => {
      return this.ready().then(() => {
        storeCallback(this, name, {
          resolve,
          reject
        });
        if (args.length === 0) {
          args = {};
        } else if (args.length === 1) {
          args = args[0];
        }
        postMessage(this, name, args);
      }).catch(reject);
    });
  }
  /**
   * Get a promise for the value of a player property.
   *
   * @param {string} name The property name
   * @return {Promise}
   */
  get(name) {
    return new npo_src((resolve, reject) => {
      name = getMethodName(name, "get");
      return this.ready().then(() => {
        storeCallback(this, name, {
          resolve,
          reject
        });
        postMessage(this, name);
      }).catch(reject);
    });
  }
  /**
   * Get a promise for setting the value of a player property.
   *
   * @param {string} name The API method to call.
   * @param {mixed} value The value to set.
   * @return {Promise}
   */
  set(name, value) {
    return new npo_src((resolve, reject) => {
      name = getMethodName(name, "set");
      if (value === void 0 || value === null) {
        throw new TypeError("There must be a value to set.");
      }
      return this.ready().then(() => {
        storeCallback(this, name, {
          resolve,
          reject
        });
        postMessage(this, name, value);
      }).catch(reject);
    });
  }
  /**
   * Add an event listener for the specified event. Will call the
   * callback with a single parameter, `data`, that contains the data for
   * that event.
   *
   * @param {string} eventName The name of the event.
   * @param {function(*)} callback The function to call when the event fires.
   * @return {void}
   */
  on(eventName, callback) {
    if (!eventName) {
      throw new TypeError("You must pass an event name.");
    }
    if (!callback) {
      throw new TypeError("You must pass a callback function.");
    }
    if (typeof callback !== "function") {
      throw new TypeError("The callback must be a function.");
    }
    const callbacks = getCallbacks(this, `event:${eventName}`);
    if (callbacks.length === 0) {
      this.callMethod("addEventListener", eventName).catch(() => {
      });
    }
    storeCallback(this, `event:${eventName}`, callback);
  }
  /**
   * Remove an event listener for the specified event. Will remove all
   * listeners for that event if a `callback` isn’t passed, or only that
   * specific callback if it is passed.
   *
   * @param {string} eventName The name of the event.
   * @param {function} [callback] The specific callback to remove.
   * @return {void}
   */
  off(eventName, callback) {
    if (!eventName) {
      throw new TypeError("You must pass an event name.");
    }
    if (callback && typeof callback !== "function") {
      throw new TypeError("The callback must be a function.");
    }
    const lastCallback = removeCallback(this, `event:${eventName}`, callback);
    if (lastCallback) {
      this.callMethod("removeEventListener", eventName).catch((e) => {
      });
    }
  }
  /**
   * A promise to load a new video.
   *
   * @promise LoadVideoPromise
   * @fulfill {number} The video with this id or url successfully loaded.
   * @reject {TypeError} The id was not a number.
   */
  /**
   * Load a new video into this embed. The promise will be resolved if
   * the video is successfully loaded, or it will be rejected if it could
   * not be loaded.
   *
   * @param {number|string|object} options The id of the video, the url of the video, or an object with embed options.
   * @return {LoadVideoPromise}
   */
  loadVideo(options) {
    return this.callMethod("loadVideo", options);
  }
  /**
   * A promise to perform an action when the Player is ready.
   *
   * @todo document errors
   * @promise LoadVideoPromise
   * @fulfill {void}
   */
  /**
   * Trigger a function when the player iframe has initialized. You do not
   * need to wait for `ready` to trigger to begin adding event listeners
   * or calling other methods.
   *
   * @return {ReadyPromise}
   */
  ready() {
    const readyPromise = readyMap.get(this) || new npo_src((resolve, reject) => {
      reject(new Error("Unknown player. Probably unloaded."));
    });
    return npo_src.resolve(readyPromise);
  }
  /**
   * A promise to add a cue point to the player.
   *
   * @promise AddCuePointPromise
   * @fulfill {string} The id of the cue point to use for removeCuePoint.
   * @reject {RangeError} the time was less than 0 or greater than the
   *         video’s duration.
   * @reject {UnsupportedError} Cue points are not supported with the current
   *         player or browser.
   */
  /**
   * Add a cue point to the player.
   *
   * @param {number} time The time for the cue point.
   * @param {object} [data] Arbitrary data to be returned with the cue point.
   * @return {AddCuePointPromise}
   */
  addCuePoint(time) {
    let data = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    return this.callMethod("addCuePoint", {
      time,
      data
    });
  }
  /**
   * A promise to remove a cue point from the player.
   *
   * @promise AddCuePointPromise
   * @fulfill {string} The id of the cue point that was removed.
   * @reject {InvalidCuePoint} The cue point with the specified id was not
   *         found.
   * @reject {UnsupportedError} Cue points are not supported with the current
   *         player or browser.
   */
  /**
   * Remove a cue point from the video.
   *
   * @param {string} id The id of the cue point to remove.
   * @return {RemoveCuePointPromise}
   */
  removeCuePoint(id) {
    return this.callMethod("removeCuePoint", id);
  }
  /**
   * A representation of a text track on a video.
   *
   * @typedef {Object} VimeoTextTrack
   * @property {string} language The ISO language code.
   * @property {string} kind The kind of track it is (captions or subtitles).
   * @property {string} label The human‐readable label for the track.
   */
  /**
   * A promise to enable a text track.
   *
   * @promise EnableTextTrackPromise
   * @fulfill {VimeoTextTrack} The text track that was enabled.
   * @reject {InvalidTrackLanguageError} No track was available with the
   *         specified language.
   * @reject {InvalidTrackError} No track was available with the specified
   *         language and kind.
   */
  /**
   * Enable the text track with the specified language, and optionally the
   * specified kind (captions or subtitles).
   *
   * When set via the API, the track language will not change the viewer’s
   * stored preference.
   *
   * @param {string} language The two‐letter language code.
   * @param {string} [kind] The kind of track to enable (captions or subtitles).
   * @param {boolean} [showing] Whether to enable display of closed captions for enabled text track within the player.
   * @return {EnableTextTrackPromise}
   */
  enableTextTrack(language) {
    let kind = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    let showing = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
    if (!language) {
      throw new TypeError("You must pass a language.");
    }
    return this.callMethod("enableTextTrack", {
      language,
      kind,
      showing
    });
  }
  /**
   * A promise to disable the active text track.
   *
   * @promise DisableTextTrackPromise
   * @fulfill {void} The track was disabled.
   */
  /**
   * Disable the currently-active text track.
   *
   * @return {DisableTextTrackPromise}
   */
  disableTextTrack() {
    return this.callMethod("disableTextTrack");
  }
  /** @typedef {import('../types/formats.js').VimeoAudioTrack} VimeoAudioTrack */
  /** @typedef {import('../types/formats.js').AudioLanguage} AudioLanguage */
  /** @typedef {import('../types/formats.js').AudioKind} AudioKind */
  /**
   * A promise to enable an audio track.
   *
   * @promise SelectAudioTrackPromise
   * @fulfill {VimeoAudioTrack} The audio track that was enabled.
   * @reject {NoAudioTracksError} No audio exists for the video.
   * @reject {NoAlternateAudioTracksError} No alternate audio tracks exist for the video.
   * @reject {NoMatchingAudioTrackError} No track was available with the specified
   *         language and kind.
   */
  /**
   * Enable the audio track with the specified language, and optionally the
   * specified kind (main, translation, descriptions, or commentary).
   *
   * When set via the API, the track language will not change the viewer’s
   * stored preference.
   *
   * @param {AudioLanguage} language The two‐letter language code.
   * @param {AudioKind} [kind] The kind of track to enable (main, translation, descriptions, commentary).
   * @return {SelectAudioTrackPromise}
   */
  selectAudioTrack(language, kind) {
    if (!language) {
      throw new TypeError("You must pass a language.");
    }
    return this.callMethod("selectAudioTrack", {
      language,
      kind
    });
  }
  /**
   * Enable the main audio track for the video.
   *
   * @return {SelectAudioTrackPromise}
   */
  selectDefaultAudioTrack() {
    return this.callMethod("selectDefaultAudioTrack");
  }
  /**
   * A promise to pause the video.
   *
   * @promise PausePromise
   * @fulfill {void} The video was paused.
   */
  /**
   * Pause the video if it’s playing.
   *
   * @return {PausePromise}
   */
  pause() {
    return this.callMethod("pause");
  }
  /**
   * A promise to play the video.
   *
   * @promise PlayPromise
   * @fulfill {void} The video was played.
   */
  /**
   * Play the video if it’s paused. **Note:** on iOS and some other
   * mobile devices, you cannot programmatically trigger play. Once the
   * viewer has tapped on the play button in the player, however, you
   * will be able to use this function.
   *
   * @return {PlayPromise}
   */
  play() {
    return this.callMethod("play");
  }
  /**
   * Request that the player enters fullscreen.
   * @return {Promise}
   */
  requestFullscreen() {
    if (screenfull.isEnabled) {
      return screenfull.request(this.element);
    }
    return this.callMethod("requestFullscreen");
  }
  /**
   * Request that the player exits fullscreen.
   * @return {Promise}
   */
  exitFullscreen() {
    if (screenfull.isEnabled) {
      return screenfull.exit();
    }
    return this.callMethod("exitFullscreen");
  }
  /**
   * Returns true if the player is currently fullscreen.
   * @return {Promise}
   */
  getFullscreen() {
    if (screenfull.isEnabled) {
      return npo_src.resolve(screenfull.isFullscreen);
    }
    return this.get("fullscreen");
  }
  /**
   * Request that the player enters picture-in-picture.
   * @return {Promise}
   */
  requestPictureInPicture() {
    return this.callMethod("requestPictureInPicture");
  }
  /**
   * Request that the player exits picture-in-picture.
   * @return {Promise}
   */
  exitPictureInPicture() {
    return this.callMethod("exitPictureInPicture");
  }
  /**
   * Returns true if the player is currently picture-in-picture.
   * @return {Promise}
   */
  getPictureInPicture() {
    return this.get("pictureInPicture");
  }
  /**
   * A promise to prompt the viewer to initiate remote playback.
   *
   * @promise RemotePlaybackPromptPromise
   * @fulfill {void}
   * @reject {NotFoundError} No remote playback device is available.
   */
  /**
   * Request to prompt the user to initiate remote playback.
   *
   * @return {RemotePlaybackPromptPromise}
   */
  remotePlaybackPrompt() {
    return this.callMethod("remotePlaybackPrompt");
  }
  /**
   * A promise to unload the video.
   *
   * @promise UnloadPromise
   * @fulfill {void} The video was unloaded.
   */
  /**
   * Return the player to its initial state.
   *
   * @return {UnloadPromise}
   */
  unload() {
    return this.callMethod("unload");
  }
  /**
   * Cleanup the player and remove it from the DOM
   *
   * It won't be usable and a new one should be constructed
   *  in order to do any operations.
   *
   * @return {Promise}
   */
  destroy() {
    return new npo_src((resolve) => {
      readyMap.delete(this);
      playerMap.delete(this.element);
      if (this._originalElement) {
        playerMap.delete(this._originalElement);
        this._originalElement.removeAttribute("data-vimeo-initialized");
      }
      if (this.element && this.element.nodeName === "IFRAME" && this.element.parentNode) {
        if (this.element.parentNode.parentNode && this._originalElement && this._originalElement !== this.element.parentNode) {
          this.element.parentNode.parentNode.removeChild(this.element.parentNode);
        } else {
          this.element.parentNode.removeChild(this.element);
        }
      }
      if (this.element && this.element.nodeName === "DIV" && this.element.parentNode) {
        this.element.removeAttribute("data-vimeo-initialized");
        const iframe = this.element.querySelector("iframe");
        if (iframe && iframe.parentNode) {
          if (iframe.parentNode.parentNode && this._originalElement && this._originalElement !== iframe.parentNode) {
            iframe.parentNode.parentNode.removeChild(iframe.parentNode);
          } else {
            iframe.parentNode.removeChild(iframe);
          }
        }
      }
      this._window.removeEventListener("message", this._onMessage);
      if (screenfull.isEnabled) {
        screenfull.off("fullscreenchange", this.fullscreenchangeHandler);
      }
      resolve();
    });
  }
  /**
   * A promise to get the autopause behavior of the video.
   *
   * @promise GetAutopausePromise
   * @fulfill {boolean} Whether autopause is turned on or off.
   * @reject {UnsupportedError} Autopause is not supported with the current
   *         player or browser.
   */
  /**
   * Get the autopause behavior for this player.
   *
   * @return {GetAutopausePromise}
   */
  getAutopause() {
    return this.get("autopause");
  }
  /**
   * A promise to set the autopause behavior of the video.
   *
   * @promise SetAutopausePromise
   * @fulfill {boolean} Whether autopause is turned on or off.
   * @reject {UnsupportedError} Autopause is not supported with the current
   *         player or browser.
   */
  /**
   * Enable or disable the autopause behavior of this player.
   *
   * By default, when another video is played in the same browser, this
   * player will automatically pause. Unless you have a specific reason
   * for doing so, we recommend that you leave autopause set to the
   * default (`true`).
   *
   * @param {boolean} autopause
   * @return {SetAutopausePromise}
   */
  setAutopause(autopause) {
    return this.set("autopause", autopause);
  }
  /**
   * A promise to get the buffered property of the video.
   *
   * @promise GetBufferedPromise
   * @fulfill {Array} Buffered Timeranges converted to an Array.
   */
  /**
   * Get the buffered property of the video.
   *
   * @return {GetBufferedPromise}
   */
  getBuffered() {
    return this.get("buffered");
  }
  /**
   * @typedef {Object} CameraProperties
   * @prop {number} props.yaw - Number between 0 and 360.
   * @prop {number} props.pitch - Number between -90 and 90.
   * @prop {number} props.roll - Number between -180 and 180.
   * @prop {number} props.fov - The field of view in degrees.
   */
  /**
   * A promise to get the camera properties of the player.
   *
   * @promise GetCameraPromise
   * @fulfill {CameraProperties} The camera properties.
   */
  /**
   * For 360° videos get the camera properties for this player.
   *
   * @return {GetCameraPromise}
   */
  getCameraProps() {
    return this.get("cameraProps");
  }
  /**
   * A promise to set the camera properties of the player.
   *
   * @promise SetCameraPromise
   * @fulfill {Object} The camera was successfully set.
   * @reject {RangeError} The range was out of bounds.
   */
  /**
   * For 360° videos set the camera properties for this player.
   *
   * @param {CameraProperties} camera The camera properties
   * @return {SetCameraPromise}
   */
  setCameraProps(camera) {
    return this.set("cameraProps", camera);
  }
  /**
   * A representation of a chapter.
   *
   * @typedef {Object} VimeoChapter
   * @property {number} startTime The start time of the chapter.
   * @property {object} title The title of the chapter.
   * @property {number} index The place in the order of Chapters. Starts at 1.
   */
  /**
   * A promise to get chapters for the video.
   *
   * @promise GetChaptersPromise
   * @fulfill {VimeoChapter[]} The chapters for the video.
   */
  /**
   * Get an array of all the chapters for the video.
   *
   * @return {GetChaptersPromise}
   */
  getChapters() {
    return this.get("chapters");
  }
  /**
   * A promise to get the currently active chapter.
   *
   * @promise GetCurrentChaptersPromise
   * @fulfill {VimeoChapter|undefined} The current chapter for the video.
   */
  /**
   * Get the currently active chapter for the video.
   *
   * @return {GetCurrentChaptersPromise}
   */
  getCurrentChapter() {
    return this.get("currentChapter");
  }
  /**
   * A promise to get the accent color of the player.
   *
   * @promise GetColorPromise
   * @fulfill {string} The hex color of the player.
   */
  /**
   * Get the accent color for this player. Note this is deprecated in place of `getColorTwo`.
   *
   * @return {GetColorPromise}
   */
  getColor() {
    return this.get("color");
  }
  /**
   * A promise to get all colors for the player in an array.
   *
   * @promise GetColorsPromise
   * @fulfill {string[]} The hex colors of the player.
   */
  /**
   * Get all the colors for this player in an array: [colorOne, colorTwo, colorThree, colorFour]
   *
   * @return {GetColorPromise}
   */
  getColors() {
    return npo_src.all([this.get("colorOne"), this.get("colorTwo"), this.get("colorThree"), this.get("colorFour")]);
  }
  /**
   * A promise to set the accent color of the player.
   *
   * @promise SetColorPromise
   * @fulfill {string} The color was successfully set.
   * @reject {TypeError} The string was not a valid hex or rgb color.
   * @reject {ContrastError} The color was set, but the contrast is
   *         outside of the acceptable range.
   * @reject {EmbedSettingsError} The owner of the player has chosen to
   *         use a specific color.
   */
  /**
   * Set the accent color of this player to a hex or rgb string. Setting the
   * color may fail if the owner of the video has set their embed
   * preferences to force a specific color.
   * Note this is deprecated in place of `setColorTwo`.
   *
   * @param {string} color The hex or rgb color string to set.
   * @return {SetColorPromise}
   */
  setColor(color) {
    return this.set("color", color);
  }
  /**
   * A promise to set all colors for the player.
   *
   * @promise SetColorsPromise
   * @fulfill {string[]} The colors were successfully set.
   * @reject {TypeError} The string was not a valid hex or rgb color.
   * @reject {ContrastError} The color was set, but the contrast is
   *         outside of the acceptable range.
   * @reject {EmbedSettingsError} The owner of the player has chosen to
   *         use a specific color.
   */
  /**
   * Set the colors of this player to a hex or rgb string. Setting the
   * color may fail if the owner of the video has set their embed
   * preferences to force a specific color.
   * The colors should be passed in as an array: [colorOne, colorTwo, colorThree, colorFour].
   * If a color should not be set, the index in the array can be left as null.
   *
   * @param {string[]} colors Array of the hex or rgb color strings to set.
   * @return {SetColorsPromise}
   */
  setColors(colors) {
    if (!Array.isArray(colors)) {
      return new npo_src((resolve, reject) => reject(new TypeError("Argument must be an array.")));
    }
    const nullPromise = new npo_src((resolve) => resolve(null));
    const colorPromises = [colors[0] ? this.set("colorOne", colors[0]) : nullPromise, colors[1] ? this.set("colorTwo", colors[1]) : nullPromise, colors[2] ? this.set("colorThree", colors[2]) : nullPromise, colors[3] ? this.set("colorFour", colors[3]) : nullPromise];
    return npo_src.all(colorPromises);
  }
  /**
   * A representation of a cue point.
   *
   * @typedef {Object} VimeoCuePoint
   * @property {number} time The time of the cue point.
   * @property {object} data The data passed when adding the cue point.
   * @property {string} id The unique id for use with removeCuePoint.
   */
  /**
   * A promise to get the cue points of a video.
   *
   * @promise GetCuePointsPromise
   * @fulfill {VimeoCuePoint[]} The cue points added to the video.
   * @reject {UnsupportedError} Cue points are not supported with the current
   *         player or browser.
   */
  /**
   * Get an array of the cue points added to the video.
   *
   * @return {GetCuePointsPromise}
   */
  getCuePoints() {
    return this.get("cuePoints");
  }
  /**
   * A promise to get the current time of the video.
   *
   * @promise GetCurrentTimePromise
   * @fulfill {number} The current time in seconds.
   */
  /**
   * Get the current playback position in seconds.
   *
   * @return {GetCurrentTimePromise}
   */
  getCurrentTime() {
    return this.get("currentTime");
  }
  /**
   * A promise to set the current time of the video.
   *
   * @promise SetCurrentTimePromise
   * @fulfill {number} The actual current time that was set.
   * @reject {RangeError} the time was less than 0 or greater than the
   *         video’s duration.
   */
  /**
   * Set the current playback position in seconds. If the player was
   * paused, it will remain paused. Likewise, if the player was playing,
   * it will resume playing once the video has buffered.
   *
   * You can provide an accurate time and the player will attempt to seek
   * to as close to that time as possible. The exact time will be the
   * fulfilled value of the promise.
   *
   * @param {number} currentTime
   * @return {SetCurrentTimePromise}
   */
  setCurrentTime(currentTime) {
    return this.set("currentTime", currentTime);
  }
  /**
   * A promise to get the duration of the video.
   *
   * @promise GetDurationPromise
   * @fulfill {number} The duration in seconds.
   */
  /**
   * Get the duration of the video in seconds. It will be rounded to the
   * nearest second before playback begins, and to the nearest thousandth
   * of a second after playback begins.
   *
   * @return {GetDurationPromise}
   */
  getDuration() {
    return this.get("duration");
  }
  /**
   * A promise to get the ended state of the video.
   *
   * @promise GetEndedPromise
   * @fulfill {boolean} Whether or not the video has ended.
   */
  /**
   * Get the ended state of the video. The video has ended if
   * `currentTime === duration`.
   *
   * @return {GetEndedPromise}
   */
  getEnded() {
    return this.get("ended");
  }
  /**
   * A promise to get the loop state of the player.
   *
   * @promise GetLoopPromise
   * @fulfill {boolean} Whether or not the player is set to loop.
   */
  /**
   * Get the loop state of the player.
   *
   * @return {GetLoopPromise}
   */
  getLoop() {
    return this.get("loop");
  }
  /**
   * A promise to set the loop state of the player.
   *
   * @promise SetLoopPromise
   * @fulfill {boolean} The loop state that was set.
   */
  /**
   * Set the loop state of the player. When set to `true`, the player
   * will start over immediately once playback ends.
   *
   * @param {boolean} loop
   * @return {SetLoopPromise}
   */
  setLoop(loop) {
    return this.set("loop", loop);
  }
  /**
   * A promise to set the muted state of the player.
   *
   * @promise SetMutedPromise
   * @fulfill {boolean} The muted state that was set.
   */
  /**
   * Set the muted state of the player. When set to `true`, the player
   * volume will be muted.
   *
   * @param {boolean} muted
   * @return {SetMutedPromise}
   */
  setMuted(muted) {
    return this.set("muted", muted);
  }
  /**
   * A promise to get the muted state of the player.
   *
   * @promise GetMutedPromise
   * @fulfill {boolean} Whether or not the player is muted.
   */
  /**
   * Get the muted state of the player.
   *
   * @return {GetMutedPromise}
   */
  getMuted() {
    return this.get("muted");
  }
  /**
   * A promise to get the paused state of the player.
   *
   * @promise GetLoopPromise
   * @fulfill {boolean} Whether or not the video is paused.
   */
  /**
   * Get the paused state of the player.
   *
   * @return {GetLoopPromise}
   */
  getPaused() {
    return this.get("paused");
  }
  /**
   * A promise to get the playback rate of the player.
   *
   * @promise GetPlaybackRatePromise
   * @fulfill {number} The playback rate of the player on a scale from 0 to 2.
   */
  /**
   * Get the playback rate of the player on a scale from `0` to `2`.
   *
   * @return {GetPlaybackRatePromise}
   */
  getPlaybackRate() {
    return this.get("playbackRate");
  }
  /**
   * A promise to set the playbackrate of the player.
   *
   * @promise SetPlaybackRatePromise
   * @fulfill {number} The playback rate was set.
   * @reject {RangeError} The playback rate was less than 0 or greater than 2.
   */
  /**
   * Set the playback rate of the player on a scale from `0` to `2`. When set
   * via the API, the playback rate will not be synchronized to other
   * players or stored as the viewer's preference.
   *
   * @param {number} playbackRate
   * @return {SetPlaybackRatePromise}
   */
  setPlaybackRate(playbackRate) {
    return this.set("playbackRate", playbackRate);
  }
  /**
   * A promise to get the played property of the video.
   *
   * @promise GetPlayedPromise
   * @fulfill {Array} Played Timeranges converted to an Array.
   */
  /**
   * Get the played property of the video.
   *
   * @return {GetPlayedPromise}
   */
  getPlayed() {
    return this.get("played");
  }
  /**
   * A promise to get the qualities available of the current video.
   *
   * @promise GetQualitiesPromise
   * @fulfill {Array} The qualities of the video.
   */
  /**
   * Get the qualities of the current video.
   *
   * @return {GetQualitiesPromise}
   */
  getQualities() {
    return this.get("qualities");
  }
  /**
   * A promise to get the current set quality of the video.
   *
   * @promise GetQualityPromise
   * @fulfill {string} The current set quality.
   */
  /**
   * Get the current set quality of the video.
   *
   * @return {GetQualityPromise}
   */
  getQuality() {
    return this.get("quality");
  }
  /**
   * A promise to set the video quality.
   *
   * @promise SetQualityPromise
   * @fulfill {number} The quality was set.
   * @reject {RangeError} The quality is not available.
   */
  /**
   * Set a video quality.
   *
   * @param {string} quality
   * @return {SetQualityPromise}
   */
  setQuality(quality) {
    return this.set("quality", quality);
  }
  /**
   * A promise to get the remote playback availability.
   *
   * @promise RemotePlaybackAvailabilityPromise
   * @fulfill {boolean} Whether remote playback is available.
   */
  /**
   * Get the availability of remote playback.
   *
   * @return {RemotePlaybackAvailabilityPromise}
   */
  getRemotePlaybackAvailability() {
    return this.get("remotePlaybackAvailability");
  }
  /**
   * A promise to get the current remote playback state.
   *
   * @promise RemotePlaybackStatePromise
   * @fulfill {string} The state of the remote playback: connecting, connected, or disconnected.
   */
  /**
   * Get the current remote playback state.
   *
   * @return {RemotePlaybackStatePromise}
   */
  getRemotePlaybackState() {
    return this.get("remotePlaybackState");
  }
  /**
   * A promise to get the seekable property of the video.
   *
   * @promise GetSeekablePromise
   * @fulfill {Array} Seekable Timeranges converted to an Array.
   */
  /**
   * Get the seekable property of the video.
   *
   * @return {GetSeekablePromise}
   */
  getSeekable() {
    return this.get("seekable");
  }
  /**
   * A promise to get the seeking property of the player.
   *
   * @promise GetSeekingPromise
   * @fulfill {boolean} Whether or not the player is currently seeking.
   */
  /**
   * Get if the player is currently seeking.
   *
   * @return {GetSeekingPromise}
   */
  getSeeking() {
    return this.get("seeking");
  }
  /**
   * A promise to get the text tracks of a video.
   *
   * @promise GetTextTracksPromise
   * @fulfill {VimeoTextTrack[]} The text tracks associated with the video.
   */
  /**
   * Get an array of the text tracks that exist for the video.
   *
   * @return {GetTextTracksPromise}
   */
  getTextTracks() {
    return this.get("textTracks");
  }
  /**
   * A promise to get the audio tracks of a video.
   *
   * @promise GetAudioTracksPromise
   * @fulfill {VimeoAudioTrack[]} The audio tracks associated with the video.
   */
  /**
   * Get an array of the audio tracks that exist for the video.
   *
   * @return {GetAudioTracksPromise}
   */
  getAudioTracks() {
    return this.get("audioTracks");
  }
  /**
   * A promise to get the enabled audio track of a video.
   *
   * @promise GetAudioTrackPromise
   * @fulfill {VimeoAudioTrack} The enabled audio track.
   */
  /**
   * Get the enabled audio track for a video.
   *
   * @return {GetAudioTrackPromise}
   */
  getEnabledAudioTrack() {
    return this.get("enabledAudioTrack");
  }
  /**
   * Get the main audio track for a video.
   *
   * @return {GetAudioTrackPromise}
   */
  getDefaultAudioTrack() {
    return this.get("defaultAudioTrack");
  }
  /**
   * A promise to get the embed code for the video.
   *
   * @promise GetVideoEmbedCodePromise
   * @fulfill {string} The `<iframe>` embed code for the video.
   */
  /**
   * Get the `<iframe>` embed code for the video.
   *
   * @return {GetVideoEmbedCodePromise}
   */
  getVideoEmbedCode() {
    return this.get("videoEmbedCode");
  }
  /**
   * A promise to get the id of the video.
   *
   * @promise GetVideoIdPromise
   * @fulfill {number} The id of the video.
   */
  /**
   * Get the id of the video.
   *
   * @return {GetVideoIdPromise}
   */
  getVideoId() {
    return this.get("videoId");
  }
  /**
   * A promise to get the title of the video.
   *
   * @promise GetVideoTitlePromise
   * @fulfill {number} The title of the video.
   */
  /**
   * Get the title of the video.
   *
   * @return {GetVideoTitlePromise}
   */
  getVideoTitle() {
    return this.get("videoTitle");
  }
  /**
   * A promise to get the native width of the video.
   *
   * @promise GetVideoWidthPromise
   * @fulfill {number} The native width of the video.
   */
  /**
   * Get the native width of the currently‐playing video. The width of
   * the highest‐resolution available will be used before playback begins.
   *
   * @return {GetVideoWidthPromise}
   */
  getVideoWidth() {
    return this.get("videoWidth");
  }
  /**
   * A promise to get the native height of the video.
   *
   * @promise GetVideoHeightPromise
   * @fulfill {number} The native height of the video.
   */
  /**
   * Get the native height of the currently‐playing video. The height of
   * the highest‐resolution available will be used before playback begins.
   *
   * @return {GetVideoHeightPromise}
   */
  getVideoHeight() {
    return this.get("videoHeight");
  }
  /**
   * A promise to get the vimeo.com url for the video.
   *
   * @promise GetVideoUrlPromise
   * @fulfill {number} The vimeo.com url for the video.
   * @reject {PrivacyError} The url isn’t available because of the video’s privacy setting.
   */
  /**
   * Get the vimeo.com url for the video.
   *
   * @return {GetVideoUrlPromise}
   */
  getVideoUrl() {
    return this.get("videoUrl");
  }
  /**
   * A promise to get the volume level of the player.
   *
   * @promise GetVolumePromise
   * @fulfill {number} The volume level of the player on a scale from 0 to 1.
   */
  /**
   * Get the current volume level of the player on a scale from `0` to `1`.
   *
   * Most mobile devices do not support an independent volume from the
   * system volume. In those cases, this method will always return `1`.
   *
   * @return {GetVolumePromise}
   */
  getVolume() {
    return this.get("volume");
  }
  /**
   * A promise to set the volume level of the player.
   *
   * @promise SetVolumePromise
   * @fulfill {number} The volume was set.
   * @reject {RangeError} The volume was less than 0 or greater than 1.
   */
  /**
   * Set the volume of the player on a scale from `0` to `1`. When set
   * via the API, the volume level will not be synchronized to other
   * players or stored as the viewer’s preference.
   *
   * Most mobile devices do not support setting the volume. An error will
   * *not* be triggered in that situation.
   *
   * @param {number} volume
   * @return {SetVolumePromise}
   */
  setVolume(volume) {
    return this.set("volume", volume);
  }
  /** @typedef {import('timing-object').ITimingObject} TimingObject */
  /** @typedef {import('./lib/timing-src-connector.types').TimingSrcConnectorOptions} TimingSrcConnectorOptions */
  /** @typedef {import('./lib/timing-src-connector').TimingSrcConnector} TimingSrcConnector */
  /**
   * Connects a TimingObject to the video player (https://webtiming.github.io/timingobject/)
   *
   * @param {TimingObject} timingObject
   * @param {TimingSrcConnectorOptions} options
   *
   * @return {Promise<TimingSrcConnector>}
   */
  async setTimingSrc(timingObject, options) {
    if (!timingObject) {
      throw new TypeError("A Timing Object must be provided.");
    }
    await this.ready();
    const connector = new TimingSrcConnector(this, timingObject, options);
    postMessage(this, "notifyTimingObjectConnect");
    connector.addEventListener("disconnect", () => postMessage(this, "notifyTimingObjectDisconnect"));
    return connector;
  }
}
if (!isServerRuntime) {
  screenfull = initializeScreenfull();
  initializeEmbeds();
  resizeEmbeds();
  initAppendVideoMetadata();
  checkUrlTimeParam();
  updateDRMEmbeds();
}
const Filters = {
  treeSolveGuideID: "treeSolveGuide",
  fragmentBoxDiscussion: "#treeSolveFragments .nt-fr-fragment-box .nt-fr-fragment-discussion"
};
const onFragmentsRenderFinished = () => {
  const fragmentBoxDiscussions = document.querySelectorAll(Filters.fragmentBoxDiscussion);
  let fragmentBox;
  let dataDiscussion;
  for (let i = 0; i < fragmentBoxDiscussions.length; i++) {
    fragmentBox = fragmentBoxDiscussions[i];
    dataDiscussion = fragmentBox.dataset.discussion;
    if (dataDiscussion != null) {
      fragmentBox.innerHTML = dataDiscussion;
      delete fragmentBox.dataset.discussion;
    }
  }
};
const setUpVimeoPlayer = () => {
  const vimeoPlayerDivs = document.querySelectorAll(".nt-tp-vimeo-player");
  if (!vimeoPlayerDivs) {
    return;
  }
  let vimeoPlayerDiv;
  for (let i = 0; i < vimeoPlayerDivs.length; i++) {
    vimeoPlayerDiv = vimeoPlayerDivs[i];
    var options = {
      autopause: false,
      autoplay: false,
      width: 640,
      loop: false,
      responsive: true
    };
    new Player(
      vimeoPlayerDiv,
      options
    );
  }
};
const onRenderFinished = () => {
  onFragmentsRenderFinished();
  setUpVimeoPlayer();
};
const initEvents = {
  onRenderFinished: () => {
    onRenderFinished();
  },
  registerGlobalEvents: () => {
    window.onresize = () => {
      initEvents.onRenderFinished();
    };
  }
};
const initActions = {
  setNotRaw: (state) => {
    var _a, _b;
    if (!((_b = (_a = window == null ? void 0 : window.TreeSolve) == null ? void 0 : _a.screen) == null ? void 0 : _b.isAutofocusFirstRun)) {
      window.TreeSolve.screen.autofocus = false;
    } else {
      window.TreeSolve.screen.isAutofocusFirstRun = false;
    }
    return state;
  }
};
var ParseType = /* @__PURE__ */ ((ParseType2) => {
  ParseType2["None"] = "none";
  ParseType2["Json"] = "json";
  ParseType2["Text"] = "text";
  return ParseType2;
})(ParseType || {});
class RenderFragmentUI {
  constructor() {
    __publicField(this, "fragmentOptionsExpanded", false);
    __publicField(this, "discussionLoaded", false);
    __publicField(this, "ancillaryExpanded", false);
    __publicField(this, "doNotPaint", false);
    __publicField(this, "sectionIndex", 0);
  }
}
class RenderFragment {
  constructor(id, parentFragmentID, section, segmentIndex) {
    __publicField(this, "id");
    __publicField(this, "iKey", null);
    __publicField(this, "iExitKey", null);
    __publicField(this, "exitKey", null);
    __publicField(this, "autoMergeExit", false);
    __publicField(this, "podKey", null);
    __publicField(this, "podText", null);
    __publicField(this, "topLevelMapKey", "");
    __publicField(this, "mapKeyChain", "");
    __publicField(this, "guideID", "");
    __publicField(this, "parentFragmentID");
    __publicField(this, "value", "");
    __publicField(this, "selected", null);
    __publicField(this, "isLeaf", false);
    __publicField(this, "options", []);
    __publicField(this, "variable", []);
    __publicField(this, "classes", []);
    __publicField(this, "option", "");
    __publicField(this, "isAncillary", false);
    __publicField(this, "order", 0);
    __publicField(this, "link", null);
    __publicField(this, "pod", null);
    __publicField(this, "section");
    __publicField(this, "segmentIndex");
    __publicField(this, "ui", new RenderFragmentUI());
    this.id = id;
    this.section = section;
    this.parentFragmentID = parentFragmentID;
    this.segmentIndex = segmentIndex;
  }
}
var OutlineType = /* @__PURE__ */ ((OutlineType2) => {
  OutlineType2["None"] = "none";
  OutlineType2["Node"] = "node";
  OutlineType2["Exit"] = "exit";
  OutlineType2["Link"] = "link";
  return OutlineType2;
})(OutlineType || {});
class RenderOutlineNode {
  constructor() {
    __publicField(this, "i", "");
    // id
    __publicField(this, "c", null);
    // index from outline chart array
    __publicField(this, "d", null);
    // index from outline chart array
    __publicField(this, "x", null);
    // iExit id
    __publicField(this, "_x", null);
    // exit id
    __publicField(this, "o", []);
    // options
    __publicField(this, "parent", null);
    __publicField(this, "type", OutlineType.Node);
    __publicField(this, "isChart", true);
    __publicField(this, "isRoot", false);
    __publicField(this, "isLast", false);
  }
}
class RenderOutline {
  constructor(path, baseURI) {
    __publicField(this, "path");
    __publicField(this, "baseURI");
    __publicField(this, "loaded", false);
    __publicField(this, "v", "");
    __publicField(this, "r", new RenderOutlineNode());
    __publicField(this, "c", []);
    __publicField(this, "e");
    __publicField(this, "mv");
    this.path = path;
    this.baseURI = baseURI;
  }
}
class RenderOutlineChart {
  constructor() {
    __publicField(this, "i", "");
    __publicField(this, "b", "");
    __publicField(this, "p", "");
  }
}
class DisplayGuide {
  constructor(linkID, guide, rootID) {
    __publicField(this, "linkID");
    __publicField(this, "guide");
    __publicField(this, "outline", null);
    __publicField(this, "root");
    __publicField(this, "current", null);
    this.linkID = linkID;
    this.guide = guide;
    this.root = new RenderFragment(
      rootID,
      "guideRoot",
      this,
      0
    );
  }
}
class RenderGuide {
  constructor(id) {
    __publicField(this, "id");
    __publicField(this, "title", "");
    __publicField(this, "description", "");
    __publicField(this, "path", "");
    __publicField(this, "fragmentFolderUrl", null);
    this.id = id;
  }
}
var ScrollHopType = /* @__PURE__ */ ((ScrollHopType2) => {
  ScrollHopType2["None"] = "none";
  ScrollHopType2["Up"] = "up";
  ScrollHopType2["Down"] = "down";
  return ScrollHopType2;
})(ScrollHopType || {});
class Screen {
  constructor() {
    __publicField(this, "autofocus", false);
    __publicField(this, "isAutofocusFirstRun", true);
    __publicField(this, "hideBanner", false);
    __publicField(this, "scrollToTop", false);
    __publicField(this, "scrollToElement", null);
    __publicField(this, "scrollHop", ScrollHopType.None);
    __publicField(this, "lastScrollY", 0);
    __publicField(this, "ua", null);
  }
}
class TreeSolve {
  constructor() {
    __publicField(this, "renderingComment", null);
    __publicField(this, "screen", new Screen());
  }
}
const gFileConstants = {
  fragmentsFolderSuffix: "_frags",
  fragmentFileExtension: ".html",
  guideOutlineFilename: "outline.tsoln",
  guideRenderCommentTag: "tsGuideRenderComment ",
  fragmentRenderCommentTag: "tsFragmentRenderComment "
};
const parseGuide = (rawGuide) => {
  const guide = new RenderGuide(rawGuide.id);
  guide.title = rawGuide.title ?? "";
  guide.description = rawGuide.description ?? "";
  guide.path = rawGuide.path ?? null;
  guide.fragmentFolderUrl = gRenderCode.getGuideFragmentFolderUrl(rawGuide.fragmentFolderPath);
  return guide;
};
const parseRenderingComment = (state, raw) => {
  if (!raw) {
    return raw;
  }
  const guide = parseGuide(raw.guide);
  const displayGuide = new DisplayGuide(
    gStateCode.getFreshKeyInt(state),
    guide,
    raw.fragment.id
  );
  gFragmentCode.parseAndLoadGuideRootFragment(
    state,
    raw.fragment,
    displayGuide.root
  );
  state.renderState.displayGuide = displayGuide;
  state.renderState.currentSection = displayGuide;
  gFragmentCode.cacheSectionRoot(
    state,
    state.renderState.displayGuide
  );
};
const gRenderCode = {
  getGuideFragmentFolderUrl: (folderPath) => {
    const url = new URL(
      folderPath,
      document.baseURI
    );
    return url.toString();
  },
  getFragmentFolderUrl: (chart, fragment) => {
    var _a;
    const path = chart.p;
    if (path.startsWith("https://") === true || path.startsWith("http://") === true) {
      return path;
    }
    let baseURI = (_a = fragment.section.outline) == null ? void 0 : _a.baseURI;
    if (!baseURI) {
      baseURI = document.baseURI;
    }
    const url = new URL(
      path,
      baseURI
    );
    return url.toString();
  },
  registerGuideComment: () => {
    const treeSolveGuide = document.getElementById(Filters.treeSolveGuideID);
    if (treeSolveGuide && treeSolveGuide.hasChildNodes() === true) {
      let childNode;
      for (let i = 0; i < treeSolveGuide.childNodes.length; i++) {
        childNode = treeSolveGuide.childNodes[i];
        if (childNode.nodeType === Node.COMMENT_NODE) {
          if (!window.TreeSolve) {
            window.TreeSolve = new TreeSolve();
          }
          window.TreeSolve.renderingComment = childNode.textContent;
          childNode.remove();
          break;
        } else if (childNode.nodeType !== Node.TEXT_NODE) {
          break;
        }
      }
    }
  },
  parseRenderingComment: (state) => {
    var _a;
    if (!((_a = window.TreeSolve) == null ? void 0 : _a.renderingComment)) {
      return;
    }
    try {
      let guideRenderComment = window.TreeSolve.renderingComment;
      guideRenderComment = guideRenderComment.trim();
      if (!guideRenderComment.startsWith(gFileConstants.guideRenderCommentTag)) {
        return;
      }
      guideRenderComment = guideRenderComment.substring(gFileConstants.guideRenderCommentTag.length);
      const raw = JSON.parse(guideRenderComment);
      parseRenderingComment(
        state,
        raw
      );
    } catch (e) {
      console.error(e);
      return;
    }
  }
};
class DisplayChart {
  constructor(linkID, chart) {
    __publicField(this, "linkID");
    __publicField(this, "chart");
    __publicField(this, "outline", null);
    __publicField(this, "root", null);
    __publicField(this, "parent", null);
    __publicField(this, "current", null);
    this.linkID = linkID;
    this.chart = chart;
  }
}
class ChainSegment {
  constructor(index, start, end) {
    __publicField(this, "index");
    __publicField(this, "text");
    __publicField(this, "outlineNodes", []);
    __publicField(this, "outlineNodesLoaded", false);
    __publicField(this, "start");
    __publicField(this, "end");
    __publicField(this, "segmentInSection", null);
    __publicField(this, "segmentSection", null);
    __publicField(this, "segmentOutSection", null);
    this.index = index;
    this.start = start;
    this.end = end;
    this.text = `${start.text}${(end == null ? void 0 : end.text) ?? ""}`;
  }
}
class SegmentNode {
  constructor(text, key, type, isRoot, isLast) {
    __publicField(this, "text");
    __publicField(this, "key");
    __publicField(this, "type");
    __publicField(this, "isRoot");
    __publicField(this, "isLast");
    this.text = text;
    this.key = key;
    this.type = type;
    this.isRoot = isRoot;
    this.isLast = isLast;
  }
}
const checkForLinkErrors = (segment, linkSegment, fragment) => {
  if (segment.end.key !== linkSegment.start.key || segment.end.type !== linkSegment.start.type) {
    throw new Error("Link segment start does not match segment end");
  }
  if (!linkSegment.segmentInSection) {
    throw new Error("Segment in section was null - link");
  }
  if (!linkSegment.segmentSection) {
    throw new Error("Segment section was null - link");
  }
  if (!linkSegment.segmentOutSection) {
    throw new Error("Segment out section was null - link");
  }
  if (gUtilities.isNullOrWhiteSpace(fragment.iKey) === true) {
    throw new Error("Mismatch between fragment and outline node - link iKey");
  } else if (linkSegment.start.type !== OutlineType.Link) {
    throw new Error("Mismatch between fragment and outline node - link");
  }
};
const getIdentifierCharacter = (identifierChar) => {
  let startOutlineType = OutlineType.Node;
  let isLast = false;
  if (identifierChar === "~") {
    startOutlineType = OutlineType.Link;
  } else if (identifierChar === "_") {
    startOutlineType = OutlineType.Exit;
  } else if (identifierChar === "-") {
    startOutlineType = OutlineType.Node;
    isLast = true;
  } else {
    throw new Error(`Unexpected query string outline node identifier: ${identifierChar}`);
  }
  return {
    type: startOutlineType,
    isLast
  };
};
const getKeyEndIndex = (remainingChain) => {
  const startKeyEndIndex = gUtilities.indexOfAny(
    remainingChain,
    ["~", "-", "_"],
    1
  );
  if (startKeyEndIndex === -1) {
    return {
      index: remainingChain.length,
      isLast: true
    };
  }
  return {
    index: startKeyEndIndex,
    isLast: null
  };
};
const getOutlineType = (remainingChain) => {
  const identifierChar = remainingChain.substring(0, 1);
  const outlineType = getIdentifierCharacter(identifierChar);
  return outlineType;
};
const getNextSegmentNode = (remainingChain) => {
  let segmentNode = null;
  let endChain = "";
  if (!gUtilities.isNullOrWhiteSpace(remainingChain)) {
    const outlineType = getOutlineType(remainingChain);
    const keyEnd = getKeyEndIndex(remainingChain);
    const key = remainingChain.substring(
      1,
      keyEnd.index
    );
    segmentNode = new SegmentNode(
      remainingChain.substring(0, keyEnd.index),
      key,
      outlineType.type,
      false,
      outlineType.isLast
    );
    if (keyEnd.isLast === true) {
      segmentNode.isLast = true;
    }
    endChain = remainingChain.substring(keyEnd.index);
  }
  return {
    segmentNode,
    endChain
  };
};
const buildSegment = (segments, remainingChain) => {
  const segmentStart = getNextSegmentNode(remainingChain);
  if (!segmentStart.segmentNode) {
    throw new Error("Segment start node was null");
  }
  remainingChain = segmentStart.endChain;
  const segmentEnd = getNextSegmentNode(remainingChain);
  if (!segmentEnd.segmentNode) {
    throw new Error("Segment end node was null");
  }
  const segment = new ChainSegment(
    segments.length,
    segmentStart.segmentNode,
    segmentEnd.segmentNode
  );
  segments.push(segment);
  return {
    remainingChain,
    segment
  };
};
const buildRootSegment = (segments, remainingChain) => {
  const rootSegmentStart = new SegmentNode(
    "guideRoot",
    "",
    OutlineType.Node,
    true,
    false
  );
  const rootSegmentEnd = getNextSegmentNode(remainingChain);
  if (!rootSegmentEnd.segmentNode) {
    throw new Error("Segment start node was null");
  }
  const rootSegment = new ChainSegment(
    segments.length,
    rootSegmentStart,
    rootSegmentEnd.segmentNode
  );
  segments.push(rootSegment);
  return {
    remainingChain,
    segment: rootSegment
  };
};
const loadSegment = (state, segment, startOutlineNode = null) => {
  gSegmentCode.loadSegmentOutlineNodes(
    state,
    segment,
    startOutlineNode
  );
  const nextSegmentOutlineNodes = segment.outlineNodes;
  if (nextSegmentOutlineNodes.length > 0) {
    const firstNode = nextSegmentOutlineNodes[nextSegmentOutlineNodes.length - 1];
    if (firstNode.i === segment.start.key) {
      firstNode.type = segment.start.type;
    }
    const lastNode = nextSegmentOutlineNodes[0];
    if (lastNode.i === segment.end.key) {
      lastNode.type = segment.end.type;
      lastNode.isLast = segment.end.isLast;
    }
  }
  gFragmentCode.loadNextChainFragment(
    state,
    segment
  );
};
const gSegmentCode = {
  setNextSegmentSection: (state, segmentIndex, link) => {
    if (!segmentIndex || !state.renderState.isChainLoad) {
      return;
    }
    const segment = state.renderState.segments[segmentIndex - 1];
    if (!segment) {
      throw new Error("Segment is null");
    }
    segment.segmentOutSection = link;
    const nextSegment = state.renderState.segments[segmentIndex];
    if (nextSegment) {
      nextSegment.segmentInSection = segment.segmentSection;
      nextSegment.segmentSection = link;
      nextSegment.segmentOutSection = link;
      loadSegment(
        state,
        nextSegment
      );
    }
  },
  loadLinkSegment: (state, linkSegmentIndex, linkFragment, link) => {
    var _a, _b;
    const segments = state.renderState.segments;
    if (linkSegmentIndex < 1) {
      throw new Error("Index < 0");
    }
    const currentSegment = segments[linkSegmentIndex - 1];
    currentSegment.segmentOutSection = link;
    if (linkSegmentIndex >= segments.length) {
      throw new Error("Next index >= array length");
    }
    const nextSegment = segments[linkSegmentIndex];
    if (!nextSegment) {
      throw new Error("Next link segment was null");
    }
    if (nextSegment.outlineNodesLoaded === true) {
      return nextSegment;
    }
    nextSegment.outlineNodesLoaded = true;
    nextSegment.segmentInSection = currentSegment.segmentSection;
    nextSegment.segmentSection = link;
    nextSegment.segmentOutSection = link;
    if (!nextSegment.segmentInSection) {
      nextSegment.segmentInSection = currentSegment.segmentSection;
    }
    if (!nextSegment.segmentSection) {
      nextSegment.segmentSection = currentSegment.segmentOutSection;
    }
    if (!nextSegment.segmentOutSection) {
      nextSegment.segmentOutSection = currentSegment.segmentOutSection;
    }
    if (gUtilities.isNullOrWhiteSpace((_a = nextSegment.segmentSection.outline) == null ? void 0 : _a.r.i) === true) {
      throw new Error("Next segment section root key was null");
    }
    let startOutlineNode = gStateCode.getCached_outlineNode(
      state,
      nextSegment.segmentSection.linkID,
      (_b = nextSegment.segmentSection.outline) == null ? void 0 : _b.r.i
    );
    loadSegment(
      state,
      nextSegment,
      startOutlineNode
    );
    checkForLinkErrors(
      currentSegment,
      nextSegment,
      linkFragment
    );
    return nextSegment;
  },
  loadExitSegment: (state, segmentIndex, plugID) => {
    const segments = state.renderState.segments;
    const currentSegment = segments[segmentIndex];
    const exitSegmentIndex = segmentIndex + 1;
    if (exitSegmentIndex >= segments.length) {
      throw new Error("Next index >= array length");
    }
    const exitSegment = segments[exitSegmentIndex];
    if (!exitSegment) {
      throw new Error("Exit link segment was null");
    }
    if (exitSegment.outlineNodesLoaded === true) {
      return exitSegment;
    }
    const segmentSection = currentSegment.segmentSection;
    const link = segmentSection.parent;
    if (!link) {
      throw new Error("Link fragmnt was null");
    }
    currentSegment.segmentOutSection = link.section;
    exitSegment.outlineNodesLoaded = true;
    exitSegment.segmentInSection = currentSegment.segmentSection;
    exitSegment.segmentSection = currentSegment.segmentOutSection;
    exitSegment.segmentOutSection = currentSegment.segmentOutSection;
    if (!exitSegment.segmentInSection) {
      throw new Error("Segment in section was null");
    }
    const exitOutlineNode = gStateCode.getCached_outlineNode(
      state,
      exitSegment.segmentInSection.linkID,
      exitSegment.start.key
    );
    if (!exitOutlineNode) {
      throw new Error("ExitOutlineNode was null");
    }
    if (gUtilities.isNullOrWhiteSpace(exitOutlineNode._x) === true) {
      throw new Error("Exit key was null");
    }
    const plugOutlineNode = gStateCode.getCached_outlineNode(
      state,
      exitSegment.segmentSection.linkID,
      plugID
    );
    if (!plugOutlineNode) {
      throw new Error("PlugOutlineNode was null");
    }
    if (exitOutlineNode._x !== plugOutlineNode.x) {
      throw new Error("PlugOutlineNode does not match exitOutlineNode");
    }
    loadSegment(
      state,
      exitSegment,
      plugOutlineNode
    );
    return exitSegment;
  },
  loadNextSegment: (state, segment) => {
    if (segment.outlineNodesLoaded === true) {
      return;
    }
    segment.outlineNodesLoaded = true;
    const nextSegmentIndex = segment.index + 1;
    const segments = state.renderState.segments;
    if (nextSegmentIndex >= segments.length) {
      throw new Error("Next index >= array length");
    }
    const nextSegment = segments[nextSegmentIndex];
    if (nextSegment) {
      if (!nextSegment.segmentInSection) {
        nextSegment.segmentInSection = segment.segmentSection;
      }
      if (!nextSegment.segmentSection) {
        nextSegment.segmentSection = segment.segmentOutSection;
      }
      if (!nextSegment.segmentOutSection) {
        nextSegment.segmentOutSection = segment.segmentOutSection;
      }
      loadSegment(
        state,
        nextSegment
      );
    }
  },
  getNextSegmentOutlineNode: (state, segment) => {
    let outlineNode = segment.outlineNodes.pop() ?? null;
    if ((outlineNode == null ? void 0 : outlineNode.isLast) === true) {
      return outlineNode;
    }
    if (segment.outlineNodes.length === 0) {
      const nextSegment = state.renderState.segments[segment.index + 1];
      if (!nextSegment) {
        throw new Error("NextSegment was null");
      }
      if (!nextSegment.segmentInSection) {
        nextSegment.segmentInSection = segment.segmentSection;
      }
      if (!nextSegment.segmentSection) {
        nextSegment.segmentSection = segment.segmentOutSection;
      }
      if (!nextSegment.segmentOutSection) {
        nextSegment.segmentOutSection = segment.segmentOutSection;
      }
    }
    return outlineNode;
  },
  parseSegments: (state, queryString) => {
    if (queryString.startsWith("?") === true) {
      queryString = queryString.substring(1);
    }
    if (gUtilities.isNullOrWhiteSpace(queryString) === true) {
      return;
    }
    const segments = [];
    let remainingChain = queryString;
    let result;
    result = buildRootSegment(
      segments,
      remainingChain
    );
    while (!gUtilities.isNullOrWhiteSpace(remainingChain)) {
      result = buildSegment(
        segments,
        remainingChain
      );
      if (result.segment.end.isLast === true) {
        break;
      }
      remainingChain = result.remainingChain;
    }
    state.renderState.segments = segments;
  },
  loadSegmentOutlineNodes: (state, segment, startOutlineNode = null) => {
    if (!segment.segmentInSection) {
      throw new Error("Segment in section was null");
    }
    if (!segment.segmentSection) {
      throw new Error("Segment section was null");
    }
    let segmentOutlineNodes = [];
    if (!startOutlineNode) {
      startOutlineNode = gStateCode.getCached_outlineNode(
        state,
        segment.segmentInSection.linkID,
        segment.start.key
      );
      if (!startOutlineNode) {
        throw new Error("Start outline node was null");
      }
      startOutlineNode.type = segment.start.type;
    }
    let endOutlineNode = gStateCode.getCached_outlineNode(
      state,
      segment.segmentSection.linkID,
      segment.end.key
    );
    if (!endOutlineNode) {
      throw new Error("End outline node was null");
    }
    endOutlineNode.type = segment.end.type;
    let parent = endOutlineNode;
    let firstLoop = true;
    while (parent) {
      segmentOutlineNodes.push(parent);
      if (!firstLoop && (parent == null ? void 0 : parent.isChart) === true && (parent == null ? void 0 : parent.isRoot) === true) {
        break;
      }
      if ((parent == null ? void 0 : parent.i) === startOutlineNode.i) {
        break;
      }
      firstLoop = false;
      parent = parent.parent;
    }
    segment.outlineNodes = segmentOutlineNodes;
  }
};
const gOutlineActions = {
  loadGuideOutlineProperties: (state, outlineResponse, fragmentFolderUrl) => {
    gOutlineCode.loadGuideOutlineProperties(
      state,
      outlineResponse,
      fragmentFolderUrl
    );
    return gStateCode.cloneState(state);
  },
  loadSegmentChartOutlineProperties: (state, outlineResponse, outline, chart, parent, segmentIndex) => {
    gOutlineCode.loadSegmentChartOutlineProperties(
      state,
      outlineResponse,
      outline,
      chart,
      parent,
      segmentIndex
    );
    return gStateCode.cloneState(state);
  },
  loadChartOutlineProperties: (state, outlineResponse, outline, chart, parent) => {
    gOutlineCode.loadChartOutlineProperties(
      state,
      outlineResponse,
      outline,
      chart,
      parent
    );
    return gStateCode.cloneState(state);
  },
  loadPodOutlineProperties: (state, outlineResponse, outline, chart, option) => {
    gOutlineCode.loadPodOutlineProperties(
      state,
      outlineResponse,
      outline,
      chart,
      option
    );
    return gStateCode.cloneState(state);
  },
  loadGuideOutlineAndSegments: (state, outlineResponse, path) => {
    const section = state.renderState.displayGuide;
    if (!section) {
      return state;
    }
    const rootSegment = state.renderState.segments[0];
    if (!rootSegment) {
      return state;
    }
    const fragmentFolderUrl = section.guide.fragmentFolderUrl;
    if (gUtilities.isNullOrWhiteSpace(fragmentFolderUrl) === true) {
      return state;
    }
    rootSegment.segmentInSection = section;
    rootSegment.segmentSection = section;
    rootSegment.segmentOutSection = section;
    gOutlineCode.loadGuideOutlineProperties(
      state,
      outlineResponse,
      path
    );
    gSegmentCode.loadSegmentOutlineNodes(
      state,
      rootSegment
    );
    const firstNode = gSegmentCode.getNextSegmentOutlineNode(
      state,
      rootSegment
    );
    if (firstNode) {
      const url = `${fragmentFolderUrl}/${firstNode.i}${gFileConstants.fragmentFileExtension}`;
      const loadDelegate = (state2, outlineResponse2) => {
        return gFragmentActions.loadChainFragment(
          state2,
          outlineResponse2,
          rootSegment,
          firstNode
        );
      };
      gStateCode.AddReLoadDataEffectImmediate(
        state,
        `loadChainFragment`,
        ParseType.Json,
        url,
        loadDelegate
      );
    } else {
      gSegmentCode.loadNextSegment(
        state,
        rootSegment
      );
    }
    return gStateCode.cloneState(state);
  }
};
const cacheNodeForNewLink = (state, outlineNode, linkID) => {
  gStateCode.cache_outlineNode(
    state,
    linkID,
    outlineNode
  );
  for (const option of outlineNode.o) {
    cacheNodeForNewLink(
      state,
      option,
      linkID
    );
  }
};
const cacheNodeForNewPod = (state, outlineNode, linkID) => {
  gStateCode.cache_outlineNode(
    state,
    linkID,
    outlineNode
  );
  for (const option of outlineNode.o) {
    cacheNodeForNewPod(
      state,
      option,
      linkID
    );
  }
};
const loadNode = (state, rawNode, linkID, parent = null) => {
  const node = new RenderOutlineNode();
  node.i = rawNode.i;
  node.c = rawNode.c ?? null;
  node.d = rawNode.d ?? null;
  node._x = rawNode._x ?? null;
  node.x = rawNode.x ?? null;
  node.parent = parent;
  node.type = OutlineType.Node;
  gStateCode.cache_outlineNode(
    state,
    linkID,
    node
  );
  if (node.c) {
    node.type = OutlineType.Link;
  }
  if (rawNode.o && Array.isArray(rawNode.o) === true && rawNode.o.length > 0) {
    let o;
    for (const option of rawNode.o) {
      o = loadNode(
        state,
        option,
        linkID,
        node
      );
      node.o.push(o);
    }
  }
  return node;
};
const loadCharts = (outline, rawOutlineCharts) => {
  outline.c = [];
  let c;
  for (const chart of rawOutlineCharts) {
    c = new RenderOutlineChart();
    c.i = chart.i;
    c.b = chart.b;
    c.p = chart.p;
    outline.c.push(c);
  }
};
const gOutlineCode = {
  registerOutlineUrlDownload: (state, url) => {
    if (state.renderState.outlineUrls[url] === true) {
      return true;
    }
    state.renderState.outlineUrls[url] = true;
    return false;
  },
  loadGuideOutlineProperties: (state, outlineResponse, fragmentFolderUrl) => {
    if (!state.renderState.displayGuide) {
      throw new Error("DisplayGuide was null.");
    }
    const guide = state.renderState.displayGuide;
    const rawOutline = outlineResponse.jsonData;
    const guideOutline = gOutlineCode.getGuideOutline(
      state,
      fragmentFolderUrl
    );
    gOutlineCode.loadOutlineProperties(
      state,
      rawOutline,
      guideOutline,
      guide.linkID
    );
    guide.outline = guideOutline;
    guideOutline.r.isChart = false;
    if (state.renderState.isChainLoad === true) {
      const segments = state.renderState.segments;
      if (segments.length > 0) {
        const rootSegment = segments[0];
        rootSegment.start.key = guideOutline.r.i;
      }
    }
    gFragmentCode.cacheSectionRoot(
      state,
      guide
    );
    if (guideOutline.r.c != null) {
      const outlineChart = gOutlineCode.getOutlineChart(
        guideOutline,
        guideOutline.r.c
      );
      const guideRoot = guide.root;
      if (!guideRoot) {
        throw new Error("The current fragment was null");
      }
      gOutlineCode.getOutlineFromChart_subscription(
        state,
        outlineChart,
        guideRoot
      );
    } else if (guide.root) {
      gFragmentCode.expandOptionPods(
        state,
        guide.root
      );
      gFragmentCode.autoExpandSingleBlankOption(
        state,
        guide.root
      );
    }
    return guideOutline;
  },
  getOutlineChart: (outline, index) => {
    if (outline.c.length > index) {
      return outline.c[index];
    }
    return null;
  },
  buildDisplayChartFromRawOutline: (state, chart, rawOutline, outline, parent) => {
    const link = new DisplayChart(
      gStateCode.getFreshKeyInt(state),
      chart
    );
    gOutlineCode.loadOutlineProperties(
      state,
      rawOutline,
      outline,
      link.linkID
    );
    link.outline = outline;
    link.parent = parent;
    parent.link = link;
    return link;
  },
  buildPodDisplayChartFromRawOutline: (state, chart, rawOutline, outline, parent) => {
    const pod = new DisplayChart(
      gStateCode.getFreshKeyInt(state),
      chart
    );
    gOutlineCode.loadOutlineProperties(
      state,
      rawOutline,
      outline,
      pod.linkID
    );
    pod.outline = outline;
    pod.parent = parent;
    parent.pod = pod;
    return pod;
  },
  buildDisplayChartFromOutlineForNewLink: (state, chart, outline, parent) => {
    const link = new DisplayChart(
      gStateCode.getFreshKeyInt(state),
      chart
    );
    gOutlineCode.loadOutlinePropertiesForNewLink(
      state,
      outline,
      link.linkID
    );
    link.outline = outline;
    link.parent = parent;
    parent.link = link;
    return link;
  },
  buildDisplayChartFromOutlineForNewPod: (state, chart, outline, parent) => {
    const pod = new DisplayChart(
      gStateCode.getFreshKeyInt(state),
      chart
    );
    gOutlineCode.loadOutlinePropertiesForNewPod(
      state,
      outline,
      pod.linkID
    );
    pod.outline = outline;
    pod.parent = parent;
    parent.pod = pod;
    return pod;
  },
  loadSegmentChartOutlineProperties: (state, outlineResponse, outline, chart, parent, segmentIndex) => {
    var _a;
    if (parent.link) {
      throw new Error(`Link already loaded, rootID: ${(_a = parent.link.root) == null ? void 0 : _a.id}`);
    }
    const rawOutline = outlineResponse.jsonData;
    const link = gOutlineCode.buildDisplayChartFromRawOutline(
      state,
      chart,
      rawOutline,
      outline,
      parent
    );
    gSegmentCode.loadLinkSegment(
      state,
      segmentIndex,
      parent,
      link
    );
    gOutlineCode.setChartAsCurrent(
      state,
      link
    );
    gFragmentCode.cacheSectionRoot(
      state,
      link
    );
  },
  loadChartOutlineProperties: (state, outlineResponse, outline, chart, parent) => {
    var _a;
    if (parent.link) {
      throw new Error(`Link already loaded, rootID: ${(_a = parent.link.root) == null ? void 0 : _a.id}`);
    }
    const rawOutline = outlineResponse.jsonData;
    const link = gOutlineCode.buildDisplayChartFromRawOutline(
      state,
      chart,
      rawOutline,
      outline,
      parent
    );
    gFragmentCode.cacheSectionRoot(
      state,
      link
    );
    gOutlineCode.setChartAsCurrent(
      state,
      link
    );
    gOutlineCode.postGetChartOutlineRoot_subscription(
      state,
      link
    );
  },
  loadPodOutlineProperties: (state, outlineResponse, outline, chart, option) => {
    var _a;
    if (option.pod) {
      throw new Error(`Link already loaded, rootID: ${(_a = option.pod.root) == null ? void 0 : _a.id}`);
    }
    const rawOutline = outlineResponse.jsonData;
    const pod = gOutlineCode.buildPodDisplayChartFromRawOutline(
      state,
      chart,
      rawOutline,
      outline,
      option
    );
    gFragmentCode.cacheSectionRoot(
      state,
      pod
    );
    gOutlineCode.postGetPodOutlineRoot_subscription(
      state,
      pod
    );
  },
  postGetChartOutlineRoot_subscription: (state, section) => {
    if (section.root) {
      return;
    }
    const outline = section.outline;
    if (!outline) {
      throw new Error("Section outline was null");
    }
    const rootFragmenID = outline.r.i;
    const path = outline.path;
    const url = `${path}/${rootFragmenID}${gFileConstants.fragmentFileExtension}`;
    const loadAction = (state2, response) => {
      return gFragmentActions.loadRootFragmentAndSetSelected(
        state2,
        response,
        section
      );
    };
    gStateCode.AddReLoadDataEffectImmediate(
      state,
      `loadChartOutlineRoot`,
      ParseType.Text,
      url,
      loadAction
    );
  },
  postGetPodOutlineRoot_subscription: (state, section) => {
    if (section.root) {
      return;
    }
    const outline = section.outline;
    if (!outline) {
      throw new Error("Section outline was null");
    }
    const rootFragmenID = outline.r.i;
    const path = outline.path;
    const url = `${path}/${rootFragmenID}${gFileConstants.fragmentFileExtension}`;
    const loadAction = (state2, response) => {
      return gFragmentActions.loadPodRootFragment(
        state2,
        response,
        section
      );
    };
    gStateCode.AddReLoadDataEffectImmediate(
      state,
      `loadChartOutlineRoot`,
      ParseType.Text,
      url,
      loadAction
    );
  },
  setChartAsCurrent: (state, displaySection) => {
    state.renderState.currentSection = displaySection;
  },
  getGuideOutline: (state, fragmentFolderUrl) => {
    let outline = state.renderState.outlines[fragmentFolderUrl];
    if (outline) {
      return outline;
    }
    outline = new RenderOutline(
      fragmentFolderUrl,
      document.baseURI
    );
    state.renderState.outlines[fragmentFolderUrl] = outline;
    return outline;
  },
  getOutline: (state, fragmentFolderUrl, chart, linkFragment) => {
    var _a;
    let outline = state.renderState.outlines[fragmentFolderUrl];
    if (outline) {
      return outline;
    }
    let baseURI = chart.b;
    if (gUtilities.isNullOrWhiteSpace(baseURI) === true) {
      baseURI = ((_a = linkFragment.section.outline) == null ? void 0 : _a.baseURI) ?? null;
    }
    if (!baseURI) {
      baseURI = document.baseURI;
    }
    outline = new RenderOutline(
      fragmentFolderUrl,
      baseURI
    );
    state.renderState.outlines[fragmentFolderUrl] = outline;
    return outline;
  },
  // getFragmentLinkChartOutline: (
  //     state: IState,
  //     fragment: IRenderFragment
  // ): void => {
  //     const outline = fragment.section.outline;
  //     if (!outline) {
  //         return;
  //     }
  //     const outlineNode = gStateCode.getCached_outlineNode(
  //         state,
  //         fragment.section.linkID,
  //         fragment.id
  //     );
  //     if (outlineNode?.c == null) {
  //         return;
  //     }
  //     const outlineChart = gOutlineCode.getOutlineChart(
  //         outline,
  //         outlineNode?.c
  //     );
  //     gOutlineCode.getOutlineFromChart_subscription(
  //         state,
  //         outlineChart,
  //         fragment
  //     );
  // },
  getLinkOutline_subscripion: (state, option) => {
    const outline = option.section.outline;
    if (!outline) {
      return;
    }
    const outlineNode = gStateCode.getCached_outlineNode(
      state,
      option.section.linkID,
      option.id
    );
    if ((outlineNode == null ? void 0 : outlineNode.c) == null || state.renderState.isChainLoad === true) {
      return;
    }
    const outlineChart = gOutlineCode.getOutlineChart(
      outline,
      outlineNode == null ? void 0 : outlineNode.c
    );
    gOutlineCode.getOutlineFromChart_subscription(
      state,
      outlineChart,
      option
    );
  },
  getPodOutline_subscripion: (state, option, section) => {
    if (gUtilities.isNullOrWhiteSpace(option.podKey) === true) {
      return;
    }
    const outline = section.outline;
    if (!outline) {
      return;
    }
    const outlineNode = gStateCode.getCached_outlineNode(
      state,
      option.section.linkID,
      option.id
    );
    if ((outlineNode == null ? void 0 : outlineNode.d) == null) {
      return;
    }
    const outlineChart = gOutlineCode.getOutlineChart(
      outline,
      outlineNode == null ? void 0 : outlineNode.d
    );
    gOutlineCode.getOutlineFromPod_subscription(
      state,
      outlineChart,
      option
    );
  },
  getSegmentOutline_subscription: (state, chart, linkFragment, segmentIndex) => {
    var _a, _b;
    if (!chart) {
      throw new Error("OutlineChart was null");
    }
    if ((_a = linkFragment.link) == null ? void 0 : _a.root) {
      console.log(`Link root already loaded: ${(_b = linkFragment.link.root) == null ? void 0 : _b.id}`);
      return;
    }
    let nextSegmentIndex = segmentIndex;
    if (nextSegmentIndex != null) {
      nextSegmentIndex++;
    }
    const fragmentFolderUrl = gRenderCode.getFragmentFolderUrl(
      chart,
      linkFragment
    );
    if (!gUtilities.isNullOrWhiteSpace(fragmentFolderUrl)) {
      const outline = gOutlineCode.getOutline(
        state,
        fragmentFolderUrl,
        chart,
        linkFragment
      );
      if (outline.loaded === true) {
        if (!linkFragment.link) {
          const link = gOutlineCode.buildDisplayChartFromOutlineForNewLink(
            state,
            chart,
            outline,
            linkFragment
          );
          gSegmentCode.setNextSegmentSection(
            state,
            nextSegmentIndex,
            link
          );
        }
        gOutlineCode.setChartAsCurrent(
          state,
          linkFragment.link
        );
      } else {
        const url = `${fragmentFolderUrl}/${gFileConstants.guideOutlineFilename}`;
        const loadRequested = gOutlineCode.registerOutlineUrlDownload(
          state,
          url
        );
        if (loadRequested === true) {
          return;
        }
        let name;
        if (state.renderState.isChainLoad === true) {
          name = `loadChainChartOutlineFile`;
        } else {
          name = `loadChartOutlineFile`;
        }
        const loadDelegate = (state2, outlineResponse) => {
          return gOutlineActions.loadSegmentChartOutlineProperties(
            state2,
            outlineResponse,
            outline,
            chart,
            linkFragment,
            nextSegmentIndex
          );
        };
        gStateCode.AddReLoadDataEffectImmediate(
          state,
          name,
          ParseType.Json,
          url,
          loadDelegate
        );
      }
    }
  },
  getOutlineFromChart_subscription: (state, chart, linkFragment) => {
    var _a, _b;
    if (!chart) {
      throw new Error("OutlineChart was null");
    }
    if ((_a = linkFragment.link) == null ? void 0 : _a.root) {
      console.log(`Link root already loaded: ${(_b = linkFragment.link.root) == null ? void 0 : _b.id}`);
      return;
    }
    let fragmentFolderUrl;
    const outlineChartPath = chart.p;
    if (!chart.i) {
      fragmentFolderUrl = outlineChartPath;
    } else {
      fragmentFolderUrl = gRenderCode.getFragmentFolderUrl(
        chart,
        linkFragment
      );
    }
    if (!gUtilities.isNullOrWhiteSpace(fragmentFolderUrl)) {
      const outline = gOutlineCode.getOutline(
        state,
        fragmentFolderUrl,
        chart,
        linkFragment
      );
      if (outline.loaded === true) {
        if (!linkFragment.link) {
          gOutlineCode.buildDisplayChartFromOutlineForNewLink(
            state,
            chart,
            outline,
            linkFragment
          );
        }
        gOutlineCode.setChartAsCurrent(
          state,
          linkFragment.link
        );
        gOutlineCode.postGetChartOutlineRoot_subscription(
          state,
          linkFragment.link
        );
      } else {
        const url = `${fragmentFolderUrl}/${gFileConstants.guideOutlineFilename}`;
        const loadRequested = gOutlineCode.registerOutlineUrlDownload(
          state,
          url
        );
        if (loadRequested === true) {
          return;
        }
        let name;
        if (state.renderState.isChainLoad === true) {
          name = `loadChainChartOutlineFile`;
        } else {
          name = `loadChartOutlineFile`;
        }
        const loadDelegate = (state2, outlineResponse) => {
          return gOutlineActions.loadChartOutlineProperties(
            state2,
            outlineResponse,
            outline,
            chart,
            linkFragment
          );
        };
        gStateCode.AddReLoadDataEffectImmediate(
          state,
          name,
          ParseType.Json,
          url,
          loadDelegate
        );
      }
    }
  },
  getOutlineFromPod_subscription: (state, chart, optionFragment) => {
    var _a, _b;
    if (!chart) {
      throw new Error("OutlineChart was null");
    }
    if ((_a = optionFragment.link) == null ? void 0 : _a.root) {
      console.log(`Link root already loaded: ${(_b = optionFragment.link.root) == null ? void 0 : _b.id}`);
      return;
    }
    const fragmentFolderUrl = gRenderCode.getFragmentFolderUrl(
      chart,
      optionFragment
    );
    if (gUtilities.isNullOrWhiteSpace(fragmentFolderUrl)) {
      return;
    }
    const outline = gOutlineCode.getOutline(
      state,
      fragmentFolderUrl,
      chart,
      optionFragment
    );
    if (outline.loaded === true) {
      if (!optionFragment.pod) {
        gOutlineCode.buildDisplayChartFromOutlineForNewPod(
          state,
          chart,
          outline,
          optionFragment
        );
      }
      gOutlineCode.postGetPodOutlineRoot_subscription(
        state,
        optionFragment.pod
      );
    } else {
      const url = `${fragmentFolderUrl}/${gFileConstants.guideOutlineFilename}`;
      const loadRequested = gOutlineCode.registerOutlineUrlDownload(
        state,
        url
      );
      if (loadRequested === true) {
        return;
      }
      let name;
      if (state.renderState.isChainLoad === true) {
        name = `loadChainChartOutlineFile`;
      } else {
        name = `loadChartOutlineFile`;
      }
      const loadDelegate = (state2, outlineResponse) => {
        return gOutlineActions.loadPodOutlineProperties(
          state2,
          outlineResponse,
          outline,
          chart,
          optionFragment
        );
      };
      gStateCode.AddReLoadDataEffectImmediate(
        state,
        name,
        ParseType.Json,
        url,
        loadDelegate
      );
    }
  },
  loadOutlineProperties: (state, rawOutline, outline, linkID) => {
    outline.v = rawOutline.v;
    if (rawOutline.c && Array.isArray(rawOutline.c) === true && rawOutline.c.length > 0) {
      loadCharts(
        outline,
        rawOutline.c
      );
    }
    if (rawOutline.e) {
      outline.e = rawOutline.e;
    }
    outline.r = loadNode(
      state,
      rawOutline.r,
      linkID
    );
    outline.loaded = true;
    outline.r.isRoot = true;
    outline.mv = rawOutline.mv;
    return outline;
  },
  loadOutlinePropertiesForNewLink: (state, outline, linkID) => {
    cacheNodeForNewLink(
      state,
      outline.r,
      linkID
    );
  },
  loadOutlinePropertiesForNewPod: (state, outline, linkID) => {
    cacheNodeForNewPod(
      state,
      outline.r,
      linkID
    );
  }
};
const getFragment = (state, fragmentID, fragmentPath, _action, loadAction) => {
  if (!state) {
    return;
  }
  const callID = gUtilities.generateGuid();
  const url = `${fragmentPath}`;
  return gAuthenticatedHttp({
    url,
    parseType: "text",
    options: {
      method: "GET"
      // headers: headers,
    },
    response: "text",
    action: loadAction,
    error: (state2, errorDetails) => {
      console.log(`{
                "message": "Error getting fragment from the server, path: ${fragmentPath}, id: ${fragmentID}",
                "url": ${url},
                "error Details": ${JSON.stringify(errorDetails)},
                "stack": ${JSON.stringify(errorDetails.stack)},
                "method": ${getFragment},
                "callID: ${callID}
            }`);
      alert(`{
                "message": "Error getting fragment from the server, path: ${fragmentPath}, id: ${fragmentID}",
                "url": ${url},
                "error Details": ${JSON.stringify(errorDetails)},
                "stack": ${JSON.stringify(errorDetails.stack)},
                "method": ${getFragment.name},
                "callID: ${callID}
            }`);
      return gStateCode.cloneState(state2);
    }
  });
};
const gFragmentEffects = {
  getFragment: (state, option, fragmentPath) => {
    const loadAction = (state2, response) => {
      const newState = gFragmentActions.loadFragment(
        state2,
        response,
        option
      );
      newState.renderState.refreshUrl = true;
      return newState;
    };
    return getFragment(
      state,
      option.id,
      fragmentPath,
      ActionType.GetFragment,
      loadAction
    );
  }
};
const getFragmentFile = (state, option) => {
  var _a, _b;
  state.loading = true;
  window.TreeSolve.screen.hideBanner = true;
  const fragmentPath = `${(_b = (_a = option.section) == null ? void 0 : _a.outline) == null ? void 0 : _b.path}/${option.id}${gFileConstants.fragmentFileExtension}`;
  return [
    state,
    gFragmentEffects.getFragment(
      state,
      option,
      fragmentPath
    )
  ];
};
const processChainFragmentType = (state, segment, outlineNode, fragment) => {
  if (fragment) {
    if (outlineNode.i !== fragment.id) {
      throw new Error("Mismatch between fragment id and outline fragment id");
    }
    if (outlineNode.type === OutlineType.Link) {
      processLink(
        state,
        segment,
        outlineNode,
        fragment
      );
    } else if (outlineNode.type === OutlineType.Exit) {
      processExit(
        state,
        segment,
        outlineNode,
        fragment
      );
    } else if (outlineNode.isChart === true && outlineNode.isRoot === true) {
      processChartRoot(
        state,
        segment,
        fragment
      );
    } else if (outlineNode.isLast === true) {
      processLast(
        state,
        segment,
        outlineNode,
        fragment
      );
    } else if (outlineNode.type === OutlineType.Node) {
      processNode(
        state,
        segment,
        outlineNode,
        fragment
      );
    } else {
      throw new Error("Unexpected fragment type.");
    }
  }
  return gStateCode.cloneState(state);
};
const checkForLastFragmentErrors = (segment, outlineNode, fragment) => {
  if (!segment.segmentSection) {
    throw new Error("Segment section was null - last");
  }
  if (outlineNode.i !== fragment.id) {
    throw new Error("Mismatch between outline node id and fragment id");
  }
};
const checkForNodeErrors = (segment, outlineNode, fragment) => {
  if (!segment.segmentSection) {
    throw new Error("Segment section was null - node");
  }
  if (!gUtilities.isNullOrWhiteSpace(fragment.iKey)) {
    throw new Error("Mismatch between fragment and outline node - link");
  } else if (!gUtilities.isNullOrWhiteSpace(fragment.iExitKey)) {
    throw new Error("Mismatch between fragment and outline node - exit");
  }
  if (outlineNode.i !== fragment.id) {
    throw new Error("Mismatch between outline node id and fragment id");
  }
};
const checkForChartRootErrors = (segment, fragment) => {
  if (!segment.segmentSection) {
    throw new Error("Segment section was null - root");
  }
  if (!gUtilities.isNullOrWhiteSpace(fragment.iKey)) {
    throw new Error("Mismatch between fragment and outline root - link");
  } else if (!gUtilities.isNullOrWhiteSpace(fragment.iExitKey)) {
    throw new Error("Mismatch between fragment and outline root - exit");
  }
};
const checkForExitErrors = (segment, outlineNode, fragment) => {
  if (!segment.segmentSection) {
    throw new Error("Segment section was null - exit");
  }
  if (!segment.segmentOutSection) {
    throw new Error("Segment out section was null - exit");
  }
  if (gUtilities.isNullOrWhiteSpace(fragment.exitKey) === true) {
    throw new Error("Mismatch between fragment and outline - exit");
  } else if (segment.end.type !== OutlineType.Exit) {
    throw new Error("Mismatch between fragment and outline node - exit");
  }
  if (outlineNode.i !== fragment.id) {
    throw new Error("Mismatch between outline node id and fragment id");
  }
};
const processChartRoot = (state, segment, fragment) => {
  checkForChartRootErrors(
    segment,
    fragment
  );
  gFragmentCode.loadNextChainFragment(
    state,
    segment
  );
  setLinksRoot(
    state,
    segment,
    fragment
  );
};
const setLinksRoot = (state, segment, fragment) => {
  const inSection = segment.segmentInSection;
  if (!inSection) {
    throw new Error("Segment in section was null - chart root");
  }
  const section = segment.segmentSection;
  if (!section) {
    throw new Error("Segment section was null - chart root");
  }
  let parent = gStateCode.getCached_chainFragment(
    state,
    inSection.linkID,
    segment.start.key
  );
  if (parent == null ? void 0 : parent.link) {
    if (parent.id === fragment.id) {
      throw new Error("Parent and Fragment are the same");
    }
    parent.link.root = fragment;
  } else {
    throw new Error("ParentFragment was null");
  }
  section.current = fragment;
};
const processNode = (state, segment, outlineNode, fragment) => {
  checkForNodeErrors(
    segment,
    outlineNode,
    fragment
  );
  gFragmentCode.loadNextChainFragment(
    state,
    segment
  );
  processFragment(
    state,
    fragment
  );
};
const processLast = (state, segment, outlineNode, fragment) => {
  var _a;
  checkForLastFragmentErrors(
    segment,
    outlineNode,
    fragment
  );
  processFragment(
    state,
    fragment
  );
  fragment.link = null;
  fragment.selected = null;
  if (((_a = fragment.options) == null ? void 0 : _a.length) > 0) {
    gFragmentCode.resetFragmentUis(state);
    fragment.ui.fragmentOptionsExpanded = true;
    state.renderState.ui.optionsExpanded = true;
  }
};
const processLink = (state, segment, outlineNode, fragment) => {
  if (outlineNode.i !== fragment.id) {
    throw new Error("Mismatch between outline node id and fragment id");
  }
  const outline = fragment.section.outline;
  if (!outline) {
    return;
  }
  if ((outlineNode == null ? void 0 : outlineNode.c) == null) {
    throw new Error();
  }
  if (outlineNode.isRoot === true && outlineNode.isChart === true) {
    setLinksRoot(
      state,
      segment,
      fragment
    );
  }
  const outlineChart = gOutlineCode.getOutlineChart(
    outline,
    outlineNode == null ? void 0 : outlineNode.c
  );
  gOutlineCode.getSegmentOutline_subscription(
    state,
    outlineChart,
    fragment,
    segment.index
  );
};
const processExit = (state, segment, outlineNode, exitFragment) => {
  checkForExitErrors(
    segment,
    outlineNode,
    exitFragment
  );
  const section = exitFragment.section;
  const sectionParent = section.parent;
  if (!sectionParent) {
    throw new Error("IDisplayChart parent is null");
  }
  const iExitKey = exitFragment.exitKey;
  for (const option of sectionParent.options) {
    if (option.iExitKey === iExitKey) {
      gSegmentCode.loadExitSegment(
        state,
        segment.index,
        option.id
      );
      gFragmentCode.setCurrent(
        state,
        exitFragment
      );
    }
  }
};
const loadFragment = (state, response, option) => {
  const parentFragmentID = option.parentFragmentID;
  if (gUtilities.isNullOrWhiteSpace(parentFragmentID) === true) {
    throw new Error("Parent fragment ID is null");
  }
  const renderFragment = gFragmentCode.parseAndLoadFragment(
    state,
    response.textData,
    parentFragmentID,
    option.id,
    option.section
  );
  state.loading = false;
  return renderFragment;
};
const loadPodFragment = (state, response, option) => {
  const parentFragmentID = option.parentFragmentID;
  if (gUtilities.isNullOrWhiteSpace(parentFragmentID) === true) {
    throw new Error("Parent fragment ID is null");
  }
  const renderFragment = gFragmentCode.parseAndLoadPodFragment(
    state,
    response.textData,
    parentFragmentID,
    option.id,
    option.section
  );
  state.loading = false;
  return renderFragment;
};
const processFragment = (state, fragment) => {
  if (!state) {
    return;
  }
  let expandedOption = null;
  let parentFragment = gStateCode.getCached_chainFragment(
    state,
    fragment.section.linkID,
    fragment.parentFragmentID
  );
  if (!parentFragment) {
    return;
  }
  for (const option of parentFragment.options) {
    if (option.id === fragment.id) {
      expandedOption = option;
      break;
    }
  }
  if (expandedOption) {
    expandedOption.ui.fragmentOptionsExpanded = true;
    gFragmentCode.showOptionNode(
      state,
      parentFragment,
      expandedOption
    );
  }
};
const gFragmentActions = {
  showAncillaryNode: (state, ancillary) => {
    return getFragmentFile(
      state,
      ancillary
    );
  },
  showOptionNode: (state, parentFragment, option) => {
    gFragmentCode.clearParentSectionSelected(parentFragment.section);
    gFragmentCode.clearOrphanedSteps(parentFragment);
    gFragmentCode.prepareToShowOptionNode(
      state,
      option
    );
    return getFragmentFile(
      state,
      option
    );
  },
  loadFragment: (state, response, option) => {
    if (!state || gUtilities.isNullOrWhiteSpace(option.id)) {
      return state;
    }
    loadFragment(
      state,
      response,
      option
    );
    return gStateCode.cloneState(state);
  },
  loadFragmentAndSetSelected: (state, response, option, optionText = null) => {
    if (!state) {
      return state;
    }
    const node = loadFragment(
      state,
      response,
      option
    );
    if (node) {
      gFragmentCode.setCurrent(
        state,
        node
      );
      if (optionText) {
        node.option = optionText;
      }
    }
    if (!state.renderState.isChainLoad) {
      state.renderState.refreshUrl = true;
    }
    return gStateCode.cloneState(state);
  },
  loadPodFragment: (state, response, option, optionText = null) => {
    if (!state) {
      return state;
    }
    const node = loadPodFragment(
      state,
      response,
      option
    );
    if (node) {
      gFragmentCode.setPodCurrent(
        state,
        node
      );
      if (optionText) {
        node.option = optionText;
      }
    }
    if (!state.renderState.isChainLoad) {
      state.renderState.refreshUrl = true;
    }
    return gStateCode.cloneState(state);
  },
  loadRootFragmentAndSetSelected: (state, response, section) => {
    var _a;
    if (!state) {
      return state;
    }
    const outlineNodeID = (_a = section.outline) == null ? void 0 : _a.r.i;
    if (!outlineNodeID) {
      return state;
    }
    const renderFragment = gFragmentCode.parseAndLoadFragment(
      state,
      response.textData,
      "root",
      outlineNodeID,
      section
    );
    state.loading = false;
    if (renderFragment) {
      renderFragment.section.root = renderFragment;
      renderFragment.section.current = renderFragment;
    }
    state.renderState.refreshUrl = true;
    return gStateCode.cloneState(state);
  },
  loadPodRootFragment: (state, response, section) => {
    var _a;
    if (!state) {
      return state;
    }
    const outlineNodeID = (_a = section.outline) == null ? void 0 : _a.r.i;
    if (!outlineNodeID) {
      return state;
    }
    const renderFragment = gFragmentCode.parseAndLoadPodFragment(
      state,
      response.textData,
      "root",
      outlineNodeID,
      section
    );
    state.loading = false;
    if (renderFragment) {
      renderFragment.section.root = renderFragment;
      renderFragment.section.current = renderFragment;
    }
    state.renderState.refreshUrl = true;
    return gStateCode.cloneState(state);
  },
  loadChainFragment: (state, response, segment, outlineNode) => {
    var _a;
    if (!state) {
      return state;
    }
    const segmentSection = segment.segmentSection;
    if (!segmentSection) {
      throw new Error("Segment section is null");
    }
    let parentFragmentID = (_a = outlineNode.parent) == null ? void 0 : _a.i;
    if (outlineNode.isRoot === true) {
      if (!outlineNode.isChart) {
        parentFragmentID = "guideRoot";
      } else {
        parentFragmentID = "root";
      }
    } else if (gUtilities.isNullOrWhiteSpace(parentFragmentID) === true) {
      throw new Error("Parent fragment ID is null");
    }
    const result = gFragmentCode.parseAndLoadFragmentBase(
      state,
      response.textData,
      parentFragmentID,
      outlineNode.i,
      segmentSection,
      segment.index
    );
    const fragment = result.fragment;
    state.loading = false;
    if (fragment) {
      let parentFragment = gStateCode.getCached_chainFragment(
        state,
        segmentSection.linkID,
        parentFragmentID
      );
      segmentSection.current = fragment;
      if (parentFragment) {
        if (parentFragment.id === fragment.id) {
          throw new Error("ParentFragment and Fragment are the same");
        }
        parentFragment.selected = fragment;
        fragment.ui.sectionIndex = parentFragment.ui.sectionIndex + 1;
      }
    }
    return processChainFragmentType(
      state,
      segment,
      outlineNode,
      fragment
    );
  }
};
const gHookRegistryCode = {
  executeStepHook: (state, step) => {
    if (!window.HookRegistry) {
      return;
    }
    window.HookRegistry.executeStepHook(
      state,
      step
    );
  }
};
const getVariableValue = (section, variableValues, variableName) => {
  var _a, _b;
  let value = variableValues[variableName];
  if (value) {
    return value;
  }
  const currentValue = (_b = (_a = section.outline) == null ? void 0 : _a.mv) == null ? void 0 : _b[variableName];
  if (currentValue) {
    variableValues[variableName] = currentValue;
  }
  getAncestorVariableValue(
    section,
    variableValues,
    variableName
  );
  return variableValues[variableName] ?? null;
};
const getAncestorVariableValue = (section, variableValues, variableName) => {
  var _a, _b, _c;
  const chart = section;
  const parent = (_a = chart.parent) == null ? void 0 : _a.section;
  if (!parent) {
    return;
  }
  const parentValue = (_c = (_b = parent.outline) == null ? void 0 : _b.mv) == null ? void 0 : _c[variableName];
  if (parentValue) {
    variableValues[variableName] = parentValue;
  }
  getAncestorVariableValue(
    parent,
    variableValues,
    variableName
  );
};
const checkForVariables = (fragment) => {
  const value = fragment.value;
  const variableRefPattern = /〈¦‹(?<variableName>[^›¦]+)›¦〉/gmu;
  const matches = value.matchAll(variableRefPattern);
  let variableName;
  let variableValues = {};
  let result = "";
  let marker = 0;
  for (const match of matches) {
    if (match && match.groups && match.index != null) {
      variableName = match.groups.variableName;
      const variableValue = getVariableValue(
        fragment.section,
        variableValues,
        variableName
      );
      if (!variableValue) {
        throw new Error(`Variable: ${variableName} could not be found`);
      }
      result = result + value.substring(marker, match.index) + variableValue;
      marker = match.index + match[0].length;
    }
  }
  result = result + value.substring(marker, value.length);
  fragment.value = result;
};
const clearSiblingChains = (parent, fragment) => {
  for (const option of parent.options) {
    if (option.id !== fragment.id) {
      clearFragmentChains(option);
    }
  }
};
const clearFragmentChains = (fragment) => {
  var _a, _b;
  if (!fragment) {
    return;
  }
  clearFragmentChains((_a = fragment.link) == null ? void 0 : _a.root);
  for (const option of fragment.options) {
    clearFragmentChains(option);
  }
  fragment.selected = null;
  if ((_b = fragment.link) == null ? void 0 : _b.root) {
    fragment.link.root.selected = null;
  }
};
const loadOption = (state, rawOption, outlineNode, section, parentFragmentID, segmentIndex) => {
  const option = new RenderFragment(
    rawOption.id,
    parentFragmentID,
    section,
    segmentIndex
  );
  option.option = rawOption.option ?? "";
  option.isAncillary = rawOption.isAncillary === true;
  option.order = rawOption.order ?? 0;
  option.iExitKey = rawOption.iExitKey ?? "";
  option.autoMergeExit = rawOption.autoMergeExit === true;
  option.podKey = rawOption.podKey ?? "";
  option.podText = rawOption.podText ?? "";
  if (outlineNode) {
    for (const outlineOption of outlineNode.o) {
      if (outlineOption.i === option.id) {
        gStateCode.cache_outlineNode(
          state,
          section.linkID,
          outlineOption
        );
        break;
      }
    }
  }
  gStateCode.cache_chainFragment(
    state,
    option
  );
  gOutlineCode.getPodOutline_subscripion(
    state,
    option,
    section
  );
  return option;
};
const showPlug_subscription = (state, exit, optionText) => {
  const section = exit.section;
  const parent = section.parent;
  if (!parent) {
    throw new Error("IDisplayChart parent is null");
  }
  const iExitKey = exit.exitKey;
  for (const option of parent.options) {
    if (option.iExitKey === iExitKey) {
      return showOptionNode_subscripton(
        state,
        option,
        optionText
      );
    }
  }
};
const showOptionNode_subscripton = (state, option, optionText = null) => {
  var _a, _b;
  if (!option || !((_b = (_a = option.section) == null ? void 0 : _a.outline) == null ? void 0 : _b.path)) {
    return;
  }
  gFragmentCode.prepareToShowOptionNode(
    state,
    option
  );
  return gFragmentCode.getFragmentAndLinkOutline_subscripion(
    state,
    option,
    optionText
  );
};
const loadNextFragmentInSegment = (state, segment) => {
  var _a, _b;
  const nextOutlineNode = gSegmentCode.getNextSegmentOutlineNode(
    state,
    segment
  );
  if (!nextOutlineNode) {
    return;
  }
  const fragmentFolderUrl = (_b = (_a = segment.segmentSection) == null ? void 0 : _a.outline) == null ? void 0 : _b.path;
  const url = `${fragmentFolderUrl}/${nextOutlineNode.i}${gFileConstants.fragmentFileExtension}`;
  const loadDelegate = (state2, outlineResponse) => {
    return gFragmentActions.loadChainFragment(
      state2,
      outlineResponse,
      segment,
      nextOutlineNode
    );
  };
  gStateCode.AddReLoadDataEffectImmediate(
    state,
    `loadChainFragment`,
    ParseType.Json,
    url,
    loadDelegate
  );
};
const gFragmentCode = {
  loadNextChainFragment: (state, segment) => {
    if (segment.outlineNodes.length > 0) {
      loadNextFragmentInSegment(
        state,
        segment
      );
    } else {
      gSegmentCode.loadNextSegment(
        state,
        segment
      );
    }
  },
  hasOption: (fragment, optionID) => {
    for (const option of fragment.options) {
      if (option.id === optionID) {
        return true;
      }
    }
    return false;
  },
  checkSelected: (fragment) => {
    var _a, _b;
    if (!((_a = fragment.selected) == null ? void 0 : _a.id)) {
      return;
    }
    if (!gFragmentCode.hasOption(fragment, (_b = fragment.selected) == null ? void 0 : _b.id)) {
      throw new Error("Selected has been set to fragment that isn't an option");
    }
  },
  clearParentSectionSelected: (displayChart) => {
    const parent = displayChart.parent;
    if (!parent) {
      return;
    }
    gFragmentCode.clearParentSectionOrphanedSteps(parent);
    gFragmentCode.clearParentSectionSelected(parent.section);
  },
  clearParentSectionOrphanedSteps: (fragment) => {
    if (!fragment) {
      return;
    }
    gFragmentCode.clearOrphanedSteps(fragment.selected);
    fragment.selected = null;
  },
  clearOrphanedSteps: (fragment) => {
    var _a;
    if (!fragment) {
      return;
    }
    gFragmentCode.clearOrphanedSteps((_a = fragment.link) == null ? void 0 : _a.root);
    gFragmentCode.clearOrphanedSteps(fragment.selected);
    fragment.selected = null;
    fragment.link = null;
  },
  getFragmentAndLinkOutline_subscripion: (state, option, optionText = null) => {
    var _a, _b;
    state.loading = true;
    window.TreeSolve.screen.hideBanner = true;
    gOutlineCode.getLinkOutline_subscripion(
      state,
      option
    );
    const url = `${(_b = (_a = option.section) == null ? void 0 : _a.outline) == null ? void 0 : _b.path}/${option.id}${gFileConstants.fragmentFileExtension}`;
    const loadAction = (state2, response) => {
      return gFragmentActions.loadFragmentAndSetSelected(
        state2,
        response,
        option,
        optionText
      );
    };
    gStateCode.AddReLoadDataEffectImmediate(
      state,
      `loadFragmentFile`,
      ParseType.Text,
      url,
      loadAction
    );
  },
  getPodFragment_subscripion: (state, option, optionText = null) => {
    var _a, _b;
    state.loading = true;
    window.TreeSolve.screen.hideBanner = true;
    const url = `${(_b = (_a = option.section) == null ? void 0 : _a.outline) == null ? void 0 : _b.path}/${option.id}${gFileConstants.fragmentFileExtension}`;
    const loadAction = (state2, response) => {
      return gFragmentActions.loadPodFragment(
        state2,
        response,
        option,
        optionText
      );
    };
    gStateCode.AddReLoadDataEffectImmediate(
      state,
      `loadFragmentFile`,
      ParseType.Text,
      url,
      loadAction
    );
  },
  // getLinkOutline_subscripion: (
  //     state: IState,
  //     option: IRenderFragment,
  // ): void => {
  //     const outline = option.section.outline;
  //     if (!outline) {
  //         return;
  //     }
  //     const outlineNode = gStateCode.getCached_outlineNode(
  //         state,
  //         option.section.linkID,
  //         option.id
  //     );
  //     if (outlineNode?.c == null
  //         || state.renderState.isChainLoad === true // Will load it from a segment
  //     ) {
  //         return;
  //     }
  //     const outlineChart = gOutlineCode.getOutlineChart(
  //         outline,
  //         outlineNode?.c
  //     );
  //     gOutlineCode.getOutlineFromChart_subscription(
  //         state,
  //         outlineChart,
  //         option
  //     );
  // },
  getLinkElementID: (fragmentID) => {
    return `nt_lk_frag_${fragmentID}`;
  },
  getFragmentElementID: (fragmentID) => {
    return `nt_fr_frag_${fragmentID}`;
  },
  prepareToShowOptionNode: (state, option) => {
    gFragmentCode.markOptionsExpanded(
      state,
      option
    );
    gFragmentCode.setCurrent(
      state,
      option
    );
    gHistoryCode.pushBrowserHistoryState(state);
  },
  prepareToShowPodOptionNode: (state, option) => {
    gFragmentCode.markOptionsExpanded(
      state,
      option
    );
    gFragmentCode.setPodCurrent(
      state,
      option
    );
  },
  parseAndLoadFragment: (state, response, parentFragmentID, outlineNodeID, section) => {
    const result = gFragmentCode.parseAndLoadFragmentBase(
      state,
      response,
      parentFragmentID,
      outlineNodeID,
      section
    );
    const fragment = result.fragment;
    if (result.continueLoading === true) {
      gFragmentCode.autoExpandSingleBlankOption(
        state,
        result.fragment
      );
      if (!fragment.link) {
        gOutlineCode.getLinkOutline_subscripion(
          state,
          fragment
        );
      }
    }
    return fragment;
  },
  parseAndLoadPodFragment: (state, response, parentFragmentID, outlineNodeID, section) => {
    const result = gFragmentCode.parseAndLoadFragmentBase(
      state,
      response,
      parentFragmentID,
      outlineNodeID,
      section
    );
    const fragment = result.fragment;
    if (result.continueLoading === true) {
      gFragmentCode.autoExpandSingleBlankOption(
        state,
        result.fragment
      );
    }
    return fragment;
  },
  parseAndLoadFragmentBase: (state, response, parentFragmentID, outlineNodeID, section, segmentIndex = null) => {
    if (!section.outline) {
      throw new Error("Option section outline was null");
    }
    const rawFragment = gFragmentCode.parseFragment(response);
    if (!rawFragment) {
      throw new Error("Raw fragment was null");
    }
    if (outlineNodeID !== rawFragment.id) {
      throw new Error("The rawFragment id does not match the outlineNodeID");
    }
    let fragment = gStateCode.getCached_chainFragment(
      state,
      section.linkID,
      outlineNodeID
    );
    if (!fragment) {
      fragment = new RenderFragment(
        rawFragment.id,
        parentFragmentID,
        section,
        segmentIndex
      );
    }
    let continueLoading = false;
    gFragmentCode.loadFragment(
      state,
      rawFragment,
      fragment
    );
    gStateCode.cache_chainFragment(
      state,
      fragment
    );
    continueLoading = true;
    return {
      fragment,
      continueLoading
    };
  },
  autoExpandSingleBlankOption: (state, fragment) => {
    const optionsAndAncillaries = gFragmentCode.splitOptionsAndAncillaries(fragment.options);
    if (optionsAndAncillaries.options.length === 1 && gUtilities.isNullOrWhiteSpace(fragment.iKey) && (optionsAndAncillaries.options[0].option === "" || optionsAndAncillaries.options[0].autoMergeExit === true)) {
      const outlineNode = gStateCode.getCached_outlineNode(
        state,
        fragment.section.linkID,
        fragment.id
      );
      if ((outlineNode == null ? void 0 : outlineNode.c) != null) {
        return;
      }
      return showOptionNode_subscripton(
        state,
        optionsAndAncillaries.options[0]
      );
    } else if (!gUtilities.isNullOrWhiteSpace(fragment.exitKey)) {
      showPlug_subscription(
        state,
        fragment,
        fragment.option
      );
    }
  },
  expandOptionPods: (state, fragment) => {
    const optionsAndAncillaries = gFragmentCode.splitOptionsAndAncillaries(fragment.options);
    for (const option of optionsAndAncillaries.options) {
      const outlineNode = gStateCode.getCached_outlineNode(
        state,
        option.section.linkID,
        option.id
      );
      if ((outlineNode == null ? void 0 : outlineNode.d) == null || option.pod != null) {
        return;
      }
      gOutlineCode.getPodOutline_subscripion(
        state,
        option,
        option.section
      );
    }
  },
  cacheSectionRoot: (state, displaySection) => {
    if (!displaySection) {
      return;
    }
    const rootFragment = displaySection.root;
    if (!rootFragment) {
      return;
    }
    gStateCode.cache_chainFragment(
      state,
      rootFragment
    );
    displaySection.current = displaySection.root;
    for (const option of rootFragment.options) {
      gStateCode.cache_chainFragment(
        state,
        option
      );
    }
  },
  elementIsParagraph: (value) => {
    let trimmed = value;
    if (!gUtilities.isNullOrWhiteSpace(trimmed)) {
      if (trimmed.length > 20) {
        trimmed = trimmed.substring(0, 20);
        trimmed = trimmed.replace(/\s/g, "");
      }
    }
    if (trimmed.startsWith("<p>") === true && trimmed[3] !== "<") {
      return true;
    }
    return false;
  },
  parseAndLoadGuideRootFragment: (state, rawFragment, root) => {
    if (!rawFragment) {
      return;
    }
    gFragmentCode.loadFragment(
      state,
      rawFragment,
      root
    );
  },
  loadFragment: (state, rawFragment, fragment) => {
    var _a;
    fragment.topLevelMapKey = rawFragment.topLevelMapKey ?? "";
    fragment.mapKeyChain = rawFragment.mapKeyChain ?? "";
    fragment.guideID = rawFragment.guideID ?? "";
    fragment.iKey = rawFragment.iKey ?? null;
    fragment.exitKey = rawFragment.exitKey ?? null;
    fragment.variable = rawFragment.variable ?? [];
    fragment.classes = rawFragment.classes ?? [];
    fragment.value = rawFragment.value ?? "";
    fragment.value = fragment.value.trim();
    fragment.ui.doNotPaint = false;
    checkForVariables(
      fragment
    );
    const outlineNode = gStateCode.getCached_outlineNode(
      state,
      fragment.section.linkID,
      fragment.id
    );
    fragment.parentFragmentID = ((_a = outlineNode == null ? void 0 : outlineNode.parent) == null ? void 0 : _a.i) ?? "";
    let option;
    if (rawFragment.options && Array.isArray(rawFragment.options)) {
      for (const rawOption of rawFragment.options) {
        option = fragment.options.find((o) => o.id === rawOption.id);
        if (!option) {
          option = loadOption(
            state,
            rawOption,
            outlineNode,
            fragment.section,
            fragment.id,
            fragment.segmentIndex
          );
          fragment.options.push(option);
        } else {
          option.option = rawOption.option ?? "";
          option.isAncillary = rawOption.isAncillary === true;
          option.order = rawOption.order ?? 0;
          option.iExitKey = rawOption.iExitKey ?? "";
          option.exitKey = rawOption.exitKey ?? "";
          option.autoMergeExit = rawOption.autoMergeExit ?? "";
          option.podKey = rawOption.podKey ?? "";
          option.podText = rawOption.podText ?? "";
          option.section = fragment.section;
          option.parentFragmentID = fragment.id;
          option.segmentIndex = fragment.segmentIndex;
        }
        option.ui.doNotPaint = false;
      }
    }
    gHookRegistryCode.executeStepHook(
      state,
      fragment
    );
  },
  parseFragment: (response) => {
    const lines = response.split("\n");
    const renderCommentStart = `<!-- ${gFileConstants.fragmentRenderCommentTag}`;
    const renderCommentEnd = ` -->`;
    let fragmentRenderComment = null;
    let line;
    let buildValue = false;
    let value = "";
    for (let i = 0; i < lines.length; i++) {
      line = lines[i];
      if (buildValue) {
        value = `${value}
${line}`;
        continue;
      }
      if (line.startsWith(renderCommentStart) === true) {
        fragmentRenderComment = line.substring(renderCommentStart.length);
        buildValue = true;
      }
    }
    if (!fragmentRenderComment) {
      return;
    }
    fragmentRenderComment = fragmentRenderComment.trim();
    if (fragmentRenderComment.endsWith(renderCommentEnd) === true) {
      const length = fragmentRenderComment.length - renderCommentEnd.length;
      fragmentRenderComment = fragmentRenderComment.substring(
        0,
        length
      );
    }
    fragmentRenderComment = fragmentRenderComment.trim();
    let rawFragment = null;
    try {
      rawFragment = JSON.parse(fragmentRenderComment);
    } catch (e) {
      console.log(e);
    }
    rawFragment.value = value;
    return rawFragment;
  },
  markOptionsExpanded: (state, fragment) => {
    if (!state) {
      return;
    }
    gFragmentCode.resetFragmentUis(state);
    state.renderState.ui.optionsExpanded = true;
    fragment.ui.fragmentOptionsExpanded = true;
  },
  collapseFragmentsOptions: (fragment) => {
    if (!fragment || fragment.options.length === 0) {
      return;
    }
    for (const option of fragment.options) {
      option.ui.fragmentOptionsExpanded = false;
    }
  },
  showOptionNode: (state, fragment, option) => {
    gFragmentCode.collapseFragmentsOptions(fragment);
    option.ui.fragmentOptionsExpanded = false;
    gFragmentCode.setCurrent(
      state,
      option
    );
  },
  resetFragmentUis: (state) => {
    const chainFragments = state.renderState.index_chainFragments_id;
    for (const propName in chainFragments) {
      gFragmentCode.resetFragmentUi(chainFragments[propName]);
    }
  },
  resetFragmentUi: (fragment) => {
    fragment.ui.fragmentOptionsExpanded = false;
    fragment.ui.doNotPaint = false;
  },
  setAncillaryActive: (state, ancillary) => {
    state.renderState.activeAncillary = ancillary;
  },
  clearAncillaryActive: (state) => {
    state.renderState.activeAncillary = null;
  },
  splitOptionsAndAncillaries: (children) => {
    const ancillaries = [];
    const options = [];
    let option;
    if (!children) {
      return {
        options,
        ancillaries,
        total: 0
      };
    }
    for (let i = 0; i < children.length; i++) {
      option = children[i];
      if (!option.isAncillary) {
        options.push(option);
      } else {
        ancillaries.push(option);
      }
    }
    return {
      options,
      ancillaries,
      total: children.length
    };
  },
  setCurrent: (state, fragment) => {
    const section = fragment.section;
    let parent = gStateCode.getCached_chainFragment(
      state,
      section.linkID,
      fragment.parentFragmentID
    );
    if (parent) {
      if (parent.id === fragment.id) {
        throw new Error("Parent and Fragment are the same");
      }
      parent.selected = fragment;
      fragment.ui.sectionIndex = parent.ui.sectionIndex + 1;
      clearSiblingChains(
        parent,
        fragment
      );
    } else {
      throw new Error("ParentFragment was null");
    }
    section.current = fragment;
    gFragmentCode.checkSelected(fragment);
  },
  setPodCurrent: (state, fragment) => {
    const section = fragment.section;
    let parent = gStateCode.getCached_chainFragment(
      state,
      section.linkID,
      fragment.parentFragmentID
    );
    if (parent) {
      if (parent.id === fragment.id) {
        throw new Error("Parent and Fragment are the same");
      }
      parent.selected = fragment;
      fragment.ui.sectionIndex = parent.ui.sectionIndex + 1;
      clearSiblingChains(
        parent,
        fragment
      );
    } else {
      throw new Error("ParentFragment was null");
    }
    gFragmentCode.checkSelected(fragment);
  }
};
const hideFromPaint = (fragment, hide) => {
  var _a;
  if (!fragment) {
    return;
  }
  fragment.ui.doNotPaint = hide;
  hideFromPaint(
    fragment.selected,
    hide
  );
  hideFromPaint(
    (_a = fragment.link) == null ? void 0 : _a.root,
    hide
  );
};
const hideOptionsFromPaint = (fragment, hide) => {
  if (!fragment) {
    return;
  }
  for (const option of fragment == null ? void 0 : fragment.options) {
    hideFromPaint(
      option,
      hide
    );
  }
  hideSectionParentSelected(
    fragment.section,
    hide
  );
};
const hideSectionParentSelected = (displayChart, hide) => {
  if (!(displayChart == null ? void 0 : displayChart.parent)) {
    return;
  }
  hideFromPaint(
    displayChart.parent.selected,
    hide
  );
  hideSectionParentSelected(
    displayChart.parent.section,
    hide
  );
};
const fragmentActions = {
  expandOptions: (state, fragment) => {
    if (!state || !fragment) {
      return state;
    }
    const ignoreEvent = state.renderState.activeAncillary != null;
    gFragmentCode.clearAncillaryActive(state);
    if (ignoreEvent === true) {
      return gStateCode.cloneState(state);
    }
    gStateCode.setDirty(state);
    gFragmentCode.resetFragmentUis(state);
    const expanded = fragment.ui.fragmentOptionsExpanded !== true;
    state.renderState.ui.optionsExpanded = expanded;
    fragment.ui.fragmentOptionsExpanded = expanded;
    hideOptionsFromPaint(
      fragment,
      true
    );
    return gStateCode.cloneState(state);
  },
  hideOptions: (state, fragment) => {
    if (!state || !fragment) {
      return state;
    }
    const ignoreEvent = state.renderState.activeAncillary != null;
    gFragmentCode.clearAncillaryActive(state);
    if (ignoreEvent === true) {
      return gStateCode.cloneState(state);
    }
    gStateCode.setDirty(state);
    gFragmentCode.resetFragmentUis(state);
    fragment.ui.fragmentOptionsExpanded = false;
    state.renderState.ui.optionsExpanded = false;
    hideOptionsFromPaint(
      fragment,
      false
    );
    return gStateCode.cloneState(state);
  },
  showOptionNode: (state, payload) => {
    if (!state || !(payload == null ? void 0 : payload.parentFragment) || !(payload == null ? void 0 : payload.option)) {
      return state;
    }
    const ignoreEvent = state.renderState.activeAncillary != null;
    gFragmentCode.clearAncillaryActive(state);
    if (ignoreEvent === true) {
      return gStateCode.cloneState(state);
    }
    gStateCode.setDirty(state);
    return gFragmentActions.showOptionNode(
      state,
      payload.parentFragment,
      payload.option
    );
  },
  toggleAncillaryNode: (state, payload) => {
    if (!state) {
      return state;
    }
    const ancillary = payload.option;
    gFragmentCode.setAncillaryActive(
      state,
      ancillary
    );
    if (ancillary) {
      gStateCode.setDirty(state);
      if (!ancillary.ui.ancillaryExpanded) {
        ancillary.ui.ancillaryExpanded = true;
        return gFragmentActions.showAncillaryNode(
          state,
          ancillary
        );
      }
      ancillary.ui.ancillaryExpanded = false;
    }
    return gStateCode.cloneState(state);
  }
};
class FragmentPayload {
  constructor(parentFragment, option, element) {
    __publicField(this, "parentFragment");
    __publicField(this, "option");
    __publicField(this, "element");
    this.parentFragment = parentFragment;
    this.option = option;
    this.element = element;
  }
}
const buildPodDiscussionView = (fragment, views) => {
  var _a, _b;
  let adjustForCollapsedOptions = false;
  let adjustForPriorAncillaries = false;
  const viewsLength = views.length;
  if (viewsLength > 0) {
    const lastView = views[viewsLength - 1];
    if (((_a = lastView == null ? void 0 : lastView.ui) == null ? void 0 : _a.isCollapsed) === true) {
      adjustForCollapsedOptions = true;
    }
    if (((_b = lastView == null ? void 0 : lastView.ui) == null ? void 0 : _b.hasAncillaries) === true) {
      adjustForPriorAncillaries = true;
    }
  }
  const linkELementID = gFragmentCode.getLinkElementID(fragment.id);
  const results = optionsViews.buildView(fragment);
  if (linkELementID === "nt_lk_frag_t968OJ1wo") {
    console.log(`R-DRAWING ${linkELementID}_d`);
  }
  let classes = "nt-fr-fragment-box";
  if (fragment.classes) {
    if (fragment.classes) {
      for (const className of fragment.classes) {
        classes = `${classes} nt-ur-${className}`;
      }
    }
  }
  if (adjustForCollapsedOptions === true) {
    classes = `${classes} nt-fr-prior-collapsed-options`;
  }
  if (adjustForPriorAncillaries === true) {
    classes = `${classes} nt-fr-prior-is-ancillary`;
  }
  const view = h(
    "div",
    {
      id: `${linkELementID}_d`,
      class: `${classes}`
    },
    [
      h(
        "div",
        {
          class: `nt-fr-fragment-discussion`,
          "data-discussion": fragment.value
        },
        ""
      ),
      results.views
    ]
  );
  if (results.optionsCollapsed === true) {
    const viewAny = view;
    if (!viewAny.ui) {
      viewAny.ui = {};
    }
    viewAny.ui.isCollapsed = true;
  }
  if (results.hasAncillaries === true) {
    const viewAny = view;
    if (!viewAny.ui) {
      viewAny.ui = {};
    }
    viewAny.ui.hasAncillaries = true;
  }
  views.push(view);
};
const buildView = (fragment) => {
  const views = [];
  buildPodDiscussionView(
    fragment,
    views
  );
  fragmentViews.buildView(
    fragment.selected,
    views
  );
  return views;
};
const podViews = {
  buildView: (option) => {
    var _a, _b;
    if (!option || !((_a = option.pod) == null ? void 0 : _a.root)) {
      return null;
    }
    const view = h(
      "div",
      { class: "nt-fr-pod-box" },
      buildView((_b = option.pod) == null ? void 0 : _b.root)
    );
    return view;
  }
};
const buildAncillaryDiscussionView = (ancillary) => {
  if (!ancillary.ui.ancillaryExpanded) {
    return [];
  }
  const view = [];
  fragmentViews.buildView(
    ancillary,
    view
  );
  return view;
};
const buildExpandedAncillaryView = (parent, ancillary) => {
  if (!ancillary || !ancillary.isAncillary) {
    return null;
  }
  const view = h("div", { class: "nt-fr-ancillary-box" }, [
    h("div", { class: "nt-fr-ancillary-head" }, [
      h(
        "a",
        {
          class: "nt-fr-ancillary nt-fr-ancillary-target",
          onMouseDown: [
            fragmentActions.toggleAncillaryNode,
            (target) => {
              return new FragmentPayload(
                parent,
                ancillary,
                target
              );
            }
          ]
        },
        [
          h("span", { class: "nt-fr-ancillary-text nt-fr-ancillary-target" }, ancillary.option),
          h("span", { class: "nt-fr-ancillary-x nt-fr-ancillary-target" }, "✕")
        ]
      )
    ]),
    buildAncillaryDiscussionView(ancillary)
  ]);
  return view;
};
const buildCollapsedAncillaryView = (parent, ancillary) => {
  if (!ancillary || !ancillary.isAncillary) {
    return null;
  }
  const view = h("div", { class: "nt-fr-ancillary-box nt-fr-collapsed" }, [
    h("div", { class: "nt-fr-ancillary-head" }, [
      h(
        "a",
        {
          class: "nt-fr-ancillary nt-fr-ancillary-target",
          onMouseDown: [
            fragmentActions.toggleAncillaryNode,
            (target) => {
              return new FragmentPayload(
                parent,
                ancillary,
                target
              );
            }
          ]
        },
        [
          h("span", { class: "nt-fr-ancillary-target" }, ancillary.option)
        ]
      )
    ])
  ]);
  return view;
};
const BuildAncillaryView = (parent, ancillary) => {
  if (!ancillary || !ancillary.isAncillary) {
    return null;
  }
  if (ancillary.ui.ancillaryExpanded === true) {
    return buildExpandedAncillaryView(
      parent,
      ancillary
    );
  }
  return buildCollapsedAncillaryView(
    parent,
    ancillary
  );
};
const BuildExpandedOptionView = (parent, option) => {
  var _a;
  if (!option || option.isAncillary === true) {
    return null;
  }
  let buttonClass = "nt-fr-option";
  let innerView;
  if ((_a = option.pod) == null ? void 0 : _a.root) {
    buttonClass = `${buttonClass} nt-fr-pod-button`;
    innerView = podViews.buildView(option);
  } else {
    innerView = h("span", { class: "nt-fr-option-text" }, option.option);
  }
  const view = h(
    "div",
    { class: "nt-fr-option-box" },
    [
      h(
        "a",
        {
          class: `${buttonClass}`,
          onMouseDown: [
            fragmentActions.showOptionNode,
            (target) => {
              return new FragmentPayload(
                parent,
                option,
                target
              );
            }
          ]
        },
        [
          innerView
        ]
      )
    ]
  );
  return view;
};
const buildExpandedOptionsView = (fragment, options) => {
  const optionViews = [];
  let optionVew;
  for (const option of options) {
    optionVew = BuildExpandedOptionView(
      fragment,
      option
    );
    if (optionVew) {
      optionViews.push(optionVew);
    }
  }
  let optionsClasses = "nt-fr-fragment-options";
  if (fragment.selected) {
    optionsClasses = `${optionsClasses} nt-fr-fragment-chain`;
  }
  const view = h(
    "div",
    {
      class: `${optionsClasses}`,
      tabindex: 0,
      onBlur: [
        fragmentActions.hideOptions,
        (_event) => fragment
      ]
    },
    optionViews
  );
  return {
    view,
    isCollapsed: false
  };
};
const buildExpandedOptionsBoxView = (fragment, options, fragmentELementID, views) => {
  const optionsView = buildExpandedOptionsView(
    fragment,
    options
  );
  if (!optionsView) {
    return;
  }
  let classes = "nt-fr-fragment-box";
  if (fragment.classes) {
    if (fragment.classes) {
      for (const className of fragment.classes) {
        classes = `${classes} nt-ur-${className}`;
      }
    }
  }
  views.push(
    h(
      "div",
      {
        id: `${fragmentELementID}_eo`,
        class: `${classes}`
      },
      [
        optionsView.view
      ]
    )
  );
};
const buildCollapsedOptionsView = (fragment) => {
  var _a, _b, _c;
  let buttonClass = "nt-fr-fragment-options nt-fr-collapsed";
  if ((_b = (_a = fragment.selected) == null ? void 0 : _a.pod) == null ? void 0 : _b.root) {
    buttonClass = `${buttonClass} nt-fr-pod-button`;
  }
  const view = h(
    "a",
    {
      class: `${buttonClass}`,
      onMouseDown: [
        fragmentActions.expandOptions,
        (_event) => fragment
      ]
    },
    [
      podViews.buildView(fragment.selected),
      h("span", { class: `nt-fr-option-selected` }, `${(_c = fragment.selected) == null ? void 0 : _c.option}`)
    ]
  );
  return view;
};
const buildCollapsedOptionsBoxView = (fragment, fragmentELementID, views) => {
  const optionView = buildCollapsedOptionsView(fragment);
  let classes = "nt-fr-fragment-box";
  if (fragment.classes) {
    if (fragment.classes) {
      for (const className of fragment.classes) {
        classes = `${classes} nt-ur-${className}`;
      }
    }
  }
  const view = h(
    "div",
    {
      id: `${fragmentELementID}_co`,
      class: `${classes}`
    },
    [
      optionView
    ]
  );
  const viewAny = view;
  if (!viewAny.ui) {
    viewAny.ui = {};
  }
  viewAny.ui.isCollapsed = true;
  views.push(view);
};
const buildAncillariesView = (fragment, ancillaries) => {
  if (ancillaries.length === 0) {
    return null;
  }
  const ancillariesViews = [];
  let ancillaryView;
  for (const ancillary of ancillaries) {
    ancillaryView = BuildAncillaryView(
      fragment,
      ancillary
    );
    if (ancillaryView) {
      ancillariesViews.push(ancillaryView);
    }
  }
  if (ancillariesViews.length === 0) {
    return null;
  }
  let ancillariesClasses = "nt-fr-fragment-ancillaries";
  if (fragment.selected) {
    ancillariesClasses = `${ancillariesClasses} nt-fr-fragment-chain`;
  }
  const view = h(
    "div",
    {
      class: `${ancillariesClasses}`,
      tabindex: 0
      // onBlur: [
      //     fragmentActions.hideOptions,
      //     (_event: any) => fragment
      // ]
    },
    ancillariesViews
  );
  return view;
};
const buildAncillariesBoxView = (fragment, ancillaries, fragmentELementID, views) => {
  const ancillariesView = buildAncillariesView(
    fragment,
    ancillaries
  );
  if (!ancillariesView) {
    return;
  }
  let classes = "nt-fr-fragment-box";
  if (fragment.classes) {
    if (fragment.classes) {
      for (const className of fragment.classes) {
        classes = `${classes} nt-ur-${className}`;
      }
    }
  }
  const view = h(
    "div",
    {
      id: `${fragmentELementID}_a`,
      class: `${classes}`
    },
    [
      ancillariesView
    ]
  );
  const viewAny = view;
  if (!viewAny.ui) {
    viewAny.ui = {};
  }
  viewAny.ui.hasAncillaries = true;
  views.push(view);
};
const buildOptionsView = (fragment, options) => {
  if (options.length === 0) {
    return null;
  }
  if (options.length === 1 && (options[0].option === "" || options[0].autoMergeExit === true)) {
    return null;
  }
  if (fragment.selected && !fragment.ui.fragmentOptionsExpanded) {
    const view = buildCollapsedOptionsView(fragment);
    return {
      view,
      isCollapsed: true
    };
  }
  return buildExpandedOptionsView(
    fragment,
    options
  );
};
const buildOptionsBoxView = (fragment, options, fragmentELementID, views) => {
  if (options.length === 0) {
    return;
  }
  if (options.length === 1 && (options[0].option === "" || options[0].autoMergeExit === true)) {
    return;
  }
  if (fragment.selected && !fragment.ui.fragmentOptionsExpanded) {
    buildCollapsedOptionsBoxView(
      fragment,
      fragmentELementID,
      views
    );
    return;
  }
  buildExpandedOptionsBoxView(
    fragment,
    options,
    fragmentELementID,
    views
  );
};
const optionsViews = {
  buildView: (fragment) => {
    if (!fragment.options || fragment.options.length === 0 || !gUtilities.isNullOrWhiteSpace(fragment.iKey)) {
      return {
        views: [],
        optionsCollapsed: false,
        hasAncillaries: false
      };
    }
    if (fragment.options.length === 1 && (fragment.options[0].option === "" || fragment.options[0].autoMergeExit === true)) {
      return {
        views: [],
        optionsCollapsed: false,
        hasAncillaries: false
      };
    }
    const optionsAndAncillaries = gFragmentCode.splitOptionsAndAncillaries(fragment.options);
    let hasAncillaries = false;
    const views = [
      buildAncillariesView(
        fragment,
        optionsAndAncillaries.ancillaries
      )
    ];
    if (views.length > 0) {
      hasAncillaries = true;
    }
    const optionsViewResults = buildOptionsView(
      fragment,
      optionsAndAncillaries.options
    );
    if (optionsViewResults) {
      views.push(optionsViewResults.view);
    }
    return {
      views,
      optionsCollapsed: (optionsViewResults == null ? void 0 : optionsViewResults.isCollapsed) ?? false,
      hasAncillaries
    };
  },
  buildView2: (fragment, views) => {
    if (!fragment.options || fragment.options.length === 0 || !gUtilities.isNullOrWhiteSpace(fragment.iKey)) {
      return;
    }
    if (fragment.options.length === 1 && (fragment.options[0].option === "" || fragment.options[0].autoMergeExit === true)) {
      return;
    }
    const fragmentELementID = gFragmentCode.getFragmentElementID(fragment.id);
    const optionsAndAncillaries = gFragmentCode.splitOptionsAndAncillaries(fragment.options);
    buildAncillariesBoxView(
      fragment,
      optionsAndAncillaries.ancillaries,
      fragmentELementID,
      views
    );
    buildOptionsBoxView(
      fragment,
      optionsAndAncillaries.options,
      fragmentELementID,
      views
    );
  }
};
const buildLinkDiscussionView = (fragment, views) => {
  var _a, _b;
  let adjustForCollapsedOptions = false;
  let adjustForPriorAncillaries = false;
  const viewsLength = views.length;
  if (viewsLength > 0) {
    const lastView = views[viewsLength - 1];
    if (((_a = lastView == null ? void 0 : lastView.ui) == null ? void 0 : _a.isCollapsed) === true) {
      adjustForCollapsedOptions = true;
    }
    if (((_b = lastView == null ? void 0 : lastView.ui) == null ? void 0 : _b.hasAncillaries) === true) {
      adjustForPriorAncillaries = true;
    }
  }
  const linkELementID = gFragmentCode.getLinkElementID(fragment.id);
  const results = optionsViews.buildView(fragment);
  if (linkELementID === "nt_lk_frag_t968OJ1wo") {
    console.log(`R-DRAWING ${linkELementID}_l`);
  }
  let classes = "nt-fr-fragment-box";
  if (fragment.classes) {
    if (fragment.classes) {
      for (const className of fragment.classes) {
        classes = `${classes} nt-ur-${className}`;
      }
    }
  }
  if (adjustForCollapsedOptions === true) {
    classes = `${classes} nt-fr-prior-collapsed-options`;
  }
  if (adjustForPriorAncillaries === true) {
    classes = `${classes} nt-fr-prior-is-ancillary`;
  }
  const view = h(
    "div",
    {
      id: `${linkELementID}_l`,
      class: `${classes}`
    },
    [
      h(
        "div",
        {
          class: `nt-fr-fragment-discussion`,
          "data-discussion": fragment.value
        },
        ""
      ),
      results.views
    ]
  );
  if (results.optionsCollapsed === true) {
    const viewAny = view;
    if (!viewAny.ui) {
      viewAny.ui = {};
    }
    viewAny.ui.isCollapsed = true;
  }
  if (results.hasAncillaries === true) {
    const viewAny = view;
    if (!viewAny.ui) {
      viewAny.ui = {};
    }
    viewAny.ui.hasAncillaries = true;
  }
  views.push(view);
};
const linkViews = {
  buildView: (fragment, views) => {
    var _a;
    if (!fragment || fragment.ui.doNotPaint === true) {
      return;
    }
    buildLinkDiscussionView(
      fragment,
      views
    );
    linkViews.buildView(
      (_a = fragment.link) == null ? void 0 : _a.root,
      views
    );
    fragmentViews.buildView(
      fragment.selected,
      views
    );
  }
};
const buildDiscussionView = (fragment, views) => {
  var _a, _b;
  if (gUtilities.isNullOrWhiteSpace(fragment.value) === true) {
    return;
  }
  let adjustForCollapsedOptions = false;
  let adjustForPriorAncillaries = false;
  const viewsLength = views.length;
  if (viewsLength > 0) {
    const lastView = views[viewsLength - 1];
    if (((_a = lastView == null ? void 0 : lastView.ui) == null ? void 0 : _a.isCollapsed) === true) {
      adjustForCollapsedOptions = true;
    }
    if (((_b = lastView == null ? void 0 : lastView.ui) == null ? void 0 : _b.hasAncillaries) === true) {
      adjustForPriorAncillaries = true;
    }
  }
  const fragmentELementID = gFragmentCode.getFragmentElementID(fragment.id);
  let classes = "nt-fr-fragment-box";
  if (fragment.classes) {
    if (fragment.classes) {
      for (const className of fragment.classes) {
        classes = `${classes} nt-ur-${className}`;
      }
    }
  }
  if (adjustForCollapsedOptions === true) {
    classes = `${classes} nt-fr-prior-collapsed-options`;
  }
  if (adjustForPriorAncillaries === true) {
    classes = `${classes} nt-fr-prior-is-ancillary`;
  }
  views.push(
    h(
      "div",
      {
        id: `${fragmentELementID}_d`,
        class: `${classes}`
      },
      [
        h(
          "div",
          {
            class: `nt-fr-fragment-discussion`,
            "data-discussion": fragment.value
          },
          ""
        )
      ]
    )
  );
};
const fragmentViews = {
  buildView: (fragment, views) => {
    var _a;
    if (!fragment || fragment.ui.doNotPaint === true) {
      return;
    }
    buildDiscussionView(
      fragment,
      views
    );
    linkViews.buildView(
      (_a = fragment.link) == null ? void 0 : _a.root,
      views
    );
    optionsViews.buildView2(
      fragment,
      views
    );
    fragmentViews.buildView(
      fragment.selected,
      views
    );
  }
};
const guideViews = {
  buildContentView: (state) => {
    var _a;
    const innerViews = [];
    fragmentViews.buildView(
      (_a = state.renderState.displayGuide) == null ? void 0 : _a.root,
      innerViews
    );
    const view = h(
      "div",
      {
        id: "nt_fr_Fragments"
      },
      innerViews
    );
    return view;
  }
};
const initView = {
  buildView: (state) => {
    const view = h(
      "div",
      {
        onClick: initActions.setNotRaw,
        id: "treeSolveFragments"
      },
      [
        guideViews.buildContentView(state)
      ]
    );
    return view;
  }
};
class Settings {
  constructor() {
    __publicField(this, "key", "-1");
    __publicField(this, "r", "-1");
    // Authentication
    __publicField(this, "userPath", `user`);
    __publicField(this, "defaultLogoutPath", `logout`);
    __publicField(this, "defaultLoginPath", `login`);
    __publicField(this, "returnUrlStart", `returnUrl`);
    __publicField(this, "baseUrl", window.ASSISTANT_BASE_URL ?? "");
    __publicField(this, "linkUrl", window.ASSISTANT_LINK_URL ?? "");
    __publicField(this, "subscriptionID", window.ASSISTANT_SUBSCRIPTION_ID ?? "");
    __publicField(this, "apiUrl", `${this.baseUrl}/api`);
    __publicField(this, "bffUrl", `${this.baseUrl}/bff`);
    __publicField(this, "fileUrl", `${this.baseUrl}/file`);
  }
}
var navigationDirection = /* @__PURE__ */ ((navigationDirection2) => {
  navigationDirection2["Buttons"] = "buttons";
  navigationDirection2["Backwards"] = "backwards";
  navigationDirection2["Forwards"] = "forwards";
  return navigationDirection2;
})(navigationDirection || {});
class History {
  constructor() {
    __publicField(this, "historyChain", []);
    __publicField(this, "direction", navigationDirection.Buttons);
    __publicField(this, "currentIndex", 0);
  }
}
class User {
  constructor() {
    __publicField(this, "key", `0123456789`);
    __publicField(this, "r", "-1");
    __publicField(this, "useVsCode", true);
    __publicField(this, "authorised", false);
    __publicField(this, "raw", true);
    __publicField(this, "logoutUrl", "");
    __publicField(this, "showMenu", false);
    __publicField(this, "name", "");
    __publicField(this, "sub", "");
  }
}
class RepeateEffects {
  constructor() {
    __publicField(this, "shortIntervalHttp", []);
    __publicField(this, "reLoadGetHttpImmediate", []);
    __publicField(this, "runActionImmediate", []);
  }
}
class RenderStateUI {
  constructor() {
    __publicField(this, "raw", true);
    __publicField(this, "optionsExpanded", false);
  }
}
class RenderState {
  constructor() {
    __publicField(this, "refreshUrl", false);
    __publicField(this, "isChainLoad", false);
    __publicField(this, "segments", []);
    __publicField(this, "displayGuide", null);
    __publicField(this, "outlines", {});
    __publicField(this, "outlineUrls", {});
    __publicField(this, "currentSection", null);
    __publicField(this, "activeAncillary", null);
    // Search indices
    __publicField(this, "index_outlineNodes_id", {});
    __publicField(this, "index_chainFragments_id", {});
    __publicField(this, "ui", new RenderStateUI());
  }
}
class State {
  constructor() {
    __publicField(this, "loading", true);
    __publicField(this, "debug", true);
    __publicField(this, "genericError", false);
    __publicField(this, "nextKey", -1);
    __publicField(this, "settings");
    __publicField(this, "user", new User());
    __publicField(this, "renderState", new RenderState());
    __publicField(this, "repeatEffects", new RepeateEffects());
    __publicField(this, "stepHistory", new History());
    const settings = new Settings();
    this.settings = settings;
  }
}
const getGuideOutline = (state, fragmentFolderUrl, loadDelegate) => {
  if (gUtilities.isNullOrWhiteSpace(fragmentFolderUrl) === true) {
    return;
  }
  const callID = gUtilities.generateGuid();
  let headers = gAjaxHeaderCode.buildHeaders(
    state,
    callID,
    ActionType.GetOutline
  );
  const url = `${fragmentFolderUrl}/${gFileConstants.guideOutlineFilename}`;
  const loadRequested = gOutlineCode.registerOutlineUrlDownload(
    state,
    url
  );
  if (loadRequested === true) {
    return;
  }
  return gAuthenticatedHttp({
    url,
    options: {
      method: "GET",
      headers
    },
    response: "json",
    action: loadDelegate,
    error: (state2, errorDetails) => {
      console.log(`{
                "message": "Error getting outline data from the server.",
                "url": ${url},
                "error Details": ${JSON.stringify(errorDetails)},
                "stack": ${JSON.stringify(errorDetails.stack)},
                "method": ${gRenderEffects.getGuideOutline.name},
                "callID: ${callID}
            }`);
      alert(`{
                "message": "Error getting outline data from the server.",
                "url": ${url},
                "error Details": ${JSON.stringify(errorDetails)},
                "stack": ${JSON.stringify(errorDetails.stack)},
                "method": ${gRenderEffects.getGuideOutline.name},
                "callID: ${callID}
            }`);
      return gStateCode.cloneState(state2);
    }
  });
};
const gRenderEffects = {
  getGuideOutline: (state) => {
    var _a;
    if (!state) {
      return;
    }
    const fragmentFolderUrl = ((_a = state.renderState.displayGuide) == null ? void 0 : _a.guide.fragmentFolderUrl) ?? "null";
    const loadDelegate = (state2, outlineResponse) => {
      return gOutlineActions.loadGuideOutlineProperties(
        state2,
        outlineResponse,
        fragmentFolderUrl
      );
    };
    return getGuideOutline(
      state,
      fragmentFolderUrl,
      loadDelegate
    );
  },
  getGuideOutlineAndLoadSegments: (state) => {
    var _a;
    if (!state) {
      return;
    }
    const fragmentFolderUrl = ((_a = state.renderState.displayGuide) == null ? void 0 : _a.guide.fragmentFolderUrl) ?? "null";
    const loadDelegate = (state2, outlineResponse) => {
      return gOutlineActions.loadGuideOutlineAndSegments(
        state2,
        outlineResponse,
        fragmentFolderUrl
      );
    };
    return getGuideOutline(
      state,
      fragmentFolderUrl,
      loadDelegate
    );
  }
};
const initialiseState = () => {
  if (!window.TreeSolve) {
    window.TreeSolve = new TreeSolve();
  }
  const state = new State();
  gRenderCode.parseRenderingComment(state);
  return state;
};
const buildRenderDisplay = (state) => {
  var _a, _b, _c, _d;
  if (!((_a = state.renderState.displayGuide) == null ? void 0 : _a.root)) {
    return state;
  }
  if (gUtilities.isNullOrWhiteSpace((_b = state.renderState.displayGuide) == null ? void 0 : _b.root.iKey) === true && (!((_c = state.renderState.displayGuide) == null ? void 0 : _c.root.options) || ((_d = state.renderState.displayGuide) == null ? void 0 : _d.root.options.length) === 0)) {
    return state;
  }
  return [
    state,
    gRenderEffects.getGuideOutline(state)
  ];
};
const buildSegmentsRenderDisplay = (state, queryString) => {
  state.renderState.isChainLoad = true;
  gSegmentCode.parseSegments(
    state,
    queryString
  );
  const segments = state.renderState.segments;
  if (segments.length === 0) {
    return state;
  }
  if (segments.length === 1) {
    throw new Error("There was only 1 segment");
  }
  const rootSegment = segments[0];
  if (!rootSegment.start.isRoot) {
    throw new Error("GuideRoot not present");
  }
  const firstSegment = segments[1];
  if (!firstSegment.start.isLast && firstSegment.start.type !== OutlineType.Link) {
    throw new Error("Invalid query string format - it should start with '-' or '~'");
  }
  return [
    state,
    gRenderEffects.getGuideOutlineAndLoadSegments(state)
  ];
};
const initState = {
  initialise: () => {
    const state = initialiseState();
    const queryString = window.location.search;
    try {
      if (!gUtilities.isNullOrWhiteSpace(queryString)) {
        return buildSegmentsRenderDisplay(
          state,
          queryString
        );
      }
      return buildRenderDisplay(state);
    } catch (e) {
      state.genericError = true;
      console.log(e);
      return state;
    }
  }
};
const renderComments = {
  registerGuideComment: () => {
    const treeSolveGuide = document.getElementById(Filters.treeSolveGuideID);
    if (treeSolveGuide && treeSolveGuide.hasChildNodes() === true) {
      let childNode;
      for (let i = 0; i < treeSolveGuide.childNodes.length; i++) {
        childNode = treeSolveGuide.childNodes[i];
        if (childNode.nodeType === Node.COMMENT_NODE) {
          if (!window.TreeSolve) {
            window.TreeSolve = new TreeSolve();
          }
          window.TreeSolve.renderingComment = childNode.textContent;
          childNode.remove();
          break;
        } else if (childNode.nodeType !== Node.TEXT_NODE) {
          break;
        }
      }
    }
  }
};
initEvents.registerGlobalEvents();
renderComments.registerGuideComment();
window.CompositeFlowsAuthor = app({
  node: document.getElementById("treeSolveFragments"),
  init: initState.initialise,
  view: initView.buildView,
  subscriptions: initSubscriptions,
  onEnd: initEvents.onRenderFinished
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3VpZGUuVkJxSWE2LW8uanMiLCJzb3VyY2VzIjpbIi4uLy4uL3Jvb3Qvc3JjL2h5cGVyQXBwL2h5cGVyLWFwcC1sb2NhbC5qcyIsIi4uLy4uL3Jvb3Qvc3JjL2h5cGVyQXBwL3RpbWUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9odHRwL2dIdHRwLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9pbnRlcmZhY2VzL3N0YXRlL2NvbnN0YW50cy9LZXlzLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9lZmZlY3RzL0h0dHBFZmZlY3QudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9nVXRpbGl0aWVzLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9oaXN0b3J5L0hpc3RvcnlVcmwudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL2hpc3RvcnkvUmVuZGVyU25hcFNob3QudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9jb2RlL2dIaXN0b3J5Q29kZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2NvZGUvZ1N0YXRlQ29kZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2h0dHAvZ0F1dGhlbnRpY2F0aW9uQ29kZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvaW50ZXJmYWNlcy9lbnVtcy9BY3Rpb25UeXBlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9nbG9iYWwvaHR0cC9nQWpheEhlYWRlckNvZGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9odHRwL2dBdXRoZW50aWNhdGlvbkVmZmVjdHMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9odHRwL2dBdXRoZW50aWNhdGlvbkFjdGlvbnMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9odHRwL2dBdXRoZW50aWNhdGlvbkh0dHAudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9hY3Rpb25zL2dSZXBlYXRBY3Rpb25zLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdWJzY3JpcHRpb25zL3JlcGVhdFN1YnNjcmlwdGlvbi50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvY29tcG9uZW50cy9pbml0L3N1YnNjcmlwdGlvbnMvaW5pdFN1YnNjcmlwdGlvbnMudHMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQHZpbWVvL3BsYXllci9kaXN0L3BsYXllci5lcy5qcyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvY29uc3RhbnRzL0ZpbHRlcnMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2NvbXBvbmVudHMvZnJhZ21lbnRzL2NvZGUvb25GcmFnbWVudHNSZW5kZXJGaW5pc2hlZC50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvY29tcG9uZW50cy9pbml0L2NvZGUvb25SZW5kZXJGaW5pc2hlZC50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvY29tcG9uZW50cy9pbml0L2NvZGUvaW5pdEV2ZW50cy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvY29tcG9uZW50cy9pbml0L2FjdGlvbnMvaW5pdEFjdGlvbnMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2ludGVyZmFjZXMvZW51bXMvUGFyc2VUeXBlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS91aS9SZW5kZXJGcmFnbWVudFVJLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9yZW5kZXIvUmVuZGVyRnJhZ21lbnQudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2ludGVyZmFjZXMvZW51bXMvT3V0bGluZVR5cGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL3JlbmRlci9SZW5kZXJPdXRsaW5lTm9kZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvcmVuZGVyL1JlbmRlck91dGxpbmUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL3JlbmRlci9SZW5kZXJPdXRsaW5lQ2hhcnQudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL2Rpc3BsYXkvRGlzcGxheUd1aWRlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9yZW5kZXIvUmVuZGVyR3VpZGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2ludGVyZmFjZXMvZW51bXMvU2Nyb2xsSG9wVHlwZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvd2luZG93L1NjcmVlbi50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvd2luZG93L1RyZWVTb2x2ZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2dGaWxlQ29uc3RhbnRzLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9nbG9iYWwvY29kZS9nUmVuZGVyQ29kZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvZGlzcGxheS9EaXNwbGF5Q2hhcnQudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL3NlZ21lbnRzL0NoYWluU2VnbWVudC50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvc2VnbWVudHMvU2VnbWVudE5vZGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9jb2RlL2dTZWdtZW50Q29kZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2FjdGlvbnMvZ091dGxpbmVBY3Rpb25zLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9nbG9iYWwvY29kZS9nT3V0bGluZUNvZGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9lZmZlY3RzL2dGcmFnbWVudEVmZmVjdHMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9hY3Rpb25zL2dGcmFnbWVudEFjdGlvbnMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9jb2RlL2dIb29rUmVnaXN0cnlDb2RlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9nbG9iYWwvY29kZS9nRnJhZ21lbnRDb2RlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9jb21wb25lbnRzL2ZyYWdtZW50cy9hY3Rpb25zL2ZyYWdtZW50QWN0aW9ucy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvdWkvcGF5bG9hZHMvRnJhZ21lbnRQYXlsb2FkLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9jb21wb25lbnRzL2ZyYWdtZW50cy92aWV3cy9wb2RWaWV3cy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvY29tcG9uZW50cy9mcmFnbWVudHMvdmlld3Mvb3B0aW9uc1ZpZXdzLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9jb21wb25lbnRzL2ZyYWdtZW50cy92aWV3cy9saW5rVmlld3MudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2NvbXBvbmVudHMvZnJhZ21lbnRzL3ZpZXdzL2ZyYWdtZW50Vmlld3MudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2NvbXBvbmVudHMvZnJhZ21lbnRzL3ZpZXdzL2d1aWRlVmlld3MudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2NvbXBvbmVudHMvaW5pdC92aWV3cy9pbml0Vmlldy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvdXNlci9TZXR0aW5ncy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvaW50ZXJmYWNlcy9lbnVtcy9uYXZpZ2F0aW9uRGlyZWN0aW9uLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9oaXN0b3J5L0hpc3RvcnkudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL3VzZXIvVXNlci50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvZWZmZWN0cy9SZXBlYXRlRWZmZWN0cy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvdWkvUmVuZGVyU3RhdGVVSS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvUmVuZGVyU3RhdGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL1N0YXRlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9nbG9iYWwvZWZmZWN0cy9nUmVuZGVyRWZmZWN0cy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvY29tcG9uZW50cy9pbml0L2NvZGUvaW5pdFN0YXRlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9jb21wb25lbnRzL2luaXQvY29kZS9yZW5kZXJDb21tZW50cy50cyIsIi4uLy4uL3Jvb3Qvc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbInZhciBSRUNZQ0xFRF9OT0RFID0gMVxyXG52YXIgTEFaWV9OT0RFID0gMlxyXG52YXIgVEVYVF9OT0RFID0gM1xyXG52YXIgRU1QVFlfT0JKID0ge31cclxudmFyIEVNUFRZX0FSUiA9IFtdXHJcbnZhciBtYXAgPSBFTVBUWV9BUlIubWFwXHJcbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheVxyXG52YXIgZGVmZXIgPVxyXG4gIHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09IFwidW5kZWZpbmVkXCJcclxuICAgID8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lXHJcbiAgICA6IHNldFRpbWVvdXRcclxuXHJcbnZhciBjcmVhdGVDbGFzcyA9IGZ1bmN0aW9uKG9iaikge1xyXG4gIHZhciBvdXQgPSBcIlwiXHJcblxyXG4gIGlmICh0eXBlb2Ygb2JqID09PSBcInN0cmluZ1wiKSByZXR1cm4gb2JqXHJcblxyXG4gIGlmIChpc0FycmF5KG9iaikgJiYgb2JqLmxlbmd0aCA+IDApIHtcclxuICAgIGZvciAodmFyIGsgPSAwLCB0bXA7IGsgPCBvYmoubGVuZ3RoOyBrKyspIHtcclxuICAgICAgaWYgKCh0bXAgPSBjcmVhdGVDbGFzcyhvYmpba10pKSAhPT0gXCJcIikge1xyXG4gICAgICAgIG91dCArPSAob3V0ICYmIFwiIFwiKSArIHRtcFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XHJcbiAgICAgIGlmIChvYmpba10pIHtcclxuICAgICAgICBvdXQgKz0gKG91dCAmJiBcIiBcIikgKyBrXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBvdXRcclxufVxyXG5cclxudmFyIG1lcmdlID0gZnVuY3Rpb24oYSwgYikge1xyXG4gIHZhciBvdXQgPSB7fVxyXG5cclxuICBmb3IgKHZhciBrIGluIGEpIG91dFtrXSA9IGFba11cclxuICBmb3IgKHZhciBrIGluIGIpIG91dFtrXSA9IGJba11cclxuXHJcbiAgcmV0dXJuIG91dFxyXG59XHJcblxyXG52YXIgYmF0Y2ggPSBmdW5jdGlvbihsaXN0KSB7XHJcbiAgcmV0dXJuIGxpc3QucmVkdWNlKGZ1bmN0aW9uKG91dCwgaXRlbSkge1xyXG4gICAgcmV0dXJuIG91dC5jb25jYXQoXHJcbiAgICAgICFpdGVtIHx8IGl0ZW0gPT09IHRydWVcclxuICAgICAgICA/IDBcclxuICAgICAgICA6IHR5cGVvZiBpdGVtWzBdID09PSBcImZ1bmN0aW9uXCJcclxuICAgICAgICA/IFtpdGVtXVxyXG4gICAgICAgIDogYmF0Y2goaXRlbSlcclxuICAgIClcclxuICB9LCBFTVBUWV9BUlIpXHJcbn1cclxuXHJcbnZhciBpc1NhbWVBY3Rpb24gPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgcmV0dXJuIGlzQXJyYXkoYSkgJiYgaXNBcnJheShiKSAmJiBhWzBdID09PSBiWzBdICYmIHR5cGVvZiBhWzBdID09PSBcImZ1bmN0aW9uXCJcclxufVxyXG5cclxudmFyIHNob3VsZFJlc3RhcnQgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgaWYgKGEgIT09IGIpIHtcclxuICAgIGZvciAodmFyIGsgaW4gbWVyZ2UoYSwgYikpIHtcclxuICAgICAgaWYgKGFba10gIT09IGJba10gJiYgIWlzU2FtZUFjdGlvbihhW2tdLCBiW2tdKSkgcmV0dXJuIHRydWVcclxuICAgICAgYltrXSA9IGFba11cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbnZhciBwYXRjaFN1YnMgPSBmdW5jdGlvbihvbGRTdWJzLCBuZXdTdWJzLCBkaXNwYXRjaCkge1xyXG4gIGZvciAoXHJcbiAgICB2YXIgaSA9IDAsIG9sZFN1YiwgbmV3U3ViLCBzdWJzID0gW107XHJcbiAgICBpIDwgb2xkU3Vicy5sZW5ndGggfHwgaSA8IG5ld1N1YnMubGVuZ3RoO1xyXG4gICAgaSsrXHJcbiAgKSB7XHJcbiAgICBvbGRTdWIgPSBvbGRTdWJzW2ldXHJcbiAgICBuZXdTdWIgPSBuZXdTdWJzW2ldXHJcbiAgICBzdWJzLnB1c2goXHJcbiAgICAgIG5ld1N1YlxyXG4gICAgICAgID8gIW9sZFN1YiB8fFxyXG4gICAgICAgICAgbmV3U3ViWzBdICE9PSBvbGRTdWJbMF0gfHxcclxuICAgICAgICAgIHNob3VsZFJlc3RhcnQobmV3U3ViWzFdLCBvbGRTdWJbMV0pXHJcbiAgICAgICAgICA/IFtcclxuICAgICAgICAgICAgICBuZXdTdWJbMF0sXHJcbiAgICAgICAgICAgICAgbmV3U3ViWzFdLFxyXG4gICAgICAgICAgICAgIG5ld1N1YlswXShkaXNwYXRjaCwgbmV3U3ViWzFdKSxcclxuICAgICAgICAgICAgICBvbGRTdWIgJiYgb2xkU3ViWzJdKClcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgOiBvbGRTdWJcclxuICAgICAgICA6IG9sZFN1YiAmJiBvbGRTdWJbMl0oKVxyXG4gICAgKVxyXG4gIH1cclxuICByZXR1cm4gc3Vic1xyXG59XHJcblxyXG52YXIgcGF0Y2hQcm9wZXJ0eSA9IGZ1bmN0aW9uKG5vZGUsIGtleSwgb2xkVmFsdWUsIG5ld1ZhbHVlLCBsaXN0ZW5lciwgaXNTdmcpIHtcclxuICBpZiAoa2V5ID09PSBcImtleVwiKSB7XHJcbiAgfSBlbHNlIGlmIChrZXkgPT09IFwic3R5bGVcIikge1xyXG4gICAgZm9yICh2YXIgayBpbiBtZXJnZShvbGRWYWx1ZSwgbmV3VmFsdWUpKSB7XHJcbiAgICAgIG9sZFZhbHVlID0gbmV3VmFsdWUgPT0gbnVsbCB8fCBuZXdWYWx1ZVtrXSA9PSBudWxsID8gXCJcIiA6IG5ld1ZhbHVlW2tdXHJcbiAgICAgIGlmIChrWzBdID09PSBcIi1cIikge1xyXG4gICAgICAgIG5vZGVba2V5XS5zZXRQcm9wZXJ0eShrLCBvbGRWYWx1ZSlcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBub2RlW2tleV1ba10gPSBvbGRWYWx1ZVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmIChrZXlbMF0gPT09IFwib1wiICYmIGtleVsxXSA9PT0gXCJuXCIpIHtcclxuICAgIGlmIChcclxuICAgICAgISgobm9kZS5hY3Rpb25zIHx8IChub2RlLmFjdGlvbnMgPSB7fSkpW1xyXG4gICAgICAgIChrZXkgPSBrZXkuc2xpY2UoMikudG9Mb3dlckNhc2UoKSlcclxuICAgICAgXSA9IG5ld1ZhbHVlKVxyXG4gICAgKSB7XHJcbiAgICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihrZXksIGxpc3RlbmVyKVxyXG4gICAgfSBlbHNlIGlmICghb2xkVmFsdWUpIHtcclxuICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGtleSwgbGlzdGVuZXIpXHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmICghaXNTdmcgJiYga2V5ICE9PSBcImxpc3RcIiAmJiBrZXkgaW4gbm9kZSkge1xyXG4gICAgbm9kZVtrZXldID0gbmV3VmFsdWUgPT0gbnVsbCB8fCBuZXdWYWx1ZSA9PSBcInVuZGVmaW5lZFwiID8gXCJcIiA6IG5ld1ZhbHVlXHJcbiAgfSBlbHNlIGlmIChcclxuICAgIG5ld1ZhbHVlID09IG51bGwgfHxcclxuICAgIG5ld1ZhbHVlID09PSBmYWxzZSB8fFxyXG4gICAgKGtleSA9PT0gXCJjbGFzc1wiICYmICEobmV3VmFsdWUgPSBjcmVhdGVDbGFzcyhuZXdWYWx1ZSkpKVxyXG4gICkge1xyXG4gICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoa2V5KVxyXG4gIH0gZWxzZSB7XHJcbiAgICBub2RlLnNldEF0dHJpYnV0ZShrZXksIG5ld1ZhbHVlKVxyXG4gIH1cclxufVxyXG5cclxudmFyIGNyZWF0ZU5vZGUgPSBmdW5jdGlvbih2ZG9tLCBsaXN0ZW5lciwgaXNTdmcpIHtcclxuICB2YXIgbnMgPSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCJcclxuICB2YXIgcHJvcHMgPSB2ZG9tLnByb3BzXHJcbiAgdmFyIG5vZGUgPVxyXG4gICAgdmRvbS50eXBlID09PSBURVhUX05PREVcclxuICAgICAgPyBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2ZG9tLm5hbWUpXHJcbiAgICAgIDogKGlzU3ZnID0gaXNTdmcgfHwgdmRvbS5uYW1lID09PSBcInN2Z1wiKVxyXG4gICAgICA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucywgdmRvbS5uYW1lLCB7IGlzOiBwcm9wcy5pcyB9KVxyXG4gICAgICA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodmRvbS5uYW1lLCB7IGlzOiBwcm9wcy5pcyB9KVxyXG5cclxuICBmb3IgKHZhciBrIGluIHByb3BzKSB7XHJcbiAgICBwYXRjaFByb3BlcnR5KG5vZGUsIGssIG51bGwsIHByb3BzW2tdLCBsaXN0ZW5lciwgaXNTdmcpXHJcbiAgfVxyXG5cclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdmRvbS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgbm9kZS5hcHBlbmRDaGlsZChcclxuICAgICAgY3JlYXRlTm9kZShcclxuICAgICAgICAodmRvbS5jaGlsZHJlbltpXSA9IGdldFZOb2RlKHZkb20uY2hpbGRyZW5baV0pKSxcclxuICAgICAgICBsaXN0ZW5lcixcclxuICAgICAgICBpc1N2Z1xyXG4gICAgICApXHJcbiAgICApXHJcbiAgfVxyXG5cclxuICByZXR1cm4gKHZkb20ubm9kZSA9IG5vZGUpXHJcbn1cclxuXHJcbnZhciBnZXRLZXkgPSBmdW5jdGlvbih2ZG9tKSB7XHJcbiAgcmV0dXJuIHZkb20gPT0gbnVsbCA/IG51bGwgOiB2ZG9tLmtleVxyXG59XHJcblxyXG52YXIgcGF0Y2ggPSBmdW5jdGlvbihwYXJlbnQsIG5vZGUsIG9sZFZOb2RlLCBuZXdWTm9kZSwgbGlzdGVuZXIsIGlzU3ZnKSB7XHJcbiAgaWYgKG9sZFZOb2RlID09PSBuZXdWTm9kZSkge1xyXG4gIH0gZWxzZSBpZiAoXHJcbiAgICBvbGRWTm9kZSAhPSBudWxsICYmXHJcbiAgICBvbGRWTm9kZS50eXBlID09PSBURVhUX05PREUgJiZcclxuICAgIG5ld1ZOb2RlLnR5cGUgPT09IFRFWFRfTk9ERVxyXG4gICkge1xyXG4gICAgaWYgKG9sZFZOb2RlLm5hbWUgIT09IG5ld1ZOb2RlLm5hbWUpIG5vZGUubm9kZVZhbHVlID0gbmV3Vk5vZGUubmFtZVxyXG4gIH0gZWxzZSBpZiAob2xkVk5vZGUgPT0gbnVsbCB8fCBvbGRWTm9kZS5uYW1lICE9PSBuZXdWTm9kZS5uYW1lKSB7XHJcbiAgICBub2RlID0gcGFyZW50Lmluc2VydEJlZm9yZShcclxuICAgICAgY3JlYXRlTm9kZSgobmV3Vk5vZGUgPSBnZXRWTm9kZShuZXdWTm9kZSkpLCBsaXN0ZW5lciwgaXNTdmcpLFxyXG4gICAgICBub2RlXHJcbiAgICApXHJcbiAgICBpZiAob2xkVk5vZGUgIT0gbnVsbCkge1xyXG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQob2xkVk5vZGUubm9kZSlcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgdmFyIHRtcFZLaWRcclxuICAgIHZhciBvbGRWS2lkXHJcblxyXG4gICAgdmFyIG9sZEtleVxyXG4gICAgdmFyIG5ld0tleVxyXG5cclxuICAgIHZhciBvbGRWUHJvcHMgPSBvbGRWTm9kZS5wcm9wc1xyXG4gICAgdmFyIG5ld1ZQcm9wcyA9IG5ld1ZOb2RlLnByb3BzXHJcblxyXG4gICAgdmFyIG9sZFZLaWRzID0gb2xkVk5vZGUuY2hpbGRyZW5cclxuICAgIHZhciBuZXdWS2lkcyA9IG5ld1ZOb2RlLmNoaWxkcmVuXHJcblxyXG4gICAgdmFyIG9sZEhlYWQgPSAwXHJcbiAgICB2YXIgbmV3SGVhZCA9IDBcclxuICAgIHZhciBvbGRUYWlsID0gb2xkVktpZHMubGVuZ3RoIC0gMVxyXG4gICAgdmFyIG5ld1RhaWwgPSBuZXdWS2lkcy5sZW5ndGggLSAxXHJcblxyXG4gICAgaXNTdmcgPSBpc1N2ZyB8fCBuZXdWTm9kZS5uYW1lID09PSBcInN2Z1wiXHJcblxyXG4gICAgZm9yICh2YXIgaSBpbiBtZXJnZShvbGRWUHJvcHMsIG5ld1ZQcm9wcykpIHtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIChpID09PSBcInZhbHVlXCIgfHwgaSA9PT0gXCJzZWxlY3RlZFwiIHx8IGkgPT09IFwiY2hlY2tlZFwiXHJcbiAgICAgICAgICA/IG5vZGVbaV1cclxuICAgICAgICAgIDogb2xkVlByb3BzW2ldKSAhPT0gbmV3VlByb3BzW2ldXHJcbiAgICAgICkge1xyXG4gICAgICAgIHBhdGNoUHJvcGVydHkobm9kZSwgaSwgb2xkVlByb3BzW2ldLCBuZXdWUHJvcHNbaV0sIGxpc3RlbmVyLCBpc1N2ZylcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHdoaWxlIChuZXdIZWFkIDw9IG5ld1RhaWwgJiYgb2xkSGVhZCA8PSBvbGRUYWlsKSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICAob2xkS2V5ID0gZ2V0S2V5KG9sZFZLaWRzW29sZEhlYWRdKSkgPT0gbnVsbCB8fFxyXG4gICAgICAgIG9sZEtleSAhPT0gZ2V0S2V5KG5ld1ZLaWRzW25ld0hlYWRdKVxyXG4gICAgICApIHtcclxuICAgICAgICBicmVha1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwYXRjaChcclxuICAgICAgICBub2RlLFxyXG4gICAgICAgIG9sZFZLaWRzW29sZEhlYWRdLm5vZGUsXHJcbiAgICAgICAgb2xkVktpZHNbb2xkSGVhZF0sXHJcbiAgICAgICAgKG5ld1ZLaWRzW25ld0hlYWRdID0gZ2V0Vk5vZGUoXHJcbiAgICAgICAgICBuZXdWS2lkc1tuZXdIZWFkKytdLFxyXG4gICAgICAgICAgb2xkVktpZHNbb2xkSGVhZCsrXVxyXG4gICAgICAgICkpLFxyXG4gICAgICAgIGxpc3RlbmVyLFxyXG4gICAgICAgIGlzU3ZnXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZSAobmV3SGVhZCA8PSBuZXdUYWlsICYmIG9sZEhlYWQgPD0gb2xkVGFpbCkge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgKG9sZEtleSA9IGdldEtleShvbGRWS2lkc1tvbGRUYWlsXSkpID09IG51bGwgfHxcclxuICAgICAgICBvbGRLZXkgIT09IGdldEtleShuZXdWS2lkc1tuZXdUYWlsXSlcclxuICAgICAgKSB7XHJcbiAgICAgICAgYnJlYWtcclxuICAgICAgfVxyXG5cclxuICAgICAgcGF0Y2goXHJcbiAgICAgICAgbm9kZSxcclxuICAgICAgICBvbGRWS2lkc1tvbGRUYWlsXS5ub2RlLFxyXG4gICAgICAgIG9sZFZLaWRzW29sZFRhaWxdLFxyXG4gICAgICAgIChuZXdWS2lkc1tuZXdUYWlsXSA9IGdldFZOb2RlKFxyXG4gICAgICAgICAgbmV3VktpZHNbbmV3VGFpbC0tXSxcclxuICAgICAgICAgIG9sZFZLaWRzW29sZFRhaWwtLV1cclxuICAgICAgICApKSxcclxuICAgICAgICBsaXN0ZW5lcixcclxuICAgICAgICBpc1N2Z1xyXG4gICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9sZEhlYWQgPiBvbGRUYWlsKSB7XHJcbiAgICAgIHdoaWxlIChuZXdIZWFkIDw9IG5ld1RhaWwpIHtcclxuICAgICAgICBub2RlLmluc2VydEJlZm9yZShcclxuICAgICAgICAgIGNyZWF0ZU5vZGUoXHJcbiAgICAgICAgICAgIChuZXdWS2lkc1tuZXdIZWFkXSA9IGdldFZOb2RlKG5ld1ZLaWRzW25ld0hlYWQrK10pKSxcclxuICAgICAgICAgICAgbGlzdGVuZXIsXHJcbiAgICAgICAgICAgIGlzU3ZnXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICAgKG9sZFZLaWQgPSBvbGRWS2lkc1tvbGRIZWFkXSkgJiYgb2xkVktpZC5ub2RlXHJcbiAgICAgICAgKVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG5ld0hlYWQgPiBuZXdUYWlsKSB7XHJcbiAgICAgIHdoaWxlIChvbGRIZWFkIDw9IG9sZFRhaWwpIHtcclxuICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG9sZFZLaWRzW29sZEhlYWQrK10ubm9kZSlcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZm9yICh2YXIgaSA9IG9sZEhlYWQsIGtleWVkID0ge30sIG5ld0tleWVkID0ge307IGkgPD0gb2xkVGFpbDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKChvbGRLZXkgPSBvbGRWS2lkc1tpXS5rZXkpICE9IG51bGwpIHtcclxuICAgICAgICAgIGtleWVkW29sZEtleV0gPSBvbGRWS2lkc1tpXVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgd2hpbGUgKG5ld0hlYWQgPD0gbmV3VGFpbCkge1xyXG4gICAgICAgIG9sZEtleSA9IGdldEtleSgob2xkVktpZCA9IG9sZFZLaWRzW29sZEhlYWRdKSlcclxuICAgICAgICBuZXdLZXkgPSBnZXRLZXkoXHJcbiAgICAgICAgICAobmV3VktpZHNbbmV3SGVhZF0gPSBnZXRWTm9kZShuZXdWS2lkc1tuZXdIZWFkXSwgb2xkVktpZCkpXHJcbiAgICAgICAgKVxyXG5cclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBuZXdLZXllZFtvbGRLZXldIHx8XHJcbiAgICAgICAgICAobmV3S2V5ICE9IG51bGwgJiYgbmV3S2V5ID09PSBnZXRLZXkob2xkVktpZHNbb2xkSGVhZCArIDFdKSlcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGlmIChvbGRLZXkgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG9sZFZLaWQubm9kZSlcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIG9sZEhlYWQrK1xyXG4gICAgICAgICAgY29udGludWVcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChuZXdLZXkgPT0gbnVsbCB8fCBvbGRWTm9kZS50eXBlID09PSBSRUNZQ0xFRF9OT0RFKSB7XHJcbiAgICAgICAgICBpZiAob2xkS2V5ID09IG51bGwpIHtcclxuICAgICAgICAgICAgcGF0Y2goXHJcbiAgICAgICAgICAgICAgbm9kZSxcclxuICAgICAgICAgICAgICBvbGRWS2lkICYmIG9sZFZLaWQubm9kZSxcclxuICAgICAgICAgICAgICBvbGRWS2lkLFxyXG4gICAgICAgICAgICAgIG5ld1ZLaWRzW25ld0hlYWRdLFxyXG4gICAgICAgICAgICAgIGxpc3RlbmVyLFxyXG4gICAgICAgICAgICAgIGlzU3ZnXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgbmV3SGVhZCsrXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBvbGRIZWFkKytcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKG9sZEtleSA9PT0gbmV3S2V5KSB7XHJcbiAgICAgICAgICAgIHBhdGNoKFxyXG4gICAgICAgICAgICAgIG5vZGUsXHJcbiAgICAgICAgICAgICAgb2xkVktpZC5ub2RlLFxyXG4gICAgICAgICAgICAgIG9sZFZLaWQsXHJcbiAgICAgICAgICAgICAgbmV3VktpZHNbbmV3SGVhZF0sXHJcbiAgICAgICAgICAgICAgbGlzdGVuZXIsXHJcbiAgICAgICAgICAgICAgaXNTdmdcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICBuZXdLZXllZFtuZXdLZXldID0gdHJ1ZVxyXG4gICAgICAgICAgICBvbGRIZWFkKytcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICgodG1wVktpZCA9IGtleWVkW25ld0tleV0pICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICBwYXRjaChcclxuICAgICAgICAgICAgICAgIG5vZGUsXHJcbiAgICAgICAgICAgICAgICBub2RlLmluc2VydEJlZm9yZSh0bXBWS2lkLm5vZGUsIG9sZFZLaWQgJiYgb2xkVktpZC5ub2RlKSxcclxuICAgICAgICAgICAgICAgIHRtcFZLaWQsXHJcbiAgICAgICAgICAgICAgICBuZXdWS2lkc1tuZXdIZWFkXSxcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyLFxyXG4gICAgICAgICAgICAgICAgaXNTdmdcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgbmV3S2V5ZWRbbmV3S2V5XSA9IHRydWVcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBwYXRjaChcclxuICAgICAgICAgICAgICAgIG5vZGUsXHJcbiAgICAgICAgICAgICAgICBvbGRWS2lkICYmIG9sZFZLaWQubm9kZSxcclxuICAgICAgICAgICAgICAgIG51bGwsXHJcbiAgICAgICAgICAgICAgICBuZXdWS2lkc1tuZXdIZWFkXSxcclxuICAgICAgICAgICAgICAgIGxpc3RlbmVyLFxyXG4gICAgICAgICAgICAgICAgaXNTdmdcclxuICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIG5ld0hlYWQrK1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgd2hpbGUgKG9sZEhlYWQgPD0gb2xkVGFpbCkge1xyXG4gICAgICAgIGlmIChnZXRLZXkoKG9sZFZLaWQgPSBvbGRWS2lkc1tvbGRIZWFkKytdKSkgPT0gbnVsbCkge1xyXG4gICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChvbGRWS2lkLm5vZGUpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKHZhciBpIGluIGtleWVkKSB7XHJcbiAgICAgICAgaWYgKG5ld0tleWVkW2ldID09IG51bGwpIHtcclxuICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQoa2V5ZWRbaV0ubm9kZSlcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiAobmV3Vk5vZGUubm9kZSA9IG5vZGUpXHJcbn1cclxuXHJcbnZhciBwcm9wc0NoYW5nZWQgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgZm9yICh2YXIgayBpbiBhKSBpZiAoYVtrXSAhPT0gYltrXSkgcmV0dXJuIHRydWVcclxuICBmb3IgKHZhciBrIGluIGIpIGlmIChhW2tdICE9PSBiW2tdKSByZXR1cm4gdHJ1ZVxyXG59XHJcblxyXG52YXIgZ2V0VGV4dFZOb2RlID0gZnVuY3Rpb24obm9kZSkge1xyXG4gIHJldHVybiB0eXBlb2Ygbm9kZSA9PT0gXCJvYmplY3RcIiA/IG5vZGUgOiBjcmVhdGVUZXh0Vk5vZGUobm9kZSlcclxufVxyXG5cclxudmFyIGdldFZOb2RlID0gZnVuY3Rpb24obmV3Vk5vZGUsIG9sZFZOb2RlKSB7XHJcbiAgcmV0dXJuIG5ld1ZOb2RlLnR5cGUgPT09IExBWllfTk9ERVxyXG4gICAgPyAoKCFvbGRWTm9kZSB8fCAhb2xkVk5vZGUubGF6eSB8fCBwcm9wc0NoYW5nZWQob2xkVk5vZGUubGF6eSwgbmV3Vk5vZGUubGF6eSkpXHJcbiAgICAgICAgJiYgKChvbGRWTm9kZSA9IGdldFRleHRWTm9kZShuZXdWTm9kZS5sYXp5LnZpZXcobmV3Vk5vZGUubGF6eSkpKS5sYXp5ID1cclxuICAgICAgICAgIG5ld1ZOb2RlLmxhenkpLFxyXG4gICAgICBvbGRWTm9kZSlcclxuICAgIDogbmV3Vk5vZGVcclxufVxyXG5cclxudmFyIGNyZWF0ZVZOb2RlID0gZnVuY3Rpb24obmFtZSwgcHJvcHMsIGNoaWxkcmVuLCBub2RlLCBrZXksIHR5cGUpIHtcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogbmFtZSxcclxuICAgIHByb3BzOiBwcm9wcyxcclxuICAgIGNoaWxkcmVuOiBjaGlsZHJlbixcclxuICAgIG5vZGU6IG5vZGUsXHJcbiAgICB0eXBlOiB0eXBlLFxyXG4gICAga2V5OiBrZXlcclxuICB9XHJcbn1cclxuXHJcbnZhciBjcmVhdGVUZXh0Vk5vZGUgPSBmdW5jdGlvbih2YWx1ZSwgbm9kZSkge1xyXG4gIHJldHVybiBjcmVhdGVWTm9kZSh2YWx1ZSwgRU1QVFlfT0JKLCBFTVBUWV9BUlIsIG5vZGUsIHVuZGVmaW5lZCwgVEVYVF9OT0RFKVxyXG59XHJcblxyXG52YXIgcmVjeWNsZU5vZGUgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IFRFWFRfTk9ERVxyXG4gICAgPyBjcmVhdGVUZXh0Vk5vZGUobm9kZS5ub2RlVmFsdWUsIG5vZGUpXHJcbiAgICA6IGNyZWF0ZVZOb2RlKFxyXG4gICAgICAgIG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICBFTVBUWV9PQkosXHJcbiAgICAgICAgbWFwLmNhbGwobm9kZS5jaGlsZE5vZGVzLCByZWN5Y2xlTm9kZSksXHJcbiAgICAgICAgbm9kZSxcclxuICAgICAgICB1bmRlZmluZWQsXHJcbiAgICAgICAgUkVDWUNMRURfTk9ERVxyXG4gICAgICApXHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgTGF6eSA9IGZ1bmN0aW9uKHByb3BzKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGxhenk6IHByb3BzLFxyXG4gICAgdHlwZTogTEFaWV9OT0RFXHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIGggPSBmdW5jdGlvbihuYW1lLCBwcm9wcykge1xyXG4gIGZvciAodmFyIHZkb20sIHJlc3QgPSBbXSwgY2hpbGRyZW4gPSBbXSwgaSA9IGFyZ3VtZW50cy5sZW5ndGg7IGktLSA+IDI7ICkge1xyXG4gICAgcmVzdC5wdXNoKGFyZ3VtZW50c1tpXSlcclxuICB9XHJcblxyXG4gIHdoaWxlIChyZXN0Lmxlbmd0aCA+IDApIHtcclxuICAgIGlmIChpc0FycmF5KCh2ZG9tID0gcmVzdC5wb3AoKSkpKSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSB2ZG9tLmxlbmd0aDsgaS0tID4gMDsgKSB7XHJcbiAgICAgICAgcmVzdC5wdXNoKHZkb21baV0pXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAodmRvbSA9PT0gZmFsc2UgfHwgdmRvbSA9PT0gdHJ1ZSB8fCB2ZG9tID09IG51bGwpIHtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0VGV4dFZOb2RlKHZkb20pKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJvcHMgPSBwcm9wcyB8fCBFTVBUWV9PQkpcclxuXHJcbiAgcmV0dXJuIHR5cGVvZiBuYW1lID09PSBcImZ1bmN0aW9uXCJcclxuICAgID8gbmFtZShwcm9wcywgY2hpbGRyZW4pXHJcbiAgICA6IGNyZWF0ZVZOb2RlKG5hbWUsIHByb3BzLCBjaGlsZHJlbiwgdW5kZWZpbmVkLCBwcm9wcy5rZXkpXHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgYXBwID0gZnVuY3Rpb24ocHJvcHMpIHtcclxuICB2YXIgc3RhdGUgPSB7fVxyXG4gIHZhciBsb2NrID0gZmFsc2VcclxuICB2YXIgdmlldyA9IHByb3BzLnZpZXdcclxuICB2YXIgbm9kZSA9IHByb3BzLm5vZGVcclxuICB2YXIgdmRvbSA9IG5vZGUgJiYgcmVjeWNsZU5vZGUobm9kZSlcclxuICB2YXIgc3Vic2NyaXB0aW9ucyA9IHByb3BzLnN1YnNjcmlwdGlvbnNcclxuICB2YXIgc3VicyA9IFtdXHJcbiAgdmFyIG9uRW5kID0gcHJvcHMub25FbmRcclxuXHJcbiAgdmFyIGxpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIGRpc3BhdGNoKHRoaXMuYWN0aW9uc1tldmVudC50eXBlXSwgZXZlbnQpXHJcbiAgfVxyXG5cclxuICB2YXIgc2V0U3RhdGUgPSBmdW5jdGlvbihuZXdTdGF0ZSkge1xyXG4gICAgaWYgKHN0YXRlICE9PSBuZXdTdGF0ZSkge1xyXG4gICAgICBzdGF0ZSA9IG5ld1N0YXRlXHJcbiAgICAgIGlmIChzdWJzY3JpcHRpb25zKSB7XHJcbiAgICAgICAgc3VicyA9IHBhdGNoU3VicyhzdWJzLCBiYXRjaChbc3Vic2NyaXB0aW9ucyhzdGF0ZSldKSwgZGlzcGF0Y2gpXHJcbiAgICAgIH1cclxuICAgICAgaWYgKHZpZXcgJiYgIWxvY2spIGRlZmVyKHJlbmRlciwgKGxvY2sgPSB0cnVlKSlcclxuICAgIH1cclxuICAgIHJldHVybiBzdGF0ZVxyXG4gIH1cclxuXHJcbiAgdmFyIGRpc3BhdGNoID0gKHByb3BzLm1pZGRsZXdhcmUgfHxcclxuICAgIGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICByZXR1cm4gb2JqXHJcbiAgICB9KShmdW5jdGlvbihhY3Rpb24sIHByb3BzKSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIGFjdGlvbiA9PT0gXCJmdW5jdGlvblwiXHJcbiAgICAgID8gZGlzcGF0Y2goYWN0aW9uKHN0YXRlLCBwcm9wcykpXHJcbiAgICAgIDogaXNBcnJheShhY3Rpb24pXHJcbiAgICAgID8gdHlwZW9mIGFjdGlvblswXSA9PT0gXCJmdW5jdGlvblwiIHx8IGlzQXJyYXkoYWN0aW9uWzBdKVxyXG4gICAgICAgID8gZGlzcGF0Y2goXHJcbiAgICAgICAgICAgIGFjdGlvblswXSxcclxuICAgICAgICAgICAgdHlwZW9mIGFjdGlvblsxXSA9PT0gXCJmdW5jdGlvblwiID8gYWN0aW9uWzFdKHByb3BzKSA6IGFjdGlvblsxXVxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIDogKGJhdGNoKGFjdGlvbi5zbGljZSgxKSkubWFwKGZ1bmN0aW9uKGZ4KSB7XHJcbiAgICAgICAgICAgIGZ4ICYmIGZ4WzBdKGRpc3BhdGNoLCBmeFsxXSlcclxuICAgICAgICAgIH0sIHNldFN0YXRlKGFjdGlvblswXSkpLFxyXG4gICAgICAgICAgc3RhdGUpXHJcbiAgICAgIDogc2V0U3RhdGUoYWN0aW9uKVxyXG4gIH0pXHJcblxyXG4gIHZhciByZW5kZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIGxvY2sgPSBmYWxzZVxyXG4gICAgbm9kZSA9IHBhdGNoKFxyXG4gICAgICBub2RlLnBhcmVudE5vZGUsXHJcbiAgICAgIG5vZGUsXHJcbiAgICAgIHZkb20sXHJcbiAgICAgICh2ZG9tID0gZ2V0VGV4dFZOb2RlKHZpZXcoc3RhdGUpKSksXHJcbiAgICAgIGxpc3RlbmVyXHJcbiAgICApXHJcbiAgICBvbkVuZCgpXHJcbiAgfVxyXG5cclxuICBkaXNwYXRjaChwcm9wcy5pbml0KVxyXG59XHJcbiIsInZhciB0aW1lRnggPSBmdW5jdGlvbiAoZng6IGFueSkge1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiAoXHJcbiAgICAgICAgYWN0aW9uOiBhbnksXHJcbiAgICAgICAgcHJvcHM6IGFueSkge1xyXG5cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICBmeCxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBkZWxheTogcHJvcHMuZGVsYXlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF07XHJcbiAgICB9O1xyXG59O1xyXG5cclxuZXhwb3J0IHZhciB0aW1lb3V0ID0gdGltZUZ4KFxyXG5cclxuICAgIGZ1bmN0aW9uIChcclxuICAgICAgICBkaXNwYXRjaDogYW55LFxyXG4gICAgICAgIHByb3BzOiBhbnkpIHtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGRpc3BhdGNoKHByb3BzLmFjdGlvbik7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByb3BzLmRlbGF5XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuKTtcclxuXHJcbmV4cG9ydCB2YXIgaW50ZXJ2YWwgPSB0aW1lRngoXHJcblxyXG4gICAgZnVuY3Rpb24gKFxyXG4gICAgICAgIGRpc3BhdGNoOiBhbnksXHJcbiAgICAgICAgcHJvcHM6IGFueSkge1xyXG5cclxuICAgICAgICB2YXIgaWQgPSBzZXRJbnRlcnZhbChcclxuICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBkaXNwYXRjaChcclxuICAgICAgICAgICAgICAgICAgICBwcm9wcy5hY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgRGF0ZS5ub3coKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJvcHMuZGVsYXlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpZCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuKTtcclxuXHJcblxyXG4vLyBleHBvcnQgdmFyIG5vd1xyXG4vLyBleHBvcnQgdmFyIHJldHJ5XHJcbi8vIGV4cG9ydCB2YXIgZGVib3VuY2VcclxuLy8gZXhwb3J0IHZhciB0aHJvdHRsZVxyXG4vLyBleHBvcnQgdmFyIGlkbGVDYWxsYmFjaz9cclxuIiwiXHJcbmltcG9ydCBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wcyBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9odHRwL0lIdHRwQXV0aGVudGljYXRlZFByb3BzXCI7XHJcbmltcG9ydCBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wc0Jsb2NrIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2h0dHAvSUh0dHBBdXRoZW50aWNhdGVkUHJvcHNCbG9ja1wiO1xyXG5pbXBvcnQgeyBJSHR0cEZldGNoSXRlbSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2h0dHAvSUh0dHBGZXRjaEl0ZW1cIjtcclxuaW1wb3J0IElIdHRwT3V0cHV0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2h0dHAvSUh0dHBPdXRwdXRcIjtcclxuaW1wb3J0IHsgSUh0dHBTZXF1ZW50aWFsRmV0Y2hJdGVtIH0gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvaHR0cC9JSHR0cFNlcXVlbnRpYWxGZXRjaEl0ZW1cIjtcclxuXHJcbmNvbnN0IHNlcXVlbnRpYWxIdHRwRWZmZWN0ID0gKFxyXG4gICAgZGlzcGF0Y2g6IGFueSxcclxuICAgIHNlcXVlbnRpYWxCbG9ja3M6IEFycmF5PElIdHRwQXV0aGVudGljYXRlZFByb3BzQmxvY2s+KTogdm9pZCA9PiB7XHJcblxyXG4gICAgLy8gRWFjaCBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wc0Jsb2NrIHdpbGwgcnVuIHNlcXVlbnRpYWxseVxyXG4gICAgLy8gRWFjaCBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wcyBpbiBlYWNoIGJsb2NrIHdpbGwgcnVubiBpbiBwYXJhbGxlbFxyXG4gICAgbGV0IGJsb2NrOiBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wc0Jsb2NrO1xyXG4gICAgbGV0IHN1Y2Nlc3M6IGJvb2xlYW4gPSB0cnVlO1xyXG4gICAgbGV0IGh0dHBDYWxsOiBhbnk7XHJcbiAgICBsZXQgbGFzdEh0dHBDYWxsOiBhbnk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IHNlcXVlbnRpYWxCbG9ja3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuXHJcbiAgICAgICAgYmxvY2sgPSBzZXF1ZW50aWFsQmxvY2tzW2ldO1xyXG5cclxuICAgICAgICBpZiAoYmxvY2sgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGJsb2NrKSkge1xyXG5cclxuICAgICAgICAgICAgaHR0cENhbGwgPSB7XHJcbiAgICAgICAgICAgICAgICBkZWxlZ2F0ZTogcHJvY2Vzc0Jsb2NrLFxyXG4gICAgICAgICAgICAgICAgZGlzcGF0Y2g6IGRpc3BhdGNoLFxyXG4gICAgICAgICAgICAgICAgYmxvY2s6IGJsb2NrLFxyXG4gICAgICAgICAgICAgICAgaW5kZXg6IGAke2l9YFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBodHRwQ2FsbCA9IHtcclxuICAgICAgICAgICAgICAgIGRlbGVnYXRlOiBwcm9jZXNzUHJvcHMsXHJcbiAgICAgICAgICAgICAgICBkaXNwYXRjaDogZGlzcGF0Y2gsXHJcbiAgICAgICAgICAgICAgICBibG9jazogYmxvY2ssXHJcbiAgICAgICAgICAgICAgICBpbmRleDogYCR7aX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghc3VjY2Vzcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobGFzdEh0dHBDYWxsKSB7XHJcblxyXG4gICAgICAgICAgICBodHRwQ2FsbC5uZXh0SHR0cENhbGwgPSBsYXN0SHR0cENhbGw7XHJcbiAgICAgICAgICAgIGh0dHBDYWxsLm5leHRJbmRleCA9IGxhc3RIdHRwQ2FsbC5pbmRleDtcclxuICAgICAgICAgICAgaHR0cENhbGwubmV4dEJsb2NrID0gbGFzdEh0dHBDYWxsLmJsb2NrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGFzdEh0dHBDYWxsID0gaHR0cENhbGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGh0dHBDYWxsKSB7XHJcblxyXG4gICAgICAgIGh0dHBDYWxsLmRlbGVnYXRlKFxyXG4gICAgICAgICAgICBodHRwQ2FsbC5kaXNwYXRjaCxcclxuICAgICAgICAgICAgaHR0cENhbGwuYmxvY2ssXHJcbiAgICAgICAgICAgIGh0dHBDYWxsLm5leHRIdHRwQ2FsbCxcclxuICAgICAgICAgICAgaHR0cENhbGwuaW5kZXhcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5jb25zdCBwcm9jZXNzQmxvY2sgPSAoXHJcbiAgICBkaXNwYXRjaDogYW55LFxyXG4gICAgYmxvY2s6IElIdHRwQXV0aGVudGljYXRlZFByb3BzQmxvY2ssXHJcbiAgICBuZXh0RGVsZWdhdGU6IGFueSk6IHZvaWQgPT4ge1xyXG5cclxuICAgIGxldCBwYXJhbGxlbFByb3BzOiBBcnJheTxJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wcz4gPSBibG9jayBhcyBBcnJheTxJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wcz47XHJcbiAgICBjb25zdCBkZWxlZ2F0ZXM6IGFueVtdID0gW107XHJcbiAgICBsZXQgcHJvcHM6IElIdHRwQXV0aGVudGljYXRlZFByb3BzO1xyXG5cclxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFyYWxsZWxQcm9wcy5sZW5ndGg7IGorKykge1xyXG5cclxuICAgICAgICBwcm9wcyA9IHBhcmFsbGVsUHJvcHNbal07XHJcblxyXG4gICAgICAgIGRlbGVnYXRlcy5wdXNoKFxyXG4gICAgICAgICAgICBwcm9jZXNzUHJvcHMoXHJcbiAgICAgICAgICAgICAgICBkaXNwYXRjaCxcclxuICAgICAgICAgICAgICAgIHByb3BzLFxyXG4gICAgICAgICAgICAgICAgbmV4dERlbGVnYXRlLFxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgUHJvbWlzZVxyXG4gICAgICAgICAgICAuYWxsKGRlbGVnYXRlcylcclxuICAgICAgICAgICAgLnRoZW4oKVxyXG4gICAgICAgICAgICAuY2F0Y2goKTtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IHByb2Nlc3NQcm9wcyA9IChcclxuICAgIGRpc3BhdGNoOiBhbnksXHJcbiAgICBwcm9wczogSUh0dHBBdXRoZW50aWNhdGVkUHJvcHMsXHJcbiAgICBuZXh0RGVsZWdhdGU6IGFueSk6IHZvaWQgPT4ge1xyXG5cclxuICAgIGlmICghcHJvcHMpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgb3V0cHV0OiBJSHR0cE91dHB1dCA9IHtcclxuICAgICAgICBvazogZmFsc2UsXHJcbiAgICAgICAgdXJsOiBwcm9wcy51cmwsXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25GYWlsOiBmYWxzZSxcclxuICAgICAgICBwYXJzZVR5cGU6IFwidGV4dFwiLFxyXG4gICAgfTtcclxuXHJcbiAgICBodHRwKFxyXG4gICAgICAgIGRpc3BhdGNoLFxyXG4gICAgICAgIHByb3BzLFxyXG4gICAgICAgIG91dHB1dCxcclxuICAgICAgICBuZXh0RGVsZWdhdGVcclxuICAgICk7XHJcbn07XHJcblxyXG5jb25zdCBodHRwRWZmZWN0ID0gKFxyXG4gICAgZGlzcGF0Y2g6IGFueSxcclxuICAgIHByb3BzOiBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wc1xyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoIXByb3BzKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG91dHB1dDogSUh0dHBPdXRwdXQgPSB7XHJcbiAgICAgICAgb2s6IGZhbHNlLFxyXG4gICAgICAgIHVybDogcHJvcHMudXJsLFxyXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uRmFpbDogZmFsc2UsXHJcbiAgICAgICAgcGFyc2VUeXBlOiBwcm9wcy5wYXJzZVR5cGUgPz8gJ2pzb24nLFxyXG4gICAgfTtcclxuXHJcbiAgICBodHRwKFxyXG4gICAgICAgIGRpc3BhdGNoLFxyXG4gICAgICAgIHByb3BzLFxyXG4gICAgICAgIG91dHB1dFxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IGh0dHAgPSAoXHJcbiAgICBkaXNwYXRjaDogYW55LFxyXG4gICAgcHJvcHM6IElIdHRwQXV0aGVudGljYXRlZFByb3BzLFxyXG4gICAgb3V0cHV0OiBJSHR0cE91dHB1dCxcclxuICAgIG5leHREZWxlZ2F0ZTogYW55ID0gbnVsbCk6IHZvaWQgPT4ge1xyXG5cclxuICAgIGZldGNoKFxyXG4gICAgICAgIHByb3BzLnVybCxcclxuICAgICAgICBwcm9wcy5vcHRpb25zKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgb3V0cHV0Lm9rID0gcmVzcG9uc2Uub2sgPT09IHRydWU7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQuc3RhdHVzID0gcmVzcG9uc2Uuc3RhdHVzO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0LnR5cGUgPSByZXNwb25zZS50eXBlO1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0LnJlZGlyZWN0ZWQgPSByZXNwb25zZS5yZWRpcmVjdGVkO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5oZWFkZXJzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5jYWxsSUQgPSByZXNwb25zZS5oZWFkZXJzLmdldChcIkNhbGxJRFwiKSBhcyBzdHJpbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LmNvbnRlbnRUeXBlID0gcmVzcG9uc2UuaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIikgYXMgc3RyaW5nO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3V0cHV0LmNvbnRlbnRUeXBlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIG91dHB1dC5jb250ZW50VHlwZS5pbmRleE9mKFwiYXBwbGljYXRpb24vanNvblwiKSAhPT0gLTEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wYXJzZVR5cGUgPSBcImpzb25cIjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gNDAxKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5hdXRoZW50aWNhdGlvbkZhaWwgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaChcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMub25BdXRoZW50aWNhdGlvbkZhaWxBY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG91dHB1dC5yZXNwb25zZU51bGwgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcG9uc2U6IGFueSkge1xyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQuZXJyb3IgKz0gYEVycm9yIHRocm93biB3aXRoIHJlc3BvbnNlLnRleHQoKVxyXG5gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XHJcblxyXG4gICAgICAgICAgICBvdXRwdXQudGV4dERhdGEgPSByZXN1bHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0XHJcbiAgICAgICAgICAgICAgICAmJiBvdXRwdXQucGFyc2VUeXBlID09PSAnanNvbidcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuanNvbkRhdGEgPSBKU09OLnBhcnNlKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LmVycm9yICs9IGBFcnJvciB0aHJvd24gcGFyc2luZyByZXNwb25zZS50ZXh0KCkgYXMganNvblxyXG5gO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIW91dHB1dC5vaykge1xyXG5cclxuICAgICAgICAgICAgICAgIHRocm93IHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZGlzcGF0Y2goXHJcbiAgICAgICAgICAgICAgICBwcm9wcy5hY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBvdXRwdXRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChuZXh0RGVsZWdhdGUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dERlbGVnYXRlLmRlbGVnYXRlKFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHREZWxlZ2F0ZS5kaXNwYXRjaCxcclxuICAgICAgICAgICAgICAgICAgICBuZXh0RGVsZWdhdGUuYmxvY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dERlbGVnYXRlLm5leHRIdHRwQ2FsbCxcclxuICAgICAgICAgICAgICAgICAgICBuZXh0RGVsZWdhdGUuaW5kZXhcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcclxuXHJcbiAgICAgICAgICAgIG91dHB1dC5lcnJvciArPSBlcnJvcjtcclxuXHJcbiAgICAgICAgICAgIGRpc3BhdGNoKFxyXG4gICAgICAgICAgICAgICAgcHJvcHMuZXJyb3IsXHJcbiAgICAgICAgICAgICAgICBvdXRwdXRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGdIdHRwID0gKHByb3BzOiBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wcyk6IElIdHRwRmV0Y2hJdGVtID0+IHtcclxuXHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIGh0dHBFZmZlY3QsXHJcbiAgICAgICAgcHJvcHNcclxuICAgIF1cclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGdTZXF1ZW50aWFsSHR0cCA9IChwcm9wc0Jsb2NrOiBBcnJheTxJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wc0Jsb2NrPik6IElIdHRwU2VxdWVudGlhbEZldGNoSXRlbSA9PiB7XHJcblxyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICBzZXF1ZW50aWFsSHR0cEVmZmVjdCxcclxuICAgICAgICBwcm9wc0Jsb2NrXHJcbiAgICBdXHJcbn1cclxuIiwiXHJcbmNvbnN0IEtleXMgPSB7XHJcblxyXG4gICAgc3RhcnRVcmw6ICdzdGFydFVybCcsXHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEtleXM7XHJcblxyXG4iLCJpbXBvcnQgeyBQYXJzZVR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9QYXJzZVR5cGVcIjtcclxuaW1wb3J0IElIdHRwRWZmZWN0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2VmZmVjdHMvSUh0dHBFZmZlY3RcIjtcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IElTdGF0ZUFueUFycmF5IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZUFueUFycmF5XCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSHR0cEVmZmVjdCBpbXBsZW1lbnRzIElIdHRwRWZmZWN0IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBuYW1lOiBzdHJpbmcsXHJcbiAgICAgICAgdXJsOiBzdHJpbmcsXHJcbiAgICAgICAgcGFyc2VUeXBlOiBQYXJzZVR5cGUsXHJcbiAgICAgICAgYWN0aW9uRGVsZWdhdGU6IChzdGF0ZTogSVN0YXRlLCByZXNwb25zZTogYW55KSA9PiBJU3RhdGVBbnlBcnJheSkge1xyXG5cclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG4gICAgICAgIHRoaXMucGFyc2VUeXBlID0gcGFyc2VUeXBlO1xyXG4gICAgICAgIHRoaXMuYWN0aW9uRGVsZWdhdGUgPSBhY3Rpb25EZWxlZ2F0ZTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbmFtZTogc3RyaW5nO1xyXG4gICAgcHVibGljIHVybDogc3RyaW5nO1xyXG4gICAgcHVibGljIHBhcnNlVHlwZTogUGFyc2VUeXBlO1xyXG4gICAgcHVibGljIGFjdGlvbkRlbGVnYXRlOiAoc3RhdGU6IElTdGF0ZSwgcmVzcG9uc2U6IGFueSkgPT4gSVN0YXRlQW55QXJyYXk7XHJcbn1cclxuIiwiXHJcblxyXG5jb25zdCBnVXRpbGl0aWVzID0ge1xyXG5cclxuICAgIHJvdW5kVXBUb05lYXJlc3RUZW46ICh2YWx1ZTogbnVtYmVyKSA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGZsb29yID0gTWF0aC5mbG9vcih2YWx1ZSAvIDEwKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIChmbG9vciArIDEpICogMTA7XHJcbiAgICB9LFxyXG5cclxuICAgIHJvdW5kRG93blRvTmVhcmVzdFRlbjogKHZhbHVlOiBudW1iZXIpID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgZmxvb3IgPSBNYXRoLmZsb29yKHZhbHVlIC8gMTApO1xyXG5cclxuICAgICAgICByZXR1cm4gZmxvb3IgKiAxMDtcclxuICAgIH0sXHJcblxyXG4gICAgY29udmVydE1tVG9GZWV0SW5jaGVzOiAobW06IG51bWJlcik6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGluY2hlcyA9IG1tICogMC4wMzkzNztcclxuXHJcbiAgICAgICAgcmV0dXJuIGdVdGlsaXRpZXMuY29udmVydEluY2hlc1RvRmVldEluY2hlcyhpbmNoZXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpbmRleE9mQW55OiAoXHJcbiAgICAgICAgaW5wdXQ6IHN0cmluZyxcclxuICAgICAgICBjaGFyczogc3RyaW5nW10sXHJcbiAgICAgICAgc3RhcnRJbmRleCA9IDBcclxuICAgICk6IG51bWJlciA9PiB7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgaW5wdXQubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGFycy5pbmNsdWRlcyhpbnB1dFtpXSkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXREaXJlY3Rvcnk6IChmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgdmFyIG1hdGNoZXMgPSBmaWxlUGF0aC5tYXRjaCgvKC4qKVtcXC9cXFxcXS8pO1xyXG5cclxuICAgICAgICBpZiAobWF0Y2hlc1xyXG4gICAgICAgICAgICAmJiBtYXRjaGVzLmxlbmd0aCA+IDBcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXNbMV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvdW50Q2hhcmFjdGVyOiAoXHJcbiAgICAgICAgaW5wdXQ6IHN0cmluZyxcclxuICAgICAgICBjaGFyYWN0ZXI6IHN0cmluZykgPT4ge1xyXG5cclxuICAgICAgICBsZXQgbGVuZ3RoID0gaW5wdXQubGVuZ3RoO1xyXG4gICAgICAgIGxldCBjb3VudCA9IDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChpbnB1dFtpXSA9PT0gY2hhcmFjdGVyKSB7XHJcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY291bnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbnZlcnRJbmNoZXNUb0ZlZXRJbmNoZXM6IChpbmNoZXM6IG51bWJlcik6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGZlZXQgPSBNYXRoLmZsb29yKGluY2hlcyAvIDEyKTtcclxuICAgICAgICBjb25zdCBpbmNoZXNSZWFtaW5pbmcgPSBpbmNoZXMgJSAxMjtcclxuICAgICAgICBjb25zdCBpbmNoZXNSZWFtaW5pbmdSb3VuZGVkID0gTWF0aC5yb3VuZChpbmNoZXNSZWFtaW5pbmcgKiAxMCkgLyAxMDsgLy8gMSBkZWNpbWFsIHBsYWNlc1xyXG5cclxuICAgICAgICBsZXQgcmVzdWx0OiBzdHJpbmcgPSBcIlwiO1xyXG5cclxuICAgICAgICBpZiAoZmVldCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGAke2ZlZXR9JyBgO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGluY2hlc1JlYW1pbmluZ1JvdW5kZWQgPiAwKSB7XHJcblxyXG4gICAgICAgICAgICByZXN1bHQgPSBgJHtyZXN1bHR9JHtpbmNoZXNSZWFtaW5pbmdSb3VuZGVkfVwiYDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzTnVsbE9yV2hpdGVTcGFjZTogKGlucHV0OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIGlmIChpbnB1dCA9PT0gbnVsbFxyXG4gICAgICAgICAgICB8fCBpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlucHV0ID0gYCR7aW5wdXR9YDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGlucHV0Lm1hdGNoKC9eXFxzKiQvKSAhPT0gbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgY2hlY2tBcnJheXNFcXVhbDogKGE6IHN0cmluZ1tdLCBiOiBzdHJpbmdbXSk6IGJvb2xlYW4gPT4ge1xyXG5cclxuICAgICAgICBpZiAoYSA9PT0gYikge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYSA9PT0gbnVsbFxyXG4gICAgICAgICAgICB8fCBiID09PSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiB5b3UgZG9uJ3QgY2FyZSBhYm91dCB0aGUgb3JkZXIgb2YgdGhlIGVsZW1lbnRzIGluc2lkZVxyXG4gICAgICAgIC8vIHRoZSBhcnJheSwgeW91IHNob3VsZCBzb3J0IGJvdGggYXJyYXlzIGhlcmUuXHJcbiAgICAgICAgLy8gUGxlYXNlIG5vdGUgdGhhdCBjYWxsaW5nIHNvcnQgb24gYW4gYXJyYXkgd2lsbCBtb2RpZnkgdGhhdCBhcnJheS5cclxuICAgICAgICAvLyB5b3UgbWlnaHQgd2FudCB0byBjbG9uZSB5b3VyIGFycmF5IGZpcnN0LlxyXG5cclxuICAgICAgICBjb25zdCB4OiBzdHJpbmdbXSA9IFsuLi5hXTtcclxuICAgICAgICBjb25zdCB5OiBzdHJpbmdbXSA9IFsuLi5iXTtcclxuXHJcbiAgICAgICAgeC5zb3J0KCk7XHJcbiAgICAgICAgeS5zb3J0KCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgaWYgKHhbaV0gIT09IHlbaV0pIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaHVmZmxlKGFycmF5OiBBcnJheTxhbnk+KTogQXJyYXk8YW55PiB7XHJcblxyXG4gICAgICAgIGxldCBjdXJyZW50SW5kZXggPSBhcnJheS5sZW5ndGg7XHJcbiAgICAgICAgbGV0IHRlbXBvcmFyeVZhbHVlOiBhbnlcclxuICAgICAgICBsZXQgcmFuZG9tSW5kZXg6IG51bWJlcjtcclxuXHJcbiAgICAgICAgLy8gV2hpbGUgdGhlcmUgcmVtYWluIGVsZW1lbnRzIHRvIHNodWZmbGUuLi5cclxuICAgICAgICB3aGlsZSAoMCAhPT0gY3VycmVudEluZGV4KSB7XHJcblxyXG4gICAgICAgICAgICAvLyBQaWNrIGEgcmVtYWluaW5nIGVsZW1lbnQuLi5cclxuICAgICAgICAgICAgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjdXJyZW50SW5kZXgpO1xyXG4gICAgICAgICAgICBjdXJyZW50SW5kZXggLT0gMTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFuZCBzd2FwIGl0IHdpdGggdGhlIGN1cnJlbnQgZWxlbWVudC5cclxuICAgICAgICAgICAgdGVtcG9yYXJ5VmFsdWUgPSBhcnJheVtjdXJyZW50SW5kZXhdO1xyXG4gICAgICAgICAgICBhcnJheVtjdXJyZW50SW5kZXhdID0gYXJyYXlbcmFuZG9tSW5kZXhdO1xyXG4gICAgICAgICAgICBhcnJheVtyYW5kb21JbmRleF0gPSB0ZW1wb3JhcnlWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBhcnJheTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNOdW1lcmljOiAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4ge1xyXG5cclxuICAgICAgICBpZiAoZ1V0aWxpdGllcy5pc051bGxPcldoaXRlU3BhY2UoaW5wdXQpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gIWlzTmFOKGlucHV0KTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNOZWdhdGl2ZU51bWVyaWM6IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIGlmICghZ1V0aWxpdGllcy5pc051bWVyaWMoaW5wdXQpKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gK2lucHV0IDwgMDsgLy8gKyBjb252ZXJ0cyBhIHN0cmluZyB0byBhIG51bWJlciBpZiBpdCBjb25zaXN0cyBvbmx5IG9mIGRpZ2l0cy5cclxuICAgIH0sXHJcblxyXG4gICAgaGFzRHVwbGljYXRlczogPFQ+KGlucHV0OiBBcnJheTxUPik6IGJvb2xlYW4gPT4ge1xyXG5cclxuICAgICAgICBpZiAobmV3IFNldChpbnB1dCkuc2l6ZSAhPT0gaW5wdXQubGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgZXh0ZW5kOiA8VD4oYXJyYXkxOiBBcnJheTxUPiwgYXJyYXkyOiBBcnJheTxUPik6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBhcnJheTIuZm9yRWFjaCgoaXRlbTogVCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgYXJyYXkxLnB1c2goaXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXR0eVByaW50SnNvbkZyb21TdHJpbmc6IChpbnB1dDogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIGlmICghaW5wdXQpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdVdGlsaXRpZXMucHJldHR5UHJpbnRKc29uRnJvbU9iamVjdChKU09OLnBhcnNlKGlucHV0KSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXR0eVByaW50SnNvbkZyb21PYmplY3Q6IChpbnB1dDogb2JqZWN0IHwgbnVsbCk6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIGlmICghaW5wdXQpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KFxyXG4gICAgICAgICAgICBpbnB1dCxcclxuICAgICAgICAgICAgbnVsbCxcclxuICAgICAgICAgICAgNCAvLyBpbmRlbnRlZCA0IHNwYWNlc1xyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzUG9zaXRpdmVOdW1lcmljOiAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4ge1xyXG5cclxuICAgICAgICBpZiAoIWdVdGlsaXRpZXMuaXNOdW1lcmljKGlucHV0KSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIE51bWJlcihpbnB1dCkgPj0gMDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0VGltZTogKCk6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IG5vdzogRGF0ZSA9IG5ldyBEYXRlKERhdGUubm93KCkpO1xyXG4gICAgICAgIGNvbnN0IHRpbWU6IHN0cmluZyA9IGAke25vdy5nZXRGdWxsWWVhcigpfS0keyhub3cuZ2V0TW9udGgoKSArIDEpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX0tJHtub3cuZ2V0RGF0ZSgpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX0gJHtub3cuZ2V0SG91cnMoKS50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9OiR7bm93LmdldE1pbnV0ZXMoKS50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9OiR7bm93LmdldFNlY29uZHMoKS50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9Ojoke25vdy5nZXRNaWxsaXNlY29uZHMoKS50b1N0cmluZygpLnBhZFN0YXJ0KDMsICcwJyl9OmA7XHJcblxyXG4gICAgICAgIHJldHVybiB0aW1lO1xyXG4gICAgfSxcclxuXHJcbiAgICBzcGxpdEJ5TmV3TGluZTogKGlucHV0OiBzdHJpbmcpOiBBcnJheTxzdHJpbmc+ID0+IHtcclxuXHJcbiAgICAgICAgaWYgKGdVdGlsaXRpZXMuaXNOdWxsT3JXaGl0ZVNwYWNlKGlucHV0KSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGlucHV0LnNwbGl0KC9bXFxyXFxuXSsvKTtcclxuICAgICAgICBjb25zdCBjbGVhbmVkOiBBcnJheTxzdHJpbmc+ID0gW107XHJcblxyXG4gICAgICAgIHJlc3VsdHMuZm9yRWFjaCgodmFsdWU6IHN0cmluZykgPT4ge1xyXG5cclxuICAgICAgICAgICAgaWYgKCFnVXRpbGl0aWVzLmlzTnVsbE9yV2hpdGVTcGFjZSh2YWx1ZSkpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjbGVhbmVkLnB1c2godmFsdWUudHJpbSgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gY2xlYW5lZDtcclxuICAgIH0sXHJcblxyXG4gICAgc3BsaXRCeVBpcGU6IChpbnB1dDogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiA9PiB7XHJcblxyXG4gICAgICAgIGlmIChnVXRpbGl0aWVzLmlzTnVsbE9yV2hpdGVTcGFjZShpbnB1dCkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSBpbnB1dC5zcGxpdCgnfCcpO1xyXG4gICAgICAgIGNvbnN0IGNsZWFuZWQ6IEFycmF5PHN0cmluZz4gPSBbXTtcclxuXHJcbiAgICAgICAgcmVzdWx0cy5mb3JFYWNoKCh2YWx1ZTogc3RyaW5nKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWdVdGlsaXRpZXMuaXNOdWxsT3JXaGl0ZVNwYWNlKHZhbHVlKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNsZWFuZWQucHVzaCh2YWx1ZS50cmltKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBjbGVhbmVkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzcGxpdEJ5TmV3TGluZUFuZE9yZGVyOiAoaW5wdXQ6IHN0cmluZyk6IEFycmF5PHN0cmluZz4gPT4ge1xyXG5cclxuICAgICAgICByZXR1cm4gZ1V0aWxpdGllc1xyXG4gICAgICAgICAgICAuc3BsaXRCeU5ld0xpbmUoaW5wdXQpXHJcbiAgICAgICAgICAgIC5zb3J0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGpvaW5CeU5ld0xpbmU6IChpbnB1dDogQXJyYXk8c3RyaW5nPik6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIGlmICghaW5wdXRcclxuICAgICAgICAgICAgfHwgaW5wdXQubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW5wdXQuam9pbignXFxuJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUFsbENoaWxkcmVuOiAocGFyZW50OiBFbGVtZW50KTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmIChwYXJlbnQgIT09IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChwYXJlbnQuZmlyc3RDaGlsZCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChwYXJlbnQuZmlyc3RDaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGlzT2RkOiAoeDogbnVtYmVyKTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIHJldHVybiB4ICUgMiA9PT0gMTtcclxuICAgIH0sXHJcblxyXG4gICAgc2hvcnRQcmludFRleHQ6IChcclxuICAgICAgICBpbnB1dDogc3RyaW5nLFxyXG4gICAgICAgIG1heExlbmd0aDogbnVtYmVyID0gMTAwKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgaWYgKGdVdGlsaXRpZXMuaXNOdWxsT3JXaGl0ZVNwYWNlKGlucHV0KSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZmlyc3ROZXdMaW5lSW5kZXg6IG51bWJlciA9IGdVdGlsaXRpZXMuZ2V0Rmlyc3ROZXdMaW5lSW5kZXgoaW5wdXQpO1xyXG5cclxuICAgICAgICBpZiAoZmlyc3ROZXdMaW5lSW5kZXggPiAwXHJcbiAgICAgICAgICAgICYmIGZpcnN0TmV3TGluZUluZGV4IDw9IG1heExlbmd0aCkge1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgb3V0cHV0ID0gaW5wdXQuc3Vic3RyKDAsIGZpcnN0TmV3TGluZUluZGV4IC0gMSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ1V0aWxpdGllcy50cmltQW5kQWRkRWxsaXBzaXMob3V0cHV0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpbnB1dC5sZW5ndGggPD0gbWF4TGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBvdXRwdXQgPSBpbnB1dC5zdWJzdHIoMCwgbWF4TGVuZ3RoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdVdGlsaXRpZXMudHJpbUFuZEFkZEVsbGlwc2lzKG91dHB1dCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHRyaW1BbmRBZGRFbGxpcHNpczogKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgICAgICBsZXQgb3V0cHV0OiBzdHJpbmcgPSBpbnB1dC50cmltKCk7XHJcbiAgICAgICAgbGV0IHB1bmN0dWF0aW9uUmVnZXg6IFJlZ0V4cCA9IC9bLixcXC8jISQlXFxeJlxcKjs6e309XFwtX2B+KCldL2c7XHJcbiAgICAgICAgbGV0IHNwYWNlUmVnZXg6IFJlZ0V4cCA9IC9cXFcrL2c7XHJcbiAgICAgICAgbGV0IGxhc3RDaGFyYWN0ZXI6IHN0cmluZyA9IG91dHB1dFtvdXRwdXQubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAgIGxldCBsYXN0Q2hhcmFjdGVySXNQdW5jdHVhdGlvbjogYm9vbGVhbiA9XHJcbiAgICAgICAgICAgIHB1bmN0dWF0aW9uUmVnZXgudGVzdChsYXN0Q2hhcmFjdGVyKVxyXG4gICAgICAgICAgICB8fCBzcGFjZVJlZ2V4LnRlc3QobGFzdENoYXJhY3Rlcik7XHJcblxyXG5cclxuICAgICAgICB3aGlsZSAobGFzdENoYXJhY3RlcklzUHVuY3R1YXRpb24gPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dC5zdWJzdHIoMCwgb3V0cHV0Lmxlbmd0aCAtIDEpO1xyXG4gICAgICAgICAgICBsYXN0Q2hhcmFjdGVyID0gb3V0cHV0W291dHB1dC5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgICAgICAgIGxhc3RDaGFyYWN0ZXJJc1B1bmN0dWF0aW9uID1cclxuICAgICAgICAgICAgICAgIHB1bmN0dWF0aW9uUmVnZXgudGVzdChsYXN0Q2hhcmFjdGVyKVxyXG4gICAgICAgICAgICAgICAgfHwgc3BhY2VSZWdleC50ZXN0KGxhc3RDaGFyYWN0ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGAke291dHB1dH0uLi5gO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRGaXJzdE5ld0xpbmVJbmRleDogKGlucHV0OiBzdHJpbmcpOiBudW1iZXIgPT4ge1xyXG5cclxuICAgICAgICBsZXQgY2hhcmFjdGVyOiBzdHJpbmc7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXQubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGNoYXJhY3RlciA9IGlucHV0W2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoYXJhY3RlciA9PT0gJ1xcbidcclxuICAgICAgICAgICAgICAgIHx8IGNoYXJhY3RlciA9PT0gJ1xccicpIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgfSxcclxuXHJcbiAgICB1cHBlckNhc2VGaXJzdExldHRlcjogKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgICAgICByZXR1cm4gaW5wdXQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBpbnB1dC5zbGljZSgxKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2VuZXJhdGVHdWlkOiAodXNlSHlwZW5zOiBib29sZWFuID0gZmFsc2UpOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgICAgICBsZXQgZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG5cclxuICAgICAgICBsZXQgZDIgPSAocGVyZm9ybWFuY2VcclxuICAgICAgICAgICAgJiYgcGVyZm9ybWFuY2Uubm93XHJcbiAgICAgICAgICAgICYmIChwZXJmb3JtYW5jZS5ub3coKSAqIDEwMDApKSB8fCAwO1xyXG5cclxuICAgICAgICBsZXQgcGF0dGVybiA9ICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnO1xyXG5cclxuICAgICAgICBpZiAoIXVzZUh5cGVucykge1xyXG4gICAgICAgICAgICBwYXR0ZXJuID0gJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4JztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGd1aWQgPSBwYXR0ZXJuXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKFxyXG4gICAgICAgICAgICAgICAgL1t4eV0vZyxcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChjKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCByID0gTWF0aC5yYW5kb20oKSAqIDE2O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgPSAoZCArIHIpICUgMTYgfCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkID0gTWF0aC5mbG9vcihkIC8gMTYpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgPSAoZDIgKyByKSAlIDE2IHwgMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZDIgPSBNYXRoLmZsb29yKGQyIC8gMTYpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChjID09PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpKS50b1N0cmluZygxNik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBndWlkO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGVja0lmQ2hyb21lOiAoKTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIC8vIHBsZWFzZSBub3RlLCBcclxuICAgICAgICAvLyB0aGF0IElFMTEgbm93IHJldHVybnMgdW5kZWZpbmVkIGFnYWluIGZvciB3aW5kb3cuY2hyb21lXHJcbiAgICAgICAgLy8gYW5kIG5ldyBPcGVyYSAzMCBvdXRwdXRzIHRydWUgZm9yIHdpbmRvdy5jaHJvbWVcclxuICAgICAgICAvLyBidXQgbmVlZHMgdG8gY2hlY2sgaWYgd2luZG93Lm9wciBpcyBub3QgdW5kZWZpbmVkXHJcbiAgICAgICAgLy8gYW5kIG5ldyBJRSBFZGdlIG91dHB1dHMgdG8gdHJ1ZSBub3cgZm9yIHdpbmRvdy5jaHJvbWVcclxuICAgICAgICAvLyBhbmQgaWYgbm90IGlPUyBDaHJvbWUgY2hlY2tcclxuICAgICAgICAvLyBzbyB1c2UgdGhlIGJlbG93IHVwZGF0ZWQgY29uZGl0aW9uXHJcblxyXG4gICAgICAgIGxldCB0c1dpbmRvdzogYW55ID0gd2luZG93IGFzIGFueTtcclxuICAgICAgICBsZXQgaXNDaHJvbWl1bSA9IHRzV2luZG93LmNocm9tZTtcclxuICAgICAgICBsZXQgd2luTmF2ID0gd2luZG93Lm5hdmlnYXRvcjtcclxuICAgICAgICBsZXQgdmVuZG9yTmFtZSA9IHdpbk5hdi52ZW5kb3I7XHJcbiAgICAgICAgbGV0IGlzT3BlcmEgPSB0eXBlb2YgdHNXaW5kb3cub3ByICE9PSBcInVuZGVmaW5lZFwiO1xyXG4gICAgICAgIGxldCBpc0lFZWRnZSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZihcIkVkZ2VcIikgPiAtMTtcclxuICAgICAgICBsZXQgaXNJT1NDaHJvbWUgPSB3aW5OYXYudXNlckFnZW50Lm1hdGNoKFwiQ3JpT1NcIik7XHJcblxyXG4gICAgICAgIGlmIChpc0lPU0Nocm9tZSkge1xyXG4gICAgICAgICAgICAvLyBpcyBHb29nbGUgQ2hyb21lIG9uIElPU1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoaXNDaHJvbWl1bSAhPT0gbnVsbFxyXG4gICAgICAgICAgICAmJiB0eXBlb2YgaXNDaHJvbWl1bSAhPT0gXCJ1bmRlZmluZWRcIlxyXG4gICAgICAgICAgICAmJiB2ZW5kb3JOYW1lID09PSBcIkdvb2dsZSBJbmMuXCJcclxuICAgICAgICAgICAgJiYgaXNPcGVyYSA9PT0gZmFsc2VcclxuICAgICAgICAgICAgJiYgaXNJRWVkZ2UgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIC8vIGlzIEdvb2dsZSBDaHJvbWVcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnVXRpbGl0aWVzOyIsImltcG9ydCBJSGlzdG9yeVVybCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9oaXN0b3J5L0lIaXN0b3J5VXJsXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSGlzdG9yeVVybCBpbXBsZW1lbnRzIElIaXN0b3J5VXJsIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih1cmw6IHN0cmluZykge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cmw6IHN0cmluZztcclxufVxyXG4iLCJpbXBvcnQgSVJlbmRlclNuYXBTaG90IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2hpc3RvcnkvSVJlbmRlclNuYXBTaG90XCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVuZGVyU25hcFNob3QgaW1wbGVtZW50cyBJUmVuZGVyU25hcFNob3Qge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHVybDogc3RyaW5nKSB7XHJcblxyXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cmw6IHN0cmluZztcclxuICAgIHB1YmxpYyBndWlkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBjcmVhdGVkOiBEYXRlIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgbW9kaWZpZWQ6IERhdGUgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBleHBhbmRlZE9wdGlvbklEczogQXJyYXk8c3RyaW5nPiA9IFtdO1xyXG4gICAgcHVibGljIGV4cGFuZGVkQW5jaWxsYXJ5SURzOiBBcnJheTxzdHJpbmc+ID0gW107XHJcbn1cclxuIiwiaW1wb3J0IElVcmxBc3NlbWJsZXIgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvaGlzdG9yeS9JVXJsQXNzZW1ibGVyXCI7XHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgSGlzdG9yeVVybCBmcm9tIFwiLi4vLi4vc3RhdGUvaGlzdG9yeS9IaXN0b3J5VXJsXCI7XHJcbmltcG9ydCBSZW5kZXJTbmFwU2hvdCBmcm9tIFwiLi4vLi4vc3RhdGUvaGlzdG9yeS9SZW5kZXJTbmFwU2hvdFwiO1xyXG5pbXBvcnQgVSBmcm9tIFwiLi4vZ1V0aWxpdGllc1wiO1xyXG5cclxuXHJcbmNvbnN0IGJ1aWxkVXJsRnJvbVJvb3QgPSAocm9vdDogSVJlbmRlckZyYWdtZW50KTogc3RyaW5nID0+IHtcclxuXHJcbiAgICBjb25zdCB1cmxBc3NlbWJsZXI6IElVcmxBc3NlbWJsZXIgPSB7XHJcblxyXG4gICAgICAgIHVybDogYCR7bG9jYXRpb24ub3JpZ2lufSR7bG9jYXRpb24ucGF0aG5hbWV9P2BcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXJvb3Quc2VsZWN0ZWQpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHVybEFzc2VtYmxlci51cmw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpbnRTZWdtZW50RW5kKFxyXG4gICAgICAgIHVybEFzc2VtYmxlcixcclxuICAgICAgICByb290XHJcbiAgICApXHJcblxyXG4gICAgcmV0dXJuIHVybEFzc2VtYmxlci51cmw7XHJcbn07XHJcblxyXG5jb25zdCBwcmludFNlZ21lbnRFbmQgPSAoXHJcbiAgICB1cmxBc3NlbWJsZXI6IElVcmxBc3NlbWJsZXIsXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCB8IHVuZGVmaW5lZFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoIWZyYWdtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChmcmFnbWVudC5saW5rPy5yb290KSB7XHJcblxyXG4gICAgICAgIGxldCB1cmwgPSB1cmxBc3NlbWJsZXIudXJsO1xyXG4gICAgICAgIHVybCA9IGAke3VybH1+JHtmcmFnbWVudC5pZH1gO1xyXG4gICAgICAgIHVybEFzc2VtYmxlci51cmwgPSB1cmw7XHJcblxyXG4gICAgICAgIHByaW50U2VnbWVudEVuZChcclxuICAgICAgICAgICAgdXJsQXNzZW1ibGVyLFxyXG4gICAgICAgICAgICBmcmFnbWVudC5saW5rLnJvb3QsXHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50LmV4aXRLZXkpKSB7XHJcblxyXG4gICAgICAgIGxldCB1cmwgPSB1cmxBc3NlbWJsZXIudXJsO1xyXG4gICAgICAgIHVybCA9IGAke3VybH1fJHtmcmFnbWVudC5pZH1gO1xyXG4gICAgICAgIHVybEFzc2VtYmxlci51cmwgPSB1cmw7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICghZnJhZ21lbnQubGlua1xyXG4gICAgICAgICYmICFmcmFnbWVudC5zZWxlY3RlZFxyXG4gICAgKSB7XHJcbiAgICAgICAgbGV0IHVybCA9IHVybEFzc2VtYmxlci51cmw7XHJcbiAgICAgICAgdXJsID0gYCR7dXJsfS0ke2ZyYWdtZW50LmlkfWA7XHJcbiAgICAgICAgdXJsQXNzZW1ibGVyLnVybCA9IHVybDtcclxuICAgIH1cclxuXHJcbiAgICBwcmludFNlZ21lbnRFbmQoXHJcbiAgICAgICAgdXJsQXNzZW1ibGVyLFxyXG4gICAgICAgIGZyYWdtZW50LnNlbGVjdGVkLFxyXG4gICAgKVxyXG59O1xyXG5cclxuXHJcbmNvbnN0IGdIaXN0b3J5Q29kZSA9IHtcclxuXHJcbiAgICByZXNldFJhdzogKCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICB3aW5kb3cuVHJlZVNvbHZlLnNjcmVlbi5hdXRvZm9jdXMgPSB0cnVlO1xyXG4gICAgICAgIHdpbmRvdy5UcmVlU29sdmUuc2NyZWVuLmlzQXV0b2ZvY3VzRmlyc3RSdW4gPSB0cnVlO1xyXG4gICAgfSxcclxuXHJcbiAgICBwdXNoQnJvd3Nlckhpc3RvcnlTdGF0ZTogKHN0YXRlOiBJU3RhdGUpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlLnJlbmRlclN0YXRlLmlzQ2hhaW5Mb2FkID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLnJlZnJlc2hVcmwgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCFzdGF0ZS5yZW5kZXJTdGF0ZS5jdXJyZW50U2VjdGlvbj8uY3VycmVudFxyXG4gICAgICAgICAgICB8fCAhc3RhdGUucmVuZGVyU3RhdGUuZGlzcGxheUd1aWRlPy5yb290XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdIaXN0b3J5Q29kZS5yZXNldFJhdygpO1xyXG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xyXG4gICAgICAgIGxldCBsYXN0VXJsOiBzdHJpbmc7XHJcblxyXG4gICAgICAgIGlmICh3aW5kb3cuaGlzdG9yeS5zdGF0ZSkge1xyXG5cclxuICAgICAgICAgICAgbGFzdFVybCA9IHdpbmRvdy5oaXN0b3J5LnN0YXRlLnVybDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGxhc3RVcmwgPSBgJHtsb2NhdGlvbi5vcmlnaW59JHtsb2NhdGlvbi5wYXRobmFtZX0ke2xvY2F0aW9uLnNlYXJjaH1gO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gYnVpbGRVcmxGcm9tUm9vdChzdGF0ZS5yZW5kZXJTdGF0ZS5kaXNwbGF5R3VpZGUucm9vdCk7XHJcblxyXG4gICAgICAgIGlmIChsYXN0VXJsXHJcbiAgICAgICAgICAgICYmIHVybCA9PT0gbGFzdFVybCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZShcclxuICAgICAgICAgICAgbmV3IFJlbmRlclNuYXBTaG90KHVybCksXHJcbiAgICAgICAgICAgIFwiXCIsXHJcbiAgICAgICAgICAgIHVybFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHN0YXRlLnN0ZXBIaXN0b3J5Lmhpc3RvcnlDaGFpbi5wdXNoKG5ldyBIaXN0b3J5VXJsKHVybCkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ0hpc3RvcnlDb2RlO1xyXG5cclxuIiwiaW1wb3J0IHsgUGFyc2VUeXBlIH0gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvZW51bXMvUGFyc2VUeXBlXCI7XHJcbmltcG9ydCBJQWN0aW9uIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lBY3Rpb25cIjtcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IElTdGF0ZUFueUFycmF5IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZUFueUFycmF5XCI7XHJcbmltcG9ydCBJSHR0cEVmZmVjdCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9lZmZlY3RzL0lIdHRwRWZmZWN0XCI7XHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmVOb2RlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZU5vZGVcIjtcclxuaW1wb3J0IEh0dHBFZmZlY3QgZnJvbSBcIi4uLy4uL3N0YXRlL2VmZmVjdHMvSHR0cEVmZmVjdFwiO1xyXG5pbXBvcnQgVSBmcm9tIFwiLi4vZ1V0aWxpdGllc1wiO1xyXG5pbXBvcnQgZ0hpc3RvcnlDb2RlIGZyb20gXCIuL2dIaXN0b3J5Q29kZVwiO1xyXG5cclxubGV0IGNvdW50ID0gMDtcclxuXHJcbmNvbnN0IGdTdGF0ZUNvZGUgPSB7XHJcblxyXG4gICAgc2V0RGlydHk6IChzdGF0ZTogSVN0YXRlKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLnVpLnJhdyA9IGZhbHNlO1xyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLmlzQ2hhaW5Mb2FkID0gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEZyZXNoS2V5SW50OiAoc3RhdGU6IElTdGF0ZSk6IG51bWJlciA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IG5leHRLZXkgPSArK3N0YXRlLm5leHRLZXk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXh0S2V5O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRGcmVzaEtleTogKHN0YXRlOiBJU3RhdGUpOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgICAgICByZXR1cm4gYCR7Z1N0YXRlQ29kZS5nZXRGcmVzaEtleUludChzdGF0ZSl9YDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0R3VpZEtleTogKCk6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIHJldHVybiBVLmdlbmVyYXRlR3VpZCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbG9uZVN0YXRlOiAoc3RhdGU6IElTdGF0ZSk6IElTdGF0ZSA9PiB7XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZS5yZW5kZXJTdGF0ZS5yZWZyZXNoVXJsID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBnSGlzdG9yeUNvZGUucHVzaEJyb3dzZXJIaXN0b3J5U3RhdGUoc3RhdGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG5ld1N0YXRlOiBJU3RhdGUgPSB7IC4uLnN0YXRlIH07XHJcblxyXG4gICAgICAgIHJldHVybiBuZXdTdGF0ZTtcclxuICAgIH0sXHJcblxyXG4gICAgQWRkUmVMb2FkRGF0YUVmZmVjdEltbWVkaWF0ZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgbmFtZTogc3RyaW5nLFxyXG4gICAgICAgIHBhcnNlVHlwZTogUGFyc2VUeXBlLFxyXG4gICAgICAgIHVybDogc3RyaW5nLFxyXG4gICAgICAgIGFjdGlvbkRlbGVnYXRlOiAoc3RhdGU6IElTdGF0ZSwgcmVzcG9uc2U6IGFueSkgPT4gSVN0YXRlQW55QXJyYXlcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhuYW1lKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1cmwpO1xyXG5cclxuICAgICAgICBpZiAoY291bnQgPiAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh1cmwuZW5kc1dpdGgoJ2lteW82QzA4SC5odG1sJykpIHtcclxuICAgICAgICAgICAgY291bnQrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGVmZmVjdDogSUh0dHBFZmZlY3QgfCB1bmRlZmluZWQgPSBzdGF0ZVxyXG4gICAgICAgICAgICAucmVwZWF0RWZmZWN0c1xyXG4gICAgICAgICAgICAucmVMb2FkR2V0SHR0cEltbWVkaWF0ZVxyXG4gICAgICAgICAgICAuZmluZCgoZWZmZWN0OiBJSHR0cEVmZmVjdCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBlZmZlY3QubmFtZSA9PT0gbmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICYmIGVmZmVjdC51cmwgPT09IHVybDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChlZmZlY3QpIHsgLy8gYWxyZWFkeSBhZGRlZC5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaHR0cEVmZmVjdDogSUh0dHBFZmZlY3QgPSBuZXcgSHR0cEVmZmVjdChcclxuICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgdXJsLFxyXG4gICAgICAgICAgICBwYXJzZVR5cGUsXHJcbiAgICAgICAgICAgIGFjdGlvbkRlbGVnYXRlXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc3RhdGUucmVwZWF0RWZmZWN0cy5yZUxvYWRHZXRIdHRwSW1tZWRpYXRlLnB1c2goaHR0cEVmZmVjdCk7XHJcbiAgICB9LFxyXG5cclxuICAgIEFkZFJ1bkFjdGlvbkltbWVkaWF0ZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgYWN0aW9uRGVsZWdhdGU6IElBY3Rpb24pOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgc3RhdGUucmVwZWF0RWZmZWN0cy5ydW5BY3Rpb25JbW1lZGlhdGUucHVzaChhY3Rpb25EZWxlZ2F0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldENhY2hlZF9vdXRsaW5lTm9kZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgbGlua0lEOiBudW1iZXIsXHJcbiAgICAgICAgZnJhZ21lbnRJRDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZFxyXG4gICAgKTogSVJlbmRlck91dGxpbmVOb2RlIHwgbnVsbCA9PiB7XHJcblxyXG4gICAgICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudElEKSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBrZXkgPSBnU3RhdGVDb2RlLmdldENhY2hlS2V5KFxyXG4gICAgICAgICAgICBsaW5rSUQsXHJcbiAgICAgICAgICAgIGZyYWdtZW50SUQgYXMgc3RyaW5nXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3Qgb3V0bGluZU5vZGUgPSBzdGF0ZS5yZW5kZXJTdGF0ZS5pbmRleF9vdXRsaW5lTm9kZXNfaWRba2V5XSA/PyBudWxsO1xyXG5cclxuICAgICAgICBpZiAoIW91dGxpbmVOb2RlKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk91dGxpbmVOb2RlIHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGxpbmVOb2RlO1xyXG4gICAgfSxcclxuXHJcbiAgICBjYWNoZV9vdXRsaW5lTm9kZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgbGlua0lEOiBudW1iZXIsXHJcbiAgICAgICAgb3V0bGluZU5vZGU6IElSZW5kZXJPdXRsaW5lTm9kZSB8IG51bGxcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIW91dGxpbmVOb2RlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGtleSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVLZXkoXHJcbiAgICAgICAgICAgIGxpbmtJRCxcclxuICAgICAgICAgICAgb3V0bGluZU5vZGUuaVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZS5yZW5kZXJTdGF0ZS5pbmRleF9vdXRsaW5lTm9kZXNfaWRba2V5XSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5pbmRleF9vdXRsaW5lTm9kZXNfaWRba2V5XSA9IG91dGxpbmVOb2RlO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRDYWNoZWRfY2hhaW5GcmFnbWVudDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgbGlua0lEOiBudW1iZXIsXHJcbiAgICAgICAgZnJhZ21lbnRJRDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZFxyXG4gICAgKTogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9PiB7XHJcblxyXG4gICAgICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudElEKSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBrZXkgPSBnU3RhdGVDb2RlLmdldENhY2hlS2V5KFxyXG4gICAgICAgICAgICBsaW5rSUQsXHJcbiAgICAgICAgICAgIGZyYWdtZW50SUQgYXMgc3RyaW5nXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN0YXRlLnJlbmRlclN0YXRlLmluZGV4X2NoYWluRnJhZ21lbnRzX2lkW2tleV0gPz8gbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgY2FjaGVfY2hhaW5GcmFnbWVudDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgcmVuZGVyRnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGxcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXJlbmRlckZyYWdtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGtleSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVLZXlGcm9tRnJhZ21lbnQocmVuZGVyRnJhZ21lbnQpO1xyXG5cclxuICAgICAgICBpZiAoVS5pc051bGxPcldoaXRlU3BhY2Uoa2V5KSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3RhdGUucmVuZGVyU3RhdGUuaW5kZXhfY2hhaW5GcmFnbWVudHNfaWRba2V5IGFzIHN0cmluZ10pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUuaW5kZXhfY2hhaW5GcmFnbWVudHNfaWRba2V5IGFzIHN0cmluZ10gPSByZW5kZXJGcmFnbWVudDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0Q2FjaGVLZXlGcm9tRnJhZ21lbnQ6IChyZW5kZXJGcmFnbWVudDogSVJlbmRlckZyYWdtZW50KTogc3RyaW5nIHwgbnVsbCA9PiB7XHJcblxyXG4gICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmdldENhY2hlS2V5KFxyXG4gICAgICAgICAgICByZW5kZXJGcmFnbWVudC5zZWN0aW9uLmxpbmtJRCxcclxuICAgICAgICAgICAgcmVuZGVyRnJhZ21lbnQuaWRcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRDYWNoZUtleTogKFxyXG5cclxuICAgICAgICBsaW5rSUQ6IG51bWJlcixcclxuICAgICAgICBmcmFnbWVudElEOiBzdHJpbmdcclxuICAgICk6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIHJldHVybiBgJHtsaW5rSUR9XyR7ZnJhZ21lbnRJRH1gO1xyXG4gICAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdTdGF0ZUNvZGU7XHJcblxyXG4iLCJpbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5cclxuXHJcbmNvbnN0IGdBdXRoZW50aWNhdGlvbkNvZGUgPSB7XHJcblxyXG4gICAgY2xlYXJBdXRoZW50aWNhdGlvbjogKHN0YXRlOiBJU3RhdGUpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgc3RhdGUudXNlci5hdXRob3Jpc2VkID0gZmFsc2U7XHJcbiAgICAgICAgc3RhdGUudXNlci5uYW1lID0gXCJcIjtcclxuICAgICAgICBzdGF0ZS51c2VyLnN1YiA9IFwiXCI7XHJcbiAgICAgICAgc3RhdGUudXNlci5sb2dvdXRVcmwgPSBcIlwiO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ0F1dGhlbnRpY2F0aW9uQ29kZTtcclxuIiwiXHJcbmV4cG9ydCBlbnVtIEFjdGlvblR5cGUge1xyXG5cclxuICAgIE5vbmUgPSAnbm9uZScsXHJcbiAgICBGaWx0ZXJUb3BpY3MgPSAnZmlsdGVyVG9waWNzJyxcclxuICAgIEdldFRvcGljID0gJ2dldFRvcGljJyxcclxuICAgIEdldFRvcGljQW5kUm9vdCA9ICdnZXRUb3BpY0FuZFJvb3QnLFxyXG4gICAgU2F2ZUFydGljbGVTY2VuZSA9ICdzYXZlQXJ0aWNsZVNjZW5lJyxcclxuICAgIEdldFJvb3QgPSAnZ2V0Um9vdCcsXHJcbiAgICBHZXRTdGVwID0gJ2dldFN0ZXAnLFxyXG4gICAgR2V0UGFnZSA9ICdnZXRQYWdlJyxcclxuICAgIEdldENoYWluID0gJ2dldENoYWluJyxcclxuICAgIEdldE91dGxpbmUgPSAnZ2V0T3V0bGluZScsXHJcbiAgICBHZXRGcmFnbWVudCA9ICdnZXRGcmFnbWVudCcsXHJcbiAgICBHZXRDaGFpbkZyYWdtZW50ID0gJ2dldENoYWluRnJhZ21lbnQnXHJcbn1cclxuXHJcbiIsImltcG9ydCB7IEFjdGlvblR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9BY3Rpb25UeXBlXCI7XHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcblxyXG5cclxuY29uc3QgZ0FqYXhIZWFkZXJDb2RlID0ge1xyXG5cclxuICAgIGJ1aWxkSGVhZGVyczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgY2FsbElEOiBzdHJpbmcsXHJcbiAgICAgICAgYWN0aW9uOiBBY3Rpb25UeXBlKTogSGVhZGVycyA9PiB7XHJcblxyXG4gICAgICAgIGxldCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcclxuICAgICAgICBoZWFkZXJzLmFwcGVuZCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICAgICAgICBoZWFkZXJzLmFwcGVuZCgnWC1DU1JGJywgJzEnKTtcclxuICAgICAgICBoZWFkZXJzLmFwcGVuZCgnU3Vic2NyaXB0aW9uSUQnLCBzdGF0ZS5zZXR0aW5ncy5zdWJzY3JpcHRpb25JRCk7XHJcbiAgICAgICAgaGVhZGVycy5hcHBlbmQoJ0NhbGxJRCcsIGNhbGxJRCk7XHJcbiAgICAgICAgaGVhZGVycy5hcHBlbmQoJ0FjdGlvbicsIGFjdGlvbik7XHJcblxyXG4gICAgICAgIGhlYWRlcnMuYXBwZW5kKCd3aXRoQ3JlZGVudGlhbHMnLCAndHJ1ZScpO1xyXG5cclxuICAgICAgICByZXR1cm4gaGVhZGVycztcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdBamF4SGVhZGVyQ29kZTtcclxuXHJcbiIsImltcG9ydCB7IGdBdXRoZW50aWNhdGVkSHR0cCB9IGZyb20gXCIuL2dBdXRoZW50aWNhdGlvbkh0dHBcIjtcclxuXHJcbmltcG9ydCB7IEFjdGlvblR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9BY3Rpb25UeXBlXCI7XHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBnQWpheEhlYWRlckNvZGUgZnJvbSBcIi4vZ0FqYXhIZWFkZXJDb2RlXCI7XHJcbmltcG9ydCBnQXV0aGVudGljYXRpb25BY3Rpb25zIGZyb20gXCIuL2dBdXRoZW50aWNhdGlvbkFjdGlvbnNcIjtcclxuaW1wb3J0IFUgZnJvbSBcIi4uL2dVdGlsaXRpZXNcIjtcclxuaW1wb3J0IHsgSUh0dHBGZXRjaEl0ZW0gfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9odHRwL0lIdHRwRmV0Y2hJdGVtXCI7XHJcbmltcG9ydCBnU3RhdGVDb2RlIGZyb20gXCIuLi9jb2RlL2dTdGF0ZUNvZGVcIjtcclxuXHJcblxyXG5jb25zdCBnQXV0aGVudGljYXRpb25FZmZlY3RzID0ge1xyXG5cclxuICAgIGNoZWNrVXNlckF1dGhlbnRpY2F0ZWQ6IChzdGF0ZTogSVN0YXRlKTogSUh0dHBGZXRjaEl0ZW0gfCB1bmRlZmluZWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGNhbGxJRDogc3RyaW5nID0gVS5nZW5lcmF0ZUd1aWQoKTtcclxuXHJcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBnQWpheEhlYWRlckNvZGUuYnVpbGRIZWFkZXJzKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgY2FsbElELFxyXG4gICAgICAgICAgICBBY3Rpb25UeXBlLk5vbmVcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCB1cmw6IHN0cmluZyA9IGAke3N0YXRlLnNldHRpbmdzLmJmZlVybH0vJHtzdGF0ZS5zZXR0aW5ncy51c2VyUGF0aH0/c2xpZGU9ZmFsc2VgO1xyXG5cclxuICAgICAgICByZXR1cm4gZ0F1dGhlbnRpY2F0ZWRIdHRwKHtcclxuICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnNcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVzcG9uc2U6ICdqc29uJyxcclxuICAgICAgICAgICAgYWN0aW9uOiBnQXV0aGVudGljYXRpb25BY3Rpb25zLmxvYWRTdWNjZXNzZnVsQXV0aGVudGljYXRpb24sXHJcbiAgICAgICAgICAgIGVycm9yOiAoc3RhdGU6IElTdGF0ZSwgZXJyb3JEZXRhaWxzOiBhbnkpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhge1xyXG4gICAgICAgICAgICAgICAgICAgIFwibWVzc2FnZVwiOiBcIkVycm9yIHRyeWluZyB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgc2VydmVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ1cmxcIjogJHt1cmx9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZXJyb3IgRGV0YWlsc1wiOiAke0pTT04uc3RyaW5naWZ5KGVycm9yRGV0YWlscyl9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwic3RhY2tcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMuc3RhY2spfSxcclxuICAgICAgICAgICAgICAgICAgICBcIm1ldGhvZFwiOiAke2dBdXRoZW50aWNhdGlvbkVmZmVjdHMuY2hlY2tVc2VyQXV0aGVudGljYXRlZC5uYW1lfSxcclxuICAgICAgICAgICAgICAgICAgICBcImNhbGxJRDogJHtjYWxsSUR9XHJcbiAgICAgICAgICAgICAgICB9YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgYWxlcnQoYHtcclxuICAgICAgICAgICAgICAgICAgICBcIm1lc3NhZ2VcIjogXCJFcnJvciB0cnlpbmcgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIHNlcnZlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwidXJsXCI6ICR7dXJsfSxcclxuICAgICAgICAgICAgICAgICAgICBcImVycm9yIERldGFpbHNcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMpfSxcclxuICAgICAgICAgICAgICAgICAgICBcInN0YWNrXCI6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3JEZXRhaWxzLnN0YWNrKX0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJtZXRob2RcIjogZ0F1dGhlbnRpY2F0aW9uRWZmZWN0cy5jaGVja1VzZXJBdXRoZW50aWNhdGVkLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjYWxsSUQ6ICR7Y2FsbElEfSxcclxuICAgICAgICAgICAgICAgICAgICBcInN0YXRlXCI6ICR7SlNPTi5zdHJpbmdpZnkoc3RhdGUpfVxyXG4gICAgICAgICAgICAgICAgfWApO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnQXV0aGVudGljYXRpb25FZmZlY3RzO1xyXG4iLCJpbXBvcnQgeyBJSHR0cEZldGNoSXRlbSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2h0dHAvSUh0dHBGZXRjaEl0ZW1cIjtcclxuaW1wb3J0IEtleXMgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvY29uc3RhbnRzL0tleXNcIjtcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IElTdGF0ZUFueUFycmF5IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZUFueUFycmF5XCI7XHJcbmltcG9ydCBnU3RhdGVDb2RlIGZyb20gXCIuLi9jb2RlL2dTdGF0ZUNvZGVcIjtcclxuaW1wb3J0IGdBdXRoZW50aWNhdGlvbkNvZGUgZnJvbSBcIi4vZ0F1dGhlbnRpY2F0aW9uQ29kZVwiO1xyXG5pbXBvcnQgZ0F1dGhlbnRpY2F0aW9uRWZmZWN0cyBmcm9tIFwiLi9nQXV0aGVudGljYXRpb25FZmZlY3RzXCI7XHJcblxyXG5cclxuY29uc3QgZ0F1dGhlbnRpY2F0aW9uQWN0aW9ucyA9IHtcclxuXHJcbiAgICBsb2FkU3VjY2Vzc2Z1bEF1dGhlbnRpY2F0aW9uOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByZXNwb25zZTogYW55KTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlXHJcbiAgICAgICAgICAgIHx8ICFyZXNwb25zZVxyXG4gICAgICAgICAgICB8fCByZXNwb25zZS5wYXJzZVR5cGUgIT09IFwianNvblwiXHJcbiAgICAgICAgICAgIHx8ICFyZXNwb25zZS5qc29uRGF0YSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2xhaW1zOiBhbnkgPSByZXNwb25zZS5qc29uRGF0YTtcclxuXHJcbiAgICAgICAgY29uc3QgbmFtZTogYW55ID0gY2xhaW1zLmZpbmQoXHJcbiAgICAgICAgICAgIChjbGFpbTogYW55KSA9PiBjbGFpbS50eXBlID09PSAnbmFtZSdcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCBzdWI6IGFueSA9IGNsYWltcy5maW5kKFxyXG4gICAgICAgICAgICAoY2xhaW06IGFueSkgPT4gY2xhaW0udHlwZSA9PT0gJ3N1YidcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoIW5hbWVcclxuICAgICAgICAgICAgJiYgIXN1Yikge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbG9nb3V0VXJsQ2xhaW06IGFueSA9IGNsYWltcy5maW5kKFxyXG4gICAgICAgICAgICAoY2xhaW06IGFueSkgPT4gY2xhaW0udHlwZSA9PT0gJ2JmZjpsb2dvdXRfdXJsJ1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghbG9nb3V0VXJsQ2xhaW1cclxuICAgICAgICAgICAgfHwgIWxvZ291dFVybENsYWltLnZhbHVlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0ZS51c2VyLmF1dGhvcmlzZWQgPSB0cnVlO1xyXG4gICAgICAgIHN0YXRlLnVzZXIubmFtZSA9IG5hbWUudmFsdWU7XHJcbiAgICAgICAgc3RhdGUudXNlci5zdWIgPSBzdWIudmFsdWU7XHJcbiAgICAgICAgc3RhdGUudXNlci5sb2dvdXRVcmwgPSBsb2dvdXRVcmxDbGFpbS52YWx1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNoZWNrVXNlckxvZ2dlZEluOiAoc3RhdGU6IElTdGF0ZSk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgcHJvcHM6IElIdHRwRmV0Y2hJdGVtIHwgdW5kZWZpbmVkID0gZ0F1dGhlbnRpY2F0aW9uQWN0aW9ucy5jaGVja1VzZXJMb2dnZWRJblByb3BzKHN0YXRlKTtcclxuXHJcbiAgICAgICAgaWYgKCFwcm9wcykge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHByb3BzXHJcbiAgICAgICAgXTtcclxuICAgIH0sXHJcblxyXG4gICAgY2hlY2tVc2VyTG9nZ2VkSW5Qcm9wczogKHN0YXRlOiBJU3RhdGUpOiBJSHR0cEZldGNoSXRlbSB8IHVuZGVmaW5lZCA9PiB7XHJcblxyXG4gICAgICAgIHN0YXRlLnVzZXIucmF3ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHJldHVybiBnQXV0aGVudGljYXRpb25FZmZlY3RzLmNoZWNrVXNlckF1dGhlbnRpY2F0ZWQoc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2dpbjogKHN0YXRlOiBJU3RhdGUpOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcclxuXHJcbiAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShcclxuICAgICAgICAgICAgS2V5cy5zdGFydFVybCxcclxuICAgICAgICAgICAgY3VycmVudFVybFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHVybDogc3RyaW5nID0gYCR7c3RhdGUuc2V0dGluZ3MuYmZmVXJsfS8ke3N0YXRlLnNldHRpbmdzLmRlZmF1bHRMb2dpblBhdGh9P3JldHVyblVybD0vYDtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uYXNzaWduKHVybCk7XHJcblxyXG4gICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJBdXRoZW50aWNhdGlvbjogKHN0YXRlOiBJU3RhdGUpOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcbiAgICAgICAgZ0F1dGhlbnRpY2F0aW9uQ29kZS5jbGVhckF1dGhlbnRpY2F0aW9uKHN0YXRlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyQXV0aGVudGljYXRpb25BbmRTaG93TG9naW46IChzdGF0ZTogSVN0YXRlKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBnQXV0aGVudGljYXRpb25Db2RlLmNsZWFyQXV0aGVudGljYXRpb24oc3RhdGUpO1xyXG5cclxuICAgICAgICByZXR1cm4gZ0F1dGhlbnRpY2F0aW9uQWN0aW9ucy5sb2dpbihzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvZ291dDogKHN0YXRlOiBJU3RhdGUpOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24oc3RhdGUudXNlci5sb2dvdXRVcmwpO1xyXG5cclxuICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnQXV0aGVudGljYXRpb25BY3Rpb25zO1xyXG4iLCJpbXBvcnQgeyBnSHR0cCB9IGZyb20gXCIuL2dIdHRwXCI7XHJcblxyXG5pbXBvcnQgSUh0dHBBdXRoZW50aWNhdGVkUHJvcHMgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvaHR0cC9JSHR0cEF1dGhlbnRpY2F0ZWRQcm9wc1wiO1xyXG5pbXBvcnQgSUh0dHBQcm9wcyBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9odHRwL0lIdHRwUHJvcHNcIjtcclxuaW1wb3J0IGdBdXRoZW50aWNhdGlvbkFjdGlvbnMgZnJvbSBcIi4vZ0F1dGhlbnRpY2F0aW9uQWN0aW9uc1wiO1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnQXV0aGVudGljYXRlZEh0dHAocHJvcHM6IElIdHRwUHJvcHMpOiBhbnkge1xyXG5cclxuICAgIGNvbnN0IGh0dHBBdXRoZW50aWNhdGVkUHJvcGVydGllczogSUh0dHBBdXRoZW50aWNhdGVkUHJvcHMgPSBwcm9wcyBhcyBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wcztcclxuXHJcbiAgICAvLyAvLyBUbyByZWdpc3RlciBmYWlsZWQgYXV0aGVudGljYXRpb25cclxuICAgIC8vIGh0dHBBdXRoZW50aWNhdGVkUHJvcGVydGllcy5vbkF1dGhlbnRpY2F0aW9uRmFpbEFjdGlvbiA9IGdBdXRoZW50aWNhdGlvbkFjdGlvbnMuY2xlYXJBdXRoZW50aWNhdGlvbjtcclxuXHJcbiAgICAvLyBUbyByZWdpc3RlciBmYWlsZWQgYXV0aGVudGljYXRpb24gYW5kIHNob3cgbG9naW4gcGFnZVxyXG4gICAgaHR0cEF1dGhlbnRpY2F0ZWRQcm9wZXJ0aWVzLm9uQXV0aGVudGljYXRpb25GYWlsQWN0aW9uID0gZ0F1dGhlbnRpY2F0aW9uQWN0aW9ucy5jbGVhckF1dGhlbnRpY2F0aW9uQW5kU2hvd0xvZ2luO1xyXG5cclxuICAgIHJldHVybiBnSHR0cChodHRwQXV0aGVudGljYXRlZFByb3BlcnRpZXMpO1xyXG59XHJcbiIsIlxyXG5pbXBvcnQgeyBnQXV0aGVudGljYXRlZEh0dHAgfSBmcm9tIFwiLi4vaHR0cC9nQXV0aGVudGljYXRpb25IdHRwXCI7XHJcblxyXG5pbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgSVN0YXRlQW55QXJyYXkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlQW55QXJyYXlcIjtcclxuaW1wb3J0IElIdHRwRWZmZWN0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2VmZmVjdHMvSUh0dHBFZmZlY3RcIjtcclxuaW1wb3J0IGdTdGF0ZUNvZGUgZnJvbSBcIi4uL2NvZGUvZ1N0YXRlQ29kZVwiO1xyXG5pbXBvcnQgVSBmcm9tIFwiLi4vZ1V0aWxpdGllc1wiO1xyXG5pbXBvcnQgSUFjdGlvbiBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JQWN0aW9uXCI7XHJcblxyXG5jb25zdCBydW5BY3Rpb25Jbm5lciA9IChcclxuICAgIGRpc3BhdGNoOiBhbnksXHJcbiAgICBwcm9wczogYW55KTogdm9pZCA9PiB7XHJcblxyXG4gICAgZGlzcGF0Y2goXHJcbiAgICAgICAgcHJvcHMuYWN0aW9uLFxyXG4gICAgKTtcclxufTtcclxuXHJcblxyXG5jb25zdCBydW5BY3Rpb24gPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgcXVldWVkRWZmZWN0czogQXJyYXk8SUFjdGlvbj5cclxuKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgIGNvbnN0IGVmZmVjdHM6IGFueVtdID0gW107XHJcblxyXG4gICAgcXVldWVkRWZmZWN0cy5mb3JFYWNoKChhY3Rpb246IElBY3Rpb24pID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgcHJvcHMgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uLFxyXG4gICAgICAgICAgICBlcnJvcjogKF9zdGF0ZTogSVN0YXRlLCBlcnJvckRldGFpbHM6IGFueSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJtZXNzYWdlXCI6IFwiRXJyb3IgcnVubmluZyBhY3Rpb24gaW4gcmVwZWF0QWN0aW9uc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZXJyb3IgRGV0YWlsc1wiOiAke0pTT04uc3RyaW5naWZ5KGVycm9yRGV0YWlscyl9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwic3RhY2tcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMuc3RhY2spfSxcclxuICAgICAgICAgICAgICAgICAgICBcIm1ldGhvZFwiOiAke3J1bkFjdGlvbn0sXHJcbiAgICAgICAgICAgICAgICB9YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJFcnJvciBydW5uaW5nIGFjdGlvbiBpbiByZXBlYXRBY3Rpb25zXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIGVmZmVjdHMucHVzaChbXHJcbiAgICAgICAgICAgIHJ1bkFjdGlvbklubmVyLFxyXG4gICAgICAgICAgICBwcm9wc1xyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIFtcclxuXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKSxcclxuICAgICAgICAuLi5lZmZlY3RzXHJcbiAgICBdO1xyXG59O1xyXG5cclxuY29uc3Qgc2VuZFJlcXVlc3QgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgcXVldWVkRWZmZWN0czogQXJyYXk8SUh0dHBFZmZlY3Q+XHJcbik6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICBjb25zdCBlZmZlY3RzOiBhbnlbXSA9IFtdO1xyXG5cclxuICAgIHF1ZXVlZEVmZmVjdHMuZm9yRWFjaCgoaHR0cEVmZmVjdDogSUh0dHBFZmZlY3QpID0+IHtcclxuXHJcbiAgICAgICAgZ2V0RWZmZWN0KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgaHR0cEVmZmVjdCxcclxuICAgICAgICAgICAgZWZmZWN0cyxcclxuICAgICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIFtcclxuXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKSxcclxuICAgICAgICAuLi5lZmZlY3RzXHJcbiAgICBdO1xyXG59O1xyXG5cclxuY29uc3QgZ2V0RWZmZWN0ID0gKFxyXG4gICAgX3N0YXRlOiBJU3RhdGUsXHJcbiAgICBodHRwRWZmZWN0OiBJSHR0cEVmZmVjdCxcclxuICAgIGVmZmVjdHM6IEFycmF5PElIdHRwRWZmZWN0PlxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBjb25zdCB1cmw6IHN0cmluZyA9IGh0dHBFZmZlY3QudXJsO1xyXG4gICAgY29uc3QgY2FsbElEOiBzdHJpbmcgPSBVLmdlbmVyYXRlR3VpZCgpO1xyXG5cclxuICAgIGxldCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcclxuICAgIGhlYWRlcnMuYXBwZW5kKCdBY2NlcHQnLCAnKi8qJyk7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICAgICAgaGVhZGVyczogaGVhZGVyc1xyXG4gICAgfTtcclxuXHJcbiAgICBjb25zdCBlZmZlY3QgPSBnQXV0aGVudGljYXRlZEh0dHAoe1xyXG4gICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgIHBhcnNlVHlwZTogaHR0cEVmZmVjdC5wYXJzZVR5cGUsXHJcbiAgICAgICAgb3B0aW9ucyxcclxuICAgICAgICByZXNwb25zZTogJ2pzb24nLFxyXG4gICAgICAgIGFjdGlvbjogaHR0cEVmZmVjdC5hY3Rpb25EZWxlZ2F0ZSxcclxuICAgICAgICBlcnJvcjogKF9zdGF0ZTogSVN0YXRlLCBlcnJvckRldGFpbHM6IGFueSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coYHtcclxuICAgICAgICAgICAgICAgICAgICBcIm1lc3NhZ2VcIjogXCJFcnJvciBwb3N0aW5nIGdSZXBlYXRBY3Rpb25zIGRhdGEgdG8gdGhlIHNlcnZlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwidXJsXCI6ICR7dXJsfSxcclxuICAgICAgICAgICAgICAgICAgICBcImVycm9yIERldGFpbHNcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMpfSxcclxuICAgICAgICAgICAgICAgICAgICBcInN0YWNrXCI6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3JEZXRhaWxzLnN0YWNrKX0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJtZXRob2RcIjogJHtnZXRFZmZlY3QubmFtZX0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjYWxsSUQ6ICR7Y2FsbElEfVxyXG4gICAgICAgICAgICAgICAgfWApO1xyXG5cclxuICAgICAgICAgICAgYWxlcnQoXCJFcnJvciBwb3N0aW5nIGdSZXBlYXRBY3Rpb25zIGRhdGEgdG8gdGhlIHNlcnZlclwiKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBlZmZlY3RzLnB1c2goZWZmZWN0KTtcclxufTtcclxuXHJcbmNvbnN0IGdSZXBlYXRBY3Rpb25zID0ge1xyXG5cclxuICAgIGh0dHBTaWxlbnRSZUxvYWRJbW1lZGlhdGU6IChzdGF0ZTogSVN0YXRlKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3RhdGUucmVwZWF0RWZmZWN0cy5yZUxvYWRHZXRIdHRwSW1tZWRpYXRlLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBNdXN0IHJldHVybiBhbHRlcmVkIHN0YXRlIGZvciB0aGUgc3Vic2NyaXB0aW9uIG5vdCB0byBnZXQgcmVtb3ZlZFxyXG4gICAgICAgICAgICAvLyByZXR1cm4gc3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByZUxvYWRIdHRwRWZmZWN0c0ltbWVkaWF0ZTogQXJyYXk8SUh0dHBFZmZlY3Q+ID0gc3RhdGUucmVwZWF0RWZmZWN0cy5yZUxvYWRHZXRIdHRwSW1tZWRpYXRlO1xyXG4gICAgICAgIHN0YXRlLnJlcGVhdEVmZmVjdHMucmVMb2FkR2V0SHR0cEltbWVkaWF0ZSA9IFtdO1xyXG5cclxuICAgICAgICByZXR1cm4gc2VuZFJlcXVlc3QoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByZUxvYWRIdHRwRWZmZWN0c0ltbWVkaWF0ZVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNpbGVudFJ1bkFjdGlvbkltbWVkaWF0ZTogKHN0YXRlOiBJU3RhdGUpOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZS5yZXBlYXRFZmZlY3RzLnJ1bkFjdGlvbkltbWVkaWF0ZS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgLy8gTXVzdCByZXR1cm4gYWx0ZXJlZCBzdGF0ZSBmb3IgdGhlIHN1YnNjcmlwdGlvbiBub3QgdG8gZ2V0IHJlbW92ZWRcclxuICAgICAgICAgICAgLy8gcmV0dXJuIHN0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcnVuQWN0aW9uSW1tZWRpYXRlOiBBcnJheTxJQWN0aW9uPiA9IHN0YXRlLnJlcGVhdEVmZmVjdHMucnVuQWN0aW9uSW1tZWRpYXRlO1xyXG4gICAgICAgIHN0YXRlLnJlcGVhdEVmZmVjdHMucnVuQWN0aW9uSW1tZWRpYXRlID0gW107XHJcblxyXG4gICAgICAgIHJldHVybiBydW5BY3Rpb24oXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBydW5BY3Rpb25JbW1lZGlhdGVcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ1JlcGVhdEFjdGlvbnM7XHJcblxyXG4iLCJpbXBvcnQgeyBpbnRlcnZhbCB9IGZyb20gXCIuLi8uLi9oeXBlckFwcC90aW1lXCI7XHJcblxyXG5pbXBvcnQgZ1JlcGVhdEFjdGlvbnMgZnJvbSBcIi4uL2dsb2JhbC9hY3Rpb25zL2dSZXBlYXRBY3Rpb25zXCI7XHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcblxyXG5cclxuY29uc3QgcmVwZWF0U3Vic2NyaXB0aW9ucyA9IHtcclxuXHJcbiAgICBidWlsZFJlcGVhdFN1YnNjcmlwdGlvbnM6IChzdGF0ZTogSVN0YXRlKSA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGJ1aWxkUmVMb2FkRGF0YUltbWVkaWF0ZSA9ICgpOiBhbnkgPT4ge1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0YXRlLnJlcGVhdEVmZmVjdHMucmVMb2FkR2V0SHR0cEltbWVkaWF0ZS5sZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGludGVydmFsKFxyXG4gICAgICAgICAgICAgICAgICAgIGdSZXBlYXRBY3Rpb25zLmh0dHBTaWxlbnRSZUxvYWRJbW1lZGlhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgeyBkZWxheTogMTAgfVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IGJ1aWxkUnVuQWN0aW9uc0ltbWVkaWF0ZSA9ICgpOiBhbnkgPT4ge1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0YXRlLnJlcGVhdEVmZmVjdHMucnVuQWN0aW9uSW1tZWRpYXRlLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50ZXJ2YWwoXHJcbiAgICAgICAgICAgICAgICAgICAgZ1JlcGVhdEFjdGlvbnMuc2lsZW50UnVuQWN0aW9uSW1tZWRpYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZGVsYXk6IDEwIH1cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCByZXBlYXRTdWJzY3JpcHRpb246IGFueVtdID0gW1xyXG5cclxuICAgICAgICAgICAgYnVpbGRSZUxvYWREYXRhSW1tZWRpYXRlKCksXHJcbiAgICAgICAgICAgIGJ1aWxkUnVuQWN0aW9uc0ltbWVkaWF0ZSgpXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcGVhdFN1YnNjcmlwdGlvbjtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHJlcGVhdFN1YnNjcmlwdGlvbnM7XHJcblxyXG4iLCJpbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgcmVwZWF0U3Vic2NyaXB0aW9ucyBmcm9tIFwiLi4vLi4vLi4vc3Vic2NyaXB0aW9ucy9yZXBlYXRTdWJzY3JpcHRpb25cIjtcclxuXHJcblxyXG5jb25zdCBpbml0U3Vic2NyaXB0aW9ucyA9IChzdGF0ZTogSVN0YXRlKSA9PiB7XHJcblxyXG4gICAgaWYgKCFzdGF0ZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzdWJzY3JpcHRpb25zOiBhbnlbXSA9IFtcclxuXHJcbiAgICAgICAgLi4ucmVwZWF0U3Vic2NyaXB0aW9ucy5idWlsZFJlcGVhdFN1YnNjcmlwdGlvbnMoc3RhdGUpXHJcbiAgICBdO1xyXG5cclxuICAgIHJldHVybiBzdWJzY3JpcHRpb25zO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW5pdFN1YnNjcmlwdGlvbnM7XHJcblxyXG4iLCIvKiEgQHZpbWVvL3BsYXllciB2Mi4zMC4zIHwgKGMpIDIwMjYgVmltZW8gfCBNSVQgTGljZW5zZSB8IGh0dHBzOi8vZ2l0aHViLmNvbS92aW1lby9wbGF5ZXIuanMgKi9cbi8qKlxuICogQG1vZHVsZSBsaWIvZnVuY3Rpb25zXG4gKi9cblxuLyoqXG4gKiBDaGVjayB0byBzZWUgdGhpcyBpcyBhIE5vZGUgZW52aXJvbm1lbnQuXG4gKiBAdHlwZSB7Ym9vbGVhbn1cbiAqL1xuLyogZ2xvYmFsIGdsb2JhbCAqL1xuY29uc3QgaXNOb2RlID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgJiYge30udG9TdHJpbmcuY2FsbChnbG9iYWwpID09PSAnW29iamVjdCBnbG9iYWxdJztcblxuLyoqXG4gKiBDaGVjayB0byBzZWUgaWYgdGhpcyBpcyBhIEJ1biBlbnZpcm9ubWVudC5cbiAqIEBzZWUgaHR0cHM6Ly9idW4uc2gvZ3VpZGVzL3V0aWwvZGV0ZWN0LWJ1blxuICogQHR5cGUge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzQnVuID0gdHlwZW9mIEJ1biAhPT0gJ3VuZGVmaW5lZCc7XG5cbi8qKlxuICogQ2hlY2sgdG8gc2VlIGlmIHRoaXMgaXMgYSBEZW5vIGVudmlyb25tZW50LlxuICogQHNlZSBodHRwczovL2RvY3MuZGVuby5jb20vYXBpL2Rlbm8vfi9EZW5vXG4gKiBAdHlwZSB7Ym9vbGVhbn1cbiAqL1xuY29uc3QgaXNEZW5vID0gdHlwZW9mIERlbm8gIT09ICd1bmRlZmluZWQnO1xuXG4vKipcbiAqIENoZWNrIHRvIHNlZSBpZiB0aGlzIGlzIGEgQ2xvdWRmbGFyZSBXb3JrZXIgZW52aXJvbm1lbnQuXG4gKiBAc2VlIGh0dHBzOi8vY29tbXVuaXR5LmNsb3VkZmxhcmUuY29tL3QvaG93LXRvLWRldGVjdC10aGUtY2xvdWRmbGFyZS13b3JrZXItcnVudGltZS8yOTM3MTVcbiAqIEB0eXBlIHtib29sZWFufVxuICovXG5jb25zdCBpc0Nsb3VkZmxhcmVXb3JrZXIgPSB0eXBlb2YgV2ViU29ja2V0UGFpciA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgY2FjaGVzPy5kZWZhdWx0ICE9PSAndW5kZWZpbmVkJztcblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGlzIGEgc2VydmVyIHJ1bnRpbWVcbiAqIEB0eXBlIHtib29sZWFufVxuICovXG5jb25zdCBpc1NlcnZlclJ1bnRpbWUgPSBpc05vZGUgfHwgaXNCdW4gfHwgaXNEZW5vIHx8IGlzQ2xvdWRmbGFyZVdvcmtlcjtcblxuLyoqXG4gKiBHZXQgdGhlIG5hbWUgb2YgdGhlIG1ldGhvZCBmb3IgYSBnaXZlbiBnZXR0ZXIgb3Igc2V0dGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wIFRoZSBuYW1lIG9mIHRoZSBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIEVpdGhlciDigJxnZXTigJ0gb3Ig4oCcc2V04oCdLlxuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBnZXRNZXRob2ROYW1lKHByb3AsIHR5cGUpIHtcbiAgaWYgKHByb3AuaW5kZXhPZih0eXBlLnRvTG93ZXJDYXNlKCkpID09PSAwKSB7XG4gICAgcmV0dXJuIHByb3A7XG4gIH1cbiAgcmV0dXJuIGAke3R5cGUudG9Mb3dlckNhc2UoKX0ke3Byb3Auc3Vic3RyKDAsIDEpLnRvVXBwZXJDYXNlKCl9JHtwcm9wLnN1YnN0cigxKX1gO1xufVxuXG4vKipcbiAqIENoZWNrIHRvIHNlZSBpZiB0aGUgb2JqZWN0IGlzIGEgRE9NIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHsqfSBlbGVtZW50IFRoZSBvYmplY3QgdG8gY2hlY2suXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc0RvbUVsZW1lbnQoZWxlbWVudCkge1xuICByZXR1cm4gQm9vbGVhbihlbGVtZW50ICYmIGVsZW1lbnQubm9kZVR5cGUgPT09IDEgJiYgJ25vZGVOYW1lJyBpbiBlbGVtZW50ICYmIGVsZW1lbnQub3duZXJEb2N1bWVudCAmJiBlbGVtZW50Lm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcpO1xufVxuXG4vKipcbiAqIENoZWNrIHRvIHNlZSB3aGV0aGVyIHRoZSB2YWx1ZSBpcyBhIG51bWJlci5cbiAqXG4gKiBAc2VlIGh0dHA6Ly9kbC5kcm9wYm94dXNlcmNvbnRlbnQuY29tL3UvMzUxNDYvanMvdGVzdHMvaXNOdW1iZXIuaHRtbFxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGludGVnZXIgQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGFuIGludGVnZXIuXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc0ludGVnZXIodmFsdWUpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGVxZXFlcVxuICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQodmFsdWUpKSAmJiBpc0Zpbml0ZSh2YWx1ZSkgJiYgTWF0aC5mbG9vcih2YWx1ZSkgPT0gdmFsdWU7XG59XG5cbi8qKlxuICogQ2hlY2sgdG8gc2VlIGlmIHRoZSBVUkwgaXMgYSBWaW1lbyB1cmwuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHVybCBUaGUgdXJsIHN0cmluZy5cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzVmltZW9VcmwodXJsKSB7XG4gIHJldHVybiAvXihodHRwcz86KT9cXC9cXC8oKCgocGxheWVyfHd3dylcXC4pP3ZpbWVvXFwuY29tKXwoKHBsYXllclxcLik/W2EtekEtWjAtOS1dK1xcLih2aWRlb2ppXFwuKGhrfGNuKXx2aW1lb1xcLndvcmspKSkoPz0kfFxcLykvLnRlc3QodXJsKTtcbn1cblxuLyoqXG4gKiBDaGVjayB0byBzZWUgaWYgdGhlIFVSTCBpcyBmb3IgYSBWaW1lbyBlbWJlZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIFRoZSB1cmwgc3RyaW5nLlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNWaW1lb0VtYmVkKHVybCkge1xuICBjb25zdCBleHByID0gL15odHRwczpcXC9cXC9wbGF5ZXJcXC4oKHZpbWVvXFwuY29tKXwoW2EtekEtWjAtOS1dK1xcLih2aWRlb2ppXFwuKGhrfGNuKXx2aW1lb1xcLndvcmspKSlcXC92aWRlb1xcL1xcZCsvO1xuICByZXR1cm4gZXhwci50ZXN0KHVybCk7XG59XG5mdW5jdGlvbiBnZXRPZW1iZWREb21haW4odXJsKSB7XG4gIGNvbnN0IG1hdGNoID0gKHVybCB8fCAnJykubWF0Y2goL14oPzpodHRwcz86KT8oPzpcXC9cXC8pPyhbXi8/XSspLyk7XG4gIGNvbnN0IGRvbWFpbiA9IChtYXRjaCAmJiBtYXRjaFsxXSB8fCAnJykucmVwbGFjZSgncGxheWVyLicsICcnKTtcbiAgY29uc3QgY3VzdG9tRG9tYWlucyA9IFsnLnZpZGVvamkuaGsnLCAnLnZpbWVvLndvcmsnLCAnLnZpZGVvamkuY24nXTtcbiAgZm9yIChjb25zdCBjdXN0b21Eb21haW4gb2YgY3VzdG9tRG9tYWlucykge1xuICAgIGlmIChkb21haW4uZW5kc1dpdGgoY3VzdG9tRG9tYWluKSkge1xuICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICd2aW1lby5jb20nO1xufVxuXG4vKipcbiAqIEdldCB0aGUgVmltZW8gVVJMIGZyb20gYW4gZWxlbWVudC5cbiAqIFRoZSBlbGVtZW50IG11c3QgaGF2ZSBlaXRoZXIgYSBkYXRhLXZpbWVvLWlkIG9yIGRhdGEtdmltZW8tdXJsIGF0dHJpYnV0ZS5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb0VtYmVkUGFyYW1ldGVycyBUaGUgb0VtYmVkIHBhcmFtZXRlcnMuXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGdldFZpbWVvVXJsKCkge1xuICBsZXQgb0VtYmVkUGFyYW1ldGVycyA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge307XG4gIGNvbnN0IGlkID0gb0VtYmVkUGFyYW1ldGVycy5pZDtcbiAgY29uc3QgdXJsID0gb0VtYmVkUGFyYW1ldGVycy51cmw7XG4gIGNvbnN0IGlkT3JVcmwgPSBpZCB8fCB1cmw7XG4gIGlmICghaWRPclVybCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQW4gaWQgb3IgdXJsIG11c3QgYmUgcGFzc2VkLCBlaXRoZXIgaW4gYW4gb3B0aW9ucyBvYmplY3Qgb3IgYXMgYSBkYXRhLXZpbWVvLWlkIG9yIGRhdGEtdmltZW8tdXJsIGF0dHJpYnV0ZS4nKTtcbiAgfVxuICBpZiAoaXNJbnRlZ2VyKGlkT3JVcmwpKSB7XG4gICAgcmV0dXJuIGBodHRwczovL3ZpbWVvLmNvbS8ke2lkT3JVcmx9YDtcbiAgfVxuICBpZiAoaXNWaW1lb1VybChpZE9yVXJsKSkge1xuICAgIHJldHVybiBpZE9yVXJsLnJlcGxhY2UoJ2h0dHA6JywgJ2h0dHBzOicpO1xuICB9XG4gIGlmIChpZCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYOKAnCR7aWR94oCdIGlzIG5vdCBhIHZhbGlkIHZpZGVvIGlkLmApO1xuICB9XG4gIHRocm93IG5ldyBUeXBlRXJyb3IoYOKAnCR7aWRPclVybH3igJ0gaXMgbm90IGEgdmltZW8uY29tIHVybC5gKTtcbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LXBhcmFtcyAqL1xuLyoqXG4gKiBBIHV0aWxpdHkgbWV0aG9kIGZvciBhdHRhY2hpbmcgYW5kIGRldGFjaGluZyBldmVudCBoYW5kbGVyc1xuICpcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldFxuICogQHBhcmFtIHtzdHJpbmcgfCBzdHJpbmdbXX0gZXZlbnROYW1lXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHBhcmFtIHsnYWRkRXZlbnRMaXN0ZW5lcicgfCAnb24nfSBvbk5hbWVcbiAqIEBwYXJhbSB7J3JlbW92ZUV2ZW50TGlzdGVuZXInIHwgJ29mZid9IG9mZk5hbWVcbiAqIEByZXR1cm4ge3tjYW5jZWw6IChmdW5jdGlvbigpOiB2b2lkKX19XG4gKi9cbmNvbnN0IHN1YnNjcmliZSA9IGZ1bmN0aW9uICh0YXJnZXQsIGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgbGV0IG9uTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogJ2FkZEV2ZW50TGlzdGVuZXInO1xuICBsZXQgb2ZmTmFtZSA9IGFyZ3VtZW50cy5sZW5ndGggPiA0ICYmIGFyZ3VtZW50c1s0XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzRdIDogJ3JlbW92ZUV2ZW50TGlzdGVuZXInO1xuICBjb25zdCBldmVudE5hbWVzID0gdHlwZW9mIGV2ZW50TmFtZSA9PT0gJ3N0cmluZycgPyBbZXZlbnROYW1lXSA6IGV2ZW50TmFtZTtcbiAgZXZlbnROYW1lcy5mb3JFYWNoKGV2TmFtZSA9PiB7XG4gICAgdGFyZ2V0W29uTmFtZV0oZXZOYW1lLCBjYWxsYmFjayk7XG4gIH0pO1xuICByZXR1cm4ge1xuICAgIGNhbmNlbDogKCkgPT4gZXZlbnROYW1lcy5mb3JFYWNoKGV2TmFtZSA9PiB0YXJnZXRbb2ZmTmFtZV0oZXZOYW1lLCBjYWxsYmFjaykpXG4gIH07XG59O1xuXG4vKipcbiAqIEZpbmQgdGhlIGlmcmFtZSBlbGVtZW50IHRoYXQgY29udGFpbnMgYSBzcGVjaWZpYyBzb3VyY2Ugd2luZG93XG4gKlxuICogQHBhcmFtIHtXaW5kb3d9IHNvdXJjZVdpbmRvdyBUaGUgc291cmNlIHdpbmRvdyB0byBmaW5kIHRoZSBpZnJhbWUgZm9yXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBbZG9jPWRvY3VtZW50XSBUaGUgZG9jdW1lbnQgdG8gc2VhcmNoIHdpdGhpblxuICogQHJldHVybiB7SFRNTElGcmFtZUVsZW1lbnR8bnVsbH0gVGhlIGlmcmFtZSBlbGVtZW50IGlmIGZvdW5kLCBvdGhlcndpc2UgbnVsbFxuICovXG5mdW5jdGlvbiBmaW5kSWZyYW1lQnlTb3VyY2VXaW5kb3coc291cmNlV2luZG93KSB7XG4gIGxldCBkb2MgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IGRvY3VtZW50O1xuICBpZiAoIXNvdXJjZVdpbmRvdyB8fCAhZG9jIHx8IHR5cGVvZiBkb2MucXVlcnlTZWxlY3RvckFsbCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGlmcmFtZXMgPSBkb2MucXVlcnlTZWxlY3RvckFsbCgnaWZyYW1lJyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaWZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpZnJhbWVzW2ldICYmIGlmcmFtZXNbaV0uY29udGVudFdpbmRvdyA9PT0gc291cmNlV2luZG93KSB7XG4gICAgICByZXR1cm4gaWZyYW1lc1tpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmNvbnN0IGFycmF5SW5kZXhPZlN1cHBvcnQgPSB0eXBlb2YgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgIT09ICd1bmRlZmluZWQnO1xuY29uc3QgcG9zdE1lc3NhZ2VTdXBwb3J0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHdpbmRvdy5wb3N0TWVzc2FnZSAhPT0gJ3VuZGVmaW5lZCc7XG5pZiAoIWlzU2VydmVyUnVudGltZSAmJiAoIWFycmF5SW5kZXhPZlN1cHBvcnQgfHwgIXBvc3RNZXNzYWdlU3VwcG9ydCkpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdTb3JyeSwgdGhlIFZpbWVvIFBsYXllciBBUEkgaXMgbm90IGF2YWlsYWJsZSBpbiB0aGlzIGJyb3dzZXIuJyk7XG59XG5cbnZhciBjb21tb25qc0dsb2JhbCA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHt9O1xuXG5mdW5jdGlvbiBjcmVhdGVDb21tb25qc01vZHVsZShmbiwgbW9kdWxlKSB7XG5cdHJldHVybiBtb2R1bGUgPSB7IGV4cG9ydHM6IHt9IH0sIGZuKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMpLCBtb2R1bGUuZXhwb3J0cztcbn1cblxuLyohXG4gKiB3ZWFrbWFwLXBvbHlmaWxsIHYyLjAuNCAtIEVDTUFTY3JpcHQ2IFdlYWtNYXAgcG9seWZpbGxcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9wb2x5Z29ucGxhbmV0L3dlYWttYXAtcG9seWZpbGxcbiAqIENvcHlyaWdodCAoYykgMjAxNS0yMDIxIHBvbHlnb25wbGFuZXQgPHBvbHlnb24ucGxhbmV0LmFxdWFAZ21haWwuY29tPlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuKGZ1bmN0aW9uIChzZWxmKSB7XG5cbiAgaWYgKHNlbGYuV2Vha01hcCkge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICB2YXIgaGFzRGVmaW5lID0gT2JqZWN0LmRlZmluZVByb3BlcnR5ICYmIGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgLy8gQXZvaWQgSUU4J3MgYnJva2VuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eVxuICAgICAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh7fSwgJ3gnLCB7XG4gICAgICAgIHZhbHVlOiAxXG4gICAgICB9KS54ID09PSAxO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH0oKTtcbiAgdmFyIGRlZmluZVByb3BlcnR5ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgdmFsdWUpIHtcbiAgICBpZiAoaGFzRGVmaW5lKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqZWN0LCBuYW1lLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiB2YWx1ZVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9iamVjdFtuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfTtcbiAgc2VsZi5XZWFrTWFwID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIEVDTUEtMjYyIDIzLjMgV2Vha01hcCBPYmplY3RzXG4gICAgZnVuY3Rpb24gV2Vha01hcCgpIHtcbiAgICAgIGlmICh0aGlzID09PSB2b2lkIDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNvbnN0cnVjdG9yIFdlYWtNYXAgcmVxdWlyZXMgJ25ldydcIik7XG4gICAgICB9XG4gICAgICBkZWZpbmVQcm9wZXJ0eSh0aGlzLCAnX2lkJywgZ2VuSWQoJ19XZWFrTWFwJykpO1xuXG4gICAgICAvLyBFQ01BLTI2MiAyMy4zLjEuMSBXZWFrTWFwKFtpdGVyYWJsZV0pXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gQ3VycmVudGx5LCBXZWFrTWFwIGBpdGVyYWJsZWAgYXJndW1lbnQgaXMgbm90IHN1cHBvcnRlZFxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdXZWFrTWFwIGl0ZXJhYmxlIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBFQ01BLTI2MiAyMy4zLjMuMiBXZWFrTWFwLnByb3RvdHlwZS5kZWxldGUoa2V5KVxuICAgIGRlZmluZVByb3BlcnR5KFdlYWtNYXAucHJvdG90eXBlLCAnZGVsZXRlJywgZnVuY3Rpb24gKGtleSkge1xuICAgICAgY2hlY2tJbnN0YW5jZSh0aGlzLCAnZGVsZXRlJyk7XG4gICAgICBpZiAoIWlzT2JqZWN0KGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMuX2lkXTtcbiAgICAgIGlmIChlbnRyeSAmJiBlbnRyeVswXSA9PT0ga2V5KSB7XG4gICAgICAgIGRlbGV0ZSBrZXlbdGhpcy5faWRdO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIC8vIEVDTUEtMjYyIDIzLjMuMy4zIFdlYWtNYXAucHJvdG90eXBlLmdldChrZXkpXG4gICAgZGVmaW5lUHJvcGVydHkoV2Vha01hcC5wcm90b3R5cGUsICdnZXQnLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBjaGVja0luc3RhbmNlKHRoaXMsICdnZXQnKTtcbiAgICAgIGlmICghaXNPYmplY3Qoa2V5KSkge1xuICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgfVxuICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMuX2lkXTtcbiAgICAgIGlmIChlbnRyeSAmJiBlbnRyeVswXSA9PT0ga2V5KSB7XG4gICAgICAgIHJldHVybiBlbnRyeVsxXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfSk7XG5cbiAgICAvLyBFQ01BLTI2MiAyMy4zLjMuNCBXZWFrTWFwLnByb3RvdHlwZS5oYXMoa2V5KVxuICAgIGRlZmluZVByb3BlcnR5KFdlYWtNYXAucHJvdG90eXBlLCAnaGFzJywgZnVuY3Rpb24gKGtleSkge1xuICAgICAgY2hlY2tJbnN0YW5jZSh0aGlzLCAnaGFzJyk7XG4gICAgICBpZiAoIWlzT2JqZWN0KGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMuX2lkXTtcbiAgICAgIGlmIChlbnRyeSAmJiBlbnRyeVswXSA9PT0ga2V5KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuXG4gICAgLy8gRUNNQS0yNjIgMjMuMy4zLjUgV2Vha01hcC5wcm90b3R5cGUuc2V0KGtleSwgdmFsdWUpXG4gICAgZGVmaW5lUHJvcGVydHkoV2Vha01hcC5wcm90b3R5cGUsICdzZXQnLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgY2hlY2tJbnN0YW5jZSh0aGlzLCAnc2V0Jyk7XG4gICAgICBpZiAoIWlzT2JqZWN0KGtleSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCB2YWx1ZSB1c2VkIGFzIHdlYWsgbWFwIGtleScpO1xuICAgICAgfVxuICAgICAgdmFyIGVudHJ5ID0ga2V5W3RoaXMuX2lkXTtcbiAgICAgIGlmIChlbnRyeSAmJiBlbnRyeVswXSA9PT0ga2V5KSB7XG4gICAgICAgIGVudHJ5WzFdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgZGVmaW5lUHJvcGVydHkoa2V5LCB0aGlzLl9pZCwgW2tleSwgdmFsdWVdKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICAgIGZ1bmN0aW9uIGNoZWNrSW5zdGFuY2UoeCwgbWV0aG9kTmFtZSkge1xuICAgICAgaWYgKCFpc09iamVjdCh4KSB8fCAhaGFzT3duUHJvcGVydHkuY2FsbCh4LCAnX2lkJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihtZXRob2ROYW1lICsgJyBtZXRob2QgY2FsbGVkIG9uIGluY29tcGF0aWJsZSByZWNlaXZlciAnICsgdHlwZW9mIHgpO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBnZW5JZChwcmVmaXgpIHtcbiAgICAgIHJldHVybiBwcmVmaXggKyAnXycgKyByYW5kKCkgKyAnLicgKyByYW5kKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJhbmQoKSB7XG4gICAgICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygpLnN1YnN0cmluZygyKTtcbiAgICB9XG4gICAgZGVmaW5lUHJvcGVydHkoV2Vha01hcCwgJ19wb2x5ZmlsbCcsIHRydWUpO1xuICAgIHJldHVybiBXZWFrTWFwO1xuICB9KCk7XG4gIGZ1bmN0aW9uIGlzT2JqZWN0KHgpIHtcbiAgICByZXR1cm4gT2JqZWN0KHgpID09PSB4O1xuICB9XG59KSh0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWxUaGlzIDogdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdHlwZW9mIGNvbW1vbmpzR2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGNvbW1vbmpzR2xvYmFsIDogY29tbW9uanNHbG9iYWwpO1xuXG52YXIgbnBvX3NyYyA9IGNyZWF0ZUNvbW1vbmpzTW9kdWxlKGZ1bmN0aW9uIChtb2R1bGUpIHtcbi8qISBOYXRpdmUgUHJvbWlzZSBPbmx5XG4gICAgdjAuOC4xIChjKSBLeWxlIFNpbXBzb25cbiAgICBNSVQgTGljZW5zZTogaHR0cDovL2dldGlmeS5taXQtbGljZW5zZS5vcmdcbiovXG5cbihmdW5jdGlvbiBVTUQobmFtZSwgY29udGV4dCwgZGVmaW5pdGlvbikge1xuICAvLyBzcGVjaWFsIGZvcm0gb2YgVU1EIGZvciBwb2x5ZmlsbGluZyBhY3Jvc3MgZXZpcm9ubWVudHNcbiAgY29udGV4dFtuYW1lXSA9IGNvbnRleHRbbmFtZV0gfHwgZGVmaW5pdGlvbigpO1xuICBpZiAobW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGNvbnRleHRbbmFtZV07XG4gIH1cbn0pKFwiUHJvbWlzZVwiLCB0eXBlb2YgY29tbW9uanNHbG9iYWwgIT0gXCJ1bmRlZmluZWRcIiA/IGNvbW1vbmpzR2xvYmFsIDogY29tbW9uanNHbG9iYWwsIGZ1bmN0aW9uIERFRigpIHtcblxuICB2YXIgYnVpbHRJblByb3AsXG4gICAgY3ljbGUsXG4gICAgc2NoZWR1bGluZ19xdWV1ZSxcbiAgICBUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG4gICAgdGltZXIgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlICE9IFwidW5kZWZpbmVkXCIgPyBmdW5jdGlvbiB0aW1lcihmbikge1xuICAgICAgcmV0dXJuIHNldEltbWVkaWF0ZShmbik7XG4gICAgfSA6IHNldFRpbWVvdXQ7XG5cbiAgLy8gZGFtbWl0LCBJRTguXG4gIHRyeSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LCBcInhcIiwge30pO1xuICAgIGJ1aWx0SW5Qcm9wID0gZnVuY3Rpb24gYnVpbHRJblByb3Aob2JqLCBuYW1lLCB2YWwsIGNvbmZpZykge1xuICAgICAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIG5hbWUsIHtcbiAgICAgICAgdmFsdWU6IHZhbCxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogY29uZmlnICE9PSBmYWxzZVxuICAgICAgfSk7XG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYnVpbHRJblByb3AgPSBmdW5jdGlvbiBidWlsdEluUHJvcChvYmosIG5hbWUsIHZhbCkge1xuICAgICAgb2JqW25hbWVdID0gdmFsO1xuICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuICB9XG5cbiAgLy8gTm90ZTogdXNpbmcgYSBxdWV1ZSBpbnN0ZWFkIG9mIGFycmF5IGZvciBlZmZpY2llbmN5XG4gIHNjaGVkdWxpbmdfcXVldWUgPSBmdW5jdGlvbiBRdWV1ZSgpIHtcbiAgICB2YXIgZmlyc3QsIGxhc3QsIGl0ZW07XG4gICAgZnVuY3Rpb24gSXRlbShmbiwgc2VsZikge1xuICAgICAgdGhpcy5mbiA9IGZuO1xuICAgICAgdGhpcy5zZWxmID0gc2VsZjtcbiAgICAgIHRoaXMubmV4dCA9IHZvaWQgMDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZDogZnVuY3Rpb24gYWRkKGZuLCBzZWxmKSB7XG4gICAgICAgIGl0ZW0gPSBuZXcgSXRlbShmbiwgc2VsZik7XG4gICAgICAgIGlmIChsYXN0KSB7XG4gICAgICAgICAgbGFzdC5uZXh0ID0gaXRlbTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmaXJzdCA9IGl0ZW07XG4gICAgICAgIH1cbiAgICAgICAgbGFzdCA9IGl0ZW07XG4gICAgICAgIGl0ZW0gPSB2b2lkIDA7XG4gICAgICB9LFxuICAgICAgZHJhaW46IGZ1bmN0aW9uIGRyYWluKCkge1xuICAgICAgICB2YXIgZiA9IGZpcnN0O1xuICAgICAgICBmaXJzdCA9IGxhc3QgPSBjeWNsZSA9IHZvaWQgMDtcbiAgICAgICAgd2hpbGUgKGYpIHtcbiAgICAgICAgICBmLmZuLmNhbGwoZi5zZWxmKTtcbiAgICAgICAgICBmID0gZi5uZXh0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfSgpO1xuICBmdW5jdGlvbiBzY2hlZHVsZShmbiwgc2VsZikge1xuICAgIHNjaGVkdWxpbmdfcXVldWUuYWRkKGZuLCBzZWxmKTtcbiAgICBpZiAoIWN5Y2xlKSB7XG4gICAgICBjeWNsZSA9IHRpbWVyKHNjaGVkdWxpbmdfcXVldWUuZHJhaW4pO1xuICAgIH1cbiAgfVxuXG4gIC8vIHByb21pc2UgZHVjayB0eXBpbmdcbiAgZnVuY3Rpb24gaXNUaGVuYWJsZShvKSB7XG4gICAgdmFyIF90aGVuLFxuICAgICAgb190eXBlID0gdHlwZW9mIG87XG4gICAgaWYgKG8gIT0gbnVsbCAmJiAob190eXBlID09IFwib2JqZWN0XCIgfHwgb190eXBlID09IFwiZnVuY3Rpb25cIikpIHtcbiAgICAgIF90aGVuID0gby50aGVuO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZW9mIF90aGVuID09IFwiZnVuY3Rpb25cIiA/IF90aGVuIDogZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gbm90aWZ5KCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGFpbi5sZW5ndGg7IGkrKykge1xuICAgICAgbm90aWZ5SXNvbGF0ZWQodGhpcywgdGhpcy5zdGF0ZSA9PT0gMSA/IHRoaXMuY2hhaW5baV0uc3VjY2VzcyA6IHRoaXMuY2hhaW5baV0uZmFpbHVyZSwgdGhpcy5jaGFpbltpXSk7XG4gICAgfVxuICAgIHRoaXMuY2hhaW4ubGVuZ3RoID0gMDtcbiAgfVxuXG4gIC8vIE5PVEU6IFRoaXMgaXMgYSBzZXBhcmF0ZSBmdW5jdGlvbiB0byBpc29sYXRlXG4gIC8vIHRoZSBgdHJ5Li5jYXRjaGAgc28gdGhhdCBvdGhlciBjb2RlIGNhbiBiZVxuICAvLyBvcHRpbWl6ZWQgYmV0dGVyXG4gIGZ1bmN0aW9uIG5vdGlmeUlzb2xhdGVkKHNlbGYsIGNiLCBjaGFpbikge1xuICAgIHZhciByZXQsIF90aGVuO1xuICAgIHRyeSB7XG4gICAgICBpZiAoY2IgPT09IGZhbHNlKSB7XG4gICAgICAgIGNoYWluLnJlamVjdChzZWxmLm1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2IgPT09IHRydWUpIHtcbiAgICAgICAgICByZXQgPSBzZWxmLm1zZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXQgPSBjYi5jYWxsKHZvaWQgMCwgc2VsZi5tc2cpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXQgPT09IGNoYWluLnByb21pc2UpIHtcbiAgICAgICAgICBjaGFpbi5yZWplY3QoVHlwZUVycm9yKFwiUHJvbWlzZS1jaGFpbiBjeWNsZVwiKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoX3RoZW4gPSBpc1RoZW5hYmxlKHJldCkpIHtcbiAgICAgICAgICBfdGhlbi5jYWxsKHJldCwgY2hhaW4ucmVzb2x2ZSwgY2hhaW4ucmVqZWN0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjaGFpbi5yZXNvbHZlKHJldCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNoYWluLnJlamVjdChlcnIpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZXNvbHZlKG1zZykge1xuICAgIHZhciBfdGhlbixcbiAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gYWxyZWFkeSB0cmlnZ2VyZWQ/XG4gICAgaWYgKHNlbGYudHJpZ2dlcmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNlbGYudHJpZ2dlcmVkID0gdHJ1ZTtcblxuICAgIC8vIHVud3JhcFxuICAgIGlmIChzZWxmLmRlZikge1xuICAgICAgc2VsZiA9IHNlbGYuZGVmO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgaWYgKF90aGVuID0gaXNUaGVuYWJsZShtc2cpKSB7XG4gICAgICAgIHNjaGVkdWxlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgZGVmX3dyYXBwZXIgPSBuZXcgTWFrZURlZldyYXBwZXIoc2VsZik7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIF90aGVuLmNhbGwobXNnLCBmdW5jdGlvbiAkcmVzb2x2ZSQoKSB7XG4gICAgICAgICAgICAgIHJlc29sdmUuYXBwbHkoZGVmX3dyYXBwZXIsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAkcmVqZWN0JCgpIHtcbiAgICAgICAgICAgICAgcmVqZWN0LmFwcGx5KGRlZl93cmFwcGVyLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QuY2FsbChkZWZfd3JhcHBlciwgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5tc2cgPSBtc2c7XG4gICAgICAgIHNlbGYuc3RhdGUgPSAxO1xuICAgICAgICBpZiAoc2VsZi5jaGFpbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgc2NoZWR1bGUobm90aWZ5LCBzZWxmKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmVqZWN0LmNhbGwobmV3IE1ha2VEZWZXcmFwcGVyKHNlbGYpLCBlcnIpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiByZWplY3QobXNnKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gYWxyZWFkeSB0cmlnZ2VyZWQ/XG4gICAgaWYgKHNlbGYudHJpZ2dlcmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNlbGYudHJpZ2dlcmVkID0gdHJ1ZTtcblxuICAgIC8vIHVud3JhcFxuICAgIGlmIChzZWxmLmRlZikge1xuICAgICAgc2VsZiA9IHNlbGYuZGVmO1xuICAgIH1cbiAgICBzZWxmLm1zZyA9IG1zZztcbiAgICBzZWxmLnN0YXRlID0gMjtcbiAgICBpZiAoc2VsZi5jaGFpbi5sZW5ndGggPiAwKSB7XG4gICAgICBzY2hlZHVsZShub3RpZnksIHNlbGYpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBpdGVyYXRlUHJvbWlzZXMoQ29uc3RydWN0b3IsIGFyciwgcmVzb2x2ZXIsIHJlamVjdGVyKSB7XG4gICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgYXJyLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgIChmdW5jdGlvbiBJSUZFKGlkeCkge1xuICAgICAgICBDb25zdHJ1Y3Rvci5yZXNvbHZlKGFycltpZHhdKS50aGVuKGZ1bmN0aW9uICRyZXNvbHZlciQobXNnKSB7XG4gICAgICAgICAgcmVzb2x2ZXIoaWR4LCBtc2cpO1xuICAgICAgICB9LCByZWplY3Rlcik7XG4gICAgICB9KShpZHgpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBNYWtlRGVmV3JhcHBlcihzZWxmKSB7XG4gICAgdGhpcy5kZWYgPSBzZWxmO1xuICAgIHRoaXMudHJpZ2dlcmVkID0gZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gTWFrZURlZihzZWxmKSB7XG4gICAgdGhpcy5wcm9taXNlID0gc2VsZjtcbiAgICB0aGlzLnN0YXRlID0gMDtcbiAgICB0aGlzLnRyaWdnZXJlZCA9IGZhbHNlO1xuICAgIHRoaXMuY2hhaW4gPSBbXTtcbiAgICB0aGlzLm1zZyA9IHZvaWQgMDtcbiAgfVxuICBmdW5jdGlvbiBQcm9taXNlKGV4ZWN1dG9yKSB7XG4gICAgaWYgKHR5cGVvZiBleGVjdXRvciAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcihcIk5vdCBhIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX05QT19fICE9PSAwKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoXCJOb3QgYSBwcm9taXNlXCIpO1xuICAgIH1cblxuICAgIC8vIGluc3RhbmNlIHNoYWRvd2luZyB0aGUgaW5oZXJpdGVkIFwiYnJhbmRcIlxuICAgIC8vIHRvIHNpZ25hbCBhbiBhbHJlYWR5IFwiaW5pdGlhbGl6ZWRcIiBwcm9taXNlXG4gICAgdGhpcy5fX05QT19fID0gMTtcbiAgICB2YXIgZGVmID0gbmV3IE1ha2VEZWYodGhpcyk7XG4gICAgdGhpc1tcInRoZW5cIl0gPSBmdW5jdGlvbiB0aGVuKHN1Y2Nlc3MsIGZhaWx1cmUpIHtcbiAgICAgIHZhciBvID0ge1xuICAgICAgICBzdWNjZXNzOiB0eXBlb2Ygc3VjY2VzcyA9PSBcImZ1bmN0aW9uXCIgPyBzdWNjZXNzIDogdHJ1ZSxcbiAgICAgICAgZmFpbHVyZTogdHlwZW9mIGZhaWx1cmUgPT0gXCJmdW5jdGlvblwiID8gZmFpbHVyZSA6IGZhbHNlXG4gICAgICB9O1xuICAgICAgLy8gTm90ZTogYHRoZW4oLi4pYCBpdHNlbGYgY2FuIGJlIGJvcnJvd2VkIHRvIGJlIHVzZWQgYWdhaW5zdFxuICAgICAgLy8gYSBkaWZmZXJlbnQgcHJvbWlzZSBjb25zdHJ1Y3RvciBmb3IgbWFraW5nIHRoZSBjaGFpbmVkIHByb21pc2UsXG4gICAgICAvLyBieSBzdWJzdGl0dXRpbmcgYSBkaWZmZXJlbnQgYHRoaXNgIGJpbmRpbmcuXG4gICAgICBvLnByb21pc2UgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihmdW5jdGlvbiBleHRyYWN0Q2hhaW4ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzb2x2ZSAhPSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIHJlamVjdCAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJOb3QgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgICBvLnJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgICBvLnJlamVjdCA9IHJlamVjdDtcbiAgICAgIH0pO1xuICAgICAgZGVmLmNoYWluLnB1c2gobyk7XG4gICAgICBpZiAoZGVmLnN0YXRlICE9PSAwKSB7XG4gICAgICAgIHNjaGVkdWxlKG5vdGlmeSwgZGVmKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvLnByb21pc2U7XG4gICAgfTtcbiAgICB0aGlzW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAkY2F0Y2gkKGZhaWx1cmUpIHtcbiAgICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCBmYWlsdXJlKTtcbiAgICB9O1xuICAgIHRyeSB7XG4gICAgICBleGVjdXRvci5jYWxsKHZvaWQgMCwgZnVuY3Rpb24gcHVibGljUmVzb2x2ZShtc2cpIHtcbiAgICAgICAgcmVzb2x2ZS5jYWxsKGRlZiwgbXNnKTtcbiAgICAgIH0sIGZ1bmN0aW9uIHB1YmxpY1JlamVjdChtc2cpIHtcbiAgICAgICAgcmVqZWN0LmNhbGwoZGVmLCBtc2cpO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZWplY3QuY2FsbChkZWYsIGVycik7XG4gICAgfVxuICB9XG4gIHZhciBQcm9taXNlUHJvdG90eXBlID0gYnVpbHRJblByb3Aoe30sIFwiY29uc3RydWN0b3JcIiwgUHJvbWlzZSwgLypjb25maWd1cmFibGU9Ki9mYWxzZSk7XG5cbiAgLy8gTm90ZTogQW5kcm9pZCA0IGNhbm5vdCB1c2UgYE9iamVjdC5kZWZpbmVQcm9wZXJ0eSguLilgIGhlcmVcbiAgUHJvbWlzZS5wcm90b3R5cGUgPSBQcm9taXNlUHJvdG90eXBlO1xuXG4gIC8vIGJ1aWx0LWluIFwiYnJhbmRcIiB0byBzaWduYWwgYW4gXCJ1bmluaXRpYWxpemVkXCIgcHJvbWlzZVxuICBidWlsdEluUHJvcChQcm9taXNlUHJvdG90eXBlLCBcIl9fTlBPX19cIiwgMCwgLypjb25maWd1cmFibGU9Ki9mYWxzZSk7XG4gIGJ1aWx0SW5Qcm9wKFByb21pc2UsIFwicmVzb2x2ZVwiLCBmdW5jdGlvbiBQcm9taXNlJHJlc29sdmUobXNnKSB7XG4gICAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICAgIC8vIHNwZWMgbWFuZGF0ZWQgY2hlY2tzXG4gICAgLy8gbm90ZTogYmVzdCBcImlzUHJvbWlzZVwiIGNoZWNrIHRoYXQncyBwcmFjdGljYWwgZm9yIG5vd1xuICAgIGlmIChtc2cgJiYgdHlwZW9mIG1zZyA9PSBcIm9iamVjdFwiICYmIG1zZy5fX05QT19fID09PSAxKSB7XG4gICAgICByZXR1cm4gbXNnO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIGV4ZWN1dG9yKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWYgKHR5cGVvZiByZXNvbHZlICE9IFwiZnVuY3Rpb25cIiB8fCB0eXBlb2YgcmVqZWN0ICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJOb3QgYSBmdW5jdGlvblwiKTtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUobXNnKTtcbiAgICB9KTtcbiAgfSk7XG4gIGJ1aWx0SW5Qcm9wKFByb21pc2UsIFwicmVqZWN0XCIsIGZ1bmN0aW9uIFByb21pc2UkcmVqZWN0KG1zZykge1xuICAgIHJldHVybiBuZXcgdGhpcyhmdW5jdGlvbiBleGVjdXRvcihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGlmICh0eXBlb2YgcmVzb2x2ZSAhPSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIHJlamVjdCAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiTm90IGEgZnVuY3Rpb25cIik7XG4gICAgICB9XG4gICAgICByZWplY3QobXNnKTtcbiAgICB9KTtcbiAgfSk7XG4gIGJ1aWx0SW5Qcm9wKFByb21pc2UsIFwiYWxsXCIsIGZ1bmN0aW9uIFByb21pc2UkYWxsKGFycikge1xuICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAvLyBzcGVjIG1hbmRhdGVkIGNoZWNrc1xuICAgIGlmIChUb1N0cmluZy5jYWxsKGFycikgIT0gXCJbb2JqZWN0IEFycmF5XVwiKSB7XG4gICAgICByZXR1cm4gQ29uc3RydWN0b3IucmVqZWN0KFR5cGVFcnJvcihcIk5vdCBhbiBhcnJheVwiKSk7XG4gICAgfVxuICAgIGlmIChhcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gQ29uc3RydWN0b3IucmVzb2x2ZShbXSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29uc3RydWN0b3IoZnVuY3Rpb24gZXhlY3V0b3IocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBpZiAodHlwZW9mIHJlc29sdmUgIT0gXCJmdW5jdGlvblwiIHx8IHR5cGVvZiByZWplY3QgIT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcIk5vdCBhIGZ1bmN0aW9uXCIpO1xuICAgICAgfVxuICAgICAgdmFyIGxlbiA9IGFyci5sZW5ndGgsXG4gICAgICAgIG1zZ3MgPSBBcnJheShsZW4pLFxuICAgICAgICBjb3VudCA9IDA7XG4gICAgICBpdGVyYXRlUHJvbWlzZXMoQ29uc3RydWN0b3IsIGFyciwgZnVuY3Rpb24gcmVzb2x2ZXIoaWR4LCBtc2cpIHtcbiAgICAgICAgbXNnc1tpZHhdID0gbXNnO1xuICAgICAgICBpZiAoKytjb3VudCA9PT0gbGVuKSB7XG4gICAgICAgICAgcmVzb2x2ZShtc2dzKTtcbiAgICAgICAgfVxuICAgICAgfSwgcmVqZWN0KTtcbiAgICB9KTtcbiAgfSk7XG4gIGJ1aWx0SW5Qcm9wKFByb21pc2UsIFwicmFjZVwiLCBmdW5jdGlvbiBQcm9taXNlJHJhY2UoYXJyKSB7XG4gICAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICAgIC8vIHNwZWMgbWFuZGF0ZWQgY2hlY2tzXG4gICAgaWYgKFRvU3RyaW5nLmNhbGwoYXJyKSAhPSBcIltvYmplY3QgQXJyYXldXCIpIHtcbiAgICAgIHJldHVybiBDb25zdHJ1Y3Rvci5yZWplY3QoVHlwZUVycm9yKFwiTm90IGFuIGFycmF5XCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihmdW5jdGlvbiBleGVjdXRvcihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGlmICh0eXBlb2YgcmVzb2x2ZSAhPSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIHJlamVjdCAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiTm90IGEgZnVuY3Rpb25cIik7XG4gICAgICB9XG4gICAgICBpdGVyYXRlUHJvbWlzZXMoQ29uc3RydWN0b3IsIGFyciwgZnVuY3Rpb24gcmVzb2x2ZXIoaWR4LCBtc2cpIHtcbiAgICAgICAgcmVzb2x2ZShtc2cpO1xuICAgICAgfSwgcmVqZWN0KTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiBQcm9taXNlO1xufSk7XG59KTtcblxuLyoqXG4gKiBAbW9kdWxlIGxpYi9jYWxsYmFja3NcbiAqL1xuXG5jb25zdCBjYWxsYmFja01hcCA9IG5ldyBXZWFrTWFwKCk7XG5cbi8qKlxuICogU3RvcmUgYSBjYWxsYmFjayBmb3IgYSBtZXRob2Qgb3IgZXZlbnQgZm9yIGEgcGxheWVyLlxuICpcbiAqIEBwYXJhbSB7UGxheWVyfSBwbGF5ZXIgVGhlIHBsYXllciBvYmplY3QuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbWV0aG9kIG9yIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0geyhmdW5jdGlvbih0aGlzOlBsYXllciwgKik6IHZvaWR8e3Jlc29sdmU6IGZ1bmN0aW9uLCByZWplY3Q6IGZ1bmN0aW9ufSl9IGNhbGxiYWNrXG4gKiAgICAgICAgVGhlIGNhbGxiYWNrIHRvIGNhbGwgb3IgYW4gb2JqZWN0IHdpdGggcmVzb2x2ZSBhbmQgcmVqZWN0IGZ1bmN0aW9ucyBmb3IgYSBwcm9taXNlLlxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gc3RvcmVDYWxsYmFjayhwbGF5ZXIsIG5hbWUsIGNhbGxiYWNrKSB7XG4gIGNvbnN0IHBsYXllckNhbGxiYWNrcyA9IGNhbGxiYWNrTWFwLmdldChwbGF5ZXIuZWxlbWVudCkgfHwge307XG4gIGlmICghKG5hbWUgaW4gcGxheWVyQ2FsbGJhY2tzKSkge1xuICAgIHBsYXllckNhbGxiYWNrc1tuYW1lXSA9IFtdO1xuICB9XG4gIHBsYXllckNhbGxiYWNrc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgY2FsbGJhY2tNYXAuc2V0KHBsYXllci5lbGVtZW50LCBwbGF5ZXJDYWxsYmFja3MpO1xufVxuXG4vKipcbiAqIEdldCB0aGUgY2FsbGJhY2tzIGZvciBhIHBsYXllciBhbmQgZXZlbnQgb3IgbWV0aG9kLlxuICpcbiAqIEBwYXJhbSB7UGxheWVyfSBwbGF5ZXIgVGhlIHBsYXllciBvYmplY3QuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbWV0aG9kIG9yIGV2ZW50IG5hbWVcbiAqIEByZXR1cm4ge2Z1bmN0aW9uW119XG4gKi9cbmZ1bmN0aW9uIGdldENhbGxiYWNrcyhwbGF5ZXIsIG5hbWUpIHtcbiAgY29uc3QgcGxheWVyQ2FsbGJhY2tzID0gY2FsbGJhY2tNYXAuZ2V0KHBsYXllci5lbGVtZW50KSB8fCB7fTtcbiAgcmV0dXJuIHBsYXllckNhbGxiYWNrc1tuYW1lXSB8fCBbXTtcbn1cblxuLyoqXG4gKiBSZW1vdmUgYSBzdG9yZWQgY2FsbGJhY2sgZm9yIGEgbWV0aG9kIG9yIGV2ZW50IGZvciBhIHBsYXllci5cbiAqXG4gKiBAcGFyYW0ge1BsYXllcn0gcGxheWVyIFRoZSBwbGF5ZXIgb2JqZWN0LlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG1ldGhvZCBvciBldmVudCBuYW1lXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBzcGVjaWZpYyBjYWxsYmFjayB0byByZW1vdmUuXG4gKiBAcmV0dXJuIHtib29sZWFufSBXYXMgdGhpcyB0aGUgbGFzdCBjYWxsYmFjaz9cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlQ2FsbGJhY2socGxheWVyLCBuYW1lLCBjYWxsYmFjaykge1xuICBjb25zdCBwbGF5ZXJDYWxsYmFja3MgPSBjYWxsYmFja01hcC5nZXQocGxheWVyLmVsZW1lbnQpIHx8IHt9O1xuICBpZiAoIXBsYXllckNhbGxiYWNrc1tuYW1lXSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gSWYgbm8gY2FsbGJhY2sgaXMgcGFzc2VkLCByZW1vdmUgYWxsIGNhbGxiYWNrcyBmb3IgdGhlIGV2ZW50XG4gIGlmICghY2FsbGJhY2spIHtcbiAgICBwbGF5ZXJDYWxsYmFja3NbbmFtZV0gPSBbXTtcbiAgICBjYWxsYmFja01hcC5zZXQocGxheWVyLmVsZW1lbnQsIHBsYXllckNhbGxiYWNrcyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgY29uc3QgaW5kZXggPSBwbGF5ZXJDYWxsYmFja3NbbmFtZV0uaW5kZXhPZihjYWxsYmFjayk7XG4gIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICBwbGF5ZXJDYWxsYmFja3NbbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxuICBjYWxsYmFja01hcC5zZXQocGxheWVyLmVsZW1lbnQsIHBsYXllckNhbGxiYWNrcyk7XG4gIHJldHVybiBwbGF5ZXJDYWxsYmFja3NbbmFtZV0gJiYgcGxheWVyQ2FsbGJhY2tzW25hbWVdLmxlbmd0aCA9PT0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIGZpcnN0IHN0b3JlZCBjYWxsYmFjayBmb3IgYSBwbGF5ZXIgYW5kIGV2ZW50IG9yIG1ldGhvZC5cbiAqXG4gKiBAcGFyYW0ge1BsYXllcn0gcGxheWVyIFRoZSBwbGF5ZXIgb2JqZWN0LlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG1ldGhvZCBvciBldmVudCBuYW1lLlxuICogQHJldHVybiB7ZnVuY3Rpb259IFRoZSBjYWxsYmFjaywgb3IgZmFsc2UgaWYgdGhlcmUgd2VyZSBub25lXG4gKi9cbmZ1bmN0aW9uIHNoaWZ0Q2FsbGJhY2tzKHBsYXllciwgbmFtZSkge1xuICBjb25zdCBwbGF5ZXJDYWxsYmFja3MgPSBnZXRDYWxsYmFja3MocGxheWVyLCBuYW1lKTtcbiAgaWYgKHBsYXllckNhbGxiYWNrcy5sZW5ndGggPCAxKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGNhbGxiYWNrID0gcGxheWVyQ2FsbGJhY2tzLnNoaWZ0KCk7XG4gIHJlbW92ZUNhbGxiYWNrKHBsYXllciwgbmFtZSwgY2FsbGJhY2spO1xuICByZXR1cm4gY2FsbGJhY2s7XG59XG5cbi8qKlxuICogTW92ZSBjYWxsYmFja3MgYXNzb2NpYXRlZCB3aXRoIGFuIGVsZW1lbnQgdG8gYW5vdGhlciBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG9sZEVsZW1lbnQgVGhlIG9sZCBlbGVtZW50LlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gbmV3RWxlbWVudCBUaGUgbmV3IGVsZW1lbnQuXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBzd2FwQ2FsbGJhY2tzKG9sZEVsZW1lbnQsIG5ld0VsZW1lbnQpIHtcbiAgY29uc3QgcGxheWVyQ2FsbGJhY2tzID0gY2FsbGJhY2tNYXAuZ2V0KG9sZEVsZW1lbnQpO1xuICBjYWxsYmFja01hcC5zZXQobmV3RWxlbWVudCwgcGxheWVyQ2FsbGJhY2tzKTtcbiAgY2FsbGJhY2tNYXAuZGVsZXRlKG9sZEVsZW1lbnQpO1xufVxuXG4vKipcbiAqIEBtb2R1bGUgbGliL3Bvc3RtZXNzYWdlXG4gKi9cblxuLyoqXG4gKiBQYXJzZSBhIG1lc3NhZ2UgcmVjZWl2ZWQgZnJvbSBwb3N0TWVzc2FnZS5cbiAqXG4gKiBAcGFyYW0geyp9IGRhdGEgVGhlIGRhdGEgcmVjZWl2ZWQgZnJvbSBwb3N0TWVzc2FnZS5cbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xuZnVuY3Rpb24gcGFyc2VNZXNzYWdlRGF0YShkYXRhKSB7XG4gIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICB0cnkge1xuICAgICAgZGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIElmIHRoZSBtZXNzYWdlIGNhbm5vdCBiZSBwYXJzZWQsIHRocm93IHRoZSBlcnJvciBhcyBhIHdhcm5pbmdcbiAgICAgIGNvbnNvbGUud2FybihlcnJvcik7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkYXRhO1xufVxuXG4vKipcbiAqIFBvc3QgYSBtZXNzYWdlIHRvIHRoZSBzcGVjaWZpZWQgdGFyZ2V0LlxuICpcbiAqIEBwYXJhbSB7UGxheWVyfSBwbGF5ZXIgVGhlIHBsYXllciBvYmplY3QgdG8gdXNlLlxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCBUaGUgQVBJIG1ldGhvZCB0byBjYWxsLlxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfG9iamVjdHxBcnJheXx1bmRlZmluZWR9IHBhcmFtcyBUaGUgcGFyYW1ldGVycyB0byBzZW5kIHRvIHRoZSBwbGF5ZXIuXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBwb3N0TWVzc2FnZShwbGF5ZXIsIG1ldGhvZCwgcGFyYW1zKSB7XG4gIGlmICghcGxheWVyLmVsZW1lbnQuY29udGVudFdpbmRvdyB8fCAhcGxheWVyLmVsZW1lbnQuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgbWVzc2FnZSA9IHtcbiAgICBtZXRob2RcbiAgfTtcbiAgaWYgKHBhcmFtcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbWVzc2FnZS52YWx1ZSA9IHBhcmFtcztcbiAgfVxuXG4gIC8vIElFIDggYW5kIDkgZG8gbm90IHN1cHBvcnQgcGFzc2luZyBtZXNzYWdlcywgc28gc3RyaW5naWZ5IHRoZW1cbiAgY29uc3QgaWVWZXJzaW9uID0gcGFyc2VGbG9hdChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXi4qbXNpZSAoXFxkKykuKiQvLCAnJDEnKSk7XG4gIGlmIChpZVZlcnNpb24gPj0gOCAmJiBpZVZlcnNpb24gPCAxMCkge1xuICAgIG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeShtZXNzYWdlKTtcbiAgfVxuICBwbGF5ZXIuZWxlbWVudC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKG1lc3NhZ2UsIHBsYXllci5vcmlnaW4pO1xufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBkYXRhIHJlY2VpdmVkIGZyb20gYSBtZXNzYWdlIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7UGxheWVyfSBwbGF5ZXIgVGhlIHBsYXllciB0aGF0IHJlY2VpdmVkIHRoZSBtZXNzYWdlLlxuICogQHBhcmFtIHsoT2JqZWN0fHN0cmluZyl9IGRhdGEgVGhlIG1lc3NhZ2UgZGF0YS4gU3RyaW5ncyB3aWxsIGJlIHBhcnNlZCBpbnRvIEpTT04uXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBwcm9jZXNzRGF0YShwbGF5ZXIsIGRhdGEpIHtcbiAgZGF0YSA9IHBhcnNlTWVzc2FnZURhdGEoZGF0YSk7XG4gIGxldCBjYWxsYmFja3MgPSBbXTtcbiAgbGV0IHBhcmFtO1xuICBpZiAoZGF0YS5ldmVudCkge1xuICAgIGlmIChkYXRhLmV2ZW50ID09PSAnZXJyb3InKSB7XG4gICAgICBjb25zdCBwcm9taXNlcyA9IGdldENhbGxiYWNrcyhwbGF5ZXIsIGRhdGEuZGF0YS5tZXRob2QpO1xuICAgICAgcHJvbWlzZXMuZm9yRWFjaChwcm9taXNlID0+IHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoZGF0YS5kYXRhLm1lc3NhZ2UpO1xuICAgICAgICBlcnJvci5uYW1lID0gZGF0YS5kYXRhLm5hbWU7XG4gICAgICAgIHByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgcmVtb3ZlQ2FsbGJhY2socGxheWVyLCBkYXRhLmRhdGEubWV0aG9kLCBwcm9taXNlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBjYWxsYmFja3MgPSBnZXRDYWxsYmFja3MocGxheWVyLCBgZXZlbnQ6JHtkYXRhLmV2ZW50fWApO1xuICAgIHBhcmFtID0gZGF0YS5kYXRhO1xuICB9IGVsc2UgaWYgKGRhdGEubWV0aG9kKSB7XG4gICAgY29uc3QgY2FsbGJhY2sgPSBzaGlmdENhbGxiYWNrcyhwbGF5ZXIsIGRhdGEubWV0aG9kKTtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgIHBhcmFtID0gZGF0YS52YWx1ZTtcbiAgICB9XG4gIH1cbiAgY2FsbGJhY2tzLmZvckVhY2goY2FsbGJhY2sgPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwocGxheWVyLCBwYXJhbSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNhbGxiYWNrLnJlc29sdmUocGFyYW0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIGVtcHR5XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBAbW9kdWxlIGxpYi9lbWJlZFxuICovXG5jb25zdCBvRW1iZWRQYXJhbWV0ZXJzID0gWydhaXJwbGF5JywgJ2F1ZGlvX3RyYWNrcycsICdhdWRpb3RyYWNrJywgJ2F1dG9wYXVzZScsICdhdXRvcGxheScsICdiYWNrZ3JvdW5kJywgJ2J5bGluZScsICdjYycsICdjaGFwdGVyX2lkJywgJ2NoYXB0ZXJzJywgJ2Nocm9tZWNhc3QnLCAnY29sb3InLCAnY29sb3JzJywgJ2NvbnRyb2xzJywgJ2RudCcsICdlbmRfdGltZScsICdmdWxsc2NyZWVuJywgJ2hlaWdodCcsICdpZCcsICdpbml0aWFsX3F1YWxpdHknLCAnaW50ZXJhY3RpdmVfcGFyYW1zJywgJ2tleWJvYXJkJywgJ2xvb3AnLCAnbWF4aGVpZ2h0JywgJ21heF9xdWFsaXR5JywgJ21heHdpZHRoJywgJ21pbl9xdWFsaXR5JywgJ211dGVkJywgJ3BsYXlfYnV0dG9uX3Bvc2l0aW9uJywgJ3BsYXlzaW5saW5lJywgJ3BvcnRyYWl0JywgJ3ByZWxvYWQnLCAncHJvZ3Jlc3NfYmFyJywgJ3F1YWxpdHknLCAncXVhbGl0eV9zZWxlY3RvcicsICdyZXNwb25zaXZlJywgJ3NraXBwaW5nX2ZvcndhcmQnLCAnc3BlZWQnLCAnc3RhcnRfdGltZScsICd0ZXh0dHJhY2snLCAndGh1bWJuYWlsX2lkJywgJ3RpdGxlJywgJ3RyYW5zY3JpcHQnLCAndHJhbnNwYXJlbnQnLCAndW5tdXRlX2J1dHRvbicsICd1cmwnLCAndmltZW9fbG9nbycsICd2b2x1bWUnLCAnd2F0Y2hfZnVsbF92aWRlbycsICd3aWR0aCddO1xuXG4vKipcbiAqIEdldCB0aGUgJ2RhdGEtdmltZW8nLXByZWZpeGVkIGF0dHJpYnV0ZXMgZnJvbSBhbiBlbGVtZW50IGFzIGFuIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50LlxuICogQHBhcmFtIHtPYmplY3R9IFtkZWZhdWx0cz17fV0gVGhlIGRlZmF1bHQgdmFsdWVzIHRvIHVzZS5cbiAqIEByZXR1cm4ge09iamVjdDxzdHJpbmcsIHN0cmluZz59XG4gKi9cbmZ1bmN0aW9uIGdldE9FbWJlZFBhcmFtZXRlcnMoZWxlbWVudCkge1xuICBsZXQgZGVmYXVsdHMgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IHt9O1xuICByZXR1cm4gb0VtYmVkUGFyYW1ldGVycy5yZWR1Y2UoKHBhcmFtcywgcGFyYW0pID0+IHtcbiAgICBjb25zdCB2YWx1ZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKGBkYXRhLXZpbWVvLSR7cGFyYW19YCk7XG4gICAgaWYgKHZhbHVlIHx8IHZhbHVlID09PSAnJykge1xuICAgICAgcGFyYW1zW3BhcmFtXSA9IHZhbHVlID09PSAnJyA/IDEgOiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmFtcztcbiAgfSwgZGVmYXVsdHMpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbiBlbWJlZCBmcm9tIG9FbWJlZCBkYXRhIGluc2lkZSBhbiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBvRW1iZWQgZGF0YS5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gcHV0IHRoZSBpZnJhbWUgaW4uXG4gKiBAcmV0dXJuIHtIVE1MSUZyYW1lRWxlbWVudH0gVGhlIGlmcmFtZSBlbWJlZC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRW1iZWQoX3JlZiwgZWxlbWVudCkge1xuICBsZXQge1xuICAgIGh0bWxcbiAgfSA9IF9yZWY7XG4gIGlmICghZWxlbWVudCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FuIGVsZW1lbnQgbXVzdCBiZSBwcm92aWRlZCcpO1xuICB9XG4gIGlmIChlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS12aW1lby1pbml0aWFsaXplZCcpICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQucXVlcnlTZWxlY3RvcignaWZyYW1lJyk7XG4gIH1cbiAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGRpdi5pbm5lckhUTUwgPSBodG1sO1xuICBlbGVtZW50LmFwcGVuZENoaWxkKGRpdi5maXJzdENoaWxkKTtcbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtdmltZW8taW5pdGlhbGl6ZWQnLCAndHJ1ZScpO1xuICByZXR1cm4gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdpZnJhbWUnKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIG9FbWJlZCBjYWxsIGZvciB0aGUgc3BlY2lmaWVkIFVSTC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmlkZW9VcmwgVGhlIHZpbWVvLmNvbSB1cmwgZm9yIHRoZSB2aWRlby5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbcGFyYW1zXSBQYXJhbWV0ZXJzIHRvIHBhc3MgdG8gb0VtYmVkLlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudC5cbiAqIEByZXR1cm4ge1Byb21pc2V9XG4gKi9cbmZ1bmN0aW9uIGdldE9FbWJlZERhdGEodmlkZW9VcmwpIHtcbiAgbGV0IHBhcmFtcyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gIGxldCBlbGVtZW50ID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgPyBhcmd1bWVudHNbMl0gOiB1bmRlZmluZWQ7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgaWYgKCFpc1ZpbWVvVXJsKHZpZGVvVXJsKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihg4oCcJHt2aWRlb1VybH3igJ0gaXMgbm90IGEgdmltZW8uY29tIHVybC5gKTtcbiAgICB9XG4gICAgY29uc3QgZG9tYWluID0gZ2V0T2VtYmVkRG9tYWluKHZpZGVvVXJsKTtcbiAgICBsZXQgdXJsID0gYGh0dHBzOi8vJHtkb21haW59L2FwaS9vZW1iZWQuanNvbj91cmw9JHtlbmNvZGVVUklDb21wb25lbnQodmlkZW9VcmwpfWA7XG4gICAgZm9yIChjb25zdCBwYXJhbSBpbiBwYXJhbXMpIHtcbiAgICAgIGlmIChwYXJhbXMuaGFzT3duUHJvcGVydHkocGFyYW0pKSB7XG4gICAgICAgIHVybCArPSBgJiR7cGFyYW19PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHBhcmFtc1twYXJhbV0pfWA7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHhociA9ICdYRG9tYWluUmVxdWVzdCcgaW4gd2luZG93ID8gbmV3IFhEb21haW5SZXF1ZXN0KCkgOiBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4aHIub3BlbignR0VUJywgdXJsLCB0cnVlKTtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGDigJwke3ZpZGVvVXJsfeKAnSB3YXMgbm90IGZvdW5kLmApKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDQwMykge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGDigJwke3ZpZGVvVXJsfeKAnSBpcyBub3QgZW1iZWRkYWJsZS5gKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGpzb24gPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAvLyBDaGVjayBhcGkgcmVzcG9uc2UgZm9yIDQwMyBvbiBvZW1iZWRcbiAgICAgICAgaWYgKGpzb24uZG9tYWluX3N0YXR1c19jb2RlID09PSA0MDMpIHtcbiAgICAgICAgICAvLyBXZSBzdGlsbCB3YW50IHRvIGNyZWF0ZSB0aGUgZW1iZWQgdG8gZ2l2ZSB1c2VycyB2aXN1YWwgZmVlZGJhY2tcbiAgICAgICAgICBjcmVhdGVFbWJlZChqc29uLCBlbGVtZW50KTtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKGDigJwke3ZpZGVvVXJsfeKAnSBpcyBub3QgZW1iZWRkYWJsZS5gKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlc29sdmUoanNvbik7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgIH07XG4gICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBzdGF0dXMgPSB4aHIuc3RhdHVzID8gYCAoJHt4aHIuc3RhdHVzfSlgIDogJyc7XG4gICAgICByZWplY3QobmV3IEVycm9yKGBUaGVyZSB3YXMgYW4gZXJyb3IgZmV0Y2hpbmcgdGhlIGVtYmVkIGNvZGUgZnJvbSBWaW1lbyR7c3RhdHVzfS5gKSk7XG4gICAgfTtcbiAgICB4aHIuc2VuZCgpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIGFsbCBlbWJlZHMgd2l0aGluIGEgc3BlY2lmaWMgZWxlbWVudFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtwYXJlbnQ9ZG9jdW1lbnRdIFRoZSBwYXJlbnQgZWxlbWVudC5cbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIGluaXRpYWxpemVFbWJlZHMoKSB7XG4gIGxldCBwYXJlbnQgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IGRvY3VtZW50O1xuICBjb25zdCBlbGVtZW50cyA9IFtdLnNsaWNlLmNhbGwocGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXZpbWVvLWlkXSwgW2RhdGEtdmltZW8tdXJsXScpKTtcbiAgY29uc3QgaGFuZGxlRXJyb3IgPSBlcnJvciA9PiB7XG4gICAgaWYgKCdjb25zb2xlJyBpbiB3aW5kb3cgJiYgY29uc29sZS5lcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgVGhlcmUgd2FzIGFuIGVycm9yIGNyZWF0aW5nIGFuIGVtYmVkOiAke2Vycm9yfWApO1xuICAgIH1cbiAgfTtcbiAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gU2tpcCBhbnkgdGhhdCBoYXZlIGRhdGEtdmltZW8tZGVmZXJcbiAgICAgIGlmIChlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS12aW1lby1kZWZlcicpICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcmFtcyA9IGdldE9FbWJlZFBhcmFtZXRlcnMoZWxlbWVudCk7XG4gICAgICBjb25zdCB1cmwgPSBnZXRWaW1lb1VybChwYXJhbXMpO1xuICAgICAgZ2V0T0VtYmVkRGF0YSh1cmwsIHBhcmFtcywgZWxlbWVudCkudGhlbihkYXRhID0+IHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUVtYmVkKGRhdGEsIGVsZW1lbnQpO1xuICAgICAgfSkuY2F0Y2goaGFuZGxlRXJyb3IpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBoYW5kbGVFcnJvcihlcnJvcik7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBSZXNpemUgZW1iZWRzIHdoZW4gbWVzc2FnZWQgYnkgdGhlIHBsYXllci5cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBbcGFyZW50PWRvY3VtZW50XSBUaGUgcGFyZW50IGVsZW1lbnQuXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiByZXNpemVFbWJlZHMoKSB7XG4gIGxldCBwYXJlbnQgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IGRvY3VtZW50O1xuICAvLyBQcmV2ZW50IGV4ZWN1dGlvbiBpZiB1c2VycyBpbmNsdWRlIHRoZSBwbGF5ZXIuanMgc2NyaXB0IG11bHRpcGxlIHRpbWVzLlxuICBpZiAod2luZG93LlZpbWVvUGxheWVyUmVzaXplRW1iZWRzXykge1xuICAgIHJldHVybjtcbiAgfVxuICB3aW5kb3cuVmltZW9QbGF5ZXJSZXNpemVFbWJlZHNfID0gdHJ1ZTtcbiAgY29uc3Qgb25NZXNzYWdlID0gZXZlbnQgPT4ge1xuICAgIGlmICghaXNWaW1lb1VybChldmVudC5vcmlnaW4pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gJ3NwYWNlY2hhbmdlJyBpcyBmaXJlZCBvbmx5IG9uIGVtYmVkcyB3aXRoIGNhcmRzXG4gICAgaWYgKCFldmVudC5kYXRhIHx8IGV2ZW50LmRhdGEuZXZlbnQgIT09ICdzcGFjZWNoYW5nZScpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2VuZGVySUZyYW1lID0gZXZlbnQuc291cmNlID8gZmluZElmcmFtZUJ5U291cmNlV2luZG93KGV2ZW50LnNvdXJjZSwgcGFyZW50KSA6IG51bGw7XG4gICAgaWYgKHNlbmRlcklGcmFtZSkge1xuICAgICAgLy8gQ2hhbmdlIHBhZGRpbmctYm90dG9tIG9mIHRoZSBlbmNsb3NpbmcgZGl2IHRvIGFjY29tbW9kYXRlXG4gICAgICAvLyBjYXJkIGNhcm91c2VsIHdpdGhvdXQgZGlzdG9ydGluZyBhc3BlY3QgcmF0aW9cbiAgICAgIGNvbnN0IHNwYWNlID0gc2VuZGVySUZyYW1lLnBhcmVudEVsZW1lbnQ7XG4gICAgICBzcGFjZS5zdHlsZS5wYWRkaW5nQm90dG9tID0gYCR7ZXZlbnQuZGF0YS5kYXRhWzBdLmJvdHRvbX1weGA7XG4gICAgfVxuICB9O1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTWVzc2FnZSk7XG59XG5cbi8qKlxuICogQWRkIGNoYXB0ZXJzIHRvIGV4aXN0aW5nIG1ldGFkYXRhIGZvciBHb29nbGUgU0VPXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW3BhcmVudD1kb2N1bWVudF0gVGhlIHBhcmVudCBlbGVtZW50LlxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gaW5pdEFwcGVuZFZpZGVvTWV0YWRhdGEoKSB7XG4gIGxldCBwYXJlbnQgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IGRvY3VtZW50O1xuICAvLyAgUHJldmVudCBleGVjdXRpb24gaWYgdXNlcnMgaW5jbHVkZSB0aGUgcGxheWVyLmpzIHNjcmlwdCBtdWx0aXBsZSB0aW1lcy5cbiAgaWYgKHdpbmRvdy5WaW1lb1Nlb01ldGFkYXRhQXBwZW5kZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgd2luZG93LlZpbWVvU2VvTWV0YWRhdGFBcHBlbmRlZCA9IHRydWU7XG4gIGNvbnN0IG9uTWVzc2FnZSA9IGV2ZW50ID0+IHtcbiAgICBpZiAoIWlzVmltZW9VcmwoZXZlbnQub3JpZ2luKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBkYXRhID0gcGFyc2VNZXNzYWdlRGF0YShldmVudC5kYXRhKTtcbiAgICBpZiAoIWRhdGEgfHwgZGF0YS5ldmVudCAhPT0gJ3JlYWR5Jykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzZW5kZXJJRnJhbWUgPSBldmVudC5zb3VyY2UgPyBmaW5kSWZyYW1lQnlTb3VyY2VXaW5kb3coZXZlbnQuc291cmNlLCBwYXJlbnQpIDogbnVsbDtcblxuICAgIC8vIEluaXRpYXRlIGFwcGVuZFZpZGVvTWV0YWRhdGEgaWYgaWZyYW1lIGlzIGEgVmltZW8gZW1iZWRcbiAgICBpZiAoc2VuZGVySUZyYW1lICYmIGlzVmltZW9FbWJlZChzZW5kZXJJRnJhbWUuc3JjKSkge1xuICAgICAgY29uc3QgcGxheWVyID0gbmV3IFBsYXllcihzZW5kZXJJRnJhbWUpO1xuICAgICAgcGxheWVyLmNhbGxNZXRob2QoJ2FwcGVuZFZpZGVvTWV0YWRhdGEnLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgfVxuICB9O1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTWVzc2FnZSk7XG59XG5cbi8qKlxuICogU2VlayB0byB0aW1lIGluZGljYXRlZCBieSB2aW1lb190IHF1ZXJ5IHBhcmFtZXRlciBpZiBwcmVzZW50IGluIFVSTFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtwYXJlbnQ9ZG9jdW1lbnRdIFRoZSBwYXJlbnQgZWxlbWVudC5cbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIGNoZWNrVXJsVGltZVBhcmFtKCkge1xuICBsZXQgcGFyZW50ID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiBkb2N1bWVudDtcbiAgLy8gIFByZXZlbnQgZXhlY3V0aW9uIGlmIHVzZXJzIGluY2x1ZGUgdGhlIHBsYXllci5qcyBzY3JpcHQgbXVsdGlwbGUgdGltZXMuXG4gIGlmICh3aW5kb3cuVmltZW9DaGVja2VkVXJsVGltZVBhcmFtKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHdpbmRvdy5WaW1lb0NoZWNrZWRVcmxUaW1lUGFyYW0gPSB0cnVlO1xuICBjb25zdCBoYW5kbGVFcnJvciA9IGVycm9yID0+IHtcbiAgICBpZiAoJ2NvbnNvbGUnIGluIHdpbmRvdyAmJiBjb25zb2xlLmVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGVyZSB3YXMgYW4gZXJyb3IgZ2V0dGluZyB2aWRlbyBJZDogJHtlcnJvcn1gKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IG9uTWVzc2FnZSA9IGV2ZW50ID0+IHtcbiAgICBpZiAoIWlzVmltZW9VcmwoZXZlbnQub3JpZ2luKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBkYXRhID0gcGFyc2VNZXNzYWdlRGF0YShldmVudC5kYXRhKTtcbiAgICBpZiAoIWRhdGEgfHwgZGF0YS5ldmVudCAhPT0gJ3JlYWR5Jykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzZW5kZXJJRnJhbWUgPSBldmVudC5zb3VyY2UgPyBmaW5kSWZyYW1lQnlTb3VyY2VXaW5kb3coZXZlbnQuc291cmNlLCBwYXJlbnQpIDogbnVsbDtcbiAgICBpZiAoc2VuZGVySUZyYW1lICYmIGlzVmltZW9FbWJlZChzZW5kZXJJRnJhbWUuc3JjKSkge1xuICAgICAgY29uc3QgcGxheWVyID0gbmV3IFBsYXllcihzZW5kZXJJRnJhbWUpO1xuICAgICAgcGxheWVyLmdldFZpZGVvSWQoKS50aGVuKHZpZGVvSWQgPT4ge1xuICAgICAgICBjb25zdCBtYXRjaGVzID0gbmV3IFJlZ0V4cChgWz8mXXZpbWVvX3RfJHt2aWRlb0lkfT0oW14mI10qKWApLmV4ZWMod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgICAgICBpZiAobWF0Y2hlcyAmJiBtYXRjaGVzWzFdKSB7XG4gICAgICAgICAgY29uc3Qgc2VjID0gZGVjb2RlVVJJKG1hdGNoZXNbMV0pO1xuICAgICAgICAgIHBsYXllci5zZXRDdXJyZW50VGltZShzZWMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0pLmNhdGNoKGhhbmRsZUVycm9yKTtcbiAgICB9XG4gIH07XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25NZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIGlmcmFtZSBlbWJlZHMgdG8gc3VwcG9ydCBEUk0gY29udGVudCBwbGF5YmFjayBieSBhZGRpbmcgdGhlICdlbmNyeXB0ZWQtbWVkaWEnIHBlcm1pc3Npb25cbiAqIHRvIHRoZSBpZnJhbWUncyBhbGxvdyBhdHRyaWJ1dGUgd2hlbiBEUk0gaW5pdGlhbGl6YXRpb24gZmFpbHMuIFRoaXMgZnVuY3Rpb24gYWN0cyBhcyBhIGZhbGxiYWNrXG4gKiBtZWNoYW5pc20gdG8gZW5hYmxlIHBsYXliYWNrIG9mIERSTS1wcm90ZWN0ZWQgY29udGVudCBpbiBlbWJlZHMgdGhhdCB3ZXJlbid0IHByb3Blcmx5IGNvbmZpZ3VyZWQuXG4gKlxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gdXBkYXRlRFJNRW1iZWRzKCkge1xuICBpZiAod2luZG93LlZpbWVvRFJNRW1iZWRzVXBkYXRlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICB3aW5kb3cuVmltZW9EUk1FbWJlZHNVcGRhdGVkID0gdHJ1ZTtcblxuICAvKipcbiAgICogSGFuZGxlIG1lc3NhZ2UgZXZlbnRzIGZvciBEUk0gaW5pdGlhbGl6YXRpb24gZmFpbHVyZXNcbiAgICogQHBhcmFtIHtNZXNzYWdlRXZlbnR9IGV2ZW50IC0gVGhlIG1lc3NhZ2UgZXZlbnQgZnJvbSB0aGUgaWZyYW1lXG4gICAqL1xuICBjb25zdCBvbk1lc3NhZ2UgPSBldmVudCA9PiB7XG4gICAgaWYgKCFpc1ZpbWVvVXJsKGV2ZW50Lm9yaWdpbikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgZGF0YSA9IHBhcnNlTWVzc2FnZURhdGEoZXZlbnQuZGF0YSk7XG4gICAgaWYgKCFkYXRhIHx8IGRhdGEuZXZlbnQgIT09ICdkcm1pbml0ZmFpbGVkJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzZW5kZXJJRnJhbWUgPSBldmVudC5zb3VyY2UgPyBmaW5kSWZyYW1lQnlTb3VyY2VXaW5kb3coZXZlbnQuc291cmNlKSA6IG51bGw7XG4gICAgaWYgKCFzZW5kZXJJRnJhbWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY3VycmVudEFsbG93ID0gc2VuZGVySUZyYW1lLmdldEF0dHJpYnV0ZSgnYWxsb3cnKSB8fCAnJztcbiAgICBjb25zdCBhbGxvd1N1cHBvcnRzRFJNID0gY3VycmVudEFsbG93LmluY2x1ZGVzKCdlbmNyeXB0ZWQtbWVkaWEnKTtcbiAgICBpZiAoIWFsbG93U3VwcG9ydHNEUk0pIHtcbiAgICAgIC8vIEZvciBEUk0gcGxheWJhY2sgdG8gc3VjY2Vzc2Z1bGx5IG9jY3VyLCB0aGUgaWZyYW1lIGBhbGxvd2AgYXR0cmlidXRlIG11c3QgaW5jbHVkZSAnZW5jcnlwdGVkLW1lZGlhJy5cbiAgICAgIC8vIElmIHRoZSB2aWRlbyByZXF1aXJlcyBEUk0gYnV0IGRvZXNuJ3QgaGF2ZSB0aGUgYXR0cmlidXRlLCB3ZSB0cnkgdG8gYWRkIG9uIGJlaGFsZiBvZiB0aGUgZW1iZWQgb3duZXJcbiAgICAgIC8vIGFzIGEgdGVtcG9yYXJ5IG1lYXN1cmUgdG8gZW5hYmxlIHBsYXliYWNrIHVudGlsIHRoZXkncmUgYWJsZSB0byB1cGRhdGUgdGhlaXIgZW1iZWRzLlxuICAgICAgc2VuZGVySUZyYW1lLnNldEF0dHJpYnV0ZSgnYWxsb3cnLCBgJHtjdXJyZW50QWxsb3d9OyBlbmNyeXB0ZWQtbWVkaWFgKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRVcmwgPSBuZXcgVVJMKHNlbmRlcklGcmFtZS5nZXRBdHRyaWJ1dGUoJ3NyYycpKTtcblxuICAgICAgLy8gQWRkaW5nIHRoaXMgZm9yY2VzIHRoZSBlbWJlZCB0byByZWxvYWQgb25jZSBgYWxsb3dgIGhhcyBiZWVuIHVwZGF0ZWQgd2l0aCBgZW5jcnlwdGVkLW1lZGlhYC5cbiAgICAgIGN1cnJlbnRVcmwuc2VhcmNoUGFyYW1zLnNldCgnZm9yY2VyZWxvYWQnLCAnZHJtJyk7XG4gICAgICBzZW5kZXJJRnJhbWUuc2V0QXR0cmlidXRlKCdzcmMnLCBjdXJyZW50VXJsLnRvU3RyaW5nKCkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1lc3NhZ2UpO1xufVxuXG4vKiBNSVQgTGljZW5zZVxuXG5Db3B5cmlnaHQgKGMpIFNpbmRyZSBTb3JodXMgPHNpbmRyZXNvcmh1c0BnbWFpbC5jb20+IChzaW5kcmVzb3JodXMuY29tKVxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5UZXJtcyAqL1xuXG5mdW5jdGlvbiBpbml0aWFsaXplU2NyZWVuZnVsbCgpIHtcbiAgY29uc3QgZm4gPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHZhbDtcbiAgICBjb25zdCBmbk1hcCA9IFtbJ3JlcXVlc3RGdWxsc2NyZWVuJywgJ2V4aXRGdWxsc2NyZWVuJywgJ2Z1bGxzY3JlZW5FbGVtZW50JywgJ2Z1bGxzY3JlZW5FbmFibGVkJywgJ2Z1bGxzY3JlZW5jaGFuZ2UnLCAnZnVsbHNjcmVlbmVycm9yJ10sXG4gICAgLy8gTmV3IFdlYktpdFxuICAgIFsnd2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4nLCAnd2Via2l0RXhpdEZ1bGxzY3JlZW4nLCAnd2Via2l0RnVsbHNjcmVlbkVsZW1lbnQnLCAnd2Via2l0RnVsbHNjcmVlbkVuYWJsZWQnLCAnd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsICd3ZWJraXRmdWxsc2NyZWVuZXJyb3InXSxcbiAgICAvLyBPbGQgV2ViS2l0XG4gICAgWyd3ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbicsICd3ZWJraXRDYW5jZWxGdWxsU2NyZWVuJywgJ3dlYmtpdEN1cnJlbnRGdWxsU2NyZWVuRWxlbWVudCcsICd3ZWJraXRDYW5jZWxGdWxsU2NyZWVuJywgJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UnLCAnd2Via2l0ZnVsbHNjcmVlbmVycm9yJ10sIFsnbW96UmVxdWVzdEZ1bGxTY3JlZW4nLCAnbW96Q2FuY2VsRnVsbFNjcmVlbicsICdtb3pGdWxsU2NyZWVuRWxlbWVudCcsICdtb3pGdWxsU2NyZWVuRW5hYmxlZCcsICdtb3pmdWxsc2NyZWVuY2hhbmdlJywgJ21vemZ1bGxzY3JlZW5lcnJvciddLCBbJ21zUmVxdWVzdEZ1bGxzY3JlZW4nLCAnbXNFeGl0RnVsbHNjcmVlbicsICdtc0Z1bGxzY3JlZW5FbGVtZW50JywgJ21zRnVsbHNjcmVlbkVuYWJsZWQnLCAnTVNGdWxsc2NyZWVuQ2hhbmdlJywgJ01TRnVsbHNjcmVlbkVycm9yJ11dO1xuICAgIGxldCBpID0gMDtcbiAgICBjb25zdCBsID0gZm5NYXAubGVuZ3RoO1xuICAgIGNvbnN0IHJldCA9IHt9O1xuICAgIGZvciAoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YWwgPSBmbk1hcFtpXTtcbiAgICAgIGlmICh2YWwgJiYgdmFsWzFdIGluIGRvY3VtZW50KSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICByZXRbZm5NYXBbMF1baV1dID0gdmFsW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSgpO1xuICBjb25zdCBldmVudE5hbWVNYXAgPSB7XG4gICAgZnVsbHNjcmVlbmNoYW5nZTogZm4uZnVsbHNjcmVlbmNoYW5nZSxcbiAgICBmdWxsc2NyZWVuZXJyb3I6IGZuLmZ1bGxzY3JlZW5lcnJvclxuICB9O1xuICBjb25zdCBzY3JlZW5mdWxsID0ge1xuICAgIHJlcXVlc3QoZWxlbWVudCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3Qgb25GdWxsU2NyZWVuRW50ZXJlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzY3JlZW5mdWxsLm9mZignZnVsbHNjcmVlbmNoYW5nZScsIG9uRnVsbFNjcmVlbkVudGVyZWQpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfTtcbiAgICAgICAgc2NyZWVuZnVsbC5vbignZnVsbHNjcmVlbmNoYW5nZScsIG9uRnVsbFNjcmVlbkVudGVyZWQpO1xuICAgICAgICBlbGVtZW50ID0gZWxlbWVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IHJldHVyblByb21pc2UgPSBlbGVtZW50W2ZuLnJlcXVlc3RGdWxsc2NyZWVuXSgpO1xuICAgICAgICBpZiAocmV0dXJuUHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICByZXR1cm5Qcm9taXNlLnRoZW4ob25GdWxsU2NyZWVuRW50ZXJlZCkuY2F0Y2gocmVqZWN0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBleGl0KCkge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgaWYgKCFzY3JlZW5mdWxsLmlzRnVsbHNjcmVlbikge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb25GdWxsU2NyZWVuRXhpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzY3JlZW5mdWxsLm9mZignZnVsbHNjcmVlbmNoYW5nZScsIG9uRnVsbFNjcmVlbkV4aXQpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfTtcbiAgICAgICAgc2NyZWVuZnVsbC5vbignZnVsbHNjcmVlbmNoYW5nZScsIG9uRnVsbFNjcmVlbkV4aXQpO1xuICAgICAgICBjb25zdCByZXR1cm5Qcm9taXNlID0gZG9jdW1lbnRbZm4uZXhpdEZ1bGxzY3JlZW5dKCk7XG4gICAgICAgIGlmIChyZXR1cm5Qcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgIHJldHVyblByb21pc2UudGhlbihvbkZ1bGxTY3JlZW5FeGl0KS5jYXRjaChyZWplY3QpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIG9uKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgY29uc3QgZXZlbnROYW1lID0gZXZlbnROYW1lTWFwW2V2ZW50XTtcbiAgICAgIGlmIChldmVudE5hbWUpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIG9mZihldmVudCwgY2FsbGJhY2spIHtcbiAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IGV2ZW50TmFtZU1hcFtldmVudF07XG4gICAgICBpZiAoZXZlbnROYW1lKSB7XG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhzY3JlZW5mdWxsLCB7XG4gICAgaXNGdWxsc2NyZWVuOiB7XG4gICAgICBnZXQoKSB7XG4gICAgICAgIHJldHVybiBCb29sZWFuKGRvY3VtZW50W2ZuLmZ1bGxzY3JlZW5FbGVtZW50XSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBlbGVtZW50OiB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0KCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnRbZm4uZnVsbHNjcmVlbkVsZW1lbnRdO1xuICAgICAgfVxuICAgIH0sXG4gICAgaXNFbmFibGVkOiB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0KCkge1xuICAgICAgICAvLyBDb2VyY2UgdG8gYm9vbGVhbiBpbiBjYXNlIG9mIG9sZCBXZWJLaXRcbiAgICAgICAgcmV0dXJuIEJvb2xlYW4oZG9jdW1lbnRbZm4uZnVsbHNjcmVlbkVuYWJsZWRdKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gc2NyZWVuZnVsbDtcbn1cblxuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4vdGltaW5nLXNyYy1jb25uZWN0b3IudHlwZXMnKS5QbGF5ZXJDb250cm9sc30gUGxheWVyQ29udHJvbHMgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCd0aW1pbmctb2JqZWN0JykuSVRpbWluZ09iamVjdH0gVGltaW5nT2JqZWN0ICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi90aW1pbmctc3JjLWNvbm5lY3Rvci50eXBlcycpLlRpbWluZ1NyY0Nvbm5lY3Rvck9wdGlvbnN9IFRpbWluZ1NyY0Nvbm5lY3Rvck9wdGlvbnMgKi9cbi8qKiBAdHlwZWRlZiB7KG1zZzogc3RyaW5nKSA9PiBhbnl9IExvZ2dlciAqL1xuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJ3RpbWluZy1vYmplY3QnKS5UQ29ubmVjdGlvblN0YXRlfSBUQ29ubmVjdGlvblN0YXRlICovXG5cbi8qKlxuICogQHR5cGUge1RpbWluZ1NyY0Nvbm5lY3Rvck9wdGlvbnN9XG4gKlxuICogRm9yIGRldGFpbHMgb24gdGhlc2UgcHJvcGVydGllcyBhbmQgdGhlaXIgZWZmZWN0cywgc2VlIHRoZSB0eXBlc2NyaXB0IGRlZmluaXRpb24gcmVmZXJlbmNlZCBhYm92ZS5cbiAqL1xuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gIHJvbGU6ICd2aWV3ZXInLFxuICBhdXRvUGxheU11dGVkOiB0cnVlLFxuICBhbGxvd2VkRHJpZnQ6IDAuMyxcbiAgbWF4QWxsb3dlZERyaWZ0OiAxLFxuICBtaW5DaGVja0ludGVydmFsOiAwLjEsXG4gIG1heFJhdGVBZGp1c3RtZW50OiAwLjIsXG4gIG1heFRpbWVUb0NhdGNoVXA6IDFcbn07XG5cbi8qKlxuICogVGhlcmUncyBhIHByb3Bvc2VkIFczQyBzcGVjIGZvciB0aGUgVGltaW5nIE9iamVjdCB3aGljaCB3b3VsZCBpbnRyb2R1Y2UgYSBuZXcgc2V0IG9mIEFQSXMgdGhhdCB3b3VsZCBzaW1wbGlmeSB0aW1lLXN5bmNocm9uaXphdGlvbiB0YXNrcyBmb3IgYnJvd3NlciBhcHBsaWNhdGlvbnMuXG4gKlxuICogUHJvcG9zZWQgc3BlYzogaHR0cHM6Ly93ZWJ0aW1pbmcuZ2l0aHViLmlvL3RpbWluZ29iamVjdC9cbiAqIFYzIFNwZWM6IGh0dHBzOi8vdGltaW5nc3JjLnJlYWR0aGVkb2NzLmlvL2VuL2xhdGVzdC9cbiAqIERlbXV4ZWQgdGFsazogaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1jWlNqRGFHRG1YOFxuICpcbiAqIFRoaXMgY2xhc3MgbWFrZXMgaXQgZWFzeSB0byBjb25uZWN0IFZpbWVvLlBsYXllciB0byBhIHByb3ZpZGVkIFRpbWluZ09iamVjdCB2aWEgVmltZW8uUGxheWVyLnNldFRpbWluZ1NyYyhteVRpbWluZ09iamVjdCwgb3B0aW9ucykgYW5kIHRoZSBzeW5jaHJvbml6YXRpb24gd2lsbCBiZSBoYW5kbGVkIGF1dG9tYXRpY2FsbHkuXG4gKlxuICogVGhlcmUgYXJlIDUgZ2VuZXJhbCByZXNwb25zaWJpbGl0aWVzIGluIFRpbWluZ1NyY0Nvbm5lY3RvcjpcbiAqXG4gKiAxLiBgdXBkYXRlUGxheWVyKClgIHdoaWNoIHNldHMgdGhlIHBsYXllcidzIGN1cnJlbnRUaW1lLCBwbGF5YmFja1JhdGUgYW5kIHBhdXNlL3BsYXkgc3RhdGUgYmFzZWQgb24gY3VycmVudCBzdGF0ZSBvZiB0aGUgVGltaW5nT2JqZWN0LlxuICogMi4gYHVwZGF0ZVRpbWluZ09iamVjdCgpYCB3aGljaCBzZXRzIHRoZSBUaW1pbmdPYmplY3QncyBwb3NpdGlvbiBhbmQgdmVsb2NpdHkgZnJvbSB0aGUgcGxheWVyJ3Mgc3RhdGUuXG4gKiAzLiBgcGxheWVyVXBkYXRlcmAgd2hpY2ggbGlzdGVucyBmb3IgY2hhbmdlIGV2ZW50cyBvbiB0aGUgVGltaW5nT2JqZWN0IGFuZCB3aWxsIHJlc3BvbmQgYnkgY2FsbGluZyB1cGRhdGVQbGF5ZXIuXG4gKiA0LiBgdGltaW5nT2JqZWN0VXBkYXRlcmAgd2hpY2ggbGlzdGVucyB0byB0aGUgcGxheWVyIGV2ZW50cyBvZiBzZWVrZWQsIHBsYXkgYW5kIHBhdXNlIGFuZCB3aWxsIHJlc3BvbmQgYnkgY2FsbGluZyBgdXBkYXRlVGltaW5nT2JqZWN0KClgLlxuICogNS4gYG1haW50YWluUGxheWJhY2tQb3NpdGlvbmAgdGhpcyBpcyBjb2RlIHRoYXQgY29uc3RhbnRseSBtb25pdG9ycyB0aGUgcGxheWVyIHRvIG1ha2Ugc3VyZSBpdCdzIGFsd2F5cyBpbiBzeW5jIHdpdGggdGhlIFRpbWluZ09iamVjdC4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSB2aWRlb3Mgd2lsbCBnZW5lcmFsbHkgbm90IHBsYXkgd2l0aCBwcmVjaXNlIHRpbWUgYWNjdXJhY3kgYW5kIHRoZXJlIHdpbGwgYmUgc29tZSBkcmlmdCB3aGljaCBiZWNvbWVzIG1vcmUgbm90aWNlYWJsZSBvdmVyIGxvbmdlciBwZXJpb2RzIChhcyBub3RlZCBpbiB0aGUgdGltaW5nLW9iamVjdCBzcGVjKS4gTW9yZSBkZXRhaWxzIG9uIHRoaXMgbWV0aG9kIGJlbG93LlxuICovXG5jbGFzcyBUaW1pbmdTcmNDb25uZWN0b3IgZXh0ZW5kcyBFdmVudFRhcmdldCB7XG4gIGxvZ2dlcjtcblxuICAvKipcbiAgICogQHBhcmFtIHtQbGF5ZXJDb250cm9sc30gcGxheWVyXG4gICAqIEBwYXJhbSB7VGltaW5nT2JqZWN0fSB0aW1pbmdPYmplY3RcbiAgICogQHBhcmFtIHtUaW1pbmdTcmNDb25uZWN0b3JPcHRpb25zfSBvcHRpb25zXG4gICAqIEBwYXJhbSB7TG9nZ2VyfSBsb2dnZXJcbiAgICovXG4gIGNvbnN0cnVjdG9yKHBsYXllciwgdGltaW5nT2JqZWN0KSB7XG4gICAgbGV0IG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgIGxldCBsb2dnZXIgPSBhcmd1bWVudHMubGVuZ3RoID4gMyA/IGFyZ3VtZW50c1szXSA6IHVuZGVmaW5lZDtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubG9nZ2VyID0gbG9nZ2VyO1xuICAgIHRoaXMuaW5pdCh0aW1pbmdPYmplY3QsIHBsYXllciwge1xuICAgICAgLi4uZGVmYXVsdE9wdGlvbnMsXG4gICAgICAuLi5vcHRpb25zXG4gICAgfSk7XG4gIH1cbiAgZGlzY29ubmVjdCgpIHtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdkaXNjb25uZWN0JykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VGltaW5nT2JqZWN0fSB0aW1pbmdPYmplY3RcbiAgICogQHBhcmFtIHtQbGF5ZXJDb250cm9sc30gcGxheWVyXG4gICAqIEBwYXJhbSB7VGltaW5nU3JjQ29ubmVjdG9yT3B0aW9uc30gb3B0aW9uc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgaW5pdCh0aW1pbmdPYmplY3QsIHBsYXllciwgb3B0aW9ucykge1xuICAgIGF3YWl0IHRoaXMud2FpdEZvclRPUmVhZHlTdGF0ZSh0aW1pbmdPYmplY3QsICdvcGVuJyk7XG4gICAgaWYgKG9wdGlvbnMucm9sZSA9PT0gJ3ZpZXdlcicpIHtcbiAgICAgIGF3YWl0IHRoaXMudXBkYXRlUGxheWVyKHRpbWluZ09iamVjdCwgcGxheWVyLCBvcHRpb25zKTtcbiAgICAgIGNvbnN0IHBsYXllclVwZGF0ZXIgPSBzdWJzY3JpYmUodGltaW5nT2JqZWN0LCAnY2hhbmdlJywgKCkgPT4gdGhpcy51cGRhdGVQbGF5ZXIodGltaW5nT2JqZWN0LCBwbGF5ZXIsIG9wdGlvbnMpKTtcbiAgICAgIGNvbnN0IHBvc2l0aW9uU3luYyA9IHRoaXMubWFpbnRhaW5QbGF5YmFja1Bvc2l0aW9uKHRpbWluZ09iamVjdCwgcGxheWVyLCBvcHRpb25zKTtcbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcignZGlzY29ubmVjdCcsICgpID0+IHtcbiAgICAgICAgcG9zaXRpb25TeW5jLmNhbmNlbCgpO1xuICAgICAgICBwbGF5ZXJVcGRhdGVyLmNhbmNlbCgpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IHRoaXMudXBkYXRlVGltaW5nT2JqZWN0KHRpbWluZ09iamVjdCwgcGxheWVyKTtcbiAgICAgIGNvbnN0IHRpbWluZ09iamVjdFVwZGF0ZXIgPSBzdWJzY3JpYmUocGxheWVyLCBbJ3NlZWtlZCcsICdwbGF5JywgJ3BhdXNlJywgJ3JhdGVjaGFuZ2UnXSwgKCkgPT4gdGhpcy51cGRhdGVUaW1pbmdPYmplY3QodGltaW5nT2JqZWN0LCBwbGF5ZXIpLCAnb24nLCAnb2ZmJyk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2Rpc2Nvbm5lY3QnLCAoKSA9PiB0aW1pbmdPYmplY3RVcGRhdGVyLmNhbmNlbCgpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgVGltaW5nT2JqZWN0J3Mgc3RhdGUgdG8gcmVmbGVjdCB0aGF0IG9mIHRoZSBwbGF5ZXJcbiAgICpcbiAgICogQHBhcmFtIHtUaW1pbmdPYmplY3R9IHRpbWluZ09iamVjdFxuICAgKiBAcGFyYW0ge1BsYXllckNvbnRyb2xzfSBwbGF5ZXJcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHVwZGF0ZVRpbWluZ09iamVjdCh0aW1pbmdPYmplY3QsIHBsYXllcikge1xuICAgIGNvbnN0IFtwb3NpdGlvbiwgaXNQYXVzZWQsIHBsYXliYWNrUmF0ZV0gPSBhd2FpdCBQcm9taXNlLmFsbChbcGxheWVyLmdldEN1cnJlbnRUaW1lKCksIHBsYXllci5nZXRQYXVzZWQoKSwgcGxheWVyLmdldFBsYXliYWNrUmF0ZSgpXSk7XG4gICAgdGltaW5nT2JqZWN0LnVwZGF0ZSh7XG4gICAgICBwb3NpdGlvbixcbiAgICAgIHZlbG9jaXR5OiBpc1BhdXNlZCA/IDAgOiBwbGF5YmFja1JhdGVcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwbGF5ZXIncyB0aW1pbmcgc3RhdGUgdG8gcmVmbGVjdCB0aGF0IG9mIHRoZSBUaW1pbmdPYmplY3RcbiAgICpcbiAgICogQHBhcmFtIHtUaW1pbmdPYmplY3R9IHRpbWluZ09iamVjdFxuICAgKiBAcGFyYW0ge1BsYXllckNvbnRyb2xzfSBwbGF5ZXJcbiAgICogQHBhcmFtIHtUaW1pbmdTcmNDb25uZWN0b3JPcHRpb25zfSBvcHRpb25zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyB1cGRhdGVQbGF5ZXIodGltaW5nT2JqZWN0LCBwbGF5ZXIsIG9wdGlvbnMpIHtcbiAgICBjb25zdCB7XG4gICAgICBwb3NpdGlvbixcbiAgICAgIHZlbG9jaXR5XG4gICAgfSA9IHRpbWluZ09iamVjdC5xdWVyeSgpO1xuICAgIGlmICh0eXBlb2YgcG9zaXRpb24gPT09ICdudW1iZXInKSB7XG4gICAgICBwbGF5ZXIuc2V0Q3VycmVudFRpbWUocG9zaXRpb24pO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZlbG9jaXR5ID09PSAnbnVtYmVyJykge1xuICAgICAgaWYgKHZlbG9jaXR5ID09PSAwKSB7XG4gICAgICAgIGlmICgoYXdhaXQgcGxheWVyLmdldFBhdXNlZCgpKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBwbGF5ZXIucGF1c2UoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh2ZWxvY2l0eSA+IDApIHtcbiAgICAgICAgaWYgKChhd2FpdCBwbGF5ZXIuZ2V0UGF1c2VkKCkpID09PSB0cnVlKSB7XG4gICAgICAgICAgYXdhaXQgcGxheWVyLnBsYXkoKS5jYXRjaChhc3luYyBlcnIgPT4ge1xuICAgICAgICAgICAgaWYgKGVyci5uYW1lID09PSAnTm90QWxsb3dlZEVycm9yJyAmJiBvcHRpb25zLmF1dG9QbGF5TXV0ZWQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcGxheWVyLnNldE11dGVkKHRydWUpO1xuICAgICAgICAgICAgICBhd2FpdCBwbGF5ZXIucGxheSgpLmNhdGNoKGVycjIgPT4gY29uc29sZS5lcnJvcignQ291bGRuXFwndCBwbGF5IHRoZSB2aWRlbyBmcm9tIFRpbWluZ1NyY0Nvbm5lY3Rvci4gRXJyb3I6JywgZXJyMikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMudXBkYXRlUGxheWVyKHRpbWluZ09iamVjdCwgcGxheWVyLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGF3YWl0IHBsYXllci5nZXRQbGF5YmFja1JhdGUoKSkgIT09IHZlbG9jaXR5KSB7XG4gICAgICAgICAgcGxheWVyLnNldFBsYXliYWNrUmF0ZSh2ZWxvY2l0eSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2luY2UgdmlkZW8gcGxheWVycyBkbyBub3QgcGxheSB3aXRoIDEwMCUgdGltZSBwcmVjaXNpb24sIHdlIG5lZWQgdG8gY2xvc2VseSBtb25pdG9yXG4gICAqIG91ciBwbGF5ZXIgdG8gYmUgc3VyZSBpdCByZW1haW5zIGluIHN5bmMgd2l0aCB0aGUgVGltaW5nT2JqZWN0LlxuICAgKlxuICAgKiBJZiBvdXQgb2Ygc3luYywgd2UgdXNlIHRoZSBjdXJyZW50IGNvbmRpdGlvbnMgYW5kIHRoZSBvcHRpb25zIHByb3ZpZGVkIHRvIGRldGVybWluZVxuICAgKiB3aGV0aGVyIHRvIHJlLXN5bmMgdmlhIHNldHRpbmcgY3VycmVudFRpbWUgb3IgYWRqdXN0aW5nIHRoZSBwbGF5YmFja1JhdGVcbiAgICpcbiAgICogQHBhcmFtIHtUaW1pbmdPYmplY3R9IHRpbWluZ09iamVjdFxuICAgKiBAcGFyYW0ge1BsYXllckNvbnRyb2xzfSBwbGF5ZXJcbiAgICogQHBhcmFtIHtUaW1pbmdTcmNDb25uZWN0b3JPcHRpb25zfSBvcHRpb25zXG4gICAqIEByZXR1cm4ge3tjYW5jZWw6IChmdW5jdGlvbigpOiB2b2lkKX19XG4gICAqL1xuICBtYWludGFpblBsYXliYWNrUG9zaXRpb24odGltaW5nT2JqZWN0LCBwbGF5ZXIsIG9wdGlvbnMpIHtcbiAgICBjb25zdCB7XG4gICAgICBhbGxvd2VkRHJpZnQsXG4gICAgICBtYXhBbGxvd2VkRHJpZnQsXG4gICAgICBtaW5DaGVja0ludGVydmFsLFxuICAgICAgbWF4UmF0ZUFkanVzdG1lbnQsXG4gICAgICBtYXhUaW1lVG9DYXRjaFVwXG4gICAgfSA9IG9wdGlvbnM7XG4gICAgY29uc3Qgc3luY0ludGVydmFsID0gTWF0aC5taW4obWF4VGltZVRvQ2F0Y2hVcCwgTWF0aC5tYXgobWluQ2hlY2tJbnRlcnZhbCwgbWF4QWxsb3dlZERyaWZ0KSkgKiAxMDAwO1xuICAgIGNvbnN0IGNoZWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHRpbWluZ09iamVjdC5xdWVyeSgpLnZlbG9jaXR5ID09PSAwIHx8IChhd2FpdCBwbGF5ZXIuZ2V0UGF1c2VkKCkpID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRpZmYgPSB0aW1pbmdPYmplY3QucXVlcnkoKS5wb3NpdGlvbiAtIChhd2FpdCBwbGF5ZXIuZ2V0Q3VycmVudFRpbWUoKSk7XG4gICAgICBjb25zdCBkaWZmQWJzID0gTWF0aC5hYnMoZGlmZik7XG4gICAgICB0aGlzLmxvZyhgRHJpZnQ6ICR7ZGlmZn1gKTtcbiAgICAgIGlmIChkaWZmQWJzID4gbWF4QWxsb3dlZERyaWZ0KSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRqdXN0U3BlZWQocGxheWVyLCAwKTtcbiAgICAgICAgcGxheWVyLnNldEN1cnJlbnRUaW1lKHRpbWluZ09iamVjdC5xdWVyeSgpLnBvc2l0aW9uKTtcbiAgICAgICAgdGhpcy5sb2coJ1Jlc3luYyBieSBjdXJyZW50VGltZScpO1xuICAgICAgfSBlbHNlIGlmIChkaWZmQWJzID4gYWxsb3dlZERyaWZ0KSB7XG4gICAgICAgIGNvbnN0IG1pbiA9IGRpZmZBYnMgLyBtYXhUaW1lVG9DYXRjaFVwO1xuICAgICAgICBjb25zdCBtYXggPSBtYXhSYXRlQWRqdXN0bWVudDtcbiAgICAgICAgY29uc3QgYWRqdXN0bWVudCA9IG1pbiA8IG1heCA/IChtYXggLSBtaW4pIC8gMiA6IG1heDtcbiAgICAgICAgYXdhaXQgdGhpcy5hZGp1c3RTcGVlZChwbGF5ZXIsIGFkanVzdG1lbnQgKiBNYXRoLnNpZ24oZGlmZikpO1xuICAgICAgICB0aGlzLmxvZygnUmVzeW5jIGJ5IHBsYXliYWNrUmF0ZScpO1xuICAgICAgfVxuICAgIH07XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiBjaGVjaygpLCBzeW5jSW50ZXJ2YWwpO1xuICAgIHJldHVybiB7XG4gICAgICBjYW5jZWw6ICgpID0+IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbXNnXG4gICAqL1xuICBsb2cobXNnKSB7XG4gICAgdGhpcy5sb2dnZXI/LihgVGltaW5nU3JjQ29ubmVjdG9yOiAke21zZ31gKTtcbiAgfVxuICBzcGVlZEFkanVzdG1lbnQgPSAwO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1BsYXllckNvbnRyb2xzfSBwbGF5ZXJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG5ld0FkanVzdG1lbnRcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFkanVzdFNwZWVkID0gYXN5bmMgKHBsYXllciwgbmV3QWRqdXN0bWVudCkgPT4ge1xuICAgIGlmICh0aGlzLnNwZWVkQWRqdXN0bWVudCA9PT0gbmV3QWRqdXN0bWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBuZXdQbGF5YmFja1JhdGUgPSAoYXdhaXQgcGxheWVyLmdldFBsYXliYWNrUmF0ZSgpKSAtIHRoaXMuc3BlZWRBZGp1c3RtZW50ICsgbmV3QWRqdXN0bWVudDtcbiAgICB0aGlzLmxvZyhgTmV3IHBsYXliYWNrUmF0ZTogICR7bmV3UGxheWJhY2tSYXRlfWApO1xuICAgIGF3YWl0IHBsYXllci5zZXRQbGF5YmFja1JhdGUobmV3UGxheWJhY2tSYXRlKTtcbiAgICB0aGlzLnNwZWVkQWRqdXN0bWVudCA9IG5ld0FkanVzdG1lbnQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7VGltaW5nT2JqZWN0fSB0aW1pbmdPYmplY3RcbiAgICogQHBhcmFtIHtUQ29ubmVjdGlvblN0YXRlfSBzdGF0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgd2FpdEZvclRPUmVhZHlTdGF0ZSh0aW1pbmdPYmplY3QsIHN0YXRlKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aW1pbmdPYmplY3QucmVhZHlTdGF0ZSA9PT0gc3RhdGUpIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGltaW5nT2JqZWN0LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCBjaGVjaywge1xuICAgICAgICAgICAgb25jZTogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgY2hlY2soKTtcbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCBwbGF5ZXJNYXAgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgcmVhZHlNYXAgPSBuZXcgV2Vha01hcCgpO1xubGV0IHNjcmVlbmZ1bGwgPSB7fTtcbmNsYXNzIFBsYXllciB7XG4gIC8qKlxuICAgKiBDcmVhdGUgYSBQbGF5ZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7KEhUTUxJRnJhbWVFbGVtZW50fEhUTUxFbGVtZW50fHN0cmluZ3xqUXVlcnkpfSBlbGVtZW50IEEgcmVmZXJlbmNlIHRvIHRoZSBWaW1lb1xuICAgKiAgICAgICAgcGxheWVyIGlmcmFtZSwgYW5kIGlkLCBvciBhIGpRdWVyeSBvYmplY3QuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gb0VtYmVkIHBhcmFtZXRlcnMgdG8gdXNlIHdoZW4gY3JlYXRpbmcgYW4gZW1iZWQgaW4gdGhlIGVsZW1lbnQuXG4gICAqIEByZXR1cm4ge1BsYXllcn1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgLyogZ2xvYmFsIGpRdWVyeSAqL1xuICAgIGlmICh3aW5kb3cualF1ZXJ5ICYmIGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnkpIHtcbiAgICAgIGlmIChlbGVtZW50Lmxlbmd0aCA+IDEgJiYgd2luZG93LmNvbnNvbGUgJiYgY29uc29sZS53YXJuKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignQSBqUXVlcnkgb2JqZWN0IHdpdGggbXVsdGlwbGUgZWxlbWVudHMgd2FzIHBhc3NlZCwgdXNpbmcgdGhlIGZpcnN0IGVsZW1lbnQuJyk7XG4gICAgICB9XG4gICAgICBlbGVtZW50ID0gZWxlbWVudFswXTtcbiAgICB9XG5cbiAgICAvLyBGaW5kIGFuIGVsZW1lbnQgYnkgSURcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZWxlbWVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbGVtZW50KTtcbiAgICB9XG5cbiAgICAvLyBOb3QgYW4gZWxlbWVudCFcbiAgICBpZiAoIWlzRG9tRWxlbWVudChlbGVtZW50KSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBlaXRoZXIgYSB2YWxpZCBlbGVtZW50IG9yIGEgdmFsaWQgaWQuJyk7XG4gICAgfVxuXG4gICAgLy8gQWxyZWFkeSBpbml0aWFsaXplZCBhbiBlbWJlZCBpbiB0aGlzIGRpdiwgc28gZ3JhYiB0aGUgaWZyYW1lXG4gICAgaWYgKGVsZW1lbnQubm9kZU5hbWUgIT09ICdJRlJBTUUnKSB7XG4gICAgICBjb25zdCBpZnJhbWUgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lmcmFtZScpO1xuICAgICAgaWYgKGlmcmFtZSkge1xuICAgICAgICBlbGVtZW50ID0gaWZyYW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGlmcmFtZSB1cmwgaXMgbm90IGEgVmltZW8gdXJsXG4gICAgaWYgKGVsZW1lbnQubm9kZU5hbWUgPT09ICdJRlJBTUUnICYmICFpc1ZpbWVvVXJsKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdzcmMnKSB8fCAnJykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHBsYXllciBlbGVtZW50IHBhc3NlZCBpc27igJl0IGEgVmltZW8gZW1iZWQuJyk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYWxyZWFkeSBhIHBsYXllciBvYmplY3QgaW4gdGhlIG1hcCwgcmV0dXJuIHRoYXRcbiAgICBpZiAocGxheWVyTWFwLmhhcyhlbGVtZW50KSkge1xuICAgICAgcmV0dXJuIHBsYXllck1hcC5nZXQoZWxlbWVudCk7XG4gICAgfVxuICAgIHRoaXMuX3dpbmRvdyA9IGVsZW1lbnQub3duZXJEb2N1bWVudC5kZWZhdWx0VmlldztcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3JpZ2luID0gJyonO1xuICAgIGNvbnN0IHJlYWR5UHJvbWlzZSA9IG5ldyBucG9fc3JjKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuX29uTWVzc2FnZSA9IGV2ZW50ID0+IHtcbiAgICAgICAgaWYgKCFpc1ZpbWVvVXJsKGV2ZW50Lm9yaWdpbikgfHwgdGhpcy5lbGVtZW50LmNvbnRlbnRXaW5kb3cgIT09IGV2ZW50LnNvdXJjZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcmlnaW4gPT09ICcqJykge1xuICAgICAgICAgIHRoaXMub3JpZ2luID0gZXZlbnQub3JpZ2luO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRhdGEgPSBwYXJzZU1lc3NhZ2VEYXRhKGV2ZW50LmRhdGEpO1xuICAgICAgICBjb25zdCBpc0Vycm9yID0gZGF0YSAmJiBkYXRhLmV2ZW50ID09PSAnZXJyb3InO1xuICAgICAgICBjb25zdCBpc1JlYWR5RXJyb3IgPSBpc0Vycm9yICYmIGRhdGEuZGF0YSAmJiBkYXRhLmRhdGEubWV0aG9kID09PSAncmVhZHknO1xuICAgICAgICBpZiAoaXNSZWFkeUVycm9yKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoZGF0YS5kYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgIGVycm9yLm5hbWUgPSBkYXRhLmRhdGEubmFtZTtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpc1JlYWR5RXZlbnQgPSBkYXRhICYmIGRhdGEuZXZlbnQgPT09ICdyZWFkeSc7XG4gICAgICAgIGNvbnN0IGlzUGluZ1Jlc3BvbnNlID0gZGF0YSAmJiBkYXRhLm1ldGhvZCA9PT0gJ3BpbmcnO1xuICAgICAgICBpZiAoaXNSZWFkeUV2ZW50IHx8IGlzUGluZ1Jlc3BvbnNlKSB7XG4gICAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS1yZWFkeScsICd0cnVlJyk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzRGF0YSh0aGlzLCBkYXRhKTtcbiAgICAgIH07XG4gICAgICB0aGlzLl93aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuX29uTWVzc2FnZSk7XG4gICAgICBpZiAodGhpcy5lbGVtZW50Lm5vZGVOYW1lICE9PSAnSUZSQU1FJykge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBnZXRPRW1iZWRQYXJhbWV0ZXJzKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICBjb25zdCB1cmwgPSBnZXRWaW1lb1VybChwYXJhbXMpO1xuICAgICAgICBnZXRPRW1iZWREYXRhKHVybCwgcGFyYW1zLCBlbGVtZW50KS50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgIGNvbnN0IGlmcmFtZSA9IGNyZWF0ZUVtYmVkKGRhdGEsIGVsZW1lbnQpO1xuICAgICAgICAgIC8vIE92ZXJ3cml0ZSBlbGVtZW50IHdpdGggdGhlIG5ldyBpZnJhbWUsXG4gICAgICAgICAgLy8gYnV0IHN0b3JlIHJlZmVyZW5jZSB0byB0aGUgb3JpZ2luYWwgZWxlbWVudFxuICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGlmcmFtZTtcbiAgICAgICAgICB0aGlzLl9vcmlnaW5hbEVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICAgIHN3YXBDYWxsYmFja3MoZWxlbWVudCwgaWZyYW1lKTtcbiAgICAgICAgICBwbGF5ZXJNYXAuc2V0KHRoaXMuZWxlbWVudCwgdGhpcyk7XG4gICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH0pLmNhdGNoKHJlamVjdCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTdG9yZSBhIGNvcHkgb2YgdGhpcyBQbGF5ZXIgaW4gdGhlIG1hcFxuICAgIHJlYWR5TWFwLnNldCh0aGlzLCByZWFkeVByb21pc2UpO1xuICAgIHBsYXllck1hcC5zZXQodGhpcy5lbGVtZW50LCB0aGlzKTtcblxuICAgIC8vIFNlbmQgYSBwaW5nIHRvIHRoZSBpZnJhbWUgc28gdGhlIHJlYWR5IHByb21pc2Ugd2lsbCBiZSByZXNvbHZlZCBpZlxuICAgIC8vIHRoZSBwbGF5ZXIgaXMgYWxyZWFkeSByZWFkeS5cbiAgICBpZiAodGhpcy5lbGVtZW50Lm5vZGVOYW1lID09PSAnSUZSQU1FJykge1xuICAgICAgcG9zdE1lc3NhZ2UodGhpcywgJ3BpbmcnKTtcbiAgICB9XG4gICAgaWYgKHNjcmVlbmZ1bGwuaXNFbmFibGVkKSB7XG4gICAgICBjb25zdCBleGl0RnVsbHNjcmVlbiA9ICgpID0+IHNjcmVlbmZ1bGwuZXhpdCgpO1xuICAgICAgdGhpcy5mdWxsc2NyZWVuY2hhbmdlSGFuZGxlciA9ICgpID0+IHtcbiAgICAgICAgaWYgKHNjcmVlbmZ1bGwuaXNGdWxsc2NyZWVuKSB7XG4gICAgICAgICAgc3RvcmVDYWxsYmFjayh0aGlzLCAnZXZlbnQ6ZXhpdEZ1bGxzY3JlZW4nLCBleGl0RnVsbHNjcmVlbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVtb3ZlQ2FsbGJhY2sodGhpcywgJ2V2ZW50OmV4aXRGdWxsc2NyZWVuJywgZXhpdEZ1bGxzY3JlZW4pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgICB0aGlzLnJlYWR5KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcG9zdE1lc3NhZ2UodGhpcywgJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBzY3JlZW5mdWxsLmlzRnVsbHNjcmVlbik7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIHNjcmVlbmZ1bGwub24oJ2Z1bGxzY3JlZW5jaGFuZ2UnLCB0aGlzLmZ1bGxzY3JlZW5jaGFuZ2VIYW5kbGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgdG8gc2VlIGlmIHRoZSBVUkwgaXMgYSBWaW1lbyBVUkwuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVGhlIFVSTCBzdHJpbmcuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqL1xuICBzdGF0aWMgaXNWaW1lb1VybCh1cmwpIHtcbiAgICByZXR1cm4gaXNWaW1lb1VybCh1cmwpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgZm9yIGEgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgQVBJIG1ldGhvZCB0byBjYWxsLlxuICAgKiBAcGFyYW0gey4uLihzdHJpbmd8bnVtYmVyfG9iamVjdHxBcnJheSl9IGFyZ3MgQXJndW1lbnRzIHRvIHNlbmQgdmlhIHBvc3RNZXNzYWdlLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgY2FsbE1ldGhvZChuYW1lKSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuICAgIGlmIChuYW1lID09PSB1bmRlZmluZWQgfHwgbmFtZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIG1ldGhvZCBuYW1lLicpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IG5wb19zcmMoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgLy8gV2UgYXJlIHN0b3JpbmcgdGhlIHJlc29sdmUvcmVqZWN0IGhhbmRsZXJzIHRvIGNhbGwgbGF0ZXIsIHNvIHdlXG4gICAgICAvLyBjYW7igJl0IHJldHVybiBoZXJlLlxuICAgICAgcmV0dXJuIHRoaXMucmVhZHkoKS50aGVuKCgpID0+IHtcbiAgICAgICAgc3RvcmVDYWxsYmFjayh0aGlzLCBuYW1lLCB7XG4gICAgICAgICAgcmVzb2x2ZSxcbiAgICAgICAgICByZWplY3RcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGFyZ3MgPSB7fTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICB9XG4gICAgICAgIHBvc3RNZXNzYWdlKHRoaXMsIG5hbWUsIGFyZ3MpO1xuICAgICAgfSkuY2F0Y2gocmVqZWN0KTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogR2V0IGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9mIGEgcGxheWVyIHByb3BlcnR5LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgcHJvcGVydHkgbmFtZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgZ2V0KG5hbWUpIHtcbiAgICByZXR1cm4gbmV3IG5wb19zcmMoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbmFtZSA9IGdldE1ldGhvZE5hbWUobmFtZSwgJ2dldCcpO1xuXG4gICAgICAvLyBXZSBhcmUgc3RvcmluZyB0aGUgcmVzb2x2ZS9yZWplY3QgaGFuZGxlcnMgdG8gY2FsbCBsYXRlciwgc28gd2VcbiAgICAgIC8vIGNhbuKAmXQgcmV0dXJuIGhlcmUuXG4gICAgICByZXR1cm4gdGhpcy5yZWFkeSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBzdG9yZUNhbGxiYWNrKHRoaXMsIG5hbWUsIHtcbiAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgIHJlamVjdFxuICAgICAgICB9KTtcbiAgICAgICAgcG9zdE1lc3NhZ2UodGhpcywgbmFtZSk7XG4gICAgICB9KS5jYXRjaChyZWplY3QpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHByb21pc2UgZm9yIHNldHRpbmcgdGhlIHZhbHVlIG9mIGEgcGxheWVyIHByb3BlcnR5LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgQVBJIG1ldGhvZCB0byBjYWxsLlxuICAgKiBAcGFyYW0ge21peGVkfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgc2V0KG5hbWUsIHZhbHVlKSB7XG4gICAgcmV0dXJuIG5ldyBucG9fc3JjKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIG5hbWUgPSBnZXRNZXRob2ROYW1lKG5hbWUsICdzZXQnKTtcbiAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZXJlIG11c3QgYmUgYSB2YWx1ZSB0byBzZXQuJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGFyZSBzdG9yaW5nIHRoZSByZXNvbHZlL3JlamVjdCBoYW5kbGVycyB0byBjYWxsIGxhdGVyLCBzbyB3ZVxuICAgICAgLy8gY2Fu4oCZdCByZXR1cm4gaGVyZS5cbiAgICAgIHJldHVybiB0aGlzLnJlYWR5KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHN0b3JlQ2FsbGJhY2sodGhpcywgbmFtZSwge1xuICAgICAgICAgIHJlc29sdmUsXG4gICAgICAgICAgcmVqZWN0XG4gICAgICAgIH0pO1xuICAgICAgICBwb3N0TWVzc2FnZSh0aGlzLCBuYW1lLCB2YWx1ZSk7XG4gICAgICB9KS5jYXRjaChyZWplY3QpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBldmVudCBsaXN0ZW5lciBmb3IgdGhlIHNwZWNpZmllZCBldmVudC4gV2lsbCBjYWxsIHRoZVxuICAgKiBjYWxsYmFjayB3aXRoIGEgc2luZ2xlIHBhcmFtZXRlciwgYGRhdGFgLCB0aGF0IGNvbnRhaW5zIHRoZSBkYXRhIGZvclxuICAgKiB0aGF0IGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAgICogQHBhcmFtIHtmdW5jdGlvbigqKX0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiB0aGUgZXZlbnQgZmlyZXMuXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuICBvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCFldmVudE5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gZXZlbnQgbmFtZS4nKTtcbiAgICB9XG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIGNhbGxiYWNrIGZ1bmN0aW9uLicpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cbiAgICBjb25zdCBjYWxsYmFja3MgPSBnZXRDYWxsYmFja3ModGhpcywgYGV2ZW50OiR7ZXZlbnROYW1lfWApO1xuICAgIGlmIChjYWxsYmFja3MubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmNhbGxNZXRob2QoJ2FkZEV2ZW50TGlzdGVuZXInLCBldmVudE5hbWUpLmNhdGNoKCgpID0+IHtcbiAgICAgICAgLy8gSWdub3JlIHRoZSBlcnJvci4gVGhlcmUgd2lsbCBiZSBhbiBlcnJvciBldmVudCBmaXJlZCB0aGF0XG4gICAgICAgIC8vIHdpbGwgdHJpZ2dlciB0aGUgZXJyb3IgY2FsbGJhY2sgaWYgdGhleSBhcmUgbGlzdGVuaW5nLlxuICAgICAgfSk7XG4gICAgfVxuICAgIHN0b3JlQ2FsbGJhY2sodGhpcywgYGV2ZW50OiR7ZXZlbnROYW1lfWAsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXZlbnQgbGlzdGVuZXIgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuIFdpbGwgcmVtb3ZlIGFsbFxuICAgKiBsaXN0ZW5lcnMgZm9yIHRoYXQgZXZlbnQgaWYgYSBgY2FsbGJhY2tgIGlzbuKAmXQgcGFzc2VkLCBvciBvbmx5IHRoYXRcbiAgICogc3BlY2lmaWMgY2FsbGJhY2sgaWYgaXQgaXMgcGFzc2VkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIFRoZSBuYW1lIG9mIHRoZSBldmVudC5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgc3BlY2lmaWMgY2FsbGJhY2sgdG8gcmVtb3ZlLlxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cbiAgb2ZmKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoIWV2ZW50TmFtZSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBldmVudCBuYW1lLicpO1xuICAgIH1cbiAgICBpZiAoY2FsbGJhY2sgJiYgdHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cbiAgICBjb25zdCBsYXN0Q2FsbGJhY2sgPSByZW1vdmVDYWxsYmFjayh0aGlzLCBgZXZlbnQ6JHtldmVudE5hbWV9YCwgY2FsbGJhY2spO1xuXG4gICAgLy8gSWYgdGhlcmUgYXJlIG5vIGNhbGxiYWNrcyBsZWZ0LCByZW1vdmUgdGhlIGxpc3RlbmVyXG4gICAgaWYgKGxhc3RDYWxsYmFjaykge1xuICAgICAgdGhpcy5jYWxsTWV0aG9kKCdyZW1vdmVFdmVudExpc3RlbmVyJywgZXZlbnROYW1lKS5jYXRjaChlID0+IHtcbiAgICAgICAgLy8gSWdub3JlIHRoZSBlcnJvci4gVGhlcmUgd2lsbCBiZSBhbiBlcnJvciBldmVudCBmaXJlZCB0aGF0XG4gICAgICAgIC8vIHdpbGwgdHJpZ2dlciB0aGUgZXJyb3IgY2FsbGJhY2sgaWYgdGhleSBhcmUgbGlzdGVuaW5nLlxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBsb2FkIGEgbmV3IHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBMb2FkVmlkZW9Qcm9taXNlXG4gICAqIEBmdWxmaWxsIHtudW1iZXJ9IFRoZSB2aWRlbyB3aXRoIHRoaXMgaWQgb3IgdXJsIHN1Y2Nlc3NmdWxseSBsb2FkZWQuXG4gICAqIEByZWplY3Qge1R5cGVFcnJvcn0gVGhlIGlkIHdhcyBub3QgYSBudW1iZXIuXG4gICAqL1xuICAvKipcbiAgICogTG9hZCBhIG5ldyB2aWRlbyBpbnRvIHRoaXMgZW1iZWQuIFRoZSBwcm9taXNlIHdpbGwgYmUgcmVzb2x2ZWQgaWZcbiAgICogdGhlIHZpZGVvIGlzIHN1Y2Nlc3NmdWxseSBsb2FkZWQsIG9yIGl0IHdpbGwgYmUgcmVqZWN0ZWQgaWYgaXQgY291bGRcbiAgICogbm90IGJlIGxvYWRlZC5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfG9iamVjdH0gb3B0aW9ucyBUaGUgaWQgb2YgdGhlIHZpZGVvLCB0aGUgdXJsIG9mIHRoZSB2aWRlbywgb3IgYW4gb2JqZWN0IHdpdGggZW1iZWQgb3B0aW9ucy5cbiAgICogQHJldHVybiB7TG9hZFZpZGVvUHJvbWlzZX1cbiAgICovXG4gIGxvYWRWaWRlbyhvcHRpb25zKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnbG9hZFZpZGVvJywgb3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIHBlcmZvcm0gYW4gYWN0aW9uIHdoZW4gdGhlIFBsYXllciBpcyByZWFkeS5cbiAgICpcbiAgICogQHRvZG8gZG9jdW1lbnQgZXJyb3JzXG4gICAqIEBwcm9taXNlIExvYWRWaWRlb1Byb21pc2VcbiAgICogQGZ1bGZpbGwge3ZvaWR9XG4gICAqL1xuICAvKipcbiAgICogVHJpZ2dlciBhIGZ1bmN0aW9uIHdoZW4gdGhlIHBsYXllciBpZnJhbWUgaGFzIGluaXRpYWxpemVkLiBZb3UgZG8gbm90XG4gICAqIG5lZWQgdG8gd2FpdCBmb3IgYHJlYWR5YCB0byB0cmlnZ2VyIHRvIGJlZ2luIGFkZGluZyBldmVudCBsaXN0ZW5lcnNcbiAgICogb3IgY2FsbGluZyBvdGhlciBtZXRob2RzLlxuICAgKlxuICAgKiBAcmV0dXJuIHtSZWFkeVByb21pc2V9XG4gICAqL1xuICByZWFkeSgpIHtcbiAgICBjb25zdCByZWFkeVByb21pc2UgPSByZWFkeU1hcC5nZXQodGhpcykgfHwgbmV3IG5wb19zcmMoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcignVW5rbm93biBwbGF5ZXIuIFByb2JhYmx5IHVubG9hZGVkLicpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbnBvX3NyYy5yZXNvbHZlKHJlYWR5UHJvbWlzZSk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGFkZCBhIGN1ZSBwb2ludCB0byB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBBZGRDdWVQb2ludFByb21pc2VcbiAgICogQGZ1bGZpbGwge3N0cmluZ30gVGhlIGlkIG9mIHRoZSBjdWUgcG9pbnQgdG8gdXNlIGZvciByZW1vdmVDdWVQb2ludC5cbiAgICogQHJlamVjdCB7UmFuZ2VFcnJvcn0gdGhlIHRpbWUgd2FzIGxlc3MgdGhhbiAwIG9yIGdyZWF0ZXIgdGhhbiB0aGVcbiAgICogICAgICAgICB2aWRlb+KAmXMgZHVyYXRpb24uXG4gICAqIEByZWplY3Qge1Vuc3VwcG9ydGVkRXJyb3J9IEN1ZSBwb2ludHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0aGUgY3VycmVudFxuICAgKiAgICAgICAgIHBsYXllciBvciBicm93c2VyLlxuICAgKi9cbiAgLyoqXG4gICAqIEFkZCBhIGN1ZSBwb2ludCB0byB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZSBUaGUgdGltZSBmb3IgdGhlIGN1ZSBwb2ludC5cbiAgICogQHBhcmFtIHtvYmplY3R9IFtkYXRhXSBBcmJpdHJhcnkgZGF0YSB0byBiZSByZXR1cm5lZCB3aXRoIHRoZSBjdWUgcG9pbnQuXG4gICAqIEByZXR1cm4ge0FkZEN1ZVBvaW50UHJvbWlzZX1cbiAgICovXG4gIGFkZEN1ZVBvaW50KHRpbWUpIHtcbiAgICBsZXQgZGF0YSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnYWRkQ3VlUG9pbnQnLCB7XG4gICAgICB0aW1lLFxuICAgICAgZGF0YVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byByZW1vdmUgYSBjdWUgcG9pbnQgZnJvbSB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBBZGRDdWVQb2ludFByb21pc2VcbiAgICogQGZ1bGZpbGwge3N0cmluZ30gVGhlIGlkIG9mIHRoZSBjdWUgcG9pbnQgdGhhdCB3YXMgcmVtb3ZlZC5cbiAgICogQHJlamVjdCB7SW52YWxpZEN1ZVBvaW50fSBUaGUgY3VlIHBvaW50IHdpdGggdGhlIHNwZWNpZmllZCBpZCB3YXMgbm90XG4gICAqICAgICAgICAgZm91bmQuXG4gICAqIEByZWplY3Qge1Vuc3VwcG9ydGVkRXJyb3J9IEN1ZSBwb2ludHMgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCB0aGUgY3VycmVudFxuICAgKiAgICAgICAgIHBsYXllciBvciBicm93c2VyLlxuICAgKi9cbiAgLyoqXG4gICAqIFJlbW92ZSBhIGN1ZSBwb2ludCBmcm9tIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBpZCBvZiB0aGUgY3VlIHBvaW50IHRvIHJlbW92ZS5cbiAgICogQHJldHVybiB7UmVtb3ZlQ3VlUG9pbnRQcm9taXNlfVxuICAgKi9cbiAgcmVtb3ZlQ3VlUG9pbnQoaWQpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdyZW1vdmVDdWVQb2ludCcsIGlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgdGV4dCB0cmFjayBvbiBhIHZpZGVvLlxuICAgKlxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBWaW1lb1RleHRUcmFja1xuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbGFuZ3VhZ2UgVGhlIElTTyBsYW5ndWFnZSBjb2RlLlxuICAgKiBAcHJvcGVydHkge3N0cmluZ30ga2luZCBUaGUga2luZCBvZiB0cmFjayBpdCBpcyAoY2FwdGlvbnMgb3Igc3VidGl0bGVzKS5cbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGxhYmVsIFRoZSBodW1hbuKAkHJlYWRhYmxlIGxhYmVsIGZvciB0aGUgdHJhY2suXG4gICAqL1xuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGVuYWJsZSBhIHRleHQgdHJhY2suXG4gICAqXG4gICAqIEBwcm9taXNlIEVuYWJsZVRleHRUcmFja1Byb21pc2VcbiAgICogQGZ1bGZpbGwge1ZpbWVvVGV4dFRyYWNrfSBUaGUgdGV4dCB0cmFjayB0aGF0IHdhcyBlbmFibGVkLlxuICAgKiBAcmVqZWN0IHtJbnZhbGlkVHJhY2tMYW5ndWFnZUVycm9yfSBObyB0cmFjayB3YXMgYXZhaWxhYmxlIHdpdGggdGhlXG4gICAqICAgICAgICAgc3BlY2lmaWVkIGxhbmd1YWdlLlxuICAgKiBAcmVqZWN0IHtJbnZhbGlkVHJhY2tFcnJvcn0gTm8gdHJhY2sgd2FzIGF2YWlsYWJsZSB3aXRoIHRoZSBzcGVjaWZpZWRcbiAgICogICAgICAgICBsYW5ndWFnZSBhbmQga2luZC5cbiAgICovXG4gIC8qKlxuICAgKiBFbmFibGUgdGhlIHRleHQgdHJhY2sgd2l0aCB0aGUgc3BlY2lmaWVkIGxhbmd1YWdlLCBhbmQgb3B0aW9uYWxseSB0aGVcbiAgICogc3BlY2lmaWVkIGtpbmQgKGNhcHRpb25zIG9yIHN1YnRpdGxlcykuXG4gICAqXG4gICAqIFdoZW4gc2V0IHZpYSB0aGUgQVBJLCB0aGUgdHJhY2sgbGFuZ3VhZ2Ugd2lsbCBub3QgY2hhbmdlIHRoZSB2aWV3ZXLigJlzXG4gICAqIHN0b3JlZCBwcmVmZXJlbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2UgVGhlIHR3b+KAkGxldHRlciBsYW5ndWFnZSBjb2RlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2tpbmRdIFRoZSBraW5kIG9mIHRyYWNrIHRvIGVuYWJsZSAoY2FwdGlvbnMgb3Igc3VidGl0bGVzKS5cbiAgICogQHBhcmFtIHtib29sZWFufSBbc2hvd2luZ10gV2hldGhlciB0byBlbmFibGUgZGlzcGxheSBvZiBjbG9zZWQgY2FwdGlvbnMgZm9yIGVuYWJsZWQgdGV4dCB0cmFjayB3aXRoaW4gdGhlIHBsYXllci5cbiAgICogQHJldHVybiB7RW5hYmxlVGV4dFRyYWNrUHJvbWlzZX1cbiAgICovXG4gIGVuYWJsZVRleHRUcmFjayhsYW5ndWFnZSkge1xuICAgIGxldCBraW5kID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xuICAgIGxldCBzaG93aW5nID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB0cnVlO1xuICAgIGlmICghbGFuZ3VhZ2UpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYSBsYW5ndWFnZS4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnZW5hYmxlVGV4dFRyYWNrJywge1xuICAgICAgbGFuZ3VhZ2UsXG4gICAgICBraW5kLFxuICAgICAgc2hvd2luZ1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBkaXNhYmxlIHRoZSBhY3RpdmUgdGV4dCB0cmFjay5cbiAgICpcbiAgICogQHByb21pc2UgRGlzYWJsZVRleHRUcmFja1Byb21pc2VcbiAgICogQGZ1bGZpbGwge3ZvaWR9IFRoZSB0cmFjayB3YXMgZGlzYWJsZWQuXG4gICAqL1xuICAvKipcbiAgICogRGlzYWJsZSB0aGUgY3VycmVudGx5LWFjdGl2ZSB0ZXh0IHRyYWNrLlxuICAgKlxuICAgKiBAcmV0dXJuIHtEaXNhYmxlVGV4dFRyYWNrUHJvbWlzZX1cbiAgICovXG4gIGRpc2FibGVUZXh0VHJhY2soKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnZGlzYWJsZVRleHRUcmFjaycpO1xuICB9XG5cbiAgLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4uL3R5cGVzL2Zvcm1hdHMuanMnKS5WaW1lb0F1ZGlvVHJhY2t9IFZpbWVvQXVkaW9UcmFjayAqL1xuICAvKiogQHR5cGVkZWYge2ltcG9ydCgnLi4vdHlwZXMvZm9ybWF0cy5qcycpLkF1ZGlvTGFuZ3VhZ2V9IEF1ZGlvTGFuZ3VhZ2UgKi9cbiAgLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4uL3R5cGVzL2Zvcm1hdHMuanMnKS5BdWRpb0tpbmR9IEF1ZGlvS2luZCAqL1xuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGVuYWJsZSBhbiBhdWRpbyB0cmFjay5cbiAgICpcbiAgICogQHByb21pc2UgU2VsZWN0QXVkaW9UcmFja1Byb21pc2VcbiAgICogQGZ1bGZpbGwge1ZpbWVvQXVkaW9UcmFja30gVGhlIGF1ZGlvIHRyYWNrIHRoYXQgd2FzIGVuYWJsZWQuXG4gICAqIEByZWplY3Qge05vQXVkaW9UcmFja3NFcnJvcn0gTm8gYXVkaW8gZXhpc3RzIGZvciB0aGUgdmlkZW8uXG4gICAqIEByZWplY3Qge05vQWx0ZXJuYXRlQXVkaW9UcmFja3NFcnJvcn0gTm8gYWx0ZXJuYXRlIGF1ZGlvIHRyYWNrcyBleGlzdCBmb3IgdGhlIHZpZGVvLlxuICAgKiBAcmVqZWN0IHtOb01hdGNoaW5nQXVkaW9UcmFja0Vycm9yfSBObyB0cmFjayB3YXMgYXZhaWxhYmxlIHdpdGggdGhlIHNwZWNpZmllZFxuICAgKiAgICAgICAgIGxhbmd1YWdlIGFuZCBraW5kLlxuICAgKi9cbiAgLyoqXG4gICAqIEVuYWJsZSB0aGUgYXVkaW8gdHJhY2sgd2l0aCB0aGUgc3BlY2lmaWVkIGxhbmd1YWdlLCBhbmQgb3B0aW9uYWxseSB0aGVcbiAgICogc3BlY2lmaWVkIGtpbmQgKG1haW4sIHRyYW5zbGF0aW9uLCBkZXNjcmlwdGlvbnMsIG9yIGNvbW1lbnRhcnkpLlxuICAgKlxuICAgKiBXaGVuIHNldCB2aWEgdGhlIEFQSSwgdGhlIHRyYWNrIGxhbmd1YWdlIHdpbGwgbm90IGNoYW5nZSB0aGUgdmlld2Vy4oCZc1xuICAgKiBzdG9yZWQgcHJlZmVyZW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtBdWRpb0xhbmd1YWdlfSBsYW5ndWFnZSBUaGUgdHdv4oCQbGV0dGVyIGxhbmd1YWdlIGNvZGUuXG4gICAqIEBwYXJhbSB7QXVkaW9LaW5kfSBba2luZF0gVGhlIGtpbmQgb2YgdHJhY2sgdG8gZW5hYmxlIChtYWluLCB0cmFuc2xhdGlvbiwgZGVzY3JpcHRpb25zLCBjb21tZW50YXJ5KS5cbiAgICogQHJldHVybiB7U2VsZWN0QXVkaW9UcmFja1Byb21pc2V9XG4gICAqL1xuICBzZWxlY3RBdWRpb1RyYWNrKGxhbmd1YWdlLCBraW5kKSB7XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIGxhbmd1YWdlLicpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdzZWxlY3RBdWRpb1RyYWNrJywge1xuICAgICAgbGFuZ3VhZ2UsXG4gICAgICBraW5kXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlIHRoZSBtYWluIGF1ZGlvIHRyYWNrIGZvciB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge1NlbGVjdEF1ZGlvVHJhY2tQcm9taXNlfVxuICAgKi9cbiAgc2VsZWN0RGVmYXVsdEF1ZGlvVHJhY2soKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnc2VsZWN0RGVmYXVsdEF1ZGlvVHJhY2snKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gcGF1c2UgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBQYXVzZVByb21pc2VcbiAgICogQGZ1bGZpbGwge3ZvaWR9IFRoZSB2aWRlbyB3YXMgcGF1c2VkLlxuICAgKi9cbiAgLyoqXG4gICAqIFBhdXNlIHRoZSB2aWRlbyBpZiBpdOKAmXMgcGxheWluZy5cbiAgICpcbiAgICogQHJldHVybiB7UGF1c2VQcm9taXNlfVxuICAgKi9cbiAgcGF1c2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGF1c2UnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gcGxheSB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIFBsYXlQcm9taXNlXG4gICAqIEBmdWxmaWxsIHt2b2lkfSBUaGUgdmlkZW8gd2FzIHBsYXllZC5cbiAgICovXG4gIC8qKlxuICAgKiBQbGF5IHRoZSB2aWRlbyBpZiBpdOKAmXMgcGF1c2VkLiAqKk5vdGU6Kiogb24gaU9TIGFuZCBzb21lIG90aGVyXG4gICAqIG1vYmlsZSBkZXZpY2VzLCB5b3UgY2Fubm90IHByb2dyYW1tYXRpY2FsbHkgdHJpZ2dlciBwbGF5LiBPbmNlIHRoZVxuICAgKiB2aWV3ZXIgaGFzIHRhcHBlZCBvbiB0aGUgcGxheSBidXR0b24gaW4gdGhlIHBsYXllciwgaG93ZXZlciwgeW91XG4gICAqIHdpbGwgYmUgYWJsZSB0byB1c2UgdGhpcyBmdW5jdGlvbi5cbiAgICpcbiAgICogQHJldHVybiB7UGxheVByb21pc2V9XG4gICAqL1xuICBwbGF5KCkge1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3BsYXknKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHRoYXQgdGhlIHBsYXllciBlbnRlcnMgZnVsbHNjcmVlbi5cbiAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICovXG4gIHJlcXVlc3RGdWxsc2NyZWVuKCkge1xuICAgIGlmIChzY3JlZW5mdWxsLmlzRW5hYmxlZCkge1xuICAgICAgcmV0dXJuIHNjcmVlbmZ1bGwucmVxdWVzdCh0aGlzLmVsZW1lbnQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdyZXF1ZXN0RnVsbHNjcmVlbicpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcXVlc3QgdGhhdCB0aGUgcGxheWVyIGV4aXRzIGZ1bGxzY3JlZW4uXG4gICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAqL1xuICBleGl0RnVsbHNjcmVlbigpIHtcbiAgICBpZiAoc2NyZWVuZnVsbC5pc0VuYWJsZWQpIHtcbiAgICAgIHJldHVybiBzY3JlZW5mdWxsLmV4aXQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnZXhpdEZ1bGxzY3JlZW4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHBsYXllciBpcyBjdXJyZW50bHkgZnVsbHNjcmVlbi5cbiAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICovXG4gIGdldEZ1bGxzY3JlZW4oKSB7XG4gICAgaWYgKHNjcmVlbmZ1bGwuaXNFbmFibGVkKSB7XG4gICAgICByZXR1cm4gbnBvX3NyYy5yZXNvbHZlKHNjcmVlbmZ1bGwuaXNGdWxsc2NyZWVuKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdmdWxsc2NyZWVuJyk7XG4gIH1cblxuICAvKipcbiAgICogUmVxdWVzdCB0aGF0IHRoZSBwbGF5ZXIgZW50ZXJzIHBpY3R1cmUtaW4tcGljdHVyZS5cbiAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICovXG4gIHJlcXVlc3RQaWN0dXJlSW5QaWN0dXJlKCkge1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3JlcXVlc3RQaWN0dXJlSW5QaWN0dXJlJyk7XG4gIH1cblxuICAvKipcbiAgICogUmVxdWVzdCB0aGF0IHRoZSBwbGF5ZXIgZXhpdHMgcGljdHVyZS1pbi1waWN0dXJlLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgZXhpdFBpY3R1cmVJblBpY3R1cmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgnZXhpdFBpY3R1cmVJblBpY3R1cmUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHBsYXllciBpcyBjdXJyZW50bHkgcGljdHVyZS1pbi1waWN0dXJlLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgZ2V0UGljdHVyZUluUGljdHVyZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3BpY3R1cmVJblBpY3R1cmUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gcHJvbXB0IHRoZSB2aWV3ZXIgdG8gaW5pdGlhdGUgcmVtb3RlIHBsYXliYWNrLlxuICAgKlxuICAgKiBAcHJvbWlzZSBSZW1vdGVQbGF5YmFja1Byb21wdFByb21pc2VcbiAgICogQGZ1bGZpbGwge3ZvaWR9XG4gICAqIEByZWplY3Qge05vdEZvdW5kRXJyb3J9IE5vIHJlbW90ZSBwbGF5YmFjayBkZXZpY2UgaXMgYXZhaWxhYmxlLlxuICAgKi9cbiAgLyoqXG4gICAqIFJlcXVlc3QgdG8gcHJvbXB0IHRoZSB1c2VyIHRvIGluaXRpYXRlIHJlbW90ZSBwbGF5YmFjay5cbiAgICpcbiAgICogQHJldHVybiB7UmVtb3RlUGxheWJhY2tQcm9tcHRQcm9taXNlfVxuICAgKi9cbiAgcmVtb3RlUGxheWJhY2tQcm9tcHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncmVtb3RlUGxheWJhY2tQcm9tcHQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gdW5sb2FkIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgVW5sb2FkUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7dm9pZH0gVGhlIHZpZGVvIHdhcyB1bmxvYWRlZC5cbiAgICovXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHBsYXllciB0byBpdHMgaW5pdGlhbCBzdGF0ZS5cbiAgICpcbiAgICogQHJldHVybiB7VW5sb2FkUHJvbWlzZX1cbiAgICovXG4gIHVubG9hZCgpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCd1bmxvYWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbnVwIHRoZSBwbGF5ZXIgYW5kIHJlbW92ZSBpdCBmcm9tIHRoZSBET01cbiAgICpcbiAgICogSXQgd29uJ3QgYmUgdXNhYmxlIGFuZCBhIG5ldyBvbmUgc2hvdWxkIGJlIGNvbnN0cnVjdGVkXG4gICAqICBpbiBvcmRlciB0byBkbyBhbnkgb3BlcmF0aW9ucy5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgcmV0dXJuIG5ldyBucG9fc3JjKHJlc29sdmUgPT4ge1xuICAgICAgcmVhZHlNYXAuZGVsZXRlKHRoaXMpO1xuICAgICAgcGxheWVyTWFwLmRlbGV0ZSh0aGlzLmVsZW1lbnQpO1xuICAgICAgaWYgKHRoaXMuX29yaWdpbmFsRWxlbWVudCkge1xuICAgICAgICBwbGF5ZXJNYXAuZGVsZXRlKHRoaXMuX29yaWdpbmFsRWxlbWVudCk7XG4gICAgICAgIHRoaXMuX29yaWdpbmFsRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtdmltZW8taW5pdGlhbGl6ZWQnKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmVsZW1lbnQgJiYgdGhpcy5lbGVtZW50Lm5vZGVOYW1lID09PSAnSUZSQU1FJyAmJiB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAvLyBJZiB3ZSd2ZSBhZGRlZCBhbiBhZGRpdGlvbmFsIHdyYXBwZXIgZGl2LCByZW1vdmUgdGhhdCBmcm9tIHRoZSBET00uXG4gICAgICAgIC8vIElmIG5vdCwganVzdCByZW1vdmUgdGhlIGlmcmFtZSBlbGVtZW50LlxuICAgICAgICBpZiAodGhpcy5lbGVtZW50LnBhcmVudE5vZGUucGFyZW50Tm9kZSAmJiB0aGlzLl9vcmlnaW5hbEVsZW1lbnQgJiYgdGhpcy5fb3JpZ2luYWxFbGVtZW50ICE9PSB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50LnBhcmVudE5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlIGNsaXAgaXMgcHJpdmF0ZSB0aGVyZSBpcyBhIGNhc2Ugd2hlcmUgdGhlIGVsZW1lbnQgc3RheXMgdGhlXG4gICAgICAvLyBkaXYgZWxlbWVudC4gRGVzdHJveSBzaG91bGQgcmVzZXQgdGhlIGRpdiBhbmQgcmVtb3ZlIHRoZSBpZnJhbWUgY2hpbGQuXG4gICAgICBpZiAodGhpcy5lbGVtZW50ICYmIHRoaXMuZWxlbWVudC5ub2RlTmFtZSA9PT0gJ0RJVicgJiYgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS12aW1lby1pbml0aWFsaXplZCcpO1xuICAgICAgICBjb25zdCBpZnJhbWUgPSB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignaWZyYW1lJyk7XG4gICAgICAgIGlmIChpZnJhbWUgJiYgaWZyYW1lLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAvLyBJZiB3ZSd2ZSBhZGRlZCBhbiBhZGRpdGlvbmFsIHdyYXBwZXIgZGl2LCByZW1vdmUgdGhhdCBmcm9tIHRoZSBET00uXG4gICAgICAgICAgLy8gSWYgbm90LCBqdXN0IHJlbW92ZSB0aGUgaWZyYW1lIGVsZW1lbnQuXG4gICAgICAgICAgaWYgKGlmcmFtZS5wYXJlbnROb2RlLnBhcmVudE5vZGUgJiYgdGhpcy5fb3JpZ2luYWxFbGVtZW50ICYmIHRoaXMuX29yaWdpbmFsRWxlbWVudCAhPT0gaWZyYW1lLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIGlmcmFtZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaWZyYW1lLnBhcmVudE5vZGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZnJhbWUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpZnJhbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLl9vbk1lc3NhZ2UpO1xuICAgICAgaWYgKHNjcmVlbmZ1bGwuaXNFbmFibGVkKSB7XG4gICAgICAgIHNjcmVlbmZ1bGwub2ZmKCdmdWxsc2NyZWVuY2hhbmdlJywgdGhpcy5mdWxsc2NyZWVuY2hhbmdlSGFuZGxlcik7XG4gICAgICB9XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgYXV0b3BhdXNlIGJlaGF2aW9yIG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0QXV0b3BhdXNlUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7Ym9vbGVhbn0gV2hldGhlciBhdXRvcGF1c2UgaXMgdHVybmVkIG9uIG9yIG9mZi5cbiAgICogQHJlamVjdCB7VW5zdXBwb3J0ZWRFcnJvcn0gQXV0b3BhdXNlIGlzIG5vdCBzdXBwb3J0ZWQgd2l0aCB0aGUgY3VycmVudFxuICAgKiAgICAgICAgIHBsYXllciBvciBicm93c2VyLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgYXV0b3BhdXNlIGJlaGF2aW9yIGZvciB0aGlzIHBsYXllci5cbiAgICpcbiAgICogQHJldHVybiB7R2V0QXV0b3BhdXNlUHJvbWlzZX1cbiAgICovXG4gIGdldEF1dG9wYXVzZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ2F1dG9wYXVzZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBzZXQgdGhlIGF1dG9wYXVzZSBiZWhhdmlvciBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIFNldEF1dG9wYXVzZVByb21pc2VcbiAgICogQGZ1bGZpbGwge2Jvb2xlYW59IFdoZXRoZXIgYXV0b3BhdXNlIGlzIHR1cm5lZCBvbiBvciBvZmYuXG4gICAqIEByZWplY3Qge1Vuc3VwcG9ydGVkRXJyb3J9IEF1dG9wYXVzZSBpcyBub3Qgc3VwcG9ydGVkIHdpdGggdGhlIGN1cnJlbnRcbiAgICogICAgICAgICBwbGF5ZXIgb3IgYnJvd3Nlci5cbiAgICovXG4gIC8qKlxuICAgKiBFbmFibGUgb3IgZGlzYWJsZSB0aGUgYXV0b3BhdXNlIGJlaGF2aW9yIG9mIHRoaXMgcGxheWVyLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCB3aGVuIGFub3RoZXIgdmlkZW8gaXMgcGxheWVkIGluIHRoZSBzYW1lIGJyb3dzZXIsIHRoaXNcbiAgICogcGxheWVyIHdpbGwgYXV0b21hdGljYWxseSBwYXVzZS4gVW5sZXNzIHlvdSBoYXZlIGEgc3BlY2lmaWMgcmVhc29uXG4gICAqIGZvciBkb2luZyBzbywgd2UgcmVjb21tZW5kIHRoYXQgeW91IGxlYXZlIGF1dG9wYXVzZSBzZXQgdG8gdGhlXG4gICAqIGRlZmF1bHQgKGB0cnVlYCkuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b3BhdXNlXG4gICAqIEByZXR1cm4ge1NldEF1dG9wYXVzZVByb21pc2V9XG4gICAqL1xuICBzZXRBdXRvcGF1c2UoYXV0b3BhdXNlKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KCdhdXRvcGF1c2UnLCBhdXRvcGF1c2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIGJ1ZmZlcmVkIHByb3BlcnR5IG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0QnVmZmVyZWRQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtBcnJheX0gQnVmZmVyZWQgVGltZXJhbmdlcyBjb252ZXJ0ZWQgdG8gYW4gQXJyYXkuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBidWZmZXJlZCBwcm9wZXJ0eSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldEJ1ZmZlcmVkUHJvbWlzZX1cbiAgICovXG4gIGdldEJ1ZmZlcmVkKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnYnVmZmVyZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBDYW1lcmFQcm9wZXJ0aWVzXG4gICAqIEBwcm9wIHtudW1iZXJ9IHByb3BzLnlhdyAtIE51bWJlciBiZXR3ZWVuIDAgYW5kIDM2MC5cbiAgICogQHByb3Age251bWJlcn0gcHJvcHMucGl0Y2ggLSBOdW1iZXIgYmV0d2VlbiAtOTAgYW5kIDkwLlxuICAgKiBAcHJvcCB7bnVtYmVyfSBwcm9wcy5yb2xsIC0gTnVtYmVyIGJldHdlZW4gLTE4MCBhbmQgMTgwLlxuICAgKiBAcHJvcCB7bnVtYmVyfSBwcm9wcy5mb3YgLSBUaGUgZmllbGQgb2YgdmlldyBpbiBkZWdyZWVzLlxuICAgKi9cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIGNhbWVyYSBwcm9wZXJ0aWVzIG9mIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIEdldENhbWVyYVByb21pc2VcbiAgICogQGZ1bGZpbGwge0NhbWVyYVByb3BlcnRpZXN9IFRoZSBjYW1lcmEgcHJvcGVydGllcy5cbiAgICovXG4gIC8qKlxuICAgKiBGb3IgMzYwwrAgdmlkZW9zIGdldCB0aGUgY2FtZXJhIHByb3BlcnRpZXMgZm9yIHRoaXMgcGxheWVyLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRDYW1lcmFQcm9taXNlfVxuICAgKi9cbiAgZ2V0Q2FtZXJhUHJvcHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdjYW1lcmFQcm9wcycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBzZXQgdGhlIGNhbWVyYSBwcm9wZXJ0aWVzIG9mIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIFNldENhbWVyYVByb21pc2VcbiAgICogQGZ1bGZpbGwge09iamVjdH0gVGhlIGNhbWVyYSB3YXMgc3VjY2Vzc2Z1bGx5IHNldC5cbiAgICogQHJlamVjdCB7UmFuZ2VFcnJvcn0gVGhlIHJhbmdlIHdhcyBvdXQgb2YgYm91bmRzLlxuICAgKi9cbiAgLyoqXG4gICAqIEZvciAzNjDCsCB2aWRlb3Mgc2V0IHRoZSBjYW1lcmEgcHJvcGVydGllcyBmb3IgdGhpcyBwbGF5ZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7Q2FtZXJhUHJvcGVydGllc30gY2FtZXJhIFRoZSBjYW1lcmEgcHJvcGVydGllc1xuICAgKiBAcmV0dXJuIHtTZXRDYW1lcmFQcm9taXNlfVxuICAgKi9cbiAgc2V0Q2FtZXJhUHJvcHMoY2FtZXJhKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KCdjYW1lcmFQcm9wcycsIGNhbWVyYSk7XG4gIH1cblxuICAvKipcbiAgICogQSByZXByZXNlbnRhdGlvbiBvZiBhIGNoYXB0ZXIuXG4gICAqXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IFZpbWVvQ2hhcHRlclxuICAgKiBAcHJvcGVydHkge251bWJlcn0gc3RhcnRUaW1lIFRoZSBzdGFydCB0aW1lIG9mIHRoZSBjaGFwdGVyLlxuICAgKiBAcHJvcGVydHkge29iamVjdH0gdGl0bGUgVGhlIHRpdGxlIG9mIHRoZSBjaGFwdGVyLlxuICAgKiBAcHJvcGVydHkge251bWJlcn0gaW5kZXggVGhlIHBsYWNlIGluIHRoZSBvcmRlciBvZiBDaGFwdGVycy4gU3RhcnRzIGF0IDEuXG4gICAqL1xuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCBjaGFwdGVycyBmb3IgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRDaGFwdGVyc1Byb21pc2VcbiAgICogQGZ1bGZpbGwge1ZpbWVvQ2hhcHRlcltdfSBUaGUgY2hhcHRlcnMgZm9yIHRoZSB2aWRlby5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgYW4gYXJyYXkgb2YgYWxsIHRoZSBjaGFwdGVycyBmb3IgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRDaGFwdGVyc1Byb21pc2V9XG4gICAqL1xuICBnZXRDaGFwdGVycygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ2NoYXB0ZXJzJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgY3VycmVudGx5IGFjdGl2ZSBjaGFwdGVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRDdXJyZW50Q2hhcHRlcnNQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtWaW1lb0NoYXB0ZXJ8dW5kZWZpbmVkfSBUaGUgY3VycmVudCBjaGFwdGVyIGZvciB0aGUgdmlkZW8uXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50bHkgYWN0aXZlIGNoYXB0ZXIgZm9yIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHJldHVybiB7R2V0Q3VycmVudENoYXB0ZXJzUHJvbWlzZX1cbiAgICovXG4gIGdldEN1cnJlbnRDaGFwdGVyKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnY3VycmVudENoYXB0ZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBhY2NlbnQgY29sb3Igb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgR2V0Q29sb3JQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtzdHJpbmd9IFRoZSBoZXggY29sb3Igb2YgdGhlIHBsYXllci5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFjY2VudCBjb2xvciBmb3IgdGhpcyBwbGF5ZXIuIE5vdGUgdGhpcyBpcyBkZXByZWNhdGVkIGluIHBsYWNlIG9mIGBnZXRDb2xvclR3b2AuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldENvbG9yUHJvbWlzZX1cbiAgICovXG4gIGdldENvbG9yKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnY29sb3InKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IGFsbCBjb2xvcnMgZm9yIHRoZSBwbGF5ZXIgaW4gYW4gYXJyYXkuXG4gICAqXG4gICAqIEBwcm9taXNlIEdldENvbG9yc1Byb21pc2VcbiAgICogQGZ1bGZpbGwge3N0cmluZ1tdfSBUaGUgaGV4IGNvbG9ycyBvZiB0aGUgcGxheWVyLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCBhbGwgdGhlIGNvbG9ycyBmb3IgdGhpcyBwbGF5ZXIgaW4gYW4gYXJyYXk6IFtjb2xvck9uZSwgY29sb3JUd28sIGNvbG9yVGhyZWUsIGNvbG9yRm91cl1cbiAgICpcbiAgICogQHJldHVybiB7R2V0Q29sb3JQcm9taXNlfVxuICAgKi9cbiAgZ2V0Q29sb3JzKCkge1xuICAgIHJldHVybiBucG9fc3JjLmFsbChbdGhpcy5nZXQoJ2NvbG9yT25lJyksIHRoaXMuZ2V0KCdjb2xvclR3bycpLCB0aGlzLmdldCgnY29sb3JUaHJlZScpLCB0aGlzLmdldCgnY29sb3JGb3VyJyldKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gc2V0IHRoZSBhY2NlbnQgY29sb3Igb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgU2V0Q29sb3JQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtzdHJpbmd9IFRoZSBjb2xvciB3YXMgc3VjY2Vzc2Z1bGx5IHNldC5cbiAgICogQHJlamVjdCB7VHlwZUVycm9yfSBUaGUgc3RyaW5nIHdhcyBub3QgYSB2YWxpZCBoZXggb3IgcmdiIGNvbG9yLlxuICAgKiBAcmVqZWN0IHtDb250cmFzdEVycm9yfSBUaGUgY29sb3Igd2FzIHNldCwgYnV0IHRoZSBjb250cmFzdCBpc1xuICAgKiAgICAgICAgIG91dHNpZGUgb2YgdGhlIGFjY2VwdGFibGUgcmFuZ2UuXG4gICAqIEByZWplY3Qge0VtYmVkU2V0dGluZ3NFcnJvcn0gVGhlIG93bmVyIG9mIHRoZSBwbGF5ZXIgaGFzIGNob3NlbiB0b1xuICAgKiAgICAgICAgIHVzZSBhIHNwZWNpZmljIGNvbG9yLlxuICAgKi9cbiAgLyoqXG4gICAqIFNldCB0aGUgYWNjZW50IGNvbG9yIG9mIHRoaXMgcGxheWVyIHRvIGEgaGV4IG9yIHJnYiBzdHJpbmcuIFNldHRpbmcgdGhlXG4gICAqIGNvbG9yIG1heSBmYWlsIGlmIHRoZSBvd25lciBvZiB0aGUgdmlkZW8gaGFzIHNldCB0aGVpciBlbWJlZFxuICAgKiBwcmVmZXJlbmNlcyB0byBmb3JjZSBhIHNwZWNpZmljIGNvbG9yLlxuICAgKiBOb3RlIHRoaXMgaXMgZGVwcmVjYXRlZCBpbiBwbGFjZSBvZiBgc2V0Q29sb3JUd29gLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29sb3IgVGhlIGhleCBvciByZ2IgY29sb3Igc3RyaW5nIHRvIHNldC5cbiAgICogQHJldHVybiB7U2V0Q29sb3JQcm9taXNlfVxuICAgKi9cbiAgc2V0Q29sb3IoY29sb3IpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQoJ2NvbG9yJywgY29sb3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBzZXQgYWxsIGNvbG9ycyBmb3IgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgU2V0Q29sb3JzUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7c3RyaW5nW119IFRoZSBjb2xvcnMgd2VyZSBzdWNjZXNzZnVsbHkgc2V0LlxuICAgKiBAcmVqZWN0IHtUeXBlRXJyb3J9IFRoZSBzdHJpbmcgd2FzIG5vdCBhIHZhbGlkIGhleCBvciByZ2IgY29sb3IuXG4gICAqIEByZWplY3Qge0NvbnRyYXN0RXJyb3J9IFRoZSBjb2xvciB3YXMgc2V0LCBidXQgdGhlIGNvbnRyYXN0IGlzXG4gICAqICAgICAgICAgb3V0c2lkZSBvZiB0aGUgYWNjZXB0YWJsZSByYW5nZS5cbiAgICogQHJlamVjdCB7RW1iZWRTZXR0aW5nc0Vycm9yfSBUaGUgb3duZXIgb2YgdGhlIHBsYXllciBoYXMgY2hvc2VuIHRvXG4gICAqICAgICAgICAgdXNlIGEgc3BlY2lmaWMgY29sb3IuXG4gICAqL1xuICAvKipcbiAgICogU2V0IHRoZSBjb2xvcnMgb2YgdGhpcyBwbGF5ZXIgdG8gYSBoZXggb3IgcmdiIHN0cmluZy4gU2V0dGluZyB0aGVcbiAgICogY29sb3IgbWF5IGZhaWwgaWYgdGhlIG93bmVyIG9mIHRoZSB2aWRlbyBoYXMgc2V0IHRoZWlyIGVtYmVkXG4gICAqIHByZWZlcmVuY2VzIHRvIGZvcmNlIGEgc3BlY2lmaWMgY29sb3IuXG4gICAqIFRoZSBjb2xvcnMgc2hvdWxkIGJlIHBhc3NlZCBpbiBhcyBhbiBhcnJheTogW2NvbG9yT25lLCBjb2xvclR3bywgY29sb3JUaHJlZSwgY29sb3JGb3VyXS5cbiAgICogSWYgYSBjb2xvciBzaG91bGQgbm90IGJlIHNldCwgdGhlIGluZGV4IGluIHRoZSBhcnJheSBjYW4gYmUgbGVmdCBhcyBudWxsLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBjb2xvcnMgQXJyYXkgb2YgdGhlIGhleCBvciByZ2IgY29sb3Igc3RyaW5ncyB0byBzZXQuXG4gICAqIEByZXR1cm4ge1NldENvbG9yc1Byb21pc2V9XG4gICAqL1xuICBzZXRDb2xvcnMoY29sb3JzKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGNvbG9ycykpIHtcbiAgICAgIHJldHVybiBuZXcgbnBvX3NyYygocmVzb2x2ZSwgcmVqZWN0KSA9PiByZWplY3QobmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhbiBhcnJheS4nKSkpO1xuICAgIH1cbiAgICBjb25zdCBudWxsUHJvbWlzZSA9IG5ldyBucG9fc3JjKHJlc29sdmUgPT4gcmVzb2x2ZShudWxsKSk7XG4gICAgY29uc3QgY29sb3JQcm9taXNlcyA9IFtjb2xvcnNbMF0gPyB0aGlzLnNldCgnY29sb3JPbmUnLCBjb2xvcnNbMF0pIDogbnVsbFByb21pc2UsIGNvbG9yc1sxXSA/IHRoaXMuc2V0KCdjb2xvclR3bycsIGNvbG9yc1sxXSkgOiBudWxsUHJvbWlzZSwgY29sb3JzWzJdID8gdGhpcy5zZXQoJ2NvbG9yVGhyZWUnLCBjb2xvcnNbMl0pIDogbnVsbFByb21pc2UsIGNvbG9yc1szXSA/IHRoaXMuc2V0KCdjb2xvckZvdXInLCBjb2xvcnNbM10pIDogbnVsbFByb21pc2VdO1xuICAgIHJldHVybiBucG9fc3JjLmFsbChjb2xvclByb21pc2VzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgY3VlIHBvaW50LlxuICAgKlxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBWaW1lb0N1ZVBvaW50XG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSB0aW1lIFRoZSB0aW1lIG9mIHRoZSBjdWUgcG9pbnQuXG4gICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBkYXRhIFRoZSBkYXRhIHBhc3NlZCB3aGVuIGFkZGluZyB0aGUgY3VlIHBvaW50LlxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gaWQgVGhlIHVuaXF1ZSBpZCBmb3IgdXNlIHdpdGggcmVtb3ZlQ3VlUG9pbnQuXG4gICAqL1xuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgY3VlIHBvaW50cyBvZiBhIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRDdWVQb2ludHNQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtWaW1lb0N1ZVBvaW50W119IFRoZSBjdWUgcG9pbnRzIGFkZGVkIHRvIHRoZSB2aWRlby5cbiAgICogQHJlamVjdCB7VW5zdXBwb3J0ZWRFcnJvcn0gQ3VlIHBvaW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRoZSBjdXJyZW50XG4gICAqICAgICAgICAgcGxheWVyIG9yIGJyb3dzZXIuXG4gICAqL1xuICAvKipcbiAgICogR2V0IGFuIGFycmF5IG9mIHRoZSBjdWUgcG9pbnRzIGFkZGVkIHRvIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHJldHVybiB7R2V0Q3VlUG9pbnRzUHJvbWlzZX1cbiAgICovXG4gIGdldEN1ZVBvaW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ2N1ZVBvaW50cycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIGN1cnJlbnQgdGltZSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldEN1cnJlbnRUaW1lUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgY3VycmVudCB0aW1lIGluIHNlY29uZHMuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IHBsYXliYWNrIHBvc2l0aW9uIGluIHNlY29uZHMuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldEN1cnJlbnRUaW1lUHJvbWlzZX1cbiAgICovXG4gIGdldEN1cnJlbnRUaW1lKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnY3VycmVudFRpbWUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gc2V0IHRoZSBjdXJyZW50IHRpbWUgb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBTZXRDdXJyZW50VGltZVByb21pc2VcbiAgICogQGZ1bGZpbGwge251bWJlcn0gVGhlIGFjdHVhbCBjdXJyZW50IHRpbWUgdGhhdCB3YXMgc2V0LlxuICAgKiBAcmVqZWN0IHtSYW5nZUVycm9yfSB0aGUgdGltZSB3YXMgbGVzcyB0aGFuIDAgb3IgZ3JlYXRlciB0aGFuIHRoZVxuICAgKiAgICAgICAgIHZpZGVv4oCZcyBkdXJhdGlvbi5cbiAgICovXG4gIC8qKlxuICAgKiBTZXQgdGhlIGN1cnJlbnQgcGxheWJhY2sgcG9zaXRpb24gaW4gc2Vjb25kcy4gSWYgdGhlIHBsYXllciB3YXNcbiAgICogcGF1c2VkLCBpdCB3aWxsIHJlbWFpbiBwYXVzZWQuIExpa2V3aXNlLCBpZiB0aGUgcGxheWVyIHdhcyBwbGF5aW5nLFxuICAgKiBpdCB3aWxsIHJlc3VtZSBwbGF5aW5nIG9uY2UgdGhlIHZpZGVvIGhhcyBidWZmZXJlZC5cbiAgICpcbiAgICogWW91IGNhbiBwcm92aWRlIGFuIGFjY3VyYXRlIHRpbWUgYW5kIHRoZSBwbGF5ZXIgd2lsbCBhdHRlbXB0IHRvIHNlZWtcbiAgICogdG8gYXMgY2xvc2UgdG8gdGhhdCB0aW1lIGFzIHBvc3NpYmxlLiBUaGUgZXhhY3QgdGltZSB3aWxsIGJlIHRoZVxuICAgKiBmdWxmaWxsZWQgdmFsdWUgb2YgdGhlIHByb21pc2UuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50VGltZVxuICAgKiBAcmV0dXJuIHtTZXRDdXJyZW50VGltZVByb21pc2V9XG4gICAqL1xuICBzZXRDdXJyZW50VGltZShjdXJyZW50VGltZSkge1xuICAgIHJldHVybiB0aGlzLnNldCgnY3VycmVudFRpbWUnLCBjdXJyZW50VGltZSk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgZHVyYXRpb24gb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXREdXJhdGlvblByb21pc2VcbiAgICogQGZ1bGZpbGwge251bWJlcn0gVGhlIGR1cmF0aW9uIGluIHNlY29uZHMuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBkdXJhdGlvbiBvZiB0aGUgdmlkZW8gaW4gc2Vjb25kcy4gSXQgd2lsbCBiZSByb3VuZGVkIHRvIHRoZVxuICAgKiBuZWFyZXN0IHNlY29uZCBiZWZvcmUgcGxheWJhY2sgYmVnaW5zLCBhbmQgdG8gdGhlIG5lYXJlc3QgdGhvdXNhbmR0aFxuICAgKiBvZiBhIHNlY29uZCBhZnRlciBwbGF5YmFjayBiZWdpbnMuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldER1cmF0aW9uUHJvbWlzZX1cbiAgICovXG4gIGdldER1cmF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnZHVyYXRpb24nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBlbmRlZCBzdGF0ZSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldEVuZGVkUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgdGhlIHZpZGVvIGhhcyBlbmRlZC5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGVuZGVkIHN0YXRlIG9mIHRoZSB2aWRlby4gVGhlIHZpZGVvIGhhcyBlbmRlZCBpZlxuICAgKiBgY3VycmVudFRpbWUgPT09IGR1cmF0aW9uYC5cbiAgICpcbiAgICogQHJldHVybiB7R2V0RW5kZWRQcm9taXNlfVxuICAgKi9cbiAgZ2V0RW5kZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdlbmRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIGxvb3Agc3RhdGUgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgR2V0TG9vcFByb21pc2VcbiAgICogQGZ1bGZpbGwge2Jvb2xlYW59IFdoZXRoZXIgb3Igbm90IHRoZSBwbGF5ZXIgaXMgc2V0IHRvIGxvb3AuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBsb29wIHN0YXRlIG9mIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldExvb3BQcm9taXNlfVxuICAgKi9cbiAgZ2V0TG9vcCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ2xvb3AnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gc2V0IHRoZSBsb29wIHN0YXRlIG9mIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIFNldExvb3BQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtib29sZWFufSBUaGUgbG9vcCBzdGF0ZSB0aGF0IHdhcyBzZXQuXG4gICAqL1xuICAvKipcbiAgICogU2V0IHRoZSBsb29wIHN0YXRlIG9mIHRoZSBwbGF5ZXIuIFdoZW4gc2V0IHRvIGB0cnVlYCwgdGhlIHBsYXllclxuICAgKiB3aWxsIHN0YXJ0IG92ZXIgaW1tZWRpYXRlbHkgb25jZSBwbGF5YmFjayBlbmRzLlxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGxvb3BcbiAgICogQHJldHVybiB7U2V0TG9vcFByb21pc2V9XG4gICAqL1xuICBzZXRMb29wKGxvb3ApIHtcbiAgICByZXR1cm4gdGhpcy5zZXQoJ2xvb3AnLCBsb29wKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gc2V0IHRoZSBtdXRlZCBzdGF0ZSBvZiB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBTZXRNdXRlZFByb21pc2VcbiAgICogQGZ1bGZpbGwge2Jvb2xlYW59IFRoZSBtdXRlZCBzdGF0ZSB0aGF0IHdhcyBzZXQuXG4gICAqL1xuICAvKipcbiAgICogU2V0IHRoZSBtdXRlZCBzdGF0ZSBvZiB0aGUgcGxheWVyLiBXaGVuIHNldCB0byBgdHJ1ZWAsIHRoZSBwbGF5ZXJcbiAgICogdm9sdW1lIHdpbGwgYmUgbXV0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gbXV0ZWRcbiAgICogQHJldHVybiB7U2V0TXV0ZWRQcm9taXNlfVxuICAgKi9cbiAgc2V0TXV0ZWQobXV0ZWQpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQoJ211dGVkJywgbXV0ZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIG11dGVkIHN0YXRlIG9mIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIEdldE11dGVkUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgdGhlIHBsYXllciBpcyBtdXRlZC5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIG11dGVkIHN0YXRlIG9mIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldE11dGVkUHJvbWlzZX1cbiAgICovXG4gIGdldE11dGVkKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnbXV0ZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBwYXVzZWQgc3RhdGUgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgR2V0TG9vcFByb21pc2VcbiAgICogQGZ1bGZpbGwge2Jvb2xlYW59IFdoZXRoZXIgb3Igbm90IHRoZSB2aWRlbyBpcyBwYXVzZWQuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBwYXVzZWQgc3RhdGUgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHJldHVybiB7R2V0TG9vcFByb21pc2V9XG4gICAqL1xuICBnZXRQYXVzZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdwYXVzZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBwbGF5YmFjayByYXRlIG9mIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIEdldFBsYXliYWNrUmF0ZVByb21pc2VcbiAgICogQGZ1bGZpbGwge251bWJlcn0gVGhlIHBsYXliYWNrIHJhdGUgb2YgdGhlIHBsYXllciBvbiBhIHNjYWxlIGZyb20gMCB0byAyLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgcGxheWJhY2sgcmF0ZSBvZiB0aGUgcGxheWVyIG9uIGEgc2NhbGUgZnJvbSBgMGAgdG8gYDJgLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRQbGF5YmFja1JhdGVQcm9taXNlfVxuICAgKi9cbiAgZ2V0UGxheWJhY2tSYXRlKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgncGxheWJhY2tSYXRlJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIHNldCB0aGUgcGxheWJhY2tyYXRlIG9mIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIFNldFBsYXliYWNrUmF0ZVByb21pc2VcbiAgICogQGZ1bGZpbGwge251bWJlcn0gVGhlIHBsYXliYWNrIHJhdGUgd2FzIHNldC5cbiAgICogQHJlamVjdCB7UmFuZ2VFcnJvcn0gVGhlIHBsYXliYWNrIHJhdGUgd2FzIGxlc3MgdGhhbiAwIG9yIGdyZWF0ZXIgdGhhbiAyLlxuICAgKi9cbiAgLyoqXG4gICAqIFNldCB0aGUgcGxheWJhY2sgcmF0ZSBvZiB0aGUgcGxheWVyIG9uIGEgc2NhbGUgZnJvbSBgMGAgdG8gYDJgLiBXaGVuIHNldFxuICAgKiB2aWEgdGhlIEFQSSwgdGhlIHBsYXliYWNrIHJhdGUgd2lsbCBub3QgYmUgc3luY2hyb25pemVkIHRvIG90aGVyXG4gICAqIHBsYXllcnMgb3Igc3RvcmVkIGFzIHRoZSB2aWV3ZXIncyBwcmVmZXJlbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gcGxheWJhY2tSYXRlXG4gICAqIEByZXR1cm4ge1NldFBsYXliYWNrUmF0ZVByb21pc2V9XG4gICAqL1xuICBzZXRQbGF5YmFja1JhdGUocGxheWJhY2tSYXRlKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KCdwbGF5YmFja1JhdGUnLCBwbGF5YmFja1JhdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIHBsYXllZCBwcm9wZXJ0eSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldFBsYXllZFByb21pc2VcbiAgICogQGZ1bGZpbGwge0FycmF5fSBQbGF5ZWQgVGltZXJhbmdlcyBjb252ZXJ0ZWQgdG8gYW4gQXJyYXkuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBwbGF5ZWQgcHJvcGVydHkgb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRQbGF5ZWRQcm9taXNlfVxuICAgKi9cbiAgZ2V0UGxheWVkKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgncGxheWVkJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgcXVhbGl0aWVzIGF2YWlsYWJsZSBvZiB0aGUgY3VycmVudCB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0UXVhbGl0aWVzUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7QXJyYXl9IFRoZSBxdWFsaXRpZXMgb2YgdGhlIHZpZGVvLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgcXVhbGl0aWVzIG9mIHRoZSBjdXJyZW50IHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRRdWFsaXRpZXNQcm9taXNlfVxuICAgKi9cbiAgZ2V0UXVhbGl0aWVzKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgncXVhbGl0aWVzJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgY3VycmVudCBzZXQgcXVhbGl0eSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldFF1YWxpdHlQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtzdHJpbmd9IFRoZSBjdXJyZW50IHNldCBxdWFsaXR5LlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCBzZXQgcXVhbGl0eSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFF1YWxpdHlQcm9taXNlfVxuICAgKi9cbiAgZ2V0UXVhbGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3F1YWxpdHknKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gc2V0IHRoZSB2aWRlbyBxdWFsaXR5LlxuICAgKlxuICAgKiBAcHJvbWlzZSBTZXRRdWFsaXR5UHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgcXVhbGl0eSB3YXMgc2V0LlxuICAgKiBAcmVqZWN0IHtSYW5nZUVycm9yfSBUaGUgcXVhbGl0eSBpcyBub3QgYXZhaWxhYmxlLlxuICAgKi9cbiAgLyoqXG4gICAqIFNldCBhIHZpZGVvIHF1YWxpdHkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBxdWFsaXR5XG4gICAqIEByZXR1cm4ge1NldFF1YWxpdHlQcm9taXNlfVxuICAgKi9cbiAgc2V0UXVhbGl0eShxdWFsaXR5KSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KCdxdWFsaXR5JywgcXVhbGl0eSk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgcmVtb3RlIHBsYXliYWNrIGF2YWlsYWJpbGl0eS5cbiAgICpcbiAgICogQHByb21pc2UgUmVtb3RlUGxheWJhY2tBdmFpbGFiaWxpdHlQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtib29sZWFufSBXaGV0aGVyIHJlbW90ZSBwbGF5YmFjayBpcyBhdmFpbGFibGUuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBhdmFpbGFiaWxpdHkgb2YgcmVtb3RlIHBsYXliYWNrLlxuICAgKlxuICAgKiBAcmV0dXJuIHtSZW1vdGVQbGF5YmFja0F2YWlsYWJpbGl0eVByb21pc2V9XG4gICAqL1xuICBnZXRSZW1vdGVQbGF5YmFja0F2YWlsYWJpbGl0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3JlbW90ZVBsYXliYWNrQXZhaWxhYmlsaXR5Jyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgY3VycmVudCByZW1vdGUgcGxheWJhY2sgc3RhdGUuXG4gICAqXG4gICAqIEBwcm9taXNlIFJlbW90ZVBsYXliYWNrU3RhdGVQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtzdHJpbmd9IFRoZSBzdGF0ZSBvZiB0aGUgcmVtb3RlIHBsYXliYWNrOiBjb25uZWN0aW5nLCBjb25uZWN0ZWQsIG9yIGRpc2Nvbm5lY3RlZC5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnQgcmVtb3RlIHBsYXliYWNrIHN0YXRlLlxuICAgKlxuICAgKiBAcmV0dXJuIHtSZW1vdGVQbGF5YmFja1N0YXRlUHJvbWlzZX1cbiAgICovXG4gIGdldFJlbW90ZVBsYXliYWNrU3RhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdyZW1vdGVQbGF5YmFja1N0YXRlJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgc2Vla2FibGUgcHJvcGVydHkgb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRTZWVrYWJsZVByb21pc2VcbiAgICogQGZ1bGZpbGwge0FycmF5fSBTZWVrYWJsZSBUaW1lcmFuZ2VzIGNvbnZlcnRlZCB0byBhbiBBcnJheS5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIHNlZWthYmxlIHByb3BlcnR5IG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHJldHVybiB7R2V0U2Vla2FibGVQcm9taXNlfVxuICAgKi9cbiAgZ2V0U2Vla2FibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdzZWVrYWJsZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIHNlZWtpbmcgcHJvcGVydHkgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgR2V0U2Vla2luZ1Byb21pc2VcbiAgICogQGZ1bGZpbGwge2Jvb2xlYW59IFdoZXRoZXIgb3Igbm90IHRoZSBwbGF5ZXIgaXMgY3VycmVudGx5IHNlZWtpbmcuXG4gICAqL1xuICAvKipcbiAgICogR2V0IGlmIHRoZSBwbGF5ZXIgaXMgY3VycmVudGx5IHNlZWtpbmcuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFNlZWtpbmdQcm9taXNlfVxuICAgKi9cbiAgZ2V0U2Vla2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3NlZWtpbmcnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSB0ZXh0IHRyYWNrcyBvZiBhIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRUZXh0VHJhY2tzUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7VmltZW9UZXh0VHJhY2tbXX0gVGhlIHRleHQgdHJhY2tzIGFzc29jaWF0ZWQgd2l0aCB0aGUgdmlkZW8uXG4gICAqL1xuICAvKipcbiAgICogR2V0IGFuIGFycmF5IG9mIHRoZSB0ZXh0IHRyYWNrcyB0aGF0IGV4aXN0IGZvciB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFRleHRUcmFja3NQcm9taXNlfVxuICAgKi9cbiAgZ2V0VGV4dFRyYWNrcygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3RleHRUcmFja3MnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBhdWRpbyB0cmFja3Mgb2YgYSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0QXVkaW9UcmFja3NQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtWaW1lb0F1ZGlvVHJhY2tbXX0gVGhlIGF1ZGlvIHRyYWNrcyBhc3NvY2lhdGVkIHdpdGggdGhlIHZpZGVvLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCBhbiBhcnJheSBvZiB0aGUgYXVkaW8gdHJhY2tzIHRoYXQgZXhpc3QgZm9yIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHJldHVybiB7R2V0QXVkaW9UcmFja3NQcm9taXNlfVxuICAgKi9cbiAgZ2V0QXVkaW9UcmFja3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdhdWRpb1RyYWNrcycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIGVuYWJsZWQgYXVkaW8gdHJhY2sgb2YgYSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0QXVkaW9UcmFja1Byb21pc2VcbiAgICogQGZ1bGZpbGwge1ZpbWVvQXVkaW9UcmFja30gVGhlIGVuYWJsZWQgYXVkaW8gdHJhY2suXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBlbmFibGVkIGF1ZGlvIHRyYWNrIGZvciBhIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRBdWRpb1RyYWNrUHJvbWlzZX1cbiAgICovXG4gIGdldEVuYWJsZWRBdWRpb1RyYWNrKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnZW5hYmxlZEF1ZGlvVHJhY2snKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG1haW4gYXVkaW8gdHJhY2sgZm9yIGEgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldEF1ZGlvVHJhY2tQcm9taXNlfVxuICAgKi9cbiAgZ2V0RGVmYXVsdEF1ZGlvVHJhY2soKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdkZWZhdWx0QXVkaW9UcmFjaycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIGVtYmVkIGNvZGUgZm9yIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0VmlkZW9FbWJlZENvZGVQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtzdHJpbmd9IFRoZSBgPGlmcmFtZT5gIGVtYmVkIGNvZGUgZm9yIHRoZSB2aWRlby5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGA8aWZyYW1lPmAgZW1iZWQgY29kZSBmb3IgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRWaWRlb0VtYmVkQ29kZVByb21pc2V9XG4gICAqL1xuICBnZXRWaWRlb0VtYmVkQ29kZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3ZpZGVvRW1iZWRDb2RlJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgaWQgb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRWaWRlb0lkUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgaWQgb2YgdGhlIHZpZGVvLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgaWQgb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRWaWRlb0lkUHJvbWlzZX1cbiAgICovXG4gIGdldFZpZGVvSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCd2aWRlb0lkJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgdGl0bGUgb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRWaWRlb1RpdGxlUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgdGl0bGUgb2YgdGhlIHZpZGVvLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgdGl0bGUgb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRWaWRlb1RpdGxlUHJvbWlzZX1cbiAgICovXG4gIGdldFZpZGVvVGl0bGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCd2aWRlb1RpdGxlJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgbmF0aXZlIHdpZHRoIG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0VmlkZW9XaWR0aFByb21pc2VcbiAgICogQGZ1bGZpbGwge251bWJlcn0gVGhlIG5hdGl2ZSB3aWR0aCBvZiB0aGUgdmlkZW8uXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBuYXRpdmUgd2lkdGggb2YgdGhlIGN1cnJlbnRseeKAkHBsYXlpbmcgdmlkZW8uIFRoZSB3aWR0aCBvZlxuICAgKiB0aGUgaGlnaGVzdOKAkHJlc29sdXRpb24gYXZhaWxhYmxlIHdpbGwgYmUgdXNlZCBiZWZvcmUgcGxheWJhY2sgYmVnaW5zLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRWaWRlb1dpZHRoUHJvbWlzZX1cbiAgICovXG4gIGdldFZpZGVvV2lkdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCd2aWRlb1dpZHRoJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgbmF0aXZlIGhlaWdodCBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldFZpZGVvSGVpZ2h0UHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgbmF0aXZlIGhlaWdodCBvZiB0aGUgdmlkZW8uXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBuYXRpdmUgaGVpZ2h0IG9mIHRoZSBjdXJyZW50bHnigJBwbGF5aW5nIHZpZGVvLiBUaGUgaGVpZ2h0IG9mXG4gICAqIHRoZSBoaWdoZXN04oCQcmVzb2x1dGlvbiBhdmFpbGFibGUgd2lsbCBiZSB1c2VkIGJlZm9yZSBwbGF5YmFjayBiZWdpbnMuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFZpZGVvSGVpZ2h0UHJvbWlzZX1cbiAgICovXG4gIGdldFZpZGVvSGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmdldCgndmlkZW9IZWlnaHQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSB2aW1lby5jb20gdXJsIGZvciB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldFZpZGVvVXJsUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgdmltZW8uY29tIHVybCBmb3IgdGhlIHZpZGVvLlxuICAgKiBAcmVqZWN0IHtQcml2YWN5RXJyb3J9IFRoZSB1cmwgaXNu4oCZdCBhdmFpbGFibGUgYmVjYXVzZSBvZiB0aGUgdmlkZW/igJlzIHByaXZhY3kgc2V0dGluZy5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIHZpbWVvLmNvbSB1cmwgZm9yIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHJldHVybiB7R2V0VmlkZW9VcmxQcm9taXNlfVxuICAgKi9cbiAgZ2V0VmlkZW9VcmwoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCd2aWRlb1VybCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIHZvbHVtZSBsZXZlbCBvZiB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRWb2x1bWVQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtudW1iZXJ9IFRoZSB2b2x1bWUgbGV2ZWwgb2YgdGhlIHBsYXllciBvbiBhIHNjYWxlIGZyb20gMCB0byAxLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCB2b2x1bWUgbGV2ZWwgb2YgdGhlIHBsYXllciBvbiBhIHNjYWxlIGZyb20gYDBgIHRvIGAxYC5cbiAgICpcbiAgICogTW9zdCBtb2JpbGUgZGV2aWNlcyBkbyBub3Qgc3VwcG9ydCBhbiBpbmRlcGVuZGVudCB2b2x1bWUgZnJvbSB0aGVcbiAgICogc3lzdGVtIHZvbHVtZS4gSW4gdGhvc2UgY2FzZXMsIHRoaXMgbWV0aG9kIHdpbGwgYWx3YXlzIHJldHVybiBgMWAuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFZvbHVtZVByb21pc2V9XG4gICAqL1xuICBnZXRWb2x1bWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCd2b2x1bWUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gc2V0IHRoZSB2b2x1bWUgbGV2ZWwgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgU2V0Vm9sdW1lUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgdm9sdW1lIHdhcyBzZXQuXG4gICAqIEByZWplY3Qge1JhbmdlRXJyb3J9IFRoZSB2b2x1bWUgd2FzIGxlc3MgdGhhbiAwIG9yIGdyZWF0ZXIgdGhhbiAxLlxuICAgKi9cbiAgLyoqXG4gICAqIFNldCB0aGUgdm9sdW1lIG9mIHRoZSBwbGF5ZXIgb24gYSBzY2FsZSBmcm9tIGAwYCB0byBgMWAuIFdoZW4gc2V0XG4gICAqIHZpYSB0aGUgQVBJLCB0aGUgdm9sdW1lIGxldmVsIHdpbGwgbm90IGJlIHN5bmNocm9uaXplZCB0byBvdGhlclxuICAgKiBwbGF5ZXJzIG9yIHN0b3JlZCBhcyB0aGUgdmlld2Vy4oCZcyBwcmVmZXJlbmNlLlxuICAgKlxuICAgKiBNb3N0IG1vYmlsZSBkZXZpY2VzIGRvIG5vdCBzdXBwb3J0IHNldHRpbmcgdGhlIHZvbHVtZS4gQW4gZXJyb3Igd2lsbFxuICAgKiAqbm90KiBiZSB0cmlnZ2VyZWQgaW4gdGhhdCBzaXR1YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB2b2x1bWVcbiAgICogQHJldHVybiB7U2V0Vm9sdW1lUHJvbWlzZX1cbiAgICovXG4gIHNldFZvbHVtZSh2b2x1bWUpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQoJ3ZvbHVtZScsIHZvbHVtZSk7XG4gIH1cblxuICAvKiogQHR5cGVkZWYge2ltcG9ydCgndGltaW5nLW9iamVjdCcpLklUaW1pbmdPYmplY3R9IFRpbWluZ09iamVjdCAqL1xuICAvKiogQHR5cGVkZWYge2ltcG9ydCgnLi9saWIvdGltaW5nLXNyYy1jb25uZWN0b3IudHlwZXMnKS5UaW1pbmdTcmNDb25uZWN0b3JPcHRpb25zfSBUaW1pbmdTcmNDb25uZWN0b3JPcHRpb25zICovXG4gIC8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2xpYi90aW1pbmctc3JjLWNvbm5lY3RvcicpLlRpbWluZ1NyY0Nvbm5lY3Rvcn0gVGltaW5nU3JjQ29ubmVjdG9yICovXG5cbiAgLyoqXG4gICAqIENvbm5lY3RzIGEgVGltaW5nT2JqZWN0IHRvIHRoZSB2aWRlbyBwbGF5ZXIgKGh0dHBzOi8vd2VidGltaW5nLmdpdGh1Yi5pby90aW1pbmdvYmplY3QvKVxuICAgKlxuICAgKiBAcGFyYW0ge1RpbWluZ09iamVjdH0gdGltaW5nT2JqZWN0XG4gICAqIEBwYXJhbSB7VGltaW5nU3JjQ29ubmVjdG9yT3B0aW9uc30gb3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFRpbWluZ1NyY0Nvbm5lY3Rvcj59XG4gICAqL1xuICBhc3luYyBzZXRUaW1pbmdTcmModGltaW5nT2JqZWN0LCBvcHRpb25zKSB7XG4gICAgaWYgKCF0aW1pbmdPYmplY3QpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0EgVGltaW5nIE9iamVjdCBtdXN0IGJlIHByb3ZpZGVkLicpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnJlYWR5KCk7XG4gICAgY29uc3QgY29ubmVjdG9yID0gbmV3IFRpbWluZ1NyY0Nvbm5lY3Rvcih0aGlzLCB0aW1pbmdPYmplY3QsIG9wdGlvbnMpO1xuICAgIHBvc3RNZXNzYWdlKHRoaXMsICdub3RpZnlUaW1pbmdPYmplY3RDb25uZWN0Jyk7XG4gICAgY29ubmVjdG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2Rpc2Nvbm5lY3QnLCAoKSA9PiBwb3N0TWVzc2FnZSh0aGlzLCAnbm90aWZ5VGltaW5nT2JqZWN0RGlzY29ubmVjdCcpKTtcbiAgICByZXR1cm4gY29ubmVjdG9yO1xuICB9XG59XG5cbi8vIFNldHVwIGVtYmVkIG9ubHkgaWYgdGhpcyBpcyBub3QgYSBzZXJ2ZXIgcnVudGltZVxuaWYgKCFpc1NlcnZlclJ1bnRpbWUpIHtcbiAgc2NyZWVuZnVsbCA9IGluaXRpYWxpemVTY3JlZW5mdWxsKCk7XG4gIGluaXRpYWxpemVFbWJlZHMoKTtcbiAgcmVzaXplRW1iZWRzKCk7XG4gIGluaXRBcHBlbmRWaWRlb01ldGFkYXRhKCk7XG4gIGNoZWNrVXJsVGltZVBhcmFtKCk7XG4gIHVwZGF0ZURSTUVtYmVkcygpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXI7XG4iLCJcclxuY29uc3QgRmlsdGVycyA9IHtcclxuXHJcbiAgICB0cmVlU29sdmVHdWlkZUlEOiBcInRyZWVTb2x2ZUd1aWRlXCIsXHJcbiAgICB0cmVlU29sdmVGcmFnbWVudHNJRDogXCJ0cmVlU29sdmVGcmFnbWVudHNcIixcclxuICAgIHVwTmF2RWxlbWVudDogJyNzdGVwTmF2IC5jaGFpbi11cHdhcmRzJyxcclxuICAgIGRvd25OYXZFbGVtZW50OiAnI3N0ZXBOYXYgLmNoYWluLWRvd253YXJkcycsXHJcblxyXG4gICAgZnJhZ21lbnRCb3g6ICcjdHJlZVNvbHZlRnJhZ21lbnRzIC5udC1mci1mcmFnbWVudC1ib3gnLFxyXG4gICAgZnJhZ21lbnRCb3hEaXNjdXNzaW9uOiAnI3RyZWVTb2x2ZUZyYWdtZW50cyAubnQtZnItZnJhZ21lbnQtYm94IC5udC1mci1mcmFnbWVudC1kaXNjdXNzaW9uJyxcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgRmlsdGVycztcclxuIiwiaW1wb3J0IEZpbHRlcnMgZnJvbSBcIi4uLy4uLy4uL3N0YXRlL2NvbnN0YW50cy9GaWx0ZXJzXCI7XHJcblxyXG5cclxuY29uc3Qgb25GcmFnbWVudHNSZW5kZXJGaW5pc2hlZCA9ICgpID0+IHtcclxuXHJcbiAgICBjb25zdCBmcmFnbWVudEJveERpc2N1c3Npb25zOiBOb2RlTGlzdE9mPEVsZW1lbnQ+ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChGaWx0ZXJzLmZyYWdtZW50Qm94RGlzY3Vzc2lvbik7XHJcbiAgICBsZXQgZnJhZ21lbnRCb3g6IEhUTUxEaXZFbGVtZW50O1xyXG4gICAgbGV0IGRhdGFEaXNjdXNzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQ7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFnbWVudEJveERpc2N1c3Npb25zLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgIGZyYWdtZW50Qm94ID0gZnJhZ21lbnRCb3hEaXNjdXNzaW9uc1tpXSBhcyBIVE1MRGl2RWxlbWVudDtcclxuICAgICAgICBkYXRhRGlzY3Vzc2lvbiA9IGZyYWdtZW50Qm94LmRhdGFzZXQuZGlzY3Vzc2lvbjtcclxuXHJcbiAgICAgICAgaWYgKGRhdGFEaXNjdXNzaW9uICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIGZyYWdtZW50Qm94LmlubmVySFRNTCA9IGRhdGFEaXNjdXNzaW9uO1xyXG4gICAgICAgICAgICBkZWxldGUgZnJhZ21lbnRCb3guZGF0YXNldC5kaXNjdXNzaW9uO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG9uRnJhZ21lbnRzUmVuZGVyRmluaXNoZWQ7XHJcbiIsImltcG9ydCBQbGF5ZXIgZnJvbSBcIkB2aW1lby9wbGF5ZXJcIjtcclxuXHJcbmltcG9ydCBvbkZyYWdtZW50c1JlbmRlckZpbmlzaGVkIGZyb20gXCIuLi8uLi9mcmFnbWVudHMvY29kZS9vbkZyYWdtZW50c1JlbmRlckZpbmlzaGVkXCI7XHJcblxyXG5cclxuY29uc3Qgc2V0VXBWaW1lb1BsYXllciA9ICgpID0+IHtcclxuXHJcbiAgICAvLyBJZiB5b3Ugd2FudCB0byBjb250cm9sIHRoZSBlbWJlZHMsIHlvdSdsbCBuZWVkIHRvIGNyZWF0ZSBhIFBsYXllciBvYmplY3QuXHJcbiAgICAvLyBZb3UgY2FuIHBhc3MgZWl0aGVyIHRoZSBgPGRpdj5gIG9yIHRoZSBgPGlmcmFtZT5gIGNyZWF0ZWQgaW5zaWRlIHRoZSBkaXYuXHJcblxyXG4gICAgY29uc3QgdmltZW9QbGF5ZXJEaXZzOiBOb2RlTGlzdE9mPEhUTUxEaXZFbGVtZW50PiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5udC10cC12aW1lby1wbGF5ZXInKSBhcyBOb2RlTGlzdE9mPEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICBpZiAoIXZpbWVvUGxheWVyRGl2cykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgdmltZW9QbGF5ZXJEaXY6IEhUTUxEaXZFbGVtZW50O1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmltZW9QbGF5ZXJEaXZzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgIHZpbWVvUGxheWVyRGl2ID0gdmltZW9QbGF5ZXJEaXZzW2ldO1xyXG5cclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgYXV0b3BhdXNlOiBmYWxzZSxcclxuICAgICAgICAgICAgYXV0b3BsYXk6IGZhbHNlLFxyXG4gICAgICAgICAgICB3aWR0aDogNjQwLFxyXG4gICAgICAgICAgICBsb29wOiBmYWxzZSxcclxuICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIG5ldyBQbGF5ZXIoXHJcbiAgICAgICAgICAgIHZpbWVvUGxheWVyRGl2LFxyXG4gICAgICAgICAgICBvcHRpb25zXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IG9uUmVuZGVyRmluaXNoZWQgPSAoKSA9PiB7XHJcblxyXG4gICAgb25GcmFnbWVudHNSZW5kZXJGaW5pc2hlZCgpO1xyXG4gICAgc2V0VXBWaW1lb1BsYXllcigpO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgb25SZW5kZXJGaW5pc2hlZDtcclxuIiwiaW1wb3J0IG9uUmVuZGVyRmluaXNoZWQgZnJvbSBcIi4vb25SZW5kZXJGaW5pc2hlZFwiO1xyXG5cclxuXHJcbmNvbnN0IGluaXRFdmVudHMgPSB7XHJcblxyXG4gIG9uUmVuZGVyRmluaXNoZWQ6ICgpID0+IHtcclxuXHJcbiAgICBvblJlbmRlckZpbmlzaGVkKCk7XHJcbiAgfSxcclxuXHJcbiAgcmVnaXN0ZXJHbG9iYWxFdmVudHM6ICgpID0+IHtcclxuXHJcbiAgICB3aW5kb3cub25yZXNpemUgPSAoKSA9PiB7XHJcblxyXG4gICAgICBpbml0RXZlbnRzLm9uUmVuZGVyRmluaXNoZWQoKTtcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpbml0RXZlbnRzO1xyXG5cclxuXHJcblxyXG4iLCJpbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5cclxuXHJcbmNvbnN0IGluaXRBY3Rpb25zID0ge1xyXG5cclxuICAgIHNldE5vdFJhdzogKHN0YXRlOiBJU3RhdGUpOiBJU3RhdGUgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXdpbmRvdz8uVHJlZVNvbHZlPy5zY3JlZW4/LmlzQXV0b2ZvY3VzRmlyc3RSdW4pIHtcclxuXHJcbiAgICAgICAgICAgIHdpbmRvdy5UcmVlU29sdmUuc2NyZWVuLmF1dG9mb2N1cyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgd2luZG93LlRyZWVTb2x2ZS5zY3JlZW4uaXNBdXRvZm9jdXNGaXJzdFJ1biA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW5pdEFjdGlvbnM7XHJcbiIsIlxyXG5leHBvcnQgZW51bSBQYXJzZVR5cGUge1xyXG5cclxuICAgIE5vbmUgPSAnbm9uZScsXHJcbiAgICBKc29uID0gJ2pzb24nLFxyXG4gICAgVGV4dCA9ICd0ZXh0J1xyXG59XHJcblxyXG4iLCJpbXBvcnQgSVJlbmRlckZyYWdtZW50VUkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvdWkvSVJlbmRlckZyYWdtZW50VUlcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZW5kZXJGcmFnbWVudFVJIGltcGxlbWVudHMgSVJlbmRlckZyYWdtZW50VUkge1xyXG5cclxuICAgIHB1YmxpYyBmcmFnbWVudE9wdGlvbnNFeHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIGRpc2N1c3Npb25Mb2FkZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHB1YmxpYyBhbmNpbGxhcnlFeHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIGRvTm90UGFpbnQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHB1YmxpYyBzZWN0aW9uSW5kZXg6IG51bWJlciA9IDA7XHJcbn1cclxuIiwiaW1wb3J0IElEaXNwbGF5Q2hhcnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheUNoYXJ0XCI7XHJcbmltcG9ydCBJRGlzcGxheVNlY3Rpb24gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheVNlY3Rpb25cIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnRVSSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS91aS9JUmVuZGVyRnJhZ21lbnRVSVwiO1xyXG5pbXBvcnQgUmVuZGVyRnJhZ21lbnRVSSBmcm9tIFwiLi4vdWkvUmVuZGVyRnJhZ21lbnRVSVwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlbmRlckZyYWdtZW50IGltcGxlbWVudHMgSVJlbmRlckZyYWdtZW50IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBpZDogc3RyaW5nLFxyXG4gICAgICAgIHBhcmVudEZyYWdtZW50SUQ6IHN0cmluZyxcclxuICAgICAgICBzZWN0aW9uOiBJRGlzcGxheVNlY3Rpb24sXHJcbiAgICAgICAgc2VnbWVudEluZGV4OiBudW1iZXIgfCBudWxsXHJcbiAgICApIHtcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICAgICAgdGhpcy5zZWN0aW9uID0gc2VjdGlvbjtcclxuICAgICAgICB0aGlzLnBhcmVudEZyYWdtZW50SUQgPSBwYXJlbnRGcmFnbWVudElEO1xyXG4gICAgICAgIHRoaXMuc2VnbWVudEluZGV4ID0gc2VnbWVudEluZGV4O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpZDogc3RyaW5nO1xyXG4gICAgcHVibGljIGlLZXk6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIGlFeGl0S2V5OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBleGl0S2V5OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBhdXRvTWVyZ2VFeGl0OiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgcG9kS2V5OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBwb2RUZXh0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyB0b3BMZXZlbE1hcEtleTogc3RyaW5nID0gJyc7XHJcbiAgICBwdWJsaWMgbWFwS2V5Q2hhaW46IHN0cmluZyA9ICcnO1xyXG4gICAgcHVibGljIGd1aWRlSUQ6IHN0cmluZyA9ICcnO1xyXG4gICAgcHVibGljIHBhcmVudEZyYWdtZW50SUQ6IHN0cmluZztcclxuICAgIHB1YmxpYyB2YWx1ZTogc3RyaW5nID0gJyc7XHJcbiAgICBwdWJsaWMgc2VsZWN0ZWQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIGlzTGVhZjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIG9wdGlvbnM6IEFycmF5PElSZW5kZXJGcmFnbWVudD4gPSBbXTtcclxuICAgIHB1YmxpYyB2YXJpYWJsZTogQXJyYXk8W3N0cmluZ10gfCBbc3RyaW5nLCBzdHJpbmddPiA9IFtdO1xyXG4gICAgcHVibGljIGNsYXNzZXM6IEFycmF5PHN0cmluZz4gPSBbXTtcclxuXHJcbiAgICBwdWJsaWMgb3B0aW9uOiBzdHJpbmcgPSAnJztcclxuICAgIHB1YmxpYyBpc0FuY2lsbGFyeTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIG9yZGVyOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHB1YmxpYyBsaW5rOiBJRGlzcGxheUNoYXJ0IHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgcG9kOiBJRGlzcGxheUNoYXJ0IHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgc2VjdGlvbjogSURpc3BsYXlTZWN0aW9uO1xyXG4gICAgcHVibGljIHNlZ21lbnRJbmRleDogbnVtYmVyIHwgbnVsbDtcclxuXHJcbiAgICBwdWJsaWMgdWk6IElSZW5kZXJGcmFnbWVudFVJID0gbmV3IFJlbmRlckZyYWdtZW50VUkoKTtcclxufVxyXG4iLCJcclxuZXhwb3J0IGVudW0gT3V0bGluZVR5cGUge1xyXG5cclxuICAgIE5vbmUgPSAnbm9uZScsXHJcbiAgICBOb2RlID0gJ25vZGUnLFxyXG4gICAgRXhpdCA9ICdleGl0JyxcclxuICAgIExpbmsgPSAnbGluaydcclxufVxyXG5cclxuIiwiaW1wb3J0IHsgT3V0bGluZVR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9PdXRsaW5lVHlwZVwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmVOb2RlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZU5vZGVcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZW5kZXJPdXRsaW5lTm9kZSBpbXBsZW1lbnRzIElSZW5kZXJPdXRsaW5lTm9kZSB7XHJcblxyXG4gICAgcHVibGljIGk6IHN0cmluZyA9ICcnOyAvLyBpZFxyXG4gICAgcHVibGljIGM6IG51bWJlciB8IG51bGwgPSBudWxsOyAvLyBpbmRleCBmcm9tIG91dGxpbmUgY2hhcnQgYXJyYXlcclxuICAgIHB1YmxpYyBkOiBudW1iZXIgfCBudWxsID0gbnVsbDsgLy8gaW5kZXggZnJvbSBvdXRsaW5lIGNoYXJ0IGFycmF5XHJcbiAgICBwdWJsaWMgeDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCA9IG51bGw7IC8vIGlFeGl0IGlkXHJcbiAgICBwdWJsaWMgX3g6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgPSBudWxsOyAvLyBleGl0IGlkXHJcbiAgICBwdWJsaWMgbzogQXJyYXk8SVJlbmRlck91dGxpbmVOb2RlPiA9IFtdOyAvLyBvcHRpb25zXHJcbiAgICBwdWJsaWMgcGFyZW50OiBJUmVuZGVyT3V0bGluZU5vZGUgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyB0eXBlOiBPdXRsaW5lVHlwZSA9IE91dGxpbmVUeXBlLk5vZGU7XHJcbiAgICBwdWJsaWMgaXNDaGFydDogYm9vbGVhbiA9IHRydWU7XHJcbiAgICBwdWJsaWMgaXNSb290OiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgaXNMYXN0OiBib29sZWFuID0gZmFsc2U7XHJcbn1cclxuIiwiaW1wb3J0IElSZW5kZXJPdXRsaW5lIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZVwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmVDaGFydCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVDaGFydFwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmVOb2RlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZU5vZGVcIjtcclxuaW1wb3J0IFJlbmRlck91dGxpbmVOb2RlIGZyb20gXCIuL1JlbmRlck91dGxpbmVOb2RlXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVuZGVyT3V0bGluZSBpbXBsZW1lbnRzIElSZW5kZXJPdXRsaW5lIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwYXRoOiBzdHJpbmcsXHJcbiAgICAgICAgYmFzZVVSSTogc3RyaW5nXHJcbiAgICApIHtcclxuICAgICAgICB0aGlzLnBhdGggPSBwYXRoO1xyXG4gICAgICAgIHRoaXMuYmFzZVVSSSA9IGJhc2VVUkk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHBhdGg6IHN0cmluZztcclxuICAgIHB1YmxpYyBiYXNlVVJJOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgbG9hZGVkID0gZmFsc2U7XHJcblxyXG4gICAgcHVibGljIHY6IHN0cmluZyA9ICcnO1xyXG4gICAgcHVibGljIHI6IElSZW5kZXJPdXRsaW5lTm9kZSA9IG5ldyBSZW5kZXJPdXRsaW5lTm9kZSgpO1xyXG4gICAgcHVibGljIGM6IEFycmF5PElSZW5kZXJPdXRsaW5lQ2hhcnQ+ID0gW107XHJcbiAgICBwdWJsaWMgZTogbnVtYmVyIHwgdW5kZWZpbmVkO1xyXG4gICAgcHVibGljIG12OiBhbnkgfCB1bmRlZmluZWQ7XHJcbn1cclxuIiwiaW1wb3J0IElSZW5kZXJPdXRsaW5lQ2hhcnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lQ2hhcnRcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZW5kZXJPdXRsaW5lQ2hhcnQgaW1wbGVtZW50cyBJUmVuZGVyT3V0bGluZUNoYXJ0IHtcclxuXHJcbiAgICBwdWJsaWMgaTogc3RyaW5nID0gJyc7XHJcbiAgICBwdWJsaWMgYjogc3RyaW5nID0gJyc7XHJcbiAgICBwdWJsaWMgcDogc3RyaW5nID0gJyc7XHJcbn1cclxuIiwiaW1wb3J0IElEaXNwbGF5R3VpZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheUd1aWRlXCI7XHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgSVJlbmRlckd1aWRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyR3VpZGVcIjtcclxuaW1wb3J0IElSZW5kZXJPdXRsaW5lIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZVwiO1xyXG5pbXBvcnQgUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uL3JlbmRlci9SZW5kZXJGcmFnbWVudFwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpc3BsYXlHdWlkZSBpbXBsZW1lbnRzIElEaXNwbGF5R3VpZGUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIGxpbmtJRDogbnVtYmVyLFxyXG4gICAgICAgIGd1aWRlOiBJUmVuZGVyR3VpZGUsXHJcbiAgICAgICAgcm9vdElEOiBzdHJpbmdcclxuICAgICkge1xyXG4gICAgICAgIHRoaXMubGlua0lEID0gbGlua0lEO1xyXG4gICAgICAgIHRoaXMuZ3VpZGUgPSBndWlkZTtcclxuXHJcbiAgICAgICAgdGhpcy5yb290ID0gbmV3IFJlbmRlckZyYWdtZW50KFxyXG4gICAgICAgICAgICByb290SUQsXHJcbiAgICAgICAgICAgIFwiZ3VpZGVSb290XCIsXHJcbiAgICAgICAgICAgIHRoaXMsXHJcbiAgICAgICAgICAgIDBcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBsaW5rSUQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyBndWlkZTogSVJlbmRlckd1aWRlO1xyXG4gICAgcHVibGljIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgcm9vdDogSVJlbmRlckZyYWdtZW50O1xyXG4gICAgcHVibGljIGN1cnJlbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPSBudWxsO1xyXG59XHJcbiIsImltcG9ydCBJUmVuZGVyR3VpZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJHdWlkZVwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlbmRlckd1aWRlIGltcGxlbWVudHMgSVJlbmRlckd1aWRlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihpZDogc3RyaW5nKSB7XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBpZDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaWQ6IHN0cmluZztcclxuICAgIHB1YmxpYyB0aXRsZTogc3RyaW5nID0gJyc7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb246IHN0cmluZyA9ICcnO1xyXG4gICAgcHVibGljIHBhdGg6IHN0cmluZyA9ICcnO1xyXG4gICAgcHVibGljIGZyYWdtZW50Rm9sZGVyVXJsOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxufVxyXG4iLCJcclxuZXhwb3J0IGVudW0gU2Nyb2xsSG9wVHlwZSB7XHJcbiAgICBOb25lID0gXCJub25lXCIsXHJcbiAgICBVcCA9IFwidXBcIixcclxuICAgIERvd24gPSBcImRvd25cIlxyXG59XHJcbiIsImltcG9ydCB7IFNjcm9sbEhvcFR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9TY3JvbGxIb3BUeXBlXCI7XHJcbmltcG9ydCBJU2NyZWVuIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3dpbmRvdy9JU2NyZWVuXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2NyZWVuIGltcGxlbWVudHMgSVNjcmVlbiB7XHJcblxyXG4gICAgcHVibGljIGF1dG9mb2N1czogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIGlzQXV0b2ZvY3VzRmlyc3RSdW46IGJvb2xlYW4gPSB0cnVlO1xyXG4gICAgcHVibGljIGhpZGVCYW5uZXI6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHB1YmxpYyBzY3JvbGxUb1RvcDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIHNjcm9sbFRvRWxlbWVudDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgc2Nyb2xsSG9wOiBTY3JvbGxIb3BUeXBlID0gU2Nyb2xsSG9wVHlwZS5Ob25lO1xyXG4gICAgcHVibGljIGxhc3RTY3JvbGxZOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHB1YmxpYyB1YTogYW55IHwgbnVsbCA9IG51bGw7XHJcbn1cclxuIiwiaW1wb3J0IElTY3JlZW4gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvd2luZG93L0lTY3JlZW5cIjtcclxuaW1wb3J0IElUcmVlU29sdmUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvd2luZG93L0lUcmVlU29sdmVcIjtcclxuaW1wb3J0IFNjcmVlbiBmcm9tIFwiLi9TY3JlZW5cIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUcmVlU29sdmUgaW1wbGVtZW50cyBJVHJlZVNvbHZlIHtcclxuXHJcbiAgICBwdWJsaWMgcmVuZGVyaW5nQ29tbWVudDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgc2NyZWVuOiBJU2NyZWVuID0gbmV3IFNjcmVlbigpO1xyXG59XHJcbiIsIlxyXG5cclxuY29uc3QgZ0ZpbGVDb25zdGFudHMgPSB7XHJcblxyXG4gICAgZnJhZ21lbnRzRm9sZGVyU3VmZml4OiAnX2ZyYWdzJyxcclxuICAgIGZyYWdtZW50RmlsZUV4dGVuc2lvbjogJy5odG1sJyxcclxuICAgIGd1aWRlT3V0bGluZUZpbGVuYW1lOiAnb3V0bGluZS50c29sbicsXHJcbiAgICBndWlkZVJlbmRlckNvbW1lbnRUYWc6ICd0c0d1aWRlUmVuZGVyQ29tbWVudCAnLFxyXG4gICAgZnJhZ21lbnRSZW5kZXJDb21tZW50VGFnOiAndHNGcmFnbWVudFJlbmRlckNvbW1lbnQgJ1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ0ZpbGVDb25zdGFudHM7XHJcblxyXG4iLCJpbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IElSZW5kZXJHdWlkZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckd1aWRlXCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZUNoYXJ0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZUNoYXJ0XCI7XHJcbmltcG9ydCBGaWx0ZXJzIGZyb20gXCIuLi8uLi9zdGF0ZS9jb25zdGFudHMvRmlsdGVyc1wiO1xyXG5pbXBvcnQgRGlzcGxheUd1aWRlIGZyb20gXCIuLi8uLi9zdGF0ZS9kaXNwbGF5L0Rpc3BsYXlHdWlkZVwiO1xyXG5pbXBvcnQgUmVuZGVyR3VpZGUgZnJvbSBcIi4uLy4uL3N0YXRlL3JlbmRlci9SZW5kZXJHdWlkZVwiO1xyXG5pbXBvcnQgVHJlZVNvbHZlIGZyb20gXCIuLi8uLi9zdGF0ZS93aW5kb3cvVHJlZVNvbHZlXCI7XHJcbmltcG9ydCBnRmlsZUNvbnN0YW50cyBmcm9tIFwiLi4vZ0ZpbGVDb25zdGFudHNcIjtcclxuaW1wb3J0IGdGcmFnbWVudENvZGUgZnJvbSBcIi4vZ0ZyYWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgZ1N0YXRlQ29kZSBmcm9tIFwiLi9nU3RhdGVDb2RlXCI7XHJcblxyXG5cclxuY29uc3QgcGFyc2VHdWlkZSA9IChyYXdHdWlkZTogYW55KTogSVJlbmRlckd1aWRlID0+IHtcclxuXHJcbiAgICBjb25zdCBndWlkZTogSVJlbmRlckd1aWRlID0gbmV3IFJlbmRlckd1aWRlKHJhd0d1aWRlLmlkKTtcclxuICAgIGd1aWRlLnRpdGxlID0gcmF3R3VpZGUudGl0bGUgPz8gJyc7XHJcbiAgICBndWlkZS5kZXNjcmlwdGlvbiA9IHJhd0d1aWRlLmRlc2NyaXB0aW9uID8/ICcnO1xyXG4gICAgZ3VpZGUucGF0aCA9IHJhd0d1aWRlLnBhdGggPz8gbnVsbDtcclxuICAgIGd1aWRlLmZyYWdtZW50Rm9sZGVyVXJsID0gZ1JlbmRlckNvZGUuZ2V0R3VpZGVGcmFnbWVudEZvbGRlclVybChyYXdHdWlkZS5mcmFnbWVudEZvbGRlclBhdGgpO1xyXG5cclxuICAgIHJldHVybiBndWlkZTtcclxufTtcclxuXHJcbmNvbnN0IHBhcnNlUmVuZGVyaW5nQ29tbWVudCA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICByYXc6IGFueVxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoIXJhdykge1xyXG4gICAgICAgIHJldHVybiByYXc7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxue1xyXG4gICAgXCJndWlkZVwiOiB7XHJcbiAgICAgICAgXCJpZFwiOiBcImRCdDdKTjF2dFwiXHJcbiAgICB9LFxyXG4gICAgXCJmcmFnbWVudFwiOiB7XHJcbiAgICAgICAgXCJpZFwiOiBcImRCdDdKTjF2dFwiLFxyXG4gICAgICAgIFwidG9wTGV2ZWxNYXBLZXlcIjogXCJjdjFUUmwwMXJmXCIsXHJcbiAgICAgICAgXCJtYXBLZXlDaGFpblwiOiBcImN2MVRSbDAxcmZcIixcclxuICAgICAgICBcImd1aWRlSURcIjogXCJkQnQ3Sk4xSGVcIixcclxuICAgICAgICBcInBhcmVudEZyYWdtZW50SURcIjogbnVsbCxcclxuICAgICAgICBcImNoYXJ0S2V5XCI6IFwiY3YxVFJsMDFyZlwiLFxyXG4gICAgICAgIFwib3B0aW9uc1wiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJkQnQ3S1oxQU5cIixcclxuICAgICAgICAgICAgICAgIFwib3B0aW9uXCI6IFwiT3B0aW9uIDFcIixcclxuICAgICAgICAgICAgICAgIFwiaXNBbmNpbGxhcnlcIjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBcIm9yZGVyXCI6IDFcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcImRCdDdLWjFSYlwiLFxyXG4gICAgICAgICAgICAgICAgXCJvcHRpb25cIjogXCJPcHRpb24gMlwiLFxyXG4gICAgICAgICAgICAgICAgXCJpc0FuY2lsbGFyeVwiOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIFwib3JkZXJcIjogMlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiZEJ0N0taMjRCXCIsXHJcbiAgICAgICAgICAgICAgICBcIm9wdGlvblwiOiBcIk9wdGlvbiAzXCIsXHJcbiAgICAgICAgICAgICAgICBcImlzQW5jaWxsYXJ5XCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgXCJvcmRlclwiOiAzXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9XHJcbn0gICAgXHJcbiAgICAqL1xyXG5cclxuICAgIGNvbnN0IGd1aWRlID0gcGFyc2VHdWlkZShyYXcuZ3VpZGUpO1xyXG5cclxuICAgIGNvbnN0IGRpc3BsYXlHdWlkZSA9IG5ldyBEaXNwbGF5R3VpZGUoXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5nZXRGcmVzaEtleUludChzdGF0ZSksXHJcbiAgICAgICAgZ3VpZGUsXHJcbiAgICAgICAgcmF3LmZyYWdtZW50LmlkXHJcbiAgICApO1xyXG5cclxuICAgIGdGcmFnbWVudENvZGUucGFyc2VBbmRMb2FkR3VpZGVSb290RnJhZ21lbnQoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgcmF3LmZyYWdtZW50LFxyXG4gICAgICAgIGRpc3BsYXlHdWlkZS5yb290XHJcbiAgICApO1xyXG5cclxuICAgIHN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZSA9IGRpc3BsYXlHdWlkZTtcclxuICAgIHN0YXRlLnJlbmRlclN0YXRlLmN1cnJlbnRTZWN0aW9uID0gZGlzcGxheUd1aWRlO1xyXG5cclxuICAgIGdGcmFnbWVudENvZGUuY2FjaGVTZWN0aW9uUm9vdChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5kaXNwbGF5R3VpZGVcclxuICAgICk7XHJcbn07XHJcblxyXG5jb25zdCBnUmVuZGVyQ29kZSA9IHtcclxuXHJcbiAgICBnZXRHdWlkZUZyYWdtZW50Rm9sZGVyVXJsOiAoZm9sZGVyUGF0aDogc3RyaW5nKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChcclxuICAgICAgICAgICAgZm9sZGVyUGF0aCxcclxuICAgICAgICAgICAgZG9jdW1lbnQuYmFzZVVSSVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiB1cmwudG9TdHJpbmcoKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RnJhZ21lbnRGb2xkZXJVcmw6IChcclxuICAgICAgICBjaGFydDogSVJlbmRlck91dGxpbmVDaGFydCxcclxuICAgICAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBwYXRoID0gY2hhcnQucDtcclxuXHJcbiAgICAgICAgaWYgKHBhdGguc3RhcnRzV2l0aCgnaHR0cHM6Ly8nKSA9PT0gdHJ1ZVxyXG4gICAgICAgICAgICB8fCBwYXRoLnN0YXJ0c1dpdGgoJ2h0dHA6Ly8nKSA9PT0gdHJ1ZVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm4gcGF0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBiYXNlVVJJID0gZnJhZ21lbnQuc2VjdGlvbi5vdXRsaW5lPy5iYXNlVVJJO1xyXG5cclxuICAgICAgICBpZiAoIWJhc2VVUkkpIHtcclxuXHJcbiAgICAgICAgICAgIGJhc2VVUkkgPSBkb2N1bWVudC5iYXNlVVJJO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChcclxuICAgICAgICAgICAgcGF0aCxcclxuICAgICAgICAgICAgYmFzZVVSSVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiB1cmwudG9TdHJpbmcoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVnaXN0ZXJHdWlkZUNvbW1lbnQ6ICgpID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgdHJlZVNvbHZlR3VpZGU6IEhUTUxEaXZFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoRmlsdGVycy50cmVlU29sdmVHdWlkZUlEKSBhcyBIVE1MRGl2RWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKHRyZWVTb2x2ZUd1aWRlXHJcbiAgICAgICAgICAgICYmIHRyZWVTb2x2ZUd1aWRlLmhhc0NoaWxkTm9kZXMoKSA9PT0gdHJ1ZVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICBsZXQgY2hpbGROb2RlOiBDaGlsZE5vZGU7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRyZWVTb2x2ZUd1aWRlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjaGlsZE5vZGUgPSB0cmVlU29sdmVHdWlkZS5jaGlsZE5vZGVzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjaGlsZE5vZGUubm9kZVR5cGUgPT09IE5vZGUuQ09NTUVOVF9OT0RFKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghd2luZG93LlRyZWVTb2x2ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LlRyZWVTb2x2ZSA9IG5ldyBUcmVlU29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5UcmVlU29sdmUucmVuZGVyaW5nQ29tbWVudCA9IGNoaWxkTm9kZS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGUucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoY2hpbGROb2RlLm5vZGVUeXBlICE9PSBOb2RlLlRFWFRfTk9ERSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBwYXJzZVJlbmRlcmluZ0NvbW1lbnQ6IChzdGF0ZTogSVN0YXRlKSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghd2luZG93LlRyZWVTb2x2ZT8ucmVuZGVyaW5nQ29tbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsZXQgZ3VpZGVSZW5kZXJDb21tZW50ID0gd2luZG93LlRyZWVTb2x2ZS5yZW5kZXJpbmdDb21tZW50O1xyXG4gICAgICAgICAgICBndWlkZVJlbmRlckNvbW1lbnQgPSBndWlkZVJlbmRlckNvbW1lbnQudHJpbSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFndWlkZVJlbmRlckNvbW1lbnQuc3RhcnRzV2l0aChnRmlsZUNvbnN0YW50cy5ndWlkZVJlbmRlckNvbW1lbnRUYWcpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGd1aWRlUmVuZGVyQ29tbWVudCA9IGd1aWRlUmVuZGVyQ29tbWVudC5zdWJzdHJpbmcoZ0ZpbGVDb25zdGFudHMuZ3VpZGVSZW5kZXJDb21tZW50VGFnLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJhdyA9IEpTT04ucGFyc2UoZ3VpZGVSZW5kZXJDb21tZW50KTtcclxuXHJcbiAgICAgICAgICAgIHBhcnNlUmVuZGVyaW5nQ29tbWVudChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgcmF3XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnUmVuZGVyQ29kZTtcclxuIiwiaW1wb3J0IElEaXNwbGF5Q2hhcnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheUNoYXJ0XCI7XHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lXCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZUNoYXJ0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZUNoYXJ0XCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGlzcGxheUNoYXJ0IGltcGxlbWVudHMgSURpc3BsYXlDaGFydCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgbGlua0lEOiBudW1iZXIsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnRcclxuICAgICkge1xyXG4gICAgICAgIHRoaXMubGlua0lEID0gbGlua0lEO1xyXG4gICAgICAgIHRoaXMuY2hhcnQgPSBjaGFydDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbGlua0lEOiBudW1iZXI7XHJcbiAgICBwdWJsaWMgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQ7XHJcbiAgICBwdWJsaWMgb3V0bGluZTogSVJlbmRlck91dGxpbmUgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyByb290OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIGN1cnJlbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPSBudWxsO1xyXG59XHJcbiIsImltcG9ydCBJRGlzcGxheVNlY3Rpb24gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheVNlY3Rpb25cIjtcclxuaW1wb3J0IElSZW5kZXJPdXRsaW5lTm9kZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVOb2RlXCI7XHJcbmltcG9ydCBJQ2hhaW5TZWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3NlZ21lbnRzL0lDaGFpblNlZ21lbnRcIjtcclxuaW1wb3J0IElTZWdtZW50Tm9kZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9zZWdtZW50cy9JU2VnbWVudE5vZGVcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaGFpblNlZ21lbnQgaW1wbGVtZW50cyBJQ2hhaW5TZWdtZW50IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBpbmRleDogbnVtYmVyLFxyXG4gICAgICAgIHN0YXJ0OiBJU2VnbWVudE5vZGUsXHJcbiAgICAgICAgZW5kOiBJU2VnbWVudE5vZGVcclxuICAgICkge1xyXG4gICAgICAgIHRoaXMuaW5kZXggPSBpbmRleDtcclxuICAgICAgICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XHJcbiAgICAgICAgdGhpcy5lbmQgPSBlbmQ7XHJcbiAgICAgICAgdGhpcy50ZXh0ID0gYCR7c3RhcnQudGV4dH0ke2VuZD8udGV4dCA/PyAnJ31gO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpbmRleDogbnVtYmVyO1xyXG4gICAgcHVibGljIHRleHQ6IHN0cmluZztcclxuICAgIHB1YmxpYyBvdXRsaW5lTm9kZXM6IEFycmF5PElSZW5kZXJPdXRsaW5lTm9kZT4gPSBbXTtcclxuICAgIHB1YmxpYyBvdXRsaW5lTm9kZXNMb2FkZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBwdWJsaWMgc3RhcnQ6IElTZWdtZW50Tm9kZTtcclxuICAgIHB1YmxpYyBlbmQ6IElTZWdtZW50Tm9kZTtcclxuXHJcbiAgICBwdWJsaWMgc2VnbWVudEluU2VjdGlvbjogSURpc3BsYXlTZWN0aW9uIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgc2VnbWVudFNlY3Rpb246IElEaXNwbGF5U2VjdGlvbiB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIHNlZ21lbnRPdXRTZWN0aW9uOiBJRGlzcGxheVNlY3Rpb24gfCBudWxsID0gbnVsbDtcclxufVxyXG5cclxuIiwiaW1wb3J0IHsgT3V0bGluZVR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9PdXRsaW5lVHlwZVwiO1xyXG5pbXBvcnQgSVNlZ21lbnROb2RlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3NlZ21lbnRzL0lTZWdtZW50Tm9kZVwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlZ21lbnROb2RlIGltcGxlbWVudHMgSVNlZ21lbnROb2Rle1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHRleHQ6IHN0cmluZyxcclxuICAgICAgICBrZXk6IHN0cmluZyxcclxuICAgICAgICB0eXBlOiBPdXRsaW5lVHlwZSxcclxuICAgICAgICBpc1Jvb3Q6IGJvb2xlYW4sXHJcbiAgICAgICAgaXNMYXN0OiBib29sZWFuXHJcbiAgICApIHtcclxuICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xyXG4gICAgICAgIHRoaXMua2V5ID0ga2V5O1xyXG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XHJcbiAgICAgICAgdGhpcy5pc1Jvb3QgPSBpc1Jvb3Q7XHJcbiAgICAgICAgdGhpcy5pc0xhc3QgPSBpc0xhc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHRleHQ6IHN0cmluZztcclxuICAgIHB1YmxpYyBrZXk6IHN0cmluZztcclxuICAgIHB1YmxpYyB0eXBlOiBPdXRsaW5lVHlwZTtcclxuICAgIHB1YmxpYyBpc1Jvb3Q6IGJvb2xlYW47XHJcbiAgICBwdWJsaWMgaXNMYXN0OiBib29sZWFuO1xyXG59XHJcblxyXG4iLCJpbXBvcnQgeyBPdXRsaW5lVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL091dGxpbmVUeXBlXCI7XHJcbmltcG9ydCBJRGlzcGxheUNoYXJ0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2Rpc3BsYXkvSURpc3BsYXlDaGFydFwiO1xyXG5pbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IElSZW5kZXJPdXRsaW5lTm9kZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVOb2RlXCI7XHJcbmltcG9ydCBJQ2hhaW5TZWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3NlZ21lbnRzL0lDaGFpblNlZ21lbnRcIjtcclxuaW1wb3J0IElTZWdtZW50Tm9kZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9zZWdtZW50cy9JU2VnbWVudE5vZGVcIjtcclxuaW1wb3J0IENoYWluU2VnbWVudCBmcm9tIFwiLi4vLi4vc3RhdGUvc2VnbWVudHMvQ2hhaW5TZWdtZW50XCI7XHJcbmltcG9ydCBTZWdtZW50Tm9kZSBmcm9tIFwiLi4vLi4vc3RhdGUvc2VnbWVudHMvU2VnbWVudE5vZGVcIjtcclxuaW1wb3J0IGdVdGlsaXRpZXMgZnJvbSBcIi4uL2dVdGlsaXRpZXNcIjtcclxuaW1wb3J0IFUgZnJvbSBcIi4uL2dVdGlsaXRpZXNcIjtcclxuaW1wb3J0IGdGcmFnbWVudENvZGUgZnJvbSBcIi4vZ0ZyYWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgZ1N0YXRlQ29kZSBmcm9tIFwiLi9nU3RhdGVDb2RlXCI7XHJcblxyXG5cclxuY29uc3QgY2hlY2tGb3JMaW5rRXJyb3JzID0gKFxyXG4gICAgc2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgIGxpbmtTZWdtZW50OiBJQ2hhaW5TZWdtZW50LFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoc2VnbWVudC5lbmQua2V5ICE9PSBsaW5rU2VnbWVudC5zdGFydC5rZXlcclxuICAgICAgICB8fCBzZWdtZW50LmVuZC50eXBlICE9PSBsaW5rU2VnbWVudC5zdGFydC50eXBlXHJcbiAgICApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMaW5rIHNlZ21lbnQgc3RhcnQgZG9lcyBub3QgbWF0Y2ggc2VnbWVudCBlbmRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFsaW5rU2VnbWVudC5zZWdtZW50SW5TZWN0aW9uKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgaW4gc2VjdGlvbiB3YXMgbnVsbCAtIGxpbmtcIik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFsaW5rU2VnbWVudC5zZWdtZW50U2VjdGlvbikge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWdtZW50IHNlY3Rpb24gd2FzIG51bGwgLSBsaW5rXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbGlua1NlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBvdXQgc2VjdGlvbiB3YXMgbnVsbCAtIGxpbmtcIik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50LmlLZXkpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzbWF0Y2ggYmV0d2VlbiBmcmFnbWVudCBhbmQgb3V0bGluZSBub2RlIC0gbGluayBpS2V5Jyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChsaW5rU2VnbWVudC5zdGFydC50eXBlICE9PSBPdXRsaW5lVHlwZS5MaW5rKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzbWF0Y2ggYmV0d2VlbiBmcmFnbWVudCBhbmQgb3V0bGluZSBub2RlIC0gbGluaycpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgZ2V0SWRlbnRpZmllckNoYXJhY3RlciA9IChpZGVudGlmaWVyQ2hhcjogc3RyaW5nKTogeyB0eXBlOiBPdXRsaW5lVHlwZSwgaXNMYXN0OiBib29sZWFuIH0gPT4ge1xyXG5cclxuICAgIGxldCBzdGFydE91dGxpbmVUeXBlOiBPdXRsaW5lVHlwZSA9IE91dGxpbmVUeXBlLk5vZGU7XHJcbiAgICBsZXQgaXNMYXN0ID0gZmFsc2U7XHJcblxyXG4gICAgaWYgKGlkZW50aWZpZXJDaGFyID09PSAnficpIHtcclxuXHJcbiAgICAgICAgc3RhcnRPdXRsaW5lVHlwZSA9IE91dGxpbmVUeXBlLkxpbms7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChpZGVudGlmaWVyQ2hhciA9PT0gJ18nKSB7XHJcblxyXG4gICAgICAgIHN0YXJ0T3V0bGluZVR5cGUgPSBPdXRsaW5lVHlwZS5FeGl0O1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoaWRlbnRpZmllckNoYXIgPT09ICctJykge1xyXG5cclxuICAgICAgICBzdGFydE91dGxpbmVUeXBlID0gT3V0bGluZVR5cGUuTm9kZTtcclxuICAgICAgICBpc0xhc3QgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBxdWVyeSBzdHJpbmcgb3V0bGluZSBub2RlIGlkZW50aWZpZXI6ICR7aWRlbnRpZmllckNoYXJ9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlOiBzdGFydE91dGxpbmVUeXBlLFxyXG4gICAgICAgIGlzTGFzdDogaXNMYXN0XHJcbiAgICB9O1xyXG59O1xyXG5cclxuY29uc3QgZ2V0S2V5RW5kSW5kZXggPSAocmVtYWluaW5nQ2hhaW46IHN0cmluZyk6IHsgaW5kZXg6IG51bWJlciwgaXNMYXN0OiBib29sZWFuIHwgbnVsbCB9ID0+IHtcclxuXHJcbiAgICBjb25zdCBzdGFydEtleUVuZEluZGV4ID0gVS5pbmRleE9mQW55KFxyXG4gICAgICAgIHJlbWFpbmluZ0NoYWluLFxyXG4gICAgICAgIFsnficsICctJywgJ18nXSxcclxuICAgICAgICAxXHJcbiAgICApO1xyXG5cclxuICAgIGlmIChzdGFydEtleUVuZEluZGV4ID09PSAtMSkge1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBpbmRleDogcmVtYWluaW5nQ2hhaW4ubGVuZ3RoLFxyXG4gICAgICAgICAgICBpc0xhc3Q6IHRydWVcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgaW5kZXg6IHN0YXJ0S2V5RW5kSW5kZXgsXHJcbiAgICAgICAgaXNMYXN0OiBudWxsXHJcbiAgICB9O1xyXG59O1xyXG5cclxuY29uc3QgZ2V0T3V0bGluZVR5cGUgPSAocmVtYWluaW5nQ2hhaW46IHN0cmluZyk6IHsgdHlwZTogT3V0bGluZVR5cGUsIGlzTGFzdDogYm9vbGVhbiB9ID0+IHtcclxuXHJcbiAgICBjb25zdCBpZGVudGlmaWVyQ2hhciA9IHJlbWFpbmluZ0NoYWluLnN1YnN0cmluZygwLCAxKTtcclxuICAgIGNvbnN0IG91dGxpbmVUeXBlID0gZ2V0SWRlbnRpZmllckNoYXJhY3RlcihpZGVudGlmaWVyQ2hhcik7XHJcblxyXG4gICAgcmV0dXJuIG91dGxpbmVUeXBlO1xyXG59O1xyXG5cclxuY29uc3QgZ2V0TmV4dFNlZ21lbnROb2RlID0gKHJlbWFpbmluZ0NoYWluOiBzdHJpbmcpOiB7IHNlZ21lbnROb2RlOiBJU2VnbWVudE5vZGUgfCBudWxsLCBlbmRDaGFpbjogc3RyaW5nIH0gPT4ge1xyXG5cclxuICAgIGxldCBzZWdtZW50Tm9kZTogSVNlZ21lbnROb2RlIHwgbnVsbCA9IG51bGw7XHJcbiAgICBsZXQgZW5kQ2hhaW4gPSBcIlwiO1xyXG5cclxuICAgIGlmICghVS5pc051bGxPcldoaXRlU3BhY2UocmVtYWluaW5nQ2hhaW4pKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGxpbmVUeXBlID0gZ2V0T3V0bGluZVR5cGUocmVtYWluaW5nQ2hhaW4pO1xyXG4gICAgICAgIGNvbnN0IGtleUVuZDogeyBpbmRleDogbnVtYmVyLCBpc0xhc3Q6IGJvb2xlYW4gfCBudWxsIH0gPSBnZXRLZXlFbmRJbmRleChyZW1haW5pbmdDaGFpbik7XHJcblxyXG4gICAgICAgIGNvbnN0IGtleSA9IHJlbWFpbmluZ0NoYWluLnN1YnN0cmluZyhcclxuICAgICAgICAgICAgMSxcclxuICAgICAgICAgICAga2V5RW5kLmluZGV4XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc2VnbWVudE5vZGUgPSBuZXcgU2VnbWVudE5vZGUoXHJcbiAgICAgICAgICAgIHJlbWFpbmluZ0NoYWluLnN1YnN0cmluZygwLCBrZXlFbmQuaW5kZXgpLFxyXG4gICAgICAgICAgICBrZXksXHJcbiAgICAgICAgICAgIG91dGxpbmVUeXBlLnR5cGUsXHJcbiAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICBvdXRsaW5lVHlwZS5pc0xhc3RcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoa2V5RW5kLmlzTGFzdCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgc2VnbWVudE5vZGUuaXNMYXN0ID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVuZENoYWluID0gcmVtYWluaW5nQ2hhaW4uc3Vic3RyaW5nKGtleUVuZC5pbmRleCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzZWdtZW50Tm9kZSxcclxuICAgICAgICBlbmRDaGFpblxyXG4gICAgfTtcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkU2VnbWVudCA9IChcclxuICAgIHNlZ21lbnRzOiBBcnJheTxJQ2hhaW5TZWdtZW50PixcclxuICAgIHJlbWFpbmluZ0NoYWluOiBzdHJpbmdcclxuKTogeyByZW1haW5pbmdDaGFpbjogc3RyaW5nLCBzZWdtZW50OiBJQ2hhaW5TZWdtZW50IH0gPT4ge1xyXG5cclxuICAgIGNvbnN0IHNlZ21lbnRTdGFydCA9IGdldE5leHRTZWdtZW50Tm9kZShyZW1haW5pbmdDaGFpbik7XHJcblxyXG4gICAgaWYgKCFzZWdtZW50U3RhcnQuc2VnbWVudE5vZGUpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBzdGFydCBub2RlIHdhcyBudWxsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbWFpbmluZ0NoYWluID0gc2VnbWVudFN0YXJ0LmVuZENoYWluO1xyXG4gICAgY29uc3Qgc2VnbWVudEVuZCA9IGdldE5leHRTZWdtZW50Tm9kZShyZW1haW5pbmdDaGFpbik7XHJcblxyXG4gICAgaWYgKCFzZWdtZW50RW5kLnNlZ21lbnROb2RlKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgZW5kIG5vZGUgd2FzIG51bGxcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc2VnbWVudCA9IG5ldyBDaGFpblNlZ21lbnQoXHJcbiAgICAgICAgc2VnbWVudHMubGVuZ3RoLFxyXG4gICAgICAgIHNlZ21lbnRTdGFydC5zZWdtZW50Tm9kZSxcclxuICAgICAgICBzZWdtZW50RW5kLnNlZ21lbnROb2RlXHJcbiAgICApO1xyXG5cclxuICAgIHNlZ21lbnRzLnB1c2goc2VnbWVudCk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZW1haW5pbmdDaGFpbixcclxuICAgICAgICBzZWdtZW50XHJcbiAgICB9O1xyXG59O1xyXG5cclxuY29uc3QgYnVpbGRSb290U2VnbWVudCA9IChcclxuICAgIHNlZ21lbnRzOiBBcnJheTxJQ2hhaW5TZWdtZW50PixcclxuICAgIHJlbWFpbmluZ0NoYWluOiBzdHJpbmdcclxuKTogeyByZW1haW5pbmdDaGFpbjogc3RyaW5nLCBzZWdtZW50OiBJQ2hhaW5TZWdtZW50IH0gPT4ge1xyXG5cclxuICAgIGNvbnN0IHJvb3RTZWdtZW50U3RhcnQgPSBuZXcgU2VnbWVudE5vZGUoXHJcbiAgICAgICAgXCJndWlkZVJvb3RcIixcclxuICAgICAgICAnJyxcclxuICAgICAgICBPdXRsaW5lVHlwZS5Ob2RlLFxyXG4gICAgICAgIHRydWUsXHJcbiAgICAgICAgZmFsc2VcclxuICAgICk7XHJcblxyXG4gICAgY29uc3Qgcm9vdFNlZ21lbnRFbmQgPSBnZXROZXh0U2VnbWVudE5vZGUocmVtYWluaW5nQ2hhaW4pO1xyXG5cclxuICAgIGlmICghcm9vdFNlZ21lbnRFbmQuc2VnbWVudE5vZGUpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBzdGFydCBub2RlIHdhcyBudWxsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJvb3RTZWdtZW50ID0gbmV3IENoYWluU2VnbWVudChcclxuICAgICAgICBzZWdtZW50cy5sZW5ndGgsXHJcbiAgICAgICAgcm9vdFNlZ21lbnRTdGFydCxcclxuICAgICAgICByb290U2VnbWVudEVuZC5zZWdtZW50Tm9kZVxyXG4gICAgKTtcclxuXHJcbiAgICBzZWdtZW50cy5wdXNoKHJvb3RTZWdtZW50KTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlbWFpbmluZ0NoYWluLFxyXG4gICAgICAgIHNlZ21lbnQ6IHJvb3RTZWdtZW50XHJcbiAgICB9O1xyXG59O1xyXG5cclxuY29uc3QgbG9hZFNlZ21lbnQgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgc2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgIHN0YXJ0T3V0bGluZU5vZGU6IElSZW5kZXJPdXRsaW5lTm9kZSB8IG51bGwgPSBudWxsXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGdTZWdtZW50Q29kZS5sb2FkU2VnbWVudE91dGxpbmVOb2RlcyhcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgIHN0YXJ0T3V0bGluZU5vZGVcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgbmV4dFNlZ21lbnRPdXRsaW5lTm9kZXMgPSBzZWdtZW50Lm91dGxpbmVOb2RlcztcclxuXHJcbiAgICBpZiAobmV4dFNlZ21lbnRPdXRsaW5lTm9kZXMubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICBjb25zdCBmaXJzdE5vZGUgPSBuZXh0U2VnbWVudE91dGxpbmVOb2Rlc1tuZXh0U2VnbWVudE91dGxpbmVOb2Rlcy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgICAgaWYgKGZpcnN0Tm9kZS5pID09PSBzZWdtZW50LnN0YXJ0LmtleSkge1xyXG5cclxuICAgICAgICAgICAgZmlyc3ROb2RlLnR5cGUgPSBzZWdtZW50LnN0YXJ0LnR5cGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBsYXN0Tm9kZSA9IG5leHRTZWdtZW50T3V0bGluZU5vZGVzWzBdO1xyXG5cclxuICAgICAgICBpZiAobGFzdE5vZGUuaSA9PT0gc2VnbWVudC5lbmQua2V5KSB7XHJcblxyXG4gICAgICAgICAgICBsYXN0Tm9kZS50eXBlID0gc2VnbWVudC5lbmQudHlwZTtcclxuICAgICAgICAgICAgbGFzdE5vZGUuaXNMYXN0ID0gc2VnbWVudC5lbmQuaXNMYXN0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnRnJhZ21lbnRDb2RlLmxvYWROZXh0Q2hhaW5GcmFnbWVudChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBzZWdtZW50XHJcbiAgICApO1xyXG59O1xyXG5cclxuY29uc3QgZ1NlZ21lbnRDb2RlID0ge1xyXG5cclxuICAgIHNldE5leHRTZWdtZW50U2VjdGlvbjogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgc2VnbWVudEluZGV4OiBudW1iZXIgfCBudWxsLFxyXG4gICAgICAgIGxpbms6IElEaXNwbGF5Q2hhcnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXNlZ21lbnRJbmRleFxyXG4gICAgICAgICAgICB8fCAhc3RhdGUucmVuZGVyU3RhdGUuaXNDaGFpbkxvYWRcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2VnbWVudCA9IHN0YXRlLnJlbmRlclN0YXRlLnNlZ21lbnRzW3NlZ21lbnRJbmRleCAtIDFdO1xyXG5cclxuICAgICAgICBpZiAoIXNlZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgaXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24gPSBsaW5rO1xyXG4gICAgICAgIGNvbnN0IG5leHRTZWdtZW50ID0gc3RhdGUucmVuZGVyU3RhdGUuc2VnbWVudHNbc2VnbWVudEluZGV4XTtcclxuXHJcbiAgICAgICAgaWYgKG5leHRTZWdtZW50KSB7XHJcblxyXG4gICAgICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50SW5TZWN0aW9uID0gc2VnbWVudC5zZWdtZW50U2VjdGlvbjtcclxuICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudFNlY3Rpb24gPSBsaW5rO1xyXG4gICAgICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbiA9IGxpbms7IC8vIFRoaXMgY291bGQgYmUgc2V0IGFnYWluIHdoZW4gdGhlIGVuZCBub2RlIGlzIHByb2Nlc3NlZFxyXG5cclxuICAgICAgICAgICAgbG9hZFNlZ21lbnQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIG5leHRTZWdtZW50XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkTGlua1NlZ21lbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGxpbmtTZWdtZW50SW5kZXg6IG51bWJlcixcclxuICAgICAgICBsaW5rRnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICBsaW5rOiBJRGlzcGxheUNoYXJ0XHJcbiAgICApOiBJQ2hhaW5TZWdtZW50ID0+IHtcclxuXHJcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBzdGF0ZS5yZW5kZXJTdGF0ZS5zZWdtZW50cztcclxuXHJcbiAgICAgICAgaWYgKGxpbmtTZWdtZW50SW5kZXggPCAxKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luZGV4IDwgMCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY3VycmVudFNlZ21lbnQgPSBzZWdtZW50c1tsaW5rU2VnbWVudEluZGV4IC0gMV07XHJcbiAgICAgICAgY3VycmVudFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24gPSBsaW5rO1xyXG5cclxuICAgICAgICBpZiAobGlua1NlZ21lbnRJbmRleCA+PSBzZWdtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTmV4dCBpbmRleCA+PSBhcnJheSBsZW5ndGgnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG5leHRTZWdtZW50ID0gc2VnbWVudHNbbGlua1NlZ21lbnRJbmRleF07XHJcblxyXG4gICAgICAgIGlmICghbmV4dFNlZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5leHQgbGluayBzZWdtZW50IHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG5leHRTZWdtZW50Lm91dGxpbmVOb2Rlc0xvYWRlZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5leHRTZWdtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbmV4dFNlZ21lbnQub3V0bGluZU5vZGVzTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50SW5TZWN0aW9uID0gY3VycmVudFNlZ21lbnQuc2VnbWVudFNlY3Rpb247XHJcbiAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudFNlY3Rpb24gPSBsaW5rO1xyXG4gICAgICAgIG5leHRTZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uID0gbGluaztcclxuXHJcbiAgICAgICAgaWYgKCFuZXh0U2VnbWVudC5zZWdtZW50SW5TZWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50SW5TZWN0aW9uID0gY3VycmVudFNlZ21lbnQuc2VnbWVudFNlY3Rpb247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIW5leHRTZWdtZW50LnNlZ21lbnRTZWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50U2VjdGlvbiA9IGN1cnJlbnRTZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFuZXh0U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24gPSBjdXJyZW50U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShuZXh0U2VnbWVudC5zZWdtZW50U2VjdGlvbi5vdXRsaW5lPy5yLmkpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZXh0IHNlZ21lbnQgc2VjdGlvbiByb290IGtleSB3YXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGFydE91dGxpbmVOb2RlID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfb3V0bGluZU5vZGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50U2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgIG5leHRTZWdtZW50LnNlZ21lbnRTZWN0aW9uLm91dGxpbmU/LnIuaSBhcyBzdHJpbmdcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBsb2FkU2VnbWVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG5leHRTZWdtZW50LFxyXG4gICAgICAgICAgICBzdGFydE91dGxpbmVOb2RlXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY2hlY2tGb3JMaW5rRXJyb3JzKFxyXG4gICAgICAgICAgICBjdXJyZW50U2VnbWVudCxcclxuICAgICAgICAgICAgbmV4dFNlZ21lbnQsXHJcbiAgICAgICAgICAgIGxpbmtGcmFnbWVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXh0U2VnbWVudDtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZEV4aXRTZWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBzZWdtZW50SW5kZXg6IG51bWJlcixcclxuICAgICAgICBwbHVnSUQ6IHN0cmluZ1xyXG4gICAgKTogSUNoYWluU2VnbWVudCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlZ21lbnRzID0gc3RhdGUucmVuZGVyU3RhdGUuc2VnbWVudHM7XHJcbiAgICAgICAgY29uc3QgY3VycmVudFNlZ21lbnQgPSBzZWdtZW50c1tzZWdtZW50SW5kZXhdO1xyXG4gICAgICAgIGNvbnN0IGV4aXRTZWdtZW50SW5kZXggPSBzZWdtZW50SW5kZXggKyAxO1xyXG5cclxuICAgICAgICBpZiAoZXhpdFNlZ21lbnRJbmRleCA+PSBzZWdtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTmV4dCBpbmRleCA+PSBhcnJheSBsZW5ndGgnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGV4aXRTZWdtZW50ID0gc2VnbWVudHNbZXhpdFNlZ21lbnRJbmRleF07XHJcblxyXG4gICAgICAgIGlmICghZXhpdFNlZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4aXQgbGluayBzZWdtZW50IHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGV4aXRTZWdtZW50Lm91dGxpbmVOb2Rlc0xvYWRlZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGV4aXRTZWdtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2VnbWVudFNlY3Rpb24gPSBjdXJyZW50U2VnbWVudC5zZWdtZW50U2VjdGlvbiBhcyBJRGlzcGxheUNoYXJ0O1xyXG4gICAgICAgIGNvbnN0IGxpbmsgPSBzZWdtZW50U2VjdGlvbi5wYXJlbnQ7XHJcblxyXG4gICAgICAgIGlmICghbGluaykge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTGluayBmcmFnbW50IHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3VycmVudFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24gPSBsaW5rLnNlY3Rpb247XHJcbiAgICAgICAgZXhpdFNlZ21lbnQub3V0bGluZU5vZGVzTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBleGl0U2VnbWVudC5zZWdtZW50SW5TZWN0aW9uID0gY3VycmVudFNlZ21lbnQuc2VnbWVudFNlY3Rpb247XHJcbiAgICAgICAgZXhpdFNlZ21lbnQuc2VnbWVudFNlY3Rpb24gPSBjdXJyZW50U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbjtcclxuICAgICAgICBleGl0U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbiA9IGN1cnJlbnRTZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uO1xyXG5cclxuICAgICAgICBpZiAoIWV4aXRTZWdtZW50LnNlZ21lbnRJblNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgaW4gc2VjdGlvbiB3YXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGV4aXRPdXRsaW5lTm9kZSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX291dGxpbmVOb2RlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgZXhpdFNlZ21lbnQuc2VnbWVudEluU2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgIGV4aXRTZWdtZW50LnN0YXJ0LmtleVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghZXhpdE91dGxpbmVOb2RlKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeGl0T3V0bGluZU5vZGUgd2FzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoVS5pc051bGxPcldoaXRlU3BhY2UoZXhpdE91dGxpbmVOb2RlLl94KSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhpdCBrZXkgd2FzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBwbHVnT3V0bGluZU5vZGUgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9vdXRsaW5lTm9kZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGV4aXRTZWdtZW50LnNlZ21lbnRTZWN0aW9uLmxpbmtJRCxcclxuICAgICAgICAgICAgcGx1Z0lEXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCFwbHVnT3V0bGluZU5vZGUpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBsdWdPdXRsaW5lTm9kZSB3YXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChleGl0T3V0bGluZU5vZGUuX3ggIT09IHBsdWdPdXRsaW5lTm9kZS54KSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbHVnT3V0bGluZU5vZGUgZG9lcyBub3QgbWF0Y2ggZXhpdE91dGxpbmVOb2RlXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9hZFNlZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBleGl0U2VnbWVudCxcclxuICAgICAgICAgICAgcGx1Z091dGxpbmVOb2RlXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGV4aXRTZWdtZW50O1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkTmV4dFNlZ21lbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoc2VnbWVudC5vdXRsaW5lTm9kZXNMb2FkZWQgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VnbWVudC5vdXRsaW5lTm9kZXNMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IG5leHRTZWdtZW50SW5kZXggPSBzZWdtZW50LmluZGV4ICsgMTtcclxuICAgICAgICBjb25zdCBzZWdtZW50cyA9IHN0YXRlLnJlbmRlclN0YXRlLnNlZ21lbnRzO1xyXG5cclxuICAgICAgICBpZiAobmV4dFNlZ21lbnRJbmRleCA+PSBzZWdtZW50cy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTmV4dCBpbmRleCA+PSBhcnJheSBsZW5ndGgnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG5leHRTZWdtZW50ID0gc2VnbWVudHNbbmV4dFNlZ21lbnRJbmRleF07XHJcblxyXG4gICAgICAgIGlmIChuZXh0U2VnbWVudCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCFuZXh0U2VnbWVudC5zZWdtZW50SW5TZWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudEluU2VjdGlvbiA9IHNlZ21lbnQuc2VnbWVudFNlY3Rpb247XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghbmV4dFNlZ21lbnQuc2VnbWVudFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50U2VjdGlvbiA9IHNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb247XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghbmV4dFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbiA9IHNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb247XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxvYWRTZWdtZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBuZXh0U2VnbWVudFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0TmV4dFNlZ21lbnRPdXRsaW5lTm9kZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgc2VnbWVudDogSUNoYWluU2VnbWVudFxyXG4gICAgKTogSVJlbmRlck91dGxpbmVOb2RlIHwgbnVsbCA9PiB7XHJcblxyXG4gICAgICAgIGxldCBvdXRsaW5lTm9kZSA9IHNlZ21lbnQub3V0bGluZU5vZGVzLnBvcCgpID8/IG51bGw7XHJcblxyXG4gICAgICAgIGlmIChvdXRsaW5lTm9kZT8uaXNMYXN0ID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb3V0bGluZU5vZGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2VnbWVudC5vdXRsaW5lTm9kZXMubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBuZXh0U2VnbWVudCA9IHN0YXRlLnJlbmRlclN0YXRlLnNlZ21lbnRzW3NlZ21lbnQuaW5kZXggKyAxXTtcclxuXHJcbiAgICAgICAgICAgIGlmICghbmV4dFNlZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05leHRTZWdtZW50IHdhcyBudWxsJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghbmV4dFNlZ21lbnQuc2VnbWVudEluU2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgICAgIG5leHRTZWdtZW50LnNlZ21lbnRJblNlY3Rpb24gPSBzZWdtZW50LnNlZ21lbnRTZWN0aW9uO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIW5leHRTZWdtZW50LnNlZ21lbnRTZWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudFNlY3Rpb24gPSBzZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIW5leHRTZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24gPSBzZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3V0bGluZU5vZGU7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcnNlU2VnbWVudHM6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHF1ZXJ5U3RyaW5nOiBzdHJpbmdcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAocXVlcnlTdHJpbmcuc3RhcnRzV2l0aCgnPycpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBxdWVyeVN0cmluZyA9IHF1ZXJ5U3RyaW5nLnN1YnN0cmluZygxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChnVXRpbGl0aWVzLmlzTnVsbE9yV2hpdGVTcGFjZShxdWVyeVN0cmluZykgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2VnbWVudHM6IEFycmF5PElDaGFpblNlZ21lbnQ+ID0gW107XHJcbiAgICAgICAgbGV0IHJlbWFpbmluZ0NoYWluID0gcXVlcnlTdHJpbmc7XHJcbiAgICAgICAgbGV0IHJlc3VsdDogeyByZW1haW5pbmdDaGFpbjogc3RyaW5nLCBzZWdtZW50OiBJQ2hhaW5TZWdtZW50IH07XHJcblxyXG4gICAgICAgIHJlc3VsdCA9IGJ1aWxkUm9vdFNlZ21lbnQoXHJcbiAgICAgICAgICAgIHNlZ21lbnRzLFxyXG4gICAgICAgICAgICByZW1haW5pbmdDaGFpblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHdoaWxlICghVS5pc051bGxPcldoaXRlU3BhY2UocmVtYWluaW5nQ2hhaW4pKSB7XHJcblxyXG4gICAgICAgICAgICByZXN1bHQgPSBidWlsZFNlZ21lbnQoXHJcbiAgICAgICAgICAgICAgICBzZWdtZW50cyxcclxuICAgICAgICAgICAgICAgIHJlbWFpbmluZ0NoYWluXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0LnNlZ21lbnQuZW5kLmlzTGFzdCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlbWFpbmluZ0NoYWluID0gcmVzdWx0LnJlbWFpbmluZ0NoYWluO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUuc2VnbWVudHMgPSBzZWdtZW50cztcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZFNlZ21lbnRPdXRsaW5lTm9kZXM6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICAgICAgc3RhcnRPdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlIHwgbnVsbCA9IG51bGxcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXNlZ21lbnQuc2VnbWVudEluU2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBpbiBzZWN0aW9uIHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFzZWdtZW50LnNlZ21lbnRTZWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWdtZW50IHNlY3Rpb24gd2FzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc2VnbWVudE91dGxpbmVOb2RlczogQXJyYXk8SVJlbmRlck91dGxpbmVOb2RlPiA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoIXN0YXJ0T3V0bGluZU5vZGUpIHtcclxuXHJcbiAgICAgICAgICAgIHN0YXJ0T3V0bGluZU5vZGUgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9vdXRsaW5lTm9kZShcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgc2VnbWVudC5zZWdtZW50SW5TZWN0aW9uLmxpbmtJRCxcclxuICAgICAgICAgICAgICAgIHNlZ21lbnQuc3RhcnQua2V5XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXN0YXJ0T3V0bGluZU5vZGUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdGFydCBvdXRsaW5lIG5vZGUgd2FzIG51bGxcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN0YXJ0T3V0bGluZU5vZGUudHlwZSA9IHNlZ21lbnQuc3RhcnQudHlwZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBlbmRPdXRsaW5lTm9kZSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX291dGxpbmVOb2RlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgc2VnbWVudC5zZWdtZW50U2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgIHNlZ21lbnQuZW5kLmtleVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghZW5kT3V0bGluZU5vZGUpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVuZCBvdXRsaW5lIG5vZGUgd2FzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbmRPdXRsaW5lTm9kZS50eXBlID0gc2VnbWVudC5lbmQudHlwZTtcclxuICAgICAgICBsZXQgcGFyZW50OiBJUmVuZGVyT3V0bGluZU5vZGUgfCBudWxsID0gZW5kT3V0bGluZU5vZGU7XHJcbiAgICAgICAgbGV0IGZpcnN0TG9vcCA9IHRydWU7XHJcblxyXG4gICAgICAgIHdoaWxlIChwYXJlbnQpIHtcclxuXHJcbiAgICAgICAgICAgIHNlZ21lbnRPdXRsaW5lTm9kZXMucHVzaChwYXJlbnQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFmaXJzdExvb3BcclxuICAgICAgICAgICAgICAgICYmIHBhcmVudD8uaXNDaGFydCA9PT0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgJiYgcGFyZW50Py5pc1Jvb3QgPT09IHRydWVcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHBhcmVudD8uaSA9PT0gc3RhcnRPdXRsaW5lTm9kZS5pKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZmlyc3RMb29wID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWdtZW50Lm91dGxpbmVOb2RlcyA9IHNlZ21lbnRPdXRsaW5lTm9kZXM7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdTZWdtZW50Q29kZTtcclxuIiwiaW1wb3J0IHsgUGFyc2VUeXBlIH0gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvZW51bXMvUGFyc2VUeXBlXCI7XHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBJU3RhdGVBbnlBcnJheSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVBbnlBcnJheVwiO1xyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IElSZW5kZXJPdXRsaW5lIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZVwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmVDaGFydCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVDaGFydFwiO1xyXG5pbXBvcnQgZ091dGxpbmVDb2RlIGZyb20gXCIuLi9jb2RlL2dPdXRsaW5lQ29kZVwiO1xyXG5pbXBvcnQgZ1NlZ21lbnRDb2RlIGZyb20gXCIuLi9jb2RlL2dTZWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgZ1N0YXRlQ29kZSBmcm9tIFwiLi4vY29kZS9nU3RhdGVDb2RlXCI7XHJcbmltcG9ydCBnRmlsZUNvbnN0YW50cyBmcm9tIFwiLi4vZ0ZpbGVDb25zdGFudHNcIjtcclxuaW1wb3J0IFUgZnJvbSBcIi4uL2dVdGlsaXRpZXNcIjtcclxuaW1wb3J0IGdGcmFnbWVudEFjdGlvbnMgZnJvbSBcIi4vZ0ZyYWdtZW50QWN0aW9uc1wiO1xyXG5cclxuXHJcbmNvbnN0IGdPdXRsaW5lQWN0aW9ucyA9IHtcclxuXHJcbiAgICBsb2FkR3VpZGVPdXRsaW5lUHJvcGVydGllczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgZnJhZ21lbnRGb2xkZXJVcmw6IHN0cmluZ1xyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUubG9hZEd1aWRlT3V0bGluZVByb3BlcnRpZXMoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvdXRsaW5lUmVzcG9uc2UsXHJcbiAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRTZWdtZW50Q2hhcnRPdXRsaW5lUHJvcGVydGllczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgb3V0bGluZTogSVJlbmRlck91dGxpbmUsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgc2VnbWVudEluZGV4OiBudW1iZXJcclxuICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgZ091dGxpbmVDb2RlLmxvYWRTZWdtZW50Q2hhcnRPdXRsaW5lUHJvcGVydGllcyhcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZSxcclxuICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgIHBhcmVudCxcclxuICAgICAgICAgICAgc2VnbWVudEluZGV4XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRDaGFydE91dGxpbmVQcm9wZXJ0aWVzOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvdXRsaW5lUmVzcG9uc2U6IGFueSxcclxuICAgICAgICBvdXRsaW5lOiBJUmVuZGVyT3V0bGluZSxcclxuICAgICAgICBjaGFydDogSVJlbmRlck91dGxpbmVDaGFydCxcclxuICAgICAgICBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgZ091dGxpbmVDb2RlLmxvYWRDaGFydE91dGxpbmVQcm9wZXJ0aWVzKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlLFxyXG4gICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICBjaGFydCxcclxuICAgICAgICAgICAgcGFyZW50XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRQb2RPdXRsaW5lUHJvcGVydGllczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgb3V0bGluZTogSVJlbmRlck91dGxpbmUsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5sb2FkUG9kT3V0bGluZVByb3BlcnRpZXMoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvdXRsaW5lUmVzcG9uc2UsXHJcbiAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZEd1aWRlT3V0bGluZUFuZFNlZ21lbnRzOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvdXRsaW5lUmVzcG9uc2U6IGFueSxcclxuICAgICAgICBwYXRoOiBzdHJpbmdcclxuICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgY29uc3Qgc2VjdGlvbiA9IHN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZTtcclxuXHJcbiAgICAgICAgaWYgKCFzZWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByb290U2VnbWVudCA9IHN0YXRlLnJlbmRlclN0YXRlLnNlZ21lbnRzWzBdO1xyXG5cclxuICAgICAgICBpZiAoIXJvb3RTZWdtZW50KSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBmcmFnbWVudEZvbGRlclVybCA9IHNlY3Rpb24uZ3VpZGUuZnJhZ21lbnRGb2xkZXJVcmw7XHJcblxyXG4gICAgICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudEZvbGRlclVybCkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJvb3RTZWdtZW50LnNlZ21lbnRJblNlY3Rpb24gPSBzZWN0aW9uO1xyXG4gICAgICAgIHJvb3RTZWdtZW50LnNlZ21lbnRTZWN0aW9uID0gc2VjdGlvbjtcclxuICAgICAgICByb290U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbiA9IHNlY3Rpb247XHJcblxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5sb2FkR3VpZGVPdXRsaW5lUHJvcGVydGllcyhcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZSxcclxuICAgICAgICAgICAgcGF0aFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdTZWdtZW50Q29kZS5sb2FkU2VnbWVudE91dGxpbmVOb2RlcyhcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHJvb3RTZWdtZW50XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3QgZmlyc3ROb2RlID0gZ1NlZ21lbnRDb2RlLmdldE5leHRTZWdtZW50T3V0bGluZU5vZGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByb290U2VnbWVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChmaXJzdE5vZGUpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IGAke2ZyYWdtZW50Rm9sZGVyVXJsfS8ke2ZpcnN0Tm9kZS5pfSR7Z0ZpbGVDb25zdGFudHMuZnJhZ21lbnRGaWxlRXh0ZW5zaW9ufWA7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBsb2FkRGVsZWdhdGUgPSAoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnlcclxuICAgICAgICAgICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBnRnJhZ21lbnRBY3Rpb25zLmxvYWRDaGFpbkZyYWdtZW50KFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZSxcclxuICAgICAgICAgICAgICAgICAgICByb290U2VnbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBmaXJzdE5vZGVcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBnU3RhdGVDb2RlLkFkZFJlTG9hZERhdGFFZmZlY3RJbW1lZGlhdGUoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIGBsb2FkQ2hhaW5GcmFnbWVudGAsXHJcbiAgICAgICAgICAgICAgICBQYXJzZVR5cGUuSnNvbixcclxuICAgICAgICAgICAgICAgIHVybCxcclxuICAgICAgICAgICAgICAgIGxvYWREZWxlZ2F0ZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZ1NlZ21lbnRDb2RlLmxvYWROZXh0U2VnbWVudChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgcm9vdFNlZ21lbnQsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdPdXRsaW5lQWN0aW9ucztcclxuIiwiaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IElSZW5kZXJPdXRsaW5lIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZVwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmVDaGFydCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVDaGFydFwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmVOb2RlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZU5vZGVcIjtcclxuaW1wb3J0IFJlbmRlck91dGxpbmUgZnJvbSBcIi4uLy4uL3N0YXRlL3JlbmRlci9SZW5kZXJPdXRsaW5lXCI7XHJcbmltcG9ydCBSZW5kZXJPdXRsaW5lQ2hhcnQgZnJvbSBcIi4uLy4uL3N0YXRlL3JlbmRlci9SZW5kZXJPdXRsaW5lQ2hhcnRcIjtcclxuaW1wb3J0IFJlbmRlck91dGxpbmVOb2RlIGZyb20gXCIuLi8uLi9zdGF0ZS9yZW5kZXIvUmVuZGVyT3V0bGluZU5vZGVcIjtcclxuaW1wb3J0IGdGcmFnbWVudENvZGUgZnJvbSBcIi4vZ0ZyYWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgZ1N0YXRlQ29kZSBmcm9tIFwiLi9nU3RhdGVDb2RlXCI7XHJcbmltcG9ydCBnUmVuZGVyQ29kZSBmcm9tIFwiLi9nUmVuZGVyQ29kZVwiO1xyXG5pbXBvcnQgZ0ZpbGVDb25zdGFudHMgZnJvbSBcIi4uL2dGaWxlQ29uc3RhbnRzXCI7XHJcbmltcG9ydCBJU3RhdGVBbnlBcnJheSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVBbnlBcnJheVwiO1xyXG5pbXBvcnQgVSBmcm9tIFwiLi4vZ1V0aWxpdGllc1wiO1xyXG5pbXBvcnQgZ0ZyYWdtZW50QWN0aW9ucyBmcm9tIFwiLi4vYWN0aW9ucy9nRnJhZ21lbnRBY3Rpb25zXCI7XHJcbmltcG9ydCB7IFBhcnNlVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL1BhcnNlVHlwZVwiO1xyXG5pbXBvcnQgRGlzcGxheUNoYXJ0IGZyb20gXCIuLi8uLi9zdGF0ZS9kaXNwbGF5L0Rpc3BsYXlDaGFydFwiO1xyXG5pbXBvcnQgSURpc3BsYXlTZWN0aW9uIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2Rpc3BsYXkvSURpc3BsYXlTZWN0aW9uXCI7XHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgZ091dGxpbmVBY3Rpb25zIGZyb20gXCIuLi9hY3Rpb25zL2dPdXRsaW5lQWN0aW9uc1wiO1xyXG5pbXBvcnQgeyBPdXRsaW5lVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL091dGxpbmVUeXBlXCI7XHJcbmltcG9ydCBnU2VnbWVudENvZGUgZnJvbSBcIi4vZ1NlZ21lbnRDb2RlXCI7XHJcbmltcG9ydCBJRGlzcGxheUNoYXJ0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2Rpc3BsYXkvSURpc3BsYXlDaGFydFwiO1xyXG5cclxuXHJcbmNvbnN0IGNhY2hlTm9kZUZvck5ld0xpbmsgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgb3V0bGluZU5vZGU6IElSZW5kZXJPdXRsaW5lTm9kZSxcclxuICAgIGxpbmtJRDogbnVtYmVyLFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBnU3RhdGVDb2RlLmNhY2hlX291dGxpbmVOb2RlKFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIGxpbmtJRCxcclxuICAgICAgICBvdXRsaW5lTm9kZVxyXG4gICAgKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBvdXRsaW5lTm9kZS5vKSB7XHJcblxyXG4gICAgICAgIGNhY2hlTm9kZUZvck5ld0xpbmsoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb24sXHJcbiAgICAgICAgICAgIGxpbmtJRFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5jb25zdCBjYWNoZU5vZGVGb3JOZXdQb2QgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgb3V0bGluZU5vZGU6IElSZW5kZXJPdXRsaW5lTm9kZSxcclxuICAgIGxpbmtJRDogbnVtYmVyLFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBnU3RhdGVDb2RlLmNhY2hlX291dGxpbmVOb2RlKFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIGxpbmtJRCxcclxuICAgICAgICBvdXRsaW5lTm9kZVxyXG4gICAgKTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBvdXRsaW5lTm9kZS5vKSB7XHJcblxyXG4gICAgICAgIGNhY2hlTm9kZUZvck5ld1BvZChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG9wdGlvbixcclxuICAgICAgICAgICAgbGlua0lEXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IGxvYWROb2RlID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIHJhd05vZGU6IGFueSxcclxuICAgIGxpbmtJRDogbnVtYmVyLFxyXG4gICAgcGFyZW50OiBJUmVuZGVyT3V0bGluZU5vZGUgfCBudWxsID0gbnVsbFxyXG4pOiBJUmVuZGVyT3V0bGluZU5vZGUgPT4ge1xyXG5cclxuICAgIGNvbnN0IG5vZGUgPSBuZXcgUmVuZGVyT3V0bGluZU5vZGUoKTtcclxuICAgIG5vZGUuaSA9IHJhd05vZGUuaTtcclxuICAgIG5vZGUuYyA9IHJhd05vZGUuYyA/PyBudWxsO1xyXG4gICAgbm9kZS5kID0gcmF3Tm9kZS5kID8/IG51bGw7XHJcbiAgICBub2RlLl94ID0gcmF3Tm9kZS5feCA/PyBudWxsO1xyXG4gICAgbm9kZS54ID0gcmF3Tm9kZS54ID8/IG51bGw7XHJcbiAgICBub2RlLnBhcmVudCA9IHBhcmVudDtcclxuICAgIG5vZGUudHlwZSA9IE91dGxpbmVUeXBlLk5vZGU7XHJcblxyXG4gICAgZ1N0YXRlQ29kZS5jYWNoZV9vdXRsaW5lTm9kZShcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBsaW5rSUQsXHJcbiAgICAgICAgbm9kZVxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAobm9kZS5jKSB7XHJcblxyXG4gICAgICAgIG5vZGUudHlwZSA9IE91dGxpbmVUeXBlLkxpbms7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJhd05vZGUub1xyXG4gICAgICAgICYmIEFycmF5LmlzQXJyYXkocmF3Tm9kZS5vKSA9PT0gdHJ1ZVxyXG4gICAgICAgICYmIHJhd05vZGUuby5sZW5ndGggPiAwXHJcbiAgICApIHtcclxuICAgICAgICBsZXQgbzogSVJlbmRlck91dGxpbmVOb2RlO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiByYXdOb2RlLm8pIHtcclxuXHJcbiAgICAgICAgICAgIG8gPSBsb2FkTm9kZShcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgbGlua0lELFxyXG4gICAgICAgICAgICAgICAgbm9kZVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgbm9kZS5vLnB1c2gobyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBub2RlO1xyXG59O1xyXG5cclxuY29uc3QgbG9hZENoYXJ0cyA9IChcclxuICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgcmF3T3V0bGluZUNoYXJ0czogQXJyYXk8YW55PlxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBvdXRsaW5lLmMgPSBbXTtcclxuICAgIGxldCBjOiBJUmVuZGVyT3V0bGluZUNoYXJ0O1xyXG5cclxuICAgIGZvciAoY29uc3QgY2hhcnQgb2YgcmF3T3V0bGluZUNoYXJ0cykge1xyXG5cclxuICAgICAgICBjID0gbmV3IFJlbmRlck91dGxpbmVDaGFydCgpO1xyXG4gICAgICAgIGMuaSA9IGNoYXJ0Lmk7XHJcbiAgICAgICAgYy5iID0gY2hhcnQuYjtcclxuICAgICAgICBjLnAgPSBjaGFydC5wO1xyXG4gICAgICAgIG91dGxpbmUuYy5wdXNoKGMpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgZ091dGxpbmVDb2RlID0ge1xyXG5cclxuICAgIHJlZ2lzdGVyT3V0bGluZVVybERvd25sb2FkOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICB1cmw6IHN0cmluZ1xyXG4gICAgKTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZS5yZW5kZXJTdGF0ZS5vdXRsaW5lVXJsc1t1cmxdID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLm91dGxpbmVVcmxzW3VybF0gPSB0cnVlO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRHdWlkZU91dGxpbmVQcm9wZXJ0aWVzOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvdXRsaW5lUmVzcG9uc2U6IGFueSxcclxuICAgICAgICBmcmFnbWVudEZvbGRlclVybDogc3RyaW5nXHJcbiAgICApOiBJUmVuZGVyT3V0bGluZSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUucmVuZGVyU3RhdGUuZGlzcGxheUd1aWRlKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Rpc3BsYXlHdWlkZSB3YXMgbnVsbC4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGd1aWRlID0gc3RhdGUucmVuZGVyU3RhdGUuZGlzcGxheUd1aWRlO1xyXG4gICAgICAgIGNvbnN0IHJhd091dGxpbmUgPSBvdXRsaW5lUmVzcG9uc2UuanNvbkRhdGE7XHJcblxyXG4gICAgICAgIGNvbnN0IGd1aWRlT3V0bGluZSA9IGdPdXRsaW5lQ29kZS5nZXRHdWlkZU91dGxpbmUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBmcmFnbWVudEZvbGRlclVybFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5sb2FkT3V0bGluZVByb3BlcnRpZXMoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByYXdPdXRsaW5lLFxyXG4gICAgICAgICAgICBndWlkZU91dGxpbmUsXHJcbiAgICAgICAgICAgIGd1aWRlLmxpbmtJRFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGd1aWRlLm91dGxpbmUgPSBndWlkZU91dGxpbmU7XHJcbiAgICAgICAgZ3VpZGVPdXRsaW5lLnIuaXNDaGFydCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoc3RhdGUucmVuZGVyU3RhdGUuaXNDaGFpbkxvYWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNlZ21lbnRzID0gc3RhdGUucmVuZGVyU3RhdGUuc2VnbWVudHM7XHJcblxyXG4gICAgICAgICAgICBpZiAoc2VnbWVudHMubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RTZWdtZW50ID0gc2VnbWVudHNbMF07XHJcbiAgICAgICAgICAgICAgICByb290U2VnbWVudC5zdGFydC5rZXkgPSBndWlkZU91dGxpbmUuci5pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNhY2hlU2VjdGlvblJvb3QoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBndWlkZVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChndWlkZU91dGxpbmUuci5jICE9IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gTG9hZCBvdXRsaW5lIGZyb20gdGhhdCBsb2NhdGlvbiBhbmQgbG9hZCByb290XHJcblxyXG4gICAgICAgICAgICBjb25zdCBvdXRsaW5lQ2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQgfCBudWxsID0gZ091dGxpbmVDb2RlLmdldE91dGxpbmVDaGFydChcclxuICAgICAgICAgICAgICAgIGd1aWRlT3V0bGluZSxcclxuICAgICAgICAgICAgICAgIGd1aWRlT3V0bGluZS5yLmNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGd1aWRlUm9vdCA9IGd1aWRlLnJvb3Q7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWd1aWRlUm9vdCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGN1cnJlbnQgZnJhZ21lbnQgd2FzIG51bGwnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ091dGxpbmVDb2RlLmdldE91dGxpbmVGcm9tQ2hhcnRfc3Vic2NyaXB0aW9uKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBvdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgICAgICAgICBndWlkZVJvb3RcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoZ3VpZGUucm9vdCkge1xyXG5cclxuICAgICAgICAgICAgZ0ZyYWdtZW50Q29kZS5leHBhbmRPcHRpb25Qb2RzKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBndWlkZS5yb290XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBnRnJhZ21lbnRDb2RlLmF1dG9FeHBhbmRTaW5nbGVCbGFua09wdGlvbihcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgZ3VpZGUucm9vdFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGd1aWRlT3V0bGluZTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3V0bGluZUNoYXJ0OiAoXHJcbiAgICAgICAgb3V0bGluZTogSVJlbmRlck91dGxpbmUsXHJcbiAgICAgICAgaW5kZXg6IG51bWJlclxyXG4gICAgKTogSVJlbmRlck91dGxpbmVDaGFydCB8IG51bGwgPT4ge1xyXG5cclxuICAgICAgICBpZiAob3V0bGluZS5jLmxlbmd0aCA+IGluZGV4KSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gb3V0bGluZS5jW2luZGV4XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICBidWlsZERpc3BsYXlDaGFydEZyb21SYXdPdXRsaW5lOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBjaGFydDogSVJlbmRlck91dGxpbmVDaGFydCxcclxuICAgICAgICByYXdPdXRsaW5lOiBhbnksXHJcbiAgICAgICAgb3V0bGluZTogSVJlbmRlck91dGxpbmUsXHJcbiAgICAgICAgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICApOiBJRGlzcGxheUNoYXJ0ID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgbGluayA9IG5ldyBEaXNwbGF5Q2hhcnQoXHJcbiAgICAgICAgICAgIGdTdGF0ZUNvZGUuZ2V0RnJlc2hLZXlJbnQoc3RhdGUpLFxyXG4gICAgICAgICAgICBjaGFydFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5sb2FkT3V0bGluZVByb3BlcnRpZXMoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByYXdPdXRsaW5lLFxyXG4gICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICBsaW5rLmxpbmtJRFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGxpbmsub3V0bGluZSA9IG91dGxpbmU7XHJcbiAgICAgICAgbGluay5wYXJlbnQgPSBwYXJlbnQ7XHJcbiAgICAgICAgcGFyZW50LmxpbmsgPSBsaW5rO1xyXG5cclxuICAgICAgICByZXR1cm4gbGluaztcclxuICAgIH0sXHJcblxyXG4gICAgYnVpbGRQb2REaXNwbGF5Q2hhcnRGcm9tUmF3T3V0bGluZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgcmF3T3V0bGluZTogYW55LFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIHBhcmVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgKTogSURpc3BsYXlDaGFydCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHBvZCA9IG5ldyBEaXNwbGF5Q2hhcnQoXHJcbiAgICAgICAgICAgIGdTdGF0ZUNvZGUuZ2V0RnJlc2hLZXlJbnQoc3RhdGUpLFxyXG4gICAgICAgICAgICBjaGFydFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5sb2FkT3V0bGluZVByb3BlcnRpZXMoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByYXdPdXRsaW5lLFxyXG4gICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICBwb2QubGlua0lEXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcG9kLm91dGxpbmUgPSBvdXRsaW5lO1xyXG4gICAgICAgIHBvZC5wYXJlbnQgPSBwYXJlbnQ7XHJcbiAgICAgICAgcGFyZW50LnBvZCA9IHBvZDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHBvZDtcclxuICAgIH0sXHJcblxyXG4gICAgYnVpbGREaXNwbGF5Q2hhcnRGcm9tT3V0bGluZUZvck5ld0xpbms6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0LFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIHBhcmVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgKTogSURpc3BsYXlDaGFydCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGxpbmsgPSBuZXcgRGlzcGxheUNoYXJ0KFxyXG4gICAgICAgICAgICBnU3RhdGVDb2RlLmdldEZyZXNoS2V5SW50KHN0YXRlKSxcclxuICAgICAgICAgICAgY2hhcnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUubG9hZE91dGxpbmVQcm9wZXJ0aWVzRm9yTmV3TGluayhcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgIGxpbmsubGlua0lEXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbGluay5vdXRsaW5lID0gb3V0bGluZTtcclxuICAgICAgICBsaW5rLnBhcmVudCA9IHBhcmVudDtcclxuICAgICAgICBwYXJlbnQubGluayA9IGxpbms7XHJcblxyXG4gICAgICAgIHJldHVybiBsaW5rO1xyXG4gICAgfSxcclxuXHJcbiAgICBidWlsZERpc3BsYXlDaGFydEZyb21PdXRsaW5lRm9yTmV3UG9kOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBjaGFydDogSVJlbmRlck91dGxpbmVDaGFydCxcclxuICAgICAgICBvdXRsaW5lOiBJUmVuZGVyT3V0bGluZSxcclxuICAgICAgICBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICk6IElEaXNwbGF5Q2hhcnQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBwb2QgPSBuZXcgRGlzcGxheUNoYXJ0KFxyXG4gICAgICAgICAgICBnU3RhdGVDb2RlLmdldEZyZXNoS2V5SW50KHN0YXRlKSxcclxuICAgICAgICAgICAgY2hhcnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUubG9hZE91dGxpbmVQcm9wZXJ0aWVzRm9yTmV3UG9kKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgcG9kLmxpbmtJRFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHBvZC5vdXRsaW5lID0gb3V0bGluZTtcclxuICAgICAgICBwb2QucGFyZW50ID0gcGFyZW50O1xyXG4gICAgICAgIHBhcmVudC5wb2QgPSBwb2Q7XHJcblxyXG4gICAgICAgIHJldHVybiBwb2Q7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRTZWdtZW50Q2hhcnRPdXRsaW5lUHJvcGVydGllczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgb3V0bGluZTogSVJlbmRlck91dGxpbmUsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgc2VnbWVudEluZGV4OiBudW1iZXJcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAocGFyZW50LmxpbmspIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTGluayBhbHJlYWR5IGxvYWRlZCwgcm9vdElEOiAke3BhcmVudC5saW5rLnJvb3Q/LmlkfWApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmF3T3V0bGluZSA9IG91dGxpbmVSZXNwb25zZS5qc29uRGF0YTtcclxuXHJcbiAgICAgICAgY29uc3QgbGluayA9IGdPdXRsaW5lQ29kZS5idWlsZERpc3BsYXlDaGFydEZyb21SYXdPdXRsaW5lKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgIHJhd091dGxpbmUsXHJcbiAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgIHBhcmVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdTZWdtZW50Q29kZS5sb2FkTGlua1NlZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBzZWdtZW50SW5kZXgsXHJcbiAgICAgICAgICAgIHBhcmVudCxcclxuICAgICAgICAgICAgbGlua1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5zZXRDaGFydEFzQ3VycmVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGxpbmtcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNhY2hlU2VjdGlvblJvb3QoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBsaW5rXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZENoYXJ0T3V0bGluZVByb3BlcnRpZXM6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55LFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0LFxyXG4gICAgICAgIHBhcmVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmIChwYXJlbnQubGluaykge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBMaW5rIGFscmVhZHkgbG9hZGVkLCByb290SUQ6ICR7cGFyZW50Lmxpbmsucm9vdD8uaWR9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByYXdPdXRsaW5lID0gb3V0bGluZVJlc3BvbnNlLmpzb25EYXRhO1xyXG5cclxuICAgICAgICBjb25zdCBsaW5rID0gZ091dGxpbmVDb2RlLmJ1aWxkRGlzcGxheUNoYXJ0RnJvbVJhd091dGxpbmUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBjaGFydCxcclxuICAgICAgICAgICAgcmF3T3V0bGluZSxcclxuICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgcGFyZW50XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jYWNoZVNlY3Rpb25Sb290KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgbGlua1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIE5lZWQgdG8gYnVpbGQgYSBkaXNwbGF5Q0hhcnQgaGVyZVxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5zZXRDaGFydEFzQ3VycmVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGxpbmtcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUucG9zdEdldENoYXJ0T3V0bGluZVJvb3Rfc3Vic2NyaXB0aW9uKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgbGlua1xyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRQb2RPdXRsaW5lUHJvcGVydGllczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgb3V0bGluZTogSVJlbmRlck91dGxpbmUsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbi5wb2QpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTGluayBhbHJlYWR5IGxvYWRlZCwgcm9vdElEOiAke29wdGlvbi5wb2Qucm9vdD8uaWR9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByYXdPdXRsaW5lID0gb3V0bGluZVJlc3BvbnNlLmpzb25EYXRhO1xyXG5cclxuICAgICAgICBjb25zdCBwb2QgPSBnT3V0bGluZUNvZGUuYnVpbGRQb2REaXNwbGF5Q2hhcnRGcm9tUmF3T3V0bGluZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICByYXdPdXRsaW5lLFxyXG4gICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNhY2hlU2VjdGlvblJvb3QoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBwb2RcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyAvLyBOZWVkIHRvIGJ1aWxkIGEgZGlzcGxheUNIYXJ0IGhlcmVcclxuICAgICAgICAvLyBnT3V0bGluZUNvZGUuc2V0Q2hhcnRBc0N1cnJlbnQoXHJcbiAgICAgICAgLy8gICAgIHN0YXRlLFxyXG4gICAgICAgIC8vICAgICBsaW5rXHJcbiAgICAgICAgLy8gKTtcclxuXHJcbiAgICAgICAgZ091dGxpbmVDb2RlLnBvc3RHZXRQb2RPdXRsaW5lUm9vdF9zdWJzY3JpcHRpb24oXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBwb2RcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBwb3N0R2V0Q2hhcnRPdXRsaW5lUm9vdF9zdWJzY3JpcHRpb246IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHNlY3Rpb246IElEaXNwbGF5U2VjdGlvblxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmIChzZWN0aW9uLnJvb3QpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmICghc2VjdGlvbi5yb290LnVpLmRpc2N1c3Npb25Mb2FkZWQpIHtcclxuXHJcbiAgICAgICAgICAgIC8vICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlY3Rpb24gcm9vdCBkaXNjdXNzaW9uIHdhcyBub3QgbG9hZGVkJyk7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGxpbmUgPSBzZWN0aW9uLm91dGxpbmU7XHJcblxyXG4gICAgICAgIGlmICghb3V0bGluZSkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZWN0aW9uIG91dGxpbmUgd2FzIG51bGwnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJvb3RGcmFnbWVuSUQgPSBvdXRsaW5lLnIuaTtcclxuICAgICAgICBjb25zdCBwYXRoID0gb3V0bGluZS5wYXRoO1xyXG4gICAgICAgIGNvbnN0IHVybDogc3RyaW5nID0gYCR7cGF0aH0vJHtyb290RnJhZ21lbklEfSR7Z0ZpbGVDb25zdGFudHMuZnJhZ21lbnRGaWxlRXh0ZW5zaW9ufWA7XHJcblxyXG4gICAgICAgIGNvbnN0IGxvYWRBY3Rpb24gPSAoc3RhdGU6IElTdGF0ZSwgcmVzcG9uc2U6IGFueSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdGcmFnbWVudEFjdGlvbnMubG9hZFJvb3RGcmFnbWVudEFuZFNldFNlbGVjdGVkKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgICAgIHNlY3Rpb25cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBnU3RhdGVDb2RlLkFkZFJlTG9hZERhdGFFZmZlY3RJbW1lZGlhdGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBgbG9hZENoYXJ0T3V0bGluZVJvb3RgLFxyXG4gICAgICAgICAgICBQYXJzZVR5cGUuVGV4dCxcclxuICAgICAgICAgICAgdXJsLFxyXG4gICAgICAgICAgICBsb2FkQWN0aW9uXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgcG9zdEdldFBvZE91dGxpbmVSb290X3N1YnNjcmlwdGlvbjogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgc2VjdGlvbjogSURpc3BsYXlTZWN0aW9uXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKHNlY3Rpb24ucm9vdCkge1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgKCFzZWN0aW9uLnJvb3QudWkuZGlzY3Vzc2lvbkxvYWRlZCkge1xyXG5cclxuICAgICAgICAgICAgLy8gICAgIHRocm93IG5ldyBFcnJvcignU2VjdGlvbiByb290IGRpc2N1c3Npb24gd2FzIG5vdCBsb2FkZWQnKTtcclxuICAgICAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgb3V0bGluZSA9IHNlY3Rpb24ub3V0bGluZTtcclxuXHJcbiAgICAgICAgaWYgKCFvdXRsaW5lKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlY3Rpb24gb3V0bGluZSB3YXMgbnVsbCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgcm9vdEZyYWdtZW5JRCA9IG91dGxpbmUuci5pO1xyXG4gICAgICAgIGNvbnN0IHBhdGggPSBvdXRsaW5lLnBhdGg7XHJcbiAgICAgICAgY29uc3QgdXJsOiBzdHJpbmcgPSBgJHtwYXRofS8ke3Jvb3RGcmFnbWVuSUR9JHtnRmlsZUNvbnN0YW50cy5mcmFnbWVudEZpbGVFeHRlbnNpb259YDtcclxuXHJcbiAgICAgICAgY29uc3QgbG9hZEFjdGlvbiA9IChzdGF0ZTogSVN0YXRlLCByZXNwb25zZTogYW55KSA9PiB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ0ZyYWdtZW50QWN0aW9ucy5sb2FkUG9kUm9vdEZyYWdtZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgICAgIHNlY3Rpb25cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBnU3RhdGVDb2RlLkFkZFJlTG9hZERhdGFFZmZlY3RJbW1lZGlhdGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBgbG9hZENoYXJ0T3V0bGluZVJvb3RgLFxyXG4gICAgICAgICAgICBQYXJzZVR5cGUuVGV4dCxcclxuICAgICAgICAgICAgdXJsLFxyXG4gICAgICAgICAgICBsb2FkQWN0aW9uXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0Q2hhcnRBc0N1cnJlbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGRpc3BsYXlTZWN0aW9uOiBJRGlzcGxheVNlY3Rpb25cclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5jdXJyZW50U2VjdGlvbiA9IGRpc3BsYXlTZWN0aW9uO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRHdWlkZU91dGxpbmU6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsOiBzdHJpbmdcclxuICAgICk6IElSZW5kZXJPdXRsaW5lID0+IHtcclxuXHJcbiAgICAgICAgbGV0IG91dGxpbmU6IElSZW5kZXJPdXRsaW5lID0gc3RhdGUucmVuZGVyU3RhdGUub3V0bGluZXNbZnJhZ21lbnRGb2xkZXJVcmxdO1xyXG5cclxuICAgICAgICBpZiAob3V0bGluZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG91dGxpbmU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvdXRsaW5lID0gbmV3IFJlbmRlck91dGxpbmUoXHJcbiAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsLFxyXG4gICAgICAgICAgICBkb2N1bWVudC5iYXNlVVJJXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUub3V0bGluZXNbZnJhZ21lbnRGb2xkZXJVcmxdID0gb3V0bGluZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGxpbmU7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE91dGxpbmU6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsOiBzdHJpbmcsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgbGlua0ZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IElSZW5kZXJPdXRsaW5lID0+IHtcclxuXHJcbiAgICAgICAgbGV0IG91dGxpbmU6IElSZW5kZXJPdXRsaW5lID0gc3RhdGUucmVuZGVyU3RhdGUub3V0bGluZXNbZnJhZ21lbnRGb2xkZXJVcmxdO1xyXG5cclxuICAgICAgICBpZiAob3V0bGluZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG91dGxpbmU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYmFzZVVSSTogc3RyaW5nIHwgbnVsbCA9IGNoYXJ0LmI7XHJcblxyXG4gICAgICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShiYXNlVVJJKSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgYmFzZVVSSSA9IGxpbmtGcmFnbWVudC5zZWN0aW9uLm91dGxpbmU/LmJhc2VVUkkgPz8gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghYmFzZVVSSSkge1xyXG5cclxuICAgICAgICAgICAgYmFzZVVSSSA9IGRvY3VtZW50LmJhc2VVUkk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvdXRsaW5lID0gbmV3IFJlbmRlck91dGxpbmUoXHJcbiAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsLFxyXG4gICAgICAgICAgICBiYXNlVVJJIVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLm91dGxpbmVzW2ZyYWdtZW50Rm9sZGVyVXJsXSA9IG91dGxpbmU7XHJcblxyXG4gICAgICAgIHJldHVybiBvdXRsaW5lO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBnZXRGcmFnbWVudExpbmtDaGFydE91dGxpbmU6IChcclxuICAgIC8vICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgLy8gICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuICAgIC8vICk6IHZvaWQgPT4ge1xyXG5cclxuICAgIC8vICAgICBjb25zdCBvdXRsaW5lID0gZnJhZ21lbnQuc2VjdGlvbi5vdXRsaW5lO1xyXG5cclxuICAgIC8vICAgICBpZiAoIW91dGxpbmUpIHtcclxuICAgIC8vICAgICAgICAgcmV0dXJuO1xyXG4gICAgLy8gICAgIH1cclxuXHJcbiAgICAvLyAgICAgY29uc3Qgb3V0bGluZU5vZGUgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9vdXRsaW5lTm9kZShcclxuICAgIC8vICAgICAgICAgc3RhdGUsXHJcbiAgICAvLyAgICAgICAgIGZyYWdtZW50LnNlY3Rpb24ubGlua0lELFxyXG4gICAgLy8gICAgICAgICBmcmFnbWVudC5pZFxyXG4gICAgLy8gICAgICk7XHJcblxyXG4gICAgLy8gICAgIGlmIChvdXRsaW5lTm9kZT8uYyA9PSBudWxsKSB7XHJcbiAgICAvLyAgICAgICAgIHJldHVybjtcclxuICAgIC8vICAgICB9XHJcblxyXG4gICAgLy8gICAgIGNvbnN0IG91dGxpbmVDaGFydCA9IGdPdXRsaW5lQ29kZS5nZXRPdXRsaW5lQ2hhcnQoXHJcbiAgICAvLyAgICAgICAgIG91dGxpbmUsXHJcbiAgICAvLyAgICAgICAgIG91dGxpbmVOb2RlPy5jXHJcbiAgICAvLyAgICAgKTtcclxuXHJcbiAgICAvLyAgICAgZ091dGxpbmVDb2RlLmdldE91dGxpbmVGcm9tQ2hhcnRfc3Vic2NyaXB0aW9uKFxyXG4gICAgLy8gICAgICAgICBzdGF0ZSxcclxuICAgIC8vICAgICAgICAgb3V0bGluZUNoYXJ0LFxyXG4gICAgLy8gICAgICAgICBmcmFnbWVudFxyXG4gICAgLy8gICAgICk7XHJcbiAgICAvLyB9LFxyXG5cclxuICAgIGdldExpbmtPdXRsaW5lX3N1YnNjcmlwaW9uOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudCxcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBvdXRsaW5lID0gb3B0aW9uLnNlY3Rpb24ub3V0bGluZTtcclxuXHJcbiAgICAgICAgaWYgKCFvdXRsaW5lKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGxpbmVOb2RlID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfb3V0bGluZU5vZGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb24uc2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgIG9wdGlvbi5pZFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChvdXRsaW5lTm9kZT8uYyA9PSBudWxsXHJcbiAgICAgICAgICAgIHx8IHN0YXRlLnJlbmRlclN0YXRlLmlzQ2hhaW5Mb2FkID09PSB0cnVlIC8vIFdpbGwgbG9hZCBpdCBmcm9tIGEgc2VnbWVudFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBvdXRsaW5lQ2hhcnQgPSBnT3V0bGluZUNvZGUuZ2V0T3V0bGluZUNoYXJ0KFxyXG4gICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICBvdXRsaW5lTm9kZT8uY1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5nZXRPdXRsaW5lRnJvbUNoYXJ0X3N1YnNjcmlwdGlvbihcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG91dGxpbmVDaGFydCxcclxuICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9kT3V0bGluZV9zdWJzY3JpcGlvbjogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgc2VjdGlvbjogSURpc3BsYXlTZWN0aW9uLFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShvcHRpb24ucG9kS2V5KSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBvdXRsaW5lID0gc2VjdGlvbi5vdXRsaW5lO1xyXG5cclxuICAgICAgICBpZiAoIW91dGxpbmUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgb3V0bGluZU5vZGUgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9vdXRsaW5lTm9kZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG9wdGlvbi5zZWN0aW9uLmxpbmtJRCxcclxuICAgICAgICAgICAgb3B0aW9uLmlkXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKG91dGxpbmVOb2RlPy5kID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgb3V0bGluZUNoYXJ0ID0gZ091dGxpbmVDb2RlLmdldE91dGxpbmVDaGFydChcclxuICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgb3V0bGluZU5vZGU/LmRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUuZ2V0T3V0bGluZUZyb21Qb2Rfc3Vic2NyaXB0aW9uKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3V0bGluZUNoYXJ0LFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRTZWdtZW50T3V0bGluZV9zdWJzY3JpcHRpb246IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0IHwgbnVsbCxcclxuICAgICAgICBsaW5rRnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICBzZWdtZW50SW5kZXg6IG51bWJlclxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghY2hhcnQpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT3V0bGluZUNoYXJ0IHdhcyBudWxsJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobGlua0ZyYWdtZW50Lmxpbms/LnJvb3QpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBMaW5rIHJvb3QgYWxyZWFkeSBsb2FkZWQ6ICR7bGlua0ZyYWdtZW50Lmxpbmsucm9vdD8uaWR9YCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbmV4dFNlZ21lbnRJbmRleCA9IHNlZ21lbnRJbmRleDtcclxuXHJcbiAgICAgICAgaWYgKG5leHRTZWdtZW50SW5kZXggIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgbmV4dFNlZ21lbnRJbmRleCsrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZnJhZ21lbnRGb2xkZXJVcmwgPSBnUmVuZGVyQ29kZS5nZXRGcmFnbWVudEZvbGRlclVybChcclxuICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgIGxpbmtGcmFnbWVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnRGb2xkZXJVcmwpKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBvdXRsaW5lID0gZ091dGxpbmVDb2RlLmdldE91dGxpbmUoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsLFxyXG4gICAgICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgICAgICBsaW5rRnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvdXRsaW5lLmxvYWRlZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghbGlua0ZyYWdtZW50LmxpbmspIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGluayA9IGdPdXRsaW5lQ29kZS5idWlsZERpc3BsYXlDaGFydEZyb21PdXRsaW5lRm9yTmV3TGluayhcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5rRnJhZ21lbnRcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBnU2VnbWVudENvZGUuc2V0TmV4dFNlZ21lbnRTZWN0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFNlZ21lbnRJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGlua1xyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZ091dGxpbmVDb2RlLnNldENoYXJ0QXNDdXJyZW50KFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtGcmFnbWVudC5saW5rIGFzIElEaXNwbGF5U2VjdGlvblxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHVybDogc3RyaW5nID0gYCR7ZnJhZ21lbnRGb2xkZXJVcmx9LyR7Z0ZpbGVDb25zdGFudHMuZ3VpZGVPdXRsaW5lRmlsZW5hbWV9YDtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2FkUmVxdWVzdGVkID0gZ091dGxpbmVDb2RlLnJlZ2lzdGVyT3V0bGluZVVybERvd25sb2FkKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIHVybFxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobG9hZFJlcXVlc3RlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbmFtZTogc3RyaW5nO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5yZW5kZXJTdGF0ZS5pc0NoYWluTG9hZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gYGxvYWRDaGFpbkNoYXJ0T3V0bGluZUZpbGVgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGBsb2FkQ2hhcnRPdXRsaW5lRmlsZWA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9hZERlbGVnYXRlID0gKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnlcclxuICAgICAgICAgICAgICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdPdXRsaW5lQWN0aW9ucy5sb2FkU2VnbWVudENoYXJ0T3V0bGluZVByb3BlcnRpZXMoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lUmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5rRnJhZ21lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHRTZWdtZW50SW5kZXhcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBnU3RhdGVDb2RlLkFkZFJlTG9hZERhdGFFZmZlY3RJbW1lZGlhdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBQYXJzZVR5cGUuSnNvbixcclxuICAgICAgICAgICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZERlbGVnYXRlXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRPdXRsaW5lRnJvbUNoYXJ0X3N1YnNjcmlwdGlvbjogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQgfCBudWxsLFxyXG4gICAgICAgIGxpbmtGcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFjaGFydCkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPdXRsaW5lQ2hhcnQgd2FzIG51bGwnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChsaW5rRnJhZ21lbnQubGluaz8ucm9vdCkge1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coYExpbmsgcm9vdCBhbHJlYWR5IGxvYWRlZDogJHtsaW5rRnJhZ21lbnQubGluay5yb290Py5pZH1gKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBmcmFnbWVudEZvbGRlclVybDogc3RyaW5nO1xyXG4gICAgICAgIGNvbnN0IG91dGxpbmVDaGFydFBhdGggPSBjaGFydC5wO1xyXG5cclxuICAgICAgICBpZiAoIWNoYXJ0LmkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIElzIGEgcmVtb3RlIGd1aWRlXHJcbiAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsID0gb3V0bGluZUNoYXJ0UGF0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyBJcyBhIG1hcFxyXG4gICAgICAgICAgICBmcmFnbWVudEZvbGRlclVybCA9IGdSZW5kZXJDb2RlLmdldEZyYWdtZW50Rm9sZGVyVXJsKFxyXG4gICAgICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgICAgICBsaW5rRnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnRGb2xkZXJVcmwpKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBvdXRsaW5lID0gZ091dGxpbmVDb2RlLmdldE91dGxpbmUoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsLFxyXG4gICAgICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgICAgICBsaW5rRnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvdXRsaW5lLmxvYWRlZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghbGlua0ZyYWdtZW50LmxpbmspIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZ091dGxpbmVDb2RlLmJ1aWxkRGlzcGxheUNoYXJ0RnJvbU91dGxpbmVGb3JOZXdMaW5rKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmtGcmFnbWVudFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZ091dGxpbmVDb2RlLnNldENoYXJ0QXNDdXJyZW50KFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtGcmFnbWVudC5saW5rIGFzIElEaXNwbGF5U2VjdGlvblxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBnT3V0bGluZUNvZGUucG9zdEdldENoYXJ0T3V0bGluZVJvb3Rfc3Vic2NyaXB0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtGcmFnbWVudC5saW5rIGFzIElEaXNwbGF5U2VjdGlvblxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHVybDogc3RyaW5nID0gYCR7ZnJhZ21lbnRGb2xkZXJVcmx9LyR7Z0ZpbGVDb25zdGFudHMuZ3VpZGVPdXRsaW5lRmlsZW5hbWV9YDtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb2FkUmVxdWVzdGVkID0gZ091dGxpbmVDb2RlLnJlZ2lzdGVyT3V0bGluZVVybERvd25sb2FkKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIHVybFxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobG9hZFJlcXVlc3RlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbmFtZTogc3RyaW5nO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5yZW5kZXJTdGF0ZS5pc0NoYWluTG9hZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gYGxvYWRDaGFpbkNoYXJ0T3V0bGluZUZpbGVgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGBsb2FkQ2hhcnRPdXRsaW5lRmlsZWA7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9hZERlbGVnYXRlID0gKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnlcclxuICAgICAgICAgICAgICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdPdXRsaW5lQWN0aW9ucy5sb2FkQ2hhcnRPdXRsaW5lUHJvcGVydGllcyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmtGcmFnbWVudFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGdTdGF0ZUNvZGUuQWRkUmVMb2FkRGF0YUVmZmVjdEltbWVkaWF0ZShcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIFBhcnNlVHlwZS5Kc29uLFxyXG4gICAgICAgICAgICAgICAgICAgIHVybCxcclxuICAgICAgICAgICAgICAgICAgICBsb2FkRGVsZWdhdGVcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE91dGxpbmVGcm9tUG9kX3N1YnNjcmlwdGlvbjogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQgfCBudWxsLFxyXG4gICAgICAgIG9wdGlvbkZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIWNoYXJ0KSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ091dGxpbmVDaGFydCB3YXMgbnVsbCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbkZyYWdtZW50Lmxpbms/LnJvb3QpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBMaW5rIHJvb3QgYWxyZWFkeSBsb2FkZWQ6ICR7b3B0aW9uRnJhZ21lbnQubGluay5yb290Py5pZH1gKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGZyYWdtZW50Rm9sZGVyVXJsID0gZ1JlbmRlckNvZGUuZ2V0RnJhZ21lbnRGb2xkZXJVcmwoXHJcbiAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICBvcHRpb25GcmFnbWVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudEZvbGRlclVybCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgb3V0bGluZSA9IGdPdXRsaW5lQ29kZS5nZXRPdXRsaW5lKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgZnJhZ21lbnRGb2xkZXJVcmwsXHJcbiAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICBvcHRpb25GcmFnbWVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChvdXRsaW5lLmxvYWRlZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCFvcHRpb25GcmFnbWVudC5wb2QpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBnT3V0bGluZUNvZGUuYnVpbGREaXNwbGF5Q2hhcnRGcm9tT3V0bGluZUZvck5ld1BvZChcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBjaGFydCxcclxuICAgICAgICAgICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbkZyYWdtZW50XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnT3V0bGluZUNvZGUucG9zdEdldFBvZE91dGxpbmVSb290X3N1YnNjcmlwdGlvbihcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uRnJhZ21lbnQucG9kIGFzIElEaXNwbGF5U2VjdGlvblxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgdXJsOiBzdHJpbmcgPSBgJHtmcmFnbWVudEZvbGRlclVybH0vJHtnRmlsZUNvbnN0YW50cy5ndWlkZU91dGxpbmVGaWxlbmFtZX1gO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbG9hZFJlcXVlc3RlZCA9IGdPdXRsaW5lQ29kZS5yZWdpc3Rlck91dGxpbmVVcmxEb3dubG9hZChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgdXJsXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAobG9hZFJlcXVlc3RlZCA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgbmFtZTogc3RyaW5nO1xyXG5cclxuICAgICAgICAgICAgaWYgKHN0YXRlLnJlbmRlclN0YXRlLmlzQ2hhaW5Mb2FkID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbmFtZSA9IGBsb2FkQ2hhaW5DaGFydE91dGxpbmVGaWxlYDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5hbWUgPSBgbG9hZENoYXJ0T3V0bGluZUZpbGVgO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBsb2FkRGVsZWdhdGUgPSAoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnlcclxuICAgICAgICAgICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBnT3V0bGluZUFjdGlvbnMubG9hZFBvZE91dGxpbmVQcm9wZXJ0aWVzKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZSxcclxuICAgICAgICAgICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbkZyYWdtZW50XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgZ1N0YXRlQ29kZS5BZGRSZUxvYWREYXRhRWZmZWN0SW1tZWRpYXRlKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICAgICAgUGFyc2VUeXBlLkpzb24sXHJcbiAgICAgICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgICAgICBsb2FkRGVsZWdhdGVcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRPdXRsaW5lUHJvcGVydGllczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgcmF3T3V0bGluZTogYW55LFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIGxpbmtJRDogbnVtYmVyXHJcbiAgICApOiBJUmVuZGVyT3V0bGluZSA9PiB7XHJcblxyXG4gICAgICAgIG91dGxpbmUudiA9IHJhd091dGxpbmUudjtcclxuXHJcbiAgICAgICAgaWYgKHJhd091dGxpbmUuY1xyXG4gICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KHJhd091dGxpbmUuYykgPT09IHRydWVcclxuICAgICAgICAgICAgJiYgcmF3T3V0bGluZS5jLmxlbmd0aCA+IDBcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgbG9hZENoYXJ0cyhcclxuICAgICAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgICAgICByYXdPdXRsaW5lLmNcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyYXdPdXRsaW5lLmUpIHtcclxuXHJcbiAgICAgICAgICAgIG91dGxpbmUuZSA9IHJhd091dGxpbmUuZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG91dGxpbmUuciA9IGxvYWROb2RlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmF3T3V0bGluZS5yLFxyXG4gICAgICAgICAgICBsaW5rSURcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBvdXRsaW5lLmxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgb3V0bGluZS5yLmlzUm9vdCA9IHRydWU7XHJcbiAgICAgICAgb3V0bGluZS5tdiA9IHJhd091dGxpbmUubXY7XHJcblxyXG4gICAgICAgIHJldHVybiBvdXRsaW5lO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkT3V0bGluZVByb3BlcnRpZXNGb3JOZXdMaW5rOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvdXRsaW5lOiBJUmVuZGVyT3V0bGluZSxcclxuICAgICAgICBsaW5rSUQ6IG51bWJlclxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGNhY2hlTm9kZUZvck5ld0xpbmsoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvdXRsaW5lLnIsXHJcbiAgICAgICAgICAgIGxpbmtJRFxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRPdXRsaW5lUHJvcGVydGllc0Zvck5ld1BvZDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3V0bGluZTogSVJlbmRlck91dGxpbmUsXHJcbiAgICAgICAgbGlua0lEOiBudW1iZXJcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBjYWNoZU5vZGVGb3JOZXdQb2QoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvdXRsaW5lLnIsXHJcbiAgICAgICAgICAgIGxpbmtJRFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnT3V0bGluZUNvZGU7XHJcblxyXG4iLCJcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IFUgZnJvbSBcIi4uL2dVdGlsaXRpZXNcIjtcclxuaW1wb3J0IHsgQWN0aW9uVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL0FjdGlvblR5cGVcIjtcclxuaW1wb3J0IGdTdGF0ZUNvZGUgZnJvbSBcIi4uL2NvZGUvZ1N0YXRlQ29kZVwiO1xyXG5pbXBvcnQgSVN0YXRlQW55QXJyYXkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlQW55QXJyYXlcIjtcclxuaW1wb3J0IHsgSUh0dHBGZXRjaEl0ZW0gfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9odHRwL0lIdHRwRmV0Y2hJdGVtXCI7XHJcbmltcG9ydCB7IGdBdXRoZW50aWNhdGVkSHR0cCB9IGZyb20gXCIuLi9odHRwL2dBdXRoZW50aWNhdGlvbkh0dHBcIjtcclxuLy8gaW1wb3J0IGdBamF4SGVhZGVyQ29kZSBmcm9tIFwiLi4vaHR0cC9nQWpheEhlYWRlckNvZGVcIjtcclxuaW1wb3J0IGdGcmFnbWVudEFjdGlvbnMgZnJvbSBcIi4uL2FjdGlvbnMvZ0ZyYWdtZW50QWN0aW9uc1wiO1xyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuXHJcblxyXG5jb25zdCBnZXRGcmFnbWVudCA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBmcmFnbWVudElEOiBzdHJpbmcsXHJcbiAgICBmcmFnbWVudFBhdGg6IHN0cmluZyxcclxuICAgIF9hY3Rpb246IEFjdGlvblR5cGUsXHJcbiAgICBsb2FkQWN0aW9uOiAoc3RhdGU6IElTdGF0ZSwgcmVzcG9uc2U6IGFueSkgPT4gSVN0YXRlQW55QXJyYXkpOiBJSHR0cEZldGNoSXRlbSB8IHVuZGVmaW5lZCA9PiB7XHJcblxyXG4gICAgaWYgKCFzdGF0ZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjYWxsSUQ6IHN0cmluZyA9IFUuZ2VuZXJhdGVHdWlkKCk7XHJcblxyXG4gICAgLy8gbGV0IGhlYWRlcnMgPSBnQWpheEhlYWRlckNvZGUuYnVpbGRIZWFkZXJzKFxyXG4gICAgLy8gICAgIHN0YXRlLFxyXG4gICAgLy8gICAgIGNhbGxJRCxcclxuICAgIC8vICAgICBhY3Rpb25cclxuICAgIC8vICk7XHJcblxyXG4gICAgY29uc3QgdXJsOiBzdHJpbmcgPSBgJHtmcmFnbWVudFBhdGh9YDtcclxuXHJcbiAgICByZXR1cm4gZ0F1dGhlbnRpY2F0ZWRIdHRwKHtcclxuICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICBwYXJzZVR5cGU6IFwidGV4dFwiLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgICAgICAgICAvLyBoZWFkZXJzOiBoZWFkZXJzLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVzcG9uc2U6ICd0ZXh0JyxcclxuICAgICAgICBhY3Rpb246IGxvYWRBY3Rpb24sXHJcbiAgICAgICAgZXJyb3I6IChzdGF0ZTogSVN0YXRlLCBlcnJvckRldGFpbHM6IGFueSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coYHtcclxuICAgICAgICAgICAgICAgIFwibWVzc2FnZVwiOiBcIkVycm9yIGdldHRpbmcgZnJhZ21lbnQgZnJvbSB0aGUgc2VydmVyLCBwYXRoOiAke2ZyYWdtZW50UGF0aH0sIGlkOiAke2ZyYWdtZW50SUR9XCIsXHJcbiAgICAgICAgICAgICAgICBcInVybFwiOiAke3VybH0sXHJcbiAgICAgICAgICAgICAgICBcImVycm9yIERldGFpbHNcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMpfSxcclxuICAgICAgICAgICAgICAgIFwic3RhY2tcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMuc3RhY2spfSxcclxuICAgICAgICAgICAgICAgIFwibWV0aG9kXCI6ICR7Z2V0RnJhZ21lbnR9LFxyXG4gICAgICAgICAgICAgICAgXCJjYWxsSUQ6ICR7Y2FsbElEfVxyXG4gICAgICAgICAgICB9YCk7XHJcblxyXG4gICAgICAgICAgICBhbGVydChge1xyXG4gICAgICAgICAgICAgICAgXCJtZXNzYWdlXCI6IFwiRXJyb3IgZ2V0dGluZyBmcmFnbWVudCBmcm9tIHRoZSBzZXJ2ZXIsIHBhdGg6ICR7ZnJhZ21lbnRQYXRofSwgaWQ6ICR7ZnJhZ21lbnRJRH1cIixcclxuICAgICAgICAgICAgICAgIFwidXJsXCI6ICR7dXJsfSxcclxuICAgICAgICAgICAgICAgIFwiZXJyb3IgRGV0YWlsc1wiOiAke0pTT04uc3RyaW5naWZ5KGVycm9yRGV0YWlscyl9LFxyXG4gICAgICAgICAgICAgICAgXCJzdGFja1wiOiAke0pTT04uc3RyaW5naWZ5KGVycm9yRGV0YWlscy5zdGFjayl9LFxyXG4gICAgICAgICAgICAgICAgXCJtZXRob2RcIjogJHtnZXRGcmFnbWVudC5uYW1lfSxcclxuICAgICAgICAgICAgICAgIFwiY2FsbElEOiAke2NhbGxJRH1cclxuICAgICAgICAgICAgfWApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmNvbnN0IGdGcmFnbWVudEVmZmVjdHMgPSB7XHJcblxyXG4gICAgZ2V0RnJhZ21lbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIGZyYWdtZW50UGF0aDogc3RyaW5nXHJcbiAgICApOiBJSHR0cEZldGNoSXRlbSB8IHVuZGVmaW5lZCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGxvYWRBY3Rpb246IChzdGF0ZTogSVN0YXRlLCByZXNwb25zZTogYW55KSA9PiBJU3RhdGUgPSAoc3RhdGU6IElTdGF0ZSwgcmVzcG9uc2U6IGFueSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbmV3U3RhdGUgPSBnRnJhZ21lbnRBY3Rpb25zLmxvYWRGcmFnbWVudChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIG5ld1N0YXRlLnJlbmRlclN0YXRlLnJlZnJlc2hVcmwgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5ld1N0YXRlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRGcmFnbWVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG9wdGlvbi5pZCxcclxuICAgICAgICAgICAgZnJhZ21lbnRQYXRoLFxyXG4gICAgICAgICAgICBBY3Rpb25UeXBlLkdldEZyYWdtZW50LFxyXG4gICAgICAgICAgICBsb2FkQWN0aW9uXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdGcmFnbWVudEVmZmVjdHM7XHJcbiIsImltcG9ydCB7IE91dGxpbmVUeXBlIH0gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvZW51bXMvT3V0bGluZVR5cGVcIjtcclxuaW1wb3J0IElEaXNwbGF5Q2hhcnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheUNoYXJ0XCI7XHJcbmltcG9ydCBJRGlzcGxheVNlY3Rpb24gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheVNlY3Rpb25cIjtcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IElTdGF0ZUFueUFycmF5IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZUFueUFycmF5XCI7XHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmVOb2RlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZU5vZGVcIjtcclxuaW1wb3J0IElDaGFpblNlZ21lbnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvc2VnbWVudHMvSUNoYWluU2VnbWVudFwiO1xyXG5pbXBvcnQgZ0ZyYWdtZW50Q29kZSBmcm9tIFwiLi4vY29kZS9nRnJhZ21lbnRDb2RlXCI7XHJcbmltcG9ydCBnT3V0bGluZUNvZGUgZnJvbSBcIi4uL2NvZGUvZ091dGxpbmVDb2RlXCI7XHJcbmltcG9ydCBnU2VnbWVudENvZGUgZnJvbSBcIi4uL2NvZGUvZ1NlZ21lbnRDb2RlXCI7XHJcbmltcG9ydCBnU3RhdGVDb2RlIGZyb20gXCIuLi9jb2RlL2dTdGF0ZUNvZGVcIjtcclxuaW1wb3J0IGdGcmFnbWVudEVmZmVjdHMgZnJvbSBcIi4uL2VmZmVjdHMvZ0ZyYWdtZW50RWZmZWN0c1wiO1xyXG5pbXBvcnQgZ0ZpbGVDb25zdGFudHMgZnJvbSBcIi4uL2dGaWxlQ29uc3RhbnRzXCI7XHJcbmltcG9ydCBVIGZyb20gXCIuLi9nVXRpbGl0aWVzXCI7XHJcblxyXG5cclxuY29uc3QgZ2V0RnJhZ21lbnRGaWxlID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50XHJcbik6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICBzdGF0ZS5sb2FkaW5nID0gdHJ1ZTtcclxuICAgIHdpbmRvdy5UcmVlU29sdmUuc2NyZWVuLmhpZGVCYW5uZXIgPSB0cnVlO1xyXG4gICAgY29uc3QgZnJhZ21lbnRQYXRoID0gYCR7b3B0aW9uLnNlY3Rpb24/Lm91dGxpbmU/LnBhdGh9LyR7b3B0aW9uLmlkfSR7Z0ZpbGVDb25zdGFudHMuZnJhZ21lbnRGaWxlRXh0ZW5zaW9ufWA7XHJcblxyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBnRnJhZ21lbnRFZmZlY3RzLmdldEZyYWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3B0aW9uLFxyXG4gICAgICAgICAgICBmcmFnbWVudFBhdGhcclxuICAgICAgICApXHJcbiAgICBdO1xyXG59O1xyXG5cclxuY29uc3QgcHJvY2Vzc0NoYWluRnJhZ21lbnRUeXBlID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICBvdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlLFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGxcclxuKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgIGlmIChmcmFnbWVudCkge1xyXG5cclxuICAgICAgICBpZiAob3V0bGluZU5vZGUuaSAhPT0gZnJhZ21lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzbWF0Y2ggYmV0d2VlbiBmcmFnbWVudCBpZCBhbmQgb3V0bGluZSBmcmFnbWVudCBpZCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG91dGxpbmVOb2RlLnR5cGUgPT09IE91dGxpbmVUeXBlLkxpbmspIHtcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3NMaW5rKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgICAgICAgICAgb3V0bGluZU5vZGUsXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvdXRsaW5lTm9kZS50eXBlID09PSBPdXRsaW5lVHlwZS5FeGl0KSB7XHJcblxyXG4gICAgICAgICAgICBwcm9jZXNzRXhpdChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgc2VnbWVudCxcclxuICAgICAgICAgICAgICAgIG91dGxpbmVOb2RlLFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3V0bGluZU5vZGUuaXNDaGFydCA9PT0gdHJ1ZVxyXG4gICAgICAgICAgICAmJiBvdXRsaW5lTm9kZS5pc1Jvb3QgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3NDaGFydFJvb3QoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHNlZ21lbnQsXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvdXRsaW5lTm9kZS5pc0xhc3QgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHByb2Nlc3NMYXN0KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgICAgICAgICAgb3V0bGluZU5vZGUsXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChvdXRsaW5lTm9kZS50eXBlID09PSBPdXRsaW5lVHlwZS5Ob2RlKSB7XHJcblxyXG4gICAgICAgICAgICBwcm9jZXNzTm9kZShcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgc2VnbWVudCxcclxuICAgICAgICAgICAgICAgIG91dGxpbmVOb2RlLFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBmcmFnbWVudCB0eXBlLicpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxufTtcclxuXHJcbmNvbnN0IGNoZWNrRm9yTGFzdEZyYWdtZW50RXJyb3JzID0gKFxyXG4gICAgc2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgIG91dGxpbmVOb2RlOiBJUmVuZGVyT3V0bGluZU5vZGUsXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGlmICghc2VnbWVudC5zZWdtZW50U2VjdGlvbikge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWdtZW50IHNlY3Rpb24gd2FzIG51bGwgLSBsYXN0XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvdXRsaW5lTm9kZS5pICE9PSBmcmFnbWVudC5pZCkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gb3V0bGluZSBub2RlIGlkIGFuZCBmcmFnbWVudCBpZCcpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgY2hlY2tGb3JOb2RlRXJyb3JzID0gKFxyXG4gICAgc2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgIG91dGxpbmVOb2RlOiBJUmVuZGVyT3V0bGluZU5vZGUsXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGlmICghc2VnbWVudC5zZWdtZW50U2VjdGlvbikge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWdtZW50IHNlY3Rpb24gd2FzIG51bGwgLSBub2RlXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnQuaUtleSkpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNtYXRjaCBiZXR3ZWVuIGZyYWdtZW50IGFuZCBvdXRsaW5lIG5vZGUgLSBsaW5rJyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICghVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnQuaUV4aXRLZXkpKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzbWF0Y2ggYmV0d2VlbiBmcmFnbWVudCBhbmQgb3V0bGluZSBub2RlIC0gZXhpdCcpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvdXRsaW5lTm9kZS5pICE9PSBmcmFnbWVudC5pZCkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gb3V0bGluZSBub2RlIGlkIGFuZCBmcmFnbWVudCBpZCcpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgY2hlY2tGb3JDaGFydFJvb3RFcnJvcnMgPSAoXHJcbiAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50LFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoIXNlZ21lbnQuc2VnbWVudFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBzZWN0aW9uIHdhcyBudWxsIC0gcm9vdFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50LmlLZXkpKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzbWF0Y2ggYmV0d2VlbiBmcmFnbWVudCBhbmQgb3V0bGluZSByb290IC0gbGluaycpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50LmlFeGl0S2V5KSkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gZnJhZ21lbnQgYW5kIG91dGxpbmUgcm9vdCAtIGV4aXQnKTtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IGNoZWNrRm9yRXhpdEVycm9ycyA9IChcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICBvdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlLFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoIXNlZ21lbnQuc2VnbWVudFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBzZWN0aW9uIHdhcyBudWxsIC0gZXhpdFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBvdXQgc2VjdGlvbiB3YXMgbnVsbCAtIGV4aXRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50LmV4aXRLZXkpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzbWF0Y2ggYmV0d2VlbiBmcmFnbWVudCBhbmQgb3V0bGluZSAtIGV4aXQnKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHNlZ21lbnQuZW5kLnR5cGUgIT09IE91dGxpbmVUeXBlLkV4aXQpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNtYXRjaCBiZXR3ZWVuIGZyYWdtZW50IGFuZCBvdXRsaW5lIG5vZGUgLSBleGl0Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG91dGxpbmVOb2RlLmkgIT09IGZyYWdtZW50LmlkKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzbWF0Y2ggYmV0d2VlbiBvdXRsaW5lIG5vZGUgaWQgYW5kIGZyYWdtZW50IGlkJyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5jb25zdCBwcm9jZXNzQ2hhcnRSb290ID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGNoZWNrRm9yQ2hhcnRSb290RXJyb3JzKFxyXG4gICAgICAgIHNlZ21lbnQsXHJcbiAgICAgICAgZnJhZ21lbnRcclxuICAgICk7XHJcblxyXG4gICAgZ0ZyYWdtZW50Q29kZS5sb2FkTmV4dENoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgc2VnbWVudFxyXG4gICAgKTtcclxuXHJcbiAgICBzZXRMaW5rc1Jvb3QoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgc2VnbWVudCxcclxuICAgICAgICBmcmFnbWVudFxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IHNldExpbmtzUm9vdCA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50LFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBjb25zdCBpblNlY3Rpb24gPSBzZWdtZW50LnNlZ21lbnRJblNlY3Rpb247XHJcblxyXG4gICAgaWYgKCFpblNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBpbiBzZWN0aW9uIHdhcyBudWxsIC0gY2hhcnQgcm9vdFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzZWN0aW9uID0gc2VnbWVudC5zZWdtZW50U2VjdGlvbjtcclxuXHJcbiAgICBpZiAoIXNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBzZWN0aW9uIHdhcyBudWxsIC0gY2hhcnQgcm9vdFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfY2hhaW5GcmFnbWVudChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBpblNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgIHNlZ21lbnQuc3RhcnQua2V5XHJcbiAgICApO1xyXG5cclxuICAgIGlmIChwYXJlbnQ/LmxpbmspIHtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudC5pZCA9PT0gZnJhZ21lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcmVudCBhbmQgRnJhZ21lbnQgYXJlIHRoZSBzYW1lXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyZW50Lmxpbmsucm9vdCA9IGZyYWdtZW50O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcmVudEZyYWdtZW50IHdhcyBudWxsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNlY3Rpb24uY3VycmVudCA9IGZyYWdtZW50O1xyXG59O1xyXG5cclxuY29uc3QgcHJvY2Vzc05vZGUgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgc2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgIG91dGxpbmVOb2RlOiBJUmVuZGVyT3V0bGluZU5vZGUsXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGNoZWNrRm9yTm9kZUVycm9ycyhcclxuICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgIG91dGxpbmVOb2RlLFxyXG4gICAgICAgIGZyYWdtZW50XHJcbiAgICApO1xyXG5cclxuICAgIGdGcmFnbWVudENvZGUubG9hZE5leHRDaGFpbkZyYWdtZW50KFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIHNlZ21lbnRcclxuICAgICk7XHJcblxyXG4gICAgcHJvY2Vzc0ZyYWdtZW50KFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIGZyYWdtZW50XHJcbiAgICApO1xyXG59O1xyXG5cclxuY29uc3QgcHJvY2Vzc0xhc3QgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgc2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgIG91dGxpbmVOb2RlOiBJUmVuZGVyT3V0bGluZU5vZGUsXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGNoZWNrRm9yTGFzdEZyYWdtZW50RXJyb3JzKFxyXG4gICAgICAgIHNlZ21lbnQsXHJcbiAgICAgICAgb3V0bGluZU5vZGUsXHJcbiAgICAgICAgZnJhZ21lbnRcclxuICAgICk7XHJcblxyXG4gICAgcHJvY2Vzc0ZyYWdtZW50KFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIGZyYWdtZW50XHJcbiAgICApO1xyXG5cclxuICAgIGZyYWdtZW50LmxpbmsgPSBudWxsO1xyXG4gICAgZnJhZ21lbnQuc2VsZWN0ZWQgPSBudWxsO1xyXG5cclxuICAgIGlmIChmcmFnbWVudC5vcHRpb25zPy5sZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUucmVzZXRGcmFnbWVudFVpcyhzdGF0ZSk7XHJcbiAgICAgICAgZnJhZ21lbnQudWkuZnJhZ21lbnRPcHRpb25zRXhwYW5kZWQgPSB0cnVlO1xyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLnVpLm9wdGlvbnNFeHBhbmRlZCA9IHRydWU7XHJcbiAgICB9XHJcbn07XHJcblxyXG5jb25zdCBwcm9jZXNzTGluayA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50LFxyXG4gICAgb3V0bGluZU5vZGU6IElSZW5kZXJPdXRsaW5lTm9kZSxcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgaWYgKG91dGxpbmVOb2RlLmkgIT09IGZyYWdtZW50LmlkKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzbWF0Y2ggYmV0d2VlbiBvdXRsaW5lIG5vZGUgaWQgYW5kIGZyYWdtZW50IGlkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgb3V0bGluZSA9IGZyYWdtZW50LnNlY3Rpb24ub3V0bGluZTtcclxuXHJcbiAgICBpZiAoIW91dGxpbmUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG91dGxpbmVOb2RlPy5jID09IG51bGwpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG91dGxpbmVOb2RlLmlzUm9vdCA9PT0gdHJ1ZVxyXG4gICAgICAgICYmIG91dGxpbmVOb2RlLmlzQ2hhcnQgPT09IHRydWVcclxuICAgICkge1xyXG4gICAgICAgIHNldExpbmtzUm9vdChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHNlZ21lbnQsXHJcbiAgICAgICAgICAgIGZyYWdtZW50XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBvdXRsaW5lQ2hhcnQgPSBnT3V0bGluZUNvZGUuZ2V0T3V0bGluZUNoYXJ0KFxyXG4gICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgb3V0bGluZU5vZGU/LmNcclxuICAgICk7XHJcblxyXG4gICAgZ091dGxpbmVDb2RlLmdldFNlZ21lbnRPdXRsaW5lX3N1YnNjcmlwdGlvbihcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBvdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgc2VnbWVudC5pbmRleFxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IHByb2Nlc3NFeGl0ID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICBvdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlLFxyXG4gICAgZXhpdEZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgY2hlY2tGb3JFeGl0RXJyb3JzKFxyXG4gICAgICAgIHNlZ21lbnQsXHJcbiAgICAgICAgb3V0bGluZU5vZGUsXHJcbiAgICAgICAgZXhpdEZyYWdtZW50XHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IHNlY3Rpb246IElEaXNwbGF5Q2hhcnQgPSBleGl0RnJhZ21lbnQuc2VjdGlvbiBhcyBJRGlzcGxheUNoYXJ0O1xyXG4gICAgY29uc3Qgc2VjdGlvblBhcmVudCA9IHNlY3Rpb24ucGFyZW50O1xyXG5cclxuICAgIGlmICghc2VjdGlvblBhcmVudCkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJRGlzcGxheUNoYXJ0IHBhcmVudCBpcyBudWxsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGlFeGl0S2V5ID0gZXhpdEZyYWdtZW50LmV4aXRLZXk7XHJcblxyXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygc2VjdGlvblBhcmVudC5vcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb24uaUV4aXRLZXkgPT09IGlFeGl0S2V5KSB7XHJcblxyXG4gICAgICAgICAgICBnU2VnbWVudENvZGUubG9hZEV4aXRTZWdtZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBzZWdtZW50LmluZGV4LFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uLmlkXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBnRnJhZ21lbnRDb2RlLnNldEN1cnJlbnQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIGV4aXRGcmFnbWVudFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IGxvYWRGcmFnbWVudCA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICByZXNwb25zZTogYW55LFxyXG4gICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnRcclxuKTogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9PiB7XHJcblxyXG4gICAgY29uc3QgcGFyZW50RnJhZ21lbnRJRCA9IG9wdGlvbi5wYXJlbnRGcmFnbWVudElEIGFzIHN0cmluZztcclxuXHJcbiAgICBpZiAoVS5pc051bGxPcldoaXRlU3BhY2UocGFyZW50RnJhZ21lbnRJRCkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGFyZW50IGZyYWdtZW50IElEIGlzIG51bGxcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVuZGVyRnJhZ21lbnQgPSBnRnJhZ21lbnRDb2RlLnBhcnNlQW5kTG9hZEZyYWdtZW50KFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIHJlc3BvbnNlLnRleHREYXRhLFxyXG4gICAgICAgIHBhcmVudEZyYWdtZW50SUQsXHJcbiAgICAgICAgb3B0aW9uLmlkLFxyXG4gICAgICAgIG9wdGlvbi5zZWN0aW9uXHJcbiAgICApO1xyXG5cclxuICAgIHN0YXRlLmxvYWRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICByZXR1cm4gcmVuZGVyRnJhZ21lbnQ7XHJcbn07XHJcblxyXG5jb25zdCBsb2FkUG9kRnJhZ21lbnQgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgcmVzcG9uc2U6IGFueSxcclxuICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50XHJcbik6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPT4ge1xyXG5cclxuICAgIGNvbnN0IHBhcmVudEZyYWdtZW50SUQgPSBvcHRpb24ucGFyZW50RnJhZ21lbnRJRCBhcyBzdHJpbmc7XHJcblxyXG4gICAgaWYgKFUuaXNOdWxsT3JXaGl0ZVNwYWNlKHBhcmVudEZyYWdtZW50SUQpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcmVudCBmcmFnbWVudCBJRCBpcyBudWxsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlbmRlckZyYWdtZW50ID0gZ0ZyYWdtZW50Q29kZS5wYXJzZUFuZExvYWRQb2RGcmFnbWVudChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICByZXNwb25zZS50ZXh0RGF0YSxcclxuICAgICAgICBwYXJlbnRGcmFnbWVudElELFxyXG4gICAgICAgIG9wdGlvbi5pZCxcclxuICAgICAgICBvcHRpb24uc2VjdGlvblxyXG4gICAgKTtcclxuXHJcbiAgICBzdGF0ZS5sb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgcmV0dXJuIHJlbmRlckZyYWdtZW50O1xyXG59O1xyXG5cclxuY29uc3QgcHJvY2Vzc0ZyYWdtZW50ID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgaWYgKCFzdGF0ZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgZXhwYW5kZWRPcHRpb246IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIGxldCBwYXJlbnRGcmFnbWVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX2NoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgZnJhZ21lbnQuc2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgZnJhZ21lbnQucGFyZW50RnJhZ21lbnRJRFxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoIXBhcmVudEZyYWdtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHBhcmVudEZyYWdtZW50Lm9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbi5pZCA9PT0gZnJhZ21lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgICAgIGV4cGFuZGVkT3B0aW9uID0gb3B0aW9uO1xyXG5cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChleHBhbmRlZE9wdGlvbikge1xyXG5cclxuICAgICAgICBleHBhbmRlZE9wdGlvbi51aS5mcmFnbWVudE9wdGlvbnNFeHBhbmRlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUuc2hvd09wdGlvbk5vZGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBwYXJlbnRGcmFnbWVudCxcclxuICAgICAgICAgICAgZXhwYW5kZWRPcHRpb25cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgZ0ZyYWdtZW50QWN0aW9ucyA9IHtcclxuXHJcbiAgICBzaG93QW5jaWxsYXJ5Tm9kZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgLy8gcGFyZW50RnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICBhbmNpbGxhcnk6IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICAvLyBpZiAoYW5jaWxsYXJ5LnVpLmRpc2N1c3Npb25Mb2FkZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgLy8gICAgIGdGcmFnbWVudENvZGUuYXV0b0V4cGFuZFNpbmdsZUJsYW5rT3B0aW9uKFxyXG4gICAgICAgIC8vICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgLy8gICAgICAgICBhbmNpbGxhcnlcclxuICAgICAgICAvLyAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gICAgIGlmICghYW5jaWxsYXJ5LmxpbmspIHtcclxuXHJcbiAgICAgICAgLy8gICAgICAgICBnT3V0bGluZUNvZGUuZ2V0RnJhZ21lbnRMaW5rQ2hhcnRPdXRsaW5lKFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIGFuY2lsbGFyeVxyXG4gICAgICAgIC8vICAgICAgICAgKTtcclxuICAgICAgICAvLyAgICAgfVxyXG5cclxuICAgICAgICAvLyAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0RnJhZ21lbnRGaWxlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgYW5jaWxsYXJ5XHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2hvd09wdGlvbk5vZGU6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHBhcmVudEZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgLy8gZm9yIChjb25zdCBjaGlsZCBvZiBwYXJlbnRGcmFnbWVudC5vcHRpb25zKSB7XHJcblxyXG4gICAgICAgIC8vICAgICBjaGlsZC51aS5kaXNjdXNzaW9uTG9hZGVkID0gZmFsc2U7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNsZWFyUGFyZW50U2VjdGlvblNlbGVjdGVkKHBhcmVudEZyYWdtZW50LnNlY3Rpb24pO1xyXG4gICAgICAgIGdGcmFnbWVudENvZGUuY2xlYXJPcnBoYW5lZFN0ZXBzKHBhcmVudEZyYWdtZW50KTtcclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5wcmVwYXJlVG9TaG93T3B0aW9uTm9kZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIGlmIChvcHRpb24udWkuZGlzY3Vzc2lvbkxvYWRlZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAvLyAgICAgZ0ZyYWdtZW50Q29kZS5hdXRvRXhwYW5kU2luZ2xlQmxhbmtPcHRpb24oXHJcbiAgICAgICAgLy8gICAgICAgICBzdGF0ZSxcclxuICAgICAgICAvLyAgICAgICAgIG9wdGlvblxyXG4gICAgICAgIC8vICAgICApO1xyXG5cclxuICAgICAgICAvLyAgICAgaWYgKCFvcHRpb24ubGluaykge1xyXG5cclxuICAgICAgICAvLyAgICAgICAgIGdPdXRsaW5lQ29kZS5nZXRGcmFnbWVudExpbmtDaGFydE91dGxpbmUoXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgLy8gICAgICAgICApO1xyXG4gICAgICAgIC8vICAgICB9XHJcblxyXG4gICAgICAgIC8vICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIHJldHVybiBnZXRGcmFnbWVudEZpbGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkRnJhZ21lbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IElTdGF0ZSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGVcclxuICAgICAgICAgICAgfHwgVS5pc051bGxPcldoaXRlU3BhY2Uob3B0aW9uLmlkKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb2FkRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRGcmFnbWVudEFuZFNldFNlbGVjdGVkOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByZXNwb25zZTogYW55LFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIG9wdGlvblRleHQ6IHN0cmluZyB8IG51bGwgPSBudWxsXHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG5vZGUgPSBsb2FkRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUpIHtcclxuXHJcbiAgICAgICAgICAgIGdGcmFnbWVudENvZGUuc2V0Q3VycmVudChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgbm9kZVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvblRleHQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBub2RlLm9wdGlvbiA9IG9wdGlvblRleHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUucmVuZGVyU3RhdGUuaXNDaGFpbkxvYWQpIHtcclxuXHJcbiAgICAgICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLnJlZnJlc2hVcmwgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRQb2RGcmFnbWVudDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgcmVzcG9uc2U6IGFueSxcclxuICAgICAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICBvcHRpb25UZXh0OiBzdHJpbmcgfCBudWxsID0gbnVsbFxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBub2RlID0gbG9hZFBvZEZyYWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChub2RlKSB7XHJcblxyXG4gICAgICAgICAgICBnRnJhZ21lbnRDb2RlLnNldFBvZEN1cnJlbnQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIG5vZGVcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25UZXh0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbm9kZS5vcHRpb24gPSBvcHRpb25UZXh0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXN0YXRlLnJlbmRlclN0YXRlLmlzQ2hhaW5Mb2FkKSB7XHJcblxyXG4gICAgICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5yZWZyZXNoVXJsID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkUm9vdEZyYWdtZW50QW5kU2V0U2VsZWN0ZWQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgc2VjdGlvbjogSURpc3BsYXlTZWN0aW9uXHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgb3V0bGluZU5vZGVJRCA9IHNlY3Rpb24ub3V0bGluZT8uci5pO1xyXG5cclxuICAgICAgICBpZiAoIW91dGxpbmVOb2RlSUQpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlbmRlckZyYWdtZW50ID0gZ0ZyYWdtZW50Q29kZS5wYXJzZUFuZExvYWRGcmFnbWVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlLnRleHREYXRhLFxyXG4gICAgICAgICAgICBcInJvb3RcIixcclxuICAgICAgICAgICAgb3V0bGluZU5vZGVJRCxcclxuICAgICAgICAgICAgc2VjdGlvbixcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzdGF0ZS5sb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChyZW5kZXJGcmFnbWVudCkge1xyXG5cclxuICAgICAgICAgICAgcmVuZGVyRnJhZ21lbnQuc2VjdGlvbi5yb290ID0gcmVuZGVyRnJhZ21lbnQ7XHJcbiAgICAgICAgICAgIHJlbmRlckZyYWdtZW50LnNlY3Rpb24uY3VycmVudCA9IHJlbmRlckZyYWdtZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUucmVmcmVzaFVybCA9IHRydWU7XHJcblxyXG4gICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkUG9kUm9vdEZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByZXNwb25zZTogYW55LFxyXG4gICAgICAgIHNlY3Rpb246IElEaXNwbGF5U2VjdGlvblxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGxpbmVOb2RlSUQgPSBzZWN0aW9uLm91dGxpbmU/LnIuaTtcclxuXHJcbiAgICAgICAgaWYgKCFvdXRsaW5lTm9kZUlEKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByZW5kZXJGcmFnbWVudCA9IGdGcmFnbWVudENvZGUucGFyc2VBbmRMb2FkUG9kRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByZXNwb25zZS50ZXh0RGF0YSxcclxuICAgICAgICAgICAgXCJyb290XCIsXHJcbiAgICAgICAgICAgIG91dGxpbmVOb2RlSUQsXHJcbiAgICAgICAgICAgIHNlY3Rpb24sXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc3RhdGUubG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAocmVuZGVyRnJhZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgIHJlbmRlckZyYWdtZW50LnNlY3Rpb24ucm9vdCA9IHJlbmRlckZyYWdtZW50O1xyXG4gICAgICAgICAgICByZW5kZXJGcmFnbWVudC5zZWN0aW9uLmN1cnJlbnQgPSByZW5kZXJGcmFnbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLnJlZnJlc2hVcmwgPSB0cnVlO1xyXG5cclxuICAgICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZENoYWluRnJhZ21lbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgc2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgICAgICBvdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlXHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNlZ21lbnRTZWN0aW9uID0gc2VnbWVudC5zZWdtZW50U2VjdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKCFzZWdtZW50U2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBzZWN0aW9uIGlzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcGFyZW50RnJhZ21lbnRJRCA9IG91dGxpbmVOb2RlLnBhcmVudD8uaSBhcyBzdHJpbmc7XHJcblxyXG4gICAgICAgIGlmIChvdXRsaW5lTm9kZS5pc1Jvb3QgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghb3V0bGluZU5vZGUuaXNDaGFydCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHBhcmVudEZyYWdtZW50SUQgPSBcImd1aWRlUm9vdFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RnJhZ21lbnRJRCA9IFwicm9vdFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKFUuaXNOdWxsT3JXaGl0ZVNwYWNlKHBhcmVudEZyYWdtZW50SUQpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXJlbnQgZnJhZ21lbnQgSUQgaXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogeyBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LCBjb250aW51ZUxvYWRpbmc6IGJvb2xlYW4gfSA9IGdGcmFnbWVudENvZGUucGFyc2VBbmRMb2FkRnJhZ21lbnRCYXNlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmVzcG9uc2UudGV4dERhdGEsXHJcbiAgICAgICAgICAgIHBhcmVudEZyYWdtZW50SUQsXHJcbiAgICAgICAgICAgIG91dGxpbmVOb2RlLmksXHJcbiAgICAgICAgICAgIHNlZ21lbnRTZWN0aW9uLFxyXG4gICAgICAgICAgICBzZWdtZW50LmluZGV4XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3QgZnJhZ21lbnQgPSByZXN1bHQuZnJhZ21lbnQ7XHJcbiAgICAgICAgc3RhdGUubG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoZnJhZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBwYXJlbnRGcmFnbWVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX2NoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHNlZ21lbnRTZWN0aW9uLmxpbmtJRCxcclxuICAgICAgICAgICAgICAgIHBhcmVudEZyYWdtZW50SURcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIHNlZ21lbnRTZWN0aW9uLmN1cnJlbnQgPSBmcmFnbWVudDtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnRGcmFnbWVudCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChwYXJlbnRGcmFnbWVudC5pZCA9PT0gZnJhZ21lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGFyZW50RnJhZ21lbnQgYW5kIEZyYWdtZW50IGFyZSB0aGUgc2FtZVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBwYXJlbnRGcmFnbWVudC5zZWxlY3RlZCA9IGZyYWdtZW50O1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQudWkuc2VjdGlvbkluZGV4ID0gcGFyZW50RnJhZ21lbnQudWkuc2VjdGlvbkluZGV4ICsgMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NDaGFpbkZyYWdtZW50VHlwZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHNlZ21lbnQsXHJcbiAgICAgICAgICAgIG91dGxpbmVOb2RlLFxyXG4gICAgICAgICAgICBmcmFnbWVudFxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ0ZyYWdtZW50QWN0aW9ucztcclxuIiwiaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcblxyXG5cclxuY29uc3QgZ0hvb2tSZWdpc3RyeUNvZGUgPSB7XHJcblxyXG4gICAgZXhlY3V0ZVN0ZXBIb29rOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBzdGVwOiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCF3aW5kb3cuSG9va1JlZ2lzdHJ5KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdpbmRvdy5Ib29rUmVnaXN0cnkuZXhlY3V0ZVN0ZXBIb29rKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgc3RlcFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnSG9va1JlZ2lzdHJ5Q29kZTtcclxuXHJcbiIsImltcG9ydCB7IFBhcnNlVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL1BhcnNlVHlwZVwiO1xyXG5pbXBvcnQgSURpc3BsYXlDaGFydCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9kaXNwbGF5L0lEaXNwbGF5Q2hhcnRcIjtcclxuaW1wb3J0IElEaXNwbGF5U2VjdGlvbiBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9kaXNwbGF5L0lEaXNwbGF5U2VjdGlvblwiO1xyXG5pbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgSVN0YXRlQW55QXJyYXkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlQW55QXJyYXlcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZU5vZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lTm9kZVwiO1xyXG5pbXBvcnQgSUNoYWluU2VnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9zZWdtZW50cy9JQ2hhaW5TZWdtZW50XCI7XHJcbmltcG9ydCBSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vc3RhdGUvcmVuZGVyL1JlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBnRnJhZ21lbnRBY3Rpb25zIGZyb20gXCIuLi9hY3Rpb25zL2dGcmFnbWVudEFjdGlvbnNcIjtcclxuaW1wb3J0IGdGaWxlQ29uc3RhbnRzIGZyb20gXCIuLi9nRmlsZUNvbnN0YW50c1wiO1xyXG5pbXBvcnQgVSBmcm9tIFwiLi4vZ1V0aWxpdGllc1wiO1xyXG5pbXBvcnQgZ0hpc3RvcnlDb2RlIGZyb20gXCIuL2dIaXN0b3J5Q29kZVwiO1xyXG5pbXBvcnQgZ0hvb2tSZWdpc3RyeUNvZGUgZnJvbSBcIi4vZ0hvb2tSZWdpc3RyeUNvZGVcIjtcclxuaW1wb3J0IGdPdXRsaW5lQ29kZSBmcm9tIFwiLi9nT3V0bGluZUNvZGVcIjtcclxuaW1wb3J0IGdTZWdtZW50Q29kZSBmcm9tIFwiLi9nU2VnbWVudENvZGVcIjtcclxuaW1wb3J0IGdTdGF0ZUNvZGUgZnJvbSBcIi4vZ1N0YXRlQ29kZVwiO1xyXG5cclxuXHJcbmNvbnN0IGdldFZhcmlhYmxlVmFsdWUgPSAoXHJcbiAgICBzZWN0aW9uOiBJRGlzcGxheVNlY3Rpb24sXHJcbiAgICB2YXJpYWJsZVZhbHVlczogYW55LFxyXG4gICAgdmFyaWFibGVOYW1lOiBzdHJpbmdcclxuKTogc3RyaW5nIHwgbnVsbCA9PiB7XHJcblxyXG4gICAgbGV0IHZhbHVlID0gdmFyaWFibGVWYWx1ZXNbdmFyaWFibGVOYW1lXTtcclxuXHJcbiAgICBpZiAodmFsdWUpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IHNlY3Rpb24ub3V0bGluZT8ubXY/Llt2YXJpYWJsZU5hbWVdO1xyXG5cclxuICAgIGlmIChjdXJyZW50VmFsdWUpIHtcclxuXHJcbiAgICAgICAgdmFyaWFibGVWYWx1ZXNbdmFyaWFibGVOYW1lXSA9IGN1cnJlbnRWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRBbmNlc3RvclZhcmlhYmxlVmFsdWUoXHJcbiAgICAgICAgc2VjdGlvbixcclxuICAgICAgICB2YXJpYWJsZVZhbHVlcyxcclxuICAgICAgICB2YXJpYWJsZU5hbWVcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHZhcmlhYmxlVmFsdWVzW3ZhcmlhYmxlTmFtZV0gPz8gbnVsbDtcclxufTtcclxuXHJcbmNvbnN0IGdldEFuY2VzdG9yVmFyaWFibGVWYWx1ZSA9IChcclxuICAgIHNlY3Rpb246IElEaXNwbGF5U2VjdGlvbixcclxuICAgIHZhcmlhYmxlVmFsdWVzOiBhbnksXHJcbiAgICB2YXJpYWJsZU5hbWU6IHN0cmluZ1xyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBjb25zdCBjaGFydCA9IHNlY3Rpb24gYXMgSURpc3BsYXlDaGFydDtcclxuICAgIGNvbnN0IHBhcmVudCA9IGNoYXJ0LnBhcmVudD8uc2VjdGlvbjtcclxuXHJcbiAgICBpZiAoIXBhcmVudCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBwYXJlbnRWYWx1ZSA9IHBhcmVudC5vdXRsaW5lPy5tdj8uW3ZhcmlhYmxlTmFtZV07XHJcblxyXG4gICAgaWYgKHBhcmVudFZhbHVlKSB7XHJcblxyXG4gICAgICAgIHZhcmlhYmxlVmFsdWVzW3ZhcmlhYmxlTmFtZV0gPSBwYXJlbnRWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRBbmNlc3RvclZhcmlhYmxlVmFsdWUoXHJcbiAgICAgICAgcGFyZW50LFxyXG4gICAgICAgIHZhcmlhYmxlVmFsdWVzLFxyXG4gICAgICAgIHZhcmlhYmxlTmFtZVxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IGNoZWNrRm9yVmFyaWFibGVzID0gKGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQpOiB2b2lkID0+IHtcclxuXHJcbiAgICBjb25zdCB2YWx1ZSA9IGZyYWdtZW50LnZhbHVlO1xyXG4gICAgY29uc3QgdmFyaWFibGVSZWZQYXR0ZXJuID0gL+OAiMKm4oC5KD88dmFyaWFibGVOYW1lPlte4oC6wqZdKynigLrCpuOAiS9nbXU7XHJcbiAgICBjb25zdCBtYXRjaGVzID0gdmFsdWUubWF0Y2hBbGwodmFyaWFibGVSZWZQYXR0ZXJuKTtcclxuICAgIGxldCB2YXJpYWJsZU5hbWU6IHN0cmluZztcclxuICAgIGxldCB2YXJpYWJsZVZhbHVlczogYW55ID0ge307XHJcbiAgICBsZXQgcmVzdWx0ID0gJyc7XHJcbiAgICBsZXQgbWFya2VyID0gMDtcclxuXHJcbiAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIG1hdGNoZXMpIHtcclxuXHJcbiAgICAgICAgaWYgKG1hdGNoXHJcbiAgICAgICAgICAgICYmIG1hdGNoLmdyb3Vwc1xyXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZXFlcWVxXHJcbiAgICAgICAgICAgICYmIG1hdGNoLmluZGV4ICE9IG51bGxcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgdmFyaWFibGVOYW1lID0gbWF0Y2guZ3JvdXBzLnZhcmlhYmxlTmFtZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHZhcmlhYmxlVmFsdWUgPSBnZXRWYXJpYWJsZVZhbHVlKFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQuc2VjdGlvbixcclxuICAgICAgICAgICAgICAgIHZhcmlhYmxlVmFsdWVzLFxyXG4gICAgICAgICAgICAgICAgdmFyaWFibGVOYW1lXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXZhcmlhYmxlVmFsdWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFZhcmlhYmxlOiAke3ZhcmlhYmxlTmFtZX0gY291bGQgbm90IGJlIGZvdW5kYCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArXHJcbiAgICAgICAgICAgICAgICB2YWx1ZS5zdWJzdHJpbmcobWFya2VyLCBtYXRjaC5pbmRleCkgK1xyXG4gICAgICAgICAgICAgICAgdmFyaWFibGVWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIG1hcmtlciA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXN1bHQgPSByZXN1bHQgK1xyXG4gICAgICAgIHZhbHVlLnN1YnN0cmluZyhtYXJrZXIsIHZhbHVlLmxlbmd0aCk7XHJcblxyXG4gICAgZnJhZ21lbnQudmFsdWUgPSByZXN1bHQ7XHJcbn07XHJcblxyXG5jb25zdCBjbGVhclNpYmxpbmdDaGFpbnMgPSAoXHJcbiAgICBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2YgcGFyZW50Lm9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbi5pZCAhPT0gZnJhZ21lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgICAgIGNsZWFyRnJhZ21lbnRDaGFpbnMob3B0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5jb25zdCBjbGVhckZyYWdtZW50Q2hhaW5zID0gKGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XHJcblxyXG4gICAgaWYgKCFmcmFnbWVudCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhckZyYWdtZW50Q2hhaW5zKGZyYWdtZW50Lmxpbms/LnJvb3QpO1xyXG5cclxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIGZyYWdtZW50Lm9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgY2xlYXJGcmFnbWVudENoYWlucyhvcHRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGZyYWdtZW50LnNlbGVjdGVkID0gbnVsbDtcclxuXHJcbiAgICBpZiAoZnJhZ21lbnQubGluaz8ucm9vdCkge1xyXG5cclxuICAgICAgICBmcmFnbWVudC5saW5rLnJvb3Quc2VsZWN0ZWQgPSBudWxsO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgbG9hZE9wdGlvbiA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICByYXdPcHRpb246IGFueSxcclxuICAgIG91dGxpbmVOb2RlOiBJUmVuZGVyT3V0bGluZU5vZGUgfCBudWxsLFxyXG4gICAgc2VjdGlvbjogSURpc3BsYXlTZWN0aW9uLFxyXG4gICAgcGFyZW50RnJhZ21lbnRJRDogc3RyaW5nLFxyXG4gICAgc2VnbWVudEluZGV4OiBudW1iZXIgfCBudWxsXHJcbik6IElSZW5kZXJGcmFnbWVudCA9PiB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9uID0gbmV3IFJlbmRlckZyYWdtZW50KFxyXG4gICAgICAgIHJhd09wdGlvbi5pZCxcclxuICAgICAgICBwYXJlbnRGcmFnbWVudElELFxyXG4gICAgICAgIHNlY3Rpb24sXHJcbiAgICAgICAgc2VnbWVudEluZGV4XHJcbiAgICApO1xyXG5cclxuICAgIG9wdGlvbi5vcHRpb24gPSByYXdPcHRpb24ub3B0aW9uID8/ICcnO1xyXG4gICAgb3B0aW9uLmlzQW5jaWxsYXJ5ID0gcmF3T3B0aW9uLmlzQW5jaWxsYXJ5ID09PSB0cnVlO1xyXG4gICAgb3B0aW9uLm9yZGVyID0gcmF3T3B0aW9uLm9yZGVyID8/IDA7XHJcbiAgICBvcHRpb24uaUV4aXRLZXkgPSByYXdPcHRpb24uaUV4aXRLZXkgPz8gJyc7XHJcbiAgICBvcHRpb24uYXV0b01lcmdlRXhpdCA9IHJhd09wdGlvbi5hdXRvTWVyZ2VFeGl0ID09PSB0cnVlO1xyXG4gICAgb3B0aW9uLnBvZEtleSA9IHJhd09wdGlvbi5wb2RLZXkgPz8gJyc7XHJcbiAgICBvcHRpb24ucG9kVGV4dCA9IHJhd09wdGlvbi5wb2RUZXh0ID8/ICcnO1xyXG5cclxuICAgIGlmIChvdXRsaW5lTm9kZSkge1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IG91dGxpbmVPcHRpb24gb2Ygb3V0bGluZU5vZGUubykge1xyXG5cclxuICAgICAgICAgICAgaWYgKG91dGxpbmVPcHRpb24uaSA9PT0gb3B0aW9uLmlkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZ1N0YXRlQ29kZS5jYWNoZV9vdXRsaW5lTm9kZShcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBzZWN0aW9uLmxpbmtJRCxcclxuICAgICAgICAgICAgICAgICAgICBvdXRsaW5lT3B0aW9uXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdTdGF0ZUNvZGUuY2FjaGVfY2hhaW5GcmFnbWVudChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBvcHRpb25cclxuICAgICk7XHJcblxyXG4gICAgZ091dGxpbmVDb2RlLmdldFBvZE91dGxpbmVfc3Vic2NyaXBpb24oXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgb3B0aW9uLFxyXG4gICAgICAgIHNlY3Rpb25cclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIG9wdGlvbjtcclxufTtcclxuXHJcbmNvbnN0IHNob3dQbHVnX3N1YnNjcmlwdGlvbiA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBleGl0OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICBvcHRpb25UZXh0OiBzdHJpbmdcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgY29uc3Qgc2VjdGlvbjogSURpc3BsYXlDaGFydCA9IGV4aXQuc2VjdGlvbiBhcyBJRGlzcGxheUNoYXJ0O1xyXG4gICAgY29uc3QgcGFyZW50ID0gc2VjdGlvbi5wYXJlbnQ7XHJcblxyXG4gICAgaWYgKCFwYXJlbnQpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSURpc3BsYXlDaGFydCBwYXJlbnQgaXMgbnVsbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpRXhpdEtleSA9IGV4aXQuZXhpdEtleTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBwYXJlbnQub3B0aW9ucykge1xyXG5cclxuICAgICAgICBpZiAob3B0aW9uLmlFeGl0S2V5ID09PSBpRXhpdEtleSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNob3dPcHRpb25Ob2RlX3N1YnNjcmlwdG9uKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25UZXh0XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3Qgc2hvd09wdGlvbk5vZGVfc3Vic2NyaXB0b24gPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICBvcHRpb25UZXh0OiBzdHJpbmcgfCBudWxsID0gbnVsbFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoIW9wdGlvblxyXG4gICAgICAgIHx8ICFvcHRpb24uc2VjdGlvbj8ub3V0bGluZT8ucGF0aFxyXG4gICAgKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGdGcmFnbWVudENvZGUucHJlcGFyZVRvU2hvd09wdGlvbk5vZGUoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgb3B0aW9uXHJcbiAgICApO1xyXG5cclxuICAgIC8vIGlmIChvcHRpb24udWkuZGlzY3Vzc2lvbkxvYWRlZCA9PT0gdHJ1ZSkge1xyXG4gICAgLy8gICAgIHJldHVybjtcclxuICAgIC8vIH1cclxuXHJcbiAgICByZXR1cm4gZ0ZyYWdtZW50Q29kZS5nZXRGcmFnbWVudEFuZExpbmtPdXRsaW5lX3N1YnNjcmlwaW9uKFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIG9wdGlvbixcclxuICAgICAgICBvcHRpb25UZXh0LFxyXG4gICAgKTtcclxufTtcclxuXHJcbi8vIGNvbnN0IHNob3dQb2RPcHRpb25Ob2RlX3N1YnNjcmlwdG9uID0gKFxyXG4vLyAgICAgc3RhdGU6IElTdGF0ZSxcclxuLy8gICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50LFxyXG4vLyAgICAgb3B0aW9uVGV4dDogc3RyaW5nIHwgbnVsbCA9IG51bGxcclxuLy8gKTogdm9pZCA9PiB7XHJcblxyXG4vLyAgICAgaWYgKCFvcHRpb25cclxuLy8gICAgICAgICB8fCAhb3B0aW9uLnNlY3Rpb24/Lm91dGxpbmU/LnBhdGhcclxuLy8gICAgICkge1xyXG4vLyAgICAgICAgIHJldHVybjtcclxuLy8gICAgIH1cclxuXHJcbi8vICAgICBnRnJhZ21lbnRDb2RlLnByZXBhcmVUb1Nob3dQb2RPcHRpb25Ob2RlKFxyXG4vLyAgICAgICAgIHN0YXRlLFxyXG4vLyAgICAgICAgIG9wdGlvblxyXG4vLyAgICAgKTtcclxuXHJcbi8vICAgICByZXR1cm4gZ0ZyYWdtZW50Q29kZS5nZXRQb2RGcmFnbWVudF9zdWJzY3JpcGlvbihcclxuLy8gICAgICAgICBzdGF0ZSxcclxuLy8gICAgICAgICBvcHRpb24sXHJcbi8vICAgICAgICAgb3B0aW9uVGV4dCxcclxuLy8gICAgICk7XHJcbi8vIH07XHJcblxyXG5jb25zdCBsb2FkTmV4dEZyYWdtZW50SW5TZWdtZW50ID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnRcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgY29uc3QgbmV4dE91dGxpbmVOb2RlID0gZ1NlZ21lbnRDb2RlLmdldE5leHRTZWdtZW50T3V0bGluZU5vZGUoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgc2VnbWVudFxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoIW5leHRPdXRsaW5lTm9kZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmcmFnbWVudEZvbGRlclVybCA9IHNlZ21lbnQuc2VnbWVudFNlY3Rpb24/Lm91dGxpbmU/LnBhdGg7XHJcbiAgICBjb25zdCB1cmwgPSBgJHtmcmFnbWVudEZvbGRlclVybH0vJHtuZXh0T3V0bGluZU5vZGUuaX0ke2dGaWxlQ29uc3RhbnRzLmZyYWdtZW50RmlsZUV4dGVuc2lvbn1gO1xyXG5cclxuICAgIGNvbnN0IGxvYWREZWxlZ2F0ZSA9IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55XHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIHJldHVybiBnRnJhZ21lbnRBY3Rpb25zLmxvYWRDaGFpbkZyYWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlLFxyXG4gICAgICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgICAgICBuZXh0T3V0bGluZU5vZGVcclxuICAgICAgICApO1xyXG4gICAgfTtcclxuXHJcbiAgICBnU3RhdGVDb2RlLkFkZFJlTG9hZERhdGFFZmZlY3RJbW1lZGlhdGUoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgYGxvYWRDaGFpbkZyYWdtZW50YCxcclxuICAgICAgICBQYXJzZVR5cGUuSnNvbixcclxuICAgICAgICB1cmwsXHJcbiAgICAgICAgbG9hZERlbGVnYXRlXHJcbiAgICApO1xyXG59O1xyXG5cclxuY29uc3QgZ0ZyYWdtZW50Q29kZSA9IHtcclxuXHJcbiAgICBsb2FkTmV4dENoYWluRnJhZ21lbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKHNlZ21lbnQub3V0bGluZU5vZGVzLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIGxvYWROZXh0RnJhZ21lbnRJblNlZ21lbnQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHNlZ21lbnQsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBnU2VnbWVudENvZGUubG9hZE5leHRTZWdtZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaGFzT3B0aW9uOiAoXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICBvcHRpb25JRDogc3RyaW5nXHJcbiAgICApOiBib29sZWFuID0+IHtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBvcHRpb24gb2YgZnJhZ21lbnQub3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbi5pZCA9PT0gb3B0aW9uSUQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGVja1NlbGVjdGVkOiAoZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIWZyYWdtZW50LnNlbGVjdGVkPy5pZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWdGcmFnbWVudENvZGUuaGFzT3B0aW9uKGZyYWdtZW50LCBmcmFnbWVudC5zZWxlY3RlZD8uaWQpKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWxlY3RlZCBoYXMgYmVlbiBzZXQgdG8gZnJhZ21lbnQgdGhhdCBpc24ndCBhbiBvcHRpb25cIik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhclBhcmVudFNlY3Rpb25TZWxlY3RlZDogKGRpc3BsYXlDaGFydDogSURpc3BsYXlTZWN0aW9uKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IChkaXNwbGF5Q2hhcnQgYXMgSURpc3BsYXlDaGFydCkucGFyZW50O1xyXG5cclxuICAgICAgICBpZiAoIXBhcmVudCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNsZWFyUGFyZW50U2VjdGlvbk9ycGhhbmVkU3RlcHMocGFyZW50KTtcclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNsZWFyUGFyZW50U2VjdGlvblNlbGVjdGVkKHBhcmVudC5zZWN0aW9uIGFzIElEaXNwbGF5Q2hhcnQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhclBhcmVudFNlY3Rpb25PcnBoYW5lZFN0ZXBzOiAoZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgfCB1bmRlZmluZWQpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFmcmFnbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNsZWFyT3JwaGFuZWRTdGVwcyhmcmFnbWVudC5zZWxlY3RlZCk7XHJcbiAgICAgICAgZnJhZ21lbnQuc2VsZWN0ZWQgPSBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhck9ycGhhbmVkU3RlcHM6IChmcmFnbWVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIWZyYWdtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUuY2xlYXJPcnBoYW5lZFN0ZXBzKGZyYWdtZW50Lmxpbms/LnJvb3QpO1xyXG4gICAgICAgIGdGcmFnbWVudENvZGUuY2xlYXJPcnBoYW5lZFN0ZXBzKGZyYWdtZW50LnNlbGVjdGVkKTtcclxuXHJcbiAgICAgICAgZnJhZ21lbnQuc2VsZWN0ZWQgPSBudWxsO1xyXG4gICAgICAgIGZyYWdtZW50LmxpbmsgPSBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRGcmFnbWVudEFuZExpbmtPdXRsaW5lX3N1YnNjcmlwaW9uOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICBvcHRpb25UZXh0OiBzdHJpbmcgfCBudWxsID0gbnVsbCxcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICAvLyBpZiAob3B0aW9uLnVpLmRpc2N1c3Npb25Mb2FkZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgLy8gICAgIHRocm93IG5ldyBFcnJvcignRGlzY3Vzc2lvbiB3YXMgYWxyZWFkeSBsb2FkZWQnKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIHN0YXRlLmxvYWRpbmcgPSB0cnVlO1xyXG4gICAgICAgIHdpbmRvdy5UcmVlU29sdmUuc2NyZWVuLmhpZGVCYW5uZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUuZ2V0TGlua091dGxpbmVfc3Vic2NyaXBpb24oXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCB1cmwgPSBgJHtvcHRpb24uc2VjdGlvbj8ub3V0bGluZT8ucGF0aH0vJHtvcHRpb24uaWR9JHtnRmlsZUNvbnN0YW50cy5mcmFnbWVudEZpbGVFeHRlbnNpb259YDtcclxuXHJcbiAgICAgICAgY29uc3QgbG9hZEFjdGlvbjogKHN0YXRlOiBJU3RhdGUsIHJlc3BvbnNlOiBhbnkpID0+IElTdGF0ZUFueUFycmF5ID0gKHN0YXRlOiBJU3RhdGUsIHJlc3BvbnNlOiBhbnkpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnRnJhZ21lbnRBY3Rpb25zLmxvYWRGcmFnbWVudEFuZFNldFNlbGVjdGVkKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvblRleHRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBnU3RhdGVDb2RlLkFkZFJlTG9hZERhdGFFZmZlY3RJbW1lZGlhdGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBgbG9hZEZyYWdtZW50RmlsZWAsXHJcbiAgICAgICAgICAgIFBhcnNlVHlwZS5UZXh0LFxyXG4gICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgIGxvYWRBY3Rpb25cclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRQb2RGcmFnbWVudF9zdWJzY3JpcGlvbjogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgb3B0aW9uVGV4dDogc3RyaW5nIHwgbnVsbCA9IG51bGwsXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgc3RhdGUubG9hZGluZyA9IHRydWU7XHJcbiAgICAgICAgd2luZG93LlRyZWVTb2x2ZS5zY3JlZW4uaGlkZUJhbm5lciA9IHRydWU7XHJcbiAgICAgICAgY29uc3QgdXJsID0gYCR7b3B0aW9uLnNlY3Rpb24/Lm91dGxpbmU/LnBhdGh9LyR7b3B0aW9uLmlkfSR7Z0ZpbGVDb25zdGFudHMuZnJhZ21lbnRGaWxlRXh0ZW5zaW9ufWA7XHJcblxyXG4gICAgICAgIGNvbnN0IGxvYWRBY3Rpb246IChzdGF0ZTogSVN0YXRlLCByZXNwb25zZTogYW55KSA9PiBJU3RhdGVBbnlBcnJheSA9IChzdGF0ZTogSVN0YXRlLCByZXNwb25zZTogYW55KSA9PiB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ0ZyYWdtZW50QWN0aW9ucy5sb2FkUG9kRnJhZ21lbnQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uVGV4dFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGdTdGF0ZUNvZGUuQWRkUmVMb2FkRGF0YUVmZmVjdEltbWVkaWF0ZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGBsb2FkRnJhZ21lbnRGaWxlYCxcclxuICAgICAgICAgICAgUGFyc2VUeXBlLlRleHQsXHJcbiAgICAgICAgICAgIHVybCxcclxuICAgICAgICAgICAgbG9hZEFjdGlvblxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIGdldExpbmtPdXRsaW5lX3N1YnNjcmlwaW9uOiAoXHJcbiAgICAvLyAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIC8vICAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudCxcclxuICAgIC8vICk6IHZvaWQgPT4ge1xyXG5cclxuICAgIC8vICAgICBjb25zdCBvdXRsaW5lID0gb3B0aW9uLnNlY3Rpb24ub3V0bGluZTtcclxuXHJcbiAgICAvLyAgICAgaWYgKCFvdXRsaW5lKSB7XHJcbiAgICAvLyAgICAgICAgIHJldHVybjtcclxuICAgIC8vICAgICB9XHJcblxyXG4gICAgLy8gICAgIGNvbnN0IG91dGxpbmVOb2RlID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfb3V0bGluZU5vZGUoXHJcbiAgICAvLyAgICAgICAgIHN0YXRlLFxyXG4gICAgLy8gICAgICAgICBvcHRpb24uc2VjdGlvbi5saW5rSUQsXHJcbiAgICAvLyAgICAgICAgIG9wdGlvbi5pZFxyXG4gICAgLy8gICAgICk7XHJcblxyXG4gICAgLy8gICAgIGlmIChvdXRsaW5lTm9kZT8uYyA9PSBudWxsXHJcbiAgICAvLyAgICAgICAgIHx8IHN0YXRlLnJlbmRlclN0YXRlLmlzQ2hhaW5Mb2FkID09PSB0cnVlIC8vIFdpbGwgbG9hZCBpdCBmcm9tIGEgc2VnbWVudFxyXG4gICAgLy8gICAgICkge1xyXG4gICAgLy8gICAgICAgICByZXR1cm47XHJcbiAgICAvLyAgICAgfVxyXG5cclxuICAgIC8vICAgICBjb25zdCBvdXRsaW5lQ2hhcnQgPSBnT3V0bGluZUNvZGUuZ2V0T3V0bGluZUNoYXJ0KFxyXG4gICAgLy8gICAgICAgICBvdXRsaW5lLFxyXG4gICAgLy8gICAgICAgICBvdXRsaW5lTm9kZT8uY1xyXG4gICAgLy8gICAgICk7XHJcblxyXG4gICAgLy8gICAgIGdPdXRsaW5lQ29kZS5nZXRPdXRsaW5lRnJvbUNoYXJ0X3N1YnNjcmlwdGlvbihcclxuICAgIC8vICAgICAgICAgc3RhdGUsXHJcbiAgICAvLyAgICAgICAgIG91dGxpbmVDaGFydCxcclxuICAgIC8vICAgICAgICAgb3B0aW9uXHJcbiAgICAvLyAgICAgKTtcclxuICAgIC8vIH0sXHJcblxyXG4gICAgZ2V0TGlua0VsZW1lbnRJRDogKGZyYWdtZW50SUQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIHJldHVybiBgbnRfbGtfZnJhZ18ke2ZyYWdtZW50SUR9YDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RnJhZ21lbnRFbGVtZW50SUQ6IChmcmFnbWVudElEOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgICAgICByZXR1cm4gYG50X2ZyX2ZyYWdfJHtmcmFnbWVudElEfWA7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXBhcmVUb1Nob3dPcHRpb25Ob2RlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUubWFya09wdGlvbnNFeHBhbmRlZChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUuc2V0Q3VycmVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdIaXN0b3J5Q29kZS5wdXNoQnJvd3Nlckhpc3RvcnlTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHByZXBhcmVUb1Nob3dQb2RPcHRpb25Ob2RlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUubWFya09wdGlvbnNFeHBhbmRlZChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUuc2V0UG9kQ3VycmVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcnNlQW5kTG9hZEZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByZXNwb25zZTogc3RyaW5nLFxyXG4gICAgICAgIHBhcmVudEZyYWdtZW50SUQ6IHN0cmluZyxcclxuICAgICAgICBvdXRsaW5lTm9kZUlEOiBzdHJpbmcsXHJcbiAgICAgICAgc2VjdGlvbjogSURpc3BsYXlTZWN0aW9uXHJcbiAgICApOiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiB7IGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsIGNvbnRpbnVlTG9hZGluZzogYm9vbGVhbiB9ID0gZ0ZyYWdtZW50Q29kZS5wYXJzZUFuZExvYWRGcmFnbWVudEJhc2UoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgcGFyZW50RnJhZ21lbnRJRCxcclxuICAgICAgICAgICAgb3V0bGluZU5vZGVJRCxcclxuICAgICAgICAgICAgc2VjdGlvblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZyYWdtZW50ID0gcmVzdWx0LmZyYWdtZW50O1xyXG5cclxuICAgICAgICBpZiAocmVzdWx0LmNvbnRpbnVlTG9hZGluZyA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgZ0ZyYWdtZW50Q29kZS5hdXRvRXhwYW5kU2luZ2xlQmxhbmtPcHRpb24oXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5mcmFnbWVudFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFmcmFnbWVudC5saW5rKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZ091dGxpbmVDb2RlLmdldExpbmtPdXRsaW5lX3N1YnNjcmlwaW9uKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZnJhZ21lbnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcnNlQW5kTG9hZFBvZEZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByZXNwb25zZTogc3RyaW5nLFxyXG4gICAgICAgIHBhcmVudEZyYWdtZW50SUQ6IHN0cmluZyxcclxuICAgICAgICBvdXRsaW5lTm9kZUlEOiBzdHJpbmcsXHJcbiAgICAgICAgc2VjdGlvbjogSURpc3BsYXlTZWN0aW9uXHJcbiAgICApOiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiB7IGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsIGNvbnRpbnVlTG9hZGluZzogYm9vbGVhbiB9ID0gZ0ZyYWdtZW50Q29kZS5wYXJzZUFuZExvYWRGcmFnbWVudEJhc2UoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgcGFyZW50RnJhZ21lbnRJRCxcclxuICAgICAgICAgICAgb3V0bGluZU5vZGVJRCxcclxuICAgICAgICAgICAgc2VjdGlvblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZyYWdtZW50ID0gcmVzdWx0LmZyYWdtZW50O1xyXG5cclxuICAgICAgICBpZiAocmVzdWx0LmNvbnRpbnVlTG9hZGluZyA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgZ0ZyYWdtZW50Q29kZS5hdXRvRXhwYW5kU2luZ2xlQmxhbmtPcHRpb24oXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5mcmFnbWVudFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZyYWdtZW50O1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJzZUFuZExvYWRGcmFnbWVudEJhc2U6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHJlc3BvbnNlOiBzdHJpbmcsXHJcbiAgICAgICAgcGFyZW50RnJhZ21lbnRJRDogc3RyaW5nLFxyXG4gICAgICAgIG91dGxpbmVOb2RlSUQ6IHN0cmluZyxcclxuICAgICAgICBzZWN0aW9uOiBJRGlzcGxheVNlY3Rpb24sXHJcbiAgICAgICAgc2VnbWVudEluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbFxyXG4gICAgKTogeyBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LCBjb250aW51ZUxvYWRpbmc6IGJvb2xlYW4gfSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc2VjdGlvbi5vdXRsaW5lKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09wdGlvbiBzZWN0aW9uIG91dGxpbmUgd2FzIG51bGwnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJhd0ZyYWdtZW50ID0gZ0ZyYWdtZW50Q29kZS5wYXJzZUZyYWdtZW50KHJlc3BvbnNlKTtcclxuXHJcbiAgICAgICAgaWYgKCFyYXdGcmFnbWVudCkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSYXcgZnJhZ21lbnQgd2FzIG51bGwnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvdXRsaW5lTm9kZUlEICE9PSByYXdGcmFnbWVudC5pZCkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcmF3RnJhZ21lbnQgaWQgZG9lcyBub3QgbWF0Y2ggdGhlIG91dGxpbmVOb2RlSUQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX2NoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBzZWN0aW9uLmxpbmtJRCxcclxuICAgICAgICAgICAgb3V0bGluZU5vZGVJRFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghZnJhZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgIGZyYWdtZW50ID0gbmV3IFJlbmRlckZyYWdtZW50KFxyXG4gICAgICAgICAgICAgICAgcmF3RnJhZ21lbnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwYXJlbnRGcmFnbWVudElELFxyXG4gICAgICAgICAgICAgICAgc2VjdGlvbixcclxuICAgICAgICAgICAgICAgIHNlZ21lbnRJbmRleFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNvbnRpbnVlTG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBpZiAoIWZyYWdtZW50LnVpLmRpc2N1c3Npb25Mb2FkZWQpIHtcclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5sb2FkRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByYXdGcmFnbWVudCxcclxuICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnU3RhdGVDb2RlLmNhY2hlX2NoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBmcmFnbWVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnRpbnVlTG9hZGluZyA9IHRydWU7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICAgICAgY29udGludWVMb2FkaW5nXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgYXV0b0V4cGFuZFNpbmdsZUJsYW5rT3B0aW9uOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgY29uc3Qgb3B0aW9uc0FuZEFuY2lsbGFyaWVzID0gZ0ZyYWdtZW50Q29kZS5zcGxpdE9wdGlvbnNBbmRBbmNpbGxhcmllcyhmcmFnbWVudC5vcHRpb25zKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnNBbmRBbmNpbGxhcmllcy5vcHRpb25zLmxlbmd0aCA9PT0gMVxyXG4gICAgICAgICAgICAmJiBVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudC5pS2V5KVxyXG4gICAgICAgICAgICAmJiAob3B0aW9uc0FuZEFuY2lsbGFyaWVzLm9wdGlvbnNbMF0ub3B0aW9uID09PSAnJyAvLyBpZiBvcHRpb24gaXMgYmxhbmtcclxuICAgICAgICAgICAgICAgIHx8IG9wdGlvbnNBbmRBbmNpbGxhcmllcy5vcHRpb25zWzBdLmF1dG9NZXJnZUV4aXQgPT09IHRydWUpIC8vIGlmIGEgc2luZ2xlIGV4aXRcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgY29uc3Qgb3V0bGluZU5vZGUgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9vdXRsaW5lTm9kZShcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQuc2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudC5pZFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKG91dGxpbmVOb2RlPy5jICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNob3dPcHRpb25Ob2RlX3N1YnNjcmlwdG9uKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zQW5kQW5jaWxsYXJpZXMub3B0aW9uc1swXVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICghVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnQuZXhpdEtleSkpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFRoZW4gZmluZCB0aGUgcGFyZW50IG9wdGlvbiB3aXRoIGFuIGlFeGl0S2V5IHRoYXQgbWF0Y2hlcyB0aGlzIGV4aXRLZXlcclxuICAgICAgICAgICAgc2hvd1BsdWdfc3Vic2NyaXB0aW9uKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50Lm9wdGlvblxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZXhwYW5kT3B0aW9uUG9kczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IG9wdGlvbnNBbmRBbmNpbGxhcmllcyA9IGdGcmFnbWVudENvZGUuc3BsaXRPcHRpb25zQW5kQW5jaWxsYXJpZXMoZnJhZ21lbnQub3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIG9wdGlvbnNBbmRBbmNpbGxhcmllcy5vcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBvdXRsaW5lTm9kZSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX291dGxpbmVOb2RlKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBvcHRpb24uc2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgICAgICBvcHRpb24uaWRcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvdXRsaW5lTm9kZT8uZCA9PSBudWxsXHJcbiAgICAgICAgICAgICAgICB8fCBvcHRpb24ucG9kICE9IG51bGxcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdPdXRsaW5lQ29kZS5nZXRQb2RPdXRsaW5lX3N1YnNjcmlwaW9uKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb24uc2VjdGlvblxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgLy8gcmV0dXJuIHNob3dQb2RPcHRpb25Ob2RlX3N1YnNjcmlwdG9uKFxyXG4gICAgICAgICAgICAvLyAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIC8vICAgICBvcHRpb25cclxuICAgICAgICAgICAgLy8gKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNhY2hlU2VjdGlvblJvb3Q6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGRpc3BsYXlTZWN0aW9uOiBJRGlzcGxheVNlY3Rpb25cclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIWRpc3BsYXlTZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJvb3RGcmFnbWVudCA9IGRpc3BsYXlTZWN0aW9uLnJvb3Q7XHJcblxyXG4gICAgICAgIGlmICghcm9vdEZyYWdtZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdTdGF0ZUNvZGUuY2FjaGVfY2hhaW5GcmFnbWVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHJvb3RGcmFnbWVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGRpc3BsYXlTZWN0aW9uLmN1cnJlbnQgPSBkaXNwbGF5U2VjdGlvbi5yb290O1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiByb290RnJhZ21lbnQub3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgZ1N0YXRlQ29kZS5jYWNoZV9jaGFpbkZyYWdtZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGVsZW1lbnRJc1BhcmFncmFwaDogKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuID0+IHtcclxuXHJcbiAgICAgICAgbGV0IHRyaW1tZWQgPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgaWYgKCFVLmlzTnVsbE9yV2hpdGVTcGFjZSh0cmltbWVkKSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRyaW1tZWQubGVuZ3RoID4gMjApIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0cmltbWVkID0gdHJpbW1lZC5zdWJzdHJpbmcoMCwgMjApO1xyXG4gICAgICAgICAgICAgICAgdHJpbW1lZCA9IHRyaW1tZWQucmVwbGFjZSgvXFxzL2csICcnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aCgnPHA+JykgPT09IHRydWVcclxuICAgICAgICAgICAgJiYgdHJpbW1lZFszXSAhPT0gJzwnKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyc2VBbmRMb2FkR3VpZGVSb290RnJhZ21lbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHJhd0ZyYWdtZW50OiBhbnksXHJcbiAgICAgICAgcm9vdDogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFyYXdGcmFnbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmxvYWRGcmFnbWVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHJhd0ZyYWdtZW50LFxyXG4gICAgICAgICAgICByb290XHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZEZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByYXdGcmFnbWVudDogYW55LFxyXG4gICAgICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBmcmFnbWVudC50b3BMZXZlbE1hcEtleSA9IHJhd0ZyYWdtZW50LnRvcExldmVsTWFwS2V5ID8/ICcnO1xyXG4gICAgICAgIGZyYWdtZW50Lm1hcEtleUNoYWluID0gcmF3RnJhZ21lbnQubWFwS2V5Q2hhaW4gPz8gJyc7XHJcbiAgICAgICAgZnJhZ21lbnQuZ3VpZGVJRCA9IHJhd0ZyYWdtZW50Lmd1aWRlSUQgPz8gJyc7XHJcbiAgICAgICAgZnJhZ21lbnQuaUtleSA9IHJhd0ZyYWdtZW50LmlLZXkgPz8gbnVsbDtcclxuICAgICAgICBmcmFnbWVudC5leGl0S2V5ID0gcmF3RnJhZ21lbnQuZXhpdEtleSA/PyBudWxsO1xyXG4gICAgICAgIGZyYWdtZW50LnZhcmlhYmxlID0gcmF3RnJhZ21lbnQudmFyaWFibGUgPz8gW107XHJcbiAgICAgICAgZnJhZ21lbnQuY2xhc3NlcyA9IHJhd0ZyYWdtZW50LmNsYXNzZXMgPz8gW107XHJcbiAgICAgICAgZnJhZ21lbnQudmFsdWUgPSByYXdGcmFnbWVudC52YWx1ZSA/PyAnJztcclxuICAgICAgICBmcmFnbWVudC52YWx1ZSA9IGZyYWdtZW50LnZhbHVlLnRyaW0oKTtcclxuICAgICAgICAvLyBmcmFnbWVudC51aS5kaXNjdXNzaW9uTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBmcmFnbWVudC51aS5kb05vdFBhaW50ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGNoZWNrRm9yVmFyaWFibGVzKFxyXG4gICAgICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCBvdXRsaW5lTm9kZSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX291dGxpbmVOb2RlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgZnJhZ21lbnQuc2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgIGZyYWdtZW50LmlkXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZnJhZ21lbnQucGFyZW50RnJhZ21lbnRJRCA9IG91dGxpbmVOb2RlPy5wYXJlbnQ/LmkgPz8gJyc7XHJcblxyXG4gICAgICAgIGxldCBvcHRpb246IElSZW5kZXJGcmFnbWVudCB8IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYgKHJhd0ZyYWdtZW50Lm9wdGlvbnNcclxuICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShyYXdGcmFnbWVudC5vcHRpb25zKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHJhd09wdGlvbiBvZiByYXdGcmFnbWVudC5vcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgb3B0aW9uID0gZnJhZ21lbnQub3B0aW9ucy5maW5kKG8gPT4gby5pZCA9PT0gcmF3T3B0aW9uLmlkKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbikge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24gPSBsb2FkT3B0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmF3T3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lTm9kZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQuc2VjdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50LnNlZ21lbnRJbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50Lm9wdGlvbnMucHVzaChvcHRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLm9wdGlvbiA9IHJhd09wdGlvbi5vcHRpb24gPz8gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLmlzQW5jaWxsYXJ5ID0gcmF3T3B0aW9uLmlzQW5jaWxsYXJ5ID09PSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5vcmRlciA9IHJhd09wdGlvbi5vcmRlciA/PyAwO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5pRXhpdEtleSA9IHJhd09wdGlvbi5pRXhpdEtleSA/PyAnJztcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uZXhpdEtleSA9IHJhd09wdGlvbi5leGl0S2V5ID8/ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5hdXRvTWVyZ2VFeGl0ID0gcmF3T3B0aW9uLmF1dG9NZXJnZUV4aXQgPz8gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnBvZEtleSA9IHJhd09wdGlvbi5wb2RLZXkgPz8gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnBvZFRleHQgPSByYXdPcHRpb24ucG9kVGV4dCA/PyAnJztcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VjdGlvbiA9IGZyYWdtZW50LnNlY3Rpb247XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnBhcmVudEZyYWdtZW50SUQgPSBmcmFnbWVudC5pZDtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VnbWVudEluZGV4ID0gZnJhZ21lbnQuc2VnbWVudEluZGV4O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG9wdGlvbi51aS5kaXNjdXNzaW9uTG9hZGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBvcHRpb24udWkuZG9Ob3RQYWludCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnSG9va1JlZ2lzdHJ5Q29kZS5leGVjdXRlU3RlcEhvb2soXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBmcmFnbWVudFxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcnNlRnJhZ21lbnQ6IChyZXNwb25zZTogc3RyaW5nKTogYW55ID0+IHtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgICAgICAgIDxzY3JpcHQgdHlwZT1cXFwibW9kdWxlXFxcIiBzcmM9XFxcIi9Adml0ZS9jbGllbnRcXFwiPjwvc2NyaXB0PlxyXG4gICAgICAgICAgICAgICAgPCEtLSB0c0ZyYWdtZW50UmVuZGVyQ29tbWVudCB7XFxcIm5vZGVcXFwiOntcXFwiaWRcXFwiOlxcXCJkQnQ3S20yTWxcXFwiLFxcXCJ0b3BMZXZlbE1hcEtleVxcXCI6XFxcImN2MVRSbDAxcmZcXFwiLFxcXCJtYXBLZXlDaGFpblxcXCI6XFxcImN2MVRSbDAxcmZcXFwiLFxcXCJndWlkZUlEXFxcIjpcXFwiZEJ0N0pOMUhlXFxcIixcXFwiZ3VpZGVQYXRoXFxcIjpcXFwiYzovR2l0SHViL1RFU1QuRG9jdW1lbnRhdGlvbi90c21hcHNkYXRhT3B0aW9uc0ZvbGRlci9Ib2xkZXIvZGF0YU9wdGlvbnMudHNtYXBcXFwiLFxcXCJwYXJlbnRGcmFnbWVudElEXFxcIjpcXFwiZEJ0N0pOMXZ0XFxcIixcXFwiY2hhcnRLZXlcXFwiOlxcXCJjdjFUUmwwMXJmXFxcIixcXFwib3B0aW9uc1xcXCI6W119fSAtLT5cclxuXHJcbiAgICAgICAgICAgICAgICA8aDQgaWQ9XFxcIm9wdGlvbi0xLXNvbHV0aW9uXFxcIj5PcHRpb24gMSBzb2x1dGlvbjwvaDQ+XHJcbiAgICAgICAgICAgICAgICA8cD5PcHRpb24gMSBzb2x1dGlvbjwvcD5cclxuICAgICAgICAqL1xyXG5cclxuICAgICAgICBjb25zdCBsaW5lcyA9IHJlc3BvbnNlLnNwbGl0KCdcXG4nKTtcclxuICAgICAgICBjb25zdCByZW5kZXJDb21tZW50U3RhcnQgPSBgPCEtLSAke2dGaWxlQ29uc3RhbnRzLmZyYWdtZW50UmVuZGVyQ29tbWVudFRhZ31gO1xyXG4gICAgICAgIGNvbnN0IHJlbmRlckNvbW1lbnRFbmQgPSBgIC0tPmA7XHJcbiAgICAgICAgbGV0IGZyYWdtZW50UmVuZGVyQ29tbWVudDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgICAgICAgbGV0IGxpbmU6IHN0cmluZztcclxuICAgICAgICBsZXQgYnVpbGRWYWx1ZSA9IGZhbHNlO1xyXG4gICAgICAgIGxldCB2YWx1ZSA9ICcnO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICBsaW5lID0gbGluZXNbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAoYnVpbGRWYWx1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhbHVlID0gYCR7dmFsdWV9XHJcbiR7bGluZX1gO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgocmVuZGVyQ29tbWVudFN0YXJ0KSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGZyYWdtZW50UmVuZGVyQ29tbWVudCA9IGxpbmUuc3Vic3RyaW5nKHJlbmRlckNvbW1lbnRTdGFydC5sZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgYnVpbGRWYWx1ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghZnJhZ21lbnRSZW5kZXJDb21tZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZyYWdtZW50UmVuZGVyQ29tbWVudCA9IGZyYWdtZW50UmVuZGVyQ29tbWVudC50cmltKCk7XHJcblxyXG4gICAgICAgIGlmIChmcmFnbWVudFJlbmRlckNvbW1lbnQuZW5kc1dpdGgocmVuZGVyQ29tbWVudEVuZCkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IGZyYWdtZW50UmVuZGVyQ29tbWVudC5sZW5ndGggLSByZW5kZXJDb21tZW50RW5kLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIGZyYWdtZW50UmVuZGVyQ29tbWVudCA9IGZyYWdtZW50UmVuZGVyQ29tbWVudC5zdWJzdHJpbmcoXHJcbiAgICAgICAgICAgICAgICAwLFxyXG4gICAgICAgICAgICAgICAgbGVuZ3RoXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmcmFnbWVudFJlbmRlckNvbW1lbnQgPSBmcmFnbWVudFJlbmRlckNvbW1lbnQudHJpbSgpO1xyXG4gICAgICAgIGxldCByYXdGcmFnbWVudDogYW55IHwgbnVsbCA9IG51bGw7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJhd0ZyYWdtZW50ID0gSlNPTi5wYXJzZShmcmFnbWVudFJlbmRlckNvbW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJhd0ZyYWdtZW50LnZhbHVlID0gdmFsdWU7XHJcblxyXG4gICAgICAgIHJldHVybiByYXdGcmFnbWVudDtcclxuICAgIH0sXHJcblxyXG4gICAgbWFya09wdGlvbnNFeHBhbmRlZDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5yZXNldEZyYWdtZW50VWlzKHN0YXRlKTtcclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS51aS5vcHRpb25zRXhwYW5kZWQgPSB0cnVlO1xyXG4gICAgICAgIGZyYWdtZW50LnVpLmZyYWdtZW50T3B0aW9uc0V4cGFuZGVkID0gdHJ1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgY29sbGFwc2VGcmFnbWVudHNPcHRpb25zOiAoZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIWZyYWdtZW50XHJcbiAgICAgICAgICAgIHx8IGZyYWdtZW50Lm9wdGlvbnMubGVuZ3RoID09PSAwXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIGZyYWdtZW50Lm9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIG9wdGlvbi51aS5mcmFnbWVudE9wdGlvbnNFeHBhbmRlZCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2hvd09wdGlvbk5vZGU6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNvbGxhcHNlRnJhZ21lbnRzT3B0aW9ucyhmcmFnbWVudCk7XHJcbiAgICAgICAgb3B0aW9uLnVpLmZyYWdtZW50T3B0aW9uc0V4cGFuZGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUuc2V0Q3VycmVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlc2V0RnJhZ21lbnRVaXM6IChzdGF0ZTogSVN0YXRlKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGNoYWluRnJhZ21lbnRzID0gc3RhdGUucmVuZGVyU3RhdGUuaW5kZXhfY2hhaW5GcmFnbWVudHNfaWQ7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgcHJvcE5hbWUgaW4gY2hhaW5GcmFnbWVudHMpIHtcclxuXHJcbiAgICAgICAgICAgIGdGcmFnbWVudENvZGUucmVzZXRGcmFnbWVudFVpKGNoYWluRnJhZ21lbnRzW3Byb3BOYW1lXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZXNldEZyYWdtZW50VWk6IChmcmFnbWVudDogSVJlbmRlckZyYWdtZW50KTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGZyYWdtZW50LnVpLmZyYWdtZW50T3B0aW9uc0V4cGFuZGVkID0gZmFsc2U7XHJcbiAgICAgICAgZnJhZ21lbnQudWkuZG9Ob3RQYWludCA9IGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZXRBbmNpbGxhcnlBY3RpdmU6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGFuY2lsbGFyeTogSVJlbmRlckZyYWdtZW50IHwgbnVsbFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLmFjdGl2ZUFuY2lsbGFyeSA9IGFuY2lsbGFyeTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJBbmNpbGxhcnlBY3RpdmU6IChzdGF0ZTogSVN0YXRlKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLmFjdGl2ZUFuY2lsbGFyeSA9IG51bGw7XHJcbiAgICB9LFxyXG5cclxuICAgIHNwbGl0T3B0aW9uc0FuZEFuY2lsbGFyaWVzOiAoY2hpbGRyZW46IEFycmF5PElSZW5kZXJGcmFnbWVudD4gfCBudWxsIHwgdW5kZWZpbmVkKTogeyBvcHRpb25zOiBBcnJheTxJUmVuZGVyRnJhZ21lbnQ+LCBhbmNpbGxhcmllczogQXJyYXk8SVJlbmRlckZyYWdtZW50PiwgdG90YWw6IG51bWJlciB9ID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgYW5jaWxsYXJpZXM6IEFycmF5PElSZW5kZXJGcmFnbWVudD4gPSBbXTtcclxuICAgICAgICBjb25zdCBvcHRpb25zOiBBcnJheTxJUmVuZGVyRnJhZ21lbnQ+ID0gW107XHJcbiAgICAgICAgbGV0IG9wdGlvbjogSVJlbmRlckZyYWdtZW50O1xyXG5cclxuICAgICAgICBpZiAoIWNoaWxkcmVuKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGFuY2lsbGFyaWVzLFxyXG4gICAgICAgICAgICAgICAgdG90YWw6IDBcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIG9wdGlvbiA9IGNoaWxkcmVuW2ldIGFzIElSZW5kZXJGcmFnbWVudDtcclxuXHJcbiAgICAgICAgICAgIGlmICghb3B0aW9uLmlzQW5jaWxsYXJ5KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5wdXNoKG9wdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhbmNpbGxhcmllcy5wdXNoKG9wdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG9wdGlvbnMsXHJcbiAgICAgICAgICAgIGFuY2lsbGFyaWVzLFxyXG4gICAgICAgICAgICB0b3RhbDogY2hpbGRyZW4ubGVuZ3RoXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0Q3VycmVudDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlY3Rpb24gPSBmcmFnbWVudC5zZWN0aW9uO1xyXG5cclxuICAgICAgICBsZXQgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfY2hhaW5GcmFnbWVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgICAgICBmcmFnbWVudC5wYXJlbnRGcmFnbWVudElEXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHBhcmVudC5pZCA9PT0gZnJhZ21lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXJlbnQgYW5kIEZyYWdtZW50IGFyZSB0aGUgc2FtZVwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcGFyZW50LnNlbGVjdGVkID0gZnJhZ21lbnQ7XHJcbiAgICAgICAgICAgIGZyYWdtZW50LnVpLnNlY3Rpb25JbmRleCA9IHBhcmVudC51aS5zZWN0aW9uSW5kZXggKyAxO1xyXG5cclxuICAgICAgICAgICAgY2xlYXJTaWJsaW5nQ2hhaW5zKFxyXG4gICAgICAgICAgICAgICAgcGFyZW50LFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcmVudEZyYWdtZW50IHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VjdGlvbi5jdXJyZW50ID0gZnJhZ21lbnQ7XHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jaGVja1NlbGVjdGVkKGZyYWdtZW50KTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0UG9kQ3VycmVudDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlY3Rpb24gPSBmcmFnbWVudC5zZWN0aW9uO1xyXG5cclxuICAgICAgICBsZXQgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfY2hhaW5GcmFnbWVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgICAgICBmcmFnbWVudC5wYXJlbnRGcmFnbWVudElEXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHBhcmVudC5pZCA9PT0gZnJhZ21lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXJlbnQgYW5kIEZyYWdtZW50IGFyZSB0aGUgc2FtZVwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcGFyZW50LnNlbGVjdGVkID0gZnJhZ21lbnQ7XHJcbiAgICAgICAgICAgIGZyYWdtZW50LnVpLnNlY3Rpb25JbmRleCA9IHBhcmVudC51aS5zZWN0aW9uSW5kZXggKyAxO1xyXG5cclxuICAgICAgICAgICAgY2xlYXJTaWJsaW5nQ2hhaW5zKFxyXG4gICAgICAgICAgICAgICAgcGFyZW50LFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcmVudEZyYWdtZW50IHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2VjdGlvbi5jdXJyZW50ID0gZnJhZ21lbnQ7XHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jaGVja1NlbGVjdGVkKGZyYWdtZW50KTtcclxuICAgIH0sXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnRnJhZ21lbnRDb2RlO1xyXG5cclxuIiwiaW1wb3J0IGdGcmFnbWVudEFjdGlvbnMgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9hY3Rpb25zL2dGcmFnbWVudEFjdGlvbnNcIjtcclxuaW1wb3J0IGdGcmFnbWVudENvZGUgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9jb2RlL2dGcmFnbWVudENvZGVcIjtcclxuaW1wb3J0IGdTdGF0ZUNvZGUgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9jb2RlL2dTdGF0ZUNvZGVcIjtcclxuaW1wb3J0IElEaXNwbGF5Q2hhcnQgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheUNoYXJ0XCI7XHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBJU3RhdGVBbnlBcnJheSBmcm9tIFwiLi4vLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVBbnlBcnJheVwiO1xyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IElGcmFnbWVudFBheWxvYWQgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvdWkvcGF5bG9hZHMvSUZyYWdtZW50UGF5bG9hZFwiO1xyXG5cclxuXHJcbmNvbnN0IGhpZGVGcm9tUGFpbnQgPSAoXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCxcclxuICAgIGhpZGU6IGJvb2xlYW5cclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgLyogXHJcbiAgICAgICAgVGhpcyBpcyBhIGZpeCBmb3I6XHJcbiAgICAgICAgTm90Rm91bmRFcnJvcjogRmFpbGVkIHRvIGV4ZWN1dGUgJ2luc2VydEJlZm9yZScgb24gJ05vZGUnOiBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggdGhlIG5ldyBub2RlIGlzIHRvIGJlIGluc2VydGVkIGlzIG5vdCBhIGNoaWxkIG9mIHRoaXMgbm9kZS5cclxuICAgICovXHJcblxyXG4gICAgaWYgKCFmcmFnbWVudCkge1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGZyYWdtZW50LnVpLmRvTm90UGFpbnQgPSBoaWRlO1xyXG5cclxuICAgIGhpZGVGcm9tUGFpbnQoXHJcbiAgICAgICAgZnJhZ21lbnQuc2VsZWN0ZWQsXHJcbiAgICAgICAgaGlkZVxyXG4gICAgKTtcclxuXHJcbiAgICBoaWRlRnJvbVBhaW50KFxyXG4gICAgICAgIGZyYWdtZW50Lmxpbms/LnJvb3QsXHJcbiAgICAgICAgaGlkZVxyXG4gICAgKTtcclxufVxyXG5cclxuY29uc3QgaGlkZU9wdGlvbnNGcm9tUGFpbnQgPSAoXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCxcclxuICAgIGhpZGU6IGJvb2xlYW5cclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgLyogXHJcbiAgICAgICAgVGhpcyBpcyBhIGZpeCBmb3I6XHJcbiAgICAgICAgTm90Rm91bmRFcnJvcjogRmFpbGVkIHRvIGV4ZWN1dGUgJ2luc2VydEJlZm9yZScgb24gJ05vZGUnOiBUaGUgbm9kZSBiZWZvcmUgd2hpY2ggdGhlIG5ldyBub2RlIGlzIHRvIGJlIGluc2VydGVkIGlzIG5vdCBhIGNoaWxkIG9mIHRoaXMgbm9kZS5cclxuICAgICovXHJcbiAgICBpZiAoIWZyYWdtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2YgZnJhZ21lbnQ/Lm9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaGlkZUZyb21QYWludChcclxuICAgICAgICAgICAgb3B0aW9uLFxyXG4gICAgICAgICAgICBoaWRlXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBoaWRlU2VjdGlvblBhcmVudFNlbGVjdGVkKFxyXG4gICAgICAgIGZyYWdtZW50LnNlY3Rpb24gYXMgSURpc3BsYXlDaGFydCxcclxuICAgICAgICBoaWRlXHJcbiAgICApO1xyXG59XHJcblxyXG5jb25zdCBoaWRlU2VjdGlvblBhcmVudFNlbGVjdGVkID0gKFxyXG4gICAgZGlzcGxheUNoYXJ0OiBJRGlzcGxheUNoYXJ0LFxyXG4gICAgaGlkZTogYm9vbGVhblxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoIWRpc3BsYXlDaGFydD8ucGFyZW50KSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGhpZGVGcm9tUGFpbnQoXHJcbiAgICAgICAgZGlzcGxheUNoYXJ0LnBhcmVudC5zZWxlY3RlZCxcclxuICAgICAgICBoaWRlXHJcbiAgICApO1xyXG5cclxuICAgIGhpZGVTZWN0aW9uUGFyZW50U2VsZWN0ZWQoXHJcbiAgICAgICAgZGlzcGxheUNoYXJ0LnBhcmVudC5zZWN0aW9uIGFzIElEaXNwbGF5Q2hhcnQsXHJcbiAgICAgICAgaGlkZVxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IGZyYWdtZW50QWN0aW9ucyA9IHtcclxuXHJcbiAgICBleHBhbmRPcHRpb25zOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGVcclxuICAgICAgICAgICAgfHwgIWZyYWdtZW50XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGlnbm9yZUV2ZW50ID0gc3RhdGUucmVuZGVyU3RhdGUuYWN0aXZlQW5jaWxsYXJ5ICE9IG51bGw7XHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jbGVhckFuY2lsbGFyeUFjdGl2ZShzdGF0ZSk7XHJcblxyXG4gICAgICAgIGlmIChpZ25vcmVFdmVudCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnU3RhdGVDb2RlLnNldERpcnR5KHN0YXRlKTtcclxuICAgICAgICBnRnJhZ21lbnRDb2RlLnJlc2V0RnJhZ21lbnRVaXMoc3RhdGUpO1xyXG4gICAgICAgIGNvbnN0IGV4cGFuZGVkID0gZnJhZ21lbnQudWkuZnJhZ21lbnRPcHRpb25zRXhwYW5kZWQgIT09IHRydWU7XHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUudWkub3B0aW9uc0V4cGFuZGVkID0gZXhwYW5kZWQ7XHJcbiAgICAgICAgZnJhZ21lbnQudWkuZnJhZ21lbnRPcHRpb25zRXhwYW5kZWQgPSBleHBhbmRlZDtcclxuXHJcbiAgICAgICAgaGlkZU9wdGlvbnNGcm9tUGFpbnQoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhpZGVPcHRpb25zOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGVcclxuICAgICAgICAgICAgfHwgIWZyYWdtZW50XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGlnbm9yZUV2ZW50ID0gc3RhdGUucmVuZGVyU3RhdGUuYWN0aXZlQW5jaWxsYXJ5ICE9IG51bGw7XHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jbGVhckFuY2lsbGFyeUFjdGl2ZShzdGF0ZSk7XHJcblxyXG4gICAgICAgIGlmIChpZ25vcmVFdmVudCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnU3RhdGVDb2RlLnNldERpcnR5KHN0YXRlKTtcclxuICAgICAgICBnRnJhZ21lbnRDb2RlLnJlc2V0RnJhZ21lbnRVaXMoc3RhdGUpO1xyXG4gICAgICAgIGZyYWdtZW50LnVpLmZyYWdtZW50T3B0aW9uc0V4cGFuZGVkID0gZmFsc2U7XHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUudWkub3B0aW9uc0V4cGFuZGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGhpZGVPcHRpb25zRnJvbVBhaW50KFxyXG4gICAgICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICAgICAgZmFsc2VcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2hvd09wdGlvbk5vZGU6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHBheWxvYWQ6IElGcmFnbWVudFBheWxvYWRcclxuICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFzdGF0ZVxyXG4gICAgICAgICAgICB8fCAhcGF5bG9hZD8ucGFyZW50RnJhZ21lbnRcclxuICAgICAgICAgICAgfHwgIXBheWxvYWQ/Lm9wdGlvblxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpZ25vcmVFdmVudCA9IHN0YXRlLnJlbmRlclN0YXRlLmFjdGl2ZUFuY2lsbGFyeSAhPSBudWxsO1xyXG4gICAgICAgIGdGcmFnbWVudENvZGUuY2xlYXJBbmNpbGxhcnlBY3RpdmUoc3RhdGUpO1xyXG5cclxuICAgICAgICBpZiAoaWdub3JlRXZlbnQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5zZXREaXJ0eShzdGF0ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBnRnJhZ21lbnRBY3Rpb25zLnNob3dPcHRpb25Ob2RlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcGF5bG9hZC5wYXJlbnRGcmFnbWVudCxcclxuICAgICAgICAgICAgcGF5bG9hZC5vcHRpb25cclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b2dnbGVBbmNpbGxhcnlOb2RlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBwYXlsb2FkOiBJRnJhZ21lbnRQYXlsb2FkXHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGFuY2lsbGFyeSA9IHBheWxvYWQub3B0aW9uO1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLnNldEFuY2lsbGFyeUFjdGl2ZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGFuY2lsbGFyeVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChhbmNpbGxhcnkpIHtcclxuXHJcbiAgICAgICAgICAgIGdTdGF0ZUNvZGUuc2V0RGlydHkoc3RhdGUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFhbmNpbGxhcnkudWkuYW5jaWxsYXJ5RXhwYW5kZWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBhbmNpbGxhcnkudWkuYW5jaWxsYXJ5RXhwYW5kZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBnRnJhZ21lbnRBY3Rpb25zLnNob3dBbmNpbGxhcnlOb2RlKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGFuY2lsbGFyeVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYW5jaWxsYXJ5LnVpLmFuY2lsbGFyeUV4cGFuZGVkID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZyYWdtZW50QWN0aW9ucztcclxuIiwiaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBJRnJhZ21lbnRQYXlsb2FkIGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3VpL3BheWxvYWRzL0lGcmFnbWVudFBheWxvYWRcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGcmFnbWVudFBheWxvYWQgaW1wbGVtZW50cyBJRnJhZ21lbnRQYXlsb2FkIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwYXJlbnRGcmFnbWVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50XHJcbiAgICApIHtcclxuXHJcbiAgICAgICAgdGhpcy5wYXJlbnRGcmFnbWVudCA9IHBhcmVudEZyYWdtZW50O1xyXG4gICAgICAgIHRoaXMub3B0aW9uID0gb3B0aW9uO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHBhcmVudEZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQ7XHJcbiAgICBwdWJsaWMgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQ7XHJcbiAgICBwdWJsaWMgZWxlbWVudDogSFRNTEVsZW1lbnQ7XHJcbn1cclxuIiwiaW1wb3J0IHsgQ2hpbGRyZW4sIFZOb2RlIH0gZnJvbSBcImh5cGVyLWFwcC1sb2NhbFwiO1xyXG5pbXBvcnQgeyBoIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2h5cGVyQXBwL2h5cGVyLWFwcC1sb2NhbFwiO1xyXG5cclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBmcmFnbWVudFZpZXdzIGZyb20gXCIuL2ZyYWdtZW50Vmlld3NcIjtcclxuaW1wb3J0IGdGcmFnbWVudENvZGUgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9jb2RlL2dGcmFnbWVudENvZGVcIjtcclxuaW1wb3J0IG9wdGlvbnNWaWV3cyBmcm9tIFwiLi9vcHRpb25zVmlld3NcIjtcclxuXHJcblxyXG5jb25zdCBidWlsZFBvZERpc2N1c3Npb25WaWV3ID0gKFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIHZpZXdzOiBDaGlsZHJlbltdXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGxldCBhZGp1c3RGb3JDb2xsYXBzZWRPcHRpb25zID0gZmFsc2U7XHJcbiAgICBsZXQgYWRqdXN0Rm9yUHJpb3JBbmNpbGxhcmllcyA9IGZhbHNlO1xyXG4gICAgY29uc3Qgdmlld3NMZW5ndGggPSB2aWV3cy5sZW5ndGg7XHJcblxyXG4gICAgaWYgKHZpZXdzTGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICBjb25zdCBsYXN0VmlldzogYW55ID0gdmlld3Nbdmlld3NMZW5ndGggLSAxXTtcclxuXHJcbiAgICAgICAgaWYgKGxhc3RWaWV3Py51aT8uaXNDb2xsYXBzZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGFkanVzdEZvckNvbGxhcHNlZE9wdGlvbnMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxhc3RWaWV3Py51aT8uaGFzQW5jaWxsYXJpZXMgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGFkanVzdEZvclByaW9yQW5jaWxsYXJpZXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBsaW5rRUxlbWVudElEID0gZ0ZyYWdtZW50Q29kZS5nZXRMaW5rRWxlbWVudElEKGZyYWdtZW50LmlkKTtcclxuICAgIGNvbnN0IHJlc3VsdHM6IHsgdmlld3M6IENoaWxkcmVuW10sIG9wdGlvbnNDb2xsYXBzZWQ6IGJvb2xlYW4sIGhhc0FuY2lsbGFyaWVzOiBib29sZWFuIH0gPSBvcHRpb25zVmlld3MuYnVpbGRWaWV3KGZyYWdtZW50KTtcclxuXHJcbiAgICBpZiAobGlua0VMZW1lbnRJRCA9PT0gJ250X2xrX2ZyYWdfdDk2OE9KMXdvJykge1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhgUi1EUkFXSU5HICR7bGlua0VMZW1lbnRJRH1fZGApO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBjbGFzc2VzID0gXCJudC1mci1mcmFnbWVudC1ib3hcIjtcclxuXHJcbiAgICBpZiAoZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICBpZiAoZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICAgICAgZm9yIChjb25zdCBjbGFzc05hbWUgb2YgZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICAgICAgICAgIGNsYXNzZXMgPSBgJHtjbGFzc2VzfSBudC11ci0ke2NsYXNzTmFtZX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFkanVzdEZvckNvbGxhcHNlZE9wdGlvbnMgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgY2xhc3NlcyA9IGAke2NsYXNzZXN9IG50LWZyLXByaW9yLWNvbGxhcHNlZC1vcHRpb25zYFxyXG4gICAgfVxyXG5cclxuICAgIGlmIChhZGp1c3RGb3JQcmlvckFuY2lsbGFyaWVzID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIGNsYXNzZXMgPSBgJHtjbGFzc2VzfSBudC1mci1wcmlvci1pcy1hbmNpbGxhcnlgXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdmlldyA9XHJcblxyXG4gICAgICAgIGgoXCJkaXZcIixcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWQ6IGAke2xpbmtFTGVtZW50SUR9X2RgLFxyXG4gICAgICAgICAgICAgICAgY2xhc3M6IGAke2NsYXNzZXN9YFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICBoKFwiZGl2XCIsXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzczogYG50LWZyLWZyYWdtZW50LWRpc2N1c3Npb25gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGEtZGlzY3Vzc2lvblwiOiBmcmFnbWVudC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJcIlxyXG4gICAgICAgICAgICAgICAgKSxcclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHRzLnZpZXdzXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICApO1xyXG5cclxuICAgIGlmIChyZXN1bHRzLm9wdGlvbnNDb2xsYXBzZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgY29uc3Qgdmlld0FueSA9IHZpZXcgYXMgYW55O1xyXG5cclxuICAgICAgICBpZiAoIXZpZXdBbnkudWkpIHtcclxuXHJcbiAgICAgICAgICAgIHZpZXdBbnkudWkgPSB7fTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZpZXdBbnkudWkuaXNDb2xsYXBzZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXN1bHRzLmhhc0FuY2lsbGFyaWVzID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXdBbnkgPSB2aWV3IGFzIGFueTtcclxuXHJcbiAgICAgICAgaWYgKCF2aWV3QW55LnVpKSB7XHJcblxyXG4gICAgICAgICAgICB2aWV3QW55LnVpID0ge307XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2aWV3QW55LnVpLmhhc0FuY2lsbGFyaWVzID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB2aWV3cy5wdXNoKHZpZXcpO1xyXG59O1xyXG5cclxuY29uc3QgYnVpbGRWaWV3ID0gKGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQpOiBDaGlsZHJlbltdID0+IHtcclxuXHJcbiAgICBjb25zdCB2aWV3czogQ2hpbGRyZW5bXSA9IFtdO1xyXG5cclxuICAgIGJ1aWxkUG9kRGlzY3Vzc2lvblZpZXcoXHJcbiAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgdmlld3NcclxuICAgICk7XHJcblxyXG4gICAgZnJhZ21lbnRWaWV3cy5idWlsZFZpZXcoXHJcbiAgICAgICAgZnJhZ21lbnQuc2VsZWN0ZWQsXHJcbiAgICAgICAgdmlld3NcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHZpZXdzO1xyXG59O1xyXG5cclxuY29uc3QgcG9kVmlld3MgPSB7XHJcblxyXG4gICAgYnVpbGRWaWV3OiAoXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsIHwgdW5kZWZpbmVkLFxyXG4gICAgKTogVk5vZGUgfCBudWxsID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFvcHRpb25cclxuICAgICAgICAgICAgfHwgIW9wdGlvbi5wb2Q/LnJvb3RcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB2aWV3ID0gaChcImRpdlwiLCB7IGNsYXNzOiBcIm50LWZyLXBvZC1ib3hcIiB9LFxyXG5cclxuICAgICAgICAgICAgYnVpbGRWaWV3KG9wdGlvbi5wb2Q/LnJvb3QpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHZpZXc7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBwb2RWaWV3cztcclxuXHJcblxyXG4iLCJpbXBvcnQgeyBDaGlsZHJlbiwgVk5vZGUgfSBmcm9tIFwiaHlwZXItYXBwLWxvY2FsXCI7XHJcbmltcG9ydCB7IGggfSBmcm9tIFwiLi4vLi4vLi4vLi4vaHlwZXJBcHAvaHlwZXItYXBwLWxvY2FsXCI7XHJcblxyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IGZyYWdtZW50QWN0aW9ucyBmcm9tIFwiLi4vYWN0aW9ucy9mcmFnbWVudEFjdGlvbnNcIjtcclxuaW1wb3J0IEZyYWdtZW50UGF5bG9hZCBmcm9tIFwiLi4vLi4vLi4vc3RhdGUvdWkvcGF5bG9hZHMvRnJhZ21lbnRQYXlsb2FkXCI7XHJcbmltcG9ydCBVIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvZ1V0aWxpdGllc1wiO1xyXG5pbXBvcnQgZnJhZ21lbnRWaWV3cyBmcm9tIFwiLi9mcmFnbWVudFZpZXdzXCI7XHJcbmltcG9ydCBnRnJhZ21lbnRDb2RlIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvY29kZS9nRnJhZ21lbnRDb2RlXCI7XHJcbmltcG9ydCBwb2RWaWV3cyBmcm9tIFwiLi9wb2RWaWV3c1wiO1xyXG5cclxuXHJcbmNvbnN0IGJ1aWxkQW5jaWxsYXJ5RGlzY3Vzc2lvblZpZXcgPSAoYW5jaWxsYXJ5OiBJUmVuZGVyRnJhZ21lbnQpOiBDaGlsZHJlbltdID0+IHtcclxuXHJcbiAgICBpZiAoIWFuY2lsbGFyeS51aS5hbmNpbGxhcnlFeHBhbmRlZCkge1xyXG5cclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdmlldzogQ2hpbGRyZW5bXSA9IFtdO1xyXG5cclxuICAgIGZyYWdtZW50Vmlld3MuYnVpbGRWaWV3KFxyXG4gICAgICAgIGFuY2lsbGFyeSxcclxuICAgICAgICB2aWV3XHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiB2aWV3O1xyXG59XHJcblxyXG5jb25zdCBidWlsZEV4cGFuZGVkQW5jaWxsYXJ5VmlldyA9IChcclxuICAgIHBhcmVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgYW5jaWxsYXJ5OiBJUmVuZGVyRnJhZ21lbnRcclxuKTogVk5vZGUgfCBudWxsID0+IHtcclxuXHJcbiAgICBpZiAoIWFuY2lsbGFyeVxyXG4gICAgICAgIHx8ICFhbmNpbGxhcnkuaXNBbmNpbGxhcnkpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdmlldzogVk5vZGUgPVxyXG5cclxuICAgICAgICBoKFwiZGl2XCIsIHsgY2xhc3M6IFwibnQtZnItYW5jaWxsYXJ5LWJveFwiIH0sIFtcclxuICAgICAgICAgICAgaChcImRpdlwiLCB7IGNsYXNzOiBcIm50LWZyLWFuY2lsbGFyeS1oZWFkXCIgfSwgW1xyXG4gICAgICAgICAgICAgICAgaChcImFcIixcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiBcIm50LWZyLWFuY2lsbGFyeSBudC1mci1hbmNpbGxhcnktdGFyZ2V0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VEb3duOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFnbWVudEFjdGlvbnMudG9nZ2xlQW5jaWxsYXJ5Tm9kZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0YXJnZXQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRnJhZ21lbnRQYXlsb2FkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuY2lsbGFyeSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKFwic3BhblwiLCB7IGNsYXNzOiBcIm50LWZyLWFuY2lsbGFyeS10ZXh0IG50LWZyLWFuY2lsbGFyeS10YXJnZXRcIiB9LCBhbmNpbGxhcnkub3B0aW9uKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaChcInNwYW5cIiwgeyBjbGFzczogXCJudC1mci1hbmNpbGxhcnkteCBudC1mci1hbmNpbGxhcnktdGFyZ2V0XCIgfSwgJ+KclScpXHJcbiAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICBdKSxcclxuXHJcbiAgICAgICAgICAgIGJ1aWxkQW5jaWxsYXJ5RGlzY3Vzc2lvblZpZXcoYW5jaWxsYXJ5KVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgIHJldHVybiB2aWV3O1xyXG59XHJcblxyXG5jb25zdCBidWlsZENvbGxhcHNlZEFuY2lsbGFyeVZpZXcgPSAoXHJcbiAgICBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIGFuY2lsbGFyeTogSVJlbmRlckZyYWdtZW50XHJcbik6IFZOb2RlIHwgbnVsbCA9PiB7XHJcblxyXG4gICAgaWYgKCFhbmNpbGxhcnlcclxuICAgICAgICB8fCAhYW5jaWxsYXJ5LmlzQW5jaWxsYXJ5KSB7XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXc6IFZOb2RlID1cclxuXHJcbiAgICAgICAgaChcImRpdlwiLCB7IGNsYXNzOiBcIm50LWZyLWFuY2lsbGFyeS1ib3ggbnQtZnItY29sbGFwc2VkXCIgfSwgW1xyXG4gICAgICAgICAgICBoKFwiZGl2XCIsIHsgY2xhc3M6IFwibnQtZnItYW5jaWxsYXJ5LWhlYWRcIiB9LCBbXHJcbiAgICAgICAgICAgICAgICBoKFwiYVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6IFwibnQtZnItYW5jaWxsYXJ5IG50LWZyLWFuY2lsbGFyeS10YXJnZXRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZURvd246IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50QWN0aW9ucy50b2dnbGVBbmNpbGxhcnlOb2RlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRhcmdldDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGcmFnbWVudFBheWxvYWQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5jaWxsYXJ5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoXCJzcGFuXCIsIHsgY2xhc3M6IFwibnQtZnItYW5jaWxsYXJ5LXRhcmdldFwiIH0sIGFuY2lsbGFyeS5vcHRpb24pXHJcbiAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICBdKVxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgIHJldHVybiB2aWV3O1xyXG59XHJcblxyXG5jb25zdCBCdWlsZEFuY2lsbGFyeVZpZXcgPSAoXHJcbiAgICBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIGFuY2lsbGFyeTogSVJlbmRlckZyYWdtZW50XHJcbik6IFZOb2RlIHwgbnVsbCA9PiB7XHJcblxyXG4gICAgaWYgKCFhbmNpbGxhcnlcclxuICAgICAgICB8fCAhYW5jaWxsYXJ5LmlzQW5jaWxsYXJ5KSB7XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhbmNpbGxhcnkudWkuYW5jaWxsYXJ5RXhwYW5kZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkRXhwYW5kZWRBbmNpbGxhcnlWaWV3KFxyXG4gICAgICAgICAgICBwYXJlbnQsXHJcbiAgICAgICAgICAgIGFuY2lsbGFyeVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGJ1aWxkQ29sbGFwc2VkQW5jaWxsYXJ5VmlldyhcclxuICAgICAgICBwYXJlbnQsXHJcbiAgICAgICAgYW5jaWxsYXJ5XHJcbiAgICApO1xyXG59XHJcblxyXG5jb25zdCBCdWlsZEV4cGFuZGVkT3B0aW9uVmlldyA9IChcclxuICAgIHBhcmVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnRcclxuKTogVk5vZGUgfCBudWxsID0+IHtcclxuXHJcbiAgICBpZiAoIW9wdGlvblxyXG4gICAgICAgIHx8IG9wdGlvbi5pc0FuY2lsbGFyeSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgYnV0dG9uQ2xhc3MgPSBcIm50LWZyLW9wdGlvblwiO1xyXG4gICAgbGV0IGlubmVyVmlldzogVk5vZGUgfCBudWxsO1xyXG5cclxuICAgIGlmIChvcHRpb24ucG9kPy5yb290KSB7XHJcblxyXG4gICAgICAgIGJ1dHRvbkNsYXNzID0gYCR7YnV0dG9uQ2xhc3N9IG50LWZyLXBvZC1idXR0b25gO1xyXG4gICAgICAgIGlubmVyVmlldyA9IHBvZFZpZXdzLmJ1aWxkVmlldyhvcHRpb24pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaW5uZXJWaWV3ID0gaChcInNwYW5cIiwgeyBjbGFzczogXCJudC1mci1vcHRpb24tdGV4dFwiIH0sIG9wdGlvbi5vcHRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXc6IFZOb2RlID1cclxuXHJcbiAgICAgICAgaChcImRpdlwiLCB7IGNsYXNzOiBcIm50LWZyLW9wdGlvbi1ib3hcIiB9LFxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICBoKFwiYVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6IGAke2J1dHRvbkNsYXNzfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VEb3duOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFnbWVudEFjdGlvbnMuc2hvd09wdGlvbk5vZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGFyZ2V0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZyYWdtZW50UGF5bG9hZChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5uZXJWaWV3XHJcbiAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICByZXR1cm4gdmlldztcclxufVxyXG5cclxuY29uc3QgYnVpbGRFeHBhbmRlZE9wdGlvbnNWaWV3ID0gKFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIG9wdGlvbnM6IEFycmF5PElSZW5kZXJGcmFnbWVudD5cclxuKTogeyB2aWV3OiBWTm9kZSwgaXNDb2xsYXBzZWQ6IGJvb2xlYW4gfSB8IG51bGwgPT4ge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvblZpZXdzOiBDaGlsZHJlbltdID0gW107XHJcbiAgICBsZXQgb3B0aW9uVmV3OiBWTm9kZSB8IG51bGw7XHJcblxyXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygb3B0aW9ucykge1xyXG5cclxuICAgICAgICBvcHRpb25WZXcgPSBCdWlsZEV4cGFuZGVkT3B0aW9uVmlldyhcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25WZXcpIHtcclxuXHJcbiAgICAgICAgICAgIG9wdGlvblZpZXdzLnB1c2gob3B0aW9uVmV3KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG9wdGlvbnNDbGFzc2VzID0gXCJudC1mci1mcmFnbWVudC1vcHRpb25zXCI7XHJcblxyXG4gICAgaWYgKGZyYWdtZW50LnNlbGVjdGVkKSB7XHJcblxyXG4gICAgICAgIG9wdGlvbnNDbGFzc2VzID0gYCR7b3B0aW9uc0NsYXNzZXN9IG50LWZyLWZyYWdtZW50LWNoYWluYFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXc6IFZOb2RlID1cclxuXHJcbiAgICAgICAgaChcImRpdlwiLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogYCR7b3B0aW9uc0NsYXNzZXN9YCxcclxuICAgICAgICAgICAgICAgIHRhYmluZGV4OiAwLFxyXG4gICAgICAgICAgICAgICAgb25CbHVyOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRBY3Rpb25zLmhpZGVPcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgICAgIChfZXZlbnQ6IGFueSkgPT4gZnJhZ21lbnRcclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIG9wdGlvblZpZXdzXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHZpZXcsXHJcbiAgICAgICAgaXNDb2xsYXBzZWQ6IGZhbHNlXHJcbiAgICB9O1xyXG59O1xyXG5cclxuY29uc3QgYnVpbGRFeHBhbmRlZE9wdGlvbnNCb3hWaWV3ID0gKFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIG9wdGlvbnM6IEFycmF5PElSZW5kZXJGcmFnbWVudD4sXHJcbiAgICBmcmFnbWVudEVMZW1lbnRJRDogc3RyaW5nLFxyXG4gICAgdmlld3M6IENoaWxkcmVuW11cclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9uc1ZpZXcgPSBidWlsZEV4cGFuZGVkT3B0aW9uc1ZpZXcoXHJcbiAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgb3B0aW9uc1xyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoIW9wdGlvbnNWaWV3KSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBjbGFzc2VzID0gXCJudC1mci1mcmFnbWVudC1ib3hcIjtcclxuXHJcbiAgICBpZiAoZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICBpZiAoZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICAgICAgZm9yIChjb25zdCBjbGFzc05hbWUgb2YgZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICAgICAgICAgIGNsYXNzZXMgPSBgJHtjbGFzc2VzfSBudC11ci0ke2NsYXNzTmFtZX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmlld3MucHVzaChcclxuXHJcbiAgICAgICAgaChcImRpdlwiLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZDogYCR7ZnJhZ21lbnRFTGVtZW50SUR9X2VvYCxcclxuICAgICAgICAgICAgICAgIGNsYXNzOiBgJHtjbGFzc2VzfWBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uc1ZpZXcudmlld1xyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgKVxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkQ29sbGFwc2VkT3B0aW9uc1ZpZXcgPSAoZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCk6IFZOb2RlID0+IHtcclxuXHJcbiAgICBsZXQgYnV0dG9uQ2xhc3MgPSBcIm50LWZyLWZyYWdtZW50LW9wdGlvbnMgbnQtZnItY29sbGFwc2VkXCI7XHJcblxyXG4gICAgaWYgKGZyYWdtZW50LnNlbGVjdGVkPy5wb2Q/LnJvb3QpIHtcclxuXHJcbiAgICAgICAgYnV0dG9uQ2xhc3MgPSBgJHtidXR0b25DbGFzc30gbnQtZnItcG9kLWJ1dHRvbmA7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdmlldzogVk5vZGUgPVxyXG5cclxuICAgICAgICBoKFwiYVwiLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogYCR7YnV0dG9uQ2xhc3N9YCxcclxuICAgICAgICAgICAgICAgIG9uTW91c2VEb3duOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRBY3Rpb25zLmV4cGFuZE9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgKF9ldmVudDogYW55KSA9PiBmcmFnbWVudFxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICBwb2RWaWV3cy5idWlsZFZpZXcoZnJhZ21lbnQuc2VsZWN0ZWQpLFxyXG5cclxuICAgICAgICAgICAgICAgIGgoXCJzcGFuXCIsIHsgY2xhc3M6IGBudC1mci1vcHRpb24tc2VsZWN0ZWRgIH0sIGAke2ZyYWdtZW50LnNlbGVjdGVkPy5vcHRpb259YCksXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICApO1xyXG5cclxuICAgIHJldHVybiB2aWV3O1xyXG59O1xyXG5cclxuY29uc3QgYnVpbGRDb2xsYXBzZWRPcHRpb25zQm94VmlldyA9IChcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICBmcmFnbWVudEVMZW1lbnRJRDogc3RyaW5nLFxyXG4gICAgdmlld3M6IENoaWxkcmVuW11cclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgY29uc3Qgb3B0aW9uVmlldyA9IGJ1aWxkQ29sbGFwc2VkT3B0aW9uc1ZpZXcoZnJhZ21lbnQpO1xyXG5cclxuICAgIGxldCBjbGFzc2VzID0gXCJudC1mci1mcmFnbWVudC1ib3hcIjtcclxuXHJcbiAgICBpZiAoZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICBpZiAoZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICAgICAgZm9yIChjb25zdCBjbGFzc05hbWUgb2YgZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICAgICAgICAgIGNsYXNzZXMgPSBgJHtjbGFzc2VzfSBudC11ci0ke2NsYXNzTmFtZX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdmlldyA9XHJcblxyXG4gICAgICAgIGgoXCJkaXZcIixcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWQ6IGAke2ZyYWdtZW50RUxlbWVudElEfV9jb2AsXHJcbiAgICAgICAgICAgICAgICBjbGFzczogYCR7Y2xhc3Nlc31gXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgIG9wdGlvblZpZXdcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgY29uc3Qgdmlld0FueSA9IHZpZXcgYXMgYW55O1xyXG5cclxuICAgIGlmICghdmlld0FueS51aSkge1xyXG5cclxuICAgICAgICB2aWV3QW55LnVpID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgdmlld0FueS51aS5pc0NvbGxhcHNlZCA9IHRydWU7XHJcbiAgICB2aWV3cy5wdXNoKHZpZXcpO1xyXG59O1xyXG5cclxuY29uc3QgYnVpbGRBbmNpbGxhcmllc1ZpZXcgPSAoXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgYW5jaWxsYXJpZXM6IEFycmF5PElSZW5kZXJGcmFnbWVudD5cclxuKTogVk5vZGUgfCBudWxsID0+IHtcclxuXHJcbiAgICBpZiAoYW5jaWxsYXJpZXMubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGFuY2lsbGFyaWVzVmlld3M6IENoaWxkcmVuW10gPSBbXTtcclxuICAgIGxldCBhbmNpbGxhcnlWaWV3OiBWTm9kZSB8IG51bGw7XHJcblxyXG4gICAgZm9yIChjb25zdCBhbmNpbGxhcnkgb2YgYW5jaWxsYXJpZXMpIHtcclxuXHJcbiAgICAgICAgYW5jaWxsYXJ5VmlldyA9IEJ1aWxkQW5jaWxsYXJ5VmlldyhcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgIGFuY2lsbGFyeVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChhbmNpbGxhcnlWaWV3KSB7XHJcblxyXG4gICAgICAgICAgICBhbmNpbGxhcmllc1ZpZXdzLnB1c2goYW5jaWxsYXJ5Vmlldyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChhbmNpbGxhcmllc1ZpZXdzLmxlbmd0aCA9PT0gMCkge1xyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgYW5jaWxsYXJpZXNDbGFzc2VzID0gXCJudC1mci1mcmFnbWVudC1hbmNpbGxhcmllc1wiO1xyXG5cclxuICAgIGlmIChmcmFnbWVudC5zZWxlY3RlZCkge1xyXG5cclxuICAgICAgICBhbmNpbGxhcmllc0NsYXNzZXMgPSBgJHthbmNpbGxhcmllc0NsYXNzZXN9IG50LWZyLWZyYWdtZW50LWNoYWluYFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXc6IFZOb2RlID1cclxuXHJcbiAgICAgICAgaChcImRpdlwiLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjbGFzczogYCR7YW5jaWxsYXJpZXNDbGFzc2VzfWAsXHJcbiAgICAgICAgICAgICAgICB0YWJpbmRleDogMCxcclxuICAgICAgICAgICAgICAgIC8vIG9uQmx1cjogW1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIGZyYWdtZW50QWN0aW9ucy5oaWRlT3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIC8vICAgICAoX2V2ZW50OiBhbnkpID0+IGZyYWdtZW50XHJcbiAgICAgICAgICAgICAgICAvLyBdXHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBhbmNpbGxhcmllc1ZpZXdzXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICByZXR1cm4gdmlldztcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkQW5jaWxsYXJpZXNCb3hWaWV3ID0gKFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIGFuY2lsbGFyaWVzOiBBcnJheTxJUmVuZGVyRnJhZ21lbnQ+LFxyXG4gICAgZnJhZ21lbnRFTGVtZW50SUQ6IHN0cmluZyxcclxuICAgIHZpZXdzOiBDaGlsZHJlbltdXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGNvbnN0IGFuY2lsbGFyaWVzVmlldyA9IGJ1aWxkQW5jaWxsYXJpZXNWaWV3KFxyXG4gICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgIGFuY2lsbGFyaWVzXHJcbiAgICApO1xyXG5cclxuICAgIGlmICghYW5jaWxsYXJpZXNWaWV3KSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBjbGFzc2VzID0gXCJudC1mci1mcmFnbWVudC1ib3hcIjtcclxuXHJcbiAgICBpZiAoZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICBpZiAoZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICAgICAgZm9yIChjb25zdCBjbGFzc05hbWUgb2YgZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICAgICAgICAgIGNsYXNzZXMgPSBgJHtjbGFzc2VzfSBudC11ci0ke2NsYXNzTmFtZX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgdmlldyA9XHJcblxyXG4gICAgICAgIGgoXCJkaXZcIixcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWQ6IGAke2ZyYWdtZW50RUxlbWVudElEfV9hYCxcclxuICAgICAgICAgICAgICAgIGNsYXNzOiBgJHtjbGFzc2VzfWBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgYW5jaWxsYXJpZXNWaWV3XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICApO1xyXG5cclxuICAgIGNvbnN0IHZpZXdBbnkgPSB2aWV3IGFzIGFueTtcclxuXHJcbiAgICBpZiAoIXZpZXdBbnkudWkpIHtcclxuXHJcbiAgICAgICAgdmlld0FueS51aSA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIHZpZXdBbnkudWkuaGFzQW5jaWxsYXJpZXMgPSB0cnVlO1xyXG4gICAgdmlld3MucHVzaCh2aWV3KTtcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkT3B0aW9uc1ZpZXcgPSAoXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgb3B0aW9uczogQXJyYXk8SVJlbmRlckZyYWdtZW50PlxyXG4pOiB7IHZpZXc6IFZOb2RlLCBpc0NvbGxhcHNlZDogYm9vbGVhbiB9IHwgbnVsbCA9PiB7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLmxlbmd0aCA9PT0gMVxyXG4gICAgICAgICYmIChvcHRpb25zWzBdLm9wdGlvbiA9PT0gJycgLy8gaWYgb3B0aW9uIGlzIGJsYW5rXHJcbiAgICAgICAgICAgIHx8IG9wdGlvbnNbMF0uYXV0b01lcmdlRXhpdCA9PT0gdHJ1ZSkgLy8gaWYgYSBzaW5nbGUgZXhpdFxyXG4gICAgKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGZyYWdtZW50LnNlbGVjdGVkXHJcbiAgICAgICAgJiYgIWZyYWdtZW50LnVpLmZyYWdtZW50T3B0aW9uc0V4cGFuZGVkKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXcgPSBidWlsZENvbGxhcHNlZE9wdGlvbnNWaWV3KGZyYWdtZW50KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdmlldyxcclxuICAgICAgICAgICAgaXNDb2xsYXBzZWQ6IHRydWVcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBidWlsZEV4cGFuZGVkT3B0aW9uc1ZpZXcoXHJcbiAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgb3B0aW9uc1xyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkT3B0aW9uc0JveFZpZXcgPSAoXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgb3B0aW9uczogQXJyYXk8SVJlbmRlckZyYWdtZW50PixcclxuICAgIGZyYWdtZW50RUxlbWVudElEOiBzdHJpbmcsXHJcbiAgICB2aWV3czogQ2hpbGRyZW5bXVxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubGVuZ3RoID09PSAxXHJcbiAgICAgICAgJiYgKG9wdGlvbnNbMF0ub3B0aW9uID09PSAnJyAvLyBpZiBvcHRpb24gaXMgYmxhbmtcclxuICAgICAgICAgICAgfHwgb3B0aW9uc1swXS5hdXRvTWVyZ2VFeGl0ID09PSB0cnVlKSAvLyBpZiBhIHNpbmdsZSBleGl0XHJcbiAgICApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGZyYWdtZW50LnNlbGVjdGVkXHJcbiAgICAgICAgJiYgIWZyYWdtZW50LnVpLmZyYWdtZW50T3B0aW9uc0V4cGFuZGVkKSB7XHJcblxyXG4gICAgICAgIGJ1aWxkQ29sbGFwc2VkT3B0aW9uc0JveFZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgICAgICBmcmFnbWVudEVMZW1lbnRJRCxcclxuICAgICAgICAgICAgdmlld3NcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgYnVpbGRFeHBhbmRlZE9wdGlvbnNCb3hWaWV3KFxyXG4gICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgIG9wdGlvbnMsXHJcbiAgICAgICAgZnJhZ21lbnRFTGVtZW50SUQsXHJcbiAgICAgICAgdmlld3NcclxuICAgICk7XHJcbn07XHJcblxyXG5cclxuY29uc3Qgb3B0aW9uc1ZpZXdzID0ge1xyXG5cclxuICAgIGJ1aWxkVmlldzogKGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQpOiB7IHZpZXdzOiBDaGlsZHJlbltdLCBvcHRpb25zQ29sbGFwc2VkOiBib29sZWFuLCBoYXNBbmNpbGxhcmllczogYm9vbGVhbiB9ID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFmcmFnbWVudC5vcHRpb25zXHJcbiAgICAgICAgICAgIHx8IGZyYWdtZW50Lm9wdGlvbnMubGVuZ3RoID09PSAwXHJcbiAgICAgICAgICAgIHx8ICFVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudC5pS2V5KSAvLyBEb24ndCBkcmF3IG9wdGlvbnMgb2YgbGlua3NcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHZpZXdzOiBbXSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnNDb2xsYXBzZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgaGFzQW5jaWxsYXJpZXM6IGZhbHNlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZnJhZ21lbnQub3B0aW9ucy5sZW5ndGggPT09IDFcclxuICAgICAgICAgICAgJiYgKGZyYWdtZW50Lm9wdGlvbnNbMF0ub3B0aW9uID09PSAnJyAvLyBpZiBvcHRpb24gaXMgYmxhbmtcclxuICAgICAgICAgICAgICAgIHx8IGZyYWdtZW50Lm9wdGlvbnNbMF0uYXV0b01lcmdlRXhpdCA9PT0gdHJ1ZSkgLy8gaWYgYSBzaW5nbGUgZXhpdFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdmlld3M6IFtdLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uc0NvbGxhcHNlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBoYXNBbmNpbGxhcmllczogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG9wdGlvbnNBbmRBbmNpbGxhcmllcyA9IGdGcmFnbWVudENvZGUuc3BsaXRPcHRpb25zQW5kQW5jaWxsYXJpZXMoZnJhZ21lbnQub3B0aW9ucyk7XHJcbiAgICAgICAgbGV0IGhhc0FuY2lsbGFyaWVzID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXdzOiBDaGlsZHJlbltdID0gW1xyXG5cclxuICAgICAgICAgICAgYnVpbGRBbmNpbGxhcmllc1ZpZXcoXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnNBbmRBbmNpbGxhcmllcy5hbmNpbGxhcmllc1xyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGlmICh2aWV3cy5sZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICAgICAgICBoYXNBbmNpbGxhcmllcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBvcHRpb25zVmlld1Jlc3VsdHMgPSBidWlsZE9wdGlvbnNWaWV3KFxyXG4gICAgICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICAgICAgb3B0aW9uc0FuZEFuY2lsbGFyaWVzLm9wdGlvbnNcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9uc1ZpZXdSZXN1bHRzKSB7XHJcblxyXG4gICAgICAgICAgICB2aWV3cy5wdXNoKG9wdGlvbnNWaWV3UmVzdWx0cy52aWV3KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHZpZXdzLFxyXG4gICAgICAgICAgICBvcHRpb25zQ29sbGFwc2VkOiBvcHRpb25zVmlld1Jlc3VsdHM/LmlzQ29sbGFwc2VkID8/IGZhbHNlLFxyXG4gICAgICAgICAgICBoYXNBbmNpbGxhcmllc1xyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGJ1aWxkVmlldzI6IChcclxuICAgICAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIHZpZXdzOiBDaGlsZHJlbltdXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFmcmFnbWVudC5vcHRpb25zXHJcbiAgICAgICAgICAgIHx8IGZyYWdtZW50Lm9wdGlvbnMubGVuZ3RoID09PSAwXHJcbiAgICAgICAgICAgIHx8ICFVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudC5pS2V5KSAvLyBEb24ndCBkcmF3IG9wdGlvbnMgb2YgbGlua3NcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGZyYWdtZW50Lm9wdGlvbnMubGVuZ3RoID09PSAxXHJcbiAgICAgICAgICAgICYmIChmcmFnbWVudC5vcHRpb25zWzBdLm9wdGlvbiA9PT0gJycgLy8gaWYgb3B0aW9uIGlzIGJsYW5rXHJcbiAgICAgICAgICAgICAgICB8fCBmcmFnbWVudC5vcHRpb25zWzBdLmF1dG9NZXJnZUV4aXQgPT09IHRydWUpIC8vIGlmIGEgc2luZ2xlIGV4aXRcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZnJhZ21lbnRFTGVtZW50SUQgPSBnRnJhZ21lbnRDb2RlLmdldEZyYWdtZW50RWxlbWVudElEKGZyYWdtZW50LmlkKTtcclxuICAgICAgICBjb25zdCBvcHRpb25zQW5kQW5jaWxsYXJpZXMgPSBnRnJhZ21lbnRDb2RlLnNwbGl0T3B0aW9uc0FuZEFuY2lsbGFyaWVzKGZyYWdtZW50Lm9wdGlvbnMpO1xyXG5cclxuICAgICAgICBidWlsZEFuY2lsbGFyaWVzQm94VmlldyhcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgIG9wdGlvbnNBbmRBbmNpbGxhcmllcy5hbmNpbGxhcmllcyxcclxuICAgICAgICAgICAgZnJhZ21lbnRFTGVtZW50SUQsXHJcbiAgICAgICAgICAgIHZpZXdzXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgYnVpbGRPcHRpb25zQm94VmlldyhcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgIG9wdGlvbnNBbmRBbmNpbGxhcmllcy5vcHRpb25zLFxyXG4gICAgICAgICAgICBmcmFnbWVudEVMZW1lbnRJRCxcclxuICAgICAgICAgICAgdmlld3NcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgb3B0aW9uc1ZpZXdzO1xyXG5cclxuXHJcbiIsImltcG9ydCB7IENoaWxkcmVuIH0gZnJvbSBcImh5cGVyLWFwcC1sb2NhbFwiO1xyXG5pbXBvcnQgeyBoIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2h5cGVyQXBwL2h5cGVyLWFwcC1sb2NhbFwiO1xyXG5cclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBmcmFnbWVudFZpZXdzIGZyb20gXCIuL2ZyYWdtZW50Vmlld3NcIjtcclxuaW1wb3J0IGdGcmFnbWVudENvZGUgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9jb2RlL2dGcmFnbWVudENvZGVcIjtcclxuaW1wb3J0IG9wdGlvbnNWaWV3cyBmcm9tIFwiLi9vcHRpb25zVmlld3NcIjtcclxuXHJcblxyXG5jb25zdCBidWlsZExpbmtEaXNjdXNzaW9uVmlldyA9IChcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICB2aWV3czogQ2hpbGRyZW5bXVxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBsZXQgYWRqdXN0Rm9yQ29sbGFwc2VkT3B0aW9ucyA9IGZhbHNlO1xyXG4gICAgbGV0IGFkanVzdEZvclByaW9yQW5jaWxsYXJpZXMgPSBmYWxzZTtcclxuICAgIGNvbnN0IHZpZXdzTGVuZ3RoID0gdmlld3MubGVuZ3RoO1xyXG5cclxuICAgIGlmICh2aWV3c0xlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgY29uc3QgbGFzdFZpZXc6IGFueSA9IHZpZXdzW3ZpZXdzTGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAgIGlmIChsYXN0Vmlldz8udWk/LmlzQ29sbGFwc2VkID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBhZGp1c3RGb3JDb2xsYXBzZWRPcHRpb25zID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChsYXN0Vmlldz8udWk/Lmhhc0FuY2lsbGFyaWVzID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBhZGp1c3RGb3JQcmlvckFuY2lsbGFyaWVzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbGlua0VMZW1lbnRJRCA9IGdGcmFnbWVudENvZGUuZ2V0TGlua0VsZW1lbnRJRChmcmFnbWVudC5pZCk7XHJcbiAgICBjb25zdCByZXN1bHRzOiB7IHZpZXdzOiBDaGlsZHJlbltdLCBvcHRpb25zQ29sbGFwc2VkOiBib29sZWFuLCBoYXNBbmNpbGxhcmllczogYm9vbGVhbiB9ID0gb3B0aW9uc1ZpZXdzLmJ1aWxkVmlldyhmcmFnbWVudCk7XHJcblxyXG4gICAgaWYgKGxpbmtFTGVtZW50SUQgPT09ICdudF9sa19mcmFnX3Q5NjhPSjF3bycpIHtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coYFItRFJBV0lORyAke2xpbmtFTGVtZW50SUR9X2xgKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY2xhc3NlcyA9IFwibnQtZnItZnJhZ21lbnQtYm94XCI7XHJcblxyXG4gICAgaWYgKGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgaWYgKGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzID0gYCR7Y2xhc3Nlc30gbnQtdXItJHtjbGFzc05hbWV9YFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChhZGp1c3RGb3JDb2xsYXBzZWRPcHRpb25zID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIGNsYXNzZXMgPSBgJHtjbGFzc2VzfSBudC1mci1wcmlvci1jb2xsYXBzZWQtb3B0aW9uc2BcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYWRqdXN0Rm9yUHJpb3JBbmNpbGxhcmllcyA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICBjbGFzc2VzID0gYCR7Y2xhc3Nlc30gbnQtZnItcHJpb3ItaXMtYW5jaWxsYXJ5YFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXcgPVxyXG5cclxuICAgICAgICBoKFwiZGl2XCIsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkOiBgJHtsaW5rRUxlbWVudElEfV9sYCxcclxuICAgICAgICAgICAgICAgIGNsYXNzOiBgJHtjbGFzc2VzfWBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgaChcImRpdlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6IGBudC1mci1mcmFnbWVudC1kaXNjdXNzaW9uYCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRhLWRpc2N1c3Npb25cIjogZnJhZ21lbnQudmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwiXCJcclxuICAgICAgICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy52aWV3c1xyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICBpZiAocmVzdWx0cy5vcHRpb25zQ29sbGFwc2VkID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXdBbnkgPSB2aWV3IGFzIGFueTtcclxuXHJcbiAgICAgICAgaWYgKCF2aWV3QW55LnVpKSB7XHJcblxyXG4gICAgICAgICAgICB2aWV3QW55LnVpID0ge307XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2aWV3QW55LnVpLmlzQ29sbGFwc2VkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVzdWx0cy5oYXNBbmNpbGxhcmllcyA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICBjb25zdCB2aWV3QW55ID0gdmlldyBhcyBhbnk7XHJcblxyXG4gICAgICAgIGlmICghdmlld0FueS51aSkge1xyXG5cclxuICAgICAgICAgICAgdmlld0FueS51aSA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmlld0FueS51aS5oYXNBbmNpbGxhcmllcyA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdmlld3MucHVzaCh2aWV3KTtcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkTGlua0V4aXRzVmlldyA9IChcclxuICAgIF9mcmFnbWVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgX3ZpZXc6IENoaWxkcmVuW11cclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgcmV0dXJuXHJcblxyXG4gICAgLy8gaWYgKCFmcmFnbWVudC5vcHRpb25zXHJcbiAgICAvLyAgICAgfHwgZnJhZ21lbnQub3B0aW9ucy5sZW5ndGggPT09IDBcclxuICAgIC8vICAgICB8fCAhZnJhZ21lbnQudWkuZnJhZ21lbnRPcHRpb25zRXhwYW5kZWRcclxuICAgIC8vICkge1xyXG4gICAgLy8gICAgIHJldHVybjtcclxuICAgIC8vIH1cclxuXHJcbiAgICAvLyBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50LmV4aXRLZXkpKSB7XHJcblxyXG4gICAgLy8gICAgIC8vIFRoZW4gbWFwIGhhcyBhIHNpbmdsZSBleGl0IGFuZCBpdCB3YXMgbWVyZ2VkIGludG8gdGhpcyBmcmFnbWVudFxyXG4gICAgLy8gICAgIHJldHVybjtcclxuICAgIC8vIH1cclxuXHJcbiAgICAvLyB2aWV3LnB1c2goXHJcblxyXG4gICAgLy8gICAgIGgoXCJkaXZcIixcclxuICAgIC8vICAgICAgICAge1xyXG4gICAgLy8gICAgICAgICAgICAgY2xhc3M6IFwibnQtZnItZXhpdHMtYm94XCJcclxuICAgIC8vICAgICAgICAgfSxcclxuICAgIC8vICAgICAgICAgW1xyXG4gICAgLy8gICAgICAgICAgICAgb3B0aW9uc1ZpZXdzLmJ1aWxkVmlldyhmcmFnbWVudClcclxuICAgIC8vICAgICAgICAgXVxyXG4gICAgLy8gICAgIClcclxuICAgIC8vICk7XHJcbn07XHJcblxyXG5jb25zdCBsaW5rVmlld3MgPSB7XHJcblxyXG4gICAgYnVpbGRWaWV3OiAoXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgfCB1bmRlZmluZWQsXHJcbiAgICAgICAgdmlld3M6IENoaWxkcmVuW11cclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIWZyYWdtZW50XHJcbiAgICAgICAgICAgIHx8IGZyYWdtZW50LnVpLmRvTm90UGFpbnQgPT09IHRydWVcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYnVpbGRMaW5rRGlzY3Vzc2lvblZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgICAgICB2aWV3c1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGxpbmtWaWV3cy5idWlsZFZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50Lmxpbms/LnJvb3QsXHJcbiAgICAgICAgICAgIHZpZXdzXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgYnVpbGRMaW5rRXhpdHNWaWV3KFxyXG4gICAgICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICAgICAgdmlld3NcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBmcmFnbWVudFZpZXdzLmJ1aWxkVmlldyhcclxuICAgICAgICAgICAgZnJhZ21lbnQuc2VsZWN0ZWQsXHJcbiAgICAgICAgICAgIHZpZXdzXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxpbmtWaWV3cztcclxuXHJcblxyXG4iLCJpbXBvcnQgeyBDaGlsZHJlbiB9IGZyb20gXCJoeXBlci1hcHAtbG9jYWxcIjtcclxuaW1wb3J0IHsgaCB9IGZyb20gXCIuLi8uLi8uLi8uLi9oeXBlckFwcC9oeXBlci1hcHAtbG9jYWxcIjtcclxuXHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgZ0ZyYWdtZW50Q29kZSBmcm9tIFwiLi4vLi4vLi4vZ2xvYmFsL2NvZGUvZ0ZyYWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgb3B0aW9uc1ZpZXdzIGZyb20gXCIuL29wdGlvbnNWaWV3c1wiO1xyXG5pbXBvcnQgbGlua1ZpZXdzIGZyb20gXCIuL2xpbmtWaWV3c1wiO1xyXG5pbXBvcnQgVSBmcm9tIFwiLi4vLi4vLi4vZ2xvYmFsL2dVdGlsaXRpZXNcIjtcclxuXHJcblxyXG5jb25zdCBidWlsZERpc2N1c3Npb25WaWV3ID0gKFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIHZpZXdzOiBDaGlsZHJlbltdXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudC52YWx1ZSkgPT09IHRydWUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGFkanVzdEZvckNvbGxhcHNlZE9wdGlvbnMgPSBmYWxzZTtcclxuICAgIGxldCBhZGp1c3RGb3JQcmlvckFuY2lsbGFyaWVzID0gZmFsc2U7XHJcbiAgICBjb25zdCB2aWV3c0xlbmd0aCA9IHZpZXdzLmxlbmd0aDtcclxuXHJcbiAgICBpZiAodmlld3NMZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IGxhc3RWaWV3OiBhbnkgPSB2aWV3c1t2aWV3c0xlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgICBpZiAobGFzdFZpZXc/LnVpPy5pc0NvbGxhcHNlZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgYWRqdXN0Rm9yQ29sbGFwc2VkT3B0aW9ucyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobGFzdFZpZXc/LnVpPy5oYXNBbmNpbGxhcmllcyA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgYWRqdXN0Rm9yUHJpb3JBbmNpbGxhcmllcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZyYWdtZW50RUxlbWVudElEID0gZ0ZyYWdtZW50Q29kZS5nZXRGcmFnbWVudEVsZW1lbnRJRChmcmFnbWVudC5pZCk7XHJcblxyXG4gICAgbGV0IGNsYXNzZXMgPSBcIm50LWZyLWZyYWdtZW50LWJveFwiO1xyXG5cclxuICAgIGlmIChmcmFnbWVudC5jbGFzc2VzKSB7XHJcblxyXG4gICAgICAgIGlmIChmcmFnbWVudC5jbGFzc2VzKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNsYXNzTmFtZSBvZiBmcmFnbWVudC5jbGFzc2VzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgY2xhc3NlcyA9IGAke2NsYXNzZXN9IG50LXVyLSR7Y2xhc3NOYW1lfWBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoYWRqdXN0Rm9yQ29sbGFwc2VkT3B0aW9ucyA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICBjbGFzc2VzID0gYCR7Y2xhc3Nlc30gbnQtZnItcHJpb3ItY29sbGFwc2VkLW9wdGlvbnNgXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFkanVzdEZvclByaW9yQW5jaWxsYXJpZXMgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgY2xhc3NlcyA9IGAke2NsYXNzZXN9IG50LWZyLXByaW9yLWlzLWFuY2lsbGFyeWBcclxuICAgIH1cclxuXHJcbiAgICB2aWV3cy5wdXNoKFxyXG5cclxuICAgICAgICBoKFwiZGl2XCIsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkOiBgJHtmcmFnbWVudEVMZW1lbnRJRH1fZGAsXHJcbiAgICAgICAgICAgICAgICBjbGFzczogYCR7Y2xhc3Nlc31gXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgIGgoXCJkaXZcIixcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiBgbnQtZnItZnJhZ21lbnQtZGlzY3Vzc2lvbmAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0YS1kaXNjdXNzaW9uXCI6IGZyYWdtZW50LnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBcIlwiXHJcbiAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgKVxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IGZyYWdtZW50Vmlld3MgPSB7XHJcblxyXG4gICAgYnVpbGRWaWV3OiAoXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgfCB1bmRlZmluZWQsXHJcbiAgICAgICAgdmlld3M6IENoaWxkcmVuW11cclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIWZyYWdtZW50XHJcbiAgICAgICAgICAgIHx8IGZyYWdtZW50LnVpLmRvTm90UGFpbnQgPT09IHRydWVcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYnVpbGREaXNjdXNzaW9uVmlldyhcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgIHZpZXdzXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbGlua1ZpZXdzLmJ1aWxkVmlldyhcclxuICAgICAgICAgICAgZnJhZ21lbnQubGluaz8ucm9vdCxcclxuICAgICAgICAgICAgdmlld3NcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBvcHRpb25zVmlld3MuYnVpbGRWaWV3MihcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgIHZpZXdzXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZnJhZ21lbnRWaWV3cy5idWlsZFZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LnNlbGVjdGVkLFxyXG4gICAgICAgICAgICB2aWV3c1xyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmcmFnbWVudFZpZXdzO1xyXG5cclxuXHJcbiIsImltcG9ydCB7IENoaWxkcmVuLCBWTm9kZSB9IGZyb20gXCJoeXBlci1hcHAtbG9jYWxcIjtcclxuaW1wb3J0IHsgaCB9IGZyb20gXCIuLi8uLi8uLi8uLi9oeXBlckFwcC9oeXBlci1hcHAtbG9jYWxcIjtcclxuXHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBmcmFnbWVudFZpZXdzIGZyb20gXCIuL2ZyYWdtZW50Vmlld3NcIjtcclxuLy8gaW1wb3J0IGdEZWJ1Z2dlckNvZGUgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9jb2RlL2dEZWJ1Z2dlckNvZGVcIjtcclxuXHJcbmltcG9ydCBcIi4uL3Njc3MvZnJhZ21lbnRzLnNjc3NcIjtcclxuXHJcblxyXG5jb25zdCBndWlkZVZpZXdzID0ge1xyXG5cclxuICAgIGJ1aWxkQ29udGVudFZpZXc6IChzdGF0ZTogSVN0YXRlKTogVk5vZGUgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBpbm5lclZpZXdzOiBDaGlsZHJlbltdID0gW107XHJcblxyXG4gICAgICAgIGZyYWdtZW50Vmlld3MuYnVpbGRWaWV3KFxyXG4gICAgICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5kaXNwbGF5R3VpZGU/LnJvb3QsXHJcbiAgICAgICAgICAgIGlubmVyVmlld3NcclxuICAgICAgICApXHJcblxyXG4gICAgICAgIC8vIGdEZWJ1Z2dlckNvZGUubG9nUm9vdChzdGF0ZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXc6IFZOb2RlID1cclxuXHJcbiAgICAgICAgICAgIGgoXCJkaXZcIixcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogXCJudF9mcl9GcmFnbWVudHNcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgICAgICBpbm5lclZpZXdzXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ3VpZGVWaWV3cztcclxuXHJcblxyXG4iLCJpbXBvcnQgeyBWTm9kZSB9IGZyb20gXCJoeXBlci1hcHAtbG9jYWxcIjtcclxuaW1wb3J0IHsgaCB9IGZyb20gXCIuLi8uLi8uLi8uLi9oeXBlckFwcC9oeXBlci1hcHAtbG9jYWxcIjtcclxuXHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBpbml0QWN0aW9ucyBmcm9tIFwiLi4vYWN0aW9ucy9pbml0QWN0aW9uc1wiO1xyXG5pbXBvcnQgZ3VpZGVWaWV3cyBmcm9tIFwiLi4vLi4vZnJhZ21lbnRzL3ZpZXdzL2d1aWRlVmlld3NcIjtcclxuXHJcblxyXG5jb25zdCBpbml0VmlldyA9IHtcclxuXHJcbiAgICBidWlsZFZpZXc6IChzdGF0ZTogSVN0YXRlKTogVk5vZGUgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCB2aWV3OiBWTm9kZSA9XHJcblxyXG4gICAgICAgICAgICBoKFwiZGl2XCIsXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljazogaW5pdEFjdGlvbnMuc2V0Tm90UmF3LFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBcInRyZWVTb2x2ZUZyYWdtZW50c1wiXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgIGd1aWRlVmlld3MuYnVpbGRDb250ZW50VmlldyhzdGF0ZSksXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpbml0VmlldztcclxuXHJcbiIsImltcG9ydCBJU2V0dGluZ3MgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvdXNlci9JU2V0dGluZ3NcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXR0aW5ncyBpbXBsZW1lbnRzIElTZXR0aW5ncyB7XHJcblxyXG4gICAgcHVibGljIGtleTogc3RyaW5nID0gXCItMVwiO1xyXG4gICAgcHVibGljIHI6IHN0cmluZyA9IFwiLTFcIjtcclxuXHJcbiAgICAvLyBBdXRoZW50aWNhdGlvblxyXG4gICAgcHVibGljIHVzZXJQYXRoOiBzdHJpbmcgPSBgdXNlcmA7XHJcbiAgICBwdWJsaWMgZGVmYXVsdExvZ291dFBhdGg6IHN0cmluZyA9IGBsb2dvdXRgO1xyXG4gICAgcHVibGljIGRlZmF1bHRMb2dpblBhdGg6IHN0cmluZyA9IGBsb2dpbmA7XHJcbiAgICBwdWJsaWMgcmV0dXJuVXJsU3RhcnQ6IHN0cmluZyA9IGByZXR1cm5VcmxgO1xyXG5cclxuICAgIHByaXZhdGUgYmFzZVVybDogc3RyaW5nID0gKHdpbmRvdyBhcyBhbnkpLkFTU0lTVEFOVF9CQVNFX1VSTCA/PyAnJztcclxuICAgIHB1YmxpYyBsaW5rVXJsOiBzdHJpbmcgPSAod2luZG93IGFzIGFueSkuQVNTSVNUQU5UX0xJTktfVVJMID8/ICcnO1xyXG4gICAgcHVibGljIHN1YnNjcmlwdGlvbklEOiBzdHJpbmcgPSAod2luZG93IGFzIGFueSkuQVNTSVNUQU5UX1NVQlNDUklQVElPTl9JRCA/PyAnJztcclxuXHJcbiAgICBwdWJsaWMgYXBpVXJsOiBzdHJpbmcgPSBgJHt0aGlzLmJhc2VVcmx9L2FwaWA7XHJcbiAgICBwdWJsaWMgYmZmVXJsOiBzdHJpbmcgPSBgJHt0aGlzLmJhc2VVcmx9L2JmZmA7XHJcbiAgICBwdWJsaWMgZmlsZVVybDogc3RyaW5nID0gYCR7dGhpcy5iYXNlVXJsfS9maWxlYDtcclxufVxyXG4iLCJcclxuZXhwb3J0IGVudW0gbmF2aWdhdGlvbkRpcmVjdGlvbiB7XHJcblxyXG4gICAgQnV0dG9ucyA9ICdidXR0b25zJyxcclxuICAgIEJhY2t3YXJkcyA9ICdiYWNrd2FyZHMnLFxyXG4gICAgRm9yd2FyZHMgPSAnZm9yd2FyZHMnXHJcbn1cclxuXHJcbiIsImltcG9ydCB7IG5hdmlnYXRpb25EaXJlY3Rpb24gfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9uYXZpZ2F0aW9uRGlyZWN0aW9uXCI7XHJcbmltcG9ydCBJSGlzdG9yeSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9oaXN0b3J5L0lIaXN0b3J5XCI7XHJcbmltcG9ydCBJSGlzdG9yeVVybCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9oaXN0b3J5L0lIaXN0b3J5VXJsXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSGlzdG9yeSBpbXBsZW1lbnRzIElIaXN0b3J5IHtcclxuXHJcbiAgICBwdWJsaWMgaGlzdG9yeUNoYWluOiBBcnJheTxJSGlzdG9yeVVybD4gPSBbXTtcclxuICAgIHB1YmxpYyBkaXJlY3Rpb246IG5hdmlnYXRpb25EaXJlY3Rpb24gPSBuYXZpZ2F0aW9uRGlyZWN0aW9uLkJ1dHRvbnM7XHJcbiAgICBwdWJsaWMgY3VycmVudEluZGV4OiBudW1iZXIgPSAwO1xyXG59XHJcbiIsImltcG9ydCBJVXNlciBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS91c2VyL0lVc2VyXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVXNlciBpbXBsZW1lbnRzIElVc2VyIHtcclxuXHJcbiAgICBwdWJsaWMga2V5OiBzdHJpbmcgPSBgMDEyMzQ1Njc4OWA7XHJcbiAgICBwdWJsaWMgcjogc3RyaW5nID0gXCItMVwiO1xyXG4gICAgcHVibGljIHVzZVZzQ29kZTogYm9vbGVhbiA9IHRydWU7XHJcbiAgICBwdWJsaWMgYXV0aG9yaXNlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIHJhdzogYm9vbGVhbiA9IHRydWU7XHJcbiAgICBwdWJsaWMgbG9nb3V0VXJsOiBzdHJpbmcgPSBcIlwiO1xyXG4gICAgcHVibGljIHNob3dNZW51OiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgbmFtZTogc3RyaW5nID0gXCJcIjtcclxuICAgIHB1YmxpYyBzdWI6IHN0cmluZyA9IFwiXCI7XHJcbn1cclxuIiwiaW1wb3J0IElSZXBlYXRFZmZlY3RzIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2VmZmVjdHMvSVJlcGVhdEVmZmVjdHNcIjtcclxuaW1wb3J0IElIdHRwRWZmZWN0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2VmZmVjdHMvSUh0dHBFZmZlY3RcIjtcclxuaW1wb3J0IElBY3Rpb24gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSUFjdGlvblwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcGVhdGVFZmZlY3RzIGltcGxlbWVudHMgSVJlcGVhdEVmZmVjdHMge1xyXG5cclxuICAgIHB1YmxpYyBzaG9ydEludGVydmFsSHR0cDogQXJyYXk8SUh0dHBFZmZlY3Q+ID0gW107XHJcbiAgICBwdWJsaWMgcmVMb2FkR2V0SHR0cEltbWVkaWF0ZTogQXJyYXk8SUh0dHBFZmZlY3Q+ID0gW107XHJcbiAgICBwdWJsaWMgcnVuQWN0aW9uSW1tZWRpYXRlOiBBcnJheTxJQWN0aW9uPiA9IFtdO1xyXG59XHJcbiIsImltcG9ydCBJUmVuZGVyU3RhdGVVSSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS91aS9JUmVuZGVyU3RhdGVVSVwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlbmRlclN0YXRlVUkgaW1wbGVtZW50cyBJUmVuZGVyU3RhdGVVSSB7XHJcblxyXG4gICAgcHVibGljIHJhdzogYm9vbGVhbiA9IHRydWU7XHJcbiAgICBwdWJsaWMgb3B0aW9uc0V4cGFuZGVkOiBib29sZWFuID0gZmFsc2U7XHJcbn1cclxuIiwiaW1wb3J0IElEaXNwbGF5R3VpZGUgZnJvbSBcIi4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheUd1aWRlXCI7XHJcbmltcG9ydCBJRGlzcGxheVNlY3Rpb24gZnJvbSBcIi4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheVNlY3Rpb25cIjtcclxuaW1wb3J0IElSZW5kZXJTdGF0ZSBmcm9tIFwiLi4vaW50ZXJmYWNlcy9zdGF0ZS9JUmVuZGVyU3RhdGVcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBJQ2hhaW5TZWdtZW50IGZyb20gXCIuLi9pbnRlcmZhY2VzL3N0YXRlL3NlZ21lbnRzL0lDaGFpblNlZ21lbnRcIjtcclxuaW1wb3J0IElSZW5kZXJTdGF0ZVVJIGZyb20gXCIuLi9pbnRlcmZhY2VzL3N0YXRlL3VpL0lSZW5kZXJTdGF0ZVVJXCI7XHJcbmltcG9ydCBSZW5kZXJTdGF0ZVVJIGZyb20gXCIuL3VpL1JlbmRlclN0YXRlVUlcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZW5kZXJTdGF0ZSBpbXBsZW1lbnRzIElSZW5kZXJTdGF0ZSB7XHJcblxyXG4gICAgcHVibGljIHJlZnJlc2hVcmw6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHB1YmxpYyBpc0NoYWluTG9hZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIHNlZ21lbnRzOiBBcnJheTxJQ2hhaW5TZWdtZW50PiA9IFtdO1xyXG4gICAgcHVibGljIGRpc3BsYXlHdWlkZTogSURpc3BsYXlHdWlkZSB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIG91dGxpbmVzOiBhbnkgPSB7fTtcclxuICAgIHB1YmxpYyBvdXRsaW5lVXJsczogYW55ID0ge307XHJcbiAgICBwdWJsaWMgY3VycmVudFNlY3Rpb246IElEaXNwbGF5U2VjdGlvbiB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIHB1YmxpYyBhY3RpdmVBbmNpbGxhcnk6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgIC8vIFNlYXJjaCBpbmRpY2VzXHJcbiAgICBwdWJsaWMgaW5kZXhfb3V0bGluZU5vZGVzX2lkOiBhbnkgPSB7fTtcclxuICAgIHB1YmxpYyBpbmRleF9jaGFpbkZyYWdtZW50c19pZDogYW55ID0ge307XHJcblxyXG4gICAgcHVibGljIHVpOiBJUmVuZGVyU3RhdGVVSSA9IG5ldyBSZW5kZXJTdGF0ZVVJKCk7XHJcbn1cclxuIiwiaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IFNldHRpbmdzIGZyb20gXCIuL3VzZXIvU2V0dGluZ3NcIjtcclxuaW1wb3J0IElTZXR0aW5ncyBmcm9tIFwiLi4vaW50ZXJmYWNlcy9zdGF0ZS91c2VyL0lTZXR0aW5nc1wiO1xyXG5pbXBvcnQgSUhpc3RvcnkgZnJvbSBcIi4uL2ludGVyZmFjZXMvc3RhdGUvaGlzdG9yeS9JSGlzdG9yeVwiO1xyXG5pbXBvcnQgU3RlcEhpc3RvcnkgZnJvbSBcIi4vaGlzdG9yeS9IaXN0b3J5XCI7XHJcbmltcG9ydCBJVXNlciBmcm9tIFwiLi4vaW50ZXJmYWNlcy9zdGF0ZS91c2VyL0lVc2VyXCI7XHJcbmltcG9ydCBVc2VyIGZyb20gXCIuL3VzZXIvVXNlclwiO1xyXG5pbXBvcnQgSVJlcGVhdEVmZmVjdHMgZnJvbSBcIi4uL2ludGVyZmFjZXMvc3RhdGUvZWZmZWN0cy9JUmVwZWF0RWZmZWN0c1wiO1xyXG5pbXBvcnQgUmVwZWF0ZUVmZmVjdHMgZnJvbSBcIi4vZWZmZWN0cy9SZXBlYXRlRWZmZWN0c1wiO1xyXG5pbXBvcnQgSVJlbmRlclN0YXRlIGZyb20gXCIuLi9pbnRlcmZhY2VzL3N0YXRlL0lSZW5kZXJTdGF0ZVwiO1xyXG5pbXBvcnQgUmVuZGVyU3RhdGUgZnJvbSBcIi4vUmVuZGVyU3RhdGVcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGF0ZSBpbXBsZW1lbnRzIElTdGF0ZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHNldHRpbmdzOiBJU2V0dGluZ3MgPSBuZXcgU2V0dGluZ3MoKTtcclxuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxvYWRpbmc6IGJvb2xlYW4gPSB0cnVlO1xyXG4gICAgcHVibGljIGRlYnVnOiBib29sZWFuID0gdHJ1ZTtcclxuICAgIHB1YmxpYyBnZW5lcmljRXJyb3I6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHB1YmxpYyBuZXh0S2V5OiBudW1iZXIgPSAtMTtcclxuICAgIHB1YmxpYyBzZXR0aW5nczogSVNldHRpbmdzO1xyXG4gICAgcHVibGljIHVzZXI6IElVc2VyID0gbmV3IFVzZXIoKTtcclxuICAgIFxyXG4gICAgcHVibGljIHJlbmRlclN0YXRlOiBJUmVuZGVyU3RhdGUgPSBuZXcgUmVuZGVyU3RhdGUoKTtcclxuXHJcbiAgICBwdWJsaWMgcmVwZWF0RWZmZWN0czogSVJlcGVhdEVmZmVjdHMgPSBuZXcgUmVwZWF0ZUVmZmVjdHMoKTtcclxuXHJcbiAgICBwdWJsaWMgc3RlcEhpc3Rvcnk6IElIaXN0b3J5ID0gbmV3IFN0ZXBIaXN0b3J5KCk7XHJcbn1cclxuXHJcblxyXG4iLCJcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IFUgZnJvbSBcIi4uL2dVdGlsaXRpZXNcIjtcclxuaW1wb3J0IHsgQWN0aW9uVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL0FjdGlvblR5cGVcIjtcclxuaW1wb3J0IGdTdGF0ZUNvZGUgZnJvbSBcIi4uL2NvZGUvZ1N0YXRlQ29kZVwiO1xyXG5pbXBvcnQgeyBJSHR0cEZldGNoSXRlbSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2h0dHAvSUh0dHBGZXRjaEl0ZW1cIjtcclxuaW1wb3J0IHsgZ0F1dGhlbnRpY2F0ZWRIdHRwIH0gZnJvbSBcIi4uL2h0dHAvZ0F1dGhlbnRpY2F0aW9uSHR0cFwiO1xyXG5pbXBvcnQgZ0FqYXhIZWFkZXJDb2RlIGZyb20gXCIuLi9odHRwL2dBamF4SGVhZGVyQ29kZVwiO1xyXG5pbXBvcnQgZ1JlbmRlckFjdGlvbnMgZnJvbSBcIi4uL2FjdGlvbnMvZ091dGxpbmVBY3Rpb25zXCI7XHJcbmltcG9ydCBJU3RhdGVBbnlBcnJheSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVBbnlBcnJheVwiO1xyXG5pbXBvcnQgZ0ZpbGVDb25zdGFudHMgZnJvbSBcIi4uL2dGaWxlQ29uc3RhbnRzXCI7XHJcbmltcG9ydCBnT3V0bGluZUNvZGUgZnJvbSBcIi4uL2NvZGUvZ091dGxpbmVDb2RlXCI7XHJcblxyXG5cclxuY29uc3QgZ2V0R3VpZGVPdXRsaW5lID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIGZyYWdtZW50Rm9sZGVyVXJsOiBzdHJpbmcgfCBudWxsLFxyXG4gICAgbG9hZERlbGVnYXRlOiAoc3RhdGU6IElTdGF0ZSwgb3V0bGluZVJlc3BvbnNlOiBhbnkpID0+IElTdGF0ZUFueUFycmF5XHJcbik6IElIdHRwRmV0Y2hJdGVtIHwgdW5kZWZpbmVkID0+IHtcclxuXHJcbiAgICBpZiAoVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnRGb2xkZXJVcmwpID09PSB0cnVlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNhbGxJRDogc3RyaW5nID0gVS5nZW5lcmF0ZUd1aWQoKTtcclxuXHJcbiAgICBsZXQgaGVhZGVycyA9IGdBamF4SGVhZGVyQ29kZS5idWlsZEhlYWRlcnMoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgY2FsbElELFxyXG4gICAgICAgIEFjdGlvblR5cGUuR2V0T3V0bGluZVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCB1cmw6IHN0cmluZyA9IGAke2ZyYWdtZW50Rm9sZGVyVXJsfS8ke2dGaWxlQ29uc3RhbnRzLmd1aWRlT3V0bGluZUZpbGVuYW1lfWA7XHJcblxyXG4gICAgY29uc3QgbG9hZFJlcXVlc3RlZCA9IGdPdXRsaW5lQ29kZS5yZWdpc3Rlck91dGxpbmVVcmxEb3dubG9hZChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICB1cmxcclxuICAgICk7XHJcblxyXG4gICAgaWYgKGxvYWRSZXF1ZXN0ZWQgPT09IHRydWUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdBdXRoZW50aWNhdGVkSHR0cCh7XHJcbiAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXNwb25zZTogJ2pzb24nLFxyXG4gICAgICAgIGFjdGlvbjogbG9hZERlbGVnYXRlLFxyXG4gICAgICAgIGVycm9yOiAoc3RhdGU6IElTdGF0ZSwgZXJyb3JEZXRhaWxzOiBhbnkpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGB7XHJcbiAgICAgICAgICAgICAgICBcIm1lc3NhZ2VcIjogXCJFcnJvciBnZXR0aW5nIG91dGxpbmUgZGF0YSBmcm9tIHRoZSBzZXJ2ZXIuXCIsXHJcbiAgICAgICAgICAgICAgICBcInVybFwiOiAke3VybH0sXHJcbiAgICAgICAgICAgICAgICBcImVycm9yIERldGFpbHNcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMpfSxcclxuICAgICAgICAgICAgICAgIFwic3RhY2tcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMuc3RhY2spfSxcclxuICAgICAgICAgICAgICAgIFwibWV0aG9kXCI6ICR7Z1JlbmRlckVmZmVjdHMuZ2V0R3VpZGVPdXRsaW5lLm5hbWV9LFxyXG4gICAgICAgICAgICAgICAgXCJjYWxsSUQ6ICR7Y2FsbElEfVxyXG4gICAgICAgICAgICB9YCk7XHJcblxyXG4gICAgICAgICAgICBhbGVydChge1xyXG4gICAgICAgICAgICAgICAgXCJtZXNzYWdlXCI6IFwiRXJyb3IgZ2V0dGluZyBvdXRsaW5lIGRhdGEgZnJvbSB0aGUgc2VydmVyLlwiLFxyXG4gICAgICAgICAgICAgICAgXCJ1cmxcIjogJHt1cmx9LFxyXG4gICAgICAgICAgICAgICAgXCJlcnJvciBEZXRhaWxzXCI6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3JEZXRhaWxzKX0sXHJcbiAgICAgICAgICAgICAgICBcInN0YWNrXCI6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3JEZXRhaWxzLnN0YWNrKX0sXHJcbiAgICAgICAgICAgICAgICBcIm1ldGhvZFwiOiAke2dSZW5kZXJFZmZlY3RzLmdldEd1aWRlT3V0bGluZS5uYW1lfSxcclxuICAgICAgICAgICAgICAgIFwiY2FsbElEOiAke2NhbGxJRH1cclxuICAgICAgICAgICAgfWApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG5jb25zdCBnUmVuZGVyRWZmZWN0cyA9IHtcclxuXHJcbiAgICBnZXRHdWlkZU91dGxpbmU6IChzdGF0ZTogSVN0YXRlKTogSUh0dHBGZXRjaEl0ZW0gfCB1bmRlZmluZWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGZyYWdtZW50Rm9sZGVyVXJsOiBzdHJpbmcgPSBzdGF0ZS5yZW5kZXJTdGF0ZS5kaXNwbGF5R3VpZGU/Lmd1aWRlLmZyYWdtZW50Rm9sZGVyVXJsID8/ICdudWxsJztcclxuXHJcbiAgICAgICAgY29uc3QgbG9hZERlbGVnYXRlID0gKFxyXG4gICAgICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgICAgICBvdXRsaW5lUmVzcG9uc2U6IGFueVxyXG4gICAgICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnUmVuZGVyQWN0aW9ucy5sb2FkR3VpZGVPdXRsaW5lUHJvcGVydGllcyhcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlLFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRGb2xkZXJVcmxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZ2V0R3VpZGVPdXRsaW5lKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgZnJhZ21lbnRGb2xkZXJVcmwsXHJcbiAgICAgICAgICAgIGxvYWREZWxlZ2F0ZVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEd1aWRlT3V0bGluZUFuZExvYWRTZWdtZW50czogKHN0YXRlOiBJU3RhdGUpOiBJSHR0cEZldGNoSXRlbSB8IHVuZGVmaW5lZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZnJhZ21lbnRGb2xkZXJVcmw6IHN0cmluZyA9IHN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZT8uZ3VpZGUuZnJhZ21lbnRGb2xkZXJVcmwgPz8gJ251bGwnO1xyXG5cclxuICAgICAgICBjb25zdCBsb2FkRGVsZWdhdGUgPSAoXHJcbiAgICAgICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55XHJcbiAgICAgICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdSZW5kZXJBY3Rpb25zLmxvYWRHdWlkZU91dGxpbmVBbmRTZWdtZW50cyhcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlLFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRGb2xkZXJVcmxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZ2V0R3VpZGVPdXRsaW5lKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgZnJhZ21lbnRGb2xkZXJVcmwsXHJcbiAgICAgICAgICAgIGxvYWREZWxlZ2F0ZVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnUmVuZGVyRWZmZWN0cztcclxuIiwiaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IElTdGF0ZUFueUFycmF5IGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZUFueUFycmF5XCI7XHJcbmltcG9ydCBTdGF0ZSBmcm9tIFwiLi4vLi4vLi4vc3RhdGUvU3RhdGVcIjtcclxuaW1wb3J0IFRyZWVTb2x2ZSBmcm9tIFwiLi4vLi4vLi4vc3RhdGUvd2luZG93L1RyZWVTb2x2ZVwiO1xyXG5pbXBvcnQgVSBmcm9tIFwiLi4vLi4vLi4vZ2xvYmFsL2dVdGlsaXRpZXNcIjtcclxuaW1wb3J0IGdSZW5kZXJFZmZlY3RzIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvZWZmZWN0cy9nUmVuZGVyRWZmZWN0c1wiO1xyXG5pbXBvcnQgZ1JlbmRlckNvZGUgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9jb2RlL2dSZW5kZXJDb2RlXCI7XHJcbmltcG9ydCBnU2VnbWVudENvZGUgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9jb2RlL2dTZWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgeyBPdXRsaW5lVHlwZSB9IGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL2VudW1zL091dGxpbmVUeXBlXCI7XHJcblxyXG5cclxuY29uc3QgaW5pdGlhbGlzZVN0YXRlID0gKCk6IElTdGF0ZSA9PiB7XHJcblxyXG4gICAgaWYgKCF3aW5kb3cuVHJlZVNvbHZlKSB7XHJcblxyXG4gICAgICAgIHdpbmRvdy5UcmVlU29sdmUgPSBuZXcgVHJlZVNvbHZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc3RhdGU6IElTdGF0ZSA9IG5ldyBTdGF0ZSgpO1xyXG4gICAgZ1JlbmRlckNvZGUucGFyc2VSZW5kZXJpbmdDb21tZW50KHN0YXRlKTtcclxuXHJcbiAgICByZXR1cm4gc3RhdGU7XHJcbn07XHJcblxyXG5jb25zdCBidWlsZFJlbmRlckRpc3BsYXkgPSAoc3RhdGU6IElTdGF0ZSk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICBpZiAoIXN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZT8ucm9vdCkge1xyXG5cclxuICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFUuaXNOdWxsT3JXaGl0ZVNwYWNlKHN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZT8ucm9vdC5pS2V5KSA9PT0gdHJ1ZVxyXG4gICAgICAgICYmICghc3RhdGUucmVuZGVyU3RhdGUuZGlzcGxheUd1aWRlPy5yb290Lm9wdGlvbnNcclxuICAgICAgICAgICAgfHwgc3RhdGUucmVuZGVyU3RhdGUuZGlzcGxheUd1aWRlPy5yb290Lm9wdGlvbnMubGVuZ3RoID09PSAwKVxyXG4gICAgKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBbXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgZ1JlbmRlckVmZmVjdHMuZ2V0R3VpZGVPdXRsaW5lKHN0YXRlKVxyXG4gICAgXTtcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkU2VnbWVudHNSZW5kZXJEaXNwbGF5ID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIHF1ZXJ5U3RyaW5nOiBzdHJpbmdcclxuKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgIHN0YXRlLnJlbmRlclN0YXRlLmlzQ2hhaW5Mb2FkID0gdHJ1ZTtcclxuXHJcbiAgICBnU2VnbWVudENvZGUucGFyc2VTZWdtZW50cyhcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBxdWVyeVN0cmluZ1xyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBzZWdtZW50cyA9IHN0YXRlLnJlbmRlclN0YXRlLnNlZ21lbnRzO1xyXG5cclxuICAgIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDEpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlcmUgd2FzIG9ubHkgMSBzZWdtZW50XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJvb3RTZWdtZW50ID0gc2VnbWVudHNbMF07XHJcblxyXG4gICAgaWYgKCFyb290U2VnbWVudC5zdGFydC5pc1Jvb3QpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR3VpZGVSb290IG5vdCBwcmVzZW50XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZpcnN0U2VnbWVudCA9IHNlZ21lbnRzWzFdO1xyXG5cclxuICAgIGlmICghZmlyc3RTZWdtZW50LnN0YXJ0LmlzTGFzdFxyXG4gICAgICAgICYmIGZpcnN0U2VnbWVudC5zdGFydC50eXBlICE9PSBPdXRsaW5lVHlwZS5MaW5rXHJcbiAgICApIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHF1ZXJ5IHN0cmluZyBmb3JtYXQgLSBpdCBzaG91bGQgc3RhcnQgd2l0aCAnLScgb3IgJ34nXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBbXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgZ1JlbmRlckVmZmVjdHMuZ2V0R3VpZGVPdXRsaW5lQW5kTG9hZFNlZ21lbnRzKHN0YXRlKVxyXG4gICAgXTtcclxufTtcclxuXHJcbmNvbnN0IGluaXRTdGF0ZSA9IHtcclxuXHJcbiAgICBpbml0aWFsaXNlOiAoKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0ZTogSVN0YXRlID0gaW5pdGlhbGlzZVN0YXRlKCk7XHJcbiAgICAgICAgY29uc3QgcXVlcnlTdHJpbmc6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2g7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKHF1ZXJ5U3RyaW5nKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBidWlsZFNlZ21lbnRzUmVuZGVyRGlzcGxheShcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBxdWVyeVN0cmluZ1xyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGJ1aWxkUmVuZGVyRGlzcGxheShzdGF0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlOiBhbnkpIHtcclxuXHJcbiAgICAgICAgICAgIHN0YXRlLmdlbmVyaWNFcnJvciA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpbml0U3RhdGU7XHJcblxyXG4iLCJpbXBvcnQgRmlsdGVycyBmcm9tIFwiLi4vLi4vLi4vc3RhdGUvY29uc3RhbnRzL0ZpbHRlcnNcIjtcclxuaW1wb3J0IFRyZWVTb2x2ZSBmcm9tIFwiLi4vLi4vLi4vc3RhdGUvd2luZG93L1RyZWVTb2x2ZVwiO1xyXG5cclxuXHJcbmNvbnN0IHJlbmRlckNvbW1lbnRzID0ge1xyXG5cclxuICAgIHJlZ2lzdGVyR3VpZGVDb21tZW50OiAoKSA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHRyZWVTb2x2ZUd1aWRlOiBIVE1MRGl2RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKEZpbHRlcnMudHJlZVNvbHZlR3VpZGVJRCkgYXMgSFRNTERpdkVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGlmICh0cmVlU29sdmVHdWlkZVxyXG4gICAgICAgICAgICAmJiB0cmVlU29sdmVHdWlkZS5oYXNDaGlsZE5vZGVzKCkgPT09IHRydWVcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgbGV0IGNoaWxkTm9kZTogQ2hpbGROb2RlO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0cmVlU29sdmVHdWlkZS5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgY2hpbGROb2RlID0gdHJlZVNvbHZlR3VpZGUuY2hpbGROb2Rlc1tpXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGROb2RlLm5vZGVUeXBlID09PSBOb2RlLkNPTU1FTlRfTk9ERSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXdpbmRvdy5UcmVlU29sdmUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5UcmVlU29sdmUgPSBuZXcgVHJlZVNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuVHJlZVNvbHZlLnJlbmRlcmluZ0NvbW1lbnQgPSBjaGlsZE5vZGUudGV4dENvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGROb2RlLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNoaWxkTm9kZS5ub2RlVHlwZSAhPT0gTm9kZS5URVhUX05PREUpIHtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgcmVuZGVyQ29tbWVudHM7XHJcbiIsImltcG9ydCB7IGFwcCB9IGZyb20gXCIuL2h5cGVyQXBwL2h5cGVyLWFwcC1sb2NhbFwiO1xyXG5cclxuaW1wb3J0IGluaXRTdWJzY3JpcHRpb25zIGZyb20gXCIuL21vZHVsZXMvY29tcG9uZW50cy9pbml0L3N1YnNjcmlwdGlvbnMvaW5pdFN1YnNjcmlwdGlvbnNcIjtcclxuaW1wb3J0IGluaXRFdmVudHMgZnJvbSBcIi4vbW9kdWxlcy9jb21wb25lbnRzL2luaXQvY29kZS9pbml0RXZlbnRzXCI7XHJcbmltcG9ydCBpbml0VmlldyBmcm9tIFwiLi9tb2R1bGVzL2NvbXBvbmVudHMvaW5pdC92aWV3cy9pbml0Vmlld1wiO1xyXG5pbXBvcnQgaW5pdFN0YXRlIGZyb20gXCIuL21vZHVsZXMvY29tcG9uZW50cy9pbml0L2NvZGUvaW5pdFN0YXRlXCI7XHJcbmltcG9ydCByZW5kZXJDb21tZW50cyBmcm9tIFwiLi9tb2R1bGVzL2NvbXBvbmVudHMvaW5pdC9jb2RlL3JlbmRlckNvbW1lbnRzXCI7XHJcblxyXG5cclxuaW5pdEV2ZW50cy5yZWdpc3Rlckdsb2JhbEV2ZW50cygpO1xyXG5yZW5kZXJDb21tZW50cy5yZWdpc3Rlckd1aWRlQ29tbWVudCgpO1xyXG5cclxuKHdpbmRvdyBhcyBhbnkpLkNvbXBvc2l0ZUZsb3dzQXV0aG9yID0gYXBwKHtcclxuICAgIFxyXG4gICAgbm9kZTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0cmVlU29sdmVGcmFnbWVudHNcIiksXHJcbiAgICBpbml0OiBpbml0U3RhdGUuaW5pdGlhbGlzZSxcclxuICAgIHZpZXc6IGluaXRWaWV3LmJ1aWxkVmlldyxcclxuICAgIHN1YnNjcmlwdGlvbnM6IGluaXRTdWJzY3JpcHRpb25zLFxyXG4gICAgb25FbmQ6IGluaXRFdmVudHMub25SZW5kZXJGaW5pc2hlZFxyXG59KTtcclxuXHJcblxyXG4iXSwibmFtZXMiOlsicHJvcHMiLCJjb3VudCIsIm91dHB1dCIsIlUiLCJsb2NhdGlvbiIsImVmZmVjdCIsImh0dHBFZmZlY3QiLCJBY3Rpb25UeXBlIiwic3RhdGUiLCJfc3RhdGUiLCJvRW1iZWRQYXJhbWV0ZXJzIiwic2VsZiIsIldlYWtNYXAiLCJ0aW1lciIsImJ1aWx0SW5Qcm9wIiwiaWR4IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJzY3JlZW5mdWxsIiwiaW50ZXJ2YWwiLCJQYXJzZVR5cGUiLCJPdXRsaW5lVHlwZSIsIlNjcm9sbEhvcFR5cGUiLCJvdXRsaW5lUmVzcG9uc2UiLCJuYXZpZ2F0aW9uRGlyZWN0aW9uIiwiU3RlcEhpc3RvcnkiLCJnUmVuZGVyQWN0aW9ucyJdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsSUFBSSxnQkFBZ0I7QUFDcEIsSUFBSSxZQUFZO0FBQ2hCLElBQUksWUFBWTtBQUNoQixJQUFJLFlBQVksQ0FBQTtBQUNoQixJQUFJLFlBQVksQ0FBQTtBQUNoQixJQUFJLE1BQU0sVUFBVTtBQUNwQixJQUFJLFVBQVUsTUFBTTtBQUNwQixJQUFJLFFBQ0YsT0FBTywwQkFBMEIsY0FDN0Isd0JBQ0E7QUFFTixJQUFJLGNBQWMsU0FBUyxLQUFLO0FBQzlCLE1BQUks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
