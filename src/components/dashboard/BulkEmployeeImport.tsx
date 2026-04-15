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
    // Add dropdown data validation for Catégorie column (E2:E1000)
    ws["!dataValidation"] = ws["!dataValidation"] || [];
    (ws as any)["!dataValidation"] = [{
      type: "list",
      sqref: "E2:E1000",
      formula1: `"${VALID_CATEGORIES_DISPLAY.join(",")}"`,
    }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employés");
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
        if (!nom) errors.push("Nom manquant");
        if (!email || !email.includes("@")) errors.push("Email invalide");
        if (isNaN(heures) || heures <= 0) errors.push("Heures invalides");
        if (!VALID_CATEGORIES.includes(categorie)) errors.push(`Catégorie invalide "${categorie}" (attendu: ${VALID_CATEGORIES_DISPLAY.join(", ")})`);

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
      toast.success(`Import terminé : ${(data as ImportResult).imported} employé(s) importé(s)`);
    } catch (err: any) {
      toast.error("Erreur lors de l'import : " + (err.message || "Erreur inconnue"));
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
          Import en masse des employés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" />
            Télécharger le modèle Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" />
            Charger un fichier (.xlsx / .csv)
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
              <Badge variant="secondary">{rows.length} ligne(s)</Badge>
              <Badge className="bg-emerald-100 text-emerald-800">{validCount} valide(s)</Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive">{invalidCount} invalide(s)</Badge>
              )}
            </div>

            <div className="max-h-[400px] overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Heures</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Magasin</TableHead>
                    <TableHead className="w-10">État</TableHead>
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
                              <SelectValue placeholder={r.magasin || "Choisir..."} />
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
                Confirmer l'import ({validCount} employé(s))
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRows([])}>Annuler</Button>
            </div>
          </>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-emerald-100 text-emerald-800 gap-1">
                <CheckCircle2 className="h-3 w-3" /> {result.imported} importé(s)
              </Badge>
              {result.duplicates > 0 && (
                <Badge className="bg-amber-100 text-amber-800 gap-1">
                  <AlertTriangle className="h-3 w-3" /> {result.duplicates} doublon(s)
                </Badge>
              )}
              {result.errors > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> {result.errors} erreur(s)
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
              Nouvel import
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
