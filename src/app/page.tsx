"use client";

import Image from "next/image";
import EventsContainer from "@/components/EventsContainer";
import { EventType } from "@/app/views/Schedule";
import { useEffect, useState } from "react";
import { LuCalendarPlus } from "react-icons/lu";

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

function transformEvents(data: ResponseData): EventType[] {
  // Transform the responses into a flattened format
  const flattenedEvents = data.responses.map((submission) => {
    const event: Record<string, string | number | boolean | { url: string; filename: string }[] | null> = {
      submissionTime: submission.submissionTime,
    };

    submission.questions.forEach((question) => {
      event[question.name] = question.value;
    });

    return event;
  });

  // Transform the flattened events into the format needed by Schedule component
  const transformedEvents = flattenedEvents.map((event) => ({
    eventName: String(event["Event Name"] || ""),
    startDate: String(event["Event Start Date"] || ""),
    endDate: (() => {
      const startDate = new Date(String(event["Event Start Date"]) || "");
      const days = Number(event["Number of Days"]) || 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      return endDate.toISOString();
    })(),
    totalDays: Number(event["Number of Days"]) || 1,
    organizer: String(event["Organizer Name"] || ""),
    description: String(event["Event Description"] || ""),
    eventTypes: Array.isArray(event["Event Type"])
      ? (event["Event Type"] as unknown as EventType["eventTypes"])
      : ["Other"],
    venue: String(event["Venue Name"] || ""),
    venueAddress: String(event["Venue Address"] || ""),
    venueLink: event["Venue Link"] ? String(event["Venue Link"]) : undefined,
    eventLink: String(event["Event Link/Website"] || ""),
    chatLink: event["Link to Event Group Chat"] ? String(event["Link to Event Group Chat"]) : undefined,
    chatPlatform: event["Event Group Chat Platform"]
      ? (String(event["Event Group Chat Platform"]) as EventType["chatPlatform"])
      : undefined,
    logo: Array.isArray(event["Logo"]) ? (event["Logo"] as { url: string; filename: string }[]) : null,
    dailySchedule: Array.from({ length: 7 }, (_, i) => ({
      startTime: event[`Day ${i + 1} - Start Time`] ? String(event[`Day ${i + 1} - Start Time`]) : null,
      endTime: event[`Day ${i + 1} - End Time`] ? String(event[`Day ${i + 1} - End Time`]) : null,
    })),
    submissionTime: String(event["submissionTime"] || ""),
  }));

  // Sort events by submission time (newest first)
  transformedEvents.sort((a, b) => {
    if (!a.submissionTime) return 1; // If a has no submission time, put it at the end
    if (!b.submissionTime) return -1; // If b has no submission time, put it at the end
    return new Date(a.submissionTime).getTime() - new Date(b.submissionTime).getTime();
  });

  return transformedEvents as EventType[];
}

const EVENTS_FETCH_URL = "https://europe-west1-ethberlin-dystopian-faces.cloudfunctions.net/bbw2025-get-fillout-events";

export default function Home() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>("Loading events...");

  useEffect(() => {
    fetch(EVENTS_FETCH_URL)
      .then((response) => response.json())
      .then((data: ResponseData) => {
        const transformedEvents = transformEvents(data);
        setEvents(transformedEvents);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        setIsLoading(false);
        setMessage("Error fetching events :(");
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen max-w-screen bg-black text-white">
      {/* Header */}
      <header className="w-full border-b border-gray-800 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between md:items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <Image
              src="/bbw25-logo.svg"
              alt="Berlin Blockchain Week 2025 logo"
              width={64}
              height={64}
              className="w-12 h-12 md:w-16 md:h-16"
              priority
            />
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white">Berlin Blockchain Week 2025</h1>
              <h2 className="text-sm md:text-base text-primary-500 font-medium">June 8-22</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://forms.fillout.com/t/6zcH1pfc4ius"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity hidden md:flex items-center gap-2 md:text-base text-sm"
            >
              <LuCalendarPlus className="w-5 h-5" />
              Submit Event
            </a>
            <a
              href="https://forms.fillout.com/t/6zcH1pfc4ius"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-2 bg-primary-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity flex md:hidden items-center gap-2 md:text-base text-sm"
            >
              <LuCalendarPlus className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/blockchainweek/2025"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 pb-20">
        <div className="w-full max-w-7xl">
          {isLoading ? (
            <div className="text-gray-400 my-12 text-xl text-center">{message}</div>
          ) : (
            <EventsContainer events={events} />
          )}
        </div>
      </main>
    </div>
  );
}
