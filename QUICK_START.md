# Quick Start Guide

## Step 1: Install and Build the Extension

```bash
cd diary-extension
npm install
npm run compile
```

## Step 2: Load Extension in VSCode

1. Open VSCode
2. Press `F5` to start debugging (opens Extension Development Host)
3. In the new window, open this workspace folder

## Step 3: Set Up Directory Structure

Your workspace should have:
- `persons/` folder containing `.person` files
- `*.entry` files for diary entries
- `tags/` folder (auto-created) for tag files

## Step 4: Select Language Interpreter

1. Open any `.entry` file
2. Click the language indicator in bottom-right (shows "Plain Text")
3. Select "Diary Entry"
4. Repeat for `.person` files → select "Diary Person"
5. Repeat for `.tag` files → select "Diary Tag"

**OR** the language is already configured in `.vscode/settings.json` - it should auto-detect!

## Step 5: Test It Out

1. Open `17_June_2025.entry`
2. Type `$` - you should see autocomplete suggestions (John, Jane)
3. Type `$John` and Ctrl+Click it - should open `persons/John.person`
4. In `John.person`, add a tag like `#friend`
5. Ctrl+Click `#friend` - should open `tags/friend.tag`
6. Save the `.entry` file - references should auto-update in `.person` files

## Features

✅ **Autocomplete**: Type `$` in `.entry` files to see person names  
✅ **Navigation**: Ctrl+Click `$Name` → opens `Name.person`  
✅ **Tag Navigation**: Ctrl+Click `#tag` → opens `tag.tag`  
✅ **Auto References**: Saves `.entry` files auto-update references  
✅ **Auto Tags**: Saves `.person` files auto-update tag files  

## Manual Commands

If auto-generation doesn't work:
- `Ctrl+Shift+P` → "Diary: Regenerate References"
- `Ctrl+Shift+P` → "Diary: Regenerate Tags"

