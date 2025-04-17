import { mymap__isReady,mymap__get } from './mapState.js';
import { widget__vector_basemap_manager__init } from './widget__vector_basemap_manager.js';
let _mymap;

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function widget__bottomright_expandible__init(){

  if(mymap__isReady() == false){
    await timeout(500);
    return await widget__bottomright_expandible__init();
    // return false;
  }
  _mymap = mymap__get();

  $('.maplibregl-ctrl').remove(); // Remove Mapbox attribution

  let _container = $('.wrapper__bottomright_space');

  _container.append(`
    <div class="bottomright_container">
      <div class="btn-group"
        style="
          background-color:white;
        ">
        <div class="bottomright__copy__details hidden" style="
          display: flex;
          align-items: center;
          padding: 0.5rem;
          ">
          <div class="maplibregl-ctrl-attrib-inner"><a href="https://maplibre.org/" target="_blank">MapLibre</a> | © <a href="https://carto.com/about-carto/" target="_blank" rel="noopener">CARTO</a>, © <a href="http://www.openstreetmap.org/about/" target="_blank">OpenStreetMap</a> contributors</div>
        </div>
        <button class="bottomright__tool--btn btn btn-sm btn-primary btn-sm-quad hidden" \
          action="vector-basemap-manager">
          <i class="bi bi-collection"></i></button>
        <button class="bottomright__tool--btn btn btn-sm btn-primary btn-sm-quad hidden" \
          action="linkedin">
          <i class="bi bi-linkedin"></i></button>
        <button class="bottomright__tool--btn btn btn-sm btn-primary btn-sm-quad hidden" \
          disabled>
          <i class="bi bi-balloon-heart"></i></button>
        <button class="bottomright__expand--btn btn btn-sm btn-light btn-sm-quad"><i class="bi bi-box-arrow-left"></i></button>
        <button class="bottomright__copy btn btn btn-link" style="width:102px;">MapLibre</button>
      </div>
    </div>
  `);

  $(`.bottomright__copy`).click(function(){
    if($(`.bottomright__copy__details`).hasClass('hidden')){
      $(`.bottomright__copy__details`).removeClass('hidden');
      $(`.bottomright__tool--btn`).addClass('hidden');
    }
    else{
      $(`.bottomright__copy__details`).addClass('hidden');
    }
  });

  $(`.bottomright__expand--btn`).click(function(){
    if($(`.bottomright__tool--btn`).hasClass('hidden')){
      $(`.bottomright__tool--btn`).removeClass('hidden');
      $(`.bottomright__copy__details`).addClass('hidden');
    }
    else{
      $(`.bottomright__tool--btn`).addClass('hidden');
    }
  });

  $(`.bottomright__tool--btn`).click(function(){
    let _action = $(this).attr('action');
    if(_action == 'vector-basemap-manager'){
      widget__vector_basemap_manager__init();
    }
    else if(_action == 'linkedin'){
      window.open('https://www.linkedin.com/groups/9108801/', '_blank');
    }
  });

}