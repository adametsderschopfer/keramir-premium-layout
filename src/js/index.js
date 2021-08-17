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

function chunk(arr, len) {
    var chunks = [],
        i = 0,
        n = arr.length;

    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }

    return chunks;
}

;(() => {
    document.addEventListener('DOMContentLoaded', () => {
        const catalogList = document.querySelector('.js-catalog-list');

        if (catalogList) {
            const liS = Array.prototype.slice.call(catalogList.querySelectorAll('.catalog__item'), 0);

            if (liS.length) {
                const ch = chunk(liS, 3);
                const l = ch[ch.length - 1].length;
                const block = ch[ch.length - 1];
                const item = block[block.length - 1]

                if (ch[ch.length - 2][0].classList.contains('catalog__item-wide')) {
                    return;
                }

                switch (l) {
                    case 2: {
                        item.classList.add('catalog_last');
                        break;
                    }
                }
            }
        }
    });
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
    window.PhoneMask = {init: PhoneMaskInit}
})();

;(() => {

    document.addEventListener('DOMContentLoaded', () => {
        legancyPopupInit({
            paddingRightElements: ['.wh']
        });

       const formFeedbackPopup = document.querySelector('.js-form-feedback');
       const btns = document.querySelectorAll('[data-popup="form-feedback"]');

       if (formFeedbackPopup) {
           const ffPopup = legancyPopup({
               content: formFeedbackPopup,
               title: false,
               close: false,
               onAfterAppend(result) {
                   formFeedbackPopup.remove();
               }
           });

           if (btns.length) {
               for (const btn of btns) {
                   btn.addEventListener('click', () => {
                       ffPopup.open();
                   });
               }
           }
       }
    });

})();
