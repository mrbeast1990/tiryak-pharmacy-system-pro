import {
  require_react
} from "./chunk-3M4DNIO5.js";
import {
  __toESM
} from "./chunk-4B2QHNJT.js";

// node_modules/.bun/@radix-ui+react-use-previous@1.1.0+d2b1a511eef311f2/node_modules/@radix-ui/react-use-previous/dist/index.mjs
var React = __toESM(require_react(), 1);
function usePrevious(value) {
  const ref = React.useRef({ value, previous: value });
  return React.useMemo(() => {
    if (ref.current.value !== value) {
      ref.current.previous = ref.current.value;
      ref.current.value = value;
    }
    return ref.current.previous;
  }, [value]);
}

export {
  usePrevious
};
//# sourceMappingURL=chunk-CRZUIOMY.js.map
