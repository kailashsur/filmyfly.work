import { appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log directory path
const logDir = join(__dirname, '../../logs');
const logFile = join(logDir, 'app.log');
const errorLogFile = join(logDir, 'error.log');

// Ensure log directory exists
async function ensureLogDir(): Promise<void> {
  if (!existsSync(logDir)) {
    await mkdir(logDir, { recursive: true });
  }
}

// Format log message with timestamp
function formatLog(level: string, message: string, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ') : '';
  return `[${timestamp}] [${level}] ${message}${formattedArgs}\n`;
}

// Write to log file
async function writeLog(file: string, message: string): Promise<void> {
  try {
    await ensureLogDir();
    await appendFile(file, message, 'utf-8');
  } catch (error) {
    // Silently fail - don't break the application if logging fails
  }
}

export const logger = {
  info: async (message: string, ...args: any[]): Promise<void> => {
    const logMessage = formatLog('INFO', message, ...args);
    await writeLog(logFile, logMessage);
  },

  warn: async (message: string, ...args: any[]): Promise<void> => {
    const logMessage = formatLog('WARN', message, ...args);
    await writeLog(logFile, logMessage);
    await writeLog(errorLogFile, logMessage);
  },

  error: async (message: string, ...args: any[]): Promise<void> => {
    const logMessage = formatLog('ERROR', message, ...args);
    await writeLog(logFile, logMessage);
    await writeLog(errorLogFile, logMessage);
  },

  // For compatibility with console.log usage
  log: async (message: string, ...args: any[]): Promise<void> => {
    await logger.info(message, ...args);
  }
};

// Initialize log directory on module load
ensureLogDir().catch(() => {
  // Silently fail initialization
});

