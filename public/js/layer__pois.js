import { mymap__isReady, mymap__get } from "./mapState.js";

let _mymap;
let toc_layers = new Array();
let _layer__name = "pois";
let _layer__label = "pois";
let _layer__ready = false;
let _pathfinder__pid__from;
let _pathfinder__pid__to_start;
let _pathfinder__slug__from = PROJECT_FROM;
let _pathfinder__slug__to_start = PROJECT_TO;
let _start__position;

let _floor1 = "Bibit1 PT";
let _floor2 = "Bibit2 PT";

var current_floor = "";

let filter__floors = [
  "any",
  // ['==', ['get', 'level_text'], 'Bibit1 2S'],
  // ['==', ['get', 'level_text'], 'Bibit1 1S'],
  ["==", ["get", "level_text"], "Bibit1 PT"],
  // ['==', ['get', 'level_text'], 'Bibit1 1P'],
  // ['==', ['get', 'level_text'], 'Bibit2 1S'],
  ["==", ["get", "level_text"], "Bibit2 PT"],
  // ['==', ['get', 'level_text'], 'Bibit2 1P'],
];

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function floors_change(building, floor) {
  if (building == "bibit1") {
    _floor1 = floor;
  } else if (building == "bibit2") {
    _floor2 = floor;
  }

  filter__floors = [
    "any",
    // ['==', ['get', 'level_text'], 'Bibit1 2S'],
    // ['==', ['get', 'level_text'], 'Bibit1 1S'],
    ["==", ["get", "level_text"], _floor1],
    // ['==', ['get', 'level_text'], 'Bibit1 1P'],
    // ['==', ['get', 'level_text'], 'Bibit2 1S'],
    ["==", ["get", "level_text"], _floor2],
    // ['==', ['get', 'level_text'], 'Bibit2 1P'],
  ];

  _mymap.setFilter(`id-${_layer__name}__amenity`, filter__floors);
  _mymap.setFilter(`id-${_layer__name}__path`, filter__floors);

  const layersDb1 = [`dibit1_1p`, `dibit1_pt`, `dibit1_1s`, `dibit1_2s`];
  const layersDb2 = [`dibit2_1p`, `dibit2_pt`, `dibit2_1s`];
  if (building == "bibit1") {
    layersDb1.map((layer) => {
      _mymap.setLayoutProperty(`id-${layer}__polygon`, "visibility", "none");
      _mymap.setLayoutProperty(`id-${layer}__walls`, "visibility", "none");
      _mymap.setLayoutProperty(`id-${layer}__amenity`, "visibility", "none");
    });
  } else {
    layersDb2.map((layer) => {
      _mymap.setLayoutProperty(`id-${layer}__polygon`, "visibility", "none");
      _mymap.setLayoutProperty(`id-${layer}__walls`, "visibility", "none");
      _mymap.setLayoutProperty(`id-${layer}__amenity`, "visibility", "none");
    });
  }

  let layerName = `dibit${building == "bibit1" ? 1 : 2}_${floor
    .split(" ")[1]
    .toLowerCase()}`;
  if (layerName == "dibit1_p") layerName = "dibit1_1p";
  if (layerName == "dibit2_p") layerName = "dibit2_1p";
  _mymap.setLayoutProperty(`id-${layerName}__polygon`, "visibility", `visible`);
  _mymap.setLayoutProperty(`id-${layerName}__walls`, "visibility", `visible`);
  _mymap.setLayoutProperty(`id-${layerName}__amenity`, "visibility", `visible`);
}

