import { FC, useState, useEffect } from "react";
import Event from "../../components/Event";
import { IoClose } from "react-icons/io5";
import Image from "next/image";
import { BerlinDate } from "@/utils/BerlinDate";

export interface EventType {
  eventName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  organizer: string;
  description: string;
  eventTypes: ("Conference" | "Hackathon" | "Meetup" | "Party" | "Coworking" | "Happy Hour" | "Other")[];
  venue: string;
  venueAddress: string;
  venueLink?: string;
  eventLink: string;
  chatLink?: string;
  chatPlatform?: "Matrix" | "Telegram" | "Discord" | "Signal" | "Other";
  logo: { url: string; filename: string }[] | null;
  dailySchedule: { startTime: string | null; endTime: string | null }[];
  submissionTime?: string;
}

export interface ProcessedEvent extends Omit<EventType, "startDate" | "endDate"> {
  startDate: BerlinDate;
  endDate: BerlinDate;
  dayIndex: number;
  totalDays: number;
  currentDate: string;
  startTime: string;
  endTime: string;
  column?: number;
  isNextDayEvent: boolean;
}

interface ScheduleProps {
  events: EventType[];
}

const START_DATE = new BerlinDate("2025-06-07");
const END_DATE = new BerlinDate("2025-06-22");
const DAY_START_HOUR = 6; // Start at 6am
const MINUTES_PER_CHUNK = 15;
const CHUNK_HEIGHT = 10; // height in pixels for each 15-min chunk
const HOURS_PER_DAY = 18; // Display 18 hours (6am to midnight)
const MINUTES_PER_DAY = HOURS_PER_DAY * 60;
const CHUNKS_PER_DAY = MINUTES_PER_DAY / MINUTES_PER_CHUNK;
const TOTAL_DAYS = Math.ceil((END_DATE.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)) + 1;
// const TIMELINE_HEIGHT = TOTAL_DAYS * CHUNKS_PER_DAY * CHUNK_HEIGHT;

