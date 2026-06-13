(function () {
  var SOURCE = 'VARUNTOOLS_DEMO'

  function getDemoId() {
    return document.documentElement.dataset.demoId || (document.body && document.body.dataset.demoId) || ''
  }

  function getHeight() {
    var html = document.documentElement
    var body = document.body
    return Math.max(
      html ? html.scrollHeight : 0,
      body ? body.scrollHeight : 0,
      html ? html.offsetHeight : 0,
      body ? body.offsetHeight : 0
    )
  }

  function post(type, payload) {
    if (!window.parent || window.parent === window) return

    window.parent.postMessage(
      Object.assign(
        {
          source: SOURCE,
          type: type,
          id: getDemoId(),
        },
        payload || {}
      ),
      '*'
    )
  }

  function resize() {
    post('VARUN_DEMO_RESIZE', {
      height: getHeight(),
    })
  }

  function ready() {
    post('VARUN_DEMO_READY')
    resize()
  }

  function error(message) {
    post('VARUN_DEMO_ERROR', {
      message: message || '데모 초기화에 실패했습니다.',
    })
  }

  window.VarunDemoRuntime = {
    ready: ready,
    resize: resize,
    error: error,
  }

  window.addEventListener('load', ready)
  window.addEventListener('resize', resize)

  if ('ResizeObserver' in window) {
    var observer = new ResizeObserver(resize)
    observer.observe(document.documentElement)
    if (document.body) observer.observe(document.body)
  }
})()
