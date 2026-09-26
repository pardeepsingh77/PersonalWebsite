const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 1. Static file server
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(8080, async () => {
  console.log('Static server listening on http://localhost:8080');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(__dirname, 'scratch_chrome_user_data');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    'about:blank'
  ]);

  // Wait for remote debugging to be ready
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const resp = await fetch('http://127.0.0.1:9222/json/version');
      const data = await resp.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Chrome debugging port');
    chrome.kill();
    server.close();
    process.exit(1);
  }

  console.log('Connected to Chrome via CDP:', wsUrl);

  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pending = new Map();
  const consoleMessages = [];
  const uncaughtErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
      consoleMessages.push({ type: msg.params.type, text });
      console.log(`[Browser Console ${msg.params.type}]`, text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const details = msg.params.exceptionDetails;
      uncaughtErrors.push(details);
      console.error('[Browser Exception]', details.text, details.exception?.description);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise(r => ws.onopen = r);

  // Create a new target page
  const targetResp = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = targetResp.targetId;
  const attachResp = await send('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = attachResp.sessionId;

  function sendSession(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');
  await sendSession('Log.enable');

  const pages = ['index.html', 'projects.html'];
  const viewports = [
    { width: 375, height: 812, name: '375px (Mobile)' },
    { width: 768, height: 1024, name: '768px (Tablet)' },
    { width: 1280, height: 800, name: '1280px (Desktop)' }
  ];

  fs.mkdirSync(path.join(__dirname, 'screenshots'), { recursive: true });

  for (const pageName of pages) {
    console.log(`\n================ Testing ${pageName} ================`);
    for (const vp of viewports) {
      console.log(`Testing ${pageName} at ${vp.name}...`);
      await sendSession('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width <= 768
      });

      await sendSession('Page.navigate', { url: `http://localhost:8080/${pageName}` });
      await new Promise(r => setTimeout(r, 1500)); // wait for fonts/animations

      // Check document title and heading
      const titleRes = await sendSession('Runtime.evaluate', { expression: 'document.title' });
      const h1Res = await sendSession('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("h1")).map(h => h.innerText)'
      });
      const brokenImgs = await sendSession('Runtime.evaluate', {
        expression: 'Array.from(document.querySelectorAll("img")).filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src)'
      });

      console.log(`  Page Title: "${titleRes?.result?.value}"`);
      console.log(`  h1 elements count: ${h1Res?.result?.value?.length}, values: ${JSON.stringify(h1Res?.result?.value)}`);
      if (brokenImgs?.result?.value?.length > 0) {
        console.warn(`  Broken images:`, brokenImgs.result.value);
      } else {
        console.log(`  All images loaded successfully!`);
      }

      // Capture screenshot
      const shot = await sendSession('Page.captureScreenshot', { format: 'png' });
      const shotPath = path.join(__dirname, 'screenshots', `${pageName.replace('.html','')}_${vp.width}px.png`);
      fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
      console.log(`  Screenshot saved: ${shotPath}`);
    }
  }

  console.log('\n================ Summary ================');
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Total uncaught errors: ${uncaughtErrors.length}`);
  if (uncaughtErrors.length === 0) {
    console.log('SUCCESS: Zero uncaught console errors found!');
  } else {
    console.error('FAILED: Uncaught errors were detected!');
  }

  // Cleanup
  chrome.kill();
  server.close();
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch (e) {}

  process.exit(uncaughtErrors.length === 0 ? 0 : 1);
});
