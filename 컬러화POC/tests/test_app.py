from __future__ import annotations

import json
import sqlite3
import tempfile
import time
import unittest
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

import numpy as np
import pydicom
from pydicom.dataset import FileDataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian, SecondaryCaptureImageStorage, generate_uid

import app as application


def registered_user_id(client) -> str:
    with client.session_transaction() as session:
        return str(session["colorizer_user_id"])


class DicomBatchAppTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        application.configure_data_directory(Path(self.temporary.name))
        application.app.config.update(TESTING=True, SECRET_KEY="test-secret")
        self.client = application.app.test_client()
        registered = self.client.post(
            "/api/auth/register",
            json={"username": "test-user", "password": "test-password"},
        )
        self.assertEqual(registered.status_code, 201, registered.data)
        self.sample = self.make_sample_dicom()

    @staticmethod
    def make_sample_dicom(
        *,
        duration_ms: int | None = None,
        counts: int | None = None,
        termination_condition: str | None = None,
    ) -> bytes:
        file_meta = FileMetaDataset()
        file_meta.MediaStorageSOPClassUID = SecondaryCaptureImageStorage
        file_meta.MediaStorageSOPInstanceUID = generate_uid()
        file_meta.TransferSyntaxUID = ExplicitVRLittleEndian
        dataset = FileDataset(None, {}, file_meta=file_meta, preamble=b"\0" * 128)
        dataset.SOPClassUID = file_meta.MediaStorageSOPClassUID
        dataset.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
        dataset.Modality = "OT"
        dataset.Rows = 80
        dataset.Columns = 80
        dataset.SamplesPerPixel = 1
        dataset.PhotometricInterpretation = "MONOCHROME2"
        dataset.BitsAllocated = 16
        dataset.BitsStored = 12
        dataset.HighBit = 11
        dataset.PixelRepresentation = 0
        if duration_ms is not None:
            dataset.ActualFrameDuration = duration_ms
        if counts is not None:
            dataset.CountsAccumulated = counts
        if termination_condition is not None:
            dataset.AcquisitionTerminationCondition = termination_condition
        dataset.PixelData = np.arange(80 * 80, dtype=np.uint16).reshape(80, 80).tobytes()
        output = BytesIO()
        dataset.save_as(output, enforce_file_format=True)
        return output.getvalue()

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def create_upload_batch(self):
        response = self.client.post(
            "/api/batches", json={"sourceType": "folder", "label": "test-folder"}
        )
        self.assertEqual(response.status_code, 201)
        return response.get_json()

    def upload(self, batch_id: str, files: list[tuple[bytes, str, str]]):
        response = self.client.post(
            f"/api/batches/{batch_id}/files",
            data={
                "files": [(BytesIO(data), filename) for data, filename, _path in files],
                "relativePaths": [path for _data, _filename, path in files],
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 200, response.data)
        return response.get_json()["items"]

    def roi_payload(self):
        return {
            "regions": [
                {
                    "id": "thyroid-polygon",
                    "shape": "polygon",
                    "label": "갑상샘",
                    "points": [[20, 18], [42, 16], [48, 43], [22, 46]],
                },
                {
                    "id": "lesion-ellipse",
                    "shape": "ellipse",
                    "label": "병변",
                    "cx": 55,
                    "cy": 55,
                    "rx": 7,
                    "ry": 9,
                },
            ],
            "colorSettingsSnapshot": {
                **application.DEFAULT_SETTINGS,
                "colormap": "turbo",
                "gamma": 1.6,
            },
        }

    def test_uploaded_item_and_grayscale_only_inversion(self):
        batch = self.create_upload_batch()
        item = self.upload(
            batch["batchId"], [(self.sample, "sample.dcm", "sample.dcm")]
        )[0]
        source = self.client.get(f"/api/items/{item['itemId']}").get_json()
        self.assertTrue(source["defaultInvert"])
        base = dict(application.DEFAULT_SETTINGS)
        default_payload = dict(base)
        default_payload.pop("invertGrayscale")
        default_render = self.client.post(
            f"/api/items/{item['itemId']}/render", json=default_payload
        ).get_json()
        normal = self.client.post(
            f"/api/items/{item['itemId']}/render",
            json={**base, "invertGrayscale": False},
        ).get_json()
        inverted = self.client.post(
            f"/api/items/{item['itemId']}/render",
            json={**base, "invertGrayscale": True},
        ).get_json()
        self.assertEqual(normal["color"], inverted["color"])
        self.assertNotEqual(normal["grayscale"], inverted["grayscale"])
        self.assertEqual(default_render["grayscale"], inverted["grayscale"])

    def test_multiple_upload_keeps_duplicates_and_marks_invalid_item(self):
        batch = self.create_upload_batch()
        items = self.upload(
            batch["batchId"],
            [
                (self.sample, "one.dcm", "root/study/one.dcm"),
                (self.sample, "copy.dcm", "root/study/one.dcm"),
                (b"not-a-dicom", "broken.dcm", "root/broken.dcm"),
            ],
        )
        self.assertEqual(items[0]["relativePath"], "root/study/one.dcm")
        self.assertEqual(items[1]["relativePath"], "root/study/one__2.dcm")
        self.assertEqual(items[0]["imageHash"], items[1]["imageHash"])
        self.assertIsNotNone(items[2]["error"])
        self.assertEqual(items[2]["acquisition"]["type"], "other")

        traversal = self.upload(
            batch["batchId"], [(self.sample, "escape.dcm", "../escape.dcm")]
        )[0]
        self.assertIsNone(traversal["itemId"])
        self.assertIsNotNone(traversal["error"])

    def test_acquisition_classification_priority_and_persistence(self):
        batch = self.create_upload_batch()
        time60 = self.make_sample_dicom(
            duration_ms=60_500,
            counts=200_000,
            termination_condition="TIME",
        )
        counts200000 = self.make_sample_dicom(
            duration_ms=45_000,
            counts=200_000,
            termination_condition="TIME",
        )
        items = self.upload(
            batch["batchId"],
            [
                (time60, "time60.dcm", "time60.dcm"),
                (counts200000, "counts.dcm", "counts.dcm"),
                (self.sample, "other.dcm", "other.dcm"),
            ],
        )

        self.assertEqual(
            items[0]["acquisition"],
            {
                "type": "time60",
                "label": "60 sec",
                "durationMs": 60_500,
                "counts": 200_000,
                "terminationCondition": "TIME",
            },
        )
        self.assertEqual(items[1]["acquisition"]["type"], "counts200000")
        self.assertEqual(items[1]["acquisition"]["label"], "200,000")
        self.assertEqual(items[1]["acquisition"]["terminationCondition"], "TIME")
        self.assertEqual(items[2]["acquisition"]["type"], "other")
        self.assertIsNone(items[2]["acquisition"]["label"])

        with application._state_lock:
            application._batches.clear()
            application._items.clear()
        restored = self.client.get(f"/api/batches/{batch['batchId']}").get_json()["items"]
        self.assertEqual(restored[0]["acquisition"], items[0]["acquisition"])
        self.assertEqual(restored[1]["acquisition"], items[1]["acquisition"])

    def test_existing_item_acquisition_is_backfilled_from_stored_dicom(self):
        batch = self.create_upload_batch()
        time60 = self.make_sample_dicom(
            duration_ms=60_000,
            counts=150_000,
            termination_condition="TIME",
        )
        item = self.upload(
            batch["batchId"], [(time60, "legacy.dcm", "legacy.dcm")]
        )[0]

        with sqlite3.connect(application.DATABASE_PATH) as connection:
            connection.execute(
                "UPDATE items SET acquisition_json = NULL WHERE id = ?",
                (item["itemId"],),
            )
        with application._state_lock:
            application._batches.clear()
            application._items.clear()

        result = application.backfill_missing_acquisition_summaries()
        self.assertEqual(result, {"missing": 1, "updated": 1, "skipped": 0})

        restored = self.client.get(f"/api/batches/{batch['batchId']}").get_json()["items"]
        self.assertEqual(restored[0]["acquisition"]["type"], "time60")
        self.assertEqual(restored[0]["acquisition"]["label"], "60 sec")

    def test_image_duplicates_ignore_unrelated_metadata_and_can_be_removed(self):
        dataset = pydicom.dcmread(BytesIO(self.sample), force=True)
        dataset.PatientName = "ANONYMIZED^COPY"
        modified = BytesIO()
        dataset.save_as(modified)

        batch = self.create_upload_batch()
        items = self.upload(
            batch["batchId"],
            [
                (self.sample, "original.dcm", "original.dcm"),
                (modified.getvalue(), "anonymous.dcm", "anonymous.dcm"),
            ],
        )
        self.assertNotEqual(items[0]["contentHash"], items[1]["contentHash"])
        self.assertEqual(items[0]["imageHash"], items[1]["imageHash"])

        duplicate_path = application._items[items[1]["itemId"]].source_path
        removed = self.client.post(
            f"/api/batches/{batch['batchId']}/remove-items",
            json={"itemIds": [items[1]["itemId"]]},
        )
        self.assertEqual(removed.status_code, 200, removed.data)
        self.assertEqual(removed.get_json()["removedCount"], 1)
        self.assertEqual(removed.get_json()["itemCount"], 1)
        self.assertFalse(duplicate_path.exists())

    def test_large_file_list_ingestion(self):
        batch = self.create_upload_batch()
        files = [
            (self.sample, f"image-{index:03d}.dcm", f"study/image-{index:03d}.dcm")
            for index in range(120)
        ]
        items = self.upload(batch["batchId"], files)
        self.assertEqual(len(items), 120)
        self.assertTrue(all(item["itemId"] for item in items))

    def test_saved_settings_restore_for_same_content_hash(self):
        first_batch = self.create_upload_batch()
        first = self.upload(
            first_batch["batchId"], [(self.sample, "first.dcm", "first.dcm")]
        )[0]
        settings = {**application.DEFAULT_SETTINGS, "colormap": "turbo", "gamma": 1.6}
        saved = self.client.put(
            f"/api/items/{first['itemId']}/settings", json=settings
        )
        self.assertEqual(saved.status_code, 200)
        stored = application.store.get_settings(
            registered_user_id(self.client), first["contentHash"]
        )
        self.assertEqual(stored["colormap"], "turbo")

        second_batch = self.create_upload_batch()
        second = self.upload(
            second_batch["batchId"], [(self.sample, "renamed.dcm", "other/renamed.dcm")]
        )[0]
        self.assertEqual(second["contentHash"], first["contentHash"])
        self.assertEqual(second["savedSettings"]["colormap"], "turbo")
        self.assertEqual(second["savedSettings"]["gamma"], 1.6)

    def test_account_ownership_and_persistent_batch_restore(self):
        batch = self.create_upload_batch()
        item = self.upload(
            batch["batchId"], [(self.sample, "persisted.dcm", "persisted.dcm")]
        )[0]
        settings = {**application.DEFAULT_SETTINGS, "colormap": "turbo"}
        self.assertEqual(
            self.client.put(
                f"/api/items/{item['itemId']}/settings", json=settings
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.put(
                f"/api/items/{item['itemId']}/annotations", json=self.roi_payload()
            ).status_code,
            200,
        )

        anonymous = application.app.test_client()
        self.assertEqual(anonymous.get("/api/batches").status_code, 401)
        second_user = application.app.test_client()
        self.assertEqual(
            second_user.post(
                "/api/auth/register",
                json={"username": "another-user", "password": "another-password"},
            ).status_code,
            201,
        )
        self.assertEqual(second_user.get("/api/batches").get_json()["batches"], [])
        self.assertEqual(
            second_user.get(f"/api/batches/{batch['batchId']}").status_code, 400
        )

        with application._state_lock:
            application._batches.clear()
            application._items.clear()
            application._image_cache.clear()
        restored_client = application.app.test_client()
        self.assertEqual(
            restored_client.post(
                "/api/auth/login",
                json={"username": "test-user", "password": "test-password"},
            ).status_code,
            200,
        )
        batches = restored_client.get("/api/batches").get_json()["batches"]
        self.assertEqual(batches[0]["batchId"], batch["batchId"])
        restored_batch = restored_client.get(
            f"/api/batches/{batch['batchId']}"
        ).get_json()
        self.assertEqual(restored_batch["items"][0]["savedSettings"]["colormap"], "turbo")
        restored_annotations = restored_client.get(
            f"/api/items/{item['itemId']}/annotations"
        ).get_json()
        self.assertEqual(len(restored_annotations["regions"]), 2)

    def test_roi_annotations_persist_by_hash_and_reject_invalid_regions(self):
        first_batch = self.create_upload_batch()
        first = self.upload(
            first_batch["batchId"], [(self.sample, "first.dcm", "first.dcm")]
        )[0]
        empty = self.client.get(f"/api/items/{first['itemId']}/annotations")
        self.assertEqual(empty.status_code, 200)
        self.assertEqual(empty.get_json()["regions"], [])
        self.assertEqual(empty.get_json()["labels"], ["갑상샘", "병변", "배경", "기타"])

        saved = self.client.put(
            f"/api/items/{first['itemId']}/annotations", json=self.roi_payload()
        )
        self.assertEqual(saved.status_code, 200, saved.data)
        self.assertEqual(saved.get_json()["roiCount"], 2)
        self.assertIsNone(
            self.client.get(f"/api/items/{first['itemId']}").get_json()["savedSettings"]
        )
        self.assertIsNotNone(
            application.store.get_annotations(
                registered_user_id(self.client), first["contentHash"]
            )
        )

        invalid = self.roi_payload()
        invalid["regions"][0]["label"] = "허용되지 않은 라벨"
        rejected = self.client.put(
            f"/api/items/{first['itemId']}/annotations", json=invalid
        )
        self.assertEqual(rejected.status_code, 400)
        still_saved = self.client.get(f"/api/items/{first['itemId']}/annotations").get_json()
        self.assertEqual(len(still_saved["regions"]), 2)

        invalid_coordinate = self.roi_payload()
        invalid_coordinate["regions"][0]["points"][0][0] = 80
        rejected_coordinate = self.client.put(
            f"/api/items/{first['itemId']}/annotations", json=invalid_coordinate
        )
        self.assertEqual(rejected_coordinate.status_code, 400)

        second_batch = self.create_upload_batch()
        second = self.upload(
            second_batch["batchId"], [(self.sample, "renamed.dcm", "other/renamed.dcm")]
        )[0]
        self.assertEqual(second["contentHash"], first["contentHash"])
        self.assertEqual(second["roiCount"], 2)
        restored = self.client.get(f"/api/items/{second['itemId']}/annotations").get_json()
        self.assertEqual(restored["regions"], saved.get_json()["regions"])
        cleared = self.client.put(
            f"/api/items/{second['itemId']}/annotations",
            json={
                "regions": [],
                "colorSettingsSnapshot": application.DEFAULT_SETTINGS,
            },
        )
        self.assertEqual(cleared.status_code, 200)
        self.assertEqual(cleared.get_json()["roiCount"], 0)
        self.assertIsNone(
            application.store.get_annotations(
                registered_user_id(self.client), first["contentHash"]
            )
        )

    def test_individual_via_json_and_batch_roi_package(self):
        batch = self.create_upload_batch()
        items = self.upload(
            batch["batchId"],
            [
                (self.sample, "image.dcm", "study/image.dcm"),
                (self.sample, "copy.dcm", "other/image.dcm"),
            ],
        )
        save_response = self.client.put(
            f"/api/items/{items[0]['itemId']}/annotations", json=self.roi_payload()
        )
        self.assertEqual(save_response.status_code, 200)

        via_response = self.client.get(
            f"/api/items/{items[0]['itemId']}/annotations/via"
        )
        self.assertEqual(via_response.status_code, 200)
        self.assertEqual(via_response.mimetype, "application/json")
        self.assertIn("image_roi_via.json", via_response.headers["Content-Disposition"])
        via_data = json.loads(via_response.data)
        self.assertEqual(len(via_data), 1)
        individual_metadata = next(iter(via_data.values()))
        self.assertEqual(individual_metadata["filename"], "image_colored.png")
        self.assertGreater(individual_metadata["size"], 0)
        self.assertEqual(
            individual_metadata["regions"][0]["shape_attributes"]["name"], "polygon"
        )
        self.assertEqual(
            individual_metadata["regions"][1]["shape_attributes"]["name"], "ellipse"
        )
        self.assertEqual(
            individual_metadata["regions"][0]["region_attributes"]["label"], "갑상샘"
        )

        job_response = self.client.post(
            "/api/export-jobs",
            json={"batchId": batch["batchId"], "jobType": "via"},
        )
        self.assertEqual(job_response.status_code, 202, job_response.data)
        created = job_response.get_json()
        self.assertEqual(created["jobType"], "via")
        self.assertEqual(created["format"], "VIA")
        job_id = created["jobId"]
        for _ in range(200):
            job = self.client.get(f"/api/export-jobs/{job_id}").get_json()
            if job["status"] not in {"queued", "running"}:
                break
            time.sleep(0.02)
        self.assertEqual(job["status"], "completed", job)
        result = self.client.get(f"/api/export-jobs/{job_id}/download")
        self.assertEqual(result.status_code, 200)
        self.assertIn("roi_via.zip", result.headers["Content-Disposition"])
        with ZipFile(BytesIO(result.data)) as archive:
            names = archive.namelist()
            self.assertIn("_via_region_data.json", names)
            self.assertIn("roi_manifest.json", names)
            image_names = [name for name in names if name.startswith("images/")]
            self.assertEqual(len(image_names), 2)
            self.assertTrue(all(name.endswith("_colored.png") for name in image_names))
            via_batch = json.loads(archive.read("_via_region_data.json"))
            manifest = json.loads(archive.read("roi_manifest.json"))
            self.assertEqual(len(via_batch), 2)
            self.assertEqual(len(manifest["items"]), 2)
            for entry in manifest["items"]:
                image_bytes = archive.read(f"images/{entry['imageFilename']}")
                metadata = next(
                    value for value in via_batch.values()
                    if value["filename"] == entry["imageFilename"]
                )
                self.assertEqual(metadata["size"], len(image_bytes))
        result.close()

    def test_roi_labels_can_be_added_and_renamed_with_saved_regions_migrated(self):
        batch = self.create_upload_batch()
        item = self.upload(
            batch["batchId"], [(self.sample, "labels.dcm", "labels.dcm")]
        )[0]
        saved = self.client.put(
            f"/api/items/{item['itemId']}/annotations", json=self.roi_payload()
        )
        self.assertEqual(saved.status_code, 200)

        added = self.client.post("/api/roi-labels", json={"name": "림프절"})
        self.assertEqual(added.status_code, 201, added.data)
        self.assertIn("림프절", added.get_json()["labels"])
        duplicate = self.client.post("/api/roi-labels", json={"name": " 림프절 "})
        self.assertEqual(duplicate.status_code, 400)

        renamed = self.client.put(
            "/api/roi-labels",
            json={"oldName": "갑상샘", "newName": "갑상선"},
        )
        self.assertEqual(renamed.status_code, 200, renamed.data)
        self.assertEqual(renamed.get_json()["renamedRegionCount"], 1)
        self.assertIn("갑상선", renamed.get_json()["labels"])
        self.assertNotIn("갑상샘", renamed.get_json()["labels"])

        restored = self.client.get(f"/api/items/{item['itemId']}/annotations").get_json()
        self.assertEqual(restored["regions"][0]["label"], "갑상선")
        self.assertIn("림프절", restored["labels"])
        persisted_labels = self.client.get("/api/roi-labels").get_json()["labels"]
        self.assertIn("갑상선", persisted_labels)
        self.assertIn("림프절", persisted_labels)

    def test_individual_and_background_batch_downloads(self):
        batch = self.create_upload_batch()
        items = self.upload(
            batch["batchId"],
            [
                (self.sample, "image.dcm", "series/image.dcm"),
                (self.sample, "single.dcm", "single.dcm"),
            ],
        )
        settings = dict(application.DEFAULT_SETTINGS)
        individual = self.client.post(
            f"/api/items/{items[0]['itemId']}/download", json=settings
        )
        self.assertEqual(individual.status_code, 200)
        self.assertEqual(individual.mimetype, "image/png")
        self.assertIn("image_colored.png", individual.headers["Content-Disposition"])
        individual.close()

        jpg_settings = {**settings, "format": "JPG", "jpegQuality": 82}
        individual_jpg = self.client.post(
            f"/api/items/{items[0]['itemId']}/download", json=jpg_settings
        )
        self.assertEqual(individual_jpg.status_code, 200)
        self.assertEqual(individual_jpg.mimetype, "image/jpeg")
        self.assertIn("image_colored.jpg", individual_jpg.headers["Content-Disposition"])
        individual_jpg.close()

        for item in items:
            response = self.client.put(
                f"/api/items/{item['itemId']}/settings", json=jpg_settings
            )
            self.assertEqual(response.status_code, 200)
        job_response = self.client.post(
            "/api/export-jobs",
            json={
                "batchId": batch["batchId"],
                "scope": "saved",
                "format": "PNG",
                "jpegQuality": 77,
                "fallbackSettings": settings,
            },
        )
        self.assertEqual(job_response.status_code, 202)
        created_job = job_response.get_json()
        self.assertEqual(created_job["format"], "PNG")
        self.assertEqual(created_job["jpegQuality"], 77)
        job_id = created_job["jobId"]
        for _ in range(200):
            job = self.client.get(f"/api/export-jobs/{job_id}").get_json()
            if job["status"] not in {"queued", "running"}:
                break
            time.sleep(0.02)
        self.assertEqual(job["status"], "completed", job)
        result = self.client.get(f"/api/export-jobs/{job_id}/download")
        self.assertEqual(result.status_code, 200)
        with ZipFile(BytesIO(result.data)) as archive:
            names = archive.namelist()
            self.assertIn("series/image.png", names)
            self.assertIn("single.png", names)
            self.assertFalse(any(name.endswith(".jpg") for name in names))
        result.close()

        jpg_job_response = self.client.post(
            "/api/export-jobs",
            json={
                "batchId": batch["batchId"],
                "scope": "all",
                "format": "JPG",
                "jpegQuality": 63,
                "fallbackSettings": settings,
            },
        )
        self.assertEqual(jpg_job_response.status_code, 202)
        jpg_job_id = jpg_job_response.get_json()["jobId"]
        for _ in range(200):
            jpg_job = self.client.get(f"/api/export-jobs/{jpg_job_id}").get_json()
            if jpg_job["status"] not in {"queued", "running"}:
                break
            time.sleep(0.02)
        self.assertEqual(jpg_job["status"], "completed", jpg_job)
        self.assertEqual(jpg_job["format"], "JPG")
        self.assertEqual(jpg_job["jpegQuality"], 63)
        jpg_result = self.client.get(f"/api/export-jobs/{jpg_job_id}/download")
        self.assertEqual(jpg_result.status_code, 200)
        self.assertIn("converted_jpg.zip", jpg_result.headers["Content-Disposition"])
        with ZipFile(BytesIO(jpg_result.data)) as archive:
            names = archive.namelist()
            self.assertIn("series/image.jpg", names)
            self.assertIn("single.jpg", names)
            self.assertFalse(any(name.endswith(".png") for name in names))
        jpg_result.close()

    def test_page_uses_action_level_png_and_jpg_exports(self):
        page = self.client.get("/")
        self.assertEqual(page.status_code, 200)
        html = page.get_data(as_text=True)
        self.assertIn('id="auth-form"', html)
        self.assertIn('id="saved-batches"', html)
        self.assertIn('id="logout"', html)
        self.assertIn('href="static/styles.css"', html)
        self.assertIn('src="static/app.js"', html)
        self.assertNotIn('href="/static/', html)
        self.assertIn('id="start-batch-png"', html)
        self.assertIn('id="start-batch-jpg"', html)
        self.assertIn('id="jpeg-quality"', html)
        self.assertIn('id="import-summary"', html)
        self.assertIn('id="acquisition-filter"', html)
        self.assertIn('id="batch-scope-help"', html)
        self.assertIn('id="batch-scope-help-text"', html)
        self.assertIn('class="header-metrics"', html)
        self.assertIn('id="metric-photometric"', html)
        self.assertIn('id="metric-bits"', html)
        self.assertIn('class="workspace-grid"', html)
        self.assertIn('class="main-settings-panel"', html)
        self.assertEqual(html.count('class="image-loading"'), 2)
        self.assertIn('id="save-settings"', html)
        self.assertIn('id="open-roi-editor"', html)
        self.assertIn('id="roi-modal"', html)
        self.assertIn('id="roi-canvas"', html)
        self.assertIn('id="add-roi-label"', html)
        self.assertIn('id="rename-roi-label"', html)
        self.assertIn('id="start-batch-via"', html)
        self.assertIn('전체 변환 다운로드 (이미지만)', html)
        self.assertIn('컬러화 이미지 + ROI 라벨 데이터', html)
        self.assertIn('이미지 + ROI 데이터 다운로드', html)
        self.assertIn('roi_geometry.js', html)
        self.assertLess(html.index('class="comparison-grid"'), html.index('class="main-settings-panel"'))
        self.assertNotIn('name="exportFormat"', html)
        self.assertNotIn('id="download-current"', html)
        self.assertNotIn('id="metadata-line"', html)

    def test_background_job_can_be_cancelled(self):
        batch = self.create_upload_batch()
        items = self.upload(
            batch["batchId"],
            [
                (self.sample, f"image-{index}.dcm", f"cancel/image-{index}.dcm")
                for index in range(12)
            ],
        )
        settings = dict(application.DEFAULT_SETTINGS)
        self.client.put(f"/api/items/{items[0]['itemId']}/settings", json=settings)

        original_render = application.render_color_image

        def slow_render(*args, **kwargs):
            time.sleep(0.01)
            return original_render(*args, **kwargs)

        application.render_color_image = slow_render
        try:
            response = self.client.post(
                "/api/export-jobs",
                json={
                    "batchId": batch["batchId"],
                    "scope": "saved",
                    "fallbackSettings": settings,
                },
            )
            job_id = response.get_json()["jobId"]
            self.client.delete(f"/api/export-jobs/{job_id}")
            for _ in range(200):
                job = self.client.get(f"/api/export-jobs/{job_id}").get_json()
                if job["status"] not in {"queued", "running"}:
                    break
                time.sleep(0.01)
            self.assertEqual(job["status"], "cancelled", job)
        finally:
            application.render_color_image = original_render


if __name__ == "__main__":
    unittest.main()