export async function layer__pois__init() {
  if (mymap__isReady() == false) {
    await timeout(500);
    return await layer__pois__init();
    // return false;
  }

  _mymap = mymap__get();

  let _r = await Promise.all([_axios("amenity_pois")]);
  let _container = $(".tocbox__pois");

  _container.append(`
    <div class="label__box" style="    padding: 0.5rem 1rem;
      font-size: large;
      display: flex;
      align-items: center;
      gap: 0.3rem">
      <i class="material-symbols--start-rounded" style="color:#000;"></i>
      <span>From POI</span>
    </div>
    <select class="form-select select-start-point" aria-label="Default select example" disabled>
      <option selected>Start Point</option>
    </select>
    <div class="label__box" style="    padding: 0.5rem 1rem;
      font-size: large;
      display: flex;
      align-items: center;
      gap: 0.3rem">
      <i class="material-symbols--line-end-diamond-outline-rounded" style="color:#000;"></i>
      <span>To POI</span>
    </div>
  `);
  const $selectStartPoint = $(".select-start-point");

  _r[0].features.forEach((element) => {
    let _p = element.properties;
    let _g = element.geometry.coordinates;

    // console.log(`poi`, _p);
    // Create a new option element
    const $option = $("<option></option>");

    // Set the value and text of the option element
    // Assuming each feature has a 'name' property for display and an 'id' property for value
    $option.val(_p.id);
    $option.text(_p.name_text);
    // Check if the feature's name_text is 'Dibit1 Ingresso'
    if (_p.name_slug === _pathfinder__slug__from) {
      // Set the option as selected
      $option.attr("selected", "selected");
      current_floor = _p.level_text;
    }
    // Append the option element to the select element
    $selectStartPoint.append($option);

    let _icon = "streamline--class-lesson-solid";
    if (_p.poi_type == "event_space") {
      _icon = "carbon--ibm-cloud-event-streams";
    } else if (_p.poi_type == "totem") {
      _icon = "material-symbols--desktop-portrait";
    }

    _container.append(`
        <div class="tocbox__box" 
          toc_token="${_p.id}" ></div>

        <button class="btn btn-light tocbox tocbox__amenity_pois" 
          style="grid-template-columns: 0px 20px 1fr 16px;cursor:pointer;
            padding:0.25rem 1rem 0.25rem 1rem;\
            align-items: center;" \
          toc_token="${_p.id}"
          lng="${_g[0]}" lat="${_g[1]}"
            >
          <div class="tocbox__check" style="display:none;" >
            <input type="checkbox" 
              class="form-check-input tocbox__check__input" 
              value="" 
              toc_token="${_p.id}" disabled>
          </div>
          <div class="tocbox__icon">
            <i class="${_icon}"></i>
          </div>
          <div class="tocbox__label" >
            ${_p.name_text}
          </div>
          <div class="tocbox__expand"  
            style="display:none;" 
            toc_token="${_p.id}" >
            <i class="bi bi-chevron-expand"></i>
          </div>
        </button>
    `);
    if (_p.name_slug === _pathfinder__slug__from) {
      _pathfinder__pid__from = _p.id;
      _start__position = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              id: 1,
            },
            geometry: {
              type: "Point",
              coordinates: [_g[0], _g[1]],
            },
          },
        ],
      };
      $(`.tocbox__amenity_pois[toc_token="${_p.id}"]`).prop("disabled", true);
    } else if (_p.name_slug === _pathfinder__slug__to_start) {
      _pathfinder__pid__to_start = _p.id;
      $(`.tocbox__amenity_pois[toc_token="${_p.id}"]`).addClass("active");
    }
  });

  // _onsole.log(_pathfinder__pid__from);

  $(".tocbox__amenity_pois").on("click", function () {
    let _g = [parseFloat($(this).attr("lng")), parseFloat($(this).attr("lat"))];

    _mymap.setCenter(_g);
    _mymap.setZoom(20);

    pathfinder__get($(this).attr("toc_token"));
    $(`.tocbox__amenity_pois`).removeClass("active");
    $(
      `.tocbox__amenity_pois[toc_token="${$(this).attr("toc_token")}"]`
    ).addClass("active");
  });

  _mymap.addSource(`${_layer__name}__amenity`, {
    type: "geojson",
    // Use a URL for the value for the `data` property.
    data: _r[0],
  });

  _mymap.addLayer(
    {
      id: `id-${_layer__name}__amenity`,
      source: `${_layer__name}__amenity`,
      type: "symbol",
      layout: {
        visibility: `visible`,
        "icon-image": [`get`, `poi_type`],
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
        "icon-color": [
          "match", // Use the 'match' expression: https://docs.mapbox.com/style-spec/reference/expressions/#match
          ["get", "poi_type"], // Use the result 'STORE_TYPE' property
          "stairs",
          "#ffffff",
          "elevator",
          "#ffffff",
          "classroom",
          "#ffffff",
          "library",
          "#ffffff",
          "totem",
          "#00ff00",
          "event_space",
          "#ffffff",
          "#ffffff", // any other store type
        ],
        // "icon-halo-blur": 1,
        // "icon-halo-color": "rgba(0, 0, 0, 0)",
        // "icon-halo-width": 5
      },
      filter: filter__floors,
      minZoom: 2,
      maxZoom: 30,
    },
    `id-ghost-1`
  );

  pois__source__add();
}

