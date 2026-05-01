# Hive System Documentation

Hive is a state-of-the-art AI-powered surveillance and analytics platform designed for real-time monitoring, person identification, and activity tracking. It leverages deep learning to transform raw video feeds into actionable business intelligence.

---

## 🏗 System Architecture

The system follows a decoupled architecture consisting of three primary layers:

1.  **Frontend (Hive)**: A React/Vite dashboard for administration, live viewing, and analytics.
2.  **Backend (Mind)**: A Python/Flask server that manages AI pipelines, RTSP stream ingestion, and API services.
3.  **Camera Node**: A client-side agent that captures local camera feeds and publishes them to the network via RTSP.
4.  **Database (MongoDB)**: A persistent store for node metadata, person identities (embeddings), and activity logs.

---

## 📹 Camera Node

The Camera Node is a lightweight client component that acts as the entry point for video data.

-   **Capture**: Uses OpenCV to capture frames from local cameras or webcams.
-   **Publishing**: Transcodes and publishes video as an RTSP stream using **FFmpeg** (libx264, baseline profile, ultrafast preset for low latency).
-   **Identity Management**: Enrolls itself with the HiveMind backend, stores unique credentials (`node_id`, `node_secret`), and sends periodic heartbeats.
-   **Status Reporting**: Reports its stream URL to the backend so the pipeline can start processing.

---

## 🧠 Backend: HiveMind

The backend is the "brain" of the system, responsible for heavy lifting in computer vision and stream management.

### 1. Pipeline Architecture
Hive uses a high-performance, multi-threaded pipeline system managed by the `PipelineManager`.
-   **Global Model Loading**: All AI models (YOLO, ArcFace, etc.) are loaded once at startup to eliminate latency when a camera connects.
-   **Per-Camera Workers**: Each camera node runs two dedicated threads:
    -   **Stream Thread**: Handles RTSP ingestion (using `OpenCV`) and produces an annotated HLS stream for the frontend.
    -   **Detection Thread**: Performs AI inference on frames pulled from a shared queue.

### 2. Computer Vision Stack
The detection thread runs a sequential inference pipeline:
-   **Person Detection (YOLOv8)**: Identifies human figures and context objects (e.g., cell phones, food, laptops).
-   **Face Identification (ArcFace)**: Extracts facial embeddings to identify registered subjects with high precision.
-   **Person Re-ID**: A fallback appearance-based embedder that tracks people even when their faces are not visible.
-   **Emotion Recognition**: Analyzes facial landmarks to detect "Happy", "Sad", "Angry", "Neutral", etc.

### 3. Activity Detection Logic
The system uses a sophisticated heuristic-driven engine that synthesizes data from multiple AI models to classify human activities.

#### 🧘 Posture Classification (Sitting vs. Standing)
The system uses a two-stage approach to determine physical posture:
- **Spatial Heuristic**: If the bounding box aspect ratio is wider than $1:1.1$, the subject is initially flagged as **Sitting**.
- **Pose Validation**: Uses **YOLOv8-Pose** landmarks.
    - **Skeletal Ratio**: Compares the length of the upper body (Shoulder to Hip) vs. lower body (Hip to Knee). A significant shortening of the lower body relative to the upper body confirms **Sitting**.
    - **Hip Elevation**: Standing is confirmed if the hips are high relative to the total bounding box height.

#### 🍔 Eating Detection (Temporal & Contextual)
Eating is detected through a multi-factor temporal loop:
- **Hand-to-Face Motion**: Monitored via wrist landmarks. If the wrist is above the shoulder or within a $35\%$ distance of the nose landmark, a "hand-at-face" frame is logged.
- **Chewing Detection**: Uses **ArcFace landmarks** to track mouth width. If the standard deviation of mouth width over 10 frames falls within a "chewing range" ($0.002$ to $0.018$ normalized), it triggers a chewing state.
- **Contextual Boost**: Proximity to objects like **Cups, Bottles, Bowls, or Dining Tables** increases the confidence score and speeds up the detection trigger.

#### 💼 Working on Laptop / Field
- **Working on Laptop**: Classified if the person is **Sitting** and their bounding box overlaps with a **Laptop** or **Keyboard** detection.
- **Working on Field**: Classified if the person is **Standing** and is not in proximity to "desk" objects (Chairs, Tables, Laptops).

#### 📱 Talking on Phone
- **Logic**: Detected if a **Cell Phone** object is found within the top half (head region) of the person's bounding box.

