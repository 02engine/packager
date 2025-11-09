<!-- PackagerOptions.svelte v2.1.0 - OAuth Integration for Cordova Android APK Build -->
<!-- - Added GitHub OAuth authentication with PKCE flow
     - Integrated OAuth login/logout UI
     - Added automatic repository creation and workflow triggering
     - Updated OAuth scope to include public_repo permissions
     - Added comprehensive logging and error handling -->
<script>
  import {onDestroy} from 'svelte';
  import {_} from '../locales/';
  import {slide, fade} from 'svelte/transition';
  import Section from './Section.svelte';
  import Button from '../p4/Button.svelte';
  import ImageInput from './ImageInput.svelte';
  import CustomExtensions from '../p4/CustomExtensions.svelte';
  import LearnMore from './LearnMore.svelte';
  import ColorPicker from './ColorPicker.svelte';
  import Downloads from './Downloads.svelte';
  import writablePersistentStore from './persistent-store';
  import fileStore from './file-store';
  import {progress, currentTask, error} from './stores';
  import Preview from './preview';
  import deepClone from './deep-clone';
  import Packager from '../packager/web/export';
  import Task from './task';
  import downloadURL from './download-url';
  import {recursivelySerializeBlobs, recursivelyDeserializeBlobs} from './blob-serializer';
  import {readAsText} from '../common/readers';
  import merge from './merge';
  import DropArea from './DropArea.svelte';
  import {APP_NAME} from '../packager/brand';

  export let projectData;
  export let title;

  // JSON can't easily parse Infinity, so we'll just store large numbers instead
  const ALMOST_INFINITY = 9999999999;

  const cloudVariables = projectData.project.analysis.stageVariables
    .filter(i => i.isCloud)
    .map(i => i.name);

  const defaultOptions = Packager.DEFAULT_OPTIONS();
  defaultOptions.projectId = projectData.projectId || `p4-${projectData.uniqueId}`;
  for (const variable of cloudVariables) {
    defaultOptions.cloudVariables.custom[variable] = 'ws';
  }
  defaultOptions.app.packageName = Packager.getDefaultPackageNameFromFileName(projectData.title);
  defaultOptions.app.windowTitle = Packager.getWindowTitleFromFileName(projectData.title);
  defaultOptions.extensions = projectData.project.analysis.extensions;
  const options = writablePersistentStore(`PackagerOptions.${projectData.uniqueId}`, defaultOptions);

  // Compatibility with https://github.com/TurboWarp/packager/commit/f66199abd1c896c11aa69247275a1594fdfc95b8
  $options.extensions = $options.extensions.map(i => {
    if (typeof i === 'object' && i) return i.url || '';
    return i;
  });

  const hasMagicComment = (magic) => projectData.project.analysis.stageComments.find(
    (text) => text.split('\n').find((line) => line.endsWith(magic))
  );
  const hasSettingsStoredInProject = hasMagicComment(' // _twconfig_');

  let result = null;
  let previewer = null;
  const resetResult = () => {
    previewer = null;
    if (result) {
      URL.revokeObjectURL(result.url);
    }
    result = null;
  }
  $: if (previewer) {
    previewer.setProgress($progress.progress, $progress.text);
  }
  $: $options, resetResult(), currentTask.abort();

  const icon = fileStore.writableFileStore(`PackagerOptions.icon.${projectData.uniqueId}`);
  $: $options.app.icon = $icon;

  const customCursorIcon = fileStore.writableFileStore(`PackagerOptions.customCursorIcon.${projectData.uniqueId}`);
  $: $options.cursor.custom = $customCursorIcon;

  const loadingScreenImage = fileStore.writableFileStore(`PackagerOptions.loadingScreenImage.${projectData.uniqueId}`);
  $: $options.loadingScreen.image = $loadingScreenImage;

  $: title = $options.app.windowTitle;

  const setOptions = (newOptions) => {
    $options = newOptions;
    $icon = $options.app.icon;
    $customCursorIcon = $options.cursor.custom;
    $loadingScreenImage = $options.loadingScreen.image;
  };

  const otherEnvironmentsInitiallyOpen = ![
    'html',
    'zip',
    'electron-win32',
    'webview-mac',
    'electron-linux64'
  ].includes($options.target);

  const advancedOptionsInitiallyOpen = (
    $options.compiler.enabled !== defaultOptions.compiler.enabled ||
    $options.compiler.warpTimer !== defaultOptions.compiler.warpTimer ||
    $options.extensions.length !== 0 ||
    $options.bakeExtensions !== defaultOptions.bakeExtensions ||
    $options.custom.css !== '' ||
    $options.custom.js !== '' ||
    $options.projectId !== defaultOptions.projectId ||
    $options.packagedRuntime !== defaultOptions.packagedRuntime ||
    $options.maxTextureDimension !== defaultOptions.maxTextureDimension
  );

  const automaticallyCenterCursor = () => {
    const icon = $customCursorIcon;
    const url = URL.createObjectURL(icon)
    const image = new Image();
    const cleanup = () => {
      image.onerror = null;
      image.onload = null;
      URL.revokeObjectURL(url);
    };
    image.onload = () => {
      $options.cursor.center.x = Math.round(image.width / 2);
      $options.cursor.center.y = Math.round(image.height / 2);
      cleanup();
    };
    image.onerror = () => {
      cleanup();
      $error = new Error('Image could not be loaded');
      throw $error;
    };
    image.src = url;
  };

  const runPackager = async (task, options) => {
    const packager = new Packager();
    packager.options = options;
    packager.project = projectData.project;

    task.addEventListener('abort', () => {
      packager.abort();
    });

    task.setProgressText($_('progress.loadingScripts'));

    packager.addEventListener('fetch-extensions', ({detail}) => {
      task.setProgressText($_('progress.downloadingExtensions'));
      task.setProgress(detail.progress);
    });
    packager.addEventListener('large-asset-fetch', ({detail}) => {
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
    packager.addEventListener('zip-progress', ({detail}) => {
      task.setProgressText($_('progress.compressingProject'));
      task.setProgress(detail.progress);
    });

    const result = await packager.package();
    result.blob = new Blob([result.data], {
      type: result.type
    });
    result.url = URL.createObjectURL(result.blob);
    return result;
  };

  const pack = async () => {
    resetResult();
    const task = new Task();
    addLog('info', '开始本地打包...');
    try {
      result = await task.do(runPackager(task, deepClone($options)));
      task.done();
      addLog('info', `打包完成: ${result.filename}`);
      downloadURL(result.filename, result.url);
    } catch (e) {
      addLog('error', `打包出错: ${e && e.message ? e.message : e}`);
      throw e;
    }
  };

  // GitHub uploader state for UI placed next to package name
  import { uploadAndBuildFromTemplate } from './github-uploader';
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
  const CLIENT_ID = 'Ov23liZ8xH1osNpfJWaF';
  const BACKEND_URL = 'https://02packager-oauth-backend.netlify.app/.netlify/functions/token';
  const REDIRECT_URI = window.location.origin + window.location.pathname;

  // Local logs for pack/upload actions
  let logs = [];
  const MAX_LOGS = 500;
  function addLog(level, msg) {
    try {
      const time = new Date().toLocaleTimeString();
      logs = [...logs, { level, msg: String(msg), time }];
      if (logs.length > MAX_LOGS) logs = logs.slice(logs.length - MAX_LOGS);
      // keep log scrolled to bottom by briefly yielding to event loop
      setTimeout(() => {
        const el = document.querySelector('.log-entries');
        if (el) el.scrollTop = el.scrollHeight;
      }, 0);
    } catch (e) {
      // ignore logging errors
    }
  }
  function copyLogs() {
    try {
      const text = logs.map(l => `${l.time} [${l.level}] ${l.msg}`).join('\n');
      if (navigator.clipboard) navigator.clipboard.writeText(text);
    } catch (e) {
      // ignore
    }
  }

  const packAndUpload = async () => {
    uploadError = '';
    uploadedFileUrl = '';
    createdRepoUrl = '';
    addLog('info', '开始打包并上传流程');

    if (!oauthUserInfo) {
      uploadError = '请先使用 GitHub OAuth 登录';
      addLog('error', uploadError);
      return;
    }

    // Debug: Check token availability
    addLog('info', `Token available: ${!!githubToken}, User: ${githubUser}`);
    if (!githubToken) {
      uploadError = 'GitHub token 不可用，请重新登录';
      addLog('error', uploadError);
      return;
    }

    uploadInProgress = true;
    try {
      // run packager to produce a blob
      resetResult();
      const task = new Task();
      const r = await task.do(runPackager(task, deepClone($options)));
      task.done();
      addLog('info', `打包完成，文件名: ${r.filename}`);

      // pass progress callback into uploader
      const res = await uploadAndBuildFromTemplate({ blob: r.blob, name: r.filename, githubUser, githubToken }, (msg) => {
        addLog('info', msg);
      });
      createdRepoUrl = res.createdRepoUrl;
      releaseUrl = res.releaseUrl || '';
      assetName = res.assetName || '';
      assetDownloadUrl = res.assetDownloadUrl || '';
      showReleaseModal = true;
      addLog('info', `上传并构建完成: ${assetName || assetDownloadUrl}`);
    } catch (e) {
      uploadError = e.message || '上传失败';
      addLog('error', uploadError);
    } finally {
      uploadInProgress = false;
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
        headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' }
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMsg = errorData.message || `HTTP ${resp.status}: ${resp.statusText}`;
        throw new Error(errorMsg);
      }
      alert('仓库已删除');
      addLog('info', `仓库已删除: ${createdRepoUrl}`);
      createdRepoUrl = '';
      releaseUrl = '';
      assetDownloadUrl = '';
      assetName = '';
      showReleaseModal = false;
    } catch (e) {
      const errorMsg = e.message || '删除失败';
      uploadError = `删除仓库失败: ${errorMsg}`;
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
    previewer = new Preview();
    const task = new Task();
    const optionsClone = deepClone($options);
    optionsClone.target = 'html';
    try {
      addLog('info', '开始生成预览');
      result = await task.do(runPackager(task, optionsClone));
      task.done();
      addLog('info', `预览生成完成: ${result.filename}`);
      previewer.setContent(result.blob);
    } catch (e) {
      addLog('error', `预览生成失败: ${e && e.message ? e.message : e}`);
      previewer.close();
    }
  };

  const resetOptions = (properties) => {
    for (const key of properties) {
      let current = $options;
      let defaults = defaultOptions;
      const parts = key.split('.');
      const lastPart = parts.pop();
      for (const i of parts) {
        current = current[i];
        defaults = defaults[i];
      }
      current[lastPart] = deepClone(defaults[lastPart]);
    }
    $options = $options;
  };

  const resetAll = () => {
    if (confirm($_('reset.confirmAll'))) {
      resetOptions(Object.keys($options));
      $icon = null;
      $customCursorIcon = null;
      $loadingScreenImage = null;
    }
  };

  const exportOptions = async () => {
    const exported = await recursivelySerializeBlobs($options);
    const blob = new Blob([JSON.stringify(exported)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const formattedAppName = APP_NAME
      .replace(/[^a-z0-9 ]/gi, '')
      .replace(/ /g, '-')
      .toLowerCase();
    downloadURL(`${formattedAppName}-settings.json`, url);
    URL.revokeObjectURL(url);
  };
    
  const importOptions = async () => {
    const input = document.createElement("input");
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
      importOptionsFromDataTransfer(e.target);
    });
    document.body.appendChild(input);
    input.click();
    input.remove();
  };

  const importOptionsFromDataTransfer = async (dataTransfer) => {
    const file = dataTransfer.files[0];
    if (!file) {
      // Should never happen.
      return;
    }
    try {
      const text = await readAsText(file);
      const parsed = JSON.parse(text);
      const deserialized = recursivelyDeserializeBlobs(parsed);
      const copiedDefaultOptions = deepClone(defaultOptions);
      const mergedWithDefaults = merge(deserialized, copiedDefaultOptions);

      const isUnsafe = Packager.usesUnsafeOptions(mergedWithDefaults);
      if (!isUnsafe || confirm($_('options.confirmImportUnsafe'))) {
        setOptions(mergedWithDefaults);
      }
    } catch (e) {
      $error = e;
    }
  };

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
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function startOAuth() {
    oauthError = '';
    oauthInProgress = true;
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
    } catch (e) {
      oauthError = '启动认证失败: ' + e.message;
      oauthInProgress = false;
    }
  }

  async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    oauthInProgress = true;
    const codeVerifier = sessionStorage.getItem('code_verifier');
    const clientId = sessionStorage.getItem('client_id');

    if (!codeVerifier || !clientId) {
      oauthError = '认证参数丢失，请重新登录';
      oauthInProgress = false;
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
          code: code,
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
        headers: { Authorization: `token ${token}`, 'User-Agent': 'OAuth-App' }
      });
      const user = await userRes.json();

      let email = user.email;
      if (!email) {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `token ${token}`, 'User-Agent': 'OAuth-App' }
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
      oauthUserInfo = { user, email, token };
      oauthToken = token;

      window.history.replaceState({}, '', window.location.pathname);
    } catch (e) {
      oauthError = '认证失败: ' + e.message;
    } finally {
      oauthInProgress = false;
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
    oauthUserInfo = null;
    oauthToken = '';
    oauthError = '';
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
      oauthUserInfo = { user, email: storedEmail, token: storedToken };
      oauthToken = storedToken;
    }

    // Handle OAuth callback
    handleCallback();
  }

  onDestroy(() => {
    if (result) {
      URL.revokeObjectURL(result.url);
    }
  });
