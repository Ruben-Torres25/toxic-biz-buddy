export const money = (v: number | string | null | undefined, locale = "es-AR", currency = "ARS") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v ?? 0));

export const number = (v: number | string | null | undefined, locale = "es-AR") =>
  new Intl.NumberFormat(locale).format(Number(v ?? 0));
