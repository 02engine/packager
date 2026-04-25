(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["packager-options-ui"],{

/***/ "./node_modules/jsdom/lib/api.js":
/*!***************************************!*\
  !*** ./node_modules/jsdom/lib/api.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

throw new Error("Module parse failed: Unexpected token (140:46)\nYou may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders\n|           url: req.href + originalHash,\n|           contentType: res.headers[\"content-type\"],\n>           referrer: req.getHeader(\"referer\") ?? undefined\n|         });\n| ");

/***/ }),

/***/ "./node_modules/node-fetch/browser.js":
/*!********************************************!*\
  !*** ./node_modules/node-fetch/browser.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
}

var globalObject = getGlobal();

module.exports = exports = globalObject.fetch;

// Needed for TypeScript and Webpack.
if (globalObject.fetch) {
	exports.default = globalObject.fetch.bind(globalObject);
}

exports.Headers = globalObject.Headers;
exports.Request = globalObject.Request;
exports.Response = globalObject.Response;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./src/common/escape-xml.js":
/*!**********************************!*\
  !*** ./src/common/escape-xml.js ***!
  \**********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const escapeXML = v => v.replace(/["'<>&]/g, i => {
  switch (i) {
    case '"':
      return '&quot;';
    case '\'':
      return '&apos;';
    case '<':
      return '&lt;';
    case '>':
      return '&gt;';
    case '&':
      return '&amp;';
  }
});
/* harmony default export */ __webpack_exports__["default"] = (escapeXML);

/***/ }),

/***/ "./src/common/idb.js":
/*!***************************!*\
  !*** ./src/common/idb.js ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const TRANSACTION_TIMEOUT_MS = 10 * 1000;

// https://github.com/jakearchibald/safari-14-idb-fix/blob/582bbdc7230891113bfb5743391550cbf29d21f2/src/index.ts
const idbReady = () => {
  const isSafari = !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent);

  // No point putting other browsers or older versions of Safari through this mess.
  if (!isSafari || !indexedDB.databases) return Promise.resolve();
  let intervalId;
  return new Promise(resolve => {
    const tryIdb = () => indexedDB.databases().finally(resolve);
    intervalId = setInterval(tryIdb, 100);
    tryIdb();
  }).finally(() => clearInterval(intervalId));
};
const allDatabases = [];
class Database {
  constructor(name, version, storeName) {
    this.name = name;
    this.version = version;
    this.storeName = storeName;
    this.db = null;
    this.dbPromise = null;
    allDatabases.push(this);
  }

  /**
   * @returns {IDBDatabase|Promise<IDBDatabase>}
   */
  open() {
    if (this.db) {
      return this.db;
    }
    if (this.dbPromise) {
      return this.dbPromise;
    }
    if (typeof indexedDB === 'undefined') {
      throw new Error('indexedDB is not supported');
    }
    this.dbPromise = idbReady().then(() => new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);
      request.onupgradeneeded = e => {
        const db = e.target.result;
        db.createObjectStore(this.storeName, {
          keyPath: 'id'
        });
      };
      request.onsuccess = e => {
        const db = e.target.result;
        resolve(db);
      };
      request.onerror = e => {
        reject(new Error("IDB Error ".concat(e.target.error)));
      };
    })).then(db => {
      this.dbPromise = null;
      this.db = db;
      return db;
    }).catch(err => {
      this.dbPromise = null;
      throw err;
    });
    return this.dbPromise;
  }
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    if (this.dbPromise) {
      this.dbPromise.then(db => {
        db.close();
      });
      this.dbPromise = null;
    }
  }
  async createTransaction(readwrite) {
    const db = await this.open();
    const transaction = db.transaction(this.storeName, readwrite);
    const store = transaction.objectStore(this.storeName);
    return {
      db,
      transaction,
      store
    };
  }
  async deleteEverything() {
    const {
      transaction,
      store
    } = await this.createTransaction('readwrite');
    return new Promise((resolve, reject) => {
      Database.setTransactionErrorHandler(transaction, reject);
      const request = store.clear();
      request.onsuccess = () => {
        resolve();
      };
    });
  }
}

/**
 * @param {IDBTransaction} transaction
 * @param {function} reject
 */
Database.setTransactionErrorHandler = (transaction, reject) => {
  const timeoutId = setTimeout(() => {
    reject(new Error('Transaction timed out'));
    transaction.abort();
  }, TRANSACTION_TIMEOUT_MS);
  transaction.oncomplete = () => {
    clearTimeout(timeoutId);
  };
  transaction.onerror = e => {
    clearTimeout(timeoutId);
    reject(new Error("Transaction error: ".concat(e.target.error)));
  };
  transaction.onabort = () => {
    clearTimeout(timeoutId);
    reject(new Error('Transaction aborted'));
  };
};
const closeAllDatabases = () => {
  for (const database of allDatabases) {
    database.close();
  }
};
// Closing databases makes us more likely to be put in the browser's back/forward cache
window.addEventListener('pagehide', closeAllDatabases);
/* harmony default export */ __webpack_exports__["default"] = (Database);

/***/ }),

/***/ "./src/p4/ColorPicker.svelte":
/*!***********************************!*\
  !*** ./src/p4/ColorPicker.svelte ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_internal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/internal */ "./node_modules/svelte/internal/index.mjs");
/* src/p4/ColorPicker.svelte generated by Svelte v3.59.2 */


function create_fragment(ctx) {
	let input;
	let mounted;
	let dispose;

	return {
		c() {
			input = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input, "type", "color");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, input, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input, /*value*/ ctx[0]);

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input, "input", /*input_input_handler*/ ctx[1]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*value*/ 1) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input, /*value*/ ctx[0]);
			}
		},
		i: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		o: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(input);
			mounted = false;
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { value } = $$props;

	function input_input_handler() {
		value = this.value;
		$$invalidate(0, value);
	}

	$$self.$$set = $$props => {
		if ('value' in $$props) $$invalidate(0, value = $$props.value);
	};

	return [value, input_input_handler];
}

class ColorPicker extends svelte_internal__WEBPACK_IMPORTED_MODULE_0__["SvelteComponent"] {
	constructor(options) {
		super();
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["init"])(this, options, instance, create_fragment, svelte_internal__WEBPACK_IMPORTED_MODULE_0__["safe_not_equal"], { value: 0 });
	}
}

/* harmony default export */ __webpack_exports__["default"] = (ColorPicker);

/***/ }),

/***/ "./src/p4/CustomExtensions.svelte":
/*!****************************************!*\
  !*** ./src/p4/CustomExtensions.svelte ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_internal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/internal */ "./node_modules/svelte/internal/index.mjs");
/* src/p4/CustomExtensions.svelte generated by Svelte v3.59.2 */


function add_css(target) {
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append_styles"])(target, "svelte-1vgg5z0", "textarea.svelte-1vgg5z0{box-sizing:border-box;width:100%;min-width:100%;height:100px}");
}

function create_fragment(ctx) {
	let textarea;
	let textarea_value_value;
	let mounted;
	let dispose;

	return {
		c() {
			textarea = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("textarea");
			textarea.value = textarea_value_value = /*extensions*/ ctx[0].join('\n');
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(textarea, "class", "svelte-1vgg5z0");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, textarea, anchor);

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(textarea, "change", /*change_handler*/ ctx[1]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*extensions*/ 1 && textarea_value_value !== (textarea_value_value = /*extensions*/ ctx[0].join('\n'))) {
				textarea.value = textarea_value_value;
			}
		},
		i: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		o: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(textarea);
			mounted = false;
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { extensions } = $$props;

	const change_handler = e => {
		$$invalidate(0, extensions = e.target.value.split('\n').filter(i => i));
	};

	$$self.$$set = $$props => {
		if ('extensions' in $$props) $$invalidate(0, extensions = $$props.extensions);
	};

	return [extensions, change_handler];
}

class CustomExtensions extends svelte_internal__WEBPACK_IMPORTED_MODULE_0__["SvelteComponent"] {
	constructor(options) {
		super();
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["init"])(this, options, instance, create_fragment, svelte_internal__WEBPACK_IMPORTED_MODULE_0__["safe_not_equal"], { extensions: 0 }, add_css);
	}
}

/* harmony default export */ __webpack_exports__["default"] = (CustomExtensions);

/***/ }),

/***/ "./src/p4/Downloads.svelte":
/*!*********************************!*\
  !*** ./src/p4/Downloads.svelte ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_internal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/internal */ "./node_modules/svelte/internal/index.mjs");
/* harmony import */ var _Section_svelte__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Section.svelte */ "./src/p4/Section.svelte");
/* harmony import */ var _locales__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../locales */ "./src/locales/index.js");
/* harmony import */ var _packager_packager__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../packager/packager */ "./src/packager/packager.js");
/* harmony import */ var _download_url__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./download-url */ "./src/p4/download-url.js");
/* harmony import */ var _environment__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./environment */ "./src/p4/environment.js");
/* harmony import */ var svelte__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! svelte */ "./node_modules/svelte/index.mjs");
/* src/p4/Downloads.svelte generated by Svelte v3.59.2 */









function add_css(target) {
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append_styles"])(target, "svelte-qxfu1u", ".alternative.svelte-qxfu1u{font-size:smaller}");
}

// (78:4) {#if isChromeOS && name.endsWith('.html')}
function create_if_block(ctx) {
	let p;
	let button;
	let t_value = /*$_*/ ctx[4]('downloads.useWorkaround') + "";
	let t;
	let mounted;
	let dispose;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			button = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t_value);
			button.disabled = /*workaroundInProgress*/ ctx[3];
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "alternative svelte-qxfu1u");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, button);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(button, t);

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button, "click", /*useAlternativeDownloadToBypassChromeOSBugs*/ ctx[5]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*$_*/ 16 && t_value !== (t_value = /*$_*/ ctx[4]('downloads.useWorkaround') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t, t_value);

			if (dirty & /*workaroundInProgress*/ 8) {
				button.disabled = /*workaroundInProgress*/ ctx[3];
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
			mounted = false;
			dispose();
		}
	};
}

// (68:0) <Section center>
function create_default_slot(ctx) {
	let div;
	let p;
	let a;
	let t0_value = /*$_*/ ctx[4]('downloads.link').replace('{size}', `${(/*blob*/ ctx[2].size / 1000 / 1000).toFixed(2)}MB`).replace('{filename}', /*name*/ ctx[0]) + "";
	let t0;
	let t1;
	let show_if = _environment__WEBPACK_IMPORTED_MODULE_5__["isChromeOS"] && /*name*/ ctx[0].endsWith('.html');
	let if_block = show_if && create_if_block(ctx);

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			a = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("a");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block) if_block.c();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*url*/ ctx[1]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "download", /*name*/ ctx[0]);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, p);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, a);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(a, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t1);
			if (if_block) if_block.m(div, null);
		},
		p(ctx, dirty) {
			if (dirty & /*$_, blob, name*/ 21 && t0_value !== (t0_value = /*$_*/ ctx[4]('downloads.link').replace('{size}', `${(/*blob*/ ctx[2].size / 1000 / 1000).toFixed(2)}MB`).replace('{filename}', /*name*/ ctx[0]) + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);

			if (dirty & /*url*/ 2) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*url*/ ctx[1]);
			}

			if (dirty & /*name*/ 1) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "download", /*name*/ ctx[0]);
			}

			if (dirty & /*name*/ 1) show_if = _environment__WEBPACK_IMPORTED_MODULE_5__["isChromeOS"] && /*name*/ ctx[0].endsWith('.html');

			if (show_if) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
			if (if_block) if_block.d();
		}
	};
}

function create_fragment(ctx) {
	let section;
	let current;

	section = new _Section_svelte__WEBPACK_IMPORTED_MODULE_1__["default"]({
			props: {
				center: true,
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section.$$.fragment);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const section_changes = {};

			if (dirty & /*$$scope, workaroundInProgress, $_, name, url, blob*/ 159) {
				section_changes.$$scope = { dirty, ctx };
			}

			section.$set(section_changes);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section, detaching);
		}
	};
}

let txtUrl = null;

function instance($$self, $$props, $$invalidate) {
	let $_;
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["component_subscribe"])($$self, _locales__WEBPACK_IMPORTED_MODULE_2__["_"], $$value => $$invalidate(4, $_ = $$value));
	let { name } = $$props;
	let { url } = $$props;
	let { blob } = $$props;
	let workaroundInProgress;

	// 新增：标记是否为 Cordova Android 包（在 onMount 检测）
	let isCordovaAndroid = false;

	// 当组件挂载且有 blob 时，检查是否为 Cordova Android zip 
	Object(svelte__WEBPACK_IMPORTED_MODULE_6__["onMount"])(async () => {
		if (blob && name && name.endsWith('.zip') && blob.type === 'application/zip') {
			try {
				const JSZip = await Object(_packager_packager__WEBPACK_IMPORTED_MODULE_3__["getJSZip"])();
				const zip = await JSZip.loadAsync(blob);

				// 检测 Cordova Android 项目（配置文件与 package.json 同时存在）
				if (zip.file('config.xml') && zip.file('package.json')) {
					isCordovaAndroid = true;
				}
			} catch(e) {
				console.warn('Could not analyze zip file:', e);
			}
		}
	});

	const useAlternativeDownloadToBypassChromeOSBugs = async () => {
		$$invalidate(3, workaroundInProgress = true);

		try {
			const JSZip = await Object(_packager_packager__WEBPACK_IMPORTED_MODULE_3__["getJSZip"])();
			const zip = new JSZip();
			zip.file(name, blob);
			const zippedBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
			const newFileName = name.replace(/\.html$/, '.zip');
			const blobURL = URL.createObjectURL(zippedBlob);
			Object(_download_url__WEBPACK_IMPORTED_MODULE_4__["default"])(newFileName, blobURL);
			URL.revokeObjectURL(blobURL);
		} catch(e) {
			console.error(e);
		}

		$$invalidate(3, workaroundInProgress = false);
	};

	$$self.$$set = $$props => {
		if ('name' in $$props) $$invalidate(0, name = $$props.name);
		if ('url' in $$props) $$invalidate(1, url = $$props.url);
		if ('blob' in $$props) $$invalidate(2, blob = $$props.blob);
	};

	return [
		name,
		url,
		blob,
		workaroundInProgress,
		$_,
		useAlternativeDownloadToBypassChromeOSBugs
	];
}

class Downloads extends svelte_internal__WEBPACK_IMPORTED_MODULE_0__["SvelteComponent"] {
	constructor(options) {
		super();
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["init"])(this, options, instance, create_fragment, svelte_internal__WEBPACK_IMPORTED_MODULE_0__["safe_not_equal"], { name: 0, url: 1, blob: 2 }, add_css);
	}
}

/* harmony default export */ __webpack_exports__["default"] = (Downloads);

/***/ }),

/***/ "./src/p4/ImageInput.svelte":
/*!**********************************!*\
  !*** ./src/p4/ImageInput.svelte ***!
  \**********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_internal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/internal */ "./node_modules/svelte/internal/index.mjs");
/* harmony import */ var _locales__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../locales */ "./src/locales/index.js");
/* harmony import */ var _DropArea_svelte__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DropArea.svelte */ "./src/p4/DropArea.svelte");
/* src/p4/ImageInput.svelte generated by Svelte v3.59.2 */





function add_css(target) {
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append_styles"])(target, "svelte-vgthxo", ".container.svelte-vgthxo.svelte-vgthxo{background:transparent;color:#555;width:100%;box-sizing:border-box;border:3px dashed currentColor;transition:.2s border-color, .2s color;border-radius:20px;min-height:90px;font:inherit;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;position:relative;cursor:pointer;padding:4px}[theme=\"dark\"] .container.svelte-vgthxo.svelte-vgthxo{color:#aaa}.dropping.svelte-vgthxo.svelte-vgthxo,.container.svelte-vgthxo.svelte-vgthxo:focus-visible,.container.svelte-vgthxo.svelte-vgthxo:active{color:rgb(79, 123, 211)}[theme=\"dark\"] .dropping.svelte-vgthxo.svelte-vgthxo,[theme=\"dark\"] .container.svelte-vgthxo.svelte-vgthxo:focus-visible,[theme=\"dark\"] .container.svelte-vgthxo.svelte-vgthxo:active{color:rgb(178, 195, 228)}.placeholder.svelte-vgthxo.svelte-vgthxo{font-size:1.5em}.selected.svelte-vgthxo.svelte-vgthxo{display:flex;align-items:center;justify-content:center;flex-wrap:wrap}.selected.svelte-vgthxo>.svelte-vgthxo:not(:last-child){margin-right:12px}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[10] = list[i];
	return child_ctx;
}

// (120:4) {:else}
function create_else_block(ctx) {
	let div;
	let t_value = /*$_*/ ctx[4]('fileInput.select') + "";
	let t;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div, "class", "placeholder svelte-vgthxo");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*$_*/ 16 && t_value !== (t_value = /*$_*/ ctx[4]('fileInput.select') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t, t_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (111:4) {#if file}
function create_if_block(ctx) {
	let div1;
	let t0;
	let div0;
	let t1_value = /*$_*/ ctx[4]('fileInput.selected').replace('{file}', /*file*/ ctx[0].name) + "";
	let t1;
	let t2;
	let button;
	let t3_value = /*$_*/ ctx[4]('fileInput.clear') + "";
	let t3;
	let mounted;
	let dispose;
	let each_value = /*previewSizes*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t1_value);
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			button = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t3_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div0, "class", "svelte-vgthxo");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(button, "class", "svelte-vgthxo");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div1, "class", "selected svelte-vgthxo");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div1, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div1, null);
				}
			}

			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, button);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(button, t3);

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button, "click", /*clear*/ ctx[5]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*url, previewSizes*/ 6) {
				each_value = /*previewSizes*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div1, t0);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty & /*$_, file*/ 17 && t1_value !== (t1_value = /*$_*/ ctx[4]('fileInput.selected').replace('{file}', /*file*/ ctx[0].name) + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, t1_value);
			if (dirty & /*$_*/ 16 && t3_value !== (t3_value = /*$_*/ ctx[4]('fileInput.clear') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t3, t3_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_each"])(each_blocks, detaching);
			mounted = false;
			dispose();
		}
	};
}

// (113:8) {#each previewSizes as size}
function create_each_block(ctx) {
	let img;
	let img_src_value;
	let img_width_value;
	let img_height_value;

	return {
		c() {
			img = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("img");
			if (!Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["src_url_equal"])(img.src, img_src_value = /*url*/ ctx[2])) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(img, "src", img_src_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(img, "width", img_width_value = /*size*/ ctx[10][0]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(img, "height", img_height_value = /*size*/ ctx[10][1]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(img, "class", "svelte-vgthxo");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, img, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*url*/ 4 && !Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["src_url_equal"])(img.src, img_src_value = /*url*/ ctx[2])) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(img, "src", img_src_value);
			}

			if (dirty & /*previewSizes*/ 2 && img_width_value !== (img_width_value = /*size*/ ctx[10][0])) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(img, "width", img_width_value);
			}

			if (dirty & /*previewSizes*/ 2 && img_height_value !== (img_height_value = /*size*/ ctx[10][1])) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(img, "height", img_height_value);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(img);
		}
	};
}

// (109:0) <DropArea bind:dropping={dropping} on:drop={handleDrop}>
function create_default_slot(ctx) {
	let button;
	let mounted;
	let dispose;

	function select_block_type(ctx, dirty) {
		if (/*file*/ ctx[0]) return create_if_block;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx, -1);
	let if_block = current_block_type(ctx);

	return {
		c() {
			button = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			if_block.c();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(button, "class", "container svelte-vgthxo");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["toggle_class"])(button, "dropping", /*dropping*/ ctx[3]);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, button, anchor);
			if_block.m(button, null);

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button, "click", /*handleClickBackground*/ ctx[6]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(button, null);
				}
			}

			if (dirty & /*dropping*/ 8) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["toggle_class"])(button, "dropping", /*dropping*/ ctx[3]);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(button);
			if_block.d();
			mounted = false;
			dispose();
		}
	};
}

function create_fragment(ctx) {
	let droparea;
	let updating_dropping;
	let current;

	function droparea_dropping_binding(value) {
		/*droparea_dropping_binding*/ ctx[8](value);
	}

	let droparea_props = {
		$$slots: { default: [create_default_slot] },
		$$scope: { ctx }
	};

	if (/*dropping*/ ctx[3] !== void 0) {
		droparea_props.dropping = /*dropping*/ ctx[3];
	}

	droparea = new _DropArea_svelte__WEBPACK_IMPORTED_MODULE_2__["default"]({ props: droparea_props });
	svelte_internal__WEBPACK_IMPORTED_MODULE_0__["binding_callbacks"].push(() => Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["bind"])(droparea, 'dropping', droparea_dropping_binding));
	droparea.$on("drop", /*handleDrop*/ ctx[7]);

	return {
		c() {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(droparea.$$.fragment);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(droparea, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const droparea_changes = {};

			if (dirty & /*$$scope, dropping, $_, file, previewSizes, url*/ 8223) {
				droparea_changes.$$scope = { dirty, ctx };
			}

			if (!updating_dropping && dirty & /*dropping*/ 8) {
				updating_dropping = true;
				droparea_changes.dropping = /*dropping*/ ctx[3];
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_flush_callback"])(() => updating_dropping = false);
			}

			droparea.$set(droparea_changes);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(droparea.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(droparea.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(droparea, detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $_;
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["component_subscribe"])($$self, _locales__WEBPACK_IMPORTED_MODULE_1__["_"], $$value => $$invalidate(4, $_ = $$value));
	const ACCEPT = ['.png', '.jpg', '.jpeg', '.bmp', '.svg', '.ico', '.gif'];
	let { file } = $$props;
	let { previewSizes } = $$props;
	let dropping;
	let url;

	const clear = e => {
		e.stopPropagation();
		$$invalidate(0, file = null);
	};

	const handleClickBackground = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = ACCEPT.join(',');

		input.addEventListener('change', e => {
			const files = e.target.files;

			if (files.length) {
				$$invalidate(0, file = files[0]);
			} else {
				$$invalidate(0, file = null);
			}
		});

		document.body.appendChild(input);
		input.click();
		input.remove();
	};

	const handleDrop = ({ detail: dataTransfer }) => {
		const droppedFile = dataTransfer.files[0];

		if (ACCEPT.some(ext => droppedFile.name.endsWith(ext))) {
			$$invalidate(0, file = droppedFile);
		}
	};

	function droparea_dropping_binding(value) {
		dropping = value;
		$$invalidate(3, dropping);
	}

	$$self.$$set = $$props => {
		if ('file' in $$props) $$invalidate(0, file = $$props.file);
		if ('previewSizes' in $$props) $$invalidate(1, previewSizes = $$props.previewSizes);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*file, url*/ 5) {
			// This is a bit strange, there's probably a better way to do this
			// Seems to create and revoke an extra object URL for each file for some reason
			$: if (file) {
				if (url) {
					URL.revokeObjectURL(url);
				}

				$$invalidate(2, url = URL.createObjectURL(file));
			} else if (url) {
				URL.revokeObjectURL(url);
				$$invalidate(2, url = null);
			}
		}
	};

	return [
		file,
		previewSizes,
		url,
		dropping,
		$_,
		clear,
		handleClickBackground,
		handleDrop,
		droparea_dropping_binding
	];
}

class ImageInput extends svelte_internal__WEBPACK_IMPORTED_MODULE_0__["SvelteComponent"] {
	constructor(options) {
		super();
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["init"])(this, options, instance, create_fragment, svelte_internal__WEBPACK_IMPORTED_MODULE_0__["safe_not_equal"], { file: 0, previewSizes: 1 }, add_css);
	}
}

/* harmony default export */ __webpack_exports__["default"] = (ImageInput);

/***/ }),

/***/ "./src/p4/LearnMore.svelte":
/*!*********************************!*\
  !*** ./src/p4/LearnMore.svelte ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_internal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/internal */ "./node_modules/svelte/internal/index.mjs");
/* harmony import */ var _locales___WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../locales/ */ "./src/locales/index.js");
/* src/p4/LearnMore.svelte generated by Svelte v3.59.2 */




function add_css(target) {
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append_styles"])(target, "svelte-fiwpjx", "a.svelte-fiwpjx{text-decoration:none}a.svelte-fiwpjx:hover{text-decoration:underline}");
}

function create_fragment(ctx) {
	let a;
	let t;
	let a_title_value;

	return {
		c() {
			a = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("a");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("(?)");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*link*/ ctx[1]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "title", a_title_value = /*$_*/ ctx[0]('options.learnMore'));
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "target", "_blank");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "rel", "noopener noreferrer");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "class", "svelte-fiwpjx");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, a, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(a, t);
		},
		p(ctx, [dirty]) {
			if (dirty & /*$_*/ 1 && a_title_value !== (a_title_value = /*$_*/ ctx[0]('options.learnMore'))) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "title", a_title_value);
			}
		},
		i: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		o: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(a);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $_;
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["component_subscribe"])($$self, _locales___WEBPACK_IMPORTED_MODULE_1__["_"], $$value => $$invalidate(0, $_ = $$value));
	let { slug } = $$props;
	let { href } = $$props;
	const link = slug ? `https://docs.turbowarp.org/${slug}` : href;

	$$self.$$set = $$props => {
		if ('slug' in $$props) $$invalidate(2, slug = $$props.slug);
		if ('href' in $$props) $$invalidate(3, href = $$props.href);
	};

	return [$_, link, slug, href];
}

class LearnMore extends svelte_internal__WEBPACK_IMPORTED_MODULE_0__["SvelteComponent"] {
	constructor(options) {
		super();
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["init"])(this, options, instance, create_fragment, svelte_internal__WEBPACK_IMPORTED_MODULE_0__["safe_not_equal"], { slug: 2, href: 3 }, add_css);
	}
}

/* harmony default export */ __webpack_exports__["default"] = (LearnMore);

/***/ }),

/***/ "./src/p4/PackagerOptions.svelte":
/*!***************************************!*\
  !*** ./src/p4/PackagerOptions.svelte ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_internal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/internal */ "./node_modules/svelte/internal/index.mjs");
/* harmony import */ var svelte__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! svelte */ "./node_modules/svelte/index.mjs");
/* harmony import */ var _locales___WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../locales/ */ "./src/locales/index.js");
/* harmony import */ var svelte_transition__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! svelte/transition */ "./node_modules/svelte/transition/index.mjs");
/* harmony import */ var _Section_svelte__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Section.svelte */ "./src/p4/Section.svelte");
/* harmony import */ var _p4_Button_svelte__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../p4/Button.svelte */ "./src/p4/Button.svelte");
/* harmony import */ var _ImageInput_svelte__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./ImageInput.svelte */ "./src/p4/ImageInput.svelte");
/* harmony import */ var _p4_CustomExtensions_svelte__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../p4/CustomExtensions.svelte */ "./src/p4/CustomExtensions.svelte");
/* harmony import */ var _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./LearnMore.svelte */ "./src/p4/LearnMore.svelte");
/* harmony import */ var _ColorPicker_svelte__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./ColorPicker.svelte */ "./src/p4/ColorPicker.svelte");
/* harmony import */ var _Downloads_svelte__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./Downloads.svelte */ "./src/p4/Downloads.svelte");
/* harmony import */ var _persistent_store__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./persistent-store */ "./src/p4/persistent-store.js");
/* harmony import */ var _file_store__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./file-store */ "./src/p4/file-store.js");
/* harmony import */ var _stores__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./stores */ "./src/p4/stores.js");
/* harmony import */ var _preview__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./preview */ "./src/p4/preview.js");
/* harmony import */ var _deep_clone__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./deep-clone */ "./src/p4/deep-clone.js");
/* harmony import */ var _packager_web_export__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../packager/web/export */ "./src/packager/web/export.js");
/* harmony import */ var _task__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./task */ "./src/p4/task.js");
/* harmony import */ var _download_url__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./download-url */ "./src/p4/download-url.js");
/* harmony import */ var _blob_serializer__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./blob-serializer */ "./src/p4/blob-serializer.js");
/* harmony import */ var _common_readers__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ../common/readers */ "./src/common/readers.js");
/* harmony import */ var _merge__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ./merge */ "./src/p4/merge.js");
/* harmony import */ var _DropArea_svelte__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ./DropArea.svelte */ "./src/p4/DropArea.svelte");
/* harmony import */ var _packager_brand__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ../packager/brand */ "./src/packager/brand.js");
/* harmony import */ var _packager_brand__WEBPACK_IMPORTED_MODULE_23___default = /*#__PURE__*/__webpack_require__.n(_packager_brand__WEBPACK_IMPORTED_MODULE_23__);
/* harmony import */ var _github_uploader__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ./github-uploader */ "./src/p4/github-uploader.js");
/* src/p4/PackagerOptions.svelte generated by Svelte v3.59.2 */




























// GitHub uploader state for UI placed next to package name


function add_css(target) {
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append_styles"])(target, "svelte-p1bfed", ".option.svelte-p1bfed.svelte-p1bfed{display:block;margin:4px 0}.group.svelte-p1bfed.svelte-p1bfed{margin:12px 0}p.svelte-p1bfed.svelte-p1bfed{margin:8px 0}.group.svelte-p1bfed.svelte-p1bfed:last-child,.option.svelte-p1bfed.svelte-p1bfed:last-child,p.svelte-p1bfed.svelte-p1bfed:last-child{margin-bottom:0}textarea.svelte-p1bfed.svelte-p1bfed{box-sizing:border-box;width:100%;min-width:100%;height:150px}input[type=\"text\"].svelte-p1bfed.svelte-p1bfed{width:200px}input[type=\"text\"].shorter.svelte-p1bfed.svelte-p1bfed{width:150px}input[type=\"number\"].svelte-p1bfed.svelte-p1bfed{width:50px}input.svelte-p1bfed.svelte-p1bfed:invalid,.version.svelte-p1bfed.svelte-p1bfed:placeholder-shown{outline:2px solid red}.warning.svelte-p1bfed.svelte-p1bfed{font-weight:bold;background:yellow;color:black;padding:10px;border-radius:10px}.buttons.svelte-p1bfed.svelte-p1bfed{display:flex}.button.svelte-p1bfed.svelte-p1bfed{margin-right:4px}.side-buttons.svelte-p1bfed.svelte-p1bfed{display:flex;margin-left:auto}.github-uploader.svelte-p1bfed.svelte-p1bfed{margin-top:0.5rem;border:1px dashed #ccc;padding:0.5rem;border-radius:4px}.github-uploader.svelte-p1bfed button.svelte-p1bfed{margin-top:0.25rem}.upload-status.svelte-p1bfed.svelte-p1bfed{margin-top:0.5rem;font-size:0.9rem}.log-panel.svelte-p1bfed.svelte-p1bfed{margin-top:0.5rem;border:1px solid #ddd;background:#f8f8f8;padding:0.5rem;border-radius:6px;font-family:monospace;font-size:12px;max-height:180px;display:flex;flex-direction:column}.log-entries.svelte-p1bfed.svelte-p1bfed{overflow:auto;flex:1 1 auto;padding:4px;background:#fff;border:1px solid #eee;border-radius:4px}.log-controls.svelte-p1bfed.svelte-p1bfed{display:flex;gap:8px;margin-top:6px}.log-entry.svelte-p1bfed.svelte-p1bfed{padding:2px 4px}.log-entry.info.svelte-p1bfed.svelte-p1bfed{color:#222}.log-entry.warn.svelte-p1bfed.svelte-p1bfed{color:#b65a00}.log-entry.error.svelte-p1bfed.svelte-p1bfed{color:#b00000;font-weight:bold}.feature-notice.svelte-p1bfed.svelte-p1bfed{display:flex;align-items:center;justify-content:space-between;gap:16px}.feature-notice-copy.svelte-p1bfed.svelte-p1bfed{flex:1 1 auto}.feature-notice.svelte-p1bfed h2.svelte-p1bfed{margin:0 0 6px 0}.feature-notice.svelte-p1bfed p.svelte-p1bfed{margin:0}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[155] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[158] = list[i];
	child_ctx[159] = list;
	child_ctx[160] = i;
	return child_ctx;
}

// (730:0) <Section accent="#4C97FF">
function create_default_slot_12(ctx) {
	let div2;
	let div0;
	let h2;
	let t0_value = /*$_*/ ctx[20]('options.newIn300Title') + "";
	let t0;
	let t1;
	let p;
	let t2_value = /*$_*/ ctx[20]('options.newIn300Description') + "";
	let t2;
	let t3;
	let div1;
	let button;
	let current;

	button = new _p4_Button_svelte__WEBPACK_IMPORTED_MODULE_5__["default"]({
			props: {
				secondary: true,
				text: /*$_*/ ctx[20]('options.jumpToCompiledProject')
			}
		});

	button.$on("click", /*scrollToCompiledProjectOption*/ ctx[28]);

	return {
		c() {
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(button.$$.fragment);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(h2, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div0, "class", "feature-notice-copy svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "feature-notice svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, h2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h2, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, p);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(button, div1, null);
			current = true;
		},
		p(ctx, dirty) {
			if ((!current || dirty[0] & /*$_*/ 1048576) && t0_value !== (t0_value = /*$_*/ ctx[20]('options.newIn300Title') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t2_value !== (t2_value = /*$_*/ ctx[20]('options.newIn300Description') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);
			const button_changes = {};
			if (dirty[0] & /*$_*/ 1048576) button_changes.text = /*$_*/ ctx[20]('options.jumpToCompiledProject');
			button.$set(button_changes);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(button.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(button.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(button);
		}
	};
}

// (763:4) {#if hasSettingsStoredInProject}
function create_if_block_45(ctx) {
	let div;
	let t_value = /*$_*/ ctx[20]('options.storedWarning') + "";
	let t;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div, "class", "group svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t_value !== (t_value = /*$_*/ ctx[20]('options.storedWarning') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t, t_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (825:4) {#if $options.username !== defaultOptions.username && cloudVariables.length !== 0}
function create_if_block_44(ctx) {
	let p;
	let t_value = /*$_*/ ctx[20]('options.customUsernameWarning') + "";
	let t;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "warning svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t_value !== (t_value = /*$_*/ ctx[20]('options.customUsernameWarning') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t, t_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

// (742:0) <Section   accent="#FFAB19"   reset={() => {     resetOptions([       'turbo',       'framerate',       'interpolation',       'highQualityPen',       'maxClones',       'fencing',       'miscLimits',       'stageWidth',       'stageHeight',       'resizeMode',       'username'     ]);   }} >
function create_default_slot_11(ctx) {
	let div7;
	let h2;
	let t0_value = /*$_*/ ctx[20]('options.runtimeOptions') + "";
	let t0;
	let t1;
	let t2;
	let label0;
	let input0;
	let t3;
	let t4_value = /*$_*/ ctx[20]('options.turbo') + "";
	let t4;
	let t5;
	let div0;
	let label1;
	let t6_value = /*$_*/ ctx[20]('options.framerate') + "";
	let t6;
	let t7;
	let input1;
	let t8;
	let learnmore0;
	let t9;
	let div1;
	let label2;
	let input2;
	let t10;
	let t11_value = /*$_*/ ctx[20]('options.interpolation') + "";
	let t11;
	let t12;
	let learnmore1;
	let t13;
	let div2;
	let label3;
	let input3;
	let t14;
	let t15_value = /*$_*/ ctx[20]('options.highQualityPen') + "";
	let t15;
	let t16;
	let learnmore2;
	let t17;
	let div3;
	let label4;
	let input4;
	let input4_checked_value;
	let t18;
	let t19_value = /*$_*/ ctx[20]('options.infiniteClones') + "";
	let t19;
	let t20;
	let learnmore3;
	let t21;
	let div4;
	let label5;
	let input5;
	let input5_checked_value;
	let t22;
	let t23_value = /*$_*/ ctx[20]('options.removeFencing') + "";
	let t23;
	let t24;
	let learnmore4;
	let t25;
	let div5;
	let label6;
	let input6;
	let input6_checked_value;
	let t26;
	let t27_value = /*$_*/ ctx[20]('options.removeMiscLimits') + "";
	let t27;
	let t28;
	let learnmore5;
	let t29;
	let label7;
	let t30_value = /*$_*/ ctx[20]('options.username') + "";
	let t30;
	let t31;
	let input7;
	let t32;
	let t33;
	let label8;
	let input8;
	let t34;
	let t35_value = /*$_*/ ctx[20]('options.closeWhenStopped') + "";
	let t35;
	let t36;
	let h3;
	let t37_value = /*$_*/ ctx[20]('options.stage') + "";
	let t37;
	let t38;
	let label9;
	let t39_value = /*$_*/ ctx[20]('options.stageSize') + "";
	let t39;
	let t40;
	let input9;
	let t41;
	let input10;
	let t42;
	let learnmore6;
	let t43;
	let div6;
	let label10;
	let input11;
	let t44;
	let t45_value = /*$_*/ ctx[20]('options.preserveRatio') + "";
	let t45;
	let t46;
	let label11;
	let input12;
	let t47;
	let t48_value = /*$_*/ ctx[20]('options.stretch') + "";
	let t48;
	let t49;
	let label12;
	let input13;
	let t50;
	let t51_value = /*$_*/ ctx[20]('options.dynamicResize') + "";
	let t51;
	let t52;
	let learnmore7;
	let current;
	let binding_group;
	let mounted;
	let dispose;
	let if_block0 = /*hasSettingsStoredInProject*/ ctx[23] && create_if_block_45(ctx);
	learnmore0 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({ props: { slug: "custom-fps" } });
	learnmore1 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({ props: { slug: "interpolation" } });
	learnmore2 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({ props: { slug: "high-quality-pen" } });
	learnmore3 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({ props: { slug: "infinite-clones" } });
	learnmore4 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({ props: { slug: "remove-fencing" } });
	learnmore5 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({ props: { slug: "remove-misc-limits" } });
	let if_block1 = /*$options*/ ctx[1].username !== /*defaultOptions*/ ctx[6].username && /*cloudVariables*/ ctx[21].length !== 0 && create_if_block_44(ctx);
	learnmore6 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({ props: { slug: "custom-stage-size" } });

	learnmore7 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({
			props: { slug: "packager/dynamic-stage-resize" }
		});

	binding_group = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["init_binding_group"])(/*$$binding_groups*/ ctx[56][3]);

	return {
		c() {
			div7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block0) if_block0.c();
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t4_value);
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t6_value);
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			input1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore0.$$.fragment);
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t11_value);
			t12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore1.$$.fragment);
			t13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t14 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t15 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t15_value);
			t16 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore2.$$.fragment);
			t17 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t18 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t19 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t19_value);
			t20 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore3.$$.fragment);
			t21 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t22 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t23 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t23_value);
			t24 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore4.$$.fragment);
			t25 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t26 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t27 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t27_value);
			t28 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore5.$$.fragment);
			t29 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t30 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t30_value);
			t31 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			input7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t32 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block1) if_block1.c();
			t33 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t34 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t35 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t35_value);
			t36 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			h3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h3");
			t37 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t37_value);
			t38 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t39 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t39_value);
			t40 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			input9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t41 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("\n      ×\n      ");
			input10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t42 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore6.$$.fragment);
			t43 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t44 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t45 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t45_value);
			t46 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t47 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t48 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t48_value);
			t49 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t50 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t51 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t51_value);
			t52 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore7.$$.fragment);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "type", "number");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "min", "0");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "max", "240");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div1, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "type", "checkbox");
			input4.checked = input4_checked_value = /*$options*/ ctx[1].maxClones === ALMOST_INFINITY;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div3, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input5, "type", "checkbox");
			input5.checked = input5_checked_value = !/*$options*/ ctx[1].fencing;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input5, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div4, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input6, "type", "checkbox");
			input6.checked = input6_checked_value = !/*$options*/ ctx[1].miscLimits;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input6, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div5, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input7, "type", "text");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input7, "class", "shorter svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label7, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input8, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input8, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label8, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input9, "type", "number");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input9, "min", "1");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input9, "max", "4096");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input9, "step", "1");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input9, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input10, "type", "number");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input10, "min", "1");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input10, "max", "4096");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input10, "step", "1");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input10, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label9, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input11, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input11, "name", "resize-mode");
			input11.__value = "preserve-ratio";
			input11.value = input11.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input11, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label10, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input12, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input12, "name", "resize-mode");
			input12.__value = "stretch";
			input12.value = input12.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input12, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label11, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input13, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input13, "name", "resize-mode");
			input13.__value = "dynamic-resize";
			input13.value = input13.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input13, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label12, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div6, "class", "group svelte-p1bfed");
			binding_group.p(input11, input12, input13);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div7, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, h2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h2, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t1);
			if (if_block0) if_block0.m(div7, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, label0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, input0);
			input0.checked = /*$options*/ ctx[1].turbo;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, label1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, input1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input1, /*$options*/ ctx[1].framerate);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore0, div0, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, label2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, input2);
			input2.checked = /*$options*/ ctx[1].interpolation;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t10);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t12);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore1, div1, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t13);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, label3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, input3);
			input3.checked = /*$options*/ ctx[1].highQualityPen;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t14);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t15);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t16);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore2, div2, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t17);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, input4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, t18);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, t19);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t20);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore3, div3, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t21);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, label5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, input5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, t22);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, t23);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, t24);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore4, div4, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t25);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div5, label6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, input6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, t26);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, t27);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div5, t28);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore5, div5, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t29);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, label7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, t30);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, t31);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, input7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input7, /*$options*/ ctx[1].username);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t32);
			if (if_block1) if_block1.m(div7, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t33);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, label8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, input8);
			input8.checked = /*$options*/ ctx[1].closeWhenStopped;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, t34);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, t35);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t36);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, h3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h3, t37);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t38);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, label9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, t39);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, t40);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, input9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input9, /*$options*/ ctx[1].stageWidth);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, t41);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, input10);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input10, /*$options*/ ctx[1].stageHeight);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, t42);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore6, label9, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t43);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, label10);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label10, input11);
			input11.checked = input11.__value === /*$options*/ ctx[1].resizeMode;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label10, t44);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label10, t45);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, t46);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, label11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label11, input12);
			input12.checked = input12.__value === /*$options*/ ctx[1].resizeMode;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label11, t47);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label11, t48);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, t49);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, label12);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label12, input13);
			input13.checked = input13.__value === /*$options*/ ctx[1].resizeMode;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label12, t50);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label12, t51);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label12, t52);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore7, label12, null);
			current = true;

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input0, "change", /*input0_change_handler*/ ctx[44]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input1, "input", /*input1_input_handler*/ ctx[45]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input2, "change", /*input2_change_handler*/ ctx[46]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input3, "change", /*input3_change_handler*/ ctx[47]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input4, "change", /*change_handler*/ ctx[48]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input5, "change", /*change_handler_1*/ ctx[49]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input6, "change", /*change_handler_2*/ ctx[50]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input7, "input", /*input7_input_handler*/ ctx[51]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input8, "change", /*input8_change_handler*/ ctx[52]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input9, "input", /*input9_input_handler*/ ctx[53]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input10, "input", /*input10_input_handler*/ ctx[54]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input11, "change", /*input11_change_handler*/ ctx[55]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input12, "change", /*input12_change_handler*/ ctx[57]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input13, "change", /*input13_change_handler*/ ctx[58])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if ((!current || dirty[0] & /*$_*/ 1048576) && t0_value !== (t0_value = /*$_*/ ctx[20]('options.runtimeOptions') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if (/*hasSettingsStoredInProject*/ ctx[23]) if_block0.p(ctx, dirty);

			if (dirty[0] & /*$options*/ 2) {
				input0.checked = /*$options*/ ctx[1].turbo;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t4_value !== (t4_value = /*$_*/ ctx[20]('options.turbo') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t4, t4_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t6_value !== (t6_value = /*$_*/ ctx[20]('options.framerate') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t6, t6_value);

			if (dirty[0] & /*$options*/ 2 && Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["to_number"])(input1.value) !== /*$options*/ ctx[1].framerate) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input1, /*$options*/ ctx[1].framerate);
			}

			if (dirty[0] & /*$options*/ 2) {
				input2.checked = /*$options*/ ctx[1].interpolation;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t11_value !== (t11_value = /*$_*/ ctx[20]('options.interpolation') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t11, t11_value);

			if (dirty[0] & /*$options*/ 2) {
				input3.checked = /*$options*/ ctx[1].highQualityPen;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t15_value !== (t15_value = /*$_*/ ctx[20]('options.highQualityPen') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t15, t15_value);

			if (!current || dirty[0] & /*$options*/ 2 && input4_checked_value !== (input4_checked_value = /*$options*/ ctx[1].maxClones === ALMOST_INFINITY)) {
				input4.checked = input4_checked_value;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t19_value !== (t19_value = /*$_*/ ctx[20]('options.infiniteClones') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t19, t19_value);

			if (!current || dirty[0] & /*$options*/ 2 && input5_checked_value !== (input5_checked_value = !/*$options*/ ctx[1].fencing)) {
				input5.checked = input5_checked_value;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t23_value !== (t23_value = /*$_*/ ctx[20]('options.removeFencing') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t23, t23_value);

			if (!current || dirty[0] & /*$options*/ 2 && input6_checked_value !== (input6_checked_value = !/*$options*/ ctx[1].miscLimits)) {
				input6.checked = input6_checked_value;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t27_value !== (t27_value = /*$_*/ ctx[20]('options.removeMiscLimits') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t27, t27_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t30_value !== (t30_value = /*$_*/ ctx[20]('options.username') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t30, t30_value);

			if (dirty[0] & /*$options*/ 2 && input7.value !== /*$options*/ ctx[1].username) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input7, /*$options*/ ctx[1].username);
			}

			if (/*$options*/ ctx[1].username !== /*defaultOptions*/ ctx[6].username && /*cloudVariables*/ ctx[21].length !== 0) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_44(ctx);
					if_block1.c();
					if_block1.m(div7, t33);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty[0] & /*$options*/ 2) {
				input8.checked = /*$options*/ ctx[1].closeWhenStopped;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t35_value !== (t35_value = /*$_*/ ctx[20]('options.closeWhenStopped') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t35, t35_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t37_value !== (t37_value = /*$_*/ ctx[20]('options.stage') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t37, t37_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t39_value !== (t39_value = /*$_*/ ctx[20]('options.stageSize') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t39, t39_value);

			if (dirty[0] & /*$options*/ 2 && Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["to_number"])(input9.value) !== /*$options*/ ctx[1].stageWidth) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input9, /*$options*/ ctx[1].stageWidth);
			}

			if (dirty[0] & /*$options*/ 2 && Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["to_number"])(input10.value) !== /*$options*/ ctx[1].stageHeight) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input10, /*$options*/ ctx[1].stageHeight);
			}

			if (dirty[0] & /*$options*/ 2) {
				input11.checked = input11.__value === /*$options*/ ctx[1].resizeMode;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t45_value !== (t45_value = /*$_*/ ctx[20]('options.preserveRatio') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t45, t45_value);

			if (dirty[0] & /*$options*/ 2) {
				input12.checked = input12.__value === /*$options*/ ctx[1].resizeMode;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t48_value !== (t48_value = /*$_*/ ctx[20]('options.stretch') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t48, t48_value);

			if (dirty[0] & /*$options*/ 2) {
				input13.checked = input13.__value === /*$options*/ ctx[1].resizeMode;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t51_value !== (t51_value = /*$_*/ ctx[20]('options.dynamicResize') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t51, t51_value);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore2.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore3.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore4.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore5.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore6.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore7.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore2.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore3.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore4.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore5.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore6.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore7.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div7);
			if (if_block0) if_block0.d();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore5);
			if (if_block1) if_block1.d();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore7);
			binding_group.r();
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (902:4) {#if $loadingScreenImage}
function create_if_block_43(ctx) {
	let label0;
	let input0;
	let t0;
	let t1_value = /*$_*/ ctx[20]('options.sizeNormal') + "";
	let t1;
	let t2;
	let label1;
	let input1;
	let t3;
	let t4_value = /*$_*/ ctx[20]('options.sizeStretch') + "";
	let t4;
	let binding_group;
	let mounted;
	let dispose;
	binding_group = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["init_binding_group"])(/*$$binding_groups*/ ctx[56][2]);

	return {
		c() {
			label0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t1_value);
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t4_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "name", "loading-screen-mode");
			input0.__value = "normal";
			input0.value = input0.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "name", "loading-screen-mode");
			input1.__value = "stretch";
			input1.value = input1.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label1, "class", "option svelte-p1bfed");
			binding_group.p(input0, input1);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label0, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, input0);
			input0.checked = input0.__value === /*$options*/ ctx[1].loadingScreen.imageMode;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, input1);
			input1.checked = input1.__value === /*$options*/ ctx[1].loadingScreen.imageMode;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t4);

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input0, "change", /*input0_change_handler_1*/ ctx[65]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input1, "change", /*input1_change_handler_1*/ ctx[66])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$options*/ 2) {
				input0.checked = input0.__value === /*$options*/ ctx[1].loadingScreen.imageMode;
			}

			if (dirty[0] & /*$_*/ 1048576 && t1_value !== (t1_value = /*$_*/ ctx[20]('options.sizeNormal') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, t1_value);

			if (dirty[0] & /*$options*/ 2) {
				input1.checked = input1.__value === /*$options*/ ctx[1].loadingScreen.imageMode;
			}

			if (dirty[0] & /*$_*/ 1048576 && t4_value !== (t4_value = /*$_*/ ctx[20]('options.sizeStretch') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t4, t4_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label0);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t2);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label1);
			binding_group.r();
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (919:6) {#if $options.autoplay}
function create_if_block_42(ctx) {
	let t_value = /*$_*/ ctx[20]('options.autoplayHint') + "";
	let t;

	return {
		c() {
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t_value);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t_value !== (t_value = /*$_*/ ctx[20]('options.autoplayHint') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t, t_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t);
		}
	};
}

// (861:0) <Section   accent="#9966FF"   reset={() => {     $icon = null;     $loadingScreenImage = null;     resetOptions([       'app.windowTitle',       'loadingScreen',       'autoplay',       'controls',       'appearance',       'monitors',     ]);   }} >
function create_default_slot_10(ctx) {
	let div3;
	let h2;
	let t0_value = /*$_*/ ctx[20]('options.playerOptions') + "";
	let t0;
	let t1;
	let label0;
	let t2_value = /*$_*/ ctx[20]('options.pageTitle') + "";
	let t2;
	let t3;
	let input0;
	let t4;
	let div0;
	let t5_value = /*$_*/ ctx[20]('options.icon') + "";
	let t5;
	let t6;
	let imageinput0;
	let updating_file;
	let t7;
	let h30;
	let t8_value = /*$_*/ ctx[20]('options.loadingScreen') + "";
	let t8;
	let t9;
	let label1;
	let input1;
	let t10;
	let t11_value = /*$_*/ ctx[20]('options.showProgressBar') + "";
	let t11;
	let t12;
	let label2;
	let t13_value = /*$_*/ ctx[20]('options.loadingScreenText') + "";
	let t13;
	let t14;
	let input2;
	let input2_placeholder_value;
	let t15;
	let div1;
	let t16_value = /*$_*/ ctx[20]('options.loadingScreenImage') + "";
	let t16;
	let t17;
	let imageinput1;
	let updating_file_1;
	let t18;
	let t19;
	let h31;
	let t20_value = /*$_*/ ctx[20]('options.controls') + "";
	let t20;
	let t21;
	let div2;
	let label3;
	let input3;
	let t22;
	let t23_value = /*$_*/ ctx[20]('options.autoplay') + "";
	let t23;
	let t24;
	let t25;
	let label4;
	let input4;
	let t26;
	let t27_value = /*$_*/ ctx[20]('options.showFlag') + "";
	let t27;
	let t28;
	let label5;
	let input5;
	let t29;
	let t30_value = /*$_*/ ctx[20]('options.showStop') + "";
	let t30;
	let t31;
	let label6;
	let input6;
	let t32;
	let t33_value = /*$_*/ ctx[20]('options.showPause') + "";
	let t33;
	let t34;
	let label7;
	let input7;
	let t35;
	let t36_value = /*$_*/ ctx[20]('options.showFullscreen') + "";
	let t36;
	let t37;
	let p;
	let t38_value = /*$_*/ ctx[20]('options.controlsHelp') + "";
	let t38;
	let t39;
	let h32;
	let t40_value = /*$_*/ ctx[20]('options.colors') + "";
	let t40;
	let t41;
	let label8;
	let colorpicker0;
	let updating_value;
	let t42;
	let t43_value = /*$_*/ ctx[20]('options.backgroundColor') + "";
	let t43;
	let t44;
	let label9;
	let colorpicker1;
	let updating_value_1;
	let t45;
	let t46_value = /*$_*/ ctx[20]('options.foregroundColor') + "";
	let t46;
	let t47;
	let label10;
	let colorpicker2;
	let updating_value_2;
	let t48;
	let t49_value = /*$_*/ ctx[20]('options.accentColor') + "";
	let t49;
	let t50;
	let h33;
	let t51_value = /*$_*/ ctx[20]('options.monitors') + "";
	let t51;
	let t52;
	let label11;
	let input8;
	let t53;
	let t54_value = /*$_*/ ctx[20]('options.editableLists') + "";
	let t54;
	let t55;
	let label12;
	let colorpicker3;
	let updating_value_3;
	let t56;
	let t57_value = /*$_*/ ctx[20]('options.variableColor') + "";
	let t57;
	let t58;
	let label13;
	let colorpicker4;
	let updating_value_4;
	let t59;
	let t60_value = /*$_*/ ctx[20]('options.listColor') + "";
	let t60;
	let current;
	let mounted;
	let dispose;

	function imageinput0_file_binding(value) {
		/*imageinput0_file_binding*/ ctx[61](value);
	}

	let imageinput0_props = {
		previewSizes: [[64, 64], [32, 32], [16, 16]]
	};

	if (/*$icon*/ ctx[4] !== void 0) {
		imageinput0_props.file = /*$icon*/ ctx[4];
	}

	imageinput0 = new _ImageInput_svelte__WEBPACK_IMPORTED_MODULE_6__["default"]({ props: imageinput0_props });
	svelte_internal__WEBPACK_IMPORTED_MODULE_0__["binding_callbacks"].push(() => Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["bind"])(imageinput0, 'file', imageinput0_file_binding));

	function imageinput1_file_binding(value) {
		/*imageinput1_file_binding*/ ctx[64](value);
	}

	let imageinput1_props = { previewSizes: [['', '']] };

	if (/*$loadingScreenImage*/ ctx[2] !== void 0) {
		imageinput1_props.file = /*$loadingScreenImage*/ ctx[2];
	}

	imageinput1 = new _ImageInput_svelte__WEBPACK_IMPORTED_MODULE_6__["default"]({ props: imageinput1_props });
	svelte_internal__WEBPACK_IMPORTED_MODULE_0__["binding_callbacks"].push(() => Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["bind"])(imageinput1, 'file', imageinput1_file_binding));
	let if_block0 = /*$loadingScreenImage*/ ctx[2] && create_if_block_43(ctx);
	let if_block1 = /*$options*/ ctx[1].autoplay && create_if_block_42(ctx);

	function colorpicker0_value_binding(value) {
		/*colorpicker0_value_binding*/ ctx[72](value);
	}

	let colorpicker0_props = {};

	if (/*$options*/ ctx[1].appearance.background !== void 0) {
		colorpicker0_props.value = /*$options*/ ctx[1].appearance.background;
	}

	colorpicker0 = new _ColorPicker_svelte__WEBPACK_IMPORTED_MODULE_9__["default"]({ props: colorpicker0_props });
	svelte_internal__WEBPACK_IMPORTED_MODULE_0__["binding_callbacks"].push(() => Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["bind"])(colorpicker0, 'value', colorpicker0_value_binding));

	function colorpicker1_value_binding(value) {
		/*colorpicker1_value_binding*/ ctx[73](value);
	}

	let colorpicker1_props = {};

	if (/*$options*/ ctx[1].appearance.foreground !== void 0) {
		colorpicker1_props.value = /*$options*/ ctx[1].appearance.foreground;
	}

	colorpicker1 = new _ColorPicker_svelte__WEBPACK_IMPORTED_MODULE_9__["default"]({ props: colorpicker1_props });
	svelte_internal__WEBPACK_IMPORTED_MODULE_0__["binding_callbacks"].push(() => Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["bind"])(colorpicker1, 'value', colorpicker1_value_binding));

	function colorpicker2_value_binding(value) {
		/*colorpicker2_value_binding*/ ctx[74](value);
	}

	let colorpicker2_props = {};

	if (/*$options*/ ctx[1].appearance.accent !== void 0) {
		colorpicker2_props.value = /*$options*/ ctx[1].appearance.accent;
	}

	colorpicker2 = new _ColorPicker_svelte__WEBPACK_IMPORTED_MODULE_9__["default"]({ props: colorpicker2_props });
	svelte_internal__WEBPACK_IMPORTED_MODULE_0__["binding_callbacks"].push(() => Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["bind"])(colorpicker2, 'value', colorpicker2_value_binding));

	function colorpicker3_value_binding(value) {
		/*colorpicker3_value_binding*/ ctx[76](value);
	}

	let colorpicker3_props = {};

	if (/*$options*/ ctx[1].monitors.variableColor !== void 0) {
		colorpicker3_props.value = /*$options*/ ctx[1].monitors.variableColor;
	}

	colorpicker3 = new _ColorPicker_svelte__WEBPACK_IMPORTED_MODULE_9__["default"]({ props: colorpicker3_props });
	svelte_internal__WEBPACK_IMPORTED_MODULE_0__["binding_callbacks"].push(() => Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["bind"])(colorpicker3, 'value', colorpicker3_value_binding));

	function colorpicker4_value_binding(value) {
		/*colorpicker4_value_binding*/ ctx[77](value);
	}

	let colorpicker4_props = {};

	if (/*$options*/ ctx[1].monitors.listColor !== void 0) {
		colorpicker4_props.value = /*$options*/ ctx[1].monitors.listColor;
	}

	colorpicker4 = new _ColorPicker_svelte__WEBPACK_IMPORTED_MODULE_9__["default"]({ props: colorpicker4_props });
	svelte_internal__WEBPACK_IMPORTED_MODULE_0__["binding_callbacks"].push(() => Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["bind"])(colorpicker4, 'value', colorpicker4_value_binding));

	return {
		c() {
			div3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			input0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t5_value);
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(imageinput0.$$.fragment);
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			h30 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h3");
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t8_value);
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t11_value);
			t12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t13_value);
			t14 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			input2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t15 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t16 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t16_value);
			t17 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(imageinput1.$$.fragment);
			t18 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block0) if_block0.c();
			t19 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			h31 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h3");
			t20 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t20_value);
			t21 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t22 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t23 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t23_value);
			t24 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block1) if_block1.c();
			t25 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t26 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t27 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t27_value);
			t28 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t29 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t30 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t30_value);
			t31 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t32 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t33 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t33_value);
			t34 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t35 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t36 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t36_value);
			t37 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t38 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t38_value);
			t39 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			h32 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h3");
			t40 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t40_value);
			t41 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(colorpicker0.$$.fragment);
			t42 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t43 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t43_value);
			t44 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(colorpicker1.$$.fragment);
			t45 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t46 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t46_value);
			t47 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(colorpicker2.$$.fragment);
			t48 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t49 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t49_value);
			t50 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			h33 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h3");
			t51 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t51_value);
			t52 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t53 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t54 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t54_value);
			t55 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(colorpicker3.$$.fragment);
			t56 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t57 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t57_value);
			t58 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(colorpicker4.$$.fragment);
			t59 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t60 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t60_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "type", "text");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label1, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "type", "text");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "placeholder", input2_placeholder_value = /*$_*/ ctx[20]('options.loadingScreenTextPlaceholder'));
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label2, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div1, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label3, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "group svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label4, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input5, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input5, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label5, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input6, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input6, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label6, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input7, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input7, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label7, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label8, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label9, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label10, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input8, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input8, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label11, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label12, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label13, "class", "option svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div3, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, h2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h2, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, input0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input0, /*$options*/ ctx[1].app.windowTitle);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(imageinput0, div0, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, h30);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h30, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, input1);
			input1.checked = /*$options*/ ctx[1].loadingScreen.progressBar;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t10);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t12);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t13);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t14);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, input2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input2, /*$options*/ ctx[1].loadingScreen.text);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t15);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t16);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t17);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(imageinput1, div1, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t18);
			if (if_block0) if_block0.m(div3, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t19);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, h31);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h31, t20);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t21);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, div2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, label3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, input3);
			input3.checked = /*$options*/ ctx[1].autoplay;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t22);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t23);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t24);
			if (if_block1) if_block1.m(div2, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t25);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, input4);
			input4.checked = /*$options*/ ctx[1].controls.greenFlag.enabled;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, t26);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, t27);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t28);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, input5);
			input5.checked = /*$options*/ ctx[1].controls.stopAll.enabled;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, t29);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, t30);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t31);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, input6);
			input6.checked = /*$options*/ ctx[1].controls.pause.enabled;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, t32);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, t33);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t34);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, input7);
			input7.checked = /*$options*/ ctx[1].controls.fullscreen.enabled;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, t35);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, t36);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t37);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, p);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t38);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t39);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, h32);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h32, t40);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t41);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(colorpicker0, label8, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, t42);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, t43);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t44);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(colorpicker1, label9, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, t45);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, t46);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t47);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label10);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(colorpicker2, label10, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label10, t48);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label10, t49);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t50);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, h33);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h33, t51);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t52);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label11, input8);
			input8.checked = /*$options*/ ctx[1].monitors.editableLists;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label11, t53);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label11, t54);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t55);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label12);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(colorpicker3, label12, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label12, t56);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label12, t57);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t58);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label13);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(colorpicker4, label13, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label13, t59);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label13, t60);
			current = true;

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input0, "input", /*input0_input_handler*/ ctx[60]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input1, "change", /*input1_change_handler*/ ctx[62]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input2, "input", /*input2_input_handler*/ ctx[63]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input3, "change", /*input3_change_handler_1*/ ctx[67]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input4, "change", /*input4_change_handler*/ ctx[68]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input5, "change", /*input5_change_handler*/ ctx[69]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input6, "change", /*input6_change_handler*/ ctx[70]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input7, "change", /*input7_change_handler*/ ctx[71]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input8, "change", /*input8_change_handler_1*/ ctx[75])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if ((!current || dirty[0] & /*$_*/ 1048576) && t0_value !== (t0_value = /*$_*/ ctx[20]('options.playerOptions') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t2_value !== (t2_value = /*$_*/ ctx[20]('options.pageTitle') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);

			if (dirty[0] & /*$options*/ 2 && input0.value !== /*$options*/ ctx[1].app.windowTitle) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input0, /*$options*/ ctx[1].app.windowTitle);
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t5_value !== (t5_value = /*$_*/ ctx[20]('options.icon') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t5, t5_value);
			const imageinput0_changes = {};

			if (!updating_file && dirty[0] & /*$icon*/ 16) {
				updating_file = true;
				imageinput0_changes.file = /*$icon*/ ctx[4];
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_flush_callback"])(() => updating_file = false);
			}

			imageinput0.$set(imageinput0_changes);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t8_value !== (t8_value = /*$_*/ ctx[20]('options.loadingScreen') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t8, t8_value);

			if (dirty[0] & /*$options*/ 2) {
				input1.checked = /*$options*/ ctx[1].loadingScreen.progressBar;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t11_value !== (t11_value = /*$_*/ ctx[20]('options.showProgressBar') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t11, t11_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t13_value !== (t13_value = /*$_*/ ctx[20]('options.loadingScreenText') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t13, t13_value);

			if (!current || dirty[0] & /*$_*/ 1048576 && input2_placeholder_value !== (input2_placeholder_value = /*$_*/ ctx[20]('options.loadingScreenTextPlaceholder'))) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "placeholder", input2_placeholder_value);
			}

			if (dirty[0] & /*$options*/ 2 && input2.value !== /*$options*/ ctx[1].loadingScreen.text) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input2, /*$options*/ ctx[1].loadingScreen.text);
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t16_value !== (t16_value = /*$_*/ ctx[20]('options.loadingScreenImage') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t16, t16_value);
			const imageinput1_changes = {};

			if (!updating_file_1 && dirty[0] & /*$loadingScreenImage*/ 4) {
				updating_file_1 = true;
				imageinput1_changes.file = /*$loadingScreenImage*/ ctx[2];
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_flush_callback"])(() => updating_file_1 = false);
			}

			imageinput1.$set(imageinput1_changes);

			if (/*$loadingScreenImage*/ ctx[2]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_43(ctx);
					if_block0.c();
					if_block0.m(div3, t19);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t20_value !== (t20_value = /*$_*/ ctx[20]('options.controls') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t20, t20_value);

			if (dirty[0] & /*$options*/ 2) {
				input3.checked = /*$options*/ ctx[1].autoplay;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t23_value !== (t23_value = /*$_*/ ctx[20]('options.autoplay') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t23, t23_value);

			if (/*$options*/ ctx[1].autoplay) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_42(ctx);
					if_block1.c();
					if_block1.m(div2, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty[0] & /*$options*/ 2) {
				input4.checked = /*$options*/ ctx[1].controls.greenFlag.enabled;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t27_value !== (t27_value = /*$_*/ ctx[20]('options.showFlag') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t27, t27_value);

			if (dirty[0] & /*$options*/ 2) {
				input5.checked = /*$options*/ ctx[1].controls.stopAll.enabled;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t30_value !== (t30_value = /*$_*/ ctx[20]('options.showStop') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t30, t30_value);

			if (dirty[0] & /*$options*/ 2) {
				input6.checked = /*$options*/ ctx[1].controls.pause.enabled;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t33_value !== (t33_value = /*$_*/ ctx[20]('options.showPause') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t33, t33_value);

			if (dirty[0] & /*$options*/ 2) {
				input7.checked = /*$options*/ ctx[1].controls.fullscreen.enabled;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t36_value !== (t36_value = /*$_*/ ctx[20]('options.showFullscreen') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t36, t36_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t38_value !== (t38_value = /*$_*/ ctx[20]('options.controlsHelp') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t38, t38_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t40_value !== (t40_value = /*$_*/ ctx[20]('options.colors') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t40, t40_value);
			const colorpicker0_changes = {};

			if (!updating_value && dirty[0] & /*$options*/ 2) {
				updating_value = true;
				colorpicker0_changes.value = /*$options*/ ctx[1].appearance.background;
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_flush_callback"])(() => updating_value = false);
			}

			colorpicker0.$set(colorpicker0_changes);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t43_value !== (t43_value = /*$_*/ ctx[20]('options.backgroundColor') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t43, t43_value);
			const colorpicker1_changes = {};

			if (!updating_value_1 && dirty[0] & /*$options*/ 2) {
				updating_value_1 = true;
				colorpicker1_changes.value = /*$options*/ ctx[1].appearance.foreground;
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_flush_callback"])(() => updating_value_1 = false);
			}

			colorpicker1.$set(colorpicker1_changes);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t46_value !== (t46_value = /*$_*/ ctx[20]('options.foregroundColor') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t46, t46_value);
			const colorpicker2_changes = {};

			if (!updating_value_2 && dirty[0] & /*$options*/ 2) {
				updating_value_2 = true;
				colorpicker2_changes.value = /*$options*/ ctx[1].appearance.accent;
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_flush_callback"])(() => updating_value_2 = false);
			}

			colorpicker2.$set(colorpicker2_changes);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t49_value !== (t49_value = /*$_*/ ctx[20]('options.accentColor') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t49, t49_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t51_value !== (t51_value = /*$_*/ ctx[20]('options.monitors') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t51, t51_value);

			if (dirty[0] & /*$options*/ 2) {
				input8.checked = /*$options*/ ctx[1].monitors.editableLists;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t54_value !== (t54_value = /*$_*/ ctx[20]('options.editableLists') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t54, t54_value);
			const colorpicker3_changes = {};

			if (!updating_value_3 && dirty[0] & /*$options*/ 2) {
				updating_value_3 = true;
				colorpicker3_changes.value = /*$options*/ ctx[1].monitors.variableColor;
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_flush_callback"])(() => updating_value_3 = false);
			}

			colorpicker3.$set(colorpicker3_changes);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t57_value !== (t57_value = /*$_*/ ctx[20]('options.variableColor') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t57, t57_value);
			const colorpicker4_changes = {};

			if (!updating_value_4 && dirty[0] & /*$options*/ 2) {
				updating_value_4 = true;
				colorpicker4_changes.value = /*$options*/ ctx[1].monitors.listColor;
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_flush_callback"])(() => updating_value_4 = false);
			}

			colorpicker4.$set(colorpicker4_changes);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t60_value !== (t60_value = /*$_*/ ctx[20]('options.listColor') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t60, t60_value);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(imageinput0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(imageinput1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(colorpicker0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(colorpicker1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(colorpicker2.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(colorpicker3.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(colorpicker4.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(imageinput0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(imageinput1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(colorpicker0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(colorpicker1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(colorpicker2.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(colorpicker3.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(colorpicker4.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(imageinput0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(imageinput1);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(colorpicker0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(colorpicker1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(colorpicker2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(colorpicker3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(colorpicker4);
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (1002:4) {#if $options.cursor.type === 'custom'}
function create_if_block_41(ctx) {
	let div;
	let imageinput;
	let updating_file;
	let t0;
	let p;
	let t1_value = /*$_*/ ctx[20]('options.cursorHelp') + "";
	let t1;
	let t2;
	let label;
	let t3_value = /*$_*/ ctx[20]('options.cursorCenter') + "";
	let t3;
	let t4;
	let input0;
	let t5;
	let input1;
	let t6;
	let button;
	let t7_value = /*$_*/ ctx[20]('options.automaticallyCenter') + "";
	let t7;
	let button_disabled_value;
	let div_intro;
	let current;
	let mounted;
	let dispose;

	function imageinput_file_binding(value) {
		/*imageinput_file_binding*/ ctx[82](value);
	}

	let imageinput_props = { previewSizes: [[32, 32], [16, 16]] };

	if (/*$customCursorIcon*/ ctx[3] !== void 0) {
		imageinput_props.file = /*$customCursorIcon*/ ctx[3];
	}

	imageinput = new _ImageInput_svelte__WEBPACK_IMPORTED_MODULE_6__["default"]({ props: imageinput_props });
	svelte_internal__WEBPACK_IMPORTED_MODULE_0__["binding_callbacks"].push(() => Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["bind"])(imageinput, 'file', imageinput_file_binding));

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(imageinput.$$.fragment);
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t1_value);
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t3_value);
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("\n          \n          X: ");
			input0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("\n          Y: ");
			input1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			button = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t7_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "type", "number");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "min", "0");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "type", "number");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "min", "0");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "class", "svelte-p1bfed");
			button.disabled = button_disabled_value = !/*$customCursorIcon*/ ctx[3];
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div, "class", "option svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(imageinput, div, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, p);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, label);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, input0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input0, /*$options*/ ctx[1].cursor.center.x);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, input1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input1, /*$options*/ ctx[1].cursor.center.y);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, button);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(button, t7);
			current = true;

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input0, "input", /*input0_input_handler_1*/ ctx[83]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input1, "input", /*input1_input_handler_1*/ ctx[84]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button, "click", /*automaticallyCenterCursor*/ ctx[29])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			const imageinput_changes = {};

			if (!updating_file && dirty[0] & /*$customCursorIcon*/ 8) {
				updating_file = true;
				imageinput_changes.file = /*$customCursorIcon*/ ctx[3];
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_flush_callback"])(() => updating_file = false);
			}

			imageinput.$set(imageinput_changes);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t1_value !== (t1_value = /*$_*/ ctx[20]('options.cursorHelp') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, t1_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t3_value !== (t3_value = /*$_*/ ctx[20]('options.cursorCenter') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t3, t3_value);

			if (dirty[0] & /*$options*/ 2 && Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["to_number"])(input0.value) !== /*$options*/ ctx[1].cursor.center.x) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input0, /*$options*/ ctx[1].cursor.center.x);
			}

			if (dirty[0] & /*$options*/ 2 && Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["to_number"])(input1.value) !== /*$options*/ ctx[1].cursor.center.y) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input1, /*$options*/ ctx[1].cursor.center.y);
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t7_value !== (t7_value = /*$_*/ ctx[20]('options.automaticallyCenter') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t7, t7_value);

			if (!current || dirty[0] & /*$customCursorIcon*/ 8 && button_disabled_value !== (button_disabled_value = !/*$customCursorIcon*/ ctx[3])) {
				button.disabled = button_disabled_value;
			}
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(imageinput.$$.fragment, local);

			if (!div_intro) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(() => {
					div_intro = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_in_transition"])(div, svelte_transition__WEBPACK_IMPORTED_MODULE_3__["slide"], {});
					div_intro.start();
				});
			}

			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(imageinput.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(imageinput);
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (976:0) <Section   accent="#4CBFE6"   reset={() => {     $customCursorIcon = null;     resetOptions([       'cursor',       'chunks',     ]);   }} >
function create_default_slot_9(ctx) {
	let div3;
	let h2;
	let t0_value = /*$_*/ ctx[20]('options.interaction') + "";
	let t0;
	let t1;
	let div0;
	let label0;
	let input0;
	let t2;
	let t3_value = /*$_*/ ctx[20]('options.normalCursor') + "";
	let t3;
	let t4;
	let label1;
	let input1;
	let t5;
	let t6_value = /*$_*/ ctx[20]('options.noCursor') + "";
	let t6;
	let t7;
	let label2;
	let input2;
	let t8;
	let t9_value = /*$_*/ ctx[20]('options.customCursor') + "";
	let t9;
	let t10;
	let t11;
	let div1;
	let label3;
	let input3;
	let t12;
	let t13_value = /*$_*/ ctx[20]('options.pointerlock') + "";
	let t13;
	let t14;
	let a0;
	let t15_value = /*$_*/ ctx[20]('options.pointerlockHelp') + "";
	let t15;
	let t16;
	let div2;
	let label4;
	let input4;
	let t17;
	let t18_value = /*$_*/ ctx[20]('options.gamepad') + "";
	let t18;
	let t19;
	let a1;
	let t20_value = /*$_*/ ctx[20]('options.gamepadHelp') + "";
	let t20;
	let current;
	let binding_group;
	let mounted;
	let dispose;
	let if_block = /*$options*/ ctx[1].cursor.type === 'custom' && create_if_block_41(ctx);
	binding_group = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["init_binding_group"])(/*$$binding_groups*/ ctx[56][1]);

	return {
		c() {
			div3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t3_value);
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t6_value);
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t9_value);
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block) if_block.c();
			t11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t13_value);
			t14 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			a0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("a");
			t15 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t15_value);
			t16 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t17 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t18 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t18_value);
			t19 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			a1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("a");
			t20 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t20_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "name", "cursor-type");
			input0.__value = "auto";
			input0.value = input0.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "name", "cursor-type");
			input1.__value = "none";
			input1.value = input1.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label1, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "name", "cursor-type");
			input2.__value = "custom";
			input2.value = input2.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label2, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div0, "class", "group svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label3, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a0, "href", "https://experiments.turbowarp.org/pointerlock/");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a0, "target", "_blank");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a0, "rel", "noopener noreferrer");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div1, "class", "group svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label4, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a1, "href", "https://turbowarp.org/addons#gamepad");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a1, "target", "_blank");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a1, "rel", "noopener noreferrer");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "group svelte-p1bfed");
			binding_group.p(input0, input1, input2);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div3, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, h2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h2, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, label0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, input0);
			input0.checked = input0.__value === /*$options*/ ctx[1].cursor.type;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, label1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, input1);
			input1.checked = input1.__value === /*$options*/ ctx[1].cursor.type;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, label2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, input2);
			input2.checked = input2.__value === /*$options*/ ctx[1].cursor.type;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t10);
			if (if_block) if_block.m(div3, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, label3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, input3);
			input3.checked = /*$options*/ ctx[1].chunks.pointerlock;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t12);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t13);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t14);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, a0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(a0, t15);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t16);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, div2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, label4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, input4);
			input4.checked = /*$options*/ ctx[1].chunks.gamepad;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, t17);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, t18);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t19);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, a1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(a1, t20);
			current = true;

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input0, "change", /*input0_change_handler_2*/ ctx[79]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input1, "change", /*input1_change_handler_2*/ ctx[80]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input2, "change", /*input2_change_handler_1*/ ctx[81]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input3, "change", /*input3_change_handler_2*/ ctx[85]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input4, "change", /*input4_change_handler_1*/ ctx[86])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if ((!current || dirty[0] & /*$_*/ 1048576) && t0_value !== (t0_value = /*$_*/ ctx[20]('options.interaction') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);

			if (dirty[0] & /*$options*/ 2) {
				input0.checked = input0.__value === /*$options*/ ctx[1].cursor.type;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t3_value !== (t3_value = /*$_*/ ctx[20]('options.normalCursor') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t3, t3_value);

			if (dirty[0] & /*$options*/ 2) {
				input1.checked = input1.__value === /*$options*/ ctx[1].cursor.type;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t6_value !== (t6_value = /*$_*/ ctx[20]('options.noCursor') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t6, t6_value);

			if (dirty[0] & /*$options*/ 2) {
				input2.checked = input2.__value === /*$options*/ ctx[1].cursor.type;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t9_value !== (t9_value = /*$_*/ ctx[20]('options.customCursor') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t9, t9_value);

			if (/*$options*/ ctx[1].cursor.type === 'custom') {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*$options*/ 2) {
						Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block, 1);
					}
				} else {
					if_block = create_if_block_41(ctx);
					if_block.c();
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block, 1);
					if_block.m(div3, t11);
				}
			} else if (if_block) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["group_outros"])();

				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block, 1, 1, () => {
					if_block = null;
				});

				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["check_outros"])();
			}

			if (dirty[0] & /*$options*/ 2) {
				input3.checked = /*$options*/ ctx[1].chunks.pointerlock;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t13_value !== (t13_value = /*$_*/ ctx[20]('options.pointerlock') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t13, t13_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t15_value !== (t15_value = /*$_*/ ctx[20]('options.pointerlockHelp') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t15, t15_value);

			if (dirty[0] & /*$options*/ 2) {
				input4.checked = /*$options*/ ctx[1].chunks.gamepad;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t18_value !== (t18_value = /*$_*/ ctx[20]('options.gamepad') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t18, t18_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t20_value !== (t20_value = /*$_*/ ctx[20]('options.gamepadHelp') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t20, t20_value);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div3);
			if (if_block) if_block.d();
			binding_group.r();
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (1116:4) {:else}
function create_else_block_6(ctx) {
	let p;
	let t_value = /*$_*/ ctx[20]('options.noCloudVariables') + "";
	let t;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t_value !== (t_value = /*$_*/ ctx[20]('options.noCloudVariables') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t, t_value);
		},
		i: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		o: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

// (1054:4) {#if cloudVariables.length > 0}
function create_if_block_37(ctx) {
	let label0;
	let t0_value = /*$_*/ ctx[20]('options.mode') + "";
	let t0;
	let t1;
	let select;
	let option0;
	let t2_value = /*$_*/ ctx[20]('options.cloudVariables-ws') + "";
	let t2;
	let option1;
	let t3_value = /*$_*/ ctx[20]('options.cloudVariables-local') + "";
	let t3;
	let option2;
	let t4_value = /*$_*/ ctx[20]('options.cloudVariables-ignore') + "";
	let t4;
	let option3;
	let t5_value = /*$_*/ ctx[20]('options.cloudVariables-custom') + "";
	let t5;
	let t6;
	let t7;
	let t8;
	let p0;
	let t9_value = /*$_*/ ctx[20]('options.cloudVariables-ws-help') + "";
	let t9;
	let t10;
	let p1;
	let t11_value = /*$_*/ ctx[20]('options.cloudVariables-local-help') + "";
	let t11;
	let t12;
	let p2;
	let t13_value = /*$_*/ ctx[20]('options.cloudVariables-ignore-help') + "";
	let t13;
	let t14;
	let p3;
	let t15_value = /*$_*/ ctx[20]('options.cloudVariables-custom-help') + "";
	let t15;
	let t16;
	let div0;
	let label1;
	let input0;
	let t17;
	let t18_value = /*$_*/ ctx[20]('options.specialCloudBehaviors') + "";
	let t18;
	let t19;
	let learnmore0;
	let t20;
	let div1;
	let label2;
	let input1;
	let t21;
	let t22_value = /*$_*/ ctx[20]('options.unsafeCloudBehaviors') + "";
	let t22;
	let t23;
	let learnmore1;
	let t24;
	let t25;
	let p4;
	let t26_value = /*$_*/ ctx[20]('options.implicitCloudHint').replace('{cloud}', '☁') + "";
	let t26;
	let current;
	let mounted;
	let dispose;
	let if_block0 = /*$options*/ ctx[1].cloudVariables.mode === "custom" && create_if_block_40(ctx);
	let if_block1 = (/*$options*/ ctx[1].cloudVariables.mode === 'ws' || /*$options*/ ctx[1].cloudVariables.mode === 'custom') && create_if_block_39(ctx);

	learnmore0 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({
			props: { slug: "packager/special-cloud-behaviors" }
		});

	learnmore1 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({
			props: {
				slug: "packager/special-cloud-behaviors#eval"
			}
		});

	let if_block2 = /*$options*/ ctx[1].cloudVariables.unsafeCloudBehaviors && create_if_block_38(ctx);

	return {
		c() {
			label0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			select = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("select");
			option0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			option1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t3_value);
			option2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t4_value);
			option3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t5_value);
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block0) if_block0.c();
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block1) if_block1.c();
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t9_value);
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t11_value);
			t12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t13_value);
			t14 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t15 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t15_value);
			t16 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t17 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t18 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t18_value);
			t19 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore0.$$.fragment);
			t20 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t21 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t22 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t22_value);
			t23 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore1.$$.fragment);
			t24 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block2) if_block2.c();
			t25 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t26 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t26_value);
			option0.__value = "ws";
			option0.value = option0.__value;
			option1.__value = "local";
			option1.value = option1.__value;
			option2.__value = "";
			option2.value = option2.__value;
			option3.__value = "custom";
			option3.value = option3.__value;
			if (/*$options*/ ctx[1].cloudVariables.mode === void 0) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(() => /*select_change_handler*/ ctx[88].call(select));
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p2, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p3, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div1, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p4, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label0, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, select);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option0, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option1, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option2, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option3, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select, /*$options*/ ctx[1].cloudVariables.mode, true);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t6, anchor);
			if (if_block0) if_block0.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t7, anchor);
			if (if_block1) if_block1.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t8, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p0, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p0, t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t10, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p1, t11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t12, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p2, t13);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t14, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p3, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p3, t15);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t16, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div0, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, label1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, input0);
			input0.checked = /*$options*/ ctx[1].cloudVariables.specialCloudBehaviors;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t17);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t18);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t19);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore0, div0, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t20, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, label2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, input1);
			input1.checked = /*$options*/ ctx[1].cloudVariables.unsafeCloudBehaviors;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t21);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t22);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t23);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore1, div1, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t24, anchor);
			if (if_block2) if_block2.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t25, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p4, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p4, t26);
			current = true;

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(select, "change", /*select_change_handler*/ ctx[88]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input0, "change", /*input0_change_handler_3*/ ctx[91]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input1, "change", /*input1_change_handler_3*/ ctx[92])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if ((!current || dirty[0] & /*$_*/ 1048576) && t0_value !== (t0_value = /*$_*/ ctx[20]('options.mode') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t2_value !== (t2_value = /*$_*/ ctx[20]('options.cloudVariables-ws') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t3_value !== (t3_value = /*$_*/ ctx[20]('options.cloudVariables-local') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t3, t3_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t4_value !== (t4_value = /*$_*/ ctx[20]('options.cloudVariables-ignore') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t4, t4_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t5_value !== (t5_value = /*$_*/ ctx[20]('options.cloudVariables-custom') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t5, t5_value);

			if (dirty[0] & /*$options*/ 2) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select, /*$options*/ ctx[1].cloudVariables.mode);
			}

			if (/*$options*/ ctx[1].cloudVariables.mode === "custom") {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty[0] & /*$options*/ 2) {
						Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_40(ctx);
					if_block0.c();
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block0, 1);
					if_block0.m(t7.parentNode, t7);
				}
			} else if (if_block0) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["group_outros"])();

				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["check_outros"])();
			}

			if (/*$options*/ ctx[1].cloudVariables.mode === 'ws' || /*$options*/ ctx[1].cloudVariables.mode === 'custom') {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty[0] & /*$options*/ 2) {
						Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_39(ctx);
					if_block1.c();
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block1, 1);
					if_block1.m(t8.parentNode, t8);
				}
			} else if (if_block1) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["group_outros"])();

				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["check_outros"])();
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t9_value !== (t9_value = /*$_*/ ctx[20]('options.cloudVariables-ws-help') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t9, t9_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t11_value !== (t11_value = /*$_*/ ctx[20]('options.cloudVariables-local-help') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t11, t11_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t13_value !== (t13_value = /*$_*/ ctx[20]('options.cloudVariables-ignore-help') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t13, t13_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t15_value !== (t15_value = /*$_*/ ctx[20]('options.cloudVariables-custom-help') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t15, t15_value);

			if (dirty[0] & /*$options*/ 2) {
				input0.checked = /*$options*/ ctx[1].cloudVariables.specialCloudBehaviors;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t18_value !== (t18_value = /*$_*/ ctx[20]('options.specialCloudBehaviors') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t18, t18_value);

			if (dirty[0] & /*$options*/ 2) {
				input1.checked = /*$options*/ ctx[1].cloudVariables.unsafeCloudBehaviors;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t22_value !== (t22_value = /*$_*/ ctx[20]('options.unsafeCloudBehaviors') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t22, t22_value);

			if (/*$options*/ ctx[1].cloudVariables.unsafeCloudBehaviors) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block_38(ctx);
					if_block2.c();
					if_block2.m(t25.parentNode, t25);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t26_value !== (t26_value = /*$_*/ ctx[20]('options.implicitCloudHint').replace('{cloud}', '☁') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t26, t26_value);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore1.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label0);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t6);
			if (if_block0) if_block0.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t7);
			if (if_block1) if_block1.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t8);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p0);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t10);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p1);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t12);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p2);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t14);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p3);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t16);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore0);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t20);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore1);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t24);
			if (if_block2) if_block2.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t25);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p4);
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (1065:6) {#if $options.cloudVariables.mode === "custom"}
function create_if_block_40(ctx) {
	let div;
	let div_transition;
	let current;
	let each_value_1 = /*cloudVariables*/ ctx[21];
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div, null);
				}
			}

			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*cloudVariables, $options, $_*/ 3145730) {
				each_value_1 = /*cloudVariables*/ ctx[21];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_1.length;
			}
		},
		i(local) {
			if (current) return;

			if (local) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(() => {
					if (!current) return;
					if (!div_transition) div_transition = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_bidirectional_transition"])(div, svelte_transition__WEBPACK_IMPORTED_MODULE_3__["fade"], {}, true);
					div_transition.run(1);
				});
			}

			current = true;
		},
		o(local) {
			if (local) {
				if (!div_transition) div_transition = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_bidirectional_transition"])(div, svelte_transition__WEBPACK_IMPORTED_MODULE_3__["fade"], {}, false);
				div_transition.run(0);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_each"])(each_blocks, detaching);
			if (detaching && div_transition) div_transition.end();
		}
	};
}

// (1067:10) {#each cloudVariables as variable}
function create_each_block_1(ctx) {
	let label;
	let select;
	let option0;
	let t0_value = /*$_*/ ctx[20]('options.cloudVariables-ws') + "";
	let t0;
	let option1;
	let t1_value = /*$_*/ ctx[20]('options.cloudVariables-local') + "";
	let t1;
	let option2;
	let t2_value = /*$_*/ ctx[20]('options.cloudVariables-ignore') + "";
	let t2;
	let t3;
	let t4_value = /*variable*/ ctx[158] + "";
	let t4;
	let t5;
	let mounted;
	let dispose;

	function select_change_handler_1() {
		/*select_change_handler_1*/ ctx[89].call(select, /*variable*/ ctx[158]);
	}

	return {
		c() {
			label = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			select = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("select");
			option0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			option1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t1_value);
			option2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t4_value);
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			option0.__value = "ws";
			option0.value = option0.__value;
			option1.__value = "local";
			option1.value = option1.__value;
			option2.__value = "";
			option2.value = option2.__value;
			if (/*$options*/ ctx[1].cloudVariables.custom[/*variable*/ ctx[158]] === void 0) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(select_change_handler_1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label, "class", "option svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, select);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option0, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option1, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option2, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select, /*$options*/ ctx[1].cloudVariables.custom[/*variable*/ ctx[158]], true);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t5);

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(select, "change", select_change_handler_1);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty[0] & /*$_*/ 1048576 && t0_value !== (t0_value = /*$_*/ ctx[20]('options.cloudVariables-ws') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if (dirty[0] & /*$_*/ 1048576 && t1_value !== (t1_value = /*$_*/ ctx[20]('options.cloudVariables-local') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, t1_value);
			if (dirty[0] & /*$_*/ 1048576 && t2_value !== (t2_value = /*$_*/ ctx[20]('options.cloudVariables-ignore') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);

			if (dirty[0] & /*$options, cloudVariables*/ 2097154) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select, /*$options*/ ctx[1].cloudVariables.custom[/*variable*/ ctx[158]]);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label);
			mounted = false;
			dispose();
		}
	};
}

// (1080:6) {#if $options.cloudVariables.mode === 'ws' || $options.cloudVariables.mode === 'custom'}
function create_if_block_39(ctx) {
	let div;
	let label;
	let t0_value = /*$_*/ ctx[20]('options.cloudVariablesHost') + "";
	let t0;
	let t1;
	let input;
	let div_transition;
	let current;
	let mounted;
	let dispose;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			input = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input, "type", "text");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input, "pattern", "wss?:.*");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label, "class", "option svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, label);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, input);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input, /*$options*/ ctx[1].cloudVariables.cloudHost);
			current = true;

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input, "input", /*input_input_handler*/ ctx[90]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if ((!current || dirty[0] & /*$_*/ 1048576) && t0_value !== (t0_value = /*$_*/ ctx[20]('options.cloudVariablesHost') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);

			if (dirty[0] & /*$options*/ 2 && input.value !== /*$options*/ ctx[1].cloudVariables.cloudHost) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input, /*$options*/ ctx[1].cloudVariables.cloudHost);
			}
		},
		i(local) {
			if (current) return;

			if (local) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(() => {
					if (!current) return;
					if (!div_transition) div_transition = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_bidirectional_transition"])(div, svelte_transition__WEBPACK_IMPORTED_MODULE_3__["fade"], {}, true);
					div_transition.run(1);
				});
			}

			current = true;
		},
		o(local) {
			if (local) {
				if (!div_transition) div_transition = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_bidirectional_transition"])(div, svelte_transition__WEBPACK_IMPORTED_MODULE_3__["fade"], {}, false);
				div_transition.run(0);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
			if (detaching && div_transition) div_transition.end();
			mounted = false;
			dispose();
		}
	};
}

// (1112:6) {#if $options.cloudVariables.unsafeCloudBehaviors}
function create_if_block_38(ctx) {
	let p;
	let t_value = /*$_*/ ctx[20]('options.unsafeCloudBehaviorsWarning') + "";
	let t;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "warning svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t_value !== (t_value = /*$_*/ ctx[20]('options.unsafeCloudBehaviorsWarning') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t, t_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

// (1043:0) <Section   accent="#FF8C1A"   reset={cloudVariables.length === 0 ? null : () => {     resetOptions([       'cloudVariables'     ]);   }} >
function create_default_slot_8(ctx) {
	let div;
	let h2;
	let t0_value = /*$_*/ ctx[20]('options.cloudVariables') + "";
	let t0;
	let t1;
	let current_block_type_index;
	let if_block;
	let current;
	const if_block_creators = [create_if_block_37, create_else_block_6];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*cloudVariables*/ ctx[21].length > 0) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx, [-1, -1, -1, -1, -1, -1]);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if_block.c();
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, h2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h2, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t1);
			if_blocks[current_block_type_index].m(div, null);
			current = true;
		},
		p(ctx, dirty) {
			if ((!current || dirty[0] & /*$_*/ 1048576) && t0_value !== (t0_value = /*$_*/ ctx[20]('options.cloudVariables') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if_block.p(ctx, dirty);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
			if_blocks[current_block_type_index].d();
		}
	};
}

// (1168:6) {#if $options.compiler.compiledProject}
function create_if_block_35(ctx) {
	let div;
	let label;
	let input;
	let t0;
	let t1_value = /*$_*/ ctx[20]('options.obfuscateCompiledProject') + "";
	let t1;
	let t2;
	let if_block_anchor;
	let mounted;
	let dispose;
	let if_block = /*$options*/ ctx[1].compiler.obfuscateCompiledProject && create_if_block_36(ctx);

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t1_value);
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block) if_block.c();
			if_block_anchor = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["empty"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div, "class", "option svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, label);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, input);
			input.checked = /*$options*/ ctx[1].compiler.obfuscateCompiledProject;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t2, anchor);
			if (if_block) if_block.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, if_block_anchor, anchor);

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input, "change", /*input_change_handler*/ ctx[98]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$options*/ 2) {
				input.checked = /*$options*/ ctx[1].compiler.obfuscateCompiledProject;
			}

			if (dirty[0] & /*$_*/ 1048576 && t1_value !== (t1_value = /*$_*/ ctx[20]('options.obfuscateCompiledProject') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, t1_value);

			if (/*$options*/ ctx[1].compiler.obfuscateCompiledProject) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_36(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t2);
			if (if_block) if_block.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(if_block_anchor);
			mounted = false;
			dispose();
		}
	};
}

// (1175:8) {#if $options.compiler.obfuscateCompiledProject}
function create_if_block_36(ctx) {
	let label;
	let t0_value = /*$_*/ ctx[20]('options.obfuscateCompiledProjectLevel') + "";
	let t0;
	let t1;
	let select;
	let option0;
	let t2_value = /*$_*/ ctx[20]('options.obfuscationLevelLight') + "";
	let t2;
	let option1;
	let t3_value = /*$_*/ ctx[20]('options.obfuscationLevelBalanced') + "";
	let t3;
	let option2;
	let t4_value = /*$_*/ ctx[20]('options.obfuscationLevelStrong') + "";
	let t4;
	let mounted;
	let dispose;

	return {
		c() {
			label = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			select = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("select");
			option0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			option1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t3_value);
			option2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t4_value);
			option0.__value = "light";
			option0.value = option0.__value;
			option1.__value = "balanced";
			option1.value = option1.__value;
			option2.__value = "strong";
			option2.value = option2.__value;
			if (/*$options*/ ctx[1].compiler.obfuscateCompiledProjectLevel === void 0) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(() => /*select_change_handler_2*/ ctx[99].call(select));
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label, "class", "option svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label, select);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option0, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option1, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option2, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select, /*$options*/ ctx[1].compiler.obfuscateCompiledProjectLevel, true);

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(select, "change", /*select_change_handler_2*/ ctx[99]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t0_value !== (t0_value = /*$_*/ ctx[20]('options.obfuscateCompiledProjectLevel') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if (dirty[0] & /*$_*/ 1048576 && t2_value !== (t2_value = /*$_*/ ctx[20]('options.obfuscationLevelLight') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);
			if (dirty[0] & /*$_*/ 1048576 && t3_value !== (t3_value = /*$_*/ ctx[20]('options.obfuscationLevelBalanced') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t3, t3_value);
			if (dirty[0] & /*$_*/ 1048576 && t4_value !== (t4_value = /*$_*/ ctx[20]('options.obfuscationLevelStrong') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t4, t4_value);

			if (dirty[0] & /*$options*/ 2) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select, /*$options*/ ctx[1].compiler.obfuscateCompiledProjectLevel);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label);
			mounted = false;
			dispose();
		}
	};
}

// (1122:0) <Section   accent="#FF6680"   reset={() => {     resetOptions([       'compiler',       'extensions',       'bakeExtensions',       'custom',       'projectId',       'maxTextureDimension'     ]);   }}   >
function create_default_slot_7(ctx) {
	let div3;
	let h2;
	let t0_value = /*$_*/ ctx[20]('options.advancedOptions') + "";
	let t0;
	let t1;
	let details;
	let summary;
	let t2_value = /*$_*/ ctx[20]('options.advancedSummary') + "";
	let t2;
	let t3;
	let div0;
	let label0;
	let input0;
	let t4;
	let t5_value = /*$_*/ ctx[20]('options.enableCompiler') + "";
	let t5;
	let t6;
	let learnmore0;
	let t7;
	let div1;
	let label1;
	let input1;
	let t8;
	let t9_value = /*$_*/ ctx[20]('options.warpTimer') + "";
	let t9;
	let t10;
	let learnmore1;
	let t11;
	let div2;
	let label2;
	let input2;
	let t12;
	let t13_value = /*$_*/ ctx[20]('options.compiledProject') + "";
	let t13;
	let t14;
	let t15;
	let label3;
	let t16_value = /*$_*/ ctx[20]('options.customExtensions') + "";
	let t16;
	let t17;
	let learnmore2;
	let t18;
	let customextensions;
	let updating_extensions;
	let t19;
	let p0;
	let t20_value = /*$_*/ ctx[20]('options.customExtensionsSecurity') + "";
	let t20;
	let t21;
	let label4;
	let input3;
	let t22;
	let t23_value = /*$_*/ ctx[20]('options.bakeExtensions') + "";
	let t23;
	let t24;
	let label5;
	let t25_value = /*$_*/ ctx[20]('options.customCSS') + "";
	let t25;
	let t26;
	let textarea0;
	let t27;
	let label6;
	let t28_value = /*$_*/ ctx[20]('options.customJS') + "";
	let t28;
	let t29;
	let textarea1;
	let t30;
	let label7;
	let t31_value = /*$_*/ ctx[20]('options.projectId') + "";
	let t31;
	let t32;
	let input4;
	let t33;
	let p1;
	let t34_value = /*$_*/ ctx[20]('options.projectIdHelp') + "";
	let t34;
	let t35;
	let label8;
	let input5;
	let t36;
	let t37_value = /*$_*/ ctx[20]('options.packagedRuntime') + "";
	let t37;
	let t38;
	let label9;
	let input6;
	let input6_checked_value;
	let t39;
	let t40_value = /*$_*/ ctx[20]('options.maxTextureDimension') + "";
	let t40;
	let current;
	let mounted;
	let dispose;
	learnmore0 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({ props: { slug: "disable-compiler" } });
	learnmore1 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({ props: { slug: "warp-timer" } });
	let if_block = /*$options*/ ctx[1].compiler.compiledProject && create_if_block_35(ctx);

	learnmore2 = new _LearnMore_svelte__WEBPACK_IMPORTED_MODULE_8__["default"]({
			props: { slug: "development/custom-extensions" }
		});

	function customextensions_extensions_binding(value) {
		/*customextensions_extensions_binding*/ ctx[100](value);
	}

	let customextensions_props = {};

	if (/*$options*/ ctx[1].extensions !== void 0) {
		customextensions_props.extensions = /*$options*/ ctx[1].extensions;
	}

	customextensions = new _p4_CustomExtensions_svelte__WEBPACK_IMPORTED_MODULE_7__["default"]({ props: customextensions_props });
	svelte_internal__WEBPACK_IMPORTED_MODULE_0__["binding_callbacks"].push(() => Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["bind"])(customextensions, 'extensions', customextensions_extensions_binding));

	return {
		c() {
			div3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			details = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("details");
			summary = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("summary");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t5_value);
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore0.$$.fragment);
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t9_value);
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore1.$$.fragment);
			t11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t13_value);
			t14 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block) if_block.c();
			t15 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t16 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t16_value);
			t17 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(learnmore2.$$.fragment);
			t18 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(customextensions.$$.fragment);
			t19 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t20 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t20_value);
			t21 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t22 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t23 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t23_value);
			t24 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t25 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t25_value);
			t26 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			textarea0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("textarea");
			t27 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t28 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t28_value);
			t29 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			textarea1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("textarea");
			t30 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t31 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t31_value);
			t32 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			input4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t33 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t34 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t34_value);
			t35 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t36 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t37 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t37_value);
			t38 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t39 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t40 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t40_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div1, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "id", "compiled-project-option");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p0, "class", "warning svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label3, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label4, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(textarea0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label5, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(textarea1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label6, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "type", "text");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label7, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input5, "type", "checkbox");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input5, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label8, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input6, "type", "checkbox");
			input6.checked = input6_checked_value = /*$options*/ ctx[1].maxTextureDimension !== /*defaultOptions*/ ctx[6].maxTextureDimension;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input6, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label9, "class", "option svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div3, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, h2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h2, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, details);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, summary);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(summary, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, label0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, input0);
			input0.checked = /*$options*/ ctx[1].compiler.enabled;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore0, div0, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, label1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, input1);
			input1.checked = /*$options*/ ctx[1].compiler.warpTimer;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t10);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore1, div1, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, div2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, label2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, input2);
			input2.checked = /*$options*/ ctx[1].compiler.compiledProject;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t12);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t13);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t14);
			if (if_block) if_block.m(details, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t15);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, label3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t16);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t17);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(learnmore2, label3, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t18);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(customextensions, label3, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t19);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, p0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p0, t20);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t21);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, label4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, input3);
			input3.checked = /*$options*/ ctx[1].bakeExtensions;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, t22);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, t23);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t24);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, label5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, t25);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, t26);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, textarea0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(textarea0, /*$options*/ ctx[1].custom.css);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t27);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, label6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, t28);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, t29);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, textarea1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(textarea1, /*$options*/ ctx[1].custom.js);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t30);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, label7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, t31);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, t32);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, input4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input4, /*$options*/ ctx[1].projectId);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t33);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, p1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p1, t34);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t35);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, label8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, input5);
			input5.checked = /*$options*/ ctx[1].packagedRuntime;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, t36);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, t37);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t38);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, label9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, input6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, t39);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, t40);
			details.open = /*advancedOptionsOpen*/ ctx[8];
			current = true;

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input0, "change", /*input0_change_handler_4*/ ctx[94]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input1, "change", /*input1_change_handler_4*/ ctx[95]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input2, "change", /*input2_change_handler_2*/ ctx[96]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input2, "change", /*change_handler_3*/ ctx[97]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input3, "change", /*input3_change_handler_3*/ ctx[101]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(textarea0, "input", /*textarea0_input_handler*/ ctx[102]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(textarea1, "input", /*textarea1_input_handler*/ ctx[103]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input4, "input", /*input4_input_handler*/ ctx[104]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input5, "change", /*input5_change_handler_1*/ ctx[105]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input6, "change", /*change_handler_4*/ ctx[106]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(details, "toggle", /*details_toggle_handler*/ ctx[107])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if ((!current || dirty[0] & /*$_*/ 1048576) && t0_value !== (t0_value = /*$_*/ ctx[20]('options.advancedOptions') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t2_value !== (t2_value = /*$_*/ ctx[20]('options.advancedSummary') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);

			if (dirty[0] & /*$options*/ 2) {
				input0.checked = /*$options*/ ctx[1].compiler.enabled;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t5_value !== (t5_value = /*$_*/ ctx[20]('options.enableCompiler') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t5, t5_value);

			if (dirty[0] & /*$options*/ 2) {
				input1.checked = /*$options*/ ctx[1].compiler.warpTimer;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t9_value !== (t9_value = /*$_*/ ctx[20]('options.warpTimer') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t9, t9_value);

			if (dirty[0] & /*$options*/ 2) {
				input2.checked = /*$options*/ ctx[1].compiler.compiledProject;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t13_value !== (t13_value = /*$_*/ ctx[20]('options.compiledProject') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t13, t13_value);

			if (/*$options*/ ctx[1].compiler.compiledProject) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_35(ctx);
					if_block.c();
					if_block.m(details, t15);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t16_value !== (t16_value = /*$_*/ ctx[20]('options.customExtensions') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t16, t16_value);
			const customextensions_changes = {};

			if (!updating_extensions && dirty[0] & /*$options*/ 2) {
				updating_extensions = true;
				customextensions_changes.extensions = /*$options*/ ctx[1].extensions;
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_flush_callback"])(() => updating_extensions = false);
			}

			customextensions.$set(customextensions_changes);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t20_value !== (t20_value = /*$_*/ ctx[20]('options.customExtensionsSecurity') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t20, t20_value);

			if (dirty[0] & /*$options*/ 2) {
				input3.checked = /*$options*/ ctx[1].bakeExtensions;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t23_value !== (t23_value = /*$_*/ ctx[20]('options.bakeExtensions') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t23, t23_value);
			if ((!current || dirty[0] & /*$_*/ 1048576) && t25_value !== (t25_value = /*$_*/ ctx[20]('options.customCSS') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t25, t25_value);

			if (dirty[0] & /*$options*/ 2) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(textarea0, /*$options*/ ctx[1].custom.css);
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t28_value !== (t28_value = /*$_*/ ctx[20]('options.customJS') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t28, t28_value);

			if (dirty[0] & /*$options*/ 2) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(textarea1, /*$options*/ ctx[1].custom.js);
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t31_value !== (t31_value = /*$_*/ ctx[20]('options.projectId') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t31, t31_value);

			if (dirty[0] & /*$options*/ 2 && input4.value !== /*$options*/ ctx[1].projectId) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input4, /*$options*/ ctx[1].projectId);
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t34_value !== (t34_value = /*$_*/ ctx[20]('options.projectIdHelp') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t34, t34_value);

			if (dirty[0] & /*$options*/ 2) {
				input5.checked = /*$options*/ ctx[1].packagedRuntime;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t37_value !== (t37_value = /*$_*/ ctx[20]('options.packagedRuntime') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t37, t37_value);

			if (!current || dirty[0] & /*$options, defaultOptions*/ 66 && input6_checked_value !== (input6_checked_value = /*$options*/ ctx[1].maxTextureDimension !== /*defaultOptions*/ ctx[6].maxTextureDimension)) {
				input6.checked = input6_checked_value;
			}

			if ((!current || dirty[0] & /*$_*/ 1048576) && t40_value !== (t40_value = /*$_*/ ctx[20]('options.maxTextureDimension') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t40, t40_value);

			if (dirty[0] & /*advancedOptionsOpen*/ 256) {
				details.open = /*advancedOptionsOpen*/ ctx[8];
			}
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(learnmore2.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(customextensions.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(learnmore2.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(customextensions.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore1);
			if (if_block) if_block.d();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(learnmore2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(customextensions);
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (1232:0) <Section   accent="#0FBD8C"   reset={() => {     resetOptions([       'target'     ])   }} >
function create_default_slot_6(ctx) {
	let div7;
	let h2;
	let t0_value = /*$_*/ ctx[20]('options.environment') + "";
	let t0;
	let t1;
	let div0;
	let label0;
	let input0;
	let t2;
	let t3_value = /*$_*/ ctx[20]('options.html') + "";
	let t3;
	let t4;
	let label1;
	let input1;
	let t5;
	let t6_value = /*$_*/ ctx[20]('options.zip') + "";
	let t6;
	let t7;
	let div1;
	let label2;
	let input2;
	let t8;
	let t9_value = /*$_*/ ctx[20]('options.application-win32').replace('{type}', 'Electron') + "";
	let t9;
	let t10;
	let label3;
	let input3;
	let t11;
	let t12_value = /*$_*/ ctx[20]('options.application-mac').replace('{type}', 'WKWebView') + "";
	let t12;
	let t13;
	let label4;
	let input4;
	let t14;
	let t15_value = /*$_*/ ctx[20]('options.application-linux64').replace('{type}', 'Electron') + "";
	let t15;
	let t16;
	let details;
	let summary;
	let t17_value = /*$_*/ ctx[20]('options.otherEnvironments') + "";
	let t17;
	let t18;
	let p;
	let t19_value = /*$_*/ ctx[20]('options.otherEnvironmentsHelp') + "";
	let t19;
	let t20;
	let div2;
	let label5;
	let input5;
	let t21;
	let t22_value = /*$_*/ ctx[20]('options.zip-one-asset') + "";
	let t22;
	let t23;
	let div3;
	let label6;
	let input6;
	let t24;
	let t25;
	let div4;
	let label7;
	let input7;
	let t26;
	let t27_value = /*$_*/ ctx[20]('options.application-win64').replace('{type}', 'Electron') + "";
	let t27;
	let t28;
	let label8;
	let input8;
	let t29;
	let t30_value = /*$_*/ ctx[20]('options.application-win-arm').replace('{type}', 'Electron') + "";
	let t30;
	let t31;
	let label9;
	let input9;
	let t32;
	let t33_value = /*$_*/ ctx[20]('options.application-mac').replace('{type}', 'Electron') + "";
	let t33;
	let t34;
	let label10;
	let input10;
	let t35;
	let t36_value = /*$_*/ ctx[20]('options.application-linux-arm32').replace('{type}', 'Electron') + "";
	let t36;
	let t37;
	let label11;
	let input11;
	let t38;
	let t39_value = /*$_*/ ctx[20]('options.application-linux-arm64').replace('{type}', 'Electron') + "";
	let t39;
	let t40;
	let div5;
	let label12;
	let input12;
	let t41;
	let t42_value = /*$_*/ ctx[20]('options.application-win32').replace('{type}', 'NW.js') + "";
	let t42;
	let t43;
	let label13;
	let input13;
	let t44;
	let t45_value = /*$_*/ ctx[20]('options.application-win64').replace('{type}', 'NW.js') + "";
	let t45;
	let t46;
	let label14;
	let input14;
	let t47;
	let t48_value = /*$_*/ ctx[20]('options.application-mac').replace('{type}', 'NW.js') + "";
	let t48;
	let t49;
	let label15;
	let input15;
	let t50;
	let t51_value = /*$_*/ ctx[20]('options.application-linux64').replace('{type}', 'NW.js') + "";
	let t51;
	let t52;
	let div6;
	let label16;
	let input16;
	let t53;
	let t54;
	let label17;
	let input17;
	let t55;
	let t56;
	let label18;
	let input18;
	let t57;
	let binding_group;
	let mounted;
	let dispose;
	binding_group = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["init_binding_group"])(/*$$binding_groups*/ ctx[56][0]);

	return {
		c() {
			div7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t3_value);
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t6_value);
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t9_value);
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t12_value);
			t13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t14 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t15 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t15_value);
			t16 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			details = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("details");
			summary = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("summary");
			t17 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t17_value);
			t18 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t19 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t19_value);
			t20 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t21 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t22 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t22_value);
			t23 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t24 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("\n          Cordova Android APK");
			t25 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t26 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t27 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t27_value);
			t28 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t29 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t30 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t30_value);
			t31 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t32 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t33 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t33_value);
			t34 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t35 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t36 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t36_value);
			t37 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t38 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t39 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t39_value);
			t40 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t41 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t42 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t42_value);
			t43 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t44 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t45 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t45_value);
			t46 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label14 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input14 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t47 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t48 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t48_value);
			t49 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label15 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input15 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t50 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t51 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t51_value);
			t52 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			label16 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input16 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t53 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("\n          Node.js CLI (Windows 64-bit)");
			t54 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label17 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input17 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t55 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("\n          Node.js CLI (macOS)");
			t56 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label18 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			input18 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t57 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("\n          Node.js CLI (Linux 64-bit)");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "name", "environment");
			input0.__value = "html";
			input0.value = input0.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "name", "environment");
			input1.__value = "zip";
			input1.value = input1.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label1, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div0, "class", "group svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "name", "environment");
			input2.__value = "electron-win32";
			input2.value = input2.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input2, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label2, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "name", "environment");
			input3.__value = "webview-mac";
			input3.value = input3.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input3, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label3, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "name", "environment");
			input4.__value = "electron-linux64";
			input4.value = input4.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input4, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label4, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div1, "class", "group svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input5, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input5, "name", "environment");
			input5.__value = "zip-one-asset";
			input5.value = input5.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input5, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label5, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "group svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input6, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input6, "name", "environment");
			input6.__value = "cordova-android";
			input6.value = input6.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input6, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label6, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div3, "class", "group svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input7, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input7, "name", "environment");
			input7.__value = "electron-win64";
			input7.value = input7.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input7, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label7, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input8, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input8, "name", "environment");
			input8.__value = "electron-win-arm";
			input8.value = input8.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input8, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label8, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input9, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input9, "name", "environment");
			input9.__value = "electron-mac";
			input9.value = input9.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input9, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label9, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input10, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input10, "name", "environment");
			input10.__value = "electron-linux-arm32";
			input10.value = input10.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input10, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label10, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input11, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input11, "name", "environment");
			input11.__value = "electron-linux-arm64";
			input11.value = input11.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input11, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label11, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div4, "class", "group svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input12, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input12, "name", "environment");
			input12.__value = "nwjs-win32";
			input12.value = input12.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input12, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label12, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input13, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input13, "name", "environment");
			input13.__value = "nwjs-win64";
			input13.value = input13.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input13, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label13, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input14, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input14, "name", "environment");
			input14.__value = "nwjs-mac";
			input14.value = input14.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input14, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label14, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input15, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input15, "name", "environment");
			input15.__value = "nwjs-linux-x64";
			input15.value = input15.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input15, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label15, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div5, "class", "group svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input16, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input16, "name", "environment");
			input16.__value = "node-cli-win64";
			input16.value = input16.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input16, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label16, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input17, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input17, "name", "environment");
			input17.__value = "node-cli-mac";
			input17.value = input17.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input17, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label17, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input18, "type", "radio");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input18, "name", "environment");
			input18.__value = "node-cli-linux64";
			input18.value = input18.__value;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input18, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label18, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div6, "class", "group svelte-p1bfed");
			details.open = /*otherEnvironmentsInitiallyOpen*/ ctx[27];
			binding_group.p(input0, input1, input2, input3, input4, input5, input6, input7, input8, input9, input10, input11, input12, input13, input14, input15, input16, input17, input18);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div7, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, h2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h2, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, label0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, input0);
			input0.checked = input0.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, label1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, input1);
			input1.checked = input1.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, label2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, input2);
			input2.checked = input2.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t10);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, label3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, input3);
			input3.checked = input3.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label3, t12);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t13);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, label4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, input4);
			input4.checked = input4.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, t14);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label4, t15);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t16);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, details);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, summary);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(summary, t17);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t18);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, p);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t19);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t20);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, div2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, label5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, input5);
			input5.checked = input5.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, t21);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label5, t22);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t23);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, div3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, label6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, input6);
			input6.checked = input6.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label6, t24);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t25);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, div4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, label7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, input7);
			input7.checked = input7.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, t26);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label7, t27);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, t28);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, label8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, input8);
			input8.checked = input8.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, t29);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label8, t30);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, t31);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, label9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, input9);
			input9.checked = input9.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, t32);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label9, t33);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, t34);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, label10);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label10, input10);
			input10.checked = input10.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label10, t35);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label10, t36);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, t37);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, label11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label11, input11);
			input11.checked = input11.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label11, t38);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label11, t39);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t40);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, div5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div5, label12);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label12, input12);
			input12.checked = input12.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label12, t41);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label12, t42);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div5, t43);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div5, label13);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label13, input13);
			input13.checked = input13.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label13, t44);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label13, t45);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div5, t46);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div5, label14);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label14, input14);
			input14.checked = input14.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label14, t47);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label14, t48);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div5, t49);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div5, label15);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label15, input15);
			input15.checked = input15.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label15, t50);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label15, t51);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, t52);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(details, div6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, label16);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label16, input16);
			input16.checked = input16.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label16, t53);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, t54);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, label17);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label17, input17);
			input17.checked = input17.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label17, t55);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, t56);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, label18);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label18, input18);
			input18.checked = input18.__value === /*$options*/ ctx[1].target;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label18, t57);

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input0, "change", /*input0_change_handler_5*/ ctx[109]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input1, "change", /*input1_change_handler_5*/ ctx[110]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input2, "change", /*input2_change_handler_3*/ ctx[111]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input3, "change", /*input3_change_handler_4*/ ctx[112]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input4, "change", /*input4_change_handler_2*/ ctx[113]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input5, "change", /*input5_change_handler_2*/ ctx[114]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input6, "change", /*input6_change_handler_1*/ ctx[115]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input7, "change", /*input7_change_handler_1*/ ctx[116]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input8, "change", /*input8_change_handler_2*/ ctx[117]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input9, "change", /*input9_change_handler*/ ctx[118]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input10, "change", /*input10_change_handler*/ ctx[119]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input11, "change", /*input11_change_handler_1*/ ctx[120]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input12, "change", /*input12_change_handler_1*/ ctx[121]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input13, "change", /*input13_change_handler_1*/ ctx[122]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input14, "change", /*input14_change_handler*/ ctx[123]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input15, "change", /*input15_change_handler*/ ctx[124]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input16, "change", /*input16_change_handler*/ ctx[125]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input17, "change", /*input17_change_handler*/ ctx[126]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input18, "change", /*input18_change_handler*/ ctx[127])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t0_value !== (t0_value = /*$_*/ ctx[20]('options.environment') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);

			if (dirty[0] & /*$options*/ 2) {
				input0.checked = input0.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t3_value !== (t3_value = /*$_*/ ctx[20]('options.html') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t3, t3_value);

			if (dirty[0] & /*$options*/ 2) {
				input1.checked = input1.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t6_value !== (t6_value = /*$_*/ ctx[20]('options.zip') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t6, t6_value);

			if (dirty[0] & /*$options*/ 2) {
				input2.checked = input2.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t9_value !== (t9_value = /*$_*/ ctx[20]('options.application-win32').replace('{type}', 'Electron') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t9, t9_value);

			if (dirty[0] & /*$options*/ 2) {
				input3.checked = input3.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t12_value !== (t12_value = /*$_*/ ctx[20]('options.application-mac').replace('{type}', 'WKWebView') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t12, t12_value);

			if (dirty[0] & /*$options*/ 2) {
				input4.checked = input4.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t15_value !== (t15_value = /*$_*/ ctx[20]('options.application-linux64').replace('{type}', 'Electron') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t15, t15_value);
			if (dirty[0] & /*$_*/ 1048576 && t17_value !== (t17_value = /*$_*/ ctx[20]('options.otherEnvironments') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t17, t17_value);
			if (dirty[0] & /*$_*/ 1048576 && t19_value !== (t19_value = /*$_*/ ctx[20]('options.otherEnvironmentsHelp') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t19, t19_value);

			if (dirty[0] & /*$options*/ 2) {
				input5.checked = input5.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t22_value !== (t22_value = /*$_*/ ctx[20]('options.zip-one-asset') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t22, t22_value);

			if (dirty[0] & /*$options*/ 2) {
				input6.checked = input6.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$options*/ 2) {
				input7.checked = input7.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t27_value !== (t27_value = /*$_*/ ctx[20]('options.application-win64').replace('{type}', 'Electron') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t27, t27_value);

			if (dirty[0] & /*$options*/ 2) {
				input8.checked = input8.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t30_value !== (t30_value = /*$_*/ ctx[20]('options.application-win-arm').replace('{type}', 'Electron') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t30, t30_value);

			if (dirty[0] & /*$options*/ 2) {
				input9.checked = input9.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t33_value !== (t33_value = /*$_*/ ctx[20]('options.application-mac').replace('{type}', 'Electron') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t33, t33_value);

			if (dirty[0] & /*$options*/ 2) {
				input10.checked = input10.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t36_value !== (t36_value = /*$_*/ ctx[20]('options.application-linux-arm32').replace('{type}', 'Electron') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t36, t36_value);

			if (dirty[0] & /*$options*/ 2) {
				input11.checked = input11.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t39_value !== (t39_value = /*$_*/ ctx[20]('options.application-linux-arm64').replace('{type}', 'Electron') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t39, t39_value);

			if (dirty[0] & /*$options*/ 2) {
				input12.checked = input12.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t42_value !== (t42_value = /*$_*/ ctx[20]('options.application-win32').replace('{type}', 'NW.js') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t42, t42_value);

			if (dirty[0] & /*$options*/ 2) {
				input13.checked = input13.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t45_value !== (t45_value = /*$_*/ ctx[20]('options.application-win64').replace('{type}', 'NW.js') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t45, t45_value);

			if (dirty[0] & /*$options*/ 2) {
				input14.checked = input14.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t48_value !== (t48_value = /*$_*/ ctx[20]('options.application-mac').replace('{type}', 'NW.js') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t48, t48_value);

			if (dirty[0] & /*$options*/ 2) {
				input15.checked = input15.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$_*/ 1048576 && t51_value !== (t51_value = /*$_*/ ctx[20]('options.application-linux64').replace('{type}', 'NW.js') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t51, t51_value);

			if (dirty[0] & /*$options*/ 2) {
				input16.checked = input16.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$options*/ 2) {
				input17.checked = input17.__value === /*$options*/ ctx[1].target;
			}

			if (dirty[0] & /*$options*/ 2) {
				input18.checked = input18.__value === /*$options*/ ctx[1].target;
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div7);
			binding_group.r();
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (1344:0) {#if $options.target !== 'html'}
function create_if_block_5(ctx) {
	let div;
	let section;
	let div_intro;
	let current;

	section = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				accent: "#FF661A",
				reset: /*$options*/ ctx[1].target.startsWith('zip')
				? null
				: /*func_6*/ ctx[137],
				$$slots: { default: [create_default_slot_5] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section.$$.fragment);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section, div, null);
			current = true;
		},
		p(ctx, dirty) {
			const section_changes = {};

			if (dirty[0] & /*$options*/ 2) section_changes.reset = /*$options*/ ctx[1].target.startsWith('zip')
			? null
			: /*func_6*/ ctx[137];

			if (dirty[0] & /*$options, $_, uploadError, showReleaseModal, assetDownloadUrl, releaseUrl, assetName, logs, createdRepoUrl, uploadInProgress, oauthUserInfo, oauthInProgress, oauthError*/ 2096642 | dirty[5] & /*$$scope*/ 64) {
				section_changes.$$scope = { dirty, ctx };
			}

			section.$set(section_changes);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section.$$.fragment, local);

			if (local) {
				if (!div_intro) {
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(() => {
						div_intro = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_in_transition"])(div, svelte_transition__WEBPACK_IMPORTED_MODULE_3__["fade"], {});
						div_intro.start();
					});
				}
			}

			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section);
		}
	};
}

// (1360:8) {:else}
function create_else_block_1(ctx) {
	let h2;
	let t0_value = /*$_*/ ctx[20]('options.applicationSettings') + "";
	let t0;
	let t1;
	let label0;
	let t2_value = /*$_*/ ctx[20]('options.packageName') + "";
	let t2;
	let t3;
	let input0;
	let t4;
	let p0;
	let t5_value = /*$_*/ ctx[20]('options.packageNameHelp') + "";
	let t5;
	let t6;
	let t7;
	let label1;
	let t8_value = /*$_*/ ctx[20]('options.version') + "";
	let t8;
	let t9;
	let input1;
	let t10;
	let p1;
	let t11_value = /*$_*/ ctx[20]('options.versionHelp') + "";
	let t11;
	let t12;
	let show_if_7 = /*$options*/ ctx[1].target.includes('electron');
	let t13;
	let div2;
	let t25;
	let show_if_4;
	let show_if_5;
	let show_if_6;
	let t26;
	let show_if;
	let show_if_1;
	let show_if_2;
	let show_if_3;
	let if_block3_anchor;
	let mounted;
	let dispose;
	let if_block0 = /*$options*/ ctx[1].target === 'cordova-android' && create_if_block_20(ctx);
	let if_block1 = show_if_7 && create_if_block_19(ctx);

	function select_block_type_6(ctx, dirty) {
		if (dirty[0] & /*$options*/ 2) show_if_4 = null;
		if (dirty[0] & /*$options*/ 2) show_if_5 = null;
		if (dirty[0] & /*$options*/ 2) show_if_6 = null;
		if (show_if_4 == null) show_if_4 = !!/*$options*/ ctx[1].target.includes('win');
		if (show_if_4) return create_if_block_16;
		if (show_if_5 == null) show_if_5 = !!/*$options*/ ctx[1].target.includes('mac');
		if (show_if_5) return create_if_block_17;
		if (show_if_6 == null) show_if_6 = !!/*$options*/ ctx[1].target.includes('linux');
		if (show_if_6) return create_if_block_18;
	}

	let current_block_type = select_block_type_6(ctx, [-1, -1, -1, -1, -1, -1]);
	let if_block2 = current_block_type && current_block_type(ctx);

	function select_block_type_7(ctx, dirty) {
		if (dirty[0] & /*$options*/ 2) show_if = null;
		if (dirty[0] & /*$options*/ 2) show_if_1 = null;
		if (dirty[0] & /*$options*/ 2) show_if_2 = null;
		if (dirty[0] & /*$options*/ 2) show_if_3 = null;
		if (show_if == null) show_if = !!/*$options*/ ctx[1].target.includes('electron');
		if (show_if) return create_if_block_7;
		if (show_if_1 == null) show_if_1 = !!/*$options*/ ctx[1].target.includes('nwjs');
		if (show_if_1) return create_if_block_12;
		if (show_if_2 == null) show_if_2 = !!/*$options*/ ctx[1].target.includes('webview-mac');
		if (show_if_2) return create_if_block_14;
		if (show_if_3 == null) show_if_3 = !!/*$options*/ ctx[1].target.includes('node-cli');
		if (show_if_3) return create_if_block_15;
	}

	let current_block_type_1 = select_block_type_7(ctx, [-1, -1, -1, -1, -1, -1]);
	let if_block3 = current_block_type_1 && current_block_type_1(ctx);

	return {
		c() {
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			input0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t5_value);
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block0) if_block0.c();
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t8_value);
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			input1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t11_value);
			t12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block1) if_block1.c();
			t13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");

			div2.innerHTML = `<div>Creating native applications for specific platforms is discouraged. In most cases, Plain HTML or Zip will have numerous advantages:</div> 
            <ul><li>Can be run directly from a website on any platform, even phones</li> 
              <li>Users are significantly less likely to be suspicious of a virus</li> 
              <li>Significantly smaller file size</li> 
              <li>Can still be downloaded locally and run offline</li></ul> 
            <div>If you don&#39;t truly need to make a self-contained application for each platform (we understand there are some cases where this is necessary), we recommend you don&#39;t.</div>`;

			t25 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block2) if_block2.c();
			t26 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block3) if_block3.c();
			if_block3_anchor = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["empty"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "type", "text");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "pattern", "[\\w \\-]+");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "minlength", "1");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label0, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "type", "text");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "class", "version svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "pattern", "\\d+\\.\\d+\\.\\d+");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "placeholder", "1.0.0");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input1, "minlength", "1");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label1, "class", "option svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "warning svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, h2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h2, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label0, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, input0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input0, /*$options*/ ctx[1].app.packageName);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t4, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p0, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p0, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t6, anchor);
			if (if_block0) if_block0.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t7, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, input1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input1, /*$options*/ ctx[1].app.version);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t10, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p1, t11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t12, anchor);
			if (if_block1) if_block1.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t13, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t25, anchor);
			if (if_block2) if_block2.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t26, anchor);
			if (if_block3) if_block3.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, if_block3_anchor, anchor);

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input0, "input", /*input0_input_handler_2*/ ctx[129]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input1, "input", /*input1_input_handler_2*/ ctx[133])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t0_value !== (t0_value = /*$_*/ ctx[20]('options.applicationSettings') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if (dirty[0] & /*$_*/ 1048576 && t2_value !== (t2_value = /*$_*/ ctx[20]('options.packageName') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);

			if (dirty[0] & /*$options*/ 2 && input0.value !== /*$options*/ ctx[1].app.packageName) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input0, /*$options*/ ctx[1].app.packageName);
			}

			if (dirty[0] & /*$_*/ 1048576 && t5_value !== (t5_value = /*$_*/ ctx[20]('options.packageNameHelp') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t5, t5_value);

			if (/*$options*/ ctx[1].target === 'cordova-android') {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_20(ctx);
					if_block0.c();
					if_block0.m(t7.parentNode, t7);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty[0] & /*$_*/ 1048576 && t8_value !== (t8_value = /*$_*/ ctx[20]('options.version') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t8, t8_value);

			if (dirty[0] & /*$options*/ 2 && input1.value !== /*$options*/ ctx[1].app.version) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input1, /*$options*/ ctx[1].app.version);
			}

			if (dirty[0] & /*$_*/ 1048576 && t11_value !== (t11_value = /*$_*/ ctx[20]('options.versionHelp') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t11, t11_value);
			if (dirty[0] & /*$options*/ 2) show_if_7 = /*$options*/ ctx[1].target.includes('electron');

			if (show_if_7) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_19(ctx);
					if_block1.c();
					if_block1.m(t13.parentNode, t13);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (current_block_type !== (current_block_type = select_block_type_6(ctx, dirty))) {
				if (if_block2) if_block2.d(1);
				if_block2 = current_block_type && current_block_type(ctx);

				if (if_block2) {
					if_block2.c();
					if_block2.m(t26.parentNode, t26);
				}
			}

			if (current_block_type_1 === (current_block_type_1 = select_block_type_7(ctx, dirty)) && if_block3) {
				if_block3.p(ctx, dirty);
			} else {
				if (if_block3) if_block3.d(1);
				if_block3 = current_block_type_1 && current_block_type_1(ctx);

				if (if_block3) {
					if_block3.c();
					if_block3.m(if_block3_anchor.parentNode, if_block3_anchor);
				}
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(h2);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t1);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label0);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t4);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p0);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t6);
			if (if_block0) if_block0.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t7);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label1);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t10);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p1);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t12);
			if (if_block1) if_block1.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t13);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div2);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t25);

			if (if_block2) {
				if_block2.d(detaching);
			}

			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t26);

			if (if_block3) {
				if_block3.d(detaching);
			}

			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(if_block3_anchor);
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (1357:8) {#if $options.target.startsWith('zip')}
function create_if_block_6(ctx) {
	let h2;
	let t1;
	let p;

	return {
		c() {
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			h2.textContent = "Zip";
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			p.textContent = "The zip environment is intended to be used for publishing to a website. Other uses such as sending your project to a friend over a chat app or email should use \"Plain HTML\" instead as zip will not work.";
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, h2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
		},
		p: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(h2);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t1);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

// (1369:10) {#if $options.target === 'cordova-android'}
function create_if_block_20(ctx) {
	let div8;
	let div0;
	let t1;
	let t2;
	let div1;
	let button0;
	let button0_disabled_value;
	let t3;
	let div2;
	let t4;
	let t5;
	let t6;
	let div7;
	let div3;
	let t8;
	let div4;
	let t9;
	let div6;
	let button1;
	let t10;
	let button1_disabled_value;
	let t11;
	let button2;
	let t13;
	let div5;
	let t17;
	let mounted;
	let dispose;

	function select_block_type_2(ctx, dirty) {
		if (!/*oauthUserInfo*/ ctx[18]) return create_if_block_31;
		return create_else_block_5;
	}

	let current_block_type = select_block_type_2(ctx, [-1, -1, -1, -1, -1, -1]);
	let if_block0 = current_block_type(ctx);

	function select_block_type_4(ctx, dirty) {
		if (/*uploadInProgress*/ ctx[9]) return create_if_block_30;
		return create_else_block_3;
	}

	let current_block_type_1 = select_block_type_4(ctx, [-1, -1, -1, -1, -1, -1]);
	let if_block1 = current_block_type_1(ctx);
	let if_block2 = /*createdRepoUrl*/ ctx[11] && create_if_block_29(ctx);
	let if_block3 = /*releaseUrl*/ ctx[12] && create_if_block_28(ctx);
	let if_block4 = /*uploadError*/ ctx[10] && create_if_block_27(ctx);

	function select_block_type_5(ctx, dirty) {
		if (/*logs*/ ctx[19].length === 0) return create_if_block_26;
		return create_else_block_2;
	}

	let current_block_type_2 = select_block_type_5(ctx, [-1, -1, -1, -1, -1, -1]);
	let if_block5 = current_block_type_2(ctx);
	let if_block6 = /*showReleaseModal*/ ctx[15] && create_if_block_21(ctx);

	return {
		c() {
			div8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div0.innerHTML = `<p class="svelte-p1bfed">如果您想手动构建您的安卓APK，请点击最下面的打包按钮，如果您想自动构建，请使用GitHub OAuth登录获取权限，然后点击自动构建按钮。</p>`;
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if_block0.c();
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			button0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			if_block1.c();
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			if (if_block2) if_block2.c();
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block3) if_block3.c();
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block4) if_block4.c();
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div3.textContent = "操作日志";
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			if_block5.c();
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			button1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("复制日志");
			t11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			button2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			button2.textContent = "清空日志";
			t13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div5.textContent = `显示最新 ${MAX_LOGS} 条`;
			t17 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block6) if_block6.c();
			button0.disabled = button0_disabled_value = /*uploadInProgress*/ ctx[9] || !/*oauthUserInfo*/ ctx[18];
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(button0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div1, "margin-top", "0.25rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "upload-status svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div3, "font-weight", "bold");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div3, "margin-bottom", "6px");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div4, "class", "log-entries svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div4, "aria-live", "polite");
			button1.disabled = button1_disabled_value = /*logs*/ ctx[19].length === 0;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(button1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(button2, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div5, "margin-left", "auto");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div5, "font-size", "12px");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div5, "color", "#666");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div5, "align-self", "center");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div6, "class", "log-controls svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div7, "class", "log-panel svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div7, "margin-top", "0.5rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div8, "class", "github-uploader svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div8, "margin-top", "0.5rem");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div8, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div8, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div8, t1);
			if_block0.m(div8, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div8, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div8, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, button0);
			if_block1.m(button0, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div8, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div8, div2);
			if (if_block2) if_block2.m(div2, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t4);
			if (if_block3) if_block3.m(div2, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t5);
			if (if_block4) if_block4.m(div2, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div8, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div8, div7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div4);
			if_block5.m(div4, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div7, div6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, button1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(button1, t10);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, t11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, button2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, t13);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div6, div5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div8, t17);
			if (if_block6) if_block6.m(div8, null);

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button0, "click", /*packAndUpload*/ ctx[32]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button1, "click", /*copyLogs*/ ctx[31]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button2, "click", /*click_handler*/ ctx[130])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_2(ctx, dirty)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(div8, t2);
				}
			}

			if (current_block_type_1 !== (current_block_type_1 = select_block_type_4(ctx, dirty))) {
				if_block1.d(1);
				if_block1 = current_block_type_1(ctx);

				if (if_block1) {
					if_block1.c();
					if_block1.m(button0, null);
				}
			}

			if (dirty[0] & /*uploadInProgress, oauthUserInfo*/ 262656 && button0_disabled_value !== (button0_disabled_value = /*uploadInProgress*/ ctx[9] || !/*oauthUserInfo*/ ctx[18])) {
				button0.disabled = button0_disabled_value;
			}

			if (/*createdRepoUrl*/ ctx[11]) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block_29(ctx);
					if_block2.c();
					if_block2.m(div2, t4);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (/*releaseUrl*/ ctx[12]) {
				if (if_block3) {
					if_block3.p(ctx, dirty);
				} else {
					if_block3 = create_if_block_28(ctx);
					if_block3.c();
					if_block3.m(div2, t5);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}

			if (/*uploadError*/ ctx[10]) {
				if (if_block4) {
					if_block4.p(ctx, dirty);
				} else {
					if_block4 = create_if_block_27(ctx);
					if_block4.c();
					if_block4.m(div2, null);
				}
			} else if (if_block4) {
				if_block4.d(1);
				if_block4 = null;
			}

			if (current_block_type_2 === (current_block_type_2 = select_block_type_5(ctx, dirty)) && if_block5) {
				if_block5.p(ctx, dirty);
			} else {
				if_block5.d(1);
				if_block5 = current_block_type_2(ctx);

				if (if_block5) {
					if_block5.c();
					if_block5.m(div4, null);
				}
			}

			if (dirty[0] & /*logs*/ 524288 && button1_disabled_value !== (button1_disabled_value = /*logs*/ ctx[19].length === 0)) {
				button1.disabled = button1_disabled_value;
			}

			if (/*showReleaseModal*/ ctx[15]) {
				if (if_block6) {
					if_block6.p(ctx, dirty);
				} else {
					if_block6 = create_if_block_21(ctx);
					if_block6.c();
					if_block6.m(div8, null);
				}
			} else if (if_block6) {
				if_block6.d(1);
				if_block6 = null;
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div8);
			if_block0.d();
			if_block1.d();
			if (if_block2) if_block2.d();
			if (if_block3) if_block3.d();
			if (if_block4) if_block4.d();
			if_block5.d();
			if (if_block6) if_block6.d();
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (1402:14) {:else}
function create_else_block_5(ctx) {
	let div4;
	let h4;
	let t1;
	let div3;
	let t2;
	let div2;
	let div0;
	let t3_value = /*oauthUserInfo*/ ctx[18].user.login + "";
	let t3;
	let t4;
	let div1;
	let t5_value = /*oauthUserInfo*/ ctx[18].email + "";
	let t5;
	let t6;
	let button;
	let mounted;
	let dispose;
	let if_block = /*oauthUserInfo*/ ctx[18].user.avatar_url && create_if_block_34(ctx);

	return {
		c() {
			div4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h4");
			h4.textContent = "已认证用户";
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			if (if_block) if_block.c();
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t3_value);
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t5_value);
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			button = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			button.textContent = "退出登录";
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(h4, "margin", "0 0 0.5rem 0");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(h4, "color", "#2e7d32");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div0, "font-weight", "500");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div0, "color", "#2e7d32");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div1, "font-size", "0.8rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div1, "color", "#666");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "margin-left", "auto");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "background", "#f44336");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "color", "white");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "border", "none");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "padding", "0.25rem 0.5rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "border-radius", "4px");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "cursor", "pointer");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "font-size", "0.8rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(button, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div3, "display", "flex");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div3, "align-items", "center");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div3, "gap", "0.5rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div4, "class", "oauth-user-info");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div4, "margin", "1rem 0");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div4, "padding", "1rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div4, "border", "1px solid #4caf50");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div4, "border-radius", "8px");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div4, "background", "#e8f5e8");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div4, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, h4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div4, div3);
			if (if_block) if_block.m(div3, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, div2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div0, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, button);

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button, "click", /*logoutOAuth*/ ctx[41]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (/*oauthUserInfo*/ ctx[18].user.avatar_url) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_34(ctx);
					if_block.c();
					if_block.m(div3, t2);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty[0] & /*oauthUserInfo*/ 262144 && t3_value !== (t3_value = /*oauthUserInfo*/ ctx[18].user.login + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t3, t3_value);
			if (dirty[0] & /*oauthUserInfo*/ 262144 && t5_value !== (t5_value = /*oauthUserInfo*/ ctx[18].email + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t5, t5_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div4);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};
}

// (1376:14) {#if !oauthUserInfo}
function create_if_block_31(ctx) {
	let div;
	let h4;
	let t1;
	let p;
	let t3;
	let t4;
	let button;
	let mounted;
	let dispose;
	let if_block0 = /*oauthError*/ ctx[17] && create_if_block_33(ctx);

	function select_block_type_3(ctx, dirty) {
		if (/*oauthInProgress*/ ctx[16]) return create_if_block_32;
		return create_else_block_4;
	}

	let current_block_type = select_block_type_3(ctx, [-1, -1, -1, -1, -1, -1]);
	let if_block1 = current_block_type(ctx);

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h4");
			h4.textContent = "GitHub OAuth 认证";
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			p.textContent = "点击下方按钮使用GitHub OAuth安全获取构建权限，无需手动输入Token。";
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block0) if_block0.c();
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			button = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			if_block1.c();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(h4, "margin", "0 0 0.5rem 0");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(h4, "color", "#333");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(p, "margin", "0 0 1rem 0");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(p, "font-size", "0.9rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(p, "color", "#666");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
			button.disabled = /*oauthInProgress*/ ctx[16];
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "background", "#24292e");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "color", "white");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "border", "none");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "padding", "0.75rem 1.5rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "border-radius", "6px");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "cursor", "pointer");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "font-size", "1rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "display", "inline-flex");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "align-items", "center");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(button, "gap", "0.5rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(button, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div, "class", "oauth-section");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "margin", "1rem 0");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "padding", "1rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "border", "1px solid #ddd");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "border-radius", "8px");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "background", "#f9f9f9");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, h4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, p);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t3);
			if (if_block0) if_block0.m(div, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, button);
			if_block1.m(button, null);

			if (!mounted) {
				dispose = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button, "click", /*startOAuth*/ ctx[40]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (/*oauthError*/ ctx[17]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_33(ctx);
					if_block0.c();
					if_block0.m(div, t4);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (current_block_type !== (current_block_type = select_block_type_3(ctx, dirty))) {
				if_block1.d(1);
				if_block1 = current_block_type(ctx);

				if (if_block1) {
					if_block1.c();
					if_block1.m(button, null);
				}
			}

			if (dirty[0] & /*oauthInProgress*/ 65536) {
				button.disabled = /*oauthInProgress*/ ctx[16];
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
			if (if_block0) if_block0.d();
			if_block1.d();
			mounted = false;
			dispose();
		}
	};
}

// (1406:20) {#if oauthUserInfo.user.avatar_url}
function create_if_block_34(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("img");
			if (!Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["src_url_equal"])(img.src, img_src_value = /*oauthUserInfo*/ ctx[18].user.avatar_url)) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(img, "src", img_src_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(img, "alt", "Avatar");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(img, "width", "32px");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(img, "height", "32px");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(img, "border-radius", "50%");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, img, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*oauthUserInfo*/ 262144 && !Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["src_url_equal"])(img.src, img_src_value = /*oauthUserInfo*/ ctx[18].user.avatar_url)) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(img, "src", img_src_value);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(img);
		}
	};
}

// (1382:18) {#if oauthError}
function create_if_block_33(ctx) {
	let div;
	let t;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(/*oauthError*/ ctx[17]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "color", "#d32f2f");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "margin-bottom", "1rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "padding", "0.5rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "background", "#ffebee");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "border-radius", "4px");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "font-size", "0.9rem");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*oauthError*/ 131072) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t, /*oauthError*/ ctx[17]);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1394:20) {:else}
function create_else_block_4(ctx) {
	let svg;
	let path;
	let t;

	return {
		c() {
			svg = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["svg_element"])("svg");
			path = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["svg_element"])("path");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("\n                      使用 GitHub 登录");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(path, "d", "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(svg, "width", "20");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(svg, "height", "20");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(svg, "viewBox", "0 0 24 24");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(svg, "fill", "white");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, svg, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(svg, path);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t, anchor);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(svg);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t);
		}
	};
}

// (1392:20) {#if oauthInProgress}
function create_if_block_32(ctx) {
	let span;

	return {
		c() {
			span = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("span");
			span.textContent = "认证中...";
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, span, anchor);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(span);
		}
	};
}

// (1425:48) {:else}
function create_else_block_3(ctx) {
	let t;

	return {
		c() {
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("Github自动构建");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t, anchor);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t);
		}
	};
}

// (1425:18) {#if uploadInProgress}
function create_if_block_30(ctx) {
	let t;

	return {
		c() {
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("打包并上传...");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t, anchor);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t);
		}
	};
}

// (1429:16) {#if createdRepoUrl}
function create_if_block_29(ctx) {
	let div;
	let t0;
	let a;
	let t1;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("仓库已创建: ");
			a = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("a");
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(/*createdRepoUrl*/ ctx[11]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*createdRepoUrl*/ ctx[11]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "target", "_blank");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "rel", "noopener");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, a);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(a, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*createdRepoUrl*/ 2048) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, /*createdRepoUrl*/ ctx[11]);

			if (dirty[0] & /*createdRepoUrl*/ 2048) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*createdRepoUrl*/ ctx[11]);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1432:16) {#if releaseUrl}
function create_if_block_28(ctx) {
	let div;
	let t0;
	let a;

	let t1_value = (/*assetName*/ ctx[13]
	? /*assetName*/ ctx[13]
	: /*releaseUrl*/ ctx[12]) + "";

	let t1;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("构建产物 Release: ");
			a = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("a");
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t1_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*releaseUrl*/ ctx[12]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "target", "_blank");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "rel", "noopener");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, a);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(a, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*assetName, releaseUrl*/ 12288 && t1_value !== (t1_value = (/*assetName*/ ctx[13]
			? /*assetName*/ ctx[13]
			: /*releaseUrl*/ ctx[12]) + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, t1_value);

			if (dirty[0] & /*releaseUrl*/ 4096) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*releaseUrl*/ ctx[12]);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1435:16) {#if uploadError}
function create_if_block_27(ctx) {
	let div;
	let t0;
	let t1;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("错误: ");
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(/*uploadError*/ ctx[10]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "color", "tomato");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*uploadError*/ 1024) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, /*uploadError*/ ctx[10]);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1445:18) {:else}
function create_else_block_2(ctx) {
	let each_1_anchor;
	let each_value = /*logs*/ ctx[19];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["empty"])();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(target, anchor);
				}
			}

			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*logs*/ 524288) {
				each_value = /*logs*/ ctx[19];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_each"])(each_blocks, detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(each_1_anchor);
		}
	};
}

// (1443:18) {#if logs.length === 0}
function create_if_block_26(ctx) {
	let div;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div.textContent = "暂无日志";
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div, "class", "log-entry info svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
		},
		p: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1446:20) {#each logs as l}
function create_each_block(ctx) {
	let div;
	let t0_value = /*l*/ ctx[155].time + "";
	let t0;
	let t1;
	let t2_value = /*l*/ ctx[155].level + "";
	let t2;
	let t3;
	let t4_value = /*l*/ ctx[155].msg + "";
	let t4;
	let div_class_value;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(" [");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("] ");
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t4_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div, "class", div_class_value = "log-entry " + /*l*/ ctx[155].level + " svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t4);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*logs*/ 524288 && t0_value !== (t0_value = /*l*/ ctx[155].time + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if (dirty[0] & /*logs*/ 524288 && t2_value !== (t2_value = /*l*/ ctx[155].level + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);
			if (dirty[0] & /*logs*/ 524288 && t4_value !== (t4_value = /*l*/ ctx[155].msg + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t4, t4_value);

			if (dirty[0] & /*logs*/ 524288 && div_class_value !== (div_class_value = "log-entry " + /*l*/ ctx[155].level + " svelte-p1bfed")) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div, "class", div_class_value);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1457:14) {#if showReleaseModal}
function create_if_block_21(ctx) {
	let div2;
	let div0;
	let t1;
	let t2;
	let t3;
	let t4;
	let div1;
	let button0;
	let t6;
	let button1;
	let t8;
	let button2;
	let t10;
	let mounted;
	let dispose;
	let if_block0 = /*assetName*/ ctx[13] && create_if_block_25(ctx);
	let if_block1 = /*assetDownloadUrl*/ ctx[14] && create_if_block_24(ctx);
	let if_block2 = /*releaseUrl*/ ctx[12] && create_if_block_23(ctx);
	let if_block3 = /*uploadError*/ ctx[10] && create_if_block_22(ctx);

	return {
		c() {
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div0.innerHTML = `<strong>构建完成</strong>`;
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block0) if_block0.c();
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block1) if_block1.c();
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block2) if_block2.c();
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			button0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			button0.textContent = "复制下载链接";
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			button1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			button1.textContent = "关闭";
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			button2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("button");
			button2.textContent = "删除临时仓库";
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block3) if_block3.c();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(button0, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(button1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(button2, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div1, "margin-top", "0.5rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "release-modal");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div2, "border", "1px solid #ccc");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div2, "padding", "0.5rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div2, "margin-top", "0.5rem");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div2, "background", "#fff");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t1);
			if (if_block0) if_block0.m(div2, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t2);
			if (if_block1) if_block1.m(div2, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t3);
			if (if_block2) if_block2.m(div2, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, button0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, button1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div1, button2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t10);
			if (if_block3) if_block3.m(div2, null);

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button0, "click", /*click_handler_1*/ ctx[131]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button1, "click", /*click_handler_2*/ ctx[132]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(button2, "click", /*deleteRepoFromUI*/ ctx[33])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (/*assetName*/ ctx[13]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_25(ctx);
					if_block0.c();
					if_block0.m(div2, t2);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*assetDownloadUrl*/ ctx[14]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_24(ctx);
					if_block1.c();
					if_block1.m(div2, t3);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (/*releaseUrl*/ ctx[12]) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block_23(ctx);
					if_block2.c();
					if_block2.m(div2, t4);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (/*uploadError*/ ctx[10]) {
				if (if_block3) {
					if_block3.p(ctx, dirty);
				} else {
					if_block3 = create_if_block_22(ctx);
					if_block3.c();
					if_block3.m(div2, null);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div2);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			if (if_block3) if_block3.d();
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (1460:18) {#if assetName}
function create_if_block_25(ctx) {
	let div;
	let t0;
	let t1;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("产物: ");
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(/*assetName*/ ctx[13]);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*assetName*/ 8192) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, /*assetName*/ ctx[13]);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1463:18) {#if assetDownloadUrl}
function create_if_block_24(ctx) {
	let div;
	let t0;
	let a;
	let t1;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("下载链接: ");
			a = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("a");
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(/*assetDownloadUrl*/ ctx[14]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*assetDownloadUrl*/ ctx[14]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "target", "_blank");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "rel", "noopener");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, a);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(a, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*assetDownloadUrl*/ 16384) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, /*assetDownloadUrl*/ ctx[14]);

			if (dirty[0] & /*assetDownloadUrl*/ 16384) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*assetDownloadUrl*/ ctx[14]);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1466:18) {#if releaseUrl}
function create_if_block_23(ctx) {
	let div;
	let t0;
	let a;
	let t1;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("Release 页面: ");
			a = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("a");
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(/*releaseUrl*/ ctx[12]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*releaseUrl*/ ctx[12]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "target", "_blank");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "rel", "noopener");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, a);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(a, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*releaseUrl*/ 4096) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, /*releaseUrl*/ ctx[12]);

			if (dirty[0] & /*releaseUrl*/ 4096) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", /*releaseUrl*/ ctx[12]);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1474:18) {#if uploadError}
function create_if_block_22(ctx) {
	let div;
	let t0;
	let t1;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])("错误: ");
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(/*uploadError*/ ctx[10]);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_style"])(div, "color", "tomato");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*uploadError*/ 1024) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t1, /*uploadError*/ ctx[10]);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1488:10) {#if $options.target.includes('electron')}
function create_if_block_19(ctx) {
	let label0;
	let t0_value = /*$_*/ ctx[20]('options.initalWindowSize') + "";
	let t0;
	let t1;
	let select0;
	let option0;
	let t2_value = /*$_*/ ctx[20]('options.startWindow') + "";
	let t2;
	let option1;
	let t3_value = /*$_*/ ctx[20]('options.startMaximized') + "";
	let t3;
	let option2;
	let t4_value = /*$_*/ ctx[20]('options.startFullscreen') + "";
	let t4;
	let t5;
	let label1;
	let t6_value = /*$_*/ ctx[20]('options.escapeBehavior') + "";
	let t6;
	let t7;
	let select1;
	let option3;
	let t8_value = /*$_*/ ctx[20]('options.unFullscreenOnly') + "";
	let t8;
	let option4;
	let t9_value = /*$_*/ ctx[20]('options.exitOnly') + "";
	let t9;
	let option5;
	let t10_value = /*$_*/ ctx[20]('options.unFullscreenOrExit') + "";
	let t10;
	let option6;
	let t11_value = /*$_*/ ctx[20]('options.doNothing') + "";
	let t11;
	let t12;
	let label2;
	let t13_value = /*$_*/ ctx[20]('options.windowControls') + "";
	let t13;
	let t14;
	let select2;
	let option7;
	let t15_value = /*$_*/ ctx[20]('options.defaultControls') + "";
	let t15;
	let option8;
	let t16_value = /*$_*/ ctx[20]('options.noControls') + "";
	let t16;
	let mounted;
	let dispose;

	return {
		c() {
			label0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			select0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("select");
			option0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			option1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t3_value);
			option2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t4_value);
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t6_value);
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			select1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("select");
			option3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t8_value);
			option4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t9_value);
			option5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t10_value);
			option6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t11 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t11_value);
			t12 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t13 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t13_value);
			t14 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			select2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("select");
			option7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t15 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t15_value);
			option8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t16 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t16_value);
			option0.__value = "window";
			option0.value = option0.__value;
			option1.__value = "maximize";
			option1.value = option1.__value;
			option2.__value = "fullscreen";
			option2.value = option2.__value;
			if (/*$options*/ ctx[1].app.windowMode === void 0) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(() => /*select0_change_handler*/ ctx[134].call(select0));
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label0, "class", "option svelte-p1bfed");
			option3.__value = "unfullscreen-only";
			option3.value = option3.__value;
			option4.__value = "exit-only";
			option4.value = option4.__value;
			option5.__value = "unfullscreen-or-exit";
			option5.value = option5.__value;
			option6.__value = "nothing";
			option6.value = option6.__value;
			if (/*$options*/ ctx[1].app.escapeBehavior === void 0) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(() => /*select1_change_handler*/ ctx[135].call(select1));
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label1, "class", "option svelte-p1bfed");
			option7.__value = "default";
			option7.value = option7.__value;
			option8.__value = "frameless";
			option8.value = option8.__value;
			if (/*$options*/ ctx[1].app.windowControls === void 0) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(() => /*select2_change_handler*/ ctx[136].call(select2));
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label2, "class", "option svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label0, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, select0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select0, option0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option0, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select0, option1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option1, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select0, option2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option2, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select0, /*$options*/ ctx[1].app.windowMode, true);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t5, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, select1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select1, option3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option3, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select1, option4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option4, t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select1, option5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option5, t10);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select1, option6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option6, t11);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select1, /*$options*/ ctx[1].app.escapeBehavior, true);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t12, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t13);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, t14);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label2, select2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select2, option7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option7, t15);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select2, option8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option8, t16);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select2, /*$options*/ ctx[1].app.windowControls, true);

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(select0, "change", /*select0_change_handler*/ ctx[134]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(select1, "change", /*select1_change_handler*/ ctx[135]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(select2, "change", /*select2_change_handler*/ ctx[136])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t0_value !== (t0_value = /*$_*/ ctx[20]('options.initalWindowSize') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if (dirty[0] & /*$_*/ 1048576 && t2_value !== (t2_value = /*$_*/ ctx[20]('options.startWindow') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);
			if (dirty[0] & /*$_*/ 1048576 && t3_value !== (t3_value = /*$_*/ ctx[20]('options.startMaximized') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t3, t3_value);
			if (dirty[0] & /*$_*/ 1048576 && t4_value !== (t4_value = /*$_*/ ctx[20]('options.startFullscreen') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t4, t4_value);

			if (dirty[0] & /*$options*/ 2) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select0, /*$options*/ ctx[1].app.windowMode);
			}

			if (dirty[0] & /*$_*/ 1048576 && t6_value !== (t6_value = /*$_*/ ctx[20]('options.escapeBehavior') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t6, t6_value);
			if (dirty[0] & /*$_*/ 1048576 && t8_value !== (t8_value = /*$_*/ ctx[20]('options.unFullscreenOnly') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t8, t8_value);
			if (dirty[0] & /*$_*/ 1048576 && t9_value !== (t9_value = /*$_*/ ctx[20]('options.exitOnly') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t9, t9_value);
			if (dirty[0] & /*$_*/ 1048576 && t10_value !== (t10_value = /*$_*/ ctx[20]('options.unFullscreenOrExit') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t10, t10_value);
			if (dirty[0] & /*$_*/ 1048576 && t11_value !== (t11_value = /*$_*/ ctx[20]('options.doNothing') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t11, t11_value);

			if (dirty[0] & /*$options*/ 2) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select1, /*$options*/ ctx[1].app.escapeBehavior);
			}

			if (dirty[0] & /*$_*/ 1048576 && t13_value !== (t13_value = /*$_*/ ctx[20]('options.windowControls') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t13, t13_value);
			if (dirty[0] & /*$_*/ 1048576 && t15_value !== (t15_value = /*$_*/ ctx[20]('options.defaultControls') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t15, t15_value);
			if (dirty[0] & /*$_*/ 1048576 && t16_value !== (t16_value = /*$_*/ ctx[20]('options.noControls') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t16, t16_value);

			if (dirty[0] & /*$options*/ 2) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select2, /*$options*/ ctx[1].app.windowControls);
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label0);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t5);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label1);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t12);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label2);
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (1543:54) 
function create_if_block_18(ctx) {
	let div;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");

			div.innerHTML = `<h2>Linux</h2> 
              <p class="svelte-p1bfed">Linux support is still experimental.</p>`;
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1534:52) 
function create_if_block_17(ctx) {
	let div;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");

			div.innerHTML = `<h2>macOS</h2> 
              <p class="svelte-p1bfed">Due to Apple policy, packaging for their platforms is troublesome. You either have to:</p> 
              <ul><li>Instruct users to ignore scary Gatekeeper warnings by opening Finder &gt; Navigating to the application &gt; Right click &gt; Open &gt; Open. This website generates applications that require this workaround.</li> 
                <li>Or pay Apple \$100/year for a developer account to sign and notarize the app (very involved process; reach out in feedback for more information)</li></ul>`;
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1528:10) {#if $options.target.includes('win')}
function create_if_block_16(ctx) {
	let div;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");

			div.innerHTML = `<h2>Windows</h2> 
              <p class="svelte-p1bfed">All Windows applications generated by this site are unsigned, so users will see SmartScreen warnings when they try to run it for the first time. They can bypass these warnings by pressing &quot;More info&quot; then &quot;Run anyways&quot;.</p> 
              <p class="svelte-p1bfed">To change the icon of the executable file or create an installer program, download and run <a href="https://github.com/TurboWarp/packager-extras/releases">TurboWarp Packager Extras</a> and select the output of this website.</p>`;
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1588:57) 
function create_if_block_15(ctx) {
	let div;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");

			div.innerHTML = `<h2>Node.js CLI</h2> 
              <p class="svelte-p1bfed">Node.js CLI runs your Scratch project directly in Node.js environment using scratch-vm. This is intended for server-side execution, automated testing, or batch processing tasks.</p> 
              <p class="svelte-p1bfed"><strong>Advantages:</strong></p> 
              <ul><li>Small file size (~20-30MB vs ~100MB for Electron)</li> 
                <li>Fast startup (no browser overhead)</li> 
                <li>No cache or GPU issues</li> 
                <li>Direct event monitoring</li> 
                <li>Stable and reliable</li></ul> 
              <p class="svelte-p1bfed"><strong>Command Line Arguments:</strong></p> 
              <p class="svelte-p1bfed">You can pass arguments to your application like this:</p> 
              <pre><code>app.exe your-project.sb3 --arg1 value1 --arg2 value2 --flag</code></pre> 
              <p class="svelte-p1bfed"><strong>CLI API Available:</strong></p> 
              <p class="svelte-p1bfed">In CLI mode, you can use the following JavaScript functions in your Scratch project:</p> 
              <ul><li><code>cli.log(message)</code> - Output text to console</li> 
                <li><code>cli.error(message)</code> - Output error to console</li> 
                <li><code>cli.warn(message)</code> - Output warning to console</li> 
                <li><code>cli.info(message)</code> - Output info to console</li> 
                <li><code>cli.exit(code)</code> - Exit the application (0 = success, non-zero = error)</li> 
                <li><code>cli.getArgs()</code> - Get all command line arguments as an object</li> 
                <li><code>cli.getArg(key)</code> - Get a specific command line argument by key</li></ul> 
              <p class="svelte-p1bfed"><strong>Example Usage:</strong></p> 
              <pre><code>// Get command line arguments
const args = cli.getArgs();
cli.log(&#39;Arguments:&#39;, args);

// Get specific argument
const mode = cli.getArg(&#39;mode&#39;);
if (mode === &#39;test&#39;) {
  cli.log(&#39;Running in test mode&#39;);
}

// Exit with success code
cli.exit(0);</code></pre> 
              <p class="svelte-p1bfed"><strong>Packaging Instructions:</strong></p> 
              <p class="svelte-p1bfed">After downloading the package:</p> 
              <ol><li>Extract the ZIP file to a folder</li> 
                <li>Install <a href="https://nodejs.org/" target="_blank">Node.js</a> (version 18 or higher)</li> 
                <li>Open a terminal/command prompt in the extracted folder</li> 
                <li>Run <code>npm install</code> to install dependencies</li> 
                <li>Run <code>npm run build</code> to create the executable</li> 
                <li>The executable will be created in the same folder</li> 
                <li><strong>Simply run the executable - no external SB3 file needed!</strong></li></ol> 
              <p class="svelte-p1bfed"><strong>Important:</strong> Node.js CLI mode:</p> 
              <ul><li>No graphical output - project runs in headless mode</li> 
                <li>Mouse and keyboard interactions will not work</li> 
                <li>Audio playback may be limited</li> 
                <li>Some extensions may not be compatible</li> 
                <li>Perfect for automated testing, server-side execution, or background tasks</li></ul>`;
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
		},
		p: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1575:60) 
function create_if_block_14(ctx) {
	let div;

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");

			div.innerHTML = `<h2>WKWebView</h2> 
              <p class="svelte-p1bfed">WKWebView is the preferred way to package for macOS. It will be hundreds of MB smaller than the other macOS-specific environments and typically run the fastest.</p> 
              <p class="svelte-p1bfed">The app will run natively on both Intel and Apple silicon Macs running macOS 10.13 or later.</p> 
              <p class="svelte-p1bfed">Note that:</p> 
              <ul><li>Video sensing and loudness blocks will only work in macOS 12 or later.</li> 
                <li>Pointer lock will not work.</li> 
                <li>Extremely large projects might not work properly.</li></ul> 
              <p class="svelte-p1bfed">Use the &quot;Electron macOS Application&quot; (inside Other environments) or &quot;Plain HTML&quot; environments instead if you encounter these issues.</p>`;
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
		},
		p: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
		}
	};
}

// (1565:53) 
function create_if_block_12(ctx) {
	let div;
	let h2;
	let t1;
	let p0;
	let t3;
	let p1;
	let t5;
	let p2;
	let t9;
	let show_if = /*$options*/ ctx[1].target.includes('mac');
	let if_block = show_if && create_if_block_13(ctx);

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			h2.textContent = "NW.js";
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			p0.textContent = "NW.js support is deprecated and may be removed in the future. Use the Electron environments instead. They're better in every way.";
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			p1.textContent = "The NW.js environment works by embedding a copy of Chromium (the open source part of Google Chrome) along with your project, which means the app will be very large.";
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			p2.innerHTML = `For further help and steps, see <a href="https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#linux">NW.js Documentation</a>.`;
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block) if_block.c();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p0, "class", "warning svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p1, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p2, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, h2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, p0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, p1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, p2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t9);
			if (if_block) if_block.m(div, null);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$options*/ 2) show_if = /*$options*/ ctx[1].target.includes('mac');

			if (show_if) {
				if (if_block) {
					
				} else {
					if_block = create_if_block_13(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
			if (if_block) if_block.d();
		}
	};
}

// (1550:10) {#if $options.target.includes('electron')}
function create_if_block_7(ctx) {
	let div;
	let h2;
	let t1;
	let p;
	let t3;
	let show_if;
	let show_if_1;
	let show_if_2;

	function select_block_type_8(ctx, dirty) {
		if (dirty[0] & /*$options*/ 2) show_if = null;
		if (dirty[0] & /*$options*/ 2) show_if_1 = null;
		if (dirty[0] & /*$options*/ 2) show_if_2 = null;
		if (show_if == null) show_if = !!/*$options*/ ctx[1].target.includes('win');
		if (show_if) return create_if_block_8;
		if (show_if_1 == null) show_if_1 = !!/*$options*/ ctx[1].target.includes('mac');
		if (show_if_1) return create_if_block_10;
		if (show_if_2 == null) show_if_2 = !!/*$options*/ ctx[1].target.includes('linux');
		if (show_if_2) return create_if_block_11;
	}

	let current_block_type = select_block_type_8(ctx, [-1, -1, -1, -1, -1, -1]);
	let if_block = current_block_type && current_block_type(ctx);

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			h2.textContent = "Electron";
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			p.textContent = "The Electron environment works by embedding a copy of Chromium (the open source part of Google Chrome) along with your project, which means the app will be very large.";
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block) if_block.c();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, h2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, p);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div, t3);
			if (if_block) if_block.m(div, null);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_8(ctx, dirty)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if (if_block) if_block.d(1);
				if_block = current_block_type && current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div, null);
				}
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);

			if (if_block) {
				if_block.d();
			}
		}
	};
}

// (1571:14) {#if $options.target.includes('mac')}
function create_if_block_13(ctx) {
	let p;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			p.textContent = "On macOS, the app will run using Rosetta on Apple Silicon Macs.";
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

// (1561:58) 
function create_if_block_11(ctx) {
	let p;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			p.innerHTML = `On Linux, the application can be started by running <code>start.sh</code>`;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
		},
		p: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

// (1559:56) 
function create_if_block_10(ctx) {
	let p;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			p.textContent = "On macOS, the app will run natively on both Intel Silicon and Apple Silicon Macs.";
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
		},
		p: svelte_internal__WEBPACK_IMPORTED_MODULE_0__["noop"],
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

// (1555:14) {#if $options.target.includes('win')}
function create_if_block_8(ctx) {
	let show_if = /*$options*/ ctx[1].target.includes('32');
	let if_block_anchor;
	let if_block = show_if && create_if_block_9(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["empty"])();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$options*/ 2) show_if = /*$options*/ ctx[1].target.includes('32');

			if (show_if) {
				if (if_block) {
					
				} else {
					if_block = create_if_block_9(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(if_block_anchor);
		}
	};
}

// (1556:16) {#if $options.target.includes('32')}
function create_if_block_9(ctx) {
	let p;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			p.textContent = "Note: You have selected the 32-bit or 64-bit mode. This maximizes device compatibility but limits the amount of memory the app can use. If you encounter crashes, try going into \"Other environments\" and using the 64-bit only mode instead.";
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

// (1346:4) <Section       accent="#FF661A"       reset={$options.target.startsWith('zip') ? null : () => {         resetOptions([           'app.packageName',           'app.windowMode',           'app.escapeBehavior'         ]);       }}     >
function create_default_slot_5(ctx) {
	let div;
	let show_if;

	function select_block_type_1(ctx, dirty) {
		if (dirty[0] & /*$options*/ 2) show_if = null;
		if (show_if == null) show_if = !!/*$options*/ ctx[1].target.startsWith('zip');
		if (show_if) return create_if_block_6;
		return create_else_block_1;
	}

	let current_block_type = select_block_type_1(ctx, [-1, -1, -1, -1, -1, -1]);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			if_block.c();
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div, anchor);
			if_block.m(div, null);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div, null);
				}
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div);
			if_block.d();
		}
	};
}

// (1654:0) {#if projectData.project.analysis.usesSteamworks}
function create_if_block_2(ctx) {
	let section;
	let current;

	section = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				accent: "#136C9F",
				reset: /*func_7*/ ctx[140],
				$$slots: { default: [create_default_slot_4] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section.$$.fragment);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const section_changes = {};

			if (dirty[0] & /*$_, $options*/ 1048578 | dirty[5] & /*$$scope*/ 64) {
				section_changes.$$scope = { dirty, ctx };
			}

			section.$set(section_changes);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section, detaching);
		}
	};
}

// (1684:4) {:else}
function create_else_block(ctx) {
	let p;
	let t0_value = /*$_*/ ctx[20]('options.steamworksUnavailable') + "";
	let t0;
	let t1;
	let ul;
	let li0;
	let t2_value = /*$_*/ ctx[20]('options.application-win64').replace('{type}', 'Electron') + "";
	let t2;
	let t3;
	let li1;
	let t4_value = /*$_*/ ctx[20]('options.application-mac').replace('{type}', 'Electron') + "";
	let t4;
	let t5;
	let br;
	let t6;
	let t7_value = /*$_*/ ctx[20]('options.steamworksMacWarning') + "";
	let t7;
	let t8;
	let li2;
	let t9_value = /*$_*/ ctx[20]('options.application-linux64').replace('{type}', 'Electron') + "";
	let t9;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			ul = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("ul");
			li0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("li");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			li1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("li");
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t4_value);
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			br = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("br");
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t7_value);
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			li2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("li");
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t9_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, ul, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(ul, li0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(li0, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(ul, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(ul, li1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(li1, t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(li1, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(li1, br);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(li1, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(li1, t7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(ul, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(ul, li2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(li2, t9);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t0_value !== (t0_value = /*$_*/ ctx[20]('options.steamworksUnavailable') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if (dirty[0] & /*$_*/ 1048576 && t2_value !== (t2_value = /*$_*/ ctx[20]('options.application-win64').replace('{type}', 'Electron') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);
			if (dirty[0] & /*$_*/ 1048576 && t4_value !== (t4_value = /*$_*/ ctx[20]('options.application-mac').replace('{type}', 'Electron') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t4, t4_value);
			if (dirty[0] & /*$_*/ 1048576 && t7_value !== (t7_value = /*$_*/ ctx[20]('options.steamworksMacWarning') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t7, t7_value);
			if (dirty[0] & /*$_*/ 1048576 && t9_value !== (t9_value = /*$_*/ ctx[20]('options.application-linux64').replace('{type}', 'Electron') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t9, t9_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t1);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(ul);
		}
	};
}

// (1664:4) {#if ['electron-win64', 'electron-linux64', 'electron-mac'].includes($options.target)}
function create_if_block_3(ctx) {
	let p;
	let t0_value = /*$_*/ ctx[20]('options.steamworksAvailable').replace('{n}', '480') + "";
	let t0;
	let t1;
	let label0;
	let t2_value = /*$_*/ ctx[20]('options.steamworksAppId') + "";
	let t2;
	let t3;
	let input;
	let t4;
	let label1;
	let t5_value = /*$_*/ ctx[20]('options.steamworksOnError') + "";
	let t5;
	let t6;
	let select;
	let option0;
	let t7_value = /*$_*/ ctx[20]('options.steamworksIgnore') + "";
	let t7;
	let option1;
	let t8_value = /*$_*/ ctx[20]('options.steamworksWarning') + "";
	let t8;
	let option2;
	let t9_value = /*$_*/ ctx[20]('options.steamworksError') + "";
	let t9;
	let t10;
	let if_block_anchor;
	let mounted;
	let dispose;
	let if_block = /*$options*/ ctx[1].target === 'electron-mac' && create_if_block_4(ctx);

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t2_value);
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			input = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("input");
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			label1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("label");
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t5_value);
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			select = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("select");
			option0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t7_value);
			option1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t8_value);
			option2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("option");
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t9_value);
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block) if_block.c();
			if_block_anchor = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["empty"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input, "pattern", "\\d+");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input, "minlength", "1");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(input, "class", "svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label0, "class", "option svelte-p1bfed");
			option0.__value = "ignore";
			option0.value = option0.__value;
			option1.__value = "warning";
			option1.value = option1.__value;
			option2.__value = "error";
			option2.value = option2.__value;
			if (/*$options*/ ctx[1].steamworks.onError === void 0) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["add_render_callback"])(() => /*select_change_handler_3*/ ctx[139].call(select));
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(label1, "class", "option svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label0, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label0, input);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input, /*$options*/ ctx[1].steamworks.appId);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t4, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, label1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, t6);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(label1, select);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option0, t7);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option1, t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(select, option2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(option2, t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select, /*$options*/ ctx[1].steamworks.onError, true);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t10, anchor);
			if (if_block) if_block.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, if_block_anchor, anchor);

			if (!mounted) {
				dispose = [
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(input, "input", /*input_input_handler_1*/ ctx[138]),
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["listen"])(select, "change", /*select_change_handler_3*/ ctx[139])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t0_value !== (t0_value = /*$_*/ ctx[20]('options.steamworksAvailable').replace('{n}', '480') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);
			if (dirty[0] & /*$_*/ 1048576 && t2_value !== (t2_value = /*$_*/ ctx[20]('options.steamworksAppId') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t2, t2_value);

			if (dirty[0] & /*$options*/ 2 && input.value !== /*$options*/ ctx[1].steamworks.appId) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_input_value"])(input, /*$options*/ ctx[1].steamworks.appId);
			}

			if (dirty[0] & /*$_*/ 1048576 && t5_value !== (t5_value = /*$_*/ ctx[20]('options.steamworksOnError') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t5, t5_value);
			if (dirty[0] & /*$_*/ 1048576 && t7_value !== (t7_value = /*$_*/ ctx[20]('options.steamworksIgnore') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t7, t7_value);
			if (dirty[0] & /*$_*/ 1048576 && t8_value !== (t8_value = /*$_*/ ctx[20]('options.steamworksWarning') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t8, t8_value);
			if (dirty[0] & /*$_*/ 1048576 && t9_value !== (t9_value = /*$_*/ ctx[20]('options.steamworksError') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t9, t9_value);

			if (dirty[0] & /*$options*/ 2) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_option"])(select, /*$options*/ ctx[1].steamworks.onError);
			}

			if (/*$options*/ ctx[1].target === 'electron-mac') {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_4(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t1);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label0);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t4);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(label1);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t10);
			if (if_block) if_block.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(if_block_anchor);
			mounted = false;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["run_all"])(dispose);
		}
	};
}

// (1679:6) {#if $options.target === 'electron-mac'}
function create_if_block_4(ctx) {
	let p;
	let t_value = /*$_*/ ctx[20]('options.steamworksMacWarning') + "";
	let t;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "warning svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t_value !== (t_value = /*$_*/ ctx[20]('options.steamworksMacWarning') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t, t_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

// (1655:2) <Section     accent="#136C9F"     reset={() => {       resetOptions([         'steamworks'       ]);     }}   >
function create_default_slot_4(ctx) {
	let h2;
	let t0_value = /*$_*/ ctx[20]('options.steamworksExtension') + "";
	let t0;
	let t1;
	let show_if;
	let t2;
	let p;
	let a;
	let t3_value = /*$_*/ ctx[20]('options.steamworksDocumentation') + "";
	let t3;

	function select_block_type_9(ctx, dirty) {
		if (dirty[0] & /*$options*/ 2) show_if = null;
		if (show_if == null) show_if = !!['electron-win64', 'electron-linux64', 'electron-mac'].includes(/*$options*/ ctx[1].target);
		if (show_if) return create_if_block_3;
		return create_else_block;
	}

	let current_block_type = select_block_type_9(ctx, [-1, -1, -1, -1, -1, -1]);
	let if_block = current_block_type(ctx);

	return {
		c() {
			h2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("h2");
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t0_value);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if_block.c();
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			a = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("a");
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t3_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(a, "href", "https://extensions.turbowarp.org/steamworks");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, h2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(h2, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t1, anchor);
			if_block.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, a);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(a, t3);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t0_value !== (t0_value = /*$_*/ ctx[20]('options.steamworksExtension') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t0, t0_value);

			if (current_block_type === (current_block_type = select_block_type_9(ctx, dirty)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(t2.parentNode, t2);
				}
			}

			if (dirty[0] & /*$_*/ 1048576 && t3_value !== (t3_value = /*$_*/ ctx[20]('options.steamworksDocumentation') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t3, t3_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(h2);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t1);
			if_block.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t2);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

// (1704:2) <DropArea on:drop={(e) => importOptionsFromDataTransfer(e.detail)}>
function create_default_slot_3(ctx) {
	let div3;
	let div0;
	let button0;
	let t0;
	let div1;
	let button1;
	let t1;
	let div2;
	let button2;
	let current;

	button0 = new _p4_Button_svelte__WEBPACK_IMPORTED_MODULE_5__["default"]({
			props: {
				secondary: true,
				text: /*$_*/ ctx[20]('options.export')
			}
		});

	button0.$on("click", /*exportOptions*/ ctx[37]);

	button1 = new _p4_Button_svelte__WEBPACK_IMPORTED_MODULE_5__["default"]({
			props: {
				secondary: true,
				text: /*$_*/ ctx[20]('options.import')
			}
		});

	button1.$on("click", /*importOptions*/ ctx[38]);

	button2 = new _p4_Button_svelte__WEBPACK_IMPORTED_MODULE_5__["default"]({
			props: {
				dangerous: true,
				text: /*$_*/ ctx[20]('options.resetAll')
			}
		});

	button2.$on("click", /*resetAll*/ ctx[36]);

	return {
		c() {
			div3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(button0.$$.fragment);
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(button1.$$.fragment);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(button2.$$.fragment);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div0, "class", "button svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div1, "class", "button svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "side-buttons svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div3, "class", "buttons svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div3, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(button0, div0, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(button1, div1, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div3, div2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(button2, div2, null);
			current = true;
		},
		p(ctx, dirty) {
			const button0_changes = {};
			if (dirty[0] & /*$_*/ 1048576) button0_changes.text = /*$_*/ ctx[20]('options.export');
			button0.$set(button0_changes);
			const button1_changes = {};
			if (dirty[0] & /*$_*/ 1048576) button1_changes.text = /*$_*/ ctx[20]('options.import');
			button1.$set(button1_changes);
			const button2_changes = {};
			if (dirty[0] & /*$_*/ 1048576) button2_changes.text = /*$_*/ ctx[20]('options.resetAll');
			button2.$set(button2_changes);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(button0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(button1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(button2.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(button0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(button1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(button2.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(button0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(button1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(button2);
		}
	};
}

// (1703:0) <Section>
function create_default_slot_2(ctx) {
	let droparea;
	let current;

	droparea = new _DropArea_svelte__WEBPACK_IMPORTED_MODULE_22__["default"]({
			props: {
				$$slots: { default: [create_default_slot_3] },
				$$scope: { ctx }
			}
		});

	droparea.$on("drop", /*drop_handler*/ ctx[141]);

	return {
		c() {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(droparea.$$.fragment);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(droparea, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const droparea_changes = {};

			if (dirty[0] & /*$_*/ 1048576 | dirty[5] & /*$$scope*/ 64) {
				droparea_changes.$$scope = { dirty, ctx };
			}

			droparea.$set(droparea_changes);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(droparea.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(droparea.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(droparea, detaching);
		}
	};
}

// (1719:0) <Section>
function create_default_slot_1(ctx) {
	let div2;
	let div0;
	let button0;
	let t;
	let div1;
	let button1;
	let current;

	button0 = new _p4_Button_svelte__WEBPACK_IMPORTED_MODULE_5__["default"]({
			props: { text: /*$_*/ ctx[20]('options.package') }
		});

	button0.$on("click", /*pack*/ ctx[30]);

	button1 = new _p4_Button_svelte__WEBPACK_IMPORTED_MODULE_5__["default"]({
			props: {
				secondary: true,
				text: /*$_*/ ctx[20]('options.preview')
			}
		});

	button1.$on("click", /*preview*/ ctx[34]);

	return {
		c() {
			div2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			div0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(button0.$$.fragment);
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			div1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("div");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(button1.$$.fragment);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div0, "class", "button svelte-p1bfed");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div1, "clas", "button");
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(div2, "class", "buttons svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, div2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, div0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(button0, div0, null);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, t);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(div2, div1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(button1, div1, null);
			current = true;
		},
		p(ctx, dirty) {
			const button0_changes = {};
			if (dirty[0] & /*$_*/ 1048576) button0_changes.text = /*$_*/ ctx[20]('options.package');
			button0.$set(button0_changes);
			const button1_changes = {};
			if (dirty[0] & /*$_*/ 1048576) button1_changes.text = /*$_*/ ctx[20]('options.preview');
			button1.$set(button1_changes);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(button0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(button1.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(button0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(button1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(div2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(button0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(button1);
		}
	};
}

// (1737:29) 
function create_if_block_1(ctx) {
	let section;
	let current;

	section = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				caption: true,
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section.$$.fragment);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const section_changes = {};

			if (dirty[0] & /*$_*/ 1048576 | dirty[5] & /*$$scope*/ 64) {
				section_changes.$$scope = { dirty, ctx };
			}

			section.$set(section_changes);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section, detaching);
		}
	};
}

// (1731:0) {#if result}
function create_if_block(ctx) {
	let downloads;
	let current;

	downloads = new _Downloads_svelte__WEBPACK_IMPORTED_MODULE_10__["default"]({
			props: {
				name: /*result*/ ctx[7] ? /*result*/ ctx[7].filename : null,
				url: /*result*/ ctx[7] ? /*result*/ ctx[7].url : null,
				blob: /*result*/ ctx[7] ? /*result*/ ctx[7].blob : null
			}
		});

	return {
		c() {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(downloads.$$.fragment);
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(downloads, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const downloads_changes = {};
			if (dirty[0] & /*result*/ 128) downloads_changes.name = /*result*/ ctx[7] ? /*result*/ ctx[7].filename : null;
			if (dirty[0] & /*result*/ 128) downloads_changes.url = /*result*/ ctx[7] ? /*result*/ ctx[7].url : null;
			if (dirty[0] & /*result*/ 128) downloads_changes.blob = /*result*/ ctx[7] ? /*result*/ ctx[7].blob : null;
			downloads.$set(downloads_changes);
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(downloads.$$.fragment, local);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(downloads.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(downloads, detaching);
		}
	};
}

// (1738:2) <Section caption>
function create_default_slot(ctx) {
	let p;
	let t_value = /*$_*/ ctx[20]('options.downloadsWillAppearHere') + "";
	let t;

	return {
		c() {
			p = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["element"])("p");
			t = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["text"])(t_value);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["attr"])(p, "class", "svelte-p1bfed");
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, p, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["append"])(p, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$_*/ 1048576 && t_value !== (t_value = /*$_*/ ctx[20]('options.downloadsWillAppearHere') + "")) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_data"])(t, t_value);
		},
		d(detaching) {
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(p);
		}
	};
}

function create_fragment(ctx) {
	let section0;
	let t0;
	let section1;
	let t1;
	let section2;
	let t2;
	let section3;
	let t3;
	let section4;
	let t4;
	let section5;
	let t5;
	let section6;
	let t6;
	let t7;
	let t8;
	let section7;
	let t9;
	let section8;
	let t10;
	let current_block_type_index;
	let if_block2;
	let if_block2_anchor;
	let current;

	section0 = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				accent: "#4C97FF",
				$$slots: { default: [create_default_slot_12] },
				$$scope: { ctx }
			}
		});

	section1 = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				accent: "#FFAB19",
				reset: /*func*/ ctx[59],
				$$slots: { default: [create_default_slot_11] },
				$$scope: { ctx }
			}
		});

	section2 = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				accent: "#9966FF",
				reset: /*func_1*/ ctx[78],
				$$slots: { default: [create_default_slot_10] },
				$$scope: { ctx }
			}
		});

	section3 = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				accent: "#4CBFE6",
				reset: /*func_2*/ ctx[87],
				$$slots: { default: [create_default_slot_9] },
				$$scope: { ctx }
			}
		});

	section4 = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				accent: "#FF8C1A",
				reset: /*cloudVariables*/ ctx[21].length === 0
				? null
				: /*func_3*/ ctx[93],
				$$slots: { default: [create_default_slot_8] },
				$$scope: { ctx }
			}
		});

	section5 = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				accent: "#FF6680",
				reset: /*func_4*/ ctx[108],
				$$slots: { default: [create_default_slot_7] },
				$$scope: { ctx }
			}
		});

	section6 = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				accent: "#0FBD8C",
				reset: /*func_5*/ ctx[128],
				$$slots: { default: [create_default_slot_6] },
				$$scope: { ctx }
			}
		});

	let if_block0 = /*$options*/ ctx[1].target !== 'html' && create_if_block_5(ctx);
	let if_block1 = /*projectData*/ ctx[0].project.analysis.usesSteamworks && create_if_block_2(ctx);

	section7 = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				$$slots: { default: [create_default_slot_2] },
				$$scope: { ctx }
			}
		});

	section8 = new _Section_svelte__WEBPACK_IMPORTED_MODULE_4__["default"]({
			props: {
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	const if_block_creators = [create_if_block, create_if_block_1];
	const if_blocks = [];

	function select_block_type_10(ctx, dirty) {
		if (/*result*/ ctx[7]) return 0;
		if (!/*$progress*/ ctx[5].visible) return 1;
		return -1;
	}

	if (~(current_block_type_index = select_block_type_10(ctx, [-1, -1, -1, -1, -1, -1]))) {
		if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	return {
		c() {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section0.$$.fragment);
			t0 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section1.$$.fragment);
			t1 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section2.$$.fragment);
			t2 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section3.$$.fragment);
			t3 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section4.$$.fragment);
			t4 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section5.$$.fragment);
			t5 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section6.$$.fragment);
			t6 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block0) if_block0.c();
			t7 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block1) if_block1.c();
			t8 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section7.$$.fragment);
			t9 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["create_component"])(section8.$$.fragment);
			t10 = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["space"])();
			if (if_block2) if_block2.c();
			if_block2_anchor = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["empty"])();
		},
		m(target, anchor) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section0, target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t0, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section1, target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t1, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section2, target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t2, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section3, target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t3, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section4, target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t4, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section5, target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t5, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section6, target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t6, anchor);
			if (if_block0) if_block0.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t7, anchor);
			if (if_block1) if_block1.m(target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t8, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section7, target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t9, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["mount_component"])(section8, target, anchor);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, t10, anchor);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(target, anchor);
			}

			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["insert"])(target, if_block2_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const section0_changes = {};

			if (dirty[0] & /*$_*/ 1048576 | dirty[5] & /*$$scope*/ 64) {
				section0_changes.$$scope = { dirty, ctx };
			}

			section0.$set(section0_changes);
			const section1_changes = {};

			if (dirty[0] & /*$_, $options, defaultOptions*/ 1048642 | dirty[5] & /*$$scope*/ 64) {
				section1_changes.$$scope = { dirty, ctx };
			}

			section1.$set(section1_changes);
			const section2_changes = {};
			if (dirty[0] & /*$icon, $loadingScreenImage*/ 20) section2_changes.reset = /*func_1*/ ctx[78];

			if (dirty[0] & /*$_, $options, $loadingScreenImage, $icon*/ 1048598 | dirty[5] & /*$$scope*/ 64) {
				section2_changes.$$scope = { dirty, ctx };
			}

			section2.$set(section2_changes);
			const section3_changes = {};
			if (dirty[0] & /*$customCursorIcon*/ 8) section3_changes.reset = /*func_2*/ ctx[87];

			if (dirty[0] & /*$_, $options, $customCursorIcon*/ 1048586 | dirty[5] & /*$$scope*/ 64) {
				section3_changes.$$scope = { dirty, ctx };
			}

			section3.$set(section3_changes);
			const section4_changes = {};

			if (dirty[0] & /*$_, $options*/ 1048578 | dirty[5] & /*$$scope*/ 64) {
				section4_changes.$$scope = { dirty, ctx };
			}

			section4.$set(section4_changes);
			const section5_changes = {};

			if (dirty[0] & /*advancedOptionsOpen, $_, $options, defaultOptions*/ 1048898 | dirty[5] & /*$$scope*/ 64) {
				section5_changes.$$scope = { dirty, ctx };
			}

			section5.$set(section5_changes);
			const section6_changes = {};

			if (dirty[0] & /*$options, $_*/ 1048578 | dirty[5] & /*$$scope*/ 64) {
				section6_changes.$$scope = { dirty, ctx };
			}

			section6.$set(section6_changes);

			if (/*$options*/ ctx[1].target !== 'html') {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty[0] & /*$options*/ 2) {
						Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_5(ctx);
					if_block0.c();
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block0, 1);
					if_block0.m(t7.parentNode, t7);
				}
			} else if (if_block0) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["group_outros"])();

				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["check_outros"])();
			}

			if (/*projectData*/ ctx[0].project.analysis.usesSteamworks) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty[0] & /*projectData*/ 1) {
						Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_2(ctx);
					if_block1.c();
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block1, 1);
					if_block1.m(t8.parentNode, t8);
				}
			} else if (if_block1) {
				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["group_outros"])();

				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["check_outros"])();
			}

			const section7_changes = {};

			if (dirty[0] & /*$_*/ 1048576 | dirty[5] & /*$$scope*/ 64) {
				section7_changes.$$scope = { dirty, ctx };
			}

			section7.$set(section7_changes);
			const section8_changes = {};

			if (dirty[0] & /*$_*/ 1048576 | dirty[5] & /*$$scope*/ 64) {
				section8_changes.$$scope = { dirty, ctx };
			}

			section8.$set(section8_changes);
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type_10(ctx, dirty);

			if (current_block_type_index === previous_block_index) {
				if (~current_block_type_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				}
			} else {
				if (if_block2) {
					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["group_outros"])();

					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["check_outros"])();
				}

				if (~current_block_type_index) {
					if_block2 = if_blocks[current_block_type_index];

					if (!if_block2) {
						if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block2.c();
					} else {
						if_block2.p(ctx, dirty);
					}

					Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block2, 1);
					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
				} else {
					if_block2 = null;
				}
			}
		},
		i(local) {
			if (current) return;
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section2.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section3.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section4.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section5.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section6.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section7.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(section8.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_in"])(if_block2);
			current = true;
		},
		o(local) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section0.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section1.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section2.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section3.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section4.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section5.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section6.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section7.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(section8.$$.fragment, local);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["transition_out"])(if_block2);
			current = false;
		},
		d(detaching) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section0, detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t0);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section1, detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t1);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section2, detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t2);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section3, detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t3);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section4, detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t4);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section5, detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t5);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section6, detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t6);
			if (if_block0) if_block0.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t7);
			if (if_block1) if_block1.d(detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t8);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section7, detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t9);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["destroy_component"])(section8, detaching);
			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(t10);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d(detaching);
			}

			if (detaching) Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["detach"])(if_block2_anchor);
		}
	};
}

const ALMOST_INFINITY = 9999999999;
const CLIENT_ID = 'Ov23liZ8xH1osNpfJWaF';
const BACKEND_URL = 'https://02packager-oauth-backend.netlify.app/.netlify/functions/token';
const MAX_LOGS = 500;

// OAuth helper functions
function generateRandomString(length) {
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
	const values = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(values, x => possible[x % possible.length]).join('');
}

async function sha256(plain) {
	if (!window.crypto || !window.crypto.subtle) throw new Error('需要 HTTPS 环境');
	const encoder = new TextEncoder();
	const data = encoder.encode(plain);
	const hash = await window.crypto.subtle.digest('SHA-256', data);
	return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function instance($$self, $$props, $$invalidate) {
	let $error;
	let $_;
	let $options;
	let $loadingScreenImage;
	let $customCursorIcon;
	let $icon;
	let $progress;
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["component_subscribe"])($$self, _stores__WEBPACK_IMPORTED_MODULE_13__["error"], $$value => $$invalidate(146, $error = $$value));
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["component_subscribe"])($$self, _locales___WEBPACK_IMPORTED_MODULE_2__["_"], $$value => $$invalidate(20, $_ = $$value));
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["component_subscribe"])($$self, _stores__WEBPACK_IMPORTED_MODULE_13__["progress"], $$value => $$invalidate(5, $progress = $$value));
	let { projectData } = $$props;
	let { title } = $$props;
	const cloudVariables = projectData.project.analysis.stageVariables.filter(i => i.isCloud).map(i => i.name);
	const defaultOptions = _packager_web_export__WEBPACK_IMPORTED_MODULE_16__["default"].DEFAULT_OPTIONS();
	defaultOptions.projectId = projectData.projectId || `p4-${projectData.uniqueId}`;

	for (const variable of cloudVariables) {
		defaultOptions.cloudVariables.custom[variable] = 'ws';
	}

	defaultOptions.app.packageName = _packager_web_export__WEBPACK_IMPORTED_MODULE_16__["default"].getDefaultPackageNameFromFileName(projectData.title);
	defaultOptions.app.windowTitle = _packager_web_export__WEBPACK_IMPORTED_MODULE_16__["default"].getWindowTitleFromFileName(projectData.title);
	defaultOptions.extensions = projectData.project.analysis.extensions;
	const options = Object(_persistent_store__WEBPACK_IMPORTED_MODULE_11__["default"])(`PackagerOptions.${projectData.uniqueId}`, defaultOptions);
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["component_subscribe"])($$self, options, value => $$invalidate(1, $options = value));

	// Compatibility with https://github.com/TurboWarp/packager/commit/f66199abd1c896c11aa69247275a1594fdfc95b8
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(
		options,
		$options.extensions = $options.extensions.map(i => {
			if (typeof i === 'object' && i) return i.url || '';
			return i;
		}),
		$options
	);

	if (!$options.compiler.obfuscateCompiledProjectLevel) {
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.compiler.obfuscateCompiledProjectLevel = defaultOptions.compiler.obfuscateCompiledProjectLevel, $options);
		options.set($options);
	}

	const hasMagicComment = magic => projectData.project.analysis.stageComments.find(text => text.split('\n').find(line => line.endsWith(magic)));
	const hasSettingsStoredInProject = hasMagicComment(' // _twconfig_');
	let result = null;
	let previewer = null;

	const resetResult = () => {
		$$invalidate(43, previewer = null);

		if (result) {
			URL.revokeObjectURL(result.url);
		}

		$$invalidate(7, result = null);
	};

	const icon = _file_store__WEBPACK_IMPORTED_MODULE_12__["default"].writableFileStore(`PackagerOptions.icon.${projectData.uniqueId}`);
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["component_subscribe"])($$self, icon, value => $$invalidate(4, $icon = value));
	const customCursorIcon = _file_store__WEBPACK_IMPORTED_MODULE_12__["default"].writableFileStore(`PackagerOptions.customCursorIcon.${projectData.uniqueId}`);
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["component_subscribe"])($$self, customCursorIcon, value => $$invalidate(3, $customCursorIcon = value));
	const loadingScreenImage = _file_store__WEBPACK_IMPORTED_MODULE_12__["default"].writableFileStore(`PackagerOptions.loadingScreenImage.${projectData.uniqueId}`);
	Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["component_subscribe"])($$self, loadingScreenImage, value => $$invalidate(2, $loadingScreenImage = value));

	const setOptions = newOptions => {
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options = newOptions, $options);
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(icon, $icon = $options.app.icon, $icon);
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(customCursorIcon, $customCursorIcon = $options.cursor.custom, $customCursorIcon);
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(loadingScreenImage, $loadingScreenImage = $options.loadingScreen.image, $loadingScreenImage);
	};

	const otherEnvironmentsInitiallyOpen = ![
		'html',
		'zip',
		'electron-win32',
		'webview-mac',
		'electron-linux64',
		'node-cli-win64',
		'node-cli-mac',
		'node-cli-linux64'
	].includes($options.target);

	const advancedOptionsInitiallyOpen = $options.compiler.enabled !== defaultOptions.compiler.enabled || $options.compiler.warpTimer !== defaultOptions.compiler.warpTimer || $options.compiler.compiledProject !== defaultOptions.compiler.compiledProject || $options.compiler.obfuscateCompiledProject !== defaultOptions.compiler.obfuscateCompiledProject || $options.compiler.obfuscateCompiledProjectLevel !== defaultOptions.compiler.obfuscateCompiledProjectLevel || $options.extensions.length !== 0 || $options.bakeExtensions !== defaultOptions.bakeExtensions || $options.custom.css !== '' || $options.custom.js !== '' || $options.projectId !== defaultOptions.projectId || $options.packagedRuntime !== defaultOptions.packagedRuntime || $options.maxTextureDimension !== defaultOptions.maxTextureDimension;
	let advancedOptionsOpen = advancedOptionsInitiallyOpen;

	const scrollToCompiledProjectOption = async () => {
		$$invalidate(8, advancedOptionsOpen = true);
		await Object(svelte__WEBPACK_IMPORTED_MODULE_1__["tick"])();
		const option = document.getElementById('compiled-project-option');

		if (option) {
			option.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	};

	const automaticallyCenterCursor = () => {
		const icon = $customCursorIcon;
		const url = URL.createObjectURL(icon);
		const image = new Image();

		const cleanup = () => {
			image.onerror = null;
			image.onload = null;
			URL.revokeObjectURL(url);
		};

		image.onload = () => {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.cursor.center.x = Math.round(image.width / 2), $options);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.cursor.center.y = Math.round(image.height / 2), $options);
			cleanup();
		};

		image.onerror = () => {
			cleanup();
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(_stores__WEBPACK_IMPORTED_MODULE_13__["error"], $error = new Error('Image could not be loaded'), $error);
			throw $error;
		};

		image.src = url;
	};

	const runPackager = async (task, options) => {
		const packager = new _packager_web_export__WEBPACK_IMPORTED_MODULE_16__["default"]();
		packager.options = options;
		packager.project = projectData.project;

		task.addEventListener('abort', () => {
			packager.abort();
		});

		task.setProgressText($_('progress.loadingScripts'));

		packager.addEventListener('fetch-extensions', ({ detail }) => {
			task.setProgressText($_('progress.downloadingExtensions'));
			task.setProgress(detail.progress);
		});

		const getObfuscationLevelLabel = level => {
			if (level === 'light') return $_('options.obfuscationLevelLight');
			if (level === 'strong') return $_('options.obfuscationLevelStrong');
			return $_('options.obfuscationLevelBalanced');
		};

		packager.addEventListener('obfuscating-compiled-project', ({ detail }) => {
			const current = typeof detail.current === 'number' ? detail.current : 0;
			const total = typeof detail.total === 'number' ? detail.total : 0;
			const progressText = $_('progress.obfuscatingCompiledScripts').replace('{current}', current).replace('{total}', total).replace('{level}', getObfuscationLevelLabel(detail.level));
			task.setProgressText(progressText);

			task.setProgress(typeof detail.progress === 'number'
			? detail.progress
			: 0);
		});

		packager.addEventListener('large-asset-fetch', ({ detail }) => {
			let thing;

			if (detail.asset.startsWith('nwjs-')) {
				thing = 'NW.js';
			} else if (detail.asset.startsWith('electron-')) {
				thing = 'Electron';
			} else if (detail.asset === 'webview-mac') {
				thing = 'WKWebView';
			} else if (detail.asset === 'steamworks.js') {
				thing = 'Steamworks.js';
			}

			if (thing) {
				task.setProgressText($_('progress.loadingLargeAsset').replace('{thing}', thing));
			}

			task.setProgress(detail.progress);
		});

		packager.addEventListener('zip-progress', ({ detail }) => {
			task.setProgressText($_('progress.compressingProject'));
			task.setProgress(detail.progress);
		});

		const result = await packager.package();
		result.blob = new Blob([result.data], { type: result.type });
		result.url = URL.createObjectURL(result.blob);
		return result;
	};

	const pack = async () => {
		resetResult();
		const task = new _task__WEBPACK_IMPORTED_MODULE_17__["default"]();
		addLog('info', '开始本地打包...');

		try {
			$$invalidate(7, result = await task.do(runPackager(task, Object(_deep_clone__WEBPACK_IMPORTED_MODULE_15__["default"])($options))));
			task.done();
			addLog('info', `打包完成: ${result.filename}`);
			Object(_download_url__WEBPACK_IMPORTED_MODULE_18__["default"])(result.filename, result.url);
		} catch(e) {
			addLog('error', `打包出错: ${e && e.message ? e.message : e}`);
			throw e;
		}
	};

	let githubUser = '';
	let githubToken = '';
	let uploadInProgress = false;
	let uploadError = '';
	let uploadedFileUrl = '';
	let createdRepoUrl = '';
	let releaseUrl = '';
	let assetName = '';
	let assetDownloadUrl = '';
	let showReleaseModal = false;

	// OAuth state
	let oauthInProgress = false;

	let oauthError = '';
	let oauthUserInfo = null;
	let oauthToken = '';
	const REDIRECT_URI = window.location.origin + window.location.pathname;

	// Local logs for pack/upload actions
	let logs = [];

	function addLog(level, msg) {
		try {
			const time = new Date().toLocaleTimeString();
			$$invalidate(19, logs = [...logs, { level, msg: String(msg), time }]);
			if (logs.length > MAX_LOGS) $$invalidate(19, logs = logs.slice(logs.length - MAX_LOGS));

			// keep log scrolled to bottom by briefly yielding to event loop
			setTimeout(
				() => {
					const el = document.querySelector('.log-entries');
					if (el) el.scrollTop = el.scrollHeight;
				},
				0
			);
		} catch(e) {
			
		} // ignore logging errors
	}

	function copyLogs() {
		try {
			const text = logs.map(l => `${l.time} [${l.level}] ${l.msg}`).join('\n');
			if (navigator.clipboard) navigator.clipboard.writeText(text);
		} catch(e) {
			
		} // ignore
	}

	const packAndUpload = async () => {
		$$invalidate(10, uploadError = '');
		uploadedFileUrl = '';
		$$invalidate(11, createdRepoUrl = '');
		addLog('info', '开始打包并上传流程');

		if (!oauthUserInfo) {
			$$invalidate(10, uploadError = '请先使用 GitHub OAuth 登录');
			addLog('error', uploadError);
			return;
		}

		// Debug: Check token availability
		addLog('info', `Token available: ${!!githubToken}, User: ${githubUser}`);

		if (!githubToken) {
			$$invalidate(10, uploadError = 'GitHub token 不可用，请重新登录');
			addLog('error', uploadError);
			return;
		}

		$$invalidate(9, uploadInProgress = true);

		try {
			// run packager to produce a blob
			resetResult();

			const task = new _task__WEBPACK_IMPORTED_MODULE_17__["default"]();
			const r = await task.do(runPackager(task, Object(_deep_clone__WEBPACK_IMPORTED_MODULE_15__["default"])($options)));
			task.done();
			addLog('info', `打包完成，文件名: ${r.filename}`);

			// pass progress callback into uploader
			const res = await Object(_github_uploader__WEBPACK_IMPORTED_MODULE_24__["uploadAndBuildFromTemplate"])(
				{
					blob: r.blob,
					name: r.filename,
					githubUser,
					githubToken
				},
				msg => {
					addLog('info', msg);
				}
			);

			$$invalidate(11, createdRepoUrl = res.createdRepoUrl);
			$$invalidate(12, releaseUrl = res.releaseUrl || '');
			$$invalidate(13, assetName = res.assetName || '');
			$$invalidate(14, assetDownloadUrl = res.assetDownloadUrl || '');
			$$invalidate(15, showReleaseModal = true);
			addLog('info', `上传并构建完成: ${assetName || assetDownloadUrl}`);
		} catch(e) {
			$$invalidate(10, uploadError = e.message || '上传失败');
			addLog('error', uploadError);
		} finally {
			$$invalidate(9, uploadInProgress = false);
		}
	};

	const deleteRepoFromUI = async () => {
		if (!createdRepoUrl) return;
		if (!confirm('确定要删除临时仓库吗？该操作不可恢复。')) return;
		addLog('warn', `用户请求删除仓库: ${createdRepoUrl}`);

		try {
			const parts = createdRepoUrl.replace('https://github.com/', '').split('/');
			const owner = parts[0];
			const repo = parts[1];

			const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
				method: 'DELETE',
				headers: {
					Authorization: `token ${githubToken}`,
					Accept: 'application/vnd.github+json'
				}
			});

			if (!resp.ok) {
				const errorData = await resp.json().catch(() => ({}));
				const errorMsg = errorData.message || `HTTP ${resp.status}: ${resp.statusText}`;
				throw new Error(errorMsg);
			}

			alert('仓库已删除');
			addLog('info', `仓库已删除: ${createdRepoUrl}`);
			$$invalidate(11, createdRepoUrl = '');
			$$invalidate(12, releaseUrl = '');
			$$invalidate(14, assetDownloadUrl = '');
			$$invalidate(13, assetName = '');
			$$invalidate(15, showReleaseModal = false);
		} catch(e) {
			const errorMsg = e.message || '删除失败';
			$$invalidate(10, uploadError = `删除仓库失败: ${errorMsg}`);
			addLog('error', uploadError);

			// Provide helpful guidance for common errors
			if (errorMsg.includes('admin rights') || errorMsg.includes('403')) {
				alert(`删除失败: 您没有此仓库的管理员权限。\n\n请手动在GitHub上删除仓库: ${createdRepoUrl}`);
			} else {
				alert(`删除失败: ${errorMsg}\n\n请手动在GitHub上删除仓库: ${createdRepoUrl}`);
			}
		}
	};

	const preview = async () => {
		resetResult();
		$$invalidate(43, previewer = new _preview__WEBPACK_IMPORTED_MODULE_14__["default"]());
		const task = new _task__WEBPACK_IMPORTED_MODULE_17__["default"]();
		const optionsClone = Object(_deep_clone__WEBPACK_IMPORTED_MODULE_15__["default"])($options);
		optionsClone.target = 'html';

		try {
			addLog('info', '开始生成预览');
			$$invalidate(7, result = await task.do(runPackager(task, optionsClone)));
			task.done();
			addLog('info', `预览生成完成: ${result.filename}`);
			previewer.setContent(result.blob);
		} catch(e) {
			addLog('error', `预览生成失败: ${e && e.message ? e.message : e}`);
			previewer.close();
		}
	};

	const resetOptions = properties => {
		for (const key of properties) {
			let current = $options;
			let defaults = defaultOptions;
			const parts = key.split('.');
			const lastPart = parts.pop();

			for (const i of parts) {
				current = current[i];
				defaults = defaults[i];
			}

			current[lastPart] = Object(_deep_clone__WEBPACK_IMPORTED_MODULE_15__["default"])(defaults[lastPart]);
		}

		options.set($options);
	};

	const resetAll = () => {
		if (confirm($_('reset.confirmAll'))) {
			resetOptions(Object.keys($options));
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(icon, $icon = null, $icon);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(customCursorIcon, $customCursorIcon = null, $customCursorIcon);
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(loadingScreenImage, $loadingScreenImage = null, $loadingScreenImage);
		}
	};

	const exportOptions = async () => {
		const exported = await Object(_blob_serializer__WEBPACK_IMPORTED_MODULE_19__["recursivelySerializeBlobs"])($options);
		const blob = new Blob([JSON.stringify(exported)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const formattedAppName = _packager_brand__WEBPACK_IMPORTED_MODULE_23__["APP_NAME"].replace(/[^a-z0-9 ]/gi, '').replace(/ /g, '-').toLowerCase();
		Object(_download_url__WEBPACK_IMPORTED_MODULE_18__["default"])(`${formattedAppName}-settings.json`, url);
		URL.revokeObjectURL(url);
	};

	const importOptions = async () => {
		const input = document.createElement("input");
		input.type = 'file';
		input.accept = '.json';

		input.addEventListener('change', e => {
			importOptionsFromDataTransfer(e.target);
		});

		document.body.appendChild(input);
		input.click();
		input.remove();
	};

	const importOptionsFromDataTransfer = async dataTransfer => {
		const file = dataTransfer.files[0];

		if (!file) {
			// Should never happen.
			return;
		}

		try {
			const text = await Object(_common_readers__WEBPACK_IMPORTED_MODULE_20__["readAsText"])(file);
			const parsed = JSON.parse(text);
			const deserialized = Object(_blob_serializer__WEBPACK_IMPORTED_MODULE_19__["recursivelyDeserializeBlobs"])(parsed);
			const copiedDefaultOptions = Object(_deep_clone__WEBPACK_IMPORTED_MODULE_15__["default"])(defaultOptions);
			const mergedWithDefaults = Object(_merge__WEBPACK_IMPORTED_MODULE_21__["default"])(deserialized, copiedDefaultOptions);
			const isUnsafe = _packager_web_export__WEBPACK_IMPORTED_MODULE_16__["default"].usesUnsafeOptions(mergedWithDefaults);

			if (!isUnsafe || confirm($_('options.confirmImportUnsafe'))) {
				setOptions(mergedWithDefaults);
			}
		} catch(e) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(_stores__WEBPACK_IMPORTED_MODULE_13__["error"], $error = e, $error);
		}
	};

	async function startOAuth() {
		$$invalidate(17, oauthError = '');
		$$invalidate(16, oauthInProgress = true);

		try {
			const codeVerifier = generateRandomString(128);
			const codeChallenge = await sha256(codeVerifier);
			sessionStorage.setItem('code_verifier', codeVerifier);
			sessionStorage.setItem('client_id', CLIENT_ID);
			const authUrl = new URL('https://github.com/login/oauth/authorize');
			authUrl.searchParams.append('client_id', CLIENT_ID);
			authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
			authUrl.searchParams.append('scope', 'repo,admin:org,admin:public_key,admin:repo_hook,admin:org_hook,gist,notifications,user,delete_repo,write:packages,read:packages,delete:packages,admin:gpg_key,workflow');
			authUrl.searchParams.append('code_challenge', codeChallenge);
			authUrl.searchParams.append('code_challenge_method', 'S256');
			authUrl.searchParams.append('state', generateRandomString(32));
			window.location.href = authUrl.toString();
		} catch(e) {
			$$invalidate(17, oauthError = '启动认证失败: ' + e.message);
			$$invalidate(16, oauthInProgress = false);
		}
	}

	async function handleCallback() {
		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');
		if (!code) return;
		$$invalidate(16, oauthInProgress = true);
		const codeVerifier = sessionStorage.getItem('code_verifier');
		const clientId = sessionStorage.getItem('client_id');

		if (!codeVerifier || !clientId) {
			$$invalidate(17, oauthError = '认证参数丢失，请重新登录');
			$$invalidate(16, oauthInProgress = false);
			return;
		}

		try {
			// Try form-encoded format as the backend might expect it
			const formData = new URLSearchParams();

			formData.append('grant_type', 'authorization_code');
			formData.append('client_id', clientId);
			formData.append('code', code);
			formData.append('redirect_uri', REDIRECT_URI);
			formData.append('code_verifier', codeVerifier);

			console.log('OAuth token exchange request:', {
				url: BACKEND_URL,
				body: formData.toString()
			});

			const res = await fetch(BACKEND_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code,
					code_verifier: codeVerifier,
					client_id: clientId,
					redirect_uri: REDIRECT_URI
				})
			});

			console.log('OAuth token exchange response:', {
				status: res.status,
				statusText: res.statusText,
				headers: Object.fromEntries(res.headers.entries())
			});

			const data = await res.json();
			console.log('OAuth token exchange response data:', data);
			if (data.error) throw new Error(data.error_description || data.error);
			const token = data.access_token;

			const userRes = await fetch('https://api.github.com/user', {
				headers: {
					Authorization: `token ${token}`,
					'User-Agent': 'OAuth-App'
				}
			});

			const user = await userRes.json();
			let email = user.email;

			if (!email) {
				const emailRes = await fetch('https://api.github.com/user/emails', {
					headers: {
						Authorization: `token ${token}`,
						'User-Agent': 'OAuth-App'
					}
				});

				const emails = await emailRes.json();
				const primaryEmail = emails.find(e => e.primary);
				email = primaryEmail ? primaryEmail.email : '未公开';
			}

			localStorage.setItem('github_token', token);
			localStorage.setItem('github_user', JSON.stringify(user));
			localStorage.setItem('github_email', email);

			// Update packager state
			githubUser = user.login;

			githubToken = token;
			$$invalidate(18, oauthUserInfo = { user, email, token });
			oauthToken = token;
			window.history.replaceState({}, '', window.location.pathname);
		} catch(e) {
			$$invalidate(17, oauthError = '认证失败: ' + e.message);
		} finally {
			$$invalidate(16, oauthInProgress = false);
		}
	}

	function logoutOAuth() {
		localStorage.removeItem('github_token');
		localStorage.removeItem('github_user');
		localStorage.removeItem('github_email');
		sessionStorage.removeItem('code_verifier');
		sessionStorage.removeItem('client_id');
		githubUser = '';
		githubToken = '';
		$$invalidate(18, oauthUserInfo = null);
		oauthToken = '';
		$$invalidate(17, oauthError = '');
	}

	// Initialize OAuth on component mount
	if (typeof window !== 'undefined') {
		// Check for stored OAuth data
		const storedToken = localStorage.getItem('github_token');

		const storedUser = localStorage.getItem('github_user');
		const storedEmail = localStorage.getItem('github_email');

		if (storedToken && storedUser) {
			const user = JSON.parse(storedUser);
			githubUser = user.login;
			githubToken = storedToken;

			oauthUserInfo = {
				user,
				email: storedEmail,
				token: storedToken
			};

			oauthToken = storedToken;
		}

		// Handle OAuth callback
		handleCallback();
	}

	Object(svelte__WEBPACK_IMPORTED_MODULE_1__["onDestroy"])(() => {
		if (result) {
			URL.revokeObjectURL(result.url);
		}
	});

	const $$binding_groups = [[], [], [], []];

	function input0_change_handler() {
		$options.turbo = this.checked;
		options.set($options);
	}

	function input1_input_handler() {
		$options.framerate = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["to_number"])(this.value);
		options.set($options);
	}

	function input2_change_handler() {
		$options.interpolation = this.checked;
		options.set($options);
	}

	function input3_change_handler() {
		$options.highQualityPen = this.checked;
		options.set($options);
	}

	const change_handler = e => {
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.maxClones = e.target.checked ? ALMOST_INFINITY : 300, $options);
	};

	const change_handler_1 = e => {
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.fencing = !e.target.checked, $options);
	};

	const change_handler_2 = e => {
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.miscLimits = !e.target.checked, $options);
	};

	function input7_input_handler() {
		$options.username = this.value;
		options.set($options);
	}

	function input8_change_handler() {
		$options.closeWhenStopped = this.checked;
		options.set($options);
	}

	function input9_input_handler() {
		$options.stageWidth = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["to_number"])(this.value);
		options.set($options);
	}

	function input10_input_handler() {
		$options.stageHeight = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["to_number"])(this.value);
		options.set($options);
	}

	function input11_change_handler() {
		$options.resizeMode = this.__value;
		options.set($options);
	}

	function input12_change_handler() {
		$options.resizeMode = this.__value;
		options.set($options);
	}

	function input13_change_handler() {
		$options.resizeMode = this.__value;
		options.set($options);
	}

	const func = () => {
		resetOptions([
			'turbo',
			'framerate',
			'interpolation',
			'highQualityPen',
			'maxClones',
			'fencing',
			'miscLimits',
			'stageWidth',
			'stageHeight',
			'resizeMode',
			'username'
		]);
	};

	function input0_input_handler() {
		$options.app.windowTitle = this.value;
		options.set($options);
	}

	function imageinput0_file_binding(value) {
		$icon = value;
		icon.set($icon);
	}

	function input1_change_handler() {
		$options.loadingScreen.progressBar = this.checked;
		options.set($options);
	}

	function input2_input_handler() {
		$options.loadingScreen.text = this.value;
		options.set($options);
	}

	function imageinput1_file_binding(value) {
		$loadingScreenImage = value;
		loadingScreenImage.set($loadingScreenImage);
	}

	function input0_change_handler_1() {
		$options.loadingScreen.imageMode = this.__value;
		options.set($options);
	}

	function input1_change_handler_1() {
		$options.loadingScreen.imageMode = this.__value;
		options.set($options);
	}

	function input3_change_handler_1() {
		$options.autoplay = this.checked;
		options.set($options);
	}

	function input4_change_handler() {
		$options.controls.greenFlag.enabled = this.checked;
		options.set($options);
	}

	function input5_change_handler() {
		$options.controls.stopAll.enabled = this.checked;
		options.set($options);
	}

	function input6_change_handler() {
		$options.controls.pause.enabled = this.checked;
		options.set($options);
	}

	function input7_change_handler() {
		$options.controls.fullscreen.enabled = this.checked;
		options.set($options);
	}

	function colorpicker0_value_binding(value) {
		if ($$self.$$.not_equal($options.appearance.background, value)) {
			$options.appearance.background = value;
			options.set($options);
		}
	}

	function colorpicker1_value_binding(value) {
		if ($$self.$$.not_equal($options.appearance.foreground, value)) {
			$options.appearance.foreground = value;
			options.set($options);
		}
	}

	function colorpicker2_value_binding(value) {
		if ($$self.$$.not_equal($options.appearance.accent, value)) {
			$options.appearance.accent = value;
			options.set($options);
		}
	}

	function input8_change_handler_1() {
		$options.monitors.editableLists = this.checked;
		options.set($options);
	}

	function colorpicker3_value_binding(value) {
		if ($$self.$$.not_equal($options.monitors.variableColor, value)) {
			$options.monitors.variableColor = value;
			options.set($options);
		}
	}

	function colorpicker4_value_binding(value) {
		if ($$self.$$.not_equal($options.monitors.listColor, value)) {
			$options.monitors.listColor = value;
			options.set($options);
		}
	}

	const func_1 = () => {
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(icon, $icon = null, $icon);
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(loadingScreenImage, $loadingScreenImage = null, $loadingScreenImage);

		resetOptions([
			'app.windowTitle',
			'loadingScreen',
			'autoplay',
			'controls',
			'appearance',
			'monitors'
		]);
	};

	function input0_change_handler_2() {
		$options.cursor.type = this.__value;
		options.set($options);
	}

	function input1_change_handler_2() {
		$options.cursor.type = this.__value;
		options.set($options);
	}

	function input2_change_handler_1() {
		$options.cursor.type = this.__value;
		options.set($options);
	}

	function imageinput_file_binding(value) {
		$customCursorIcon = value;
		customCursorIcon.set($customCursorIcon);
	}

	function input0_input_handler_1() {
		$options.cursor.center.x = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["to_number"])(this.value);
		options.set($options);
	}

	function input1_input_handler_1() {
		$options.cursor.center.y = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["to_number"])(this.value);
		options.set($options);
	}

	function input3_change_handler_2() {
		$options.chunks.pointerlock = this.checked;
		options.set($options);
	}

	function input4_change_handler_1() {
		$options.chunks.gamepad = this.checked;
		options.set($options);
	}

	const func_2 = () => {
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(customCursorIcon, $customCursorIcon = null, $customCursorIcon);
		resetOptions(['cursor', 'chunks']);
	};

	function select_change_handler() {
		$options.cloudVariables.mode = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_value"])(this);
		options.set($options);
	}

	function select_change_handler_1(variable) {
		$options.cloudVariables.custom[variable] = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_value"])(this);
		options.set($options);
	}

	function input_input_handler() {
		$options.cloudVariables.cloudHost = this.value;
		options.set($options);
	}

	function input0_change_handler_3() {
		$options.cloudVariables.specialCloudBehaviors = this.checked;
		options.set($options);
	}

	function input1_change_handler_3() {
		$options.cloudVariables.unsafeCloudBehaviors = this.checked;
		options.set($options);
	}

	const func_3 = () => {
		resetOptions(['cloudVariables']);
	};

	function input0_change_handler_4() {
		$options.compiler.enabled = this.checked;
		options.set($options);
	}

	function input1_change_handler_4() {
		$options.compiler.warpTimer = this.checked;
		options.set($options);
	}

	function input2_change_handler_2() {
		$options.compiler.compiledProject = this.checked;
		options.set($options);
	}

	const change_handler_3 = () => {
		if ($options.compiler.compiledProject) {
			Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.compiler.enabled = true, $options);
		}
	};

	function input_change_handler() {
		$options.compiler.obfuscateCompiledProject = this.checked;
		options.set($options);
	}

	function select_change_handler_2() {
		$options.compiler.obfuscateCompiledProjectLevel = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_value"])(this);
		options.set($options);
	}

	function customextensions_extensions_binding(value) {
		if ($$self.$$.not_equal($options.extensions, value)) {
			$options.extensions = value;
			options.set($options);
		}
	}

	function input3_change_handler_3() {
		$options.bakeExtensions = this.checked;
		options.set($options);
	}

	function textarea0_input_handler() {
		$options.custom.css = this.value;
		options.set($options);
	}

	function textarea1_input_handler() {
		$options.custom.js = this.value;
		options.set($options);
	}

	function input4_input_handler() {
		$options.projectId = this.value;
		options.set($options);
	}

	function input5_change_handler_1() {
		$options.packagedRuntime = this.checked;
		options.set($options);
	}

	const change_handler_4 = e => {
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.maxTextureDimension = defaultOptions.maxTextureDimension * (e.target.checked ? 2 : 1), $options);
	};

	function details_toggle_handler() {
		advancedOptionsOpen = this.open;
		$$invalidate(8, advancedOptionsOpen);
	}

	const func_4 = () => {
		resetOptions([
			'compiler',
			'extensions',
			'bakeExtensions',
			'custom',
			'projectId',
			'maxTextureDimension'
		]);
	};

	function input0_change_handler_5() {
		$options.target = this.__value;
		options.set($options);
	}

	function input1_change_handler_5() {
		$options.target = this.__value;
		options.set($options);
	}

	function input2_change_handler_3() {
		$options.target = this.__value;
		options.set($options);
	}

	function input3_change_handler_4() {
		$options.target = this.__value;
		options.set($options);
	}

	function input4_change_handler_2() {
		$options.target = this.__value;
		options.set($options);
	}

	function input5_change_handler_2() {
		$options.target = this.__value;
		options.set($options);
	}

	function input6_change_handler_1() {
		$options.target = this.__value;
		options.set($options);
	}

	function input7_change_handler_1() {
		$options.target = this.__value;
		options.set($options);
	}

	function input8_change_handler_2() {
		$options.target = this.__value;
		options.set($options);
	}

	function input9_change_handler() {
		$options.target = this.__value;
		options.set($options);
	}

	function input10_change_handler() {
		$options.target = this.__value;
		options.set($options);
	}

	function input11_change_handler_1() {
		$options.target = this.__value;
		options.set($options);
	}

	function input12_change_handler_1() {
		$options.target = this.__value;
		options.set($options);
	}

	function input13_change_handler_1() {
		$options.target = this.__value;
		options.set($options);
	}

	function input14_change_handler() {
		$options.target = this.__value;
		options.set($options);
	}

	function input15_change_handler() {
		$options.target = this.__value;
		options.set($options);
	}

	function input16_change_handler() {
		$options.target = this.__value;
		options.set($options);
	}

	function input17_change_handler() {
		$options.target = this.__value;
		options.set($options);
	}

	function input18_change_handler() {
		$options.target = this.__value;
		options.set($options);
	}

	const func_5 = () => {
		resetOptions(['target']);
	};

	function input0_input_handler_2() {
		$options.app.packageName = this.value;
		options.set($options);
	}

	const click_handler = () => {
		$$invalidate(19, logs = []);
	};

	const click_handler_1 = () => {
		navigator.clipboard && assetDownloadUrl && navigator.clipboard.writeText(assetDownloadUrl);
	};

	const click_handler_2 = () => {
		$$invalidate(15, showReleaseModal = false);
	};

	function input1_input_handler_2() {
		$options.app.version = this.value;
		options.set($options);
	}

	function select0_change_handler() {
		$options.app.windowMode = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_value"])(this);
		options.set($options);
	}

	function select1_change_handler() {
		$options.app.escapeBehavior = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_value"])(this);
		options.set($options);
	}

	function select2_change_handler() {
		$options.app.windowControls = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_value"])(this);
		options.set($options);
	}

	const func_6 = () => {
		resetOptions(['app.packageName', 'app.windowMode', 'app.escapeBehavior']);
	};

	function input_input_handler_1() {
		$options.steamworks.appId = this.value;
		options.set($options);
	}

	function select_change_handler_3() {
		$options.steamworks.onError = Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["select_value"])(this);
		options.set($options);
	}

	const func_7 = () => {
		resetOptions(['steamworks']);
	};

	const drop_handler = e => importOptionsFromDataTransfer(e.detail);

	$$self.$$set = $$props => {
		if ('projectData' in $$props) $$invalidate(0, projectData = $$props.projectData);
		if ('title' in $$props) $$invalidate(42, title = $$props.title);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*$progress*/ 32 | $$self.$$.dirty[1] & /*previewer*/ 4096) {
			$: if (previewer) {
				previewer.setProgress($progress.progress, $progress.text);
			}
		}

		if ($$self.$$.dirty[0] & /*$icon*/ 16) {
			$: Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.app.icon = $icon, $options);
		}

		if ($$self.$$.dirty[0] & /*$customCursorIcon*/ 8) {
			$: Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.cursor.custom = $customCursorIcon, $options);
		}

		if ($$self.$$.dirty[0] & /*$loadingScreenImage*/ 4) {
			$: Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["set_store_value"])(options, $options.loadingScreen.image = $loadingScreenImage, $options);
		}

		if ($$self.$$.dirty[0] & /*$options*/ 2) {
			$: ($options, resetResult(), _stores__WEBPACK_IMPORTED_MODULE_13__["currentTask"].abort());
		}

		if ($$self.$$.dirty[0] & /*$options*/ 2) {
			$: $$invalidate(42, title = $options.app.windowTitle);
		}
	};

	return [
		projectData,
		$options,
		$loadingScreenImage,
		$customCursorIcon,
		$icon,
		$progress,
		defaultOptions,
		result,
		advancedOptionsOpen,
		uploadInProgress,
		uploadError,
		createdRepoUrl,
		releaseUrl,
		assetName,
		assetDownloadUrl,
		showReleaseModal,
		oauthInProgress,
		oauthError,
		oauthUserInfo,
		logs,
		$_,
		cloudVariables,
		options,
		hasSettingsStoredInProject,
		icon,
		customCursorIcon,
		loadingScreenImage,
		otherEnvironmentsInitiallyOpen,
		scrollToCompiledProjectOption,
		automaticallyCenterCursor,
		pack,
		copyLogs,
		packAndUpload,
		deleteRepoFromUI,
		preview,
		resetOptions,
		resetAll,
		exportOptions,
		importOptions,
		importOptionsFromDataTransfer,
		startOAuth,
		logoutOAuth,
		title,
		previewer,
		input0_change_handler,
		input1_input_handler,
		input2_change_handler,
		input3_change_handler,
		change_handler,
		change_handler_1,
		change_handler_2,
		input7_input_handler,
		input8_change_handler,
		input9_input_handler,
		input10_input_handler,
		input11_change_handler,
		$$binding_groups,
		input12_change_handler,
		input13_change_handler,
		func,
		input0_input_handler,
		imageinput0_file_binding,
		input1_change_handler,
		input2_input_handler,
		imageinput1_file_binding,
		input0_change_handler_1,
		input1_change_handler_1,
		input3_change_handler_1,
		input4_change_handler,
		input5_change_handler,
		input6_change_handler,
		input7_change_handler,
		colorpicker0_value_binding,
		colorpicker1_value_binding,
		colorpicker2_value_binding,
		input8_change_handler_1,
		colorpicker3_value_binding,
		colorpicker4_value_binding,
		func_1,
		input0_change_handler_2,
		input1_change_handler_2,
		input2_change_handler_1,
		imageinput_file_binding,
		input0_input_handler_1,
		input1_input_handler_1,
		input3_change_handler_2,
		input4_change_handler_1,
		func_2,
		select_change_handler,
		select_change_handler_1,
		input_input_handler,
		input0_change_handler_3,
		input1_change_handler_3,
		func_3,
		input0_change_handler_4,
		input1_change_handler_4,
		input2_change_handler_2,
		change_handler_3,
		input_change_handler,
		select_change_handler_2,
		customextensions_extensions_binding,
		input3_change_handler_3,
		textarea0_input_handler,
		textarea1_input_handler,
		input4_input_handler,
		input5_change_handler_1,
		change_handler_4,
		details_toggle_handler,
		func_4,
		input0_change_handler_5,
		input1_change_handler_5,
		input2_change_handler_3,
		input3_change_handler_4,
		input4_change_handler_2,
		input5_change_handler_2,
		input6_change_handler_1,
		input7_change_handler_1,
		input8_change_handler_2,
		input9_change_handler,
		input10_change_handler,
		input11_change_handler_1,
		input12_change_handler_1,
		input13_change_handler_1,
		input14_change_handler,
		input15_change_handler,
		input16_change_handler,
		input17_change_handler,
		input18_change_handler,
		func_5,
		input0_input_handler_2,
		click_handler,
		click_handler_1,
		click_handler_2,
		input1_input_handler_2,
		select0_change_handler,
		select1_change_handler,
		select2_change_handler,
		func_6,
		input_input_handler_1,
		select_change_handler_3,
		func_7,
		drop_handler
	];
}

class PackagerOptions extends svelte_internal__WEBPACK_IMPORTED_MODULE_0__["SvelteComponent"] {
	constructor(options) {
		super();
		Object(svelte_internal__WEBPACK_IMPORTED_MODULE_0__["init"])(this, options, instance, create_fragment, svelte_internal__WEBPACK_IMPORTED_MODULE_0__["safe_not_equal"], { projectData: 0, title: 42 }, add_css, [-1, -1, -1, -1, -1, -1]);
	}
}

/* harmony default export */ __webpack_exports__["default"] = (PackagerOptions);

/***/ }),

/***/ "./src/p4/base64.js":
/*!**************************!*\
  !*** ./src/p4/base64.js ***!
  \**************************/
/*! exports provided: encode, decode */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "encode", function() { return encode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "decode", function() { return decode; });
/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {string}
 */
const encode = arrayBuffer => {
  let string = '';
  const data = new Uint8Array(arrayBuffer);
  for (let i = 0; i < data.byteLength; i++) {
    string += String.fromCharCode(data[i]);
  }
  return btoa(string);
};

/**
 * @param {string} string
 * @returns {ArrayBuffer}
 */
const decode = string => {
  const data = atob(string);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data.charCodeAt(i);
  }
  return result.buffer;
};

/***/ }),

/***/ "./src/p4/blob-serializer.js":
/*!***********************************!*\
  !*** ./src/p4/blob-serializer.js ***!
  \***********************************/
/*! exports provided: recursivelySerializeBlobs, recursivelyDeserializeBlobs */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "recursivelySerializeBlobs", function() { return recursivelySerializeBlobs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "recursivelyDeserializeBlobs", function() { return recursivelyDeserializeBlobs; });
/* harmony import */ var _common_readers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../common/readers */ "./src/common/readers.js");
/* harmony import */ var _base64__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./base64 */ "./src/p4/base64.js");


const BLOB_IDENTIFIER = '__isBlob';
const isObjectOrArray = value => value !== null && typeof value === 'object';

/**
 * Generate an object where any child properties of type Blob will have their data inlined.
 * @param {unknown} object 
 * @returns {Promise<unknown>}
 */
const recursivelySerializeBlobs = async object => {
  if (Array.isArray(object)) {
    return object;
  }
  const result = {};
  for (const key of Object.keys(object)) {
    if (key === BLOB_IDENTIFIER) {
      // We could add special handling for this property, but nothing we export should actually
      // use this property anyways so this is fine for now.
      throw new Error("Can't serialize special key: ".concat(BLOB_IDENTIFIER));
    }
    const value = object[key];
    if (value instanceof Blob) {
      const arrayBuffer = await Object(_common_readers__WEBPACK_IMPORTED_MODULE_0__["readAsArrayBuffer"])(value);
      result[key] = {
        [BLOB_IDENTIFIER]: true,
        type: value.type,
        name: value.name || '',
        data: Object(_base64__WEBPACK_IMPORTED_MODULE_1__["encode"])(arrayBuffer)
      };
    } else if (isObjectOrArray(value)) {
      result[key] = await recursivelySerializeBlobs(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

/**
 * Generate an object where any child properties inlined by recursivelySerializeBlobs will be converted
 * back to a blob.
 * @param {unknown} object
 * @returns {unknown}
 */
const recursivelyDeserializeBlobs = object => {
  if (Array.isArray(object)) {
    return object;
  }
  const result = {};
  for (const key of Object.keys(object)) {
    const value = object[key];
    if (isObjectOrArray(value)) {
      if (value[BLOB_IDENTIFIER]) {
        const blob = new Blob([Object(_base64__WEBPACK_IMPORTED_MODULE_1__["decode"])(value.data)], {
          type: value.type
        });
        blob.name = value.name;
        result[key] = blob;
      } else {
        result[key] = recursivelyDeserializeBlobs(value);
      }
    } else {
      result[key] = value;
    }
  }
  return result;
};


/***/ }),

/***/ "./src/p4/deep-clone.js":
/*!******************************!*\
  !*** ./src/p4/deep-clone.js ***!
  \******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const deepClone = obj => {
  if (obj instanceof Blob) {
    return obj;
  }
  if (Array.isArray(obj)) {
    const result = [];
    for (const value of obj) {
      result.push(deepClone(value));
    }
    return result;
  }
  if (obj && typeof obj === 'object') {
    // TODO: there's probably some prototype pollution in here
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = deepClone(obj[key]);
    }
    return result;
  }
  // Primitive type
  return obj;
};
/* harmony default export */ __webpack_exports__["default"] = (deepClone);

/***/ }),

/***/ "./src/p4/download-url.js":
/*!********************************!*\
  !*** ./src/p4/download-url.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const downloadURL = (filename, url) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
};
/* harmony default export */ __webpack_exports__["default"] = (downloadURL);

/***/ }),

/***/ "./src/p4/file-store.js":
/*!******************************!*\
  !*** ./src/p4/file-store.js ***!
  \******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_store__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/store */ "./node_modules/svelte/store/index.mjs");
/* harmony import */ var _common_idb__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../common/idb */ "./src/common/idb.js");
/* harmony import */ var _common_readers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../common/readers */ "./src/common/readers.js");



const DATABASE_NAME = 'p4-local-settings';
const DATABASE_VERSION = 1;
const STORE_NAME = 'blobs';
const db = new _common_idb__WEBPACK_IMPORTED_MODULE_1__["default"](DATABASE_NAME, DATABASE_VERSION, STORE_NAME);
const makeNamedBlob = (buffer, type, name) => {
  const blob = new Blob([buffer], {
    type
  });
  blob.name = name;
  return blob;
};
const cloneBlob = async blob => {
  const buffer = await Object(_common_readers__WEBPACK_IMPORTED_MODULE_2__["readAsArrayBuffer"])(blob);
  return makeNamedBlob(buffer, blob.type, blob.name);
};
const get = async key => {
  const {
    transaction,
    store
  } = await db.createTransaction('readonly');
  return new Promise((resolve, reject) => {
    _common_idb__WEBPACK_IMPORTED_MODULE_1__["default"].setTransactionErrorHandler(transaction, reject);
    const request = store.get(key);
    request.onsuccess = e => {
      const result = e.target.result;
      if (result) {
        const data = result.data;
        // Older versions stored these files as instances of File
        if (data instanceof Blob) {
          // Clone immediately to fix spurious "NotFoundError: Node was not found" in Firefox
          resolve(cloneBlob(data));
        } else {
          resolve(makeNamedBlob(data, result.type, result.name));
        }
      } else {
        resolve(null);
      }
    };
  });
};
const set = async (key, file) => {
  const arrayBuffer = file ? await Object(_common_readers__WEBPACK_IMPORTED_MODULE_2__["readAsArrayBuffer"])(file) : null;
  const {
    transaction,
    store
  } = await db.createTransaction('readwrite');
  return new Promise((resolve, reject) => {
    _common_idb__WEBPACK_IMPORTED_MODULE_1__["default"].setTransactionErrorHandler(transaction, reject);
    const request = file ? store.put({
      id: key,
      data: arrayBuffer,
      type: file.type,
      name: file.name
    }) : store.delete(key);
    request.onsuccess = () => {
      resolve();
    };
  });
};
const resetAll = () => db.deleteEverything();
const writableFileStore = key => {
  let hasQueried = false;
  const store = Object(svelte_store__WEBPACK_IMPORTED_MODULE_0__["writable"])(null, () => {
    const unsubscribe = store.subscribe(file => {
      if (hasQueried) {
        set(key, file).catch(err => {
          console.warn(err);
        });
      }
    });
    return unsubscribe;
  });
  get(key).then(value => {
    hasQueried = true;
    if (value) {
      store.set(value);
    }
  });
  return store;
};
/* harmony default export */ __webpack_exports__["default"] = ({
  writableFileStore,
  resetAll
});

/***/ }),

/***/ "./src/p4/github-uploader.js":
/*!***********************************!*\
  !*** ./src/p4/github-uploader.js ***!
  \***********************************/
/*! exports provided: uploadAndBuildFromTemplate */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "uploadAndBuildFromTemplate", function() { return uploadAndBuildFromTemplate; });
async function uploadAndBuildFromTemplate(opts) {
  let progressCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  const {
    blob,
    name,
    githubUser,
    githubToken,
    templateOwner = 'Deep-sea-lab',
    templateRepo = '02packager-template',
    workflowId = 'main.yml',
    autoDelete = false,
    pollIntervalMs = 10000,
    pollMaxAttempts = 60
  } = opts || {};
  if (!githubUser || !githubToken) throw new Error('Missing GitHub username or token');
  if (!blob || !name) throw new Error('Missing blob or filename');
  const apiBase = 'https://api.github.com';

  // generate a unique temporary repo name
  const rand = Math.random().toString(36).slice(2, 8);
  const repoName = "packager-temp-".concat(rand);
  const genUrl = "".concat(apiBase, "/repos/").concat(templateOwner, "/").concat(templateRepo, "/generate");
  const progress = msg => {
    try {
      if (typeof progressCallback === 'function') progressCallback(msg);
    } catch (e) {
      // ignore
    }
  };
  // First, check if the user is an organization or personal account
  progress('正在检查用户类型...');
  const userResp = await fetch("".concat(apiBase, "/users/").concat(githubUser), {
    headers: {
      Authorization: "token ".concat(githubToken),
      Accept: 'application/vnd.github+json'
    }
  });
  if (!userResp.ok) {
    throw new Error("\u65E0\u6CD5\u83B7\u53D6\u7528\u6237\u4FE1\u606F: ".concat(userResp.status));
  }
  const userData = await userResp.json();
  const isOrg = userData.type === 'Organization';

  // Generate a new repo from the template
  progress("\u6B63\u5728\u4ECE\u6A21\u677F\u4ED3\u5E93\u751F\u6210\u65B0\u4ED3\u5E93".concat(isOrg ? ' (组织)' : '', "..."));
  const generateResp = await fetch(genUrl, {
    method: 'POST',
    headers: {
      Authorization: "token ".concat(githubToken),
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({
      owner: githubUser,
      name: repoName,
      description: 'Temp repo created by packager from template',
      private: false
    })
  });
  if (!generateResp.ok) {
    const genErr = await generateResp.text();
    throw new Error("\u65E0\u6CD5\u4ECE\u6A21\u677F\u751F\u6210\u4ED3\u5E93 (status: ".concat(generateResp.status, "). \u9519\u8BEF: ").concat(genErr));
  }
  const genJson = await generateResp.json();
  const createdRepoUrl = genJson.html_url || "https://github.com/".concat(githubUser, "/").concat(repoName);
  progress("\u4ED3\u5E93\u5DF2\u4ECE\u6A21\u677F\u751F\u6210: ".concat(createdRepoUrl));

  // Add the GitHub Actions workflow file directly
  progress('正在添加构建工作流...');
  const workflowContent = "name: Cordova Build\n\non:\n  push:\n    branches:\n      - main\n  pull_request:\n    branches:\n      - main\n\npermissions:\n  # required to modify releases\n  contents: write\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n\n    steps:\n      # Check out the repository code\n      - name: Checkout code\n        uses: actions/checkout@v4\n\n      # Set up Node.js\n      - name: Set up Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n\n      # Set up Java 17\n      - name: Set up JDK 17\n        uses: actions/setup-java@v4\n        with:\n          java-version: '17'\n          distribution: 'adopt'\n\n      # Set up Android SDK and Build Tools\n      - name: Set up Android SDK\n        uses: android-actions/setup-android@v3\n        with:\n          cmdline-tools-version: 'latest'\n\n      # Install Android Build Tools\n      - name: Install Android Build Tools\n        run: |\n          sdkmanager \"build-tools;30.0.3\" \"platform-tools\" \"platforms;android-33\"\n        env:\n          ANDROID_HOME: ${{ env.ANDROID_HOME }}\n          ANDROID_SDK_ROOT: ${{ env.ANDROID_HOME }}\n\n      # Set up Gradle\n      - name: Set up Gradle\n        uses: gradle/actions/setup-gradle@v4\n        with:\n          gradle-version: '7.6.5' # Specify a stable Gradle version compatible with Android builds\n\n      # Install Cordova globally\n      - name: Install Cordova\n        run: npm install -g cordova\n\n      # Find and unzip the project's zip file\n      - name: Unzip project\n        run: |\n          ZIP_FILE=$(find . -maxdepth 1 -name \"*.zip\" -type f)\n          if [ -z \"$ZIP_FILE\" ]; then\n            echo \"No zip file found\"\n            exit 1\n          fi\n          unzip \"$ZIP_FILE\" -d project\n          rm \"$ZIP_FILE\"\n\n      # Navigate to unzipped project directory and run npm install\n      - name: Install dependencies\n        run: |\n          cd project\n          npm install\n\n      # Run npm build\n      - name: Build project\n        run: |\n          cd project\n          npm run build\n        env:\n          ANDROID_HOME: ${{ env.ANDROID_HOME }}\n          ANDROID_SDK_ROOT: ${{ env.ANDROID_HOME }}\n\n      - name: Upload artifacts to tag\n        uses: xresloader/upload-to-github-release@2bcae85344d41e21f7fc4c47fa2ed68223afdb49\n        with:\n          file: ./project/platforms/android/app/build/outputs/apk/debug/app-debug.apk\n          draft: false\n          tag_name: \"deep-sea-build\"";
  const workflowResp = await fetch("".concat(apiBase, "/repos/").concat(githubUser, "/").concat(repoName, "/contents/.github/workflows/").concat(workflowId), {
    method: 'PUT',
    headers: {
      Authorization: "token ".concat(githubToken),
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({
      message: 'Add Cordova build workflow',
      content: btoa(workflowContent)
    })
  });
  if (!workflowResp.ok) {
    console.warn('添加工作流失败:', await workflowResp.text());
  } else {
    progress('构建工作流已添加');
  }

  // 2) Upload the packed file to the repo via contents API
  progress("\u5F00\u59CB\u4E0A\u4F20\u6253\u5305\u6587\u4EF6 ".concat(name, " \u5230\u4ED3\u5E93 ").concat(githubUser, "/").concat(repoName, " ..."));
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  const base64 = btoa(binary);
  const putUrl = "".concat(apiBase, "/repos/").concat(githubUser, "/").concat(repoName, "/contents/").concat(encodeURIComponent(name));
  const putResp = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      Authorization: "token ".concat(githubToken),
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({
      message: "Upload ".concat(name, " via packager"),
      content: base64
    })
  });
  if (!putResp.ok) {
    const err = await putResp.text();
    throw new Error("\u4E0A\u4F20\u6587\u4EF6\u5931\u8D25: ".concat(putResp.status, " ").concat(err));
  }
  progress('打包文件上传完成');

  // 3) Trigger workflow dispatch
  const dispatchUrl = "".concat(apiBase, "/repos/").concat(githubUser, "/").concat(repoName, "/actions/workflows/").concat(workflowId, "/dispatches");
  const dispatchResp = await fetch(dispatchUrl, {
    method: 'POST',
    headers: {
      Authorization: "token ".concat(githubToken),
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({
      ref: 'main'
    })
  });
  if (![204, 201, 202].includes(dispatchResp.status)) {
    const err = await dispatchResp.text();
    throw new Error("\u89E6\u53D1 workflow \u5931\u8D25: ".concat(dispatchResp.status, " ").concat(err));
  }
  progress('已触发 GitHub Actions workflow，开始轮询执行状态...');

  // 4) Poll for latest run and wait for conclusion
  const runsUrlBase = "".concat(apiBase, "/repos/").concat(githubUser, "/").concat(repoName, "/actions/runs");
  let runId = null;
  let attempt = 0;
  let runObj = null;
  while (attempt < pollMaxAttempts) {
    attempt++;
    await new Promise(r => setTimeout(r, attempt === 1 ? 2000 : pollIntervalMs));
    const runsResp = await fetch("".concat(runsUrlBase, "?per_page=1"), {
      headers: {
        Authorization: "token ".concat(githubToken),
        Accept: 'application/vnd.github+json'
      }
    });
    if (!runsResp.ok) {
      // try again
      continue;
    }
    const runsJson = await runsResp.json();
    const wr = runsJson.workflow_runs && runsJson.workflow_runs[0];
    if (!wr) continue;
    runId = wr.id;
    // fetch run details
    const runResp = await fetch("".concat(apiBase, "/repos/").concat(githubUser, "/").concat(repoName, "/actions/runs/").concat(runId), {
      headers: {
        Authorization: "token ".concat(githubToken),
        Accept: 'application/vnd.github+json'
      }
    });
    if (!runResp.ok) continue;
    runObj = await runResp.json();
    const status = runObj.status;
    const conclusion = runObj.conclusion;
    progress("\u5DE5\u4F5C\u6D41\u72B6\u6001: ".concat(status, " \u7ED3\u8BBA: ").concat(conclusion || 'pending'));
    if (conclusion === 'success') break;
    if (conclusion && (conclusion === 'failure' || conclusion === 'cancelled' || conclusion === 'timed_out')) {
      throw new Error("Workflow finished with conclusion: ".concat(conclusion));
    }
    // otherwise keep polling
  }
  if (!runObj || runObj.conclusion !== 'success') {
    throw new Error('Workflow did not complete successfully in time');
  }
  progress('工作流执行成功，尝试获取 Release 及其资产...');

  // 5) Get latest release for the repo
  const releaseResp = await fetch("".concat(apiBase, "/repos/").concat(githubUser, "/").concat(repoName, "/releases/latest"), {
    headers: {
      Authorization: "token ".concat(githubToken),
      Accept: 'application/vnd.github+json'
    }
  });
  if (!releaseResp.ok) {
    const err = await releaseResp.text();
    throw new Error("\u83B7\u53D6 release \u5931\u8D25: ".concat(releaseResp.status, " ").concat(err));
  }
  const releaseJson = await releaseResp.json();
  if (!releaseJson.assets || releaseJson.assets.length === 0) {
    throw new Error('未找到 release 资产');
  }
  const asset = releaseJson.assets[0];
  const downloadUrl = asset.browser_download_url;
  progress("\u627E\u5230 release \u8D44\u4EA7: ".concat(asset.name));

  // Do not auto-download asset in the browser. Return the asset download URL so the UI can present it to the user.
  const assetDownloadUrl = downloadUrl;

  // Optionally delete the repo only if explicitly requested (default: false)
  if (autoDelete) {
    try {
      const delResp = await fetch("".concat(apiBase, "/repos/").concat(githubUser, "/").concat(repoName), {
        method: 'DELETE',
        headers: {
          Authorization: "token ".concat(githubToken),
          Accept: 'application/vnd.github+json'
        }
      });
      if (!delResp.ok) {
        const errorData = await delResp.json().catch(() => ({}));
        console.warn('删除临时仓库失败:', errorData.message || "HTTP ".concat(delResp.status));
        progress("\u8B66\u544A: \u65E0\u6CD5\u81EA\u52A8\u5220\u9664\u4E34\u65F6\u4ED3\u5E93\uFF0C\u8BF7\u624B\u52A8\u5220\u9664: ".concat(createdRepoUrl));
      } else {
        progress('临时仓库已自动删除');
      }
    } catch (e) {
      console.warn('删除临时仓库时发生错误:', e);
      progress("\u8B66\u544A: \u65E0\u6CD5\u81EA\u52A8\u5220\u9664\u4E34\u65F6\u4ED3\u5E93\uFF0C\u8BF7\u624B\u52A8\u5220\u9664: ".concat(createdRepoUrl));
    }
  }

  // Return links for UI
  return {
    createdRepoUrl,
    releaseUrl: releaseJson.html_url || "".concat(createdRepoUrl, "/releases/latest"),
    assetName: asset.name,
    assetDownloadUrl
  };
}

/***/ }),

/***/ "./src/p4/preview.js":
/*!***************************!*\
  !*** ./src/p4/preview.js ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _environment__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./environment */ "./src/p4/environment.js");
/* harmony import */ var _common_escape_xml__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../common/escape-xml */ "./src/common/escape-xml.js");
/* harmony import */ var _locales__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../locales */ "./src/locales/index.js");



const origin = _environment__WEBPACK_IMPORTED_MODULE_0__["isStandalone"] ? '*' : location.origin;
const getPreviewSource = () => "<!DOCTYPE html>\n<html>\n<head>\n  <title>".concat(Object(_common_escape_xml__WEBPACK_IMPORTED_MODULE_1__["default"])(_locales__WEBPACK_IMPORTED_MODULE_2__["_"].translate('preview.loading')), "</title>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">\n  <style>\n  body {\n    background: black;\n    color: white;\n    font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n  }\n  .preview-message {\n    background: inherit;\n    display: flex;\n    align-items: center;\n    flex-direction: column;\n    justify-content: center;\n    text-align: center;\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    user-select: none;\n    -webkit-user-select: none;\n  }\n  .preview-progress-outer {\n    width: 200px;\n    height: 10px;\n    border: 1px solid white;\n  }\n  .preview-progress-inner {\n    height: 100%;\n    width: 0;\n    background: white;\n  }\n  [hidden] {\n    display: none;\n  }\n  </style>\n</head>\n<body>\n  <div class=\"preview-message\">\n    <noscript>Enable JavaScript</noscript>\n    <div class=\"preview-progress-outer\"><div class=\"preview-progress-inner\"></div></div>\n  </div>\n  <div class=\"preview-message preview-error\" hidden>\n    <div class=\"preview-error-message\"></div>\n    <div>Go back to the original tab and try again</div>\n  </div>\n  <script>\n  (function() {\n    const origin = ").concat(JSON.stringify(origin), ";\n    const err = (message) => {\n      document.querySelector(\".preview-error\").hidden = false;\n      document.querySelector(\".preview-error-message\").textContent = \"Error: \" + message;\n    };\n    if (!window.opener) {\n      err(\"Can't communicate with main page.\");\n      return;\n    }\n    let hasRun = false;\n    const progressBar = document.querySelector(\".preview-progress-inner\");\n    const progressText = document.querySelector(\".preview-progress-text\");\n    window.addEventListener(\"message\", (e) => {\n      if (origin !== \"*\" && e.origin !== location.origin) return;\n      if (hasRun) return;\n      if (e.data.blob) {\n        hasRun = true;\n        const fr = new FileReader();\n        fr.onload = () => {\n          document.open();\n          document.write(fr.result);\n          document.close(); // fixes poor performance in firefox\n        };\n        fr.onerror = () => {\n          err(\"Something went wrong reading the file: \" + fr.error);\n        };\n        fr.readAsText(e.data.blob);\n      }\n      if (typeof e.data.progress === \"number\") {\n        progressBar.style.width = (e.data.progress * 100) + \"%\";\n      }\n    });\n    window.opener.postMessage({\n      preview: \"hello\"\n    }, origin);\n  })();\n  </script>\n</body>\n</html>\n");
const windowToBlobMap = new WeakMap();
class Preview {
  constructor() {
    const preview = getPreviewSource();

    // Safari does not let file: URIs used by standalone version to open blob: URIs
    // The desktop app just doesn't support windows loaded from blobs
    const canUseBlobWindow = !(_environment__WEBPACK_IMPORTED_MODULE_0__["isStandalone"] && _environment__WEBPACK_IMPORTED_MODULE_0__["isSafari"]) && typeof IsDesktop === 'undefined';
    if (canUseBlobWindow) {
      const url = URL.createObjectURL(new Blob([preview], {
        type: 'text/html'
      })) + '#do-not-share-this-link-it-will-not-work-for-others';
      this.window = window.open(url);
    } else {
      this.window = window.open('about:blank');
      if (this.window) {
        this.window.document.write(preview);
      }
    }
    if (!this.window) {
      throw new Error('Cannot open popup');
    }
  }
  setContent(content) {
    windowToBlobMap.set(this.window, content);
    this.window.postMessage({
      blob: content
    }, origin);
  }
  setProgress(progress, text) {
    this.window.postMessage({
      progress,
      text
    }, origin);
  }
  close() {
    this.window.close();
  }
}
window.addEventListener('message', e => {
  if (origin !== '*' && e.origin !== location.origin) {
    return;
  }
  const data = e.data;
  if (data && data.preview === 'hello') {
    const source = e.source;
    const blob = windowToBlobMap.get(source);
    if (blob) {
      source.postMessage({
        blob
      }, origin);
    }
  }
});
/* harmony default export */ __webpack_exports__["default"] = (Preview);

/***/ }),

/***/ "./src/packager/adapter.js":
/*!*********************************!*\
  !*** ./src/packager/adapter.js ***!
  \*********************************/
/*! exports provided: Adapter, setAdapter */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Adapter", function() { return Adapter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setAdapter", function() { return setAdapter; });
let Adapter = null;
const setAdapter = newAdapter => {
  Adapter = newAdapter;
};

/***/ }),

/***/ "./src/packager/base85.js":
/*!********************************!*\
  !*** ./src/packager/base85.js ***!
  \********************************/
/*! exports provided: encode, decode */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "encode", function() { return encode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "decode", function() { return decode; });
// This implements a custom base85 encoding for improved efficiency compared to base64.
// The character set used is 0x2a - 0x7e of ASCII. Little endian.

// 0x3c (<) is replaced with 0x28 (opening parenthesis) and 0x3e (>) is replaced with 0x29 (closing parenthesis),
// which makes the encoded data safe to include in any HTML context without escapes.

const getBase85EncodeCharacter = n => {
  n += 0x2a;
  if (n === 0x3c) return 0x28;
  if (n === 0x3e) return 0x29;
  return n;
};

/**
 * @param {Uint8Array} uint8 The data to encode. No assumptions made about backing buffer.
 * @returns {string} Base 85 encoding
 */
const encode = uint8 => {
  const originalLength = uint8.length;

  // Data length needs to be a multiple of 4 so we can use getUint32.
  // If it's not, we'll have to make a copy and pad with zeros.
  let dataView;
  if (originalLength % 4 !== 0) {
    const newUint8 = new Uint8Array(Math.ceil(originalLength / 4) * 4);
    for (let i = 0; i < originalLength; i++) {
      newUint8[i] = uint8[i];
    }
    dataView = new DataView(newUint8.buffer);
  } else {
    dataView = new DataView(uint8.buffer, uint8.byteOffset, uint8.byteLength);
  }

  // Pre-allocating buffer and using TextDecoder at the end is faster than string concatenation
  // Each set of 4 bytes is represented by 5 characters. Pad with zeros if needed.
  const result = new Uint8Array(Math.ceil(originalLength / 4) * 5);
  let resultIndex = 0;
  for (let i = 0; i < dataView.byteLength; i += 4) {
    let n = dataView.getUint32(i, true);
    result[resultIndex++] = getBase85EncodeCharacter(n % 85);
    n = Math.floor(n / 85);
    result[resultIndex++] = getBase85EncodeCharacter(n % 85);
    n = Math.floor(n / 85);
    result[resultIndex++] = getBase85EncodeCharacter(n % 85);
    n = Math.floor(n / 85);
    result[resultIndex++] = getBase85EncodeCharacter(n % 85);
    n = Math.floor(n / 85);
    result[resultIndex++] = getBase85EncodeCharacter(n % 85);
  }
  return new TextDecoder().decode(result);
};

// Keep the base85 decode function up-to-date in packager.js

const getBase85DecodeValue = code => {
  if (code === 0x28) code = 0x3c;
  if (code === 0x29) code = 0x3e;
  return code - 0x2a;
};

/**
 * @param {string} str Base 85 data
 * @param {ArrayBuffer} outBuffer Assumed to have a byteLength that is a multiple of 4
 * @param {number} outOffset Assumed to have be a multiple of 4
 */
const decode = (str, outBuffer, outOffset) => {
  const view = new DataView(outBuffer, outOffset, Math.floor(str.length / 5 * 4));
  for (let i = 0, j = 0; i < str.length; i += 5, j += 4) {
    view.setUint32(j, getBase85DecodeValue(str.charCodeAt(i + 4)) * 85 * 85 * 85 * 85 + getBase85DecodeValue(str.charCodeAt(i + 3)) * 85 * 85 * 85 + getBase85DecodeValue(str.charCodeAt(i + 2)) * 85 * 85 + getBase85DecodeValue(str.charCodeAt(i + 1)) * 85 + getBase85DecodeValue(str.charCodeAt(i)), true);
  }
};

/***/ }),

/***/ "./src/packager/build-id.js":
/*!**********************************!*\
  !*** ./src/packager/build-id.js ***!
  \**********************************/
/*! exports provided: buildId, verifyBuildId */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "buildId", function() { return SCAFFOLDING_BUILD_ID; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "verifyBuildId", function() { return verifyBuildId; });
const SCAFFOLDING_BUILD_ID = ("development-" + Math.random().toString().substring(2));
const verifyBuildId = (buildId, source) => {
  if (source.endsWith('=^..^=')) {
    return source.endsWith("".concat(buildId, " =^..^="));
  }
  return true;
};


/***/ }),

/***/ "./src/packager/colors.js":
/*!********************************!*\
  !*** ./src/packager/colors.js ***!
  \********************************/
/*! exports provided: hexToRgb, rgbToHex, rgbToHsv, hsvToRgb, darken */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hexToRgb", function() { return hexToRgb; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "rgbToHex", function() { return rgbToHex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "rgbToHsv", function() { return rgbToHsv; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hsvToRgb", function() { return hsvToRgb; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "darken", function() { return darken; });
// RGB <-> HSV conversion functions are based on https://github.com/LLK/scratch-vm/blob/develop/src/util/color.js

/**
 * @typedef RGB
 * @property {number} red red [0-255]
 * @property {number} green green [0-255]
 * @property {number} blue blue [0-255]
 */

/**
 * @typedef HSV
 * @property {number} hue hue [0-360)
 * @property {number} saturation saturation [0-1]
 * @property {number} value value [0-1]
 */

/**
 * @param {string} hex
 * @returns {RGB}
 */
const hexToRgb = hex => {
  const parsed = parseInt(hex.substring(1), 16);
  return {
    red: parsed >> 16 & 0xff,
    green: parsed >> 8 & 0xff,
    blue: parsed & 0xff
  };
};

/**
 * @param {RGB} color
 * @returns {string}
 */
const rgbToHex = color => {
  const format = n => n.toString(16).padStart(2, '0');
  return "#".concat(format(color.red)).concat(format(color.green)).concat(format(color.blue));
};

/**
 * @param {RGB} color
 * @returns {HSV}
 */
const rgbToHsv = color => {
  const r = color.red / 255;
  const g = color.green / 255;
  const b = color.blue / 255;
  const x = Math.min(Math.min(r, g), b);
  const v = Math.max(Math.max(r, g), b);

  // For grays, hue will be arbitrarily reported as zero. Otherwise, calculate
  let h = 0;
  let s = 0;
  if (x !== v) {
    const f = r === x ? g - b : g === x ? b - r : r - g;
    const i = r === x ? 3 : g === x ? 5 : 1;
    h = (i - f / (v - x)) * 60 % 360;
    s = (v - x) / v;
  }
  return {
    hue: h,
    saturation: s,
    value: v
  };
};

/**
 * @param {HSV} color
 * @returns {RGB}
 */
const hsvToRgb = color => {
  let h = color.hue % 360;
  if (h < 0) h += 360;
  const s = Math.max(0, Math.min(color.saturation, 1));
  const v = Math.max(0, Math.min(color.value, 1));
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));
  let r;
  let g;
  let b;
  switch (i) {
    default:
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return {
    red: Math.floor(r * 255),
    green: Math.floor(g * 255),
    blue: Math.floor(b * 255)
  };
};

/**
 * @param {string} hex
 * @returns {string}
 */
const darken = hex => {
  const rgb = hexToRgb(hex);
  const hsv = rgbToHsv(rgb);

  // don't need to clamp value; hsvToRgb will do it for us
  hsv.value -= 0.1;
  const newRgb = hsvToRgb(hsv);
  return rgbToHex(newRgb);
};

/***/ }),

/***/ "./src/packager/encode-big-string.js":
/*!*******************************************!*\
  !*** ./src/packager/encode-big-string.js ***!
  \*******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/**
 * @template T
 * @param {T[]} destination
 * @param {T[]} newItems
 */
const concatInPlace = (destination, newItems) => {
  for (const item of newItems) {
    destination.push(item);
  }
};

/**
 * @param {unknown} value String, number, Uint8Array, etc. or a recursive array of them
 * @returns {Uint8Array[]} UTF-8 arrays, in order
 */
const encodeComponent = value => {
  if (typeof value === 'string') {
    return [new TextEncoder().encode(value)];
  } else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'undefined' || value === null) {
    return [new TextEncoder().encode(String(value))];
  } else if (Array.isArray(value)) {
    const result = [];
    for (const i of value) {
      concatInPlace(result, encodeComponent(i));
    }
    return result;
  } else {
    throw new Error("Unknown value in encodeComponent: ".concat(value));
  }
};

/**
 * Tagged template function to generate encoded UTF-8 without string concatenation as Chrome cannot handle
 * strings that are longer than 0x1fffffe8 characters.
 * @param {TemplateStringsArray} strings
 * @param {unknown[]} values
 * @returns {Uint8Array}
 */
const encodeBigString = function encodeBigString(strings) {
  /** @type {Uint8Array[]} */
  const encodedChunks = [];
  for (let i = 0; i < strings.length - 1; i++) {
    concatInPlace(encodedChunks, encodeComponent(strings[i]));
    concatInPlace(encodedChunks, encodeComponent(i + 1 < 1 || arguments.length <= i + 1 ? undefined : arguments[i + 1]));
  }
  concatInPlace(encodedChunks, encodeComponent(strings[strings.length - 1]));
  let totalByteLength = 0;
  for (let i = 0; i < encodedChunks.length; i++) {
    totalByteLength += encodedChunks[i].byteLength;
  }
  const resultBuffer = new Uint8Array(totalByteLength);
  for (let i = 0, j = 0; i < encodedChunks.length; i++) {
    resultBuffer.set(encodedChunks[i], j);
    j += encodedChunks[i].byteLength;
  }
  return resultBuffer;
};
/* harmony default export */ __webpack_exports__["default"] = (encodeBigString);

/***/ }),

/***/ "./src/packager/extension-loader.js":
/*!******************************************!*\
  !*** ./src/packager/extension-loader.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, global) {// Extension Loader for 02Engine CLI
// 支持Web、Node.js和P4三种环境
// 迁移自scratch-vm的extension loader，完全独立不依赖scratch-vm

// 尝试导入Node.js环境的依赖
let JSDOM, nodeFetch;
try {
  // 动态导入，避免在浏览器环境中出错
  JSDOM = __webpack_require__(/*! jsdom */ "./node_modules/jsdom/lib/api.js").JSDOM;
  nodeFetch = __webpack_require__(/*! node-fetch */ "./node_modules/node-fetch/browser.js");
} catch (error) {
  // 在浏览器环境中这些模块可能不可用
  console.debug('Node.js modules not available, running in browser environment');
}

/**
 * 检测当前运行环境
 * @returns {string} 'browser' | 'node' | 'standalone'
 */
const detectEnvironment = () => {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // 检测是否为standalone环境
    if (false) {}
    return 'node';
  }
  return 'browser';
};

/**
 * 浏览器环境的扩展加载器
 * @param {string} extensionURL - 扩展URL
 * @returns {Promise<string>} 扩展源代码
 */
const loadExtensionBrowser = extensionURL => new Promise((resolve, reject) => {
  const script = document.createElement('script');
  script.onload = () => {
    script.remove();
    resolve(extensionURL);
  };
  script.onerror = () => {
    script.remove();
    reject(new Error("Failed to load extension: ".concat(extensionURL)));
  };
  script.src = extensionURL;
  document.head.appendChild(script);
});

/**
 * Node.js环境的扩展加载器
 * @param {string} extensionURL - 扩展URL
 * @returns {Promise<string>} 扩展源代码
 */
const loadExtensionNode = async extensionURL => {
  // 检查是否已设置全局document对象
  if (!global.document && JSDOM) {
    // 模拟浏览器环境核心对象
    const dom = new JSDOM('<!DOCTYPE html><body></body>');
    global.document = dom.window.document;
    global.window = dom.window;
    global.location = dom.window.location;
    global.fetch = nodeFetch; // 使用node-fetch替换浏览器fetch
  } else if (!global.document) {
    throw new Error('Document object not available. Running in Node.js environment requires jsdom package.');
  }
  try {
    // 用node-fetch下载扩展脚本
    const response = await fetch(extensionURL);
    if (!response.ok) {
      throw new Error("HTTP error! status: ".concat(response.status));
    }
    const scriptCode = await response.text();

    // 在模拟的window环境中执行脚本
    // 使用eval或vm.runInContext取决于安全性要求
    // 这里使用window.eval确保在正确的上下文中执行
    if (global.window && global.window.eval) {
      global.window.eval(scriptCode);
    } else {
      // 降级方案
      eval(scriptCode); // eslint-disable-line no-eval
    }
    return extensionURL;
  } catch (err) {
    throw new Error("Error loading extension ".concat(extensionURL, ": ").concat(err.message));
  }
};

/**
 * Standalone环境（Electron等）的扩展加载器
 * 继承Node环境的逻辑但可能有特殊的处理
 * @param {string} extensionURL - 扩展URL
 * @returns {Promise<string>} 扩展源代码
 */
const loadExtensionStandalone = async extensionURL => {
  // Standalone环境中，如果可以访问浏览器的fetch，则使用浏览器逻辑
  if (typeof fetch !== 'undefined' && typeof document !== 'undefined') {
    return loadExtensionBrowser(extensionURL);
  }
  // 否则降级到Node.js逻辑
  return loadExtensionNode(extensionURL);
};

/**
 * 自动检测环境并选择合适的加载方法
 * Load an extension from an arbitrary URL.
 * @param {string} extensionURL
 * @returns {Promise<string>} Resolves with extension URL if loaded successfully.
 */
const loadExtension = extensionURL => {
  const environment = detectEnvironment();
  switch (environment) {
    case 'browser':
      return loadExtensionBrowser(extensionURL);
    case 'node':
      return loadExtensionNode(extensionURL);
    case 'standalone':
      return loadExtensionStandalone(extensionURL);
    default:
      throw new Error("Unsupported environment: ".concat(environment));
  }
};

/**
 * 获取扩展源代码（用于打包到项目中）
 * @param {string} extensionURL
 * @returns {Promise<string>} 扩展源代码文本
 */
const fetchExtensionSource = async extensionURL => {
  const environment = detectEnvironment();
  if (environment === 'browser' || environment === 'standalone') {
    // 浏览器和standalone环境优先使用原生fetch
    if (typeof fetch !== 'undefined') {
      const response = await fetch(extensionURL);
      if (!response.ok) {
        throw new Error("HTTP error! status: ".concat(response.status));
      }
      return response.text();
    }
  }

  // Node.js环境或standalone环境的降级方案
  const fetchImpl = nodeFetch || global && global.fetch;
  if (!fetchImpl) {
    throw new Error('Fetch not available in this environment');
  }
  const response = await fetchImpl(extensionURL);
  if (!response.ok) {
    throw new Error("HTTP error! status: ".concat(response.status));
  }
  return response.text();
};

/**
 * 包装扩展源代码，使其在非沙盒环境中更安全
 * @param {string} source - 扩展源代码
 * @returns {string} 包装后的源代码
 */
const wrapExtensionSource = source => {
  // Wrap the extension in an IIFE so that extensions written for the sandbox are less
  // likely to cause issues in an unsandboxed environment due to global pollution or
  // overriding Scratch.*
  return "(function(Scratch) { ".concat(source, " })(Scratch);");
};
module.exports = {
  loadExtension,
  fetchExtensionSource,
  wrapExtensionSource,
  detectEnvironment,
  loadExtensionBrowser,
  loadExtensionNode,
  loadExtensionStandalone
};
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../node_modules/process/browser.js */ "./node_modules/process/browser.js"), __webpack_require__(/*! ./../../node_modules/webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./src/packager/icns.js":
/*!******************************!*\
  !*** ./src/packager/icns.js ***!
  \******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _common_readers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../common/readers */ "./src/common/readers.js");

const loadImage = src => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("Could not load image: ".concat(src)));
  image.src = src;
});
const canvasToBlob = canvas => new Promise((resolve, reject) => {
  canvas.toBlob(blob => {
    if (blob) {
      resolve(blob);
    } else {
      reject(new Error('Could not read <canvas> as blob'));
    }
  });
});
const pngToAppleICNS = async pngData => {
  const {
    Icns,
    Buffer
  } = await Promise.all(/*! import() | icns */[__webpack_require__.e("vendors~icns~scratch-vm-compiler~sha256"), __webpack_require__.e("vendors~icns~scratch-vm-compiler"), __webpack_require__.e("icns")]).then(__webpack_require__.bind(null, /*! ./icns-bundle */ "./src/packager/icns-bundle.js"));
  const FORMATS = [{
    type: 'ic04',
    size: 16
  }, {
    type: 'ic07',
    size: 128
  }, {
    type: 'ic08',
    size: 256
  }, {
    type: 'ic09',
    size: 512
  }, {
    type: 'ic10',
    size: 1024
  }, {
    type: 'ic11',
    size: 32
  }, {
    type: 'ic12',
    size: 64
  }, {
    type: 'ic13',
    size: 256
  }, {
    type: 'ic14',
    size: 512
  }];

  // Read the Image.
  const pngDataBlob = new Blob([pngData], {
    type: 'image/png'
  });
  const url = URL.createObjectURL(pngDataBlob);
  const image = await loadImage(url);

  // Determine the formats to create
  const eligibleFormats = FORMATS.filter(format => {
    // Always include the smallest size so that tiny images will get at least 1 image.
    if (format.size === 16) {
      return true;
    }
    return image.width >= format.size && image.height >= format.size;
  });

  // Create a single canvas to be used for conversion
  // Creating many canvases is prone to error in Safari
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('cannot get canvas rendering context');
  }
  const icns = new Icns.Icns();
  for (const format of eligibleFormats) {
    // Use the canvas to scale the image.
    const formatSize = format.size;
    canvas.width = formatSize;
    canvas.height = formatSize;
    ctx.drawImage(image, 0, 0, formatSize, formatSize);
    const blob = await canvasToBlob(canvas);
    const arrayBuffer = await Object(_common_readers__WEBPACK_IMPORTED_MODULE_0__["readAsArrayBuffer"])(blob);
    const icnsImage = await Icns.IcnsImage.fromPNG(Buffer.from(arrayBuffer), format.type);
    icns.append(icnsImage);
  }
  return icns.data;
};
/* harmony default export */ __webpack_exports__["default"] = (pngToAppleICNS);

/***/ }),

/***/ "./src/packager/images/default-icon.png":
/*!**********************************************!*\
  !*** ./src/packager/images/default-icon.png ***!
  \**********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = (__webpack_require__.p + "assets/default-icon.290e09e569a1cab8e61ba93b0d23863f.png");

/***/ }),

/***/ "./src/packager/large-assets.js":
/*!**************************************!*\
  !*** ./src/packager/large-assets.js ***!
  \**************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
// This defines where files are fetched from when the packager needs to download files.
// Files fetched from an external server have a SHA-256 checksum used to validate the download.

// src is the URL that will be fetched to download the asset. If it's an array of URLs, each URL
// will be tried in succession if the previous one fails, perhaps because it's blocked by a school
// network filter.

// estimatedSize is used for the asset download progress bar if the server doesn't specify a
// Content-Length. It's size in bytes after decoding Content-Encoding. Real size does not need to
// match; this is just for the progress bar. estimatedSize is optional and can be omitted.
// Make sure to use size estimates from production builds, not development ones.

// useBuildId is used for various cache related things. It shouldn't be changed.

const externalFile = name => [// Hopefully one of these URLs will not be blocked.
"https://packagerdata.turbowarp.org/".concat(name), "https://blobs.turbowarp.xyz/".concat(name)];
const relativeScaffolding = name => "scaffolding/".concat(name);
/* harmony default export */ __webpack_exports__["default"] = ({
  'nwjs-win64': {
    src: externalFile('nwjs-v0.68.1-win-x64.zip'),
    sha256: '82527d29f060bad7ec041f7c0536b1376f8bad5e5584adf7e3cf7205755a106c',
    estimatedSize: 119821598
  },
  'nwjs-win32': {
    src: externalFile('nwjs-v0.68.1-win-ia32.zip'),
    sha256: '7dd3104c2726082a8acd8973af2b2b223bc97960b722ec141b9bf07d84a0281b',
    estimatedSize: 112613344
  },
  'nwjs-mac': {
    src: externalFile('nwjs-v0.68.1-osx-x64.zip'),
    sha256: '4b1356302738a45f7ee212f6ecb997eb5d31403bfc45a7dd58429c968a1f581a',
    estimatedSize: 119091132
  },
  'nwjs-linux-x64': {
    src: externalFile('nwjs-v0.68.1-linux-x64.zip'),
    sha256: '5f597add1a2b6f13592117cc955111cea8211c13b21165e29c6616f385df5b94',
    estimatedSize: 135854818
  },
  'electron-win32': {
    src: externalFile('electron-v22.3.27-win32-ia32.zip'),
    sha256: '47bd498e5513529c5e141394fc9fd610cba1dcdea9e6dbb165edf929cbfd9af2',
    estimatedSize: 90856612
  },
  'electron-win64': {
    src: externalFile('electron-v22.3.27-win32-x64.zip'),
    sha256: '1a02c0f7af9664696f790dcce05948f0458a2f4f2d48c685f911d2eb99a4c9da',
    estimatedSize: 96605498
  },
  'electron-win-arm': {
    src: externalFile('electron-v22.3.27-win32-arm64.zip'),
    sha256: '0e4ad218018c0881ef4de363107a94dd2ced40367a0e18ca7d0dde1f40da0531',
    estimatedSize: 94065344
  },
  'electron-mac': {
    src: externalFile('electron-v22.3.27-macos-universal.zip'),
    sha256: '598b35f9030fe30f81b4041be048cd0374f675bd1bc0f172c26cf2808e80a3d9',
    estimatedSize: 160882083
  },
  'electron-linux64': {
    src: externalFile('electron-v22.3.27-linux-x64.zip'),
    sha256: '631d8eb08098c48ce2b29421e74c69ac0312b1e42f445d8a805414ba1242bf3a',
    estimatedSize: 93426892
  },
  'electron-linux-arm32': {
    src: externalFile('electron-v22.3.27-linux-armv7l.zip'),
    sha256: '9f8372606e5ede83cf1c73a3d8ff07047e4e3ef614aa89a76cd497dc06cf119d',
    estimatedSize: 82722572
  },
  'electron-linux-arm64': {
    src: externalFile('electron-v22.3.27-linux-arm64.zip'),
    sha256: '60279395a5ce4eaf3c08f1e717771b203830902d3fe3a7c311bc37deb1a0e15e',
    estimatedSize: 93932512
  },
  'webview-mac': {
    src: externalFile('WebView-macos-7.zip'),
    sha256: 'fef0603a17df6dd976eb2aeb704aaec6d2666455089fbf3398becfaf5b29448b',
    estimatedSize: 3530149
  },
  'steamworks.js': {
    src: externalFile('steamworks.js-0.3.2.zip'),
    sha256: 'fd8bc80a97cd880d71113dfc5f81b124b6e212335393db73e3df168c5c546fbc',
    estimatedSize: 3279554
  },
  scaffolding: {
    src: relativeScaffolding('scaffolding-full.js'),
    estimatedSize: 4564032,
    useBuildId: true
  },
  'scaffolding-min': {
    src: relativeScaffolding('scaffolding-min.js'),
    estimatedSize: 2530463,
    useBuildId: true
  },
  addons: {
    src: relativeScaffolding('addons.js'),
    estimatedSize: 19931,
    useBuildId: true
  },
  'scratch-vm': {
    src: 'https://registry.npmjs.org/scratch-vm/-/scratch-vm-16.0.0.tgz',
    sha256: 'placeholder',
    estimatedSize: 5000000
  }
});

/***/ }),

/***/ "./src/packager/packager.js":
/*!**********************************!*\
  !*** ./src/packager/packager.js ***!
  \**********************************/
/*! exports provided: getJSZip, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* WEBPACK VAR INJECTION */(function(Buffer) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getJSZip", function() { return getJSZip; });
/* harmony import */ var _common_event_target__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../common/event-target */ "./src/common/event-target.js");
/* harmony import */ var _sha256__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./sha256 */ "./src/packager/sha256.js");
/* harmony import */ var _common_escape_xml__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../common/escape-xml */ "./src/common/escape-xml.js");
/* harmony import */ var _large_assets__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./large-assets */ "./src/packager/large-assets.js");
/* harmony import */ var _common_request__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../common/request */ "./src/common/request.js");
/* harmony import */ var _icns__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./icns */ "./src/packager/icns.js");
/* harmony import */ var _build_id__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./build-id */ "./src/packager/build-id.js");
/* harmony import */ var _base85__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./base85 */ "./src/packager/base85.js");
/* harmony import */ var _plist__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./plist */ "./src/packager/plist.js");
/* harmony import */ var _brand__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./brand */ "./src/packager/brand.js");
/* harmony import */ var _brand__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(_brand__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var _common_errors__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../common/errors */ "./src/common/errors.js");
/* harmony import */ var _colors__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./colors */ "./src/packager/colors.js");
/* harmony import */ var _adapter__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./adapter */ "./src/packager/adapter.js");
/* harmony import */ var _encode_big_string__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./encode-big-string */ "./src/packager/encode-big-string.js");
var _templateObject, _templateObject2;
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _taggedTemplateLiteral(e, t) { return t || (t = e.slice(0)), Object.freeze(Object.defineProperties(e, { raw: { value: Object.freeze(t) } })); }














function compile(code) /* The "Compilation" */
{
  // 注意：encodeURIComponent对应的解码函数应该是decodeURIComponent
  // 原函数中使用unescape是不匹配的，这里修正为正确的解码方式
  return Object(_encode_big_string__WEBPACK_IMPORTED_MODULE_13__["default"])(_templateObject || (_templateObject = _taggedTemplateLiteral(["<script>/*Generated By 02Engine Packager*/\n<!--\ndocument.write(decodeURIComponent(\"", "\"));\n//-->\n</script>"], ["<script>/*Generated By 02Engine Packager*/\\n<!--\\ndocument.write(decodeURIComponent(\"", "\"));\\n//-->\\n<\\/script>"])), encodeURIComponent(code));
}
const PROGRESS_LOADED_SCRIPTS = 0.1;

// Used by environments that fetch the entire compressed project before calling loadProject()
const PROGRESS_FETCHED_COMPRESSED = 0.75;
const PROGRESS_EXTRACTED_COMPRESSED = 0.98;

// Used by environments that pass a project.json into loadProject() and fetch assets separately
const PROGRESS_FETCHED_PROJECT_JSON = 0.2;
const PROGRESS_FETCHED_ASSETS = 0.98;
const removeUnnecessaryEmptyLines = string => string.split('\n').filter((line, index, array) => {
  if (index === 0 || index === array.length - 1) return true;
  if (line.trim().length === 0 && array[index - 1].trim().length === 0) return false;
  return true;
}).join('\n');
const OBFUSCATED_FACTORY_RESULT_NAME = '__o2_factory_out__';
const makeAnonymousCompiledFactorySource = source => source.replace(/^\s*(async\s+)?function\s+[^(]+\s*\(/, function (match) {
  let asyncKeyword = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  return "".concat(asyncKeyword, "function(");
});
const wrapCompiledFactorySourceForObfuscation = source => "(()=>{const ".concat(OBFUSCATED_FACTORY_RESULT_NAME, "=").concat(makeAnonymousCompiledFactorySource(source), ";return ").concat(OBFUSCATED_FACTORY_RESULT_NAME, ";})()");
const stringifyCompiledFactoryEval = source => "eval(".concat(JSON.stringify(source), ")");
const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));
const getCompiledProjectObfuscationOptions = level => {
  switch (level) {
    case 'light':
      return {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        debugProtection: false,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        numbersToExpressions: false,
        renameGlobals: false,
        selfDefending: false,
        simplify: true,
        splitStrings: false,
        stringArray: true,
        stringArrayCallsTransform: false,
        stringArrayEncoding: [],
        stringArrayIndexesType: ['hexadecimal-number'],
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 1,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 0.75,
        target: 'browser',
        transformObjectKeys: false,
        unicodeEscapeSequence: false
      };
    case 'strong':
      return {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.3,
        deadCodeInjection: false,
        debugProtection: false,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 6,
        stringArray: true,
        stringArrayCallsTransform: false,
        stringArrayEncoding: ['rc4'],
        stringArrayIndexesType: ['hexadecimal-number'],
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 1,
        target: 'browser',
        transformObjectKeys: false,
        unicodeEscapeSequence: false
      };
    case 'balanced':
    default:
      return {
        compact: true,
        controlFlowFlattening: false,
        deadCodeInjection: false,
        debugProtection: false,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: false,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 8,
        stringArray: true,
        stringArrayCallsTransform: false,
        stringArrayEncoding: ['base64'],
        stringArrayIndexesType: ['hexadecimal-number'],
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 1,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 1,
        target: 'browser',
        transformObjectKeys: false,
        unicodeEscapeSequence: false
      };
  }
};
let javaScriptObfuscatorPromise = null;
const loadJavaScriptObfuscatorBrowserBundle = () => {
  if (javaScriptObfuscatorPromise) {
    return javaScriptObfuscatorPromise;
  }
  javaScriptObfuscatorPromise = async () => {
    const globalObject = typeof globalThis !== 'undefined' ? globalThis : window;
    if (globalObject.JavaScriptObfuscator && typeof globalObject.JavaScriptObfuscator.obfuscate === 'function') {
      return globalObject.JavaScriptObfuscator;
    }
    const browserBundleModule = await __webpack_require__.e(/*! import() | javascript-obfuscator-browser */ "javascript-obfuscator-browser").then(__webpack_require__.t.bind(null, /*! javascript-obfuscator */ "./node_modules/javascript-obfuscator/dist/index.browser.js", 7));
    const JavaScriptObfuscator = browserBundleModule.default || browserBundleModule.JavaScriptObfuscator || browserBundleModule;
    if (JavaScriptObfuscator && typeof JavaScriptObfuscator.obfuscate === 'function') {
      return JavaScriptObfuscator;
    }
    throw new Error('Failed to initialize javascript-obfuscator module');
  };
  return javaScriptObfuscatorPromise;
};
const getJSZip = async () => (await __webpack_require__.e(/*! import() | jszip */ "vendors~jszip~scratch-vm-compiler").then(__webpack_require__.t.bind(null, /*! @turbowarp/jszip */ "./node_modules/@turbowarp/jszip/dist/jszip.min.js", 7))).default;
const setFileFast = (zip, path, data) => {
  zip.files[path] = data;
};
const SELF_LICENSE = {
  title: _brand__WEBPACK_IMPORTED_MODULE_9__["APP_NAME"],
  homepage: _brand__WEBPACK_IMPORTED_MODULE_9__["WEBSITE"],
  license: _brand__WEBPACK_IMPORTED_MODULE_9__["COPYRIGHT_NOTICE"]
};
const SCRATCH_LICENSE = {
  title: 'Scratch',
  homepage: 'https://scratch.mit.edu/',
  license: "Copyright (c) 2016, Massachusetts Institute of Technology\nAll rights reserved.\n\nRedistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\n\n1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.\n\n2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.\n\n3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE."
};
const ELECTRON_LICENSE = {
  title: 'Electron',
  homepage: 'https://www.electronjs.org/',
  license: "Copyright (c) Electron contributors\nCopyright (c) 2013-2020 GitHub Inc.\n\nPermission is hereby granted, free of charge, to any person obtaining\na copy of this software and associated documentation files (the\n\"Software\"), to deal in the Software without restriction, including\nwithout limitation the rights to use, copy, modify, merge, publish,\ndistribute, sublicense, and/or sell copies of the Software, and to\npermit persons to whom the Software is furnished to do so, subject to\nthe following conditions:\n\nThe above copyright notice and this permission notice shall be\nincluded in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,\nEXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\nMERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND\nNONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE\nLIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION\nOF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\nWITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE."
};
const COPYRIGHT_HEADER = "/*!\nParts of this script are from the ".concat(_brand__WEBPACK_IMPORTED_MODULE_9__["APP_NAME"], " <").concat(_brand__WEBPACK_IMPORTED_MODULE_9__["WEBSITE"], ">, licensed as follows:\n").concat(SELF_LICENSE.license, "\n\nParts of this script are from Scratch <https://scratch.mit.edu/>, licensed as follows:\n").concat(SCRATCH_LICENSE.license, "\n*/\n");
const generateChromiumLicenseHTML = licenses => {
  const style = "<style>body { font-family: sans-serif; }</style>";
  const pretext = "<h2>The following entries were added by the ".concat(_brand__WEBPACK_IMPORTED_MODULE_9__["APP_NAME"], "</h2>");
  const convertedLicenses = licenses.map((_ref, index) => {
    let {
      title,
      license,
      homepage
    } = _ref;
    return "\n<div class=\"product\">\n<span class=\"title\">".concat(Object(_common_escape_xml__WEBPACK_IMPORTED_MODULE_2__["default"])(title), "</span>\n<span class=\"homepage\"><a href=\"").concat(Object(_common_escape_xml__WEBPACK_IMPORTED_MODULE_2__["default"])(homepage), "\">homepage</a></span>\n<input type=\"checkbox\" hidden id=\"p4-").concat(index, "\">\n<label class=\"show\" for=\"p4-").concat(index, "\" tabindex=\"0\"></label>\n<div class=\"licence\">\n<pre>").concat(Object(_common_escape_xml__WEBPACK_IMPORTED_MODULE_2__["default"])(license), "</pre>\n</div>\n</div>\n");
  });
  return "".concat(style).concat(pretext).concat(convertedLicenses.join('\n'));
};

// Unique identifier for the app. If this changes, things like local cloud variables will be lost.
// This should be in reverse-DNS format.
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleidentifier
const CFBundleIdentifier = 'CFBundleIdentifier';
// Even if you fork the packager, you shouldn't change this string unless you want packaged macOS apps
// to lose all their data.
const bundleIdentifierPrefix = 'org.turbowarp.packager.userland.';

// CFBundleName is displayed in the menu bar.
// I'm not actually sure where CFBundleDisplayName is displayed.
// Documentation says that CFBundleName is only supposed to be 15 characters and that CFBundleDisplayName
// should be used for longer names, but in reality CFBundleName seems to not have a length limit.
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundlename
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundledisplayname
const CFBundleName = 'CFBundleName';
const CFBundleDisplayName = 'CFBundleDisplayName';

// The name of the executable in the .app/Contents/MacOS folder
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleexecutable
const CFBundleExecutable = 'CFBundleExecutable';

// macOS's "About" screen will display: "Version {CFBundleShortVersionString} ({CFBundleVersion})"
// Apple's own apps are inconsistent about what they display here. Some apps set both of these to the same thing
// so you see eg. "Version 15.0 (15.0)" while others set CFBundleShortVersionString to a semver-like and
// treat CFBundleVersion as a simple build number eg. "Version 1.4.0 (876)"
// Apple's documentation says both of these are supposed to be major.minor.patch, but in reality it doesn't
// even have to contain numbers and everything seems to work fine.
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleversion
// https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleshortversionstring
const CFBundleVersion = 'CFBundleVersion';
const CFBundleShortVersionString = 'CFBundleShortVersionString';

// Describes the category of the app
// https://developer.apple.com/documentation/bundleresources/information_property_list/lsapplicationcategorytype
const LSApplicationCategoryType = 'LSApplicationCategoryType';
const generateMacReadme = options => "Due to macOS restrictions, running this app requires a few manual steps.\n\nTo run the app on macOS 15 and later:\n1) Double click on the app file (".concat(options.app.packageName, " in the same folder as this document), then press \"Done\" when the warning appears\n2) Open macOS System Settings\n3) Go to the \"Privacy & Security\" section\n4) Scroll to the bottom\n5) By \"").concat(options.app.packageName, " was blocked to protect your Mac\", press \"Open Anyway\"\n6) In the prompt that appears, press \"Open Anyway\"\n\nTo run the app on macOS 14 and earlier:\n1) Control+click on the app file (").concat(options.app.packageName, " in the same folder as this document) and select \"Open\".\n2) If a warning appears, select \"Open\" if it's an option.\n3) If a warning appears but \"Open\" isn't an option, press \"Cancel\" and repeat from step 1.\n   The open button will appear the second time the warning appears.\n\nAfter completing these steps, the app should run without any further warnings.\n\nFeel free to drag the app into your Applications folder.\n");

/**
 * @param {string} packageName
 */
const validatePackageName = packageName => {
  // Characters considered unsafe filenames on Windows
  const BLOCKLIST = ['/', '\\', ':', '*', '?', '<', '>', '|'];
  if (BLOCKLIST.some(i => packageName.includes(i))) {
    throw new Error("Invalid package name: ".concat(packageName, ". It must not use the characters: ").concat(BLOCKLIST.join(' ')));
  }
};
class Packager extends _common_event_target__WEBPACK_IMPORTED_MODULE_0__["EventTarget"] {
  constructor() {
    super();
    this.project = null;
    this.options = Packager.DEFAULT_OPTIONS();
    this.aborted = false;
    this.used = false;
    this._projectArchivePromise = null;
    this._projectJSONPromise = null;
    this._compiledProjectPromise = null;
    this._compiledProjectArchivePromise = null;
  }
  abort() {
    if (!this.aborted) {
      this.aborted = true;
      this.dispatchEvent(new Event('abort'));
    }
  }
  ensureNotAborted() {
    if (this.aborted) {
      throw new Error('Aborted');
    }
  }
  async fetchLargeAsset(name, type) {
    this.ensureNotAborted();
    const asset = _large_assets__WEBPACK_IMPORTED_MODULE_3__["default"][name];
    if (!asset) {
      throw new Error("Invalid asset: ".concat(name));
    }
    if (typeof __ASSETS__ !== 'undefined' && __ASSETS__[asset.src]) {
      return __ASSETS__[asset.src];
    }
    const dispatchProgress = progress => this.dispatchEvent(new _common_event_target__WEBPACK_IMPORTED_MODULE_0__["CustomEvent"]('large-asset-fetch', {
      detail: {
        asset: name,
        progress
      }
    }));
    dispatchProgress(0);
    let result;
    let cameFromCache = false;
    try {
      const cached = await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].getCachedAsset(asset);
      if (cached) {
        result = cached;
        cameFromCache = true;
        dispatchProgress(0.5);
      }
    } catch (e) {
      console.warn(e);
    }
    if (!result) {
      let url = asset.src;
      if (asset.useBuildId) {
        url += "?".concat(_build_id__WEBPACK_IMPORTED_MODULE_6__["buildId"]);
      }
      result = await Object(_common_request__WEBPACK_IMPORTED_MODULE_4__["default"])({
        url,
        type,
        estimatedSize: asset.estimatedSize,
        progressCallback: progress => {
          dispatchProgress(progress);
        },
        abortTarget: this
      });
    }
    if (asset.useBuildId && !Object(_build_id__WEBPACK_IMPORTED_MODULE_6__["verifyBuildId"])(_build_id__WEBPACK_IMPORTED_MODULE_6__["buildId"], result)) {
      throw new _common_errors__WEBPACK_IMPORTED_MODULE_10__["OutdatedPackagerError"]('Build ID does not match.');
    }
    if (asset.sha256) {
      const hash = await Object(_sha256__WEBPACK_IMPORTED_MODULE_1__["default"])(result);
      if (hash !== asset.sha256) {
        throw new Error("Hash mismatch for ".concat(name, ", found ").concat(hash, " but expected ").concat(asset.sha256));
      }
    }
    if (!cameFromCache) {
      try {
        await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].cacheAsset(asset, result);
      } catch (e) {
        console.warn(e);
      }
    }
    dispatchProgress(1);
    return result;
  }
  getAddonOptions() {
    return _objectSpread(_objectSpread({}, this.options.chunks), {}, {
      specialCloudBehaviors: this.options.cloudVariables.specialCloudBehaviors,
      unsafeCloudBehaviors: this.options.cloudVariables.unsafeCloudBehaviors,
      pause: this.options.controls.pause.enabled
    });
  }
  async loadResources() {
    const texts = [COPYRIGHT_HEADER];
    if (this.project.analysis.usesMusic) {
      texts.push(await this.fetchLargeAsset('scaffolding', 'text'));
    } else {
      texts.push(await this.fetchLargeAsset('scaffolding-min', 'text'));
    }
    if (Object.values(this.getAddonOptions()).some(i => i)) {
      texts.push(await this.fetchLargeAsset('addons', 'text'));
    }
    this.script = texts.join('\n').replace(/<\/script>/g, "</scri'+'pt>");
  }
  computeWindowSize() {
    let width = this.options.stageWidth;
    let height = this.options.stageHeight;
    if (this.options.controls.greenFlag.enabled || this.options.controls.stopAll.enabled || this.options.controls.pause.enabled) {
      height += 48;
    }
    return {
      width,
      height
    };
  }
  getPlistPropertiesForPrimaryExecutable() {
    return {
      [CFBundleIdentifier]: "".concat(bundleIdentifierPrefix).concat(this.options.app.packageName),
      // For simplicity, we'll set these to the same thing
      [CFBundleName]: this.options.app.windowTitle,
      [CFBundleDisplayName]: this.options.app.windowTitle,
      // We do rename the executable
      [CFBundleExecutable]: this.options.app.packageName,
      // For simplicity, we'll set these to the same thing
      [CFBundleVersion]: this.options.app.version,
      [CFBundleShortVersionString]: this.options.app.version,
      // Most items generated by the packager are games
      [LSApplicationCategoryType]: 'public.app-category.games'
    };
  }
  async updatePlist(zip, name, newProperties) {
    const contents = await zip.file(name).async('string');
    const plist = Object(_plist__WEBPACK_IMPORTED_MODULE_8__["parsePlist"])(contents);
    Object.assign(plist, newProperties);
    zip.file(name, Object(_plist__WEBPACK_IMPORTED_MODULE_8__["generatePlist"])(plist));
  }
  async addNwJS(projectZip) {
    const packageName = this.options.app.packageName;
    validatePackageName(packageName);
    const nwjsBuffer = await this.fetchLargeAsset(this.options.target, 'arraybuffer');
    const nwjsZip = await (await getJSZip()).loadAsync(nwjsBuffer);
    const isWindows = this.options.target.startsWith('nwjs-win');
    const isMac = this.options.target === 'nwjs-mac';
    const isLinux = this.options.target.startsWith('nwjs-linux');

    // NW.js Windows folder structure:
    // * (root)
    // +-- nwjs-v0.49.0-win-x64
    //   +-- nw.exe (executable)
    //   +-- credits.html
    //   +-- (project data)
    //   +-- ...

    // NW.js macOS folder structure:
    // * (root)
    // +-- nwjs-v0.49.0-osx-64
    //   +-- credits.html
    //   +-- nwjs.app
    //     +-- Contents
    //       +-- Resources
    //         +-- app.icns (icon)
    //         +-- app.nw
    //           +-- (project data)
    //       +-- MacOS
    //         +-- nwjs (executable)
    //       +-- ...

    // the first folder, something like "nwjs-v0.49.0-win-64"
    const nwjsPrefix = Object.keys(nwjsZip.files)[0].split('/')[0];
    const zip = new (await getJSZip())();

    // Copy NW.js files to the right place
    for (const path of Object.keys(nwjsZip.files)) {
      const file = nwjsZip.files[path];
      let newPath = path.replace(nwjsPrefix, packageName);
      if (isWindows) {
        newPath = newPath.replace('nw.exe', "".concat(packageName, ".exe"));
      } else if (isMac) {
        newPath = newPath.replace('nwjs.app', "".concat(packageName, ".app"));
      } else if (isLinux) {
        newPath = newPath.replace(/nw$/, packageName);
      }
      setFileFast(zip, newPath, file);
    }
    const ICON_NAME = 'icon.png';
    const icon = await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].getAppIcon(this.options.app.icon);
    const manifest = {
      name: packageName,
      main: 'main.js',
      version: this.options.app.version,
      window: {
        width: this.computeWindowSize().width,
        height: this.computeWindowSize().height,
        icon: ICON_NAME
      }
    };
    let dataPrefix;
    if (isWindows) {
      dataPrefix = "".concat(packageName, "/");
    } else if (isMac) {
      zip.file("".concat(packageName, "/How to run ").concat(packageName, ".txt"), generateMacReadme(this.options));
      const icnsData = await Object(_icns__WEBPACK_IMPORTED_MODULE_5__["default"])(icon);
      zip.file("".concat(packageName, "/").concat(packageName, ".app/Contents/Resources/app.icns"), icnsData);
      dataPrefix = "".concat(packageName, "/").concat(packageName, ".app/Contents/Resources/app.nw/");
    } else if (isLinux) {
      const startScript = "#!/bin/bash\ncd \"$(dirname \"$0\")\"\n./".concat(packageName);
      zip.file("".concat(packageName, "/start.sh"), startScript, {
        unixPermissions: 0o100755
      });
      dataPrefix = "".concat(packageName, "/");
    }

    // Copy project files and extra NW.js files to the right place
    for (const path of Object.keys(projectZip.files)) {
      setFileFast(zip, dataPrefix + path, projectZip.files[path]);
    }
    zip.file(dataPrefix + ICON_NAME, icon);
    zip.file(dataPrefix + 'package.json', JSON.stringify(manifest, null, 4));
    zip.file(dataPrefix + 'main.js', "\n    const start = () => nw.Window.open('index.html', {\n      position: 'center',\n      new_instance: true\n    });\n    nw.App.on('open', start);\n    start();");
    const creditsHtmlPath = "".concat(packageName, "/credits.html");
    const creditsHtml = await zip.file(creditsHtmlPath).async('string');
    zip.file(creditsHtmlPath, creditsHtml + generateChromiumLicenseHTML([SELF_LICENSE, SCRATCH_LICENSE]));
    return zip;
  }
  async addElectron(projectZip) {
    const packageName = this.options.app.packageName;
    validatePackageName(packageName);
    const buffer = await this.fetchLargeAsset(this.options.target, 'arraybuffer');
    const electronZip = await (await getJSZip()).loadAsync(buffer);
    const isWindows = this.options.target.includes('win');
    const isMac = this.options.target.includes('mac');
    const isLinux = this.options.target.includes('linux');

    // See https://www.electronjs.org/docs/latest/tutorial/application-distribution#manual-distribution

    // Electron Windows/Linux folder structure:
    // * (root)
    // +-- electron.exe (executable)
    // +-- resources
    //    +-- default_app.asar (we will delete this)
    //    +-- app (we will create this)
    //      +-- index.html and the other project files (we will create this)
    // +-- LICENSES.chromium.html and everything else

    // Electron macOS folder structure:
    // * (root)
    // +-- Electron.app
    //    +-- Contents
    //      +-- Info.plist (we must update)
    //      +-- MacOS
    //        +-- Electron (executable)
    //      +-- Frameworks
    //        +-- Electron Helper.app
    //          +-- Contents
    //            +-- Info.plist (we must update)
    //        +-- Electron Helper (GPU).app
    //          +-- Contents
    //            +-- Info.plist (we must update)
    //        +-- Electron Helper (Renderer).app
    //          +-- Contents
    //            +-- Info.plist (we must update)
    //        +-- Electron Helper (Plugin).app
    //          +-- Contents
    //            +-- Info.plist (we must update)
    //        +-- and several other helpers which we won't touch
    //      +-- Resources
    //        +-- default_app.asar (we will delete this)
    //        +-- electron.icns (we will update this)
    //        +-- app (we will create this)
    //          +-- index.html and the other project files (we will create this)
    // +-- LICENSES.chromium.html and other license files

    const zip = new (await getJSZip())();
    for (const path of Object.keys(electronZip.files)) {
      const file = electronZip.files[path];

      // On Windows and Linux, make an inner folder inside the zip. Zip extraction tools will sometimes make
      // a mess if you don't make an inner folder.
      // On macOS, the .app is already itself a folder already and macOS will always make a folder for the
      // extracted files if there's multiple files at the root.
      let newPath;
      if (isMac) {
        newPath = path;
      } else {
        newPath = "".concat(packageName, "/").concat(path);
      }
      if (isWindows) {
        newPath = newPath.replace('electron.exe', "".concat(packageName, ".exe"));
      } else if (isMac) {
        newPath = newPath.replace('Electron.app', "".concat(packageName, ".app"));
        newPath = newPath.replace(/Electron$/, packageName);
      } else if (isLinux) {
        newPath = newPath.replace(/electron$/, packageName);
      }
      setFileFast(zip, newPath, file);
    }
    const rootPrefix = isMac ? '' : "".concat(packageName, "/");
    const creditsHtml = await zip.file("".concat(rootPrefix, "LICENSES.chromium.html")).async('string');
    zip.file("".concat(rootPrefix, "licenses.html"), creditsHtml + generateChromiumLicenseHTML([SELF_LICENSE, SCRATCH_LICENSE, ELECTRON_LICENSE]));
    zip.remove("".concat(rootPrefix, "LICENSE.txt"));
    zip.remove("".concat(rootPrefix, "LICENSES.chromium.html"));
    zip.remove("".concat(rootPrefix, "LICENSE"));
    zip.remove("".concat(rootPrefix, "version"));
    zip.remove("".concat(rootPrefix, "resources/default_app.asar"));
    const contentsPrefix = isMac ? "".concat(rootPrefix).concat(packageName, ".app/Contents/") : rootPrefix;
    const resourcesPrefix = isMac ? "".concat(contentsPrefix, "Resources/app/") : "".concat(contentsPrefix, "resources/app/");
    const electronMainName = 'electron-main.js';
    const electronPreloadName = 'electron-preload.js';
    const iconName = 'icon.png';
    const icon = await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].getAppIcon(this.options.app.icon);
    zip.file("".concat(resourcesPrefix).concat(iconName), icon);
    const manifest = {
      name: packageName,
      main: electronMainName,
      version: this.options.app.version
    };
    zip.file("".concat(resourcesPrefix, "package.json"), JSON.stringify(manifest, null, 4));
    let mainJS = "'use strict';\nconst {app, BrowserWindow, Menu, shell, screen, dialog, ipcMain} = require('electron');\nconst path = require('path');\n\nconst isWindows = process.platform === 'win32';\nconst isMac = process.platform === 'darwin';\nconst isLinux = process.platform === 'linux';\n\nif (isMac) {\n  Menu.setApplicationMenu(Menu.buildFromTemplate([\n    { role: 'appMenu' },\n    { role: 'fileMenu' },\n    { role: 'editMenu' },\n    { role: 'windowMenu' },\n    { role: 'help' }\n  ]));\n} else {\n  Menu.setApplicationMenu(null);\n}\n\nconst resourcesURL = Object.assign(new URL('file://'), {\n  pathname: path.join(__dirname, '/')\n}).href;\nconst defaultProjectURL = new URL('./index.html', resourcesURL).href;\n\nconst createWindow = (windowOptions) => {\n  const options = {\n    title: ".concat(JSON.stringify(this.options.app.windowTitle), ",\n    icon: path.resolve(__dirname, ").concat(JSON.stringify(iconName), "),\n    useContentSize: true,\n    webPreferences: {\n      sandbox: true,\n      contextIsolation: true,\n      nodeIntegration: false,\n      preload: path.resolve(__dirname, ").concat(JSON.stringify(electronPreloadName), "),\n    },\n    frame: ").concat(this.options.app.windowControls !== 'frameless', ",\n    show: true,\n    width: ").concat(this.options.stageWidth, ",\n    height: ").concat(this.options.stageHeight, ",\n    ...windowOptions,\n  };\n\n  const activeScreen = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());\n  const bounds = activeScreen.workArea;\n  options.x = bounds.x + ((bounds.width - options.width) / 2);\n  options.y = bounds.y + ((bounds.height - options.height) / 2);\n\n  const window = new BrowserWindow(options);\n  return window;\n};\n\nconst createProjectWindow = (url) => {\n  const windowMode = ").concat(JSON.stringify(this.options.app.windowMode), ";\n  const options = {\n    show: false,\n    backgroundColor: ").concat(JSON.stringify(this.options.appearance.background), ",\n    width: ").concat(this.computeWindowSize().width, ",\n    height: ").concat(this.computeWindowSize().height, ",\n    minWidth: 50,\n    minHeight: 50,\n  };\n  // fullscreen === false disables fullscreen on macOS so only set this property when it's true\n  if (windowMode === 'fullscreen') {\n    options.fullscreen = true;\n  }\n  const window = createWindow(options);\n  if (windowMode === 'maximize') {\n    window.maximize();\n  }\n  window.loadURL(url);\n  window.show();\n};\n\nconst createDataWindow = (dataURI) => {\n  const window = createWindow({});\n  window.loadURL(dataURI);\n};\n\nconst isResourceURL = (url) => {\n  try {\n    const parsedUrl = new URL(url);\n    return parsedUrl.protocol === 'file:' && parsedUrl.href.startsWith(resourcesURL);\n  } catch (e) {\n    // ignore\n  }\n  return false;\n};\n\nconst SAFE_PROTOCOLS = [\n  'https:',\n  'http:',\n  'mailto:',\n];\n\nconst isSafeOpenExternal = (url) => {\n  try {\n    const parsedUrl = new URL(url);\n    return SAFE_PROTOCOLS.includes(parsedUrl.protocol);\n  } catch (e) {\n    // ignore\n  }\n  return false;\n};\n\nconst isDataURL = (url) => {\n  try {\n    const parsedUrl = new URL(url);\n    return parsedUrl.protocol === 'data:';\n  } catch (e) {\n    // ignore\n  }\n  return false;\n};\n\nconst openLink = (url) => {\n  if (isDataURL(url)) {\n    createDataWindow(url);\n  } else if (isResourceURL(url)) {\n    createProjectWindow(url);\n  } else if (isSafeOpenExternal(url)) {\n    shell.openExternal(url);\n  }\n};\n\nconst createProcessCrashMessage = (details) => {\n  let message = details.type ? details.type + ' child process' : 'Renderer process';\n  message += ' crashed: ' + details.reason + ' (' + details.exitCode + ')\\n\\n';\n  if (process.arch === 'ia32') {\n    message += 'Usually this means the project was too big for the 32-bit Electron environment or your computer is out of memory. Ask the creator to use the 64-bit environment instead.';\n  } else {\n    message += 'Usually this means your computer is out of memory.';\n  }\n  return message;\n};\n\napp.on('render-process-gone', (event, webContents, details) => {\n  const window = BrowserWindow.fromWebContents(webContents);\n  dialog.showMessageBoxSync(window, {\n    type: 'error',\n    title: 'Error',\n    message: createProcessCrashMessage(details)\n  });\n});\n\napp.on('child-process-gone', (event, details) => {\n  dialog.showMessageBoxSync({\n    type: 'error',\n    title: 'Error',\n    message: createProcessCrashMessage(details)\n  });\n});\n\napp.on('web-contents-created', (event, contents) => {\n  contents.setWindowOpenHandler((details) => {\n    setImmediate(() => {\n      openLink(details.url);\n    });\n    return {action: 'deny'};\n  });\n  contents.on('will-navigate', (e, url) => {\n    if (!isResourceURL(url)) {\n      e.preventDefault();\n      openLink(url);\n    }\n  });\n  contents.on('before-input-event', (e, input) => {\n    const window = BrowserWindow.fromWebContents(contents);\n    if (!window || input.type !== \"keyDown\") return;\n    if (input.key === 'F11' || (input.key === 'Enter' && input.alt)) {\n      window.setFullScreen(!window.isFullScreen());\n    } else if (input.key === 'Escape') {\n      const behavior = ").concat(JSON.stringify(this.options.app.escapeBehavior), ";\n      if (window.isFullScreen() && (behavior === 'unfullscreen-only' || behavior === 'unfullscreen-or-exit')) {\n        window.setFullScreen(false);\n      } else if (behavior === 'unfullscreen-or-exit' || behavior === 'exit-only') {\n        window.close();\n      }\n    }\n  });\n});\n\napp.on('session-created', (session) => {\n  session.webRequest.onBeforeRequest({\n    urls: [\"file://*\"]\n  }, (details, callback) => {\n    callback({\n      cancel: !details.url.startsWith(resourcesURL)\n    });\n  });\n});\n\napp.on('window-all-closed', () => {\n  app.quit();\n});\n\napp.whenReady().then(() => {\n  createProjectWindow(defaultProjectURL);\n});\n");
    let preloadJS = "'use strict';\nconst {contextBridge, ipcRenderer} = require('electron');\n";
    if (this.project.analysis.usesSteamworks && ['electron-win64', 'electron-linux64', 'electron-mac'].includes(this.options.target)) {
      mainJS += "\n      const enableSteamworks = () => {\n        const APP_ID = +".concat(JSON.stringify(this.options.steamworks.appId), ";\n        const steamworks = require('./steamworks.js/');\n\n        const client = steamworks.init(APP_ID);\n\n        const async = (event, callback) => ipcMain.handle(event, (e, ...args) => {\n          return callback(...args);\n        });\n        const sync = (event, callback) => ipcMain.on(event, (e, ...args) => {\n          e.returnValue = callback(...args);\n        });\n\n        async('Steamworks.achievement.activate', (achievement) => client.achievement.activate(achievement));\n        async('Steamworks.achievement.clear', (achievement) => client.achievement.clear(achievement));\n        sync('Steamworks.achievement.isActivated', (achievement) => client.achievement.isActivated(achievement));\n        sync('Steamworks.apps.isDlcInstalled', (dlc) => client.apps.isDlcInstalled(dlc));\n        sync('Steamworks.localplayer.getName', () => client.localplayer.getName());\n        sync('Steamworks.localplayer.getLevel', () => client.localplayer.getLevel());\n        sync('Steamworks.localplayer.getIpCountry', () => client.localplayer.getIpCountry());\n        sync('Steamworks.localplayer.getSteamId', () => client.localplayer.getSteamId());\n        async('Steamworks.overlay.activateToWebPage', (url) => client.overlay.activateToWebPage(url));\n\n        steamworks.electronEnableSteamOverlay();\n        sync('Steamworks.ok', () => true);\n      };\n\n      try {\n        enableSteamworks();\n      } catch (e) {\n        console.error(e);\n        ipcMain.on('Steamworks.ok', (e) => {\n          e.returnValue = false;\n        });\n        app.whenReady().then(() => {\n          const ON_ERROR = ").concat(JSON.stringify(this.options.steamworks.onError), ";\n          const window = BrowserWindow.getAllWindows()[0];\n          if (ON_ERROR === 'warning') {\n            dialog.showMessageBox(window, {\n              type: 'error',\n              message: 'Error initializing Steamworks: ' + e,\n            });\n          } else if (ON_ERROR === 'error') {\n            dialog.showMessageBoxSync(window, {\n              type: 'error',\n              message: 'Error initializing Steamworks: ' + e,\n            });\n            app.quit();\n          }\n        });\n      }");
      preloadJS += "\n      const enableSteamworks = () => {\n        const sync = (event) => (...args) => ipcRenderer.sendSync(event, ...args);\n        const async = (event) => (...args) => ipcRenderer.invoke(event, ...args);\n\n        contextBridge.exposeInMainWorld('Steamworks', {\n          ok: sync('Steamworks.ok'),\n          achievement: {\n            activate: async('Steamworks.achievement.activate'),\n            clear: async('Steamworks.achievement.clear'),\n            isActivated: sync('Steamworks.achievement.isActivated'),\n          },\n          apps: {\n            isDlcInstalled: sync('Steamworks.apps.isDlcInstalled'),\n          },\n          leaderboard: {\n            uploadScore: async('Steamworks.leaderboard.uploadScore'),\n          },\n          localplayer: {\n            getName: sync('Steamworks.localplayer.getName'),\n            getLevel: sync('Steamworks.localplayer.getLevel'),\n            getIpCountry: sync('Steamworks.localplayer.getIpCountry'),\n            getSteamId: sync('Steamworks.localplayer.getSteamId'),\n          },\n          overlay: {\n            activateToWebPage: async('Steamworks.overlay.activateToWebPage'),\n          },\n        });\n      };\n      enableSteamworks();";
      const steamworksBuffer = await this.fetchLargeAsset('steamworks.js', 'arraybuffer');
      const steamworksZip = await (await getJSZip()).loadAsync(steamworksBuffer);
      for (const [path, file] of Object.entries(steamworksZip.files)) {
        const newPath = path.replace(/^package\//, 'steamworks.js/');
        setFileFast(zip, "".concat(resourcesPrefix).concat(newPath), file);
      }
    }
    zip.file("".concat(resourcesPrefix).concat(electronMainName), mainJS);
    zip.file("".concat(resourcesPrefix).concat(electronPreloadName), preloadJS);
    for (const [path, data] of Object.entries(projectZip.files)) {
      setFileFast(zip, "".concat(resourcesPrefix).concat(path), data);
    }
    if (isWindows) {
      const readme = ['1) Extract the whole zip', "2) Open \"".concat(packageName, ".exe\" to start the app."), 'Open "licenses.html" for information regarding open source software used by the app.'].join('\n\n');
      zip.file("".concat(rootPrefix, "README.txt"), readme);
    } else if (isMac) {
      zip.file("How to run ".concat(this.options.app.packageName, ".txt"), generateMacReadme(this.options));
      const plist = this.getPlistPropertiesForPrimaryExecutable();
      await this.updatePlist(zip, "".concat(contentsPrefix, "Info.plist"), plist);

      // macOS Electron apps also contain several helper apps that we should update.
      const HELPERS = ['Electron Helper', 'Electron Helper (GPU)', 'Electron Helper (Renderer)', 'Electron Helper (Plugin)'];
      for (const name of HELPERS) {
        await this.updatePlist(zip, "".concat(contentsPrefix, "Frameworks/").concat(name, ".app/Contents/Info.plist"), {
          // In the prebuilt Electron binaries on GitHub, the original app has a CFBundleIdentifier of
          // com.github.Electron and all the helpers have com.github.Electron.helper
          [CFBundleIdentifier]: "".concat(plist[CFBundleIdentifier], ".helper"),
          // We shouldn't change the actual name of the helpers because we don't actually rename their .app
          // We also don't rename the executable
          [CFBundleDisplayName]: name.replace('Electron', this.options.app.packageName),
          // electron-builder always updates the helpers to use the same version as the app itself
          [CFBundleVersion]: this.options.app.version,
          [CFBundleShortVersionString]: this.options.app.version
        });
      }
      const icns = await Object(_icns__WEBPACK_IMPORTED_MODULE_5__["default"])(icon);
      zip.file("".concat(contentsPrefix, "Resources/electron.icns"), icns);
    } else if (isLinux) {
      // Some Linux distributions can't easily open the executable file from the GUI, so we'll add a simple wrapper that people can use instead.
      const startScript = "#!/bin/bash\ncd \"$(dirname \"$0\")\"\n./".concat(packageName);
      zip.file("".concat(rootPrefix, "start.sh"), startScript, {
        unixPermissions: 0o100755
      });
    }
    return zip;
  }
  async addNodeCLI(projectZip) {
    const packageName = this.options.app.packageName;
    validatePackageName(packageName);
    const zip = new (await getJSZip())();

    // Get the SB3 file from the original project array buffer
    const sb3Buffer = this.project.arrayBuffer;

    // Convert SB3 buffer to base64
    const sb3Base64 = Buffer.from(sb3Buffer).toString('base64');

    // Determine pkg target based on user selection
    let pkgTarget;
    if (this.options.target === 'node-cli-win64') {
      pkgTarget = 'node18-win-x64';
    } else if (this.options.target === 'node-cli-mac') {
      pkgTarget = 'node18-macos-x64';
    } else if (this.options.target === 'node-cli-linux64') {
      pkgTarget = 'node18-linux-x64';
    }

    // Create package.json
    const packageJson = {
      name: packageName,
      version: this.options.app.version,
      description: "".concat(packageName, " - Scratch CLI Application"),
      main: 'main.js',
      bin: {
        [packageName]: 'main.js'
      },
      scripts: {
        'build': 'pkg .'
      },
      dependencies: {
        'scratch-vm': 'github:02engine/scratch-vm#main',
        '@turbowarp/scratch-storage': '^0.0.202505311821',
        'jsdom': '^24.0.0',
        'pkg': '^5.8.1'
      },
      pkg: {
        targets: [pkgTarget]
      }
    };
    zip.file('package.json', JSON.stringify(packageJson, null, 2));

    // Create main.js with CLI API and scratch-vm integration
    const mainJS = "#!/usr/bin/env node\nconst fs = require('fs');\nconst path = require('path');\nconst readline = require('readline');\nconst VirtualMachine = require('scratch-vm');\n\n// Create readline interface for user input\nconst rl = readline.createInterface({\n  input: process.stdin,\n  output: process.stdout\n});\n\n// Parse command line arguments\nconst parseArgs = () => {\n  const args = process.argv.slice(2);\n  const parsed = {};\n  for (let i = 0; i < args.length; i++) {\n    if (args[i].startsWith('--')) {\n      const key = args[i].slice(2);\n      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {\n        parsed[key] = args[i + 1];\n        i++;\n      } else {\n        parsed[key] = true;\n      }\n    }\n  }\n  return parsed;\n};\n\nconst commandLineArgs = parseArgs();\n\n// CLI API\nconst cli = {\n  log: (...args) => {\n    console.log(...args);\n  },\n  error: (...args) => {\n    console.error('[CLI ERROR]', ...args);\n  },\n  warn: (...args) => {\n    console.warn('[CLI WARNING]', ...args);\n  },\n  info: (...args) => {\n    console.info('[CLI INFO]', ...args);\n  },\n  exit: (code) => {\n    console.log('[CLI] Exiting with code:', code || 0);\n    rl.close();\n    process.exit(code || 0);\n  },\n  getArgs: () => {\n    return commandLineArgs;\n  },\n  getArg: (key) => {\n    return commandLineArgs[key];\n  }\n};\n\n// Expose CLI API globally for Scratch projects\nglobal.cli = cli;\n\n// Wait for all threads to complete\nconst waitForCompletion = (vm) => {\n  return new Promise((resolve) => {\n    const checkInterval = setInterval(() => {\n      const activeThreads = vm.runtime.threads.filter(thread => !thread.updateMonitor);\n      if (activeThreads.length === 0) {\n        clearInterval(checkInterval);\n        vm.stopAll();\n        vm.quit();\n        rl.close();\n        resolve();\n      }\n    }, 100);\n  });\n};\n\nasync function runSB3(base64Data) {\n  // Decode base64 to buffer\n  const buffer = Buffer.from(base64Data, 'base64');\n\n  // Initialize VM\n  const vm = new VirtualMachine();\n\n  // Listen to Scratch events\n  vm.runtime.on('SAY', (target, type, text) => {\n    cli.log(`${text}`);\n  });\n\n  vm.runtime.on('QUESTION', () => {\n    rl.question('', (answer) => {\n      vm.runtime.emit('ANSWER', answer);\n    });\n  });\n\n  // Load project\n  await vm.loadProject(buffer);\n\n  // Start VM and trigger green flag\n  vm.start();\n  vm.greenFlag();\n\n  // Wait for all threads to complete\n  await waitForCompletion(vm);\n}\n\n// Embedded SB3 project (base64 encoded)\nconst embeddedProject = '".concat(sb3Base64, "';\n\n// Run the embedded project\nrunSB3(embeddedProject).catch(err => {\n  cli.error('Execution failed:', err);\n  rl.close();\n  cli.exit(1);\n});\n");
    zip.file('main.js', mainJS);

    // Add README
    const readme = "".concat(packageName, " - Scratch CLI Application\n\nUsage:\n  ").concat(packageName, " [options]\n\nOptions:\n  --arg value    Pass arguments to the application\n  --flag         Enable a flag\n\nCLI API:\n  cli.log(message)        - Output text to console\n  cli.error(message)      - Output error to console\n  cli.warn(message)       - Output warning to console\n  cli.info(message)       - Output info to console\n  cli.exit(code)          - Exit the application\n  cli.getArgs()            - Get all command line arguments\n  cli.getArg(key)         - Get specific command line argument\n\nExample:\n  ").concat(packageName, " --mode test --verbose\n\nImportant Notes:\n- The SB3 project is embedded in the executable, no external files needed\n- After running 'npm run build', the executable will be created in the same folder\n- Simply run the executable to start your project\n");
    zip.file('README.txt', readme);
    return zip;
  }
  async addWebViewMac(projectZip) {
    validatePackageName(this.options.app.packageName);
    const buffer = await this.fetchLargeAsset(this.options.target, 'arraybuffer');
    const appZip = await (await getJSZip()).loadAsync(buffer);

    // +-- WebView.app
    //   +-- Contents
    //     +-- Info.plist
    //     +-- MacOS
    //       +-- WebView (executable)
    //     +-- Resources
    //       +-- index.html
    //       +-- application_config.json
    //       +-- AppIcon.icns

    const newAppName = "".concat(this.options.app.packageName, ".app");
    const contentsPrefix = "".concat(newAppName, "/Contents/");
    const resourcesPrefix = "".concat(newAppName, "/Contents/Resources/");
    const zip = new (await getJSZip())();
    for (const [path, data] of Object.entries(appZip.files)) {
      const newPath = path
      // Rename the .app itself
      .replace('WebView.app', newAppName)
      // Rename the executable
      .replace(/WebView$/, this.options.app.packageName);
      setFileFast(zip, newPath, data);
    }
    for (const [path, data] of Object.entries(projectZip.files)) {
      setFileFast(zip, "".concat(resourcesPrefix).concat(path), data);
    }
    const icon = await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].getAppIcon(this.options.app.icon);
    const icns = await Object(_icns__WEBPACK_IMPORTED_MODULE_5__["default"])(icon);
    zip.file("".concat(resourcesPrefix, "AppIcon.icns"), icns);
    zip.remove("".concat(resourcesPrefix, "Assets.car"));
    const parsedBackgroundColor = parseInt(this.options.appearance.background.substr(1), 16);
    const applicationConfig = {
      title: this.options.app.windowTitle,
      background: [
      // R, G, B [0-255]
      parsedBackgroundColor >> 16 & 0xff, parsedBackgroundColor >> 8 & 0xff, parsedBackgroundColor & 0xff,
      // A [0-1]
      1],
      width: this.computeWindowSize().width,
      height: this.computeWindowSize().height
    };
    zip.file("".concat(resourcesPrefix, "application_config.json"), JSON.stringify(applicationConfig));
    await this.updatePlist(zip, "".concat(contentsPrefix, "Info.plist"), this.getPlistPropertiesForPrimaryExecutable());
    zip.file("How to run ".concat(this.options.app.packageName, ".txt"), generateMacReadme(this.options));
    return zip;
  }
  async addCordovaAndroid(projectZip) {
    // Generate a basic Cordova project structure that can be used to build an APK
    const zip = new (await getJSZip())();

    // Create the Cordova project structure
    const packageName = this.options.app.packageName || 'org.turbowarp.packaged';
    const appName = this.options.app.windowTitle || 'Packaged Project';

    // Get the app icon if available
    let iconPath = '';
    if (this.options.app.icon) {
      try {
        const icon = await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].getAppIcon(this.options.app.icon);
        zip.file('icon.png', icon);
        iconPath = 'icon.png';
      } catch (e) {
        console.warn('Failed to process app icon for Cordova Android', e);
      }
    }

    // Create a basic Cordova config.xml
    let configXml = "<?xml version='1.0' encoding='utf-8'?>\n<widget id=\"".concat(packageName, "\" version=\"").concat(this.options.app.version, "\" xmlns=\"http://www.w3.org/ns/widgets\" xmlns:cdv=\"http://cordova.apache.org/ns/1.0\">\n    <name>").concat(Object(_common_escape_xml__WEBPACK_IMPORTED_MODULE_2__["default"])(appName), "</name>\n    <description>\n        02Engine Packager\n    </description>\n    <content src=\"index.html\" />\n    <access origin=\"*\" />\n    <allow-intent href=\"http://*/*\" />\n    <allow-intent href=\"https://*/*\" />\n    <allow-intent href=\"tel:*\" />\n    <allow-intent href=\"sms:*\" />\n    <allow-intent href=\"mailto:*\" />\n    <allow-intent href=\"geo:*\" />\n    <platform name=\"android\">\n        <allow-intent href=\"market:*\" />\n        <resource-file src=\"./cdv-gradle-config.json\" target=\"cdv-gradle-config.json\" />\n        <resource-file src=\"./gradle.properties\" target=\"gradle.properties\" />");

    // Add icon definition if icon is available
    if (iconPath) {
      configXml += "\n        <icon density=\"ldpi\" src=\"".concat(iconPath, "\" />\n        <icon density=\"mdpi\" src=\"").concat(iconPath, "\" />\n        <icon density=\"hdpi\" src=\"").concat(iconPath, "\" />\n        <icon density=\"xhdpi\" src=\"").concat(iconPath, "\" />\n        <icon density=\"xxhdpi\" src=\"").concat(iconPath, "\" />\n        <icon density=\"xxxhdpi\" src=\"").concat(iconPath, "\" />");
    }
    configXml += "\n    </platform>\n    <engine name=\"android\" />\n</widget>";
    zip.file('config.xml', configXml);

    // Create package.json
    const packageJson = {
      name: packageName,
      displayName: appName,
      version: this.options.app.version,
      description: 'A packaged Scratch project',
      main: 'index.html',
      author: '0.2Studio',
      license: 'MIT',
      dependencies: {
        'cordova-android': '^10.1.1'
      },
      cordova: {
        platforms: ['android']
      },
      scripts: {
        "build": "cordova build android --verbose -- --no-build-cache",
        "prepare": "cordova prepare android"
      }
    };
    zip.file('package.json', JSON.stringify(packageJson, null, 2));

    // Create cdv-gradle-config.json
    const cdvgradleconfig = {
      "MIN_SDK_VERSION": 22,
      "SDK_VERSION": 30,
      "GRADLE_VERSION": "7.6.5",
      "MIN_BUILD_TOOLS_VERSION": "30.0.3",
      "AGP_VERSION": "4.2.2",
      "KOTLIN_VERSION": "1.5.21",
      "ANDROIDX_APP_COMPAT_VERSION": "1.3.1",
      "ANDROIDX_WEBKIT_VERSION": "1.4.0",
      "GRADLE_PLUGIN_GOOGLE_SERVICES_VERSION": "4.3.8",
      "IS_GRADLE_PLUGIN_GOOGLE_SERVICES_ENABLED": false,
      "IS_GRADLE_PLUGIN_KOTLIN_ENABLED": false
    };
    zip.file('cdv-gradle-config.json', JSON.stringify(cdvgradleconfig, null));

    // Create gradle.properties
    const gradlepro = "org.gradle.jvmargs=-Xmx2048m --add-opens java.base/java.io=ALL-UNNAMED\nandroid.useAndroidX=true\nandroid.enableJetifier=true";
    zip.file('gradle.properties', gradlepro);

    // Create README with instructions
    const readme = "# Cordova Android Project\n\nThis is a Cordova project that can be used to build an Android APK.\n\n## Setup Instructions\n\n1. Extract this zip file to a folder\n2. Install Node.js and npm if you haven't already\n3. Install project dependencies:\n   npm install\n4. Build the APK:\n   npm run build\n\n## Requirements\n\n- Node.js and npm\n- Android Studio or Android SDK\n- JAVA_HOME environment variable set to JDK path\n- ANDROID_HOME environment variable set to Android SDK path\n\n## Additional Notes\n\nYou may need to install additional dependencies depending on your system.\nFor detailed setup instructions, refer to the Cordova documentation.";
    zip.file('README.txt', readme);

    // Copy project files to www directory
    for (const [path, data] of Object.entries(projectZip.files)) {
      setFileFast(zip, "www/".concat(path), data);
    }
    return zip;
  }
  makeWebSocketProvider() {
    // If using the default turbowarp.org server, we'll add a fallback for the turbowarp.xyz alias.
    // This helps work around web filters as turbowarp.org can be blocked for games and turbowarp.xyz uses
    // a problematic TLD. These are the same server and same variables, just different domain.
    const cloudHost = this.options.cloudVariables.cloudHost === 'wss://clouddata.turbowarp.org' ? ['wss://clouddata.turbowarp.org', 'wss://clouddata.turbowarp.xyz'] : this.options.cloudVariables.cloudHost;
    return "new Scaffolding.Cloud.WebSocketProvider(".concat(JSON.stringify(cloudHost), ", ").concat(JSON.stringify(this.options.projectId), ")");
  }
  makeLocalStorageProvider() {
    return "new Scaffolding.Cloud.LocalStorageProvider(".concat(JSON.stringify("cloudvariables:".concat(this.options.projectId)), ")");
  }
  makeCustomProvider() {
    const variables = this.options.cloudVariables.custom;
    let result = '{const providers = {};\n';
    for (const provider of new Set(Object.values(variables))) {
      if (provider === 'ws') {
        result += "providers.ws = ".concat(this.makeWebSocketProvider(), ";\n");
      } else if (provider === 'local') {
        result += "providers.local = ".concat(this.makeLocalStorageProvider(), ";\n");
      }
    }
    result += 'for (const provider of Object.values(providers)) scaffolding.addCloudProvider(provider);\n';
    for (const variableName of Object.keys(variables)) {
      const providerToUse = variables[variableName];
      result += "scaffolding.addCloudProviderOverride(".concat(JSON.stringify(variableName), ", providers[").concat(JSON.stringify(providerToUse), "] || null);\n");
    }
    result += '}';
    return result;
  }
  generateFilename(extension) {
    return "".concat(this.options.app.windowTitle, ".").concat(extension);
  }
  async getProjectArchive() {
    if (!this._projectArchivePromise) {
      this._projectArchivePromise = getJSZip().then(JSZip => JSZip.loadAsync(this.project.arrayBuffer));
    }
    return this._projectArchivePromise;
  }
  async getProjectJSON() {
    if (!this._projectJSONPromise) {
      this._projectJSONPromise = (async () => {
        const zip = await this.getProjectArchive();
        const projectFile = zip.file('project.json') || zip.file(/^([^/]*\/)?project\.json$/)[0];
        if (!projectFile) {
          throw new Error('project.json is not in zip');
        }
        return JSON.parse(await projectFile.async('text'));
      })();
    }
    return this._projectJSONPromise;
  }
  async getCompiledProjectData() {
    if (!this._compiledProjectPromise) {
      this._compiledProjectPromise = (async () => {
        const [projectJSON, projectArchive, scratchLibrariesModule] = await Promise.all([this.getProjectJSON(), this.getProjectArchive(), Promise.all(/*! import() | scratch-vm-compiler */[__webpack_require__.e("vendors~icns~scratch-vm-compiler~sha256"), __webpack_require__.e("vendors~jszip~scratch-vm-compiler"), __webpack_require__.e("vendors~icns~scratch-vm-compiler"), __webpack_require__.e("scratch-vm-compiler")]).then(__webpack_require__.bind(null, /*! ../scaffolding/scratch-libraries */ "./src/scaffolding/scratch-libraries.js"))]);
        const scratchLibraries = scratchLibrariesModule.default || scratchLibrariesModule;
        const VM = scratchLibraries.VM || scratchLibraries.default && scratchLibraries.default.VM || scratchLibraries;
        const ScratchStorage = scratchLibraries.ScratchStorage || scratchLibraries.default && scratchLibraries.default.ScratchStorage;
        const Renderer = scratchLibraries.Renderer || scratchLibraries.default && scratchLibraries.default.Renderer;
        const BitmapAdapter = scratchLibraries.BitmapAdapter || scratchLibraries.default && scratchLibraries.default.BitmapAdapter;
        const AudioEngine = scratchLibraries.AudioEngine || scratchLibraries.default && scratchLibraries.default.AudioEngine;
        class CompileTimeVideoProvider {
          enableVideo() {
            return Promise.resolve(this);
          }
          disableVideo() {}
          getFrame() {
            return null;
          }
        }
        const vm = new VM();
        let renderer = null;
        let audioEngine = null;
        let videoProvider = null;
        let compileCanvas = null;
        try {
          if (typeof vm.attachStorage === 'function') {
            vm.attachStorage(new ScratchStorage());
          }
          if (typeof document !== 'undefined' && typeof vm.attachRenderer === 'function' && Renderer) {
            compileCanvas = document.createElement('canvas');
            compileCanvas.width = 480;
            compileCanvas.height = 360;
            compileCanvas.style.display = 'none';
            renderer = new Renderer(compileCanvas, -240, 240, -180, 180);
            vm.attachRenderer(renderer);
          }
          if (typeof vm.attachAudioEngine === 'function' && AudioEngine && (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined')) {
            audioEngine = new AudioEngine();
            vm.attachAudioEngine(audioEngine);
          }
          if (BitmapAdapter && typeof vm.attachV2BitmapAdapter === 'function') {
            vm.attachV2BitmapAdapter(new BitmapAdapter());
          }
          if (typeof vm.setVideoProvider === 'function') {
            videoProvider = new CompileTimeVideoProvider();
            vm.setVideoProvider(videoProvider);
          }
          if (vm.securityManager) {
            vm.securityManager.getSandboxMode = () => 'unsandboxed';
            vm.securityManager.canLoadExtensionFromProject = () => true;
          }
          vm.setCompilerOptions({
            enabled: true,
            warpTimer: this.options.compiler.warpTimer
          });
          const compiledProject = await vm.compileProjectFromJSON(projectJSON, projectArchive);
          if (this.options.compiler.obfuscateCompiledProject) {
            return await this.obfuscateCompiledProject(compiledProject);
          }
          return compiledProject;
        } finally {
          if (videoProvider && typeof videoProvider.disableVideo === 'function') {
            videoProvider.disableVideo();
          }
          if (audioEngine && typeof audioEngine.dispose === 'function') {
            audioEngine.dispose();
          }
          if (renderer && typeof renderer.destroy === 'function') {
            renderer.destroy();
          }
          if (compileCanvas && typeof compileCanvas.remove === 'function') {
            compileCanvas.remove();
          }
          if (typeof vm.quit === 'function') {
            vm.quit();
          }
        }
      })();
    }
    return this._compiledProjectPromise;
  }
  async obfuscateCompiledProject(compiledProject) {
    var _this = this;
    if (!compiledProject || !compiledProject.compiledTargets) {
      return compiledProject;
    }
    const JavaScriptObfuscator = await loadJavaScriptObfuscatorBrowserBundle();
    if (!JavaScriptObfuscator || typeof JavaScriptObfuscator.obfuscate !== 'function') {
      throw new Error('Could not load precompiled JavaScript obfuscator.');
    }
    const workItems = [];
    for (const targetData of Object.values(compiledProject.compiledTargets)) {
      if (targetData && targetData.scripts) {
        for (const scriptData of Object.values(targetData.scripts)) {
          if (scriptData && typeof scriptData.factorySource === 'string') {
            workItems.push(scriptData);
          }
        }
      }
      if (targetData && targetData.procedures) {
        for (const procedureData of Object.values(targetData.procedures)) {
          if (procedureData && typeof procedureData.factorySource === 'string') {
            workItems.push(procedureData);
          }
        }
      }
    }
    const level = this.options.compiler.obfuscateCompiledProjectLevel || 'balanced';
    const obfuscationOptions = getCompiledProjectObfuscationOptions(level);
    const dispatchProgress = function dispatchProgress(progress) {
      let current = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      let total = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : workItems.length;
      return _this.dispatchEvent(new _common_event_target__WEBPACK_IMPORTED_MODULE_0__["CustomEvent"]('obfuscating-compiled-project', {
        detail: {
          progress,
          current,
          total,
          level
        }
      }));
    };
    if (workItems.length === 0) {
      dispatchProgress(1, 0, 0);
      return compiledProject;
    }
    dispatchProgress(0, 0, workItems.length);
    await yieldToBrowser();
    for (let i = 0; i < workItems.length; i++) {
      const item = workItems[i];
      const result = JavaScriptObfuscator.obfuscate(wrapCompiledFactorySourceForObfuscation(item.factorySource), obfuscationOptions);
      const obfuscatedCode = result && typeof result.getObfuscatedCode === 'function' ? result.getObfuscatedCode() : '';
      if (!obfuscatedCode) {
        throw new Error('Precompiled JavaScript obfuscation returned empty output.');
      }
      item.factorySource = stringifyCompiledFactoryEval(obfuscatedCode);
      delete item.factoryEncoding;
      dispatchProgress((i + 1) / workItems.length, i + 1, workItems.length);
      await yieldToBrowser();
    }
    compiledProject.obfuscation = {
      mode: 'javascript-obfuscator',
      version: 2,
      level
    };
    return compiledProject;
  }
  async getCompiledProjectArchiveData() {
    if (!this._compiledProjectArchivePromise) {
      this._compiledProjectArchivePromise = (async () => {
        const [JSZip, compiledProject, projectJSON] = await Promise.all([getJSZip(), this.getCompiledProjectData(), this.getProjectJSON()]);
        const zip = await JSZip.loadAsync(this.project.arrayBuffer);
        const projectFile = zip.file('project.json') || zip.file(/^([^/]*\/)?project\.json$/)[0];
        if (!projectFile) {
          throw new Error('project.json is not in zip');
        }
        const strippedProjectJSON = JSON.parse(JSON.stringify(projectJSON));
        strippedProjectJSON.targets = JSON.parse(JSON.stringify(compiledProject.targets || []));
        strippedProjectJSON.monitors = JSON.parse(JSON.stringify(compiledProject.monitors || []));
        strippedProjectJSON.meta = JSON.parse(JSON.stringify(compiledProject.meta || strippedProjectJSON.meta || {}));
        strippedProjectJSON.extensionURLs = Object.assign({}, compiledProject.extensionURLs || strippedProjectJSON.extensionURLs || {});
        if (compiledProject.customFonts) {
          strippedProjectJSON.customFonts = JSON.parse(JSON.stringify(compiledProject.customFonts));
        } else {
          delete strippedProjectJSON.customFonts;
        }
        if (compiledProject.extensionStorage) {
          strippedProjectJSON.extensionStorage = JSON.parse(JSON.stringify(compiledProject.extensionStorage));
        } else {
          delete strippedProjectJSON.extensionStorage;
        }
        zip.file(projectFile.name, JSON.stringify(strippedProjectJSON));
        return zip.generateAsync({
          type: 'uint8array',
          compression: 'DEFLATE'
        });
      })();
    }
    return this._compiledProjectArchivePromise;
  }
  async generateGetProjectData() {
    const result = [];
    let getProjectDataFunction = '';
    let isZip = false;
    let storageProgressStart;
    let storageProgressEnd;
    if (this.options.compiler.compiledProject) {
      const compiledProject = await this.getCompiledProjectData();
      const compiledProjectArchive = await this.getCompiledProjectArchiveData();
      const compiledProjectString = JSON.stringify(compiledProject);
      isZip = true;
      storageProgressStart = PROGRESS_FETCHED_COMPRESSED;
      storageProgressEnd = PROGRESS_EXTRACTED_COMPRESSED;
      if (this.options.target === 'html') {
        const projectData = new Uint8Array(compiledProjectArchive);
        result.push("\n        <script>\n        const getBase85DecodeValue = (code) => {\n          if (code === 0x28) code = 0x3c;\n          if (code === 0x29) code = 0x3e;\n          return code - 0x2a;\n        };\n        const base85decode = (str, outBuffer, outOffset) => {\n          const view = new DataView(outBuffer, outOffset, Math.floor(str.length / 5 * 4));\n          for (let i = 0, j = 0; i < str.length; i += 5, j += 4) {\n            view.setUint32(j, (\n              getBase85DecodeValue(str.charCodeAt(i + 4)) * 85 * 85 * 85 * 85 +\n              getBase85DecodeValue(str.charCodeAt(i + 3)) * 85 * 85 * 85 +\n              getBase85DecodeValue(str.charCodeAt(i + 2)) * 85 * 85 +\n              getBase85DecodeValue(str.charCodeAt(i + 1)) * 85 +\n              getBase85DecodeValue(str.charCodeAt(i))\n            ), true);\n          }\n        };\n        let projectDecodeBuffer = new ArrayBuffer(".concat(Math.ceil(projectData.length / 4) * 4, ");\n        let projectDecodeIndex = 0;\n        const decodeChunk = (size) => {\n          try {\n            if (document.currentScript.tagName.toUpperCase() !== 'SCRIPT') throw new Error('document.currentScript is not a script');\n            base85decode(document.currentScript.getAttribute(\"data\"), projectDecodeBuffer, projectDecodeIndex);\n            document.currentScript.remove();\n            projectDecodeIndex += size;\n            setProgress(interpolate(").concat(PROGRESS_LOADED_SCRIPTS, ", ").concat(PROGRESS_FETCHED_COMPRESSED, ", projectDecodeIndex / ").concat(projectData.length, "));\n          } catch (e) {\n            handleError(e);\n          }\n        };\n        </script>"));
        const CHUNK_SIZE = 1024 * 64;
        for (let i = 0; i < projectData.length; i += CHUNK_SIZE) {
          const projectChunk = projectData.subarray(i, i + CHUNK_SIZE);
          const base85 = Object(_base85__WEBPACK_IMPORTED_MODULE_7__["encode"])(projectChunk);
          result.push("<script data=\"".concat(base85, "\">/*Generated By 02Engine Packager*/decodeChunk(/*Generated By 02Engine Packager*/").concat(projectChunk.length, "/*Generated By 02Engine Packager*/)</script>\n"));
        }
        getProjectDataFunction = "() => {\n          const buffer = projectDecodeBuffer;\n          projectDecodeBuffer = null;\n          return Promise.resolve({\n            projectData: JSON.parse(decodeURIComponent(\"".concat(encodeURIComponent(compiledProjectString), "\")),\n            projectArchive: new Uint8Array(buffer, 0, ").concat(projectData.length, ")\n          });\n        }");
      } else {
        getProjectDataFunction = "() => Promise.all([\n          new Promise((resolve, reject) => {\n            const xhr = new XMLHttpRequest();\n            xhr.onload = () => {\n              resolve(JSON.parse(xhr.responseText));\n            };\n            xhr.onerror = () => {\n              reject(new Error('Request to load compiled project data failed.'));\n            };\n            xhr.responseType = 'text';\n            xhr.open('GET', './compiled-project.json');\n            xhr.send();\n          }),\n          new Promise((resolve, reject) => {\n            const xhr = new XMLHttpRequest();\n            xhr.onload = () => {\n              resolve(new Uint8Array(xhr.response));\n            };\n            xhr.onerror = () => {\n              if (location.protocol === 'file:') {\n                reject(new Error('Zip environment must be used on a website, not on a local file. To fix this error, use the \"Plain HTML\" environment instead.'));\n              } else {\n                reject(new Error('Request to load project archive failed.'));\n              }\n            };\n            xhr.onprogress = (e) => {\n              if (e.lengthComputable) {\n                setProgress(interpolate(".concat(PROGRESS_LOADED_SCRIPTS, ", ").concat(PROGRESS_FETCHED_COMPRESSED, ", e.loaded / e.total));\n              }\n            };\n            xhr.responseType = 'arraybuffer';\n            xhr.open('GET', './project.zip');\n            xhr.send();\n          })\n        ]).then(([projectData, projectArchive]) => ({projectData, projectArchive}))");
      }
      result.push("\n      <script>\n        const getProjectData = (function() {\n          const storage = scaffolding.storage;\n          storage.onprogress = (total, loaded) => {\n            setProgress(interpolate(".concat(storageProgressStart, ", ").concat(storageProgressEnd, ", loaded / total));\n          };\n\n          let zip;\n          vm.runtime.on('PROJECT_LOADED', () => (zip = null));\n          const findFileInZip = (path) => zip.file(path) || zip.file(new RegExp(\"^([^/]*/)?\" + path + \"$\"))[0];\n\n          storage.addHelper({\n            load: (assetType, assetId, dataFormat) => {\n              if (!zip) {\n                throw new Error('Zip is not loaded or has been closed');\n              }\n              const path = assetId + '.' + dataFormat;\n              const file = findFileInZip(path);\n              if (!file) {\n                throw new Error('Asset is not in zip: ' + path);\n              }\n              return file\n                .async('uint8array')\n                .then((data) => storage.createAsset(assetType, dataFormat, data, assetId));\n            }\n          });\n\n          return () => (").concat(getProjectDataFunction, ")().then(async ({projectData, projectArchive}) => {\n            zip = await Scaffolding.JSZip.loadAsync(projectArchive);\n            return {\n              projectData,\n              assetArchive: zip\n            };\n          });\n        })();\n      </script>"));
      return result;
    }
    if (this.options.target === 'html') {
      isZip = this.project.type !== 'blob';
      storageProgressStart = PROGRESS_FETCHED_COMPRESSED;
      storageProgressEnd = PROGRESS_EXTRACTED_COMPRESSED;
      const projectData = new Uint8Array(this.project.arrayBuffer);

      // keep this up-to-date with base85.js
      result.push("\n      <script>\n      const getBase85DecodeValue = (code) => {\n        if (code === 0x28) code = 0x3c;\n        if (code === 0x29) code = 0x3e;\n        return code - 0x2a;\n      };\n      const base85decode = (str, outBuffer, outOffset) => {\n        const view = new DataView(outBuffer, outOffset, Math.floor(str.length / 5 * 4));\n        for (let i = 0, j = 0; i < str.length; i += 5, j += 4) {\n          view.setUint32(j, (\n            getBase85DecodeValue(str.charCodeAt(i + 4)) * 85 * 85 * 85 * 85 +\n            getBase85DecodeValue(str.charCodeAt(i + 3)) * 85 * 85 * 85 +\n            getBase85DecodeValue(str.charCodeAt(i + 2)) * 85 * 85 +\n            getBase85DecodeValue(str.charCodeAt(i + 1)) * 85 +\n            getBase85DecodeValue(str.charCodeAt(i))\n          ), true);\n        }\n      };\n      let projectDecodeBuffer = new ArrayBuffer(".concat(Math.ceil(projectData.length / 4) * 4, ");\n      let projectDecodeIndex = 0;\n      const decodeChunk = (size) => {\n        try {\n          if (document.currentScript.tagName.toUpperCase() !== 'SCRIPT') throw new Error('document.currentScript is not a script');\n          base85decode(document.currentScript.getAttribute(\"data\"), projectDecodeBuffer, projectDecodeIndex);\n          document.currentScript.remove();\n          projectDecodeIndex += size;\n          setProgress(interpolate(").concat(PROGRESS_LOADED_SCRIPTS, ", ").concat(PROGRESS_FETCHED_COMPRESSED, ", projectDecodeIndex / ").concat(projectData.length, "));\n        } catch (e) {\n          handleError(e);\n        }\n      };\n      </script>"));

      // To avoid unnecessary padding, this should be a multiple of 4.
      const CHUNK_SIZE = 1024 * 64;
      for (let i = 0; i < projectData.length; i += CHUNK_SIZE) {
        const projectChunk = projectData.subarray(i, i + CHUNK_SIZE);
        const base85 = Object(_base85__WEBPACK_IMPORTED_MODULE_7__["encode"])(projectChunk);
        result.push("<script data=\"".concat(base85, "\">/*Generated By 02Engine Packager*/decodeChunk(/*Generated By 02Engine Packager*/").concat(projectChunk.length, "/*Generated By 02Engine Packager*/)</script>\n"));
      }
      getProjectDataFunction = "() => {\n        const buffer = projectDecodeBuffer;\n        projectDecodeBuffer = null; // Allow GC\n        return Promise.resolve(new Uint8Array(buffer, 0, ".concat(projectData.length, "));\n      }");
    } else {
      let src;
      if (this.project.type === 'blob' || this.options.target === 'zip-one-asset') {
        isZip = this.project.type !== 'blob';
        src = './project.zip';
        storageProgressStart = PROGRESS_FETCHED_COMPRESSED;
        storageProgressEnd = PROGRESS_EXTRACTED_COMPRESSED;
      } else {
        src = './assets/project.json';
        storageProgressStart = PROGRESS_FETCHED_PROJECT_JSON;
        storageProgressEnd = PROGRESS_FETCHED_ASSETS;
      }
      getProjectDataFunction = "() => new Promise((resolve, reject) => {\n        const xhr = new XMLHttpRequest();\n        xhr.onload = () => {\n          resolve(xhr.response);\n        };\n        xhr.onerror = () => {\n          if (location.protocol === 'file:') {\n            reject(new Error('Zip environment must be used on a website, not on a local file. To fix this error, use the \"Plain HTML\" environment instead.'));\n          } else {\n            reject(new Error('Request to load project data failed.'));\n          }\n        };\n        xhr.onprogress = (e) => {\n          if (e.lengthComputable) {\n            setProgress(interpolate(".concat(PROGRESS_LOADED_SCRIPTS, ", ").concat(storageProgressStart, ", e.loaded / e.total));\n          }\n        };\n        xhr.responseType = 'arraybuffer';\n        xhr.open('GET', ").concat(JSON.stringify(src), ");\n        xhr.send();\n      })");
    }
    result.push("\n    <script>\n      const getProjectData = (function() {\n        const storage = scaffolding.storage;\n        storage.onprogress = (total, loaded) => {\n          setProgress(interpolate(".concat(storageProgressStart, ", ").concat(storageProgressEnd, ", loaded / total));\n        };\n        ").concat(isZip ? "\n        let zip;\n        // Allow zip to be GC'd after project loads\n        vm.runtime.on('PROJECT_LOADED', () => (zip = null));\n        const findFileInZip = (path) => zip.file(path) || zip.file(new RegExp(\"^([^/]*/)?\" + path + \"$\"))[0];\n        storage.addHelper({\n          load: (assetType, assetId, dataFormat) => {\n            if (!zip) {\n              throw new Error('Zip is not loaded or has been closed');\n            }\n            const path = assetId + '.' + dataFormat;\n            const file = findFileInZip(path);\n            if (!file) {\n              throw new Error('Asset is not in zip: ' + path)\n            }\n            return file\n              .async('uint8array')\n              .then((data) => storage.createAsset(assetType, dataFormat, data, assetId));\n          }\n        });\n        return () => (".concat(getProjectDataFunction, ")().then(async (data) => {\n          zip = await Scaffolding.JSZip.loadAsync(data);\n          const file = findFileInZip('project.json');\n          if (!file) {\n            throw new Error('project.json is not in zip');\n          }\n          return file.async('arraybuffer');\n        });") : "\n        storage.addWebStore(\n          [\n            storage.AssetType.ImageVector,\n            storage.AssetType.ImageBitmap,\n            storage.AssetType.Sound,\n            storage.AssetType.Font\n          ].filter(i => i),\n          (asset) => new URL('./assets/' + asset.assetId + '.' + asset.dataFormat, location).href\n        );\n        return ".concat(getProjectDataFunction, ";"), "\n      })();\n    </script>"));
    return result;
  }
  async generateFavicon() {
    if (this.options.app.icon === null) {
      return '';
    }
    const data = await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].readAsURL(this.options.app.icon, 'app icon');
    return "<link rel=\"icon\" href=\"".concat(data, "\">");
  }
  async generateCursor() {
    if (this.options.cursor.type !== 'custom') {
      return this.options.cursor.type;
    }
    if (!this.options.cursor.custom) {
      // Configured to use a custom cursor but no image was selected
      return 'auto';
    }
    const data = await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].readAsURL(this.options.cursor.custom, 'custom cursor');
    return "url(".concat(data, ") ").concat(this.options.cursor.center.x, " ").concat(this.options.cursor.center.y, ", auto");
  }
  async generateExtensionURLs() {
    const dispatchProgress = progress => this.dispatchEvent(new _common_event_target__WEBPACK_IMPORTED_MODULE_0__["CustomEvent"]('fetch-extensions', {
      detail: {
        progress
      }
    }));
    const shouldTryToFetch = url => {
      if (!this.options.bakeExtensions) {
        return false;
      }
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch (e) {
        return false;
      }
    };

    /** @type {string[]} */
    const allURLs = this.options.extensions;
    const unfetchableURLs = allURLs.filter(url => !shouldTryToFetch(url));
    const urlsToFetch = allURLs.filter(url => shouldTryToFetch(url));
    const finalURLs = [...unfetchableURLs];
    if (urlsToFetch.length !== 0) {
      for (let i = 0; i < urlsToFetch.length; i++) {
        dispatchProgress(i / urlsToFetch.length);
        const url = urlsToFetch[i];
        try {
          const wrappedSource = await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].fetchExtensionScript(url);
          const dataURI = "data:text/javascript;,".concat(encodeURIComponent(wrappedSource));
          finalURLs.push(dataURI);
        } catch (e) {
          console.warn('Could not bake extension', url, e);
          finalURLs.push(url);
        }
      }
      dispatchProgress(1);
    }
    return finalURLs;
  }
  async package() {
    if (!_adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"]) {
      throw new Error('Missing adapter');
    }
    if (this.used) {
      throw new Error('Packager was already used');
    }
    this.used = true;
    this.ensureNotAborted();
    await this.loadResources();
    this.ensureNotAborted();
    const html = Object(_encode_big_string__WEBPACK_IMPORTED_MODULE_13__["default"])(_templateObject2 || (_templateObject2 = _taggedTemplateLiteral(["<!DOCTYPE html>\n<!-- Created with ", " -->\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">\n  <!-- We only include this to explicitly loosen the CSP of various packager environments. It does not provide any security. -->\n  <meta http-equiv=\"Content-Security-Policy\" content=\"default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:\">\n  <title>", "</title>\n  <style>\n    body {\n      color: ", ";\n      font-family: sans-serif;\n      overflow: hidden;\n      margin: 0;\n      padding: 0;\n    }\n    :root, body.is-fullscreen {\n      background-color: ", ";\n    }\n    [hidden] {\n      display: none !important;\n    }\n    h1 {\n      font-weight: normal;\n    }\n    a {\n      color: inherit;\n      text-decoration: underline;\n      cursor: pointer;\n    }\n\n    #app, #loading, #error, #launch {\n      position: absolute;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n    }\n    .screen {\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      text-align: center;\n      cursor: default;\n      user-select: none;\n      -webkit-user-select: none;\n      background-color: ", ";\n    }\n    #launch {\n      background-color: rgba(0, 0, 0, 0.7);\n      cursor: pointer;\n    }\n    .green-flag {\n      width: 80px;\n      height: 80px;\n      padding: 16px;\n      border-radius: 100%;\n      background: rgba(255, 255, 255, 0.75);\n      border: 3px solid hsla(0, 100%, 100%, 1);\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      box-sizing: border-box;\n    }\n    #loading {\n      ", "\n    }\n    .progress-bar-outer {\n      border: 1px solid currentColor;\n      height: 10px;\n      width: 200px;\n      max-width: 200px;\n    }\n    .progress-bar-inner {\n      height: 100%;\n      width: 0;\n      background-color: currentColor;\n    }\n    .loading-text, noscript {\n      font-weight: normal;\n      font-size: 36px;\n      margin: 0 0 16px;\n    }\n    .loading-image {\n      margin: 0 0 16px;\n    }\n    #error-message, #error-stack {\n      font-family: monospace;\n      max-width: 600px;\n      white-space: pre-wrap;\n      user-select: text;\n      -webkit-user-select: text;\n    }\n    #error-stack {\n      text-align: left;\n      max-height: 200px;\n      overflow: auto;\n    }\n    .control-button {\n      width: 2rem;\n      height: 2rem;\n      padding: 0.375rem;\n      margin-top: 0.5rem;\n      margin-bottom: 0.5rem;\n      user-select: none;\n      -webkit-user-select: none;\n      cursor: pointer;\n      border: 0;\n      border-radius: 4px;\n    }\n    .control-button-highlight:hover {\n      background: ", "26;\n    }\n    .control-button-highlight.active {\n      background: ", "59;\n    }\n    .fullscreen-button {\n      background: white;\n    }\n    .standalone-fullscreen-button {\n      position: absolute;\n      top: 0;\n      right: 0;\n      background-color: rgba(0, 0, 0, 0.5);\n      border-radius: 0 0 0 4px;\n      padding: 4px;\n      cursor: pointer;\n    }\n    .sc-canvas {\n      cursor: ", ";\n    }\n    .sc-monitor-root[data-opcode^=\"data_\"] .sc-monitor-value-color {\n      background-color: ", ";\n    }\n    .sc-monitor-row-value-outer {\n      background-color: ", ";\n    }\n    .sc-monitor-row-value-editing .sc-monitor-row-value-outer {\n      background-color: ", ";\n    }\n    ", "\n  </style>\n  <meta name=\"theme-color\" content=\"", "\">\n  ", "\n</head>\n<body>\n  <div id=\"app\"></div>\n\n  <div id=\"launch\" class=\"screen\" hidden title=\"Click to start\">\n    <div class=\"green-flag\">\n      <svg viewBox=\"0 0 16.63 17.5\" width=\"42\" height=\"44\">\n        <defs><style>.cls-1,.cls-2{fill:#4cbf56;stroke:#45993d;stroke-linecap:round;stroke-linejoin:round;}.cls-2{stroke-width:1.5px;}</style></defs>\n        <path class=\"cls-1\" d=\"M.75,2A6.44,6.44,0,0,1,8.44,2h0a6.44,6.44,0,0,0,7.69,0V12.4a6.44,6.44,0,0,1-7.69,0h0a6.44,6.44,0,0,0-7.69,0\"/>\n        <line class=\"cls-2\" x1=\"0.75\" y1=\"16.75\" x2=\"0.75\" y2=\"0.75\"/>\n      </svg>\n    </div>\n  </div>\n\n  <div id=\"loading\" class=\"screen\">\n    <noscript>Enable JavaScript</noscript>\n    ", "\n    ", "\n    ", "\n  </div>\n\n  <div id=\"error\" class=\"screen\" hidden>\n    <h1>Error</h1>\n    <details>\n      <summary id=\"error-message\"></summary>\n      <p id=\"error-stack\"></p>\n    </details>\n  </div>\n\n  ", "\n  <script>", "</script>\n  ", "\n  ", "\n  <script>\n    const run = async () => {\n      const projectData = await getProjectData();\n      await scaffolding.", "(projectData);\n      setProgress(1);\n      loadingScreen.hidden = true;\n      if (", ") {\n        scaffolding.start();\n      } else {\n        launchScreen.hidden = false;\n        launchScreen.addEventListener('click', () => {\n          launchScreen.hidden = true;\n          scaffolding.start();\n        });\n        launchScreen.focus();\n      }\n    };\n    run().catch(handleError);\n  </script>\n</body>\n</html>\n"])), _brand__WEBPACK_IMPORTED_MODULE_9__["WEBSITE"], Object(_common_escape_xml__WEBPACK_IMPORTED_MODULE_2__["default"])(this.options.app.windowTitle), this.options.appearance.foreground, this.options.appearance.background, this.options.appearance.background, this.options.loadingScreen.image && this.options.loadingScreen.imageMode === 'stretch' ? "background-image: url(".concat(await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].readAsURL(this.options.loadingScreen.image, 'stretched loading screen'), ");\n      background-repeat: no-repeat;\n      background-size: contain;\n      background-position: center;") : '', this.options.appearance.accent, this.options.appearance.accent, await this.generateCursor(), this.options.monitors.variableColor, this.options.monitors.listColor, Object(_colors__WEBPACK_IMPORTED_MODULE_11__["darken"])(this.options.monitors.listColor), this.options.custom.css, this.options.appearance.background, await this.generateFavicon(), this.options.loadingScreen.text ? "<h1 class=\"loading-text\">".concat(Object(_common_escape_xml__WEBPACK_IMPORTED_MODULE_2__["default"])(this.options.loadingScreen.text), "</h1>") : '', this.options.loadingScreen.image && this.options.loadingScreen.imageMode === 'normal' ? "<div class=\"loading-image\"><img src=\"".concat(await _adapter__WEBPACK_IMPORTED_MODULE_12__["Adapter"].readAsURL(this.options.loadingScreen.image, 'loading-screen'), "\"></div>") : '', this.options.loadingScreen.progressBar ? '<div class="progress-bar-outer"><div class="progress-bar-inner" id="loading-inner"></div></div>' : '', this.options.target === 'html' ? "<script>".concat(this.script, "</script>") : '<script src="script.js"></script>', removeUnnecessaryEmptyLines("\n    const appElement = document.getElementById('app');\n    const launchScreen = document.getElementById('launch');\n    const loadingScreen = document.getElementById('loading');\n    const loadingInner = document.getElementById('loading-inner');\n    const errorScreen = document.getElementById('error');\n    const errorScreenMessage = document.getElementById('error-message');\n    const errorScreenStack = document.getElementById('error-stack');\n\n    const handleError = (error) => {\n      console.error(error);\n      if (!errorScreen.hidden) return;\n      errorScreen.hidden = false;\n      errorScreenMessage.textContent = '' + error;\n      let debug = error && error.stack || 'no stack';\n      debug += '\\nUser agent: ' + navigator.userAgent;\n      errorScreenStack.textContent = debug;\n    };\n    const setProgress = (progress) => {\n      if (loadingInner) loadingInner.style.width = progress * 100 + '%';\n    };\n    const interpolate = (a, b, t) => a + t * (b - a);\n\n    try {\n      setProgress(".concat(PROGRESS_LOADED_SCRIPTS, ");\n\n      const scaffolding = new Scaffolding.Scaffolding();\n      scaffolding.width = ").concat(this.options.stageWidth, ";\n      scaffolding.height = ").concat(this.options.stageHeight, ";\n      scaffolding.resizeMode = ").concat(JSON.stringify(this.options.resizeMode), ";\n      scaffolding.editableLists = ").concat(this.options.monitors.editableLists, ";\n      scaffolding.usePackagedRuntime = ").concat(this.options.packagedRuntime, ";\n      scaffolding.setup();\n      scaffolding.appendTo(appElement);\n\n      const vm = scaffolding.vm;\n      window.scaffolding = scaffolding;\n      window.vm = scaffolding.vm;\n      window.Scratch = {\n        vm,\n        renderer: vm.renderer,\n        audioEngine: vm.runtime.audioEngine,\n        bitmapAdapter: vm.runtime.v2BitmapAdapter,\n        videoProvider: vm.runtime.ioDevices.video.provider\n      };\n\n      scaffolding.setUsername(").concat(JSON.stringify(this.options.username), ".replace(/#/g, () => Math.floor(Math.random() * 10)));\n      scaffolding.setAccentColor(").concat(JSON.stringify(this.options.appearance.accent), ");\n\n      try {\n        ").concat(this.options.cloudVariables.mode === 'ws' ? "scaffolding.addCloudProvider(".concat(this.makeWebSocketProvider(), ")") : this.options.cloudVariables.mode === 'local' ? "scaffolding.addCloudProvider(".concat(this.makeLocalStorageProvider(), ")") : this.options.cloudVariables.mode === 'custom' ? this.makeCustomProvider() : '', ";\n      } catch (error) {\n        console.error(error);\n      }\n\n      ").concat(this.options.controls.greenFlag.enabled ? "\n      const greenFlagButton = document.createElement('img');\n      greenFlagButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16.63 17.5\"><path d=\"M.75 2a6.44 6.44 0 017.69 0h0a6.44 6.44 0 007.69 0v10.4a6.44 6.44 0 01-7.69 0h0a6.44 6.44 0 00-7.69 0\" fill=\"#4cbf56\" stroke=\"#45993d\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path stroke-width=\"1.5\" fill=\"#4cbf56\" stroke=\"#45993d\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M.75 16.75v-16\"/></svg>');\n      greenFlagButton.className = 'control-button control-button-highlight green-flag-button';\n      greenFlagButton.draggable = false;\n      greenFlagButton.addEventListener('click', () => {\n        scaffolding.greenFlag();\n      });\n      scaffolding.addEventListener('PROJECT_RUN_START', () => {\n        greenFlagButton.classList.add('active');\n      });\n      scaffolding.addEventListener('PROJECT_RUN_STOP', () => {\n        greenFlagButton.classList.remove('active');\n      });\n      scaffolding.addControlButton({\n        element: greenFlagButton,\n        where: 'top-left'\n      });" : '', "\n\n      ").concat(this.options.controls.pause.enabled ? "\n      const pauseButton = document.createElement('img');\n      pauseButton.className = 'control-button control-button-highlight pause-button';\n      pauseButton.draggable = false;\n      let isPaused = false;\n      pauseButton.addEventListener('click', () => {\n        vm.setPaused(!isPaused);\n      });\n      const updatePause = () => {\n        if (isPaused) {\n          pauseButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg width=\"16\" height=\"16\" viewBox=\"0 0 4.2333332 4.2333335\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m3.95163484 2.02835365-1.66643921.9621191-1.66643913.96211911V.10411543l1.66643922.9621191z\" fill=\"#ffae00\"/></svg>');\n        } else {\n          pauseButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg width=\"16\" height=\"16\" viewBox=\"0 0 4.2333332 4.2333335\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"#ffae00\"><path d=\"M.389.19239126h1.2631972v3.8485508H.389zM2.5810001.19239126h1.2631972v3.8485508H2.5810001z\"/></g></svg>');\n        }\n      };\n      vm.runtime.on('RUNTIME_PAUSED', () => {\n        isPaused = true;\n        updatePause();\n      });\n      vm.runtime.on('RUNTIME_UNPAUSED', () => {\n        isPaused = false;\n        updatePause();\n      });\n      updatePause();\n      scaffolding.addControlButton({\n        element: pauseButton,\n        where: 'top-left'\n      });" : '', "\n\n      ").concat(this.options.controls.stopAll.enabled ? "\n      const stopAllButton = document.createElement('img');\n      stopAllButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 14 14\"><path fill=\"#ec5959\" stroke=\"#b84848\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-miterlimit=\"10\" d=\"M4.3.5h5.4l3.8 3.8v5.4l-3.8 3.8H4.3L.5 9.7V4.3z\"/></svg>');\n      stopAllButton.className = 'control-button control-button-highlight stop-all-button';\n      stopAllButton.draggable = false;\n      stopAllButton.addEventListener('click', () => {\n        scaffolding.stopAll();\n      });\n      scaffolding.addControlButton({\n        element: stopAllButton,\n        where: 'top-left'\n      });" : '', "\n\n      ").concat(this.options.controls.fullscreen.enabled ? "\n      if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {\n        let isFullScreen = !!(document.fullscreenElement || document.webkitFullscreenElement);\n        const fullscreenButton = document.createElement('img');\n        fullscreenButton.draggable = false;\n        fullscreenButton.className = 'control-button fullscreen-button';\n        fullscreenButton.addEventListener('click', () => {\n          if (isFullScreen) {\n            if (document.exitFullscreen) {\n              document.exitFullscreen();\n            } else if (document.webkitExitFullscreen) {\n              document.webkitExitFullscreen();\n            }\n          } else {\n            if (document.body.requestFullscreen) {\n              document.body.requestFullscreen();\n            } else if (document.body.webkitRequestFullscreen) {\n              document.body.webkitRequestFullscreen();\n            }\n          }\n        });\n        const otherControlsExist = ".concat(this.options.controls.greenFlag.enabled || this.options.controls.stopAll.enabled, ";\n        const fillColor = otherControlsExist ? '#575E75' : '").concat(this.options.appearance.foreground, "';\n        const updateFullScreen = () => {\n          isFullScreen = !!(document.fullscreenElement || document.webkitFullscreenElement);\n          document.body.classList.toggle('is-fullscreen', isFullScreen);\n          if (isFullScreen) {\n            fullscreenButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"' + fillColor + '\" fill-rule=\"evenodd\"><path d=\"M12.662 3.65l.89.891 3.133-2.374a.815.815 0 011.15.165.819.819 0 010 .986L15.467 6.46l.867.871c.25.25.072.664-.269.664L12.388 8A.397.397 0 0112 7.611V3.92c0-.341.418-.514.662-.27M7.338 16.35l-.89-.89-3.133 2.374a.817.817 0 01-1.15-.166.819.819 0 010-.985l2.37-3.143-.87-.871a.387.387 0 01.27-.664L7.612 12a.397.397 0 01.388.389v3.692a.387.387 0 01-.662.27M7.338 3.65l-.89.891-3.133-2.374a.815.815 0 00-1.15.165.819.819 0 000 .986l2.37 3.142-.87.871a.387.387 0 00.27.664L7.612 8A.397.397 0 008 7.611V3.92a.387.387 0 00-.662-.27M12.662 16.35l.89-.89 3.133 2.374a.817.817 0 001.15-.166.819.819 0 000-.985l-2.368-3.143.867-.871a.387.387 0 00-.269-.664L12.388 12a.397.397 0 00-.388.389v3.692c0 .342.418.514.662.27\"/></g></svg>');\n          } else {\n            fullscreenButton.src = 'data:image/svg+xml,' + encodeURIComponent('<svg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><g fill=\"' + fillColor + '\" fill-rule=\"evenodd\"><path d=\"M16.338 7.35l-.89-.891-3.133 2.374a.815.815 0 01-1.15-.165.819.819 0 010-.986l2.368-3.142-.867-.871a.387.387 0 01.269-.664L16.612 3a.397.397 0 01.388.389V7.08a.387.387 0 01-.662.27M3.662 12.65l.89.89 3.133-2.374a.817.817 0 011.15.166.819.819 0 010 .985l-2.37 3.143.87.871c.248.25.071.664-.27.664L3.388 17A.397.397 0 013 16.611V12.92c0-.342.418-.514.662-.27M3.662 7.35l.89-.891 3.133 2.374a.815.815 0 001.15-.165.819.819 0 000-.986L6.465 4.54l.87-.871a.387.387 0 00-.27-.664L3.388 3A.397.397 0 003 3.389V7.08c0 .341.418.514.662.27M16.338 12.65l-.89.89-3.133-2.374a.817.817 0 00-1.15.166.819.819 0 000 .985l2.368 3.143-.867.871a.387.387 0 00.269.664l3.677.005a.397.397 0 00.388-.389V12.92a.387.387 0 00-.662-.27\"/></g></svg>');\n          }\n        };\n        updateFullScreen();\n        document.addEventListener('fullscreenchange', updateFullScreen);\n        document.addEventListener('webkitfullscreenchange', updateFullScreen);\n        if (otherControlsExist) {\n          fullscreenButton.className = 'control-button fullscreen-button';\n          scaffolding.addControlButton({\n            element: fullscreenButton,\n            where: 'top-right'\n          });\n        } else {\n          fullscreenButton.className = 'standalone-fullscreen-button';\n          document.body.appendChild(fullscreenButton);\n        }\n      }") : '', "\n\n      vm.setTurboMode(").concat(this.options.turbo, ");\n      if (vm.setInterpolation) vm.setInterpolation(").concat(this.options.interpolation, ");\n      if (vm.setFramerate) vm.setFramerate(").concat(this.options.framerate, ");\n      if (vm.renderer.setUseHighQualityRender) vm.renderer.setUseHighQualityRender(").concat(this.options.highQualityPen, ");\n      if (vm.setRuntimeOptions) vm.setRuntimeOptions({\n        fencing: ").concat(this.options.fencing, ",\n        miscLimits: ").concat(this.options.miscLimits, ",\n        maxClones: ").concat(this.options.maxClones, ",\n      });\n      if (vm.setCompilerOptions) vm.setCompilerOptions({\n        enabled: ").concat(this.options.compiler.enabled, ",\n        warpTimer: ").concat(this.options.compiler.warpTimer, "\n      });\n      if (vm.renderer.setMaxTextureDimension) vm.renderer.setMaxTextureDimension(").concat(this.options.maxTextureDimension, ");\n\n      // enforcePrivacy threat model only makes sense in the editor\n      if (vm.runtime.setEnforcePrivacy) vm.runtime.setEnforcePrivacy(false);\n\n      if (typeof ScaffoldingAddons !== 'undefined') {\n        ScaffoldingAddons.run(scaffolding, ").concat(JSON.stringify(this.getAddonOptions()), ");\n      }\n\n      scaffolding.setExtensionSecurityManager({\n        getSandboxMode: () => 'unsandboxed',\n        canLoadExtensionFromProject: () => true\n      });\n      for (const extension of ").concat(JSON.stringify(await this.generateExtensionURLs()), ") {\n        vm.extensionManager.loadExtensionURL(extension);\n      }\n\n      ").concat(this.options.closeWhenStopped ? "\n      vm.runtime.on('PROJECT_RUN_STOP', () => {\n        if (!vm.isPaused || !vm.isPaused()) {\n          window.close();\n        }\n      });" : '', "\n\n      ").concat(this.options.target.startsWith('nwjs-') ? "\n      if (typeof nw !== 'undefined') {\n        const win = nw.Window.get();\n        win.on('new-win-policy', (frame, url, policy) => {\n          policy.ignore();\n          nw.Shell.openExternal(url);\n        });\n        win.on('navigation', (frame, url, policy) => {\n          policy.ignore();\n          nw.Shell.openExternal(url);\n        });\n        document.addEventListener('keydown', (e) => {\n          if (e.key === 'Escape' && document.fullscreenElement) {\n            document.exitFullscreen();\n          }\n        });\n      }" : '', "\n    } catch (e) {\n      handleError(e);\n    }\n  ")), this.options.custom.js ? "<script>\n    try {\n      ".concat(this.options.custom.js, "\n    } catch (e) {\n      handleError(e);\n    }\n  </script>") : '', await this.generateGetProjectData(), this.options.compiler.compiledProject ? 'loadCompiledProject' : 'loadProject', this.options.autoplay);
    //html=encodeBigString ` ${html} `;

    this.ensureNotAborted();
    if (this.options.target !== 'html') {
      let zip;
      if (this.options.compiler.compiledProject) {
        zip = new (await getJSZip())();
        zip.file('project.zip', await this.getCompiledProjectArchiveData());
        zip.file('compiled-project.json', JSON.stringify(await this.getCompiledProjectData()));
      } else if (this.project.type === 'sb3' && this.options.target !== 'zip-one-asset') {
        zip = await (await getJSZip()).loadAsync(this.project.arrayBuffer);
        for (const file of Object.keys(zip.files)) {
          zip.files["assets/".concat(file)] = zip.files[file];
          delete zip.files[file];
        }
      } else {
        zip = new (await getJSZip())();
        zip.file('project.zip', this.project.arrayBuffer);
      }
      zip.file('index.html', html);
      zip.file('script.js', this.script);
      if (this.options.target.startsWith('nwjs-')) {
        zip = await this.addNwJS(zip);
      } else if (this.options.target.startsWith('electron-')) {
        zip = await this.addElectron(zip);
      } else if (this.options.target === 'webview-mac') {
        zip = await this.addWebViewMac(zip);
      } else if (this.options.target === 'cordova-android') {
        zip = await this.addCordovaAndroid(zip);
      } else if (this.options.target.startsWith('node-cli-')) {
        zip = await this.addNodeCLI(zip);
      }
      this.ensureNotAborted();
      return {
        data: await zip.generateAsync({
          type: 'uint8array',
          compression: 'DEFLATE',
          // Use UNIX permissions so that executable bits are properly set for macOS and Linux
          platform: 'UNIX'
        }, meta => {
          this.dispatchEvent(new _common_event_target__WEBPACK_IMPORTED_MODULE_0__["CustomEvent"]('zip-progress', {
            detail: {
              progress: meta.percent / 100
            }
          }));
        }),
        type: 'application/zip',
        filename: this.generateFilename('zip')
      };
    }
    return {
      data: html,
      type: 'text/html',
      filename: this.generateFilename('html')
    };
  }
}
Packager.getDefaultPackageNameFromFileName = title => {
  // Note: Changing this logic is very dangerous because changing the defaults will cause already packaged projects
  // to loose any data when they are updated.
  title = title.split('.')[0];
  title = title.replace(/[^\-a-z ]/gi, '');
  title = title.trim();
  title = title.replace(/ /g, '-');
  return title.toLowerCase() || 'packaged-project';
};
Packager.getWindowTitleFromFileName = title => {
  const split = title.split('.');
  if (split.length > 1) {
    split.pop();
  }
  title = split.join('.').trim();
  return title || 'Packaged Project';
};
Packager.usesUnsafeOptions = options => {
  const defaultOptions = Packager.DEFAULT_OPTIONS();
  const getUnsafeOptions = options => [options.custom, options.extensions, options.cloudVariables.unsafeCloudBehaviors];
  return JSON.stringify(getUnsafeOptions(defaultOptions)) !== JSON.stringify(getUnsafeOptions(options));
};
Packager.DEFAULT_OPTIONS = () => ({
  turbo: false,
  interpolation: false,
  framerate: 30,
  highQualityPen: false,
  maxClones: 300,
  fencing: true,
  miscLimits: true,
  stageWidth: 480,
  stageHeight: 360,
  resizeMode: 'preserve-ratio',
  autoplay: false,
  username: 'player####',
  closeWhenStopped: false,
  projectId: '',
  custom: {
    css: '',
    js: ''
  },
  appearance: {
    background: '#000000',
    foreground: '#ffffff',
    accent: _brand__WEBPACK_IMPORTED_MODULE_9__["ACCENT_COLOR"]
  },
  loadingScreen: {
    progressBar: true,
    text: '',
    imageMode: 'normal',
    image: null
  },
  controls: {
    greenFlag: {
      enabled: false
    },
    stopAll: {
      enabled: false
    },
    fullscreen: {
      enabled: false
    },
    pause: {
      enabled: false
    }
  },
  monitors: {
    editableLists: false,
    variableColor: '#ff8c1a',
    listColor: '#fc662c'
  },
  compiler: {
    enabled: true,
    warpTimer: false,
    compiledProject: false,
    obfuscateCompiledProject: false,
    obfuscateCompiledProjectLevel: 'balanced'
  },
  packagedRuntime: true,
  target: 'html',
  app: {
    icon: null,
    packageName: Packager.getDefaultPackageNameFromFileName(''),
    windowTitle: Packager.getWindowTitleFromFileName(''),
    windowMode: 'window',
    version: '1.0.0',
    escapeBehavior: 'unfullscreen-only',
    windowControls: 'default'
  },
  chunks: {
    gamepad: false,
    pointerlock: false
  },
  cloudVariables: {
    mode: 'ws',
    cloudHost: 'wss://clouddata.turbowarp.org',
    custom: {},
    specialCloudBehaviors: false,
    unsafeCloudBehaviors: false
  },
  cursor: {
    type: 'auto',
    custom: null,
    center: {
      x: 0,
      y: 0
    }
  },
  steamworks: {
    // 480 is Spacewar, the Steamworks demo game
    appId: '480',
    // 'ignore' (no alert), 'warning' (alert and continue), or 'error' (alert and exit)
    onError: 'warning'
  },
  nodeCli: {
    exposeSystemAPIs: false
  },
  extensions: [],
  bakeExtensions: true,
  maxTextureDimension: 2048
});
/* harmony default export */ __webpack_exports__["default"] = (Packager);
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../node_modules/buffer/index.js */ "./node_modules/buffer/index.js").Buffer))

/***/ }),

/***/ "./src/packager/plist.js":
/*!*******************************!*\
  !*** ./src/packager/plist.js ***!
  \*******************************/
/*! exports provided: parsePlist, generatePlist */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parsePlist", function() { return parsePlist; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "generatePlist", function() { return generatePlist; });
// Parses and generates Apple Info.plist files
// Example file:
/*
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>BuildMachineOSBuild</key>
  <string>20F71</string>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>WebView</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleIconName</key>
  <string>AppIcon</string>
  <key>CFBundleIdentifier</key>
  <string>org.turbowarp.webviews.mac</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>WebView</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleSupportedPlatforms</key>
  <array>
    <string>MacOSX</string>
  </array>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>DTCompiler</key>
  <string>com.apple.compilers.llvm.clang.1_0</string>
  <key>DTPlatformBuild</key>
  <string>12E507</string>
  <key>DTPlatformName</key>
  <string>macosx</string>
  <key>DTPlatformVersion</key>
  <string>11.3</string>
  <key>DTSDKBuild</key>
  <string>20E214</string>
  <key>DTSDKName</key>
  <string>macosx11.3</string>
  <key>DTXcode</key>
  <string>1251</string>
  <key>DTXcodeBuild</key>
  <string>12E507</string>
  <key>LSApplicationCategoryType</key>
  <string>public.app-category.games</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.12</string>
  <key>NSMainStoryboardFile</key>
  <string>Main</string>
  <key>NSPrincipalClass</key>
  <string>NSApplication</string>
  <key>ExampleBooleanTrue</key>
  <true/>
  <key>ExampleBooleanFalse</key>
  <false/>
</dict>
</plist>
*/

const xmlToValue = node => {
  if (node.tagName === 'dict') {
    const result = {};
    for (const child of node.children) {
      if (child.tagName === 'key') {
        result[child.textContent] = xmlToValue(child.nextElementSibling);
      }
    }
    return result;
  } else if (node.tagName === 'array') {
    return Array.from(node.children).map(xmlToValue);
  } else if (node.tagName === 'string') {
    return node.textContent;
  } else if (node.tagName === 'true') {
    return true;
  } else if (node.tagName === 'false') {
    return false;
  }
  console.warn('unknown plist xml', node);
  return null;
};
const valueToXml = (doc, value) => {
  if (Array.isArray(value)) {
    const node = doc.createElement('array');
    for (const listItem of value) {
      node.appendChild(valueToXml(doc, listItem));
    }
    return node;
  } else if (typeof value === 'object') {
    const node = doc.createElement('dict');
    for (const [key, keyValue] of Object.entries(value)) {
      const keyNode = doc.createElement('key');
      keyNode.textContent = key;
      const valueNode = valueToXml(doc, keyValue);
      node.appendChild(keyNode);
      node.appendChild(valueNode);
    }
    return node;
  } else if (typeof value === 'string') {
    const node = doc.createElement('string');
    node.textContent = value;
    return node;
  } else if (typeof value === 'boolean') {
    const node = doc.createElement(value.toString());
    return node;
  }
  console.warn('unknown plist value', value);
  return valueToXml(doc, "".concat(value));
};
const parsePlist = string => {
  const xml = new DOMParser().parseFromString(string, 'text/xml');
  const rootNode = xml.children[0];
  const rootDict = rootNode.children[0];
  return xmlToValue(rootDict);
};
const generatePlist = values => {
  const xml = document.implementation.createDocument(null, "plist");
  const rootNode = xml.documentElement;
  rootNode.setAttribute('version', '1.0');
  rootNode.appendChild(valueToXml(xml, values));
  const serialized = new XMLSerializer().serializeToString(xml);
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n".concat(serialized);
};

/***/ }),

/***/ "./src/packager/sha256.js":
/*!********************************!*\
  !*** ./src/packager/sha256.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
const sha256 = async arrayBuffer => {
  // Use the browser's builtin SHA-256 if possible.
  // This API might not exist if we're not a secure context or in versions of Node that aren't even that old,
  // so we also have a pure JS fallback.
  if (typeof crypto === 'object' && crypto.subtle && crypto.subtle.digest) {
    const rawData = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(rawData)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // The checksum will be performed on the main thread and may take a while.
  const SHA256 = (await Promise.all(/*! import() | sha256 */[__webpack_require__.e("vendors~icns~scratch-vm-compiler~sha256"), __webpack_require__.e("sha256")]).then(__webpack_require__.t.bind(null, /*! sha.js/sha256 */ "./node_modules/sha.js/sha256.js", 7))).default;
  const hash = new SHA256();
  // new Uint8Array() is necessary to make this work in Node
  hash.update(new Uint8Array(arrayBuffer));
  return hash.digest('hex');
};
/* harmony default export */ __webpack_exports__["default"] = (sha256);

/***/ }),

/***/ "./src/packager/web/adapter.js":
/*!*************************************!*\
  !*** ./src/packager/web/adapter.js ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _cache__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./cache */ "./src/packager/web/cache.js");
/* harmony import */ var _common_request__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../common/request */ "./src/common/request.js");
/* harmony import */ var _common_readers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../common/readers */ "./src/common/readers.js");
/* harmony import */ var _images_default_icon_png__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../images/default-icon.png */ "./src/packager/images/default-icon.png");
/* harmony import */ var _extension_loader__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../extension-loader */ "./src/packager/extension-loader.js");
/* harmony import */ var _extension_loader__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_extension_loader__WEBPACK_IMPORTED_MODULE_4__);





class WebAdapter {
  getCachedAsset(asset) {
    return _cache__WEBPACK_IMPORTED_MODULE_0__["default"].get(asset);
  }
  async cacheAsset(asset, result) {
    await _cache__WEBPACK_IMPORTED_MODULE_0__["default"].set(asset, result);
  }
  getAppIcon(file) {
    if (!file) {
      return Object(_common_request__WEBPACK_IMPORTED_MODULE_1__["default"])({
        url: _images_default_icon_png__WEBPACK_IMPORTED_MODULE_3__["default"],
        type: 'arraybuffer'
      });
    }
    // Convert to PNG
    if (file.type === 'image/png') {
      return Object(_common_readers__WEBPACK_IMPORTED_MODULE_2__["readAsArrayBuffer"])(file);
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        image.onload = null;
        image.onerror = null;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot get rendering context for icon conversion'));
          return;
        }
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          resolve(Object(_common_readers__WEBPACK_IMPORTED_MODULE_2__["readAsArrayBuffer"])(blob));
        });
      };
      image.onerror = () => {
        image.onload = null;
        image.onerror = null;
        reject(new Error('Cannot load icon'));
      };
      image.src = url;
    });
  }
  readAsURL(file, debugInfo) {
    return Object(_common_readers__WEBPACK_IMPORTED_MODULE_2__["readAsURL"])(file).catch(err => {
      throw new Error("".concat(debugInfo, ": ").concat(err));
    });
  }
  async fetchExtensionScript(url) {
    try {
      const source = await Object(_extension_loader__WEBPACK_IMPORTED_MODULE_4__["fetchExtensionSource"])(url);
      return Object(_extension_loader__WEBPACK_IMPORTED_MODULE_4__["wrapExtensionSource"])(source);
    } catch (error) {
      // 降级到原来的实现
      return Object(_common_request__WEBPACK_IMPORTED_MODULE_1__["default"])({
        type: 'text',
        url: url
      });
    }
  }
}
/* harmony default export */ __webpack_exports__["default"] = (WebAdapter);

/***/ }),

/***/ "./src/packager/web/cache.js":
/*!***********************************!*\
  !*** ./src/packager/web/cache.js ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _large_assets__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../large-assets */ "./src/packager/large-assets.js");
/* harmony import */ var _build_id__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../build-id */ "./src/packager/build-id.js");
/* harmony import */ var _common_idb__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../common/idb */ "./src/common/idb.js");



const DATABASE_NAME = 'p4-large-assets';
const DATABASE_VERSION = 1;
const STORE_NAME = 'assets';
const db = new _common_idb__WEBPACK_IMPORTED_MODULE_2__["default"](DATABASE_NAME, DATABASE_VERSION, STORE_NAME);
const getAssetId = asset => {
  if (asset.sha256) {
    return asset.sha256;
  }
  return "".concat(_build_id__WEBPACK_IMPORTED_MODULE_1__["buildId"], "-").concat(JSON.stringify(asset.src));
};
const removeExtraneous = async () => {
  const {
    transaction,
    store
  } = await db.createTransaction('readwrite');
  return new Promise((resolve, reject) => {
    _common_idb__WEBPACK_IMPORTED_MODULE_2__["default"].setTransactionErrorHandler(transaction, reject);
    const keyRequest = store.getAllKeys();
    keyRequest.onsuccess = async e => {
      const keys = e.target.result;
      const allValidAssetIds = Object.values(_large_assets__WEBPACK_IMPORTED_MODULE_0__["default"]).map(getAssetId);
      const keysToDelete = keys.filter(i => !allValidAssetIds.includes(i));
      for (const key of keysToDelete) {
        await new Promise(resolveDelete => {
          const deleteRequest = store.delete(key);
          deleteRequest.onsuccess = () => {
            resolveDelete();
          };
        });
      }
      resolve();
    };
  });
};
const get = async asset => {
  const {
    transaction,
    store
  } = await db.createTransaction('readonly');
  return new Promise((resolve, reject) => {
    _common_idb__WEBPACK_IMPORTED_MODULE_2__["default"].setTransactionErrorHandler(transaction, reject);
    const assetId = getAssetId(asset);
    const request = store.get(assetId);
    request.onsuccess = e => {
      const result = e.target.result;
      if (result) {
        resolve(result.data);
      } else {
        resolve(null);
      }
    };
  });
};
const set = async (asset, content) => {
  const {
    transaction,
    store
  } = await db.createTransaction('readwrite');
  return new Promise((resolve, reject) => {
    _common_idb__WEBPACK_IMPORTED_MODULE_2__["default"].setTransactionErrorHandler(transaction, reject);
    const assetId = getAssetId(asset);
    const request = store.put({
      id: assetId,
      data: content
    });
    request.onsuccess = () => {
      resolve();
    };
  });
};
const resetAll = () => db.deleteEverything();
removeExtraneous();
/* harmony default export */ __webpack_exports__["default"] = ({
  get,
  set,
  resetAll
});

/***/ }),

/***/ "./src/packager/web/export.js":
/*!************************************!*\
  !*** ./src/packager/web/export.js ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _adapter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../adapter */ "./src/packager/adapter.js");
/* harmony import */ var _packager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../packager */ "./src/packager/packager.js");
/* harmony import */ var _adapter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./adapter */ "./src/packager/web/adapter.js");



Object(_adapter__WEBPACK_IMPORTED_MODULE_0__["setAdapter"])(new _adapter__WEBPACK_IMPORTED_MODULE_2__["default"]());
/* harmony default export */ __webpack_exports__["default"] = (_packager__WEBPACK_IMPORTED_MODULE_1__["default"]);

/***/ })

}]);
//# sourceMappingURL=packager-options-ui.js.map