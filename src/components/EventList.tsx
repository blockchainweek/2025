import { FC } from "react";
import { Event } from "./Schedule";
import EventCard from "./EventCard";

interface EventListProps {
  events: Event[];
}

const EventList: FC<EventListProps> = ({ events }) => {
  // Split multi-day events into separate day events
  const splitEvents = events.flatMap((event) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return Array.from({ length: days }, (_, index) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + index);

      // Get the start and end times for this day from dailySchedule
      const daySchedule = event.dailySchedule[index];

      return {
        ...event,
        dayIndex: index + 1,
        totalDays: days,
        currentDate: currentDate.toISOString(),
        startTime: daySchedule?.startTime || "09:00",
        endTime: daySchedule?.endTime || "17:00",
      };
    });
  });

  // Sort events chronologically
  const sortedEvents = splitEvents.sort((a, b) => {
    const dateA = new Date(`${a.currentDate.split("T")[0]}T${a.startTime}`);
    const dateB = new Date(`${b.currentDate.split("T")[0]}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Group events by date
  const eventsByDate = sortedEvents.reduce((acc, event) => {
    const date = event.currentDate.split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof sortedEvents>);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 px-2">
      {Object.entries(eventsByDate).map(([date, dateEvents]) => {
        const displayDate = new Date(date);
        return (
          <div key={date} className="space-y-6">
            <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-black/80 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white">
                {displayDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>

            {dateEvents.map((event, index) => (
              <EventCard key={`${event.eventName}-${index}`} event={event} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default EventList;
