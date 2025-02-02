import { FC, useState, useEffect } from "react";
import EventCard from "./EventCard";
import { IoClose } from "react-icons/io5";
import Image from "next/image";
export interface Event {
  eventName: string;
  startDate: string;
  endDate: string;
  organizer: string;
  description: string;
  eventTypes: ("Conference" | "Hackathon" | "Meetup" | "Party" | "Coworking" | "Happy Hour" | "Other")[];
  venue: string;
  venueAddress: string;
  venueLink?: string;
  eventLink: string;
  logo: { url: string; filename: string }[] | null;
  dailySchedule: {
    startTime: string | null;
    endTime: string | null;
  }[];
  chatLink?: string;
  chatPlatform?: "Matrix" | "Telegram" | "Discord" | "Signal" | "Other";
}

export interface ProcessedEvent extends Omit<Event, "startDate" | "endDate"> {
  startDate: Date;
  endDate: Date;
  dayIndex: number;
  totalDays: number;
  currentDate: string;
  startTime: string;
  endTime: string;
  column?: number;
}

interface ScheduleProps {
  events: Event[];
}

const START_DATE = new Date("2025-06-08");
const END_DATE = new Date("2025-06-22");
const MINUTES_PER_CHUNK = 15;
const CHUNK_HEIGHT = 10; // height in pixels for each 15-min chunk
const MINUTES_PER_DAY = 24 * 60;
const CHUNKS_PER_DAY = MINUTES_PER_DAY / MINUTES_PER_CHUNK;
const TOTAL_DAYS = Math.ceil((END_DATE.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)) + 1;
const TIMELINE_HEIGHT = TOTAL_DAYS * CHUNKS_PER_DAY * CHUNK_HEIGHT;
const EVENT_GAP = 8; // pixels between overlapping events

