import { serveFile } from "https://esm.town/v/std/utils@64-main/index.ts";
import { Hono } from "npm:hono";
import { blob } from "https://esm.town/v/std/blob";

const app = new Hono();

// Serve index.html at the root /
app.get("/", async c => {
    return serveFile("/frontend/index.html", import.meta.url);
});

// Serve all /frontend files
app.get("/frontend/**/*", c => serveFile(c.req.path, import.meta.url));

// API endpoint to save grid data to blob storage
app.post("/api/save-grid", async c => {
    const body = await c.req.json();
    const { grid, name } = body;

    if (!grid || !name) {
        return c.json({ success: false, error: "Missing grid data or name" }, 400);
    }

    // Use a special fixed key for 'lite-brite'
    const key = name === "lite-brite"
        ? "lite-brite"
        : `litebrite_${name}_${Date.now()}`;

    await blob.setJSON(key, { grid, timestamp: new Date().toISOString() });

    return c.json({ success: true, key });
});

// API endpoint to get all blob storage items
app.get("/api/grids", async c => {
    const keys = await blob.list("litebrite_");
    return c.json({ success: true, keys });
});

// API endpoint to get a specific grid by key
app.get("/api/grid/:key", async c => {
    const key = c.req.param("key");
    try {
        const data = await blob.getJSON(key);
        return c.json({ success: true, data });
    } catch (error) {
        return c.json({ success: false, error: "Grid not found" }, 404);
    }
});

// API endpoint to serve a grid as a PPM file
app.get("/api/ppm/:key", async c => {
    const key = c.req.param("key");
    try {
        // Get the grid data from blob storage
        const data = await blob.getJSON(key);
        const grid = data.grid;

        if (!grid) {
            return c.json({ success: false, error: "Invalid grid data" }, 400);
        }

        // Create PPM header: P6 format, 32x16 dimensions, 255 max color value
        const header = "P6\n32 16\n255\n";

        // Convert grid data to binary RGB values
        const rgbData = new Uint8Array(32 * 16 * 3); // 3 bytes per pixel (R,G,B)

        let byteIndex = 0;
        for (let col = 0; col < 16; col++) {
            for (let row = 0; row < 32; row++) {
                // Get the hex color from the grid
                const hexColor = grid[row][col].color;

                // Convert hex to RGB bytes
                const r = parseInt(hexColor.substring(1, 3), 16);
                const g = parseInt(hexColor.substring(3, 5), 16);
                const b = parseInt(hexColor.substring(5, 7), 16);

                // Add RGB bytes to the output
                rgbData[byteIndex++] = r;
                rgbData[byteIndex++] = g;
                rgbData[byteIndex++] = b;
            }
        }

        // Combine header (as text) with binary RGB data
        const headerBytes = new TextEncoder().encode(header);
        const ppmData = new Uint8Array(headerBytes.length + rgbData.length);
        ppmData.set(headerBytes, 0);
        ppmData.set(rgbData, headerBytes.length);

        // Return the PPM file with appropriate headers
        return new Response(ppmData, {
            headers: {
                "Content-Type": "image/x-portable-pixmap",
                "Content-Disposition": `attachment; filename="${key}.ppm"`
            }
        });
    } catch (error) {
        console.error("Error generating PPM:", error);
        return c.json({ success: false, error: "Failed to generate PPM file" }, 500);
    }
});

// Unwrap and rethrow Hono errors as the original error
// If you delete this, all errors will be "Internal Server Error"
app.onError((err, c) => {
    throw err;
});

// HTTP vals expect an exported "fetch handler"
// This is how you "run the server" in Val Town with Hono
export default app.fetch;
