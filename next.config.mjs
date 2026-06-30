/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sharp', 'nodemailer'],
  allowedDevOrigins: ['172.20.200.201']
};

export default nextConfig;
