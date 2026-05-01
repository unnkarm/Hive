"""Mongo-backed stores for node metadata and person re-ID registrations."""
import hashlib
import hmac
import logging
import os
import secrets
import uuid
import dns.resolver

# Configure a reliable DNS resolver to avoid "LifetimeTimeout" on some networks
try:
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '1.1.1.1']
    dns.resolver.default_resolver.lifetime = 10.0
    dns.resolver.default_resolver.timeout = 5.0
except Exception:
    # Fallback to default if configuration fails
    pass
from datetime import datetime
from zoneinfo import ZoneInfo

import numpy as np
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import CollectionInvalid, DuplicateKeyError, PyMongoError

logger = logging.getLogger(__name__)

IST = ZoneInfo("Asia/Kolkata")
NODE_STATUS_ONLINE = "online"
NODE_STATUS_OFFLINE = "offline"
NODE_STATUS_REVOKED = "revoked"
NODE_STATUSES = [NODE_STATUS_ONLINE, NODE_STATUS_OFFLINE, NODE_STATUS_REVOKED]


class NodeAuthError(Exception):
    """Raised when node authentication fails."""


class NodeAlreadyExistsError(Exception):
    """Raised when enrolling a node with an already-used name."""


def now_ist() -> datetime:
    """Return the current timestamp in IST."""
    return datetime.now(IST)


def _normalize_name(name: str) -> str:
    return name.strip().lower()


def _node_collection_validator():
    """JSON schema validator for node documents."""
    return {
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "node_id",
                "node_name",
                "node_name_normalized",
                "status",
                "rtsp_url",
                "stream_url",
                "registered_at",
                "last_seen",
                "auth",
            ],
            "additionalProperties": False,
            "properties": {
                "_id": {"bsonType": "objectId"},
                "node_id": {"bsonType": "string", "minLength": 1},
                "node_name": {"bsonType": "string", "minLength": 1},
                "node_name_normalized": {"bsonType": "string", "minLength": 1},
                "status": {"enum": NODE_STATUSES},
                "rtsp_url": {"bsonType": ["string", "null"]},
                "stream_url": {"bsonType": ["string", "null"]},
                "annotated_stream_url": {"bsonType": ["string", "null"]},
                "registered_at": {"bsonType": "date"},
                "last_seen": {"bsonType": "date"},
                "auth": {
                    "bsonType": "object",
                    "required": ["secret_hash", "secret_version", "last_rotated_at"],
                    "additionalProperties": False,
                    "properties": {
                        "secret_hash": {"bsonType": "string", "minLength": 1},
                        "secret_version": {"bsonType": "int", "minimum": 1},
                        "last_rotated_at": {"bsonType": "date"},
                    },
                },
            },
        }
    }


