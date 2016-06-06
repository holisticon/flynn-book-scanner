//
//  AppDelegate.swift
//  Flynn Book Scanner
//
//  Created by Martin Reinhardt on 23.05.16.
//  Copyright © 2016 Holisticon AG. All rights reserved.
//

import UIKit
import TVMLKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, TVApplicationControllerDelegate {
  
  // MARK: Members
  let resourceLoader = ResourceLoader()
  var window: UIWindow?
  var appController: TVApplicationController?
  
  
  static func getAppURL()-> NSURL{
    var appURL:NSURL;
    #if (arch(i386) || arch(x86_64)) && os(tvOS)
      appURL = NSURL(string: "http://localhost:8080/dist/scripts/application.js")!
    #else
      appURL = NSBundle.mainBundle().URLForResource("application", withExtension: "js",subdirectory: "dist/scripts")!
    #endif
    return appURL;
  }
  
  func registerSettingsBundle(){
    NSUserDefaults.standardUserDefaults().registerDefaults([
      "flynn_couchdb_url" : "http://localhost:6984/"
      ])
  }
  
  func defaultsChanged(){
    //Get the defaults
    let defaults = NSUserDefaults.standardUserDefaults()
    let backendURL: String = defaults.stringForKey("flynn_couchdb_url")!
  }
  
  // MARK: Javascript Execution Helper
  
  func executeRemoteMethod(methodName: String,arguments: Array<AnyObject>?, completion: (Bool) -> Void) {
    appController?.evaluateInJavaScriptContext({ (context: JSContext) in
      let appObject : JSValue = context.objectForKeyedSubscript("App")
      
      if appObject.hasProperty(methodName) {
        appObject.invokeMethod(methodName,  withArguments: arguments! as [AnyObject])
      }
      }, completion: completion)
  }
  
  // MARK: UIApplicationDelegate
  func application(application: UIApplication, didFinishLaunchingWithOptions launchOptions: [NSObject: AnyObject]?) -> Bool {
    self.window = UIWindow(frame: UIScreen.mainScreen().bounds)
    
    let appControllerContext = TVApplicationControllerContext()
    
    let javascriptURL = AppDelegate.getAppURL()
    
    appControllerContext.javaScriptApplicationURL = javascriptURL
    if let options = launchOptions {
      for (kind, value) in options {
        if let kindStr = kind as? String {
          appControllerContext.launchOptions[kindStr] = value
        }
      }
    }
   
    // provide BASEURL
    appControllerContext.launchOptions["BASEURL"] = resourceLoader.getBasePath();
    appController = TVApplicationController(context: appControllerContext, window: self.window, delegate: self)
    
    return true
  }
  
  
  func applicationWillResignActive(application: UIApplication) {
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
    // Use this method to pause ongoing tasks, disable timers, and stop playback
    executeRemoteMethod("onWillResignActive",arguments: [], completion: { (success: Bool) in
      // ...
    })
  }
  
  func applicationDidEnterBackground(application: UIApplication) {
    // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
    // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    executeRemoteMethod("onDidEnterBackground",arguments: [], completion: { (success: Bool) in
      // ...
    })
  }
  
  func applicationWillEnterForeground(application: UIApplication) {
    // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
    executeRemoteMethod("onWillEnterForeground",arguments: [], completion: { (success: Bool) in
      // ...
    })
  }
  
  func applicationDidBecomeActive(application: UIApplication) {
    // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    executeRemoteMethod("onDidBecomeActive",arguments: [], completion: { (success: Bool) in
      // ...
    })
  }
  
  func applicationWillTerminate(application: UIApplication) {
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    executeRemoteMethod("onWillTerminate",arguments: [], completion: { (success: Bool) in
      // ...
    })
  }
  
  // MARK: TVApplicationControllerDelegate
  
  func appController(appController: TVApplicationController, didFinishLaunchingWithOptions options: [String: AnyObject]?) {
    print("\(__FUNCTION__) invoked with options: \(options)")
    self.registerSettingsBundle()
    self.defaultsChanged()
    NSNotificationCenter.defaultCenter().addObserver(self,
                                                     selector: "defaultsChanged",
                                                     name: NSUserDefaultsDidChangeNotification,
                                                     object: nil)
  
}
  
  func appController(appController: TVApplicationController, didFailWithError error: NSError) {
    print("\(__FUNCTION__) invoked with error: \(error)")
    
    let title = "Error Launching Application"
    let message = error.localizedDescription
    let alertController = UIAlertController(title: title, message: message, preferredStyle:.Alert )
    
    self.appController?.navigationController.presentViewController(alertController, animated: true, completion: {
      // ...
    })
  }
  
  func appController(appController: TVApplicationController, didStopWithOptions options: [String: AnyObject]?) {
    print("\(__FUNCTION__) invoked with options: \(options)")
  }
}

