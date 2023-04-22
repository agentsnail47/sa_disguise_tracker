let ws;
let id;

function send(data) {
  ws.send(JSON.stringify({ type: 'disguises', id: id, data: data, id: id }));
}

function setDisguises(disguises) {
  clearDisguises();
  const el = document.getElementById('disguises');
  disguises.forEach(e => {
    el.insertAdjacentHTML('beforeend', `<img src="${e.image}">`);
  });
}

function setDisguiseState(disguise, yes) {
  const el = Array.from(document.querySelectorAll('#disguises img'))
        .find(e => e.src === disguise);
  if (yes) {
    el.classList.add('yes');
  } else {
    el.classList.remove('yes');
  }
}

function clearDisguises() {
  document.getElementById('disguises').innerHTML = '';
}

window.addEventListener('load', () => {
  const p = new URLSearchParams(location.search);
  ws = new WebSocket(p.get('s'));
  id = p.get('id');
  ws.addEventListener('open', (e) => {
    send({ 'cmd': 'hi' });
  });
  ws.addEventListener('message', e => {
    const data = JSON.parse(e.data);
    console.log(`ws received:${JSON.stringify(data)}`);
    switch (data.cmd) {
    case 'disguises':
      setDisguises(data.disguises);
      break;
    case 'disguise_state':
      setDisguiseState(data.d, data.yes);
    default:
    };
  });
});
