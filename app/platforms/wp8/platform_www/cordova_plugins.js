cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/cordova-plugin-barcodescanner/www/barcodescanner.js",
        "id": "cordova-plugin-barcodescanner.BarcodeScanner",
        "pluginId": "cordova-plugin-barcodescanner",
        "clobbers": [
            "cordova.plugins.barcodeScanner"
        ]
    },
    {
        "file": "plugins/cordova-plugin-console/www/console-via-logger.js",
        "id": "cordova-plugin-console.console",
        "pluginId": "cordova-plugin-console",
        "clobbers": [
            "console"
        ]
    },
    {
        "file": "plugins/cordova-plugin-console/www/logger.js",
        "id": "cordova-plugin-console.logger",
        "pluginId": "cordova-plugin-console",
        "clobbers": [
            "cordova.logger"
        ]
    },
    {
        "file": "plugins/cordova-plugin-device/www/device.js",
        "id": "cordova-plugin-device.device",
        "pluginId": "cordova-plugin-device",
        "clobbers": [
            "device"
        ]
    },
    {
        "file": "plugins/cordova-plugin-dialogs/www/notification.js",
        "id": "cordova-plugin-dialogs.notification",
        "pluginId": "cordova-plugin-dialogs",
        "merges": [
            "navigator.notification"
        ]
    },
    {
        "file": "plugins/cordova-plugin-inappbrowser/www/inappbrowser.js",
        "id": "cordova-plugin-inappbrowser.inappbrowser",
        "pluginId": "cordova-plugin-inappbrowser",
        "clobbers": [
            "cordova.InAppBrowser.open",
            "window.open"
        ]
    },
    {
        "file": "plugins/cordova-plugin-splashscreen/www/splashscreen.js",
        "id": "cordova-plugin-splashscreen.SplashScreen",
        "pluginId": "cordova-plugin-splashscreen",
        "clobbers": [
            "navigator.splashscreen"
        ]
    },
    {
        "file": "plugins/cordova-plugin-email/www/email_composer.js",
        "id": "cordova-plugin-email.EmailComposer",
        "pluginId": "cordova-plugin-email",
        "clobbers": [
            "cordova.plugins.email",
            "plugin.email"
        ]
    },
    {
        "file": "plugins/cordova-plugin-sqlite/www/SQLitePlugin.js",
        "id": "cordova-plugin-sqlite.SQLitePlugin",
        "pluginId": "cordova-plugin-sqlite",
        "clobbers": [
            "SQLitePlugin"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-barcodescanner": "0.7.0",
    "cordova-plugin-console": "1.0.2",
    "cordova-plugin-crosswalk-webview": "1.4.0",
    "cordova-plugin-device": "1.1.0",
    "cordova-plugin-dialogs": "1.2.0",
    "cordova-plugin-inappbrowser": "1.1.1",
    "cordova-plugin-splashscreen": "3.0.0",
    "cordova-plugin-whitelist": "1.2.0",
    "cordova-plugin-email": "1.0.1",
    "cordova-plugin-sqlite": "0.9.0"
}
// BOTTOM OF METADATA
});