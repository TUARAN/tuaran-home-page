const DISTINCT_STANCES = new Set(['support', 'question', 'oppose'])

export function selectHomeOpinionPosts(posts, limit = 6) {
  if (!Array.isArray(posts) || limit <= 0) return []

  const distinct = []
  const neutral = []

  for (const post of posts) {
    if (!/^https?:\/\//i.test(post?.url || '')) continue
    if (DISTINCT_STANCES.has(post.stance)) distinct.push(post)
    else neutral.push(post)
  }

  return distinct.concat(neutral).slice(0, limit)
}
