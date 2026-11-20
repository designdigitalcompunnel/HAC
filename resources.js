'use strict';

const library = document.querySelector('#library');
const grid = document.querySelector('#rr-grid');
const cards = [...grid.querySelectorAll('.rr-card')];
const query = document.querySelector('#lib-q');
const topic = document.querySelector('#f-focus');
const geography = document.querySelector('#f-audience');
const year = document.querySelector('#f-year');
const sort = document.querySelector('#f-sort');
const chips = [...document.querySelectorAll('.rr-chip')];
const empty = document.querySelector('#rr-empty');
const count = document.querySelector('#rr-count');
const heroSearch = document.querySelector('#hero-search');
const heroQuery = document.querySelector('#hero-q');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const preview = document.querySelector('#resource-preview');
let activeType = 'all';
let previewOpener;

function normalize(value) {
  return value.normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '');
}

function setType(type) {
  activeType = type;
  for (const chip of chips) {
    const chosen = chip.dataset.cat === type ||
      (type === 'publications' && ['report', 'guide'].includes(chip.dataset.cat));
    chip.classList.toggle('is-active', chosen);
    chip.setAttribute('aria-pressed', String(chosen));
  }
}

function sortCards() {
  return [...cards].sort((a, b) => {
    if (sort.value === 'title') return a.dataset.title.localeCompare(b.dataset.title);
    if (sort.value === 'newest') {
      const difference = (Number(b.dataset.year) || 0) - (Number(a.dataset.year) || 0);
      if (difference) return difference;
    }
    return Number(a.dataset.order) - Number(b.dataset.order);
  });
}

function updateResults() {
  const words = normalize(query.value).trim().split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const card of sortCards()) {
    const data = card.dataset;
    const text = normalize(card.textContent);
    const typeMatch = activeType === 'all' ||
      (activeType === 'publications' ? ['report', 'guide'].includes(data.cat) : data.cat === activeType);
    const show = typeMatch &&
      (topic.value === 'all' || topic.value === data.topic) &&
      (geography.value === 'all' || data.geography.split(' ').includes(geography.value)) &&
      (year.value === 'all' || year.value === data.year) &&
      words.every(word => text.includes(word));
    card.hidden = !show;
    grid.append(card);
    if (show) shown++;
  }
  count.textContent = shown === cards.length
    ? `Showing all ${cards.length} resources`
    : `Showing ${shown} of ${cards.length} resources`;
  empty.hidden = shown !== 0;
  grid.hidden = shown === 0;
}

function resetFilters() {
  query.value = '';
  topic.value = 'all';
  geography.value = 'all';
  year.value = 'all';
  sort.value = 'featured';
  setType('all');
  updateResults();
}

chips.forEach(chip => chip.addEventListener('click', () => {
  setType(chip.dataset.cat);
  updateResults();
}));
[topic, geography, year, sort].forEach(select => select.addEventListener('change', updateResults));
query.addEventListener('input', updateResults);
document.querySelector('#rr-clear').addEventListener('click', resetFilters);
document.querySelector('#rr-empty-clear').addEventListener('click', () => {
  resetFilters();
  query.focus();
});
heroSearch.addEventListener('submit', event => {
  event.preventDefault();
  resetFilters();
  query.value = heroQuery.value;
  updateResults();
  library.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  query.focus({ preventScroll: true });
});

const params = new URLSearchParams(location.search);
const initialType = params.get('type');
if (initialType === 'publications' || chips.some(chip => chip.dataset.cat === initialType)) setType(initialType);
query.value = params.get('q') ?? '';
heroQuery.value = query.value;
updateResults();
if (params.has('search')) query.focus({ preventScroll: true });

grid.addEventListener('click', event => {
  const link = event.target.closest('[data-resource-preview]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const card = link.closest('.rr-card');
  event.preventDefault();
  previewOpener = link;
  preview.querySelector('#resource-preview-title').textContent = card.dataset.title;
  preview.querySelector('#resource-preview-meta').textContent = card.querySelector('.rr-meta').textContent;
  preview.querySelector('#resource-preview-summary').textContent = card.querySelector('.rr-desc').textContent;
  preview.querySelector('#resource-preview-link').href = link.href;
  preview.showModal();
});
document.querySelector('#resource-preview-close').addEventListener('click', () => preview.close());
preview.addEventListener('close', () => previewOpener?.focus());

const header = document.querySelector('#site-header');
function refreshHeader() {
  header.classList.toggle('scrolled', scrollY > 8);
}
addEventListener('scroll', refreshHeader, { passive: true });
refreshHeader();

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  }, { threshold: .1 });
  reveals.forEach(element => observer.observe(element));
} else {
  reveals.forEach(element => element.classList.add('in'));
}
