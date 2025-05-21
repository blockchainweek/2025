import { FC } from "react";
import { EventType } from "./Schedule";
import Event from "../../components/Event";
import { BerlinDate } from "@/utils/BerlinDate";

interface DaysProps {
  events: EventType[];
}

const Days: FC<DaysProps> = ({ events }) => {
  // Split multi-day events into separate day events
  const splitEvents = events.flatMap((event) => {
    const startDate = new BerlinDate(event.startDate);

    return Array.from({ length: event.totalDays }, (_, index) => {
      const currentDate = BerlinDate.from(startDate);
      currentDate.setDate(currentDate.getDate() + index);

      // Get the start and end times for this day from dailySchedule
      const daySchedule = event.dailySchedule[index];

      return {
        ...event,
        dayIndex: index + 1,
        currentDate: currentDate.toISOString(),
        startTime: daySchedule?.startTime || "00:00",
        endTime: daySchedule?.endTime || "23:59",
      };
    });
  });

  // Sort events chronologically
  const sortedEvents = splitEvents.sort((a, b) => {
    const dateA = new BerlinDate(`${a.currentDate.split("T")[0]}T${a.startTime}`);
    const dateB = new BerlinDate(`${b.currentDate.split("T")[0]}T${b.startTime}`);
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
    <div className="w-full max-w-4xl mx-auto space-y-12 px-2 relative">
      {/* Floating Navigation Menu */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 bg-black/50 rounded-lg z-20 py-4 max-h-screen overflow-y-auto">
        {Object.entries(eventsByDate).map(([date]) => {
          const displayDate = new BerlinDate(date);
          const month = displayDate.toLocaleDateString("en-US", { month: "short" });
          const day = displayDate.toLocaleDateString("en-US", { day: "numeric" });
          const weekday = displayDate.toLocaleDateString("en-US", { weekday: "short" });
          const shortDate = `${month} ${day}, ${weekday}`;
          return (
            <a
              key={date}
              href={`#date-${date}`}
              className="block text-white hover:text-red-500 text-base transition-all hover:font-medium px-3 md:px-2 py-2"
            >
              <span className="hidden md:inline">{shortDate}</span>
              <span className="md:hidden flex flex-col items-center">
                <span className="text-lg">{day}</span>
                <span className="text-xs opacity-75">{weekday}</span>
              </span>
            </a>
          );
        })}
      </div>

      {Object.entries(eventsByDate).map(([date, dateEvents]) => {
        const displayDate = new BerlinDate(date);
        return (
          <div key={date} id={`date-${date}`} className="space-y-6 scroll-mt-24">
            <div className="sticky top-16 z-10 -mx-4 px-4 py-2 bg-black/80 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white">
                {displayDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>

            {dateEvents.map((event, index) => (
              <Event key={`${event.eventName}-${index}`} event={event} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default Days;
