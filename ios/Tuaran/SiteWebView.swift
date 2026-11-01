import SafariServices
import SwiftUI
import UIKit
import WebKit

@MainActor
enum SiteWebViewFactory {
  static func makeWebView() -> WKWebView {
    let configuration = WKWebViewConfiguration()
    configuration.websiteDataStore = .default()
    configuration.allowsInlineMediaPlayback = true
    configuration.mediaTypesRequiringUserActionForPlayback = []
    configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
    configuration.applicationNameForUserAgent = "TuaranIOS/1.0"
    let preferences = WKWebpagePreferences()
    preferences.allowsContentJavaScript = true
    configuration.defaultWebpagePreferences = preferences
    let script = WKUserScript(
      source: hideTabBarSource,
      injectionTime: .atDocumentStart,
      forMainFrameOnly: true
    )
    configuration.userContentController.addUserScript(script)

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.allowsBackForwardNavigationGestures = true
    webView.scrollView.keyboardDismissMode = .interactive
    let background = UIColor { traits in
      traits.userInterfaceStyle == .dark
        ? UIColor(red: 17 / 255, green: 16 / 255, blue: 14 / 255, alpha: 1)
        : UIColor(red: 226 / 255, green: 226 / 255, blue: 226 / 255, alpha: 1)
    }
    webView.backgroundColor = background
    webView.scrollView.backgroundColor = background
    #if DEBUG
    webView.isInspectable = true
    #endif
    return webView
  }

  private static let hideTabBarSource = """
  (function () {
    var root = document.documentElement;
    root.classList.add('tuaran-ios-app');
    var style = document.createElement('style');
    style.setAttribute('data-tuaran-ios', 'tabbar');
    style.textContent = 'html.tuaran-ios-app{--site-tabbar-height:0px;}html.tuaran-ios-app .site-mobile-tabbar{display:none!important;}html.tuaran-ios-app body{padding-bottom:env(safe-area-inset-bottom,0px)!important;}';
    root.appendChild(style);
  })();
  """
}

struct WebSessionView: View {
  @Bindable var session: WebSession
  var showsControls = false

  var body: some View {
    VStack(spacing: 0) {
      if showsControls {
        HStack(spacing: 16) {
          Button {
            session.reload()
          } label: {
            Image(systemName: "arrow.clockwise")
          }
          .accessibilityLabel("刷新")
          Spacer()
          ShareLink(item: session.currentURL) {
            Image(systemName: "square.and.arrow.up")
          }
          .accessibilityLabel("分享")
          Button {
            UIApplication.shared.open(session.currentURL)
          } label: {
            Image(systemName: "safari")
          }
          .accessibilityLabel("在 Safari 打开")
        }
        .font(.body)
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(.bar)
      }
      if session.isLoading {
        ProgressView(value: min(max(session.progress, 0.05), 1))
          .progressViewStyle(.linear)
          .tint(.primary)
      }
      ZStack {
        WebViewRepresentable(webView: session.webView)
        if let message = session.errorMessage, session.webView.url == nil {
          ContentUnavailableView {
            Label("页面没有打开", systemImage: "wifi.exclamationmark")
          } description: {
            Text(message)
          } actions: {
            Button("重试") { session.reload() }
          }
          .background(Color(uiColor: .systemBackground))
        } else if let message = session.errorMessage {
          VStack {
            Spacer()
            Text(message)
              .font(.footnote)
              .padding(.horizontal, 12)
              .padding(.vertical, 8)
              .background(.thinMaterial, in: Capsule())
              .padding(.bottom, 12)
          }
        }
      }
    }
    .sheet(item: $session.externalURL) { item in
      SafariView(url: item.url)
        .ignoresSafeArea()
    }
  }
}

private struct WebViewRepresentable: UIViewRepresentable {
  let webView: WKWebView

  func makeUIView(context: Context) -> WebContainerView {
    if let container = webView.superview as? WebContainerView {
      return container
    }
    webView.removeFromSuperview()
    return WebContainerView(webView: webView)
  }

  func updateUIView(_ uiView: WebContainerView, context: Context) {}
}

private final class WebContainerView: UIView {
  init(webView: WKWebView) {
    super.init(frame: .zero)
    backgroundColor = .clear
    webView.translatesAutoresizingMaskIntoConstraints = false
    addSubview(webView)
    NSLayoutConstraint.activate([
      webView.leadingAnchor.constraint(equalTo: leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: trailingAnchor),
      webView.topAnchor.constraint(equalTo: topAnchor),
      webView.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}

struct SafariView: UIViewControllerRepresentable {
  let url: URL

  func makeUIViewController(context: Context) -> SFSafariViewController {
    SFSafariViewController(url: url)
  }

  func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}
