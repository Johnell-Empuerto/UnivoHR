import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { getProfile, type Profile } from "@/services/profileService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <User className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
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
                ? new Date(profile.birthday).toLocaleDateString()
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
                ? new Date(profile.hired_date).toLocaleDateString()
                : null
            }
          />
          {profile.resignation_date && (
            <InfoField
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Resignation Date"
              value={new Date(profile.resignation_date).toLocaleDateString()}
            />
          )}
          {profile.termination_date && (
            <InfoField
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Termination Date"
              value={new Date(profile.termination_date).toLocaleDateString()}
            />
          )}
          {profile.last_working_date && (
            <InfoField
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Last Working Date"
              value={new Date(profile.last_working_date).toLocaleDateString()}
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
                ? new Date(profile.created_at).toLocaleDateString()
                : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
