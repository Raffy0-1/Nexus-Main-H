export const validateEnv = () => {
  const requiredVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'FRONTEND_URL'
  ];

  const missingVars = requiredVars.filter(envVar => !process.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(
      `FATAL ERROR: Missing required environment variables: ${missingVars.join(
        ', '
      )}`
    );
  }
};
