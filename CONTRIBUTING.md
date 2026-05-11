# Contributing to CAPTCHA Shield / Contribuyendo a CAPTCHA Shield

First off, thank you for considering contributing to CAPTCHA Shield! / ¡Gracias por considerar contribuir a CAPTCHA Shield!

---

## Table of Contents / Tabla de Contenidos

- [Code of Conduct / Código de Conducta](#code-of-conduct)
- [How to Contribute / Cómo Contribuir](#how-to-contribute)
- [Development Setup / Configuración de Desarrollo](#development-setup)
- [Pull Request Process / Proceso de Pull Request](#pull-request-process)
- [Coding Standards / Estándares de Código](#coding-standards)
- [Reporting Bugs / Reportar Bugs](#reporting-bugs)
- [Feature Requests / Solicitudes de Funcionalidades](#feature-requests)
- [Security Contribution Guidelines / Pautas de Contribución de Seguridad](#security-contribution-guidelines)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

Este proyecto sigue el [Código de Conducta del Contributor Covenant](CODE_OF_CONDUCT.md). Al participar, se espera que cumplas con este código.

---

## How to Contribute / Cómo Contribuir

### Reporting Bugs / Reportar Bugs

1. Check if the bug has already been reported in [Issues](../../issues).
2. If not, open a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the behavior
   - Expected vs. actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node.js version)

### Submitting Changes / Enviar Cambios

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write/update tests if applicable
5. Commit with clear messages: `git commit -m "feat: add new challenge type"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

---

## Development Setup / Configuración de Desarrollo

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/captcha-shield.git
cd captcha-shield

# Install dependencies
npm install

# Run checks (lint, typecheck, build)
npm run check

# Start dev server
npm run dev
```

---

## Pull Request Process / Proceso de Pull Request

### PR Checklist / Lista de Verificación de PR

- [ ] README updated if behavior changed
- [ ] Documentation added/updated in docs/
- [ ] All tests pass: `npm run check`
- [ ] TypeScript types updated
- [ ] No lint errors: `npm run lint`
- [ ] No build errors: `npm run build`
- [ ] Security model reviewed if changes affect security

### PR Title Format / Formato de Título de PR

PR title should follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance
- `security:` Security improvements (requires security review)

---

## Coding Standards / Estándares de Código

- **TypeScript**: Strict mode, no `any` types unless absolutely necessary
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS classes, shadcn/ui components
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: JSDoc for public functions, English for code comments
- **Formatting**: ESLint auto-formatted on save

### TypeScript Rules / Reglas de TypeScript

- `no-explicit-any`: ON (except when absolutely necessary)
- `no-unused-vars`: ON
- `no-non-null-assertion`: ON
- `prefer-const`: ON

### Security Rules / Reglas de Seguridad

- **NEVER** commit secrets or API keys
- **ALWAYS** sanitize user input before display
- **NEVER** trust client-side risk scores in production
- **ALWAYS** use signed tokens for production deployments
- **NEVER** expose internal error details to users

---

## Security Contribution Guidelines / Pautas de Contribución de Seguridad

### For Security-Related Changes

If your PR affects security or adds security features:

1. **Add a `[security]` prefix to the PR title**
2. **Include security review in PR description**
3. **Document threat model changes**
4. **Add tests for security scenarios**
5. **Review against SECURITY_MODEL.md**

### Prohibited / Prohibido

- ❌ Committing secrets or credentials
- ❌ Hardcoded API keys
- ❌ Insecure storage of sensitive data
- ❌ Unverified user input in challenge generation
- ❌ Insecure postMessage handlers

---

## Feature Requests / Solicitudes de Funcionalidades

Open an issue with the label `enhancement` and describe:

- The motivation / use case
- Proposed solution
- Alternatives considered
- Security implications (if applicable)

¡Abre un issue con la etiqueta `enhancement` y describe:
- La motivación / caso de uso
- La solución propuesta
- Alternativas consideradas
- Implicaciones de seguridad (si aplica)
