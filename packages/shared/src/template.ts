/**
 * Reemplaza variables en plantillas SMS: {{nombre}}, {{codigo}}, etc.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>,
): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value == null ? '' : String(value);
  });
}

export const TEMPLATE_EXAMPLES = {
  verification: 'Tu código de verificación MatuSMS es {{codigo}}. Válido 10 minutos.',
  invoice: 'Hola {{nombre}}, tu factura #{{numero}} por {{monto}} está lista. Gracias.',
} as const;
