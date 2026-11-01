import Foundation

enum SitePolicy {
  static let origin = URL(string: "https://2aran.com")!
  static let contentIndexURL = URL(string: "https://2aran.com/api/content")!

  enum LinkRoute: Equatable {
    case inApp
    case safari
    case system
  }

  static func httpsURL(_ url: URL) -> URL {
    guard url.scheme?.lowercased() == "http",
          let host = url.host?.lowercased(),
          host == "2aran.com" || host.hasSuffix(".2aran.com"),
          var parts = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      return url
    }
    parts.scheme = "https"
    return parts.url ?? url
  }

  static func route(for url: URL) -> LinkRoute {
    let scheme = url.scheme?.lowercased() ?? ""
    if scheme == "about" || scheme == "blob" || scheme == "data" {
      return .inApp
    }
    if scheme == "mailto" || scheme == "tel" || scheme == "sms" {
      return .system
    }
    guard scheme == "https" || scheme == "http", let host = url.host?.lowercased() else {
      return .system
    }
    if host == "2aran.com" || host.hasSuffix(".2aran.com") {
      return .inApp
    }
    if scheme == "https", isOAuthHost(host) {
      return .inApp
    }
    return .safari
  }

  private static func isOAuthHost(_ host: String) -> Bool {
    if host == "github.com" || host == "www.github.com" { return true }
    if host == "accounts.google.com" { return true }
    if host == "appleid.apple.com" { return true }
    if host == "weixin.qq.com" || host.hasSuffix(".weixin.qq.com") { return true }
    return false
  }
}
