import { useState, useEffect } from "react";
import type { Countdown } from "../types";

export function useCountdown(
  broadcast: any,
  setCountdownFinished: (finished: boolean) => void
) {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    if (broadcast?.hasCountdown && broadcast?.countdownEndDate) {
      const endDate = new Date(broadcast.countdownEndDate).getTime();

      const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = endDate - now;

        if (distance < 0) {
          setCountdown(null);
          setCountdownFinished(true);
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [broadcast, setCountdownFinished]);

  return countdown;
}

