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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
  Shield,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface ImportResult {
  created: number;
  failed: number;
  errors: string[];
  createdUsers: { id: number; email: string }[];
}

interface UserImportExportProps {
  onImportComplete?: () => void;
}

export const UserImportExport: React.FC<UserImportExportProps> = ({
  onImportComplete,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isSuperuser = user?.role === "superuser";

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

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setImportModalOpen(true);
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

      const response = await fetch(`${API_BASE}/api/users/import`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setImportResult(data.data);
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

  // Export users with temporary passwords
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

  // Export users with passwords (superuser only)
  const handleAdminExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/export/admin`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to export users");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_admin_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t("toast.adminExportComplete"),
        description: t("toast.adminExportCompleteDesc"),
      });
    } catch (error) {
      toast({
        title: t("toast.exportFailed"),
        description:
          error instanceof Error ? error.message : t("toast.exportFailedDesc"),
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
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
          {isSuperuser && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAdminExport}>
                <Shield className="mr-2 h-4 w-4" />
                Export with Passwords
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Modal */}
      <Dialog open={importModalOpen} onOpenChange={closeImportModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Users from CSV</DialogTitle>
            <DialogDescription>
              {selectedFile
                ? `Selected file: ${selectedFile.name}`
                : "Select a CSV file to import users"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!importResult && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Users will be created with temporary passwords. They will be
                  required to change their password on first login.
                </AlertDescription>
              </Alert>
            )}

            {importing && (
              <div className="space-y-2">
                <Progress value={undefined} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Importing users...
                </p>
              </div>
            )}

            {importResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">
                      {importResult.created} created
                    </span>
                  </div>
                  {importResult.failed > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">
                        {importResult.failed} failed
                      </span>
                    </div>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-md border p-3 bg-muted/50">
                    <p className="text-sm font-medium mb-2">Errors:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {importResult.errors.map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.created > 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Export the imported users to get their temporary
                      passwords.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {!importResult ? (
              <>
                <Button variant="outline" onClick={closeImportModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || !selectedFile}
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </>
            ) : (
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
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
