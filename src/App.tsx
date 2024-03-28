import { useRef, useState } from "react";
import styled from "styled-components";
import { MadeonSamplePadInstance, PadConfig, PadType } from "./MadeonSamplePad";
import { asyncAddSampleToQueue, pause, stop } from "./SamplePadSlice";
import {
  getColorFromPadType,
  samplePadStateContainsPadConfig,
  useAddToRenderLoop,
} from "./Util";
import PauseOverlay from "./components/PauseOverlay";
import SamplePad from "./components/SamplePad";
import { useAppDispatch, useAppSelector } from "./store";

function App() {
  const [immediateStop, setImmediateStop] = useState<boolean>(false);
  const keyFrames = [
    { transform: "scale(1)", easing: "ease-in-out", offset: 0.1 },
    { transform: "scale(1.3)", easing: "ease-in-out", offset: 0.2 },
    { transform: "scale(1)", easing: "ease-in-out" },
  ];

  const currentSamplePadState = useAppSelector(
    (state) => state.samplePad.currentSamples
  );

  const bassRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const soundsRef = useRef<HTMLDivElement>(null);

  const playingState = useAppSelector((store) => store.samplePad.playingState);

  useAddToRenderLoop(
    (currentSamples) => {
      if (currentSamples.bass.length > 0) {
        bassRef.current?.animate(keyFrames, {
          duration: (MadeonSamplePadInstance.getLoopDuration() / 8) * 1000,
          composite: "add",
          iterations: 8,
        });
      }
    },
    () => {
      bassRef.current?.getAnimations().forEach((i) => i.cancel());
    },
    [currentSamplePadState.bass.length > 0]
  );
  useAddToRenderLoop(
    (currentSamples) => {
      if (currentSamples.drum.length > 0) {
        drumRef.current?.animate(keyFrames, {
          duration: (MadeonSamplePadInstance.getLoopDuration() / 8) * 1000,
          composite: "add",
          iterations: 8,
        });
      }
    },
    () => {
      drumRef.current?.getAnimations().forEach((i) => i.cancel());
    },
    [currentSamplePadState.drum.length > 0]
  );
  useAddToRenderLoop(
    (currentSamples) => {
      if (currentSamples.sounds.length > 0) {
        soundsRef.current?.animate(keyFrames, {
          duration: (MadeonSamplePadInstance.getLoopDuration() / 8) * 1000,
          composite: "add",
          iterations: 8,
        });
      }
    },
    () => {
      soundsRef.current?.getAnimations().forEach((i) => i.cancel());
    },
    [currentSamplePadState.sounds.length > 0]
  );

  const loadedState = useAppSelector((state) => state.samplePad.loadedState);
  const dispatch = useAppDispatch();

  const onClick = async (padConfig: PadConfig) => {
    if (loadedState == "pending") {
      return;
    }
    if (
      immediateStop &&
      samplePadStateContainsPadConfig(currentSamplePadState, padConfig)
    ) {
      MadeonSamplePadInstance.stopSoundImmediately(padConfig);
    } else {
      dispatch(asyncAddSampleToQueue(padConfig));
    }
  };
  return (
    <>
      {playingState == "paused" && <PauseOverlay />}
      <h1>Click on a square to begin!</h1>
      <h2>
        You can have one{" "}
        <StyledPadTypeSpan ref={bassRef} $padType={PadType.BASS}>
          bass
        </StyledPadTypeSpan>
        , one{" "}
        <StyledPadTypeSpan ref={drumRef} $padType={PadType.DRUM}>
          drum
        </StyledPadTypeSpan>
        , and 3{" "}
        <StyledPadTypeSpan ref={soundsRef} $padType={PadType.SOUNDS}>
          melody
        </StyledPadTypeSpan>
      </h2>

      <SamplePad
        currentSamplePadState={currentSamplePadState}
        onPadClick={onClick}
      />
      <button
        disabled={playingState != "started"}
        onClick={() => dispatch(pause())}
      >
        pause
      </button>
      <button
        disabled={playingState != "started"}
        onClick={() => {
          dispatch(stop());
        }}
      >
        stop
      </button>

      <button
        className={immediateStop ? "toggled" : ""}
        onClick={() => {
          setImmediateStop(!immediateStop);
        }}
      >
        {immediateStop ? "instant stop samples" : "stop samples on loop"}
      </button>
      <h2>
        This was 100% stolen from{" "}
        <a href="https://adventuremachine.4thfloorcreative.co.uk/adventuremachine/?t=5,16,34">
          this website
        </a>{" "}
        so credit to them!
      </h2>

      <h3>made this for learning</h3>
    </>
  );
}

const StyledPadTypeSpan = styled.span<{ $padType: PadType }>`
  color: ${(props) => getColorFromPadType(props.$padType, 1)};
  display: inline-block;
`;

export default App;
