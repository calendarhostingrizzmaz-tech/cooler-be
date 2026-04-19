export const APP_NAME: string = process.env.APP_NAME || 'app';

export const port = parseInt(process.env.PORT, 10) || 8001;

export const globalPrefix = process.env.GLOBAL_PREFIX || 'api';

export const appName = process.env.APP_NAME || 'app';

export const isSwagger = process.env.SWAGGER_ENABLE;

export const swaggerPath = process.env.SWAGGER_PATH || 'docs';

export const isDev = process.env.NODE_ENV === 'development';

export const isTest = !!process.env.TEST;

export const jwtExpiry = process.env.JWT_EXPIRY;
