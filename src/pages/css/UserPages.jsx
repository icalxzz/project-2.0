export default function UserPageStyles() {
  return (
    <style>{`
      /* --- Kalender --- */
      .react-calendar {
        width: 100%;
        background: transparent;
        border: none;
        font-family: inherit;
        color: white;
      }

      .react-calendar__navigation button {
        color: white;
        min-width: 44px;
        background: none;
        font-size: 1rem;
        margin-top: 8px;
      }

      .react-calendar__tile {
        position: relative;
        display: flex;
        flex-direction: column; /* angka di atas, dot di bawah */
        align-items: center;
        justify-content: center;
        padding: 8px 0;
        color: white;
        background: none;
      }

      .react-calendar__tile--now {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
      }

      .react-calendar__tile--active {
        background: rgba(167, 139, 250, 0.4);
        border-radius: 8px;
      }

      /* Dot kecil di bawah angka */
      .calendar-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 3px;
        display: block;
      }

      /* Scrollbar Custom */
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.4);
      }

      /* Card Glow */
      .glow-card {
        transition: box-shadow 0.3s ease;
      }
      .glow-card:hover {
        box-shadow: 0 0 20px rgba(167, 139, 250, 0.6);
      }
    `}</style>
  );
}
