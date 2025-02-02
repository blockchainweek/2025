"use client";

import { useState } from "react";
import Schedule from "./Schedule";
import EventList from "./EventList";
import { Event } from "./Schedule";
import { EVENT_TYPES, EventType, EventTypeIcon, getBadgeClasses } from "@/constants/eventTypes";

interface EventsContainerProps {
  events: Event[];
}

export default function EventsContainer({ events }: EventsContainerProps) {
  const [view, setView] = useState<"schedule" | "list">("schedule");
  const [selectedTypes, setSelectedTypes] = useState<Set<EventType>>(new Set(EVENT_TYPES));

  const filteredEvents = events.filter((event) => event.eventTypes.some((type) => selectedTypes.has(type)));

  // Calculate event statistics
  const eventStats = {
    total: events.length,
    byType: EVENT_TYPES.reduce((acc, type) => {
      acc[type] = events.filter((event) => event.eventTypes.includes(type)).length;
      return acc;
    }, {} as Record<EventType, number>),
    filtered: filteredEvents.length,
  };

  const toggleEventType = (type: EventType) => {
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
      <div className="flex flex-col items-center mt-8 mb-12 text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            <div className="text-8xl font-bold">{eventStats.total}</div>
            <div className="text-2xl">events</div>
          </h2>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400 mt-4">
            {EVENT_TYPES.map((type) => {
              const count = eventStats.byType[type];
              if (count === 0) return null; // Don't show types with no events
              return (
                <div key={type} className="flex items-center gap-1.5">
                  <EventTypeIcon type={type} />
                  <span>
                    {type}: <span className="text-gray-300">{count}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col items-center mb-8 gap-4">
        <p className="text-gray-400 text-sm">Select event types below to filter</p>
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
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

      {/* View Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg border border-gray-700 p-1">
          <button
            onClick={() => setView("schedule")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === "schedule" ? "bg-primary-500 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Schedule View
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === "list" ? "bg-primary-500 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {view === "schedule" ? <Schedule events={filteredEvents} /> : <EventList events={filteredEvents} />}
    </section>
  );
}
