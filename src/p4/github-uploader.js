export async function uploadAndBuildFromTemplate(opts, progressCallback = null) {
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
  const repoName = `packager-temp-${rand}`;

  const genUrl = `${apiBase}/repos/${templateOwner}/${templateRepo}/generate`;

  const progress = (msg) => {
    try {
      if (typeof progressCallback === 'function') progressCallback(msg);
    } catch (e) {
      // ignore
    }
  };
  // First, check if the user is an organization or personal account
  progress('正在检查用户类型...');
  const userResp = await fetch(`${apiBase}/users/${githubUser}`, {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: 'application/vnd.github+json'
    }
  });

  if (!userResp.ok) {
    throw new Error(`无法获取用户信息: ${userResp.status}`);
  }

  const userData = await userResp.json();
  const isOrg = userData.type === 'Organization';

  // Generate a new repo from the template
  progress(`正在从模板仓库生成新仓库${isOrg ? ' (组织)' : ''}...`);

  const generateResp = await fetch(genUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${githubToken}`,
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
    throw new Error(`无法从模板生成仓库 (status: ${generateResp.status}). 错误: ${genErr}`);
  }

  const genJson = await generateResp.json();
  const createdRepoUrl = genJson.html_url || `https://github.com/${githubUser}/${repoName}`;
  progress(`仓库已从模板生成: ${createdRepoUrl}`);

  // Add the GitHub Actions workflow file directly
  progress('正在添加构建工作流...');
  const workflowContent = `name: Cordova Build

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

permissions:
  # required to modify releases
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      # Check out the repository code
      - name: Checkout code
        uses: actions/checkout@v4

      # Set up Node.js
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Set up Java 17
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'adopt'

      # Set up Android SDK and Build Tools
      - name: Set up Android SDK
        uses: android-actions/setup-android@v3
        with:
          cmdline-tools-version: 'latest'

      # Install Android Build Tools
      - name: Install Android Build Tools
        run: |
          sdkmanager "build-tools;30.0.3" "platform-tools" "platforms;android-33"
        env:
          ANDROID_HOME: \${{ env.ANDROID_HOME }}
          ANDROID_SDK_ROOT: \${{ env.ANDROID_HOME }}

      # Set up Gradle
      - name: Set up Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '7.6.5' # Specify a stable Gradle version compatible with Android builds

      # Install Cordova globally
      - name: Install Cordova
        run: npm install -g cordova

      # Find and unzip the project's zip file
      - name: Unzip project
        run: |
          ZIP_FILE=\$(find . -maxdepth 1 -name "*.zip" -type f)
          if [ -z "\$ZIP_FILE" ]; then
            echo "No zip file found"
            exit 1
          fi
          unzip "\$ZIP_FILE" -d project
          rm "\$ZIP_FILE"

      # Navigate to unzipped project directory and run npm install
      - name: Install dependencies
        run: |
          cd project
          npm install

      # Run npm build
      - name: Build project
        run: |
          cd project
          npm run build
        env:
          ANDROID_HOME: \${{ env.ANDROID_HOME }}
          ANDROID_SDK_ROOT: \${{ env.ANDROID_HOME }}

      - name: Upload artifacts to tag
        uses: xresloader/upload-to-github-release@2bcae85344d41e21f7fc4c47fa2ed68223afdb49
        with:
          file: ./project/platforms/android/app/build/outputs/apk/debug/app-debug.apk
          draft: false
          tag_name: "deep-sea-build"`;

  const workflowResp = await fetch(`${apiBase}/repos/${githubUser}/${repoName}/contents/.github/workflows/${workflowId}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${githubToken}`,
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
  progress(`开始上传打包文件 ${name} 到仓库 ${githubUser}/${repoName} ...`);
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  const base64 = btoa(binary);

  const putUrl = `${apiBase}/repos/${githubUser}/${repoName}/contents/${encodeURIComponent(name)}`;
  const putResp = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${githubToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({ message: `Upload ${name} via packager`, content: base64 })
  });
  if (!putResp.ok) {
    const err = await putResp.text();
    throw new Error(`上传文件失败: ${putResp.status} ${err}`);
  }
  progress('打包文件上传完成');

  // 3) Trigger workflow dispatch
  const dispatchUrl = `${apiBase}/repos/${githubUser}/${repoName}/actions/workflows/${workflowId}/dispatches`;
  const dispatchResp = await fetch(dispatchUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${githubToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json'
    },
    body: JSON.stringify({ ref: 'main' })
  });
  if (![204,201,202].includes(dispatchResp.status)) {
    const err = await dispatchResp.text();
    throw new Error(`触发 workflow 失败: ${dispatchResp.status} ${err}`);
  }
  progress('已触发 GitHub Actions workflow，开始轮询执行状态...');

  // 4) Poll for latest run and wait for conclusion
  const runsUrlBase = `${apiBase}/repos/${githubUser}/${repoName}/actions/runs`;
  let runId = null;
  let attempt = 0;
  let runObj = null;
  while (attempt < pollMaxAttempts) {
    attempt++;
    await new Promise(r => setTimeout(r, attempt === 1 ? 2000 : pollIntervalMs));
    const runsResp = await fetch(`${runsUrlBase}?per_page=1`, {
      headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' }
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
    const runResp = await fetch(`${apiBase}/repos/${githubUser}/${repoName}/actions/runs/${runId}`, {
      headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' }
    });
    if (!runResp.ok) continue;
    runObj = await runResp.json();
    const status = runObj.status;
    const conclusion = runObj.conclusion;
  progress(`工作流状态: ${status} 结论: ${conclusion || 'pending'}`);
    if (conclusion === 'success') break;
    if (conclusion && (conclusion === 'failure' || conclusion === 'cancelled' || conclusion === 'timed_out')) {
      throw new Error(`Workflow finished with conclusion: ${conclusion}`);
    }
    // otherwise keep polling
  }
  if (!runObj || runObj.conclusion !== 'success') {
    throw new Error('Workflow did not complete successfully in time');
  }

  progress('工作流执行成功，尝试获取 Release 及其资产...');

  // 5) Get latest release for the repo
  const releaseResp = await fetch(`${apiBase}/repos/${githubUser}/${repoName}/releases/latest`, {
    headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' }
  });
  if (!releaseResp.ok) {
    const err = await releaseResp.text();
    throw new Error(`获取 release 失败: ${releaseResp.status} ${err}`);
  }
  const releaseJson = await releaseResp.json();
  if (!releaseJson.assets || releaseJson.assets.length === 0) {
    throw new Error('未找到 release 资产');
  }
  const asset = releaseJson.assets[0];
  const downloadUrl = asset.browser_download_url;

  progress(`找到 release 资产: ${asset.name}`);

  // Do not auto-download asset in the browser. Return the asset download URL so the UI can present it to the user.
  const assetDownloadUrl = downloadUrl;

  // Optionally delete the repo only if explicitly requested (default: false)
  if (autoDelete) {
    try {
      const delResp = await fetch(`${apiBase}/repos/${githubUser}/${repoName}`, {
        method: 'DELETE',
        headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' }
      });
      if (!delResp.ok) {
        const errorData = await delResp.json().catch(() => ({}));
        console.warn('删除临时仓库失败:', errorData.message || `HTTP ${delResp.status}`);
        progress(`警告: 无法自动删除临时仓库，请手动删除: ${createdRepoUrl}`);
      } else {
        progress('临时仓库已自动删除');
      }
    } catch (e) {
      console.warn('删除临时仓库时发生错误:', e);
      progress(`警告: 无法自动删除临时仓库，请手动删除: ${createdRepoUrl}`);
    }
  }

  // Return links for UI
  return {
    createdRepoUrl,
    releaseUrl: releaseJson.html_url || `${createdRepoUrl}/releases/latest`,
    assetName: asset.name,
    assetDownloadUrl
  };
}
