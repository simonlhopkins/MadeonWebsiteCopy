import anime from "animejs";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  MadeonSamplePadInstance,
  PadConfig,
  PadType,
} from "../MadeonSamplePad";
import {
  getColorFromPadType,
  mapRange,
  samplePadStateContainsPadConfig,
} from "../Util";

type PadProps = {
  active: boolean;
  queued: boolean;
  debugText: string;
  padConfig: PadConfig;
  onPadClick: (padConfig: PadConfig) => void;
};
export default function Pad({
  active,
  queued,
  padConfig,
  onPadClick,
}: PadProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [loopStartTime, setLoopStartTime] = useState<number>(0);
  const [loopDuration, setLoopDuration] = useState<number>(0);
  useEffect(() => {
    const loopID = MadeonSamplePadInstance.addSampleLoopCallback(
      (currentState, time, loopDuration) => {
        const actuallyActive = samplePadStateContainsPadConfig(
          currentState,
          padConfig
        );
        //actually active is what the class is giving us completely divorced from rendering
        setLoopStartTime(time);
        setLoopDuration(loopDuration);
        if (actuallyActive) {
          anime({
            targets: divRef.current,
            scale: [
              { value: 1, duration: 50, easing: "easeOutQuad" }, // Initial scale (1)
              { value: 1.3, duration: 50, easing: "easeInQuad" }, // Scale up to 1.2
              {
                value: 1,
                duration: (loopDuration / 8) * 1000 - 100,
                easing: "easeOutQuad",
              }, // Scale back to 1
            ],
            duration: (loopDuration / 8) * 1000, // Duration of the animation in milliseconds
            easing: "easeInOutQuad", // Easing function for smooth animation
            loop: 8,
          });
        }
      }
    );

    return () => {
      if (loopID != null) {
        anime.remove(divRef.current);
        anime({
          targets: divRef.current,
          scale: 1,
          duration: 200, // Duration of the animation in milliseconds
          easing: "easeInOutQuad", // Easing function for smooth animation
        });
        MadeonSamplePadInstance.removeSampleLoopCallback(loopID);
      }
    };
  }, []);

  useEffect(() => {
    if (queued) {
      const nextLoopTime = loopStartTime + loopDuration;
      const percentThrough = mapRange(
        MadeonSamplePadInstance.getCurrentTransportTime(),
        loopStartTime,
        nextLoopTime,
        0,
        1
      );
      anime({
        targets: overlayRef.current,
        width: [`${percentThrough * 100}%`, "100%"],
        duration: (1 - percentThrough) * loopDuration * 1000, // Duration of the animation in milliseconds
        easing: "linear", // Easing function for smooth animation
      });
    } else {
      // anime({
      //   targets: overlayRef.current,
      //   opacity: "0",
      //   duration: 200, // Duration of the animation in milliseconds
      //   easing: "linear", // Easing function for smooth animation
      // });
    }
    return () => {
      anime.remove(overlayRef.current);
    };
  }, [queued]);

  return (
    <StyledPad
      $padType={padConfig.type}
      className={`${active ? "active" : ""} ${queued ? "queued" : ""}`}
      onClick={() => {
        onPadClick(padConfig);
      }}
      ref={divRef}
    >
      <StyledOverlay className="overlay" ref={overlayRef}></StyledOverlay>
    </StyledPad>
  );
}

const StyledOverlay = styled.div`
  position: absolute;
  width: 0%;
  height: 100%;
`;
const StyledPad = styled.div<{ $padType: PadType }>`
  position: relative;
  background-color: ${(props) => getColorFromPadType(props.$padType, 0.8)};
  border: 2px solid white;
  margin: 5px;
  cursor: "pointer";
  &.active {
    background-color: ${(props) => getColorFromPadType(props.$padType, 1)};
    .overlay {
      opacity: 0%;
      transition: opacity 200ms;
    }
  }
  .overlay {
    opacity: 0%;
    transition: opacity 200ms;
    background-color: ${(props) => getColorFromPadType(props.$padType, 1)};
    border-right: 2px solid white;
  }
  &.queued {
    /* background-color: lightblue; */
    .overlay {
      opacity: 100%;
      transition: opacity 200ms;
    }
    &.active {
      .overlay {
        background-color: black;
      }
    }
  }
`;
