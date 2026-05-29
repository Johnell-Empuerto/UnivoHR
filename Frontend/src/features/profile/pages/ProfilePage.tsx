import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateShort } from "@/utils/formatDate";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  IdCard,
  Heart,
  Users,
  FileText,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { getProfile, type Profile } from "@/services/profileService";
import { changePassword } from "@/services/authService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/shared/Loader";
import EmptyState from "@/components/shared/EmptyState";

const SPECIAL_CHARS = "!@#$%^&*(),.?\":{}|<>_-~`[]\\;/'" as const;
const hasSpecialChar = (s: string) => [...s].some((ch) => SPECIAL_CHARS.includes(ch));

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
    } catch (error: any) {
      toast.error("Failed to load profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "RESIGNED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "TERMINATED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  const InfoField = ({
    icon,
    label,
    value,
    placeholder = "-",
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | null | undefined;
    placeholder?: string;
  }) => {
    return (
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          {icon}
          {label}
        </div>
        <p className="text-sm font-medium">
          {value || (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </p>
      </div>
    );
  };

  if (loading) {
    return <Loader fullPage />;
  }

  if (!profile) {
    return (
      <EmptyState
        icon={<User className="h-6 w-6" />}
        message="Profile not found"
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-muted-foreground">
            {profile.full_name || "User"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{profile.role}</Badge>
            <Badge className={getStatusBadgeClass(profile.status)}>
              {profile.status}
            </Badge>
            {profile.age && (
              <Badge variant="secondary">{profile.age} years old</Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField
            icon={<IdCard className="h-3.5 w-3.5" />}
            label="Employee Code"
            value={profile.employee_code}
          />
          <InfoField
            icon={<User className="h-3.5 w-3.5" />}
            label="First Name"
            value={profile.first_name}
          />
          <InfoField
            icon={<User className="h-3.5 w-3.5" />}
            label="Middle Name"
            value={profile.middle_name}
          />
          <InfoField
            icon={<User className="h-3.5 w-3.5" />}
            label="Last Name"
            value={profile.last_name}
          />
          {profile.suffix && (
            <InfoField
              icon={<User className="h-3.5 w-3.5" />}
              label="Suffix"
              value={profile.suffix}
            />
          )}
          <InfoField
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Birthday"
            value={
              profile.birthday
                ? formatDateShort(profile.birthday)
                : null
            }
          />
          <InfoField
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Age"
            value={profile.age ? `${profile.age} years old` : null}
          />
          <InfoField
            icon={<User className="h-3.5 w-3.5" />}
            label="Gender"
            value={profile.gender}
          />
          <InfoField
            icon={<Mail className="h-3.5 w-3.5" />}
            label="Email"
            value={profile.email}
          />
          <InfoField
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Contact Number"
            value={profile.contact_number}
            placeholder="Not provided"
          />
          <InfoField
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Address"
            value={profile.address}
            placeholder="Not provided"
          />
          <InfoField
            icon={<Users className="h-3.5 w-3.5" />}
            label="Marital Status"
            value={profile.marital_status}
          />
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5" />
            Employment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="Department"
            value={profile.department}
          />
          <InfoField
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="Position"
            value={profile.position}
          />
          <InfoField
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Hired Date"
            value={
              profile.hired_date
                ? formatDateShort(profile.hired_date)
                : null
            }
          />
          {profile.resignation_date && (
            <InfoField
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Resignation Date"
              value={formatDateShort(profile.resignation_date)}
            />
          )}
          {profile.termination_date && (
            <InfoField
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Termination Date"
              value={formatDateShort(profile.termination_date)}
            />
          )}
          {profile.last_working_date && (
            <InfoField
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Last Working Date"
              value={formatDateShort(profile.last_working_date)}
            />
          )}
        </CardContent>
      </Card>

      {/* Government IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IdCard className="h-5 w-5" />
            Government IDs
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField
            icon={<IdCard className="h-3.5 w-3.5" />}
            label="SSS Number"
            value={profile.sss_number}
          />
          <InfoField
            icon={<IdCard className="h-3.5 w-3.5" />}
            label="PhilHealth Number"
            value={profile.philhealth_number}
          />
          <InfoField
            icon={<IdCard className="h-3.5 w-3.5" />}
            label="HDMF (Pag-IBIG) Number"
            value={profile.hdmf_number}
          />
          <InfoField
            icon={<IdCard className="h-3.5 w-3.5" />}
            label="TIN Number"
            value={profile.tin_number}
          />
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField
            icon={<User className="h-3.5 w-3.5" />}
            label="Emergency Contact Name"
            value={profile.emergency_contact_name}
            placeholder="Not provided"
          />
          <InfoField
            icon={<Users className="h-3.5 w-3.5" />}
            label="Relation"
            value={profile.emergency_contact_relation}
            placeholder="Not provided"
          />
          <InfoField
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Emergency Contact Number"
            value={profile.emergency_contact_number}
            placeholder="Not provided"
          />
          <InfoField
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Emergency Contact Address"
            value={profile.emergency_contact_address}
            placeholder="Not provided"
          />
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField
            icon={<User className="h-3.5 w-3.5" />}
            label="Username"
            value={profile.username}
          />
          <InfoField
            icon={<IdCard className="h-3.5 w-3.5" />}
            label="RFID Tag"
            value={profile.rfid_tag}
          />
          <InfoField
            icon={<IdCard className="h-3.5 w-3.5" />}
            label="Fingerprint ID"
            value={profile.fingerprint_id}
          />
          <InfoField
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Account Created"
            value={
              profile.created_at
                ? formatDateShort(profile.created_at)
                : null
            }
          />
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
              <li className={newPassword.length >= 8 ? "text-green-600" : ""}>At least 8 characters</li>
              <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>At least 1 uppercase letter</li>
              <li className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>At least 1 lowercase letter</li>
              <li className={/\d/.test(newPassword) ? "text-green-600" : ""}>At least 1 number</li>
              <li className={hasSpecialChar(newPassword) ? "text-green-600" : ""}>At least 1 special character</li>
              <li className={!/\s/.test(newPassword) && newPassword.length > 0 ? "text-green-600" : ""}>No spaces</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <Button
            onClick={async () => {
              if (!currentPassword || !newPassword || !confirmPassword) {
                toast.error("All fields are required");
                return;
              }
              if (newPassword !== confirmPassword) {
                toast.error("Passwords do not match");
                return;
              }
              setChanging(true);
              try {
                const result = await changePassword({ currentPassword, newPassword, confirmPassword });
                toast.success(result.message);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              } catch (err: unknown) {
                const e = err as { response?: { data?: { message?: string } }; message?: string };
                toast.error(e.response?.data?.message || e.message || "Failed to change password");
              } finally {
                setChanging(false);
              }
            }}
            disabled={changing}
            className="w-full sm:w-auto"
          >
            {changing ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
