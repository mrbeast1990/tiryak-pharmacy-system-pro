import {
  require_jsx_runtime
} from "./chunk-GS3MFVWF.js";
import {
  require_react
} from "./chunk-3M4DNIO5.js";
import {
  __toESM
} from "./chunk-4B2QHNJT.js";

// node_modules/.bun/@radix-ui+react-direction@1.1.0+d2b1a511eef311f2/node_modules/@radix-ui/react-direction/dist/index.mjs
var React = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var DirectionContext = React.createContext(void 0);
function useDirection(localDir) {
  const globalDir = React.useContext(DirectionContext);
  return localDir || globalDir || "ltr";
}

export {
  useDirection
};
//# sourceMappingURL=chunk-O53R7L6J.js.map
