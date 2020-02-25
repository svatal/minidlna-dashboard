import * as b from "bobril";
import { useFetchMyData } from "./data/data";
import { Dirs } from "./dir";

export function App() {
  const { store, error, loading } = useFetchMyData();
  if (!store) {
    if (loading) return <>"loading"</>;
    else return <>{error}</>;
  }
  return <Dirs store={store} />;
}
