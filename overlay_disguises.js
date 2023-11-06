class Overlay {
  constructor() {
    this.id = new URLSearchParams(location.search).get('id');
    this.connect();
    this.clearDisguises();

    setInterval(this.connect.bind(this), 5000);
  }

  send(data) {
    this.ws.send(JSON.stringify({ type: 'disguises', id: this.id, data: data }));
  }

  connect() {
    const _this = this;
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      const p = new URLSearchParams(location.search);
      this.ws = new WebSocket(p.get('s'));
      this.ws.addEventListener('open', (e) => {
        _this.send({ 'cmd': 'hi' });
      });
      this.ws.onclose = function(e) {
        console.log(`ws close:${e.reason}`);
        _this.ws = null;
        setTimeout(_this.connect.bind(_this), 1000);
      };
      this.ws.onerror = function(err) {
        console.error(`ws error:${err.message}`);
        _this.ws.close();
      };
      this.ws.addEventListener('message', this.processMessage.bind(this));
    }
  }

  processMessage(m) {
    const data = JSON.parse(m.data);
    console.log(`ws received:${JSON.stringify(data)}`);
    switch (data.cmd) {
    case 'disguise.set':
      this.setDisguises(data.disguises);
      break;
    case 'disguise.state':
      this.setDisguiseState(data.d, data.yes);
      break;
    default:
    };
  }

  setDisguises(disguises) {
    document.getElementById('disguises').innerHTML = '';
    const el = document.getElementById('disguises');
    disguises.forEach(e => {
      el.insertAdjacentHTML('beforeend', `<img src="${e.image}">`);
    });
    for (let i = 0; i < 4 - disguises.length; i++) {
      el.insertAdjacentHTML('beforeend', `<div></div>`);
    }
  }

  setDisguiseState(disguise, yes) {
    const el = Array.from(document.querySelectorAll('#disguises img'))
          .find(e => e.src === disguise);
    if (yes) {
      el.classList.add('yes');
    } else {
      el.classList.remove('yes');
    }
  }

  clearDisguises() {
    this.setDisguises([]);
  }
}

window.addEventListener('load', () => { 
  new Overlay();
});
