const CalendarStyles = () => (
  <style>{`
    .react-calendar {
      background: transparent !important;
      border: none !important;
      width: 100%;
      max-width: 100%;
      font-family: inherit;
      line-height: 1.5;
      color: white;
    }

    .react-calendar__navigation {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .react-calendar__navigation button {
      color: white;
      font-size: 1rem;
      min-width: 44px;
      background: none;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .react-calendar__navigation button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .react-calendar__tile {
      max-width: initial !important;
      padding: 0.75rem 0.5rem;
      background: none;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .react-calendar__tile:enabled:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .react-calendar__tile--now {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    }

    .react-calendar__month-view__days__day--weekend {
      color: #f87171; /* merah utk sabtu/minggu */
    }
  `}</style>
);

export default CalendarStyles;
