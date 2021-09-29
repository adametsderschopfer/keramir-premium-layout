/*BURGER MENU*/

;(function () {
    window.addEventListener('load', function () {
        const menu = document.querySelector('.js-burger--menu');
        const buttonOpen = document.querySelector('.js-burger--button-open');
        const buttonClose = document.querySelector('.js-burger--button-close');

        if (menu) {
            buttonOpen?.addEventListener('click', function () {
                menu.classList.add('active')
            });

            buttonClose?.addEventListener('click', function () {
                menu.classList.remove('active')
            });
        }
    });
})();
