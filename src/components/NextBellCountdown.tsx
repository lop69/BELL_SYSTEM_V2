import { useState, useEffect } from 'react';
import { differenceInMilliseconds } from 'date-fns';
import React from 'react';

interface NextBellCountdownProps {
  nextBellTime: Date | null;
}

const NextBellCountdown = React.memo(({ nextBellTime }: NextBellCountdownProps) => {
  const [countdown, setCountdown] = useState('00:00:00');

  useEffect(() => {
    if (!nextBellTime) {
      setCountdown('00:00:00');
      return;
    }

    const timerId = setInterval(() => {
      const now = new Date();
      const diff = differenceInMilliseconds(nextBellTime, now);

      if (diff > 0) {
        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff / 60000) % 60).toString().padStart(2, '0');
        const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
        setCountdown(`${hours}:${minutes}:${seconds}`);
      } else {
        setCountdown('00:00:00');
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [nextBellTime]);

  return (
    <p className="text-3xl font-bold text-primary tracking-tight">
      {countdown}
    </p>
  );
});

export default NextBellCountdown;