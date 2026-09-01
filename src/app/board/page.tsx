import { redirect } from "next/navigation";

// Board folded into Home under a Today | Board view-switcher. Keep the old URL
// working: /board now deep-links straight to the Board view of Home.
export default function BoardPage() {
  redirect("/?view=board");
}