</script>

<style>
  .option {
    display: block;
    margin: 4px 0;
  }
  .group {
    margin: 12px 0;
  }
  p {
    margin: 8px 0;
  }
  .group:last-child, .option:last-child, p:last-child {
    margin-bottom: 0;
  }
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-width: 100%;
    height: 150px;
  }
  input[type="text"] {
    width: 200px;
  }
  input[type="text"].shorter {
    width: 150px;
  }
  input[type="number"] {
    width: 50px;
  }
  input:invalid, .version:placeholder-shown {
    outline: 2px solid red;
  }
  .warning {
    font-weight: bold;
    background: yellow;
    color: black;
    padding: 10px;
    border-radius: 10px;
  }
  .buttons {
    display: flex;
  }
  .button {
    margin-right: 4px;
  }
  .side-buttons {
    display: flex;
    margin-left: auto;
  }
  .github-uploader {
    margin-top: 0.5rem;
    border: 1px dashed #ccc;
    padding: 0.5rem;
    border-radius: 4px;
  }

  .github-uploader button {
    margin-top: 0.25rem;
  }
  .upload-status {
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }
  .log-panel {
    margin-top: 0.5rem;
    border: 1px solid #ddd;
    background: #f8f8f8;
    padding: 0.5rem;
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    max-height: 180px;
    display: flex;
    flex-direction: column;
  }
  .log-entries {
    overflow: auto;
    flex: 1 1 auto;
    padding: 4px;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 4px;
  }
  .log-controls {
    display: flex;
    gap: 8px;
    margin-top: 6px;
  }
  .log-entry { padding: 2px 4px; }
  .log-entry.info { color: #222; }
  .log-entry.warn { color: #b65a00; }
  .log-entry.error { color: #b00000; font-weight: bold; }
</style>

<Section
  accent="#FFAB19"
  reset={() => {
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
  }}
>
  <div>
    <h2>{$_('options.runtimeOptions')}</h2>

    {#if hasSettingsStoredInProject}
      <div class="group">
        {$_('options.storedWarning')}
      </div>
    {/if}

    <label class="option">
      <input type="checkbox" bind:checked={$options.turbo}>
      {$_('options.turbo')}
    </label>
    <div class="option">
      <label>
        {$_('options.framerate')}
        <input type="number" min="0" max="240" bind:value={$options.framerate}>
      </label>
      <LearnMore slug="custom-fps" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" bind:checked={$options.interpolation}>
        {$_('options.interpolation')}
      </label>
      <LearnMore slug="interpolation" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" bind:checked={$options.highQualityPen}>
        {$_('options.highQualityPen')}
      </label>
      <LearnMore slug="high-quality-pen" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" checked={$options.maxClones === ALMOST_INFINITY} on:change={(e) => {
          $options.maxClones = e.target.checked ? ALMOST_INFINITY : 300;
        }}>
        {$_('options.infiniteClones')}
      </label>
      <LearnMore slug="infinite-clones" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" checked={!$options.fencing} on:change={(e) => {
          $options.fencing = !e.target.checked;
        }}>
        {$_('options.removeFencing')}
      </label>
      <LearnMore slug="remove-fencing" />
    </div>
    <div class="option">
      <label>
        <input type="checkbox" checked={!$options.miscLimits} on:change={(e) => {
          $options.miscLimits = !e.target.checked;
        }}>
        {$_('options.removeMiscLimits')}
      </label>
      <LearnMore slug="remove-misc-limits" />
    </div>
    <label class="option">
      {$_('options.username')}
      <input type="text" class="shorter" bind:value={$options.username}>
    </label>
    {#if $options.username !== defaultOptions.username && cloudVariables.length !== 0}
      <p class="warning">
        {$_('options.customUsernameWarning')}
      </p>
    {/if}
    <label class="option">
      <input type="checkbox" bind:checked={$options.closeWhenStopped}>
      {$_('options.closeWhenStopped')}
    </label>

    <h3>{$_('options.stage')}</h3>
    <label class="option">
      {$_('options.stageSize')}
      <input type="number" min="1" max="4096" step="1" bind:value={$options.stageWidth}>
      &times;
      <input type="number" min="1" max="4096" step="1" bind:value={$options.stageHeight}>
      <LearnMore slug="custom-stage-size" />
    </label>
    <div class="group">
      <label class="option">
        <input type="radio" name="resize-mode" value="preserve-ratio" bind:group={$options.resizeMode}>
        {$_('options.preserveRatio')}
      </label>
      <label class="option">
        <input type="radio" name="resize-mode" value="stretch" bind:group={$options.resizeMode}>
        {$_('options.stretch')}
      </label>
      <label class="option">
        <input type="radio" name="resize-mode" value="dynamic-resize" bind:group={$options.resizeMode}>
        {$_('options.dynamicResize')}
        <LearnMore slug="packager/dynamic-stage-resize" />
      </label>
    </div>
  </div>
</Section>

<Section
  accent="#9966FF"
  reset={() => {
    $icon = null;
    $loadingScreenImage = null;
    resetOptions([
      'app.windowTitle',
      'loadingScreen',
      'autoplay',
      'controls',
      'appearance',
      'monitors',
    ]);
  }}
>
  <div>
    <h2>{$_('options.playerOptions')}</h2>

    <label class="option">
      {$_('options.pageTitle')}
      <input type="text" bind:value={$options.app.windowTitle}>
    </label>
    <div class="option">
      {$_('options.icon')}
      <ImageInput bind:file={$icon} previewSizes={[[64, 64], [32, 32], [16, 16]]} />
    </div>

    <h3>{$_('options.loadingScreen')}</h3>
    <label class="option">
      <input type="checkbox" bind:checked={$options.loadingScreen.progressBar}>
      {$_('options.showProgressBar')}
    </label>
    <label class="option">
      {$_('options.loadingScreenText')}
      <input type="text" bind:value={$options.loadingScreen.text} placeholder={$_('options.loadingScreenTextPlaceholder')}>
    </label>
    <div class="option">
      {$_('options.loadingScreenImage')}
      <!-- Display preview at image's native size -->
      <ImageInput bind:file={$loadingScreenImage} previewSizes={[['', '']]} />
    </div>
    {#if $loadingScreenImage}
      <label class="option">
        <input type="radio" name="loading-screen-mode" value="normal" bind:group={$options.loadingScreen.imageMode}>
        {$_('options.sizeNormal')}
      </label>
      <label class="option">
        <input type="radio" name="loading-screen-mode" value="stretch" bind:group={$options.loadingScreen.imageMode}>
        {$_('options.sizeStretch')}
      </label>
    {/if}

    <h3>{$_('options.controls')}</h3>
    <div class="group">
      <label class="option">
        <input type="checkbox" bind:checked={$options.autoplay}>
        {$_('options.autoplay')}
      </label>
      {#if $options.autoplay}
        {$_('options.autoplayHint')}
      {/if}
    </div>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.greenFlag.enabled}>
      {$_('options.showFlag')}
    </label>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.stopAll.enabled}>
      {$_('options.showStop')}
    </label>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.pause.enabled}>
      {$_('options.showPause')}
    </label>
    <label class="option">
      <input type="checkbox" bind:checked={$options.controls.fullscreen.enabled}>
      {$_('options.showFullscreen')}
    </label>
    <p>{$_('options.controlsHelp')}</p>

    <h3>{$_('options.colors')}</h3>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.appearance.background} />
      {$_('options.backgroundColor')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.appearance.foreground} />
      {$_('options.foregroundColor')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.appearance.accent} />
      {$_('options.accentColor')}
    </label>

    <h3>{$_('options.monitors')}</h3>
    <label class="option">
      <input type="checkbox" bind:checked={$options.monitors.editableLists}>
      {$_('options.editableLists')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.monitors.variableColor} />
      {$_('options.variableColor')}
    </label>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label class="option">
      <ColorPicker bind:value={$options.monitors.listColor} />
      {$_('options.listColor')}
    </label>
  </div>
