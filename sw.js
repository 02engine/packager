// These will be replaced at build-time by generate-service-worker-plugin.js
const ASSETS = ["","js/extension-worker/extension-worker.0e321994dc3542d2b1a8.js","js/extension worker.js","assets/1-snare.344dc88f4d5187f0d86f2f13c9ef1727.mp3","assets/10-wood-block.e75c65e1679e0cc2800caa5c47823daa.mp3","assets/11-cowbell.fefb7e2fcd4d311a5a7c3de5a8ae5b64.mp3","assets/12-triangle.a42b5a072afdc2d1aa55accfb1168fb3.mp3","assets/13-bongo.26a4aecd5158e8663b90d5edfba5e25a.mp3","assets/14-conga.352dc6cd98d372680a5297f6ffc50ec4.mp3","assets/15-cabasa.87ffbd9d51d1ad2d5aa4a8f44b8a2750.mp3","assets/16-guiro.fcb21f71cf289f827e01b18b7c3fdc85.mp3","assets/17-vibraslap.367d7189e8dac8a0ca2828830a91db83.mp3","assets/18-cuica.dd8f636a1df01f3d3768998081387ea4.mp3","assets/2-bass-drum.e2e3a339dbcb33d83ba9fdc5ac0f3843.mp3","assets/3-side-stick.311ef566eba52b1729fd02d8944b4378.mp3","assets/4-crash-cymbal.1bff35b71e6f52017b123be4f9904d54.mp3","assets/5-open-hi-hat.b74faacb619dad0b5f3871a04a6bcd0e.mp3","assets/6-closed-hi-hat.c40ccf288c211a9441bb714db775d334.mp3","assets/7-tambourine.2291f2138819385c9a5750130f254f90.mp3","assets/8-hand-clap.484c379b1da007ecb5f66780a119fa2e.mp3","assets/9-claves.1c9099a7cf1c142492de1603b20b0d44.mp3","assets/108.7231a404390e5fe96856a5ec5182745c.mp3","assets/24.06fd0604a4bf62a2b706edc23e49a086.mp3","assets/36.52ac58d8ef4e53d6449e592b68359d46.mp3","assets/48.af0caec5f8ac3a35c9769e1e07918e14.mp3","assets/60.579529cc3c40887f6ecc771c4b39809d.mp3","assets/72.048d12d9e01a42ab48fb6ce57100f6f8.mp3","assets/84.41ebcde49032d543af1a2c843a725834.mp3","assets/96.c5b3d36982acf8f9acc53c3964100460.mp3","assets/48.3299cad6fda8c0a3d957a5ea75060677.mp3","assets/60.bf99fbafe9a01e45da63a6874cd8f4b2.mp3","assets/36.2bae7059d4f81f344b02cc34567e548d.mp3","assets/60.d4708e8517c8e85b5c1948c845e662ba.mp3","assets/84.4734f3fe917e80ae53b9f1f4e3d62147.mp3","assets/60.96d18383c71ad5ceff1152859b46c508.mp3","assets/72.b5f8889e91e6d51fc294dfd1125c1240.mp3","assets/60.8589d7e6689f31ec2c251be25ac95c1b.mp3","assets/72.2ec048ddd7a7e30b94f8d24c22892112.mp3","assets/36.527756fb4ee6a19086a69e0ea8355b5c.mp3","assets/48.f151dc9a8eb14b4d9c64795e1cbae7e0.mp3","assets/60.3d55b957c09e11fe0d75f4f2a84bdf53.mp3","assets/48.e3af35844a01f8f64d2bea326db21a35.mp3","assets/60.52d442dc8e71307ec251603d1edd35f0.mp3","assets/72.5610fba29744cce750f1da6c6091ecac.mp3","assets/60.19161c89a6ca04006606ca3f4f91fdec.mp3","assets/72.2352f743e6b883d53e0b09b84ddea79b.mp3","assets/60.9d76e4ccf26072c4bddaa81a765ab08a.mp3","assets/60.25c294b62fe9e614db125a4f65cc6044.mp3","assets/60.a386a58fa9c00de141c32b5b11e5327e.mp3","assets/60.c20d558f1fc823a96de910456827d90c.mp3","assets/60.912e19a8fe314f46ab3df3fed9578a29.mp3","assets/60.2613dd347943b2ed7c6edb22e0cf7e0a.mp3","assets/60.6d912e9240790715a077d422cdbc19a5.mp3","assets/60.b2b4ad5307e24c6627f2077478017981.mp3","assets/60.ecea3eba4a9e187eb6cc7cc6a6b4bb4d.mp3","assets/36.a16ff5830a119789f5bc5d29a42ace64.mp3","assets/48.7cf82cd9bd601cfee5e715c0eb5343ef.mp3","assets/60.bd1e18eb36346861c5c57be8ed2ba5e3.mp3","assets/36.23d5956ad3641d4663a17353c71477b0.mp3","assets/48.f44e9579ce45c384ed76054ee5e98270.mp3","assets/60.32e0021542e34f09a747322d11868f23.mp3","assets/36.1c8b575f37b1a519fc3cdc5183bb85c0.mp3","assets/48.a9eccab64d64a3114344d56af142741e.mp3","assets/60.1ac03a53ecc806b652579f9f8da7c58a.mp3","assets/reset.80a6e1615fc013684ad8047dba5ce064.svg","assets/default-icon.290e09e569a1cab8e61ba93b0d23863f.png","js/downloader.js","js/icns.js","js/iframe-extension-worker.js","js/p4.js","js/packager-options-ui.js","js/scratch-vm-compiler.js","js/sha256.js","js/vendors~downloader~packager-options-ui.js","js/vendors~icns~scratch-vm-compiler.js","js/vendors~icns~scratch-vm-compiler~sha256.js","js/vendors~jszip~scratch-vm-compiler.js"];
const CACHE_NAME = "p4-e9c67de5aa47aba3a31cf408d83039d230c7c7f8bc5a9e91249d0700c61ae4ca";
const IS_PRODUCTION = false;

const base = location.pathname.substr(0, location.pathname.indexOf('sw.js'));

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS.map(i => i === '' ? base : i))));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(i => i !== CACHE_NAME).map(i => caches.delete(i))))
  );
});

const fetchWithTimeout = (req) => new Promise((resolve, reject) => {
  const timeout = setTimeout(reject, 5000);
  fetch(req)
    .then((res) => {
      clearTimeout(timeout);
      resolve(res);
    })
    .catch((err) => {
      clearTimeout(timeout);
      reject(err);
    });
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  const relativePathname = url.pathname.substr(base.length);
  if (IS_PRODUCTION && ASSETS.includes(relativePathname)) {
    url.search = '';
    const immutable = !!relativePathname;
    if (immutable) {
      event.respondWith(
        caches.match(new Request(url)).then((res) => res || fetch(event.request))
      );
    } else {
      event.respondWith(
        fetchWithTimeout(event.request).catch(() => caches.match(new Request(url)))
      );
    }
  }
});
