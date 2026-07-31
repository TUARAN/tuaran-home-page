export const runtime = 'edge'

export function GET(request) {
  return Response.redirect(new URL('/og.png', request.url), 307)
}
