import { NextResponse } from "next/server";

import { getModelCatalog } from "@/lib/artificial-analysis";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await getModelCatalog();

  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
