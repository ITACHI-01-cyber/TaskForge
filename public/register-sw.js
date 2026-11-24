if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(() => {
      console.warn('TaskForge could not register its service worker.')
    })
  }, {once:true})
}