class NodeStore:
    """MongoDB-backed node metadata store, keyed by node_id."""

    def __init__(
        self,
        mongo_uri: str | None = None,
        db_name: str | None = None,
        collection_name: str = "nodes",
    ):
        self.mongo_uri = mongo_uri or os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.db_name = db_name or os.getenv("MONGO_DB_NAME", "hivemind")
        self.collection_name = collection_name
        self.secret_pepper = os.getenv("NODE_SECRET_PEPPER", "")

        self.client = MongoClient(
            self.mongo_uri,
            serverSelectionTimeoutMS=int(os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "3000")),
        )
        self.db = self.client[self.db_name]
        self.collection = self._ensure_collection()
        self._ensure_indexes()

        self.client.admin.command("ping")
        logger.info(
            "MongoDB connected (db=%s, collection=%s)",
            self.db_name,
            self.collection_name,
        )

    def _ensure_collection(self):
        validator = _node_collection_validator()
        try:
            self.db.create_collection(
                self.collection_name,
                validator=validator,
                validationLevel="strict",
                validationAction="error",
            )
            logger.info("Created Mongo collection %s with schema validation", self.collection_name)
        except CollectionInvalid:
            pass

        try:
            self.db.command(
                {
                    "collMod": self.collection_name,
                    "validator": validator,
                    "validationLevel": "strict",
                    "validationAction": "error",
                }
            )
        except PyMongoError as exc:
            logger.warning("Could not enforce collection validator via collMod: %s", exc)

        return self.db[self.collection_name]

    def _ensure_indexes(self):
        self.collection.create_index([("node_id", ASCENDING)], unique=True, name="uniq_node_id")
        self.collection.create_index(
            [("node_name_normalized", ASCENDING)],
            unique=True,
            name="uniq_node_name_normalized",
        )
        self.collection.create_index([("status", ASCENDING)], name="idx_node_status")
        self.collection.create_index([("last_seen", ASCENDING)], name="idx_node_last_seen")

    def _hash_secret(self, secret: str) -> str:
        return hashlib.sha256(f"{secret}:{self.secret_pepper}".encode("utf-8")).hexdigest()

    @staticmethod
    def _to_ist(dt: datetime) -> datetime:
        """Convert a datetime (potentially naive UTC from Mongo) to IST."""
        from datetime import timezone
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(IST)

    def _serialize(self, node):
        return {
            "node_id": node["node_id"],
            "node_name": node["node_name"],
            "status": node["status"],
            "rtsp_url": node.get("rtsp_url"),
            "stream_url": node.get("stream_url"),
            "annotated_stream_url": node.get("annotated_stream_url"),
            "registered_at": self._to_ist(node["registered_at"]).isoformat(),
            "last_seen": self._to_ist(node["last_seen"]).isoformat(),
        }

    def enroll_node(
        self,
        node_name: str,
        stream_url: str | None = None,
        rtsp_url: str | None = None,
    ):
        """Create a node identity and return node record + one-time secret."""
        clean_name = (node_name or "").strip()
        if not clean_name:
            raise ValueError("node_name is required")

        now = now_ist()
        node_id = f"node_{uuid.uuid4().hex}"
        node_secret = secrets.token_urlsafe(32)
        secret_hash = self._hash_secret(node_secret)

        doc = {
            "node_id": node_id,
            "node_name": clean_name,
            "node_name_normalized": _normalize_name(clean_name),
            "status": NODE_STATUS_OFFLINE,
            "rtsp_url": rtsp_url,
            "stream_url": stream_url,
            "annotated_stream_url": None,
            "registered_at": now,
            "last_seen": now,
            "auth": {
                "secret_hash": secret_hash,
                "secret_version": 1,
                "last_rotated_at": now,
            },
        }

        try:
            self.collection.insert_one(doc)
        except DuplicateKeyError as exc:
            if "uniq_node_name_normalized" in str(exc):
                raise NodeAlreadyExistsError("node_name already exists") from exc
            raise

        return self._serialize(doc), node_secret

    def authenticate_node(self, node_id: str, node_secret: str):
        """Validate node credentials and return node document."""
        if not node_id or not node_secret:
            raise NodeAuthError("node_id and node_secret are required")

        node = self.collection.find_one({"node_id": node_id})
        if not node:
            raise NodeAuthError("node not found")
        if node["status"] == NODE_STATUS_REVOKED:
            raise NodeAuthError("node is revoked")

        expected_hash = node["auth"]["secret_hash"]
        provided_hash = self._hash_secret(node_secret)
        if not hmac.compare_digest(expected_hash, provided_hash):
            raise NodeAuthError("invalid node credentials")
        return node

    def connect_node(
        self,
        node_id: str,
        stream_url: str | None = None,
        rtsp_url: str | None = None,
    ):
        """Mark node online on runtime connect."""
        now = now_ist()
        set_doc = {
            "status": NODE_STATUS_ONLINE,
            "last_seen": now,
        }
        if stream_url is not None:
            set_doc["stream_url"] = stream_url
        if rtsp_url is not None:
            set_doc["rtsp_url"] = rtsp_url
        self.collection.update_one({"node_id": node_id}, {"$set": set_doc}, upsert=False)

    def heartbeat_node(
        self,
        node_id: str,
        stream_url: str | None = None,
        rtsp_url: str | None = None,
    ):
        """Refresh node liveness."""
        now = now_ist()
        set_doc = {
            "status": NODE_STATUS_ONLINE,
            "last_seen": now,
        }
        if stream_url is not None:
            set_doc["stream_url"] = stream_url
        if rtsp_url is not None:
            set_doc["rtsp_url"] = rtsp_url
        self.collection.update_one({"node_id": node_id}, {"$set": set_doc}, upsert=False)

    def disconnect_node(self, node_id: str):
        """Mark node offline on runtime disconnect."""
        now = now_ist()
        self.collection.update_one(
            {"node_id": node_id},
            {
                "$set": {
                    "status": NODE_STATUS_OFFLINE,
                    "last_seen": now,
                }
            },
            upsert=False,
        )

    def get(self, node_id: str):
        node = self.collection.find_one({"node_id": node_id})
        return self._serialize(node) if node else None

    def get_all(self):
        nodes = self.collection.find({}, sort=[("registered_at", ASCENDING)])
        return [self._serialize(node) for node in nodes]

    def set_annotated_stream_url(self, node_id: str, url: str | None):
        """Set or clear the annotated stream URL for a node."""
        self.collection.update_one(
            {"node_id": node_id},
            {"$set": {"annotated_stream_url": url}},
            upsert=False,
        )

    def reset_stale_runtime_state(self):
        """Reset runtime-only fields that should not survive a server restart.

        On startup, any node still marked "online" is stale (the camera
        hasn't re-connected yet), and any annotated_stream_url is from a
        previous pipeline run.  Reset both so the frontend sees an
        accurate picture.
        """
        result = self.collection.update_many(
            {"$or": [
                {"status": NODE_STATUS_ONLINE},
                {"annotated_stream_url": {"$ne": None}},
            ]},
            {"$set": {
                "status": NODE_STATUS_OFFLINE,
                "annotated_stream_url": None,
            }},
        )
        if result.modified_count:
            logger.info(
                "Reset stale runtime state for %d node(s)", result.modified_count
            )


