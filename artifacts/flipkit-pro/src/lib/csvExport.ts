/** Build a CSV string from rows. Pure and unit-tested; see exportToCSV for the download wrapper. */
export function buildCSV(rows: Record<string, unknown>[]): string {
  if (!rows || !rows.length) return "";

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const cell = row[header] === null || row[header] === undefined ? "" : row[header];
          const cellString = String(cell);
          return cellString.includes(",") || cellString.includes('"') || cellString.includes("\n")
            ? `"${cellString.replace(/"/g, '""')}"`
            : cellString;
        })
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) return;

  const csvContent = buildCSV(rows);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
