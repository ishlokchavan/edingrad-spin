/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'
const securityHeaders = [
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	{ key: 'X-Frame-Options', value: 'DENY' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
	{
		key: 'Content-Security-Policy',
		value: [
			"default-src 'self'",
			"base-uri 'self'",
			"frame-ancestors 'none'",
			"img-src 'self' data: blob: https:",
			"font-src 'self' https://fonts.gstatic.com data:",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
			"connect-src 'self' https: wss:",
			"form-action 'self'",
		].join('; '),
	},
	{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
]

const nextConfig = {
	reactStrictMode: true,
	async headers() {
		return [
			{
				source: '/:path*',
				headers: securityHeaders,
			},
		]
	},
}

export default nextConfig
