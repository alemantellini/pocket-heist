// preview page for newly created UI components

import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import AuthForm from "@/components/AuthForm";
import ExpiredHeistCard from "@/components/ExpiredHeistCard";
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
      <h3>Badges</h3>
      <div className="preview-grid-3">
        <Badge>Active</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="error">Failed</Badge>
      </div>
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
      <h3>Expired heist cards</h3>
      <div className="preview-stack">
        <ExpiredHeistCard
          heist={{
            ...previewHeist,
            deadline: new Date("2020-01-01T09:00:00"),
            finalStatus: "success",
          }}
        />
        <ExpiredHeistCard
          heist={{
            ...previewHeist,
            title: "Jelly in the stapler",
            deadline: new Date("2020-01-02T09:00:00"),
            finalStatus: "failure",
          }}
        />
        <ExpiredHeistCard
          heist={{
            ...previewHeist,
            title: "Leave a mystery sticky note on someone's desk",
            deadline: new Date("2020-01-03T09:00:00"),
          }}
        />
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
