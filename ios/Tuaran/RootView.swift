import SwiftUI

enum AppTab: String, CaseIterable, Identifiable, Hashable {
  case home
  case content
  case tools
  case community
  case me

  var id: String { rawValue }

  var title: String {
    switch self {
    case .home: return "首页"
    case .content: return "内容"
    case .tools: return "工具"
    case .community: return "圈子"
    case .me: return "我的"
    }
  }

  var symbol: String {
    switch self {
    case .home: return "house"
    case .content: return "book"
    case .tools: return "wrench.and.screwdriver"
    case .community: return "person.3"
    case .me: return "person.crop.circle"
    }
  }

  var path: String? {
    switch self {
    case .home: return nil
    case .content: return "/articles"
    case .tools: return "/tools"
    case .community: return "/circles"
    case .me: return "/account"
    }
  }

  var url: URL? {
    guard let path else { return nil }
    return URL(string: path, relativeTo: SitePolicy.origin)?.absoluteURL
  }
}

struct RootView: View {
  @State private var selection: AppTab = .home

  var body: some View {
    TabView(selection: $selection) {
      HomeFeedView()
        .tabItem { Label(AppTab.home.title, systemImage: AppTab.home.symbol) }
        .tag(AppTab.home)
      LazyWebTab(tab: .content, selection: selection)
        .tabItem { Label(AppTab.content.title, systemImage: AppTab.content.symbol) }
        .tag(AppTab.content)
      LazyWebTab(tab: .tools, selection: selection)
        .tabItem { Label(AppTab.tools.title, systemImage: AppTab.tools.symbol) }
        .tag(AppTab.tools)
      LazyWebTab(tab: .community, selection: selection)
        .tabItem { Label(AppTab.community.title, systemImage: AppTab.community.symbol) }
        .tag(AppTab.community)
      LazyWebTab(tab: .me, selection: selection)
        .tabItem { Label(AppTab.me.title, systemImage: AppTab.me.symbol) }
        .tag(AppTab.me)
    }
    .tint(.primary)
  }
}

private struct LazyWebTab: View {
  let tab: AppTab
  let selection: AppTab
  @State private var session: WebSession?

  var body: some View {
    Group {
      if let session {
        WebSessionView(session: session, showsControls: true)
      } else if selection == tab {
        ProgressView()
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      } else {
        Color.clear
      }
    }
    .task(id: selection) {
      guard selection == tab, session == nil, let url = tab.url else { return }
      session = WebSession(startURL: url)
    }
  }
}
