import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Trash2 } from "lucide-react";
import { z } from "zod";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
}

interface TeamManagerProps {
  tenantId: string;
}

const emailSchema = z.string().email("Érvénytelen email cím");

const TeamManager = ({ tenantId }: TeamManagerProps) => {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "staff">("staff");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [tenantId]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenant_users")
      .select("*")
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("Error fetching team members:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a csapattagokat",
        variant: "destructive",
      });
    } else {
      // Fetch email addresses for each user using the database function
      const membersWithEmails = await Promise.all(
        (data || []).map(async (member) => {
          const { data: email } = await supabase.rpc(
            "get_user_email_by_id",
            { _user_id: member.user_id }
          );
          return {
            ...member,
            email: email || "Ismeretlen",
          };
        })
      );
      setMembers(membersWithEmails);
    }
    setLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(newMemberEmail);
    } catch (error) {
      toast({
        title: "Érvénytelen email",
        description: "Kérlek adj meg egy érvényes email címet",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);

    // Get user ID by email using the database function
    const { data: userId, error: userError } = await supabase.rpc(
      "get_user_id_by_email",
      { _email: newMemberEmail }
    );

    if (userError || !userId) {
      toast({
        title: "Felhasználó nem található",
        description: "Ezzel az email címmel nem regisztrált még senki. Kérd meg, hogy regisztráljon először!",
        variant: "destructive",
      });
      setAdding(false);
      return;
    }

    // Check if user is already a member
    const existingMember = members.find((m) => m.user_id === userId);
    if (existingMember) {
      toast({
        title: "Már tag",
        description: "Ez a felhasználó már tagja a csapatnak",
        variant: "destructive",
      });
      setAdding(false);
      return;
    }

    // Add user to tenant
    const { error: insertError } = await supabase
      .from("tenant_users")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role: newMemberRole,
      });

    if (insertError) {
      toast({
        title: "Hiba",
        description: "Nem sikerült hozzáadni a felhasználót",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Siker!",
        description: "Felhasználó sikeresen hozzáadva",
      });
      setNewMemberEmail("");
      setNewMemberRole("staff");
      fetchMembers();
    }

    setAdding(false);
  };

  const handleRoleChange = async (memberId: string, newRole: "admin" | "staff" | "owner") => {
    const { error } = await supabase
      .from("tenant_users")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült módosítani a szerepkört",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Siker!",
        description: "Szerepkör sikeresen módosítva",
      });
      fetchMembers();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("tenant_users")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült eltávolítani a felhasználót",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Siker!",
        description: "Felhasználó sikeresen eltávolítva",
      });
      fetchMembers();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Csapattagok
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Csapattagok
        </CardTitle>
        <CardDescription>
          Add hozzá vagy távolítsd el a csapattagokat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new member form */}
        <form onSubmit={handleAddMember} className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-4 w-4" />
            <h3 className="font-semibold">Új tag hozzáadása</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email cím</Label>
            <Input
              id="email"
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="felhasznalo@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Szerepkör</Label>
            <Select value={newMemberRole} onValueChange={(value: "admin" | "staff") => setNewMemberRole(value)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Munkatárs</SelectItem>
                <SelectItem value="admin">Adminisztrátor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={adding} className="w-full">
            {adding ? "Hozzáadás..." : "Hozzáadás"}
          </Button>
        </form>

        {/* Members list */}
        <div className="space-y-2">
          <h3 className="font-semibold mb-3">Jelenlegi tagok ({members.length})</h3>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Még nincs csapattag
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{member.email}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {member.role === "owner" ? "Tulajdonos" : member.role === "admin" ? "Adminisztrátor" : "Munkatárs"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.role !== "owner" && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleRoleChange(member.id, value as "admin" | "staff" | "owner")}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Munkatárs</SelectItem>
                            <SelectItem value="admin">Adminisztrátor</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamManager;
