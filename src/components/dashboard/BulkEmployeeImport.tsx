import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useI18n } from "@/lib/i18n";

const VALID_CATEGORIES = ["responsable", "technique", "éditorial", "caisse", "stock"];
const VALID_CATEGORIES_DISPLAY = ["Responsable", "Technique", "Éditorial", "Caisse", "Stock"];

interface ImportRow {
  nom: string;
  prenom: string;
  email: string;
  heures_contrat: number;
  categorie: string;
  magasin: string;
  magasin_id?: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: number;
  details: { email: string; reason: string }[];
}

export function BulkEmployeeImport() {
  const { t } = useI18n();
  const { stores } = useStore();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const regularStores = stores.filter((s) => !s.is_direction);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nom", "Prénom", "Email", "Heures_contrat", "Catégorie", "Magasin"],
      ["Dupont", "Marie", "marie.dupont@email.com", 36, "Responsable", "Fnac Bellecour"],
    ]);
    ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];

    // Reference sheet listing allowed categories
    const wsRef = XLSX.utils.aoa_to_sheet([
      ["Catégories autorisées"],
      ...VALID_CATEGORIES_DISPLAY.map((c) => [c]),
    ]);
    wsRef["!cols"] = [{ wch: 25 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employés");
    XLSX.utils.book_append_sheet(wb, wsRef, "Catégories");
    XLSX.writeFile(wb, "modele_import_employes.xlsx");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws);

      const parsed: ImportRow[] = json.map((r) => {
        const nom = (r["Nom"] || r["nom"] || "").toString().trim();
        const prenom = (r["Prénom"] || r["Prenom"] || r["prenom"] || "").toString().trim();
        const email = (r["Email"] || r["email"] || "").toString().trim().toLowerCase();
        const heures = Number(r["Heures_contrat"] || r["heures_contrat"] || 36);
        const categorie = (r["Catégorie"] || r["Categorie"] || r["categorie"] || "vendeur").toString().trim().toLowerCase();
        const magasin = (r["Magasin"] || r["magasin"] || "").toString().trim();

        const matchedStore = regularStores.find(
          (s) => s.name.toLowerCase() === magasin.toLowerCase() || s.city.toLowerCase() === magasin.toLowerCase()
        );

        const errors: string[] = [];
        if (!nom) errors.push(t("bulk.errMissingName"));
        if (!email || !email.includes("@")) errors.push(t("bulk.errInvalidEmail"));
        if (isNaN(heures) || heures <= 0) errors.push(t("bulk.errInvalidHours"));
        if (!VALID_CATEGORIES.includes(categorie)) errors.push(`${t("bulk.errInvalidCategory")} "${categorie}" (${t("bulk.expected")}: ${VALID_CATEGORIES_DISPLAY.join(", ")})`);

        return {
          nom, prenom, email, heures_contrat: heures, categorie, magasin,
          magasin_id: matchedStore?.id,
          valid: errors.length === 0,
          error: errors.join(", "),
        };
      });

      setRows(parsed);
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const updateStoreForRow = (idx: number, storeId: string) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r;
      const store = stores.find((s) => s.id === storeId);
      return { ...r, magasin_id: storeId, magasin: store?.name || r.magasin };
    }));
  };

  const doImport = async () => {
    setImporting(true);
    try {
      const validRows = rows.filter((r) => r.valid);
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "bulk_import",
          employees: validRows.map((r) => ({
            nom: r.nom,
            prenom: r.prenom,
            email: r.email,
            heures_contrat: r.heures_contrat,
            categorie: r.categorie,
            magasin_id: r.magasin_id || null,
          })),
        },
      });
      if (error) throw error;
      setResult(data as ImportResult);
      toast.success(`${t("bulk.importDone")} : ${(data as ImportResult).imported} ${t("bulk.employees")} ${t("bulk.imported")}`);
    } catch (err: any) {
      toast.error(t("bulk.importError") + " : " + (err.message || t("bulk.unknownError")));
    } finally {
      setImporting(false);
    }
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {t("bulk.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" />
            {t("bulk.downloadTemplate")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" />
            {t("bulk.uploadFile")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv,.xls"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {rows.length > 0 && !result && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{rows.length} {t("bulk.lines")}</Badge>
              <Badge className="bg-emerald-100 text-emerald-800">{validCount} {t("bulk.valid")}</Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive">{invalidCount} {t("bulk.invalid")}</Badge>
              )}
            </div>

            <div className="max-h-[400px] overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>{t("bulk.colNom")}</TableHead>
                    <TableHead>{t("bulk.colPrenom")}</TableHead>
                    <TableHead>{t("bulk.colEmail")}</TableHead>
                    <TableHead>{t("bulk.colHeures")}</TableHead>
                    <TableHead>{t("bulk.colCat")}</TableHead>
                    <TableHead>{t("bulk.colMagasin")}</TableHead>
                    <TableHead className="w-10">{t("bulk.colState")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} className={r.valid ? "" : "bg-destructive/10"}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>{r.nom}</TableCell>
                      <TableCell>{r.prenom}</TableCell>
                      <TableCell className="text-xs">{r.email}</TableCell>
                      <TableCell>{r.heures_contrat}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.categorie}</Badge></TableCell>
                      <TableCell>
                        {r.magasin_id ? (
                          <span className="text-xs">{r.magasin}</span>
                        ) : (
                          <Select onValueChange={(v) => updateStoreForRow(i, v)}>
                            <SelectTrigger className="h-7 text-xs w-[140px]">
                              <SelectValue placeholder={r.magasin || t("bulk.choose")} />
                            </SelectTrigger>
                            <SelectContent>
                              {regularStores.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <span title={r.error}><XCircle className="h-4 w-4 text-destructive" /></span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={doImport} disabled={importing || validCount === 0}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                {t("bulk.confirmImport")} ({validCount} {t("bulk.employees")})
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRows([])}>{t("action.cancel")}</Button>
            </div>
          </>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-emerald-100 text-emerald-800 gap-1">
                <CheckCircle2 className="h-3 w-3" /> {result.imported} {t("bulk.imported")}
              </Badge>
              {result.duplicates > 0 && (
                <Badge className="bg-amber-100 text-amber-800 gap-1">
                  <AlertTriangle className="h-3 w-3" /> {result.duplicates} {t("bulk.duplicates")}
                </Badge>
              )}
              {result.errors > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> {result.errors} {t("bulk.errors")}
                </Badge>
              )}
            </div>
            {result.details.length > 0 && (
              <div className="text-xs space-y-1 max-h-[200px] overflow-auto">
                {result.details.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    <span className="font-mono">{d.email}</span> — {d.reason}
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => { setResult(null); setRows([]); }}>
              {t("bulk.newImport")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
