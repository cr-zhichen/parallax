import { ModelExplorer } from "@/components/model-explorer";
import { getModelCatalog } from "@/lib/artificial-analysis";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await getModelCatalog();

  return <ModelExplorer initialCatalog={catalog} />;
}
