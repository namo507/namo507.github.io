/* ==========================================================================
   Various functions that we want to use within the template
   ========================================================================== */

// Determine the expected state of the theme toggle, which can be "dark", "light", or
// "system". Default is "system".
let determineThemeSetting = () => {
  let themeSetting = localStorage.getItem("theme");
  return (themeSetting != "dark" && themeSetting != "light" && themeSetting != "system") ? "system" : themeSetting;
};

// Determine the computed theme, which can be "dark" or "light". If the theme setting is
// "system", the computed theme is determined based on the user's system preference.
let determineComputedTheme = () => {
  let themeSetting = determineThemeSetting();
  if (themeSetting != "system") {
    return themeSetting;
  }
  return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
};

// detect OS/browser preference
const browserPref = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

// Set the theme on page load or when explicitly called
let setTheme = (theme) => {
  const use_theme =
    theme ||
    localStorage.getItem("theme") ||
    $("html").attr("data-theme") ||
    browserPref;

  if (use_theme === "dark") {
    $("html").attr("data-theme", "dark");
    $("#theme-icon").removeClass("fa-sun").addClass("fa-moon");
  } else if (use_theme === "light") {
    $("html").removeAttr("data-theme");
    $("#theme-icon").removeClass("fa-moon").addClass("fa-sun");
  }
};

// Toggle the theme manually
var toggleTheme = () => {
  const current_theme = $("html").attr("data-theme");
  const new_theme = current_theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", new_theme);
  setTheme(new_theme);
};

/* ==========================================================================
   Plotly integration script so that Markdown codeblocks will be rendered
   ========================================================================== */

// Read the Plotly data from the code block, hide it, and render the chart as new node. This allows for the 
// JSON data to be retrieve when the theme is switched. The listener should only be added if the data is 
// actually present on the page.
import { plotlyDarkLayout, plotlyLightLayout } from './theme.js';
let plotlyElements = document.querySelectorAll("pre>code.language-plotly");
if (plotlyElements.length > 0) {
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
      plotlyElements.forEach((elem) => {
        // Parse the Plotly JSON data and hide it
        var jsonData = JSON.parse(elem.textContent);
        elem.parentElement.classList.add("hidden");

        // Add the Plotly node
        let chartElement = document.createElement("div");
        elem.parentElement.after(chartElement);

        // Set the theme for the plot and render it
        const theme = (determineComputedTheme() === "dark") ? plotlyDarkLayout : plotlyLightLayout;
        if (jsonData.layout) {
          jsonData.layout.template = (jsonData.layout.template) ? { ...theme, ...jsonData.layout.template } : theme;
        } else {
          jsonData.layout = { template: theme };
        }
        Plotly.react(chartElement, jsonData.data, jsonData.layout);
      });
    }
  });
}

/* ==========================================================================
   Actions that should occur when the page has been fully loaded
   ========================================================================== */

$(document).ready(function () {
  // SCSS SETTINGS - These should be the same as the settings in the relevant files 
  const scssLarge = 925;          // pixels, from /_sass/_themes.scss
  const scssMastheadHeight = 70;  // pixels, from the current theme (e.g., /_sass/theme/_default.scss)
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // If the user hasn't chosen a theme, follow the OS preference
  setTheme();
  window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener("change", (e) => {
          if (!localStorage.getItem("theme")) {
            setTheme(e.matches ? "dark" : "light");
          }
        });

  // Enable the theme toggle
  $('#theme-toggle').on('click', toggleTheme);

  const syncMastheadState = function () {
    $('.masthead').toggleClass('is-scrolled', window.scrollY > 16);
  };
  $(window).on('scroll', syncMastheadState);
  syncMastheadState();

  // Enable the sticky footer
  var bumpIt = function () {
    $("body").css("padding-bottom", "0");
    $("body").css("margin-bottom", $(".page__footer").outerHeight(true));
  }
  $(window).resize(function () {
    didResize = true;
  });
  setInterval(function () {
    if (didResize) {
      didResize = false;
      bumpIt();
    }}, 250);
  var didResize = false;
  bumpIt();

  // FitVids init
  fitvids();

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function () {
    $(".author__urls").fadeToggle("fast", function () { });
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // Restore the follow menu if toggled on a window resize
  jQuery(window).on('resize', function () {
    if ($('.author__urls.social-icons').css('display') == 'none' && $(window).width() >= scssLarge) {
      $(".author__urls").css('display', 'block')
    }
  });

  // Init smooth scroll, this needs to be slightly more than then fixed masthead height
  $("a").smoothScroll({
    offset: -scssMastheadHeight,
    preventDefault: false,
  });

  const revealTargets = document.querySelectorAll('.page__header-block, .home-hero, .page__section, .page__panel, .archive__item, .page__footer-main');
  revealTargets.forEach((element, index) => {
    element.setAttribute('data-reveal', '');
    element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`);
  });

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  if (!window.__homepageEffectsInitialized) {
    window.__homepageEffectsInitialized = true;

    const typewriterTargets = document.querySelectorAll('[data-typewriter-words]');
    if (typewriterTargets.length > 0) {
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
    }

    const interactiveGlowTargets = document.querySelectorAll('[data-interactive-glow]');
    const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
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
  }

});
