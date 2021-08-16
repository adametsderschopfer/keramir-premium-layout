// LazyLoad
;(function () {
  // Set the options to make LazyLoad self-initialize
  window.lazyLoadOptions = {
    elements_selector: '.lazy',
    // ... more custom settings?
  }

  // Listen to the initialization event and get the instance of LazyLoad
  window.addEventListener(
    'LazyLoad::Initialized',
    function (event) {
      window.lazyLoadInstance = event.detail.instance
      window.lazyLoadInstance.update()
    },
    false
  )
})()

// SVG
;(function () {
  loadScript(
    'https://cdnjs.cloudflare.com/ajax/libs/svg4everybody/2.1.9/svg4everybody.min.js',
    function () {
      svg4everybody()
    }
  )
})();

;(() => {
  document.addEventListener('DOMContentLoaded', defaultTabs.init);
})();

;(() => {
  function PhoneMaskInit(p) {
    const mask = (_p) => {
      Inputmask('+7 (999) 999 99 99').mask(_p);
    }

    if (p) {
      mask(p);
      return;
    }

    const phones = document.querySelectorAll('.js-phone-mask');

    if (phones.length) {
      for (const phone of phones) {
        mask(phone);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => PhoneMaskInit());
  window.PhoneMask = { init: PhoneMaskInit }
})();