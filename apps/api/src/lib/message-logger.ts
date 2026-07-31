type LogFields = Record<string, unknown>;

function write(level: 'info' | 'warn' | 'error', fields: LogFields, msg: string): void {
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    service: 'matusms-messages',
    msg,
    ...fields,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

/** Structured logs for message lifecycle — visible in `pm2 logs matusms-api`. */
export const msgLog = {
  info(fields: LogFields, message: string) {
    write('info', fields, message);
  },
  warn(fields: LogFields, message: string) {
    write('warn', fields, message);
  },
  error(fields: LogFields, message: string) {
    write('error', fields, message);
  },
};
