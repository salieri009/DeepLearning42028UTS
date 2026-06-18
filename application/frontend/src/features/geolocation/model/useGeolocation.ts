import { useEffect, useState } from "react";

export type GeolocationStatus = "idle" | "loading" | "ready" | "denied";

export type GeolocationPosition = {
  lat: number;
  lng: number;
};

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("denied");
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setStatus("loading");

    const watchId = navigator.geolocation.watchPosition(
      (coords) => {
        setPosition({
          lat: coords.coords.latitude,
          lng: coords.coords.longitude,
        });
        setStatus("ready");
        setError(null);
      },
      (err) => {
        setStatus("denied");
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { position, status, error };
}
