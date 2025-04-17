import { mymap__isReady, mymap__get } from "./mapState.js";

let _mymap;
let toc_layers = new Array();
let _layer__name = "external_poi";
let _layer__label = "external_poi";
let _layer__ready = false;

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function layer__external_poi__init() {
  return;
  if (mymap__isReady() == false) {
    await timeout(500);
    return await layer__external_poi__init();
    // return false;
  }

  _mymap = mymap__get();

  _source__add();
}

async function _source__add() {
  let _r = await Promise.all([_axios("external_poi")]);

  _mymap.addSource(`${_layer__name}`, {
    type: "geojson",
    // Use a URL for the value for the `data` property.
    data: _r[0],
  });

  // Load all images
  let _imgarray = [`information_32`];
  let imagePromises = _imgarray.map((_img) => loadImage(_img));

  try {
    // Wait for all images to load
    let images = await Promise.all(imagePromises);

    // Add all images to the map
    images.forEach((image, index) => {
      _mymap.addImage(`icon--${_imgarray[index]}`, image.data);
    });

    _mymap.addLayer(
      {
        id: `id-${_layer__name}-detail_img`,
        source: `${_layer__name}`,
        type: "symbol",
        layout: {
          visibility: `visible`,
          "icon-image": `icon--information_32`,
          "icon-size": [
            "interpolate",
            // Set the exponential rate of change to 0.5
            ["linear"],
            ["zoom"],
            // When zoom is 15, buildings will be beige.
            7,
            0.2, // 13 pixels wide when zoomed in
            // When zoom is 18 or higher, buildings will be yellow.
            14,
            0.8, // 8 pixels wide when zoomed in
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        paint: {
          "icon-color": "#000",
          // "icon-halo-blur": 1,
          // "icon-halo-color": "rgba(0, 0, 0, 0)",
          // "icon-halo-width": 5
        },
        filter: ["all", ["==", ["get", "category"], `parking`]],
        minZoom: 2,
        maxZoom: 22,
      },
      `id-ghost-6`
    );
  } catch (error) {
    console.error("Error loading images:", error);
  }
}

async function _axios(_filename) {
  let _url = "https://cityplanner.biz/geodashboard-v7/map__indoor/api/geojson/";

  return new Promise((resolve, reject) => {
    axios
      .post(_url, {
        name: _filename,
      })
      .then((response) => {
        resolve(response.data); // Resolve the promise
      })
      .catch((error) => {
        console.error(error);
        reject(error); // Reject the promise if there's an error
      });
  }); // Promise
}

// Function to load a single image
async function loadImage(_img) {
  return await _mymap.loadImage(
    `https://cityplanner.biz/source/icon/${_img}.png`
  );
}
