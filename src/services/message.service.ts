import { prisma } from '@/lib/db';
import { assertPermission } from '@/lib/rbac';
import type { Role } from '@/lib/auth';

export async function getOrCreateConversation(patientUserId: string, doctorUserId: string) {
  const docProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId }, select: { id: true } });
  if (!docProfile) throw new Error('Không tìm thấy hồ sơ bác sĩ.');

  const patProfile = await prisma.patientProfile.findUnique({ where: { userId: patientUserId }, select: { id: true, doctorId: true } });
  if (!patProfile) throw new Error('Không tìm thấy hồ sơ bệnh nhân.');

  const isTreating = patProfile.doctorId === docProfile.id;
  const hasVisit = !isTreating && await prisma.visit.findFirst({
    where: { patient: { userId: patientUserId }, doctorId: docProfile.id },
    select: { id: true }
  });
  if (!isTreating && !hasVisit) {
    throw new Error('Bác sĩ không có quan hệ điều trị với bệnh nhân này.');
  }

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

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } }
  });
  if (!participant) {
    throw new Error('Bạn không thuộc cuộc hội thoại này.');
  }

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
        take: 1,
        include: { sender: { select: { id: true, name: true, role: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getConversationMessages(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });
  if (!participant) throw new Error('Bạn không thuộc cuộc hội thoại này.');

  return prisma.message.findMany({
    where: { conversationId },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' }
  });
}

export async function getDoctorChatablePatients(doctorUserId: string) {
  const docProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId }, select: { id: true } });
  if (!docProfile) return [];

  const currentPatients = await prisma.patientProfile.findMany({
    where: { doctorId: docProfile.id },
    select: { userId: true, user: { select: { id: true, name: true } }, patientCode: true }
  });

  const visitPatients = await prisma.visit.findMany({
    where: { doctorId: docProfile.id },
    select: { patient: { select: { userId: true, user: { select: { id: true, name: true } }, patientCode: true } } },
    distinct: ['patientId']
  });

  const map = new Map<string, { userId: string; name: string; patientCode: string }>();
  for (const p of currentPatients) {
    map.set(p.userId, { userId: p.userId, name: p.user.name, patientCode: p.patientCode });
  }
  for (const v of visitPatients) {
    if (!map.has(v.patient.userId)) {
      map.set(v.patient.userId, { userId: v.patient.userId, name: v.patient.user.name, patientCode: v.patient.patientCode });
    }
  }
  return Array.from(map.values());
}

export async function getPatientDoctors(patientUserId: string) {
  const patProfile = await prisma.patientProfile.findUnique({
    where: { userId: patientUserId },
    select: {
      id: true,
      doctorId: true,
      doctor: { select: { id: true, userId: true, user: { select: { id: true, name: true } } } }
    }
  });
  if (!patProfile) return [];

  const visitDoctors = await prisma.visit.findMany({
    where: { patient: { userId: patientUserId }, doctorId: { not: null } },
    select: { doctor: { select: { id: true, userId: true, user: { select: { id: true, name: true } } } } },
    distinct: ['doctorId']
  });

  const map = new Map<string, { userId: string; name: string; isCurrent: boolean }>();
  if (patProfile.doctor) {
    map.set(patProfile.doctor.userId, { userId: patProfile.doctor.userId, name: patProfile.doctor.user.name, isCurrent: true });
  }
  for (const v of visitDoctors) {
    if (v.doctor && !map.has(v.doctor.userId)) {
      map.set(v.doctor.userId, { userId: v.doctor.userId, name: v.doctor.user.name, isCurrent: false });
    }
  }
  return Array.from(map.values());
}
