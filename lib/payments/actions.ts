'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { payments, teams, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

const paymentSchema = z.object({
  cardNumber: z.string()
    .length(8, 'Card number must be exactly 8 digits')
    .regex(/^\d{8}$/, 'Card number must contain only digits'),
  cardHolderName: z.string().min(2, 'Card holder name is required'),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Expiry date must be in MM/YY format'),
  cvv: z.string().length(3, 'CVV must be 3 digits').regex(/^\d{3}$/, 'CVV must contain only digits'),
  billingAddress: z.string().min(5, 'Billing address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(3, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
  planName: z.string().min(1, 'Plan name is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
});

export async function processPayment(formData: FormData) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in?redirect=pricing');
  }

  // Get user's team
  const userTeam = await db
    .select({
      teamId: teamMembers.teamId,
    })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  if (userTeam.length === 0) {
    throw new Error('User is not associated with any team');
  }

  const data = {
    cardNumber: formData.get('cardNumber') as string,
    cardHolderName: formData.get('cardHolderName') as string,
    expiryDate: formData.get('expiryDate') as string,
    cvv: formData.get('cvv') as string,
    billingAddress: formData.get('billingAddress') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zipCode: formData.get('zipCode') as string,
    country: formData.get('country') as string,
    planName: formData.get('planName') as string,
    amount: Number(formData.get('amount')),
  };

  try {
    const validatedData = paymentSchema.parse(data);

    // Store payment information in database
    await db.insert(payments).values({
      teamId: userTeam[0].teamId,
      ...validatedData,
    });

    // Update team subscription status
    await db
      .update(teams)
      .set({
        planName: validatedData.planName,
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(teams.id, userTeam[0].teamId));

    redirect('/dashboard?payment=success');
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
}

export async function checkoutAction(formData: FormData) {
  const planName = formData.get('planName') as string;
  const amount = formData.get('amount') as string;
  
  redirect(`/pricing/checkout?plan=${encodeURIComponent(planName)}&amount=${amount}`);
}