import ApiBase from "@/components/auth/apiBase";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export type UserDetails = {
  email: string;
  market: string;
  role: string;
  created_at: string;
  last_updated_at: string;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * TODO: GET user-tracking/user-details?email=<signed-in email>.
 * Keep the response fields email, market, role, created_at, last_updated_at
 * and store them on the user reducer. Activity logging reads market and role
 * from that stored response. Do not send created_at or last_updated_at on the
 * activity call.
 */
export async function getUserDetails(email: string): Promise<UserDetails> {
  const { data } = await ApiBase.get<Partial<UserDetails>>(
    API_ENDPOINTS.userDetails,
    { params: { email } },
  );

  return {
    email: asString(data?.email) || email,
    market: asString(data?.market),
    role: asString(data?.role),
    created_at: asString(data?.created_at),
    last_updated_at: asString(data?.last_updated_at),
  };
}
