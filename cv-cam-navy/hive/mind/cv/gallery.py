"""Shared-memory person gallery for cross-process re-ID matching.

Layout of the single SharedMemory block:
  [0:4]          int32   gallery count
  [4:8]          padding
  [8:8+N*64]     ids     (UTF-8, zero-padded to ID_MAX_BYTES each)
  [8+N*64:8+N*128] names (UTF-8, zero-padded to NAME_MAX_BYTES each)
  [8+N*128:]     float64 embeddings (MAX_GALLERY_SIZE * EMBEDDING_DIM)
"""

from __future__ import annotations

import logging
import multiprocessing
import struct
from multiprocessing import shared_memory

import numpy as np

logger = logging.getLogger(__name__)

MAX_GALLERY_SIZE = 200
EMBEDDING_DIM = 512
NAME_MAX_BYTES = 64
ID_MAX_BYTES = 64

_HEADER_BYTES = 8  # 4-byte int32 count + 4 bytes padding
_IDS_BYTES = MAX_GALLERY_SIZE * ID_MAX_BYTES
_NAMES_BYTES = MAX_GALLERY_SIZE * NAME_MAX_BYTES
_EMB_BYTES = MAX_GALLERY_SIZE * EMBEDDING_DIM * 8  # float64
_TOTAL_BYTES = _HEADER_BYTES + _IDS_BYTES + _NAMES_BYTES + _EMB_BYTES * 2

SHM_GALLERY_NAME = "hivemind_gallery_v4"


class GallerySharedMemory:
    """Read/write a person gallery (ids + names + embeddings) via shared memory."""

    def __init__(
        self,
        create: bool = False,
        shm_name: str = SHM_GALLERY_NAME,
        lock: multiprocessing.Lock | None = None,
    ):
        self.lock = lock or multiprocessing.Lock()

        if create:
            # On Windows, we must ensure any stale block is fully unlinked before re-creating.
            try:
                stale = shared_memory.SharedMemory(name=shm_name, create=False)
                stale.close()
                stale.unlink()
                logger.info("Cleaned up stale shared memory: %s", shm_name)
            except (FileNotFoundError, PermissionError, OSError):
                pass

            try:
                self._shm = shared_memory.SharedMemory(
                    name=shm_name, create=True, size=_TOTAL_BYTES,
                )
            except FileExistsError:
                # Fallback: if it still exists, just attach to it
                logger.warning("Shared memory %s already exists, attaching instead of creating.", shm_name)
                self._shm = shared_memory.SharedMemory(name=shm_name, create=False)
            
            self._shm.buf[:_TOTAL_BYTES] = b"\x00" * _TOTAL_BYTES
            logger.info(
                "Gallery shared memory ready (%s, %d bytes)", shm_name, _TOTAL_BYTES,
            )
        else:
            self._shm = shared_memory.SharedMemory(name=shm_name, create=False)

    @property
    def shm_name(self) -> str:
        return self._shm.name

    def write(self, ids: list[str], names: list[str], embeddings: np.ndarray | None, face_embeddings: np.ndarray | None = None) -> None:
        """Overwrite the gallery."""
        count = len(names)
        if count > MAX_GALLERY_SIZE:
            raise ValueError(f"Gallery exceeds max size ({count} > {MAX_GALLERY_SIZE})")

        with self.lock:
            buf = self._shm.buf

            struct.pack_into("<i", buf, 0, count)

            ids_start = _HEADER_BYTES
            for i in range(MAX_GALLERY_SIZE):
                offset = ids_start + i * ID_MAX_BYTES
                if i < count:
                    encoded = ids[i].encode("utf-8")[:ID_MAX_BYTES]
                    padded = encoded.ljust(ID_MAX_BYTES, b"\x00")
                else:
                    padded = b"\x00" * ID_MAX_BYTES
                buf[offset : offset + ID_MAX_BYTES] = padded

            names_start = _HEADER_BYTES + _IDS_BYTES
            for i in range(MAX_GALLERY_SIZE):
                offset = names_start + i * NAME_MAX_BYTES
                if i < count:
                    encoded = names[i].encode("utf-8")[:NAME_MAX_BYTES]
                    padded = encoded.ljust(NAME_MAX_BYTES, b"\x00")
                else:
                    padded = b"\x00" * NAME_MAX_BYTES
                buf[offset : offset + NAME_MAX_BYTES] = padded

            emb_start = _HEADER_BYTES + _IDS_BYTES + _NAMES_BYTES
            if count > 0 and embeddings is not None:
                flat = embeddings[:count].astype(np.float64).tobytes()
                buf[emb_start : emb_start + len(flat)] = flat

            face_emb_start = emb_start + _EMB_BYTES
            if count > 0 and face_embeddings is not None:
                flat_face = face_embeddings[:count].astype(np.float64).tobytes()
                buf[face_emb_start : face_emb_start + len(flat_face)] = flat_face

        logger.info("Gallery written to shared memory (%d person(s))", count)

    def read(self) -> tuple[list[str], list[str], np.ndarray | None, np.ndarray | None]:
        """Return a *copy* of the current gallery."""
        with self.lock:
            buf = self._shm.buf
            count = struct.unpack_from("<i", buf, 0)[0]

            if count <= 0:
                return [], [], None, None

            ids: list[str] = []
            ids_start = _HEADER_BYTES
            for i in range(count):
                offset = ids_start + i * ID_MAX_BYTES
                raw = bytes(buf[offset : offset + ID_MAX_BYTES])
                ids.append(raw.rstrip(b"\x00").decode("utf-8", errors="replace"))

            names: list[str] = []
            names_start = _HEADER_BYTES + _IDS_BYTES
            for i in range(count):
                offset = names_start + i * NAME_MAX_BYTES
                raw = bytes(buf[offset : offset + NAME_MAX_BYTES])
                names.append(raw.rstrip(b"\x00").decode("utf-8", errors="replace"))

            emb_start = _HEADER_BYTES + _IDS_BYTES + _NAMES_BYTES
            emb_bytes = count * EMBEDDING_DIM * 8
            matrix = np.frombuffer(
                bytes(buf[emb_start : emb_start + emb_bytes]),
                dtype=np.float64,
            ).reshape(count, EMBEDDING_DIM).copy()

            face_emb_start = _HEADER_BYTES + _IDS_BYTES + _NAMES_BYTES + _EMB_BYTES
            face_emb_bytes = count * EMBEDDING_DIM * 8
            face_matrix = np.frombuffer(
                bytes(buf[face_emb_start : face_emb_start + face_emb_bytes]),
                dtype=np.float64,
            ).reshape(count, EMBEDDING_DIM).copy()

        return ids, names, matrix, face_matrix

    def close(self) -> None:
        self._shm.close()

    def unlink(self) -> None:
        try:
            self._shm.unlink()
        except FileNotFoundError:
            pass
