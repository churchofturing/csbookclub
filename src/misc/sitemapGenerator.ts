import { promises as fs } from 'fs';
import { Topic, Prisma } from '@prisma/client';
import path from 'path';
import prisma from '../misc/db.js';

type ThreadWithTopic = Prisma.ThreadGetPayload<{
  include: {
    topic: {
      select: { slug: true };
    };
  };
}>;

// Generates a sitemap every n minutes. Pretty straightforward.
class SimpleSitemapGenerator {
  private baseUrl: string;
  private sitemapPath: string;

  constructor(baseUrl: string = 'https://csbook.club', refreshInterval: number = 120) {
    this.baseUrl = baseUrl;
    this.sitemapPath = path.join(__dirname, '../../public', 'sitemap.xml');

    // Generate the sitemap on server start, and kick off the interval.
    this.generateSitemap();
    setInterval(
      () => {
        this.generateSitemap();
      },
      refreshInterval * 60 * 1000,
    );
  }

  async generateSitemap(): Promise<void> {
    try {
      const topics: Topic[] = (await this.getCategories()) || [];
      const threads: ThreadWithTopic[] = (await this.getRecentThreads()) || [];

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${this.baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${topics[0]?.lastBumped?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;

      // Add categories
      topics.forEach((topic) => {
        sitemap += `
  <url>
    <loc>${this.baseUrl}/${topic.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
    <lastmod>${topic.lastBumped.toISOString().split('T')[0]}</lastmod>
  </url>`;
      });

      // Add threads
      threads.forEach((thread) => {
        sitemap += `
  <url>
    <loc>${this.baseUrl}/${thread.topic.slug}/${thread.globalCount}/${thread.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
    <lastmod>${thread.lastBumped.toISOString().split('T')[0]}</lastmod>
  </url>`;
      });

      sitemap += `
</urlset>`;

      await fs.writeFile(this.sitemapPath, sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
    }
  }

  private async getCategories(): Promise<Topic[]> {
    const topics = await prisma.topic.findMany({
      orderBy: [{ lastBumped: 'desc' }],
    });

    return topics;
  }

  private async getRecentThreads(): Promise<ThreadWithTopic[]> {
    const threads = await prisma.thread.findMany({
      where: {
        // Not /prog/ threads. /prog/ has like 30k threads, lets ignore them for now.
        topicId: { not: 14 },
      },
      include: {
        topic: {
          select: { slug: true },
        },
      },
      orderBy: [{ lastBumped: 'desc' }],
    });

    return threads;
  }
}

export { SimpleSitemapGenerator };
