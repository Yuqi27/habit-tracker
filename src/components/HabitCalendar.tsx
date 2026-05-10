"use client";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";

export default function HabitCalendar({ checkinDates, habitColor }) {
  const modifiers = {
    checked: checkinDates.map(d => new Date(d))
  };
  const modifiersStyles = {
    checked: { backgroundColor: habitColor, color: "white" }
  };
  return (
    <DayPicker
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      mode="single"
      selected={new Date()}
    />
  );
}