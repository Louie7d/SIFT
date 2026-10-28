function rememberChoice(key, value) {
  const url = new URL(location.href);
  url.searchParams.set(key, value);
  history.replaceState(null, '', url);
}
const galleryImage = document.querySelector('#gallery-image');
const views = {
  front: { src: 'assets/sift-front-v2.webp', alt: 'Front view of SIFT: rounded rectangular clear lenses, a graphite browline and cameras at both outer corners.' },
  angle: { src: 'assets/sift-hero-v2.webp', alt: 'Three-quarter view of SIFT, showing the clear lenses, blue temple touch strip and curved graphite arms.' }
};
document.querySelectorAll('[data-view]').forEach(button => {
  button.addEventListener('click', () => {
    const view = views[button.dataset.view];
    galleryImage.src = view.src;
    galleryImage.alt = view.alt;
    document.querySelectorAll('[data-view]').forEach(item => setRadioState(item, item === button));
    rememberChoice('view', button.dataset.view);
  });
});

const details = {
  touch: {
    description: 'Control at your fingertips.', label: 'blue touch strip',
    x: 40, y: 28.25, size: '350% auto', position: '36% 38%',
    alt: 'Magnified view of the smooth pale-blue touch strip set into the graphite temple.'
  },
  sensor: {
    description: 'An environmental sensor, discreetly integrated.', label: 'environmental sensor',
    x: 7.2, y: 25.2, size: '500% auto', position: '-3.5% 36.5%',
    alt: 'Magnified view of the circular environmental camera sensor at the front corner of the frame.'
  },
  module: {
    description: 'Battery and computing, built into the temple.', label: 'integrated module',
    x: 78.45, y: 39.85, size: '300% auto', position: '86% 44%',
    alt: 'Magnified view of the temple interface port and rear battery and computing module, including its four ventilation slots.'
  }
};
let activeDetail = 'touch';
const touchHotspot = document.querySelector('#touch-hotspot');
const touchZoom = document.querySelector('#touch-zoom');
const detailZoomImage = touchZoom.querySelector('.touch-zoom-image');
const detailLeader = document.querySelector('.touch-leader path');
function setTouchZoom(open) {
  touchZoom.hidden = !open;
  touchHotspot.setAttribute('aria-expanded', String(open));
  touchHotspot.setAttribute('aria-label', open ? `Collapse ${details[activeDetail].label} detail` : `Enlarge ${details[activeDetail].label}`);
  touchHotspot.closest('.side-product').classList.toggle('is-zoom-open', open);
}
touchHotspot.addEventListener('click', () => {
  setTouchZoom(touchHotspot.getAttribute('aria-expanded') !== 'true');
});
document.querySelectorAll('[data-detail]').forEach(button => {
  button.addEventListener('click', () => {
    activeDetail = button.dataset.detail;
    const feature = details[activeDetail];
    document.querySelector('#detail-description').textContent = feature.description;
    touchHotspot.style.left = `${feature.x}%`;
    touchHotspot.style.top = `${feature.y}%`;
    detailLeader.setAttribute('d', `M${feature.x * 12} ${feature.y * 4}V318L600 400`);
    detailZoomImage.style.backgroundSize = feature.size;
    detailZoomImage.style.backgroundPosition = feature.position;
    detailZoomImage.setAttribute('aria-label', feature.alt);
    touchZoom.dataset.feature = activeDetail;
    touchZoom.setAttribute('aria-label', `${feature.label} detail`);
    document.querySelectorAll('[data-detail]').forEach(item => setRadioState(item, item === button));
    rememberChoice('detail', activeDetail);
    setTouchZoom(true);
  });
});

const comparison = document.querySelector('#comparison');
const range = document.querySelector('#compare-range');
function setComparison(value) {
  const split = Math.min(100, Math.max(0, Number(value)));
  range.value = String(split);
  range.setAttribute('aria-valuetext', `${split} percent of the SIFT View revealed`);
  comparison.style.setProperty('--split', `${split}%`);
  comparison.querySelector('.label-before').style.opacity = split > 92 ? '0' : '1';
  comparison.querySelector('.label-after').style.opacity = split < 8 ? '0' : '1';
  document.querySelectorAll('[data-split]').forEach(button => setRadioState(button, Number(button.dataset.split) === (split === 0 ? 0 : split === 100 ? 100 : 50)));
  rememberChoice('reveal', String(split));
}
range.addEventListener('input', () => setComparison(range.value));
document.querySelectorAll('[data-split]').forEach(button => button.addEventListener('click', () => setComparison(button.dataset.split)));

