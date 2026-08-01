const Attraction = require('../models/Attraction');
const Blog = require('../models/Blog');
const asyncHandler = require('../utils/asyncHandler');

exports.generateSitemap = asyncHandler(async (req, res, next) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  const staticPages = [
    '',
    '/about',
    '/rooms',
    '/tours',
    '/events',
    '/gallery',
    '/attractions',
    '/blogs',
    '/contact'
  ];

  const attractions = await Attraction.find({ status: 'Published' }).select('slug updatedAt');
  const blogs = await Blog.find({ status: 'Published' }).select('slug updatedAt');

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Add static pages
  staticPages.forEach(page => {
    sitemap += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
  });

  // Add attractions
  attractions.forEach(attraction => {
    sitemap += `  <url>\n    <loc>${baseUrl}/attractions/${attraction.slug}</loc>\n    <lastmod>${new Date(attraction.updatedAt).toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });

  // Add blogs
  blogs.forEach(blog => {
    sitemap += `  <url>\n    <loc>${baseUrl}/blog/${blog.slug}</loc>\n    <lastmod>${new Date(blog.updatedAt).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  });

  sitemap += `</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.status(200).send(sitemap);
});
