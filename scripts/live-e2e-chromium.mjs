import { spawn } from 'node:child_process';
import { rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9222;
const FRONTEND_URL = 'http://127.0.0.1:5173';
const BACKEND_HEALTH_URL = 'http://127.0.0.1:8080/api/v1/health';

// Verify backend health first
console.log('--- Step 1: Checking Backend Health ---');
const healthRes = await fetch(BACKEND_HEALTH_URL);
if (!healthRes.ok) {
  throw new Error(`Backend not healthy: ${healthRes.status}`);
}
const healthJson = await healthRes.json();
console.log('Backend health status:', healthJson.status);

// Verify frontend availability
console.log('\n--- Step 2: Checking Frontend Dev Server ---');
const frontendRes = await fetch(FRONTEND_URL);
if (!frontendRes.ok) {
  throw new Error(`Frontend server returned status: ${frontendRes.status}`);
}
console.log('Frontend dev server status:', frontendRes.status);

// Launch Chrome Headless
console.log('\n--- Step 3: Launching Headless Chromium ---');
const userDataDir = join(tmpdir(), `chrome_e2e_${Date.now()}`);
mkdirSync(userDataDir, { recursive: true });

const chromeProcess = spawn(
  CHROME_PATH,
  [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
);

// Wait for CDP to be ready
let cdpReady = false;
for (let i = 0; i < 20; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    if (res.ok) {
      const v = await res.json();
      console.log('Chromium CDP Ready:', v.Browser);
      cdpReady = true;
      break;
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 250));
}

if (!cdpReady) {
  chromeProcess.kill('SIGKILL');
  throw new Error('Failed to connect to Chromium CDP on port 9222');
}

// Open new tab navigating to frontend
console.log('\n--- Step 4: Connecting to Frontend via CDP ---');
const targetRes = await fetch(
  `http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(FRONTEND_URL)}`,
  { method: 'PUT' }
);
const target = await targetRes.json();
console.log('Opened Tab Target:', target.id);

const ws = new WebSocket(target.webSocketDebuggerUrl);

await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let msgId = 1;
const pending = new Map();
const consoleErrors = [];

ws.onmessage = (evt) => {
  const msg = JSON.parse(evt.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  }

  if (msg.method === 'Runtime.consoleAPICalled') {
    const type = msg.params.type;
    const text = msg.params.args.map((a) => a.value ?? a.description).join(' ');
    if (type === 'error') {
      console.error('[BROWSER ERROR]', text);
      consoleErrors.push(text);
    } else {
      console.log(`[BROWSER ${type.toUpperCase()}]`, text);
    }
  }

  if (msg.method === 'Runtime.exceptionThrown') {
    const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
    console.error('[BROWSER UNCAUGHT EXCEPTION]', desc);
    consoleErrors.push(desc);
  }
};

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

// Enable Runtime and Page
await send('Runtime.enable');
await send('Page.enable');

// Wait for page load
await new Promise((r) => setTimeout(r, 1500));

async function evalScript(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

// Helper to click button by aria-label or text
async function clickButton(label) {
  const result = await evalScript(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        b => b.getAttribute('aria-label') === "${label}" || b.textContent.trim() === "${label}"
      );
      if (!btn) return false;
      btn.click();
      return true;
    })()
  `);
  if (!result) throw new Error(`Button "\${label}" not found`);
  await new Promise((r) => setTimeout(r, 200));
}

async function getDisplayValue() {
  return await evalScript(`
    document.querySelector('[data-testid="calculator-display"]')?.textContent?.trim() || ''
  `);
}

async function getExpressionPreview() {
  return await evalScript(`
    document.querySelector('.text-xs.font-mono.text-slate-400')?.textContent?.trim() || ''
  `);
}

async function waitForDisplayValue(expected, timeoutMs = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const val = await getDisplayValue();
    if (val === expected) return val;
    await new Promise((r) => setTimeout(r, 100));
  }
  const actual = await getDisplayValue();
  throw new Error(`Timeout waiting for display "${expected}", actual: "${actual}"`);
}

console.log('\n--- Step 5: Executing E2E Verification Scenarios ---');

// Test Case 1: IEEE 754 Precision (0.1 + 0.2 = 0.3)
console.log('\n[E2E Test Case 1]: IEEE 754 Decimal Precision (0.1 + 0.2 = 0.3)');
await clickButton('0');
await clickButton('Decimal Point');
await clickButton('1');
await clickButton('Add');
await clickButton('0');
await clickButton('Decimal Point');
await clickButton('2');
await clickButton('Equals');

await waitForDisplayValue('0.3');
const expr1 = await getExpressionPreview();
console.log(`✓ Display: "${await getDisplayValue()}", Expression: "${expr1}"`);
if (expr1 !== '0.1 + 0.2 = 0.3') {
  throw new Error(`Expected expression "0.1 + 0.2 = 0.3", got "${expr1}"`);
}

// Verify History contains 0.1 + 0.2 = 0.3
const historyOpened = await evalScript(`
  (() => {
    const toggle = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Calculation History'));
    if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
    return true;
  })()
`);
await new Promise((r) => setTimeout(r, 300));
const historyContains = await evalScript(`
  document.body.innerText.includes('0.1 + 0.2 = 0.3')
`);
console.log('✓ Calculation History verified in DOM:', historyContains);
if (!historyContains) throw new Error('Calculation History does not contain 0.1 + 0.2 = 0.3');

// Test Case 2: Advanced Operations (Square Root & Power)
console.log('\n[E2E Test Case 2]: Advanced Operations (sqrt(144) = 12, 12 ^ 2 = 144)');
await clickButton('Clear All');
await waitForDisplayValue('0');

await clickButton('1');
await clickButton('4');
await clickButton('4');
await clickButton('Square Root');
await waitForDisplayValue('12');
console.log(`✓ Square Root: "${await getDisplayValue()}" (sqrt(144) = 12)`);

await clickButton('Power');
await clickButton('2');
await clickButton('Equals');
await waitForDisplayValue('144');
console.log(`✓ Power: "${await getDisplayValue()}" (12 ^ 2 = 144)`);

// Test Case 3: Live 422 Domain Error Banner (42 / 0 -> ERR_DIVISION_BY_ZERO)
console.log('\n[E2E Test Case 3]: Domain Error Handling (42 ÷ 0 -> ERR_DIVISION_BY_ZERO)');
await clickButton('Clear All');
await waitForDisplayValue('0');

await clickButton('4');
await clickButton('2');
await clickButton('Divide');
await clickButton('0');
await clickButton('Equals');

// Wait for error banner
await new Promise((r) => setTimeout(r, 500));
const errorBannerInfo = await evalScript(`
  (() => {
    const banner = document.querySelector('[data-testid="error-banner"]');
    if (!banner) return null;
    return {
      role: banner.getAttribute('role'),
      ariaLive: banner.getAttribute('aria-live'),
      text: banner.innerText
    };
  })()
`);

console.log('✓ Error Banner Detected:', errorBannerInfo);
if (!errorBannerInfo || !errorBannerInfo.text.includes('ERR_DIVISION_BY_ZERO')) {
  throw new Error('ERR_DIVISION_BY_ZERO banner was not displayed on division by zero');
}

// Dismiss error
await clickButton('Dismiss error');
await new Promise((r) => setTimeout(r, 200));
const isDismissed = await evalScript(`!document.querySelector('[data-testid="error-banner"]')`);
console.log('✓ Error Banner Dismissed:', isDismissed);
if (!isDismissed) throw new Error('Error banner not dismissed');

// Test Case 4: Keyboard Navigation & Percentage (5, 0, % -> 0.5)
console.log('\n[E2E Test Case 4]: Keyboard Navigation & Percentage (5 0 % -> 0.5)');
await clickButton('Clear All');
await waitForDisplayValue('0');

async function sendKey(key) {
  await evalScript(`
    window.dispatchEvent(new KeyboardEvent('keydown', { key: "${key}", bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 200));
}

await sendKey('5');
await sendKey('0');
await sendKey('%');

await waitForDisplayValue('0.5');
console.log(`✓ Keyboard Input Result: "${await getDisplayValue()}" (50% = 0.5)`);

// Verify Responsive Layout / No Overflow
const overflowCheck = await evalScript(`
  (() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    return { docWidth, winWidth, hasOverflow: docWidth > winWidth };
  })()
`);
console.log('✓ Layout Viewport & Overflow Check:', overflowCheck);
if (overflowCheck.hasOverflow) {
  throw new Error('Horizontal page overflow detected!');
}

// Verify Console Errors
console.log('\n--- Step 6: Console Error Audit ---');
console.log(`Total Browser Console Errors: ${consoleErrors.length}`);
if (consoleErrors.length > 0) {
  throw new Error(`Console errors detected: ${JSON.stringify(consoleErrors)}`);
}
console.log('✓ 0 Console Errors Verified!');

// Teardown
ws.close();
chromeProcess.kill('SIGKILL');
try {
  rmSync(userDataDir, { recursive: true, force: true });
} catch {}

console.log('\n========================================');
console.log('ALL E2E CHROMIUM TESTS PASSED CLEANLY!  ');
console.log('========================================');
