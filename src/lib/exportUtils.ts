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
  { key: "asset_tag" as const, header: "Asset Tag" },
  { key: "name" as const, header: "Device Name" },
  { key: "brand" as const, header: "Brand" },
  { key: "model" as const, header: "Model" },
  { key: "category" as const, header: "Category" },
  { key: "status" as const, header: "Status" },
  { key: "purchase_price" as const, header: "Purchase Price" },
  { key: "purchase_date" as const, header: "Purchase Date" },
  { key: "created_at" as const, header: "Added Date" },
];

export const requestExportColumns = [
  { key: "id" as const, header: "Request ID" },
  { key: "deviceName" as const, header: "Device" },
  { key: "userName" as const, header: "Requested By" },
  { key: "start_date" as const, header: "Start Date" },
  { key: "end_date" as const, header: "End Date" },
  { key: "status" as const, header: "Status" },
  { key: "reason" as const, header: "Reason" },
  { key: "created_at" as const, header: "Created At" },
];

// User export columns
export const userExportColumns = [
  { key: "id" as const, header: "ID" },
  { key: "name" as const, header: "Name" },
  { key: "email" as const, header: "Email" },
  { key: "department_name" as const, header: "Department" },
  { key: "role" as const, header: "Role" },
  { key: "is_active" as const, header: "Status" },
  { key: "created_at" as const, header: "Created At" },
];

// User import template columns
export const userImportTemplateColumns = [
  { key: "name", header: "name", example: "John Doe" },
  { key: "email", header: "email", example: "john.doe@company.com" },
  { key: "department", header: "department", example: "Engineering" },
  { key: "role", header: "role", example: "user" },
];

/**
 * Generate a CSV import template
 */
export function generateImportTemplate(
  columns: { key: string; header: string; example?: string }[],
  filename: string,
): void {
  const headers = columns.map((col) => col.header).join(",");
  const exampleRow = columns.map((col) => `"${col.example || ""}"`).join(",");

  const csvContent = [headers, exampleRow].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
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
