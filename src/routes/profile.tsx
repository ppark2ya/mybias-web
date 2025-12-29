import { createFileRoute } from "@tanstack/react-router";
import { Profile } from "../components/Profile/Profile";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return <Profile />;
}

export default ProfilePage;
