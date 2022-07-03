import { ChangeEvent, useCallback, useRef, useState } from 'react';
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
   * Loads sample files from the server for processing by ffmpeg
   */
  const loadSampleFiles = useCallback(async () => {
    // filename and path of sample files on server
    const folder = `/files/media`;
    const files = [
      'sample_img1.jpg',
      'sample_img2.jpg',
      'sample_video.mp4',
      'sample_audio.mp3',
    ];

    // generate file blob and add to file system state
    {
      const newFileSystem: Array<IFileSystem> = [];

      /**
       * 1- loop over sample files map
       * 2- fetch each file from server
       * 3- generate file system obj for each file
       */
      await Promise.all(
        files?.map(async (fileName) => {
          await fetch(`${folder}/${fileName}`)
            .then((res) => res.blob())
            .then(async (blob) => {
              const url = URL.createObjectURL(blob);
              const file = {
                blobURL: url,
                fileName: fileName,
                isDownloadable: true,
                isRemovable: true,
                mimeType: blob.type,
              };
              newFileSystem.push(file);
            })
            .catch(() => null);
        })
      );

      setFFmpegFileSystem(newFileSystem);
    }
  }, []);

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
    loadSampleFiles,
  };
};

export default useHome;
