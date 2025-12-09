import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

export const getSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all settings
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    });

    // Convert to key-value object for easier access in view
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.render('admin/settings', {
      title: 'Settings',
      settings: settingsObj,
      error: null,
      success: null
    });
  } catch (error: any) {
    logger.error('Error fetching settings:', error).catch(() => {});
    res.render('admin/settings', {
      title: 'Settings',
      settings: {},
      error: 'Failed to load settings',
      success: null
    });
  }
};

export const postSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      downloadRedirectUrl,
      googleTagManagerHead,
      googleTagManagerBody,
      googleAnalytics,
      googleSearchConsole,
      adsenseCode,
      adsteraCode,
      siteUrl
    } = req.body;

    // Validate URL format
    if (downloadRedirectUrl && downloadRedirectUrl.trim() !== '') {
      try {
        new URL(downloadRedirectUrl);
      } catch {
        const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
        const settingsObj: Record<string, string> = {};
        settings.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        settingsObj.downloadRedirectUrl = downloadRedirectUrl || '';
        
        res.render('admin/settings', {
          title: 'Settings',
          settings: settingsObj,
          error: 'Invalid URL format. Please enter a valid URL.',
          success: null
        });
        return;
      }
    }

    // Validate site URL format if provided
    if (siteUrl && siteUrl.trim() !== '') {
      try {
        const url = new URL(siteUrl);
        // Ensure it's a valid URL
        if (!url.protocol.startsWith('http')) {
          const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
          const settingsObj: Record<string, string> = {};
          settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
          });
          settingsObj.siteUrl = siteUrl || '';
          
          res.render('admin/settings', {
            title: 'Settings',
            settings: settingsObj,
            error: 'Site URL must start with http:// or https://',
            success: null
          });
          return;
        }
      } catch {
        const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
        const settingsObj: Record<string, string> = {};
        settings.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });
        settingsObj.siteUrl = siteUrl || '';
        
        res.render('admin/settings', {
          title: 'Settings',
          settings: settingsObj,
          error: 'Invalid URL format. Please enter a valid URL (e.g., https://filmyfly.work).',
          success: null
        });
        return;
      }
    }

    // Define all settings to save
    const settingsToSave = [
      { key: 'downloadRedirectUrl', value: downloadRedirectUrl || '', description: 'Redirect URL for download links' },
      { key: 'googleTagManagerHead', value: googleTagManagerHead || '', description: 'Google Tag Manager code for <head> section' },
      { key: 'googleTagManagerBody', value: googleTagManagerBody || '', description: 'Google Tag Manager noscript code for <body> section' },
      { key: 'googleAnalytics', value: googleAnalytics || '', description: 'Google Analytics (gtag.js) code' },
      { key: 'googleSearchConsole', value: googleSearchConsole || '', description: 'Google Search Console verification meta tag' },
      { key: 'adsenseCode', value: adsenseCode || '', description: 'Google AdSense code' },
      { key: 'adsteraCode', value: adsteraCode || '', description: 'Adstera ad code' },
      { key: 'siteUrl', value: siteUrl || 'https://filmyfly.work', description: 'Site URL (used in meta tags, Open Graph, Twitter Card, etc.)' }
    ];

    // Save all settings
    for (const setting of settingsToSave) {
      await prisma.setting.upsert({
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
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.render('admin/settings', {
      title: 'Settings',
      settings: settingsObj,
      error: null,
      success: 'Settings saved successfully!'
    });
  } catch (error: any) {
    logger.error('Error saving settings:', error).catch(() => {});
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.render('admin/settings', {
      title: 'Settings',
      settings: settingsObj,
      error: 'Failed to save settings: ' + (error.message || 'Unknown error'),
      success: null
    });
  }
};

