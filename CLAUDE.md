# CLAUDE.md - Guidelines for working in this repository

## Build/Test/Lint Commands
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview production build: `npm run preview`
- Full build and preview: `npm run start`
- Lint: `npm run lint`
- Test all: `npm test`
- Test watch mode: `npm run test:watch`
- Test single: `npm run test:single "test name or pattern"`
- TypeCheck: `npm run typecheck`

## Code Style Guidelines
- **Formatting**: Use tabs for indentation
- **File Structure**: All HTML and TypeScript code in single "src" folder
- **Modules**: Use ES modules with .js extension
- **Imports**: Group imports by external/internal, sort alphabetically
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Types**: Use TypeScript types for all variables, parameters, and return values
- **Error Handling**: Use try/catch for async operations, proper error propagation
- **Comments**: JSDoc format for function documentation, explain "why" not "what"

Feel free to customize this file as the project evolves.
