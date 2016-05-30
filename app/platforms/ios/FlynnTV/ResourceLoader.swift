//
//  ResourceLoaderExport.swift
//  confiis
//
//  Created by Martin Reinhardt on 13.04.16.
//  Copyright © 2016 Holisticon AG. All rights reserved.
//


import Foundation
import JavaScriptCore


@objc protocol ResourceLoaderExport : JSExport {
  func getBasePath() -> String
  func getPath(name: String, _ directory: String! ) -> String
  func loadBundleResource(name: String, _ directory: String! ) -> String
  static func create() -> ResourceLoaderExport
}


@objc class ResourceLoader: NSObject, ResourceLoaderExport {
  
  func getBasePath( ) -> String {
    return  NSBundle.mainBundle().resourcePath!;
  }
  
  func getPath(name: String, _ directory: String! ) -> String {
    let path :String?
    if directory != nil {
      path = NSBundle.mainBundle().pathForResource(name, ofType: nil,inDirectory:directory)
    } else {
      path = NSBundle.mainBundle().pathForResource(name, ofType: nil)
    }
    return path!
  }
  
  func loadBundleResource(name: String, _ directory: String!) -> String {
    let path :String? = getPath(name, directory)
    let fileContent: String
    do {
      fileContent = try String(contentsOfFile: path!, encoding: NSUTF8StringEncoding)
    } catch {
      print("There was a problem")
      return ""
    }
    return fileContent
  }
  
  static func create() -> ResourceLoaderExport {
    return ResourceLoader()
  }
}
