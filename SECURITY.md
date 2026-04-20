# Security Policy / Política de Seguridad

## Supported Versions / Versiones Soportadas

| Version | Supported |
|---------|-----------|
| 2.0.x   | ✅        |
| < 2.0   | ❌        |

## Reporting a Vulnerability / Reportar una Vulnerabilidad

We take security vulnerabilities seriously. If you discover a security vulnerability in CAPTCHA Shield, please report it responsibly.

Nos tomamos las vulnerabilidades de seguridad en serio. Si descubres una vulnerabilidad de seguridad en CAPTCHA Shield, por favor repórtala de forma responsable.

### How to Report / Cómo Reportar

1. **Do NOT** open a public issue for security vulnerabilities.
2. **NO** abras un issue público para vulnerabilidades de seguridad.
3. Send an email describing the vulnerability to the project maintainers.
4. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Process / Proceso de Respuesta

1. We will acknowledge receipt within 48 hours.
2. We will assess the severity and determine a timeline.
3. We will keep you updated on the fix progress.
4. Once fixed, we will credit you (unless you prefer to remain anonymous).

### Best Practices / Mejores Prácticas

- Always keep your `.env` files out of version control
- Siempre mantén tus archivos `.env` fuera del control de versiones
- Use HTTPS in production
- Usa HTTPS en producción
- Regularly update dependencies: `npm audit`
- Actualiza dependencias regularmente: `npm audit`
- Review the [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)

## Known Limitations / Limitaciones Conocidas

- Behavioral analysis is heuristic-based and may produce false positives/negatives
- El análisis comportamental es heurístico y puede producir falsos positivos/negativos
- Canvas rendering may behave differently across browsers
- El renderizado en canvas puede comportarse diferente entre navegadores
- SQLite is not recommended for high-traffic production deployments
- SQLite no se recomienda para despliegues de producción con alto tráfico
