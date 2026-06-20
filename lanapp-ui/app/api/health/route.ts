import { NextResponse } from 'next/server';

/** Liveness probe for ALB/ECS — must return 200 only when the app process is up. */
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
