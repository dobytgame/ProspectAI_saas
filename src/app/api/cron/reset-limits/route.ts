import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";
import { assertCronAuthorized } from "@/lib/cron/verify-cron-request";

export async function GET(req: Request) {
  const denied = assertCronAuthorized(req);
  if (denied) return denied;

  const supabase = await createClient();

  // Call the database function to reset limits
  const { error } = await supabase.rpc('reset_monthly_leads');

  if (error) {
    console.error('Error resetting monthly leads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Monthly leads reset successfully' });
}
