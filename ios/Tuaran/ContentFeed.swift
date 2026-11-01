import Foundation

struct ContentEntry: Decodable, Identifiable, Hashable {
  let contentKey: String
  let type: String
  let title: String
  let summary: String
  let tags: [String]
  let href: String
  let date: String
  let slug: String

  var id: String { contentKey }

  enum CodingKeys: String, CodingKey {
    case contentKey, type, title, summary, tags, href, date, slug
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    contentKey = try container.decode(String.self, forKey: .contentKey)
    type = try container.decodeIfPresent(String.self, forKey: .type) ?? ""
    title = try container.decodeIfPresent(String.self, forKey: .title) ?? ""
    summary = try container.decodeIfPresent(String.self, forKey: .summary) ?? ""
    tags = try container.decodeIfPresent([String].self, forKey: .tags) ?? []
    href = try container.decodeIfPresent(String.self, forKey: .href) ?? ""
    date = try container.decodeIfPresent(String.self, forKey: .date) ?? ""
    slug = try container.decodeIfPresent(String.self, forKey: .slug) ?? ""
  }
}

enum ContentKind: String, CaseIterable, Identifiable {
  case all
  case article
  case research
  case resource

  var id: String { rawValue }

  var title: String {
    switch self {
    case .all: return "全部"
    case .article: return "文章"
    case .research: return "调研"
    case .resource: return "资源"
    }
  }

  func matches(_ type: String) -> Bool {
    self == .all || type == rawValue
  }
}

enum ContentFeedError: LocalizedError {
  case offline
  case badStatus
  case unreadable

  var errorDescription: String? {
    switch self {
    case .offline: return "网络没有连上，稍后再试。"
    case .badStatus: return "内容索引暂时没有返回。"
    case .unreadable: return "内容索引暂时读不出来。"
    }
  }
}

enum ContentFeed {
  static func decode(_ data: Data) throws -> [ContentEntry] {
    try JSONDecoder().decode(ContentIndexResponse.self, from: data).entries
  }

  static func fetch(urlSession: URLSession = .shared) async throws -> [ContentEntry] {
    var request = URLRequest(url: SitePolicy.contentIndexURL, timeoutInterval: 20)
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    let data: Data
    let response: URLResponse
    do {
      (data, response) = try await urlSession.data(for: request)
    } catch {
      throw ContentFeedError.offline
    }
    guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
      throw ContentFeedError.badStatus
    }
    do {
      return try decode(data)
    } catch {
      throw ContentFeedError.unreadable
    }
  }

  static func pageURL(href: String, origin: URL = SitePolicy.origin) -> URL? {
    let trimmed = href.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.hasPrefix("https://") || trimmed.hasPrefix("http://") {
      guard let url = URL(string: trimmed) else { return nil }
      let scheme = url.scheme?.lowercased() ?? ""
      guard scheme == "https" || scheme == "http" else { return nil }
      return url
    }
    guard trimmed.hasPrefix("/") else { return nil }
    return URL(string: trimmed, relativeTo: origin)?.absoluteURL
  }

  static func visible(_ entries: [ContentEntry], kind: ContentKind, query: String) -> [ContentEntry] {
    let needle = query.trimmingCharacters(in: .whitespacesAndNewlines).localizedLowercase
    return entries
      .filter { !$0.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
      .filter { pageURL(href: $0.href) != nil }
      .filter { kind.matches($0.type) }
      .filter { needle.isEmpty || matches($0, needle: needle) }
      .sorted { lhs, rhs in
        if lhs.date == rhs.date { return lhs.title < rhs.title }
        return lhs.date > rhs.date
      }
  }

  static func typeLabel(_ type: String) -> String {
    switch type {
    case "article": return "文章"
    case "research": return "调研"
    case "resource": return "资源"
    case "feed": return "订阅"
    case "rich-page": return "专题"
    default: return "内容"
    }
  }

  private static func matches(_ entry: ContentEntry, needle: String) -> Bool {
    let fields = [entry.title, entry.summary, entry.slug, entry.tags.joined(separator: " ")]
    return fields.contains { $0.localizedLowercase.contains(needle) }
  }
}

private struct ContentIndexResponse: Decodable {
  let entries: [ContentEntry]
}