</Section>

<Section
  accent="#4CBFE6"
  reset={() => {
    $customCursorIcon = null;
    resetOptions([
      'cursor',
      'chunks',
    ]);
  }}
>
  <div>
    <h2>{$_('options.interaction')}</h2>
    <div class="group">
      <label class="option">
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="auto">
        {$_('options.normalCursor')}
      </label>
      <label class="option">
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="none">
        {$_('options.noCursor')}
      </label>
      <label class="option">
        <input type="radio" name="cursor-type" bind:group={$options.cursor.type} value="custom">
        {$_('options.customCursor')}
      </label>
    </div>
    {#if $options.cursor.type === 'custom'}
      <div in:slide|self class="option">
        <ImageInput bind:file={$customCursorIcon} previewSizes={[[32, 32], [16, 16]]} />
        <p>{$_('options.cursorHelp')}</p>
        <label class="option">
          {$_('options.cursorCenter')}
          <!-- X: and Y: intentionally not translated -->
          X: <input type="number" min="0" bind:value={$options.cursor.center.x}>
          Y: <input type="number" min="0" bind:value={$options.cursor.center.y}>
          <button
            on:click={automaticallyCenterCursor}
            disabled={!$customCursorIcon}
          >
            {$_('options.automaticallyCenter')}
          </button>
        </label>
      </div>
    {/if}

    <div class="group">
      <label class="option">
        <input type="checkbox" bind:checked={$options.chunks.pointerlock}>
        {$_('options.pointerlock')}
      </label>
      <a href="https://experiments.turbowarp.org/pointerlock/" target="_blank" rel="noopener noreferrer">
        {$_('options.pointerlockHelp')}
      </a>
    </div>

    <div class="group">
      <label class="option">
        <input type="checkbox" bind:checked={$options.chunks.gamepad}>
        {$_('options.gamepad')}
      </label>
      <a href="https://turbowarp.org/addons#gamepad" target="_blank" rel="noopener noreferrer">
        {$_('options.gamepadHelp')}
      </a>
    </div>
  </div>
</Section>

<Section
  accent="#FF8C1A"
  reset={cloudVariables.length === 0 ? null : () => {
    resetOptions([
      'cloudVariables'
    ]);
  }}
>
  <div>
    <h2>{$_('options.cloudVariables')}</h2>

    {#if cloudVariables.length > 0}
      <label class="option">
        {$_('options.mode')}
        <select bind:value={$options.cloudVariables.mode}>
          <option value="ws">{$_('options.cloudVariables-ws')}</option>
          <option value="local">{$_('options.cloudVariables-local')}</option>
          <option value="">{$_('options.cloudVariables-ignore')}</option>
          <option value="custom">{$_('options.cloudVariables-custom')}</option>
        </select>
      </label>

      {#if $options.cloudVariables.mode === "custom"}
        <div transition:fade|local>
          {#each cloudVariables as variable}
            <label class="option">
              <select bind:value={$options.cloudVariables.custom[variable]}>
                <option value="ws">{$_('options.cloudVariables-ws')}</option>
                <option value="local">{$_('options.cloudVariables-local')}</option>
                <option value="">{$_('options.cloudVariables-ignore')}</option>
              </select>
              {variable}
            </label>
          {/each}
        </div>
      {/if}

      {#if $options.cloudVariables.mode === 'ws' || $options.cloudVariables.mode === 'custom'}
        <div transition:fade|local>
          <label class="option">
            {$_('options.cloudVariablesHost')}
            <!-- Examples of valid values: -->
            <!-- wss://clouddata.turbowarp.org -->
            <!-- ws:localhost:8080 -->
            <input type="text" bind:value={$options.cloudVariables.cloudHost} pattern="wss?:.*">
          </label>
        </div>
      {/if}

      <p>{$_('options.cloudVariables-ws-help')}</p>
      <p>{$_('options.cloudVariables-local-help')}</p>
      <p>{$_('options.cloudVariables-ignore-help')}</p>
      <p>{$_('options.cloudVariables-custom-help')}</p>

      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.cloudVariables.specialCloudBehaviors}>
          {$_('options.specialCloudBehaviors')}
        </label>
        <LearnMore slug="packager/special-cloud-behaviors" />
      </div>

      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.cloudVariables.unsafeCloudBehaviors}>
          {$_('options.unsafeCloudBehaviors')}
        </label>
        <LearnMore slug="packager/special-cloud-behaviors#eval" />
      </div>
      {#if $options.cloudVariables.unsafeCloudBehaviors}
        <p class="warning">{$_('options.unsafeCloudBehaviorsWarning')}</p>
      {/if}
      <p>{$_('options.implicitCloudHint').replace('{cloud}', '☁')}</p>
    {:else}
      <p>{$_('options.noCloudVariables')}</p>
    {/if}
  </div>
</Section>

<Section
  accent="#FF6680"
  reset={() => {
    resetOptions([
      'compiler',
      'extensions',
      'bakeExtensions',
      'custom',
      'projectId',
      'maxTextureDimension'
    ]);
  }}
>
  <div>
    <h2>{$_('options.advancedOptions')}</h2>
    <details open={advancedOptionsInitiallyOpen}>
      <summary>{$_('options.advancedSummary')}</summary>

      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.compiler.enabled}>
          {$_('options.enableCompiler')}
        </label>
        <LearnMore slug="disable-compiler" />
      </div>
      <div class="option">
        <label>
          <input type="checkbox" bind:checked={$options.compiler.warpTimer}>
          {$_('options.warpTimer')}
        </label>
        <LearnMore slug="warp-timer" />
      </div>

      <!-- Ignore because CustomExtensions will have a <textarea> inside it -->
      <!-- svelte-ignore a11y-label-has-associated-control -->
      <label class="option">
        {$_('options.customExtensions')}
        <!-- TODO: use the user-facing documentation when that becomes available -->
        <LearnMore slug="development/custom-extensions" />
        <CustomExtensions bind:extensions={$options.extensions} />
        <p class="warning">{$_('options.customExtensionsSecurity')}</p>
      </label>

      <label class="option">
        <input type="checkbox" bind:checked={$options.bakeExtensions}>
        {$_('options.bakeExtensions')}
      </label>

      <label class="option">
        {$_('options.customCSS')}
        <textarea bind:value={$options.custom.css}></textarea>
      </label>
      <label class="option">
        {$_('options.customJS')}
        <textarea bind:value={$options.custom.js}></textarea>
      </label>

      <label class="option">
        {$_('options.projectId')}
        <input type="text" bind:value={$options.projectId}>
      </label>
      <p>{$_('options.projectIdHelp')}</p>

      <label class="option">
        <input type="checkbox" bind:checked={$options.packagedRuntime} />
        {$_('options.packagedRuntime')}
      </label>

      <label class="option">
        <input type="checkbox" checked={$options.maxTextureDimension !== defaultOptions.maxTextureDimension} on:change={(e) => {
          $options.maxTextureDimension = defaultOptions.maxTextureDimension * (e.target.checked ? 2 : 1);
        }} />
        {$_('options.maxTextureDimension')}
      </label>
    </details>
  </div>
</Section>

<Section
  accent="#0FBD8C"
  reset={() => {
    resetOptions([
      'target'
    ])
  }}
>
  <div>
    <h2>{$_('options.environment')}</h2>

    <div class="group">
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="html">
        {$_('options.html')}
      </label>
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="zip">
        {$_('options.zip')}
      </label>
    </div>

    <div class="group">
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="electron-win32">
        {$_('options.application-win32').replace('{type}', 'Electron')}
      </label>
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="webview-mac">
        {$_('options.application-mac').replace('{type}', 'WKWebView')}
      </label>
      <label class="option">
        <input type="radio" name="environment" bind:group={$options.target} value="electron-linux64">
        {$_('options.application-linux64').replace('{type}', 'Electron')}
      </label>
    </div>

    <details open={otherEnvironmentsInitiallyOpen}>
      <summary>{$_('options.otherEnvironments')}</summary>
      <p>{$_('options.otherEnvironmentsHelp')}</p>
      <div class="group">
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="zip-one-asset">
          {$_('options.zip-one-asset')}
        </label>
      </div>
      <div class="group">
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="cordova-android">
          Cordova Android APK
        </label>
      </div>
      <div class="group">
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="electron-win64">
          {$_('options.application-win64').replace('{type}', 'Electron')}
        </label>
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="electron-win-arm">
          {$_('options.application-win-arm').replace('{type}', 'Electron')}
        </label>
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="electron-mac">
          {$_('options.application-mac').replace('{type}', 'Electron')}
        </label>
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="electron-linux-arm32">
          {$_('options.application-linux-arm32').replace('{type}', 'Electron')}
        </label>
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="electron-linux-arm64">
          {$_('options.application-linux-arm64').replace('{type}', 'Electron')}
        </label>  
      </div>

      <div class="group">
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-win32">
          {$_('options.application-win32').replace('{type}', 'NW.js')}
        </label>
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-win64">
          {$_('options.application-win64').replace('{type}', 'NW.js')}
        </label>
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-mac">
          {$_('options.application-mac').replace('{type}', 'NW.js')}
        </label>
        <label class="option">
          <input type="radio" name="environment" bind:group={$options.target} value="nwjs-linux-x64">
          {$_('options.application-linux64').replace('{type}', 'NW.js')}
        </label>
      </div>
    </details>
  </div>
</Section>

{#if $options.target !== 'html'}
  <div in:fade|local>
    <Section
      accent="#FF661A"
      reset={$options.target.startsWith('zip') ? null : () => {
        resetOptions([
          'app.packageName',
          'app.windowMode',
          'app.escapeBehavior'
        ]);
      }}
    >
      <div>
        {#if $options.target.startsWith('zip')}
          <h2>Zip</h2>
          <p>The zip environment is intended to be used for publishing to a website. Other uses such as sending your project to a friend over a chat app or email should use "Plain HTML" instead as zip will not work.</p>
        {:else}
          <h2>{$_('options.applicationSettings')}</h2>
          <label class="option">
            {$_('options.packageName')}
            <input type="text" bind:value={$options.app.packageName} pattern="[\w \-]+" minlength="1">
          </label>
          <p>{$_('options.packageNameHelp')}</p>

          <!-- GitHub uploader inputs (仅在选择 Cordova Android APK 时显示) -->
          {#if $options.target === 'cordova-android'}
            <div class="github-uploader" style="margin-top:0.5rem;">
              <div>
                <p>如果您想手动构建您的安卓APK，请点击最下面的打包按钮，如果您想自动构建，请使用GitHub OAuth登录获取权限，然后点击自动构建按钮。</p>
              </div>

              <!-- OAuth Section -->
              {#if !oauthUserInfo}
                <div class="oauth-section" style="margin: 1rem 0; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
                  <h4 style="margin: 0 0 0.5rem 0; color: #333;">GitHub OAuth 认证</h4>
                  <p style="margin: 0 0 1rem 0; font-size: 0.9rem; color: #666;">
                    点击下方按钮使用GitHub OAuth安全获取构建权限，无需手动输入Token。
                  </p>
                  {#if oauthError}
                    <div style="color: #d32f2f; margin-bottom: 1rem; padding: 0.5rem; background: #ffebee; border-radius: 4px; font-size: 0.9rem;">
                      {oauthError}
                    </div>
                  {/if}
                  <button
                    on:click={startOAuth}
                    disabled={oauthInProgress}
                    style="background: #24292e; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 1rem; display: inline-flex; align-items: center; gap: 0.5rem;"
                  >
                    {#if oauthInProgress}
                      <span>认证中...</span>
                    {:else}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      使用 GitHub 登录
                    {/if}
                  </button>
                </div>
              {:else}
                <div class="oauth-user-info" style="margin: 1rem 0; padding: 1rem; border: 1px solid #4caf50; border-radius: 8px; background: #e8f5e8;">
                  <h4 style="margin: 0 0 0.5rem 0; color: #2e7d32;">已认证用户</h4>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    {#if oauthUserInfo.user.avatar_url}
                      <img src={oauthUserInfo.user.avatar_url} alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%;" />
                    {/if}
                    <div>
                      <div style="font-weight: 500; color: #2e7d32;">{oauthUserInfo.user.login}</div>
                      <div style="font-size: 0.8rem; color: #666;">{oauthUserInfo.email}</div>
                    </div>
                    <button
                      on:click={logoutOAuth}
                      style="margin-left: auto; background: #f44336; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              {/if}

              <div style="margin-top:0.25rem;">
                <button on:click={packAndUpload} disabled={uploadInProgress || !oauthUserInfo}>
                  {#if uploadInProgress}打包并上传...{:else}Github自动构建{/if}
                </button>
              </div>
              <div class="upload-status">
                {#if createdRepoUrl}
                  <div>仓库已创建: <a href={createdRepoUrl} target="_blank" rel="noopener">{createdRepoUrl}</a></div>
                {/if}
                {#if releaseUrl}
                  <div>构建产物 Release: <a href={releaseUrl} target="_blank" rel="noopener">{assetName ? assetName : releaseUrl}</a></div>
                {/if}
                {#if uploadError}
                  <div style="color:tomato">错误: {uploadError}</div>
                {/if}
              </div>
              <!-- 操作日志面板，仅在此上传区域显示 -->
              <div class="log-panel" style="margin-top:0.5rem;">
                <div style="font-weight:bold;margin-bottom:6px;">操作日志</div>
                <div class="log-entries" aria-live="polite">
                  {#if logs.length === 0}
                    <div class="log-entry info">暂无日志</div>
                  {:else}
                    {#each logs as l}
                      <div class="log-entry {l.level}">{l.time} [{l.level}] {l.msg}</div>
                    {/each}
                  {/if}
                </div>
                <div class="log-controls">
                  <button on:click={copyLogs} disabled={logs.length === 0}>复制日志</button>
                  <button on:click={() => { logs = []; }}>清空日志</button>
                  <div style="margin-left:auto;font-size:12px;color:#666;align-self:center;">显示最新 {MAX_LOGS} 条</div>
                </div>
              </div>
              {#if showReleaseModal}
                <div class="release-modal" style="border:1px solid #ccc;padding:0.5rem;margin-top:0.5rem;background:#fff;">
                  <div><strong>构建完成</strong></div>
                  {#if assetName}
                    <div>产物: {assetName}</div>
                  {/if}
                  {#if assetDownloadUrl}
                    <div>下载链接: <a href={assetDownloadUrl} target="_blank" rel="noopener">{assetDownloadUrl}</a></div>
                  {/if}
                  {#if releaseUrl}
                    <div>Release 页面: <a href={releaseUrl} target="_blank" rel="noopener">{releaseUrl}</a></div>
                  {/if}
                  <div style="margin-top:0.5rem;">
                    <button on:click={() => { navigator.clipboard && assetDownloadUrl && navigator.clipboard.writeText(assetDownloadUrl); }}>复制下载链接</button>
                    <button on:click={() => { showReleaseModal = false; }}>关闭</button>
                    <button on:click={deleteRepoFromUI}>删除临时仓库</button>
                  </div>
                  {#if uploadError}
                    <div style="color:tomato">错误: {uploadError}</div>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}

          <label class="option">
            {$_('options.version')}
            <input type="text" class="version" bind:value={$options.app.version} pattern="\d+\.\d+\.\d+" placeholder="1.0.0" minlength="1">
          </label>
          <p>{$_('options.versionHelp')}</p>

          {#if $options.target.includes('electron')}
            <label class="option">
              {$_('options.initalWindowSize')}
              <select bind:value={$options.app.windowMode}>
                <option value="window">{$_('options.startWindow')}</option>
                <option value="maximize">{$_('options.startMaximized')}</option>
                <option value="fullscreen">{$_('options.startFullscreen')}</option>
              </select>
            </label>

            <label class="option">
              {$_('options.escapeBehavior')}
              <select bind:value={$options.app.escapeBehavior}>
                <option value="unfullscreen-only">{$_('options.unFullscreenOnly')}</option>
                <option value="exit-only">{$_('options.exitOnly')}</option>
                <option value="unfullscreen-or-exit">{$_('options.unFullscreenOrExit')}</option>
                <option value="nothing">{$_('options.doNothing')}</option>
              </select>
            </label>

            <label class="option">
              {$_('options.windowControls')}
              <select bind:value={$options.app.windowControls}>
                <option value="default">{$_('options.defaultControls')}</option>
                <option value="frameless">{$_('options.noControls')}</option>
              </select>
            </label>
          {/if}

          <div class="warning">
            <div>Creating native applications for specific platforms is discouraged. In most cases, Plain HTML or Zip will have numerous advantages:</div>
            <ul>
              <li>Can be run directly from a website on any platform, even phones</li>
              <li>Users are significantly less likely to be suspicious of a virus</li>
              <li>Significantly smaller file size</li>
              <li>Can still be downloaded locally and run offline</li>
            </ul>
            <div>If you don't truly need to make a self-contained application for each platform (we understand there are some cases where this is necessary), we recommend you don't.</div>
          </div>

          {#if $options.target.includes('win')}
            <div>
              <h2>Windows</h2>
              <p>All Windows applications generated by this site are unsigned, so users will see SmartScreen warnings when they try to run it for the first time. They can bypass these warnings by pressing "More info" then "Run anyways".</p>
              <p>To change the icon of the executable file or create an installer program, download and run <a href="https://github.com/TurboWarp/packager-extras/releases">TurboWarp Packager Extras</a> and select the output of this website.</p>
            </div>
          {:else if $options.target.includes('mac')}
            <div>
              <h2>macOS</h2>
              <p>Due to Apple policy, packaging for their platforms is troublesome. You either have to:</p>
              <ul>
                <li>Instruct users to ignore scary Gatekeeper warnings by opening Finder > Navigating to the application > Right click > Open > Open. This website generates applications that require this workaround.</li>
                <li>Or pay Apple $100/year for a developer account to sign and notarize the app (very involved process; reach out in feedback for more information)</li>
              </ul>
            </div>
          {:else if $options.target.includes('linux')}
            <div>
              <h2>Linux</h2>
              <p>Linux support is still experimental.</p>
            </div>
          {/if}

          {#if $options.target.includes('electron')}
            <div>
              <h2>Electron</h2>
              <p>The Electron environment works by embedding a copy of Chromium (the open source part of Google Chrome) along with your project, which means the app will be very large.</p>

              {#if $options.target.includes('win')}
                {#if $options.target.includes('32')}
                  <p>Note: You have selected the 32-bit or 64-bit mode. This maximizes device compatibility but limits the amount of memory the app can use. If you encounter crashes, try going into "Other environments" and using the 64-bit only mode instead.</p>
                {/if}
              {:else if $options.target.includes('mac')}
                <p>On macOS, the app will run natively on both Intel Silicon and Apple Silicon Macs.</p>
              {:else if $options.target.includes('linux')}
                <p>On Linux, the application can be started by running <code>start.sh</code></p>
              {/if}
            </div>
          {:else if $options.target.includes('nwjs')}
            <div>
              <h2>NW.js</h2>
              <p class="warning">NW.js support is deprecated and may be removed in the future. Use the Electron environments instead. They're better in every way.</p>
              <p>The NW.js environment works by embedding a copy of Chromium (the open source part of Google Chrome) along with your project, which means the app will be very large.</p>
              <p>For further help and steps, see <a href="https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#linux">NW.js Documentation</a>.</p>
              {#if $options.target.includes('mac')}
                <p>On macOS, the app will run using Rosetta on Apple Silicon Macs.</p>
              {/if}
            </div>
          {:else if $options.target.includes('webview-mac')}
            <div>
              <h2>WKWebView</h2>
              <p>WKWebView is the preferred way to package for macOS. It will be hundreds of MB smaller than the other macOS-specific environments and typically run the fastest.</p>
              <p>The app will run natively on both Intel and Apple silicon Macs running macOS 10.13 or later.</p>
              <p>Note that:</p>
              <ul>
                <li>Video sensing and loudness blocks will only work in macOS 12 or later.</li>
                <li>Pointer lock will not work.</li>
                <li>Extremely large projects might not work properly.</li>
              </ul>
              <p>Use the "Electron macOS Application" (inside Other environments) or "Plain HTML" environments instead if you encounter these issues.</p>
            </div>
          {/if}
        {/if}
      </div>
    </Section>
  </div>
{/if}

{#if projectData.project.analysis.usesSteamworks}
  <Section
    accent="#136C9F"
    reset={() => {
      resetOptions([
        'steamworks'
      ]);
    }}
  >
    <h2>{$_('options.steamworksExtension')}</h2>
    {#if ['electron-win64', 'electron-linux64', 'electron-mac'].includes($options.target)}
      <p>{$_('options.steamworksAvailable').replace('{n}', '480')}</p>
      <label class="option">
        {$_('options.steamworksAppId')}
        <input pattern="\d+" minlength="1" bind:value={$options.steamworks.appId}>
      </label>
      <label class="option">
        {$_('options.steamworksOnError')}
        <select bind:value={$options.steamworks.onError}>
          <option value="ignore">{$_('options.steamworksIgnore')}</option>
          <option value="warning">{$_('options.steamworksWarning')}</option>
          <option value="error">{$_('options.steamworksError')}</option>
        </select>
      </label>

      {#if $options.target === 'electron-mac'}
        <p class="warning">
          {$_('options.steamworksMacWarning')}
        </p>
      {/if}
    {:else}
      <p>{$_('options.steamworksUnavailable')}</p>
      <ul>
        <li>{$_('options.application-win64').replace('{type}', 'Electron')}</li>
        <li>
          {$_('options.application-mac').replace('{type}', 'Electron')}
          <br>
          {$_('options.steamworksMacWarning')}
        </li>
        <li>{$_('options.application-linux64').replace('{type}', 'Electron')}</li>
      </ul>
    {/if}

    <p>
      <a href="https://extensions.turbowarp.org/steamworks">{$_('options.steamworksDocumentation')}</a>
    </p>
  </Section>
{/if}

<Section>
  <DropArea on:drop={(e) => importOptionsFromDataTransfer(e.detail)}>
    <div class="buttons">
      <div class="button">
        <Button on:click={exportOptions} secondary text={$_('options.export')} />
      </div>
      <div class="button">
        <Button on:click={importOptions} secondary text={$_('options.import')} />
      </div>
      <div class="side-buttons">
        <Button on:click={resetAll} dangerous text={$_('options.resetAll')} />
      </div>
    </div>
  </DropArea>
</Section>

<Section>
  <div class="buttons">
    <div class="button">
      <Button on:click={pack} text={$_('options.package')} />
    </div>
    <div clas="button">
      <Button on:click={preview} secondary text={$_('options.preview')} />
    </div>
  </div>
  <!-- Log panel was moved into the GitHub uploader area when Cordova Android is selected -->
</Section>

{#if result}
  <Downloads
    name={result ? result.filename : null}
    url={result ? result.url : null}
    blob={result ? result.blob : null}
  />
{:else if !$progress.visible}
  <Section caption>
    <p>{$_('options.downloadsWillAppearHere')}</p>
  </Section>
{/if}
