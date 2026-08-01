export function getNextHalfHourBoundary(now: Date): Date {
  const next = new Date(now.getTime());

  if (now.getMinutes() < 30) {
    next.setMinutes(30, 0, 0);
  } else {
    next.setHours(now.getHours() + 1, 0, 0, 0);
  }

  return next;
}

export function millisecondsUntilNextHalfHour(now: Date): number {
  return Math.max(0, getNextHalfHourBoundary(now).getTime() - now.getTime());
}
