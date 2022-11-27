import emptyListIllustration from "../public/empty_list.svg";
import {
  BackwardIcon,
  ChevronDownIcon,
  ForwardIcon,
  PauseIcon,
  PlayCircleIcon,
  PlayIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import { PictureType, TagType } from "jsmediatags/types";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import uuid from "react-uuid";

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
  id: string;
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
              id: uuid(),
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

function getPlayingPercentage(total: number, current: number): string {
  const progress = (current * 100) / total;
  return `${progress}%`;
}

type PlayerState = "playing" | "paused" | "idle";

function App() {
  const filePickerRef = useRef<HTMLInputElement>(null);
  const [playlist, setPlaylist] = useState<SongFile[]>([]);
  const [playingSong, setPlayingSong] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [isExpanded, setIsExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);

  const handlePlaySong = (songID: string) => {
    if (!audioRef.current) {
      throw new Error(
        "It seems like you forgot to add the ref to the audio element"
      );
    }

    // The song is already being played
    if (songID === playingSong) return;

    const songToPlay = playlist.find((song) => song.id === songID);
    if (!songToPlay) {
      throw new Error(`The song with ID:  ${songID} doesn't exist`);
    }

    setPlayingSong(songToPlay.id);
  };

  const nextTrack = () => {
    const currentIndex = playlist.findIndex((song) => song.id === playingSong);
    if (currentIndex === -1) {
      return console.warn("Couldn't find the current index");
    }

    if (currentIndex + 1 >= playlist.length - 1) {
      return console.log("cannot play next song");
    }

    const newTrack = playlist[currentIndex + 1];
    setPlayingSong(newTrack.id);
  };

  const previousTrack = () => {
    const currentIndex = playlist.findIndex((song) => song.id === playingSong);
    if (currentIndex === -1) {
      return console.warn("Couldn't find the current index");
    }

    if (currentIndex <= 0) {
      return console.log("cannot play previous song");
    }

    const newTrack = playlist[currentIndex - 1];
    setPlayingSong(newTrack.id);
  };

  // load new track
  useEffect(() => {
    if (!currentSong) return;
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const mediaURL = URL.createObjectURL(currentSong.file);
    audio.src = mediaURL;
    audio.onload = () => URL.revokeObjectURL(mediaURL);
  }, [playingSong]);

  // initialize player
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    function startPlaying() {
      setPlayerState("playing");
    }

    function setIdle() {
      setPlayerState("idle");
    }

    audio.addEventListener("loadstart", setIdle);
    audio.addEventListener("loadeddata", startPlaying);
    audio.addEventListener("ended", nextTrack);

    return () => {
      audio.removeEventListener("loadstart", setIdle);
      audio.removeEventListener("loadeddata", startPlaying);
      audio.removeEventListener("ended", nextTrack);
    };
  }, [playlist]);

  // moving the progress bar
  useLayoutEffect(() => {
    if (!audioRef.current) return;
    if (!progressBarRef.current) return;

    const audio = audioRef.current;
    const bar = progressBarRef.current;

    function updateProgressBar() {
      audio.currentTime;
      bar.style.setProperty(
        "width",
        getPlayingPercentage(audio.duration, audio.currentTime)
      );
    }

    audioRef.current.addEventListener("timeupdate", updateProgressBar);
    return () =>
      audioRef.current?.removeEventListener("timeupdate", updateProgressBar);
  }, [playingSong, playlist]);

  // Pausing and playing
  useEffect(() => {
    if (!audioRef.current) return;
    if (playerState === "paused") {
      audioRef.current.pause();
      return;
    }

    if (playerState === "playing") {
      audioRef.current.play();
    }
  }, [playerState]);

  const handleInputFileChange = async () => {
    if (!filePickerRef.current) return;

    const newFileList = filePickerRef.current.files;
    const playList = await getSongsFromFiles(newFileList);
    setPlaylist((pfl) => [...pfl, ...playList]);
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
            accept="audio/*"
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
                className="grid mt-6 mx-auto grid-cols-[auto_auto] gap-2 items-center bg-sky-500 px-6 py-2 rounded-lg  font-semibold text-white hover:bg-sky-600 active:bg-sky-700"
              >
                <span>Agregar canciones</span>
              </button>
            </div>
          )}
        </section>
      </div>
      {/* Player screen */}
      <div
        className={`bg-sky-50 border-t-4 border-sky-200 relative transition-all ${
          isExpanded ? "h-screen" : ""
        } ${playlist.length === 0 ? "hidden" : ""}`}
      >
        <audio className="sr-only" controls ref={audioRef} />
        <span className="absolute -top-1 h-1 bg-sky-600" ref={progressBarRef} />

        {/* Mini player */}
        <div
          className={`grid gap-2 
            ${isExpanded && "grid-cols-1"}
            ${!isExpanded && "grid-cols-[auto_1fr]"}
            `}
        >
          <div
            className={`bg-slate-200 w-20 aspect-square ${
              isExpanded ? "hidden" : ""
            }`}
            onClick={() => setIsExpanded((pe) => !pe)}
          >
            <img src={currentSong?.cover} alt="" />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center">
            <div className="">
              {!isExpanded && (
                <>
                  <div className="text-lg font-bold">{currentSong?.title}</div>
                  <div>{currentSong?.artist}</div>
                </>
              )}
            </div>
            <div className=" px-4 h-full grid items-center grid-flow-col gap-3">
              {playerState === "playing" && !isExpanded ? (
                <button onClick={() => setPlayerState("paused")}>
                  <PauseIcon className="w-8 fill-slate-600 hover:fill-slate-500 active:fill-slate-400" />
                </button>
              ) : null}

              {playerState === "paused" && !isExpanded ? (
                <button onClick={() => setPlayerState("playing")}>
                  <PlayIcon className="w-8 fill-slate-600 hover:fill-slate-500 active:fill-slate-400" />
                </button>
              ) : null}

              {!isExpanded && (
                <button onClick={() => nextTrack()}>
                  <ForwardIcon className="w-8 fill-slate-600 hover:fill-slate-500 active:fill-slate-400" />
                </button>
              )}

              {isExpanded && (
                <button onClick={() => setIsExpanded(false)} className="mb-4">
                  <ChevronDownIcon className="w-8" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`${!isExpanded ? "hidden" : ""} fill-red-300`}>
          <div className="bg-slate-200 max-w-sm w-full mx-auto aspect-square">
            <img src={currentSong?.cover} className="object-cover w-full" />
          </div>
          <div className="mx-auto mt-4 justify-center gap-8 max-w-sm grid grid-cols-[auto_auto_auto] auto-rows-[auto] grid-rows-[2rem]">
            <button onClick={() => previousTrack()}>
              <BackwardIcon className="w-8 fill-slate-600 hover:fill-slate-500 active:fill-slate-400" />
            </button>
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

            <button onClick={() => nextTrack()}>
              <ForwardIcon className="w-8 fill-slate-600 hover:fill-slate-500 active:fill-slate-400" />
            </button>
          </div>
          <h1 className="text-center font-bold text-lg mt-8">
            {currentSong?.title}
          </h1>
          <h2 className="text-center mt-2">
            {currentSong?.artist} - {currentSong?.album}
          </h2>
        </div>
      </div>
    </main>
  );
}
type SongFilePreviewProps = {
  song: SongFile;
  onPlay: (id: string) => void;
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
    </div>
  );
}

export default App;
