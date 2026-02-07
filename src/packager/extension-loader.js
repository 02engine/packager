// Extension Loader for 02Engine CLI
// 支持Web、Node.js和P4三种环境
// 迁移自scratch-vm的extension loader，完全独立不依赖scratch-vm

// 尝试导入Node.js环境的依赖
let JSDOM, nodeFetch;
try {
    // 动态导入，避免在浏览器环境中出错
    JSDOM = require('jsdom').JSDOM;
    nodeFetch = require('node-fetch');
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
        if (process.env.STANDALONE) {
            return 'standalone';
        }
        return 'node';
    }
    return 'browser';
};

/**
 * 浏览器环境的扩展加载器
 * @param {string} extensionURL - 扩展URL
 * @returns {Promise<string>} 扩展源代码
 */
const loadExtensionBrowser = (extensionURL) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.onload = () => {
        script.remove();
        resolve(extensionURL);
    };
    script.onerror = () => {
        script.remove();
        reject(new Error(`Failed to load extension: ${extensionURL}`));
    };
    script.src = extensionURL;
    document.head.appendChild(script);
});

/**
 * Node.js环境的扩展加载器
 * @param {string} extensionURL - 扩展URL
 * @returns {Promise<string>} 扩展源代码
 */
const loadExtensionNode = async (extensionURL) => {
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
            throw new Error(`HTTP error! status: ${response.status}`);
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
        throw new Error(`Error loading extension ${extensionURL}: ${err.message}`);
    }
};

/**
 * Standalone环境（Electron等）的扩展加载器
 * 继承Node环境的逻辑但可能有特殊的处理
 * @param {string} extensionURL - 扩展URL
 * @returns {Promise<string>} 扩展源代码
 */
const loadExtensionStandalone = async (extensionURL) => {
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
const loadExtension = (extensionURL) => {
    const environment = detectEnvironment();
    
    switch (environment) {
        case 'browser':
            return loadExtensionBrowser(extensionURL);
        case 'node':
            return loadExtensionNode(extensionURL);
        case 'standalone':
            return loadExtensionStandalone(extensionURL);
        default:
            throw new Error(`Unsupported environment: ${environment}`);
    }
};

/**
 * 获取扩展源代码（用于打包到项目中）
 * @param {string} extensionURL
 * @returns {Promise<string>} 扩展源代码文本
 */
const fetchExtensionSource = async (extensionURL) => {
    const environment = detectEnvironment();
    
    if (environment === 'browser' || environment === 'standalone') {
        // 浏览器和standalone环境优先使用原生fetch
        if (typeof fetch !== 'undefined') {
            const response = await fetch(extensionURL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        }
    }
    
    // Node.js环境或standalone环境的降级方案
    const fetchImpl = nodeFetch || (global && global.fetch);
    if (!fetchImpl) {
        throw new Error('Fetch not available in this environment');
    }
    const response = await fetchImpl(extensionURL);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text();
};

/**
 * 包装扩展源代码，使其在非沙盒环境中更安全
 * @param {string} source - 扩展源代码
 * @returns {string} 包装后的源代码
 */
const wrapExtensionSource = (source) => {
    // Wrap the extension in an IIFE so that extensions written for the sandbox are less
    // likely to cause issues in an unsandboxed environment due to global pollution or
    // overriding Scratch.*
    return `(function(Scratch) { ${source} })(Scratch);`;
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