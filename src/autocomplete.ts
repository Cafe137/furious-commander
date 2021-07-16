import * as Argv from 'cafe-args'
import * as FS from 'fs'
import { EOL } from 'os'
import { exit } from 'process'

const AUTOCOMPLETE_FLAG = '--compgen'
const FISH_FLAG = '--compfish'

interface CompletionInfo {
  shell: Argv.Shell
  expectedPaths: string[]
  path: string | null
  script: string
}

export async function maybeAutocomplete(argv: string[], parser: Argv.Parser): Promise<void> {
  const index = argv.findIndex(x => x === AUTOCOMPLETE_FLAG)

  if (index === -1) {
    return
  }
  const isFish = argv.includes(FISH_FLAG)
  await autocomplete(parser, argv[index + 1], isFish)
}

async function autocomplete(parser: Argv.Parser, line: string, isFish: boolean): Promise<void> {
  const suggestions = await parser.suggest(line, 1, isFish ? '' : ' ')
  for (const suggestion of suggestions) {
    process.stdout.write(suggestion + EOL)
  }
  exit(0)
}

export async function generateAutocompletion(command: string): Promise<void> {
  const completion = await getCompletionInfo(command, false)
  process.stdout.write('Your shell is: ' + completion.shell + EOL)

  if (completion.path) {
    process.stdout.write('Found configuration file path: ' + completion.path + EOL)
  } else {
    process.stdout.write('Could not locate your shell configuration path!' + EOL)
  }
  process.stdout.write(EOL)
  process.stdout.write('Append the completion script below to your configuration file to enable autocomplete.' + EOL)
  process.stdout.write('You need to source your configuration, or restart your shell, to load the changes.' + EOL)
  process.stdout.write(EOL)
  process.stdout.write(completion.script + EOL)
  exit(0)
}

export async function installAutocompletion(command: string): Promise<void> {
  const completion = await getCompletionInfo(command, true)

  if (!completion.path) {
    throw Error('Null shell configuration path')
  }
  process.stdout.write('Your shell is: ' + completion.shell + EOL)
  process.stdout.write('Found configuration file path: ' + completion.path + EOL)
  process.stdout.write(EOL)
  process.stdout.write('Appending autocomplete script...' + EOL)
  await FS.promises.appendFile(completion.path, EOL + completion.script + EOL)
  process.stdout.write('Installed autocomplete script.' + EOL)
  process.stdout.write(EOL)
  process.stdout.write('You need to source your configuration, or restart your shell, to load the changes.' + EOL)
  exit(0)
}

async function getCompletionInfo(command: string, strictPath: boolean): Promise<CompletionInfo> {
  const shellString = getShell()

  if (!shellString) {
    handleNullShell()
  }

  const shell = Argv.detectShell(shellString)

  if (!shell) {
    handleUnsupportedShell(shellString)
  }

  const expectedPaths = Argv.getShellPaths(shell)
  let path = null

  for (const probablePath of expectedPaths) {
    if (await fileExists(probablePath)) {
      path = probablePath
      break
    }
  }

  if (!path && strictPath) {
    handleMissingPath(shell, expectedPaths)
  }

  const script = Argv.generateCompletion(command, shell)

  return { shell, path, expectedPaths, script }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const stat = await FS.promises.stat(path)

    return !stat.isDirectory()
  } catch {
    return false
  }
}

function getShell(): string | null {
  return process.env.SHELL || null
}

function handleNullShell(): never {
  process.stderr.write('Could not detect your shell.' + EOL)
  process.stderr.write('Set the SHELL environment variable and try again.' + EOL)
  exit(1)
}

function handleUnsupportedShell(shell: string): never {
  process.stderr.write('Your shell is: ' + shell + EOL)
  process.stderr.write('Only bash, zsh and fish are supported.' + EOL)
  exit(1)
}

function handleMissingPath(shell: string, paths: string[]): never {
  process.stderr.write('Your shell is: ' + shell + EOL)
  process.stderr.write('Expected configuration file at any of these locations: ' + EOL)
  for (const path of paths) {
    process.stderr.write('  ' + path + EOL)
  }
  exit(1)
}
