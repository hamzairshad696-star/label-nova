import { permanentRedirect } from "next/navigation";

/** Public sign-up is closed. Old links and bookmarks land on the request-access page instead. */
export default function RegisterPage() {
  permanentRedirect("/request-access");
}
