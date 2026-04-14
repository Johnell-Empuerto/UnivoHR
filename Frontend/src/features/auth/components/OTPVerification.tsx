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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Clock, Shield } from "lucide-react";
import { verifyOTP, resendOTP } from "@/services/authService";

interface OTPVerificationProps {
  userId: number;
  maskedEmail?: string;
  onVerify: (token: string, user: any) => void;
  onBack: () => void;
}

const OTPVerification = ({
  userId,
  maskedEmail,
  onVerify,
  onBack,
}: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setIsLoading(true);
      const response = await verifyOTP({ user_id: userId, otp });
      toast.success("Verification successful!");
      onVerify(response.token, response.user);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      await resendOTP({ user_id: userId });
      setTimeLeft(300);
      setCanResend(false);
      toast.success("New OTP sent to your email");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-[calc(100vh-200px)] md:min-h-0">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Verify Your Identity
          </CardTitle>
          <CardDescription>
            We've sent a verification code to{" "}
            <strong>{maskedEmail || "your email"}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Check your inbox for the 6-digit code</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest h-14"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span
              className={
                timeLeft < 60
                  ? "text-red-500 font-semibold"
                  : "text-muted-foreground"
              }
            >
              Code expires in: {formatTime(timeLeft)}
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            onClick={handleVerify}
            className="w-full h-11 font-medium"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Login"
            )}
          </Button>

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={!canResend || isResending}
              className="flex-1"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : canResend ? (
                "Resend Code"
              ) : (
                `Resend in ${formatTime(timeLeft)}`
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OTPVerification;
