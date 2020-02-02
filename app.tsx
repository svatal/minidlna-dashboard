import * as b from "bobril";
import { useFetchMyData } from "./data/data";
import { Dirs } from "./dir";

export function App() {
  const { data, error, loading } = useFetchMyData();
  if (!data) {
    if (loading) return <>"loading"</>;
    else return <>{error}</>;
  }
  return <Dirs dirs={data} />;
}
