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
    window.FormFeedback = window.FormFeedback || {}
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
    window.PhoneMask = ({init: PhoneMaskInit});
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
                   window.PhoneMask.init();

                   window.FormFeedback.popupSuccess = function () {
                       const _formLayout = result.querySelector('.form-feedback');

                       if (_formLayout) {
                           _formLayout.outerHTML = `
                                <div class="popup-success">
                                    <div class="popup-success__icon">
                                        <svg width="101" height="101" viewBox="0 0 101 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M50.5 0C22.6543 0 0 22.6543 0 50.5C0 78.3457 22.6543 101 50.5 101C78.3457 101 101 78.3457 101 50.5C101 22.6543 78.3457 0 50.5 0ZM40.4051 72.7857L21.6544 54.0754L28.785 46.9246L40.395 58.5144L67.1297 31.7797L74.2704 38.9203L40.4051 72.7857Z" fill="#6BD689"/>
                                        </svg>
                                    </div>
                                
                                    <div class="popup-success__title">
                                        СПАСИБО!
                                    </div>
                                    
                                    <div class="popup-success__text">
                                        Ваше сообщение отправлено
                                    </div>
                                </div>
                          `
                       }
                   }
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
