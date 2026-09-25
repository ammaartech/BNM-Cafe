import type {NextConfig} from 'next';

// Files in /public keep their name when their content changes, so they get a
// day of fresh caching plus a week of stale-while-revalidate rather than
// `immutable`: a replaced logo still shows up within a day.
const PUBLIC_ASSET_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      { source: '/demopresentation', destination: '/demopresentation.html' },
    ];
  },
  async headers() {
    const cached = [
      '/images/:path*',
      '/bnmlogoB.png',
      '/bnmlogoB12.png',
      '/qrcode1.png',
      '/notification-sound-effects-copyright-free_g2XT3kky.mp3',
    ];
    return cached.map((source) => ({
      source,
      headers: [{ key: 'Cache-Control', value: PUBLIC_ASSET_CACHE }],
    }));
  },
  images: {
    // AVIF where the browser accepts it, WebP otherwise: 20-50% smaller than
    // the original JPEG/PNG, and the photos are most of every page's weight.
    formats: ['image/avif', 'image/webp'],
    // Menu photos never change at a given URL. Keep optimized copies for 30
    // days instead of re-encoding them every minute (the default).
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Only the hosts src/lib/placeholder-images.json actually uses.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'plus.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.pexels.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
