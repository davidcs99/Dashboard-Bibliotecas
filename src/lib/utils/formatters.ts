export function formatInteger(value: number): string {
  return new Intl.NumberFormat("es-EC").format(value);
}

export function formatDecimal(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("es-EC", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}
