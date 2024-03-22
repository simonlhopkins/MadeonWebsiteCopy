import * as Tone from "tone";
import { applyQueuedStateToExistingState } from "./Util";

//types
export type SampleLoopCallbackType = (
  currentSamples: SamplePadState,
  time: number,
  loopDuration: number
) => void;
export type SamplePadState = {
  drum: PadConfig[];
  bass: PadConfig[];
  sounds: PadConfig[];
};

export enum PadType {
  DRUM,
  BASS,
  SOUNDS,
}

export type PadConfig = {
  type: PadType;
  index: number;
};

class MadeonSamplePad {
  private drumSamples: Tone.Player[] = [];
  private bassSamples: Tone.Player[] = [];
  private soundSamples: Tone.Player[] = [];

  private sampleLoopCallbackID = 0;
  private sampleLoopCallbackMap = new Map<number, SampleLoopCallbackType>();
  private isIdle = true;

  currentState: SamplePadState = {
    drum: [],
    bass: [],
    sounds: [],
  };
  queuedState: SamplePadState = {
    drum: [],
    bass: [],
    sounds: [],
  };
  bpm: number = 110;
  initialized = false;
  debugCurrentlyPlaying: PadConfig | null = null;

  constructor() {
    document.addEventListener("visibilitychange", () => {});
  }

  async createPlayer(url: string): Promise<Tone.Player> {
    return new Promise((resolve, reject) => {
      const player: Tone.Player = new Tone.Player({
        onerror: (err) => reject(err),
        onload: () => resolve(player as Tone.Player),
        url: url,
      });
    });
  }

  async loadSamples() {
    const loadSoundArr = async (type: string, num: number) => {
      const loadPromises = [];
      for (let i = 1; i < num + 1; i++) {
        let newLoadPromise = this.createPlayer(`sounds/ogg/${type}.1.${i}.ogg`)
          .then((result) => result.toDestination())
          .catch((e) => {
            console.log(`couldn't load ogg [${e.message}], trying mp3`);

            return this.createPlayer(`sounds/mp3/${type}.1.${i}.mp3`).then(
              (result) => result.toDestination()
            );
          });
        loadPromises.push(newLoadPromise);

        // newPlayer.fadeOut = 0.05;
        // newPlayer.fadeIn = 0.05;
      }
      let ret = await Promise.all(loadPromises);
      return ret;
    };

    this.drumSamples = await loadSoundArr("drum", 10);
    this.bassSamples = await loadSoundArr("bass", 10);
    this.soundSamples = await loadSoundArr("sounds", 16);

    await Tone.loaded();
  }

  getSampleFromPadConfig(padConfig: PadConfig) {
    switch (padConfig.type) {
      case PadType.BASS:
        return this.bassSamples[padConfig.index];
      case PadType.DRUM:
        return this.drumSamples[padConfig.index];
      case PadType.SOUNDS:
        return this.soundSamples[padConfig.index];
    }
  }
  async setQueuedSamplePadState(newState: SamplePadState) {
    if (!this.initialized) await this.init();
    if (this.isIdle) {
      Tone.Transport.start();
      this.isIdle = false;
    }
    this.queuedState = newState;
  }

  ///ehhhh
  addSampleLoopCallback(callback: SampleLoopCallbackType) {
    const newID = this.sampleLoopCallbackID++;
    this.sampleLoopCallbackMap.set(newID, callback);
    return newID;
  }

  removeSampleLoopCallback(id: number) {
    if (this.sampleLoopCallbackMap.has(id)) {
      this.sampleLoopCallbackMap.delete(id);
    } else {
      console.warn(
        `Trying to remove an id [${id}] that is not in the loop map`
      );
    }
  }
  getCurrentTransportTime() {
    return Tone.Transport.immediate();
  }
  private onSampleLoop(time: number, loopDuration: number) {
    this.currentState = applyQueuedStateToExistingState(
      this.queuedState,
      this.currentState
    );
    //end move to a function
    //this.currentState is updated now

    this.sampleLoopCallbackMap.forEach((callback) => {
      //pass a copy of the state to each of them
      callback({ ...this.currentState }, time, loopDuration);
    });

    this.currentState.bass.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.currentState.sounds.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.currentState.drum.forEach((config) => {
      this.getSampleFromPadConfig(config).start();
    });
    this.queuedState = {
      drum: [],
      bass: [],
      sounds: [],
    };
    //nothing is playing
    if (
      this.currentState.sounds.length == 0 &&
      this.currentState.drum.length == 0 &&
      this.currentState.bass.length == 0
    ) {
      Tone.Transport.stop();
      Tone.Transport.seconds = 0;
      this.isIdle = true;
    }
  }

  async init() {
    if (this.initialized) {
      console.log("Madeon Sample Pad Already initialized");
      return;
    }
    console.log("initializings");
    this.initialized = true;
    console.log("starting tone");
    await Tone.start();
    await Tone.context.resume();
    console.log("loading samples");
    await this.loadSamples();

    console.log("samples loaded");
    Tone.Transport.scheduleRepeat(
      (time) => {
        this.onSampleLoop(time, Tone.Transport.toSeconds("2m"));
      },
      "2m",
      "0"
    );
    Tone.Transport.bpm.value = this.bpm;
    this.onSampleLoop(0, Tone.Transport.toSeconds("2m"));
  }
}

//Singleton :( this works for a small project like this :) Maybe can make a member of the App Component as a ref or something.
//I need to reference it in Pad and in App
export const MadeonSamplePadInstance = new MadeonSamplePad();
