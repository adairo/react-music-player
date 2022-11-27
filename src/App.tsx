import emptyListIllustration from "../public/empty_list.svg";
import {
  PauseIcon,
  PlayCircleIcon,
  PlayIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import { PictureType, TagType } from "jsmediatags/types";
import { useEffect, useRef, useState } from "react";

function getImageURLFromPicture(picture: PictureType | undefined) {
  if (!picture) return "";

  const { data, format } = picture;
  const base64 = data.reduce(
    (url, current) => url + String.fromCharCode(current),
    ""
  );
  const url = `data:${format};base64,${window.btoa(base64)}`;
  return url;
}

const tagsToRead = ["title", "artist", "picture", "album"] as const;
type SelectedTags = Pick<TagType["tags"], typeof tagsToRead[number]>;

type SongFile = Required<Omit<SelectedTags, "picture">> & {
  file: File;
  id: number;
  cover: string;
};

async function getSongsFromFiles(fileList: FileList | null) {
  const files = Array.from(fileList ?? []);
  const jsmediatags = window.jsmediatags;

  const filePromises: Promise<SongFile>[] = files.map((file, index) => {
    return new Promise((resolve, reject) => {
      new jsmediatags.Reader(file)
        .setTagsToRead(tagsToRead as unknown as string[])
        .read({
          onSuccess(data) {
            const { tags } = data;
            const coverURL = getImageURLFromPicture(tags.picture);
            const result = {
              title: tags.title ?? "",
              artist: tags.artist ?? "Unknow",
              album: tags.album ?? "",
              cover: coverURL ?? "",
              file: file,
              id: index,
            };
            resolve(result);
          },
          onError(error) {
            reject({ error });
          },
        });
    });
  });

  const playList = await Promise.all(filePromises);
  return playList;
}

type PlayerState = "playing" | "paused" | "idle";

function App() {
  const filePickerRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playlist, setPlaylist] = useState<SongFile[]>([]);
  const [playingSong, setPlayingSong] = useState<number | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");

  const handlePlaySong = (songID: number) => {
    if (!audioRef.current) {
      throw new Error(
        "It seems like you forgot to add the ref to the audio element"
      );
    }

    const songToPlay = playlist.find((song) => song.id === songID);
    if (!songToPlay) {
      throw new Error(`The song with ID:  ${songID} doesn't exist`);
    }

    setPlayingSong(songToPlay.id);
    setPlayerState("playing");
    const mediaURL = URL.createObjectURL(songToPlay.file);
    audioRef.current.src = mediaURL;
    audioRef.current.onload = (e) => URL.revokeObjectURL(mediaURL);
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (playerState === "paused") {
      audioRef.current.pause();
      return;
    }

    if (playerState === "playing") {
      audioRef.current.play()
    }
  }, [playerState]);

  const handleInputFileChange = async () => {
    if (!filePickerRef.current) return;

    const newFileList = filePickerRef.current.files;
    const playList = await getSongsFromFiles(newFileList);
    setPlaylist(playList);
  };

  const currentSong = playlist.find((song) => song.id === playingSong);
  return (
    <main className="grid grid-rows-[1fr_auto] h-screen">
      <div className=" h-full overflow-y-scroll">
        <header className="flex gap-2 items-center justify-between p-4">
          <h1 className="font-bold text-slate-400 text-lg">
            Todas las canciones
          </h1>

          <button
            onClick={() => filePickerRef.current?.click()}
            className="grid grid-cols-[auto_auto] gap-2 items-center bg-slate-100 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-200 active:bg-slate-300"
          >
            <span>Agregar canciones</span>
            <PlusIcon className="w-6" />
          </button>

          <input
            ref={filePickerRef}
            className="sr-only"
            type="file"
            name="audio-select"
            id="audio-select"
            accept=".mp3"
            onChange={handleInputFileChange}
            multiple
          />
        </header>
        <section className="space-y-4 p-4 mt-6 ">
          {playlist.map((song) => (
            <SongItem
              onPlay={handlePlaySong}
              isPlaying={playingSong === song.id}
              key={song.id}
              song={song}
            />
          ))}
          {playlist.length === 0 && (
            <div className="max-w-xs mx-auto">
              <img src={emptyListIllustration} alt="" className="" />
              <p className="text-lg text-slate-500 mt-6 px-2 font-semibold">
                Agrega tus canciones favoritas para empezar a disfrutar de tu
                biblioteca{" "}
              </p>
              <button
                onClick={() => filePickerRef.current?.click()}
                className="grid mt-6 mx-auto grid-cols-[auto_auto] gap-2 items-center bg-sky-500 px-3 py-2 rounded-lg  font-semibold text-white hover:bg-sky-600 active:bg-sky-700"
              >
                <span>Agregar canciones</span>
              </button>
            </div>
          )}
        </section>
      </div>
      {/* Mini player */}
      <div className="bg-slate-100 shadow-[0_-2px_4px_rgba(0,0,0,0.25)] relative ">
        <span className="absolute top-0 h-1 w-1 bg-slate-600" />
        <audio className="sr-only" autoPlay controls ref={audioRef} />
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <div className="bg-slate-200 w-20 aspect-square">
            <img src={currentSong?.cover} alt="" />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center">
            <div>
              <div className="text-lg font-bold">{currentSong?.title}</div>
              <div>{currentSong?.artist}</div>
            </div>
            <div className=" px-4 h-full grid items-center">
              {playerState === "playing" ? (
                <button onClick={() => setPlayerState("paused")}>
                  <PauseIcon className="w-8 fill-slate-600 hover:fill-slate-500 active:fill-slate-400" />
                </button>
              ) : null}

              {playerState === "paused" ? (
                <button onClick={() => setPlayerState("playing")}>
                  <PlayIcon className="w-8 fill-slate-600 hover:fill-slate-500 active:fill-slate-400" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
type SongFilePreviewProps = {
  song: SongFile;
  onPlay: (id: number) => void;
  isPlaying: boolean;
};

function SongItem({ song, onPlay, isPlaying }: SongFilePreviewProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] gap-2 items-center group ${
        isPlaying ? "bg-sky-100" : ""
      }`}
    >
      <div className="w-14 aspect-square bg-slate-300 relative grid place-items-center group">
        <img src={song.cover} />
        <PlayCircleIcon
          onClick={() => onPlay(song.id)}
          className="w-full bg-slate-800 text-white hidden group-hover:[display:block] absolute transition-transform origin-center active:scale-90 opacity-70 active:opacity-70"
        />
      </div>
      <div>
        <div className="flex gap-2 items-center">
          <p className="font-bold text-lg text-slate-800">{song.title}</p>
        </div>
        <p>
          {song.artist} - <span className="text-slate-500">{song.album}</span>
        </p>
      </div>
      <div className="hidden group-hover:block">
        <HeartIcon className="w-6 stroke-slate-400 hover:fill-red-100 active:stroke-none active:fill-red-200 active:scale-110" />
      </div>
    </div>
  );
}

export default App;
