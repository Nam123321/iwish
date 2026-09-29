"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCorsAndOwaspMiddleware = void 0;
const createCorsAndOwaspMiddleware = (options) => {
    return (req, res, next) => {
        // 1. OWASP Security Headers Injection
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        res.setHeader('X-XSS-Protection', '1; mode=block');
        // 2. Strict CORS Validation (EC-P1-01)
        const origin = req.header('origin');
        if (origin) {
            let isAllowed = false;
            if (Array.isArray(options.allowedOrigins)) {
                isAllowed = options.allowedOrigins.includes(origin);
            }
            else if (options.allowedOrigins instanceof RegExp) {
                isAllowed = options.allowedOrigins.test(origin);
            }
            // Rejects subdomain spoofing since we only allow based on strict string or bounded regex
            if (isAllowed) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Forwarded-For');
                res.setHeader('Access-Control-Allow-Credentials', 'true');
            }
            else {
                return res.status(403).json({ error: 'CORS policy violation: Origin not allowed' });
            }
        }
        // Pre-flight short circuit
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        next();
    };
};
exports.createCorsAndOwaspMiddleware = createCorsAndOwaspMiddleware;
