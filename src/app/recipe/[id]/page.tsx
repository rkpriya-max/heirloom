import { redirect } from "next/navigation";

export default function OldRecipePage({ params }: { params: { id: string } }) {
  redirect(`/recipes/${params.id}`);
}
