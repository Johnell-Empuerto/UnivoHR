"use client";

import { useEffect, useState } from "react";
import { getMissingManHourDates } from "@/services/manHourReportService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, AlertCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";

type MissingDate = {
  missing_date: string;
};

const MissingManHoursTab = () => {
  const [missingDates, setMissingDates] = useState<MissingDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  });

  const fetchMissingDates = async () => {
    try {
      setLoading(true);
      const data = await getMissingManHourDates(startDate, endDate);
      setMissingDates(data);
    } catch (error: any) {
      console.error("Failed to fetch missing dates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchMissingDates();
    }
  }, [startDate, endDate]);

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div className="flex-1">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <Button onClick={fetchMissingDates} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Missing Man Hour Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : missingDates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No missing man hour reports found</p>
              <p className="text-sm">
                All dates in the selected range have reports
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {missingDates.map((item) => (
                <div
                  key={item.missing_date}
                  className="p-3 rounded-lg border border-destructive/50 bg-destructive/5 text-center"
                >
                  <p className="text-sm font-medium text-destructive">
                    {formatDate(item.missing_date)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No report
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MissingManHoursTab;
