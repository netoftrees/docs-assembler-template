//#region root/src/hyperApp/hyper-app-local.js
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
		for (var k = 0, tmp; k < obj.length; k++) if ((tmp = createClass(obj[k])) !== "") out += (out && " ") + tmp;
	} else for (var k in obj) if (obj[k]) out += (out && " ") + k;
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
		return out.concat(!item || item === true ? 0 : typeof item[0] === "function" ? [item] : batch(item));
	}, EMPTY_ARR);
};
var isSameAction = function(a, b) {
	return isArray(a) && isArray(b) && a[0] === b[0] && typeof a[0] === "function";
};
var shouldRestart = function(a, b) {
	if (a !== b) for (var k in merge(a, b)) {
		if (a[k] !== b[k] && !isSameAction(a[k], b[k])) return true;
		b[k] = a[k];
	}
};
var patchSubs = function(oldSubs, newSubs, dispatch) {
	for (var i = 0, oldSub, newSub, subs = []; i < oldSubs.length || i < newSubs.length; i++) {
		oldSub = oldSubs[i];
		newSub = newSubs[i];
		subs.push(newSub ? !oldSub || newSub[0] !== oldSub[0] || shouldRestart(newSub[1], oldSub[1]) ? [
			newSub[0],
			newSub[1],
			newSub[0](dispatch, newSub[1]),
			oldSub && oldSub[2]()
		] : oldSub : oldSub && oldSub[2]());
	}
	return subs;
};
var patchProperty = function(node, key, oldValue, newValue, listener, isSvg) {
	if (key === "key") {} else if (key === "style") for (var k in merge(oldValue, newValue)) {
		oldValue = newValue == null || newValue[k] == null ? "" : newValue[k];
		if (k[0] === "-") node[key].setProperty(k, oldValue);
		else node[key][k] = oldValue;
	}
	else if (key[0] === "o" && key[1] === "n") {
		if (!((node.actions || (node.actions = {}))[key = key.slice(2).toLowerCase()] = newValue)) node.removeEventListener(key, listener);
		else if (!oldValue) node.addEventListener(key, listener);
	} else if (!isSvg && key !== "list" && key in node) node[key] = newValue == null || newValue == "undefined" ? "" : newValue;
	else if (newValue == null || newValue === false || key === "class" && !(newValue = createClass(newValue))) node.removeAttribute(key);
	else node.setAttribute(key, newValue);
};
var createNode = function(vdom, listener, isSvg) {
	var ns = "http://www.w3.org/2000/svg";
	var props = vdom.props;
	var node = vdom.type === TEXT_NODE ? document.createTextNode(vdom.name) : (isSvg = isSvg || vdom.name === "svg") ? document.createElementNS(ns, vdom.name, { is: props.is }) : document.createElement(vdom.name, { is: props.is });
	for (var k in props) patchProperty(node, k, null, props[k], listener, isSvg);
	for (var i = 0, len = vdom.children.length; i < len; i++) node.appendChild(createNode(vdom.children[i] = getVNode(vdom.children[i]), listener, isSvg));
	return vdom.node = node;
};
var getKey = function(vdom) {
	return vdom == null ? null : vdom.key;
};
var patch = function(parent, node, oldVNode, newVNode, listener, isSvg) {
	if (oldVNode === newVNode) {} else if (oldVNode != null && oldVNode.type === TEXT_NODE && newVNode.type === TEXT_NODE) {
		if (oldVNode.name !== newVNode.name) node.nodeValue = newVNode.name;
	} else if (oldVNode == null || oldVNode.name !== newVNode.name) {
		node = parent.insertBefore(createNode(newVNode = getVNode(newVNode), listener, isSvg), node);
		if (oldVNode != null) parent.removeChild(oldVNode.node);
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
		for (var i in merge(oldVProps, newVProps)) if ((i === "value" || i === "selected" || i === "checked" ? node[i] : oldVProps[i]) !== newVProps[i]) patchProperty(node, i, oldVProps[i], newVProps[i], listener, isSvg);
		while (newHead <= newTail && oldHead <= oldTail) {
			if ((oldKey = getKey(oldVKids[oldHead])) == null || oldKey !== getKey(newVKids[newHead])) break;
			patch(node, oldVKids[oldHead].node, oldVKids[oldHead], newVKids[newHead] = getVNode(newVKids[newHead++], oldVKids[oldHead++]), listener, isSvg);
		}
		while (newHead <= newTail && oldHead <= oldTail) {
			if ((oldKey = getKey(oldVKids[oldTail])) == null || oldKey !== getKey(newVKids[newTail])) break;
			patch(node, oldVKids[oldTail].node, oldVKids[oldTail], newVKids[newTail] = getVNode(newVKids[newTail--], oldVKids[oldTail--]), listener, isSvg);
		}
		if (oldHead > oldTail) while (newHead <= newTail) node.insertBefore(createNode(newVKids[newHead] = getVNode(newVKids[newHead++]), listener, isSvg), (oldVKid = oldVKids[oldHead]) && oldVKid.node);
		else if (newHead > newTail) while (oldHead <= oldTail) node.removeChild(oldVKids[oldHead++].node);
		else {
			for (var i = oldHead, keyed = {}, newKeyed = {}; i <= oldTail; i++) if ((oldKey = oldVKids[i].key) != null) keyed[oldKey] = oldVKids[i];
			while (newHead <= newTail) {
				oldKey = getKey(oldVKid = oldVKids[oldHead]);
				newKey = getKey(newVKids[newHead] = getVNode(newVKids[newHead], oldVKid));
				if (newKeyed[oldKey] || newKey != null && newKey === getKey(oldVKids[oldHead + 1])) {
					if (oldKey == null) node.removeChild(oldVKid.node);
					oldHead++;
					continue;
				}
				if (newKey == null || oldVNode.type === RECYCLED_NODE) {
					if (oldKey == null) {
						patch(node, oldVKid && oldVKid.node, oldVKid, newVKids[newHead], listener, isSvg);
						newHead++;
					}
					oldHead++;
				} else {
					if (oldKey === newKey) {
						patch(node, oldVKid.node, oldVKid, newVKids[newHead], listener, isSvg);
						newKeyed[newKey] = true;
						oldHead++;
					} else if ((tmpVKid = keyed[newKey]) != null) {
						patch(node, node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node), tmpVKid, newVKids[newHead], listener, isSvg);
						newKeyed[newKey] = true;
					} else patch(node, oldVKid && oldVKid.node, null, newVKids[newHead], listener, isSvg);
					newHead++;
				}
			}
			while (oldHead <= oldTail) if (getKey(oldVKid = oldVKids[oldHead++]) == null) node.removeChild(oldVKid.node);
			for (var i in keyed) if (newKeyed[i] == null) node.removeChild(keyed[i].node);
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
	return node.nodeType === TEXT_NODE ? createTextVNode(node.nodeValue, node) : createVNode(node.nodeName.toLowerCase(), EMPTY_OBJ, map.call(node.childNodes, recycleNode), node, void 0, RECYCLED_NODE);
};
var h = function(name, props) {
	for (var vdom, rest = [], children = [], i = arguments.length; i-- > 2;) rest.push(arguments[i]);
	while (rest.length > 0) if (isArray(vdom = rest.pop())) for (var i = vdom.length; i-- > 0;) rest.push(vdom[i]);
	else if (vdom === false || vdom === true || vdom == null) {} else children.push(getTextVNode(vdom));
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
			if (subscriptions) subs = patchSubs(subs, batch([subscriptions(state)]), dispatch);
			if (view && !lock) defer(render, lock = true);
		}
		return state;
	};
	var dispatch = (props.middleware || function(obj) {
		return obj;
	})(function(action, props) {
		return typeof action === "function" ? dispatch(action(state, props)) : isArray(action) ? typeof action[0] === "function" || isArray(action[0]) ? dispatch(action[0], typeof action[1] === "function" ? action[1](props) : action[1]) : (batch(action.slice(1)).map(function(fx) {
			fx && fx[0](dispatch, fx[1]);
		}, setState(action[0])), state) : setState(action);
	});
	var render = function() {
		lock = false;
		node = patch(node.parentNode, node, vdom, vdom = getTextVNode(view(state)), listener);
		onEnd();
	};
	dispatch(props.init);
};
//#endregion
//#region root/src/hyperApp/time.ts
var timeFx = function(fx) {
	return function(action, props) {
		return [fx, {
			action,
			delay: props.delay
		}];
	};
};
timeFx(function(dispatch, props) {
	setTimeout(function() {
		dispatch(props.action);
	}, props.delay);
});
var interval = timeFx(function(dispatch, props) {
	var id = setInterval(function() {
		dispatch(props.action, Date.now());
	}, props.delay);
	return function() {
		clearInterval(id);
	};
});
//#endregion
//#region root/src/modules/global/http/gHttp.ts
var httpEffect = (dispatch, props) => {
	if (!props) return;
	http(dispatch, props, {
		ok: false,
		url: props.url,
		authenticationFail: false,
		parseType: props.parseType ?? "json"
	});
};
var http = (dispatch, props, output, nextDelegate = null) => {
	fetch(props.url, props.options).then(function(response) {
		if (response) {
			output.ok = response.ok === true;
			output.status = response.status;
			output.type = response.type;
			output.redirected = response.redirected;
			if (response.headers) {
				output.callID = response.headers.get("CallID");
				output.contentType = response.headers.get("content-type");
				if (output.contentType && output.contentType.indexOf("application/json") !== -1) output.parseType = "json";
			}
			if (response.status === 401) {
				output.authenticationFail = true;
				dispatch(props.onAuthenticationFailAction, output);
				return;
			}
		} else output.responseNull = true;
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
		if (result && output.parseType === "json") try {
			output.jsonData = JSON.parse(result);
		} catch (err) {
			output.error += `Error thrown parsing response.text() as json
`;
		}
		if (!output.ok) throw result;
		dispatch(props.action, output);
	}).then(function() {
		if (nextDelegate) return nextDelegate.delegate(nextDelegate.dispatch, nextDelegate.block, nextDelegate.nextHttpCall, nextDelegate.index);
	}).catch(function(error) {
		output.error += error;
		dispatch(props.error, output);
	});
};
var gHttp = (props) => {
	return [httpEffect, props];
};
//#endregion
//#region root/src/modules/interfaces/state/constants/Keys.ts
var Keys = { startUrl: "startUrl" };
//#endregion
//#region root/src/modules/state/effects/HttpEffect.ts
var HttpEffect = class {
	constructor(name, url, parseType, actionDelegate) {
		this.name = name;
		this.url = url;
		this.parseType = parseType;
		this.actionDelegate = actionDelegate;
	}
	name;
	url;
	parseType;
	actionDelegate;
};
//#endregion
//#region root/src/modules/global/gUtilities.ts
var gUtilities = {
	roundUpToNearestTen: (value) => {
		return (Math.floor(value / 10) + 1) * 10;
	},
	roundDownToNearestTen: (value) => {
		return Math.floor(value / 10) * 10;
	},
	convertMmToFeetInches: (mm) => {
		const inches = mm * .03937;
		return gUtilities.convertInchesToFeetInches(inches);
	},
	indexOfAny: (input, chars, startIndex = 0) => {
		for (let i = startIndex; i < input.length; i++) if (chars.includes(input[i]) === true) return i;
		return -1;
	},
	getDirectory: (filePath) => {
		var matches = filePath.match(/(.*)[\/\\]/);
		if (matches && matches.length > 0) return matches[1];
		return "";
	},
	countCharacter: (input, character) => {
		let length = input.length;
		let count = 0;
		for (let i = 0; i < length; i++) if (input[i] === character) count++;
		return count;
	},
	convertInchesToFeetInches: (inches) => {
		const feet = Math.floor(inches / 12);
		const inchesReamining = inches % 12;
		const inchesReaminingRounded = Math.round(inchesReamining * 10) / 10;
		let result = "";
		if (feet > 0) result = `${feet}' `;
		if (inchesReaminingRounded > 0) result = `${result}${inchesReaminingRounded}"`;
		return result;
	},
	isNullOrWhiteSpace: (input) => {
		if (input === null || input === void 0) return true;
		input = `${input}`;
		return input.match(/^\s*$/) !== null;
	},
	checkArraysEqual: (a, b) => {
		if (a === b) return true;
		if (a === null || b === null) return false;
		if (a.length !== b.length) return false;
		const x = [...a];
		const y = [...b];
		x.sort();
		y.sort();
		for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
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
		if (gUtilities.isNullOrWhiteSpace(input) === true) return false;
		return !isNaN(input);
	},
	isNegativeNumeric: (input) => {
		if (!gUtilities.isNumeric(input)) return false;
		return +input < 0;
	},
	hasDuplicates: (input) => {
		if (new Set(input).size !== input.length) return true;
		return false;
	},
	extend: (array1, array2) => {
		array2.forEach((item) => {
			array1.push(item);
		});
	},
	prettyPrintJsonFromString: (input) => {
		if (!input) return "";
		return gUtilities.prettyPrintJsonFromObject(JSON.parse(input));
	},
	prettyPrintJsonFromObject: (input) => {
		if (!input) return "";
		return JSON.stringify(input, null, 4);
	},
	isPositiveNumeric: (input) => {
		if (!gUtilities.isNumeric(input)) return false;
		return Number(input) >= 0;
	},
	getTime: () => {
		const now = new Date(Date.now());
		return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}::${now.getMilliseconds().toString().padStart(3, "0")}:`;
	},
	splitByNewLine: (input) => {
		if (gUtilities.isNullOrWhiteSpace(input) === true) return [];
		const results = input.split(/[\r\n]+/);
		const cleaned = [];
		results.forEach((value) => {
			if (!gUtilities.isNullOrWhiteSpace(value)) cleaned.push(value.trim());
		});
		return cleaned;
	},
	splitByPipe: (input) => {
		if (gUtilities.isNullOrWhiteSpace(input) === true) return [];
		const results = input.split("|");
		const cleaned = [];
		results.forEach((value) => {
			if (!gUtilities.isNullOrWhiteSpace(value)) cleaned.push(value.trim());
		});
		return cleaned;
	},
	splitByNewLineAndOrder: (input) => {
		return gUtilities.splitByNewLine(input).sort();
	},
	joinByNewLine: (input) => {
		if (!input || input.length === 0) return "";
		return input.join("\n");
	},
	removeAllChildren: (parent) => {
		if (parent !== null) while (parent.firstChild) parent.removeChild(parent.firstChild);
	},
	isOdd: (x) => {
		return x % 2 === 1;
	},
	shortPrintText: (input, maxLength = 100) => {
		if (gUtilities.isNullOrWhiteSpace(input) === true) return "";
		const firstNewLineIndex = gUtilities.getFirstNewLineIndex(input);
		if (firstNewLineIndex > 0 && firstNewLineIndex <= maxLength) {
			const output = input.substr(0, firstNewLineIndex - 1);
			return gUtilities.trimAndAddEllipsis(output);
		}
		if (input.length <= maxLength) return input;
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
			if (character === "\n" || character === "\r") return i;
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
		if (!useHypens) pattern = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx";
		return pattern.replace(/[xy]/g, function(c) {
			let r = Math.random() * 16;
			if (d > 0) {
				r = (d + r) % 16 | 0;
				d = Math.floor(d / 16);
			} else {
				r = (d2 + r) % 16 | 0;
				d2 = Math.floor(d2 / 16);
			}
			return (c === "x" ? r : r & 3 | 8).toString(16);
		});
	},
	checkIfChrome: () => {
		let tsWindow = window;
		let isChromium = tsWindow.chrome;
		let winNav = window.navigator;
		let vendorName = winNav.vendor;
		let isOpera = typeof tsWindow.opr !== "undefined";
		let isIEedge = winNav.userAgent.indexOf("Edge") > -1;
		if (winNav.userAgent.match("CriOS")) return true;
		else if (isChromium !== null && typeof isChromium !== "undefined" && vendorName === "Google Inc." && isOpera === false && isIEedge === false) return true;
		return false;
	}
};
//#endregion
//#region root/src/modules/state/history/HistoryUrl.ts
var HistoryUrl = class {
	constructor(url) {
		this.url = url;
	}
	url;
};
//#endregion
//#region root/src/modules/state/history/RenderSnapShot.ts
var RenderSnapShot = class {
	constructor(url) {
		this.url = url;
	}
	url;
	guid = null;
	created = null;
	modified = null;
	expandedOptionIDs = [];
	expandedAncillaryIDs = [];
};
//#endregion
//#region root/src/modules/global/code/gHistoryCode.ts
var buildUrlFromRoot = (root) => {
	const urlAssembler = { url: `${location.origin}${location.pathname}?` };
	if (!root.selected) return urlAssembler.url;
	printSegmentEnd(urlAssembler, root);
	return urlAssembler.url;
};
var printSegmentEnd = (urlAssembler, fragment) => {
	if (!fragment) return;
	if (fragment.link?.root) {
		let url = urlAssembler.url;
		url = `${url}~${fragment.id}`;
		urlAssembler.url = url;
		printSegmentEnd(urlAssembler, fragment.link.root);
	} else if (!gUtilities.isNullOrWhiteSpace(fragment.exitKey)) {
		let url = urlAssembler.url;
		url = `${url}_${fragment.id}`;
		urlAssembler.url = url;
	} else if (!fragment.link && !fragment.selected) {
		let url = urlAssembler.url;
		url = `${url}-${fragment.id}`;
		urlAssembler.url = url;
	}
	printSegmentEnd(urlAssembler, fragment.selected);
};
var gHistoryCode = {
	resetRaw: () => {
		window.TreeSolve.screen.autofocus = true;
		window.TreeSolve.screen.isAutofocusFirstRun = true;
	},
	pushBrowserHistoryState: (state) => {
		if (state.renderState.isChainLoad === true) return;
		state.renderState.refreshUrl = false;
		if (!state.renderState.currentSection?.current || !state.renderState.displayGuide?.root) return;
		gHistoryCode.resetRaw();
		const location = window.location;
		let lastUrl;
		if (window.history.state) lastUrl = window.history.state.url;
		else lastUrl = `${location.origin}${location.pathname}${location.search}`;
		const url = buildUrlFromRoot(state.renderState.displayGuide.root);
		if (lastUrl && url === lastUrl) return;
		history.pushState(new RenderSnapShot(url), "", url);
		state.stepHistory.historyChain.push(new HistoryUrl(url));
	}
};
//#endregion
//#region root/src/modules/global/code/gStateCode.ts
var count = 0;
var gStateCode = {
	setDirty: (state) => {
		state.renderState.ui.raw = false;
		state.renderState.isChainLoad = false;
	},
	getFreshKeyInt: (state) => {
		return ++state.nextKey;
	},
	getFreshKey: (state) => {
		return `${gStateCode.getFreshKeyInt(state)}`;
	},
	getGuidKey: () => {
		return gUtilities.generateGuid();
	},
	cloneState: (state) => {
		if (state.renderState.refreshUrl === true) gHistoryCode.pushBrowserHistoryState(state);
		return { ...state };
	},
	AddReLoadDataEffectImmediate: (state, name, parseType, url, actionDelegate) => {
		console.log(name);
		console.log(url);
		if (count > 0) return;
		if (url.endsWith("imyo6C08H.html")) count++;
		if (state.repeatEffects.reLoadGetHttpImmediate.find((effect) => {
			return effect.name === name && effect.url === url;
		})) return;
		const httpEffect = new HttpEffect(name, url, parseType, actionDelegate);
		state.repeatEffects.reLoadGetHttpImmediate.push(httpEffect);
	},
	AddRunActionImmediate: (state, actionDelegate) => {
		state.repeatEffects.runActionImmediate.push(actionDelegate);
	},
	getCached_outlineNode: (state, linkID, fragmentID) => {
		if (gUtilities.isNullOrWhiteSpace(fragmentID)) return null;
		const key = gStateCode.getCacheKey(linkID, fragmentID);
		const outlineNode = state.renderState.index_outlineNodes_id[key] ?? null;
		if (!outlineNode) console.log("OutlineNode was null");
		return outlineNode;
	},
	cache_outlineNode: (state, linkID, outlineNode) => {
		if (!outlineNode) return;
		const key = gStateCode.getCacheKey(linkID, outlineNode.i);
		if (state.renderState.index_outlineNodes_id[key]) return;
		state.renderState.index_outlineNodes_id[key] = outlineNode;
	},
	getCached_chainFragment: (state, linkID, fragmentID) => {
		if (gUtilities.isNullOrWhiteSpace(fragmentID) === true) return null;
		const key = gStateCode.getCacheKey(linkID, fragmentID);
		return state.renderState.index_chainFragments_id[key] ?? null;
	},
	cache_chainFragment: (state, renderFragment) => {
		if (!renderFragment) return;
		const key = gStateCode.getCacheKeyFromFragment(renderFragment);
		if (gUtilities.isNullOrWhiteSpace(key) === true) return;
		if (state.renderState.index_chainFragments_id[key]) return;
		state.renderState.index_chainFragments_id[key] = renderFragment;
	},
	getCacheKeyFromFragment: (renderFragment) => {
		return gStateCode.getCacheKey(renderFragment.section.linkID, renderFragment.id);
	},
	getCacheKey: (linkID, fragmentID) => {
		return `${linkID}_${fragmentID}`;
	}
};
//#endregion
//#region root/src/modules/global/http/gAuthenticationCode.ts
var gAuthenticationCode = { clearAuthentication: (state) => {
	state.user.authorised = false;
	state.user.name = "";
	state.user.sub = "";
	state.user.logoutUrl = "";
} };
//#endregion
//#region root/src/modules/interfaces/enums/ActionType.ts
var ActionType = /* @__PURE__ */ function(ActionType) {
	ActionType["None"] = "none";
	ActionType["FilterTopics"] = "filterTopics";
	ActionType["GetTopic"] = "getTopic";
	ActionType["GetTopicAndRoot"] = "getTopicAndRoot";
	ActionType["SaveArticleScene"] = "saveArticleScene";
	ActionType["GetRoot"] = "getRoot";
	ActionType["GetStep"] = "getStep";
	ActionType["GetPage"] = "getPage";
	ActionType["GetChain"] = "getChain";
	ActionType["GetOutline"] = "getOutline";
	ActionType["GetFragment"] = "getFragment";
	ActionType["GetChainFragment"] = "getChainFragment";
	return ActionType;
}({});
//#endregion
//#region root/src/modules/global/http/gAjaxHeaderCode.ts
var gAjaxHeaderCode = { buildHeaders: (state, callID, action) => {
	let headers = new Headers();
	headers.append("Content-Type", "application/json");
	headers.append("X-CSRF", "1");
	headers.append("SubscriptionID", state.settings.subscriptionID);
	headers.append("CallID", callID);
	headers.append("Action", action);
	headers.append("withCredentials", "true");
	return headers;
} };
//#endregion
//#region root/src/modules/global/http/gAuthenticationEffects.ts
var gAuthenticationEffects = { checkUserAuthenticated: (state) => {
	if (!state) return;
	const callID = gUtilities.generateGuid();
	let headers = gAjaxHeaderCode.buildHeaders(state, callID, ActionType.None);
	const url = `${state.settings.bffUrl}/${state.settings.userPath}?slide=false`;
	return gAuthenticatedHttp({
		url,
		options: {
			method: "GET",
			headers
		},
		response: "json",
		action: gAuthenticationActions.loadSuccessfulAuthentication,
		error: (state, errorDetails) => {
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
                    "state": ${JSON.stringify(state)}
                }`);
			return gStateCode.cloneState(state);
		}
	});
} };
//#endregion
//#region root/src/modules/global/http/gAuthenticationActions.ts
var gAuthenticationActions = {
	loadSuccessfulAuthentication: (state, response) => {
		if (!state || !response || response.parseType !== "json" || !response.jsonData) return state;
		const claims = response.jsonData;
		const name = claims.find((claim) => claim.type === "name");
		const sub = claims.find((claim) => claim.type === "sub");
		if (!name && !sub) return state;
		const logoutUrlClaim = claims.find((claim) => claim.type === "bff:logout_url");
		if (!logoutUrlClaim || !logoutUrlClaim.value) return state;
		state.user.authorised = true;
		state.user.name = name.value;
		state.user.sub = sub.value;
		state.user.logoutUrl = logoutUrlClaim.value;
		return gStateCode.cloneState(state);
	},
	checkUserLoggedIn: (state) => {
		const props = gAuthenticationActions.checkUserLoggedInProps(state);
		if (!props) return state;
		return [state, props];
	},
	checkUserLoggedInProps: (state) => {
		state.user.raw = false;
		return gAuthenticationEffects.checkUserAuthenticated(state);
	},
	login: (state) => {
		const currentUrl = window.location.href;
		sessionStorage.setItem(Keys.startUrl, currentUrl);
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
//#endregion
//#region root/src/modules/global/http/gAuthenticationHttp.ts
function gAuthenticatedHttp(props) {
	const httpAuthenticatedProperties = props;
	httpAuthenticatedProperties.onAuthenticationFailAction = gAuthenticationActions.clearAuthenticationAndShowLogin;
	return gHttp(httpAuthenticatedProperties);
}
//#endregion
//#region root/src/modules/global/actions/gRepeatActions.ts
var runActionInner = (dispatch, props) => {
	dispatch(props.action);
};
var runAction = (state, queuedEffects) => {
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
		effects.push([runActionInner, props]);
	});
	return [gStateCode.cloneState(state), ...effects];
};
var sendRequest = (state, queuedEffects) => {
	const effects = [];
	queuedEffects.forEach((httpEffect) => {
		getEffect(state, httpEffect, effects);
	});
	return [gStateCode.cloneState(state), ...effects];
};
var getEffect = (_state, httpEffect, effects) => {
	const url = httpEffect.url;
	const callID = gUtilities.generateGuid();
	let headers = new Headers();
	headers.append("Accept", "*/*");
	const options = {
		method: "GET",
		headers
	};
	const effect = gAuthenticatedHttp({
		url,
		parseType: httpEffect.parseType,
		options,
		response: "json",
		action: httpEffect.actionDelegate,
		error: (_state, errorDetails) => {
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
var gRepeatActions = {
	httpSilentReLoadImmediate: (state) => {
		if (!state) return state;
		if (state.repeatEffects.reLoadGetHttpImmediate.length === 0) return state;
		const reLoadHttpEffectsImmediate = state.repeatEffects.reLoadGetHttpImmediate;
		state.repeatEffects.reLoadGetHttpImmediate = [];
		return sendRequest(state, reLoadHttpEffectsImmediate);
	},
	silentRunActionImmediate: (state) => {
		if (!state) return state;
		if (state.repeatEffects.runActionImmediate.length === 0) return state;
		const runActionImmediate = state.repeatEffects.runActionImmediate;
		state.repeatEffects.runActionImmediate = [];
		return runAction(state, runActionImmediate);
	}
};
//#endregion
//#region root/src/modules/subscriptions/repeatSubscription.ts
var repeatSubscriptions = { buildRepeatSubscriptions: (state) => {
	const buildReLoadDataImmediate = () => {
		if (state.repeatEffects.reLoadGetHttpImmediate.length > 0) return interval(gRepeatActions.httpSilentReLoadImmediate, { delay: 10 });
	};
	const buildRunActionsImmediate = () => {
		if (state.repeatEffects.runActionImmediate.length > 0) return interval(gRepeatActions.silentRunActionImmediate, { delay: 10 });
	};
	return [buildReLoadDataImmediate(), buildRunActionsImmediate()];
} };
//#endregion
//#region root/src/modules/components/init/subscriptions/initSubscriptions.ts
var initSubscriptions = (state) => {
	if (!state) return;
	return [...repeatSubscriptions.buildRepeatSubscriptions(state)];
};
//#endregion
//#region node_modules/@vimeo/player/dist/player.es.js
/*! @vimeo/player v2.30.3 | (c) 2026 Vimeo | MIT License | https://github.com/vimeo/player.js */
/**
* @module lib/functions
*/
/**
* Check to see this is a Node environment.
* @type {boolean}
*/
var isNode = typeof global !== "undefined" && {}.toString.call(global) === "[object global]";
/**
* Check to see if this is a Bun environment.
* @see https://bun.sh/guides/util/detect-bun
* @type {boolean}
*/
var isBun = typeof Bun !== "undefined";
/**
* Check to see if this is a Deno environment.
* @see https://docs.deno.com/api/deno/~/Deno
* @type {boolean}
*/
var isDeno = typeof Deno !== "undefined";
/**
* Check to see if this is a Cloudflare Worker environment.
* @see https://community.cloudflare.com/t/how-to-detect-the-cloudflare-worker-runtime/293715
* @type {boolean}
*/
var isCloudflareWorker = typeof WebSocketPair === "function" && typeof caches?.default !== "undefined";
/**
* Check if this is a server runtime
* @type {boolean}
*/
var isServerRuntime = isNode || isBun || isDeno || isCloudflareWorker;
/**
* Get the name of the method for a given getter or setter.
*
* @param {string} prop The name of the property.
* @param {string} type Either “get” or “set”.
* @return {string}
*/
function getMethodName(prop, type) {
	if (prop.indexOf(type.toLowerCase()) === 0) return prop;
	return `${type.toLowerCase()}${prop.substr(0, 1).toUpperCase()}${prop.substr(1)}`;
}
/**
* Check to see if the object is a DOM Element.
*
* @param {*} element The object to check.
* @return {boolean}
*/
function isDomElement(element) {
	return Boolean(element && element.nodeType === 1 && "nodeName" in element && element.ownerDocument && element.ownerDocument.defaultView);
}
/**
* Check to see whether the value is a number.
*
* @see http://dl.dropboxusercontent.com/u/35146/js/tests/isNumber.html
* @param {*} value The value to check.
* @param {boolean} integer Check if the value is an integer.
* @return {boolean}
*/
function isInteger(value) {
	return !isNaN(parseFloat(value)) && isFinite(value) && Math.floor(value) == value;
}
/**
* Check to see if the URL is a Vimeo url.
*
* @param {string} url The url string.
* @return {boolean}
*/
function isVimeoUrl(url) {
	return /^(https?:)?\/\/((((player|www)\.)?vimeo\.com)|((player\.)?[a-zA-Z0-9-]+\.(videoji\.(hk|cn)|vimeo\.work)))(?=$|\/)/.test(url);
}
/**
* Check to see if the URL is for a Vimeo embed.
*
* @param {string} url The url string.
* @return {boolean}
*/
function isVimeoEmbed(url) {
	return /^https:\/\/player\.((vimeo\.com)|([a-zA-Z0-9-]+\.(videoji\.(hk|cn)|vimeo\.work)))\/video\/\d+/.test(url);
}
function getOembedDomain(url) {
	const match = (url || "").match(/^(?:https?:)?(?:\/\/)?([^/?]+)/);
	const domain = (match && match[1] || "").replace("player.", "");
	for (const customDomain of [
		".videoji.hk",
		".vimeo.work",
		".videoji.cn"
	]) if (domain.endsWith(customDomain)) return domain;
	return "vimeo.com";
}
/**
* Get the Vimeo URL from an element.
* The element must have either a data-vimeo-id or data-vimeo-url attribute.
*
* @param {object} oEmbedParameters The oEmbed parameters.
* @return {string}
*/
function getVimeoUrl() {
	let oEmbedParameters = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
	const id = oEmbedParameters.id;
	const url = oEmbedParameters.url;
	const idOrUrl = id || url;
	if (!idOrUrl) throw new Error("An id or url must be passed, either in an options object or as a data-vimeo-id or data-vimeo-url attribute.");
	if (isInteger(idOrUrl)) return `https://vimeo.com/${idOrUrl}`;
	if (isVimeoUrl(idOrUrl)) return idOrUrl.replace("http:", "https:");
	if (id) throw new TypeError(`“${id}” is not a valid video id.`);
	throw new TypeError(`“${idOrUrl}” is not a vimeo.com url.`);
}
/**
* A utility method for attaching and detaching event handlers
*
* @param {EventTarget} target
* @param {string | string[]} eventName
* @param {function} callback
* @param {'addEventListener' | 'on'} onName
* @param {'removeEventListener' | 'off'} offName
* @return {{cancel: (function(): void)}}
*/
var subscribe = function(target, eventName, callback) {
	let onName = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "addEventListener";
	let offName = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : "removeEventListener";
	const eventNames = typeof eventName === "string" ? [eventName] : eventName;
	eventNames.forEach((evName) => {
		target[onName](evName, callback);
	});
	return { cancel: () => eventNames.forEach((evName) => target[offName](evName, callback)) };
};
/**
* Find the iframe element that contains a specific source window
*
* @param {Window} sourceWindow The source window to find the iframe for
* @param {Document} [doc=document] The document to search within
* @return {HTMLIFrameElement|null} The iframe element if found, otherwise null
*/
function findIframeBySourceWindow(sourceWindow) {
	let doc = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : document;
	if (!sourceWindow || !doc || typeof doc.querySelectorAll !== "function") return null;
	const iframes = doc.querySelectorAll("iframe");
	for (let i = 0; i < iframes.length; i++) if (iframes[i] && iframes[i].contentWindow === sourceWindow) return iframes[i];
	return null;
}
var arrayIndexOfSupport = typeof Array.prototype.indexOf !== "undefined";
var postMessageSupport = typeof window !== "undefined" && typeof window.postMessage !== "undefined";
if (!isServerRuntime && (!arrayIndexOfSupport || !postMessageSupport)) throw new Error("Sorry, the Vimeo Player API is not available in this browser.");
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
(function(self) {
	if (self.WeakMap) return;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var hasDefine = Object.defineProperty && function() {
		try {
			return Object.defineProperty({}, "x", { value: 1 }).x === 1;
		} catch (e) {}
	}();
	var defineProperty = function(object, name, value) {
		if (hasDefine) Object.defineProperty(object, name, {
			configurable: true,
			writable: true,
			value
		});
		else object[name] = value;
	};
	self.WeakMap = function() {
		function WeakMap() {
			if (this === void 0) throw new TypeError("Constructor WeakMap requires 'new'");
			defineProperty(this, "_id", genId("_WeakMap"));
			if (arguments.length > 0) throw new TypeError("WeakMap iterable is not supported");
		}
		defineProperty(WeakMap.prototype, "delete", function(key) {
			checkInstance(this, "delete");
			if (!isObject(key)) return false;
			var entry = key[this._id];
			if (entry && entry[0] === key) {
				delete key[this._id];
				return true;
			}
			return false;
		});
		defineProperty(WeakMap.prototype, "get", function(key) {
			checkInstance(this, "get");
			if (!isObject(key)) return;
			var entry = key[this._id];
			if (entry && entry[0] === key) return entry[1];
		});
		defineProperty(WeakMap.prototype, "has", function(key) {
			checkInstance(this, "has");
			if (!isObject(key)) return false;
			var entry = key[this._id];
			if (entry && entry[0] === key) return true;
			return false;
		});
		defineProperty(WeakMap.prototype, "set", function(key, value) {
			checkInstance(this, "set");
			if (!isObject(key)) throw new TypeError("Invalid value used as weak map key");
			var entry = key[this._id];
			if (entry && entry[0] === key) {
				entry[1] = value;
				return this;
			}
			defineProperty(key, this._id, [key, value]);
			return this;
		});
		function checkInstance(x, methodName) {
			if (!isObject(x) || !hasOwnProperty.call(x, "_id")) throw new TypeError(methodName + " method called on incompatible receiver " + typeof x);
		}
		function genId(prefix) {
			return prefix + "_" + rand() + "." + rand();
		}
		function rand() {
			return Math.random().toString().substring(2);
		}
		defineProperty(WeakMap, "_polyfill", true);
		return WeakMap;
	}();
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
		if (module.exports) module.exports = context[name];
	})("Promise", typeof commonjsGlobal != "undefined" ? commonjsGlobal : commonjsGlobal, function DEF() {
		var builtInProp, cycle, scheduling_queue, ToString = Object.prototype.toString, timer = typeof setImmediate != "undefined" ? function timer(fn) {
			return setImmediate(fn);
		} : setTimeout;
		try {
			Object.defineProperty({}, "x", {});
			builtInProp = function builtInProp(obj, name, val, config) {
				return Object.defineProperty(obj, name, {
					value: val,
					writable: true,
					configurable: config !== false
				});
			};
		} catch (err) {
			builtInProp = function builtInProp(obj, name, val) {
				obj[name] = val;
				return obj;
			};
		}
		scheduling_queue = function Queue() {
			var first, last, item;
			function Item(fn, self) {
				this.fn = fn;
				this.self = self;
				this.next = void 0;
			}
			return {
				add: function add(fn, self) {
					item = new Item(fn, self);
					if (last) last.next = item;
					else first = item;
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
		}();
		function schedule(fn, self) {
			scheduling_queue.add(fn, self);
			if (!cycle) cycle = timer(scheduling_queue.drain);
		}
		function isThenable(o) {
			var _then, o_type = typeof o;
			if (o != null && (o_type == "object" || o_type == "function")) _then = o.then;
			return typeof _then == "function" ? _then : false;
		}
		function notify() {
			for (var i = 0; i < this.chain.length; i++) notifyIsolated(this, this.state === 1 ? this.chain[i].success : this.chain[i].failure, this.chain[i]);
			this.chain.length = 0;
		}
		function notifyIsolated(self, cb, chain) {
			var ret, _then;
			try {
				if (cb === false) chain.reject(self.msg);
				else {
					if (cb === true) ret = self.msg;
					else ret = cb.call(void 0, self.msg);
					if (ret === chain.promise) chain.reject(TypeError("Promise-chain cycle"));
					else if (_then = isThenable(ret)) _then.call(ret, chain.resolve, chain.reject);
					else chain.resolve(ret);
				}
			} catch (err) {
				chain.reject(err);
			}
		}
		function resolve(msg) {
			var _then, self = this;
			if (self.triggered) return;
			self.triggered = true;
			if (self.def) self = self.def;
			try {
				if (_then = isThenable(msg)) schedule(function() {
					var def_wrapper = new MakeDefWrapper(self);
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
				else {
					self.msg = msg;
					self.state = 1;
					if (self.chain.length > 0) schedule(notify, self);
				}
			} catch (err) {
				reject.call(new MakeDefWrapper(self), err);
			}
		}
		function reject(msg) {
			var self = this;
			if (self.triggered) return;
			self.triggered = true;
			if (self.def) self = self.def;
			self.msg = msg;
			self.state = 2;
			if (self.chain.length > 0) schedule(notify, self);
		}
		function iteratePromises(Constructor, arr, resolver, rejecter) {
			for (var idx = 0; idx < arr.length; idx++) (function IIFE(idx) {
				Constructor.resolve(arr[idx]).then(function $resolver$(msg) {
					resolver(idx, msg);
				}, rejecter);
			})(idx);
		}
		function MakeDefWrapper(self) {
			this.def = self;
			this.triggered = false;
		}
		function MakeDef(self) {
			this.promise = self;
			this.state = 0;
			this.triggered = false;
			this.chain = [];
			this.msg = void 0;
		}
		function Promise(executor) {
			if (typeof executor != "function") throw TypeError("Not a function");
			if (this.__NPO__ !== 0) throw TypeError("Not a promise");
			this.__NPO__ = 1;
			var def = new MakeDef(this);
			this["then"] = function then(success, failure) {
				var o = {
					success: typeof success == "function" ? success : true,
					failure: typeof failure == "function" ? failure : false
				};
				o.promise = new this.constructor(function extractChain(resolve, reject) {
					if (typeof resolve != "function" || typeof reject != "function") throw TypeError("Not a function");
					o.resolve = resolve;
					o.reject = reject;
				});
				def.chain.push(o);
				if (def.state !== 0) schedule(notify, def);
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
		var PromisePrototype = builtInProp({}, "constructor", Promise, false);
		Promise.prototype = PromisePrototype;
		builtInProp(PromisePrototype, "__NPO__", 0, false);
		builtInProp(Promise, "resolve", function Promise$resolve(msg) {
			var Constructor = this;
			if (msg && typeof msg == "object" && msg.__NPO__ === 1) return msg;
			return new Constructor(function executor(resolve, reject) {
				if (typeof resolve != "function" || typeof reject != "function") throw TypeError("Not a function");
				resolve(msg);
			});
		});
		builtInProp(Promise, "reject", function Promise$reject(msg) {
			return new this(function executor(resolve, reject) {
				if (typeof resolve != "function" || typeof reject != "function") throw TypeError("Not a function");
				reject(msg);
			});
		});
		builtInProp(Promise, "all", function Promise$all(arr) {
			var Constructor = this;
			if (ToString.call(arr) != "[object Array]") return Constructor.reject(TypeError("Not an array"));
			if (arr.length === 0) return Constructor.resolve([]);
			return new Constructor(function executor(resolve, reject) {
				if (typeof resolve != "function" || typeof reject != "function") throw TypeError("Not a function");
				var len = arr.length, msgs = Array(len), count = 0;
				iteratePromises(Constructor, arr, function resolver(idx, msg) {
					msgs[idx] = msg;
					if (++count === len) resolve(msgs);
				}, reject);
			});
		});
		builtInProp(Promise, "race", function Promise$race(arr) {
			var Constructor = this;
			if (ToString.call(arr) != "[object Array]") return Constructor.reject(TypeError("Not an array"));
			return new Constructor(function executor(resolve, reject) {
				if (typeof resolve != "function" || typeof reject != "function") throw TypeError("Not a function");
				iteratePromises(Constructor, arr, function resolver(idx, msg) {
					resolve(msg);
				}, reject);
			});
		});
		return Promise;
	});
});
/**
* @module lib/callbacks
*/
var callbackMap = /* @__PURE__ */ new WeakMap();
/**
* Store a callback for a method or event for a player.
*
* @param {Player} player The player object.
* @param {string} name The method or event name.
* @param {(function(this:Player, *): void|{resolve: function, reject: function})} callback
*        The callback to call or an object with resolve and reject functions for a promise.
* @return {void}
*/
function storeCallback(player, name, callback) {
	const playerCallbacks = callbackMap.get(player.element) || {};
	if (!(name in playerCallbacks)) playerCallbacks[name] = [];
	playerCallbacks[name].push(callback);
	callbackMap.set(player.element, playerCallbacks);
}
/**
* Get the callbacks for a player and event or method.
*
* @param {Player} player The player object.
* @param {string} name The method or event name
* @return {function[]}
*/
function getCallbacks(player, name) {
	return (callbackMap.get(player.element) || {})[name] || [];
}
/**
* Remove a stored callback for a method or event for a player.
*
* @param {Player} player The player object.
* @param {string} name The method or event name
* @param {function} [callback] The specific callback to remove.
* @return {boolean} Was this the last callback?
*/
function removeCallback(player, name, callback) {
	const playerCallbacks = callbackMap.get(player.element) || {};
	if (!playerCallbacks[name]) return true;
	if (!callback) {
		playerCallbacks[name] = [];
		callbackMap.set(player.element, playerCallbacks);
		return true;
	}
	const index = playerCallbacks[name].indexOf(callback);
	if (index !== -1) playerCallbacks[name].splice(index, 1);
	callbackMap.set(player.element, playerCallbacks);
	return playerCallbacks[name] && playerCallbacks[name].length === 0;
}
/**
* Return the first stored callback for a player and event or method.
*
* @param {Player} player The player object.
* @param {string} name The method or event name.
* @return {function} The callback, or false if there were none
*/
function shiftCallbacks(player, name) {
	const playerCallbacks = getCallbacks(player, name);
	if (playerCallbacks.length < 1) return false;
	const callback = playerCallbacks.shift();
	removeCallback(player, name, callback);
	return callback;
}
/**
* Move callbacks associated with an element to another element.
*
* @param {HTMLElement} oldElement The old element.
* @param {HTMLElement} newElement The new element.
* @return {void}
*/
function swapCallbacks(oldElement, newElement) {
	const playerCallbacks = callbackMap.get(oldElement);
	callbackMap.set(newElement, playerCallbacks);
	callbackMap.delete(oldElement);
}
/**
* @module lib/postmessage
*/
/**
* Parse a message received from postMessage.
*
* @param {*} data The data received from postMessage.
* @return {object}
*/
function parseMessageData(data) {
	if (typeof data === "string") try {
		data = JSON.parse(data);
	} catch (error) {
		console.warn(error);
		return {};
	}
	return data;
}
/**
* Post a message to the specified target.
*
* @param {Player} player The player object to use.
* @param {string} method The API method to call.
* @param {string|number|object|Array|undefined} params The parameters to send to the player.
* @return {void}
*/
function postMessage(player, method, params) {
	if (!player.element.contentWindow || !player.element.contentWindow.postMessage) return;
	let message = { method };
	if (params !== void 0) message.value = params;
	const ieVersion = parseFloat(navigator.userAgent.toLowerCase().replace(/^.*msie (\d+).*$/, "$1"));
	if (ieVersion >= 8 && ieVersion < 10) message = JSON.stringify(message);
	player.element.contentWindow.postMessage(message, player.origin);
}
/**
* Parse the data received from a message event.
*
* @param {Player} player The player that received the message.
* @param {(Object|string)} data The message data. Strings will be parsed into JSON.
* @return {void}
*/
function processData(player, data) {
	data = parseMessageData(data);
	let callbacks = [];
	let param;
	if (data.event) {
		if (data.event === "error") getCallbacks(player, data.data.method).forEach((promise) => {
			const error = new Error(data.data.message);
			error.name = data.data.name;
			promise.reject(error);
			removeCallback(player, data.data.method, promise);
		});
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
		} catch (e) {}
	});
}
/**
* @module lib/embed
*/
var oEmbedParameters = [
	"airplay",
	"audio_tracks",
	"audiotrack",
	"autopause",
	"autoplay",
	"background",
	"byline",
	"cc",
	"chapter_id",
	"chapters",
	"chromecast",
	"color",
	"colors",
	"controls",
	"dnt",
	"end_time",
	"fullscreen",
	"height",
	"id",
	"initial_quality",
	"interactive_params",
	"keyboard",
	"loop",
	"maxheight",
	"max_quality",
	"maxwidth",
	"min_quality",
	"muted",
	"play_button_position",
	"playsinline",
	"portrait",
	"preload",
	"progress_bar",
	"quality",
	"quality_selector",
	"responsive",
	"skipping_forward",
	"speed",
	"start_time",
	"texttrack",
	"thumbnail_id",
	"title",
	"transcript",
	"transparent",
	"unmute_button",
	"url",
	"vimeo_logo",
	"volume",
	"watch_full_video",
	"width"
];
/**
* Get the 'data-vimeo'-prefixed attributes from an element as an object.
*
* @param {HTMLElement} element The element.
* @param {Object} [defaults={}] The default values to use.
* @return {Object<string, string>}
*/
function getOEmbedParameters(element) {
	let defaults = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	return oEmbedParameters.reduce((params, param) => {
		const value = element.getAttribute(`data-vimeo-${param}`);
		if (value || value === "") params[param] = value === "" ? 1 : value;
		return params;
	}, defaults);
}
/**
* Create an embed from oEmbed data inside an element.
*
* @param {object} data The oEmbed data.
* @param {HTMLElement} element The element to put the iframe in.
* @return {HTMLIFrameElement} The iframe embed.
*/
function createEmbed(_ref, element) {
	let { html } = _ref;
	if (!element) throw new TypeError("An element must be provided");
	if (element.getAttribute("data-vimeo-initialized") !== null) return element.querySelector("iframe");
	const div = document.createElement("div");
	div.innerHTML = html;
	element.appendChild(div.firstChild);
	element.setAttribute("data-vimeo-initialized", "true");
	return element.querySelector("iframe");
}
/**
* Make an oEmbed call for the specified URL.
*
* @param {string} videoUrl The vimeo.com url for the video.
* @param {Object} [params] Parameters to pass to oEmbed.
* @param {HTMLElement} element The element.
* @return {Promise}
*/
function getOEmbedData(videoUrl) {
	let params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
	let element = arguments.length > 2 ? arguments[2] : void 0;
	return new Promise((resolve, reject) => {
		if (!isVimeoUrl(videoUrl)) throw new TypeError(`“${videoUrl}” is not a vimeo.com url.`);
		let url = `https://${getOembedDomain(videoUrl)}/api/oembed.json?url=${encodeURIComponent(videoUrl)}`;
		for (const param in params) if (params.hasOwnProperty(param)) url += `&${param}=${encodeURIComponent(params[param])}`;
		const xhr = "XDomainRequest" in window ? new XDomainRequest() : new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.onload = function() {
			if (xhr.status === 404) {
				reject(/* @__PURE__ */ new Error(`“${videoUrl}” was not found.`));
				return;
			}
			if (xhr.status === 403) {
				reject(/* @__PURE__ */ new Error(`“${videoUrl}” is not embeddable.`));
				return;
			}
			try {
				const json = JSON.parse(xhr.responseText);
				if (json.domain_status_code === 403) {
					createEmbed(json, element);
					reject(/* @__PURE__ */ new Error(`“${videoUrl}” is not embeddable.`));
					return;
				}
				resolve(json);
			} catch (error) {
				reject(error);
			}
		};
		xhr.onerror = function() {
			const status = xhr.status ? ` (${xhr.status})` : "";
			reject(/* @__PURE__ */ new Error(`There was an error fetching the embed code from Vimeo${status}.`));
		};
		xhr.send();
	});
}
/**
* Initialize all embeds within a specific element
*
* @param {HTMLElement} [parent=document] The parent element.
* @return {void}
*/
function initializeEmbeds() {
	let parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
	const elements = [].slice.call(parent.querySelectorAll("[data-vimeo-id], [data-vimeo-url]"));
	const handleError = (error) => {
		if ("console" in window && console.error) console.error(`There was an error creating an embed: ${error}`);
	};
	elements.forEach((element) => {
		try {
			if (element.getAttribute("data-vimeo-defer") !== null) return;
			const params = getOEmbedParameters(element);
			getOEmbedData(getVimeoUrl(params), params, element).then((data) => {
				return createEmbed(data, element);
			}).catch(handleError);
		} catch (error) {
			handleError(error);
		}
	});
}
/**
* Resize embeds when messaged by the player.
*
* @param {HTMLElement} [parent=document] The parent element.
* @return {void}
*/
function resizeEmbeds() {
	let parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
	if (window.VimeoPlayerResizeEmbeds_) return;
	window.VimeoPlayerResizeEmbeds_ = true;
	const onMessage = (event) => {
		if (!isVimeoUrl(event.origin)) return;
		if (!event.data || event.data.event !== "spacechange") return;
		const senderIFrame = event.source ? findIframeBySourceWindow(event.source, parent) : null;
		if (senderIFrame) {
			const space = senderIFrame.parentElement;
			space.style.paddingBottom = `${event.data.data[0].bottom}px`;
		}
	};
	window.addEventListener("message", onMessage);
}
/**
* Add chapters to existing metadata for Google SEO
*
* @param {HTMLElement} [parent=document] The parent element.
* @return {void}
*/
function initAppendVideoMetadata() {
	let parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
	if (window.VimeoSeoMetadataAppended) return;
	window.VimeoSeoMetadataAppended = true;
	const onMessage = (event) => {
		if (!isVimeoUrl(event.origin)) return;
		const data = parseMessageData(event.data);
		if (!data || data.event !== "ready") return;
		const senderIFrame = event.source ? findIframeBySourceWindow(event.source, parent) : null;
		if (senderIFrame && isVimeoEmbed(senderIFrame.src)) new Player(senderIFrame).callMethod("appendVideoMetadata", window.location.href);
	};
	window.addEventListener("message", onMessage);
}
/**
* Seek to time indicated by vimeo_t query parameter if present in URL
*
* @param {HTMLElement} [parent=document] The parent element.
* @return {void}
*/
function checkUrlTimeParam() {
	let parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
	if (window.VimeoCheckedUrlTimeParam) return;
	window.VimeoCheckedUrlTimeParam = true;
	const handleError = (error) => {
		if ("console" in window && console.error) console.error(`There was an error getting video Id: ${error}`);
	};
	const onMessage = (event) => {
		if (!isVimeoUrl(event.origin)) return;
		const data = parseMessageData(event.data);
		if (!data || data.event !== "ready") return;
		const senderIFrame = event.source ? findIframeBySourceWindow(event.source, parent) : null;
		if (senderIFrame && isVimeoEmbed(senderIFrame.src)) {
			const player = new Player(senderIFrame);
			player.getVideoId().then((videoId) => {
				const matches = new RegExp(`[?&]vimeo_t_${videoId}=([^&#]*)`).exec(window.location.href);
				if (matches && matches[1]) {
					const sec = decodeURI(matches[1]);
					player.setCurrentTime(sec);
				}
			}).catch(handleError);
		}
	};
	window.addEventListener("message", onMessage);
}
/**
* Updates iframe embeds to support DRM content playback by adding the 'encrypted-media' permission
* to the iframe's allow attribute when DRM initialization fails. This function acts as a fallback
* mechanism to enable playback of DRM-protected content in embeds that weren't properly configured.
*
* @return {void}
*/
function updateDRMEmbeds() {
	if (window.VimeoDRMEmbedsUpdated) return;
	window.VimeoDRMEmbedsUpdated = true;
	/**
	* Handle message events for DRM initialization failures
	* @param {MessageEvent} event - The message event from the iframe
	*/
	const onMessage = (event) => {
		if (!isVimeoUrl(event.origin)) return;
		const data = parseMessageData(event.data);
		if (!data || data.event !== "drminitfailed") return;
		const senderIFrame = event.source ? findIframeBySourceWindow(event.source) : null;
		if (!senderIFrame) return;
		const currentAllow = senderIFrame.getAttribute("allow") || "";
		if (!currentAllow.includes("encrypted-media")) {
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
	const fn = function() {
		let val;
		const fnMap = [
			[
				"requestFullscreen",
				"exitFullscreen",
				"fullscreenElement",
				"fullscreenEnabled",
				"fullscreenchange",
				"fullscreenerror"
			],
			[
				"webkitRequestFullscreen",
				"webkitExitFullscreen",
				"webkitFullscreenElement",
				"webkitFullscreenEnabled",
				"webkitfullscreenchange",
				"webkitfullscreenerror"
			],
			[
				"webkitRequestFullScreen",
				"webkitCancelFullScreen",
				"webkitCurrentFullScreenElement",
				"webkitCancelFullScreen",
				"webkitfullscreenchange",
				"webkitfullscreenerror"
			],
			[
				"mozRequestFullScreen",
				"mozCancelFullScreen",
				"mozFullScreenElement",
				"mozFullScreenEnabled",
				"mozfullscreenchange",
				"mozfullscreenerror"
			],
			[
				"msRequestFullscreen",
				"msExitFullscreen",
				"msFullscreenElement",
				"msFullscreenEnabled",
				"MSFullscreenChange",
				"MSFullscreenError"
			]
		];
		let i = 0;
		const l = fnMap.length;
		const ret = {};
		for (; i < l; i++) {
			val = fnMap[i];
			if (val && val[1] in document) {
				for (i = 0; i < val.length; i++) ret[fnMap[0][i]] = val[i];
				return ret;
			}
		}
		return false;
	}();
	const eventNameMap = {
		fullscreenchange: fn.fullscreenchange,
		fullscreenerror: fn.fullscreenerror
	};
	const screenfull = {
		request(element) {
			return new Promise((resolve, reject) => {
				const onFullScreenEntered = function() {
					screenfull.off("fullscreenchange", onFullScreenEntered);
					resolve();
				};
				screenfull.on("fullscreenchange", onFullScreenEntered);
				element = element || document.documentElement;
				const returnPromise = element[fn.requestFullscreen]();
				if (returnPromise instanceof Promise) returnPromise.then(onFullScreenEntered).catch(reject);
			});
		},
		exit() {
			return new Promise((resolve, reject) => {
				if (!screenfull.isFullscreen) {
					resolve();
					return;
				}
				const onFullScreenExit = function() {
					screenfull.off("fullscreenchange", onFullScreenExit);
					resolve();
				};
				screenfull.on("fullscreenchange", onFullScreenExit);
				const returnPromise = document[fn.exitFullscreen]();
				if (returnPromise instanceof Promise) returnPromise.then(onFullScreenExit).catch(reject);
			});
		},
		on(event, callback) {
			const eventName = eventNameMap[event];
			if (eventName) document.addEventListener(eventName, callback);
		},
		off(event, callback) {
			const eventName = eventNameMap[event];
			if (eventName) document.removeEventListener(eventName, callback);
		}
	};
	Object.defineProperties(screenfull, {
		isFullscreen: { get() {
			return Boolean(document[fn.fullscreenElement]);
		} },
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
	return screenfull;
}
/** @typedef {import('./timing-src-connector.types').PlayerControls} PlayerControls */
/** @typedef {import('timing-object').ITimingObject} TimingObject */
/** @typedef {import('./timing-src-connector.types').TimingSrcConnectorOptions} TimingSrcConnectorOptions */
/** @typedef {(msg: string) => any} Logger */
/** @typedef {import('timing-object').TConnectionState} TConnectionState */
/**
* @type {TimingSrcConnectorOptions}
*
* For details on these properties and their effects, see the typescript definition referenced above.
*/
var defaultOptions = {
	role: "viewer",
	autoPlayMuted: true,
	allowedDrift: .3,
	maxAllowedDrift: 1,
	minCheckInterval: .1,
	maxRateAdjustment: .2,
	maxTimeToCatchUp: 1
};
/**
* There's a proposed W3C spec for the Timing Object which would introduce a new set of APIs that would simplify time-synchronization tasks for browser applications.
*
* Proposed spec: https://webtiming.github.io/timingobject/
* V3 Spec: https://timingsrc.readthedocs.io/en/latest/
* Demuxed talk: https://www.youtube.com/watch?v=cZSjDaGDmX8
*
* This class makes it easy to connect Vimeo.Player to a provided TimingObject via Vimeo.Player.setTimingSrc(myTimingObject, options) and the synchronization will be handled automatically.
*
* There are 5 general responsibilities in TimingSrcConnector:
*
* 1. `updatePlayer()` which sets the player's currentTime, playbackRate and pause/play state based on current state of the TimingObject.
* 2. `updateTimingObject()` which sets the TimingObject's position and velocity from the player's state.
* 3. `playerUpdater` which listens for change events on the TimingObject and will respond by calling updatePlayer.
* 4. `timingObjectUpdater` which listens to the player events of seeked, play and pause and will respond by calling `updateTimingObject()`.
* 5. `maintainPlaybackPosition` this is code that constantly monitors the player to make sure it's always in sync with the TimingObject. This is needed because videos will generally not play with precise time accuracy and there will be some drift which becomes more noticeable over longer periods (as noted in the timing-object spec). More details on this method below.
*/
var TimingSrcConnector = class extends EventTarget {
	logger;
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
			const timingObjectUpdater = subscribe(player, [
				"seeked",
				"play",
				"pause",
				"ratechange"
			], () => this.updateTimingObject(timingObject, player), "on", "off");
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
		const [position, isPaused, playbackRate] = await Promise.all([
			player.getCurrentTime(),
			player.getPaused(),
			player.getPlaybackRate()
		]);
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
		const { position, velocity } = timingObject.query();
		if (typeof position === "number") player.setCurrentTime(position);
		if (typeof velocity === "number") {
			if (velocity === 0) {
				if (await player.getPaused() === false) player.pause();
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
				if (await player.getPlaybackRate() !== velocity) player.setPlaybackRate(velocity);
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
		const { allowedDrift, maxAllowedDrift, minCheckInterval, maxRateAdjustment, maxTimeToCatchUp } = options;
		const syncInterval = Math.min(maxTimeToCatchUp, Math.max(minCheckInterval, maxAllowedDrift)) * 1e3;
		const check = async () => {
			if (timingObject.query().velocity === 0 || await player.getPaused() === true) return;
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
		const interval = setInterval(() => check(), syncInterval);
		return { cancel: () => clearInterval(interval) };
	}
	/**
	* @param {string} msg
	*/
	log(msg) {
		this.logger?.(`TimingSrcConnector: ${msg}`);
	}
	speedAdjustment = 0;
	/**
	* @param {PlayerControls} player
	* @param {number} newAdjustment
	* @return {Promise<void>}
	*/
	adjustSpeed = async (player, newAdjustment) => {
		if (this.speedAdjustment === newAdjustment) return;
		const newPlaybackRate = await player.getPlaybackRate() - this.speedAdjustment + newAdjustment;
		this.log(`New playbackRate:  ${newPlaybackRate}`);
		await player.setPlaybackRate(newPlaybackRate);
		this.speedAdjustment = newAdjustment;
	};
	/**
	* @param {TimingObject} timingObject
	* @param {TConnectionState} state
	* @return {Promise<void>}
	*/
	waitForTOReadyState(timingObject, state) {
		return new Promise((resolve) => {
			const check = () => {
				if (timingObject.readyState === state) resolve();
				else timingObject.addEventListener("readystatechange", check, { once: true });
			};
			check();
		});
	}
};
var playerMap = /* @__PURE__ */ new WeakMap();
var readyMap = /* @__PURE__ */ new WeakMap();
var screenfull = {};
var Player = class {
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
			if (element.length > 1 && window.console && console.warn) console.warn("A jQuery object with multiple elements was passed, using the first element.");
			element = element[0];
		}
		if (typeof document !== "undefined" && typeof element === "string") element = document.getElementById(element);
		if (!isDomElement(element)) throw new TypeError("You must pass either a valid element or a valid id.");
		if (element.nodeName !== "IFRAME") {
			const iframe = element.querySelector("iframe");
			if (iframe) element = iframe;
		}
		if (element.nodeName === "IFRAME" && !isVimeoUrl(element.getAttribute("src") || "")) throw new Error("The player element passed isn’t a Vimeo embed.");
		if (playerMap.has(element)) return playerMap.get(element);
		this._window = element.ownerDocument.defaultView;
		this.element = element;
		this.origin = "*";
		const readyPromise = new npo_src((resolve, reject) => {
			this._onMessage = (event) => {
				if (!isVimeoUrl(event.origin) || this.element.contentWindow !== event.source) return;
				if (this.origin === "*") this.origin = event.origin;
				const data = parseMessageData(event.data);
				if (data && data.event === "error" && data.data && data.data.method === "ready") {
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
				getOEmbedData(getVimeoUrl(params), params, element).then((data) => {
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
		if (this.element.nodeName === "IFRAME") postMessage(this, "ping");
		if (screenfull.isEnabled) {
			const exitFullscreen = () => screenfull.exit();
			this.fullscreenchangeHandler = () => {
				if (screenfull.isFullscreen) storeCallback(this, "event:exitFullscreen", exitFullscreen);
				else removeCallback(this, "event:exitFullscreen", exitFullscreen);
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
		for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) args[_key - 1] = arguments[_key];
		if (name === void 0 || name === null) throw new TypeError("You must pass a method name.");
		return new npo_src((resolve, reject) => {
			return this.ready().then(() => {
				storeCallback(this, name, {
					resolve,
					reject
				});
				if (args.length === 0) args = {};
				else if (args.length === 1) args = args[0];
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
			if (value === void 0 || value === null) throw new TypeError("There must be a value to set.");
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
		if (!eventName) throw new TypeError("You must pass an event name.");
		if (!callback) throw new TypeError("You must pass a callback function.");
		if (typeof callback !== "function") throw new TypeError("The callback must be a function.");
		if (getCallbacks(this, `event:${eventName}`).length === 0) this.callMethod("addEventListener", eventName).catch(() => {});
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
		if (!eventName) throw new TypeError("You must pass an event name.");
		if (callback && typeof callback !== "function") throw new TypeError("The callback must be a function.");
		if (removeCallback(this, `event:${eventName}`, callback)) this.callMethod("removeEventListener", eventName).catch((e) => {});
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
			reject(/* @__PURE__ */ new Error("Unknown player. Probably unloaded."));
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
		if (!language) throw new TypeError("You must pass a language.");
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
		if (!language) throw new TypeError("You must pass a language.");
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
		if (screenfull.isEnabled) return screenfull.request(this.element);
		return this.callMethod("requestFullscreen");
	}
	/**
	* Request that the player exits fullscreen.
	* @return {Promise}
	*/
	exitFullscreen() {
		if (screenfull.isEnabled) return screenfull.exit();
		return this.callMethod("exitFullscreen");
	}
	/**
	* Returns true if the player is currently fullscreen.
	* @return {Promise}
	*/
	getFullscreen() {
		if (screenfull.isEnabled) return npo_src.resolve(screenfull.isFullscreen);
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
			if (this.element && this.element.nodeName === "IFRAME" && this.element.parentNode) if (this.element.parentNode.parentNode && this._originalElement && this._originalElement !== this.element.parentNode) this.element.parentNode.parentNode.removeChild(this.element.parentNode);
			else this.element.parentNode.removeChild(this.element);
			if (this.element && this.element.nodeName === "DIV" && this.element.parentNode) {
				this.element.removeAttribute("data-vimeo-initialized");
				const iframe = this.element.querySelector("iframe");
				if (iframe && iframe.parentNode) if (iframe.parentNode.parentNode && this._originalElement && this._originalElement !== iframe.parentNode) iframe.parentNode.parentNode.removeChild(iframe.parentNode);
				else iframe.parentNode.removeChild(iframe);
			}
			this._window.removeEventListener("message", this._onMessage);
			if (screenfull.isEnabled) screenfull.off("fullscreenchange", this.fullscreenchangeHandler);
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
		return npo_src.all([
			this.get("colorOne"),
			this.get("colorTwo"),
			this.get("colorThree"),
			this.get("colorFour")
		]);
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
		if (!Array.isArray(colors)) return new npo_src((resolve, reject) => reject(/* @__PURE__ */ new TypeError("Argument must be an array.")));
		const nullPromise = new npo_src((resolve) => resolve(null));
		const colorPromises = [
			colors[0] ? this.set("colorOne", colors[0]) : nullPromise,
			colors[1] ? this.set("colorTwo", colors[1]) : nullPromise,
			colors[2] ? this.set("colorThree", colors[2]) : nullPromise,
			colors[3] ? this.set("colorFour", colors[3]) : nullPromise
		];
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
		if (!timingObject) throw new TypeError("A Timing Object must be provided.");
		await this.ready();
		const connector = new TimingSrcConnector(this, timingObject, options);
		postMessage(this, "notifyTimingObjectConnect");
		connector.addEventListener("disconnect", () => postMessage(this, "notifyTimingObjectDisconnect"));
		return connector;
	}
};
if (!isServerRuntime) {
	screenfull = initializeScreenfull();
	initializeEmbeds();
	resizeEmbeds();
	initAppendVideoMetadata();
	checkUrlTimeParam();
	updateDRMEmbeds();
}
//#endregion
//#region root/src/modules/state/constants/Filters.ts
var Filters = {
	treeSolveGuideID: "treeSolveGuide",
	treeSolveFragmentsID: "treeSolveFragments",
	upNavElement: "#stepNav .chain-upwards",
	downNavElement: "#stepNav .chain-downwards",
	fragmentBox: "#treeSolveFragments .nt-fr-fragment-box",
	fragmentBoxDiscussion: "#treeSolveFragments .nt-fr-fragment-box .nt-fr-fragment-discussion"
};
//#endregion
//#region root/src/modules/components/fragments/code/onFragmentsRenderFinished.ts
var onFragmentsRenderFinished = () => {
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
//#endregion
//#region root/src/modules/components/init/code/onRenderFinished.ts
var setUpVimeoPlayer = () => {
	const vimeoPlayerDivs = document.querySelectorAll(".nt-tp-vimeo-player");
	if (!vimeoPlayerDivs) return;
	let vimeoPlayerDiv;
	for (let i = 0; i < vimeoPlayerDivs.length; i++) {
		vimeoPlayerDiv = vimeoPlayerDivs[i];
		new Player(vimeoPlayerDiv, {
			autopause: false,
			autoplay: false,
			width: 640,
			loop: false,
			responsive: true
		});
	}
};
var onRenderFinished = () => {
	onFragmentsRenderFinished();
	setUpVimeoPlayer();
};
//#endregion
//#region root/src/modules/components/init/code/initEvents.ts
var initEvents = {
	onRenderFinished: () => {
		onRenderFinished();
	},
	registerGlobalEvents: () => {
		window.onresize = () => {
			initEvents.onRenderFinished();
		};
	}
};
//#endregion
//#region root/src/modules/components/init/actions/initActions.ts
var initActions = { setNotRaw: (state) => {
	if (!window?.TreeSolve?.screen?.isAutofocusFirstRun) window.TreeSolve.screen.autofocus = false;
	else window.TreeSolve.screen.isAutofocusFirstRun = false;
	return state;
} };
//#endregion
//#region root/src/modules/interfaces/enums/ParseType.ts
var ParseType = /* @__PURE__ */ function(ParseType) {
	ParseType["None"] = "none";
	ParseType["Json"] = "json";
	ParseType["Text"] = "text";
	return ParseType;
}({});
//#endregion
//#region root/src/modules/state/ui/RenderFragmentUI.ts
var RenderFragmentUI = class {
	fragmentOptionsExpanded = false;
	discussionLoaded = false;
	ancillaryExpanded = false;
	doNotPaint = false;
	sectionIndex = 0;
};
//#endregion
//#region root/src/modules/state/render/RenderFragment.ts
var RenderFragment = class {
	constructor(id, parentFragmentID, section, segmentIndex) {
		this.id = id;
		this.section = section;
		this.parentFragmentID = parentFragmentID;
		this.segmentIndex = segmentIndex;
	}
	id;
	iKey = null;
	iExitKey = null;
	exitKey = null;
	autoMergeExit = false;
	podKey = null;
	podText = null;
	topLevelMapKey = "";
	mapKeyChain = "";
	guideID = "";
	parentFragmentID;
	value = "";
	selected = null;
	isLeaf = false;
	options = [];
	variable = [];
	classes = [];
	option = "";
	isAncillary = false;
	order = 0;
	link = null;
	pod = null;
	section;
	segmentIndex;
	ui = new RenderFragmentUI();
};
//#endregion
//#region root/src/modules/interfaces/enums/OutlineType.ts
var OutlineType = /* @__PURE__ */ function(OutlineType) {
	OutlineType["None"] = "none";
	OutlineType["Node"] = "node";
	OutlineType["Exit"] = "exit";
	OutlineType["Link"] = "link";
	return OutlineType;
}({});
//#endregion
//#region root/src/modules/state/render/RenderOutlineNode.ts
var RenderOutlineNode = class {
	i = "";
	c = null;
	d = null;
	x = null;
	_x = null;
	o = [];
	parent = null;
	type = OutlineType.Node;
	isChart = true;
	isRoot = false;
	isLast = false;
};
//#endregion
//#region root/src/modules/state/render/RenderOutline.ts
var RenderOutline = class {
	constructor(path, baseURI) {
		this.path = path;
		this.baseURI = baseURI;
	}
	path;
	baseURI;
	loaded = false;
	v = "";
	r = new RenderOutlineNode();
	c = [];
	e;
	mv;
};
//#endregion
//#region root/src/modules/state/render/RenderOutlineChart.ts
var RenderOutlineChart = class {
	i = "";
	b = "";
	p = "";
};
//#endregion
//#region root/src/modules/state/display/DisplayGuide.ts
var DisplayGuide = class {
	constructor(linkID, guide, rootID) {
		this.linkID = linkID;
		this.guide = guide;
		this.root = new RenderFragment(rootID, "guideRoot", this, 0);
	}
	linkID;
	guide;
	outline = null;
	root;
	current = null;
};
//#endregion
//#region root/src/modules/state/render/RenderGuide.ts
var RenderGuide = class {
	constructor(id) {
		this.id = id;
	}
	id;
	title = "";
	description = "";
	path = "";
	fragmentFolderUrl = null;
};
//#endregion
//#region root/src/modules/interfaces/enums/ScrollHopType.ts
var ScrollHopType = /* @__PURE__ */ function(ScrollHopType) {
	ScrollHopType["None"] = "none";
	ScrollHopType["Up"] = "up";
	ScrollHopType["Down"] = "down";
	return ScrollHopType;
}({});
//#endregion
//#region root/src/modules/state/window/Screen.ts
var Screen = class {
	autofocus = false;
	isAutofocusFirstRun = true;
	hideBanner = false;
	scrollToTop = false;
	scrollToElement = null;
	scrollHop = ScrollHopType.None;
	lastScrollY = 0;
	ua = null;
};
//#endregion
//#region root/src/modules/state/window/TreeSolve.ts
var TreeSolve = class {
	renderingComment = null;
	screen = new Screen();
};
//#endregion
//#region root/src/modules/global/gFileConstants.ts
var gFileConstants = {
	fragmentsFolderSuffix: "_frags",
	fragmentFileExtension: ".html",
	guideOutlineFilename: "outline.tsoln",
	guideRenderCommentTag: "tsGuideRenderComment ",
	fragmentRenderCommentTag: "tsFragmentRenderComment "
};
//#endregion
//#region root/src/modules/global/code/gRenderCode.ts
var parseGuide = (rawGuide) => {
	const guide = new RenderGuide(rawGuide.id);
	guide.title = rawGuide.title ?? "";
	guide.description = rawGuide.description ?? "";
	guide.path = rawGuide.path ?? null;
	guide.fragmentFolderUrl = gRenderCode.getGuideFragmentFolderUrl(rawGuide.fragmentFolderPath);
	return guide;
};
var parseRenderingComment = (state, raw) => {
	if (!raw) return raw;
	const guide = parseGuide(raw.guide);
	const displayGuide = new DisplayGuide(gStateCode.getFreshKeyInt(state), guide, raw.fragment.id);
	gFragmentCode.parseAndLoadGuideRootFragment(state, raw.fragment, displayGuide.root);
	state.renderState.displayGuide = displayGuide;
	state.renderState.currentSection = displayGuide;
	gFragmentCode.cacheSectionRoot(state, state.renderState.displayGuide);
};
var gRenderCode = {
	getGuideFragmentFolderUrl: (folderPath) => {
		return new URL(folderPath, document.baseURI).toString();
	},
	getFragmentFolderUrl: (chart, fragment) => {
		const path = chart.p;
		if (path.startsWith("https://") === true || path.startsWith("http://") === true) return path;
		let baseURI = fragment.section.outline?.baseURI;
		if (!baseURI) baseURI = document.baseURI;
		return new URL(path, baseURI).toString();
	},
	registerGuideComment: () => {
		const treeSolveGuide = document.getElementById(Filters.treeSolveGuideID);
		if (treeSolveGuide && treeSolveGuide.hasChildNodes() === true) {
			let childNode;
			for (let i = 0; i < treeSolveGuide.childNodes.length; i++) {
				childNode = treeSolveGuide.childNodes[i];
				if (childNode.nodeType === Node.COMMENT_NODE) {
					if (!window.TreeSolve) window.TreeSolve = new TreeSolve();
					window.TreeSolve.renderingComment = childNode.textContent;
					childNode.remove();
					break;
				} else if (childNode.nodeType !== Node.TEXT_NODE) break;
			}
		}
	},
	parseRenderingComment: (state) => {
		if (!window.TreeSolve?.renderingComment) return;
		try {
			let guideRenderComment = window.TreeSolve.renderingComment;
			guideRenderComment = guideRenderComment.trim();
			if (!guideRenderComment.startsWith(gFileConstants.guideRenderCommentTag)) return;
			guideRenderComment = guideRenderComment.substring(gFileConstants.guideRenderCommentTag.length);
			parseRenderingComment(state, JSON.parse(guideRenderComment));
		} catch (e) {
			console.error(e);
			return;
		}
	},
	registerFragmentComment: () => {}
};
//#endregion
//#region root/src/modules/state/display/DisplayChart.ts
var DisplayChart = class {
	constructor(linkID, chart) {
		this.linkID = linkID;
		this.chart = chart;
	}
	linkID;
	chart;
	outline = null;
	root = null;
	parent = null;
	current = null;
};
//#endregion
//#region root/src/modules/state/segments/ChainSegment.ts
var ChainSegment = class {
	constructor(index, start, end) {
		this.index = index;
		this.start = start;
		this.end = end;
		this.text = `${start.text}${end?.text ?? ""}`;
	}
	index;
	text;
	outlineNodes = [];
	outlineNodesLoaded = false;
	start;
	end;
	segmentInSection = null;
	segmentSection = null;
	segmentOutSection = null;
};
//#endregion
//#region root/src/modules/state/segments/SegmentNode.ts
var SegmentNode = class {
	constructor(text, key, type, isRoot, isLast) {
		this.text = text;
		this.key = key;
		this.type = type;
		this.isRoot = isRoot;
		this.isLast = isLast;
	}
	text;
	key;
	type;
	isRoot;
	isLast;
};
//#endregion
//#region root/src/modules/global/code/gSegmentCode.ts
var checkForLinkErrors = (segment, linkSegment, fragment) => {
	if (segment.end.key !== linkSegment.start.key || segment.end.type !== linkSegment.start.type) throw new Error("Link segment start does not match segment end");
	if (!linkSegment.segmentInSection) throw new Error("Segment in section was null - link");
	if (!linkSegment.segmentSection) throw new Error("Segment section was null - link");
	if (!linkSegment.segmentOutSection) throw new Error("Segment out section was null - link");
	if (gUtilities.isNullOrWhiteSpace(fragment.iKey) === true) throw new Error("Mismatch between fragment and outline node - link iKey");
	else if (linkSegment.start.type !== OutlineType.Link) throw new Error("Mismatch between fragment and outline node - link");
};
var getIdentifierCharacter = (identifierChar) => {
	let startOutlineType = OutlineType.Node;
	let isLast = false;
	if (identifierChar === "~") startOutlineType = OutlineType.Link;
	else if (identifierChar === "_") startOutlineType = OutlineType.Exit;
	else if (identifierChar === "-") {
		startOutlineType = OutlineType.Node;
		isLast = true;
	} else throw new Error(`Unexpected query string outline node identifier: ${identifierChar}`);
	return {
		type: startOutlineType,
		isLast
	};
};
var getKeyEndIndex = (remainingChain) => {
	const startKeyEndIndex = gUtilities.indexOfAny(remainingChain, [
		"~",
		"-",
		"_"
	], 1);
	if (startKeyEndIndex === -1) return {
		index: remainingChain.length,
		isLast: true
	};
	return {
		index: startKeyEndIndex,
		isLast: null
	};
};
var getOutlineType = (remainingChain) => {
	return getIdentifierCharacter(remainingChain.substring(0, 1));
};
var getNextSegmentNode = (remainingChain) => {
	let segmentNode = null;
	let endChain = "";
	if (!gUtilities.isNullOrWhiteSpace(remainingChain)) {
		const outlineType = getOutlineType(remainingChain);
		const keyEnd = getKeyEndIndex(remainingChain);
		const key = remainingChain.substring(1, keyEnd.index);
		segmentNode = new SegmentNode(remainingChain.substring(0, keyEnd.index), key, outlineType.type, false, outlineType.isLast);
		if (keyEnd.isLast === true) segmentNode.isLast = true;
		endChain = remainingChain.substring(keyEnd.index);
	}
	return {
		segmentNode,
		endChain
	};
};
var buildSegment = (segments, remainingChain) => {
	const segmentStart = getNextSegmentNode(remainingChain);
	if (!segmentStart.segmentNode) throw new Error("Segment start node was null");
	remainingChain = segmentStart.endChain;
	const segmentEnd = getNextSegmentNode(remainingChain);
	if (!segmentEnd.segmentNode) throw new Error("Segment end node was null");
	const segment = new ChainSegment(segments.length, segmentStart.segmentNode, segmentEnd.segmentNode);
	segments.push(segment);
	return {
		remainingChain,
		segment
	};
};
var buildRootSegment = (segments, remainingChain) => {
	const rootSegmentStart = new SegmentNode("guideRoot", "", OutlineType.Node, true, false);
	const rootSegmentEnd = getNextSegmentNode(remainingChain);
	if (!rootSegmentEnd.segmentNode) throw new Error("Segment start node was null");
	const rootSegment = new ChainSegment(segments.length, rootSegmentStart, rootSegmentEnd.segmentNode);
	segments.push(rootSegment);
	return {
		remainingChain,
		segment: rootSegment
	};
};
var loadSegment = (state, segment, startOutlineNode = null) => {
	gSegmentCode.loadSegmentOutlineNodes(state, segment, startOutlineNode);
	const nextSegmentOutlineNodes = segment.outlineNodes;
	if (nextSegmentOutlineNodes.length > 0) {
		const firstNode = nextSegmentOutlineNodes[nextSegmentOutlineNodes.length - 1];
		if (firstNode.i === segment.start.key) firstNode.type = segment.start.type;
		const lastNode = nextSegmentOutlineNodes[0];
		if (lastNode.i === segment.end.key) {
			lastNode.type = segment.end.type;
			lastNode.isLast = segment.end.isLast;
		}
	}
	gFragmentCode.loadNextChainFragment(state, segment);
};
var gSegmentCode = {
	setNextSegmentSection: (state, segmentIndex, link) => {
		if (!segmentIndex || !state.renderState.isChainLoad) return;
		const segment = state.renderState.segments[segmentIndex - 1];
		if (!segment) throw new Error("Segment is null");
		segment.segmentOutSection = link;
		const nextSegment = state.renderState.segments[segmentIndex];
		if (nextSegment) {
			nextSegment.segmentInSection = segment.segmentSection;
			nextSegment.segmentSection = link;
			nextSegment.segmentOutSection = link;
			loadSegment(state, nextSegment);
		}
	},
	loadLinkSegment: (state, linkSegmentIndex, linkFragment, link) => {
		const segments = state.renderState.segments;
		if (linkSegmentIndex < 1) throw new Error("Index < 0");
		const currentSegment = segments[linkSegmentIndex - 1];
		currentSegment.segmentOutSection = link;
		if (linkSegmentIndex >= segments.length) throw new Error("Next index >= array length");
		const nextSegment = segments[linkSegmentIndex];
		if (!nextSegment) throw new Error("Next link segment was null");
		if (nextSegment.outlineNodesLoaded === true) return nextSegment;
		nextSegment.outlineNodesLoaded = true;
		nextSegment.segmentInSection = currentSegment.segmentSection;
		nextSegment.segmentSection = link;
		nextSegment.segmentOutSection = link;
		if (!nextSegment.segmentInSection) nextSegment.segmentInSection = currentSegment.segmentSection;
		if (!nextSegment.segmentSection) nextSegment.segmentSection = currentSegment.segmentOutSection;
		if (!nextSegment.segmentOutSection) nextSegment.segmentOutSection = currentSegment.segmentOutSection;
		if (gUtilities.isNullOrWhiteSpace(nextSegment.segmentSection.outline?.r.i) === true) throw new Error("Next segment section root key was null");
		loadSegment(state, nextSegment, gStateCode.getCached_outlineNode(state, nextSegment.segmentSection.linkID, nextSegment.segmentSection.outline?.r.i));
		checkForLinkErrors(currentSegment, nextSegment, linkFragment);
		return nextSegment;
	},
	loadExitSegment: (state, segmentIndex, plugID) => {
		const segments = state.renderState.segments;
		const currentSegment = segments[segmentIndex];
		const exitSegmentIndex = segmentIndex + 1;
		if (exitSegmentIndex >= segments.length) throw new Error("Next index >= array length");
		const exitSegment = segments[exitSegmentIndex];
		if (!exitSegment) throw new Error("Exit link segment was null");
		if (exitSegment.outlineNodesLoaded === true) return exitSegment;
		const link = currentSegment.segmentSection.parent;
		if (!link) throw new Error("Link fragmnt was null");
		currentSegment.segmentOutSection = link.section;
		exitSegment.outlineNodesLoaded = true;
		exitSegment.segmentInSection = currentSegment.segmentSection;
		exitSegment.segmentSection = currentSegment.segmentOutSection;
		exitSegment.segmentOutSection = currentSegment.segmentOutSection;
		if (!exitSegment.segmentInSection) throw new Error("Segment in section was null");
		const exitOutlineNode = gStateCode.getCached_outlineNode(state, exitSegment.segmentInSection.linkID, exitSegment.start.key);
		if (!exitOutlineNode) throw new Error("ExitOutlineNode was null");
		if (gUtilities.isNullOrWhiteSpace(exitOutlineNode._x) === true) throw new Error("Exit key was null");
		const plugOutlineNode = gStateCode.getCached_outlineNode(state, exitSegment.segmentSection.linkID, plugID);
		if (!plugOutlineNode) throw new Error("PlugOutlineNode was null");
		if (exitOutlineNode._x !== plugOutlineNode.x) throw new Error("PlugOutlineNode does not match exitOutlineNode");
		loadSegment(state, exitSegment, plugOutlineNode);
		return exitSegment;
	},
	loadNextSegment: (state, segment) => {
		if (segment.outlineNodesLoaded === true) return;
		segment.outlineNodesLoaded = true;
		const nextSegmentIndex = segment.index + 1;
		const segments = state.renderState.segments;
		if (nextSegmentIndex >= segments.length) throw new Error("Next index >= array length");
		const nextSegment = segments[nextSegmentIndex];
		if (nextSegment) {
			if (!nextSegment.segmentInSection) nextSegment.segmentInSection = segment.segmentSection;
			if (!nextSegment.segmentSection) nextSegment.segmentSection = segment.segmentOutSection;
			if (!nextSegment.segmentOutSection) nextSegment.segmentOutSection = segment.segmentOutSection;
			loadSegment(state, nextSegment);
		}
	},
	getNextSegmentOutlineNode: (state, segment) => {
		let outlineNode = segment.outlineNodes.pop() ?? null;
		if (outlineNode?.isLast === true) return outlineNode;
		if (segment.outlineNodes.length === 0) {
			const nextSegment = state.renderState.segments[segment.index + 1];
			if (!nextSegment) throw new Error("NextSegment was null");
			if (!nextSegment.segmentInSection) nextSegment.segmentInSection = segment.segmentSection;
			if (!nextSegment.segmentSection) nextSegment.segmentSection = segment.segmentOutSection;
			if (!nextSegment.segmentOutSection) nextSegment.segmentOutSection = segment.segmentOutSection;
		}
		return outlineNode;
	},
	parseSegments: (state, queryString) => {
		if (queryString.startsWith("?") === true) queryString = queryString.substring(1);
		if (gUtilities.isNullOrWhiteSpace(queryString) === true) return;
		const segments = [];
		let remainingChain = queryString;
		let result;
		result = buildRootSegment(segments, remainingChain);
		while (!gUtilities.isNullOrWhiteSpace(remainingChain)) {
			result = buildSegment(segments, remainingChain);
			if (result.segment.end.isLast === true) break;
			remainingChain = result.remainingChain;
		}
		state.renderState.segments = segments;
	},
	loadSegmentOutlineNodes: (state, segment, startOutlineNode = null) => {
		if (!segment.segmentInSection) throw new Error("Segment in section was null");
		if (!segment.segmentSection) throw new Error("Segment section was null");
		let segmentOutlineNodes = [];
		if (!startOutlineNode) {
			startOutlineNode = gStateCode.getCached_outlineNode(state, segment.segmentInSection.linkID, segment.start.key);
			if (!startOutlineNode) throw new Error("Start outline node was null");
			startOutlineNode.type = segment.start.type;
		}
		let endOutlineNode = gStateCode.getCached_outlineNode(state, segment.segmentSection.linkID, segment.end.key);
		if (!endOutlineNode) throw new Error("End outline node was null");
		endOutlineNode.type = segment.end.type;
		let parent = endOutlineNode;
		let firstLoop = true;
		while (parent) {
			segmentOutlineNodes.push(parent);
			if (!firstLoop && parent?.isChart === true && parent?.isRoot === true) break;
			if (parent?.i === startOutlineNode.i) break;
			firstLoop = false;
			parent = parent.parent;
		}
		segment.outlineNodes = segmentOutlineNodes;
	}
};
//#endregion
//#region root/src/modules/global/actions/gOutlineActions.ts
var gOutlineActions = {
	loadGuideOutlineProperties: (state, outlineResponse, fragmentFolderUrl) => {
		gOutlineCode.loadGuideOutlineProperties(state, outlineResponse, fragmentFolderUrl);
		return gStateCode.cloneState(state);
	},
	loadSegmentChartOutlineProperties: (state, outlineResponse, outline, chart, parent, segmentIndex) => {
		gOutlineCode.loadSegmentChartOutlineProperties(state, outlineResponse, outline, chart, parent, segmentIndex);
		return gStateCode.cloneState(state);
	},
	loadChartOutlineProperties: (state, outlineResponse, outline, chart, parent) => {
		gOutlineCode.loadChartOutlineProperties(state, outlineResponse, outline, chart, parent);
		return gStateCode.cloneState(state);
	},
	loadPodOutlineProperties: (state, outlineResponse, outline, chart, option) => {
		gOutlineCode.loadPodOutlineProperties(state, outlineResponse, outline, chart, option);
		return gStateCode.cloneState(state);
	},
	loadGuideOutlineAndSegments: (state, outlineResponse, path) => {
		const section = state.renderState.displayGuide;
		if (!section) return state;
		const rootSegment = state.renderState.segments[0];
		if (!rootSegment) return state;
		const fragmentFolderUrl = section.guide.fragmentFolderUrl;
		if (gUtilities.isNullOrWhiteSpace(fragmentFolderUrl) === true) return state;
		rootSegment.segmentInSection = section;
		rootSegment.segmentSection = section;
		rootSegment.segmentOutSection = section;
		gOutlineCode.loadGuideOutlineProperties(state, outlineResponse, path);
		gSegmentCode.loadSegmentOutlineNodes(state, rootSegment);
		const firstNode = gSegmentCode.getNextSegmentOutlineNode(state, rootSegment);
		if (firstNode) {
			const url = `${fragmentFolderUrl}/${firstNode.i}${gFileConstants.fragmentFileExtension}`;
			const loadDelegate = (state, outlineResponse) => {
				return gFragmentActions.loadChainFragment(state, outlineResponse, rootSegment, firstNode);
			};
			gStateCode.AddReLoadDataEffectImmediate(state, `loadChainFragment`, ParseType.Json, url, loadDelegate);
		} else gSegmentCode.loadNextSegment(state, rootSegment);
		return gStateCode.cloneState(state);
	}
};
//#endregion
//#region root/src/modules/global/code/gOutlineCode.ts
var cacheNodeForNewLink = (state, outlineNode, linkID) => {
	gStateCode.cache_outlineNode(state, linkID, outlineNode);
	for (const option of outlineNode.o) cacheNodeForNewLink(state, option, linkID);
};
var cacheNodeForNewPod = (state, outlineNode, linkID) => {
	gStateCode.cache_outlineNode(state, linkID, outlineNode);
	for (const option of outlineNode.o) cacheNodeForNewPod(state, option, linkID);
};
var loadNode = (state, rawNode, linkID, parent = null) => {
	const node = new RenderOutlineNode();
	node.i = rawNode.i;
	node.c = rawNode.c ?? null;
	node.d = rawNode.d ?? null;
	node._x = rawNode._x ?? null;
	node.x = rawNode.x ?? null;
	node.parent = parent;
	node.type = OutlineType.Node;
	gStateCode.cache_outlineNode(state, linkID, node);
	if (node.c) node.type = OutlineType.Link;
	if (rawNode.o && Array.isArray(rawNode.o) === true && rawNode.o.length > 0) {
		let o;
		for (const option of rawNode.o) {
			o = loadNode(state, option, linkID, node);
			node.o.push(o);
		}
	}
	return node;
};
var loadCharts = (outline, rawOutlineCharts) => {
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
var gOutlineCode = {
	registerOutlineUrlDownload: (state, url) => {
		if (state.renderState.outlineUrls[url] === true) return true;
		state.renderState.outlineUrls[url] = true;
		return false;
	},
	loadGuideOutlineProperties: (state, outlineResponse, fragmentFolderUrl) => {
		if (!state.renderState.displayGuide) throw new Error("DisplayGuide was null.");
		const guide = state.renderState.displayGuide;
		const rawOutline = outlineResponse.jsonData;
		const guideOutline = gOutlineCode.getGuideOutline(state, fragmentFolderUrl);
		gOutlineCode.loadOutlineProperties(state, rawOutline, guideOutline, guide.linkID);
		guide.outline = guideOutline;
		guideOutline.r.isChart = false;
		if (state.renderState.isChainLoad === true) {
			const segments = state.renderState.segments;
			if (segments.length > 0) {
				const rootSegment = segments[0];
				rootSegment.start.key = guideOutline.r.i;
			}
		}
		gFragmentCode.cacheSectionRoot(state, guide);
		if (guideOutline.r.c != null) {
			const outlineChart = gOutlineCode.getOutlineChart(guideOutline, guideOutline.r.c);
			const guideRoot = guide.root;
			if (!guideRoot) throw new Error("The current fragment was null");
			gOutlineCode.getOutlineFromChart_subscription(state, outlineChart, guideRoot);
		} else if (guide.root) {
			gFragmentCode.expandOptionPods(state, guide.root);
			gFragmentCode.autoExpandSingleBlankOption(state, guide.root);
		}
		return guideOutline;
	},
	getOutlineChart: (outline, index) => {
		if (outline.c.length > index) return outline.c[index];
		return null;
	},
	buildDisplayChartFromRawOutline: (state, chart, rawOutline, outline, parent) => {
		const link = new DisplayChart(gStateCode.getFreshKeyInt(state), chart);
		gOutlineCode.loadOutlineProperties(state, rawOutline, outline, link.linkID);
		link.outline = outline;
		link.parent = parent;
		parent.link = link;
		return link;
	},
	buildPodDisplayChartFromRawOutline: (state, chart, rawOutline, outline, parent) => {
		const pod = new DisplayChart(gStateCode.getFreshKeyInt(state), chart);
		gOutlineCode.loadOutlineProperties(state, rawOutline, outline, pod.linkID);
		pod.outline = outline;
		pod.parent = parent;
		parent.pod = pod;
		return pod;
	},
	buildDisplayChartFromOutlineForNewLink: (state, chart, outline, parent) => {
		const link = new DisplayChart(gStateCode.getFreshKeyInt(state), chart);
		gOutlineCode.loadOutlinePropertiesForNewLink(state, outline, link.linkID);
		link.outline = outline;
		link.parent = parent;
		parent.link = link;
		return link;
	},
	buildDisplayChartFromOutlineForNewPod: (state, chart, outline, parent) => {
		const pod = new DisplayChart(gStateCode.getFreshKeyInt(state), chart);
		gOutlineCode.loadOutlinePropertiesForNewPod(state, outline, pod.linkID);
		pod.outline = outline;
		pod.parent = parent;
		parent.pod = pod;
		return pod;
	},
	loadSegmentChartOutlineProperties: (state, outlineResponse, outline, chart, parent, segmentIndex) => {
		if (parent.link) throw new Error(`Link already loaded, rootID: ${parent.link.root?.id}`);
		const rawOutline = outlineResponse.jsonData;
		const link = gOutlineCode.buildDisplayChartFromRawOutline(state, chart, rawOutline, outline, parent);
		gSegmentCode.loadLinkSegment(state, segmentIndex, parent, link);
		gOutlineCode.setChartAsCurrent(state, link);
		gFragmentCode.cacheSectionRoot(state, link);
	},
	loadChartOutlineProperties: (state, outlineResponse, outline, chart, parent) => {
		if (parent.link) throw new Error(`Link already loaded, rootID: ${parent.link.root?.id}`);
		const rawOutline = outlineResponse.jsonData;
		const link = gOutlineCode.buildDisplayChartFromRawOutline(state, chart, rawOutline, outline, parent);
		gFragmentCode.cacheSectionRoot(state, link);
		gOutlineCode.setChartAsCurrent(state, link);
		gOutlineCode.postGetChartOutlineRoot_subscription(state, link);
	},
	loadPodOutlineProperties: (state, outlineResponse, outline, chart, option) => {
		if (option.pod) throw new Error(`Link already loaded, rootID: ${option.pod.root?.id}`);
		const rawOutline = outlineResponse.jsonData;
		const pod = gOutlineCode.buildPodDisplayChartFromRawOutline(state, chart, rawOutline, outline, option);
		gFragmentCode.cacheSectionRoot(state, pod);
		gOutlineCode.postGetPodOutlineRoot_subscription(state, pod);
	},
	postGetChartOutlineRoot_subscription: (state, section) => {
		if (section.root) return;
		const outline = section.outline;
		if (!outline) throw new Error("Section outline was null");
		const rootFragmenID = outline.r.i;
		const url = `${outline.path}/${rootFragmenID}${gFileConstants.fragmentFileExtension}`;
		const loadAction = (state, response) => {
			return gFragmentActions.loadRootFragmentAndSetSelected(state, response, section);
		};
		gStateCode.AddReLoadDataEffectImmediate(state, `loadChartOutlineRoot`, ParseType.Text, url, loadAction);
	},
	postGetPodOutlineRoot_subscription: (state, section) => {
		if (section.root) return;
		const outline = section.outline;
		if (!outline) throw new Error("Section outline was null");
		const rootFragmenID = outline.r.i;
		const url = `${outline.path}/${rootFragmenID}${gFileConstants.fragmentFileExtension}`;
		const loadAction = (state, response) => {
			return gFragmentActions.loadPodRootFragment(state, response, section);
		};
		gStateCode.AddReLoadDataEffectImmediate(state, `loadChartOutlineRoot`, ParseType.Text, url, loadAction);
	},
	setChartAsCurrent: (state, displaySection) => {
		state.renderState.currentSection = displaySection;
	},
	getGuideOutline: (state, fragmentFolderUrl) => {
		let outline = state.renderState.outlines[fragmentFolderUrl];
		if (outline) return outline;
		outline = new RenderOutline(fragmentFolderUrl, document.baseURI);
		state.renderState.outlines[fragmentFolderUrl] = outline;
		return outline;
	},
	getOutline: (state, fragmentFolderUrl, chart, linkFragment) => {
		let outline = state.renderState.outlines[fragmentFolderUrl];
		if (outline) return outline;
		let baseURI = chart.b;
		if (gUtilities.isNullOrWhiteSpace(baseURI) === true) baseURI = linkFragment.section.outline?.baseURI ?? null;
		if (!baseURI) baseURI = document.baseURI;
		outline = new RenderOutline(fragmentFolderUrl, baseURI);
		state.renderState.outlines[fragmentFolderUrl] = outline;
		return outline;
	},
	getLinkOutline_subscripion: (state, option) => {
		const outline = option.section.outline;
		if (!outline) return;
		const outlineNode = gStateCode.getCached_outlineNode(state, option.section.linkID, option.id);
		if (outlineNode?.c == null || state.renderState.isChainLoad === true) return;
		const outlineChart = gOutlineCode.getOutlineChart(outline, outlineNode?.c);
		gOutlineCode.getOutlineFromChart_subscription(state, outlineChart, option);
	},
	getPodOutline_subscripion: (state, option, section) => {
		if (gUtilities.isNullOrWhiteSpace(option.podKey) === true) return;
		const outline = section.outline;
		if (!outline) return;
		const outlineNode = gStateCode.getCached_outlineNode(state, option.section.linkID, option.id);
		if (outlineNode?.d == null) return;
		const outlineChart = gOutlineCode.getOutlineChart(outline, outlineNode?.d);
		gOutlineCode.getOutlineFromPod_subscription(state, outlineChart, option);
	},
	getSegmentOutline_subscription: (state, chart, linkFragment, segmentIndex) => {
		if (!chart) throw new Error("OutlineChart was null");
		if (linkFragment.link?.root) {
			console.log(`Link root already loaded: ${linkFragment.link.root?.id}`);
			return;
		}
		let nextSegmentIndex = segmentIndex;
		if (nextSegmentIndex != null) nextSegmentIndex++;
		const fragmentFolderUrl = gRenderCode.getFragmentFolderUrl(chart, linkFragment);
		if (!gUtilities.isNullOrWhiteSpace(fragmentFolderUrl)) {
			const outline = gOutlineCode.getOutline(state, fragmentFolderUrl, chart, linkFragment);
			if (outline.loaded === true) {
				if (!linkFragment.link) {
					const link = gOutlineCode.buildDisplayChartFromOutlineForNewLink(state, chart, outline, linkFragment);
					gSegmentCode.setNextSegmentSection(state, nextSegmentIndex, link);
				}
				gOutlineCode.setChartAsCurrent(state, linkFragment.link);
			} else {
				const url = `${fragmentFolderUrl}/${gFileConstants.guideOutlineFilename}`;
				if (gOutlineCode.registerOutlineUrlDownload(state, url) === true) return;
				let name;
				if (state.renderState.isChainLoad === true) name = `loadChainChartOutlineFile`;
				else name = `loadChartOutlineFile`;
				const loadDelegate = (state, outlineResponse) => {
					return gOutlineActions.loadSegmentChartOutlineProperties(state, outlineResponse, outline, chart, linkFragment, nextSegmentIndex);
				};
				gStateCode.AddReLoadDataEffectImmediate(state, name, ParseType.Json, url, loadDelegate);
			}
		}
	},
	getOutlineFromChart_subscription: (state, chart, linkFragment) => {
		if (!chart) throw new Error("OutlineChart was null");
		if (linkFragment.link?.root) {
			console.log(`Link root already loaded: ${linkFragment.link.root?.id}`);
			return;
		}
		let fragmentFolderUrl;
		const outlineChartPath = chart.p;
		if (!chart.i) fragmentFolderUrl = outlineChartPath;
		else fragmentFolderUrl = gRenderCode.getFragmentFolderUrl(chart, linkFragment);
		if (!gUtilities.isNullOrWhiteSpace(fragmentFolderUrl)) {
			const outline = gOutlineCode.getOutline(state, fragmentFolderUrl, chart, linkFragment);
			if (outline.loaded === true) {
				if (!linkFragment.link) gOutlineCode.buildDisplayChartFromOutlineForNewLink(state, chart, outline, linkFragment);
				gOutlineCode.setChartAsCurrent(state, linkFragment.link);
				gOutlineCode.postGetChartOutlineRoot_subscription(state, linkFragment.link);
			} else {
				const url = `${fragmentFolderUrl}/${gFileConstants.guideOutlineFilename}`;
				if (gOutlineCode.registerOutlineUrlDownload(state, url) === true) return;
				let name;
				if (state.renderState.isChainLoad === true) name = `loadChainChartOutlineFile`;
				else name = `loadChartOutlineFile`;
				const loadDelegate = (state, outlineResponse) => {
					return gOutlineActions.loadChartOutlineProperties(state, outlineResponse, outline, chart, linkFragment);
				};
				gStateCode.AddReLoadDataEffectImmediate(state, name, ParseType.Json, url, loadDelegate);
			}
		}
	},
	getOutlineFromPod_subscription: (state, chart, optionFragment) => {
		if (!chart) throw new Error("OutlineChart was null");
		if (optionFragment.link?.root) {
			console.log(`Link root already loaded: ${optionFragment.link.root?.id}`);
			return;
		}
		const fragmentFolderUrl = gRenderCode.getFragmentFolderUrl(chart, optionFragment);
		if (gUtilities.isNullOrWhiteSpace(fragmentFolderUrl)) return;
		const outline = gOutlineCode.getOutline(state, fragmentFolderUrl, chart, optionFragment);
		if (outline.loaded === true) {
			if (!optionFragment.pod) gOutlineCode.buildDisplayChartFromOutlineForNewPod(state, chart, outline, optionFragment);
			gOutlineCode.postGetPodOutlineRoot_subscription(state, optionFragment.pod);
		} else {
			const url = `${fragmentFolderUrl}/${gFileConstants.guideOutlineFilename}`;
			if (gOutlineCode.registerOutlineUrlDownload(state, url) === true) return;
			let name;
			if (state.renderState.isChainLoad === true) name = `loadChainChartOutlineFile`;
			else name = `loadChartOutlineFile`;
			const loadDelegate = (state, outlineResponse) => {
				return gOutlineActions.loadPodOutlineProperties(state, outlineResponse, outline, chart, optionFragment);
			};
			gStateCode.AddReLoadDataEffectImmediate(state, name, ParseType.Json, url, loadDelegate);
		}
	},
	loadOutlineProperties: (state, rawOutline, outline, linkID) => {
		outline.v = rawOutline.v;
		if (rawOutline.c && Array.isArray(rawOutline.c) === true && rawOutline.c.length > 0) loadCharts(outline, rawOutline.c);
		if (rawOutline.e) outline.e = rawOutline.e;
		outline.r = loadNode(state, rawOutline.r, linkID);
		outline.loaded = true;
		outline.r.isRoot = true;
		outline.mv = rawOutline.mv;
		return outline;
	},
	loadOutlinePropertiesForNewLink: (state, outline, linkID) => {
		cacheNodeForNewLink(state, outline.r, linkID);
	},
	loadOutlinePropertiesForNewPod: (state, outline, linkID) => {
		cacheNodeForNewPod(state, outline.r, linkID);
	}
};
//#endregion
//#region root/src/modules/global/effects/gFragmentEffects.ts
var getFragment = (state, fragmentID, fragmentPath, _action, loadAction) => {
	if (!state) return;
	const callID = gUtilities.generateGuid();
	const url = `${fragmentPath}`;
	return gAuthenticatedHttp({
		url,
		parseType: "text",
		options: { method: "GET" },
		response: "text",
		action: loadAction,
		error: (state, errorDetails) => {
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
			return gStateCode.cloneState(state);
		}
	});
};
var gFragmentEffects = { getFragment: (state, option, fragmentPath) => {
	const loadAction = (state, response) => {
		const newState = gFragmentActions.loadFragment(state, response, option);
		newState.renderState.refreshUrl = true;
		return newState;
	};
	return getFragment(state, option.id, fragmentPath, ActionType.GetFragment, loadAction);
} };
//#endregion
//#region root/src/modules/global/actions/gFragmentActions.ts
var getFragmentFile = (state, option) => {
	state.loading = true;
	window.TreeSolve.screen.hideBanner = true;
	const fragmentPath = `${option.section?.outline?.path}/${option.id}${gFileConstants.fragmentFileExtension}`;
	return [state, gFragmentEffects.getFragment(state, option, fragmentPath)];
};
var processChainFragmentType = (state, segment, outlineNode, fragment) => {
	if (fragment) {
		if (outlineNode.i !== fragment.id) throw new Error("Mismatch between fragment id and outline fragment id");
		if (outlineNode.type === OutlineType.Link) processLink(state, segment, outlineNode, fragment);
		else if (outlineNode.type === OutlineType.Exit) processExit(state, segment, outlineNode, fragment);
		else if (outlineNode.isChart === true && outlineNode.isRoot === true) processChartRoot(state, segment, fragment);
		else if (outlineNode.isLast === true) processLast(state, segment, outlineNode, fragment);
		else if (outlineNode.type === OutlineType.Node) processNode(state, segment, outlineNode, fragment);
		else throw new Error("Unexpected fragment type.");
	}
	return gStateCode.cloneState(state);
};
var checkForLastFragmentErrors = (segment, outlineNode, fragment) => {
	if (!segment.segmentSection) throw new Error("Segment section was null - last");
	if (outlineNode.i !== fragment.id) throw new Error("Mismatch between outline node id and fragment id");
};
var checkForNodeErrors = (segment, outlineNode, fragment) => {
	if (!segment.segmentSection) throw new Error("Segment section was null - node");
	if (!gUtilities.isNullOrWhiteSpace(fragment.iKey)) throw new Error("Mismatch between fragment and outline node - link");
	else if (!gUtilities.isNullOrWhiteSpace(fragment.iExitKey)) throw new Error("Mismatch between fragment and outline node - exit");
	if (outlineNode.i !== fragment.id) throw new Error("Mismatch between outline node id and fragment id");
};
var checkForChartRootErrors = (segment, fragment) => {
	if (!segment.segmentSection) throw new Error("Segment section was null - root");
	if (!gUtilities.isNullOrWhiteSpace(fragment.iKey)) throw new Error("Mismatch between fragment and outline root - link");
	else if (!gUtilities.isNullOrWhiteSpace(fragment.iExitKey)) throw new Error("Mismatch between fragment and outline root - exit");
};
var checkForExitErrors = (segment, outlineNode, fragment) => {
	if (!segment.segmentSection) throw new Error("Segment section was null - exit");
	if (!segment.segmentOutSection) throw new Error("Segment out section was null - exit");
	if (gUtilities.isNullOrWhiteSpace(fragment.exitKey) === true) throw new Error("Mismatch between fragment and outline - exit");
	else if (segment.end.type !== OutlineType.Exit) throw new Error("Mismatch between fragment and outline node - exit");
	if (outlineNode.i !== fragment.id) throw new Error("Mismatch between outline node id and fragment id");
};
var processChartRoot = (state, segment, fragment) => {
	checkForChartRootErrors(segment, fragment);
	gFragmentCode.loadNextChainFragment(state, segment);
	setLinksRoot(state, segment, fragment);
};
var setLinksRoot = (state, segment, fragment) => {
	const inSection = segment.segmentInSection;
	if (!inSection) throw new Error("Segment in section was null - chart root");
	const section = segment.segmentSection;
	if (!section) throw new Error("Segment section was null - chart root");
	let parent = gStateCode.getCached_chainFragment(state, inSection.linkID, segment.start.key);
	if (parent?.link) {
		if (parent.id === fragment.id) throw new Error("Parent and Fragment are the same");
		parent.link.root = fragment;
	} else throw new Error("ParentFragment was null");
	section.current = fragment;
};
var processNode = (state, segment, outlineNode, fragment) => {
	checkForNodeErrors(segment, outlineNode, fragment);
	gFragmentCode.loadNextChainFragment(state, segment);
	processFragment(state, fragment);
};
var processLast = (state, segment, outlineNode, fragment) => {
	checkForLastFragmentErrors(segment, outlineNode, fragment);
	processFragment(state, fragment);
	fragment.link = null;
	fragment.selected = null;
	if (fragment.options?.length > 0) {
		gFragmentCode.resetFragmentUis(state);
		fragment.ui.fragmentOptionsExpanded = true;
		state.renderState.ui.optionsExpanded = true;
	}
};
var processLink = (state, segment, outlineNode, fragment) => {
	if (outlineNode.i !== fragment.id) throw new Error("Mismatch between outline node id and fragment id");
	const outline = fragment.section.outline;
	if (!outline) return;
	if (outlineNode?.c == null) throw new Error();
	if (outlineNode.isRoot === true && outlineNode.isChart === true) setLinksRoot(state, segment, fragment);
	const outlineChart = gOutlineCode.getOutlineChart(outline, outlineNode?.c);
	gOutlineCode.getSegmentOutline_subscription(state, outlineChart, fragment, segment.index);
};
var processExit = (state, segment, outlineNode, exitFragment) => {
	checkForExitErrors(segment, outlineNode, exitFragment);
	const sectionParent = exitFragment.section.parent;
	if (!sectionParent) throw new Error("IDisplayChart parent is null");
	const iExitKey = exitFragment.exitKey;
	for (const option of sectionParent.options) if (option.iExitKey === iExitKey) {
		gSegmentCode.loadExitSegment(state, segment.index, option.id);
		gFragmentCode.setCurrent(state, exitFragment);
	}
};
var loadFragment = (state, response, option) => {
	const parentFragmentID = option.parentFragmentID;
	if (gUtilities.isNullOrWhiteSpace(parentFragmentID) === true) throw new Error("Parent fragment ID is null");
	const renderFragment = gFragmentCode.parseAndLoadFragment(state, response.textData, parentFragmentID, option.id, option.section);
	state.loading = false;
	return renderFragment;
};
var loadPodFragment = (state, response, option) => {
	const parentFragmentID = option.parentFragmentID;
	if (gUtilities.isNullOrWhiteSpace(parentFragmentID) === true) throw new Error("Parent fragment ID is null");
	const renderFragment = gFragmentCode.parseAndLoadPodFragment(state, response.textData, parentFragmentID, option.id, option.section);
	state.loading = false;
	return renderFragment;
};
var processFragment = (state, fragment) => {
	if (!state) return;
	let expandedOption = null;
	let parentFragment = gStateCode.getCached_chainFragment(state, fragment.section.linkID, fragment.parentFragmentID);
	if (!parentFragment) return;
	for (const option of parentFragment.options) if (option.id === fragment.id) {
		expandedOption = option;
		break;
	}
	if (expandedOption) {
		expandedOption.ui.fragmentOptionsExpanded = true;
		gFragmentCode.showOptionNode(state, parentFragment, expandedOption);
	}
};
var gFragmentActions = {
	showAncillaryNode: (state, ancillary) => {
		return getFragmentFile(state, ancillary);
	},
	showOptionNode: (state, parentFragment, option) => {
		gFragmentCode.clearParentSectionSelected(parentFragment.section);
		gFragmentCode.clearOrphanedSteps(parentFragment);
		gFragmentCode.prepareToShowOptionNode(state, option);
		return getFragmentFile(state, option);
	},
	loadFragment: (state, response, option) => {
		if (!state || gUtilities.isNullOrWhiteSpace(option.id)) return state;
		loadFragment(state, response, option);
		return gStateCode.cloneState(state);
	},
	loadFragmentAndSetSelected: (state, response, option, optionText = null) => {
		if (!state) return state;
		const node = loadFragment(state, response, option);
		if (node) {
			gFragmentCode.setCurrent(state, node);
			if (optionText) node.option = optionText;
		}
		if (!state.renderState.isChainLoad) state.renderState.refreshUrl = true;
		return gStateCode.cloneState(state);
	},
	loadPodFragment: (state, response, option, optionText = null) => {
		if (!state) return state;
		const node = loadPodFragment(state, response, option);
		if (node) {
			gFragmentCode.setPodCurrent(state, node);
			if (optionText) node.option = optionText;
		}
		if (!state.renderState.isChainLoad) state.renderState.refreshUrl = true;
		return gStateCode.cloneState(state);
	},
	loadRootFragmentAndSetSelected: (state, response, section) => {
		if (!state) return state;
		const outlineNodeID = section.outline?.r.i;
		if (!outlineNodeID) return state;
		const renderFragment = gFragmentCode.parseAndLoadFragment(state, response.textData, "root", outlineNodeID, section);
		state.loading = false;
		if (renderFragment) {
			renderFragment.section.root = renderFragment;
			renderFragment.section.current = renderFragment;
		}
		state.renderState.refreshUrl = true;
		return gStateCode.cloneState(state);
	},
	loadPodRootFragment: (state, response, section) => {
		if (!state) return state;
		const outlineNodeID = section.outline?.r.i;
		if (!outlineNodeID) return state;
		const renderFragment = gFragmentCode.parseAndLoadPodFragment(state, response.textData, "root", outlineNodeID, section);
		state.loading = false;
		if (renderFragment) {
			renderFragment.section.root = renderFragment;
			renderFragment.section.current = renderFragment;
		}
		state.renderState.refreshUrl = true;
		return gStateCode.cloneState(state);
	},
	loadChainFragment: (state, response, segment, outlineNode) => {
		if (!state) return state;
		const segmentSection = segment.segmentSection;
		if (!segmentSection) throw new Error("Segment section is null");
		let parentFragmentID = outlineNode.parent?.i;
		if (outlineNode.isRoot === true) if (!outlineNode.isChart) parentFragmentID = "guideRoot";
		else parentFragmentID = "root";
		else if (gUtilities.isNullOrWhiteSpace(parentFragmentID) === true) throw new Error("Parent fragment ID is null");
		const fragment = gFragmentCode.parseAndLoadFragmentBase(state, response.textData, parentFragmentID, outlineNode.i, segmentSection, segment.index).fragment;
		state.loading = false;
		if (fragment) {
			let parentFragment = gStateCode.getCached_chainFragment(state, segmentSection.linkID, parentFragmentID);
			segmentSection.current = fragment;
			if (parentFragment) {
				if (parentFragment.id === fragment.id) throw new Error("ParentFragment and Fragment are the same");
				parentFragment.selected = fragment;
				fragment.ui.sectionIndex = parentFragment.ui.sectionIndex + 1;
			}
		}
		return processChainFragmentType(state, segment, outlineNode, fragment);
	}
};
//#endregion
//#region root/src/modules/global/code/gHookRegistryCode.ts
var gHookRegistryCode = { executeStepHook: (state, step) => {
	if (!window.HookRegistry) return;
	window.HookRegistry.executeStepHook(state, step);
} };
//#endregion
//#region root/src/modules/global/code/gFragmentCode.ts
var getVariableValue = (section, variableValues, variableName) => {
	let value = variableValues[variableName];
	if (value) return value;
	const currentValue = section.outline?.mv?.[variableName];
	if (currentValue) variableValues[variableName] = currentValue;
	getAncestorVariableValue(section, variableValues, variableName);
	return variableValues[variableName] ?? null;
};
var getAncestorVariableValue = (section, variableValues, variableName) => {
	const parent = section.parent?.section;
	if (!parent) return;
	const parentValue = parent.outline?.mv?.[variableName];
	if (parentValue) variableValues[variableName] = parentValue;
	getAncestorVariableValue(parent, variableValues, variableName);
};
var checkForVariables = (fragment) => {
	const value = fragment.value;
	const matches = value.matchAll(/〈¦‹(?<variableName>[^›¦]+)›¦〉/gmu);
	let variableName;
	let variableValues = {};
	let result = "";
	let marker = 0;
	for (const match of matches) if (match && match.groups && match.index != null) {
		variableName = match.groups.variableName;
		const variableValue = getVariableValue(fragment.section, variableValues, variableName);
		if (!variableValue) throw new Error(`Variable: ${variableName} could not be found`);
		result = result + value.substring(marker, match.index) + variableValue;
		marker = match.index + match[0].length;
	}
	result = result + value.substring(marker, value.length);
	fragment.value = result;
};
var clearSiblingChains = (parent, fragment) => {
	for (const option of parent.options) if (option.id !== fragment.id) clearFragmentChains(option);
};
var clearFragmentChains = (fragment) => {
	if (!fragment) return;
	clearFragmentChains(fragment.link?.root);
	for (const option of fragment.options) clearFragmentChains(option);
	fragment.selected = null;
	if (fragment.link?.root) fragment.link.root.selected = null;
};
var loadOption = (state, rawOption, outlineNode, section, parentFragmentID, segmentIndex) => {
	const option = new RenderFragment(rawOption.id, parentFragmentID, section, segmentIndex);
	option.option = rawOption.option ?? "";
	option.isAncillary = rawOption.isAncillary === true;
	option.order = rawOption.order ?? 0;
	option.iExitKey = rawOption.iExitKey ?? "";
	option.autoMergeExit = rawOption.autoMergeExit === true;
	option.podKey = rawOption.podKey ?? "";
	option.podText = rawOption.podText ?? "";
	if (outlineNode) {
		for (const outlineOption of outlineNode.o) if (outlineOption.i === option.id) {
			gStateCode.cache_outlineNode(state, section.linkID, outlineOption);
			break;
		}
	}
	gStateCode.cache_chainFragment(state, option);
	gOutlineCode.getPodOutline_subscripion(state, option, section);
	return option;
};
var showPlug_subscription = (state, exit, optionText) => {
	const parent = exit.section.parent;
	if (!parent) throw new Error("IDisplayChart parent is null");
	const iExitKey = exit.exitKey;
	for (const option of parent.options) if (option.iExitKey === iExitKey) return showOptionNode_subscripton(state, option, optionText);
};
var showOptionNode_subscripton = (state, option, optionText = null) => {
	if (!option || !option.section?.outline?.path) return;
	gFragmentCode.prepareToShowOptionNode(state, option);
	return gFragmentCode.getFragmentAndLinkOutline_subscripion(state, option, optionText);
};
var loadNextFragmentInSegment = (state, segment) => {
	const nextOutlineNode = gSegmentCode.getNextSegmentOutlineNode(state, segment);
	if (!nextOutlineNode) return;
	const url = `${segment.segmentSection?.outline?.path}/${nextOutlineNode.i}${gFileConstants.fragmentFileExtension}`;
	const loadDelegate = (state, outlineResponse) => {
		return gFragmentActions.loadChainFragment(state, outlineResponse, segment, nextOutlineNode);
	};
	gStateCode.AddReLoadDataEffectImmediate(state, `loadChainFragment`, ParseType.Json, url, loadDelegate);
};
var gFragmentCode = {
	loadNextChainFragment: (state, segment) => {
		if (segment.outlineNodes.length > 0) loadNextFragmentInSegment(state, segment);
		else gSegmentCode.loadNextSegment(state, segment);
	},
	hasOption: (fragment, optionID) => {
		for (const option of fragment.options) if (option.id === optionID) return true;
		return false;
	},
	checkSelected: (fragment) => {
		if (!fragment.selected?.id) return;
		if (!gFragmentCode.hasOption(fragment, fragment.selected?.id)) throw new Error("Selected has been set to fragment that isn't an option");
	},
	clearParentSectionSelected: (displayChart) => {
		const parent = displayChart.parent;
		if (!parent) return;
		gFragmentCode.clearParentSectionOrphanedSteps(parent);
		gFragmentCode.clearParentSectionSelected(parent.section);
	},
	clearParentSectionOrphanedSteps: (fragment) => {
		if (!fragment) return;
		gFragmentCode.clearOrphanedSteps(fragment.selected);
		fragment.selected = null;
	},
	clearOrphanedSteps: (fragment) => {
		if (!fragment) return;
		gFragmentCode.clearOrphanedSteps(fragment.link?.root);
		gFragmentCode.clearOrphanedSteps(fragment.selected);
		fragment.selected = null;
		fragment.link = null;
	},
	getFragmentAndLinkOutline_subscripion: (state, option, optionText = null) => {
		state.loading = true;
		window.TreeSolve.screen.hideBanner = true;
		gOutlineCode.getLinkOutline_subscripion(state, option);
		const url = `${option.section?.outline?.path}/${option.id}${gFileConstants.fragmentFileExtension}`;
		const loadAction = (state, response) => {
			return gFragmentActions.loadFragmentAndSetSelected(state, response, option, optionText);
		};
		gStateCode.AddReLoadDataEffectImmediate(state, `loadFragmentFile`, ParseType.Text, url, loadAction);
	},
	getPodFragment_subscripion: (state, option, optionText = null) => {
		state.loading = true;
		window.TreeSolve.screen.hideBanner = true;
		const url = `${option.section?.outline?.path}/${option.id}${gFileConstants.fragmentFileExtension}`;
		const loadAction = (state, response) => {
			return gFragmentActions.loadPodFragment(state, response, option, optionText);
		};
		gStateCode.AddReLoadDataEffectImmediate(state, `loadFragmentFile`, ParseType.Text, url, loadAction);
	},
	getLinkElementID: (fragmentID) => {
		return `nt_lk_frag_${fragmentID}`;
	},
	getFragmentElementID: (fragmentID) => {
		return `nt_fr_frag_${fragmentID}`;
	},
	prepareToShowOptionNode: (state, option) => {
		gFragmentCode.markOptionsExpanded(state, option);
		gFragmentCode.setCurrent(state, option);
		gHistoryCode.pushBrowserHistoryState(state);
	},
	prepareToShowPodOptionNode: (state, option) => {
		gFragmentCode.markOptionsExpanded(state, option);
		gFragmentCode.setPodCurrent(state, option);
	},
	parseAndLoadFragment: (state, response, parentFragmentID, outlineNodeID, section) => {
		const result = gFragmentCode.parseAndLoadFragmentBase(state, response, parentFragmentID, outlineNodeID, section);
		const fragment = result.fragment;
		if (result.continueLoading === true) {
			gFragmentCode.autoExpandSingleBlankOption(state, result.fragment);
			if (!fragment.link) gOutlineCode.getLinkOutline_subscripion(state, fragment);
		}
		return fragment;
	},
	parseAndLoadPodFragment: (state, response, parentFragmentID, outlineNodeID, section) => {
		const result = gFragmentCode.parseAndLoadFragmentBase(state, response, parentFragmentID, outlineNodeID, section);
		const fragment = result.fragment;
		if (result.continueLoading === true) gFragmentCode.autoExpandSingleBlankOption(state, result.fragment);
		return fragment;
	},
	parseAndLoadFragmentBase: (state, response, parentFragmentID, outlineNodeID, section, segmentIndex = null) => {
		if (!section.outline) throw new Error("Option section outline was null");
		const rawFragment = gFragmentCode.parseFragment(response);
		if (!rawFragment) throw new Error("Raw fragment was null");
		if (outlineNodeID !== rawFragment.id) throw new Error("The rawFragment id does not match the outlineNodeID");
		let fragment = gStateCode.getCached_chainFragment(state, section.linkID, outlineNodeID);
		if (!fragment) fragment = new RenderFragment(rawFragment.id, parentFragmentID, section, segmentIndex);
		let continueLoading = false;
		gFragmentCode.loadFragment(state, rawFragment, fragment);
		gStateCode.cache_chainFragment(state, fragment);
		continueLoading = true;
		return {
			fragment,
			continueLoading
		};
	},
	autoExpandSingleBlankOption: (state, fragment) => {
		const optionsAndAncillaries = gFragmentCode.splitOptionsAndAncillaries(fragment.options);
		if (optionsAndAncillaries.options.length === 1 && gUtilities.isNullOrWhiteSpace(fragment.iKey) && (optionsAndAncillaries.options[0].option === "" || optionsAndAncillaries.options[0].autoMergeExit === true)) {
			if (gStateCode.getCached_outlineNode(state, fragment.section.linkID, fragment.id)?.c != null) return;
			return showOptionNode_subscripton(state, optionsAndAncillaries.options[0]);
		} else if (!gUtilities.isNullOrWhiteSpace(fragment.exitKey)) showPlug_subscription(state, fragment, fragment.option);
	},
	expandOptionPods: (state, fragment) => {
		const optionsAndAncillaries = gFragmentCode.splitOptionsAndAncillaries(fragment.options);
		for (const option of optionsAndAncillaries.options) {
			if (gStateCode.getCached_outlineNode(state, option.section.linkID, option.id)?.d == null || option.pod != null) return;
			gOutlineCode.getPodOutline_subscripion(state, option, option.section);
		}
	},
	cacheSectionRoot: (state, displaySection) => {
		if (!displaySection) return;
		const rootFragment = displaySection.root;
		if (!rootFragment) return;
		gStateCode.cache_chainFragment(state, rootFragment);
		displaySection.current = displaySection.root;
		for (const option of rootFragment.options) gStateCode.cache_chainFragment(state, option);
	},
	elementIsParagraph: (value) => {
		let trimmed = value;
		if (!gUtilities.isNullOrWhiteSpace(trimmed)) {
			if (trimmed.length > 20) {
				trimmed = trimmed.substring(0, 20);
				trimmed = trimmed.replace(/\s/g, "");
			}
		}
		if (trimmed.startsWith("<p>") === true && trimmed[3] !== "<") return true;
		return false;
	},
	parseAndLoadGuideRootFragment: (state, rawFragment, root) => {
		if (!rawFragment) return;
		gFragmentCode.loadFragment(state, rawFragment, root);
	},
	loadFragment: (state, rawFragment, fragment) => {
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
		checkForVariables(fragment);
		const outlineNode = gStateCode.getCached_outlineNode(state, fragment.section.linkID, fragment.id);
		fragment.parentFragmentID = outlineNode?.parent?.i ?? "";
		let option;
		if (rawFragment.options && Array.isArray(rawFragment.options)) for (const rawOption of rawFragment.options) {
			option = fragment.options.find((o) => o.id === rawOption.id);
			if (!option) {
				option = loadOption(state, rawOption, outlineNode, fragment.section, fragment.id, fragment.segmentIndex);
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
		gHookRegistryCode.executeStepHook(state, fragment);
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
		if (!fragmentRenderComment) return;
		fragmentRenderComment = fragmentRenderComment.trim();
		if (fragmentRenderComment.endsWith(renderCommentEnd) === true) {
			const length = fragmentRenderComment.length - renderCommentEnd.length;
			fragmentRenderComment = fragmentRenderComment.substring(0, length);
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
		if (!state) return;
		gFragmentCode.resetFragmentUis(state);
		state.renderState.ui.optionsExpanded = true;
		fragment.ui.fragmentOptionsExpanded = true;
	},
	collapseFragmentsOptions: (fragment) => {
		if (!fragment || fragment.options.length === 0) return;
		for (const option of fragment.options) option.ui.fragmentOptionsExpanded = false;
	},
	showOptionNode: (state, fragment, option) => {
		gFragmentCode.collapseFragmentsOptions(fragment);
		option.ui.fragmentOptionsExpanded = false;
		gFragmentCode.setCurrent(state, option);
	},
	resetFragmentUis: (state) => {
		const chainFragments = state.renderState.index_chainFragments_id;
		for (const propName in chainFragments) gFragmentCode.resetFragmentUi(chainFragments[propName]);
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
		if (!children) return {
			options,
			ancillaries,
			total: 0
		};
		for (let i = 0; i < children.length; i++) {
			option = children[i];
			if (!option.isAncillary) options.push(option);
			else ancillaries.push(option);
		}
		return {
			options,
			ancillaries,
			total: children.length
		};
	},
	setCurrent: (state, fragment) => {
		const section = fragment.section;
		let parent = gStateCode.getCached_chainFragment(state, section.linkID, fragment.parentFragmentID);
		if (parent) {
			if (parent.id === fragment.id) throw new Error("Parent and Fragment are the same");
			parent.selected = fragment;
			fragment.ui.sectionIndex = parent.ui.sectionIndex + 1;
			clearSiblingChains(parent, fragment);
		} else throw new Error("ParentFragment was null");
		section.current = fragment;
		gFragmentCode.checkSelected(fragment);
	},
	setPodCurrent: (state, fragment) => {
		const section = fragment.section;
		let parent = gStateCode.getCached_chainFragment(state, section.linkID, fragment.parentFragmentID);
		if (parent) {
			if (parent.id === fragment.id) throw new Error("Parent and Fragment are the same");
			parent.selected = fragment;
			fragment.ui.sectionIndex = parent.ui.sectionIndex + 1;
			clearSiblingChains(parent, fragment);
		} else throw new Error("ParentFragment was null");
		gFragmentCode.checkSelected(fragment);
	}
};
//#endregion
//#region root/src/modules/components/fragments/actions/fragmentActions.ts
var hideFromPaint = (fragment, hide) => {
	if (!fragment) return;
	fragment.ui.doNotPaint = hide;
	hideFromPaint(fragment.selected, hide);
	hideFromPaint(fragment.link?.root, hide);
};
var hideOptionsFromPaint = (fragment, hide) => {
	if (!fragment) return;
	for (const option of fragment?.options) hideFromPaint(option, hide);
	hideSectionParentSelected(fragment.section, hide);
};
var hideSectionParentSelected = (displayChart, hide) => {
	if (!displayChart?.parent) return;
	hideFromPaint(displayChart.parent.selected, hide);
	hideSectionParentSelected(displayChart.parent.section, hide);
};
var fragmentActions = {
	expandOptions: (state, fragment) => {
		if (!state || !fragment) return state;
		const ignoreEvent = state.renderState.activeAncillary != null;
		gFragmentCode.clearAncillaryActive(state);
		if (ignoreEvent === true) return gStateCode.cloneState(state);
		gStateCode.setDirty(state);
		gFragmentCode.resetFragmentUis(state);
		const expanded = fragment.ui.fragmentOptionsExpanded !== true;
		state.renderState.ui.optionsExpanded = expanded;
		fragment.ui.fragmentOptionsExpanded = expanded;
		hideOptionsFromPaint(fragment, true);
		return gStateCode.cloneState(state);
	},
	hideOptions: (state, fragment) => {
		if (!state || !fragment) return state;
		const ignoreEvent = state.renderState.activeAncillary != null;
		gFragmentCode.clearAncillaryActive(state);
		if (ignoreEvent === true) return gStateCode.cloneState(state);
		gStateCode.setDirty(state);
		gFragmentCode.resetFragmentUis(state);
		fragment.ui.fragmentOptionsExpanded = false;
		state.renderState.ui.optionsExpanded = false;
		hideOptionsFromPaint(fragment, false);
		return gStateCode.cloneState(state);
	},
	showOptionNode: (state, payload) => {
		if (!state || !payload?.parentFragment || !payload?.option) return state;
		const ignoreEvent = state.renderState.activeAncillary != null;
		gFragmentCode.clearAncillaryActive(state);
		if (ignoreEvent === true) return gStateCode.cloneState(state);
		gStateCode.setDirty(state);
		return gFragmentActions.showOptionNode(state, payload.parentFragment, payload.option);
	},
	toggleAncillaryNode: (state, payload) => {
		if (!state) return state;
		const ancillary = payload.option;
		gFragmentCode.setAncillaryActive(state, ancillary);
		if (ancillary) {
			gStateCode.setDirty(state);
			if (!ancillary.ui.ancillaryExpanded) {
				ancillary.ui.ancillaryExpanded = true;
				return gFragmentActions.showAncillaryNode(state, ancillary);
			}
			ancillary.ui.ancillaryExpanded = false;
		}
		return gStateCode.cloneState(state);
	}
};
//#endregion
//#region root/src/modules/state/ui/payloads/FragmentPayload.ts
var FragmentPayload = class {
	constructor(parentFragment, option, element) {
		this.parentFragment = parentFragment;
		this.option = option;
		this.element = element;
	}
	parentFragment;
	option;
	element;
};
//#endregion
//#region root/src/modules/components/fragments/views/podViews.ts
var buildPodDiscussionView = (fragment, views) => {
	let adjustForCollapsedOptions = false;
	let adjustForPriorAncillaries = false;
	const viewsLength = views.length;
	if (viewsLength > 0) {
		const lastView = views[viewsLength - 1];
		if (lastView?.ui?.isCollapsed === true) adjustForCollapsedOptions = true;
		if (lastView?.ui?.hasAncillaries === true) adjustForPriorAncillaries = true;
	}
	const linkELementID = gFragmentCode.getLinkElementID(fragment.id);
	const results = optionsViews.buildView(fragment);
	if (linkELementID === "nt_lk_frag_t968OJ1wo") console.log(`R-DRAWING ${linkELementID}_d`);
	let classes = "nt-fr-fragment-box";
	if (fragment.classes) {
		if (fragment.classes) for (const className of fragment.classes) classes = `${classes} nt-ur-${className}`;
	}
	if (adjustForCollapsedOptions === true) classes = `${classes} nt-fr-prior-collapsed-options`;
	if (adjustForPriorAncillaries === true) classes = `${classes} nt-fr-prior-is-ancillary`;
	const view = h("div", {
		id: `${linkELementID}_d`,
		class: `${classes}`
	}, [h("div", {
		class: `nt-fr-fragment-discussion`,
		"data-discussion": fragment.value
	}, ""), results.views]);
	if (results.optionsCollapsed === true) {
		const viewAny = view;
		if (!viewAny.ui) viewAny.ui = {};
		viewAny.ui.isCollapsed = true;
	}
	if (results.hasAncillaries === true) {
		const viewAny = view;
		if (!viewAny.ui) viewAny.ui = {};
		viewAny.ui.hasAncillaries = true;
	}
	views.push(view);
};
var buildView = (fragment) => {
	const views = [];
	buildPodDiscussionView(fragment, views);
	fragmentViews.buildView(fragment.selected, views);
	return views;
};
var podViews = { buildView: (option) => {
	if (!option || !option.pod?.root) return null;
	return h("div", { class: "nt-fr-pod-box" }, buildView(option.pod?.root));
} };
//#endregion
//#region root/src/modules/components/fragments/views/optionsViews.ts
var buildAncillaryDiscussionView = (ancillary) => {
	if (!ancillary.ui.ancillaryExpanded) return [];
	const view = [];
	fragmentViews.buildView(ancillary, view);
	return view;
};
var buildExpandedAncillaryView = (parent, ancillary) => {
	if (!ancillary || !ancillary.isAncillary) return null;
	return h("div", { class: "nt-fr-ancillary-box" }, [h("div", { class: "nt-fr-ancillary-head" }, [h("a", {
		class: "nt-fr-ancillary nt-fr-ancillary-target",
		onMouseDown: [fragmentActions.toggleAncillaryNode, (target) => {
			return new FragmentPayload(parent, ancillary, target);
		}]
	}, [h("span", { class: "nt-fr-ancillary-text nt-fr-ancillary-target" }, ancillary.option), h("span", { class: "nt-fr-ancillary-x nt-fr-ancillary-target" }, "✕")])]), buildAncillaryDiscussionView(ancillary)]);
};
var buildCollapsedAncillaryView = (parent, ancillary) => {
	if (!ancillary || !ancillary.isAncillary) return null;
	return h("div", { class: "nt-fr-ancillary-box nt-fr-collapsed" }, [h("div", { class: "nt-fr-ancillary-head" }, [h("a", {
		class: "nt-fr-ancillary nt-fr-ancillary-target",
		onMouseDown: [fragmentActions.toggleAncillaryNode, (target) => {
			return new FragmentPayload(parent, ancillary, target);
		}]
	}, [h("span", { class: "nt-fr-ancillary-target" }, ancillary.option)])])]);
};
var BuildAncillaryView = (parent, ancillary) => {
	if (!ancillary || !ancillary.isAncillary) return null;
	if (ancillary.ui.ancillaryExpanded === true) return buildExpandedAncillaryView(parent, ancillary);
	return buildCollapsedAncillaryView(parent, ancillary);
};
var BuildExpandedOptionView = (parent, option) => {
	if (!option || option.isAncillary === true) return null;
	let buttonClass = "nt-fr-option";
	let innerView;
	if (option.pod?.root) {
		buttonClass = `${buttonClass} nt-fr-pod-button`;
		innerView = podViews.buildView(option);
	} else innerView = h("span", { class: "nt-fr-option-text" }, option.option);
	return h("div", { class: "nt-fr-option-box" }, [h("a", {
		class: `${buttonClass}`,
		onMouseDown: [fragmentActions.showOptionNode, (target) => {
			return new FragmentPayload(parent, option, target);
		}]
	}, [innerView])]);
};
var buildExpandedOptionsView = (fragment, options) => {
	const optionViews = [];
	let optionVew;
	for (const option of options) {
		optionVew = BuildExpandedOptionView(fragment, option);
		if (optionVew) optionViews.push(optionVew);
	}
	let optionsClasses = "nt-fr-fragment-options";
	if (fragment.selected) optionsClasses = `${optionsClasses} nt-fr-fragment-chain`;
	return {
		view: h("div", {
			class: `${optionsClasses}`,
			tabindex: 0,
			onBlur: [fragmentActions.hideOptions, (_event) => fragment]
		}, optionViews),
		isCollapsed: false
	};
};
var buildExpandedOptionsBoxView = (fragment, options, fragmentELementID, views) => {
	const optionsView = buildExpandedOptionsView(fragment, options);
	if (!optionsView) return;
	let classes = "nt-fr-fragment-box";
	if (fragment.classes) {
		if (fragment.classes) for (const className of fragment.classes) classes = `${classes} nt-ur-${className}`;
	}
	views.push(h("div", {
		id: `${fragmentELementID}_eo`,
		class: `${classes}`
	}, [optionsView.view]));
};
var buildCollapsedOptionsView = (fragment) => {
	let buttonClass = "nt-fr-fragment-options nt-fr-collapsed";
	if (fragment.selected?.pod?.root) buttonClass = `${buttonClass} nt-fr-pod-button`;
	return h("a", {
		class: `${buttonClass}`,
		onMouseDown: [fragmentActions.expandOptions, (_event) => fragment]
	}, [podViews.buildView(fragment.selected), h("span", { class: `nt-fr-option-selected` }, `${fragment.selected?.option}`)]);
};
var buildCollapsedOptionsBoxView = (fragment, fragmentELementID, views) => {
	const optionView = buildCollapsedOptionsView(fragment);
	let classes = "nt-fr-fragment-box";
	if (fragment.classes) {
		if (fragment.classes) for (const className of fragment.classes) classes = `${classes} nt-ur-${className}`;
	}
	const view = h("div", {
		id: `${fragmentELementID}_co`,
		class: `${classes}`
	}, [optionView]);
	const viewAny = view;
	if (!viewAny.ui) viewAny.ui = {};
	viewAny.ui.isCollapsed = true;
	views.push(view);
};
var buildAncillariesView = (fragment, ancillaries) => {
	if (ancillaries.length === 0) return null;
	const ancillariesViews = [];
	let ancillaryView;
	for (const ancillary of ancillaries) {
		ancillaryView = BuildAncillaryView(fragment, ancillary);
		if (ancillaryView) ancillariesViews.push(ancillaryView);
	}
	if (ancillariesViews.length === 0) return null;
	let ancillariesClasses = "nt-fr-fragment-ancillaries";
	if (fragment.selected) ancillariesClasses = `${ancillariesClasses} nt-fr-fragment-chain`;
	return h("div", {
		class: `${ancillariesClasses}`,
		tabindex: 0
	}, ancillariesViews);
};
var buildAncillariesBoxView = (fragment, ancillaries, fragmentELementID, views) => {
	const ancillariesView = buildAncillariesView(fragment, ancillaries);
	if (!ancillariesView) return;
	let classes = "nt-fr-fragment-box";
	if (fragment.classes) {
		if (fragment.classes) for (const className of fragment.classes) classes = `${classes} nt-ur-${className}`;
	}
	const view = h("div", {
		id: `${fragmentELementID}_a`,
		class: `${classes}`
	}, [ancillariesView]);
	const viewAny = view;
	if (!viewAny.ui) viewAny.ui = {};
	viewAny.ui.hasAncillaries = true;
	views.push(view);
};
var buildOptionsView = (fragment, options) => {
	if (options.length === 0) return null;
	if (options.length === 1 && (options[0].option === "" || options[0].autoMergeExit === true)) return null;
	if (fragment.selected && !fragment.ui.fragmentOptionsExpanded) return {
		view: buildCollapsedOptionsView(fragment),
		isCollapsed: true
	};
	return buildExpandedOptionsView(fragment, options);
};
var buildOptionsBoxView = (fragment, options, fragmentELementID, views) => {
	if (options.length === 0) return;
	if (options.length === 1 && (options[0].option === "" || options[0].autoMergeExit === true)) return;
	if (fragment.selected && !fragment.ui.fragmentOptionsExpanded) {
		buildCollapsedOptionsBoxView(fragment, fragmentELementID, views);
		return;
	}
	buildExpandedOptionsBoxView(fragment, options, fragmentELementID, views);
};
var optionsViews = {
	buildView: (fragment) => {
		if (!fragment.options || fragment.options.length === 0 || !gUtilities.isNullOrWhiteSpace(fragment.iKey)) return {
			views: [],
			optionsCollapsed: false,
			hasAncillaries: false
		};
		if (fragment.options.length === 1 && (fragment.options[0].option === "" || fragment.options[0].autoMergeExit === true)) return {
			views: [],
			optionsCollapsed: false,
			hasAncillaries: false
		};
		const optionsAndAncillaries = gFragmentCode.splitOptionsAndAncillaries(fragment.options);
		let hasAncillaries = false;
		const views = [buildAncillariesView(fragment, optionsAndAncillaries.ancillaries)];
		if (views.length > 0) hasAncillaries = true;
		const optionsViewResults = buildOptionsView(fragment, optionsAndAncillaries.options);
		if (optionsViewResults) views.push(optionsViewResults.view);
		return {
			views,
			optionsCollapsed: optionsViewResults?.isCollapsed ?? false,
			hasAncillaries
		};
	},
	buildView2: (fragment, views) => {
		if (!fragment.options || fragment.options.length === 0 || !gUtilities.isNullOrWhiteSpace(fragment.iKey)) return;
		if (fragment.options.length === 1 && (fragment.options[0].option === "" || fragment.options[0].autoMergeExit === true)) return;
		const fragmentELementID = gFragmentCode.getFragmentElementID(fragment.id);
		const optionsAndAncillaries = gFragmentCode.splitOptionsAndAncillaries(fragment.options);
		buildAncillariesBoxView(fragment, optionsAndAncillaries.ancillaries, fragmentELementID, views);
		buildOptionsBoxView(fragment, optionsAndAncillaries.options, fragmentELementID, views);
	}
};
//#endregion
//#region root/src/modules/components/fragments/views/linkViews.ts
var buildLinkDiscussionView = (fragment, views) => {
	let adjustForCollapsedOptions = false;
	let adjustForPriorAncillaries = false;
	const viewsLength = views.length;
	if (viewsLength > 0) {
		const lastView = views[viewsLength - 1];
		if (lastView?.ui?.isCollapsed === true) adjustForCollapsedOptions = true;
		if (lastView?.ui?.hasAncillaries === true) adjustForPriorAncillaries = true;
	}
	const linkELementID = gFragmentCode.getLinkElementID(fragment.id);
	const results = optionsViews.buildView(fragment);
	if (linkELementID === "nt_lk_frag_t968OJ1wo") console.log(`R-DRAWING ${linkELementID}_l`);
	let classes = "nt-fr-fragment-box";
	if (fragment.classes) {
		if (fragment.classes) for (const className of fragment.classes) classes = `${classes} nt-ur-${className}`;
	}
	if (adjustForCollapsedOptions === true) classes = `${classes} nt-fr-prior-collapsed-options`;
	if (adjustForPriorAncillaries === true) classes = `${classes} nt-fr-prior-is-ancillary`;
	const view = h("div", {
		id: `${linkELementID}_l`,
		class: `${classes}`
	}, [h("div", {
		class: `nt-fr-fragment-discussion`,
		"data-discussion": fragment.value
	}, ""), results.views]);
	if (results.optionsCollapsed === true) {
		const viewAny = view;
		if (!viewAny.ui) viewAny.ui = {};
		viewAny.ui.isCollapsed = true;
	}
	if (results.hasAncillaries === true) {
		const viewAny = view;
		if (!viewAny.ui) viewAny.ui = {};
		viewAny.ui.hasAncillaries = true;
	}
	views.push(view);
};
var buildLinkExitsView = (_fragment, _view) => {};
var linkViews = { buildView: (fragment, views) => {
	if (!fragment || fragment.ui.doNotPaint === true) return;
	buildLinkDiscussionView(fragment, views);
	linkViews.buildView(fragment.link?.root, views);
	buildLinkExitsView(fragment, views);
	fragmentViews.buildView(fragment.selected, views);
} };
//#endregion
//#region root/src/modules/components/fragments/views/fragmentViews.ts
var buildDiscussionView = (fragment, views) => {
	if (gUtilities.isNullOrWhiteSpace(fragment.value) === true) return;
	let adjustForCollapsedOptions = false;
	let adjustForPriorAncillaries = false;
	const viewsLength = views.length;
	if (viewsLength > 0) {
		const lastView = views[viewsLength - 1];
		if (lastView?.ui?.isCollapsed === true) adjustForCollapsedOptions = true;
		if (lastView?.ui?.hasAncillaries === true) adjustForPriorAncillaries = true;
	}
	const fragmentELementID = gFragmentCode.getFragmentElementID(fragment.id);
	let classes = "nt-fr-fragment-box";
	if (fragment.classes) {
		if (fragment.classes) for (const className of fragment.classes) classes = `${classes} nt-ur-${className}`;
	}
	if (adjustForCollapsedOptions === true) classes = `${classes} nt-fr-prior-collapsed-options`;
	if (adjustForPriorAncillaries === true) classes = `${classes} nt-fr-prior-is-ancillary`;
	views.push(h("div", {
		id: `${fragmentELementID}_d`,
		class: `${classes}`
	}, [h("div", {
		class: `nt-fr-fragment-discussion`,
		"data-discussion": fragment.value
	}, "")]));
};
var fragmentViews = { buildView: (fragment, views) => {
	if (!fragment || fragment.ui.doNotPaint === true) return;
	buildDiscussionView(fragment, views);
	linkViews.buildView(fragment.link?.root, views);
	optionsViews.buildView2(fragment, views);
	fragmentViews.buildView(fragment.selected, views);
} };
//#endregion
//#region root/src/modules/components/fragments/views/guideViews.ts
var guideViews = { buildContentView: (state) => {
	const innerViews = [];
	fragmentViews.buildView(state.renderState.displayGuide?.root, innerViews);
	return h("div", { id: "nt_fr_Fragments" }, innerViews);
} };
//#endregion
//#region root/src/modules/components/init/views/initView.ts
var initView = { buildView: (state) => {
	return h("div", {
		onClick: initActions.setNotRaw,
		id: "treeSolveFragments"
	}, [guideViews.buildContentView(state)]);
} };
//#endregion
//#region root/src/modules/state/user/Settings.ts
var Settings = class {
	key = "-1";
	r = "-1";
	userPath = `user`;
	defaultLogoutPath = `logout`;
	defaultLoginPath = `login`;
	returnUrlStart = `returnUrl`;
	baseUrl = window.ASSISTANT_BASE_URL ?? "";
	linkUrl = window.ASSISTANT_LINK_URL ?? "";
	subscriptionID = window.ASSISTANT_SUBSCRIPTION_ID ?? "";
	apiUrl = `${this.baseUrl}/api`;
	bffUrl = `${this.baseUrl}/bff`;
	fileUrl = `${this.baseUrl}/file`;
};
//#endregion
//#region root/src/modules/interfaces/enums/navigationDirection.ts
var navigationDirection = /* @__PURE__ */ function(navigationDirection) {
	navigationDirection["Buttons"] = "buttons";
	navigationDirection["Backwards"] = "backwards";
	navigationDirection["Forwards"] = "forwards";
	return navigationDirection;
}({});
//#endregion
//#region root/src/modules/state/history/History.ts
var History = class {
	historyChain = [];
	direction = navigationDirection.Buttons;
	currentIndex = 0;
};
//#endregion
//#region root/src/modules/state/user/User.ts
var User = class {
	key = `0123456789`;
	r = "-1";
	useVsCode = true;
	authorised = false;
	raw = true;
	logoutUrl = "";
	showMenu = false;
	name = "";
	sub = "";
};
//#endregion
//#region root/src/modules/state/effects/RepeateEffects.ts
var RepeateEffects = class {
	shortIntervalHttp = [];
	reLoadGetHttpImmediate = [];
	runActionImmediate = [];
};
//#endregion
//#region root/src/modules/state/ui/RenderStateUI.ts
var RenderStateUI = class {
	raw = true;
	optionsExpanded = false;
};
//#endregion
//#region root/src/modules/state/RenderState.ts
var RenderState = class {
	refreshUrl = false;
	isChainLoad = false;
	segments = [];
	displayGuide = null;
	outlines = {};
	outlineUrls = {};
	currentSection = null;
	activeAncillary = null;
	index_outlineNodes_id = {};
	index_chainFragments_id = {};
	ui = new RenderStateUI();
};
//#endregion
//#region root/src/modules/state/State.ts
var State = class {
	constructor() {
		this.settings = new Settings();
	}
	loading = true;
	debug = true;
	genericError = false;
	nextKey = -1;
	settings;
	user = new User();
	renderState = new RenderState();
	repeatEffects = new RepeateEffects();
	stepHistory = new History();
};
//#endregion
//#region root/src/modules/global/effects/gRenderEffects.ts
var getGuideOutline = (state, fragmentFolderUrl, loadDelegate) => {
	if (gUtilities.isNullOrWhiteSpace(fragmentFolderUrl) === true) return;
	const callID = gUtilities.generateGuid();
	let headers = gAjaxHeaderCode.buildHeaders(state, callID, ActionType.GetOutline);
	const url = `${fragmentFolderUrl}/${gFileConstants.guideOutlineFilename}`;
	if (gOutlineCode.registerOutlineUrlDownload(state, url) === true) return;
	return gAuthenticatedHttp({
		url,
		options: {
			method: "GET",
			headers
		},
		response: "json",
		action: loadDelegate,
		error: (state, errorDetails) => {
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
			return gStateCode.cloneState(state);
		}
	});
};
var gRenderEffects = {
	getGuideOutline: (state) => {
		if (!state) return;
		const fragmentFolderUrl = state.renderState.displayGuide?.guide.fragmentFolderUrl ?? "null";
		const loadDelegate = (state, outlineResponse) => {
			return gOutlineActions.loadGuideOutlineProperties(state, outlineResponse, fragmentFolderUrl);
		};
		return getGuideOutline(state, fragmentFolderUrl, loadDelegate);
	},
	getGuideOutlineAndLoadSegments: (state) => {
		if (!state) return;
		const fragmentFolderUrl = state.renderState.displayGuide?.guide.fragmentFolderUrl ?? "null";
		const loadDelegate = (state, outlineResponse) => {
			return gOutlineActions.loadGuideOutlineAndSegments(state, outlineResponse, fragmentFolderUrl);
		};
		return getGuideOutline(state, fragmentFolderUrl, loadDelegate);
	}
};
//#endregion
//#region root/src/modules/components/init/code/initState.ts
var initialiseState = () => {
	if (!window.TreeSolve) window.TreeSolve = new TreeSolve();
	const state = new State();
	gRenderCode.parseRenderingComment(state);
	return state;
};
var buildRenderDisplay = (state) => {
	if (!state.renderState.displayGuide?.root) return state;
	if (gUtilities.isNullOrWhiteSpace(state.renderState.displayGuide?.root.iKey) === true && (!state.renderState.displayGuide?.root.options || state.renderState.displayGuide?.root.options.length === 0)) return state;
	return [state, gRenderEffects.getGuideOutline(state)];
};
var buildSegmentsRenderDisplay = (state, queryString) => {
	state.renderState.isChainLoad = true;
	gSegmentCode.parseSegments(state, queryString);
	const segments = state.renderState.segments;
	if (segments.length === 0) return state;
	if (segments.length === 1) throw new Error("There was only 1 segment");
	if (!segments[0].start.isRoot) throw new Error("GuideRoot not present");
	const firstSegment = segments[1];
	if (!firstSegment.start.isLast && firstSegment.start.type !== OutlineType.Link) throw new Error("Invalid query string format - it should start with '-' or '~'");
	return [state, gRenderEffects.getGuideOutlineAndLoadSegments(state)];
};
var initState = { initialise: () => {
	const state = initialiseState();
	const queryString = window.location.search;
	try {
		if (!gUtilities.isNullOrWhiteSpace(queryString)) return buildSegmentsRenderDisplay(state, queryString);
		return buildRenderDisplay(state);
	} catch (e) {
		state.genericError = true;
		console.log(e);
		return state;
	}
} };
//#endregion
//#region root/src/modules/components/init/code/renderComments.ts
var renderComments = { registerGuideComment: () => {
	const treeSolveGuide = document.getElementById(Filters.treeSolveGuideID);
	if (treeSolveGuide && treeSolveGuide.hasChildNodes() === true) {
		let childNode;
		for (let i = 0; i < treeSolveGuide.childNodes.length; i++) {
			childNode = treeSolveGuide.childNodes[i];
			if (childNode.nodeType === Node.COMMENT_NODE) {
				if (!window.TreeSolve) window.TreeSolve = new TreeSolve();
				window.TreeSolve.renderingComment = childNode.textContent;
				childNode.remove();
				break;
			} else if (childNode.nodeType !== Node.TEXT_NODE) break;
		}
	}
} };
//#endregion
//#region root/src/index.ts
initEvents.registerGlobalEvents();
renderComments.registerGuideComment();
window.CompositeFlowsAuthor = app({
	node: document.getElementById("treeSolveFragments"),
	init: initState.initialise,
	view: initView.buildView,
	subscriptions: initSubscriptions,
	onEnd: initEvents.onRenderFinished
});
//#endregion

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3VpZGUuQ0REVGR5YTcuanMiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiLi4vLi4vcm9vdC9zcmMvaHlwZXJBcHAvaHlwZXItYXBwLWxvY2FsLmpzIiwiLi4vLi4vcm9vdC9zcmMvaHlwZXJBcHAvdGltZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2h0dHAvZ0h0dHAudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2ludGVyZmFjZXMvc3RhdGUvY29uc3RhbnRzL0tleXMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL2VmZmVjdHMvSHR0cEVmZmVjdC50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2dVdGlsaXRpZXMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL2hpc3RvcnkvSGlzdG9yeVVybC50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvaGlzdG9yeS9SZW5kZXJTbmFwU2hvdC50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2NvZGUvZ0hpc3RvcnlDb2RlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9nbG9iYWwvY29kZS9nU3RhdGVDb2RlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9nbG9iYWwvaHR0cC9nQXV0aGVudGljYXRpb25Db2RlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9pbnRlcmZhY2VzL2VudW1zL0FjdGlvblR5cGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9odHRwL2dBamF4SGVhZGVyQ29kZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2h0dHAvZ0F1dGhlbnRpY2F0aW9uRWZmZWN0cy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2h0dHAvZ0F1dGhlbnRpY2F0aW9uQWN0aW9ucy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2h0dHAvZ0F1dGhlbnRpY2F0aW9uSHR0cC50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2FjdGlvbnMvZ1JlcGVhdEFjdGlvbnMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N1YnNjcmlwdGlvbnMvcmVwZWF0U3Vic2NyaXB0aW9uLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9jb21wb25lbnRzL2luaXQvc3Vic2NyaXB0aW9ucy9pbml0U3Vic2NyaXB0aW9ucy50cyIsIi4uLy4uL25vZGVfbW9kdWxlcy9AdmltZW8vcGxheWVyL2Rpc3QvcGxheWVyLmVzLmpzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9jb25zdGFudHMvRmlsdGVycy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvY29tcG9uZW50cy9mcmFnbWVudHMvY29kZS9vbkZyYWdtZW50c1JlbmRlckZpbmlzaGVkLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9jb21wb25lbnRzL2luaXQvY29kZS9vblJlbmRlckZpbmlzaGVkLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9jb21wb25lbnRzL2luaXQvY29kZS9pbml0RXZlbnRzLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9jb21wb25lbnRzL2luaXQvYWN0aW9ucy9pbml0QWN0aW9ucy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvaW50ZXJmYWNlcy9lbnVtcy9QYXJzZVR5cGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL3VpL1JlbmRlckZyYWdtZW50VUkudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL3JlbmRlci9SZW5kZXJGcmFnbWVudC50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvaW50ZXJmYWNlcy9lbnVtcy9PdXRsaW5lVHlwZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvcmVuZGVyL1JlbmRlck91dGxpbmVOb2RlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9yZW5kZXIvUmVuZGVyT3V0bGluZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvcmVuZGVyL1JlbmRlck91dGxpbmVDaGFydC50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvZGlzcGxheS9EaXNwbGF5R3VpZGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL3JlbmRlci9SZW5kZXJHdWlkZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvaW50ZXJmYWNlcy9lbnVtcy9TY3JvbGxIb3BUeXBlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS93aW5kb3cvU2NyZWVuLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS93aW5kb3cvVHJlZVNvbHZlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9nbG9iYWwvZ0ZpbGVDb25zdGFudHMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9jb2RlL2dSZW5kZXJDb2RlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9kaXNwbGF5L0Rpc3BsYXlDaGFydC50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvc2VnbWVudHMvQ2hhaW5TZWdtZW50LnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9zZWdtZW50cy9TZWdtZW50Tm9kZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2NvZGUvZ1NlZ21lbnRDb2RlLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9nbG9iYWwvYWN0aW9ucy9nT3V0bGluZUFjdGlvbnMudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9jb2RlL2dPdXRsaW5lQ29kZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2VmZmVjdHMvZ0ZyYWdtZW50RWZmZWN0cy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2FjdGlvbnMvZ0ZyYWdtZW50QWN0aW9ucy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvZ2xvYmFsL2NvZGUvZ0hvb2tSZWdpc3RyeUNvZGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9jb2RlL2dGcmFnbWVudENvZGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2NvbXBvbmVudHMvZnJhZ21lbnRzL2FjdGlvbnMvZnJhZ21lbnRBY3Rpb25zLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS91aS9wYXlsb2Fkcy9GcmFnbWVudFBheWxvYWQudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2NvbXBvbmVudHMvZnJhZ21lbnRzL3ZpZXdzL3BvZFZpZXdzLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9jb21wb25lbnRzL2ZyYWdtZW50cy92aWV3cy9vcHRpb25zVmlld3MudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2NvbXBvbmVudHMvZnJhZ21lbnRzL3ZpZXdzL2xpbmtWaWV3cy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvY29tcG9uZW50cy9mcmFnbWVudHMvdmlld3MvZnJhZ21lbnRWaWV3cy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvY29tcG9uZW50cy9mcmFnbWVudHMvdmlld3MvZ3VpZGVWaWV3cy50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvY29tcG9uZW50cy9pbml0L3ZpZXdzL2luaXRWaWV3LnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS91c2VyL1NldHRpbmdzLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9pbnRlcmZhY2VzL2VudW1zL25hdmlnYXRpb25EaXJlY3Rpb24udHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL3N0YXRlL2hpc3RvcnkvSGlzdG9yeS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvdXNlci9Vc2VyLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9lZmZlY3RzL1JlcGVhdGVFZmZlY3RzLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS91aS9SZW5kZXJTdGF0ZVVJLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9zdGF0ZS9SZW5kZXJTdGF0ZS50cyIsIi4uLy4uL3Jvb3Qvc3JjL21vZHVsZXMvc3RhdGUvU3RhdGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2dsb2JhbC9lZmZlY3RzL2dSZW5kZXJFZmZlY3RzLnRzIiwiLi4vLi4vcm9vdC9zcmMvbW9kdWxlcy9jb21wb25lbnRzL2luaXQvY29kZS9pbml0U3RhdGUudHMiLCIuLi8uLi9yb290L3NyYy9tb2R1bGVzL2NvbXBvbmVudHMvaW5pdC9jb2RlL3JlbmRlckNvbW1lbnRzLnRzIiwiLi4vLi4vcm9vdC9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsidmFyIFJFQ1lDTEVEX05PREUgPSAxXHJcbnZhciBMQVpZX05PREUgPSAyXHJcbnZhciBURVhUX05PREUgPSAzXHJcbnZhciBFTVBUWV9PQkogPSB7fVxyXG52YXIgRU1QVFlfQVJSID0gW11cclxudmFyIG1hcCA9IEVNUFRZX0FSUi5tYXBcclxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5XHJcbnZhciBkZWZlciA9XHJcbiAgdHlwZW9mIHJlcXVlc3RBbmltYXRpb25GcmFtZSAhPT0gXCJ1bmRlZmluZWRcIlxyXG4gICAgPyByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcclxuICAgIDogc2V0VGltZW91dFxyXG5cclxudmFyIGNyZWF0ZUNsYXNzID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgdmFyIG91dCA9IFwiXCJcclxuXHJcbiAgaWYgKHR5cGVvZiBvYmogPT09IFwic3RyaW5nXCIpIHJldHVybiBvYmpcclxuXHJcbiAgaWYgKGlzQXJyYXkob2JqKSAmJiBvYmoubGVuZ3RoID4gMCkge1xyXG4gICAgZm9yICh2YXIgayA9IDAsIHRtcDsgayA8IG9iai5sZW5ndGg7IGsrKykge1xyXG4gICAgICBpZiAoKHRtcCA9IGNyZWF0ZUNsYXNzKG9ialtrXSkpICE9PSBcIlwiKSB7XHJcbiAgICAgICAgb3V0ICs9IChvdXQgJiYgXCIgXCIpICsgdG1wXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgZm9yICh2YXIgayBpbiBvYmopIHtcclxuICAgICAgaWYgKG9ialtrXSkge1xyXG4gICAgICAgIG91dCArPSAob3V0ICYmIFwiIFwiKSArIGtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG91dFxyXG59XHJcblxyXG52YXIgbWVyZ2UgPSBmdW5jdGlvbihhLCBiKSB7XHJcbiAgdmFyIG91dCA9IHt9XHJcblxyXG4gIGZvciAodmFyIGsgaW4gYSkgb3V0W2tdID0gYVtrXVxyXG4gIGZvciAodmFyIGsgaW4gYikgb3V0W2tdID0gYltrXVxyXG5cclxuICByZXR1cm4gb3V0XHJcbn1cclxuXHJcbnZhciBiYXRjaCA9IGZ1bmN0aW9uKGxpc3QpIHtcclxuICByZXR1cm4gbGlzdC5yZWR1Y2UoZnVuY3Rpb24ob3V0LCBpdGVtKSB7XHJcbiAgICByZXR1cm4gb3V0LmNvbmNhdChcclxuICAgICAgIWl0ZW0gfHwgaXRlbSA9PT0gdHJ1ZVxyXG4gICAgICAgID8gMFxyXG4gICAgICAgIDogdHlwZW9mIGl0ZW1bMF0gPT09IFwiZnVuY3Rpb25cIlxyXG4gICAgICAgID8gW2l0ZW1dXHJcbiAgICAgICAgOiBiYXRjaChpdGVtKVxyXG4gICAgKVxyXG4gIH0sIEVNUFRZX0FSUilcclxufVxyXG5cclxudmFyIGlzU2FtZUFjdGlvbiA9IGZ1bmN0aW9uKGEsIGIpIHtcclxuICByZXR1cm4gaXNBcnJheShhKSAmJiBpc0FycmF5KGIpICYmIGFbMF0gPT09IGJbMF0gJiYgdHlwZW9mIGFbMF0gPT09IFwiZnVuY3Rpb25cIlxyXG59XHJcblxyXG52YXIgc2hvdWxkUmVzdGFydCA9IGZ1bmN0aW9uKGEsIGIpIHtcclxuICBpZiAoYSAhPT0gYikge1xyXG4gICAgZm9yICh2YXIgayBpbiBtZXJnZShhLCBiKSkge1xyXG4gICAgICBpZiAoYVtrXSAhPT0gYltrXSAmJiAhaXNTYW1lQWN0aW9uKGFba10sIGJba10pKSByZXR1cm4gdHJ1ZVxyXG4gICAgICBiW2tdID0gYVtrXVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxudmFyIHBhdGNoU3VicyA9IGZ1bmN0aW9uKG9sZFN1YnMsIG5ld1N1YnMsIGRpc3BhdGNoKSB7XHJcbiAgZm9yIChcclxuICAgIHZhciBpID0gMCwgb2xkU3ViLCBuZXdTdWIsIHN1YnMgPSBbXTtcclxuICAgIGkgPCBvbGRTdWJzLmxlbmd0aCB8fCBpIDwgbmV3U3Vicy5sZW5ndGg7XHJcbiAgICBpKytcclxuICApIHtcclxuICAgIG9sZFN1YiA9IG9sZFN1YnNbaV1cclxuICAgIG5ld1N1YiA9IG5ld1N1YnNbaV1cclxuICAgIHN1YnMucHVzaChcclxuICAgICAgbmV3U3ViXHJcbiAgICAgICAgPyAhb2xkU3ViIHx8XHJcbiAgICAgICAgICBuZXdTdWJbMF0gIT09IG9sZFN1YlswXSB8fFxyXG4gICAgICAgICAgc2hvdWxkUmVzdGFydChuZXdTdWJbMV0sIG9sZFN1YlsxXSlcclxuICAgICAgICAgID8gW1xyXG4gICAgICAgICAgICAgIG5ld1N1YlswXSxcclxuICAgICAgICAgICAgICBuZXdTdWJbMV0sXHJcbiAgICAgICAgICAgICAgbmV3U3ViWzBdKGRpc3BhdGNoLCBuZXdTdWJbMV0pLFxyXG4gICAgICAgICAgICAgIG9sZFN1YiAmJiBvbGRTdWJbMl0oKVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgICA6IG9sZFN1YlxyXG4gICAgICAgIDogb2xkU3ViICYmIG9sZFN1YlsyXSgpXHJcbiAgICApXHJcbiAgfVxyXG4gIHJldHVybiBzdWJzXHJcbn1cclxuXHJcbnZhciBwYXRjaFByb3BlcnR5ID0gZnVuY3Rpb24obm9kZSwga2V5LCBvbGRWYWx1ZSwgbmV3VmFsdWUsIGxpc3RlbmVyLCBpc1N2Zykge1xyXG4gIGlmIChrZXkgPT09IFwia2V5XCIpIHtcclxuICB9IGVsc2UgaWYgKGtleSA9PT0gXCJzdHlsZVwiKSB7XHJcbiAgICBmb3IgKHZhciBrIGluIG1lcmdlKG9sZFZhbHVlLCBuZXdWYWx1ZSkpIHtcclxuICAgICAgb2xkVmFsdWUgPSBuZXdWYWx1ZSA9PSBudWxsIHx8IG5ld1ZhbHVlW2tdID09IG51bGwgPyBcIlwiIDogbmV3VmFsdWVba11cclxuICAgICAgaWYgKGtbMF0gPT09IFwiLVwiKSB7XHJcbiAgICAgICAgbm9kZVtrZXldLnNldFByb3BlcnR5KGssIG9sZFZhbHVlKVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5vZGVba2V5XVtrXSA9IG9sZFZhbHVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGVsc2UgaWYgKGtleVswXSA9PT0gXCJvXCIgJiYga2V5WzFdID09PSBcIm5cIikge1xyXG4gICAgaWYgKFxyXG4gICAgICAhKChub2RlLmFjdGlvbnMgfHwgKG5vZGUuYWN0aW9ucyA9IHt9KSlbXHJcbiAgICAgICAgKGtleSA9IGtleS5zbGljZSgyKS50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICBdID0gbmV3VmFsdWUpXHJcbiAgICApIHtcclxuICAgICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGtleSwgbGlzdGVuZXIpXHJcbiAgICB9IGVsc2UgaWYgKCFvbGRWYWx1ZSkge1xyXG4gICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoa2V5LCBsaXN0ZW5lcilcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKCFpc1N2ZyAmJiBrZXkgIT09IFwibGlzdFwiICYmIGtleSBpbiBub2RlKSB7XHJcbiAgICBub2RlW2tleV0gPSBuZXdWYWx1ZSA9PSBudWxsIHx8IG5ld1ZhbHVlID09IFwidW5kZWZpbmVkXCIgPyBcIlwiIDogbmV3VmFsdWVcclxuICB9IGVsc2UgaWYgKFxyXG4gICAgbmV3VmFsdWUgPT0gbnVsbCB8fFxyXG4gICAgbmV3VmFsdWUgPT09IGZhbHNlIHx8XHJcbiAgICAoa2V5ID09PSBcImNsYXNzXCIgJiYgIShuZXdWYWx1ZSA9IGNyZWF0ZUNsYXNzKG5ld1ZhbHVlKSkpXHJcbiAgKSB7XHJcbiAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShrZXkpXHJcbiAgfSBlbHNlIHtcclxuICAgIG5vZGUuc2V0QXR0cmlidXRlKGtleSwgbmV3VmFsdWUpXHJcbiAgfVxyXG59XHJcblxyXG52YXIgY3JlYXRlTm9kZSA9IGZ1bmN0aW9uKHZkb20sIGxpc3RlbmVyLCBpc1N2Zykge1xyXG4gIHZhciBucyA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIlxyXG4gIHZhciBwcm9wcyA9IHZkb20ucHJvcHNcclxuICB2YXIgbm9kZSA9XHJcbiAgICB2ZG9tLnR5cGUgPT09IFRFWFRfTk9ERVxyXG4gICAgICA/IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZkb20ubmFtZSlcclxuICAgICAgOiAoaXNTdmcgPSBpc1N2ZyB8fCB2ZG9tLm5hbWUgPT09IFwic3ZnXCIpXHJcbiAgICAgID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLCB2ZG9tLm5hbWUsIHsgaXM6IHByb3BzLmlzIH0pXHJcbiAgICAgIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh2ZG9tLm5hbWUsIHsgaXM6IHByb3BzLmlzIH0pXHJcblxyXG4gIGZvciAodmFyIGsgaW4gcHJvcHMpIHtcclxuICAgIHBhdGNoUHJvcGVydHkobm9kZSwgaywgbnVsbCwgcHJvcHNba10sIGxpc3RlbmVyLCBpc1N2ZylcclxuICB9XHJcblxyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB2ZG9tLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICBub2RlLmFwcGVuZENoaWxkKFxyXG4gICAgICBjcmVhdGVOb2RlKFxyXG4gICAgICAgICh2ZG9tLmNoaWxkcmVuW2ldID0gZ2V0Vk5vZGUodmRvbS5jaGlsZHJlbltpXSkpLFxyXG4gICAgICAgIGxpc3RlbmVyLFxyXG4gICAgICAgIGlzU3ZnXHJcbiAgICAgIClcclxuICAgIClcclxuICB9XHJcblxyXG4gIHJldHVybiAodmRvbS5ub2RlID0gbm9kZSlcclxufVxyXG5cclxudmFyIGdldEtleSA9IGZ1bmN0aW9uKHZkb20pIHtcclxuICByZXR1cm4gdmRvbSA9PSBudWxsID8gbnVsbCA6IHZkb20ua2V5XHJcbn1cclxuXHJcbnZhciBwYXRjaCA9IGZ1bmN0aW9uKHBhcmVudCwgbm9kZSwgb2xkVk5vZGUsIG5ld1ZOb2RlLCBsaXN0ZW5lciwgaXNTdmcpIHtcclxuICBpZiAob2xkVk5vZGUgPT09IG5ld1ZOb2RlKSB7XHJcbiAgfSBlbHNlIGlmIChcclxuICAgIG9sZFZOb2RlICE9IG51bGwgJiZcclxuICAgIG9sZFZOb2RlLnR5cGUgPT09IFRFWFRfTk9ERSAmJlxyXG4gICAgbmV3Vk5vZGUudHlwZSA9PT0gVEVYVF9OT0RFXHJcbiAgKSB7XHJcbiAgICBpZiAob2xkVk5vZGUubmFtZSAhPT0gbmV3Vk5vZGUubmFtZSkgbm9kZS5ub2RlVmFsdWUgPSBuZXdWTm9kZS5uYW1lXHJcbiAgfSBlbHNlIGlmIChvbGRWTm9kZSA9PSBudWxsIHx8IG9sZFZOb2RlLm5hbWUgIT09IG5ld1ZOb2RlLm5hbWUpIHtcclxuICAgIG5vZGUgPSBwYXJlbnQuaW5zZXJ0QmVmb3JlKFxyXG4gICAgICBjcmVhdGVOb2RlKChuZXdWTm9kZSA9IGdldFZOb2RlKG5ld1ZOb2RlKSksIGxpc3RlbmVyLCBpc1N2ZyksXHJcbiAgICAgIG5vZGVcclxuICAgIClcclxuICAgIGlmIChvbGRWTm9kZSAhPSBudWxsKSB7XHJcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChvbGRWTm9kZS5ub2RlKVxyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICB2YXIgdG1wVktpZFxyXG4gICAgdmFyIG9sZFZLaWRcclxuXHJcbiAgICB2YXIgb2xkS2V5XHJcbiAgICB2YXIgbmV3S2V5XHJcblxyXG4gICAgdmFyIG9sZFZQcm9wcyA9IG9sZFZOb2RlLnByb3BzXHJcbiAgICB2YXIgbmV3VlByb3BzID0gbmV3Vk5vZGUucHJvcHNcclxuXHJcbiAgICB2YXIgb2xkVktpZHMgPSBvbGRWTm9kZS5jaGlsZHJlblxyXG4gICAgdmFyIG5ld1ZLaWRzID0gbmV3Vk5vZGUuY2hpbGRyZW5cclxuXHJcbiAgICB2YXIgb2xkSGVhZCA9IDBcclxuICAgIHZhciBuZXdIZWFkID0gMFxyXG4gICAgdmFyIG9sZFRhaWwgPSBvbGRWS2lkcy5sZW5ndGggLSAxXHJcbiAgICB2YXIgbmV3VGFpbCA9IG5ld1ZLaWRzLmxlbmd0aCAtIDFcclxuXHJcbiAgICBpc1N2ZyA9IGlzU3ZnIHx8IG5ld1ZOb2RlLm5hbWUgPT09IFwic3ZnXCJcclxuXHJcbiAgICBmb3IgKHZhciBpIGluIG1lcmdlKG9sZFZQcm9wcywgbmV3VlByb3BzKSkge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgKGkgPT09IFwidmFsdWVcIiB8fCBpID09PSBcInNlbGVjdGVkXCIgfHwgaSA9PT0gXCJjaGVja2VkXCJcclxuICAgICAgICAgID8gbm9kZVtpXVxyXG4gICAgICAgICAgOiBvbGRWUHJvcHNbaV0pICE9PSBuZXdWUHJvcHNbaV1cclxuICAgICAgKSB7XHJcbiAgICAgICAgcGF0Y2hQcm9wZXJ0eShub2RlLCBpLCBvbGRWUHJvcHNbaV0sIG5ld1ZQcm9wc1tpXSwgbGlzdGVuZXIsIGlzU3ZnKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUgKG5ld0hlYWQgPD0gbmV3VGFpbCAmJiBvbGRIZWFkIDw9IG9sZFRhaWwpIHtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIChvbGRLZXkgPSBnZXRLZXkob2xkVktpZHNbb2xkSGVhZF0pKSA9PSBudWxsIHx8XHJcbiAgICAgICAgb2xkS2V5ICE9PSBnZXRLZXkobmV3VktpZHNbbmV3SGVhZF0pXHJcbiAgICAgICkge1xyXG4gICAgICAgIGJyZWFrXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHBhdGNoKFxyXG4gICAgICAgIG5vZGUsXHJcbiAgICAgICAgb2xkVktpZHNbb2xkSGVhZF0ubm9kZSxcclxuICAgICAgICBvbGRWS2lkc1tvbGRIZWFkXSxcclxuICAgICAgICAobmV3VktpZHNbbmV3SGVhZF0gPSBnZXRWTm9kZShcclxuICAgICAgICAgIG5ld1ZLaWRzW25ld0hlYWQrK10sXHJcbiAgICAgICAgICBvbGRWS2lkc1tvbGRIZWFkKytdXHJcbiAgICAgICAgKSksXHJcbiAgICAgICAgbGlzdGVuZXIsXHJcbiAgICAgICAgaXNTdmdcclxuICAgICAgKVxyXG4gICAgfVxyXG5cclxuICAgIHdoaWxlIChuZXdIZWFkIDw9IG5ld1RhaWwgJiYgb2xkSGVhZCA8PSBvbGRUYWlsKSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICAob2xkS2V5ID0gZ2V0S2V5KG9sZFZLaWRzW29sZFRhaWxdKSkgPT0gbnVsbCB8fFxyXG4gICAgICAgIG9sZEtleSAhPT0gZ2V0S2V5KG5ld1ZLaWRzW25ld1RhaWxdKVxyXG4gICAgICApIHtcclxuICAgICAgICBicmVha1xyXG4gICAgICB9XHJcblxyXG4gICAgICBwYXRjaChcclxuICAgICAgICBub2RlLFxyXG4gICAgICAgIG9sZFZLaWRzW29sZFRhaWxdLm5vZGUsXHJcbiAgICAgICAgb2xkVktpZHNbb2xkVGFpbF0sXHJcbiAgICAgICAgKG5ld1ZLaWRzW25ld1RhaWxdID0gZ2V0Vk5vZGUoXHJcbiAgICAgICAgICBuZXdWS2lkc1tuZXdUYWlsLS1dLFxyXG4gICAgICAgICAgb2xkVktpZHNbb2xkVGFpbC0tXVxyXG4gICAgICAgICkpLFxyXG4gICAgICAgIGxpc3RlbmVyLFxyXG4gICAgICAgIGlzU3ZnXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICBpZiAob2xkSGVhZCA+IG9sZFRhaWwpIHtcclxuICAgICAgd2hpbGUgKG5ld0hlYWQgPD0gbmV3VGFpbCkge1xyXG4gICAgICAgIG5vZGUuaW5zZXJ0QmVmb3JlKFxyXG4gICAgICAgICAgY3JlYXRlTm9kZShcclxuICAgICAgICAgICAgKG5ld1ZLaWRzW25ld0hlYWRdID0gZ2V0Vk5vZGUobmV3VktpZHNbbmV3SGVhZCsrXSkpLFxyXG4gICAgICAgICAgICBsaXN0ZW5lcixcclxuICAgICAgICAgICAgaXNTdmdcclxuICAgICAgICAgICksXHJcbiAgICAgICAgICAob2xkVktpZCA9IG9sZFZLaWRzW29sZEhlYWRdKSAmJiBvbGRWS2lkLm5vZGVcclxuICAgICAgICApXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAobmV3SGVhZCA+IG5ld1RhaWwpIHtcclxuICAgICAgd2hpbGUgKG9sZEhlYWQgPD0gb2xkVGFpbCkge1xyXG4gICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQob2xkVktpZHNbb2xkSGVhZCsrXS5ub2RlKVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmb3IgKHZhciBpID0gb2xkSGVhZCwga2V5ZWQgPSB7fSwgbmV3S2V5ZWQgPSB7fTsgaSA8PSBvbGRUYWlsOyBpKyspIHtcclxuICAgICAgICBpZiAoKG9sZEtleSA9IG9sZFZLaWRzW2ldLmtleSkgIT0gbnVsbCkge1xyXG4gICAgICAgICAga2V5ZWRbb2xkS2V5XSA9IG9sZFZLaWRzW2ldXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICB3aGlsZSAobmV3SGVhZCA8PSBuZXdUYWlsKSB7XHJcbiAgICAgICAgb2xkS2V5ID0gZ2V0S2V5KChvbGRWS2lkID0gb2xkVktpZHNbb2xkSGVhZF0pKVxyXG4gICAgICAgIG5ld0tleSA9IGdldEtleShcclxuICAgICAgICAgIChuZXdWS2lkc1tuZXdIZWFkXSA9IGdldFZOb2RlKG5ld1ZLaWRzW25ld0hlYWRdLCBvbGRWS2lkKSlcclxuICAgICAgICApXHJcblxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgIG5ld0tleWVkW29sZEtleV0gfHxcclxuICAgICAgICAgIChuZXdLZXkgIT0gbnVsbCAmJiBuZXdLZXkgPT09IGdldEtleShvbGRWS2lkc1tvbGRIZWFkICsgMV0pKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgaWYgKG9sZEtleSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIG5vZGUucmVtb3ZlQ2hpbGQob2xkVktpZC5ub2RlKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgb2xkSGVhZCsrXHJcbiAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG5ld0tleSA9PSBudWxsIHx8IG9sZFZOb2RlLnR5cGUgPT09IFJFQ1lDTEVEX05PREUpIHtcclxuICAgICAgICAgIGlmIChvbGRLZXkgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBwYXRjaChcclxuICAgICAgICAgICAgICBub2RlLFxyXG4gICAgICAgICAgICAgIG9sZFZLaWQgJiYgb2xkVktpZC5ub2RlLFxyXG4gICAgICAgICAgICAgIG9sZFZLaWQsXHJcbiAgICAgICAgICAgICAgbmV3VktpZHNbbmV3SGVhZF0sXHJcbiAgICAgICAgICAgICAgbGlzdGVuZXIsXHJcbiAgICAgICAgICAgICAgaXNTdmdcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICBuZXdIZWFkKytcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIG9sZEhlYWQrK1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAob2xkS2V5ID09PSBuZXdLZXkpIHtcclxuICAgICAgICAgICAgcGF0Y2goXHJcbiAgICAgICAgICAgICAgbm9kZSxcclxuICAgICAgICAgICAgICBvbGRWS2lkLm5vZGUsXHJcbiAgICAgICAgICAgICAgb2xkVktpZCxcclxuICAgICAgICAgICAgICBuZXdWS2lkc1tuZXdIZWFkXSxcclxuICAgICAgICAgICAgICBsaXN0ZW5lcixcclxuICAgICAgICAgICAgICBpc1N2Z1xyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIG5ld0tleWVkW25ld0tleV0gPSB0cnVlXHJcbiAgICAgICAgICAgIG9sZEhlYWQrK1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKCh0bXBWS2lkID0ga2V5ZWRbbmV3S2V5XSkgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgIHBhdGNoKFxyXG4gICAgICAgICAgICAgICAgbm9kZSxcclxuICAgICAgICAgICAgICAgIG5vZGUuaW5zZXJ0QmVmb3JlKHRtcFZLaWQubm9kZSwgb2xkVktpZCAmJiBvbGRWS2lkLm5vZGUpLFxyXG4gICAgICAgICAgICAgICAgdG1wVktpZCxcclxuICAgICAgICAgICAgICAgIG5ld1ZLaWRzW25ld0hlYWRdLFxyXG4gICAgICAgICAgICAgICAgbGlzdGVuZXIsXHJcbiAgICAgICAgICAgICAgICBpc1N2Z1xyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICBuZXdLZXllZFtuZXdLZXldID0gdHJ1ZVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHBhdGNoKFxyXG4gICAgICAgICAgICAgICAgbm9kZSxcclxuICAgICAgICAgICAgICAgIG9sZFZLaWQgJiYgb2xkVktpZC5ub2RlLFxyXG4gICAgICAgICAgICAgICAgbnVsbCxcclxuICAgICAgICAgICAgICAgIG5ld1ZLaWRzW25ld0hlYWRdLFxyXG4gICAgICAgICAgICAgICAgbGlzdGVuZXIsXHJcbiAgICAgICAgICAgICAgICBpc1N2Z1xyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbmV3SGVhZCsrXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICB3aGlsZSAob2xkSGVhZCA8PSBvbGRUYWlsKSB7XHJcbiAgICAgICAgaWYgKGdldEtleSgob2xkVktpZCA9IG9sZFZLaWRzW29sZEhlYWQrK10pKSA9PSBudWxsKSB7XHJcbiAgICAgICAgICBub2RlLnJlbW92ZUNoaWxkKG9sZFZLaWQubm9kZSlcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAodmFyIGkgaW4ga2V5ZWQpIHtcclxuICAgICAgICBpZiAobmV3S2V5ZWRbaV0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChrZXllZFtpXS5ub2RlKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIChuZXdWTm9kZS5ub2RlID0gbm9kZSlcclxufVxyXG5cclxudmFyIHByb3BzQ2hhbmdlZCA9IGZ1bmN0aW9uKGEsIGIpIHtcclxuICBmb3IgKHZhciBrIGluIGEpIGlmIChhW2tdICE9PSBiW2tdKSByZXR1cm4gdHJ1ZVxyXG4gIGZvciAodmFyIGsgaW4gYikgaWYgKGFba10gIT09IGJba10pIHJldHVybiB0cnVlXHJcbn1cclxuXHJcbnZhciBnZXRUZXh0Vk5vZGUgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgcmV0dXJuIHR5cGVvZiBub2RlID09PSBcIm9iamVjdFwiID8gbm9kZSA6IGNyZWF0ZVRleHRWTm9kZShub2RlKVxyXG59XHJcblxyXG52YXIgZ2V0Vk5vZGUgPSBmdW5jdGlvbihuZXdWTm9kZSwgb2xkVk5vZGUpIHtcclxuICByZXR1cm4gbmV3Vk5vZGUudHlwZSA9PT0gTEFaWV9OT0RFXHJcbiAgICA/ICgoIW9sZFZOb2RlIHx8ICFvbGRWTm9kZS5sYXp5IHx8IHByb3BzQ2hhbmdlZChvbGRWTm9kZS5sYXp5LCBuZXdWTm9kZS5sYXp5KSlcclxuICAgICAgICAmJiAoKG9sZFZOb2RlID0gZ2V0VGV4dFZOb2RlKG5ld1ZOb2RlLmxhenkudmlldyhuZXdWTm9kZS5sYXp5KSkpLmxhenkgPVxyXG4gICAgICAgICAgbmV3Vk5vZGUubGF6eSksXHJcbiAgICAgIG9sZFZOb2RlKVxyXG4gICAgOiBuZXdWTm9kZVxyXG59XHJcblxyXG52YXIgY3JlYXRlVk5vZGUgPSBmdW5jdGlvbihuYW1lLCBwcm9wcywgY2hpbGRyZW4sIG5vZGUsIGtleSwgdHlwZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiBuYW1lLFxyXG4gICAgcHJvcHM6IHByb3BzLFxyXG4gICAgY2hpbGRyZW46IGNoaWxkcmVuLFxyXG4gICAgbm9kZTogbm9kZSxcclxuICAgIHR5cGU6IHR5cGUsXHJcbiAgICBrZXk6IGtleVxyXG4gIH1cclxufVxyXG5cclxudmFyIGNyZWF0ZVRleHRWTm9kZSA9IGZ1bmN0aW9uKHZhbHVlLCBub2RlKSB7XHJcbiAgcmV0dXJuIGNyZWF0ZVZOb2RlKHZhbHVlLCBFTVBUWV9PQkosIEVNUFRZX0FSUiwgbm9kZSwgdW5kZWZpbmVkLCBURVhUX05PREUpXHJcbn1cclxuXHJcbnZhciByZWN5Y2xlTm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gVEVYVF9OT0RFXHJcbiAgICA/IGNyZWF0ZVRleHRWTm9kZShub2RlLm5vZGVWYWx1ZSwgbm9kZSlcclxuICAgIDogY3JlYXRlVk5vZGUoXHJcbiAgICAgICAgbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgIEVNUFRZX09CSixcclxuICAgICAgICBtYXAuY2FsbChub2RlLmNoaWxkTm9kZXMsIHJlY3ljbGVOb2RlKSxcclxuICAgICAgICBub2RlLFxyXG4gICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICBSRUNZQ0xFRF9OT0RFXHJcbiAgICAgIClcclxufVxyXG5cclxuZXhwb3J0IHZhciBMYXp5ID0gZnVuY3Rpb24ocHJvcHMpIHtcclxuICByZXR1cm4ge1xyXG4gICAgbGF6eTogcHJvcHMsXHJcbiAgICB0eXBlOiBMQVpZX05PREVcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgaCA9IGZ1bmN0aW9uKG5hbWUsIHByb3BzKSB7XHJcbiAgZm9yICh2YXIgdmRvbSwgcmVzdCA9IFtdLCBjaGlsZHJlbiA9IFtdLCBpID0gYXJndW1lbnRzLmxlbmd0aDsgaS0tID4gMjsgKSB7XHJcbiAgICByZXN0LnB1c2goYXJndW1lbnRzW2ldKVxyXG4gIH1cclxuXHJcbiAgd2hpbGUgKHJlc3QubGVuZ3RoID4gMCkge1xyXG4gICAgaWYgKGlzQXJyYXkoKHZkb20gPSByZXN0LnBvcCgpKSkpIHtcclxuICAgICAgZm9yICh2YXIgaSA9IHZkb20ubGVuZ3RoOyBpLS0gPiAwOyApIHtcclxuICAgICAgICByZXN0LnB1c2godmRvbVtpXSlcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmICh2ZG9tID09PSBmYWxzZSB8fCB2ZG9tID09PSB0cnVlIHx8IHZkb20gPT0gbnVsbCkge1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY2hpbGRyZW4ucHVzaChnZXRUZXh0Vk5vZGUodmRvbSkpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcm9wcyA9IHByb3BzIHx8IEVNUFRZX09CSlxyXG5cclxuICByZXR1cm4gdHlwZW9mIG5hbWUgPT09IFwiZnVuY3Rpb25cIlxyXG4gICAgPyBuYW1lKHByb3BzLCBjaGlsZHJlbilcclxuICAgIDogY3JlYXRlVk5vZGUobmFtZSwgcHJvcHMsIGNoaWxkcmVuLCB1bmRlZmluZWQsIHByb3BzLmtleSlcclxufVxyXG5cclxuZXhwb3J0IHZhciBhcHAgPSBmdW5jdGlvbihwcm9wcykge1xyXG4gIHZhciBzdGF0ZSA9IHt9XHJcbiAgdmFyIGxvY2sgPSBmYWxzZVxyXG4gIHZhciB2aWV3ID0gcHJvcHMudmlld1xyXG4gIHZhciBub2RlID0gcHJvcHMubm9kZVxyXG4gIHZhciB2ZG9tID0gbm9kZSAmJiByZWN5Y2xlTm9kZShub2RlKVxyXG4gIHZhciBzdWJzY3JpcHRpb25zID0gcHJvcHMuc3Vic2NyaXB0aW9uc1xyXG4gIHZhciBzdWJzID0gW11cclxuICB2YXIgb25FbmQgPSBwcm9wcy5vbkVuZFxyXG5cclxuICB2YXIgbGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgZGlzcGF0Y2godGhpcy5hY3Rpb25zW2V2ZW50LnR5cGVdLCBldmVudClcclxuICB9XHJcblxyXG4gIHZhciBzZXRTdGF0ZSA9IGZ1bmN0aW9uKG5ld1N0YXRlKSB7XHJcbiAgICBpZiAoc3RhdGUgIT09IG5ld1N0YXRlKSB7XHJcbiAgICAgIHN0YXRlID0gbmV3U3RhdGVcclxuICAgICAgaWYgKHN1YnNjcmlwdGlvbnMpIHtcclxuICAgICAgICBzdWJzID0gcGF0Y2hTdWJzKHN1YnMsIGJhdGNoKFtzdWJzY3JpcHRpb25zKHN0YXRlKV0pLCBkaXNwYXRjaClcclxuICAgICAgfVxyXG4gICAgICBpZiAodmlldyAmJiAhbG9jaykgZGVmZXIocmVuZGVyLCAobG9jayA9IHRydWUpKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN0YXRlXHJcbiAgfVxyXG5cclxuICB2YXIgZGlzcGF0Y2ggPSAocHJvcHMubWlkZGxld2FyZSB8fFxyXG4gICAgZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgIHJldHVybiBvYmpcclxuICAgIH0pKGZ1bmN0aW9uKGFjdGlvbiwgcHJvcHMpIHtcclxuICAgIHJldHVybiB0eXBlb2YgYWN0aW9uID09PSBcImZ1bmN0aW9uXCJcclxuICAgICAgPyBkaXNwYXRjaChhY3Rpb24oc3RhdGUsIHByb3BzKSlcclxuICAgICAgOiBpc0FycmF5KGFjdGlvbilcclxuICAgICAgPyB0eXBlb2YgYWN0aW9uWzBdID09PSBcImZ1bmN0aW9uXCIgfHwgaXNBcnJheShhY3Rpb25bMF0pXHJcbiAgICAgICAgPyBkaXNwYXRjaChcclxuICAgICAgICAgICAgYWN0aW9uWzBdLFxyXG4gICAgICAgICAgICB0eXBlb2YgYWN0aW9uWzFdID09PSBcImZ1bmN0aW9uXCIgPyBhY3Rpb25bMV0ocHJvcHMpIDogYWN0aW9uWzFdXHJcbiAgICAgICAgICApXHJcbiAgICAgICAgOiAoYmF0Y2goYWN0aW9uLnNsaWNlKDEpKS5tYXAoZnVuY3Rpb24oZngpIHtcclxuICAgICAgICAgICAgZnggJiYgZnhbMF0oZGlzcGF0Y2gsIGZ4WzFdKVxyXG4gICAgICAgICAgfSwgc2V0U3RhdGUoYWN0aW9uWzBdKSksXHJcbiAgICAgICAgICBzdGF0ZSlcclxuICAgICAgOiBzZXRTdGF0ZShhY3Rpb24pXHJcbiAgfSlcclxuXHJcbiAgdmFyIHJlbmRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgbG9jayA9IGZhbHNlXHJcbiAgICBub2RlID0gcGF0Y2goXHJcbiAgICAgIG5vZGUucGFyZW50Tm9kZSxcclxuICAgICAgbm9kZSxcclxuICAgICAgdmRvbSxcclxuICAgICAgKHZkb20gPSBnZXRUZXh0Vk5vZGUodmlldyhzdGF0ZSkpKSxcclxuICAgICAgbGlzdGVuZXJcclxuICAgIClcclxuICAgIG9uRW5kKClcclxuICB9XHJcblxyXG4gIGRpc3BhdGNoKHByb3BzLmluaXQpXHJcbn1cclxuIiwidmFyIHRpbWVGeCA9IGZ1bmN0aW9uIChmeDogYW55KSB7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChcclxuICAgICAgICBhY3Rpb246IGFueSxcclxuICAgICAgICBwcm9wczogYW55KSB7XHJcblxyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIGZ4LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvbixcclxuICAgICAgICAgICAgICAgIGRlbGF5OiBwcm9wcy5kZWxheVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXTtcclxuICAgIH07XHJcbn07XHJcblxyXG5leHBvcnQgdmFyIHRpbWVvdXQgPSB0aW1lRngoXHJcblxyXG4gICAgZnVuY3Rpb24gKFxyXG4gICAgICAgIGRpc3BhdGNoOiBhbnksXHJcbiAgICAgICAgcHJvcHM6IGFueSkge1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZGlzcGF0Y2gocHJvcHMuYWN0aW9uKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJvcHMuZGVsYXlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG4pO1xyXG5cclxuZXhwb3J0IHZhciBpbnRlcnZhbCA9IHRpbWVGeChcclxuXHJcbiAgICBmdW5jdGlvbiAoXHJcbiAgICAgICAgZGlzcGF0Y2g6IGFueSxcclxuICAgICAgICBwcm9wczogYW55KSB7XHJcblxyXG4gICAgICAgIHZhciBpZCA9IHNldEludGVydmFsKFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGRpc3BhdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BzLmFjdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBEYXRlLm5vdygpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwcm9wcy5kZWxheVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKGlkKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG4pO1xyXG5cclxuXHJcbi8vIGV4cG9ydCB2YXIgbm93XHJcbi8vIGV4cG9ydCB2YXIgcmV0cnlcclxuLy8gZXhwb3J0IHZhciBkZWJvdW5jZVxyXG4vLyBleHBvcnQgdmFyIHRocm90dGxlXHJcbi8vIGV4cG9ydCB2YXIgaWRsZUNhbGxiYWNrP1xyXG4iLCJcclxuaW1wb3J0IElIdHRwQXV0aGVudGljYXRlZFByb3BzIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2h0dHAvSUh0dHBBdXRoZW50aWNhdGVkUHJvcHNcIjtcclxuaW1wb3J0IElIdHRwQXV0aGVudGljYXRlZFByb3BzQmxvY2sgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvaHR0cC9JSHR0cEF1dGhlbnRpY2F0ZWRQcm9wc0Jsb2NrXCI7XHJcbmltcG9ydCB7IElIdHRwRmV0Y2hJdGVtIH0gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvaHR0cC9JSHR0cEZldGNoSXRlbVwiO1xyXG5pbXBvcnQgSUh0dHBPdXRwdXQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvaHR0cC9JSHR0cE91dHB1dFwiO1xyXG5pbXBvcnQgeyBJSHR0cFNlcXVlbnRpYWxGZXRjaEl0ZW0gfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9odHRwL0lIdHRwU2VxdWVudGlhbEZldGNoSXRlbVwiO1xyXG5cclxuY29uc3Qgc2VxdWVudGlhbEh0dHBFZmZlY3QgPSAoXHJcbiAgICBkaXNwYXRjaDogYW55LFxyXG4gICAgc2VxdWVudGlhbEJsb2NrczogQXJyYXk8SUh0dHBBdXRoZW50aWNhdGVkUHJvcHNCbG9jaz4pOiB2b2lkID0+IHtcclxuXHJcbiAgICAvLyBFYWNoIElIdHRwQXV0aGVudGljYXRlZFByb3BzQmxvY2sgd2lsbCBydW4gc2VxdWVudGlhbGx5XHJcbiAgICAvLyBFYWNoIElIdHRwQXV0aGVudGljYXRlZFByb3BzIGluIGVhY2ggYmxvY2sgd2lsbCBydW5uIGluIHBhcmFsbGVsXHJcbiAgICBsZXQgYmxvY2s6IElIdHRwQXV0aGVudGljYXRlZFByb3BzQmxvY2s7XHJcbiAgICBsZXQgc3VjY2VzczogYm9vbGVhbiA9IHRydWU7XHJcbiAgICBsZXQgaHR0cENhbGw6IGFueTtcclxuICAgIGxldCBsYXN0SHR0cENhbGw6IGFueTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gc2VxdWVudGlhbEJsb2Nrcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG5cclxuICAgICAgICBibG9jayA9IHNlcXVlbnRpYWxCbG9ja3NbaV07XHJcblxyXG4gICAgICAgIGlmIChibG9jayA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYmxvY2spKSB7XHJcblxyXG4gICAgICAgICAgICBodHRwQ2FsbCA9IHtcclxuICAgICAgICAgICAgICAgIGRlbGVnYXRlOiBwcm9jZXNzQmxvY2ssXHJcbiAgICAgICAgICAgICAgICBkaXNwYXRjaDogZGlzcGF0Y2gsXHJcbiAgICAgICAgICAgICAgICBibG9jazogYmxvY2ssXHJcbiAgICAgICAgICAgICAgICBpbmRleDogYCR7aX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGh0dHBDYWxsID0ge1xyXG4gICAgICAgICAgICAgICAgZGVsZWdhdGU6IHByb2Nlc3NQcm9wcyxcclxuICAgICAgICAgICAgICAgIGRpc3BhdGNoOiBkaXNwYXRjaCxcclxuICAgICAgICAgICAgICAgIGJsb2NrOiBibG9jayxcclxuICAgICAgICAgICAgICAgIGluZGV4OiBgJHtpfWBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChsYXN0SHR0cENhbGwpIHtcclxuXHJcbiAgICAgICAgICAgIGh0dHBDYWxsLm5leHRIdHRwQ2FsbCA9IGxhc3RIdHRwQ2FsbDtcclxuICAgICAgICAgICAgaHR0cENhbGwubmV4dEluZGV4ID0gbGFzdEh0dHBDYWxsLmluZGV4O1xyXG4gICAgICAgICAgICBodHRwQ2FsbC5uZXh0QmxvY2sgPSBsYXN0SHR0cENhbGwuYmxvY2s7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsYXN0SHR0cENhbGwgPSBodHRwQ2FsbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaHR0cENhbGwpIHtcclxuXHJcbiAgICAgICAgaHR0cENhbGwuZGVsZWdhdGUoXHJcbiAgICAgICAgICAgIGh0dHBDYWxsLmRpc3BhdGNoLFxyXG4gICAgICAgICAgICBodHRwQ2FsbC5ibG9jayxcclxuICAgICAgICAgICAgaHR0cENhbGwubmV4dEh0dHBDYWxsLFxyXG4gICAgICAgICAgICBodHRwQ2FsbC5pbmRleFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNvbnN0IHByb2Nlc3NCbG9jayA9IChcclxuICAgIGRpc3BhdGNoOiBhbnksXHJcbiAgICBibG9jazogSUh0dHBBdXRoZW50aWNhdGVkUHJvcHNCbG9jayxcclxuICAgIG5leHREZWxlZ2F0ZTogYW55KTogdm9pZCA9PiB7XHJcblxyXG4gICAgbGV0IHBhcmFsbGVsUHJvcHM6IEFycmF5PElIdHRwQXV0aGVudGljYXRlZFByb3BzPiA9IGJsb2NrIGFzIEFycmF5PElIdHRwQXV0aGVudGljYXRlZFByb3BzPjtcclxuICAgIGNvbnN0IGRlbGVnYXRlczogYW55W10gPSBbXTtcclxuICAgIGxldCBwcm9wczogSUh0dHBBdXRoZW50aWNhdGVkUHJvcHM7XHJcblxyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBwYXJhbGxlbFByb3BzLmxlbmd0aDsgaisrKSB7XHJcblxyXG4gICAgICAgIHByb3BzID0gcGFyYWxsZWxQcm9wc1tqXTtcclxuXHJcbiAgICAgICAgZGVsZWdhdGVzLnB1c2goXHJcbiAgICAgICAgICAgIHByb2Nlc3NQcm9wcyhcclxuICAgICAgICAgICAgICAgIGRpc3BhdGNoLFxyXG4gICAgICAgICAgICAgICAgcHJvcHMsXHJcbiAgICAgICAgICAgICAgICBuZXh0RGVsZWdhdGUsXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBQcm9taXNlXHJcbiAgICAgICAgICAgIC5hbGwoZGVsZWdhdGVzKVxyXG4gICAgICAgICAgICAudGhlbigpXHJcbiAgICAgICAgICAgIC5jYXRjaCgpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgcHJvY2Vzc1Byb3BzID0gKFxyXG4gICAgZGlzcGF0Y2g6IGFueSxcclxuICAgIHByb3BzOiBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wcyxcclxuICAgIG5leHREZWxlZ2F0ZTogYW55KTogdm9pZCA9PiB7XHJcblxyXG4gICAgaWYgKCFwcm9wcykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBvdXRwdXQ6IElIdHRwT3V0cHV0ID0ge1xyXG4gICAgICAgIG9rOiBmYWxzZSxcclxuICAgICAgICB1cmw6IHByb3BzLnVybCxcclxuICAgICAgICBhdXRoZW50aWNhdGlvbkZhaWw6IGZhbHNlLFxyXG4gICAgICAgIHBhcnNlVHlwZTogXCJ0ZXh0XCIsXHJcbiAgICB9O1xyXG5cclxuICAgIGh0dHAoXHJcbiAgICAgICAgZGlzcGF0Y2gsXHJcbiAgICAgICAgcHJvcHMsXHJcbiAgICAgICAgb3V0cHV0LFxyXG4gICAgICAgIG5leHREZWxlZ2F0ZVxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IGh0dHBFZmZlY3QgPSAoXHJcbiAgICBkaXNwYXRjaDogYW55LFxyXG4gICAgcHJvcHM6IElIdHRwQXV0aGVudGljYXRlZFByb3BzXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGlmICghcHJvcHMpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgb3V0cHV0OiBJSHR0cE91dHB1dCA9IHtcclxuICAgICAgICBvazogZmFsc2UsXHJcbiAgICAgICAgdXJsOiBwcm9wcy51cmwsXHJcbiAgICAgICAgYXV0aGVudGljYXRpb25GYWlsOiBmYWxzZSxcclxuICAgICAgICBwYXJzZVR5cGU6IHByb3BzLnBhcnNlVHlwZSA/PyAnanNvbicsXHJcbiAgICB9O1xyXG5cclxuICAgIGh0dHAoXHJcbiAgICAgICAgZGlzcGF0Y2gsXHJcbiAgICAgICAgcHJvcHMsXHJcbiAgICAgICAgb3V0cHV0XHJcbiAgICApO1xyXG59O1xyXG5cclxuY29uc3QgaHR0cCA9IChcclxuICAgIGRpc3BhdGNoOiBhbnksXHJcbiAgICBwcm9wczogSUh0dHBBdXRoZW50aWNhdGVkUHJvcHMsXHJcbiAgICBvdXRwdXQ6IElIdHRwT3V0cHV0LFxyXG4gICAgbmV4dERlbGVnYXRlOiBhbnkgPSBudWxsKTogdm9pZCA9PiB7XHJcblxyXG4gICAgZmV0Y2goXHJcbiAgICAgICAgcHJvcHMudXJsLFxyXG4gICAgICAgIHByb3BzLm9wdGlvbnMpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBvdXRwdXQub2sgPSByZXNwb25zZS5vayA9PT0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIG91dHB1dC5zdGF0dXMgPSByZXNwb25zZS5zdGF0dXM7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQudHlwZSA9IHJlc3BvbnNlLnR5cGU7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQucmVkaXJlY3RlZCA9IHJlc3BvbnNlLnJlZGlyZWN0ZWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmhlYWRlcnMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LmNhbGxJRCA9IHJlc3BvbnNlLmhlYWRlcnMuZ2V0KFwiQ2FsbElEXCIpIGFzIHN0cmluZztcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuY29udGVudFR5cGUgPSByZXNwb25zZS5oZWFkZXJzLmdldChcImNvbnRlbnQtdHlwZVwiKSBhcyBzdHJpbmc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvdXRwdXQuY29udGVudFR5cGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgb3V0cHV0LmNvbnRlbnRUeXBlLmluZGV4T2YoXCJhcHBsaWNhdGlvbi9qc29uXCIpICE9PSAtMSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnBhcnNlVHlwZSA9IFwianNvblwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LmF1dGhlbnRpY2F0aW9uRmFpbCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy5vbkF1dGhlbnRpY2F0aW9uRmFpbEFjdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0XHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0LnJlc3BvbnNlTnVsbCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZTogYW55KSB7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnRleHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIG91dHB1dC5lcnJvciArPSBgRXJyb3IgdGhyb3duIHdpdGggcmVzcG9uc2UudGV4dCgpXHJcbmA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcclxuXHJcbiAgICAgICAgICAgIG91dHB1dC50ZXh0RGF0YSA9IHJlc3VsdDtcclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHRcclxuICAgICAgICAgICAgICAgICYmIG91dHB1dC5wYXJzZVR5cGUgPT09ICdqc29uJ1xyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5qc29uRGF0YSA9IEpTT04ucGFyc2UocmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuZXJyb3IgKz0gYEVycm9yIHRocm93biBwYXJzaW5nIHJlc3BvbnNlLnRleHQoKSBhcyBqc29uXHJcbmA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghb3V0cHV0Lm9rKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhyb3cgcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkaXNwYXRjaChcclxuICAgICAgICAgICAgICAgIHByb3BzLmFjdGlvbixcclxuICAgICAgICAgICAgICAgIG91dHB1dFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgaWYgKG5leHREZWxlZ2F0ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0RGVsZWdhdGUuZGVsZWdhdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dERlbGVnYXRlLmRpc3BhdGNoLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHREZWxlZ2F0ZS5ibG9jayxcclxuICAgICAgICAgICAgICAgICAgICBuZXh0RGVsZWdhdGUubmV4dEh0dHBDYWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHREZWxlZ2F0ZS5pbmRleFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xyXG5cclxuICAgICAgICAgICAgb3V0cHV0LmVycm9yICs9IGVycm9yO1xyXG5cclxuICAgICAgICAgICAgZGlzcGF0Y2goXHJcbiAgICAgICAgICAgICAgICBwcm9wcy5lcnJvcixcclxuICAgICAgICAgICAgICAgIG91dHB1dFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgZ0h0dHAgPSAocHJvcHM6IElIdHRwQXV0aGVudGljYXRlZFByb3BzKTogSUh0dHBGZXRjaEl0ZW0gPT4ge1xyXG5cclxuICAgIHJldHVybiBbXHJcbiAgICAgICAgaHR0cEVmZmVjdCxcclxuICAgICAgICBwcm9wc1xyXG4gICAgXVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZ1NlcXVlbnRpYWxIdHRwID0gKHByb3BzQmxvY2s6IEFycmF5PElIdHRwQXV0aGVudGljYXRlZFByb3BzQmxvY2s+KTogSUh0dHBTZXF1ZW50aWFsRmV0Y2hJdGVtID0+IHtcclxuXHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIHNlcXVlbnRpYWxIdHRwRWZmZWN0LFxyXG4gICAgICAgIHByb3BzQmxvY2tcclxuICAgIF1cclxufVxyXG4iLCJcclxuY29uc3QgS2V5cyA9IHtcclxuXHJcbiAgICBzdGFydFVybDogJ3N0YXJ0VXJsJyxcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgS2V5cztcclxuXHJcbiIsImltcG9ydCB7IFBhcnNlVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL1BhcnNlVHlwZVwiO1xyXG5pbXBvcnQgSUh0dHBFZmZlY3QgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZWZmZWN0cy9JSHR0cEVmZmVjdFwiO1xyXG5pbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgSVN0YXRlQW55QXJyYXkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlQW55QXJyYXlcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIdHRwRWZmZWN0IGltcGxlbWVudHMgSUh0dHBFZmZlY3Qge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIG5hbWU6IHN0cmluZyxcclxuICAgICAgICB1cmw6IHN0cmluZyxcclxuICAgICAgICBwYXJzZVR5cGU6IFBhcnNlVHlwZSxcclxuICAgICAgICBhY3Rpb25EZWxlZ2F0ZTogKHN0YXRlOiBJU3RhdGUsIHJlc3BvbnNlOiBhbnkpID0+IElTdGF0ZUFueUFycmF5KSB7XHJcblxyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XHJcbiAgICAgICAgdGhpcy5wYXJzZVR5cGUgPSBwYXJzZVR5cGU7XHJcbiAgICAgICAgdGhpcy5hY3Rpb25EZWxlZ2F0ZSA9IGFjdGlvbkRlbGVnYXRlO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuYW1lOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgdXJsOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgcGFyc2VUeXBlOiBQYXJzZVR5cGU7XHJcbiAgICBwdWJsaWMgYWN0aW9uRGVsZWdhdGU6IChzdGF0ZTogSVN0YXRlLCByZXNwb25zZTogYW55KSA9PiBJU3RhdGVBbnlBcnJheTtcclxufVxyXG4iLCJcclxuXHJcbmNvbnN0IGdVdGlsaXRpZXMgPSB7XHJcblxyXG4gICAgcm91bmRVcFRvTmVhcmVzdFRlbjogKHZhbHVlOiBudW1iZXIpID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgZmxvb3IgPSBNYXRoLmZsb29yKHZhbHVlIC8gMTApO1xyXG5cclxuICAgICAgICByZXR1cm4gKGZsb29yICsgMSkgKiAxMDtcclxuICAgIH0sXHJcblxyXG4gICAgcm91bmREb3duVG9OZWFyZXN0VGVuOiAodmFsdWU6IG51bWJlcikgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBmbG9vciA9IE1hdGguZmxvb3IodmFsdWUgLyAxMCk7XHJcblxyXG4gICAgICAgIHJldHVybiBmbG9vciAqIDEwO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb252ZXJ0TW1Ub0ZlZXRJbmNoZXM6IChtbTogbnVtYmVyKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgaW5jaGVzID0gbW0gKiAwLjAzOTM3O1xyXG5cclxuICAgICAgICByZXR1cm4gZ1V0aWxpdGllcy5jb252ZXJ0SW5jaGVzVG9GZWV0SW5jaGVzKGluY2hlcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGluZGV4T2ZBbnk6IChcclxuICAgICAgICBpbnB1dDogc3RyaW5nLFxyXG4gICAgICAgIGNoYXJzOiBzdHJpbmdbXSxcclxuICAgICAgICBzdGFydEluZGV4ID0gMFxyXG4gICAgKTogbnVtYmVyID0+IHtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBpbnB1dC5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoYXJzLmluY2x1ZGVzKGlucHV0W2ldKSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gLTE7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldERpcmVjdG9yeTogKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgICAgICB2YXIgbWF0Y2hlcyA9IGZpbGVQYXRoLm1hdGNoKC8oLiopW1xcL1xcXFxdLyk7XHJcblxyXG4gICAgICAgIGlmIChtYXRjaGVzXHJcbiAgICAgICAgICAgICYmIG1hdGNoZXMubGVuZ3RoID4gMFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlc1sxXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgIH0sXHJcblxyXG4gICAgY291bnRDaGFyYWN0ZXI6IChcclxuICAgICAgICBpbnB1dDogc3RyaW5nLFxyXG4gICAgICAgIGNoYXJhY3Rlcjogc3RyaW5nKSA9PiB7XHJcblxyXG4gICAgICAgIGxldCBsZW5ndGggPSBpbnB1dC5sZW5ndGg7XHJcbiAgICAgICAgbGV0IGNvdW50ID0gMDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgaWYgKGlucHV0W2ldID09PSBjaGFyYWN0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjb3VudDtcclxuICAgIH0sXHJcblxyXG4gICAgY29udmVydEluY2hlc1RvRmVldEluY2hlczogKGluY2hlczogbnVtYmVyKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgZmVldCA9IE1hdGguZmxvb3IoaW5jaGVzIC8gMTIpO1xyXG4gICAgICAgIGNvbnN0IGluY2hlc1JlYW1pbmluZyA9IGluY2hlcyAlIDEyO1xyXG4gICAgICAgIGNvbnN0IGluY2hlc1JlYW1pbmluZ1JvdW5kZWQgPSBNYXRoLnJvdW5kKGluY2hlc1JlYW1pbmluZyAqIDEwKSAvIDEwOyAvLyAxIGRlY2ltYWwgcGxhY2VzXHJcblxyXG4gICAgICAgIGxldCByZXN1bHQ6IHN0cmluZyA9IFwiXCI7XHJcblxyXG4gICAgICAgIGlmIChmZWV0ID4gMCkge1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0ID0gYCR7ZmVldH0nIGA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaW5jaGVzUmVhbWluaW5nUm91bmRlZCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGAke3Jlc3VsdH0ke2luY2hlc1JlYW1pbmluZ1JvdW5kZWR9XCJgO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0sXHJcblxyXG4gICAgaXNOdWxsT3JXaGl0ZVNwYWNlOiAoaW5wdXQ6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBib29sZWFuID0+IHtcclxuXHJcbiAgICAgICAgaWYgKGlucHV0ID09PSBudWxsXHJcbiAgICAgICAgICAgIHx8IGlucHV0ID09PSB1bmRlZmluZWQpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5wdXQgPSBgJHtpbnB1dH1gO1xyXG5cclxuICAgICAgICByZXR1cm4gaW5wdXQubWF0Y2goL15cXHMqJC8pICE9PSBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGVja0FycmF5c0VxdWFsOiAoYTogc3RyaW5nW10sIGI6IHN0cmluZ1tdKTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIGlmIChhID09PSBiKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhID09PSBudWxsXHJcbiAgICAgICAgICAgIHx8IGIgPT09IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIHlvdSBkb24ndCBjYXJlIGFib3V0IHRoZSBvcmRlciBvZiB0aGUgZWxlbWVudHMgaW5zaWRlXHJcbiAgICAgICAgLy8gdGhlIGFycmF5LCB5b3Ugc2hvdWxkIHNvcnQgYm90aCBhcnJheXMgaGVyZS5cclxuICAgICAgICAvLyBQbGVhc2Ugbm90ZSB0aGF0IGNhbGxpbmcgc29ydCBvbiBhbiBhcnJheSB3aWxsIG1vZGlmeSB0aGF0IGFycmF5LlxyXG4gICAgICAgIC8vIHlvdSBtaWdodCB3YW50IHRvIGNsb25lIHlvdXIgYXJyYXkgZmlyc3QuXHJcblxyXG4gICAgICAgIGNvbnN0IHg6IHN0cmluZ1tdID0gWy4uLmFdO1xyXG4gICAgICAgIGNvbnN0IHk6IHN0cmluZ1tdID0gWy4uLmJdO1xyXG5cclxuICAgICAgICB4LnNvcnQoKTtcclxuICAgICAgICB5LnNvcnQoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoeFtpXSAhPT0geVtpXSkge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNodWZmbGUoYXJyYXk6IEFycmF5PGFueT4pOiBBcnJheTxhbnk+IHtcclxuXHJcbiAgICAgICAgbGV0IGN1cnJlbnRJbmRleCA9IGFycmF5Lmxlbmd0aDtcclxuICAgICAgICBsZXQgdGVtcG9yYXJ5VmFsdWU6IGFueVxyXG4gICAgICAgIGxldCByYW5kb21JbmRleDogbnVtYmVyO1xyXG5cclxuICAgICAgICAvLyBXaGlsZSB0aGVyZSByZW1haW4gZWxlbWVudHMgdG8gc2h1ZmZsZS4uLlxyXG4gICAgICAgIHdoaWxlICgwICE9PSBjdXJyZW50SW5kZXgpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFBpY2sgYSByZW1haW5pbmcgZWxlbWVudC4uLlxyXG4gICAgICAgICAgICByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGN1cnJlbnRJbmRleCk7XHJcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCAtPSAxO1xyXG5cclxuICAgICAgICAgICAgLy8gQW5kIHN3YXAgaXQgd2l0aCB0aGUgY3VycmVudCBlbGVtZW50LlxyXG4gICAgICAgICAgICB0ZW1wb3JhcnlWYWx1ZSA9IGFycmF5W2N1cnJlbnRJbmRleF07XHJcbiAgICAgICAgICAgIGFycmF5W2N1cnJlbnRJbmRleF0gPSBhcnJheVtyYW5kb21JbmRleF07XHJcbiAgICAgICAgICAgIGFycmF5W3JhbmRvbUluZGV4XSA9IHRlbXBvcmFyeVZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFycmF5O1xyXG4gICAgfSxcclxuXHJcbiAgICBpc051bWVyaWM6IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIGlmIChnVXRpbGl0aWVzLmlzTnVsbE9yV2hpdGVTcGFjZShpbnB1dCkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAhaXNOYU4oaW5wdXQpO1xyXG4gICAgfSxcclxuXHJcbiAgICBpc05lZ2F0aXZlTnVtZXJpYzogKGlucHV0OiBhbnkpOiBib29sZWFuID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFnVXRpbGl0aWVzLmlzTnVtZXJpYyhpbnB1dCkpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAraW5wdXQgPCAwOyAvLyArIGNvbnZlcnRzIGEgc3RyaW5nIHRvIGEgbnVtYmVyIGlmIGl0IGNvbnNpc3RzIG9ubHkgb2YgZGlnaXRzLlxyXG4gICAgfSxcclxuXHJcbiAgICBoYXNEdXBsaWNhdGVzOiA8VD4oaW5wdXQ6IEFycmF5PFQ+KTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIGlmIChuZXcgU2V0KGlucHV0KS5zaXplICE9PSBpbnB1dC5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBleHRlbmQ6IDxUPihhcnJheTE6IEFycmF5PFQ+LCBhcnJheTI6IEFycmF5PFQ+KTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGFycmF5Mi5mb3JFYWNoKChpdGVtOiBUKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBhcnJheTEucHVzaChpdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldHR5UHJpbnRKc29uRnJvbVN0cmluZzogKGlucHV0OiBzdHJpbmcgfCBudWxsKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFpbnB1dCkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ1V0aWxpdGllcy5wcmV0dHlQcmludEpzb25Gcm9tT2JqZWN0KEpTT04ucGFyc2UoaW5wdXQpKTtcclxuICAgIH0sXHJcblxyXG4gICAgcHJldHR5UHJpbnRKc29uRnJvbU9iamVjdDogKGlucHV0OiBvYmplY3QgfCBudWxsKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFpbnB1dCkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoXHJcbiAgICAgICAgICAgIGlucHV0LFxyXG4gICAgICAgICAgICBudWxsLFxyXG4gICAgICAgICAgICA0IC8vIGluZGVudGVkIDQgc3BhY2VzXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgaXNQb3NpdGl2ZU51bWVyaWM6IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIGlmICghZ1V0aWxpdGllcy5pc051bWVyaWMoaW5wdXQpKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gTnVtYmVyKGlucHV0KSA+PSAwO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRUaW1lOiAoKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgY29uc3Qgbm93OiBEYXRlID0gbmV3IERhdGUoRGF0ZS5ub3coKSk7XHJcbiAgICAgICAgY29uc3QgdGltZTogc3RyaW5nID0gYCR7bm93LmdldEZ1bGxZZWFyKCl9LSR7KG5vdy5nZXRNb250aCgpICsgMSkudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfS0ke25vdy5nZXREYXRlKCkudG9TdHJpbmcoKS5wYWRTdGFydCgyLCAnMCcpfSAke25vdy5nZXRIb3VycygpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06JHtub3cuZ2V0TWludXRlcygpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06JHtub3cuZ2V0U2Vjb25kcygpLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgJzAnKX06OiR7bm93LmdldE1pbGxpc2Vjb25kcygpLnRvU3RyaW5nKCkucGFkU3RhcnQoMywgJzAnKX06YDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRpbWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHNwbGl0QnlOZXdMaW5lOiAoaW5wdXQ6IHN0cmluZyk6IEFycmF5PHN0cmluZz4gPT4ge1xyXG5cclxuICAgICAgICBpZiAoZ1V0aWxpdGllcy5pc051bGxPcldoaXRlU3BhY2UoaW5wdXQpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByZXN1bHRzID0gaW5wdXQuc3BsaXQoL1tcXHJcXG5dKy8pO1xyXG4gICAgICAgIGNvbnN0IGNsZWFuZWQ6IEFycmF5PHN0cmluZz4gPSBbXTtcclxuXHJcbiAgICAgICAgcmVzdWx0cy5mb3JFYWNoKCh2YWx1ZTogc3RyaW5nKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWdVdGlsaXRpZXMuaXNOdWxsT3JXaGl0ZVNwYWNlKHZhbHVlKSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNsZWFuZWQucHVzaCh2YWx1ZS50cmltKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBjbGVhbmVkO1xyXG4gICAgfSxcclxuXHJcbiAgICBzcGxpdEJ5UGlwZTogKGlucHV0OiBzdHJpbmcpOiBBcnJheTxzdHJpbmc+ID0+IHtcclxuXHJcbiAgICAgICAgaWYgKGdVdGlsaXRpZXMuaXNOdWxsT3JXaGl0ZVNwYWNlKGlucHV0KSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGlucHV0LnNwbGl0KCd8Jyk7XHJcbiAgICAgICAgY29uc3QgY2xlYW5lZDogQXJyYXk8c3RyaW5nPiA9IFtdO1xyXG5cclxuICAgICAgICByZXN1bHRzLmZvckVhY2goKHZhbHVlOiBzdHJpbmcpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGlmICghZ1V0aWxpdGllcy5pc051bGxPcldoaXRlU3BhY2UodmFsdWUpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgY2xlYW5lZC5wdXNoKHZhbHVlLnRyaW0oKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGNsZWFuZWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIHNwbGl0QnlOZXdMaW5lQW5kT3JkZXI6IChpbnB1dDogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiA9PiB7XHJcblxyXG4gICAgICAgIHJldHVybiBnVXRpbGl0aWVzXHJcbiAgICAgICAgICAgIC5zcGxpdEJ5TmV3TGluZShpbnB1dClcclxuICAgICAgICAgICAgLnNvcnQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgam9pbkJ5TmV3TGluZTogKGlucHV0OiBBcnJheTxzdHJpbmc+KTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFpbnB1dFxyXG4gICAgICAgICAgICB8fCBpbnB1dC5sZW5ndGggPT09IDApIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbnB1dC5qb2luKCdcXG4nKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlQWxsQ2hpbGRyZW46IChwYXJlbnQ6IEVsZW1lbnQpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudCAhPT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKHBhcmVudC5maXJzdENoaWxkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHBhcmVudC5maXJzdENoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgaXNPZGQ6ICh4OiBudW1iZXIpOiBib29sZWFuID0+IHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHggJSAyID09PSAxO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaG9ydFByaW50VGV4dDogKFxyXG4gICAgICAgIGlucHV0OiBzdHJpbmcsXHJcbiAgICAgICAgbWF4TGVuZ3RoOiBudW1iZXIgPSAxMDApOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgICAgICBpZiAoZ1V0aWxpdGllcy5pc051bGxPcldoaXRlU3BhY2UoaW5wdXQpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBmaXJzdE5ld0xpbmVJbmRleDogbnVtYmVyID0gZ1V0aWxpdGllcy5nZXRGaXJzdE5ld0xpbmVJbmRleChpbnB1dCk7XHJcblxyXG4gICAgICAgIGlmIChmaXJzdE5ld0xpbmVJbmRleCA+IDBcclxuICAgICAgICAgICAgJiYgZmlyc3ROZXdMaW5lSW5kZXggPD0gbWF4TGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBvdXRwdXQgPSBpbnB1dC5zdWJzdHIoMCwgZmlyc3ROZXdMaW5lSW5kZXggLSAxKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnVXRpbGl0aWVzLnRyaW1BbmRBZGRFbGxpcHNpcyhvdXRwdXQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA8PSBtYXhMZW5ndGgpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG91dHB1dCA9IGlucHV0LnN1YnN0cigwLCBtYXhMZW5ndGgpO1xyXG5cclxuICAgICAgICByZXR1cm4gZ1V0aWxpdGllcy50cmltQW5kQWRkRWxsaXBzaXMob3V0cHV0KTtcclxuICAgIH0sXHJcblxyXG4gICAgdHJpbUFuZEFkZEVsbGlwc2lzOiAoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIGxldCBvdXRwdXQ6IHN0cmluZyA9IGlucHV0LnRyaW0oKTtcclxuICAgICAgICBsZXQgcHVuY3R1YXRpb25SZWdleDogUmVnRXhwID0gL1suLFxcLyMhJCVcXF4mXFwqOzp7fT1cXC1fYH4oKV0vZztcclxuICAgICAgICBsZXQgc3BhY2VSZWdleDogUmVnRXhwID0gL1xcVysvZztcclxuICAgICAgICBsZXQgbGFzdENoYXJhY3Rlcjogc3RyaW5nID0gb3V0cHV0W291dHB1dC5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgICAgbGV0IGxhc3RDaGFyYWN0ZXJJc1B1bmN0dWF0aW9uOiBib29sZWFuID1cclxuICAgICAgICAgICAgcHVuY3R1YXRpb25SZWdleC50ZXN0KGxhc3RDaGFyYWN0ZXIpXHJcbiAgICAgICAgICAgIHx8IHNwYWNlUmVnZXgudGVzdChsYXN0Q2hhcmFjdGVyKTtcclxuXHJcblxyXG4gICAgICAgIHdoaWxlIChsYXN0Q2hhcmFjdGVySXNQdW5jdHVhdGlvbiA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnN1YnN0cigwLCBvdXRwdXQubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgICAgIGxhc3RDaGFyYWN0ZXIgPSBvdXRwdXRbb3V0cHV0Lmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgICAgICAgbGFzdENoYXJhY3RlcklzUHVuY3R1YXRpb24gPVxyXG4gICAgICAgICAgICAgICAgcHVuY3R1YXRpb25SZWdleC50ZXN0KGxhc3RDaGFyYWN0ZXIpXHJcbiAgICAgICAgICAgICAgICB8fCBzcGFjZVJlZ2V4LnRlc3QobGFzdENoYXJhY3Rlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYCR7b3V0cHV0fS4uLmA7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEZpcnN0TmV3TGluZUluZGV4OiAoaW5wdXQ6IHN0cmluZyk6IG51bWJlciA9PiB7XHJcblxyXG4gICAgICAgIGxldCBjaGFyYWN0ZXI6IHN0cmluZztcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dC5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgY2hhcmFjdGVyID0gaW5wdXRbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAoY2hhcmFjdGVyID09PSAnXFxuJ1xyXG4gICAgICAgICAgICAgICAgfHwgY2hhcmFjdGVyID09PSAnXFxyJykge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gLTE7XHJcbiAgICB9LFxyXG5cclxuICAgIHVwcGVyQ2FzZUZpcnN0TGV0dGVyOiAoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIHJldHVybiBpbnB1dC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGlucHV0LnNsaWNlKDEpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZW5lcmF0ZUd1aWQ6ICh1c2VIeXBlbnM6IGJvb2xlYW4gPSBmYWxzZSk6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIGxldCBkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIGxldCBkMiA9IChwZXJmb3JtYW5jZVxyXG4gICAgICAgICAgICAmJiBwZXJmb3JtYW5jZS5ub3dcclxuICAgICAgICAgICAgJiYgKHBlcmZvcm1hbmNlLm5vdygpICogMTAwMCkpIHx8IDA7XHJcblxyXG4gICAgICAgIGxldCBwYXR0ZXJuID0gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCc7XHJcblxyXG4gICAgICAgIGlmICghdXNlSHlwZW5zKSB7XHJcbiAgICAgICAgICAgIHBhdHRlcm4gPSAneHh4eHh4eHh4eHh4NHh4eHl4eHh4eHh4eHh4eHh4eHgnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZ3VpZCA9IHBhdHRlcm5cclxuICAgICAgICAgICAgLnJlcGxhY2UoXHJcbiAgICAgICAgICAgICAgICAvW3h5XS9nLFxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHIgPSBNYXRoLnJhbmRvbSgpICogMTY7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgciA9IChkICsgcikgJSAxNiB8IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGQgPSBNYXRoLmZsb29yKGQgLyAxNik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgciA9IChkMiArIHIpICUgMTYgfCAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkMiA9IE1hdGguZmxvb3IoZDIgLyAxNik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGMgPT09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCkpLnRvU3RyaW5nKDE2KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGd1aWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGNoZWNrSWZDaHJvbWU6ICgpOiBib29sZWFuID0+IHtcclxuXHJcbiAgICAgICAgLy8gcGxlYXNlIG5vdGUsIFxyXG4gICAgICAgIC8vIHRoYXQgSUUxMSBub3cgcmV0dXJucyB1bmRlZmluZWQgYWdhaW4gZm9yIHdpbmRvdy5jaHJvbWVcclxuICAgICAgICAvLyBhbmQgbmV3IE9wZXJhIDMwIG91dHB1dHMgdHJ1ZSBmb3Igd2luZG93LmNocm9tZVxyXG4gICAgICAgIC8vIGJ1dCBuZWVkcyB0byBjaGVjayBpZiB3aW5kb3cub3ByIGlzIG5vdCB1bmRlZmluZWRcclxuICAgICAgICAvLyBhbmQgbmV3IElFIEVkZ2Ugb3V0cHV0cyB0byB0cnVlIG5vdyBmb3Igd2luZG93LmNocm9tZVxyXG4gICAgICAgIC8vIGFuZCBpZiBub3QgaU9TIENocm9tZSBjaGVja1xyXG4gICAgICAgIC8vIHNvIHVzZSB0aGUgYmVsb3cgdXBkYXRlZCBjb25kaXRpb25cclxuXHJcbiAgICAgICAgbGV0IHRzV2luZG93OiBhbnkgPSB3aW5kb3cgYXMgYW55O1xyXG4gICAgICAgIGxldCBpc0Nocm9taXVtID0gdHNXaW5kb3cuY2hyb21lO1xyXG4gICAgICAgIGxldCB3aW5OYXYgPSB3aW5kb3cubmF2aWdhdG9yO1xyXG4gICAgICAgIGxldCB2ZW5kb3JOYW1lID0gd2luTmF2LnZlbmRvcjtcclxuICAgICAgICBsZXQgaXNPcGVyYSA9IHR5cGVvZiB0c1dpbmRvdy5vcHIgIT09IFwidW5kZWZpbmVkXCI7XHJcbiAgICAgICAgbGV0IGlzSUVlZGdlID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKFwiRWRnZVwiKSA+IC0xO1xyXG4gICAgICAgIGxldCBpc0lPU0Nocm9tZSA9IHdpbk5hdi51c2VyQWdlbnQubWF0Y2goXCJDcmlPU1wiKTtcclxuXHJcbiAgICAgICAgaWYgKGlzSU9TQ2hyb21lKSB7XHJcbiAgICAgICAgICAgIC8vIGlzIEdvb2dsZSBDaHJvbWUgb24gSU9TXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChpc0Nocm9taXVtICE9PSBudWxsXHJcbiAgICAgICAgICAgICYmIHR5cGVvZiBpc0Nocm9taXVtICE9PSBcInVuZGVmaW5lZFwiXHJcbiAgICAgICAgICAgICYmIHZlbmRvck5hbWUgPT09IFwiR29vZ2xlIEluYy5cIlxyXG4gICAgICAgICAgICAmJiBpc09wZXJhID09PSBmYWxzZVxyXG4gICAgICAgICAgICAmJiBpc0lFZWRnZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgLy8gaXMgR29vZ2xlIENocm9tZVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdVdGlsaXRpZXM7IiwiaW1wb3J0IElIaXN0b3J5VXJsIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2hpc3RvcnkvSUhpc3RvcnlVcmxcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIaXN0b3J5VXJsIGltcGxlbWVudHMgSUhpc3RvcnlVcmwge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHVybDogc3RyaW5nKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVybDogc3RyaW5nO1xyXG59XHJcbiIsImltcG9ydCBJUmVuZGVyU25hcFNob3QgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvaGlzdG9yeS9JUmVuZGVyU25hcFNob3RcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZW5kZXJTbmFwU2hvdCBpbXBsZW1lbnRzIElSZW5kZXJTbmFwU2hvdCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IodXJsOiBzdHJpbmcpIHtcclxuXHJcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHVybDogc3RyaW5nO1xyXG4gICAgcHVibGljIGd1aWQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIGNyZWF0ZWQ6IERhdGUgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBtb2RpZmllZDogRGF0ZSB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIGV4cGFuZGVkT3B0aW9uSURzOiBBcnJheTxzdHJpbmc+ID0gW107XHJcbiAgICBwdWJsaWMgZXhwYW5kZWRBbmNpbGxhcnlJRHM6IEFycmF5PHN0cmluZz4gPSBbXTtcclxufVxyXG4iLCJpbXBvcnQgSVVybEFzc2VtYmxlciBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9oaXN0b3J5L0lVcmxBc3NlbWJsZXJcIjtcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBIaXN0b3J5VXJsIGZyb20gXCIuLi8uLi9zdGF0ZS9oaXN0b3J5L0hpc3RvcnlVcmxcIjtcclxuaW1wb3J0IFJlbmRlclNuYXBTaG90IGZyb20gXCIuLi8uLi9zdGF0ZS9oaXN0b3J5L1JlbmRlclNuYXBTaG90XCI7XHJcbmltcG9ydCBVIGZyb20gXCIuLi9nVXRpbGl0aWVzXCI7XHJcblxyXG5cclxuY29uc3QgYnVpbGRVcmxGcm9tUm9vdCA9IChyb290OiBJUmVuZGVyRnJhZ21lbnQpOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgIGNvbnN0IHVybEFzc2VtYmxlcjogSVVybEFzc2VtYmxlciA9IHtcclxuXHJcbiAgICAgICAgdXJsOiBgJHtsb2NhdGlvbi5vcmlnaW59JHtsb2NhdGlvbi5wYXRobmFtZX0/YFxyXG4gICAgfVxyXG5cclxuICAgIGlmICghcm9vdC5zZWxlY3RlZCkge1xyXG5cclxuICAgICAgICByZXR1cm4gdXJsQXNzZW1ibGVyLnVybDtcclxuICAgIH1cclxuXHJcbiAgICBwcmludFNlZ21lbnRFbmQoXHJcbiAgICAgICAgdXJsQXNzZW1ibGVyLFxyXG4gICAgICAgIHJvb3RcclxuICAgIClcclxuXHJcbiAgICByZXR1cm4gdXJsQXNzZW1ibGVyLnVybDtcclxufTtcclxuXHJcbmNvbnN0IHByaW50U2VnbWVudEVuZCA9IChcclxuICAgIHVybEFzc2VtYmxlcjogSVVybEFzc2VtYmxlcixcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsIHwgdW5kZWZpbmVkXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGlmICghZnJhZ21lbnQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGZyYWdtZW50Lmxpbms/LnJvb3QpIHtcclxuXHJcbiAgICAgICAgbGV0IHVybCA9IHVybEFzc2VtYmxlci51cmw7XHJcbiAgICAgICAgdXJsID0gYCR7dXJsfX4ke2ZyYWdtZW50LmlkfWA7XHJcbiAgICAgICAgdXJsQXNzZW1ibGVyLnVybCA9IHVybDtcclxuXHJcbiAgICAgICAgcHJpbnRTZWdtZW50RW5kKFxyXG4gICAgICAgICAgICB1cmxBc3NlbWJsZXIsXHJcbiAgICAgICAgICAgIGZyYWdtZW50Lmxpbmsucm9vdCxcclxuICAgICAgICApXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICghVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnQuZXhpdEtleSkpIHtcclxuXHJcbiAgICAgICAgbGV0IHVybCA9IHVybEFzc2VtYmxlci51cmw7XHJcbiAgICAgICAgdXJsID0gYCR7dXJsfV8ke2ZyYWdtZW50LmlkfWA7XHJcbiAgICAgICAgdXJsQXNzZW1ibGVyLnVybCA9IHVybDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCFmcmFnbWVudC5saW5rXHJcbiAgICAgICAgJiYgIWZyYWdtZW50LnNlbGVjdGVkXHJcbiAgICApIHtcclxuICAgICAgICBsZXQgdXJsID0gdXJsQXNzZW1ibGVyLnVybDtcclxuICAgICAgICB1cmwgPSBgJHt1cmx9LSR7ZnJhZ21lbnQuaWR9YDtcclxuICAgICAgICB1cmxBc3NlbWJsZXIudXJsID0gdXJsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaW50U2VnbWVudEVuZChcclxuICAgICAgICB1cmxBc3NlbWJsZXIsXHJcbiAgICAgICAgZnJhZ21lbnQuc2VsZWN0ZWQsXHJcbiAgICApXHJcbn07XHJcblxyXG5cclxuY29uc3QgZ0hpc3RvcnlDb2RlID0ge1xyXG5cclxuICAgIHJlc2V0UmF3OiAoKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIHdpbmRvdy5UcmVlU29sdmUuc2NyZWVuLmF1dG9mb2N1cyA9IHRydWU7XHJcbiAgICAgICAgd2luZG93LlRyZWVTb2x2ZS5zY3JlZW4uaXNBdXRvZm9jdXNGaXJzdFJ1biA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIHB1c2hCcm93c2VySGlzdG9yeVN0YXRlOiAoc3RhdGU6IElTdGF0ZSk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoc3RhdGUucmVuZGVyU3RhdGUuaXNDaGFpbkxvYWQgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUucmVmcmVzaFVybCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlLnJlbmRlclN0YXRlLmN1cnJlbnRTZWN0aW9uPy5jdXJyZW50XHJcbiAgICAgICAgICAgIHx8ICFzdGF0ZS5yZW5kZXJTdGF0ZS5kaXNwbGF5R3VpZGU/LnJvb3RcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ0hpc3RvcnlDb2RlLnJlc2V0UmF3KCk7XHJcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb247XHJcbiAgICAgICAgbGV0IGxhc3RVcmw6IHN0cmluZztcclxuXHJcbiAgICAgICAgaWYgKHdpbmRvdy5oaXN0b3J5LnN0YXRlKSB7XHJcblxyXG4gICAgICAgICAgICBsYXN0VXJsID0gd2luZG93Lmhpc3Rvcnkuc3RhdGUudXJsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbGFzdFVybCA9IGAke2xvY2F0aW9uLm9yaWdpbn0ke2xvY2F0aW9uLnBhdGhuYW1lfSR7bG9jYXRpb24uc2VhcmNofWA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB1cmwgPSBidWlsZFVybEZyb21Sb290KHN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZS5yb290KTtcclxuXHJcbiAgICAgICAgaWYgKGxhc3RVcmxcclxuICAgICAgICAgICAgJiYgdXJsID09PSBsYXN0VXJsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGhpc3RvcnkucHVzaFN0YXRlKFxyXG4gICAgICAgICAgICBuZXcgUmVuZGVyU25hcFNob3QodXJsKSxcclxuICAgICAgICAgICAgXCJcIixcclxuICAgICAgICAgICAgdXJsXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc3RhdGUuc3RlcEhpc3RvcnkuaGlzdG9yeUNoYWluLnB1c2gobmV3IEhpc3RvcnlVcmwodXJsKSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnSGlzdG9yeUNvZGU7XHJcblxyXG4iLCJpbXBvcnQgeyBQYXJzZVR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9QYXJzZVR5cGVcIjtcclxuaW1wb3J0IElBY3Rpb24gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSUFjdGlvblwiO1xyXG5pbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgSVN0YXRlQW55QXJyYXkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlQW55QXJyYXlcIjtcclxuaW1wb3J0IElIdHRwRWZmZWN0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2VmZmVjdHMvSUh0dHBFZmZlY3RcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZU5vZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lTm9kZVwiO1xyXG5pbXBvcnQgSHR0cEVmZmVjdCBmcm9tIFwiLi4vLi4vc3RhdGUvZWZmZWN0cy9IdHRwRWZmZWN0XCI7XHJcbmltcG9ydCBVIGZyb20gXCIuLi9nVXRpbGl0aWVzXCI7XHJcbmltcG9ydCBnSGlzdG9yeUNvZGUgZnJvbSBcIi4vZ0hpc3RvcnlDb2RlXCI7XHJcblxyXG5sZXQgY291bnQgPSAwO1xyXG5cclxuY29uc3QgZ1N0YXRlQ29kZSA9IHtcclxuXHJcbiAgICBzZXREaXJ0eTogKHN0YXRlOiBJU3RhdGUpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUudWkucmF3ID0gZmFsc2U7XHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUuaXNDaGFpbkxvYWQgPSBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RnJlc2hLZXlJbnQ6IChzdGF0ZTogSVN0YXRlKTogbnVtYmVyID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgbmV4dEtleSA9ICsrc3RhdGUubmV4dEtleTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5leHRLZXk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEZyZXNoS2V5OiAoc3RhdGU6IElTdGF0ZSk6IHN0cmluZyA9PiB7XHJcblxyXG4gICAgICAgIHJldHVybiBgJHtnU3RhdGVDb2RlLmdldEZyZXNoS2V5SW50KHN0YXRlKX1gO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRHdWlkS2V5OiAoKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgcmV0dXJuIFUuZ2VuZXJhdGVHdWlkKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsb25lU3RhdGU6IChzdGF0ZTogSVN0YXRlKTogSVN0YXRlID0+IHtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlLnJlbmRlclN0YXRlLnJlZnJlc2hVcmwgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGdIaXN0b3J5Q29kZS5wdXNoQnJvd3Nlckhpc3RvcnlTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbmV3U3RhdGU6IElTdGF0ZSA9IHsgLi4uc3RhdGUgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ld1N0YXRlO1xyXG4gICAgfSxcclxuXHJcbiAgICBBZGRSZUxvYWREYXRhRWZmZWN0SW1tZWRpYXRlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBuYW1lOiBzdHJpbmcsXHJcbiAgICAgICAgcGFyc2VUeXBlOiBQYXJzZVR5cGUsXHJcbiAgICAgICAgdXJsOiBzdHJpbmcsXHJcbiAgICAgICAgYWN0aW9uRGVsZWdhdGU6IChzdGF0ZTogSVN0YXRlLCByZXNwb25zZTogYW55KSA9PiBJU3RhdGVBbnlBcnJheVxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKG5hbWUpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVybCk7XHJcblxyXG4gICAgICAgIGlmIChjb3VudCA+IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHVybC5lbmRzV2l0aCgnaW15bzZDMDhILmh0bWwnKSkge1xyXG4gICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZWZmZWN0OiBJSHR0cEVmZmVjdCB8IHVuZGVmaW5lZCA9IHN0YXRlXHJcbiAgICAgICAgICAgIC5yZXBlYXRFZmZlY3RzXHJcbiAgICAgICAgICAgIC5yZUxvYWRHZXRIdHRwSW1tZWRpYXRlXHJcbiAgICAgICAgICAgIC5maW5kKChlZmZlY3Q6IElIdHRwRWZmZWN0KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVmZmVjdC5uYW1lID09PSBuYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgJiYgZWZmZWN0LnVybCA9PT0gdXJsO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKGVmZmVjdCkgeyAvLyBhbHJlYWR5IGFkZGVkLlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBodHRwRWZmZWN0OiBJSHR0cEVmZmVjdCA9IG5ldyBIdHRwRWZmZWN0KFxyXG4gICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgIHBhcnNlVHlwZSxcclxuICAgICAgICAgICAgYWN0aW9uRGVsZWdhdGVcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzdGF0ZS5yZXBlYXRFZmZlY3RzLnJlTG9hZEdldEh0dHBJbW1lZGlhdGUucHVzaChodHRwRWZmZWN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgQWRkUnVuQWN0aW9uSW1tZWRpYXRlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBhY3Rpb25EZWxlZ2F0ZTogSUFjdGlvbik6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBzdGF0ZS5yZXBlYXRFZmZlY3RzLnJ1bkFjdGlvbkltbWVkaWF0ZS5wdXNoKGFjdGlvbkRlbGVnYXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0Q2FjaGVkX291dGxpbmVOb2RlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBsaW5rSUQ6IG51bWJlcixcclxuICAgICAgICBmcmFnbWVudElEOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkXHJcbiAgICApOiBJUmVuZGVyT3V0bGluZU5vZGUgfCBudWxsID0+IHtcclxuXHJcbiAgICAgICAgaWYgKFUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50SUQpKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGtleSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVLZXkoXHJcbiAgICAgICAgICAgIGxpbmtJRCxcclxuICAgICAgICAgICAgZnJhZ21lbnRJRCBhcyBzdHJpbmdcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCBvdXRsaW5lTm9kZSA9IHN0YXRlLnJlbmRlclN0YXRlLmluZGV4X291dGxpbmVOb2Rlc19pZFtrZXldID8/IG51bGw7XHJcblxyXG4gICAgICAgIGlmICghb3V0bGluZU5vZGUpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiT3V0bGluZU5vZGUgd2FzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3V0bGluZU5vZGU7XHJcbiAgICB9LFxyXG5cclxuICAgIGNhY2hlX291dGxpbmVOb2RlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBsaW5rSUQ6IG51bWJlcixcclxuICAgICAgICBvdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlIHwgbnVsbFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghb3V0bGluZU5vZGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qga2V5ID0gZ1N0YXRlQ29kZS5nZXRDYWNoZUtleShcclxuICAgICAgICAgICAgbGlua0lELFxyXG4gICAgICAgICAgICBvdXRsaW5lTm9kZS5pXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlLnJlbmRlclN0YXRlLmluZGV4X291dGxpbmVOb2Rlc19pZFtrZXldKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLmluZGV4X291dGxpbmVOb2Rlc19pZFtrZXldID0gb3V0bGluZU5vZGU7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldENhY2hlZF9jaGFpbkZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBsaW5rSUQ6IG51bWJlcixcclxuICAgICAgICBmcmFnbWVudElEOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkXHJcbiAgICApOiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0+IHtcclxuXHJcbiAgICAgICAgaWYgKFUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50SUQpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGtleSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVLZXkoXHJcbiAgICAgICAgICAgIGxpbmtJRCxcclxuICAgICAgICAgICAgZnJhZ21lbnRJRCBhcyBzdHJpbmdcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gc3RhdGUucmVuZGVyU3RhdGUuaW5kZXhfY2hhaW5GcmFnbWVudHNfaWRba2V5XSA/PyBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICBjYWNoZV9jaGFpbkZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByZW5kZXJGcmFnbWVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghcmVuZGVyRnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qga2V5ID0gZ1N0YXRlQ29kZS5nZXRDYWNoZUtleUZyb21GcmFnbWVudChyZW5kZXJGcmFnbWVudCk7XHJcblxyXG4gICAgICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShrZXkpID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZS5yZW5kZXJTdGF0ZS5pbmRleF9jaGFpbkZyYWdtZW50c19pZFtrZXkgYXMgc3RyaW5nXSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5pbmRleF9jaGFpbkZyYWdtZW50c19pZFtrZXkgYXMgc3RyaW5nXSA9IHJlbmRlckZyYWdtZW50O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRDYWNoZUtleUZyb21GcmFnbWVudDogKHJlbmRlckZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQpOiBzdHJpbmcgfCBudWxsID0+IHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuZ2V0Q2FjaGVLZXkoXHJcbiAgICAgICAgICAgIHJlbmRlckZyYWdtZW50LnNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgICAgICByZW5kZXJGcmFnbWVudC5pZFxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldENhY2hlS2V5OiAoXHJcblxyXG4gICAgICAgIGxpbmtJRDogbnVtYmVyLFxyXG4gICAgICAgIGZyYWdtZW50SUQ6IHN0cmluZ1xyXG4gICAgKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGAke2xpbmtJRH1fJHtmcmFnbWVudElEfWA7XHJcbiAgICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ1N0YXRlQ29kZTtcclxuXHJcbiIsImltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcblxyXG5cclxuY29uc3QgZ0F1dGhlbnRpY2F0aW9uQ29kZSA9IHtcclxuXHJcbiAgICBjbGVhckF1dGhlbnRpY2F0aW9uOiAoc3RhdGU6IElTdGF0ZSk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBzdGF0ZS51c2VyLmF1dGhvcmlzZWQgPSBmYWxzZTtcclxuICAgICAgICBzdGF0ZS51c2VyLm5hbWUgPSBcIlwiO1xyXG4gICAgICAgIHN0YXRlLnVzZXIuc3ViID0gXCJcIjtcclxuICAgICAgICBzdGF0ZS51c2VyLmxvZ291dFVybCA9IFwiXCI7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnQXV0aGVudGljYXRpb25Db2RlO1xyXG4iLCJcclxuZXhwb3J0IGVudW0gQWN0aW9uVHlwZSB7XHJcblxyXG4gICAgTm9uZSA9ICdub25lJyxcclxuICAgIEZpbHRlclRvcGljcyA9ICdmaWx0ZXJUb3BpY3MnLFxyXG4gICAgR2V0VG9waWMgPSAnZ2V0VG9waWMnLFxyXG4gICAgR2V0VG9waWNBbmRSb290ID0gJ2dldFRvcGljQW5kUm9vdCcsXHJcbiAgICBTYXZlQXJ0aWNsZVNjZW5lID0gJ3NhdmVBcnRpY2xlU2NlbmUnLFxyXG4gICAgR2V0Um9vdCA9ICdnZXRSb290JyxcclxuICAgIEdldFN0ZXAgPSAnZ2V0U3RlcCcsXHJcbiAgICBHZXRQYWdlID0gJ2dldFBhZ2UnLFxyXG4gICAgR2V0Q2hhaW4gPSAnZ2V0Q2hhaW4nLFxyXG4gICAgR2V0T3V0bGluZSA9ICdnZXRPdXRsaW5lJyxcclxuICAgIEdldEZyYWdtZW50ID0gJ2dldEZyYWdtZW50JyxcclxuICAgIEdldENoYWluRnJhZ21lbnQgPSAnZ2V0Q2hhaW5GcmFnbWVudCdcclxufVxyXG5cclxuIiwiaW1wb3J0IHsgQWN0aW9uVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL0FjdGlvblR5cGVcIjtcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuXHJcblxyXG5jb25zdCBnQWpheEhlYWRlckNvZGUgPSB7XHJcblxyXG4gICAgYnVpbGRIZWFkZXJzOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBjYWxsSUQ6IHN0cmluZyxcclxuICAgICAgICBhY3Rpb246IEFjdGlvblR5cGUpOiBIZWFkZXJzID0+IHtcclxuXHJcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xyXG4gICAgICAgIGhlYWRlcnMuYXBwZW5kKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xyXG4gICAgICAgIGhlYWRlcnMuYXBwZW5kKCdYLUNTUkYnLCAnMScpO1xyXG4gICAgICAgIGhlYWRlcnMuYXBwZW5kKCdTdWJzY3JpcHRpb25JRCcsIHN0YXRlLnNldHRpbmdzLnN1YnNjcmlwdGlvbklEKTtcclxuICAgICAgICBoZWFkZXJzLmFwcGVuZCgnQ2FsbElEJywgY2FsbElEKTtcclxuICAgICAgICBoZWFkZXJzLmFwcGVuZCgnQWN0aW9uJywgYWN0aW9uKTtcclxuXHJcbiAgICAgICAgaGVhZGVycy5hcHBlbmQoJ3dpdGhDcmVkZW50aWFscycsICd0cnVlJyk7XHJcblxyXG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ0FqYXhIZWFkZXJDb2RlO1xyXG5cclxuIiwiaW1wb3J0IHsgZ0F1dGhlbnRpY2F0ZWRIdHRwIH0gZnJvbSBcIi4vZ0F1dGhlbnRpY2F0aW9uSHR0cFwiO1xyXG5cclxuaW1wb3J0IHsgQWN0aW9uVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL0FjdGlvblR5cGVcIjtcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IGdBamF4SGVhZGVyQ29kZSBmcm9tIFwiLi9nQWpheEhlYWRlckNvZGVcIjtcclxuaW1wb3J0IGdBdXRoZW50aWNhdGlvbkFjdGlvbnMgZnJvbSBcIi4vZ0F1dGhlbnRpY2F0aW9uQWN0aW9uc1wiO1xyXG5pbXBvcnQgVSBmcm9tIFwiLi4vZ1V0aWxpdGllc1wiO1xyXG5pbXBvcnQgeyBJSHR0cEZldGNoSXRlbSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2h0dHAvSUh0dHBGZXRjaEl0ZW1cIjtcclxuaW1wb3J0IGdTdGF0ZUNvZGUgZnJvbSBcIi4uL2NvZGUvZ1N0YXRlQ29kZVwiO1xyXG5cclxuXHJcbmNvbnN0IGdBdXRoZW50aWNhdGlvbkVmZmVjdHMgPSB7XHJcblxyXG4gICAgY2hlY2tVc2VyQXV0aGVudGljYXRlZDogKHN0YXRlOiBJU3RhdGUpOiBJSHR0cEZldGNoSXRlbSB8IHVuZGVmaW5lZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2FsbElEOiBzdHJpbmcgPSBVLmdlbmVyYXRlR3VpZCgpO1xyXG5cclxuICAgICAgICBsZXQgaGVhZGVycyA9IGdBamF4SGVhZGVyQ29kZS5idWlsZEhlYWRlcnMoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBjYWxsSUQsXHJcbiAgICAgICAgICAgIEFjdGlvblR5cGUuTm9uZVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHVybDogc3RyaW5nID0gYCR7c3RhdGUuc2V0dGluZ3MuYmZmVXJsfS8ke3N0YXRlLnNldHRpbmdzLnVzZXJQYXRofT9zbGlkZT1mYWxzZWA7XHJcblxyXG4gICAgICAgIHJldHVybiBnQXV0aGVudGljYXRlZEh0dHAoe1xyXG4gICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXNwb25zZTogJ2pzb24nLFxyXG4gICAgICAgICAgICBhY3Rpb246IGdBdXRoZW50aWNhdGlvbkFjdGlvbnMubG9hZFN1Y2Nlc3NmdWxBdXRoZW50aWNhdGlvbixcclxuICAgICAgICAgICAgZXJyb3I6IChzdGF0ZTogSVN0YXRlLCBlcnJvckRldGFpbHM6IGFueSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJtZXNzYWdlXCI6IFwiRXJyb3IgdHJ5aW5nIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBzZXJ2ZXJcIixcclxuICAgICAgICAgICAgICAgICAgICBcInVybFwiOiAke3VybH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlcnJvciBEZXRhaWxzXCI6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3JEZXRhaWxzKX0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzdGFja1wiOiAke0pTT04uc3RyaW5naWZ5KGVycm9yRGV0YWlscy5zdGFjayl9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwibWV0aG9kXCI6ICR7Z0F1dGhlbnRpY2F0aW9uRWZmZWN0cy5jaGVja1VzZXJBdXRoZW50aWNhdGVkLm5hbWV9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwiY2FsbElEOiAke2NhbGxJRH1cclxuICAgICAgICAgICAgICAgIH1gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhbGVydChge1xyXG4gICAgICAgICAgICAgICAgICAgIFwibWVzc2FnZVwiOiBcIkVycm9yIHRyeWluZyB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgc2VydmVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ1cmxcIjogJHt1cmx9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZXJyb3IgRGV0YWlsc1wiOiAke0pTT04uc3RyaW5naWZ5KGVycm9yRGV0YWlscyl9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwic3RhY2tcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMuc3RhY2spfSxcclxuICAgICAgICAgICAgICAgICAgICBcIm1ldGhvZFwiOiBnQXV0aGVudGljYXRpb25FZmZlY3RzLmNoZWNrVXNlckF1dGhlbnRpY2F0ZWQubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBcImNhbGxJRDogJHtjYWxsSUR9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwic3RhdGVcIjogJHtKU09OLnN0cmluZ2lmeShzdGF0ZSl9XHJcbiAgICAgICAgICAgICAgICB9YCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdBdXRoZW50aWNhdGlvbkVmZmVjdHM7XHJcbiIsImltcG9ydCB7IElIdHRwRmV0Y2hJdGVtIH0gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvaHR0cC9JSHR0cEZldGNoSXRlbVwiO1xyXG5pbXBvcnQgS2V5cyBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9jb25zdGFudHMvS2V5c1wiO1xyXG5pbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgSVN0YXRlQW55QXJyYXkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlQW55QXJyYXlcIjtcclxuaW1wb3J0IGdTdGF0ZUNvZGUgZnJvbSBcIi4uL2NvZGUvZ1N0YXRlQ29kZVwiO1xyXG5pbXBvcnQgZ0F1dGhlbnRpY2F0aW9uQ29kZSBmcm9tIFwiLi9nQXV0aGVudGljYXRpb25Db2RlXCI7XHJcbmltcG9ydCBnQXV0aGVudGljYXRpb25FZmZlY3RzIGZyb20gXCIuL2dBdXRoZW50aWNhdGlvbkVmZmVjdHNcIjtcclxuXHJcblxyXG5jb25zdCBnQXV0aGVudGljYXRpb25BY3Rpb25zID0ge1xyXG5cclxuICAgIGxvYWRTdWNjZXNzZnVsQXV0aGVudGljYXRpb246IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHJlc3BvbnNlOiBhbnkpOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGVcclxuICAgICAgICAgICAgfHwgIXJlc3BvbnNlXHJcbiAgICAgICAgICAgIHx8IHJlc3BvbnNlLnBhcnNlVHlwZSAhPT0gXCJqc29uXCJcclxuICAgICAgICAgICAgfHwgIXJlc3BvbnNlLmpzb25EYXRhKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjbGFpbXM6IGFueSA9IHJlc3BvbnNlLmpzb25EYXRhO1xyXG5cclxuICAgICAgICBjb25zdCBuYW1lOiBhbnkgPSBjbGFpbXMuZmluZChcclxuICAgICAgICAgICAgKGNsYWltOiBhbnkpID0+IGNsYWltLnR5cGUgPT09ICduYW1lJ1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IHN1YjogYW55ID0gY2xhaW1zLmZpbmQoXHJcbiAgICAgICAgICAgIChjbGFpbTogYW55KSA9PiBjbGFpbS50eXBlID09PSAnc3ViJ1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghbmFtZVxyXG4gICAgICAgICAgICAmJiAhc3ViKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBsb2dvdXRVcmxDbGFpbTogYW55ID0gY2xhaW1zLmZpbmQoXHJcbiAgICAgICAgICAgIChjbGFpbTogYW55KSA9PiBjbGFpbS50eXBlID09PSAnYmZmOmxvZ291dF91cmwnXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCFsb2dvdXRVcmxDbGFpbVxyXG4gICAgICAgICAgICB8fCAhbG9nb3V0VXJsQ2xhaW0udmFsdWUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRlLnVzZXIuYXV0aG9yaXNlZCA9IHRydWU7XHJcbiAgICAgICAgc3RhdGUudXNlci5uYW1lID0gbmFtZS52YWx1ZTtcclxuICAgICAgICBzdGF0ZS51c2VyLnN1YiA9IHN1Yi52YWx1ZTtcclxuICAgICAgICBzdGF0ZS51c2VyLmxvZ291dFVybCA9IGxvZ291dFVybENsYWltLnZhbHVlO1xyXG5cclxuICAgICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2hlY2tVc2VyTG9nZ2VkSW46IChzdGF0ZTogSVN0YXRlKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBwcm9wczogSUh0dHBGZXRjaEl0ZW0gfCB1bmRlZmluZWQgPSBnQXV0aGVudGljYXRpb25BY3Rpb25zLmNoZWNrVXNlckxvZ2dlZEluUHJvcHMoc3RhdGUpO1xyXG5cclxuICAgICAgICBpZiAoIXByb3BzKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcHJvcHNcclxuICAgICAgICBdO1xyXG4gICAgfSxcclxuXHJcbiAgICBjaGVja1VzZXJMb2dnZWRJblByb3BzOiAoc3RhdGU6IElTdGF0ZSk6IElIdHRwRmV0Y2hJdGVtIHwgdW5kZWZpbmVkID0+IHtcclxuXHJcbiAgICAgICAgc3RhdGUudXNlci5yYXcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdBdXRoZW50aWNhdGlvbkVmZmVjdHMuY2hlY2tVc2VyQXV0aGVudGljYXRlZChzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvZ2luOiAoc3RhdGU6IElTdGF0ZSk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgY3VycmVudFVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG5cclxuICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFxyXG4gICAgICAgICAgICBLZXlzLnN0YXJ0VXJsLFxyXG4gICAgICAgICAgICBjdXJyZW50VXJsXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3QgdXJsOiBzdHJpbmcgPSBgJHtzdGF0ZS5zZXR0aW5ncy5iZmZVcmx9LyR7c3RhdGUuc2V0dGluZ3MuZGVmYXVsdExvZ2luUGF0aH0/cmV0dXJuVXJsPS9gO1xyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24odXJsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhckF1dGhlbnRpY2F0aW9uOiAoc3RhdGU6IElTdGF0ZSk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuICAgICAgICBnQXV0aGVudGljYXRpb25Db2RlLmNsZWFyQXV0aGVudGljYXRpb24oc3RhdGUpO1xyXG5cclxuICAgICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJBdXRoZW50aWNhdGlvbkFuZFNob3dMb2dpbjogKHN0YXRlOiBJU3RhdGUpOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGdBdXRoZW50aWNhdGlvbkNvZGUuY2xlYXJBdXRoZW50aWNhdGlvbihzdGF0ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBnQXV0aGVudGljYXRpb25BY3Rpb25zLmxvZ2luKHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9nb3V0OiAoc3RhdGU6IElTdGF0ZSk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmFzc2lnbihzdGF0ZS51c2VyLmxvZ291dFVybCk7XHJcblxyXG4gICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdBdXRoZW50aWNhdGlvbkFjdGlvbnM7XHJcbiIsImltcG9ydCB7IGdIdHRwIH0gZnJvbSBcIi4vZ0h0dHBcIjtcclxuXHJcbmltcG9ydCBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wcyBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9odHRwL0lIdHRwQXV0aGVudGljYXRlZFByb3BzXCI7XHJcbmltcG9ydCBJSHR0cFByb3BzIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2h0dHAvSUh0dHBQcm9wc1wiO1xyXG5pbXBvcnQgZ0F1dGhlbnRpY2F0aW9uQWN0aW9ucyBmcm9tIFwiLi9nQXV0aGVudGljYXRpb25BY3Rpb25zXCI7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdBdXRoZW50aWNhdGVkSHR0cChwcm9wczogSUh0dHBQcm9wcyk6IGFueSB7XHJcblxyXG4gICAgY29uc3QgaHR0cEF1dGhlbnRpY2F0ZWRQcm9wZXJ0aWVzOiBJSHR0cEF1dGhlbnRpY2F0ZWRQcm9wcyA9IHByb3BzIGFzIElIdHRwQXV0aGVudGljYXRlZFByb3BzO1xyXG5cclxuICAgIC8vIC8vIFRvIHJlZ2lzdGVyIGZhaWxlZCBhdXRoZW50aWNhdGlvblxyXG4gICAgLy8gaHR0cEF1dGhlbnRpY2F0ZWRQcm9wZXJ0aWVzLm9uQXV0aGVudGljYXRpb25GYWlsQWN0aW9uID0gZ0F1dGhlbnRpY2F0aW9uQWN0aW9ucy5jbGVhckF1dGhlbnRpY2F0aW9uO1xyXG5cclxuICAgIC8vIFRvIHJlZ2lzdGVyIGZhaWxlZCBhdXRoZW50aWNhdGlvbiBhbmQgc2hvdyBsb2dpbiBwYWdlXHJcbiAgICBodHRwQXV0aGVudGljYXRlZFByb3BlcnRpZXMub25BdXRoZW50aWNhdGlvbkZhaWxBY3Rpb24gPSBnQXV0aGVudGljYXRpb25BY3Rpb25zLmNsZWFyQXV0aGVudGljYXRpb25BbmRTaG93TG9naW47XHJcblxyXG4gICAgcmV0dXJuIGdIdHRwKGh0dHBBdXRoZW50aWNhdGVkUHJvcGVydGllcyk7XHJcbn1cclxuIiwiXHJcbmltcG9ydCB7IGdBdXRoZW50aWNhdGVkSHR0cCB9IGZyb20gXCIuLi9odHRwL2dBdXRoZW50aWNhdGlvbkh0dHBcIjtcclxuXHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBJU3RhdGVBbnlBcnJheSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVBbnlBcnJheVwiO1xyXG5pbXBvcnQgSUh0dHBFZmZlY3QgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZWZmZWN0cy9JSHR0cEVmZmVjdFwiO1xyXG5pbXBvcnQgZ1N0YXRlQ29kZSBmcm9tIFwiLi4vY29kZS9nU3RhdGVDb2RlXCI7XHJcbmltcG9ydCBVIGZyb20gXCIuLi9nVXRpbGl0aWVzXCI7XHJcbmltcG9ydCBJQWN0aW9uIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lBY3Rpb25cIjtcclxuXHJcbmNvbnN0IHJ1bkFjdGlvbklubmVyID0gKFxyXG4gICAgZGlzcGF0Y2g6IGFueSxcclxuICAgIHByb3BzOiBhbnkpOiB2b2lkID0+IHtcclxuXHJcbiAgICBkaXNwYXRjaChcclxuICAgICAgICBwcm9wcy5hY3Rpb24sXHJcbiAgICApO1xyXG59O1xyXG5cclxuXHJcbmNvbnN0IHJ1bkFjdGlvbiA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBxdWV1ZWRFZmZlY3RzOiBBcnJheTxJQWN0aW9uPlxyXG4pOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgY29uc3QgZWZmZWN0czogYW55W10gPSBbXTtcclxuXHJcbiAgICBxdWV1ZWRFZmZlY3RzLmZvckVhY2goKGFjdGlvbjogSUFjdGlvbikgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBwcm9wcyA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgICAgIGVycm9yOiAoX3N0YXRlOiBJU3RhdGUsIGVycm9yRGV0YWlsczogYW55KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYHtcclxuICAgICAgICAgICAgICAgICAgICBcIm1lc3NhZ2VcIjogXCJFcnJvciBydW5uaW5nIGFjdGlvbiBpbiByZXBlYXRBY3Rpb25zXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlcnJvciBEZXRhaWxzXCI6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3JEZXRhaWxzKX0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzdGFja1wiOiAke0pTT04uc3RyaW5naWZ5KGVycm9yRGV0YWlscy5zdGFjayl9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwibWV0aG9kXCI6ICR7cnVuQWN0aW9ufSxcclxuICAgICAgICAgICAgICAgIH1gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhbGVydChcIkVycm9yIHJ1bm5pbmcgYWN0aW9uIGluIHJlcGVhdEFjdGlvbnNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgZWZmZWN0cy5wdXNoKFtcclxuICAgICAgICAgICAgcnVuQWN0aW9uSW5uZXIsXHJcbiAgICAgICAgICAgIHByb3BzXHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gW1xyXG5cclxuICAgICAgICBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpLFxyXG4gICAgICAgIC4uLmVmZmVjdHNcclxuICAgIF07XHJcbn07XHJcblxyXG5jb25zdCBzZW5kUmVxdWVzdCA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBxdWV1ZWRFZmZlY3RzOiBBcnJheTxJSHR0cEVmZmVjdD5cclxuKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgIGNvbnN0IGVmZmVjdHM6IGFueVtdID0gW107XHJcblxyXG4gICAgcXVldWVkRWZmZWN0cy5mb3JFYWNoKChodHRwRWZmZWN0OiBJSHR0cEVmZmVjdCkgPT4ge1xyXG5cclxuICAgICAgICBnZXRFZmZlY3QoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBodHRwRWZmZWN0LFxyXG4gICAgICAgICAgICBlZmZlY3RzLFxyXG4gICAgICAgICk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gW1xyXG5cclxuICAgICAgICBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpLFxyXG4gICAgICAgIC4uLmVmZmVjdHNcclxuICAgIF07XHJcbn07XHJcblxyXG5jb25zdCBnZXRFZmZlY3QgPSAoXHJcbiAgICBfc3RhdGU6IElTdGF0ZSxcclxuICAgIGh0dHBFZmZlY3Q6IElIdHRwRWZmZWN0LFxyXG4gICAgZWZmZWN0czogQXJyYXk8SUh0dHBFZmZlY3Q+XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGNvbnN0IHVybDogc3RyaW5nID0gaHR0cEVmZmVjdC51cmw7XHJcbiAgICBjb25zdCBjYWxsSUQ6IHN0cmluZyA9IFUuZ2VuZXJhdGVHdWlkKCk7XHJcblxyXG4gICAgbGV0IGhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xyXG4gICAgaGVhZGVycy5hcHBlbmQoJ0FjY2VwdCcsICcqLyonKTtcclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICAgIG1ldGhvZDogXCJHRVRcIixcclxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGVmZmVjdCA9IGdBdXRoZW50aWNhdGVkSHR0cCh7XHJcbiAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgcGFyc2VUeXBlOiBodHRwRWZmZWN0LnBhcnNlVHlwZSxcclxuICAgICAgICBvcHRpb25zLFxyXG4gICAgICAgIHJlc3BvbnNlOiAnanNvbicsXHJcbiAgICAgICAgYWN0aW9uOiBodHRwRWZmZWN0LmFjdGlvbkRlbGVnYXRlLFxyXG4gICAgICAgIGVycm9yOiAoX3N0YXRlOiBJU3RhdGUsIGVycm9yRGV0YWlsczogYW55KSA9PiB7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhge1xyXG4gICAgICAgICAgICAgICAgICAgIFwibWVzc2FnZVwiOiBcIkVycm9yIHBvc3RpbmcgZ1JlcGVhdEFjdGlvbnMgZGF0YSB0byB0aGUgc2VydmVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ1cmxcIjogJHt1cmx9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZXJyb3IgRGV0YWlsc1wiOiAke0pTT04uc3RyaW5naWZ5KGVycm9yRGV0YWlscyl9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwic3RhY2tcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMuc3RhY2spfSxcclxuICAgICAgICAgICAgICAgICAgICBcIm1ldGhvZFwiOiAke2dldEVmZmVjdC5uYW1lfSxcclxuICAgICAgICAgICAgICAgICAgICBcImNhbGxJRDogJHtjYWxsSUR9XHJcbiAgICAgICAgICAgICAgICB9YCk7XHJcblxyXG4gICAgICAgICAgICBhbGVydChcIkVycm9yIHBvc3RpbmcgZ1JlcGVhdEFjdGlvbnMgZGF0YSB0byB0aGUgc2VydmVyXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGVmZmVjdHMucHVzaChlZmZlY3QpO1xyXG59O1xyXG5cclxuY29uc3QgZ1JlcGVhdEFjdGlvbnMgPSB7XHJcblxyXG4gICAgaHR0cFNpbGVudFJlTG9hZEltbWVkaWF0ZTogKHN0YXRlOiBJU3RhdGUpOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZS5yZXBlYXRFZmZlY3RzLnJlTG9hZEdldEh0dHBJbW1lZGlhdGUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIE11c3QgcmV0dXJuIGFsdGVyZWQgc3RhdGUgZm9yIHRoZSBzdWJzY3JpcHRpb24gbm90IHRvIGdldCByZW1vdmVkXHJcbiAgICAgICAgICAgIC8vIHJldHVybiBzdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlTG9hZEh0dHBFZmZlY3RzSW1tZWRpYXRlOiBBcnJheTxJSHR0cEVmZmVjdD4gPSBzdGF0ZS5yZXBlYXRFZmZlY3RzLnJlTG9hZEdldEh0dHBJbW1lZGlhdGU7XHJcbiAgICAgICAgc3RhdGUucmVwZWF0RWZmZWN0cy5yZUxvYWRHZXRIdHRwSW1tZWRpYXRlID0gW107XHJcblxyXG4gICAgICAgIHJldHVybiBzZW5kUmVxdWVzdChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHJlTG9hZEh0dHBFZmZlY3RzSW1tZWRpYXRlXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2lsZW50UnVuQWN0aW9uSW1tZWRpYXRlOiAoc3RhdGU6IElTdGF0ZSk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFzdGF0ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHN0YXRlLnJlcGVhdEVmZmVjdHMucnVuQWN0aW9uSW1tZWRpYXRlLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBNdXN0IHJldHVybiBhbHRlcmVkIHN0YXRlIGZvciB0aGUgc3Vic2NyaXB0aW9uIG5vdCB0byBnZXQgcmVtb3ZlZFxyXG4gICAgICAgICAgICAvLyByZXR1cm4gc3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBydW5BY3Rpb25JbW1lZGlhdGU6IEFycmF5PElBY3Rpb24+ID0gc3RhdGUucmVwZWF0RWZmZWN0cy5ydW5BY3Rpb25JbW1lZGlhdGU7XHJcbiAgICAgICAgc3RhdGUucmVwZWF0RWZmZWN0cy5ydW5BY3Rpb25JbW1lZGlhdGUgPSBbXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJ1bkFjdGlvbihcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHJ1bkFjdGlvbkltbWVkaWF0ZVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnUmVwZWF0QWN0aW9ucztcclxuXHJcbiIsImltcG9ydCB7IGludGVydmFsIH0gZnJvbSBcIi4uLy4uL2h5cGVyQXBwL3RpbWVcIjtcclxuXHJcbmltcG9ydCBnUmVwZWF0QWN0aW9ucyBmcm9tIFwiLi4vZ2xvYmFsL2FjdGlvbnMvZ1JlcGVhdEFjdGlvbnNcIjtcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuXHJcblxyXG5jb25zdCByZXBlYXRTdWJzY3JpcHRpb25zID0ge1xyXG5cclxuICAgIGJ1aWxkUmVwZWF0U3Vic2NyaXB0aW9uczogKHN0YXRlOiBJU3RhdGUpID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgYnVpbGRSZUxvYWREYXRhSW1tZWRpYXRlID0gKCk6IGFueSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RhdGUucmVwZWF0RWZmZWN0cy5yZUxvYWRHZXRIdHRwSW1tZWRpYXRlLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW50ZXJ2YWwoXHJcbiAgICAgICAgICAgICAgICAgICAgZ1JlcGVhdEFjdGlvbnMuaHR0cFNpbGVudFJlTG9hZEltbWVkaWF0ZSxcclxuICAgICAgICAgICAgICAgICAgICB7IGRlbGF5OiAxMCB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgYnVpbGRSdW5BY3Rpb25zSW1tZWRpYXRlID0gKCk6IGFueSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RhdGUucmVwZWF0RWZmZWN0cy5ydW5BY3Rpb25JbW1lZGlhdGUubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBpbnRlcnZhbChcclxuICAgICAgICAgICAgICAgICAgICBnUmVwZWF0QWN0aW9ucy5zaWxlbnRSdW5BY3Rpb25JbW1lZGlhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgeyBkZWxheTogMTAgfVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcGVhdFN1YnNjcmlwdGlvbjogYW55W10gPSBbXHJcblxyXG4gICAgICAgICAgICBidWlsZFJlTG9hZERhdGFJbW1lZGlhdGUoKSxcclxuICAgICAgICAgICAgYnVpbGRSdW5BY3Rpb25zSW1tZWRpYXRlKClcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVwZWF0U3Vic2NyaXB0aW9uO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgcmVwZWF0U3Vic2NyaXB0aW9ucztcclxuXHJcbiIsImltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCByZXBlYXRTdWJzY3JpcHRpb25zIGZyb20gXCIuLi8uLi8uLi9zdWJzY3JpcHRpb25zL3JlcGVhdFN1YnNjcmlwdGlvblwiO1xyXG5cclxuXHJcbmNvbnN0IGluaXRTdWJzY3JpcHRpb25zID0gKHN0YXRlOiBJU3RhdGUpID0+IHtcclxuXHJcbiAgICBpZiAoIXN0YXRlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN1YnNjcmlwdGlvbnM6IGFueVtdID0gW1xyXG5cclxuICAgICAgICAuLi5yZXBlYXRTdWJzY3JpcHRpb25zLmJ1aWxkUmVwZWF0U3Vic2NyaXB0aW9ucyhzdGF0ZSlcclxuICAgIF07XHJcblxyXG4gICAgcmV0dXJuIHN1YnNjcmlwdGlvbnM7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpbml0U3Vic2NyaXB0aW9ucztcclxuXHJcbiIsIi8qISBAdmltZW8vcGxheWVyIHYyLjMwLjMgfCAoYykgMjAyNiBWaW1lbyB8IE1JVCBMaWNlbnNlIHwgaHR0cHM6Ly9naXRodWIuY29tL3ZpbWVvL3BsYXllci5qcyAqL1xuLyoqXG4gKiBAbW9kdWxlIGxpYi9mdW5jdGlvbnNcbiAqL1xuXG4vKipcbiAqIENoZWNrIHRvIHNlZSB0aGlzIGlzIGEgTm9kZSBlbnZpcm9ubWVudC5cbiAqIEB0eXBlIHtib29sZWFufVxuICovXG4vKiBnbG9iYWwgZ2xvYmFsICovXG5jb25zdCBpc05vZGUgPSB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyAmJiB7fS50b1N0cmluZy5jYWxsKGdsb2JhbCkgPT09ICdbb2JqZWN0IGdsb2JhbF0nO1xuXG4vKipcbiAqIENoZWNrIHRvIHNlZSBpZiB0aGlzIGlzIGEgQnVuIGVudmlyb25tZW50LlxuICogQHNlZSBodHRwczovL2J1bi5zaC9ndWlkZXMvdXRpbC9kZXRlY3QtYnVuXG4gKiBAdHlwZSB7Ym9vbGVhbn1cbiAqL1xuY29uc3QgaXNCdW4gPSB0eXBlb2YgQnVuICE9PSAndW5kZWZpbmVkJztcblxuLyoqXG4gKiBDaGVjayB0byBzZWUgaWYgdGhpcyBpcyBhIERlbm8gZW52aXJvbm1lbnQuXG4gKiBAc2VlIGh0dHBzOi8vZG9jcy5kZW5vLmNvbS9hcGkvZGVuby9+L0Rlbm9cbiAqIEB0eXBlIHtib29sZWFufVxuICovXG5jb25zdCBpc0Rlbm8gPSB0eXBlb2YgRGVubyAhPT0gJ3VuZGVmaW5lZCc7XG5cbi8qKlxuICogQ2hlY2sgdG8gc2VlIGlmIHRoaXMgaXMgYSBDbG91ZGZsYXJlIFdvcmtlciBlbnZpcm9ubWVudC5cbiAqIEBzZWUgaHR0cHM6Ly9jb21tdW5pdHkuY2xvdWRmbGFyZS5jb20vdC9ob3ctdG8tZGV0ZWN0LXRoZS1jbG91ZGZsYXJlLXdvcmtlci1ydW50aW1lLzI5MzcxNVxuICogQHR5cGUge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzQ2xvdWRmbGFyZVdvcmtlciA9IHR5cGVvZiBXZWJTb2NrZXRQYWlyID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBjYWNoZXM/LmRlZmF1bHQgIT09ICd1bmRlZmluZWQnO1xuXG4vKipcbiAqIENoZWNrIGlmIHRoaXMgaXMgYSBzZXJ2ZXIgcnVudGltZVxuICogQHR5cGUge2Jvb2xlYW59XG4gKi9cbmNvbnN0IGlzU2VydmVyUnVudGltZSA9IGlzTm9kZSB8fCBpc0J1biB8fCBpc0Rlbm8gfHwgaXNDbG91ZGZsYXJlV29ya2VyO1xuXG4vKipcbiAqIEdldCB0aGUgbmFtZSBvZiB0aGUgbWV0aG9kIGZvciBhIGdpdmVuIGdldHRlciBvciBzZXR0ZXIuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHByb3AgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5LlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgRWl0aGVyIOKAnGdldOKAnSBvciDigJxzZXTigJ0uXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGdldE1ldGhvZE5hbWUocHJvcCwgdHlwZSkge1xuICBpZiAocHJvcC5pbmRleE9mKHR5cGUudG9Mb3dlckNhc2UoKSkgPT09IDApIHtcbiAgICByZXR1cm4gcHJvcDtcbiAgfVxuICByZXR1cm4gYCR7dHlwZS50b0xvd2VyQ2FzZSgpfSR7cHJvcC5zdWJzdHIoMCwgMSkudG9VcHBlckNhc2UoKX0ke3Byb3Auc3Vic3RyKDEpfWA7XG59XG5cbi8qKlxuICogQ2hlY2sgdG8gc2VlIGlmIHRoZSBvYmplY3QgaXMgYSBET00gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0geyp9IGVsZW1lbnQgVGhlIG9iamVjdCB0byBjaGVjay5cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzRG9tRWxlbWVudChlbGVtZW50KSB7XG4gIHJldHVybiBCb29sZWFuKGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PT0gMSAmJiAnbm9kZU5hbWUnIGluIGVsZW1lbnQgJiYgZWxlbWVudC5vd25lckRvY3VtZW50ICYmIGVsZW1lbnQub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldyk7XG59XG5cbi8qKlxuICogQ2hlY2sgdG8gc2VlIHdoZXRoZXIgdGhlIHZhbHVlIGlzIGEgbnVtYmVyLlxuICpcbiAqIEBzZWUgaHR0cDovL2RsLmRyb3Bib3h1c2VyY29udGVudC5jb20vdS8zNTE0Ni9qcy90ZXN0cy9pc051bWJlci5odG1sXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaW50ZWdlciBDaGVjayBpZiB0aGUgdmFsdWUgaXMgYW4gaW50ZWdlci5cbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzSW50ZWdlcih2YWx1ZSkge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZXFlcWVxXG4gIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdCh2YWx1ZSkpICYmIGlzRmluaXRlKHZhbHVlKSAmJiBNYXRoLmZsb29yKHZhbHVlKSA9PSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBDaGVjayB0byBzZWUgaWYgdGhlIFVSTCBpcyBhIFZpbWVvIHVybC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIFRoZSB1cmwgc3RyaW5nLlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNWaW1lb1VybCh1cmwpIHtcbiAgcmV0dXJuIC9eKGh0dHBzPzopP1xcL1xcLygoKChwbGF5ZXJ8d3d3KVxcLik/dmltZW9cXC5jb20pfCgocGxheWVyXFwuKT9bYS16QS1aMC05LV0rXFwuKHZpZGVvamlcXC4oaGt8Y24pfHZpbWVvXFwud29yaykpKSg/PSR8XFwvKS8udGVzdCh1cmwpO1xufVxuXG4vKipcbiAqIENoZWNrIHRvIHNlZSBpZiB0aGUgVVJMIGlzIGZvciBhIFZpbWVvIGVtYmVkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVGhlIHVybCBzdHJpbmcuXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc1ZpbWVvRW1iZWQodXJsKSB7XG4gIGNvbnN0IGV4cHIgPSAvXmh0dHBzOlxcL1xcL3BsYXllclxcLigodmltZW9cXC5jb20pfChbYS16QS1aMC05LV0rXFwuKHZpZGVvamlcXC4oaGt8Y24pfHZpbWVvXFwud29yaykpKVxcL3ZpZGVvXFwvXFxkKy87XG4gIHJldHVybiBleHByLnRlc3QodXJsKTtcbn1cbmZ1bmN0aW9uIGdldE9lbWJlZERvbWFpbih1cmwpIHtcbiAgY29uc3QgbWF0Y2ggPSAodXJsIHx8ICcnKS5tYXRjaCgvXig/Omh0dHBzPzopPyg/OlxcL1xcLyk/KFteLz9dKykvKTtcbiAgY29uc3QgZG9tYWluID0gKG1hdGNoICYmIG1hdGNoWzFdIHx8ICcnKS5yZXBsYWNlKCdwbGF5ZXIuJywgJycpO1xuICBjb25zdCBjdXN0b21Eb21haW5zID0gWycudmlkZW9qaS5oaycsICcudmltZW8ud29yaycsICcudmlkZW9qaS5jbiddO1xuICBmb3IgKGNvbnN0IGN1c3RvbURvbWFpbiBvZiBjdXN0b21Eb21haW5zKSB7XG4gICAgaWYgKGRvbWFpbi5lbmRzV2l0aChjdXN0b21Eb21haW4pKSB7XG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH1cbiAgfVxuICByZXR1cm4gJ3ZpbWVvLmNvbSc7XG59XG5cbi8qKlxuICogR2V0IHRoZSBWaW1lbyBVUkwgZnJvbSBhbiBlbGVtZW50LlxuICogVGhlIGVsZW1lbnQgbXVzdCBoYXZlIGVpdGhlciBhIGRhdGEtdmltZW8taWQgb3IgZGF0YS12aW1lby11cmwgYXR0cmlidXRlLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvRW1iZWRQYXJhbWV0ZXJzIFRoZSBvRW1iZWQgcGFyYW1ldGVycy5cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZ2V0VmltZW9VcmwoKSB7XG4gIGxldCBvRW1iZWRQYXJhbWV0ZXJzID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fTtcbiAgY29uc3QgaWQgPSBvRW1iZWRQYXJhbWV0ZXJzLmlkO1xuICBjb25zdCB1cmwgPSBvRW1iZWRQYXJhbWV0ZXJzLnVybDtcbiAgY29uc3QgaWRPclVybCA9IGlkIHx8IHVybDtcbiAgaWYgKCFpZE9yVXJsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBbiBpZCBvciB1cmwgbXVzdCBiZSBwYXNzZWQsIGVpdGhlciBpbiBhbiBvcHRpb25zIG9iamVjdCBvciBhcyBhIGRhdGEtdmltZW8taWQgb3IgZGF0YS12aW1lby11cmwgYXR0cmlidXRlLicpO1xuICB9XG4gIGlmIChpc0ludGVnZXIoaWRPclVybCkpIHtcbiAgICByZXR1cm4gYGh0dHBzOi8vdmltZW8uY29tLyR7aWRPclVybH1gO1xuICB9XG4gIGlmIChpc1ZpbWVvVXJsKGlkT3JVcmwpKSB7XG4gICAgcmV0dXJuIGlkT3JVcmwucmVwbGFjZSgnaHR0cDonLCAnaHR0cHM6Jyk7XG4gIH1cbiAgaWYgKGlkKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihg4oCcJHtpZH3igJ0gaXMgbm90IGEgdmFsaWQgdmlkZW8gaWQuYCk7XG4gIH1cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihg4oCcJHtpZE9yVXJsfeKAnSBpcyBub3QgYSB2aW1lby5jb20gdXJsLmApO1xufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtcGFyYW1zICovXG4vKipcbiAqIEEgdXRpbGl0eSBtZXRob2QgZm9yIGF0dGFjaGluZyBhbmQgZGV0YWNoaW5nIGV2ZW50IGhhbmRsZXJzXG4gKlxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0XG4gKiBAcGFyYW0ge3N0cmluZyB8IHN0cmluZ1tdfSBldmVudE5hbWVcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcGFyYW0geydhZGRFdmVudExpc3RlbmVyJyB8ICdvbid9IG9uTmFtZVxuICogQHBhcmFtIHsncmVtb3ZlRXZlbnRMaXN0ZW5lcicgfCAnb2ZmJ30gb2ZmTmFtZVxuICogQHJldHVybiB7e2NhbmNlbDogKGZ1bmN0aW9uKCk6IHZvaWQpfX1cbiAqL1xuY29uc3Qgc3Vic2NyaWJlID0gZnVuY3Rpb24gKHRhcmdldCwgZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICBsZXQgb25OYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiAnYWRkRXZlbnRMaXN0ZW5lcic7XG4gIGxldCBvZmZOYW1lID0gYXJndW1lbnRzLmxlbmd0aCA+IDQgJiYgYXJndW1lbnRzWzRdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbNF0gOiAncmVtb3ZlRXZlbnRMaXN0ZW5lcic7XG4gIGNvbnN0IGV2ZW50TmFtZXMgPSB0eXBlb2YgZXZlbnROYW1lID09PSAnc3RyaW5nJyA/IFtldmVudE5hbWVdIDogZXZlbnROYW1lO1xuICBldmVudE5hbWVzLmZvckVhY2goZXZOYW1lID0+IHtcbiAgICB0YXJnZXRbb25OYW1lXShldk5hbWUsIGNhbGxiYWNrKTtcbiAgfSk7XG4gIHJldHVybiB7XG4gICAgY2FuY2VsOiAoKSA9PiBldmVudE5hbWVzLmZvckVhY2goZXZOYW1lID0+IHRhcmdldFtvZmZOYW1lXShldk5hbWUsIGNhbGxiYWNrKSlcbiAgfTtcbn07XG5cbi8qKlxuICogRmluZCB0aGUgaWZyYW1lIGVsZW1lbnQgdGhhdCBjb250YWlucyBhIHNwZWNpZmljIHNvdXJjZSB3aW5kb3dcbiAqXG4gKiBAcGFyYW0ge1dpbmRvd30gc291cmNlV2luZG93IFRoZSBzb3VyY2Ugd2luZG93IHRvIGZpbmQgdGhlIGlmcmFtZSBmb3JcbiAqIEBwYXJhbSB7RG9jdW1lbnR9IFtkb2M9ZG9jdW1lbnRdIFRoZSBkb2N1bWVudCB0byBzZWFyY2ggd2l0aGluXG4gKiBAcmV0dXJuIHtIVE1MSUZyYW1lRWxlbWVudHxudWxsfSBUaGUgaWZyYW1lIGVsZW1lbnQgaWYgZm91bmQsIG90aGVyd2lzZSBudWxsXG4gKi9cbmZ1bmN0aW9uIGZpbmRJZnJhbWVCeVNvdXJjZVdpbmRvdyhzb3VyY2VXaW5kb3cpIHtcbiAgbGV0IGRvYyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogZG9jdW1lbnQ7XG4gIGlmICghc291cmNlV2luZG93IHx8ICFkb2MgfHwgdHlwZW9mIGRvYy5xdWVyeVNlbGVjdG9yQWxsICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgaWZyYW1lcyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKCdpZnJhbWUnKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGlmcmFtZXNbaV0gJiYgaWZyYW1lc1tpXS5jb250ZW50V2luZG93ID09PSBzb3VyY2VXaW5kb3cpIHtcbiAgICAgIHJldHVybiBpZnJhbWVzW2ldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuY29uc3QgYXJyYXlJbmRleE9mU3VwcG9ydCA9IHR5cGVvZiBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiAhPT0gJ3VuZGVmaW5lZCc7XG5jb25zdCBwb3N0TWVzc2FnZVN1cHBvcnQgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygd2luZG93LnBvc3RNZXNzYWdlICE9PSAndW5kZWZpbmVkJztcbmlmICghaXNTZXJ2ZXJSdW50aW1lICYmICghYXJyYXlJbmRleE9mU3VwcG9ydCB8fCAhcG9zdE1lc3NhZ2VTdXBwb3J0KSkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ1NvcnJ5LCB0aGUgVmltZW8gUGxheWVyIEFQSSBpcyBub3QgYXZhaWxhYmxlIGluIHRoaXMgYnJvd3Nlci4nKTtcbn1cblxudmFyIGNvbW1vbmpzR2xvYmFsID0gdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsVGhpcyA6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDoge307XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbW1vbmpzTW9kdWxlKGZuLCBtb2R1bGUpIHtcblx0cmV0dXJuIG1vZHVsZSA9IHsgZXhwb3J0czoge30gfSwgZm4obW9kdWxlLCBtb2R1bGUuZXhwb3J0cyksIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vKiFcbiAqIHdlYWttYXAtcG9seWZpbGwgdjIuMC40IC0gRUNNQVNjcmlwdDYgV2Vha01hcCBwb2x5ZmlsbFxuICogaHR0cHM6Ly9naXRodWIuY29tL3BvbHlnb25wbGFuZXQvd2Vha21hcC1wb2x5ZmlsbFxuICogQ29weXJpZ2h0IChjKSAyMDE1LTIwMjEgcG9seWdvbnBsYW5ldCA8cG9seWdvbi5wbGFuZXQuYXF1YUBnbWFpbC5jb20+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4oZnVuY3Rpb24gKHNlbGYpIHtcblxuICBpZiAoc2VsZi5XZWFrTWFwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gIHZhciBoYXNEZWZpbmUgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkgJiYgZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAvLyBBdm9pZCBJRTgncyBicm9rZW4gT2JqZWN0LmRlZmluZVByb3BlcnR5XG4gICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LCAneCcsIHtcbiAgICAgICAgdmFsdWU6IDFcbiAgICAgIH0pLnggPT09IDE7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfSgpO1xuICB2YXIgZGVmaW5lUHJvcGVydHkgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCB2YWx1ZSkge1xuICAgIGlmIChoYXNEZWZpbmUpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIG5hbWUsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqZWN0W25hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9O1xuICBzZWxmLldlYWtNYXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gRUNNQS0yNjIgMjMuMyBXZWFrTWFwIE9iamVjdHNcbiAgICBmdW5jdGlvbiBXZWFrTWFwKCkge1xuICAgICAgaWYgKHRoaXMgPT09IHZvaWQgMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ29uc3RydWN0b3IgV2Vha01hcCByZXF1aXJlcyAnbmV3J1wiKTtcbiAgICAgIH1cbiAgICAgIGRlZmluZVByb3BlcnR5KHRoaXMsICdfaWQnLCBnZW5JZCgnX1dlYWtNYXAnKSk7XG5cbiAgICAgIC8vIEVDTUEtMjYyIDIzLjMuMS4xIFdlYWtNYXAoW2l0ZXJhYmxlXSlcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBDdXJyZW50bHksIFdlYWtNYXAgYGl0ZXJhYmxlYCBhcmd1bWVudCBpcyBub3Qgc3VwcG9ydGVkXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1dlYWtNYXAgaXRlcmFibGUgaXMgbm90IHN1cHBvcnRlZCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEVDTUEtMjYyIDIzLjMuMy4yIFdlYWtNYXAucHJvdG90eXBlLmRlbGV0ZShrZXkpXG4gICAgZGVmaW5lUHJvcGVydHkoV2Vha01hcC5wcm90b3R5cGUsICdkZWxldGUnLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBjaGVja0luc3RhbmNlKHRoaXMsICdkZWxldGUnKTtcbiAgICAgIGlmICghaXNPYmplY3Qoa2V5KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5faWRdO1xuICAgICAgaWYgKGVudHJ5ICYmIGVudHJ5WzBdID09PSBrZXkpIHtcbiAgICAgICAgZGVsZXRlIGtleVt0aGlzLl9pZF07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuXG4gICAgLy8gRUNNQS0yNjIgMjMuMy4zLjMgV2Vha01hcC5wcm90b3R5cGUuZ2V0KGtleSlcbiAgICBkZWZpbmVQcm9wZXJ0eShXZWFrTWFwLnByb3RvdHlwZSwgJ2dldCcsIGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIGNoZWNrSW5zdGFuY2UodGhpcywgJ2dldCcpO1xuICAgICAgaWYgKCFpc09iamVjdChrZXkpKSB7XG4gICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgICB9XG4gICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5faWRdO1xuICAgICAgaWYgKGVudHJ5ICYmIGVudHJ5WzBdID09PSBrZXkpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5WzFdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9KTtcblxuICAgIC8vIEVDTUEtMjYyIDIzLjMuMy40IFdlYWtNYXAucHJvdG90eXBlLmhhcyhrZXkpXG4gICAgZGVmaW5lUHJvcGVydHkoV2Vha01hcC5wcm90b3R5cGUsICdoYXMnLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBjaGVja0luc3RhbmNlKHRoaXMsICdoYXMnKTtcbiAgICAgIGlmICghaXNPYmplY3Qoa2V5KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5faWRdO1xuICAgICAgaWYgKGVudHJ5ICYmIGVudHJ5WzBdID09PSBrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG5cbiAgICAvLyBFQ01BLTI2MiAyMy4zLjMuNSBXZWFrTWFwLnByb3RvdHlwZS5zZXQoa2V5LCB2YWx1ZSlcbiAgICBkZWZpbmVQcm9wZXJ0eShXZWFrTWFwLnByb3RvdHlwZSwgJ3NldCcsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICBjaGVja0luc3RhbmNlKHRoaXMsICdzZXQnKTtcbiAgICAgIGlmICghaXNPYmplY3Qoa2V5KSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIHZhbHVlIHVzZWQgYXMgd2VhayBtYXAga2V5Jyk7XG4gICAgICB9XG4gICAgICB2YXIgZW50cnkgPSBrZXlbdGhpcy5faWRdO1xuICAgICAgaWYgKGVudHJ5ICYmIGVudHJ5WzBdID09PSBrZXkpIHtcbiAgICAgICAgZW50cnlbMV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBkZWZpbmVQcm9wZXJ0eShrZXksIHRoaXMuX2lkLCBba2V5LCB2YWx1ZV0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gICAgZnVuY3Rpb24gY2hlY2tJbnN0YW5jZSh4LCBtZXRob2ROYW1lKSB7XG4gICAgICBpZiAoIWlzT2JqZWN0KHgpIHx8ICFoYXNPd25Qcm9wZXJ0eS5jYWxsKHgsICdfaWQnKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKG1ldGhvZE5hbWUgKyAnIG1ldGhvZCBjYWxsZWQgb24gaW5jb21wYXRpYmxlIHJlY2VpdmVyICcgKyB0eXBlb2YgeCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdlbklkKHByZWZpeCkge1xuICAgICAgcmV0dXJuIHByZWZpeCArICdfJyArIHJhbmQoKSArICcuJyArIHJhbmQoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmFuZCgpIHtcbiAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkuc3Vic3RyaW5nKDIpO1xuICAgIH1cbiAgICBkZWZpbmVQcm9wZXJ0eShXZWFrTWFwLCAnX3BvbHlmaWxsJywgdHJ1ZSk7XG4gICAgcmV0dXJuIFdlYWtNYXA7XG4gIH0oKTtcbiAgZnVuY3Rpb24gaXNPYmplY3QoeCkge1xuICAgIHJldHVybiBPYmplY3QoeCkgPT09IHg7XG4gIH1cbn0pKHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiB0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0eXBlb2YgY29tbW9uanNHbG9iYWwgIT09ICd1bmRlZmluZWQnID8gY29tbW9uanNHbG9iYWwgOiBjb21tb25qc0dsb2JhbCk7XG5cbnZhciBucG9fc3JjID0gY3JlYXRlQ29tbW9uanNNb2R1bGUoZnVuY3Rpb24gKG1vZHVsZSkge1xuLyohIE5hdGl2ZSBQcm9taXNlIE9ubHlcbiAgICB2MC44LjEgKGMpIEt5bGUgU2ltcHNvblxuICAgIE1JVCBMaWNlbnNlOiBodHRwOi8vZ2V0aWZ5Lm1pdC1saWNlbnNlLm9yZ1xuKi9cblxuKGZ1bmN0aW9uIFVNRChuYW1lLCBjb250ZXh0LCBkZWZpbml0aW9uKSB7XG4gIC8vIHNwZWNpYWwgZm9ybSBvZiBVTUQgZm9yIHBvbHlmaWxsaW5nIGFjcm9zcyBldmlyb25tZW50c1xuICBjb250ZXh0W25hbWVdID0gY29udGV4dFtuYW1lXSB8fCBkZWZpbml0aW9uKCk7XG4gIGlmIChtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gY29udGV4dFtuYW1lXTtcbiAgfVxufSkoXCJQcm9taXNlXCIsIHR5cGVvZiBjb21tb25qc0dsb2JhbCAhPSBcInVuZGVmaW5lZFwiID8gY29tbW9uanNHbG9iYWwgOiBjb21tb25qc0dsb2JhbCwgZnVuY3Rpb24gREVGKCkge1xuXG4gIHZhciBidWlsdEluUHJvcCxcbiAgICBjeWNsZSxcbiAgICBzY2hlZHVsaW5nX3F1ZXVlLFxuICAgIFRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICB0aW1lciA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgIT0gXCJ1bmRlZmluZWRcIiA/IGZ1bmN0aW9uIHRpbWVyKGZuKSB7XG4gICAgICByZXR1cm4gc2V0SW1tZWRpYXRlKGZuKTtcbiAgICB9IDogc2V0VGltZW91dDtcblxuICAvLyBkYW1taXQsIElFOC5cbiAgdHJ5IHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoe30sIFwieFwiLCB7fSk7XG4gICAgYnVpbHRJblByb3AgPSBmdW5jdGlvbiBidWlsdEluUHJvcChvYmosIG5hbWUsIHZhbCwgY29uZmlnKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgbmFtZSwge1xuICAgICAgICB2YWx1ZTogdmFsLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBjb25maWcgIT09IGZhbHNlXG4gICAgICB9KTtcbiAgICB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBidWlsdEluUHJvcCA9IGZ1bmN0aW9uIGJ1aWx0SW5Qcm9wKG9iaiwgbmFtZSwgdmFsKSB7XG4gICAgICBvYmpbbmFtZV0gPSB2YWw7XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH07XG4gIH1cblxuICAvLyBOb3RlOiB1c2luZyBhIHF1ZXVlIGluc3RlYWQgb2YgYXJyYXkgZm9yIGVmZmljaWVuY3lcbiAgc2NoZWR1bGluZ19xdWV1ZSA9IGZ1bmN0aW9uIFF1ZXVlKCkge1xuICAgIHZhciBmaXJzdCwgbGFzdCwgaXRlbTtcbiAgICBmdW5jdGlvbiBJdGVtKGZuLCBzZWxmKSB7XG4gICAgICB0aGlzLmZuID0gZm47XG4gICAgICB0aGlzLnNlbGYgPSBzZWxmO1xuICAgICAgdGhpcy5uZXh0ID0gdm9pZCAwO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgYWRkOiBmdW5jdGlvbiBhZGQoZm4sIHNlbGYpIHtcbiAgICAgICAgaXRlbSA9IG5ldyBJdGVtKGZuLCBzZWxmKTtcbiAgICAgICAgaWYgKGxhc3QpIHtcbiAgICAgICAgICBsYXN0Lm5leHQgPSBpdGVtO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZpcnN0ID0gaXRlbTtcbiAgICAgICAgfVxuICAgICAgICBsYXN0ID0gaXRlbTtcbiAgICAgICAgaXRlbSA9IHZvaWQgMDtcbiAgICAgIH0sXG4gICAgICBkcmFpbjogZnVuY3Rpb24gZHJhaW4oKSB7XG4gICAgICAgIHZhciBmID0gZmlyc3Q7XG4gICAgICAgIGZpcnN0ID0gbGFzdCA9IGN5Y2xlID0gdm9pZCAwO1xuICAgICAgICB3aGlsZSAoZikge1xuICAgICAgICAgIGYuZm4uY2FsbChmLnNlbGYpO1xuICAgICAgICAgIGYgPSBmLm5leHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9KCk7XG4gIGZ1bmN0aW9uIHNjaGVkdWxlKGZuLCBzZWxmKSB7XG4gICAgc2NoZWR1bGluZ19xdWV1ZS5hZGQoZm4sIHNlbGYpO1xuICAgIGlmICghY3ljbGUpIHtcbiAgICAgIGN5Y2xlID0gdGltZXIoc2NoZWR1bGluZ19xdWV1ZS5kcmFpbik7XG4gICAgfVxuICB9XG5cbiAgLy8gcHJvbWlzZSBkdWNrIHR5cGluZ1xuICBmdW5jdGlvbiBpc1RoZW5hYmxlKG8pIHtcbiAgICB2YXIgX3RoZW4sXG4gICAgICBvX3R5cGUgPSB0eXBlb2YgbztcbiAgICBpZiAobyAhPSBudWxsICYmIChvX3R5cGUgPT0gXCJvYmplY3RcIiB8fCBvX3R5cGUgPT0gXCJmdW5jdGlvblwiKSkge1xuICAgICAgX3RoZW4gPSBvLnRoZW47XG4gICAgfVxuICAgIHJldHVybiB0eXBlb2YgX3RoZW4gPT0gXCJmdW5jdGlvblwiID8gX3RoZW4gOiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBub3RpZnkoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoYWluLmxlbmd0aDsgaSsrKSB7XG4gICAgICBub3RpZnlJc29sYXRlZCh0aGlzLCB0aGlzLnN0YXRlID09PSAxID8gdGhpcy5jaGFpbltpXS5zdWNjZXNzIDogdGhpcy5jaGFpbltpXS5mYWlsdXJlLCB0aGlzLmNoYWluW2ldKTtcbiAgICB9XG4gICAgdGhpcy5jaGFpbi5sZW5ndGggPSAwO1xuICB9XG5cbiAgLy8gTk9URTogVGhpcyBpcyBhIHNlcGFyYXRlIGZ1bmN0aW9uIHRvIGlzb2xhdGVcbiAgLy8gdGhlIGB0cnkuLmNhdGNoYCBzbyB0aGF0IG90aGVyIGNvZGUgY2FuIGJlXG4gIC8vIG9wdGltaXplZCBiZXR0ZXJcbiAgZnVuY3Rpb24gbm90aWZ5SXNvbGF0ZWQoc2VsZiwgY2IsIGNoYWluKSB7XG4gICAgdmFyIHJldCwgX3RoZW47XG4gICAgdHJ5IHtcbiAgICAgIGlmIChjYiA9PT0gZmFsc2UpIHtcbiAgICAgICAgY2hhaW4ucmVqZWN0KHNlbGYubXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjYiA9PT0gdHJ1ZSkge1xuICAgICAgICAgIHJldCA9IHNlbGYubXNnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldCA9IGNiLmNhbGwodm9pZCAwLCBzZWxmLm1zZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJldCA9PT0gY2hhaW4ucHJvbWlzZSkge1xuICAgICAgICAgIGNoYWluLnJlamVjdChUeXBlRXJyb3IoXCJQcm9taXNlLWNoYWluIGN5Y2xlXCIpKTtcbiAgICAgICAgfSBlbHNlIGlmIChfdGhlbiA9IGlzVGhlbmFibGUocmV0KSkge1xuICAgICAgICAgIF90aGVuLmNhbGwocmV0LCBjaGFpbi5yZXNvbHZlLCBjaGFpbi5yZWplY3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNoYWluLnJlc29sdmUocmV0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY2hhaW4ucmVqZWN0KGVycik7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlc29sdmUobXNnKSB7XG4gICAgdmFyIF90aGVuLFxuICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBhbHJlYWR5IHRyaWdnZXJlZD9cbiAgICBpZiAoc2VsZi50cmlnZ2VyZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2VsZi50cmlnZ2VyZWQgPSB0cnVlO1xuXG4gICAgLy8gdW53cmFwXG4gICAgaWYgKHNlbGYuZGVmKSB7XG4gICAgICBzZWxmID0gc2VsZi5kZWY7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBpZiAoX3RoZW4gPSBpc1RoZW5hYmxlKG1zZykpIHtcbiAgICAgICAgc2NoZWR1bGUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBkZWZfd3JhcHBlciA9IG5ldyBNYWtlRGVmV3JhcHBlcihzZWxmKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgX3RoZW4uY2FsbChtc2csIGZ1bmN0aW9uICRyZXNvbHZlJCgpIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZS5hcHBseShkZWZfd3JhcHBlciwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uICRyZWplY3QkKCkge1xuICAgICAgICAgICAgICByZWplY3QuYXBwbHkoZGVmX3dyYXBwZXIsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdC5jYWxsKGRlZl93cmFwcGVyLCBlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLm1zZyA9IG1zZztcbiAgICAgICAgc2VsZi5zdGF0ZSA9IDE7XG4gICAgICAgIGlmIChzZWxmLmNoYWluLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzY2hlZHVsZShub3RpZnksIHNlbGYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZWplY3QuY2FsbChuZXcgTWFrZURlZldyYXBwZXIoc2VsZiksIGVycik7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHJlamVjdChtc2cpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBhbHJlYWR5IHRyaWdnZXJlZD9cbiAgICBpZiAoc2VsZi50cmlnZ2VyZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc2VsZi50cmlnZ2VyZWQgPSB0cnVlO1xuXG4gICAgLy8gdW53cmFwXG4gICAgaWYgKHNlbGYuZGVmKSB7XG4gICAgICBzZWxmID0gc2VsZi5kZWY7XG4gICAgfVxuICAgIHNlbGYubXNnID0gbXNnO1xuICAgIHNlbGYuc3RhdGUgPSAyO1xuICAgIGlmIChzZWxmLmNoYWluLmxlbmd0aCA+IDApIHtcbiAgICAgIHNjaGVkdWxlKG5vdGlmeSwgc2VsZik7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGl0ZXJhdGVQcm9taXNlcyhDb25zdHJ1Y3RvciwgYXJyLCByZXNvbHZlciwgcmVqZWN0ZXIpIHtcbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCBhcnIubGVuZ3RoOyBpZHgrKykge1xuICAgICAgKGZ1bmN0aW9uIElJRkUoaWR4KSB7XG4gICAgICAgIENvbnN0cnVjdG9yLnJlc29sdmUoYXJyW2lkeF0pLnRoZW4oZnVuY3Rpb24gJHJlc29sdmVyJChtc2cpIHtcbiAgICAgICAgICByZXNvbHZlcihpZHgsIG1zZyk7XG4gICAgICAgIH0sIHJlamVjdGVyKTtcbiAgICAgIH0pKGlkeCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIE1ha2VEZWZXcmFwcGVyKHNlbGYpIHtcbiAgICB0aGlzLmRlZiA9IHNlbGY7XG4gICAgdGhpcy50cmlnZ2VyZWQgPSBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiBNYWtlRGVmKHNlbGYpIHtcbiAgICB0aGlzLnByb21pc2UgPSBzZWxmO1xuICAgIHRoaXMuc3RhdGUgPSAwO1xuICAgIHRoaXMudHJpZ2dlcmVkID0gZmFsc2U7XG4gICAgdGhpcy5jaGFpbiA9IFtdO1xuICAgIHRoaXMubXNnID0gdm9pZCAwO1xuICB9XG4gIGZ1bmN0aW9uIFByb21pc2UoZXhlY3V0b3IpIHtcbiAgICBpZiAodHlwZW9mIGV4ZWN1dG9yICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKFwiTm90IGEgZnVuY3Rpb25cIik7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fTlBPX18gIT09IDApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcihcIk5vdCBhIHByb21pc2VcIik7XG4gICAgfVxuXG4gICAgLy8gaW5zdGFuY2Ugc2hhZG93aW5nIHRoZSBpbmhlcml0ZWQgXCJicmFuZFwiXG4gICAgLy8gdG8gc2lnbmFsIGFuIGFscmVhZHkgXCJpbml0aWFsaXplZFwiIHByb21pc2VcbiAgICB0aGlzLl9fTlBPX18gPSAxO1xuICAgIHZhciBkZWYgPSBuZXcgTWFrZURlZih0aGlzKTtcbiAgICB0aGlzW1widGhlblwiXSA9IGZ1bmN0aW9uIHRoZW4oc3VjY2VzcywgZmFpbHVyZSkge1xuICAgICAgdmFyIG8gPSB7XG4gICAgICAgIHN1Y2Nlc3M6IHR5cGVvZiBzdWNjZXNzID09IFwiZnVuY3Rpb25cIiA/IHN1Y2Nlc3MgOiB0cnVlLFxuICAgICAgICBmYWlsdXJlOiB0eXBlb2YgZmFpbHVyZSA9PSBcImZ1bmN0aW9uXCIgPyBmYWlsdXJlIDogZmFsc2VcbiAgICAgIH07XG4gICAgICAvLyBOb3RlOiBgdGhlbiguLilgIGl0c2VsZiBjYW4gYmUgYm9ycm93ZWQgdG8gYmUgdXNlZCBhZ2FpbnN0XG4gICAgICAvLyBhIGRpZmZlcmVudCBwcm9taXNlIGNvbnN0cnVjdG9yIGZvciBtYWtpbmcgdGhlIGNoYWluZWQgcHJvbWlzZSxcbiAgICAgIC8vIGJ5IHN1YnN0aXR1dGluZyBhIGRpZmZlcmVudCBgdGhpc2AgYmluZGluZy5cbiAgICAgIG8ucHJvbWlzZSA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKGZ1bmN0aW9uIGV4dHJhY3RDaGFpbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXNvbHZlICE9IFwiZnVuY3Rpb25cIiB8fCB0eXBlb2YgcmVqZWN0ICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHRocm93IFR5cGVFcnJvcihcIk5vdCBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIG8ucmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgIG8ucmVqZWN0ID0gcmVqZWN0O1xuICAgICAgfSk7XG4gICAgICBkZWYuY2hhaW4ucHVzaChvKTtcbiAgICAgIGlmIChkZWYuc3RhdGUgIT09IDApIHtcbiAgICAgICAgc2NoZWR1bGUobm90aWZ5LCBkZWYpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG8ucHJvbWlzZTtcbiAgICB9O1xuICAgIHRoaXNbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uICRjYXRjaCQoZmFpbHVyZSkge1xuICAgICAgcmV0dXJuIHRoaXMudGhlbih2b2lkIDAsIGZhaWx1cmUpO1xuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIGV4ZWN1dG9yLmNhbGwodm9pZCAwLCBmdW5jdGlvbiBwdWJsaWNSZXNvbHZlKG1zZykge1xuICAgICAgICByZXNvbHZlLmNhbGwoZGVmLCBtc2cpO1xuICAgICAgfSwgZnVuY3Rpb24gcHVibGljUmVqZWN0KG1zZykge1xuICAgICAgICByZWplY3QuY2FsbChkZWYsIG1zZyk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJlamVjdC5jYWxsKGRlZiwgZXJyKTtcbiAgICB9XG4gIH1cbiAgdmFyIFByb21pc2VQcm90b3R5cGUgPSBidWlsdEluUHJvcCh7fSwgXCJjb25zdHJ1Y3RvclwiLCBQcm9taXNlLCAvKmNvbmZpZ3VyYWJsZT0qL2ZhbHNlKTtcblxuICAvLyBOb3RlOiBBbmRyb2lkIDQgY2Fubm90IHVzZSBgT2JqZWN0LmRlZmluZVByb3BlcnR5KC4uKWAgaGVyZVxuICBQcm9taXNlLnByb3RvdHlwZSA9IFByb21pc2VQcm90b3R5cGU7XG5cbiAgLy8gYnVpbHQtaW4gXCJicmFuZFwiIHRvIHNpZ25hbCBhbiBcInVuaW5pdGlhbGl6ZWRcIiBwcm9taXNlXG4gIGJ1aWx0SW5Qcm9wKFByb21pc2VQcm90b3R5cGUsIFwiX19OUE9fX1wiLCAwLCAvKmNvbmZpZ3VyYWJsZT0qL2ZhbHNlKTtcbiAgYnVpbHRJblByb3AoUHJvbWlzZSwgXCJyZXNvbHZlXCIsIGZ1bmN0aW9uIFByb21pc2UkcmVzb2x2ZShtc2cpIHtcbiAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgLy8gc3BlYyBtYW5kYXRlZCBjaGVja3NcbiAgICAvLyBub3RlOiBiZXN0IFwiaXNQcm9taXNlXCIgY2hlY2sgdGhhdCdzIHByYWN0aWNhbCBmb3Igbm93XG4gICAgaWYgKG1zZyAmJiB0eXBlb2YgbXNnID09IFwib2JqZWN0XCIgJiYgbXNnLl9fTlBPX18gPT09IDEpIHtcbiAgICAgIHJldHVybiBtc2c7XG4gICAgfVxuICAgIHJldHVybiBuZXcgQ29uc3RydWN0b3IoZnVuY3Rpb24gZXhlY3V0b3IocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBpZiAodHlwZW9mIHJlc29sdmUgIT0gXCJmdW5jdGlvblwiIHx8IHR5cGVvZiByZWplY3QgIT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcihcIk5vdCBhIGZ1bmN0aW9uXCIpO1xuICAgICAgfVxuICAgICAgcmVzb2x2ZShtc2cpO1xuICAgIH0pO1xuICB9KTtcbiAgYnVpbHRJblByb3AoUHJvbWlzZSwgXCJyZWplY3RcIiwgZnVuY3Rpb24gUHJvbWlzZSRyZWplY3QobXNnKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKGZ1bmN0aW9uIGV4ZWN1dG9yKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWYgKHR5cGVvZiByZXNvbHZlICE9IFwiZnVuY3Rpb25cIiB8fCB0eXBlb2YgcmVqZWN0ICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJOb3QgYSBmdW5jdGlvblwiKTtcbiAgICAgIH1cbiAgICAgIHJlamVjdChtc2cpO1xuICAgIH0pO1xuICB9KTtcbiAgYnVpbHRJblByb3AoUHJvbWlzZSwgXCJhbGxcIiwgZnVuY3Rpb24gUHJvbWlzZSRhbGwoYXJyKSB7XG4gICAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICAgIC8vIHNwZWMgbWFuZGF0ZWQgY2hlY2tzXG4gICAgaWYgKFRvU3RyaW5nLmNhbGwoYXJyKSAhPSBcIltvYmplY3QgQXJyYXldXCIpIHtcbiAgICAgIHJldHVybiBDb25zdHJ1Y3Rvci5yZWplY3QoVHlwZUVycm9yKFwiTm90IGFuIGFycmF5XCIpKTtcbiAgICB9XG4gICAgaWYgKGFyci5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBDb25zdHJ1Y3Rvci5yZXNvbHZlKFtdKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihmdW5jdGlvbiBleGVjdXRvcihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGlmICh0eXBlb2YgcmVzb2x2ZSAhPSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIHJlamVjdCAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiTm90IGEgZnVuY3Rpb25cIik7XG4gICAgICB9XG4gICAgICB2YXIgbGVuID0gYXJyLmxlbmd0aCxcbiAgICAgICAgbXNncyA9IEFycmF5KGxlbiksXG4gICAgICAgIGNvdW50ID0gMDtcbiAgICAgIGl0ZXJhdGVQcm9taXNlcyhDb25zdHJ1Y3RvciwgYXJyLCBmdW5jdGlvbiByZXNvbHZlcihpZHgsIG1zZykge1xuICAgICAgICBtc2dzW2lkeF0gPSBtc2c7XG4gICAgICAgIGlmICgrK2NvdW50ID09PSBsZW4pIHtcbiAgICAgICAgICByZXNvbHZlKG1zZ3MpO1xuICAgICAgICB9XG4gICAgICB9LCByZWplY3QpO1xuICAgIH0pO1xuICB9KTtcbiAgYnVpbHRJblByb3AoUHJvbWlzZSwgXCJyYWNlXCIsIGZ1bmN0aW9uIFByb21pc2UkcmFjZShhcnIpIHtcbiAgICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gICAgLy8gc3BlYyBtYW5kYXRlZCBjaGVja3NcbiAgICBpZiAoVG9TdHJpbmcuY2FsbChhcnIpICE9IFwiW29iamVjdCBBcnJheV1cIikge1xuICAgICAgcmV0dXJuIENvbnN0cnVjdG9yLnJlamVjdChUeXBlRXJyb3IoXCJOb3QgYW4gYXJyYXlcIikpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGZ1bmN0aW9uIGV4ZWN1dG9yKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgaWYgKHR5cGVvZiByZXNvbHZlICE9IFwiZnVuY3Rpb25cIiB8fCB0eXBlb2YgcmVqZWN0ICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJOb3QgYSBmdW5jdGlvblwiKTtcbiAgICAgIH1cbiAgICAgIGl0ZXJhdGVQcm9taXNlcyhDb25zdHJ1Y3RvciwgYXJyLCBmdW5jdGlvbiByZXNvbHZlcihpZHgsIG1zZykge1xuICAgICAgICByZXNvbHZlKG1zZyk7XG4gICAgICB9LCByZWplY3QpO1xuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIFByb21pc2U7XG59KTtcbn0pO1xuXG4vKipcbiAqIEBtb2R1bGUgbGliL2NhbGxiYWNrc1xuICovXG5cbmNvbnN0IGNhbGxiYWNrTWFwID0gbmV3IFdlYWtNYXAoKTtcblxuLyoqXG4gKiBTdG9yZSBhIGNhbGxiYWNrIGZvciBhIG1ldGhvZCBvciBldmVudCBmb3IgYSBwbGF5ZXIuXG4gKlxuICogQHBhcmFtIHtQbGF5ZXJ9IHBsYXllciBUaGUgcGxheWVyIG9iamVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBtZXRob2Qgb3IgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7KGZ1bmN0aW9uKHRoaXM6UGxheWVyLCAqKTogdm9pZHx7cmVzb2x2ZTogZnVuY3Rpb24sIHJlamVjdDogZnVuY3Rpb259KX0gY2FsbGJhY2tcbiAqICAgICAgICBUaGUgY2FsbGJhY2sgdG8gY2FsbCBvciBhbiBvYmplY3Qgd2l0aCByZXNvbHZlIGFuZCByZWplY3QgZnVuY3Rpb25zIGZvciBhIHByb21pc2UuXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBzdG9yZUNhbGxiYWNrKHBsYXllciwgbmFtZSwgY2FsbGJhY2spIHtcbiAgY29uc3QgcGxheWVyQ2FsbGJhY2tzID0gY2FsbGJhY2tNYXAuZ2V0KHBsYXllci5lbGVtZW50KSB8fCB7fTtcbiAgaWYgKCEobmFtZSBpbiBwbGF5ZXJDYWxsYmFja3MpKSB7XG4gICAgcGxheWVyQ2FsbGJhY2tzW25hbWVdID0gW107XG4gIH1cbiAgcGxheWVyQ2FsbGJhY2tzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICBjYWxsYmFja01hcC5zZXQocGxheWVyLmVsZW1lbnQsIHBsYXllckNhbGxiYWNrcyk7XG59XG5cbi8qKlxuICogR2V0IHRoZSBjYWxsYmFja3MgZm9yIGEgcGxheWVyIGFuZCBldmVudCBvciBtZXRob2QuXG4gKlxuICogQHBhcmFtIHtQbGF5ZXJ9IHBsYXllciBUaGUgcGxheWVyIG9iamVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBtZXRob2Qgb3IgZXZlbnQgbmFtZVxuICogQHJldHVybiB7ZnVuY3Rpb25bXX1cbiAqL1xuZnVuY3Rpb24gZ2V0Q2FsbGJhY2tzKHBsYXllciwgbmFtZSkge1xuICBjb25zdCBwbGF5ZXJDYWxsYmFja3MgPSBjYWxsYmFja01hcC5nZXQocGxheWVyLmVsZW1lbnQpIHx8IHt9O1xuICByZXR1cm4gcGxheWVyQ2FsbGJhY2tzW25hbWVdIHx8IFtdO1xufVxuXG4vKipcbiAqIFJlbW92ZSBhIHN0b3JlZCBjYWxsYmFjayBmb3IgYSBtZXRob2Qgb3IgZXZlbnQgZm9yIGEgcGxheWVyLlxuICpcbiAqIEBwYXJhbSB7UGxheWVyfSBwbGF5ZXIgVGhlIHBsYXllciBvYmplY3QuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbWV0aG9kIG9yIGV2ZW50IG5hbWVcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjYWxsYmFja10gVGhlIHNwZWNpZmljIGNhbGxiYWNrIHRvIHJlbW92ZS5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdhcyB0aGlzIHRoZSBsYXN0IGNhbGxiYWNrP1xuICovXG5mdW5jdGlvbiByZW1vdmVDYWxsYmFjayhwbGF5ZXIsIG5hbWUsIGNhbGxiYWNrKSB7XG4gIGNvbnN0IHBsYXllckNhbGxiYWNrcyA9IGNhbGxiYWNrTWFwLmdldChwbGF5ZXIuZWxlbWVudCkgfHwge307XG4gIGlmICghcGxheWVyQ2FsbGJhY2tzW25hbWVdKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBJZiBubyBjYWxsYmFjayBpcyBwYXNzZWQsIHJlbW92ZSBhbGwgY2FsbGJhY2tzIGZvciB0aGUgZXZlbnRcbiAgaWYgKCFjYWxsYmFjaykge1xuICAgIHBsYXllckNhbGxiYWNrc1tuYW1lXSA9IFtdO1xuICAgIGNhbGxiYWNrTWFwLnNldChwbGF5ZXIuZWxlbWVudCwgcGxheWVyQ2FsbGJhY2tzKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBjb25zdCBpbmRleCA9IHBsYXllckNhbGxiYWNrc1tuYW1lXS5pbmRleE9mKGNhbGxiYWNrKTtcbiAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgIHBsYXllckNhbGxiYWNrc1tuYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG4gIGNhbGxiYWNrTWFwLnNldChwbGF5ZXIuZWxlbWVudCwgcGxheWVyQ2FsbGJhY2tzKTtcbiAgcmV0dXJuIHBsYXllckNhbGxiYWNrc1tuYW1lXSAmJiBwbGF5ZXJDYWxsYmFja3NbbmFtZV0ubGVuZ3RoID09PSAwO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgZmlyc3Qgc3RvcmVkIGNhbGxiYWNrIGZvciBhIHBsYXllciBhbmQgZXZlbnQgb3IgbWV0aG9kLlxuICpcbiAqIEBwYXJhbSB7UGxheWVyfSBwbGF5ZXIgVGhlIHBsYXllciBvYmplY3QuXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbWV0aG9kIG9yIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJuIHtmdW5jdGlvbn0gVGhlIGNhbGxiYWNrLCBvciBmYWxzZSBpZiB0aGVyZSB3ZXJlIG5vbmVcbiAqL1xuZnVuY3Rpb24gc2hpZnRDYWxsYmFja3MocGxheWVyLCBuYW1lKSB7XG4gIGNvbnN0IHBsYXllckNhbGxiYWNrcyA9IGdldENhbGxiYWNrcyhwbGF5ZXIsIG5hbWUpO1xuICBpZiAocGxheWVyQ2FsbGJhY2tzLmxlbmd0aCA8IDEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgY2FsbGJhY2sgPSBwbGF5ZXJDYWxsYmFja3Muc2hpZnQoKTtcbiAgcmVtb3ZlQ2FsbGJhY2socGxheWVyLCBuYW1lLCBjYWxsYmFjayk7XG4gIHJldHVybiBjYWxsYmFjaztcbn1cblxuLyoqXG4gKiBNb3ZlIGNhbGxiYWNrcyBhc3NvY2lhdGVkIHdpdGggYW4gZWxlbWVudCB0byBhbm90aGVyIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gb2xkRWxlbWVudCBUaGUgb2xkIGVsZW1lbnQuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBuZXdFbGVtZW50IFRoZSBuZXcgZWxlbWVudC5cbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIHN3YXBDYWxsYmFja3Mob2xkRWxlbWVudCwgbmV3RWxlbWVudCkge1xuICBjb25zdCBwbGF5ZXJDYWxsYmFja3MgPSBjYWxsYmFja01hcC5nZXQob2xkRWxlbWVudCk7XG4gIGNhbGxiYWNrTWFwLnNldChuZXdFbGVtZW50LCBwbGF5ZXJDYWxsYmFja3MpO1xuICBjYWxsYmFja01hcC5kZWxldGUob2xkRWxlbWVudCk7XG59XG5cbi8qKlxuICogQG1vZHVsZSBsaWIvcG9zdG1lc3NhZ2VcbiAqL1xuXG4vKipcbiAqIFBhcnNlIGEgbWVzc2FnZSByZWNlaXZlZCBmcm9tIHBvc3RNZXNzYWdlLlxuICpcbiAqIEBwYXJhbSB7Kn0gZGF0YSBUaGUgZGF0YSByZWNlaXZlZCBmcm9tIHBvc3RNZXNzYWdlLlxuICogQHJldHVybiB7b2JqZWN0fVxuICovXG5mdW5jdGlvbiBwYXJzZU1lc3NhZ2VEYXRhKGRhdGEpIHtcbiAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgIHRyeSB7XG4gICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gSWYgdGhlIG1lc3NhZ2UgY2Fubm90IGJlIHBhcnNlZCwgdGhyb3cgdGhlIGVycm9yIGFzIGEgd2FybmluZ1xuICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRhdGE7XG59XG5cbi8qKlxuICogUG9zdCBhIG1lc3NhZ2UgdG8gdGhlIHNwZWNpZmllZCB0YXJnZXQuXG4gKlxuICogQHBhcmFtIHtQbGF5ZXJ9IHBsYXllciBUaGUgcGxheWVyIG9iamVjdCB0byB1c2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kIFRoZSBBUEkgbWV0aG9kIHRvIGNhbGwuXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8b2JqZWN0fEFycmF5fHVuZGVmaW5lZH0gcGFyYW1zIFRoZSBwYXJhbWV0ZXJzIHRvIHNlbmQgdG8gdGhlIHBsYXllci5cbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIHBvc3RNZXNzYWdlKHBsYXllciwgbWV0aG9kLCBwYXJhbXMpIHtcbiAgaWYgKCFwbGF5ZXIuZWxlbWVudC5jb250ZW50V2luZG93IHx8ICFwbGF5ZXIuZWxlbWVudC5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBtZXNzYWdlID0ge1xuICAgIG1ldGhvZFxuICB9O1xuICBpZiAocGFyYW1zICE9PSB1bmRlZmluZWQpIHtcbiAgICBtZXNzYWdlLnZhbHVlID0gcGFyYW1zO1xuICB9XG5cbiAgLy8gSUUgOCBhbmQgOSBkbyBub3Qgc3VwcG9ydCBwYXNzaW5nIG1lc3NhZ2VzLCBzbyBzdHJpbmdpZnkgdGhlbVxuICBjb25zdCBpZVZlcnNpb24gPSBwYXJzZUZsb2F0KG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9eLiptc2llIChcXGQrKS4qJC8sICckMScpKTtcbiAgaWYgKGllVmVyc2lvbiA+PSA4ICYmIGllVmVyc2lvbiA8IDEwKSB7XG4gICAgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpO1xuICB9XG4gIHBsYXllci5lbGVtZW50LmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UobWVzc2FnZSwgcGxheWVyLm9yaWdpbik7XG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGRhdGEgcmVjZWl2ZWQgZnJvbSBhIG1lc3NhZ2UgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtQbGF5ZXJ9IHBsYXllciBUaGUgcGxheWVyIHRoYXQgcmVjZWl2ZWQgdGhlIG1lc3NhZ2UuXG4gKiBAcGFyYW0geyhPYmplY3R8c3RyaW5nKX0gZGF0YSBUaGUgbWVzc2FnZSBkYXRhLiBTdHJpbmdzIHdpbGwgYmUgcGFyc2VkIGludG8gSlNPTi5cbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIHByb2Nlc3NEYXRhKHBsYXllciwgZGF0YSkge1xuICBkYXRhID0gcGFyc2VNZXNzYWdlRGF0YShkYXRhKTtcbiAgbGV0IGNhbGxiYWNrcyA9IFtdO1xuICBsZXQgcGFyYW07XG4gIGlmIChkYXRhLmV2ZW50KSB7XG4gICAgaWYgKGRhdGEuZXZlbnQgPT09ICdlcnJvcicpIHtcbiAgICAgIGNvbnN0IHByb21pc2VzID0gZ2V0Q2FsbGJhY2tzKHBsYXllciwgZGF0YS5kYXRhLm1ldGhvZCk7XG4gICAgICBwcm9taXNlcy5mb3JFYWNoKHByb21pc2UgPT4ge1xuICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihkYXRhLmRhdGEubWVzc2FnZSk7XG4gICAgICAgIGVycm9yLm5hbWUgPSBkYXRhLmRhdGEubmFtZTtcbiAgICAgICAgcHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICByZW1vdmVDYWxsYmFjayhwbGF5ZXIsIGRhdGEuZGF0YS5tZXRob2QsIHByb21pc2UpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNhbGxiYWNrcyA9IGdldENhbGxiYWNrcyhwbGF5ZXIsIGBldmVudDoke2RhdGEuZXZlbnR9YCk7XG4gICAgcGFyYW0gPSBkYXRhLmRhdGE7XG4gIH0gZWxzZSBpZiAoZGF0YS5tZXRob2QpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9IHNoaWZ0Q2FsbGJhY2tzKHBsYXllciwgZGF0YS5tZXRob2QpO1xuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgcGFyYW0gPSBkYXRhLnZhbHVlO1xuICAgIH1cbiAgfVxuICBjYWxsYmFja3MuZm9yRWFjaChjYWxsYmFjayA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChwbGF5ZXIsIHBhcmFtKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2FsbGJhY2sucmVzb2x2ZShwYXJhbSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gZW1wdHlcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIEBtb2R1bGUgbGliL2VtYmVkXG4gKi9cbmNvbnN0IG9FbWJlZFBhcmFtZXRlcnMgPSBbJ2FpcnBsYXknLCAnYXVkaW9fdHJhY2tzJywgJ2F1ZGlvdHJhY2snLCAnYXV0b3BhdXNlJywgJ2F1dG9wbGF5JywgJ2JhY2tncm91bmQnLCAnYnlsaW5lJywgJ2NjJywgJ2NoYXB0ZXJfaWQnLCAnY2hhcHRlcnMnLCAnY2hyb21lY2FzdCcsICdjb2xvcicsICdjb2xvcnMnLCAnY29udHJvbHMnLCAnZG50JywgJ2VuZF90aW1lJywgJ2Z1bGxzY3JlZW4nLCAnaGVpZ2h0JywgJ2lkJywgJ2luaXRpYWxfcXVhbGl0eScsICdpbnRlcmFjdGl2ZV9wYXJhbXMnLCAna2V5Ym9hcmQnLCAnbG9vcCcsICdtYXhoZWlnaHQnLCAnbWF4X3F1YWxpdHknLCAnbWF4d2lkdGgnLCAnbWluX3F1YWxpdHknLCAnbXV0ZWQnLCAncGxheV9idXR0b25fcG9zaXRpb24nLCAncGxheXNpbmxpbmUnLCAncG9ydHJhaXQnLCAncHJlbG9hZCcsICdwcm9ncmVzc19iYXInLCAncXVhbGl0eScsICdxdWFsaXR5X3NlbGVjdG9yJywgJ3Jlc3BvbnNpdmUnLCAnc2tpcHBpbmdfZm9yd2FyZCcsICdzcGVlZCcsICdzdGFydF90aW1lJywgJ3RleHR0cmFjaycsICd0aHVtYm5haWxfaWQnLCAndGl0bGUnLCAndHJhbnNjcmlwdCcsICd0cmFuc3BhcmVudCcsICd1bm11dGVfYnV0dG9uJywgJ3VybCcsICd2aW1lb19sb2dvJywgJ3ZvbHVtZScsICd3YXRjaF9mdWxsX3ZpZGVvJywgJ3dpZHRoJ107XG5cbi8qKlxuICogR2V0IHRoZSAnZGF0YS12aW1lbyctcHJlZml4ZWQgYXR0cmlidXRlcyBmcm9tIGFuIGVsZW1lbnQgYXMgYW4gb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0ge09iamVjdH0gW2RlZmF1bHRzPXt9XSBUaGUgZGVmYXVsdCB2YWx1ZXMgdG8gdXNlLlxuICogQHJldHVybiB7T2JqZWN0PHN0cmluZywgc3RyaW5nPn1cbiAqL1xuZnVuY3Rpb24gZ2V0T0VtYmVkUGFyYW1ldGVycyhlbGVtZW50KSB7XG4gIGxldCBkZWZhdWx0cyA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDoge307XG4gIHJldHVybiBvRW1iZWRQYXJhbWV0ZXJzLnJlZHVjZSgocGFyYW1zLCBwYXJhbSkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoYGRhdGEtdmltZW8tJHtwYXJhbX1gKTtcbiAgICBpZiAodmFsdWUgfHwgdmFsdWUgPT09ICcnKSB7XG4gICAgICBwYXJhbXNbcGFyYW1dID0gdmFsdWUgPT09ICcnID8gMSA6IHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gcGFyYW1zO1xuICB9LCBkZWZhdWx0cyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIGVtYmVkIGZyb20gb0VtYmVkIGRhdGEgaW5zaWRlIGFuIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIG9FbWJlZCBkYXRhLlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBwdXQgdGhlIGlmcmFtZSBpbi5cbiAqIEByZXR1cm4ge0hUTUxJRnJhbWVFbGVtZW50fSBUaGUgaWZyYW1lIGVtYmVkLlxuICovXG5mdW5jdGlvbiBjcmVhdGVFbWJlZChfcmVmLCBlbGVtZW50KSB7XG4gIGxldCB7XG4gICAgaHRtbFxuICB9ID0gX3JlZjtcbiAgaWYgKCFlbGVtZW50KSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQW4gZWxlbWVudCBtdXN0IGJlIHByb3ZpZGVkJyk7XG4gIH1cbiAgaWYgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXZpbWVvLWluaXRpYWxpemVkJykgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdpZnJhbWUnKTtcbiAgfVxuICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LmlubmVySFRNTCA9IGh0bWw7XG4gIGVsZW1lbnQuYXBwZW5kQ2hpbGQoZGl2LmZpcnN0Q2hpbGQpO1xuICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnZGF0YS12aW1lby1pbml0aWFsaXplZCcsICd0cnVlJyk7XG4gIHJldHVybiBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lmcmFtZScpO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gb0VtYmVkIGNhbGwgZm9yIHRoZSBzcGVjaWZpZWQgVVJMLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB2aWRlb1VybCBUaGUgdmltZW8uY29tIHVybCBmb3IgdGhlIHZpZGVvLlxuICogQHBhcmFtIHtPYmplY3R9IFtwYXJhbXNdIFBhcmFtZXRlcnMgdG8gcGFzcyB0byBvRW1iZWQuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50LlxuICogQHJldHVybiB7UHJvbWlzZX1cbiAqL1xuZnVuY3Rpb24gZ2V0T0VtYmVkRGF0YSh2aWRlb1VybCkge1xuICBsZXQgcGFyYW1zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgbGV0IGVsZW1lbnQgPSBhcmd1bWVudHMubGVuZ3RoID4gMiA/IGFyZ3VtZW50c1syXSA6IHVuZGVmaW5lZDtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBpZiAoIWlzVmltZW9VcmwodmlkZW9VcmwpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGDigJwke3ZpZGVvVXJsfeKAnSBpcyBub3QgYSB2aW1lby5jb20gdXJsLmApO1xuICAgIH1cbiAgICBjb25zdCBkb21haW4gPSBnZXRPZW1iZWREb21haW4odmlkZW9VcmwpO1xuICAgIGxldCB1cmwgPSBgaHR0cHM6Ly8ke2RvbWFpbn0vYXBpL29lbWJlZC5qc29uP3VybD0ke2VuY29kZVVSSUNvbXBvbmVudCh2aWRlb1VybCl9YDtcbiAgICBmb3IgKGNvbnN0IHBhcmFtIGluIHBhcmFtcykge1xuICAgICAgaWYgKHBhcmFtcy5oYXNPd25Qcm9wZXJ0eShwYXJhbSkpIHtcbiAgICAgICAgdXJsICs9IGAmJHtwYXJhbX09JHtlbmNvZGVVUklDb21wb25lbnQocGFyYW1zW3BhcmFtXSl9YDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgeGhyID0gJ1hEb21haW5SZXF1ZXN0JyBpbiB3aW5kb3cgPyBuZXcgWERvbWFpblJlcXVlc3QoKSA6IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoYOKAnCR7dmlkZW9Vcmx94oCdIHdhcyBub3QgZm91bmQuYCkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gNDAzKSB7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoYOKAnCR7dmlkZW9Vcmx94oCdIGlzIG5vdCBlbWJlZGRhYmxlLmApKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIC8vIENoZWNrIGFwaSByZXNwb25zZSBmb3IgNDAzIG9uIG9lbWJlZFxuICAgICAgICBpZiAoanNvbi5kb21haW5fc3RhdHVzX2NvZGUgPT09IDQwMykge1xuICAgICAgICAgIC8vIFdlIHN0aWxsIHdhbnQgdG8gY3JlYXRlIHRoZSBlbWJlZCB0byBnaXZlIHVzZXJzIHZpc3VhbCBmZWVkYmFja1xuICAgICAgICAgIGNyZWF0ZUVtYmVkKGpzb24sIGVsZW1lbnQpO1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYOKAnCR7dmlkZW9Vcmx94oCdIGlzIG5vdCBlbWJlZGRhYmxlLmApKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShqc29uKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfTtcbiAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHhoci5zdGF0dXMgPyBgICgke3hoci5zdGF0dXN9KWAgOiAnJztcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoYFRoZXJlIHdhcyBhbiBlcnJvciBmZXRjaGluZyB0aGUgZW1iZWQgY29kZSBmcm9tIFZpbWVvJHtzdGF0dXN9LmApKTtcbiAgICB9O1xuICAgIHhoci5zZW5kKCk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemUgYWxsIGVtYmVkcyB3aXRoaW4gYSBzcGVjaWZpYyBlbGVtZW50XG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW3BhcmVudD1kb2N1bWVudF0gVGhlIHBhcmVudCBlbGVtZW50LlxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gaW5pdGlhbGl6ZUVtYmVkcygpIHtcbiAgbGV0IHBhcmVudCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogZG9jdW1lbnQ7XG4gIGNvbnN0IGVsZW1lbnRzID0gW10uc2xpY2UuY2FsbChwYXJlbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdmltZW8taWRdLCBbZGF0YS12aW1lby11cmxdJykpO1xuICBjb25zdCBoYW5kbGVFcnJvciA9IGVycm9yID0+IHtcbiAgICBpZiAoJ2NvbnNvbGUnIGluIHdpbmRvdyAmJiBjb25zb2xlLmVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBUaGVyZSB3YXMgYW4gZXJyb3IgY3JlYXRpbmcgYW4gZW1iZWQ6ICR7ZXJyb3J9YCk7XG4gICAgfVxuICB9O1xuICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBTa2lwIGFueSB0aGF0IGhhdmUgZGF0YS12aW1lby1kZWZlclxuICAgICAgaWYgKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXZpbWVvLWRlZmVyJykgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcGFyYW1zID0gZ2V0T0VtYmVkUGFyYW1ldGVycyhlbGVtZW50KTtcbiAgICAgIGNvbnN0IHVybCA9IGdldFZpbWVvVXJsKHBhcmFtcyk7XG4gICAgICBnZXRPRW1iZWREYXRhKHVybCwgcGFyYW1zLCBlbGVtZW50KS50aGVuKGRhdGEgPT4ge1xuICAgICAgICByZXR1cm4gY3JlYXRlRW1iZWQoZGF0YSwgZWxlbWVudCk7XG4gICAgICB9KS5jYXRjaChoYW5kbGVFcnJvcik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGhhbmRsZUVycm9yKGVycm9yKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIFJlc2l6ZSBlbWJlZHMgd2hlbiBtZXNzYWdlZCBieSB0aGUgcGxheWVyLlxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IFtwYXJlbnQ9ZG9jdW1lbnRdIFRoZSBwYXJlbnQgZWxlbWVudC5cbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIHJlc2l6ZUVtYmVkcygpIHtcbiAgbGV0IHBhcmVudCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogZG9jdW1lbnQ7XG4gIC8vIFByZXZlbnQgZXhlY3V0aW9uIGlmIHVzZXJzIGluY2x1ZGUgdGhlIHBsYXllci5qcyBzY3JpcHQgbXVsdGlwbGUgdGltZXMuXG4gIGlmICh3aW5kb3cuVmltZW9QbGF5ZXJSZXNpemVFbWJlZHNfKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHdpbmRvdy5WaW1lb1BsYXllclJlc2l6ZUVtYmVkc18gPSB0cnVlO1xuICBjb25zdCBvbk1lc3NhZ2UgPSBldmVudCA9PiB7XG4gICAgaWYgKCFpc1ZpbWVvVXJsKGV2ZW50Lm9yaWdpbikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyAnc3BhY2VjaGFuZ2UnIGlzIGZpcmVkIG9ubHkgb24gZW1iZWRzIHdpdGggY2FyZHNcbiAgICBpZiAoIWV2ZW50LmRhdGEgfHwgZXZlbnQuZGF0YS5ldmVudCAhPT0gJ3NwYWNlY2hhbmdlJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzZW5kZXJJRnJhbWUgPSBldmVudC5zb3VyY2UgPyBmaW5kSWZyYW1lQnlTb3VyY2VXaW5kb3coZXZlbnQuc291cmNlLCBwYXJlbnQpIDogbnVsbDtcbiAgICBpZiAoc2VuZGVySUZyYW1lKSB7XG4gICAgICAvLyBDaGFuZ2UgcGFkZGluZy1ib3R0b20gb2YgdGhlIGVuY2xvc2luZyBkaXYgdG8gYWNjb21tb2RhdGVcbiAgICAgIC8vIGNhcmQgY2Fyb3VzZWwgd2l0aG91dCBkaXN0b3J0aW5nIGFzcGVjdCByYXRpb1xuICAgICAgY29uc3Qgc3BhY2UgPSBzZW5kZXJJRnJhbWUucGFyZW50RWxlbWVudDtcbiAgICAgIHNwYWNlLnN0eWxlLnBhZGRpbmdCb3R0b20gPSBgJHtldmVudC5kYXRhLmRhdGFbMF0uYm90dG9tfXB4YDtcbiAgICB9XG4gIH07XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25NZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBBZGQgY2hhcHRlcnMgdG8gZXhpc3RpbmcgbWV0YWRhdGEgZm9yIEdvb2dsZSBTRU9cbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBbcGFyZW50PWRvY3VtZW50XSBUaGUgcGFyZW50IGVsZW1lbnQuXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBpbml0QXBwZW5kVmlkZW9NZXRhZGF0YSgpIHtcbiAgbGV0IHBhcmVudCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogZG9jdW1lbnQ7XG4gIC8vICBQcmV2ZW50IGV4ZWN1dGlvbiBpZiB1c2VycyBpbmNsdWRlIHRoZSBwbGF5ZXIuanMgc2NyaXB0IG11bHRpcGxlIHRpbWVzLlxuICBpZiAod2luZG93LlZpbWVvU2VvTWV0YWRhdGFBcHBlbmRlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICB3aW5kb3cuVmltZW9TZW9NZXRhZGF0YUFwcGVuZGVkID0gdHJ1ZTtcbiAgY29uc3Qgb25NZXNzYWdlID0gZXZlbnQgPT4ge1xuICAgIGlmICghaXNWaW1lb1VybChldmVudC5vcmlnaW4pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGRhdGEgPSBwYXJzZU1lc3NhZ2VEYXRhKGV2ZW50LmRhdGEpO1xuICAgIGlmICghZGF0YSB8fCBkYXRhLmV2ZW50ICE9PSAncmVhZHknKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNlbmRlcklGcmFtZSA9IGV2ZW50LnNvdXJjZSA/IGZpbmRJZnJhbWVCeVNvdXJjZVdpbmRvdyhldmVudC5zb3VyY2UsIHBhcmVudCkgOiBudWxsO1xuXG4gICAgLy8gSW5pdGlhdGUgYXBwZW5kVmlkZW9NZXRhZGF0YSBpZiBpZnJhbWUgaXMgYSBWaW1lbyBlbWJlZFxuICAgIGlmIChzZW5kZXJJRnJhbWUgJiYgaXNWaW1lb0VtYmVkKHNlbmRlcklGcmFtZS5zcmMpKSB7XG4gICAgICBjb25zdCBwbGF5ZXIgPSBuZXcgUGxheWVyKHNlbmRlcklGcmFtZSk7XG4gICAgICBwbGF5ZXIuY2FsbE1ldGhvZCgnYXBwZW5kVmlkZW9NZXRhZGF0YScsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICB9XG4gIH07XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25NZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBTZWVrIHRvIHRpbWUgaW5kaWNhdGVkIGJ5IHZpbWVvX3QgcXVlcnkgcGFyYW1ldGVyIGlmIHByZXNlbnQgaW4gVVJMXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gW3BhcmVudD1kb2N1bWVudF0gVGhlIHBhcmVudCBlbGVtZW50LlxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gY2hlY2tVcmxUaW1lUGFyYW0oKSB7XG4gIGxldCBwYXJlbnQgPSBhcmd1bWVudHMubGVuZ3RoID4gMCAmJiBhcmd1bWVudHNbMF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1swXSA6IGRvY3VtZW50O1xuICAvLyAgUHJldmVudCBleGVjdXRpb24gaWYgdXNlcnMgaW5jbHVkZSB0aGUgcGxheWVyLmpzIHNjcmlwdCBtdWx0aXBsZSB0aW1lcy5cbiAgaWYgKHdpbmRvdy5WaW1lb0NoZWNrZWRVcmxUaW1lUGFyYW0pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgd2luZG93LlZpbWVvQ2hlY2tlZFVybFRpbWVQYXJhbSA9IHRydWU7XG4gIGNvbnN0IGhhbmRsZUVycm9yID0gZXJyb3IgPT4ge1xuICAgIGlmICgnY29uc29sZScgaW4gd2luZG93ICYmIGNvbnNvbGUuZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFRoZXJlIHdhcyBhbiBlcnJvciBnZXR0aW5nIHZpZGVvIElkOiAke2Vycm9yfWApO1xuICAgIH1cbiAgfTtcbiAgY29uc3Qgb25NZXNzYWdlID0gZXZlbnQgPT4ge1xuICAgIGlmICghaXNWaW1lb1VybChldmVudC5vcmlnaW4pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGRhdGEgPSBwYXJzZU1lc3NhZ2VEYXRhKGV2ZW50LmRhdGEpO1xuICAgIGlmICghZGF0YSB8fCBkYXRhLmV2ZW50ICE9PSAncmVhZHknKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNlbmRlcklGcmFtZSA9IGV2ZW50LnNvdXJjZSA/IGZpbmRJZnJhbWVCeVNvdXJjZVdpbmRvdyhldmVudC5zb3VyY2UsIHBhcmVudCkgOiBudWxsO1xuICAgIGlmIChzZW5kZXJJRnJhbWUgJiYgaXNWaW1lb0VtYmVkKHNlbmRlcklGcmFtZS5zcmMpKSB7XG4gICAgICBjb25zdCBwbGF5ZXIgPSBuZXcgUGxheWVyKHNlbmRlcklGcmFtZSk7XG4gICAgICBwbGF5ZXIuZ2V0VmlkZW9JZCgpLnRoZW4odmlkZW9JZCA9PiB7XG4gICAgICAgIGNvbnN0IG1hdGNoZXMgPSBuZXcgUmVnRXhwKGBbPyZddmltZW9fdF8ke3ZpZGVvSWR9PShbXiYjXSopYCkuZXhlYyh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgIGlmIChtYXRjaGVzICYmIG1hdGNoZXNbMV0pIHtcbiAgICAgICAgICBjb25zdCBzZWMgPSBkZWNvZGVVUkkobWF0Y2hlc1sxXSk7XG4gICAgICAgICAgcGxheWVyLnNldEN1cnJlbnRUaW1lKHNlYyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSkuY2F0Y2goaGFuZGxlRXJyb3IpO1xuICAgIH1cbiAgfTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgaWZyYW1lIGVtYmVkcyB0byBzdXBwb3J0IERSTSBjb250ZW50IHBsYXliYWNrIGJ5IGFkZGluZyB0aGUgJ2VuY3J5cHRlZC1tZWRpYScgcGVybWlzc2lvblxuICogdG8gdGhlIGlmcmFtZSdzIGFsbG93IGF0dHJpYnV0ZSB3aGVuIERSTSBpbml0aWFsaXphdGlvbiBmYWlscy4gVGhpcyBmdW5jdGlvbiBhY3RzIGFzIGEgZmFsbGJhY2tcbiAqIG1lY2hhbmlzbSB0byBlbmFibGUgcGxheWJhY2sgb2YgRFJNLXByb3RlY3RlZCBjb250ZW50IGluIGVtYmVkcyB0aGF0IHdlcmVuJ3QgcHJvcGVybHkgY29uZmlndXJlZC5cbiAqXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiB1cGRhdGVEUk1FbWJlZHMoKSB7XG4gIGlmICh3aW5kb3cuVmltZW9EUk1FbWJlZHNVcGRhdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHdpbmRvdy5WaW1lb0RSTUVtYmVkc1VwZGF0ZWQgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBIYW5kbGUgbWVzc2FnZSBldmVudHMgZm9yIERSTSBpbml0aWFsaXphdGlvbiBmYWlsdXJlc1xuICAgKiBAcGFyYW0ge01lc3NhZ2VFdmVudH0gZXZlbnQgLSBUaGUgbWVzc2FnZSBldmVudCBmcm9tIHRoZSBpZnJhbWVcbiAgICovXG4gIGNvbnN0IG9uTWVzc2FnZSA9IGV2ZW50ID0+IHtcbiAgICBpZiAoIWlzVmltZW9VcmwoZXZlbnQub3JpZ2luKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBkYXRhID0gcGFyc2VNZXNzYWdlRGF0YShldmVudC5kYXRhKTtcbiAgICBpZiAoIWRhdGEgfHwgZGF0YS5ldmVudCAhPT0gJ2RybWluaXRmYWlsZWQnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNlbmRlcklGcmFtZSA9IGV2ZW50LnNvdXJjZSA/IGZpbmRJZnJhbWVCeVNvdXJjZVdpbmRvdyhldmVudC5zb3VyY2UpIDogbnVsbDtcbiAgICBpZiAoIXNlbmRlcklGcmFtZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50QWxsb3cgPSBzZW5kZXJJRnJhbWUuZ2V0QXR0cmlidXRlKCdhbGxvdycpIHx8ICcnO1xuICAgIGNvbnN0IGFsbG93U3VwcG9ydHNEUk0gPSBjdXJyZW50QWxsb3cuaW5jbHVkZXMoJ2VuY3J5cHRlZC1tZWRpYScpO1xuICAgIGlmICghYWxsb3dTdXBwb3J0c0RSTSkge1xuICAgICAgLy8gRm9yIERSTSBwbGF5YmFjayB0byBzdWNjZXNzZnVsbHkgb2NjdXIsIHRoZSBpZnJhbWUgYGFsbG93YCBhdHRyaWJ1dGUgbXVzdCBpbmNsdWRlICdlbmNyeXB0ZWQtbWVkaWEnLlxuICAgICAgLy8gSWYgdGhlIHZpZGVvIHJlcXVpcmVzIERSTSBidXQgZG9lc24ndCBoYXZlIHRoZSBhdHRyaWJ1dGUsIHdlIHRyeSB0byBhZGQgb24gYmVoYWxmIG9mIHRoZSBlbWJlZCBvd25lclxuICAgICAgLy8gYXMgYSB0ZW1wb3JhcnkgbWVhc3VyZSB0byBlbmFibGUgcGxheWJhY2sgdW50aWwgdGhleSdyZSBhYmxlIHRvIHVwZGF0ZSB0aGVpciBlbWJlZHMuXG4gICAgICBzZW5kZXJJRnJhbWUuc2V0QXR0cmlidXRlKCdhbGxvdycsIGAke2N1cnJlbnRBbGxvd307IGVuY3J5cHRlZC1tZWRpYWApO1xuICAgICAgY29uc3QgY3VycmVudFVybCA9IG5ldyBVUkwoc2VuZGVySUZyYW1lLmdldEF0dHJpYnV0ZSgnc3JjJykpO1xuXG4gICAgICAvLyBBZGRpbmcgdGhpcyBmb3JjZXMgdGhlIGVtYmVkIHRvIHJlbG9hZCBvbmNlIGBhbGxvd2AgaGFzIGJlZW4gdXBkYXRlZCB3aXRoIGBlbmNyeXB0ZWQtbWVkaWFgLlxuICAgICAgY3VycmVudFVybC5zZWFyY2hQYXJhbXMuc2V0KCdmb3JjZXJlbG9hZCcsICdkcm0nKTtcbiAgICAgIHNlbmRlcklGcmFtZS5zZXRBdHRyaWJ1dGUoJ3NyYycsIGN1cnJlbnRVcmwudG9TdHJpbmcoKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTWVzc2FnZSk7XG59XG5cbi8qIE1JVCBMaWNlbnNlXG5cbkNvcHlyaWdodCAoYykgU2luZHJlIFNvcmh1cyA8c2luZHJlc29yaHVzQGdtYWlsLmNvbT4gKHNpbmRyZXNvcmh1cy5jb20pXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblRlcm1zICovXG5cbmZ1bmN0aW9uIGluaXRpYWxpemVTY3JlZW5mdWxsKCkge1xuICBjb25zdCBmbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgdmFsO1xuICAgIGNvbnN0IGZuTWFwID0gW1sncmVxdWVzdEZ1bGxzY3JlZW4nLCAnZXhpdEZ1bGxzY3JlZW4nLCAnZnVsbHNjcmVlbkVsZW1lbnQnLCAnZnVsbHNjcmVlbkVuYWJsZWQnLCAnZnVsbHNjcmVlbmNoYW5nZScsICdmdWxsc2NyZWVuZXJyb3InXSxcbiAgICAvLyBOZXcgV2ViS2l0XG4gICAgWyd3ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbicsICd3ZWJraXRFeGl0RnVsbHNjcmVlbicsICd3ZWJraXRGdWxsc2NyZWVuRWxlbWVudCcsICd3ZWJraXRGdWxsc2NyZWVuRW5hYmxlZCcsICd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlJywgJ3dlYmtpdGZ1bGxzY3JlZW5lcnJvciddLFxuICAgIC8vIE9sZCBXZWJLaXRcbiAgICBbJ3dlYmtpdFJlcXVlc3RGdWxsU2NyZWVuJywgJ3dlYmtpdENhbmNlbEZ1bGxTY3JlZW4nLCAnd2Via2l0Q3VycmVudEZ1bGxTY3JlZW5FbGVtZW50JywgJ3dlYmtpdENhbmNlbEZ1bGxTY3JlZW4nLCAnd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsICd3ZWJraXRmdWxsc2NyZWVuZXJyb3InXSwgWydtb3pSZXF1ZXN0RnVsbFNjcmVlbicsICdtb3pDYW5jZWxGdWxsU2NyZWVuJywgJ21vekZ1bGxTY3JlZW5FbGVtZW50JywgJ21vekZ1bGxTY3JlZW5FbmFibGVkJywgJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCAnbW96ZnVsbHNjcmVlbmVycm9yJ10sIFsnbXNSZXF1ZXN0RnVsbHNjcmVlbicsICdtc0V4aXRGdWxsc2NyZWVuJywgJ21zRnVsbHNjcmVlbkVsZW1lbnQnLCAnbXNGdWxsc2NyZWVuRW5hYmxlZCcsICdNU0Z1bGxzY3JlZW5DaGFuZ2UnLCAnTVNGdWxsc2NyZWVuRXJyb3InXV07XG4gICAgbGV0IGkgPSAwO1xuICAgIGNvbnN0IGwgPSBmbk1hcC5sZW5ndGg7XG4gICAgY29uc3QgcmV0ID0ge307XG4gICAgZm9yICg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhbCA9IGZuTWFwW2ldO1xuICAgICAgaWYgKHZhbCAmJiB2YWxbMV0gaW4gZG9jdW1lbnQpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHJldFtmbk1hcFswXVtpXV0gPSB2YWxbaV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KCk7XG4gIGNvbnN0IGV2ZW50TmFtZU1hcCA9IHtcbiAgICBmdWxsc2NyZWVuY2hhbmdlOiBmbi5mdWxsc2NyZWVuY2hhbmdlLFxuICAgIGZ1bGxzY3JlZW5lcnJvcjogZm4uZnVsbHNjcmVlbmVycm9yXG4gIH07XG4gIGNvbnN0IHNjcmVlbmZ1bGwgPSB7XG4gICAgcmVxdWVzdChlbGVtZW50KSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBvbkZ1bGxTY3JlZW5FbnRlcmVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHNjcmVlbmZ1bGwub2ZmKCdmdWxsc2NyZWVuY2hhbmdlJywgb25GdWxsU2NyZWVuRW50ZXJlZCk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9O1xuICAgICAgICBzY3JlZW5mdWxsLm9uKCdmdWxsc2NyZWVuY2hhbmdlJywgb25GdWxsU2NyZWVuRW50ZXJlZCk7XG4gICAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgY29uc3QgcmV0dXJuUHJvbWlzZSA9IGVsZW1lbnRbZm4ucmVxdWVzdEZ1bGxzY3JlZW5dKCk7XG4gICAgICAgIGlmIChyZXR1cm5Qcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICAgIHJldHVyblByb21pc2UudGhlbihvbkZ1bGxTY3JlZW5FbnRlcmVkKS5jYXRjaChyZWplY3QpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGV4aXQoKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoIXNjcmVlbmZ1bGwuaXNGdWxsc2NyZWVuKSB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvbkZ1bGxTY3JlZW5FeGl0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHNjcmVlbmZ1bGwub2ZmKCdmdWxsc2NyZWVuY2hhbmdlJywgb25GdWxsU2NyZWVuRXhpdCk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9O1xuICAgICAgICBzY3JlZW5mdWxsLm9uKCdmdWxsc2NyZWVuY2hhbmdlJywgb25GdWxsU2NyZWVuRXhpdCk7XG4gICAgICAgIGNvbnN0IHJldHVyblByb21pc2UgPSBkb2N1bWVudFtmbi5leGl0RnVsbHNjcmVlbl0oKTtcbiAgICAgICAgaWYgKHJldHVyblByb21pc2UgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgICAgcmV0dXJuUHJvbWlzZS50aGVuKG9uRnVsbFNjcmVlbkV4aXQpLmNhdGNoKHJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgb24oZXZlbnQsIGNhbGxiYWNrKSB7XG4gICAgICBjb25zdCBldmVudE5hbWUgPSBldmVudE5hbWVNYXBbZXZlbnRdO1xuICAgICAgaWYgKGV2ZW50TmFtZSkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgY2FsbGJhY2spO1xuICAgICAgfVxuICAgIH0sXG4gICAgb2ZmKGV2ZW50LCBjYWxsYmFjaykge1xuICAgICAgY29uc3QgZXZlbnROYW1lID0gZXZlbnROYW1lTWFwW2V2ZW50XTtcbiAgICAgIGlmIChldmVudE5hbWUpIHtcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHNjcmVlbmZ1bGwsIHtcbiAgICBpc0Z1bGxzY3JlZW46IHtcbiAgICAgIGdldCgpIHtcbiAgICAgICAgcmV0dXJuIEJvb2xlYW4oZG9jdW1lbnRbZm4uZnVsbHNjcmVlbkVsZW1lbnRdKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGVsZW1lbnQ6IHtcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBnZXQoKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudFtmbi5mdWxsc2NyZWVuRWxlbWVudF07XG4gICAgICB9XG4gICAgfSxcbiAgICBpc0VuYWJsZWQ6IHtcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBnZXQoKSB7XG4gICAgICAgIC8vIENvZXJjZSB0byBib29sZWFuIGluIGNhc2Ugb2Ygb2xkIFdlYktpdFxuICAgICAgICByZXR1cm4gQm9vbGVhbihkb2N1bWVudFtmbi5mdWxsc2NyZWVuRW5hYmxlZF0pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIHJldHVybiBzY3JlZW5mdWxsO1xufVxuXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi90aW1pbmctc3JjLWNvbm5lY3Rvci50eXBlcycpLlBsYXllckNvbnRyb2xzfSBQbGF5ZXJDb250cm9scyAqL1xuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJ3RpbWluZy1vYmplY3QnKS5JVGltaW5nT2JqZWN0fSBUaW1pbmdPYmplY3QgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuL3RpbWluZy1zcmMtY29ubmVjdG9yLnR5cGVzJykuVGltaW5nU3JjQ29ubmVjdG9yT3B0aW9uc30gVGltaW5nU3JjQ29ubmVjdG9yT3B0aW9ucyAqL1xuLyoqIEB0eXBlZGVmIHsobXNnOiBzdHJpbmcpID0+IGFueX0gTG9nZ2VyICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgndGltaW5nLW9iamVjdCcpLlRDb25uZWN0aW9uU3RhdGV9IFRDb25uZWN0aW9uU3RhdGUgKi9cblxuLyoqXG4gKiBAdHlwZSB7VGltaW5nU3JjQ29ubmVjdG9yT3B0aW9uc31cbiAqXG4gKiBGb3IgZGV0YWlscyBvbiB0aGVzZSBwcm9wZXJ0aWVzIGFuZCB0aGVpciBlZmZlY3RzLCBzZWUgdGhlIHR5cGVzY3JpcHQgZGVmaW5pdGlvbiByZWZlcmVuY2VkIGFib3ZlLlxuICovXG5jb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgcm9sZTogJ3ZpZXdlcicsXG4gIGF1dG9QbGF5TXV0ZWQ6IHRydWUsXG4gIGFsbG93ZWREcmlmdDogMC4zLFxuICBtYXhBbGxvd2VkRHJpZnQ6IDEsXG4gIG1pbkNoZWNrSW50ZXJ2YWw6IDAuMSxcbiAgbWF4UmF0ZUFkanVzdG1lbnQ6IDAuMixcbiAgbWF4VGltZVRvQ2F0Y2hVcDogMVxufTtcblxuLyoqXG4gKiBUaGVyZSdzIGEgcHJvcG9zZWQgVzNDIHNwZWMgZm9yIHRoZSBUaW1pbmcgT2JqZWN0IHdoaWNoIHdvdWxkIGludHJvZHVjZSBhIG5ldyBzZXQgb2YgQVBJcyB0aGF0IHdvdWxkIHNpbXBsaWZ5IHRpbWUtc3luY2hyb25pemF0aW9uIHRhc2tzIGZvciBicm93c2VyIGFwcGxpY2F0aW9ucy5cbiAqXG4gKiBQcm9wb3NlZCBzcGVjOiBodHRwczovL3dlYnRpbWluZy5naXRodWIuaW8vdGltaW5nb2JqZWN0L1xuICogVjMgU3BlYzogaHR0cHM6Ly90aW1pbmdzcmMucmVhZHRoZWRvY3MuaW8vZW4vbGF0ZXN0L1xuICogRGVtdXhlZCB0YWxrOiBodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PWNaU2pEYUdEbVg4XG4gKlxuICogVGhpcyBjbGFzcyBtYWtlcyBpdCBlYXN5IHRvIGNvbm5lY3QgVmltZW8uUGxheWVyIHRvIGEgcHJvdmlkZWQgVGltaW5nT2JqZWN0IHZpYSBWaW1lby5QbGF5ZXIuc2V0VGltaW5nU3JjKG15VGltaW5nT2JqZWN0LCBvcHRpb25zKSBhbmQgdGhlIHN5bmNocm9uaXphdGlvbiB3aWxsIGJlIGhhbmRsZWQgYXV0b21hdGljYWxseS5cbiAqXG4gKiBUaGVyZSBhcmUgNSBnZW5lcmFsIHJlc3BvbnNpYmlsaXRpZXMgaW4gVGltaW5nU3JjQ29ubmVjdG9yOlxuICpcbiAqIDEuIGB1cGRhdGVQbGF5ZXIoKWAgd2hpY2ggc2V0cyB0aGUgcGxheWVyJ3MgY3VycmVudFRpbWUsIHBsYXliYWNrUmF0ZSBhbmQgcGF1c2UvcGxheSBzdGF0ZSBiYXNlZCBvbiBjdXJyZW50IHN0YXRlIG9mIHRoZSBUaW1pbmdPYmplY3QuXG4gKiAyLiBgdXBkYXRlVGltaW5nT2JqZWN0KClgIHdoaWNoIHNldHMgdGhlIFRpbWluZ09iamVjdCdzIHBvc2l0aW9uIGFuZCB2ZWxvY2l0eSBmcm9tIHRoZSBwbGF5ZXIncyBzdGF0ZS5cbiAqIDMuIGBwbGF5ZXJVcGRhdGVyYCB3aGljaCBsaXN0ZW5zIGZvciBjaGFuZ2UgZXZlbnRzIG9uIHRoZSBUaW1pbmdPYmplY3QgYW5kIHdpbGwgcmVzcG9uZCBieSBjYWxsaW5nIHVwZGF0ZVBsYXllci5cbiAqIDQuIGB0aW1pbmdPYmplY3RVcGRhdGVyYCB3aGljaCBsaXN0ZW5zIHRvIHRoZSBwbGF5ZXIgZXZlbnRzIG9mIHNlZWtlZCwgcGxheSBhbmQgcGF1c2UgYW5kIHdpbGwgcmVzcG9uZCBieSBjYWxsaW5nIGB1cGRhdGVUaW1pbmdPYmplY3QoKWAuXG4gKiA1LiBgbWFpbnRhaW5QbGF5YmFja1Bvc2l0aW9uYCB0aGlzIGlzIGNvZGUgdGhhdCBjb25zdGFudGx5IG1vbml0b3JzIHRoZSBwbGF5ZXIgdG8gbWFrZSBzdXJlIGl0J3MgYWx3YXlzIGluIHN5bmMgd2l0aCB0aGUgVGltaW5nT2JqZWN0LiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIHZpZGVvcyB3aWxsIGdlbmVyYWxseSBub3QgcGxheSB3aXRoIHByZWNpc2UgdGltZSBhY2N1cmFjeSBhbmQgdGhlcmUgd2lsbCBiZSBzb21lIGRyaWZ0IHdoaWNoIGJlY29tZXMgbW9yZSBub3RpY2VhYmxlIG92ZXIgbG9uZ2VyIHBlcmlvZHMgKGFzIG5vdGVkIGluIHRoZSB0aW1pbmctb2JqZWN0IHNwZWMpLiBNb3JlIGRldGFpbHMgb24gdGhpcyBtZXRob2QgYmVsb3cuXG4gKi9cbmNsYXNzIFRpbWluZ1NyY0Nvbm5lY3RvciBleHRlbmRzIEV2ZW50VGFyZ2V0IHtcbiAgbG9nZ2VyO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1BsYXllckNvbnRyb2xzfSBwbGF5ZXJcbiAgICogQHBhcmFtIHtUaW1pbmdPYmplY3R9IHRpbWluZ09iamVjdFxuICAgKiBAcGFyYW0ge1RpbWluZ1NyY0Nvbm5lY3Rvck9wdGlvbnN9IG9wdGlvbnNcbiAgICogQHBhcmFtIHtMb2dnZXJ9IGxvZ2dlclxuICAgKi9cbiAgY29uc3RydWN0b3IocGxheWVyLCB0aW1pbmdPYmplY3QpIHtcbiAgICBsZXQgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzJdIDoge307XG4gICAgbGV0IGxvZ2dlciA9IGFyZ3VtZW50cy5sZW5ndGggPiAzID8gYXJndW1lbnRzWzNdIDogdW5kZWZpbmVkO1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5sb2dnZXIgPSBsb2dnZXI7XG4gICAgdGhpcy5pbml0KHRpbWluZ09iamVjdCwgcGxheWVyLCB7XG4gICAgICAuLi5kZWZhdWx0T3B0aW9ucyxcbiAgICAgIC4uLm9wdGlvbnNcbiAgICB9KTtcbiAgfVxuICBkaXNjb25uZWN0KCkge1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2Rpc2Nvbm5lY3QnKSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtUaW1pbmdPYmplY3R9IHRpbWluZ09iamVjdFxuICAgKiBAcGFyYW0ge1BsYXllckNvbnRyb2xzfSBwbGF5ZXJcbiAgICogQHBhcmFtIHtUaW1pbmdTcmNDb25uZWN0b3JPcHRpb25zfSBvcHRpb25zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBpbml0KHRpbWluZ09iamVjdCwgcGxheWVyLCBvcHRpb25zKSB7XG4gICAgYXdhaXQgdGhpcy53YWl0Rm9yVE9SZWFkeVN0YXRlKHRpbWluZ09iamVjdCwgJ29wZW4nKTtcbiAgICBpZiAob3B0aW9ucy5yb2xlID09PSAndmlld2VyJykge1xuICAgICAgYXdhaXQgdGhpcy51cGRhdGVQbGF5ZXIodGltaW5nT2JqZWN0LCBwbGF5ZXIsIG9wdGlvbnMpO1xuICAgICAgY29uc3QgcGxheWVyVXBkYXRlciA9IHN1YnNjcmliZSh0aW1pbmdPYmplY3QsICdjaGFuZ2UnLCAoKSA9PiB0aGlzLnVwZGF0ZVBsYXllcih0aW1pbmdPYmplY3QsIHBsYXllciwgb3B0aW9ucykpO1xuICAgICAgY29uc3QgcG9zaXRpb25TeW5jID0gdGhpcy5tYWludGFpblBsYXliYWNrUG9zaXRpb24odGltaW5nT2JqZWN0LCBwbGF5ZXIsIG9wdGlvbnMpO1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCdkaXNjb25uZWN0JywgKCkgPT4ge1xuICAgICAgICBwb3NpdGlvblN5bmMuY2FuY2VsKCk7XG4gICAgICAgIHBsYXllclVwZGF0ZXIuY2FuY2VsKCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy51cGRhdGVUaW1pbmdPYmplY3QodGltaW5nT2JqZWN0LCBwbGF5ZXIpO1xuICAgICAgY29uc3QgdGltaW5nT2JqZWN0VXBkYXRlciA9IHN1YnNjcmliZShwbGF5ZXIsIFsnc2Vla2VkJywgJ3BsYXknLCAncGF1c2UnLCAncmF0ZWNoYW5nZSddLCAoKSA9PiB0aGlzLnVwZGF0ZVRpbWluZ09iamVjdCh0aW1pbmdPYmplY3QsIHBsYXllciksICdvbicsICdvZmYnKTtcbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcignZGlzY29ubmVjdCcsICgpID0+IHRpbWluZ09iamVjdFVwZGF0ZXIuY2FuY2VsKCkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBUaW1pbmdPYmplY3QncyBzdGF0ZSB0byByZWZsZWN0IHRoYXQgb2YgdGhlIHBsYXllclxuICAgKlxuICAgKiBAcGFyYW0ge1RpbWluZ09iamVjdH0gdGltaW5nT2JqZWN0XG4gICAqIEBwYXJhbSB7UGxheWVyQ29udHJvbHN9IHBsYXllclxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgdXBkYXRlVGltaW5nT2JqZWN0KHRpbWluZ09iamVjdCwgcGxheWVyKSB7XG4gICAgY29uc3QgW3Bvc2l0aW9uLCBpc1BhdXNlZCwgcGxheWJhY2tSYXRlXSA9IGF3YWl0IFByb21pc2UuYWxsKFtwbGF5ZXIuZ2V0Q3VycmVudFRpbWUoKSwgcGxheWVyLmdldFBhdXNlZCgpLCBwbGF5ZXIuZ2V0UGxheWJhY2tSYXRlKCldKTtcbiAgICB0aW1pbmdPYmplY3QudXBkYXRlKHtcbiAgICAgIHBvc2l0aW9uLFxuICAgICAgdmVsb2NpdHk6IGlzUGF1c2VkID8gMCA6IHBsYXliYWNrUmF0ZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBsYXllcidzIHRpbWluZyBzdGF0ZSB0byByZWZsZWN0IHRoYXQgb2YgdGhlIFRpbWluZ09iamVjdFxuICAgKlxuICAgKiBAcGFyYW0ge1RpbWluZ09iamVjdH0gdGltaW5nT2JqZWN0XG4gICAqIEBwYXJhbSB7UGxheWVyQ29udHJvbHN9IHBsYXllclxuICAgKiBAcGFyYW0ge1RpbWluZ1NyY0Nvbm5lY3Rvck9wdGlvbnN9IG9wdGlvbnNcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHVwZGF0ZVBsYXllcih0aW1pbmdPYmplY3QsIHBsYXllciwgb3B0aW9ucykge1xuICAgIGNvbnN0IHtcbiAgICAgIHBvc2l0aW9uLFxuICAgICAgdmVsb2NpdHlcbiAgICB9ID0gdGltaW5nT2JqZWN0LnF1ZXJ5KCk7XG4gICAgaWYgKHR5cGVvZiBwb3NpdGlvbiA9PT0gJ251bWJlcicpIHtcbiAgICAgIHBsYXllci5zZXRDdXJyZW50VGltZShwb3NpdGlvbik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdmVsb2NpdHkgPT09ICdudW1iZXInKSB7XG4gICAgICBpZiAodmVsb2NpdHkgPT09IDApIHtcbiAgICAgICAgaWYgKChhd2FpdCBwbGF5ZXIuZ2V0UGF1c2VkKCkpID09PSBmYWxzZSkge1xuICAgICAgICAgIHBsYXllci5wYXVzZSgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHZlbG9jaXR5ID4gMCkge1xuICAgICAgICBpZiAoKGF3YWl0IHBsYXllci5nZXRQYXVzZWQoKSkgPT09IHRydWUpIHtcbiAgICAgICAgICBhd2FpdCBwbGF5ZXIucGxheSgpLmNhdGNoKGFzeW5jIGVyciA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyLm5hbWUgPT09ICdOb3RBbGxvd2VkRXJyb3InICYmIG9wdGlvbnMuYXV0b1BsYXlNdXRlZCkge1xuICAgICAgICAgICAgICBhd2FpdCBwbGF5ZXIuc2V0TXV0ZWQodHJ1ZSk7XG4gICAgICAgICAgICAgIGF3YWl0IHBsYXllci5wbGF5KCkuY2F0Y2goZXJyMiA9PiBjb25zb2xlLmVycm9yKCdDb3VsZG5cXCd0IHBsYXkgdGhlIHZpZGVvIGZyb20gVGltaW5nU3JjQ29ubmVjdG9yLiBFcnJvcjonLCBlcnIyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy51cGRhdGVQbGF5ZXIodGltaW5nT2JqZWN0LCBwbGF5ZXIsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoYXdhaXQgcGxheWVyLmdldFBsYXliYWNrUmF0ZSgpKSAhPT0gdmVsb2NpdHkpIHtcbiAgICAgICAgICBwbGF5ZXIuc2V0UGxheWJhY2tSYXRlKHZlbG9jaXR5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTaW5jZSB2aWRlbyBwbGF5ZXJzIGRvIG5vdCBwbGF5IHdpdGggMTAwJSB0aW1lIHByZWNpc2lvbiwgd2UgbmVlZCB0byBjbG9zZWx5IG1vbml0b3JcbiAgICogb3VyIHBsYXllciB0byBiZSBzdXJlIGl0IHJlbWFpbnMgaW4gc3luYyB3aXRoIHRoZSBUaW1pbmdPYmplY3QuXG4gICAqXG4gICAqIElmIG91dCBvZiBzeW5jLCB3ZSB1c2UgdGhlIGN1cnJlbnQgY29uZGl0aW9ucyBhbmQgdGhlIG9wdGlvbnMgcHJvdmlkZWQgdG8gZGV0ZXJtaW5lXG4gICAqIHdoZXRoZXIgdG8gcmUtc3luYyB2aWEgc2V0dGluZyBjdXJyZW50VGltZSBvciBhZGp1c3RpbmcgdGhlIHBsYXliYWNrUmF0ZVxuICAgKlxuICAgKiBAcGFyYW0ge1RpbWluZ09iamVjdH0gdGltaW5nT2JqZWN0XG4gICAqIEBwYXJhbSB7UGxheWVyQ29udHJvbHN9IHBsYXllclxuICAgKiBAcGFyYW0ge1RpbWluZ1NyY0Nvbm5lY3Rvck9wdGlvbnN9IG9wdGlvbnNcbiAgICogQHJldHVybiB7e2NhbmNlbDogKGZ1bmN0aW9uKCk6IHZvaWQpfX1cbiAgICovXG4gIG1haW50YWluUGxheWJhY2tQb3NpdGlvbih0aW1pbmdPYmplY3QsIHBsYXllciwgb3B0aW9ucykge1xuICAgIGNvbnN0IHtcbiAgICAgIGFsbG93ZWREcmlmdCxcbiAgICAgIG1heEFsbG93ZWREcmlmdCxcbiAgICAgIG1pbkNoZWNrSW50ZXJ2YWwsXG4gICAgICBtYXhSYXRlQWRqdXN0bWVudCxcbiAgICAgIG1heFRpbWVUb0NhdGNoVXBcbiAgICB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBzeW5jSW50ZXJ2YWwgPSBNYXRoLm1pbihtYXhUaW1lVG9DYXRjaFVwLCBNYXRoLm1heChtaW5DaGVja0ludGVydmFsLCBtYXhBbGxvd2VkRHJpZnQpKSAqIDEwMDA7XG4gICAgY29uc3QgY2hlY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICBpZiAodGltaW5nT2JqZWN0LnF1ZXJ5KCkudmVsb2NpdHkgPT09IDAgfHwgKGF3YWl0IHBsYXllci5nZXRQYXVzZWQoKSkgPT09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgZGlmZiA9IHRpbWluZ09iamVjdC5xdWVyeSgpLnBvc2l0aW9uIC0gKGF3YWl0IHBsYXllci5nZXRDdXJyZW50VGltZSgpKTtcbiAgICAgIGNvbnN0IGRpZmZBYnMgPSBNYXRoLmFicyhkaWZmKTtcbiAgICAgIHRoaXMubG9nKGBEcmlmdDogJHtkaWZmfWApO1xuICAgICAgaWYgKGRpZmZBYnMgPiBtYXhBbGxvd2VkRHJpZnQpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5hZGp1c3RTcGVlZChwbGF5ZXIsIDApO1xuICAgICAgICBwbGF5ZXIuc2V0Q3VycmVudFRpbWUodGltaW5nT2JqZWN0LnF1ZXJ5KCkucG9zaXRpb24pO1xuICAgICAgICB0aGlzLmxvZygnUmVzeW5jIGJ5IGN1cnJlbnRUaW1lJyk7XG4gICAgICB9IGVsc2UgaWYgKGRpZmZBYnMgPiBhbGxvd2VkRHJpZnQpIHtcbiAgICAgICAgY29uc3QgbWluID0gZGlmZkFicyAvIG1heFRpbWVUb0NhdGNoVXA7XG4gICAgICAgIGNvbnN0IG1heCA9IG1heFJhdGVBZGp1c3RtZW50O1xuICAgICAgICBjb25zdCBhZGp1c3RtZW50ID0gbWluIDwgbWF4ID8gKG1heCAtIG1pbikgLyAyIDogbWF4O1xuICAgICAgICBhd2FpdCB0aGlzLmFkanVzdFNwZWVkKHBsYXllciwgYWRqdXN0bWVudCAqIE1hdGguc2lnbihkaWZmKSk7XG4gICAgICAgIHRoaXMubG9nKCdSZXN5bmMgYnkgcGxheWJhY2tSYXRlJyk7XG4gICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IGNoZWNrKCksIHN5bmNJbnRlcnZhbCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNhbmNlbDogKCkgPT4gY2xlYXJJbnRlcnZhbChpbnRlcnZhbClcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtc2dcbiAgICovXG4gIGxvZyhtc2cpIHtcbiAgICB0aGlzLmxvZ2dlcj8uKGBUaW1pbmdTcmNDb25uZWN0b3I6ICR7bXNnfWApO1xuICB9XG4gIHNwZWVkQWRqdXN0bWVudCA9IDA7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7UGxheWVyQ29udHJvbHN9IHBsYXllclxuICAgKiBAcGFyYW0ge251bWJlcn0gbmV3QWRqdXN0bWVudFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYWRqdXN0U3BlZWQgPSBhc3luYyAocGxheWVyLCBuZXdBZGp1c3RtZW50KSA9PiB7XG4gICAgaWYgKHRoaXMuc3BlZWRBZGp1c3RtZW50ID09PSBuZXdBZGp1c3RtZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG5ld1BsYXliYWNrUmF0ZSA9IChhd2FpdCBwbGF5ZXIuZ2V0UGxheWJhY2tSYXRlKCkpIC0gdGhpcy5zcGVlZEFkanVzdG1lbnQgKyBuZXdBZGp1c3RtZW50O1xuICAgIHRoaXMubG9nKGBOZXcgcGxheWJhY2tSYXRlOiAgJHtuZXdQbGF5YmFja1JhdGV9YCk7XG4gICAgYXdhaXQgcGxheWVyLnNldFBsYXliYWNrUmF0ZShuZXdQbGF5YmFja1JhdGUpO1xuICAgIHRoaXMuc3BlZWRBZGp1c3RtZW50ID0gbmV3QWRqdXN0bWVudDtcbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHtUaW1pbmdPYmplY3R9IHRpbWluZ09iamVjdFxuICAgKiBAcGFyYW0ge1RDb25uZWN0aW9uU3RhdGV9IHN0YXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICB3YWl0Rm9yVE9SZWFkeVN0YXRlKHRpbWluZ09iamVjdCwgc3RhdGUpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRpbWluZ09iamVjdC5yZWFkeVN0YXRlID09PSBzdGF0ZSkge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aW1pbmdPYmplY3QuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGNoZWNrLCB7XG4gICAgICAgICAgICBvbmNlOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBjaGVjaygpO1xuICAgIH0pO1xuICB9XG59XG5cbmNvbnN0IHBsYXllck1hcCA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCByZWFkeU1hcCA9IG5ldyBXZWFrTWFwKCk7XG5sZXQgc2NyZWVuZnVsbCA9IHt9O1xuY2xhc3MgUGxheWVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZSBhIFBsYXllci5cbiAgICpcbiAgICogQHBhcmFtIHsoSFRNTElGcmFtZUVsZW1lbnR8SFRNTEVsZW1lbnR8c3RyaW5nfGpRdWVyeSl9IGVsZW1lbnQgQSByZWZlcmVuY2UgdG8gdGhlIFZpbWVvXG4gICAqICAgICAgICBwbGF5ZXIgaWZyYW1lLCBhbmQgaWQsIG9yIGEgalF1ZXJ5IG9iamVjdC5cbiAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSBvRW1iZWQgcGFyYW1ldGVycyB0byB1c2Ugd2hlbiBjcmVhdGluZyBhbiBlbWJlZCBpbiB0aGUgZWxlbWVudC5cbiAgICogQHJldHVybiB7UGxheWVyfVxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgIGxldCBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICAvKiBnbG9iYWwgalF1ZXJ5ICovXG4gICAgaWYgKHdpbmRvdy5qUXVlcnkgJiYgZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeSkge1xuICAgICAgaWYgKGVsZW1lbnQubGVuZ3RoID4gMSAmJiB3aW5kb3cuY29uc29sZSAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdBIGpRdWVyeSBvYmplY3Qgd2l0aCBtdWx0aXBsZSBlbGVtZW50cyB3YXMgcGFzc2VkLCB1c2luZyB0aGUgZmlyc3QgZWxlbWVudC4nKTtcbiAgICAgIH1cbiAgICAgIGVsZW1lbnQgPSBlbGVtZW50WzBdO1xuICAgIH1cblxuICAgIC8vIEZpbmQgYW4gZWxlbWVudCBieSBJRFxuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBlbGVtZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8vIE5vdCBhbiBlbGVtZW50IVxuICAgIGlmICghaXNEb21FbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGVpdGhlciBhIHZhbGlkIGVsZW1lbnQgb3IgYSB2YWxpZCBpZC4nKTtcbiAgICB9XG5cbiAgICAvLyBBbHJlYWR5IGluaXRpYWxpemVkIGFuIGVtYmVkIGluIHRoaXMgZGl2LCBzbyBncmFiIHRoZSBpZnJhbWVcbiAgICBpZiAoZWxlbWVudC5ub2RlTmFtZSAhPT0gJ0lGUkFNRScpIHtcbiAgICAgIGNvbnN0IGlmcmFtZSA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignaWZyYW1lJyk7XG4gICAgICBpZiAoaWZyYW1lKSB7XG4gICAgICAgIGVsZW1lbnQgPSBpZnJhbWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gaWZyYW1lIHVybCBpcyBub3QgYSBWaW1lbyB1cmxcbiAgICBpZiAoZWxlbWVudC5ub2RlTmFtZSA9PT0gJ0lGUkFNRScgJiYgIWlzVmltZW9VcmwoZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3NyYycpIHx8ICcnKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcGxheWVyIGVsZW1lbnQgcGFzc2VkIGlzbuKAmXQgYSBWaW1lbyBlbWJlZC4nKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhbHJlYWR5IGEgcGxheWVyIG9iamVjdCBpbiB0aGUgbWFwLCByZXR1cm4gdGhhdFxuICAgIGlmIChwbGF5ZXJNYXAuaGFzKGVsZW1lbnQpKSB7XG4gICAgICByZXR1cm4gcGxheWVyTWFwLmdldChlbGVtZW50KTtcbiAgICB9XG4gICAgdGhpcy5fd2luZG93ID0gZWxlbWVudC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3O1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcmlnaW4gPSAnKic7XG4gICAgY29uc3QgcmVhZHlQcm9taXNlID0gbmV3IG5wb19zcmMoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5fb25NZXNzYWdlID0gZXZlbnQgPT4ge1xuICAgICAgICBpZiAoIWlzVmltZW9VcmwoZXZlbnQub3JpZ2luKSB8fCB0aGlzLmVsZW1lbnQuY29udGVudFdpbmRvdyAhPT0gZXZlbnQuc291cmNlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9yaWdpbiA9PT0gJyonKSB7XG4gICAgICAgICAgdGhpcy5vcmlnaW4gPSBldmVudC5vcmlnaW47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGF0YSA9IHBhcnNlTWVzc2FnZURhdGEoZXZlbnQuZGF0YSk7XG4gICAgICAgIGNvbnN0IGlzRXJyb3IgPSBkYXRhICYmIGRhdGEuZXZlbnQgPT09ICdlcnJvcic7XG4gICAgICAgIGNvbnN0IGlzUmVhZHlFcnJvciA9IGlzRXJyb3IgJiYgZGF0YS5kYXRhICYmIGRhdGEuZGF0YS5tZXRob2QgPT09ICdyZWFkeSc7XG4gICAgICAgIGlmIChpc1JlYWR5RXJyb3IpIHtcbiAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihkYXRhLmRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgZXJyb3IubmFtZSA9IGRhdGEuZGF0YS5uYW1lO1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGlzUmVhZHlFdmVudCA9IGRhdGEgJiYgZGF0YS5ldmVudCA9PT0gJ3JlYWR5JztcbiAgICAgICAgY29uc3QgaXNQaW5nUmVzcG9uc2UgPSBkYXRhICYmIGRhdGEubWV0aG9kID09PSAncGluZyc7XG4gICAgICAgIGlmIChpc1JlYWR5RXZlbnQgfHwgaXNQaW5nUmVzcG9uc2UpIHtcbiAgICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLXJlYWR5JywgJ3RydWUnKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHByb2Nlc3NEYXRhKHRoaXMsIGRhdGEpO1xuICAgICAgfTtcbiAgICAgIHRoaXMuX3dpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5fb25NZXNzYWdlKTtcbiAgICAgIGlmICh0aGlzLmVsZW1lbnQubm9kZU5hbWUgIT09ICdJRlJBTUUnKSB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IGdldE9FbWJlZFBhcmFtZXRlcnMoZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgIGNvbnN0IHVybCA9IGdldFZpbWVvVXJsKHBhcmFtcyk7XG4gICAgICAgIGdldE9FbWJlZERhdGEodXJsLCBwYXJhbXMsIGVsZW1lbnQpLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgY29uc3QgaWZyYW1lID0gY3JlYXRlRW1iZWQoZGF0YSwgZWxlbWVudCk7XG4gICAgICAgICAgLy8gT3ZlcndyaXRlIGVsZW1lbnQgd2l0aCB0aGUgbmV3IGlmcmFtZSxcbiAgICAgICAgICAvLyBidXQgc3RvcmUgcmVmZXJlbmNlIHRvIHRoZSBvcmlnaW5hbCBlbGVtZW50XG4gICAgICAgICAgdGhpcy5lbGVtZW50ID0gaWZyYW1lO1xuICAgICAgICAgIHRoaXMuX29yaWdpbmFsRWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgICAgc3dhcENhbGxiYWNrcyhlbGVtZW50LCBpZnJhbWUpO1xuICAgICAgICAgIHBsYXllck1hcC5zZXQodGhpcy5lbGVtZW50LCB0aGlzKTtcbiAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfSkuY2F0Y2gocmVqZWN0KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFN0b3JlIGEgY29weSBvZiB0aGlzIFBsYXllciBpbiB0aGUgbWFwXG4gICAgcmVhZHlNYXAuc2V0KHRoaXMsIHJlYWR5UHJvbWlzZSk7XG4gICAgcGxheWVyTWFwLnNldCh0aGlzLmVsZW1lbnQsIHRoaXMpO1xuXG4gICAgLy8gU2VuZCBhIHBpbmcgdG8gdGhlIGlmcmFtZSBzbyB0aGUgcmVhZHkgcHJvbWlzZSB3aWxsIGJlIHJlc29sdmVkIGlmXG4gICAgLy8gdGhlIHBsYXllciBpcyBhbHJlYWR5IHJlYWR5LlxuICAgIGlmICh0aGlzLmVsZW1lbnQubm9kZU5hbWUgPT09ICdJRlJBTUUnKSB7XG4gICAgICBwb3N0TWVzc2FnZSh0aGlzLCAncGluZycpO1xuICAgIH1cbiAgICBpZiAoc2NyZWVuZnVsbC5pc0VuYWJsZWQpIHtcbiAgICAgIGNvbnN0IGV4aXRGdWxsc2NyZWVuID0gKCkgPT4gc2NyZWVuZnVsbC5leGl0KCk7XG4gICAgICB0aGlzLmZ1bGxzY3JlZW5jaGFuZ2VIYW5kbGVyID0gKCkgPT4ge1xuICAgICAgICBpZiAoc2NyZWVuZnVsbC5pc0Z1bGxzY3JlZW4pIHtcbiAgICAgICAgICBzdG9yZUNhbGxiYWNrKHRoaXMsICdldmVudDpleGl0RnVsbHNjcmVlbicsIGV4aXRGdWxsc2NyZWVuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZW1vdmVDYWxsYmFjayh0aGlzLCAnZXZlbnQ6ZXhpdEZ1bGxzY3JlZW4nLCBleGl0RnVsbHNjcmVlbik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgIHRoaXMucmVhZHkoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBwb3N0TWVzc2FnZSh0aGlzLCAnZnVsbHNjcmVlbmNoYW5nZScsIHNjcmVlbmZ1bGwuaXNGdWxsc2NyZWVuKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgc2NyZWVuZnVsbC5vbignZnVsbHNjcmVlbmNoYW5nZScsIHRoaXMuZnVsbHNjcmVlbmNoYW5nZUhhbmRsZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB0byBzZWUgaWYgdGhlIFVSTCBpcyBhIFZpbWVvIFVSTC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBUaGUgVVJMIHN0cmluZy5cbiAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICovXG4gIHN0YXRpYyBpc1ZpbWVvVXJsKHVybCkge1xuICAgIHJldHVybiBpc1ZpbWVvVXJsKHVybCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcHJvbWlzZSBmb3IgYSBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBBUEkgbWV0aG9kIHRvIGNhbGwuXG4gICAqIEBwYXJhbSB7Li4uKHN0cmluZ3xudW1iZXJ8b2JqZWN0fEFycmF5KX0gYXJncyBBcmd1bWVudHMgdG8gc2VuZCB2aWEgcG9zdE1lc3NhZ2UuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAqL1xuICBjYWxsTWV0aG9kKG5hbWUpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG4gICAgaWYgKG5hbWUgPT09IHVuZGVmaW5lZCB8fCBuYW1lID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgbWV0aG9kIG5hbWUuJyk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgbnBvX3NyYygocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAvLyBXZSBhcmUgc3RvcmluZyB0aGUgcmVzb2x2ZS9yZWplY3QgaGFuZGxlcnMgdG8gY2FsbCBsYXRlciwgc28gd2VcbiAgICAgIC8vIGNhbuKAmXQgcmV0dXJuIGhlcmUuXG4gICAgICByZXR1cm4gdGhpcy5yZWFkeSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBzdG9yZUNhbGxiYWNrKHRoaXMsIG5hbWUsIHtcbiAgICAgICAgICByZXNvbHZlLFxuICAgICAgICAgIHJlamVjdFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgYXJncyA9IHt9O1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3MubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgYXJncyA9IGFyZ3NbMF07XG4gICAgICAgIH1cbiAgICAgICAgcG9zdE1lc3NhZ2UodGhpcywgbmFtZSwgYXJncyk7XG4gICAgICB9KS5jYXRjaChyZWplY3QpO1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBHZXQgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb2YgYSBwbGF5ZXIgcHJvcGVydHkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBwcm9wZXJ0eSBuYW1lXG4gICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAqL1xuICBnZXQobmFtZSkge1xuICAgIHJldHVybiBuZXcgbnBvX3NyYygocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBuYW1lID0gZ2V0TWV0aG9kTmFtZShuYW1lLCAnZ2V0Jyk7XG5cbiAgICAgIC8vIFdlIGFyZSBzdG9yaW5nIHRoZSByZXNvbHZlL3JlamVjdCBoYW5kbGVycyB0byBjYWxsIGxhdGVyLCBzbyB3ZVxuICAgICAgLy8gY2Fu4oCZdCByZXR1cm4gaGVyZS5cbiAgICAgIHJldHVybiB0aGlzLnJlYWR5KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHN0b3JlQ2FsbGJhY2sodGhpcywgbmFtZSwge1xuICAgICAgICAgIHJlc29sdmUsXG4gICAgICAgICAgcmVqZWN0XG4gICAgICAgIH0pO1xuICAgICAgICBwb3N0TWVzc2FnZSh0aGlzLCBuYW1lKTtcbiAgICAgIH0pLmNhdGNoKHJlamVjdCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcHJvbWlzZSBmb3Igc2V0dGluZyB0aGUgdmFsdWUgb2YgYSBwbGF5ZXIgcHJvcGVydHkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBBUEkgbWV0aG9kIHRvIGNhbGwuXG4gICAqIEBwYXJhbSB7bWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAqL1xuICBzZXQobmFtZSwgdmFsdWUpIHtcbiAgICByZXR1cm4gbmV3IG5wb19zcmMoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbmFtZSA9IGdldE1ldGhvZE5hbWUobmFtZSwgJ3NldCcpO1xuICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlcmUgbXVzdCBiZSBhIHZhbHVlIHRvIHNldC4nKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgYXJlIHN0b3JpbmcgdGhlIHJlc29sdmUvcmVqZWN0IGhhbmRsZXJzIHRvIGNhbGwgbGF0ZXIsIHNvIHdlXG4gICAgICAvLyBjYW7igJl0IHJldHVybiBoZXJlLlxuICAgICAgcmV0dXJuIHRoaXMucmVhZHkoKS50aGVuKCgpID0+IHtcbiAgICAgICAgc3RvcmVDYWxsYmFjayh0aGlzLCBuYW1lLCB7XG4gICAgICAgICAgcmVzb2x2ZSxcbiAgICAgICAgICByZWplY3RcbiAgICAgICAgfSk7XG4gICAgICAgIHBvc3RNZXNzYWdlKHRoaXMsIG5hbWUsIHZhbHVlKTtcbiAgICAgIH0pLmNhdGNoKHJlamVjdCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGV2ZW50IGxpc3RlbmVyIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LiBXaWxsIGNhbGwgdGhlXG4gICAqIGNhbGxiYWNrIHdpdGggYSBzaW5nbGUgcGFyYW1ldGVyLCBgZGF0YWAsIHRoYXQgY29udGFpbnMgdGhlIGRhdGEgZm9yXG4gICAqIHRoYXQgZXZlbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uKCopfSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIHRoZSBldmVudCBmaXJlcy5cbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIG9uKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoIWV2ZW50TmFtZSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhbiBldmVudCBuYW1lLicpO1xuICAgIH1cbiAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgY2FsbGJhY2sgZnVuY3Rpb24uJyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuICAgIGNvbnN0IGNhbGxiYWNrcyA9IGdldENhbGxiYWNrcyh0aGlzLCBgZXZlbnQ6JHtldmVudE5hbWV9YCk7XG4gICAgaWYgKGNhbGxiYWNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuY2FsbE1ldGhvZCgnYWRkRXZlbnRMaXN0ZW5lcicsIGV2ZW50TmFtZSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAvLyBJZ25vcmUgdGhlIGVycm9yLiBUaGVyZSB3aWxsIGJlIGFuIGVycm9yIGV2ZW50IGZpcmVkIHRoYXRcbiAgICAgICAgLy8gd2lsbCB0cmlnZ2VyIHRoZSBlcnJvciBjYWxsYmFjayBpZiB0aGV5IGFyZSBsaXN0ZW5pbmcuXG4gICAgICB9KTtcbiAgICB9XG4gICAgc3RvcmVDYWxsYmFjayh0aGlzLCBgZXZlbnQ6JHtldmVudE5hbWV9YCwgY2FsbGJhY2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBldmVudCBsaXN0ZW5lciBmb3IgdGhlIHNwZWNpZmllZCBldmVudC4gV2lsbCByZW1vdmUgYWxsXG4gICAqIGxpc3RlbmVycyBmb3IgdGhhdCBldmVudCBpZiBhIGBjYWxsYmFja2AgaXNu4oCZdCBwYXNzZWQsIG9yIG9ubHkgdGhhdFxuICAgKiBzcGVjaWZpYyBjYWxsYmFjayBpZiBpdCBpcyBwYXNzZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBzcGVjaWZpYyBjYWxsYmFjayB0byByZW1vdmUuXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuICBvZmYoZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICghZXZlbnROYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGFuIGV2ZW50IG5hbWUuJyk7XG4gICAgfVxuICAgIGlmIChjYWxsYmFjayAmJiB0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuICAgIGNvbnN0IGxhc3RDYWxsYmFjayA9IHJlbW92ZUNhbGxiYWNrKHRoaXMsIGBldmVudDoke2V2ZW50TmFtZX1gLCBjYWxsYmFjayk7XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgbm8gY2FsbGJhY2tzIGxlZnQsIHJlbW92ZSB0aGUgbGlzdGVuZXJcbiAgICBpZiAobGFzdENhbGxiYWNrKSB7XG4gICAgICB0aGlzLmNhbGxNZXRob2QoJ3JlbW92ZUV2ZW50TGlzdGVuZXInLCBldmVudE5hbWUpLmNhdGNoKGUgPT4ge1xuICAgICAgICAvLyBJZ25vcmUgdGhlIGVycm9yLiBUaGVyZSB3aWxsIGJlIGFuIGVycm9yIGV2ZW50IGZpcmVkIHRoYXRcbiAgICAgICAgLy8gd2lsbCB0cmlnZ2VyIHRoZSBlcnJvciBjYWxsYmFjayBpZiB0aGV5IGFyZSBsaXN0ZW5pbmcuXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGxvYWQgYSBuZXcgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIExvYWRWaWRlb1Byb21pc2VcbiAgICogQGZ1bGZpbGwge251bWJlcn0gVGhlIHZpZGVvIHdpdGggdGhpcyBpZCBvciB1cmwgc3VjY2Vzc2Z1bGx5IGxvYWRlZC5cbiAgICogQHJlamVjdCB7VHlwZUVycm9yfSBUaGUgaWQgd2FzIG5vdCBhIG51bWJlci5cbiAgICovXG4gIC8qKlxuICAgKiBMb2FkIGEgbmV3IHZpZGVvIGludG8gdGhpcyBlbWJlZC4gVGhlIHByb21pc2Ugd2lsbCBiZSByZXNvbHZlZCBpZlxuICAgKiB0aGUgdmlkZW8gaXMgc3VjY2Vzc2Z1bGx5IGxvYWRlZCwgb3IgaXQgd2lsbCBiZSByZWplY3RlZCBpZiBpdCBjb3VsZFxuICAgKiBub3QgYmUgbG9hZGVkLlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd8b2JqZWN0fSBvcHRpb25zIFRoZSBpZCBvZiB0aGUgdmlkZW8sIHRoZSB1cmwgb2YgdGhlIHZpZGVvLCBvciBhbiBvYmplY3Qgd2l0aCBlbWJlZCBvcHRpb25zLlxuICAgKiBAcmV0dXJuIHtMb2FkVmlkZW9Qcm9taXNlfVxuICAgKi9cbiAgbG9hZFZpZGVvKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdsb2FkVmlkZW8nLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gcGVyZm9ybSBhbiBhY3Rpb24gd2hlbiB0aGUgUGxheWVyIGlzIHJlYWR5LlxuICAgKlxuICAgKiBAdG9kbyBkb2N1bWVudCBlcnJvcnNcbiAgICogQHByb21pc2UgTG9hZFZpZGVvUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7dm9pZH1cbiAgICovXG4gIC8qKlxuICAgKiBUcmlnZ2VyIGEgZnVuY3Rpb24gd2hlbiB0aGUgcGxheWVyIGlmcmFtZSBoYXMgaW5pdGlhbGl6ZWQuIFlvdSBkbyBub3RcbiAgICogbmVlZCB0byB3YWl0IGZvciBgcmVhZHlgIHRvIHRyaWdnZXIgdG8gYmVnaW4gYWRkaW5nIGV2ZW50IGxpc3RlbmVyc1xuICAgKiBvciBjYWxsaW5nIG90aGVyIG1ldGhvZHMuXG4gICAqXG4gICAqIEByZXR1cm4ge1JlYWR5UHJvbWlzZX1cbiAgICovXG4gIHJlYWR5KCkge1xuICAgIGNvbnN0IHJlYWR5UHJvbWlzZSA9IHJlYWR5TWFwLmdldCh0aGlzKSB8fCBuZXcgbnBvX3NyYygocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdVbmtub3duIHBsYXllci4gUHJvYmFibHkgdW5sb2FkZWQuJykpO1xuICAgIH0pO1xuICAgIHJldHVybiBucG9fc3JjLnJlc29sdmUocmVhZHlQcm9taXNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gYWRkIGEgY3VlIHBvaW50IHRvIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIEFkZEN1ZVBvaW50UHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7c3RyaW5nfSBUaGUgaWQgb2YgdGhlIGN1ZSBwb2ludCB0byB1c2UgZm9yIHJlbW92ZUN1ZVBvaW50LlxuICAgKiBAcmVqZWN0IHtSYW5nZUVycm9yfSB0aGUgdGltZSB3YXMgbGVzcyB0aGFuIDAgb3IgZ3JlYXRlciB0aGFuIHRoZVxuICAgKiAgICAgICAgIHZpZGVv4oCZcyBkdXJhdGlvbi5cbiAgICogQHJlamVjdCB7VW5zdXBwb3J0ZWRFcnJvcn0gQ3VlIHBvaW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRoZSBjdXJyZW50XG4gICAqICAgICAgICAgcGxheWVyIG9yIGJyb3dzZXIuXG4gICAqL1xuICAvKipcbiAgICogQWRkIGEgY3VlIHBvaW50IHRvIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lIFRoZSB0aW1lIGZvciB0aGUgY3VlIHBvaW50LlxuICAgKiBAcGFyYW0ge29iamVjdH0gW2RhdGFdIEFyYml0cmFyeSBkYXRhIHRvIGJlIHJldHVybmVkIHdpdGggdGhlIGN1ZSBwb2ludC5cbiAgICogQHJldHVybiB7QWRkQ3VlUG9pbnRQcm9taXNlfVxuICAgKi9cbiAgYWRkQ3VlUG9pbnQodGltZSkge1xuICAgIGxldCBkYXRhID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdhZGRDdWVQb2ludCcsIHtcbiAgICAgIHRpbWUsXG4gICAgICBkYXRhXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIHJlbW92ZSBhIGN1ZSBwb2ludCBmcm9tIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIEFkZEN1ZVBvaW50UHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7c3RyaW5nfSBUaGUgaWQgb2YgdGhlIGN1ZSBwb2ludCB0aGF0IHdhcyByZW1vdmVkLlxuICAgKiBAcmVqZWN0IHtJbnZhbGlkQ3VlUG9pbnR9IFRoZSBjdWUgcG9pbnQgd2l0aCB0aGUgc3BlY2lmaWVkIGlkIHdhcyBub3RcbiAgICogICAgICAgICBmb3VuZC5cbiAgICogQHJlamVjdCB7VW5zdXBwb3J0ZWRFcnJvcn0gQ3VlIHBvaW50cyBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIHRoZSBjdXJyZW50XG4gICAqICAgICAgICAgcGxheWVyIG9yIGJyb3dzZXIuXG4gICAqL1xuICAvKipcbiAgICogUmVtb3ZlIGEgY3VlIHBvaW50IGZyb20gdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgVGhlIGlkIG9mIHRoZSBjdWUgcG9pbnQgdG8gcmVtb3ZlLlxuICAgKiBAcmV0dXJuIHtSZW1vdmVDdWVQb2ludFByb21pc2V9XG4gICAqL1xuICByZW1vdmVDdWVQb2ludChpZCkge1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3JlbW92ZUN1ZVBvaW50JywgaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcmVwcmVzZW50YXRpb24gb2YgYSB0ZXh0IHRyYWNrIG9uIGEgdmlkZW8uXG4gICAqXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IFZpbWVvVGV4dFRyYWNrXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYW5ndWFnZSBUaGUgSVNPIGxhbmd1YWdlIGNvZGUuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBraW5kIFRoZSBraW5kIG9mIHRyYWNrIGl0IGlzIChjYXB0aW9ucyBvciBzdWJ0aXRsZXMpLlxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbGFiZWwgVGhlIGh1bWFu4oCQcmVhZGFibGUgbGFiZWwgZm9yIHRoZSB0cmFjay5cbiAgICovXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZW5hYmxlIGEgdGV4dCB0cmFjay5cbiAgICpcbiAgICogQHByb21pc2UgRW5hYmxlVGV4dFRyYWNrUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7VmltZW9UZXh0VHJhY2t9IFRoZSB0ZXh0IHRyYWNrIHRoYXQgd2FzIGVuYWJsZWQuXG4gICAqIEByZWplY3Qge0ludmFsaWRUcmFja0xhbmd1YWdlRXJyb3J9IE5vIHRyYWNrIHdhcyBhdmFpbGFibGUgd2l0aCB0aGVcbiAgICogICAgICAgICBzcGVjaWZpZWQgbGFuZ3VhZ2UuXG4gICAqIEByZWplY3Qge0ludmFsaWRUcmFja0Vycm9yfSBObyB0cmFjayB3YXMgYXZhaWxhYmxlIHdpdGggdGhlIHNwZWNpZmllZFxuICAgKiAgICAgICAgIGxhbmd1YWdlIGFuZCBraW5kLlxuICAgKi9cbiAgLyoqXG4gICAqIEVuYWJsZSB0aGUgdGV4dCB0cmFjayB3aXRoIHRoZSBzcGVjaWZpZWQgbGFuZ3VhZ2UsIGFuZCBvcHRpb25hbGx5IHRoZVxuICAgKiBzcGVjaWZpZWQga2luZCAoY2FwdGlvbnMgb3Igc3VidGl0bGVzKS5cbiAgICpcbiAgICogV2hlbiBzZXQgdmlhIHRoZSBBUEksIHRoZSB0cmFjayBsYW5ndWFnZSB3aWxsIG5vdCBjaGFuZ2UgdGhlIHZpZXdlcuKAmXNcbiAgICogc3RvcmVkIHByZWZlcmVuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZSBUaGUgdHdv4oCQbGV0dGVyIGxhbmd1YWdlIGNvZGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBba2luZF0gVGhlIGtpbmQgb2YgdHJhY2sgdG8gZW5hYmxlIChjYXB0aW9ucyBvciBzdWJ0aXRsZXMpLlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzaG93aW5nXSBXaGV0aGVyIHRvIGVuYWJsZSBkaXNwbGF5IG9mIGNsb3NlZCBjYXB0aW9ucyBmb3IgZW5hYmxlZCB0ZXh0IHRyYWNrIHdpdGhpbiB0aGUgcGxheWVyLlxuICAgKiBAcmV0dXJuIHtFbmFibGVUZXh0VHJhY2tQcm9taXNlfVxuICAgKi9cbiAgZW5hYmxlVGV4dFRyYWNrKGxhbmd1YWdlKSB7XG4gICAgbGV0IGtpbmQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IG51bGw7XG4gICAgbGV0IHNob3dpbmcgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHRydWU7XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignWW91IG11c3QgcGFzcyBhIGxhbmd1YWdlLicpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdlbmFibGVUZXh0VHJhY2snLCB7XG4gICAgICBsYW5ndWFnZSxcbiAgICAgIGtpbmQsXG4gICAgICBzaG93aW5nXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGRpc2FibGUgdGhlIGFjdGl2ZSB0ZXh0IHRyYWNrLlxuICAgKlxuICAgKiBAcHJvbWlzZSBEaXNhYmxlVGV4dFRyYWNrUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7dm9pZH0gVGhlIHRyYWNrIHdhcyBkaXNhYmxlZC5cbiAgICovXG4gIC8qKlxuICAgKiBEaXNhYmxlIHRoZSBjdXJyZW50bHktYWN0aXZlIHRleHQgdHJhY2suXG4gICAqXG4gICAqIEByZXR1cm4ge0Rpc2FibGVUZXh0VHJhY2tQcm9taXNlfVxuICAgKi9cbiAgZGlzYWJsZVRleHRUcmFjaygpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdkaXNhYmxlVGV4dFRyYWNrJyk7XG4gIH1cblxuICAvKiogQHR5cGVkZWYge2ltcG9ydCgnLi4vdHlwZXMvZm9ybWF0cy5qcycpLlZpbWVvQXVkaW9UcmFja30gVmltZW9BdWRpb1RyYWNrICovXG4gIC8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi90eXBlcy9mb3JtYXRzLmpzJykuQXVkaW9MYW5ndWFnZX0gQXVkaW9MYW5ndWFnZSAqL1xuICAvKiogQHR5cGVkZWYge2ltcG9ydCgnLi4vdHlwZXMvZm9ybWF0cy5qcycpLkF1ZGlvS2luZH0gQXVkaW9LaW5kICovXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZW5hYmxlIGFuIGF1ZGlvIHRyYWNrLlxuICAgKlxuICAgKiBAcHJvbWlzZSBTZWxlY3RBdWRpb1RyYWNrUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7VmltZW9BdWRpb1RyYWNrfSBUaGUgYXVkaW8gdHJhY2sgdGhhdCB3YXMgZW5hYmxlZC5cbiAgICogQHJlamVjdCB7Tm9BdWRpb1RyYWNrc0Vycm9yfSBObyBhdWRpbyBleGlzdHMgZm9yIHRoZSB2aWRlby5cbiAgICogQHJlamVjdCB7Tm9BbHRlcm5hdGVBdWRpb1RyYWNrc0Vycm9yfSBObyBhbHRlcm5hdGUgYXVkaW8gdHJhY2tzIGV4aXN0IGZvciB0aGUgdmlkZW8uXG4gICAqIEByZWplY3Qge05vTWF0Y2hpbmdBdWRpb1RyYWNrRXJyb3J9IE5vIHRyYWNrIHdhcyBhdmFpbGFibGUgd2l0aCB0aGUgc3BlY2lmaWVkXG4gICAqICAgICAgICAgbGFuZ3VhZ2UgYW5kIGtpbmQuXG4gICAqL1xuICAvKipcbiAgICogRW5hYmxlIHRoZSBhdWRpbyB0cmFjayB3aXRoIHRoZSBzcGVjaWZpZWQgbGFuZ3VhZ2UsIGFuZCBvcHRpb25hbGx5IHRoZVxuICAgKiBzcGVjaWZpZWQga2luZCAobWFpbiwgdHJhbnNsYXRpb24sIGRlc2NyaXB0aW9ucywgb3IgY29tbWVudGFyeSkuXG4gICAqXG4gICAqIFdoZW4gc2V0IHZpYSB0aGUgQVBJLCB0aGUgdHJhY2sgbGFuZ3VhZ2Ugd2lsbCBub3QgY2hhbmdlIHRoZSB2aWV3ZXLigJlzXG4gICAqIHN0b3JlZCBwcmVmZXJlbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge0F1ZGlvTGFuZ3VhZ2V9IGxhbmd1YWdlIFRoZSB0d2/igJBsZXR0ZXIgbGFuZ3VhZ2UgY29kZS5cbiAgICogQHBhcmFtIHtBdWRpb0tpbmR9IFtraW5kXSBUaGUga2luZCBvZiB0cmFjayB0byBlbmFibGUgKG1haW4sIHRyYW5zbGF0aW9uLCBkZXNjcmlwdGlvbnMsIGNvbW1lbnRhcnkpLlxuICAgKiBAcmV0dXJuIHtTZWxlY3RBdWRpb1RyYWNrUHJvbWlzZX1cbiAgICovXG4gIHNlbGVjdEF1ZGlvVHJhY2sobGFuZ3VhZ2UsIGtpbmQpIHtcbiAgICBpZiAoIWxhbmd1YWdlKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGEgbGFuZ3VhZ2UuJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3NlbGVjdEF1ZGlvVHJhY2snLCB7XG4gICAgICBsYW5ndWFnZSxcbiAgICAgIGtpbmRcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGUgdGhlIG1haW4gYXVkaW8gdHJhY2sgZm9yIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHJldHVybiB7U2VsZWN0QXVkaW9UcmFja1Byb21pc2V9XG4gICAqL1xuICBzZWxlY3REZWZhdWx0QXVkaW9UcmFjaygpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdzZWxlY3REZWZhdWx0QXVkaW9UcmFjaycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBwYXVzZSB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIFBhdXNlUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7dm9pZH0gVGhlIHZpZGVvIHdhcyBwYXVzZWQuXG4gICAqL1xuICAvKipcbiAgICogUGF1c2UgdGhlIHZpZGVvIGlmIGl04oCZcyBwbGF5aW5nLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQYXVzZVByb21pc2V9XG4gICAqL1xuICBwYXVzZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdwYXVzZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBwbGF5IHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgUGxheVByb21pc2VcbiAgICogQGZ1bGZpbGwge3ZvaWR9IFRoZSB2aWRlbyB3YXMgcGxheWVkLlxuICAgKi9cbiAgLyoqXG4gICAqIFBsYXkgdGhlIHZpZGVvIGlmIGl04oCZcyBwYXVzZWQuICoqTm90ZToqKiBvbiBpT1MgYW5kIHNvbWUgb3RoZXJcbiAgICogbW9iaWxlIGRldmljZXMsIHlvdSBjYW5ub3QgcHJvZ3JhbW1hdGljYWxseSB0cmlnZ2VyIHBsYXkuIE9uY2UgdGhlXG4gICAqIHZpZXdlciBoYXMgdGFwcGVkIG9uIHRoZSBwbGF5IGJ1dHRvbiBpbiB0aGUgcGxheWVyLCBob3dldmVyLCB5b3VcbiAgICogd2lsbCBiZSBhYmxlIHRvIHVzZSB0aGlzIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQbGF5UHJvbWlzZX1cbiAgICovXG4gIHBsYXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncGxheScpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcXVlc3QgdGhhdCB0aGUgcGxheWVyIGVudGVycyBmdWxsc2NyZWVuLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgcmVxdWVzdEZ1bGxzY3JlZW4oKSB7XG4gICAgaWYgKHNjcmVlbmZ1bGwuaXNFbmFibGVkKSB7XG4gICAgICByZXR1cm4gc2NyZWVuZnVsbC5yZXF1ZXN0KHRoaXMuZWxlbWVudCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3JlcXVlc3RGdWxsc2NyZWVuJyk7XG4gIH1cblxuICAvKipcbiAgICogUmVxdWVzdCB0aGF0IHRoZSBwbGF5ZXIgZXhpdHMgZnVsbHNjcmVlbi5cbiAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICovXG4gIGV4aXRGdWxsc2NyZWVuKCkge1xuICAgIGlmIChzY3JlZW5mdWxsLmlzRW5hYmxlZCkge1xuICAgICAgcmV0dXJuIHNjcmVlbmZ1bGwuZXhpdCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdleGl0RnVsbHNjcmVlbicpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgcGxheWVyIGlzIGN1cnJlbnRseSBmdWxsc2NyZWVuLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgZ2V0RnVsbHNjcmVlbigpIHtcbiAgICBpZiAoc2NyZWVuZnVsbC5pc0VuYWJsZWQpIHtcbiAgICAgIHJldHVybiBucG9fc3JjLnJlc29sdmUoc2NyZWVuZnVsbC5pc0Z1bGxzY3JlZW4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXQoJ2Z1bGxzY3JlZW4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHRoYXQgdGhlIHBsYXllciBlbnRlcnMgcGljdHVyZS1pbi1waWN0dXJlLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgcmVxdWVzdFBpY3R1cmVJblBpY3R1cmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbE1ldGhvZCgncmVxdWVzdFBpY3R1cmVJblBpY3R1cmUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHRoYXQgdGhlIHBsYXllciBleGl0cyBwaWN0dXJlLWluLXBpY3R1cmUuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAqL1xuICBleGl0UGljdHVyZUluUGljdHVyZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdleGl0UGljdHVyZUluUGljdHVyZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgcGxheWVyIGlzIGN1cnJlbnRseSBwaWN0dXJlLWluLXBpY3R1cmUuXG4gICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAqL1xuICBnZXRQaWN0dXJlSW5QaWN0dXJlKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgncGljdHVyZUluUGljdHVyZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBwcm9tcHQgdGhlIHZpZXdlciB0byBpbml0aWF0ZSByZW1vdGUgcGxheWJhY2suXG4gICAqXG4gICAqIEBwcm9taXNlIFJlbW90ZVBsYXliYWNrUHJvbXB0UHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7dm9pZH1cbiAgICogQHJlamVjdCB7Tm90Rm91bmRFcnJvcn0gTm8gcmVtb3RlIHBsYXliYWNrIGRldmljZSBpcyBhdmFpbGFibGUuXG4gICAqL1xuICAvKipcbiAgICogUmVxdWVzdCB0byBwcm9tcHQgdGhlIHVzZXIgdG8gaW5pdGlhdGUgcmVtb3RlIHBsYXliYWNrLlxuICAgKlxuICAgKiBAcmV0dXJuIHtSZW1vdGVQbGF5YmFja1Byb21wdFByb21pc2V9XG4gICAqL1xuICByZW1vdGVQbGF5YmFja1Byb21wdCgpIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsTWV0aG9kKCdyZW1vdGVQbGF5YmFja1Byb21wdCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byB1bmxvYWQgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBVbmxvYWRQcm9taXNlXG4gICAqIEBmdWxmaWxsIHt2b2lkfSBUaGUgdmlkZW8gd2FzIHVubG9hZGVkLlxuICAgKi9cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgcGxheWVyIHRvIGl0cyBpbml0aWFsIHN0YXRlLlxuICAgKlxuICAgKiBAcmV0dXJuIHtVbmxvYWRQcm9taXNlfVxuICAgKi9cbiAgdW5sb2FkKCkge1xuICAgIHJldHVybiB0aGlzLmNhbGxNZXRob2QoJ3VubG9hZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFudXAgdGhlIHBsYXllciBhbmQgcmVtb3ZlIGl0IGZyb20gdGhlIERPTVxuICAgKlxuICAgKiBJdCB3b24ndCBiZSB1c2FibGUgYW5kIGEgbmV3IG9uZSBzaG91bGQgYmUgY29uc3RydWN0ZWRcbiAgICogIGluIG9yZGVyIHRvIGRvIGFueSBvcGVyYXRpb25zLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICByZXR1cm4gbmV3IG5wb19zcmMocmVzb2x2ZSA9PiB7XG4gICAgICByZWFkeU1hcC5kZWxldGUodGhpcyk7XG4gICAgICBwbGF5ZXJNYXAuZGVsZXRlKHRoaXMuZWxlbWVudCk7XG4gICAgICBpZiAodGhpcy5fb3JpZ2luYWxFbGVtZW50KSB7XG4gICAgICAgIHBsYXllck1hcC5kZWxldGUodGhpcy5fb3JpZ2luYWxFbGVtZW50KTtcbiAgICAgICAgdGhpcy5fb3JpZ2luYWxFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS12aW1lby1pbml0aWFsaXplZCcpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZWxlbWVudCAmJiB0aGlzLmVsZW1lbnQubm9kZU5hbWUgPT09ICdJRlJBTUUnICYmIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgIC8vIElmIHdlJ3ZlIGFkZGVkIGFuIGFkZGl0aW9uYWwgd3JhcHBlciBkaXYsIHJlbW92ZSB0aGF0IGZyb20gdGhlIERPTS5cbiAgICAgICAgLy8gSWYgbm90LCBqdXN0IHJlbW92ZSB0aGUgaWZyYW1lIGVsZW1lbnQuXG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5wYXJlbnROb2RlICYmIHRoaXMuX29yaWdpbmFsRWxlbWVudCAmJiB0aGlzLl9vcmlnaW5hbEVsZW1lbnQgIT09IHRoaXMuZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgY2xpcCBpcyBwcml2YXRlIHRoZXJlIGlzIGEgY2FzZSB3aGVyZSB0aGUgZWxlbWVudCBzdGF5cyB0aGVcbiAgICAgIC8vIGRpdiBlbGVtZW50LiBEZXN0cm95IHNob3VsZCByZXNldCB0aGUgZGl2IGFuZCByZW1vdmUgdGhlIGlmcmFtZSBjaGlsZC5cbiAgICAgIGlmICh0aGlzLmVsZW1lbnQgJiYgdGhpcy5lbGVtZW50Lm5vZGVOYW1lID09PSAnRElWJyAmJiB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXZpbWVvLWluaXRpYWxpemVkJyk7XG4gICAgICAgIGNvbnN0IGlmcmFtZSA9IHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCdpZnJhbWUnKTtcbiAgICAgICAgaWYgKGlmcmFtZSAmJiBpZnJhbWUucGFyZW50Tm9kZSkge1xuICAgICAgICAgIC8vIElmIHdlJ3ZlIGFkZGVkIGFuIGFkZGl0aW9uYWwgd3JhcHBlciBkaXYsIHJlbW92ZSB0aGF0IGZyb20gdGhlIERPTS5cbiAgICAgICAgICAvLyBJZiBub3QsIGp1c3QgcmVtb3ZlIHRoZSBpZnJhbWUgZWxlbWVudC5cbiAgICAgICAgICBpZiAoaWZyYW1lLnBhcmVudE5vZGUucGFyZW50Tm9kZSAmJiB0aGlzLl9vcmlnaW5hbEVsZW1lbnQgJiYgdGhpcy5fb3JpZ2luYWxFbGVtZW50ICE9PSBpZnJhbWUucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgaWZyYW1lLnBhcmVudE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpZnJhbWUucGFyZW50Tm9kZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmcmFtZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl93aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuX29uTWVzc2FnZSk7XG4gICAgICBpZiAoc2NyZWVuZnVsbC5pc0VuYWJsZWQpIHtcbiAgICAgICAgc2NyZWVuZnVsbC5vZmYoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCB0aGlzLmZ1bGxzY3JlZW5jaGFuZ2VIYW5kbGVyKTtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBhdXRvcGF1c2UgYmVoYXZpb3Igb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRBdXRvcGF1c2VQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtib29sZWFufSBXaGV0aGVyIGF1dG9wYXVzZSBpcyB0dXJuZWQgb24gb3Igb2ZmLlxuICAgKiBAcmVqZWN0IHtVbnN1cHBvcnRlZEVycm9yfSBBdXRvcGF1c2UgaXMgbm90IHN1cHBvcnRlZCB3aXRoIHRoZSBjdXJyZW50XG4gICAqICAgICAgICAgcGxheWVyIG9yIGJyb3dzZXIuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBhdXRvcGF1c2UgYmVoYXZpb3IgZm9yIHRoaXMgcGxheWVyLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRBdXRvcGF1c2VQcm9taXNlfVxuICAgKi9cbiAgZ2V0QXV0b3BhdXNlKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnYXV0b3BhdXNlJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIHNldCB0aGUgYXV0b3BhdXNlIGJlaGF2aW9yIG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgU2V0QXV0b3BhdXNlUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7Ym9vbGVhbn0gV2hldGhlciBhdXRvcGF1c2UgaXMgdHVybmVkIG9uIG9yIG9mZi5cbiAgICogQHJlamVjdCB7VW5zdXBwb3J0ZWRFcnJvcn0gQXV0b3BhdXNlIGlzIG5vdCBzdXBwb3J0ZWQgd2l0aCB0aGUgY3VycmVudFxuICAgKiAgICAgICAgIHBsYXllciBvciBicm93c2VyLlxuICAgKi9cbiAgLyoqXG4gICAqIEVuYWJsZSBvciBkaXNhYmxlIHRoZSBhdXRvcGF1c2UgYmVoYXZpb3Igb2YgdGhpcyBwbGF5ZXIuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHdoZW4gYW5vdGhlciB2aWRlbyBpcyBwbGF5ZWQgaW4gdGhlIHNhbWUgYnJvd3NlciwgdGhpc1xuICAgKiBwbGF5ZXIgd2lsbCBhdXRvbWF0aWNhbGx5IHBhdXNlLiBVbmxlc3MgeW91IGhhdmUgYSBzcGVjaWZpYyByZWFzb25cbiAgICogZm9yIGRvaW5nIHNvLCB3ZSByZWNvbW1lbmQgdGhhdCB5b3UgbGVhdmUgYXV0b3BhdXNlIHNldCB0byB0aGVcbiAgICogZGVmYXVsdCAoYHRydWVgKS5cbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBhdXRvcGF1c2VcbiAgICogQHJldHVybiB7U2V0QXV0b3BhdXNlUHJvbWlzZX1cbiAgICovXG4gIHNldEF1dG9wYXVzZShhdXRvcGF1c2UpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQoJ2F1dG9wYXVzZScsIGF1dG9wYXVzZSk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgYnVmZmVyZWQgcHJvcGVydHkgb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRCdWZmZXJlZFByb21pc2VcbiAgICogQGZ1bGZpbGwge0FycmF5fSBCdWZmZXJlZCBUaW1lcmFuZ2VzIGNvbnZlcnRlZCB0byBhbiBBcnJheS5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJ1ZmZlcmVkIHByb3BlcnR5IG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHJldHVybiB7R2V0QnVmZmVyZWRQcm9taXNlfVxuICAgKi9cbiAgZ2V0QnVmZmVyZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdidWZmZXJlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IENhbWVyYVByb3BlcnRpZXNcbiAgICogQHByb3Age251bWJlcn0gcHJvcHMueWF3IC0gTnVtYmVyIGJldHdlZW4gMCBhbmQgMzYwLlxuICAgKiBAcHJvcCB7bnVtYmVyfSBwcm9wcy5waXRjaCAtIE51bWJlciBiZXR3ZWVuIC05MCBhbmQgOTAuXG4gICAqIEBwcm9wIHtudW1iZXJ9IHByb3BzLnJvbGwgLSBOdW1iZXIgYmV0d2VlbiAtMTgwIGFuZCAxODAuXG4gICAqIEBwcm9wIHtudW1iZXJ9IHByb3BzLmZvdiAtIFRoZSBmaWVsZCBvZiB2aWV3IGluIGRlZ3JlZXMuXG4gICAqL1xuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgY2FtZXJhIHByb3BlcnRpZXMgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgR2V0Q2FtZXJhUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7Q2FtZXJhUHJvcGVydGllc30gVGhlIGNhbWVyYSBwcm9wZXJ0aWVzLlxuICAgKi9cbiAgLyoqXG4gICAqIEZvciAzNjDCsCB2aWRlb3MgZ2V0IHRoZSBjYW1lcmEgcHJvcGVydGllcyBmb3IgdGhpcyBwbGF5ZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldENhbWVyYVByb21pc2V9XG4gICAqL1xuICBnZXRDYW1lcmFQcm9wcygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ2NhbWVyYVByb3BzJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIHNldCB0aGUgY2FtZXJhIHByb3BlcnRpZXMgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgU2V0Q2FtZXJhUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7T2JqZWN0fSBUaGUgY2FtZXJhIHdhcyBzdWNjZXNzZnVsbHkgc2V0LlxuICAgKiBAcmVqZWN0IHtSYW5nZUVycm9yfSBUaGUgcmFuZ2Ugd2FzIG91dCBvZiBib3VuZHMuXG4gICAqL1xuICAvKipcbiAgICogRm9yIDM2MMKwIHZpZGVvcyBzZXQgdGhlIGNhbWVyYSBwcm9wZXJ0aWVzIGZvciB0aGlzIHBsYXllci5cbiAgICpcbiAgICogQHBhcmFtIHtDYW1lcmFQcm9wZXJ0aWVzfSBjYW1lcmEgVGhlIGNhbWVyYSBwcm9wZXJ0aWVzXG4gICAqIEByZXR1cm4ge1NldENhbWVyYVByb21pc2V9XG4gICAqL1xuICBzZXRDYW1lcmFQcm9wcyhjYW1lcmEpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQoJ2NhbWVyYVByb3BzJywgY2FtZXJhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgY2hhcHRlci5cbiAgICpcbiAgICogQHR5cGVkZWYge09iamVjdH0gVmltZW9DaGFwdGVyXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzdGFydFRpbWUgVGhlIHN0YXJ0IHRpbWUgb2YgdGhlIGNoYXB0ZXIuXG4gICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSB0aXRsZSBUaGUgdGl0bGUgb2YgdGhlIGNoYXB0ZXIuXG4gICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBpbmRleCBUaGUgcGxhY2UgaW4gdGhlIG9yZGVyIG9mIENoYXB0ZXJzLiBTdGFydHMgYXQgMS5cbiAgICovXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IGNoYXB0ZXJzIGZvciB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldENoYXB0ZXJzUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7VmltZW9DaGFwdGVyW119IFRoZSBjaGFwdGVycyBmb3IgdGhlIHZpZGVvLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCBhbiBhcnJheSBvZiBhbGwgdGhlIGNoYXB0ZXJzIGZvciB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldENoYXB0ZXJzUHJvbWlzZX1cbiAgICovXG4gIGdldENoYXB0ZXJzKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnY2hhcHRlcnMnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBjdXJyZW50bHkgYWN0aXZlIGNoYXB0ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIEdldEN1cnJlbnRDaGFwdGVyc1Byb21pc2VcbiAgICogQGZ1bGZpbGwge1ZpbWVvQ2hhcHRlcnx1bmRlZmluZWR9IFRoZSBjdXJyZW50IGNoYXB0ZXIgZm9yIHRoZSB2aWRlby5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnRseSBhY3RpdmUgY2hhcHRlciBmb3IgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRDdXJyZW50Q2hhcHRlcnNQcm9taXNlfVxuICAgKi9cbiAgZ2V0Q3VycmVudENoYXB0ZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdjdXJyZW50Q2hhcHRlcicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIGFjY2VudCBjb2xvciBvZiB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRDb2xvclByb21pc2VcbiAgICogQGZ1bGZpbGwge3N0cmluZ30gVGhlIGhleCBjb2xvciBvZiB0aGUgcGxheWVyLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgYWNjZW50IGNvbG9yIGZvciB0aGlzIHBsYXllci4gTm90ZSB0aGlzIGlzIGRlcHJlY2F0ZWQgaW4gcGxhY2Ugb2YgYGdldENvbG9yVHdvYC5cbiAgICpcbiAgICogQHJldHVybiB7R2V0Q29sb3JQcm9taXNlfVxuICAgKi9cbiAgZ2V0Q29sb3IoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdjb2xvcicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgYWxsIGNvbG9ycyBmb3IgdGhlIHBsYXllciBpbiBhbiBhcnJheS5cbiAgICpcbiAgICogQHByb21pc2UgR2V0Q29sb3JzUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7c3RyaW5nW119IFRoZSBoZXggY29sb3JzIG9mIHRoZSBwbGF5ZXIuXG4gICAqL1xuICAvKipcbiAgICogR2V0IGFsbCB0aGUgY29sb3JzIGZvciB0aGlzIHBsYXllciBpbiBhbiBhcnJheTogW2NvbG9yT25lLCBjb2xvclR3bywgY29sb3JUaHJlZSwgY29sb3JGb3VyXVxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRDb2xvclByb21pc2V9XG4gICAqL1xuICBnZXRDb2xvcnMoKSB7XG4gICAgcmV0dXJuIG5wb19zcmMuYWxsKFt0aGlzLmdldCgnY29sb3JPbmUnKSwgdGhpcy5nZXQoJ2NvbG9yVHdvJyksIHRoaXMuZ2V0KCdjb2xvclRocmVlJyksIHRoaXMuZ2V0KCdjb2xvckZvdXInKV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBzZXQgdGhlIGFjY2VudCBjb2xvciBvZiB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBTZXRDb2xvclByb21pc2VcbiAgICogQGZ1bGZpbGwge3N0cmluZ30gVGhlIGNvbG9yIHdhcyBzdWNjZXNzZnVsbHkgc2V0LlxuICAgKiBAcmVqZWN0IHtUeXBlRXJyb3J9IFRoZSBzdHJpbmcgd2FzIG5vdCBhIHZhbGlkIGhleCBvciByZ2IgY29sb3IuXG4gICAqIEByZWplY3Qge0NvbnRyYXN0RXJyb3J9IFRoZSBjb2xvciB3YXMgc2V0LCBidXQgdGhlIGNvbnRyYXN0IGlzXG4gICAqICAgICAgICAgb3V0c2lkZSBvZiB0aGUgYWNjZXB0YWJsZSByYW5nZS5cbiAgICogQHJlamVjdCB7RW1iZWRTZXR0aW5nc0Vycm9yfSBUaGUgb3duZXIgb2YgdGhlIHBsYXllciBoYXMgY2hvc2VuIHRvXG4gICAqICAgICAgICAgdXNlIGEgc3BlY2lmaWMgY29sb3IuXG4gICAqL1xuICAvKipcbiAgICogU2V0IHRoZSBhY2NlbnQgY29sb3Igb2YgdGhpcyBwbGF5ZXIgdG8gYSBoZXggb3IgcmdiIHN0cmluZy4gU2V0dGluZyB0aGVcbiAgICogY29sb3IgbWF5IGZhaWwgaWYgdGhlIG93bmVyIG9mIHRoZSB2aWRlbyBoYXMgc2V0IHRoZWlyIGVtYmVkXG4gICAqIHByZWZlcmVuY2VzIHRvIGZvcmNlIGEgc3BlY2lmaWMgY29sb3IuXG4gICAqIE5vdGUgdGhpcyBpcyBkZXByZWNhdGVkIGluIHBsYWNlIG9mIGBzZXRDb2xvclR3b2AuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2xvciBUaGUgaGV4IG9yIHJnYiBjb2xvciBzdHJpbmcgdG8gc2V0LlxuICAgKiBAcmV0dXJuIHtTZXRDb2xvclByb21pc2V9XG4gICAqL1xuICBzZXRDb2xvcihjb2xvcikge1xuICAgIHJldHVybiB0aGlzLnNldCgnY29sb3InLCBjb2xvcik7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIHNldCBhbGwgY29sb3JzIGZvciB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBTZXRDb2xvcnNQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtzdHJpbmdbXX0gVGhlIGNvbG9ycyB3ZXJlIHN1Y2Nlc3NmdWxseSBzZXQuXG4gICAqIEByZWplY3Qge1R5cGVFcnJvcn0gVGhlIHN0cmluZyB3YXMgbm90IGEgdmFsaWQgaGV4IG9yIHJnYiBjb2xvci5cbiAgICogQHJlamVjdCB7Q29udHJhc3RFcnJvcn0gVGhlIGNvbG9yIHdhcyBzZXQsIGJ1dCB0aGUgY29udHJhc3QgaXNcbiAgICogICAgICAgICBvdXRzaWRlIG9mIHRoZSBhY2NlcHRhYmxlIHJhbmdlLlxuICAgKiBAcmVqZWN0IHtFbWJlZFNldHRpbmdzRXJyb3J9IFRoZSBvd25lciBvZiB0aGUgcGxheWVyIGhhcyBjaG9zZW4gdG9cbiAgICogICAgICAgICB1c2UgYSBzcGVjaWZpYyBjb2xvci5cbiAgICovXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvbG9ycyBvZiB0aGlzIHBsYXllciB0byBhIGhleCBvciByZ2Igc3RyaW5nLiBTZXR0aW5nIHRoZVxuICAgKiBjb2xvciBtYXkgZmFpbCBpZiB0aGUgb3duZXIgb2YgdGhlIHZpZGVvIGhhcyBzZXQgdGhlaXIgZW1iZWRcbiAgICogcHJlZmVyZW5jZXMgdG8gZm9yY2UgYSBzcGVjaWZpYyBjb2xvci5cbiAgICogVGhlIGNvbG9ycyBzaG91bGQgYmUgcGFzc2VkIGluIGFzIGFuIGFycmF5OiBbY29sb3JPbmUsIGNvbG9yVHdvLCBjb2xvclRocmVlLCBjb2xvckZvdXJdLlxuICAgKiBJZiBhIGNvbG9yIHNob3VsZCBub3QgYmUgc2V0LCB0aGUgaW5kZXggaW4gdGhlIGFycmF5IGNhbiBiZSBsZWZ0IGFzIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IGNvbG9ycyBBcnJheSBvZiB0aGUgaGV4IG9yIHJnYiBjb2xvciBzdHJpbmdzIHRvIHNldC5cbiAgICogQHJldHVybiB7U2V0Q29sb3JzUHJvbWlzZX1cbiAgICovXG4gIHNldENvbG9ycyhjb2xvcnMpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoY29sb3JzKSkge1xuICAgICAgcmV0dXJuIG5ldyBucG9fc3JjKChyZXNvbHZlLCByZWplY3QpID0+IHJlamVjdChuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGFuIGFycmF5LicpKSk7XG4gICAgfVxuICAgIGNvbnN0IG51bGxQcm9taXNlID0gbmV3IG5wb19zcmMocmVzb2x2ZSA9PiByZXNvbHZlKG51bGwpKTtcbiAgICBjb25zdCBjb2xvclByb21pc2VzID0gW2NvbG9yc1swXSA/IHRoaXMuc2V0KCdjb2xvck9uZScsIGNvbG9yc1swXSkgOiBudWxsUHJvbWlzZSwgY29sb3JzWzFdID8gdGhpcy5zZXQoJ2NvbG9yVHdvJywgY29sb3JzWzFdKSA6IG51bGxQcm9taXNlLCBjb2xvcnNbMl0gPyB0aGlzLnNldCgnY29sb3JUaHJlZScsIGNvbG9yc1syXSkgOiBudWxsUHJvbWlzZSwgY29sb3JzWzNdID8gdGhpcy5zZXQoJ2NvbG9yRm91cicsIGNvbG9yc1szXSkgOiBudWxsUHJvbWlzZV07XG4gICAgcmV0dXJuIG5wb19zcmMuYWxsKGNvbG9yUHJvbWlzZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcmVwcmVzZW50YXRpb24gb2YgYSBjdWUgcG9pbnQuXG4gICAqXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IFZpbWVvQ3VlUG9pbnRcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IHRpbWUgVGhlIHRpbWUgb2YgdGhlIGN1ZSBwb2ludC5cbiAgICogQHByb3BlcnR5IHtvYmplY3R9IGRhdGEgVGhlIGRhdGEgcGFzc2VkIHdoZW4gYWRkaW5nIHRoZSBjdWUgcG9pbnQuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBpZCBUaGUgdW5pcXVlIGlkIGZvciB1c2Ugd2l0aCByZW1vdmVDdWVQb2ludC5cbiAgICovXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBjdWUgcG9pbnRzIG9mIGEgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldEN1ZVBvaW50c1Byb21pc2VcbiAgICogQGZ1bGZpbGwge1ZpbWVvQ3VlUG9pbnRbXX0gVGhlIGN1ZSBwb2ludHMgYWRkZWQgdG8gdGhlIHZpZGVvLlxuICAgKiBAcmVqZWN0IHtVbnN1cHBvcnRlZEVycm9yfSBDdWUgcG9pbnRzIGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggdGhlIGN1cnJlbnRcbiAgICogICAgICAgICBwbGF5ZXIgb3IgYnJvd3Nlci5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgYW4gYXJyYXkgb2YgdGhlIGN1ZSBwb2ludHMgYWRkZWQgdG8gdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRDdWVQb2ludHNQcm9taXNlfVxuICAgKi9cbiAgZ2V0Q3VlUG9pbnRzKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnY3VlUG9pbnRzJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgY3VycmVudCB0aW1lIG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0Q3VycmVudFRpbWVQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtudW1iZXJ9IFRoZSBjdXJyZW50IHRpbWUgaW4gc2Vjb25kcy5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnQgcGxheWJhY2sgcG9zaXRpb24gaW4gc2Vjb25kcy5cbiAgICpcbiAgICogQHJldHVybiB7R2V0Q3VycmVudFRpbWVQcm9taXNlfVxuICAgKi9cbiAgZ2V0Q3VycmVudFRpbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdjdXJyZW50VGltZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBzZXQgdGhlIGN1cnJlbnQgdGltZSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIFNldEN1cnJlbnRUaW1lUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgYWN0dWFsIGN1cnJlbnQgdGltZSB0aGF0IHdhcyBzZXQuXG4gICAqIEByZWplY3Qge1JhbmdlRXJyb3J9IHRoZSB0aW1lIHdhcyBsZXNzIHRoYW4gMCBvciBncmVhdGVyIHRoYW4gdGhlXG4gICAqICAgICAgICAgdmlkZW/igJlzIGR1cmF0aW9uLlxuICAgKi9cbiAgLyoqXG4gICAqIFNldCB0aGUgY3VycmVudCBwbGF5YmFjayBwb3NpdGlvbiBpbiBzZWNvbmRzLiBJZiB0aGUgcGxheWVyIHdhc1xuICAgKiBwYXVzZWQsIGl0IHdpbGwgcmVtYWluIHBhdXNlZC4gTGlrZXdpc2UsIGlmIHRoZSBwbGF5ZXIgd2FzIHBsYXlpbmcsXG4gICAqIGl0IHdpbGwgcmVzdW1lIHBsYXlpbmcgb25jZSB0aGUgdmlkZW8gaGFzIGJ1ZmZlcmVkLlxuICAgKlxuICAgKiBZb3UgY2FuIHByb3ZpZGUgYW4gYWNjdXJhdGUgdGltZSBhbmQgdGhlIHBsYXllciB3aWxsIGF0dGVtcHQgdG8gc2Vla1xuICAgKiB0byBhcyBjbG9zZSB0byB0aGF0IHRpbWUgYXMgcG9zc2libGUuIFRoZSBleGFjdCB0aW1lIHdpbGwgYmUgdGhlXG4gICAqIGZ1bGZpbGxlZCB2YWx1ZSBvZiB0aGUgcHJvbWlzZS5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRUaW1lXG4gICAqIEByZXR1cm4ge1NldEN1cnJlbnRUaW1lUHJvbWlzZX1cbiAgICovXG4gIHNldEN1cnJlbnRUaW1lKGN1cnJlbnRUaW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0KCdjdXJyZW50VGltZScsIGN1cnJlbnRUaW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBkdXJhdGlvbiBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldER1cmF0aW9uUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgZHVyYXRpb24gaW4gc2Vjb25kcy5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGR1cmF0aW9uIG9mIHRoZSB2aWRlbyBpbiBzZWNvbmRzLiBJdCB3aWxsIGJlIHJvdW5kZWQgdG8gdGhlXG4gICAqIG5lYXJlc3Qgc2Vjb25kIGJlZm9yZSBwbGF5YmFjayBiZWdpbnMsIGFuZCB0byB0aGUgbmVhcmVzdCB0aG91c2FuZHRoXG4gICAqIG9mIGEgc2Vjb25kIGFmdGVyIHBsYXliYWNrIGJlZ2lucy5cbiAgICpcbiAgICogQHJldHVybiB7R2V0RHVyYXRpb25Qcm9taXNlfVxuICAgKi9cbiAgZ2V0RHVyYXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdkdXJhdGlvbicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIGVuZGVkIHN0YXRlIG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0RW5kZWRQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtib29sZWFufSBXaGV0aGVyIG9yIG5vdCB0aGUgdmlkZW8gaGFzIGVuZGVkLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgZW5kZWQgc3RhdGUgb2YgdGhlIHZpZGVvLiBUaGUgdmlkZW8gaGFzIGVuZGVkIGlmXG4gICAqIGBjdXJyZW50VGltZSA9PT0gZHVyYXRpb25gLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRFbmRlZFByb21pc2V9XG4gICAqL1xuICBnZXRFbmRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ2VuZGVkJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgbG9vcCBzdGF0ZSBvZiB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRMb29wUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgdGhlIHBsYXllciBpcyBzZXQgdG8gbG9vcC5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxvb3Agc3RhdGUgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHJldHVybiB7R2V0TG9vcFByb21pc2V9XG4gICAqL1xuICBnZXRMb29wKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnbG9vcCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBzZXQgdGhlIGxvb3Agc3RhdGUgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgU2V0TG9vcFByb21pc2VcbiAgICogQGZ1bGZpbGwge2Jvb2xlYW59IFRoZSBsb29wIHN0YXRlIHRoYXQgd2FzIHNldC5cbiAgICovXG4gIC8qKlxuICAgKiBTZXQgdGhlIGxvb3Agc3RhdGUgb2YgdGhlIHBsYXllci4gV2hlbiBzZXQgdG8gYHRydWVgLCB0aGUgcGxheWVyXG4gICAqIHdpbGwgc3RhcnQgb3ZlciBpbW1lZGlhdGVseSBvbmNlIHBsYXliYWNrIGVuZHMuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gbG9vcFxuICAgKiBAcmV0dXJuIHtTZXRMb29wUHJvbWlzZX1cbiAgICovXG4gIHNldExvb3AobG9vcCkge1xuICAgIHJldHVybiB0aGlzLnNldCgnbG9vcCcsIGxvb3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBzZXQgdGhlIG11dGVkIHN0YXRlIG9mIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIFNldE11dGVkUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7Ym9vbGVhbn0gVGhlIG11dGVkIHN0YXRlIHRoYXQgd2FzIHNldC5cbiAgICovXG4gIC8qKlxuICAgKiBTZXQgdGhlIG11dGVkIHN0YXRlIG9mIHRoZSBwbGF5ZXIuIFdoZW4gc2V0IHRvIGB0cnVlYCwgdGhlIHBsYXllclxuICAgKiB2b2x1bWUgd2lsbCBiZSBtdXRlZC5cbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBtdXRlZFxuICAgKiBAcmV0dXJuIHtTZXRNdXRlZFByb21pc2V9XG4gICAqL1xuICBzZXRNdXRlZChtdXRlZCkge1xuICAgIHJldHVybiB0aGlzLnNldCgnbXV0ZWQnLCBtdXRlZCk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgbXV0ZWQgc3RhdGUgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgR2V0TXV0ZWRQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtib29sZWFufSBXaGV0aGVyIG9yIG5vdCB0aGUgcGxheWVyIGlzIG11dGVkLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgbXV0ZWQgc3RhdGUgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHJldHVybiB7R2V0TXV0ZWRQcm9taXNlfVxuICAgKi9cbiAgZ2V0TXV0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdtdXRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIHBhdXNlZCBzdGF0ZSBvZiB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRMb29wUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgdGhlIHZpZGVvIGlzIHBhdXNlZC5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBhdXNlZCBzdGF0ZSBvZiB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRMb29wUHJvbWlzZX1cbiAgICovXG4gIGdldFBhdXNlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3BhdXNlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIHBsYXliYWNrIHJhdGUgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgR2V0UGxheWJhY2tSYXRlUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgcGxheWJhY2sgcmF0ZSBvZiB0aGUgcGxheWVyIG9uIGEgc2NhbGUgZnJvbSAwIHRvIDIuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBwbGF5YmFjayByYXRlIG9mIHRoZSBwbGF5ZXIgb24gYSBzY2FsZSBmcm9tIGAwYCB0byBgMmAuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFBsYXliYWNrUmF0ZVByb21pc2V9XG4gICAqL1xuICBnZXRQbGF5YmFja1JhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdwbGF5YmFja1JhdGUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gc2V0IHRoZSBwbGF5YmFja3JhdGUgb2YgdGhlIHBsYXllci5cbiAgICpcbiAgICogQHByb21pc2UgU2V0UGxheWJhY2tSYXRlUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgcGxheWJhY2sgcmF0ZSB3YXMgc2V0LlxuICAgKiBAcmVqZWN0IHtSYW5nZUVycm9yfSBUaGUgcGxheWJhY2sgcmF0ZSB3YXMgbGVzcyB0aGFuIDAgb3IgZ3JlYXRlciB0aGFuIDIuXG4gICAqL1xuICAvKipcbiAgICogU2V0IHRoZSBwbGF5YmFjayByYXRlIG9mIHRoZSBwbGF5ZXIgb24gYSBzY2FsZSBmcm9tIGAwYCB0byBgMmAuIFdoZW4gc2V0XG4gICAqIHZpYSB0aGUgQVBJLCB0aGUgcGxheWJhY2sgcmF0ZSB3aWxsIG5vdCBiZSBzeW5jaHJvbml6ZWQgdG8gb3RoZXJcbiAgICogcGxheWVycyBvciBzdG9yZWQgYXMgdGhlIHZpZXdlcidzIHByZWZlcmVuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBwbGF5YmFja1JhdGVcbiAgICogQHJldHVybiB7U2V0UGxheWJhY2tSYXRlUHJvbWlzZX1cbiAgICovXG4gIHNldFBsYXliYWNrUmF0ZShwbGF5YmFja1JhdGUpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQoJ3BsYXliYWNrUmF0ZScsIHBsYXliYWNrUmF0ZSk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgcGxheWVkIHByb3BlcnR5IG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0UGxheWVkUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7QXJyYXl9IFBsYXllZCBUaW1lcmFuZ2VzIGNvbnZlcnRlZCB0byBhbiBBcnJheS5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBsYXllZCBwcm9wZXJ0eSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFBsYXllZFByb21pc2V9XG4gICAqL1xuICBnZXRQbGF5ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdwbGF5ZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBxdWFsaXRpZXMgYXZhaWxhYmxlIG9mIHRoZSBjdXJyZW50IHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRRdWFsaXRpZXNQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtBcnJheX0gVGhlIHF1YWxpdGllcyBvZiB0aGUgdmlkZW8uXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBxdWFsaXRpZXMgb2YgdGhlIGN1cnJlbnQgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFF1YWxpdGllc1Byb21pc2V9XG4gICAqL1xuICBnZXRRdWFsaXRpZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdxdWFsaXRpZXMnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBjdXJyZW50IHNldCBxdWFsaXR5IG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0UXVhbGl0eVByb21pc2VcbiAgICogQGZ1bGZpbGwge3N0cmluZ30gVGhlIGN1cnJlbnQgc2V0IHF1YWxpdHkuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IHNldCBxdWFsaXR5IG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHJldHVybiB7R2V0UXVhbGl0eVByb21pc2V9XG4gICAqL1xuICBnZXRRdWFsaXR5KCkge1xuICAgIHJldHVybiB0aGlzLmdldCgncXVhbGl0eScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBzZXQgdGhlIHZpZGVvIHF1YWxpdHkuXG4gICAqXG4gICAqIEBwcm9taXNlIFNldFF1YWxpdHlQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtudW1iZXJ9IFRoZSBxdWFsaXR5IHdhcyBzZXQuXG4gICAqIEByZWplY3Qge1JhbmdlRXJyb3J9IFRoZSBxdWFsaXR5IGlzIG5vdCBhdmFpbGFibGUuXG4gICAqL1xuICAvKipcbiAgICogU2V0IGEgdmlkZW8gcXVhbGl0eS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHF1YWxpdHlcbiAgICogQHJldHVybiB7U2V0UXVhbGl0eVByb21pc2V9XG4gICAqL1xuICBzZXRRdWFsaXR5KHF1YWxpdHkpIHtcbiAgICByZXR1cm4gdGhpcy5zZXQoJ3F1YWxpdHknLCBxdWFsaXR5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSByZW1vdGUgcGxheWJhY2sgYXZhaWxhYmlsaXR5LlxuICAgKlxuICAgKiBAcHJvbWlzZSBSZW1vdGVQbGF5YmFja0F2YWlsYWJpbGl0eVByb21pc2VcbiAgICogQGZ1bGZpbGwge2Jvb2xlYW59IFdoZXRoZXIgcmVtb3RlIHBsYXliYWNrIGlzIGF2YWlsYWJsZS5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGF2YWlsYWJpbGl0eSBvZiByZW1vdGUgcGxheWJhY2suXG4gICAqXG4gICAqIEByZXR1cm4ge1JlbW90ZVBsYXliYWNrQXZhaWxhYmlsaXR5UHJvbWlzZX1cbiAgICovXG4gIGdldFJlbW90ZVBsYXliYWNrQXZhaWxhYmlsaXR5KCkge1xuICAgIHJldHVybiB0aGlzLmdldCgncmVtb3RlUGxheWJhY2tBdmFpbGFiaWxpdHknKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBjdXJyZW50IHJlbW90ZSBwbGF5YmFjayBzdGF0ZS5cbiAgICpcbiAgICogQHByb21pc2UgUmVtb3RlUGxheWJhY2tTdGF0ZVByb21pc2VcbiAgICogQGZ1bGZpbGwge3N0cmluZ30gVGhlIHN0YXRlIG9mIHRoZSByZW1vdGUgcGxheWJhY2s6IGNvbm5lY3RpbmcsIGNvbm5lY3RlZCwgb3IgZGlzY29ubmVjdGVkLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCByZW1vdGUgcGxheWJhY2sgc3RhdGUuXG4gICAqXG4gICAqIEByZXR1cm4ge1JlbW90ZVBsYXliYWNrU3RhdGVQcm9taXNlfVxuICAgKi9cbiAgZ2V0UmVtb3RlUGxheWJhY2tTdGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3JlbW90ZVBsYXliYWNrU3RhdGUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBzZWVrYWJsZSBwcm9wZXJ0eSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldFNlZWthYmxlUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7QXJyYXl9IFNlZWthYmxlIFRpbWVyYW5nZXMgY29udmVydGVkIHRvIGFuIEFycmF5LlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgc2Vla2FibGUgcHJvcGVydHkgb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRTZWVrYWJsZVByb21pc2V9XG4gICAqL1xuICBnZXRTZWVrYWJsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3NlZWthYmxlJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgc2Vla2luZyBwcm9wZXJ0eSBvZiB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRTZWVraW5nUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgdGhlIHBsYXllciBpcyBjdXJyZW50bHkgc2Vla2luZy5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgaWYgdGhlIHBsYXllciBpcyBjdXJyZW50bHkgc2Vla2luZy5cbiAgICpcbiAgICogQHJldHVybiB7R2V0U2Vla2luZ1Byb21pc2V9XG4gICAqL1xuICBnZXRTZWVraW5nKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgnc2Vla2luZycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIHRleHQgdHJhY2tzIG9mIGEgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldFRleHRUcmFja3NQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtWaW1lb1RleHRUcmFja1tdfSBUaGUgdGV4dCB0cmFja3MgYXNzb2NpYXRlZCB3aXRoIHRoZSB2aWRlby5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgYW4gYXJyYXkgb2YgdGhlIHRleHQgdHJhY2tzIHRoYXQgZXhpc3QgZm9yIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHJldHVybiB7R2V0VGV4dFRyYWNrc1Byb21pc2V9XG4gICAqL1xuICBnZXRUZXh0VHJhY2tzKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgndGV4dFRyYWNrcycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIGF1ZGlvIHRyYWNrcyBvZiBhIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRBdWRpb1RyYWNrc1Byb21pc2VcbiAgICogQGZ1bGZpbGwge1ZpbWVvQXVkaW9UcmFja1tdfSBUaGUgYXVkaW8gdHJhY2tzIGFzc29jaWF0ZWQgd2l0aCB0aGUgdmlkZW8uXG4gICAqL1xuICAvKipcbiAgICogR2V0IGFuIGFycmF5IG9mIHRoZSBhdWRpbyB0cmFja3MgdGhhdCBleGlzdCBmb3IgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRBdWRpb1RyYWNrc1Byb21pc2V9XG4gICAqL1xuICBnZXRBdWRpb1RyYWNrcygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ2F1ZGlvVHJhY2tzJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgZW5hYmxlZCBhdWRpbyB0cmFjayBvZiBhIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRBdWRpb1RyYWNrUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7VmltZW9BdWRpb1RyYWNrfSBUaGUgZW5hYmxlZCBhdWRpbyB0cmFjay5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIGVuYWJsZWQgYXVkaW8gdHJhY2sgZm9yIGEgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldEF1ZGlvVHJhY2tQcm9taXNlfVxuICAgKi9cbiAgZ2V0RW5hYmxlZEF1ZGlvVHJhY2soKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCdlbmFibGVkQXVkaW9UcmFjaycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbWFpbiBhdWRpbyB0cmFjayBmb3IgYSB2aWRlby5cbiAgICpcbiAgICogQHJldHVybiB7R2V0QXVkaW9UcmFja1Byb21pc2V9XG4gICAqL1xuICBnZXREZWZhdWx0QXVkaW9UcmFjaygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ2RlZmF1bHRBdWRpb1RyYWNrJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgZW1iZWQgY29kZSBmb3IgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRWaWRlb0VtYmVkQ29kZVByb21pc2VcbiAgICogQGZ1bGZpbGwge3N0cmluZ30gVGhlIGA8aWZyYW1lPmAgZW1iZWQgY29kZSBmb3IgdGhlIHZpZGVvLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgYDxpZnJhbWU+YCBlbWJlZCBjb2RlIGZvciB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFZpZGVvRW1iZWRDb2RlUHJvbWlzZX1cbiAgICovXG4gIGdldFZpZGVvRW1iZWRDb2RlKCkge1xuICAgIHJldHVybiB0aGlzLmdldCgndmlkZW9FbWJlZENvZGUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBpZCBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldFZpZGVvSWRQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtudW1iZXJ9IFRoZSBpZCBvZiB0aGUgdmlkZW8uXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBpZCBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFZpZGVvSWRQcm9taXNlfVxuICAgKi9cbiAgZ2V0VmlkZW9JZCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3ZpZGVvSWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSB0aXRsZSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEBwcm9taXNlIEdldFZpZGVvVGl0bGVQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtudW1iZXJ9IFRoZSB0aXRsZSBvZiB0aGUgdmlkZW8uXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSB0aXRsZSBvZiB0aGUgdmlkZW8uXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFZpZGVvVGl0bGVQcm9taXNlfVxuICAgKi9cbiAgZ2V0VmlkZW9UaXRsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3ZpZGVvVGl0bGUnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBuYXRpdmUgd2lkdGggb2YgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcHJvbWlzZSBHZXRWaWRlb1dpZHRoUHJvbWlzZVxuICAgKiBAZnVsZmlsbCB7bnVtYmVyfSBUaGUgbmF0aXZlIHdpZHRoIG9mIHRoZSB2aWRlby5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIG5hdGl2ZSB3aWR0aCBvZiB0aGUgY3VycmVudGx54oCQcGxheWluZyB2aWRlby4gVGhlIHdpZHRoIG9mXG4gICAqIHRoZSBoaWdoZXN04oCQcmVzb2x1dGlvbiBhdmFpbGFibGUgd2lsbCBiZSB1c2VkIGJlZm9yZSBwbGF5YmFjayBiZWdpbnMuXG4gICAqXG4gICAqIEByZXR1cm4ge0dldFZpZGVvV2lkdGhQcm9taXNlfVxuICAgKi9cbiAgZ2V0VmlkZW9XaWR0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3ZpZGVvV2lkdGgnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHByb21pc2UgdG8gZ2V0IHRoZSBuYXRpdmUgaGVpZ2h0IG9mIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0VmlkZW9IZWlnaHRQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtudW1iZXJ9IFRoZSBuYXRpdmUgaGVpZ2h0IG9mIHRoZSB2aWRlby5cbiAgICovXG4gIC8qKlxuICAgKiBHZXQgdGhlIG5hdGl2ZSBoZWlnaHQgb2YgdGhlIGN1cnJlbnRseeKAkHBsYXlpbmcgdmlkZW8uIFRoZSBoZWlnaHQgb2ZcbiAgICogdGhlIGhpZ2hlc3TigJByZXNvbHV0aW9uIGF2YWlsYWJsZSB3aWxsIGJlIHVzZWQgYmVmb3JlIHBsYXliYWNrIGJlZ2lucy5cbiAgICpcbiAgICogQHJldHVybiB7R2V0VmlkZW9IZWlnaHRQcm9taXNlfVxuICAgKi9cbiAgZ2V0VmlkZW9IZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0KCd2aWRlb0hlaWdodCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBnZXQgdGhlIHZpbWVvLmNvbSB1cmwgZm9yIHRoZSB2aWRlby5cbiAgICpcbiAgICogQHByb21pc2UgR2V0VmlkZW9VcmxQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtudW1iZXJ9IFRoZSB2aW1lby5jb20gdXJsIGZvciB0aGUgdmlkZW8uXG4gICAqIEByZWplY3Qge1ByaXZhY3lFcnJvcn0gVGhlIHVybCBpc27igJl0IGF2YWlsYWJsZSBiZWNhdXNlIG9mIHRoZSB2aWRlb+KAmXMgcHJpdmFjeSBzZXR0aW5nLlxuICAgKi9cbiAgLyoqXG4gICAqIEdldCB0aGUgdmltZW8uY29tIHVybCBmb3IgdGhlIHZpZGVvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtHZXRWaWRlb1VybFByb21pc2V9XG4gICAqL1xuICBnZXRWaWRlb1VybCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3ZpZGVvVXJsJyk7XG4gIH1cblxuICAvKipcbiAgICogQSBwcm9taXNlIHRvIGdldCB0aGUgdm9sdW1lIGxldmVsIG9mIHRoZSBwbGF5ZXIuXG4gICAqXG4gICAqIEBwcm9taXNlIEdldFZvbHVtZVByb21pc2VcbiAgICogQGZ1bGZpbGwge251bWJlcn0gVGhlIHZvbHVtZSBsZXZlbCBvZiB0aGUgcGxheWVyIG9uIGEgc2NhbGUgZnJvbSAwIHRvIDEuXG4gICAqL1xuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IHZvbHVtZSBsZXZlbCBvZiB0aGUgcGxheWVyIG9uIGEgc2NhbGUgZnJvbSBgMGAgdG8gYDFgLlxuICAgKlxuICAgKiBNb3N0IG1vYmlsZSBkZXZpY2VzIGRvIG5vdCBzdXBwb3J0IGFuIGluZGVwZW5kZW50IHZvbHVtZSBmcm9tIHRoZVxuICAgKiBzeXN0ZW0gdm9sdW1lLiBJbiB0aG9zZSBjYXNlcywgdGhpcyBtZXRob2Qgd2lsbCBhbHdheXMgcmV0dXJuIGAxYC5cbiAgICpcbiAgICogQHJldHVybiB7R2V0Vm9sdW1lUHJvbWlzZX1cbiAgICovXG4gIGdldFZvbHVtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQoJ3ZvbHVtZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcHJvbWlzZSB0byBzZXQgdGhlIHZvbHVtZSBsZXZlbCBvZiB0aGUgcGxheWVyLlxuICAgKlxuICAgKiBAcHJvbWlzZSBTZXRWb2x1bWVQcm9taXNlXG4gICAqIEBmdWxmaWxsIHtudW1iZXJ9IFRoZSB2b2x1bWUgd2FzIHNldC5cbiAgICogQHJlamVjdCB7UmFuZ2VFcnJvcn0gVGhlIHZvbHVtZSB3YXMgbGVzcyB0aGFuIDAgb3IgZ3JlYXRlciB0aGFuIDEuXG4gICAqL1xuICAvKipcbiAgICogU2V0IHRoZSB2b2x1bWUgb2YgdGhlIHBsYXllciBvbiBhIHNjYWxlIGZyb20gYDBgIHRvIGAxYC4gV2hlbiBzZXRcbiAgICogdmlhIHRoZSBBUEksIHRoZSB2b2x1bWUgbGV2ZWwgd2lsbCBub3QgYmUgc3luY2hyb25pemVkIHRvIG90aGVyXG4gICAqIHBsYXllcnMgb3Igc3RvcmVkIGFzIHRoZSB2aWV3ZXLigJlzIHByZWZlcmVuY2UuXG4gICAqXG4gICAqIE1vc3QgbW9iaWxlIGRldmljZXMgZG8gbm90IHN1cHBvcnQgc2V0dGluZyB0aGUgdm9sdW1lLiBBbiBlcnJvciB3aWxsXG4gICAqICpub3QqIGJlIHRyaWdnZXJlZCBpbiB0aGF0IHNpdHVhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IHZvbHVtZVxuICAgKiBAcmV0dXJuIHtTZXRWb2x1bWVQcm9taXNlfVxuICAgKi9cbiAgc2V0Vm9sdW1lKHZvbHVtZSkge1xuICAgIHJldHVybiB0aGlzLnNldCgndm9sdW1lJywgdm9sdW1lKTtcbiAgfVxuXG4gIC8qKiBAdHlwZWRlZiB7aW1wb3J0KCd0aW1pbmctb2JqZWN0JykuSVRpbWluZ09iamVjdH0gVGltaW5nT2JqZWN0ICovXG4gIC8qKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2xpYi90aW1pbmctc3JjLWNvbm5lY3Rvci50eXBlcycpLlRpbWluZ1NyY0Nvbm5lY3Rvck9wdGlvbnN9IFRpbWluZ1NyY0Nvbm5lY3Rvck9wdGlvbnMgKi9cbiAgLyoqIEB0eXBlZGVmIHtpbXBvcnQoJy4vbGliL3RpbWluZy1zcmMtY29ubmVjdG9yJykuVGltaW5nU3JjQ29ubmVjdG9yfSBUaW1pbmdTcmNDb25uZWN0b3IgKi9cblxuICAvKipcbiAgICogQ29ubmVjdHMgYSBUaW1pbmdPYmplY3QgdG8gdGhlIHZpZGVvIHBsYXllciAoaHR0cHM6Ly93ZWJ0aW1pbmcuZ2l0aHViLmlvL3RpbWluZ29iamVjdC8pXG4gICAqXG4gICAqIEBwYXJhbSB7VGltaW5nT2JqZWN0fSB0aW1pbmdPYmplY3RcbiAgICogQHBhcmFtIHtUaW1pbmdTcmNDb25uZWN0b3JPcHRpb25zfSBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VGltaW5nU3JjQ29ubmVjdG9yPn1cbiAgICovXG4gIGFzeW5jIHNldFRpbWluZ1NyYyh0aW1pbmdPYmplY3QsIG9wdGlvbnMpIHtcbiAgICBpZiAoIXRpbWluZ09iamVjdCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQSBUaW1pbmcgT2JqZWN0IG11c3QgYmUgcHJvdmlkZWQuJyk7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucmVhZHkoKTtcbiAgICBjb25zdCBjb25uZWN0b3IgPSBuZXcgVGltaW5nU3JjQ29ubmVjdG9yKHRoaXMsIHRpbWluZ09iamVjdCwgb3B0aW9ucyk7XG4gICAgcG9zdE1lc3NhZ2UodGhpcywgJ25vdGlmeVRpbWluZ09iamVjdENvbm5lY3QnKTtcbiAgICBjb25uZWN0b3IuYWRkRXZlbnRMaXN0ZW5lcignZGlzY29ubmVjdCcsICgpID0+IHBvc3RNZXNzYWdlKHRoaXMsICdub3RpZnlUaW1pbmdPYmplY3REaXNjb25uZWN0JykpO1xuICAgIHJldHVybiBjb25uZWN0b3I7XG4gIH1cbn1cblxuLy8gU2V0dXAgZW1iZWQgb25seSBpZiB0aGlzIGlzIG5vdCBhIHNlcnZlciBydW50aW1lXG5pZiAoIWlzU2VydmVyUnVudGltZSkge1xuICBzY3JlZW5mdWxsID0gaW5pdGlhbGl6ZVNjcmVlbmZ1bGwoKTtcbiAgaW5pdGlhbGl6ZUVtYmVkcygpO1xuICByZXNpemVFbWJlZHMoKTtcbiAgaW5pdEFwcGVuZFZpZGVvTWV0YWRhdGEoKTtcbiAgY2hlY2tVcmxUaW1lUGFyYW0oKTtcbiAgdXBkYXRlRFJNRW1iZWRzKCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllcjtcbiIsIlxyXG5jb25zdCBGaWx0ZXJzID0ge1xyXG5cclxuICAgIHRyZWVTb2x2ZUd1aWRlSUQ6IFwidHJlZVNvbHZlR3VpZGVcIixcclxuICAgIHRyZWVTb2x2ZUZyYWdtZW50c0lEOiBcInRyZWVTb2x2ZUZyYWdtZW50c1wiLFxyXG4gICAgdXBOYXZFbGVtZW50OiAnI3N0ZXBOYXYgLmNoYWluLXVwd2FyZHMnLFxyXG4gICAgZG93bk5hdkVsZW1lbnQ6ICcjc3RlcE5hdiAuY2hhaW4tZG93bndhcmRzJyxcclxuXHJcbiAgICBmcmFnbWVudEJveDogJyN0cmVlU29sdmVGcmFnbWVudHMgLm50LWZyLWZyYWdtZW50LWJveCcsXHJcbiAgICBmcmFnbWVudEJveERpc2N1c3Npb246ICcjdHJlZVNvbHZlRnJhZ21lbnRzIC5udC1mci1mcmFnbWVudC1ib3ggLm50LWZyLWZyYWdtZW50LWRpc2N1c3Npb24nLFxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBGaWx0ZXJzO1xyXG4iLCJpbXBvcnQgRmlsdGVycyBmcm9tIFwiLi4vLi4vLi4vc3RhdGUvY29uc3RhbnRzL0ZpbHRlcnNcIjtcclxuXHJcblxyXG5jb25zdCBvbkZyYWdtZW50c1JlbmRlckZpbmlzaGVkID0gKCkgPT4ge1xyXG5cclxuICAgIGNvbnN0IGZyYWdtZW50Qm94RGlzY3Vzc2lvbnM6IE5vZGVMaXN0T2Y8RWxlbWVudD4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKEZpbHRlcnMuZnJhZ21lbnRCb3hEaXNjdXNzaW9uKTtcclxuICAgIGxldCBmcmFnbWVudEJveDogSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBsZXQgZGF0YURpc2N1c3Npb246IHN0cmluZyB8IHVuZGVmaW5lZDtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYWdtZW50Qm94RGlzY3Vzc2lvbnMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgZnJhZ21lbnRCb3ggPSBmcmFnbWVudEJveERpc2N1c3Npb25zW2ldIGFzIEhUTUxEaXZFbGVtZW50O1xyXG4gICAgICAgIGRhdGFEaXNjdXNzaW9uID0gZnJhZ21lbnRCb3guZGF0YXNldC5kaXNjdXNzaW9uO1xyXG5cclxuICAgICAgICBpZiAoZGF0YURpc2N1c3Npb24gIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgZnJhZ21lbnRCb3guaW5uZXJIVE1MID0gZGF0YURpc2N1c3Npb247XHJcbiAgICAgICAgICAgIGRlbGV0ZSBmcmFnbWVudEJveC5kYXRhc2V0LmRpc2N1c3Npb247XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgb25GcmFnbWVudHNSZW5kZXJGaW5pc2hlZDtcclxuIiwiaW1wb3J0IFBsYXllciBmcm9tIFwiQHZpbWVvL3BsYXllclwiO1xyXG5cclxuaW1wb3J0IG9uRnJhZ21lbnRzUmVuZGVyRmluaXNoZWQgZnJvbSBcIi4uLy4uL2ZyYWdtZW50cy9jb2RlL29uRnJhZ21lbnRzUmVuZGVyRmluaXNoZWRcIjtcclxuXHJcblxyXG5jb25zdCBzZXRVcFZpbWVvUGxheWVyID0gKCkgPT4ge1xyXG5cclxuICAgIC8vIElmIHlvdSB3YW50IHRvIGNvbnRyb2wgdGhlIGVtYmVkcywgeW91J2xsIG5lZWQgdG8gY3JlYXRlIGEgUGxheWVyIG9iamVjdC5cclxuICAgIC8vIFlvdSBjYW4gcGFzcyBlaXRoZXIgdGhlIGA8ZGl2PmAgb3IgdGhlIGA8aWZyYW1lPmAgY3JlYXRlZCBpbnNpZGUgdGhlIGRpdi5cclxuXHJcbiAgICBjb25zdCB2aW1lb1BsYXllckRpdnM6IE5vZGVMaXN0T2Y8SFRNTERpdkVsZW1lbnQ+ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm50LXRwLXZpbWVvLXBsYXllcicpIGFzIE5vZGVMaXN0T2Y8SFRNTERpdkVsZW1lbnQ+O1xyXG5cclxuICAgIGlmICghdmltZW9QbGF5ZXJEaXZzKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCB2aW1lb1BsYXllckRpdjogSFRNTERpdkVsZW1lbnQ7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2aW1lb1BsYXllckRpdnMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgdmltZW9QbGF5ZXJEaXYgPSB2aW1lb1BsYXllckRpdnNbaV07XHJcblxyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgICBhdXRvcGF1c2U6IGZhbHNlLFxyXG4gICAgICAgICAgICBhdXRvcGxheTogZmFsc2UsXHJcbiAgICAgICAgICAgIHdpZHRoOiA2NDAsXHJcbiAgICAgICAgICAgIGxvb3A6IGZhbHNlLFxyXG4gICAgICAgICAgICByZXNwb25zaXZlOiB0cnVlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbmV3IFBsYXllcihcclxuICAgICAgICAgICAgdmltZW9QbGF5ZXJEaXYsXHJcbiAgICAgICAgICAgIG9wdGlvbnNcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3Qgb25SZW5kZXJGaW5pc2hlZCA9ICgpID0+IHtcclxuXHJcbiAgICBvbkZyYWdtZW50c1JlbmRlckZpbmlzaGVkKCk7XHJcbiAgICBzZXRVcFZpbWVvUGxheWVyKCk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBvblJlbmRlckZpbmlzaGVkO1xyXG4iLCJpbXBvcnQgb25SZW5kZXJGaW5pc2hlZCBmcm9tIFwiLi9vblJlbmRlckZpbmlzaGVkXCI7XHJcblxyXG5cclxuY29uc3QgaW5pdEV2ZW50cyA9IHtcclxuXHJcbiAgb25SZW5kZXJGaW5pc2hlZDogKCkgPT4ge1xyXG5cclxuICAgIG9uUmVuZGVyRmluaXNoZWQoKTtcclxuICB9LFxyXG5cclxuICByZWdpc3Rlckdsb2JhbEV2ZW50czogKCkgPT4ge1xyXG5cclxuICAgIHdpbmRvdy5vbnJlc2l6ZSA9ICgpID0+IHtcclxuXHJcbiAgICAgIGluaXRFdmVudHMub25SZW5kZXJGaW5pc2hlZCgpO1xyXG4gICAgfTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGluaXRFdmVudHM7XHJcblxyXG5cclxuXHJcbiIsImltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcblxyXG5cclxuY29uc3QgaW5pdEFjdGlvbnMgPSB7XHJcblxyXG4gICAgc2V0Tm90UmF3OiAoc3RhdGU6IElTdGF0ZSk6IElTdGF0ZSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghd2luZG93Py5UcmVlU29sdmU/LnNjcmVlbj8uaXNBdXRvZm9jdXNGaXJzdFJ1bikge1xyXG5cclxuICAgICAgICAgICAgd2luZG93LlRyZWVTb2x2ZS5zY3JlZW4uYXV0b2ZvY3VzID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB3aW5kb3cuVHJlZVNvbHZlLnNjcmVlbi5pc0F1dG9mb2N1c0ZpcnN0UnVuID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBpbml0QWN0aW9ucztcclxuIiwiXHJcbmV4cG9ydCBlbnVtIFBhcnNlVHlwZSB7XHJcblxyXG4gICAgTm9uZSA9ICdub25lJyxcclxuICAgIEpzb24gPSAnanNvbicsXHJcbiAgICBUZXh0ID0gJ3RleHQnXHJcbn1cclxuXHJcbiIsImltcG9ydCBJUmVuZGVyRnJhZ21lbnRVSSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS91aS9JUmVuZGVyRnJhZ21lbnRVSVwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlbmRlckZyYWdtZW50VUkgaW1wbGVtZW50cyBJUmVuZGVyRnJhZ21lbnRVSSB7XHJcblxyXG4gICAgcHVibGljIGZyYWdtZW50T3B0aW9uc0V4cGFuZGVkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgZGlzY3Vzc2lvbkxvYWRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIGFuY2lsbGFyeUV4cGFuZGVkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgZG9Ob3RQYWludDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIHNlY3Rpb25JbmRleDogbnVtYmVyID0gMDtcclxufVxyXG4iLCJpbXBvcnQgSURpc3BsYXlDaGFydCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9kaXNwbGF5L0lEaXNwbGF5Q2hhcnRcIjtcclxuaW1wb3J0IElEaXNwbGF5U2VjdGlvbiBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9kaXNwbGF5L0lEaXNwbGF5U2VjdGlvblwiO1xyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudFVJIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3VpL0lSZW5kZXJGcmFnbWVudFVJXCI7XHJcbmltcG9ydCBSZW5kZXJGcmFnbWVudFVJIGZyb20gXCIuLi91aS9SZW5kZXJGcmFnbWVudFVJXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVuZGVyRnJhZ21lbnQgaW1wbGVtZW50cyBJUmVuZGVyRnJhZ21lbnQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIGlkOiBzdHJpbmcsXHJcbiAgICAgICAgcGFyZW50RnJhZ21lbnRJRDogc3RyaW5nLFxyXG4gICAgICAgIHNlY3Rpb246IElEaXNwbGF5U2VjdGlvbixcclxuICAgICAgICBzZWdtZW50SW5kZXg6IG51bWJlciB8IG51bGxcclxuICAgICkge1xyXG4gICAgICAgIHRoaXMuaWQgPSBpZDtcclxuICAgICAgICB0aGlzLnNlY3Rpb24gPSBzZWN0aW9uO1xyXG4gICAgICAgIHRoaXMucGFyZW50RnJhZ21lbnRJRCA9IHBhcmVudEZyYWdtZW50SUQ7XHJcbiAgICAgICAgdGhpcy5zZWdtZW50SW5kZXggPSBzZWdtZW50SW5kZXg7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGlkOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgaUtleTogc3RyaW5nIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgaUV4aXRLZXk6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIGV4aXRLZXk6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIGF1dG9NZXJnZUV4aXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHB1YmxpYyBwb2RLZXk6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIHBvZFRleHQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIHRvcExldmVsTWFwS2V5OiBzdHJpbmcgPSAnJztcclxuICAgIHB1YmxpYyBtYXBLZXlDaGFpbjogc3RyaW5nID0gJyc7XHJcbiAgICBwdWJsaWMgZ3VpZGVJRDogc3RyaW5nID0gJyc7XHJcbiAgICBwdWJsaWMgcGFyZW50RnJhZ21lbnRJRDogc3RyaW5nO1xyXG4gICAgcHVibGljIHZhbHVlOiBzdHJpbmcgPSAnJztcclxuICAgIHB1YmxpYyBzZWxlY3RlZDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgaXNMZWFmOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgb3B0aW9uczogQXJyYXk8SVJlbmRlckZyYWdtZW50PiA9IFtdO1xyXG4gICAgcHVibGljIHZhcmlhYmxlOiBBcnJheTxbc3RyaW5nXSB8IFtzdHJpbmcsIHN0cmluZ10+ID0gW107XHJcbiAgICBwdWJsaWMgY2xhc3NlczogQXJyYXk8c3RyaW5nPiA9IFtdO1xyXG5cclxuICAgIHB1YmxpYyBvcHRpb246IHN0cmluZyA9ICcnO1xyXG4gICAgcHVibGljIGlzQW5jaWxsYXJ5OiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgb3JkZXI6IG51bWJlciA9IDA7XHJcblxyXG4gICAgcHVibGljIGxpbms6IElEaXNwbGF5Q2hhcnQgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBwb2Q6IElEaXNwbGF5Q2hhcnQgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBzZWN0aW9uOiBJRGlzcGxheVNlY3Rpb247XHJcbiAgICBwdWJsaWMgc2VnbWVudEluZGV4OiBudW1iZXIgfCBudWxsO1xyXG5cclxuICAgIHB1YmxpYyB1aTogSVJlbmRlckZyYWdtZW50VUkgPSBuZXcgUmVuZGVyRnJhZ21lbnRVSSgpO1xyXG59XHJcbiIsIlxyXG5leHBvcnQgZW51bSBPdXRsaW5lVHlwZSB7XHJcblxyXG4gICAgTm9uZSA9ICdub25lJyxcclxuICAgIE5vZGUgPSAnbm9kZScsXHJcbiAgICBFeGl0ID0gJ2V4aXQnLFxyXG4gICAgTGluayA9ICdsaW5rJ1xyXG59XHJcblxyXG4iLCJpbXBvcnQgeyBPdXRsaW5lVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL091dGxpbmVUeXBlXCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZU5vZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lTm9kZVwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlbmRlck91dGxpbmVOb2RlIGltcGxlbWVudHMgSVJlbmRlck91dGxpbmVOb2RlIHtcclxuXHJcbiAgICBwdWJsaWMgaTogc3RyaW5nID0gJyc7IC8vIGlkXHJcbiAgICBwdWJsaWMgYzogbnVtYmVyIHwgbnVsbCA9IG51bGw7IC8vIGluZGV4IGZyb20gb3V0bGluZSBjaGFydCBhcnJheVxyXG4gICAgcHVibGljIGQ6IG51bWJlciB8IG51bGwgPSBudWxsOyAvLyBpbmRleCBmcm9tIG91dGxpbmUgY2hhcnQgYXJyYXlcclxuICAgIHB1YmxpYyB4OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkID0gbnVsbDsgLy8gaUV4aXQgaWRcclxuICAgIHB1YmxpYyBfeDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCA9IG51bGw7IC8vIGV4aXQgaWRcclxuICAgIHB1YmxpYyBvOiBBcnJheTxJUmVuZGVyT3V0bGluZU5vZGU+ID0gW107IC8vIG9wdGlvbnNcclxuICAgIHB1YmxpYyBwYXJlbnQ6IElSZW5kZXJPdXRsaW5lTm9kZSB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIHR5cGU6IE91dGxpbmVUeXBlID0gT3V0bGluZVR5cGUuTm9kZTtcclxuICAgIHB1YmxpYyBpc0NoYXJ0OiBib29sZWFuID0gdHJ1ZTtcclxuICAgIHB1YmxpYyBpc1Jvb3Q6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHB1YmxpYyBpc0xhc3Q6IGJvb2xlYW4gPSBmYWxzZTtcclxufVxyXG4iLCJpbXBvcnQgSVJlbmRlck91dGxpbmUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lXCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZUNoYXJ0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZUNoYXJ0XCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZU5vZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lTm9kZVwiO1xyXG5pbXBvcnQgUmVuZGVyT3V0bGluZU5vZGUgZnJvbSBcIi4vUmVuZGVyT3V0bGluZU5vZGVcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZW5kZXJPdXRsaW5lIGltcGxlbWVudHMgSVJlbmRlck91dGxpbmUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHBhdGg6IHN0cmluZyxcclxuICAgICAgICBiYXNlVVJJOiBzdHJpbmdcclxuICAgICkge1xyXG4gICAgICAgIHRoaXMucGF0aCA9IHBhdGg7XHJcbiAgICAgICAgdGhpcy5iYXNlVVJJID0gYmFzZVVSSTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcGF0aDogc3RyaW5nO1xyXG4gICAgcHVibGljIGJhc2VVUkk6IHN0cmluZztcclxuICAgIHB1YmxpYyBsb2FkZWQgPSBmYWxzZTtcclxuXHJcbiAgICBwdWJsaWMgdjogc3RyaW5nID0gJyc7XHJcbiAgICBwdWJsaWMgcjogSVJlbmRlck91dGxpbmVOb2RlID0gbmV3IFJlbmRlck91dGxpbmVOb2RlKCk7XHJcbiAgICBwdWJsaWMgYzogQXJyYXk8SVJlbmRlck91dGxpbmVDaGFydD4gPSBbXTtcclxuICAgIHB1YmxpYyBlOiBudW1iZXIgfCB1bmRlZmluZWQ7XHJcbiAgICBwdWJsaWMgbXY6IGFueSB8IHVuZGVmaW5lZDtcclxufVxyXG4iLCJpbXBvcnQgSVJlbmRlck91dGxpbmVDaGFydCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVDaGFydFwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlbmRlck91dGxpbmVDaGFydCBpbXBsZW1lbnRzIElSZW5kZXJPdXRsaW5lQ2hhcnQge1xyXG5cclxuICAgIHB1YmxpYyBpOiBzdHJpbmcgPSAnJztcclxuICAgIHB1YmxpYyBiOiBzdHJpbmcgPSAnJztcclxuICAgIHB1YmxpYyBwOiBzdHJpbmcgPSAnJztcclxufVxyXG4iLCJpbXBvcnQgSURpc3BsYXlHdWlkZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9kaXNwbGF5L0lEaXNwbGF5R3VpZGVcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBJUmVuZGVyR3VpZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJHdWlkZVwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lXCI7XHJcbmltcG9ydCBSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vcmVuZGVyL1JlbmRlckZyYWdtZW50XCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGlzcGxheUd1aWRlIGltcGxlbWVudHMgSURpc3BsYXlHdWlkZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgbGlua0lEOiBudW1iZXIsXHJcbiAgICAgICAgZ3VpZGU6IElSZW5kZXJHdWlkZSxcclxuICAgICAgICByb290SUQ6IHN0cmluZ1xyXG4gICAgKSB7XHJcbiAgICAgICAgdGhpcy5saW5rSUQgPSBsaW5rSUQ7XHJcbiAgICAgICAgdGhpcy5ndWlkZSA9IGd1aWRlO1xyXG5cclxuICAgICAgICB0aGlzLnJvb3QgPSBuZXcgUmVuZGVyRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHJvb3RJRCxcclxuICAgICAgICAgICAgXCJndWlkZVJvb3RcIixcclxuICAgICAgICAgICAgdGhpcyxcclxuICAgICAgICAgICAgMFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxpbmtJRDogbnVtYmVyO1xyXG4gICAgcHVibGljIGd1aWRlOiBJUmVuZGVyR3VpZGU7XHJcbiAgICBwdWJsaWMgb3V0bGluZTogSVJlbmRlck91dGxpbmUgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyByb290OiBJUmVuZGVyRnJhZ21lbnQ7XHJcbiAgICBwdWJsaWMgY3VycmVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9IG51bGw7XHJcbn1cclxuIiwiaW1wb3J0IElSZW5kZXJHdWlkZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckd1aWRlXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVuZGVyR3VpZGUgaW1wbGVtZW50cyBJUmVuZGVyR3VpZGUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGlkOiBzdHJpbmcpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpZDogc3RyaW5nO1xyXG4gICAgcHVibGljIHRpdGxlOiBzdHJpbmcgPSAnJztcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbjogc3RyaW5nID0gJyc7XHJcbiAgICBwdWJsaWMgcGF0aDogc3RyaW5nID0gJyc7XHJcbiAgICBwdWJsaWMgZnJhZ21lbnRGb2xkZXJVcmw6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG59XHJcbiIsIlxyXG5leHBvcnQgZW51bSBTY3JvbGxIb3BUeXBlIHtcclxuICAgIE5vbmUgPSBcIm5vbmVcIixcclxuICAgIFVwID0gXCJ1cFwiLFxyXG4gICAgRG93biA9IFwiZG93blwiXHJcbn1cclxuIiwiaW1wb3J0IHsgU2Nyb2xsSG9wVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL1Njcm9sbEhvcFR5cGVcIjtcclxuaW1wb3J0IElTY3JlZW4gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvd2luZG93L0lTY3JlZW5cIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY3JlZW4gaW1wbGVtZW50cyBJU2NyZWVuIHtcclxuXHJcbiAgICBwdWJsaWMgYXV0b2ZvY3VzOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgaXNBdXRvZm9jdXNGaXJzdFJ1bjogYm9vbGVhbiA9IHRydWU7XHJcbiAgICBwdWJsaWMgaGlkZUJhbm5lcjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIHNjcm9sbFRvVG9wOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgc2Nyb2xsVG9FbGVtZW50OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBzY3JvbGxIb3A6IFNjcm9sbEhvcFR5cGUgPSBTY3JvbGxIb3BUeXBlLk5vbmU7XHJcbiAgICBwdWJsaWMgbGFzdFNjcm9sbFk6IG51bWJlciA9IDA7XHJcblxyXG4gICAgcHVibGljIHVhOiBhbnkgfCBudWxsID0gbnVsbDtcclxufVxyXG4iLCJpbXBvcnQgSVNjcmVlbiBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy93aW5kb3cvSVNjcmVlblwiO1xyXG5pbXBvcnQgSVRyZWVTb2x2ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy93aW5kb3cvSVRyZWVTb2x2ZVwiO1xyXG5pbXBvcnQgU2NyZWVuIGZyb20gXCIuL1NjcmVlblwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRyZWVTb2x2ZSBpbXBsZW1lbnRzIElUcmVlU29sdmUge1xyXG5cclxuICAgIHB1YmxpYyByZW5kZXJpbmdDb21tZW50OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBzY3JlZW46IElTY3JlZW4gPSBuZXcgU2NyZWVuKCk7XHJcbn1cclxuIiwiXHJcblxyXG5jb25zdCBnRmlsZUNvbnN0YW50cyA9IHtcclxuXHJcbiAgICBmcmFnbWVudHNGb2xkZXJTdWZmaXg6ICdfZnJhZ3MnLFxyXG4gICAgZnJhZ21lbnRGaWxlRXh0ZW5zaW9uOiAnLmh0bWwnLFxyXG4gICAgZ3VpZGVPdXRsaW5lRmlsZW5hbWU6ICdvdXRsaW5lLnRzb2xuJyxcclxuICAgIGd1aWRlUmVuZGVyQ29tbWVudFRhZzogJ3RzR3VpZGVSZW5kZXJDb21tZW50ICcsXHJcbiAgICBmcmFnbWVudFJlbmRlckNvbW1lbnRUYWc6ICd0c0ZyYWdtZW50UmVuZGVyQ29tbWVudCAnLFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ0ZpbGVDb25zdGFudHM7XHJcblxyXG4iLCJpbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IElSZW5kZXJHdWlkZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckd1aWRlXCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZUNoYXJ0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZUNoYXJ0XCI7XHJcbmltcG9ydCBGaWx0ZXJzIGZyb20gXCIuLi8uLi9zdGF0ZS9jb25zdGFudHMvRmlsdGVyc1wiO1xyXG5pbXBvcnQgRGlzcGxheUd1aWRlIGZyb20gXCIuLi8uLi9zdGF0ZS9kaXNwbGF5L0Rpc3BsYXlHdWlkZVwiO1xyXG5pbXBvcnQgUmVuZGVyR3VpZGUgZnJvbSBcIi4uLy4uL3N0YXRlL3JlbmRlci9SZW5kZXJHdWlkZVwiO1xyXG5pbXBvcnQgVHJlZVNvbHZlIGZyb20gXCIuLi8uLi9zdGF0ZS93aW5kb3cvVHJlZVNvbHZlXCI7XHJcbmltcG9ydCBnRmlsZUNvbnN0YW50cyBmcm9tIFwiLi4vZ0ZpbGVDb25zdGFudHNcIjtcclxuaW1wb3J0IGdGcmFnbWVudENvZGUgZnJvbSBcIi4vZ0ZyYWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgZ1N0YXRlQ29kZSBmcm9tIFwiLi9nU3RhdGVDb2RlXCI7XHJcblxyXG5cclxuY29uc3QgcGFyc2VHdWlkZSA9IChyYXdHdWlkZTogYW55KTogSVJlbmRlckd1aWRlID0+IHtcclxuXHJcbiAgICBjb25zdCBndWlkZTogSVJlbmRlckd1aWRlID0gbmV3IFJlbmRlckd1aWRlKHJhd0d1aWRlLmlkKTtcclxuICAgIGd1aWRlLnRpdGxlID0gcmF3R3VpZGUudGl0bGUgPz8gJyc7XHJcbiAgICBndWlkZS5kZXNjcmlwdGlvbiA9IHJhd0d1aWRlLmRlc2NyaXB0aW9uID8/ICcnO1xyXG4gICAgZ3VpZGUucGF0aCA9IHJhd0d1aWRlLnBhdGggPz8gbnVsbDtcclxuICAgIGd1aWRlLmZyYWdtZW50Rm9sZGVyVXJsID0gZ1JlbmRlckNvZGUuZ2V0R3VpZGVGcmFnbWVudEZvbGRlclVybChyYXdHdWlkZS5mcmFnbWVudEZvbGRlclBhdGgpO1xyXG5cclxuICAgIHJldHVybiBndWlkZTtcclxufTtcclxuXHJcbmNvbnN0IHBhcnNlUmVuZGVyaW5nQ29tbWVudCA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICByYXc6IGFueVxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoIXJhdykge1xyXG4gICAgICAgIHJldHVybiByYXc7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxue1xyXG4gICAgXCJndWlkZVwiOiB7XHJcbiAgICAgICAgXCJpZFwiOiBcImRCdDdKTjF2dFwiXHJcbiAgICB9LFxyXG4gICAgXCJmcmFnbWVudFwiOiB7XHJcbiAgICAgICAgXCJpZFwiOiBcImRCdDdKTjF2dFwiLFxyXG4gICAgICAgIFwidG9wTGV2ZWxNYXBLZXlcIjogXCJjdjFUUmwwMXJmXCIsXHJcbiAgICAgICAgXCJtYXBLZXlDaGFpblwiOiBcImN2MVRSbDAxcmZcIixcclxuICAgICAgICBcImd1aWRlSURcIjogXCJkQnQ3Sk4xSGVcIixcclxuICAgICAgICBcInBhcmVudEZyYWdtZW50SURcIjogbnVsbCxcclxuICAgICAgICBcImNoYXJ0S2V5XCI6IFwiY3YxVFJsMDFyZlwiLFxyXG4gICAgICAgIFwib3B0aW9uc1wiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJkQnQ3S1oxQU5cIixcclxuICAgICAgICAgICAgICAgIFwib3B0aW9uXCI6IFwiT3B0aW9uIDFcIixcclxuICAgICAgICAgICAgICAgIFwiaXNBbmNpbGxhcnlcIjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBcIm9yZGVyXCI6IDFcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcImRCdDdLWjFSYlwiLFxyXG4gICAgICAgICAgICAgICAgXCJvcHRpb25cIjogXCJPcHRpb24gMlwiLFxyXG4gICAgICAgICAgICAgICAgXCJpc0FuY2lsbGFyeVwiOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIFwib3JkZXJcIjogMlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiZEJ0N0taMjRCXCIsXHJcbiAgICAgICAgICAgICAgICBcIm9wdGlvblwiOiBcIk9wdGlvbiAzXCIsXHJcbiAgICAgICAgICAgICAgICBcImlzQW5jaWxsYXJ5XCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgXCJvcmRlclwiOiAzXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9XHJcbn0gICAgXHJcbiAgICAqL1xyXG5cclxuICAgIGNvbnN0IGd1aWRlID0gcGFyc2VHdWlkZShyYXcuZ3VpZGUpO1xyXG5cclxuICAgIGNvbnN0IGRpc3BsYXlHdWlkZSA9IG5ldyBEaXNwbGF5R3VpZGUoXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5nZXRGcmVzaEtleUludChzdGF0ZSksXHJcbiAgICAgICAgZ3VpZGUsXHJcbiAgICAgICAgcmF3LmZyYWdtZW50LmlkXHJcbiAgICApO1xyXG5cclxuICAgIGdGcmFnbWVudENvZGUucGFyc2VBbmRMb2FkR3VpZGVSb290RnJhZ21lbnQoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgcmF3LmZyYWdtZW50LFxyXG4gICAgICAgIGRpc3BsYXlHdWlkZS5yb290XHJcbiAgICApO1xyXG5cclxuICAgIHN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZSA9IGRpc3BsYXlHdWlkZTtcclxuICAgIHN0YXRlLnJlbmRlclN0YXRlLmN1cnJlbnRTZWN0aW9uID0gZGlzcGxheUd1aWRlO1xyXG5cclxuICAgIGdGcmFnbWVudENvZGUuY2FjaGVTZWN0aW9uUm9vdChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5kaXNwbGF5R3VpZGVcclxuICAgICk7XHJcbn07XHJcblxyXG5jb25zdCBnUmVuZGVyQ29kZSA9IHtcclxuXHJcbiAgICBnZXRHdWlkZUZyYWdtZW50Rm9sZGVyVXJsOiAoZm9sZGVyUGF0aDogc3RyaW5nKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChcclxuICAgICAgICAgICAgZm9sZGVyUGF0aCxcclxuICAgICAgICAgICAgZG9jdW1lbnQuYmFzZVVSSVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiB1cmwudG9TdHJpbmcoKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RnJhZ21lbnRGb2xkZXJVcmw6IChcclxuICAgICAgICBjaGFydDogSVJlbmRlck91dGxpbmVDaGFydCxcclxuICAgICAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBwYXRoID0gY2hhcnQucDtcclxuXHJcbiAgICAgICAgaWYgKHBhdGguc3RhcnRzV2l0aCgnaHR0cHM6Ly8nKSA9PT0gdHJ1ZVxyXG4gICAgICAgICAgICB8fCBwYXRoLnN0YXJ0c1dpdGgoJ2h0dHA6Ly8nKSA9PT0gdHJ1ZVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm4gcGF0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBiYXNlVVJJID0gZnJhZ21lbnQuc2VjdGlvbi5vdXRsaW5lPy5iYXNlVVJJO1xyXG5cclxuICAgICAgICBpZiAoIWJhc2VVUkkpIHtcclxuXHJcbiAgICAgICAgICAgIGJhc2VVUkkgPSBkb2N1bWVudC5iYXNlVVJJO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChcclxuICAgICAgICAgICAgcGF0aCxcclxuICAgICAgICAgICAgYmFzZVVSSVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiB1cmwudG9TdHJpbmcoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVnaXN0ZXJHdWlkZUNvbW1lbnQ6ICgpID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgdHJlZVNvbHZlR3VpZGU6IEhUTUxEaXZFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoRmlsdGVycy50cmVlU29sdmVHdWlkZUlEKSBhcyBIVE1MRGl2RWxlbWVudDtcclxuXHJcbiAgICAgICAgaWYgKHRyZWVTb2x2ZUd1aWRlXHJcbiAgICAgICAgICAgICYmIHRyZWVTb2x2ZUd1aWRlLmhhc0NoaWxkTm9kZXMoKSA9PT0gdHJ1ZVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICBsZXQgY2hpbGROb2RlOiBDaGlsZE5vZGU7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRyZWVTb2x2ZUd1aWRlLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjaGlsZE5vZGUgPSB0cmVlU29sdmVHdWlkZS5jaGlsZE5vZGVzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjaGlsZE5vZGUubm9kZVR5cGUgPT09IE5vZGUuQ09NTUVOVF9OT0RFKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghd2luZG93LlRyZWVTb2x2ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LlRyZWVTb2x2ZSA9IG5ldyBUcmVlU29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5UcmVlU29sdmUucmVuZGVyaW5nQ29tbWVudCA9IGNoaWxkTm9kZS50ZXh0Q29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZE5vZGUucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoY2hpbGROb2RlLm5vZGVUeXBlICE9PSBOb2RlLlRFWFRfTk9ERSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBwYXJzZVJlbmRlcmluZ0NvbW1lbnQ6IChzdGF0ZTogSVN0YXRlKSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghd2luZG93LlRyZWVTb2x2ZT8ucmVuZGVyaW5nQ29tbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsZXQgZ3VpZGVSZW5kZXJDb21tZW50ID0gd2luZG93LlRyZWVTb2x2ZS5yZW5kZXJpbmdDb21tZW50O1xyXG4gICAgICAgICAgICBndWlkZVJlbmRlckNvbW1lbnQgPSBndWlkZVJlbmRlckNvbW1lbnQudHJpbSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFndWlkZVJlbmRlckNvbW1lbnQuc3RhcnRzV2l0aChnRmlsZUNvbnN0YW50cy5ndWlkZVJlbmRlckNvbW1lbnRUYWcpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGd1aWRlUmVuZGVyQ29tbWVudCA9IGd1aWRlUmVuZGVyQ29tbWVudC5zdWJzdHJpbmcoZ0ZpbGVDb25zdGFudHMuZ3VpZGVSZW5kZXJDb21tZW50VGFnLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJhdyA9IEpTT04ucGFyc2UoZ3VpZGVSZW5kZXJDb21tZW50KTtcclxuXHJcbiAgICAgICAgICAgIHBhcnNlUmVuZGVyaW5nQ29tbWVudChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgcmF3XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZWdpc3RlckZyYWdtZW50Q29tbWVudDogKCkgPT4ge1xyXG5cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ1JlbmRlckNvZGU7XHJcbiIsImltcG9ydCBJRGlzcGxheUNoYXJ0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2Rpc3BsYXkvSURpc3BsYXlDaGFydFwiO1xyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IElSZW5kZXJPdXRsaW5lIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZVwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmVDaGFydCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVDaGFydFwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERpc3BsYXlDaGFydCBpbXBsZW1lbnRzIElEaXNwbGF5Q2hhcnQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIGxpbmtJRDogbnVtYmVyLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0XHJcbiAgICApIHtcclxuICAgICAgICB0aGlzLmxpbmtJRCA9IGxpbmtJRDtcclxuICAgICAgICB0aGlzLmNoYXJ0ID0gY2hhcnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxpbmtJRDogbnVtYmVyO1xyXG4gICAgcHVibGljIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0O1xyXG4gICAgcHVibGljIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgcm9vdDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9IG51bGw7XHJcbiAgICBwdWJsaWMgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBjdXJyZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0gbnVsbDtcclxufVxyXG4iLCJpbXBvcnQgSURpc3BsYXlTZWN0aW9uIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2Rpc3BsYXkvSURpc3BsYXlTZWN0aW9uXCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZU5vZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lTm9kZVwiO1xyXG5pbXBvcnQgSUNoYWluU2VnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9zZWdtZW50cy9JQ2hhaW5TZWdtZW50XCI7XHJcbmltcG9ydCBJU2VnbWVudE5vZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvc2VnbWVudHMvSVNlZ21lbnROb2RlXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ2hhaW5TZWdtZW50IGltcGxlbWVudHMgSUNoYWluU2VnbWVudCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgaW5kZXg6IG51bWJlcixcclxuICAgICAgICBzdGFydDogSVNlZ21lbnROb2RlLFxyXG4gICAgICAgIGVuZDogSVNlZ21lbnROb2RlXHJcbiAgICApIHtcclxuICAgICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgdGhpcy5zdGFydCA9IHN0YXJ0O1xyXG4gICAgICAgIHRoaXMuZW5kID0gZW5kO1xyXG4gICAgICAgIHRoaXMudGV4dCA9IGAke3N0YXJ0LnRleHR9JHtlbmQ/LnRleHQgPz8gJyd9YDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5kZXg6IG51bWJlcjtcclxuICAgIHB1YmxpYyB0ZXh0OiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgb3V0bGluZU5vZGVzOiBBcnJheTxJUmVuZGVyT3V0bGluZU5vZGU+ID0gW107XHJcbiAgICBwdWJsaWMgb3V0bGluZU5vZGVzTG9hZGVkOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgcHVibGljIHN0YXJ0OiBJU2VnbWVudE5vZGU7XHJcbiAgICBwdWJsaWMgZW5kOiBJU2VnbWVudE5vZGU7XHJcblxyXG4gICAgcHVibGljIHNlZ21lbnRJblNlY3Rpb246IElEaXNwbGF5U2VjdGlvbiB8IG51bGwgPSBudWxsO1xyXG4gICAgcHVibGljIHNlZ21lbnRTZWN0aW9uOiBJRGlzcGxheVNlY3Rpb24gfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBzZWdtZW50T3V0U2VjdGlvbjogSURpc3BsYXlTZWN0aW9uIHwgbnVsbCA9IG51bGw7XHJcbn1cclxuXHJcbiIsImltcG9ydCB7IE91dGxpbmVUeXBlIH0gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvZW51bXMvT3V0bGluZVR5cGVcIjtcclxuaW1wb3J0IElTZWdtZW50Tm9kZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9zZWdtZW50cy9JU2VnbWVudE5vZGVcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZWdtZW50Tm9kZSBpbXBsZW1lbnRzIElTZWdtZW50Tm9kZXtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICB0ZXh0OiBzdHJpbmcsXHJcbiAgICAgICAga2V5OiBzdHJpbmcsXHJcbiAgICAgICAgdHlwZTogT3V0bGluZVR5cGUsXHJcbiAgICAgICAgaXNSb290OiBib29sZWFuLFxyXG4gICAgICAgIGlzTGFzdDogYm9vbGVhblxyXG4gICAgKSB7XHJcbiAgICAgICAgdGhpcy50ZXh0ID0gdGV4dDtcclxuICAgICAgICB0aGlzLmtleSA9IGtleTtcclxuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xyXG4gICAgICAgIHRoaXMuaXNSb290ID0gaXNSb290O1xyXG4gICAgICAgIHRoaXMuaXNMYXN0ID0gaXNMYXN0O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0ZXh0OiBzdHJpbmc7XHJcbiAgICBwdWJsaWMga2V5OiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgdHlwZTogT3V0bGluZVR5cGU7XHJcbiAgICBwdWJsaWMgaXNSb290OiBib29sZWFuO1xyXG4gICAgcHVibGljIGlzTGFzdDogYm9vbGVhbjtcclxufVxyXG5cclxuIiwiaW1wb3J0IHsgT3V0bGluZVR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9PdXRsaW5lVHlwZVwiO1xyXG5pbXBvcnQgSURpc3BsYXlDaGFydCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9kaXNwbGF5L0lEaXNwbGF5Q2hhcnRcIjtcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZU5vZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lTm9kZVwiO1xyXG5pbXBvcnQgSUNoYWluU2VnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9zZWdtZW50cy9JQ2hhaW5TZWdtZW50XCI7XHJcbmltcG9ydCBJU2VnbWVudE5vZGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvc2VnbWVudHMvSVNlZ21lbnROb2RlXCI7XHJcbmltcG9ydCBDaGFpblNlZ21lbnQgZnJvbSBcIi4uLy4uL3N0YXRlL3NlZ21lbnRzL0NoYWluU2VnbWVudFwiO1xyXG5pbXBvcnQgU2VnbWVudE5vZGUgZnJvbSBcIi4uLy4uL3N0YXRlL3NlZ21lbnRzL1NlZ21lbnROb2RlXCI7XHJcbmltcG9ydCBnVXRpbGl0aWVzIGZyb20gXCIuLi9nVXRpbGl0aWVzXCI7XHJcbmltcG9ydCBVIGZyb20gXCIuLi9nVXRpbGl0aWVzXCI7XHJcbmltcG9ydCBnRnJhZ21lbnRDb2RlIGZyb20gXCIuL2dGcmFnbWVudENvZGVcIjtcclxuaW1wb3J0IGdTdGF0ZUNvZGUgZnJvbSBcIi4vZ1N0YXRlQ29kZVwiO1xyXG5cclxuXHJcbmNvbnN0IGNoZWNrRm9yTGlua0Vycm9ycyA9IChcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICBsaW5rU2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgaWYgKHNlZ21lbnQuZW5kLmtleSAhPT0gbGlua1NlZ21lbnQuc3RhcnQua2V5XHJcbiAgICAgICAgfHwgc2VnbWVudC5lbmQudHlwZSAhPT0gbGlua1NlZ21lbnQuc3RhcnQudHlwZVxyXG4gICAgKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTGluayBzZWdtZW50IHN0YXJ0IGRvZXMgbm90IG1hdGNoIHNlZ21lbnQgZW5kXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbGlua1NlZ21lbnQuc2VnbWVudEluU2VjdGlvbikge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWdtZW50IGluIHNlY3Rpb24gd2FzIG51bGwgLSBsaW5rXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbGlua1NlZ21lbnQuc2VnbWVudFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBzZWN0aW9uIHdhcyBudWxsIC0gbGlua1wiKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWxpbmtTZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgb3V0IHNlY3Rpb24gd2FzIG51bGwgLSBsaW5rXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudC5pS2V5KSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gZnJhZ21lbnQgYW5kIG91dGxpbmUgbm9kZSAtIGxpbmsgaUtleScpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAobGlua1NlZ21lbnQuc3RhcnQudHlwZSAhPT0gT3V0bGluZVR5cGUuTGluaykge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gZnJhZ21lbnQgYW5kIG91dGxpbmUgbm9kZSAtIGxpbmsnKTtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IGdldElkZW50aWZpZXJDaGFyYWN0ZXIgPSAoaWRlbnRpZmllckNoYXI6IHN0cmluZyk6IHsgdHlwZTogT3V0bGluZVR5cGUsIGlzTGFzdDogYm9vbGVhbiB9ID0+IHtcclxuXHJcbiAgICBsZXQgc3RhcnRPdXRsaW5lVHlwZTogT3V0bGluZVR5cGUgPSBPdXRsaW5lVHlwZS5Ob2RlO1xyXG4gICAgbGV0IGlzTGFzdCA9IGZhbHNlO1xyXG5cclxuICAgIGlmIChpZGVudGlmaWVyQ2hhciA9PT0gJ34nKSB7XHJcblxyXG4gICAgICAgIHN0YXJ0T3V0bGluZVR5cGUgPSBPdXRsaW5lVHlwZS5MaW5rO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoaWRlbnRpZmllckNoYXIgPT09ICdfJykge1xyXG5cclxuICAgICAgICBzdGFydE91dGxpbmVUeXBlID0gT3V0bGluZVR5cGUuRXhpdDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGlkZW50aWZpZXJDaGFyID09PSAnLScpIHtcclxuXHJcbiAgICAgICAgc3RhcnRPdXRsaW5lVHlwZSA9IE91dGxpbmVUeXBlLk5vZGU7XHJcbiAgICAgICAgaXNMYXN0ID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgcXVlcnkgc3RyaW5nIG91dGxpbmUgbm9kZSBpZGVudGlmaWVyOiAke2lkZW50aWZpZXJDaGFyfWApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZTogc3RhcnRPdXRsaW5lVHlwZSxcclxuICAgICAgICBpc0xhc3Q6IGlzTGFzdFxyXG4gICAgfTtcclxufTtcclxuXHJcbmNvbnN0IGdldEtleUVuZEluZGV4ID0gKHJlbWFpbmluZ0NoYWluOiBzdHJpbmcpOiB7IGluZGV4OiBudW1iZXIsIGlzTGFzdDogYm9vbGVhbiB8IG51bGwgfSA9PiB7XHJcblxyXG4gICAgY29uc3Qgc3RhcnRLZXlFbmRJbmRleCA9IFUuaW5kZXhPZkFueShcclxuICAgICAgICByZW1haW5pbmdDaGFpbixcclxuICAgICAgICBbJ34nLCAnLScsICdfJ10sXHJcbiAgICAgICAgMVxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoc3RhcnRLZXlFbmRJbmRleCA9PT0gLTEpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgaW5kZXg6IHJlbWFpbmluZ0NoYWluLmxlbmd0aCxcclxuICAgICAgICAgICAgaXNMYXN0OiB0cnVlXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGluZGV4OiBzdGFydEtleUVuZEluZGV4LFxyXG4gICAgICAgIGlzTGFzdDogbnVsbFxyXG4gICAgfTtcclxufTtcclxuXHJcbmNvbnN0IGdldE91dGxpbmVUeXBlID0gKHJlbWFpbmluZ0NoYWluOiBzdHJpbmcpOiB7IHR5cGU6IE91dGxpbmVUeXBlLCBpc0xhc3Q6IGJvb2xlYW4gfSA9PiB7XHJcblxyXG4gICAgY29uc3QgaWRlbnRpZmllckNoYXIgPSByZW1haW5pbmdDaGFpbi5zdWJzdHJpbmcoMCwgMSk7XHJcbiAgICBjb25zdCBvdXRsaW5lVHlwZSA9IGdldElkZW50aWZpZXJDaGFyYWN0ZXIoaWRlbnRpZmllckNoYXIpO1xyXG5cclxuICAgIHJldHVybiBvdXRsaW5lVHlwZTtcclxufTtcclxuXHJcbmNvbnN0IGdldE5leHRTZWdtZW50Tm9kZSA9IChyZW1haW5pbmdDaGFpbjogc3RyaW5nKTogeyBzZWdtZW50Tm9kZTogSVNlZ21lbnROb2RlIHwgbnVsbCwgZW5kQ2hhaW46IHN0cmluZyB9ID0+IHtcclxuXHJcbiAgICBsZXQgc2VnbWVudE5vZGU6IElTZWdtZW50Tm9kZSB8IG51bGwgPSBudWxsO1xyXG4gICAgbGV0IGVuZENoYWluID0gXCJcIjtcclxuXHJcbiAgICBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKHJlbWFpbmluZ0NoYWluKSkge1xyXG5cclxuICAgICAgICBjb25zdCBvdXRsaW5lVHlwZSA9IGdldE91dGxpbmVUeXBlKHJlbWFpbmluZ0NoYWluKTtcclxuICAgICAgICBjb25zdCBrZXlFbmQ6IHsgaW5kZXg6IG51bWJlciwgaXNMYXN0OiBib29sZWFuIHwgbnVsbCB9ID0gZ2V0S2V5RW5kSW5kZXgocmVtYWluaW5nQ2hhaW4pO1xyXG5cclxuICAgICAgICBjb25zdCBrZXkgPSByZW1haW5pbmdDaGFpbi5zdWJzdHJpbmcoXHJcbiAgICAgICAgICAgIDEsXHJcbiAgICAgICAgICAgIGtleUVuZC5pbmRleFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHNlZ21lbnROb2RlID0gbmV3IFNlZ21lbnROb2RlKFxyXG4gICAgICAgICAgICByZW1haW5pbmdDaGFpbi5zdWJzdHJpbmcoMCwga2V5RW5kLmluZGV4KSxcclxuICAgICAgICAgICAga2V5LFxyXG4gICAgICAgICAgICBvdXRsaW5lVHlwZS50eXBlLFxyXG4gICAgICAgICAgICBmYWxzZSxcclxuICAgICAgICAgICAgb3V0bGluZVR5cGUuaXNMYXN0XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKGtleUVuZC5pc0xhc3QgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHNlZ21lbnROb2RlLmlzTGFzdCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbmRDaGFpbiA9IHJlbWFpbmluZ0NoYWluLnN1YnN0cmluZyhrZXlFbmQuaW5kZXgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc2VnbWVudE5vZGUsXHJcbiAgICAgICAgZW5kQ2hhaW5cclxuICAgIH07XHJcbn07XHJcblxyXG5jb25zdCBidWlsZFNlZ21lbnQgPSAoXHJcbiAgICBzZWdtZW50czogQXJyYXk8SUNoYWluU2VnbWVudD4sXHJcbiAgICByZW1haW5pbmdDaGFpbjogc3RyaW5nXHJcbik6IHsgcmVtYWluaW5nQ2hhaW46IHN0cmluZywgc2VnbWVudDogSUNoYWluU2VnbWVudCB9ID0+IHtcclxuXHJcbiAgICBjb25zdCBzZWdtZW50U3RhcnQgPSBnZXROZXh0U2VnbWVudE5vZGUocmVtYWluaW5nQ2hhaW4pO1xyXG5cclxuICAgIGlmICghc2VnbWVudFN0YXJ0LnNlZ21lbnROb2RlKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgc3RhcnQgbm9kZSB3YXMgbnVsbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICByZW1haW5pbmdDaGFpbiA9IHNlZ21lbnRTdGFydC5lbmRDaGFpbjtcclxuICAgIGNvbnN0IHNlZ21lbnRFbmQgPSBnZXROZXh0U2VnbWVudE5vZGUocmVtYWluaW5nQ2hhaW4pO1xyXG5cclxuICAgIGlmICghc2VnbWVudEVuZC5zZWdtZW50Tm9kZSkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWdtZW50IGVuZCBub2RlIHdhcyBudWxsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNlZ21lbnQgPSBuZXcgQ2hhaW5TZWdtZW50KFxyXG4gICAgICAgIHNlZ21lbnRzLmxlbmd0aCxcclxuICAgICAgICBzZWdtZW50U3RhcnQuc2VnbWVudE5vZGUsXHJcbiAgICAgICAgc2VnbWVudEVuZC5zZWdtZW50Tm9kZVxyXG4gICAgKTtcclxuXHJcbiAgICBzZWdtZW50cy5wdXNoKHNlZ21lbnQpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVtYWluaW5nQ2hhaW4sXHJcbiAgICAgICAgc2VnbWVudFxyXG4gICAgfTtcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkUm9vdFNlZ21lbnQgPSAoXHJcbiAgICBzZWdtZW50czogQXJyYXk8SUNoYWluU2VnbWVudD4sXHJcbiAgICByZW1haW5pbmdDaGFpbjogc3RyaW5nXHJcbik6IHsgcmVtYWluaW5nQ2hhaW46IHN0cmluZywgc2VnbWVudDogSUNoYWluU2VnbWVudCB9ID0+IHtcclxuXHJcbiAgICBjb25zdCByb290U2VnbWVudFN0YXJ0ID0gbmV3IFNlZ21lbnROb2RlKFxyXG4gICAgICAgIFwiZ3VpZGVSb290XCIsXHJcbiAgICAgICAgJycsXHJcbiAgICAgICAgT3V0bGluZVR5cGUuTm9kZSxcclxuICAgICAgICB0cnVlLFxyXG4gICAgICAgIGZhbHNlXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IHJvb3RTZWdtZW50RW5kID0gZ2V0TmV4dFNlZ21lbnROb2RlKHJlbWFpbmluZ0NoYWluKTtcclxuXHJcbiAgICBpZiAoIXJvb3RTZWdtZW50RW5kLnNlZ21lbnROb2RlKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgc3RhcnQgbm9kZSB3YXMgbnVsbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByb290U2VnbWVudCA9IG5ldyBDaGFpblNlZ21lbnQoXHJcbiAgICAgICAgc2VnbWVudHMubGVuZ3RoLFxyXG4gICAgICAgIHJvb3RTZWdtZW50U3RhcnQsXHJcbiAgICAgICAgcm9vdFNlZ21lbnRFbmQuc2VnbWVudE5vZGVcclxuICAgICk7XHJcblxyXG4gICAgc2VnbWVudHMucHVzaChyb290U2VnbWVudCk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZW1haW5pbmdDaGFpbixcclxuICAgICAgICBzZWdtZW50OiByb290U2VnbWVudFxyXG4gICAgfTtcclxufTtcclxuXHJcbmNvbnN0IGxvYWRTZWdtZW50ID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICBzdGFydE91dGxpbmVOb2RlOiBJUmVuZGVyT3V0bGluZU5vZGUgfCBudWxsID0gbnVsbFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBnU2VnbWVudENvZGUubG9hZFNlZ21lbnRPdXRsaW5lTm9kZXMoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgc2VnbWVudCxcclxuICAgICAgICBzdGFydE91dGxpbmVOb2RlXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IG5leHRTZWdtZW50T3V0bGluZU5vZGVzID0gc2VnbWVudC5vdXRsaW5lTm9kZXM7XHJcblxyXG4gICAgaWYgKG5leHRTZWdtZW50T3V0bGluZU5vZGVzLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgY29uc3QgZmlyc3ROb2RlID0gbmV4dFNlZ21lbnRPdXRsaW5lTm9kZXNbbmV4dFNlZ21lbnRPdXRsaW5lTm9kZXMubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAgIGlmIChmaXJzdE5vZGUuaSA9PT0gc2VnbWVudC5zdGFydC5rZXkpIHtcclxuXHJcbiAgICAgICAgICAgIGZpcnN0Tm9kZS50eXBlID0gc2VnbWVudC5zdGFydC50eXBlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbGFzdE5vZGUgPSBuZXh0U2VnbWVudE91dGxpbmVOb2Rlc1swXTtcclxuXHJcbiAgICAgICAgaWYgKGxhc3ROb2RlLmkgPT09IHNlZ21lbnQuZW5kLmtleSkge1xyXG5cclxuICAgICAgICAgICAgbGFzdE5vZGUudHlwZSA9IHNlZ21lbnQuZW5kLnR5cGU7XHJcbiAgICAgICAgICAgIGxhc3ROb2RlLmlzTGFzdCA9IHNlZ21lbnQuZW5kLmlzTGFzdDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ0ZyYWdtZW50Q29kZS5sb2FkTmV4dENoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgc2VnbWVudFxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IGdTZWdtZW50Q29kZSA9IHtcclxuXHJcbiAgICBzZXROZXh0U2VnbWVudFNlY3Rpb246IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHNlZ21lbnRJbmRleDogbnVtYmVyIHwgbnVsbCxcclxuICAgICAgICBsaW5rOiBJRGlzcGxheUNoYXJ0XHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFzZWdtZW50SW5kZXhcclxuICAgICAgICAgICAgfHwgIXN0YXRlLnJlbmRlclN0YXRlLmlzQ2hhaW5Mb2FkXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNlZ21lbnQgPSBzdGF0ZS5yZW5kZXJTdGF0ZS5zZWdtZW50c1tzZWdtZW50SW5kZXggLSAxXTtcclxuXHJcbiAgICAgICAgaWYgKCFzZWdtZW50KSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWdtZW50IGlzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uID0gbGluaztcclxuICAgICAgICBjb25zdCBuZXh0U2VnbWVudCA9IHN0YXRlLnJlbmRlclN0YXRlLnNlZ21lbnRzW3NlZ21lbnRJbmRleF07XHJcblxyXG4gICAgICAgIGlmIChuZXh0U2VnbWVudCkge1xyXG5cclxuICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudEluU2VjdGlvbiA9IHNlZ21lbnQuc2VnbWVudFNlY3Rpb247XHJcbiAgICAgICAgICAgIG5leHRTZWdtZW50LnNlZ21lbnRTZWN0aW9uID0gbGluaztcclxuICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24gPSBsaW5rOyAvLyBUaGlzIGNvdWxkIGJlIHNldCBhZ2FpbiB3aGVuIHRoZSBlbmQgbm9kZSBpcyBwcm9jZXNzZWRcclxuXHJcbiAgICAgICAgICAgIGxvYWRTZWdtZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBuZXh0U2VnbWVudFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgbG9hZExpbmtTZWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBsaW5rU2VnbWVudEluZGV4OiBudW1iZXIsXHJcbiAgICAgICAgbGlua0ZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgbGluazogSURpc3BsYXlDaGFydFxyXG4gICAgKTogSUNoYWluU2VnbWVudCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlZ21lbnRzID0gc3RhdGUucmVuZGVyU3RhdGUuc2VnbWVudHM7XHJcblxyXG4gICAgICAgIGlmIChsaW5rU2VnbWVudEluZGV4IDwgMSkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmRleCA8IDAnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRTZWdtZW50ID0gc2VnbWVudHNbbGlua1NlZ21lbnRJbmRleCAtIDFdO1xyXG4gICAgICAgIGN1cnJlbnRTZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uID0gbGluaztcclxuXHJcbiAgICAgICAgaWYgKGxpbmtTZWdtZW50SW5kZXggPj0gc2VnbWVudHMubGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05leHQgaW5kZXggPj0gYXJyYXkgbGVuZ3RoJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBuZXh0U2VnbWVudCA9IHNlZ21lbnRzW2xpbmtTZWdtZW50SW5kZXhdO1xyXG5cclxuICAgICAgICBpZiAoIW5leHRTZWdtZW50KSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZXh0IGxpbmsgc2VnbWVudCB3YXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChuZXh0U2VnbWVudC5vdXRsaW5lTm9kZXNMb2FkZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXh0U2VnbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5leHRTZWdtZW50Lm91dGxpbmVOb2Rlc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudEluU2VjdGlvbiA9IGN1cnJlbnRTZWdtZW50LnNlZ21lbnRTZWN0aW9uO1xyXG4gICAgICAgIG5leHRTZWdtZW50LnNlZ21lbnRTZWN0aW9uID0gbGluaztcclxuICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbiA9IGxpbms7XHJcblxyXG4gICAgICAgIGlmICghbmV4dFNlZ21lbnQuc2VnbWVudEluU2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudEluU2VjdGlvbiA9IGN1cnJlbnRTZWdtZW50LnNlZ21lbnRTZWN0aW9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFuZXh0U2VnbWVudC5zZWdtZW50U2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudFNlY3Rpb24gPSBjdXJyZW50U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghbmV4dFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgICAgIG5leHRTZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uID0gY3VycmVudFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoVS5pc051bGxPcldoaXRlU3BhY2UobmV4dFNlZ21lbnQuc2VnbWVudFNlY3Rpb24ub3V0bGluZT8uci5pKSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmV4dCBzZWdtZW50IHNlY3Rpb24gcm9vdCBrZXkgd2FzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc3RhcnRPdXRsaW5lTm9kZSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX291dGxpbmVOb2RlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudFNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50U2VjdGlvbi5vdXRsaW5lPy5yLmkgYXMgc3RyaW5nXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbG9hZFNlZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBuZXh0U2VnbWVudCxcclxuICAgICAgICAgICAgc3RhcnRPdXRsaW5lTm9kZVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNoZWNrRm9yTGlua0Vycm9ycyhcclxuICAgICAgICAgICAgY3VycmVudFNlZ21lbnQsXHJcbiAgICAgICAgICAgIG5leHRTZWdtZW50LFxyXG4gICAgICAgICAgICBsaW5rRnJhZ21lbnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV4dFNlZ21lbnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRFeGl0U2VnbWVudDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgc2VnbWVudEluZGV4OiBudW1iZXIsXHJcbiAgICAgICAgcGx1Z0lEOiBzdHJpbmdcclxuICAgICk6IElDaGFpblNlZ21lbnQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBzZWdtZW50cyA9IHN0YXRlLnJlbmRlclN0YXRlLnNlZ21lbnRzO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRTZWdtZW50ID0gc2VnbWVudHNbc2VnbWVudEluZGV4XTtcclxuICAgICAgICBjb25zdCBleGl0U2VnbWVudEluZGV4ID0gc2VnbWVudEluZGV4ICsgMTtcclxuXHJcbiAgICAgICAgaWYgKGV4aXRTZWdtZW50SW5kZXggPj0gc2VnbWVudHMubGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05leHQgaW5kZXggPj0gYXJyYXkgbGVuZ3RoJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBleGl0U2VnbWVudCA9IHNlZ21lbnRzW2V4aXRTZWdtZW50SW5kZXhdO1xyXG5cclxuICAgICAgICBpZiAoIWV4aXRTZWdtZW50KSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeGl0IGxpbmsgc2VnbWVudCB3YXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChleGl0U2VnbWVudC5vdXRsaW5lTm9kZXNMb2FkZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBleGl0U2VnbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNlZ21lbnRTZWN0aW9uID0gY3VycmVudFNlZ21lbnQuc2VnbWVudFNlY3Rpb24gYXMgSURpc3BsYXlDaGFydDtcclxuICAgICAgICBjb25zdCBsaW5rID0gc2VnbWVudFNlY3Rpb24ucGFyZW50O1xyXG5cclxuICAgICAgICBpZiAoIWxpbmspIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkxpbmsgZnJhZ21udCB3YXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN1cnJlbnRTZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uID0gbGluay5zZWN0aW9uO1xyXG4gICAgICAgIGV4aXRTZWdtZW50Lm91dGxpbmVOb2Rlc0xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgZXhpdFNlZ21lbnQuc2VnbWVudEluU2VjdGlvbiA9IGN1cnJlbnRTZWdtZW50LnNlZ21lbnRTZWN0aW9uO1xyXG4gICAgICAgIGV4aXRTZWdtZW50LnNlZ21lbnRTZWN0aW9uID0gY3VycmVudFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb247XHJcbiAgICAgICAgZXhpdFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24gPSBjdXJyZW50U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKCFleGl0U2VnbWVudC5zZWdtZW50SW5TZWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWdtZW50IGluIHNlY3Rpb24gd2FzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBleGl0T3V0bGluZU5vZGUgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9vdXRsaW5lTm9kZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGV4aXRTZWdtZW50LnNlZ21lbnRJblNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgICAgICBleGl0U2VnbWVudC5zdGFydC5rZXlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoIWV4aXRPdXRsaW5lTm9kZSkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhpdE91dGxpbmVOb2RlIHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKFUuaXNOdWxsT3JXaGl0ZVNwYWNlKGV4aXRPdXRsaW5lTm9kZS5feCkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4aXQga2V5IHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcGx1Z091dGxpbmVOb2RlID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfb3V0bGluZU5vZGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBleGl0U2VnbWVudC5zZWdtZW50U2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgIHBsdWdJRFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghcGx1Z091dGxpbmVOb2RlKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbHVnT3V0bGluZU5vZGUgd2FzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZXhpdE91dGxpbmVOb2RlLl94ICE9PSBwbHVnT3V0bGluZU5vZGUueCkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGx1Z091dGxpbmVOb2RlIGRvZXMgbm90IG1hdGNoIGV4aXRPdXRsaW5lTm9kZVwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxvYWRTZWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgZXhpdFNlZ21lbnQsXHJcbiAgICAgICAgICAgIHBsdWdPdXRsaW5lTm9kZVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBleGl0U2VnbWVudDtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZE5leHRTZWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50XHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKHNlZ21lbnQub3V0bGluZU5vZGVzTG9hZGVkID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlZ21lbnQub3V0bGluZU5vZGVzTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBjb25zdCBuZXh0U2VnbWVudEluZGV4ID0gc2VnbWVudC5pbmRleCArIDE7XHJcbiAgICAgICAgY29uc3Qgc2VnbWVudHMgPSBzdGF0ZS5yZW5kZXJTdGF0ZS5zZWdtZW50cztcclxuXHJcbiAgICAgICAgaWYgKG5leHRTZWdtZW50SW5kZXggPj0gc2VnbWVudHMubGVuZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05leHQgaW5kZXggPj0gYXJyYXkgbGVuZ3RoJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBuZXh0U2VnbWVudCA9IHNlZ21lbnRzW25leHRTZWdtZW50SW5kZXhdO1xyXG5cclxuICAgICAgICBpZiAobmV4dFNlZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghbmV4dFNlZ21lbnQuc2VnbWVudEluU2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgICAgIG5leHRTZWdtZW50LnNlZ21lbnRJblNlY3Rpb24gPSBzZWdtZW50LnNlZ21lbnRTZWN0aW9uO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIW5leHRTZWdtZW50LnNlZ21lbnRTZWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudFNlY3Rpb24gPSBzZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIW5leHRTZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV4dFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24gPSBzZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsb2FkU2VnbWVudChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgbmV4dFNlZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE5leHRTZWdtZW50T3V0bGluZU5vZGU6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnRcclxuICAgICk6IElSZW5kZXJPdXRsaW5lTm9kZSB8IG51bGwgPT4ge1xyXG5cclxuICAgICAgICBsZXQgb3V0bGluZU5vZGUgPSBzZWdtZW50Lm91dGxpbmVOb2Rlcy5wb3AoKSA/PyBudWxsO1xyXG5cclxuICAgICAgICBpZiAob3V0bGluZU5vZGU/LmlzTGFzdCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG91dGxpbmVOb2RlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHNlZ21lbnQub3V0bGluZU5vZGVzLmxlbmd0aCA9PT0gMCkge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbmV4dFNlZ21lbnQgPSBzdGF0ZS5yZW5kZXJTdGF0ZS5zZWdtZW50c1tzZWdtZW50LmluZGV4ICsgMV07XHJcblxyXG4gICAgICAgICAgICBpZiAoIW5leHRTZWdtZW50KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOZXh0U2VnbWVudCB3YXMgbnVsbCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIW5leHRTZWdtZW50LnNlZ21lbnRJblNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBuZXh0U2VnbWVudC5zZWdtZW50SW5TZWN0aW9uID0gc2VnbWVudC5zZWdtZW50U2VjdGlvbjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFuZXh0U2VnbWVudC5zZWdtZW50U2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgICAgIG5leHRTZWdtZW50LnNlZ21lbnRTZWN0aW9uID0gc2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFuZXh0U2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgICAgIG5leHRTZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uID0gc2VnbWVudC5zZWdtZW50T3V0U2VjdGlvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG91dGxpbmVOb2RlO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJzZVNlZ21lbnRzOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBxdWVyeVN0cmluZzogc3RyaW5nXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKHF1ZXJ5U3RyaW5nLnN0YXJ0c1dpdGgoJz8nKSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcXVlcnlTdHJpbmcgPSBxdWVyeVN0cmluZy5zdWJzdHJpbmcoMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZ1V0aWxpdGllcy5pc051bGxPcldoaXRlU3BhY2UocXVlcnlTdHJpbmcpID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNlZ21lbnRzOiBBcnJheTxJQ2hhaW5TZWdtZW50PiA9IFtdO1xyXG4gICAgICAgIGxldCByZW1haW5pbmdDaGFpbiA9IHF1ZXJ5U3RyaW5nO1xyXG4gICAgICAgIGxldCByZXN1bHQ6IHsgcmVtYWluaW5nQ2hhaW46IHN0cmluZywgc2VnbWVudDogSUNoYWluU2VnbWVudCB9O1xyXG5cclxuICAgICAgICByZXN1bHQgPSBidWlsZFJvb3RTZWdtZW50KFxyXG4gICAgICAgICAgICBzZWdtZW50cyxcclxuICAgICAgICAgICAgcmVtYWluaW5nQ2hhaW5cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB3aGlsZSAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKHJlbWFpbmluZ0NoYWluKSkge1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0ID0gYnVpbGRTZWdtZW50KFxyXG4gICAgICAgICAgICAgICAgc2VnbWVudHMsXHJcbiAgICAgICAgICAgICAgICByZW1haW5pbmdDaGFpblxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zZWdtZW50LmVuZC5pc0xhc3QgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZW1haW5pbmdDaGFpbiA9IHJlc3VsdC5yZW1haW5pbmdDaGFpbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLnNlZ21lbnRzID0gc2VnbWVudHM7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRTZWdtZW50T3V0bGluZU5vZGVzOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50LFxyXG4gICAgICAgIHN0YXJ0T3V0bGluZU5vZGU6IElSZW5kZXJPdXRsaW5lTm9kZSB8IG51bGwgPSBudWxsXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFzZWdtZW50LnNlZ21lbnRJblNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgaW4gc2VjdGlvbiB3YXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghc2VnbWVudC5zZWdtZW50U2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBzZWN0aW9uIHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHNlZ21lbnRPdXRsaW5lTm9kZXM6IEFycmF5PElSZW5kZXJPdXRsaW5lTm9kZT4gPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKCFzdGFydE91dGxpbmVOb2RlKSB7XHJcblxyXG4gICAgICAgICAgICBzdGFydE91dGxpbmVOb2RlID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfb3V0bGluZU5vZGUoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHNlZ21lbnQuc2VnbWVudEluU2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgICAgICBzZWdtZW50LnN0YXJ0LmtleVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFzdGFydE91dGxpbmVOb2RlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3RhcnQgb3V0bGluZSBub2RlIHdhcyBudWxsXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdGFydE91dGxpbmVOb2RlLnR5cGUgPSBzZWdtZW50LnN0YXJ0LnR5cGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZW5kT3V0bGluZU5vZGUgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9vdXRsaW5lTm9kZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHNlZ21lbnQuc2VnbWVudFNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgICAgICBzZWdtZW50LmVuZC5rZXlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoIWVuZE91dGxpbmVOb2RlKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbmQgb3V0bGluZSBub2RlIHdhcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZW5kT3V0bGluZU5vZGUudHlwZSA9IHNlZ21lbnQuZW5kLnR5cGU7XHJcbiAgICAgICAgbGV0IHBhcmVudDogSVJlbmRlck91dGxpbmVOb2RlIHwgbnVsbCA9IGVuZE91dGxpbmVOb2RlO1xyXG4gICAgICAgIGxldCBmaXJzdExvb3AgPSB0cnVlO1xyXG5cclxuICAgICAgICB3aGlsZSAocGFyZW50KSB7XHJcblxyXG4gICAgICAgICAgICBzZWdtZW50T3V0bGluZU5vZGVzLnB1c2gocGFyZW50KTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZmlyc3RMb29wXHJcbiAgICAgICAgICAgICAgICAmJiBwYXJlbnQ/LmlzQ2hhcnQgPT09IHRydWVcclxuICAgICAgICAgICAgICAgICYmIHBhcmVudD8uaXNSb290ID09PSB0cnVlXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQ/LmkgPT09IHN0YXJ0T3V0bGluZU5vZGUuaSkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZpcnN0TG9vcCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VnbWVudC5vdXRsaW5lTm9kZXMgPSBzZWdtZW50T3V0bGluZU5vZGVzO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnU2VnbWVudENvZGU7XHJcbiIsImltcG9ydCB7IFBhcnNlVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL1BhcnNlVHlwZVwiO1xyXG5pbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgSVN0YXRlQW55QXJyYXkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlQW55QXJyYXlcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVcIjtcclxuaW1wb3J0IElSZW5kZXJPdXRsaW5lQ2hhcnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lQ2hhcnRcIjtcclxuaW1wb3J0IGdPdXRsaW5lQ29kZSBmcm9tIFwiLi4vY29kZS9nT3V0bGluZUNvZGVcIjtcclxuaW1wb3J0IGdTZWdtZW50Q29kZSBmcm9tIFwiLi4vY29kZS9nU2VnbWVudENvZGVcIjtcclxuaW1wb3J0IGdTdGF0ZUNvZGUgZnJvbSBcIi4uL2NvZGUvZ1N0YXRlQ29kZVwiO1xyXG5pbXBvcnQgZ0ZpbGVDb25zdGFudHMgZnJvbSBcIi4uL2dGaWxlQ29uc3RhbnRzXCI7XHJcbmltcG9ydCBVIGZyb20gXCIuLi9nVXRpbGl0aWVzXCI7XHJcbmltcG9ydCBnRnJhZ21lbnRBY3Rpb25zIGZyb20gXCIuL2dGcmFnbWVudEFjdGlvbnNcIjtcclxuXHJcblxyXG5jb25zdCBnT3V0bGluZUFjdGlvbnMgPSB7XHJcblxyXG4gICAgbG9hZEd1aWRlT3V0bGluZVByb3BlcnRpZXM6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55LFxyXG4gICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsOiBzdHJpbmdcclxuICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgZ091dGxpbmVDb2RlLmxvYWRHdWlkZU91dGxpbmVQcm9wZXJ0aWVzKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlLFxyXG4gICAgICAgICAgICBmcmFnbWVudEZvbGRlclVybFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkU2VnbWVudENoYXJ0T3V0bGluZVByb3BlcnRpZXM6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55LFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0LFxyXG4gICAgICAgIHBhcmVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIHNlZ21lbnRJbmRleDogbnVtYmVyXHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5sb2FkU2VnbWVudENoYXJ0T3V0bGluZVByb3BlcnRpZXMoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvdXRsaW5lUmVzcG9uc2UsXHJcbiAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICBwYXJlbnQsXHJcbiAgICAgICAgICAgIHNlZ21lbnRJbmRleFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkQ2hhcnRPdXRsaW5lUHJvcGVydGllczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgb3V0bGluZTogSVJlbmRlck91dGxpbmUsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5sb2FkQ2hhcnRPdXRsaW5lUHJvcGVydGllcyhcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZSxcclxuICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgIHBhcmVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkUG9kT3V0bGluZVByb3BlcnRpZXM6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55LFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0LFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUubG9hZFBvZE91dGxpbmVQcm9wZXJ0aWVzKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlLFxyXG4gICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICBjaGFydCxcclxuICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRHdWlkZU91dGxpbmVBbmRTZWdtZW50czogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgcGF0aDogc3RyaW5nXHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlY3Rpb24gPSBzdGF0ZS5yZW5kZXJTdGF0ZS5kaXNwbGF5R3VpZGU7XHJcblxyXG4gICAgICAgIGlmICghc2VjdGlvbikge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgcm9vdFNlZ21lbnQgPSBzdGF0ZS5yZW5kZXJTdGF0ZS5zZWdtZW50c1swXTtcclxuXHJcbiAgICAgICAgaWYgKCFyb290U2VnbWVudCkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZnJhZ21lbnRGb2xkZXJVcmwgPSBzZWN0aW9uLmd1aWRlLmZyYWdtZW50Rm9sZGVyVXJsO1xyXG5cclxuICAgICAgICBpZiAoVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnRGb2xkZXJVcmwpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByb290U2VnbWVudC5zZWdtZW50SW5TZWN0aW9uID0gc2VjdGlvbjtcclxuICAgICAgICByb290U2VnbWVudC5zZWdtZW50U2VjdGlvbiA9IHNlY3Rpb247XHJcbiAgICAgICAgcm9vdFNlZ21lbnQuc2VnbWVudE91dFNlY3Rpb24gPSBzZWN0aW9uO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUubG9hZEd1aWRlT3V0bGluZVByb3BlcnRpZXMoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvdXRsaW5lUmVzcG9uc2UsXHJcbiAgICAgICAgICAgIHBhdGhcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnU2VnbWVudENvZGUubG9hZFNlZ21lbnRPdXRsaW5lTm9kZXMoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByb290U2VnbWVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZpcnN0Tm9kZSA9IGdTZWdtZW50Q29kZS5nZXROZXh0U2VnbWVudE91dGxpbmVOb2RlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcm9vdFNlZ21lbnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoZmlyc3ROb2RlKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBgJHtmcmFnbWVudEZvbGRlclVybH0vJHtmaXJzdE5vZGUuaX0ke2dGaWxlQ29uc3RhbnRzLmZyYWdtZW50RmlsZUV4dGVuc2lvbn1gO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbG9hZERlbGVnYXRlID0gKFxyXG4gICAgICAgICAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55XHJcbiAgICAgICAgICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ0ZyYWdtZW50QWN0aW9ucy5sb2FkQ2hhaW5GcmFnbWVudChcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBvdXRsaW5lUmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgcm9vdFNlZ21lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlyc3ROb2RlXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgZ1N0YXRlQ29kZS5BZGRSZUxvYWREYXRhRWZmZWN0SW1tZWRpYXRlKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBgbG9hZENoYWluRnJhZ21lbnRgLFxyXG4gICAgICAgICAgICAgICAgUGFyc2VUeXBlLkpzb24sXHJcbiAgICAgICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgICAgICBsb2FkRGVsZWdhdGVcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGdTZWdtZW50Q29kZS5sb2FkTmV4dFNlZ21lbnQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHJvb3RTZWdtZW50LFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnT3V0bGluZUFjdGlvbnM7XHJcbiIsImltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBJUmVuZGVyT3V0bGluZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVcIjtcclxuaW1wb3J0IElSZW5kZXJPdXRsaW5lQ2hhcnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJPdXRsaW5lQ2hhcnRcIjtcclxuaW1wb3J0IElSZW5kZXJPdXRsaW5lTm9kZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVOb2RlXCI7XHJcbmltcG9ydCBSZW5kZXJPdXRsaW5lIGZyb20gXCIuLi8uLi9zdGF0ZS9yZW5kZXIvUmVuZGVyT3V0bGluZVwiO1xyXG5pbXBvcnQgUmVuZGVyT3V0bGluZUNoYXJ0IGZyb20gXCIuLi8uLi9zdGF0ZS9yZW5kZXIvUmVuZGVyT3V0bGluZUNoYXJ0XCI7XHJcbmltcG9ydCBSZW5kZXJPdXRsaW5lTm9kZSBmcm9tIFwiLi4vLi4vc3RhdGUvcmVuZGVyL1JlbmRlck91dGxpbmVOb2RlXCI7XHJcbmltcG9ydCBnRnJhZ21lbnRDb2RlIGZyb20gXCIuL2dGcmFnbWVudENvZGVcIjtcclxuaW1wb3J0IGdTdGF0ZUNvZGUgZnJvbSBcIi4vZ1N0YXRlQ29kZVwiO1xyXG5pbXBvcnQgZ1JlbmRlckNvZGUgZnJvbSBcIi4vZ1JlbmRlckNvZGVcIjtcclxuaW1wb3J0IGdGaWxlQ29uc3RhbnRzIGZyb20gXCIuLi9nRmlsZUNvbnN0YW50c1wiO1xyXG5pbXBvcnQgSVN0YXRlQW55QXJyYXkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlQW55QXJyYXlcIjtcclxuaW1wb3J0IFUgZnJvbSBcIi4uL2dVdGlsaXRpZXNcIjtcclxuaW1wb3J0IGdGcmFnbWVudEFjdGlvbnMgZnJvbSBcIi4uL2FjdGlvbnMvZ0ZyYWdtZW50QWN0aW9uc1wiO1xyXG5pbXBvcnQgeyBQYXJzZVR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9QYXJzZVR5cGVcIjtcclxuaW1wb3J0IERpc3BsYXlDaGFydCBmcm9tIFwiLi4vLi4vc3RhdGUvZGlzcGxheS9EaXNwbGF5Q2hhcnRcIjtcclxuaW1wb3J0IElEaXNwbGF5U2VjdGlvbiBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9kaXNwbGF5L0lEaXNwbGF5U2VjdGlvblwiO1xyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IGdPdXRsaW5lQWN0aW9ucyBmcm9tIFwiLi4vYWN0aW9ucy9nT3V0bGluZUFjdGlvbnNcIjtcclxuaW1wb3J0IHsgT3V0bGluZVR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9PdXRsaW5lVHlwZVwiO1xyXG5pbXBvcnQgZ1NlZ21lbnRDb2RlIGZyb20gXCIuL2dTZWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgSURpc3BsYXlDaGFydCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9kaXNwbGF5L0lEaXNwbGF5Q2hhcnRcIjtcclxuXHJcblxyXG5jb25zdCBjYWNoZU5vZGVGb3JOZXdMaW5rID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIG91dGxpbmVOb2RlOiBJUmVuZGVyT3V0bGluZU5vZGUsXHJcbiAgICBsaW5rSUQ6IG51bWJlcixcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgZ1N0YXRlQ29kZS5jYWNoZV9vdXRsaW5lTm9kZShcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBsaW5rSUQsXHJcbiAgICAgICAgb3V0bGluZU5vZGVcclxuICAgICk7XHJcblxyXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygb3V0bGluZU5vZGUubykge1xyXG5cclxuICAgICAgICBjYWNoZU5vZGVGb3JOZXdMaW5rKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3B0aW9uLFxyXG4gICAgICAgICAgICBsaW5rSURcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgY2FjaGVOb2RlRm9yTmV3UG9kID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIG91dGxpbmVOb2RlOiBJUmVuZGVyT3V0bGluZU5vZGUsXHJcbiAgICBsaW5rSUQ6IG51bWJlcixcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgZ1N0YXRlQ29kZS5jYWNoZV9vdXRsaW5lTm9kZShcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBsaW5rSUQsXHJcbiAgICAgICAgb3V0bGluZU5vZGVcclxuICAgICk7XHJcblxyXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2Ygb3V0bGluZU5vZGUubykge1xyXG5cclxuICAgICAgICBjYWNoZU5vZGVGb3JOZXdQb2QoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb24sXHJcbiAgICAgICAgICAgIGxpbmtJRFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5jb25zdCBsb2FkTm9kZSA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICByYXdOb2RlOiBhbnksXHJcbiAgICBsaW5rSUQ6IG51bWJlcixcclxuICAgIHBhcmVudDogSVJlbmRlck91dGxpbmVOb2RlIHwgbnVsbCA9IG51bGxcclxuKTogSVJlbmRlck91dGxpbmVOb2RlID0+IHtcclxuXHJcbiAgICBjb25zdCBub2RlID0gbmV3IFJlbmRlck91dGxpbmVOb2RlKCk7XHJcbiAgICBub2RlLmkgPSByYXdOb2RlLmk7XHJcbiAgICBub2RlLmMgPSByYXdOb2RlLmMgPz8gbnVsbDtcclxuICAgIG5vZGUuZCA9IHJhd05vZGUuZCA/PyBudWxsO1xyXG4gICAgbm9kZS5feCA9IHJhd05vZGUuX3ggPz8gbnVsbDtcclxuICAgIG5vZGUueCA9IHJhd05vZGUueCA/PyBudWxsO1xyXG4gICAgbm9kZS5wYXJlbnQgPSBwYXJlbnQ7XHJcbiAgICBub2RlLnR5cGUgPSBPdXRsaW5lVHlwZS5Ob2RlO1xyXG5cclxuICAgIGdTdGF0ZUNvZGUuY2FjaGVfb3V0bGluZU5vZGUoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgbGlua0lELFxyXG4gICAgICAgIG5vZGVcclxuICAgICk7XHJcblxyXG4gICAgaWYgKG5vZGUuYykge1xyXG5cclxuICAgICAgICBub2RlLnR5cGUgPSBPdXRsaW5lVHlwZS5MaW5rO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyYXdOb2RlLm9cclxuICAgICAgICAmJiBBcnJheS5pc0FycmF5KHJhd05vZGUubykgPT09IHRydWVcclxuICAgICAgICAmJiByYXdOb2RlLm8ubGVuZ3RoID4gMFxyXG4gICAgKSB7XHJcbiAgICAgICAgbGV0IG86IElSZW5kZXJPdXRsaW5lTm9kZTtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBvcHRpb24gb2YgcmF3Tm9kZS5vKSB7XHJcblxyXG4gICAgICAgICAgICBvID0gbG9hZE5vZGUoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIGxpbmtJRCxcclxuICAgICAgICAgICAgICAgIG5vZGVcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIG5vZGUuby5wdXNoKG8pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbm9kZTtcclxufTtcclxuXHJcbmNvbnN0IGxvYWRDaGFydHMgPSAoXHJcbiAgICBvdXRsaW5lOiBJUmVuZGVyT3V0bGluZSxcclxuICAgIHJhd091dGxpbmVDaGFydHM6IEFycmF5PGFueT5cclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgb3V0bGluZS5jID0gW107XHJcbiAgICBsZXQgYzogSVJlbmRlck91dGxpbmVDaGFydDtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGNoYXJ0IG9mIHJhd091dGxpbmVDaGFydHMpIHtcclxuXHJcbiAgICAgICAgYyA9IG5ldyBSZW5kZXJPdXRsaW5lQ2hhcnQoKTtcclxuICAgICAgICBjLmkgPSBjaGFydC5pO1xyXG4gICAgICAgIGMuYiA9IGNoYXJ0LmI7XHJcbiAgICAgICAgYy5wID0gY2hhcnQucDtcclxuICAgICAgICBvdXRsaW5lLmMucHVzaChjKTtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IGdPdXRsaW5lQ29kZSA9IHtcclxuXHJcbiAgICByZWdpc3Rlck91dGxpbmVVcmxEb3dubG9hZDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgdXJsOiBzdHJpbmdcclxuICAgICk6IGJvb2xlYW4gPT4ge1xyXG5cclxuICAgICAgICBpZiAoc3RhdGUucmVuZGVyU3RhdGUub3V0bGluZVVybHNbdXJsXSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5vdXRsaW5lVXJsc1t1cmxdID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkR3VpZGVPdXRsaW5lUHJvcGVydGllczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgZnJhZ21lbnRGb2xkZXJVcmw6IHN0cmluZ1xyXG4gICAgKTogSVJlbmRlck91dGxpbmUgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZSkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEaXNwbGF5R3VpZGUgd2FzIG51bGwuJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBndWlkZSA9IHN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZTtcclxuICAgICAgICBjb25zdCByYXdPdXRsaW5lID0gb3V0bGluZVJlc3BvbnNlLmpzb25EYXRhO1xyXG5cclxuICAgICAgICBjb25zdCBndWlkZU91dGxpbmUgPSBnT3V0bGluZUNvZGUuZ2V0R3VpZGVPdXRsaW5lKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgZnJhZ21lbnRGb2xkZXJVcmxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUubG9hZE91dGxpbmVQcm9wZXJ0aWVzKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmF3T3V0bGluZSxcclxuICAgICAgICAgICAgZ3VpZGVPdXRsaW5lLFxyXG4gICAgICAgICAgICBndWlkZS5saW5rSURcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBndWlkZS5vdXRsaW5lID0gZ3VpZGVPdXRsaW5lO1xyXG4gICAgICAgIGd1aWRlT3V0bGluZS5yLmlzQ2hhcnQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlLnJlbmRlclN0YXRlLmlzQ2hhaW5Mb2FkID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzZWdtZW50cyA9IHN0YXRlLnJlbmRlclN0YXRlLnNlZ21lbnRzO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNlZ21lbnRzLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCByb290U2VnbWVudCA9IHNlZ21lbnRzWzBdO1xyXG4gICAgICAgICAgICAgICAgcm9vdFNlZ21lbnQuc3RhcnQua2V5ID0gZ3VpZGVPdXRsaW5lLnIuaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jYWNoZVNlY3Rpb25Sb290KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgZ3VpZGVcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoZ3VpZGVPdXRsaW5lLnIuYyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIC8vIExvYWQgb3V0bGluZSBmcm9tIHRoYXQgbG9jYXRpb24gYW5kIGxvYWQgcm9vdFxyXG5cclxuICAgICAgICAgICAgY29uc3Qgb3V0bGluZUNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0IHwgbnVsbCA9IGdPdXRsaW5lQ29kZS5nZXRPdXRsaW5lQ2hhcnQoXHJcbiAgICAgICAgICAgICAgICBndWlkZU91dGxpbmUsXHJcbiAgICAgICAgICAgICAgICBndWlkZU91dGxpbmUuci5jXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBndWlkZVJvb3QgPSBndWlkZS5yb290O1xyXG5cclxuICAgICAgICAgICAgaWYgKCFndWlkZVJvb3QpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBjdXJyZW50IGZyYWdtZW50IHdhcyBudWxsJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGdPdXRsaW5lQ29kZS5nZXRPdXRsaW5lRnJvbUNoYXJ0X3N1YnNjcmlwdGlvbihcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3V0bGluZUNoYXJ0LFxyXG4gICAgICAgICAgICAgICAgZ3VpZGVSb290XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGd1aWRlLnJvb3QpIHtcclxuXHJcbiAgICAgICAgICAgIGdGcmFnbWVudENvZGUuZXhwYW5kT3B0aW9uUG9kcyhcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgZ3VpZGUucm9vdFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgZ0ZyYWdtZW50Q29kZS5hdXRvRXhwYW5kU2luZ2xlQmxhbmtPcHRpb24oXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIGd1aWRlLnJvb3RcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBndWlkZU91dGxpbmU7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldE91dGxpbmVDaGFydDogKFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIGluZGV4OiBudW1iZXJcclxuICAgICk6IElSZW5kZXJPdXRsaW5lQ2hhcnQgfCBudWxsID0+IHtcclxuXHJcbiAgICAgICAgaWYgKG91dGxpbmUuYy5sZW5ndGggPiBpbmRleCkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG91dGxpbmUuY1tpbmRleF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgYnVpbGREaXNwbGF5Q2hhcnRGcm9tUmF3T3V0bGluZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgcmF3T3V0bGluZTogYW55LFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIHBhcmVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgKTogSURpc3BsYXlDaGFydCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGxpbmsgPSBuZXcgRGlzcGxheUNoYXJ0KFxyXG4gICAgICAgICAgICBnU3RhdGVDb2RlLmdldEZyZXNoS2V5SW50KHN0YXRlKSxcclxuICAgICAgICAgICAgY2hhcnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUubG9hZE91dGxpbmVQcm9wZXJ0aWVzKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmF3T3V0bGluZSxcclxuICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgbGluay5saW5rSURcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBsaW5rLm91dGxpbmUgPSBvdXRsaW5lO1xyXG4gICAgICAgIGxpbmsucGFyZW50ID0gcGFyZW50O1xyXG4gICAgICAgIHBhcmVudC5saW5rID0gbGluaztcclxuXHJcbiAgICAgICAgcmV0dXJuIGxpbms7XHJcbiAgICB9LFxyXG5cclxuICAgIGJ1aWxkUG9kRGlzcGxheUNoYXJ0RnJvbVJhd091dGxpbmU6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0LFxyXG4gICAgICAgIHJhd091dGxpbmU6IGFueSxcclxuICAgICAgICBvdXRsaW5lOiBJUmVuZGVyT3V0bGluZSxcclxuICAgICAgICBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICk6IElEaXNwbGF5Q2hhcnQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBwb2QgPSBuZXcgRGlzcGxheUNoYXJ0KFxyXG4gICAgICAgICAgICBnU3RhdGVDb2RlLmdldEZyZXNoS2V5SW50KHN0YXRlKSxcclxuICAgICAgICAgICAgY2hhcnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUubG9hZE91dGxpbmVQcm9wZXJ0aWVzKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmF3T3V0bGluZSxcclxuICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgcG9kLmxpbmtJRFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHBvZC5vdXRsaW5lID0gb3V0bGluZTtcclxuICAgICAgICBwb2QucGFyZW50ID0gcGFyZW50O1xyXG4gICAgICAgIHBhcmVudC5wb2QgPSBwb2Q7XHJcblxyXG4gICAgICAgIHJldHVybiBwb2Q7XHJcbiAgICB9LFxyXG5cclxuICAgIGJ1aWxkRGlzcGxheUNoYXJ0RnJvbU91dGxpbmVGb3JOZXdMaW5rOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBjaGFydDogSVJlbmRlck91dGxpbmVDaGFydCxcclxuICAgICAgICBvdXRsaW5lOiBJUmVuZGVyT3V0bGluZSxcclxuICAgICAgICBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICk6IElEaXNwbGF5Q2hhcnQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBsaW5rID0gbmV3IERpc3BsYXlDaGFydChcclxuICAgICAgICAgICAgZ1N0YXRlQ29kZS5nZXRGcmVzaEtleUludChzdGF0ZSksXHJcbiAgICAgICAgICAgIGNoYXJ0XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZ091dGxpbmVDb2RlLmxvYWRPdXRsaW5lUHJvcGVydGllc0Zvck5ld0xpbmsoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICBsaW5rLmxpbmtJRFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGxpbmsub3V0bGluZSA9IG91dGxpbmU7XHJcbiAgICAgICAgbGluay5wYXJlbnQgPSBwYXJlbnQ7XHJcbiAgICAgICAgcGFyZW50LmxpbmsgPSBsaW5rO1xyXG5cclxuICAgICAgICByZXR1cm4gbGluaztcclxuICAgIH0sXHJcblxyXG4gICAgYnVpbGREaXNwbGF5Q2hhcnRGcm9tT3V0bGluZUZvck5ld1BvZDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgY2hhcnQ6IElSZW5kZXJPdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgb3V0bGluZTogSVJlbmRlck91dGxpbmUsXHJcbiAgICAgICAgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICApOiBJRGlzcGxheUNoYXJ0ID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgcG9kID0gbmV3IERpc3BsYXlDaGFydChcclxuICAgICAgICAgICAgZ1N0YXRlQ29kZS5nZXRGcmVzaEtleUludChzdGF0ZSksXHJcbiAgICAgICAgICAgIGNoYXJ0XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZ091dGxpbmVDb2RlLmxvYWRPdXRsaW5lUHJvcGVydGllc0Zvck5ld1BvZChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgIHBvZC5saW5rSURcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBwb2Qub3V0bGluZSA9IG91dGxpbmU7XHJcbiAgICAgICAgcG9kLnBhcmVudCA9IHBhcmVudDtcclxuICAgICAgICBwYXJlbnQucG9kID0gcG9kO1xyXG5cclxuICAgICAgICByZXR1cm4gcG9kO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkU2VnbWVudENoYXJ0T3V0bGluZVByb3BlcnRpZXM6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55LFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0LFxyXG4gICAgICAgIHBhcmVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIHNlZ21lbnRJbmRleDogbnVtYmVyXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKHBhcmVudC5saW5rKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYExpbmsgYWxyZWFkeSBsb2FkZWQsIHJvb3RJRDogJHtwYXJlbnQubGluay5yb290Py5pZH1gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJhd091dGxpbmUgPSBvdXRsaW5lUmVzcG9uc2UuanNvbkRhdGE7XHJcblxyXG4gICAgICAgIGNvbnN0IGxpbmsgPSBnT3V0bGluZUNvZGUuYnVpbGREaXNwbGF5Q2hhcnRGcm9tUmF3T3V0bGluZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICByYXdPdXRsaW5lLFxyXG4gICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICBwYXJlbnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnU2VnbWVudENvZGUubG9hZExpbmtTZWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgc2VnbWVudEluZGV4LFxyXG4gICAgICAgICAgICBwYXJlbnQsXHJcbiAgICAgICAgICAgIGxpbmtcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUuc2V0Q2hhcnRBc0N1cnJlbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBsaW5rXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jYWNoZVNlY3Rpb25Sb290KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgbGlua1xyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRDaGFydE91dGxpbmVQcm9wZXJ0aWVzOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvdXRsaW5lUmVzcG9uc2U6IGFueSxcclxuICAgICAgICBvdXRsaW5lOiBJUmVuZGVyT3V0bGluZSxcclxuICAgICAgICBjaGFydDogSVJlbmRlck91dGxpbmVDaGFydCxcclxuICAgICAgICBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAocGFyZW50LmxpbmspIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTGluayBhbHJlYWR5IGxvYWRlZCwgcm9vdElEOiAke3BhcmVudC5saW5rLnJvb3Q/LmlkfWApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmF3T3V0bGluZSA9IG91dGxpbmVSZXNwb25zZS5qc29uRGF0YTtcclxuXHJcbiAgICAgICAgY29uc3QgbGluayA9IGdPdXRsaW5lQ29kZS5idWlsZERpc3BsYXlDaGFydEZyb21SYXdPdXRsaW5lKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgIHJhd091dGxpbmUsXHJcbiAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgIHBhcmVudFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUuY2FjaGVTZWN0aW9uUm9vdChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGxpbmtcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBOZWVkIHRvIGJ1aWxkIGEgZGlzcGxheUNIYXJ0IGhlcmVcclxuICAgICAgICBnT3V0bGluZUNvZGUuc2V0Q2hhcnRBc0N1cnJlbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBsaW5rXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZ091dGxpbmVDb2RlLnBvc3RHZXRDaGFydE91dGxpbmVSb290X3N1YnNjcmlwdGlvbihcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGxpbmtcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkUG9kT3V0bGluZVByb3BlcnRpZXM6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55LFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0LFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb24ucG9kKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYExpbmsgYWxyZWFkeSBsb2FkZWQsIHJvb3RJRDogJHtvcHRpb24ucG9kLnJvb3Q/LmlkfWApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmF3T3V0bGluZSA9IG91dGxpbmVSZXNwb25zZS5qc29uRGF0YTtcclxuXHJcbiAgICAgICAgY29uc3QgcG9kID0gZ091dGxpbmVDb2RlLmJ1aWxkUG9kRGlzcGxheUNoYXJ0RnJvbVJhd091dGxpbmUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBjaGFydCxcclxuICAgICAgICAgICAgcmF3T3V0bGluZSxcclxuICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jYWNoZVNlY3Rpb25Sb290KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcG9kXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gLy8gTmVlZCB0byBidWlsZCBhIGRpc3BsYXlDSGFydCBoZXJlXHJcbiAgICAgICAgLy8gZ091dGxpbmVDb2RlLnNldENoYXJ0QXNDdXJyZW50KFxyXG4gICAgICAgIC8vICAgICBzdGF0ZSxcclxuICAgICAgICAvLyAgICAgbGlua1xyXG4gICAgICAgIC8vICk7XHJcblxyXG4gICAgICAgIGdPdXRsaW5lQ29kZS5wb3N0R2V0UG9kT3V0bGluZVJvb3Rfc3Vic2NyaXB0aW9uKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcG9kXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgcG9zdEdldENoYXJ0T3V0bGluZVJvb3Rfc3Vic2NyaXB0aW9uOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBzZWN0aW9uOiBJRGlzcGxheVNlY3Rpb25cclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoc2VjdGlvbi5yb290KSB7XHJcblxyXG4gICAgICAgICAgICAvLyBpZiAoIXNlY3Rpb24ucm9vdC51aS5kaXNjdXNzaW9uTG9hZGVkKSB7XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgdGhyb3cgbmV3IEVycm9yKCdTZWN0aW9uIHJvb3QgZGlzY3Vzc2lvbiB3YXMgbm90IGxvYWRlZCcpO1xyXG4gICAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBvdXRsaW5lID0gc2VjdGlvbi5vdXRsaW5lO1xyXG5cclxuICAgICAgICBpZiAoIW91dGxpbmUpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU2VjdGlvbiBvdXRsaW5lIHdhcyBudWxsJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByb290RnJhZ21lbklEID0gb3V0bGluZS5yLmk7XHJcbiAgICAgICAgY29uc3QgcGF0aCA9IG91dGxpbmUucGF0aDtcclxuICAgICAgICBjb25zdCB1cmw6IHN0cmluZyA9IGAke3BhdGh9LyR7cm9vdEZyYWdtZW5JRH0ke2dGaWxlQ29uc3RhbnRzLmZyYWdtZW50RmlsZUV4dGVuc2lvbn1gO1xyXG5cclxuICAgICAgICBjb25zdCBsb2FkQWN0aW9uID0gKHN0YXRlOiBJU3RhdGUsIHJlc3BvbnNlOiBhbnkpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnRnJhZ21lbnRBY3Rpb25zLmxvYWRSb290RnJhZ21lbnRBbmRTZXRTZWxlY3RlZChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICBzZWN0aW9uXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5BZGRSZUxvYWREYXRhRWZmZWN0SW1tZWRpYXRlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgYGxvYWRDaGFydE91dGxpbmVSb290YCxcclxuICAgICAgICAgICAgUGFyc2VUeXBlLlRleHQsXHJcbiAgICAgICAgICAgIHVybCxcclxuICAgICAgICAgICAgbG9hZEFjdGlvblxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIHBvc3RHZXRQb2RPdXRsaW5lUm9vdF9zdWJzY3JpcHRpb246IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHNlY3Rpb246IElEaXNwbGF5U2VjdGlvblxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmIChzZWN0aW9uLnJvb3QpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmICghc2VjdGlvbi5yb290LnVpLmRpc2N1c3Npb25Mb2FkZWQpIHtcclxuXHJcbiAgICAgICAgICAgIC8vICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlY3Rpb24gcm9vdCBkaXNjdXNzaW9uIHdhcyBub3QgbG9hZGVkJyk7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGxpbmUgPSBzZWN0aW9uLm91dGxpbmU7XHJcblxyXG4gICAgICAgIGlmICghb3V0bGluZSkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZWN0aW9uIG91dGxpbmUgd2FzIG51bGwnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJvb3RGcmFnbWVuSUQgPSBvdXRsaW5lLnIuaTtcclxuICAgICAgICBjb25zdCBwYXRoID0gb3V0bGluZS5wYXRoO1xyXG4gICAgICAgIGNvbnN0IHVybDogc3RyaW5nID0gYCR7cGF0aH0vJHtyb290RnJhZ21lbklEfSR7Z0ZpbGVDb25zdGFudHMuZnJhZ21lbnRGaWxlRXh0ZW5zaW9ufWA7XHJcblxyXG4gICAgICAgIGNvbnN0IGxvYWRBY3Rpb24gPSAoc3RhdGU6IElTdGF0ZSwgcmVzcG9uc2U6IGFueSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdGcmFnbWVudEFjdGlvbnMubG9hZFBvZFJvb3RGcmFnbWVudChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICBzZWN0aW9uXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5BZGRSZUxvYWREYXRhRWZmZWN0SW1tZWRpYXRlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgYGxvYWRDaGFydE91dGxpbmVSb290YCxcclxuICAgICAgICAgICAgUGFyc2VUeXBlLlRleHQsXHJcbiAgICAgICAgICAgIHVybCxcclxuICAgICAgICAgICAgbG9hZEFjdGlvblxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldENoYXJ0QXNDdXJyZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBkaXNwbGF5U2VjdGlvbjogSURpc3BsYXlTZWN0aW9uXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUuY3VycmVudFNlY3Rpb24gPSBkaXNwbGF5U2VjdGlvbjtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0R3VpZGVPdXRsaW5lOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBmcmFnbWVudEZvbGRlclVybDogc3RyaW5nXHJcbiAgICApOiBJUmVuZGVyT3V0bGluZSA9PiB7XHJcblxyXG4gICAgICAgIGxldCBvdXRsaW5lOiBJUmVuZGVyT3V0bGluZSA9IHN0YXRlLnJlbmRlclN0YXRlLm91dGxpbmVzW2ZyYWdtZW50Rm9sZGVyVXJsXTtcclxuXHJcbiAgICAgICAgaWYgKG91dGxpbmUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBvdXRsaW5lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb3V0bGluZSA9IG5ldyBSZW5kZXJPdXRsaW5lKFxyXG4gICAgICAgICAgICBmcmFnbWVudEZvbGRlclVybCxcclxuICAgICAgICAgICAgZG9jdW1lbnQuYmFzZVVSSVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLm91dGxpbmVzW2ZyYWdtZW50Rm9sZGVyVXJsXSA9IG91dGxpbmU7XHJcblxyXG4gICAgICAgIHJldHVybiBvdXRsaW5lO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRPdXRsaW5lOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBmcmFnbWVudEZvbGRlclVybDogc3RyaW5nLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0LFxyXG4gICAgICAgIGxpbmtGcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiBJUmVuZGVyT3V0bGluZSA9PiB7XHJcblxyXG4gICAgICAgIGxldCBvdXRsaW5lOiBJUmVuZGVyT3V0bGluZSA9IHN0YXRlLnJlbmRlclN0YXRlLm91dGxpbmVzW2ZyYWdtZW50Rm9sZGVyVXJsXTtcclxuXHJcbiAgICAgICAgaWYgKG91dGxpbmUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBvdXRsaW5lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJhc2VVUkk6IHN0cmluZyB8IG51bGwgPSBjaGFydC5iO1xyXG5cclxuICAgICAgICBpZiAoVS5pc051bGxPcldoaXRlU3BhY2UoYmFzZVVSSSkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGJhc2VVUkkgPSBsaW5rRnJhZ21lbnQuc2VjdGlvbi5vdXRsaW5lPy5iYXNlVVJJID8/IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWJhc2VVUkkpIHtcclxuXHJcbiAgICAgICAgICAgIGJhc2VVUkkgPSBkb2N1bWVudC5iYXNlVVJJO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb3V0bGluZSA9IG5ldyBSZW5kZXJPdXRsaW5lKFxyXG4gICAgICAgICAgICBmcmFnbWVudEZvbGRlclVybCxcclxuICAgICAgICAgICAgYmFzZVVSSSFcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5vdXRsaW5lc1tmcmFnbWVudEZvbGRlclVybF0gPSBvdXRsaW5lO1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0bGluZTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gZ2V0RnJhZ21lbnRMaW5rQ2hhcnRPdXRsaW5lOiAoXHJcbiAgICAvLyAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIC8vICAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbiAgICAvLyApOiB2b2lkID0+IHtcclxuXHJcbiAgICAvLyAgICAgY29uc3Qgb3V0bGluZSA9IGZyYWdtZW50LnNlY3Rpb24ub3V0bGluZTtcclxuXHJcbiAgICAvLyAgICAgaWYgKCFvdXRsaW5lKSB7XHJcbiAgICAvLyAgICAgICAgIHJldHVybjtcclxuICAgIC8vICAgICB9XHJcblxyXG4gICAgLy8gICAgIGNvbnN0IG91dGxpbmVOb2RlID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfb3V0bGluZU5vZGUoXHJcbiAgICAvLyAgICAgICAgIHN0YXRlLFxyXG4gICAgLy8gICAgICAgICBmcmFnbWVudC5zZWN0aW9uLmxpbmtJRCxcclxuICAgIC8vICAgICAgICAgZnJhZ21lbnQuaWRcclxuICAgIC8vICAgICApO1xyXG5cclxuICAgIC8vICAgICBpZiAob3V0bGluZU5vZGU/LmMgPT0gbnVsbCkge1xyXG4gICAgLy8gICAgICAgICByZXR1cm47XHJcbiAgICAvLyAgICAgfVxyXG5cclxuICAgIC8vICAgICBjb25zdCBvdXRsaW5lQ2hhcnQgPSBnT3V0bGluZUNvZGUuZ2V0T3V0bGluZUNoYXJ0KFxyXG4gICAgLy8gICAgICAgICBvdXRsaW5lLFxyXG4gICAgLy8gICAgICAgICBvdXRsaW5lTm9kZT8uY1xyXG4gICAgLy8gICAgICk7XHJcblxyXG4gICAgLy8gICAgIGdPdXRsaW5lQ29kZS5nZXRPdXRsaW5lRnJvbUNoYXJ0X3N1YnNjcmlwdGlvbihcclxuICAgIC8vICAgICAgICAgc3RhdGUsXHJcbiAgICAvLyAgICAgICAgIG91dGxpbmVDaGFydCxcclxuICAgIC8vICAgICAgICAgZnJhZ21lbnRcclxuICAgIC8vICAgICApO1xyXG4gICAgLy8gfSxcclxuXHJcbiAgICBnZXRMaW5rT3V0bGluZV9zdWJzY3JpcGlvbjogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgY29uc3Qgb3V0bGluZSA9IG9wdGlvbi5zZWN0aW9uLm91dGxpbmU7XHJcblxyXG4gICAgICAgIGlmICghb3V0bGluZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBvdXRsaW5lTm9kZSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX291dGxpbmVOb2RlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3B0aW9uLnNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgICAgICBvcHRpb24uaWRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAob3V0bGluZU5vZGU/LmMgPT0gbnVsbFxyXG4gICAgICAgICAgICB8fCBzdGF0ZS5yZW5kZXJTdGF0ZS5pc0NoYWluTG9hZCA9PT0gdHJ1ZSAvLyBXaWxsIGxvYWQgaXQgZnJvbSBhIHNlZ21lbnRcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgb3V0bGluZUNoYXJ0ID0gZ091dGxpbmVDb2RlLmdldE91dGxpbmVDaGFydChcclxuICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgb3V0bGluZU5vZGU/LmNcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnT3V0bGluZUNvZGUuZ2V0T3V0bGluZUZyb21DaGFydF9zdWJzY3JpcHRpb24oXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvdXRsaW5lQ2hhcnQsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFBvZE91dGxpbmVfc3Vic2NyaXBpb246IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIHNlY3Rpb246IElEaXNwbGF5U2VjdGlvbixcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoVS5pc051bGxPcldoaXRlU3BhY2Uob3B0aW9uLnBvZEtleSkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgb3V0bGluZSA9IHNlY3Rpb24ub3V0bGluZTtcclxuXHJcbiAgICAgICAgaWYgKCFvdXRsaW5lKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGxpbmVOb2RlID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfb3V0bGluZU5vZGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb24uc2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgIG9wdGlvbi5pZFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChvdXRsaW5lTm9kZT8uZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGxpbmVDaGFydCA9IGdPdXRsaW5lQ29kZS5nZXRPdXRsaW5lQ2hhcnQoXHJcbiAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgIG91dGxpbmVOb2RlPy5kXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZ091dGxpbmVDb2RlLmdldE91dGxpbmVGcm9tUG9kX3N1YnNjcmlwdGlvbihcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG91dGxpbmVDaGFydCxcclxuICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0U2VnbWVudE91dGxpbmVfc3Vic2NyaXB0aW9uOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBjaGFydDogSVJlbmRlck91dGxpbmVDaGFydCB8IG51bGwsXHJcbiAgICAgICAgbGlua0ZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgc2VnbWVudEluZGV4OiBudW1iZXJcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIWNoYXJ0KSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ091dGxpbmVDaGFydCB3YXMgbnVsbCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxpbmtGcmFnbWVudC5saW5rPy5yb290KSB7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgTGluayByb290IGFscmVhZHkgbG9hZGVkOiAke2xpbmtGcmFnbWVudC5saW5rLnJvb3Q/LmlkfWApO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IG5leHRTZWdtZW50SW5kZXggPSBzZWdtZW50SW5kZXg7XHJcblxyXG4gICAgICAgIGlmIChuZXh0U2VnbWVudEluZGV4ICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIG5leHRTZWdtZW50SW5kZXgrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGZyYWdtZW50Rm9sZGVyVXJsID0gZ1JlbmRlckNvZGUuZ2V0RnJhZ21lbnRGb2xkZXJVcmwoXHJcbiAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICBsaW5rRnJhZ21lbnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50Rm9sZGVyVXJsKSkge1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgb3V0bGluZSA9IGdPdXRsaW5lQ29kZS5nZXRPdXRsaW5lKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudEZvbGRlclVybCxcclxuICAgICAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICAgICAgbGlua0ZyYWdtZW50XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAob3V0bGluZS5sb2FkZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWxpbmtGcmFnbWVudC5saW5rKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxpbmsgPSBnT3V0bGluZUNvZGUuYnVpbGREaXNwbGF5Q2hhcnRGcm9tT3V0bGluZUZvck5ld0xpbmsoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFydCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGlua0ZyYWdtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZ1NlZ21lbnRDb2RlLnNldE5leHRTZWdtZW50U2VjdGlvbihcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHRTZWdtZW50SW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmtcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGdPdXRsaW5lQ29kZS5zZXRDaGFydEFzQ3VycmVudChcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBsaW5rRnJhZ21lbnQubGluayBhcyBJRGlzcGxheVNlY3Rpb25cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1cmw6IHN0cmluZyA9IGAke2ZyYWdtZW50Rm9sZGVyVXJsfS8ke2dGaWxlQ29uc3RhbnRzLmd1aWRlT3V0bGluZUZpbGVuYW1lfWA7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9hZFJlcXVlc3RlZCA9IGdPdXRsaW5lQ29kZS5yZWdpc3Rlck91dGxpbmVVcmxEb3dubG9hZChcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICB1cmxcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxvYWRSZXF1ZXN0ZWQgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWU6IHN0cmluZztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUucmVuZGVyU3RhdGUuaXNDaGFpbkxvYWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGBsb2FkQ2hhaW5DaGFydE91dGxpbmVGaWxlYDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBgbG9hZENoYXJ0T3V0bGluZUZpbGVgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvYWREZWxlZ2F0ZSA9IChcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55XHJcbiAgICAgICAgICAgICAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnT3V0bGluZUFjdGlvbnMubG9hZFNlZ21lbnRDaGFydE91dGxpbmVQcm9wZXJ0aWVzKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFydCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGlua0ZyYWdtZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0U2VnbWVudEluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgZ1N0YXRlQ29kZS5BZGRSZUxvYWREYXRhRWZmZWN0SW1tZWRpYXRlKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgUGFyc2VUeXBlLkpzb24sXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsLFxyXG4gICAgICAgICAgICAgICAgICAgIGxvYWREZWxlZ2F0ZVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgZ2V0T3V0bGluZUZyb21DaGFydF9zdWJzY3JpcHRpb246IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0IHwgbnVsbCxcclxuICAgICAgICBsaW5rRnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghY2hhcnQpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignT3V0bGluZUNoYXJ0IHdhcyBudWxsJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobGlua0ZyYWdtZW50Lmxpbms/LnJvb3QpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBMaW5rIHJvb3QgYWxyZWFkeSBsb2FkZWQ6ICR7bGlua0ZyYWdtZW50Lmxpbmsucm9vdD8uaWR9YCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZnJhZ21lbnRGb2xkZXJVcmw6IHN0cmluZztcclxuICAgICAgICBjb25zdCBvdXRsaW5lQ2hhcnRQYXRoID0gY2hhcnQucDtcclxuXHJcbiAgICAgICAgaWYgKCFjaGFydC5pKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBJcyBhIHJlbW90ZSBndWlkZVxyXG4gICAgICAgICAgICBmcmFnbWVudEZvbGRlclVybCA9IG91dGxpbmVDaGFydFBhdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gSXMgYSBtYXBcclxuICAgICAgICAgICAgZnJhZ21lbnRGb2xkZXJVcmwgPSBnUmVuZGVyQ29kZS5nZXRGcmFnbWVudEZvbGRlclVybChcclxuICAgICAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICAgICAgbGlua0ZyYWdtZW50XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50Rm9sZGVyVXJsKSkge1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgb3V0bGluZSA9IGdPdXRsaW5lQ29kZS5nZXRPdXRsaW5lKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudEZvbGRlclVybCxcclxuICAgICAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICAgICAgbGlua0ZyYWdtZW50XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAob3V0bGluZS5sb2FkZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWxpbmtGcmFnbWVudC5saW5rKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGdPdXRsaW5lQ29kZS5idWlsZERpc3BsYXlDaGFydEZyb21PdXRsaW5lRm9yTmV3TGluayhcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5rRnJhZ21lbnRcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGdPdXRsaW5lQ29kZS5zZXRDaGFydEFzQ3VycmVudChcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBsaW5rRnJhZ21lbnQubGluayBhcyBJRGlzcGxheVNlY3Rpb25cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ091dGxpbmVDb2RlLnBvc3RHZXRDaGFydE91dGxpbmVSb290X3N1YnNjcmlwdGlvbihcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBsaW5rRnJhZ21lbnQubGluayBhcyBJRGlzcGxheVNlY3Rpb25cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB1cmw6IHN0cmluZyA9IGAke2ZyYWdtZW50Rm9sZGVyVXJsfS8ke2dGaWxlQ29uc3RhbnRzLmd1aWRlT3V0bGluZUZpbGVuYW1lfWA7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbG9hZFJlcXVlc3RlZCA9IGdPdXRsaW5lQ29kZS5yZWdpc3Rlck91dGxpbmVVcmxEb3dubG9hZChcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICB1cmxcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGxvYWRSZXF1ZXN0ZWQgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWU6IHN0cmluZztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUucmVuZGVyU3RhdGUuaXNDaGFpbkxvYWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSA9IGBsb2FkQ2hhaW5DaGFydE91dGxpbmVGaWxlYDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBgbG9hZENoYXJ0T3V0bGluZUZpbGVgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvYWREZWxlZ2F0ZSA9IChcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55XHJcbiAgICAgICAgICAgICAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnT3V0bGluZUFjdGlvbnMubG9hZENoYXJ0T3V0bGluZVByb3BlcnRpZXMoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lUmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJ0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5rRnJhZ21lbnRcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBnU3RhdGVDb2RlLkFkZFJlTG9hZERhdGFFZmZlY3RJbW1lZGlhdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBQYXJzZVR5cGUuSnNvbixcclxuICAgICAgICAgICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZERlbGVnYXRlXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBnZXRPdXRsaW5lRnJvbVBvZF9zdWJzY3JpcHRpb246IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGNoYXJ0OiBJUmVuZGVyT3V0bGluZUNoYXJ0IHwgbnVsbCxcclxuICAgICAgICBvcHRpb25GcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFjaGFydCkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPdXRsaW5lQ2hhcnQgd2FzIG51bGwnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25GcmFnbWVudC5saW5rPy5yb290KSB7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgTGluayByb290IGFscmVhZHkgbG9hZGVkOiAke29wdGlvbkZyYWdtZW50Lmxpbmsucm9vdD8uaWR9YCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBmcmFnbWVudEZvbGRlclVybCA9IGdSZW5kZXJDb2RlLmdldEZyYWdtZW50Rm9sZGVyVXJsKFxyXG4gICAgICAgICAgICBjaGFydCxcclxuICAgICAgICAgICAgb3B0aW9uRnJhZ21lbnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnRGb2xkZXJVcmwpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGxpbmUgPSBnT3V0bGluZUNvZGUuZ2V0T3V0bGluZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsLFxyXG4gICAgICAgICAgICBjaGFydCxcclxuICAgICAgICAgICAgb3B0aW9uRnJhZ21lbnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAob3V0bGluZS5sb2FkZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghb3B0aW9uRnJhZ21lbnQucG9kKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZ091dGxpbmVDb2RlLmJ1aWxkRGlzcGxheUNoYXJ0RnJvbU91dGxpbmVGb3JOZXdQb2QoXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhcnQsXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25GcmFnbWVudFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZ091dGxpbmVDb2RlLnBvc3RHZXRQb2RPdXRsaW5lUm9vdF9zdWJzY3JpcHRpb24oXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbkZyYWdtZW50LnBvZCBhcyBJRGlzcGxheVNlY3Rpb25cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHVybDogc3RyaW5nID0gYCR7ZnJhZ21lbnRGb2xkZXJVcmx9LyR7Z0ZpbGVDb25zdGFudHMuZ3VpZGVPdXRsaW5lRmlsZW5hbWV9YDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGxvYWRSZXF1ZXN0ZWQgPSBnT3V0bGluZUNvZGUucmVnaXN0ZXJPdXRsaW5lVXJsRG93bmxvYWQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHVybFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKGxvYWRSZXF1ZXN0ZWQgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IG5hbWU6IHN0cmluZztcclxuXHJcbiAgICAgICAgICAgIGlmIChzdGF0ZS5yZW5kZXJTdGF0ZS5pc0NoYWluTG9hZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIG5hbWUgPSBgbG9hZENoYWluQ2hhcnRPdXRsaW5lRmlsZWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lID0gYGxvYWRDaGFydE91dGxpbmVGaWxlYDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgbG9hZERlbGVnYXRlID0gKFxyXG4gICAgICAgICAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZTogYW55XHJcbiAgICAgICAgICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ091dGxpbmVBY3Rpb25zLmxvYWRQb2RPdXRsaW5lUHJvcGVydGllcyhcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBvdXRsaW5lUmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0bGluZSxcclxuICAgICAgICAgICAgICAgICAgICBjaGFydCxcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25GcmFnbWVudFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGdTdGF0ZUNvZGUuQWRkUmVMb2FkRGF0YUVmZmVjdEltbWVkaWF0ZShcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgbmFtZSxcclxuICAgICAgICAgICAgICAgIFBhcnNlVHlwZS5Kc29uLFxyXG4gICAgICAgICAgICAgICAgdXJsLFxyXG4gICAgICAgICAgICAgICAgbG9hZERlbGVnYXRlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkT3V0bGluZVByb3BlcnRpZXM6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHJhd091dGxpbmU6IGFueSxcclxuICAgICAgICBvdXRsaW5lOiBJUmVuZGVyT3V0bGluZSxcclxuICAgICAgICBsaW5rSUQ6IG51bWJlclxyXG4gICAgKTogSVJlbmRlck91dGxpbmUgPT4ge1xyXG5cclxuICAgICAgICBvdXRsaW5lLnYgPSByYXdPdXRsaW5lLnY7XHJcblxyXG4gICAgICAgIGlmIChyYXdPdXRsaW5lLmNcclxuICAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShyYXdPdXRsaW5lLmMpID09PSB0cnVlXHJcbiAgICAgICAgICAgICYmIHJhd091dGxpbmUuYy5sZW5ndGggPiAwXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGxvYWRDaGFydHMoXHJcbiAgICAgICAgICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgICAgICAgICAgcmF3T3V0bGluZS5jXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmF3T3V0bGluZS5lKSB7XHJcblxyXG4gICAgICAgICAgICBvdXRsaW5lLmUgPSByYXdPdXRsaW5lLmU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvdXRsaW5lLnIgPSBsb2FkTm9kZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHJhd091dGxpbmUucixcclxuICAgICAgICAgICAgbGlua0lEXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgb3V0bGluZS5sb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIG91dGxpbmUuci5pc1Jvb3QgPSB0cnVlO1xyXG4gICAgICAgIG91dGxpbmUubXYgPSByYXdPdXRsaW5lLm12O1xyXG5cclxuICAgICAgICByZXR1cm4gb3V0bGluZTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZE91dGxpbmVQcm9wZXJ0aWVzRm9yTmV3TGluazogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3V0bGluZTogSVJlbmRlck91dGxpbmUsXHJcbiAgICAgICAgbGlua0lEOiBudW1iZXJcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBjYWNoZU5vZGVGb3JOZXdMaW5rKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3V0bGluZS5yLFxyXG4gICAgICAgICAgICBsaW5rSURcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkT3V0bGluZVByb3BlcnRpZXNGb3JOZXdQb2Q6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG91dGxpbmU6IElSZW5kZXJPdXRsaW5lLFxyXG4gICAgICAgIGxpbmtJRDogbnVtYmVyXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgY2FjaGVOb2RlRm9yTmV3UG9kKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3V0bGluZS5yLFxyXG4gICAgICAgICAgICBsaW5rSURcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ091dGxpbmVDb2RlO1xyXG5cclxuIiwiXHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBVIGZyb20gXCIuLi9nVXRpbGl0aWVzXCI7XHJcbmltcG9ydCB7IEFjdGlvblR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9BY3Rpb25UeXBlXCI7XHJcbmltcG9ydCBnU3RhdGVDb2RlIGZyb20gXCIuLi9jb2RlL2dTdGF0ZUNvZGVcIjtcclxuaW1wb3J0IElTdGF0ZUFueUFycmF5IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZUFueUFycmF5XCI7XHJcbmltcG9ydCB7IElIdHRwRmV0Y2hJdGVtIH0gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvaHR0cC9JSHR0cEZldGNoSXRlbVwiO1xyXG5pbXBvcnQgeyBnQXV0aGVudGljYXRlZEh0dHAgfSBmcm9tIFwiLi4vaHR0cC9nQXV0aGVudGljYXRpb25IdHRwXCI7XHJcbi8vIGltcG9ydCBnQWpheEhlYWRlckNvZGUgZnJvbSBcIi4uL2h0dHAvZ0FqYXhIZWFkZXJDb2RlXCI7XHJcbmltcG9ydCBnRnJhZ21lbnRBY3Rpb25zIGZyb20gXCIuLi9hY3Rpb25zL2dGcmFnbWVudEFjdGlvbnNcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcblxyXG5cclxuY29uc3QgZ2V0RnJhZ21lbnQgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgZnJhZ21lbnRJRDogc3RyaW5nLFxyXG4gICAgZnJhZ21lbnRQYXRoOiBzdHJpbmcsXHJcbiAgICBfYWN0aW9uOiBBY3Rpb25UeXBlLFxyXG4gICAgbG9hZEFjdGlvbjogKHN0YXRlOiBJU3RhdGUsIHJlc3BvbnNlOiBhbnkpID0+IElTdGF0ZUFueUFycmF5KTogSUh0dHBGZXRjaEl0ZW0gfCB1bmRlZmluZWQgPT4ge1xyXG5cclxuICAgIGlmICghc3RhdGUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY2FsbElEOiBzdHJpbmcgPSBVLmdlbmVyYXRlR3VpZCgpO1xyXG5cclxuICAgIC8vIGxldCBoZWFkZXJzID0gZ0FqYXhIZWFkZXJDb2RlLmJ1aWxkSGVhZGVycyhcclxuICAgIC8vICAgICBzdGF0ZSxcclxuICAgIC8vICAgICBjYWxsSUQsXHJcbiAgICAvLyAgICAgYWN0aW9uXHJcbiAgICAvLyApO1xyXG5cclxuICAgIGNvbnN0IHVybDogc3RyaW5nID0gYCR7ZnJhZ21lbnRQYXRofWA7XHJcblxyXG4gICAgcmV0dXJuIGdBdXRoZW50aWNhdGVkSHR0cCh7XHJcbiAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgcGFyc2VUeXBlOiBcInRleHRcIixcclxuICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcclxuICAgICAgICAgICAgLy8gaGVhZGVyczogaGVhZGVycyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlc3BvbnNlOiAndGV4dCcsXHJcbiAgICAgICAgYWN0aW9uOiBsb2FkQWN0aW9uLFxyXG4gICAgICAgIGVycm9yOiAoc3RhdGU6IElTdGF0ZSwgZXJyb3JEZXRhaWxzOiBhbnkpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGB7XHJcbiAgICAgICAgICAgICAgICBcIm1lc3NhZ2VcIjogXCJFcnJvciBnZXR0aW5nIGZyYWdtZW50IGZyb20gdGhlIHNlcnZlciwgcGF0aDogJHtmcmFnbWVudFBhdGh9LCBpZDogJHtmcmFnbWVudElEfVwiLFxyXG4gICAgICAgICAgICAgICAgXCJ1cmxcIjogJHt1cmx9LFxyXG4gICAgICAgICAgICAgICAgXCJlcnJvciBEZXRhaWxzXCI6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3JEZXRhaWxzKX0sXHJcbiAgICAgICAgICAgICAgICBcInN0YWNrXCI6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3JEZXRhaWxzLnN0YWNrKX0sXHJcbiAgICAgICAgICAgICAgICBcIm1ldGhvZFwiOiAke2dldEZyYWdtZW50fSxcclxuICAgICAgICAgICAgICAgIFwiY2FsbElEOiAke2NhbGxJRH1cclxuICAgICAgICAgICAgfWApO1xyXG5cclxuICAgICAgICAgICAgYWxlcnQoYHtcclxuICAgICAgICAgICAgICAgIFwibWVzc2FnZVwiOiBcIkVycm9yIGdldHRpbmcgZnJhZ21lbnQgZnJvbSB0aGUgc2VydmVyLCBwYXRoOiAke2ZyYWdtZW50UGF0aH0sIGlkOiAke2ZyYWdtZW50SUR9XCIsXHJcbiAgICAgICAgICAgICAgICBcInVybFwiOiAke3VybH0sXHJcbiAgICAgICAgICAgICAgICBcImVycm9yIERldGFpbHNcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMpfSxcclxuICAgICAgICAgICAgICAgIFwic3RhY2tcIjogJHtKU09OLnN0cmluZ2lmeShlcnJvckRldGFpbHMuc3RhY2spfSxcclxuICAgICAgICAgICAgICAgIFwibWV0aG9kXCI6ICR7Z2V0RnJhZ21lbnQubmFtZX0sXHJcbiAgICAgICAgICAgICAgICBcImNhbGxJRDogJHtjYWxsSUR9XHJcbiAgICAgICAgICAgIH1gKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5jb25zdCBnRnJhZ21lbnRFZmZlY3RzID0ge1xyXG5cclxuICAgIGdldEZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICBmcmFnbWVudFBhdGg6IHN0cmluZ1xyXG4gICAgKTogSUh0dHBGZXRjaEl0ZW0gfCB1bmRlZmluZWQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBsb2FkQWN0aW9uOiAoc3RhdGU6IElTdGF0ZSwgcmVzcG9uc2U6IGFueSkgPT4gSVN0YXRlID0gKHN0YXRlOiBJU3RhdGUsIHJlc3BvbnNlOiBhbnkpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG5ld1N0YXRlID0gZ0ZyYWdtZW50QWN0aW9ucy5sb2FkRnJhZ21lbnQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBuZXdTdGF0ZS5yZW5kZXJTdGF0ZS5yZWZyZXNoVXJsID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXdTdGF0ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZ2V0RnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb24uaWQsXHJcbiAgICAgICAgICAgIGZyYWdtZW50UGF0aCxcclxuICAgICAgICAgICAgQWN0aW9uVHlwZS5HZXRGcmFnbWVudCxcclxuICAgICAgICAgICAgbG9hZEFjdGlvblxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBnRnJhZ21lbnRFZmZlY3RzO1xyXG4iLCJpbXBvcnQgeyBPdXRsaW5lVHlwZSB9IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL2VudW1zL091dGxpbmVUeXBlXCI7XHJcbmltcG9ydCBJRGlzcGxheUNoYXJ0IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2Rpc3BsYXkvSURpc3BsYXlDaGFydFwiO1xyXG5pbXBvcnQgSURpc3BsYXlTZWN0aW9uIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2Rpc3BsYXkvSURpc3BsYXlTZWN0aW9uXCI7XHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBJU3RhdGVBbnlBcnJheSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVBbnlBcnJheVwiO1xyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IElSZW5kZXJPdXRsaW5lTm9kZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlck91dGxpbmVOb2RlXCI7XHJcbmltcG9ydCBJQ2hhaW5TZWdtZW50IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3NlZ21lbnRzL0lDaGFpblNlZ21lbnRcIjtcclxuaW1wb3J0IGdGcmFnbWVudENvZGUgZnJvbSBcIi4uL2NvZGUvZ0ZyYWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgZ091dGxpbmVDb2RlIGZyb20gXCIuLi9jb2RlL2dPdXRsaW5lQ29kZVwiO1xyXG5pbXBvcnQgZ1NlZ21lbnRDb2RlIGZyb20gXCIuLi9jb2RlL2dTZWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgZ1N0YXRlQ29kZSBmcm9tIFwiLi4vY29kZS9nU3RhdGVDb2RlXCI7XHJcbmltcG9ydCBnRnJhZ21lbnRFZmZlY3RzIGZyb20gXCIuLi9lZmZlY3RzL2dGcmFnbWVudEVmZmVjdHNcIjtcclxuaW1wb3J0IGdGaWxlQ29uc3RhbnRzIGZyb20gXCIuLi9nRmlsZUNvbnN0YW50c1wiO1xyXG5pbXBvcnQgVSBmcm9tIFwiLi4vZ1V0aWxpdGllc1wiO1xyXG5cclxuXHJcbmNvbnN0IGdldEZyYWdtZW50RmlsZSA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudFxyXG4pOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgc3RhdGUubG9hZGluZyA9IHRydWU7XHJcbiAgICB3aW5kb3cuVHJlZVNvbHZlLnNjcmVlbi5oaWRlQmFubmVyID0gdHJ1ZTtcclxuICAgIGNvbnN0IGZyYWdtZW50UGF0aCA9IGAke29wdGlvbi5zZWN0aW9uPy5vdXRsaW5lPy5wYXRofS8ke29wdGlvbi5pZH0ke2dGaWxlQ29uc3RhbnRzLmZyYWdtZW50RmlsZUV4dGVuc2lvbn1gO1xyXG5cclxuICAgIHJldHVybiBbXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgZ0ZyYWdtZW50RWZmZWN0cy5nZXRGcmFnbWVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG9wdGlvbixcclxuICAgICAgICAgICAgZnJhZ21lbnRQYXRoXHJcbiAgICAgICAgKVxyXG4gICAgXTtcclxufTtcclxuXHJcbmNvbnN0IHByb2Nlc3NDaGFpbkZyYWdtZW50VHlwZSA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50LFxyXG4gICAgb3V0bGluZU5vZGU6IElSZW5kZXJPdXRsaW5lTm9kZSxcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsXHJcbik6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICBpZiAoZnJhZ21lbnQpIHtcclxuXHJcbiAgICAgICAgaWYgKG91dGxpbmVOb2RlLmkgIT09IGZyYWdtZW50LmlkKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gZnJhZ21lbnQgaWQgYW5kIG91dGxpbmUgZnJhZ21lbnQgaWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvdXRsaW5lTm9kZS50eXBlID09PSBPdXRsaW5lVHlwZS5MaW5rKSB7XHJcblxyXG4gICAgICAgICAgICBwcm9jZXNzTGluayhcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgc2VnbWVudCxcclxuICAgICAgICAgICAgICAgIG91dGxpbmVOb2RlLFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3V0bGluZU5vZGUudHlwZSA9PT0gT3V0bGluZVR5cGUuRXhpdCkge1xyXG5cclxuICAgICAgICAgICAgcHJvY2Vzc0V4aXQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHNlZ21lbnQsXHJcbiAgICAgICAgICAgICAgICBvdXRsaW5lTm9kZSxcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG91dGxpbmVOb2RlLmlzQ2hhcnQgPT09IHRydWVcclxuICAgICAgICAgICAgJiYgb3V0bGluZU5vZGUuaXNSb290ID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBwcm9jZXNzQ2hhcnRSb290KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3V0bGluZU5vZGUuaXNMYXN0ID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBwcm9jZXNzTGFzdChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgc2VnbWVudCxcclxuICAgICAgICAgICAgICAgIG91dGxpbmVOb2RlLFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob3V0bGluZU5vZGUudHlwZSA9PT0gT3V0bGluZVR5cGUuTm9kZSkge1xyXG5cclxuICAgICAgICAgICAgcHJvY2Vzc05vZGUoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIHNlZ21lbnQsXHJcbiAgICAgICAgICAgICAgICBvdXRsaW5lTm9kZSxcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgZnJhZ21lbnQgdHlwZS4nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbn07XHJcblxyXG5jb25zdCBjaGVja0Zvckxhc3RGcmFnbWVudEVycm9ycyA9IChcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICBvdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlLFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoIXNlZ21lbnQuc2VnbWVudFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBzZWN0aW9uIHdhcyBudWxsIC0gbGFzdFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3V0bGluZU5vZGUuaSAhPT0gZnJhZ21lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNtYXRjaCBiZXR3ZWVuIG91dGxpbmUgbm9kZSBpZCBhbmQgZnJhZ21lbnQgaWQnKTtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IGNoZWNrRm9yTm9kZUVycm9ycyA9IChcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICBvdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlLFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoIXNlZ21lbnQuc2VnbWVudFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VnbWVudCBzZWN0aW9uIHdhcyBudWxsIC0gbm9kZVwiKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50LmlLZXkpKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzbWF0Y2ggYmV0d2VlbiBmcmFnbWVudCBhbmQgb3V0bGluZSBub2RlIC0gbGluaycpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50LmlFeGl0S2V5KSkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gZnJhZ21lbnQgYW5kIG91dGxpbmUgbm9kZSAtIGV4aXQnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3V0bGluZU5vZGUuaSAhPT0gZnJhZ21lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNtYXRjaCBiZXR3ZWVuIG91dGxpbmUgbm9kZSBpZCBhbmQgZnJhZ21lbnQgaWQnKTtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IGNoZWNrRm9yQ2hhcnRSb290RXJyb3JzID0gKFxyXG4gICAgc2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgaWYgKCFzZWdtZW50LnNlZ21lbnRTZWN0aW9uKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgc2VjdGlvbiB3YXMgbnVsbCAtIHJvb3RcIik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudC5pS2V5KSkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gZnJhZ21lbnQgYW5kIG91dGxpbmUgcm9vdCAtIGxpbmsnKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCFVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudC5pRXhpdEtleSkpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNtYXRjaCBiZXR3ZWVuIGZyYWdtZW50IGFuZCBvdXRsaW5lIHJvb3QgLSBleGl0Jyk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5jb25zdCBjaGVja0ZvckV4aXRFcnJvcnMgPSAoXHJcbiAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50LFxyXG4gICAgb3V0bGluZU5vZGU6IElSZW5kZXJPdXRsaW5lTm9kZSxcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgaWYgKCFzZWdtZW50LnNlZ21lbnRTZWN0aW9uKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgc2VjdGlvbiB3YXMgbnVsbCAtIGV4aXRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFzZWdtZW50LnNlZ21lbnRPdXRTZWN0aW9uKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgb3V0IHNlY3Rpb24gd2FzIG51bGwgLSBleGl0XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudC5leGl0S2V5KSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gZnJhZ21lbnQgYW5kIG91dGxpbmUgLSBleGl0Jyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChzZWdtZW50LmVuZC50eXBlICE9PSBPdXRsaW5lVHlwZS5FeGl0KSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzbWF0Y2ggYmV0d2VlbiBmcmFnbWVudCBhbmQgb3V0bGluZSBub2RlIC0gZXhpdCcpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvdXRsaW5lTm9kZS5pICE9PSBmcmFnbWVudC5pZCkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gb3V0bGluZSBub2RlIGlkIGFuZCBmcmFnbWVudCBpZCcpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgcHJvY2Vzc0NoYXJ0Um9vdCA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50LFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBjaGVja0ZvckNoYXJ0Um9vdEVycm9ycyhcclxuICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgIGZyYWdtZW50XHJcbiAgICApO1xyXG5cclxuICAgIGdGcmFnbWVudENvZGUubG9hZE5leHRDaGFpbkZyYWdtZW50KFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIHNlZ21lbnRcclxuICAgICk7XHJcblxyXG4gICAgc2V0TGlua3NSb290KFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIHNlZ21lbnQsXHJcbiAgICAgICAgZnJhZ21lbnRcclxuICAgICk7XHJcbn07XHJcblxyXG5jb25zdCBzZXRMaW5rc1Jvb3QgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgc2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgY29uc3QgaW5TZWN0aW9uID0gc2VnbWVudC5zZWdtZW50SW5TZWN0aW9uO1xyXG5cclxuICAgIGlmICghaW5TZWN0aW9uKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgaW4gc2VjdGlvbiB3YXMgbnVsbCAtIGNoYXJ0IHJvb3RcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgc2VjdGlvbiA9IHNlZ21lbnQuc2VnbWVudFNlY3Rpb247XHJcblxyXG4gICAgaWYgKCFzZWN0aW9uKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgc2VjdGlvbiB3YXMgbnVsbCAtIGNoYXJ0IHJvb3RcIik7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHBhcmVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX2NoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgaW5TZWN0aW9uLmxpbmtJRCxcclxuICAgICAgICBzZWdtZW50LnN0YXJ0LmtleVxyXG4gICAgKTtcclxuXHJcbiAgICBpZiAocGFyZW50Py5saW5rKSB7XHJcblxyXG4gICAgICAgIGlmIChwYXJlbnQuaWQgPT09IGZyYWdtZW50LmlkKSB7XHJcblxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXJlbnQgYW5kIEZyYWdtZW50IGFyZSB0aGUgc2FtZVwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhcmVudC5saW5rLnJvb3QgPSBmcmFnbWVudDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXJlbnRGcmFnbWVudCB3YXMgbnVsbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBzZWN0aW9uLmN1cnJlbnQgPSBmcmFnbWVudDtcclxufTtcclxuXHJcbmNvbnN0IHByb2Nlc3NOb2RlID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICBvdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlLFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBjaGVja0Zvck5vZGVFcnJvcnMoXHJcbiAgICAgICAgc2VnbWVudCxcclxuICAgICAgICBvdXRsaW5lTm9kZSxcclxuICAgICAgICBmcmFnbWVudFxyXG4gICAgKTtcclxuXHJcbiAgICBnRnJhZ21lbnRDb2RlLmxvYWROZXh0Q2hhaW5GcmFnbWVudChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBzZWdtZW50XHJcbiAgICApO1xyXG5cclxuICAgIHByb2Nlc3NGcmFnbWVudChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBmcmFnbWVudFxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IHByb2Nlc3NMYXN0ID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICBvdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlLFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBjaGVja0Zvckxhc3RGcmFnbWVudEVycm9ycyhcclxuICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgIG91dGxpbmVOb2RlLFxyXG4gICAgICAgIGZyYWdtZW50XHJcbiAgICApO1xyXG5cclxuICAgIHByb2Nlc3NGcmFnbWVudChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBmcmFnbWVudFxyXG4gICAgKTtcclxuXHJcbiAgICBmcmFnbWVudC5saW5rID0gbnVsbDtcclxuICAgIGZyYWdtZW50LnNlbGVjdGVkID0gbnVsbDtcclxuXHJcbiAgICBpZiAoZnJhZ21lbnQub3B0aW9ucz8ubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLnJlc2V0RnJhZ21lbnRVaXMoc3RhdGUpO1xyXG4gICAgICAgIGZyYWdtZW50LnVpLmZyYWdtZW50T3B0aW9uc0V4cGFuZGVkID0gdHJ1ZTtcclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS51aS5vcHRpb25zRXhwYW5kZWQgPSB0cnVlO1xyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgcHJvY2Vzc0xpbmsgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgc2VnbWVudDogSUNoYWluU2VnbWVudCxcclxuICAgIG91dGxpbmVOb2RlOiBJUmVuZGVyT3V0bGluZU5vZGUsXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGlmIChvdXRsaW5lTm9kZS5pICE9PSBmcmFnbWVudC5pZCkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc21hdGNoIGJldHdlZW4gb3V0bGluZSBub2RlIGlkIGFuZCBmcmFnbWVudCBpZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IG91dGxpbmUgPSBmcmFnbWVudC5zZWN0aW9uLm91dGxpbmU7XHJcblxyXG4gICAgaWYgKCFvdXRsaW5lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvdXRsaW5lTm9kZT8uYyA9PSBudWxsKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvdXRsaW5lTm9kZS5pc1Jvb3QgPT09IHRydWVcclxuICAgICAgICAmJiBvdXRsaW5lTm9kZS5pc0NoYXJ0ID09PSB0cnVlXHJcbiAgICApIHtcclxuICAgICAgICBzZXRMaW5rc1Jvb3QoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgICAgICBmcmFnbWVudFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3Qgb3V0bGluZUNoYXJ0ID0gZ091dGxpbmVDb2RlLmdldE91dGxpbmVDaGFydChcclxuICAgICAgICBvdXRsaW5lLFxyXG4gICAgICAgIG91dGxpbmVOb2RlPy5jXHJcbiAgICApO1xyXG5cclxuICAgIGdPdXRsaW5lQ29kZS5nZXRTZWdtZW50T3V0bGluZV9zdWJzY3JpcHRpb24oXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgb3V0bGluZUNoYXJ0LFxyXG4gICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgIHNlZ21lbnQuaW5kZXhcclxuICAgICk7XHJcbn07XHJcblxyXG5jb25zdCBwcm9jZXNzRXhpdCA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50LFxyXG4gICAgb3V0bGluZU5vZGU6IElSZW5kZXJPdXRsaW5lTm9kZSxcclxuICAgIGV4aXRGcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGNoZWNrRm9yRXhpdEVycm9ycyhcclxuICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgIG91dGxpbmVOb2RlLFxyXG4gICAgICAgIGV4aXRGcmFnbWVudFxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBzZWN0aW9uOiBJRGlzcGxheUNoYXJ0ID0gZXhpdEZyYWdtZW50LnNlY3Rpb24gYXMgSURpc3BsYXlDaGFydDtcclxuICAgIGNvbnN0IHNlY3Rpb25QYXJlbnQgPSBzZWN0aW9uLnBhcmVudDtcclxuXHJcbiAgICBpZiAoIXNlY3Rpb25QYXJlbnQpIHtcclxuXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSURpc3BsYXlDaGFydCBwYXJlbnQgaXMgbnVsbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBpRXhpdEtleSA9IGV4aXRGcmFnbWVudC5leGl0S2V5O1xyXG5cclxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHNlY3Rpb25QYXJlbnQub3B0aW9ucykge1xyXG5cclxuICAgICAgICBpZiAob3B0aW9uLmlFeGl0S2V5ID09PSBpRXhpdEtleSkge1xyXG5cclxuICAgICAgICAgICAgZ1NlZ21lbnRDb2RlLmxvYWRFeGl0U2VnbWVudChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgc2VnbWVudC5pbmRleCxcclxuICAgICAgICAgICAgICAgIG9wdGlvbi5pZFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgZ0ZyYWdtZW50Q29kZS5zZXRDdXJyZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBleGl0RnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5jb25zdCBsb2FkRnJhZ21lbnQgPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgcmVzcG9uc2U6IGFueSxcclxuICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50XHJcbik6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPT4ge1xyXG5cclxuICAgIGNvbnN0IHBhcmVudEZyYWdtZW50SUQgPSBvcHRpb24ucGFyZW50RnJhZ21lbnRJRCBhcyBzdHJpbmc7XHJcblxyXG4gICAgaWYgKFUuaXNOdWxsT3JXaGl0ZVNwYWNlKHBhcmVudEZyYWdtZW50SUQpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcmVudCBmcmFnbWVudCBJRCBpcyBudWxsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlbmRlckZyYWdtZW50ID0gZ0ZyYWdtZW50Q29kZS5wYXJzZUFuZExvYWRGcmFnbWVudChcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICByZXNwb25zZS50ZXh0RGF0YSxcclxuICAgICAgICBwYXJlbnRGcmFnbWVudElELFxyXG4gICAgICAgIG9wdGlvbi5pZCxcclxuICAgICAgICBvcHRpb24uc2VjdGlvblxyXG4gICAgKTtcclxuXHJcbiAgICBzdGF0ZS5sb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgcmV0dXJuIHJlbmRlckZyYWdtZW50O1xyXG59O1xyXG5cclxuY29uc3QgbG9hZFBvZEZyYWdtZW50ID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIHJlc3BvbnNlOiBhbnksXHJcbiAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudFxyXG4pOiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0+IHtcclxuXHJcbiAgICBjb25zdCBwYXJlbnRGcmFnbWVudElEID0gb3B0aW9uLnBhcmVudEZyYWdtZW50SUQgYXMgc3RyaW5nO1xyXG5cclxuICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShwYXJlbnRGcmFnbWVudElEKSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXJlbnQgZnJhZ21lbnQgSUQgaXMgbnVsbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZW5kZXJGcmFnbWVudCA9IGdGcmFnbWVudENvZGUucGFyc2VBbmRMb2FkUG9kRnJhZ21lbnQoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgcmVzcG9uc2UudGV4dERhdGEsXHJcbiAgICAgICAgcGFyZW50RnJhZ21lbnRJRCxcclxuICAgICAgICBvcHRpb24uaWQsXHJcbiAgICAgICAgb3B0aW9uLnNlY3Rpb25cclxuICAgICk7XHJcblxyXG4gICAgc3RhdGUubG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgIHJldHVybiByZW5kZXJGcmFnbWVudDtcclxufTtcclxuXHJcbmNvbnN0IHByb2Nlc3NGcmFnbWVudCA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGlmICghc3RhdGUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGV4cGFuZGVkT3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICBsZXQgcGFyZW50RnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9jaGFpbkZyYWdtZW50KFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIGZyYWdtZW50LnNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgIGZyYWdtZW50LnBhcmVudEZyYWdtZW50SURcclxuICAgICk7XHJcblxyXG4gICAgaWYgKCFwYXJlbnRGcmFnbWVudCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBwYXJlbnRGcmFnbWVudC5vcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb24uaWQgPT09IGZyYWdtZW50LmlkKSB7XHJcblxyXG4gICAgICAgICAgICBleHBhbmRlZE9wdGlvbiA9IG9wdGlvbjtcclxuXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXhwYW5kZWRPcHRpb24pIHtcclxuXHJcbiAgICAgICAgZXhwYW5kZWRPcHRpb24udWkuZnJhZ21lbnRPcHRpb25zRXhwYW5kZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLnNob3dPcHRpb25Ob2RlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcGFyZW50RnJhZ21lbnQsXHJcbiAgICAgICAgICAgIGV4cGFuZGVkT3B0aW9uXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IGdGcmFnbWVudEFjdGlvbnMgPSB7XHJcblxyXG4gICAgc2hvd0FuY2lsbGFyeU5vZGU6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIC8vIHBhcmVudEZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgYW5jaWxsYXJ5OiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgLy8gaWYgKGFuY2lsbGFyeS51aS5kaXNjdXNzaW9uTG9hZGVkID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIC8vICAgICBnRnJhZ21lbnRDb2RlLmF1dG9FeHBhbmRTaW5nbGVCbGFua09wdGlvbihcclxuICAgICAgICAvLyAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgIC8vICAgICAgICAgYW5jaWxsYXJ5XHJcbiAgICAgICAgLy8gICAgICk7XHJcblxyXG4gICAgICAgIC8vICAgICBpZiAoIWFuY2lsbGFyeS5saW5rKSB7XHJcblxyXG4gICAgICAgIC8vICAgICAgICAgZ091dGxpbmVDb2RlLmdldEZyYWdtZW50TGlua0NoYXJ0T3V0bGluZShcclxuICAgICAgICAvLyAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAvLyAgICAgICAgICAgICBhbmNpbGxhcnlcclxuICAgICAgICAvLyAgICAgICAgICk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuXHJcbiAgICAgICAgLy8gICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdldEZyYWdtZW50RmlsZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGFuY2lsbGFyeVxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNob3dPcHRpb25Ob2RlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBwYXJlbnRGcmFnbWVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIC8vIGZvciAoY29uc3QgY2hpbGQgb2YgcGFyZW50RnJhZ21lbnQub3B0aW9ucykge1xyXG5cclxuICAgICAgICAvLyAgICAgY2hpbGQudWkuZGlzY3Vzc2lvbkxvYWRlZCA9IGZhbHNlO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jbGVhclBhcmVudFNlY3Rpb25TZWxlY3RlZChwYXJlbnRGcmFnbWVudC5zZWN0aW9uKTtcclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNsZWFyT3JwaGFuZWRTdGVwcyhwYXJlbnRGcmFnbWVudCk7XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUucHJlcGFyZVRvU2hvd09wdGlvbk5vZGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBpZiAob3B0aW9uLnVpLmRpc2N1c3Npb25Mb2FkZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgLy8gICAgIGdGcmFnbWVudENvZGUuYXV0b0V4cGFuZFNpbmdsZUJsYW5rT3B0aW9uKFxyXG4gICAgICAgIC8vICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgLy8gICAgICAgICBvcHRpb25cclxuICAgICAgICAvLyAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gICAgIGlmICghb3B0aW9uLmxpbmspIHtcclxuXHJcbiAgICAgICAgLy8gICAgICAgICBnT3V0bGluZUNvZGUuZ2V0RnJhZ21lbnRMaW5rQ2hhcnRPdXRsaW5lKFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgIC8vICAgICAgICAgKTtcclxuICAgICAgICAvLyAgICAgfVxyXG5cclxuICAgICAgICAvLyAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4gZ2V0RnJhZ21lbnRGaWxlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZEZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByZXNwb25zZTogYW55LFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiBJU3RhdGUgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlXHJcbiAgICAgICAgICAgIHx8IFUuaXNOdWxsT3JXaGl0ZVNwYWNlKG9wdGlvbi5pZClcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9hZEZyYWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkRnJhZ21lbnRBbmRTZXRTZWxlY3RlZDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgcmVzcG9uc2U6IGFueSxcclxuICAgICAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICBvcHRpb25UZXh0OiBzdHJpbmcgfCBudWxsID0gbnVsbFxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBub2RlID0gbG9hZEZyYWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgIG9wdGlvblxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChub2RlKSB7XHJcblxyXG4gICAgICAgICAgICBnRnJhZ21lbnRDb2RlLnNldEN1cnJlbnQoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIG5vZGVcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25UZXh0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbm9kZS5vcHRpb24gPSBvcHRpb25UZXh0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXN0YXRlLnJlbmRlclN0YXRlLmlzQ2hhaW5Mb2FkKSB7XHJcblxyXG4gICAgICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5yZWZyZXNoVXJsID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkUG9kRnJhZ21lbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIHJlc3BvbnNlOiBhbnksXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgb3B0aW9uVGV4dDogc3RyaW5nIHwgbnVsbCA9IG51bGxcclxuICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFzdGF0ZSkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IGxvYWRQb2RGcmFnbWVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlLFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAobm9kZSkge1xyXG5cclxuICAgICAgICAgICAgZ0ZyYWdtZW50Q29kZS5zZXRQb2RDdXJyZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBub2RlXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAob3B0aW9uVGV4dCkge1xyXG5cclxuICAgICAgICAgICAgICAgIG5vZGUub3B0aW9uID0gb3B0aW9uVGV4dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFzdGF0ZS5yZW5kZXJTdGF0ZS5pc0NoYWluTG9hZCkge1xyXG5cclxuICAgICAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUucmVmcmVzaFVybCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZFJvb3RGcmFnbWVudEFuZFNldFNlbGVjdGVkOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByZXNwb25zZTogYW55LFxyXG4gICAgICAgIHNlY3Rpb246IElEaXNwbGF5U2VjdGlvblxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG91dGxpbmVOb2RlSUQgPSBzZWN0aW9uLm91dGxpbmU/LnIuaTtcclxuXHJcbiAgICAgICAgaWYgKCFvdXRsaW5lTm9kZUlEKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByZW5kZXJGcmFnbWVudCA9IGdGcmFnbWVudENvZGUucGFyc2VBbmRMb2FkRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByZXNwb25zZS50ZXh0RGF0YSxcclxuICAgICAgICAgICAgXCJyb290XCIsXHJcbiAgICAgICAgICAgIG91dGxpbmVOb2RlSUQsXHJcbiAgICAgICAgICAgIHNlY3Rpb24sXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc3RhdGUubG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAocmVuZGVyRnJhZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgIHJlbmRlckZyYWdtZW50LnNlY3Rpb24ucm9vdCA9IHJlbmRlckZyYWdtZW50O1xyXG4gICAgICAgICAgICByZW5kZXJGcmFnbWVudC5zZWN0aW9uLmN1cnJlbnQgPSByZW5kZXJGcmFnbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLnJlZnJlc2hVcmwgPSB0cnVlO1xyXG5cclxuICAgICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgbG9hZFBvZFJvb3RGcmFnbWVudDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgcmVzcG9uc2U6IGFueSxcclxuICAgICAgICBzZWN0aW9uOiBJRGlzcGxheVNlY3Rpb25cclxuICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFzdGF0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBvdXRsaW5lTm9kZUlEID0gc2VjdGlvbi5vdXRsaW5lPy5yLmk7XHJcblxyXG4gICAgICAgIGlmICghb3V0bGluZU5vZGVJRCkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVuZGVyRnJhZ21lbnQgPSBnRnJhZ21lbnRDb2RlLnBhcnNlQW5kTG9hZFBvZEZyYWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmVzcG9uc2UudGV4dERhdGEsXHJcbiAgICAgICAgICAgIFwicm9vdFwiLFxyXG4gICAgICAgICAgICBvdXRsaW5lTm9kZUlELFxyXG4gICAgICAgICAgICBzZWN0aW9uLFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHN0YXRlLmxvYWRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKHJlbmRlckZyYWdtZW50KSB7XHJcblxyXG4gICAgICAgICAgICByZW5kZXJGcmFnbWVudC5zZWN0aW9uLnJvb3QgPSByZW5kZXJGcmFnbWVudDtcclxuICAgICAgICAgICAgcmVuZGVyRnJhZ21lbnQuc2VjdGlvbi5jdXJyZW50ID0gcmVuZGVyRnJhZ21lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5yZWZyZXNoVXJsID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRDaGFpbkZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByZXNwb25zZTogYW55LFxyXG4gICAgICAgIHNlZ21lbnQ6IElDaGFpblNlZ21lbnQsXHJcbiAgICAgICAgb3V0bGluZU5vZGU6IElSZW5kZXJPdXRsaW5lTm9kZVxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzZWdtZW50U2VjdGlvbiA9IHNlZ21lbnQuc2VnbWVudFNlY3Rpb247XHJcblxyXG4gICAgICAgIGlmICghc2VnbWVudFNlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlZ21lbnQgc2VjdGlvbiBpcyBudWxsXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHBhcmVudEZyYWdtZW50SUQgPSBvdXRsaW5lTm9kZS5wYXJlbnQ/LmkgYXMgc3RyaW5nO1xyXG5cclxuICAgICAgICBpZiAob3V0bGluZU5vZGUuaXNSb290ID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIW91dGxpbmVOb2RlLmlzQ2hhcnQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBwYXJlbnRGcmFnbWVudElEID0gXCJndWlkZVJvb3RcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudEZyYWdtZW50SUQgPSBcInJvb3RcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShwYXJlbnRGcmFnbWVudElEKSA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGFyZW50IGZyYWdtZW50IElEIGlzIG51bGxcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQ6IHsgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCwgY29udGludWVMb2FkaW5nOiBib29sZWFuIH0gPSBnRnJhZ21lbnRDb2RlLnBhcnNlQW5kTG9hZEZyYWdtZW50QmFzZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlLnRleHREYXRhLFxyXG4gICAgICAgICAgICBwYXJlbnRGcmFnbWVudElELFxyXG4gICAgICAgICAgICBvdXRsaW5lTm9kZS5pLFxyXG4gICAgICAgICAgICBzZWdtZW50U2VjdGlvbixcclxuICAgICAgICAgICAgc2VnbWVudC5pbmRleFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IGZyYWdtZW50ID0gcmVzdWx0LmZyYWdtZW50O1xyXG4gICAgICAgIHN0YXRlLmxvYWRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKGZyYWdtZW50KSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgcGFyZW50RnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9jaGFpbkZyYWdtZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBzZWdtZW50U2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgICAgICBwYXJlbnRGcmFnbWVudElEXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBzZWdtZW50U2VjdGlvbi5jdXJyZW50ID0gZnJhZ21lbnQ7XHJcblxyXG4gICAgICAgICAgICBpZiAocGFyZW50RnJhZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocGFyZW50RnJhZ21lbnQuaWQgPT09IGZyYWdtZW50LmlkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhcmVudEZyYWdtZW50IGFuZCBGcmFnbWVudCBhcmUgdGhlIHNhbWVcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcGFyZW50RnJhZ21lbnQuc2VsZWN0ZWQgPSBmcmFnbWVudDtcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50LnVpLnNlY3Rpb25JbmRleCA9IHBhcmVudEZyYWdtZW50LnVpLnNlY3Rpb25JbmRleCArIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9jZXNzQ2hhaW5GcmFnbWVudFR5cGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgICAgICBvdXRsaW5lTm9kZSxcclxuICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICApO1xyXG4gICAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGdGcmFnbWVudEFjdGlvbnM7XHJcbiIsImltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5cclxuXHJcbmNvbnN0IGdIb29rUmVnaXN0cnlDb2RlID0ge1xyXG5cclxuICAgIGV4ZWN1dGVTdGVwSG9vazogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgc3RlcDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghd2luZG93Lkhvb2tSZWdpc3RyeSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aW5kb3cuSG9va1JlZ2lzdHJ5LmV4ZWN1dGVTdGVwSG9vayhcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHN0ZXBcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ0hvb2tSZWdpc3RyeUNvZGU7XHJcblxyXG4iLCJpbXBvcnQgeyBQYXJzZVR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9QYXJzZVR5cGVcIjtcclxuaW1wb3J0IElEaXNwbGF5Q2hhcnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheUNoYXJ0XCI7XHJcbmltcG9ydCBJRGlzcGxheVNlY3Rpb24gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvZGlzcGxheS9JRGlzcGxheVNlY3Rpb25cIjtcclxuaW1wb3J0IElTdGF0ZSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVcIjtcclxuaW1wb3J0IElTdGF0ZUFueUFycmF5IGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZUFueUFycmF5XCI7XHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgSVJlbmRlck91dGxpbmVOb2RlIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyT3V0bGluZU5vZGVcIjtcclxuaW1wb3J0IElDaGFpblNlZ21lbnQgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvc2VnbWVudHMvSUNoYWluU2VnbWVudFwiO1xyXG5pbXBvcnQgUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uL3N0YXRlL3JlbmRlci9SZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgZ0ZyYWdtZW50QWN0aW9ucyBmcm9tIFwiLi4vYWN0aW9ucy9nRnJhZ21lbnRBY3Rpb25zXCI7XHJcbmltcG9ydCBnRmlsZUNvbnN0YW50cyBmcm9tIFwiLi4vZ0ZpbGVDb25zdGFudHNcIjtcclxuaW1wb3J0IFUgZnJvbSBcIi4uL2dVdGlsaXRpZXNcIjtcclxuaW1wb3J0IGdIaXN0b3J5Q29kZSBmcm9tIFwiLi9nSGlzdG9yeUNvZGVcIjtcclxuaW1wb3J0IGdIb29rUmVnaXN0cnlDb2RlIGZyb20gXCIuL2dIb29rUmVnaXN0cnlDb2RlXCI7XHJcbmltcG9ydCBnT3V0bGluZUNvZGUgZnJvbSBcIi4vZ091dGxpbmVDb2RlXCI7XHJcbmltcG9ydCBnU2VnbWVudENvZGUgZnJvbSBcIi4vZ1NlZ21lbnRDb2RlXCI7XHJcbmltcG9ydCBnU3RhdGVDb2RlIGZyb20gXCIuL2dTdGF0ZUNvZGVcIjtcclxuXHJcblxyXG5jb25zdCBnZXRWYXJpYWJsZVZhbHVlID0gKFxyXG4gICAgc2VjdGlvbjogSURpc3BsYXlTZWN0aW9uLFxyXG4gICAgdmFyaWFibGVWYWx1ZXM6IGFueSxcclxuICAgIHZhcmlhYmxlTmFtZTogc3RyaW5nXHJcbik6IHN0cmluZyB8IG51bGwgPT4ge1xyXG5cclxuICAgIGxldCB2YWx1ZSA9IHZhcmlhYmxlVmFsdWVzW3ZhcmlhYmxlTmFtZV07XHJcblxyXG4gICAgaWYgKHZhbHVlKSB7XHJcblxyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBzZWN0aW9uLm91dGxpbmU/Lm12Py5bdmFyaWFibGVOYW1lXTtcclxuXHJcbiAgICBpZiAoY3VycmVudFZhbHVlKSB7XHJcblxyXG4gICAgICAgIHZhcmlhYmxlVmFsdWVzW3ZhcmlhYmxlTmFtZV0gPSBjdXJyZW50VmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QW5jZXN0b3JWYXJpYWJsZVZhbHVlKFxyXG4gICAgICAgIHNlY3Rpb24sXHJcbiAgICAgICAgdmFyaWFibGVWYWx1ZXMsXHJcbiAgICAgICAgdmFyaWFibGVOYW1lXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiB2YXJpYWJsZVZhbHVlc1t2YXJpYWJsZU5hbWVdID8/IG51bGw7XHJcbn07XHJcblxyXG5jb25zdCBnZXRBbmNlc3RvclZhcmlhYmxlVmFsdWUgPSAoXHJcbiAgICBzZWN0aW9uOiBJRGlzcGxheVNlY3Rpb24sXHJcbiAgICB2YXJpYWJsZVZhbHVlczogYW55LFxyXG4gICAgdmFyaWFibGVOYW1lOiBzdHJpbmdcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgY29uc3QgY2hhcnQgPSBzZWN0aW9uIGFzIElEaXNwbGF5Q2hhcnQ7XHJcbiAgICBjb25zdCBwYXJlbnQgPSBjaGFydC5wYXJlbnQ/LnNlY3Rpb247XHJcblxyXG4gICAgaWYgKCFwYXJlbnQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGFyZW50VmFsdWUgPSBwYXJlbnQub3V0bGluZT8ubXY/Llt2YXJpYWJsZU5hbWVdO1xyXG5cclxuICAgIGlmIChwYXJlbnRWYWx1ZSkge1xyXG5cclxuICAgICAgICB2YXJpYWJsZVZhbHVlc1t2YXJpYWJsZU5hbWVdID0gcGFyZW50VmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QW5jZXN0b3JWYXJpYWJsZVZhbHVlKFxyXG4gICAgICAgIHBhcmVudCxcclxuICAgICAgICB2YXJpYWJsZVZhbHVlcyxcclxuICAgICAgICB2YXJpYWJsZU5hbWVcclxuICAgICk7XHJcbn07XHJcblxyXG5jb25zdCBjaGVja0ZvclZhcmlhYmxlcyA9IChmcmFnbWVudDogSVJlbmRlckZyYWdtZW50KTogdm9pZCA9PiB7XHJcblxyXG4gICAgY29uc3QgdmFsdWUgPSBmcmFnbWVudC52YWx1ZTtcclxuICAgIGNvbnN0IHZhcmlhYmxlUmVmUGF0dGVybiA9IC/jgIjCpuKAuSg/PHZhcmlhYmxlTmFtZT5bXuKAusKmXSsp4oC6wqbjgIkvZ211O1xyXG4gICAgY29uc3QgbWF0Y2hlcyA9IHZhbHVlLm1hdGNoQWxsKHZhcmlhYmxlUmVmUGF0dGVybik7XHJcbiAgICBsZXQgdmFyaWFibGVOYW1lOiBzdHJpbmc7XHJcbiAgICBsZXQgdmFyaWFibGVWYWx1ZXM6IGFueSA9IHt9O1xyXG4gICAgbGV0IHJlc3VsdCA9ICcnO1xyXG4gICAgbGV0IG1hcmtlciA9IDA7XHJcblxyXG4gICAgZm9yIChjb25zdCBtYXRjaCBvZiBtYXRjaGVzKSB7XHJcblxyXG4gICAgICAgIGlmIChtYXRjaFxyXG4gICAgICAgICAgICAmJiBtYXRjaC5ncm91cHNcclxuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGVxZXFlcVxyXG4gICAgICAgICAgICAmJiBtYXRjaC5pbmRleCAhPSBudWxsXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHZhcmlhYmxlTmFtZSA9IG1hdGNoLmdyb3Vwcy52YXJpYWJsZU5hbWU7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB2YXJpYWJsZVZhbHVlID0gZ2V0VmFyaWFibGVWYWx1ZShcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50LnNlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICB2YXJpYWJsZVZhbHVlcyxcclxuICAgICAgICAgICAgICAgIHZhcmlhYmxlTmFtZVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF2YXJpYWJsZVZhbHVlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBWYXJpYWJsZTogJHt2YXJpYWJsZU5hbWV9IGNvdWxkIG5vdCBiZSBmb3VuZGApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQgK1xyXG4gICAgICAgICAgICAgICAgdmFsdWUuc3Vic3RyaW5nKG1hcmtlciwgbWF0Y2guaW5kZXgpICtcclxuICAgICAgICAgICAgICAgIHZhcmlhYmxlVmFsdWU7XHJcblxyXG4gICAgICAgICAgICBtYXJrZXIgPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVzdWx0ID0gcmVzdWx0ICtcclxuICAgICAgICB2YWx1ZS5zdWJzdHJpbmcobWFya2VyLCB2YWx1ZS5sZW5ndGgpO1xyXG5cclxuICAgIGZyYWdtZW50LnZhbHVlID0gcmVzdWx0O1xyXG59O1xyXG5cclxuY29uc3QgY2xlYXJTaWJsaW5nQ2hhaW5zID0gKFxyXG4gICAgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHBhcmVudC5vcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb24uaWQgIT09IGZyYWdtZW50LmlkKSB7XHJcblxyXG4gICAgICAgICAgICBjbGVhckZyYWdtZW50Q2hhaW5zKG9wdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuY29uc3QgY2xlYXJGcmFnbWVudENoYWlucyA9IChmcmFnbWVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCk6IHZvaWQgPT4ge1xyXG5cclxuICAgIGlmICghZnJhZ21lbnQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJGcmFnbWVudENoYWlucyhmcmFnbWVudC5saW5rPy5yb290KTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBmcmFnbWVudC5vcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGNsZWFyRnJhZ21lbnRDaGFpbnMob3B0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBmcmFnbWVudC5zZWxlY3RlZCA9IG51bGw7XHJcblxyXG4gICAgaWYgKGZyYWdtZW50Lmxpbms/LnJvb3QpIHtcclxuXHJcbiAgICAgICAgZnJhZ21lbnQubGluay5yb290LnNlbGVjdGVkID0gbnVsbDtcclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IGxvYWRPcHRpb24gPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgcmF3T3B0aW9uOiBhbnksXHJcbiAgICBvdXRsaW5lTm9kZTogSVJlbmRlck91dGxpbmVOb2RlIHwgbnVsbCxcclxuICAgIHNlY3Rpb246IElEaXNwbGF5U2VjdGlvbixcclxuICAgIHBhcmVudEZyYWdtZW50SUQ6IHN0cmluZyxcclxuICAgIHNlZ21lbnRJbmRleDogbnVtYmVyIHwgbnVsbFxyXG4pOiBJUmVuZGVyRnJhZ21lbnQgPT4ge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbiA9IG5ldyBSZW5kZXJGcmFnbWVudChcclxuICAgICAgICByYXdPcHRpb24uaWQsXHJcbiAgICAgICAgcGFyZW50RnJhZ21lbnRJRCxcclxuICAgICAgICBzZWN0aW9uLFxyXG4gICAgICAgIHNlZ21lbnRJbmRleFxyXG4gICAgKTtcclxuXHJcbiAgICBvcHRpb24ub3B0aW9uID0gcmF3T3B0aW9uLm9wdGlvbiA/PyAnJztcclxuICAgIG9wdGlvbi5pc0FuY2lsbGFyeSA9IHJhd09wdGlvbi5pc0FuY2lsbGFyeSA9PT0gdHJ1ZTtcclxuICAgIG9wdGlvbi5vcmRlciA9IHJhd09wdGlvbi5vcmRlciA/PyAwO1xyXG4gICAgb3B0aW9uLmlFeGl0S2V5ID0gcmF3T3B0aW9uLmlFeGl0S2V5ID8/ICcnO1xyXG4gICAgb3B0aW9uLmF1dG9NZXJnZUV4aXQgPSByYXdPcHRpb24uYXV0b01lcmdlRXhpdCA9PT0gdHJ1ZTtcclxuICAgIG9wdGlvbi5wb2RLZXkgPSByYXdPcHRpb24ucG9kS2V5ID8/ICcnO1xyXG4gICAgb3B0aW9uLnBvZFRleHQgPSByYXdPcHRpb24ucG9kVGV4dCA/PyAnJztcclxuXHJcbiAgICBpZiAob3V0bGluZU5vZGUpIHtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBvdXRsaW5lT3B0aW9uIG9mIG91dGxpbmVOb2RlLm8pIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChvdXRsaW5lT3B0aW9uLmkgPT09IG9wdGlvbi5pZCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGdTdGF0ZUNvZGUuY2FjaGVfb3V0bGluZU5vZGUoXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0bGluZU9wdGlvblxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnU3RhdGVDb2RlLmNhY2hlX2NoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgb3B0aW9uXHJcbiAgICApO1xyXG5cclxuICAgIGdPdXRsaW5lQ29kZS5nZXRQb2RPdXRsaW5lX3N1YnNjcmlwaW9uKFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIG9wdGlvbixcclxuICAgICAgICBzZWN0aW9uXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiBvcHRpb247XHJcbn07XHJcblxyXG5jb25zdCBzaG93UGx1Z19zdWJzY3JpcHRpb24gPSAoXHJcbiAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgZXhpdDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgb3B0aW9uVGV4dDogc3RyaW5nXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGNvbnN0IHNlY3Rpb246IElEaXNwbGF5Q2hhcnQgPSBleGl0LnNlY3Rpb24gYXMgSURpc3BsYXlDaGFydDtcclxuICAgIGNvbnN0IHBhcmVudCA9IHNlY3Rpb24ucGFyZW50O1xyXG5cclxuICAgIGlmICghcGFyZW50KSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIklEaXNwbGF5Q2hhcnQgcGFyZW50IGlzIG51bGxcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaUV4aXRLZXkgPSBleGl0LmV4aXRLZXk7XHJcblxyXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2YgcGFyZW50Lm9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbi5pRXhpdEtleSA9PT0gaUV4aXRLZXkpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzaG93T3B0aW9uTm9kZV9zdWJzY3JpcHRvbihcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uVGV4dFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmNvbnN0IHNob3dPcHRpb25Ob2RlX3N1YnNjcmlwdG9uID0gKFxyXG4gICAgc3RhdGU6IElTdGF0ZSxcclxuICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgb3B0aW9uVGV4dDogc3RyaW5nIHwgbnVsbCA9IG51bGxcclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgaWYgKCFvcHRpb25cclxuICAgICAgICB8fCAhb3B0aW9uLnNlY3Rpb24/Lm91dGxpbmU/LnBhdGhcclxuICAgICkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBnRnJhZ21lbnRDb2RlLnByZXBhcmVUb1Nob3dPcHRpb25Ob2RlKFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIG9wdGlvblxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBpZiAob3B0aW9uLnVpLmRpc2N1c3Npb25Mb2FkZWQgPT09IHRydWUpIHtcclxuICAgIC8vICAgICByZXR1cm47XHJcbiAgICAvLyB9XHJcblxyXG4gICAgcmV0dXJuIGdGcmFnbWVudENvZGUuZ2V0RnJhZ21lbnRBbmRMaW5rT3V0bGluZV9zdWJzY3JpcGlvbihcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgICBvcHRpb24sXHJcbiAgICAgICAgb3B0aW9uVGV4dCxcclxuICAgICk7XHJcbn07XHJcblxyXG4vLyBjb25zdCBzaG93UG9kT3B0aW9uTm9kZV9zdWJzY3JpcHRvbiA9IChcclxuLy8gICAgIHN0YXRlOiBJU3RhdGUsXHJcbi8vICAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudCxcclxuLy8gICAgIG9wdGlvblRleHQ6IHN0cmluZyB8IG51bGwgPSBudWxsXHJcbi8vICk6IHZvaWQgPT4ge1xyXG5cclxuLy8gICAgIGlmICghb3B0aW9uXHJcbi8vICAgICAgICAgfHwgIW9wdGlvbi5zZWN0aW9uPy5vdXRsaW5lPy5wYXRoXHJcbi8vICAgICApIHtcclxuLy8gICAgICAgICByZXR1cm47XHJcbi8vICAgICB9XHJcblxyXG4vLyAgICAgZ0ZyYWdtZW50Q29kZS5wcmVwYXJlVG9TaG93UG9kT3B0aW9uTm9kZShcclxuLy8gICAgICAgICBzdGF0ZSxcclxuLy8gICAgICAgICBvcHRpb25cclxuLy8gICAgICk7XHJcblxyXG4vLyAgICAgcmV0dXJuIGdGcmFnbWVudENvZGUuZ2V0UG9kRnJhZ21lbnRfc3Vic2NyaXBpb24oXHJcbi8vICAgICAgICAgc3RhdGUsXHJcbi8vICAgICAgICAgb3B0aW9uLFxyXG4vLyAgICAgICAgIG9wdGlvblRleHQsXHJcbi8vICAgICApO1xyXG4vLyB9O1xyXG5cclxuY29uc3QgbG9hZE5leHRGcmFnbWVudEluU2VnbWVudCA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50XHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGNvbnN0IG5leHRPdXRsaW5lTm9kZSA9IGdTZWdtZW50Q29kZS5nZXROZXh0U2VnbWVudE91dGxpbmVOb2RlKFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIHNlZ21lbnRcclxuICAgICk7XHJcblxyXG4gICAgaWYgKCFuZXh0T3V0bGluZU5vZGUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZnJhZ21lbnRGb2xkZXJVcmwgPSBzZWdtZW50LnNlZ21lbnRTZWN0aW9uPy5vdXRsaW5lPy5wYXRoO1xyXG4gICAgY29uc3QgdXJsID0gYCR7ZnJhZ21lbnRGb2xkZXJVcmx9LyR7bmV4dE91dGxpbmVOb2RlLml9JHtnRmlsZUNvbnN0YW50cy5mcmFnbWVudEZpbGVFeHRlbnNpb259YDtcclxuXHJcbiAgICBjb25zdCBsb2FkRGVsZWdhdGUgPSAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBvdXRsaW5lUmVzcG9uc2U6IGFueVxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICByZXR1cm4gZ0ZyYWdtZW50QWN0aW9ucy5sb2FkQ2hhaW5GcmFnbWVudChcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZSxcclxuICAgICAgICAgICAgc2VnbWVudCxcclxuICAgICAgICAgICAgbmV4dE91dGxpbmVOb2RlXHJcbiAgICAgICAgKTtcclxuICAgIH07XHJcblxyXG4gICAgZ1N0YXRlQ29kZS5BZGRSZUxvYWREYXRhRWZmZWN0SW1tZWRpYXRlKFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIGBsb2FkQ2hhaW5GcmFnbWVudGAsXHJcbiAgICAgICAgUGFyc2VUeXBlLkpzb24sXHJcbiAgICAgICAgdXJsLFxyXG4gICAgICAgIGxvYWREZWxlZ2F0ZVxyXG4gICAgKTtcclxufTtcclxuXHJcbmNvbnN0IGdGcmFnbWVudENvZGUgPSB7XHJcblxyXG4gICAgbG9hZE5leHRDaGFpbkZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBzZWdtZW50OiBJQ2hhaW5TZWdtZW50LFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmIChzZWdtZW50Lm91dGxpbmVOb2Rlcy5sZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICAgICAgICBsb2FkTmV4dEZyYWdtZW50SW5TZWdtZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBzZWdtZW50LFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZ1NlZ21lbnRDb2RlLmxvYWROZXh0U2VnbWVudChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgc2VnbWVudCxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGhhc09wdGlvbjogKFxyXG4gICAgICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgb3B0aW9uSUQ6IHN0cmluZ1xyXG4gICAgKTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIGZyYWdtZW50Lm9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb24uaWQgPT09IG9wdGlvbklEKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgY2hlY2tTZWxlY3RlZDogKGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFmcmFnbWVudC5zZWxlY3RlZD8uaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFnRnJhZ21lbnRDb2RlLmhhc09wdGlvbihmcmFnbWVudCwgZnJhZ21lbnQuc2VsZWN0ZWQ/LmlkKSkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2VsZWN0ZWQgaGFzIGJlZW4gc2V0IHRvIGZyYWdtZW50IHRoYXQgaXNuJ3QgYW4gb3B0aW9uXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJQYXJlbnRTZWN0aW9uU2VsZWN0ZWQ6IChkaXNwbGF5Q2hhcnQ6IElEaXNwbGF5U2VjdGlvbik6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBwYXJlbnQgPSAoZGlzcGxheUNoYXJ0IGFzIElEaXNwbGF5Q2hhcnQpLnBhcmVudDtcclxuXHJcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jbGVhclBhcmVudFNlY3Rpb25PcnBoYW5lZFN0ZXBzKHBhcmVudCk7XHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jbGVhclBhcmVudFNlY3Rpb25TZWxlY3RlZChwYXJlbnQuc2VjdGlvbiBhcyBJRGlzcGxheUNoYXJ0KTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJQYXJlbnRTZWN0aW9uT3JwaGFuZWRTdGVwczogKGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsIHwgdW5kZWZpbmVkKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghZnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jbGVhck9ycGhhbmVkU3RlcHMoZnJhZ21lbnQuc2VsZWN0ZWQpO1xyXG4gICAgICAgIGZyYWdtZW50LnNlbGVjdGVkID0gbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJPcnBoYW5lZFN0ZXBzOiAoZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgfCB1bmRlZmluZWQpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFmcmFnbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNsZWFyT3JwaGFuZWRTdGVwcyhmcmFnbWVudC5saW5rPy5yb290KTtcclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNsZWFyT3JwaGFuZWRTdGVwcyhmcmFnbWVudC5zZWxlY3RlZCk7XHJcblxyXG4gICAgICAgIGZyYWdtZW50LnNlbGVjdGVkID0gbnVsbDtcclxuICAgICAgICBmcmFnbWVudC5saW5rID0gbnVsbDtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0RnJhZ21lbnRBbmRMaW5rT3V0bGluZV9zdWJzY3JpcGlvbjogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAgICAgb3B0aW9uVGV4dDogc3RyaW5nIHwgbnVsbCA9IG51bGwsXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgLy8gaWYgKG9wdGlvbi51aS5kaXNjdXNzaW9uTG9hZGVkID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIC8vICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Rpc2N1c3Npb24gd2FzIGFscmVhZHkgbG9hZGVkJyk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBzdGF0ZS5sb2FkaW5nID0gdHJ1ZTtcclxuICAgICAgICB3aW5kb3cuVHJlZVNvbHZlLnNjcmVlbi5oaWRlQmFubmVyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZ091dGxpbmVDb2RlLmdldExpbmtPdXRsaW5lX3N1YnNjcmlwaW9uKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gYCR7b3B0aW9uLnNlY3Rpb24/Lm91dGxpbmU/LnBhdGh9LyR7b3B0aW9uLmlkfSR7Z0ZpbGVDb25zdGFudHMuZnJhZ21lbnRGaWxlRXh0ZW5zaW9ufWA7XHJcblxyXG4gICAgICAgIGNvbnN0IGxvYWRBY3Rpb246IChzdGF0ZTogSVN0YXRlLCByZXNwb25zZTogYW55KSA9PiBJU3RhdGVBbnlBcnJheSA9IChzdGF0ZTogSVN0YXRlLCByZXNwb25zZTogYW55KSA9PiB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ0ZyYWdtZW50QWN0aW9ucy5sb2FkRnJhZ21lbnRBbmRTZXRTZWxlY3RlZChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICBvcHRpb24sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25UZXh0XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5BZGRSZUxvYWREYXRhRWZmZWN0SW1tZWRpYXRlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgYGxvYWRGcmFnbWVudEZpbGVgLFxyXG4gICAgICAgICAgICBQYXJzZVR5cGUuVGV4dCxcclxuICAgICAgICAgICAgdXJsLFxyXG4gICAgICAgICAgICBsb2FkQWN0aW9uXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0UG9kRnJhZ21lbnRfc3Vic2NyaXBpb246IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIG9wdGlvblRleHQ6IHN0cmluZyB8IG51bGwgPSBudWxsLFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIHN0YXRlLmxvYWRpbmcgPSB0cnVlO1xyXG4gICAgICAgIHdpbmRvdy5UcmVlU29sdmUuc2NyZWVuLmhpZGVCYW5uZXIgPSB0cnVlO1xyXG4gICAgICAgIGNvbnN0IHVybCA9IGAke29wdGlvbi5zZWN0aW9uPy5vdXRsaW5lPy5wYXRofS8ke29wdGlvbi5pZH0ke2dGaWxlQ29uc3RhbnRzLmZyYWdtZW50RmlsZUV4dGVuc2lvbn1gO1xyXG5cclxuICAgICAgICBjb25zdCBsb2FkQWN0aW9uOiAoc3RhdGU6IElTdGF0ZSwgcmVzcG9uc2U6IGFueSkgPT4gSVN0YXRlQW55QXJyYXkgPSAoc3RhdGU6IElTdGF0ZSwgcmVzcG9uc2U6IGFueSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdGcmFnbWVudEFjdGlvbnMubG9hZFBvZEZyYWdtZW50KFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbixcclxuICAgICAgICAgICAgICAgIG9wdGlvblRleHRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBnU3RhdGVDb2RlLkFkZFJlTG9hZERhdGFFZmZlY3RJbW1lZGlhdGUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBgbG9hZEZyYWdtZW50RmlsZWAsXHJcbiAgICAgICAgICAgIFBhcnNlVHlwZS5UZXh0LFxyXG4gICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgIGxvYWRBY3Rpb25cclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBnZXRMaW5rT3V0bGluZV9zdWJzY3JpcGlvbjogKFxyXG4gICAgLy8gICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAvLyAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICAvLyApOiB2b2lkID0+IHtcclxuXHJcbiAgICAvLyAgICAgY29uc3Qgb3V0bGluZSA9IG9wdGlvbi5zZWN0aW9uLm91dGxpbmU7XHJcblxyXG4gICAgLy8gICAgIGlmICghb3V0bGluZSkge1xyXG4gICAgLy8gICAgICAgICByZXR1cm47XHJcbiAgICAvLyAgICAgfVxyXG5cclxuICAgIC8vICAgICBjb25zdCBvdXRsaW5lTm9kZSA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX291dGxpbmVOb2RlKFxyXG4gICAgLy8gICAgICAgICBzdGF0ZSxcclxuICAgIC8vICAgICAgICAgb3B0aW9uLnNlY3Rpb24ubGlua0lELFxyXG4gICAgLy8gICAgICAgICBvcHRpb24uaWRcclxuICAgIC8vICAgICApO1xyXG5cclxuICAgIC8vICAgICBpZiAob3V0bGluZU5vZGU/LmMgPT0gbnVsbFxyXG4gICAgLy8gICAgICAgICB8fCBzdGF0ZS5yZW5kZXJTdGF0ZS5pc0NoYWluTG9hZCA9PT0gdHJ1ZSAvLyBXaWxsIGxvYWQgaXQgZnJvbSBhIHNlZ21lbnRcclxuICAgIC8vICAgICApIHtcclxuICAgIC8vICAgICAgICAgcmV0dXJuO1xyXG4gICAgLy8gICAgIH1cclxuXHJcbiAgICAvLyAgICAgY29uc3Qgb3V0bGluZUNoYXJ0ID0gZ091dGxpbmVDb2RlLmdldE91dGxpbmVDaGFydChcclxuICAgIC8vICAgICAgICAgb3V0bGluZSxcclxuICAgIC8vICAgICAgICAgb3V0bGluZU5vZGU/LmNcclxuICAgIC8vICAgICApO1xyXG5cclxuICAgIC8vICAgICBnT3V0bGluZUNvZGUuZ2V0T3V0bGluZUZyb21DaGFydF9zdWJzY3JpcHRpb24oXHJcbiAgICAvLyAgICAgICAgIHN0YXRlLFxyXG4gICAgLy8gICAgICAgICBvdXRsaW5lQ2hhcnQsXHJcbiAgICAvLyAgICAgICAgIG9wdGlvblxyXG4gICAgLy8gICAgICk7XHJcbiAgICAvLyB9LFxyXG5cclxuICAgIGdldExpbmtFbGVtZW50SUQ6IChmcmFnbWVudElEOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xyXG5cclxuICAgICAgICByZXR1cm4gYG50X2xrX2ZyYWdfJHtmcmFnbWVudElEfWA7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEZyYWdtZW50RWxlbWVudElEOiAoZnJhZ21lbnRJRDogc3RyaW5nKTogc3RyaW5nID0+IHtcclxuXHJcbiAgICAgICAgcmV0dXJuIGBudF9mcl9mcmFnXyR7ZnJhZ21lbnRJRH1gO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmVwYXJlVG9TaG93T3B0aW9uTm9kZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLm1hcmtPcHRpb25zRXhwYW5kZWQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLnNldEN1cnJlbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnSGlzdG9yeUNvZGUucHVzaEJyb3dzZXJIaXN0b3J5U3RhdGUoc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBwcmVwYXJlVG9TaG93UG9kT3B0aW9uTm9kZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLm1hcmtPcHRpb25zRXhwYW5kZWQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLnNldFBvZEN1cnJlbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJzZUFuZExvYWRGcmFnbWVudDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgcmVzcG9uc2U6IHN0cmluZyxcclxuICAgICAgICBwYXJlbnRGcmFnbWVudElEOiBzdHJpbmcsXHJcbiAgICAgICAgb3V0bGluZU5vZGVJRDogc3RyaW5nLFxyXG4gICAgICAgIHNlY3Rpb246IElEaXNwbGF5U2VjdGlvblxyXG4gICAgKTogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogeyBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LCBjb250aW51ZUxvYWRpbmc6IGJvb2xlYW4gfSA9IGdGcmFnbWVudENvZGUucGFyc2VBbmRMb2FkRnJhZ21lbnRCYXNlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgIHBhcmVudEZyYWdtZW50SUQsXHJcbiAgICAgICAgICAgIG91dGxpbmVOb2RlSUQsXHJcbiAgICAgICAgICAgIHNlY3Rpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCBmcmFnbWVudCA9IHJlc3VsdC5mcmFnbWVudDtcclxuXHJcbiAgICAgICAgaWYgKHJlc3VsdC5jb250aW51ZUxvYWRpbmcgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGdGcmFnbWVudENvZGUuYXV0b0V4cGFuZFNpbmdsZUJsYW5rT3B0aW9uKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICByZXN1bHQuZnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZnJhZ21lbnQubGluaykge1xyXG5cclxuICAgICAgICAgICAgICAgIGdPdXRsaW5lQ29kZS5nZXRMaW5rT3V0bGluZV9zdWJzY3JpcGlvbihcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZyYWdtZW50O1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJzZUFuZExvYWRQb2RGcmFnbWVudDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgcmVzcG9uc2U6IHN0cmluZyxcclxuICAgICAgICBwYXJlbnRGcmFnbWVudElEOiBzdHJpbmcsXHJcbiAgICAgICAgb3V0bGluZU5vZGVJRDogc3RyaW5nLFxyXG4gICAgICAgIHNlY3Rpb246IElEaXNwbGF5U2VjdGlvblxyXG4gICAgKTogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogeyBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LCBjb250aW51ZUxvYWRpbmc6IGJvb2xlYW4gfSA9IGdGcmFnbWVudENvZGUucGFyc2VBbmRMb2FkRnJhZ21lbnRCYXNlKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgIHBhcmVudEZyYWdtZW50SUQsXHJcbiAgICAgICAgICAgIG91dGxpbmVOb2RlSUQsXHJcbiAgICAgICAgICAgIHNlY3Rpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb25zdCBmcmFnbWVudCA9IHJlc3VsdC5mcmFnbWVudDtcclxuXHJcbiAgICAgICAgaWYgKHJlc3VsdC5jb250aW51ZUxvYWRpbmcgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGdGcmFnbWVudENvZGUuYXV0b0V4cGFuZFNpbmdsZUJsYW5rT3B0aW9uKFxyXG4gICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICByZXN1bHQuZnJhZ21lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmcmFnbWVudDtcclxuICAgIH0sXHJcblxyXG4gICAgcGFyc2VBbmRMb2FkRnJhZ21lbnRCYXNlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByZXNwb25zZTogc3RyaW5nLFxyXG4gICAgICAgIHBhcmVudEZyYWdtZW50SUQ6IHN0cmluZyxcclxuICAgICAgICBvdXRsaW5lTm9kZUlEOiBzdHJpbmcsXHJcbiAgICAgICAgc2VjdGlvbjogSURpc3BsYXlTZWN0aW9uLFxyXG4gICAgICAgIHNlZ21lbnRJbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGxcclxuICAgICk6IHsgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCwgY29udGludWVMb2FkaW5nOiBib29sZWFuIH0gPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXNlY3Rpb24ub3V0bGluZSkge1xyXG5cclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcHRpb24gc2VjdGlvbiBvdXRsaW5lIHdhcyBudWxsJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByYXdGcmFnbWVudCA9IGdGcmFnbWVudENvZGUucGFyc2VGcmFnbWVudChyZXNwb25zZSk7XHJcblxyXG4gICAgICAgIGlmICghcmF3RnJhZ21lbnQpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUmF3IGZyYWdtZW50IHdhcyBudWxsJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAob3V0bGluZU5vZGVJRCAhPT0gcmF3RnJhZ21lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHJhd0ZyYWdtZW50IGlkIGRvZXMgbm90IG1hdGNoIHRoZSBvdXRsaW5lTm9kZUlEJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9jaGFpbkZyYWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgc2VjdGlvbi5saW5rSUQsXHJcbiAgICAgICAgICAgIG91dGxpbmVOb2RlSURcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoIWZyYWdtZW50KSB7XHJcblxyXG4gICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBSZW5kZXJGcmFnbWVudChcclxuICAgICAgICAgICAgICAgIHJhd0ZyYWdtZW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcGFyZW50RnJhZ21lbnRJRCxcclxuICAgICAgICAgICAgICAgIHNlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBzZWdtZW50SW5kZXhcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBjb250aW51ZUxvYWRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCFmcmFnbWVudC51aS5kaXNjdXNzaW9uTG9hZGVkKSB7XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUubG9hZEZyYWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgcmF3RnJhZ21lbnQsXHJcbiAgICAgICAgICAgIGZyYWdtZW50XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5jYWNoZV9jaGFpbkZyYWdtZW50KFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBjb250aW51ZUxvYWRpbmcgPSB0cnVlO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgIGNvbnRpbnVlTG9hZGluZ1xyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGF1dG9FeHBhbmRTaW5nbGVCbGFua09wdGlvbjogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IG9wdGlvbnNBbmRBbmNpbGxhcmllcyA9IGdGcmFnbWVudENvZGUuc3BsaXRPcHRpb25zQW5kQW5jaWxsYXJpZXMoZnJhZ21lbnQub3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zQW5kQW5jaWxsYXJpZXMub3B0aW9ucy5sZW5ndGggPT09IDFcclxuICAgICAgICAgICAgJiYgVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnQuaUtleSlcclxuICAgICAgICAgICAgJiYgKG9wdGlvbnNBbmRBbmNpbGxhcmllcy5vcHRpb25zWzBdLm9wdGlvbiA9PT0gJycgLy8gaWYgb3B0aW9uIGlzIGJsYW5rXHJcbiAgICAgICAgICAgICAgICB8fCBvcHRpb25zQW5kQW5jaWxsYXJpZXMub3B0aW9uc1swXS5hdXRvTWVyZ2VFeGl0ID09PSB0cnVlKSAvLyBpZiBhIHNpbmdsZSBleGl0XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG91dGxpbmVOb2RlID0gZ1N0YXRlQ29kZS5nZXRDYWNoZWRfb3V0bGluZU5vZGUoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50LnNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQuaWRcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChvdXRsaW5lTm9kZT8uYyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzaG93T3B0aW9uTm9kZV9zdWJzY3JpcHRvbihcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uc0FuZEFuY2lsbGFyaWVzLm9wdGlvbnNbMF1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIVUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50LmV4aXRLZXkpKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBUaGVuIGZpbmQgdGhlIHBhcmVudCBvcHRpb24gd2l0aCBhbiBpRXhpdEtleSB0aGF0IG1hdGNoZXMgdGhpcyBleGl0S2V5XHJcbiAgICAgICAgICAgIHNob3dQbHVnX3N1YnNjcmlwdGlvbihcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudC5vcHRpb25cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGV4cGFuZE9wdGlvblBvZHM6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBvcHRpb25zQW5kQW5jaWxsYXJpZXMgPSBnRnJhZ21lbnRDb2RlLnNwbGl0T3B0aW9uc0FuZEFuY2lsbGFyaWVzKGZyYWdtZW50Lm9wdGlvbnMpO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBvcHRpb25zQW5kQW5jaWxsYXJpZXMub3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgb3V0bGluZU5vZGUgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9vdXRsaW5lTm9kZShcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uLnNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uLmlkXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAob3V0bGluZU5vZGU/LmQgPT0gbnVsbFxyXG4gICAgICAgICAgICAgICAgfHwgb3B0aW9uLnBvZCAhPSBudWxsXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBnT3V0bGluZUNvZGUuZ2V0UG9kT3V0bGluZV9zdWJzY3JpcGlvbihcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uLnNlY3Rpb25cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHJldHVybiBzaG93UG9kT3B0aW9uTm9kZV9zdWJzY3JpcHRvbihcclxuICAgICAgICAgICAgLy8gICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAvLyAgICAgb3B0aW9uXHJcbiAgICAgICAgICAgIC8vICk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBjYWNoZVNlY3Rpb25Sb290OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBkaXNwbGF5U2VjdGlvbjogSURpc3BsYXlTZWN0aW9uXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFkaXNwbGF5U2VjdGlvbikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByb290RnJhZ21lbnQgPSBkaXNwbGF5U2VjdGlvbi5yb290O1xyXG5cclxuICAgICAgICBpZiAoIXJvb3RGcmFnbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnU3RhdGVDb2RlLmNhY2hlX2NoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByb290RnJhZ21lbnRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBkaXNwbGF5U2VjdGlvbi5jdXJyZW50ID0gZGlzcGxheVNlY3Rpb24ucm9vdDtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBvcHRpb24gb2Ygcm9vdEZyYWdtZW50Lm9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgICAgIGdTdGF0ZUNvZGUuY2FjaGVfY2hhaW5GcmFnbWVudChcclxuICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBlbGVtZW50SXNQYXJhZ3JhcGg6ICh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiA9PiB7XHJcblxyXG4gICAgICAgIGxldCB0cmltbWVkID0gdmFsdWU7XHJcblxyXG4gICAgICAgIGlmICghVS5pc051bGxPcldoaXRlU3BhY2UodHJpbW1lZCkpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0cmltbWVkLmxlbmd0aCA+IDIwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdHJpbW1lZCA9IHRyaW1tZWQuc3Vic3RyaW5nKDAsIDIwKTtcclxuICAgICAgICAgICAgICAgIHRyaW1tZWQgPSB0cmltbWVkLnJlcGxhY2UoL1xccy9nLCAnJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoJzxwPicpID09PSB0cnVlXHJcbiAgICAgICAgICAgICYmIHRyaW1tZWRbM10gIT09ICc8Jykge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIHBhcnNlQW5kTG9hZEd1aWRlUm9vdEZyYWdtZW50OiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICByYXdGcmFnbWVudDogYW55LFxyXG4gICAgICAgIHJvb3Q6IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghcmF3RnJhZ21lbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5sb2FkRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICByYXdGcmFnbWVudCxcclxuICAgICAgICAgICAgcm9vdFxyXG4gICAgICAgICk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRGcmFnbWVudDogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgcmF3RnJhZ21lbnQ6IGFueSxcclxuICAgICAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgZnJhZ21lbnQudG9wTGV2ZWxNYXBLZXkgPSByYXdGcmFnbWVudC50b3BMZXZlbE1hcEtleSA/PyAnJztcclxuICAgICAgICBmcmFnbWVudC5tYXBLZXlDaGFpbiA9IHJhd0ZyYWdtZW50Lm1hcEtleUNoYWluID8/ICcnO1xyXG4gICAgICAgIGZyYWdtZW50Lmd1aWRlSUQgPSByYXdGcmFnbWVudC5ndWlkZUlEID8/ICcnO1xyXG4gICAgICAgIGZyYWdtZW50LmlLZXkgPSByYXdGcmFnbWVudC5pS2V5ID8/IG51bGw7XHJcbiAgICAgICAgZnJhZ21lbnQuZXhpdEtleSA9IHJhd0ZyYWdtZW50LmV4aXRLZXkgPz8gbnVsbDtcclxuICAgICAgICBmcmFnbWVudC52YXJpYWJsZSA9IHJhd0ZyYWdtZW50LnZhcmlhYmxlID8/IFtdO1xyXG4gICAgICAgIGZyYWdtZW50LmNsYXNzZXMgPSByYXdGcmFnbWVudC5jbGFzc2VzID8/IFtdO1xyXG4gICAgICAgIGZyYWdtZW50LnZhbHVlID0gcmF3RnJhZ21lbnQudmFsdWUgPz8gJyc7XHJcbiAgICAgICAgZnJhZ21lbnQudmFsdWUgPSBmcmFnbWVudC52YWx1ZS50cmltKCk7XHJcbiAgICAgICAgLy8gZnJhZ21lbnQudWkuZGlzY3Vzc2lvbkxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgZnJhZ21lbnQudWkuZG9Ob3RQYWludCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjaGVja0ZvclZhcmlhYmxlcyhcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3Qgb3V0bGluZU5vZGUgPSBnU3RhdGVDb2RlLmdldENhY2hlZF9vdXRsaW5lTm9kZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGZyYWdtZW50LnNlY3Rpb24ubGlua0lELFxyXG4gICAgICAgICAgICBmcmFnbWVudC5pZFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGZyYWdtZW50LnBhcmVudEZyYWdtZW50SUQgPSBvdXRsaW5lTm9kZT8ucGFyZW50Py5pID8/ICcnO1xyXG5cclxuICAgICAgICBsZXQgb3B0aW9uOiBJUmVuZGVyRnJhZ21lbnQgfCB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmIChyYXdGcmFnbWVudC5vcHRpb25zXHJcbiAgICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkocmF3RnJhZ21lbnQub3B0aW9ucylcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgZm9yIChjb25zdCByYXdPcHRpb24gb2YgcmF3RnJhZ21lbnQub3B0aW9ucykge1xyXG5cclxuICAgICAgICAgICAgICAgIG9wdGlvbiA9IGZyYWdtZW50Lm9wdGlvbnMuZmluZChvID0+IG8uaWQgPT09IHJhd09wdGlvbi5pZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb24pIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uID0gbG9hZE9wdGlvbihcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhd09wdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0bGluZU5vZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50LnNlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFnbWVudC5zZWdtZW50SW5kZXhcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudC5vcHRpb25zLnB1c2gob3B0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5vcHRpb24gPSByYXdPcHRpb24ub3B0aW9uID8/ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5pc0FuY2lsbGFyeSA9IHJhd09wdGlvbi5pc0FuY2lsbGFyeSA9PT0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24ub3JkZXIgPSByYXdPcHRpb24ub3JkZXIgPz8gMDtcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uaUV4aXRLZXkgPSByYXdPcHRpb24uaUV4aXRLZXkgPz8gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLmV4aXRLZXkgPSByYXdPcHRpb24uZXhpdEtleSA/PyAnJztcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb24uYXV0b01lcmdlRXhpdCA9IHJhd09wdGlvbi5hdXRvTWVyZ2VFeGl0ID8/ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5wb2RLZXkgPSByYXdPcHRpb24ucG9kS2V5ID8/ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5wb2RUZXh0ID0gcmF3T3B0aW9uLnBvZFRleHQgPz8gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlY3Rpb24gPSBmcmFnbWVudC5zZWN0aW9uO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5wYXJlbnRGcmFnbWVudElEID0gZnJhZ21lbnQuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlZ21lbnRJbmRleCA9IGZyYWdtZW50LnNlZ21lbnRJbmRleDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBvcHRpb24udWkuZGlzY3Vzc2lvbkxvYWRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uLnVpLmRvTm90UGFpbnQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ0hvb2tSZWdpc3RyeUNvZGUuZXhlY3V0ZVN0ZXBIb29rKFxyXG4gICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgZnJhZ21lbnRcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBwYXJzZUZyYWdtZW50OiAocmVzcG9uc2U6IHN0cmluZyk6IGFueSA9PiB7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICAgICAgICA8c2NyaXB0IHR5cGU9XFxcIm1vZHVsZVxcXCIgc3JjPVxcXCIvQHZpdGUvY2xpZW50XFxcIj48L3NjcmlwdD5cclxuICAgICAgICAgICAgICAgIDwhLS0gdHNGcmFnbWVudFJlbmRlckNvbW1lbnQge1xcXCJub2RlXFxcIjp7XFxcImlkXFxcIjpcXFwiZEJ0N0ttMk1sXFxcIixcXFwidG9wTGV2ZWxNYXBLZXlcXFwiOlxcXCJjdjFUUmwwMXJmXFxcIixcXFwibWFwS2V5Q2hhaW5cXFwiOlxcXCJjdjFUUmwwMXJmXFxcIixcXFwiZ3VpZGVJRFxcXCI6XFxcImRCdDdKTjFIZVxcXCIsXFxcImd1aWRlUGF0aFxcXCI6XFxcImM6L0dpdEh1Yi9URVNULkRvY3VtZW50YXRpb24vdHNtYXBzZGF0YU9wdGlvbnNGb2xkZXIvSG9sZGVyL2RhdGFPcHRpb25zLnRzbWFwXFxcIixcXFwicGFyZW50RnJhZ21lbnRJRFxcXCI6XFxcImRCdDdKTjF2dFxcXCIsXFxcImNoYXJ0S2V5XFxcIjpcXFwiY3YxVFJsMDFyZlxcXCIsXFxcIm9wdGlvbnNcXFwiOltdfX0gLS0+XHJcblxyXG4gICAgICAgICAgICAgICAgPGg0IGlkPVxcXCJvcHRpb24tMS1zb2x1dGlvblxcXCI+T3B0aW9uIDEgc29sdXRpb248L2g0PlxyXG4gICAgICAgICAgICAgICAgPHA+T3B0aW9uIDEgc29sdXRpb248L3A+XHJcbiAgICAgICAgKi9cclxuXHJcbiAgICAgICAgY29uc3QgbGluZXMgPSByZXNwb25zZS5zcGxpdCgnXFxuJyk7XHJcbiAgICAgICAgY29uc3QgcmVuZGVyQ29tbWVudFN0YXJ0ID0gYDwhLS0gJHtnRmlsZUNvbnN0YW50cy5mcmFnbWVudFJlbmRlckNvbW1lbnRUYWd9YDtcclxuICAgICAgICBjb25zdCByZW5kZXJDb21tZW50RW5kID0gYCAtLT5gO1xyXG4gICAgICAgIGxldCBmcmFnbWVudFJlbmRlckNvbW1lbnQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gICAgICAgIGxldCBsaW5lOiBzdHJpbmc7XHJcbiAgICAgICAgbGV0IGJ1aWxkVmFsdWUgPSBmYWxzZTtcclxuICAgICAgICBsZXQgdmFsdWUgPSAnJztcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgbGluZSA9IGxpbmVzW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGJ1aWxkVmFsdWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGAke3ZhbHVlfVxyXG4ke2xpbmV9YDtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobGluZS5zdGFydHNXaXRoKHJlbmRlckNvbW1lbnRTdGFydCkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudFJlbmRlckNvbW1lbnQgPSBsaW5lLnN1YnN0cmluZyhyZW5kZXJDb21tZW50U3RhcnQubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIGJ1aWxkVmFsdWUgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWZyYWdtZW50UmVuZGVyQ29tbWVudCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmcmFnbWVudFJlbmRlckNvbW1lbnQgPSBmcmFnbWVudFJlbmRlckNvbW1lbnQudHJpbSgpO1xyXG5cclxuICAgICAgICBpZiAoZnJhZ21lbnRSZW5kZXJDb21tZW50LmVuZHNXaXRoKHJlbmRlckNvbW1lbnRFbmQpID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBsZW5ndGggPSBmcmFnbWVudFJlbmRlckNvbW1lbnQubGVuZ3RoIC0gcmVuZGVyQ29tbWVudEVuZC5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICBmcmFnbWVudFJlbmRlckNvbW1lbnQgPSBmcmFnbWVudFJlbmRlckNvbW1lbnQuc3Vic3RyaW5nKFxyXG4gICAgICAgICAgICAgICAgMCxcclxuICAgICAgICAgICAgICAgIGxlbmd0aFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnJhZ21lbnRSZW5kZXJDb21tZW50ID0gZnJhZ21lbnRSZW5kZXJDb21tZW50LnRyaW0oKTtcclxuICAgICAgICBsZXQgcmF3RnJhZ21lbnQ6IGFueSB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByYXdGcmFnbWVudCA9IEpTT04ucGFyc2UoZnJhZ21lbnRSZW5kZXJDb21tZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByYXdGcmFnbWVudC52YWx1ZSA9IHZhbHVlO1xyXG5cclxuICAgICAgICByZXR1cm4gcmF3RnJhZ21lbnQ7XHJcbiAgICB9LFxyXG5cclxuICAgIG1hcmtPcHRpb25zRXhwYW5kZWQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdGcmFnbWVudENvZGUucmVzZXRGcmFnbWVudFVpcyhzdGF0ZSk7XHJcbiAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUudWkub3B0aW9uc0V4cGFuZGVkID0gdHJ1ZTtcclxuICAgICAgICBmcmFnbWVudC51aS5mcmFnbWVudE9wdGlvbnNFeHBhbmRlZCA9IHRydWU7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbGxhcHNlRnJhZ21lbnRzT3B0aW9uczogKGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFmcmFnbWVudFxyXG4gICAgICAgICAgICB8fCBmcmFnbWVudC5vcHRpb25zLmxlbmd0aCA9PT0gMFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBmcmFnbWVudC5vcHRpb25zKSB7XHJcblxyXG4gICAgICAgICAgICBvcHRpb24udWkuZnJhZ21lbnRPcHRpb25zRXhwYW5kZWQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIHNob3dPcHRpb25Ob2RlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50XHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5jb2xsYXBzZUZyYWdtZW50c09wdGlvbnMoZnJhZ21lbnQpO1xyXG4gICAgICAgIG9wdGlvbi51aS5mcmFnbWVudE9wdGlvbnNFeHBhbmRlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBnRnJhZ21lbnRDb2RlLnNldEN1cnJlbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICByZXNldEZyYWdtZW50VWlzOiAoc3RhdGU6IElTdGF0ZSk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBjaGFpbkZyYWdtZW50cyA9IHN0YXRlLnJlbmRlclN0YXRlLmluZGV4X2NoYWluRnJhZ21lbnRzX2lkO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHByb3BOYW1lIGluIGNoYWluRnJhZ21lbnRzKSB7XHJcblxyXG4gICAgICAgICAgICBnRnJhZ21lbnRDb2RlLnJlc2V0RnJhZ21lbnRVaShjaGFpbkZyYWdtZW50c1twcm9wTmFtZV0pO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgcmVzZXRGcmFnbWVudFVpOiAoZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBmcmFnbWVudC51aS5mcmFnbWVudE9wdGlvbnNFeHBhbmRlZCA9IGZhbHNlO1xyXG4gICAgICAgIGZyYWdtZW50LnVpLmRvTm90UGFpbnQgPSBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0QW5jaWxsYXJ5QWN0aXZlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBhbmNpbGxhcnk6IElSZW5kZXJGcmFnbWVudCB8IG51bGxcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5hY3RpdmVBbmNpbGxhcnkgPSBhbmNpbGxhcnk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyQW5jaWxsYXJ5QWN0aXZlOiAoc3RhdGU6IElTdGF0ZSk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5hY3RpdmVBbmNpbGxhcnkgPSBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICBzcGxpdE9wdGlvbnNBbmRBbmNpbGxhcmllczogKGNoaWxkcmVuOiBBcnJheTxJUmVuZGVyRnJhZ21lbnQ+IHwgbnVsbCB8IHVuZGVmaW5lZCk6IHsgb3B0aW9uczogQXJyYXk8SVJlbmRlckZyYWdtZW50PiwgYW5jaWxsYXJpZXM6IEFycmF5PElSZW5kZXJGcmFnbWVudD4sIHRvdGFsOiBudW1iZXIgfSA9PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGFuY2lsbGFyaWVzOiBBcnJheTxJUmVuZGVyRnJhZ21lbnQ+ID0gW107XHJcbiAgICAgICAgY29uc3Qgb3B0aW9uczogQXJyYXk8SVJlbmRlckZyYWdtZW50PiA9IFtdO1xyXG4gICAgICAgIGxldCBvcHRpb246IElSZW5kZXJGcmFnbWVudDtcclxuXHJcbiAgICAgICAgaWYgKCFjaGlsZHJlbikge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICBhbmNpbGxhcmllcyxcclxuICAgICAgICAgICAgICAgIHRvdGFsOiAwXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICAgICAgICBvcHRpb24gPSBjaGlsZHJlbltpXSBhcyBJUmVuZGVyRnJhZ21lbnQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIW9wdGlvbi5pc0FuY2lsbGFyeSkge1xyXG5cclxuICAgICAgICAgICAgICAgIG9wdGlvbnMucHVzaChvcHRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYW5jaWxsYXJpZXMucHVzaChvcHRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBvcHRpb25zLFxyXG4gICAgICAgICAgICBhbmNpbGxhcmllcyxcclxuICAgICAgICAgICAgdG90YWw6IGNoaWxkcmVuLmxlbmd0aFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHNldEN1cnJlbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBzZWN0aW9uID0gZnJhZ21lbnQuc2VjdGlvbjtcclxuXHJcbiAgICAgICAgbGV0IHBhcmVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX2NoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBzZWN0aW9uLmxpbmtJRCxcclxuICAgICAgICAgICAgZnJhZ21lbnQucGFyZW50RnJhZ21lbnRJRFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChwYXJlbnQpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQuaWQgPT09IGZyYWdtZW50LmlkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGFyZW50IGFuZCBGcmFnbWVudCBhcmUgdGhlIHNhbWVcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHBhcmVudC5zZWxlY3RlZCA9IGZyYWdtZW50O1xyXG4gICAgICAgICAgICBmcmFnbWVudC51aS5zZWN0aW9uSW5kZXggPSBwYXJlbnQudWkuc2VjdGlvbkluZGV4ICsgMTtcclxuXHJcbiAgICAgICAgICAgIGNsZWFyU2libGluZ0NoYWlucyhcclxuICAgICAgICAgICAgICAgIHBhcmVudCxcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXJlbnRGcmFnbWVudCB3YXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlY3Rpb24uY3VycmVudCA9IGZyYWdtZW50O1xyXG4gICAgICAgIGdGcmFnbWVudENvZGUuY2hlY2tTZWxlY3RlZChmcmFnbWVudCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFBvZEN1cnJlbnQ6IChcclxuICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnRcclxuICAgICk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCBzZWN0aW9uID0gZnJhZ21lbnQuc2VjdGlvbjtcclxuXHJcbiAgICAgICAgbGV0IHBhcmVudDogSVJlbmRlckZyYWdtZW50IHwgbnVsbCA9IGdTdGF0ZUNvZGUuZ2V0Q2FjaGVkX2NoYWluRnJhZ21lbnQoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBzZWN0aW9uLmxpbmtJRCxcclxuICAgICAgICAgICAgZnJhZ21lbnQucGFyZW50RnJhZ21lbnRJRFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChwYXJlbnQpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChwYXJlbnQuaWQgPT09IGZyYWdtZW50LmlkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUGFyZW50IGFuZCBGcmFnbWVudCBhcmUgdGhlIHNhbWVcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHBhcmVudC5zZWxlY3RlZCA9IGZyYWdtZW50O1xyXG4gICAgICAgICAgICBmcmFnbWVudC51aS5zZWN0aW9uSW5kZXggPSBwYXJlbnQudWkuc2VjdGlvbkluZGV4ICsgMTtcclxuXHJcbiAgICAgICAgICAgIGNsZWFyU2libGluZ0NoYWlucyhcclxuICAgICAgICAgICAgICAgIHBhcmVudCxcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXJlbnRGcmFnbWVudCB3YXMgbnVsbFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNlY3Rpb24uY3VycmVudCA9IGZyYWdtZW50O1xyXG4gICAgICAgIGdGcmFnbWVudENvZGUuY2hlY2tTZWxlY3RlZChmcmFnbWVudCk7XHJcbiAgICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ0ZyYWdtZW50Q29kZTtcclxuXHJcbiIsImltcG9ydCBnRnJhZ21lbnRBY3Rpb25zIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvYWN0aW9ucy9nRnJhZ21lbnRBY3Rpb25zXCI7XHJcbmltcG9ydCBnRnJhZ21lbnRDb2RlIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvY29kZS9nRnJhZ21lbnRDb2RlXCI7XHJcbmltcG9ydCBnU3RhdGVDb2RlIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvY29kZS9nU3RhdGVDb2RlXCI7XHJcbmltcG9ydCBJRGlzcGxheUNoYXJ0IGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL2Rpc3BsYXkvSURpc3BsYXlDaGFydFwiO1xyXG5pbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgSVN0YXRlQW55QXJyYXkgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlQW55QXJyYXlcIjtcclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBJRnJhZ21lbnRQYXlsb2FkIGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3VpL3BheWxvYWRzL0lGcmFnbWVudFBheWxvYWRcIjtcclxuXHJcblxyXG5jb25zdCBoaWRlRnJvbVBhaW50ID0gKFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgfCB1bmRlZmluZWQsXHJcbiAgICBoaWRlOiBib29sZWFuXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIC8qIFxyXG4gICAgICAgIFRoaXMgaXMgYSBmaXggZm9yOlxyXG4gICAgICAgIE5vdEZvdW5kRXJyb3I6IEZhaWxlZCB0byBleGVjdXRlICdpbnNlcnRCZWZvcmUnIG9uICdOb2RlJzogVGhlIG5vZGUgYmVmb3JlIHdoaWNoIHRoZSBuZXcgbm9kZSBpcyB0byBiZSBpbnNlcnRlZCBpcyBub3QgYSBjaGlsZCBvZiB0aGlzIG5vZGUuXHJcbiAgICAqL1xyXG5cclxuICAgIGlmICghZnJhZ21lbnQpIHtcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBmcmFnbWVudC51aS5kb05vdFBhaW50ID0gaGlkZTtcclxuXHJcbiAgICBoaWRlRnJvbVBhaW50KFxyXG4gICAgICAgIGZyYWdtZW50LnNlbGVjdGVkLFxyXG4gICAgICAgIGhpZGVcclxuICAgICk7XHJcblxyXG4gICAgaGlkZUZyb21QYWludChcclxuICAgICAgICBmcmFnbWVudC5saW5rPy5yb290LFxyXG4gICAgICAgIGhpZGVcclxuICAgICk7XHJcbn1cclxuXHJcbmNvbnN0IGhpZGVPcHRpb25zRnJvbVBhaW50ID0gKFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCB8IG51bGwgfCB1bmRlZmluZWQsXHJcbiAgICBoaWRlOiBib29sZWFuXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIC8qIFxyXG4gICAgICAgIFRoaXMgaXMgYSBmaXggZm9yOlxyXG4gICAgICAgIE5vdEZvdW5kRXJyb3I6IEZhaWxlZCB0byBleGVjdXRlICdpbnNlcnRCZWZvcmUnIG9uICdOb2RlJzogVGhlIG5vZGUgYmVmb3JlIHdoaWNoIHRoZSBuZXcgbm9kZSBpcyB0byBiZSBpbnNlcnRlZCBpcyBub3QgYSBjaGlsZCBvZiB0aGlzIG5vZGUuXHJcbiAgICAqL1xyXG4gICAgaWYgKCFmcmFnbWVudCkge1xyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIGZyYWdtZW50Py5vcHRpb25zKSB7XHJcblxyXG4gICAgICAgIGhpZGVGcm9tUGFpbnQoXHJcbiAgICAgICAgICAgIG9wdGlvbixcclxuICAgICAgICAgICAgaGlkZVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaGlkZVNlY3Rpb25QYXJlbnRTZWxlY3RlZChcclxuICAgICAgICBmcmFnbWVudC5zZWN0aW9uIGFzIElEaXNwbGF5Q2hhcnQsXHJcbiAgICAgICAgaGlkZVxyXG4gICAgKTtcclxufVxyXG5cclxuY29uc3QgaGlkZVNlY3Rpb25QYXJlbnRTZWxlY3RlZCA9IChcclxuICAgIGRpc3BsYXlDaGFydDogSURpc3BsYXlDaGFydCxcclxuICAgIGhpZGU6IGJvb2xlYW5cclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgaWYgKCFkaXNwbGF5Q2hhcnQ/LnBhcmVudCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBoaWRlRnJvbVBhaW50KFxyXG4gICAgICAgIGRpc3BsYXlDaGFydC5wYXJlbnQuc2VsZWN0ZWQsXHJcbiAgICAgICAgaGlkZVxyXG4gICAgKTtcclxuXHJcbiAgICBoaWRlU2VjdGlvblBhcmVudFNlbGVjdGVkKFxyXG4gICAgICAgIGRpc3BsYXlDaGFydC5wYXJlbnQuc2VjdGlvbiBhcyBJRGlzcGxheUNoYXJ0LFxyXG4gICAgICAgIGhpZGVcclxuICAgICk7XHJcbn07XHJcblxyXG5jb25zdCBmcmFnbWVudEFjdGlvbnMgPSB7XHJcblxyXG4gICAgZXhwYW5kT3B0aW9uczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlXHJcbiAgICAgICAgICAgIHx8ICFmcmFnbWVudFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpZ25vcmVFdmVudCA9IHN0YXRlLnJlbmRlclN0YXRlLmFjdGl2ZUFuY2lsbGFyeSAhPSBudWxsO1xyXG4gICAgICAgIGdGcmFnbWVudENvZGUuY2xlYXJBbmNpbGxhcnlBY3RpdmUoc3RhdGUpO1xyXG5cclxuICAgICAgICBpZiAoaWdub3JlRXZlbnQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5zZXREaXJ0eShzdGF0ZSk7XHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5yZXNldEZyYWdtZW50VWlzKHN0YXRlKTtcclxuICAgICAgICBjb25zdCBleHBhbmRlZCA9IGZyYWdtZW50LnVpLmZyYWdtZW50T3B0aW9uc0V4cGFuZGVkICE9PSB0cnVlO1xyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLnVpLm9wdGlvbnNFeHBhbmRlZCA9IGV4cGFuZGVkO1xyXG4gICAgICAgIGZyYWdtZW50LnVpLmZyYWdtZW50T3B0aW9uc0V4cGFuZGVkID0gZXhwYW5kZWQ7XHJcblxyXG4gICAgICAgIGhpZGVPcHRpb25zRnJvbVBhaW50KFxyXG4gICAgICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoaWRlT3B0aW9uczogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudFxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlXHJcbiAgICAgICAgICAgIHx8ICFmcmFnbWVudFxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpZ25vcmVFdmVudCA9IHN0YXRlLnJlbmRlclN0YXRlLmFjdGl2ZUFuY2lsbGFyeSAhPSBudWxsO1xyXG4gICAgICAgIGdGcmFnbWVudENvZGUuY2xlYXJBbmNpbGxhcnlBY3RpdmUoc3RhdGUpO1xyXG5cclxuICAgICAgICBpZiAoaWdub3JlRXZlbnQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ1N0YXRlQ29kZS5zZXREaXJ0eShzdGF0ZSk7XHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5yZXNldEZyYWdtZW50VWlzKHN0YXRlKTtcclxuICAgICAgICBmcmFnbWVudC51aS5mcmFnbWVudE9wdGlvbnNFeHBhbmRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHN0YXRlLnJlbmRlclN0YXRlLnVpLm9wdGlvbnNFeHBhbmRlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBoaWRlT3B0aW9uc0Zyb21QYWludChcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgIGZhbHNlXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNob3dPcHRpb25Ob2RlOiAoXHJcbiAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICBwYXlsb2FkOiBJRnJhZ21lbnRQYXlsb2FkXHJcbiAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghc3RhdGVcclxuICAgICAgICAgICAgfHwgIXBheWxvYWQ/LnBhcmVudEZyYWdtZW50XHJcbiAgICAgICAgICAgIHx8ICFwYXlsb2FkPy5vcHRpb25cclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaWdub3JlRXZlbnQgPSBzdGF0ZS5yZW5kZXJTdGF0ZS5hY3RpdmVBbmNpbGxhcnkgIT0gbnVsbDtcclxuICAgICAgICBnRnJhZ21lbnRDb2RlLmNsZWFyQW5jaWxsYXJ5QWN0aXZlKHN0YXRlKTtcclxuXHJcbiAgICAgICAgaWYgKGlnbm9yZUV2ZW50ID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ1N0YXRlQ29kZS5jbG9uZVN0YXRlKHN0YXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdTdGF0ZUNvZGUuc2V0RGlydHkoc3RhdGUpO1xyXG5cclxuICAgICAgICByZXR1cm4gZ0ZyYWdtZW50QWN0aW9ucy5zaG93T3B0aW9uTm9kZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIHBheWxvYWQucGFyZW50RnJhZ21lbnQsXHJcbiAgICAgICAgICAgIHBheWxvYWQub3B0aW9uXHJcbiAgICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgdG9nZ2xlQW5jaWxsYXJ5Tm9kZTogKFxyXG4gICAgICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICAgICAgcGF5bG9hZDogSUZyYWdtZW50UGF5bG9hZFxyXG4gICAgKTogSVN0YXRlQW55QXJyYXkgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhbmNpbGxhcnkgPSBwYXlsb2FkLm9wdGlvbjtcclxuXHJcbiAgICAgICAgZ0ZyYWdtZW50Q29kZS5zZXRBbmNpbGxhcnlBY3RpdmUoXHJcbiAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICBhbmNpbGxhcnlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoYW5jaWxsYXJ5KSB7XHJcblxyXG4gICAgICAgICAgICBnU3RhdGVDb2RlLnNldERpcnR5KHN0YXRlKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghYW5jaWxsYXJ5LnVpLmFuY2lsbGFyeUV4cGFuZGVkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgYW5jaWxsYXJ5LnVpLmFuY2lsbGFyeUV4cGFuZGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZ0ZyYWdtZW50QWN0aW9ucy5zaG93QW5jaWxsYXJ5Tm9kZShcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBhbmNpbGxhcnlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGFuY2lsbGFyeS51aS5hbmNpbGxhcnlFeHBhbmRlZCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGdTdGF0ZUNvZGUuY2xvbmVTdGF0ZShzdGF0ZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmcmFnbWVudEFjdGlvbnM7XHJcbiIsImltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgSUZyYWdtZW50UGF5bG9hZCBmcm9tIFwiLi4vLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS91aS9wYXlsb2Fkcy9JRnJhZ21lbnRQYXlsb2FkXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRnJhZ21lbnRQYXlsb2FkIGltcGxlbWVudHMgSUZyYWdtZW50UGF5bG9hZCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgcGFyZW50RnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICBvcHRpb246IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICBlbGVtZW50OiBIVE1MRWxlbWVudFxyXG4gICAgKSB7XHJcblxyXG4gICAgICAgIHRoaXMucGFyZW50RnJhZ21lbnQgPSBwYXJlbnRGcmFnbWVudDtcclxuICAgICAgICB0aGlzLm9wdGlvbiA9IG9wdGlvbjtcclxuICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBwYXJlbnRGcmFnbWVudDogSVJlbmRlckZyYWdtZW50O1xyXG4gICAgcHVibGljIG9wdGlvbjogSVJlbmRlckZyYWdtZW50O1xyXG4gICAgcHVibGljIGVsZW1lbnQ6IEhUTUxFbGVtZW50O1xyXG59XHJcbiIsImltcG9ydCB7IENoaWxkcmVuLCBWTm9kZSB9IGZyb20gXCJoeXBlci1hcHAtbG9jYWxcIjtcclxuaW1wb3J0IHsgaCB9IGZyb20gXCIuLi8uLi8uLi8uLi9oeXBlckFwcC9oeXBlci1hcHAtbG9jYWxcIjtcclxuXHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgZnJhZ21lbnRWaWV3cyBmcm9tIFwiLi9mcmFnbWVudFZpZXdzXCI7XHJcbmltcG9ydCBnRnJhZ21lbnRDb2RlIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvY29kZS9nRnJhZ21lbnRDb2RlXCI7XHJcbmltcG9ydCBvcHRpb25zVmlld3MgZnJvbSBcIi4vb3B0aW9uc1ZpZXdzXCI7XHJcblxyXG5cclxuY29uc3QgYnVpbGRQb2REaXNjdXNzaW9uVmlldyA9IChcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICB2aWV3czogQ2hpbGRyZW5bXVxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBsZXQgYWRqdXN0Rm9yQ29sbGFwc2VkT3B0aW9ucyA9IGZhbHNlO1xyXG4gICAgbGV0IGFkanVzdEZvclByaW9yQW5jaWxsYXJpZXMgPSBmYWxzZTtcclxuICAgIGNvbnN0IHZpZXdzTGVuZ3RoID0gdmlld3MubGVuZ3RoO1xyXG5cclxuICAgIGlmICh2aWV3c0xlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgY29uc3QgbGFzdFZpZXc6IGFueSA9IHZpZXdzW3ZpZXdzTGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAgIGlmIChsYXN0Vmlldz8udWk/LmlzQ29sbGFwc2VkID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBhZGp1c3RGb3JDb2xsYXBzZWRPcHRpb25zID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChsYXN0Vmlldz8udWk/Lmhhc0FuY2lsbGFyaWVzID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICBhZGp1c3RGb3JQcmlvckFuY2lsbGFyaWVzID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbGlua0VMZW1lbnRJRCA9IGdGcmFnbWVudENvZGUuZ2V0TGlua0VsZW1lbnRJRChmcmFnbWVudC5pZCk7XHJcbiAgICBjb25zdCByZXN1bHRzOiB7IHZpZXdzOiBDaGlsZHJlbltdLCBvcHRpb25zQ29sbGFwc2VkOiBib29sZWFuLCBoYXNBbmNpbGxhcmllczogYm9vbGVhbiB9ID0gb3B0aW9uc1ZpZXdzLmJ1aWxkVmlldyhmcmFnbWVudCk7XHJcblxyXG4gICAgaWYgKGxpbmtFTGVtZW50SUQgPT09ICdudF9sa19mcmFnX3Q5NjhPSjF3bycpIHtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coYFItRFJBV0lORyAke2xpbmtFTGVtZW50SUR9X2RgKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY2xhc3NlcyA9IFwibnQtZnItZnJhZ21lbnQtYm94XCI7XHJcblxyXG4gICAgaWYgKGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgaWYgKGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzID0gYCR7Y2xhc3Nlc30gbnQtdXItJHtjbGFzc05hbWV9YFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChhZGp1c3RGb3JDb2xsYXBzZWRPcHRpb25zID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIGNsYXNzZXMgPSBgJHtjbGFzc2VzfSBudC1mci1wcmlvci1jb2xsYXBzZWQtb3B0aW9uc2BcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYWRqdXN0Rm9yUHJpb3JBbmNpbGxhcmllcyA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICBjbGFzc2VzID0gYCR7Y2xhc3Nlc30gbnQtZnItcHJpb3ItaXMtYW5jaWxsYXJ5YFxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXcgPVxyXG5cclxuICAgICAgICBoKFwiZGl2XCIsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkOiBgJHtsaW5rRUxlbWVudElEfV9kYCxcclxuICAgICAgICAgICAgICAgIGNsYXNzOiBgJHtjbGFzc2VzfWBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgaChcImRpdlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6IGBudC1mci1mcmFnbWVudC1kaXNjdXNzaW9uYCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJkYXRhLWRpc2N1c3Npb25cIjogZnJhZ21lbnQudmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwiXCJcclxuICAgICAgICAgICAgICAgICksXHJcblxyXG4gICAgICAgICAgICAgICAgcmVzdWx0cy52aWV3c1xyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICBpZiAocmVzdWx0cy5vcHRpb25zQ29sbGFwc2VkID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXdBbnkgPSB2aWV3IGFzIGFueTtcclxuXHJcbiAgICAgICAgaWYgKCF2aWV3QW55LnVpKSB7XHJcblxyXG4gICAgICAgICAgICB2aWV3QW55LnVpID0ge307XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2aWV3QW55LnVpLmlzQ29sbGFwc2VkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVzdWx0cy5oYXNBbmNpbGxhcmllcyA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICBjb25zdCB2aWV3QW55ID0gdmlldyBhcyBhbnk7XHJcblxyXG4gICAgICAgIGlmICghdmlld0FueS51aSkge1xyXG5cclxuICAgICAgICAgICAgdmlld0FueS51aSA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmlld0FueS51aS5oYXNBbmNpbGxhcmllcyA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdmlld3MucHVzaCh2aWV3KTtcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkVmlldyA9IChmcmFnbWVudDogSVJlbmRlckZyYWdtZW50KTogQ2hpbGRyZW5bXSA9PiB7XHJcblxyXG4gICAgY29uc3Qgdmlld3M6IENoaWxkcmVuW10gPSBbXTtcclxuXHJcbiAgICBidWlsZFBvZERpc2N1c3Npb25WaWV3KFxyXG4gICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgIHZpZXdzXHJcbiAgICApO1xyXG5cclxuICAgIGZyYWdtZW50Vmlld3MuYnVpbGRWaWV3KFxyXG4gICAgICAgIGZyYWdtZW50LnNlbGVjdGVkLFxyXG4gICAgICAgIHZpZXdzXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiB2aWV3cztcclxufTtcclxuXHJcbmNvbnN0IHBvZFZpZXdzID0ge1xyXG5cclxuICAgIGJ1aWxkVmlldzogKFxyXG4gICAgICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCxcclxuICAgICk6IFZOb2RlIHwgbnVsbCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghb3B0aW9uXHJcbiAgICAgICAgICAgIHx8ICFvcHRpb24ucG9kPy5yb290XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmlldyA9IGgoXCJkaXZcIiwgeyBjbGFzczogXCJudC1mci1wb2QtYm94XCIgfSxcclxuXHJcbiAgICAgICAgICAgIGJ1aWxkVmlldyhvcHRpb24ucG9kPy5yb290KVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgcG9kVmlld3M7XHJcblxyXG5cclxuIiwiaW1wb3J0IHsgQ2hpbGRyZW4sIFZOb2RlIH0gZnJvbSBcImh5cGVyLWFwcC1sb2NhbFwiO1xyXG5pbXBvcnQgeyBoIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2h5cGVyQXBwL2h5cGVyLWFwcC1sb2NhbFwiO1xyXG5cclxuaW1wb3J0IElSZW5kZXJGcmFnbWVudCBmcm9tIFwiLi4vLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9yZW5kZXIvSVJlbmRlckZyYWdtZW50XCI7XHJcbmltcG9ydCBmcmFnbWVudEFjdGlvbnMgZnJvbSBcIi4uL2FjdGlvbnMvZnJhZ21lbnRBY3Rpb25zXCI7XHJcbmltcG9ydCBGcmFnbWVudFBheWxvYWQgZnJvbSBcIi4uLy4uLy4uL3N0YXRlL3VpL3BheWxvYWRzL0ZyYWdtZW50UGF5bG9hZFwiO1xyXG5pbXBvcnQgVSBmcm9tIFwiLi4vLi4vLi4vZ2xvYmFsL2dVdGlsaXRpZXNcIjtcclxuaW1wb3J0IGZyYWdtZW50Vmlld3MgZnJvbSBcIi4vZnJhZ21lbnRWaWV3c1wiO1xyXG5pbXBvcnQgZ0ZyYWdtZW50Q29kZSBmcm9tIFwiLi4vLi4vLi4vZ2xvYmFsL2NvZGUvZ0ZyYWdtZW50Q29kZVwiO1xyXG5pbXBvcnQgcG9kVmlld3MgZnJvbSBcIi4vcG9kVmlld3NcIjtcclxuXHJcblxyXG5jb25zdCBidWlsZEFuY2lsbGFyeURpc2N1c3Npb25WaWV3ID0gKGFuY2lsbGFyeTogSVJlbmRlckZyYWdtZW50KTogQ2hpbGRyZW5bXSA9PiB7XHJcblxyXG4gICAgaWYgKCFhbmNpbGxhcnkudWkuYW5jaWxsYXJ5RXhwYW5kZWQpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXc6IENoaWxkcmVuW10gPSBbXTtcclxuXHJcbiAgICBmcmFnbWVudFZpZXdzLmJ1aWxkVmlldyhcclxuICAgICAgICBhbmNpbGxhcnksXHJcbiAgICAgICAgdmlld1xyXG4gICAgKTtcclxuXHJcbiAgICByZXR1cm4gdmlldztcclxufVxyXG5cclxuY29uc3QgYnVpbGRFeHBhbmRlZEFuY2lsbGFyeVZpZXcgPSAoXHJcbiAgICBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIGFuY2lsbGFyeTogSVJlbmRlckZyYWdtZW50XHJcbik6IFZOb2RlIHwgbnVsbCA9PiB7XHJcblxyXG4gICAgaWYgKCFhbmNpbGxhcnlcclxuICAgICAgICB8fCAhYW5jaWxsYXJ5LmlzQW5jaWxsYXJ5KSB7XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXc6IFZOb2RlID1cclxuXHJcbiAgICAgICAgaChcImRpdlwiLCB7IGNsYXNzOiBcIm50LWZyLWFuY2lsbGFyeS1ib3hcIiB9LCBbXHJcbiAgICAgICAgICAgIGgoXCJkaXZcIiwgeyBjbGFzczogXCJudC1mci1hbmNpbGxhcnktaGVhZFwiIH0sIFtcclxuICAgICAgICAgICAgICAgIGgoXCJhXCIsXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzczogXCJudC1mci1hbmNpbGxhcnkgbnQtZnItYW5jaWxsYXJ5LXRhcmdldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlRG93bjogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRBY3Rpb25zLnRvZ2dsZUFuY2lsbGFyeU5vZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAodGFyZ2V0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IEZyYWdtZW50UGF5bG9hZChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmNpbGxhcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaChcInNwYW5cIiwgeyBjbGFzczogXCJudC1mci1hbmNpbGxhcnktdGV4dCBudC1mci1hbmNpbGxhcnktdGFyZ2V0XCIgfSwgYW5jaWxsYXJ5Lm9wdGlvbiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoXCJzcGFuXCIsIHsgY2xhc3M6IFwibnQtZnItYW5jaWxsYXJ5LXggbnQtZnItYW5jaWxsYXJ5LXRhcmdldFwiIH0sICfinJUnKVxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgXSksXHJcblxyXG4gICAgICAgICAgICBidWlsZEFuY2lsbGFyeURpc2N1c3Npb25WaWV3KGFuY2lsbGFyeSlcclxuICAgICAgICBdKTtcclxuXHJcbiAgICByZXR1cm4gdmlldztcclxufVxyXG5cclxuY29uc3QgYnVpbGRDb2xsYXBzZWRBbmNpbGxhcnlWaWV3ID0gKFxyXG4gICAgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICBhbmNpbGxhcnk6IElSZW5kZXJGcmFnbWVudFxyXG4pOiBWTm9kZSB8IG51bGwgPT4ge1xyXG5cclxuICAgIGlmICghYW5jaWxsYXJ5XHJcbiAgICAgICAgfHwgIWFuY2lsbGFyeS5pc0FuY2lsbGFyeSkge1xyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB2aWV3OiBWTm9kZSA9XHJcblxyXG4gICAgICAgIGgoXCJkaXZcIiwgeyBjbGFzczogXCJudC1mci1hbmNpbGxhcnktYm94IG50LWZyLWNvbGxhcHNlZFwiIH0sIFtcclxuICAgICAgICAgICAgaChcImRpdlwiLCB7IGNsYXNzOiBcIm50LWZyLWFuY2lsbGFyeS1oZWFkXCIgfSwgW1xyXG4gICAgICAgICAgICAgICAgaChcImFcIixcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiBcIm50LWZyLWFuY2lsbGFyeSBudC1mci1hbmNpbGxhcnktdGFyZ2V0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VEb3duOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFnbWVudEFjdGlvbnMudG9nZ2xlQW5jaWxsYXJ5Tm9kZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh0YXJnZXQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRnJhZ21lbnRQYXlsb2FkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuY2lsbGFyeSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKFwic3BhblwiLCB7IGNsYXNzOiBcIm50LWZyLWFuY2lsbGFyeS10YXJnZXRcIiB9LCBhbmNpbGxhcnkub3B0aW9uKVxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgXSlcclxuICAgICAgICBdKTtcclxuXHJcbiAgICByZXR1cm4gdmlldztcclxufVxyXG5cclxuY29uc3QgQnVpbGRBbmNpbGxhcnlWaWV3ID0gKFxyXG4gICAgcGFyZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICBhbmNpbGxhcnk6IElSZW5kZXJGcmFnbWVudFxyXG4pOiBWTm9kZSB8IG51bGwgPT4ge1xyXG5cclxuICAgIGlmICghYW5jaWxsYXJ5XHJcbiAgICAgICAgfHwgIWFuY2lsbGFyeS5pc0FuY2lsbGFyeSkge1xyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYW5jaWxsYXJ5LnVpLmFuY2lsbGFyeUV4cGFuZGVkID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIHJldHVybiBidWlsZEV4cGFuZGVkQW5jaWxsYXJ5VmlldyhcclxuICAgICAgICAgICAgcGFyZW50LFxyXG4gICAgICAgICAgICBhbmNpbGxhcnlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBidWlsZENvbGxhcHNlZEFuY2lsbGFyeVZpZXcoXHJcbiAgICAgICAgcGFyZW50LFxyXG4gICAgICAgIGFuY2lsbGFyeVxyXG4gICAgKTtcclxufVxyXG5cclxuY29uc3QgQnVpbGRFeHBhbmRlZE9wdGlvblZpZXcgPSAoXHJcbiAgICBwYXJlbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIG9wdGlvbjogSVJlbmRlckZyYWdtZW50XHJcbik6IFZOb2RlIHwgbnVsbCA9PiB7XHJcblxyXG4gICAgaWYgKCFvcHRpb25cclxuICAgICAgICB8fCBvcHRpb24uaXNBbmNpbGxhcnkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGJ1dHRvbkNsYXNzID0gXCJudC1mci1vcHRpb25cIjtcclxuICAgIGxldCBpbm5lclZpZXc6IFZOb2RlIHwgbnVsbDtcclxuXHJcbiAgICBpZiAob3B0aW9uLnBvZD8ucm9vdCkge1xyXG5cclxuICAgICAgICBidXR0b25DbGFzcyA9IGAke2J1dHRvbkNsYXNzfSBudC1mci1wb2QtYnV0dG9uYDtcclxuICAgICAgICBpbm5lclZpZXcgPSBwb2RWaWV3cy5idWlsZFZpZXcob3B0aW9uKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGlubmVyVmlldyA9IGgoXCJzcGFuXCIsIHsgY2xhc3M6IFwibnQtZnItb3B0aW9uLXRleHRcIiB9LCBvcHRpb24ub3B0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB2aWV3OiBWTm9kZSA9XHJcblxyXG4gICAgICAgIGgoXCJkaXZcIiwgeyBjbGFzczogXCJudC1mci1vcHRpb24tYm94XCIgfSxcclxuICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgaChcImFcIixcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiBgJHtidXR0b25DbGFzc31gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbk1vdXNlRG93bjogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRBY3Rpb25zLnNob3dPcHRpb25Ob2RlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHRhcmdldDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBGcmFnbWVudFBheWxvYWQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlubmVyVmlld1xyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHZpZXc7XHJcbn1cclxuXHJcbmNvbnN0IGJ1aWxkRXhwYW5kZWRPcHRpb25zVmlldyA9IChcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICBvcHRpb25zOiBBcnJheTxJUmVuZGVyRnJhZ21lbnQ+XHJcbik6IHsgdmlldzogVk5vZGUsIGlzQ29sbGFwc2VkOiBib29sZWFuIH0gfCBudWxsID0+IHtcclxuXHJcbiAgICBjb25zdCBvcHRpb25WaWV3czogQ2hpbGRyZW5bXSA9IFtdO1xyXG4gICAgbGV0IG9wdGlvblZldzogVk5vZGUgfCBudWxsO1xyXG5cclxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIG9wdGlvbnMpIHtcclxuXHJcbiAgICAgICAgb3B0aW9uVmV3ID0gQnVpbGRFeHBhbmRlZE9wdGlvblZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgICAgICBvcHRpb25cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9uVmV3KSB7XHJcblxyXG4gICAgICAgICAgICBvcHRpb25WaWV3cy5wdXNoKG9wdGlvblZldyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGxldCBvcHRpb25zQ2xhc3NlcyA9IFwibnQtZnItZnJhZ21lbnQtb3B0aW9uc1wiO1xyXG5cclxuICAgIGlmIChmcmFnbWVudC5zZWxlY3RlZCkge1xyXG5cclxuICAgICAgICBvcHRpb25zQ2xhc3NlcyA9IGAke29wdGlvbnNDbGFzc2VzfSBudC1mci1mcmFnbWVudC1jaGFpbmBcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB2aWV3OiBWTm9kZSA9XHJcblxyXG4gICAgICAgIGgoXCJkaXZcIixcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2xhc3M6IGAke29wdGlvbnNDbGFzc2VzfWAsXHJcbiAgICAgICAgICAgICAgICB0YWJpbmRleDogMCxcclxuICAgICAgICAgICAgICAgIG9uQmx1cjogW1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50QWN0aW9ucy5oaWRlT3B0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAoX2V2ZW50OiBhbnkpID0+IGZyYWdtZW50XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBvcHRpb25WaWV3c1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2aWV3LFxyXG4gICAgICAgIGlzQ29sbGFwc2VkOiBmYWxzZVxyXG4gICAgfTtcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkRXhwYW5kZWRPcHRpb25zQm94VmlldyA9IChcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICBvcHRpb25zOiBBcnJheTxJUmVuZGVyRnJhZ21lbnQ+LFxyXG4gICAgZnJhZ21lbnRFTGVtZW50SUQ6IHN0cmluZyxcclxuICAgIHZpZXdzOiBDaGlsZHJlbltdXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnNWaWV3ID0gYnVpbGRFeHBhbmRlZE9wdGlvbnNWaWV3KFxyXG4gICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgIG9wdGlvbnNcclxuICAgICk7XHJcblxyXG4gICAgaWYgKCFvcHRpb25zVmlldykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY2xhc3NlcyA9IFwibnQtZnItZnJhZ21lbnQtYm94XCI7XHJcblxyXG4gICAgaWYgKGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgaWYgKGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzID0gYCR7Y2xhc3Nlc30gbnQtdXItJHtjbGFzc05hbWV9YFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZpZXdzLnB1c2goXHJcblxyXG4gICAgICAgIGgoXCJkaXZcIixcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWQ6IGAke2ZyYWdtZW50RUxlbWVudElEfV9lb2AsXHJcbiAgICAgICAgICAgICAgICBjbGFzczogYCR7Y2xhc3Nlc31gXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnNWaWV3LnZpZXdcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIClcclxuICAgICk7XHJcbn07XHJcblxyXG5jb25zdCBidWlsZENvbGxhcHNlZE9wdGlvbnNWaWV3ID0gKGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQpOiBWTm9kZSA9PiB7XHJcblxyXG4gICAgbGV0IGJ1dHRvbkNsYXNzID0gXCJudC1mci1mcmFnbWVudC1vcHRpb25zIG50LWZyLWNvbGxhcHNlZFwiO1xyXG5cclxuICAgIGlmIChmcmFnbWVudC5zZWxlY3RlZD8ucG9kPy5yb290KSB7XHJcblxyXG4gICAgICAgIGJ1dHRvbkNsYXNzID0gYCR7YnV0dG9uQ2xhc3N9IG50LWZyLXBvZC1idXR0b25gO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXc6IFZOb2RlID1cclxuXHJcbiAgICAgICAgaChcImFcIixcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2xhc3M6IGAke2J1dHRvbkNsYXNzfWAsXHJcbiAgICAgICAgICAgICAgICBvbk1vdXNlRG93bjogW1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50QWN0aW9ucy5leHBhbmRPcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgICAgIChfZXZlbnQ6IGFueSkgPT4gZnJhZ21lbnRcclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgcG9kVmlld3MuYnVpbGRWaWV3KGZyYWdtZW50LnNlbGVjdGVkKSxcclxuXHJcbiAgICAgICAgICAgICAgICBoKFwic3BhblwiLCB7IGNsYXNzOiBgbnQtZnItb3B0aW9uLXNlbGVjdGVkYCB9LCBgJHtmcmFnbWVudC5zZWxlY3RlZD8ub3B0aW9ufWApLFxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICByZXR1cm4gdmlldztcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkQ29sbGFwc2VkT3B0aW9uc0JveFZpZXcgPSAoXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgZnJhZ21lbnRFTGVtZW50SUQ6IHN0cmluZyxcclxuICAgIHZpZXdzOiBDaGlsZHJlbltdXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvblZpZXcgPSBidWlsZENvbGxhcHNlZE9wdGlvbnNWaWV3KGZyYWdtZW50KTtcclxuXHJcbiAgICBsZXQgY2xhc3NlcyA9IFwibnQtZnItZnJhZ21lbnQtYm94XCI7XHJcblxyXG4gICAgaWYgKGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgaWYgKGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzID0gYCR7Y2xhc3Nlc30gbnQtdXItJHtjbGFzc05hbWV9YFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXcgPVxyXG5cclxuICAgICAgICBoKFwiZGl2XCIsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkOiBgJHtmcmFnbWVudEVMZW1lbnRJRH1fY29gLFxyXG4gICAgICAgICAgICAgICAgY2xhc3M6IGAke2NsYXNzZXN9YFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICBvcHRpb25WaWV3XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICApO1xyXG5cclxuICAgIGNvbnN0IHZpZXdBbnkgPSB2aWV3IGFzIGFueTtcclxuXHJcbiAgICBpZiAoIXZpZXdBbnkudWkpIHtcclxuXHJcbiAgICAgICAgdmlld0FueS51aSA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIHZpZXdBbnkudWkuaXNDb2xsYXBzZWQgPSB0cnVlO1xyXG4gICAgdmlld3MucHVzaCh2aWV3KTtcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkQW5jaWxsYXJpZXNWaWV3ID0gKFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIGFuY2lsbGFyaWVzOiBBcnJheTxJUmVuZGVyRnJhZ21lbnQ+XHJcbik6IFZOb2RlIHwgbnVsbCA9PiB7XHJcblxyXG4gICAgaWYgKGFuY2lsbGFyaWVzLmxlbmd0aCA9PT0gMCkge1xyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBhbmNpbGxhcmllc1ZpZXdzOiBDaGlsZHJlbltdID0gW107XHJcbiAgICBsZXQgYW5jaWxsYXJ5VmlldzogVk5vZGUgfCBudWxsO1xyXG5cclxuICAgIGZvciAoY29uc3QgYW5jaWxsYXJ5IG9mIGFuY2lsbGFyaWVzKSB7XHJcblxyXG4gICAgICAgIGFuY2lsbGFyeVZpZXcgPSBCdWlsZEFuY2lsbGFyeVZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgICAgICBhbmNpbGxhcnlcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoYW5jaWxsYXJ5Vmlldykge1xyXG5cclxuICAgICAgICAgICAgYW5jaWxsYXJpZXNWaWV3cy5wdXNoKGFuY2lsbGFyeVZpZXcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoYW5jaWxsYXJpZXNWaWV3cy5sZW5ndGggPT09IDApIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGFuY2lsbGFyaWVzQ2xhc3NlcyA9IFwibnQtZnItZnJhZ21lbnQtYW5jaWxsYXJpZXNcIjtcclxuXHJcbiAgICBpZiAoZnJhZ21lbnQuc2VsZWN0ZWQpIHtcclxuXHJcbiAgICAgICAgYW5jaWxsYXJpZXNDbGFzc2VzID0gYCR7YW5jaWxsYXJpZXNDbGFzc2VzfSBudC1mci1mcmFnbWVudC1jaGFpbmBcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB2aWV3OiBWTm9kZSA9XHJcblxyXG4gICAgICAgIGgoXCJkaXZcIixcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2xhc3M6IGAke2FuY2lsbGFyaWVzQ2xhc3Nlc31gLFxyXG4gICAgICAgICAgICAgICAgdGFiaW5kZXg6IDAsXHJcbiAgICAgICAgICAgICAgICAvLyBvbkJsdXI6IFtcclxuICAgICAgICAgICAgICAgIC8vICAgICBmcmFnbWVudEFjdGlvbnMuaGlkZU9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgKF9ldmVudDogYW55KSA9PiBmcmFnbWVudFxyXG4gICAgICAgICAgICAgICAgLy8gXVxyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgYW5jaWxsYXJpZXNWaWV3c1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHZpZXc7XHJcbn07XHJcblxyXG5jb25zdCBidWlsZEFuY2lsbGFyaWVzQm94VmlldyA9IChcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICBhbmNpbGxhcmllczogQXJyYXk8SVJlbmRlckZyYWdtZW50PixcclxuICAgIGZyYWdtZW50RUxlbWVudElEOiBzdHJpbmcsXHJcbiAgICB2aWV3czogQ2hpbGRyZW5bXVxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBjb25zdCBhbmNpbGxhcmllc1ZpZXcgPSBidWlsZEFuY2lsbGFyaWVzVmlldyhcclxuICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICBhbmNpbGxhcmllc1xyXG4gICAgKTtcclxuXHJcbiAgICBpZiAoIWFuY2lsbGFyaWVzVmlldykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY2xhc3NlcyA9IFwibnQtZnItZnJhZ21lbnQtYm94XCI7XHJcblxyXG4gICAgaWYgKGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgaWYgKGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2xhc3NOYW1lIG9mIGZyYWdtZW50LmNsYXNzZXMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzID0gYCR7Y2xhc3Nlc30gbnQtdXItJHtjbGFzc05hbWV9YFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZpZXcgPVxyXG5cclxuICAgICAgICBoKFwiZGl2XCIsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkOiBgJHtmcmFnbWVudEVMZW1lbnRJRH1fYWAsXHJcbiAgICAgICAgICAgICAgICBjbGFzczogYCR7Y2xhc3Nlc31gXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgIGFuY2lsbGFyaWVzVmlld1xyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICBjb25zdCB2aWV3QW55ID0gdmlldyBhcyBhbnk7XHJcblxyXG4gICAgaWYgKCF2aWV3QW55LnVpKSB7XHJcblxyXG4gICAgICAgIHZpZXdBbnkudWkgPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICB2aWV3QW55LnVpLmhhc0FuY2lsbGFyaWVzID0gdHJ1ZTtcclxuICAgIHZpZXdzLnB1c2godmlldyk7XHJcbn07XHJcblxyXG5jb25zdCBidWlsZE9wdGlvbnNWaWV3ID0gKFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIG9wdGlvbnM6IEFycmF5PElSZW5kZXJGcmFnbWVudD5cclxuKTogeyB2aWV3OiBWTm9kZSwgaXNDb2xsYXBzZWQ6IGJvb2xlYW4gfSB8IG51bGwgPT4ge1xyXG5cclxuICAgIGlmIChvcHRpb25zLmxlbmd0aCA9PT0gMCkge1xyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5sZW5ndGggPT09IDFcclxuICAgICAgICAmJiAob3B0aW9uc1swXS5vcHRpb24gPT09ICcnIC8vIGlmIG9wdGlvbiBpcyBibGFua1xyXG4gICAgICAgICAgICB8fCBvcHRpb25zWzBdLmF1dG9NZXJnZUV4aXQgPT09IHRydWUpIC8vIGlmIGEgc2luZ2xlIGV4aXRcclxuICAgICkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChmcmFnbWVudC5zZWxlY3RlZFxyXG4gICAgICAgICYmICFmcmFnbWVudC51aS5mcmFnbWVudE9wdGlvbnNFeHBhbmRlZCkge1xyXG5cclxuICAgICAgICBjb25zdCB2aWV3ID0gYnVpbGRDb2xsYXBzZWRPcHRpb25zVmlldyhmcmFnbWVudCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHZpZXcsXHJcbiAgICAgICAgICAgIGlzQ29sbGFwc2VkOiB0cnVlXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYnVpbGRFeHBhbmRlZE9wdGlvbnNWaWV3KFxyXG4gICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgIG9wdGlvbnNcclxuICAgICk7XHJcbn07XHJcblxyXG5jb25zdCBidWlsZE9wdGlvbnNCb3hWaWV3ID0gKFxyXG4gICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIG9wdGlvbnM6IEFycmF5PElSZW5kZXJGcmFnbWVudD4sXHJcbiAgICBmcmFnbWVudEVMZW1lbnRJRDogc3RyaW5nLFxyXG4gICAgdmlld3M6IENoaWxkcmVuW11cclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChvcHRpb25zLmxlbmd0aCA9PT0gMVxyXG4gICAgICAgICYmIChvcHRpb25zWzBdLm9wdGlvbiA9PT0gJycgLy8gaWYgb3B0aW9uIGlzIGJsYW5rXHJcbiAgICAgICAgICAgIHx8IG9wdGlvbnNbMF0uYXV0b01lcmdlRXhpdCA9PT0gdHJ1ZSkgLy8gaWYgYSBzaW5nbGUgZXhpdFxyXG4gICAgKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChmcmFnbWVudC5zZWxlY3RlZFxyXG4gICAgICAgICYmICFmcmFnbWVudC51aS5mcmFnbWVudE9wdGlvbnNFeHBhbmRlZCkge1xyXG5cclxuICAgICAgICBidWlsZENvbGxhcHNlZE9wdGlvbnNCb3hWaWV3KFxyXG4gICAgICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICAgICAgZnJhZ21lbnRFTGVtZW50SUQsXHJcbiAgICAgICAgICAgIHZpZXdzXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGJ1aWxkRXhwYW5kZWRPcHRpb25zQm94VmlldyhcclxuICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICBvcHRpb25zLFxyXG4gICAgICAgIGZyYWdtZW50RUxlbWVudElELFxyXG4gICAgICAgIHZpZXdzXHJcbiAgICApO1xyXG59O1xyXG5cclxuXHJcbmNvbnN0IG9wdGlvbnNWaWV3cyA9IHtcclxuXHJcbiAgICBidWlsZFZpZXc6IChmcmFnbWVudDogSVJlbmRlckZyYWdtZW50KTogeyB2aWV3czogQ2hpbGRyZW5bXSwgb3B0aW9uc0NvbGxhcHNlZDogYm9vbGVhbiwgaGFzQW5jaWxsYXJpZXM6IGJvb2xlYW4gfSA9PiB7XHJcblxyXG4gICAgICAgIGlmICghZnJhZ21lbnQub3B0aW9uc1xyXG4gICAgICAgICAgICB8fCBmcmFnbWVudC5vcHRpb25zLmxlbmd0aCA9PT0gMFxyXG4gICAgICAgICAgICB8fCAhVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnQuaUtleSkgLy8gRG9uJ3QgZHJhdyBvcHRpb25zIG9mIGxpbmtzXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB2aWV3czogW10sXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zQ29sbGFwc2VkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGhhc0FuY2lsbGFyaWVzOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGZyYWdtZW50Lm9wdGlvbnMubGVuZ3RoID09PSAxXHJcbiAgICAgICAgICAgICYmIChmcmFnbWVudC5vcHRpb25zWzBdLm9wdGlvbiA9PT0gJycgLy8gaWYgb3B0aW9uIGlzIGJsYW5rXHJcbiAgICAgICAgICAgICAgICB8fCBmcmFnbWVudC5vcHRpb25zWzBdLmF1dG9NZXJnZUV4aXQgPT09IHRydWUpIC8vIGlmIGEgc2luZ2xlIGV4aXRcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHZpZXdzOiBbXSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnNDb2xsYXBzZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgaGFzQW5jaWxsYXJpZXM6IGZhbHNlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBvcHRpb25zQW5kQW5jaWxsYXJpZXMgPSBnRnJhZ21lbnRDb2RlLnNwbGl0T3B0aW9uc0FuZEFuY2lsbGFyaWVzKGZyYWdtZW50Lm9wdGlvbnMpO1xyXG4gICAgICAgIGxldCBoYXNBbmNpbGxhcmllcyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zdCB2aWV3czogQ2hpbGRyZW5bXSA9IFtcclxuXHJcbiAgICAgICAgICAgIGJ1aWxkQW5jaWxsYXJpZXNWaWV3KFxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zQW5kQW5jaWxsYXJpZXMuYW5jaWxsYXJpZXNcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICBpZiAodmlld3MubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgaGFzQW5jaWxsYXJpZXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgb3B0aW9uc1ZpZXdSZXN1bHRzID0gYnVpbGRPcHRpb25zVmlldyhcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgIG9wdGlvbnNBbmRBbmNpbGxhcmllcy5vcHRpb25zXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnNWaWV3UmVzdWx0cykge1xyXG5cclxuICAgICAgICAgICAgdmlld3MucHVzaChvcHRpb25zVmlld1Jlc3VsdHMudmlldyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB2aWV3cyxcclxuICAgICAgICAgICAgb3B0aW9uc0NvbGxhcHNlZDogb3B0aW9uc1ZpZXdSZXN1bHRzPy5pc0NvbGxhcHNlZCA/PyBmYWxzZSxcclxuICAgICAgICAgICAgaGFzQW5jaWxsYXJpZXNcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBidWlsZFZpZXcyOiAoXHJcbiAgICAgICAgZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgICAgICB2aWV3czogQ2hpbGRyZW5bXVxyXG4gICAgKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICghZnJhZ21lbnQub3B0aW9uc1xyXG4gICAgICAgICAgICB8fCBmcmFnbWVudC5vcHRpb25zLmxlbmd0aCA9PT0gMFxyXG4gICAgICAgICAgICB8fCAhVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnQuaUtleSkgLy8gRG9uJ3QgZHJhdyBvcHRpb25zIG9mIGxpbmtzXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChmcmFnbWVudC5vcHRpb25zLmxlbmd0aCA9PT0gMVxyXG4gICAgICAgICAgICAmJiAoZnJhZ21lbnQub3B0aW9uc1swXS5vcHRpb24gPT09ICcnIC8vIGlmIG9wdGlvbiBpcyBibGFua1xyXG4gICAgICAgICAgICAgICAgfHwgZnJhZ21lbnQub3B0aW9uc1swXS5hdXRvTWVyZ2VFeGl0ID09PSB0cnVlKSAvLyBpZiBhIHNpbmdsZSBleGl0XHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGZyYWdtZW50RUxlbWVudElEID0gZ0ZyYWdtZW50Q29kZS5nZXRGcmFnbWVudEVsZW1lbnRJRChmcmFnbWVudC5pZCk7XHJcbiAgICAgICAgY29uc3Qgb3B0aW9uc0FuZEFuY2lsbGFyaWVzID0gZ0ZyYWdtZW50Q29kZS5zcGxpdE9wdGlvbnNBbmRBbmNpbGxhcmllcyhmcmFnbWVudC5vcHRpb25zKTtcclxuXHJcbiAgICAgICAgYnVpbGRBbmNpbGxhcmllc0JveFZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgICAgICBvcHRpb25zQW5kQW5jaWxsYXJpZXMuYW5jaWxsYXJpZXMsXHJcbiAgICAgICAgICAgIGZyYWdtZW50RUxlbWVudElELFxyXG4gICAgICAgICAgICB2aWV3c1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGJ1aWxkT3B0aW9uc0JveFZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgICAgICBvcHRpb25zQW5kQW5jaWxsYXJpZXMub3B0aW9ucyxcclxuICAgICAgICAgICAgZnJhZ21lbnRFTGVtZW50SUQsXHJcbiAgICAgICAgICAgIHZpZXdzXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IG9wdGlvbnNWaWV3cztcclxuXHJcblxyXG4iLCJpbXBvcnQgeyBDaGlsZHJlbiB9IGZyb20gXCJoeXBlci1hcHAtbG9jYWxcIjtcclxuaW1wb3J0IHsgaCB9IGZyb20gXCIuLi8uLi8uLi8uLi9oeXBlckFwcC9oeXBlci1hcHAtbG9jYWxcIjtcclxuXHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgZnJhZ21lbnRWaWV3cyBmcm9tIFwiLi9mcmFnbWVudFZpZXdzXCI7XHJcbmltcG9ydCBnRnJhZ21lbnRDb2RlIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvY29kZS9nRnJhZ21lbnRDb2RlXCI7XHJcbmltcG9ydCBvcHRpb25zVmlld3MgZnJvbSBcIi4vb3B0aW9uc1ZpZXdzXCI7XHJcblxyXG5cclxuY29uc3QgYnVpbGRMaW5rRGlzY3Vzc2lvblZpZXcgPSAoXHJcbiAgICBmcmFnbWVudDogSVJlbmRlckZyYWdtZW50LFxyXG4gICAgdmlld3M6IENoaWxkcmVuW11cclxuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgbGV0IGFkanVzdEZvckNvbGxhcHNlZE9wdGlvbnMgPSBmYWxzZTtcclxuICAgIGxldCBhZGp1c3RGb3JQcmlvckFuY2lsbGFyaWVzID0gZmFsc2U7XHJcbiAgICBjb25zdCB2aWV3c0xlbmd0aCA9IHZpZXdzLmxlbmd0aDtcclxuXHJcbiAgICBpZiAodmlld3NMZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IGxhc3RWaWV3OiBhbnkgPSB2aWV3c1t2aWV3c0xlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgICBpZiAobGFzdFZpZXc/LnVpPy5pc0NvbGxhcHNlZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgYWRqdXN0Rm9yQ29sbGFwc2VkT3B0aW9ucyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobGFzdFZpZXc/LnVpPy5oYXNBbmNpbGxhcmllcyA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgYWRqdXN0Rm9yUHJpb3JBbmNpbGxhcmllcyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGxpbmtFTGVtZW50SUQgPSBnRnJhZ21lbnRDb2RlLmdldExpbmtFbGVtZW50SUQoZnJhZ21lbnQuaWQpO1xyXG4gICAgY29uc3QgcmVzdWx0czogeyB2aWV3czogQ2hpbGRyZW5bXSwgb3B0aW9uc0NvbGxhcHNlZDogYm9vbGVhbiwgaGFzQW5jaWxsYXJpZXM6IGJvb2xlYW4gfSA9IG9wdGlvbnNWaWV3cy5idWlsZFZpZXcoZnJhZ21lbnQpO1xyXG5cclxuICAgIGlmIChsaW5rRUxlbWVudElEID09PSAnbnRfbGtfZnJhZ190OTY4T0oxd28nKSB7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKGBSLURSQVdJTkcgJHtsaW5rRUxlbWVudElEfV9sYCk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNsYXNzZXMgPSBcIm50LWZyLWZyYWdtZW50LWJveFwiO1xyXG5cclxuICAgIGlmIChmcmFnbWVudC5jbGFzc2VzKSB7XHJcblxyXG4gICAgICAgIGlmIChmcmFnbWVudC5jbGFzc2VzKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGNsYXNzTmFtZSBvZiBmcmFnbWVudC5jbGFzc2VzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgY2xhc3NlcyA9IGAke2NsYXNzZXN9IG50LXVyLSR7Y2xhc3NOYW1lfWBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoYWRqdXN0Rm9yQ29sbGFwc2VkT3B0aW9ucyA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICBjbGFzc2VzID0gYCR7Y2xhc3Nlc30gbnQtZnItcHJpb3ItY29sbGFwc2VkLW9wdGlvbnNgXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFkanVzdEZvclByaW9yQW5jaWxsYXJpZXMgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgY2xhc3NlcyA9IGAke2NsYXNzZXN9IG50LWZyLXByaW9yLWlzLWFuY2lsbGFyeWBcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCB2aWV3ID1cclxuXHJcbiAgICAgICAgaChcImRpdlwiLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZDogYCR7bGlua0VMZW1lbnRJRH1fbGAsXHJcbiAgICAgICAgICAgICAgICBjbGFzczogYCR7Y2xhc3Nlc31gXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgIGgoXCJkaXZcIixcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiBgbnQtZnItZnJhZ21lbnQtZGlzY3Vzc2lvbmAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0YS1kaXNjdXNzaW9uXCI6IGZyYWdtZW50LnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBcIlwiXHJcbiAgICAgICAgICAgICAgICApLFxyXG5cclxuICAgICAgICAgICAgICAgIHJlc3VsdHMudmlld3NcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgaWYgKHJlc3VsdHMub3B0aW9uc0NvbGxhcHNlZCA9PT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICBjb25zdCB2aWV3QW55ID0gdmlldyBhcyBhbnk7XHJcblxyXG4gICAgICAgIGlmICghdmlld0FueS51aSkge1xyXG5cclxuICAgICAgICAgICAgdmlld0FueS51aSA9IHt9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmlld0FueS51aS5pc0NvbGxhcHNlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdHMuaGFzQW5jaWxsYXJpZXMgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgY29uc3Qgdmlld0FueSA9IHZpZXcgYXMgYW55O1xyXG5cclxuICAgICAgICBpZiAoIXZpZXdBbnkudWkpIHtcclxuXHJcbiAgICAgICAgICAgIHZpZXdBbnkudWkgPSB7fTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZpZXdBbnkudWkuaGFzQW5jaWxsYXJpZXMgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHZpZXdzLnB1c2godmlldyk7XHJcbn07XHJcblxyXG5jb25zdCBidWlsZExpbmtFeGl0c1ZpZXcgPSAoXHJcbiAgICBfZnJhZ21lbnQ6IElSZW5kZXJGcmFnbWVudCxcclxuICAgIF92aWV3OiBDaGlsZHJlbltdXHJcbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIHJldHVyblxyXG5cclxuICAgIC8vIGlmICghZnJhZ21lbnQub3B0aW9uc1xyXG4gICAgLy8gICAgIHx8IGZyYWdtZW50Lm9wdGlvbnMubGVuZ3RoID09PSAwXHJcbiAgICAvLyAgICAgfHwgIWZyYWdtZW50LnVpLmZyYWdtZW50T3B0aW9uc0V4cGFuZGVkXHJcbiAgICAvLyApIHtcclxuICAgIC8vICAgICByZXR1cm47XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLy8gaWYgKCFVLmlzTnVsbE9yV2hpdGVTcGFjZShmcmFnbWVudC5leGl0S2V5KSkge1xyXG5cclxuICAgIC8vICAgICAvLyBUaGVuIG1hcCBoYXMgYSBzaW5nbGUgZXhpdCBhbmQgaXQgd2FzIG1lcmdlZCBpbnRvIHRoaXMgZnJhZ21lbnRcclxuICAgIC8vICAgICByZXR1cm47XHJcbiAgICAvLyB9XHJcblxyXG4gICAgLy8gdmlldy5wdXNoKFxyXG5cclxuICAgIC8vICAgICBoKFwiZGl2XCIsXHJcbiAgICAvLyAgICAgICAgIHtcclxuICAgIC8vICAgICAgICAgICAgIGNsYXNzOiBcIm50LWZyLWV4aXRzLWJveFwiXHJcbiAgICAvLyAgICAgICAgIH0sXHJcbiAgICAvLyAgICAgICAgIFtcclxuICAgIC8vICAgICAgICAgICAgIG9wdGlvbnNWaWV3cy5idWlsZFZpZXcoZnJhZ21lbnQpXHJcbiAgICAvLyAgICAgICAgIF1cclxuICAgIC8vICAgICApXHJcbiAgICAvLyApO1xyXG59O1xyXG5cclxuY29uc3QgbGlua1ZpZXdzID0ge1xyXG5cclxuICAgIGJ1aWxkVmlldzogKFxyXG4gICAgICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsIHwgdW5kZWZpbmVkLFxyXG4gICAgICAgIHZpZXdzOiBDaGlsZHJlbltdXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFmcmFnbWVudFxyXG4gICAgICAgICAgICB8fCBmcmFnbWVudC51aS5kb05vdFBhaW50ID09PSB0cnVlXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJ1aWxkTGlua0Rpc2N1c3Npb25WaWV3KFxyXG4gICAgICAgICAgICBmcmFnbWVudCxcclxuICAgICAgICAgICAgdmlld3NcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBsaW5rVmlld3MuYnVpbGRWaWV3KFxyXG4gICAgICAgICAgICBmcmFnbWVudC5saW5rPy5yb290LFxyXG4gICAgICAgICAgICB2aWV3c1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGJ1aWxkTGlua0V4aXRzVmlldyhcclxuICAgICAgICAgICAgZnJhZ21lbnQsXHJcbiAgICAgICAgICAgIHZpZXdzXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgZnJhZ21lbnRWaWV3cy5idWlsZFZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LnNlbGVjdGVkLFxyXG4gICAgICAgICAgICB2aWV3c1xyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBsaW5rVmlld3M7XHJcblxyXG5cclxuIiwiaW1wb3J0IHsgQ2hpbGRyZW4gfSBmcm9tIFwiaHlwZXItYXBwLWxvY2FsXCI7XHJcbmltcG9ydCB7IGggfSBmcm9tIFwiLi4vLi4vLi4vLi4vaHlwZXJBcHAvaHlwZXItYXBwLWxvY2FsXCI7XHJcblxyXG5pbXBvcnQgSVJlbmRlckZyYWdtZW50IGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3JlbmRlci9JUmVuZGVyRnJhZ21lbnRcIjtcclxuaW1wb3J0IGdGcmFnbWVudENvZGUgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9jb2RlL2dGcmFnbWVudENvZGVcIjtcclxuaW1wb3J0IG9wdGlvbnNWaWV3cyBmcm9tIFwiLi9vcHRpb25zVmlld3NcIjtcclxuaW1wb3J0IGxpbmtWaWV3cyBmcm9tIFwiLi9saW5rVmlld3NcIjtcclxuaW1wb3J0IFUgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9nVXRpbGl0aWVzXCI7XHJcblxyXG5cclxuY29uc3QgYnVpbGREaXNjdXNzaW9uVmlldyA9IChcclxuICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQsXHJcbiAgICB2aWV3czogQ2hpbGRyZW5bXVxyXG4pOiB2b2lkID0+IHtcclxuXHJcbiAgICBpZiAoVS5pc051bGxPcldoaXRlU3BhY2UoZnJhZ21lbnQudmFsdWUpID09PSB0cnVlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBhZGp1c3RGb3JDb2xsYXBzZWRPcHRpb25zID0gZmFsc2U7XHJcbiAgICBsZXQgYWRqdXN0Rm9yUHJpb3JBbmNpbGxhcmllcyA9IGZhbHNlO1xyXG4gICAgY29uc3Qgdmlld3NMZW5ndGggPSB2aWV3cy5sZW5ndGg7XHJcblxyXG4gICAgaWYgKHZpZXdzTGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICBjb25zdCBsYXN0VmlldzogYW55ID0gdmlld3Nbdmlld3NMZW5ndGggLSAxXTtcclxuXHJcbiAgICAgICAgaWYgKGxhc3RWaWV3Py51aT8uaXNDb2xsYXBzZWQgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGFkanVzdEZvckNvbGxhcHNlZE9wdGlvbnMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGxhc3RWaWV3Py51aT8uaGFzQW5jaWxsYXJpZXMgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgIGFkanVzdEZvclByaW9yQW5jaWxsYXJpZXMgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmcmFnbWVudEVMZW1lbnRJRCA9IGdGcmFnbWVudENvZGUuZ2V0RnJhZ21lbnRFbGVtZW50SUQoZnJhZ21lbnQuaWQpO1xyXG5cclxuICAgIGxldCBjbGFzc2VzID0gXCJudC1mci1mcmFnbWVudC1ib3hcIjtcclxuXHJcbiAgICBpZiAoZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICBpZiAoZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICAgICAgZm9yIChjb25zdCBjbGFzc05hbWUgb2YgZnJhZ21lbnQuY2xhc3Nlcykge1xyXG5cclxuICAgICAgICAgICAgICAgIGNsYXNzZXMgPSBgJHtjbGFzc2VzfSBudC11ci0ke2NsYXNzTmFtZX1gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFkanVzdEZvckNvbGxhcHNlZE9wdGlvbnMgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgY2xhc3NlcyA9IGAke2NsYXNzZXN9IG50LWZyLXByaW9yLWNvbGxhcHNlZC1vcHRpb25zYFxyXG4gICAgfVxyXG5cclxuICAgIGlmIChhZGp1c3RGb3JQcmlvckFuY2lsbGFyaWVzID09PSB0cnVlKSB7XHJcblxyXG4gICAgICAgIGNsYXNzZXMgPSBgJHtjbGFzc2VzfSBudC1mci1wcmlvci1pcy1hbmNpbGxhcnlgXHJcbiAgICB9XHJcblxyXG4gICAgdmlld3MucHVzaChcclxuXHJcbiAgICAgICAgaChcImRpdlwiLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZDogYCR7ZnJhZ21lbnRFTGVtZW50SUR9X2RgLFxyXG4gICAgICAgICAgICAgICAgY2xhc3M6IGAke2NsYXNzZXN9YFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICBoKFwiZGl2XCIsXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzczogYG50LWZyLWZyYWdtZW50LWRpc2N1c3Npb25gLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGEtZGlzY3Vzc2lvblwiOiBmcmFnbWVudC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJcIlxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIClcclxuICAgICk7XHJcbn07XHJcblxyXG5jb25zdCBmcmFnbWVudFZpZXdzID0ge1xyXG5cclxuICAgIGJ1aWxkVmlldzogKFxyXG4gICAgICAgIGZyYWdtZW50OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsIHwgdW5kZWZpbmVkLFxyXG4gICAgICAgIHZpZXdzOiBDaGlsZHJlbltdXHJcbiAgICApOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFmcmFnbWVudFxyXG4gICAgICAgICAgICB8fCBmcmFnbWVudC51aS5kb05vdFBhaW50ID09PSB0cnVlXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJ1aWxkRGlzY3Vzc2lvblZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgICAgICB2aWV3c1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGxpbmtWaWV3cy5idWlsZFZpZXcoXHJcbiAgICAgICAgICAgIGZyYWdtZW50Lmxpbms/LnJvb3QsXHJcbiAgICAgICAgICAgIHZpZXdzXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgb3B0aW9uc1ZpZXdzLmJ1aWxkVmlldzIoXHJcbiAgICAgICAgICAgIGZyYWdtZW50LFxyXG4gICAgICAgICAgICB2aWV3c1xyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGZyYWdtZW50Vmlld3MuYnVpbGRWaWV3KFxyXG4gICAgICAgICAgICBmcmFnbWVudC5zZWxlY3RlZCxcclxuICAgICAgICAgICAgdmlld3NcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnJhZ21lbnRWaWV3cztcclxuXHJcblxyXG4iLCJpbXBvcnQgeyBDaGlsZHJlbiwgVk5vZGUgfSBmcm9tIFwiaHlwZXItYXBwLWxvY2FsXCI7XHJcbmltcG9ydCB7IGggfSBmcm9tIFwiLi4vLi4vLi4vLi4vaHlwZXJBcHAvaHlwZXItYXBwLWxvY2FsXCI7XHJcblxyXG5pbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgZnJhZ21lbnRWaWV3cyBmcm9tIFwiLi9mcmFnbWVudFZpZXdzXCI7XHJcbi8vIGltcG9ydCBnRGVidWdnZXJDb2RlIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvY29kZS9nRGVidWdnZXJDb2RlXCI7XHJcblxyXG5pbXBvcnQgXCIuLi9zY3NzL2ZyYWdtZW50cy5zY3NzXCI7XHJcblxyXG5cclxuY29uc3QgZ3VpZGVWaWV3cyA9IHtcclxuXHJcbiAgICBidWlsZENvbnRlbnRWaWV3OiAoc3RhdGU6IElTdGF0ZSk6IFZOb2RlID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgaW5uZXJWaWV3czogQ2hpbGRyZW5bXSA9IFtdO1xyXG5cclxuICAgICAgICBmcmFnbWVudFZpZXdzLmJ1aWxkVmlldyhcclxuICAgICAgICAgICAgc3RhdGUucmVuZGVyU3RhdGUuZGlzcGxheUd1aWRlPy5yb290LFxyXG4gICAgICAgICAgICBpbm5lclZpZXdzXHJcbiAgICAgICAgKVxyXG5cclxuICAgICAgICAvLyBnRGVidWdnZXJDb2RlLmxvZ1Jvb3Qoc3RhdGUpO1xyXG5cclxuICAgICAgICBjb25zdCB2aWV3OiBWTm9kZSA9XHJcblxyXG4gICAgICAgICAgICBoKFwiZGl2XCIsXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwibnRfZnJfRnJhZ21lbnRzXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAgICAgaW5uZXJWaWV3c1xyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gdmlldztcclxuICAgIH1cclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGd1aWRlVmlld3M7XHJcblxyXG5cclxuIiwiaW1wb3J0IHsgVk5vZGUgfSBmcm9tIFwiaHlwZXItYXBwLWxvY2FsXCI7XHJcbmltcG9ydCB7IGggfSBmcm9tIFwiLi4vLi4vLi4vLi4vaHlwZXJBcHAvaHlwZXItYXBwLWxvY2FsXCI7XHJcblxyXG5pbXBvcnQgSVN0YXRlIGZyb20gXCIuLi8uLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lTdGF0ZVwiO1xyXG5pbXBvcnQgaW5pdEFjdGlvbnMgZnJvbSBcIi4uL2FjdGlvbnMvaW5pdEFjdGlvbnNcIjtcclxuaW1wb3J0IGd1aWRlVmlld3MgZnJvbSBcIi4uLy4uL2ZyYWdtZW50cy92aWV3cy9ndWlkZVZpZXdzXCI7XHJcblxyXG5cclxuY29uc3QgaW5pdFZpZXcgPSB7XHJcblxyXG4gICAgYnVpbGRWaWV3OiAoc3RhdGU6IElTdGF0ZSk6IFZOb2RlID0+IHtcclxuXHJcbiAgICAgICAgY29uc3QgdmlldzogVk5vZGUgPVxyXG5cclxuICAgICAgICAgICAgaChcImRpdlwiLFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IGluaXRBY3Rpb25zLnNldE5vdFJhdyxcclxuICAgICAgICAgICAgICAgICAgICBpZDogXCJ0cmVlU29sdmVGcmFnbWVudHNcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICBndWlkZVZpZXdzLmJ1aWxkQ29udGVudFZpZXcoc3RhdGUpLFxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gdmlldztcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW5pdFZpZXc7XHJcblxyXG4iLCJpbXBvcnQgSVNldHRpbmdzIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL3VzZXIvSVNldHRpbmdzXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2V0dGluZ3MgaW1wbGVtZW50cyBJU2V0dGluZ3Mge1xyXG5cclxuICAgIHB1YmxpYyBrZXk6IHN0cmluZyA9IFwiLTFcIjtcclxuICAgIHB1YmxpYyByOiBzdHJpbmcgPSBcIi0xXCI7XHJcblxyXG4gICAgLy8gQXV0aGVudGljYXRpb25cclxuICAgIHB1YmxpYyB1c2VyUGF0aDogc3RyaW5nID0gYHVzZXJgO1xyXG4gICAgcHVibGljIGRlZmF1bHRMb2dvdXRQYXRoOiBzdHJpbmcgPSBgbG9nb3V0YDtcclxuICAgIHB1YmxpYyBkZWZhdWx0TG9naW5QYXRoOiBzdHJpbmcgPSBgbG9naW5gO1xyXG4gICAgcHVibGljIHJldHVyblVybFN0YXJ0OiBzdHJpbmcgPSBgcmV0dXJuVXJsYDtcclxuXHJcbiAgICBwcml2YXRlIGJhc2VVcmw6IHN0cmluZyA9ICh3aW5kb3cgYXMgYW55KS5BU1NJU1RBTlRfQkFTRV9VUkwgPz8gJyc7XHJcbiAgICBwdWJsaWMgbGlua1VybDogc3RyaW5nID0gKHdpbmRvdyBhcyBhbnkpLkFTU0lTVEFOVF9MSU5LX1VSTCA/PyAnJztcclxuICAgIHB1YmxpYyBzdWJzY3JpcHRpb25JRDogc3RyaW5nID0gKHdpbmRvdyBhcyBhbnkpLkFTU0lTVEFOVF9TVUJTQ1JJUFRJT05fSUQgPz8gJyc7XHJcblxyXG4gICAgcHVibGljIGFwaVVybDogc3RyaW5nID0gYCR7dGhpcy5iYXNlVXJsfS9hcGlgO1xyXG4gICAgcHVibGljIGJmZlVybDogc3RyaW5nID0gYCR7dGhpcy5iYXNlVXJsfS9iZmZgO1xyXG4gICAgcHVibGljIGZpbGVVcmw6IHN0cmluZyA9IGAke3RoaXMuYmFzZVVybH0vZmlsZWA7XHJcbn1cclxuIiwiXHJcbmV4cG9ydCBlbnVtIG5hdmlnYXRpb25EaXJlY3Rpb24ge1xyXG5cclxuICAgIEJ1dHRvbnMgPSAnYnV0dG9ucycsXHJcbiAgICBCYWNrd2FyZHMgPSAnYmFja3dhcmRzJyxcclxuICAgIEZvcndhcmRzID0gJ2ZvcndhcmRzJ1xyXG59XHJcblxyXG4iLCJpbXBvcnQgeyBuYXZpZ2F0aW9uRGlyZWN0aW9uIH0gZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvZW51bXMvbmF2aWdhdGlvbkRpcmVjdGlvblwiO1xyXG5pbXBvcnQgSUhpc3RvcnkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvaGlzdG9yeS9JSGlzdG9yeVwiO1xyXG5pbXBvcnQgSUhpc3RvcnlVcmwgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvaGlzdG9yeS9JSGlzdG9yeVVybFwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhpc3RvcnkgaW1wbGVtZW50cyBJSGlzdG9yeSB7XHJcblxyXG4gICAgcHVibGljIGhpc3RvcnlDaGFpbjogQXJyYXk8SUhpc3RvcnlVcmw+ID0gW107XHJcbiAgICBwdWJsaWMgZGlyZWN0aW9uOiBuYXZpZ2F0aW9uRGlyZWN0aW9uID0gbmF2aWdhdGlvbkRpcmVjdGlvbi5CdXR0b25zO1xyXG4gICAgcHVibGljIGN1cnJlbnRJbmRleDogbnVtYmVyID0gMDtcclxufVxyXG4iLCJpbXBvcnQgSVVzZXIgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvdXNlci9JVXNlclwiO1xyXG5cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFVzZXIgaW1wbGVtZW50cyBJVXNlciB7XHJcblxyXG4gICAgcHVibGljIGtleTogc3RyaW5nID0gYDAxMjM0NTY3ODlgO1xyXG4gICAgcHVibGljIHI6IHN0cmluZyA9IFwiLTFcIjtcclxuICAgIHB1YmxpYyB1c2VWc0NvZGU6IGJvb2xlYW4gPSB0cnVlO1xyXG4gICAgcHVibGljIGF1dGhvcmlzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHB1YmxpYyByYXc6IGJvb2xlYW4gPSB0cnVlO1xyXG4gICAgcHVibGljIGxvZ291dFVybDogc3RyaW5nID0gXCJcIjtcclxuICAgIHB1YmxpYyBzaG93TWVudTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIG5hbWU6IHN0cmluZyA9IFwiXCI7XHJcbiAgICBwdWJsaWMgc3ViOiBzdHJpbmcgPSBcIlwiO1xyXG59XHJcbiIsImltcG9ydCBJUmVwZWF0RWZmZWN0cyBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9lZmZlY3RzL0lSZXBlYXRFZmZlY3RzXCI7XHJcbmltcG9ydCBJSHR0cEVmZmVjdCBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9lZmZlY3RzL0lIdHRwRWZmZWN0XCI7XHJcbmltcG9ydCBJQWN0aW9uIGZyb20gXCIuLi8uLi9pbnRlcmZhY2VzL3N0YXRlL0lBY3Rpb25cIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBlYXRlRWZmZWN0cyBpbXBsZW1lbnRzIElSZXBlYXRFZmZlY3RzIHtcclxuXHJcbiAgICBwdWJsaWMgc2hvcnRJbnRlcnZhbEh0dHA6IEFycmF5PElIdHRwRWZmZWN0PiA9IFtdO1xyXG4gICAgcHVibGljIHJlTG9hZEdldEh0dHBJbW1lZGlhdGU6IEFycmF5PElIdHRwRWZmZWN0PiA9IFtdO1xyXG4gICAgcHVibGljIHJ1bkFjdGlvbkltbWVkaWF0ZTogQXJyYXk8SUFjdGlvbj4gPSBbXTtcclxufVxyXG4iLCJpbXBvcnQgSVJlbmRlclN0YXRlVUkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvdWkvSVJlbmRlclN0YXRlVUlcIjtcclxuXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZW5kZXJTdGF0ZVVJIGltcGxlbWVudHMgSVJlbmRlclN0YXRlVUkge1xyXG5cclxuICAgIHB1YmxpYyByYXc6IGJvb2xlYW4gPSB0cnVlO1xyXG4gICAgcHVibGljIG9wdGlvbnNFeHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG59XHJcbiIsImltcG9ydCBJRGlzcGxheUd1aWRlIGZyb20gXCIuLi9pbnRlcmZhY2VzL3N0YXRlL2Rpc3BsYXkvSURpc3BsYXlHdWlkZVwiO1xyXG5pbXBvcnQgSURpc3BsYXlTZWN0aW9uIGZyb20gXCIuLi9pbnRlcmZhY2VzL3N0YXRlL2Rpc3BsYXkvSURpc3BsYXlTZWN0aW9uXCI7XHJcbmltcG9ydCBJUmVuZGVyU3RhdGUgZnJvbSBcIi4uL2ludGVyZmFjZXMvc3RhdGUvSVJlbmRlclN0YXRlXCI7XHJcbmltcG9ydCBJUmVuZGVyRnJhZ21lbnQgZnJvbSBcIi4uL2ludGVyZmFjZXMvc3RhdGUvcmVuZGVyL0lSZW5kZXJGcmFnbWVudFwiO1xyXG5pbXBvcnQgSUNoYWluU2VnbWVudCBmcm9tIFwiLi4vaW50ZXJmYWNlcy9zdGF0ZS9zZWdtZW50cy9JQ2hhaW5TZWdtZW50XCI7XHJcbmltcG9ydCBJUmVuZGVyU3RhdGVVSSBmcm9tIFwiLi4vaW50ZXJmYWNlcy9zdGF0ZS91aS9JUmVuZGVyU3RhdGVVSVwiO1xyXG5pbXBvcnQgUmVuZGVyU3RhdGVVSSBmcm9tIFwiLi91aS9SZW5kZXJTdGF0ZVVJXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVuZGVyU3RhdGUgaW1wbGVtZW50cyBJUmVuZGVyU3RhdGUge1xyXG5cclxuICAgIHB1YmxpYyByZWZyZXNoVXJsOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgaXNDaGFpbkxvYWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHB1YmxpYyBzZWdtZW50czogQXJyYXk8SUNoYWluU2VnbWVudD4gPSBbXTtcclxuICAgIHB1YmxpYyBkaXNwbGF5R3VpZGU6IElEaXNwbGF5R3VpZGUgfCBudWxsID0gbnVsbDtcclxuICAgIHB1YmxpYyBvdXRsaW5lczogYW55ID0ge307XHJcbiAgICBwdWJsaWMgb3V0bGluZVVybHM6IGFueSA9IHt9O1xyXG4gICAgcHVibGljIGN1cnJlbnRTZWN0aW9uOiBJRGlzcGxheVNlY3Rpb24gfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICBwdWJsaWMgYWN0aXZlQW5jaWxsYXJ5OiBJUmVuZGVyRnJhZ21lbnQgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgICAvLyBTZWFyY2ggaW5kaWNlc1xyXG4gICAgcHVibGljIGluZGV4X291dGxpbmVOb2Rlc19pZDogYW55ID0ge307XHJcbiAgICBwdWJsaWMgaW5kZXhfY2hhaW5GcmFnbWVudHNfaWQ6IGFueSA9IHt9O1xyXG5cclxuICAgIHB1YmxpYyB1aTogSVJlbmRlclN0YXRlVUkgPSBuZXcgUmVuZGVyU3RhdGVVSSgpO1xyXG59XHJcbiIsImltcG9ydCBJU3RhdGUgZnJvbSBcIi4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBTZXR0aW5ncyBmcm9tIFwiLi91c2VyL1NldHRpbmdzXCI7XHJcbmltcG9ydCBJU2V0dGluZ3MgZnJvbSBcIi4uL2ludGVyZmFjZXMvc3RhdGUvdXNlci9JU2V0dGluZ3NcIjtcclxuaW1wb3J0IElIaXN0b3J5IGZyb20gXCIuLi9pbnRlcmZhY2VzL3N0YXRlL2hpc3RvcnkvSUhpc3RvcnlcIjtcclxuaW1wb3J0IFN0ZXBIaXN0b3J5IGZyb20gXCIuL2hpc3RvcnkvSGlzdG9yeVwiO1xyXG5pbXBvcnQgSVVzZXIgZnJvbSBcIi4uL2ludGVyZmFjZXMvc3RhdGUvdXNlci9JVXNlclwiO1xyXG5pbXBvcnQgVXNlciBmcm9tIFwiLi91c2VyL1VzZXJcIjtcclxuaW1wb3J0IElSZXBlYXRFZmZlY3RzIGZyb20gXCIuLi9pbnRlcmZhY2VzL3N0YXRlL2VmZmVjdHMvSVJlcGVhdEVmZmVjdHNcIjtcclxuaW1wb3J0IFJlcGVhdGVFZmZlY3RzIGZyb20gXCIuL2VmZmVjdHMvUmVwZWF0ZUVmZmVjdHNcIjtcclxuaW1wb3J0IElSZW5kZXJTdGF0ZSBmcm9tIFwiLi4vaW50ZXJmYWNlcy9zdGF0ZS9JUmVuZGVyU3RhdGVcIjtcclxuaW1wb3J0IFJlbmRlclN0YXRlIGZyb20gXCIuL1JlbmRlclN0YXRlXCI7XHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3RhdGUgaW1wbGVtZW50cyBJU3RhdGUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgICAgICBjb25zdCBzZXR0aW5nczogSVNldHRpbmdzID0gbmV3IFNldHRpbmdzKCk7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBsb2FkaW5nOiBib29sZWFuID0gdHJ1ZTtcclxuICAgIHB1YmxpYyBkZWJ1ZzogYm9vbGVhbiA9IHRydWU7XHJcbiAgICBwdWJsaWMgZ2VuZXJpY0Vycm9yOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgbmV4dEtleTogbnVtYmVyID0gLTE7XHJcbiAgICBwdWJsaWMgc2V0dGluZ3M6IElTZXR0aW5ncztcclxuICAgIHB1YmxpYyB1c2VyOiBJVXNlciA9IG5ldyBVc2VyKCk7XHJcbiAgICBcclxuICAgIHB1YmxpYyByZW5kZXJTdGF0ZTogSVJlbmRlclN0YXRlID0gbmV3IFJlbmRlclN0YXRlKCk7XHJcblxyXG4gICAgcHVibGljIHJlcGVhdEVmZmVjdHM6IElSZXBlYXRFZmZlY3RzID0gbmV3IFJlcGVhdGVFZmZlY3RzKCk7XHJcblxyXG4gICAgcHVibGljIHN0ZXBIaXN0b3J5OiBJSGlzdG9yeSA9IG5ldyBTdGVwSGlzdG9yeSgpO1xyXG59XHJcblxyXG5cclxuIiwiXHJcbmltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBVIGZyb20gXCIuLi9nVXRpbGl0aWVzXCI7XHJcbmltcG9ydCB7IEFjdGlvblR5cGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9BY3Rpb25UeXBlXCI7XHJcbmltcG9ydCBnU3RhdGVDb2RlIGZyb20gXCIuLi9jb2RlL2dTdGF0ZUNvZGVcIjtcclxuaW1wb3J0IHsgSUh0dHBGZXRjaEl0ZW0gfSBmcm9tIFwiLi4vLi4vaW50ZXJmYWNlcy9odHRwL0lIdHRwRmV0Y2hJdGVtXCI7XHJcbmltcG9ydCB7IGdBdXRoZW50aWNhdGVkSHR0cCB9IGZyb20gXCIuLi9odHRwL2dBdXRoZW50aWNhdGlvbkh0dHBcIjtcclxuaW1wb3J0IGdBamF4SGVhZGVyQ29kZSBmcm9tIFwiLi4vaHR0cC9nQWpheEhlYWRlckNvZGVcIjtcclxuaW1wb3J0IGdSZW5kZXJBY3Rpb25zIGZyb20gXCIuLi9hY3Rpb25zL2dPdXRsaW5lQWN0aW9uc1wiO1xyXG5pbXBvcnQgSVN0YXRlQW55QXJyYXkgZnJvbSBcIi4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlQW55QXJyYXlcIjtcclxuaW1wb3J0IGdGaWxlQ29uc3RhbnRzIGZyb20gXCIuLi9nRmlsZUNvbnN0YW50c1wiO1xyXG5pbXBvcnQgZ091dGxpbmVDb2RlIGZyb20gXCIuLi9jb2RlL2dPdXRsaW5lQ29kZVwiO1xyXG5cclxuXHJcbmNvbnN0IGdldEd1aWRlT3V0bGluZSA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBmcmFnbWVudEZvbGRlclVybDogc3RyaW5nIHwgbnVsbCxcclxuICAgIGxvYWREZWxlZ2F0ZTogKHN0YXRlOiBJU3RhdGUsIG91dGxpbmVSZXNwb25zZTogYW55KSA9PiBJU3RhdGVBbnlBcnJheVxyXG4pOiBJSHR0cEZldGNoSXRlbSB8IHVuZGVmaW5lZCA9PiB7XHJcblxyXG4gICAgaWYgKFUuaXNOdWxsT3JXaGl0ZVNwYWNlKGZyYWdtZW50Rm9sZGVyVXJsKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBjYWxsSUQ6IHN0cmluZyA9IFUuZ2VuZXJhdGVHdWlkKCk7XHJcblxyXG4gICAgbGV0IGhlYWRlcnMgPSBnQWpheEhlYWRlckNvZGUuYnVpbGRIZWFkZXJzKFxyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIGNhbGxJRCxcclxuICAgICAgICBBY3Rpb25UeXBlLkdldE91dGxpbmVcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgdXJsOiBzdHJpbmcgPSBgJHtmcmFnbWVudEZvbGRlclVybH0vJHtnRmlsZUNvbnN0YW50cy5ndWlkZU91dGxpbmVGaWxlbmFtZX1gO1xyXG5cclxuICAgIGNvbnN0IGxvYWRSZXF1ZXN0ZWQgPSBnT3V0bGluZUNvZGUucmVnaXN0ZXJPdXRsaW5lVXJsRG93bmxvYWQoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgdXJsXHJcbiAgICApO1xyXG5cclxuICAgIGlmIChsb2FkUmVxdWVzdGVkID09PSB0cnVlKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBnQXV0aGVudGljYXRlZEh0dHAoe1xyXG4gICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVzcG9uc2U6ICdqc29uJyxcclxuICAgICAgICBhY3Rpb246IGxvYWREZWxlZ2F0ZSxcclxuICAgICAgICBlcnJvcjogKHN0YXRlOiBJU3RhdGUsIGVycm9yRGV0YWlsczogYW55KSA9PiB7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhge1xyXG4gICAgICAgICAgICAgICAgXCJtZXNzYWdlXCI6IFwiRXJyb3IgZ2V0dGluZyBvdXRsaW5lIGRhdGEgZnJvbSB0aGUgc2VydmVyLlwiLFxyXG4gICAgICAgICAgICAgICAgXCJ1cmxcIjogJHt1cmx9LFxyXG4gICAgICAgICAgICAgICAgXCJlcnJvciBEZXRhaWxzXCI6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3JEZXRhaWxzKX0sXHJcbiAgICAgICAgICAgICAgICBcInN0YWNrXCI6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3JEZXRhaWxzLnN0YWNrKX0sXHJcbiAgICAgICAgICAgICAgICBcIm1ldGhvZFwiOiAke2dSZW5kZXJFZmZlY3RzLmdldEd1aWRlT3V0bGluZS5uYW1lfSxcclxuICAgICAgICAgICAgICAgIFwiY2FsbElEOiAke2NhbGxJRH1cclxuICAgICAgICAgICAgfWApO1xyXG5cclxuICAgICAgICAgICAgYWxlcnQoYHtcclxuICAgICAgICAgICAgICAgIFwibWVzc2FnZVwiOiBcIkVycm9yIGdldHRpbmcgb3V0bGluZSBkYXRhIGZyb20gdGhlIHNlcnZlci5cIixcclxuICAgICAgICAgICAgICAgIFwidXJsXCI6ICR7dXJsfSxcclxuICAgICAgICAgICAgICAgIFwiZXJyb3IgRGV0YWlsc1wiOiAke0pTT04uc3RyaW5naWZ5KGVycm9yRGV0YWlscyl9LFxyXG4gICAgICAgICAgICAgICAgXCJzdGFja1wiOiAke0pTT04uc3RyaW5naWZ5KGVycm9yRGV0YWlscy5zdGFjayl9LFxyXG4gICAgICAgICAgICAgICAgXCJtZXRob2RcIjogJHtnUmVuZGVyRWZmZWN0cy5nZXRHdWlkZU91dGxpbmUubmFtZX0sXHJcbiAgICAgICAgICAgICAgICBcImNhbGxJRDogJHtjYWxsSUR9XHJcbiAgICAgICAgICAgIH1gKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnU3RhdGVDb2RlLmNsb25lU3RhdGUoc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuY29uc3QgZ1JlbmRlckVmZmVjdHMgPSB7XHJcblxyXG4gICAgZ2V0R3VpZGVPdXRsaW5lOiAoc3RhdGU6IElTdGF0ZSk6IElIdHRwRmV0Y2hJdGVtIHwgdW5kZWZpbmVkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKCFzdGF0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBmcmFnbWVudEZvbGRlclVybDogc3RyaW5nID0gc3RhdGUucmVuZGVyU3RhdGUuZGlzcGxheUd1aWRlPy5ndWlkZS5mcmFnbWVudEZvbGRlclVybCA/PyAnbnVsbCc7XHJcblxyXG4gICAgICAgIGNvbnN0IGxvYWREZWxlZ2F0ZSA9IChcclxuICAgICAgICAgICAgc3RhdGU6IElTdGF0ZSxcclxuICAgICAgICAgICAgb3V0bGluZVJlc3BvbnNlOiBhbnlcclxuICAgICAgICApOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ1JlbmRlckFjdGlvbnMubG9hZEd1aWRlT3V0bGluZVByb3BlcnRpZXMoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZSxcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdldEd1aWRlT3V0bGluZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsLFxyXG4gICAgICAgICAgICBsb2FkRGVsZWdhdGVcclxuICAgICAgICApO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRHdWlkZU91dGxpbmVBbmRMb2FkU2VnbWVudHM6IChzdGF0ZTogSVN0YXRlKTogSUh0dHBGZXRjaEl0ZW0gfCB1bmRlZmluZWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGZyYWdtZW50Rm9sZGVyVXJsOiBzdHJpbmcgPSBzdGF0ZS5yZW5kZXJTdGF0ZS5kaXNwbGF5R3VpZGU/Lmd1aWRlLmZyYWdtZW50Rm9sZGVyVXJsID8/ICdudWxsJztcclxuXHJcbiAgICAgICAgY29uc3QgbG9hZERlbGVnYXRlID0gKFxyXG4gICAgICAgICAgICBzdGF0ZTogSVN0YXRlLFxyXG4gICAgICAgICAgICBvdXRsaW5lUmVzcG9uc2U6IGFueVxyXG4gICAgICAgICk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnUmVuZGVyQWN0aW9ucy5sb2FkR3VpZGVPdXRsaW5lQW5kU2VnbWVudHMoXHJcbiAgICAgICAgICAgICAgICBzdGF0ZSxcclxuICAgICAgICAgICAgICAgIG91dGxpbmVSZXNwb25zZSxcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGdldEd1aWRlT3V0bGluZShcclxuICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgIGZyYWdtZW50Rm9sZGVyVXJsLFxyXG4gICAgICAgICAgICBsb2FkRGVsZWdhdGVcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZ1JlbmRlckVmZmVjdHM7XHJcbiIsImltcG9ydCBJU3RhdGUgZnJvbSBcIi4uLy4uLy4uL2ludGVyZmFjZXMvc3RhdGUvSVN0YXRlXCI7XHJcbmltcG9ydCBJU3RhdGVBbnlBcnJheSBmcm9tIFwiLi4vLi4vLi4vaW50ZXJmYWNlcy9zdGF0ZS9JU3RhdGVBbnlBcnJheVwiO1xyXG5pbXBvcnQgU3RhdGUgZnJvbSBcIi4uLy4uLy4uL3N0YXRlL1N0YXRlXCI7XHJcbmltcG9ydCBUcmVlU29sdmUgZnJvbSBcIi4uLy4uLy4uL3N0YXRlL3dpbmRvdy9UcmVlU29sdmVcIjtcclxuaW1wb3J0IFUgZnJvbSBcIi4uLy4uLy4uL2dsb2JhbC9nVXRpbGl0aWVzXCI7XHJcbmltcG9ydCBnUmVuZGVyRWZmZWN0cyBmcm9tIFwiLi4vLi4vLi4vZ2xvYmFsL2VmZmVjdHMvZ1JlbmRlckVmZmVjdHNcIjtcclxuaW1wb3J0IGdSZW5kZXJDb2RlIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvY29kZS9nUmVuZGVyQ29kZVwiO1xyXG5pbXBvcnQgZ1NlZ21lbnRDb2RlIGZyb20gXCIuLi8uLi8uLi9nbG9iYWwvY29kZS9nU2VnbWVudENvZGVcIjtcclxuaW1wb3J0IHsgT3V0bGluZVR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vaW50ZXJmYWNlcy9lbnVtcy9PdXRsaW5lVHlwZVwiO1xyXG5cclxuXHJcbmNvbnN0IGluaXRpYWxpc2VTdGF0ZSA9ICgpOiBJU3RhdGUgPT4ge1xyXG5cclxuICAgIGlmICghd2luZG93LlRyZWVTb2x2ZSkge1xyXG5cclxuICAgICAgICB3aW5kb3cuVHJlZVNvbHZlID0gbmV3IFRyZWVTb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHN0YXRlOiBJU3RhdGUgPSBuZXcgU3RhdGUoKTtcclxuICAgIGdSZW5kZXJDb2RlLnBhcnNlUmVuZGVyaW5nQ29tbWVudChzdGF0ZSk7XHJcblxyXG4gICAgcmV0dXJuIHN0YXRlO1xyXG59O1xyXG5cclxuY29uc3QgYnVpbGRSZW5kZXJEaXNwbGF5ID0gKHN0YXRlOiBJU3RhdGUpOiBJU3RhdGVBbnlBcnJheSA9PiB7XHJcblxyXG4gICAgaWYgKCFzdGF0ZS5yZW5kZXJTdGF0ZS5kaXNwbGF5R3VpZGU/LnJvb3QpIHtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChVLmlzTnVsbE9yV2hpdGVTcGFjZShzdGF0ZS5yZW5kZXJTdGF0ZS5kaXNwbGF5R3VpZGU/LnJvb3QuaUtleSkgPT09IHRydWVcclxuICAgICAgICAmJiAoIXN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZT8ucm9vdC5vcHRpb25zXHJcbiAgICAgICAgICAgIHx8IHN0YXRlLnJlbmRlclN0YXRlLmRpc3BsYXlHdWlkZT8ucm9vdC5vcHRpb25zLmxlbmd0aCA9PT0gMClcclxuICAgICkge1xyXG4gICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIGdSZW5kZXJFZmZlY3RzLmdldEd1aWRlT3V0bGluZShzdGF0ZSlcclxuICAgIF07XHJcbn07XHJcblxyXG5jb25zdCBidWlsZFNlZ21lbnRzUmVuZGVyRGlzcGxheSA9IChcclxuICAgIHN0YXRlOiBJU3RhdGUsXHJcbiAgICBxdWVyeVN0cmluZzogc3RyaW5nXHJcbik6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICBzdGF0ZS5yZW5kZXJTdGF0ZS5pc0NoYWluTG9hZCA9IHRydWU7XHJcblxyXG4gICAgZ1NlZ21lbnRDb2RlLnBhcnNlU2VnbWVudHMoXHJcbiAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgcXVlcnlTdHJpbmdcclxuICAgICk7XHJcblxyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBzdGF0ZS5yZW5kZXJTdGF0ZS5zZWdtZW50cztcclxuXHJcbiAgICBpZiAoc2VnbWVudHMubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoc2VnbWVudHMubGVuZ3RoID09PSAxKSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZXJlIHdhcyBvbmx5IDEgc2VnbWVudFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByb290U2VnbWVudCA9IHNlZ21lbnRzWzBdO1xyXG5cclxuICAgIGlmICghcm9vdFNlZ21lbnQuc3RhcnQuaXNSb290KSB7XHJcblxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkd1aWRlUm9vdCBub3QgcHJlc2VudFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBmaXJzdFNlZ21lbnQgPSBzZWdtZW50c1sxXTtcclxuXHJcbiAgICBpZiAoIWZpcnN0U2VnbWVudC5zdGFydC5pc0xhc3RcclxuICAgICAgICAmJiBmaXJzdFNlZ21lbnQuc3RhcnQudHlwZSAhPT0gT3V0bGluZVR5cGUuTGlua1xyXG4gICAgKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBxdWVyeSBzdHJpbmcgZm9ybWF0IC0gaXQgc2hvdWxkIHN0YXJ0IHdpdGggJy0nIG9yICd+J1wiKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIHN0YXRlLFxyXG4gICAgICAgIGdSZW5kZXJFZmZlY3RzLmdldEd1aWRlT3V0bGluZUFuZExvYWRTZWdtZW50cyhzdGF0ZSlcclxuICAgIF07XHJcbn07XHJcblxyXG5jb25zdCBpbml0U3RhdGUgPSB7XHJcblxyXG4gICAgaW5pdGlhbGlzZTogKCk6IElTdGF0ZUFueUFycmF5ID0+IHtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdGU6IElTdGF0ZSA9IGluaXRpYWxpc2VTdGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IHF1ZXJ5U3RyaW5nOiBzdHJpbmcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoO1xyXG5cclxuICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgaWYgKCFVLmlzTnVsbE9yV2hpdGVTcGFjZShxdWVyeVN0cmluZykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYnVpbGRTZWdtZW50c1JlbmRlckRpc3BsYXkoXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgcXVlcnlTdHJpbmdcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBidWlsZFJlbmRlckRpc3BsYXkoc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZTogYW55KSB7XHJcblxyXG4gICAgICAgICAgICBzdGF0ZS5nZW5lcmljRXJyb3IgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgaW5pdFN0YXRlO1xyXG5cclxuIiwiaW1wb3J0IEZpbHRlcnMgZnJvbSBcIi4uLy4uLy4uL3N0YXRlL2NvbnN0YW50cy9GaWx0ZXJzXCI7XHJcbmltcG9ydCBUcmVlU29sdmUgZnJvbSBcIi4uLy4uLy4uL3N0YXRlL3dpbmRvdy9UcmVlU29sdmVcIjtcclxuXHJcblxyXG5jb25zdCByZW5kZXJDb21tZW50cyA9IHtcclxuXHJcbiAgICByZWdpc3Rlckd1aWRlQ29tbWVudDogKCkgPT4ge1xyXG5cclxuICAgICAgICBjb25zdCB0cmVlU29sdmVHdWlkZTogSFRNTERpdkVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChGaWx0ZXJzLnRyZWVTb2x2ZUd1aWRlSUQpIGFzIEhUTUxEaXZFbGVtZW50O1xyXG5cclxuICAgICAgICBpZiAodHJlZVNvbHZlR3VpZGVcclxuICAgICAgICAgICAgJiYgdHJlZVNvbHZlR3VpZGUuaGFzQ2hpbGROb2RlcygpID09PSB0cnVlXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGxldCBjaGlsZE5vZGU6IENoaWxkTm9kZTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHJlZVNvbHZlR3VpZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgICAgICAgICAgIGNoaWxkTm9kZSA9IHRyZWVTb2x2ZUd1aWRlLmNoaWxkTm9kZXNbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkTm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5DT01NRU5UX05PREUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF3aW5kb3cuVHJlZVNvbHZlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuVHJlZVNvbHZlID0gbmV3IFRyZWVTb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LlRyZWVTb2x2ZS5yZW5kZXJpbmdDb21tZW50ID0gY2hpbGROb2RlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkTm9kZS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChjaGlsZE5vZGUubm9kZVR5cGUgIT09IE5vZGUuVEVYVF9OT0RFKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHJlbmRlckNvbW1lbnRzO1xyXG4iLCJpbXBvcnQgeyBhcHAgfSBmcm9tIFwiLi9oeXBlckFwcC9oeXBlci1hcHAtbG9jYWxcIjtcclxuXHJcbmltcG9ydCBpbml0U3Vic2NyaXB0aW9ucyBmcm9tIFwiLi9tb2R1bGVzL2NvbXBvbmVudHMvaW5pdC9zdWJzY3JpcHRpb25zL2luaXRTdWJzY3JpcHRpb25zXCI7XHJcbmltcG9ydCBpbml0RXZlbnRzIGZyb20gXCIuL21vZHVsZXMvY29tcG9uZW50cy9pbml0L2NvZGUvaW5pdEV2ZW50c1wiO1xyXG5pbXBvcnQgaW5pdFZpZXcgZnJvbSBcIi4vbW9kdWxlcy9jb21wb25lbnRzL2luaXQvdmlld3MvaW5pdFZpZXdcIjtcclxuaW1wb3J0IGluaXRTdGF0ZSBmcm9tIFwiLi9tb2R1bGVzL2NvbXBvbmVudHMvaW5pdC9jb2RlL2luaXRTdGF0ZVwiO1xyXG5pbXBvcnQgcmVuZGVyQ29tbWVudHMgZnJvbSBcIi4vbW9kdWxlcy9jb21wb25lbnRzL2luaXQvY29kZS9yZW5kZXJDb21tZW50c1wiO1xyXG5cclxuXHJcbmluaXRFdmVudHMucmVnaXN0ZXJHbG9iYWxFdmVudHMoKTtcclxucmVuZGVyQ29tbWVudHMucmVnaXN0ZXJHdWlkZUNvbW1lbnQoKTtcclxuXHJcbih3aW5kb3cgYXMgYW55KS5Db21wb3NpdGVGbG93c0F1dGhvciA9IGFwcCh7XHJcbiAgICBcclxuICAgIG5vZGU6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidHJlZVNvbHZlRnJhZ21lbnRzXCIpLFxyXG4gICAgaW5pdDogaW5pdFN0YXRlLmluaXRpYWxpc2UsXHJcbiAgICB2aWV3OiBpbml0Vmlldy5idWlsZFZpZXcsXHJcbiAgICBzdWJzY3JpcHRpb25zOiBpbml0U3Vic2NyaXB0aW9ucyxcclxuICAgIG9uRW5kOiBpbml0RXZlbnRzLm9uUmVuZGVyRmluaXNoZWRcclxufSk7XHJcblxyXG5cclxuIl0sInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlsxOV0sIm1hcHBpbmdzIjoiO0FBQUEsSUFBSSxnQkFBZ0I7QUFDcEIsSUFBSSxZQUFZO0FBQ2hCLElBQUksWUFBWTtBQUNoQixJQUFJLFlBQVksRUFBRTtBQUNsQixJQUFJLFlBQVksRUFBRTtBQUNsQixJQUFJLE1BQU0sVUFBVTtBQUNwQixJQUFJLFVBQVUsTUFBTTtBQUNwQixJQUFJLFFBQ0YsT0FBTywwQkFBMEIsY0FDN0Isd0JBQ0E7QUFFTixJQUFJLGNBQWMsU0FBUyxLQUFLO0NBQzlCLElBQUksTUFBTTtBQUVWLEtBQUksT0FBTyxRQUFRLFNBQVUsUUFBTztBQUVwQyxLQUFJLFFBQVEsSUFBSSxJQUFJLElBQUksU0FBUztPQUMxQixJQUFJLElBQUksR0FBRyxLQUFLLElBQUksSUFBSSxRQUFRLElBQ25DLE1BQUssTUFBTSxZQUFZLElBQUksR0FBRyxNQUFNLEdBQ2xDLFNBQVEsT0FBTyxPQUFPO09BSTFCLE1BQUssSUFBSSxLQUFLLElBQ1osS0FBSSxJQUFJLEdBQ04sU0FBUSxPQUFPLE9BQU87QUFLNUIsUUFBTzs7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