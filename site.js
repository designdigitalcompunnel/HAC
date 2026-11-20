'use strict';

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.getElementById('nav-left');

const dropdownToggles = [...navigation.querySelectorAll('.nav-disclosure')];

function setDropdown(button, open) {
  button.setAttribute('aria-expanded', String(open));
  document.getElementById(button.getAttribute('aria-controls')).hidden = !open;
}

function closeDropdowns(except) {
  dropdownToggles.forEach(button => {
    if (button !== except) setDropdown(button, false);
  });
}

function setMobileMenu(open) {
  navigation.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  if (!open) closeDropdowns();
}

menuToggle.addEventListener('click', () => {
  setMobileMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});

dropdownToggles.forEach(button => {
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    closeDropdowns(button);
    setDropdown(button, open);
  });
});

navigation.addEventListener('click', event => {
  if (event.target.closest('a')) setMobileMenu(false);
});

document.addEventListener('click', event => {
  if (!event.target.closest('#site-header')) setMobileMenu(false);
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
  const openDropdown = dropdownToggles.find(button => button.getAttribute('aria-expanded') === 'true');
  if (openDropdown) {
    setDropdown(openDropdown, false);
    openDropdown.focus();
  } else if (menuToggle.getAttribute('aria-expanded') === 'true') {
    setMobileMenu(false);
    menuToggle.focus();
  }
});

const tabs = [...document.querySelectorAll('.cust-tab')];
if (tabs.length) {
  const syncTabs = () => {
    tabs.forEach(tab => {
      const active = tab.classList.contains('active');
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  };

  const tablist = document.getElementById('cust-tabs');
  const track = new MutationObserver(syncTabs);
  tabs.forEach(tab => track.observe(tab, { attributes: true, attributeFilter: ['class'] }));

  tablist.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index === -1) return;
    const destination = {
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    tabs[destination].click();
    tabs[destination].focus();
  });
}

const updatesForm = document.getElementById('newsletter-form');
if (updatesForm) {
  updatesForm.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.getElementById('email');
    if (!email.reportValidity()) return;
    location.href = 'https://ruralhome.org/about-hac/contact/sign-up-for-hacs-mailing-list/';
  });
}

const footageButton = document.querySelector('.media-toggle');
if (footageButton) {
  const footage = footageButton.parentElement.querySelector('video');
  function updateFootageButton() {
    const playing = !footage.paused;
    footageButton.textContent = playing ? 'Ⅱ' : '▶';
    footageButton.setAttribute('aria-label', playing
      ? 'Pause housing construction footage' : 'Play housing construction footage');
    footageButton.setAttribute('aria-pressed', String(playing));
  }
  footageButton.addEventListener('click', async () => {
    if (footage.paused) {
      try {
        await footage.play();
      } catch {
        footageButton.setAttribute('aria-label', 'Housing construction footage unavailable');
      }
    } else {
      footage.pause();
    }
  });
  footage.addEventListener('play', updateFootageButton);
  footage.addEventListener('pause', updateFootageButton);
}

const carousel = document.querySelector('.hero-wrap[aria-roledescription="carousel"]');
if (carousel) {
  const slides = [...carousel.querySelectorAll('[data-hero-slide]')];
  const status = carousel.querySelector('[data-hero-status]');
  const rotationToggle = carousel.querySelector('[data-hero-pause]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rotationDelay = 8000;
  let currentSlide = 0;
  let rotationTimer;
  let rotationPaused = false;
  let pointerInside = false;
  let focusInside = carousel.contains(document.activeElement);

  function stepSlide(step, announce = false) {
    const previous = slides[currentSlide];
    previous.inert = true;
    previous.setAttribute('aria-hidden', 'true');

    currentSlide = (currentSlide + step + slides.length) % slides.length;
    const active = slides[currentSlide];
    active.inert = false;
    active.removeAttribute('aria-hidden');

    if (announce) {
      const title = [...active.querySelectorAll('.slide-heading .hl')].map(line => line.textContent).join(' ');
      status.textContent = `Slide ${currentSlide + 1} of ${slides.length}: ${title}`;
    }
  }

  function scheduleRotation() {
    window.clearTimeout(rotationTimer);
    if (slides.length < 2 || rotationPaused || pointerInside || focusInside || document.hidden || reducedMotion.matches) return;

    rotationTimer = window.setTimeout(() => {
      stepSlide(1);
      scheduleRotation();
    }, rotationDelay);
  }

  function navigateToAdjacentSlide(step) {
    stepSlide(step, true);
    scheduleRotation();
  }

  rotationToggle.addEventListener('click', () => {
    rotationPaused = !rotationPaused;
    rotationToggle.textContent = rotationPaused ? '▶' : 'Ⅱ';
    rotationToggle.setAttribute('aria-label', rotationPaused ? 'Play slideshow' : 'Pause slideshow');
    rotationToggle.setAttribute('aria-pressed', String(rotationPaused));
    scheduleRotation();
  });

  carousel.querySelectorAll('[data-hero-step]').forEach(button => {
    button.addEventListener('click', () => navigateToAdjacentSlide(Number(button.dataset.heroStep)));
  });

  carousel.addEventListener('keydown', event => {
    if (!event.target.closest('[data-hero-step]')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      navigateToAdjacentSlide(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  carousel.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    pointerInside = true;
    scheduleRotation();
  });
  carousel.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    pointerInside = false;
    scheduleRotation();
  });
  carousel.addEventListener('focusin', () => {
    focusInside = true;
    scheduleRotation();
  });
  carousel.addEventListener('focusout', event => {
    focusInside = carousel.contains(event.relatedTarget);
    scheduleRotation();
  });
  document.addEventListener('visibilitychange', scheduleRotation);
  function applyMotionPreference() {
    rotationToggle.hidden = reducedMotion.matches;
    scheduleRotation();
  }
  reducedMotion.addEventListener('change', applyMotionPreference);
  applyMotionPreference();
}
