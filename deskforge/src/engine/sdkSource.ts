/**
 * Script injected into every plugin iframe. It defines `window.deskforge`,
 * which talks to the host through postMessage. Typings for it live in
 * packages/sdk (@deskforge/sdk).
 */
export const SDK_SOURCE = `(function () {
  var listeners = {};
  var pending = {};
  var counter = 0;
  function post(msg) { msg.__df = 1; parent.postMessage(msg, '*'); }
  function call(method, params) {
    return new Promise(function (resolve) {
      var id = ++counter;
      pending[id] = resolve;
      post({ id: id, method: method, params: params });
    });
  }
  function on(event, cb) {
    var list = listeners[event] || (listeners[event] = []);
    list.push(cb);
    post({ method: 'subscribe', params: { event: event } });
    return function () {
      var i = list.indexOf(cb);
      if (i >= 0) list.splice(i, 1);
    };
  }
  window.addEventListener('message', function (e) {
    var m = e.data;
    if (!m || m.__df !== 1) return;
    if (m.id && pending[m.id]) { pending[m.id](m.result); delete pending[m.id]; return; }
    if (m.event && listeners[m.event]) {
      listeners[m.event].slice().forEach(function (cb) { try { cb(m.data); } catch (err) { console.error(err); } });
    }
  });
  var api = {
    version: '0.1.0',
    ready: function () { return call('ready'); },
    settings: {
      get: function (key) { return call('settings.get', { key: key }); },
      all: function () { return call('settings.all'); },
      onChange: function (cb) { return on('settings', cb); }
    },
    audio: {
      onSpectrum: function (cb) { return on('spectrum', cb); },
      onBeat: function (cb) { return on('beat', cb); },
      onTrack: function (cb) { return on('track', cb); }
    },
    system: {
      onStats: function (cb) { return on('stats', cb); }
    }
  };
  window.deskforge = api;
  post({ method: 'hello' });
})();`;