const Schedule: FC<ScheduleProps> = ({ events }) => {
  const [eventWidth, setEventWidth] = useState(window.innerWidth < 640 ? 50 : 100);
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setEventWidth(window.innerWidth < 640 ? 50 : 100);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        startTime: daySchedule?.startTime || "09:00", // Default to 9 AM if not specified
        endTime: daySchedule?.endTime || "17:00", // Default to 5 PM if not specified
      };
    });
  });

  // Function to check if two events overlap
  const eventsOverlap = (a: ProcessedEvent, b: ProcessedEvent) => {
    if (a.currentDate !== b.currentDate) return false;

    const aStart = new Date(`${a.currentDate.split("T")[0]}T${a.startTime}`);
    const aEnd = new Date(`${a.currentDate.split("T")[0]}T${a.endTime}`);
    const bStart = new Date(`${b.currentDate.split("T")[0]}T${b.startTime}`);
    const bEnd = new Date(`${b.currentDate.split("T")[0]}T${b.endTime}`);

    return aStart < bEnd && aEnd > bStart;
  };

  // Convert to ProcessedEvent
  const processedEvents: ProcessedEvent[] = splitEvents.map((event) => ({
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
  })) as ProcessedEvent[];

  // Sort events by start time
  processedEvents.sort((a, b) => {
    const dateCompare = new Date(a.currentDate).getTime() - new Date(b.currentDate).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  // Assign columns to events
  processedEvents.forEach((event) => {
    const overlappingEvents = processedEvents.filter((e) => eventsOverlap(e, event));
    const usedColumns = overlappingEvents.filter((e) => e.column !== undefined).map((e) => e.column);

    // Find the first available column
    let column = 0;
    while (usedColumns.includes(column)) {
      column++;
    }
    event.column = column;
  });

  return (
    <>
      <div className="w-full max-w-6xl mx-auto">
        <div className="overflow-x-auto">
          <div className="flex min-w-[800px]">
            {/* Date and time labels */}
            <div className="w-12 flex-shrink-0 pr-2 sm:pr-4 bg-black">
              {Array.from({ length: TOTAL_DAYS }).map((_, dayIndex) => {
                return (
                  <div key={dayIndex} style={{ height: `${CHUNKS_PER_DAY * CHUNK_HEIGHT}px` }} className="relative" />
                );
              })}
            </div>

            {/* Timeline */}
            <div className="flex-grow relative border-l border-gray-800" style={{ height: `${TIMELINE_HEIGHT}px` }}>
              {/* Time chunk dividers */}
              {Array.from({ length: TOTAL_DAYS * CHUNKS_PER_DAY }).map((_, index) => (
                <div
                  key={index}
                  className="absolute w-full border-b border-gray-500"
                  style={{
                    top: `${index * CHUNK_HEIGHT}px`,
                    borderBottomStyle: index % 4 === 0 ? "solid" : "dotted",
                    opacity: index % 4 === 0 ? 0.3 : 0.2,
                  }}
                />
              ))}

              {/* Left Hour labels */}
              <div className="absolute -left-10 sm:-left-12 top-0 bottom-0">
                {Array.from({ length: TOTAL_DAYS }).map((_, dayIndex) =>
                  Array.from({ length: 24 }).map((_, hour) => {
                    const date = new Date(START_DATE);
                    date.setDate(date.getDate() + dayIndex);

                    // Skip rendering 23:00 and 01:00
                    if (hour === 23 || hour === 1) return null;

                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="absolute text-[9px] sm:text-xs text-gray-500"
                        style={{
                          top: `${(dayIndex * CHUNKS_PER_DAY + hour * 4) * CHUNK_HEIGHT}px`,
                          transform: "translateY(-50%)",
                        }}
                      >
                        {hour === 0 ? (
                          <span className="flex flex-col items-end text-right">
                            <span className="text-gray-400 text-[9px] sm:text-xs">
                              {date.toLocaleDateString("en-US", { weekday: "short" })}
                            </span>
                            <span className="font-bold text-white text-sm sm:text-xl -mt-1">
                              {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </span>
                        ) : (
                          `${hour.toString().padStart(2, "0")}:00`
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Hour labels */}
              <div className="absolute -right-12 top-0 bottom-0">
                {Array.from({ length: TOTAL_DAYS }).map((_, dayIndex) =>
                  Array.from({ length: 24 }).map((_, hour) => {
                    const date = new Date(START_DATE);
                    date.setDate(date.getDate() + dayIndex);

                    // Skip rendering 23:00 and 01:00
                    if (hour === 23 || hour === 1) return null;

                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="absolute text-[9px] sm:text-xs text-gray-500"
                        style={{
                          top: `${(dayIndex * CHUNKS_PER_DAY + hour * 4) * CHUNK_HEIGHT}px`,
                          transform: "translateY(-50%)",
                        }}
                      >
                        {hour === 0 ? (
                          <span className="flex flex-col items-start text-left">
                            <span className="text-gray-400 text-sm">
                              {date.toLocaleDateString("en-US", { weekday: "short" })}
                            </span>
                            <span className="font-bold text-white text-xl -mt-1">
                              {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </span>
                        ) : (
                          `${hour.toString().padStart(2, "0")}:00`
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Events */}
              {processedEvents.map((event, index) => {
                const eventDate = new Date(event.currentDate);
                const daysSinceStart = Math.floor((eventDate.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));
                const topPosition = daysSinceStart * CHUNKS_PER_DAY * CHUNK_HEIGHT;

                // Calculate position based on time
                const [hours, minutes] = event.startTime.split(":").map(Number);
                const [endHours, endMinutes] = event.endTime.split(":").map(Number);

                const minutesSinceMidnight = hours * 60 + minutes;
                const endMinutesSinceMidnight = endHours * 60 + endMinutes;
                const durationInMinutes = endMinutesSinceMidnight - minutesSinceMidnight;

                const chunkOffset = Math.floor(minutesSinceMidnight / MINUTES_PER_CHUNK) * CHUNK_HEIGHT;
                const eventHeight = Math.floor(durationInMinutes / MINUTES_PER_CHUNK) * CHUNK_HEIGHT;

                return (
                  <div
                    key={`${event.eventName}-${index}`}
                    className={`absolute p-2 rounded bg-gray-900 border border-gray-700 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors`}
                    onClick={() => setSelectedEvent(event)}
                    style={{
                      top: `${topPosition + chunkOffset}px`,
                      left: `${8 + (event.column || 0) * (eventWidth + EVENT_GAP)}px`,
                      width: `${eventWidth}px`,
                      height: `${eventHeight}px`,
                    }}
                  >
                    <div className="h-full [writing-mode:vertical-rl] whitespace-normal flex items-center justify-center gap-1 sm:gap-2 p-1 sm:p-2">
                      <span className="text-sm sm:text-base font-medium -rotate-180">
                        <span className="text-[10px] sm:text-sm">{event.eventName}</span>
                        <span className="text-[8px] sm:text-xs text-gray-400">
                          {event.totalDays > 1 && ` - (Day ${event.dayIndex}/${event.totalDays})`}
                        </span>
                      </span>
                      {event.logo?.[0]?.url && (
                        <Image
                          src={event.logo[0].url}
                          alt=""
                          className="w-[25px] h-[25px] sm:w-[40px] sm:h-[40px] object-contain rounded -rotate-90 mt-1"
                          width={40}
                          height={40}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-2 top-2 z-10 p-2 hover:bg-gray-800/50 rounded-full transition-colors sm:hidden"
            >
              <IoClose className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
            <EventCard
              event={{
                ...selectedEvent,
                startDate: selectedEvent.startDate.toISOString(),
                endDate: selectedEvent.endDate.toISOString(),
                startTime: selectedEvent.startTime,
                endTime: selectedEvent.endTime,
                currentDate: selectedEvent.currentDate,
              }}
              uncollapsible={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Schedule;
