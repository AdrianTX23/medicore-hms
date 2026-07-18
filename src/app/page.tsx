import { redirect } from "next/navigation";

// The middleware sends unauthenticated visitors to /login.
export default function RootPage() {
  redirect("/dashboard");
}
