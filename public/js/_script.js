import { mapbox__init } from './mapbox__init.js';
import { widget__bottomright_expandible__init } from './widget__bottomright_expandible.js';
import { widget__stars__init } from './widget__stars.js';
import { widget__infozoom__init } from './widget__infozoom.js';
import { layer__dibit1_pt__init } from './layer__dibit1_pt.js';
import { layer__dibit1_1p__init } from './layer__dibit1_1p.js';
import { layer__dibit1_1s__init } from './layer__dibit1_1s.js';
import { layer__dibit1_2s__init } from './layer__dibit1_2s.js';
import { layer__dibit2_1s__init } from './layer__dibit2_1s.js';
import { layer__dibit2_pt__init } from './layer__dibit2_pt.js';
import { layer__dibit2_1p__init } from './layer__dibit2_1p.js';
import { layer__dibit1_pt__raster__init } from './layer__dibit1_pt__raster.js';
import { layer__dibit2_1s__raster__init } from './layer__dibit2_1s__raster.js';
import { layer__dibit2_pt__raster__init } from './layer__dibit2_pt__raster.js';
import { layer__pois__init } from './layer__pois.js';
import { layer__external_landuse__init } from './layer__external_landuse.js';
import { layer__external_lines__init } from './layer__external_lines.js';
import { layer__external_poi__init } from './layer__external_poi.js';

function _init(){

  mapbox__init();
  widget__bottomright_expandible__init();
  // widget__stars__init();
  // widget__infozoom__init();
  layer__dibit1_pt__init();
  layer__dibit1_1p__init();
  layer__dibit1_1s__init();
  layer__dibit1_2s__init();
  layer__dibit2_1s__init();
  layer__dibit2_pt__init();
  layer__dibit2_1p__init();
  layer__dibit1_pt__raster__init();
  layer__dibit2_1s__raster__init();
  layer__dibit2_pt__raster__init();
  layer__pois__init();
  layer__external_landuse__init();
  layer__external_lines__init();
  layer__external_poi__init();

}

_init();


