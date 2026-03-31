import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change_this_secret_in_production_min_64_chars'
);

export async function verifyTokenEdge(token) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload;
}
