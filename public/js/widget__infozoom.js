import { mymap__isReady,mymap__get } from './mapState.js';
let _mymap;

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function widget__infozoom__init(){

  if(mymap__isReady() == false){
    await timeout(500);
    return await widget__infozoom__init();
    // return false;
  }
  _mymap = mymap__get();

  let _container = $('.wrapper__topright_space');

  _container.append(`
    <div class="stars_container" style="\
      background-color: #ccc;
      color: #000;
      border: 1px solid #b7b7b7;
      display: flex;
      gap: 0.5rem;
      padding: 0.2rem 0.5rem;
      border-radius: 0px;
      justify-content: center;
      align-items: center;
      ">
      <div><i class="fg-pyramid"></i></div>
      <div class="zoom--current">0</div>
    </div>
  `);
  let _zoom = _mymap.getZoom();
  $(`.zoom--current`).text(numbro(_zoom).format({mantissa: 1}));

  _mymap.on('zoomend', () => {
    let _zoom = _mymap.getZoom();
    $(`.zoom--current`).text(numbro(_zoom).format({mantissa: 1}));
  });

}