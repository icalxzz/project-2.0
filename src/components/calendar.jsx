import React, { useState } from "react";
import styled from "styled-components";

// === Styled Components ===
const CalendarContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
  border-radius: 20px;
  color: white;
  width: 100%;
  max-width: 600px;
  margin: auto;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 10px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin-top: 15px;
`;

const DayHeader = styled.div`
  font-weight: bold;
  text-align: center;
`;

const Cell = styled.div`
  text-align: center;
  position: relative;
  padding: 5px 0;
  border-radius: 10px;
  background: ${(props) =>
    props.today ? "rgba(255,255,255,0.2)" : "transparent"};
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: block;
  margin: 3px auto 0;
  background: ${(props) =>
    props.type === "hadir"
      ? "#00e676"
      : props.type === "telat"
      ? "#ffeb3b"
      : props.type === "alpha"
      ? "#f44336"
      : props.type === "sakit"
      ? "#2196f3"
      : props.type === "izin"
      ? "#9c27b0"
      : "transparent"};
`;

const Legend = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 15px;

  span {
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
`;

// === Component ===
const CalendarAbsensi = ({ statusByDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const days = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);

    const firstDay = new Date(year, month, 1).getDay(); // 0 = Minggu
    const startDay = (firstDay + 6) % 7; // mulai dari Senin

    const calendarDays = [];
    for (let i = 0; i < startDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    return calendarDays;
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const today = new Date();

  return (
    <CalendarContainer>
      <Title>Kalender Kehadiran</Title>
      <Header>
        <button onClick={prevMonth}>&laquo;</button>
        <h3>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button onClick={nextMonth}>&raquo;</button>
      </Header>

      <Grid>
        {days.map((day, idx) => (
          <DayHeader key={idx}>{day}</DayHeader>
        ))}

        {generateCalendar().map((day, idx) => {
          if (!day) return <div key={idx}></div>;

          const year = currentDate.getFullYear();
          const month = currentDate.getMonth() + 1;

          // format tanggal agar sesuai dengan di RTDB
          const dateKey = `${year}-${month}-${day}`;
          const status = statusByDate?.[dateKey];

          const isToday =
            today.getDate() === day &&
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear();

          // 🚫 Skip Sabtu (6) & Minggu (0)
          const dayOfWeek = new Date(year, month - 1, day).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          return (
            <Cell key={idx} today={isToday}>
              <span>{day}</span>
              {!isWeekend && status && <Dot type={status} />}
            </Cell>
          );
        })}
      </Grid>

      <Legend>
        <span><Dot type="hadir" /> Hadir</span>
        <span><Dot type="telat" /> Telat</span>
        <span><Dot type="alpha" /> Alpha</span>
        <span><Dot type="sakit" /> Sakit</span>
        <span><Dot type="izin" /> Izin</span>
      </Legend>
    </CalendarContainer>
  );
};

export default CalendarAbsensi;
