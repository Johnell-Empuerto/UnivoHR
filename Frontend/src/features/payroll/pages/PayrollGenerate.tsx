// features/payroll/pages/PayrollGenerate.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { generatePayroll } from "@/services/payrollService";
import { toast } from "sonner";

interface PayrollGenerateProps {
  onGenerateComplete?: () => void;
}

const PayrollGenerate = ({ onGenerateComplete }: PayrollGenerateProps) => {
  const [cutoffStart, setCutoffStart] = useState<Date | null>(new Date());
  const [cutoffEnd, setCutoffEnd] = useState<Date | null>(new Date());
  const [payDate, setPayDate] = useState<Date | null>(new Date());

  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!cutoffStart || !cutoffEnd || !payDate) {
      console.warn(" Missing dates", { cutoffStart, cutoffEnd, payDate });
      return toast.error("Please select all dates");
    }

    try {
      setGenerating(true);

      const payload = {
        cutoff_start: format(cutoffStart, "yyyy-MM-dd"),
        cutoff_end: format(cutoffEnd, "yyyy-MM-dd"),
        pay_date: format(payDate, "yyyy-MM-dd"),
      };

      console.log(" Sending payroll generate request:", payload);

      const res = await generatePayroll(
        payload.cutoff_start,
        payload.cutoff_end,
        payload.pay_date,
      );
      console.log(" Backend response:", res);

      toast.success("Payroll generated successfully");
      onGenerateComplete?.();
    } catch (error: any) {
      console.error(" Generate error:", error);

      if (error?.response) {
        console.error(" Server error:", error.response.data);
      }

      toast.error("Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Generate Payroll</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select cutoff period and pay date
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* CUTOFF START */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cutoff Start</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !cutoffStart && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {cutoffStart ? format(cutoffStart, "PPP") : "Select start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={cutoffStart || undefined}
                onSelect={(date) => setCutoffStart(date || null)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/*  CUTOFF END */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cutoff End</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !cutoffEnd && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {cutoffEnd ? format(cutoffEnd, "PPP") : "Select end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={cutoffEnd || undefined}
                onSelect={(date) => setCutoffEnd(date || null)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/*  PAY DATE */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Pay Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !payDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {payDate ? format(payDate, "PPP") : "Select pay date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={payDate || undefined}
                onSelect={(date) => setPayDate(date || null)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* INFO */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm font-medium mb-2">⚠️ Important Notes:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Payroll will be generated based on selected cutoff</li>
            <li>• Existing payroll for this cutoff will be overwritten</li>
            <li>• Includes salary, deductions, attendance</li>
          </ul>
        </div>

        {/* BUTTON */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-1"
          >
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {generating ? "Generating..." : "Generate Payroll"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayrollGenerate;
