import { useCallback, useState } from "react";
import type { Review } from "@/types";

const REPORTED_KEY = "probook_reported_reviews";
const BLOCKED_KEY = "probook_blocked_reviewers";

function load(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

function save(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    /* storage unavailable — the choice lasts for this session only */
  }
}

/** Reviews this device reported, and reviewers it blocked; both are hidden from the viewer. */
export function useReviewModeration() {
  const [reported, setReported] = useState<string[]>(() => load(REPORTED_KEY));
  const [blocked, setBlocked] = useState<string[]>(() => load(BLOCKED_KEY));

  const isHidden = useCallback(
    (review: Review) =>
      reported.includes(String(review.id)) || (!!review.author_key && blocked.includes(review.author_key)),
    [reported, blocked],
  );

  const markReported = useCallback((review: Review) => {
    setReported((prev) => {
      const next = [...new Set([...prev, String(review.id)])];
      save(REPORTED_KEY, next);
      return next;
    });
  }, []);

  const blockAuthor = useCallback((review: Review) => {
    if (!review.author_key) return;
    setBlocked((prev) => {
      const next = [...new Set([...prev, review.author_key as string])];
      save(BLOCKED_KEY, next);
      return next;
    });
  }, []);

  return { isHidden, markReported, blockAuthor };
}
