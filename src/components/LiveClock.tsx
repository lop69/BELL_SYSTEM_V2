import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import React from 'react';

const LiveClock = React.memo(() => {
  const [time, setTime] = useState(new Date());
  const timeZone = "Asia/Kolkata";

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <p className="text-5xl font-bold text-primary tracking-tight">
      {formatInTimeZone(time, timeZone, 'HH:mm:ss')}
    </p>
  );
});

export default LiveClock;