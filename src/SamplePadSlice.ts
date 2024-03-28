import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  MadeonSamplePadInstance,
  PadConfig,
  SamplePadState,
} from "./MadeonSamplePad";
import {
  applyPadConfigToSamplePadState,
  applyQueuedStateToExistingState,
  isSamplePadStateEmpty,
  removeSampleFromState,
} from "./Util";

// Define a type for the slice state
interface SamplePadSliceState {
  value: number;
  loadedState: "idle" | "pending" | "succeeded" | "failed";
  currentSamples: SamplePadState;
  queuedSamples: SamplePadState;
  playingState: "stopped" | "started" | "paused";
}

//todo: probably just make this its own loading function <3
export const asyncAddSampleToQueue = createAsyncThunk(
  "samplepad/asyncAddSampleToQueue",
  async (samplePad: PadConfig) => {
    if (!MadeonSamplePadInstance.initialized) {
      await MadeonSamplePadInstance.init();
    }
    console.log("finished");
    return samplePad;
  }
);

// Define the initial state using that type
const initialState: SamplePadSliceState = {
  value: 0,
  loadedState: "idle",
  currentSamples: {
    drum: [],
    bass: [],
    sounds: [],
  },
  queuedSamples: {
    drum: [],
    bass: [],
    sounds: [],
  },
  playingState: "stopped",
};

export const samplePadSlice = createSlice({
  name: "samplepad",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    addSampleToQueue: (state, action: PayloadAction<PadConfig>) => {
      const newQueuedState = applyPadConfigToSamplePadState(
        state.queuedSamples,
        action.payload
      );

      state.queuedSamples = newQueuedState;
      if (state.playingState != "started") {
        state.playingState = "started";
      }
    },
    removePadFromCurrent: (state, action: PayloadAction<PadConfig>) => {
      state.currentSamples = removeSampleFromState(
        action.payload,
        state.currentSamples
      );
      if (
        isSamplePadStateEmpty(state.currentSamples) &&
        isSamplePadStateEmpty(state.queuedSamples)
      ) {
        state.playingState = "stopped";
      }
    },
    pause: (state) => {
      state.playingState = "paused";
    },
    play: (state) => {
      state.playingState = "started";
    },
    stop: (state) => {
      state.currentSamples = {
        drum: [],
        bass: [],
        sounds: [],
      };
      state.queuedSamples = {
        drum: [],
        bass: [],
        sounds: [],
      };
      state.playingState = "stopped";
    },
    applyQueueToCurrent: (state) => {
      state.currentSamples = applyQueuedStateToExistingState(
        state.queuedSamples,
        state.currentSamples
      );
      state.queuedSamples = {
        drum: [],
        bass: [],
        sounds: [],
      };
      if (isSamplePadStateEmpty(state.currentSamples)) {
        state.playingState = "stopped";
      }
    },
    decrement: (state) => {
      state.value -= 1;
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
  extraReducers: (builder) => {
    // Add reducers for additional action types here, and handle loading state as needed
    builder.addCase(
      asyncAddSampleToQueue.fulfilled,
      (state, action: PayloadAction<PadConfig>) => {
        state.loadedState = "succeeded";
        const newQueuedState = applyPadConfigToSamplePadState(
          state.queuedSamples,
          action.payload
        );

        state.queuedSamples = newQueuedState;
        if (state.playingState != "started") {
          state.playingState = "started";
        }
      }
    );
    builder.addCase(asyncAddSampleToQueue.pending, (state) => {
      state.loadedState = "pending";
    });
  },
});

export const {
  applyQueueToCurrent,
  addSampleToQueue,
  removePadFromCurrent,
  decrement,
  incrementByAmount,
  pause,
  play,
  stop,
} = samplePadSlice.actions;

export default samplePadSlice.reducer;