#### 🗣 Social Interaction (Talking)
Social interactions are detected via a dedicated "Social Pass" that analyzes person-to-person dynamics:
- **Proximity**: Two people must be within a distance equivalent to their average height.
- **Orientation (Yaw)**: Uses Face Pose data to ensure they are facing each other (e.g., Person A has $Yaw > 40^\circ$ and Person B has $Yaw < -40^\circ$).
- **Mouth Movement**: At least one person must exhibit a high fluctuation in mouth width ($Mouth\_STD > 0.015$) to distinguish talking from simply standing near each other.

---

### 4. Stream Processing
-   **Input**: RTSP or standard video streams.
-   **Annotation**: Frames are annotated in real-time with bounding boxes, names, and detected activities.
-   **Output**: The annotated frames are pushed to a `StreamProducer` which generates an HLS (`.m3u8`) stream served via a built-in HLS server (likely `MediaMTX` or a custom segmenter).

---

## 🗄 Database: MongoDB

Hive uses MongoDB to store all persistent and semi-persistent data.

### Data Models
-   **Nodes (`nodes`)**: Stores camera metadata, status (online/offline), and stream URLs.
-   **Persons (`persons`)**: A "Gallery" of registered subjects. Stores:
    -   `person_id`: Unique identifier.
    -   `name`: Human-readable name.
    -   `embedding`: 512-dimension appearance vector.
    -   `face_embedding`: 512-dimension ArcFace vector.
-   **Activity Logs (`activity_logs`)**: Raw event stream of every detected activity.
-   **Activity Sessions (`activity_sessions`)**: Aggregated data for duration tracking. It tracks how long a specific person performed a specific activity at a specific location.

---

## 💻 Frontend: Hive Dashboard

The frontend is a modern React application built with Vite and Tailwind CSS.

### Key Modules
-   **Admin Dashboard**: High-level overview of active nodes, recent activities, and system health.
-   **Camera Management**: Add, remove, and monitor live annotated feeds from all connected nodes.
-   **Subject Registration**: Interface to enroll new people by capturing their face and body appearance.
-   **Admin Sessions**: A detailed timeline view of person-specific activities.
-   **Analytics**: Visual representation of activity distributions, peak times, and behavioral trends.

---

## 🔄 Data Flow

1.  **Ingestion**: `StreamConsumer` connects to a camera's RTSP feed.
2.  **Inference**: Frames are sent to the `DetectionWorker`.
3.  **Identification**: The worker matches detected persons against the MongoDB Gallery (Vector search).
4.  **Logging**: Detected activities are logged to `activity_logs`.
5.  **Aggregation**: `ActivityStore` updates `activity_sessions` to track durations.
6.  **Streaming**: Annotated frames are encoded into HLS segments.
7.  **Visualization**: The Frontend polls the API for telemetry and pulls the HLS stream for live viewing.

---

## 🚀 Setup & Execution

Follow this sequence to start the full Hive system:

### 1. Media Server (MediaMTX)
Ensure **Docker Desktop** is running, then execute the following command from the root of the workspace to start the RTSP/HLS bridge:

```powershell
docker run --rm -it `
  -p 8554:8554 `
  -p 8888:8888 `
  -p 8889:8889 `
  -p 8189:8189/udp `
  -p 8189:8189/tcp `
  -v "${PWD}\Hive\cv-cam-navy\hive\mediamtx.yml:/mediamtx.yml:ro" `
  bluenviron/mediamtx:latest
```
> [!NOTE]
> Adjust the `-v` volume path if your workspace location differs.

### 2. Backend (HiveMind)
Open a new terminal and start the AI processing server:
```powershell
cd Hive\cv-cam-navy\hive\mind
# Ensure your virtual environment is active
python run.py
```

### 3. Camera Node
Open a new terminal to start capturing and publishing video:
```powershell
cd Hive\cv-cam-navy\hive\camera-node
python camera_node.py
```

### 4. Frontend (Dashboard)
Open a final terminal to launch the web interface:
```powershell
cd Hive
npm install
npm run dev
```
The dashboard will be available at `http://localhost:3000`.

---

## 🛠 Tech Stack
-   **Languages**: Python, TypeScript
-   **AI Frameworks**: PyTorch, Ultralytics (YOLO), ArcFace, NumPy
-   **Backend**: Flask, MongoDB (PyMongo)
-   **Frontend**: React, Vite, TailwindCSS, Chart.js
-   **Streaming**: OpenCV, HLS, MediaMTX

doc
