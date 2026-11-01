import SwiftUI

@MainActor
@Observable
final class HomeModel {
  var entries: [ContentEntry] = []
  var kind: ContentKind = .all
  var query = ""
  var phase: LoadPhase = .loading
  private var inFlight = false

  enum LoadPhase: Equatable {
    case loading
    case ready
    case failed(String)
  }

  var visibleEntries: [ContentEntry] {
    ContentFeed.visible(entries, kind: kind, query: query)
  }

  func loadIfNeeded() async {
    guard entries.isEmpty, !inFlight else { return }
    await reload()
  }

  func reload() async {
    guard !inFlight else { return }
    inFlight = true
    defer { inFlight = false }
    do {
      entries = try await ContentFeed.fetch()
      phase = .ready
    } catch {
      if entries.isEmpty {
        let message = (error as? LocalizedError)?.errorDescription ?? "内容没有加载。"
        phase = .failed(message)
      }
    }
  }
}

struct HomeFeedView: View {
  @State private var model = HomeModel()

  var body: some View {
    NavigationStack {
      VStack(spacing: 0) {
        filterBar
        feedBody
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      }
      .navigationTitle("2aran")
      .navigationBarTitleDisplayMode(.large)
      .searchable(text: Bindable(model).query, prompt: "搜索标题、摘要或标签")
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) {
          NavigationLink(value: HomeRoute(url: SitePolicy.origin, title: "网站首页")) {
            Image(systemName: "globe")
          }
          .accessibilityLabel("打开网站首页")
        }
      }
      .navigationDestination(for: HomeRoute.self) { route in
        ReaderView(url: route.url, title: route.title)
      }
      .task {
        await model.loadIfNeeded()
      }
    }
  }

  private var filterBar: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: 8) {
        ForEach(ContentKind.allCases) { kind in
          let selected = model.kind == kind
          Button {
            model.kind = kind
          } label: {
            Text(kind.title)
              .font(.subheadline.weight(selected ? .semibold : .regular))
              .padding(.horizontal, 12)
              .padding(.vertical, 6)
              .background(selected ? Color.primary : Color.primary.opacity(0.08), in: Capsule())
              .foregroundStyle(selected ? Color(uiColor: .systemBackground) : Color.primary)
          }
          .buttonStyle(.plain)
          .accessibilityAddTraits(selected ? .isSelected : [])
        }
        Text("\(model.visibleEntries.count)")
          .font(.caption)
          .foregroundStyle(.secondary)
          .padding(.leading, 4)
      }
      .padding(.horizontal, 16)
      .padding(.vertical, 8)
    }
  }

  @ViewBuilder
  private var feedBody: some View {
    switch model.phase {
    case .loading where model.entries.isEmpty:
      ProgressView("正在读取内容")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    case .failed(let message) where model.entries.isEmpty:
      ContentUnavailableView {
        Label("内容没有加载", systemImage: "wifi.exclamationmark")
      } description: {
        Text(message)
      } actions: {
        Button("重试") {
          Task { await model.reload() }
        }
      }
    default:
      if model.visibleEntries.isEmpty {
        if model.query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
          ContentUnavailableView("没有这条内容", systemImage: "doc.text.magnifyingglass", description: Text("换一个分类再看。"))
        } else {
          ContentUnavailableView.search(text: model.query)
        }
      } else {
        List(model.visibleEntries) { entry in
          entryRow(entry)
        }
        .listStyle(.plain)
        .refreshable {
          await model.reload()
        }
      }
    }
  }

  @ViewBuilder
  private func entryRow(_ entry: ContentEntry) -> some View {
    if let url = ContentFeed.pageURL(href: entry.href), SitePolicy.route(for: url) == .inApp {
      NavigationLink(value: HomeRoute(url: url, title: entry.title)) {
        entryLabel(entry)
      }
    } else {
      entryLabel(entry)
    }
  }

  private func entryLabel(_ entry: ContentEntry) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text(ContentFeed.typeLabel(entry.type))
        Spacer()
        Text(entry.date)
      }
      .font(.caption)
      .foregroundStyle(.secondary)
      Text(entry.title)
        .font(.headline)
        .foregroundStyle(.primary)
        .lineLimit(3)
      if !entry.summary.isEmpty {
        Text(entry.summary)
          .font(.subheadline)
          .foregroundStyle(.secondary)
          .lineLimit(2)
      }
    }
    .padding(.vertical, 4)
  }
}
