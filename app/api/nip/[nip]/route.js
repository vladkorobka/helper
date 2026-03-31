import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/db.js';
import { getAuthUser } from '../../../../lib/auth.js';

export async function GET(request, { params }) {
  try {
    const { nip: rawNip } = await params;
    await connectDB();
    await getAuthUser(request);

    const nip = rawNip.replace(/\D/g, '');
    if (nip.length !== 10) {
      return NextResponse.json(
        { message: 'NIP musi mieć dokładnie 10 cyfr' },
        { status: 400 }
      );
    }

    const GUS_API_KEY = process.env.GUS_API_KEY;
    if (!GUS_API_KEY) {
      return NextResponse.json(
        { message: 'Klucz GUS API nie jest skonfigurowany' },
        { status: 503 }
      );
    }

    const res = await fetch(
      `https://dataport.pl/api/v1/company/${nip}?format=simple`,
      {
        headers: { 'X-API-Key': GUS_API_KEY, Accept: 'application/json' },
      }
    );

    if (res.status === 404) {
      return NextResponse.json(
        { message: 'Nie znaleziono firmy dla podanego NIP' },
        { status: 404 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { message: `Błąd API GUS: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { message: err.message || 'Błąd serwera' },
      { status: err.status || err.statusCode || 500 }
    );
  }
}
