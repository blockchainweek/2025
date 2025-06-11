import { FC, useState, useEffect } from "react";
import { EventType } from "./Schedule";
import Event from "../../components/Event";
import { BerlinDate } from "@/utils/BerlinDate";

interface DaysProps {
  events: EventType[];
}

const Days: FC<DaysProps> = ({ events }) => {
  const [currentTime, setCurrentTime] = useState(() => new BerlinDate(Date.now()));

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new BerlinDate(Date.now()));
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(interval);
  }, []);
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
        endTime: daySchedule?.endTime || "",
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
          const day = displayDate.toLocaleDateString("en-US", { day: "numeric" });
          const weekday = displayDate.toLocaleDateString("en-US", { weekday: "short" });

          // Check if this day is in the past
          const endOfDay = new BerlinDate(
            displayDate.getFullYear(),
            displayDate.getMonth(),
            displayDate.getDate(),
            23,
            59,
            59
          );
          const isPastDay = currentTime > endOfDay;

          // Check if this is today
          const isToday =
            displayDate.getFullYear() === currentTime.getFullYear() &&
            displayDate.getMonth() === currentTime.getMonth() &&
            displayDate.getDate() === currentTime.getDate();

          return (
            <a
              key={date}
              href={`#date-${date}`}
              className={`block ${
                isToday ? "text-red-500" : "text-gray-300"
              } hover:text-red-500 text-base transition-all hover:font-medium px-2 md:pr-4 py-[0.35rem] bg-black bg-opacity-50 ${
                isPastDay ? "opacity-30" : ""
              }`}
            >
              <span className="flex flex-col items-center">
                <span className="text-sm sm:text-lg">{day}</span>
                <span className="text-xs opacity-75">{weekday}</span>
              </span>
            </a>
          );
        })}
      </div>

      {Object.entries(eventsByDate).map(([date, dateEvents]) => {
        const displayDate = new BerlinDate(date);

        // Check if this day is in the past
        const endOfDay = new BerlinDate(
          displayDate.getFullYear(),
          displayDate.getMonth(),
          displayDate.getDate(),
          23,
          59,
          59
        );
        const isPastDay = currentTime > endOfDay;

        return (
          <div key={date} id={`date-${date}`} className="space-y-6 scroll-mt-24">
            <div className="sticky top-16 z-10 -mx-4 px-4 py-2 bg-black/80 backdrop-blur-sm">
              <h2 className={`text-2xl font-bold text-white ${isPastDay ? "opacity-30" : ""}`}>
                {displayDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>

            {dateEvents.map((event, index) => {
              // Check if event is past (using Berlin time)
              const now = new BerlinDate(Date.now());

              // Handle events that end before 6am (next day events)
              const endTime = event.endTime || "23:59";
              const [endHour] = endTime.split(":").map(Number);
              const eventDate = new BerlinDate(event.currentDate.split("T")[0]);

              if (endHour < 6) {
                // Add one day if end time is before 6am
                eventDate.setDate(eventDate.getDate() + 1);
              }

              const eventEndTime = new BerlinDate(`${eventDate.toISOString().split("T")[0]}T${endTime}:00`);
              const isPastEvent = now > eventEndTime;

              return (
                <div key={`${event.eventName}-${index}`} className={isPastEvent ? "opacity-30" : ""}>
                  <Event event={event} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default Days;
