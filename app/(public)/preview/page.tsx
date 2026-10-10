// preview page for newly created UI components

import Avatar from "@/components/Avatar";
import Skeleton from "@/components/Skeleton";

export default function PreviewPage() {
  return (
    <div className="page-content">
      <h2>Preview</h2>
      <div className="preview-grid">
        <Avatar name="mario" />
        <Avatar name="MarioRossi" />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </div>
  );
}
