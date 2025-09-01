import { sampleData } from "@/lib/utils/treeUtils";
import { CustomTree } from "./components/custom-tree";

export default function Home() {
  return (
    <div className="bg-gray-300">
      <main>
        <div className="w-75 p-5 m-5">
          <CustomTree data={sampleData()} />
        </div>
      </main>
    </div>
  );
}
