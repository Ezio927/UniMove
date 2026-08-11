// Browser regression check for Ant Design portals under reduced-motion settings.
// Run a local frontend and a Chromium browser with remote debugging on port 9333.
const endpoint = process.env.CHROMIUM_CDP_URL ?? 'http://127.0.0.1:9333/json/list';
const baseUrl = process.env.UNIMOVE_URL;

if (!baseUrl) {
  throw new Error('UNIMOVE_URL must point to the frontend build under test');
}
const pages = await fetch(endpoint).then((response) => response.json());
const page = pages.find((candidate) => candidate.type === 'page');

if (!page) {
  throw new Error('No debuggable Edge page found');
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const browserEvents = [];
let nextId = 1;

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown' || message.method === 'Log.entryAdded') {
    browserEvents.push(message);
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(JSON.stringify(message.error)));
  else resolve(message.result);
});

function command(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }
  return result.result.value;
}

async function waitFor(expression, timeoutMs = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function navigate(url) {
  await command('Page.navigate', { url });
  await waitFor("document.readyState === 'complete'");
}

const popupSnapshot = `(selector => [...document.querySelectorAll(selector)].map((element, index) => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    index,
    className: element.className,
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
    pointerEvents: style.pointerEvents,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    text: element.innerText,
  };
}))(SELECTOR)`;

await command('Page.enable');
await command('Runtime.enable');
await command('Log.enable');
await command('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
await navigate(`${baseUrl}/`);
const reducedMotion = await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches");
if (!reducedMotion) {
  throw new Error('Chromium did not enable the reduced-motion test condition');
}
await evaluate(`localStorage.setItem('token', 'diagnostic-token'); localStorage.setItem('user', JSON.stringify({ id: 'diagnostic-admin', username: 'Diagnostic Admin', email: 'diagnostic@example.com', role: 'admin' })); location.reload(); true;`);
await waitFor("document.querySelector('.user-button') !== null");

const userBefore = await evaluate("document.querySelector('.user-button')?.getAttribute('aria-expanded')");
await evaluate("document.querySelector('.user-button')?.click(); true");
await new Promise((resolve) => setTimeout(resolve, 500));
const userAfter = await evaluate("document.querySelector('.user-button')?.getAttribute('aria-expanded')");
const dropdowns = await evaluate(popupSnapshot.replace('SELECTOR', "'.ant-dropdown'"));
const manualPopupReset = await evaluate(`(() => {
  const popup = document.querySelector('.ant-dropdown');
  const originalCssText = popup.style.cssText;
  popup.style.left = '0px';
  popup.style.top = '0px';
  popup.style.right = 'auto';
  popup.style.bottom = 'auto';
  popup.style.overflow = 'hidden';
  const rect = popup.getBoundingClientRect();
  const style = getComputedStyle(popup);
  const result = {
    cssText: popup.style.cssText,
    computed: {
      position: style.position,
      top: style.top,
      right: style.right,
      bottom: style.bottom,
      left: style.left,
      transform: style.transform,
      translate: style.translate,
      transitionProperty: style.transitionProperty,
      transitionDuration: style.transitionDuration,
      animationName: style.animationName,
      animationDuration: style.animationDuration,
    },
    animations: popup.getAnimations().map(animation => ({
      playState: animation.playState,
      currentTime: animation.currentTime,
      effect: animation.effect?.getKeyframes?.(),
    })),
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
  };
  popup.style.cssText = originalCssText;
  return result;
})()`);
const userTrigger = await evaluate(`(() => {
  const element = document.querySelector('.user-button');
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  let rectAssignment;
  try {
    const originalX = rect.x;
    rect.x = originalX;
    rectAssignment = 'accepted';
  } catch (error) {
    rectAssignment = String(error);
  }
  return {
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    offsetParent: element.offsetParent?.tagName,
    display: style.display,
    visibility: style.visibility,
    rectAssignment,
    documentVisibility: document.visibilityState,
    popupStyle: document.querySelector('.ant-dropdown')?.getAttribute('style'),
  };
})()`);
await evaluate("window.dispatchEvent(new Event('resize')); true");
await new Promise((resolve) => setTimeout(resolve, 500));
const dropdownsAfterResize = await evaluate(popupSnapshot.replace('SELECTOR', "'.ant-dropdown'"));

let categorySelect;
try {
  await navigate(`${baseUrl}/activities/create`);
  await waitFor("document.querySelector('.ant-select-selector') !== null");
  await evaluate(`(() => {
    const selector = document.querySelector('.ant-select-selector');
    selector?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    selector?.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
    selector?.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
    return true;
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 500));
  categorySelect = {
    open: await evaluate("document.querySelector('.ant-select')?.classList.contains('ant-select-open')"),
    dropdowns: await evaluate(popupSnapshot.replace('SELECTOR', "'.ant-select-dropdown'")),
  };
} catch (error) {
  categorySelect = {
    error: String(error),
    page: await evaluate("({ url: location.href, text: document.body.innerText.slice(0, 500) })"),
  };
}

const report = {
  environment: await evaluate("({ userAgent: navigator.userAgent, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, viewport: { width: innerWidth, height: innerHeight }, scripts: [...document.scripts].map(script => script.src).filter(Boolean) })"),
  userMenu: { before: userBefore, after: userAfter, trigger: userTrigger, dropdowns, manualPopupReset, dropdownsAfterResize },
  categorySelect,
  browserEvents,
};

console.log(JSON.stringify(report, null, 2));

function isInViewport(popup) {
  const { width, height } = report.environment.viewport;
  return popup.width > 0
    && popup.height > 0
    && popup.x >= 0
    && popup.y >= 0
    && popup.x < width
    && popup.y < height;
}

if (!report.userMenu.dropdowns.some(isInViewport)) {
  throw new Error('User menu opened outside the viewport');
}

if (!report.categorySelect.dropdowns?.some(isInViewport)) {
  throw new Error('Category options opened outside the viewport');
}

socket.close();
