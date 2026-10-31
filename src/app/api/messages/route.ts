import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import {
  getUserConversations, sendMessage, getOrCreateConversation,
  getConversationMessages, getDoctorChatablePatients, getPatientDoctors
} from '@/services/message.service';

export async function GET(req: NextRequest) {
  const auth = await requireRole('DOCTOR', 'PATIENT');
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('targetUserId');
  const conversationId = searchParams.get('conversationId');
  const action = searchParams.get('action');

  if (action === 'contacts') {
    if (auth.session.role === 'DOCTOR') {
      const patients = await getDoctorChatablePatients(auth.session.userId);
      return NextResponse.json({ contacts: patients });
    } else {
      const doctors = await getPatientDoctors(auth.session.userId);
      return NextResponse.json({ contacts: doctors });
    }
  }

  if (conversationId) {
    try {
      const messages = await getConversationMessages(conversationId, auth.session.userId);
      return NextResponse.json({ messages });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
  }

  if (targetUserId) {
    try {
      const conv = await getOrCreateConversation(
        auth.session.role === 'PATIENT' ? auth.session.userId : targetUserId,
        auth.session.role === 'DOCTOR' ? auth.session.userId : targetUserId
      );
      return NextResponse.json({ conversation: conv });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
  }

  const conversations = await getUserConversations(auth.session.userId, auth.session.role);
  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('DOCTOR', 'PATIENT');
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.conversationId || !body.content) {
    return NextResponse.json({ error: 'Thiếu dữ liệu tin nhắn.' }, { status: 400 });
  }

  try {
    const message = await sendMessage(body.conversationId, auth.session.userId, body.content, auth.session.role);
    return NextResponse.json({ message }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
