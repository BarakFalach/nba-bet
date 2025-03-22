// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.username === 'admin' && body.password === '1234') {
    const response = NextResponse.json({ success: true });
    response.cookies.set('authToken', 'secure_token_here', { httpOnly: true });
    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
