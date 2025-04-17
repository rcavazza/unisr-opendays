function adjustWrapperHeight() {
  const wrapper = document.querySelector('.wrapper');
  wrapper.style.height = `${window.innerHeight}px`;
}

window.addEventListener('resize', adjustWrapperHeight);
window.addEventListener('orientationchange', adjustWrapperHeight);
document.addEventListener('DOMContentLoaded', adjustWrapperHeight);

$(`.siderbar__open--btn`).click(function(){
  $(`.wrapper`).css({
    "grid-template-columns": "1fr 0px"
  });
  $(`.sidebar__body, .sidebar__footer`).css({
    "display": "block"
  });
  $(`.sidebar__header`).css({
    "display": "flex"
  });
  $(`.siderbar__open--box`).toggle();
  $(`.siderbar__close--box`).toggle();
  $(`.no-sidebar--container`).toggle();
});

$(`.siderbar__close--btn`).click(function(){
  $(`.wrapper`).css({
    "grid-template-columns": "0px 1fr "
  });
  $(`.sidebar__header, .sidebar__body, .sidebar__footer`).css({
    "display": "none"
  });
  $(`.siderbar__open--box`).toggle();
  $(`.siderbar__close--box`).toggle();
  $(`.no-sidebar--container`).toggle();
});