import React from "react";
import { FaUsers, FaLaptopCode, FaHandshake, FaGlassCheers, FaLaptop, FaBeer } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";

export const EVENT_TYPES = ["Conference", "Hackathon", "Meetup", "Party", "Coworking", "Happy Hour", "Other"] as const;

export type EventType = (typeof EVENT_TYPES)[number];

type BadgeConfig = {
  baseColor: string;
};

export const EVENT_TYPE_BADGES: Record<EventType, BadgeConfig> = {
  Conference: {
    baseColor: "blue",
  },
  Hackathon: {
    baseColor: "purple",
  },
  Meetup: {
    baseColor: "green",
  },
  Party: {
    baseColor: "pink",
  },
  Coworking: {
    baseColor: "yellow",
  },
  "Happy Hour": {
    baseColor: "orange",
  },
  Other: {
    baseColor: "gray",
  },
};

export const getEventIcon = (type: EventType) => {
  switch (type) {
    case "Conference":
      return <FaUsers className="w-4 h-4" />;
    case "Hackathon":
      return <FaLaptopCode className="w-4 h-4" />;
    case "Meetup":
      return <FaHandshake className="w-4 h-4" />;
    case "Party":
      return <FaGlassCheers className="w-4 h-4" />;
    case "Coworking":
      return <FaLaptop className="w-4 h-4" />;
    case "Happy Hour":
      return <FaBeer className="w-4 h-4" />;
    default:
      return <BsThreeDots className="w-4 h-4" />;
  }
};

export const EventTypeIcon = ({ type }: { type: EventType }) => {
  return <span>{getEventIcon(type)}</span>;
};

export const getBadgeClasses = (type: EventType) => {
  const badge = EVENT_TYPE_BADGES[type];
  return `bg-${badge.baseColor}-500/10 text-${badge.baseColor}-400 border-${badge.baseColor}-500/20`;
};
