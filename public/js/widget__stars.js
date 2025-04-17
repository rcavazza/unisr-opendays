let stars_addedd = false;
export async function widget__stars__init(){

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
        cursor: pointer;
        ">
        <div><i class="bi bi-star stars--icon"></i></div>
        <div class="stars--count">0</div>
      </div>
    `);

    $('.stars_container').on('click', async function(){
      if(stars_addedd){
        return;
      }
      stars_addedd = true;
      $(`.stars--count`).text(parseInt($(`.stars--count`).text()) + 1);
      $(`.stars--icon`).css('color','yellow');
      $(`.stars--icon`).removeClass('bi-star');
      $(`.stars--icon`).addClass('bi-star-fill');
      let _r = await Promise.all([
        _axios("stars__add")
      ]);
    });

    let _r = await Promise.all([
      _axios("stars__get")
    ]);

    $(`.stars--count`).text(parseInt(_r[0].data.features[0].properties.stars));

}

async function _axios(name){

  let _url = './api/data/';

  return new Promise((resolve, reject) => {

    axios
      .post(_url, {
        name:name,
        project_pid: PROJECT_PID
      })
      .then((response) => {

        const _r = response;
        // _onsole.log(_r);
        // if(parseInt(_r.data.response) != parseInt(200)){
        //   console.log('No features found');
        //   return false;
        // }
        resolve(_r); // Resolve the promise

      })
      .catch((error) => {
        console.error(error);
        reject(error); // Reject the promise if there's an error
      })

  }); // Promise
}
