import { mymap__isReady, mymap__get } from "./mapState.js";
import { layer__styles__unit__get } from "./layer__styles.js";
import { floors_change } from "./layer__pois.js";

let _mymap;
let toc_layers = new Array();
let _layer__name = "dibit2_1s";
let _layer__label = "DIBIT2 (1S)";
let _layer__ready = false;

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function layer__dibit2_1s__init() {
  if (mymap__isReady() == false) {
    await timeout(500);
    return await layer__dibit2_1s__init();
    // return false;
  }

  _mymap = mymap__get();

  dibit2_1s__source__add();
}

async function dibit2_1s__source__add() {
  let _r = await Promise.all([
    _axios("pg_dibit2_1s"),
    _axios("pg_dibit2_1s_walls"),
    _axios("pg_dibit2_1s_amenity"),
  ]);

  _mymap.addSource(`${_layer__name}`, {
    type: "geojson",
    // Use a URL for the value for the `data` property.
    data: _r[0],
  });

  _mymap.addSource(`${_layer__name}__walls`, {
    type: "geojson",
    // Use a URL for the value for the `data` property.
    data: _r[1],
  });

  _mymap.addSource(`${_layer__name}__amenity`, {
    type: "geojson",
    // Use a URL for the value for the `data` property.
    data: { type: "FeatureCollection", features: [] },
  });

  _mymap.addLayer(
    {
      id: `id-${_layer__name}__polygon`, // Layer ID
      type: "fill",
      source: `${_layer__name}`, // ID of the tile source created above
      paint: { "fill-color": layer__styles__unit__get() },
      layout: {
        visibility: "none",
      },
    },
    `id-ghost-6`
  );

  _mymap.addLayer(
    {
      id: `id-${_layer__name}__line`, // Layer ID
      type: "line",
      source: `${_layer__name}`, // ID of the tile source created above
      paint: {
        "line-color": `#5b5b5b`,
        "line-width": 1,
      },
      layout: {
        visibility: "none",
      },
    },
    `id-ghost-5`
  );

  _mymap.addLayer(
    {
      id: `id-${_layer__name}__walls`, // Layer ID
      type: "fill-extrusion",
      source: `${_layer__name}__walls`, // ID of the tile source created above
      paint: {
        "fill-extrusion-color": `#e7e7e787`,
        "fill-extrusion-height": 1.3,
        "fill-extrusion-opacity": 0.7,
      },
      layout: {
        visibility: "none",
      },
    },
    `id-ghost-1`
  );

  _mymap.addLayer(
    {
      id: `id-${_layer__name}__amenity`,
      source: `${_layer__name}__amenity`,
      type: "symbol",
      layout: {
        visibility: `none`,
        "icon-image": [`get`, `unit_type`],
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
      // "filter": ['all',
      //   ['==', ['get', 'category'], `parking`]],
      minZoom: 2,
      maxZoom: 22,
    },
    `id-ghost-1`
  );

  _toc(_layer__name, "none");
}

function _toc(_layer__name, visibility = "visible") {
  if (visibility == "none") {
    $(`.tocbox__check__btn[toc_token="${_layer__name}"]`).removeClass("active");
  } else {
    $(`.tocbox__check__btn[toc_token="${_layer__name}"]`).addClass("active");
  }
  $(`.tocbox__check__input[toc_token="${_layer__name}"]`).prop(
    "disabled",
    false
  );

  $(`.tocbox__check__btn[toc_token="${_layer__name}"]`).on(
    "click",
    function () {
      $(
        `.tocbox__check__btn[toc_token="${$(this).attr("toc_token")}"]`
      ).addClass("active");

      [`dibit2_1p`, `dibit2_pt`, `dibit2_1s`].forEach((_this__name) => {
        if (_this__name != $(this).attr("toc_token")) {
          _mymap.setLayoutProperty(
            `id-${_this__name}__polygon`,
            "visibility",
            `none`
          );
          _mymap.setLayoutProperty(
            `id-${_this__name}__walls`,
            "visibility",
            `none`
          );
          _mymap.setLayoutProperty(
            `id-${_this__name}__amenity`,
            "visibility",
            `none`
          );
          $(`.tocbox__check__btn[toc_token="${_this__name}"]`).removeClass(
            "active"
          );
        }
      });

      _mymap.setLayoutProperty(
        `id-${$(this).attr("toc_token")}__polygon`,
        "visibility",
        `visible`
      );
      // _mymap.setLayoutProperty(`id-${_layer__name}__line`, 'visibility', visibility);
      _mymap.setLayoutProperty(
        `id-${$(this).attr("toc_token")}__walls`,
        "visibility",
        `visible`
      );
      _mymap.setLayoutProperty(
        `id-${$(this).attr("toc_token")}__amenity`,
        "visibility",
        `visible`
      );

      floors_change("bibit2", "Bibit2 1S");
    }
  );
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
