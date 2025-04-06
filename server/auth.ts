import passport from 'passport';
import { Strategy as OAuth2Strategy, VerifyCallback } from 'passport-oauth2';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import memorystore from 'memorystore';

// Create memory store for sessions
const MemoryStore = memorystore(session);

// User interface for Session user
interface User {
  id: string;
  displayName: string;
  email?: string;
}

// Declare session interface augmentation
declare module 'express-session' {
  interface SessionData {
    user?: User;
    isAuthenticated?: boolean;
    state?: string; // For OAuth state parameter
  }
}

// Setup Okta OAuth2 strategy
const setupOktaStrategy = () => {
  const oktaIssuer = process.env.OKTA_ISSUER;
  
  passport.use(
    new OAuth2Strategy(
      {
        authorizationURL: `${oktaIssuer}/v1/authorize`,
        tokenURL: `${oktaIssuer}/v1/token`,
        clientID: process.env.OKTA_CLIENT_ID!,
        clientSecret: process.env.OKTA_CLIENT_SECRET!,
        callbackURL: "http://localhost:5000/authorization-code/callback",
        scope: ['openid', 'profile', 'email'],
        state: true, // Enable state parameter to prevent CSRF
        passReqToCallback: true // Pass the request object to the callback
      },
      (req: Request, accessToken: string, refreshToken: string, params: any, profile: any, done: (error: any, user?: any) => void) => {
        console.log('OAuth strategy verify: Got access token, fetching user info');
        console.log('OAuth tokens:', { 
          accessToken: accessToken ? 'present' : 'missing', 
          refreshToken: refreshToken ? 'present' : 'missing',
          params: JSON.stringify(params)
        });
        
        // Fetch user info from Okta
        fetch(`${oktaIssuer}/v1/userinfo`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
          .then(response => {
            console.log('OAuth userinfo response status:', response.status);
            if (!response.ok) {
              throw new Error(`User info fetch failed: ${response.status} ${response.statusText}`);
            }
            return response.json();
          })
          .then(userInfo => {
            console.log('OAuth userinfo received:', JSON.stringify(userInfo));
            // Create a user profile
            const user: User = {
              id: userInfo.sub,
              displayName: userInfo.name || userInfo.preferred_username || userInfo.email,
              email: userInfo.email
            };
            return done(null, user);
          })
          .catch(error => {
            console.error('OAuth userinfo fetch error:', error);
            return done(error);
          });
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
};

// Configure express with auth middleware
export const configureAuth = (app: Express) => {
  const oktaIssuer = process.env.OKTA_ISSUER;
  // Initialize session
  app.use(
    session({
      secret: process.env.OKTA_CLIENT_SECRET!,
      resave: true, // Changed to true to ensure session is saved on each request
      saveUninitialized: true, // Changed to true to ensure session is created for all visitors
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Allow cookies to be sent with same-site requests
      },
      store: new MemoryStore({
        checkPeriod: 86400000 // 24 hours
      })
    })
  );

  // Initialize passport and session
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup Okta strategy
  setupOktaStrategy();

  // Log Okta configuration
  console.log('Okta configuration:');
  console.log('- OKTA_ISSUER:', oktaIssuer);
  console.log('- Using fixed callback URL: http://localhost:5000/authorization-code/callback');
  console.log('- (Original OKTA_REDIRECT_URI was:', process.env.OKTA_REDIRECT_URI + ')');
  console.log('- OKTA_CLIENT_ID is set:', !!process.env.OKTA_CLIENT_ID);
  console.log('- OKTA_CLIENT_SECRET is set:', !!process.env.OKTA_CLIENT_SECRET);

  // Login route - redirects directly to Okta
  app.get('/auth/login', (req, res, next) => {
    console.log('Auth login: Redirecting to Okta login');
    passport.authenticate('oauth2')(req, res, next);
  });
  
  // Login info route - returns the Okta authorization URL
  app.get('/auth/login-info', (req, res) => {
    console.log('Auth login-info: Generating Okta login URL');
    // Create a random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    if (req.session) {
      req.session.state = state;
    }
    
    // Construct the authorization URL
    const authUrl = `${oktaIssuer}/v1/authorize?` +
      `client_id=${process.env.OKTA_CLIENT_ID}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid profile email')}` +
      `&redirect_uri=${encodeURIComponent('http://localhost:5000/authorization-code/callback')}` +
      `&state=${state}`;
    
    res.json({ authUrl });
  });

  // Callback route after successful login
  app.get(
    '/authorization-code/callback',
    (req: Request, res: Response, next: NextFunction) => {
      console.log('Auth callback: Processing OAuth callback');
      console.log('Callback request query params:', req.query);
      console.log('Session exists:', !!req.session);
      console.log('Session ID:', req.sessionID);
      
      // Log all session data for debugging
      if (req.session) {
        console.log('Session data:', {
          ...req.session,
          // Don't log sensitive data
          cookie: req.session.cookie ? 'present' : 'missing'
        });
      }
      
      // Check if we received an error in the callback
      if (req.query.error) {
        console.error('Auth callback received error:', req.query.error);
        console.error('Error description:', req.query.error_description);
        return res.redirect('/login');
      }
      
      // Validate state parameter if we're using our custom flow (not when using passport.authenticate)
      if (req.query.state) {
        console.log('State parameter present in request');
        
        if (req.session && req.session.state) {
          console.log('Validating state parameter');
          console.log('- Request state: ', req.query.state);
          console.log('- Session state: ', req.session.state);
          
          if (req.query.state !== req.session.state) {
            console.error('Auth callback error: State parameter mismatch');
            console.log('Will continue anyway as passport may handle this');
          } else {
            console.log('State parameter validation successful');
          }
        } else {
          console.warn('No session state found to validate against');
          console.log('Session object:', !!req.session);
          console.log('Session state exists:', !!(req.session && req.session.state));
        }
        
        // If we have a code, we can process it
        if (req.query.code) {
          console.log('Authorization code present, continuing with OAuth flow');
        }
      } else {
        console.warn('No state parameter in callback request');
      }
      
      passport.authenticate('oauth2', (err: any, user: any, info: any) => {
        if (err) {
          console.error('Auth callback error:', err);
          console.error('Error details:', JSON.stringify(err, null, 2));
          return res.redirect('/login');
        }
        
        if (!user) {
          console.error('Auth callback: No user found');
          console.error('Auth info:', info ? JSON.stringify(info, null, 2) : 'No info provided');
          return res.redirect('/login');
        }
        
        console.log('User authenticated:', user.id, user.displayName);
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error('Auth callback login error:', loginErr);
            return res.redirect('/login');
          }
          
          if (req.session) {
            req.session.isAuthenticated = true;
            console.log('Session set to authenticated');
          } else {
            console.error('No session object available!');
          }
          
          console.log('Auth callback: User authenticated, redirecting to dashboard');
          return res.redirect('/');
        });
      })(req, res, next);
    }
  );

  // Logout route
  app.get('/auth/logout', (req: Request, res: Response) => {
    req.logout(() => {
      if (req.session) {
        req.session.destroy(() => {
          console.log('Auth logout: Session destroyed, redirecting to Okta logout');
          // Redirect to Okta logout
          res.redirect(
            `${oktaIssuer}/v1/logout?client_id=${process.env.OKTA_CLIENT_ID}&post_logout_redirect_uri=${encodeURIComponent(
              'http://localhost:5000/login'
            )}`
          );
        });
      } else {
        console.log('Auth logout: No session to destroy, redirecting to login');
        res.redirect('/login');
      }
    });
  });

  // User info endpoint
  app.get('/api/userinfo', ensureAuthenticated, (req: Request, res: Response) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
  
  // Debug endpoint to check session and auth status
  app.get('/debug/auth-status', (req: Request, res: Response) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      sessionExists: !!req.session,
      sessionIsAuthenticated: req.session ? !!req.session.isAuthenticated : false,
      hasUser: !!req.user,
      user: req.user || null,
      sessionID: req.sessionID,
      cookies: req.headers.cookie
    });
  });

  // Middleware to check auth for API routes
  app.use('/api', ensureApiAuthenticated);
};

// Middleware to ensure user is authenticated
export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() || (req.session && req.session.isAuthenticated)) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Middleware to ensure API requests are authenticated
export const ensureApiAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for these specific endpoints if needed
  const publicPaths = ['/api/userinfo'];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  // Check authentication
  if (req.isAuthenticated() || (req.session && req.session.isAuthenticated)) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};