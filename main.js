//Sets up the Audio generation system.
window.AudioContext = window.AudioContext || window.webkitAudioContext;

let context;

const oscillators = {};

const playButton = document.querySelector("#playButton");
playButton.addEventListener("click", () => {
  context = new AudioContext();
  console.log("context:", context);
});

//Converts MIDI notes to a audio frequency.
function midiToFrequency(note) {
  // const a = note; // A 440hz
  return Math.pow(2, (note - 69) / 12) * 444;
}

//Checks if the browser supports MIDI sending/receiving.
if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
}

function onMIDISuccess(midiAccess) {
  console.log("midiAccess :", midiAccess);
  // midiAccess.onstatechange = updateDevices; //Newer method
  midiAccess.addEventListener("statechange", updateDevices);

  //Get Inputs
  const inputs = midiAccess.inputs;

  inputs.forEach((input) => {
    //console.log("myInputs", input); //Logs each input to console.
    // input.onmidimessage = handleInput; //Newer method
    input.addEventListener("midimessage", handleInput);
  });
}

//Displays a message if MIDI fails.
function onMIDIFailure() {
  console.log(
    "No access to MIDI devices or your browser doesn't support WebMIDI API."
  );
}

function updateDevices(event) {
  // console.log(
  //   `Name: ${event.port.name}, Brand: ${event.port.manufacturer}, Type: ${event.port.type}, State: ${event.port.state}`
  // );
  // console.log("event :", event);
}

function handleInput(input) {
  //Uint8Array [MIDI command noteOn: 144, MIDI note # Middle C: 60, MIDI Velocity: 73]

  // console.log("handleInput event data :", input.data);
  const command = input.data[0];
  const note = input.data[1];
  const velocity = input.data[2];
  console.log(command, note, velocity);

  switch (command) {
    case 144: //noteOn
      if (velocity > 0) {
        //note is on
        playNote(note, velocity);
      } else {
        //note is off
        stopNote(note);
      }
      break;
    case 128: //noteOff
      //note is off
      break;
  }
}

//Note On Function
function playNote(note, velocity) {
  console.log("playNote noteOn:", "note :", note, "velocity:", velocity);

  if (note) {
    let notePressed = document.getElementById(`${note}-Note`);
    console.log("playNote notePressed :", notePressed);
    notePressed.classList.add(note, "playing");
  }

  const osc = context.createOscillator();

  const oscGain = context.createGain();

  osc.type = "square";
  osc.frequency.value = midiToFrequency(note);
  oscGain.gain.value = 0.33; //Max volume of the note.

  const velocityGain = context.createGain();
  const velocityGainAmount = (1 / 127) * velocity; //Volume of the note based on pressure.

  velocityGain.gain.value = velocityGainAmount;

  osc.connect(oscGain);
  oscGain.connect(velocityGain);

  velocityGain.connect(context.destination);

  osc.gain = oscGain;
  //console.log("osc.gain:", osc.gain);
  console.log("after oscGain osc:", osc);

  oscillators[note.toString()] = osc;
  //console.log("oscillators :", oscillators);

  osc.start();
}

//Note Off Function
function stopNote(note) {
  if (note) {
    let noteLifted = document.getElementById(`${note}-Note`);
    noteLifted.classList.remove(note, "playing");
    console.log("playNote aNote :", noteLifted);
  }

  //
  console.log("stopNote noteOff:", note);
  const osc = oscillators[note.toString()];
  //console.log("stopNote osc", osc);

  const oscGain = osc.gain;
  //Fades out the note.
  oscGain.gain.setValueAtTime(oscGain.gain.value, context.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);

  setTimeout(() => {
    osc.stop();
    osc.disconnect(); //Disconnects all oscillators.
  }, 25);

  delete oscillators[note.toString()];
  console.log("stopNote oscillators :", oscillators);
}
