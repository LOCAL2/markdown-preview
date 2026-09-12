import { NextResponse } from "next/server";
import { SAMPLE_TEMPLATES } from "@/app/templates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase();
  const id = searchParams.get("id");

  let templates = SAMPLE_TEMPLATES;

  if (id) {
    const single = templates.find((t) => t.id === id);
    if (!single) {
      return NextResponse.json(
        { error: `Template with ID '${id}' not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: single,
    });
  }

  if (search) {
    templates = templates.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.id.toLowerCase().includes(search)
    );
  }

  return NextResponse.json(
    {
      success: true,
      count: templates.length,
      data: templates,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
