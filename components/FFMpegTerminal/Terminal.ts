import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FitAddon } from '@xterm/addon-fit';
import {
  ITerminalOptions as IXTerminalOptions,
  Terminal as XTerminal,
} from '@xterm/xterm';
import getMimeType from '../../utils/helpers/getMimeType';

/* Interfaces */
export interface IFFMpegFileSystem {
  name: string;
  data: string | Blob | File;
  mimeType: string;
}
interface IFFmpegFiles {
  system?: Array<IFFMpegFileSystem>;
  generated?: Array<IFFMpegFileSystem>;
}
interface IFFMpegTerminalOptions extends IXTerminalOptions {
  files?: IFFmpegFiles;
  onGeneratedFiles?: (files: Array<IFFMpegFileSystem>) => Promise<void>;
}
interface Command {
  exec: (terminal: FFMpegTerminal) => FFMpegTerminal | Promise<FFMpegTerminal>;
  description: string;
}

const FFMPEG_CORE_VERSION = '0.12.10';
const FFMPEG_CORE_BASE_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

/**
 * Collapse multi-line / shell-continued command text into one argv-friendly line.
 */
const normalizeCommandText = (text: string): string =>
  text
    .replace(/\\\s*[\r\n]+/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/(^|\s)\\(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/* Commands */
/**
 * Split a shell-like command into argv, respecting single/double quotes.
 * Quotes are stripped from the resulting tokens.
 */
const parseCommandArgs = (command: string): string[] => {
  const args: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
};

const FS_RESERVED_NAMES = new Set(['.', '..', 'tmp', 'home', 'dev', 'proc']);

const listGeneratedFileNames = async (
  terminal: FFMpegTerminal
): Promise<string[]> => {
  const systemNames = new Set([
    ...FS_RESERVED_NAMES,
    ...(terminal.files.system?.map((x) => x.name) ?? []),
  ]);
  const homeDir = await terminal.ffmpegWasm.listDir('/');
  return homeDir
    .filter((entry) => !entry.isDir && !systemNames.has(entry.name))
    .map((entry) => entry.name);
};

const clearCommand: Command = {
  exec: (terminal: FFMpegTerminal): FFMpegTerminal => terminal.clear(),
  description: 'Clears the screen',
};
const helpCommand: Command = {
  exec: (terminal: FFMpegTerminal): FFMpegTerminal => {
    terminal.writeln(
      [
        'Available commands.',
        '',
        ...Object.keys(terminal.commandList).map(
          (e: string) =>
            `  ${e.padEnd(15)} ${terminal.commandList[e].description}`
        ),
      ].join('\n\r')
    );
    return terminal.promptInput(true);
  },
  description: 'Prints command list',
};
const ffmpegCommand: Command = {
  exec: async (terminal: FFMpegTerminal): Promise<FFMpegTerminal> => {
    // load any system files referenced in the command into the wasm FS
    const foundSystemFiles =
      terminal.files.system?.filter((x) =>
        terminal.activeCommand.includes(x.name)
      ) ?? [];
    for (const systemFile of foundSystemFiles) {
      await terminal.ffmpegWasm.writeFile(
        systemFile.name,
        await fetchFile(systemFile.data)
      );
    }

    // command with arguments (quote-aware — needed for -filter_complex / -map)
    const cmdWithArgs = (() => {
      const args = parseCommandArgs(
        normalizeCommandText(terminal.activeCommand)
      );
      if (args[0]?.toLowerCase() === 'ffmpeg') {
        args.shift();
      }
      return args;
    })();

    const filesBefore = new Set(await listGeneratedFileNames(terminal));

    let exitCode = 1;
    try {
      exitCode = await terminal.ffmpegWasm.exec(cmdWithArgs);
    } catch {
      exitCode = 1;
    }

    const generatedFileNames = await listGeneratedFileNames(terminal);

    // Failed runs: drop partial outputs and skip Generated Files
    if (exitCode !== 0) {
      for (const filename of generatedFileNames) {
        if (filesBefore.has(filename)) continue;
        try {
          await terminal.ffmpegWasm.deleteFile(filename);
        } catch {
          // ignore cleanup errors
        }
      }
      terminal.promptInput();
      return terminal;
    }

    if (generatedFileNames.length > 0) {
      const generatedFiles: Array<IFFMpegFileSystem> = [];
      for (const filename of generatedFileNames) {
        const fileData = await terminal.ffmpegWasm.readFile(filename);
        if (typeof fileData === 'string') continue;

        const mimeType = (() => {
          const filenameParts = filename?.split('.');
          const hasExtension = filenameParts.length >= 1;
          return hasExtension
            ? getMimeType(filename?.split('.').at(-1))
            : 'text/plain';
        })();

        const url = URL.createObjectURL(
          new Blob([new Uint8Array(fileData)], { type: mimeType })
        );

        generatedFiles.push({
          data: url,
          name: filename,
          mimeType: mimeType,
        });
      }
      terminal.files.generated = generatedFiles;
      await terminal.onGeneratedFiles(generatedFiles);
    }

    terminal.promptInput();
    return terminal;
  },
  description: 'Hyper fast Audio and Video encoder',
};

/* Custom FFMpegWasm logger */
const ffmpegWasmLogger = (
  log: { type: string; message: string },
  terminal: FFMpegTerminal
): void => {
  // block log from printing if required
  const blockedLogs = ['FFMPEG_END'];
  if (blockedLogs.includes(log.message)) return;

  terminal.writeln(log.message);
};

/**
 * Extends functionality of xterm's terminals with ffmpeg commands
 */
export class FFMpegTerminal extends XTerminal {
  constructor(options?: IFFMpegTerminalOptions) {
    super(options);

    // the files to be used by ffmpeg
    if (options?.files) this.files = options?.files;

    if (options?.onGeneratedFiles) {
      this.onGeneratedFiles = options?.onGeneratedFiles;
    }

    // addon to fit terminal to parent container
    const fitAddon = new FitAddon();
    this.loadAddon(fitAddon);
    this.fitAddon = fitAddon;
  }

  /**
   * Block user input on terminal
   */
  private blockInput = false;

  /**
   * The prefix character of a terminal line
   */
  private prefixCharacter = `$ `;

  /**
   * The addon to fit terminal to container
   */
  private fitAddon: FitAddon;

  /**
   * The files that are used and generated by ffmpeg commands
   */
  readonly files: IFFmpegFiles = {
    system: [],
    generated: [],
  };

  /**
   * Active input from the user
   */
  activeCommand = '';

  /**
   * This list of commands available on the terminal
   */
  commandList: { [key: string]: Command } = {
    clear: clearCommand,
    help: helpCommand,
    ffmpeg: ffmpegCommand,
  };

  /**
   * FFMpeg.wasm instance
   */
  ffmpegWasm: FFmpeg = new FFmpeg();

  /**
   * Callback to run when files are generated by ffmpeg commands
   */
  onGeneratedFiles: (files: Array<IFFMpegFileSystem>) => Promise<void> =
    async () => undefined;

  /**
   * Prompt the user for input
   */
  promptInput(newLine = false): FFMpegTerminal {
    this.activeCommand = ''; // clear active command
    this.write(
      newLine ? `\r\n${this.prefixCharacter}` : `\r${this.prefixCharacter}`
    );
    return this;
  }

  /**
   * Clear the terminal
   */
  clear(): FFMpegTerminal {
    this.reset();
    super.clear();
    this.activeCommand = '';
    this.promptInput();
    return this;
  }

  /**
   * Fit terminal to container element
   */
  fitToContainer() {
    this.fitAddon.fit();
  }

  /**
   * Paste text into the terminal as a single-line command.
   * Newlines / shell line-continuations are collapsed so multi-line pastes work.
   */
  pasteText(text: string): FFMpegTerminal {
    const normalized = normalizeCommandText(text);

    if (!normalized) return this;

    this.write(normalized);
    this.activeCommand = this.activeCommand + normalized;
    return this;
  }

  /**
   * Replace the current input line with a command (used by Examples).
   */
  loadCommand(text: string): FFMpegTerminal {
    const normalized = normalizeCommandText(text);
    if (!normalized) return this;

    // Clear characters after the prompt on the current line
    const typedLength = Math.max(
      0,
      this.buffer.normal.cursorX - this.prefixCharacter.length
    );
    for (let i = 0; i < typedLength; i++) {
      this.write('\b \b');
    }

    this.activeCommand = '';
    this.write(normalized);
    this.activeCommand = normalized;
    this.focus();
    return this;
  }

  /**
   * Remove the last character from the terminal input
   */
  removeLastCharacter(): FFMpegTerminal {
    // don't remove the prefix character
    const hasPrefixCharacter =
      this.buffer.normal.cursorX > this.prefixCharacter.length;
    if (!hasPrefixCharacter) return this;

    // remove last character from the terminal
    this.write('\b \b');

    // remove last character from active command (user input)
    const hasActiveCommand = this.activeCommand.length > 0;
    if (hasActiveCommand) this.activeCommand = this.activeCommand.slice(0, -1);

    return this;
  }

  /**
   * Run a command from the available command list
   */
  async runCommand(): Promise<FFMpegTerminal> {
    // get the command type from active command (user input)
    const commandType = this.activeCommand.trim().split(' ')[0];

    if (commandType.length > 0) {
      this.writeln('');

      // run command if available in command list
      if (commandType in this.commandList) {
        await this.commandList[commandType].exec(this);
        this.activeCommand = ''; // clear active command (user input)
        return this;
      }

      this.writeln(`${commandType}: command not found`);
    }

    // clear active command (user input) and prompt input
    this.activeCommand = '';
    this.promptInput(true);

    return this;
  }

  /**
   * Load ffmpeg wasm
   * @returns boolean indicating success or failure
   */
  private async setupFFMpegWasm() {
    try {
      // add custom ffmpegWasm logger
      this.ffmpegWasm.on('log', (msg) => ffmpegWasmLogger(msg, this));

      // block user input
      this.blockInput = true;
      this.writeln('loading ffmpeg wasm...');

      // load ffmpeg wasm from CDN as same-origin blob URLs (works with COEP)
      // classWorkerURL must be an absolute same-origin URL so bundlers don't
      // rewrite the worker (Turbopack/webpack both struggle with the default)
      await this.ffmpegWasm.load({
        coreURL: await toBlobURL(
          `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`,
          'text/javascript'
        ),
        wasmURL: await toBlobURL(
          `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`,
          'application/wasm'
        ),
        classWorkerURL: `${window.location.origin}/ffmpeg/worker.js`,
      });

      // unblock user input
      this.blockInput = false;

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Add key listeners to the terminal
   */
  private attachKeyBindings() {
    /**
     * Add custom key event handlers
     */
    this.attachCustomKeyEventHandler((e) => {
      /**
       * Return early if input is blocked
       */
      if (this.blockInput) return true; // tell the custom handler to run other events

      /**
       * Key combinations with ctrl key
       */
      if (e.ctrlKey && e.type === 'keyup') {
        /**
         * CTRL + C: -> TODO: copy text to clipboard
         * (Paste is handled via onData — xterm delivers clipboard paste as one payload)
         */
        if (e.code === 'KeyC') {
          this.write('^C');
        }
      }

      /**
       * Remove last character if backspace key is pressed
       */
      if (e.code === 'Backspace' && e.type === 'keydown')
        this.removeLastCharacter();

      /**
       * Run command if enter key is pressed
       */
      if (e.code === 'Enter' && e.type === 'keydown') this.runCommand();

      return true; // tell the custom handler to run other events
    });

    /**
     * Listen to data events
     */
    this.onData((e) => {
      if (this.blockInput) return;

      // Enter is handled by the keydown handler above
      if (e === '\r' || e === '\n') return;

      // xterm delivers paste (incl. multi-line) as a single multi-char payload
      if (e.length > 1 || /[\r\n]/.test(e)) {
        this.pasteText(e);
        return;
      }

      /**
       * Check if a keyboard key is valid input
       * @param key - the keyboard key to check
       * @returns boolean indicating valid key
       */
      const isValidKey = (key: string) =>
        (key >= String.fromCharCode(0x20) &&
          key <= String.fromCharCode(0x7e)) ||
        key >= '\u00a0';

      if (isValidKey(e)) {
        this.activeCommand = this.activeCommand + e;
        this.write(e);
      }
    });
  }

  /**
   * Setup terminal with ffmpeg
   */
  async setup() {
    // add key bindings
    this.attachKeyBindings();

    // run help command
    this.commandList['help'].exec(this);

    // fit terminal to parent container
    this.fitToContainer();

    // load ffmpeg instance (store the result)
    const isSetup = await this.setupFFMpegWasm();

    // prompt input
    this.promptInput();

    // return load result
    return isSetup;
  }
}
