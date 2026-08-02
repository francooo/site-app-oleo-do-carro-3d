const OLD_FORMAT = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL_FORMAT = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export function normalizePlate(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isValidPlateFormat(raw: string): boolean {
  const plate = normalizePlate(raw);
  return OLD_FORMAT.test(plate) || MERCOSUL_FORMAT.test(plate);
}
