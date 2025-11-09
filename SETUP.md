# Diary Extension Setup Guide

## Installation Steps

### 1. Install Dependencies

Navigate to the `diary-extension` folder and install dependencies:

```bash
cd diary-extension
npm install
```

### 2. Compile the Extension

```bash
npm run compile
```

### 3. Load the Extension in VSCode

#### Option A: Development Mode (Recommended for testing)
1. Open VSCode
2. Press `F5` or go to `Run > Start Debugging`
3. This will open a new "Extension Development Host" window
4. In that window, open your workspace folder
5. The extension will be active in that window

#### Option B: Install as Extension
1. Open VSCode
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Extensions: Install from VSIX..."
4. Navigate to the `diary-extension` folder
5. First, package the extension:
   ```bash
   cd diary-extension
   npx vsce package
   ```
6. Install the generated `.vsix` file

### 4. Select the Language Interpreter

To use your custom language in VSCode:

1. Open any `.entry` file
2. Click on the language indicator in the bottom-right corner of VSCode (it might say "Plain Text")
3. Select "Diary Entry" from the list
4. For `.person` files, select "Diary Person"
5. For `.tag` files, select "Diary Tag"

Alternatively, you can add this to your workspace settings (`.vscode/settings.json`):

```json
{
  "files.associations": {
    "*.entry": "diary-entry",
    "*.person": "diary-person",
    "*.tag": "diary-tag"
  }
}
```

## Directory Structure

Create the following structure in your workspace:

```
workspace/
├── persons/          # Directory for .person files
│   ├── John.person
│   └── Jane.person
├── tags/             # Auto-generated directory for .tag files
└── *.entry           # Your diary entry files
```

## Usage

1. **Create Person Files**: Create `.person` files in the `persons/` directory
   - Format: `Name.person` (e.g., `John.person`)

2. **Write Diary Entries**: Create `.entry` files anywhere in your workspace
   - Type `$` to get autocomplete suggestions for person names
   - Type `$John` to reference John

3. **Navigate to Person Files**: 
   - Ctrl+Click (or Cmd+Click on Mac) on `$John` to open `John.person`

4. **Add Tags**: In `.person` files, add tags like `#college_friend`
   - Ctrl+Click on `#college_friend` to open `college_friend.tag`

5. **Auto-Generated Content**:
   - References section in `.person` files is auto-generated when you save `.entry` files
   - `.tag` files are auto-generated when you save `.person` files

## Manual Commands

If auto-generation doesn't work, you can manually trigger:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Diary: Regenerate References"
3. Type "Diary: Regenerate Tags"

## Troubleshooting

- **Autocomplete not working**: Make sure the extension is loaded and you're in a `.entry` file
- **References not updating**: Save the `.entry` file or run the regenerate command
- **Language not recognized**: Check that file associations are set correctly in settings

