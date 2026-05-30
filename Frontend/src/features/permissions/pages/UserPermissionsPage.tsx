import { useState, useEffect } from "react";
import { Shield, Loader2, Save, RotateCcw, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getUsers, type User } from "@/services/userService";
import {
  getAllPermissions,
  getUserPermissions,
  setUserPermissions,
  resetUserPermissions,
  type PermissionGroup,
} from "@/services/permissionService";

const UserPermissionsPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup>({});
  const [allPermissionKeys, setAllPermissionKeys] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [usersRes, permsRes] = await Promise.all([
          getUsers(1, 100),
          getAllPermissions(),
        ]);
        setUsers(usersRes.data);
        setPermissionGroups(permsRes.groups);
        setAllPermissionKeys(permsRes.allPermissions);
      } catch (err: any) {
        toast.error(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setUserPermissions([]);
      return;
    }
    const fetchPermissions = async () => {
      try {
        const res = await getUserPermissions(Number(selectedUserId));
        setUserPermissions(res.permissions);
      } catch {
        setUserPermissions([]);
      }
    };
    fetchPermissions();
  }, [selectedUserId]);

  const handleTogglePermission = (key: string) => {
    setUserPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const handleToggleGroup = (keys: string[], checked: boolean) => {
    if (checked) {
      setUserPermissions((prev) => {
        const set = new Set(prev);
        keys.forEach((k) => set.add(k));
        return Array.from(set);
      });
    } else {
      setUserPermissions((prev) => prev.filter((p) => !keys.includes(p)));
    }
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    try {
      setSaving(true);
      await setUserPermissions(Number(selectedUserId), userPermissions);
      toast.success("Permissions saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedUserId) return;
    try {
      setResetting(true);
      await resetUserPermissions(Number(selectedUserId));
      setUserPermissions([]);
      toast.success("Permissions reset to default");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset permissions");
    } finally {
      setResetting(false);
    }
  };

  const selectedUser = users.find((u) => String(u.id) === selectedUserId);
  const isAdminUser = selectedUser?.role === "ADMIN";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary dark:text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            User Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Grant or revoke permissions for each user. Admin users automatically
            have all permissions.
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Select User</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a user to manage permissions" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.first_name} {u.last_name} ({u.username}) - {u.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedUserId && (
        <>
          {isAdminUser && (
            <Card className="shadow-sm border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  This user has the <strong>ADMIN</strong> role and
                  automatically has all permissions. Permission checkboxes are
                  shown for reference.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Permissions</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={resetting || isAdminUser}
                >
                  {resetting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Reset to Default
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || isAdminUser}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Permissions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(permissionGroups).map(([group, keys]) => {
                  const allChecked = keys.every((k) =>
                    userPermissions.includes(k),
                  );
                  const someChecked = keys.some((k) =>
                    userPermissions.includes(k),
                  );
                  const selectedCount = keys.filter((k) =>
                    userPermissions.includes(k),
                  ).length;

                  return (
                    <div
                      key={group}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{group}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {selectedCount}/{keys.length}
                          </span>
                          <button
                            onClick={() =>
                              handleToggleGroup(keys, !allChecked)
                            }
                            className="text-xs text-primary hover:underline"
                            disabled={isAdminUser}
                          >
                            {allChecked ? "Uncheck All" : "Check All"}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {keys.map((key) => {
                          const checked = userPermissions.includes(key);
                          const label = key
                            .split(".")
                            .slice(1)
                            .join(" ")
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase());
                          return (
                            <label
                              key={key}
                              className={`flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer ${
                                isAdminUser ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked || isAdminUser}
                                onChange={() => handleTogglePermission(key)}
                                disabled={isAdminUser}
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs">{label}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                                {key}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default UserPermissionsPage;
