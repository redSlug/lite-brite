import { useState } from "react";
import "./App.css";

type LEDProps = {
  color: string;
  onClick: () => void;
};

type LEDData = {
  color: string;
};

function pixelClickHandler(
  grid: Array<Array<LEDData>>,
  setGrid: (grid: Array<Array<LEDData>>) => void,
  row: number,
  column: number,
) {
  console.log("setting value=", row, column);
  const newGrid = JSON.parse(JSON.stringify(grid));
  newGrid[row][column] = { color: "#ffffff" };
  setGrid(newGrid);
}

function LEDPixel({ color, onClick }: LEDProps) {
  return (
    <div
      className={"led-pixel"}
      style={{ backgroundColor: color }}
      onClick={() => onClick()}
    ></div>
  );
}

function initializeGrid() {
  const grid: Array<Array<LEDData>> = [];
  for (let row = 0; row < 32; row++) {
    const curRow = [];
    for (let col = 0; col < 16; col++) {
      curRow.push({ color: "#000000" } as LEDData);
    }
    grid.push(curRow);
  }
  return grid;
}

function App() {
  const [grid, setGrid] = useState<Array<Array<LEDData>>>(initializeGrid());

  return (
    <div className={"grid-container"}>
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className={"grid-row"}>
          {row.map((pixel, colIndex) => (
            <LEDPixel
              key={`${rowIndex} ${colIndex}`}
              color={pixel.color}
              onClick={() =>
                pixelClickHandler(grid, setGrid, rowIndex, colIndex)
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;
