import {
  useLayoutEffect2
} from "./chunk-W7UQSP4U.js";
import {
  require_react
} from "./chunk-3M4DNIO5.js";
import {
  __toESM
} from "./chunk-4B2QHNJT.js";

// node_modules/.bun/@radix-ui+react-id@1.1.0+d2b1a511eef311f2/node_modules/@radix-ui/react-id/dist/index.mjs
var React = __toESM(require_react(), 1);
var useReactId = React["useId".toString()] || (() => void 0);
var count = 0;
function useId(deterministicId) {
  const [id, setId] = React.useState(useReactId());
  useLayoutEffect2(() => {
    if (!deterministicId) setId((reactId) => reactId ?? String(count++));
  }, [deterministicId]);
  return deterministicId || (id ? `radix-${id}` : "");
}

export {
  useId
};
//# sourceMappingURL=chunk-KEVYKVIV.js.map
