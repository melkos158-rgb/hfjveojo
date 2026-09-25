import { redirect } from "next/navigation";

/** Products are managed together with their tools. */
export default function AdminProducts() {
  redirect("/admin/tools");
}
