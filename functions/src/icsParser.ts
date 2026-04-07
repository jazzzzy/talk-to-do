/**
 * icsParser.ts — Fetches and parses an iCloud public ICS feed.
 * Returns a normalized array of calendar events ready for Firestore upsert.
 */
import axios from "axios";
import * as ical from "node-ical";

export interface ParsedEvent {
  uid: string;
  summary: string;
  startDate: string;       // 'YYYY-MM-DD'
  startTime?: string;      // 'HH:MM' (undefined for all-day events)
  endDate?: string;        // 'YYYY-MM-DD'
  endTime?: string;        // 'HH:MM'
  allDay: boolean;
  location?: string;
  description?: string;
}

/**
 * Fetches the ICS file from the given URL and parses all VEVENT entries.
 * Filters out past events older than 180 days to keep the collection lean.
 */
export async function fetchAndParseIcs(icsUrl: string): Promise<ParsedEvent[]> {
  const response = await axios.get<string>(icsUrl, {
    timeout: 15_000,
    responseType: "text",
  });

  const parsed = ical.sync.parseICS(response.data);
  const events: ParsedEvent[] = [];

  // 180 days ago cutoff — retain events from the past 6 months
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 180);

  for (const key of Object.keys(parsed)) {
    const component = parsed[key];
    if (component.type !== "VEVENT") continue;

    const vevent = component as ical.VEvent;
    if (!vevent.uid || !vevent.summary || !vevent.start) continue;

    const startDate = vevent.start;

    // Skip events older than 180 days
    if (startDate < cutoff) continue;

    const allDay = isAllDayEvent(vevent);

    events.push({
      uid: vevent.uid,
      summary: vevent.summary.trim().slice(0, 200),
      startDate: formatDateOnly(startDate),
      startTime: allDay ? undefined : formatTimeOnly(startDate),
      endDate: vevent.end ? formatDateOnly(vevent.end) : undefined,
      endTime: vevent.end && !allDay ? formatTimeOnly(vevent.end) : undefined,
      allDay,
      location: vevent.location?.trim() || undefined,
      description: vevent.description?.trim().slice(0, 500) || undefined,
    });
  }

  return events;
}

/** Determine if a VEVENT is all-day based on its date format. */
function isAllDayEvent(vevent: ical.VEvent): boolean {
  // All-day events have DTSTART as DATE (no time component).
  // node-ical sets dateOnly=true or the rrule startDate lacks time info.
  const start = vevent.start;
  if ("dateOnly" in start && (start as Record<string, unknown>).dateOnly) {
    return true;
  }
  // Fallback heuristic: if start time is exactly midnight and duration is
  // a multiple of 24h, treat as all-day.
  if (start.getHours() === 0 && start.getMinutes() === 0 && vevent.end) {
    const durationMs = vevent.end.getTime() - start.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    if (hours > 0 && hours % 24 === 0) return true;
  }
  return false;
}

/** 'YYYY-MM-DD' in UTC-safe manner. */
function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 'HH:MM' in local time. */
function formatTimeOnly(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
