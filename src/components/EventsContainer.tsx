"use client";

import { useState } from "react";
import Schedule from "../app/views/Schedule";
import Days from "../app/views/Days";
import EventsView from "../app/views/EventsView";
import { EventType } from "../app/views/Schedule";
import { EVENT_TYPES, EventFormat, EventTypeIcon, getBadgeClasses } from "@/constants/eventTypes";

interface EventsContainerProps {
  events: EventType[];
}

export default function EventsContainer({ events }: EventsContainerProps) {
  const [view, setView] = useState<"events" | "timeline" | "days">("events");
  const [selectedTypes, setSelectedTypes] = useState<Set<EventFormat>>(new Set(EVENT_TYPES));

  const filteredEvents = events.filter((event) => event.eventTypes.some((type) => selectedTypes.has(type)));

  // Calculate event statistics
  const eventStats = {
    total: events.length,
    byType: EVENT_TYPES.reduce((acc, type) => {
      acc[type] = events.filter((event) => event.eventTypes.includes(type)).length;
      return acc;
    }, {} as Record<EventFormat, number>),
    filtered: filteredEvents.length,
  };

  const toggleEventType = (type: EventFormat) => {
    setSelectedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedTypes(new Set(EVENT_TYPES));
  };

  const clearAll = () => {
    setSelectedTypes(new Set());
  };

  return (
    <section className="w-full">
      {/* Stats Section */}
      <div className="flex flex-col items-center text-center">
        <div className="">
          <h2 className="text-2xl font-bold text-white mb-2">
            <div className="text-8xl font-bold">{eventStats.total}</div>
            <div className="text-2xl">events</div>
          </h2>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-gray-400 text-sm">Select event types below to filter</p>
        <div className="flex flex-wrap justify-center gap-2">
          {EVENT_TYPES.map((type) => {
            const count = eventStats.byType[type];
            if (count === 0) return null; // Don't show types with no events
            return (
              <button
                key={type}
                onClick={() => toggleEventType(type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 border ${
                  selectedTypes.has(type)
                    ? getBadgeClasses(type)
                    : "text-gray-400 border-gray-700 hover:border-gray-600"
                }`}
              >
                <EventTypeIcon type={type} />
                {type} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex gap-4">
          <button onClick={selectAll} className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors">
            Select All
          </button>
          <button onClick={clearAll} className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors">
            Clear All
          </button>
        </div>
      </div>

      {/* View Toggle - Now Sticky */}
      <div className="sticky top-0 z-10 py-4 bg-black/80 backdrop-blur-sm w-full">
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-700 p-1">
            <button
              onClick={() => setView("timeline")}
              className={`w-24 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "timeline" ? "bg-primary-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView("events")}
              className={`w-24 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "events" ? "bg-primary-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setView("days")}
              className={`w-24 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === "days" ? "bg-primary-500 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Days
            </button>
          </div>
        </div>
      </div>

      {view === "events" ? (
        <EventsView events={filteredEvents} />
      ) : view === "timeline" ? (
        <Schedule events={filteredEvents} />
      ) : (
        <Days events={filteredEvents} />
      )}
    </section>
  );
}
