class Dock {
  constructor() {
    const p = new URLSearchParams(location.search);
    this.id = p.get('id');
    this.connect();

    this.clearDisguises();
    this.initCampaign();

    this.initEvents();

    setInterval(this.connect.bind(this), 5000);
  }

  send(data) {
    this.ws.send(JSON.stringify({ type: 'admin', id: this.id, data: data }));
  }

  initEvents() {
    document.getElementById('disguise-rolls').addEventListener('click', e => {
      const el = e.target;
      if (el.type === 'button') {
        this.send({
          cmd: 'disguise.roll',
          file: document.getElementById('mission-disguise-files').value,
          n: parseInt(el.dataset.n),
          showdown: el.dataset.showdown === '1',
          always_suit: document.getElementById('always-suit').checked
        });
      }
    });

    document.getElementById('disguise-clear').addEventListener('click', e => {
      this.send({ cmd: 'disguise.clear' });
    });

    document.getElementById('disguises')
      .addEventListener('click', this.disguiseClicked.bind(this));

    document.getElementById('campaign-actions').addEventListener('click', this.campaignAction.bind(this));
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
        console.log(`ws close:${e}`);
        _this.ws = null;
        setTimeout(_this.connect.bind(_this), 1000);
      };
      this.ws.onerror = function(err) {
        console.error(`ws error:${err.message}`);
        _this.ws.close();
      };
      this.ws.addEventListener('message', this.processIncoming.bind(this))
    }
  }

  // Disguise-related methods
  populateMissions(files) {
    const el = document.getElementById('mission-disguise-files');
    el.innerHTML = '';
    files.forEach(e => {
      el.options.add(new Option(e, e));
    });
  }

  setDisguises(disguises) {
    const el = document.getElementById('disguises');
    el.innerHTML = '';
    disguises.forEach(e => {
      el.insertAdjacentHTML('beforeend', `<img title="${e.name}" src="${e.image}">`);
    });
    for (let i = 0; i < 4 - disguises.length; i++) {
      el.insertAdjacentHTML('beforeend', `<div></div>`);
    }
  }

  disguiseClicked(e) {
    if (e.target.tagName !== 'IMG') {
      return;
    }
    const yes = e.target.classList.contains('yes');
    this.send({
      cmd: 'disguise.state',
      d: e.target.src,
      yes: !yes
    });
  }

  setDisguiseState(d, yes) {
    const el = Array.from(document.querySelectorAll('#disguises img'))
          .find(e => e.src === d);
    if (yes) {
      el.classList.add('yes');
    } else {
      el.classList.remove('yes');
    }
  }

  clearDisguises() {
    this.setDisguises([]);
  }

  // ------------------------
  // Campaign-related methods
  initCampaign() {
    this.missionI = 1; // 1-18
    this.campaignEnded = false;
    this.resetCampaign();
  }

  // Send campaign action to server
  campaignAction(e) {
    if (e.target.tagName !== 'INPUT' && e.target.type !== 'button') {
      return;
    }
    const data = {
      cmd: 'campaign.action',
      action: e.target.dataset.action,
      state: e.target.dataset.state
    };
    if (e.target.dataset.action === 'campaign.sync') {
      data.state = {
        missionI: this.missionI,
        campaignEnded: this.campaignEnded,
        states: Array.from(document.querySelectorAll('.mission')).map(e => { return { text: e.innerText, class: e.className } })
      };
    }
    this.send(data);
  }

  currentMission() {
    return document.getElementById(`m${this.missionI}`);
  }

  advanceCampaign(type) {
    if (this.campaignEnded) {
      return;
    }
    let el = this.currentMission();
    el.classList.remove('current_mission');
    switch (type) {
    case 'green':
      el.classList.add('green_guns');
      if (this.missionI === 18) {
        let i = 1;
        let greenCount = 0;
        do {
          if (document.getElementById(`m${i}`).classList.contains('green_guns')) {
            greenCount += 1;
          }
        } while (greenCount === i && ((i += 1) <= 18));
        if (greenCount === 18) {
          el.innerHTML = '&#128081;';
        }
      }
      break;
    case 'red': el.classList.add('red_guns'); break;
    case 'fail':
      el.classList.add('red_guns');
      el.innerHTML = '&#x1f480;';
      break;
    case 'cheese':
      el.classList.add('red_guns');
      el.innerHTML = '&#129472;';
      break;
    default:
    };
    if (this.missionI === 18) {
      this.campaignEnded = true;
      return;
    }
    this.missionI += 1;
    el = this.currentMission();
    el.classList.add('current_mission');
  }

  undoCampaign() {
    if (this.campaignEnded) {
      let el = this.currentMission();
      el.classList.remove('red_guns', 'green_guns', 'winning');
      el.classList.add('current_mission');
      el.innerText = '';
      this.campaignEnded = false;
    } else if (this.missionI > 1) {
      let el = this.currentMission();
      el.classList.remove('current_mission', 'red_guns', 'green_guns');
      el.innerText = '';
      this.missionI -= 1;
      el = this.currentMission();
      el.classList.remove('current_mission', 'red_guns', 'green_guns');
      el.classList.add('current_mission');
      el.innerText = '';
      this.campaignEnded = false;
    }
  }

  resetCampaign() {
    let el;
    for (let i = 1; i <= 18; i++) {
      el = document.getElementById(`m${i}`);
      el.classList.remove('current_mission', 'red_guns', 'green_guns', 'winning');
      el.innerText = '';
    }
    this.missionI = 1;
    this.currentMission().classList.add('current_mission');
    this.campaignEnded = false;
  }

  // Message processing
  processIncoming(m) {
    const data = JSON.parse(m.data);
    console.log(data);
    switch (data.cmd) {
    case 'disguise.mission_files':
      this.populateMissions(data.files);
      break;
    case 'disguise.set':
      this.setDisguises(data.disguises);
      break;
    case 'disguise.state':
      this.setDisguiseState(data.d, data.yes);
      break;
    case 'disguise.clear':
      this.clearDisguises();
      break;
    case 'campaign.advance':
      this.advanceCampaign(data.state);
      break;
    case 'campaign.undo':
      this.undoCampaign();
      break;
    case 'campaign.reset':
      this.resetCampaign();
      break;
    default:
    };
  }
};

window.addEventListener('load', () => {
  const d = new Dock();
});
