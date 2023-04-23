let ws;
let id;

function send(data) {
  ws.send(JSON.stringify({ type: 'admin', id: id, data: data }));
}

function populateMissions(files) {
  const el = document.getElementById('mission-disguise-files');
  el.innerHTML = '';
  files.forEach(e => {
    el.options.add(new Option(e, e));
  });
}

function setDisguises(disguises) {
  document.getElementById('disguises').innerHTML = '';
  const el = document.getElementById('disguises');
  disguises.forEach(e => {
    el.insertAdjacentHTML('beforeend', `<img title="${e.name}" src="${e.image}">`);
  });
  for (let i = 0; i < 4 - disguises.length; i++) {
    el.insertAdjacentHTML('beforeend', `<div></div>`);
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
      switch (data.cmd) {
      case 'mission_disguise_files':
        populateMissions(data.files);
        break;
      case 'disguises':
        setDisguises(data.disguises);
        break;
      default:
      };
    });
  }
}

window.addEventListener('load', () => {
  const p = new URLSearchParams(location.search);
  id = p.get('id');
  connect();

  document.getElementById('disguise-rolls').addEventListener('click', e => {
    const el = e.target;
    console.log(el);
    if (el.type === 'button') {
      send({
        cmd: 'roll_disguises',
        file: document.getElementById('mission-disguise-files').value,
        n: parseInt(el.dataset.n),
        always_suit: document.getElementById('always-suit').checked
      });
    }
  });

  // document.getElementById('disguise-revive').addEventListener('click', e => {
  //   send({ cmd: 'revive_last_disguises' });
  // });

  document.getElementById('disguise-clear').addEventListener('click', e => {
    send({ cmd: 'disguise_clear' });
    clearDisguises();
  });

  document.getElementById('disguises').addEventListener('click', e => {
    if (e.target.classList.contains('yes')) {
      e.target.classList.remove('yes');
    } else {
      e.target.classList.add('yes');
    }
    send({
      cmd: 'disguise_state',
      d: e.target.src,
      yes: e.target.classList.contains('yes')
    });
  });

  clearDisguises();

  setInterval(connect, 5000);
});
