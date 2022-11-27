import { Tab } from "@headlessui/react";
// import { read } from "jsmediatags";

const songs = [
  { title: "Zanzibar", artist: "Billy Joel", duration: "4:34" },
  { title: "We are the champions", artist: "Queen", duration: "5:23" },
  { title: "Heart of the sunrise", artist: "Yes", duration: "2:23" },
  { title: "How does it feel", artist: "Toto", duration: "5:23" },
  { title: "We are the champions", artist: "Queen", duration: "5:23" },
  { title: "Heart of the sunrise", artist: "Yes", duration: "2:23" },
  { title: "How does it feel", artist: "Toto", duration: "5:23" },
];

import {
  FolderIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
} from "@heroicons/react/20/solid";
import { TagType } from "jsmediatags/types";
import { ReactNode, useEffect, useRef, useState } from "react";

type SongList = typeof songs;
type Song = SongList[number];

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

function MusicLibrary() {
  const filePickerRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [fileList, setFileList] = useState<File[]>([]);
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

  const handleInputFileChange = () => {
    if (!filePickerRef.current) return;

    const newFileList = filePickerRef.current.files;
    if (newFileList?.length === 0) {
      return setFileList([]);
    }

    setFileList(Array.from(filePickerRef.current.files ?? []));
  };
  return (
    <div className="">
      <header className="flex gap-2 items-center p-4">
        <h1 className="font-bold text-slate-400 text-lg">
          Todas las canciones
        </h1>
        {/* <button className="bg-slate-100 px-2 rounded-lg font-semibold hover:bg-slate-200 py-2">
          <MagnifyingGlassIcon className="w-4" />
        </button> */}
        <input
          ref={filePickerRef}
          type="file"
          name="audio-select"
          id="audio-select"
          accept=".mp3"
          onChange={handleInputFileChange}
          multiple
        />
      </header>
      <section className="space-y-4 p-4  ">
        {fileList.map((file) => (
          <SongFilePreview
            onPlay={handlePlaySong}
            key={file.name}
            file={file}
          />
        ))}
      </section>
      <audio className="w-full" autoPlay controls ref={audioRef} />
    </div>
  );
}

type SongFilePreviewProps = {
  file: File;
  onPlay: (title: string, file: File) => void;
};

function SongFilePreview({ file, onPlay }: SongFilePreviewProps) {
  const [metadata, setMetadata] = useState<TagType["tags"] | null>(null);

  useEffect(() => {
    const jsmediatags = window.jsmediatags;
    new jsmediatags.Reader(file)
      .setTagsToRead(["title", "artist", "picture", "album"])
      .read({
        onSuccess(data) {
          setMetadata(data.tags);
        },
        onError(error) {
          console.error(
            "🚀 ~ file: App.tsx ~ line 118 ~ onError ~ error",
            error
          );
        },
      });
  }, [file]);

  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <div className="w-14 aspect-square bg-slate-300 relative grid place-items-center group">
        <PlayCircleIcon
          onClick={() => onPlay(metadata?.title ?? "Unknow", file)}
          className="w-8 hidden group-hover:[display:block] absolute hover:scale-110 transition-transform origin-center active:scale-90 opacity-50 active:opacity-70"
        />
      </div>
      <div>
        <div className="flex gap-2 items-center">
          <p className="font-bold text-lg text-slate-800">{metadata?.title}</p>
        </div>
        <p>
          {metadata?.artist} -{" "}
          <span className="text-slate-500">{metadata?.album}</span>
        </p>
      </div>
    </div>
  );
}

export default App;
