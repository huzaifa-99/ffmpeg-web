export interface IExampleCommand {
  id: string;
  title: string;
  description: string;
  command: string;
}

/**
 * Sample FFmpeg commands that work with the bundled media files.
 */
export const EXAMPLE_COMMANDS: IExampleCommand[] = [
  {
    id: 'image-to-video',
    title: 'Image → video',
    description: 'Loop a still image into a 3-second H.264 clip.',
    command:
      'ffmpeg -loop 1 -i sample_img1.jpg -t 3 -c:v libx264 -pix_fmt yuv420p sample_image_video.mp4',
  },
  {
    id: 'trim-video',
    title: 'Trim video',
    description: 'Cut the first 3 seconds from the sample video.',
    command:
      'ffmpeg -i sample_video.mp4 -t 3 -c:v libx264 -pix_fmt yuv420p -an trimmed.mp4',
  },
  {
    id: 'trim-audio',
    title: 'Trim audio',
    description: 'Cut a 10-second AAC clip from the sample MP3.',
    command: 'ffmpeg -i sample_audio.mp3 -t 10 -c:a aac audio_clip.m4a',
  },
  {
    id: 'slideshow-concat',
    title: 'Slideshow + audio',
    description:
      'Concat two images and the sample video, then mux with the sample audio.',
    command:
      'ffmpeg -loop 1 -t 5 -i sample_img1.jpg -i sample_video.mp4 -loop 1 -t 5 -i sample_img2.jpg -i sample_audio.mp3 -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]" -map "[v]" -map 3:a -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac output.mp4',
  },
];