async function _axios(_filename) {
  let _url = "https://cityplanner.biz/geodashboard-v7/map__indoor/api/routing/";

  if (_filename == "amenity_pois") {
    _url = "https://cityplanner.biz/geodashboard-v7/map__indoor/api/geojson/";
  }

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

async function pois__source__add() {
  let _r = await Promise.all([_axios("pois")]);

  _mymap.addSource(`${_layer__name}`, {
    type: "geojson",
    // Use a URL for the value for the `data` property.
    data: _r[0],
  });

  _mymap.addLayer(
    {
      id: `id-${_layer__name}__point`, // Layer ID
      type: "circle",
      source: `${_layer__name}`, // ID of the tile source created above
      paint: {
        "circle-color": `#d92a2a`,
      },
      layout: {
        visibility: "none",
      },
    },
    `id-ghost-0`
  );

  _mymap.addSource(`${_layer__name}__start`, {
    type: "geojson",
    // Use a URL for the value for the `data` property.
    data: _start__position,
  });

  _mymap.addLayer(
    {
      id: `id-${_layer__name}__start`, // Layer ID
      type: "circle",
      source: `${_layer__name}__start`, // ID of the tile source created above
      paint: {
        "circle-color": `#6ebb5b`,
        "circle-radius": 10,
      },
      layout: {
        visibility: "visible",
      },
    },
    `id-ghost-0`
  );

  _mymap.addSource(`${_layer__name}__path`, {
    type: "geojson",
    // Use a URL for the value for the `data` property.
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  _mymap.addLayer(
    {
      id: `id-${_layer__name}__path`, // Layer ID
      type: "line",
      source: `${_layer__name}__path`, // ID of the tile source created above
      paint: {
        "line-color": `#6ebb5b`,
        "line-width": 4,
        "line-blur": 0,
      },
      layout: {
        "line-cap": "round",
        visibility: "visible",
      },
      filter: filter__floors,
    },
    `id-ghost-2`
  );

  async function checkLayers() {
    if (mymap__isReady() == false) {
      console.log("LOADING...");
      await timeout(500);
      return await checkLayers();
      // return false;
    }

    // Init bottom buttons

    const buttons = document.querySelectorAll(".bottomButtons button");
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const floor = button.getAttribute("data-floor");
        const buildingName = button.getAttribute("data-building");
        floors_change(buildingName.toLowerCase(), buildingName + " " + floor);
        checkActiveBottonButton(buildingName + " " + floor);
      });
    });
  }

  checkLayers();

  _mymap.on("click", `id-${_layer__name}__point`, (e) => {
    // if(mode__state() != 'explore') return;

    // Copy coordinates array.
    const coordinates = e.features[0].geometry.coordinates.slice();
    // console.log(e.features[0].properties);
    let _p = e.features[0].properties;
    pathfinder__get(_p.id);
  });

  // Create sample visibile path
  pathfinder__get(_pathfinder__pid__to_start);

  // _toc(_layer__name,'visible');
}

const checkActiveBottonButton = (floor) => {
  const buttonsDb1 = document.querySelectorAll(
    ".bottomButtons .bottomButtonDb1 button"
  );

  const buttonsDb2 = document.querySelectorAll(
    ".bottomButtons .bottomButtonDb2 button"
  );

  buttonsDb1.forEach((button) => {
    const myName = button.getAttribute("data-name");
    if (myName == floor) {
      button.classList.add("active");
    }
    else{
      button.classList.remove("active");
    }
  });

  buttonsDb2.forEach((button) => {
    const myName = button.getAttribute("data-name");
   
      if (myName == floor) {
        button.classList.add("active");
      }
      else{
        button.classList.remove("active");
      }
  });
}