# ── Person re-ID store ────────────────────────────────────────────────


def _person_collection_validator():
    """JSON schema validator for person documents."""
    return {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["person_id", "name", "embedding", "registered_at"],
            "additionalProperties": False,
            "properties": {
                "_id": {"bsonType": "objectId"},
                "person_id": {"bsonType": "string", "minLength": 1},
                "name": {"bsonType": "string", "minLength": 1},
                "embedding": {
                    "bsonType": "array",
                    "items": {"bsonType": "double"},
                },
                "face_embedding": {
                    "bsonType": "array",
                    "items": {"bsonType": "double"},
                },
                "registered_at": {"bsonType": "date"},
            },
        }
    }


class PersonStore:
    """MongoDB-backed store for registered person identities."""

    def __init__(
        self,
        mongo_uri: str | None = None,
        db_name: str | None = None,
        collection_name: str = "persons",
    ):
        self.mongo_uri = mongo_uri or os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.db_name = db_name or os.getenv("MONGO_DB_NAME", "hivemind")
        self.collection_name = collection_name

        self.client = MongoClient(
            self.mongo_uri,
            serverSelectionTimeoutMS=int(os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "3000")),
        )
        self.db = self.client[self.db_name]
        self.collection = self._ensure_collection()
        self._ensure_indexes()
        logger.info(
            "PersonStore ready (db=%s, collection=%s)",
            self.db_name,
            self.collection_name,
        )

    def _ensure_collection(self):
        validator = _person_collection_validator()
        try:
            self.db.create_collection(
                self.collection_name,
                validator=validator,
                validationLevel="strict",
                validationAction="error",
            )
            logger.info("Created Mongo collection %s with schema validation", self.collection_name)
        except CollectionInvalid:
            pass

        try:
            self.db.command(
                {
                    "collMod": self.collection_name,
                    "validator": validator,
                    "validationLevel": "strict",
                    "validationAction": "error",
                }
            )
        except PyMongoError as exc:
            logger.warning("Could not enforce collection validator via collMod: %s", exc)

        return self.db[self.collection_name]

    def _ensure_indexes(self):
        self.collection.create_index(
            [("person_id", ASCENDING)], unique=True, name="uniq_person_id",
        )
        self.collection.create_index(
            [("name", ASCENDING)], name="idx_person_name",
        )

    @staticmethod
    def _to_ist(dt: datetime) -> datetime:
        from datetime import timezone
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(IST)

    def _serialize(self, doc) -> dict:
        return {
            "person_id": doc["person_id"],
            "name": doc["name"],
            "registered_at": self._to_ist(doc["registered_at"]).isoformat(),
        }

    def register_person(self, name: str, embedding: np.ndarray, face_embedding: np.ndarray | None = None) -> dict:
        """Insert a new person with their appearance embedding and optional face embedding."""
        clean_name = (name or "").strip()
        if not clean_name:
            raise ValueError("name is required")

        now = now_ist()
        person_id = f"person_{uuid.uuid4().hex}"

        doc = {
            "person_id": person_id,
            "name": clean_name,
            "embedding": embedding.tolist(),
            "registered_at": now,
        }
        if face_embedding is not None:
            doc["face_embedding"] = face_embedding.tolist()
            
        self.collection.insert_one(doc)
        return self._serialize(doc)

    def get_all_persons(self) -> list[dict]:
        """Return all registered persons (without embeddings)."""
        docs = self.collection.find({}, sort=[("registered_at", ASCENDING)])
        return [self._serialize(doc) for doc in docs]

    def get_person(self, person_id: str) -> dict | None:
        doc = self.collection.find_one({"person_id": person_id})
        return self._serialize(doc) if doc else None

    def delete_person(self, person_id: str) -> bool:
        result = self.collection.delete_one({"person_id": person_id})
        return result.deleted_count > 0

    def get_all_embeddings(self) -> tuple[list[str], list[str], np.ndarray | None, np.ndarray | None]:
        """Return (ids, names, embedding_matrix, face_embedding_matrix) for all registered persons.

        embedding_matrix and face_embedding_matrix have shape (N, 512).
        Missing face embeddings are padded with zero vectors.
        Returns ([], [], None, None) when the gallery is empty.
        """
        docs = list(self.collection.find(
            {}, {"person_id": 1, "name": 1, "embedding": 1, "face_embedding": 1, "_id": 0},
            sort=[("registered_at", ASCENDING)],
        ))
        if not docs:
            return [], [], None, None
        ids = [d["person_id"] for d in docs]
        names = [d["name"] for d in docs]
        matrix = np.array([d["embedding"] for d in docs], dtype=np.float64)
        
        face_list = []
        for d in docs:
            if "face_embedding" in d and d["face_embedding"] is not None:
                face_list.append(d["face_embedding"])
            else:
                face_list.append([0.0] * 512)
        face_matrix = np.array(face_list, dtype=np.float64)
        
        return ids, names, matrix, face_matrix


