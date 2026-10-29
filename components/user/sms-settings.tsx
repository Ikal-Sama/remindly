"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  getSmsSettings,
  sendTestSms,
  updateSmsSettings,
} from "@/app/action/sms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SMS_CARRIERS,
  SMS_CARRIER_COUNTRIES,
} from "@/lib/sms/carriers";
import { SMS_DAILY_LIMIT } from "@/lib/sms/constants";

interface SavedSettings {
  phoneNumber: string;
  carrierId: string;
  enabled: boolean;
}

export function SmsSettings() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [saved, setSaved] = useState<SavedSettings | null>(null);
  const [provider, setProvider] = useState("email-gateway");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getSmsSettings();
      if (cancelled) return;

      if (result.success && result.settings) {
        const settings = result.settings;
        setPhoneNumber(settings.phoneNumber);
        setCarrierId(settings.carrierId);
        setEnabled(settings.enabled);
        setProvider(settings.provider);
        setSaved({
          phoneNumber: settings.phoneNumber,
          carrierId: settings.carrierId,
          enabled: settings.enabled,
        });
      } else {
        toast.error(result.error || "Could not load SMS settings");
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty =
    !saved ||
    phoneNumber !== saved.phoneNumber ||
    carrierId !== saved.carrierId ||
    enabled !== saved.enabled;

  const canTest =
    !dirty &&
    !loading &&
    !testing &&
    Boolean(saved?.phoneNumber) &&
    Boolean(saved?.enabled);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateSmsSettings({
        phoneNumber,
        carrierId,
        enabled,
      });

      if (result.success && result.settings) {
        setPhoneNumber(result.settings.phoneNumber);
        setCarrierId(result.settings.carrierId);
        setEnabled(result.settings.enabled);
        setSaved({
          phoneNumber: result.settings.phoneNumber,
          carrierId: result.settings.carrierId,
          enabled: result.settings.enabled,
        });
        toast.success(result.message);
      } else {
        toast.error(result.error || "Could not save SMS settings");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const result = await sendTestSms();
      if (result.success) {
        toast.success(result.message || "Test message sent");
      } else {
        toast.error(result.error || "Could not send the test message");
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          SMS reminders
        </CardTitle>
        <CardDescription>
          Get the same task reminders by text message, on top of email. Included
          on every plan - up to {SMS_DAILY_LIMIT} messages a day.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading SMS settings...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="sms-phone">Mobile number</Label>
              <Input
                id="sms-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+1 415 555 0123"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Include the country code. Free delivery currently supports US
                and Canadian numbers.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sms-carrier">Mobile carrier</Label>
              <Select
                value={carrierId || undefined}
                onValueChange={(value) => setCarrierId(value)}
              >
                <SelectTrigger id="sms-carrier" className="w-full">
                  <SelectValue placeholder="Select your carrier" />
                </SelectTrigger>
                <SelectContent>
                  {SMS_CARRIER_COUNTRIES.map((country) => (
                    <SelectGroup key={country.code}>
                      <SelectLabel>{country.label}</SelectLabel>
                      {SMS_CARRIERS.filter(
                        (carrier) => carrier.country === country.code,
                      ).map((carrier) => (
                        <SelectItem key={carrier.id} value={carrier.id}>
                          {carrier.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                We use your carrier&apos;s email-to-SMS gateway, so there is no
                extra account or fee. Standard message rates from your carrier
                may still apply.
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
              />
              <span>
                Text me task reminders
                <span className="block text-xs text-muted-foreground">
                  Turn this off any time; your number is kept for the next time
                  you enable it.
                </span>
              </span>
            </label>

            {provider === "console" && (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Delivery is not configured on this deployment, so messages are
                logged instead of sent.
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || !dirty}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving ? "Saving..." : "Save SMS settings"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={!canTest}
              >
                {testing && <Loader2 className="size-4 animate-spin" />}
                Send test message
              </Button>
            </div>

            {dirty && saved && (
              <p className="text-xs text-muted-foreground">
                Save your changes before sending a test.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
