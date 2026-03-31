import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db.js';
import { getAuthUser, attachAuthCookie } from '../../../../../lib/auth.js';
import { employeeService } from '../../../../../services/employee.service.js';

export async function POST(request) {
  try {
    await connectDB();
    const { user, newToken } = await getAuthUser(request);

    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ message: 'Brak pliku' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { message: 'Dozwolone tylko pliki graficzne (jpg, png, webp)' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'Plik nie może przekraczać 5MB' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await employeeService.uploadAvatarBuffer(user._id, buffer);

    const response = NextResponse.json(result);
    attachAuthCookie(response, newToken);
    return response;
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