const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('#nav-links');
function closeMenu() {
  navLinks.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation menu');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  navLinks.classList.toggle('is-open', open);
});
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
matchMedia('(min-width: 701px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const initialChoices = new URLSearchParams(location.search);
const initialView = initialChoices.get('view');
const initialDetail = initialChoices.get('detail');
const initialReveal = initialChoices.get('reveal');
if (Object.hasOwn(views, initialView)) document.querySelector(`[data-view="${initialView}"]`).click();
if (Object.hasOwn(details, initialDetail)) document.querySelector(`[data-detail="${initialDetail}"]`).click();
if (initialReveal !== null && Number.isFinite(Number(initialReveal))) setComparison(initialReveal);

const worksDemo = document.querySelector('#works-demo');
const worksTabs = [...worksDemo.querySelectorAll('[role="tab"]')];
const worksPanels = [...worksDemo.querySelectorAll('[role="tabpanel"]')];
const worksCopy = {
  scan: ["See what's in view.", 'SIFT scans your surroundings and identifies AR advertisements in real time.'],
  select: ['Look. Then tap.', 'Select an ad with your gaze. Tap the temple strip to confirm.'],
  customise: ['Your view. Your rules.', 'Extend your selection to all AR advertising. Choose Hide.'],
  filter: ['Only what matters.', 'Unwanted AR ads disappear, leaving the real world in view.']
};
const worksMotion = matchMedia('(prefers-reduced-motion: reduce)');
const resultNotification = worksDemo.querySelector('.works-result-interface');
let worksEpoch = 0;
let worksAnimations = [];
let worksNoticeTimer;
let worksInView = false;
function scheduleWorksNotice() {
  if (!worksInView || worksDemo.dataset.step !== 'filter' || resultNotification.classList.contains('is-dismissed')) return;
  clearTimeout(worksNoticeTimer);
  worksNoticeTimer = setTimeout(() => {
    resultNotification.classList.add('is-dismissed');
    resultNotification.setAttribute('aria-hidden', 'true');
  }, 3200);
}
async function setWorksStep(step, remember = true, animate = true) {
  if (!Object.hasOwn(worksCopy, step)) return;
  const epoch = ++worksEpoch;
  const next = document.querySelector(`#works-panel-${step}`);
  // Decode both assets before fading their shared panel in together.
  await Promise.allSettled([...next.querySelectorAll('img')].map(image => {
    image.loading = 'eager';
    return image.decode();
  }));
  if (epoch !== worksEpoch) return;
  const previous = worksDemo.querySelector(`[role="tabpanel"]:not([hidden]):not(.is-outgoing)`);
  worksAnimations.forEach(animation => animation.cancel());
  worksAnimations = [];
  clearTimeout(worksNoticeTimer);
  worksPanels.forEach(panel => {
    panel.hidden = true;
    panel.inert = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('is-outgoing');
  });
  next.hidden = false;
  next.inert = false;
  next.removeAttribute('aria-hidden');
  worksDemo.dataset.step = step;
  worksTabs.forEach(tab => {
    const selected = tab.dataset.step === step;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  document.querySelector('#works-step-title').textContent = worksCopy[step][0];
  document.querySelector('#works-step-description').textContent = worksCopy[step][1];
  document.querySelector('#works-explore').hidden = step !== 'filter';
  document.querySelector('#settings-open').hidden = step !== 'customise';
  resultNotification.classList.remove('is-dismissed');
  resultNotification.removeAttribute('aria-hidden');
  scheduleWorksNotice();
  if (remember) rememberChoice('step', step);
  if (animate && !worksMotion.matches && previous && previous !== next) {
    previous.hidden = false;
    previous.classList.add('is-outgoing');
    worksAnimations = [
      previous.animate([{opacity:1}, {opacity:0}], {duration:300, easing:'ease-out'}),
      next.animate([{opacity:0}, {opacity:1}], {duration:300, easing:'ease-out'})
    ];
    Promise.allSettled(worksAnimations.map(animation => animation.finished)).then(() => {
      if (epoch !== worksEpoch) return;
      previous.hidden = true;
      previous.classList.remove('is-outgoing');
      worksAnimations = [];
    });
  }
}
worksTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => setWorksStep(tab.dataset.step));
  tab.addEventListener('keydown', event => {
    let destination;
    if (event.key === 'ArrowRight') destination = (index + 1) % worksTabs.length;
    if (event.key === 'ArrowLeft') destination = (index + worksTabs.length - 1) % worksTabs.length;
    if (event.key === 'Home') destination = 0;
    if (event.key === 'End') destination = worksTabs.length - 1;
    if (destination === undefined) return;
    event.preventDefault();
    worksTabs[destination].focus();
    setWorksStep(worksTabs[destination].dataset.step);
  });
});
new IntersectionObserver(entries => {
  worksInView = entries[0].isIntersecting;
  if (worksInView) scheduleWorksNotice();
  else clearTimeout(worksNoticeTimer);
}, {threshold:0.15}).observe(worksDemo);
worksMotion.addEventListener('change', () => {
  if (worksMotion.matches) setWorksStep(worksDemo.dataset.step, false, false);
});
// Each visit starts the explanation at Scan, including old step-specific links.
setWorksStep('scan', true, false);


function setRadioState(button, checked) {
  button.setAttribute('aria-checked', String(checked));
  button.tabIndex = checked ? 0 : -1;
}
document.querySelectorAll('[role="radiogroup"]').forEach(group => {
  const radios = [...group.querySelectorAll('[role="radio"]')];
  radios.forEach((radio, index) => radio.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % radios.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + radios.length - 1) % radios.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = radios.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    radios[next].focus();
    radios[next].click();
  }));
});
const settingsOpen = document.querySelector('#settings-open');
const settingsViewer = document.querySelector('#settings-viewer');
settingsOpen.addEventListener('click', () => {
  settingsViewer.showModal();
  document.body.classList.add('settings-viewer-open');
  document.querySelector('#settings-close').focus();
});
document.querySelector('#settings-close').addEventListener('click', () => settingsViewer.close());
settingsViewer.addEventListener('close', () => {
  document.body.classList.remove('settings-viewer-open');
  settingsOpen.focus({preventScroll:true});
});
const settingsMobile = matchMedia('(max-width:700px)');
settingsMobile.addEventListener('change', event => {
  if (!event.matches && settingsViewer.open) settingsViewer.close();
});
