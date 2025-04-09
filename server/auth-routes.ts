import {Express, NextFunction, Request, Response} from 'express'
import passport from 'passport'
import {ensureAuthenticated, User} from './auth.ts'

/**
 * Configure authentication routes
 */

const logoutRedirectUrl = process.env.APP_BASE_URL!;
const oktaDomain = process.env.OKTA_DOMAIN;
const oktaIssuer = `https://${oktaDomain}/oauth2/default`;
const redirectUrl = `${process.env.APP_BASE_URL}/authorization-code/callback`;

export const configureAuthRoutes = (app: Express): void => {
	// Login route - redirects directly to Okta
	app.get('/auth/login', (req, res, next) => {
		console.log('Auth login: Redirecting to Okta login');
		passport.authenticate('oauth2')(req, res, next);
	});
	
	// Login info route - returns the Okta authorization URL
	app.get('/auth/login-info', (req, res) => {
		console.log('Auth login-info: Generating Okta login URL');
		const state = generateRandomState();
		if (req.session) {
			req.session.state = state;
			req.session.save((err) => { // Explicitly save the session
				if (err) {
					console.error('Session save error:', err);
					return res.status(500).json({ error: 'Failed to save session' });
				}
				const authUrl = buildAuthorizationUrl(state);
				console.log('Generated state:', state, 'Auth URL:', authUrl);
				res.json({ authUrl });
			});
		} else {
			console.error('No session available');
			res.status(500).json({ error: 'No session available' });
		}
	});
	
	// Callback route after successful login
	app.get(
		'/authorization-code/callback',
		(req: Request, res: Response, next: NextFunction) => {
			console.log('Auth callback: Processing OAuth callback');
			logCallbackDebugInfo(req);
			
			// Check for errors in callback
			if (req.query.error) {
				console.error('Auth callback received error:', req.query.error);
				console.error('Error description:', req.query.error_description);
				return res.redirect('/login?error=' + encodeURIComponent(req.query.error as string));
			}
			
			// Validate state parameter - stop flow if invalid
			if (!validateStateParameter(req)) {
				return res.redirect('/login?error=invalid_state');
			}
			
			passport.authenticate('oauth2', (err: any, user: any, info: any) => {
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
					console.log('Using logout redirect URL:', logoutRedirectUrl);
					res.redirect(
						`${oktaIssuer}/v1/logout?client_id=${process.env.OKTA_CLIENT_ID}&post_logout_redirect_uri=${encodeURIComponent(
							logoutRedirectUrl
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
	
	// Handle Okta tokens from Sign-In Widget
	app.post('/auth/handle-tokens', async (req: Request, res: Response) => {
		console.log('Handling tokens from Okta Sign-In Widget');
		
		try {
			const { tokens } = req.body;
			
			if (!tokens || !tokens.idToken) {
				console.error('Invalid token data received');
				return res.status(400).json({ error: 'Invalid token data' });
			}
			
			console.log('Processing tokens from widget:', {
				hasAccessToken: !!tokens.accessToken,
				hasIdToken: !!tokens.idToken,
				tokenType: tokens.tokenType,
				expiresIn: tokens.expiresIn
			});
			
			const user = extractUserFromIdToken(tokens.idToken.toString());
			
			// Log the user in
			req.login(user, (loginErr) => {
				if (loginErr) {
					console.error('Login error with widget tokens:', loginErr);
					return res.status(500).json({ error: 'Failed to create session' });
				}
				
				if (req.session) {
					req.session.isAuthenticated = true;
					console.log('Session set to authenticated via widget');
				}
				
				return res.status(200).json({ success: true, user });
			});
		} catch (error) {
			console.error('Error processing tokens:', error);
			res.status(500).json({ error: 'Failed to process authentication tokens' });
		}
	});
};


/**
 * Generates a random state for CSRF protection
 */
function generateRandomState(): string {
	return Math.random().toString(36).substring(2, 15);
}

/**
 * Builds the authorization URL for Okta OAuth
 */
function buildAuthorizationUrl(state: string): string {
	return `${oktaIssuer}/v1/authorize?` +
		`client_id=${process.env.OKTA_CLIENT_ID}` +
		`&response_type=code` +
		`&scope=${encodeURIComponent('openid profile email')}` +
		`&redirect_uri=${encodeURIComponent(redirectUrl)}` +
		`&state=${state}`;
}

/**
 * Logs debug information about the OAuth callback
 */
function logCallbackDebugInfo(req: Request): void {
	console.log('Callback request query params:', req.query);
	console.log('Session exists:', !!req.session);
	
	// Log session data for debugging
	if (req.session) {
		console.log('Session data:', {
			...req.session,
			// Don't log sensitive data
			cookie: req.session.cookie ? 'present' : 'missing'
		});
	}
}

/**
 * Validates the state parameter in OAuth callback
 */
function validateStateParameter(req: Request): boolean {
	if (!req.query.state) {
		console.error('Auth callback error: Missing state parameter');
		return false;
	}
	
	if (!req.session || !req.session.state) {
		console.error('Auth callback error: No session state to validate against');
		return false;
	}
	
	if (req.query.state !== req.session.state) {
		console.error('Auth callback error: State parameter mismatch');
		return false;
	}
	
	console.log('State parameter validation successful');
	return true;
}

/**
 * Extract user information from JWT ID token
 */
function extractUserFromIdToken(idTokenStr: string): User {
	const parts = idTokenStr.split('.');
	
	if (parts.length !== 3) {
		console.error('Invalid ID token format');
		throw new Error('Invalid token format');
	}
	
	const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
	
	return {
		id: payload.sub,
		displayName: payload.name || payload.preferred_username || payload.email || 'Unknown User',
		email: payload.email
	};
}
