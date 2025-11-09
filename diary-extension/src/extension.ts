import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let personNames: string[] = [];
let personsDirectory: string = '';

function getPersonsDirectory(): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return '';
    }
    
    // Look for a 'persons' directory in the workspace
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const personsPath = path.join(workspaceRoot, 'persons');
    
    if (fs.existsSync(personsPath)) {
        return personsPath;
    }
    
    return '';
}

function loadPersonNames(): string[] {
    const dir = getPersonsDirectory();
    if (!dir || !fs.existsSync(dir)) {
        return [];
    }
    
    try {
        const files = fs.readdirSync(dir);
        return files
            .filter(file => file.endsWith('.person'))
            .map(file => path.basename(file, '.person'));
    } catch (error) {
        return [];
    }
}

function refreshPersonNames() {
    personNames = loadPersonNames();
    personsDirectory = getPersonsDirectory();
}

export function activate(context: vscode.ExtensionContext) {
    refreshPersonNames();
    
    // Watch for file system changes to refresh person names
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.person');
    watcher.onDidCreate(() => refreshPersonNames());
    watcher.onDidDelete(() => refreshPersonNames());
    watcher.onDidChange(() => refreshPersonNames());
    
    context.subscriptions.push(watcher);
    
    // Autocomplete provider for $person names in .entry files
    const entryCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'diary-entry',
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.substr(0, position.character);
                const match = linePrefix.match(/\$(\w*)$/);
                
                if (!match) {
                    return undefined;
                }
                
                refreshPersonNames();
                
                return personNames.map(name => {
                    const item = new vscode.CompletionItem(
                        `$${name}`,
                        vscode.CompletionItemKind.User
                    );
                    item.insertText = name;
                    item.detail = 'Person reference';
                    return item;
                });
            }
        },
        '$'
    );
    
    // Definition provider for $Name -> Name.person
    const entryDefinitionProvider = vscode.languages.registerDefinitionProvider(
        'diary-entry',
        {
            provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Definition | undefined {
                const wordRange = document.getWordRangeAtPosition(position, /\$[A-Za-z][A-Za-z0-9_]*/);
                if (!wordRange) {
                    return undefined;
                }
                
                const word = document.getText(wordRange);
                const personName = word.substring(1); // Remove the $
                
                const dir = getPersonsDirectory();
                if (!dir) {
                    return undefined;
                }
                
                const personFile = path.join(dir, `${personName}.person`);
                if (fs.existsSync(personFile)) {
                    return new vscode.Location(
                        vscode.Uri.file(personFile),
                        new vscode.Position(0, 0)
                    );
                }
                
                return undefined;
            }
        }
    );
    
    // Definition provider for #tag -> tag.tag
    const tagDefinitionProvider = vscode.languages.registerDefinitionProvider(
        ['diary-entry', 'diary-person'],
        {
            provideDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Definition | undefined {
                const wordRange = document.getWordRangeAtPosition(position, /#[A-Za-z][A-Za-z0-9_]*/);
                if (!wordRange) {
                    return undefined;
                }
                
                const word = document.getText(wordRange);
                const tagName = word.substring(1); // Remove the #
                
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) {
                    return undefined;
                }
                
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                const tagFile = path.join(workspaceRoot, 'tags', `${tagName}.tag`);
                
                if (fs.existsSync(tagFile)) {
                    return new vscode.Location(
                        vscode.Uri.file(tagFile),
                        new vscode.Position(0, 0)
                    );
                }
                
                return undefined;
            }
        }
    );
    
    // Command to regenerate references
    const regenerateReferencesCommand = vscode.commands.registerCommand(
        'diary-extension.regenerateReferences',
        () => {
            regenerateAllReferences();
        }
    );
    
    // Command to regenerate tags
    const regenerateTagsCommand = vscode.commands.registerCommand(
        'diary-extension.regenerateTags',
        () => {
            regenerateAllTags();
        }
    );
    
    // Auto-regenerate on save
    const saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.fileName.endsWith('.entry')) {
            regenerateAllReferences();
            regenerateAllTags();
        } else if (document.fileName.endsWith('.person')) {
            regenerateAllTags();
        }
    });
    
    context.subscriptions.push(
        entryCompletionProvider,
        entryDefinitionProvider,
        tagDefinitionProvider,
        regenerateReferencesCommand,
        regenerateTagsCommand,
        saveListener
    );
}

