import { FC, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Event } from "./Schedule";
import { FaDiscord, FaTelegram, FaLink, FaMapMarkerAlt } from "react-icons/fa";
import { SiMatrix, SiSignal } from "react-icons/si";
import { BsChatDots } from "react-icons/bs";
import { LuCalendarPlus } from "react-icons/lu";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { EventTypeIcon, getBadgeClasses } from "@/constants/eventTypes";
import Image from "next/image";

interface EventCardProps {
  event: Event & {
    dayIndex?: number;
    totalDays?: number;
    startTime: string;
    endTime: string;
    currentDate: string;
  };
  uncollapsible?: boolean;
  onClose?: () => void;
}

const generateGoogleCalendarLink = (event: EventCardProps["event"]) => {
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

const EventCard: FC<EventCardProps> = ({ event, uncollapsible = false }) => {
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
      }`}
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
                className="w-24 h-24 sm:w-16 sm:h-16 object-contain rounded"
                width={96}
                height={96}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Header Section - Always visible */}
            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 text-center sm:text-left items-center sm:items-start">
              <div className="flex flex-col items-center sm:items-start gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">
                    {event.eventName}
                    {event.totalDays && event.totalDays > 1 && (
                      <span className="ml-2 text-sm text-gray-400">
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
                <div className="mt-1 flex flex-wrap gap-1">
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
              </div>
              <div className="flex flex-col items-center sm:items-end shrink-0">
                <div className="text-lg text-gray-400">
                  {event.startTime} - {event.endTime}
                </div>
                {uncollapsible && (
                  <div className="text-sm text-gray-500">
                    {new Date(event.currentDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-4">
          {/* Description Section */}
          <div className="mt-2 text-gray-400 prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{event.description}</ReactMarkdown>
          </div>

          {/* Venue Section */}
          {event.venue && (
            <div className="mt-4">
              <div className="flex items-center text-gray-500">
                <FaMapMarkerAlt className="w-4 h-4 mr-1 shrink-0" />
                {event.venueLink ? (
                  <a
                    href={event.venueLink}
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
              <a
                href={generateGoogleCalendarLink(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
              >
                <LuCalendarPlus className="w-4 h-4" />
                Add to Calendar
              </a>
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

export default EventCard;
