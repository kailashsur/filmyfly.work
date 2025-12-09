import { AuthRequest } from '../middleware/auth.middleware.js';
import { Response } from 'express';
import { readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logDir = join(__dirname, '../../logs');
const logFile = join(logDir, 'app.log');
const errorLogFile = join(logDir, 'error.log');

/**
 * Get logs page
 */
export const getLogs = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.render('admin/logs', {
      title: 'View Logs',
      logs: '',
      errorLogs: '',
      error: null
    });
  } catch (error: any) {
    res.render('admin/logs', {
      title: 'View Logs',
      logs: '',
      errorLogs: '',
      error: 'Failed to load logs page'
    });
  }
};

/**
 * Get logs data (for AJAX/SSE)
 */
export const getLogsData = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    let logs = '';
    let errorLogs = '';
    let logSize = 0;
    let errorLogSize = 0;

    try {
      const logStats = await stat(logFile);
      logSize = logStats.size;
      // Read last 100KB of logs (or entire file if smaller)
      const startPos = Math.max(0, logSize - 100 * 1024);
      const logBuffer = await readFile(logFile);
      logs = logBuffer.toString('utf-8', startPos);
    } catch (error) {
      logs = 'No logs available yet.';
    }

    try {
      const errorStats = await stat(errorLogFile);
      errorLogSize = errorStats.size;
      // Read last 100KB of error logs (or entire file if smaller)
      const startPos = Math.max(0, errorLogSize - 100 * 1024);
      const errorBuffer = await readFile(errorLogFile);
      errorLogs = errorBuffer.toString('utf-8', startPos);
    } catch (error) {
      errorLogs = 'No error logs available yet.';
    }

    res.json({
      success: true,
      logs: logs,
      errorLogs: errorLogs,
      logSize: logSize,
      errorLogSize: errorLogSize,
      logSizeFormatted: formatBytes(logSize),
      errorLogSizeFormatted: formatBytes(errorLogSize)
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to read logs: ' + error.message
    });
  }
};

/**
 * Clear logs
 */
export const clearLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.body; // 'all', 'app', 'error'

    if (type === 'all' || type === 'app') {
      try {
        await writeFile(logFile, '', 'utf-8');
      } catch (error) {
        // File might not exist yet
      }
    }

    if (type === 'all' || type === 'error') {
      try {
        await writeFile(errorLogFile, '', 'utf-8');
      } catch (error) {
        // File might not exist yet
      }
    }

    res.json({
      success: true,
      message: type === 'all' ? 'All logs cleared successfully' : 
               type === 'app' ? 'Application logs cleared successfully' :
               'Error logs cleared successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear logs: ' + error.message
    });
  }
};

/**
 * Download logs
 */
export const downloadLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query; // 'app' or 'error'

    const file = type === 'error' ? errorLogFile : logFile;
    const filename = type === 'error' ? 'error.log' : 'app.log';

    try {
      const logContent = await readFile(file, 'utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(logContent);
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'Log file not found'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to download logs: ' + error.message
    });
  }
};

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