function regenerateAllReferences() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
    }
    
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const personsDir = path.join(workspaceRoot, 'persons');
    const entriesDir = workspaceRoot; // Assuming entries are in root or we'll search
    
    if (!fs.existsSync(personsDir)) {
        return;
    }
    
    // Find all .entry files
    const entryFiles: string[] = [];
    function findEntryFiles(dir: string) {
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory() && file !== 'persons' && file !== 'tags' && file !== 'node_modules') {
                    findEntryFiles(fullPath);
                } else if (file.endsWith('.entry')) {
                    entryFiles.push(fullPath);
                }
            }
        } catch (error) {
            // Ignore errors
        }
    }
    
    findEntryFiles(workspaceRoot);
    
    // Get all person files
    const personFiles = fs.readdirSync(personsDir)
        .filter(file => file.endsWith('.person'))
        .map(file => path.basename(file, '.person'));
    
    // For each person, find all references
    for (const personName of personFiles) {
        const references: Array<{file: string, context: string}> = [];
        
        for (const entryFile of entryFiles) {
            try {
                const content = fs.readFileSync(entryFile, 'utf-8');
                const regex = new RegExp(`\\$${personName}\\b`, 'gi');
                
                // Split content into words while preserving positions
                const words: Array<{word: string, start: number, end: number}> = [];
                const wordRegex = /\S+/g;
                let wordMatch;
                while ((wordMatch = wordRegex.exec(content)) !== null) {
                    words.push({
                        word: wordMatch[0],
                        start: wordMatch.index,
                        end: wordMatch.index + wordMatch[0].length
                    });
                }
                
                // Find all person references
                let match;
                while ((match = regex.exec(content)) !== null) {
                    const matchStart = match.index;
                    const matchEnd = match.index + match[0].length;
                    
                    // Find the word index containing this match
                    let matchWordIndex = -1;
                    for (let i = 0; i < words.length; i++) {
                        if (words[i].start <= matchStart && words[i].end >= matchEnd) {
                            matchWordIndex = i;
                            break;
                        }
                    }
                    
                    if (matchWordIndex === -1) {
                        continue;
                    }
                    
                    // Get 4 words before and after
                    const startIndex = Math.max(0, matchWordIndex - 4);
                    const endIndex = Math.min(words.length, matchWordIndex + 5);
                    const contextWords = words.slice(startIndex, endIndex).map(w => w.word);
                    
                    const entryFileName = path.basename(entryFile);
                    references.push({
                        file: entryFileName,
                        context: contextWords.join(' ')
                    });
                }
            } catch (error) {
                // Ignore errors
            }
        }
        
        // Update the person file
        updatePersonFileReferences(path.join(personsDir, `${personName}.person`), references);
    }
}

function updatePersonFileReferences(personFilePath: string, references: Array<{file: string, context: string}>) {
    if (!fs.existsSync(personFilePath)) {
        return;
    }
    
    let content = fs.readFileSync(personFilePath, 'utf-8');
    
    // Find or create References section
    const referencesSectionRegex = /^##\s+References\s*$/m;
    const referencesEndRegex = /^##\s+Tags\s*$/m;
    const dataEndRegex = /^##\s+References\s*$/m;
    
    let referencesSection = '';
    for (const ref of references) {
        referencesSection += `[${ref.file}] : ${ref.context}\n`;
    }
    
    if (referencesSectionRegex.test(content)) {
        // Replace existing references section
        if (referencesEndRegex.test(content)) {
            // Replace between References and Tags
            content = content.replace(
                /(^##\s+References\s*$\n)([\s\S]*?)(^##\s+Tags\s*$)/m,
                `$1${referencesSection}$3`
            );
        } else {
            // Replace until end of file
            content = content.replace(
                /(^##\s+References\s*$\n)([\s\S]*)/m,
                `$1${referencesSection}`
            );
        }
    } else {
        // Add References section before Tags or after Data
        if (referencesEndRegex.test(content)) {
            // Insert before Tags
            content = content.replace(
                /(^##\s+Tags\s*$)/m,
                `## References\n${referencesSection}\n$1`
            );
        } else if (dataEndRegex.test(content)) {
            // This shouldn't happen, but handle it
            content = content.replace(
                /(^##\s+References\s*$)/m,
                `$1\n${referencesSection}`
            );
        } else {
            // Add at the end
            content += `\n## References\n${referencesSection}`;
        }
    }
    
    fs.writeFileSync(personFilePath, content, 'utf-8');
}

function regenerateAllTags() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
    }
    
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const personsDir = path.join(workspaceRoot, 'persons');
    const tagsDir = path.join(workspaceRoot, 'tags');
    
    if (!fs.existsSync(personsDir)) {
        return;
    }
    
    // Create tags directory if it doesn't exist
    if (!fs.existsSync(tagsDir)) {
        fs.mkdirSync(tagsDir, { recursive: true });
    }
    
    // Map of tag name -> array of person names
    const tagMap: { [key: string]: string[] } = {};
    
    // Scan all person files for tags
    const personFiles = fs.readdirSync(personsDir)
        .filter(file => file.endsWith('.person'));
    
    for (const personFile of personFiles) {
        const personName = path.basename(personFile, '.person');
        const personFilePath = path.join(personsDir, personFile);
        
        try {
            const content = fs.readFileSync(personFilePath, 'utf-8');
            const tagRegex = /#([A-Za-z][A-Za-z0-9_]*)/g;
            let match;
            
            while ((match = tagRegex.exec(content)) !== null) {
                const tagName = match[1];
                if (!tagMap[tagName]) {
                    tagMap[tagName] = [];
                }
                if (!tagMap[tagName].includes(personName)) {
                    tagMap[tagName].push(personName);
                }
            }
        } catch (error) {
            // Ignore errors
        }
    }
    
    // Update or create tag files
    for (const [tagName, personNames] of Object.entries(tagMap)) {
        const tagFilePath = path.join(tagsDir, `${tagName}.tag`);
        let content = `# ${tagName}\n\n## People with this tag:\n\n`;
        
        for (const personName of personNames) {
            content += `- $${personName}\n`;
        }
        
        fs.writeFileSync(tagFilePath, content, 'utf-8');
    }
}

export function deactivate() {}

