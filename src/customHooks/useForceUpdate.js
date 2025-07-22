import { useState } from "react";

function useForceUpdate() {
  const [val, setVal] = useState(0); // integer state
  return () => setVal((val) => val + 1); // update the state to force render
}

export default useForceUpdate;
