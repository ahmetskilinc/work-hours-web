"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { calculateHoursWorked, cn, formatTimeString } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { updateWorkLog } from "@/actions/work-logs";
import { useToast } from "@/hooks/use-toast";

interface EditLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: any;
  defaultHourlyRate: number;
  timeFormat: "12h" | "24h";
  currencySymbol: string;
}

const EditLogDialog = ({
  open,
  onOpenChange,
  log,
  defaultHourlyRate,
  timeFormat,
  currencySymbol,
}: EditLogDialogProps) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date(log.date));
  const [startTime, setStartTime] = useState(log.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(log.end_time.slice(0, 5));
  const [useDefaultWage, setUseDefaultWage] = useState<boolean>(
    log.default_rate,
  );
  const [rate, setRate] = useState<number>(
    log.default_rate ? defaultHourlyRate : log.custom_rate,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hoursWorked = calculateHoursWorked(startTime + ":00", endTime + ":00");
  const currentRate = useDefaultWage ? defaultHourlyRate : rate;
  const earnings = hoursWorked * currentRate;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("id", log.id);
      formData.append("date", date?.toISOString() ?? log.date);
      formData.append("startTime", startTime);
      formData.append("endTime", endTime);
      formData.append("useDefaultWage", useDefaultWage.toString());
      if (!useDefaultWage) {
        formData.append("rate", rate.toString());
      }
      formData.append("notes", (e.target as HTMLFormElement).notes.value);

      const result = await updateWorkLog(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Work log updated successfully",
        });
        onOpenChange(false);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to update work log",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Work Log</DialogTitle>
          <DialogDescription>
            Update the details of your work session
          </DialogDescription>
        </DialogHeader>

        {/* Summary Card */}
        <Card className="border-none bg-muted p-4">
          <CardContent className="grid gap-2 p-0 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hours Worked:</span>
              <span className="font-medium">{hoursWorked}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate:</span>
              <span className="font-medium">
                {currencySymbol}
                {currentRate?.toFixed(2)}/h
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Total Earnings:</span>
              <span className="font-medium">
                {currencySymbol}
                {earnings?.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="grid gap-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {formatTimeString(startTime + ":00", timeFormat)}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {formatTimeString(endTime + ":00", timeFormat)}
            </p>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="defaultWage"
                checked={useDefaultWage}
                onCheckedChange={(checked) => {
                  setUseDefaultWage(checked as boolean);
                  if (checked) {
                    setRate(defaultHourlyRate);
                  }
                }}
              />
              <Label htmlFor="defaultWage" className="font-normal">
                Use My Default Wage
              </Label>
            </div>
            {!useDefaultWage && (
              <div className="grid gap-2">
                <Label htmlFor="rate">
                  Custom Hourly Rate ({currencySymbol})
                </Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  placeholder="Enter custom hourly rate"
                />
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              defaultValue={log.notes}
              placeholder="Add any notes about this work session"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLogDialog;
