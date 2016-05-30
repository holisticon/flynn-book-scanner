//
//  CalendarData.swift
//  Flynn Book Scanner
//
//  Created by Martin Reinhardt on 18.04.16.
//  Copyright © 2016 Holisticon AG. All rights reserved.
//
import UIKit
import TVMLKit

@objc protocol BookJSData : JSExport {
  
  func getID()->String?
}

class BookData: NSObject, BookJSData {
  
  let id: String
  
  init(id: String){
    self.id = id
  }
  
  func getID()->String? {
    return self.id
  }
}
 