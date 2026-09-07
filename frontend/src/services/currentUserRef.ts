/**
 * Decoupled holder for the logged-in user's id.
 *
 * Lets non-React modules (e.g. the in-memory mock landing store) stamp
 * `created_by` with the real user id WITHOUT importing the Redux store — a
 * direct store import from those modules creates a circular import
 * (store → landingSlice → … → store) that crashes on load.
 *
 * Set from getCurrentUser (userApi) whenever the user profile is (re)loaded.
 * TODO: Remove once the FastAPI list API returns `created_by` and the mock
 * landing store is deleted.
 */
let currentUserId = "";

export function setCurrentUserId(id: string) {
  currentUserId = id;
}

export function getCurrentUserId() {
  return currentUserId;
}
