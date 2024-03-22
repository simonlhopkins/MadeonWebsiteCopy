import { useEffect, useRef } from "react";
import styled from "styled-components";
import {
  MadeonSamplePadInstance,
  PadConfig,
  SamplePadState,
} from "../MadeonSamplePad";
import {
  getPadConfigFromIndex,
  isSamplePadStateEmpty,
  samplePadStateContainsPadConfig,
} from "../Util";
import Pad from "./Pad";

type SamplePadProps = {
  currentSamplePadState: SamplePadState;
  queuedSamplePadState: SamplePadState;
  onPadClick: (padConfig: PadConfig) => void;
};

export default function SamplePad({
  currentSamplePadState,
  queuedSamplePadState,
  onPadClick,
}: SamplePadProps) {
  const padRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loopID = MadeonSamplePadInstance.addSampleLoopCallback(
      (currentState, time, loopDuration) => {
        // anime({
        //   targets: padRef.current,
        //   boxShadow: [
        //     "0 0 0 0px rgba(0, 0, 0, 0.2)",
        //     "0 0 0 20px rgba(0, 0, 0, 0)",
        //   ],
        //   duration: (loopDuration / 8) * 1000, // Duration of the animation in milliseconds
        //   easing: "easeOut", // Easing function for smooth animation
        //   loop: 8,
        // });
        if (!isSamplePadStateEmpty(currentState)) {
          const keyframes = [
            { boxShadow: "0 0 0 0px rgba(255, 255, 255, 1)" },
            { boxShadow: "0 0 0 60px rgba(0, 0, 0, 0)" },
          ];
          padRef.current?.animate(keyframes, {
            duration: (loopDuration / 8) * 1000,
            iterations: 8,
          });
        }
      }
    );

    return () => {
      if (loopID != null) {
        MadeonSamplePadInstance.removeSampleLoopCallback(loopID);
      }
    };
  }, []);

  const n = 6;

  const samplePads = [];

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const index = row * n + col;
      const padConfig = getPadConfigFromIndex(index);
      const isActive = samplePadStateContainsPadConfig(
        currentSamplePadState,
        padConfig
      );

      const isQueued = samplePadStateContainsPadConfig(
        queuedSamplePadState,
        padConfig
      );
      samplePads.push(
        <Pad
          active={isActive}
          key={index}
          debugText={`${index}`}
          queued={isQueued}
          padConfig={padConfig}
          onPadClick={onPadClick}
        />
      );
    }
  }
  return (
    <StyledSamplePadParent ref={padRef} className="samplePadParent">
      {samplePads}
    </StyledSamplePadParent>
  );
}

const StyledSamplePadParent = styled.div`
  display: grid;
  max-width: 400px;
  grid-template-rows: repeat(6, 1fr);
  grid-template-columns: repeat(6, 1fr);
  transform: rotate(-45deg);
  aspect-ratio: 1;
  margin: auto;
  margin-top: 130px;
  margin-bottom: 130px;
`;
