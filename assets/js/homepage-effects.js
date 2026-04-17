const initializeHomepageEffects = () => {
  if (window.__homepageEffectsInitialized) {
    return;
  }

  window.__homepageEffectsInitialized = true;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const typewriterTargets = document.querySelectorAll('[data-typewriter-words]');

  typewriterTargets.forEach((element, index) => {
    let words = [];

    try {
      words = JSON.parse(element.getAttribute('data-typewriter-words') || '[]');
    } catch (error) {
      words = [];
    }

    if (!Array.isArray(words) || words.length === 0) {
      return;
    }

    if (prefersReducedMotion) {
      element.textContent = words[0];
      return;
    }

    const pause = Number.parseInt(element.getAttribute('data-typewriter-pause') || '1600', 10);
    const typingSpeed = Number.parseInt(element.getAttribute('data-typewriter-speed') || '72', 10);
    const deletingSpeed = Number.parseInt(element.getAttribute('data-typewriter-delete-speed') || '34', 10);
    let wordIndex = 0;
    let characterCount = 0;
    let isDeleting = false;

    const step = () => {
      const activeWord = words[wordIndex];
      const nextCount = isDeleting ? characterCount - 1 : characterCount + 1;
      const safeCount = Math.max(0, Math.min(activeWord.length, nextCount));
      const nextText = activeWord.slice(0, safeCount);

      element.textContent = nextText;
      characterCount = safeCount;

      let delay = isDeleting ? deletingSpeed : typingSpeed;

      if (!isDeleting && nextText === activeWord) {
        isDeleting = true;
        delay = pause;
      } else if (isDeleting && nextText.length === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 320;
      }

      window.setTimeout(step, delay);
    };

    element.textContent = '';
    window.setTimeout(step, 260 + index * 140);
  });

  const interactiveGlowTargets = document.querySelectorAll('[data-interactive-glow]');
  interactiveGlowTargets.forEach((element) => {
    element.style.setProperty('--pointer-opacity', '0');

    if (prefersReducedMotion || coarsePointer) {
      return;
    }

    const updatePointerPosition = (event) => {
      const bounds = element.getBoundingClientRect();
      const relativeX = ((event.clientX - bounds.left) / bounds.width) * 100;
      const relativeY = ((event.clientY - bounds.top) / bounds.height) * 100;

      element.style.setProperty('--pointer-x', `${relativeX.toFixed(2)}%`);
      element.style.setProperty('--pointer-y', `${relativeY.toFixed(2)}%`);
      element.style.setProperty('--pointer-opacity', '1');
    };

    element.addEventListener('pointermove', updatePointerPosition);
    element.addEventListener('pointerenter', updatePointerPosition);
    element.addEventListener('pointerleave', () => {
      element.style.setProperty('--pointer-opacity', '0');
    });
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHomepageEffects, { once: true });
} else {
  initializeHomepageEffects();
}