;(function () {
  /**
   * Инициализация дропов
   *
   * @return void
   * */
  function accordionsInit() {
    const accordions = Array.from(document.querySelectorAll('.js-drop'));

    if (accordions.length) {
      accordions.map((el) => {
        const items = Array.from(el.querySelectorAll('.js-drop-item'));

        items.map((item) => {
          const button = item.querySelector('.js-drop-button');
          const dropdown = item.querySelector('.js-drop-dropdown');

          button.addEventListener('click', () => {
            const height = dropdown.scrollHeight;
            const isActive = dropdown.style.height === '0px' || dropdown.style.height === '';

            dropdown.style.height = `${isActive ? height : 0}px`;
            button.classList[isActive ? 'add' : 'remove']('active');
          });
        });
      });
    }
  }

  window.addEventListener('DOMContentLoaded', accordionsInit);

  window.accordion = {
    init: accordionsInit,
  }
})();
