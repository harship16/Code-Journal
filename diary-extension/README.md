# Diary Person Reference Extension

A VSCode extension for managing diary entries with person references and tags.

## Features

- Autocomplete for person names when typing `$` in `.entry` files
- Ctrl+Click navigation from `$Name` to `Name.person` file
- Ctrl+Click navigation from `#tag` to `tag.tag` file
- Automatic reference generation in `.person` files
- Automatic tag file generation

## Installation

1. Copy this extension folder to your VSCode extensions directory, or
2. Open this folder in VSCode and press F5 to run in Extension Development Host

## Usage

1. Create a `persons` directory in your workspace root
2. Create `.person` files in the `persons` directory (e.g., `John.person`)
3. Create `.entry` files anywhere in your workspace (e.g., `17_June_2025.entry`)
4. Type `$` followed by a person name in `.entry` files for autocomplete
5. Use `#tag` syntax to tag people in `.person` files

## File Structure

```
workspace/
├── persons/
│   ├── John.person
│   └── Jane.person
├── tags/
│   └── college_friend.tag
└── 17_June_2025.entry
```

## Building

```bash
npm install
npm run compile
```

