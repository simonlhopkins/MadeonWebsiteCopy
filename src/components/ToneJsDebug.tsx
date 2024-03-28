import { useEffect, useState } from "react";
import styled from "styled-components";
import { MadeonSamplePadInstance } from "../MadeonSamplePad";

type ToneJsDebugProps = {};

type DebugInfoType = {
  currentTime: number;
  nextInterval: number;
};
export default function ToneJsDebug({}: ToneJsDebugProps) {
  let [info, setInfo] = useState<DebugInfoType | null>(null);

  useEffect(() => {
    const intervalID = setInterval(() => {
      setInfo({
        currentTime: clampToTwoDecimalPlaces(
          MadeonSamplePadInstance.getContextNowTime()
        ),
        nextInterval: 0,
      });
    }, 200);

    return () => {
      clearInterval(intervalID);
    };
  });

  return (
    <div>
      {info && (
        <StyledText>
          current time: {info.currentTime}, next interval: {info.nextInterval}
        </StyledText>
      )}
    </div>
  );
}

const StyledText = styled.p`
  background-color: black;
  font-size: 1rem;
`;

function clampToTwoDecimalPlaces(inputNumber: number): number {
  // Clamp the number to two decimal places
  let clampedNumber = Math.round(inputNumber * 100) / 100;

  return clampedNumber;
}
