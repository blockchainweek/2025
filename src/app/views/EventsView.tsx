import { FC } from "react";
import { EventType } from "./Schedule";
import EventCard from "@/components/EventCard";
import { BerlinDate } from "@/utils/BerlinDate";
import { EVENT_TYPES, EventTypeIcon, getBadgeClasses } from "@/constants/eventTypes";

interface EventsViewProps {
  events: EventType[];
}

const EventsView: FC<EventsViewProps> = ({ events }) => {
  // Format events with date information
  const formattedEvents = events.map((event) => {
    const startDate = new BerlinDate(event.startDate);
    return {
      ...event,
      currentDate: startDate.toISOString(),
    };
  });

  // Group events by type
  const groupedEvents = formattedEvents.reduce((acc, event) => {
    event.eventTypes.forEach((type) => {
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(event);
    });
    return acc;
  }, {} as Record<string, typeof formattedEvents>);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {EVENT_TYPES.map((type) => {
        const typeEvents = groupedEvents[type] || [];
        if (typeEvents.length === 0) return null;

        return (
          <div key={type} className="mb-12">
            <h2 className="mb-2">
              <div
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-lg font-medium ${getBadgeClasses(
                  type
                )}`}
              >
                <EventTypeIcon type={type} />
                {type} ({typeEvents.length})
              </div>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {typeEvents.map((event, index) => (
                <div key={`${event.eventName}-${index}`} className="h-full">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EventsView;
