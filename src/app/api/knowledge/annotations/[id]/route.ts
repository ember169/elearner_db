import { NextRequest, NextResponse } from "next/server";
import { deleteAnnotation } from "@/lib/knowledge/store";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await params;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  deleteAnnotation(id);
  return NextResponse.json({ ok: true });
}
