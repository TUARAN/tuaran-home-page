/**
 * 把在线文章正文映射成统一内容索引条目。
 * article_posts 是事实源；该返回值只用于维护 content_index 投影。
 */
export function articlePostToContentEntry(post) {
  const timestamp = post.publishedAt || post.updatedAt || post.createdAt
  return {
    contentKey: `article:${post.slug}`,
    type: 'article',
    category: 'posts',
    slug: post.slug,
    title: post.title,
    summary: post.summary || post.contentText.slice(0, 160),
    tags: post.tags || [],
    href: `/articles/${post.slug}`,
    date: timestamp ? new Date(timestamp).toISOString().slice(0, 10) : '',
    status: post.status === 'published' ? 'published' : 'draft',
    source: 'manual',
  }
}
