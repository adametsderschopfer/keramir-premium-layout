;(function () {
  /**
   * Инициализация работы табов
   *
   * @return void
   * */
  function defaultTabsInit () {
    const tabsContainers = Array.from(document.querySelectorAll('.js-tabs'));

    if (tabsContainers.length) {
      tabsContainers.map(container => {
        const tabs = Array.from(container.querySelectorAll('.js-tabs-item'));
        const tabsContent = Array.from(container.querySelectorAll('.js-tabs-item-content'));

        if (tabs.length && tabsContent.length) {
          tabs.map((tab, index) => tab.addEventListener('click', () => {
            if (!tab.classList.contains('active')) {
              tabs.map(tab => tab.classList.remove('active'));
              tabsContent.map(container => container.classList.remove('active'));

              tab.classList.add('active');
              tabsContent[index].classList.add('active');
            }
          }, true))
        }
      });
    }
  }

  window.defaultTabs = {
    init: defaultTabsInit
  };
})()