async function pathfinder__get(target__id) {
  let _r = await Promise.all([_axios__pathfinder(target__id)]);
  // console.log(_r[0]);

  console.log("PATH FINDER GET");
  _mymap.getSource(`${_layer__name}__path`).setData(_r[0]);
  const firstFeature = _r[0].source.split("|");
  const lastFeature = _r[0].target.split("|");

  let point1 = turf.point([firstFeature[0], firstFeature[1]]);
  let point2 = turf.point([lastFeature[0], lastFeature[1]]);

  let bearing = turf.bearing(point1, point2);

  _mymap.setBearing(bearing);
  // _mymap.setZoom(20);
  _mymap.setCenter([firstFeature[0], firstFeature[1]]);

  const buildingName = current_floor.split(" ")[0].toLowerCase();
  floors_change(buildingName, current_floor);

  let enableLevelsBibit1 = [];
  let enableLevelsBibit2 = [];
  _r[0].features.forEach((element) => {
    let _p = element.properties;
    if (_p.level_text.includes("Bibit1")) {
      enableLevelsBibit1.push(_p.level_text);
    }
    if (_p.level_text.includes("Bibit2")) {
      enableLevelsBibit2.push(_p.level_text);
    }
  });

  enableLevelsBibit1 = [...new Set(enableLevelsBibit1)];
  enableLevelsBibit2 = [...new Set(enableLevelsBibit2)];

  const buttonsDb1 = document.querySelectorAll(
    ".bottomButtons .bottomButtonDb1 button"
  );

  const buttonsDb2 = document.querySelectorAll(
    ".bottomButtons .bottomButtonDb2 button"
  );

  buttonsDb1.forEach((button) => {
    const myName = button.getAttribute("data-name");
    button.style.display = enableLevelsBibit1.includes(myName)
      ? "block"
      : "none";
    if (myName == current_floor) {
      button.classList.add("active");
    }
    else{
      button.classList.remove("active");
    }
  });

  buttonsDb2.forEach((button) => {
    const myName = button.getAttribute("data-name");
    button.style.display = enableLevelsBibit2.includes(myName)
      ? "block"
      : "none";
      if (myName == current_floor) {
        button.classList.add("active");
      }
      else{
        button.classList.remove("active");
      }
  });
  
}

function _toc(_layer__name, visibility = "visible") {
  let _container = $(".sidebar__body");

  let icon_html;
  icon_html = `<i class="fg-polygon-hole" style="color:#000;"></i>`;

  _container.append(`
    <div class="tocbox__box" 
      toc_token="${_layer__name}" ></div>

    <div class="tocbox" 
      toc_token="${_layer__name}"
        >
      <div class="tocbox__check" >
        <input type="checkbox" 
          class="form-check-input tocbox__check__input" 
          value="" 
          toc_token="${_layer__name}" checked >
      </div>
      <div class="tocbox__icon" >
        ${icon_html}
      </div>
      <div class="tocbox__label" >
        ${_layer__label}
      </div>
      <div class="tocbox__expand"  
        toc_token="${_layer__name}" >
        <i class="bi bi-chevron-expand"></i>
      </div>
    </div>
  `);

  if (visibility == "none") {
    $(`.tocbox__check__input[toc_token="${_layer__name}"]`).prop(
      "checked",
      false
    );
  }

  $(`.tocbox__check__input[toc_token="${_layer__name}"]`).on(
    "change",
    function () {
      let _layer__name = $(this).attr("toc_token");
      _visibility(_layer__name);
    }
  );
}

function _visibility(_layer__name) {
  let _checked = $(`.tocbox__check__input[toc_token="${_layer__name}"]`).prop(
    "checked"
  );

  let _mymap = mymap__get();

  let visibility = "none";
  if (_checked == true) {
    visibility = "visible";
  }
  // _onsole.log(toc_layers);
  // toc_layers[`${_layer__name}`].forEach(element => {
  _mymap.setLayoutProperty(
    `id-${_layer__name}__polygon`,
    "visibility",
    visibility
  );
  _mymap.setLayoutProperty(
    `id-${_layer__name}__line`,
    "visibility",
    visibility
  );
  // });
}

async function _axios__pathfinder(target__id) {
  let _url = "https://cityplanner.biz/geodashboard-v7/map__indoor/api/routing/";

  return new Promise((resolve, reject) => {
    axios
      .post(_url, {
        name: `pathfinder`,
        source: _pathfinder__pid__from,
        target: target__id,
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
