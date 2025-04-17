import { mymap__isReady, mymap__get } from "./mapState.js";

let _mymap;
let toc_layers = new Array();
let _layer__name = "external_landuse";
let _layer__label = "external_landuse";
let _layer__ready = false;

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function layer__external_landuse__init() {
  if (mymap__isReady() == false) {
    await timeout(500);
    return await layer__external_landuse__init();
    // return false;
  }

  _mymap = mymap__get();

  _source__add();
}

async function _source__add() {
  let _r = await Promise.all([_axios("external_landuse")]);

  _mymap.addSource(`${_layer__name}`, {
    type: "geojson",
    // Use a URL for the value for the `data` property.
    data: _r[0],
  });

  _mymap.addLayer(
    {
      id: `id-${_layer__name}__polygon`, // Layer ID
      type: "fill",
      source: `${_layer__name}`, // ID of the tile source created above
      paint: {
        "fill-color": [
          "match",
          ["get", "category"],
          `university`,
          `#ffffffcc`,
          `building`,
          `#00000000`,
          `#ffffff00`,
        ],
      },
      layout: {
        visibility: "visible",
      },
    },
    `id-ghost-7`
  );
}

async function _axios(_filename) {
  let _url =
    "https://cityplanner.biz/geodashboard-v7/map__indoor/api/geojson/";

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
