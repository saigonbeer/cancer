import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import type { Role } from '@/lib/auth';

export async function getOrCreateConversation(patientUserId: string, doctorUserId: string) {
  let conversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: patientUserId } } },
        { participants: { some: { userId: doctorUserId } } }
      ]
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, role: true } } } },
      messages: { orderBy: { createdAt: 'asc' } }
    }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: patientUserId }, { userId: doctorUserId }]
        }
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, role: true } } } },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });
  }

  return conversation;
}

export async function sendMessage(conversationId: string, senderId: string, content: string, role: Role) {
  await assertPermission('messages', role);

  return prisma.message.create({
    data: {
      conversationId,
      senderId,
      content
    },
    include: {
      sender: { select: { id: true, name: true, role: true } }
    }
  });
}

export async function getUserConversations(userId: string, role: Role) {
  await assertPermission('messages', role);

  return prisma.conversation.findMany({
    where: {
      participants: { some: { userId } }
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, role: true } } }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
