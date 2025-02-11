import { Config } from '../../../src/config';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    return ['acknowledgments', 'privacy-policy', 'terms'].map((page) => ({
        url: `${Config.publicUrl}/about/${page}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.9
    }));
}
