let ws;
let id;

function send(data) {
  ws.send(JSON.stringify({ type: 'disguises', id: id, data: data, id: id }));
}

function setDisguises(disguises) {
  document.getElementById('disguises').innerHTML = '';
  const el = document.getElementById('disguises');
  disguises.forEach(e => {
    el.insertAdjacentHTML('beforeend', `<img src="${e.image}">`);
  });
  for (let i = 0; i < 4 - disguises.length; i++) {
    el.insertAdjacentHTML('beforeend', `<div></div>`);
  }
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
  setDisguises([]);
}

function connect() {
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    const p = new URLSearchParams(location.search);
    ws = new WebSocket(p.get('s'));
    ws.addEventListener('open', (e) => {
      send({ 'cmd': 'hi' });
    });
    ws.onclose = function(e) {
      console.log(`ws close:${e.reason}`);
      ws = null;
      setTimeout(function() {
        connect();
      }, 1000);
    };
    ws.onerror = function(err) {
      console.error(`ws error:${err.message}`);
      ws.close();
    };
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
  }
}

setInterval(connect, 5000);

window.addEventListener('load', () => { 
  id = new URLSearchParams(location.search).get('id');
  connect();
  clearDisguises();
});
