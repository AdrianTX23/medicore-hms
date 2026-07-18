const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" });

// For DATE columns (birth dates, expiry dates): they live at UTC midnight,
// so formatting them in the local timezone would shift them a day back.
const dateOnlyFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatCurrency(value: number | string): string {
  return currencyFormatter.format(typeof value === "string" ? Number(value) : value);
}

export function formatDate(date: Date | string): string {
  return dateFormatter.format(new Date(date));
}

/** For date-only values (no time component), e.g. birth dates. */
export function formatDateOnly(date: Date | string): string {
  return dateOnlyFormatter.format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFormatter.format(new Date(date));
}

export function formatAge(birthDate: Date | string): string {
  // DATE columns live at UTC midnight — read them with UTC getters.
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getUTCDate())) {
    years--;
  }
  return `${years} años`;
}
