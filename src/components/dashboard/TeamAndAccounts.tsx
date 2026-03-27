import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCog } from "lucide-react";
import { EmployeeManager } from "./EmployeeManager";
import { UserManager } from "./UserManager";

export function TeamAndAccounts() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Users className="h-5 w-5" />
        Équipe & Comptes
      </h2>
      <Tabs defaultValue="employees" className="w-full">
        <TabsList>
          <TabsTrigger value="employees" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Collaborateurs
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1.5">
            <UserCog className="h-3.5 w-3.5" />
            Comptes d'accès
          </TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="mt-4">
          <EmployeeManager />
        </TabsContent>
        <TabsContent value="accounts" className="mt-4">
          <UserManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
