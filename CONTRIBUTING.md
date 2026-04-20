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

# Set up environment
cp .env.example .env
npx prisma db push

# Start dev server
npm run dev
```

---

## Pull Request Process / Proceso de Pull Request

1. Update documentation (README.md, docs/) if needed
2. Add tests for new features
3. Ensure all tests pass: `npm run lint`
4. PR title should follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New features
   - `fix:` Bug fixes
   - `docs:` Documentation
   - `refactor:` Code refactoring
   - `test:` Tests
   - `chore:` Maintenance

---

## Coding Standards / Estándares de Código

- **TypeScript**: Strict mode enabled, no `any` types unless absolutely necessary
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS classes, shadcn/ui components
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: JSDoc for public functions, English for code comments
- **Formatting**: ESLint + Prettier (auto-formatted on save)

---

## Feature Requests / Solicitudes de Funcionalidades

Open an issue with the label `enhancement` and describe:
- The motivation / use case
- Proposed solution
- Alternatives considered

¡Abre un issue con la etiqueta `enhancement` y describe:
- La motivación / caso de uso
- La solución propuesta
- Alternativas consideradas
