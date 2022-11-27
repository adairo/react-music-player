import { Tab } from "@headlessui/react";
// import { read } from "jsmediatags";
import emptyListIllustration from "../public/empty_list.svg";

import {
  FolderIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import { PictureType, Tags, TagType } from "jsmediatags/types";
import { ReactNode, useEffect, useRef, useState } from "react";

function App() {
  return (
    <Tab.Group>
      <div className="grid grid-rows-[calc(100vh_-_5.5rem)_5.5rem] h-screen">
        <Tab.Panels className="h-full overflow-y-scroll">
          <Tab.Panel className="">
            <MusicLibrary />
          </Tab.Panel>
          <Tab.Panel>Content 2</Tab.Panel>
          <Tab.Panel>Content 3</Tab.Panel>
        </Tab.Panels>
        <div className="bg-sky-800 grid place-items-center">
          <Tab.List className="max-w-xs flex gap-10 ">
            <Tab className="flex flex-col items-center text-center gap-1 focus:outline-none">
              <div className="ui-selected:bg-sky-600 px-3 py-1 rounded-3xl">
                <FolderIcon className="w-8 text-sky-200" />
              </div>
              <div className="text-sky-100 font-semibold">Biblioteca</div>
            </Tab>
            <Tab className="flex flex-col items-center text-center gap-1 focus:outline-none">
              <div className="ui-selected:bg-sky-600  px-3 py-1 rounded-3xl">
                <MusicalNoteIcon className="w-8 text-sky-200" />
              </div>
              <div className="text-sky-100 font-semibold">Reproduciendo</div>
            </Tab>
            <Tab className="flex flex-col items-center text-center gap-1 focus:outline-none">
              <div className="ui-selected:bg-sky-600  px-3 py-1 rounded-3xl">
                <ListBulletIcon className="w-8 text-sky-200" />
              </div>
              <div className="text-sky-100 font-semibold">Listas</div>
            </Tab>
          </Tab.List>
        </div>
      </div>
    </Tab.Group>
  );
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

function MusicLibrary() {
  const filePickerRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playlist, setPlaylist] = useState<SongFile[]>([]);
  const [playingSong, setPlayingSong] = useState<File | null>(null);

  const handlePlaySong = (title: string, file: File) => {
    if (!audioRef.current) {
      throw new Error(
        "It seems like you forgot to add the ref to the audio element"
      );
    }

    setPlayingSong(file);
    console.log("Playing the song: ", title);

    const mediaURL = URL.createObjectURL(file);
    audioRef.current.src = mediaURL;
    audioRef.current.onload = (e) => URL.revokeObjectURL(mediaURL);
  };

  const handleInputFileChange = async () => {
    if (!filePickerRef.current) return;

    const newFileList = filePickerRef.current.files;
    const playList = await getSongsFromFiles(newFileList);
    setPlaylist(playList);
  };
  return (
    <div className="">
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
      <section className="space-y-4 p-4  ">
        {playlist.map((song) => (
          <SongFilePreview onPlay={handlePlaySong} key={song.id} song={song} />
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
              className="grid mt-6 mx-auto grid-cols-[auto_auto] gap-2 items-center bg-sky-500 px-3 py-2 rounded-lg  font-semibold text-white hover:bg-slate-200 active:bg-slate-300"
            >
              <span>Agregar canciones</span>
            </button>
          </div>
        )}
      </section>
      <audio className="w-full rounded-full" autoPlay controls ref={audioRef} />
    </div>
  );
}

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

type SongFilePreviewProps = {
  song: SongFile;
  onPlay: (title: string, file: File) => void;
};

function SongFilePreview({ song, onPlay }: SongFilePreviewProps) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center group">
      <div className="w-14 aspect-square bg-slate-300 relative grid place-items-center group">
        <img src={song.cover} />
        <PlayCircleIcon
          onClick={() => onPlay(song.title, song.file)}
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
