import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

interface OutlookConfig {
  accessToken: string;
}

interface EventPayload {
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  body?: {
    contentType: string;
    content: string;
  };
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: string;
}

export function createOutlookClient(config: OutlookConfig) {
  return Client.init({
    authProvider: (done) => {
      done(null, config.accessToken);
    }
  });
}

export async function createOutlookEvent(client: Client, payload: EventPayload) {
  try {
    const event = await client.api("/me/calendar/events").post(payload);
    return { success: true, eventId: event.id as string, webLink: event.webLink as string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function updateOutlookEvent(client: Client, eventId: string, payload: Partial<EventPayload>) {
  try {
    await client.api(`/me/calendar/events/${eventId}`).patch(payload);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function deleteOutlookEvent(client: Client, eventId: string) {
  try {
    await client.api(`/me/calendar/events/${eventId}`).delete();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export function buildEventPayload(slot: {
  title: string;
  startAt: string;
  endAt: string;
  room: string;
  teamsLink: string;
  theme: string;
  criterionCode: string;
  mode: string;
}): EventPayload {
  const descriptionParts = [
    slot.theme ? `Thème: ${slot.theme}` : "",
    slot.criterionCode ? `Critère: ${slot.criterionCode}` : "",
    slot.mode ? `Mode: ${slot.mode}` : ""
  ].filter((value) => value.length > 0);

  return {
    subject: slot.title || "Entretien d'audit",
    start: {
      dateTime: slot.startAt,
      timeZone: "Europe/Paris"
    },
    end: {
      dateTime: slot.endAt,
      timeZone: "Europe/Paris"
    },
    location: slot.room ? { displayName: slot.room } : undefined,
    body: descriptionParts.length > 0
      ? {
          contentType: "text",
          content: descriptionParts.join("\n")
        }
      : undefined,
    isOnlineMeeting: slot.mode === "distance" || slot.mode === "hybride",
    onlineMeetingProvider: slot.mode === "distance" || slot.mode === "hybride" ? "teamsForBusiness" : undefined
  };
}
