import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { payments } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const user = await getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userPayments = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(10);

    return NextResponse.json(userPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}