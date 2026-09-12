export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const SAMPLE_TEMPLATES: Template[] = [
  {
    id: "welcome",
    name: "🚀 Welcome & Features",
    description: "Overview of markdown syntax and previewer features",
    content: `# Welcome to Markdown Live Previewer 🚀

A modern, high-performance, and feature-rich **Markdown Editor & Previewer** built with **Next.js** and **Tailwind CSS**.

---

## 🌟 Key Features

- **⚡ Real-time Live Preview**: See your changes instantly as you type.
- **🎨 GitHub Flavored Markdown**: Tables, task lists, strikethrough, and syntax highlighting.
- **🛠️ Formatting Toolbar**: One-click formatting for headers, bold, italics, code, quotes, and more.
- **📁 Export & Copy**: Easily export your work to \`.md\` or \`.html\` files, or copy HTML/Markdown directly.
- **📊 Document Statistics**: Live character count, word count, and estimated reading time.
- **💾 Auto-Save**: Your work is automatically saved in your browser local storage!

---

## 📝 Markdown Syntax Examples

### Typography & Formatting

You can make text **bold**, *italic*, ~~strikethrough~~, or \`inline code\`.

> "Markdown is a lightweight markup language with plain text formatting syntax." 
> — *John Gruber*

### Task List

- [x] Create a sleek Markdown Previewer
- [x] Add GitHub Flavored Markdown support
- [x] Implement theme switcher & export functionality
- [ ] Share with friends!

---

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

---

### Tables

| Feature | Support | Performance |
| :--- | :---: | ---: |
| GFM Syntax | ✅ Yes | Extremely Fast |
| Syntax Highlighting | ✅ Yes | Instant |
| PDF/HTML Export | ✅ Yes | 100% Client-side |

---

### Image Example

![Unsplash Landscape](https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80)

*Enjoy creating beautiful documentation with Markdown!*
`
  },
  {
    id: "readme",
    name: "📄 Project README",
    description: "Standard GitHub repository README template",
    content: `# Project Name

> A short, catchy description of what this awesome project does.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

## ⚡ Quick Start

### Prerequisites

Make sure you have Node.js 18+ installed on your machine.

\`\`\`bash
node -v
\`\`\`

### Installation

1. Clone the repository
   \`\`\`bash
   git clone https://github.com/username/project-name.git
   \`\`\`
2. Install dependencies
   \`\`\`bash
   npm install
   \`\`\`
3. Run dev server
   \`\`\`bash
   npm run dev
   \`\`\`

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript

## 📄 License

Distributed under the MIT License. See \`LICENSE\` for more information.
`
  },
  {
    id: "cheatsheet",
    name: "💡 Markdown Cheatsheet",
    description: "Quick reference guide for Markdown syntax",
    content: `# Markdown Cheatsheet

# Heading 1
## Heading 2
### Heading 3
#### Heading 4

## Emphasis

*Italic text* or _Italic text_
**Bold text** or __Bold text__
***Bold & Italic***
~~Strikethrough~~

## Lists

### Unordered List
- Item 1
- Item 2
  - Sub-item 2a
  - Sub-item 2b

### Ordered List
1. First item
2. Second item
3. Third item

## Links & Images

[Google Search](https://google.com)
![Sample Image](https://picsum.photos/300/200)

## Blockquotes

> Single line blockquote
>
> Multi-line blockquote with continuous syntax

## Code

Inline \`code\` element.

Code block:
\`\`\`javascript
const message = "Hello World";
console.log(message);
\`\`\`
`
  }
];
