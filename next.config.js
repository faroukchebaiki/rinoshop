/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
			},
			{
				protocol: "https",
				hostname: "rinoshop.vercel.app",
			},
			{
				protocol: "https",
				hostname: "**.blob.vercel-storage.com",
			},
		],
	},
};

module.exports = nextConfig;
