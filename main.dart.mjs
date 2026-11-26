// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.clientX,
      AE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      AF: x0 => x0.touches,
      AG: (x0,x1) => x0.querySelectorAll(x1),
      AH: x0 => x0.clipboard,
      AI: x0 => x0.disabled,
      AJ: (x0,x1) => { x0.crossOrigin = x1 },
      AK: (x0,x1) => x0.transferFromImageBitmap(x1),
      AL: x0 => x0.width,
      AM: x0 => x0.pause(),
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      BD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      BE: x0 => x0.matches,
      BF: x0 => x0.pressure,
      BG: (x0,x1) => x0.requestAnimationFrame(x1),
      BH: (x0,x1) => x0.writeText(x1),
      BI: (x0,x1) => { x0.min = x1 },
      BJ: (x0,x1) => x0.createObjectURL(x1),
      BK: (x0,x1) => x0.getContext(x1),
      BL: x0 => x0.facingMode,
      BM: x0 => x0.currentTime,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      CC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      CD: x0 => x0.getBoundingClientRect(),
      CE: (x0,x1) => x0.matchMedia(x1),
      CF: x0 => x0.tiltY,
      CG: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      CH: x0 => x0.unlock(),
      CI: (x0,x1) => { x0.max = x1 },
      CJ: x0 => x0.URL,
      CK: (x0,x1) => { x0.height = x1 },
      CL: x0 => x0.getCapabilities,
      CM: (x0,x1) => { x0.loop = x1 },
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: x0 => new Int32Array(x0),
      DC: (x0,x1) => x0.querySelector(x1),
      DD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      DE: x0 => x0.matches,
      DF: x0 => x0.tiltX,
      DG: x0 => x0.now(),
      DH: (x0,x1) => x0.lock(x1),
      DI: (x0,x1) => { x0.disabled = x1 },
      DJ: x0 => new Blob(x0),
      DK: (x0,x1) => { x0.width = x1 },
      DL: x0 => x0.attachStreamToVideo,
      DM: x0 => x0.resume(),
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      EC: (x0,x1) => x0.item(x1),
      ED: s => new Date(s * 1000).getTimezoneOffset() * 60,
      EE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      EF: x0 => x0.pointerType,
      EG: x0 => x0.performance,
      EH: x0 => x0.orientation,
      EI: (x0,x1) => { x0.scrollLeft = x1 },
      EJ: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      EK: x0 => x0.height,
      EL: () => new Map(),
      EM: (x0,x1) => { x0.currentTime = x1 },
      F: () => new Error().stack,
      FB: x0 => new Uint32Array(x0),
      FC: x0 => x0.length,
      FD: Date.now,
      FE: f => f.dartFunction,
      FF: x0 => x0.pointerId,
      FG: (d, digits) => d.toFixed(digits),
      FH: (x0,x1) => x0.querySelector(x1),
      FI: (x0,x1) => { x0.spellcheck = x1 },
      FJ: x0 => new window.ImageDecoder(x0),
      FK: x0 => x0.width,
      FL: (x0,x1,x2) => x0.set(x1,x2),
      FM: x0 => x0.state,
      G: s => JSON.stringify(s),
      GB: x0 => new Float32Array(x0),
      GC: (x0,x1) => x0.querySelectorAll(x1),
      GD: (handle) => clearTimeout(handle),
      GE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      GF: x0 => x0.getCoalescedEvents(),
      GG: x0 => x0.maxHeight,
      GH: (x0,x1) => { x0.title = x1 },
      GI: (x0,x1) => { x0.disabled = x1 },
      GJ: x0 => x0.name,
      GK: x0 => x0.rasterEndMilliseconds,
      GL: (x0,x1) => { x0.transform = x1 },
      GM: () => new AudioContext(),
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      HC: (x0,x1) => x0.getAttribute(x1),
      HD: (x0,x1) => x0.closest(x1),
      HE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      HF: (x0,x1) => x0.getModifierState(x1),
      HG: x0 => x0.maxWidth,
      HH: (x0,x1) => x0.vibrate(x1),
      HI: (a, i) => a.splice(i, 1),
      HJ: x0 => x0.repetitionCount,
      HK: x0 => x0.rasterStartMilliseconds,
      HL: x0 => x0.style,
      HM: (x0,x1) => x0.createMediaElementSource(x1),
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => new Float64Array(x0),
      IC: x0 => x0.remove(),
      ID: x0 => x0.bottom,
      IE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      IF: s => s.trimLeft(),
      IG: x0 => x0.minHeight,
      IH: x0 => x0.arrayBuffer(),
      II: a => a.pop(),
      IJ: x0 => x0.frameCount,
      IK: x0 => x0.imageBitmaps,
      IL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      IM: x0 => x0.createGain(),
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      JC: (x0,x1) => x0.appendChild(x1),
      JD: x0 => x0.top,
      JE: (o, i) => o[i],
      JF: s => s.toUpperCase(),
      JG: x0 => x0.minWidth,
      JH: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      JI: (map, o, v) => map.set(o, v),
      JJ: x0 => x0.selectedTrack,
      JK: x0 => x0.canvasKitMaximumSurfaces,
      JL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      JM: x0 => x0.createStereoPanner(),
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: x0 => new ArrayBuffer(x0),
      KC: (x0,x1) => x0.append(x1),
      KD: x0 => x0.right,
      KE: o => o.length,
      KF: (x0,x1) => x0[x1],
      KG: (x0,x1) => x0.removeProperty(x1),
      KH: x0 => x0.status,
      KI: (map, o) => map.get(o),
      KJ: x0 => x0.completed,
      KK: x0 => x0.hostElement,
      KL: (x0,x1) => x0.append(x1),
      KM: (x0,x1) => x0.connect(x1),
      L: o => o === undefined,
      LB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      LC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      LD: x0 => x0.left,
      LE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      LF: x0 => x0.length,
      LG: (x0,x1) => x0.add(x1),
      LH: (x0,x1) => x0.fetch(x1),
      LI: () => new WeakMap(),
      LJ: x0 => x0.ready,
      LK: x0 => x0.location,
      LL: (x0,x1) => x0.createElement(x1),
      LM: x0 => x0.load(),
      M: o => String(o),
      MB: (x0,x1,x2) => new DataView(x0,x1,x2),
      MC: x0 => x0.style,
      MD: x0 => x0.clientY,
      ME: x0 => x0.language,
      MF: (x0,x1) => x0.exec(x1),
      MG: x0 => x0.data,
      MH: x0 => x0.content,
      MI: x0 => new WeakRef(x0),
      MJ: x0 => x0.tracks,
      MK: (x0,x1) => x0.getModifierState(x1),
      ML: () => globalThis.document,
      MM: x0 => x0.destination,
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o, p) => o[p],
      NC: x0 => x0.debugShowSemanticsNodes,
      ND: x0 => x0.clientX,
      NE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      NF: x0 => x0.index,
      NG: (x0,x1) => { x0.scrollTop = x1 },
      NH: x0 => x0.document,
      NI: x0 => x0.deref(),
      NJ: x0 => x0.close(),
      NK: x0 => x0.metaKey,
      NL: (x0,x1) => { x0.onpause = x1 },
      NM: (x0,x1) => { x0.value = x1 },
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      OC: o => o,
      OD: x0 => x0.changedTouches,
      OE: () => globalThis.window.FinalizationRegistry,
      OF: x0 => x0.flags,
      OG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      OH: () => typeof dartUseDateNowForTicks !== "undefined",
      OI: () => globalThis.WeakRef,
      OJ: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      OK: x0 => x0.altKey,
      OL: (x0,x1) => { x0.onplay = x1 },
      OM: x0 => x0.gain,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      PC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      PD: x0 => x0.offsetY,
      PE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PF: (a, s) => a.join(s),
      PG: (x0,x1) => { x0.value = x1 },
      PH: () => Date.now(),
      PI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      PJ: (x0,x1) => x0.decode(x1),
      PK: x0 => x0.ctrlKey,
      PL: (x0,x1) => { x0.controls = x1 },
      PM: x0 => x0.code,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.byteOffset,
      QC: (x0,x1) => x0.warn(x1),
      QD: x0 => x0.offsetX,
      QE: x0 => new window.FinalizationRegistry(x0),
      QF: (x0,x1) => x0.error(x1),
      QG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      QH: () => 1000 * performance.now(),
      QI: (a, s, e) => a.slice(s, e),
      QJ: x0 => x0.displayHeight,
      QK: x0 => x0.isComposing,
      QL: (x0,x1) => { x0.pointerEvents = x1 },
      QM: x0 => x0.message,
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: o => o.buffer,
      RC: x0 => x0.console,
      RD: x0 => x0.type,
      RE: (x0,x1) => x0.unregister(x1),
      RF: () => globalThis.console,
      RG: (x0,x1) => { x0.value = x1 },
      RH: x0 => new Uint8Array(x0),
      RI: x0 => x0.abort(),
      RJ: x0 => x0.displayWidth,
      RK: x0 => x0.code,
      RL: (x0,x1) => { x0.transformOrigin = x1 },
      RM: x0 => x0.error,
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: Function.prototype.call.bind(DataView.prototype.getUint8),
      SC: () => globalThis.window,
      SD: x0 => x0.maxTouchPoints,
      SE: (x0,x1) => x0.contains(x1),
      SF: s => s.trimRight(),
      SG: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      SH: (x0,x1,x2) => x0.slice(x1,x2),
      SI: () => new AbortController(),
      SJ: x0 => x0.duration,
      SK: x0 => x0.repeat,
      SL: (x0,x1) => { x0.objectFit = x1 },
      SM: x0 => x0.duration,
      T: x0 => new Promise(x0),
      TB: (b, o) => new DataView(b, o),
      TC: (o, c) => o instanceof c,
      TD: x0 => x0.platform,
      TE: (s) => +s,
      TF: x0 => x0.blur(),
      TG: x0 => x0.value,
      TH: (x0,x1) => x0.decode(x1),
      TI: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      TJ: x0 => x0.image,
      TK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      TL: (x0,x1) => { x0.width = x1 },
      TM: (x0,x1) => { x0.playbackRate = x1 },
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: (b, o, l) => new DataView(b, o, l),
      UC: (string, token) => string.split(token),
      UD: x0 => x0.body,
      UE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      UF: x0 => x0.button,
      UG: x0 => x0.selectionDirection,
      UH: (x0,x1) => x0.adoptText(x1),
      UI: (x0,x1) => globalThis.fetch(x0,x1),
      UJ: () => globalThis.window.ImageDecoder,
      UK: x0 => x0.userAgent,
      UL: (x0,x1) => { x0.height = x1 },
      UM: (x0,x1) => { x0.crossOrigin = x1 },
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      VC: o => o instanceof Array,
      VD: () => globalThis.document,
      VE: s => s.trim(),
      VF: x0 => x0.innerHeight,
      VG: x0 => x0.selectionStart,
      VH: x0 => x0.first(),
      VI: (x0,x1) => x0.get(x1),
      VJ: x0 => globalThis.pingpayBiometria.autenticar(x0),
      VK: x0 => x0.navigator,
      VL: x0 => x0.getSupportedConstraints(),
      VM: (x0,x1) => { x0.preload = x1 },
      W: x0 => new Array(x0),
      WB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      WC: (a, i) => a[i],
      WD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      WE: x0 => x0.classList,
      WF: x0 => x0.innerWidth,
      WG: x0 => x0.selectionEnd,
      WH: x0 => x0.next(),
      WI: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      WJ: (x0,x1) => x0.getItem(x1),
      WK: (x0,x1) => x0.key(x1),
      WL: x0 => ({video: x0}),
      WM: x0 => x0.length,
      X: o => [o],
      XB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      XC: a => a.length,
      XD: x0 => x0.hasFocus(),
      XE: x0 => x0.preventDefault(),
      XF: x0 => x0.height,
      XG: x0 => x0.value,
      XH: x0 => x0.current(),
      XI: (x0,x1) => x0.forEach(x1),
      XJ: x0 => x0.localStorage,
      XK: x0 => x0.length,
      XL: x0 => ({facingMode: x0}),
      XM: x0 => x0.getReader(),
      Y: (o0, o1) => [o0, o1],
      YB: (t, s) => t.set(s),
      YC: (x0,x1) => x0.test(x1),
      YD: x0 => x0.relatedTarget,
      YE: x0 => x0.parent,
      YF: x0 => x0.width,
      YG: x0 => x0.selectionDirection,
      YH: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      YI: x0 => x0.name,
      YJ: () => globalThis.window,
      YK: x0 => x0.permissions,
      YL: (x0,x1) => x0.getUserMedia(x1),
      YM: x0 => x0.value,
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ZC: x0 => x0.userAgent,
      ZD: x0 => x0.shiftKey,
      ZE: x0 => x0.timeStamp,
      ZF: x0 => x0.clientHeight,
      ZG: x0 => x0.selectionStart,
      ZH: x0 => x0.v8BreakIterator,
      ZI: x0 => x0.statusText,
      ZJ: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      ZK: x0 => x0.geolocation,
      ZL: x0 => x0.facingMode,
      ZM: x0 => x0.done,
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      aC: x0 => x0.navigator,
      aD: (decoder, codeUnits) => decoder.decode(codeUnits),
      aE: (x0,x1) => x0.hasAttribute(x1),
      aF: x0 => x0.clientWidth,
      aG: x0 => x0.selectionEnd,
      aH: () => globalThis.Intl,
      aI: x0 => x0.url,
      aJ: x0 => x0.history,
      aK: x0 => x0.mediaDevices,
      aL: (x0,x1) => x0.querySelector(x1),
      aM: x0 => x0.read(),
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      bC: Function.prototype.call.bind(String.prototype.toLowerCase),
      bD: () => new TextDecoder("utf-8", {fatal: true}),
      bE: x0 => x0.buttons,
      bF: (x0,x1) => { x0.content = x1 },
      bG: x0 => x0.keyCode,
      bH: (x0,x1) => x0.segment(x1),
      bI: x0 => x0.status,
      bJ: x0 => x0.href,
      bK: x0 => x0.baseURI,
      bL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      bM: x0 => x0.body,
      c: o => o,
      cB: Function.prototype.call.bind(DataView.prototype.getUint32),
      cC: Object.is,
      cD: () => new TextDecoder("utf-8", {fatal: false}),
      cE: x0 => x0.ctrlKey,
      cF: (x0,x1) => { x0.name = x1 },
      cG: (x0,x1) => x0.scrollIntoView(x1),
      cH: x0 => x0.index,
      cI: x0 => x0.getReader(),
      cJ: x0 => x0.location,
      cK: x0 => x0.document,
      cL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      cM: (x0,x1) => new OffscreenCanvas(x0,x1),
      d: (o, p) => o[p],
      dB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      dC: x0 => x0.vendor,
      dD: (a, i, v) => a[i] = v,
      dE: x0 => x0.y,
      dF: x0 => x0.head,
      dG: x0 => x0.multiViewEnabled,
      dH: x0 => x0.next(),
      dI: x0 => x0.read(),
      dJ: (x0,x1) => x0.removeItem(x1),
      dK: (x0,x1) => x0.call(x1),
      dL: (x0,x1) => x0.appendChild(x1),
      dM: x0 => x0.assetBase,
      e: () => globalThis,
      eB: Function.prototype.call.bind(DataView.prototype.getInt32),
      eC: (x0,x1) => x0.createTextNode(x1),
      eD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      eE: x0 => x0.x,
      eF: (x0,x1) => x0.removeChild(x1),
      eG: (x0,x1) => x0.replaceWith(x1),
      eH: x0 => x0.value,
      eI: x0 => x0.value,
      eJ: (x0,x1,x2) => x0.setItem(x1,x2),
      eK: x0 => x0.reset,
      eL: x0 => x0.head,
      eM: x0 => x0.loader,
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      fC: (x0,x1) => { x0.id = x1 },
      fD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      fE: x0 => x0.scrollTop,
      fF: x0 => x0.firstChild,
      fG: (x0,x1) => { x0.type = x1 },
      fH: x0 => x0.done,
      fI: x0 => x0.done,
      fJ: () => new Array(),
      fK: x0 => x0.stopContinuousDecode,
      fL: (x0,x1) => { x0.onerror = x1 },
      fM: () => globalThis._flutter,
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: o => o instanceof Uint16Array,
      gC: (x0,x1) => { x0.nonce = x1 },
      gD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      gE: x0 => x0.offsetTop,
      gF: x0 => x0.viewConstraints,
      gG: (x0,x1) => { x0.className = x1 },
      gH: (o, m, a) => o[m].apply(o, a),
      gI: x0 => x0.cancel(),
      gJ: (x0,x1) => new WebSocket(x0,x1),
      gK: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      gL: (x0,x1) => x0.removeChild(x1),
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: Function.prototype.call.bind(DataView.prototype.getUint16),
      hC: x0 => x0.nonce,
      hD: x0 => x0.visibilityState,
      hE: x0 => x0.scrollLeft,
      hF: x0 => x0.hostElement,
      hG: (x0,x1) => { x0.tabIndex = x1 },
      hH: x0 => x0.iterator,
      hI: x0 => x0.body,
      hJ: x0 => x0.reason,
      hK: (x0,x1,x2,x3) => x0.call(x1,x2,x3),
      hL: (x0,x1) => { x0.onload = x1 },
      i: (l, r) => l === r,
      iB: o => o instanceof Int16Array,
      iC: () => globalThis.window.flutterConfiguration,
      iD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      iE: x0 => x0.offsetLeft,
      iF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      iG: (x0,x1) => { x0.name = x1 },
      iH: () => globalThis.Symbol,
      iI: x0 => x0.headers,
      iJ: x0 => x0.code,
      iK: x0 => x0.rawBytes,
      iL: (x0,x1) => { x0.src = x1 },
      j: x0 => x0.random(),
      jB: Function.prototype.call.bind(DataView.prototype.getInt16),
      jC: (x0,x1) => x0.attachShadow(x1),
      jD: x0 => x0.disconnect(),
      jE: x0 => x0.offsetParent,
      jF: x0 => ({runApp: x0}),
      jG: (x0,x1) => { x0.placeholder = x1 },
      jH: (x0,x1) => new Intl.Segmenter(x0,x1),
      jI: x0 => x0.signal,
      jJ: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      jK: x0 => x0.text,
      jL: (x0,x1) => { x0.crossOrigin = x1 },
      k: o => o,
      kB: o => o instanceof Uint8ClampedArray,
      kC: (x0,x1) => x0.createElement(x1),
      kD: x0 => new Intl.Locale(x0),
      kE: (o, p, r) => o.replace(p, () => r),
      kF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      kG: (x0,x1) => { x0.autocomplete = x1 },
      kH: x0 => x0.Segmenter,
      kI: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      kJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      kK: x0 => x0.barcodeFormat,
      kL: (x0,x1) => { x0.lang = x1 },
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      lC: x0 => x0.scale,
      lD: x0 => x0.region,
      lE: (x0,x1) => { x0.lastIndex = x1 },
      lF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      lG: (x0,x1) => { x0.name = x1 },
      lH: x0 => x0.buffer,
      lI: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      lJ: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      lK: x0 => x0.y,
      lL: (x0,x1) => { x0.type = x1 },
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setInt32),
      mC: x0 => x0.visualViewport,
      mD: x0 => x0.script,
      mE: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      mF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      mG: (x0,x1) => { x0.placeholder = x1 },
      mH: x0 => x0.wasmMemory,
      mI: x0 => x0.pop(),
      mJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      mK: x0 => x0.x,
      mL: (x0,x1) => { x0.defer = x1 },
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setUint32),
      nC: x0 => x0.devicePixelRatio,
      nD: x0 => x0.language,
      nE: o => o instanceof RegExp,
      nF: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      nG: (x0,x1) => { x0.action = x1 },
      nH: () => globalThis.window._flutter_skwasmInstance,
      nI: (x0,x1) => x0.getRandomValues(x1),
      nJ: (o, t) => typeof o === t,
      nK: x0 => x0.resultPoints,
      nL: (x0,x1) => { x0.async = x1 },
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setInt16),
      oC: x0 => x0.height,
      oD: x0 => x0.languages,
      oE: x0 => x0.dotAll,
      oF: x0 => x0.history,
      oG: (x0,x1) => { x0.method = x1 },
      oH: () => new TextDecoder(),
      oI: () => globalThis.crypto,
      oJ: x0 => x0.data,
      oK: x0 => x0.message,
      oL: (x0,x1) => { x0.id = x1 },
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint16),
      pC: x0 => x0.width,
      pD: (x0,x1) => x0.observe(x1),
      pE: x0 => x0.unicode,
      pF: x0 => x0.search,
      pG: (x0,x1) => { x0.noValidate = x1 },
      pH: x0 => x0.debugSkipFontRetryDelay,
      pI: l => new DataView(new ArrayBuffer(l)),
      pJ: (x0,x1,x2) => x0.close(x1,x2),
      pK: x0 => x0.videoElement,
      pL: x0 => x0.videoHeight,
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setUint8),
      qC: x0 => x0.screen,
      qD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      qE: x0 => x0.ignoreCase,
      qF: x0 => x0.location,
      qG: (x0,x1) => x0.removeAttribute(x1),
      qH: (x0,x1,x2) => x0.set(x1,x2),
      qI: () => globalThis.pingpayBiometria.disponivel(),
      qJ: (x0,x1) => x0.close(x1),
      qK: x0 => x0.decodeContinuously,
      qL: x0 => x0.videoWidth,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.setInt8),
      rC: (string, times) => string.repeat(times),
      rD: x0 => new ResizeObserver(x0),
      rE: x0 => x0.multiline,
      rF: x0 => x0.pathname,
      rG: x0 => x0.isConnected,
      rH: x0 => x0.fontFallbackBaseUrl,
      rI: x0 => globalThis.pingpayBiometria.registrar(x0),
      rJ: x0 => x0.close(),
      rK: (x0,x1) => new ZXing.BrowserMultiFormatReader(x0,x1),
      rL: x0 => x0.play(),
      s: () => ({}),
      sB: Function.prototype.call.bind(DataView.prototype.getInt8),
      sC: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      sD: (x0,x1) => x0.getPropertyValue(x1),
      sE: (o, p, r) => o.replaceAll(p, () => r),
      sF: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      sG: x0 => x0.click(),
      sH: (handle) => clearInterval(handle),
      sI: (a, l) => a.length = l,
      sJ: (x0,x1) => x0.send(x1),
      sK: x0 => x0.getVideoTracks(),
      sL: x0 => x0.paused,
      t: (o, p, v) => o[p] = v,
      tB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      tC: x0 => x0.tabIndex,
      tD: x0 => globalThis.parseFloat(x0),
      tE: x0 => x0.deltaMode,
      tF: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      tG: (x0,x1) => x0.getElementsByClassName(x1),
      tH: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      tI: (x0,x1) => x0.revokeObjectURL(x1),
      tJ: x0 => x0.readyState,
      tK: x0 => x0.getCapabilities(),
      tL: x0 => x0.nextSibling,
      u: () => [],
      uB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      uC: (x0,x1) => x0.contains(x1),
      uD: (x0,x1) => x0.getComputedStyle(x1),
      uE: x0 => x0.deltaY,
      uF: o => Object.keys(o),
      uG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      uH: () => Date.now(),
      uI: (x0,x1) => { x0.src = x1 },
      uJ: (x0,x1) => { x0.binaryType = x1 },
      uK: () => ({}),
      uL: (x0,x1) => x0.debug(x1),
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.activeElement,
      vD: x0 => x0.documentElement,
      vE: x0 => x0.deltaX,
      vF: x0 => x0.state,
      vG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      vH: (x0,x1,x2) => x0.insertBefore(x1,x2),
      vI: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      vJ: x0 => new BroadcastChannel(x0),
      vK: x0 => x0.getSettings(),
      vL: x0 => x0.stream,
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.parentNode,
      wD: x0 => x0.computedStyleMap(),
      wE: x0 => x0.wheelDeltaY,
      wF: x0 => x0.hash,
      wG: (x0,x1) => x0.dispatchEvent(x1),
      wH: x0 => x0.id,
      wI: x0 => x0.naturalHeight,
      wJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      wK: (x0,x1) => ({width: x0,height: x1}),
      wL: x0 => x0.close(),
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.tagName,
      xD: (x0,x1) => x0.get(x1),
      xE: x0 => x0.wheelDeltaX,
      xF: x0 => x0.state,
      xG: (x0,x1) => x0.createEvent(x1),
      xH: x0 => x0.offsetHeight,
      xI: x0 => x0.naturalWidth,
      xJ: x0 => x0.close(),
      xK: (x0,x1,x2) => ({width: x0,height: x1,facingMode: x2}),
      xL: x0 => x0.disconnect(),
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.target,
      yD: (o, p) => p in o,
      yE: x0 => x0.key,
      yF: (x0,x1) => x0.go(x1),
      yG: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      yH: x0 => x0.offsetWidth,
      yI: x0 => x0.decode(),
      yJ: (x0,x1) => x0.postMessage(x1),
      yK: x0 => x0.facingMode,
      yL: x0 => x0.remove(),
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.clientY,
      zD: (x0,x1) => { x0.textContent = x1 },
      zE: x0 => x0.identifier,
      zF: x0 => x0.parentElement,
      zG: x0 => x0.readText(),
      zH: x0 => x0.stopPropagation(),
      zI: (x0,x1) => { x0.decoding = x1 },
      zJ: (x0,x1) => { x0.onmessage = x1 },
      zK: x0 => x0.height,
      zL: (x0,x1) => { x0.src = x1 },

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
