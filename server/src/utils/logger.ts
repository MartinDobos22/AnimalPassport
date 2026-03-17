export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function formatMetadata(metadata?: Record<string, unknown>): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '';
  }

  return ` ${JSON.stringify(metadata)}`;
}

function log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [BE] [${level}] ${message}${formatMetadata(metadata)}`;

  if (level === 'ERROR') {
    console.error(entry);
    return;
  }

  if (level === 'WARN') {
    console.warn(entry);
    return;
  }

  console.log(entry);
}

export const logger = {
  info: (message: string, metadata?: Record<string, unknown>) => log('INFO', message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) => log('WARN', message, metadata),
  error: (message: string, metadata?: Record<string, unknown>) => log('ERROR', message, metadata),
};
