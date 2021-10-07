;(function (window) {
  let options = {},
    defaultOptions = {
      cache: true, // сохранять ли кеш запроса
      display: 'block',
      data: {},
      paddingRightElements: [],
      title: 'Окно',
      onAfterAppend: null,
      onAfterOpen: null,
      onAfterClose: null,
    }

  /**
   * Создаёт обёртку попапа
   * @returns {HTMLDivElement}
   */
  let createWrap = () => {
    let wrap = document.createElement('div')
    wrap.dataset.close = 'true'
    wrap.classList.add('popup')
    wrap.innerHTML = `
    <div class="popup__wrap">

    <div class="popup__content-wrap">
        <div class="popup__close" data-close="true">
    
   <svg xmlns="http://www.w3.org/2000/svg" width="132" height="132" viewBox="0 0 132 132" fill="none">
<path d="M100.963 66.32L130.53 36.652C132.446 34.7297 132.446 31.5899 130.53 29.6675L102.368 1.40928C100.452 -0.513053 97.3226 -0.513053 95.4068 1.40928L66.2863 30.6287L37.7406 1.98598C35.8887 0.127724 32.8872 0.0636459 30.9714 1.79374L1.7232 28.386C-0.511919 30.3724 -0.639641 33.8326 1.46776 36.0112L29.6942 65.2947C30.0135 65.6151 30.0135 66.1277 29.6942 66.4481L3.192 93.0403C1.27618 94.9627 1.27618 98.1025 3.192 100.025L31.3546 128.283C33.2704 130.205 36.3995 130.205 38.3154 128.283L62.5824 103.934C64.4982 102.011 67.6274 102.011 69.5432 103.934L96.0454 130.526C97.9612 132.448 101.09 132.448 103.006 130.526L130.53 102.908C132.446 100.986 132.446 97.8462 130.53 95.9238L100.963 66.32ZM128.295 100.089L100.069 128.411C99.7493 128.732 99.2384 128.732 98.9191 128.411L69.4794 98.8714C67.5636 96.9491 64.4344 96.9491 62.5186 98.8714L35.3778 126.104C35.0585 126.425 34.5476 126.425 34.2283 126.104L5.2994 96.8209L34.4199 67.7297C35.5055 66.6403 35.5055 64.9102 34.4199 63.8209L3.76674 33.5122C3.44744 33.1918 3.44744 32.6792 3.76674 32.3588L33.7174 4.29277C34.0367 3.97238 34.5476 3.97238 34.8669 4.29277L62.774 32.2947C64.6898 34.217 67.819 34.217 69.7348 32.2947L98.8553 3.0753L128.87 33.1918L99.3023 62.8598C97.3865 64.7821 97.3865 67.9219 99.3023 69.8442L128.295 98.9355C128.614 99.2559 128.614 99.7685 128.295 100.089Z" fill="#272525"/>
</svg>
</span></div><h3 class="popup__title"></h3></div>
    </div>`
    return wrap
  }

  /**
   * Установка паддингов, чтобы элементы не прыгали при скрытии скрола у body
   * @param padding
   */
  let setPadding = (padding) => {
    window.document.body.style.overflowY = padding ? 'hidden' : 'scroll'
    window.document.body.style.paddingRight = padding

    if (!BX.type.isArray(options.paddingRightElements)) {
      return
    }

    for (let i in options.paddingRightElements) {
      let selector = options.paddingRightElements[i],
        nodeList = document.querySelectorAll(selector)

      if (!nodeList.length) {
        continue
      }

      for (let j in nodeList) {
        let currentElement = nodeList[j]
        if (!BX.type.isElementNode(currentElement)) {
          continue
        }

        currentElement.style.paddingRight = padding
      }
    }
  }

  /**
   * Возвращает объект попапа
   *
   * @param params
   * @returns {{close(): void, open(): void}}
   */
  window.legancyPopup = (params) => {
    params = typeof params === 'object' ? params : {}
    options = Object.assign({}, defaultOptions, params)

    let promise,
      content = options.content,
      wrap = createWrap()

    if (typeof content === 'string') {
      if (content.indexOf('/') >= 0 || options.ajax === true) {
        promise = fetch(content).then(
          (value) => (value.ok ? value.text() : '404 Not found'),
          (error) => 'Check your internet connection'
        )
      } else {
        promise = new Promise((resolve, reject) => {
          let popupElement = document.querySelector(content)
          if (BX.type.isElementNode(popupElement)) {
            resolve(popupElement.innerHTML)
          } else {
            reject('Selector content not found')
          }
        })
      }
    } else if (BX.type.isElementNode(content)) {
      promise = new Promise((resolve) => {
        resolve(content.innerHTML)
      })
    } else {
      promise = new Promise((resolve) => {
        resolve('Content Type Not Supported')
      })
    }

    let elem = wrap.querySelector('.popup__content-wrap')

    if (options.title === false || !options.title) {
      elem.removeChild(elem.querySelector('.popup__title'))
    } else {
      elem.querySelector('.popup__title').innerHTML = options.title
    }

    promise.then(
      (result) => {
        elem.insertAdjacentHTML('beforeend', result)
        document.body.appendChild(wrap)
        if (typeof params.onAfterAppend === 'function') {
          params.onAfterAppend(wrap)
        }
      },
      (error) => {
        elem.insertAdjacentHTML('afterBegin', 'Something went wrong')
        console.log(error)
      }
    )

    let closing = false
    const ANIMATION_SPEED = 200

    const escClickHandler = (evt) => {
      if (evt.keyCode === 27) {
        methods.close()
      }
    }

    /**
     * @type {{close(): void, open(): void}}
     */
    let methods = {
      open() {
        !closing && wrap.classList.add('popup_open')
        setPadding(getScrollBarWidth() + 'px')
        document.addEventListener('keydown', escClickHandler);

        if (typeof params.onAfterOpen === 'function') {
          params.onAfterOpen(wrap)
        }

        const menu = document.querySelector('.js-burger--menu');

        if (menu) {
          menu.classList.remove('active');
        }
      },
      close() {
        closing = true
        wrap.classList.remove('popup_open')
        wrap.classList.add('popup_hide')
        setTimeout(() => {
          wrap.classList.remove('popup_hide')
          setPadding(0)
          document.removeEventListener('keydown', escClickHandler)
          closing = false
        }, ANIMATION_SPEED)
        if (typeof params.onAfterClose === 'function') {
          params.onAfterClose(wrap)
        }
      },
    }

    wrap.addEventListener('click', (ev) => {
      if (ev.target.dataset.close) {
        methods.close()
      }
    })

    return methods
  }

  /**
   * Чтобы не передавать options при каждом открытии попапа
   * можно заранее назначить некоторые опции
   *
   * @param params
   */
  window.legancyPopupInit = (params) => {
    params = typeof params === 'object' ? params : {}
    defaultOptions = Object.assign({}, defaultOptions, params)
  }
})(window)
