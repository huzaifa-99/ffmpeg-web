import dynamic from 'next/dynamic';
import { FC } from 'react';
import { AiFillEye } from 'react-icons/ai';
import { BsFillTrash2Fill } from 'react-icons/bs';
import { TbDownload } from 'react-icons/tb';
import FileTree from '../../FileTree/FileTree';
import styles from './Home.module.css';
import useHome from './useHome';

const FFMpegTerminal = dynamic(
  () => import('../../FFMpegTerminal/FFMpegTerminal'),
  /**
   * Note: its important to load this component on client side
   * Reason: the xterm terminal uses some browser apis
   */
  { ssr: false }
);

const Home: FC = () => {
  const {
    ffmpegFileSystem,
    ffmpegGeneratedFiles,
    filePickerElRef,
    downloadFile,
    removeFileFromFileSystem,
    addPickedFilesToFFMpegFileSystem,
    storeGeneratedFiles,
    viewBlobFile,
    openFileSelectionWindow,
  } = useHome();

  return (
    <main className={styles.container}>
      <div className={styles.ffmpegContainer}>
        <div className={styles.terminalContainer}>
          <FFMpegTerminal
            systemFiles={ffmpegFileSystem?.map((x) => ({
              name: x.fileName,
              data: x.blobURL,
              mimeType: x.mimeType,
            }))}
            onGeneratedFiles={storeGeneratedFiles}
          />
        </div>
        <div className={styles.fileSystemContainer}>
          <input
            ref={filePickerElRef}
            type="file"
            onChange={addPickedFilesToFFMpegFileSystem}
            multiple
            hidden
          />
          <div className={styles.fileSystem}>
            <FileTree
              name="File System"
              key="files-system"
              tooltip={
                <p className={styles.tooltip}>
                  Files which you can use with the ffmpeg commands. You can also
                  upload your own.
                  <br />
                  <br />
                  <span className={styles.tooltipEmText}>
                    Disclaimer:&nbsp;
                  </span>
                  <br />
                  <span>
                    - Your files are not uploaded to any server or database.
                  </span>
                  <br />
                  <span>
                    - For better results please only process files with size
                    less than 1 GB.
                  </span>
                </p>
              }
              files={ffmpegFileSystem?.map((x) => ({
                name: x.fileName,
                actionButtons: [
                  {
                    icon: <AiFillEye color="#ffffff" />,
                    onClick: () => viewBlobFile(x.blobURL),
                  },
                  {
                    icon: <TbDownload color="#ffffff" />,
                    onClick: () => downloadFile(x.blobURL, x.fileName),
                  },
                  {
                    icon: <BsFillTrash2Fill color="#ffffff" />,
                    onClick: () => removeFileFromFileSystem(x.blobURL),
                  },
                ],
              }))}
              actionButtons={[
                {
                  text: 'Upload Files',
                  onClick: openFileSelectionWindow,
                },
              ]}
            />
          </div>
          <div className={styles.fileSystem}>
            <FileTree
              name="Generated Files"
              key="generated-files"
              tooltip={
                <p className={styles.tooltip}>
                  Files which you have processed with the ffmpeg commands will
                  appear here
                </p>
              }
              files={ffmpegGeneratedFiles?.map((x) => ({
                name: x.fileName,
                actionButtons: [
                  {
                    icon: <AiFillEye color="#ffffff" />,
                    onClick: () => viewBlobFile(x.blobURL),
                  },
                  {
                    icon: <TbDownload color="#ffffff" />,
                    onClick: () => downloadFile(x.blobURL, x.fileName),
                  },
                ],
              }))}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;
