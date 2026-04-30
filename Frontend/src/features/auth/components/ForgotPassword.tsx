import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, Shield, User } from "lucide-react";
import { forgotPassword } from "@/services/authService";

interface ForgotPasswordProps {
  onBack: () => void;
  onEmailSent: (userId: number, maskedEmail: string) => void;
}

const ForgotPassword = ({ onBack, onEmailSent }: ForgotPasswordProps) => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error("Please enter your username");
      return;
    }

    try {
      setIsLoading(true);
      const response = await forgotPassword({ username });

      if (response.success) {
        setIsSubmitted(true);
        if (response.user_id) {
          setUserId(response.user_id);
        }
        if (response.masked_email) {
          setMaskedEmail(response.masked_email);
        }
        toast.success("Verification code sent to your email");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to send verification code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (userId) {
      onEmailSent(userId, maskedEmail);
    } else {
      toast.error("Unable to proceed. Please try again.");
      onBack();
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center w-full min-h-[calc(100vh-200px)] md:min-h-0">
        <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              Check Your Email
            </CardTitle>
            <CardDescription>
              We've sent a verification code to your email address
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                A 6-digit verification code has been sent to:
              </p>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {maskedEmail || "your registered email"}
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> The verification code will expire in{" "}
                <strong>3 minutes</strong>. Please check your inbox and spam
                folder.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              onClick={handleContinue}
              className="w-full h-11 font-medium"
            >
              Continue to Verification
            </Button>

            <Button
              variant="outline"
              onClick={onBack}
              className="w-full"
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full min-h-[calc(100vh-200px)] md:min-h-0">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Forgot Password?
          </CardTitle>
          <CardDescription>
            No worries! Enter your username and we'll send a verification code
            to your registered email to reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                Make sure to enter the username associated with your account.
                The verification code will be sent to your registered email
                address.
              </p>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleSubmit}
            className="w-full h-11 font-medium"
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Code...
              </>
            ) : (
              "Send Verification Code"
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
