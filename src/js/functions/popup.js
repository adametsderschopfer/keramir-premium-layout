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
    <div class="popup__close" data-close="true"><span class="popup__close_1"></span><span class="popup__close_2"></span></div>
    <div class="popup__content-wrap"><h3 class="popup__title"></h3></div>
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
        document.addEventListener('keydown', escClickHandler)
        if (typeof params.onAfterOpen === 'function') {
          params.onAfterOpen(wrap)
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
