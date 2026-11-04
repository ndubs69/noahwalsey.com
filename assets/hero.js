var reduce = false;
try {
  reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
} catch (e) {}
if (reduce) document.documentElement.classList.add("reduce");

var slot = document.getElementById("hero-shader");
var saveData = navigator.connection && navigator.connection.saveData;

function hasWebGL() {
  try {
    var canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch (e) {
    return false;
  }
}

function mount() {
  if (!slot || reduce || saveData || !hasWebGL()) return;
  Promise.all([
    import("https://esm.sh/react@18.3.1"),
    import("https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1"),
    import("https://esm.sh/@designcodeio/threeui@1.2.0?deps=react@18.3.1,react-dom@18.3.1")
  ]).then(function (mods) {
    var React = mods[0];
    var root = mods[1].createRoot(slot);
    root.render(React.createElement(mods[2].PredictiveArcCanvas, {
      variant: "ribbon-field",
      speed: 0.55,
      brightness: 0.9,
      saturation: 0.72,
      hue: 0,
      opacity: 1,
      pointerAmount: 0.25,
      smoothing: 0.04
    }));
    slot.classList.add("is-on");
  }).catch(function () {});
}

function start() {
  if (window.requestIdleCallback) requestIdleCallback(mount, { timeout: 1500 });
  else setTimeout(mount, 400);
}

if (document.readyState === "complete") start();
else window.addEventListener("load", start);
