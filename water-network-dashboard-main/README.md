# Water Network Dashboard

Create a functional, professional and responsive web application called "Waterwatch AI" for South African municipal water-network operators.

OBJECTIVE:

Build only the first frontend milestone: an interactive geographical area dashboard. Do not create AI predictions or add unnecessary features yet.

DESIGN:

- Use a clean, modern municipal operations dashboard design.

- Colour palette: navy blue, white and teal.

- Include a sidebar with the Waterwatch AI name and a Dashboard navigation item.

- Main heading: "Water Network Overview".

- Subtitle: "Select an area to view its monitoring information."

FUNCTIONAL REQUIREMENTS:

1. Display geographical areas as clickable cards in a responsive grid.

2. Each card should show the area's name and its geographical type.

3. When a user clicks an area, update a details panel on the same page without reloading.

4. The details panel must show the selected area's name, its geographical type and a section reserved for water-network measurements.

5. Include a search field to filter areas by name.

6. Include a clearly labelled data-source indicator: "Workshop synthetic data" or "Demonstration placeholder".

7. Include a future-ready space for an interactive area map, but prioritise working cards and the selection panel. Only add map markers if coordinates are available.

DATA:

First examine any synthetic Waterwatch dataset attached or made available to this application.

Use the actual area names and available attributes from that dataset. Do not invent water readings, incident counts, live conditions, coordinates or municipality boundaries.

If no dataset is attached, use only these clearly labelled illustrative area examples:

- Ekurhuleni — Metropolitan municipality

- Hillbrow — Johannesburg neighbourhood

- Berea — Johannesburg neighbourhood

These examples are for interface testing only and must be marked "Demonstration placeholder". Do not treat neighbourhoods as municipalities.

For fields not supplied by the data, display "Data not available".

RESPONSIBLE AI:

Do not invent or imply real-world leaks, safety alerts, disruption forecasts or verified operational conditions. Do not send notifications or trigger infrastructure actions.

SUCCESS CRITERIA:

Generate a working interactive preview. Clicking any area must change the details panel correctly, and searching must filter the area cards. Focus on completing this milestone before introducing maps, leak detection, predictions or complex backend integration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7c08e3f3-33c2-54a4-946b-9d776cbf6188).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
