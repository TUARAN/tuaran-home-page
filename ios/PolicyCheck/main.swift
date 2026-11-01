import Foundation

func expect(_ condition: @autoclosure () -> Bool, _ message: String) {
  if !condition() {
    fputs("FAIL \(message)\n", stderr)
    exit(1)
  }
}

expect(SitePolicy.contentIndexURL.absoluteString == "https://2aran.com/api/content", "content url")
expect(SitePolicy.httpsURL(URL(string: "http://2aran.com/articles?x=1")!).absoluteString == "https://2aran.com/articles?x=1", "upgrade site http")
expect(SitePolicy.httpsURL(URL(string: "https://2aran.com/a")!).absoluteString == "https://2aran.com/a", "keep https")
expect(SitePolicy.httpsURL(URL(string: "http://example.com")!).absoluteString == "http://example.com", "leave external http")
expect(SitePolicy.route(for: URL(string: "https://2aran.com/articles")!) == .inApp, "site")
expect(SitePolicy.route(for: URL(string: "https://admin.2aran.com/admin")!) == .inApp, "admin")
expect(SitePolicy.route(for: URL(string: "http://2aran.com/articles")!) == .inApp, "http site")
expect(SitePolicy.route(for: URL(string: "https://github.com/login/oauth/authorize")!) == .inApp, "github")
expect(SitePolicy.route(for: URL(string: "https://accounts.google.com/o/oauth2/v2/auth")!) == .inApp, "google")
expect(SitePolicy.route(for: URL(string: "https://open.weixin.qq.com/connect/qrconnect")!) == .inApp, "wechat")
expect(SitePolicy.route(for: URL(string: "https://example.com")!) == .safari, "external")
expect(SitePolicy.route(for: URL(string: "http://github.com/login")!) == .safari, "insecure oauth")
expect(SitePolicy.route(for: URL(string: "mailto:tuaran@2aran.com")!) == .system, "mail")
expect(SitePolicy.route(for: URL(string: "https://evil2aran.com")!) == .safari, "lookalike")
expect(SitePolicy.route(for: URL(string: "https://2aran.com.evil.com")!) == .safari, "suffix trick")
expect(ContentFeed.pageURL(href: "/articles")?.absoluteString == "https://2aran.com/articles", "relative page")
expect(ContentFeed.pageURL(href: "javascript:alert(1)") == nil, "script href")

let json = """
{"entries":[
  {"contentKey":"a","type":"article","title":"甲","summary":"摘要","tags":["Swift"],"href":"/articles/a","date":"2026-10-01","slug":"a"},
  {"contentKey":"b","type":"research","title":"乙","summary":"","tags":[],"href":"/articles/b","date":"2026-10-02","slug":"b"},
  {"contentKey":"c","type":"article","title":"  ","summary":"","tags":[],"href":"/articles/c","date":"2026-10-03","slug":"c"},
  {"contentKey":"d","type":"resource","title":"外站","summary":"","tags":[],"href":"javascript:alert(1)","date":"2026-10-04","slug":"d"}
]}
""".data(using: .utf8)!

do {
  let entries = try ContentFeed.decode(json)
  expect(ContentFeed.visible(entries, kind: .all, query: "").map(\.contentKey) == ["b", "a"], "order and filter")
  expect(ContentFeed.visible(entries, kind: .article, query: "swift").map(\.contentKey) == ["a"], "search tag")
} catch {
  fputs("FAIL decode \(error)\n", stderr)
  exit(1)
}
expect(ContentFeed.typeLabel("research") == "调研", "type label")

print("policy checks passed")
