"use client";

import Image from "next/image";
import EventsContainer from "@/components/EventsContainer";
import { Event } from "@/components/Schedule";
import { useEffect, useState } from "react";

interface Question {
  id: string;
  name: string;
  type: string;
  value: string | number | boolean | { url: string; filename: string }[] | null;
}

interface Submission {
  submissionId: string;
  submissionTime: string;
  questions: Question[];
}

interface ResponseData {
  responses: Submission[];
  totalResponses: number;
  pageCount: number;
}

function transformEvents(data: ResponseData): Event[] {
  // Transform the responses into a flattened format
  const flattenedEvents = data.responses.map((submission) => {
    const event: Record<string, string | number | boolean | { url: string; filename: string }[] | null> = {};

    submission.questions.forEach((question) => {
      event[question.name] = question.value;
    });

    return event;
  });

  // Transform the flattened events into the format needed by Schedule component
  return flattenedEvents.map((event) => ({
    eventName: String(event["Event Name"] || ""),
    startDate: String(event["Event Start Date"] || ""),
    endDate: (() => {
      const startDate = new Date(String(event["Event Start Date"]) || "");
      const days = Number(event["Number of Days"]) || 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      return endDate.toISOString();
    })(),
    organizer: String(event["Organizer Name"] || ""),
    description: String(event["Event Description"] || ""),
    eventTypes: Array.isArray(event["Event Type"])
      ? (event["Event Type"] as unknown as Event["eventTypes"])
      : ["Other"],
    venue: String(event["Venue Name"] || ""),
    venueAddress: String(event["Venue Address"] || ""),
    venueLink: event["Venue Link"] ? String(event["Venue Link"]) : undefined,
    eventLink: String(event["Event Link/Website"] || ""),
    chatLink: event["Link to Event Group Chat"] ? String(event["Link to Event Group Chat"]) : undefined,
    chatPlatform: event["Event Group Chat Platform"]
      ? (String(event["Event Group Chat Platform"]) as Event["chatPlatform"])
      : undefined,
    logo: Array.isArray(event["Logo"]) ? (event["Logo"] as { url: string; filename: string }[]) : null,
    dailySchedule: Array.from({ length: 7 }, (_, i) => ({
      startTime: event[`Day ${i + 1} - Start Time`] ? String(event[`Day ${i + 1} - Start Time`]) : null,
      endTime: event[`Day ${i + 1} - End Time`] ? String(event[`Day ${i + 1} - End Time`]) : null,
    })),
  }));
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/exampleResponse.json")
      .then((response) => response.json())
      .then((data: ResponseData) => {
        const transformedEvents = transformEvents(data);
        setEvents(transformedEvents);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen w-screen p-1 sm:p-8 pb-20 font-[family-name:var(--font-geist-sans)] bg-black text-white">
      <main className="flex flex-col gap-4 items-center text-center max-w-2xl">
        <Image src="/bbw25-logo.svg" alt="Berlin Blockchain Week 2025 logo" width={250} height={250} priority />

        <h1 className="text-4xl sm:text-5xl font-bold text-white -mt-6">Berlin Blockchain Week 2025</h1>

        <h2 className="text-2xl text-primary-500 font-semibold">June 8-22</h2>

        <div className="space-y-4">
          <p className="text-xl text-gray-300">Coming Soon to Berlin</p>
        </div>

        <div className="text-sm text-gray-400">Are you organizing an event? Submit it now!</div>

        <a
          href="https://forms.fillout.com/t/6zcH1pfc4ius"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-4 bg-primary-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Submit Your Event
        </a>
      </main>

      {isLoading ? <div className="text-gray-400">Loading events...</div> : <EventsContainer events={events} />}
    </div>
  );
}
