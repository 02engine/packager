import WebAdapter from '../web/adapter.js';
import {detectEnvironment} from '../extension-loader.js';

/**
 * P4环境的Adapter
 * 基于WebAdapter，但针对P4的standalone环境进行了优化
 */
class P4Adapter extends WebAdapter {
  async fetchExtensionScript (url) {
    const environment = detectEnvironment();
    
    // 在standalone环境中，可能需要特殊处理
    if (environment === 'standalone') {
      // standalone环境中可能存在安全限制，使用父类方法但添加错误处理
      try {
        return await super.fetchExtensionScript(url);
      } catch (error) {
        console.warn('Extension loading failed in standalone environment, falling back to browser mode:', error);
        // 降级到基本的fetch
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const source = await response.text();
        return `(function(Scratch) { ${source} })(Scratch);`;
      }
    }
    
    // 浏览器环境直接使用父类方法
    return super.fetchExtensionScript(url);
  }
}

export default P4Adapter;