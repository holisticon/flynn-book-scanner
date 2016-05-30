// mock for dev
if (!navigator.notification) {
  navigator.notification = {};
  navigator.notification.alert = function (text, callback, title) {
    window.alert(text);
    if (callback && typeof(callback) === "function") {
      callback();
    }
  };
  navigator.notification.confirm = function (text, callback, title) {
    if (confirm(text) && callback && typeof(callback) === "function") {
      callback(1);
    }
  }
}
