// CSV Export Utility

export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  columns: { key: keyof T; header: string }[],
): void {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Create header row
  const headers = columns.map((col) => `"${col.header}"`).join(",");

  // Create data rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const value = item[col.key];
        // Handle different value types
        if (value === null || value === undefined) {
          return '""';
        }
        if (typeof value === "string") {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value)}"`;
      })
      .join(",");
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows].join("\n");

  // Create blob and download
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// Predefined export configurations
export const deviceExportColumns = [
  { key: "assetTag" as const, header: "Asset Tag" },
  { key: "name" as const, header: "Device Name" },
  { key: "brand" as const, header: "Brand" },
  { key: "model" as const, header: "Model" },
  { key: "category" as const, header: "Category" },
  { key: "status" as const, header: "Status" },
  { key: "addedDate" as const, header: "Added Date" },
];

export const requestExportColumns = [
  { key: "id" as const, header: "Request ID" },
  { key: "deviceName" as const, header: "Device" },
  { key: "userName" as const, header: "Requested By" },
  { key: "startDate" as const, header: "Start Date" },
  { key: "endDate" as const, header: "End Date" },
  { key: "status" as const, header: "Status" },
  { key: "reason" as const, header: "Reason" },
  { key: "createdAt" as const, header: "Created At" },
];
