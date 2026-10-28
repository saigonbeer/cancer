import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/requireRole';
import { prisma } from '@/lib/db';
import { reportSideEffect, getSideEffectReports } from '@/services/sideeffect.service';
import { MAX_PHOTO_BYTES, uploadSideEffectPhoto, validatePhoto, withPhotoUrls } from '@/lib/storage';

export async function GET() {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: auth.session.userId }
  });
  if (!profile) return NextResponse.json({ reports: [] });

  const reports = await getSideEffectReports({ patientId: profile.id });
  return NextResponse.json({ reports: await withPhotoUrls(reports) });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('PATIENT');
  if ('response' in auth) return auth.response;

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: auth.session.userId }
  });
  if (!profile) {
    return NextResponse.json({ error: 'Không tìm thấy hồ sơ bệnh nhân' }, { status: 404 });
  }

  const isForm = (req.headers.get('content-type') || '').includes('multipart/form-data');
  let fields: Record<string, string> = {};
  let photo: File | null = null;

  if (isForm) {
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });
    for (const [k, v] of form.entries()) {
      if (k === 'photo' && v instanceof File && v.size > 0) photo = v;
      else if (typeof v === 'string') fields[k] = v;
    }
  } else {
    const body = await req.json().catch(() => null);
    fields = body && typeof body === 'object' ? body : {};
  }

  if (!fields.symptom || !String(fields.symptom).trim()) {
    return NextResponse.json({ error: 'Vui lòng cung cấp triệu chứng' }, { status: 400 });
  }

  let photoPath: string | undefined;
  if (photo) {
    const problem = validatePhoto(photo);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    if (photo.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: 'Ảnh tối đa 5 MB.' }, { status: 400 });
    try {
      photoPath = await uploadSideEffectPhoto(profile.id, photo);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  try {
    const report = await reportSideEffect(
      {
        patientId: profile.id,
        symptom: fields.symptom,
        severity: fields.severity,
        site: fields.site,
        cycle: fields.cycle ? Number(fields.cycle) : undefined,
        note: fields.note,
        photoUrl: photoPath,
      },
      auth.session.role
    );
    const [withUrl] = await withPhotoUrls([report]);
    return NextResponse.json({ report: withUrl }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
