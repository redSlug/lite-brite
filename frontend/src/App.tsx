/** @jsxImportSource https://esm.sh/react@18.2.0 */
import { useState, useEffect } from "https://esm.sh/react@18.2.0";

type LEDProps = {
  color: string;
  onClick: () => void;
};

type LEDData = {
  color: string;
};

type BlobKey = {
  key: string;
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

export function App() {
  const [grid, setGrid] = useState<Array<Array<LEDData>>>(initializeGrid());
  const [gridName, setGridName] = useState<string>("");
  const [savedGrids, setSavedGrids] = useState<BlobKey[]>([]);
  const [selectedGrid, setSelectedGrid] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<string>("");

  useEffect(() => {
    fetchSavedGrids();
  }, []);

  const fetchSavedGrids = async () => {
    try {
      const response = await fetch("/api/grids");
      const data = await response.json();
      if (data.success) {
        setSavedGrids(data.keys);
      }
    } catch (error) {
      console.error("Error fetching saved grids:", error);
    }
  };

  const handleSaveGrid = async () => {
    if (!gridName.trim()) {
      setSaveStatus("Please enter a name for your grid");
      return;
    }

    try {
      const response = await fetch("/api/save-grid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grid,
          name: gridName,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSaveStatus(`Grid saved successfully as: ${data.key}`);
        setGridName("");
        fetchSavedGrids(); // Refresh the list of saved grids
      } else {
        setSaveStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving grid:", error);
      setSaveStatus("Error saving grid. Please try again.");
    }
  };

  const handleLoadGrid = async () => {
    if (!selectedGrid) {
      setSaveStatus("Please select a grid to load");
      return;
    }

    try {
      // First, load the selected grid
      const response = await fetch(`/api/grid/${selectedGrid}`);
      const data = await response.json();
      if (data.success && data.data.grid) {
        setGrid(data.data.grid);
        setSaveStatus(`Grid loaded successfully: ${selectedGrid}`);

        // Then, save this grid to the special 'lite-brite' key
        try {
          await fetch("/api/save-grid", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              grid: data.data.grid,
              name: "lite-brite",
            }),
          });
          console.log("Grid saved to special 'lite-brite' key");
        } catch (saveError) {
          console.error("Error saving to lite-brite key:", saveError);
          // Don't update the UI status for this background operation
        }
      } else {
        setSaveStatus(`Error: ${data.error || "Could not load grid"}`);
      }
    } catch (error) {
      console.error("Error loading grid:", error);
      setSaveStatus("Error loading grid. Please try again.");
    }
  };

  return (
    <div className="app-container">
      <h1>Lite Brite</h1>

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

      <div className="controls-container">
        <div className="save-controls">
          <h2>Save Your Creation</h2>
          <div className="input-group">
            <input
              type="text"
              value={gridName}
              onChange={(e) => setGridName(e.target.value)}
              placeholder="Enter a name for your grid"
              className="grid-name-input"
            />
            <button onClick={handleSaveGrid} className="save-button">
              Save to Storage
            </button>
          </div>
        </div>

        <div className="load-controls">
          <h2>Load a Saved Creation</h2>
          <div className="input-group">
            <select
              value={selectedGrid}
              onChange={(e) => setSelectedGrid(e.target.value)}
              className="grid-select"
            >
              <option value="">Select a saved grid</option>
              {savedGrids.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.key}
                </option>
              ))}
            </select>
            <button onClick={handleLoadGrid} className="load-button">
              Send to Lite Brite
            </button>
          </div>
        </div>

        {saveStatus && <div className="status-message">{saveStatus}</div>}

        <div className="saved-grids">
          <h2>Saved Grids in Storage</h2>
          {savedGrids.length > 0 ? (
            <ul className="grid-list">
              {savedGrids.map((item) => (
                <li key={item.key} className="grid-item">
                  {item.key}
                </li>
              ))}
            </ul>
          ) : (
            <p>No saved grids found</p>
          )}
        </div>
      </div>
    </div>
  );
}
