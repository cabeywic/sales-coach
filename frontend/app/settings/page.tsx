"use client";

import { useStore } from "@/store/useStore";
import { PersonaSelector } from "@/components/voice/PersonaSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { currentDSR, settings, updateSettings, setVoiceEnabled } = useStore();

  if (!currentDSR) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your sales coach experience
        </p>
      </div>

      <Separator />

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your DSR details and territory</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{currentDSR.dsr_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">DSR ID:</span>
              <p className="font-medium">{currentDSR.dsr_id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Region:</span>
              <p className="font-medium">{currentDSR.region}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Route:</span>
              <p className="font-medium">{currentDSR.route_id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Distributor:</span>
              <p className="font-medium">{currentDSR.distributor}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <Badge>{currentDSR.dsr_type}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice & Persona Settings */}
      <PersonaSelector />

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose when you want to receive coaching notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="morning-briefing">Morning Briefing</Label>
              <p className="text-sm text-muted-foreground">
                Get a daily briefing at {currentDSR.preferred_checkin_time}
              </p>
            </div>
            <Switch
              id="morning-briefing"
              checked={settings.notification_preferences.morning_briefing}
              onCheckedChange={(checked) =>
                updateSettings({
                  notification_preferences: {
                    ...settings.notification_preferences,
                    morning_briefing: checked,
                  },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="real-time-nudges">Real-Time Nudges</Label>
              <p className="text-sm text-muted-foreground">
                Get proximity alerts and opportunity notifications
              </p>
            </div>
            <Switch
              id="real-time-nudges"
              checked={settings.notification_preferences.real_time_nudges}
              onCheckedChange={(checked) =>
                updateSettings({
                  notification_preferences: {
                    ...settings.notification_preferences,
                    real_time_nudges: checked,
                  },
                })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="end-of-day">End of Day Summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary of your performance each evening
              </p>
            </div>
            <Switch
              id="end-of-day"
              checked={settings.notification_preferences.end_of_day_summary}
              onCheckedChange={(checked) =>
                updateSettings({
                  notification_preferences: {
                    ...settings.notification_preferences,
                    end_of_day_summary: checked,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Settings</CardTitle>
          <CardDescription>
            Configure voice input and output preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="voice-enabled">Enable Voice</Label>
              <p className="text-sm text-muted-foreground">
                Use voice commands and hear responses
              </p>
            </div>
            <Switch
              id="voice-enabled"
              checked={settings.voice_enabled}
              onCheckedChange={setVoiceEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Performance Stats</CardTitle>
          <CardDescription>Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Target Achievement</span>
              <p className="text-xl font-bold text-primary mt-1">
                {currentDSR.target_achievement}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Sales Growth</span>
              <p className="text-xl font-bold text-green-600 mt-1">
                {currentDSR.sales_growth_trend}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Route Efficiency</span>
              <p className="text-xl font-bold mt-1">
                {currentDSR.route_efficiency_score.toFixed(0)}/100
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Outlets Covered</span>
              <p className="text-xl font-bold mt-1">
                {currentDSR.outlets_visited}/{currentDSR.outlets_to_sell_to}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Response Rate</span>
              <p className="text-xl font-bold text-green-600 mt-1">
                {currentDSR.response_rate_to_coach}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">SKU Progress</span>
              <p className="text-xl font-bold mt-1">{currentDSR.sku_focus_progress}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
