import Observation
import UIKit
import WebKit

struct IdentifiedURL: Identifiable, Hashable {
  let url: URL
  var id: String { url.absoluteString }
}

@MainActor
@Observable
final class WebSession {
  let startURL: URL
  var currentURL: URL
  var isLoading = true
  var progress = 0.05
  var errorMessage: String?
  var pageTitle = ""
  var externalURL: IdentifiedURL?

  let webView: WKWebView
  private let bridge: WebBridge
  private var progressObservation: NSKeyValueObservation?

  init(startURL: URL) {
    self.startURL = startURL
    currentURL = startURL
    let webView = SiteWebViewFactory.makeWebView()
    let bridge = WebBridge()
    self.webView = webView
    self.bridge = bridge
    bridge.session = self
    webView.navigationDelegate = bridge
    superInitProgress(webView)
    installRefresh(on: webView)
    load(startURL)
  }

  func load(_ url: URL) {
    let target = SitePolicy.httpsURL(url)
    errorMessage = nil
    isLoading = true
    progress = 0.05
    currentURL = target
    webView.load(URLRequest(url: target))
  }

  func reload() {
    errorMessage = nil
    if webView.url != nil {
      isLoading = true
      webView.reload()
    } else {
      load(startURL)
    }
  }

  func follow(_ url: URL, route: SitePolicy.LinkRoute) {
    switch route {
    case .inApp:
      load(url)
    case .safari:
      externalURL = IdentifiedURL(url: url)
    case .system:
      UIApplication.shared.open(url)
    }
  }

  fileprivate func didStart() {
    isLoading = true
    errorMessage = nil
  }

  fileprivate func didFinish() {
    isLoading = false
    progress = 1
    pageTitle = webView.title ?? ""
    currentURL = webView.url ?? currentURL
    errorMessage = nil
    webView.scrollView.refreshControl?.endRefreshing()
  }

  fileprivate func didFail(_ error: Error) {
    webView.scrollView.refreshControl?.endRefreshing()
    isLoading = false
    if Self.isCancellation(error) { return }
    errorMessage = "页面没有打开。检查网络后再试。"
  }

  private func superInitProgress(_ webView: WKWebView) {
    progressObservation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] _, change in
      let value = change.newValue ?? 0
      Task { @MainActor in
        self?.progress = max(value, 0.05)
      }
    }
  }

  private func installRefresh(on webView: WKWebView) {
    let refresh = UIRefreshControl()
    refresh.addAction(UIAction { [weak self] _ in
      self?.reload()
    }, for: .valueChanged)
    webView.scrollView.refreshControl = refresh
  }

  private static func isCancellation(_ error: Error) -> Bool {
    let nsError = error as NSError
    if nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled { return true }
    if nsError.domain == "WebKitErrorDomain" && nsError.code == 102 { return true }
    return false
  }
}

private final class WebBridge: NSObject, WKNavigationDelegate {
  weak var session: WebSession?

  func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
    Task { @MainActor in
      session?.didStart()
    }
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    Task { @MainActor in
      session?.didFinish()
    }
  }

  func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    Task { @MainActor in
      session?.didFail(error)
    }
  }

  func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
    Task { @MainActor in
      session?.didFail(error)
    }
  }

  func webView(
    _ webView: WKWebView,
    decidePolicyFor navigationAction: WKNavigationAction,
    decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
  ) {
    guard let url = navigationAction.request.url else {
      decisionHandler(.allow)
      return
    }
    let route = SitePolicy.route(for: url)
    if navigationAction.targetFrame == nil {
      decisionHandler(.cancel)
      Task { @MainActor in
        session?.follow(url, route: route)
      }
      return
    }
    let isMainFrame = navigationAction.targetFrame?.isMainFrame ?? false
    if isMainFrame, route != .inApp {
      decisionHandler(.cancel)
      Task { @MainActor in
        session?.follow(url, route: route)
      }
      return
    }
    if isMainFrame, route == .inApp, url.scheme?.lowercased() == "http" {
      decisionHandler(.cancel)
      Task { @MainActor in
        session?.load(url)
      }
      return
    }
    decisionHandler(.allow)
  }
}
