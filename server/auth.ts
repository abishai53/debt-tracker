import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import memorystore from 'memorystore';
import dotenv from 'dotenv';
import { configureAuthRoutes } from './auth-routes.ts';

// Load environment variables
dotenv.config({ path: '.env' });

// Constants
const MemoryStore = memorystore(session);
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Okta configuration
const oktaDomain = process.env.OKTA_DOMAIN;
const oktaIssuer = `https://${oktaDomain}/oauth2/default`;
const redirectUrl = `${process.env.APP_BASE_URL}/authorization-code/callback`;

// Interfaces
export interface User {
  id: string;
  displayName: string;
  email?: string;
}

declare module 'express-session' {
  interface SessionData {
    user?: User;
    isAuthenticated?: boolean;
    state?: string; // For OAuth state parameter
  }
}

/**
 * Configure Okta OAuth2 strategy for passport
 */
const setupOktaStrategy = (): void => {
  passport.use(
    new OAuth2Strategy(
      {
        authorizationURL: `${oktaIssuer}/v1/authorize`,
        tokenURL: `${oktaIssuer}/v1/token`,
        clientID: process.env.OKTA_CLIENT_ID!,
        clientSecret: process.env.OKTA_CLIENT_SECRET!,
        callbackURL: redirectUrl,
        scope: ['openid', 'profile', 'email'],
        state: true,
        passReqToCallback: true
      },
      async (req: Request, accessToken: string, refreshToken: string, params: any, profile: any, done: (error: any, user?: any) => void) => {
        try {
          const response = await fetch(`${oktaIssuer}/v1/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (!response.ok) {
            throw new Error(`User info fetch failed: ${response.status}`);
          }
          const userInfo = await response.json();
          const user: User = {
            id: userInfo.sub,
            displayName: userInfo.name || userInfo.preferred_username || userInfo.email,
            email: userInfo.email
          };
          return done(null, user);
        } catch (error) {
          console.error('OAuth userinfo fetch error:', error);
          return done(error);
        }
      }
    )
  );
  
  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));
};

/**
 * Configure Express app with authentication middleware
 */
export const configureAuth = (app: Express): void => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      resave: false, // Only save on changes
      saveUninitialized: false, // Don’t create empty sessions
      cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS in prod
        maxAge: SESSION_MAX_AGE,
        sameSite: 'lax',
        path: '/',
        httpOnly: true // Prevent XSS
      },
      store: new MemoryStore({ checkPeriod: SESSION_MAX_AGE })
    })
  );
  
  // Log session details for every request
  app.use((req, res, next) => {
    console.log('Request Path:', req.path);
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
    console.log('Cookies:', req.headers.cookie);
    next();
  });
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  // setupOktaStrategy();
  //configureAuthRoutes(app);
  
  app.get('/debug/auth-status', (req: Request, res: Response) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      sessionExists: !!req.session,
      sessionIsAuthenticated: req.session?.isAuthenticated,
      hasUser: !!req.user,
      user: req.user || null,
      sessionID: req.sessionID,
      cookies: req.headers.cookie
    });
  });
  
  // app.use('/api', ensureApiAuthenticated);
};

/**
 * Middleware to ensure user is authenticated
 */
export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated() || (req.session && req.session.isAuthenticated)) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

/**
 * Middleware for API routes
 */
export const ensureApiAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  const publicPaths = [''];
  if (publicPaths.includes(req.path)) return next();
  if (req.isAuthenticated() || (req.session && req.session.isAuthenticated)) return next();
  res.status(401).json({ error: 'Authentication required' });
};
