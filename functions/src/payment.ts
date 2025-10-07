import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import axios from 'axios';
import cors from 'cors';
import * as crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const corsHandler = cors({ origin: true });

// Create payment
export const createPayment = functions.https.onRequest((req, res): void => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
      }

      let { email, amount, uid } = req.body as { email?: string; amount?: number | string; uid?: string };
      if (!email) {
        res.status(400).json({ success: false, error: 'Missing email' });
        return;
      }
      uid = uid || email;
      if (amount === undefined || amount === null || amount === '') {
        res.status(400).json({ success: false, error: 'Missing amount' });
        return;
      }

      const amountNumber = typeof amount === 'string' ? Number(amount) : amount;
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        res.status(400).json({ success: false, error: 'Invalid amount' });
        return;
      }

      const amountInKobo = Math.round(amountNumber * 100);

      const initResp = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        { email, amount: amountInKobo, metadata: { uid, email } },
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );

      const data = initResp.data;
      if (!data?.status) {
        throw new Error(data?.message || 'Paystack error');
      }

      const reference: string = data.data.reference;

      await db.collection('payments').doc(reference).set({
        reference,
        userId: uid,
        email,
        amountRequested: amountInKobo,
        currency: 'NGN',
        provider: 'paystack',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({ success: true, authorization_url: data.data.authorization_url, reference });
    } catch (err: any) {
      console.error('createPayment error:', err);
      res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  });
});

// Verify payment
export const verifyPayment = functions.https.onRequest((req, res): void => {
  corsHandler(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
      }

      const { reference, uid } = req.body as { reference?: string; uid?: string };
      if (!reference) {
        res.status(400).json({ success: false, error: 'Missing reference' });
        return;
      }

      const paymentDoc = await db.collection('payments').doc(reference).get();
      const existing = paymentDoc.exists ? (paymentDoc.data() as any) : {};
      const resolvedUid = uid || existing.userId || existing.email;

      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      });

      const paystack = response.data;
      if (!paystack?.status || paystack?.data?.status !== 'success') {
        throw new Error(paystack?.message || 'Payment not successful');
      }

      await db.collection('payments').doc(reference).set(
        {
          status: 'success',
          paystackReference: paystack.data.reference,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          amountPaid: paystack.data.amount,
          currency: paystack.data.currency,
          userId: resolvedUid,
          email: existing.email || paystack?.data?.customer?.email || resolvedUid,
        },
        { merge: true }
      );

      if (resolvedUid) {
        await db.collection('users').doc(resolvedUid).set({
          email: existing.email || paystack?.data?.customer?.email || resolvedUid,
          hasPaid: true,
          paymentStatus: true,
          lastPaymentReference: reference,
          lastPaidAt: admin.firestore.FieldValue.serverTimestamp(),
          points: 0,
          totalSessions: 0,
          totalSessionTime: 0,
          activeSession: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      res.status(200).json({ success: true, amount: paystack.data.amount, currency: paystack.data.currency });
    } catch (err: any) {
      console.error('verifyPayment error:', err);
      res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
  });
});

// Paystack webhook with signature verification
export const paystackWebhook = functions.https.onRequest(async (req, res): Promise<void> => {
  try {
    const signature = req.get('x-paystack-signature');
    const expected = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(req.rawBody).digest('hex');
    if (!signature || signature !== expected) {
      res.status(401).send('Invalid signature');
      return;
    }

    const event = req.body as any;
    if (event?.event === 'charge.success') {
      const reference: string = event.data.reference;
      const email: string | undefined = event?.data?.customer?.email;

      await db.collection('payments').doc(reference).set({
        status: 'success',
        webhookVerified: true,
        webhookVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        email,
      }, { merge: true });

      const paymentDoc = await db.collection('payments').doc(reference).get();
      const paymentData = paymentDoc.exists ? (paymentDoc.data() as any) : undefined;
      const userId: string | undefined = paymentData?.userId || paymentData?.uid || email;
      if (userId) {
        await db.collection('users').doc(userId).set({
          email: email || userId,
          hasPaid: true,
          paymentStatus: true,
          lastPaymentReference: reference,
          lastPaidAt: admin.firestore.FieldValue.serverTimestamp(),
          points: 0,
          totalSessions: 0,
          totalSessionTime: 0,
          activeSession: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }

    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).send('Error');
  }
});
