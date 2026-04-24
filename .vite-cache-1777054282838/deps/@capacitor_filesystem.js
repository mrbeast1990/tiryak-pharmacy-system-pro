import {
  Directory,
  Encoding,
  FilesystemDirectory,
  FilesystemEncoding
} from "./chunk-NBY5RP5Y.js";
import {
  registerPlugin
} from "./chunk-L6MM7KRQ.js";
import "./chunk-4B2QHNJT.js";

// node_modules/.bun/@capacitor+synapse@1.0.2/node_modules/@capacitor/synapse/dist/synapse.mjs
function s(t) {
  t.CapacitorUtils.Synapse = new Proxy(
    {},
    {
      get(e, o) {
        return new Proxy({}, {
          get(w, r) {
            return (c, p, n) => {
              const i = t.Capacitor.Plugins[o];
              if (i === void 0) {
                n(new Error(`Capacitor plugin ${o} not found`));
                return;
              }
              if (typeof i[r] != "function") {
                n(new Error(`Method ${r} not found in Capacitor plugin ${o}`));
                return;
              }
              (async () => {
                try {
                  const a = await i[r](c);
                  p(a);
                } catch (a) {
                  n(a);
                }
              })();
            };
          }
        });
      }
    }
  );
}
function u(t) {
  t.CapacitorUtils.Synapse = new Proxy(
    {},
    {
      get(e, o) {
        return t.cordova.plugins[o];
      }
    }
  );
}
function y(t = false) {
  window.CapacitorUtils = window.CapacitorUtils || {}, window.Capacitor !== void 0 && !t ? s(window) : window.cordova !== void 0 && u(window);
}

// node_modules/.bun/@capacitor+filesystem@7.1.1+0643ca87b09ab524/node_modules/@capacitor/filesystem/dist/esm/index.js
var Filesystem = registerPlugin("Filesystem", {
  web: () => import("./web-7OWNZNT4.js").then((m) => new m.FilesystemWeb())
});
y();
export {
  Directory,
  Encoding,
  Filesystem,
  FilesystemDirectory,
  FilesystemEncoding
};
//# sourceMappingURL=@capacitor_filesystem.js.map
