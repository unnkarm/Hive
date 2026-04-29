import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import "./App.css";

type Tab = "feeds" | "people" | "activities";

type Node = {
  node_id: string;
  node_name: string;
  last_seen: string;
  registered_at: string;
  status: "online" | "offline" | "revoked";
  stream_url?: string | null;
  rtsp_url?: string | null;
  annotated_stream_url?: string | null;
};

type Person = {
  person_id: string;
  name: string;
  registered_at: string;
};

type NodesResponse = { nodes: Node[] };
type PersonsResponse = { persons: Person[] };

type Activity = {
  person_id: string;
  name: string;
  action: string;
  confidence: number;
  timestamp: string;
  node_id: string;
};

type ActivitiesResponse = { activities: Activity[] };
type ActivitySummaryItem = {
  person_id: string;
  name: string;
  action: string;
  total_seconds: number;
};
type ActivitySummaryResponse = { summary: ActivitySummaryItem[] };

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");
const CAMERA_POLL_MS = 2000;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      response.status === 404 ? "Not found" : text || `HTTP ${response.status}`,
    );
  }
  return response.json() as Promise<T>;
}

function App() {
  const [tab, setTab] = useState<Tab>("feeds");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [status, setStatus] = useState("Looking for nodes...");
  const [error, setError] = useState<string | null>(null);
  const gridClassName = `camera-grid camera-grid--count-${Math.min(
    nodes.length || 1,
    4,
  )}`;

  useEffect(() => {
    let active = true;

    const loadNodes = async () => {
      try {
        const result = await fetchJson<NodesResponse>("/api/nodes");
        if (!active) return;

        setNodes(result.nodes);

        if (result.nodes.length === 0) {
          setStatus("Waiting for an enrolled node...");
          setError(null);
          return;
        }

        const onlineCount = result.nodes.filter(
          (node) => node.status === "online",
        ).length;
        setStatus(
          `Showing ${result.nodes.length} node${result.nodes.length === 1 ? "" : "s"} (${onlineCount} online)`,
        );
        setError(null);
      } catch (err) {
        if (!active) return;
        setNodes([]);
        setStatus("Backend unavailable");
        setError(err instanceof Error ? err.message : "Failed to load nodes");
      }
    };

    void loadNodes();
    const intervalId = window.setInterval(() => {
      void loadNodes();
    }, CAMERA_POLL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card">
        <p className="dashboard-eyebrow">Hivemind</p>

        <nav className="tab-bar">
          <button
            className={`tab-btn${tab === "feeds" ? " tab-btn--active" : ""}`}
            onClick={() => setTab("feeds")}
          >
            Live Feeds
          </button>
          <button
            className={`tab-btn${tab === "people" ? " tab-btn--active" : ""}`}
            onClick={() => setTab("people")}
          >
            People
          </button>
          <button
            className={`tab-btn${tab === "activities" ? " tab-btn--active" : ""}`}
            onClick={() => setTab("activities")}
          >
            Activity Logs
          </button>
        </nav>

        {tab === "feeds" && (
          <>
            <p className="dashboard-copy">{status}</p>
            {nodes.length > 0 ? (
              <div className={gridClassName}>
                {nodes.map((node) => (
                  <CameraCard key={node.node_id} node={node} />
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <span>No enrolled nodes yet</span>
              </div>
            )}
            {error && <p className="dashboard-error">{error}</p>}
          </>
        )}

        {tab === "people" && <PeoplePanel />}
        {tab === "activities" && <ActivitiesPanel />}
      </section>
    </main>
  );
}

// ── People panel ──────────────────────────────────────────────────────

function PeoplePanel() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPersons = useCallback(async () => {
    try {
      const res = await fetchJson<PersonsResponse>("/api/persons");
      setPersons(res.persons);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void loadPersons();
  }, [loadPersons]);

  const handleDelete = async (personId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/persons/${personId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadPersons();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="people-panel">
      <RegisterPersonForm onRegistered={loadPersons} />

      <div className="persons-list-section">
        <h2 className="persons-list-title">Registered People</h2>
        {loadError && <p className="dashboard-error">{loadError}</p>}
        {persons.length === 0 && !loadError ? (
          <p className="dashboard-copy">No people registered yet.</p>
        ) : (
          <ul className="persons-list">
            {persons.map((p) => (
              <li key={p.person_id} className="person-row">
                <span className="person-name">{p.name}</span>
                <span className="person-date">
                  {new Date(p.registered_at).toLocaleString()}
                </span>
                <button
                  className="person-delete"
                  onClick={() => handleDelete(p.person_id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Register person form (webcam capture) ─────────────────────────────

function RegisterPersonForm({
  onRegistered,
}: {
  onRegistered: () => Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      setCaptured(null);
      setFormError(null);
    } catch {
      setFormError("Could not access webcam.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCaptured(null);
    setFormError(null);
    setSuccess(null);
    void startCamera();
  };

  const submit = async () => {
    if (!captured || !name.trim()) {
      setFormError("Please capture a photo and enter a name.");
      return;
    }
    setBusy(true);
    setFormError(null);
    setSuccess(null);
    try {
      const b64 = captured.split(",")[1];
      const res = await fetch(`${API_BASE_URL}/api/persons/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image_b64: b64 }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);

      setSuccess(`Registered ${body.person.name}`);
      setCaptured(null);
      setName("");
      await onRegistered();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="register-form">
      <h2 className="register-title">Register New Person</h2>

      <div className="register-preview">
        {captured ? (
          <img src={captured} alt="Captured" className="register-snapshot" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`register-video${cameraOn ? "" : " register-video--off"}`}
          />
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <div className="register-controls">
        {!cameraOn && !captured && (
          <button className="btn btn--primary" onClick={startCamera}>
            Start Camera
          </button>
        )}
        {cameraOn && !captured && (
          <button className="btn btn--primary" onClick={capture}>
            Capture
          </button>
        )}
        {captured && (
          <button className="btn btn--secondary" onClick={retake}>
            Retake
          </button>
        )}
      </div>

      <input
        className="register-input"
        type="text"
        placeholder="Person name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        className="btn btn--primary register-submit"
        disabled={busy || !captured || !name.trim()}
        onClick={submit}
      >
        {busy ? "Registering..." : "Register"}
      </button>

      {formError && <p className="dashboard-error">{formError}</p>}
      {success && <p className="register-success">{success}</p>}
    </div>
  );
}

function CameraCard({ node }: { node: Node }) {
  const hasAnnotated = !!node.annotated_stream_url;
  const [showAnnotated, setShowAnnotated] = useState(false);
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  const activeUrl =
    showAnnotated && hasAnnotated
      ? node.annotated_stream_url!
      : node.stream_url;

  const handleDetectionToggle = async () => {
    if (showAnnotated && hasAnnotated) {
      setShowAnnotated(false);
      setPipelineError(null);
      return;
    }

    if (hasAnnotated) {
      setShowAnnotated(true);
      setPipelineError(null);
      return;
    }

    setPipelineBusy(true);
    setPipelineError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pipeline/start`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setShowAnnotated(true);
    } catch (err) {
      setPipelineError(
        err instanceof Error ? err.message : "Failed to start detection",
      );
    } finally {
      setPipelineBusy(false);
    }
  };

  const buttonLabel =
    showAnnotated && hasAnnotated
      ? "Raw"
      : pipelineBusy || (showAnnotated && !hasAnnotated)
        ? "Starting..."
        : "Detection";

  return (
    <article className="camera-card">
      <div className="camera-stage">
        {activeUrl && node.status === "online" ? (
          <CameraStream cameraId={node.node_id} streamUrl={activeUrl} />
        ) : (
          <div className="video-placeholder">
            <span>
              {node.status === "online" ? "No stream URL" : "Node offline"}
            </span>
          </div>
        )}
      </div>

      <div className="camera-meta">
        <span className="camera-name">{node.node_name || node.node_id}</span>
        <span
          className={`dashboard-status dashboard-status--${node.status}`}
          aria-label={`Node ${node.status}`}
        >
          {node.status}
        </span>
        {node.status === "online" && node.stream_url && (
          <button
            className="stream-toggle"
            onClick={() => void handleDetectionToggle()}
            disabled={pipelineBusy || (showAnnotated && !hasAnnotated)}
          >
            {buttonLabel}
          </button>
        )}
        {showAnnotated && !hasAnnotated && (
          <span>Detection pipeline is starting...</span>
        )}
        {pipelineError && <span className="dashboard-error">{pipelineError}</span>}
        <span>Last seen: {new Date(node.last_seen).toLocaleTimeString()}</span>
      </div>
    </article>
  );
}

function CameraStream({
  streamUrl,
  cameraId,
}: {
  streamUrl: string;
  cameraId: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let latencyCheckIntervalId: number | null = null;
    let retryTimeoutId: number | null = null;
    let destroyed = false;
    setPlayError(null);

    const jumpToLiveEdge = () => {
      if (!video) return;

      const seekable = video.seekable;
      if (seekable.length > 0) {
        const liveEdge = seekable.end(seekable.length - 1);
        const target = Math.max(0, liveEdge - 0.15);
        if (!Number.isNaN(target)) {
          video.currentTime = target;
        }
      }
    };

    const handleVisibilityChange = () => {
      if (!hls || !video) return;
      if (document.visibilityState === "visible") {
        hls.startLoad(-1);
        jumpToLiveEdge();
        void video.play().catch(() => { });
        return;
      }
      hls.stopLoad();
    };

    const createHls = () => {
      if (destroyed) return;

      if (hls) {
        hls.destroy();
        hls = null;
      }

      setPlayError(null);

      hls = new Hls({
        lowLatencyMode: true,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 2,
        maxBufferLength: 2,
        backBufferLength: 0,
        maxMaxBufferLength: 3,
        manifestLoadingRetryDelay: 1000,
        manifestLoadingMaxRetry: 30,
        levelLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: 30,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setPlayError(null);
        jumpToLiveEdge();
        void video.play().catch(() => { });
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        hls?.destroy();
        hls = null;
        setPlayError("Waiting for stream...");
        retryTimeoutId = window.setTimeout(createHls, 2000);
      });

      document.addEventListener("visibilitychange", handleVisibilityChange);
    };

    if (streamUrl.startsWith("rtsp://")) {
      setPlayError(
        "RTSP is not directly playable in browsers. Use an HLS/WebRTC URL.",
      );
    } else if (streamUrl.endsWith(".m3u8") && Hls.isSupported()) {
      createHls();

      latencyCheckIntervalId = window.setInterval(() => {
        if (document.visibilityState !== "visible" || !video) return;
        const seekable = video.seekable;
        if (seekable.length === 0) return;
        const liveEdge = seekable.end(seekable.length - 1);
        const behindBy = liveEdge - video.currentTime;
        if (behindBy > 2.5) {
          jumpToLiveEdge();
        }
      }, 3000);
    } else if (streamUrl) {
      video.src = streamUrl;
    }

    if (!streamUrl.startsWith("rtsp://")) {
      void video.play().catch(() => { });
    }

    return () => {
      destroyed = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (latencyCheckIntervalId !== null) {
        window.clearInterval(latencyCheckIntervalId);
      }
      if (retryTimeoutId !== null) {
        window.clearTimeout(retryTimeoutId);
      }
      if (hls) {
        hls.destroy();
      }
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [streamUrl]);

  return (
    <>
      <video
        ref={videoRef}
        className="video-frame"
        autoPlay
        muted
        playsInline
        controls
      />
      {playError && (
        <div className="video-placeholder video-placeholder--loading">
          <span>
            {cameraId}: {playError}
          </span>
        </div>
      )}
    </>
  );
}

// ── Activities panel ──────────────────────────────────────────────────

function ActivitiesPanel() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<ActivitySummaryItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    try {
      const res = await fetchJson<ActivitiesResponse>("/api/activities/latest?limit=50");
      setActivities(res.activities);
      
      const summaryRes = await fetchJson<ActivitySummaryResponse>("/api/activities/summary");
      setSummary(summaryRes.summary);
      
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchLoop = async () => {
      if (active) await loadActivities();
    };
    void fetchLoop();
    const intervalId = window.setInterval(() => {
      void fetchLoop();
    }, 3000); // poll every 3 seconds

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [loadActivities]);

  return (
    <div className="activities-panel">
      <div className="activities-summary-section">
        <h2 className="activities-list-title">Today's Duration Summary</h2>
        <div className="summary-grid">
          {summary.map((s, i) => (
            <div key={`${s.person_id}-${s.action}-${i}`} className="summary-card">
              <div className="summary-card-header">
                <span className="summary-card-name">{s.name}</span>
                <span className="summary-card-action">{s.action}</span>
              </div>
              <div className="summary-card-body">
                <span className="summary-card-time">
                  {Math.floor(s.total_seconds / 60)}m {Math.floor(s.total_seconds % 60)}s
                </span>
              </div>
            </div>
          ))}
          {summary.length === 0 && <p className="dashboard-copy">No data for today yet.</p>}
        </div>
      </div>

      <div className="activities-list-section">
        <h2 className="activities-list-title">Live Activity Logs</h2>
        {loadError && <p className="dashboard-error">{loadError}</p>}
        {activities.length === 0 && !loadError ? (
          <p className="dashboard-copy">No activities detected yet.</p>
        ) : (
          <ul className="activities-list">
            {activities.map((a, i) => (
              <li key={`${a.person_id}-${a.timestamp}-${i}`} className="activity-row">
                <div className="activity-main">
                  <span className="activity-name">{a.name}</span>
                  <span className="activity-badge">{a.action}</span>
                </div>
                <div className="activity-meta">
                  <span>{(a.confidence * 100).toFixed(0)}% Conf</span>
                  <span>{new Date(a.timestamp).toLocaleTimeString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
