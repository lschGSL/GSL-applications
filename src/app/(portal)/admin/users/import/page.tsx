"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download, Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2,
  ArrowLeft, Send, Trash2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import * as XLSX from "xlsx";

type ParsedUser = {
  full_name: string;
  email: string;
  role: string;
  entity: string | null;
  valid: boolean;
  errors: string[];
  selected: boolean;
};

type ImportResult = {
  email: string;
  full_name: string;
  status: "success" | "error";
  error?: string;
};

const VALID_ROLES = ["admin", "manager", "member", "viewer", "client"];
const VALID_ENTITIES = ["gsl_fiduciaire", "gsl_revision", "both", ""];

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ImportUsersPage() {
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useI18n();

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

      const users: ParsedUser[] = json.map((row) => {
        const errors: string[] = [];
        const email = (row.email || "").trim();
        const full_name = (row.full_name || "").trim();
        const role = (row.role || "member").trim().toLowerCase();
        const entity = (row.entity || "").trim().toLowerCase() || null;

        if (!email) errors.push("Email required");
        else if (!validateEmail(email)) errors.push("Invalid email");
        if (!VALID_ROLES.includes(role)) errors.push(`Invalid role: ${role}`);
        if (entity && !VALID_ENTITIES.includes(entity)) errors.push(`Invalid entity: ${entity}`);

        return {
          full_name,
          email,
          role,
          entity,
          valid: errors.length === 0,
          errors,
          selected: errors.length === 0,
        };
      });

      setParsedUsers(users);
      setResults(null);
    };
    reader.readAsArrayBuffer(file);
  }

  function toggleAll(selected: boolean) {
    setParsedUsers((prev) =>
      prev.map((u) => ({ ...u, selected: u.valid ? selected : false }))
    );
  }

  function toggleUser(index: number) {
    setParsedUsers((prev) =>
      prev.map((u, i) => (i === index && u.valid ? { ...u, selected: !u.selected } : u))
    );
  }

  async function handleImport() {
    const toImport = parsedUsers.filter((u) => u.selected && u.valid);
    if (toImport.length === 0) return;

    setImporting(true);
    try {
      const res = await fetch("/api/admin/users/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: toImport.map((u) => ({
            full_name: u.full_name,
            email: u.email,
            role: u.role,
            entity: u.entity,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } finally {
      setImporting(false);
    }
  }

  const validCount = parsedUsers.filter((u) => u.valid).length;
  const selectedCount = parsedUsers.filter((u) => u.selected && u.valid).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("import.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("import.subtitle")}</p>
        </div>
      </div>

      {/* Step 1: Download template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            {t("import.templateTitle")}
          </CardTitle>
          <CardDescription>{t("import.templateDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
            <div><strong>role:</strong> admin, manager, member, viewer, client</div>
            <div><strong>entity:</strong> gsl_fiduciaire, gsl_revision, both, (vide)</div>
          </div>
          <Button variant="outline" asChild>
            <a href="/api/admin/users/import-template" download>
              <Download className="mr-2 h-4 w-4" />
              {t("import.downloadTemplate")}
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Upload file */}
      {!results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t("import.uploadTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) parseFile(f);
              }}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) parseFile(f);
                }}
              />
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">{t("import.dragDrop")}</p>
              <p className="text-xs text-muted-foreground mt-1">CSV, XLSX (max 5MB)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview + Import */}
      {parsedUsers.length > 0 && !results && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t("import.preview")}</CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {selectedCount} / {validCount} {t("import.validUsers")}
                </span>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleAll(true)}>
                  {t("import.selectAll")}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleAll(false)}>
                  {t("import.deselectAll")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 w-10"></th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("auth.fullName")}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("auth.email")}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("admin.users.role")}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("admin.users.entity")}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedUsers.map((u, i) => (
                    <tr key={i} className={`${!u.valid ? "bg-destructive/5" : u.selected ? "" : "opacity-50"}`}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={u.selected}
                          disabled={!u.valid}
                          onChange={() => toggleUser(i)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm">{u.full_name || "—"}</td>
                      <td className="px-4 py-2 text-sm font-mono">{u.email}</td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary" className="text-xs capitalize">{u.role}</Badge>
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">{u.entity || "—"}</td>
                      <td className="px-4 py-2">
                        {u.valid ? (
                          <Badge variant="success" className="text-xs">{t("import.valid")}</Badge>
                        ) : (
                          <div>
                            <Badge variant="destructive" className="text-xs">{t("import.invalid")}</Badge>
                            <p className="text-xs text-destructive mt-1">{u.errors.join(", ")}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t px-4 py-3">
              <Button variant="ghost" onClick={() => { setParsedUsers([]); setResults(null); }}>
                <Trash2 className="mr-2 h-4 w-4" /> {t("import.clear")}
              </Button>
              <Button disabled={selectedCount === 0 || importing} onClick={handleImport}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {t("import.sendInvitations")} ({selectedCount})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("import.results")}</CardTitle>
            <CardDescription>
              {results.filter((r) => r.status === "success").length} {t("import.success")},
              {" "}{results.filter((r) => r.status === "error").length} {t("import.errors")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <tbody className="divide-y">
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">
                      {r.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">{r.full_name}</td>
                    <td className="px-4 py-2 text-sm font-mono">{r.email}</td>
                    <td className="px-4 py-2 text-sm">
                      {r.status === "success" ? (
                        <Badge variant="success" className="text-xs">{t("import.invited")}</Badge>
                      ) : (
                        <span className="text-xs text-destructive">{r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t px-4 py-3">
              <Button variant="outline" asChild>
                <Link href="/admin/users">
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t("import.backToUsers")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
