const ACTIVITY_UPDATE_FIELDS = new Set([
  'title', 'description', 'category', 'location', 'startTime', 'endTime',
  'maxParticipants', 'price', 'images', 'tags', 'status'
]);

const LOCKED_AFTER_ENROLLMENT = new Set([
  'startTime', 'endTime', 'maxParticipants', 'price'
]);

export const pickActivityUpdates = (input: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(input).filter(([key]) => ACTIVITY_UPDATE_FIELDS.has(key))
  );

export const hasLockedActivityUpdates = (input: Record<string, unknown>) =>
  Object.keys(input).some(key => LOCKED_AFTER_ENROLLMENT.has(key));
