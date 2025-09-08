import { CustomTree } from "./components/tree";

export default function Home() {
  return (
    <div className="bg-gray-white">
      <main>
        <div className="w-75 p-5 m-5">
          <CustomTree />
          {/* <DragabbleTree data={sampleData()} useChevron={false} /> */}
        </div>
      </main>
    </div>
  );
}