const Schedule: FC<ScheduleProps> = ({ events }) => {
  const [eventWidth, setEventWidth] = useState(window.innerWidth < 640 ? 50 : 100);
  const [selectedEvent, setSelectedEvent] = useState<ProcessedEvent | null>(null);
  const [eventGap, setEventGap] = useState(4);
  const [currentTime, setCurrentTime] = useState(() => new BerlinDate(Date.now()));

  useEffect(() => {
    setEventWidth(window.innerWidth < 640 ? 50 : 100);
    setEventGap(window.innerWidth < 640 ? 4 : 8);

    const handleResize = () => {
      setEventWidth(window.innerWidth < 640 ? 50 : 100);
      setEventGap(window.innerWidth < 640 ? 4 : 8);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new BerlinDate(Date.now()));
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Scroll to "Now" indicator when component loads
    const scrollToNow = () => {
      const nowIndicator = document.getElementById("now-indicator");
      if (nowIndicator) {
        nowIndicator.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };

    // Delay scroll to ensure the component is fully rendered
    const timeoutId = setTimeout(scrollToNow, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Helper function to check if end time is on the next day
  const isNextDayEvent = (startTime: string, endTime: string) => {
    const [startHour] = startTime.split(":").map(Number);
    const [endHour] = endTime.split(":").map(Number);
    return endHour < startHour;
  };
  // Split multi-day events into separate day events
  const splitEvents = events.flatMap((event) => {
    const startDate = new BerlinDate(event.startDate);
    const endDate = new BerlinDate(event.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return Array.from({ length: days }, (_, index) => {
      const currentDate = BerlinDate.from(startDate);
      currentDate.setDate(currentDate.getDate() + index);

      // Get the start and end times for this day from dailySchedule
      const daySchedule = event.dailySchedule[index];
      let startTime = daySchedule?.startTime || "06:00";
      let endTime = daySchedule?.endTime || "23:59";

      // If this is a next-day event
      if (isNextDayEvent(startTime, endTime)) {
        if (index === 0) {
          // First day: keep start time, end at midnight
          endTime = "23:59";
        } else if (index === 1) {
          // Second day: start at midnight, keep end time
          startTime = "00:00";
        }
      }

      return {
        ...event,
        dayIndex: index + 1,
        totalDays: days,
        currentDate: currentDate.toISOString(),
        startTime,
        endTime,
        isNextDayEvent: isNextDayEvent(startTime, endTime),
      };
    });
  });

  // Function to check if two events overlap
  const eventsOverlap = (a: ProcessedEvent, b: ProcessedEvent) => {
    if (a.currentDate !== b.currentDate) return false;

    const aStart = new BerlinDate(`${a.currentDate.split("T")[0]}T${a.startTime}`);
    const aEnd = new BerlinDate(`${a.currentDate.split("T")[0]}T${a.endTime}`);
    const bStart = new BerlinDate(`${b.currentDate.split("T")[0]}T${b.startTime}`);
    const bEnd = new BerlinDate(`${b.currentDate.split("T")[0]}T${b.endTime}`);

    return aStart < bEnd && aEnd > bStart;
  };

  // Convert to ProcessedEvent
  const processedEvents: ProcessedEvent[] = splitEvents.map((event) => ({
    ...event,
    startDate: new BerlinDate(event.startDate),
    endDate: new BerlinDate(event.endDate),
  })) as ProcessedEvent[];

  // Sort events by start time and duration (longer events first)
  processedEvents.sort((a, b) => {
    // Only sort by date to preserve original order within each day
    return new BerlinDate(a.currentDate).getTime() - new BerlinDate(b.currentDate).getTime();
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

  // Find max column to calculate width
  const maxColumn = Math.max(...processedEvents.map((event) => event.column || 0));
  const totalWidth = (maxColumn + 2) * (eventWidth + eventGap);

  return (
    <>
      {/* Floating Navigation Menu */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 bg-black/50 rounded-lg z-20 py-4 max-h-screen overflow-y-auto">
        {Array.from({ length: TOTAL_DAYS }).map((_, dayIndex) => {
          const date = BerlinDate.from(START_DATE);
          date.setDate(date.getDate() + dayIndex);
          const day = date.toLocaleDateString("en-US", { day: "numeric" });
          const weekday = date.toLocaleDateString("en-US", { weekday: "short" });

          // Check if this day is in the past
          const endOfDay = new BerlinDate(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
          const isPastDay = currentTime > endOfDay;

          return (
            <a
              key={dayIndex}
              href={`#date-${date.toISOString().split("T")[0]}`}
              className={`block text-gray-300 hover:text-red-500 text-base transition-all hover:font-medium px-2 md:pr-4 py-[0.35rem] bg-slate-800 bg-opacity-50 ${
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

      <div className="-ml-2 md:-ml-0 overflow-x-auto mr-8 md:mr-24">
        <div className="flex" style={{ width: `${totalWidth}px` }}>
          {/* Date and time labels */}
          <div className="w-12 flex-shrink-0 bg-black h-full">
            {Array.from({ length: TOTAL_DAYS }).map((_, dayIndex) => {
              const date = BerlinDate.from(START_DATE);
              date.setDate(date.getDate() + dayIndex);
              return (
                <div
                  key={dayIndex}
                  id={`date-${date.toISOString().split("T")[0]}`}
                  style={{ height: `${CHUNKS_PER_DAY * CHUNK_HEIGHT}px` }}
                  className="relative scroll-mt-24"
                />
              );
            })}
          </div>

          {/* Timeline */}
          <div className="flex-grow relative border-l border-gray-800">
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

            {/* Current time indicator */}
            {(() => {
              const daysSinceStart = Math.floor((currentTime.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));

              // Only show if current date is within the schedule range
              if (daysSinceStart < 0 || daysSinceStart >= TOTAL_DAYS) return null;

              const currentHour = currentTime.getHours();
              const currentMinute = currentTime.getMinutes();

              // Only show if within display hours (6am to midnight)
              if (currentHour < DAY_START_HOUR) return null;

              // Round to nearest 15-minute chunk
              const roundedMinute = Math.round(currentMinute / MINUTES_PER_CHUNK) * MINUTES_PER_CHUNK;
              const adjustedHour = currentHour + Math.floor(roundedMinute / 60);
              const finalMinute = roundedMinute % 60;

              // Calculate position
              const minutesSinceDayStart = (adjustedHour - DAY_START_HOUR) * 60 + finalMinute;
              const chunkIndex = Math.floor(minutesSinceDayStart / MINUTES_PER_CHUNK);
              const topPosition = (daysSinceStart * CHUNKS_PER_DAY + chunkIndex) * CHUNK_HEIGHT;

              return (
                <div
                  id="now-indicator"
                  className="absolute w-full border-t-2 border-red-500 z-30 animate-pulse"
                  style={{
                    top: `${topPosition}px`,
                    boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)",
                  }}
                >
                  <div className="absolute left-2 -top-6 bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">
                    Now
                  </div>
                </div>
              );
            })()}

            {/* Left Hour labels */}
            <div className="left-0 top-0 bottom-0 sticky z-50 bg-black w-8 md:w-10 -ml-10 sm:-ml-12 h-full">
              {Array.from({ length: TOTAL_DAYS }).map((_, dayIndex) =>
                Array.from({ length: HOURS_PER_DAY }).map((_, hour) => {
                  const date = BerlinDate.from(START_DATE);
                  date.setDate(date.getDate() + dayIndex);
                  const displayHour = hour + DAY_START_HOUR;

                  // Skip rendering some hours to avoid clutter
                  if (displayHour === 23 || displayHour === DAY_START_HOUR + 1) return null;

                  // Check if this hour is in the past
                  const hourTime = new BerlinDate(date.getFullYear(), date.getMonth(), date.getDate(), displayHour, 0);
                  const isPastHour = currentTime > hourTime;

                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`absolute text-[9px] sm:text-xs text-gray-500 bg-black ${
                        isPastHour ? "opacity-30" : ""
                      }`}
                      style={{
                        top: `${(dayIndex * CHUNKS_PER_DAY + hour * 4) * CHUNK_HEIGHT}px`,
                        transform: "translateY(-50%)",
                      }}
                    >
                      {hour === 0 ? (
                        <span className={`flex flex-col ${dayIndex === 0 ? "mt-16" : ""}`}>
                          <span className="text-gray-400 text-[9px] sm:text-xs">
                            {date.toLocaleDateString("en-US", { weekday: "short" })}
                          </span>
                          <span className="font-bold text-white text-sm sm:text-xl -mt-1">
                            {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </span>
                      ) : (
                        `${displayHour.toString().padStart(2, "0")}:00`
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Events */}
            {processedEvents.map((event, index) => {
              const eventDate = new BerlinDate(event.currentDate);
              const daysSinceStart = Math.floor((eventDate.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));
              const topPosition = daysSinceStart * CHUNKS_PER_DAY * CHUNK_HEIGHT;

              // Calculate position based on time
              const [hours, minutes] = event.startTime.split(":").map(Number);
              const [endHours, endMinutes] = event.endTime.split(":").map(Number);

              // Adjust for 6am start
              const minutesSinceDayStart = (hours - DAY_START_HOUR) * 60 + minutes;
              const endMinutesSinceDayStart = isNextDayEvent(event.startTime, event.endTime)
                ? (endHours + 24 - DAY_START_HOUR) * 60 + endMinutes
                : (endHours - DAY_START_HOUR) * 60 + endMinutes;

              const durationInMinutes = endMinutesSinceDayStart - minutesSinceDayStart;

              const chunkOffset = Math.floor(minutesSinceDayStart / MINUTES_PER_CHUNK) * CHUNK_HEIGHT;
              const eventHeight = Math.floor(durationInMinutes / MINUTES_PER_CHUNK) * CHUNK_HEIGHT;

              // Skip events that end before 6am.
              if (hours < DAY_START_HOUR && !event.isNextDayEvent) return null;

              // Check if event is past (using Berlin time)
              const eventEndTime = new BerlinDate(`${event.currentDate.split("T")[0]}T${event.endTime}:00`);
              const isPastEvent = currentTime > eventEndTime;

              return (
                <div
                  key={`${event.eventName}-${index}`}
                  className={`absolute p-2 rounded bg-gray-900 border border-gray-700 items-center justify-center cursor-pointer hover:border-primary-500 transition-colors ${
                    event.isNextDayEvent ? "border-primary-500" : ""
                  } ${isPastEvent ? "opacity-30" : ""}`}
                  onClick={() => setSelectedEvent(event)}
                  style={{
                    top: `${topPosition + chunkOffset + 1.5}px`,
                    left: `${8 + (event.column || 0) * (eventWidth + eventGap)}px`,
                    width: `${eventWidth}px `,
                    height: `${eventHeight - 3}px`,
                  }}
                >
                  {/* Flip event width and height here because we'll rotate the text */}
                  <div
                    className="p-2 flex items-center justify-center gap-2"
                    style={{
                      width: eventHeight,
                      height: eventWidth,
                      overflow: "visible",
                      transform: `rotate(-90deg) translate(-${eventHeight - 10}px, -10px)`,
                      // translateY(${eventHeight}px)
                      transformOrigin: "left top",
                    }}
                  >
                    {event.logo?.[0]?.url && (
                      <Image
                        src={event.logo[0].url}
                        alt=""
                        className={`object-contain rounded ${
                          event.eventName.length > 30
                            ? "w-[20px] h-[20px] sm:w-[30px] sm:h-[30px]"
                            : "w-[25px] h-[25px] sm:w-[40px] sm:h-[40px]"
                        }`}
                        width={40}
                        height={40}
                      />
                    )}
                    <span className="text-sm sm:text-base font-medium flex flex-row gap-1 items-center flex-wrap">
                      <span
                        className={`text-[10px] sm:text-sm line-clamp-2 ${
                          event.eventName.length > 30 ? "text-[8px] sm:text-xs" : ""
                        }`}
                      >
                        {event.eventName}{" "}
                        <span className="text-[8px] sm:text-xs text-gray-400">
                          {event.totalDays > 1 && ` - (Day ${event.dayIndex}/${event.totalDays})`}
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center px-4  z-50"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-2 top-2 z-10 p-2 hover:bg-gray-800/50 rounded-full transition-colors sm:hidden"
            >
              <IoClose className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
            <Event
              event={{
                ...selectedEvent,
                startDate: selectedEvent.startDate.toISOString(),
                endDate: selectedEvent.endDate.toISOString(),
                startTime: selectedEvent.startTime,
                endTime: selectedEvent.endTime === "23:59" ? "" : selectedEvent.endTime, // In the popup don't misleadingly show 23:59 as end time
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
