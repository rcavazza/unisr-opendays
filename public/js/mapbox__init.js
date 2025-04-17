import { mymap__ready__set, mymap__set } from "./mapState.js";

export async function mapbox__init() {
  mapbox__prepare();
}

let _mymap;

async function mapbox__prepare() {
  const bounds = [
    [9.2629724, 45.5061396 - 0.0004116], // Southwest coordinates
    [9.2674599, 45.5075083], // Northeast coordinates
  ];
  let options = {
    container: "mapid", // container ID
    center: [9.266096370605236, 45.50685488974607],
    zoom: 2,
    maxZoom: 22,
    minZoom: 2,
    pitch: 0, // pitch in degrees
    bearing: -60, // bearing in degrees
    style: "https://tiles.basemaps.cartocdn.com/gl/voyager-gl-style/style.json", // style URL
    maxBounds: bounds, // Set the map's geographical boundaries.
  };

  _mymap = new maplibregl.Map(options);
  mymap__set(_mymap);

  _mymap.on("load", async () => {
    _mymap.addSource(`_ghost`, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
    for (let index = 0; index < 10; index++) {
      let _down_id = `place_suburbs`;
      if (index != 0) {
        _down_id = `id-ghost-${index - 1}`;
      }
      _mymap.addLayer(
        {
          id: `id-ghost-${index}`, // Layer ID
          type: "circle",
          source: `_ghost`, // ID of the tile source created above
          paint: {
            "circle-color": `#5b5b5b96`,
          },
          layout: {
            visibility: "none",
          },
        },
        _down_id
      );
    }

    console.log(_mymap.getStyle().layers);
    const layers = _mymap.getStyle().layers;
    // turn of layers

    layers.forEach((layer) => {
      if (layer) {
        _mymap.setLayoutProperty(layer.id, "visibility", "none");
      }
    });
    // _mymap.setLayoutProperty(`building`, "visibility", `none`);
    // _mymap.setLayoutProperty(`building-top`, "visibility", `none`);
    // _mymap.setLayoutProperty(`road_path`, "visibility", `none`);
    // _mymap.setLayoutProperty(`tunnel_path`, "visibility", `none`);
    // _mymap.setLayoutProperty(`housenumber`, "visibility", `none`);
    //   mymap.setCenter([9,45]);
    //   mymap.setZoom(12);
    // Load all images
    let _imgarray = [
      `stairs`,
      `elevator`,
      `classroom`,
      `library`,
      `totem`,
      `event_space`,
    ];
    let imagePromises = _imgarray.map((_img) => loadImage(_img));

    try {
      // Wait for all images to load
      let images = await Promise.all(imagePromises);

      // Add all images to the map
      images.forEach((image, index) => {
        _mymap.addImage(`${_imgarray[index]}`, image.data, { sdf: true });
      });
      mymap__ready__set(true);
      _mymap.resize();
    } catch (error) {
      console.error("Error loading images:", error);
    }
  });
}

// Function to load a single image
async function loadImage(_img) {
  return await _mymap.loadImage(`/images/icon/${_img}.png`);
}
