import { createFFmpeg, fetchFile, FFmpeg } from '@ffmpeg/ffmpeg';
import {
  ITerminalOptions as IXTerminalOptions,
  Terminal as XTerminal,
} from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import getMimeType from '../../utils/helpers/getMimeType';

/* Interfaces */
export interface IFFMpegFileSystem {
  name: string;
  data: string | Buffer | Blob | File;
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

/* Commands */
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
    // check if we need to load a file from ffmpeg files
    const foundSystemFile = terminal.files.system?.find((x) =>
      terminal.activeCommand.includes(x.name)
    );
    if (foundSystemFile) {
      await terminal.ffmpegWasm.FS(
        'writeFile',
        foundSystemFile.name,
        await fetchFile(foundSystemFile.data)
      );
    }

    // command with arguments
    const cmdWithArgs: Array<string> = (() => {
      // get command with args
      const tmpCmdWithArgs: Array<string> = terminal.activeCommand.split(' ');

      // remove the first ffmpeg from the command
      tmpCmdWithArgs[0].toLowerCase() === 'ffmpeg' && tmpCmdWithArgs.shift();

      return tmpCmdWithArgs;
    })();

    // run command on ffmpeg wasm
    await terminal.ffmpegWasm.run(...cmdWithArgs);

    // update generated files if a system file was loaded
    if (foundSystemFile) {
      // get system file names
      const systemFileNames = [
        '.',
        '..',
        'tmp',
        'home',
        'dev',
        'proc',
        ...(terminal.files?.system?.map((x) => x.name) || []),
      ];

      // get generated file names
      const homeDir: Array<string> = terminal.ffmpegWasm.FS('readdir', '/');
      const generatedFileNames = homeDir.filter(
        (entry) => !systemFileNames?.includes(entry)
      );

      // update ffmpeg generated files
      const generatedFiles: Array<IFFMpegFileSystem> = [];
      generatedFileNames.map((filename) => {
        // read file from ffmpeg filesystem
        const fileData = terminal.ffmpegWasm.FS('readFile', filename);

        // get file mimetype
        const mimeType = (() => {
          const filenameParts = filename?.split('.');
          const hasExtension = filenameParts.length >= 1;
          return hasExtension
            ? getMimeType(filename?.split('.').at(-1))
            : 'text/plain';
        })();

        // get file blob url
        const url = URL.createObjectURL(
          new Blob([fileData.buffer], { type: mimeType })
        );

        // add to generated files list
        generatedFiles.push({
          data: url,
          name: filename,
          mimeType: mimeType,
        });
      });
      terminal.files.generated = generatedFiles; // updated generated files list
      await terminal.onGeneratedFiles(generatedFiles); // call generated files handler
    }

    // prompt input and return
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
  ffmpegWasm: FFmpeg = createFFmpeg({
    corePath: '/files/ffmpeg/ffmpeg-core.js',
  });

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
      this.ffmpegWasm.setLogger((msg) => ffmpegWasmLogger(msg, this));

      // block user input
      this.blockInput = true;
      this.writeln('loading ffmpeg wasm...');

      // load ffmpeg wasm
      await this.ffmpegWasm.load();

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
         * CTRL + V: Paste the text from clipboard to the terminal
         */
        if (e.code === 'KeyV') {
          navigator.clipboard
            .readText()
            .then((text) => {
              this.write(text);
              this.activeCommand = this.activeCommand + text;
            })
            .catch(() => null);
        }

        /**
         * CTRL + C: -> TODO: copy text to clipboard
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
      /**
       * Check if a keyboard key is valid input
       * @param key - the keyboard key to check
       * @returns boolean indicating valid key
       */
      const isValidKey = (key: string) =>
        (key >= String.fromCharCode(0x20) &&
          key <= String.fromCharCode(0x7e)) ||
        key >= '\u00a0';

      /**
       * Write key to terminal if valid key is pressed
       */
      if (!this.blockInput && isValidKey(e)) {
        this.activeCommand = this.activeCommand + e; // store as active command (user input)
        this.write(e); // write to terminal
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
