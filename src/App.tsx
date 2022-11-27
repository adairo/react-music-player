import { Tab } from "@headlessui/react";

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
import { ReactNode, useRef, useState } from "react";

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
  const audioRef = useRef<HTMLInputElement>(null);
  const [fileList, setFileList] = useState<FileList | null>(null);
  console.log(
    "🚀 ~ file: App.tsx ~ line 66 ~ MusicLibrary ~ fileList",
    fileList
  );

  const handleInputFileChange = () => {
    if (!audioRef.current) return;

    const newFileList = audioRef.current.files;
    if (newFileList?.length === 0) {
      return setFileList(null);
    }

    setFileList(audioRef.current.files);
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
          ref={audioRef}
          type="file"
          name="audio-select"
          id="audio-select"
          accept=".mp3"
          onChange={handleInputFileChange}
          multiple
        />
      </header>
      <section className="space-y-4 p-4  ">
        {Array.from(fileList ?? []).map((file) => (
          <SongFilePreview file={file} />
        ))}
      </section>
    </div>
  );
}

function SongFilePreview({ file }: { file: File }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <div className="w-14 aspect-square bg-slate-300 relative grid place-items-center group">
        <PlayCircleIcon className="w-8 hidden group-hover:[display:block] absolute hover:scale-110 transition-transform origin-center active:scale-90 opacity-50 active:opacity-70" />
      </div>
      <div>
        <div className="flex gap-2 items-center">
          <p className="font-bold text-lg text-slate-800">{file.name}</p>
          <span className="text-slate-800 text-sm  rounded-full p-1">
            {file.size.toFixed(3)}
          </span>
        </div>
        <p>unknow</p>
      </div>
    </div>
  );
}

export default App;
