import { mymap__isReady,mymap__get } from './mapState.js';

let _mymap;
let toc_layers = new Array();
let _layer__name = 'dibit2_pt__raster';
let _layer__label = 'DIBIT2 (PT) Blueprint';
let _layer__ready = false;

let _first_frameUrl = 'https://cityplanner.biz/data/indoor_map/dibit2_pt_modified_4326.png';

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function layer__dibit2_pt__raster__init(){

  if(mymap__isReady() == false){
    await timeout(500);
    return await layer__dibit2_pt__raster__init();
    // return false;
  }

  _mymap = mymap__get();

  dibit2_pt__raster__source__add();

}

function dibit2_pt__raster__source__add(){

  let _layer__id = `id-${_layer__name}`;

  toc_layers[`${_layer__name}`] = [];
  toc_layers[`${_layer__name}`].push(`${_layer__id}`);

  _mymap.addSource(`${_layer__name}`, {
    'type': 'image',
    'url': _first_frameUrl,
    'coordinates': [
      [9.2638560470000009,45.5071748299999967],   // Top-left
      [9.2650058019999992,45.5071748299999967],    // Top-right
      [9.2650058019999992,45.5064766550000002],   // Bottom-right
      [9.2638560470000009,45.5064766550000002]   // Bottom-left
    ]
  });

  _mymap.addLayer(
    {
      id: `id-${_layer__name}`,
      'type': 'raster',
      'source': `${_layer__name}`,
      'layout': {
        'visibility': 'none'
      }
    },
    `id-ghost-9`
  );

  _toc(_layer__name,'none');

}

function _toc(_layer__name,visibility = 'visible'){

  if(visibility == 'none'){
    $(`.tocbox__check__input[toc_token="${_layer__name}"]`).prop('checked', false);
  }
  else{
    $(`.tocbox__check__input[toc_token="${_layer__name}"]`).prop('checked', true);
  }
  $(`.tocbox__check__input[toc_token="${_layer__name}"]`).prop('disabled', false);

  $(`.tocbox__check__input[toc_token="${_layer__name}"]`).on('change', function() {

    let _checked = $(this).prop('checked');

    let visibility = 'none';
    if(_checked == true){
      visibility = 'visible';
    }

    _mymap.setLayoutProperty(`id-${_layer__name}`, 'visibility', visibility);

  });

}


