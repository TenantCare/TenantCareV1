/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		// Allow Google profile images used by Google OAuth
		domains: [
			'lh3.googleusercontent.com',
		],
	},
	eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
