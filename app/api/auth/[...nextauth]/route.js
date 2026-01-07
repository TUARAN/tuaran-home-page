export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
	return Response.json(
		{
			error: 'DEPRECATED',
			message: 'This project uses Cloudflare Pages GitHub OAuth at /api/auth/login',
		},
		{ status: 410 }
	)
}

export const POST = GET

