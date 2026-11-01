import SwiftUI
import UIKit

struct HomeRoute: Hashable {
  let url: URL
  let title: String
}

struct ReaderView: View {
  let url: URL
  let title: String
  @State private var session: WebSession?

  var body: some View {
    Group {
      if let session {
        ReaderChrome(session: session, fallbackTitle: title)
      } else {
        ProgressView()
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
    }
    .task {
      if session == nil {
        session = WebSession(startURL: url)
      }
    }
  }
}

private struct ReaderChrome: View {
  @Bindable var session: WebSession
  let fallbackTitle: String

  var body: some View {
    WebSessionView(session: session)
      .navigationTitle(session.pageTitle.isEmpty ? fallbackTitle : session.pageTitle)
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItemGroup(placement: .topBarTrailing) {
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
      }
  }
}
