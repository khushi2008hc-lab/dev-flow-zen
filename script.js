(function () {
  'use strict';

  // 1. Live Clock
  function updateClock() {
    const el = document.getElementById('live-time');
    const now = new Date();
    el.textContent = now.toTimeString().split(' ')[0];
  }
  setInterval(updateClock, 1000);
  updateClock();

  // 2. Pomodoro Timer
  let timeLeft = 25 * 60;
  let totalTime = 25 * 60;
  let timerActive = false;
  let timerInterval = null;
  const circumference = 2 * Math.PI * 95; // r = 95 -> 596.9

  const timerDisplay = document.getElementById('timer-display');
  const timerCircle = document.getElementById('timer-progress');
  const toggleBtn = document.getElementById('timer-toggle-btn');
  const resetBtn = document.getElementById('timer-reset-btn');

  function updateTimerUI() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const fraction = (totalTime - timeLeft) / totalTime;
    const offset = circumference * (1 - fraction);
    timerCircle.style.strokeDashoffset = offset;
  }

  toggleBtn.addEventListener('click', () => {
    timerActive = !timerActive;
    if (timerActive) {
      toggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
      toggleBtn.style.background = '#ff007f';
      timerInterval = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft--;
          updateTimerUI();
        } else {
          clearInterval(timerInterval);
          timerActive = false;
          toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Focus';
          toggleBtn.style.background = '';
          alert('Focus Session Completed! Take a 5-minute break.');
        }
      }, 1000);
    } else {
      toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume Focus';
      toggleBtn.style.background = '';
      clearInterval(timerInterval);
    }
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerActive = false;
    timeLeft = 25 * 60;
    toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Focus';
    toggleBtn.style.background = '';
    updateTimerUI();
  });
  updateTimerUI();

  // 3. Ambient Synthesizer (Web Audio API)
  let audioCtx = null;
  const audioNodes = {
    rain: null,
    cafe: null,
    alpha: null
  };

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function startSound(type, volume) {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (!audioNodes[type]) {
      const gain = ctx.createGain();
      gain.gain.value = volume;
      gain.connect(ctx.destination);

      if (type === 'rain') {
        // Pink noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        source.connect(filter);
        filter.connect(gain);
        source.start();
        audioNodes[type] = { source, gain };

      } else if (type === 'cafe') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 180;
        const mod = ctx.createOscillator();
        mod.frequency.value = 0.2;
        const modGain = ctx.createGain();
        modGain.gain.value = 40;
        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(gain);
        osc.start();
        mod.start();
        audioNodes[type] = { source: osc, gain };

      } else if (type === 'alpha') {
        // Binaural 432 Hz + 440 Hz (8Hz Alpha beat)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 432;
        osc2.type = 'sine';
        osc2.frequency.value = 440;
        osc1.connect(gain);
        osc2.connect(gain);
        osc1.start();
        osc2.start();
        audioNodes[type] = { source: osc1, gain };
      }
    } else {
      audioNodes[type].gain.gain.setValueAtTime(volume, ctx.currentTime);
    }
  }

  document.querySelectorAll('.vol-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const soundType = e.target.getAttribute('data-sound');
      const val = parseFloat(e.target.value);
      startSound(soundType, val);
    });
  });

  // 4. Kanban Sprint Board
  let tasks = JSON.parse(localStorage.getItem('devflow_tasks')) || [
    { id: '1', title: 'Optimize MySQL schema indexes', status: 'backlog', tag: 'Database' },
    { id: '2', title: 'Build Three.js camera parallax', status: 'progress', tag: 'Graphics' },
    { id: '3', title: 'Deploy portfolio to Vercel production', status: 'done', tag: 'DevOps' }
  ];

  function renderKanban() {
    const cols = { backlog: [], progress: [], done: [] };
    tasks.forEach(t => {
      if (cols[t.status]) cols[t.status].push(t);
    });

    ['backlog', 'progress', 'done'].forEach(st => {
      const dropzone = document.getElementById(`col-${st}`);
      const countEl = document.getElementById(`count-${st}`);
      dropzone.innerHTML = '';
      countEl.textContent = cols[st].length;

      cols[st].forEach(t => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.setAttribute('data-id', t.id);
        card.innerHTML = `
          <div class="task-title">${t.title}</div>
          <span class="task-tag">#${t.tag}</span>
        `;

        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', t.id);
        });

        dropzone.appendChild(card);
      });

      dropzone.addEventListener('dragover', (e) => e.preventDefault());
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const task = tasks.find(x => x.id === id);
        if (task && task.status !== st) {
          task.status = st;
          saveTasks();
          renderKanban();
        }
      });
    });
  }

  function saveTasks() {
    localStorage.setItem('devflow_tasks', JSON.stringify(tasks));
  }

  document.getElementById('add-task-btn').addEventListener('click', () => {
    const title = prompt('Enter Task Title:');
    if (!title) return;
    const tag = prompt('Enter Tag (e.g. Backend, UI, SQL):') || 'Task';
    tasks.push({ id: String(Date.now()), title, status: 'backlog', tag });
    saveTasks();
    renderKanban();
  });
  renderKanban();

  // 5. Scratchpad Persistence
  const scratchpad = document.getElementById('scratchpad-text');
  scratchpad.value = localStorage.getItem('devflow_scratchpad') || '-- Notes & Architectural Snippets\nSELECT * FROM daily_wins WHERE impact = 100;\n';
  scratchpad.addEventListener('input', () => {
    localStorage.setItem('devflow_scratchpad', scratchpad.value);
  });

  // 6. 30-Day Activity Heatmap
  const heatmap = document.getElementById('heatmap-grid');
  for (let i = 0; i < 30; i++) {
    const cell = document.createElement('div');
    const level = (i % 5 === 0) ? 'level-3' : (i % 3 === 0) ? 'level-2' : (i % 2 === 0) ? 'level-1' : '';
    cell.className = `heat-cell ${level}`;
    cell.title = `Day ${i + 1}: ${level ? 'Completed Sprints' : 'Rest'}`;
    heatmap.appendChild(cell);
  }
})();
