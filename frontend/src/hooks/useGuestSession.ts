import { useState, useCallback } from "react";
import type { BookingConfirmation } from "@/types";

interface GuestProfile {
  name: string;
  phone: string;
  email: string;
}

const PROFILE_KEY = "probook_guest_profile";
const BOOKINGS_KEY = "probook_guest_bookings";

function readProfile(): GuestProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readBookings(): BookingConfirmation[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useGuestSession() {
  const [guestProfile, setGuestProfileState] = useState<GuestProfile | null>(readProfile);
  const [guestBookings, setGuestBookingsState] = useState<BookingConfirmation[]>(readBookings);

  const setGuestProfile = useCallback((profile: GuestProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setGuestProfileState(profile);
  }, []);

  const addGuestBooking = useCallback((booking: BookingConfirmation) => {
    setGuestBookingsState((prev) => {
      const updated = [booking, ...prev.filter((b) => b.session_id !== booking.session_id)];
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearGuestSession = useCallback(() => {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(BOOKINGS_KEY);
    setGuestProfileState(null);
    setGuestBookingsState([]);
  }, []);

  return { guestProfile, setGuestProfile, guestBookings, addGuestBooking, clearGuestSession };
}
