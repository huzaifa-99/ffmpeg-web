import { ChangeEvent, useRef, useState } from 'react';
import { IFFMpegFileSystem } from '../../FFMpegTerminal/Terminal';

interface IFileSystem {
  blobURL: string;
  fileName: string;
  isDownloadable: boolean;
  isRemovable: boolean;
  mimeType: string;
}

/**
 * A custom hook to abstract Home component's logic from UI
 */
const useHome = () => {
  const filePickerElRef = useRef<HTMLInputElement>(null);
  const [ffmpegFileSystem, setFFmpegFileSystem] = useState<Array<IFileSystem>>(
    []
  );
  const [ffmpegGeneratedFiles, setFFmpegGeneratedFiles] = useState<
    Array<IFileSystem>
  >([]);

  /**
   * Adds picked files to ffmpeg file system
   * @param event - change event of input element
   * @returns
   */
  const addPickedFilesToFFMpegFileSystem = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    // get picked files
    const files = event.target.files;
    if (!files) return;

    // generate file blob and add to file system state
    {
      const newFileSystem = [...ffmpegFileSystem];

      Array.from(files).forEach((file: File) => {
        const url = URL.createObjectURL(file); // create blob url

        newFileSystem.push({
          blobURL: url,
          fileName: file.name,
          isDownloadable: false,
          isRemovable: true,
          mimeType: file.type,
        });
      });

      setFFmpegFileSystem([...newFileSystem]);
    }
  };

  /**
   * Download a file to user's system
   * @param blobURL - the blob url of file to download
   * @param fileName - the download name of the file
   */
  const downloadFile = (blobURL: string, fileName: string) => {
    const anchor = document.createElement('a');
    anchor.href = blobURL;
    anchor.download = fileName;
    anchor.click();
  };

  /**
   * Removes a file from ffmpeg file system
   * @param blobURL - the blob url or the file to remove
   */
  const removeFileFromFileSystem = (blobURL: string) => {
    // remove blob url references
    URL.revokeObjectURL(blobURL);

    // update ffmpeg file system
    const fileSystem = [...ffmpegFileSystem].filter(
      (x) => x.blobURL !== blobURL
    );
    setFFmpegFileSystem(fileSystem);
  };

  /**
   * Opens a blob file in a new tab
   * @param blobURL - the blob url of the file to view
   */
  const viewBlobFile = (blobURL: string) => {
    window.open(blobURL, '_blank');
  };

  /**
   * Store new files in ffmpeg generated files
   * @param files - the files to add to ffmpeg generated files
   */
  const storeGeneratedFiles = async (
    files: Array<IFFMpegFileSystem>
  ): Promise<void> => {
    const newGeneratedFiles: Array<IFileSystem> = files.map((x) => ({
      blobURL: x.data as string,
      mimeType: x.mimeType,
      fileName: x.name,
      isDownloadable: true,
      isRemovable: false,
    }));

    setFFmpegGeneratedFiles((ffmpegFiles: Array<IFileSystem>) => {
      ffmpegFiles.push(...newGeneratedFiles);
      return [...ffmpegFiles];
    });
  };

  /**
   * Opens the user's system file selection window
   */
  const openFileSelectionWindow = () => filePickerElRef.current?.click();

  return {
    filePickerElRef,
    ffmpegFileSystem,
    ffmpegGeneratedFiles,
    openFileSelectionWindow,
    addPickedFilesToFFMpegFileSystem,
    downloadFile,
    removeFileFromFileSystem,
    storeGeneratedFiles,
    viewBlobFile,
  };
};

export default useHome;
