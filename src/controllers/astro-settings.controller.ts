import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * GET /admin/astro-settings
 * Display Astro website settings page
 */
export const getAstroSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Get all Astro settings
        const astroSettings = await prisma.astroSetting.findMany({
            orderBy: { key: 'asc' }
        });

        // Get legacy settings for fallback/copying
        const legacySettings = await prisma.setting.findMany();

        // Convert to key-value object
        // Start with legacy settings, then overwrite with Astro-specific settings
        const settingsObj: Record<string, string> = {};

        legacySettings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });

        astroSettings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });

        res.render('admin/astro-settings', {
            title: 'Astro Website Settings',
            settings: settingsObj,
            error: null,
            success: null
        });
    } catch (error: any) {
        logger.error('Error fetching Astro settings:', error).catch(() => { });
        res.render('admin/astro-settings', {
            title: 'Astro Website Settings',
            settings: {},
            error: 'Failed to load Astro settings',
            success: null
        });
    }
};

/**
 * POST /admin/astro-settings
 * Save Astro website settings
 */
export const postAstroSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            downloadRedirectUrl,
            googleTagManagerHead,
            googleTagManagerBody,
            googleAnalytics,
            googleSearchConsole,
            adsenseCode,
            adsteraCode,
            siteUrl,
            siteName,
            // siteDescription removed as requested
            telegramLink,
            facebookLink,
            twitterLink,
            instagramLink
        } = req.body;

        // Validate URL formats
        const urlFields = [
            { name: 'downloadRedirectUrl', value: downloadRedirectUrl },
            { name: 'siteUrl', value: siteUrl },
            { name: 'telegramLink', value: telegramLink },
            { name: 'facebookLink', value: facebookLink },
            { name: 'twitterLink', value: twitterLink },
            { name: 'instagramLink', value: instagramLink }
        ];

        for (const field of urlFields) {
            if (field.value && field.value.trim() !== '') {
                try {
                    const url = new URL(field.value);
                    if (!url.protocol.startsWith('http')) {
                        throw new Error('Invalid protocol');
                    }
                } catch {
                    const settings = await prisma.astroSetting.findMany({ orderBy: { key: 'asc' } });
                    const legacySettings = await prisma.setting.findMany();

                    const settingsObj: Record<string, string> = {};
                    legacySettings.forEach(s => settingsObj[s.key] = s.value);
                    settings.forEach(s => settingsObj[s.key] = s.value);

                    res.render('admin/astro-settings', {
                        title: 'Astro Website Settings',
                        settings: { ...settingsObj, ...req.body },
                        error: `Invalid URL format for ${field.name}. Please enter a valid URL starting with http:// or https://`,
                        success: null
                    });
                    return;
                }
            }
        }

        // Define all Astro settings to save
        const settingsToSave = [
            { key: 'downloadRedirectUrl', value: downloadRedirectUrl || '', description: 'Redirect URL for download links (Astro)' },
            { key: 'googleTagManagerHead', value: googleTagManagerHead || '', description: 'Google Tag Manager code for <head> section (Astro)' },
            { key: 'googleTagManagerBody', value: googleTagManagerBody || '', description: 'Google Tag Manager noscript code for <body> section (Astro)' },
            { key: 'googleAnalytics', value: googleAnalytics || '', description: 'Google Analytics (gtag.js) code (Astro)' },
            { key: 'googleSearchConsole', value: googleSearchConsole || '', description: 'Google Search Console verification meta tag (Astro)' },
            { key: 'adsenseCode', value: adsenseCode || '', description: 'Google AdSense code (Astro)' },
            { key: 'adsteraCode', value: adsteraCode || '', description: 'Adstera ad code (Astro)' },
            { key: 'siteUrl', value: siteUrl || 'https://filmyfly.work', description: 'Site URL (Astro - used in meta tags, Open Graph, etc.)' },
            { key: 'siteName', value: siteName || 'FilmyFly', description: 'Site Name (Astro)' },
            // siteDescription removed
            { key: 'telegramLink', value: telegramLink || '', description: 'Telegram channel link (Astro)' },
            { key: 'facebookLink', value: facebookLink || '', description: 'Facebook page link (Astro)' },
            { key: 'twitterLink', value: twitterLink || '', description: 'Twitter profile link (Astro)' },
            { key: 'instagramLink', value: instagramLink || '', description: 'Instagram profile link (Astro)' }
        ];

        // Save all settings
        for (const setting of settingsToSave) {
            await prisma.astroSetting.upsert({
                where: { key: setting.key },
                update: {
                    value: setting.value,
                    description: setting.description
                },
                create: {
                    key: setting.key,
                    value: setting.value,
                    description: setting.description
                }
            });
        }

        // Fetch updated settings for display
        const settings = await prisma.astroSetting.findMany({ orderBy: { key: 'asc' } });
        const legacySettings = await prisma.setting.findMany();

        const settingsObj: Record<string, string> = {};
        legacySettings.forEach(s => settingsObj[s.key] = s.value);
        settings.forEach(s => settingsObj[s.key] = s.value);

        res.render('admin/astro-settings', {
            title: 'Astro Website Settings',
            settings: settingsObj,
            error: null,
            success: 'Astro settings saved successfully!'
        });
    } catch (error: any) {
        logger.error('Error saving Astro settings:', error).catch(() => { });
        const settings = await prisma.astroSetting.findMany({ orderBy: { key: 'asc' } });
        const legacySettings = await prisma.setting.findMany();

        const settingsObj: Record<string, string> = {};
        legacySettings.forEach(s => settingsObj[s.key] = s.value);
        settings.forEach(s => settingsObj[s.key] = s.value);

        res.render('admin/astro-settings', {
            title: 'Astro Website Settings',
            settings: settingsObj,
            error: 'Failed to save Astro settings: ' + (error.message || 'Unknown error'),
            success: null
        });
    }
};
