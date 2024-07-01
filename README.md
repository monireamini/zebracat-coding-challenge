# Video Editor Environment

The Video Generator is built with React and Remotion that allows users to create videos with customizable text overlays.
It provides a user-friendly interface for uploading videos, resize and reposition the video within the composition,
adding text overlays, adjusting aspect ratios, and exporting the final video.

## Demonstration Video

You can view a simple screen recording demonstrating the functionality of the application [here](https://shorturl.at/fA914).


## Setup instructions

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (version 14 or later recommended)
- [Yarn](https://yarnpkg.com/) package manager

If you don't have Node.js installed, please download and install it from the official website: https://nodejs.org/

After installing Node.js, you can install Yarn by running:

```
npm install -g yarn
```

### Installation and Setup

Once you have the prerequisites installed, follow these steps:

To run this project locally, follow these steps:

1. Clone the repository:

```
git clone git@github.com:monireamini/zebracat-coding-challenge.git
```

2. Navigate to the project directory:

```
cd zebracat-coding-challenge
```

3. Install dependencies:

```
yarn install
```

4. Start the Next.js dev server:

```
yarn dev
```

5. Open your browser and visit `http://localhost:3000` to see the Video Editor in action.

6. You can use sample video is available in public directory: `public/BigBuckBunny.mp4`

## Docs

### Overview

This application generates videos using Remotion. It includes a Remotion root and a single composition for the resulting
video. We pass specific props to the composition, which places a video and text overlays at designated positions and
dimensions. The texts are animated identically and loop throughout the video timeline. We need to generate the
required data listed in `types/definitions` to pass as input props to the composition, allowing it to render and export
the video to the
user's device storage.

### Project Structure

### app/

- `page.tsx`: Main component for the home page
- `api/`: API routes for video upload and export

### components/

- `TextOverlayEditor/`: Components for managing text overlays
- `Toolbar/`: Components for uploading, exporting, adding text overlays and adjusting aspect ratio

### remotion/

- `Root.tsx`: Remotion root component
- `VideoWithOverlays.tsx`: Component for rendering the video composition with overlays
- `TextOverlay.tsx`: Component for rendering individual text overlays

### /

- `render.js`: Script for rendering the video using Remotion

### types/

- `constants.ts`: Constants like default composition input props and list of aspect ratios
- `definitions.ts`: Typescript Type definitions

## Key Features

1. **Video Upload**: Users can upload their own video files for editing.
2. **Text Overlay Management**: Add, edit, and position text overlays on the video.
3. **Resize and Reposition Video**: Ability to resize and reposition the video within the composition.
4. **Aspect Ratio Control**: Change the aspect ratio of the composition (16:9, 4:3, 1:1, 3:4, 9:16).
5. **Preview Mode**: Play, pause, and seek through the video to see animations and text overlays.
6. **Edit Mode**: Add, edit and drag text overlays as well as resize and reposition the video within the composition.
7. **Video Export**: Export the edited video with all applied overlays and modifications.

## Workflow

1. **User Interface Initialization:**

- Defined in `app/page.tsx` as the Home component.

2. **Handling Video Data, Position, and Size:**

- We use an input for uploading a video.
- Extract metadata like width and height.
- Set the video and composition dimensions to match the uploaded video dimensions.
- Maintain the aspect ratio of the video in another variable for future features.
- Store the video in the public directory with the name `video-{timestamp}.mp4` for future use.
- Store the video path in the `videoData` field to use in composition component rendering.
- Initially, use the aspect ratio of the video as the composition aspect ratio, which can be changed later via a select
  button on the app toolbar.
- To support resizing and repositioning the video part of the composition Added a virtual div with a transparent
  background over the player but behind the `TextOverlayEditor`.
- Made the virtual div resizable and draggable, with a green circle as the resize handle.
- Ensured the video aspect ratio is maintained during resizing.
- Handled negative positions relative to the composition.
- Reflected changes in position and dimension to the corresponding `videoSize` and `videoPosition` variables passed
  to the composition components.
- Updated the video dimension and position on the player accordingly.


3. **Handling Text Overlays:**

- We are not manipulating the composition component directly.
- Defined a `TextOverlayEditor` that is a transparent overlay on top of the composition player.
- The composition player is used for previewing the result video by passing the generated input props in
  the `page.tsx` component.
- This overlay makes it easier to add texts, drag them, and update their content.
- The data is stored in `inputProps.textOverlays`.

4. **Screen Size Adjustment:**

- We tried to use the full width of the user's screen size for the composition area and adjusted its height based on the
  occupied width.
- Initially, the composition size equals the original size of the video. If the user changes the aspect ratio, it
  adjusts itself independently of the video size.
- For example, if a video with dimensions `1280x720` is uploaded but the user screen has a width of `640 pixels`, the
  scale would be `{x: 0.5, y: 0.5}`) and calculations are needed to position texts or videos correctly in both display mode
  and
  rendered mode on the player, as well as in the final rendered video.
- A scale variable is used to calculate the correct position (x, y) for overlay elements.

5. **Handling Player Controls:**

- Due to the virtual div over the player for demonstrating video resizing, the player control buttons (play/pause, etc.)
  are sometimes inaccessible.
- A better approach would be to implement custom controls outside the composition box. However, as a quick fix, we have
  added two different modes.
- Two modes are provided: preview and edit. In edit mode, controls are hidden to prevent access issues.
- In edit mode, controls are hidden because the user cannot click on them.
- Switching to preview mode automatically plays the video and hides all virtual elements to show the final result of the
  composition with animation and the ability to play, pause, and seek the video.
- When the user tries to edit again, it automatically switches to edit mode.
- Users can switch between modes via a button in the toolbar.

6. **Export Functionality:**

- Defined in a `render.js` script responsible for rendering the composition with input props.
- Server-side API in `/app/api/export-video/route.js` handles the export process.
- The API serializes input props to `temp-input-props.json`, executes the render command, and deletes the temp file
  afterward.
- Execute `npm run export-video`, passing the file name as an argument
- `render.js` reads input props, sets video data in base64 to avoid empty frames, gets video duration, and renders the
  media using Remotion renderer.
- Return the output video path to the export API, downloading it as `exported-video.mp4` on the user's device.

