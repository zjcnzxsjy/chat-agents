import { NextRequest, NextResponse } from "next/server";
import { proxyRequest } from "./proxy-request";
import { getTools } from "./utils";

export const runtime = "nodejs";

// Define handlers for all relevant HTTP methods
export async function GET(req: NextRequest) {
  return proxyRequest(req);
}

export async function POST(req: NextRequest) {
  const mcpConfig = await req.json()
  console.log('mcpConfig', mcpConfig)
  const res = await getTools(mcpConfig)
  return NextResponse.json(res)
}

// export async function PUT(req: NextRequest) {
//   return proxyRequest(req);
// }

// export async function PATCH(req: NextRequest) {
//   return proxyRequest(req);
// }

// export async function DELETE(req: NextRequest) {
//   return proxyRequest(req);
// }

// export async function HEAD(req: NextRequest) {
//   return proxyRequest(req);
// }

// export async function OPTIONS(req: NextRequest) {
//   // For OPTIONS, you might want to return specific CORS headers
//   // or simply proxy the request as well, depending on MCP server requirements.
//   // Basic proxying for now:
//   return proxyRequest(req);
// }
