export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const SAMPLE_TEMPLATES: Template[] = [
  {
    id: "welcome",
    name: "Welcome & Features",
    description: "Overview of markdown syntax and previewer features",
    content: `# Welcome to Markdown Live Previewer

A modern, high-performance, and feature-rich **Markdown Editor & Previewer** built with **Next.js** and **Tailwind CSS**.

---

## Key Features

- **Real-time Live Preview**: See your changes instantly as you type.
- **GitHub Flavored Markdown**: Tables, task lists, strikethrough, and syntax highlighting.
- **Diagrams & Math**: Mermaid.js sequence/flowchart diagrams and KaTeX formulas.
- **Callouts & Alerts**: GitHub-style alert callouts (\`> [!NOTE]\`, \`> [!WARNING]\`).
- **Export & Copy**: Easily export your work to \`.md\` or \`.html\` files, or copy HTML/Markdown directly.
- **Document Statistics**: Live character count, word count, and estimated reading time.
- **Auto-Save & History**: Automatic browser draft saving with version history restoration.

---

## GitHub Callouts / Alerts

> [!NOTE]
> This is a useful note alert to highlight important information.

> [!TIP]
> Pro-tip: You can drag and drop any \`.md\` file or paste images directly (\`Ctrl + V\`)!

> [!IMPORTANT]
> Always review your exported documents before publishing.

> [!WARNING]
> Keep a backup of critical files before overwriting.

> [!CAUTION]
> Proceed with caution when performing high-risk actions.

---

## KaTeX Math Expression

Inline math: $E = mc^2$ and Euler's identity $e^{i\\pi} + 1 = 0$.

Block math formula:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

---

## Mermaid.js Diagram

\`\`\`mermaid
flowchart TD
    A[Start Editor] --> B{Draft Exists?}
    B -- Yes --> C[Restore from LocalStorage]
    B -- No --> D[Load Default Welcome Template]
    C --> E[Edit & Live Preview]
    D --> E
    E --> F[Auto-Save Draft & History]
\`\`\`

---

## Markdown Syntax Examples

### Code Syntax Highlighting

\`\`\`typescript
interface User {
  id: number;
  name: string;
  role: "admin" | "user";
}

function greetUser(user: User): string {
  return \`Hello \${user.name}! Welcome back to Markdown Previewer.\`;
}

console.log(greetUser({ id: 1, name: "Woradet", role: "admin" }));
\`\`\`

### Tables

| Feature | Support | Performance |
| :--- | :---: | ---: |
| GFM Syntax | Yes | Extremely Fast |
| Diagrams & Math | Yes | Instant |
| PDF/HTML Export | Yes | 100% Client-side |
`
  },
  {
    id: "mermaid",
    name: "Mermaid Diagrams",
    description: "Flowcharts, Sequence Diagrams, and Class Diagrams using Mermaid.js",
    content: `# Mermaid.js Diagrams & Charts

## 1. Flowchart Diagram

\`\`\`mermaid
graph TD
    User[User Input] -->|Types Markdown| Editor[Text Area Editor]
    Editor -->|Triggers Auto-Save| Storage[(LocalStorage)]
    Editor -->|Parses AST| Renderer[React Markdown]
    Renderer -->|KaTeX| Math[Math Renderer]
    Renderer -->|Mermaid| Chart[Mermaid Renderer]
    Chart --> Output[Live Preview UI]
\`\`\`

## 2. Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User
    participant WebApp as Web Interface
    participant API as GET /api/templates
    
    User->>WebApp: Click "Load Template"
    WebApp->>API: Request JSON templates
    API-->>WebApp: Return templates array
    WebApp-->>User: Populate Editor with content
\`\`\`

## 3. State Diagram

\`\`\`mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Editing: User types text
    Editing --> AutoSaving: 2s Timer Triggered
    AutoSaving --> Idle: Saved to LocalStorage
\`\`\`
`
  },
  {
    id: "math",
    name: "KaTeX Math Equations",
    description: "Mathematical equations and scientific notations using KaTeX",
    content: `# Mathematical Expressions with KaTeX

## Inline Math

Einstein's mass-energy equivalence formula is $E = mc^2$.
The Pythagorean theorem states that $a^2 + b^2 = c^2$.
The limit definition of derivative is $f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$.

## Block Equations

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$
`
  },
  {
    id: "readme",
    name: "Project README",
    description: "Standard GitHub repository README template",
    content: `# Project Name

> A short, catchy description of what this awesome project does.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`
`
  },
  {
    id: "cheatsheet",
    name: "Markdown Cheatsheet",
    description: "Quick reference guide for Markdown syntax",
    content: `# Markdown Cheatsheet

# Heading 1
## Heading 2

> [!NOTE]
> Useful information note.

> [!WARNING]
> Warning alert block.
`
  }
];
