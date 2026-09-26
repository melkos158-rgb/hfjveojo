/**
 * One-minute cookie the sign-in routes set on their redirect ("sign_up:google", "login:email") so the next page can
 * report the GA4 sign_up / login event. It carries no personal data and is deleted as soon as it is read.
 */
export const AUTH_EVENT_COOKIE = "orv_auth_evt";
