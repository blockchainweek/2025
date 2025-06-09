import { FC, useState } from "react";
import ReactMarkdown from "react-markdown";
import { EventType } from "../app/views/Schedule";
import { FaDiscord, FaTelegram, FaLink, FaMapMarkerAlt } from "react-icons/fa";
import { SiMatrix, SiSignal } from "react-icons/si";
import { BsChatDots } from "react-icons/bs";
import { LuCalendarPlus } from "react-icons/lu";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { EventTypeIcon, getBadgeClasses } from "@/constants/eventTypes";
import Image from "next/image";
import { BerlinDate } from "@/utils/BerlinDate";

interface EventProps {
  event: EventType & {
    dayIndex?: number;
    totalDays?: number;
    startTime?: string;
    endTime?: string;
    currentDate: string;
    dateDisplay?: string;
  };
  uncollapsible?: boolean;
  listView?: boolean;
  hideCalendar?: boolean;
  className?: string;
}

const generateGoogleCalendarLink = (event: EventProps["event"]) => {
  const dateStr = event.currentDate.split("T")[0];
  const startDateTime = `${dateStr}T${event.startTime}:00`;
  const endDateTime = `${dateStr}T${event.endTime}:00`;
  const timeZone = "Europe/Berlin"; // Using Berlin timezone since all events are in Berlin

  const details = [
    event.description,
    event.venue ? `Venue: ${event.venue}` : "",
    event.venueAddress ? `Address: ${event.venueAddress}` : "",
    event.venueLink ? `Venue Link: ${event.venueLink}` : "",
    `Event Type: ${event.eventTypes.join(", ")}`,
    event.organizer ? `Organizer: ${event.organizer}` : "",
  ]
    .filter(Boolean)
    .join("\\n\\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text:
      event.eventName + (event.totalDays && event.totalDays > 1 ? ` (Day ${event.dayIndex}/${event.totalDays})` : ""),
    details,
    location: event.venueAddress || event.venue || "",
    dates: `${startDateTime}/${endDateTime}`.replace(/[-:]/g, ""),
    ctz: timeZone, // Add timezone parameter
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const Event: FC<EventProps> = ({
  event,
  uncollapsible = false,
  listView = false,
  hideCalendar = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(uncollapsible);

  const getChatIcon = () => {
    switch (event.chatPlatform) {
      case "Discord":
        return <FaDiscord className="w-4 h-4" />;
      case "Telegram":
        return <FaTelegram className="w-4 h-4" />;
      case "Matrix":
        return <SiMatrix className="w-4 h-4" />;
      case "Signal":
        return <SiSignal className="w-4 h-4" />;
      default:
        return <BsChatDots className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`bg-gray-900 rounded-lg p-4 sm:p-6 border border-gray-800 hover:border-gray-700 transition-colors ${
        uncollapsible ? "" : "cursor-pointer"
      } ${className}`}
      onClick={() => !uncollapsible && setIsExpanded(!isExpanded)}
    >
      <div>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Logo Section */}
          {event.logo?.[0]?.url && (
            <div className="flex justify-center sm:justify-start">
              <Image
                src={event.logo[0].url}
                alt=""
                className={`object-contain rounded ${
                  listView ? "w-16 h-16 sm:w-24 sm:h-24" : "w-16 h-16 sm:w-16 sm:h-16 "
                }`}
                width={listView ? 128 : 96}
                height={listView ? 128 : 96}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Header Section - Always visible */}
            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 text-center sm:text-left items-center sm:items-start">
              <div className="flex flex-col items-center sm:items-start gap-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-white ${listView ? "text-2xl" : "text-xl"}`}>
                    {event.eventName}
                    {event.totalDays && event.totalDays > 1 && !listView && (
                      <span className="hidden sm:inline ml-2 text-sm text-gray-400">
                        Day {event.dayIndex}/{event.totalDays}
                      </span>
                    )}
                  </h3>
                  {!uncollapsible &&
                    (isExpanded ? (
                      <IoChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <IoChevronDown className="w-5 h-5 text-gray-400" />
                    ))}
                </div>
                {event.totalDays && event.totalDays > 1 && !listView && (
                  <div className="sm:hidden ml-2 text-sm text-gray-400">
                    Day {event.dayIndex}/{event.totalDays}
                  </div>
                )}
                {!listView && (
                  <div className="mt-1 flex justify-center sm:justify-start flex-wrap gap-1">
                    {event.eventTypes.map((type) => (
                      <span
                        key={type}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeClasses(
                          type
                        )}`}
                      >
                        <EventTypeIcon type={type} />
                        <span className="ml-1">{type}</span>
                      </span>
                    ))}
                  </div>
                )}
                {/* Daily schedule display */}
                {listView && event.dailySchedule && event.dailySchedule.length > 0 && (
                  <div className="mt-2 text-sm text-gray-400 prose prose-invert prose-sm max-w-none">
                    {event.dailySchedule.slice(0, event.totalDays).map((day, index) => {
                      // Create a new date by adding index days to the current date
                      const dayDate = new BerlinDate(event.currentDate);
                      dayDate.setDate(dayDate.getDate() + index);

                      return (
                        <div key={index} className="flex items-center gap-2 mb-1">
                          <span>
                            {dayDate.getDate()}{" "}
                            {dayDate.toLocaleDateString("en-US", {
                              month: "long",
                            })}
                            ,{" "}
                            {dayDate.toLocaleDateString("en-US", {
                              weekday: "short",
                            })}
                            {event.totalDays && event.totalDays > 1 ? ` (Day ${index + 1}/${event.totalDays})` : ""}:
                          </span>
                          <span>
                            {day.startTime} - {day.endTime}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Only show time on the right for non-list views */}
              {listView ? (
                <div className="flex flex-col items-center gap-1 shrink-0">
                  {event.eventTypes.map((type) => (
                    <span
                      key={type}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeClasses(
                        type
                      )}`}
                    >
                      <EventTypeIcon type={type} />
                      <span className="ml-1">{type}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center sm:items-end shrink-0">
                  <div className="text-lg text-gray-400">
                    {event.startTime} - {event.endTime}
                  </div>
                  {uncollapsible && (
                    <div className="text-sm text-gray-500">
                      {new BerlinDate(event.currentDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-4">
          {/* Description Section */}
          <div className="mt-2 text-gray-400 prose prose-invert prose-sm max-w-none max-h-[200px] overflow-y-auto">
            <ReactMarkdown>{event.description}</ReactMarkdown>
          </div>

          {/* Venue Section */}
          {event.venue && (
            <div className="mt-4">
              <div className="flex items-center text-gray-500">
                <FaMapMarkerAlt className="w-4 h-4 mr-1 shrink-0" />
                {event.venueLink ? (
                  <a
                    href={event.venueLink?.startsWith("http") ? event.venueLink : `https://${event.venueLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-300 transition-colors truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {event.venue}
                  </a>
                ) : (
                  <span className="truncate">{event.venue}</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons Section */}
          <div
            className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a
                href={event.eventLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-md transition-colors"
              >
                <FaLink className="w-4 h-4" />
                Event Link
              </a>
              {!hideCalendar && (
                <a
                  href={generateGoogleCalendarLink(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
                >
                  <LuCalendarPlus className="w-4 h-4" />
                  Add to Calendar
                </a>
              )}
            </div>
            {event.chatLink && (
              <a
                href={event.chatLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
              >
                {getChatIcon()}
                Join Chat
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Event;
