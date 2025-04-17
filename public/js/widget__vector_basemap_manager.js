import { mymap__isReady,mymap__get } from './mapState.js';
let _mymap;

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function widget__vector_basemap_manager__init(){

  if(mymap__isReady() == false){
    await timeout(500);
    return await widget__vector_basemap_manager__init();
    // return false;
  }
  _mymap = mymap__get();

  let _container = $('.wrapper__bottomright_widget');

  _container.html(`
    <div class="vector_layer--title" style="\
      padding: 0.5rem;
      border-bottom: 1px solid #aaa;
      display: flex;
      justify-content: space-between;
      background: white;
      ">
      <div><b>CARTO.STREET</b></div>
      <div class="vector_layer--close" \
        style="cursor:pointer;" \
        ><i class="bi bi-x-octagon-fill"></i></div>
    </div>
    <div class="vector_layers_container" style="\
      background-color: #ccc;
      width: 250px;
      max-height: calc(100vh - 2rem - 32px - 1rem - 36px); /*400px;*/
      overflow: auto;
      ">
    </div>
  `);

  $(`.vector_layer--close`).click(function(){
    $(`.wrapper__bottomright_widget`).html('');
  });

  _prepare();

}

function _prepare(){

  let _vector_layers = _mymap.getStyle().layers;
  console.log(_vector_layers);
  let i = 0;
  _vector_layers.forEach(element => {

    i++;

    let _background = `#fff`;
    if (typeof element.id !== 'undefined' && element.id.startsWith(`id-lyr`)) {
      _background = `darkseagreen`;
    }

    let _checked = 'checked';
    if(typeof element?.layout !== 'undefined' 
      && typeof element?.layout?.visibility !== 'undefined'
      && element.layout.visibility == 'none'){
      _checked = '';
    }

    // console.log(element.type);
    let _icon = '';
    switch(element.type){
      case 'line':
        _icon = `material-symbols--road-rounded`;
        break;
      case 'fill':
        _icon = `material-symbols--grid-on-outline`;
        break;
      case 'symbol':
        _icon = `bi bi-fonts`;
        break;
      case 'circle':
        _icon = `material-symbols--circle-outline`;
        break;
      case 'background':
        _icon = `material-symbols--flip-to-back-sharp`;
        break;
    }

    $('.vector_layers_container').append(`
      <div class="vector_layer" style="\
        padding: 0.5rem;
        border-bottom: 1px solid #aaa;
        background: ${_background};
        display: grid;
        grid-template-columns: 13px 1fr 24px;
        grid-template-areas: 'check label icon';
        gap: 0.5rem;
        align-items: center;
        ">
        <input type="checkbox" class="form-check-input vector_layer__check__input" \
          vector_layer_id="${element.id}" \
          style="grid-area: check;margin:0px;" ${_checked} />
        <span \
          style="grid-area: label;">${element.id}</span>
        <span \
          style="grid-area: icon;text-align:center;"><i class="${_icon}"></i></span>
      </div>
    `);
  });

  $(`.vector_layer__check__input`).change(function(){
    let _layer_id = $(this).attr('vector_layer_id');
    _mymap.setLayoutProperty(_layer_id, 'visibility', $(this).is(':checked') ? 'visible' : 'none');
  });

}