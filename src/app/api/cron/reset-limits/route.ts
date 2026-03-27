import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Call the database function to reset limits
  const { error } = await supabase.rpc('reset_monthly_leads');

  if (error) {
    console.error('Error resetting monthly leads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: 'Monthly leads reset successfully' });
}
