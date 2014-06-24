// mock for dev
if (!navigator.notification) {
	navigator.notification = {};
	navigator.notification.alert = function(text, callback, title) {
		window.alert(text);
		if (callback && typeof(callback) === "function") {
			callback();
		}
	}
}