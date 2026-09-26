const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end(); return; }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(8083, async () => {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--no-sandbox',
    '--disable-gpu',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1000));
  const resp = await fetch('http://127.0.0.1:9225/json/version');
  const { webSocketDebuggerUrl } = await resp.json();
  const ws = new WebSocket(webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise(res => {
    const curId = id++;
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        res(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  const sendS = (method, params = {}) => new Promise(res => {
    const curId = id++;
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        res(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, sessionId, method, params }));
  });

  await sendS('Page.enable');
  await sendS('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await sendS('Page.navigate', { url: 'http://localhost:8083/index.html' });
  await new Promise(r => setTimeout(r, 3000));

  const info = await sendS('Runtime.evaluate', {
    expression: `(() => {
      const lp = document.querySelector('.landingpage');
      const h1 = document.querySelector('h1');
      return JSON.stringify({
        htmlClass: document.documentElement.className,
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        bodyColor: window.getComputedStyle(document.body).color,
        lpOpacity: lp ? window.getComputedStyle(lp).opacity : null,
        lpRect: lp ? lp.getBoundingClientRect() : null,
        h1Text: h1 ? h1.innerText : null,
        h1Color: h1 ? window.getComputedStyle(h1).color : null
      });
    })()`
  });
  console.log('Result:', info.result.value);

  const shot = await sendS('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshots/test_375.png', Buffer.from(shot.data, 'base64'));

  chrome.kill();
  server.close();
  process.exit(0);
});
