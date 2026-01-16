import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Eye,
  UserPlus,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface PreviewRow {
  rowNumber: number;
  name: string;
  email: string;
  department: string;
  role: string;
  status: "create" | "update" | "error";
  error?: string;
  existingUser?: { id: number; name: string; department: string; role: string };
}

interface PreviewResult {
  success: boolean;
  totalRows: number;
  toCreate: number;
  toUpdate: number;
  errors: number;
  rows: PreviewRow[];
  availableDepartments: string[];
}

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  createdUsers: { id: number; email: string }[];
  updatedUsers: { id: number; email: string }[];
}

interface UserImportExportProps {
  onImportComplete?: () => void;
}

export const UserImportExport: React.FC<UserImportExportProps> = ({
  onImportComplete,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [upsertMode, setUpsertMode] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth-token");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // Download CSV template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/import/template`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "user_import_template.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t("toast.templateDownloaded"),
        description: t("toast.templateDownloadedDesc"),
      });
    } catch (error) {
      toast({
        title: t("toast.downloadFailed"),
        description: t("toast.downloadFailedDesc"),
        variant: "destructive",
      });
    }
  };

  // Handle file selection - trigger preview
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast({
          title: t("toast.invalidFile"),
          description: t("toast.invalidFileDesc"),
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
      setPreviewResult(null);
      setImportModalOpen(true);
      
      // Auto-trigger preview
      await handlePreview(file);
    }
  };

  // Preview import (dry-run)
  const handlePreview = async (file: File) => {
    setPreviewing(true);
    setPreviewResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/users/import/preview`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPreviewResult(data.data);
      } else {
        toast({
          title: "Preview Failed",
          description: data.error || "Failed to preview import",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Preview Error",
        description: "An error occurred while previewing the file",
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
    }
  };

  // Import users from CSV
  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mode", upsertMode ? "upsert" : "create");

      const response = await fetch(`${API_BASE}/api/users/import`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setImportResult(data.data);
        setPreviewResult(null); // Clear preview after successful import
        toast({
          title: t("toast.importComplete"),
          description: data.message,
        });
        onImportComplete?.();
      } else {
        toast({
          title: t("toast.importFailed"),
          description: data.error || "Failed to import users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("toast.importError"),
        description: t("toast.importErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  // Export users
  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/export`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to export users");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t("toast.exportComplete"),
        description: t("toast.exportCompleteDesc"),
      });
    } catch (error) {
      toast({
        title: t("toast.exportFailed"),
        description: t("toast.exportFailedDesc"),
        variant: "destructive",
      });
    }
  };

  // Export newly imported users
  const handleExportImported = async () => {
    if (!importResult?.createdUsers.length) return;

    const ids = importResult.createdUsers.map((u) => u.id).join(",");

    try {
      const response = await fetch(`${API_BASE}/api/users/export?ids=${ids}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to export users");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `imported_users_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t("toast.exportComplete"),
        description: t("toast.importedUsersExportedDesc"),
      });
    } catch (error) {
      toast({
        title: t("toast.exportFailed"),
        description: t("toast.exportFailedDesc"),
        variant: "destructive",
      });
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setSelectedFile(null);
    setPreviewResult(null);
    setImportResult(null);
    setUpsertMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusBadge = (status: PreviewRow["status"]) => {
    switch (status) {
      case "create":
        return <Badge variant="default" className="gap-1"><UserPlus className="h-3 w-3" />New</Badge>;
      case "update":
        return <Badge variant="secondary" className="gap-1"><RefreshCw className="h-3 w-3" />Update</Badge>;
      case "error":
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Error</Badge>;
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Import/Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Import/Export
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import from CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadTemplate}>
            <FileDown className="mr-2 h-4 w-4" />
            Download Template
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Modal with Preview */}
      <Dialog open={importModalOpen} onOpenChange={closeImportModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewResult ? (
                <>
                  <Eye className="h-5 w-5" />
                  Import Preview
                </>
              ) : importResult ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Import Complete
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Import Users
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedFile ? `File: ${selectedFile.name}` : "Select a CSV file to import users"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden space-y-4">
            {/* Loading state */}
            {previewing && (
              <div className="space-y-2 py-8">
                <Progress value={undefined} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Analyzing file...
                </p>
              </div>
            )}

            {/* Preview Results */}
            {previewResult && !importResult && (
              <>
                {/* Summary */}
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <Badge variant="outline">{previewResult.totalRows}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <UserPlus className="h-4 w-4" />
                    <span className="text-sm font-medium">{previewResult.toCreate} new</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm font-medium">{previewResult.toUpdate} updates</span>
                  </div>
                  {previewResult.errors > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{previewResult.errors} errors</span>
                    </div>
                  )}
                </div>

                {/* Upsert toggle */}
                {previewResult.toUpdate > 0 && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="upsert-mode" className="text-sm font-medium">
                        Update existing users
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {upsertMode 
                          ? `Will update ${previewResult.toUpdate} existing users` 
                          : `${previewResult.toUpdate} existing users will be skipped`}
                      </p>
                    </div>
                    <Switch
                      id="upsert-mode"
                      checked={upsertMode}
                      onCheckedChange={setUpsertMode}
                    />
                  </div>
                )}

                {/* Preview table */}
                <ScrollArea className="h-[300px] border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-medium">Row</th>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Username</th>
                        <th className="text-left p-2 font-medium">Department</th>
                        <th className="text-left p-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewResult.rows.map((row) => (
                        <tr 
                          key={row.rowNumber} 
                          className={`border-t ${row.status === "error" ? "bg-destructive/5" : ""}`}
                        >
                          <td className="p-2 text-muted-foreground">{row.rowNumber}</td>
                          <td className="p-2">{row.name}</td>
                          <td className="p-2 font-mono text-xs">{row.email}</td>
                          <td className="p-2">{row.department}</td>
                          <td className="p-2">
                            <div className="space-y-1">
                              {getStatusBadge(row.status)}
                              {row.error && (
                                <p className="text-xs text-destructive">{row.error}</p>
                              )}
                              {row.existingUser && (
                                <p className="text-xs text-muted-foreground">
                                  Current: {row.existingUser.name} ({row.existingUser.department})
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>

                {/* Available departments hint */}
                {previewResult.errors > 0 && previewResult.availableDepartments.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Available departments: {previewResult.availableDepartments.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Import Results */}
            {importResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {importResult.created > 0 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">{importResult.created} created</span>
                    </div>
                  )}
                  {importResult.updated > 0 && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <RefreshCw className="h-5 w-5" />
                      <span className="font-medium">{importResult.updated} updated</span>
                    </div>
                  )}
                  {importResult.failed > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">{importResult.failed} failed</span>
                    </div>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <ScrollArea className="max-h-40 rounded-md border p-3 bg-muted/50">
                    <p className="text-sm font-medium mb-2">Errors:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {importResult.errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}

                {importResult.created > 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Export the imported users to get their temporary passwords.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Importing state */}
            {importing && (
              <div className="space-y-2 py-4">
                <Progress value={undefined} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Importing users...
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {previewResult && !importResult ? (
              <>
                <Button variant="outline" onClick={closeImportModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || (previewResult.toCreate === 0 && (!upsertMode || previewResult.toUpdate === 0))}
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import {upsertMode 
                        ? `${previewResult.toCreate + previewResult.toUpdate} users` 
                        : `${previewResult.toCreate} users`}
                    </>
                  )}
                </Button>
              </>
            ) : importResult ? (
              <>
                <Button variant="outline" onClick={closeImportModal}>
                  Close
                </Button>
                {importResult.created > 0 && (
                  <Button onClick={handleExportImported}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Imported Users
                  </Button>
                )}
              </>
            ) : (
              <Button variant="outline" onClick={closeImportModal}>
                Cancel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
