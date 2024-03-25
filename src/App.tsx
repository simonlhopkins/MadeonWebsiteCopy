import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  MadeonSamplePadInstance,
  PadConfig,
  PadType,
  SamplePadState,
} from "./MadeonSamplePad";
import {
  applyPadConfigToSamplePadState,
  getColorFromPadType,
  samplePadStateContainsPadConfig,
} from "./Util";
import SamplePad from "./components/SamplePad";

function App() {
  const [currentSamplePadState, setCurrentSamplePadState] =
    useState<SamplePadState>({
      drum: [],
      bass: [],
      sounds: [],
    });
  const [queuedSamplePadState, setQueuedSamplePadState] =
    useState<SamplePadState>({
      drum: [],
      bass: [],
      sounds: [],
    });

  const [immediateStop, setImmediateStop] = useState<boolean>(false);
  const bassRef = useRef<HTMLSpanElement>(null);

  const drumRef = useRef<HTMLSpanElement>(null);

  const soundsRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const stateUpdateCallbackID =
      MadeonSamplePadInstance.addStateUpdateCallback(
        (newState: SamplePadState, queuedState: SamplePadState) => {
          console.log("new state: ", newState);
          setCurrentSamplePadState(newState);
          setQueuedSamplePadState(queuedState);
        }
      );
    const onSampleLoopCallback = MadeonSamplePadInstance.addSampleLoopCallback(
      (currentSamples) => {
        const keyFrames = [
          { transform: "scale(1)", easing: "ease-in-out", offset: 0.1 },
          { transform: "scale(1.3)", easing: "ease-in-out", offset: 0.2 },
          { transform: "scale(1)", easing: "ease-in-out" },
        ];
        const iterations = 8;
        const options = {
          duration:
            (MadeonSamplePadInstance.getLoopDuration() / iterations) * 1000,
          iterations: iterations,
        };
        if (currentSamples.bass.length > 0) {
          bassRef.current?.animate(keyFrames, options);
        }
        if (currentSamples.drum.length > 0) {
          drumRef.current?.animate(keyFrames, options);
        }
        if (currentSamples.sounds.length > 0) {
          soundsRef.current?.animate(keyFrames, options);
        }
      }
    );
    return () => {
      MadeonSamplePadInstance.removeStateUpdateCallback(stateUpdateCallbackID);
      MadeonSamplePadInstance.removeSampleLoopCallback(onSampleLoopCallback);
    };
  }, []);

  useEffect(() => {
    if (currentSamplePadState.bass.length == 0) {
      bassRef.current?.getAnimations().forEach((a) => a.cancel());
    }
    if (currentSamplePadState.drum.length == 0) {
      drumRef.current?.getAnimations().forEach((a) => a.cancel());
    }
    if (currentSamplePadState.sounds.length == 0) {
      soundsRef.current?.getAnimations().forEach((a) => a.cancel());
    }
  }, [currentSamplePadState]);
  //this is only used for queuing
  const onClick = (padConfig: PadConfig) => {
    //logic to unqueue items

    const newQueuedState = applyPadConfigToSamplePadState(
      queuedSamplePadState,
      padConfig
    );

    if (
      samplePadStateContainsPadConfig(currentSamplePadState, padConfig) &&
      immediateStop
    ) {
      MadeonSamplePadInstance.stopSoundImmediately(padConfig);
    } else {
      setQueuedSamplePadState(newQueuedState);
      //here is the ONLY place we should be updating what the sample pad is thinking about playing because this can be set whenever
      MadeonSamplePadInstance.setQueuedSamplePadState(newQueuedState);
    }
  };
  return (
    <>
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
      <input
        id="immediateStop"
        type="checkbox"
        checked={immediateStop}
        onChange={() => {
          setImmediateStop(!immediateStop);
        }}
      />
      <label
        style={{ backgroundColor: "black", fontSize: "1rem" }}
        htmlFor="immediateStop"
      >
        Immediately Stop Sample on click
      </label>
      <SamplePad
        currentSamplePadState={currentSamplePadState}
        queuedSamplePadState={queuedSamplePadState}
        onPadClick={onClick}
      />
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
