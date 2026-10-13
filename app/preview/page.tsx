// preview page for newly created UI components

import Avatar from "@/components/Avatar";
import AuthForm from "@/components/AuthForm";
import HeistCard from "@/components/HeistCard";
import HeistCardSkeleton from "@/components/HeistCardSkeleton";
import Skeleton from "@/components/Skeleton";
import UserStatus from "@/components/UserStatus";
import type { Heist } from "@/types/firestore";

const previewHeist: Heist = {
  id: "preview",
  createdAt: new Date(),
  title: "Swap the office plant with a convincing fake",
  description: "Preview only",
  createdBy: "u1",
  createdByCodename: "shadowfox",
  assignedTo: "u2",
  assignedToCodename: "quietowl",
  deadline: new Date("2099-12-05T17:00:00"),
  finalStatus: null,
};

export default function PreviewPage() {
  return (
    <div className="page-content">
      <h2>Preview</h2>
      <UserStatus />
      <h3>Heist cards</h3>
      <div className="preview-grid-3">
        <HeistCard heist={previewHeist} />
        <HeistCard
          heist={{
            ...previewHeist,
            title: "Overdue heist",
            deadline: new Date("2020-01-01T09:00:00"),
          }}
        />
        <HeistCard
          heist={{
            ...previewHeist,
            title:
              "An extremely long heist title that keeps going and going so it needs to be cut off after two lines",
          }}
        />
        <HeistCardSkeleton />
        <HeistCardSkeleton />
        <HeistCardSkeleton />
      </div>
      <div className="preview-grid">
        <Avatar name="mario" />
        <Avatar name="MarioRossi" />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <AuthForm mode="login" />
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
