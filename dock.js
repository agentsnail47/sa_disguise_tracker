let ws;


function send(data) {
  ws.send(JSON.stringify({ type: 'admin', data: data }));
}

function populateMissions(files) {
  const el = document.getElementById('mission-disguise-files');
  el.innerHTML = '';
  files.forEach(e => {
    el.options.add(new Option(e, e));
  });
}

function setDisguises(disguises) {
  clearDisguises();
  const el = document.getElementById('disguises');
  disguises.forEach(e => {
    el.insertAdjacentHTML('beforeend', `<img title="${e.name}" src="${e.image}">`);
  });
}

function clearDisguises() {
  document.getElementById('disguises').innerHTML = '';
}

window.addEventListener('load', () => {
  ws = new WebSocket(new URLSearchParams(location.search).get('s'));
  ws.addEventListener('open', (e) => {
    send({ 'cmd': 'hi' });
  });
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

  document.getElementById('disguise-roll').addEventListener('click', e => {
    send({
      cmd: 'roll_disguises',
      file: document.getElementById('mission-disguise-files').value,
      n: parseInt(document.getElementById('n-disguises').value),
      always_suit: document.getElementById('always-suit').checked
    });
  });

  // document.getElementById('disguise-revive').addEventListener('click', e => {
  //   send({ cmd: 'revive_last_disguises' });
  // });

  document.getElementById('n-disguises').addEventListener('input', e => {
    document.getElementById('n-disguises-val').innerText = e.target.value;
  });
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
});