# ── Activity log store ────────────────────────────────────────────────


def _activity_collection_validator():
    """JSON schema validator for activity log documents."""
    return {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["person_id", "name", "action", "confidence", "timestamp", "node_id"],
            "additionalProperties": False,
            "properties": {
                "_id": {"bsonType": "objectId"},
                "person_id": {"bsonType": "string"},  # "unknown" or specific person_id
                "name": {"bsonType": "string"},       # "Unknown" or specific name
                "action": {"bsonType": "string"},
                "confidence": {"bsonType": "double"},
                "timestamp": {"bsonType": "date"},
                "node_id": {"bsonType": "string"},
            },
        }
    }


class ActivityStore:
    """MongoDB-backed store for person activity records."""

    def __init__(
        self,
        mongo_uri: str | None = None,
        db_name: str | None = None,
        collection_name: str = "activity_logs",
    ):
        self.mongo_uri = mongo_uri or os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.db_name = db_name or os.getenv("MONGO_DB_NAME", "hivemind")
        self.collection_name = collection_name

        self.client = MongoClient(
            self.mongo_uri,
            serverSelectionTimeoutMS=int(os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "3000")),
        )
        self.db = self.client[self.db_name]
        self.collection = self._ensure_collection()
        self.session_collection = self.db["activity_sessions"]
        self._ensure_indexes()
        logger.info(
            "ActivityStore ready (db=%s, collection=%s, sessions=activity_sessions)",
            self.db_name,
            self.collection_name,
        )

    def _ensure_collection(self):
        validator = _activity_collection_validator()
        try:
            self.db.create_collection(
                self.collection_name,
                validator=validator,
                validationLevel="strict",
                validationAction="error",
            )
            logger.info("Created Mongo collection %s with schema validation", self.collection_name)
        except CollectionInvalid:
            pass

        try:
            self.db.command(
                {
                    "collMod": self.collection_name,
                    "validator": validator,
                    "validationLevel": "strict",
                    "validationAction": "error",
                }
            )
        except PyMongoError as exc:
            logger.warning("Could not enforce collection validator via collMod: %s", exc)

        return self.db[self.collection_name]

    def _ensure_indexes(self):
        try:
            self.collection.create_index([("person_id", ASCENDING)], name="idx_activity_person_id")
            self.collection.create_index([("timestamp", ASCENDING)], name="idx_activity_timestamp")
            self.collection.create_index([("node_id", ASCENDING)], name="idx_activity_node_id")
            
            # Indexes for activity sessions
            self.session_collection.create_index([("person_id", ASCENDING)], name="idx_sess_person_id")
            self.session_collection.create_index([("start_time", DESCENDING)], name="idx_sess_start_time_desc")
            self.session_collection.create_index([("end_time", ASCENDING)], name="idx_sess_end_time")
        except PyMongoError as e:
            logger.warning("Index creation issue (likely already exists): %s", e)

    @staticmethod
    def _to_ist(dt: datetime) -> datetime:
        from datetime import timezone
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(IST)

    def _serialize(self, doc) -> dict:
        return {
            "person_id": doc["person_id"],
            "name": doc["name"],
            "action": doc["action"],
            "confidence": doc.get("confidence", 0.0),
            "timestamp": self._to_ist(doc["timestamp"]).isoformat() if "timestamp" in doc else None,
            "node_id": doc.get("node_id"),
        }

    def log_activity(self, person_id: str, name: str, action: str, confidence: float, node_id: str):
        """Insert a new activity record."""
        doc = {
            "person_id": person_id,
            "name": name,
            "action": action,
            "confidence": float(confidence),
            "timestamp": now_ist(),
            "node_id": node_id,
        }
        self.collection.insert_one(doc)
        return doc

    def get_latest(self, limit: int = 10) -> list[dict]:
        """Return the N most recent activity records."""
        docs = self.collection.find(
            sort=[("timestamp", -1)],
            limit=limit,
        )
        return [self._serialize(doc) for doc in docs]

    def get_person_activity(self, person_id: str, limit: int = 50) -> list[dict]:
        """Return recent activities for a specific person."""
        docs = self.collection.find(
            {"person_id": person_id},
            sort=[("timestamp", -1)],
            limit=limit,
        )
        return [self._serialize(doc) for doc in docs]

    def update_session(self, person_id: str, name: str, action: str, node_id: str):
        """Update or create an activity session for duration tracking."""
        now = now_ist()
        last_session = self.session_collection.find_one(
            {"person_id": person_id},
            sort=[("last_seen", -1)]
        )

        if last_session:
            last_seen = self._to_ist(last_session["last_seen"])
            if last_session["action"] == action:
                # If seen within last 60s, just update last_seen
                if (now - last_seen).total_seconds() < 60:
                    self.session_collection.update_one(
                        {"_id": last_session["_id"]},
                        {"$set": {"last_seen": now}}
                    )
                    return
                else:
                    # Stale session, close it and start new one
                    duration = (last_seen - self._to_ist(last_session["start_time"])).total_seconds()
                    self.session_collection.update_one(
                        {"_id": last_session["_id"]},
                        {"$set": {"end_time": last_seen, "duration_seconds": duration}}
                    )
            else:
                # Action changed, close old session
                duration = (last_seen - self._to_ist(last_session["start_time"])).total_seconds()
                self.session_collection.update_one(
                    {"_id": last_session["_id"]},
                    {"$set": {"end_time": last_seen, "duration_seconds": duration}}
                )

        # Start new session
        self.session_collection.insert_one({
            "person_id": person_id,
            "name": name,
            "action": action,
            "start_time": now,
            "last_seen": now,
            "end_time": None,
            "duration_seconds": 0,
            "node_id": node_id
        })

    def get_person_activity_report(self, person_id: str):
        """Aggregate session data for total time and timeline."""
        now = now_ist()
        from datetime import timedelta
        stale_threshold = now - timedelta(minutes=2)
        
        # Close stale sessions
        self.session_collection.update_many(
            {"person_id": person_id, "end_time": None, "last_seen": {"$lt": stale_threshold}},
            {"$set": {"end_time": now, "duration_seconds": 0}}
        )

        pipeline = [
            {"$match": {"person_id": person_id}},
            {"$group": {
                "_id": "$action",
                "total_seconds": {"$sum": "$duration_seconds"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"total_seconds": -1}}
        ]
        aggregates = list(self.session_collection.aggregate(pipeline))
        
        # Include ongoing session in summary
        current = self.session_collection.find_one({"person_id": person_id, "end_time": None}, sort=[("start_time", -1)])
        if current:
            dur = (now - self._to_ist(current["start_time"])).total_seconds()
            found = False
            for agg in aggregates:
                if agg["_id"] == current["action"]:
                    agg["total_seconds"] += dur
                    found = True
                    break
            if not found:
                aggregates.append({"_id": current["action"], "total_seconds": dur, "count": 1})

        timeline = list(self.session_collection.find({"person_id": person_id}, sort=[("start_time", -1)], limit=20))
        return {
            "summary": [{"action": a["_id"], "total_seconds": a["total_seconds"], "count": a["count"]} for a in aggregates],
            "timeline": [{
                "action": s["action"],
                "start": self._to_ist(s["start_time"]).isoformat(),
                "end": self._to_ist(s["end_time"]).isoformat() if s["end_time"] else None,
                "duration": s["duration_seconds"] if s["end_time"] else (now - self._to_ist(s["start_time"])).total_seconds()
            } for s in timeline]
        }

    def get_global_activity_summary(self):
        """Aggregate session data for all persons for today."""
        now = now_ist()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        pipeline = [
            {"$match": {"start_time": {"$gte": start_of_day}}},
            # Stage 1: Group by person and action to sum seconds per action
            {"$group": {
                "_id": {"person_id": "$person_id", "action": "$action"},
                "name": {"$first": "$name"},
                "action_seconds": {"$sum": "$duration_seconds"},
                "first_seen": {"$min": "$start_time"},
                "last_seen": {"$max": "$last_seen"},
                "nodes": {"$addToSet": "$node_id"}
            }},
            # Stage 2: Group by person to combine actions into a list
            {"$group": {
                "_id": "$_id.person_id",
                "name": {"$first": "$name"},
                "total_seconds": {"$sum": "$action_seconds"},
                "first_seen": {"$min": "$first_seen"},
                "last_seen": {"$max": "$last_seen"},
                "nodes": {"$push": "$nodes"},
                "actions": {"$push": {
                    "action": "$_id.action",
                    "seconds": "$action_seconds"
                }}
            }},
            # Stage 3: Flatten and deduplicate nodes (handled in Python)
            {"$sort": {"total_seconds": -1}}
        ]
        results = list(self.session_collection.aggregate(pipeline))
        # Flatten node lists and deduplicate nodes in Python
        for r in results:
            flat = []
            for sub in r.get("nodes", []):
                flat.extend(sub)
            r["nodes"] = list(set(flat))
        
        # Ongoing sessions
        ongoing = list(self.session_collection.find({"end_time": None}))
        for sess in ongoing:
            # Normalize to IST before comparing with start_of_day (which is aware)
            ist_start = self._to_ist(sess["start_time"])
            if ist_start < start_of_day: continue
            
            p_id = sess["person_id"]
            name = sess["name"]
            action = sess["action"]
            node_id = sess["node_id"]
            
            # Use aware datetimes for everything
            sess_start = self._to_ist(sess["start_time"])
            sess_last = self._to_ist(sess["last_seen"])
            duration = (now - sess_start).total_seconds()
            
            found = False
            for res in results:
                if res["_id"] == p_id:
                    res["total_seconds"] += duration
                    # Both must be aware
                    res_last = self._to_ist(res.get("last_seen", sess_last))
                    res["last_seen"] = max(res_last, sess_last)
                    if "nodes" not in res: res["nodes"] = []
                    if node_id not in res["nodes"]:
                        res["nodes"].append(node_id)
                    
                    if "actions" not in res: res["actions"] = []
                    # Add to actions list for distribution
                    found_action = False
                    for a in res["actions"]:
                        if a["action"] == action:
                            a["seconds"] += duration
                            found_action = True
                            break
                    if not found_action:
                        res["actions"].append({"action": action, "seconds": duration})
                    found = True
                    break
            if not found:
                results.append({
                    "_id": p_id,
                    "name": name,
                    "total_seconds": duration,
                    "first_seen": sess_start,
                    "last_seen": sess_last,
                    "nodes": [node_id],
                    "actions": [{"action": action, "seconds": duration}]
                })

        # Final serialization
        formatted = []
        for r in results:
            dist_map = {}
            for a in r["actions"]:
                dist_map[a["action"]] = dist_map.get(a["action"], 0) + a["seconds"]
            
            # Filter out None values to avoid sort errors
            zones = sorted(list(set(n for n in r.get("nodes", []) if n)))
            
            formatted.append({
                "person_id": r["_id"],
                "name": r["name"],
                "total_seconds": r["total_seconds"],
                "first_seen": self._to_ist(r["first_seen"]).isoformat(),
                "last_seen": self._to_ist(r["last_seen"]).isoformat(),
                "date": self._to_ist(r["first_seen"]).strftime("%Y-%m-%d"),
                "zones": zones,
                "activity_distribution": [
                    {"action": act, "seconds": sec} for act, sec in dist_map.items()
                ]
            })
        return formatted
